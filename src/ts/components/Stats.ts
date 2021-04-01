import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Stats extends Component {

    private $tab: JQuery;
    private $item: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');

        this.bind();
        this.setActiveView(3);
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {

    };

    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.switchTab);
    }
    
    private switchTab = (e): void => {
        const current = $(e.currentTarget);
        const index = current.data('tab');

        this.setActiveView(index);

    }

    private setActiveView(index: number): void {
        this.$tab.removeClass('is-active');
        this.$item.removeClass('is-active');
        this.$tab.filter('[data-tab=' + index + ']').addClass('is-active');
        this.$item.filter('[data-view=' + index + ']').addClass('is-active');
    }
}
