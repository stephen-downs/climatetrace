import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';
import { Filters } from './Filters';
import { ContributeFilters } from './ContributeFilters';

export class Dropdown extends Component {


    private $trigger: JQuery;
    private isOpen: boolean = false;
    private $selected: JQuery;
    private $item: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$trigger = this.view.find('.js-trigger');
        this.$selected = this.view.find('[data-select]');
        this.$item = this.view.find('[data-value]');

        this.bind();
        this.view.attr('data-selected', this.$selected.text());
    }


    private bind(): void {
        this.view.off('.select').on('click.select', this.toggle);
        $doc.off('.dropdown').on('click.dropdown', this.onClickAnywhereHandler);
        this.$item.off('.selection').on('click.selection', this.onItemClick);
    }


    private toggle = (e) => {
        this.isOpen ? this.closeSelect() : this.openSelect(e);
    }


    private openSelect(e): void {
        e.stopPropagation();
        e.preventDefault();
        if (!this.isOpen) {
            this.view.addClass('is-open');
            this.isOpen = true;
        }
    }

    private closeSelect(): void {
        if (this.isOpen) {
            this.view.removeClass('is-open');
            this.isOpen = false;
        }
    }

    private onClickAnywhereHandler = (e): void => {
        e.stopPropagation();
        // e.preventDefault();
        
        if (($(e.currentTarget).hasClass('js-item') && !this.isOpen) || $(e.target).prop('tagName') === 'INPUT') { return; }
        if ($(e.target).closest(this.view).length <= 0) {
            this.closeSelect();
        }
    }

    private onItemClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const current = $(e.currentTarget).data('value');

        this.closeSelect();
        this.$selected.html(current);

        this.view.attr('data-selected-country', current);

        if ($(e.currentTarget)[0].hasAttribute('data-country')) {
            ContributeFilters.markCountry(current);
        } else {

            setTimeout( () => {
                Filters.showPickedFilters(current);
            }, 300);
        }

    }
}
