// Кот. Спит на лежанке, охотится; теряет игрока в норке.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Cat {
  constructor(scene, physics, pos) {
    this.scene = scene;
    this.physics = physics;
    this.pos = { x: pos.x, z: pos.z };
    this.home = { x: pos.x, z: pos.z };
    this.vel = { x: 0, z: 0 };
    this.angle = 0;
    this.radius = 0.9;

    this.awake = false;
    this.sleepTimer = 0;
    this.lostTimer = 0;         // сколько "ищет" после потери игрока

    this.mesh = this._buildMesh();
    this.mesh.position.set(this.pos.x, 0, this.pos.z);
    this.mesh.rotation.y = 0;
    scene.add(this.mesh);

    this.zzz = this._buildZzz();
    this.zzz.position.set(this.pos.x, 2, this.pos.z);
    scene.add(this.zzz);
  }

  _buildMesh() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x6f7788, roughness: 0.85 });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x8b93a3, roughness: 0.85 });

    const body = new THREE.Mesh(new THREE.SphereGeometry(0.9, 14, 10), mat);
    body.scale.set(1.4, 0.75, 2.0); body.position.y = 0.75; body.castShadow = true; g.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 10), mat);
    head.position.set(0, 1.1, 1.5); head.castShadow = true; g.add(head);

    for (const sx of [-0.35, 0.35]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4), mat2);
      ear.position.set(sx, 1.65, 1.5); ear.castShadow = true; g.add(ear);
    }

    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 1.6, 8), mat);
    tail.position.set(0, 0.9, -1.9); tail.rotation.x = 0.4; tail.castShadow = true; g.add(tail);

    for (const [sx, sz] of [[-0.6, 0.9], [0.6, 0.9], [-0.6, -0.9], [0.6, -0.9]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.7, 6), mat);
      leg.position.set(sx, 0.35, sz); leg.castShadow = true; g.add(leg);
    }
    return g;
  }

  _buildZzz() {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    for (let i = 0; i < 3; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), mat);
      s.position.set(i * 0.3 - 0.3, i * 0.35, 0); g.add(s);
    }
    return g;
  }

  update(dt, player, playerHidden = false) {
    // Если игрок спрятан — кот теряет цель и возвращается домой
    if (playerHidden) {
      if (this.awake) this.lostTimer = 1.2;   // 1.2 сек "ищет"
      this.awake = false;
      this.zzz.visible = true;
      this._returnHome(dt);
      this.mesh.position.set(this.pos.x, 0, this.pos.z);
      const diff = ((this.angle - this.mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.mesh.rotation.y += diff * Math.min(1, dt * 8);
      this.zzz.position.set(this.pos.x, 2 + Math.sin(this.scene.userData.time * 2) * 0.1, this.pos.z);
      this.zzz.rotation.y = this.scene.userData.time;
      return;
    }

    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    if (!this.awake && d < CFG.CAT_WAKE_DIST) {
      this.awake = true; this.sleepTimer = CFG.CAT_SLEEP_TIME;
      this.zzz.visible = false;
      this.scene.events.emit('cat:woke');
    }
    if (this.awake) {
      this.sleepTimer -= dt;
      this._chase(player, dt);
      if (this.sleepTimer <= 0) { this.awake = false; this.zzz.visible = true; }
    } else {
      this._returnHome(dt);
    }
    this.mesh.position.set(this.pos.x, 0, this.pos.z);
    const diff = ((this.angle - this.mesh.rotation.y + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.mesh.rotation.y += diff * Math.min(1, dt * 8);
    this.zzz.position.set(this.pos.x, 2 + Math.sin(this.scene.userData.time * 2) * 0.1, this.pos.z);
    this.zzz.rotation.y = this.scene.userData.time;
  }

  _chase(player, dt) {
    const dx = player.pos.x - this.pos.x;
    const dz = player.pos.z - this.pos.z;
    const desired = Math.atan2(dx, dz);
    const angDiff = ((desired - this.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
    this.angle += angDiff * Math.min(1, CFG.CAT_TURN_LERP * dt);
    const tvx = Math.sin(this.angle) * CFG.CAT_SPEED;
    const tvz = Math.cos(this.angle) * CFG.CAT_SPEED;
    const k = 1 - Math.exp(-CFG.CAT_ACCEL * dt / CFG.CAT_SPEED);
    this.vel.x += (tvx - this.vel.x) * k;
    this.vel.z += (tvz - this.vel.z) * k;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    if (this.physics) {
      this.physics.resolveCircle(this.pos, this.radius);
      this.physics.clampToBounds(this.pos, this.scene.userData.levelSize / 2, this.radius);
    }
  }

  _returnHome(dt) {
    const dx = this.home.x - this.pos.x;
    const dz = this.home.z - this.pos.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.4) {
      const desired = Math.atan2(dx, dz);
      const angDiff = ((desired - this.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
      this.angle += angDiff * Math.min(1, CFG.CAT_TURN_LERP * dt);
      this.vel.x = Math.sin(this.angle) * CFG.CAT_HOME_SPEED;
      this.vel.z = Math.cos(this.angle) * CFG.CAT_HOME_SPEED;
      this.pos.x += this.vel.x * dt;
      this.pos.z += this.vel.z * dt;
      if (this.physics) {
        this.physics.resolveCircle(this.pos, this.radius);
        this.physics.clampToBounds(this.pos, this.scene.userData.levelSize / 2, this.radius);
      }
    } else {
      this.vel.x *= 0.8; this.vel.z *= 0.8;
    }
  }
}