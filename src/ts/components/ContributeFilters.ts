import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


interface IFiltersSettings {
    status: string,
    tags: string,
}


export class ContributeFilters extends Component {

    // public static instance: Filters;

    private $checkboxes: JQuery;
    private $radio: JQuery;
    private filters: Array<string> = [];




    constructor(protected view: JQuery, protected options?) {
        super(view);

        
        this.$checkboxes = this.view.find('[type="checkbox"]');
        this.$radio = this.view.find('[type="radio"');
        // Filters.instance = this;
        this.bind();


    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
    };


    private bind(): void {
        this.$checkboxes.off('.mark').on('click.mark', this.markCheckbox);
        this.$radio.off('.markradio').on('click.markradio', this.markRadio);
    }


    private markCheckbox = (e): void => {
        const el = $(e.currentTarget);
        this.toggleCheckbox(el);
    }

    private markRadio = (e): void => {
        const el = $(e.currentTarget);
        this.toggleRadio(el);
    }

    private toggleRadio(el): void {
        this.$radio.each((i, el) => {
            this.removeElementFromArray($(el), this.filters);
        });

        this.addElementToArray(el, this.filters);
    }

    private toggleCheckbox(element: JQuery): void {
        const allSector = element[0].hasAttribute('data-all-sectors');
        const allSectorLocation = element[0].hasAttribute('data-all-sectors') && element.attr('data-all-sectors') === 'location';
        const allSubsector = element[0].hasAttribute('data-all-subsectors');

        if (element.is(':checked')) {
            if (allSector) {
                allSectorLocation ? this.toggleAllSectors(true, true) : this.toggleAllSectors(true);
            } else if (allSubsector) {
                this.toggleAllSubsectors(element, true);
            } else {
                this.addElementToArray(element, this.filters);
            }
        } else {
            if (allSector) {
                this.toggleAllSectors(false);
            } else if (allSubsector) {
                this.toggleAllSubsectors(element, false);
            } else {
                this.removeElementFromArray(element, this.filters);
            }
            this.$checkboxes.filter('[data-all-sectors]').prop('checked', false);
        }
    }


    private toggleAllSectors(mark: boolean, location?: boolean): void {
        const sectors = location ? this.$checkboxes.filter('[data-region]') : this.$checkboxes.filter('[data-all-subsectors]');

        sectors.each((i, el) => {
            this.toggleAllSubsectors($(el), mark);
            $(el).prop('checked', mark);
        });
    }


    private toggleAllSubsectors(el: JQuery, mark: boolean): void {
        const sector = el.attr('name').split('-all').join('');
        const checkboxes = this.$checkboxes.filter((i, el) => {
            let name = $(el).attr('name');

            if (name.includes(sector) && !el.hasAttribute('data-all-subsectors')) {
                return name;
            }
        });

        checkboxes.each((i, el) => {
            $(el).prop('checked', mark);

            mark ?
                this.addElementToArray($(el), this.filters) :
                this.removeElementFromArray($(el), this.filters);
        });
    }




    private removeElementFromArray($el: JQuery, array: Array<string>): void {
        const index = this.filters.indexOf($el.attr('value'));
        if (index > -1) {
            array.splice(index, 1);
            $el.removeClass('is-active');
        }
        console.log('FILTERS:', this.filters);
    }


    private addElementToArray($el: JQuery, array: Array<string>, notActivate?: boolean): void {
        array.push($el.attr('value'));
        notActivate ? $el.remove('is-active') : $el.addClass('is-active');
        console.log('FILTERS:', this.filters);
    }

}
