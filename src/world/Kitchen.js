// Кухня: пол, стены, мебель, свет, лежанка и норка.
import * as THREE from 'three';
import { CFG, CAT_HOME_POS, DEN_POS, DEN_RADIUS, TV_POS } from '../config.js';
import { TV } from './TV.js';

export class Kitchen {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this._build();
  }

  _build() {
    this._buildFloor();
    this._buildWalls();
    this._buildWallGlow();
    this._buildFurniture();
    this._buildDecor();
    this._buildCatBed();
    this._buildDen();
    this.tv = new TV(this.scene, TV_POS.x, TV_POS.z, TV_POS.rotY);
    this._buildLights();
  }

  _buildFloor() {
    const size = CFG.KITCHEN_SIZE;
    const tiles = 15;
    const tile = size / tiles;
    const geom = new THREE.PlaneGeometry(tile, tile);
    const matA = new THREE.MeshStandardMaterial({ color: 0xb08a5e, roughness: 0.85 });
    const matB = new THREE.MeshStandardMaterial({ color: 0x8a6b45, roughness: 0.85 });

    const floor = new THREE.Group();
    for (let i = 0; i < tiles; i++) {
      for (let j = 0; j < tiles; j++) {
        const mat = ((i + j) % 2 === 0) ? matA : matB;
        const m = new THREE.Mesh(geom, mat);
        m.rotation.x = -Math.PI / 2;
        m.position.set(-size / 2 + tile / 2 + i * tile, 0, -size / 2 + tile / 2 + j * tile);
        m.receiveShadow = true;
        floor.add(m);
      }
    }
    this.scene.add(floor);
  }

  _buildWalls() {
    const size = CFG.KITCHEN_SIZE;
    const h = CFG.WALL_HEIGHT;
    const mat = new THREE.MeshStandardMaterial({ color: 0xd9c39a, roughness: 0.9, side: THREE.DoubleSide });

    const mkWall = (w, x, z, rotY = 0) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), mat);
      wall.position.set(x, h / 2, z);
      wall.rotation.y = rotY;
      wall.receiveShadow = true;
      this.scene.add(wall);
    };
    mkWall(size, 0, -size / 2);
    mkWall(size, 0, size / 2);
    mkWall(size, -size / 2, 0, Math.PI / 2);
    mkWall(size, size / 2, 0, Math.PI / 2);

    const skirt = new THREE.MeshStandardMaterial({ color: 0x5c4a32 });
    const addSkirt = (w, x, z, rotY = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.35, 0.1), skirt);
      m.position.set(x, 0.175, z);
      m.rotation.y = rotY;
      this.scene.add(m);
    };
    addSkirt(size, 0, -size / 2 + 0.25);
    addSkirt(size, 0, size / 2 - 0.25);
    addSkirt(size, -size / 2 + 0.25, 0, Math.PI / 2);
    addSkirt(size, size / 2 - 0.25, 0, Math.PI / 2);
  }

  // Мягкая дымка у стен — создаёт объём
  _buildWallGlow() {
    const size = CFG.KITCHEN_SIZE;
    const h = CFG.WALL_HEIGHT;

    const mkGlow = (w, x, z, rotY) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffd8a0, transparent: true, opacity: 0.08,
        depthWrite: false, side: THREE.DoubleSide
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h * 0.7), mat);
      m.position.set(x, h * 0.35, z);
      m.rotation.y = rotY;
      this.scene.add(m);
    };
    mkGlow(size - 0.5, 0, -size / 2 + 0.6, 0);
    mkGlow(size - 0.5, 0, size / 2 - 0.6, 0);
    mkGlow(size - 0.5, -size / 2 + 0.6, 0, Math.PI / 2);
    mkGlow(size - 0.5, size / 2 - 0.6, 0, Math.PI / 2);
  }

  _buildFurniture() {
    this._addBox(-7, -9, 8, 4, 1.6, 0x8a5a2b, 'СТОЛ');
    this._addBox(11, -6, 3, 5, 3.2, 0xc8ccd2, 'ХОЛОДИЛЬНИК');
    this._addBox(-10, 9, 4.5, 3, 1.4, 0x5a5f66, 'ПЛИТА');
    this._addBox(6, 12, 5, 2.2, 1.2, 0x9b7a55, 'ТУМБА');
  }

  _addBox(cx, cz, sx, sz, h, color, label) {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.05 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(sx, h, sz), mat);
    box.position.set(cx, h / 2, cz);
    box.castShadow = true;
    box.receiveShadow = true;
    this.scene.add(box);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(sx + 0.2, sz + 0.2),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28 })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(cx, 0.01, cz);
    this.scene.add(shadow);

    this.obstacles.push({ x: cx, z: cz, sx, sz, label, height: h });
  }

  _buildDecor() {
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.08, 24),
      new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.6 })
    );
    plate.position.set(-7, 1.65, -9);
    plate.castShadow = true;
    this.scene.add(plate);

    const plateInner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.02, 24),
      new THREE.MeshStandardMaterial({ color: 0xdccbb0, roughness: 0.7 })
    );
    plateInner.position.set(-7, 1.7, -9);
    this.scene.add(plateInner);

    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.24, 0.55, 16),
      new THREE.MeshStandardMaterial({ color: 0x6a3b2e, roughness: 0.8 })
    );
    cup.position.set(-5.2, 1.88, -8.5);
    cup.castShadow = true;
    this.scene.add(cup);

    const coffee = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.22, 0.04, 16),
      new THREE.MeshStandardMaterial({ color: 0x2b1408, roughness: 0.5 })
    );
    coffee.position.set(-5.2, 2.13, -8.5);
    this.scene.add(coffee);

    const jarMats = [0xc94f3b, 0x6ba85b, 0xd4a13b];
    for (let i = 0; i < 3; i++) {
      const jar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.5, 12),
        new THREE.MeshStandardMaterial({ color: jarMats[i], roughness: 0.7 })
      );
      jar.position.set(10 + i * 0.55, 3.45, -6);
      jar.castShadow = true;
      this.scene.add(jar);

      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.24, 0.1, 12),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
      );
      lid.position.set(10 + i * 0.55, 3.73, -6);
      this.scene.add(lid);
    }
  }

  _buildCatBed() {
    const g = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 1.5, 0.25, 20),
      new THREE.MeshStandardMaterial({ color: 0x8a3a4a, roughness: 0.95 })
    );
    base.position.y = 0.13; base.receiveShadow = true; base.castShadow = true;
    g.add(base);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.22, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x9a4a5a, roughness: 0.95 })
    );
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.28; rim.castShadow = true;
    g.add(rim);

    const cushion = new THREE.Mesh(
      new THREE.CylinderGeometry(1.25, 1.25, 0.12, 20),
      new THREE.MeshStandardMaterial({ color: 0xb85a6a, roughness: 0.9 })
    );
    cushion.position.y = 0.28; cushion.receiveShadow = true;
    g.add(cushion);

    g.position.set(CAT_HOME_POS.x, 0, CAT_HOME_POS.z);
    this.scene.add(g);
  }

  _buildDen() {
    const g = new THREE.Group();
    const wallX = -CFG.KITCHEN_SIZE / 2 + 0.22;
    const denY = 0.95;
    const denZ = DEN_POS.z;

    const rim = new THREE.Mesh(
      new THREE.CircleGeometry(DEN_RADIUS, 28),
      new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 1 })
    );
    rim.scale.set(1, 0.78, 1);
    rim.position.set(wallX + 0.01, denY, denZ);
    rim.rotation.y = Math.PI / 2;
    g.add(rim);

    const hole = new THREE.Mesh(
      new THREE.CircleGeometry(DEN_RADIUS - 0.14, 28),
      new THREE.MeshBasicMaterial({ color: 0x040101 })
    );
    hole.scale.set(1, 0.78, 1);
    hole.position.set(wallX + 0.02, denY, denZ);
    hole.rotation.y = Math.PI / 2;
    g.add(hole);

    const crackMat = new THREE.MeshBasicMaterial({
      color: 0x2a1808, transparent: true, opacity: 0.75
    });
    for (let i = 0; i < 7; i++) {
      const len = 0.25 + Math.random() * 0.5;
      const crack = new THREE.Mesh(
        new THREE.PlaneGeometry(len, 0.05 + Math.random() * 0.04),
        crackMat
      );
      const a = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
      crack.position.set(
        wallX + 0.03,
        denY + Math.sin(a) * (DEN_RADIUS + len / 2) * 0.78,
        denZ + Math.cos(a) * (DEN_RADIUS + len / 2)
      );
      crack.rotation.y = Math.PI / 2;
      crack.rotation.z = a;
      g.add(crack);
    }

    const glow = new THREE.PointLight(0x552200, 0.35, 3, 2);
    glow.position.set(wallX + 0.4, denY, denZ);
    this.scene.add(glow);

    this.scene.add(g);
  }

  _buildLights() {
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x443322, 0.9);
    this.scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff0d0, 1.1);
    this.sun.position.set(10, 18, 6);
    this.sun.castShadow = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    this.sun.shadow.mapSize.set(512, 512);
    this.sun.shadow.camera.left = -20;
    this.sun.shadow.camera.right = 20;
    this.sun.shadow.camera.top = 20;
    this.sun.shadow.camera.bottom = -20;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 40;
    if ('radius' in this.sun.shadow) this.sun.shadow.radius = 4;
    if ('blurSamples' in this.sun.shadow) this.sun.shadow.blurSamples = 12;
    this.scene.add(this.sun);

    // Мерцающая лампа над столом
    this.lamp = new THREE.PointLight(0xffcc77, 0.8, 16, 2);
    this.lamp.position.set(-7, 4.5, -9);
    this.scene.add(this.lamp);
    this.lampBaseIntensity = 0.8;
    this.lampFlickerTimer = 0;
    this.lampFlickerState = 0;   // 0 = норма, 1 = тускло, 2 = скачок

    // Тёплый подсвет пола под столом
    const floorGlow = new THREE.PointLight(0xff8844, 0.35, 10, 2);
    floorGlow.position.set(-7, 0.8, -9);
    this.scene.add(floorGlow);
  }

  // Мерцание лампы + смена светового пресета
  update(dt, player, time) {
    // Мерцание
    this.lampFlickerTimer -= dt;
    if (this.lampFlickerTimer <= 0) {
      this.lampFlickerTimer = 0.05 + Math.random() * 0.4;
      this.lampFlickerState = Math.random() < 0.08 ? 2 : (Math.random() < 0.15 ? 1 : 0);
    }
    const base = this.lampBaseIntensity;
    if (this.lampFlickerState === 2) this.lamp.intensity = base * (1.4 + Math.random() * 0.4);
    else if (this.lampFlickerState === 1) this.lamp.intensity = base * (0.3 + Math.random() * 0.2);
    else this.lamp.intensity = base * (0.9 + Math.sin(time * 3) * 0.05);

    if (this.tv) this.tv.update(dt, player);
  }

  // Плавная смена света при смене волны
  setLightingPreset(preset) {
    // Цвета
    this.hemi.color.setHex(preset.hemi);
    this.hemi.groundColor.setHex(preset.ground);
    this.sun.color.setHex(preset.sun);
    this.sun.intensity = preset.sunIntensity;
    this.lampBaseIntensity = preset.ambInt * 0.9;

    if (this.scene.fog) {
      this.scene.fog.color.setHex(preset.fogColor);
      this.scene.fog.near = preset.fogNear;
      this.scene.fog.far = preset.fogFar;
    }
    this.scene.background = new THREE.Color(preset.fogColor);
  }
}