// Жёлтое пятно от таракана при получении урона. Персистентно до конца раунда.
import * as THREE from 'three';

export class Splat {
    constructor(scene, x, z) {
        this.scene = scene;

        const g = new THREE.Group();

        // Основная клякса
        const main = new THREE.Mesh(
            new THREE.CircleGeometry(0.55 + Math.random() * 0.3, 12),
            new THREE.MeshBasicMaterial({
                color: 0xe8c840, transparent: true, opacity: 0.75, depthWrite: false
            })
        );
        main.rotation.x = -Math.PI / 2;
        main.position.set(x, 0.014, z);
        main.rotation.z = Math.random() * Math.PI;
        main.scale.set(1, 0.7, 1);
        g.add(main);

        // Мелкие брызги вокруг
        for (let i = 0; i < 5; i++) {
            const a = Math.random() * Math.PI * 2;
            const d = 0.6 + Math.random() * 0.4;
            const drop = new THREE.Mesh(
                new THREE.CircleGeometry(0.06 + Math.random() * 0.08, 8),
                new THREE.MeshBasicMaterial({
                    color: 0xe8c840, transparent: true, opacity: 0.65, depthWrite: false
                })
            );
            drop.rotation.x = -Math.PI / 2;
            drop.position.set(x + Math.cos(a) * d, 0.013, z + Math.sin(a) * d);
            g.add(drop);
        }

        this.mesh = g;
        scene.add(g);
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
}