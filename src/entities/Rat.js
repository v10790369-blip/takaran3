// Крыса-барыга. Чистая state-машина, редкие вызовы.
import * as THREE from 'three';

export class Rat {
    constructor(scene, pos) {
        this.scene = scene;
        this.pos = { x: pos.x, z: pos.z };

        // Фазы: waiting → calling → dialog → questGiven → questDone
        this.phase = 'waiting';
        this.phaseTimer = 15 + Math.random() * 10;   // первый вызов через 15-25 сек

        this.dialogOpened = false;
        this.bubble = null;
        this.bubbleTimer = 0;
        this.t = Math.random() * 100;

        this.mesh = this._buildMesh();
        this.mesh.position.set(pos.x, 0.3, pos.z);
        scene.add(this.mesh);
    }

    _buildMesh() {
        const g = new THREE.Group();
        const fur = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
        const fur2 = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
        const pink = new THREE.MeshStandardMaterial({ color: 0xd88a9a, roughness: 0.7 });
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0x881111, emissiveIntensity: 1.5 });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), fur);
        body.scale.set(1, 0.85, 1.7); body.castShadow = true; g.add(body);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), fur);
        head.position.set(0, 0.05, -0.65); head.castShadow = true; g.add(head);

        for (const sx of [-0.16, 0.16]) {
            const ear = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), pink);
            ear.position.set(sx, 0.25, -0.65);
            ear.rotation.y = sx > 0 ? -0.3 : 0.3; g.add(ear);
        }
        for (const sx of [-0.08, 0.08]) {
            const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), eyeMat);
            eye.position.set(sx, 0.1, -0.85); g.add(eye);
        }
        const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 5), pink);
        nose.position.set(0, 0.02, -0.9); g.add(nose);

        const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.01, 0.9, 6), fur2);
        tail.position.set(0, 0, 0.7); tail.rotation.x = Math.PI / 2.2; g.add(tail);

        return g;
    }

    // ==== Внешний API ====
    setPhase(p, timer = 0) {
        this.phase = p;
        this.phaseTimer = timer;
    }

    showBubble(text, duration = 3.5) {
        this.hideBubble();

        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(20,10,5,0.94)';
        ctx.strokeStyle = '#ffe066';
        ctx.lineWidth = 6;
        const r = 24;
        ctx.beginPath();
        ctx.moveTo(r, 8);
        ctx.lineTo(canvas.width - r, 8);
        ctx.quadraticCurveTo(canvas.width - 8, 8, canvas.width - 8, 8 + r);
        ctx.lineTo(canvas.width - 8, canvas.height - 8 - r);
        ctx.quadraticCurveTo(canvas.width - 8, canvas.height - 8, canvas.width - 8 - r, canvas.height - 8);
        ctx.lineTo(r, canvas.height - 8);
        ctx.quadraticCurveTo(8, canvas.height - 8, 8, canvas.height - 8 - r);
        ctx.lineTo(8, 8 + r);
        ctx.quadraticCurveTo(8, 8, r, 8);
        ctx.closePath();
        ctx.fill(); ctx.stroke();

        ctx.fillStyle = '#ffe066';
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(3, 0.75, 1);
        sprite.position.set(this.pos.x, 2.2, this.pos.z);
        sprite.renderOrder = 999;
        this.scene.add(sprite);
        this.bubble = sprite;
        this.bubbleTimer = duration;
    }

    hideBubble() {
        if (this.bubble) {
            this.scene.remove(this.bubble);
            this.bubble.material.map?.dispose();
            this.bubble.material.dispose();
            this.bubble = null;
            this.bubbleTimer = 0;
        }
    }

    destroy() {
        this.hideBubble();
        this.scene.remove(this.mesh);
        this.mesh.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }

    // ==== Логика ====
    update(dt, player) {
        this.t += dt;

        // Анимация покоя
        this.mesh.rotation.y = Math.sin(this.t * 0.8) * 0.15;
        this.mesh.position.y = 0.3 + Math.sin(this.t * 2) * 0.03;

        // Прыжки радости при выполнении
        if (this.phase === 'questDone') {
            this.mesh.position.y = 0.3 + Math.abs(Math.sin(this.t * 6)) * 0.4;
        }

        const dist = Math.hypot(player.pos.x - this.pos.x, player.pos.z - this.pos.z);

        // ==== Машина состояний ====
        switch (this.phase) {
            case 'waiting':
                // Молчит, ждёт первый вызов
                this.phaseTimer -= dt;
                if (this.phaseTimer <= 0) {
                    this.phase = 'calling';
                    this.phaseTimer = 18;    // 18 сек между вызовами
                    this.showBubble('Таракан! Иди сюда!', 3);
                    this.scene.events.emit('rat:call');
                }
                break;

            case 'calling':
                // Периодически зовёт, ждёт приближения
                this.phaseTimer -= dt;
                if (this.phaseTimer <= 0) {
                    this.phaseTimer = 18;
                    this.showBubble('Иди сюда, дело есть!', 3);
                    this.scene.events.emit('rat:call');
                }
                // Только тут можно открыть диалог
                if (dist < 3.5 && !this.dialogOpened) {
                    this.dialogOpened = true;
                    this.phase = 'dialog';
                    this.phaseTimer = 0;
                    this.hideBubble();
                    this.scene.events.emit('rat:dialog');
                }
                break;

            case 'dialog':
                // Ждёт, пока GameScene переключит phase
                break;

            case 'questGiven':
                // Задание выдано — молчит, никаких вызовов
                break;

            case 'questDone':
                // Радуется
                break;
        }

        // Пульсация пузыря
        if (this.bubbleTimer > 0) {
            this.bubbleTimer -= dt;
            if (this.bubble && this.bubble.material) {
                const s = 1 + Math.sin(this.t * 4) * 0.05;
                this.bubble.scale.set(3 * s, 0.75 * s, 1);
            }
            if (this.bubbleTimer <= 0 && this.bubble) {
                this.scene.remove(this.bubble);
                this.bubble.material.map?.dispose();
                this.bubble.material.dispose();
                this.bubble = null;
            }
        }
    }
}