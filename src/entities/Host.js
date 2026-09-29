// Хозяин. Сидит на диване; на 5-й волне встаёт с фонариком и мухобойкой.
import * as THREE from 'three';
import { CFG } from '../config.js';

export class Host {
    constructor(scene, pos, physics = null) {
        this.scene = scene;
        this.physics = physics;
        this.homePos = { x: pos.x, z: pos.z };
        this.pos = { x: pos.x, z: pos.z };
        this.rotY = pos.rotY || 0;
        this.state = 'sleep';
        this.stateTimer = 0;

        this.couch = this._buildCouch();
        this.couch.position.set(pos.x, 0, pos.z);
        this.couch.rotation.y = this.rotY;
        scene.add(this.couch);

        this.mesh = this._buildMan();
        this.mesh.position.set(pos.x, 0.55, pos.z);
        this.mesh.rotation.y = this.rotY;
        scene.add(this.mesh);

        // Мухобойка — спрятана, пока не босс
        this.swatter = this._buildSwatter();
        this.swatter.visible = false;
        this.mesh.add(this.swatter);
        this.swatter.position.set(0.95, 0.7, 0.35);
        this.swatter.rotation.z = -0.5;

        // Фонарик
        this.flashlight = this._buildFlashlight();
        this.flashlight.visible = false;
        this.mesh.add(this.flashlight);
        this.flashlight.position.set(-0.9, 0.65, 0.6);
        this.flashlight.rotation.x = -0.2;

        // Босс
        this.isBoss = false;
        this.standAmount = 0;
        this.walkPhase = 0;
        this.isWalking = false;

        // Атака
        this.attackState = 'idle';   // idle | windup | swing | recover
        this.attackTimer = 0;

        // Радиус для физики
        this.radius = CFG.BOSS.RADIUS;
    }

    _buildCouch() {
        const g = new THREE.Group();
        const mat = new THREE.MeshStandardMaterial({ color: 0x7a3b2e, roughness: 0.95 });
        const cush = new THREE.MeshStandardMaterial({ color: 0x9a4b3e, roughness: 0.95 });
        const base = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.7, 2), mat);
        base.position.y = 0.35; base.castShadow = true; base.receiveShadow = true; g.add(base);
        const seat = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.35, 1.7), cush);
        seat.position.set(0, 0.85, 0.05); seat.castShadow = true; g.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.5, 0.4), mat);
        back.position.set(0, 1.45, -0.85); back.castShadow = true; g.add(back);
        for (const sx of [-1.6, 1.6]) {
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.1, 2), mat);
            arm.position.set(sx, 0.9, 0); arm.castShadow = true; g.add(arm);
        }
        return g;
    }

    _buildMan() {
        const g = new THREE.Group();
        const skin = new THREE.MeshStandardMaterial({ color: 0xefb08a, roughness: 0.85 });
        const shirt = new THREE.MeshStandardMaterial({ color: 0x3a6b8a, roughness: 0.9 });
        const pants = new THREE.MeshStandardMaterial({ color: 0x33383f, roughness: 0.9 });
        const hair = new THREE.MeshStandardMaterial({ color: 0x2b1a10, roughness: 0.95 });
        const sock = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.9 });

        const torso = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.5, 1.0), shirt);
        torso.position.y = 0.9; torso.castShadow = true; g.add(torso);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), skin);
        head.position.y = 2.0; head.castShadow = true; g.add(head);
        g.userData.head = head;

        const hairMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.52, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), hair);
        hairMesh.position.y = 2.1; g.add(hairMesh);

        const mustache = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.15), hair);
        mustache.position.set(0, 1.85, 0.45); g.add(mustache);

        // Руки
        this.arms = [];
        for (const sx of [-0.9, 0.9]) {
            const armGroup = new THREE.Group();
            armGroup.position.set(sx, 1.5, 0);

            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.3), shirt);
            arm.position.y = -0.6; arm.castShadow = true;
            armGroup.add(arm);

            const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), skin);
            hand.position.y = -1.2;
            armGroup.add(hand);

            armGroup.userData = { side: sx > 0 ? 1 : -1, baseRotZ: sx > 0 ? -0.15 : 0.15 };
            armGroup.rotation.z = armGroup.userData.baseRotZ;
            g.add(armGroup);
            this.arms.push(armGroup);
        }

        // Ноги
        // Ноги — СИДЯЧАЯ ПОЗА: бедро вперёд, голень вниз, ступня на пол
        this.legs = [];
        for (const sx of [-0.35, 0.35]) {
            const legGroup = new THREE.Group();
            legGroup.position.set(sx, 0.5, 0);   // бедро (hip)

            // Бедро — горизонтально вперёд (+z)
            const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.7), pants);
            thigh.position.set(0, -0.175, 0.35);
            thigh.castShadow = true;
            legGroup.add(thigh);

            // Голень — вертикально вниз от колена
            const shin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), pants);
            shin.position.set(0, -0.5, 0.7);
            shin.castShadow = true;
            legGroup.add(shin);

            // Ступня — горизонтально вперёд
            const sockMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.15, 0.5), sock);
            sockMesh.position.set(0, -0.87, 0.95);
            legGroup.add(sockMesh);

            legGroup.userData = { side: sx > 0 ? 1 : -1 };
            g.add(legGroup);
            this.legs.push(legGroup);
        }

        return g;
    }

    _buildSwatter() {
        const g = new THREE.Group();
        const stickMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2a, roughness: 0.7 });
        const netMat = new THREE.MeshStandardMaterial({ color: 0xc04040, roughness: 0.6 });
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });

        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), stickMat);
        stick.position.y = -0.7; g.add(stick);

        const frame = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.05, 8, 20), wireMat);
        frame.rotation.x = Math.PI / 2; frame.position.y = 0.18; g.add(frame);

        const net = new THREE.Mesh(new THREE.CircleGeometry(0.4, 16), netMat);
        net.rotation.x = -Math.PI / 2; net.position.y = 0.18; g.add(net);

        return g;
    }

    _buildFlashlight() {
        const g = new THREE.Group();
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4, metalness: 0.7 });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.35, 10), bodyMat);
        body.rotation.x = Math.PI / 2; g.add(body);

        const lens = new THREE.Mesh(
            new THREE.CircleGeometry(0.1, 12),
            new THREE.MeshBasicMaterial({ color: 0xffffcc })
        );
        lens.position.z = 0.18; lens.rotation.y = Math.PI; g.add(lens);

        this.spot = new THREE.SpotLight(0xffffcc, 2.5, 24, Math.PI / 7, 0.5, 1.4);
        this.spot.position.set(0, 0, 0.15);
        this.spot.castShadow = true;
        this.spot.shadow.mapSize.set(1024, 1024);
        this.spot.shadow.camera.near = 0.5;
        this.spot.shadow.camera.far = 24;
        g.add(this.spot);

        this.spotTarget = new THREE.Object3D();
        this.spotTarget.position.set(0, -0.4, 8);
        g.add(this.spotTarget);
        this.spot.target = this.spotTarget;

        const coneGeom = new THREE.ConeGeometry(1.9, 8, 20, 1, true);
        coneGeom.translate(0, -4, 0);
        coneGeom.rotateX(-Math.PI / 2);
        const coneMat = new THREE.MeshBasicMaterial({
            color: 0xffffcc, transparent: true, opacity: 0.1,
            side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
        });
        this.cone = new THREE.Mesh(coneGeom, coneMat);
        this.cone.position.z = 0.2;
        g.add(this.cone);

        return g;
    }

    setState(s, timer = 2) {
        if (this.state === 'frozen' || this.isBoss) return;
        if (this.state === s) { this.stateTimer = Math.max(this.stateTimer, timer); return; }
        this.state = s;
        this.stateTimer = timer;
        this.scene.events.emit('host:state', s);
    }

    freeze(seconds) {
        if (this.isBoss) return;
        this.state = 'frozen';
        this.stateTimer = seconds;
        this.scene.events.emit('host:state', 'frozen');
    }

    activateBoss() {
        this.isBoss = true;
        this.swatter.visible = true;
        this.flashlight.visible = true;
        this.state = 'boss';
        this.attackState = 'idle';
        this.attackTimer = 1.5;
        this.scene.events.emit('host:state', 'scream');
    }

    update(dt, player) {
        const t = this.scene.userData.time;
        const head = this.mesh.userData.head;

        if (this.isBoss) {
            this._updateBoss(dt, player, t, head);
            return;
        }

        this.standAmount += (0 - this.standAmount) * Math.min(1, dt * 3);
        this.mesh.position.y = 0.55;
        this.mesh.position.x = this.homePos.x;
        this.mesh.position.z = this.homePos.z;

        if (this.stateTimer > 0) {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0 && this.state !== 'sleep') this.setState('sleep');
        }

        if (this.state === 'sleep') {
            head.rotation.x = 0.4 + Math.sin(t * 1.5) * 0.05;
            head.rotation.y = 0;
        } else if (this.state === 'alert') {
            head.rotation.x = -0.1;
            head.rotation.y = Math.sin(t * 8) * 0.3;
        } else if (this.state === 'frozen') {
            head.rotation.x = -0.45;
            head.rotation.y = 0;
        } else {
            head.rotation.x = -0.3;
            head.rotation.y = 0;
            this.mesh.position.x = this.homePos.x + (Math.random() - 0.5) * 0.06;
        }

        for (const leg of this.legs) leg.rotation.x = -Math.PI / 4;
        for (const arm of this.arms) {
            arm.rotation.x = 0;
            arm.rotation.z = arm.userData.baseRotZ;
        }
    }

    _updateBoss(dt, player, t, head) {
        // Плавно встаём
        this.standAmount += (1 - this.standAmount) * Math.min(1, dt * 2.5);
        const targetY = 0.55 + this.standAmount * 0.45;
        this.mesh.position.y = targetY;

        // Первый выход из дивана
        if (!this._walkingAway) {
            const targetZ = this.homePos.z + this.standAmount * 0.8;
            this.mesh.position.z += (targetZ - this.mesh.position.z) * Math.min(1, dt * 2.5);
            if (Math.abs(targetZ - this.mesh.position.z) < 0.1) {
                this._walkingAway = true;
                this.pos.x = this.mesh.position.x;
                this.pos.z = this.mesh.position.z;
            }
            return;   // не атакуем пока вылезаем
        }

        // Дистанция до игрока
        const dx = player.pos.x - this.pos.x;
        const dz = player.pos.z - this.pos.z;
        const d = Math.hypot(dx, dz);

        // Всегда поворачиваемся к игроку
        if (d > 0.3) {
            const desired = Math.atan2(dx, dz);
            const angDiff = ((desired - this.rotY + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            this.rotY += angDiff * Math.min(1, dt * 5);
            this.mesh.rotation.y = this.rotY;
        }

        // ==== Атака ====
        this.attackTimer -= dt;

        if (this.attackState === 'idle') {
            // Ходим за игроком
            this.isWalking = d > 1.6;
            if (this.isWalking) {
                const speed = CFG.BOSS.SPEED;
                this.pos.x += (dx / d) * speed * dt;
                this.pos.z += (dz / d) * speed * dt;
                this.mesh.position.x = this.pos.x;
                this.mesh.position.z = this.pos.z;

                // Физика: не проваливаемся сквозь мебель
                if (this.physics) {
                    this.physics.resolveCircle(this.pos, this.radius);
                    this.physics.clampToBounds(this.pos, this.scene.userData.levelSize / 2, this.radius);
                    this.mesh.position.x = this.pos.x;
                    this.mesh.position.z = this.pos.z;
                }
            }

            // Запускаем замах, если игрок близко
            if (d < CFG.BOSS.CHASE_RANGE && this.attackTimer <= 0) {
                this.attackState = 'windup';
                this.attackTimer = CFG.BOSS.WINDUP;
                this.isWalking = false;
            }
        } else if (this.attackState === 'windup') {
            // Мухобойка задирается вверх
            const progress = 1 - this.attackTimer / CFG.BOSS.WINDUP;
            this.swatter.rotation.z = -0.5 - progress * 1.3;
            this.swatter.rotation.x = -progress * 0.3;
            this.arms[0].rotation.x = -progress * 1.2;    // правая рука поднимается

            if (this.attackTimer <= 0) {
                this.attackState = 'swing';
                this.attackTimer = CFG.BOSS.SWING;
            }
        } else if (this.attackState === 'swing') {
            // Резкий удар вниз
            this.swatter.rotation.z = 0.9;
            this.swatter.rotation.x = 0.5;
            this.arms[0].rotation.x = 0.6;

            if (this.attackTimer <= 0) {
                // УДАР!
                const hitDist = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);
                this.scene.events.emit('boss:swat', this.pos.x, this.pos.z,
                    hitDist < CFG.BOSS.SWING_RANGE);
                this.attackState = 'recover';
                this.attackTimer = CFG.BOSS.RECOVER;
            }
        } else if (this.attackState === 'recover') {
            // Медленно возвращаем мухобойку
            const progress = 1 - this.attackTimer / CFG.BOSS.RECOVER;
            this.swatter.rotation.z = 0.9 - progress * 1.4;
            this.swatter.rotation.x = 0.5 - progress * 0.3;
            this.arms[0].rotation.x = 0.6 * (1 - progress);

            if (this.attackTimer <= 0) {
                this.attackState = 'idle';
                this.attackTimer = CFG.BOSS.IDLE_BETWEEN;
            }
        }

        // Анимация ходьбы
        this.walkPhase += dt * (this.isWalking ? 10 : 2);
        const swing = this.isWalking ? 0.6 : 0;
        this.legs.forEach((leg, i) => {
            leg.rotation.x = Math.sin(this.walkPhase + i * Math.PI) * swing;
        });
        // Левая рука качается всегда
        if (this.arms[1]) {
            this.arms[1].rotation.x = Math.sin(this.walkPhase + Math.PI) * swing * 0.6;
        }

        // Голова смотрит вперёд
        head.rotation.x = -0.15;
        head.rotation.y = 0;

        // Фонарик
        if (this.flashlight) {
            this.flashlight.rotation.x = -0.1 + Math.sin(t * 3) * 0.03;
            this.flashlight.rotation.y = Math.sin(t * 1.5) * 0.05;
        }
    }
}