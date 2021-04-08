import { $window } from '../Site';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { Component } from './Component';

export class Slider extends Component {

    private $item: JQuery;
    
    private index: number = 0;
    private $nav: JQuery;
    private $captions: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-item');
        this.$nav = this.view.find('.js-nav');
        this.$captions = this.view.find('.js-caption');

        this.bind();
    }


    private bind(): void {
        this.$nav.off('.nav').on('click.nav', this.switchSlide);
    }

    private switchSlide = (e): void => {
        const current = $(e.currentTarget);
        this.index = current.index();

        this.setActiveElement(this.$nav, 0);
        this.setActiveElement(this.$item, 100);
        this.setActiveElement(this.$captions, 1000);
    }


    private setActiveElement(el: JQuery, delay: number): void {
        el.removeClass('is-active');
        
        setTimeout( () => {
            el.eq(this.index).addClass('is-active');
        }, delay);
    }
}