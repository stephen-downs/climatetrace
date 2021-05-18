import { Component } from './Component';
import * as Utils from '../Utils';
import { GlobalVars } from './GlobalVars';


interface ILinechartSettings {
    id: number;
    xPercent: number;
    yPoints: Array<number>;
    color: string;
    yPx: Array<number>;
    fill?: boolean;
    shown?: boolean;
    labelY?: number;
}

export class Linechart extends Component {

    private $tab: JQuery;
    private $wrapper: JQuery;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private mouseX: number = 0;

    private margin: any = {
        top: 5,
        left: 25,
        right: 0,
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

    private graphsData: Array<ILinechartSettings> = [];

    private bgLines: Array<{scaleX: number}>;
    private currentCharts: number[];


    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = <HTMLCanvasElement>this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');

        this.bgLines = Array.apply(0, { length: 9 }).map(() => { return { scaleX: 0 }; });

        const paramsCharts = Utils.getParams(window.location.search).charts;
        this.currentCharts = paramsCharts ? paramsCharts.split(',').map((i) => parseInt(i, 10)) : [0, 3, 4];

        this.createDataObject();

        this.bind();

        this.resize();
    }



    public resize = (): void => {
        this.canvas.width = this.$wrapper.width();
        this.canvas.height = this.$wrapper.height();

        this.graph = {
            top: this.margin.top,
            left: this.margin.left,
            right: this.canvas.width - this.margin.right,
            bottom: this.canvas.height - this.margin.bottom,
            height: this.canvas.height - this.margin.top - this.margin.bottom,
            width: this.canvas.width - this.margin.left - this.margin.right,
        };

        this.saveCache();
        this.draw();
    };



    public enable(): void {
        this.showBg();
        let visible = 0;
        for (let i = 0; i < this.$tab.length; i++) {
            const v = this.currentCharts.indexOf(i) >= 0;
            this.toggleChart(i, v, false, visible * 0.3);
            visible += !!v ? 1 : 0;
        }
    }



    public disable(): void {
        this.hideBg(true);
        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, false, true);
        }
    }



    private createDataObject(): void {
        this.graphsData = this.$tab.toArray().map((el, i) => {
            const $el = $(el);
            return <ILinechartSettings>{
                id: i,
                xPercent: 0,
                // yPoints: $el.data('points'),
                // yPoints: this.getRandomPoints(Math.random() * 10 + 7, Math.random() * 30 + 18, 60, 0.3),
                yPoints: this.getPoints(i),
                color: GlobalVars.colors[$el.data('color')],
                fill: i === 0,
                shown: false,
            };
        });
        // console.log(JSON.stringify(this.graphsData.map((data) => data.yPoints)));
    }



    private getPoints(i): number[] {
        return [[14, 10, 12, 13, 14, 9 , 12, 17, 16, 11, 13, 19, 10, 9, 8, 15, 17, 15, 22, 25, 21, 20, 19, 21, 20, 19, 24, 28, 21, 27, 18, 23, 33, 31, 18, 25, 36, 24, 31, 33, 21, 36, 34, 30, 26, 24, 35, 27, 30, 18, 20, 30, 26, 28, 33, 25, 39, 28, 17, 35], [1, 2, 8, 7, 6, 3, 8, 5, 5, 4, 8, 7, 7, 11, 10, 8, 7, 9, 8, 6, 8, 12, 8, 14, 11, 8, 8, 11, 7, 13, 13, 16, 20, 10, 10, 13, 14, 20, 16, 11, 17, 16, 18, 21, 8, 20, 15, 15, 16, 15, 19, 20, 11, 20, 20, 12, 17, 20, 23, 16], [13, 11, 6, 9, 9, 8, 9, 11, 7, 14, 12, 8, 10, 16, 9, 20, 19, 12, 12, 15, 18, 15, 14, 22, 19, 20, 20, 17, 24, 23, 27, 20, 20, 21, 21, 25, 20, 27, 22, 24, 24, 26, 23, 25, 26, 21, 29, 26, 27, 26, 25, 20, 15, 25, 22, 26, 20, 23, 33, 28], [2, 5, 10, 9, 18, 9, 10, 12, 20, 19, 13, 9, 15, 11, 21, 19, 23, 23, 26, 23, 23, 23, 25, 25, 26, 26, 30, 22, 25, 33, 38, 16, 32, 27, 27, 35, 28, 28, 35, 34, 36, 25, 27, 25, 45, 37, 31, 36, 37, 36, 28, 38, 42, 42, 44, 43, 41, 34, 31, 36], [7, 10, 10, 6, 5, 13, 17, 13, 10, 11, 14, 17, 16, 19, 22, 20, 25, 17, 24, 13, 25, 20, 26, 24, 26, 15, 23, 24, 30, 30, 29, 31, 31, 21, 32, 31, 25, 38, 35, 28, 40, 32, 37, 31, 36, 40, 35, 37, 23, 36, 37, 40, 40, 41, 17, 23, 40, 34, 40, 40], [6, 6, 2, 12, 10, 13, 12, 4, 12, 11, 13, 16, 14, 14, 14, 14, 14, 17, 15, 16, 16, 12, 18, 15, 22, 16, 19, 18, 21, 21, 25, 15, 26, 17, 27, 27, 21, 12, 24, 15, 19, 29, 18, 24, 25, 18, 28, 32, 25, 28, 27, 28, 31, 25, 27, 35, 24, 27, 15, 28], [4, 5, 10, 13, 15, 17, 7, 17, 12, 12, 17, 12, 12, 11, 22, 21, 19, 20, 21, 26, 22, 19, 21, 24, 25, 12, 28, 27, 28, 27, 31, 31, 15, 30, 26, 19, 29, 29, 33, 33, 17, 30, 30, 33, 27, 34, 33, 17, 39, 21, 35, 33, 33, 21, 35, 30, 39, 31, 35, 29]][i];
    }



    private getRandomPoints(min: number, max: number, amount: number, cast: number): number[] {
        return Array.apply(null, { length: amount })
            .map((p, i, a) => {
                const range = max - min;
                const perc = i / a.length;
                const sin = Math.sin(perc * Math.PI / 2);
                const rnd = 0.4 * (Math.random() < cast ? -0.5 + Math.random() : 1);
                const minRnd = (Math.random() * (perc < 0.5 ? 0.9 : 1));
                return Math.round((min * minRnd) + (Math.random() * range * 0.2) + (sin * range * (0.6 + rnd)));
            });
    }



    private saveCache(): void {
        this.graphsData.forEach((data) => {
            data.yPx = this.calcYPx(data.yPoints);
            if (!data.labelY) {
                data.labelY = data.yPx[0];
            }
        });
    }



    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
        this.$wrapper.off('.lc').on('mousemove.lc', this.onMouseMove);
    }



    private onClickTab = (e): void => {
        this.toggleChart($(e.currentTarget).index());
        this.currentCharts = this.graphsData.map((data, i) => data.shown ? i : null).filter((index) => index !== null);
    }



    private onMouseMove = (e): void => {
        const colWidth = this.graph.width / (this.graphsData[0].yPx.length - 1); // INFO: assume that first one needs a tooltip
        gsap.to(this, {
            duration: 0.3,
            mouseX: Math.round((e.offsetX - this.graph.left) / colWidth) * colWidth,
            onUpdate: this.draw,
            ease: 'sine',
        });
    }



    private showBg(): void {
        gsap.killTweensOf(this, { bg: true });
        gsap.to(this.bgLines, {
            scaleX: 1,
            duration: 2,
            ease: 'power3',
            stagger: -0.1,
        });
    }



    private hideBg(quick?: boolean): void {
        gsap.killTweensOf(this, { bg: true });
        gsap.to(this.bgLines, {
            scaleX: 0,
            duration: !quick ? 2 : 0,
            ease: 'power3',
            stagger: !quick ? -0.1 : 0,
        });
    }



    private toggleChart(index: number, show?: boolean, quick?: boolean, delay?: number): void {
        const data = this.graphsData[index];
        if (typeof show === 'undefined') {
            show = !data.shown;
        }

        gsap.to(data, {
            duration: !quick ? 3.2 : 0,
            xPercent: show ? 1 : 0,
            labelY: data.yPx[show ? data.yPx.length - 1 : 0],
            roundProps: 'labelY',
            ease: 'power3',
            delay: !quick ? delay || 0 : 0,
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

        this.ctx.strokeStyle = GlobalVars.colors.gray;
        this.ctx.moveTo(this.graph.left, this.graph.bottom);
        this.ctx.lineTo(this.graph.right + 20, this.graph.bottom);
        this.ctx.stroke();

        const helpersLine = 8;
        const textTransform = 5;
        const step = 5;
        let val;
        const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021];

        this.ctx.strokeStyle = GlobalVars.colors.graylight;
        this.ctx.lineJoin = 'round';
        this.ctx.font = '500 12px Quicksand, sans-serif';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = GlobalVars.colors.gray;

        for (let i = 0; i <= helpersLine; i++) {
            val = 50 - step * i;
            this.ctx.globalAlpha = this.bgLines[i].scaleX;
            this.ctx.fillText('' + val + '', 0, (this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.graph.left, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.lineTo(this.graph.left + (this.graph.width + 20) * this.bgLines[i].scaleX, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.stroke();
        }


        for (let j = 0; j < years.length; j++) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = GlobalVars.colors.gray;
            this.ctx.fillText('' + years[j] + '', this.graph.width / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
            this.ctx.stroke();
        }
    }



    private drawGraph = (data: ILinechartSettings): void => {
        let lastVal: number;
        let lastY: number;

        this.ctx.strokeStyle = data.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 1;

        this.ctx.beginPath();
        const colWidth = this.graph.width / (data.yPx.length - 1);
        const maxX = (data.xPercent * colWidth * data.yPx.length) + this.graph.left;

        data.yPx.forEach( (y, i, a) => {
            const x = colWidth * i + this.graph.left;
            if (x <= maxX && data.xPercent > 0) {
                this.ctx.lineTo(x, y);
                lastY = y;
                lastVal = data.yPoints[i];
            } else if (x < maxX + colWidth && data.xPercent > 0) {
                y = this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]);
                this.ctx.lineTo(maxX, y);
            }
        });
        this.ctx.stroke();
        this.ctx.closePath();

        // fill/gradient:
        if (data.fill) {
            let lastX = this.margin.left;

            this.ctx.strokeStyle = 'transparent';
            // this.ctx.fillStyle = data.color;
            // this.ctx.globalAlpha = 0.4;
            const grd = this.ctx.createLinearGradient(0, 0, 0, this.graph.height);
            grd.addColorStop(0, Utils.colorToRGBA(data.color, 0.5));
            grd.addColorStop(1, Utils.colorToRGBA(data.color, 0.1));
            this.ctx.fillStyle = grd;

            this.ctx.beginPath();
            data.yPx.forEach( (y, i, a) => {
                const x = colWidth * i + this.graph.left;
                if (x <= maxX && data.xPercent > 0) {
                    this.ctx.lineTo(x, y);
                    lastX = x;
                } else if (x < maxX + colWidth && data.xPercent > 0) {
                    const iy = this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]);
                    this.ctx.lineTo(maxX, iy);
                    lastX = maxX;
                }
            });
            this.ctx.lineTo(lastX, this.graph.bottom);
            this.ctx.lineTo(this.graph.left, this.graph.bottom);
            this.ctx.fill();
            this.ctx.closePath();

            // tooltip:
            const mouseX = Math.max(0, this.mouseX) + this.graph.left;
            const mxi1 = Math.floor((mouseX - this.graph.left) / colWidth);
            const mxi2 = mxi1 + 1;
            const mouseY = this.getInterPointsY(mouseX, [colWidth * mxi1 + this.graph.left, data.yPoints[mxi1]], [colWidth * mxi2 + this.graph.left, data.yPoints[mxi2]]);
            // console.log(mouseX - this.graph.left, colWidth, mxi1);
            this.ctx.beginPath();
            this.ctx.strokeStyle = data.color;
            this.ctx.moveTo(mouseX, mouseY);
            this.ctx.lineTo(mouseX, this.graph.bottom);
            this.ctx.stroke();

        }

        // label:
        // if (data.xPercent > 0) {
        //     // line:
        //     this.ctx.globalAlpha = 1;
        //     this.ctx.beginPath();
        //     this.ctx.lineWidth = 1;
        //     this.ctx.strokeStyle = data.color;
        //     this.ctx.moveTo(this.graph.right, data.labelY);
        //     this.ctx.lineTo(this.graph.right + 24, data.labelY);
        //     this.ctx.stroke();

        //     // pentagon:
        //     this.ctx.beginPath();
        //     this.ctx.strokeStyle = 'transparent';
        //     this.ctx.fillStyle = data.color;
        //     this.ctx.moveTo(this.graph.right + 20, data.labelY);
        //     this.ctx.lineTo(this.graph.right + 40, data.labelY - 12);
        //     this.ctx.lineTo(this.graph.right + 110, data.labelY - 12);
        //     this.ctx.lineTo(this.graph.right + 110, data.labelY + 12);
        //     this.ctx.lineTo(this.graph.right + 40, data.labelY + 12);
        //     this.ctx.closePath();
        //     this.ctx.fill();

        //     // text:
        //     this.ctx.beginPath();
        //     this.ctx.lineWidth = 1;
        //     this.ctx.lineJoin = 'round';
        //     this.ctx.font = '500 14px Quicksand, sans-serif';
        //     this.ctx.fillStyle = GlobalVars.colors.white;
        //     this.ctx.fillText(lastVal + '', this.graph.right + 44, data.labelY + 4 );
        //     this.ctx.stroke();
        // }
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



    private getInterPointsY(x: number, pointA: number[], pointB: number[]): number {
        const [x1, y1] = pointA;
        const [x2, y2] = pointB;
        return (y2 - y1) * (x - x1) / (x2 - x1) + y1;
    }
}
