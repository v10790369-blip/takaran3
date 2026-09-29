// Выбор уровня между меню и игрой.
import { EventBus } from '../core/EventBus.js';
import { Sound } from '../core/SoundManager.js';

export class LevelSelect {
    constructor() {
        this.el = document.getElementById('level-select');
        this.backBtn = document.getElementById('level-back');

        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.level, 10);
                Sound.upgrade?.();
                this.hide();
                EventBus.emit('level:chosen', id);
            });
        });

        this.backBtn.addEventListener('click', () => {
            Sound.tap?.();
            this.hide();
            EventBus.emit('menu:from-level');
        });
    }

    show() {
        this.el.classList.remove('hidden');
        this.el.classList.add('show');
    }
    hide() {
        this.el.classList.add('hidden');
        this.el.classList.remove('show');
    }
}