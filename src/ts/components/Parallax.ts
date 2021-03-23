import {Component} from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';



interface IParallaxSettings {
    elements: Array<string>;
    moveX: Array<number>;
    moveY: Array<number>;
}


interface IParallaxElementData {
    $el: JQuery;
    moveX: number;
    moveY: number;
}



export class Parallax extends Component {

    private moveX: number;
    private moveY: number;
    private time: number = 2;
    private settings: IParallaxSettings;
    private items: IParallaxElementData[];



    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.settings = options;
        this.createValueArray();

        this.view.data('Parallax', this);


        if (breakpoint.desktop) {
            this.bind();
        }
    }



    private bind(): void {
        this.view.on('mousemove', this.onMouseMove);
    }



    private createValueArray(): void {
        const selectors = (this.settings.elements).toString().replace(/\s/g, '').split(',');
        const moveX = (this.settings.moveX).map(Number);
        const moveY = (this.settings.moveY).map(Number);

        this.items = selectors.map((sel, i) => {
            const $el = this.view.find('.' + sel);
            if (!$el[0]) { console.warn(`There is no .${sel} element to use in parallax`); }
            return {
                $el: $el,
                moveX: moveX[i],
                moveY: moveY[i],
            };
        }).filter((item) => {
            return !!item.$el[0];
        });
    }



    private onMouseMove = (event): void => {
        this.moveX = ( event.clientX / window.innerWidth) - 0.5;
        this.moveY = ( event.clientY / window.innerHeight) - 0.5;

        this.animate(-this.moveX, -this.moveY);
    }



    private animate(moveX, moveY): void {
        if (!this.items) { return; }
        this.items.forEach((item, i) => {
            gsap.to(item.$el, {
                duration: this.time,
                x: moveX * item.moveX,
                y: moveY * item.moveY,
                ease: 'power2',
            });
        });
    }
}
