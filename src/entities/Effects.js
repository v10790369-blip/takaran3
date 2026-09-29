// Пул частиц на плоскости XZ. Брызги, искры, пыль.
import * as THREE from 'three';

class Particle {
    constructor(scene) {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 6, 5),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })
        );
        this.mesh.visible = false;
        scene.add(this.mesh);
        this.active = false;
        this.vel = { x: 0, y: 0, z: 0 };
        this.life = 0; this.maxLife = 1;
    }
    spawn(x, y, z, vx, vy, vz, color, size, life) {
        this.mesh.position.set(x, y, z);
        this.mesh.material.color.setHex(color);
        this.mesh.material.opacity = 1;
        this.mesh.scale.setScalar(size);
        this.mesh.visible = true;
        this.vel = { x: vx, y: vy, z: vz };
        this.life = life; this.maxLife = life;
        this.active = true;
    }
    update(dt) {
        if (!this.active) return;
        this.vel.y -= 12 * dt;
        this.mesh.position.x += this.vel.x * dt;
        this.mesh.position.y += this.vel.y * dt;
        this.mesh.position.z += this.vel.z * dt;
        if (this.mesh.position.y < 0.05) {
            this.mesh.position.y = 0.05;
            this.vel.y *= -0.3; this.vel.x *= 0.7; this.vel.z *= 0.7;
        }
        this.life -= dt;
        this.mesh.material.opacity = Math.max(0, this.life / this.maxLife);
        if (this.life <= 0) { this.active = false; this.mesh.visible = false; }
    }
}

export class Effects {
    constructor(scene) {
        this.scene = scene;
        this.pool = [];
        for (let i = 0; i < 150; i++) this.pool.push(new Particle(scene));
    }
    _free() { return this.pool.find(p => !p.active); }

    burst(x, y, z, color, count = 12, speed = 4, size = 1, life = 0.8) {
        for (let i = 0; i < count; i++) {
            const p = this._free(); if (!p) return;
            const a = Math.random() * Math.PI * 2;
            const el = Math.random() * Math.PI * 0.5;
            const sp = speed * (0.5 + Math.random() * 0.5);
            p.spawn(
                x + (Math.random() - 0.5) * 0.2,
                y + (Math.random() - 0.5) * 0.2,
                z + (Math.random() - 0.5) * 0.2,
                Math.cos(a) * Math.cos(el) * sp,
                Math.sin(el) * sp + 2,
                Math.sin(a) * Math.cos(el) * sp,
                color, size * (0.7 + Math.random() * 0.6), life * (0.7 + Math.random() * 0.6)
            );
        }
    }
    crumbs(x, z) { this.burst(x, 0.3, z, 0xe8b84b, 8, 3, 0.6, 0.5); }
    prank(x, z, c) {
        this.burst(x, 0.6, z, c || 0xffe066, 26, 6, 1.2, 1.3);
        setTimeout(() => this.burst(x, 1.2, z, 0xffffff, 14, 5, 0.9, 1), 90);
    }
    slipperLand(x, z) { this.burst(x, 0.3, z, 0xcccccc, 12, 4, 0.8, 0.6); }
    sprayHit(x, y, z) { this.burst(x, y, z, 0x8aff8a, 20, 5, 1.4, 1.5); }
    damage(x, z) { this.burst(x, 0.8, z, 0xff4444, 16, 5, 1.1, 0.9); }
    update(dt) { for (const p of this.pool) p.update(dt); }
}