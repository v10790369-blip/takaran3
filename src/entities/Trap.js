// Ловушки хозяина: липкая лента, клейкая площадка, отравленная приманка.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Trap {
    constructor(scene, x, z, type) {
        this.scene = scene;
        this.pos = { x, z };
        this.type = type;              // 'sticky' | 'glue' | 'poison'
        this.radius = type === 'glue' ? 1.0 : 0.85;
        this.triggered = false;
        this.fadeTimer = 0;

        this.mesh = this._buildMesh();
        this.mesh.position.set(x, 0.02, z);
        scene.add(this.mesh);

        this.t = Math.random() * Math.PI * 2;
    }

    _buildMesh() {
        const g = new THREE.Group();
        if (this.type === 'sticky') {
            // Липкая лента — жёлто-коричневая лента
            const mat = new THREE.MeshStandardMaterial({ color: 0xd8b040, roughness: 0.4, metalness: 0.1 });
            const base = new THREE.Mesh(new THREE.BoxGeometry(2, 0.03, 0.5), mat);
            g.add(base);
            // Полоски клея
            const glueMat = new THREE.MeshBasicMaterial({ color: 0xa08020, transparent: true, opacity: 0.6 });
            for (let i = 0; i < 4; i++) {
                const strip = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.005, 0.06), glueMat);
                strip.position.set(0, 0.018, -0.18 + i * 0.12);
                g.add(strip);
            }
        } else if (this.type === 'glue') {
            // Клейкая площадка — круг
            const mat = new THREE.MeshBasicMaterial({ color: 0x3a2010, transparent: true, opacity: 0.85 });
            const disk = new THREE.Mesh(new THREE.CircleGeometry(this.radius, 20), mat);
            disk.rotation.x = -Math.PI / 2;
            g.add(disk);
            const rim = new THREE.Mesh(
                new THREE.RingGeometry(this.radius - 0.1, this.radius, 20),
                new THREE.MeshBasicMaterial({ color: 0x6a4020, transparent: true, opacity: 0.9 })
            );
            rim.rotation.x = -Math.PI / 2; rim.position.y = 0.005; g.add(rim);
        } else {
            // Отравленная приманка — тарелка с гадостью
            const mat = new THREE.MeshStandardMaterial({ color: 0x8a4a2a, roughness: 0.7 });
            const dish = new THREE.Mesh(new THREE.CylinderGeometry(this.radius, this.radius * 0.9, 0.08, 16), mat);
            dish.position.y = 0.04; dish.castShadow = true; g.add(dish);

            const poison = new THREE.Mesh(
                new THREE.CircleGeometry(this.radius * 0.8, 16),
                new THREE.MeshStandardMaterial({ color: 0x40a040, emissive: 0x20a020, emissiveIntensity: 0.6 })
            );
            poison.rotation.x = -Math.PI / 2;
            poison.position.y = 0.09;
            g.add(poison);
            this.poisonMesh = poison;
        }
        return g;
    }

    update(dt, player) {
        this.t += dt;

        // Пульсация для яда
        if (this.type === 'poison' && this.poisonMesh) {
            this.poisonMesh.material.emissiveIntensity = 0.4 + Math.sin(this.t * 3) * 0.3;
        }
        // Вращение ленты для пущей «живости»
        if (this.type === 'glue') {
            this.mesh.rotation.y += dt * 0.05;
        }

        if (this.fadeTimer > 0) {
            this.fadeTimer -= dt;
            this.mesh.scale.setScalar(Math.max(0, this.fadeTimer / 0.4));
        }

        const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
        if (d < this.radius + player.radius) return true;   // сработала
        return false;
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
}