// Панель активного квеста + модальный диалог. Всё DOM поверх canvas.
import { EventBus } from '../core/EventBus.js';

export class QuestUI {
    constructor() {
        this.panel = document.getElementById('quest-panel');
        this.qpIcon = this.panel.querySelector('.qp-icon');
        this.qpTitle = this.panel.querySelector('.qp-title');
        this.qpDesc = this.panel.querySelector('.qp-desc');
        this.qpFill = this.panel.querySelector('.qp-fill');
        this.qpCount = this.panel.querySelector('.qp-count');

        this.dialog = document.getElementById('dialog');
        this.dlgPortrait = this.dialog.querySelector('.dlg-portrait');
        this.dlgName = this.dialog.querySelector('.dlg-name');
        this.dlgText = this.dialog.querySelector('.dlg-text');
        this.dlgBtn = this.dialog.querySelector('.dlg-next');

        this._dialogPages = [];
        this._dialogIndex = 0;
        this._dialogOnDone = null;
        this._dialogOpen = false;

        this.dlgBtn.addEventListener('click', () => this._nextPage());

        EventBus.on('quest:show', (quest) => this._showQuest(quest));
        EventBus.on('quest:update', (current, target) => this._updateQuest(current, target));
        EventBus.on('quest:hide', () => this._hideQuest());
        EventBus.on('dialog:open', (data) => this._openDialog(data));
    }

    /* ================== КВЕСТ-ПАНЕЛЬ ================== */
    _showQuest(q) {
        this.qpIcon.textContent = q.icon || '🐭';
        this.qpTitle.textContent = q.title || 'ЗАДАНИЕ';
        this.qpDesc.textContent = q.desc || '';
        this.qpCount.textContent = `0 / ${q.target}`;
        this.qpFill.style.width = '0%';
        this.panel.classList.remove('hidden');
        this.panel.classList.add('pop-in');
        setTimeout(() => this.panel.classList.remove('pop-in'), 500);
    }

    _updateQuest(cur, max) {
        this.qpCount.textContent = `${cur} / ${max}`;
        const pct = Math.min(100, (cur / max) * 100);
        this.qpFill.style.width = pct + '%';
        if (cur > 0 && cur < max) {
            this.panel.classList.add('tick');
            setTimeout(() => this.panel.classList.remove('tick'), 250);
        }
    }

    _hideQuest() {
        this.panel.classList.add('fade-out');
        setTimeout(() => {
            this.panel.classList.add('hidden');
            this.panel.classList.remove('fade-out');
        }, 400);
    }

    /* ================== ДИАЛОГ ================== */
    _openDialog({ name, portrait, pages, onDone }) {
        if (this._dialogOpen) return;
        this._dialogOpen = true;
        this._dialogPages = pages;
        this._dialogIndex = 0;
        this._dialogOnDone = onDone;
        this.dlgName.textContent = name || '';
        this.dlgPortrait.textContent = portrait || '🐭';
        this._renderPage();
        this.dialog.classList.remove('hidden');
        this.dialog.classList.add('pop-in');
    }

    _renderPage() {
        const p = this._dialogPages[this._dialogIndex];
        this.dlgText.textContent = p.text || '';
        this.dlgBtn.textContent = p.button || (this._dialogIndex < this._dialogPages.length - 1 ? 'ДАЛЕЕ' : 'ПРИНЯТЬ');
    }

    _nextPage() {
        this._dialogIndex++;
        if (this._dialogIndex >= this._dialogPages.length) {
            this._closeDialog();
            if (this._dialogOnDone) this._dialogOnDone();
            return;
        }
        // Анимация смены текста
        this.dlgText.style.opacity = '0';
        setTimeout(() => {
            this._renderPage();
            this.dlgText.style.opacity = '1';
        }, 120);
    }

    _closeDialog() {
        this._dialogOpen = false;
        this.dialog.classList.add('fade-out');
        setTimeout(() => {
            this.dialog.classList.add('hidden');
            this.dialog.classList.remove('fade-out', 'pop-in');
        }, 250);
    }
}