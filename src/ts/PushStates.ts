import { Handler } from './Handler';
import { Scroll } from './Scroll';
import { $body, $article, $pageHeader } from './Site';
import * as Utils from './Utils';
import { Aside } from './components/Aside';
// import { Signup } from './Signup';


/* tslint:disable:variable-name disable-next-line: no-any */
let Historyjs: Historyjs = <any>History;
/* tslint:enable:variable-name disable-next-line: no-any */



export class PushStatesEvents {
    public static CHANGE = 'state';
    public static PROGRESS = 'progress';
}



export class PushStates extends Handler {
    public static instance: PushStates;
    public static readonly TIME_LIMIT = 5000;
    private static noChange = false;

    private loadedData: string;
    private request: XMLHttpRequest;
    private timeout;



    /** change document title */
    public static setTitle(title?: string): void {
        document.title = title || $('#main > [data-title]').data('title');
    }



    /** change loaction pathname and trigger History */
    public static goTo(location: string, replace?: boolean): boolean {

        let pathname = location.replace(window.location.protocol + window.location.host, ''),
            isDifferent = pathname !== window.location.pathname;

        if (Modernizr.history) {
            if (!!replace) {
                Historyjs.replaceState({ randomData: Math.random() }, document.title, pathname);
            } else {
                Historyjs.pushState({ randomData: Math.random() }, document.title, pathname);
            }
        } else {
            window.location.replace(location);
        }

        return isDifferent;
    }



    /** only change loaction pathname without triggering History */
    public static changePath(location: string, replace?: boolean, title?: string): void {

        PushStates.noChange = true;
        let changed = PushStates.goTo(location, replace || true);
        PushStates.noChange = false;

        if (!!changed) {
            PushStates.setTitle(title || document.title);
        }
    }



    /** bind links to be used with PushStates / History */
    public static bind(target?: Element | NodeList | Element[] | string, elementItself?: boolean): void {
        if (!elementItself) {
            PushStates.instance.bindLinks(target);
        } else {
            PushStates.instance.bindLink(target as Element);
        }
    }



    /**
     * go back in browser history
     * @param {string} optional fallback url (when browser deoesn't have any items in history)
     */
    public static back(url?: string): void {
        if (history.length > 2) { // || document.referrer.length > 0) {
            Historyjs.back();
        } else if (url) {
            Historyjs.replaceState({ randomData: Math.random() }, document.title, url);
        } else {
            Historyjs.replaceState({ randomData: Math.random() }, document.title, '/');
        }
    }



    public static reload(): void {
        PushStates.instance.trigger(PushStatesEvents.CHANGE);
    }

    public static setNavbarVisibility(): void {

        if (!$pageHeader) {
            $('html').addClass('is-animated');
            $body.addClass('navbar-always-shown');
        }
    }

    public static asideToggle = (e?): void => {
        let el = e ? $(e.currentTarget) : $('[data-hamburger]');
        
        if (el.hasClass('is-open')) {

            setTimeout( () => {
                gsap.set($article, {'will-change': 'transform'});
                Utils.disableBodyScrolling(Scroll.scrollTop);
                el.removeClass('is-open');
                $body.removeClass('is-aside-open');
            }, 500);
        } else {
            gsap.set($article, { clearProps: 'will-change'});
            Utils.enableBodyScrolling(Scroll.scrollTop);
            el.addClass('is-open');
            $body.addClass('is-aside-open');
        }

        Aside.asideAnimation();

        return;
    }



    constructor() {

        super();

        if (Historyjs) {
            this.bindLinks();
            Historyjs.Adapter.bind(window, 'statechange', this.onState);
        }

        PushStates.instance = this;

        this.setActiveLinks();
    }




    /**
     * load new content via ajax based on current location:
     * @return {Promise<boolean>} promise resolved when XMLHttpRequest is finished
     */
    public load(): Promise<void> {

        // cancel old request:
        if (this.request) {
            this.request.abort();
        }

        // define url
        const path: string = window.location.pathname;
        const search: string = window.location.search || '';
        const url = path + search;

        // define timeout
        window.clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (this.request) {
                window.location.reload();
            }
        }, PushStates.TIME_LIMIT);

        // return promise
        // and do the request:
        return new Promise<void>((resolve, reject) => {

            // do the usual xhr stuff:
            this.request = new XMLHttpRequest();
            this.request.open('GET', url);
            this.request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

            // onload handler:
            this.request.onload = () => {

                if (this.request.status === 200) {

                    this.loadedData = this.request.responseText;
                    this.trigger(PushStatesEvents.PROGRESS, 1);
                    resolve();

                } else {

                    reject(Error(this.request.statusText));

                    if (this.request.statusText !== 'abort') {
                        window.location.reload();
                    }
                }

                this.request = null;
                window.clearTimeout(this.timeout);
            };

            // catching errors:
            this.request.onerror = () => {
                reject(Error('Network Error'));
                window.clearTimeout(this.timeout);
                this.request = null;
            };

            // catch progress
            this.request.onprogress = (e) => {
                if (e.lengthComputable) {
                    this.trigger(PushStatesEvents.PROGRESS, e.loaded / e.total);
                }
            };

            // send request:
            this.request.send();
        });
    }



    /** function called on successful data load */
    public render(): void {

        const data: string = this.loadedData.trim();
        const containers: any = $('.js-replace[id], #main').toArray();
        let renderedCount = 0;

        // render each of containers
        // if only one container, force `plain`
        if (containers.length > 0) {
            containers.forEach((container, index): void => {
                renderedCount += this.renderElement(container, data, index === 0 && containers.length === 1) ? 1 : 0;
            });
        }

        // re-try rendering if none of containers were rendered:
        if (renderedCount === 0 && containers.length > 0) {
            this.renderElement($('#main')[0], data, true);
        }

        this.bindLinks();
        this.setActiveLinks();

        // dispatch global event for serdelia CMS:
        window.document.dispatchEvent(new Event('ajax_loaded'));
    }



    private renderElement(el: HTMLElement, data: string, forcePlain?: boolean): boolean {

        let code: string = null;
        const container = '#' + el.id;

        if (!!forcePlain && data.indexOf('<article') === 0 && el.id === 'article-main') {
            code = data;
        } else {
            const $loadedContent: JQuery = $($(data).find(container)[0] || $(data).filter(container)[0]);
            code = $loadedContent.html();
        }

        if (!code) { console.info(`Couldn't rerender #${el.id} element`); return false; }

        $(container)
            .hide()
            .empty()
            .html(code || data)
            .show();

        return true;
    }



    /** bind links */
    private bindLink(target: Element): void {
        $(target).off('click').on('click.history', this.onClick);
    }



    /** bind links */
    private bindLinks(target?: Element | NodeList | Element[] | string): void {

        target = target || 'body';

        $(target).find('a')
            .not('[data-history="false"]')
            .not('[data-api]')
            .not('[download]')
            .not('[data-modal]')
            .not('[href^="#"]')
            .not('[href$=".jpg"]')
            .not('[target="_blank"]')
            .not('[href^="mailto:"]')
            .not('[href^="tel:"]')
            .not('[data-poczta]')
            .not('[data-login]')
            .not('[data-lang]')
            .not('[data-scroll-to]')
            .off('.history').on('click.history', this.onClick);

        $(target).find('a[href^="http"]')
            .not('[href^="http://' + window.location.host + '"]')
            .off('.history');

        $(target).find('a[href^="#"]').not('[href="#"]')
            .off('.history')
            .on('click.history', this.onHashClick);


        $('[data-hamburger]').on('click', PushStates.asideToggle);
    }

    private onLanguageClick = (e): void => {
        e.preventDefault();
        e.stopPropagation();
        const lang = $(e.currentTarget).data('lang');
        const alternate = $('[data-alternate]').data('alternate');
        const articleURL = alternate ? alternate[lang || Object.keys(alternate)[0]] : null;
        const headLink = $('link[rel="alternate"][hreflang]')[0] as HTMLLinkElement;
        const headURL = headLink ? headLink.href : null;
        window.location.assign(articleURL || headURL || e.currentTarget.href);
    }



    /** links click handler */
    private onClick = (e: JQueryEventObject): void => {

        e.preventDefault();
        if ($body.hasClass('is-aside-open')) {
            PushStates.asideToggle();
        }
        let $self: JQuery = $(e.currentTarget as HTMLElement),
            state: string = $self.attr('href').replace('http://' + window.location.host, ''),
            type: string = $self.attr('data-history');

        if (type === 'back') {
            PushStates.back(state);
        } else if (type === 'replace') {
            Historyjs.replaceState({ randomData: Math.random() }, document.title, state);
        } else {
            Scroll.resetScrollCache(state);
            Historyjs.pushState({ randomData: Math.random() }, document.title, state);
        }
    }



    /** on hash-link click handler */
    private onHashClick = (e): void => {
        e.preventDefault();
        e.stopPropagation();
        console.log('click link');
        if ($body.hasClass('is-aside-open')) {
            PushStates.asideToggle();

            setTimeout( () => {
                Scroll.scrollToElement($(e.currentTarget.hash));
            }, 500);
        } else {
            Scroll.scrollToElement($(e.currentTarget.hash));
        }
    }



    /** Historyjs `statechange` event handler */
    private onState = (): void => {
        this.setActiveLinks();
        PushStates.setNavbarVisibility();
        if (!PushStates.noChange) {
            this.trigger(PushStatesEvents.CHANGE);
        }
    }



    /** mark links as active */
    private setActiveLinks(): void {
        $('a[href]').removeClass('is-active');
        $('a[href="' + window.location.pathname + '"]').addClass('is-active');
    }
}

