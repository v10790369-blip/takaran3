// Голосовые реплики. Режим cycle — по кругу, random — случайно.
// Файлы, которых нет, игнорируются. Как только появятся — заработают сразу.

export class VoiceManager {
    constructor(tracks, { mode = 'cycle', cooldown = 4, volume = 0.7 } = {}) {
        this.tracks = tracks;
        this.mode = mode;
        this.cooldown = 0;
        this.baseCooldown = cooldown;
        this.volume = volume;
        this.enabled = true;
        this.currentAudio = null;
        this.missing = new Set();
        this.nextIndex = 0;
    }

    // Следующий доступный трек (по кругу)
    _nextAvailable() {
        for (let tries = 0; tries < this.tracks.length; tries++) {
            const i = this.nextIndex;
            this.nextIndex = (this.nextIndex + 1) % this.tracks.length;
            if (!this.missing.has(i)) return i;
        }
        return -1;
    }

    // Случайный доступный трек
    _randomAvailable() {
        const avail = this.tracks.map((_, i) => i).filter(i => !this.missing.has(i));
        if (!avail.length) return -1;
        return avail[Math.floor(Math.random() * avail.length)];
    }

    // Сыграть одну реплику (если кулдаун прошёл)
    play(force = false) {
        if (!this.enabled) return;
        if (!force && this.cooldown > 0) return;

        const idx = this.mode === 'cycle' ? this._nextAvailable() : this._randomAvailable();
        if (idx < 0) return;

        const src = this.tracks[idx];

        if (this.currentAudio) {
            try { this.currentAudio.pause(); } catch { }
            this.currentAudio = null;
        }

        const audio = new Audio(src);
        audio.volume = this.volume;

        audio.addEventListener('error', () => {
            // Файла нет — запоминаем и больше не пытаемся его грузить
            this.missing.add(idx);
        });
        audio.addEventListener('ended', () => {
            if (this.currentAudio === audio) this.currentAudio = null;
        });

        const p = audio.play();
        if (p && p.catch) p.catch(() => { });  // блокировка автоплея — просто игнорируем
        this.currentAudio = audio;

        this.cooldown = this.baseCooldown;
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.currentAudio) this.currentAudio.volume = this.volume;
    }

    
    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
    }

    reset() {
        this.cooldown = 0;
        // НЕ сбрасываем missing — чтоб не перегружать одни и те же отсутствующие файлы
    }

    stop() {
        if (this.currentAudio) {
            try { this.currentAudio.pause(); } catch { }
            this.currentAudio = null;
        }
    }
}

// Наборы треков
export const VOICE_SETS = {
    host: ['assets/sounds/sosed1.mp3', 'assets/sounds/sosed2.mp3', 'assets/sounds/sosed3.mp3', 'assets/sounds/sosed4.mp3'],
    wife: ['assets/sounds/girl1.mp3', 'assets/sounds/girl2.mp3', 'assets/sounds/girl3.mp3', 'assets/sounds/girl4.mp3'],
    dog: ['assets/sounds/dog1.mp3', 'assets/sounds/dog2.mp3', 'assets/sounds/dog3.mp3', 'assets/sounds/dog4.mp3'],
    cat: ['assets/sounds/cat1.mp3', 'assets/sounds/cat2.mp3', 'assets/sounds/cat3.mp3', 'assets/sounds/cat4.mp3'],
    rat: [],  
};