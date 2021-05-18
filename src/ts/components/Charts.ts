/// <reference path="../definitions/chart.d.ts" />

import { Component } from './Component';
import { $doc, $window } from '../Site';
// import { Chart } from 'chart.js';
// import * as ChartDataLabels from 'chartjs-plugin-datalabels';
import { GlobalVars } from './GlobalVars';

declare let Chart;
declare let ChartDataLabels;
// var Chart = require('chart.js');


export class Charts extends Component {

    private $viewSwitcher: JQuery;
    private $subviews: JQuery;
    private $current: JQuery;
    private $pieChartWrapper: JQuery;

    private pieCanvas: HTMLCanvasElement;
    private barCanvas: HTMLCanvasElement;
    private ctxPie: CanvasRenderingContext2D;
    private ctxBar: CanvasRenderingContext2D;

    private pieChart: any;
    private barChart: any;

    private icons: any;

    private labels: any = [
        'BUILDINGS',
        'ELECTRICITY',
        'TRANSPORTATION',
        'AGRICULTURE',
        'EXTRACTIVE INDUSTRIES',
        'MANUFACTURING',
        'FORESTRY'
    ];

    private tooltips: any = [
        [ 
        '<strong>Coal Power 52%</strong> of buildings generation emissions',
        '<strong>Natural Gas 34%</strong> of buildings generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of electricity generation emissions',
        '<strong>Natural Gas 34%</strong> of electricity generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of transportation generation emissions',
        '<strong>Natural Gas 34%</strong> of transportation generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of agriculture generation emissions',
        '<strong>Natural Gas 34%</strong> of agriculture generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of extractive industries generation emissions',
        '<strong>Natural Gas 34%</strong> of extractive industries generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of manufacturing generation emissions',
        '<strong>Natural Gas 34%</strong> of manufacturing generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ],
        [ 
        '<strong>Coal Power 52%</strong> of forestry generation emissions',
        '<strong>Natural Gas 34%</strong> of forestry generation emissions',
        'BioGas - not present in data',
        'Combined heat and power - not present in data'
        ]

    ]

    private colors: any = [
        GlobalVars.colors.indigo,
        GlobalVars.colors.blue,
        GlobalVars.colors.green,
        GlobalVars.colors.violet,
        GlobalVars.colors.viking,
        GlobalVars.colors.shamrock,
        GlobalVars.colors.winter,
    ]

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$viewSwitcher = this.view.find('[data-chart-type]');
        this.$subviews = this.view.find('[data-chart-app]');

        this.pieCanvas = <HTMLCanvasElement>this.view.find('#pie-chart')[0];
        this.barCanvas = <HTMLCanvasElement>this.view.find('#bar-chart')[0];
        this.ctxBar = this.barCanvas.getContext('2d');
        this.ctxPie = this.pieCanvas.getContext('2d');
        this.barCanvas.height = 250;
        this.$pieChartWrapper = this.view.find('.js-pie-chart');
        
        this.bind();
        this.setCharts();

    }


    private bind(): void {
        this.$viewSwitcher.off('.switch').on('click.switch', this.onViewSwitch);
    }

    private destroyCharts(): void {
        this.barChart.destroy();
        this.pieChart.destroy();
    }

    private setBiggestValue(values: Array<number>): void {
        let largest = this.getLargestValue(values);
        this.$pieChartWrapper.append('<div class="chart__center js-center-value"><img src="" alt="" class="chart__largesticon js-largest-icon"><span class="chart__largestname js-largest-name"></span><span class="chart__largest js-largest-num"></span></div>');

        let index = values.indexOf(largest);

        let areaName = this.labels[index].toLowerCase();

        this.view.find('.js-largest-name').text(areaName);
        this.view.find('.js-largest-num').text(largest + '%');
        let icon;

        for (const prop in GlobalVars.icons) {
            console.log(prop === areaName);
            if (prop === areaName) {
                icon = GlobalVars.icons[prop];
                console.log(icon);
            }
        }

        this.view.find('.js-largest-icon').attr('src', icon);

    }

    private setCharts(): void {
        // Chart.plugins.register(ChartDataLabels);
        // Chart.register(...registerables);
        const values = [23.6, 3.1, 28.7, 8.2, 11.9, 6.7, 15.3];
        this.setBiggestValue(values);
        const pieData = {
            labels: this.labels,
            datasets: [{
                labels: this.labels,
                data: values,
                backgroundColor: this.colors,
                borderWidth: 0,
                cutout: '70%',
                hoverOffset: 5,
            }],
        };

        const barChart = {
            labels: this.labels,
            datasets: [{
                axis: 'y',
                data: values,
                fill: true,
                backgroundColor: this.colors,
                borderWidth: 0,
                barThickness: 50,
                padding: 20,
            }],
        }

        this.barChart = new Chart(this.ctxBar, {
            type: 'bar',
            data: barChart,
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                        external: (context) => this.customBarTooltip(context),
                        callbacks: {
                            afterBody: (item) => {
                                return this.tooltips[item[0].dataIndex];
                            },
                        },
                    },
                },
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'TONNES',
                            color: 'rgba(88,88,88, 0.45)',
                            font: {
                                size: 20,
                                family: 'Quicksand',
                                weight: 'normal'
                            },
                        },
                        ticks: {
                            callback: (value) => {
                                return value + 'B';
                            },
                            font: {
                                size: 20,
                                family: 'Quicksand',
                            },
                            padding: 20,
                        },
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 16,
                                family: 'Kanit',
                            },
                            padding: 20,
                        },
                        grid: {
                            display: false,
                            drawBorder: false,
                            drawOnChartArea: false,
                            drawTicks: false,
                        }
                    },
                },
                animation: {
                    duration: 2000,
                    onProgress: (chart) => this.percentOnBarHack(chart),
                    onComplete: (chart) => this.percentOnBarHack(chart),
                },
            },
        });
        // Chart.register(ChartDataLabels);
        this.pieChart = new Chart(this.ctxPie, {
            type: 'doughnut',
            data: pieData,
            plugins: [(ChartDataLabels as any)],
            options: {
                layout: {
                    padding: 50
                },
                plugins: {
                    datalabels: {
                        display: true,
                        clamp: false,
                        anchor: 'center',
                        align: 'center',
                        offset: 10,
                        color: GlobalVars.colors.white,
                        labels: {
                            value: {
                                font: {
                                    family: 'Kanit',
                                    weight: 'bold',
                                    size: 22
                                }
                            },
                        },
                        formatter: (value, context) => {
                            return value +'%';
                        }
                    },
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                        external: (context) => this.customBarTooltip(context),
                        intersect: false,
                        callbacks: {
                            afterBody: (item) => {
                                return this.tooltips[item[0].dataIndex];
                            },
                        },
                    },
                }
            }
        });
    }

    private percentOnBarHack(chart): void {
        let chartInstance = chart.chart,
            ctx = chartInstance.ctx;

        ctx.font = '500 22px Kanit';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = GlobalVars.colors.white;

        chartInstance.data.datasets.forEach((dataset, i) => {
            let meta = chartInstance.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                let data = dataset.data[index] + '%';
                ctx.fillText(data, 230, bar.y);
            });
        });
    }


    private customBarTooltip(context): void {
        // Tooltip Element
        let tooltipEl = $('#chartjs-tooltip')[0];

        // Create element on first render
        if (!tooltipEl) {
            
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = '<div class="tooltip tooltip--chart"><div class="tooltip__wrapper"></div></div>';
            document.body.appendChild(tooltipEl);
        }

        // Hide if no tooltip
        let tooltipModel = context.tooltip;
        console.log(tooltipModel, 'model', context, 'ctx');
        if (tooltipModel.opacity === '0') {
            tooltipEl.style.opacity = '0';
            return;
        }

        let index = null;
        let color = '';

        this.labels.forEach( (el, i) => {
            let title = tooltipModel.title.length <= 0 ? tooltipModel.dataPoints[0].label : tooltipModel.title[0]; 
            if (el === title) {
                index = i;
            }
        });

        color = this.colors[index];


        // Set Text
        if (tooltipModel.body) {
            let titleLines = tooltipModel.title.length <= 0 ? tooltipModel.dataPoints[0].label : tooltipModel.title;
            console.log(titleLines);
            let bodyLines = tooltipModel.afterBody.map((bodyItem) => {
                return bodyItem;
            });

            let innerHtml = '<h4>';

            if (typeof titleLines == 'string') {
                innerHtml += titleLines;
            } else {
                titleLines.forEach((title) => {
                    innerHtml += title;
                });
            }
            innerHtml += '</h4><hr class="tooltip__hr"><ul>';

            bodyLines.forEach((body, i) => {
                innerHtml += '<li>' + body + '</li>';
            });
            innerHtml += '</ul>';

            let wrapper = $(tooltipEl).find('.tooltip__wrapper')[0];
            wrapper.innerHTML = innerHtml;

        }


        let position = context.chart.canvas.getBoundingClientRect();

        // Display, position, and set styles for font
        $(tooltipEl).find('strong').css('color', color);
        $(tooltipEl).find('hr').css('background-color', color);
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.zIndex = '4';
        tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
        tooltipEl.style.font = 'Kanit';
        tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
        tooltipEl.style.pointerEvents = 'none';


        gsap.fromTo($(tooltipEl).find('.tooltip'), { duration: 0.5, opacity: 0}, { opacity: 1});
        if (tooltipModel.opacity === 0) {
            gsap.fromTo($(tooltipEl).find('.tooltip'), { duration: 0.5, opacity: 1}, { opacity: 0});
        }
    }


    private onViewSwitch = (e): void => {
        const current = $(e.currentTarget);
        const view = current.data('chart-type');

        this.$viewSwitcher.removeClass('is-active');
        current.addClass('is-active');

        this.setActiveSubview(view);

        setTimeout(() => this.destroyCharts(), 300);
        setTimeout(() => this.setCharts(), 450);
    }


    private setActiveSubview(view: string): void {
        const current = this.$subviews.filter('.is-active');

        this.hideCurrent(current).then(() => {
            this.show(null, view);
            $window.resize();
        });
    }


    private hideCurrent(element?: JQuery): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            const current = element ? element : this.$current;
            if (!current) { resolve(); return; }
            gsap.to(current, {
                opacity: 0,
                duration: 0.3,
                ease: 'sine',
                onComplete: () => {
                    current.removeClass('is-active');
                    resolve();
                },
            });
        })
    }


    private show(index?: number, type?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {

            if (typeof index != undefined && index != null ) {
                this.$current = this.$subviews.filter('[data-chart-app=' + index + ']');
            }
            const current = typeof index != undefined && index != null ? this.$current : this.$subviews.filter('[data-chart-app=' + type + ']');
            current.addClass('is-active');

            gsap.fromTo(current, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.7,
                ease: 'sine',
                onComplete: () => resolve(),
            });
        })
    }


    private getLargestValue(data: Array<number>): number {
        let largest = 0;

        for (let i = 0; i < data.length; i++ ) {
            if (data[i] > largest) {
                largest = data[i];
            }
        }

        return largest;
    }
}
