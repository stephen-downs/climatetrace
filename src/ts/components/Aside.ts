import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';
import { PushStates } from '../PushStates';


export class Aside extends Component {

    private $item: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-item');

        this.bind();

        console.log(this.view.attr('data-component'), 'mounted');
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {

    };


    private bind(): void {
        this.$item.off('.menu').on('click.menu', this.hideMenu);
    }


    private hideMenu = (e) => {
        PushStates.asideToggle(e);
    }
    
}