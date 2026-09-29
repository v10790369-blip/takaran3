// Зона пакости — светящееся кольцо. Внутри заполняется прогресс.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class PrankSpot {
  constructor(scene, cfg) {
    this.scene = scene;
    this.x = cfg.x;
    this.z = cfg.z;
    this.radius = cfg.radius;
    this.points = cfg.points;
    this.color  = cfg.color;
    this.label  = cfg.label;

    this.progress = 0;
    this.cooldown = 0;

    // кольцо
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.55, side: THREE.DoubleSide
    });
    this.ring = new THREE.Mesh(new THREE.RingGeometry(cfg.radius - 0.08, cfg.radius, 40), ringMat);
    this.ring.rotation.x = -Math.PI / 2;
    this.ring.position.set(cfg.x, 0.02, cfg.z);
    scene.add(this.ring);

    // прогресс-дуга
    const arcMat = new THREE.MeshBasicMaterial({
      color: 0xffe066, transparent: true, opacity: 0.9, side: THREE.DoubleSide
    });
    this.arc = new THREE.Mesh(new THREE.RingGeometry(cfg.radius - 0.22, cfg.radius - 0.05, 40, 1, 0, 0.0001), arcMat);
    this.arc.rotation.x = -Math.PI / 2;
    this.arc.position.set(cfg.x, 0.03, cfg.z);
    scene.add(this.arc);

    // столбик-подсказка
    const pillarMat = new THREE.MeshBasicMaterial({
      color: cfg.color, transparent: true, opacity: 0.28
    });
    this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(cfg.radius - 0.1, cfg.radius - 0.1, 3, 16, 1, true), pillarMat);
    this.pillar.position.set(cfg.x, 1.5, cfg.z);
    scene.add(this.pillar);
  }

  update(dt, player) {
    const d = Math.hypot(player.pos.x - this.x, player.pos.z - this.z);
    const inside = d < this.radius && this.cooldown <= 0;

    if (this.cooldown > 0) this.cooldown -= dt;

    if (inside) {
      this.progress += dt * CFG.PRANK_FILL_RATE;
      if (this.progress >= 1) {
        this.progress = 0;
        this.cooldown = CFG.PRANK_COOLDOWN;
        return true;
      }
    } else {
      this.progress = Math.max(0, this.progress - dt * CFG.PRANK_DECAY);
    }

    // визуал
    if (this.progress > 0) {
      // пересоздаём геометрию дуги, чтобы не мучиться с uniform'ами
      this.arc.geometry.dispose();
      this.arc.geometry = new THREE.RingGeometry(
        this.radius - 0.22, this.radius - 0.05, 40, 1,
        0, Math.PI * 2 * this.progress
      );
      this.arc.visible = true;
    } else {
      this.arc.visible = false;
    }

    // пульсация если готов
    const t = this.scene.userData.time;
    const pulse = this.cooldown > 0
      ? 0.2
      : 0.5 + Math.sin(t * 3) * 0.15;
    this.ring.material.opacity = pulse;
    this.pillar.material.opacity = (this.cooldown > 0 ? 0.1 : 0.28) + Math.sin(t * 2) * 0.05;

    return false;
  }
}