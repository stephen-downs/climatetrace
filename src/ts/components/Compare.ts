import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc, $window } from '../Site';
import { Scroll } from '../Scroll';


export class Compare extends Component {

    
    private $item: JQuery;
    private $itemMain: JQuery;
    private $delete: JQuery;
    private $addItem: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-item');
        this.$itemMain = this.view.find('.js-item-main');
        this.$delete = this.view.find('.js-delete');
        this.$addItem = this.view.find('.js-add-item');

        this.bind();

        this.$item.eq(0).addClass('is-compare');
        this.compareNumbers(this.$item.eq(0));
    }


    private bind(): void {
        this.$item.on('click', (e) => this.onCompare(e));
        this.$delete.on('click', this.removeItem);
    }


    private onCompare(e, element?: JQuery): void {
        const current = element ? element : $(e.currentTarget);
        const index = current.index();
        this.$item.removeClass('is-compare');
        current.addClass('is-compare');

        gsap.to(this.$itemMain, { duration: 0.5, y: this.$itemMain.outerHeight() * index + (10 * index) });
        this.compareNumbers(current);
    }


    private compareNumbers(el: JQuery): void {
        const valueMain: number = parseInt(this.$itemMain.find('.js-comp-num').text(), 10);
        const valueSecond: number = parseInt(el.find('.js-comp-num').text(), 10);

        this.$item.removeClass('is-higher is-lower');
        this.$itemMain.removeClass('is-higher is-lower');

        if (valueMain > valueSecond) {
            this.$itemMain.addClass('is-higher');
            el.addClass('is-lower');
        }

        if (valueMain < valueSecond) {
            el.addClass('is-higher');
            this.$itemMain.addClass('is-lower');
        }
    }


    private removeItem = (e): void => {
        e.stopPropagation();
        const current = $(e.currentTarget).parent();
        let elCompare = current.hasClass('is-compare') ? true : false;
        let el = current.next().length > 0 ? current.next() : current.prev();
        
        if (el.hasClass('js-add-item')) {
            el = current.prev();
        }

        current.remove();
        setTimeout( () => {
            $window.resize();
            this.$item = this.view.find('.js-item');

            if (this.$item.length < 2) {
                this.$item.addClass('is-remove-blocking');
            }

            if (elCompare) {
                this.onCompare(e, el);
            }
        }, 10);
    }
}
