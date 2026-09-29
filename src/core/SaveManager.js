// Рекорды + выбранный скин в localStorage.
const KEY = 'roach3d.save.v2';

export class SaveManager {
    static _defaults() {
        return { best: 0, wins: 0, runs: 0, selectedSkin: 'default' };
    }
    static load() {
        try {
            const raw = JSON.parse(localStorage.getItem(KEY));
            return { ...this._defaults(), ...(raw || {}) };
        } catch { return this._defaults(); }
    }
    static save(data) {
        try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { }
    }
    static recordRun(sram, won) {
        const d = this.load();
        d.runs++;
        if (won) d.wins++;
        if (sram > d.best) d.best = sram;
        this.save(d);
        return d;
    }
    static setSkin(id) {
        const d = this.load();
        d.selectedSkin = id;
        this.save(d);
    }
}