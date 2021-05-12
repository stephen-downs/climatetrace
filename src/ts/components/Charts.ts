import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc, $window } from '../Site';
import { Scroll } from '../Scroll';
import { Chart, Legend, LegendItem, LegendOptions } from 'chart.js';
import { GlobalVars } from './GlobalVars';

// var Chart = require('chart.js');

export class Charts extends Component {

    private $viewSwitcher: JQuery;
    private $subviews: JQuery;
    private $current: JQuery;

    private pieCanvas: HTMLCanvasElement;
    private barCanvas: HTMLCanvasElement;
    private ctxPie: CanvasRenderingContext2D;
    private ctxBar: CanvasRenderingContext2D;

    private pieChart: Chart;
    private barChart: Chart;

    private labels: any = [
        'BUILDINGS',
        'ELECTRICITY',
        'TRANSPORTATION',
        'AGRICULTURE',
        'EXTRACTIVE INDUSTRIES',
        'MANUFACTURING',
        'FORESTRY'
    ];

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
        
        this.bind();
        this.setCharts();
    }


    private bind(): void {
        this.$viewSwitcher.off('.switch').on('click.switch', this.onViewSwitch);
    }

    private setCharts(): void {
        const values = [23.6, 3.1, 28.7, 8.2, 11.9, 6.7, 15.3];
        const pieData = {
            labels: this.labels,
            datasets: [{
                label: 'Dataset',
                data: values,
                backgroundColor: this.colors,
                borderWidth: 0,
                cutout: '70%',
            }],
            hoverOffset: 1
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
                    }
                },
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        display: true,
                        title: {
                            text: 'TONNES',
                            color: 'rgba(88,88,88, 0.2)',
                            font: {
                                size: 20,
                            }
                        },
                        ticks: {
                            callback: function(value, index, values) {
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
                    onComplete: (chart) => {
                        console.log(this, chart, "dupa znój");
                        let chartInstance = chart.chart,
                            ctx = chartInstance.ctx;

                        ctx.font = '20px Quicksand';
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
                }
            }
        });


        this.pieChart = new Chart(this.ctxPie, {
            type: 'doughnut',
            data: pieData,
            options: {
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            generateLabels: (chart): any => {
                              let data = chart.data;
                              console.log(data, "DATA");
                              if (data.labels.length && data.datasets.length) {
                                return data.labels.map((label, i) => {
                                  let meta = chart.getDatasetMeta(0);
                                  let ds = data.datasets[0];
                                  let arc = meta.data[i];
                                  let arcOpts = chart.options.elements.arc;
                                  let fill = this.colors[i];
                                  let stroke = this.colors[i];
                                  let bw = 0;
                                
                                  // We get the value of the current label
                                  let value = chart.config.data.datasets[0].data[i];
                    
                                  return {
                                    // Instead of `text: label,`
                                    // We add the value to the string
                                    text: label + " : " + value + '%',
                                    fillStyle: fill,
                                    strokeStyle: stroke,
                                    lineWidth: bw,
                                    hidden: false,
                                    index: i
                                  };
                                });
                              } else {
                                return [];
                              }
                            }
                          }
                    }
                    // generateLabels: (chart) => this.legendCallback(chart);
                }
            }
        });
    }

    private onViewSwitch = (e): void => {
        const current = $(e.currentTarget);
        const view = current.data('chart-type');

        this.$viewSwitcher.removeClass('is-active');
        current.addClass('is-active');

        this.setActiveSubview(view);
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


    private legendCallback(chart): any {
        const renderLabels = (chart) => {
            const { data } = chart;
            return data.datasets[0].data
              .map(
                (_, i) =>
                  `<li>
                      <div id="legend-${i}-item" class="legend-item">
                        <span style="background-color:
                          ${data.datasets[0].backgroundColor[i]}">
                          &nbsp;&nbsp;&nbsp;&nbsp;
                        </span>
                        ${
                          data.labels[i] &&
                          `<span class="label">${data.labels[i]}: $${data.datasets[0].data[i]}</span>`
                        }
                      </div>
                  </li>
                `
              )
              .join("");
          };
        return `
            <ul class="chartjs-legend">
              ${renderLabels(chart)}
            </ul>`;
    }
}
