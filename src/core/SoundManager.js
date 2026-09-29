// Все звуки генерируются через Web Audio — ни одного mp3.
export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterGain = null;
        this.baseVolume = 0.7;
    }

    _ensure() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.baseVolume * 0.5;
            this.masterGain.connect(this.ctx.destination);
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    _tone(freq, dur, type = 'sine', vol = 0.3, slideTo = null) {
        if (!this.enabled) return;
        this._ensure();
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
        osc.connect(gain); gain.connect(this.masterGain);
        osc.start(t); osc.stop(t + dur + 0.05);
    }

    _noise(dur, vol = 0.3, filterFreq = 1000, filterType = 'lowpass') {
        if (!this.enabled) return;
        this._ensure();
        const t = this.ctx.currentTime;
        const size = Math.floor(this.ctx.sampleRate * dur);
        const buf = this.ctx.createBuffer(1, size, this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const f = this.ctx.createBiquadFilter();
        f.type = filterType; f.frequency.value = filterFreq;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        src.connect(f); f.connect(g); g.connect(this.masterGain);
        src.start(t); src.stop(t + dur + 0.05);
    }

    setVolume(v) {
        this.baseVolume = Math.max(0, Math.min(1, v));
        if (this.masterGain) this.masterGain.gain.value = this.baseVolume * 0.5;
    }

    roachSqueak() { this._tone(1200, 0.08, 'square', 0.12, 1800); }
    crumb() { this._tone(2000, 0.04, 'square', 0.06); }
    prank() {
        this._tone(600, 0.1, 'triangle', 0.22, 1200);
        setTimeout(() => this._tone(900, 0.15, 'triangle', 0.22, 1600), 80);
    }
    slipperThrow() { this._noise(0.15, 0.18, 400, 'highpass'); }
    slipperLand() {
        this._tone(150, 0.14, 'sawtooth', 0.35, 60);
        this._noise(0.1, 0.28, 300);
    }
    catMeow() { this._tone(600, 0.4, 'sawtooth', 0.18, 350); }
    spray() { this._noise(0.9, 0.14, 3000, 'highpass'); }
    damage() { this._tone(200, 0.28, 'sawtooth', 0.35, 80); }
    waveUp() {
        this._tone(400, 0.15, 'triangle', 0.3, 800);
        setTimeout(() => this._tone(600, 0.2, 'triangle', 0.3, 1200), 100);
    }
    hostScream() {
        this._noise(0.4, 0.28, 800, 'bandpass');
        this._tone(800, 0.4, 'sawtooth', 0.14, 500);
    }
    upgrade() { this._tone(800, 0.1, 'triangle', 0.3, 1600); }
    win() {
        [523, 659, 784, 1047].forEach((n, i) =>
            setTimeout(() => this._tone(n, 0.3, 'triangle', 0.3), i * 130));
    }
    lose() {
        [400, 350, 300, 200].forEach((n, i) =>
            setTimeout(() => this._tone(n, 0.3, 'sawtooth', 0.3), i * 150));
    }
}

export const Sound = new SoundManager();