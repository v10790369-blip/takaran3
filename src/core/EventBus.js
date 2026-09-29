// Класс EventBus + готовый глобальный экземпляр.

export class EventBusClass {
    constructor() { this.map = new Map(); }

    on(evt, fn) {
        if (!this.map.has(evt)) this.map.set(evt, []);
        this.map.get(evt).push(fn);
        return () => this.off(evt, fn);
    }

    off(evt, fn) {
        const arr = this.map.get(evt);
        if (!arr) return;
        const i = arr.indexOf(fn);
        if (i >= 0) arr.splice(i, 1);
    }

    emit(evt, ...args) {
        const arr = this.map.get(evt);
        if (arr) for (const fn of [...arr]) fn(...args);
    }

    clear() { this.map.clear(); }
}

// Глобальная шина для UI <-> Game (score, hp, wave, banner, gameover, win, restart)
export const EventBus = new EventBusClass();