// import * as $ from 'jquery';
import { Component } from './Component';
import { API, IApiData } from '../Api';



export class Evaluation extends Component {


    private $btn: JQuery;
    private $circle: JQuery;
    private $icon: JQuery;
    private timeout: any;
    private $number: JQuery;
    private number: number;
    private baseCount: number;
    private settings: IApiData;



    constructor(protected view: JQuery, protected options?) {
        super(view, options);

        this.$btn = this.view;
        this.$circle = this.view.find('.js-clap-circle');
        this.$icon = this.view.find('svg');
        this.$number = this.view.find('.js-evaluation');
        this.number = parseInt(this.$number.text(), 10);
        this.baseCount = this.number;

        this.settings = options || {};

        this.bind();
    }


    public destroy(): void {
        this.unbind();
        super.destroy();
    }



    private bind(): void {
        this.$btn.off('.clap').on('click.clap', this.onClick);
    }



    private unbind(): void {
        this.$btn.off('.clap');
    }


    private onClick = (e): void => {
        this.number++;

        this.updateNumber();

        gsap.fromTo(this.$icon, 0.3, {
            scale: 1.2,
            transformOrigin: 'center center',
        }, {
            scale: 1,
            ease: 'sine.inOut'
        });

        gsap.fromTo(this.$circle, 0.6, {
            scale: 1.2,
            opacity: 0,
        }, {
            scale: 0,
            opacity: 0.3,
            ease: 'sine.inOut'
        });

        clearTimeout(this.timeout);
        this.timeout = setTimeout(this.onTimeout, 2000);
    };



    private onTimeout = (): void => {
        API.callIt($.extend(this.settings, { params: {
            count: this.number - this.baseCount,
        }, }), this.view);
        this.baseCount = this.number;
    };



    private updateNumber(): void {
        this.$number.text(this.number);
    }
}
