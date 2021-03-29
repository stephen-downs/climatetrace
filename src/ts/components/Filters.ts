import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Filters extends Component {

    private $clear: JQuery;
    private $panel: JQuery;
    private $itemSector: JQuery;
    private $itemTime: JQuery;
    private $timelineItem: JQuery;
    private $allSectors: JQuery;

    private filters: Array<string> = [];
    private isAllChecked: boolean;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');
        this.$allSectors = this.view.find('.js-item-all');

        this.bind();
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        setTimeout(() => {
            this.$clear.css('height', this.$panel.outerHeight());
        });
    };


    private bind(): void {
        this.$itemSector.off('.sector').on('click.sector', this.toggleSector);
        this.$itemTime.off('.time').on('click.time', this.toggleTime);
        this.$clear.off('.clear').on('click.clear', this.clearArray);
        this.$allSectors.off('.all').on('click.all', this.markAllSectors);
    }


    private markAllSectors = (): void => {
        const timeChecked = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;

        this.clearArray();
        this.$itemSector.each((i, el) => {
            this.addElementToArray($(el), this.filters);
        });
        this.$allSectors.addClass('is-active');
        this.isAllChecked = true;

        if (timeChecked) {
            this.addElementToArray(timeChecked, this.filters);
            this.markTimeline(timeChecked);
        }
    }


    private clearArray = (): void => {
        this.filters = [];
        this.$itemTime.removeClass('is-active');
        this.$itemSector.removeClass('is-active');
        this.$allSectors.removeClass('is-active');
        this.isAllChecked = false;
        this.unmarkTimeline();
    }


    private toggleSector = (e) => {
        const current = $(e.currentTarget);

        if (current.hasClass('is-active')) {
            this.removeElementFromArray(current, this.filters);
            
            if (this.isAllChecked) {
                this.$allSectors.removeClass('is-active');
                this.isAllChecked = false;
            }
        } else {
            this.addElementToArray(current, this.filters);
        }
    }


    private toggleTime = (e) => {
        const current = $(e.currentTarget);
        this.unmarkTimeline();

        if (current.hasClass('is-active')) {
            this.removeElementFromArray(current, this.filters);
        } else {
            const activePrev = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;

            if (activePrev) {
                this.removeElementFromArray(activePrev, this.filters);
            }
            this.addElementToArray(current, this.filters);
            this.markTimeline(current);
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

    private removeElementFromArray($el: JQuery, array: Array<string>): void {
        const index = this.filters.indexOf($el.data('item'));
        if (index > -1) {
            array.splice(index, 1);
            $el.removeClass('is-active');
        }
        console.log('FILTERS:', this.filters);
    }


    private addElementToArray($el: JQuery, array: Array<string>): void {
        array.push($el.data('item'));
        $el.addClass('is-active');
        console.log('FILTERS:', this.filters);
    }

}
