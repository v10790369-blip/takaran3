// Облако дихлофоса. Растёт, наносит урон, растворяется.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class SprayCloud {
  constructor(scene, x, z) {
    this.scene = scene;
    this.pos = { x, z };
    this.radius = 0.6;
    this.life = CFG.SPRAY_LIFETIME;

    const mat = new THREE.MeshBasicMaterial({
      color: 0x8aff8a, transparent: true, opacity: 0.45,
      depthWrite: false, side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mat);
    this.mesh.position.set(x, 1.2, z);
    this.mesh.scale.setScalar(0.6);
    scene.add(this.mesh);
  }

  update(dt, player) {
    this.life -= dt;
    this.radius = Math.min(CFG.SPRAY_MAX_R, this.radius + dt * CFG.SPRAY_GROW);

    this.mesh.scale.setScalar(this.radius);
    this.mesh.material.opacity = Math.max(0, Math.min(0.45, this.life * 0.15));
    this.mesh.rotation.y += dt * 0.6;

    const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
    return d < this.radius && !player.isInvulnerable;
  }

  get isDead() { return this.life <= 0; }
  destroy() { this.scene.remove(this.mesh); this.mesh.geometry.dispose(); }
}