// Скины Жоры. Разблокируются за рекорды.
import { SKINS } from '../config.js';

export class SkinManager {
    static isUnlocked(skin, stats) {
        if (!skin.unlock) return true;
        switch (skin.unlock.type) {
            case 'sram': return stats.best >= skin.unlock.value;
            case 'wins': return stats.wins >= skin.unlock.value;
            case 'runs': return stats.runs >= skin.unlock.value;
            default: return false;
        }
    }

    static getSkin(id) {
        return SKINS.find(s => s.id === id) || SKINS[0];
    }

    static unlockText(skin, stats) {
        if (!skin.unlock) return 'Открыт';
        if (this.isUnlocked(skin, stats)) return 'Открыт';
        switch (skin.unlock.type) {
            case 'sram': return `Нужно ${skin.unlock.value} срама`;
            case 'wins': return `Побед: ${stats.wins} / ${skin.unlock.value}`;
            case 'runs': return `Пробежек: ${stats.runs} / ${skin.unlock.value}`;
            default: return '???';
        }
    }
}