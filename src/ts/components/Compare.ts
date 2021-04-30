import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Compare extends Component {

    
    private $item: JQuery;
    private $itemMain: JQuery;
    private $delete: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-item');
        this.$itemMain = this.view.find('.js-item-main');
        this.$delete = this.view.find('.js-delete');

        this.bind();

        this.$item.eq(0).addClass('is-compare');
        this.compareNumbers(this.$item.eq(0));
    }


    private bind(): void {
        this.$item.on('click', this.onCompare);
        this.$delete.on('click', this.removeItem);
    }


    private onCompare = (e): void => {
        const current = $(e.currentTarget);
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
        const current = $(e.currentTarget).parent();

        current.hide();
    }
}
