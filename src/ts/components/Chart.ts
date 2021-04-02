import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Chart extends Component {

    private $tab: JQuery;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private $wrapper: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = <HTMLCanvasElement>this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');

        this.bind();

        console.log(this.view.attr('data-component'), 'mounted');
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        this.canvas.width = this.$wrapper.width();
        this.canvas.height = this.$wrapper.height();
    };


    private bind(): void {

        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }


    private onClickTab = (e): void => {
        const current = $(e.currentTarget);

        current.hasClass('is-on-chart') ? current.removeClass('is-on-chart') : current.addClass('is-on-chart');
    }
    
}
