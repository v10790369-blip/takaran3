// Панель способностей внизу экрана. Слушает EventBus.
import { EventBus } from '../core/EventBus.js';

export class AbilityBar {
    constructor() {
        this.buttons = {
            fake: document.getElementById('ab-fake'),
            scream: document.getElementById('ab-scream'),
            jump: document.getElementById('ab-jump'),
        };
        this.cooldownFills = {};
        this.cooldownTexts = {};
        for (const [id, btn] of Object.entries(this.buttons)) {
            if (!btn) continue;
            this.cooldownFills[id] = btn.querySelector('.ab-fill');
            this.cooldownTexts[id] = btn.querySelector('.ab-cd');
        }
        this.maxCd = { fake: 10, scream: 15, jump: 8 };

        // Нажатия — сразу шлём в EventBus
        for (const [id, btn] of Object.entries(this.buttons)) {
            if (!btn) continue;
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                if (btn.classList.contains('locked')) return;
                if (btn.classList.contains('cooling')) return;
                EventBus.emit('ability:' + id);
            });
        }

        EventBus.on('ability:unlock', (id) => {
            const btn = this.buttons[id];
            if (btn) btn.classList.remove('locked');
        });

        EventBus.on('ability:reset', () => {
            for (const id of Object.keys(this.buttons)) {
                const btn = this.buttons[id];
                if (!btn) continue;
                btn.classList.add('locked');
                btn.classList.remove('cooling');
                if (this.cooldownFills[id]) this.cooldownFills[id].style.transform = 'scaleY(0)';
                if (this.cooldownTexts[id]) this.cooldownTexts[id].textContent = '';
            }
        });

        EventBus.on('ability:cooldown', (id, cur, max) => {
            const btn = this.buttons[id];
            if (!btn) return;
            if (btn.classList.contains('locked')) return;

            const fill = this.cooldownFills[id];
            const txt = this.cooldownTexts[id];
            const m = max || this.maxCd[id] || 10;

            if (cur > 0) {
                btn.classList.add('cooling');
                fill.style.transform = `scaleY(${cur / m})`;
                txt.textContent = Math.ceil(cur);
            } else {
                btn.classList.remove('cooling');
                fill.style.transform = 'scaleY(0)';
                txt.textContent = '';
            }
        });
    }
}