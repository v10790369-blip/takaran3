// Пасхалки на стенах: рисунки, пятна, отпечатки. Дают +5 срама если постоять рядом.
import * as THREE from 'three';

export class EasterEggs {
    constructor(scene, levelSize) {
        this.scene = scene;
        this.eggs = [];
        this._build(levelSize);
    }

    _build(size) {
        // Позиции на стенах кухни/зала (на южной или северной)
        const defs = [
            { type: 'sun', x: -8, z: -size / 2 + 0.24, ry: 0, y: 1.3 },
            { type: 'coffee', x: 5, z: -size / 2 + 0.24, ry: 0, y: 1.6 },
            { type: 'hand', x: 9, z: size / 2 - 0.24, ry: Math.PI, y: 1.5 },
            { type: 'drawing', x: -size / 2 + 0.24, z: -7, ry: Math.PI / 2, y: 1.8 },
        ];

        for (const d of defs) {
            const tex = this._makeTexture(d.type);
            const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
            const m = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat);
            m.position.set(d.x, d.y, d.z);
            m.rotation.y = d.ry;
            this.scene.add(m);
            this.eggs.push({ mesh: m, pos: { x: d.x, z: d.z }, found: false, timer: 0 });
        }
    }

    _makeTexture(type) {
        const c = document.createElement('canvas');
        c.width = c.height = 128;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 128, 128);

        if (type === 'sun') {
            ctx.strokeStyle = '#f0d040';
            ctx.lineWidth = 6;
            ctx.beginPath(); ctx.arc(64, 64, 26, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(64 + Math.cos(a) * 34, 64 + Math.sin(a) * 34);
                ctx.lineTo(64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48);
                ctx.stroke();
            }
        } else if (type === 'coffee') {
            ctx.fillStyle = 'rgba(90, 55, 25, 0.7)';
            ctx.beginPath(); ctx.ellipse(64, 64, 34, 30, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(60, 35, 15, 0.9)';
            ctx.beginPath(); ctx.ellipse(60, 60, 22, 18, 0.3, 0, Math.PI * 2); ctx.fill();
        } else if (type === 'hand') {
            ctx.fillStyle = 'rgba(180, 120, 80, 0.5)';
            // Ладошка
            ctx.beginPath(); ctx.ellipse(64, 80, 24, 30, 0, 0, Math.PI * 2); ctx.fill();
            // Пальцы
            for (let i = 0; i < 5; i++) {
                const x = 40 + i * 12;
                ctx.beginPath();
                ctx.ellipse(x, 40 + Math.abs(i - 2) * 4, 5, 18, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (type === 'drawing') {
            // Детский рисунок — домик + солнце
            ctx.strokeStyle = '#6a3a1c';
            ctx.lineWidth = 4;
            ctx.strokeRect(30, 60, 40, 40);
            ctx.beginPath();
            ctx.moveTo(25, 60); ctx.lineTo(50, 35); ctx.lineTo(75, 60); ctx.stroke();
            ctx.strokeStyle = '#f0c040';
            ctx.beginPath(); ctx.arc(95, 30, 10, 0, Math.PI * 2); ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }

    update(dt, player) {
        for (const egg of this.eggs) {
            if (egg.found) continue;
            const d = Math.hypot(player.pos.x - egg.pos.x, player.pos.z - egg.pos.z);
            if (d < 1.3) {
                egg.timer += dt;
                if (egg.timer >= 1.5) {
                    egg.found = true;
                    egg.mesh.visible = false;
                    this.scene.events.emit('easteregg:found', egg.pos.x, egg.pos.z);
                }
            } else {
                egg.timer = Math.max(0, egg.timer - dt * 2);
            }
        }
    }
}