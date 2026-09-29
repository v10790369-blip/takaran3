// Главное меню + настройки. Всегда показывает все скины.
import { EventBus } from '../core/EventBus.js';
import { SaveManager } from '../core/SaveManager.js';
import { SkinManager } from '../core/SkinManager.js';
import { SKINS as SKINS_CFG } from '../config.js';
import { Sound } from '../core/SoundManager.js';

// Fallback, если в config.js нет скинов
const FALLBACK_SKINS = [
    { id: 'default', name: 'Жора', desc: 'Обычный таракан', icon: '🪳', color: 0x4a2c14, shellColor: 0x5c3819, unlock: null },
    { id: 'golden', name: 'Золотой', desc: '1000 срама', icon: '⭐', color: 0xd4af37, shellColor: 0xf5d060, unlock: { type: 'sram', value: 1000 } },
    { id: 'ghost', name: 'Призрак', desc: 'Одержать победу', icon: '👻', color: 0x9098b8, shellColor: 0xb0b8d8, transparent: true, unlock: { type: 'wins', value: 1 } },
    { id: 'ninja', name: 'Ниндзя', desc: '10 пробежек', icon: '🥷', color: 0x1a1a1a, shellColor: 0x2a2a2a, unlock: { type: 'runs', value: 10 } },
    { id: 'king', name: 'Король кухни', desc: '5000 срама', icon: '👑', color: 0x8a2a4a, shellColor: 0xb04070, unlock: { type: 'sram', value: 5000 } },
    { id: 'alien', name: 'Чужой', desc: '25 пробежек', icon: '🛸', color: 0x40a080, shellColor: 0x60d0a0, unlock: { type: 'runs', value: 25 } },
];

export class Menu {
    constructor() {
        this.el = document.getElementById('main-menu');
        this.pages = {
            main: document.getElementById('menu-page-main'),
            skins: document.getElementById('menu-page-skins'),
            records: document.getElementById('menu-page-records'),
            settings: document.getElementById('menu-page-settings'),
            about: document.getElementById('menu-page-about'),
        };
        this.pageTitle = document.getElementById('menu-page-title');
        this.skinsGrid = document.getElementById('menu-skins-grid');
        this.recordsEl = document.getElementById('menu-records-body');
        this.isOpen = true;

        this._bind();
        EventBus.on('menu:open', () => this.open());
        EventBus.on('menu:close', () => this.close());
        EventBus.on('gameover', () => this._refresh());
        EventBus.on('win', () => this._refresh());

        this._initSettings();
    }

    _bind() {
        document.getElementById('menu-btn-play').addEventListener('click', () => {
            Sound.tap?.(); this.close();
            if (navigator.vibrate) navigator.vibrate(10);
            EventBus.emit('menu:play');
        });
        document.getElementById('menu-btn-skins').addEventListener('click', () => {
            Sound.tap?.(); this._showPage('skins');
            if (navigator.vibrate) navigator.vibrate(10);
        });
        document.getElementById('menu-btn-records').addEventListener('click', () => {
            Sound.tap?.(); this._showPage('records');
            if (navigator.vibrate) navigator.vibrate(10);
        });
        document.getElementById('menu-btn-settings').addEventListener('click', () => {
            Sound.tap?.(); this._showPage('settings');
            if (navigator.vibrate) navigator.vibrate(10);
        });
        document.getElementById('menu-btn-about').addEventListener('click', () => {
            Sound.tap?.(); this._showPage('about');
            if (navigator.vibrate) navigator.vibrate(10);
        });
        document.querySelectorAll('.menu-back').forEach(b => {
            b.addEventListener('click', () => { Sound.tap?.(); this._showPage('main'); });
        });
    }

    _initSettings() {
        const defaults = { music: 0.35, sfx: 0.7, voice: 0.7 };
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem('roach3d.settings.v1')) || {}; } catch { }
        const s = { ...defaults, ...saved };

        const makeSlider = (id, key) => {
            const input = document.getElementById(id);
            if (!input) return;
            const label = input.parentElement.querySelector('.settings-value');
            input.value = Math.round(s[key] * 100);
            if (label) label.textContent = input.value + '%';

            const apply = () => {
                const v = input.value / 100;
                if (label) label.textContent = input.value + '%';
                s[key] = v;
                try { localStorage.setItem('roach3d.settings.v1', JSON.stringify(s)); } catch { }
                if (key === 'music') EventBus.emit('settings:music', v);
                if (key === 'sfx') EventBus.emit('settings:sfx', v);
                if (key === 'voice') EventBus.emit('settings:voice', v);
            };
            input.addEventListener('input', apply);
            apply();
        };

        makeSlider('set-music', 'music');
        makeSlider('set-sfx', 'sfx');
        makeSlider('set-voice', 'voice');

        // Кнопка сброса туториала
        const resetBtn = document.getElementById('btn-reset-tutorial');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                try {
                    localStorage.removeItem('roach3d.tutorial.level1');
                    localStorage.removeItem('roach3d.tutorial.level2');
                    Sound.upgrade?.();
                    resetBtn.textContent = 'ОБУЧЕНИЕ СБРОШЕНО ✓';
                    setTimeout(() => { resetBtn.textContent = 'СБРОСИТЬ ОБУЧЕНИЕ'; }, 2000);
                } catch { }
            });
        }
    }

    open() {
        this.isOpen = true;
        this._refresh();
        this._showPage('main');
        this.el.classList.remove('hidden');
        this.el.classList.add('show');
    }

    close() {
        this.isOpen = false;
        this.el.classList.add('hidden');
        this.el.classList.remove('show');
    }

    _showPage(name) {
        Object.entries(this.pages).forEach(([k, p]) => {
            if (!p) return;
            p.classList.toggle('active', k === name);
        });
        const titles = { main: '', skins: 'СКИНЫ', records: 'РЕКОРДЫ', settings: 'НАСТРОЙКИ', about: 'ОБ ИГРЕ' };
        if (this.pageTitle) {
            this.pageTitle.textContent = titles[name] || '';
            this.pageTitle.style.opacity = name === 'main' ? '0' : '1';
        }
        if (name === 'skins') this._renderSkins(SaveManager.load());
        if (name === 'records') this._renderRecords(SaveManager.load());
    }

    _refresh() {
        const stats = SaveManager.load();
        this._renderSkins(stats);
        this._renderRecords(stats);
    }

    _renderSkins(stats) {
        if (!this.skinsGrid) return;
        this.skinsGrid.innerHTML = '';

        // Берём скины из config.js, если он там есть. Иначе fallback
        const skins = (Array.isArray(SKINS_CFG) && SKINS_CFG.length) ? SKINS_CFG : FALLBACK_SKINS;
        const selected = stats.selectedSkin || 'default';

        for (const skin of skins) {
            const unlocked = SkinManager.isUnlocked(skin, stats);
            const card = document.createElement('div');
            card.className = 'skin-card' + (unlocked ? '' : ' locked') + (skin.id === selected ? ' selected' : '');

            card.innerHTML = `
        <div class="skin-icon">${skin.icon}</div>
        <div class="skin-name">${skin.name}</div>
        <div class="skin-desc">${unlocked ? skin.desc : SkinManager.unlockText(skin, stats)}</div>
        ${skin.id === selected && unlocked ? '<div class="skin-badge">ВЫБРАН</div>' : ''}
        ${!unlocked ? '<div class="skin-lock">🔒</div><div class="skin-chain"></div>' : ''}
      `;

            if (unlocked) {
                card.addEventListener('click', () => {
                    Sound.upgrade?.();
                    SaveManager.setSkin(skin.id);
                    EventBus.emit('skin:changed', skin.id);
                    this._renderSkins(SaveManager.load());
                });
            }
            this.skinsGrid.appendChild(card);
        }
    }

    _renderRecords(stats) {
        if (!this.recordsEl) return;
        const skins = (Array.isArray(SKINS_CFG) && SKINS_CFG.length) ? SKINS_CFG : FALLBACK_SKINS;
        const sk = skins.find(s => s.id === (stats.selectedSkin || 'default')) || skins[0];

        this.recordsEl.innerHTML = `
      <div class="rec-row"><span class="rec-label">🥇 Лучший срам</span><span class="rec-value">${stats.best || 0}</span></div>
      <div class="rec-row"><span class="rec-label">🏆 Побед</span><span class="rec-value">${stats.wins || 0}</span></div>
      <div class="rec-row"><span class="rec-label">🔁 Пробежек</span><span class="rec-value">${stats.runs || 0}</span></div>
      <div class="rec-row"><span class="rec-label">🎨 Скин</span><span class="rec-value">${sk.icon} ${sk.name}</span></div>
    `;
    }
}