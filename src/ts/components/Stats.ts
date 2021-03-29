import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Stats extends Component {

    private $tab: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$tab = this.view.find('[data-tab]');

        this.bind();
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {

    };

    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.switchTab);
    }
    
    private switchTab = (e): void => {
        const current = $(e.currentTarget);

        this.$tab.removeClass('is-active');
        current.addClass('is-active');
    }
}
