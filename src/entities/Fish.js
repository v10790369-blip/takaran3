// Аквариум с рыбкой. Рыбка плавает по кругу.
import * as THREE from 'three';

export class Fish {
    constructor(scene, x, z) {
        this.scene = scene;
        this.pos = { x, z };
        this.stareTime = 0;
        this.zoningOut = false;

        this.mesh = this._buildAquarium();
        this.mesh.position.set(x, 0, z);
        scene.add(this.mesh);

        // Рыбка — отдельный объект, плавает внутри
        this.fish = this._buildFish();
        this.fish.position.set(0, 0.9, 0);
        this.mesh.add(this.fish);

        this.t = 0;
        this.fishAngle = 0;
    }

    _buildAquarium() {
        const g = new THREE.Group();

        // Подставка
        const standMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.8 });
        const stand = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.0), standMat);
        stand.position.y = 0.45; stand.castShadow = true; stand.receiveShadow = true;
        g.add(stand);

        // Стекло
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xaad4e8, transparent: true, opacity: 0.32,
            roughness: 0.05, metalness: 0.1, transmission: 0.9,
            side: THREE.DoubleSide, depthWrite: false
        });
        const glassBox = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.9, 0.9), glassMat);
        glassBox.position.y = 1.35;
        g.add(glassBox);

        // Вода
        const waterMat = new THREE.MeshPhysicalMaterial({
            color: 0x4a90b0, transparent: true, opacity: 0.35,
            roughness: 0.1, transmission: 0.85, side: THREE.DoubleSide
        });
        const water = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.78, 0.82), waterMat);
        water.position.y = 1.31;
        g.add(water);

        // Грунт
        const gravelMat = new THREE.MeshStandardMaterial({ color: 0x6a5a3a, roughness: 1 });
        const gravel = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), gravelMat);
        gravel.position.y = 0.97;
        g.add(gravel);

        // Растение
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x2a8a3a, side: THREE.DoubleSide });
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.5), plantMat);
            leaf.position.set(-0.5 + Math.cos(a) * 0.08, 1.25, 0.2 + Math.sin(a) * 0.08);
            leaf.rotation.y = a;
            leaf.rotation.x = -0.15;
            g.add(leaf);
        }

        // Пузырьки
        this.bubbles = [];
        for (let i = 0; i < 5; i++) {
            const b = new THREE.Mesh(
                new THREE.SphereGeometry(0.02 + Math.random() * 0.015, 6, 5),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
            );
            b.position.set(-0.6, 1.0 + Math.random() * 0.6, 0);
            b.userData.speed = 0.2 + Math.random() * 0.15;
            g.add(b);
            this.bubbles.push(b);
        }

        // Лампа сверху
        const lampMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e });
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.9), lampMat);
        lamp.position.y = 1.85;
        g.add(lamp);

        const lampLight = new THREE.PointLight(0xa0e0ff, 0.6, 4, 2);
        lampLight.position.set(0, 1.8, 0);
        g.add(lampLight);
        this.lampLight = lampLight;

        return g;
    }

    _buildFish() {
        const g = new THREE.Group();
        const orange = new THREE.MeshStandardMaterial({ color: 0xf08040, roughness: 0.5, metalness: 0.2 });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), orange);
        body.scale.set(1.5, 0.8, 0.7);
        g.add(body);

        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.15, 4), orange);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -0.18;
        g.add(tail);

        // Плавник
        const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 4), orange);
        fin.position.y = 0.08;
        fin.rotation.x = Math.PI / 2;
        g.add(fin);

        // Глаз
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 6, 5), eyeMat);
        eye.position.set(0.1, 0.03, 0.06);
        g.add(eye);

        return g;
    }

    update(dt, player) {
        this.t += dt;
        this.fishAngle += dt * 1.6;

        // Плавание по кругу
        const r = 0.35;
        this.fish.position.x = Math.cos(this.fishAngle) * r;
        this.fish.position.z = Math.sin(this.fishAngle) * r;
        this.fish.position.y = 1.35 + Math.sin(this.t * 2) * 0.05;
        this.fish.rotation.y = -this.fishAngle + Math.PI / 2;
        this.fish.rotation.z = Math.sin(this.t * 6) * 0.15;

        // Пузырьки
        for (const b of this.bubbles) {
            b.position.y += b.userData.speed * dt;
            if (b.position.y > 1.75) b.position.y = 1.0;
        }

        // Мерцание света
        this.lampLight.intensity = 0.5 + Math.sin(this.t * 4) * 0.1;

        // Игрок смотрит на рыбку?
        const d = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
        if (d < 2.0 && !this.zoningOut) {
            this.stareTime += dt;
            if (this.stareTime >= 2.5) {
                this.zoningOut = true;
                this.scene.events.emit('fish:zoneout');
            }
        } else {
            this.stareTime = Math.max(0, this.stareTime - dt * 1.5);
            if (this.stareTime < 0.5) this.zoningOut = false;
        }
    }
}