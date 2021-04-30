import { Component } from './Component';
import { $window } from '../Site';
import * as Utils from '../Utils';


export class Stats extends Component {

    private $tab: JQuery;
    private $item: JQuery;
    private $wrap: JQuery;
    private $current: JQuery;
    private tabToShow: number; // for async switch
    private $viewSwitcher: JQuery;

    private $subviews: JQuery;


    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');
        this.$wrap = this.view.find('.js-tabs-wrapper');
        this.$viewSwitcher = this.view.find('[data-rank]');
        this.$subviews = this.view.find('[data-compare]');

        this.bind();
        this.setActiveView(parseInt(Utils.getParams(window.location.search).tab, 10) || 0);
    }



    private bind(): void {
        this.$tab.off('.tab').on('click.tab', this.onTabClick);
        this.$viewSwitcher.off('.switch').on('click.switch', this.onViewSwitch);
    }


    private onViewSwitch = (e): void => {
        const current = $(e.currentTarget);
        const view = current.data('rank');

        this.$viewSwitcher.removeClass('is-active');
        current.addClass('is-active');

        this.setActiveSubview(view);
    }


    private onTabClick = (e): void => {
        const current = $(e.currentTarget);
        const index = current.data('tab');
        this.setActiveView(index);
    }


    private setActiveSubview(view: string): void {
        const current = this.$subviews.filter('.is-active');
        
        this.hideCurrent(current).then(() => {
            this.cleanCachedAnim();
            this.show(null, view);
            $window.resize();
        });
    }


    private setActiveView(index: number): void {
        this.tabToShow = index;
        this.$tab.removeClass('is-active');
        this.$tab.filter('[data-tab=' + index + ']').addClass('is-active');
        this.hideCurrent().then(() => {
            this.cleanCachedAnim();
            this.show(this.tabToShow);
            this.tabToShow = null;
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

    private cleanCachedAnim(): void {
        const anim = this.view.find('[data-uncache]');
        const uncaches = this.view.find('.uncached');
        uncaches.removeAttr('style');
        anim.removeClass('animated');
        this.view.find('[data-component]').each((i, el) => {
            const comp = $(el).data('comp') as Component;
            if (comp && typeof comp['disable'] !== 'undefined') {
                comp['disable']();
            }
        });
    }

    private show(index?: number, type?: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            console.log(index, 'index');

            if (typeof index != undefined && index != null ) {
                this.$current = this.$item.filter('[data-view=' + index + ']');
            }
            const current = typeof index != undefined && index != null ? this.$current : this.$subviews.filter('[data-compare=' + type + ']');
            current.addClass('is-active');

            gsap.fromTo(current, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.7,
                ease: 'sine',
                onComplete: () => resolve(),
            });


            current.find('[data-component]').each((i, el) => {
                const comp = $(el).data('comp') as Component;
                if (comp && typeof comp['enable'] !== 'undefined') {
                    comp['enable']();
                }
            });
        })
    }
}
