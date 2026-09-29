// Таракан Жора. Скользит, кувыркается при уроне, залипает на клею.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Player {
  constructor(scene, x, z) {
    this.scene = scene;
    this.pos = { x, z };
    this.vel = { x: 0, z: 0 };
    this.radius = CFG.PLAYER_RADIUS;
    this.invuln = 0;

    this.hp = CFG.HP;
    this.maxHp = CFG.HP;

    this.speedMul = 1;
    this.dragMul = 1;
    this.hasMagnet = false;
    this.hasFakeDeath = false;
    this.hasScream = false;
    this.hasJump = false;

    this.isFakingDead = false;
    this.fakeDeathTimer = 0;
    this.screamTimer = 0;
    this.jumpTimer = 0;
    this.jumpDir = { x: 0, z: 0 };

    this.stickyTimer = 0;
    this.poisonTimer = 0;
    this.poisonTick = 0;

    // Клей
    this.glueTimer = 0;
    this.glueVel = { x: 0, z: 0 };

    this.ragdollTimer = 0;
    this.ragdollSpin = { x: 0, y: 0, z: 0 };

    this.carryingFood = null;

    this.abilityCooldown = { fake: 0, scream: 0, jump: 0 };
    this.abilityMaxCd = { fake: 10, scream: 15, jump: 8 };

    this.mesh = this._buildMesh();
    this.mesh.position.set(x, 0.35, z);
    scene.add(this.mesh);

    this.faceAngle = 0;
    this.legsTime = 0;
  }
  
  applySkin(skin) {
    if (!skin) return;
    this.mesh.traverse(o => {
      if (!o.material) return;
      if (o.material.userData.isBody) o.material.color.setHex(skin.color);
      if (o.material.userData.isShell) o.material.color.setHex(skin.shellColor);
    });
    // Прозрачность для призрака
    this.mesh.traverse(o => {
      if (!o.material) return;
      if (skin.transparent) {
        o.material.transparent = true;
        o.material.opacity = 0.65;
      } else {
        o.material.transparent = false;
        o.material.opacity = 1;
      }
    });
  }

  _buildMesh() {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a2c14, roughness: 0.55, metalness: 0.15 });
    const shellMat = new THREE.MeshStandardMaterial({ color: 0x5c3819, roughness: 0.4, metalness: 0.28 });
    bodyMat.userData.isBody = true;
    shellMat.userData.isShell = true;
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a1006, roughness: 0.7 });

    const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), bodyMat);
    abdomen.scale.set(1.0, 0.5, 1.7); abdomen.castShadow = true; g.add(abdomen);

    for (const sx of [-0.18, 0.18]) {
      const wing = new THREE.Mesh(
        new THREE.SphereGeometry(0.42, 14, 10, 0, Math.PI, 0, Math.PI / 2), shellMat);
      wing.scale.set(1.0, 0.55, 1.9);
      wing.position.set(sx, 0.18, 0);
      wing.rotation.x = Math.PI;
      wing.castShadow = true;
      g.add(wing);
    }
    for (let i = 0; i < 4; i++) {
      const seg = new THREE.Mesh(new THREE.TorusGeometry(0.42 - i * 0.06, 0.02, 6, 16), darkMat);
      seg.rotation.x = Math.PI / 2;
      seg.position.set(0, -0.15, 0.3 + i * 0.2);
      g.add(seg);
    }
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), shellMat);
    thorax.scale.set(1, 0.6, 0.9); thorax.position.set(0, 0.15, -0.7);
    thorax.castShadow = true; g.add(thorax);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), darkMat);
    head.position.set(0, 0.05, -1.15); head.scale.set(1, 0.85, 0.9);
    head.castShadow = true; g.add(head);

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x220000, emissive: 0xaa1111, emissiveIntensity: 2.2,
      roughness: 0.15, metalness: 0.6
    });
    for (const sx of [-0.16, 0.16]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), eyeMat);
      eye.position.set(sx, 0.15, -1.32); g.add(eye);
    }
    const antMat = new THREE.MeshStandardMaterial({ color: 0x1a1006, roughness: 0.7 });
    for (const sx of [-0.1, 0.1]) {
      const ag = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.018, 0.35, 5), antMat);
        seg.position.y = i * 0.32;
        seg.rotation.z = sx * (0.1 + i * 0.15);
        seg.rotation.x = -0.4 - i * 0.15;
        ag.add(seg);
      }
      ag.position.set(sx, 0.2, -1.3); g.add(ag);
    }
    this.legs = [];
    const legMat = new THREE.MeshStandardMaterial({ color: 0x2a1808, roughness: 0.75 });
    for (let i = 0; i < 6; i++) {
      const side = i < 3 ? -1 : 1;
      const idx = i % 3;
      const legGroup = new THREE.Group();
      const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.45, 6), legMat);
      upper.castShadow = true; legGroup.add(upper);
      const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.5, 6), legMat);
      lower.position.y = -0.4; lower.rotation.z = side * 0.7;
      lower.castShadow = true; legGroup.add(lower);
      legGroup.position.set(side * 0.5, 0.05, -0.4 + idx * 0.4);
      legGroup.rotation.z = side * 0.6;
      legGroup.userData = { side, idx };
      g.add(legGroup);
      this.legs.push(legGroup);
    }
    return g;
  }

  move(dir, dt) {
    // Ragdoll — не управляем
    if (this.ragdollTimer > 0) {
      this.vel.x *= 0.98; this.vel.z *= 0.98;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      return;
    }

    // ⚠️ КЛЕЙ: игрок не управляет, его медленно тащит по инерции
    if (this.glueTimer > 0) {
      this.glueTimer -= dt;
      // Плавно выходим на скорость клея
      const k = 1 - Math.exp(-2.5 * dt);
      this.vel.x += (this.glueVel.x - this.vel.x) * k;
      this.vel.z += (this.glueVel.z - this.vel.z) * k;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;

      // Когда клей кончился — импульс затухает
      if (this.glueTimer <= 0) {
        this.glueTimer = 0;
        this.glueVel.x = 0; this.glueVel.z = 0;
      }
      return;
    }

    const carryMul = this.carryingFood ? CFG.FOOD.CARRY_SLOW : 1;
    const stickyMul = this.stickyTimer > 0 ? 0.25 : 1;
    const totalMul = this.speedMul * carryMul * stickyMul;

    if (this.isFakingDead) {
      this.vel.x *= 0.85; this.vel.z *= 0.85;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      return;
    }

    this.vel.x += dir.x * CFG.PLAYER_ACCEL * totalMul * dt;
    this.vel.z += dir.z * CFG.PLAYER_ACCEL * totalMul * dt;

    const dragK = Math.exp(-CFG.PLAYER_DRAG * this.dragMul * dt);
    this.vel.x *= dragK; this.vel.z *= dragK;

    const maxSp = CFG.PLAYER_MAX_SPEED * totalMul;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > maxSp) { const k = maxSp / sp; this.vel.x *= k; this.vel.z *= k; }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
  }

  update(dt) {
    for (const k of ['fake', 'scream', 'jump']) {
      if (this.abilityCooldown[k] > 0)
        this.abilityCooldown[k] = Math.max(0, this.abilityCooldown[k] - dt);
    }
    if (this.isFakingDead) {
      this.fakeDeathTimer -= dt;
      if (this.fakeDeathTimer <= 0) this.isFakingDead = false;
    }
    if (this.screamTimer > 0) this.screamTimer -= dt;
    if (this.jumpTimer > 0) {
      this.jumpTimer -= dt;
      this.pos.x += this.jumpDir.x * 30 * dt;
      this.pos.z += this.jumpDir.z * 30 * dt;
    }

    if (this.stickyTimer > 0) this.stickyTimer -= dt;
    if (this.poisonTimer > 0) {
      this.poisonTimer -= dt;
      this.poisonTick -= dt;
    }

    if (this.ragdollTimer > 0) {
      this.ragdollTimer -= dt;
      this.mesh.rotation.x += this.ragdollSpin.x * dt;
      this.mesh.rotation.y += this.ragdollSpin.y * dt;
      this.mesh.rotation.z += this.ragdollSpin.z * dt;
      const t = this.ragdollTimer;
      this.mesh.position.y = 0.3 + Math.max(0, Math.sin(t * 12)) * 0.5;
      if (this.ragdollTimer <= 0) this._endRagdoll();
      return;
    }

    this.mesh.position.x = this.pos.x;
    this.mesh.position.z = this.pos.z;

    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 1.2 && !this.isFakingDead) {
      const target = Math.atan2(this.vel.x, this.vel.z);
      const aim = target + Math.PI;
      const diff = ((aim - this.faceAngle + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.faceAngle += diff * Math.min(1, CFG.PLAYER_ROT_LERP * dt);
      this.mesh.rotation.y = this.faceAngle;
    }

    if (this.isFakingDead) {
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, Math.PI * 0.5, dt * 8);
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 0.15, dt * 8);
    } else {
      this.mesh.rotation.x = THREE.MathUtils.lerp(this.mesh.rotation.x, 0, dt * 8);
      this.mesh.position.y = THREE.MathUtils.lerp(this.mesh.position.y, 0.35, dt * 8);
    }

    this.legsTime += dt * (4 + sp * 0.6);
    for (const legGroup of this.legs) {
      const { side, idx } = legGroup.userData;
      legGroup.rotation.z = side * 0.6 + Math.sin(this.legsTime + idx * 2) * 0.35 * Math.min(1, sp / 4);
    }

    if (this.invuln > 0) this.invuln -= dt;
  }

  startRagdoll() {
    if (this.ragdollTimer > 0) return;
    this.ragdollTimer = CFG.RAGDOLL.DURATION;
    this.ragdollSpin.x = (Math.random() - 0.5) * CFG.RAGDOLL.SPIN;
    this.ragdollSpin.y = (Math.random() - 0.5) * CFG.RAGDOLL.SPIN;
    this.ragdollSpin.z = (Math.random() - 0.5) * CFG.RAGDOLL.SPIN * 2;
    const a = Math.random() * Math.PI * 2;
    this.vel.x = Math.cos(a) * CFG.RAGDOLL.BOUNCE;
    this.vel.z = Math.sin(a) * CFG.RAGDOLL.BOUNCE;
  }

  _endRagdoll() {
    this.ragdollTimer = 0;
    this.mesh.rotation.x = 0;
    this.mesh.rotation.z = 0;
    this.mesh.position.y = 0.35;
  }

  tryUseFakeDeath() {
    if (!this.hasFakeDeath || this.abilityCooldown.fake > 0 || this.isFakingDead) return false;
    this.isFakingDead = true;
    this.fakeDeathTimer = 2;
    this.abilityCooldown.fake = this.abilityMaxCd.fake;
    this.makeInvulnerable(2);
    return true;
  }
  tryUseScream() {
    if (!this.hasScream || this.abilityCooldown.scream > 0) return false;
    this.abilityCooldown.scream = this.abilityMaxCd.scream;
    this.screamTimer = 0.4;
    return true;
  }
  tryUseJump() {
    if (!this.hasJump || this.abilityCooldown.jump > 0) return false;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > 0.5) {
      this.jumpDir.x = this.vel.x / sp;
      this.jumpDir.z = this.vel.z / sp;
    } else {
      this.jumpDir.x = Math.sin(this.faceAngle + Math.PI);
      this.jumpDir.z = Math.cos(this.faceAngle + Math.PI);
    }
    this.jumpTimer = 0.25;
    this.abilityCooldown.jump = this.abilityMaxCd.jump;
    this.makeInvulnerable(0.35);
    return true;
  }

  applySticky(duration) { this.stickyTimer = Math.max(this.stickyTimer, duration); }
  applyPoison(duration) { this.poisonTimer = Math.max(this.poisonTimer, duration); this.poisonTick = 0; }
  get isPoisoned() { return this.poisonTimer > 0; }

  // ⚠️ Залипание на клею — медленное скольжение 5 сек в случайном направлении
  applyGlue(duration = 5) {
    this.glueTimer = duration;
    // Медленная скорость скольжения (2 юнита/сек)
    const a = Math.random() * Math.PI * 2;
    const speed = 2.2;
    this.glueVel = { x: Math.cos(a) * speed, z: Math.sin(a) * speed };
    // Обнуляем обычную скорость, чтобы не было рывка
    this.vel.x = 0;
    this.vel.z = 0;
  }
  get isGlued() { return this.glueTimer > 0; }

  makeInvulnerable(t) { this.invuln = Math.max(this.invuln, t); }
  get isInvulnerable() { return this.invuln > 0 || this.isFakingDead || this.ragdollTimer > 0; }
  get isRagdoll() { return this.ragdollTimer > 0; }

  knockback() {
    if (this.isFakingDead || this.glueTimer > 0) return;
    const a = Math.random() * Math.PI * 2;
    this.vel.x = Math.cos(a) * CFG.KNOCKBACK;
    this.vel.z = Math.sin(a) * CFG.KNOCKBACK;
  }
}