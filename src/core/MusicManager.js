// Музыка: 4 трека играют по кругу. Автозапуск после первого клика (браузеры блокируют).
export class MusicManager {
    constructor(tracks) {
        this.tracks = tracks;
        this.currentIndex = 0;
        this.audio = null;
        this.volume = 0.35;
        this.enabled = true;
        this.started = false;
        this.missingTracks = new Set();
    }

    start() {
        if (this.started) return;
        this.started = true;
        this._playTrack(this.currentIndex);
    }

    _playTrack(i) {
        if (!this.enabled) return;

        // Пропускаем треки, которых нет
        let tries = 0;
        while (this.missingTracks.has(i) && tries < this.tracks.length) {
            i = (i + 1) % this.tracks.length;
            tries++;
        }
        if (tries >= this.tracks.length) {
            console.warn('🎵 Все треки отсутствуют');
            return;
        }

        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        const src = this.tracks[i];
        const audio = new Audio(src);
        audio.volume = this.volume;
        audio.preload = 'auto';

        audio.addEventListener('ended', () => {
            this.currentIndex = (i + 1) % this.tracks.length;
            this._playTrack(this.currentIndex);
        });

        audio.addEventListener('error', () => {
            console.warn('🎵 Не найден трек:', src);
            this.missingTracks.add(i);
            // Пробуем следующий
            this.currentIndex = (i + 1) % this.tracks.length;
            this._playTrack(this.currentIndex);
        });

        this.audio = audio;

        // play() возвращает промис — ловим блокировку автоплея
        const p = audio.play();
        if (p && p.catch) {
            p.catch(() => {
                console.warn('🎵 Автоплей заблокирован, ждём клика');
                this.started = false;   // попробуем ещё раз при следующем взаимодействии
            });
        }
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
        if (this.audio) this.audio.volume = this.volume;
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            if (this.audio) this.audio.pause();
        } else {
            this._playTrack(this.currentIndex);
        }
    }
}

export const MUSIC_TRACKS = [
    'assets/music/musicgame1.mp3',
    'assets/music/musicgame2.mp3',
    'assets/music/musicgame3.mp3',
    'assets/music/musicgame4.mp3',
];