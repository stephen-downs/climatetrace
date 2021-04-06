import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc } from '../Site';

interface IChartSettings {
    xPercent: number;
    yPoints: Array<number>;
    color: string;
    yPx: Array<number>;
}

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

    private rAF: any;
    private time: number = 0;
    private largestVal: number = 0;
    private arrLen: number;
    private yMax: number;
    private xMax: number;
    private ratio: number;
    private maxYValue: number = 0;
    private colors: any = {
        gray: 'rgba(97,97,97,0.5)',
        orange: '#fc8c59',
        mint: '#4fdbc5',
        blue: '#5877cc',
        pink: '#B60E63',
        white: '#fff',
        beige: '#fdd49e',
        cinnabar: '#e75040',
        sea: '#26bbe3',
    }

    // private settings: Array<IChartSettings>;
    private charts: any = [];
    private graphsData: Array<IChartSettings> = [];

    private yPoints = [20, 25, 15, 30, 40, 10, 32, 28, 29, 27, 10, 11, 12, 20, 25, 30, 45];
    // private yPoints = [10, 15, 25, 20, 35, 40, 30, 45, 50];

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = <HTMLCanvasElement>this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');

        this.bind();
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
        this.createDataObject();

    };


    private createDataObject(): void {

        this.$tab.each( (i, el) => {
            const dataItem = <IChartSettings>{
                xPercent: 0,
                yPoints: $(el).data('points'),
                color: this.setColor($(el).data('color')),
                yPx: this.calcYPx($(el).data('points')),
            }

            this.graphsData.push(dataItem);
            
        });

        console.log(this.graphsData);
    }


    

    private bind(): void {

        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }





    private onClickTab = (e): void => {
        const current = $(e.currentTarget);

        current.hasClass('is-on-chart') ? current.removeClass('is-on-chart') : current.addClass('is-on-chart');
        this.time = 0;

        if (current.hasClass('is-on-chart')) {
            this.animateChart(current.index(), false);
        } else {
            this.animateChart(current.index(), true);
        }
    }

    private draw = (): void => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBg();
        this.graphsData.forEach( (graphData) => this.drawGraph(graphData));
        // this.drawGraph();
    }

    private drawBg(): void {
        

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

    }


    private drawGraph = (data: IChartSettings): void => {

        
        data.yPx.forEach( (y, i, a) => {
            this.ctx.strokeStyle = data.color;
            if (i / a.length >= data.xPercent) {
                this.ctx.lineWidth = 3;
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.lineTo(this.graph.right / a.length * i + this.graph.left, y);
                this.ctx.stroke();
            }
        });
        // this.ctx.lineTo(this.graph.right / this.yPoints.length * this.time + this.graph.left, (this.graph.height - this.yPoints[this.time] / this.largestVal * this.graph.height) + this.graph.top);


    }


    private animateChart(id: number, direction: boolean): void {
        const dir = direction ? 1 : 0;
        gsap.to(this.graphsData[id], {
            xPercent: dir,
            ease: 'power2',
            onUpdate: this.draw,
        });
    }

    /// HELPERS
    private largestYVal(data: Array<number>): number {
        let largest = 0;
        
        for (let i = 0; i < data.length; i++ ) {
            if (data[i] > largest) {
                largest = data[i];
            }
        }

        return largest;
    }

    private calcYPx(data): Array<number> {
        const largest = this.largestYVal(data);
        let arr = [];

        for (let i = 0; i < data.length; i++) {
            let item = Math.round((this.graph.height - data[i] / largest * this.graph.height) + this.graph.top);
            arr.push(item);
        }

        return arr;
    }

    private setColor(color: string): string {
        let hex;

        for (const property in this.colors) {
            if (color === property) {
                hex = this.colors[property];
            }
        }

        return hex;
    }
}
