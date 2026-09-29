// Лёгкая пыль/туман в воздухе — атмосфера.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Dust {
    constructor(scene, count = 70) {
        this.scene = scene;
        this.particles = [];

        const geom = new THREE.SphereGeometry(0.035, 5, 4);
        const mat = new THREE.MeshBasicMaterial({
            color: 0xffe8c0, transparent: true, opacity: 0.35,
            depthWrite: false, blending: THREE.AdditiveBlending
        });

        const half = CFG.KITCHEN_SIZE / 2 - 1;

        for (let i = 0; i < count; i++) {
            const m = new THREE.Mesh(geom, mat.clone());
            m.material.opacity = 0.15 + Math.random() * 0.3;
            m.position.set(
                (Math.random() - 0.5) * half * 2,
                0.5 + Math.random() * 3,
                (Math.random() - 0.5) * half * 2
            );
            m.userData.phase = Math.random() * Math.PI * 2;
            m.userData.speed = 0.1 + Math.random() * 0.2;
            m.userData.driftX = (Math.random() - 0.5) * 0.15;
            m.userData.driftZ = (Math.random() - 0.5) * 0.15;
            scene.add(m);
            this.particles.push(m);
        }

        this.t = 0;
    }

    update(dt) {
        this.t += dt;
        for (const p of this.particles) {
            p.position.y += Math.sin(this.t * p.userData.speed + p.userData.phase) * 0.15 * dt;
            p.position.x += p.userData.driftX * dt;
            p.position.z += p.userData.driftZ * dt;
            // плавный wrap по границам
            const lim = CFG.KITCHEN_SIZE / 2 - 0.5;
            if (p.position.x > lim) p.position.x = -lim;
            if (p.position.x < -lim) p.position.x = lim;
            if (p.position.z > lim) p.position.z = -lim;
            if (p.position.z < -lim) p.position.z = lim;
        }
    }
}