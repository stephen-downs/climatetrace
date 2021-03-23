import { Handler } from '../Handler';
import { IBreakpoint } from '../Breakpoint';

export class ComponentEvents {
    public static readonly CHANGE: string = 'change';
}

export abstract class Component extends Handler {


    constructor(protected view: JQuery, protected options?: Object) {
        super();
        if (!view[0]) { console.warn('component built without view'); }
        this.view.data('comp', this);
    }



    public preloadImages(): Array<string> {
        return [];
    }



    public onState(): boolean {
        return false;
    }



    public animateIn(index?: number, delay?: number): void { }



    public animateOut(): Promise<void> {

        // if you don't want to animate component,
        // just return empty Promise:
        return Promise.resolve(null);

        // if you need animation:
        // return new Promise<void>((resolve, reject) => {
        //     gsap.to(this.view, {
        //         onComplete: (): void => {
        //             resolve();
        //         },
        //         duration: 0.3,
        //         opacity: 0,
        //     });
        // });
    }



    public turnOff(): void { }



    public turnOn(): void { }



    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => { };



    public destroy(): void {
        this.view.data('comp', null);
        this.view.off();
        super.destroy();
    }
}
