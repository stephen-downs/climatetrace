import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Range extends Component {

    
    private $trigger: JQuery;
    private isOpen: boolean = false;
    private $selected: JQuery;
    private $radio: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$trigger = this.view.find('.js-trigger');
        this.$selected = this.view.find('[data-selected]');
        this.$radio = this.view.find('input[type=radio]');

        this.bind();
    }


    private bind(): void {
        this.$trigger.off('.toggle').on('click.toggle', this.toggle);
        $doc.off('.smalldropdown').on('click.smalldropdown', this.onClickAnywhereHandler);
        this.$radio.off('.selection').on('click.selection', this.onItemClick);
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
        console.log(this.isOpen, 'open?');
        if (this.isOpen) {
            this.view.removeClass('is-open');
            this.isOpen = false;
        }
    }

    private onClickAnywhereHandler = (e): void => {
        if ($(e.currentTarget).hasClass('js-item') || !this.isOpen) { return; }
        if ($(e.target).closest(this.view).length <= 0) {
            this.closeSelect();
        }
    }

    private onItemClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const current = $(e.currentTarget).attr('value');

        this.closeSelect();
        this.$selected.html(current);

        this.$selected.attr('data-selected', current);
    }
}
