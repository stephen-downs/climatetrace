import { Component } from './Component';
import * as Utils from '../Utils';

interface IChartSettings {
    id: number;
    xPercent: number;
    yPoints: Array<number>;
    color: string;
    yPx: Array<number>;
    fill?: boolean;
    shown?: boolean;
}

export class Chart extends Component {

    private $tab: JQuery;
    private $wrapper: JQuery;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;

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

    private graphsData: Array<IChartSettings> = [];
    private dataInit: boolean;



    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = <HTMLCanvasElement>this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');

        this.bind();

        this.resize();

        const paramsCharts = Utils.getParams(window.location.search).charts;
        const initCharts = paramsCharts ? paramsCharts.split(',').map((i) => parseInt(i, 10)) : [0, 3, 4];

        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, initCharts.indexOf(i) >= 0);
        }
    }



    public resize = (): void => {
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
        if (!this.dataInit) {
            this.createDataObject();
        }
    };



    private createDataObject(): void {
        this.$tab.each( (i, el) => {
            const dataItem = <IChartSettings>{
                id: i,
                xPercent: 0,
                yPoints: $(el).data('points'),
                color: this.setColor($(el).data('color')),
                yPx: this.calcYPx($(el).data('points')),
                fill: i === 0 ? true : false,
            };

            this.graphsData.push(dataItem);
        });

        this.dataInit = true;
    }



    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }



    private onClickTab = (e): void => {
        this.toggleChart($(e.currentTarget).index());
    }



    private toggleChart(index: number, show?: boolean): void {
        if (typeof show === 'undefined') {
            show = !this.graphsData[index].shown;
        }

        gsap.to(this.graphsData[index], {
            duration: 2,
            xPercent: show ? 1 : 0,
            ease: 'sine.inOut',
            onUpdate: this.draw,
        });

        this.$tab.eq(index).toggleClass('is-on-chart', show);
        this.graphsData[index].shown = show;
    }



    private draw = (): void => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBg();
        this.graphsData.forEach((graphData) => this.drawGraph(graphData));
    }



    private drawBg(): void {

        // draw X axis
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;

        this.ctx.strokeStyle = this.colors.white;
        this.ctx.moveTo(this.margin.left, this.canvas.height - this.margin.bottom);
        this.ctx.lineTo(this.canvas.width - this.margin.right, this.canvas.height - this.margin.bottom);
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.gray;
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.canvas.width - this.margin.right, this.margin.top);
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
            this.ctx.lineWidth = 1;
            this.ctx.fillStyle = this.colors.blue;
            this.ctx.fillText('' + val + '', 0, (this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.moveTo(this.margin.left, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.lineTo(this.canvas.width - this.margin.right, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.stroke();
        }


        for (let j = 0; j < years.length; j++) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.white;
            this.ctx.fillText('' + years[j] + '', (this.canvas.width + this.margin.right + this.margin.left) / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
            this.ctx.stroke();
        }
    }



    private drawGraph = (data: IChartSettings): void => {
        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        const colWidth = this.graph.right / data.yPx.length;
        const maxX = data.xPercent * (this.graph.right - this.graph.left) + this.graph.left;
        data.yPx.forEach( (y, i, a) => {
            const x = colWidth * i + this.graph.left;
            if (x <= maxX && data.xPercent > 0) {
                this.ctx.lineTo(x, y);
            } else if (x < maxX + colWidth && data.xPercent > 0) {
                this.ctx.lineTo(maxX, this.getInterPointsY(maxX, [x - colWidth, a[i-1]], [x, y]));
            }
        });
        this.ctx.stroke();
        this.ctx.closePath();

        if (data.fill) {
            let lastX = this.margin.left;
            this.ctx.strokeStyle = 'transparent';
            this.ctx.fillStyle = data.color;
            this.ctx.globalAlpha = 0.4;

            this.ctx.beginPath();
            data.yPx.forEach( (y, i, a) => {
                const x = colWidth * i + this.graph.left;
                if (x <= maxX && data.xPercent > 0) {
                    this.ctx.lineTo(x, y);
                    lastX = x;
                } else if (x < maxX + colWidth && data.xPercent > 0) {
                    this.ctx.lineTo(maxX, this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]));
                    lastX = maxX;
                }
            });
            this.ctx.lineTo(lastX, this.graph.bottom);
            this.ctx.lineTo(this.graph.left, this.graph.bottom);
            this.ctx.fill();
            this.ctx.closePath();
        }
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



    private getInterPointsY(x: number, pointA: number[], pointB: number[]): number {
        const [x1, y1] = pointA;
        const [x2, y2] = pointB;
        return (y2 - y1) * (x - x1) / (x2 - x1) + y1;
    }
}
