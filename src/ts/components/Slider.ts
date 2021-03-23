import { $window } from '../Site';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { Component } from './Component';
import { Swipe, SwipeEvents, ISwipeCoordinates } from './Swipe';
// import { Player } from './Player';

interface ISliderSettings {
    type: string,
    mode: string,
    phone?: string,
    desktop?: string,
}

export class Slider extends Component {

    private $item: JQuery;
    private $list: JQuery;
    private offset: number = 0;
    private index: number = 1;
    // private count: number = 0;
    private $buttonPrev: JQuery;
    private $buttonNext: JQuery;
    private $dot: JQuery;
    private swipe: Swipe;
    private itemWidth: number;
    private margin: number = 32;
    private settings: ISliderSettings;

    constructor(protected view: JQuery, protected options?) {
        super(view);
        this.$item = this.view.find('.js-item');
        this.$list = this.view.find('.js-list');
        this.$buttonPrev = this.view.find('.js-prev');
        this.$buttonNext = this.view.find('.js-next');
        this.$dot = this.view.find('.js-dot');
        this.margin = this.$item.outerWidth(true) - this.$item.width();
        this.itemWidth = this.$item.width() + this.margin;
        this.settings = $.extend({
            type: '',
        }, options || view.data('options') || {});

        // if (this.settings.margin) {
        //     this.margin = this.settings.margin;
        // }

        if (breakpoint.phone && (this.settings.type  === 'phone-disable' || this.settings.phone === 'disabled')) {
            return;
        }

        if (!breakpoint.desktop && this.settings.mode === 'center-mobile') {
            this.settings.mode = 'center';
        }

        if (breakpoint.tablet && this.settings.mode === 'center-tablet') {
            this.settings.mode = 'center';
        }

        this.init();
        this.bind();

        const swipeEl = breakpoint.desktop ? this.$list : this.$item.first();
        
        this.swipe = new Swipe(this.$list, {
            horizontal: true,
            vertical: false,
            minimum: 80,
            disableMouse: false,
            disableTouch: false,
        });
        this.swipe.on(SwipeEvents.END, this.onSwipe);

        // console.log(this.$item.outerWidth(true) - this.$item.width());
    }

    
    public resize = (wdt: number, hgt: number, breakpoint?, bpChanged?: boolean): void => {
        if (breakpoint.phone && (this.settings.type === 'phone-disable' || this.settings.phone === 'disabled')) { return; }
        this.itemWidth = this.$item.width() + this.margin;
        let width = this.itemWidth * this.$item.length;
        this.$list.css('width', width);
        this.go(this.index);
    };


    private init(): void {
        

        gsap.set(this.$list, { x: this.offset });
        this.setActiveItems();
        this.resizeDots();

        if (this.settings.mode === 'center' && this.$item.length > 2) {
            this.index = 2;
            this.go(2);
        }
    }

    private bind(): void {
        this.$buttonPrev.off('.slidercustom').on('click.slidercustom', (e) => this.prev());
        this.$buttonNext.off('.slidercustom').on('click.slidercustom', (e) => this.next());
        this.$dot.off('.slidercustom').on('click.slidercustom', (e) => this.clickElement(e));
        this.$item.off('.slidercustom').on('click.slidercustom', (e) => this.clickElement(e));
    }


    private resizeDots(): void {
        if (!this.$dot) { return; }
        if (this.$dot.length > 7) {
            this.$dot.each( el => {
                $(el).css({
                    'width': '10px',
                    'height': '10px',
                    'margin-left': '3px',
                    'margin-right': '3px'
                })
            });
        }
    }


    private onSwipe = (e: ISwipeCoordinates): void => {
        if (e.direction === 'left' || e.direction === 'right') {
            // console.log(e.direction, e.);
            this.shift({
                left: +1, right: -1,
            }[e.direction]);
        }
    }



    private shift(dir: number): void {
        let old;

        if (dir === -1) {
            this.prev();
        } else {
            this.next();
        }
    }



    private clickElement(e): void {
        e.stopPropagation();
        console.log($(e.target));
        if ($(e.target).hasClass('share__button') || $(e.target).hasClass('evaluation') || $(e.target).hasClass('slider__item-footer')) { return ; }
        let el = $(e.currentTarget);
        let i = el.index() + 1;
        this.index = i;

        this.go(this.index);
    }


    private next(): void {
        if (this.index < this.$item.length) {
            this.index = this.index + 1;
            this.go(this.index);
        }
    }


    private prev(): void {
        if (this.index > 1) {
            this.index = this.index - 1;
            this.go(this.index);
        }
    }



    private go(index: number): void {
        // Player.pauseAll();
        let x = (index * this.itemWidth) - this.itemWidth;
        x = this.settings.mode === 'center' ? (x - ($window.width() * 0.5) - this.margin) + this.itemWidth * 0.5 : x
        gsap.to(this.$list, { duration: 0.5, x: -x, transformOrigin: '50% 50%',  ease: 'sine.inOut', onComplete: () => {} });

        this.setActiveItems();
    }


    private setActiveItems(): void {
        this.setNavAvailbility();

        this.$item.removeClass('is-active');
        this.$item.eq(this.index - 1).addClass('is-active');
        this.$dot.removeClass('is-active');
        this.$dot.eq(this.index - 1).addClass('is-active');

        this.setInViewItemClass();
    }

    // To make visible social footer for next item in article slider
    private setInViewItemClass(): void {
        if (!breakpoint.phone && this.settings.type === 'article') {
            this.$item.removeClass('is-in-view');
            this.$item.filter('.is-active').next().addClass('is-in-view');
        }
    }


    private setNavAvailbility(): void {

        switch (true) {
            
            case this.index == 1:
                this.$buttonPrev.addClass('is-disabled');
                this.$buttonNext.removeClass('is-disabled');
                break;

            case this.index === this.$item.length:
                this.$buttonNext.addClass('is-disabled');
                this.$buttonPrev.removeClass('is-disabled');
                break;
            default:
                this.$buttonNext.removeClass('is-disabled');
                this.$buttonPrev.removeClass('is-disabled');

        }
    }
}
