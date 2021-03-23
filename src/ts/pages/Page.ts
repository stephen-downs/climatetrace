import { Handler } from '../Handler';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { Component, ComponentEvents } from '../components/Component';
// import Background from '../backgrounds/Background';
import { components } from '../Classes';
import { $article, $body, $main } from '../Site';

export class PageEvents {
    public static readonly PROGRESS: string = 'progress';
    public static readonly COMPLETE: string = 'complete';
    public static readonly CHANGE: string = 'append';
}

export class Page extends Handler {

    public components: Array<Component> = [];
    // public backgrounds: {[key: string]: Background};
    private loader: JQueryDeferred<ImagesLoaded.ImagesLoaded>;



    constructor(protected view: JQuery, options?) {

        super();
        this.view.css({ opacity: 0 });

        this.components = [];
        this.buildComponents(this.view.parent().find('[data-component]'));
    }



    /**
     * preload necessary assets:
     * @return {Promise<boolean>} loading images promise
     */
    public preload(): Promise<void> {

        let il = imagesLoaded(this.view.find('.preload').toArray(), <ImagesLoaded.ImagesLoadedOptions>{ background: true });
        let images = [];

        for (let component of this.components) {
            images = images.concat(component.preloadImages());
        }
        for (let url of images) {
            il.addBackground(url, null);
        }

        return new Promise<void>((resolve, reject) => {
            this.loader = il.jqDeferred;
            this.loader.progress((instance: ImagesLoaded.ImagesLoaded, image: ImagesLoaded.LoadingImage) => {
                let progress: number = instance.progressedCount / instance.images.length;
                this.trigger(PageEvents.PROGRESS, progress);
            }).always(() => {
                this.trigger(PageEvents.COMPLETE);
                resolve();
            });
        });
    }



    /**
     * check if any Component can be changed after onState
     * @return {boolean} returns true when one of the components takes action in onState function call
     */
    public onState(): boolean {

        let changed: boolean = !!false;
        for (let component of this.components) {
            const componentChanged: boolean = component.onState();
            if (!changed && !!componentChanged) {
                changed = true;
            }
        }

        return changed;
    }



    /**
     * page entering animation
     * @param {number} delay animation delay
     */
    public animateIn(delay?: number): void {
        const bg = $('#backgrounds-fixed');
        gsap.to(bg, { duration: 0.5, opacity: 1, display: 'block'});

        // this.callAll(this.components, 'animateIn');
        for (let i = 0; i < this.components.length; ++i) {
            this.components[i].animateIn(i, delay);
        }
        gsap.to(this.view, {
            duration: 0.4,
            opacity: 1,
            onComplete: () => {
                gsap.to(bg, { duration: 0.5, opacity: 1, display: 'block'});
            }
        });
    }



    /**
     * page exit animation
     * (called after new content is loaded and before is rendered)
     * @return {Promise<boolean>} animation promise
     */
    public animateOut(): Promise<void> {
        const bg = $('#backgrounds-fixed');
        // animation of the page:
        $main.removeClass('is-loaded');
        gsap.set(bg, { opacity: 0, display: 'none'});
        let pageAnimationPromise = new Promise<void>((resolve, reject) => {
            gsap.to(this.view, {
                duration: 0.4,
                onComplete: (): void => {
                    resolve();
                    $body.removeAttr('class');
                },
                opacity: 0,
            });
        });

        // animations of all components:
        let componentAnimations: Array<Promise<void>> = this.components.map((obj): Promise<void> => {
            return <Promise<void>>obj.animateOut();
        });

        // return one promise waiting for all animations:
        return new Promise<void>((resolve, reject) => {

            let allPromises: Array<Promise<void>> = componentAnimations.concat(pageAnimationPromise);

            Promise.all<void>(allPromises).then((results) => {
                resolve();
            });
        });
    }




    /**
     * Visibility widget handler, fires when user exits browser tab
     */
    public turnOff(): void {
        this.callAll('turnOff');
    }


    /**
     * Visibility widget handler, fires when user exits browser tab
     */
    public turnOn(): void {
        this.callAll('turnOn');
    }



    /**
     * resize handler
     * @param {[type]} wdt        window width
     * @param {[type]} hgt        window height
     * @param {[type]} breakpoint IBreakpoint object
     */
    public resize(wdt: number, hgt: number, breakpoint: IBreakpoint, bpChanged?: boolean): void {
        this.callAll('resize', wdt, hgt, breakpoint, bpChanged);
    }



    /**
     * cleanup when closing Page
     */
    public destroy(): void {
        this.callAll('destroy');
        this.components = [];
        // this.backgrounds = {};

        gsap.killTweensOf(this.view);
        this.view = null;

        super.destroy();
    }



    protected buildComponents($components: JQuery): void {
        for (let i = $components.length - 1; i >= 0; i--) {
            const $component: JQuery = $components.eq(i);
            const componentName: string = $component.data('component');
            // console.log(componentName, components);

            if (componentName !== undefined && components[componentName]) {
                const options: Object = $component.data('options'),
                    component: Component = new components[componentName]($component, options);
                this.components.push(component);
                component.on(ComponentEvents.CHANGE, this.onComponentChange);
            } else {
                window.console.warn('There is no `%s` component!', componentName);
            }
        }
    }

    private onComponentChange = (el): void => {
        this.buildComponents(el.filter('[data-component]').add(el.find('[data-component]')));
        this.trigger(PageEvents.CHANGE, el);
    }


    // short call
    private callAll(fn: string, ...args): void {
        for (let component of this.components) {
            if (typeof component[fn] === 'function') {
                component[fn].apply(component, [].slice.call(arguments, 1));
            }
        }

    }
}
