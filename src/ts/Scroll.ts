/// <reference path="./definitions/gsap.d.ts" />
/// <reference path="./definitions/split-text.d.ts" />
/// <reference path="./definitions/jquery.d.ts" />

import { browser } from './Browser';
import { PushStates } from './PushStates';
import { Component } from './components/Component';
import { Progressbar } from './components/Progressbar';
import { IBreakpoint, breakpoint, Breakpoint } from './Breakpoint';
import Background from './backgrounds/Background';
import { $window, $body } from './Site';
import { components } from './Classes';

interface IBackgroundData {
    id: string;
    step: number;
    darken: boolean;
    darkenDelay: number;
}

export interface IScrollParams extends Object {
    x?: number;
    y?: number;
    speed?: number;
    animate?: boolean;
    relativeSpeed?: boolean;
    ease?: string;
}


interface IBaseCacheItem {
    $el?: JQuery;
    done?: boolean;
    height?: number;
    start?: number;
    type?: string;
    y?: number;
    component?: Component;
}

interface IScrollingData extends IBaseCacheItem {
    top: number;
    role: string;
    path?: string;
    title?: string;
    bottom?: number;
    children?: any;
    $child?: JQuery;
    childHeight?: number;
    delay?: number;
    shown?: boolean;
    initialized?: boolean;
}

interface IParallaxCacheItem extends IBaseCacheItem {
    shift?: number;
    $child?: JQuery;
    childHeight?: number;
}

interface IAnimationCacheItem extends IBaseCacheItem {
    delay?: number;
    uncache?: boolean;
}

interface IScrollCache {
    animations?: IAnimationCacheItem[];
    parallaxes?: IParallaxCacheItem[];
    modules?: IBaseCacheItem[];
    backgrounds?: IBackgroundCacheItem[];
    sections?: IScrollingData[];

}

interface IBackgroundCacheItem extends IBackgroundData, IBaseCacheItem {
    percentage?: number;
    index?: number;
    shown?: boolean;
    delay?: number;
    breakpoints?: string[];
}



export class Scroll {

    public static instance: Scroll;
    public static windowHeight: number;
    public static headerHeight: number;
    public static maxScroll: number;
    public static disabled: boolean;
    public static scrollTop: number;
    // public static customScroll: Scrollbar;
    private static customScroll;
    private static animating: boolean = false;


    private cache: IScrollCache = {};
    private scrollCache = {};
    private ignoreCache: boolean;
    private backgrounds: {[key: string]: Background};
    private target: JQuery;
    private storedPath: string;
    private sections: JQuery;
    private changingPath: boolean;

    
    /**
     * scrolls page to certain element (top edge) with some speed
     * @param  {JQuery}        $el    [target elment]
     * @param  {number}        offset
     * @param  {number}        duration
     * @return {Promise<void>}        [after completed animation]
     */
    // tslint:disable-next-line: member-ordering
    public static scrollToElement($el: JQuery, offset?: number, duration?: number): Promise<void> {
        return new Promise<void>((resolve) => {
            Scroll.animating = true;
            const y = $el.offset().top - Scroll.headerHeight + (offset || 0);
            const obj = {
                y: Math.max(document.body.scrollTop, window.pageYOffset),
            };

            gsap.killTweensOf(obj);
            gsap.to(obj, {
                y: y,
                ease: 'sine',
                duration: typeof duration === 'undefined' ? 1 : duration,
                onUpdate: (): void => {
                    window.scrollTo(0, obj.y);
                },
                onComplete: (): void => {
                    Scroll.animating = false;
                    resolve();
                },
            });
        });
    }

    public static resetScrollCache(pathname): void {
        Scroll.instance.cache[pathname] = 0;
    }
    
    public static disable(): void {
        this.disabled = true;
    }


    public static enable(): void {
        this.animating = false;
        this.disabled = false;
    }


    
    constructor() {

        this.ignoreCache = !!browser.safari;

        $(window).on('scroll', this.onScroll);
        $('a[href^="#"]:not(".js-nav-item, [data-lightbox]")').on('click', this.onHashClickHandler);
        this.backgrounds = this.buildBackgrounds();
        // Scroll.isCustomScroll = $('#wpbs').data('scrollbar');

        Scroll.headerHeight = 70;
        Scroll.instance = this;

        this.storedPath = window.location.pathname;
        this.target = $('[data-path="' + window.location.pathname + '"]');
        this.sections = $('[data-scroll]');
    }

    public resize(): void {
        Scroll.windowHeight = window.innerHeight;
        Scroll.headerHeight = $('#navbar').height();
        Scroll.maxScroll = $('#main').outerHeight() - Scroll.windowHeight + Scroll.headerHeight;

        this.backgrounds = this.buildBackgrounds();


        this.saveCache();
    }

    // tslint:disable-next-line: member-ordering
    public static scrollToPath(fast?: boolean): boolean {

        const $target = $('[data-path="' + window.location.pathname + '"]');

        if ($target[0]) {
            Scroll.scrollToElement($target, 0, 0);
            return true;
        } else {
            return false;
        }
    }

    public onState(): boolean {
        if (!!this.changingPath) { return false; }
        return Scroll.scrollToPath();
    }

    public stop(): void {
        Scroll.disable();
    }

    public load(): void {
        this.sections = $('[data-scroll]');
        this.saveCache();
        $window.off('.scrolling').on('scroll.scrolling', () => this.onScroll());
    }


    public start(): void {
        Scroll.enable();
        Scroll.instance.onScroll();
    }

    public destroy(): void {
        this.cache = {};
        $window.off('.scrolling');
    }

    private onHashClickHandler = (e): void => {
        e.preventDefault();
        // e.stopPropagation();

        if ($(e.target).attr('data-offset')) {
            let offset = parseInt($(e.target).attr('data-offset'), 10);

            if ( typeof $(e.target).attr('data-offset') === 'string' ) {
                const off = $(e.target).attr('data-offset').replace('vh', '');
                offset = $(window).height() * (parseInt(off, 10) / 100);
            }

            Scroll.scrollToElement($(e.currentTarget.hash), offset);
        } else {
            Scroll.scrollToElement($(e.currentTarget.hash));
        }
    };


    private buildBackgrounds(): {[key: string]: Background } {
        let bgs = {};
        $('[data-bg-component]').toArray().forEach((el, i) => {
            let $bgEl = $(el);
            let bgName = $bgEl.data('bg-component');
            let bgOptions = $bgEl.data('options');
            if (typeof components[bgName] !== 'undefined') {
                const bg = new components[bgName]($bgEl, bgOptions);
                bg.id = el.id;
                bgs[el.id] = bg;
            } else {
                window.console.warn('There is no "%s" component available!', bgName);
            }
        });
        // console.log(bgs, 'BGS SCROLL');
        return bgs;
    }


    private saveCache(): void {
        // if (!this.elements) { return; }
        const animations: Array<IAnimationCacheItem> = [];
        const margin = 0 ;

        // let sections: Array<IScrollingData> = [];
        // if (this.sections) {

        //     for (let i = 0; i < this.sections.length; ++i) {
    
        //         const $el: JQuery = this.sections.eq(i);
        //         const role = $el.data('scroll');
        //         const top = $el.offset().top;
        //         const height = $el.outerHeight();
        //         const delay = $el.data('delay') || 0;
        //         const title = $el.data('title') || false;
        //         const path = $el.data('path') || false;
        //         const data: IScrollingData = {
        //             $el: $el,
        //             role: role,
        //             top: top,
        //             height: height,
        //             bottom: top + height,
        //             path: path,
        //             title: title,
        //             $child: $el.children().first(),
        //             childHeight: $el.children().first().height(),
        //             children: {},
        //             shown: $el.data('shown') || false,
        //             delay: delay,
        //         };
    
        //         sections.push(data);
        //         $el.data('cache', i);
        //     }
        // }

        
        $('[data-animation]').each((i: number, el: Element) => {
            const $el = $(el);
            animations.push({
                $el: $el,
                start: typeof $el.data('start') !== 'undefined' ? $el.data('start') : 0.1,
                y: $el.offset().top - margin,
                height: $el.outerHeight(),
                done: $el.hasClass('animated'),
                type: $el.data('animation'),
                delay: $el.data('delay') || null,
                uncache: $el.data('uncache'),
                
            });
        });
        
        

        const parallaxes: Array<IParallaxCacheItem> = [];
        $('[data-parallax]').each((i: number, el: Element) => {
            const $el = $(<HTMLElement>el);
            const p = $el.data('parallax');
            parallaxes.push({
                $el: $el,
                start: 0,
                y: $el.offset().top,
                height: $el.outerHeight(),
                type: typeof p === 'string' ? p : null,
                shift: typeof p === 'number' ? p : null,
                done: false,
                $child: $el.children().first(),
                childHeight: $el.children().first().height(),
            });
        });

        let backgrounds: Array<IBackgroundCacheItem> = [];
        $('[data-background]').each((i: number, el: Element) => {
            const $el = $(el);
            const backgroundData = $el.data('background');
            const breakpoints = backgroundData.breakpoints || ['desktop', 'tablet', 'phone'];

            if (breakpoints.indexOf(breakpoint.value) >= 0) {
                if (!this.backgrounds[backgroundData.id]) {
                    console.warn('there\'s no background with id=' + backgroundData.id + '!');
                } else {
                    backgrounds.push($.extend({
                        $el: $el,
                        y: $el.offset().top,
                        height: $el.outerHeight(),
                        start: 1,
                        index: i,
                        darkenDelay: 0,
                    }, backgroundData || {}));
                }

            }
        });


        this.cache.animations = animations;
        this.cache.parallaxes = parallaxes;
        this.cache.backgrounds = backgrounds;
        // this.cache.sections = sections;



        this.onScroll();
    }



    private onScroll = (): void => {

        if (Scroll.disabled || $body.hasClass('is-aside-open')) { return; }

        const sT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const windowHeight = Scroll.windowHeight;
        const screenCenter: number = sT + Scroll.windowHeight * 0.33;
        const headerHeight = Scroll.headerHeight;
        const scrollend = $('#main').outerHeight() - window.innerHeight - 2;
        const pageHeader = $('#page-header').length > 0 ? $('#page-header').offset().top - (Scroll.headerHeight * 2) : 0;
        const backgrounds = $('#page-header').length > 0 ? $('#page-header').offset().top - Scroll.headerHeight : 0;
        Scroll.scrollTop = sT;
        this.scrollCache[window.location.pathname] = sT;

        $body.toggleClass('is-scrolled-window-height', sT > windowHeight - 100);
        $body.toggleClass('is-scrolled-navbar', sT > 100);
        $body.toggleClass('is-scrolled', sT > 0);
        $body.toggleClass('is-trailer-scrolled', sT > pageHeader);
        $body.toggleClass('is-backgrounds-scrolled', sT > backgrounds);
        $body.toggleClass('is-scroll-end', sT >= scrollend);


        // animations:
        if (this.cache.animations && this.cache.animations.length > 0) {
            for (let i = 0; i < this.cache.animations.length; i++) {
                const item: IAnimationCacheItem = this.cache.animations[i];
                const yBottom: number = sT + (1 - item.start) * windowHeight;
                const yTop: number = sT;
                const itemY: number = !this.ignoreCache ? item.y : item.$el.offset().top;
                const itemHeight: number = !this.ignoreCache ? item.height : item.$el.height();

                if (!item.done && itemY <= yBottom && itemY + itemHeight >= sT) {
                    item.$el.addClass('animated');
                    item.done = true;
                    const quick: boolean = yTop >= itemY + itemHeight;
                    this.animate(item, item.$el, item.type, item.delay, quick);
                } else if (!!item.done && item.component && item.type === 'toggle' && (itemY > yBottom || itemY + itemHeight < yTop)) {
                    if (typeof item.component['disable'] === 'function') {
                        item.component['disable']();
                    }
                    item.done = false;
                } else if (item.uncache && item.done && (sT <= itemY - windowHeight || sT >= itemY + windowHeight )) {
                    item.done = false;
                    if (item.$el.find('.uncached').length > 0) { item.$el.find('.uncached').removeAttr('style'); }
                    if (item.$el.attr('data-uncache')) { item.$el.removeAttr('style'); }
                    item.$el.removeClass('animated');
                }
            }
        }


        // parallaxes:
        if (this.cache.parallaxes && this.cache.parallaxes.length > 0 && breakpoint.desktop) {
            for (let i = 0; i < this.cache.parallaxes.length; i++) {
                this.parallax(this.cache.parallaxes[i], sT, windowHeight, -headerHeight);
            }
        }

        

        //bgs
        if (this.cache.backgrounds) {

            const windowCenter: number = 0.5 * windowHeight;
            // const windowCenter: number = 0 * windowHeight;
            let bgsToShow = [];
            let bgsToHide = [];


            this.cache.backgrounds.forEach((item: IBackgroundCacheItem, index) => {
                

                const itemY: number = !this.ignoreCache ? item.y : item.$el.offset().top;
                const itemHeight: number = !this.ignoreCache ? item.height : item.$el.outerHeight();
                const itemBottom: number = itemY + itemHeight;
                const yCenter = (typeof item.start !== 'undefined') ? sT + item.start * windowHeight : windowCenter;
                // const yCenter = (typeof item.start !== 'undefined') ? item.start * windowHeight : windowCenter;

                const background = this.backgrounds[item.id];
                const delay = typeof item.delay !== 'undefined' ? item.delay : 0.1;
                const percentage = - (itemY - yCenter) / itemHeight;
                let backgroundQuickSetup = false;
                let current = $body.hasClass('is-trailer-scrolled') ? sT + windowHeight >= itemY && itemY + itemHeight >= sT : itemY - sT <= windowCenter && itemBottom - sT >= windowCenter;

                if (this.cache.backgrounds.length === 1) {
                    item.shown = true;
                    if (!background.shown) {
                        background.animationIn(false, 2);
                    }
                    backgroundQuickSetup = true;

                    return;
                }

                if (current) {

                    if (!item.shown) {
                        item.shown = true;
                        if (!background.shown) {
                            background.animationIn(false, delay);
                        }
                        backgroundQuickSetup = true;
                    }
                    background.update(percentage);
                    background.setStep(item.step, backgroundQuickSetup);
                    if (item.darken) {
                        background.darken(itemY <= yCenter - windowHeight * item.darkenDelay);
                    }
                    bgsToShow.push(item.id);
                } else if (!!item.shown) {
                    bgsToHide.push(item.id);
                    item.shown = false;
                }
            });


            if (bgsToHide.length) {
                bgsToHide.forEach((bgID): void => {
                    if (bgsToShow.indexOf(bgID) < 0) {
                        this.backgrounds[bgID].animationOut(false);
                        // this.backgrounds[bgID].shown= false;

                    }
                });
            }


            Progressbar.update(sT);
        }
    };



    private animate(data: IAnimationCacheItem, $el: JQuery, type: string, delay: number = 0.1 as number, quick?: boolean, uncache?: boolean): void {

        const time = !quick ? .6 : 0;

        switch (type) {

            case 'fade':
                gsap.killTweensOf($el, { opacity: true });
                gsap.fromTo($el, { opacity: 0 },
                    { duration: time, opacity: 1, ease: 'sine', delay: delay });
                break;

            case 'fadeUp':
                gsap.killTweensOf($el, { opacity: true, y: true });
                gsap.fromTo($el, { opacity: 0, y: 40 },
                    { duration: time, opacity: 1, y: 0, ease: 'sine', delay: delay });
                break;

            case 'fadeDown':
                gsap.killTweensOf($el, { opacity: true, y: true });
                gsap.fromTo($el, { opacity: 0, y: -10 },
                    { duration: time, opacity: 1, y: 0, ease: 'sine', delay: delay });
                break;

            case 'fadeRight':
                gsap.killTweensOf($el, { opacity: true, x: true });
                gsap.fromTo($el, { opacity: 0, x: -10 },
                    { duration: time, opacity: 1, x: 0, ease: 'sine', delay: delay });
                break;

            case 'fadeLeft':
                gsap.killTweensOf($el, { opacity: true, x: true });
                gsap.fromTo($el, { opacity: 0, x: 10 },
                    { duration: time, opacity: 1, x: 0, ease: 'sine', delay: delay });
                break;

            case 'iTabs':
                gsap.set($el, { opacity: 1 });

                const lText = $el.find('span:first-child');
                const rText = $el.find('span:last-child');

                gsap.fromTo(lText, { duration: 0.5, x: '50%', opacity: 0 }, { x: '0%', opacity: 1 });
                gsap.fromTo(rText, { duration: 0.5, x: '-50%', opacity: 0 }, { x: '0%', opacity: 1 });

                break;

            case 'elements':
                gsap.set($el, { opacity: 1 });

                gsap.fromTo($el.find('[data-view-tab]'), { duration: 1, y: '100%' }, {
                    y: '0%', stagger: 0.2,
                    onComplete: () => {
                        gsap.to($el.find('.item__tabs'), { duration: 1, overflow: 'unset' });
                    }
                });

                break;

            case 'fact':

                gsap.set($el, { opacity: 1 });

                let fText = $el.find('.fact__text span'),
                    splitFTxt = new SplitText(fText, { type: 'words, chars'}),
                    fImg = $el.find('.fact__image-wrap'),
                    fArr = $el.find('.fact__icon');

                gsap.timeline()
                    .fromTo(fArr, { duration: 1, rotate: 90 }, { rotate: 0, delay: 0.5 })
                    .fromTo(splitFTxt.chars, { duration: 1, opacity: 0, x: -5 }, { x: 0, opacity: 1, stagger: 0.01 }, '-=0.8')
                    .fromTo(fImg, { duration: 1, opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1 }, '-=0.5');

                break;

            case 'lead':
                gsap.set($el, { opacity: 1 });

                const split = new SplitText($el.children(), { type: 'words, lines', linesClass: 'line' });
                const lines = $el.find('.line');

                for (let i = 0; i < lines.length; i++) {
                    $(lines[i]).after('<br>');
                    $(lines[i]).append('<span class="line__bg"></span>');
                }

                gsap.fromTo(split.words, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.1, delay: 0.4 });
                gsap.to($el.find('.line__bg'), { duration: 0.75, scaleX: 1, stagger: 0.1});

                break;

            case 'scale':
                gsap.fromTo($el, { duration: 1, scaleX: 0},{scaleX: 1, opacity: 1, delay: delay});

                break;

            case 'chars':
                gsap.set($el, { opacity: 1 });

                const splitH = new SplitText($el.children(), { type: 'words, chars' });
                gsap.fromTo(splitH.chars, { duration: 1, scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, stagger: 0.05 });

                break;

            case 'chars-simple':
                gsap.set($el, { opacity: 1 });

                const splitH2 = new SplitText($el.children(), { type: 'words, chars' });
                gsap.fromTo(splitH2.chars, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.05 });

                break;

            case 'words-simple':
                gsap.set($el, { opacity: 1 });

                const words = new SplitText($el.children(), { type: 'words' });
                const stagger = $el.data('stagger') ? $el.data('stagger') : 0.2;
                gsap.fromTo(words.words, { duration: 1, opacity: 0 }, { opacity: 1, stagger: stagger});

                break;

            case 'images':
                gsap.set($el, { opacity: 1 });

                gsap.fromTo($el.find('img'), { duration: 1, opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, stagger: 0.2 });

                break;

            case 'hero':

                gsap.to($el, { duration: 1, opacity: 1, pointerEvents: 'none', delay: 0.5 });

                const heroElements = $el.find('.hero-image:not(.js-tiny)');
                const tiny = $el.find('.js-tiny');

                gsap.from(tiny, { duration: 1.5, opacity: 0, stagger: -0.05, delay: 0.5});

                gsap.from(heroElements, {
                    duration: 1.5, x: '-50%', y: '50%', stagger: -0.05,
                    onComplete: () => {
                        gsap.set($el, { pointerEvents: 'all' });
                    }
                });

                break;

            case 'quote':
                const $quote = $el.find('.js-quote-words');
                const $author = $el.find('.js-quote-author');
                const $line = $el.find('hr');

                gsap.set([$quote, $el, $author], { opacity: 1 });

                const child = $quote.children();
                const splitQuote = new SplitText($quote, { type: 'words' });

                // FOR UNCACHE OPTION OF ANIMATION QUOTE
                // for ( let i = 0; i <  splitQuote.words.length; i++) {
                //     splitQuote.words[i].classList.add('uncached');
                // }

                gsap.timeline({
                    autoRemoveChildren: true,
                })
                    .set($quote, { opacity: 1 })
                    .fromTo(child, 0.5, { opacity: 0 }, { opacity: 1, ease: 'power3' }, '+=' + delay)
                    .from(splitQuote.words, 0.5, { opacity: 0, x: 8, transformOrigin: '0% 100%', ease: 'power3', stagger: 0.05 }, 0.1)
                    .fromTo($author, 0.7, { opacity: 0, x: -10 }, { opacity: 1, x: 0 }, '-=' + 0.3)
                    .fromTo($line, { duration: 0.7, scaleX: 0 }, { scaleX: 1 }, '-=0.3');

                break;

            case 'join':
                gsap.set($el, { opacity: 1 });
                const txt = $el.find('.js-lead');
                const splittxt = new SplitText(txt, { type: 'words, chars' });

                gsap.fromTo(splittxt.chars, { duration: 1, opacity: 0 }, {  opacity: 1, stagger: 0.05 });


                break;

            case 'itemsFade':
                const elements = $el.find('.' + $el.data('elements') + '');

                gsap.set($el, { opacity: 1 });
                gsap.set(elements, { opacity: 0 });


                gsap.fromTo(elements, { duration: 1, opacity: 0, x: -10}, { x: 0, opacity: 1, stagger: 0.2, delay: 0.2});

                break;

            case 'video-text':
                const vid = $el.find('.js-col-66');
                const inf = $el.find('.js-col-33');

                gsap.set($el, { opacity: 1 });
                gsap.set([vid, inf], { opacity: 0 });


                gsap.to(vid, { duration: 1, opacity: 1, delay: 0.2});
                gsap.fromTo(inf, { duration: 1, opacity: 0, x: -20}, { opacity: 1, x: 0, delay: 0.4});

                break;

            case 'heading':
                const hTitle = $el.find('.js-title'),
                    hr = $el.find('.js-heading-hr');
                
                const splitTitle = new SplitText(hTitle, { type: 'words, chars' });

                gsap.set($el, { opacity: 1});

                gsap.fromTo(splitTitle.chars, { duration: 1, opacity: 0 }, {  opacity: 1, stagger: 0.05 });
                gsap.fromTo(hr, { duration: 1, scaleX: 0 }, { scaleX: 1, delay: 0.5 });

                break;

            case 'titleFadeIn':
                const lead = $el.find('.js-fixed-title'),
                      sub = $el.find('.js-sub'),
                      arr = $el.find('.js-arr');

                gsap.from(lead, { duration: 1.5, opacity: 0, scale: 1.2, delay: 2});
                gsap.from(sub, { duration: 1, opacity: 0, y: 30, delay: 3.2});
                gsap.from(arr, { duration: 1, opacity: 0, y: 30, delay: 3.7});

                break;

            case 'intro':
                const curtain = $el.find('.js-curtain');
                gsap.set($el, { opacity: 1});
                gsap.to(curtain, { duration: 3, opacity: 0, delay: 1});

                $('html').addClass('is-animated');

                break;
        
            case 'header':
                gsap.set($el, { opacity: 1});

                const htime = $el.find('.js-time'),
                    socialD = $el.find('.phone-hide .social__item'),
                    shareText = $el.find('.phone-hide .social__title'),
                    hHr = $el.find('.js-header-hr');

                gsap.fromTo([htime, shareText, socialD], { duration: 1, opacity: 0, x: -10}, { x: 0, opacity: 1, stagger: 0.1});
                gsap.fromTo(hHr, { scaleX: 0}, { scaleX: 1});

                break;

            default:
                console.warn(`animation type "${type}" does not exist`);
                break;
        }
    }



    private parallax(item: IParallaxCacheItem, sT: number, windowHeight: number, headerHeight: number): void {

        if (item.shift) {

            const $el: JQuery = item.$el;
            let y: number = item.y;

            const pyBottom: number = sT + (1 - item.start) * windowHeight;
            const pyTop: number = sT - item.height;

            if (y >= (pyTop + headerHeight) && y <= pyBottom) {

                const percent: number = (y - sT + item.height - headerHeight) / (windowHeight + item.height - headerHeight);
                y = Math.round(percent * item.shift);

                const time: number = !item.done ? 0 : 0.5;
                item.done = true;

                gsap.killTweensOf($el);
                gsap.to($el, {
                    duration: time,
                    y: y,
                    roundProps: ['y'],
                    ease: 'sine',
                });
            }

        } else if (item.type) {
            const $el: JQuery = item.$el;
            const $elSticky: JQuery = $el.parent().parent();
            const y: number = item.y;
            const pyBottom: number = sT + (1 - item.start) * windowHeight;
            const pyTop: number = sT - item.height;
            const pyTopSticky: number = sT - $elSticky.height();

            switch (item.type) {

                case 'hero':
                    gsap.set(item.$el, {
                        y: !browser.mobile ? sT * 0.5 : 0,
                    });

                    break;

                
                case 'fixedImage':
                    // console.log(y, "y", sT, pyBottom, windowHeight,windowHeight);
                    if (y >= pyTop && y <= pyBottom) {
                        
                        if (!$el.hasClass('has-parallax')) {
                            $el.addClass('has-parallax');
                        }
                        

                    } else {
                        $el.removeClass('has-parallax');
                    }
                    break;


                case 'css-animation':
                    if (y >= (pyTop + headerHeight) && y <= pyBottom) {
                        item.$el.hasClass('animation-play') ? null : item.$el.addClass('animation-play');
                    } else {
                        item.$el.removeClass('animation-play');
                    }

                    break;
            

                case 'relativeParallax':
                    const availableSpace = item.childHeight - item.height; // reserve space
                    const maxShift = Math.min(availableSpace, item.height + headerHeight); // Math.min(availableSpace, (windowHeight - data.height) * 0.5 ); // do not move too much on big screens
                    const percent = (sT - item.y + windowHeight) / (windowHeight + item.height);

                    let posY: string | number = Math.round((1 - percent) * maxShift);
                    posY = posY < 0 ? 0 : posY;
                    posY = posY > maxShift ? maxShift : posY;

                    gsap.set(item.$child, {
                        y: -posY,
                    });
                    break;


                default:
                    console.warn(`animation type "${item.type}" does not exist`);
                    break;
            }
        }
    }

}
