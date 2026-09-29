// Тень Жоры на стенах. Четыре плоских пятна, следят за игроком.
import * as THREE from 'three';

export class WallShadows {
    constructor(scene, size, height) {
        this.scene = scene;
        this.size = size;
        this.height = height;

        const geom = new THREE.CircleGeometry(1, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x1a0a05, transparent: true, opacity: 0.35, depthWrite: false
        });

        // 4 тени — по одной на каждую стену
        this.shadows = [];
        const walls = [
            { axis: 'z', sign: -1, y: height * 0.35, pos: -size / 2 + 0.22, ry: 0 },       // север
            { axis: 'z', sign: 1, y: height * 0.35, pos: size / 2 - 0.22, ry: Math.PI },  // юг
            { axis: 'x', sign: -1, y: height * 0.35, pos: -size / 2 + 0.22, ry: Math.PI / 2 }, // запад
            { axis: 'x', sign: 1, y: height * 0.35, pos: size / 2 - 0.22, ry: -Math.PI / 2 }, // восток
        ];

        for (const w of walls) {
            const m = new THREE.Mesh(geom, mat.clone());
            m.position.y = w.y;
            m.rotation.y = w.ry;
            m.scale.set(0.6, 1.0, 1);
            this.scene.add(m);
            this.shadows.push({ mesh: m, wall: w });
        }
    }

    update(player) {
        for (const s of this.shadows) {
            const w = s.wall;
            const isZ = w.axis === 'z';

            // Проекция игрока на стену
            const along = isZ ? player.pos.x : player.pos.z;
            const perp = isZ ? player.pos.z : player.pos.x;

            // Положение пятна вдоль стены
            if (isZ) s.mesh.position.x = along;
            else s.mesh.position.z = along;

            // Насколько игрок близко к стене
            const wallCoord = w.pos;
            const dist = Math.abs(perp - wallCoord);
            const halfSize = this.size / 2;
            const closeness = Math.max(0, 1 - dist / halfSize);   // 1 у стены, 0 в центре

            // Размер и прозрачность
            const scaleX = 0.6 + closeness * 1.8;
            const scaleY = 0.9 + closeness * 2.2;
            s.mesh.scale.set(scaleX, scaleY, 1);
            s.mesh.material.opacity = 0.1 + closeness * 0.55;
        }
    }

    destroy() {
        for (const s of this.shadows) {
            this.scene.remove(s.mesh);
            s.mesh.geometry.dispose();
            s.mesh.material.dispose();
        }
    }
}