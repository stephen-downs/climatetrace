import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';


export class FlipCard extends Component {

    private $card: JQuery;


    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$card = this.view;

        this.bind();
        this.checkDevice();
    }



    private bind(): void {
        this.$card.off('.rotate').on('click.rotate', this.onCardClick);
    }



    private checkDevice(): void {
        if (!breakpoint.desktop) { this.$card.removeClass('flip__card--hover'); }
    }



    private onCardClick = (e?): void => {
        e.preventDefault();
        e.stopPropagation();
        
        this.$card.toggleClass('is-rotated');
    };
}
