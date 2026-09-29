// HUD — DOM-overlay поверх канваса. Слушает EventBus.
import { EventBus } from '../core/EventBus.js';
import { COLORS } from '../config.js';

export class HUD {
  constructor() {
    this.sramEl = document.getElementById('hud-sram');
    this.hpEl = document.getElementById('hud-hp');
    this.waveEl = document.getElementById('hud-wave');
    this.emoteEl = document.getElementById('host-emote');
    this.bannerEl = document.getElementById('banner');

    // Оверлей смерти/победы — новые элементы
    this.ovEl = document.getElementById('overlay');
    this.ovIcon = document.getElementById('ov-icon');
    this.ovTitle = document.getElementById('ov-title');
    this.ovSub = document.getElementById('ov-sub');
    this.ovStats = document.getElementById('ov-stats');
    this.ovBtn = document.getElementById('ov-btn');

    // Состояние для карточек статистики
    this._sram = 0;
    this._pranks = 0;
    this._wave = 1;
    this._best = 0;
    try {
      const stats = JSON.parse(localStorage.getItem('roach3d.save.v2') || '{}');
      this._best = stats.best || 0;
    } catch { this._best = 0; }

    this._bind();
  }

  _bind() {
    EventBus.on('score', s => {
      this._sram = s;
      this.sramEl.textContent = `СРАМ: ${s}`;
    });

    EventBus.on('hp', hp => {
      this.hpEl.textContent = '❤️'.repeat(Math.max(0, hp));
    });

    EventBus.on('wave', (w, p) => {
      this._wave = w;
      this._pranks = p;
      this.waveEl.innerHTML = `ВОЛНА ${w}<br><span style="font-size:14px;opacity:.8">ПАКОСТЕЙ: ${p}</span>`;
    });

    EventBus.on('host', em => this.emoteEl.textContent = em);

    EventBus.on('banner', (txt, color = COLORS.SRAM) => this._banner(txt, color));

    EventBus.on('gameover', (sram, wave) => this._showLose(sram, wave));
    EventBus.on('win', (sram, hasNext) => this._showWin(sram, hasNext));

    // Главная кнопка оверлея — обработчик навешиваем один раз
    this.ovBtn.addEventListener('click', () => {
      this.ovEl.classList.remove('show');
      setTimeout(() => { this.ovEl.style.display = 'none'; }, 300);

      if (this._pendingNextLevel) {
        this._pendingNextLevel = false;
        EventBus.emit('next-level');
      } else {
        EventBus.emit('restart');
      }
    });
  }

  _banner(text, color) {
    this.bannerEl.textContent = text;
    this.bannerEl.style.color = color;
    this.bannerEl.classList.add('show');
    clearTimeout(this._bannerTO);
    this._bannerTO = setTimeout(() => this.bannerEl.classList.remove('show'), 1500);
  }

  // ============ ПОРАЖЕНИЕ ============
  _showLose(sram, wave) {
    this._pendingNextLevel = false;
    this._showOverlay({
      kind: 'lose',
      icon: '💀',
      title: 'ТЕБЯ РАЗДАВИЛИ',
      sub: `ВОЛНА ${wave}`,
      btn: 'ЕЩЁ РАЗОК',
      stats: [
        { label: 'СРАМ', value: sram },
        { label: 'ПАКОСТЕЙ', value: this._pranks },
        { label: 'РЕКОРД', value: Math.max(this._best, sram) },
      ],
    });
  }

  // ============ ПОБЕДА ============
  _showWin(sram, hasNext) {
    this._pendingNextLevel = !!hasNext;
    this._showOverlay({
      kind: 'win',
      icon: hasNext ? '🏆' : '👑',
      title: hasNext ? 'УРОВЕНЬ ПРОЙДЕН!' : 'ТЫ СБЕЖАЛ!',
      sub: hasNext ? 'ВПЕРЕДИ КУХНЯ' : 'ЛЕГЕНДА ТАРАКАНЬЕГО МИРА',
      btn: hasNext ? 'ДАЛЬШЕ →' : 'В МЕНЮ',
      stats: [
        { label: 'СРАМ', value: sram },
        { label: 'ПАКОСТЕЙ', value: this._pranks },
        { label: 'РЕКОРД', value: Math.max(this._best, sram) },
      ],
    });
  }

  // ============ ОБЩИЙ МЕТОД ПОКАЗА ОВЕРЛЕЯ ============
  _showOverlay(data) {
    const panel = this.ovEl.querySelector('.ov-panel');
    panel.classList.toggle('win', data.kind === 'win');

    this.ovIcon.textContent = data.icon || '💀';
    this.ovTitle.textContent = data.title || '';
    this.ovSub.textContent = data.sub || '';
    this.ovBtn.textContent = data.btn || 'ЕЩЁ РАЗОК';

    // Карточки статистики
    this.ovStats.innerHTML = '';
    for (const s of (data.stats || [])) {
      const card = document.createElement('div');
      card.className = 'ov-stat';
      card.innerHTML = `
        <div class="ov-stat-label">${s.label}</div>
        <div class="ov-stat-value">${s.value}</div>
      `;
      this.ovStats.appendChild(card);
    }

    // Показать оверлей
    this.ovEl.style.display = 'flex';
    void this.ovEl.offsetWidth; // reflow для анимации
    this.ovEl.classList.add('show');
  }
}