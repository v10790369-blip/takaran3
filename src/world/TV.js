// Телевизор на тумбочке перед диваном. Экран светит на соседа и стену.
// Мы видим задник — контент не виден, но свечение работает.
import * as THREE from 'three';

export class TV {
    constructor(scene, x, z, rotY = 0) {
        this.scene = scene;
        this.pos = { x, z };
        this.rotY = rotY;

        this.mesh = this._buildMesh();
        this.mesh.position.set(x, 0, z);
        this.mesh.rotation.y = rotY;
        scene.add(this.mesh);

        this.t = Math.random() * 100;
        this.nearPlayer = false;
        this.channelHue = Math.random();
        this.channelTimer = 0;
        this.breakFlash = 0;    // для будущего «глюка» — сюда можно кидать импакт
    }

    _buildMesh() {
        const g = new THREE.Group();

        // ---- Тумбочка под телевизор ----
        const standMat = new THREE.MeshStandardMaterial({ color: 0x3a2418, roughness: 0.85 });
        const stand = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.7, 1.0), standMat);
        stand.position.set(0, 0.35, 0);
        stand.castShadow = true; stand.receiveShadow = true;
        g.add(stand);

        // Ручки на тумбочке
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x9a7a55, roughness: 0.4, metalness: 0.6 });
        for (const sx of [-0.9, 0.9]) {
            const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.06), handleMat);
            h.position.set(sx, 0.35, 0.52);
            g.add(h);
        }

        // ---- Корпус ТВ ----
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.6, metalness: 0.35 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.35), bodyMat);
        body.position.set(0, 1.4, 0);
        body.castShadow = true;
        g.add(body);

        // Ножка-подставка
        const legMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0e });
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.15, 0.4), legMat);
        leg.position.set(0, 0.78, 0);
        g.add(leg);

        // ---- Экран ----
        // Экран на ЛОКАЛЬНОЙ +z. При rotY=π это будет мировая -z → в сторону дивана.
        this.screenMat = new THREE.MeshBasicMaterial({
            color: 0x6090ff, transparent: true, opacity: 0.85
        });
        const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 1.2), this.screenMat);
        screen.position.set(0, 1.4, 0.18);
        g.add(screen);
        this.screen = screen;

        // ---- Свет от экрана на зрителя (соседа) ----
        // Локальная +z → мировая -z. Свет летит на диван.
        this.light = new THREE.PointLight(0x6090ff, 1.0, 9, 2);
        this.light.position.set(0, 1.5, 2.0);
        g.add(this.light);

        // ---- Мягкий wall-wash на стену за соседом ----
        // Локальная +z = 4.8 → мировая z ≈ TV.z - 4.8 = -14.3. Это почти у стены.
        this.wallLight = new THREE.PointLight(0x6090ff, 0.7, 7, 2);
        this.wallLight.position.set(0, 2.8, 4.8);
        g.add(this.wallLight);

        // ---- Световое пятно на полу перед ТВ ----
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x6090ff, transparent: true, opacity: 0.22,
            depthWrite: false, blending: THREE.AdditiveBlending
        });
        const glowDisc = new THREE.Mesh(new THREE.CircleGeometry(2.0, 26), glowMat);
        glowDisc.rotation.x = -Math.PI / 2;
        glowDisc.position.set(0, 0.025, 1.8);
        g.add(glowDisc);
        this.glowDisc = glowDisc;

        return g;
    }

    // Внешний флеш — для будущих «помех» при пакостях
    triggerGlitch() { this.breakFlash = 0.4; }

    update(dt, player) {
        this.t += dt;

        const dx = player.pos.x - this.pos.x;
        const dz = player.pos.z - this.pos.z;
        const dist = Math.hypot(dx, dz);
        this.nearPlayer = dist < 6;

        // Смена канала
        this.channelTimer -= dt;
        if (this.channelTimer <= 0) {
            this.channelTimer = this.nearPlayer ? 0.7 + Math.random() * 0.5 : 2.5 + Math.random() * 2;
            this.channelHue = Math.random();
        }

        // Помехи
        let glitchMul = 1;
        if (this.breakFlash > 0) {
            this.breakFlash -= dt;
            glitchMul = 2.5;
        }

        const color = new THREE.Color().setHSL(this.channelHue, 0.85, 0.55);

        // Экран
        this.screenMat.color.copy(color);
        this.screenMat.opacity = (0.72 + Math.sin(this.t * 20) * 0.12) * Math.min(1, glitchMul);

        // Основное свечение на соседа
        this.light.color.copy(color);
        this.light.intensity = ((this.nearPlayer ? 1.4 : 1.0) + Math.sin(this.t * 15) * 0.18) * glitchMul;

        // Отсвет на стену
        this.wallLight.color.copy(color);
        this.wallLight.intensity = ((this.nearPlayer ? 0.85 : 0.6) + Math.sin(this.t * 8) * 0.12) * glitchMul;

        // Пятно на полу
        this.glowDisc.material.color.copy(color);
        this.glowDisc.material.opacity = (0.16 + Math.sin(this.t * 8) * 0.08) * glitchMul;
    }
}