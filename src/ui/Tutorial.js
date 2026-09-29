// Туториал для мобилок. Стрелка идёт от игрока к цели, шаги сменяются сами.
export class Tutorial {
    constructor() {
        this.el = document.getElementById('tutorial');
        this.bannerEl = document.getElementById('tut-banner');
        this.textEl = document.getElementById('tut-text');
        this.pointerEl = document.getElementById('tut-pointer');
        this.joyEl = document.getElementById('tut-joystick');
        this.dotsEl = document.getElementById('tut-dots');

        this.step = 0;
        this.active = false;
        this.steps = [];
        this._autoTimer = null;
        this._key = 'default';
        this._playerScreen = null;
        this._targetWorld = null;
        this._targetScreen = null;
    }

    start(steps) {
        const key = steps._key || 'default';
        try {
            if (localStorage.getItem('roach3d.tutorial.' + key) === 'done') return;
        } catch { }
        this._key = key;

        this.steps = steps;
        this.step = 0;
        this.active = true;
        this.el.classList.remove('hidden');
        this.el.classList.add('show');
        this._renderDots();
        setTimeout(() => this._showStep(), 500);
    }

    _renderDots() {
        this.dotsEl.innerHTML = '';
        for (let i = 0; i < this.steps.length; i++) {
            const d = document.createElement('div');
            d.className = 'tut-dot';
            this.dotsEl.appendChild(d);
        }
    }

    _updateDots() {
        this.dotsEl.querySelectorAll('.tut-dot').forEach((d, i) => {
            d.classList.toggle('active', i === this.step);
            d.classList.toggle('done', i < this.step);
        });
    }

    _showStep() {
        if (!this.active) return;
        const s = this.steps[this.step];
        if (!s) { this._finish(); return; }

        this._updateDots();

        // Текст баннера
        if (s.text) {
            this.textEl.textContent = s.text;
            this.textEl.classList.remove('show');
            void this.textEl.offsetWidth;
            this.textEl.classList.add('show');
            this.bannerEl.classList.remove('hidden');
        } else {
            this.bannerEl.classList.add('hidden');
        }

        // Стрелка-указатель от игрока к цели
        if (s.worldTarget) {
            this._targetWorld = s.worldTarget;
            this.pointerEl.classList.remove('hidden');
        } else {
            this._targetWorld = null;
            this.pointerEl.classList.add('hidden');
        }

        // Джойстик-анимация (для шага "как двигаться")
        if (s.mode === 'joystick') {
            this.joyEl.classList.remove('hidden');
        } else {
            this.joyEl.classList.add('hidden');
        }

        // Автосмена шага
        clearTimeout(this._autoTimer);
        this._autoTimer = setTimeout(() => this.next(), s.duration || 3500);
    }

    next() {
        if (!this.active) return;
        clearTimeout(this._autoTimer);
        this.step++;
        setTimeout(() => this._showStep(), 350);
    }

    // Экранные координаты — GameScene передаёт каждый кадр
    setScreens(playerScreen, targetScreen) {
        if (!this.active) return;
        this._playerScreen = playerScreen;
        this._targetScreen = targetScreen;
        this._updatePointer();
    }

    _updatePointer() {
        // Если цели нет на экране — стрелку прячем
        if (!this._playerScreen || !this._targetScreen || !this._targetWorld) {
            this.pointerEl.style.opacity = 0;
            return;
        }

        const dx = this._targetScreen.x - this._playerScreen.x;
        const dy = this._targetScreen.y - this._playerScreen.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        // Ставим стрелку в 100px от игрока в сторону цели
        const dist = Math.hypot(dx, dy);
        const offset = Math.min(90, Math.max(55, dist * 0.35));
        const rad = angle * Math.PI / 180;
        const px = this._playerScreen.x + Math.cos(rad) * offset;
        const py = this._playerScreen.y + Math.sin(rad) * offset;

        this.pointerEl.style.opacity = 1;
        this.pointerEl.style.left = px + 'px';
        this.pointerEl.style.top = py + 'px';
        this.pointerEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    }

    _finish() {
        this.active = false;
        this.el.classList.remove('show');
        setTimeout(() => this.el.classList.add('hidden'), 400);
        clearTimeout(this._autoTimer);
        try { localStorage.setItem('roach3d.tutorial.' + this._key, 'done'); } catch { }
    }

    stop() {
        this.active = false;
        this.el.classList.remove('show');
        this.el.classList.add('hidden');
        clearTimeout(this._autoTimer);
    }

    reset(key) {
        try { localStorage.removeItem('roach3d.tutorial.' + (key || 'default')); } catch { }
    }
}