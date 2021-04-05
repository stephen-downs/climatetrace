import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc } from '../Site';


export class Chart extends Component {

    private $tab: JQuery;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private $wrapper: JQuery;
    private margin: any = {
        top: 5,
        left: 25,
        right: 50,
        bottom: 49
    };
    private graph: any = {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: 0,
        width: 0,
    };

    private yMax: number;
    private xMax: number;
    private ratio: number;
    private maxYValue: number = 0;
    private colors: any = {
        blue: "#6F92F2",
        gray: "rgba(97,97,97,0.5)",
        orange: "#D47650",
        violet: "#B60E63",
        white: "#fff"
    }
    

    private yPoints = [20, 25, 15, 30, 40, 10, 32, 28, 29, 27, 10, 11, 12, 20, 25, 30, 45];
    // private yPoints = [10, 15, 25, 20, 35, 40, 30, 45, 50];

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = <HTMLCanvasElement>this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');

        

        this.bind();

        console.log(this.view.attr('data-component'), 'mounted', this.canvas);

    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        this.canvas.width = this.$wrapper.width();
        this.canvas.height = this.$wrapper.height();

        this.graph = {
            top: this.margin.top,
            left: this.margin.left,
            right: this.canvas.width - this.margin.right + this.margin.left,
            bottom: this.canvas.height - this.margin.bottom,
            height: this.canvas.height - this.margin.top - this.margin.bottom,
            width: this.canvas.width - this.margin.left - this.margin.right,
        };

        this.draw();

    };


    private bind(): void {

        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }


    private onClickTab = (e): void => {
        const current = $(e.currentTarget);

        current.hasClass('is-on-chart') ? current.removeClass('is-on-chart') : current.addClass('is-on-chart');


    }

    private renderChart = (): void => {
        this.drawGraph(this.yPoints);
    }

    private draw(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // draw X axis
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.white;
        this.ctx.moveTo( this.margin.left, this.canvas.height - this.margin.bottom );
        this.ctx.lineTo( this.canvas.width - this.margin.right, this.canvas.height - this.margin.bottom );
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.gray;
        this.ctx.moveTo( this.margin.left, this.margin.top );
        this.ctx.lineTo( this.canvas.width - this.margin.right, this.margin.top );
        this.ctx.stroke();

        const helpersLine = 8;
        const textTransform = 5;
        const step = 5;
        let val;
        const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021];

        for (let i = 0; i <= helpersLine; i++) {
            val = 50 - step * i;
            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.blue;
            this.ctx.fillText('' + val + '', 0, ( this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.moveTo( this.margin.left, ( this.graph.height) / helpersLine * i + this.margin.top );
            this.ctx.lineTo( this.canvas.width - this.margin.right, ( this.graph.height) / helpersLine * i + this.margin.top );
            this.ctx.stroke();
        }

        for (let j = 0; j < years.length; j++) {
            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.white;
            this.ctx.fillText('' + years[j] + '', (this.canvas.width + this.margin.right + this.margin.left) / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
            this.ctx.stroke();
        }

        this.renderChart();
    }


    private drawGraph(array: Array<number>): void {
        let largest = 0;
        
        for (let j = 0; j < array.length; j++ ) {
            if (array[j] > largest) {
                largest = array[j];
            }
        }
        this.ctx.strokeStyle = this.colors.orange;
        this.ctx.lineWidth = 3;

        // const xStep = this.canvas.width / array.length;
        // let x;
        // array.forEach( (y, i) => {
        //     x = i * xStep;
        //     this.ctx.lineTo(x, y);
        // });
        // this.ctx.stroke();
        
        for (let i = 0; i < array.length; i++) {
            this.ctx.lineTo(this.graph.right / array.length * i + this.graph.left, (this.graph.height - array[i] / largest * this.graph.height) + this.graph.top);
        }
        this.ctx.stroke();

    }



}
