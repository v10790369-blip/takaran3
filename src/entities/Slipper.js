// Тапок, брошенный хозяином. Летит по баллистике, шлёпается, лежит как угроза.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Slipper {
  constructor(scene, fromPos, targetPos) {
    this.scene = scene;
    this.pos = { x: fromPos.x, y: 1.5, z: fromPos.z };
    this.vel = { x: 0, y: 0, z: 0 };
    this.radius = 0.65;
    this.phase = 'flying';           // flying | landed
    this.landedTimer = 0;

    const dx = targetPos.x - fromPos.x;
    const dz = targetPos.z - fromPos.z;
    const dist = Math.max(2, Math.hypot(dx, dz));
    const flightTime = dist / CFG.SLIPPER_SPEED;

    this.vel.x = dx / flightTime;
    this.vel.z = dz / flightTime;
    this.vel.y = 0.5 * CFG.SLIPPER_GRAVITY * flightTime;

    this.mesh = this._buildMesh();
    this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    scene.add(this.mesh);
  }

  _buildMesh() {
    const g = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x2f3b57, roughness: 0.75 });
    const mat2 = new THREE.MeshStandardMaterial({ color: 0x1d2740, roughness: 0.8 });

    const sole = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, 2.2), mat);
    sole.castShadow = true;
    g.add(sole);

    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 8, 16, Math.PI), mat2);
    strap.rotation.x = Math.PI / 2;
    strap.position.set(0, 0.15, 0.35);
    strap.castShadow = true;
    g.add(strap);
    return g;
  }

  update(dt) {
    if (this.phase === 'flying') {
      this.vel.y -= CFG.SLIPPER_GRAVITY * dt;
      this.pos.x += this.vel.x * dt;
      this.pos.y += this.vel.y * dt;
      this.pos.z += this.vel.z * dt;

      this.mesh.rotation.x += dt * 9;
      this.mesh.rotation.z += dt * 3;
      this.mesh.rotation.y = Math.atan2(this.vel.x, this.vel.z);

      if (this.pos.y <= 0.3) {
        this.pos.y = 0.3;
        this.phase = 'landed';
        this.landedTimer = CFG.SLIPPER_LANDED_TIME;
        this.mesh.rotation.set(0, this.mesh.rotation.y, 0);
        this.scene.events.emit('slipper:landed', this.pos.x, this.pos.z);
      }
      this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);
    } else {
      this.landedTimer -= dt;
      if (this.landedTimer < 1.5) {
        this.mesh.visible = Math.floor(this.scene.userData.time * 12) % 2 === 0;
      }
    }
  }

  canHit() { return this.phase === 'flying'; }
  get isDead() { return this.phase === 'landed' && this.landedTimer <= 0; }
  destroy() { this.scene.remove(this.mesh); }
}