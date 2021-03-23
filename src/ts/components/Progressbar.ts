import { Component } from './Component';



export class Progressbar extends Component {

    public static instance: Progressbar;
    private progressbar: JQuery;

    private pH: number;
    private maxScroll: number;
    private isHorizontal: boolean = true;


    public static update(sT: number): void {
        if (Progressbar.instance) {
            Progressbar.instance.onScroll(sT);
        }
    }



    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.progressbar = this.view.find('.js-progressbar');

        this.pH = this.view.height();
        this.maxScroll = $('#main').outerHeight();

        this.bind();

        Progressbar.instance = this;
    }



    public onScroll = (sT?: number): void => {
        const pageHeader = $('#page-header').length > 0 ? $('#page-header').offset().top : 0;
        const progress = (sT - pageHeader) / this.maxScroll;

        // console.log(sT, this.maxScroll);

        gsap.to(this.progressbar, {
            duration: 0.5,
            scaleX: progress,
            ease: 'sine',
        });

    }



    public resize = (wdt?: number, hgt?: number): void => {
        const pageHeader = $('#page-header').length > 0 ? $('#page-header').offset().top : 0;
        this.maxScroll = $('#main').outerHeight() - (hgt || window.innerHeight) - 2 - pageHeader;
    }



    private bind(): void {
        // this.view.on('click', this.goTo);
    }



    private goTo = (e):void => {
        const progress = e.offsetY / this.pH * this.maxScroll;

        gsap.to(this.progressbar, {
            duration: 0.5,
            scaleY: e.offsetY / this.pH,
            ease: 'sine',
        });

        window.scrollTo(0, progress);
    }

}
