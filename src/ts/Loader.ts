export class Loader {

    private progress: number;
    private width: number;



    constructor(protected view: JQuery) {
        this.width = window.innerWidth;
        this.progress = 0;
    }



    public show(): void {
        gsap.to(this.view, { y: 0, duration: 0.2 });
    }



    public hide(): void {
        gsap.killTweensOf(this.view, ['width']);
        gsap.to(this.view, { duration: 0.5, y: 10, width: this.width || '100%' });
    }



    public set(progress: number): void {
        this.progress = progress;

        gsap.killTweensOf(this.view, ['y']);

        let width = this.width * progress;

        gsap.killTweensOf(this.view, ['width']);
        gsap.to(this.view, { duration: 0.3, width: width });
    }



    public resize(wdt: number, hgt: number): void {
        this.width = wdt;
    }
}
