import { Component } from './Component';
import { $window  } from '../Site';


export class Stats extends Component {

    private $tab: JQuery;
    private $item: JQuery;
    private $wrap: JQuery;
    private $current: JQuery;
    private tabToShow: number; // for async switch



    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');
        this.$wrap = this.view.find('.js-tabs-wrapper');

        this.bind();
        this.setActiveView(0);
    }



    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.onTabClick);
    }



    private onTabClick = (e): void => {
        const current = $(e.currentTarget);
        const index = current.data('tab');
        this.setActiveView(index);
    }



    private setActiveView(index: number): void {
        this.tabToShow = index;
        this.$tab.removeClass('is-active');
        this.$tab.filter('[data-tab=' + index + ']').addClass('is-active');
        this.hideCurrent().then(() => {
            this.show(this.tabToShow);
            this.tabToShow = null;
            $window.resize();
        });
    }



    private hideCurrent(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (!this.$current) { resolve(); return; }
            gsap.to(this.$current, {
                opacity: 0,
                duration: 0.3,
                ease: 'sine',
                onComplete: () => {
                    this.$current.removeClass('is-active');
                    resolve();
                },
            });
        })
    }



    private show(index: number): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.$current = this.$item.filter('[data-view=' + index + ']');
            this.$current.addClass('is-active');
            gsap.fromTo(this.$current, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.7,
                ease: 'sine',
                onComplete: () => resolve(),
            });
        })
    }
}
