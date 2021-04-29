import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';
import { Filters } from './Filters';

export class Search extends Component {


    private $input: JQuery;
    private $liveItem: JQuery;
    private $liveList: JQuery;
    private $itemCountry: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$input = this.view.find('input');
        // this.$liveItem = this.view.find('.js-live-item');
        this.$liveList = this.view.find('.js-live-list');
        this.$itemCountry = this.view.find('.js-item-country');

        this.bind();
    }


    private bind(): void {
        this.$input.on('focus', () => this.onFocus());
        this.$input.on('blur', () => this.onBlur());
        this.$input.on('input', () => this.onInput());
    }

    private onFocus(): void {
        this.view.addClass('is-focus');
    }

    private onBlur(): void {
        this.view.removeClass('is-focus');
    }
    
    private onInput(): void {
        this.$input.val().length > 0 ? this.view.addClass('is-livesearching') : this.view.removeClass('is-livesearching');

        if (this.$liveList.find('.js-live-item').length > 0) {
            this.$liveItem = this.view.find('.js-live-item');

            this.$liveItem.off('.live').on('click.live', this.onLiveClick);
        }
    }

    private onLiveClick = (e): void => {
        const current = $(e.currentTarget);

        this.$input.val(current.text());
        this.$itemCountry.removeClass('is-active');
        Filters.showPickedFilters();
    }
}
