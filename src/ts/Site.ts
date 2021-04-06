/// <reference path="./references.d.ts" />
/// <reference path="definitions/jquery.d.ts" />

import { PushStates, PushStatesEvents } from './PushStates';
import { IBreakpoint, breakpoint, Breakpoint } from './Breakpoint';
import { Scroll } from './Scroll';
import { Page, PageEvents } from './pages/Page';
import { ComponentEvents, Component } from './components/Component';
import { Browser, browser } from './Browser';
import { Loader } from './Loader';
import { pages, components } from './Classes';
import { Copy } from './Copy';
import { Share } from './Share';
import { API } from './Api';

import * as Utils from './Utils';

export let site: Site;
export let $doc: JQuery;
export let $window: JQuery;
export let $body: JQuery;
export let $article: JQuery;
export let $main: JQuery;
export let $pageHeader: JQuery;
export let pixelRatio: number;
export let debug: boolean;
export let easing: string;
export let lang: string;
export let fixedposition: number;

// declare let CustomEase;




export class Site {


    public static instance: Site;

    private currentPage: Page;
    private pushStates: PushStates;
    private scroll: Scroll;
    private lastBreakpoint: IBreakpoint;
    private loader: Loader;
    // private isReady: boolean;
    // private components: Array<Component> = [];
    // private $hamburger: JQuery;
    // private $pageHeader: JQuery;
    // private $article: JQuery;


    constructor() {

        console.group();
        console.log('site');

        Site.instance = this;
        // lang = $('html').attr('lang');

        pixelRatio = window.devicePixelRatio || 1;
        debug = window.location.search.indexOf('debug') >= 0;
        // easing = CustomEase.create('custom', 'M0,0,C0.5,0,0.3,1,1,1');
    }



    public init(): void {

        Breakpoint.update();
        Browser.update();

        $doc = $(document);
        $window = $(window);
        $body = $('body');
        $article = $('#article-main');
        $main = $('#main');


        this.pushStates = new PushStates();
        this.pushStates.on(PushStatesEvents.CHANGE, this.onState);
        this.pushStates.on(PushStatesEvents.PROGRESS, this.onLoadProgress);

        // this.$hamburger = $('[data-hamburger]');
        // this.$article = $('#article-main');
        // this.$pageHeader = $('#page-header').length > 0 ? $('#page-header') : null;

        this.scroll = new Scroll();
        this.loader = new Loader($('.js-loader'));
        this.loader.show();
        this.loader.set(0.5);


        new Copy();
        new Share();
        new API();
        API.bind();
        // this.menu = new Menu($('.js-menu'));
        // this.cookies = new Cookies($('.js-cookies'));


        Promise.all<void>([
            this.setCurrentPage(),
            // this.preloadAssets(),
            Utils.setRootVars(),
        ]).then(this.onPageLoaded);


        if (debug) { Utils.stats(); }

        $window.on('orientationchange', () => setTimeout(() => {
            Utils.setRootVars();

        }, 100));
        $window.on('resize', () => this.onResize());
    }



    private onResize(): void {

        Breakpoint.update();
        if (breakpoint.desktop && !browser.mobile) {
            Utils.setRootVars();
        }

        const width = $window.width();
        const height = $window.height();

        const changed = !this.lastBreakpoint || this.lastBreakpoint.value !== breakpoint.value;
        this.lastBreakpoint = breakpoint;

        if (this.currentPage) {
            this.currentPage.resize(width, height, breakpoint, changed);
        }

        // this.callAll('resize', width, height, breakpoint, changed);
        this.loader.resize(width, height);
        this.scroll.resize();
    }



    private preloadAssets(): Promise<void> {

        let assets = [];
        let il = imagesLoaded('.preload-bg', {
            background: true,
        });

        if (assets && assets.length > 0) {
            for (let i = 0; i < assets.length; ++i) {
                il.addBackground(assets[i], null);
            }
        }

        return new Promise<void>((resolve, reject) => {
            il.jqDeferred.always(() => {
                resolve();
            });
        });
    }



    // check if any component handle onState event
    // if not, reload html:
    private onState = (): void => {

        // const scrollingChangedState = this.scroll.onState();
        const pageChangedState = this.currentPage.onState();

        // if (!scrollingChangedState && !offscreenChangedState && !pageChangedState) {
        if (!pageChangedState) {

            // Analytics.sendPageview(window.location.pathname);

            const pushStatesLoadPromise = this.pushStates.load();
            const animateOutPromise = this.currentPage.animateOut();

            animateOutPromise.then(() => {
                this.loader.show();
            });

            this.scroll.stop();

            // all promises array:
            const loadingPromises: Array<Promise<void>> = [
                pushStatesLoadPromise,
                animateOutPromise,
            ];

            // render html when everything's ready:
            Promise.all<void>(loadingPromises).then(this.render);
        }
    }



    // display ajax progress:
    private onLoadProgress = (progress: number): void => {
        this.loader.set(0.5 * progress);
    }



    // pass loading progress from page to preloader:
    private onPageProgress = (progress: number): void => {
        this.loader.set(0.5 + 0.5 * progress);
    }



    // deal with newly added elements
    private onPageAppend = (el: JQuery): void => {
        PushStates.bind(el[0]);
        // Widgets.bind(el[0]);
        this.scroll.load();
    }



    // called after new html is loaded
    // and old content is animated out:
    private render = (): void => {

        if (this.currentPage) {
            this.currentPage.off();
            this.currentPage.destroy();
            this.currentPage = null;
        }

        this.scroll.destroy();

        console.groupEnd();
        console.group();

        this.pushStates.render();
        this.setCurrentPage().then(this.onPageLoaded);
        PushStates.setTitle($('meta[property="og:title"]').attr('content'));
    }


    private detectHomePage(): void {
        $pageHeader ? $body.addClass('is-home-page') : null;
    }


    // when current page is loaded:
    private onPageLoaded = (): void => {
        // $body.removeClass('is-not-ready');
        $body.removeAttr('class');
        this.loader.hide();
        Utils.enableBodyScrolling(Scroll.scrollTop);
        Scroll.scrollToElement($body, 0, 0);
        this.currentPage.animateIn();
        $pageHeader = $('#page-header').length > 0 ? $('#page-header') : null;
        this.detectHomePage();
        PushStates.setNavbarVisibility();
        // this.cookies.tryToShow();
        Scroll.scrollToPath(true);
        this.scroll.load();
        this.scroll.start();
        $('article').parent().addClass('is-loaded');
    }



    // run new Page object
    // (found by `data-page` attribute)
    // bind it and store as currentPage:
    private setCurrentPage(): Promise<void> {
        let $pageEl: JQuery = $('[data-page]'),
            pageName: string = $pageEl.data('page') || 'Page',
            pageOptions: Object = $pageEl.data('options');

        console.log($pageEl, pageName);

        // page not found:
        if (pageName === undefined) {
            if (pageName !== 'undefined') {
                console.warn('There is no "%s" in Pages!', pageName);
            }
            pageName = 'Page';
        }

        // more than one data-page:
        if ($pageEl.length > 1) {
            console.warn('Only one [data-page] element, please!');

        // page not defined in html:
        } else if ($pageEl.length === 0) {
            $pageEl = $($('#main').find('article')[0] || $('#main').children().first()[0]);
        }



        // create Page object:
        let page: Page = new pages[pageName]($pageEl, pageOptions);
        this.currentPage = page;

        // bind events:
        API.bind();
        page.on(PageEvents.PROGRESS, this.onPageProgress);
        page.on(PageEvents.CHANGE, this.onPageAppend);

        this.onResize();

        return page.preload();
    }
}


$(document).ready(() => {
    site = new Site();
    site.init();
});
