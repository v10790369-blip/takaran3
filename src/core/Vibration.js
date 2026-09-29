// Вибрация на Android. На iOS браузер молча игнорирует.
export class Vibration {
    static supported() {
        return typeof navigator !== 'undefined' && 'vibrate' in navigator;
    }
    static tap(ms = 20) { if (this.supported()) navigator.vibrate(ms); }
    static hit() { if (this.supported()) navigator.vibrate([40, 30, 80]); }
    static prank() { if (this.supported()) navigator.vibrate(25); }
    static death() { if (this.supported()) navigator.vibrate([120, 60, 120, 60, 200]); }
    static win() { if (this.supported()) navigator.vibrate([60, 40, 60, 40, 120, 40, 200]); }
    static coin() { if (this.supported()) navigator.vibrate(15); }
}