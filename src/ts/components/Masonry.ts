import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';

interface IDataStat {
    sector: string;
    value: number;
    color: string;
}

interface IGridItemPosition {
    column_start: number;
    column_end: number;
    row_start: number;
    row_end: number;
}

export class Masonry extends Component {

    private data: Array<IDataStat> = [];
    private $item: JQuery;
    private dataArray: Array<any> = [];
    private area: number;
    private itemMargin: number = 3;
    private gridRows: number = 20;
    private gridCols: number = 20;
    private gridCells: number = this.gridCols * this.gridRows;
    private cellsBalance: number = this.gridCells;
    private gridCell: any = {
        width: this.view.width() / this.gridCols,
        height: this.view.height() / this.gridRows,
    };
    private minCellWidth: number = 3;
    private minCellHeight: number = 3;

    private itemPositioning: Array<IGridItemPosition> = [];

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

        // console.log(this.data, this.area, 'cell width', this.gridCell.width, 'cell height', this.gridCell.height);

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

        // console.log(this.dataArray);

        this.dataArray.forEach( (el, i) => {
            // console.log(el[1].value, i, 'el');
            const value = el[1].value;
            const sector = el[1].sector;
            const color = el[1].color;
            const index = i;

            // this.setTileSize(sector, value, color, index);
        });
    }

    private setTileSize(sector: string, value: number, color: string, index: number): void {
        const current = this.$item.filter('[data-tile=' + sector + ']');
        let area, h, w, t, l, column_start, column_end, row_start, row_end, item, areaGrid;
        
        area = this.area * (value / 100);

        // console.log(area, ':area', this.itemPositioning,this.itemPositioning.length > 0, 'check if some item on array');
        
        if (index === 0) {
            column_start = 1;
            row_start = 1;
            row_end = this.gridRows;
            column_end = Math.round(area / (this.gridCell.height * row_end) / this.gridCell.width);
            areaGrid = Math.round(area / (this.gridCell.width * this.gridCell.height));
            areaGrid = areaGrid % 2 === 0 ? areaGrid : areaGrid - 1;
        }

        // if (index > 0) {
        //     column_start = this.itemPositioning[index-1].column_end + 1 < this.gridCols - this.minCellWidth ? this.itemPositioning[index-1].column_end + 1 : this.itemPositioning[index-2].column_end + 1;
        //     areaGrid = Math.round(area / (this.gridCell.width * this.gridCell.height)) >= 6 ? Math.round(area / (this.gridCell.width * this.gridCell.height)) : 6;
        //     areaGrid = areaGrid % 2 === 0 ? areaGrid : areaGrid - 1;
        //     column_end = areaGrid / this.minCellWidth 

        //     console.log(areaGrid, 'amount of cells');
        // }

        item = <IGridItemPosition>{
            column_start: column_start,
            column_end: column_end,
            row_start: row_start,
            row_end: row_end,
        };

        current.css({
            position: 'relative',
            opacity: 1,
            'grid-column-start': column_start,
            'grid-column-end': column_end,
            'grid-row-start': row_start,
            'grid-row-end': 'span' + row_end,
            backgroundColor: color,
        });

        this.itemPositioning.push(item);
        this.cellsBalance = this.cellsBalance - areaGrid;
        // console.log(this.cellsBalance, ':free cells');
        
    }

}
