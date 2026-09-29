// Муравьиная процессия. 5 муравьёв маршируют гуськом.
import * as THREE from 'three';

export class Ants {
    constructor(scene, path) {
        this.scene = scene;
        this.path = path;   // { start: {x,z}, end: {x,z} }
        this.ants = [];
        this.t = 0;
        this.scattered = false;
        this.scatterTimer = 0;
        this.lifeTimer = 20;   // живут 20 сек и уходят
        this.done = false;

        this._build();
        this.scene.events.on('ants:scattered', (x, z) => this._scatter(x, z));
    }

    _build() {
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1008, roughness: 0.9 });

        for (let i = 0; i < 5; i++) {
            const g = new THREE.Group();
            // Тело
            const body = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), bodyMat);
            body.scale.set(1, 0.7, 1.4);
            g.add(body);
            // Голова
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), bodyMat);
            head.position.z = 0.1;
            g.add(head);
            // Усики
            for (const sx of [-0.03, 0.03]) {
                const ant = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.005, 0.005, 0.12, 4),
                    bodyMat
                );
                ant.position.set(sx, 0.05, 0.15);
                ant.rotation.x = -0.5;
                g.add(ant);
            }
            // Крошка в лапках (у 3-го)
            if (i === 2) {
                const crumb = new THREE.Mesh(
                    new THREE.DodecahedronGeometry(0.06, 0),
                    new THREE.MeshStandardMaterial({ color: 0xe8b84b, roughness: 0.85 })
                );
                crumb.position.set(0, 0.1, 0.1);
                g.add(crumb);
                g.userData.hasCrumb = true;
            }

            g.position.set(this.path.start.x, 0.08, this.path.start.z);
            this.scene.add(g);
            this.ants.push({ mesh: g, offset: i * 0.35, vel: { x: 0, z: 0 } });
        }
    }

    _scatter(x, z) {
        if (this.scattered) return;
        this.scattered = true;
        this.scatterTimer = 3;

        for (const ant of this.ants) {
            const a = Math.random() * Math.PI * 2;
            ant.vel.x = Math.cos(a) * 3;
            ant.vel.z = Math.sin(a) * 3;
        }
    }

    update(dt, player) {
        if (this.done) return;

        this.lifeTimer -= dt;
        if (this.lifeTimer <= 0 && !this.scattered) {
            // Уходим — просто исчезаем
            for (const ant of this.ants) this.scene.remove(ant.mesh);
            this.done = true;
            return;
        }

        this.t += dt;

        if (this.scattered) {
            this.scatterTimer -= dt;
            for (const ant of this.ants) {
                ant.mesh.position.x += ant.vel.x * dt;
                ant.mesh.position.z += ant.vel.z * dt;
                ant.vel.x *= 0.94; ant.vel.z *= 0.94;
                ant.mesh.rotation.y += dt * 15;
            }
            if (this.scatterTimer <= 0) {
                for (const ant of this.ants) this.scene.remove(ant.mesh);
                this.done = true;
            }
            return;
        }

        // Нормальный марш
        const dx = this.path.end.x - this.path.start.x;
        const dz = this.path.end.z - this.path.start.z;
        const len = Math.hypot(dx, dz);
        const dirX = dx / len, dirZ = dz / len;
        const totalTime = 14;   // пройти путь за 14 сек
        const progress = Math.min(1, this.t / totalTime);

        for (const ant of this.ants) {
            const p = Math.max(0, progress - ant.offset / len);
            ant.mesh.position.x = this.path.start.x + dirX * (p * len);
            ant.mesh.position.z = this.path.start.z + dirZ * (p * len);
            ant.mesh.position.y = 0.08 + Math.abs(Math.sin(this.t * 8 + ant.offset * 5)) * 0.03;
            ant.mesh.rotation.y = Math.atan2(dirX, dirZ);
            // Ножки-анимация
            // (пропустим для краткости)
        }

        if (progress >= 1) {
            for (const ant of this.ants) this.scene.remove(ant.mesh);
            this.done = true;
        }

        // Проверка столкновения
        if (!this.scattered) {
            for (const ant of this.ants) {
                const d = Math.hypot(player.pos.x - ant.mesh.position.x, player.pos.z - ant.mesh.position.z);
                if (d < player.radius + 0.25) {
                    this.scene.events.emit('ants:scattered', ant.mesh.position.x, ant.mesh.position.z);
                    break;
                }
            }
        }
    }

    destroy() {
        for (const ant of this.ants) this.scene.remove(ant.mesh);
        this.done = true;
    }
}