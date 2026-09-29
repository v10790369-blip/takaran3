// Метательный нож. Баллистика, втыкается в пол.
import * as THREE from 'three';

export class Knife {
    constructor(scene, from, target) {
        this.scene = scene;
        this.pos = { x: from.x, y: from.y, z: from.z };
        this.radius = 0.35;
        this.phase = 'flying';
        this.stuckTimer = 0;

        const dx = target.x - from.x;
        const dz = target.z - from.z;
        const dist = Math.max(2, Math.hypot(dx, dz));
        const speed = 12;
        const flightTime = dist / speed;

        this.vel = { x: dx / flightTime, y: 0.5 * 18 * flightTime, z: dz / flightTime };
        this.gravity = 18;

        this.mesh = this._buildMesh();
        this.mesh.position.set(from.x, from.y, from.z);
        scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const blade = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.5, 0.02),
            new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.15, metalness: 0.9 })
        );
        blade.position.y = 0.3; blade.castShadow = true; g.add(blade);

        const tip = new THREE.Mesh(
            new THREE.ConeGeometry(0.045, 0.15, 6),
            new THREE.MeshStandardMaterial({ color: 0xe8eef4, roughness: 0.1, metalness: 0.95 })
        );
        tip.position.y = 0.62; g.add(tip);

        const handle = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.28, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7 })
        );
        handle.position.y = -0.15; g.add(handle);

        return g;
    }

    // ⚠️ playerHidden — если true, не бьёт
    update(dt, player, playerHidden = false) {
        if (this.phase === 'flying') {
            this.vel.y -= this.gravity * dt;
            this.pos.x += this.vel.x * dt;
            this.pos.y += this.vel.y * dt;
            this.pos.z += this.vel.z * dt;

            this.mesh.rotation.y += dt * 20;
            this.mesh.rotation.x = -Math.PI / 2 + Math.atan2(this.vel.y, 10);
            this.mesh.position.set(this.pos.x, this.pos.y, this.pos.z);

            // Коллизия с игроком — только если он НЕ в норке
            if (!playerHidden) {
                const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
                if (d < this.radius + player.radius) return true;
            }

            if (this.pos.y <= 0.05) {
                this.phase = 'stuck';
                this.stuckTimer = 5;
                this.mesh.rotation.x = Math.PI / 2;
                this.mesh.position.y = 0.35;
            }
        } else {
            this.stuckTimer -= dt;
            if (this.stuckTimer < 1.5) {
                this.mesh.visible = Math.floor(this.stuckTimer * 8) % 2 === 0;
            }
        }
        return false;
    }

    get isDead() { return this.phase === 'stuck' && this.stuckTimer <= 0; }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
}