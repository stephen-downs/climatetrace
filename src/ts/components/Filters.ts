import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Filters extends Component {

    private $clear: JQuery;
    private $panel: JQuery;
    private $itemSector: JQuery;
    private $itemTime: JQuery;
    private $timelineItem: JQuery;

    private filters: Array<string> = [];

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');

        this.bind();
    }


    private bind(): void {
        this.$itemSector.off('sector').on('click.sector', this.toggleSector);
        this.$itemTime.off('time').on('click.time', this.toggleTime);
    }


    private toggleSector = (e) => {
        const current = $(e.currentTarget);

        if (current.hasClass('is-active')) {
            const index = this.filters.indexOf(current.data('item'));
            
            if (index > -1) {
                this.filters.splice(index, 1);
                current.removeClass('is-active');
            }
            console.log('FILTERS:', this.filters);
        } else {
            this.filters.push(current.data('item'));
            current.addClass('is-active');
            console.log('FILTERS:', this.filters);
        }
    }


    private toggleTime = (e) => {
        const current = $(e.currentTarget);
        this.unmarkTimeline();

        if (current.hasClass('is-active')) {
            const index = this.filters.indexOf(current.data('item'));

            if (index > -1) {
                this.filters.splice(index, 1);
                current.removeClass('is-active');
            }
            console.log('FILTERS:', this.filters);
        } else {
            const activePrev = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;

            if (activePrev) {
                const index = this.filters.indexOf(activePrev.data('item'));

                if (index > -1) {
                    this.filters.splice(index, 1);
                    activePrev.removeClass('is-active');
                }
                console.log('FILTERS:', this.filters);
            }
            this.filters.push(current.data('item'));
            current.addClass('is-active');
            this.markTimeline(current);
            console.log('FILTERS:', this.filters);
        }
    }


    private markTimeline(el: JQuery): void {
        if (el.hasClass('js-time')) {
            this.$timelineItem.removeClass('is-active');
            const timelinedot = this.$timelineItem.filter('[data-time=' + el.data('item') + ']');
            timelinedot.addClass('is-active');
        }
    }


    private unmarkTimeline(): void {
        this.$timelineItem.removeClass('is-active');
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        this.$clear.css('height', this.$panel.outerHeight());
    };

}
