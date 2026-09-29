// Жена-повар с ножами.
import * as THREE from 'three';
import { Knife } from './Knife.js';

export class Wife {
    constructor(scene, pos) {
        this.scene = scene;
        this.pos = { x: pos.x, z: pos.z };
        this.rotY = pos.rotY || 0;
        this.state = 'cook';
        this.stateTimer = 0;
        this.throwCooldown = 2.5;

        this.mesh = this._buildMesh();
        this.mesh.position.set(this.pos.x, 0, this.pos.z);
        this.mesh.rotation.y = this.rotY;
        scene.add(this.mesh);

        this.knives = [];
    }

    _buildMesh() {
        const g = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: 0xf0b090, roughness: 0.85 });
        const dress = new THREE.MeshStandardMaterial({ color: 0xa04060, roughness: 0.9 });
        const apron = new THREE.MeshStandardMaterial({ color: 0xf0e8d0, roughness: 0.9 });
        const hair = new THREE.MeshStandardMaterial({ color: 0x3a1a10, roughness: 0.95 });

        const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.95, 1.3, 16), dress);
        skirt.position.y = 0.65; skirt.castShadow = true; g.add(skirt);

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.2, 0.85), dress);
        torso.position.y = 1.65; torso.castShadow = true; g.add(torso);

        const apronMesh = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.3, 0.04), apron);
        apronMesh.position.set(0, 1.5, 0.44); g.add(apronMesh);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), skin);
        head.position.y = 2.75; head.castShadow = true; g.add(head);
        g.userData.head = head;

        const hairMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.53, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hair);
        hairMesh.position.y = 2.85; g.add(hairMesh);

        const bun = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), hair);
        bun.position.set(0, 3.15, -0.3); g.add(bun);

        const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
        for (const sx of [-0.15, 0.15]) {
            const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), eyeMat);
            e.position.set(sx, 2.85, 0.42); g.add(e);
        }

        for (const sx of [-0.85, 0.85]) {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.2, 0.28), dress);
            arm.position.set(sx, 1.7, 0.15);
            arm.rotation.z = sx > 0 ? -0.3 : 0.3;
            arm.rotation.x = -0.4;
            arm.castShadow = true; g.add(arm);

            const hand = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), skin);
            hand.position.set(sx * 1.1, 1.35, 0.5); g.add(hand);
        }

        // Половник
        const ladle = new THREE.Group();
        const stick = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8),
            new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.7 })
        );
        stick.position.y = 0.45; ladle.add(stick);
        const bowl = new THREE.Mesh(
            new THREE.SphereGeometry(0.16, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0x8a8a8a, roughness: 0.4, metalness: 0.7 })
        );
        bowl.rotation.x = Math.PI; bowl.position.y = 0; ladle.add(bowl);
        ladle.position.set(0.95, 1.35, 0.5);
        ladle.rotation.z = -0.2;
        g.add(ladle);
        this.ladle = ladle;

        // Нож в руке
        const knifeHandle = new THREE.Mesh(
            new THREE.BoxGeometry(0.06, 0.3, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        knifeHandle.position.set(-0.95, 1.35, 0.5);
        g.add(knifeHandle);
        this.knifeInHand = knifeHandle;

        return g;
    }

    throwKnife(player) {
        if (this.state === 'throw') return;
        this.state = 'throw';
        this.stateTimer = 0.5;

        this.knifeInHand.visible = false;

        const from = { x: this.pos.x, y: 1.4, z: this.pos.z };
        const target = { x: player.pos.x, z: player.pos.z };
        this.knives.push(new Knife(this.scene, from, target));

        this.scene.events.emit('wife:throw');
    }

    setState(s, timer = 1) {
        this.state = s;
        this.stateTimer = timer;
    }

    // ⚠️ playerHidden — если true, не бросает и не бьёт
    update(dt, player, playerHidden = false) {
        const t = this.scene.userData.time;
        const head = this.mesh.userData.head;

        head.rotation.x = Math.sin(t * 2) * 0.05;
        head.rotation.y = Math.sin(t * 1.3) * 0.15;

        if (this.ladle) {
            this.ladle.rotation.z = -0.2 + Math.sin(t * 3) * 0.35;
            this.ladle.rotation.x = Math.sin(t * 3 + 1) * 0.2;
        }

        if (this.stateTimer > 0) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = 'cook';
                this.knifeInHand.visible = true;
            }
        }

        // Не бросает ножи в спрятанного игрока
        this.throwCooldown -= dt;
        if (this.throwCooldown <= 0 && this.state === 'cook' && !playerHidden) {
            this.throwCooldown = 3.5 + Math.random() * 2.5;
            this.throwKnife(player);
        }

        // Обновляем ножи — передаём флаг спрятанности
        for (let i = this.knives.length - 1; i >= 0; i--) {
            const k = this.knives[i];
            const hit = k.update(dt, player, playerHidden);
            if (hit) {
                this.scene.events.emit('wife:knife-hit');
                k.destroy();
                this.knives.splice(i, 1);
                continue;
            }
            if (k.isDead) {
                k.destroy();
                this.knives.splice(i, 1);
            }
        }
    }

    destroy() {
        this.scene.remove(this.mesh);
        for (const k of this.knives) k.destroy();
        this.knives = [];
    }
}