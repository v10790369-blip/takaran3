// Укради пельмень: еда, которую можно утащить в норку.
import * as THREE from 'three';

const FOODS = [
    { shape: 'dumpling', color: 0xf0d8a8, color2: 0xd8b878, size: 0.55 },
    { shape: 'cheese', color: 0xf0c040, color2: 0xd0a020, size: 0.5 },
    { shape: 'sausage', color: 0xb04030, color2: 0x802820, size: 0.55 },
    { shape: 'cracker', color: 0xe0b070, color2: 0xb08040, size: 0.45 },
];

export class Food {
    constructor(scene, x, z) {
        this.scene = scene;
        this.pos = { x, z };
        this.radius = 0.55;
        this.carried = false;
        this._dead = false;
        this.stealProgress = 0;
        this.points = 30;

        const cfg = FOODS[Math.floor(Math.random() * FOODS.length)];
        this.cfg = cfg;

        this.mesh = this._buildMesh(cfg);
        this.mesh.position.set(x, 0.3, z);
        scene.add(this.mesh);

        this.t = Math.random() * Math.PI * 2;
    }

    _buildMesh(cfg) {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.75 });
        const mat2 = new THREE.MeshStandardMaterial({ color: cfg.color2, roughness: 0.8 });

        if (cfg.shape === 'dumpling') {
            const body = new THREE.Mesh(new THREE.SphereGeometry(cfg.size, 12, 8), mat);
            body.scale.set(1, 0.7, 1); body.castShadow = true; g.add(body);
            const seam = new THREE.Mesh(new THREE.TorusGeometry(cfg.size * 0.85, 0.04, 5, 14), mat2);
            seam.rotation.x = Math.PI / 2; seam.position.y = 0.25; g.add(seam);
        } else if (cfg.shape === 'cheese') {
            const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.size, cfg.size * 0.7, cfg.size * 1.2), mat);
            body.castShadow = true; g.add(body);
            for (let i = 0; i < 3; i++) {
                const hole = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), mat2);
                hole.position.set(
                    (Math.random() - 0.5) * cfg.size * 0.7,
                    cfg.size * 0.3,
                    (Math.random() - 0.5) * cfg.size * 0.8
                );
                g.add(hole);
            }
        } else if (cfg.shape === 'sausage') {
            const body = new THREE.Mesh(new THREE.CylinderGeometry(cfg.size * 0.35, cfg.size * 0.35, cfg.size * 1.4, 10), mat);
            body.rotation.z = Math.PI / 2; body.castShadow = true; g.add(body);
            const cap = new THREE.Mesh(new THREE.SphereGeometry(cfg.size * 0.35, 8, 6), mat2);
            cap.position.x = cfg.size * 0.7; g.add(cap);
        } else {
            const body = new THREE.Mesh(new THREE.BoxGeometry(cfg.size, 0.12, cfg.size), mat);
            body.castShadow = true; g.add(body);
            const top = new THREE.Mesh(new THREE.BoxGeometry(cfg.size * 0.7, 0.04, cfg.size * 0.7), mat2);
            top.position.y = 0.06; g.add(top);
        }
        return g;
    }

    update(dt, player, inDen) {
        if (this._dead) return;

        this.t += dt * 2;

        if (this.carried) {
            // Следует за игроком со смещением
            const offX = Math.sin(player.faceAngle) * 0.6;
            const offZ = Math.cos(player.faceAngle) * 0.6;
            this.mesh.position.set(player.pos.x + offX, 0.5, player.pos.z + offZ);
            this.mesh.position.y = 0.5 + Math.sin(this.t * 3) * 0.06;
            return;
        }

        // Покачивание на полу
        this.mesh.rotation.y += dt * 0.6;
        this.mesh.position.y = 0.3 + Math.sin(this.t) * 0.05;

        // Проверка «схватить»
        const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
        if (d < this.radius + player.radius + 0.3) {
            this.stealProgress += dt;
            this.mesh.scale.setScalar(1 + Math.sin(this.t * 12) * 0.08);

            if (this.stealProgress >= 0.9) {
                // ВАЖНО: не берём, если игрок уже что-то несёт
                if (!player.carryingFood) {
                    this.carried = true;
                    this.mesh.scale.setScalar(1);
                } else {
                    this.stealProgress = 0;   // сбрасываем, пусть игрок сначала сбросит
                    this.mesh.scale.setScalar(1);
                }
            }
        } else {
            this.stealProgress = Math.max(0, this.stealProgress - dt * 2);
            this.mesh.scale.setScalar(1);
        }
    }

    deliver() {
        this._dead = true;
        return this.points;
    }

    destroy() {
        this._dead = true;
        this.scene.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
}