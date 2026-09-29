// Крошка. Покачивается, исчезает через время, притягивается магнитом.
import * as THREE from 'three';

export class Crumb {
    constructor(scene, x, z) {
        this.scene = scene;
        this.pos = { x, z };
        this.radius = 0.35;
        this.life = 15;
        this.maxLife = 15;

        this.mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.22, 0),
            new THREE.MeshStandardMaterial({
                color: 0xe8b84b, roughness: 0.85,
                emissive: 0x553311, emissiveIntensity: 0.4
            })
        );
        this.mesh.position.set(x, 0.22, z);
        this.mesh.castShadow = true;
        scene.add(this.mesh);

        this.t = Math.random() * Math.PI * 2;
    }

    update(dt, player) {
        this.life -= dt;
        this.t += dt * 3;

        // покачивание + вращение
        this.mesh.rotation.y += dt * 1.6;
        this.mesh.position.y = 0.22 + Math.sin(this.t) * 0.06;

        // мигание в конце жизни
        if (this.life < 3) {
            this.mesh.visible = Math.floor(this.life * 8) % 2 === 0;
        }

        // магнит из апгрейда
        if (player.hasMagnet) {
            const dx = player.pos.x - this.pos.x;
            const dz = player.pos.z - this.pos.z;
            const d = Math.hypot(dx, dz);
            if (d < 4.5 && d > 0.1) {
                const pull = 8 * dt / d;
                this.pos.x += dx * pull;
                this.pos.z += dz * pull;
                this.mesh.position.x = this.pos.x;
                this.mesh.position.z = this.pos.z;
            }
        }
    }

    get isDead() { return this.life <= 0; }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
    }
}