// Прожектор хозяина. Крутится, ловит Жору в конус.
import * as THREE from 'three';

export class Spotlight {
    constructor(scene, centerPos, radius = 8) {
        this.scene = scene;
        this.center = { x: centerPos.x, z: centerPos.z };
        this.radius = radius;

        this.angle = 0;                 // текущий угол луча
        this.speed = 0.35;              // рад/сек
        this.active = false;
        this.coneAngle = Math.PI / 6;   // ширина конуса в радианах (30°)

        // Сам конус света — плоский сектор на полу
        const coneGeom = new THREE.CircleGeometry(radius, 32, -this.coneAngle / 2, this.coneAngle);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffee88, transparent: true, opacity: 0.0,
            depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide
        });
        this.cone = new THREE.Mesh(coneGeom, coneMat);
        this.cone.rotation.x = -Math.PI / 2;
        this.cone.position.set(centerPos.x, 0.05, centerPos.z);
        scene.add(this.cone);

        // Источник света
        this.light = new THREE.SpotLight(0xffee88, 0, 16, this.coneAngle * 1.5, 0.4, 1.5);
        this.light.position.set(centerPos.x, 4, centerPos.z);
        this.light.target.position.set(centerPos.x + 3, 0, centerPos.z);
        scene.add(this.light);
        scene.add(this.light.target);
    }

    setActive(a) {
        this.active = a;
        this.cone.material.opacity = a ? 0.28 : 0;
        this.light.intensity = a ? 1.5 : 0;
    }

    update(dt, player) {
        if (!this.active) return false;

        this.angle += this.speed * dt;
        if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;

        this.cone.rotation.z = -this.angle;
        this.light.target.position.set(
            this.center.x + Math.cos(this.angle) * 5,
            0,
            this.center.z + Math.sin(this.angle) * 5
        );

        // Проверяем, в конусе ли игрок
        const dx = player.pos.x - this.center.x;
        const dz = player.pos.z - this.center.z;
        const dist = Math.hypot(dx, dz);
        if (dist > this.radius) return false;

        const playerAngle = Math.atan2(dz, dx);
        let diff = ((playerAngle - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        return Math.abs(diff) < this.coneAngle / 2;
    }

    destroy() {
        this.scene.remove(this.cone);
        this.scene.remove(this.light);
        this.scene.remove(this.light.target);
    }
}