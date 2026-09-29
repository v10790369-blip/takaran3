// Основная сцена.
import * as THREE from 'three';
import { CFG, COLORS } from './config.js';
import { EventBus, EventBusClass } from './core/EventBus.js';
import { Physics } from './core/Physics.js';
import { Sound } from './core/SoundManager.js';
import { SaveManager } from './core/SaveManager.js';
import { Vibration } from './core/Vibration.js';
import { VoiceManager, VOICE_SETS } from './core/VoiceManager.js';
import { Player } from './entities/Player.js';
import { Slipper } from './entities/Slipper.js';
import { Cat } from './entities/Cat.js';
import { PrankSpot } from './entities/PrankSpot.js';
import { SprayCloud } from './entities/SprayCloud.js';
import { Effects } from './entities/Effects.js';
import { Host } from './entities/Host.js';
import { Crumb } from './entities/Crumb.js';
import { Food } from './entities/Food.js';
import { Trap } from './entities/Trap.js';
import { Splat } from './entities/Splat.js';
import { Dust } from './entities/Dust.js';
import { TV } from './world/TV.js';
import { Wife } from './entities/Wife.js';
import { Dog } from './entities/Dog.js';
import { Rat } from './entities/Rat.js';
import { LivingRoom } from './levels/LivingRoom.js';
import { KitchenLevel } from './levels/KitchenLevel.js';
import { SkinManager } from './core/SkinManager.js';
import { EasterEggs } from './entities/EasterEggs.js';
import { Ants } from './entities/Ants.js';
import { Tutorial } from './ui/Tutorial.js';

const LEVELS = [LivingRoom, KitchenLevel];

export class GameScene {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    scene.userData = { time: 0, wave: 1, levelSize: 30 };
    this.scene.events = new EventBusClass();
    this._paused = false;
    this._camShake = { t: 0, dur: 1, i: 0 };
    this._pendingUpgrades = 0;
    this._upgradeShowing = false;
    this._inDen = false;
    this.currentLevelId = 0;
    this.tutorial = new Tutorial();
    this._emittedMoved = false;

    this.questActive = false;
    this.questCrumbsCollected = 0;
    this.questTarget = 5;

    // Голоса
    this.voiceHost = new VoiceManager(VOICE_SETS.host, { mode: 'cycle', cooldown: 4.5, volume: 0.75 });
    this.voiceWife = new VoiceManager(VOICE_SETS.wife, { mode: 'cycle', cooldown: 5.0, volume: 0.7 });
    this.voiceDog = new VoiceManager(VOICE_SETS.dog, { mode: 'cycle', cooldown: 3.0, volume: 0.7 });
    this.voiceCat = new VoiceManager(VOICE_SETS.cat, { mode: 'cycle', cooldown: 3.0, volume: 0.7 });
    this.voiceRat = new VoiceManager(VOICE_SETS.rat, { mode: 'cycle', cooldown: 6.0, volume: 0.75 });

    EventBus.on('ability:fake', () => this._useAbility('fake'));
    EventBus.on('ability:scream', () => this._useAbility('scream'));
    EventBus.on('ability:jump', () => this._useAbility('jump'));
  }

  _projectToScreen(worldX, worldY, worldZ) {
    const v = new THREE.Vector3(worldX, worldY, worldZ);
    v.project(this.camera);
    return {
      x: (v.x * 0.5 + 0.5) * window.innerWidth,
      y: (-v.y * 0.5 + 0.5) * window.innerHeight,
    };
  }

  start(input, levelId = 0) {
    this.input = input;
    this.currentLevelId = Math.min(levelId, LEVELS.length - 1);

    if (this.scene.events && this.scene.events.clear) this.scene.events.clear();
    while (this.scene.children.length) {
      const c = this.scene.children.pop();
      if (c.geometry) c.geometry.dispose?.();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    }

    this.physics = new Physics();

    const LevelClass = LEVELS[this.currentLevelId];
    this.level = new LevelClass(this.scene, this.physics);
    this.level.build();
    this.scene.userData.levelSize = this.level.size;

    this.level.setLightingPreset(CFG.LIGHTING_PRESETS[0]);

    this.dust = new Dust(this.scene, 70);

    // Пасхалки на стенах
    this.easterEggs = new EasterEggs(this.scene, this.level.size);

    // Муравьиная процессия (только на кухне)
    this.ants = null;
    if (this.currentLevelId === 1) {
      this.ants = new Ants(this.scene, {
        start: { x: -12, z: 10 },
        end: { x: 12, z: -8 },
      });
    }

    // Подписки на события новых систем
    this.scene.events.on('easteregg:found', (x, z) => {
      this.sram += 5;
      Sound.crumb?.(); Vibration.tap?.(30);
      this.effects.burst(x, 1.5, z, 0xffe066, 20, 4, 0.9, 0.9);
      EventBus.emit('banner', '🖼️ +5 СРАМА', '#ffe066');
      EventBus.emit('score', this.sram);
    });

    this.scene.events.on('fish:zoneout', () => {
      // Жора зависает — тормозим на 2 секунды
      this.player.makeInvulnerable(2);
      EventBus.emit('banner', '🐟 Так хочется в отпуск…', '#a8d8ff');
    });

    this.scene.events.on('ants:scattered', () => {
      // Все враги «дезориентированы» — обнуляем таймеры
      if (this.pet) this.pet.sleepTimer = 0;
      EventBus.emit('banner', '🐜 МУРАВЬИ В ПАНИКЕ!', '#f0c040');
      Sound.prank?.();
    });

    this.sram = 0;
    this.wave = 1;
    this.pranksDone = 0;
    this.over = false;
    this.won = false;
    this.exitOpen = false;
    this.sprays = [];
    this.slippers = [];
    this.crumbs = [];
    this.foods = [];
    this.traps = [];
    this.splats = [];

    const sp = this.level.getSpawnPos();
    this.player = new Player(this.scene, sp.x, sp.z);
    this.prankSpots = this.level.getPrankSpots().map(c => new PrankSpot(this.scene, c));

    // Питомец
    this.pet = null;
    const petPos = this.level.getPetPos();
    if (petPos) {
      if (this.currentLevelId === 0) {
        this.pet = new Cat(this.scene, this.physics, petPos);
        this.scene.events.on('cat:woke', () => {
          Sound.catMeow();
          this.voiceCat.play();
          this.host?.setState('alert', 2);
        });
      } else {
        this.pet = new Dog(this.scene, this.physics, petPos);
        this.scene.events.on('dog:bark', () => {
          Sound.catMeow();
          this.voiceDog.play();
        });
      }
    }

    // Хозяин / жена
    const hostPos = this.level.getHostPos();
    this.host = null;
    this.wife = null;
    if (hostPos) {
      if (this.currentLevelId === 0) {
        this.host = new Host(this.scene, hostPos, this.physics);   // ← физика для коллизий
      } else {
        this.wife = new Wife(this.scene, hostPos);
        this.scene.events.on('wife:knife-hit', () => {
          if (this._inDen) return;   // в норке — не бьёт
          this._damage('НОЖ!');
        });
        this.scene.events.on('wife:throw', () => this.voiceWife.play());
      }
    }

    // ТВ
    this.tv = null;
    const tvPos = this.level.getTVPos();
    if (tvPos) this.tv = new TV(this.scene, tvPos.x, tvPos.z, tvPos.rotY);

    // Крыса
    this.rat = null;
    const ratPos = this.level.getRatPos();
    if (ratPos) {
      this.rat = new Rat(this.scene, ratPos);
      this.scene.events.on('rat:dialog', () => this._openRatDialog());
      this.scene.events.on('rat:call', () => this.voiceRat.play());
    }

    this.questActive = false;
    this.questCrumbsCollected = 0;
    EventBus.emit('quest:hide');

    this.bossActive = false;
    this.effects = new Effects(this.scene);

    this.exitMesh = this._buildVent(this.level.getExitPos());
    this.exitMesh.visible = false;

    this.camera.position.set(sp.x, 22, sp.z + 14);
    this.camera.lookAt(sp.x, 0, sp.z);
    this.camera.rotation.z = 0;

    this._slipperTimer = 2.5;
    this._sprayTimer = 8;
    this._crumbTimer = 1.5;
    this._foodTimer = CFG.FOOD.SPAWN_INTERVAL;

    for (let i = 0; i < 5; i++) this._spawnCrumb();

    this.scene.events.on('slipper:landed', (x, z) => {
      Sound.slipperLand();
      this.effects.slipperLand(x, z);
      this._shakeCamera(0.15, 0.35);
    });
    this.scene.events.on('host:state', (s) => {
      if (s === 'scream') { Sound.hostScream(); EventBus.emit('host', '😱'); }
      else if (s === 'alert') { EventBus.emit('host', '😠'); }
      else if (s === 'frozen') { EventBus.emit('host', '😱'); }
      else { EventBus.emit('host', '😴'); }
    });

    // УДАР МУХОБОЙКИ
    this.scene.events.on('boss:swat', (bx, bz, hit) => {
      // "BOOM!" — визуально всегда
      this._pop3DText(bx, 2.5, bz, 'BOOM!', 0xffcc44, 1.2);
      this.effects.burst(bx, 0.3, bz, 0xffee66, 24, 7, 1.4, 0.8);
      this.effects.burst(bx, 0.5, bz, 0xff8844, 12, 4, 1.0, 0.6);
      Sound.damage();
      Vibration.hit();
      this._shakeCamera(0.35, 0.85);

      if (hit && !this._inDen) {
        this._damage('МУХОБОЙКА!', false, true);
      }
    });

    EventBus.emit('score', 0);
    EventBus.emit('hp', this.player.hp);
    EventBus.emit('wave', 1, 0);
    EventBus.emit('host', '😴');
    EventBus.emit('banner', `${this.level.getName()} · УРОВЕНЬ ${this.currentLevelId + 1}`, '#ffe066');
    EventBus.emit('ability:reset');

    this._paused = false;
    this._upgradeShowing = false;
    this._pendingUpgrades = 0;
    this._inDen = false;

    this.voiceHost.reset(); this.voiceWife.reset();
    this.voiceDog.reset(); this.voiceCat.reset(); this.voiceRat.reset();
    // Запускаем туториал уровня
    this._emittedMoved = false;
    this._startTutorialFor(this.currentLevelId);

    

    // Скин игрока — в самом конце, чтобы если что-то пойдёт не так,
    // игра уже была полностью собрана
    try {
      const stats = SaveManager.load();
      const skin = SkinManager.getSkin(stats.selectedSkin || 'default');
      this.player.applySkin(skin);
    } catch (e) {
      console.warn('Не удалось применить скин:', e);
    }
  }

  _startTutorialFor(levelId) {
    // ВРЕМЕННЫЙ ТЕСТ: сброс туториала принудительно при каждой загрузке
    // УДАЛИ эту строку потом, когда убедишься что всё работает!
    try { localStorage.removeItem('roach3d.tutorial.level1'); } catch { }
    try { localStorage.removeItem('roach3d.tutorial.level2'); } catch { }
    const stepsL1 = [
      // 1. Просто показываем джойстик и что делать
      { text: '', mode: 'joystick', duration: 3000 },
      { text: 'ТАП И ВЕДИ — ТАК ПОЛЗЁШЬ', duration: 2500 },
      // 2. Ведём к первой пакости
      { text: 'СТОЙ В КРУГЕ — ЭТО ПАКОСТЬ', worldTarget: { x: -9, z: -7 }, duration: 4000 },
      // 3. Сбор крошек
      { text: 'СОБИРАЙ КРОШКИ → СРАМ', duration: 3200 },
      // 4. Норка
      { text: 'НОРКА В СТЕНЕ — ТУТ БЕЗОПАСНО', worldTarget: { x: -12, z: -3 }, duration: 4000 },
      // 5. Финал
      { text: 'УДАЧИ, БРАТАН! 🐭', duration: 2500 },
    ];
    stepsL1._key = 'level1';

    const stepsL2 = [
      { text: '', mode: 'joystick', duration: 2500 },
      { text: 'ЭТО КУХНЯ. ТУТ ЖЕНА И СОБАКА', duration: 3500 },
      { text: 'ЖЕНА КИДАЕТ НОЖИ — УВОРАЧИВАЙСЯ', duration: 3500 },
      { text: 'НАЙДИ КРЫСУ У НОРКИ', worldTarget: { x: -11, z: 8 }, duration: 4000 },
      { text: 'ОНА ДАСТ ЗАДАНИЕ', duration: 3000 },
      { text: 'ПОШЁЛ ПАКОСТИТЬ! 🪳', duration: 2500 },
    ];
    stepsL2._key = 'level2';

    this.tutorial.start(levelId === 0 ? stepsL1 : stepsL2);
  }

  _buildVent(exitPos) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.6, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6, roughness: 0.4 })
    );
    frame.position.set(exitPos.x, 1.4, exitPos.z);
    g.add(frame);

    for (let i = 0; i < 4; i++) {
      const slit = new THREE.Mesh(
        new THREE.BoxGeometry(2.0, 0.12, 0.35),
        new THREE.MeshBasicMaterial({ color: 0x050505 })
      );
      slit.position.set(exitPos.x, 0.85 + i * 0.4, exitPos.z + 0.15);
      g.add(slit);
    }
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x7dff7d, transparent: true, opacity: 0.4 });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.0), glowMat);
    glow.position.set(exitPos.x, 1.4, exitPos.z - 0.2);
    glow.rotation.y = Math.PI;
    g.add(glow);
    this.exitGlow = glow;

    this.scene.add(g);
    return g;
  }

  // Плавающий текст в 3D (для "BOOM!")
  _pop3DText(x, y, z, text, color, scale = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 256);
    ctx.font = 'bold 140px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#000';
    ctx.strokeText(text, 256, 128);
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.fillText(text, 256, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({
      map: tex, transparent: true, depthWrite: false, depthTest: false
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    sprite.scale.set(2.2 * scale, 1.1 * scale, 1);
    sprite.renderOrder = 999;
    this.scene.add(sprite);

    const startTime = this.scene.userData.time;
    const duration = 0.9;
    const animate = () => {
      const elapsed = this.scene.userData.time - startTime;
      if (elapsed > duration) {
        this.scene.remove(sprite);
        tex.dispose();
        mat.dispose();
        return;
      }
      const p = elapsed / duration;
      sprite.position.y = y + p * 1.5;
      sprite.material.opacity = 1 - p;
      sprite.scale.setScalar((2.2 + p * 0.8) * scale);
      if (!this.over && !this.won) requestAnimationFrame(animate);
      else { this.scene.remove(sprite); tex.dispose(); mat.dispose(); }
    };
    requestAnimationFrame(animate);
  }

  _openRatDialog() {
    if (this.questActive) return;
    if (this.rat) this.rat.setPhase('dialog');
    this._paused = true;                    // ← пауза на время диалога
    EventBus.emit('dialog:open', {
      name: 'Крыса-барыга',
      portrait: '🐭',
      pages: [
        { text: 'Эй, таракан! Слышал про тебя. Говорят, ты ловкий.' },
        { text: 'У меня к тебе дельце. Хозяева совсем оборзели — жрать нечего.' },
        { text: 'Натаскай мне 5 крошек в норку — отсыплю срама, зауважаешь.' },
        { text: 'По рукам? Крошки по всей кухне валяются, ищи.', button: 'ПО РУКАМ!' },
      ],
      onDone: () => {
        this._paused = false;                // ← снимаем паузу
        this._startQuest();
      },
    });
  }

  _startQuest() {
    this.questActive = true;
    this.questCrumbsCollected = 0;
    this.questTarget = 5;
    EventBus.emit('quest:show', {
      icon: '🐭', title: 'ЗАКАЗ КРЫСЫ',
      desc: 'Принеси 5 крошек в норку',
      target: this.questTarget,
    });
    EventBus.emit('banner', '📜 НОВОЕ ЗАДАНИЕ!', '#ffe066');
    if (this.rat) this.rat.setPhase('questGiven');
  }

  update(dt) {
    if (!this.player || !this.level || !this.prankSpots) return;
    this.scene.userData.time += dt;
    // Туториал: первое движение
    

    this.voiceHost.update(dt);
    this.voiceWife.update(dt);
    this.voiceDog.update(dt);
    this.voiceCat.update(dt);
    this.voiceRat.update(dt);

    if (this.over || this.won) { this._updateCameraSmooth(dt); return; }
    if (this._paused) { this._updateCameraSmooth(dt); return; }

    // Игрок
    const dir = this.input.getDirection();
    this.player.move(dir, dt);
    this.physics.resolveCircle(this.player.pos, this.player.radius);
    this.physics.clampToBounds(this.player.pos, this.level.size / 2, this.player.radius);
    this.player.update(dt);

    if (this.player.isPoisoned) {
      if (this.player.poisonTick <= 0 && !this.player.isInvulnerable) {
        this.player.poisonTick = 1.0;
        this._damage('ЯД!', true);
      }
    }

    // Норка
    const denP = this.level.getDenPos();
    const denR = this.level.getDenRadius();
    const dDen = Math.hypot(this.player.pos.x - denP.x, this.player.pos.z - denP.z);
    const nowInDen = dDen < denR + 0.6;   // +0.6 — надёжнее скрывает в норке
    if (nowInDen && !this._inDen) {
      Sound.prank(); Vibration.prank();
      this.effects.burst(this.player.pos.x, 0.4, this.player.pos.z, 0x7dff7d, 16, 3, 0.8, 0.7);
      EventBus.emit('banner', '🏠 В НОРКЕ', '#7dff7d');
      this._inDen = true;
    } else if (!nowInDen && this._inDen) {
      this.effects.burst(this.player.pos.x, 0.4, this.player.pos.z, 0x7dff7d, 10, 2, 0.7, 0.5);
      this._inDen = false;
    }

    // Доставка еды
    if (this._inDen && this.player.carryingFood) {
      const food = this.player.carryingFood;
      const points = food.deliver();
      this.sram += points;
      food.destroy();
      this.player.carryingFood = null;
      const idx = this.foods.indexOf(food);
      if (idx >= 0) this.foods.splice(idx, 1);
      Sound.prank(); Vibration.win();
      this.effects.burst(this.player.pos.x, 0.6, this.player.pos.z, 0xffe066, 30, 6, 1.2, 1.2);
      EventBus.emit('banner', `🥟 ДОСТАВИЛ! +${points}`, '#ffe066');
      EventBus.emit('score', this.sram);
    }

    // Видимость
    let visible = true;
    if (this._inDen) visible = false;
    else if (this.player.invuln > 0 && !this.player.isRagdoll) {
      visible = Math.floor(this.scene.userData.time * 20) % 2 === 0;
    }
    this.player.mesh.visible = visible;

    // Пакости
    for (const s of this.prankSpots) if (s.update(dt, this.player)) this._doPrank(s);

    // Крошки
    this._crumbTimer -= dt;
    if (this._crumbTimer <= 0) {
      this._crumbTimer = 2 + Math.random() * 1.5;
      if (this.crumbs.length < 8) this._spawnCrumb();
    }
    for (let i = this.crumbs.length - 1; i >= 0; i--) {
      const c = this.crumbs[i];
      c.update(dt, this.player);
      if (this._circleHit(c.pos, c.radius, this.player.pos, this.player.radius)) {
        this.sram += 1;
        Sound.crumb(); Vibration.coin();
        this.effects.crumbs(c.pos.x, c.pos.z);
        EventBus.emit('score', this.sram);

        if (this.questActive) {
          this.questCrumbsCollected++;
          EventBus.emit('quest:update', this.questCrumbsCollected, this.questTarget);
          if (this.questCrumbsCollected >= this.questTarget) this._completeQuest();
        }

        c.destroy(); this.crumbs.splice(i, 1);
        continue;
      }
      if (c.isDead) { c.destroy(); this.crumbs.splice(i, 1); }
    }

    // Еда
    this._foodTimer -= dt;
    if (this._foodTimer <= 0) {
      this._foodTimer = CFG.FOOD.SPAWN_INTERVAL + Math.random() * 5;
      if (this.foods.length < CFG.FOOD.MAX_ON_FLOOR) this._spawnFood();
    }
    for (let i = this.foods.length - 1; i >= 0; i--) {
      const f = this.foods[i];
      if (f._dead) { this.foods.splice(i, 1); continue; }
      f.update(dt, this.player, this._inDen);
      if (f.carried && !this.player.carryingFood && !f._dead) {
        this.player.carryingFood = f;
        Sound.upgrade(); Vibration.tap(40);
        EventBus.emit('banner', '🥟 ВЗЯЛ! ТАЩИ В НОРКУ', '#ffe066');
      }
    }

    // Ловушки
    for (let i = this.traps.length - 1; i >= 0; i--) {
      const t = this.traps[i];
      const hit = t.update(dt, this.player);
      if (hit && !t.triggered && !this.player.isInvulnerable) {
        t.triggered = true; t.fadeTimer = 0.4;
        this._triggerTrap(t);
        t._destroyed = true;
        setTimeout(() => { t.destroy(); const idx = this.traps.indexOf(t); if (idx >= 0) this.traps.splice(idx, 1); }, 400);
      }
    }

    // Тапки (только в зале)
    if (this.currentLevelId === 0) {
      this._slipperTimer -= dt;
      if (this._slipperTimer <= 0) {
        this._slipperTimer = CFG.SLIPPER_SPAWN_INTERVAL + Math.random() * 1.5;
        this._trySpawnSlipper();
      }
      for (let i = this.slippers.length - 1; i >= 0; i--) {
        const s = this.slippers[i];
        s.update(dt);
        if (s.canHit() && !this._inDen &&
          this._circleHit(s.pos, s.radius, this.player.pos, this.player.radius)) {
          if (this.player.isFakingDead) {
            s.phase = 'landed'; s.landedTimer = CFG.SLIPPER_LANDED_TIME; s.pos.y = 0.3;
            continue;
          }
          s.destroy(); this.slippers.splice(i, 1);
          this._damage('ТАПОК!', false, true);
          continue;
        }
        if (s.isDead) { s.destroy(); this.slippers.splice(i, 1); }
      }
    }

    // Питомец — передаём флаг спрятанности
    if (this.pet) {
      this.pet.update(dt, this.player, this._inDen);
      if (!this._inDen && !this.player.isFakingDead && !this.player.isRagdoll &&
        this._circleHit(this.pet.pos, this.pet.radius, this.player.pos, this.player.radius))
        this._damage(this.currentLevelId === 0 ? 'КОТ!' : 'СОБАКА!');
    }

    // Жена — передаём флаг
    if (this.wife) this.wife.update(dt, this.player, this._inDen);

    // Крыса
    if (this.rat) this.rat.update(dt, this.player, this.currentLevelId);

    // Дихлофос
    this._sprayTimer -= dt;
    if (this._sprayTimer <= 0 && this.wave >= 3) {
      this._sprayTimer = 7 + Math.random() * 3;
      const x = (Math.random() - 0.5) * (this.level.size - 8);
      const z = (Math.random() - 0.5) * (this.level.size - 8);
      this.sprays.push(new SprayCloud(this.scene, x, z));
      Sound.spray();
    }
    for (let i = this.sprays.length - 1; i >= 0; i--) {
      const c = this.sprays[i];
      if (c.update(dt, this.player) && !this._inDen && !this.player.isRagdoll) {
        Sound.spray();
        this.effects.sprayHit(this.player.pos.x, 0.8, this.player.pos.z);
        this._damage('ДИХЛОФОС!');
      }
      if (c.isDead) { c.destroy(); this.sprays.splice(i, 1); }
    }

    // Мир
    if (this.host) this.host.update(dt, this.player);
    if (this.tv) this.tv.update(dt, this.player);
    this.level.update(dt, this.player, this.scene.userData.time);
    this.effects.update(dt);
    this.dust.update(dt);
    if (this.easterEggs) this.easterEggs.update(dt, this.player);
    if (this.ants && !this.ants.done) this.ants.update(dt, this.player);

    // Выход
    const exitP = this.level.getExitPos();
    if (this.exitOpen && !this.won) {
      const d = Math.hypot(this.player.pos.x - exitP.x, this.player.pos.z - exitP.z);
      if (d < 2.2) this._win();
      this.exitGlow.material.opacity = 0.3 + Math.sin(this.scene.userData.time * 4) * 0.2;
    }

    for (const id of ['fake', 'scream', 'jump']) {
      EventBus.emit('ability:cooldown', id, this.player.abilityCooldown[id], this.player.abilityMaxCd[id]);
    }
    // Туториал — обновление стрелки
    if (this.tutorial && this.tutorial.active) {
      const playerScr = this._projectToScreen(this.player.pos.x, 0.5, this.player.pos.z);
      let targetScr = null;
      if (this.tutorial._targetWorld) {
        targetScr = this._projectToScreen(
          this.tutorial._targetWorld.x,
          0.5,
          this.tutorial._targetWorld.z
        );
      }
      this.tutorial.setScreens(playerScr, targetScr);
    }
    this._updateCameraSmooth(dt);
  }

  _completeQuest() {
    this.questActive = false;
    this.sram += 25;
    EventBus.emit('score', this.sram);
    EventBus.emit('quest:hide');
    EventBus.emit('banner', '📜 ЗАКАЗ ВЫПОЛНЕН! +25', '#7dff7d');
    Sound.win(); Vibration.win();
    if (this.rat) {
      this.rat.setPhase('questDone');
      this.rat.showBubble('Красава, таракан!', 4);
      this.voiceRat.play();
    }
    const denP = this.level.getDenPos();
    this.effects.burst(denP.x + 1, 1.5, denP.z, 0xffe066, 40, 7, 1.3, 1.5);
  }

  _triggerTrap(trap) {
    if (trap.type === 'sticky') {
      this.player.applySticky(CFG.TRAPS.STICKY_DURATION);
      Sound.damage(); Vibration.hit();
      EventBus.emit('banner', '🩹 ЛИПКАЯ ЛЕНТА!', '#d8b040');
      this.effects.burst(trap.pos.x, 0.3, trap.pos.z, 0xd8b040, 18, 3, 0.8, 0.8);
    } else if (trap.type === 'glue') {
      this.player.applyGlue(CFG.GLUE.DURATION);
      Sound.spray(); Vibration.hit();
      EventBus.emit('banner', '🪤 КЛЕЙ! 2 СЕК', '#a08020');
      this.effects.burst(this.player.pos.x, 0.5, this.player.pos.z, 0xa08020, 26, 5, 1.1, 1.1);
      this._shakeCamera(0.35, 0.5);
    } else {
      this.player.applyPoison(CFG.TRAPS.POISON_DURATION);
      Sound.spray(); Vibration.hit();
      EventBus.emit('banner', '☠️ ОТРАВА!', '#4aa04a');
      this.effects.burst(trap.pos.x, 0.4, trap.pos.z, 0x40a040, 22, 4, 1.0, 1.0);
    }
  }

  _updateCameraSmooth(dt) {
    // Адаптивная камера: на портретных экранах (телефон) — ближе к игроку,
    // на ландшафтных (комп) — дальше, чтобы видеть больше кухни
    const aspect = window.innerWidth / window.innerHeight;
    const isPortrait = aspect < 1;

    // Чем уже экран — тем ближе камера
    // Портрет (аспект ~0.5): высота 14, отступ 5
    // Ландшафт (аспект >1.2): высота 22, отступ 8
    let camHeight = 22;
    let camOffset = 8;
    let lookAhead = 1;

    if (aspect < 1) {
      // Интерполяция от аспекта 1.2 (landscape) до 0.5 (портрет)
      const t = Math.max(0, Math.min(1, (1.2 - aspect) / 0.7));
      camHeight = 22 - t * 8;      // 22 → 14
      camOffset = 8 - t * 3;      // 8 → 5
      lookAhead = 1 - t * 0.4;     // смотрим чуть меньше вперёд
    }

    const targetX = this.player.pos.x;
    const targetZ = this.player.pos.z + camOffset;
    const targetY = camHeight;
    const k = 1 - Math.exp(-6 * dt);

    this.camera.position.x += (targetX - this.camera.position.x) * k;
    this.camera.position.y += (targetY - this.camera.position.y) * k;
    this.camera.position.z += (targetZ - this.camera.position.z) * k;

    if (this._camShake.t > 0) {
      this._camShake.t -= dt;
      const fade = Math.max(0, this._camShake.t / this._camShake.dur);
      const s = this._camShake.i * fade;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.camera.rotation.z += (Math.random() - 0.5) * s * 0.03;
    }
    this.camera.rotation.z *= 0.85;

    this.camera.lookAt(this.player.pos.x, 0, this.player.pos.z - lookAhead);
  }

  _shakeCamera(durSec, intensity) {
    if (this._camShake.t > 0) {
      this._camShake.i = Math.max(this._camShake.i, intensity);
      this._camShake.dur = Math.max(this._camShake.dur, durSec);
      this._camShake.t = Math.max(this._camShake.t, durSec);
    } else {
      this._camShake = { t: durSec, dur: durSec, i: intensity };
    }
  }

  _circleHit(aPos, aR, bPos, bR) {
    const dx = aPos.x - bPos.x, dz = aPos.z - bPos.z, r = aR + bR;
    return dx * dx + dz * dz < r * r;
  }

  _spawnCrumb() {
    const half = this.level.size / 2 - 2;
    let x, z, tries = 0;
    const hostPos = this.level.getHostPos();
    const denPos = this.level.getDenPos();
    do {
      x = (Math.random() - 0.5) * half * 1.8;
      z = (Math.random() - 0.5) * half * 1.8;
      tries++;
    } while (tries < 12 && (
      (hostPos && Math.hypot(x - hostPos.x, z - hostPos.z) < 4) ||
      Math.hypot(x - denPos.x, z - denPos.z) < this.level.getDenRadius() + 1
    ));
    this.crumbs.push(new Crumb(this.scene, x, z));
  }

  _spawnFood() {
    const half = this.level.size / 2 - 3;
    let x, z, tries = 0;
    const hostPos = this.level.getHostPos();
    const denPos = this.level.getDenPos();
    do {
      x = (Math.random() - 0.5) * half * 1.8;
      z = (Math.random() - 0.5) * half * 1.8;
      tries++;
    } while (tries < 12 && (
      (hostPos && Math.hypot(x - hostPos.x, z - hostPos.z) < 3) ||
      Math.hypot(x - denPos.x, z - denPos.z) < this.level.getDenRadius() + 1 ||
      Math.hypot(x, z) < 2
    ));
    this.foods.push(new Food(this.scene, x, z));
  }

  _spawnTrapsBetweenWaves() {
    const half = this.level.size / 2 - 3;
    const types = ['sticky', 'sticky', 'glue', 'poison'];
    for (let i = 0; i < CFG.TRAPS.SPAWN_BETWEEN_WAVES; i++) {
      let x, z, tries = 0;
      const hostPos = this.level.getHostPos();
      const denPos = this.level.getDenPos();
      do {
        x = (Math.random() - 0.5) * half * 1.8;
        z = (Math.random() - 0.5) * half * 1.8;
        tries++;
      } while (tries < 12 && (
        (hostPos && Math.hypot(x - hostPos.x, z - hostPos.z) < 4) ||
        Math.hypot(x - denPos.x, z - denPos.z) < this.level.getDenRadius() + 2 ||
        Math.hypot(x, z) < 2
      ));
      const type = types[Math.floor(Math.random() * types.length)];
      this.traps.push(new Trap(this.scene, x, z, type));
    }
  }

  _useAbility(id) {
    if (this.over || this.won || this._paused) return;
    if (id === 'fake') {
      if (this.player.tryUseFakeDeath()) {
        Sound.prank(); Vibration.prank();
        this.effects.burst(this.player.pos.x, 0.6, this.player.pos.z, 0xffffff, 20, 3, 0.8, 0.8);
        EventBus.emit('banner', '💀 ПРИТВОРИЛСЯ!', '#ffffff');
      }
    } else if (id === 'scream') {
      if (this.player.tryUseScream()) {
        Sound.hostScream(); Vibration.hit();
        if (this.host) this.host.freeze(3);
        this.sram += 5;
        EventBus.emit('score', this.sram);
        EventBus.emit('banner', '😱 ХОЗЯИН В ШОКЕ! +5', '#ff9f43');
        const hp = this.level.getHostPos();
        if (hp) this.effects.burst(hp.x, 1.5, hp.z, 0xffee66, 30, 6, 1.2, 1.2);
        this._shakeCamera(0.4, 0.7);
      }
    } else if (id === 'jump') {
      if (this.player.tryUseJump()) {
        Sound.crumb(); Vibration.tap(30);
        this.effects.burst(this.player.pos.x, 0.6, this.player.pos.z, 0xffe066, 14, 4, 0.7, 0.6);
      }
    }
  }

  _trySpawnSlipper() {
    const maxSlip = Math.min(CFG.SLIPPER_BASE_LIMIT + this.wave, 4);
    const active = this.slippers.filter(s => s.phase === 'flying').length;
    if (active >= maxSlip) return;
    if (this.wave < 2 && Math.random() < 0.55) return;
    if (this._inDen) return;

    const hp = this.level.getHostPos();
    if (!hp) return;
    const from = { x: hp.x, z: hp.z };
    const target = { x: this.player.pos.x, z: this.player.pos.z };

    if (this.host) this.host.setState('scream', 1.2);
    Sound.slipperThrow();
    this.slippers.push(new Slipper(this.scene, from, target));
  }

  _doPrank(spot) {
    this.sram += spot.points;
    this.pranksDone++;
   
    Sound.prank(); Vibration.prank();
    // ⚠️ Голос зависит от уровня: зал — сосед, кухня — жена
    if (this.currentLevelId === 0) this.voiceHost.play();
    else this.voiceWife.play();
    if (this.host) this.host.setState('scream', 1.6);
    this.effects.prank(spot.x, spot.z, spot.color);
    this._shakeCamera(0.2, 0.4);
    EventBus.emit('score', this.sram);
    this._checkProgress();
  }

  _checkProgress() {
    const th = CFG.WAVE_THRESHOLDS;
    let w = 1;
    for (let i = 0; i < th.length; i++) if (this.pranksDone >= th[i]) w = i + 2;
    w = Math.min(w, CFG.MAX_WAVE);
    if (w > this.wave) {
      this.wave = w;
      this.scene.userData.wave = w;
      Sound.waveUp(); Vibration.tap(60);
      EventBus.emit('banner', `ВОЛНА ${w}`, COLORS.WAVE);

      const preset = CFG.LIGHTING_PRESETS[Math.min(w - 1, CFG.LIGHTING_PRESETS.length - 1)];
      this.level.setLightingPreset(preset);
      EventBus.emit('banner', preset.name, '#ffe066');

      if (w === CFG.MAX_WAVE && this.host && !this.bossActive) {
        this.bossActive = true;
        this.host.activateBoss();
        EventBus.emit('banner', '🏆 ХОЗЯИН С МУХОБОЙКОЙ!', '#ff4444');
        Sound.hostScream();
      }

      if (w >= 2) this._spawnTrapsBetweenWaves();

      if (w >= CFG.MAX_WAVE) this._openExit();
      else {
        this._pendingUpgrades++;
        this._triggerUpgradeMenuIfIdle();
      }
    }
    EventBus.emit('wave', this.wave, this.pranksDone);
  }

  _triggerUpgradeMenuIfIdle() {
    if (this._upgradeShowing) return;
    if (this._pendingUpgrades <= 0) return;
    this._upgradeShowing = true;
    this._pendingUpgrades--;
    this._paused = true;

    EventBus.emit('show-upgrades', 3, (up) => {
      up.apply(this.player);
      EventBus.emit('banner', `${up.icon} ${up.name}`, '#ffe066');
      EventBus.emit('hp', this.player.hp);
      if (['fake', 'scream', 'jump'].includes(up.id)) EventBus.emit('ability:unlock', up.id);
      this._upgradeShowing = false;
      this._paused = false;
      if (this._pendingUpgrades > 0) setTimeout(() => this._triggerUpgradeMenuIfIdle(), 900);
    });
  }

  _damage(reason, silent = false, forceRagdoll = false) {
    if (this.player.isInvulnerable || this.over || this.won) return;
    this.player.hp--;
    this.player.makeInvulnerable(CFG.INVULN_TIME);
    this.player.knockback();
    if (forceRagdoll || Math.random() < 0.6) this.player.startRagdoll();

    const splat = new Splat(this.scene, this.player.pos.x, this.player.pos.z);
    this.splats.push(splat);

    Sound.damage(); Vibration.hit();
    this.effects.damage(this.player.pos.x, this.player.pos.z);
    this._shakeCamera(0.3, 0.55);
    this._flash(0xffcc44);

    EventBus.emit('hp', this.player.hp);
    if (!silent) EventBus.emit('banner', reason, '#ff5555');
    if (this.player.hp <= 0) this._gameOver();
  }

  _flash(color) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;background:#${color.toString(16).padStart(6, '0')};
      opacity:0.35;pointer-events:none;z-index:5;transition:opacity .3s`;
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '0'; });
    setTimeout(() => el.remove(), 400);
  }

  _openExit() {
    if (this.exitOpen) return;
    this.exitOpen = true;
    this.exitMesh.visible = true;
    EventBus.emit('banner', 'ВЕНТИЛЯЦИЯ ОТКРЫТА! БЕГИ!', COLORS.VENT);
  }

  _gameOver() {
    this.over = true;
    if (this.tutorial) this.tutorial.stop();
    Sound.lose(); Vibration.death();
    this.voiceHost.stop(); this.voiceWife.stop();
    this.voiceDog.stop(); this.voiceCat.stop(); this.voiceRat.stop();
    EventBus.emit('gameover', this.sram, this.wave);
  }

  _win() {
    this.won = true;
    if (this.tutorial) this.tutorial.stop();
    Sound.win(); Vibration.win();
    const hasNext = this.currentLevelId < LEVELS.length - 1;
    EventBus.emit('win', this.sram, hasNext);
  }
}