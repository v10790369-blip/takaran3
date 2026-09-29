// Собака. Патрулирует кухню; в норке игрок недосягаем.
import * as THREE from 'three';

export class Dog {
    constructor(scene, physics, pos) {
        this.scene = scene;
        this.physics = physics;
        this.pos = { x: pos.x, z: pos.z };
        this.home = { x: pos.x, z: pos.z };
        this.vel = { x: 0, z: 0 };
        this.angle = 0;
        this.radius = 1.0;
        this.speed = 9.5;

        this.awake = false;
        this.sleepTimer = 0;
        this.wanderTimer = 0;
        this.wanderAngle = 0;

        this.mesh = this._buildMesh();
        this.mesh.position.set(this.pos.x, 0, this.pos.z);
        scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const brown = new THREE.MeshStandardMaterial({ color: 0x8a5a30, roughness: 0.9 });
        const brown2 = new THREE.MeshStandardMaterial({ color: 0x6a4020, roughness: 0.9 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.85 });
        const tongue = new THREE.MeshStandardMaterial({ color: 0xc04050, roughness: 0.7 });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.85, 14, 10), brown);
        body.scale.set(1.3, 0.85, 2.0); body.position.y = 0.85; body.castShadow = true; g.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 10), brown);
        head.position.set(0, 1.25, 1.6); head.castShadow = true; g.add(head);

        const snout = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), brown2);
        snout.position.set(0, 1.1, 2.1); g.add(snout);

        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 5), dark);
        nose.position.set(0, 1.15, 2.35); g.add(nose);

        for (const sx of [-0.5, 0.5]) {
            const ear = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.5, 0.15), brown2);
            ear.position.set(sx, 1.55, 1.55);
            ear.rotation.z = sx > 0 ? 0.35 : -0.35; g.add(ear);
        }
        for (const sx of [-0.22, 0.22]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), dark);
            eye.position.set(sx, 1.4, 2.1); g.add(eye);
        }
        const tng = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.35), tongue);
        tng.position.set(0, 0.95, 2.25); g.add(tng);

        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.05, 1.2, 8), brown);
        tail.position.set(0, 1.1, -1.9); tail.rotation.x = -0.6; tail.castShadow = true; g.add(tail);
        this.tail = tail;

        this.legs = [];
        for (const [sx, sz] of [[-0.55, 0.9], [0.55, 0.9], [-0.55, -0.9], [0.55, -0.9]]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.75, 6), brown2);
            leg.position.set(sx, 0.375, sz); leg.castShadow = true; g.add(leg);
            this.legs.push(leg);
        }
        return g;
    }

    update(dt, player, playerHidden = false) {
        const t = this.scene.userData.time;

        // ====== ЕСЛИ ИГРОК СПРЯТАН — НИКОГДА НЕ ПРЕСЛЕДУЕТ ======
        if (playerHidden) {
            // Мгновенно теряем цель
            this.awake = false;
            this.sleepTimer = 0;

            // Спокойно патрулируем дом — БЕЗ bark, без chase
            this.wanderTimer -= dt;
            if (this.wanderTimer <= 0) {
                this.wanderTimer = 2 + Math.random() * 2;
                this.wanderAngle = Math.random() * Math.PI * 2;
            }

            const targetX = this.home.x + Math.cos(this.wanderAngle) * 4;
            const targetZ = this.home.z + Math.sin(this.wanderAngle) * 4;
            const dx = targetX - this.pos.x;
            const dz = targetZ - this.pos.z;
            const d = Math.hypot(dx, dz);

            if (d > 0.5) {
                const desired = Math.atan2(dx, dz);
                const angDiff = ((desired - this.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
                this.angle += angDiff * Math.min(1, dt * 3);
                this.vel.x = Math.sin(this.angle) * 2.5;
                this.vel.z = Math.cos(this.angle) * 2.5;
            } else {
                this.vel.x *= 0.8; this.vel.z *= 0.8;
            }

            this.pos.x += this.vel.x * dt;
            this.pos.z += this.vel.z * dt;
            if (this.physics) {
                this.physics.resolveCircle(this.pos, this.radius);
                this.physics.clampToBounds(this.pos, this.scene.userData.levelSize / 2, this.radius);
            }

            this.mesh.position.set(this.pos.x, 0, this.pos.z);
            this.mesh.rotation.y = this.angle;
            if (this.tail) this.tail.rotation.z = Math.sin(t * 6) * 0.2;

            const running = Math.hypot(this.vel.x, this.vel.z);
            const step = Math.sin(t * (8 + running * 2)) * 0.15 * Math.min(1, running / 3);
            for (let i = 0; i < this.legs.length; i++) {
                this.legs[i].position.y = 0.375 + ((i % 2 === 0) ? step : -step);
            }
            return;   // ← вышли, никакого преследования
        }

        // ====== ОБЫЧНАЯ ЛОГИКА ======
        const dist = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);

        if (!this.awake && dist < 5.5) {
            this.awake = true;
            this.sleepTimer = 8;
            this.scene.events.emit('dog:bark');
        }

        if (this.awake) {
            this.sleepTimer -= dt;
            const dx = player.pos.x - this.pos.x;
            const dz = player.pos.z - this.pos.z;
            const desired = Math.atan2(dx, dz);
            const angDiff = ((desired - this.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
            this.angle += angDiff * Math.min(1, dt * 5);
            this.vel.x = Math.sin(this.angle) * this.speed;
            this.vel.z = Math.cos(this.angle) * this.speed;
            if (this.sleepTimer <= 0) this.awake = false;
        } else {
            this.wanderTimer -= dt;
            if (this.wanderTimer <= 0) {
                this.wanderTimer = 1.5 + Math.random() * 2;
                this.wanderAngle = Math.random() * Math.PI * 2;
            }
            const targetX = this.home.x + Math.cos(this.wanderAngle) * 4;
            const targetZ = this.home.z + Math.sin(this.wanderAngle) * 4;
            const dx = targetX - this.pos.x;
            const dz = targetZ - this.pos.z;
            const d = Math.hypot(dx, dz);
            if (d > 0.5) {
                const desired = Math.atan2(dx, dz);
                const angDiff = ((desired - this.angle + Math.PI) % (Math.PI * 2)) - Math.PI;
                this.angle += angDiff * Math.min(1, dt * 3);
                this.vel.x = Math.sin(this.angle) * 2.5;
                this.vel.z = Math.cos(this.angle) * 2.5;
            } else {
                this.vel.x *= 0.8; this.vel.z *= 0.8;
            }
        }

        this.pos.x += this.vel.x * dt;
        this.pos.z += this.vel.z * dt;
        if (this.physics) {
            this.physics.resolveCircle(this.pos, this.radius);
            this.physics.clampToBounds(this.pos, this.scene.userData.levelSize / 2, this.radius);
        }

        this.mesh.position.set(this.pos.x, 0, this.pos.z);
        this.mesh.rotation.y = this.angle;

        if (this.tail) this.tail.rotation.z = Math.sin(t * 8) * 0.25;

        const running = Math.hypot(this.vel.x, this.vel.z);
        const step = Math.sin(t * (8 + running * 2)) * 0.15 * Math.min(1, running / 3);
        for (let i = 0; i < this.legs.length; i++) {
            this.legs[i].position.y = 0.375 + ((i % 2 === 0) ? step : -step);
        }
    }
}