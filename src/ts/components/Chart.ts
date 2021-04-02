import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Chart extends Component {

    private $tab: JQuery;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private $wrapper: JQuery;
    private margin: any = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
    };

    private yPoints = [20, 25, 15, 30, 40, 10, 32, 28, 29, 27, 10, 11, 12, 20, 25, 30, 50];

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

    private drawChart(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.renderBackground();
        this.renderText();
        this.renderLinesAndLabels();
    }
    

    private renderBackground(): void {}
    private renderText(): void {}
    private renderLinesAndLabels(): void {}
}
