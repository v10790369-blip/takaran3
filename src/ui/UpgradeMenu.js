// Меню апгрейдов между волнами.
import { UPGRADES } from '../config.js';
import { EventBus } from '../core/EventBus.js';
import { Sound } from '../core/SoundManager.js';

export class UpgradeMenu {
    constructor() {
        this.el = document.getElementById('upgrade-menu');
        this.cardsEl = document.getElementById('upgrade-cards');

        EventBus.on('show-upgrades', (count, onPick) => this._show(count, onPick));
        EventBus.on('hide-upgrades', () => this._hide());
    }

    _show(count, onPick) {
        const pool = [...UPGRADES];
        const picks = [];
        for (let i = 0; i < count && pool.length; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            picks.push(pool.splice(idx, 1)[0]);
        }

        this.cardsEl.innerHTML = '';
        for (const up of picks) {
            const card = document.createElement('div');
            card.className = 'up-card';
            card.innerHTML = `
        <div class="up-icon">${up.icon}</div>
        <div class="up-name">${up.name}</div>
        <div class="up-desc">${up.desc}</div>
      `;
            card.addEventListener('click', () => {
                Sound.upgrade();
                this._hide();
                onPick(up);
            });
            this.cardsEl.appendChild(card);
        }

        this.el.classList.add('show');
    }

    _hide() { this.el.classList.remove('show'); }
}