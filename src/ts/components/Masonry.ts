import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';

interface IDataStat {
    sector: string;
    value: number;
    color: string;
}

export class Masonry extends Component {

    private data: Array<IDataStat> = [];
    private $item: JQuery;
    private dataArray: Array<any> = [];
    private area: number;
    private itemMargin: number = 3;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-masonry-tile');
        this.$item.each( (i, el) => {
            const dataItem = <IDataStat>{
                sector: $(el).data('tile'),
                value: $(el).data('value'),
                color: $(el).data('color'),
            };
            this.data.push(dataItem);
        });
        this.area = (this.view.width() - this.itemMargin * 3) * this.view.height();

        console.log(this.data, this.area);

        this.bind();
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {
        
    };

    private bind(): void {
        // this.setTileSize();
        this.getArrFromObject();
    }

    private getArrFromObject(): any {
        this.dataArray = Object.entries(this.data).sort((a, b) => a[0].localeCompare(b[0]));

        console.log(this.dataArray);

        this.dataArray.forEach( (el, i) => {
            console.log(el[1].value, i, 'el');
            const value = el[1].value;
            const sector = el[1].sector;
            const color = el[1].color;
            const index = i;

            this.setTileSize(sector, value, color, index);
        });
    }

    private setTileSize(sector: string, value: number, color: string, index: number): void {
        const current = this.$item.filter('[data-tile=' + sector + ']');

        let area, h, w, t, l;
        switch (index) {
            case 0:
                area = this.area * (value / 100),
                h = this.view.height(),
                w = area / h;
        
                current.css({
                    height: h,
                    width: w,
                    backgroundColor: color,
                });

                break;
            
            case 1:
                area = this.area * (value / 100),
                h = (this.view.height() * 0.5) - this.itemMargin,
                w = (area / h) - (this.itemMargin * 2),
                t = 0,
                l = this.$item.eq(0).width() + this.itemMargin;
                
                current.css({
                    height: h,
                    width: w,
                    top: t,
                    left: l,
                    backgroundColor: color,
                });

                break;

            case 2:
                let area_2 = this.area * (value / 100),
                h_2 = this.$item.eq(1).height(),
                w_2 = (area_2 / h) - (this.itemMargin * 2),
                t_2 = this.$item.eq(0).width() + this.$item.eq(1).width() + this.itemMargin * 2 + w > this.view.width() ? this.$item.eq(1).height() + this.itemMargin : 0,
                l_2 = t_2 === 0 ? this.$item.eq(0).width() + this.$item.eq(1).width() + this.itemMargin * 2 : this.$item.eq(0).width() + this.itemMargin;

                console.log(this.$item.eq(0).width(), this.$item.eq(1).width(), this.itemMargin * 2, w, this.view.width(), (area / h));
        
                current.css({
                    height: h_2,
                    width: w_2,
                    top: t_2,
                    left: l_2,
                    backgroundColor: color,

                });

                break;

            default:

                break;
        }
        // if (first) {
        // } else {
        //     const area = this.area * (value / 100);
        //     const h = ;
        //     const w = area / h;

        //     current.css({
        //         height: h,
        //         width: w
        //     })
        // }
    }

}
