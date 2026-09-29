// Уровень 1: роскошный зал в стиле дворца.
import * as THREE from 'three';
import { Level } from './Level.js';

export class LivingRoom extends Level {
    getName() { return 'ЗАЛ'; }
    hasSpotlight() { return true; }

    build() {
        this._floor();
        this._walls();
        this._wainscot();
        this._pillars();
        this._mainCarpet();
        this._wallSconces();
        this._bookshelves();
        this._backAltar();
        this._doorArch();
        this._consoleTables();
        this._armchairs();
        this._plants();
        this._catBed();
        this._den();
        this._wallDecor();
        this._candles();
        this._lights();
    }

    getSpawnPos() { return { x: 0, z: 6 }; }
    getHostPos() { return { x: 2, z: -13, rotY: 0 }; }
    getPetPos() { return { x: -8, z: -10 }; }
    getTVPos() { return null; }
    getDenPos() { return { x: -14, z: 3 }; }
    getExitPos() { return { x: 13.5, z: 12 }; }
    getRatPos() { return null; }

    getPrankSpots() {
        return [
            { x: -9, z: -7, radius: 1.6, label: 'САХАРНИЦА', points: 10, color: 0xffffff },
            { x: 7, z: 9, radius: 1.6, label: 'ТАПОК', points: 15, color: 0x6c86ff },
            { x: 10, z: -5, radius: 1.6, label: 'ЩЁТКА', points: 20, color: 0x66d9ff },
        ];
    }

    /* ============ ПОЛ — мраморные плиты ============ */
    _floor() {
        const size = this.size;
        // Светлый мрамор с крупной плиткой
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xe8dfc8, roughness: 0.55 });
        const base = new THREE.Mesh(new THREE.PlaneGeometry(size, size), baseMat);
        base.rotation.x = -Math.PI / 2;
        base.receiveShadow = true;
        this.scene.add(base);

        // Тонкие швы между плитами 5×5
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xb8a888, transparent: true, opacity: 0.35 });
        const step = 5;
        for (let i = -size / 2 + step; i < size / 2; i += step) {
            const h = new THREE.Mesh(new THREE.PlaneGeometry(size, 0.04), lineMat);
            h.rotation.x = -Math.PI / 2;
            h.position.set(0, 0.005, i);
            this.scene.add(h);

            const v = new THREE.Mesh(new THREE.PlaneGeometry(0.04, size), lineMat);
            v.rotation.x = -Math.PI / 2;
            v.position.set(i, 0.005, 0);
            this.scene.add(v);
        }

        // Внутренний большой ромб — тонкая линия через центр
        const diagMat = new THREE.MeshBasicMaterial({ color: 0xb8a888, transparent: true, opacity: 0.22 });
        for (const s of [1, -1]) {
            const diag = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.4, 0.04), diagMat);
            diag.rotation.x = -Math.PI / 2;
            diag.rotation.z = Math.PI / 4 * s;
            diag.position.y = 0.006;
            this.scene.add(diag);
        }
    }

    /* ============ СТЕНЫ ============ */
    _walls() {
        const s = this.size, h = this.wallHeight;
        const mat = new THREE.MeshStandardMaterial({
            color: 0xd8c4a0, roughness: 0.9, side: THREE.DoubleSide
        });
        const mk = (w, x, z, ry = 0) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), mat);
            m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true;
            this.scene.add(m);
        };
        mk(s, 0, -s / 2); mk(s, 0, s / 2);
        mk(s, -s / 2, 0, Math.PI / 2); mk(s, s / 2, 0, Math.PI / 2);

        // Верхний карниз — ПЛОСКИЕ ПОЛОСЫ перед стеной (не Box!)
        // Box пересекается с толщиной стены → z-fighting.
        const corniceMat = new THREE.MeshStandardMaterial({
            color: 0x6a5030, roughness: 0.7, side: THREE.DoubleSide
        });
        const corniceH = 0.5;
        const corniceY = h - corniceH / 2 - 0.05;   // верх карниза чуть ниже верха стены
        const off = 0.02;   // смещение вперёд от плоскости стены

        const mkCornice = (w, x, z, ry = 0) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, corniceH), corniceMat);
            m.position.set(x, corniceY, z);
            m.rotation.y = ry;
            this.scene.add(m);
        };
        // Внутренние плоскости стен
        mkCornice(s, 0, -s / 2 + 0.2 + off, 0);            // север
        mkCornice(s, 0, s / 2 - 0.2 - off, Math.PI);      // юг
        mkCornice(s, -s / 2 + 0.2 + off, 0, Math.PI / 2); // запад
        mkCornice(s, s / 2 - 0.2 - off, 0, -Math.PI / 2); // восток
    }

    /* ============ ПАНЕЛИ ПО СТЕНАМ ============ */
    _wainscot() {
        const s = this.size;
        const mat = new THREE.MeshStandardMaterial({
            color: 0xa8905c, roughness: 0.75, side: THREE.DoubleSide
        });
        const wainH = 1.1;
        const wainY = 0.6;
        const off = 0.02;

        const mk = (w, x, z, ry = 0) => {
            const m = new THREE.Mesh(new THREE.PlaneGeometry(w, wainH), mat);
            m.position.set(x, wainY, z);
            m.rotation.y = ry;
            this.scene.add(m);
        };

        // Южная стена — цельная
        mk(s - 0.4, 0, s / 2 - 0.2 - off, Math.PI);
        // Северная — с разрывом под алтарь
        mk(s / 2 - 4, -(s / 4 + 2), -s / 2 + 0.2 + off, 0);
        mk(s / 2 - 4, (s / 4 + 2), -s / 2 + 0.2 + off, 0);
        // Западная
        mk(s / 2 - 2, -s / 2 + 0.2 + off, -(s / 4 + 1), Math.PI / 2);
        mk(s / 2 - 2, -s / 2 + 0.2 + off, (s / 4 + 1), Math.PI / 2);
        // Восточная
        mk(s / 2 - 2, s / 2 - 0.2 - off, -(s / 4 + 1), -Math.PI / 2);
        mk(s / 2 - 2, s / 2 - 0.2 - off, (s / 4 + 1), -Math.PI / 2);
    }

    /* ============ КОЛОННЫ — 8 штук по периметру ============ */
    _pillars() {
        const s = this.size;
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.75 });
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 0.7 });
        const capMat = new THREE.MeshStandardMaterial({ color: 0x8a7050, roughness: 0.5, metalness: 0.3 });

        const positions = [
            { x: -8, z: -8 }, { x: 8, z: -8 },
            { x: -8, z: 8 }, { x: 8, z: 8 },
            { x: -12, z: -12 }, { x: 12, z: -12 },
            { x: -12, z: 12 }, { x: 12, z: 12 },
        ];

        for (const p of positions) {
            const g = new THREE.Group();

            // База
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), baseMat);
            base.position.y = 0.15; base.castShadow = true; base.receiveShadow = true;
            g.add(base);

            // Ствол
            const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 3.6, 16), pillarMat);
            shaft.position.y = 2.1; shaft.castShadow = true;
            g.add(shaft);

            // Капитель
            const cap = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 1.3), capMat);
            cap.position.y = 4.1; cap.castShadow = true;
            g.add(cap);

            g.position.set(p.x, 0, p.z);
            this.scene.add(g);

            this.physics.addBox(p.x, p.z, 1.2, 1.2);
            this.obstacles.push({ x: p.x, z: p.z, sx: 1.2, sz: 1.2, label: 'КОЛОННА', height: 4 });
        }
    }

    /* ============ БОЛЬШОЙ КОВЁР С УЗОРОМ ============ */
    _mainCarpet() {
        const W = 8, D = 12;

        // Canvas с узором — ромб + кайма
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 768;
        const ctx = canvas.getContext('2d');

        // Фон — глубокий бордовый с плавным градиентом
        const bg = ctx.createRadialGradient(256, 384, 40, 256, 384, 500);
        bg.addColorStop(0, '#8a1a1a');
        bg.addColorStop(1, '#5a0f0f');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 512, 768);

        // Внешняя кайма (золото)
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 12;
        ctx.strokeRect(24, 24, 512 - 48, 768 - 48);
        ctx.lineWidth = 3;
        ctx.strokeRect(44, 44, 512 - 88, 768 - 88);

        // Второстепенная кайма (внутри)
        ctx.lineWidth = 6;
        ctx.strokeRect(72, 72, 512 - 144, 768 - 144);

        // Угловые цветочки
        const drawCorner = (cx, cy, s) => {
            ctx.fillStyle = '#d4af37';
            for (let a = 0; a < 4; a++) {
                const angle = a * Math.PI / 2 + Math.PI / 4;
                ctx.beginPath();
                ctx.ellipse(cx + Math.cos(angle) * s, cy + Math.sin(angle) * s, s * 0.5, s * 0.25, angle, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCorner(110, 110, 20);
        drawCorner(512 - 110, 110, 20);
        drawCorner(110, 768 - 110, 20);
        drawCorner(512 - 110, 768 - 110, 20);

        // Центральный ромб — большой
        ctx.save();
        ctx.translate(256, 384);
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(0, -160);
        ctx.lineTo(120, 0);
        ctx.lineTo(0, 160);
        ctx.lineTo(-120, 0);
        ctx.closePath();
        ctx.fill();

        // Внутренний ромб
        ctx.fillStyle = '#8a1a1a';
        ctx.beginPath();
        ctx.moveTo(0, -120);
        ctx.lineTo(90, 0);
        ctx.lineTo(0, 120);
        ctx.lineTo(-90, 0);
        ctx.closePath();
        ctx.fill();

        // Самый центр — маленький ромбик
        ctx.fillStyle = '#d4af37';
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.lineTo(38, 0);
        ctx.lineTo(0, 50);
        ctx.lineTo(-38, 0);
        ctx.closePath();
        ctx.fill();

        // Лучи от ромба
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * 55, Math.sin(a) * 55);
            ctx.lineTo(Math.cos(a) * 100, Math.sin(a) * 100);
            ctx.stroke();
        }
        ctx.restore();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        const carpetMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
        const carpet = new THREE.Mesh(new THREE.PlaneGeometry(W, D), carpetMat);
        carpet.rotation.x = -Math.PI / 2;
        carpet.position.set(0, 0.012, 0);
        carpet.receiveShadow = true;
        this.scene.add(carpet);

        // Подложка — тёмная, чтобы «утолщить» ковёр
        const padMat = new THREE.MeshStandardMaterial({ color: 0x2a0a0a, roughness: 1 });
        const pad = new THREE.Mesh(new THREE.PlaneGeometry(W + 0.2, D + 0.2), padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.position.set(0, 0.008, 0);
        this.scene.add(pad);
    }

    /* ============ ЛЮСТРА С СВЕЧАМИ ============ */
    _chandelier() {
        const g = new THREE.Group();
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.85 });

        // Цепь к потолку
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), goldMat);
        chain.position.y = 4.6;
        g.add(chain);

        // Верхний шар
        const top = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), goldMat);
        top.position.y = 3.8;
        g.add(top);

        // Основной каркас — тор
        const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.08, 8, 32), goldMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 3.0;
        g.add(ring);

        // Спицы — 8 штук от центра к кольцу
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.2, 6), goldMat);
            spoke.position.set(Math.cos(a) * 0.6, 3.0, Math.sin(a) * 0.6);
            spoke.rotation.z = Math.PI / 2;
            spoke.rotation.y = -a;
            g.add(spoke);
        }

        // 8 свечей на кольце
        const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.75 });
        this.chandelierFlames = [];
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            const cx = Math.cos(a) * 1.2;
            const cz = Math.sin(a) * 1.2;

            // Подставка свечи
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.08, 8), goldMat);
            cup.position.set(cx, 2.94, cz);
            g.add(cup);

            // Свеча
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), waxMat);
            candle.position.set(cx, 3.14, cz);
            g.add(candle);

            // Пламя (эмиссивный шар)
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.9 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), flameMat);
            flame.scale.set(1, 1.8, 1);
            flame.position.set(cx, 3.36, cz);
            g.add(flame);
            this.chandelierFlames.push(flame);

            // Мини-подсветка от свечи
            const cLight = new THREE.PointLight(0xffcc77, 0.3, 3, 2);
            cLight.position.set(cx, 3.36, cz);
            g.add(cLight);
        }

        // Центральный свет
        const mainLight = new THREE.PointLight(0xffddaa, 1.4, 20, 2);
        mainLight.position.set(0, 3.0, 0);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.set(1024, 1024);
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 20;
        g.add(mainLight);

        this.scene.add(g);
    }

    /* ============ СТЕННЫЕ БРА (по 2-3 на стену) ============ */
    _wallSconces() {
        const s = this.size;
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.35, metalness: 0.85 });
        const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.75 });
        this.sconceFlames = [];

        const mkSconce = (x, z, ry) => {
            const g = new THREE.Group();

            // Кронштейн
            const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.4), goldMat);
            bracket.position.set(0, 1.8, 0.2);
            g.add(bracket);

            // Чаша
            const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 0.1, 10), goldMat);
            cup.position.set(0, 1.85, 0.4);
            g.add(cup);

            // Свеча
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), waxMat);
            candle.position.set(0, 2.05, 0.4);
            g.add(candle);

            // Пламя
            const flameMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0.9 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), flameMat);
            flame.scale.set(1, 1.8, 1);
            flame.position.set(0, 2.25, 0.4);
            g.add(flame);
            this.sconceFlames.push(flame);

            // Свет
            const light = new THREE.PointLight(0xffbb55, 0.7, 6, 2);
            light.position.set(0, 2.2, 0.5);
            g.add(light);

            g.position.set(x, 0, z);
            g.rotation.y = ry;
            this.scene.add(g);
        };

        // Южная стена — 2 бра слева/справа от входа
        mkSconce(-6, s / 2 - 0.3, Math.PI);
        mkSconce(6, s / 2 - 0.3, Math.PI);

        // Северная — по краям алтаря
        mkSconce(-6, -s / 2 + 0.3, 0);
        mkSconce(6, -s / 2 + 0.3, 0);

        // Западная — 3 штуки
        mkSconce(-s / 2 + 0.3, -6, Math.PI / 2);
        mkSconce(-s / 2 + 0.3, 0, Math.PI / 2);
        mkSconce(-s / 2 + 0.3, 6, Math.PI / 2);

        // Восточная — 3 штуки
        mkSconce(s / 2 - 0.3, -6, -Math.PI / 2);
        mkSconce(s / 2 - 0.3, 0, -Math.PI / 2);
        mkSconce(s / 2 - 0.3, 6, -Math.PI / 2);
    }

    /* ============ КНИЖНЫЕ ШКАФЫ (2 штуки у задней стены) ============ */
    _bookshelves() {
        const s = this.size;
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.75 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.7 });

        const mkShelf = (cx, cz) => {
            const g = new THREE.Group();

            // Каркас
            const left = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.6), woodMat);
            left.position.set(-1.3, 1.4, 0); g.add(left);

            const right = left.clone(); right.position.x = 1.3; g.add(right);

            const backPanel = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.8, 0.05), woodMat);
            backPanel.position.set(0, 1.4, -0.3); g.add(backPanel);

            // Полки
            for (let i = 0; i < 5; i++) {
                const shelf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.6), woodMat);
                shelf.position.y = 0.3 + i * 0.55; shelf.castShadow = true; shelf.receiveShadow = true;
                g.add(shelf);
            }

            // Верхний карниз с золотом
            const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 0.7), brassMat);
            top.position.y = 2.85;
            g.add(top);

            // Книги
            const bookColors = [0xa04040, 0x4060a0, 0x40a060, 0xe0c040, 0x8040a0, 0xd08040, 0x60a0a0];
            for (let shelf = 0; shelf < 5; shelf++) {
                const y = 0.42 + shelf * 0.55;
                let x = -1.2;
                while (x < 1.15) {
                    const w = 0.07 + Math.random() * 0.08;
                    const h = 0.3 + Math.random() * 0.15;
                    const book = new THREE.Mesh(
                        new THREE.BoxGeometry(w, h, 0.42),
                        new THREE.MeshStandardMaterial({
                            color: bookColors[Math.floor(Math.random() * bookColors.length)],
                            roughness: 0.8
                        })
                    );
                    book.position.set(x + w / 2, y + h / 2, 0);
                    book.castShadow = true;
                    g.add(book);
                    x += w + 0.01;
                    if (Math.random() < 0.1) x += 0.06;
                }
            }

            g.position.set(cx, 0, cz);
            this.scene.add(g);

            this.physics.addBox(cx, cz, 2.8, 0.7);
            this.obstacles.push({ x: cx, z: cz, sx: 2.8, sz: 0.7, label: 'ШКАФ', height: 2.9 });
        };

        mkShelf(-10, -s / 2 + 0.7);
        mkShelf(10, -s / 2 + 0.7);
    }

    /* ============ АЛТАРЬ У ЗАДНЕЙ СТЕНЫ ============ */
    /* ============ АЛТАРЬ У ЗАДНЕЙ СТЕНЫ ============ */
    _backAltar() {
        const s = this.size;
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.75 });
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37, roughness: 0.35, metalness: 0.85, side: THREE.DoubleSide
        });

        // Подиум
        const podium = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 2), woodMat);
        podium.position.set(0, 0.2, -s / 2 + 1.5);
        podium.receiveShadow = true; podium.castShadow = true;
        this.scene.add(podium);

        // Ступеньки
        for (let i = 1; i <= 2; i++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(6 + i * 0.5, 0.15, 0.6), woodMat);
            step.position.set(0, 0.35 + i * 0.05, -s / 2 + 2.5 + (i - 1) * 0.5);
            this.scene.add(step);
        }

        // Алтарный стол
        const altarTop = new THREE.Mesh(new THREE.BoxGeometry(3, 0.15, 1.2), woodMat);
        altarTop.position.set(0, 1.05, -s / 2 + 1.5);
        altarTop.castShadow = true; altarTop.receiveShadow = true;
        this.scene.add(altarTop);

        const altarBody = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1), woodMat);
        altarBody.position.set(0, 0.6, -s / 2 + 1.5);
        this.scene.add(altarBody);

        // Коврик на алтаре
        const cloth = new THREE.Mesh(
            new THREE.PlaneGeometry(1.8, 0.7),
            new THREE.MeshStandardMaterial({ color: 0x8a1a1a, roughness: 0.95 })
        );
        cloth.rotation.x = -Math.PI / 2;
        cloth.position.set(0, 1.13, -s / 2 + 1.5);
        this.scene.add(cloth);

        // Канделябры на алтаре
        for (const dx of [-1, 1]) {
            const candleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.15, 10), goldMat);
            candleBase.position.set(dx, 1.2, -s / 2 + 1.5);
            this.scene.add(candleBase);

            const candle = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8),
                new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.75 })
            );
            candle.position.set(dx, 1.45, -s / 2 + 1.5);
            this.scene.add(candle);
        }

        this.physics.addBox(0, -s / 2 + 1.5, 6, 2);
        this.obstacles.push({ x: 0, z: -s / 2 + 1.5, sx: 6, sz: 2, label: 'АЛТАРЬ', height: 1.1 });

        // === Картина над алтарём ===
        const wallZ = -s / 2 + 0.2;   // внутренняя плоскость стены
        const off = 0.03;

        // Canvas с пейзажем
        const canvas = document.createElement('canvas');
        canvas.width = 512; canvas.height = 320;
        const ctx = canvas.getContext('2d');

        const sky = ctx.createLinearGradient(0, 0, 0, 200);
        sky.addColorStop(0, '#4a6ea0');
        sky.addColorStop(0.6, '#c09060');
        sky.addColorStop(1, '#e0a060');
        ctx.fillStyle = sky; ctx.fillRect(0, 0, 512, 200);

        ctx.fillStyle = '#ffe080';
        ctx.beginPath(); ctx.arc(380, 130, 30, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#5a6a8a';
        ctx.beginPath();
        ctx.moveTo(0, 200);
        ctx.lineTo(80, 100); ctx.lineTo(180, 160); ctx.lineTo(260, 90);
        ctx.lineTo(360, 160); ctx.lineTo(430, 110); ctx.lineTo(512, 180);
        ctx.lineTo(512, 200); ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3a4a5a';
        ctx.beginPath();
        ctx.moveTo(0, 240);
        ctx.lineTo(120, 180); ctx.lineTo(240, 230); ctx.lineTo(340, 190);
        ctx.lineTo(440, 240); ctx.lineTo(512, 220);
        ctx.lineTo(512, 240); ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3a5a3a'; ctx.fillRect(0, 240, 512, 80);

        const paintingTex = new THREE.CanvasTexture(canvas);
        paintingTex.colorSpace = THREE.SRGBColorSpace;

        // Рама — ПЛОСКАЯ, перед стеной
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), goldMat);
        frame.position.set(0, 2.6, wallZ + off);
        this.scene.add(frame);

        // Картина — ещё на 1.5 см перед рамой
        const painting = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 1.5),
            new THREE.MeshBasicMaterial({ map: paintingTex })
        );
        painting.position.set(0, 2.6, wallZ + off + 0.015);
        this.scene.add(painting);
    }

    /* ============ АРКА-ВХОД ============ */
    _doorArch() {
        const s = this.size;
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x5a5040, roughness: 0.75 });
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x2a1a10, roughness: 0.8 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.85 });

        // Дверь — на южной стене
        const door = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.2, 0.15), woodMat);
        door.position.set(0, 1.6, s / 2 - 0.28);
        this.scene.add(door);

        // Панели на двери
        for (const dx of [-0.6, 0.6]) {
            const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.05), brassMat);
            panel.position.set(dx, 2.3, s / 2 - 0.35);
            this.scene.add(panel);

            const panel2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.05), brassMat);
            panel2.position.set(dx, 0.9, s / 2 - 0.35);
            this.scene.add(panel2);
        }

        // Ручка
        const handle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), brassMat);
        handle.position.set(-0.4, 1.5, s / 2 - 0.4);
        this.scene.add(handle);

        // Колонны вокруг двери
        for (const dx of [-1.8, 1.8]) {
            const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.6, 0.5), stoneMat);
            col.position.set(dx, 1.8, s / 2 - 0.4);
            col.castShadow = true;
            this.scene.add(col);

            const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), brassMat);
            cap.position.set(dx, 3.7, s / 2 - 0.4);
            this.scene.add(cap);

            const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.7), brassMat);
            base.position.set(dx, 0.12, s / 2 - 0.4);
            this.scene.add(base);

            this.physics.addBox(dx, s / 2 - 0.4, 0.6, 0.6);
        }

        // Ковровая дорожка у входа
        const runway = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 3),
            new THREE.MeshStandardMaterial({ color: 0x7a1010, roughness: 0.95 })
        );
        runway.rotation.x = -Math.PI / 2;
        runway.position.set(0, 0.011, s / 2 - 2.5);
        this.scene.add(runway);

        // Золотая кайма
        const trimMat = new THREE.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0.65 });
        for (const d of [{ w: 2, h: 0.1, x: 0, z: s / 2 - 4 }, { w: 2, h: 0.1, x: 0, z: s / 2 - 1 }]) {
            const t = new THREE.Mesh(new THREE.PlaneGeometry(d.w, d.h), trimMat);
            t.rotation.x = -Math.PI / 2;
            t.position.set(d.x, 0.012, d.z);
            this.scene.add(t);
        }
    }

    /* ============ КОНСОЛЬНЫЕ СТОЛИКИ (4 по углам центра) ============ */
    _consoleTables() {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a14, roughness: 0.75 });
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.75 });
        const candleMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.75 });

        const mkConsole = (cx, cz, rotY) => {
            const g = new THREE.Group();

            // Столешница
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.7), woodMat);
            top.position.y = 0.9; top.castShadow = true; top.receiveShadow = true;
            g.add(top);

            // Ножки
            for (const [sx, sz] of [[-0.75, -0.25], [0.75, -0.25], [-0.75, 0.25], [0.75, 0.25]]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), woodMat);
                leg.position.set(sx, 0.45, sz);
                leg.castShadow = true;
                g.add(leg);
            }

            // Золотая полоса снизу столешницы
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.05, 0.75), brassMat);
            stripe.position.y = 0.85;
            g.add(stripe);

            // Канделябр — два свечных держателя
            for (const dx of [-0.5, 0.5]) {
                const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.1, 8), brassMat);
                holder.position.set(dx, 1.0, 0);
                g.add(holder);

                const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8), candleMat);
                candle.position.set(dx, 1.18, 0);
                g.add(candle);

                const flame = new THREE.Mesh(
                    new THREE.SphereGeometry(0.05, 8, 6),
                    new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0 })
                );
                flame.scale.set(1, 1.8, 1);
                flame.position.set(dx, 1.36, 0);
                g.add(flame);

                const light = new THREE.PointLight(0xffbb55, 0, 4, 2);
                light.position.set(dx, 1.4, 0);
                g.add(light);

                if (!this.consoleFlames) this.consoleFlames = [];
                this.consoleFlames.push({ flame, light, phase: Math.random() * Math.PI * 2 });
            }

            // Ваза с цветами (декор)
            const vase = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.12, 0.25, 12),
                new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.6 })
            );
            vase.position.set(0, 1.05, 0);
            g.add(vase);

            g.position.set(cx, 0, cz);
            g.rotation.y = rotY;
            this.scene.add(g);

            this.physics.addBox(cx, cz, 1.8, 0.7);
            this.obstacles.push({ x: cx, z: cz, sx: 1.8, sz: 0.7, label: 'СТОЛИК', height: 0.95 });
        };

        // 4 столика по углам большого ковра
        mkConsole(-6, -7, 0);              // 🍬 САХАРНИЦА (-9, -7) — рядом на полу будет стоять сахарница
        mkConsole(6, -7, 0);
        mkConsole(-6, 7, Math.PI);
        mkConsole(6, 7, Math.PI);

        // 🍬 Сахарница — на первом столике
        const sugarBase = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.12, 0.18, 14),
            new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.5 })
        );
        sugarBase.position.set(-9, 1.02, -7);
        sugarBase.castShadow = true;
        this.scene.add(sugarBase);

        const sugarLid = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
            new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.5 })
        );
        sugarLid.position.set(-9, 1.11, -7);
        this.scene.add(sugarLid);

        const sugarKnob = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x8a5a2b })
        );
        sugarKnob.position.set(-9, 1.24, -7);
        this.scene.add(sugarKnob);
    }

    /* ============ КРЕСЛА ============ */
    _armchairs() {
        const fabricMat = new THREE.MeshStandardMaterial({ color: 0x6a1a1a, roughness: 0.9 });
        const cushionMat = new THREE.MeshStandardMaterial({ color: 0x8a2a2a, roughness: 0.9 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.75 });

        const mkChair = (cx, cz, rotY) => {
            const g = new THREE.Group();

            // Сиденье
            const seat = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.25, 1.1), cushionMat);
            seat.position.y = 0.5; seat.castShadow = true; seat.receiveShadow = true;
            g.add(seat);

            // Спинка
            const back = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.2), fabricMat);
            back.position.set(0, 1.1, -0.45); back.castShadow = true;
            g.add(back);

            // Подлокотники
            for (const sx of [-0.55, 0.55]) {
                const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.55, 1.1), fabricMat);
                arm.position.set(sx, 0.75, 0); arm.castShadow = true;
                g.add(arm);
            }

            // Ножки с золотом
            for (const [sx, sz] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.38, 8), goldMat);
                leg.position.set(sx, 0.19, sz); leg.castShadow = true;
                g.add(leg);
            }

            g.position.set(cx, 0, cz);
            g.rotation.y = rotY;
            this.scene.add(g);

            this.physics.addBox(cx, cz, 1.2, 1.2);
            this.obstacles.push({ x: cx, z: cz, sx: 1.2, sz: 1.2, label: 'КРЕСЛО', height: 1.5 });
        };

        // 4 кресла по бокам от ковра, лицом к центру
        mkChair(-7, -2, -Math.PI / 2);
        mkChair(7, -2, Math.PI / 2);
        mkChair(-7, 3, -Math.PI / 2);
        mkChair(7, 3, Math.PI / 2);

        // 🥿 Тапок лежит на полу у правого кресла (пранк-спот 7,9)
        // Отдельное правое кресло чуть ниже
        mkChair(7, 9, Math.PI);
    }

    /* ============ РАСТЕНИЯ В КАДКАХ ============ */
    _plants() {
        const s = this.size;
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x2a7a3a, roughness: 0.7, side: THREE.DoubleSide });
        const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3a9a4a, roughness: 0.7, side: THREE.DoubleSide });
        const potMat = new THREE.MeshStandardMaterial({ color: 0x6a3a1a, roughness: 0.8 });

        const mkPlant = (cx, cz, scale = 1) => {
            const g = new THREE.Group();

            // Горшок
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.6, 12), potMat);
            pot.position.y = 0.3; pot.castShadow = true;
            g.add(pot);

            // Земля
            const dirt = new THREE.Mesh(new THREE.CircleGeometry(0.36, 12),
                new THREE.MeshStandardMaterial({ color: 0x3a2010 }));
            dirt.rotation.x = -Math.PI / 2;
            dirt.position.y = 0.6;
            g.add(dirt);

            // Листья — веерные, как папоротник
            const leafCount = 9;
            for (let i = 0; i < leafCount; i++) {
                const a = (i / leafCount) * Math.PI * 2;
                const leafMatUse = i % 2 === 0 ? leafMat : leafMat2;

                const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 1.3), leafMatUse);
                leaf.position.set(Math.cos(a) * 0.15, 1.2, Math.sin(a) * 0.15);
                leaf.rotation.y = a;
                leaf.rotation.z = Math.sin(a) * 0.4;
                leaf.rotation.x = -0.4 - Math.random() * 0.3;
                leaf.castShadow = true;
                g.add(leaf);
            }

            // Центральный высокий лист
            const center = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1.6), leafMat);
            center.position.y = 1.4;
            center.rotation.x = -0.2;
            center.castShadow = true;
            g.add(center);

            g.position.set(cx, 0, cz);
            g.scale.setScalar(scale);
            this.scene.add(g);

            this.physics.addBox(cx, cz, 0.9, 0.9);
        };

        // 8 растений по периметру
        mkPlant(-12, -12, 1.1);
        mkPlant(12, -12, 1.1);
        mkPlant(-12, 12, 1.1);
        mkPlant(12, 12, 1.1);

        mkPlant(-13, 0, 0.9);
        mkPlant(13, 0, 0.9);
        mkPlant(0, -10, 0.9);
        mkPlant(0, 13, 0.9);
    }

    /* ============ ЛЕЖАНКА КОТА ============ */
    _catBed() {
        const p = this.getPetPos();
        const g = new THREE.Group();
        const base = new THREE.Mesh(
            new THREE.CylinderGeometry(1.6, 1.5, 0.25, 20),
            new THREE.MeshStandardMaterial({ color: 0x8a3a4a, roughness: 0.95 })
        );
        base.position.y = 0.13; base.receiveShadow = true; base.castShadow = true;
        g.add(base);

        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.22, 10, 24),
            new THREE.MeshStandardMaterial({ color: 0x9a4a5a, roughness: 0.95 })
        );
        rim.rotation.x = Math.PI / 2; rim.position.y = 0.28; rim.castShadow = true;
        g.add(rim);

        const cush = new THREE.Mesh(
            new THREE.CylinderGeometry(1.25, 1.25, 0.12, 20),
            new THREE.MeshStandardMaterial({ color: 0xb85a6a, roughness: 0.9 })
        );
        cush.position.y = 0.28; cush.receiveShadow = true;
        g.add(cush);

        g.position.set(p.x, 0, p.z);
        this.scene.add(g);
    }

    /* ============ НОРКА ============ */
    _den() {
        const p = this.getDenPos(), R = this.getDenRadius();
        const wallX = -this.size / 2 + 0.22, y = 0.95;
        const g = new THREE.Group();

        const rim = new THREE.Mesh(
            new THREE.CircleGeometry(R, 28),
            new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 1 })
        );
        rim.scale.set(1, 0.78, 1); rim.position.set(wallX + 0.01, y, p.z);
        rim.rotation.y = Math.PI / 2; g.add(rim);

        const hole = new THREE.Mesh(
            new THREE.CircleGeometry(R - 0.14, 28),
            new THREE.MeshBasicMaterial({ color: 0x040101 })
        );
        hole.scale.set(1, 0.78, 1); hole.position.set(wallX + 0.02, y, p.z);
        hole.rotation.y = Math.PI / 2; g.add(hole);

        const crackMat = new THREE.MeshBasicMaterial({ color: 0x2a1808, transparent: true, opacity: 0.75 });
        for (let i = 0; i < 7; i++) {
            const len = 0.25 + Math.random() * 0.5;
            const crack = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.05 + Math.random() * 0.04), crackMat);
            const a = (i / 7) * Math.PI * 2 + Math.random() * 0.3;
            crack.position.set(wallX + 0.03, y + Math.sin(a) * (R + len / 2) * 0.78, p.z + Math.cos(a) * (R + len / 2));
            crack.rotation.y = Math.PI / 2; crack.rotation.z = a;
            g.add(crack);
        }
        this.scene.add(g);

        const glow = new THREE.PointLight(0x552200, 0.35, 3, 2);
        glow.position.set(wallX + 0.4, y, p.z);
        this.scene.add(glow);
    }

    /* ============ КАРТИНЫ И ДЕКОР НА СТЕНАХ ============ */
    _wallDecor() {
        const s = this.size;
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37, roughness: 0.4, metalness: 0.75, side: THREE.DoubleSide
        });
        const off = 0.04;   // смещение от стены

        const mkPainting = (wallX, wallY, wallZ, ry, w, h, colors) => {
            const nx = Math.sin(ry);
            const nz = Math.cos(ry);

            // Рама — плоская, не Box!
            const frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, h + 0.2), frameMat);
            frame.position.set(wallX, wallY, wallZ);
            frame.rotation.y = ry;
            this.scene.add(frame);

            // Портрет через canvas
            const canvas = document.createElement('canvas');
            canvas.width = 256; canvas.height = 320;
            const ctx = canvas.getContext('2d');

            const bg = ctx.createRadialGradient(128, 160, 20, 128, 160, 200);
            bg.addColorStop(0, colors[0]); bg.addColorStop(1, colors[1]);
            ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 320);

            // Голова
            ctx.fillStyle = colors[2];
            ctx.beginPath();
            ctx.arc(128, 120, 40, 0, Math.PI * 2);
            ctx.fill();

            // Плечи
            ctx.beginPath();
            ctx.moveTo(60, 320);
            ctx.quadraticCurveTo(60, 200, 128, 200);
            ctx.quadraticCurveTo(196, 200, 196, 320);
            ctx.closePath();
            ctx.fill();

            // Тень по краю — глубина
            const shadowGrad = ctx.createRadialGradient(128, 160, 80, 128, 160, 190);
            shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
            shadowGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
            ctx.fillStyle = shadowGrad;
            ctx.fillRect(0, 0, 256, 320);

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;

            // Портрет — на 1.5 см ПЕРЕД рамой по нормали
            const painting = new THREE.Mesh(
                new THREE.PlaneGeometry(w, h),
                new THREE.MeshBasicMaterial({ map: tex })
            );
            painting.position.set(
                wallX + nx * 0.015,
                wallY,
                wallZ + nz * 0.015
            );
            painting.rotation.y = ry;
            this.scene.add(painting);
        };

        // Западная стена — нормаль +x → ry = π/2
        mkPainting(-s / 2 + 0.2 + off, 2.4, -5, Math.PI / 2, 1.2, 1.6,
            ['#5a4a3a', '#2a1a10', '#8a6a4a']);
        mkPainting(-s / 2 + 0.2 + off, 2.4, 5, Math.PI / 2, 1.2, 1.6,
            ['#4a3a5a', '#1a102a', '#7a5a8a']);

        // Восточная стена — нормаль -x → ry = -π/2
        mkPainting(s / 2 - 0.2 - off, 2.4, -5, -Math.PI / 2, 1.2, 1.6,
            ['#5a3a3a', '#2a1010', '#8a5a4a']);
        mkPainting(s / 2 - 0.2 - off, 2.4, 5, -Math.PI / 2, 1.2, 1.6,
            ['#3a5a4a', '#102a20', '#4a8a6a']);
    }

    /* ============ ДОПОЛНИТЕЛЬНЫЕ СВЕЧИ ============ */
    _candles() {
        this.candles = [];
        // Ставим только в места, где уже стоят столики/полки — там реально стоят свечи
        // На каждом консольном столике уже есть по 2 свечи — они идут через consoleFlames
        // Здесь добавим на подоконники и алтарь
        const positions = [
            { x: -8, z: -13.2, y: 0.9 },  // на левой части алтаря
            { x: 8, z: -13.2, y: 0.9 },  // на правой части алтаря
        ];

        for (const pos of positions) {
            const g = new THREE.Group();
            const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4, metalness: 0.85 });

            const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.12, 10), brassMat);
            holder.position.y = 0.06; holder.castShadow = true; g.add(holder);

            const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.75 });
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 10), waxMat);
            candle.position.y = 0.28; candle.castShadow = true; g.add(candle);

            const flameMat = new THREE.MeshBasicMaterial({ color: 0xffdd66, transparent: true, opacity: 0 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), flameMat);
            flame.scale.set(1, 1.8, 1); flame.position.y = 0.5; g.add(flame);

            const light = new THREE.PointLight(0xffbb55, 0, 5, 2);
            light.position.y = 0.55; g.add(light);

            g.position.set(pos.x, pos.y, pos.z);
            this.scene.add(g);
            this.candles.push({ group: g, flame, light, phase: Math.random() * Math.PI * 2 });
        }
    }

    /* ============ СВЕТ ============ */
    _lights() {
        this.hemi = new THREE.HemisphereLight(0xffffff, 0x443322, 0.7);
        this.scene.add(this.hemi);

        this.sun = new THREE.DirectionalLight(0xfff0d0, 0.85);
        this.sun.position.set(10, 18, 6);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(1024, 1024);
        Object.assign(this.sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 40 });
        if ('radius' in this.sun.shadow) this.sun.shadow.radius = 4;
        this.scene.add(this.sun);

        this.lamp = new THREE.PointLight(0xffcc77, 0.5, 16, 2);
        this.lamp.position.set(-7, 4.5, -9);
        this.scene.add(this.lamp);
        this.lampBase = 0.5; this.lampTimer = 0; this.lampState = 0;

        this.moonLight = new THREE.DirectionalLight(0x9fb0ff, 0);
        this.moonLight.position.set(-8, 15, -5);
        this.scene.add(this.moonLight);
    }

    /* ============ UPDATE ============ */
    update(dt, player, time) {
        // Мерцание свечей на люстре
        

        // Мерцание свечей на бра
        if (this.sconceFlames) {
            for (let i = 0; i < this.sconceFlames.length; i++) {
                const f = this.sconceFlames[i];
                const flicker = 0.85 + Math.sin(time * 12 + i * 1.7) * 0.12 + Math.random() * 0.06;
                f.scale.set(1, 1.8 * (0.9 + flicker * 0.1), 1);
                f.material.opacity = Math.min(1, 0.85 * flicker);
            }
        }

        // Свечи на консольных столиках
        if (this.consoleFlames) {
            for (const c of this.consoleFlames) {
                const flicker = 0.9 + Math.sin(time * 11 + c.phase) * 0.15 + Math.random() * 0.05;
                if (c.light.intensity > 0.01) {
                    c.light.intensity = 0.5 * flicker;
                    c.flame.material.opacity = Math.min(1, 0.85 * flicker);
                    c.flame.scale.y = 1.8 * (0.9 + flicker * 0.1);
                }
            }
        }

        // Дополнительные свечи
        if (this.candles) {
            for (const c of this.candles) {
                const flicker = 0.9 + Math.sin(time * 12 + c.phase) * 0.15 + Math.random() * 0.05;
                if (c.light.intensity > 0.01) {
                    c.light.intensity = 0.8 * flicker;
                    c.flame.material.opacity = Math.min(1, 0.85 * flicker);
                    c.flame.scale.y = 1.8 * (0.9 + flicker * 0.1);
                }
            }
        }

        // Лёгкое мерцание главной лампы
        this.lampTimer -= dt;
        if (this.lampTimer <= 0) {
            this.lampTimer = 0.05 + Math.random() * 0.4;
            this.lampState = Math.random() < 0.06 ? 2 : (Math.random() < 0.1 ? 1 : 0);
        }
        const base = this.lampBase;
        if (this.lampState === 2) this.lamp.intensity = base * (1.3 + Math.random() * 0.3);
        else if (this.lampState === 1) this.lamp.intensity = base * (0.4 + Math.random() * 0.2);
        else this.lamp.intensity = base * (0.9 + Math.sin(time * 3) * 0.05);
    }

    /* ============ ПЕРЕКЛЮЧЕНИЕ СВЕТА ============ */
    setLightingPreset(p) {
        this.hemi.color.setHex(p.hemi); this.hemi.groundColor.setHex(p.ground);
        this.sun.color.setHex(p.sun); this.sun.intensity = p.sunIntensity;
        this.lampBase = p.ambInt * 0.7;
        if (this.scene.fog) {
            this.scene.fog.color.setHex(p.fogColor);
            this.scene.fog.near = p.fogNear; this.scene.fog.far = p.fogFar;
        }
        this.scene.background = new THREE.Color(p.fogColor);

        if (this.moonLight) {
            this.moonLight.intensity = (p.name === 'НОЧЬ' || p.name === 'ЗАКАТ') ? 0.35 : 0;
        }

        const isNight = p.name === 'НОЧЬ' || p.name === 'ЗАКАТ';

        // Свечи зажигаются вечером/ночью
        if (this.candles) {
            for (const c of this.candles) {
                if (isNight) { c.light.intensity = 0.8; c.flame.material.opacity = 0.85; }
                else { c.light.intensity = 0; c.flame.material.opacity = 0; }
            }
        }

        if (this.consoleFlames) {
            for (const c of this.consoleFlames) {
                if (isNight) { c.light.intensity = 0.5; c.flame.material.opacity = 0.85; }
                else { c.light.intensity = 0; c.flame.material.opacity = 0; }
            }
        }
    }
}