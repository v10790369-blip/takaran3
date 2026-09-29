// Уровень 2: профессиональная кухня (по фото).
import * as THREE from 'three';
import { Level } from './Level.js';
import { Fish } from '../entities/Fish.js';

export class KitchenLevel extends Level {
    getName() { return 'КУХНЯ'; }
    hasSpotlight() { return false; }

    build() {
        this._floor();
        this._walls();
        this._baseCabinets();
        this._countertop();
        this._upperCabinets();
        this._sink();
        this._stove();
        this._fridge();
        this._island();
        this._diningTable();
        this._rug();
        this._wallClock();
        this._wallShelves();
        this._kitchenCart();
        this._barrels();
        this._plants();
        this._trashBin();
        this._aquarium();
        this._den();
        this._candles();
        this._lights();
        
    }

    getSpawnPos() { return { x: 0, z: 0 }; }              // у норки, но вглубь кухни
    getHostPos() { return { x: -9, z: -11.5, rotY: Math.PI }; }
    getPetPos() { return { x: 12, z: 12 }; }              // собака в дальнем углу
    getTVPos() { return null; }
    getDenPos() { return { x: -14, z: 3 }; }              // норка в левой стене
    getExitPos() { return { x: 13.5, z: 12 }; }
    getRatPos() { return { x: -11, z: 8 }; }              // мышь прямо у норки, чуть вглубь                       // возле тележки

    getPrankSpots() {
        return [
            { x: -6, z: -12.5, radius: 1.6, label: 'РАКОВИНА', points: 12, color: 0x66d9ff },
            { x: 12, z: -12.5, radius: 1.6, label: 'ХОЛОДИЛЬНИК', points: 18, color: 0xffffff },
            { x: 6, z: 8, radius: 1.6, label: 'МИСКА', points: 15, color: 0xff9955 },
            { x: 11, z: -2, radius: 1.6, label: 'МУСОРКА', points: 20, color: 0x9acd32 },
        ];
    }

    /* ============ ПОЛ ============ */
    _floor() {
        const size = this.size;
        // Крупная шахматка — светлая плитка
        const tiles = 10, tile = size / tiles;
        const geom = new THREE.PlaneGeometry(tile, tile);
        const matA = new THREE.MeshStandardMaterial({ color: 0xe0dcc8, roughness: 0.5 });
        const matB = new THREE.MeshStandardMaterial({ color: 0xc8c4b0, roughness: 0.5 });
        for (let i = 0; i < tiles; i++)
            for (let j = 0; j < tiles; j++) {
                const m = new THREE.Mesh(geom, ((i + j) % 2 === 0) ? matA : matB);
                m.rotation.x = -Math.PI / 2;
                m.position.set(-size / 2 + tile / 2 + i * tile, 0, -size / 2 + tile / 2 + j * tile);
                m.receiveShadow = true;
                this.scene.add(m);
            }
    }

    _walls() {
        const s = this.size, h = this.wallHeight;
        // Стены — приятный светлый беж
        const mat = new THREE.MeshStandardMaterial({ color: 0xede5d8, roughness: 0.9, side: THREE.DoubleSide });
        const mk = (w, x, z, ry = 0) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), mat);
            m.position.set(x, h / 2, z); m.rotation.y = ry; m.receiveShadow = true;
            this.scene.add(m);
        };
        mk(s, 0, -s / 2); mk(s, 0, s / 2);
        mk(s, -s / 2, 0, Math.PI / 2); mk(s, s / 2, 0, Math.PI / 2);

        // Плинтус
        const skirtMat = new THREE.MeshStandardMaterial({ color: 0x8a7a5c });
        const addSkirt = (w, x, z, ry = 0) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, 0.1), skirtMat);
            m.position.set(x, 0.125, z); m.rotation.y = ry;
            this.scene.add(m);
        };
        addSkirt(s, 0, -s / 2 + 0.25); addSkirt(s, 0, s / 2 - 0.25);
        addSkirt(s, -s / 2 + 0.25, 0, Math.PI / 2); addSkirt(s, s / 2 - 0.25, 0, Math.PI / 2);

        // Фартук — светло-голубая плитка на дальней стене
        const tileMat = new THREE.MeshStandardMaterial({ color: 0xa8c8dc, roughness: 0.3, metalness: 0.1 });
        const backsplash = new THREE.Mesh(new THREE.PlaneGeometry(s - 0.6, 1.3), tileMat);
        backsplash.position.set(0, 1.75, -s / 2 + 0.22);
        this.scene.add(backsplash);
    }

    /* ============ НИЖНИЕ ШКАФЫ (L-образные) ============ */
    _baseCabinets() {
        const s = this.size;
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x88a8c0, roughness: 0.55, metalness: 0.05 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.85 });

        // Вдоль дальней стены — длинный ряд
        for (let i = 0; i < 10; i++) {
            const x = -13 + i * 2.7;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.9, 1.2), cabMat);
            cab.position.set(x, 0.45, -s / 2 + 0.85);
            cab.castShadow = true; cab.receiveShadow = true;
            this.scene.add(cab);

            const h = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.05), handleMat);
            h.position.set(x, 0.75, -s / 2 + 1.46);
            this.scene.add(h);
        }
        this.physics.addBox(-2, -s / 2 + 0.85, 28, 1.2);

        // Возврат по правой стене — короткий
        for (let i = 0; i < 4; i++) {
            const z = -s / 2 + 2.6 + i * 2.6;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2.5), cabMat);
            cab.position.set(s / 2 - 0.85, 0.45, z);
            cab.castShadow = true; cab.receiveShadow = true;
            this.scene.add(cab);

            const h = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 1.2), handleMat);
            h.position.set(s / 2 - 1.46, 0.75, z);
            this.scene.add(h);
        }
        this.physics.addBox(s / 2 - 0.85, -s / 2 + 7.2, 1.2, 11);
    }

    /* ============ СТОЛЕШНИЦА ============ */
    _countertop() {
        const s = this.size;
        const topMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.25, metalness: 0.3 });

        // Дальняя
        const top1 = new THREE.Mesh(new THREE.BoxGeometry(s - 1.5, 0.1, 1.4), topMat);
        top1.position.set(0, 0.95, -s / 2 + 0.85);
        top1.receiveShadow = true; top1.castShadow = true;
        this.scene.add(top1);

        // Правая
        const top2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 11), topMat);
        top2.position.set(s / 2 - 0.85, 0.95, -s / 2 + 7.2);
        top2.receiveShadow = true; top2.castShadow = true;
        this.scene.add(top2);
    }

    /* ============ ВЕРХНИЕ ШКАФЫ ============ */
    _upperCabinets() {
        const s = this.size;
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x88a8c0, roughness: 0.55, metalness: 0.05 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.85 });

        for (let i = 0; i < 6; i++) {
            const x = -11 + i * 4;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(3.5, 1.1, 0.75), cabMat);
            cab.position.set(x, 2.9, -s / 2 + 0.55);
            cab.castShadow = true;
            this.scene.add(cab);

            const h = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, 0.05), handleMat);
            h.position.set(x, 2.55, -s / 2 + 0.94);
            this.scene.add(h);
        }

        // Правые верхние
        for (let i = 0; i < 2; i++) {
            const z = -s / 2 + 3 + i * 4;
            const cab = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.1, 3.2), cabMat);
            cab.position.set(s / 2 - 0.55, 2.9, z);
            cab.castShadow = true;
            this.scene.add(cab);
        }
    }

    /* ============ РАКОВИНА ============ */
    _sink() {
        const s = this.size;
        const sinkMat = new THREE.MeshStandardMaterial({ color: 0xa8b0b8, roughness: 0.25, metalness: 0.9 });
        const sinkX = -6;

        // Корпус
        const sink = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 1.1), sinkMat);
        sink.position.set(sinkX, 1.01, -s / 2 + 0.85);
        this.scene.add(sink);

        // Ванна
        const basin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.02, 0.8), new THREE.MeshBasicMaterial({ color: 0x404040 }));
        basin.position.set(sinkX, 1.02, -s / 2 + 0.85);
        this.scene.add(basin);

        // Кран
        const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 8), sinkMat);
        tap.position.set(sinkX, 1.35, -s / 2 + 0.45);
        this.scene.add(tap);

        const arc = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12, Math.PI), sinkMat);
        arc.position.set(sinkX, 1.6, -s / 2 + 0.45);
        arc.rotation.z = Math.PI / 2;
        this.scene.add(arc);
    }

    /* ============ ПЛИТА + ВЫТЯЖКА ============ */
    _stove() {
        const s = this.size;
        const stoveX = -9;

        // Варочная поверхность
        const stoveMat = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: 0.3, metalness: 0.5 });
        const stove = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.2), stoveMat);
        stove.position.set(stoveX, 1.01, -s / 2 + 0.85);
        this.scene.add(stove);

        // 4 конфорки
        for (const [dx, dz] of [[-0.55, -0.28], [0.55, -0.28], [-0.55, 0.28], [0.55, 0.28]]) {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(0.18, 0.03, 6, 14),
                new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.5 })
            );
            ring.rotation.x = Math.PI / 2;
            ring.position.set(stoveX + dx, 1.05, -s / 2 + 0.85 + dz);
            this.scene.add(ring);
        }

        // Духовка — спереди нижнего шкафа
        const ovenMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.5 });
        const oven = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.7, 0.05), ovenMat);
        oven.position.set(stoveX, 0.42, -s / 2 + 1.47);
        this.scene.add(oven);

        const glassMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const ovenGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.5), glassMat);
        ovenGlass.position.set(stoveX, 0.42, -s / 2 + 1.5);
        this.scene.add(ovenGlass);

        // Кастрюля
        const potMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.75 });
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.32, 0.5, 16), potMat);
        pot.position.set(stoveX, 1.3, -s / 2 + 0.85);
        pot.castShadow = true;
        this.scene.add(pot);

        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.37, 0.37, 0.04, 16), potMat);
        lid.position.set(stoveX, 1.57, -s / 2 + 0.85);
        this.scene.add(lid);

        // Пар
        this._steam = [];
        for (let i = 0; i < 6; i++) {
            const st = new THREE.Mesh(
                new THREE.SphereGeometry(0.13 + Math.random() * 0.08, 6, 5),
                new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false })
            );
            st.position.set(stoveX, 2.0 + i * 0.2, -s / 2 + 0.85);
            st.userData.baseY = st.position.y;
            st.userData.phase = Math.random() * Math.PI * 2;
            this.scene.add(st);
            this._steam.push(st);
        }

        // ВЫТЯЖКА — металлический купол над плитой
        const hoodMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.35, metalness: 0.85 });
        const hoodBase = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.25, 1.4), hoodMat);
        hoodBase.position.set(stoveX, 2.4, -s / 2 + 0.9);
        hoodBase.castShadow = true;
        this.scene.add(hoodBase);

        const hoodTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.3, 0.9), hoodMat);
        hoodTop.position.set(stoveX, 3.1, -s / 2 + 0.75);
        hoodTop.castShadow = true;
        this.scene.add(hoodTop);

        const hoodPipe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.7), hoodMat);
        hoodPipe.position.set(stoveX, 3.9, -s / 2 + 0.55);
        this.scene.add(hoodPipe);
    }

    /* ============ ХОЛОДИЛЬНИК ============ */
    _fridge() {
        const s = this.size;
        const x = 12, z = -s / 2 + 0.85;

        const g = new THREE.Group();

        // Основа
        const mat = new THREE.MeshStandardMaterial({ color: 0xc8ccce, roughness: 0.28, metalness: 0.75 });
        const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 3.5, 1.3), mat);
        body.position.y = 1.75; body.castShadow = true; body.receiveShadow = true;
        g.add(body);

        // Верхняя дверь (морозилка)
        const top = new THREE.Mesh(new THREE.BoxGeometry(2.22, 1.1, 1.32),
            new THREE.MeshStandardMaterial({ color: 0xbfc4c6, roughness: 0.25, metalness: 0.8 }));
        top.position.y = 3.0;
        g.add(top);

        // Ручки
        const handleMat = new THREE.MeshStandardMaterial({ color: 0x808890, roughness: 0.3, metalness: 0.85 });
        const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 8), handleMat);
        h1.position.set(0.85, 3.0, 0.68); h1.rotation.z = Math.PI / 2;
        g.add(h1);
        const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), handleMat);
        h2.position.set(0.85, 1.8, 0.68); h2.rotation.z = Math.PI / 2;
        g.add(h2);

        // Разделитель
        const split = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.05, 1.32),
            new THREE.MeshStandardMaterial({ color: 0x404040 }));
        split.position.y = 2.4; g.add(split);

        g.position.set(x, 0, z);
        this.scene.add(g);
        this.physics.addBox(x, z, 2.2, 1.3);
        this.obstacles.push({ x, z, sx: 2.2, sz: 1.3, label: 'ХОЛОДИЛЬНИК', height: 3.5 });
    }

    /* ============ ОСТРОВ ============ */
    _island() {
        const g = new THREE.Group();
        const cabMat = new THREE.MeshStandardMaterial({ color: 0x88a8c0, roughness: 0.55, metalness: 0.05 });
        const topMat = new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.25, metalness: 0.3 });
        const handleMat = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.85 });

        // Корпус
        const base = new THREE.Mesh(new THREE.BoxGeometry(5, 0.9, 2.2), cabMat);
        base.position.y = 0.45; base.castShadow = true; base.receiveShadow = true;
        g.add(base);

        // Столешница
        const top = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.12, 2.4), topMat);
        top.position.y = 0.96; top.castShadow = true; top.receiveShadow = true;
        g.add(top);

        // Ручки
        for (const x of [-1.5, 0, 1.5]) {
            const h = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), handleMat);
            h.position.set(x, 0.5, 1.13); g.add(h);
        }

        // Разделочная доска
        const board = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 0.05, 0.8),
            new THREE.MeshStandardMaterial({ color: 0xc9a26a, roughness: 0.8 })
        );
        board.position.set(-1.3, 1.05, 0.1);
        board.castShadow = true;
        g.add(board);

        // Блок для ножей
        const knifeBlock = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.35, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.7 })
        );
        knifeBlock.position.set(0.2, 1.2, 0.1);
        knifeBlock.castShadow = true;
        g.add(knifeBlock);

        // Ножи торчат
        for (let i = 0; i < 3; i++) {
            const knife = new THREE.Mesh(
                new THREE.BoxGeometry(0.04, 0.35, 0.02),
                new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.15, metalness: 0.9 })
            );
            knife.position.set(0.2 - 0.12 + i * 0.12, 1.5, 0.1);
            knife.rotation.x = -0.15;
            g.add(knife);
        }

        // Фруктовая ваза
        const bowl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.4, 0.32, 0.22, 16),
            new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.6 })
        );
        bowl.position.set(1.6, 1.13, 0.1);
        bowl.castShadow = true;
        g.add(bowl);

        // Фрукты — яблоки красные
        const appleMat = new THREE.MeshStandardMaterial({ color: 0xd04030, roughness: 0.7 });
        for (let i = 0; i < 4; i++) {
            const apple = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), appleMat);
            const a = (i / 4) * Math.PI * 2;
            apple.position.set(1.6 + Math.cos(a) * 0.15, 1.3, 0.1 + Math.sin(a) * 0.15);
            g.add(apple);
        }
        // Пара оранжевых
        const orangeMat = new THREE.MeshStandardMaterial({ color: 0xf0a040, roughness: 0.7 });
        const orange = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), orangeMat);
        orange.position.set(1.6, 1.44, 0.1);
        g.add(orange);

        g.position.set(0, 0, -3);
        this.scene.add(g);

        this.physics.addBox(0, -3, 5, 2.2);
        this.obstacles.push({ x: 0, z: -3, sx: 5, sz: 2.2, label: 'ОСТРОВ', height: 1.0 });
    }

    /* ============ ОБЕДЕННЫЙ СТОЛ + СТУЛЬЯ ============ */
    _diningTable() {
        const g = new THREE.Group();
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.7 });

        // Столешница
        const top = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 2.6), woodMat);
        top.position.y = 1.0; top.castShadow = true; top.receiveShadow = true;
        g.add(top);

        // Ножки
        for (const [sx, sz] of [[-2.2, -1.1], [2.2, -1.1], [-2.2, 1.1], [2.2, 1.1]]) {
            const l = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.16), woodMat);
            l.position.set(sx, 0.5, sz); l.castShadow = true;
            g.add(l);
        }

        // Тарелки + еда
        for (const dx of [-1.5, 0, 1.5]) {
            const plate = new THREE.Mesh(
                new THREE.CylinderGeometry(0.35, 0.35, 0.03, 16),
                new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.6 })
            );
            plate.position.set(dx, 1.08, 0);
            g.add(plate);

            // Кусочек еды
            const food = new THREE.Mesh(
                new THREE.SphereGeometry(0.14, 8, 6),
                new THREE.MeshStandardMaterial({ color: 0xc04030, roughness: 0.7 })
            );
            food.position.set(dx, 1.2, 0);
            g.add(food);
        }

        // Приправы по центру
        const pepper = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.06, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        pepper.position.set(0, 1.16, 0.5); g.add(pepper);

        // Стулья — 3 сверху, 3 снизу
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x6a3a1c, roughness: 0.7 });
        const chairSeat = new THREE.MeshStandardMaterial({ color: 0xb04030, roughness: 0.85 });

        const mkChair = (x, z, facing) => {
            const c = new THREE.Group();
            // Сиденье
            const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.7), chairSeat);
            seat.position.y = 0.55;
            seat.castShadow = true;
            c.add(seat);
            // Спинка
            const back = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.1), chairMat);
            back.position.set(0, 0.95, facing * 0.3);
            back.castShadow = true;
            c.add(back);
            // 4 ножки
            for (const [sx, sz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) {
                const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.55, 0.07), chairMat);
                leg.position.set(sx, 0.275, sz);
                c.add(leg);
            }
            c.position.set(x, 0, z);
            return c;
        };

        for (const dx of [-1.7, 0, 1.7]) {
            // стулья СВЕРХУ (перед столом) — сиденье снаружи, спинка ДАЛЬШЕ от стола (−z)
            g.add(mkChair(dx, -2.2, -1));
            // стулья СНИЗУ — сиденье снаружи, спинка ДАЛЬШЕ от стола (+z)
            g.add(mkChair(dx, 2.2, 1));
        }

        g.position.set(0, 0, 8);
        this.scene.add(g);

        this.obstacles.push({ x: 0, z: 8, sx: 5, sz: 2.6, label: 'СТОЛ', height: 1 });
        this.physics.addBox(0, 8, 5, 2.6);
        // Стулья
        this.physics.addBox(0, 8 - 2.2, 5, 0.7);
        this.physics.addBox(0, 8 + 2.2, 5, 0.7);
    }

    /* ============ КРАСНЫЙ КОВЁР ============ */
    _rug() {
        const rug = new THREE.Mesh(
            new THREE.PlaneGeometry(7.5, 6),
            new THREE.MeshStandardMaterial({ color: 0x8a2a2a, roughness: 0.95 })
        );
        rug.rotation.x = -Math.PI / 2;
        rug.position.set(0, 0.008, 8);
        this.scene.add(rug);

        // Кайма
        const trimMat = new THREE.MeshBasicMaterial({ color: 0xc8a040, transparent: true, opacity: 0.85 });
        const trim1 = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.15), trimMat);
        trim1.rotation.x = -Math.PI / 2;
        trim1.position.set(0, 0.01, 8 - 2.8);
        this.scene.add(trim1);

        const trim2 = trim1.clone();
        trim2.position.z = 8 + 2.8;
        this.scene.add(trim2);

        const trim3 = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 6), trimMat);
        trim3.rotation.x = -Math.PI / 2;
        trim3.position.set(-3.65, 0.01, 8);
        this.scene.add(trim3);

        const trim4 = trim3.clone();
        trim4.position.x = 3.65;
        this.scene.add(trim4);
    }

    /* ============ ЧАСЫ НА СТЕНЕ ============ */
    _wallClock() {
        const s = this.size;
        const g = new THREE.Group();

        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.55, 0.06, 24),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.4 })
        );
        rim.rotation.z = Math.PI / 2;
        g.add(rim);

        const face = new THREE.Mesh(
            new THREE.CircleGeometry(0.48, 24),
            new THREE.MeshBasicMaterial({ color: 0xf5f5f5 })
        );
        face.rotation.y = Math.PI / 2;
        face.position.x = 0.04;
        g.add(face);

        // Стрелки
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const hourArrow = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.22), arrowMat);
        hourArrow.rotation.y = Math.PI / 2;
        hourArrow.position.set(0.05, 0.1, 0);
        g.add(hourArrow);

        const minuteArrow = new THREE.Mesh(new THREE.PlaneGeometry(0.04, 0.32), arrowMat);
        minuteArrow.rotation.y = Math.PI / 2;
        minuteArrow.rotation.x = 0.4;
        minuteArrow.position.set(0.05, 0.14, 0.05);
        g.add(minuteArrow);

        g.position.set(-s / 2 + 0.28, 2.8, -4);
        this.scene.add(g);
    }

    /* ============ СТЕЛЛАЖИ И ПОЛКИ ============ */
    /* ============ СТЕЛЛАЖИ И ПОЛКИ (у правой стены) ============ */
    _wallShelves() {
        const s = this.size;
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.4, metalness: 0.7 });
        const dishMat = new THREE.MeshStandardMaterial({ color: 0xf0e8d8, roughness: 0.6 });

        // ⚠️ Прижимаем к самой стене x = s/2 = 15
        const wallInner = s / 2 - 0.2;   // 14.8 — здесь будет спинка стеллажа
        const shelfDepth = 1.0;          // глубина полок
        const shelfX = wallInner - shelfDepth / 2;   // центр полки = 14.3

        // === Боковые стойки (2 штуки) — по краям ===
        const railMat = new THREE.MeshStandardMaterial({ color: 0x707478, roughness: 0.35, metalness: 0.85 });
        for (const dz of [-1.7, 1.7]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(shelfDepth + 0.06, 2.9, 0.08),
                railMat
            );
            rail.position.set(shelfX, 1.45, -s / 2 + 3.5 + dz);
            rail.castShadow = true;
            this.scene.add(rail);
        }

        // === Полки ===
        for (let i = 0; i < 3; i++) {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(shelfDepth, 0.06, 3.4),
                shelfMat
            );
            shelf.position.set(shelfX, 0.5 + i * 0.9, -s / 2 + 3.5);
            shelf.castShadow = true;
            shelf.receiveShadow = true;
            this.scene.add(shelf);

            // Тарелки на полке — 6 штук в ряд по z
            for (let j = 0; j < 6; j++) {
                const plate = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.16, 0.16, 0.04, 12),
                    dishMat
                );
                plate.position.set(
                    shelfX - 0.15,
                    0.55 + i * 0.9,
                    -s / 2 + 2.2 + j * 0.5
                );
                plate.castShadow = true;
                this.scene.add(plate);
            }
        }

        // === Стеллаж для специй — тоже у стены, но ниже ===
        const spiceShelfX = wallInner - 0.2;
        for (let i = 0; i < 2; i++) {
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(0.42, 0.04, 2),
                shelfMat
            );
            shelf.position.set(spiceShelfX, 1.5 + i * 0.6, -s / 2 + 8.5);
            shelf.castShadow = true;
            this.scene.add(shelf);
        }

        // Стойки для специй
        for (const dz of [-0.95, 0.95]) {
            const rail = new THREE.Mesh(
                new THREE.BoxGeometry(0.42, 1.7, 0.06),
                railMat
            );
            rail.position.set(spiceShelfX, 1.9, -s / 2 + 8.5 + dz);
            rail.castShadow = true;
            this.scene.add(rail);
        }

        // Баночки специй
        const jarColors = [0xd84545, 0xe8a030, 0x8ac040, 0xc040a0, 0x4080c0, 0xe0d040];
        for (let i = 0; i < 6; i++) {
            const z = -s / 2 + 7.7 + i * 0.32;
            for (let j = 0; j < 2; j++) {
                const jar = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.06, 0.06, 0.14, 8),
                    new THREE.MeshStandardMaterial({ color: jarColors[i], roughness: 0.6 })
                );
                jar.position.set(spiceShelfX, 1.57 + j * 0.6, z);
                jar.castShadow = true;
                this.scene.add(jar);

                const lid = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.065, 0.065, 0.03, 8),
                    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
                );
                lid.position.set(spiceShelfX, 1.65 + j * 0.6, z);
                this.scene.add(lid);
            }
        }

        // === Ножи на магнитной полосе у стены ===
        const magnetMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.4, metalness: 0.7 });
        const magnet = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.5, 0.05),
            magnetMat
        );
        magnet.position.set(s / 2 - 0.15, 2.0, -s / 2 + 11.5);
        magnet.rotation.x = 0;
        this.scene.add(magnet);

        const knifeMat = new THREE.MeshStandardMaterial({ color: 0xd0d8e0, roughness: 0.15, metalness: 0.9 });
        for (let i = 0; i < 4; i++) {
            const knife = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.45, 0.02),
                knifeMat
            );
            knife.position.set(s / 2 - 0.15, 1.9, -s / 2 + 11.2 + i * 0.22);
            knife.rotation.x = 0;
            this.scene.add(knife);
        }
    }

    /* ============ ТЕЛЕЖКА С КАСТРЮЛЯМИ ============ */
    _kitchenCart() {
        const s = this.size;
        const g = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0xb0b4b8, roughness: 0.35, metalness: 0.8 });

        for (let i = 0; i < 3; i++) {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 1.2), metalMat);
            shelf.position.y = 0.3 + i * 0.55;
            shelf.castShadow = true;
            g.add(shelf);
        }

        for (const [sx, sz] of [[-0.7, -0.55], [0.7, -0.55], [-0.7, 0.55], [0.7, 0.55]]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.5, 6), metalMat);
            leg.position.set(sx, 0.75, sz);
            g.add(leg);
        }

        const potMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, roughness: 0.3, metalness: 0.75 });
        for (let i = 0; i < 2; i++) {
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.25, 0.3, 12), potMat);
            pot.position.set(-0.3 + i * 0.6, 0.5, 0);
            pot.castShadow = true;
            g.add(pot);
        }
        const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.3, 0.08, 14), potMat);
        pan.position.set(0, 1.1, 0);
        pan.castShadow = true;
        g.add(pan);

        g.position.set(s / 2 - 2.5, 0, 4);
        this.scene.add(g);
        this.physics.addBox(s / 2 - 2.5, 4, 1.8, 1.4);
    }

    /* ============ БОЧКИ В УГЛУ ============ */
    _barrels() {
        const s = this.size;

        // Деревянная бочка
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.8 });
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 16), woodMat);
        barrel.position.set(12, 0.6, 12);
        barrel.castShadow = true;
        this.scene.add(barrel);

        // Обручи
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.4, metalness: 0.6 });
        for (const y of [0.25, 0.6, 0.95]) {
            const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.04, 6, 20), ringMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(12, y, 12);
            this.scene.add(ring);
        }
        this.physics.addBox(12, 12, 1.4, 1.4);

        // Маленькая коричневая кастрюлька/бочонок
        const smallWoodMat = new THREE.MeshStandardMaterial({ color: 0xa06a30, roughness: 0.7 });
        const small1 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.65, 14), smallWoodMat);
        small1.position.set(10, 0.33, 12.5);
        small1.castShadow = true;
        this.scene.add(small1);

        // Синяя кастрюлька
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x305a90, roughness: 0.5 });
        const small2 = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.65, 14), blueMat);
        small2.position.set(10.9, 0.33, 12.5);
        small2.castShadow = true;
        this.scene.add(small2);
    }

    /* ============ РАСТЕНИЯ ============ */
    _plants() {
        const s = this.size;
        const plantMat = new THREE.MeshStandardMaterial({ color: 0x2a8a3a, roughness: 0.7, side: THREE.DoubleSide });

        const mkPlant = (x, z, scale = 1) => {
            const g = new THREE.Group();

            const potMat = new THREE.MeshStandardMaterial({ color: 0xa04a2a, roughness: 0.8 });
            const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 12), potMat);
            pot.position.y = 0.2;
            pot.castShadow = true;
            g.add(pot);

            const dirt = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), new THREE.MeshStandardMaterial({ color: 0x3a2010 }));
            dirt.rotation.x = -Math.PI / 2;
            dirt.position.y = 0.41;
            g.add(dirt);

            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2;
                const leaf = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.7), plantMat);
                leaf.position.set(Math.cos(a) * 0.1, 0.75, Math.sin(a) * 0.1);
                leaf.rotation.y = a;
                leaf.rotation.z = Math.sin(a) * 0.2;
                leaf.rotation.x = -0.3 - Math.random() * 0.3;
                leaf.castShadow = true;
                g.add(leaf);
            }
            g.position.set(x, 0, z);
            g.scale.setScalar(scale);
            return g;
        };

        // Три растения — на столешнице
        this.scene.add(mkPlant(-13, -s / 2 + 0.85, 0.9));
        this.scene.add(mkPlant(2, -s / 2 + 0.85, 0.85));
        // Большое в углу
        this.scene.add(mkPlant(-s / 2 + 1.5, s / 2 - 1.5, 1.4));
    }

    /* ============ МУСОРКА ============ */
    _trashBin() {
        
        const s = this.size;
        const bin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.55, 0.5, 1.2, 14),
            new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.5, metalness: 0.4 })
        );
        bin.position.set(s / 2 - 1.2, 0.6, -s / 2 + 3);
        bin.castShadow = true;
        this.scene.add(bin);

        const lid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.58, 0.58, 0.1, 14),
            new THREE.MeshStandardMaterial({ color: 0x1a1a20, roughness: 0.5, metalness: 0.5 })
        );
        lid.position.set(s / 2 - 1.2, 1.25, -s / 2 + 3);
        this.scene.add(lid);
        
    }

    // 🐟 Аквариум с рыбкой
    _aquarium() {
        this.fish = new Fish(this.scene, 8, 5);
        this.physics.addBox(8, 5, 1.6, 1.0);
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

        this.scene.add(g);
    }

    /* ============ СВЕЧИ ============ */
    _candles() {
        this.candles = [];
        // y — это ВЕРХ поверхности, на которую ставим свечу (top of the furniture)
        // x, z — центр этой поверхности, а не «где-то рядом»
        const positions = [
            // На острове (остров: центр 0,-3, размер 5×2.2, верх на y=1.02)
            { x: 1.2, z: -3, y: 1.02 },
            // На обеденном столе (стол: центр 0,8, размер 5×2.6, верх на y=1.06)
            { x: -1.5, z: 8, y: 1.06 },
            // На правой столешнице (центр 14.15, -7.8, верх на y=1.0)
            { x: 14.15, z: -6, y: 1.00 },
            // На дальней столешнице (центр 0, -14.15, верх на y=1.0)
            { x: 4, z: -14.15, y: 1.00 },
        ];

        for (const pos of positions) {
            const g = new THREE.Group();

            const holderMat = new THREE.MeshStandardMaterial({ color: 0x8a6a30, roughness: 0.4, metalness: 0.7 });
            const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.12, 12), holderMat);
            holder.position.y = 0.06; holder.castShadow = true;
            g.add(holder);

            const waxMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.8 });
            const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.4, 10), waxMat);
            candle.position.y = 0.32; candle.castShadow = true;
            g.add(candle);

            const flameMat = new THREE.MeshBasicMaterial({ color: 0xffcc44, transparent: true, opacity: 0 });
            const flame = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), flameMat);
            flame.scale.set(1, 1.8, 1);
            flame.position.y = 0.6;
            g.add(flame);

            const light = new THREE.PointLight(0xffaa44, 0, 6, 2);
            light.position.y = 0.65;
            g.add(light);

            g.position.set(pos.x, pos.y, pos.z);
            this.scene.add(g);

            this.candles.push({ group: g, flame, light, phase: Math.random() * Math.PI * 2 });
        }
    }

    /* ============ СВЕТ ============ */
    _lights() {
        this.hemi = new THREE.HemisphereLight(0xffffff, 0x554433, 1.0);
        this.scene.add(this.hemi);

        this.sun = new THREE.DirectionalLight(0xffffff, 1.15);
        this.sun.position.set(10, 18, 6);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.set(1024, 1024);
        Object.assign(this.sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 40 });
        if ('radius' in this.sun.shadow) this.sun.shadow.radius = 4;
        this.scene.add(this.sun);

        this.lamp = new THREE.PointLight(0xeef0ff, 1.0, 22, 2);
        this.lamp.position.set(0, 4.5, 0);
        this.scene.add(this.lamp);

        const stoveLight = new THREE.PointLight(0xffaa66, 0.6, 5, 2);
        stoveLight.position.set(-9, 1.6, -this.size / 2 + 0.85);
        this.scene.add(stoveLight);
    }

    update(dt, player, time) {
        if (this._steam) {
            for (const s of this._steam) {
                s.position.y = s.userData.baseY + Math.sin(time * 2 + s.userData.phase) * 0.15;
                s.position.x = -9 + Math.sin(time * 1.2 + s.userData.phase) * 0.15;
            }
        }
        
    
        
        if (this.lamp) this.lamp.intensity = 1.0 + Math.sin(time * 5) * 0.05;

        if (this.candles) {
            for (const c of this.candles) {
                const flicker = 0.9 + Math.sin(time * 12 + c.phase) * 0.15 + Math.random() * 0.05;
                if (c.light.intensity > 0.01) {
                    c.light.intensity = 1.2 * flicker;
                    c.flame.material.opacity = Math.min(1, 0.85 * flicker);
                    c.flame.scale.y = 1.8 * (0.9 + flicker * 0.1);
                }
            }
        }
        
        if (this.fish) this.fish.update(dt, player);
    }

    setLightingPreset(p) {
        this.hemi.color.setHex(p.hemi); this.hemi.groundColor.setHex(p.ground);
        this.sun.color.setHex(p.sun); this.sun.intensity = p.sunIntensity;
        if (this.lamp) this.lamp.intensity = 0.3 + p.ambInt * 0.4;
        if (this.scene.fog) {
            this.scene.fog.color.setHex(p.fogColor);
            this.scene.fog.near = p.fogNear; this.scene.fog.far = p.fogFar;
        }
        this.scene.background = new THREE.Color(p.fogColor);

        const isNight = p.name === 'НОЧЬ';
        if (this.candles) {
            for (const c of this.candles) {
                if (isNight) {
                    c.light.intensity = 1.2;
                    c.flame.material.opacity = 0.9;
                } else {
                    c.light.intensity = 0;
                    c.flame.material.opacity = 0;
                }
            }
        }
    }
}