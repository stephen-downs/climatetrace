import { $window } from '../Site';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { Component } from '../components/Component';
// import gsap from 'gsap';
// import { Video } from '../components/Video';/
import * as $ from 'jquery';

export interface IBackgroundData {
    id: string;
    step: number;
    darken: boolean;
    darkenDelay: number;
    noAnimation?: boolean;
}



export default abstract class Background extends Component {

    public id: string;
    public darkenDelay: number;
    public shown: boolean;

    protected settings;
    private $wrap: JQuery;
    private $darken: JQuery;
    private currentStep: number;
    private $backgrounds: JQuery;
    private $modules: JQuery;
    private tiemout: number;

    constructor(protected view: JQuery, protected options?) {
        super(view, options);

        this.settings = options || {};

        this.$wrap = this.view.find('.js-wrap');
        this.$darken = this.view.find('.js-darken');
        this.$backgrounds = $('.background');
        this.$modules = $('.module');


        this.view.data('Background', this);
        this.$backgrounds.removeClass('is-shown');

        // this.detectActualModule();
        this.setMobileHeight();


    }



    public animationIn(quick?: boolean, delay?: number): void {
        this.$backgrounds.removeClass('is-shown');
        this.view.show();
        this.view.addClass('is-shown');
        this.shown = true;
        const duration = this.settings.noAnimation ? 0 : 0.5;
        
        // $window.resize();

        // if (this.view.find('[data-component="Video"]').length > 0) {
        //     const playerEl = this.view.find('[data-component="Video"]');
        //     const player: Video = playerEl.data('Video');
        //     player.resize();
        // }

        gsap.killTweensOf(this.view);
        gsap.killTweensOf(this.$wrap);


        gsap.fromTo(this.view, {
            zIndex: 2,
            opacity: 0,
        }, {
            duration: duration,
            zIndex: 2,
            opacity: 1,
            ease: 'sine.out',
            delay: !quick ? delay || 0 : 0,
        });

        clearTimeout(this.tiemout);
        this.tiemout = window.setTimeout(() => {
            this.detectActualModule(this.view);
            this.cssAnimation();
        }, 200);
    }



    public animationOut(quick?: boolean): void {
        // this.view.removeClass('is-shown');
        // this.$backgrounds.removeClass('is-shown');
        this.shown = false;

        gsap.killTweensOf(this.view);
        gsap.killTweensOf(this.$wrap);

        gsap.fromTo(this.view, {
            zIndex: 1,
        }, {
            duration: !quick ? 0.5 : 0,
            zIndex: 1,
            opacity: 0,
            ease: 'sine.out',
            onComplete: (): void => {
                this.view.hide();
                this.darken(false, true);

                if (this.view.hasClass('is-shown')) {
                    this.view.removeClass('is-shown');
                }
            },
        });


    }



    public setStep(index: number, quick?: boolean): void {

        if (index === this.currentStep) { return; }
        this.currentStep = index;

        this.view
            .removeClass('is-step-' + [0, 1, 2, 3, 4].join(' is-step-'))
            .addClass('is-step-' + index);
    }




    public stepUp(portion: number): void {
        const steps = this.currentStep;
        let unit = 1;

        this.view
            .removeClass('is-step-' + [0, 1, 2, 3, 4].join(' is-step-'))
            .addClass('is-step-' + unit);

        for (let i = 1; i <= steps; i++) {

            if ( portion > i / steps ) {
                unit++;

                this.view
                    .removeClass('is-step-' + [0, 1, 2, 3, 4].join(' is-step-'))
                    .addClass('is-step-' + unit);
            }
        }
    }



    /**
     * updates value continuously on scroll event
     * @param {number} portion value from 0 to 1
     */
    public update(portion: number): void {

        if (this.currentStep) {
            this.stepUp(portion);
        }

    }

    /**
     * Add 'js-animate' class to proper element on HTML.
     * Do CSS animation after 'is-animating' class in stylesheet
     */
    public cssAnimation(): void {
        const $elAnimate = this.view.find('.js-animate');

        if ($elAnimate.length > 0 && this.view.hasClass('is-shown')) {
            $elAnimate.addClass('is-animating');
        } else {
            $('.js-animate').removeClass('is-animating');
        }
    }



    public darken(toShow: boolean, quick?: boolean): void {
        gsap.to(this.$darken, {
            duration:!quick ? 0.4 : 0.0001,
            opacity: toShow ? 1 : 0,
            ease: 'power2.out',
        });
    }


    /**
     * Update proper nav item aside
     */
    public detectActualModule($current: JQuery): void {
        const bgs = $('[data-background]');

        let moduleId,
            activeBg,
            activeModule;


        activeBg = $current;
        activeModule = this.$modules.filter('[data-id=' + activeBg.attr('id') + ']');
        moduleId = activeModule.attr('id');

        if (!!activeBg) {
            if (activeBg.hasClass('background--videobg')) {

                // const playerEl = activeBg.find('[data-component="Video"]');
                // const player: Video = playerEl.data('Video');
                // player.resize();
                // player.play();
            }
        }

        if (activeModule) {
            this.$modules.removeClass('in-view');
            activeModule.addClass('in-view');
        }
    }



    public resize = (wdt?: number, hgt?: number, breakpoint?: IBreakpoint, changed?: boolean): void => {};




    private setMobileHeight(): void {
        const height = $(window).height() + 70;

        if (!breakpoint.desktop) {
            this.view.parent().css('height', height);
        }
    }
}
