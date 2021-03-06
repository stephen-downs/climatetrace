import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


interface IFiltersSettings {
    status: string,
    tags: string,
}


export class Filters extends Component {

    public static instance: Filters;

    private $clear: JQuery;
    private $panel: JQuery;
    private $itemSector: JQuery;
    private $itemTime: JQuery;
    private $timelineItem: JQuery;
    private $itemCountry: JQuery;
    private $allSectors: JQuery;
    private $picked: JQuery;
    private $selectedCountry: JQuery;

    private selectedCountry: string;

    private filters: Array<string> = [];
    private isAllChecked: boolean;
    private settings: IFiltersSettings;


    public static showPickedFilters(country?: string): void {
        if (Filters.instance.settings.tags === 'hidden') { return ; }
        let pickedSectors = Filters.instance.$itemSector.filter('.is-active').length > 0 ? Filters.instance.$itemSector.filter('.is-active') : null;
        let pickedTime = Filters.instance.$itemTime.filter('.is-active').length > 0 ? Filters.instance.$itemTime.filter('.is-active') : null;
        let pickedCountry = Filters.instance.$itemCountry.filter('.is-active').length > 0 ? Filters.instance.$itemCountry.filter('.is-active').text() : Filters.instance.$selectedCountry.val();


        Filters.instance.$picked.find('span').remove();

        if (pickedSectors) {
            console.log(pickedSectors);

            if (pickedSectors.length === Filters.instance.$itemSector.length) {
                console.log('aal', Filters.instance.$allSectors);
                Filters.instance.$picked.append('<span>' + Filters.instance.$allSectors.text() + '</span>');
            } else {
                let coma = ',';
                let cls = 'tag';
                pickedSectors.each((i, el) => {
                    if (i == pickedSectors.length - 1) {
                        coma = '';
                        cls = 'tag-last';
                    }
                    Filters.instance.$picked.append('<span class=' + cls + '>' + $(el).text() + coma + '</span>');
                });
            }
        }

        if (pickedCountry) {
            console.log(pickedCountry);
            Filters.instance.selectedCountry = pickedCountry;
            Filters.instance.$picked.append('<span>' + pickedCountry + '</span>');
        }

        if (pickedTime) {
            Filters.instance.$picked.append('<span>' + pickedTime.data('item-label') + '</span>');
        }
    }


    public static addCountryToFilters(country: string): void {
        const countryName: string = country.split(' ').join('-').toLowerCase();
        let prevCountry = '';

        if (Filters.instance.selectedCountry !== country && !Filters.instance.$itemCountry.hasClass('is-active')) {
            prevCountry = Filters.instance.selectedCountry;
            Filters.instance.selectedCountry = country;
        }

        const currentActive = prevCountry.length > 0  ? prevCountry : Filters.instance.$itemCountry.data('item')

        const index = Filters.instance.filters.indexOf(currentActive);

        if (index > -1) {
            Filters.instance.filters.splice(index, 1);
            Filters.instance.$itemCountry.removeClass('is-active');
        }

        Filters.instance.filters.push(country);

        console.log(countryName, 'country name');
    }

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');
        this.$allSectors = this.view.find('.js-item-all');
        this.$picked = $('.js-picked-filter');
        this.$selectedCountry = this.view.find('#search-country');
        this.$itemCountry = this.view.find('.js-item-country');

        this.settings = $.extend({
            status: '',
        }, options || view.data('options') || {});

        Filters.instance = this;
        console.log(Filters.instance.$itemSector, Filters.instance.view.find('[data-selected]').data('selected'));
        this.bind();
        this.setDefaultSelection();
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        // setTimeout(() => {
        //     this.$clear.css('height', this.$panel.outerHeight());
        // });
    };


    private bind(): void {
        this.$itemSector.off('.sector').on('click.sector', this.toggleSector);
        this.$itemTime.off('.time').on('click.time', this.toggleTime);
        this.$itemCountry.off('.country').on('click.country', this.toggleCountry);
        this.$clear.off('.clear').on('click.clear', this.clearArray);
        // this.$allSectors.off('.all').on('click.all', this.markAllSectors);
    }


    private markAllSectors(): void {
        const timeChecked = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;

        this.clearArray();
        this.$itemSector.each((i, el) => {
            this.addElementToArray($(el), this.filters, true);
        });
        this.$allSectors.addClass('is-active');
        this.isAllChecked = true;

        if (timeChecked) {
            this.addElementToArray(timeChecked, this.filters);
            this.markTimeline(timeChecked);
        }

        Filters.showPickedFilters();
    }


    private clearArray = (): void => {
        this.filters = [];
        this.$itemTime.removeClass('is-active');
        this.$itemSector.removeClass('is-active');
        this.$allSectors.removeClass('is-active');
        this.isAllChecked = false;
        this.unmarkTimeline();
        Filters.instance.$selectedCountry.val('');
        this.setDefaultSelection();
        Filters.showPickedFilters();
    }

    // DEFAULT SELECTION: ALL FILTERS (ALL SECTORS/ALL COUNTRIES/ALL TIME)
    private setDefaultSelection(): void {

        if (this.settings.status === 'unchecked') {
            this.filters = [];
            this.isAllChecked = false;
        } else {
            this.addElementToArray(this.$itemTime.filter('[data-item="all-time"]'), this.filters);
            this.addElementToArray(this.$itemCountry, this.filters);
            this.addElementToArray(this.$itemSector.filter('[data-item="all-sectors"]'), this.filters, true);
    
            this.$allSectors.addClass('is-active');
            this.isAllChecked = true;
    
            Filters.showPickedFilters();
        }
    }


    private toggleSector = (e) => {
        const current = $(e.currentTarget);

        if (current.hasClass('is-active')) {
            this.removeElementFromArray(current, this.filters);
        } else {
            this.$itemSector.each((i, el) => {
                this.removeElementFromArray($(el), this.filters);
            });
            this.addElementToArray(current, this.filters);
        }

        Filters.showPickedFilters();
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

        Filters.showPickedFilters();
    }

    private toggleCountry = (e) => {
        const current = $(e.currentTarget);

        if (current.hasClass('is-active')) {
            this.removeElementFromArray(current, this.filters);
        } else {
            this.addElementToArray(current, this.filters);
        }

        Filters.showPickedFilters(current.data('item'));
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

    private addElementToArray($el: JQuery, array: Array<string>, notActivate?: boolean): void {
        array.push($el.data('item'));
        notActivate ? $el.remove('is-active') : $el.addClass('is-active');
        console.log('FILTERS:', this.filters);
    }
}
