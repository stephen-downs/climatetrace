(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils = require("./Utils");
const Site_1 = require("./Site");
class API {
    static bind(target) {
        const $target = $(typeof target !== 'undefined' ? target : 'body');
        $target.find('[data-api]').not('form').off('.api').on('click.api', API.onAction);
        $target.find('form[data-api]').off('.api').on('submit.api', API.onAction).attr('novalidate', 'novalidate');
    }
    static callIt(data, $el, customCallback) {
        data = API.preprocessData(data, $el);
        $el.addClass('is-doing-request');
        const action = data.action || 'POST';
        delete data.action;
        const url = data.url || window.location.pathname;
        delete data.url;
        $el.addClass('is-doing-request');
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                global: false,
                type: action,
                dataType: 'json',
                async: true,
                data: data,
            })
                .done((response) => {
                if (data.callback) {
                    API.onSuccess(data, $el, response);
                }
                if (customCallback && typeof customCallback === 'function') {
                    customCallback(data, $el, response);
                }
                resolve(response);
            })
                .fail((e) => {
                console.warn('API error: ' + e, data);
                if (!!Site_1.debug) {
                    if (data.callback) {
                        API.onSuccess(data, $el, null);
                    }
                    if (customCallback && typeof customCallback === 'function') {
                        customCallback(data, $el, null);
                    }
                }
                reject(e);
            })
                .always(() => {
                $el.removeClass('is-doing-request');
            });
        });
    }
    static preprocessData(data, $el) {
        if ($el.is('form')) {
            data.url = !data.url && $el.attr('action') ? $el.attr('action') : data.url;
            data = $.extend(data, $el.find(':input').serializeObject());
            console.log('data form', data, data.params, data.form, $el.find(':input'));
        }
        if ($el.is('[href]')) {
            data.url = !data.url && $el.attr('href') ? $el.attr('href') : data.url;
        }
        if (data.form && $(data.form)[0]) {
            data = $.extend(data, $(data.form).serializeObject());
            delete data.form;
        }
        if (data.params) {
            data = $.extend(data, data.params);
            delete data.params;
        }
        console.log('data pre', data, data.params);
        return data;
    }
}
exports.API = API;
API.beforeCalls = {
    login: function (data, $el) {
        if (!$body.hasClass('is-logged')) {
            $('.js-login').last().trigger('click');
            return;
        }
        else {
            API.callIt(data, $el);
        }
    },
    validate: function (data, $el) {
        let passed = true;
        let message = '';
        let $form = $el.is('form') ? $el : $el.closest('form');
        let $validationElem = $form;
        let stepValidation;
        let scrollTo;
        if ($form.hasClass('is-done')) {
            $form.removeClass('is-done');
            return;
        }
        $validationElem.find('.js-error').text('');
        $validationElem.find('[required]:input').each((index, input) => {
            if (input.nodeName === 'INPUT') {
                switch (input.type) {
                    case 'email':
                        let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                        let value = input.value;
                        if (!re.test(value)) {
                            passed = false;
                            message = Utils.translations[value.length > 0 ? 'invalid-email' : 'required-field']['en'];
                            $(input).addClass('is-error');
                            $(input).nextAll('.js-error').text(message);
                        }
                        else {
                            $(input).removeClass('is-error');
                        }
                        break;
                    case 'checkbox':
                        if (!input.checked) {
                            passed = false;
                            message = '';
                            message = !message ? Utils.translations['required-field']['en'] : message;
                            $(input).addClass('is-error');
                            $(input).nextAll('.js-error').text(message);
                        }
                        else {
                            $(input).removeClass('is-error');
                        }
                        break;
                    case 'text':
                        let val = input.value;
                        if (val.length < 1) {
                            passed = false;
                            message = '';
                            message = !message ? Utils.translations['required-field']['en'] : message;
                            if ($(input).hasClass('js-postal')) {
                                message = Utils.translations['invalid-zip']['en'];
                            }
                            $(input).addClass('is-error');
                            $(input).nextAll('.js-error').text(message);
                        }
                        else {
                            $(input).removeClass('is-error');
                        }
                        break;
                    case 'number':
                        break;
                    case 'phone':
                        let valTel = input.value;
                        if (valTel.length < 1) {
                            passed = false;
                            message = '';
                            message = !message ? Utils.translations['required-field']['en'] : message;
                            $(input).addClass('is-error');
                            $(input).nextAll('.js-error').text(message);
                        }
                        else {
                            $(input).removeClass('is-error');
                        }
                        break;
                    default:
                        break;
                }
            }
            if (input.nodeName === 'TEXTAREA') {
                let val = input.value;
                if (val.length < 1) {
                    passed = false;
                    message = '';
                    message = !message ? Utils.translations['required-field']['en'] : message;
                    $(input).addClass('is-error');
                    $(input).nextAll('.js-error').text(message);
                }
                else {
                    $(input).removeClass('is-error');
                }
            }
        });
        $validationElem.find('input[name=zipcode]').each((index, input) => {
            let val = input.value;
            if (val.length > 0) {
                if ($(input).hasClass('js-postal') && val.length != 5) {
                    passed = false;
                    message = '';
                    message = !message ? Utils.translations['invalid-zip']['en'] : message;
                    $(input).addClass('is-error');
                    $(input).nextAll('.js-error').text(message);
                }
            }
        });
        if (!!passed) {
            API.callIt(data, $form);
            $form.removeClass('has-errors');
            $validationElem.find('.js-error').text('');
        }
        else {
            $form.addClass('has-errors');
        }
    },
};
API.callbacks = {
    onCookiesClose: function (data, $el, response) {
        $el.parent().addClass('is-hidden');
    },
    onSubscribe: function (data, $el, response) {
        console.log('onSubscribe');
        let $message = $el.find('.js-message');
        let scrollTo;
        $el.removeClass('is-error');
        if (!$message[0]) {
            $el.append('<div class="js-message message">');
            $message = $el.find('.js-message');
        }
        let html = $('<p>' + response.message + '</p>');
        $message.html('').append(html);
        if (response.result) {
            $el.addClass('is-completed');
            $el.parent().addClass('is-subscribed');
            $el.closest('.join').addClass('is-subscribed');
            $el.find('input').val('');
            $el.find('input:checked').removeAttr('checked');
            if ($el[0].hasAttribute('data-redirect')) {
                setTimeout(() => {
                    window.location.assign('/');
                }, 1500);
            }
        }
        else {
            $el.addClass('is-error');
        }
        $el.find('input').trigger('blur');
    },
};
API.onAction = (e) => {
    e.preventDefault();
    e.stopPropagation();
    let $el = $(e.currentTarget);
    const data = Object.assign({}, $(e.currentTarget).data('api'));
    console.log(data, 'data');
    if ($el.is('form')) {
        $el.addClass('is-submitted');
    }
    else {
        $el.closest('form').addClass('is-submitted');
    }
    if (data.beforeCall) {
        if (data.beforeCall in API.beforeCalls) {
            API.beforeCalls[data.beforeCall](data, $el);
            return;
        }
    }
    API.callIt(data, $el);
};
API.onSuccess = (data, $el, response) => {
    if (data.callback) {
        if (data.callback in API.callbacks) {
            API.callbacks[data.callback](data, $el, response);
        }
    }
};
},{"./Site":11,"./Utils":12}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Breakpoint {
    static update() {
        const cssBefore = window.getComputedStyle(document.querySelector('body'), ':before');
        const cssBeforeValue = cssBefore.getPropertyValue('content').replace(/[\"\']/g, '');
        exports.breakpoint = {
            desktop: cssBeforeValue === 'desktop',
            phone: cssBeforeValue === 'phone',
            tablet: cssBeforeValue === 'tablet',
            value: cssBeforeValue,
        };
        console.log("BP:", exports.breakpoint.value);
    }
}
exports.Breakpoint = Breakpoint;
},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getBrowser() {
    const ua = window.navigator.userAgent;
    exports.browser = {
        mobile: (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(ua) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(ua.substr(0, 4))) ? true : false,
        ios: /iPad|iPhone|iPod/.test(ua),
        mac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,
        ie: ua.indexOf('MSIE ') > 0 || !!ua.match(/Trident.*rv\:11\./),
        opera: (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0,
        firefox: ua.toLowerCase().indexOf('firefox') > -1,
        safari: /^((?!chrome|android).)*safari/i.test(ua),
        windows: window.navigator.platform.toLowerCase().indexOf('win') > -1,
    };
    $('html')
        .toggleClass('mac', !exports.browser.windows && (exports.browser.ios || exports.browser.mac))
        .toggleClass('windows', exports.browser.windows && !exports.browser.mac && !exports.browser.ios)
        .toggleClass('mobile', exports.browser.mobile)
        .toggleClass('firefox', exports.browser.firefox)
        .toggleClass('safari', exports.browser.safari)
        .toggleClass('ie', exports.browser.ie);
    return exports.browser;
}
exports.getBrowser = getBrowser;
class Browser {
    static update() {
        exports.browser = getBrowser();
    }
}
exports.Browser = Browser;
},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Slider_1 = require("./components/Slider");
const Tooltip_1 = require("./components/Tooltip");
const Dropdown_1 = require("./components/Dropdown");
const Filters_1 = require("./components/Filters");
const Dashboard_1 = require("./components/Dashboard");
const Stats_1 = require("./components/Stats");
const Masonry_1 = require("./components/Masonry");
const Range_1 = require("./components/Range");
const Chart_1 = require("./components/Chart");
const Page_1 = require("./pages/Page");
exports.components = {
    Slider: Slider_1.Slider,
    Tooltip: Tooltip_1.Tooltip,
    Dropdown: Dropdown_1.Dropdown,
    Filters: Filters_1.Filters,
    Dashboard: Dashboard_1.Dashboard,
    Stats: Stats_1.Stats,
    Masonry: Masonry_1.Masonry,
    Range: Range_1.Range,
    Chart: Chart_1.Chart,
};
exports.pages = {
    Page: Page_1.Page
};
},{"./components/Chart":13,"./components/Dashboard":15,"./components/Dropdown":16,"./components/Filters":17,"./components/Masonry":18,"./components/Range":19,"./components/Slider":20,"./components/Stats":21,"./components/Tooltip":23,"./pages/Page":24}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Copy {
    constructor() {
        this.bind();
    }
    bind() {
        $('[data-copy]').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const $el = $(e.currentTarget);
            const url = window.location.origin + window.location.pathname;
            window.Clipboard.copy(url);
            window.console.info('"%s" copied', url);
            $el.addClass('is-copied');
            setTimeout(() => { $el.removeClass('is-copied'); }, 1000);
        });
    }
}
exports.Copy = Copy;
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Handler {
    constructor() {
        this.events = {};
    }
    on(eventName, handler) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
        return this;
    }
    off(eventName, handler) {
        if (typeof eventName === 'undefined') {
            this.events = {};
            return this;
        }
        if (typeof handler === 'undefined' && this.events[eventName]) {
            this.events[eventName] = [];
            return this;
        }
        if (!this.events[eventName]) {
            return this;
        }
        const index = this.events[eventName].indexOf(handler);
        if (index > -1) {
            this.events[eventName].splice(index, 1);
        }
        return this;
    }
    trigger(eventName, ...extraParameters) {
        if (!this.events[eventName]) {
            return;
        }
        const args = arguments;
        this.events[eventName].forEach(event => event.apply(this, [].slice.call(args, 1)));
    }
    destroy() {
        this.events = {};
    }
}
exports.Handler = Handler;
},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Loader {
    constructor(view) {
        this.view = view;
        this.width = window.innerWidth;
        this.progress = 0;
    }
    show() {
        gsap.to(this.view, { y: 0, duration: 0.2 });
    }
    hide() {
        gsap.killTweensOf(this.view, ['width']);
        gsap.to(this.view, { duration: 0.5, y: 10, width: this.width || '100%' });
    }
    set(progress) {
        this.progress = progress;
        gsap.killTweensOf(this.view, ['y']);
        let width = this.width * progress;
        gsap.killTweensOf(this.view, ['width']);
        gsap.to(this.view, { duration: 0.3, width: width });
    }
    resize(wdt, hgt) {
        this.width = wdt;
    }
}
exports.Loader = Loader;
},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handler_1 = require("./Handler");
const Scroll_1 = require("./Scroll");
const Site_1 = require("./Site");
const Utils = require("./Utils");
let Historyjs = History;
class PushStatesEvents {
}
exports.PushStatesEvents = PushStatesEvents;
PushStatesEvents.CHANGE = 'state';
PushStatesEvents.PROGRESS = 'progress';
class PushStates extends Handler_1.Handler {
    constructor() {
        super();
        this.asideToggle = (e) => {
            let el = $(e.currentTarget);
            el.toggleClass('is-open');
            Site_1.$body.toggleClass('is-aside-open');
            if (el.hasClass('is-open')) {
                gsap.set(Site_1.$article, { 'will-change': 'transform' });
                Utils.disableBodyScrolling(Scroll_1.Scroll.scrollTop);
            }
            else {
                gsap.set(Site_1.$article, { clearProps: 'will-change' });
                Utils.enableBodyScrolling(Scroll_1.Scroll.scrollTop);
            }
            return;
        };
        this.onLanguageClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const lang = $(e.currentTarget).data('lang');
            const alternate = $('[data-alternate]').data('alternate');
            const articleURL = alternate ? alternate[lang || Object.keys(alternate)[0]] : null;
            const headLink = $('link[rel="alternate"][hreflang]')[0];
            const headURL = headLink ? headLink.href : null;
            window.location.assign(articleURL || headURL || e.currentTarget.href);
        };
        this.onClick = (e) => {
            e.preventDefault();
            let $self = $(e.currentTarget), state = $self.attr('href').replace('http://' + window.location.host, ''), type = $self.attr('data-history');
            if (type === 'back') {
                PushStates.back(state);
            }
            else if (type === 'replace') {
                Historyjs.replaceState({ randomData: Math.random() }, document.title, state);
            }
            else {
                Scroll_1.Scroll.resetScrollCache(state);
                Historyjs.pushState({ randomData: Math.random() }, document.title, state);
            }
        };
        this.onHashClick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('click link');
            Scroll_1.Scroll.scrollToElement($(e.currentTarget.hash));
        };
        this.onState = () => {
            this.setActiveLinks();
            PushStates.setNavbarVisibility();
            if (!PushStates.noChange) {
                this.trigger(PushStatesEvents.CHANGE);
            }
        };
        if (Historyjs) {
            this.bindLinks();
            Historyjs.Adapter.bind(window, 'statechange', this.onState);
        }
        PushStates.instance = this;
        this.setActiveLinks();
    }
    static setTitle(title) {
        document.title = title || $('#main > [data-title]').data('title');
    }
    static goTo(location, replace) {
        let pathname = location.replace(window.location.protocol + window.location.host, ''), isDifferent = pathname !== window.location.pathname;
        if (Modernizr.history) {
            if (!!replace) {
                Historyjs.replaceState({ randomData: Math.random() }, document.title, pathname);
            }
            else {
                Historyjs.pushState({ randomData: Math.random() }, document.title, pathname);
            }
        }
        else {
            window.location.replace(location);
        }
        return isDifferent;
    }
    static changePath(location, replace, title) {
        PushStates.noChange = true;
        let changed = PushStates.goTo(location, replace || true);
        PushStates.noChange = false;
        if (!!changed) {
            PushStates.setTitle(title || document.title);
        }
    }
    static bind(target, elementItself) {
        if (!elementItself) {
            PushStates.instance.bindLinks(target);
        }
        else {
            PushStates.instance.bindLink(target);
        }
    }
    static back(url) {
        if (history.length > 2) {
            Historyjs.back();
        }
        else if (url) {
            Historyjs.replaceState({ randomData: Math.random() }, document.title, url);
        }
        else {
            Historyjs.replaceState({ randomData: Math.random() }, document.title, '/');
        }
    }
    static reload() {
        PushStates.instance.trigger(PushStatesEvents.CHANGE);
    }
    static setNavbarVisibility() {
        if (!Site_1.$pageHeader) {
            $('html').addClass('is-animated');
            Site_1.$body.addClass('navbar-always-shown');
        }
    }
    load() {
        if (this.request) {
            this.request.abort();
        }
        const path = window.location.pathname;
        const search = window.location.search || '';
        const url = path + search;
        window.clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            if (this.request) {
                window.location.reload();
            }
        }, PushStates.TIME_LIMIT);
        return new Promise((resolve, reject) => {
            this.request = new XMLHttpRequest();
            this.request.open('GET', url);
            this.request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            this.request.onload = () => {
                if (this.request.status === 200) {
                    this.loadedData = this.request.responseText;
                    this.trigger(PushStatesEvents.PROGRESS, 1);
                    resolve();
                }
                else {
                    reject(Error(this.request.statusText));
                    if (this.request.statusText !== 'abort') {
                        window.location.reload();
                    }
                }
                this.request = null;
                window.clearTimeout(this.timeout);
            };
            this.request.onerror = () => {
                reject(Error('Network Error'));
                window.clearTimeout(this.timeout);
                this.request = null;
            };
            this.request.onprogress = (e) => {
                if (e.lengthComputable) {
                    this.trigger(PushStatesEvents.PROGRESS, e.loaded / e.total);
                }
            };
            this.request.send();
        });
    }
    render() {
        const data = this.loadedData.trim();
        const containers = $('.js-replace[id], #main').toArray();
        let renderedCount = 0;
        if (containers.length > 0) {
            containers.forEach((container, index) => {
                renderedCount += this.renderElement(container, data, index === 0 && containers.length === 1) ? 1 : 0;
            });
        }
        if (renderedCount === 0 && containers.length > 0) {
            this.renderElement($('#main')[0], data, true);
        }
        this.bindLinks();
        this.setActiveLinks();
        window.document.dispatchEvent(new Event('ajax_loaded'));
    }
    renderElement(el, data, forcePlain) {
        let code = null;
        const container = '#' + el.id;
        if (!!forcePlain && data.indexOf('<article') === 0 && el.id === 'article-main') {
            code = data;
        }
        else {
            const $loadedContent = $($(data).find(container)[0] || $(data).filter(container)[0]);
            code = $loadedContent.html();
        }
        if (!code) {
            console.info(`Couldn't rerender #${el.id} element`);
            return false;
        }
        $(container)
            .hide()
            .empty()
            .html(code || data)
            .show();
        return true;
    }
    bindLink(target) {
        $(target).off('click').on('click.history', this.onClick);
    }
    bindLinks(target) {
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
        $('[data-hamburger]').on('click', this.asideToggle);
    }
    setActiveLinks() {
        $('a[href]').removeClass('is-active');
        $('a[href="' + window.location.pathname + '"]').addClass('is-active');
    }
}
exports.PushStates = PushStates;
PushStates.TIME_LIMIT = 5000;
PushStates.noChange = false;
},{"./Handler":6,"./Scroll":9,"./Site":11,"./Utils":12}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Browser_1 = require("./Browser");
const Breakpoint_1 = require("./Breakpoint");
const Site_1 = require("./Site");
const Classes_1 = require("./Classes");
class Scroll {
    constructor() {
        this.cache = {};
        this.scrollCache = {};
        this.onHashClickHandler = (e) => {
            e.preventDefault();
            if ($(e.target).attr('data-offset')) {
                let offset = parseInt($(e.target).attr('data-offset'), 10);
                if (typeof $(e.target).attr('data-offset') === 'string') {
                    const off = $(e.target).attr('data-offset').replace('vh', '');
                    offset = $(window).height() * (parseInt(off, 10) / 100);
                }
                Scroll.scrollToElement($(e.currentTarget.hash), offset);
            }
            else {
                Scroll.scrollToElement($(e.currentTarget.hash));
            }
        };
        this.onScroll = () => {
            if (Scroll.disabled || Site_1.$body.hasClass('is-aside-open')) {
                return;
            }
            const sT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
            const windowHeight = Scroll.windowHeight;
            const screenCenter = sT + Scroll.windowHeight * 0.33;
            const headerHeight = Scroll.headerHeight;
            const scrollend = $('#main').outerHeight() - window.innerHeight - 2;
            const pageHeader = $('#page-header').length > 0 ? $('#page-header').offset().top - (Scroll.headerHeight * 2) : 0;
            const backgrounds = $('#page-header').length > 0 ? $('#page-header').offset().top - Scroll.headerHeight : 0;
            Scroll.scrollTop = sT;
            this.scrollCache[window.location.pathname] = sT;
            Site_1.$body.toggleClass('is-scrolled-window-height', sT > windowHeight - 100);
            Site_1.$body.toggleClass('is-scrolled-navbar', sT > 100);
            Site_1.$body.toggleClass('is-scrolled', sT > 0);
            Site_1.$body.toggleClass('is-trailer-scrolled', sT > pageHeader);
            Site_1.$body.toggleClass('is-backgrounds-scrolled', sT > backgrounds);
            Site_1.$body.toggleClass('is-scroll-end', sT >= scrollend);
            if (this.cache.animations && this.cache.animations.length > 0) {
                for (let i = 0; i < this.cache.animations.length; i++) {
                    const item = this.cache.animations[i];
                    const yBottom = sT + (1 - item.start) * windowHeight;
                    const yTop = sT;
                    const itemY = !this.ignoreCache ? item.y : item.$el.offset().top;
                    const itemHeight = !this.ignoreCache ? item.height : item.$el.height();
                    if (!item.done && itemY <= yBottom && itemY + itemHeight >= sT) {
                        item.$el.addClass('animated');
                        item.done = true;
                        const quick = yTop >= itemY + itemHeight;
                        this.animate(item, item.$el, item.type, item.delay, quick);
                    }
                    else if (!!item.done && item.component && item.type === 'toggle' && (itemY > yBottom || itemY + itemHeight < yTop)) {
                        if (typeof item.component['disable'] === 'function') {
                            item.component['disable']();
                        }
                        item.done = false;
                    }
                    else if (item.uncache && item.done && (sT <= itemY - windowHeight || sT >= itemY + windowHeight)) {
                        item.done = false;
                        if (item.$el.find('.uncached').length > 0) {
                            item.$el.find('.uncached').removeAttr('style');
                        }
                        if (item.$el.attr('data-uncache')) {
                            item.$el.removeAttr('style');
                        }
                        item.$el.removeClass('animated');
                    }
                }
            }
            if (this.cache.parallaxes && this.cache.parallaxes.length > 0 && Breakpoint_1.breakpoint.desktop) {
                for (let i = 0; i < this.cache.parallaxes.length; i++) {
                    this.parallax(this.cache.parallaxes[i], sT, windowHeight, -headerHeight);
                }
            }
            if (this.cache.backgrounds) {
                const windowCenter = 0.5 * windowHeight;
                let bgsToShow = [];
                let bgsToHide = [];
                this.cache.backgrounds.forEach((item, index) => {
                    const itemY = !this.ignoreCache ? item.y : item.$el.offset().top;
                    const itemHeight = !this.ignoreCache ? item.height : item.$el.outerHeight();
                    const itemBottom = itemY + itemHeight;
                    const yCenter = (typeof item.start !== 'undefined') ? sT + item.start * windowHeight : windowCenter;
                    const background = this.backgrounds[item.id];
                    const delay = typeof item.delay !== 'undefined' ? item.delay : 0.1;
                    const percentage = -(itemY - yCenter) / itemHeight;
                    let backgroundQuickSetup = false;
                    let current = Site_1.$body.hasClass('is-trailer-scrolled') ? sT + windowHeight >= itemY && itemY + itemHeight >= sT : itemY - sT <= windowCenter && itemBottom - sT >= windowCenter;
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
                    }
                    else if (!!item.shown) {
                        bgsToHide.push(item.id);
                        item.shown = false;
                    }
                });
                if (bgsToHide.length) {
                    bgsToHide.forEach((bgID) => {
                        if (bgsToShow.indexOf(bgID) < 0) {
                            this.backgrounds[bgID].animationOut(false);
                        }
                    });
                }
            }
        };
        this.ignoreCache = !!Browser_1.browser.safari;
        $(window).on('scroll', this.onScroll);
        $('a[href^="#"]:not(".js-nav-item, [data-lightbox]")').on('click', this.onHashClickHandler);
        this.backgrounds = this.buildBackgrounds();
        Scroll.headerHeight = 70;
        Scroll.instance = this;
        this.storedPath = window.location.pathname;
        this.target = $('[data-path="' + window.location.pathname + '"]');
        this.sections = $('[data-scroll]');
    }
    static scrollToElement($el, offset, duration) {
        return new Promise((resolve) => {
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
                onUpdate: () => {
                    window.scrollTo(0, obj.y);
                },
                onComplete: () => {
                    Scroll.animating = false;
                    resolve();
                },
            });
        });
    }
    static resetScrollCache(pathname) {
        Scroll.instance.cache[pathname] = 0;
    }
    static disable() {
        this.disabled = true;
    }
    static enable() {
        this.animating = false;
        this.disabled = false;
    }
    resize() {
        Scroll.windowHeight = window.innerHeight;
        Scroll.headerHeight = $('#navbar').height();
        Scroll.maxScroll = $('#main').outerHeight() - Scroll.windowHeight + Scroll.headerHeight;
        this.backgrounds = this.buildBackgrounds();
        this.saveCache();
    }
    static scrollToPath(fast) {
        const $target = $('[data-path="' + window.location.pathname + '"]');
        if ($target[0]) {
            Scroll.scrollToElement($target, 0, 0);
            return true;
        }
        else {
            return false;
        }
    }
    onState() {
        if (!!this.changingPath) {
            return false;
        }
        return Scroll.scrollToPath();
    }
    stop() {
        Scroll.disable();
    }
    load() {
        this.sections = $('[data-scroll]');
        this.saveCache();
        Site_1.$window.off('.scrolling').on('scroll.scrolling', () => this.onScroll());
    }
    start() {
        Scroll.enable();
        Scroll.instance.onScroll();
    }
    destroy() {
        this.cache = {};
        Site_1.$window.off('.scrolling');
    }
    buildBackgrounds() {
        let bgs = {};
        $('[data-bg-component]').toArray().forEach((el, i) => {
            let $bgEl = $(el);
            let bgName = $bgEl.data('bg-component');
            let bgOptions = $bgEl.data('options');
            if (typeof Classes_1.components[bgName] !== 'undefined') {
                const bg = new Classes_1.components[bgName]($bgEl, bgOptions);
                bg.id = el.id;
                bgs[el.id] = bg;
            }
            else {
                window.console.warn('There is no "%s" component available!', bgName);
            }
        });
        return bgs;
    }
    saveCache() {
        const animations = [];
        const margin = 0;
        $('[data-animation]').each((i, el) => {
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
        const parallaxes = [];
        $('[data-parallax]').each((i, el) => {
            const $el = $(el);
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
        let backgrounds = [];
        $('[data-background]').each((i, el) => {
            const $el = $(el);
            const backgroundData = $el.data('background');
            const breakpoints = backgroundData.breakpoints || ['desktop', 'tablet', 'phone'];
            if (breakpoints.indexOf(Breakpoint_1.breakpoint.value) >= 0) {
                if (!this.backgrounds[backgroundData.id]) {
                    console.warn('there\'s no background with id=' + backgroundData.id + '!');
                }
                else {
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
        this.onScroll();
    }
    animate(data, $el, type, delay = 0.1, quick, uncache) {
        const time = !quick ? .6 : 0;
        switch (type) {
            case 'fade':
                gsap.killTweensOf($el, { opacity: true });
                gsap.fromTo($el, { opacity: 0 }, { duration: time, opacity: 1, ease: 'sine', delay: delay });
                break;
            case 'fadeUp':
                gsap.killTweensOf($el, { opacity: true, y: true });
                gsap.fromTo($el, { opacity: 0, y: 40 }, { duration: time, opacity: 1, y: 0, ease: 'sine', delay: delay });
                break;
            case 'fadeDown':
                gsap.killTweensOf($el, { opacity: true, y: true });
                gsap.fromTo($el, { opacity: 0, y: -10 }, { duration: time, opacity: 1, y: 0, ease: 'sine', delay: delay });
                break;
            case 'fadeRight':
                gsap.killTweensOf($el, { opacity: true, x: true });
                gsap.fromTo($el, { opacity: 0, x: -10 }, { duration: time, opacity: 1, x: 0, ease: 'sine', delay: delay });
                break;
            case 'fadeLeft':
                gsap.killTweensOf($el, { opacity: true, x: true });
                gsap.fromTo($el, { opacity: 0, x: 10 }, { duration: time, opacity: 1, x: 0, ease: 'sine', delay: delay });
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
                let fText = $el.find('.fact__text span'), splitFTxt = new SplitText(fText, { type: 'words, chars' }), fImg = $el.find('.fact__image-wrap'), fArr = $el.find('.fact__icon');
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
                gsap.to($el.find('.line__bg'), { duration: 0.75, scaleX: 1, stagger: 0.1 });
                break;
            case 'scale':
                gsap.fromTo($el, { duration: 1, scaleX: 0 }, { scaleX: 1, opacity: 1, delay: delay });
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
                gsap.fromTo(words.words, { duration: 1, opacity: 0 }, { opacity: 1, stagger: stagger });
                break;
            case 'images':
                gsap.set($el, { opacity: 1 });
                gsap.fromTo($el.find('img'), { duration: 1, opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, stagger: 0.2 });
                break;
            case 'hero':
                gsap.to($el, { duration: 1, opacity: 1, pointerEvents: 'none', delay: 0.5 });
                const heroElements = $el.find('.hero-image:not(.js-tiny)');
                const tiny = $el.find('.js-tiny');
                gsap.from(tiny, { duration: 1.5, opacity: 0, stagger: -0.05, delay: 0.5 });
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
                gsap.fromTo(splittxt.chars, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.05 });
                break;
            case 'itemsFade':
                const elements = $el.find('.' + $el.data('elements') + '');
                gsap.set($el, { opacity: 1 });
                gsap.set(elements, { opacity: 0 });
                gsap.fromTo(elements, { duration: 1, opacity: 0, x: -10 }, { x: 0, opacity: 1, stagger: 0.2, delay: 0.2 });
                break;
            case 'video-text':
                const vid = $el.find('.js-col-66');
                const inf = $el.find('.js-col-33');
                gsap.set($el, { opacity: 1 });
                gsap.set([vid, inf], { opacity: 0 });
                gsap.to(vid, { duration: 1, opacity: 1, delay: 0.2 });
                gsap.fromTo(inf, { duration: 1, opacity: 0, x: -20 }, { opacity: 1, x: 0, delay: 0.4 });
                break;
            case 'heading':
                const hTitle = $el.find('.js-title'), hr = $el.find('.js-heading-hr');
                const splitTitle = new SplitText(hTitle, { type: 'words, chars' });
                gsap.set($el, { opacity: 1 });
                gsap.fromTo(splitTitle.chars, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.05 });
                gsap.fromTo(hr, { duration: 1, scaleX: 0 }, { scaleX: 1, delay: 0.5 });
                break;
            case 'titleFadeIn':
                const lead = $el.find('.js-fixed-title'), sub = $el.find('.js-sub'), arr = $el.find('.js-arr');
                gsap.from(lead, { duration: 1.5, opacity: 0, scale: 1.2, delay: 2 });
                gsap.from(sub, { duration: 1, opacity: 0, y: 30, delay: 3.2 });
                gsap.from(arr, { duration: 1, opacity: 0, y: 30, delay: 3.7 });
                break;
            case 'intro':
                const curtain = $el.find('.js-curtain');
                gsap.set($el, { opacity: 1 });
                gsap.to(curtain, { duration: 3, opacity: 0, delay: 1 });
                $('html').addClass('is-animated');
                break;
            case 'header':
                gsap.set($el, { opacity: 1 });
                const htime = $el.find('.js-time'), socialD = $el.find('.phone-hide .social__item'), shareText = $el.find('.phone-hide .social__title'), hHr = $el.find('.js-header-hr');
                gsap.fromTo([htime, shareText, socialD], { duration: 1, opacity: 0, x: -10 }, { x: 0, opacity: 1, stagger: 0.1 });
                gsap.fromTo(hHr, { scaleX: 0 }, { scaleX: 1 });
                break;
            default:
                console.warn(`animation type "${type}" does not exist`);
                break;
        }
    }
    parallax(item, sT, windowHeight, headerHeight) {
        if (item.shift) {
            const $el = item.$el;
            let y = item.y;
            const pyBottom = sT + (1 - item.start) * windowHeight;
            const pyTop = sT - item.height;
            if (y >= (pyTop + headerHeight) && y <= pyBottom) {
                const percent = (y - sT + item.height - headerHeight) / (windowHeight + item.height - headerHeight);
                y = Math.round(percent * item.shift);
                const time = !item.done ? 0 : 0.5;
                item.done = true;
                gsap.killTweensOf($el);
                gsap.to($el, {
                    duration: time,
                    y: y,
                    roundProps: ['y'],
                    ease: 'sine',
                });
            }
        }
        else if (item.type) {
            const $el = item.$el;
            const $elSticky = $el.parent().parent();
            const y = item.y;
            const pyBottom = sT + (1 - item.start) * windowHeight;
            const pyTop = sT - item.height;
            const pyTopSticky = sT - $elSticky.height();
            switch (item.type) {
                case 'hero':
                    gsap.set(item.$el, {
                        y: !Browser_1.browser.mobile ? sT * 0.5 : 0,
                    });
                    break;
                case 'fixedImage':
                    if (y >= pyTop && y <= pyBottom) {
                        if (!$el.hasClass('has-parallax')) {
                            $el.addClass('has-parallax');
                        }
                    }
                    else {
                        $el.removeClass('has-parallax');
                    }
                    break;
                case 'css-animation':
                    if (y >= (pyTop + headerHeight) && y <= pyBottom) {
                        item.$el.hasClass('animation-play') ? null : item.$el.addClass('animation-play');
                    }
                    else {
                        item.$el.removeClass('animation-play');
                    }
                    break;
                case 'relativeParallax':
                    const availableSpace = item.childHeight - item.height;
                    const maxShift = Math.min(availableSpace, item.height + headerHeight);
                    const percent = (sT - item.y + windowHeight) / (windowHeight + item.height);
                    let posY = Math.round((1 - percent) * maxShift);
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
exports.Scroll = Scroll;
Scroll.animating = false;
},{"./Breakpoint":2,"./Browser":3,"./Classes":4,"./Site":11}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Share {
    constructor() {
        this.bind();
    }
    bind() {
        $('[data-share]').on('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            let winWidth = parseInt($(e.currentTarget).attr('data-winwidth'), 10) || 520;
            let winHeight = parseInt($(e.currentTarget).attr('data-winheight'), 10) || 350;
            let winTop = (screen.height / 2) - (winHeight / 2);
            let winLeft = (screen.width / 2) - (winWidth / 2);
            const currentTarget = e.currentTarget;
            const href = currentTarget.href;
            const data = $(e.currentTarget).data('share');
            if (data === 'linkedin') {
                winWidth = 420;
                winHeight = 430;
                winTop = winTop - 100;
            }
            window.open(href, 'sharer' + data, 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
            return false;
        });
    }
}
exports.Share = Share;
},{}],11:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PushStates_1 = require("./PushStates");
const Breakpoint_1 = require("./Breakpoint");
const Scroll_1 = require("./Scroll");
const Page_1 = require("./pages/Page");
const Browser_1 = require("./Browser");
const Loader_1 = require("./Loader");
const Classes_1 = require("./Classes");
const Copy_1 = require("./Copy");
const Share_1 = require("./Share");
const Api_1 = require("./Api");
const Utils = require("./Utils");
class Site {
    constructor() {
        this.onState = () => {
            const pageChangedState = this.currentPage.onState();
            if (!pageChangedState) {
                const pushStatesLoadPromise = this.pushStates.load();
                const animateOutPromise = this.currentPage.animateOut();
                animateOutPromise.then(() => {
                    this.loader.show();
                });
                this.scroll.stop();
                const loadingPromises = [
                    pushStatesLoadPromise,
                    animateOutPromise,
                ];
                Promise.all(loadingPromises).then(this.render);
            }
        };
        this.onLoadProgress = (progress) => {
            this.loader.set(0.5 * progress);
        };
        this.onPageProgress = (progress) => {
            this.loader.set(0.5 + 0.5 * progress);
        };
        this.onPageAppend = (el) => {
            PushStates_1.PushStates.bind(el[0]);
            this.scroll.load();
        };
        this.render = () => {
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
            PushStates_1.PushStates.setTitle($('meta[property="og:title"]').attr('content'));
        };
        this.onPageLoaded = () => {
            exports.$body.removeAttr('class');
            this.loader.hide();
            Utils.enableBodyScrolling(Scroll_1.Scroll.scrollTop);
            Scroll_1.Scroll.scrollToElement(exports.$body, 0, 0);
            this.currentPage.animateIn();
            exports.$pageHeader = $('#page-header').length > 0 ? $('#page-header') : null;
            this.detectHomePage();
            PushStates_1.PushStates.setNavbarVisibility();
            Scroll_1.Scroll.scrollToPath(true);
            this.scroll.load();
            this.scroll.start();
            $('article').parent().addClass('is-loaded');
        };
        console.group();
        console.log('site');
        Site.instance = this;
        exports.pixelRatio = window.devicePixelRatio || 1;
        exports.debug = window.location.search.indexOf('debug') >= 0;
    }
    init() {
        Breakpoint_1.Breakpoint.update();
        Browser_1.Browser.update();
        exports.$doc = $(document);
        exports.$window = $(window);
        exports.$body = $('body');
        exports.$article = $('#article-main');
        exports.$main = $('#main');
        this.pushStates = new PushStates_1.PushStates();
        this.pushStates.on(PushStates_1.PushStatesEvents.CHANGE, this.onState);
        this.pushStates.on(PushStates_1.PushStatesEvents.PROGRESS, this.onLoadProgress);
        this.scroll = new Scroll_1.Scroll();
        this.loader = new Loader_1.Loader($('.js-loader'));
        this.loader.show();
        this.loader.set(0.5);
        new Copy_1.Copy();
        new Share_1.Share();
        new Api_1.API();
        Api_1.API.bind();
        Promise.all([
            this.setCurrentPage(),
            Utils.setRootVars(),
        ]).then(this.onPageLoaded);
        if (exports.debug) {
            Utils.stats();
        }
        exports.$window.on('orientationchange', () => setTimeout(() => {
            Utils.setRootVars();
        }, 100));
        exports.$window.on('resize', () => this.onResize());
    }
    onResize() {
        Breakpoint_1.Breakpoint.update();
        if (Breakpoint_1.breakpoint.desktop && !Browser_1.browser.mobile) {
            Utils.setRootVars();
        }
        const width = exports.$window.width();
        const height = exports.$window.height();
        const changed = !this.lastBreakpoint || this.lastBreakpoint.value !== Breakpoint_1.breakpoint.value;
        this.lastBreakpoint = Breakpoint_1.breakpoint;
        if (this.currentPage) {
            this.currentPage.resize(width, height, Breakpoint_1.breakpoint, changed);
        }
        this.loader.resize(width, height);
        this.scroll.resize();
    }
    preloadAssets() {
        let assets = [];
        let il = imagesLoaded('.preload-bg', {
            background: true,
        });
        if (assets && assets.length > 0) {
            for (let i = 0; i < assets.length; ++i) {
                il.addBackground(assets[i], null);
            }
        }
        return new Promise((resolve, reject) => {
            il.jqDeferred.always(() => {
                resolve();
            });
        });
    }
    detectHomePage() {
        exports.$pageHeader ? exports.$body.addClass('is-home-page') : null;
    }
    setCurrentPage() {
        let $pageEl = $('[data-page]'), pageName = $pageEl.data('page') || 'Page', pageOptions = $pageEl.data('options');
        console.log($pageEl, pageName);
        if (pageName === undefined) {
            if (pageName !== 'undefined') {
                console.warn('There is no "%s" in Pages!', pageName);
            }
            pageName = 'Page';
        }
        if ($pageEl.length > 1) {
            console.warn('Only one [data-page] element, please!');
        }
        else if ($pageEl.length === 0) {
            $pageEl = $($('#main').find('article')[0] || $('#main').children().first()[0]);
        }
        let page = new Classes_1.pages[pageName]($pageEl, pageOptions);
        this.currentPage = page;
        Api_1.API.bind();
        page.on(Page_1.PageEvents.PROGRESS, this.onPageProgress);
        page.on(Page_1.PageEvents.CHANGE, this.onPageAppend);
        this.onResize();
        return page.preload();
    }
}
exports.Site = Site;
$(document).ready(() => {
    exports.site = new Site();
    exports.site.init();
});
},{"./Api":1,"./Breakpoint":2,"./Browser":3,"./Classes":4,"./Copy":5,"./Loader":7,"./PushStates":8,"./Scroll":9,"./Share":10,"./Utils":12,"./pages/Page":24}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Browser_1 = require("./Browser");
const Breakpoint_1 = require("./Breakpoint");
const Site_1 = require("./Site");
function generateUID() {
    return '' + (new Date()).getTime() + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}
exports.generateUID = generateUID;
exports.keys = {
    enter: 13,
    esc: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
};
function testAutoplay() {
    return new Promise((resolve) => {
        if (typeof Modernizr.videoautoplay !== undefined) {
            resolve(Modernizr.videoautoplay);
        }
        else {
            Modernizr.on('videoautoplay', () => {
                resolve(Modernizr.videoautoplay);
            });
        }
    });
}
exports.testAutoplay = testAutoplay;
function parseToTime(sec) {
    const totalSec = parseInt('' + sec, 10);
    const hours = parseInt('' + totalSec / 3600, 10) % 24;
    const minutes = parseInt('' + totalSec / 60, 10) % 60;
    const seconds = totalSec % 60;
    const hrsDisplay = (hours < 10 ? '0' + hours : hours) + ':';
    return (hours > 0 ? hrsDisplay : '') + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
}
exports.parseToTime = parseToTime;
function stats() {
    const stats = new Stats();
    stats.showPanel(0);
    $(stats.dom).css({ 'pointer-events': 'none', 'top': 110 });
    document.body.appendChild(stats.dom);
    function animate() {
        stats.begin();
        stats.end();
        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    return stats;
}
exports.stats = stats;
function timeFormat(time) {
    let minutes = Math.floor(time / 60).toString();
    minutes = (parseInt(minutes, 10) >= 10) ? minutes : '0' + minutes;
    let seconds = Math.floor(time % 60).toString();
    seconds = (parseInt(seconds, 10) >= 10) ? seconds : '0' + seconds;
    return minutes.toString() + ':' + seconds.toString();
}
exports.timeFormat = timeFormat;
function updateImageSources() {
    if (Browser_1.browser.ie) {
        $('[data-iesrc]').each((i, img) => {
            img.setAttribute('src', img.getAttribute('data-iesrc'));
            img.removeAttribute('data-iesrc');
        });
    }
    $('[data-src]').each((i, img) => {
        img.setAttribute('src', img.getAttribute('data-src'));
        img.removeAttribute('data-src');
    });
    $('[data-srcset]').each((i, img) => {
        img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.removeAttribute('data-srcset');
    });
}
exports.updateImageSources = updateImageSources;
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
exports.shuffle = shuffle;
function setRootVars() {
    const headerHeight = Breakpoint_1.breakpoint.desktop ? $('#navbar').height() : 0;
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight - headerHeight}px`);
    document.documentElement.style.setProperty('--col-25', `${$('.col-pattern-25').width()}px`);
    document.documentElement.style.setProperty('--col-66', `${$('.col-66').width()}px`);
    let marg = !Breakpoint_1.breakpoint.desktop ? 50 : 120;
    $('.aside').css('height', Site_1.$window.height() + marg);
}
exports.setRootVars = setRootVars;
function enableBodyScrolling(sT) {
    $('body').removeAttr('style');
    $('body').removeClass('scrolling-disable');
    window.scrollTo(0, sT);
}
exports.enableBodyScrolling = enableBodyScrolling;
function disableBodyScrolling(sT) {
    let position = Browser_1.browser.ie ? 'absolute' : 'fixed';
    let top = Browser_1.browser.ie ? '' : -sT + 'px';
    $('body').addClass('scrolling-disable');
    $('body').css({
        'overflow': 'hidden',
        'will-change': 'top',
        'width': '100%',
        'touch-action': 'none',
    });
}
exports.disableBodyScrolling = disableBodyScrolling;
exports.translations = {
    'invalid-email': {
        'en': 'Invalid email address format',
        'pl': 'Niepoprawny format adresu e-mail',
    },
    'required-field': {
        'en': 'Required field',
        'pl': 'Pole obowiązkowe',
    },
    'invalid-zip': {
        'en': 'Enter zip-code in five digits format',
        'pl': 'Wpisz kod pocztowy w formacie XX-XXX',
    },
};
},{"./Breakpoint":2,"./Browser":3,"./Site":11}],13:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
class Chart extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.margin = {
            top: 5,
            left: 25,
            right: 50,
            bottom: 49
        };
        this.graph = {
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: 0,
            width: 0,
        };
        this.colors = {
            gray: 'rgba(97,97,97,0.5)',
            orange: '#fc8c59',
            mint: '#4fdbc5',
            blue: '#5877cc',
            pink: '#B60E63',
            white: '#fff',
            beige: '#fdd49e',
            cinnabar: '#e75040',
            sea: '#26bbe3',
        };
        this.graphsData = [];
        this.resize = (wdt, hgt, breakpoint, bpChanged) => {
            this.canvas.width = this.$wrapper.width();
            this.canvas.height = this.$wrapper.height();
            this.graph = {
                top: this.margin.top,
                left: this.margin.left,
                right: this.canvas.width - this.margin.right + this.margin.left,
                bottom: this.canvas.height - this.margin.bottom,
                height: this.canvas.height - this.margin.top - this.margin.bottom,
                width: this.canvas.width - this.margin.left - this.margin.right,
            };
            this.draw();
            this.createDataObject();
        };
        this.onClickTab = (e) => {
            const current = $(e.currentTarget);
            current.hasClass('is-on-chart') ? current.removeClass('is-on-chart') : current.addClass('is-on-chart');
            if (current.hasClass('is-on-chart')) {
                this.animateChart(current.index(), false);
            }
            else {
                this.animateChart(current.index(), true);
            }
        };
        this.draw = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawBg();
            this.graphsData.forEach((graphData) => this.drawGraph(graphData));
        };
        this.drawGraph = (data) => {
            this.ctx.strokeStyle = data.color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.beginPath();
            data.yPx.forEach((y, i, a) => {
                if (i / a.length >= data.xPercent) {
                    this.ctx.lineTo(this.graph.right / a.length * i + this.graph.left, y);
                    this.ctx.stroke();
                }
            });
            this.ctx.closePath();
        };
        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');
        this.bind();
    }
    createDataObject() {
        this.$tab.each((i, el) => {
            const dataItem = {
                xPercent: 0,
                yPoints: $(el).data('points'),
                color: this.setColor($(el).data('color')),
                yPx: this.calcYPx($(el).data('points')),
            };
            this.graphsData.push(dataItem);
        });
        console.log(this.graphsData);
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }
    drawBg() {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.white;
        this.ctx.moveTo(this.margin.left, this.canvas.height - this.margin.bottom);
        this.ctx.lineTo(this.canvas.width - this.margin.right, this.canvas.height - this.margin.bottom);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.colors.gray;
        this.ctx.moveTo(this.margin.left, this.margin.top);
        this.ctx.lineTo(this.canvas.width - this.margin.right, this.margin.top);
        this.ctx.stroke();
        const helpersLine = 8;
        const textTransform = 5;
        const step = 5;
        let val;
        const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021];
        for (let i = 0; i <= helpersLine; i++) {
            val = 50 - step * i;
            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.blue;
            this.ctx.fillText('' + val + '', 0, (this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.moveTo(this.margin.left, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.lineTo(this.canvas.width - this.margin.right, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.stroke();
        }
        for (let j = 0; j < years.length; j++) {
            this.ctx.beginPath();
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.white;
            this.ctx.fillText('' + years[j] + '', (this.canvas.width + this.margin.right + this.margin.left) / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
            this.ctx.stroke();
        }
    }
    animateChart(id, direction) {
        const dir = direction ? 1 : 0;
        gsap.to(this.graphsData[id], {
            xPercent: dir,
            ease: 'power2',
            onUpdate: this.draw,
        });
    }
    largestYVal(data) {
        let largest = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] > largest) {
                largest = data[i];
            }
        }
        return largest;
    }
    calcYPx(data) {
        const largest = this.largestYVal(data);
        let arr = [];
        for (let i = 0; i < data.length; i++) {
            let item = Math.round((this.graph.height - data[i] / largest * this.graph.height) + this.graph.top);
            arr.push(item);
        }
        return arr;
    }
    setColor(color) {
        let hex;
        for (const property in this.colors) {
            if (color === property) {
                hex = this.colors[property];
            }
        }
        return hex;
    }
}
exports.Chart = Chart;
},{"./Component":14}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handler_1 = require("../Handler");
class ComponentEvents {
}
exports.ComponentEvents = ComponentEvents;
ComponentEvents.CHANGE = 'change';
class Component extends Handler_1.Handler {
    constructor(view, options) {
        super();
        this.view = view;
        this.options = options;
        this.resize = (wdt, hgt, breakpoint, bpChanged) => { };
        if (!view[0]) {
            console.warn('component built without view');
        }
        this.view.data('comp', this);
    }
    preloadImages() {
        return [];
    }
    onState() {
        return false;
    }
    animateIn(index, delay) { }
    animateOut() {
        return Promise.resolve(null);
    }
    turnOff() { }
    turnOn() { }
    destroy() {
        this.view.data('comp', null);
        this.view.off();
        super.destroy();
    }
}
exports.Component = Component;
},{"../Handler":6}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
class Dashboard extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.resize = (wdt, hgt, breakpoint, bpChanged) => {
        };
        this.togglePanel = (e) => {
            if (!this.isToggled) {
                gsap.to(this.$body, { duration: 0.5, height: 'auto', ease: 'power2.inOut',
                    onComplete: () => {
                        this.$body.addClass('is-toggled');
                        this.isToggled = true;
                    },
                });
            }
            else {
                this.$body.removeClass('is-toggled');
                gsap.to(this.$body, { duration: 0.5, height: '0', ease: 'power2.inOut',
                    onComplete: () => {
                        this.isToggled = false;
                    },
                });
            }
        };
        this.$toggle = this.view.find('.js-button-toggle');
        this.$body = this.view.find('.js-dashboard-body');
        this.bind();
        this.initialState();
    }
    bind() {
        this.$toggle.off('.toggle').on('click.toggle', this.togglePanel);
    }
    initialState() {
        gsap.set(this.$body, { height: '0' });
    }
}
exports.Dashboard = Dashboard;
},{"./Component":14}],16:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
class Dropdown extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.isOpen = false;
        this.toggle = (e) => {
            console.log('toggle dp');
            this.isOpen ? this.closeSelect() : this.openSelect(e);
        };
        this.onClickAnywhereHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log(this.isOpen, '?????');
            if ($(e.currentTarget).hasClass('js-item') && !this.isOpen) {
                return;
            }
            if ($(e.target).closest(this.view).length <= 0) {
                this.closeSelect();
            }
        };
        this.onItemClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const current = $(e.currentTarget).data('value');
            this.closeSelect();
            this.$selected.html(current);
            this.view.attr('data-selected', current);
        };
        this.$trigger = this.view.find('.js-trigger');
        this.$selected = this.view.find('[data-select]');
        this.$item = this.view.find('[data-value]');
        this.bind();
        this.view.attr('data-selected', this.$selected.text());
    }
    bind() {
        this.view.off('.select').on('click.select', this.toggle);
        Site_1.$doc.off('.dropdown').on('click.dropdown', this.onClickAnywhereHandler);
        this.$item.off('.selection').on('click.selection', this.onItemClick);
    }
    openSelect(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!this.isOpen) {
            this.view.addClass('is-open');
            this.isOpen = true;
        }
    }
    closeSelect() {
        console.log(this.isOpen, 'open?');
        if (this.isOpen) {
            this.view.removeClass('is-open');
            this.isOpen = false;
        }
    }
}
exports.Dropdown = Dropdown;
},{"../Site":11,"./Component":14}],17:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
class Filters extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.filters = [];
        this.resize = (wdt, hgt, breakpoint, bpChanged) => {
            setTimeout(() => {
                this.$clear.css('height', this.$panel.outerHeight());
            });
        };
        this.markAllSectors = () => {
            const timeChecked = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;
            this.clearArray();
            this.$itemSector.each((i, el) => {
                this.addElementToArray($(el), this.filters);
            });
            this.$allSectors.addClass('is-active');
            this.isAllChecked = true;
            if (timeChecked) {
                this.addElementToArray(timeChecked, this.filters);
                this.markTimeline(timeChecked);
            }
        };
        this.clearArray = () => {
            this.filters = [];
            this.$itemTime.removeClass('is-active');
            this.$itemSector.removeClass('is-active');
            this.$allSectors.removeClass('is-active');
            this.isAllChecked = false;
            this.unmarkTimeline();
        };
        this.toggleSector = (e) => {
            const current = $(e.currentTarget);
            if (current.hasClass('is-active')) {
                this.removeElementFromArray(current, this.filters);
                if (this.isAllChecked) {
                    this.$allSectors.removeClass('is-active');
                    this.isAllChecked = false;
                }
            }
            else {
                this.addElementToArray(current, this.filters);
            }
        };
        this.toggleTime = (e) => {
            const current = $(e.currentTarget);
            this.unmarkTimeline();
            if (current.hasClass('is-active')) {
                this.removeElementFromArray(current, this.filters);
            }
            else {
                const activePrev = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;
                if (activePrev) {
                    this.removeElementFromArray(activePrev, this.filters);
                }
                this.addElementToArray(current, this.filters);
                this.markTimeline(current);
            }
        };
        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');
        this.$allSectors = this.view.find('.js-item-all');
        this.bind();
    }
    bind() {
        this.$itemSector.off('.sector').on('click.sector', this.toggleSector);
        this.$itemTime.off('.time').on('click.time', this.toggleTime);
        this.$clear.off('.clear').on('click.clear', this.clearArray);
        this.$allSectors.off('.all').on('click.all', this.markAllSectors);
    }
    markTimeline(el) {
        if (el.hasClass('js-time')) {
            this.$timelineItem.removeClass('is-active');
            const timelinedot = this.$timelineItem.filter('[data-time=' + el.data('item') + ']');
            timelinedot.addClass('is-active');
        }
    }
    unmarkTimeline() {
        this.$timelineItem.removeClass('is-active');
    }
    removeElementFromArray($el, array) {
        const index = this.filters.indexOf($el.data('item'));
        if (index > -1) {
            array.splice(index, 1);
            $el.removeClass('is-active');
        }
        console.log('FILTERS:', this.filters);
    }
    addElementToArray($el, array) {
        array.push($el.data('item'));
        $el.addClass('is-active');
        console.log('FILTERS:', this.filters);
    }
}
exports.Filters = Filters;
},{"./Component":14}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
class Masonry extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.data = [];
        this.dataArray = [];
        this.itemMargin = 3;
        this.gridRows = 20;
        this.gridCols = 20;
        this.gridCells = this.gridCols * this.gridRows;
        this.cellsBalance = this.gridCells;
        this.gridCell = {
            width: this.view.width() / this.gridCols,
            height: this.view.height() / this.gridRows,
        };
        this.minCellWidth = 3;
        this.minCellHeight = 3;
        this.itemPositioning = [];
        this.resize = (wdt, hgt, breakpoint, bpChanged) => {
        };
        this.$item = this.view.find('.js-masonry-tile');
        this.$item.each((i, el) => {
            const dataItem = {
                sector: $(el).data('tile'),
                value: $(el).data('value'),
                color: $(el).data('color'),
            };
            this.data.push(dataItem);
        });
        this.area = (this.view.width() - this.itemMargin * 3) * this.view.height();
        this.bind();
    }
    bind() {
        this.getArrFromObject();
    }
    getArrFromObject() {
        this.dataArray = Object.entries(this.data).sort((a, b) => a[0].localeCompare(b[0]));
        this.dataArray.forEach((el, i) => {
            const value = el[1].value;
            const sector = el[1].sector;
            const color = el[1].color;
            const index = i;
        });
    }
    setTileSize(sector, value, color, index) {
        const current = this.$item.filter('[data-tile=' + sector + ']');
        let area, h, w, t, l, column_start, column_end, row_start, row_end, item, areaGrid;
        area = this.area * (value / 100);
        if (index === 0) {
            column_start = 1;
            row_start = 1;
            row_end = this.gridRows;
            column_end = Math.round(area / (this.gridCell.height * row_end) / this.gridCell.width);
            areaGrid = Math.round(area / (this.gridCell.width * this.gridCell.height));
            areaGrid = areaGrid % 2 === 0 ? areaGrid : areaGrid - 1;
        }
        item = {
            column_start: column_start,
            column_end: column_end,
            row_start: row_start,
            row_end: row_end,
        };
        current.css({
            position: 'relative',
            opacity: 1,
            'grid-column-start': column_start,
            'grid-column-end': column_end,
            'grid-row-start': row_start,
            'grid-row-end': 'span' + row_end,
            backgroundColor: color,
        });
        this.itemPositioning.push(item);
        this.cellsBalance = this.cellsBalance - areaGrid;
    }
}
exports.Masonry = Masonry;
},{"./Component":14}],19:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
class Range extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.isOpen = false;
        this.toggle = (e) => {
            this.isOpen ? this.closeSelect() : this.openSelect(e);
        };
        this.onClickAnywhereHandler = (e) => {
            if ($(e.currentTarget).hasClass('js-item') || !this.isOpen) {
                return;
            }
            if ($(e.target).closest(this.view).length <= 0) {
                this.closeSelect();
            }
        };
        this.onItemClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            const current = $(e.currentTarget).attr('value');
            this.closeSelect();
            this.$selected.html(current);
            this.$selected.attr('data-selected', current);
        };
        this.$trigger = this.view.find('.js-trigger');
        this.$selected = this.view.find('[data-selected]');
        this.$radio = this.view.find('input[type=radio]');
        this.bind();
    }
    bind() {
        this.$trigger.off('.toggle').on('click.toggle', this.toggle);
        Site_1.$doc.off('.smalldropdown').on('click.smalldropdown', this.onClickAnywhereHandler);
        this.$radio.off('.selection').on('click.selection', this.onItemClick);
    }
    openSelect(e) {
        e.stopPropagation();
        e.preventDefault();
        if (!this.isOpen) {
            this.view.addClass('is-open');
            this.isOpen = true;
        }
    }
    closeSelect() {
        console.log(this.isOpen, 'open?');
        if (this.isOpen) {
            this.view.removeClass('is-open');
            this.isOpen = false;
        }
    }
}
exports.Range = Range;
},{"../Site":11,"./Component":14}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Site_1 = require("../Site");
const Breakpoint_1 = require("../Breakpoint");
const Component_1 = require("./Component");
const Swipe_1 = require("./Swipe");
class Slider extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.offset = 0;
        this.index = 1;
        this.margin = 32;
        this.resize = (wdt, hgt, breakpoint, bpChanged) => {
            if (breakpoint.phone && (this.settings.type === 'phone-disable' || this.settings.phone === 'disabled')) {
                return;
            }
            this.itemWidth = this.$item.width() + this.margin;
            let width = this.itemWidth * this.$item.length;
            this.$list.css('width', width);
            this.go(this.index);
        };
        this.onSwipe = (e) => {
            if (e.direction === 'left' || e.direction === 'right') {
                this.shift({
                    left: +1, right: -1,
                }[e.direction]);
            }
        };
        this.$item = this.view.find('.js-item');
        this.$list = this.view.find('.js-list');
        this.$buttonPrev = this.view.find('.js-prev');
        this.$buttonNext = this.view.find('.js-next');
        this.$dot = this.view.find('.js-dot');
        this.margin = this.$item.outerWidth(true) - this.$item.width();
        this.itemWidth = this.$item.width() + this.margin;
        this.settings = $.extend({
            type: '',
        }, options || view.data('options') || {});
        if (Breakpoint_1.breakpoint.phone && (this.settings.type === 'phone-disable' || this.settings.phone === 'disabled')) {
            return;
        }
        if (!Breakpoint_1.breakpoint.desktop && this.settings.mode === 'center-mobile') {
            this.settings.mode = 'center';
        }
        if (Breakpoint_1.breakpoint.tablet && this.settings.mode === 'center-tablet') {
            this.settings.mode = 'center';
        }
        this.init();
        this.bind();
        const swipeEl = Breakpoint_1.breakpoint.desktop ? this.$list : this.$item.first();
        this.swipe = new Swipe_1.Swipe(this.$list, {
            horizontal: true,
            vertical: false,
            minimum: 80,
            disableMouse: false,
            disableTouch: false,
        });
        this.swipe.on(Swipe_1.SwipeEvents.END, this.onSwipe);
    }
    init() {
        gsap.set(this.$list, { x: this.offset });
        this.setActiveItems();
        this.resizeDots();
        if (this.settings.mode === 'center' && this.$item.length > 2) {
            this.index = 2;
            this.go(2);
        }
    }
    bind() {
        this.$buttonPrev.off('.slidercustom').on('click.slidercustom', (e) => this.prev());
        this.$buttonNext.off('.slidercustom').on('click.slidercustom', (e) => this.next());
        this.$dot.off('.slidercustom').on('click.slidercustom', (e) => this.clickElement(e));
        this.$item.off('.slidercustom').on('click.slidercustom', (e) => this.clickElement(e));
    }
    resizeDots() {
        if (!this.$dot) {
            return;
        }
        if (this.$dot.length > 7) {
            this.$dot.each(el => {
                $(el).css({
                    'width': '10px',
                    'height': '10px',
                    'margin-left': '3px',
                    'margin-right': '3px'
                });
            });
        }
    }
    shift(dir) {
        let old;
        if (dir === -1) {
            this.prev();
        }
        else {
            this.next();
        }
    }
    clickElement(e) {
        e.stopPropagation();
        console.log($(e.target));
        if ($(e.target).hasClass('share__button') || $(e.target).hasClass('evaluation') || $(e.target).hasClass('slider__item-footer')) {
            return;
        }
        let el = $(e.currentTarget);
        let i = el.index() + 1;
        this.index = i;
        this.go(this.index);
    }
    next() {
        if (this.index < this.$item.length) {
            this.index = this.index + 1;
            this.go(this.index);
        }
    }
    prev() {
        if (this.index > 1) {
            this.index = this.index - 1;
            this.go(this.index);
        }
    }
    go(index) {
        let x = (index * this.itemWidth) - this.itemWidth;
        x = this.settings.mode === 'center' ? (x - (Site_1.$window.width() * 0.5) - this.margin) + this.itemWidth * 0.5 : x;
        gsap.to(this.$list, { duration: 0.5, x: -x, transformOrigin: '50% 50%', ease: 'sine.inOut', onComplete: () => { } });
        this.setActiveItems();
    }
    setActiveItems() {
        this.setNavAvailbility();
        this.$item.removeClass('is-active');
        this.$item.eq(this.index - 1).addClass('is-active');
        this.$dot.removeClass('is-active');
        this.$dot.eq(this.index - 1).addClass('is-active');
        this.setInViewItemClass();
    }
    setInViewItemClass() {
        if (!Breakpoint_1.breakpoint.phone && this.settings.type === 'article') {
            this.$item.removeClass('is-in-view');
            this.$item.filter('.is-active').next().addClass('is-in-view');
        }
    }
    setNavAvailbility() {
        switch (true) {
            case this.index == 1:
                this.$buttonPrev.addClass('is-disabled');
                this.$buttonNext.removeClass('is-disabled');
                break;
            case this.index === this.$item.length:
                this.$buttonNext.addClass('is-disabled');
                this.$buttonPrev.removeClass('is-disabled');
                break;
            default:
                this.$buttonNext.removeClass('is-disabled');
                this.$buttonPrev.removeClass('is-disabled');
        }
    }
}
exports.Slider = Slider;
},{"../Breakpoint":2,"../Site":11,"./Component":14,"./Swipe":22}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
class Stats extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.switchTab = (e) => {
            const current = $(e.currentTarget);
            const index = current.data('tab');
            this.setActiveView(index);
        };
        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');
        this.bind();
        this.setActiveView(2);
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.switchTab);
    }
    setActiveView(index) {
        this.$tab.removeClass('is-active');
        this.$item.removeClass('is-active');
        this.$tab.filter('[data-tab=' + index + ']').addClass('is-active');
        this.$item.filter('[data-view=' + index + ']').addClass('is-active');
        Site_1.$window.resize();
    }
}
exports.Stats = Stats;
},{"../Site":11,"./Component":14}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handler_1 = require("../Handler");
const Utils = require("../Utils");
const Site_1 = require("../Site");
class SwipeEvents {
}
exports.SwipeEvents = SwipeEvents;
SwipeEvents.START = 'start';
SwipeEvents.UPDATE = 'update';
SwipeEvents.END = 'end';
class SwipeAxes {
}
exports.SwipeAxes = SwipeAxes;
SwipeAxes.HORIZONTAL = 'h';
SwipeAxes.VERTICAL = 'v';
class SwipeDirections {
}
exports.SwipeDirections = SwipeDirections;
SwipeDirections.LEFT = 'left';
SwipeDirections.RIGHT = 'right';
SwipeDirections.UP = 'up';
SwipeDirections.DOWN = 'down';
SwipeDirections.NONE = 'none';
SwipeDirections.CLICK = 'click';
class Swipe extends Handler_1.Handler {
    constructor(view, options) {
        super();
        this.view = view;
        this.options = options;
        this.swiping = false;
        this.deltaX = 0;
        this.deltaY = 0;
        this.x = 0;
        this.y = 0;
        this.startX = 0;
        this.startY = 0;
        this.mouse = { x: 0, y: 0 };
        this.dragged = false;
        this.axe = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.disabled = false;
        this.onMouseDown = (e) => {
            e.stopPropagation();
            if ((e.which && e.which === 3) || (e.button && e.button === 2)) {
                return;
            }
            e.preventDefault();
            this.mouse.startX = (e.clientX || e.pageX) - this.offsetX;
            this.mouse.startY = (e.clientY || e.pageY) - this.offsetY;
            this.startSwipe();
        };
        this.onMouseMove = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!!this.swiping) {
                this.mouse.x = (e.clientX || e.pageX) - this.offsetX;
                this.mouse.y = (e.clientY || e.pageY) - this.offsetY;
                let diffX = Math.abs(this.mouse.x - this.mouse.startX);
                let diffY = Math.abs(this.mouse.y - this.mouse.startY);
                if (!this.axe && (diffX > 12 || diffY > 12)) {
                    this.axe = diffX > diffY ? SwipeAxes.HORIZONTAL : SwipeAxes.VERTICAL;
                }
                if (diffX > 12 || diffY > 12) {
                    this.dragged = true;
                }
                if ((this.axe === SwipeAxes.HORIZONTAL && !!this.settings.horizontal) || (this.axe === SwipeAxes.VERTICAL && !!this.settings.vertical)) {
                    e.preventDefault();
                    this.updateSwipe();
                }
            }
        };
        this.onMouseUp = (e) => {
            if (!!this.swiping) {
                e.preventDefault();
                e.stopPropagation();
                this.endSwipe();
                return false;
            }
            this.view.find('a').css({ 'pointer-events': '' });
            this.axe = null;
        };
        this.onTouchStart = (e) => {
            this.mouse.startX = e.originalEvent.touches[0].pageX;
            this.mouse.startY = e.originalEvent.touches[0].pageY;
            this.startSwipe();
        };
        this.onTouchMove = (e) => {
            if (!!this.swiping) {
                this.mouse.x = e.originalEvent.touches[0].pageX;
                this.mouse.y = e.originalEvent.touches[0].pageY;
                let diffX = Math.abs(this.mouse.x - this.mouse.startX);
                let diffY = Math.abs(this.mouse.y - this.mouse.startY);
                if (!this.axe && (diffX > 12 || diffY > 12)) {
                    this.axe = diffX > diffY ? SwipeAxes.HORIZONTAL : SwipeAxes.VERTICAL;
                }
                if (diffX > 12 || diffY > 12) {
                    this.dragged = true;
                }
                if ((this.axe === SwipeAxes.HORIZONTAL && !!this.settings.horizontal) || (this.axe === SwipeAxes.VERTICAL && !!this.settings.vertical)) {
                    this.updateSwipe();
                }
                else if (this.axe) {
                    this.swiping = false;
                }
            }
        };
        this.onTouchEnd = (e) => {
            e.stopPropagation();
            if (!!this.swiping) {
                this.endSwipe();
            }
            this.axe = null;
        };
        this.settings = $.extend({
            horizontal: true,
            vertical: false,
            minimum: 80,
            disableMouse: false,
            disableTouch: false,
            handler: null,
        }, options || {});
        this.swiping = false;
        this.$handler = (this.settings.handler ? $(this.settings.handler) : this.view);
        this.updateCursor();
        this.uid = Utils.generateUID();
        this.bind();
    }
    destroy() {
        super.destroy();
        this.unbind();
    }
    toggle(enable) {
        this.disabled = !enable;
        this.updateCursor();
    }
    end() {
        if (!!this.swiping) {
            this.endSwipe();
            this.axe = null;
        }
    }
    resize() {
        const sT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.offsetX = this.view.offset().left;
        this.offsetY = this.view.offset().top - sT;
    }
    updateCursor() {
        let isMouseDisabled = !Modernizr.touchevents && !!this.settings.disableMouse;
        this.$handler.toggleClass('is-grabbable', !this.disabled && !isMouseDisabled);
    }
    bind() {
        this.view.off('.swipe');
        if (!this.settings.disableMouse) {
            this.$handler
                .on('mousedown.swipe', this.onMouseDown);
            this.view
                .on('mousemove.swipe', this.onMouseMove)
                .on('mouseup.swipe', this.onMouseUp)
                .on('mouseleave.swipe', this.onMouseUp);
        }
        if (!this.settings.disableTouch) {
            this.$handler
                .on('touchstart.swipe', this.onTouchStart);
            this.view
                .on('touchmove.swipe', this.onTouchMove);
            Site_1.$doc
                .off('.swipe' + this.uid)
                .on('touchend.swipe' + this.uid, this.onTouchEnd);
        }
    }
    unbind() {
        this.view.off('.swipe');
        Site_1.$doc.off('.swipe' + this.uid);
    }
    startSwipe() {
        if (!this.disabled) {
            this.swiping = true;
            this.dragged = false;
            this.startX = 0;
            this.startY = 0;
            this.axe = null;
            this.trigger(SwipeEvents.START, {
                target: this.view[0],
                x: this.mouse.startX - this.view.offset().left,
                y: this.mouse.startY - this.view.offset().top,
                instance: this,
            });
            this.$handler.addClass('is-grabbed');
        }
    }
    updateSwipe() {
        let x = this.startX + this.mouse.x - this.mouse.startX, y = this.startY + this.mouse.y - this.mouse.startY;
        this.x = x;
        this.y = y;
        this.trigger(SwipeEvents.UPDATE, {
            target: this.view[0],
            deltaX: !!this.settings.horizontal ? x : 0,
            deltaY: !!this.settings.vertical ? y : 0,
            x: this.mouse.x,
            y: this.mouse.y,
            instance: this,
        });
        this.$handler.addClass('is-dragged');
    }
    endSwipe() {
        this.swiping = false;
        let direction = this.axe === SwipeAxes.HORIZONTAL ? (this.x < this.startX ? SwipeDirections.LEFT : SwipeDirections.RIGHT) : (this.y < this.startY ? SwipeDirections.UP : SwipeDirections.DOWN);
        direction = this.axe === SwipeAxes.HORIZONTAL && Math.abs(this.mouse.x - this.mouse.startX) < this.settings.minimum ? SwipeDirections.NONE : direction;
        direction = this.axe === SwipeAxes.VERTICAL && Math.abs(this.mouse.y - this.mouse.startY) < this.settings.minimum ? SwipeDirections.NONE : direction;
        direction = this.axe === null ? SwipeDirections.NONE : direction;
        direction = direction === SwipeDirections.NONE && !this.dragged ? SwipeDirections.CLICK : direction;
        this.trigger(SwipeEvents.END, {
            target: this.view[0],
            direction: direction,
            instance: this,
        });
        this.$handler.removeClass('is-grabbed is-dragged');
    }
}
exports.Swipe = Swipe;
},{"../Handler":6,"../Site":11,"../Utils":12}],23:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
class Tooltip extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.onMouseEnter = () => {
            if (!this.isOpen) {
                this.open();
            }
        };
        this.onMouseLeave = () => {
            if (this.isOpen) {
                this.close();
            }
        };
        this.onButtonClickHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
            if (!this.isOpen) {
                this.open();
            }
            else {
                this.close();
            }
        };
        this.onClickAnywhereHandler = (e) => {
            if ($(e.target).closest(this.view).length <= 0) {
                this.close();
            }
        };
        this.$button = this.view.find('.js-toggle');
        this.$close = this.view.find('.js-close').length > 0 ? this.view.find('.js-close') : null;
        this.bind();
    }
    bind() {
        this.$button.on('click.tooltip', this.onButtonClickHandler);
        this.view
            .off('mouseon').on('mouseenter.mouseon', this.onMouseEnter)
            .off('mouseoff').on('mouseleave.mouseoff', this.onMouseLeave);
        Site_1.$doc.on('click.tooltip', this.onClickAnywhereHandler);
        if (this.$close) {
            this.$close.on('click.tooltip', () => this.close());
        }
    }
    open() {
        this.isOpen = true;
        setTimeout(() => {
            this.view.addClass('is-open');
        }, 250);
        if (this.view.closest('.header').length > 0) {
            this.view.closest('.header').addClass('is-toggled-share');
        }
        setTimeout(() => {
            if (this.isOpen) {
                this.close();
            }
        }, 3000);
    }
    close() {
        this.isOpen = false;
        this.view.removeClass('is-open');
        if (this.view.closest('.header').length > 0) {
            this.view.closest('.header').removeClass('is-toggled-share');
        }
    }
}
exports.Tooltip = Tooltip;
},{"../Site":11,"./Component":14}],24:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Handler_1 = require("../Handler");
const Component_1 = require("../components/Component");
const Classes_1 = require("../Classes");
const Site_1 = require("../Site");
class PageEvents {
}
exports.PageEvents = PageEvents;
PageEvents.PROGRESS = 'progress';
PageEvents.COMPLETE = 'complete';
PageEvents.CHANGE = 'append';
class Page extends Handler_1.Handler {
    constructor(view, options) {
        super();
        this.view = view;
        this.components = [];
        this.onComponentChange = (el) => {
            this.buildComponents(el.filter('[data-component]').add(el.find('[data-component]')));
            this.trigger(PageEvents.CHANGE, el);
        };
        this.view.css({ opacity: 0 });
        this.components = [];
        this.buildComponents(this.view.parent().find('[data-component]'));
    }
    preload() {
        let il = imagesLoaded(this.view.find('.preload').toArray(), { background: true });
        let images = [];
        for (let component of this.components) {
            images = images.concat(component.preloadImages());
        }
        for (let url of images) {
            il.addBackground(url, null);
        }
        return new Promise((resolve, reject) => {
            this.loader = il.jqDeferred;
            this.loader.progress((instance, image) => {
                let progress = instance.progressedCount / instance.images.length;
                this.trigger(PageEvents.PROGRESS, progress);
            }).always(() => {
                this.trigger(PageEvents.COMPLETE);
                resolve();
            });
        });
    }
    onState() {
        let changed = !!false;
        for (let component of this.components) {
            const componentChanged = component.onState();
            if (!changed && !!componentChanged) {
                changed = true;
            }
        }
        return changed;
    }
    animateIn(delay) {
        const bg = $('#backgrounds-fixed');
        gsap.to(bg, { duration: 0.5, opacity: 1, display: 'block' });
        for (let i = 0; i < this.components.length; ++i) {
            this.components[i].animateIn(i, delay);
        }
        gsap.to(this.view, {
            duration: 0.4,
            opacity: 1,
            onComplete: () => {
                gsap.to(bg, { duration: 0.5, opacity: 1, display: 'block' });
            }
        });
    }
    animateOut() {
        const bg = $('#backgrounds-fixed');
        Site_1.$main.removeClass('is-loaded');
        gsap.set(bg, { opacity: 0, display: 'none' });
        let pageAnimationPromise = new Promise((resolve, reject) => {
            gsap.to(this.view, {
                duration: 0.4,
                onComplete: () => {
                    resolve();
                    Site_1.$body.removeAttr('class');
                },
                opacity: 0,
            });
        });
        let componentAnimations = this.components.map((obj) => {
            return obj.animateOut();
        });
        return new Promise((resolve, reject) => {
            let allPromises = componentAnimations.concat(pageAnimationPromise);
            Promise.all(allPromises).then((results) => {
                resolve();
            });
        });
    }
    turnOff() {
        this.callAll('turnOff');
    }
    turnOn() {
        this.callAll('turnOn');
    }
    resize(wdt, hgt, breakpoint, bpChanged) {
        this.callAll('resize', wdt, hgt, breakpoint, bpChanged);
    }
    destroy() {
        this.callAll('destroy');
        this.components = [];
        gsap.killTweensOf(this.view);
        this.view = null;
        super.destroy();
    }
    buildComponents($components) {
        for (let i = $components.length - 1; i >= 0; i--) {
            const $component = $components.eq(i);
            const componentName = $component.data('component');
            if (componentName !== undefined && Classes_1.components[componentName]) {
                const options = $component.data('options'), component = new Classes_1.components[componentName]($component, options);
                this.components.push(component);
                component.on(Component_1.ComponentEvents.CHANGE, this.onComponentChange);
            }
            else {
                window.console.warn('There is no `%s` component!', componentName);
            }
        }
    }
    callAll(fn, ...args) {
        for (let component of this.components) {
            if (typeof component[fn] === 'function') {
                component[fn].apply(component, [].slice.call(arguments, 1));
            }
        }
    }
}
exports.Page = Page;
},{"../Classes":4,"../Handler":6,"../Site":11,"../components/Component":14}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0NoYXJ0LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ29tcG9uZW50LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRGFzaGJvYXJkLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRHJvcGRvd24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9GaWx0ZXJzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvTWFzb25yeS50cyIsInNyYy90cy9jb21wb25lbnRzL1JhbmdlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvU2xpZGVyLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvU3RhdHMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Td2lwZS50cyIsInNyYy90cy9jb21wb25lbnRzL1Rvb2x0aXAudHMiLCJzcmMvdHMvcGFnZXMvUGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsaUNBQWlDO0FBQ2pDLGlDQUErQjtBQWlCL0IsTUFBYSxHQUFHO0lBeVBMLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBWTtRQUUzQixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5FLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqRixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFDL0csQ0FBQztJQUlNLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBYyxFQUFFLEdBQVcsRUFBRSxjQUF5QjtRQUV2RSxJQUFJLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFckMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRWpDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUVuQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQ2pELE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztRQUVoQixHQUFHLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFakMsT0FBTyxJQUFJLE9BQU8sQ0FBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUV4QyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNILEdBQUcsRUFBRSxHQUFHO2dCQUNSLE1BQU0sRUFBRSxLQUFLO2dCQUNiLElBQUksRUFBRSxNQUFNO2dCQUNaLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixLQUFLLEVBQUUsSUFBSTtnQkFDWCxJQUFJLEVBQUUsSUFBSTthQUNiLENBQUM7aUJBQ0QsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEVBQUU7Z0JBQ2YsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUNmLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDdEM7Z0JBRUQsSUFBSSxjQUFjLElBQUksT0FBTyxjQUFjLEtBQUssVUFBVSxFQUFFO29CQUN4RCxjQUFjLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztpQkFDdkM7Z0JBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXRCLENBQUMsQ0FBQztpQkFDRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtnQkFDUixPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRXRDLElBQUksQ0FBQyxDQUFDLFlBQUssRUFBRTtvQkFDVCxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7d0JBQ2YsR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUNsQztvQkFFRCxJQUFJLGNBQWMsSUFBSSxPQUFPLGNBQWMsS0FBSyxVQUFVLEVBQUU7d0JBQ3hELGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO3FCQUNuQztpQkFDSjtnQkFFRCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDZCxDQUFDLENBQUM7aUJBQ0QsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxHQUFHLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7WUFDeEMsQ0FBQyxDQUFDLENBQUM7UUFFUCxDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFFTyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQWMsRUFBRSxHQUFXO1FBR3JELElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUNoQixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzNFLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFFNUQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7U0FFN0U7UUFHRCxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztTQUMxRTtRQUdELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ3hDLElBQUksR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQWMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUM7WUFDaEUsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1NBQ3BCO1FBR0QsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2IsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7U0FDdEI7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzNDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7O0FBM1ZMLGtCQStYQztBQTNYa0IsZUFBVyxHQUFHO0lBRXpCLEtBQUssRUFBRSxVQUFTLElBQWMsRUFBRSxHQUFXO1FBQ3ZDLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO1lBQzlCLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsT0FBTztTQUNWO2FBQU07WUFDSCxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN6QjtJQUNMLENBQUM7SUFHRCxRQUFRLEVBQUUsVUFBUyxJQUFjLEVBQUUsR0FBVztRQUMxQyxJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLElBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RCxJQUFJLGVBQWUsR0FBRyxLQUFLLENBQUM7UUFDNUIsSUFBSSxjQUFjLENBQUM7UUFDbkIsSUFBSSxRQUFRLENBQUM7UUFDYixJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDM0IsS0FBSyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM3QixPQUFPO1NBQ1Y7UUFrQkQsZUFBZSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFM0MsZUFBZSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQWEsRUFBRSxLQUFjLEVBQUUsRUFBRTtZQUM1RSxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFHO2dCQUU3QixRQUFTLEtBQTBCLENBQUMsSUFBSSxFQUFFO29CQUV0QyxLQUFLLE9BQU87d0JBQ1IsSUFBSSxFQUFFLEdBQUcsd0pBQXdKLENBQUM7d0JBQ2xLLElBQUksS0FBSyxHQUFJLEtBQTBCLENBQUMsS0FBSyxDQUFDO3dCQUM5QyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTs0QkFDakIsTUFBTSxHQUFHLEtBQUssQ0FBQzs0QkFDZixPQUFPLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDOzRCQUMxRixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFRL0M7NkJBQU07NEJBQ0gsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQzt5QkFDcEM7d0JBQ0QsTUFBTTtvQkFFVixLQUFLLFVBQVU7d0JBQ1gsSUFBSSxDQUFFLEtBQTBCLENBQUMsT0FBTyxFQUFFOzRCQUN0QyxNQUFNLEdBQUcsS0FBSyxDQUFDOzRCQUNmLE9BQU8sR0FBRyxFQUFFLENBQUM7NEJBQ2IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQzs0QkFDMUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzs0QkFDOUIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBUS9DOzZCQUFNOzRCQUNILENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7eUJBQ3BDO3dCQUNELE1BQU07b0JBRVYsS0FBSyxNQUFNO3dCQUNQLElBQUksR0FBRyxHQUFJLEtBQTBCLENBQUMsS0FBSyxDQUFDO3dCQUM1QyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFOzRCQUNoQixNQUFNLEdBQUcsS0FBSyxDQUFDOzRCQUNmLE9BQU8sR0FBRyxFQUFFLENBQUM7NEJBQ2IsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQzs0QkFDMUUsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBOzZCQUFDOzRCQUN2RixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFTL0M7NkJBQU07NEJBQ0gsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQzt5QkFDcEM7d0JBQ0QsTUFBTTtvQkFFVixLQUFLLFFBQVE7d0JBR1QsTUFBTTtvQkFDVixLQUFLLE9BQU87d0JBQ1IsSUFBSSxNQUFNLEdBQUksS0FBMEIsQ0FBQyxLQUFLLENBQUM7d0JBQy9DLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7NEJBQ25CLE1BQU0sR0FBRyxLQUFLLENBQUM7NEJBQ2YsT0FBTyxHQUFHLEVBQUUsQ0FBQzs0QkFDYixPQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDOzRCQUMxRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzRCQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzt5QkFRL0M7NkJBQU07NEJBQ0gsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQzt5QkFDcEM7d0JBQ0QsTUFBTTtvQkFFVjt3QkFDSSxNQUFNO2lCQUNiO2FBRUo7WUFFRCxJQUFJLEtBQUssQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFO2dCQUMvQixJQUFJLEdBQUcsR0FBSSxLQUE2QixDQUFDLEtBQUssQ0FBQztnQkFDL0MsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDaEIsTUFBTSxHQUFHLEtBQUssQ0FBQztvQkFDZixPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7b0JBQzFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzlCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQVEvQztxQkFBTTtvQkFDSCxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2lCQUNwQzthQUNKO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxlQUFlLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBYSxFQUFFLEtBQWMsRUFBRSxFQUFFO1lBQy9FLElBQUksR0FBRyxHQUFJLEtBQTZCLENBQUMsS0FBSyxDQUFDO1lBRS9DLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtvQkFDbkQsTUFBTSxHQUFHLEtBQUssQ0FBQztvQkFDZixPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO29CQUN2RSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUM5QixDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztpQkFFL0M7YUFFSjtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBR0gsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO1lBQ1YsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDeEIsS0FBSyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNoQyxlQUFlLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUNoQztJQUNMLENBQUM7Q0FFSixDQUFDO0FBSWEsYUFBUyxHQUFHO0lBRXZCLGNBQWMsRUFBRSxVQUFTLElBQWMsRUFBRSxHQUFXLEVBQUUsUUFBUTtRQUMxRCxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxXQUFXLEVBQUUsVUFBUyxJQUFjLEVBQUUsR0FBVyxFQUFFLFFBQVE7UUFDdkQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUMzQixJQUFJLFFBQVEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksUUFBUSxDQUFDO1FBU2IsR0FBRyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUU1QixJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQ2QsR0FBRyxDQUFDLE1BQU0sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1lBQy9DLFFBQVEsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3RDO1FBRUQsSUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBRWhELFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9CLElBQUksUUFBUSxDQUFDLE1BQU0sRUFBRTtZQUNqQixHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQzdCLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDdkMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFL0MsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUIsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7WUFFaEQsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUV0QyxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNaLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNoQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDWjtTQUNKO2FBQU07WUFDSCxHQUFHLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVCO1FBSUQsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUVKLENBQUM7QUF3R2EsWUFBUSxHQUFHLENBQUMsQ0FBb0IsRUFBUSxFQUFFO0lBQ3JELENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUNuQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7SUFFcEIsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUE0QixDQUFDLENBQUM7SUFDNUMsTUFBTSxJQUFJLHFCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzNELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzFCLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsRUFBRTtRQUNoQixHQUFHLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBQ2hDO1NBQU07UUFDSCxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUNoRDtJQUdELElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtRQUNqQixJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLFdBQVcsRUFBRTtZQUNwQyxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUMsT0FBTztTQUNWO0tBQ0o7SUFFRCxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUMxQixDQUFDLENBQUM7QUFJYSxhQUFTLEdBQUcsQ0FBQyxJQUFjLEVBQUUsR0FBVyxFQUFFLFFBQVEsRUFBUSxFQUFFO0lBRXZFLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNmLElBQUksSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsU0FBUyxFQUFFO1lBQ2hDLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDckQ7S0FDSjtBQUNMLENBQUMsQ0FBQzs7OztBQ3pZTixNQUFhLFVBQVU7SUFFWixNQUFNLENBQUMsTUFBTTtRQUVoQixNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRixNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVwRixrQkFBVSxHQUFHO1lBQ1QsT0FBTyxFQUFFLGNBQWMsS0FBSyxTQUFTO1lBQ3JDLEtBQUssRUFBRSxjQUFjLEtBQUssT0FBTztZQUNqQyxNQUFNLEVBQUUsY0FBYyxLQUFLLFFBQVE7WUFDbkMsS0FBSyxFQUFFLGNBQWM7U0FDeEIsQ0FBQztRQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLGtCQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUNKO0FBaEJELGdDQWdCQzs7OztBQ0FELFNBQWdCLFVBQVU7SUFDdEIsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFDdEMsZUFBTyxHQUFHO1FBQ04sTUFBTSxFQUFFLENBQUMsb1VBQW9VLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLHlrREFBeWtELENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBQ3o4RCxHQUFHLEVBQUUsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNoQyxHQUFHLEVBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUN6RCxFQUFFLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFFOUQsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFFLE1BQWMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUUsTUFBYyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1FBQ3RILE9BQU8sRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNqRCxNQUFNLEVBQUUsZ0NBQWdDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNqRCxPQUFPLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN2RSxDQUFDO0lBRUYsQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUNKLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxlQUFPLENBQUMsT0FBTyxJQUFJLENBQUMsZUFBTyxDQUFDLEdBQUcsSUFBSSxlQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDcEUsV0FBVyxDQUFDLFNBQVMsRUFBRSxlQUFPLENBQUMsT0FBTyxJQUFJLENBQUMsZUFBTyxDQUFDLEdBQUcsSUFBSSxDQUFDLGVBQU8sQ0FBQyxHQUFHLENBQUM7U0FDdkUsV0FBVyxDQUFDLFFBQVEsRUFBRSxlQUFPLENBQUMsTUFBTSxDQUFDO1NBQ3JDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsZUFBTyxDQUFDLE9BQU8sQ0FBQztTQUN2QyxXQUFXLENBQUMsUUFBUSxFQUFFLGVBQU8sQ0FBQyxNQUFNLENBQUM7U0FDckMsV0FBVyxDQUFDLElBQUksRUFBRSxlQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFbkMsT0FBTyxlQUFPLENBQUM7QUFDbkIsQ0FBQztBQXZCRCxnQ0F1QkM7QUFHRCxNQUFhLE9BQU87SUFDVCxNQUFNLENBQUMsTUFBTTtRQUNoQixlQUFPLEdBQUcsVUFBVSxFQUFFLENBQUM7SUFDM0IsQ0FBQztDQUNKO0FBSkQsMEJBSUM7Ozs7QUN2REQsZ0RBQTZDO0FBQzdDLGtEQUErQztBQUMvQyxvREFBaUQ7QUFDakQsa0RBQStDO0FBQy9DLHNEQUFtRDtBQUNuRCw4Q0FBMkM7QUFDM0Msa0RBQStDO0FBQy9DLDhDQUEyQztBQUMzQyw4Q0FBMkM7QUFFM0MsdUNBQW9DO0FBRXZCLFFBQUEsVUFBVSxHQUFHO0lBQ3RCLE1BQU0sRUFBTixlQUFNO0lBQ04sT0FBTyxFQUFQLGlCQUFPO0lBQ1AsUUFBUSxFQUFSLG1CQUFRO0lBQ1IsT0FBTyxFQUFQLGlCQUFPO0lBQ1AsU0FBUyxFQUFULHFCQUFTO0lBQ1QsS0FBSyxFQUFMLGFBQUs7SUFDTCxPQUFPLEVBQVAsaUJBQU87SUFDUCxLQUFLLEVBQUwsYUFBSztJQUNMLEtBQUssRUFBTCxhQUFLO0NBQ1IsQ0FBQztBQUdXLFFBQUEsS0FBSyxHQUFHO0lBQ2pCLElBQUksRUFBSixXQUFJO0NBQ1AsQ0FBQzs7OztBQ3RCRixNQUFhLElBQUk7SUFFYjtRQUNJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBR08sSUFBSTtRQUNSLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDckMsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUVwQixNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQy9CLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1lBRTdELE1BQU0sQ0FBQyxTQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNwQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFFeEMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxQixVQUFVLENBQUMsR0FBRyxFQUFFLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM5RCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXRCRCxvQkFzQkM7Ozs7QUMzQkQsTUFBc0IsT0FBTztJQUt6QjtRQUNJLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFTTSxFQUFFLENBQUMsU0FBaUIsRUFBRSxPQUFpQjtRQUUxQyxJQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRztZQUMzQixJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUMvQjtRQUVELElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFVTSxHQUFHLENBQUMsU0FBa0IsRUFBRSxPQUFrQjtRQUU3QyxJQUFJLE9BQU8sU0FBUyxLQUFLLFdBQVcsRUFBRTtZQUNsQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztZQUNqQixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBSSxPQUFPLE9BQU8sS0FBSyxXQUFXLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUM1QixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsSUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLEVBQUc7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDZjtRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXRELElBQUssS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFHO1lBQ2QsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQVNNLE9BQU8sQ0FBQyxTQUFpQixFQUFFLEdBQUcsZUFBZTtRQUVoRCxJQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsRUFBRztZQUFFLE9BQU87U0FBRTtRQUMxQyxNQUFNLElBQUksR0FBRyxTQUFTLENBQUM7UUFDdkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFJTSxPQUFPO1FBQ1YsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBOUVELDBCQThFQzs7OztBQzlFRCxNQUFhLE1BQU07SUFPZixZQUFzQixJQUFZO1FBQVosU0FBSSxHQUFKLElBQUksQ0FBUTtRQUM5QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUM7UUFDL0IsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUlNLElBQUk7UUFDUCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFJTSxJQUFJO1FBQ1AsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBSU0sR0FBRyxDQUFDLFFBQWdCO1FBQ3ZCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO1FBRXpCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFcEMsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7UUFFbEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN4QyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUFJTSxNQUFNLENBQUMsR0FBVyxFQUFFLEdBQVc7UUFDbEMsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBM0NELHdCQTJDQzs7OztBQzNDRCx1Q0FBb0M7QUFDcEMscUNBQWtDO0FBQ2xDLGlDQUFzRDtBQUN0RCxpQ0FBaUM7QUFNakMsSUFBSSxTQUFTLEdBQW1CLE9BQU8sQ0FBQztBQUt4QyxNQUFhLGdCQUFnQjs7QUFBN0IsNENBR0M7QUFGaUIsdUJBQU0sR0FBRyxPQUFPLENBQUM7QUFDakIseUJBQVEsR0FBRyxVQUFVLENBQUM7QUFLeEMsTUFBYSxVQUFXLFNBQVEsaUJBQU87SUE4Rm5DO1FBRUksS0FBSyxFQUFFLENBQUM7UUF5TEosZ0JBQVcsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQzlCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFNUIsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQixZQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBRW5DLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxlQUFRLEVBQUUsRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLENBQUMsQ0FBQztnQkFFakQsS0FBSyxDQUFDLG9CQUFvQixDQUFDLGVBQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNoRDtpQkFBTTtnQkFDSCxJQUFJLENBQUMsR0FBRyxDQUFDLGVBQVEsRUFBRSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUMsQ0FBQyxDQUFDO2dCQUNqRCxLQUFLLENBQUMsbUJBQW1CLENBQUMsZUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQy9DO1lBRUQsT0FBTztRQUNYLENBQUMsQ0FBQTtRQUVPLG9CQUFlLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUNsQyxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzdDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUMxRCxNQUFNLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDbkYsTUFBTSxRQUFRLEdBQUcsQ0FBQyxDQUFDLGlDQUFpQyxDQUFDLENBQUMsQ0FBQyxDQUFvQixDQUFDO1lBQzVFLE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2hELE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMxRSxDQUFDLENBQUE7UUFLTyxZQUFPLEdBQUcsQ0FBQyxDQUFvQixFQUFRLEVBQUU7WUFFN0MsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRW5CLElBQUksS0FBSyxHQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBNEIsQ0FBQyxFQUNqRCxLQUFLLEdBQVcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNoRixJQUFJLEdBQVcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU5QyxJQUFJLElBQUksS0FBSyxNQUFNLEVBQUU7Z0JBQ2pCLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDMUI7aUJBQU0sSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO2dCQUMzQixTQUFTLENBQUMsWUFBWSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDaEY7aUJBQU07Z0JBQ0gsZUFBTSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUMvQixTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDN0U7UUFDTCxDQUFDLENBQUE7UUFLTyxnQkFBVyxHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDOUIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFCLGVBQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwRCxDQUFDLENBQUE7UUFLTyxZQUFPLEdBQUcsR0FBUyxFQUFFO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixVQUFVLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUNqQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRTtnQkFDdEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQzthQUN6QztRQUNMLENBQUMsQ0FBQTtRQTVQRyxJQUFJLFNBQVMsRUFBRTtZQUNYLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQixTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUMvRDtRQUVELFVBQVUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBRTNCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBOUZNLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBYztRQUNqQyxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUtNLE1BQU0sQ0FBQyxJQUFJLENBQUMsUUFBZ0IsRUFBRSxPQUFpQjtRQUVsRCxJQUFJLFFBQVEsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxFQUNoRixXQUFXLEdBQUcsUUFBUSxLQUFLLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBRXhELElBQUksU0FBUyxDQUFDLE9BQU8sRUFBRTtZQUNuQixJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7Z0JBQ1gsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2FBQ25GO2lCQUFNO2dCQUNILFNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQzthQUNoRjtTQUNKO2FBQU07WUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUNyQztRQUVELE9BQU8sV0FBVyxDQUFDO0lBQ3ZCLENBQUM7SUFLTSxNQUFNLENBQUMsVUFBVSxDQUFDLFFBQWdCLEVBQUUsT0FBaUIsRUFBRSxLQUFjO1FBRXhFLFVBQVUsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQzNCLElBQUksT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLE9BQU8sSUFBSSxJQUFJLENBQUMsQ0FBQztRQUN6RCxVQUFVLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztRQUU1QixJQUFJLENBQUMsQ0FBQyxPQUFPLEVBQUU7WUFDWCxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDaEQ7SUFDTCxDQUFDO0lBS00sTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFnRCxFQUFFLGFBQXVCO1FBQ3hGLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDaEIsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDekM7YUFBTTtZQUNILFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQWlCLENBQUMsQ0FBQztTQUNuRDtJQUNMLENBQUM7SUFRTSxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQVk7UUFDM0IsSUFBSSxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNwQixTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDcEI7YUFBTSxJQUFJLEdBQUcsRUFBRTtZQUNaLFNBQVMsQ0FBQyxZQUFZLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsUUFBUSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQztTQUM5RTthQUFNO1lBQ0gsU0FBUyxDQUFDLFlBQVksQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxRQUFRLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQzlFO0lBQ0wsQ0FBQztJQUlNLE1BQU0sQ0FBQyxNQUFNO1FBQ2hCLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFTSxNQUFNLENBQUMsbUJBQW1CO1FBRTdCLElBQUksQ0FBQyxrQkFBVyxFQUFFO1lBQ2QsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNsQyxZQUFLLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDekM7SUFDTCxDQUFDO0lBeUJNLElBQUk7UUFHUCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDZCxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3hCO1FBR0QsTUFBTSxJQUFJLEdBQVcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUM7UUFDOUMsTUFBTSxNQUFNLEdBQVcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQ3BELE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxNQUFNLENBQUM7UUFHMUIsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQzNCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDZCxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDO2FBQzVCO1FBQ0wsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUkxQixPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBR3pDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNwQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1lBR3BFLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLEdBQUcsRUFBRTtnQkFFdkIsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUU7b0JBRTdCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxZQUFZLENBQUM7b0JBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMzQyxPQUFPLEVBQUUsQ0FBQztpQkFFYjtxQkFBTTtvQkFFSCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFFdkMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUU7d0JBQ3JDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7cUJBQzVCO2lCQUNKO2dCQUVELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2dCQUNwQixNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN0QyxDQUFDLENBQUM7WUFHRixJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxHQUFHLEVBQUU7Z0JBQ3hCLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztnQkFDL0IsTUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3hCLENBQUMsQ0FBQztZQUdGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxDQUFDLGdCQUFnQixFQUFFO29CQUNwQixJQUFJLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztpQkFDL0Q7WUFDTCxDQUFDLENBQUM7WUFHRixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUtNLE1BQU07UUFFVCxNQUFNLElBQUksR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzVDLE1BQU0sVUFBVSxHQUFRLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzlELElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUl0QixJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFRLEVBQUU7Z0JBQzFDLGFBQWEsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN6RyxDQUFDLENBQUMsQ0FBQztTQUNOO1FBR0QsSUFBSSxhQUFhLEtBQUssQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzlDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNqRDtRQUVELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFHdEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxLQUFLLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUM1RCxDQUFDO0lBSU8sYUFBYSxDQUFDLEVBQWUsRUFBRSxJQUFZLEVBQUUsVUFBb0I7UUFFckUsSUFBSSxJQUFJLEdBQVcsSUFBSSxDQUFDO1FBQ3hCLE1BQU0sU0FBUyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDO1FBRTlCLElBQUksQ0FBQyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLGNBQWMsRUFBRTtZQUM1RSxJQUFJLEdBQUcsSUFBSSxDQUFDO1NBQ2Y7YUFBTTtZQUNILE1BQU0sY0FBYyxHQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RixJQUFJLEdBQUcsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2hDO1FBRUQsSUFBSSxDQUFDLElBQUksRUFBRTtZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQUMsT0FBTyxLQUFLLENBQUM7U0FBRTtRQUVqRixDQUFDLENBQUMsU0FBUyxDQUFDO2FBQ1AsSUFBSSxFQUFFO2FBQ04sS0FBSyxFQUFFO2FBQ1AsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUM7YUFDbEIsSUFBSSxFQUFFLENBQUM7UUFFWixPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBS08sUUFBUSxDQUFDLE1BQWU7UUFDNUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBS08sU0FBUyxDQUFDLE1BQWdEO1FBRTlELE1BQU0sR0FBRyxNQUFNLElBQUksTUFBTSxDQUFDO1FBRTFCLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO2FBQ2QsR0FBRyxDQUFDLHdCQUF3QixDQUFDO2FBQzdCLEdBQUcsQ0FBQyxZQUFZLENBQUM7YUFDakIsR0FBRyxDQUFDLFlBQVksQ0FBQzthQUNqQixHQUFHLENBQUMsY0FBYyxDQUFDO2FBQ25CLEdBQUcsQ0FBQyxhQUFhLENBQUM7YUFDbEIsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2FBQ3JCLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQzthQUN4QixHQUFHLENBQUMsbUJBQW1CLENBQUM7YUFDeEIsR0FBRyxDQUFDLGdCQUFnQixDQUFDO2FBQ3JCLEdBQUcsQ0FBQyxlQUFlLENBQUM7YUFDcEIsR0FBRyxDQUFDLGNBQWMsQ0FBQzthQUNuQixHQUFHLENBQUMsYUFBYSxDQUFDO2FBQ2xCLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQzthQUN2QixHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFdkQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQzthQUM1QixHQUFHLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO2FBQ3BELEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUVyQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUM7YUFDM0MsR0FBRyxDQUFDLFVBQVUsQ0FBQzthQUNmLEVBQUUsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRzNDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3hELENBQUM7SUE0RU8sY0FBYztRQUNsQixDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzFFLENBQUM7O0FBdFdMLGdDQXVXQztBQXJXMEIscUJBQVUsR0FBRyxJQUFJLENBQUM7QUFDMUIsbUJBQVEsR0FBRyxLQUFLLENBQUM7Ozs7QUNwQnBDLHVDQUFvQztBQUlwQyw2Q0FBbUU7QUFFbkUsaUNBQXdDO0FBQ3hDLHVDQUF1QztBQXlFdkMsTUFBYSxNQUFNO0lBdUVmO1FBMURRLFVBQUssR0FBaUIsRUFBRSxDQUFDO1FBQ3pCLGdCQUFXLEdBQUcsRUFBRSxDQUFDO1FBNEhqQix1QkFBa0IsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQ3JDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUduQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUNqQyxJQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBRTNELElBQUssT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxRQUFRLEVBQUc7b0JBQ3ZELE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7b0JBQzlELE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO2lCQUMzRDtnQkFFRCxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2FBQzNEO2lCQUFNO2dCQUNILE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUNuRDtRQUNMLENBQUMsQ0FBQztRQWtJTSxhQUFRLEdBQUcsR0FBUyxFQUFFO1lBRTFCLElBQUksTUFBTSxDQUFDLFFBQVEsSUFBSSxZQUFLLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxFQUFFO2dCQUFFLE9BQU87YUFBRTtZQUVuRSxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQztZQUNwRyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pDLE1BQU0sWUFBWSxHQUFXLEVBQUUsR0FBRyxNQUFNLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztZQUM3RCxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1lBQ3pDLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztZQUNwRSxNQUFNLFVBQVUsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNqSCxNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUcsTUFBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUVoRCxZQUFLLENBQUMsV0FBVyxDQUFDLDJCQUEyQixFQUFFLEVBQUUsR0FBRyxZQUFZLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDeEUsWUFBSyxDQUFDLFdBQVcsQ0FBQyxvQkFBb0IsRUFBRSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDbEQsWUFBSyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLFlBQUssQ0FBQyxXQUFXLENBQUMscUJBQXFCLEVBQUUsRUFBRSxHQUFHLFVBQVUsQ0FBQyxDQUFDO1lBQzFELFlBQUssQ0FBQyxXQUFXLENBQUMseUJBQXlCLEVBQUUsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDO1lBQy9ELFlBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFLEVBQUUsSUFBSSxTQUFTLENBQUMsQ0FBQztZQUlwRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzNELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ25ELE1BQU0sSUFBSSxHQUF3QixJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDM0QsTUFBTSxPQUFPLEdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxZQUFZLENBQUM7b0JBQzdELE1BQU0sSUFBSSxHQUFXLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxLQUFLLEdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDekUsTUFBTSxVQUFVLEdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUUvRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRyxVQUFVLElBQUksRUFBRSxFQUFFO3dCQUM1RCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ2pCLE1BQU0sS0FBSyxHQUFZLElBQUksSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDOUQ7eUJBQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sSUFBSSxLQUFLLEdBQUcsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFO3dCQUNsSCxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxVQUFVLEVBQUU7NEJBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt5QkFDL0I7d0JBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7cUJBQ3JCO3lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxZQUFZLElBQUksRUFBRSxJQUFJLEtBQUssR0FBRyxZQUFZLENBQUUsRUFBRTt3QkFDakcsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7d0JBQ2xCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQUU7d0JBQzlGLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEVBQUU7NEJBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7eUJBQUU7d0JBQ3BFLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO3FCQUNwQztpQkFDSjthQUNKO1lBSUQsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLHVCQUFVLENBQUMsT0FBTyxFQUFFO2dCQUNqRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO29CQUNuRCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQyxZQUFZLENBQUMsQ0FBQztpQkFDNUU7YUFDSjtZQUtELElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUU7Z0JBRXhCLE1BQU0sWUFBWSxHQUFXLEdBQUcsR0FBRyxZQUFZLENBQUM7Z0JBRWhELElBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQztnQkFDbkIsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO2dCQUduQixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUEwQixFQUFFLEtBQUssRUFBRSxFQUFFO29CQUdqRSxNQUFNLEtBQUssR0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO29CQUN6RSxNQUFNLFVBQVUsR0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUM7b0JBQ3BGLE1BQU0sVUFBVSxHQUFXLEtBQUssR0FBRyxVQUFVLENBQUM7b0JBQzlDLE1BQU0sT0FBTyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztvQkFHcEcsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7b0JBQzdDLE1BQU0sS0FBSyxHQUFHLE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztvQkFDbkUsTUFBTSxVQUFVLEdBQUcsQ0FBRSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxVQUFVLENBQUM7b0JBQ3BELElBQUksb0JBQW9CLEdBQUcsS0FBSyxDQUFDO29CQUNqQyxJQUFJLE9BQU8sR0FBRyxZQUFLLENBQUMsUUFBUSxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxZQUFZLElBQUksS0FBSyxJQUFJLEtBQUssR0FBRyxVQUFVLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsRUFBRSxJQUFJLFlBQVksSUFBSSxVQUFVLEdBQUcsRUFBRSxJQUFJLFlBQVksQ0FBQztvQkFFN0ssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO3dCQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQzt3QkFDbEIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUU7NEJBQ25CLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO3lCQUNwQzt3QkFDRCxvQkFBb0IsR0FBRyxJQUFJLENBQUM7d0JBRTVCLE9BQU87cUJBQ1Y7b0JBRUQsSUFBSSxPQUFPLEVBQUU7d0JBRVQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUU7NEJBQ2IsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7NEJBQ2xCLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFO2dDQUNuQixVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs2QkFDeEM7NEJBQ0Qsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO3lCQUMvQjt3QkFDRCxVQUFVLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO3dCQUM5QixVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzt3QkFDcEQsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFOzRCQUNiLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxJQUFJLE9BQU8sR0FBRyxZQUFZLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3lCQUN6RTt3QkFDRCxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztxQkFDM0I7eUJBQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTt3QkFDckIsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7d0JBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO3FCQUN0QjtnQkFDTCxDQUFDLENBQUMsQ0FBQztnQkFHSCxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUU7b0JBQ2xCLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQVEsRUFBRTt3QkFDN0IsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRTs0QkFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7eUJBRzlDO29CQUNMLENBQUMsQ0FBQyxDQUFDO2lCQUNOO2FBSUo7UUFDTCxDQUFDLENBQUM7UUFwVkUsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsaUJBQU8sQ0FBQyxNQUFNLENBQUM7UUFFcEMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxtREFBbUQsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDNUYsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUczQyxNQUFNLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN6QixNQUFNLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUV2QixJQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDO1FBQzNDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBdkRNLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBVyxFQUFFLE1BQWUsRUFBRSxRQUFpQjtRQUN6RSxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDakMsTUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7WUFDeEIsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsWUFBWSxHQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sR0FBRyxHQUFHO2dCQUNSLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUM7YUFDM0QsQ0FBQztZQUVGLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1QsQ0FBQyxFQUFFLENBQUM7Z0JBQ0osSUFBSSxFQUFFLE1BQU07Z0JBQ1osUUFBUSxFQUFFLE9BQU8sUUFBUSxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRO2dCQUN4RCxRQUFRLEVBQUUsR0FBUyxFQUFFO29CQUNqQixNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLENBQUM7Z0JBQ0QsVUFBVSxFQUFFLEdBQVMsRUFBRTtvQkFDbkIsTUFBTSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQ3pCLE9BQU8sRUFBRSxDQUFDO2dCQUNkLENBQUM7YUFDSixDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTSxNQUFNLENBQUMsZ0JBQWdCLENBQUMsUUFBUTtRQUNuQyxNQUFNLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxPQUFPO1FBQ2pCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ3pCLENBQUM7SUFHTSxNQUFNLENBQUMsTUFBTTtRQUNoQixJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQztRQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUMxQixDQUFDO0lBcUJNLE1BQU07UUFDVCxNQUFNLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUM7UUFDekMsTUFBTSxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDNUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsV0FBVyxFQUFFLEdBQUcsTUFBTSxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDO1FBRXhGLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFHM0MsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3JCLENBQUM7SUFHTSxNQUFNLENBQUMsWUFBWSxDQUFDLElBQWM7UUFFckMsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUVwRSxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNaLE1BQU0sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN0QyxPQUFPLElBQUksQ0FBQztTQUNmO2FBQU07WUFDSCxPQUFPLEtBQUssQ0FBQztTQUNoQjtJQUNMLENBQUM7SUFFTSxPQUFPO1FBQ1YsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUFFLE9BQU8sS0FBSyxDQUFDO1NBQUU7UUFDMUMsT0FBTyxNQUFNLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDakMsQ0FBQztJQUVNLElBQUk7UUFDUCxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDckIsQ0FBQztJQUVNLElBQUk7UUFDUCxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDakIsY0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDNUUsQ0FBQztJQUdNLEtBQUs7UUFDUixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRU0sT0FBTztRQUNWLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2hCLGNBQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQXFCTyxnQkFBZ0I7UUFDcEIsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBQ2IsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3hDLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDdEMsSUFBSSxPQUFPLG9CQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssV0FBVyxFQUFFO2dCQUMzQyxNQUFNLEVBQUUsR0FBRyxJQUFJLG9CQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2dCQUNwRCxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUM7Z0JBQ2QsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDbkI7aUJBQU07Z0JBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLEVBQUUsTUFBTSxDQUFDLENBQUM7YUFDeEU7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUdPLFNBQVM7UUFFYixNQUFNLFVBQVUsR0FBK0IsRUFBRSxDQUFDO1FBQ2xELE1BQU0sTUFBTSxHQUFHLENBQUMsQ0FBRTtRQW1DbEIsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQVcsRUFBRSxFQUFFO1lBQ2xELE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixVQUFVLENBQUMsSUFBSSxDQUFDO2dCQUNaLEdBQUcsRUFBRSxHQUFHO2dCQUNSLEtBQUssRUFBRSxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHO2dCQUN6RSxDQUFDLEVBQUUsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsR0FBRyxNQUFNO2dCQUM1QixNQUFNLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRTtnQkFDekIsSUFBSSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUM5QixJQUFJLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7Z0JBQzNCLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLElBQUk7Z0JBQ2hDLE9BQU8sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQzthQUUvQixDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUlILE1BQU0sVUFBVSxHQUE4QixFQUFFLENBQUM7UUFDakQsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQVcsRUFBRSxFQUFFO1lBQ2pELE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBYyxFQUFFLENBQUMsQ0FBQztZQUMvQixNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9CLFVBQVUsQ0FBQyxJQUFJLENBQUM7Z0JBQ1osR0FBRyxFQUFFLEdBQUc7Z0JBQ1IsS0FBSyxFQUFFLENBQUM7Z0JBQ1IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHO2dCQUNuQixNQUFNLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRTtnQkFDekIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO2dCQUN0QyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7Z0JBQ3ZDLElBQUksRUFBRSxLQUFLO2dCQUNYLE1BQU0sRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxFQUFFO2dCQUM5QixXQUFXLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sRUFBRTthQUMvQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksV0FBVyxHQUFnQyxFQUFFLENBQUM7UUFDbEQsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBUyxFQUFFLEVBQVcsRUFBRSxFQUFFO1lBQ25ELE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNsQixNQUFNLGNBQWMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlDLE1BQU0sV0FBVyxHQUFHLGNBQWMsQ0FBQyxXQUFXLElBQUksQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBRWpGLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQyx1QkFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxFQUFFO29CQUN0QyxPQUFPLENBQUMsSUFBSSxDQUFDLGlDQUFpQyxHQUFHLGNBQWMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7aUJBQzdFO3FCQUFNO29CQUNILFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQzt3QkFDdEIsR0FBRyxFQUFFLEdBQUc7d0JBQ1IsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHO3dCQUNuQixNQUFNLEVBQUUsR0FBRyxDQUFDLFdBQVcsRUFBRTt3QkFDekIsS0FBSyxFQUFFLENBQUM7d0JBQ1IsS0FBSyxFQUFFLENBQUM7d0JBQ1IsV0FBVyxFQUFFLENBQUM7cUJBQ2pCLEVBQUUsY0FBYyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQzdCO2FBRUo7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUdILElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBS3JDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBeUlPLE9BQU8sQ0FBQyxJQUF5QixFQUFFLEdBQVcsRUFBRSxJQUFZLEVBQUUsUUFBZ0IsR0FBYSxFQUFFLEtBQWUsRUFBRSxPQUFpQjtRQUVuSSxNQUFNLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0IsUUFBUSxJQUFJLEVBQUU7WUFFVixLQUFLLE1BQU07Z0JBQ1AsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQzNCLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ2hFLE1BQU07WUFFVixLQUFLLFFBQVE7Z0JBQ1QsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUNsQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBQ3RFLE1BQU07WUFFVixLQUFLLFVBQVU7Z0JBQ1gsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUNuRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQ25DLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFDdEUsTUFBTTtZQUVWLEtBQUssV0FBVztnQkFDWixJQUFJLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBQ25ELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFDbkMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RSxNQUFNO1lBRVYsS0FBSyxVQUFVO2dCQUNYLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDbkQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFDbEMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUN0RSxNQUFNO1lBRVYsS0FBSyxPQUFPO2dCQUNSLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFDM0MsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUUxQyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNyRixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUV0RixNQUFNO1lBRVYsS0FBSyxVQUFVO2dCQUNYLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUU7b0JBQ2pFLENBQUMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUc7b0JBQ3JCLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztvQkFDekUsQ0FBQztpQkFDSixDQUFDLENBQUM7Z0JBRUgsTUFBTTtZQUVWLEtBQUssTUFBTTtnQkFFUCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUU5QixJQUFJLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQ3BDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFDLENBQUMsRUFDekQsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsRUFDcEMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBRW5DLElBQUksQ0FBQyxRQUFRLEVBQUU7cUJBQ1YsTUFBTSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUM7cUJBQ3BFLE1BQU0sQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRSxPQUFPLENBQUM7cUJBQ3pHLE1BQU0sQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7Z0JBRS9GLE1BQU07WUFFVixLQUFLLE1BQU07Z0JBQ1AsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQztnQkFDMUYsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ25DLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBQzFCLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztpQkFDeEQ7Z0JBRUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ2hHLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztnQkFFM0UsTUFBTTtZQUVWLEtBQUssT0FBTztnQkFDUixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQyxFQUFDLEVBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO2dCQUVsRixNQUFNO1lBRVYsS0FBSyxPQUFPO2dCQUNSLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlCLE1BQU0sTUFBTSxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUN2RSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUU1RyxNQUFNO1lBRVYsS0FBSyxjQUFjO2dCQUNmLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlCLE1BQU0sT0FBTyxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUN4RSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRXZGLE1BQU07WUFFVixLQUFLLGNBQWM7Z0JBQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFFOUIsTUFBTSxLQUFLLEdBQUcsSUFBSSxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQy9ELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDaEUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO2dCQUV2RixNQUFNO1lBRVYsS0FBSyxRQUFRO2dCQUNULElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRTlCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBRS9HLE1BQU07WUFFVixLQUFLLE1BQU07Z0JBRVAsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFFN0UsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO2dCQUMzRCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUVsQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7Z0JBRTFFLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO29CQUNwQixRQUFRLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxJQUFJO29CQUNsRCxVQUFVLEVBQUUsR0FBRyxFQUFFO3dCQUNiLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7b0JBQzVDLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2dCQUVILE1BQU07WUFFVixLQUFLLE9BQU87Z0JBQ1IsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUMzQyxNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7Z0JBQzdDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRTdCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRWpELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQztnQkFDaEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBTzVELElBQUksQ0FBQyxRQUFRLENBQUM7b0JBQ1Ysa0JBQWtCLEVBQUUsSUFBSTtpQkFDM0IsQ0FBQztxQkFDRyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDO3FCQUMzQixNQUFNLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLElBQUksR0FBRyxLQUFLLENBQUM7cUJBQ2hGLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxlQUFlLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxFQUFFLEdBQUcsQ0FBQztxQkFDakgsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxHQUFHLEdBQUcsQ0FBQztxQkFDOUUsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUV6RSxNQUFNO1lBRVYsS0FBSyxNQUFNO2dCQUNQLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzlCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sUUFBUSxHQUFHLElBQUksU0FBUyxDQUFDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsQ0FBQyxDQUFDO2dCQUU5RCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFHLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBR3pGLE1BQU07WUFFVixLQUFLLFdBQVc7Z0JBQ1osTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFFM0QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDOUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFHbkMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztnQkFFekcsTUFBTTtZQUVWLEtBQUssWUFBWTtnQkFDYixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNuQyxNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUVuQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUM5QixJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBR3JDLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDO2dCQUNyRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztnQkFFdEYsTUFBTTtZQUVWLEtBQUssU0FBUztnQkFDVixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUNoQyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO2dCQUVwQyxNQUFNLFVBQVUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUMsQ0FBQztnQkFFbkUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFFN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRyxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFFdkUsTUFBTTtZQUVWLEtBQUssYUFBYTtnQkFDZCxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLEVBQ2xDLEdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUN6QixHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFFaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFDcEUsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDLENBQUMsQ0FBQztnQkFFOUQsTUFBTTtZQUVWLEtBQUssT0FBTztnQkFDUixNQUFNLE9BQU8sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQztnQkFFdkQsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFFbEMsTUFBTTtZQUVWLEtBQUssUUFBUTtnQkFDVCxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDO2dCQUU3QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUM5QixPQUFPLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQywyQkFBMkIsQ0FBQyxFQUMvQyxTQUFTLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsQ0FBQyxFQUNsRCxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztnQkFFcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7Z0JBQ2hILElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUM7Z0JBRTdDLE1BQU07WUFFVjtnQkFDSSxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixJQUFJLGtCQUFrQixDQUFDLENBQUM7Z0JBQ3hELE1BQU07U0FDYjtJQUNMLENBQUM7SUFJTyxRQUFRLENBQUMsSUFBd0IsRUFBRSxFQUFVLEVBQUUsWUFBb0IsRUFBRSxZQUFvQjtRQUU3RixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFFWixNQUFNLEdBQUcsR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzdCLElBQUksQ0FBQyxHQUFXLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdkIsTUFBTSxRQUFRLEdBQVcsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxZQUFZLENBQUM7WUFDOUQsTUFBTSxLQUFLLEdBQVcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7WUFFdkMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRTtnQkFFOUMsTUFBTSxPQUFPLEdBQVcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsQ0FBQztnQkFDNUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFFckMsTUFBTSxJQUFJLEdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7Z0JBRWpCLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFO29CQUNULFFBQVEsRUFBRSxJQUFJO29CQUNkLENBQUMsRUFBRSxDQUFDO29CQUNKLFVBQVUsRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDakIsSUFBSSxFQUFFLE1BQU07aUJBQ2YsQ0FBQyxDQUFDO2FBQ047U0FFSjthQUFNLElBQUksSUFBSSxDQUFDLElBQUksRUFBRTtZQUNsQixNQUFNLEdBQUcsR0FBVyxJQUFJLENBQUMsR0FBRyxDQUFDO1lBQzdCLE1BQU0sU0FBUyxHQUFXLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNoRCxNQUFNLENBQUMsR0FBVyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sUUFBUSxHQUFXLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsWUFBWSxDQUFDO1lBQzlELE1BQU0sS0FBSyxHQUFXLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3ZDLE1BQU0sV0FBVyxHQUFXLEVBQUUsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFcEQsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO2dCQUVmLEtBQUssTUFBTTtvQkFDUCxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7d0JBQ2YsQ0FBQyxFQUFFLENBQUMsaUJBQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7cUJBQ3BDLENBQUMsQ0FBQztvQkFFSCxNQUFNO2dCQUdWLEtBQUssWUFBWTtvQkFFYixJQUFJLENBQUMsSUFBSSxLQUFLLElBQUksQ0FBQyxJQUFJLFFBQVEsRUFBRTt3QkFFN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEVBQUU7NEJBQy9CLEdBQUcsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLENBQUM7eUJBQ2hDO3FCQUdKO3lCQUFNO3dCQUNILEdBQUcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7cUJBQ25DO29CQUNELE1BQU07Z0JBR1YsS0FBSyxlQUFlO29CQUNoQixJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksUUFBUSxFQUFFO3dCQUM5QyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUM7cUJBQ3BGO3lCQUFNO3dCQUNILElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUM7cUJBQzFDO29CQUVELE1BQU07Z0JBR1YsS0FBSyxrQkFBa0I7b0JBQ25CLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztvQkFDdEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUMsQ0FBQztvQkFDdEUsTUFBTSxPQUFPLEdBQUcsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7b0JBRTVFLElBQUksSUFBSSxHQUFvQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO29CQUNqRSxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLElBQUksR0FBRyxJQUFJLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztvQkFFekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO3dCQUNsQixDQUFDLEVBQUUsQ0FBQyxJQUFJO3FCQUNYLENBQUMsQ0FBQztvQkFDSCxNQUFNO2dCQUdWO29CQUNJLE9BQU8sQ0FBQyxJQUFJLENBQUMsbUJBQW1CLElBQUksQ0FBQyxJQUFJLGtCQUFrQixDQUFDLENBQUM7b0JBQzdELE1BQU07YUFDYjtTQUNKO0lBQ0wsQ0FBQzs7QUEvdkJMLHdCQWl3QkM7QUF2dkJrQixnQkFBUyxHQUFZLEtBQUssQ0FBQzs7OztBQzVGOUMsTUFBYSxLQUFLO0lBR2Q7UUFFSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUdPLElBQUk7UUFHUixDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBVyxFQUFFO1lBQ3pDLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFcEIsSUFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEdBQUcsQ0FBQztZQUM3RSxJQUFJLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUM7WUFDL0UsSUFBSSxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ25ELElBQUksT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUVsRCxNQUFNLGFBQWEsR0FBUSxDQUFDLENBQUMsYUFBYSxDQUFDO1lBQzNDLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7WUFDaEMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFOUMsSUFBSSxJQUFJLEtBQUssVUFBVSxFQUFFO2dCQUNyQixRQUFRLEdBQUcsR0FBRyxDQUFDO2dCQUNmLFNBQVMsR0FBRyxHQUFHLENBQUM7Z0JBQ2hCLE1BQU0sR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDO2FBQ3pCO1lBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsUUFBUSxHQUFHLElBQUksRUFBRSxNQUFNLEdBQUcsTUFBTSxHQUFHLFFBQVEsR0FBRyxPQUFPLEdBQUcsNEJBQTRCLEdBQUcsUUFBUSxHQUFHLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQztZQUU1SSxPQUFPLEtBQUssQ0FBQztRQUNqQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSjtBQXBDRCxzQkFvQ0M7Ozs7QUNuQ0QsNkNBQTREO0FBQzVELDZDQUFtRTtBQUNuRSxxQ0FBa0M7QUFDbEMsdUNBQWdEO0FBRWhELHVDQUE2QztBQUM3QyxxQ0FBa0M7QUFDbEMsdUNBQThDO0FBQzlDLGlDQUE4QjtBQUM5QixtQ0FBZ0M7QUFDaEMsK0JBQTRCO0FBRTVCLGlDQUFpQztBQW9CakMsTUFBYSxJQUFJO0lBaUJiO1FBbUhRLFlBQU8sR0FBRyxHQUFTLEVBQUU7WUFHekIsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBR3BELElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtnQkFJbkIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNyRCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxFQUFFLENBQUM7Z0JBRXhELGlCQUFpQixDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7b0JBQ3hCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3ZCLENBQUMsQ0FBQyxDQUFDO2dCQUVILElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBR25CLE1BQU0sZUFBZSxHQUF5QjtvQkFDMUMscUJBQXFCO29CQUNyQixpQkFBaUI7aUJBQ3BCLENBQUM7Z0JBR0YsT0FBTyxDQUFDLEdBQUcsQ0FBTyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3hEO1FBQ0wsQ0FBQyxDQUFBO1FBS08sbUJBQWMsR0FBRyxDQUFDLFFBQWdCLEVBQVEsRUFBRTtZQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUM7UUFDcEMsQ0FBQyxDQUFBO1FBS08sbUJBQWMsR0FBRyxDQUFDLFFBQWdCLEVBQVEsRUFBRTtZQUNoRCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1FBQzFDLENBQUMsQ0FBQTtRQUtPLGlCQUFZLEdBQUcsQ0FBQyxFQUFVLEVBQVEsRUFBRTtZQUN4Qyx1QkFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV2QixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3ZCLENBQUMsQ0FBQTtRQU1PLFdBQU0sR0FBRyxHQUFTLEVBQUU7WUFFeEIsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFO2dCQUNsQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUN2QixJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQzthQUMzQjtZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFdEIsT0FBTyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25CLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUVoQixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlDLHVCQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3hFLENBQUMsQ0FBQTtRQVNPLGlCQUFZLEdBQUcsR0FBUyxFQUFFO1lBRTlCLGFBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNuQixLQUFLLENBQUMsbUJBQW1CLENBQUMsZUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzVDLGVBQU0sQ0FBQyxlQUFlLENBQUMsYUFBSyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQzdCLG1CQUFXLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3RFLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0Qix1QkFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUM7WUFFakMsZUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMxQixJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNoRCxDQUFDLENBQUE7UUFsTkcsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFcEIsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFHckIsa0JBQVUsR0FBRyxNQUFNLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxDQUFDO1FBQzFDLGFBQUssR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRXpELENBQUM7SUFJTSxJQUFJO1FBRVAsdUJBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQixpQkFBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWpCLFlBQUksR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkIsZUFBTyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwQixhQUFLLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xCLGdCQUFRLEdBQUcsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQzlCLGFBQUssR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7UUFHbkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLHVCQUFVLEVBQUUsQ0FBQztRQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyw2QkFBZ0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLDZCQUFnQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7UUFNbkUsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGVBQU0sRUFBRSxDQUFDO1FBQzNCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUdyQixJQUFJLFdBQUksRUFBRSxDQUFDO1FBQ1gsSUFBSSxhQUFLLEVBQUUsQ0FBQztRQUNaLElBQUksU0FBRyxFQUFFLENBQUM7UUFDVixTQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFLWCxPQUFPLENBQUMsR0FBRyxDQUFPO1lBQ2QsSUFBSSxDQUFDLGNBQWMsRUFBRTtZQUVyQixLQUFLLENBQUMsV0FBVyxFQUFFO1NBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRzNCLElBQUksYUFBSyxFQUFFO1lBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQUU7UUFFN0IsZUFBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsRUFBRSxHQUFHLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ2xELEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUV4QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNULGVBQU8sQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFJTyxRQUFRO1FBRVosdUJBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNwQixJQUFJLHVCQUFVLENBQUMsT0FBTyxJQUFJLENBQUMsaUJBQU8sQ0FBQyxNQUFNLEVBQUU7WUFDdkMsS0FBSyxDQUFDLFdBQVcsRUFBRSxDQUFDO1NBQ3ZCO1FBRUQsTUFBTSxLQUFLLEdBQUcsZUFBTyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzlCLE1BQU0sTUFBTSxHQUFHLGVBQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVoQyxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxLQUFLLEtBQUssdUJBQVUsQ0FBQyxLQUFLLENBQUM7UUFDdkYsSUFBSSxDQUFDLGNBQWMsR0FBRyx1QkFBVSxDQUFDO1FBRWpDLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUNsQixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLHVCQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDL0Q7UUFHRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUN6QixDQUFDO0lBSU8sYUFBYTtRQUVqQixJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxFQUFFLEdBQUcsWUFBWSxDQUFDLGFBQWEsRUFBRTtZQUNqQyxVQUFVLEVBQUUsSUFBSTtTQUNuQixDQUFDLENBQUM7UUFFSCxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtnQkFDcEMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDckM7U0FDSjtRQUVELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDekMsRUFBRSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFO2dCQUN0QixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBa0ZPLGNBQWM7UUFDbEIsbUJBQVcsQ0FBQyxDQUFDLENBQUMsYUFBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3hELENBQUM7SUEwQk8sY0FBYztRQUNsQixJQUFJLE9BQU8sR0FBVyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQ2xDLFFBQVEsR0FBVyxPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sRUFDakQsV0FBVyxHQUFXLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFbEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFHL0IsSUFBSSxRQUFRLEtBQUssU0FBUyxFQUFFO1lBQ3hCLElBQUksUUFBUSxLQUFLLFdBQVcsRUFBRTtnQkFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxRQUFRLENBQUMsQ0FBQzthQUN4RDtZQUNELFFBQVEsR0FBRyxNQUFNLENBQUM7U0FDckI7UUFHRCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3BCLE9BQU8sQ0FBQyxJQUFJLENBQUMsdUNBQXVDLENBQUMsQ0FBQztTQUd6RDthQUFNLElBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDN0IsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2xGO1FBS0QsSUFBSSxJQUFJLEdBQVMsSUFBSSxlQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBR3hCLFNBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNYLElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ2xELElBQUksQ0FBQyxFQUFFLENBQUMsaUJBQVUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTlDLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUVoQixPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMxQixDQUFDO0NBQ0o7QUFuUkQsb0JBbVJDO0FBR0QsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUU7SUFDbkIsWUFBSSxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7SUFDbEIsWUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyxDQUFDOzs7O0FDeFRILHVDQUFvQztBQUNwQyw2Q0FBMEM7QUFDMUMsaUNBQWlDO0FBR2pDLFNBQWdCLFdBQVc7SUFDdkIsT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzdHLENBQUM7QUFGRCxrQ0FFQztBQUdZLFFBQUEsSUFBSSxHQUFHO0lBQ2hCLEtBQUssRUFBRSxFQUFFO0lBQ1QsR0FBRyxFQUFFLEVBQUU7SUFDUCxLQUFLLEVBQUUsRUFBRTtJQUNULElBQUksRUFBRSxFQUFFO0lBQ1IsRUFBRSxFQUFFLEVBQUU7SUFDTixLQUFLLEVBQUUsRUFBRTtJQUNULElBQUksRUFBRSxFQUFFO0lBQ1IsTUFBTSxFQUFFLEVBQUU7SUFDVixRQUFRLEVBQUUsRUFBRTtJQUNaLEdBQUcsRUFBRSxFQUFFO0lBQ1AsSUFBSSxFQUFFLEVBQUU7Q0FDWCxDQUFDO0FBR0YsU0FBZ0IsWUFBWTtJQUN4QixPQUFPLElBQUksT0FBTyxDQUFVLENBQUMsT0FBTyxFQUFFLEVBQUU7UUFDcEMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxhQUFhLEtBQUssU0FBUyxFQUFFO1lBQzlDLE9BQU8sQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDcEM7YUFBTTtZQUNILFNBQVMsQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLEdBQUcsRUFBRTtnQkFDL0IsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUNyQyxDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDO0FBVkQsb0NBVUM7QUFHRCxTQUFnQixXQUFXLENBQUMsR0FBVztJQUVuQyxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4QyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsRUFBRSxHQUFHLFFBQVEsR0FBRyxJQUFJLEVBQUUsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3RELE1BQU0sT0FBTyxHQUFHLFFBQVEsQ0FBQyxFQUFFLEdBQUcsUUFBUSxHQUFHLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDdEQsTUFBTSxPQUFPLEdBQUcsUUFBUSxHQUFHLEVBQUUsQ0FBQztJQUM5QixNQUFNLFVBQVUsR0FBRyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUU1RCxPQUFPLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3JJLENBQUM7QUFURCxrQ0FTQztBQUlELFNBQWdCLEtBQUs7SUFFakIsTUFBTSxLQUFLLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUUxQixLQUFLLENBQUMsU0FBUyxDQUFFLENBQUMsQ0FBRSxDQUFDO0lBQ3JCLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUMsZ0JBQWdCLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUMsQ0FBQyxDQUFDO0lBQ3pELFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFFLEtBQUssQ0FBQyxHQUFHLENBQUUsQ0FBQztJQUV2QyxTQUFTLE9BQU87UUFDWixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFZCxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDWixxQkFBcUIsQ0FBRSxPQUFPLENBQUUsQ0FBQztJQUNyQyxDQUFDO0lBRUQscUJBQXFCLENBQUUsT0FBTyxDQUFFLENBQUM7SUFFakMsT0FBTyxLQUFLLENBQUM7QUFDakIsQ0FBQztBQWxCRCxzQkFrQkM7QUFJRCxTQUFnQixVQUFVLENBQUMsSUFBWTtJQUNuQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUMvQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUM7SUFDbEUsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDL0MsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsT0FBTyxDQUFDO0lBRWxFLE9BQU8sT0FBTyxDQUFDLFFBQVEsRUFBRSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDekQsQ0FBQztBQVBELGdDQU9DO0FBSUQsU0FBZ0Isa0JBQWtCO0lBQzlCLElBQUksaUJBQU8sQ0FBQyxFQUFFLEVBQUU7UUFDWixDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBUSxFQUFFO1lBQ3BDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztZQUN4RCxHQUFHLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3RDLENBQUMsQ0FBQyxDQUFDO0tBQ047SUFFRCxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBUSxFQUFFO1FBQ2xDLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQztRQUN0RCxHQUFHLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ3BDLENBQUMsQ0FBQyxDQUFDO0lBRUgsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQVEsRUFBRTtRQUNyQyxHQUFHLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDNUQsR0FBRyxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN2QyxDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFqQkQsZ0RBaUJDO0FBNENELFNBQWdCLE9BQU8sQ0FBQyxDQUFDO0lBQ3JCLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDWixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQy9CLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDVCxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ1osQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUNaO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDYixDQUFDO0FBVEQsMEJBU0M7QUFHRCxTQUFnQixXQUFXO0lBQ3ZCLE1BQU0sWUFBWSxHQUFHLHVCQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNwRSxRQUFRLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLEdBQUcsTUFBTSxDQUFDLFdBQVcsR0FBRyxZQUFZLElBQUksQ0FBQyxDQUFDO0lBQ3JHLFFBQVEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDNUYsUUFBUSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEYsSUFBSSxJQUFJLEdBQUcsQ0FBQyx1QkFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7SUFDMUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsY0FBTyxDQUFDLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQ3ZELENBQUM7QUFQRCxrQ0FPQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLEVBQVU7SUFDMUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDM0MsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUpELGtEQUlDO0FBR0QsU0FBZ0Isb0JBQW9CLENBQUMsRUFBVTtJQUMzQyxJQUFJLFFBQVEsR0FBRyxpQkFBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7SUFDakQsSUFBSSxHQUFHLEdBQUcsaUJBQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDO0lBQ3ZDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUN4QyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDO1FBSVYsVUFBVSxFQUFFLFFBQVE7UUFDcEIsYUFBYSxFQUFFLEtBQUs7UUFDcEIsT0FBTyxFQUFFLE1BQU07UUFDZixjQUFjLEVBQUUsTUFBTTtLQUN6QixDQUFDLENBQUM7QUFFUCxDQUFDO0FBZEQsb0RBY0M7QUFHWSxRQUFBLFlBQVksR0FBRztJQUN4QixlQUFlLEVBQUU7UUFDYixJQUFJLEVBQUUsOEJBQThCO1FBQ3BDLElBQUksRUFBRSxrQ0FBa0M7S0FDM0M7SUFDRCxnQkFBZ0IsRUFBRTtRQUNkLElBQUksRUFBRSxnQkFBZ0I7UUFDdEIsSUFBSSxFQUFFLGtCQUFrQjtLQUMzQjtJQUNELGFBQWEsRUFBRTtRQUNYLElBQUksRUFBRSxzQ0FBc0M7UUFDNUMsSUFBSSxFQUFFLHNDQUFzQztLQUMvQztDQUNKLENBQUM7Ozs7QUMvTUYsMkNBQXdDO0FBV3hDLE1BQWEsS0FBTSxTQUFRLHFCQUFTO0lBbUNoQyxZQUFzQixJQUFZLEVBQVksT0FBUTtRQUNsRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFETSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVksWUFBTyxHQUFQLE9BQU8sQ0FBQztRQTdCOUMsV0FBTSxHQUFRO1lBQ2xCLEdBQUcsRUFBRSxDQUFDO1lBQ04sSUFBSSxFQUFFLEVBQUU7WUFDUixLQUFLLEVBQUUsRUFBRTtZQUNULE1BQU0sRUFBRSxFQUFFO1NBQ2IsQ0FBQztRQUNNLFVBQUssR0FBUTtZQUNqQixHQUFHLEVBQUUsQ0FBQztZQUNOLElBQUksRUFBRSxDQUFDO1lBQ1AsS0FBSyxFQUFFLENBQUM7WUFDUixNQUFNLEVBQUUsQ0FBQztZQUNULE1BQU0sRUFBRSxDQUFDO1lBQ1QsS0FBSyxFQUFFLENBQUM7U0FDWCxDQUFDO1FBRU0sV0FBTSxHQUFRO1lBQ2xCLElBQUksRUFBRSxvQkFBb0I7WUFDMUIsTUFBTSxFQUFFLFNBQVM7WUFDakIsSUFBSSxFQUFFLFNBQVM7WUFDZixJQUFJLEVBQUUsU0FBUztZQUNmLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSyxFQUFFLE1BQU07WUFDYixLQUFLLEVBQUUsU0FBUztZQUNoQixRQUFRLEVBQUUsU0FBUztZQUNuQixHQUFHLEVBQUUsU0FBUztTQUNqQixDQUFBO1FBRU8sZUFBVSxHQUEwQixFQUFFLENBQUM7UUFjeEMsV0FBTSxHQUFHLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxVQUF3QixFQUFFLFNBQW1CLEVBQVEsRUFBRTtZQUM5RixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFFNUMsSUFBSSxDQUFDLEtBQUssR0FBRztnQkFDVCxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHO2dCQUNwQixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUN0QixLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJO2dCQUMvRCxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO2dCQUMvQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNO2dCQUNqRSxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLO2FBQ2xFLENBQUM7WUFFRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU1QixDQUFDLENBQUM7UUEyQk0sZUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDN0IsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuQyxPQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRXZHLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDN0M7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7YUFDNUM7UUFDTCxDQUFDLENBQUE7UUFFTyxTQUFJLEdBQUcsR0FBUyxFQUFFO1lBQ3RCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDZCxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBRSxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO1FBQ3ZFLENBQUMsQ0FBQTtRQWlETyxjQUFTLEdBQUcsQ0FBQyxJQUFvQixFQUFRLEVBQUU7WUFDL0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7WUFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1lBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztZQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBRXJCLElBQUksQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO29CQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdEUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztpQkFDckI7WUFDTCxDQUFDLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFBO1FBbklHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQy9DLElBQUksQ0FBQyxNQUFNLEdBQXNCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFzQk8sZ0JBQWdCO1FBRXBCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ3RCLE1BQU0sUUFBUSxHQUFtQjtnQkFDN0IsUUFBUSxFQUFFLENBQUM7Z0JBQ1gsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO2dCQUM3QixLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6QyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQzFDLENBQUM7WUFFRixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNuQyxDQUFDLENBQUMsQ0FBQztRQUNILE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFLTyxJQUFJO1FBRVIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQXFCTyxNQUFNO1FBSVYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztRQUN6QyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQzdFLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFFLENBQUM7UUFDbEcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVsQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLENBQUM7UUFDckQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUUsQ0FBQztRQUMxRSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWxCLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztRQUN0QixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDeEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSSxHQUFHLENBQUM7UUFDUixNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDbkMsR0FBRyxHQUFHLEVBQUUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1lBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQzVCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLGdDQUFnQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1lBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxhQUFhLENBQUMsQ0FBQztZQUM5RyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFDO1lBQzlGLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLENBQUM7WUFDbkgsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNyQjtRQUdELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ25DLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDO1lBQzVCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLGdDQUFnQyxDQUFDO1lBQ2pELElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUM7WUFDaEwsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUNyQjtJQUVMLENBQUM7SUFvQk8sWUFBWSxDQUFDLEVBQVUsRUFBRSxTQUFrQjtRQUMvQyxNQUFNLEdBQUcsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsRUFBRTtZQUN6QixRQUFRLEVBQUUsR0FBRztZQUNiLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ3RCLENBQUMsQ0FBQztJQUNQLENBQUM7SUFHTyxXQUFXLENBQUMsSUFBbUI7UUFDbkMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxDQUFDO1FBRWhCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFHO1lBQ25DLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sRUFBRTtnQkFDbkIsT0FBTyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNyQjtTQUNKO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQUVPLE9BQU8sQ0FBQyxJQUFJO1FBQ2hCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDdkMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDO1FBRWIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDbEMsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3BHLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDbEI7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7SUFFTyxRQUFRLENBQUMsS0FBYTtRQUMxQixJQUFJLEdBQUcsQ0FBQztRQUVSLEtBQUssTUFBTSxRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNoQyxJQUFJLEtBQUssS0FBSyxRQUFRLEVBQUU7Z0JBQ3BCLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQy9CO1NBQ0o7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNmLENBQUM7Q0FDSjtBQXpORCxzQkF5TkM7Ozs7QUNwT0Qsd0NBQXFDO0FBR3JDLE1BQWEsZUFBZTs7QUFBNUIsMENBRUM7QUFEMEIsc0JBQU0sR0FBVyxRQUFRLENBQUM7QUFHckQsTUFBc0IsU0FBVSxTQUFRLGlCQUFPO0lBRzNDLFlBQXNCLElBQVksRUFBWSxPQUFnQjtRQUMxRCxLQUFLLEVBQUUsQ0FBQztRQURVLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFTO1FBb0R2RCxXQUFNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLFVBQXdCLEVBQUUsU0FBbUIsRUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBbERuRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1NBQUU7UUFDL0QsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFJTSxhQUFhO1FBQ2hCLE9BQU8sRUFBRSxDQUFDO0lBQ2QsQ0FBQztJQUlNLE9BQU87UUFDVixPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0lBSU0sU0FBUyxDQUFDLEtBQWMsRUFBRSxLQUFjLElBQVUsQ0FBQztJQUluRCxVQUFVO1FBSWIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBWWpDLENBQUM7SUFJTSxPQUFPLEtBQVcsQ0FBQztJQUluQixNQUFNLEtBQVcsQ0FBQztJQVFsQixPQUFPO1FBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzdCLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDaEIsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQWhFRCw4QkFnRUM7Ozs7QUN2RUQsMkNBQXdDO0FBS3hDLE1BQWEsU0FBVSxTQUFRLHFCQUFTO0lBT3BDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBVy9DLFdBQU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsVUFBd0IsRUFBRSxTQUFtQixFQUFRLEVBQUU7UUFFbEcsQ0FBQyxDQUFDO1FBTU0sZ0JBQVcsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGNBQWM7b0JBQ3pFLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7d0JBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO29CQUN0QixDQUFDO2lCQUNKLENBQUMsQ0FBQzthQUNOO2lCQUFNO2dCQUNILElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNyQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGNBQWM7b0JBQ2xFLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQzNCLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2FBQ047UUFDTCxDQUFDLENBQUE7UUFoQ0csSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQU9PLElBQUk7UUFDUixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBcUJPLFlBQVk7UUFDaEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUVKO0FBakRELDhCQWlEQzs7OztBQ3RERCwyQ0FBd0M7QUFFeEMsa0NBQWdDO0FBR2hDLE1BQWEsUUFBUyxTQUFRLHFCQUFTO0lBUW5DLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBSjlDLFdBQU0sR0FBWSxLQUFLLENBQUM7UUF1QnhCLFdBQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ25CLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDekIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQTtRQW9CTywyQkFBc0IsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQ3pDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ2xDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUFFLE9BQU87YUFBRTtZQUN2RSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO2dCQUM1QyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7YUFDdEI7UUFDTCxDQUFDLENBQUE7UUFFTyxnQkFBVyxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDeEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVqRCxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzdDLENBQUMsQ0FBQTtRQTFERyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDakQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUU1QyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFHTyxJQUFJO1FBQ1IsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDekQsV0FBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDeEUsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN6RSxDQUFDO0lBU08sVUFBVSxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO0lBQ0wsQ0FBQztJQUVPLFdBQVc7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDdkI7SUFDTCxDQUFDO0NBc0JKO0FBdEVELDRCQXNFQzs7OztBQzNFRCwyQ0FBd0M7QUFLeEMsTUFBYSxPQUFRLFNBQVEscUJBQVM7SUFZbEMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFIOUMsWUFBTyxHQUFrQixFQUFFLENBQUM7UUFpQjdCLFdBQU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsVUFBd0IsRUFBRSxTQUFtQixFQUFRLEVBQUU7WUFDOUYsVUFBVSxDQUFDLEdBQUcsRUFBRTtnQkFDWixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3pELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDO1FBV00sbUJBQWMsR0FBRyxHQUFTLEVBQUU7WUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUVoSCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7Z0JBQzVCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2hELENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7WUFFekIsSUFBSSxXQUFXLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDbEM7UUFDTCxDQUFDLENBQUE7UUFHTyxlQUFVLEdBQUcsR0FBUyxFQUFFO1lBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUMxQixDQUFDLENBQUE7UUFHTyxpQkFBWSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDekIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUVuQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUVuRCxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7b0JBQ25CLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUMxQyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztpQkFDN0I7YUFDSjtpQkFBTTtnQkFDSCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUNqRDtRQUNMLENBQUMsQ0FBQTtRQUdPLGVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3ZCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBRXRCLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDdEQ7aUJBQU07Z0JBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFFL0csSUFBSSxVQUFVLEVBQUU7b0JBQ1osSUFBSSxDQUFDLHNCQUFzQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7aUJBQ3pEO2dCQUNELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzlCO1FBQ0wsQ0FBQyxDQUFBO1FBcEZHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNuRCxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBVU8sSUFBSTtRQUNSLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzdELElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFnRU8sWUFBWSxDQUFDLEVBQVU7UUFDM0IsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ3hCLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzVDLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ3JGLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDckM7SUFDTCxDQUFDO0lBR08sY0FBYztRQUNsQixJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNoRCxDQUFDO0lBRU8sc0JBQXNCLENBQUMsR0FBVyxFQUFFLEtBQW9CO1FBQzVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyRCxJQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsRUFBRTtZQUNaLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3ZCLEdBQUcsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDaEM7UUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUdPLGlCQUFpQixDQUFDLEdBQVcsRUFBRSxLQUFvQjtRQUN2RCxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUM3QixHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBRUo7QUFuSUQsMEJBbUlDOzs7O0FDeElELDJDQUF3QztBQWlCeEMsTUFBYSxPQUFRLFNBQVEscUJBQVM7SUFvQmxDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBbEI5QyxTQUFJLEdBQXFCLEVBQUUsQ0FBQztRQUU1QixjQUFTLEdBQWUsRUFBRSxDQUFDO1FBRTNCLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFDdkIsYUFBUSxHQUFXLEVBQUUsQ0FBQztRQUN0QixhQUFRLEdBQVcsRUFBRSxDQUFDO1FBQ3RCLGNBQVMsR0FBVyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDbEQsaUJBQVksR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3RDLGFBQVEsR0FBUTtZQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUTtZQUN4QyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUTtTQUM3QyxDQUFDO1FBQ00saUJBQVksR0FBVyxDQUFDLENBQUM7UUFDekIsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFFMUIsb0JBQWUsR0FBNkIsRUFBRSxDQUFDO1FBc0JoRCxXQUFNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLFVBQXdCLEVBQUUsU0FBbUIsRUFBUSxFQUFFO1FBRWxHLENBQUMsQ0FBQztRQW5CRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDdkIsTUFBTSxRQUFRLEdBQWM7Z0JBQ3hCLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDMUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUMxQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDN0IsQ0FBQztZQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBSTNFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBT08sSUFBSTtRQUVSLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFTyxnQkFBZ0I7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFFOUIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzVCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBR3BCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLFdBQVcsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLEtBQWEsRUFBRSxLQUFhO1FBQzNFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDaEUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDO1FBRW5GLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBSWpDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtZQUNiLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDakIsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNkLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3hCLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkYsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzNFLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1NBQzNEO1FBV0QsSUFBSSxHQUFzQjtZQUN0QixZQUFZLEVBQUUsWUFBWTtZQUMxQixVQUFVLEVBQUUsVUFBVTtZQUN0QixTQUFTLEVBQUUsU0FBUztZQUNwQixPQUFPLEVBQUUsT0FBTztTQUNuQixDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNSLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1lBQ1YsbUJBQW1CLEVBQUUsWUFBWTtZQUNqQyxpQkFBaUIsRUFBRSxVQUFVO1lBQzdCLGdCQUFnQixFQUFFLFNBQVM7WUFDM0IsY0FBYyxFQUFFLE1BQU0sR0FBRyxPQUFPO1lBQ2hDLGVBQWUsRUFBRSxLQUFLO1NBQ3pCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFHckQsQ0FBQztDQUVKO0FBbEhELDBCQWtIQzs7OztBQ25JRCwyQ0FBd0M7QUFFeEMsa0NBQWdDO0FBR2hDLE1BQWEsS0FBTSxTQUFRLHFCQUFTO0lBUWhDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBSjlDLFdBQU0sR0FBWSxLQUFLLENBQUM7UUFzQnhCLFdBQU0sR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ25CLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDLENBQUE7UUFvQk8sMkJBQXNCLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUN6QyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFBRSxPQUFPO2FBQUU7WUFDdkUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDNUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQ3RCO1FBQ0wsQ0FBQyxDQUFBO1FBRU8sZ0JBQVcsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3hCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFakQsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRTdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUE7UUFyREcsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBRWxELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBR08sSUFBSTtRQUNSLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdELFdBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDbEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBUU8sVUFBVSxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3BCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNkLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1NBQ3RCO0lBQ0wsQ0FBQztJQUVPLFdBQVc7UUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEMsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7U0FDdkI7SUFDTCxDQUFDO0NBbUJKO0FBakVELHNCQWlFQzs7OztBQ3RFRCxrQ0FBa0M7QUFDbEMsOENBQW9FO0FBQ3BFLDJDQUF3QztBQUN4QyxtQ0FBZ0U7QUFVaEUsTUFBYSxNQUFPLFNBQVEscUJBQVM7SUFlakMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFYOUMsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUNuQixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBT2xCLFdBQU0sR0FBVyxFQUFFLENBQUM7UUFrRHJCLFdBQU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsVUFBVyxFQUFFLFNBQW1CLEVBQVEsRUFBRTtZQUNqRixJQUFJLFVBQVUsQ0FBQyxLQUFLLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxlQUFlLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEtBQUssVUFBVSxDQUFDLEVBQUU7Z0JBQUUsT0FBTzthQUFFO1lBQ25ILElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ2xELElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDL0MsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQy9CLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUMsQ0FBQztRQXVDTSxZQUFPLEdBQUcsQ0FBQyxDQUFvQixFQUFRLEVBQUU7WUFDN0MsSUFBSSxDQUFDLENBQUMsU0FBUyxLQUFLLE1BQU0sSUFBSSxDQUFDLENBQUMsU0FBUyxLQUFLLE9BQU8sRUFBRTtnQkFFbkQsSUFBSSxDQUFDLEtBQUssQ0FBQztvQkFDUCxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDdEIsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQzthQUNuQjtRQUNMLENBQUMsQ0FBQTtRQWpHRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ3hDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQy9ELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ2xELElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNyQixJQUFJLEVBQUUsRUFBRTtTQUNYLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFNMUMsSUFBSSx1QkFBVSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFNLGVBQWUsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssS0FBSyxVQUFVLENBQUMsRUFBRTtZQUNyRyxPQUFPO1NBQ1Y7UUFFRCxJQUFJLENBQUMsdUJBQVUsQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFO1lBQy9ELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztTQUNqQztRQUVELElBQUksdUJBQVUsQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEtBQUssZUFBZSxFQUFFO1lBQzdELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztTQUNqQztRQUVELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVaLE1BQU0sT0FBTyxHQUFHLHVCQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXJFLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxhQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUMvQixVQUFVLEVBQUUsSUFBSTtZQUNoQixRQUFRLEVBQUUsS0FBSztZQUNmLE9BQU8sRUFBRSxFQUFFO1lBQ1gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsWUFBWSxFQUFFLEtBQUs7U0FDdEIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsbUJBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBR2pELENBQUM7SUFZTyxJQUFJO1FBR1IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFbEIsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxRQUFRLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFELElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQ2YsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNkO0lBQ0wsQ0FBQztJQUVPLElBQUk7UUFDUixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUdPLFVBQVU7UUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtZQUFFLE9BQU87U0FBRTtRQUMzQixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUN0QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBRSxFQUFFLENBQUMsRUFBRTtnQkFDakIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztvQkFDTixPQUFPLEVBQUUsTUFBTTtvQkFDZixRQUFRLEVBQUUsTUFBTTtvQkFDaEIsYUFBYSxFQUFFLEtBQUs7b0JBQ3BCLGNBQWMsRUFBRSxLQUFLO2lCQUN4QixDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQztTQUNOO0lBQ0wsQ0FBQztJQWNPLEtBQUssQ0FBQyxHQUFXO1FBQ3JCLElBQUksR0FBRyxDQUFDO1FBRVIsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDWixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDZjthQUFNO1lBQ0gsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBSU8sWUFBWSxDQUFDLENBQUM7UUFDbEIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBQ3BCLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMscUJBQXFCLENBQUMsRUFBRTtZQUFFLE9BQVE7U0FBRTtRQUM1SSxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzVCLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFFZixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBR08sSUFBSTtRQUNSLElBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtZQUNoQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1lBQzVCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQztJQUdPLElBQUk7UUFDUixJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFO1lBQ2hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdkI7SUFDTCxDQUFDO0lBSU8sRUFBRSxDQUFDLEtBQWE7UUFFcEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7UUFDbEQsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxjQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFDNUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLFNBQVMsRUFBRyxJQUFJLEVBQUUsWUFBWSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsR0FBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXJILElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBR08sY0FBYztRQUNsQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUV6QixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVuRCxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztJQUM5QixDQUFDO0lBR08sa0JBQWtCO1FBQ3RCLElBQUksQ0FBQyx1QkFBVSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7WUFDdkQsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDckMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO1NBQ2pFO0lBQ0wsQ0FBQztJQUdPLGlCQUFpQjtRQUVyQixRQUFRLElBQUksRUFBRTtZQUVWLEtBQUssSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDO2dCQUNoQixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzVDLE1BQU07WUFFVixLQUFLLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO2dCQUNqQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDekMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQzVDLE1BQU07WUFDVjtnQkFDSSxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7U0FFbkQ7SUFDTCxDQUFDO0NBQ0o7QUFoTkQsd0JBZ05DOzs7O0FDN05ELDJDQUF3QztBQUN4QyxrQ0FBbUM7QUFHbkMsTUFBYSxLQUFNLFNBQVEscUJBQVM7SUFPaEMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFrQjlDLGNBQVMsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQzVCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQTtRQW5CRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFFM0MsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ1osSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBSU8sSUFBSTtRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFZTyxhQUFhLENBQUMsS0FBYTtRQUMvQixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxZQUFZLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNuRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNyRSxjQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDckIsQ0FBQztDQUNKO0FBeENELHNCQXdDQzs7OztBQ3pDRCx3Q0FBcUM7QUFDckMsa0NBQWtDO0FBQ2xDLGtDQUErQjtBQXdCL0IsTUFBYSxXQUFXOztBQUF4QixrQ0FJQztBQUhpQixpQkFBSyxHQUFXLE9BQU8sQ0FBQztBQUN4QixrQkFBTSxHQUFXLFFBQVEsQ0FBQztBQUMxQixlQUFHLEdBQVcsS0FBSyxDQUFDO0FBR3RDLE1BQWEsU0FBUzs7QUFBdEIsOEJBR0M7QUFGaUIsb0JBQVUsR0FBVyxHQUFHLENBQUM7QUFDekIsa0JBQVEsR0FBVyxHQUFHLENBQUM7QUFHekMsTUFBYSxlQUFlOztBQUE1QiwwQ0FPQztBQU5pQixvQkFBSSxHQUFXLE1BQU0sQ0FBQztBQUN0QixxQkFBSyxHQUFXLE9BQU8sQ0FBQztBQUN4QixrQkFBRSxHQUFXLElBQUksQ0FBQztBQUNsQixvQkFBSSxHQUFXLE1BQU0sQ0FBQztBQUN0QixvQkFBSSxHQUFXLE1BQU0sQ0FBQztBQUN0QixxQkFBSyxHQUFXLE9BQU8sQ0FBQztBQUsxQyxNQUFhLEtBQU0sU0FBUSxpQkFBTztJQTZCOUIsWUFBc0IsSUFBWSxFQUFZLE9BQXVCO1FBQ2pFLEtBQUssRUFBRSxDQUFDO1FBRFUsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQWdCO1FBM0I5RCxZQUFPLEdBQVksS0FBSyxDQUFDO1FBR3pCLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUduQixNQUFDLEdBQVcsQ0FBQyxDQUFDO1FBQ2QsTUFBQyxHQUFXLENBQUMsQ0FBQztRQUdiLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUVuQixVQUFLLEdBQXNCLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDMUMsWUFBTyxHQUFZLEtBQUssQ0FBQztRQUN6QixRQUFHLEdBQWMsSUFBSSxDQUFDO1FBRXRCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFDcEIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUVwQixhQUFRLEdBQVksS0FBSyxDQUFDO1FBc0cxQixnQkFBVyxHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDOUIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBRXBCLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQUUsT0FBTzthQUFFO1lBRTNFLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDMUQsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzFELElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUN0QixDQUFDLENBQUM7UUFJTSxnQkFBVyxHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDOUIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3BCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQ3JELElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztnQkFDckQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXZELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3pDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztpQkFDeEU7Z0JBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQUU7b0JBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2lCQUN2QjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUNwSSxDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7b0JBQ25CLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztpQkFDdEI7YUFHSjtRQUNMLENBQUMsQ0FBQztRQUlNLGNBQVMsR0FBRyxDQUFDLENBQUMsRUFBZ0IsRUFBRTtZQUNwQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNoQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBQ25CLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQixPQUFPLEtBQUssQ0FBQzthQUNoQjtZQUVELElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLGdCQUFnQixFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFFbEQsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDO1FBSU0saUJBQVksR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBSS9CLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUNyRCxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDckQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBQ3RCLENBQUMsQ0FBQztRQUlNLGdCQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUM5QixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUVoQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7Z0JBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztnQkFFaEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUN2RCxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBRXZELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLEVBQUU7b0JBQ3pDLElBQUksQ0FBQyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztpQkFDeEU7Z0JBRUQsSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQUU7b0JBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO2lCQUN2QjtnQkFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsVUFBVSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsUUFBUSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxFQUFFO29CQUVwSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7aUJBQ3RCO3FCQUFNLElBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtvQkFDakIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7aUJBQ3hCO2FBQ0o7UUFDTCxDQUFDLENBQUM7UUFJTSxlQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUM3QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFFcEIsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFFaEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQ25CO1lBQ0QsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7UUFDcEIsQ0FBQyxDQUFDO1FBcE1FLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUNyQixVQUFVLEVBQUUsSUFBSTtZQUNoQixRQUFRLEVBQUUsS0FBSztZQUNmLE9BQU8sRUFBRSxFQUFFO1lBQ1gsWUFBWSxFQUFFLEtBQUs7WUFDbkIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsT0FBTyxFQUFFLElBQUk7U0FDaEIsRUFBRSxPQUFPLElBQUksRUFBRSxDQUFDLENBQUM7UUFFbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRS9FLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztRQUNwQixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUMvQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUlNLE9BQU87UUFDVixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ2xCLENBQUM7SUFJTSxNQUFNLENBQUMsTUFBZTtRQUN6QixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsTUFBTSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQztJQUN4QixDQUFDO0lBSU0sR0FBRztRQUNOLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDaEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ2hCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO1NBQ25CO0lBQ0wsQ0FBQztJQUlNLE1BQU07UUFDVCxNQUFNLEVBQUUsR0FBRyxNQUFNLENBQUMsV0FBVyxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsQ0FBQztRQUNwRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQy9DLENBQUM7SUFJTyxZQUFZO1FBQ2hCLElBQUksZUFBZSxHQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUM7UUFDN0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7SUFJTyxJQUFJO1FBRVIsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFO1lBQzdCLElBQUksQ0FBQyxRQUFRO2lCQUNSLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFN0MsSUFBSSxDQUFDLElBQUk7aUJBQ0osRUFBRSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxXQUFXLENBQUM7aUJBQ3ZDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQztpQkFDbkMsRUFBRSxDQUFDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMvQztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRTtZQUM3QixJQUFJLENBQUMsUUFBUTtpQkFDUixFQUFFLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRS9DLElBQUksQ0FBQyxJQUFJO2lCQUNKLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFFN0MsV0FBSTtpQkFDQyxHQUFHLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7aUJBQ3hCLEVBQUUsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUN6RDtJQUNMLENBQUM7SUFJTyxNQUFNO1FBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEIsV0FBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUErR08sVUFBVTtRQUVkLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBRWhCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO1lBQ2hCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO1lBRWhCLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRTtnQkFDNUIsTUFBTSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUNwQixDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJO2dCQUM5QyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHO2dCQUM3QyxRQUFRLEVBQUUsSUFBSTthQUNqQixDQUFDLENBQUM7WUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztTQUN4QztJQUNMLENBQUM7SUFJTyxXQUFXO1FBRWYsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFDbEQsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFFdkQsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWCxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVYLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRTtZQUM3QixNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDcEIsTUFBTSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNmLFFBQVEsRUFBRSxJQUFJO1NBQ2pCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFJTyxRQUFRO1FBQ1osSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7UUFDckIsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQy9MLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFDdkosU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLEtBQUssU0FBUyxDQUFDLFFBQVEsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNySixTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztRQUNqRSxTQUFTLEdBQUcsU0FBUyxLQUFLLGVBQWUsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7UUFFcEcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFO1lBQzFCLE1BQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUNwQixTQUFTLEVBQUUsU0FBUztZQUNwQixRQUFRLEVBQUUsSUFBSTtTQUNqQixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO0lBQ3ZELENBQUM7Q0FDSjtBQXJTRCxzQkFxU0M7Ozs7QUN0VkQsMkNBQXdDO0FBQ3hDLGtDQUErQjtBQUsvQixNQUFhLE9BQVEsU0FBUSxxQkFBUztJQU1sQyxZQUFzQixJQUFZLEVBQVksT0FBUTtRQUNsRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFETSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVksWUFBTyxHQUFQLE9BQU8sQ0FBQztRQXdCOUMsaUJBQVksR0FBRyxHQUFTLEVBQUU7WUFDOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2Y7UUFHTCxDQUFDLENBQUE7UUFFTyxpQkFBWSxHQUFHLEdBQVMsRUFBRTtZQUM5QixJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2IsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2hCO1FBQ0wsQ0FBQyxDQUFBO1FBRU8seUJBQW9CLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUN2QyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBT25CLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNkLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUNmO2lCQUFNO2dCQUNILElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNoQjtRQUNMLENBQUMsQ0FBQztRQUlNLDJCQUFzQixHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDekMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRztnQkFDN0MsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2hCO1FBQ0wsQ0FBQyxDQUFDO1FBekRFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzFGLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBSU8sSUFBSTtRQUNSLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUU1RCxJQUFJLENBQUMsSUFBSTthQUNKLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQzthQUMxRCxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUVsRSxXQUFJLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUV0RCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDYixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7U0FDdkQ7SUFDTCxDQUFDO0lBMENPLElBQUk7UUFDUixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUVuQixVQUFVLENBQUUsR0FBRyxFQUFFO1lBQ2IsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRVIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQzdEO1FBRUQsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNaLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDYixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEI7UUFDTCxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDYixDQUFDO0lBSU8sS0FBSztRQUNULElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRWpDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUNoRTtJQUNMLENBQUM7Q0FDSjtBQWxHRCwwQkFrR0M7Ozs7QUMxR0Qsd0NBQXFDO0FBRXJDLHVEQUFxRTtBQUVyRSx3Q0FBd0M7QUFDeEMsa0NBQWlEO0FBRWpELE1BQWEsVUFBVTs7QUFBdkIsZ0NBSUM7QUFIMEIsbUJBQVEsR0FBVyxVQUFVLENBQUM7QUFDOUIsbUJBQVEsR0FBVyxVQUFVLENBQUM7QUFDOUIsaUJBQU0sR0FBVyxRQUFRLENBQUM7QUFHckQsTUFBYSxJQUFLLFNBQVEsaUJBQU87SUFRN0IsWUFBc0IsSUFBWSxFQUFFLE9BQVE7UUFFeEMsS0FBSyxFQUFFLENBQUM7UUFGVSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBTjNCLGVBQVUsR0FBcUIsRUFBRSxDQUFDO1FBK0xqQyxzQkFBaUIsR0FBRyxDQUFDLEVBQUUsRUFBUSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUE7UUF6TEcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU5QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBUU0sT0FBTztRQUVWLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBb0MsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNwSCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFaEIsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25DLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1NBQ3JEO1FBQ0QsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7WUFDcEIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDL0I7UUFFRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQW1DLEVBQUUsS0FBZ0MsRUFBRSxFQUFFO2dCQUMzRixJQUFJLFFBQVEsR0FBVyxRQUFRLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUN6RSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQVFNLE9BQU87UUFFVixJQUFJLE9BQU8sR0FBWSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQy9CLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQyxNQUFNLGdCQUFnQixHQUFZLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEMsT0FBTyxHQUFHLElBQUksQ0FBQzthQUNsQjtTQUNKO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQVFNLFNBQVMsQ0FBQyxLQUFjO1FBQzNCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBRzVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDMUM7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDZixRQUFRLEVBQUUsR0FBRztZQUNiLE9BQU8sRUFBRSxDQUFDO1lBQ1YsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDYixJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQVNNLFVBQVU7UUFDYixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUVuQyxZQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztRQUM3QyxJQUFJLG9CQUFvQixHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzdELElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDZixRQUFRLEVBQUUsR0FBRztnQkFDYixVQUFVLEVBQUUsR0FBUyxFQUFFO29CQUNuQixPQUFPLEVBQUUsQ0FBQztvQkFDVixZQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUNELE9BQU8sRUFBRSxDQUFDO2FBQ2IsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLG1CQUFtQixHQUF5QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBaUIsRUFBRTtZQUN2RixPQUFzQixHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFHSCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBRXpDLElBQUksV0FBVyxHQUF5QixtQkFBbUIsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUV6RixPQUFPLENBQUMsR0FBRyxDQUFPLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUM1QyxPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBUU0sT0FBTztRQUNWLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQU1NLE1BQU07UUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFVTSxNQUFNLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxVQUF1QixFQUFFLFNBQW1CO1FBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFPTSxPQUFPO1FBQ1YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUdyQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUlTLGVBQWUsQ0FBQyxXQUFtQjtRQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLGFBQWEsR0FBVyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRzNELElBQUksYUFBYSxLQUFLLFNBQVMsSUFBSSxvQkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUMxRCxNQUFNLE9BQU8sR0FBVyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUM5QyxTQUFTLEdBQWMsSUFBSSxvQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxFQUFFLENBQUMsMkJBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDaEU7aUJBQU07Z0JBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDckU7U0FDSjtJQUNMLENBQUM7SUFTTyxPQUFPLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBSTtRQUMvQixLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxVQUFVLEVBQUU7Z0JBQ3JDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7SUFFTCxDQUFDO0NBQ0o7QUFoTkQsb0JBZ05DIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xyXG5pbXBvcnQgeyBkZWJ1ZyB9IGZyb20gJy4vU2l0ZSc7XHJcblxyXG5cclxuXHJcbmRlY2xhcmUgdmFyICRib2R5O1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQXBpRGF0YSB7XHJcbiAgICB1cmw6IHN0cmluZztcclxuICAgIGJlZm9yZUNhbGw/OiBzdHJpbmc7XHJcbiAgICBjYWxsYmFjaz86IHN0cmluZztcclxuICAgIGZvcm0/OiBhbnk7XHJcbiAgICBwYXJhbXM/OiBhbnk7XHJcbiAgICBsaWtlPzogYm9vbGVhbjtcclxuICAgIGFjdGlvbj86ICdQT1NUJyB8ICdERUxFVEUnIHwgJ0dFVCcgfCAnUFVUJyB8ICdQQVRDSCc7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQVBJIHtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGJlZm9yZUNhbGxzID0ge1xyXG5cclxuICAgICAgICBsb2dpbjogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgICAgIGlmICghJGJvZHkuaGFzQ2xhc3MoJ2lzLWxvZ2dlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAkKCcuanMtbG9naW4nKS5sYXN0KCkudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG5cclxuICAgICAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgICAgIGxldCBwYXNzZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICBsZXQgJGZvcm0gPSAkZWwuaXMoJ2Zvcm0nKSA/ICRlbCA6ICRlbC5jbG9zZXN0KCdmb3JtJyk7XHJcbiAgICAgICAgICAgIGxldCAkdmFsaWRhdGlvbkVsZW0gPSAkZm9ybTtcclxuICAgICAgICAgICAgbGV0IHN0ZXBWYWxpZGF0aW9uO1xyXG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XHJcbiAgICAgICAgICAgIGlmICgkZm9ybS5oYXNDbGFzcygnaXMtZG9uZScpKSB7XHJcbiAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVDbGFzcygnaXMtZG9uZScpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyBpZiAoICEhZGF0YS5wYXJhbXMgKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoZGF0YS5wYXJhbXMudmFsaWRhdGVPbmUgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gIGRhdGEucGFyYW1zLnZhbGlkYXRlT25lO1xyXG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzdGVwVmFsaWRhdGlvbiA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy5zY3JvbGxUbyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSAgZGF0YS5wYXJhbXMuc2Nyb2xsVG87XHJcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHNjcm9sbFRvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XHJcblxyXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnW3JlcXVpcmVkXTppbnB1dCcpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubm9kZU5hbWUgPT09ICdJTlBVVCcgKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZSA9IC9eKChbXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKFxcLltePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSspKil8KFwiLitcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfV0pfCgoW2EtekEtWlxcLTAtOV0rXFwuKStbYS16QS1aXXsyLH0pKSQvO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZS50ZXN0KHZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBVdGlscy50cmFuc2xhdGlvbnNbdmFsdWUubGVuZ3RoID4gMCA/ICdpbnZhbGlkLWVtYWlsJyA6ICdyZXF1aXJlZC1maWVsZCddWydlbiddO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJChpbnB1dCkuaGFzQ2xhc3MoJ2pzLXBvc3RhbCcpKSB7bWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwaG9uZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsVGVsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbFRlbC5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ2lucHV0W25hbWU9emlwY29kZV0nKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoJChpbnB1dCkuaGFzQ2xhc3MoJ2pzLXBvc3RhbCcpICYmIHZhbC5sZW5ndGggIT0gNSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ2ludmFsaWQtemlwJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICghIXBhc3NlZCkge1xyXG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZm9ybSk7XHJcbiAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVDbGFzcygnaGFzLWVycm9ycycpO1xyXG4gICAgICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJGZvcm0uYWRkQ2xhc3MoJ2hhcy1lcnJvcnMnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIGNhbGxiYWNrcyA9IHtcclxuXHJcbiAgICAgICAgb25Db29raWVzQ2xvc2U6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcclxuICAgICAgICAgICAgJGVsLnBhcmVudCgpLmFkZENsYXNzKCdpcy1oaWRkZW4nKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgICAgICBvblN1YnNjcmliZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb25TdWJzY3JpYmUnKTtcclxuICAgICAgICAgICAgbGV0ICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XHJcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIChkYXRhLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gIGRhdGEuc2Nyb2xsVG87XHJcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyB9XHJcblxyXG5cclxuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG5cclxuICAgICAgICAgICAgaWYgKCEkbWVzc2FnZVswXSkge1xyXG4gICAgICAgICAgICAgICAgJGVsLmFwcGVuZCgnPGRpdiBjbGFzcz1cImpzLW1lc3NhZ2UgbWVzc2FnZVwiPicpO1xyXG4gICAgICAgICAgICAgICAgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IGh0bWwgPSAkKCc8cD4nICsgcmVzcG9uc2UubWVzc2FnZSArICc8L3A+Jyk7XHJcblxyXG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKS5hcHBlbmQoaHRtbCk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzdWx0KSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvbXBsZXRlZCcpO1xyXG4gICAgICAgICAgICAgICAgJGVsLnBhcmVudCgpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XHJcbiAgICAgICAgICAgICAgICAkZWwuY2xvc2VzdCgnLmpvaW4nKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dCcpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJGVsWzBdLmhhc0F0dHJpYnV0ZSgnZGF0YS1yZWRpcmVjdCcpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKCcvJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJG1lc3NhZ2UsIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dCcpLnRyaWdnZXIoJ2JsdXInKTtcclxuICAgICAgICB9LFxyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGJpbmQodGFyZ2V0PzogYW55KTogdm9pZCB7XHJcblxyXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKHR5cGVvZiB0YXJnZXQgIT09ICd1bmRlZmluZWQnID8gdGFyZ2V0IDogJ2JvZHknKTtcclxuXHJcbiAgICAgICAgJHRhcmdldC5maW5kKCdbZGF0YS1hcGldJykubm90KCdmb3JtJykub2ZmKCcuYXBpJykub24oJ2NsaWNrLmFwaScsIEFQSS5vbkFjdGlvbik7XHJcbiAgICAgICAgJHRhcmdldC5maW5kKCdmb3JtW2RhdGEtYXBpXScpLm9mZignLmFwaScpLm9uKCdzdWJtaXQuYXBpJywgQVBJLm9uQWN0aW9uKS5hdHRyKCdub3ZhbGlkYXRlJywgJ25vdmFsaWRhdGUnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgY2FsbEl0KGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgY3VzdG9tQ2FsbGJhY2s/OiBGdW5jdGlvbik6ICBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGEgPSBBUEkucHJlcHJvY2Vzc0RhdGEoZGF0YSwgJGVsKTtcclxuXHJcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IGRhdGEuYWN0aW9uIHx8ICdQT1NUJztcclxuICAgICAgICBkZWxldGUgZGF0YS5hY3Rpb247XHJcblxyXG4gICAgICAgIGNvbnN0IHVybCA9IGRhdGEudXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuICAgICAgICBkZWxldGUgZGF0YS51cmw7XHJcblxyXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAkLmFqYXgoe1xyXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXHJcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogYWN0aW9uLFxyXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcclxuICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmRvbmUoKHJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbUNhbGxiYWNrICYmIHR5cGVvZiBjdXN0b21DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xyXG5cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmZhaWwoKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignQVBJIGVycm9yOiAnICsgZSwgZGF0YSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCEhZGVidWcpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkub25TdWNjZXNzKGRhdGEsICRlbCwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgLmFsd2F5cygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBwcmVwcm9jZXNzRGF0YShkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiBJQXBpRGF0YSB7XHJcblxyXG4gICAgICAgIC8vIGdldCBkYXRhIGlmIGFwaSBjYWxsZWQgb24gZm9ybSBlbGVtZW50OlxyXG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xyXG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignYWN0aW9uJykgPyAkZWwuYXR0cignYWN0aW9uJykgOiBkYXRhLnVybDtcclxuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsICRlbC5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemVPYmplY3QoKSk7XHJcblxyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBmb3JtJywgZGF0YSwgZGF0YS5wYXJhbXMsZGF0YS5mb3JtLCAkZWwuZmluZCgnOmlucHV0JykpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSBkYXRhIGlmIGFwaSBjYWxsZWQgb24gbGluayBlbGVtZW50OlxyXG4gICAgICAgIGlmICgkZWwuaXMoJ1tocmVmXScpKSB7XHJcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdocmVmJykgPyAkZWwuYXR0cignaHJlZicpIDogZGF0YS51cmw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBnZXQgYWRkaXRpb25hbCBkYXRhIGZyb20gZXh0ZXJuYWwgZm9ybTpcclxuICAgICAgICBpZiAoZGF0YS5mb3JtICYmICQoZGF0YS5mb3JtIGFzIHN0cmluZylbMF0pIHtcclxuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsICQoZGF0YS5mb3JtIGFzIHN0cmluZykuc2VyaWFsaXplT2JqZWN0KCkpO1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5mb3JtO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZmxhdHRlbjpcclxuICAgICAgICBpZiAoZGF0YS5wYXJhbXMpIHtcclxuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsIGRhdGEucGFyYW1zKTtcclxuICAgICAgICAgICAgZGVsZXRlIGRhdGEucGFyYW1zO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBwcmUnLCBkYXRhLCBkYXRhLnBhcmFtcyk7XHJcbiAgICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25BY3Rpb24gPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgbGV0ICRlbCA9ICQoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50KTtcclxuICAgICAgICBjb25zdCBkYXRhOiBJQXBpRGF0YSA9IHsuLi4kKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYXBpJyl9O1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEsICdkYXRhJyk7XHJcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XHJcbiAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtc3VibWl0dGVkJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGVsLmNsb3Nlc3QoJ2Zvcm0nKS5hZGRDbGFzcygnaXMtc3VibWl0dGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBiZWZvcmVDYWxsIGhhbmRsZXI6XHJcbiAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsIGluIEFQSS5iZWZvcmVDYWxscykge1xyXG4gICAgICAgICAgICAgICAgQVBJLmJlZm9yZUNhbGxzW2RhdGEuYmVmb3JlQ2FsbF0oZGF0YSwgJGVsKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uU3VjY2VzcyA9IChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrIGluIEFQSS5jYWxsYmFja3MpIHtcclxuICAgICAgICAgICAgICAgIEFQSS5jYWxsYmFja3NbZGF0YS5jYWxsYmFja10oZGF0YSwgJGVsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59IiwiZXhwb3J0IGludGVyZmFjZSBJQnJlYWtwb2ludCB7XHJcbiAgICBkZXNrdG9wOiBib29sZWFuO1xyXG4gICAgdGFibGV0OiBib29sZWFuO1xyXG4gICAgcGhvbmU6IGJvb2xlYW47XHJcbiAgICB2YWx1ZTogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgbGV0IGJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xyXG5cclxuZXhwb3J0IGNsYXNzIEJyZWFrcG9pbnQge1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCBjc3NCZWZvcmUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JyksICc6YmVmb3JlJyk7XHJcbiAgICAgICAgY29uc3QgY3NzQmVmb3JlVmFsdWUgPSBjc3NCZWZvcmUuZ2V0UHJvcGVydHlWYWx1ZSgnY29udGVudCcpLnJlcGxhY2UoL1tcXFwiXFwnXS9nLCAnJyk7XHJcblxyXG4gICAgICAgIGJyZWFrcG9pbnQgPSB7XHJcbiAgICAgICAgICAgIGRlc2t0b3A6IGNzc0JlZm9yZVZhbHVlID09PSAnZGVza3RvcCcsXHJcbiAgICAgICAgICAgIHBob25lOiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ3Bob25lJyxcclxuICAgICAgICAgICAgdGFibGV0OiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ3RhYmxldCcsXHJcbiAgICAgICAgICAgIHZhbHVlOiBjc3NCZWZvcmVWYWx1ZSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZyhcIkJQOlwiLCBicmVha3BvaW50LnZhbHVlKTtcclxuICAgIH1cclxufVxyXG4iLCJleHBvcnQgbGV0IGJyb3dzZXI6IElCcm93c2VyO1xyXG5kZWNsYXJlIGxldCBvcHI7XHJcbi8vIHRzbGludDpkaXNhYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxyXG5pbnRlcmZhY2UgV2luZG93IHtcclxuICAgIG9wcjogYW55O1xyXG4gICAgb3BlcmE6IGFueTtcclxuICAgIHNhZmFyaTogYW55O1xyXG4gICAgSFRNTEVsZW1lbnQ6IGFueTtcclxufVxyXG4vLyB0c2xpbnQ6ZW5hYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxyXG5cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUJyb3dzZXIge1xyXG4gICAgbW9iaWxlPzogYm9vbGVhbjtcclxuICAgIHdpbmRvd3M/OiBib29sZWFuO1xyXG4gICAgbWFjPzogYm9vbGVhbjtcclxuICAgIGllPzogYm9vbGVhbjtcclxuICAgIGlvcz86IGJvb2xlYW47XHJcbiAgICBvcGVyYT86IGJvb2xlYW47XHJcbiAgICBmaXJlZm94PzogYm9vbGVhbjtcclxuICAgIHNhZmFyaT86IGJvb2xlYW47XHJcbiAgICBjaHJvbWU/OiBib29sZWFuO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb3dzZXIoKTogSUJyb3dzZXIge1xyXG4gICAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcclxuICAgIGJyb3dzZXIgPSB7XHJcbiAgICAgICAgbW9iaWxlOiAoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlwYWR8aXJpc3xraW5kbGV8QW5kcm9pZHxTaWxrfGxnZSB8bWFlbW98bWlkcHxtbXB8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgKGNlfHBob25lKXx4ZGF8eGlpbm8vaS50ZXN0KHVhKSB8fCAvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KHVhLnN1YnN0cigwLCA0KSkpID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgIGlvczogL2lQYWR8aVBob25lfGlQb2QvLnRlc3QodWEpLFxyXG4gICAgICAgIG1hYzogbmF2aWdhdG9yLnBsYXRmb3JtLnRvVXBwZXJDYXNlKCkuaW5kZXhPZignTUFDJykgPj0gMCxcclxuICAgICAgICBpZTogdWEuaW5kZXhPZignTVNJRSAnKSA+IDAgfHwgISF1YS5tYXRjaCgvVHJpZGVudC4qcnZcXDoxMVxcLi8pLFxyXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tYW55XHJcbiAgICAgICAgb3BlcmE6ICghISh3aW5kb3cgYXMgYW55KS5vcHIgJiYgISFvcHIuYWRkb25zKSB8fCAhISh3aW5kb3cgYXMgYW55KS5vcGVyYSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJyBPUFIvJykgPj0gMCxcclxuICAgICAgICBmaXJlZm94OiB1YS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxyXG4gICAgICAgIHNhZmFyaTogL14oKD8hY2hyb21lfGFuZHJvaWQpLikqc2FmYXJpL2kudGVzdCh1YSksXHJcbiAgICAgICAgd2luZG93czogd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3dpbicpID4gLTEsXHJcbiAgICB9O1xyXG5cclxuICAgICQoJ2h0bWwnKVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnbWFjJywgIWJyb3dzZXIud2luZG93cyAmJiAoYnJvd3Nlci5pb3MgfHwgYnJvd3Nlci5tYWMpKVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnd2luZG93cycsIGJyb3dzZXIud2luZG93cyAmJiAhYnJvd3Nlci5tYWMgJiYgIWJyb3dzZXIuaW9zKVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnbW9iaWxlJywgYnJvd3Nlci5tb2JpbGUpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdmaXJlZm94JywgYnJvd3Nlci5maXJlZm94KVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnc2FmYXJpJywgYnJvd3Nlci5zYWZhcmkpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdpZScsIGJyb3dzZXIuaWUpO1xyXG5cclxuICAgIHJldHVybiBicm93c2VyO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEJyb3dzZXIge1xyXG4gICAgcHVibGljIHN0YXRpYyB1cGRhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgYnJvd3NlciA9IGdldEJyb3dzZXIoKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBTbGlkZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvU2xpZGVyJztcclxuaW1wb3J0IHsgVG9vbHRpcCB9IGZyb20gJy4vY29tcG9uZW50cy9Ub29sdGlwJztcclxuaW1wb3J0IHsgRHJvcGRvd24gfSBmcm9tICcuL2NvbXBvbmVudHMvRHJvcGRvd24nO1xyXG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9jb21wb25lbnRzL0ZpbHRlcnMnO1xyXG5pbXBvcnQgeyBEYXNoYm9hcmQgfSBmcm9tICcuL2NvbXBvbmVudHMvRGFzaGJvYXJkJztcclxuaW1wb3J0IHsgU3RhdHMgfSBmcm9tICcuL2NvbXBvbmVudHMvU3RhdHMnO1xyXG5pbXBvcnQgeyBNYXNvbnJ5IH0gZnJvbSAnLi9jb21wb25lbnRzL01hc29ucnknO1xyXG5pbXBvcnQgeyBSYW5nZSB9IGZyb20gJy4vY29tcG9uZW50cy9SYW5nZSc7XHJcbmltcG9ydCB7IENoYXJ0IH0gZnJvbSAnLi9jb21wb25lbnRzL0NoYXJ0JztcclxuXHJcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XHJcbiAgICBTbGlkZXIsXHJcbiAgICBUb29sdGlwLFxyXG4gICAgRHJvcGRvd24sXHJcbiAgICBGaWx0ZXJzLFxyXG4gICAgRGFzaGJvYXJkLFxyXG4gICAgU3RhdHMsXHJcbiAgICBNYXNvbnJ5LFxyXG4gICAgUmFuZ2UsXHJcbiAgICBDaGFydCxcclxufTtcclxuXHJcblxyXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XHJcbiAgICBQYWdlXHJcbn07XHJcblxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2NsaXBib2FyZC5kLnRzXCIgLz5cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENvcHkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnW2RhdGEtY29weV0nKS5vbignY2xpY2snLCAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcclxuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuaW5mbygnXCIlc1wiIGNvcGllZCcsIHVybCk7XHJcblxyXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgJGVsLnJlbW92ZUNsYXNzKCdpcy1jb3BpZWQnKTsgfSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhbmRsZXIge1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGV2ZW50czogeyBba2V5OiBzdHJpbmddOiBGdW5jdGlvbltdIH07XHJcblxyXG4gICAgY29uc3RydWN0b3IgKCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgKiBAcmV0dXJuIHtIYW5kbGVyfSAgICAgICAgICAgIHJldHVybnMgY3VycmVudCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJyAmJiB0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ldmVudHNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xyXG5cclxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIHRyaWdnZXIoZXZlbnROYW1lOiBzdHJpbmcsIC4uLmV4dHJhUGFyYW1ldGVycyk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkgeyByZXR1cm47IH1cclxuICAgICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJleHBvcnQgY2xhc3MgTG9hZGVyIHtcclxuXHJcbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHdpZHRoOiBudW1iZXI7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5KSB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgeTogMCwgZHVyYXRpb246IDAuMiB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcclxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyBkdXJhdGlvbjogMC41LCB5OiAxMCwgd2lkdGg6IHRoaXMud2lkdGggfHwgJzEwMCUnIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNldChwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsneSddKTtcclxuXHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xyXG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XHJcbmltcG9ydCB7ICRib2R5LCAkYXJ0aWNsZSwgJHBhZ2VIZWFkZXIgfSBmcm9tICcuL1NpdGUnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuXHJcbi8vIGltcG9ydCB7IFNpZ251cCB9IGZyb20gJy4vU2lnbnVwJztcclxuXHJcblxyXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cclxubGV0IEhpc3RvcnlqczogSGlzdG9yeWpzID0gPGFueT5IaXN0b3J5O1xyXG4vKiB0c2xpbnQ6ZW5hYmxlOnZhcmlhYmxlLW5hbWUgZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWFueSAqL1xyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlc0V2ZW50cyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIENIQU5HRSA9ICdzdGF0ZSc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFBST0dSRVNTID0gJ3Byb2dyZXNzJztcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlcyBleHRlbmRzIEhhbmRsZXIge1xyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogUHVzaFN0YXRlcztcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVElNRV9MSU1JVCA9IDUwMDA7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBub0NoYW5nZSA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgbG9hZGVkRGF0YTogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSByZXF1ZXN0OiBYTUxIdHRwUmVxdWVzdDtcclxuICAgIHByaXZhdGUgdGltZW91dDtcclxuXHJcblxyXG5cclxuICAgIC8qKiBjaGFuZ2UgZG9jdW1lbnQgdGl0bGUgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgc2V0VGl0bGUodGl0bGU/OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBkb2N1bWVudC50aXRsZSA9IHRpdGxlIHx8ICQoJyNtYWluID4gW2RhdGEtdGl0bGVdJykuZGF0YSgndGl0bGUnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgYW5kIHRyaWdnZXIgSGlzdG9yeSAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBnb1RvKGxvY2F0aW9uOiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGxldCBwYXRobmFtZSA9IGxvY2F0aW9uLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgd2luZG93LmxvY2F0aW9uLmhvc3QsICcnKSxcclxuICAgICAgICAgICAgaXNEaWZmZXJlbnQgPSBwYXRobmFtZSAhPT0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuICAgICAgICBpZiAoTW9kZXJuaXpyLmhpc3RvcnkpIHtcclxuICAgICAgICAgICAgaWYgKCEhcmVwbGFjZSkge1xyXG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5wdXNoU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBwYXRobmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB3aW5kb3cubG9jYXRpb24ucmVwbGFjZShsb2NhdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaXNEaWZmZXJlbnQ7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogb25seSBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgd2l0aG91dCB0cmlnZ2VyaW5nIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgY2hhbmdlUGF0aChsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbiwgdGl0bGU/OiBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IHRydWU7XHJcbiAgICAgICAgbGV0IGNoYW5nZWQgPSBQdXNoU3RhdGVzLmdvVG8obG9jYXRpb24sIHJlcGxhY2UgfHwgdHJ1ZSk7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoISFjaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUodGl0bGUgfHwgZG9jdW1lbnQudGl0bGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBiaW5kIGxpbmtzIHRvIGJlIHVzZWQgd2l0aCBQdXNoU3RhdGVzIC8gSGlzdG9yeSAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IEVsZW1lbnQgfCBOb2RlTGlzdCB8IEVsZW1lbnRbXSB8IHN0cmluZywgZWxlbWVudEl0c2VsZj86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWVsZW1lbnRJdHNlbGYpIHtcclxuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGlua3ModGFyZ2V0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLmJpbmRMaW5rKHRhcmdldCBhcyBFbGVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIGdvIGJhY2sgaW4gYnJvd3NlciBoaXN0b3J5XHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uYWwgZmFsbGJhY2sgdXJsICh3aGVuIGJyb3dzZXIgZGVvZXNuJ3QgaGF2ZSBhbnkgaXRlbXMgaW4gaGlzdG9yeSlcclxuICAgICAqL1xyXG4gICAgcHVibGljIHN0YXRpYyBiYWNrKHVybD86IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDIpIHsgLy8gfHwgZG9jdW1lbnQucmVmZXJyZXIubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMuYmFjaygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodXJsKSB7XHJcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCB1cmwpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCAnLycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcmVsb2FkKCk6IHZvaWQge1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBzZXROYXZiYXJWaXNpYmlsaXR5KCk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoISRwYWdlSGVhZGVyKSB7XHJcbiAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgJGJvZHkuYWRkQ2xhc3MoJ25hdmJhci1hbHdheXMtc2hvd24nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xyXG4gICAgICAgICAgICBIaXN0b3J5anMuQWRhcHRlci5iaW5kKHdpbmRvdywgJ3N0YXRlY2hhbmdlJywgdGhpcy5vblN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsb2FkIG5ldyBjb250ZW50IHZpYSBhamF4IGJhc2VkIG9uIGN1cnJlbnQgbG9jYXRpb246XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHVybFxyXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuICAgICAgICBjb25zdCBzZWFyY2g6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHwgJyc7XHJcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHRpbWVvdXRcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIFB1c2hTdGF0ZXMuVElNRV9MSU1JVCk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXHJcbiAgICAgICAgLy8gYW5kIGRvIHRoZSByZXF1ZXN0OlxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyB0aGUgdXN1YWwgeGhyIHN0dWZmOlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXNUZXh0ICE9PSAnYWJvcnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNhdGNoaW5nIGVycm9yczpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGZ1bmN0aW9uIGNhbGxlZCBvbiBzdWNjZXNzZnVsIGRhdGEgbG9hZCAqL1xyXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YTogc3RyaW5nID0gdGhpcy5sb2FkZWREYXRhLnRyaW0oKTtcclxuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xyXG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xyXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxyXG4gICAgICAgIGlmIChjb250YWluZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlLXRyeSByZW5kZXJpbmcgaWYgbm9uZSBvZiBjb250YWluZXJzIHdlcmUgcmVuZGVyZWQ6XHJcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xyXG5cclxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2FqYXhfbG9hZGVkJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XHJcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xyXG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICQoY29udGFpbmVyKVxyXG4gICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcclxuICAgICAgICAgICAgLnNob3coKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyAqL1xyXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBiaW5kIGxpbmtzICovXHJcbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcclxuXHJcbiAgICAgICAgJCh0YXJnZXQpLmZpbmQoJ2EnKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcclxuICAgICAgICAgICAgLm5vdCgnW2Rvd25sb2FkXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZiQ9XCIuanBnXCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJ0ZWw6XCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxhbmddJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xyXG5cclxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jyk7XHJcblxyXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcclxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcclxuXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCB0aGlzLmFzaWRlVG9nZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGFzaWRlVG9nZ2xlID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBsZXQgZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcblxyXG4gICAgICAgIGVsLnRvZ2dsZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKTtcclxuXHJcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcclxuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsnd2lsbC1jaGFuZ2UnOiAndHJhbnNmb3JtJ30pO1xyXG4gICAgICAgICAgICAvLyBmaXhlZHBvc2l0aW9uID0gU2Nyb2xsLnNjcm9sbFRvcDtcclxuICAgICAgICAgICAgVXRpbHMuZGlzYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsgY2xlYXJQcm9wczogJ3dpbGwtY2hhbmdlJ30pO1xyXG4gICAgICAgICAgICBVdGlscy5lbmFibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25MYW5ndWFnZUNsaWNrID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBjb25zdCBsYW5nID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2xhbmcnKTtcclxuICAgICAgICBjb25zdCBhbHRlcm5hdGUgPSAkKCdbZGF0YS1hbHRlcm5hdGVdJykuZGF0YSgnYWx0ZXJuYXRlJyk7XHJcbiAgICAgICAgY29uc3QgYXJ0aWNsZVVSTCA9IGFsdGVybmF0ZSA/IGFsdGVybmF0ZVtsYW5nIHx8IE9iamVjdC5rZXlzKGFsdGVybmF0ZSlbMF1dIDogbnVsbDtcclxuICAgICAgICBjb25zdCBoZWFkTGluayA9ICQoJ2xpbmtbcmVsPVwiYWx0ZXJuYXRlXCJdW2hyZWZsYW5nXScpWzBdIGFzIEhUTUxMaW5rRWxlbWVudDtcclxuICAgICAgICBjb25zdCBoZWFkVVJMID0gaGVhZExpbmsgPyBoZWFkTGluay5ocmVmIDogbnVsbDtcclxuICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKGFydGljbGVVUkwgfHwgaGVhZFVSTCB8fCBlLmN1cnJlbnRUYXJnZXQuaHJlZik7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogbGlua3MgY2xpY2sgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvbkNsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgbGV0ICRzZWxmOiBKUXVlcnkgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCksXHJcbiAgICAgICAgICAgIHN0YXRlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdocmVmJykucmVwbGFjZSgnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdkYXRhLWhpc3RvcnknKTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgPT09ICdiYWNrJykge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLmJhY2soc3RhdGUpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3JlcGxhY2UnKSB7XHJcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgU2Nyb2xsLnJlc2V0U2Nyb2xsQ2FjaGUoc3RhdGUpO1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBvbiBoYXNoLWxpbmsgY2xpY2sgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIGxpbmsnKTtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBIaXN0b3J5anMgYHN0YXRlY2hhbmdlYCBldmVudCBoYW5kbGVyICovXHJcbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xyXG4gICAgICAgIGlmICghUHVzaFN0YXRlcy5ub0NoYW5nZSkge1xyXG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBtYXJrIGxpbmtzIGFzIGFjdGl2ZSAqL1xyXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVMaW5rcygpOiB2b2lkIHtcclxuICAgICAgICAkKCdhW2hyZWZdJykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICQoJ2FbaHJlZj1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9nc2FwLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9zcGxpdC10ZXh0LmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcclxuaW1wb3J0IHsgUHVzaFN0YXRlcyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XHJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xyXG4vLyBpbXBvcnQgeyBQcm9ncmVzc2JhciB9IGZyb20gJy4vY29tcG9uZW50cy9Qcm9ncmVzc2Jhcic7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcclxuaW1wb3J0IEJhY2tncm91bmQgZnJvbSAnLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcclxuaW1wb3J0IHsgJHdpbmRvdywgJGJvZHkgfSBmcm9tICcuL1NpdGUnO1xyXG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi9DbGFzc2VzJztcclxuXHJcbmludGVyZmFjZSBJQmFja2dyb3VuZERhdGEge1xyXG4gICAgaWQ6IHN0cmluZztcclxuICAgIHN0ZXA6IG51bWJlcjtcclxuICAgIGRhcmtlbjogYm9vbGVhbjtcclxuICAgIGRhcmtlbkRlbGF5OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSVNjcm9sbFBhcmFtcyBleHRlbmRzIE9iamVjdCB7XHJcbiAgICB4PzogbnVtYmVyO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIHNwZWVkPzogbnVtYmVyO1xyXG4gICAgYW5pbWF0ZT86IGJvb2xlYW47XHJcbiAgICByZWxhdGl2ZVNwZWVkPzogYm9vbGVhbjtcclxuICAgIGVhc2U/OiBzdHJpbmc7XHJcbn1cclxuXHJcblxyXG5pbnRlcmZhY2UgSUJhc2VDYWNoZUl0ZW0ge1xyXG4gICAgJGVsPzogSlF1ZXJ5O1xyXG4gICAgZG9uZT86IGJvb2xlYW47XHJcbiAgICBoZWlnaHQ/OiBudW1iZXI7XHJcbiAgICBzdGFydD86IG51bWJlcjtcclxuICAgIHR5cGU/OiBzdHJpbmc7XHJcbiAgICB5PzogbnVtYmVyO1xyXG4gICAgY29tcG9uZW50PzogQ29tcG9uZW50O1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSVNjcm9sbGluZ0RhdGEgZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICB0b3A6IG51bWJlcjtcclxuICAgIHJvbGU6IHN0cmluZztcclxuICAgIHBhdGg/OiBzdHJpbmc7XHJcbiAgICB0aXRsZT86IHN0cmluZztcclxuICAgIGJvdHRvbT86IG51bWJlcjtcclxuICAgIGNoaWxkcmVuPzogYW55O1xyXG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xyXG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XHJcbiAgICBkZWxheT86IG51bWJlcjtcclxuICAgIHNob3duPzogYm9vbGVhbjtcclxuICAgIGluaXRpYWxpemVkPzogYm9vbGVhbjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElQYXJhbGxheENhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgIHNoaWZ0PzogbnVtYmVyO1xyXG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xyXG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJQW5pbWF0aW9uQ2FjaGVJdGVtIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xyXG4gICAgZGVsYXk/OiBudW1iZXI7XHJcbiAgICB1bmNhY2hlPzogYm9vbGVhbjtcclxufVxyXG5cclxuaW50ZXJmYWNlIElTY3JvbGxDYWNoZSB7XHJcbiAgICBhbmltYXRpb25zPzogSUFuaW1hdGlvbkNhY2hlSXRlbVtdO1xyXG4gICAgcGFyYWxsYXhlcz86IElQYXJhbGxheENhY2hlSXRlbVtdO1xyXG4gICAgbW9kdWxlcz86IElCYXNlQ2FjaGVJdGVtW107XHJcbiAgICBiYWNrZ3JvdW5kcz86IElCYWNrZ3JvdW5kQ2FjaGVJdGVtW107XHJcbiAgICBzZWN0aW9ucz86IElTY3JvbGxpbmdEYXRhW107XHJcblxyXG59XHJcblxyXG5pbnRlcmZhY2UgSUJhY2tncm91bmRDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFja2dyb3VuZERhdGEsIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgIHBlcmNlbnRhZ2U/OiBudW1iZXI7XHJcbiAgICBpbmRleD86IG51bWJlcjtcclxuICAgIHNob3duPzogYm9vbGVhbjtcclxuICAgIGRlbGF5PzogbnVtYmVyO1xyXG4gICAgYnJlYWtwb2ludHM/OiBzdHJpbmdbXTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU2Nyb2xsIHtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTY3JvbGw7XHJcbiAgICBwdWJsaWMgc3RhdGljIHdpbmRvd0hlaWdodDogbnVtYmVyO1xyXG4gICAgcHVibGljIHN0YXRpYyBoZWFkZXJIZWlnaHQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBzdGF0aWMgbWF4U2Nyb2xsOiBudW1iZXI7XHJcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGVkOiBib29sZWFuO1xyXG4gICAgcHVibGljIHN0YXRpYyBzY3JvbGxUb3A6IG51bWJlcjtcclxuICAgIC8vIHB1YmxpYyBzdGF0aWMgY3VzdG9tU2Nyb2xsOiBTY3JvbGxiYXI7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBjdXN0b21TY3JvbGw7XHJcbiAgICBwcml2YXRlIHN0YXRpYyBhbmltYXRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBjYWNoZTogSVNjcm9sbENhY2hlID0ge307XHJcbiAgICBwcml2YXRlIHNjcm9sbENhY2hlID0ge307XHJcbiAgICBwcml2YXRlIGlnbm9yZUNhY2hlOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBiYWNrZ3JvdW5kczoge1trZXk6IHN0cmluZ106IEJhY2tncm91bmR9O1xyXG4gICAgcHJpdmF0ZSB0YXJnZXQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgc3RvcmVkUGF0aDogc3RyaW5nO1xyXG4gICAgcHJpdmF0ZSBzZWN0aW9uczogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBjaGFuZ2luZ1BhdGg6IGJvb2xlYW47XHJcblxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIHNjcm9sbHMgcGFnZSB0byBjZXJ0YWluIGVsZW1lbnQgKHRvcCBlZGdlKSB3aXRoIHNvbWUgc3BlZWRcclxuICAgICAqIEBwYXJhbSAge0pRdWVyeX0gICAgICAgICRlbCAgICBbdGFyZ2V0IGVsbWVudF1cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIG9mZnNldFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgZHVyYXRpb25cclxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59ICAgICAgICBbYWZ0ZXIgY29tcGxldGVkIGFuaW1hdGlvbl1cclxuICAgICAqL1xyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9FbGVtZW50KCRlbDogSlF1ZXJ5LCBvZmZzZXQ/OiBudW1iZXIsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCB5ID0gJGVsLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgKyAob2Zmc2V0IHx8IDApO1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSB7XHJcbiAgICAgICAgICAgICAgICB5OiBNYXRoLm1heChkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCwgd2luZG93LnBhZ2VZT2Zmc2V0KSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKG9iaik7XHJcbiAgICAgICAgICAgIGdzYXAudG8ob2JqLCB7XHJcbiAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogZHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBvYmoueSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlc2V0U2Nyb2xsQ2FjaGUocGF0aG5hbWUpOiB2b2lkIHtcclxuICAgICAgICBTY3JvbGwuaW5zdGFuY2UuY2FjaGVbcGF0aG5hbWVdID0gMDtcclxuICAgIH1cclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGVuYWJsZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pZ25vcmVDYWNoZSA9ICEhYnJvd3Nlci5zYWZhcmk7XHJcblxyXG4gICAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XHJcbiAgICAgICAgJCgnYVtocmVmXj1cIiNcIl06bm90KFwiLmpzLW5hdi1pdGVtLCBbZGF0YS1saWdodGJveF1cIiknKS5vbignY2xpY2snLCB0aGlzLm9uSGFzaENsaWNrSGFuZGxlcik7XHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xyXG4gICAgICAgIC8vIFNjcm9sbC5pc0N1c3RvbVNjcm9sbCA9ICQoJyN3cGJzJykuZGF0YSgnc2Nyb2xsYmFyJyk7XHJcblxyXG4gICAgICAgIFNjcm9sbC5oZWFkZXJIZWlnaHQgPSA3MDtcclxuICAgICAgICBTY3JvbGwuaW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnN0b3JlZFBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcbiAgICAgICAgdGhpcy50YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcclxuICAgICAgICB0aGlzLnNlY3Rpb25zID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXNpemUoKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLndpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gJCgnI25hdmJhcicpLmhlaWdodCgpO1xyXG4gICAgICAgIFNjcm9sbC5tYXhTY3JvbGwgPSAkKCcjbWFpbicpLm91dGVySGVpZ2h0KCkgLSBTY3JvbGwud2luZG93SGVpZ2h0ICsgU2Nyb2xsLmhlYWRlckhlaWdodDtcclxuXHJcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xyXG4gICAgcHVibGljIHN0YXRpYyBzY3JvbGxUb1BhdGgoZmFzdD86IGJvb2xlYW4pOiBib29sZWFuIHtcclxuXHJcbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQoJ1tkYXRhLXBhdGg9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpO1xyXG5cclxuICAgICAgICBpZiAoJHRhcmdldFswXSkge1xyXG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCR0YXJnZXQsIDAsIDApO1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGlmICghIXRoaXMuY2hhbmdpbmdQYXRoKSB7IHJldHVybiBmYWxzZTsgfVxyXG4gICAgICAgIHJldHVybiBTY3JvbGwuc2Nyb2xsVG9QYXRoKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0b3AoKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLmRpc2FibGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgbG9hZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnNlY3Rpb25zID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xyXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICAgICAgJHdpbmRvdy5vZmYoJy5zY3JvbGxpbmcnKS5vbignc2Nyb2xsLnNjcm9sbGluZycsICgpID0+IHRoaXMub25TY3JvbGwoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGFydCgpOiB2b2lkIHtcclxuICAgICAgICBTY3JvbGwuZW5hYmxlKCk7XHJcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlLm9uU2Nyb2xsKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jYWNoZSA9IHt9O1xyXG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAvLyBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSkge1xyXG4gICAgICAgICAgICBsZXQgb2Zmc2V0ID0gcGFyc2VJbnQoJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSwgMTApO1xyXG5cclxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSA9PT0gJ3N0cmluZycgKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvZmYgPSAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpLnJlcGxhY2UoJ3ZoJywgJycpO1xyXG4gICAgICAgICAgICAgICAgb2Zmc2V0ID0gJCh3aW5kb3cpLmhlaWdodCgpICogKHBhcnNlSW50KG9mZiwgMTApIC8gMTAwKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSwgb2Zmc2V0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGJ1aWxkQmFja2dyb3VuZHMoKToge1trZXk6IHN0cmluZ106IEJhY2tncm91bmQgfSB7XHJcbiAgICAgICAgbGV0IGJncyA9IHt9O1xyXG4gICAgICAgICQoJ1tkYXRhLWJnLWNvbXBvbmVudF0nKS50b0FycmF5KCkuZm9yRWFjaCgoZWwsIGkpID0+IHtcclxuICAgICAgICAgICAgbGV0ICRiZ0VsID0gJChlbCk7XHJcbiAgICAgICAgICAgIGxldCBiZ05hbWUgPSAkYmdFbC5kYXRhKCdiZy1jb21wb25lbnQnKTtcclxuICAgICAgICAgICAgbGV0IGJnT3B0aW9ucyA9ICRiZ0VsLmRhdGEoJ29wdGlvbnMnKTtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzW2JnTmFtZV0gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBiZyA9IG5ldyBjb21wb25lbnRzW2JnTmFtZV0oJGJnRWwsIGJnT3B0aW9ucyk7XHJcbiAgICAgICAgICAgICAgICBiZy5pZCA9IGVsLmlkO1xyXG4gICAgICAgICAgICAgICAgYmdzW2VsLmlkXSA9IGJnO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGNvbXBvbmVudCBhdmFpbGFibGUhJywgYmdOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGJncywgJ0JHUyBTQ1JPTEwnKTtcclxuICAgICAgICByZXR1cm4gYmdzO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNhdmVDYWNoZSgpOiB2b2lkIHtcclxuICAgICAgICAvLyBpZiAoIXRoaXMuZWxlbWVudHMpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY29uc3QgYW5pbWF0aW9uczogQXJyYXk8SUFuaW1hdGlvbkNhY2hlSXRlbT4gPSBbXTtcclxuICAgICAgICBjb25zdCBtYXJnaW4gPSAwIDtcclxuXHJcbiAgICAgICAgLy8gbGV0IHNlY3Rpb25zOiBBcnJheTxJU2Nyb2xsaW5nRGF0YT4gPSBbXTtcclxuICAgICAgICAvLyBpZiAodGhpcy5zZWN0aW9ucykge1xyXG5cclxuICAgICAgICAvLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlY3Rpb25zLmxlbmd0aDsgKytpKSB7XHJcbiAgICBcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gdGhpcy5zZWN0aW9ucy5lcShpKTtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJvbGUgPSAkZWwuZGF0YSgnc2Nyb2xsJyk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0b3AgPSAkZWwub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgaGVpZ2h0ID0gJGVsLm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkZWxheSA9ICRlbC5kYXRhKCdkZWxheScpIHx8IDA7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0aXRsZSA9ICRlbC5kYXRhKCd0aXRsZScpIHx8IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgcGF0aCA9ICRlbC5kYXRhKCdwYXRoJykgfHwgZmFsc2U7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkYXRhOiBJU2Nyb2xsaW5nRGF0YSA9IHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAvLyAgICAgICAgICAgICByb2xlOiByb2xlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGJvdHRvbTogdG9wICsgaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZHJlbjoge30sXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgc2hvd246ICRlbC5kYXRhKCdzaG93bicpIHx8IGZhbHNlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGRlbGF5OiBkZWxheSxcclxuICAgICAgICAvLyAgICAgICAgIH07XHJcbiAgICBcclxuICAgICAgICAvLyAgICAgICAgIHNlY3Rpb25zLnB1c2goZGF0YSk7XHJcbiAgICAgICAgLy8gICAgICAgICAkZWwuZGF0YSgnY2FjaGUnLCBpKTtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgJCgnW2RhdGEtYW5pbWF0aW9uXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiB0eXBlb2YgJGVsLmRhdGEoJ3N0YXJ0JykgIT09ICd1bmRlZmluZWQnID8gJGVsLmRhdGEoJ3N0YXJ0JykgOiAwLjEsXHJcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wIC0gbWFyZ2luLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgIGRvbmU6ICRlbC5oYXNDbGFzcygnYW5pbWF0ZWQnKSxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICRlbC5kYXRhKCdhbmltYXRpb24nKSxcclxuICAgICAgICAgICAgICAgIGRlbGF5OiAkZWwuZGF0YSgnZGVsYXknKSB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgdW5jYWNoZTogJGVsLmRhdGEoJ3VuY2FjaGUnKSxcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgY29uc3QgcGFyYWxsYXhlczogQXJyYXk8SVBhcmFsbGF4Q2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLXBhcmFsbGF4XScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJCg8SFRNTEVsZW1lbnQ+ZWwpO1xyXG4gICAgICAgICAgICBjb25zdCBwID0gJGVsLmRhdGEoJ3BhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgIHBhcmFsbGF4ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiAwLFxyXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgcCA9PT0gJ3N0cmluZycgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIHNoaWZ0OiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgYmFja2dyb3VuZHM6IEFycmF5PElCYWNrZ3JvdW5kQ2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLWJhY2tncm91bmRdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcclxuICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZERhdGEgPSAkZWwuZGF0YSgnYmFja2dyb3VuZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBicmVha3BvaW50cyA9IGJhY2tncm91bmREYXRhLmJyZWFrcG9pbnRzIHx8IFsnZGVza3RvcCcsICd0YWJsZXQnLCAncGhvbmUnXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChicmVha3BvaW50cy5pbmRleE9mKGJyZWFrcG9pbnQudmFsdWUpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iYWNrZ3JvdW5kc1tiYWNrZ3JvdW5kRGF0YS5pZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3RoZXJlXFwncyBubyBiYWNrZ3JvdW5kIHdpdGggaWQ9JyArIGJhY2tncm91bmREYXRhLmlkICsgJyEnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZHMucHVzaCgkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbDogJGVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtlbkRlbGF5OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGJhY2tncm91bmREYXRhIHx8IHt9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmNhY2hlLmFuaW1hdGlvbnMgPSBhbmltYXRpb25zO1xyXG4gICAgICAgIHRoaXMuY2FjaGUucGFyYWxsYXhlcyA9IHBhcmFsbGF4ZXM7XHJcbiAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcyA9IGJhY2tncm91bmRzO1xyXG4gICAgICAgIC8vIHRoaXMuY2FjaGUuc2VjdGlvbnMgPSBzZWN0aW9ucztcclxuXHJcblxyXG5cclxuICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uU2Nyb2xsID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoU2Nyb2xsLmRpc2FibGVkIHx8ICRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNUID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgMDtcclxuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSBTY3JvbGwud2luZG93SGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcmVlbkNlbnRlcjogbnVtYmVyID0gc1QgKyBTY3JvbGwud2luZG93SGVpZ2h0ICogMC4zMztcclxuICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBTY3JvbGwuaGVhZGVySGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcm9sbGVuZCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIHdpbmRvdy5pbm5lckhlaWdodCAtIDI7XHJcbiAgICAgICAgY29uc3QgcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSAoU2Nyb2xsLmhlYWRlckhlaWdodCAqIDIpIDogMDtcclxuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kcyA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0IDogMDtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9wID0gc1Q7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxDYWNoZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVdID0gc1Q7XHJcblxyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC13aW5kb3ctaGVpZ2h0Jywgc1QgPiB3aW5kb3dIZWlnaHQgLSAxMDApO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC1uYXZiYXInLCBzVCA+IDEwMCk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkJywgc1QgPiAwKTtcclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcsIHNUID4gcGFnZUhlYWRlcik7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWJhY2tncm91bmRzLXNjcm9sbGVkJywgc1QgPiBiYWNrZ3JvdW5kcyk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbC1lbmQnLCBzVCA+PSBzY3JvbGxlbmQpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9uczpcclxuICAgICAgICBpZiAodGhpcy5jYWNoZS5hbmltYXRpb25zICYmIHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtOiBJQW5pbWF0aW9uQ2FjaGVJdGVtID0gdGhpcy5jYWNoZS5hbmltYXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeVRvcDogbnVtYmVyID0gc1Q7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRvbmUgJiYgaXRlbVkgPD0geUJvdHRvbSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1aWNrOiBib29sZWFuID0geVRvcCA+PSBpdGVtWSArIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlKGl0ZW0sIGl0ZW0uJGVsLCBpdGVtLnR5cGUsIGl0ZW0uZGVsYXksIHF1aWNrKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLmRvbmUgJiYgaXRlbS5jb21wb25lbnQgJiYgaXRlbS50eXBlID09PSAndG9nZ2xlJyAmJiAoaXRlbVkgPiB5Qm90dG9tIHx8IGl0ZW1ZICsgaXRlbUhlaWdodCA8IHlUb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udW5jYWNoZSAmJiBpdGVtLmRvbmUgJiYgKHNUIDw9IGl0ZW1ZIC0gd2luZG93SGVpZ2h0IHx8IHNUID49IGl0ZW1ZICsgd2luZG93SGVpZ2h0ICkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykubGVuZ3RoID4gMCkgeyBpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmF0dHIoJ2RhdGEtdW5jYWNoZScpKSB7IGl0ZW0uJGVsLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIHBhcmFsbGF4ZXM6XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUucGFyYWxsYXhlcyAmJiB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoID4gMCAmJiBicmVha3BvaW50LmRlc2t0b3ApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyYWxsYXgodGhpcy5jYWNoZS5wYXJhbGxheGVzW2ldLCBzVCwgd2luZG93SGVpZ2h0LCAtaGVhZGVySGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vYmdzXHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0NlbnRlcjogbnVtYmVyID0gMC41ICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICAvLyBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAgKiB3aW5kb3dIZWlnaHQ7XHJcbiAgICAgICAgICAgIGxldCBiZ3NUb1Nob3cgPSBbXTtcclxuICAgICAgICAgICAgbGV0IGJnc1RvSGlkZSA9IFtdO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY2FjaGUuYmFja2dyb3VuZHMuZm9yRWFjaCgoaXRlbTogSUJhY2tncm91bmRDYWNoZUl0ZW0sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Cb3R0b206IG51bWJlciA9IGl0ZW1ZICsgaXRlbUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IHNUICsgaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHRoaXMuYmFja2dyb3VuZHNbaXRlbS5pZF07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWxheSA9IHR5cGVvZiBpdGVtLmRlbGF5ICE9PSAndW5kZWZpbmVkJyA/IGl0ZW0uZGVsYXkgOiAwLjE7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gLSAoaXRlbVkgLSB5Q2VudGVyKSAvIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50ID0gJGJvZHkuaGFzQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnKSA/IHNUICsgd2luZG93SGVpZ2h0ID49IGl0ZW1ZICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCA6IGl0ZW1ZIC0gc1QgPD0gd2luZG93Q2VudGVyICYmIGl0ZW1Cb3R0b20gLSBzVCA+PSB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgZGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC51cGRhdGUocGVyY2VudGFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5zZXRTdGVwKGl0ZW0uc3RlcCwgYmFja2dyb3VuZFF1aWNrU2V0dXApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmRhcmtlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmRhcmtlbihpdGVtWSA8PSB5Q2VudGVyIC0gd2luZG93SGVpZ2h0ICogaXRlbS5kYXJrZW5EZWxheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJnc1RvU2hvdy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBiZ3NUb0hpZGUucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChiZ3NUb0hpZGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBiZ3NUb0hpZGUuZm9yRWFjaCgoYmdJRCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiZ3NUb1Nob3cuaW5kZXhPZihiZ0lEKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5hbmltYXRpb25PdXQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzW2JnSURdLnNob3duPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAvLyBQcm9ncmVzc2Jhci51cGRhdGUoc1QpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFuaW1hdGUoZGF0YTogSUFuaW1hdGlvbkNhY2hlSXRlbSwgJGVsOiBKUXVlcnksIHR5cGU6IHN0cmluZywgZGVsYXk6IG51bWJlciA9IDAuMSBhcyBudW1iZXIsIHF1aWNrPzogYm9vbGVhbiwgdW5jYWNoZT86IGJvb2xlYW4pOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZSA9ICFxdWljayA/IC42IDogMDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZVVwJzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHk6IDQwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVEb3duJzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHk6IC0xMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlUmlnaHQnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeDogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVMZWZ0JzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IDEwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeDogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2lUYWJzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGxUZXh0ID0gJGVsLmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJUZXh0ID0gJGVsLmZpbmQoJ3NwYW46bGFzdC1jaGlsZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGxUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICc1MCUnLCBvcGFjaXR5OiAwIH0sIHsgeDogJzAlJywgb3BhY2l0eTogMSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHJUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICctNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdlbGVtZW50cyc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwuZmluZCgnW2RhdGEtdmlldy10YWJdJyksIHsgZHVyYXRpb246IDEsIHk6ICcxMDAlJyB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgeTogJzAlJywgc3RhZ2dlcjogMC4yLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC50bygkZWwuZmluZCgnLml0ZW1fX3RhYnMnKSwgeyBkdXJhdGlvbjogMSwgb3ZlcmZsb3c6ICd1bnNldCcgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWN0JzpcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZlRleHQgPSAkZWwuZmluZCgnLmZhY3RfX3RleHQgc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0RlR4dCA9IG5ldyBTcGxpdFRleHQoZlRleHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycyd9KSxcclxuICAgICAgICAgICAgICAgICAgICBmSW1nID0gJGVsLmZpbmQoJy5mYWN0X19pbWFnZS13cmFwJyksXHJcbiAgICAgICAgICAgICAgICAgICAgZkFyciA9ICRlbC5maW5kKCcuZmFjdF9faWNvbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAudGltZWxpbmUoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oZkFyciwgeyBkdXJhdGlvbjogMSwgcm90YXRlOiA5MCB9LCB7IHJvdGF0ZTogMCwgZGVsYXk6IDAuNSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oc3BsaXRGVHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtNSB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDEgfSwgJy09MC44JylcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGZJbWcsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEgfSwgJy09MC41Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdsZWFkJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0ID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGxpbmVzJywgbGluZXNDbGFzczogJ2xpbmUnIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZWwuZmluZCgnLmxpbmUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYWZ0ZXIoJzxicj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGxpbmVzW2ldKS5hcHBlbmQoJzxzcGFuIGNsYXNzPVwibGluZV9fYmdcIj48L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXQud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjEsIGRlbGF5OiAwLjQgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcubGluZV9fYmcnKSwgeyBkdXJhdGlvbjogMC43NSwgc2NhbGVYOiAxLCBzdGFnZ2VyOiAwLjF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwfSx7c2NhbGVYOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogZGVsYXl9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0SCA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEguY2hhcnMsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCwgb3BhY2l0eTogMCB9LCB7IHNjYWxlWDogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzLXNpbXBsZSc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdEgyID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0SDIuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHMtc2ltcGxlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMnIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhZ2dlciA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8od29yZHMud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiBzdGFnZ2VyfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbWFnZXMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ2ltZycpLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBzdGFnZ2VyOiAwLjIgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdoZXJvJzpcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgcG9pbnRlckV2ZW50czogJ25vbmUnLCBkZWxheTogMC41IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9FbGVtZW50cyA9ICRlbC5maW5kKCcuaGVyby1pbWFnZTpub3QoLmpzLXRpbnkpJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW55ID0gJGVsLmZpbmQoJy5qcy10aW55Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKHRpbnksIHsgZHVyYXRpb246IDEuNSwgb3BhY2l0eTogMCwgc3RhZ2dlcjogLTAuMDUsIGRlbGF5OiAwLjV9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oaGVyb0VsZW1lbnRzLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDEuNSwgeDogJy01MCUnLCB5OiAnNTAlJywgc3RhZ2dlcjogLTAuMDUsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgcG9pbnRlckV2ZW50czogJ2FsbCcgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdxdW90ZSc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkcXVvdGUgPSAkZWwuZmluZCgnLmpzLXF1b3RlLXdvcmRzJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkYXV0aG9yID0gJGVsLmZpbmQoJy5qcy1xdW90ZS1hdXRob3InKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0ICRsaW5lID0gJGVsLmZpbmQoJ2hyJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoWyRxdW90ZSwgJGVsLCAkYXV0aG9yXSwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gJHF1b3RlLmNoaWxkcmVuKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFF1b3RlID0gbmV3IFNwbGl0VGV4dCgkcXVvdGUsIHsgdHlwZTogJ3dvcmRzJyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGT1IgVU5DQUNIRSBPUFRJT04gT0YgQU5JTUFUSU9OIFFVT1RFXHJcbiAgICAgICAgICAgICAgICAvLyBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXRRdW90ZS53b3Jkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHNwbGl0UXVvdGUud29yZHNbaV0uY2xhc3NMaXN0LmFkZCgndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKHtcclxuICAgICAgICAgICAgICAgICAgICBhdXRvUmVtb3ZlQ2hpbGRyZW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXQoJHF1b3RlLCB7IG9wYWNpdHk6IDEgfSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGNoaWxkLCAwLjUsIHsgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIGVhc2U6ICdwb3dlcjMnIH0sICcrPScgKyBkZWxheSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbShzcGxpdFF1b3RlLndvcmRzLCAwLjUsIHsgb3BhY2l0eTogMCwgeDogOCwgdHJhbnNmb3JtT3JpZ2luOiAnMCUgMTAwJScsIGVhc2U6ICdwb3dlcjMnLCBzdGFnZ2VyOiAwLjA1IH0sIDAuMSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKCRhdXRob3IsIDAuNywgeyBvcGFjaXR5OiAwLCB4OiAtMTAgfSwgeyBvcGFjaXR5OiAxLCB4OiAwIH0sICctPScgKyAwLjMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkbGluZSwgeyBkdXJhdGlvbjogMC43LCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEgfSwgJy09MC4zJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdqb2luJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdHh0ID0gJGVsLmZpbmQoJy5qcy1sZWFkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdHR4dCA9IG5ldyBTcGxpdFRleHQodHh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0dHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaXRlbXNGYWRlJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzJykgKyAnJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldChlbGVtZW50cywgeyBvcGFjaXR5OiAwIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTEwfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjIsIGRlbGF5OiAwLjJ9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZGVvLXRleHQnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgdmlkID0gJGVsLmZpbmQoJy5qcy1jb2wtNjYnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZiA9ICRlbC5maW5kKCcuanMtY29sLTMzJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldChbdmlkLCBpbmZdLCB7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAudG8odmlkLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC4yfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhpbmYsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0yMH0sIHsgb3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDAuNH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGVhZGluZyc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoVGl0bGUgPSAkZWwuZmluZCgnLmpzLXRpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaHIgPSAkZWwuZmluZCgnLmpzLWhlYWRpbmctaHInKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRUaXRsZSA9IG5ldyBTcGxpdFRleHQoaFRpdGxlLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRUaXRsZS5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7ICBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaHIsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSwgZGVsYXk6IDAuNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3RpdGxlRmFkZUluJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlYWQgPSAkZWwuZmluZCgnLmpzLWZpeGVkLXRpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAkZWwuZmluZCgnLmpzLXN1YicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgYXJyID0gJGVsLmZpbmQoJy5qcy1hcnInKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20obGVhZCwgeyBkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMS4yLCBkZWxheTogMn0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKHN1YiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjJ9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShhcnIsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHk6IDMwLCBkZWxheTogMy43fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbnRybyc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ0YWluID0gJGVsLmZpbmQoJy5qcy1jdXJ0YWluJyk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50byhjdXJ0YWluLCB7IGR1cmF0aW9uOiAzLCBvcGFjaXR5OiAwLCBkZWxheTogMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSAnaGVhZGVyJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaHRpbWUgPSAkZWwuZmluZCgnLmpzLXRpbWUnKSxcclxuICAgICAgICAgICAgICAgICAgICBzb2NpYWxEID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX2l0ZW0nKSxcclxuICAgICAgICAgICAgICAgICAgICBzaGFyZVRleHQgPSAkZWwuZmluZCgnLnBob25lLWhpZGUgLnNvY2lhbF9fdGl0bGUnKSxcclxuICAgICAgICAgICAgICAgICAgICBoSHIgPSAkZWwuZmluZCgnLmpzLWhlYWRlci1ocicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKFtodGltZSwgc2hhcmVUZXh0LCBzb2NpYWxEXSwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTEwfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjF9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhIciwgeyBzY2FsZVg6IDB9LCB7IHNjYWxlWDogMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke3R5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgcGFyYWxsYXgoaXRlbTogSVBhcmFsbGF4Q2FjaGVJdGVtLCBzVDogbnVtYmVyLCB3aW5kb3dIZWlnaHQ6IG51bWJlciwgaGVhZGVySGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0uc2hpZnQpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gaXRlbS4kZWw7XHJcbiAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBpdGVtLnk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBweUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQ6IG51bWJlciA9ICh5IC0gc1QgKyBpdGVtLmhlaWdodCAtIGhlYWRlckhlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQocGVyY2VudCAqIGl0ZW0uc2hpZnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWU6IG51bWJlciA9ICFpdGVtLmRvbmUgPyAwIDogMC41O1xyXG4gICAgICAgICAgICAgICAgaXRlbS5kb25lID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwpO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50bygkZWwsIHtcclxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGltZSxcclxuICAgICAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kUHJvcHM6IFsneSddLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gaXRlbS4kZWw7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbFN0aWNreTogSlF1ZXJ5ID0gJGVsLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCB5OiBudW1iZXIgPSBpdGVtLnk7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBweVRvcFN0aWNreTogbnVtYmVyID0gc1QgLSAkZWxTdGlja3kuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlcm8nOlxyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGVsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICFicm93c2VyLm1vYmlsZSA/IHNUICogMC41IDogMCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmaXhlZEltYWdlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh5LCBcInlcIiwgc1QsIHB5Qm90dG9tLCB3aW5kb3dIZWlnaHQsd2luZG93SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSBweVRvcCAmJiB5IDw9IHB5Qm90dG9tKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRlbC5oYXNDbGFzcygnaGFzLXBhcmFsbGF4JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdjc3MtYW5pbWF0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuaGFzQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5JykgPyBudWxsIDogaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVsYXRpdmVQYXJhbGxheCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBpdGVtLmNoaWxkSGVpZ2h0IC0gaXRlbS5oZWlnaHQ7IC8vIHJlc2VydmUgc3BhY2VcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhTaGlmdCA9IE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCBpdGVtLmhlaWdodCArIGhlYWRlckhlaWdodCk7IC8vIE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCAod2luZG93SGVpZ2h0IC0gZGF0YS5oZWlnaHQpICogMC41ICk7IC8vIGRvIG5vdCBtb3ZlIHRvbyBtdWNoIG9uIGJpZyBzY3JlZW5zXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudCA9IChzVCAtIGl0ZW0ueSArIHdpbmRvd0hlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zWTogc3RyaW5nIHwgbnVtYmVyID0gTWF0aC5yb3VuZCgoMSAtIHBlcmNlbnQpICogbWF4U2hpZnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZIDwgMCA/IDAgOiBwb3NZO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZID4gbWF4U2hpZnQgPyBtYXhTaGlmdCA6IHBvc1k7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGNoaWxkLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IC1wb3NZLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke2l0ZW0udHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5leHBvcnQgY2xhc3MgU2hhcmUge1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLXNoYXJlXScpLm9uKCdjbGljaycsIChlKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgIGxldCB3aW5XaWR0aCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbndpZHRoJyksIDEwKSB8fCA1MjA7XHJcbiAgICAgICAgICAgIGxldCB3aW5IZWlnaHQgPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW5oZWlnaHQnKSwgMTApIHx8IDM1MDtcclxuICAgICAgICAgICAgbGV0IHdpblRvcCA9IChzY3JlZW4uaGVpZ2h0IC8gMikgLSAod2luSGVpZ2h0IC8gMik7XHJcbiAgICAgICAgICAgIGxldCB3aW5MZWZ0ID0gKHNjcmVlbi53aWR0aCAvIDIpIC0gKHdpbldpZHRoIC8gMik7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGFyZ2V0ID0gPGFueT5lLmN1cnJlbnRUYXJnZXQ7XHJcbiAgICAgICAgICAgIGNvbnN0IGhyZWYgPSBjdXJyZW50VGFyZ2V0LmhyZWY7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnc2hhcmUnKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09PSAnbGlua2VkaW4nKSB7XHJcbiAgICAgICAgICAgICAgICB3aW5XaWR0aCA9IDQyMDtcclxuICAgICAgICAgICAgICAgIHdpbkhlaWdodCA9IDQzMDtcclxuICAgICAgICAgICAgICAgIHdpblRvcCA9IHdpblRvcCAtIDEwMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oaHJlZiwgJ3NoYXJlcicgKyBkYXRhLCAndG9wPScgKyB3aW5Ub3AgKyAnLGxlZnQ9JyArIHdpbkxlZnQgKyAnLHRvb2xiYXI9MCxzdGF0dXM9MCx3aWR0aD0nICsgd2luV2lkdGggKyAnLGhlaWdodD0nICsgd2luSGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9yZWZlcmVuY2VzLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgUHVzaFN0YXRlcywgUHVzaFN0YXRlc0V2ZW50cyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xyXG5pbXBvcnQgeyBQYWdlLCBQYWdlRXZlbnRzIH0gZnJvbSAnLi9wYWdlcy9QYWdlJztcclxuaW1wb3J0IHsgQ29tcG9uZW50RXZlbnRzLCBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50JztcclxuaW1wb3J0IHsgQnJvd3NlciwgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vTG9hZGVyJztcclxuaW1wb3J0IHsgcGFnZXMsIGNvbXBvbmVudHMgfSBmcm9tICcuL0NsYXNzZXMnO1xyXG5pbXBvcnQgeyBDb3B5IH0gZnJvbSAnLi9Db3B5JztcclxuaW1wb3J0IHsgU2hhcmUgfSBmcm9tICcuL1NoYXJlJztcclxuaW1wb3J0IHsgQVBJIH0gZnJvbSAnLi9BcGknO1xyXG5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XHJcblxyXG5leHBvcnQgbGV0IHNpdGU6IFNpdGU7XHJcbmV4cG9ydCBsZXQgJGRvYzogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICR3aW5kb3c6IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkYm9keTogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRhcnRpY2xlOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJG1haW46IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0IHBpeGVsUmF0aW86IG51bWJlcjtcclxuZXhwb3J0IGxldCBkZWJ1ZzogYm9vbGVhbjtcclxuZXhwb3J0IGxldCBlYXNpbmc6IHN0cmluZztcclxuZXhwb3J0IGxldCBsYW5nOiBzdHJpbmc7XHJcbmV4cG9ydCBsZXQgZml4ZWRwb3NpdGlvbjogbnVtYmVyO1xyXG5cclxuLy8gZGVjbGFyZSBsZXQgQ3VzdG9tRWFzZTtcclxuXHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTaXRlIHtcclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2l0ZTtcclxuXHJcbiAgICBwcml2YXRlIGN1cnJlbnRQYWdlOiBQYWdlO1xyXG4gICAgcHJpdmF0ZSBwdXNoU3RhdGVzOiBQdXNoU3RhdGVzO1xyXG4gICAgcHJpdmF0ZSBzY3JvbGw6IFNjcm9sbDtcclxuICAgIHByaXZhdGUgbGFzdEJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xyXG4gICAgcHJpdmF0ZSBsb2FkZXI6IExvYWRlcjtcclxuICAgIC8vIHByaXZhdGUgaXNSZWFkeTogYm9vbGVhbjtcclxuICAgIC8vIHByaXZhdGUgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xyXG4gICAgLy8gcHJpdmF0ZSAkaGFtYnVyZ2VyOiBKUXVlcnk7XHJcbiAgICAvLyBwcml2YXRlICRwYWdlSGVhZGVyOiBKUXVlcnk7XHJcbiAgICAvLyBwcml2YXRlICRhcnRpY2xlOiBKUXVlcnk7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3NpdGUnKTtcclxuXHJcbiAgICAgICAgU2l0ZS5pbnN0YW5jZSA9IHRoaXM7XHJcbiAgICAgICAgLy8gbGFuZyA9ICQoJ2h0bWwnKS5hdHRyKCdsYW5nJyk7XHJcblxyXG4gICAgICAgIHBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xyXG4gICAgICAgIGRlYnVnID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5pbmRleE9mKCdkZWJ1ZycpID49IDA7XHJcbiAgICAgICAgLy8gZWFzaW5nID0gQ3VzdG9tRWFzZS5jcmVhdGUoJ2N1c3RvbScsICdNMCwwLEMwLjUsMCwwLjMsMSwxLDEnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBpbml0KCk6IHZvaWQge1xyXG5cclxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xyXG4gICAgICAgIEJyb3dzZXIudXBkYXRlKCk7XHJcblxyXG4gICAgICAgICRkb2MgPSAkKGRvY3VtZW50KTtcclxuICAgICAgICAkd2luZG93ID0gJCh3aW5kb3cpO1xyXG4gICAgICAgICRib2R5ID0gJCgnYm9keScpO1xyXG4gICAgICAgICRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xyXG4gICAgICAgICRtYWluID0gJCgnI21haW4nKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcyA9IG5ldyBQdXNoU3RhdGVzKCk7XHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFLCB0aGlzLm9uU3RhdGUpO1xyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5vbihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uTG9hZFByb2dyZXNzKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy4kaGFtYnVyZ2VyID0gJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xyXG4gICAgICAgIC8vIHRoaXMuJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XHJcbiAgICAgICAgLy8gdGhpcy4kcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuc2Nyb2xsID0gbmV3IFNjcm9sbCgpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyID0gbmV3IExvYWRlcigkKCcuanMtbG9hZGVyJykpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcclxuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41KTtcclxuXHJcblxyXG4gICAgICAgIG5ldyBDb3B5KCk7XHJcbiAgICAgICAgbmV3IFNoYXJlKCk7XHJcbiAgICAgICAgbmV3IEFQSSgpO1xyXG4gICAgICAgIEFQSS5iaW5kKCk7XHJcbiAgICAgICAgLy8gdGhpcy5tZW51ID0gbmV3IE1lbnUoJCgnLmpzLW1lbnUnKSk7XHJcbiAgICAgICAgLy8gdGhpcy5jb29raWVzID0gbmV3IENvb2tpZXMoJCgnLmpzLWNvb2tpZXMnKSk7XHJcblxyXG5cclxuICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihbXHJcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKSxcclxuICAgICAgICAgICAgLy8gdGhpcy5wcmVsb2FkQXNzZXRzKCksXHJcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCksXHJcbiAgICAgICAgXSkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XHJcblxyXG5cclxuICAgICAgICBpZiAoZGVidWcpIHsgVXRpbHMuc3RhdHMoKTsgfVxyXG5cclxuICAgICAgICAkd2luZG93Lm9uKCdvcmllbnRhdGlvbmNoYW5nZScsICgpID0+IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xyXG5cclxuICAgICAgICB9LCAxMDApKTtcclxuICAgICAgICAkd2luZG93Lm9uKCdyZXNpemUnLCAoKSA9PiB0aGlzLm9uUmVzaXplKCkpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblJlc2l6ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgQnJlYWtwb2ludC51cGRhdGUoKTtcclxuICAgICAgICBpZiAoYnJlYWtwb2ludC5kZXNrdG9wICYmICFicm93c2VyLm1vYmlsZSkge1xyXG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgd2lkdGggPSAkd2luZG93LndpZHRoKCk7XHJcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gJHdpbmRvdy5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhbmdlZCA9ICF0aGlzLmxhc3RCcmVha3BvaW50IHx8IHRoaXMubGFzdEJyZWFrcG9pbnQudmFsdWUgIT09IGJyZWFrcG9pbnQudmFsdWU7XHJcbiAgICAgICAgdGhpcy5sYXN0QnJlYWtwb2ludCA9IGJyZWFrcG9pbnQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UucmVzaXplKHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdGhpcy5jYWxsQWxsKCdyZXNpemUnLCB3aWR0aCwgaGVpZ2h0LCBicmVha3BvaW50LCBjaGFuZ2VkKTtcclxuICAgICAgICB0aGlzLmxvYWRlci5yZXNpemUod2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGwucmVzaXplKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHByZWxvYWRBc3NldHMoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIGxldCBhc3NldHMgPSBbXTtcclxuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQoJy5wcmVsb2FkLWJnJywge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAoYXNzZXRzICYmIGFzc2V0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNzZXRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKGFzc2V0c1tpXSwgbnVsbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGlsLmpxRGVmZXJyZWQuYWx3YXlzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBjaGVjayBpZiBhbnkgY29tcG9uZW50IGhhbmRsZSBvblN0YXRlIGV2ZW50XHJcbiAgICAvLyBpZiBub3QsIHJlbG9hZCBodG1sOlxyXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICAvLyBjb25zdCBzY3JvbGxpbmdDaGFuZ2VkU3RhdGUgPSB0aGlzLnNjcm9sbC5vblN0YXRlKCk7XHJcbiAgICAgICAgY29uc3QgcGFnZUNoYW5nZWRTdGF0ZSA9IHRoaXMuY3VycmVudFBhZ2Uub25TdGF0ZSgpO1xyXG5cclxuICAgICAgICAvLyBpZiAoIXNjcm9sbGluZ0NoYW5nZWRTdGF0ZSAmJiAhb2Zmc2NyZWVuQ2hhbmdlZFN0YXRlICYmICFwYWdlQ2hhbmdlZFN0YXRlKSB7XHJcbiAgICAgICAgaWYgKCFwYWdlQ2hhbmdlZFN0YXRlKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBBbmFseXRpY3Muc2VuZFBhZ2V2aWV3KHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBwdXNoU3RhdGVzTG9hZFByb21pc2UgPSB0aGlzLnB1c2hTdGF0ZXMubG9hZCgpO1xyXG4gICAgICAgICAgICBjb25zdCBhbmltYXRlT3V0UHJvbWlzZSA9IHRoaXMuY3VycmVudFBhZ2UuYW5pbWF0ZU91dCgpO1xyXG5cclxuICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRlci5zaG93KCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zY3JvbGwuc3RvcCgpO1xyXG5cclxuICAgICAgICAgICAgLy8gYWxsIHByb21pc2VzIGFycmF5OlxyXG4gICAgICAgICAgICBjb25zdCBsb2FkaW5nUHJvbWlzZXM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gW1xyXG4gICAgICAgICAgICAgICAgcHVzaFN0YXRlc0xvYWRQcm9taXNlLFxyXG4gICAgICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UsXHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICAvLyByZW5kZXIgaHRtbCB3aGVuIGV2ZXJ5dGhpbmcncyByZWFkeTpcclxuICAgICAgICAgICAgUHJvbWlzZS5hbGw8dm9pZD4obG9hZGluZ1Byb21pc2VzKS50aGVuKHRoaXMucmVuZGVyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBkaXNwbGF5IGFqYXggcHJvZ3Jlc3M6XHJcbiAgICBwcml2YXRlIG9uTG9hZFByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41ICogcHJvZ3Jlc3MpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gcGFzcyBsb2FkaW5nIHByb2dyZXNzIGZyb20gcGFnZSB0byBwcmVsb2FkZXI6XHJcbiAgICBwcml2YXRlIG9uUGFnZVByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41ICsgMC41ICogcHJvZ3Jlc3MpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gZGVhbCB3aXRoIG5ld2x5IGFkZGVkIGVsZW1lbnRzXHJcbiAgICBwcml2YXRlIG9uUGFnZUFwcGVuZCA9IChlbDogSlF1ZXJ5KTogdm9pZCA9PiB7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5iaW5kKGVsWzBdKTtcclxuICAgICAgICAvLyBXaWRnZXRzLmJpbmQoZWxbMF0pO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsLmxvYWQoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGNhbGxlZCBhZnRlciBuZXcgaHRtbCBpcyBsb2FkZWRcclxuICAgIC8vIGFuZCBvbGQgY29udGVudCBpcyBhbmltYXRlZCBvdXQ6XHJcbiAgICBwcml2YXRlIHJlbmRlciA9ICgpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5vZmYoKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5kZXN0cm95KCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zY3JvbGwuZGVzdHJveSgpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XHJcbiAgICAgICAgY29uc29sZS5ncm91cCgpO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMucmVuZGVyKCk7XHJcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50UGFnZSgpLnRoZW4odGhpcy5vblBhZ2VMb2FkZWQpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUoJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJykuYXR0cignY29udGVudCcpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBkZXRlY3RIb21lUGFnZSgpOiB2b2lkIHtcclxuICAgICAgICAkcGFnZUhlYWRlciA/ICRib2R5LmFkZENsYXNzKCdpcy1ob21lLXBhZ2UnKSA6IG51bGw7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIHdoZW4gY3VycmVudCBwYWdlIGlzIGxvYWRlZDpcclxuICAgIHByaXZhdGUgb25QYWdlTG9hZGVkID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vICRib2R5LnJlbW92ZUNsYXNzKCdpcy1ub3QtcmVhZHknKTtcclxuICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLmhpZGUoKTtcclxuICAgICAgICBVdGlscy5lbmFibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xyXG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJGJvZHksIDAsIDApO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UuYW5pbWF0ZUluKCk7XHJcbiAgICAgICAgJHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykgOiBudWxsO1xyXG4gICAgICAgIHRoaXMuZGV0ZWN0SG9tZVBhZ2UoKTtcclxuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcclxuICAgICAgICAvLyB0aGlzLmNvb2tpZXMudHJ5VG9TaG93KCk7XHJcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvUGF0aCh0cnVlKTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGwuc3RhcnQoKTtcclxuICAgICAgICAkKCdhcnRpY2xlJykucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWxvYWRlZCcpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gcnVuIG5ldyBQYWdlIG9iamVjdFxyXG4gICAgLy8gKGZvdW5kIGJ5IGBkYXRhLXBhZ2VgIGF0dHJpYnV0ZSlcclxuICAgIC8vIGJpbmQgaXQgYW5kIHN0b3JlIGFzIGN1cnJlbnRQYWdlOlxyXG4gICAgcHJpdmF0ZSBzZXRDdXJyZW50UGFnZSgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBsZXQgJHBhZ2VFbDogSlF1ZXJ5ID0gJCgnW2RhdGEtcGFnZV0nKSxcclxuICAgICAgICAgICAgcGFnZU5hbWU6IHN0cmluZyA9ICRwYWdlRWwuZGF0YSgncGFnZScpIHx8ICdQYWdlJyxcclxuICAgICAgICAgICAgcGFnZU9wdGlvbnM6IE9iamVjdCA9ICRwYWdlRWwuZGF0YSgnb3B0aW9ucycpO1xyXG5cclxuICAgICAgICBjb25zb2xlLmxvZygkcGFnZUVsLCBwYWdlTmFtZSk7XHJcblxyXG4gICAgICAgIC8vIHBhZ2Ugbm90IGZvdW5kOlxyXG4gICAgICAgIGlmIChwYWdlTmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGlmIChwYWdlTmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGluIFBhZ2VzIScsIHBhZ2VOYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBwYWdlTmFtZSA9ICdQYWdlJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIG1vcmUgdGhhbiBvbmUgZGF0YS1wYWdlOlxyXG4gICAgICAgIGlmICgkcGFnZUVsLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgY29uc29sZS53YXJuKCdPbmx5IG9uZSBbZGF0YS1wYWdlXSBlbGVtZW50LCBwbGVhc2UhJyk7XHJcblxyXG4gICAgICAgIC8vIHBhZ2Ugbm90IGRlZmluZWQgaW4gaHRtbDpcclxuICAgICAgICB9IGVsc2UgaWYgKCRwYWdlRWwubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgICRwYWdlRWwgPSAkKCQoJyNtYWluJykuZmluZCgnYXJ0aWNsZScpWzBdIHx8ICQoJyNtYWluJykuY2hpbGRyZW4oKS5maXJzdCgpWzBdKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgLy8gY3JlYXRlIFBhZ2Ugb2JqZWN0OlxyXG4gICAgICAgIGxldCBwYWdlOiBQYWdlID0gbmV3IHBhZ2VzW3BhZ2VOYW1lXSgkcGFnZUVsLCBwYWdlT3B0aW9ucyk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IHBhZ2U7XHJcblxyXG4gICAgICAgIC8vIGJpbmQgZXZlbnRzOlxyXG4gICAgICAgIEFQSS5iaW5kKCk7XHJcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uUGFnZVByb2dyZXNzKTtcclxuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuQ0hBTkdFLCB0aGlzLm9uUGFnZUFwcGVuZCk7XHJcblxyXG4gICAgICAgIHRoaXMub25SZXNpemUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBhZ2UucHJlbG9hZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xyXG4gICAgc2l0ZSA9IG5ldyBTaXRlKCk7XHJcbiAgICBzaXRlLmluaXQoKTtcclxufSk7XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9zdGF0cy5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL21vZGVybml6ci5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xyXG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVUlEKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gJycgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpICsgTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBrZXlzID0ge1xyXG4gICAgZW50ZXI6IDEzLFxyXG4gICAgZXNjOiAyNyxcclxuICAgIHNwYWNlOiAzMixcclxuICAgIGxlZnQ6IDM3LFxyXG4gICAgdXA6IDM4LFxyXG4gICAgcmlnaHQ6IDM5LFxyXG4gICAgZG93bjogNDAsXHJcbiAgICBwYWdlVXA6IDMzLFxyXG4gICAgcGFnZURvd246IDM0LFxyXG4gICAgZW5kOiAzNSxcclxuICAgIGhvbWU6IDM2LFxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXN0QXV0b3BsYXkoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIE1vZGVybml6ci52aWRlb2F1dG9wbGF5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgTW9kZXJuaXpyLm9uKCd2aWRlb2F1dG9wbGF5JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVG9UaW1lKHNlYzogbnVtYmVyKTogc3RyaW5nIHtcclxuXHJcbiAgICBjb25zdCB0b3RhbFNlYyA9IHBhcnNlSW50KCcnICsgc2VjLCAxMCk7XHJcbiAgICBjb25zdCBob3VycyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyAzNjAwLCAxMCkgJSAyNDtcclxuICAgIGNvbnN0IG1pbnV0ZXMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gNjAsIDEwKSAlIDYwO1xyXG4gICAgY29uc3Qgc2Vjb25kcyA9IHRvdGFsU2VjICUgNjA7XHJcbiAgICBjb25zdCBocnNEaXNwbGF5ID0gKGhvdXJzIDwgMTAgPyAnMCcgKyBob3VycyA6IGhvdXJzKSArICc6JztcclxuXHJcbiAgICByZXR1cm4gKGhvdXJzID4gMCA/IGhyc0Rpc3BsYXkgOiAnJykgKyAobWludXRlcyA8IDEwID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKHNlY29uZHMgPCAxMCA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhdHMoKTogU3RhdHMge1xyXG5cclxuICAgIGNvbnN0IHN0YXRzID0gbmV3IFN0YXRzKCk7XHJcblxyXG4gICAgc3RhdHMuc2hvd1BhbmVsKCAwICk7IC8vIDA6IGZwcywgMTogbXMsIDI6IG1iLCAzKzogY3VzdG9tXHJcbiAgICAkKHN0YXRzLmRvbSkuY3NzKHsncG9pbnRlci1ldmVudHMnOiAnbm9uZScsICd0b3AnOiAxMTB9KTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbSApO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFuaW1hdGUoKTogdm9pZCB7XHJcbiAgICAgICAgc3RhdHMuYmVnaW4oKTtcclxuICAgICAgICAvLyBtb25pdG9yZWQgY29kZSBnb2VzIGhlcmVcclxuICAgICAgICBzdGF0cy5lbmQoKTtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcclxuXHJcbiAgICByZXR1cm4gc3RhdHM7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVGb3JtYXQodGltZTogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcih0aW1lIC8gNjApLnRvU3RyaW5nKCk7XHJcbiAgICBtaW51dGVzID0gKHBhcnNlSW50KG1pbnV0ZXMsIDEwKSA+PSAxMCkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcclxuICAgIGxldCBzZWNvbmRzID0gTWF0aC5mbG9vcih0aW1lICUgNjApLnRvU3RyaW5nKCk7XHJcbiAgICBzZWNvbmRzID0gKHBhcnNlSW50KHNlY29uZHMsIDEwKSA+PSAxMCkgPyBzZWNvbmRzIDogJzAnICsgc2Vjb25kcztcclxuXHJcbiAgICByZXR1cm4gbWludXRlcy50b1N0cmluZygpICsgJzonICsgc2Vjb25kcy50b1N0cmluZygpO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJbWFnZVNvdXJjZXMoKTogdm9pZCB7XHJcbiAgICBpZiAoYnJvd3Nlci5pZSkge1xyXG4gICAgICAgICQoJ1tkYXRhLWllc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLWllc3JjJykpO1xyXG4gICAgICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWllc3JjJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgJCgnW2RhdGEtc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xyXG4gICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKCdbZGF0YS1zcmNzZXRdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3Jjc2V0JywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKSk7XHJcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKGltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWRbXT4ge1xyXG4vLyAgICAgcmV0dXJuIFByb21pc2UuYWxsKGltYWdlcy5tYXAoKGltYWdlKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbi8vICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuLy8gICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICBpbWcub25hYm9ydCA9ICgpID0+IHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgaW1nLnNyYyA9IGltYWdlO1xyXG4vLyAgICAgICAgICAgICBpZiAoaW1nLmNvbXBsZXRlICYmICQoaW1nKS5oZWlnaHQoKSA+IDApIHsgcmVzb2x2ZSgpOyByZXR1cm47IH1cclxuLy8gICAgICAgICB9KTtcclxuLy8gICAgIH0pKTtcclxuLy8gfVxyXG5cclxuXHJcblxyXG4vLyBleHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXM6IEpRdWVyeSk6IFByb21pc2U8dm9pZFtdPiB7XHJcbi8vICAgICBsZXQgaXNCYXNlNjQ6IGJvb2xlYW47XHJcbi8vICAgICBjb25zdCBpbWFnZXM6IHN0cmluZ1tdID0gJGltYWdlcy50b0FycmF5KClcclxuLy8gICAgICAgICAubWFwKChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xyXG4vLyAgICAgICAgICAgICBsZXQgaW1hZ2VTb3VyY2UgPSBpbWcuY3VycmVudFNyYyB8fCBpbWcuc3JjO1xyXG4vLyAgICAgICAgICAgICBpZiAoaW1hZ2VTb3VyY2UuaW5kZXhPZignZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcpID49IDApIHsgaXNCYXNlNjQgPSB0cnVlOyB9XHJcbi8vICAgICAgICAgICAgIHJldHVybiBpbWFnZVNvdXJjZTtcclxuLy8gICAgICAgICB9KTtcclxuXHJcbi8vICAgICAvLyBjb25zb2xlLmxvZyhpbWFnZXMpO1xyXG5cclxuLy8gICAgIGlmICghaXNCYXNlNjQpIHtcclxuLy8gICAgICAgICByZXR1cm4gcHJlbG9hZEltYWdlcyhpbWFnZXMpO1xyXG4vLyAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbi8vICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXMpLnRoZW4oKCkgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgICB9LCAyMDApO1xyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgfVxyXG4vLyB9XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGUoYSk6IEFycmF5PGFueT4ge1xyXG4gICAgbGV0IGosIHgsIGk7XHJcbiAgICBmb3IgKGkgPSBhLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcclxuICAgICAgICBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XHJcbiAgICAgICAgeCA9IGFbaV07XHJcbiAgICAgICAgYVtpXSA9IGFbal07XHJcbiAgICAgICAgYVtqXSA9IHg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRSb290VmFycygpOiB2b2lkIHtcclxuICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IGJyZWFrcG9pbnQuZGVza3RvcCA/ICQoJyNuYXZiYXInKS5oZWlnaHQoKSA6IDA7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXBwLWhlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtIGhlYWRlckhlaWdodH1weGApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC0yNScsIGAkeyQoJy5jb2wtcGF0dGVybi0yNScpLndpZHRoKCl9cHhgKTtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtNjYnLCBgJHskKCcuY29sLTY2Jykud2lkdGgoKX1weGApO1xyXG4gICAgbGV0IG1hcmcgPSAhYnJlYWtwb2ludC5kZXNrdG9wID8gNTAgOiAxMjA7XHJcbiAgICAkKCcuYXNpZGUnKS5jc3MoJ2hlaWdodCcsICR3aW5kb3cuaGVpZ2h0KCkgKyBtYXJnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xyXG4gICAgJCgnYm9keScpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XHJcbiAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XHJcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc1QpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRpc2FibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGxldCBwb3NpdGlvbiA9IGJyb3dzZXIuaWUgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJztcclxuICAgIGxldCB0b3AgPSBicm93c2VyLmllID8gJycgOiAtc1QgKyAncHgnO1xyXG4gICAgJCgnYm9keScpLmFkZENsYXNzKCdzY3JvbGxpbmctZGlzYWJsZScpO1xyXG4gICAgJCgnYm9keScpLmNzcyh7XHJcbiAgICAgICAgLy8gJ3Bvc2l0aW9uJzogcG9zaXRpb24sXHJcbiAgICAgICAgLy8gJ3RvcCc6IHRvcCxcclxuICAgICAgICAvLyAnYm90dG9tJzogJzAnLFxyXG4gICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICd3aWxsLWNoYW5nZSc6ICd0b3AnLFxyXG4gICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAndG91Y2gtYWN0aW9uJzogJ25vbmUnLFxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9ucyA9IHtcclxuICAgICdpbnZhbGlkLWVtYWlsJzoge1xyXG4gICAgICAgICdlbic6ICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MgZm9ybWF0JyxcclxuICAgICAgICAncGwnOiAnTmllcG9wcmF3bnkgZm9ybWF0IGFkcmVzdSBlLW1haWwnLFxyXG4gICAgfSxcclxuICAgICdyZXF1aXJlZC1maWVsZCc6IHtcclxuICAgICAgICAnZW4nOiAnUmVxdWlyZWQgZmllbGQnLFxyXG4gICAgICAgICdwbCc6ICdQb2xlIG9ib3dpxIV6a293ZScsXHJcbiAgICB9LFxyXG4gICAgJ2ludmFsaWQtemlwJzoge1xyXG4gICAgICAgICdlbic6ICdFbnRlciB6aXAtY29kZSBpbiBmaXZlIGRpZ2l0cyBmb3JtYXQnLFxyXG4gICAgICAgICdwbCc6ICdXcGlzeiBrb2QgcG9jenRvd3kgdyBmb3JtYWNpZSBYWC1YWFgnLFxyXG4gICAgfSxcclxufTtcclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5pbnRlcmZhY2UgSUNoYXJ0U2V0dGluZ3Mge1xyXG4gICAgeFBlcmNlbnQ6IG51bWJlcjtcclxuICAgIHlQb2ludHM6IEFycmF5PG51bWJlcj47XHJcbiAgICBjb2xvcjogc3RyaW5nO1xyXG4gICAgeVB4OiBBcnJheTxudW1iZXI+O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQ2hhcnQgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xyXG4gICAgcHJpdmF0ZSBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcclxuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XHJcbiAgICAgICAgdG9wOiA1LFxyXG4gICAgICAgIGxlZnQ6IDI1LFxyXG4gICAgICAgIHJpZ2h0OiA1MCxcclxuICAgICAgICBib3R0b206IDQ5XHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBncmFwaDogYW55ID0ge1xyXG4gICAgICAgIHRvcDogMCxcclxuICAgICAgICBsZWZ0OiAwLFxyXG4gICAgICAgIHJpZ2h0OiAwLFxyXG4gICAgICAgIGJvdHRvbTogMCxcclxuICAgICAgICBoZWlnaHQ6IDAsXHJcbiAgICAgICAgd2lkdGg6IDAsXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgY29sb3JzOiBhbnkgPSB7XHJcbiAgICAgICAgZ3JheTogJ3JnYmEoOTcsOTcsOTcsMC41KScsXHJcbiAgICAgICAgb3JhbmdlOiAnI2ZjOGM1OScsXHJcbiAgICAgICAgbWludDogJyM0ZmRiYzUnLFxyXG4gICAgICAgIGJsdWU6ICcjNTg3N2NjJyxcclxuICAgICAgICBwaW5rOiAnI0I2MEU2MycsXHJcbiAgICAgICAgd2hpdGU6ICcjZmZmJyxcclxuICAgICAgICBiZWlnZTogJyNmZGQ0OWUnLFxyXG4gICAgICAgIGNpbm5hYmFyOiAnI2U3NTA0MCcsXHJcbiAgICAgICAgc2VhOiAnIzI2YmJlMycsXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBncmFwaHNEYXRhOiBBcnJheTxJQ2hhcnRTZXR0aW5ncz4gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kd3JhcHBlciA9IHRoaXMudmlldy5maW5kKCcuanMtd3JhcHBlcicpO1xyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1jaGFydC10YWJdJyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+dGhpcy52aWV3LmZpbmQoJ2NhbnZhcycpWzBdO1xyXG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuJHdyYXBwZXIud2lkdGgoKTtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLiR3cmFwcGVyLmhlaWdodCgpO1xyXG5cclxuICAgICAgICB0aGlzLmdyYXBoID0ge1xyXG4gICAgICAgICAgICB0b3A6IHRoaXMubWFyZ2luLnRvcCxcclxuICAgICAgICAgICAgbGVmdDogdGhpcy5tYXJnaW4ubGVmdCxcclxuICAgICAgICAgICAgcmlnaHQ6IHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQgKyB0aGlzLm1hcmdpbi5sZWZ0LFxyXG4gICAgICAgICAgICBib3R0b206IHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSxcclxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi50b3AgLSB0aGlzLm1hcmdpbi5ib3R0b20sXHJcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLmxlZnQgLSB0aGlzLm1hcmdpbi5yaWdodCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRyYXcoKTtcclxuICAgICAgICB0aGlzLmNyZWF0ZURhdGFPYmplY3QoKTtcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZURhdGFPYmplY3QoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYi5lYWNoKCAoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YUl0ZW0gPSA8SUNoYXJ0U2V0dGluZ3M+e1xyXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXHJcbiAgICAgICAgICAgICAgICB5UG9pbnRzOiAkKGVsKS5kYXRhKCdwb2ludHMnKSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLnNldENvbG9yKCQoZWwpLmRhdGEoJ2NvbG9yJykpLFxyXG4gICAgICAgICAgICAgICAgeVB4OiB0aGlzLmNhbGNZUHgoJChlbCkuZGF0YSgncG9pbnRzJykpLFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5ncmFwaHNEYXRhLnB1c2goZGF0YUl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZ3JhcGhzRGF0YSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIFxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uQ2xpY2tUYWIpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uQ2xpY2tUYWIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcblxyXG4gICAgICAgIGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLW9uLWNoYXJ0JykgPyBjdXJyZW50LnJlbW92ZUNsYXNzKCdpcy1vbi1jaGFydCcpIDogY3VycmVudC5hZGRDbGFzcygnaXMtb24tY2hhcnQnKTtcclxuXHJcbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLW9uLWNoYXJ0JykpIHtcclxuICAgICAgICAgICAgdGhpcy5hbmltYXRlQ2hhcnQoY3VycmVudC5pbmRleCgpLCBmYWxzZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5hbmltYXRlQ2hhcnQoY3VycmVudC5pbmRleCgpLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmRyYXdCZygpO1xyXG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKCAoZ3JhcGhEYXRhKSA9PiB0aGlzLmRyYXdHcmFwaChncmFwaERhdGEpKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGRyYXdCZygpOiB2b2lkIHtcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy8gZHJhdyBYIGF4aXNcclxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xyXG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyggdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tICk7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKCB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20gKTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9ycy5ncmF5O1xyXG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyggdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5tYXJnaW4udG9wICk7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKCB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LCB0aGlzLm1hcmdpbi50b3AgKTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVscGVyc0xpbmUgPSA4O1xyXG4gICAgICAgIGNvbnN0IHRleHRUcmFuc2Zvcm0gPSA1O1xyXG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xyXG4gICAgICAgIGxldCB2YWw7XHJcbiAgICAgICAgY29uc3QgeWVhcnMgPSBbMjAxNSwgMjAxNiwgMjAxNywgMjAxOCwgMjAxOSwgMjAyMCwgMjAyMV07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGhlbHBlcnNMaW5lOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsID0gNTAgLSBzdGVwICogaTtcclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcclxuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy5ibHVlO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCgnJyArIHZhbCArICcnLCAwLCAoIHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCArIHRleHRUcmFuc2Zvcm0pO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oIHRoaXMubWFyZ2luLmxlZnQsICggdGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wICk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyggdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgKCB0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3AgKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB5ZWFycy5sZW5ndGg7IGorKykge1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCgnJyArIHllYXJzW2pdICsgJycsICh0aGlzLmNhbnZhcy53aWR0aCArIHRoaXMubWFyZ2luLnJpZ2h0ICsgdGhpcy5tYXJnaW4ubGVmdCkgLyB5ZWFycy5sZW5ndGggKiBqICsgdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGV4dFRyYW5zZm9ybSAqIDIpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGRyYXdHcmFwaCA9IChkYXRhOiBJQ2hhcnRTZXR0aW5ncyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcclxuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAzO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcclxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuXHJcbiAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcclxuICAgICAgICAgICAgaWYgKGkgLyBhLmxlbmd0aCA+PSBkYXRhLnhQZXJjZW50KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCAvIGEubGVuZ3RoICogaSArIHRoaXMuZ3JhcGgubGVmdCwgeSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFuaW1hdGVDaGFydChpZDogbnVtYmVyLCBkaXJlY3Rpb246IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkaXIgPSBkaXJlY3Rpb24gPyAxIDogMDtcclxuICAgICAgICBnc2FwLnRvKHRoaXMuZ3JhcGhzRGF0YVtpZF0sIHtcclxuICAgICAgICAgICAgeFBlcmNlbnQ6IGRpcixcclxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMicsXHJcbiAgICAgICAgICAgIG9uVXBkYXRlOiB0aGlzLmRyYXcsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEhFTFBFUlNcclxuICAgIHByaXZhdGUgbGFyZ2VzdFlWYWwoZGF0YTogQXJyYXk8bnVtYmVyPik6IG51bWJlciB7XHJcbiAgICAgICAgbGV0IGxhcmdlc3QgPSAwO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3Q7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjYWxjWVB4KGRhdGEpOiBBcnJheTxudW1iZXI+IHtcclxuICAgICAgICBjb25zdCBsYXJnZXN0ID0gdGhpcy5sYXJnZXN0WVZhbChkYXRhKTtcclxuICAgICAgICBsZXQgYXJyID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgaXRlbSA9IE1hdGgucm91bmQoKHRoaXMuZ3JhcGguaGVpZ2h0IC0gZGF0YVtpXSAvIGxhcmdlc3QgKiB0aGlzLmdyYXBoLmhlaWdodCkgKyB0aGlzLmdyYXBoLnRvcCk7XHJcbiAgICAgICAgICAgIGFyci5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGFycjtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldENvbG9yKGNvbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgICAgIGxldCBoZXg7XHJcblxyXG4gICAgICAgIGZvciAoY29uc3QgcHJvcGVydHkgaW4gdGhpcy5jb2xvcnMpIHtcclxuICAgICAgICAgICAgaWYgKGNvbG9yID09PSBwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgICAgaGV4ID0gdGhpcy5jb2xvcnNbcHJvcGVydHldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gaGV4O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wb25lbnRFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdjaGFuZ2UnO1xyXG59XHJcblxyXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgSGFuZGxlciB7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPzogT2JqZWN0KSB7XHJcbiAgICAgICAgc3VwZXIoKTtcclxuICAgICAgICBpZiAoIXZpZXdbMF0pIHsgY29uc29sZS53YXJuKCdjb21wb25lbnQgYnVpbHQgd2l0aG91dCB2aWV3Jyk7IH1cclxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHByZWxvYWRJbWFnZXMoKTogQXJyYXk8c3RyaW5nPiB7XHJcbiAgICAgICAgcmV0dXJuIFtdO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGFuaW1hdGVJbihpbmRleD86IG51bWJlciwgZGVsYXk/OiBudW1iZXIpOiB2b2lkIHsgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIC8vIGlmIHlvdSBkb24ndCB3YW50IHRvIGFuaW1hdGUgY29tcG9uZW50LFxyXG4gICAgICAgIC8vIGp1c3QgcmV0dXJuIGVtcHR5IFByb21pc2U6XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcclxuXHJcbiAgICAgICAgLy8gaWYgeW91IG5lZWQgYW5pbWF0aW9uOlxyXG4gICAgICAgIC8vIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgLy8gICAgIGdzYXAudG8odGhpcy52aWV3LCB7XHJcbiAgICAgICAgLy8gICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgIC8vICAgICAgICAgfSxcclxuICAgICAgICAvLyAgICAgICAgIGR1cmF0aW9uOiAwLjMsXHJcbiAgICAgICAgLy8gICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgIC8vICAgICB9KTtcclxuICAgICAgICAvLyB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQgeyB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQgeyB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7IH07XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIG51bGwpO1xyXG4gICAgICAgIHRoaXMudmlldy5vZmYoKTtcclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBEYXNoYm9hcmQgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRvZ2dsZTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkYm9keTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBpc1RvZ2dsZWQ6IGJvb2xlYW47XHJcbiAgICBwcml2YXRlIGJvZHlIZWlnaHQ6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdG9nZ2xlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1idXR0b24tdG9nZ2xlJyk7XHJcbiAgICAgICAgdGhpcy4kYm9keSA9IHRoaXMudmlldy5maW5kKCcuanMtZGFzaGJvYXJkLWJvZHknKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsU3RhdGUoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG5cclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRvZ2dsZS5vZmYoJy50b2dnbGUnKS5vbignY2xpY2sudG9nZ2xlJywgdGhpcy50b2dnbGVQYW5lbCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVQYW5lbCA9IChlKSA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzVG9nZ2xlZCkge1xyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnYXV0bycsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxyXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdpcy10b2dnbGVkJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRib2R5LnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XHJcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kYm9keSwgeyBkdXJhdGlvbjogMC41LCBoZWlnaHQ6ICcwJywgZWFzZTogJ3Bvd2VyMi5pbk91dCcsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBpbml0aWFsU3RhdGUoKTogdm9pZCB7XHJcbiAgICAgICAgZ3NhcC5zZXQodGhpcy4kYm9keSwgeyBoZWlnaHQ6ICcwJ30pO1xyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBEcm9wZG93biBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgXHJcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZhbHVlXScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZCcsIHRoaXMuJHNlbGVjdGVkLnRleHQoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZpZXcub2ZmKCcuc2VsZWN0Jykub24oJ2NsaWNrLnNlbGVjdCcsIHRoaXMudG9nZ2xlKTtcclxuICAgICAgICAkZG9jLm9mZignLmRyb3Bkb3duJykub24oJ2NsaWNrLmRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcclxuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCd0b2dnbGUgZHAnKTtcclxuICAgICAgICB0aGlzLmlzT3BlbiA/IHRoaXMuY2xvc2VTZWxlY3QoKSA6IHRoaXMub3BlblNlbGVjdChlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvcGVuU2VsZWN0KGUpOiB2b2lkIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY2xvc2VTZWxlY3QoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pc09wZW4sICdvcGVuPycpO1xyXG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJz8/Pz8/Jyk7XHJcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpICYmICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd2YWx1ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCBjdXJyZW50KTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbHRlcnMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJGNsZWFyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRwYW5lbDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbVNlY3RvcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbVRpbWU6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHRpbWVsaW5lSXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkYWxsU2VjdG9yczogSlF1ZXJ5O1xyXG5cclxuICAgIHByaXZhdGUgZmlsdGVyczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG4gICAgcHJpdmF0ZSBpc0FsbENoZWNrZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNsZWFyID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbGVhcicpO1xyXG4gICAgICAgIHRoaXMuJHBhbmVsID0gdGhpcy52aWV3LmZpbmQoJy5qcy1wYW5lbCcpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcclxuICAgICAgICB0aGlzLiRpdGVtVGltZSA9IHRoaXMudmlldy5maW5kKCcuanMtdGltZScpO1xyXG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10aW1lXScpO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0tYWxsJyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNsZWFyLmNzcygnaGVpZ2h0JywgdGhpcy4kcGFuZWwub3V0ZXJIZWlnaHQoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5vZmYoJy5zZWN0b3InKS5vbignY2xpY2suc2VjdG9yJywgdGhpcy50b2dnbGVTZWN0b3IpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLm9mZignLnRpbWUnKS5vbignY2xpY2sudGltZScsIHRoaXMudG9nZ2xlVGltZSk7XHJcbiAgICAgICAgdGhpcy4kY2xlYXIub2ZmKCcuY2xlYXInKS5vbignY2xpY2suY2xlYXInLCB0aGlzLmNsZWFyQXJyYXkpO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMub2ZmKCcuYWxsJykub24oJ2NsaWNrLmFsbCcsIHRoaXMubWFya0FsbFNlY3RvcnMpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG1hcmtBbGxTZWN0b3JzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRpbWVDaGVja2VkID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhckFycmF5KCk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5lYWNoKChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHRpbWVDaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGltZUNoZWNrZWQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKHRpbWVDaGVja2VkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgY2xlYXJBcnJheSA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLiRpdGVtVGltZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlU2VjdG9yID0gKGUpID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsbENoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlVGltZSA9IChlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XHJcblxyXG4gICAgICAgIGlmIChjdXJyZW50Lmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVQcmV2ID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhY3RpdmVQcmV2KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoYWN0aXZlUHJldiwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKGN1cnJlbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBtYXJrVGltZWxpbmUoZWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgIGlmIChlbC5oYXNDbGFzcygnanMtdGltZScpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVsaW5lZG90ID0gdGhpcy4kdGltZWxpbmVJdGVtLmZpbHRlcignW2RhdGEtdGltZT0nICsgZWwuZGF0YSgnaXRlbScpICsgJ10nKTtcclxuICAgICAgICAgICAgdGltZWxpbmVkb3QuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB1bm1hcmtUaW1lbGluZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcmVtb3ZlRWxlbWVudEZyb21BcnJheSgkZWw6IEpRdWVyeSwgYXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZmlsdGVycy5pbmRleE9mKCRlbC5kYXRhKCdpdGVtJykpO1xyXG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XHJcbiAgICAgICAgICAgIGFycmF5LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGSUxURVJTOicsIHRoaXMuZmlsdGVycyk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYWRkRWxlbWVudFRvQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XHJcbiAgICAgICAgYXJyYXkucHVzaCgkZWwuZGF0YSgnaXRlbScpKTtcclxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdGSUxURVJTOicsIHRoaXMuZmlsdGVycyk7XHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcbmludGVyZmFjZSBJRGF0YVN0YXQge1xyXG4gICAgc2VjdG9yOiBzdHJpbmc7XHJcbiAgICB2YWx1ZTogbnVtYmVyO1xyXG4gICAgY29sb3I6IHN0cmluZztcclxufVxyXG5cclxuaW50ZXJmYWNlIElHcmlkSXRlbVBvc2l0aW9uIHtcclxuICAgIGNvbHVtbl9zdGFydDogbnVtYmVyO1xyXG4gICAgY29sdW1uX2VuZDogbnVtYmVyO1xyXG4gICAgcm93X3N0YXJ0OiBudW1iZXI7XHJcbiAgICByb3dfZW5kOiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNYXNvbnJ5IGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlIGRhdGE6IEFycmF5PElEYXRhU3RhdD4gPSBbXTtcclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuICAgIHByaXZhdGUgZGF0YUFycmF5OiBBcnJheTxhbnk+ID0gW107XHJcbiAgICBwcml2YXRlIGFyZWE6IG51bWJlcjtcclxuICAgIHByaXZhdGUgaXRlbU1hcmdpbjogbnVtYmVyID0gMztcclxuICAgIHByaXZhdGUgZ3JpZFJvd3M6IG51bWJlciA9IDIwO1xyXG4gICAgcHJpdmF0ZSBncmlkQ29sczogbnVtYmVyID0gMjA7XHJcbiAgICBwcml2YXRlIGdyaWRDZWxsczogbnVtYmVyID0gdGhpcy5ncmlkQ29scyAqIHRoaXMuZ3JpZFJvd3M7XHJcbiAgICBwcml2YXRlIGNlbGxzQmFsYW5jZTogbnVtYmVyID0gdGhpcy5ncmlkQ2VsbHM7XHJcbiAgICBwcml2YXRlIGdyaWRDZWxsOiBhbnkgPSB7XHJcbiAgICAgICAgd2lkdGg6IHRoaXMudmlldy53aWR0aCgpIC8gdGhpcy5ncmlkQ29scyxcclxuICAgICAgICBoZWlnaHQ6IHRoaXMudmlldy5oZWlnaHQoKSAvIHRoaXMuZ3JpZFJvd3MsXHJcbiAgICB9O1xyXG4gICAgcHJpdmF0ZSBtaW5DZWxsV2lkdGg6IG51bWJlciA9IDM7XHJcbiAgICBwcml2YXRlIG1pbkNlbGxIZWlnaHQ6IG51bWJlciA9IDM7XHJcblxyXG4gICAgcHJpdmF0ZSBpdGVtUG9zaXRpb25pbmc6IEFycmF5PElHcmlkSXRlbVBvc2l0aW9uPiA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1tYXNvbnJ5LXRpbGUnKTtcclxuICAgICAgICB0aGlzLiRpdGVtLmVhY2goIChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJRGF0YVN0YXQ+e1xyXG4gICAgICAgICAgICAgICAgc2VjdG9yOiAkKGVsKS5kYXRhKCd0aWxlJyksXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogJChlbCkuZGF0YSgndmFsdWUnKSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiAkKGVsKS5kYXRhKCdjb2xvcicpLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhSXRlbSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5hcmVhID0gKHRoaXMudmlldy53aWR0aCgpIC0gdGhpcy5pdGVtTWFyZ2luICogMykgKiB0aGlzLnZpZXcuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YSwgdGhpcy5hcmVhLCAnY2VsbCB3aWR0aCcsIHRoaXMuZ3JpZENlbGwud2lkdGgsICdjZWxsIGhlaWdodCcsIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcclxuICAgICAgICBcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoKTtcclxuICAgICAgICB0aGlzLmdldEFyckZyb21PYmplY3QoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdldEFyckZyb21PYmplY3QoKTogYW55IHtcclxuICAgICAgICB0aGlzLmRhdGFBcnJheSA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZGF0YSkuc29ydCgoYSwgYikgPT4gYVswXS5sb2NhbGVDb21wYXJlKGJbMF0pKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kYXRhQXJyYXkpO1xyXG5cclxuICAgICAgICB0aGlzLmRhdGFBcnJheS5mb3JFYWNoKCAoZWwsIGkpID0+IHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZWxbMV0udmFsdWUsIGksICdlbCcpO1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGVsWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICBjb25zdCBzZWN0b3IgPSBlbFsxXS5zZWN0b3I7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZWxbMV0uY29sb3I7XHJcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoc2VjdG9yLCB2YWx1ZSwgY29sb3IsIGluZGV4KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldFRpbGVTaXplKHNlY3Rvcjogc3RyaW5nLCB2YWx1ZTogbnVtYmVyLCBjb2xvcjogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuJGl0ZW0uZmlsdGVyKCdbZGF0YS10aWxlPScgKyBzZWN0b3IgKyAnXScpO1xyXG4gICAgICAgIGxldCBhcmVhLCBoLCB3LCB0LCBsLCBjb2x1bW5fc3RhcnQsIGNvbHVtbl9lbmQsIHJvd19zdGFydCwgcm93X2VuZCwgaXRlbSwgYXJlYUdyaWQ7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXJlYSA9IHRoaXMuYXJlYSAqICh2YWx1ZSAvIDEwMCk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFyZWEsICc6YXJlYScsIHRoaXMuaXRlbVBvc2l0aW9uaW5nLHRoaXMuaXRlbVBvc2l0aW9uaW5nLmxlbmd0aCA+IDAsICdjaGVjayBpZiBzb21lIGl0ZW0gb24gYXJyYXknKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcclxuICAgICAgICAgICAgY29sdW1uX3N0YXJ0ID0gMTtcclxuICAgICAgICAgICAgcm93X3N0YXJ0ID0gMTtcclxuICAgICAgICAgICAgcm93X2VuZCA9IHRoaXMuZ3JpZFJvd3M7XHJcbiAgICAgICAgICAgIGNvbHVtbl9lbmQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC5oZWlnaHQgKiByb3dfZW5kKSAvIHRoaXMuZ3JpZENlbGwud2lkdGgpO1xyXG4gICAgICAgICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKTtcclxuICAgICAgICAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIChpbmRleCA+IDApIHtcclxuICAgICAgICAvLyAgICAgY29sdW1uX3N0YXJ0ID0gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgPCB0aGlzLmdyaWRDb2xzIC0gdGhpcy5taW5DZWxsV2lkdGggPyB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0xXS5jb2x1bW5fZW5kICsgMSA6IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTJdLmNvbHVtbl9lbmQgKyAxO1xyXG4gICAgICAgIC8vICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA+PSA2ID8gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpIDogNjtcclxuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcclxuICAgICAgICAvLyAgICAgY29sdW1uX2VuZCA9IGFyZWFHcmlkIC8gdGhpcy5taW5DZWxsV2lkdGggXHJcblxyXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhhcmVhR3JpZCwgJ2Ftb3VudCBvZiBjZWxscycpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaXRlbSA9IDxJR3JpZEl0ZW1Qb3NpdGlvbj57XHJcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydDogY29sdW1uX3N0YXJ0LFxyXG4gICAgICAgICAgICBjb2x1bW5fZW5kOiBjb2x1bW5fZW5kLFxyXG4gICAgICAgICAgICByb3dfc3RhcnQ6IHJvd19zdGFydCxcclxuICAgICAgICAgICAgcm93X2VuZDogcm93X2VuZCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjdXJyZW50LmNzcyh7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgICAnZ3JpZC1jb2x1bW4tc3RhcnQnOiBjb2x1bW5fc3RhcnQsXHJcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1lbmQnOiBjb2x1bW5fZW5kLFxyXG4gICAgICAgICAgICAnZ3JpZC1yb3ctc3RhcnQnOiByb3dfc3RhcnQsXHJcbiAgICAgICAgICAgICdncmlkLXJvdy1lbmQnOiAnc3BhbicgKyByb3dfZW5kLFxyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1Qb3NpdGlvbmluZy5wdXNoKGl0ZW0pO1xyXG4gICAgICAgIHRoaXMuY2VsbHNCYWxhbmNlID0gdGhpcy5jZWxsc0JhbGFuY2UgLSBhcmVhR3JpZDtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNlbGxzQmFsYW5jZSwgJzpmcmVlIGNlbGxzJyk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUmFuZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIFxyXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgJHNlbGVjdGVkOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRyYWRpbzogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJyk7XHJcbiAgICAgICAgdGhpcy4kcmFkaW8gPSB0aGlzLnZpZXcuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiR0cmlnZ2VyLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZSk7XHJcbiAgICAgICAgJGRvYy5vZmYoJy5zbWFsbGRyb3Bkb3duJykub24oJ2NsaWNrLnNtYWxsZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuJHJhZGlvLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJ29wZW4/Jyk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSB8fCAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuYXR0cigndmFsdWUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCBjdXJyZW50KTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgU3dpcGUsIFN3aXBlRXZlbnRzLCBJU3dpcGVDb29yZGluYXRlcyB9IGZyb20gJy4vU3dpcGUnO1xyXG4vLyBpbXBvcnQgeyBQbGF5ZXIgfSBmcm9tICcuL1BsYXllcic7XHJcblxyXG5pbnRlcmZhY2UgSVNsaWRlclNldHRpbmdzIHtcclxuICAgIHR5cGU6IHN0cmluZyxcclxuICAgIG1vZGU6IHN0cmluZyxcclxuICAgIHBob25lPzogc3RyaW5nLFxyXG4gICAgZGVza3RvcD86IHN0cmluZyxcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFNsaWRlciBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkbGlzdDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBvZmZzZXQ6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIGluZGV4OiBudW1iZXIgPSAxO1xyXG4gICAgLy8gcHJpdmF0ZSBjb3VudDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgJGJ1dHRvblByZXY6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGJ1dHRvbk5leHQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGRvdDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBzd2lwZTogU3dpcGU7XHJcbiAgICBwcml2YXRlIGl0ZW1XaWR0aDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBtYXJnaW46IG51bWJlciA9IDMyO1xyXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogSVNsaWRlclNldHRpbmdzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcclxuICAgICAgICB0aGlzLiRsaXN0ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1saXN0Jyk7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uUHJldiA9IHRoaXMudmlldy5maW5kKCcuanMtcHJldicpO1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvbk5leHQgPSB0aGlzLnZpZXcuZmluZCgnLmpzLW5leHQnKTtcclxuICAgICAgICB0aGlzLiRkb3QgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWRvdCcpO1xyXG4gICAgICAgIHRoaXMubWFyZ2luID0gdGhpcy4kaXRlbS5vdXRlcldpZHRoKHRydWUpIC0gdGhpcy4kaXRlbS53aWR0aCgpO1xyXG4gICAgICAgIHRoaXMuaXRlbVdpZHRoID0gdGhpcy4kaXRlbS53aWR0aCgpICsgdGhpcy5tYXJnaW47XHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHtcclxuICAgICAgICAgICAgdHlwZTogJycsXHJcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB2aWV3LmRhdGEoJ29wdGlvbnMnKSB8fCB7fSk7XHJcblxyXG4gICAgICAgIC8vIGlmICh0aGlzLnNldHRpbmdzLm1hcmdpbikge1xyXG4gICAgICAgIC8vICAgICB0aGlzLm1hcmdpbiA9IHRoaXMuc2V0dGluZ3MubWFyZ2luO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQucGhvbmUgJiYgKHRoaXMuc2V0dGluZ3MudHlwZSAgPT09ICdwaG9uZS1kaXNhYmxlJyB8fCB0aGlzLnNldHRpbmdzLnBob25lID09PSAnZGlzYWJsZWQnKSkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWJyZWFrcG9pbnQuZGVza3RvcCAmJiB0aGlzLnNldHRpbmdzLm1vZGUgPT09ICdjZW50ZXItbW9iaWxlJykge1xyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm1vZGUgPSAnY2VudGVyJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChicmVha3BvaW50LnRhYmxldCAmJiB0aGlzLnNldHRpbmdzLm1vZGUgPT09ICdjZW50ZXItdGFibGV0Jykge1xyXG4gICAgICAgICAgICB0aGlzLnNldHRpbmdzLm1vZGUgPSAnY2VudGVyJztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG5cclxuICAgICAgICBjb25zdCBzd2lwZUVsID0gYnJlYWtwb2ludC5kZXNrdG9wID8gdGhpcy4kbGlzdCA6IHRoaXMuJGl0ZW0uZmlyc3QoKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnN3aXBlID0gbmV3IFN3aXBlKHRoaXMuJGxpc3QsIHtcclxuICAgICAgICAgICAgaG9yaXpvbnRhbDogdHJ1ZSxcclxuICAgICAgICAgICAgdmVydGljYWw6IGZhbHNlLFxyXG4gICAgICAgICAgICBtaW5pbXVtOiA4MCxcclxuICAgICAgICAgICAgZGlzYWJsZU1vdXNlOiBmYWxzZSxcclxuICAgICAgICAgICAgZGlzYWJsZVRvdWNoOiBmYWxzZSxcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnN3aXBlLm9uKFN3aXBlRXZlbnRzLkVORCwgdGhpcy5vblN3aXBlKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy4kaXRlbS5vdXRlcldpZHRoKHRydWUpIC0gdGhpcy4kaXRlbS53aWR0aCgpKTtcclxuICAgIH1cclxuXHJcbiAgICBcclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PywgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmIChicmVha3BvaW50LnBob25lICYmICh0aGlzLnNldHRpbmdzLnR5cGUgPT09ICdwaG9uZS1kaXNhYmxlJyB8fCB0aGlzLnNldHRpbmdzLnBob25lID09PSAnZGlzYWJsZWQnKSkgeyByZXR1cm47IH1cclxuICAgICAgICB0aGlzLml0ZW1XaWR0aCA9IHRoaXMuJGl0ZW0ud2lkdGgoKSArIHRoaXMubWFyZ2luO1xyXG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMuaXRlbVdpZHRoICogdGhpcy4kaXRlbS5sZW5ndGg7XHJcbiAgICAgICAgdGhpcy4kbGlzdC5jc3MoJ3dpZHRoJywgd2lkdGgpO1xyXG4gICAgICAgIHRoaXMuZ28odGhpcy5pbmRleCk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGluaXQoKTogdm9pZCB7XHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIGdzYXAuc2V0KHRoaXMuJGxpc3QsIHsgeDogdGhpcy5vZmZzZXQgfSk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtcygpO1xyXG4gICAgICAgIHRoaXMucmVzaXplRG90cygpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5tb2RlID09PSAnY2VudGVyJyAmJiB0aGlzLiRpdGVtLmxlbmd0aCA+IDIpIHtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IDI7XHJcbiAgICAgICAgICAgIHRoaXMuZ28oMik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRidXR0b25QcmV2Lm9mZignLnNsaWRlcmN1c3RvbScpLm9uKCdjbGljay5zbGlkZXJjdXN0b20nLCAoZSkgPT4gdGhpcy5wcmV2KCkpO1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvbk5leHQub2ZmKCcuc2xpZGVyY3VzdG9tJykub24oJ2NsaWNrLnNsaWRlcmN1c3RvbScsIChlKSA9PiB0aGlzLm5leHQoKSk7XHJcbiAgICAgICAgdGhpcy4kZG90Lm9mZignLnNsaWRlcmN1c3RvbScpLm9uKCdjbGljay5zbGlkZXJjdXN0b20nLCAoZSkgPT4gdGhpcy5jbGlja0VsZW1lbnQoZSkpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcuc2xpZGVyY3VzdG9tJykub24oJ2NsaWNrLnNsaWRlcmN1c3RvbScsIChlKSA9PiB0aGlzLmNsaWNrRWxlbWVudChlKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgcmVzaXplRG90cygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuJGRvdCkgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAodGhpcy4kZG90Lmxlbmd0aCA+IDcpIHtcclxuICAgICAgICAgICAgdGhpcy4kZG90LmVhY2goIGVsID0+IHtcclxuICAgICAgICAgICAgICAgICQoZWwpLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogJzEwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgICdoZWlnaHQnOiAnMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzNweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1yaWdodCc6ICczcHgnXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Td2lwZSA9IChlOiBJU3dpcGVDb29yZGluYXRlcyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmIChlLmRpcmVjdGlvbiA9PT0gJ2xlZnQnIHx8IGUuZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGUuZGlyZWN0aW9uLCBlLik7XHJcbiAgICAgICAgICAgIHRoaXMuc2hpZnQoe1xyXG4gICAgICAgICAgICAgICAgbGVmdDogKzEsIHJpZ2h0OiAtMSxcclxuICAgICAgICAgICAgfVtlLmRpcmVjdGlvbl0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2hpZnQoZGlyOiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBsZXQgb2xkO1xyXG5cclxuICAgICAgICBpZiAoZGlyID09PSAtMSkge1xyXG4gICAgICAgICAgICB0aGlzLnByZXYoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLm5leHQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNsaWNrRWxlbWVudChlKTogdm9pZCB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBjb25zb2xlLmxvZygkKGUudGFyZ2V0KSk7XHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmhhc0NsYXNzKCdzaGFyZV9fYnV0dG9uJykgfHwgJChlLnRhcmdldCkuaGFzQ2xhc3MoJ2V2YWx1YXRpb24nKSB8fCAkKGUudGFyZ2V0KS5oYXNDbGFzcygnc2xpZGVyX19pdGVtLWZvb3RlcicpKSB7IHJldHVybiA7IH1cclxuICAgICAgICBsZXQgZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgbGV0IGkgPSBlbC5pbmRleCgpICsgMTtcclxuICAgICAgICB0aGlzLmluZGV4ID0gaTtcclxuXHJcbiAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBuZXh0KCk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLmluZGV4IDwgdGhpcy4kaXRlbS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy5pbmRleCA9IHRoaXMuaW5kZXggKyAxO1xyXG4gICAgICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBwcmV2KCk6IHZvaWQge1xyXG4gICAgICAgIGlmICh0aGlzLmluZGV4ID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gdGhpcy5pbmRleCAtIDE7XHJcbiAgICAgICAgICAgIHRoaXMuZ28odGhpcy5pbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBnbyhpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgLy8gUGxheWVyLnBhdXNlQWxsKCk7XHJcbiAgICAgICAgbGV0IHggPSAoaW5kZXggKiB0aGlzLml0ZW1XaWR0aCkgLSB0aGlzLml0ZW1XaWR0aDtcclxuICAgICAgICB4ID0gdGhpcy5zZXR0aW5ncy5tb2RlID09PSAnY2VudGVyJyA/ICh4IC0gKCR3aW5kb3cud2lkdGgoKSAqIDAuNSkgLSB0aGlzLm1hcmdpbikgKyB0aGlzLml0ZW1XaWR0aCAqIDAuNSA6IHhcclxuICAgICAgICBnc2FwLnRvKHRoaXMuJGxpc3QsIHsgZHVyYXRpb246IDAuNSwgeDogLXgsIHRyYW5zZm9ybU9yaWdpbjogJzUwJSA1MCUnLCAgZWFzZTogJ3NpbmUuaW5PdXQnLCBvbkNvbXBsZXRlOiAoKSA9PiB7fSB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtcygpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNldEFjdGl2ZUl0ZW1zKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuc2V0TmF2QXZhaWxiaWxpdHkoKTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5lcSh0aGlzLmluZGV4IC0gMSkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuJGRvdC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kZG90LmVxKHRoaXMuaW5kZXggLSAxKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0SW5WaWV3SXRlbUNsYXNzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gVG8gbWFrZSB2aXNpYmxlIHNvY2lhbCBmb290ZXIgZm9yIG5leHQgaXRlbSBpbiBhcnRpY2xlIHNsaWRlclxyXG4gICAgcHJpdmF0ZSBzZXRJblZpZXdJdGVtQ2xhc3MoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFicmVha3BvaW50LnBob25lICYmIHRoaXMuc2V0dGluZ3MudHlwZSA9PT0gJ2FydGljbGUnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWluLXZpZXcnKTtcclxuICAgICAgICAgICAgdGhpcy4kaXRlbS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5uZXh0KCkuYWRkQ2xhc3MoJ2lzLWluLXZpZXcnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgc2V0TmF2QXZhaWxiaWxpdHkoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodHJ1ZSkge1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSB0aGlzLmluZGV4ID09IDE6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25QcmV2LmFkZENsYXNzKCdpcy1kaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV4dC5yZW1vdmVDbGFzcygnaXMtZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSB0aGlzLmluZGV4ID09PSB0aGlzLiRpdGVtLmxlbmd0aDpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5leHQuYWRkQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25QcmV2LnJlbW92ZUNsYXNzKCdpcy1kaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXh0LnJlbW92ZUNsYXNzKCdpcy1kaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uUHJldi5yZW1vdmVDbGFzcygnaXMtZGlzYWJsZWQnKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgJHdpbmRvdyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12aWV3XScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcoMik7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLnN3aXRjaFRhYik7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN3aXRjaFRhYiA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVWaWV3KGluZGV4KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGFiLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRpdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiR0YWIuZmlsdGVyKCdbZGF0YS10YWI9JyArIGluZGV4ICsgJ10nKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXZpZXc9JyArIGluZGV4ICsgJ10nKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XHJcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi4vQnJvd3Nlcic7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU3dpcGVDb29yZGluYXRlcyB7XHJcbiAgICB4PzogbnVtYmVyO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIHN0YXJ0WD86IG51bWJlcjtcclxuICAgIHN0YXJ0WT86IG51bWJlcjtcclxuICAgIGRlbHRhWD86IG51bWJlcjtcclxuICAgIGRlbHRhWT86IG51bWJlcjtcclxuICAgIGRpcmVjdGlvbj86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU3dpcGVPcHRpb25zIHtcclxuICAgIHZlcnRpY2FsPzogYm9vbGVhbjtcclxuICAgIGhvcml6b250YWw/OiBib29sZWFuO1xyXG4gICAgbWluaW11bT86IG51bWJlcjtcclxuICAgIGRpc2FibGVNb3VzZT86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlVG91Y2g/OiBib29sZWFuO1xyXG4gICAgaGFuZGxlcj86IEpRdWVyeSB8IEhUTUxFbGVtZW50IHwgc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3dpcGVFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyBTVEFSVDogc3RyaW5nID0gJ3N0YXJ0JztcclxuICAgIHB1YmxpYyBzdGF0aWMgVVBEQVRFOiBzdHJpbmcgPSAndXBkYXRlJztcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5EOiBzdHJpbmcgPSAnZW5kJztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlQXhlcyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIEhPUklaT05UQUw6IHN0cmluZyA9ICdoJztcclxuICAgIHB1YmxpYyBzdGF0aWMgVkVSVElDQUw6IHN0cmluZyA9ICd2JztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlRGlyZWN0aW9ucyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlQ6IHN0cmluZyA9ICdsZWZ0JztcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFQ6IHN0cmluZyA9ICdyaWdodCc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFVQOiBzdHJpbmcgPSAndXAnO1xyXG4gICAgcHVibGljIHN0YXRpYyBET1dOOiBzdHJpbmcgPSAnZG93bic7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5PTkU6IHN0cmluZyA9ICdub25lJztcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0xJQ0s6IHN0cmluZyA9ICdjbGljayc7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlIGV4dGVuZHMgSGFuZGxlciB7XHJcblxyXG4gICAgcHVibGljIHN3aXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBkZWx0YSBvZiBjdXJyZW50IG1vdmVtZW50OlxyXG4gICAgcHVibGljIGRlbHRhWDogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBkZWx0YVk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgLy8gY3VycmVudCBwb3NpdGlvbjpcclxuICAgIHB1YmxpYyB4OiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHJpdmF0ZSAkaGFuZGxlcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBzdGFydFg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIHN0YXJ0WTogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgdWlkOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIG1vdXNlOiBJU3dpcGVDb29yZGluYXRlcyA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgcHJpdmF0ZSBkcmFnZ2VkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGF4ZTogU3dpcGVBeGVzID0gbnVsbDtcclxuXHJcbiAgICBwcml2YXRlIG9mZnNldFg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIG9mZnNldFk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgc2V0dGluZ3M6IElTd2lwZU9wdGlvbnM7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz86IElTd2lwZU9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICBob3Jpem9udGFsOiB0cnVlLFxyXG4gICAgICAgICAgICB2ZXJ0aWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbmltdW06IDgwLFxyXG4gICAgICAgICAgICBkaXNhYmxlTW91c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBkaXNhYmxlVG91Y2g6IGZhbHNlLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBudWxsLFxyXG4gICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3dpcGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuJGhhbmRsZXIgPSAodGhpcy5zZXR0aW5ncy5oYW5kbGVyID8gJCh0aGlzLnNldHRpbmdzLmhhbmRsZXIpIDogdGhpcy52aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcclxuICAgICAgICB0aGlzLnVpZCA9IFV0aWxzLmdlbmVyYXRlVUlEKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICAgICAgdGhpcy51bmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoZW5hYmxlOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9ICFlbmFibGU7XHJcbiAgICAgICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBlbmQoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kU3dpcGUoKTtcclxuICAgICAgICAgICAgdGhpcy5heGUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3Qgc1QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCAwO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0WCA9IHRoaXMudmlldy5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHRoaXMub2Zmc2V0WSA9IHRoaXMudmlldy5vZmZzZXQoKS50b3AgLSBzVDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlQ3Vyc29yKCk6IHZvaWQge1xyXG4gICAgICAgIGxldCBpc01vdXNlRGlzYWJsZWQgPSAhTW9kZXJuaXpyLnRvdWNoZXZlbnRzICYmICEhdGhpcy5zZXR0aW5ncy5kaXNhYmxlTW91c2U7XHJcbiAgICAgICAgdGhpcy4kaGFuZGxlci50b2dnbGVDbGFzcygnaXMtZ3JhYmJhYmxlJywgIXRoaXMuZGlzYWJsZWQgJiYgIWlzTW91c2VEaXNhYmxlZCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zd2lwZScpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZGlzYWJsZU1vdXNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGhhbmRsZXJcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2Vkb3duLnN3aXBlJywgdGhpcy5vbk1vdXNlRG93bik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlLnN3aXBlJywgdGhpcy5vbk1vdXNlTW92ZSlcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2V1cC5zd2lwZScsIHRoaXMub25Nb3VzZVVwKVxyXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlLnN3aXBlJywgdGhpcy5vbk1vdXNlVXApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmRpc2FibGVUb3VjaCkge1xyXG4gICAgICAgICAgICB0aGlzLiRoYW5kbGVyXHJcbiAgICAgICAgICAgICAgICAub24oJ3RvdWNoc3RhcnQuc3dpcGUnLCB0aGlzLm9uVG91Y2hTdGFydCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgICAgIC5vbigndG91Y2htb3ZlLnN3aXBlJywgdGhpcy5vblRvdWNoTW92ZSk7XHJcblxyXG4gICAgICAgICAgICAkZG9jXHJcbiAgICAgICAgICAgICAgICAub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpXHJcbiAgICAgICAgICAgICAgICAub24oJ3RvdWNoZW5kLnN3aXBlJyArIHRoaXMudWlkLCB0aGlzLm9uVG91Y2hFbmQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdW5iaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zd2lwZScpO1xyXG4gICAgICAgICRkb2Mub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlRG93biA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKChlLndoaWNoICYmIGUud2hpY2ggPT09IDMpIHx8IChlLmJ1dHRvbiAmJiBlLmJ1dHRvbiA9PT0gMikpIHsgcmV0dXJuOyB9IC8vIHJpZ2h0IGNsaWNrXHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdXNlLnN0YXJ0WCA9IChlLmNsaWVudFggfHwgZS5wYWdlWCkgLSB0aGlzLm9mZnNldFg7XHJcbiAgICAgICAgdGhpcy5tb3VzZS5zdGFydFkgPSAoZS5jbGllbnRZIHx8IGUucGFnZVkpIC0gdGhpcy5vZmZzZXRZO1xyXG4gICAgICAgIHRoaXMuc3RhcnRTd2lwZSgpO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnggPSAoZS5jbGllbnRYIHx8IGUucGFnZVgpIC0gdGhpcy5vZmZzZXRYO1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnkgPSAoZS5jbGllbnRZIHx8IGUucGFnZVkpIC0gdGhpcy5vZmZzZXRZO1xyXG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XHJcbiAgICAgICAgICAgIGxldCBkaWZmWSA9IE1hdGguYWJzKHRoaXMubW91c2UueSAtIHRoaXMubW91c2Uuc3RhcnRZKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXhlID0gZGlmZlggPiBkaWZmWSA/IFN3aXBlQXhlcy5IT1JJWk9OVEFMIDogU3dpcGVBeGVzLlZFUlRJQ0FMO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZlggPiAxMiB8fCBkaWZmWSA+IDEyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCAmJiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCkgfHwgKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuVkVSVElDQUwgJiYgISF0aGlzLnNldHRpbmdzLnZlcnRpY2FsKSkge1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTd2lwZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzLnZpZXcuZmluZCgnYScpLmNzcyh7ICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlVXAgPSAoZSk6IHZvaWR8Ym9vbGVhbiA9PiB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5lbmRTd2lwZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnZpZXcuZmluZCgnYScpLmNzcyh7ICdwb2ludGVyLWV2ZW50cyc6ICcnIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmF4ZSA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblRvdWNoU3RhcnQgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlLnN0YXJ0WCA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VYO1xyXG4gICAgICAgIHRoaXMubW91c2Uuc3RhcnRZID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XHJcbiAgICAgICAgdGhpcy5zdGFydFN3aXBlKCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblRvdWNoTW92ZSA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnggPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgICAgICAgdGhpcy5tb3VzZS55ID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XHJcbiAgICAgICAgICAgIGxldCBkaWZmWSA9IE1hdGguYWJzKHRoaXMubW91c2UueSAtIHRoaXMubW91c2Uuc3RhcnRZKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXhlID0gZGlmZlggPiBkaWZmWSA/IFN3aXBlQXhlcy5IT1JJWk9OVEFMIDogU3dpcGVBeGVzLlZFUlRJQ0FMO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZlggPiAxMiB8fCBkaWZmWSA+IDEyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCAmJiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCkgfHwgKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuVkVSVElDQUwgJiYgISF0aGlzLnNldHRpbmdzLnZlcnRpY2FsKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTd2lwZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYXhlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXBpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uVG91Y2hFbmQgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xyXG4gICAgICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kU3dpcGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5heGUgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhcnRTd2lwZSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN3aXBpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5zdGFydFggPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0WSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuYXhlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihTd2lwZUV2ZW50cy5TVEFSVCwge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdbMF0sXHJcbiAgICAgICAgICAgICAgICB4OiB0aGlzLm1vdXNlLnN0YXJ0WCAtIHRoaXMudmlldy5vZmZzZXQoKS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeTogdGhpcy5tb3VzZS5zdGFydFkgLSB0aGlzLnZpZXcub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kaGFuZGxlci5hZGRDbGFzcygnaXMtZ3JhYmJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU3dpcGUoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGxldCB4ID0gdGhpcy5zdGFydFggKyB0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCxcclxuICAgICAgICAgICAgeSA9IHRoaXMuc3RhcnRZICsgdGhpcy5tb3VzZS55IC0gdGhpcy5tb3VzZS5zdGFydFk7XHJcblxyXG4gICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgdGhpcy55ID0geTtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLlVQREFURSwge1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudmlld1swXSxcclxuICAgICAgICAgICAgZGVsdGFYOiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCA/IHggOiAwLFxyXG4gICAgICAgICAgICBkZWx0YVk6ICEhdGhpcy5zZXR0aW5ncy52ZXJ0aWNhbCA/IHkgOiAwLFxyXG4gICAgICAgICAgICB4OiB0aGlzLm1vdXNlLngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMubW91c2UueSxcclxuICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhhbmRsZXIuYWRkQ2xhc3MoJ2lzLWRyYWdnZWQnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZW5kU3dpcGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zd2lwaW5nID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGRpcmVjdGlvbiA9IHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCA/ICh0aGlzLnggPCB0aGlzLnN0YXJ0WCA/IFN3aXBlRGlyZWN0aW9ucy5MRUZUIDogU3dpcGVEaXJlY3Rpb25zLlJJR0hUKSA6ICh0aGlzLnkgPCB0aGlzLnN0YXJ0WSA/IFN3aXBlRGlyZWN0aW9ucy5VUCA6IFN3aXBlRGlyZWN0aW9ucy5ET1dOKTtcclxuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gU3dpcGVBeGVzLkhPUklaT05UQUwgJiYgTWF0aC5hYnModGhpcy5tb3VzZS54IC0gdGhpcy5tb3VzZS5zdGFydFgpIDwgdGhpcy5zZXR0aW5ncy5taW5pbXVtID8gU3dpcGVEaXJlY3Rpb25zLk5PTkUgOiBkaXJlY3Rpb247XHJcbiAgICAgICAgZGlyZWN0aW9uID0gdGhpcy5heGUgPT09IFN3aXBlQXhlcy5WRVJUSUNBTCAmJiBNYXRoLmFicyh0aGlzLm1vdXNlLnkgLSB0aGlzLm1vdXNlLnN0YXJ0WSkgPCB0aGlzLnNldHRpbmdzLm1pbmltdW0gPyBTd2lwZURpcmVjdGlvbnMuTk9ORSA6IGRpcmVjdGlvbjtcclxuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gbnVsbCA/IFN3aXBlRGlyZWN0aW9ucy5OT05FIDogZGlyZWN0aW9uO1xyXG4gICAgICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiA9PT0gU3dpcGVEaXJlY3Rpb25zLk5PTkUgJiYgIXRoaXMuZHJhZ2dlZCA/IFN3aXBlRGlyZWN0aW9ucy5DTElDSyA6IGRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLkVORCwge1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudmlld1swXSxcclxuICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXHJcbiAgICAgICAgICAgIGluc3RhbmNlOiB0aGlzLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRoYW5kbGVyLnJlbW92ZUNsYXNzKCdpcy1ncmFiYmVkIGlzLWRyYWdnZWQnKTtcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFRvb2x0aXAgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSAkYnV0dG9uOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRjbG9zZTogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRidXR0b24gPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRvZ2dsZScpO1xyXG4gICAgICAgIHRoaXMuJGNsb3NlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykgOiBudWxsO1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvbi5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25CdXR0b25DbGlja0hhbmRsZXIpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgLm9mZignbW91c2VvbicpLm9uKCdtb3VzZWVudGVyLm1vdXNlb24nLCB0aGlzLm9uTW91c2VFbnRlcilcclxuICAgICAgICAgICAgLm9mZignbW91c2VvZmYnKS5vbignbW91c2VsZWF2ZS5tb3VzZW9mZicsIHRoaXMub25Nb3VzZUxlYXZlKTtcclxuXHJcbiAgICAgICAgJGRvYy5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuJGNsb3NlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNsb3NlLm9uKCdjbGljay50b29sdGlwJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlRW50ZXIgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZUxlYXZlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25CdXR0b25DbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAvLyBpZiAoIWJyZWFrcG9pbnQuZGVza3RvcCkge1xyXG4gICAgICAgIC8vICAgICBhbGVydCgkKGUuY3VycmVudFRhcmdldClbMF0pO1xyXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygkKGUuY3VycmVudFRhcmdldClbMF0pO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCApIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW4oKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgIH0sIDI1MCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5hZGRDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNsb3NlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5yZW1vdmVDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IENvbXBvbmVudCwgQ29tcG9uZW50RXZlbnRzIH0gZnJvbSAnLi4vY29tcG9uZW50cy9Db21wb25lbnQnO1xyXG4vLyBpbXBvcnQgQmFja2dyb3VuZCBmcm9tICcuLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcclxuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4uL0NsYXNzZXMnO1xyXG5pbXBvcnQgeyAkYXJ0aWNsZSwgJGJvZHksICRtYWluIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFnZUV2ZW50cyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST0dSRVNTOiBzdHJpbmcgPSAncHJvZ3Jlc3MnO1xyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDT01QTEVURTogc3RyaW5nID0gJ2NvbXBsZXRlJztcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnYXBwZW5kJztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhZ2UgZXh0ZW5kcyBIYW5kbGVyIHtcclxuXHJcbiAgICBwdWJsaWMgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xyXG4gICAgLy8gcHVibGljIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XHJcbiAgICBwcml2YXRlIGxvYWRlcjogSlF1ZXJ5RGVmZXJyZWQ8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZD47XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBvcHRpb25zPykge1xyXG5cclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMudmlldy5jc3MoeyBvcGFjaXR5OiAwIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyh0aGlzLnZpZXcucGFyZW50KCkuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcHJlbG9hZCBuZWNlc3NhcnkgYXNzZXRzOlxyXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gbG9hZGluZyBpbWFnZXMgcHJvbWlzZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcHJlbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgICAgbGV0IGlsID0gaW1hZ2VzTG9hZGVkKHRoaXMudmlldy5maW5kKCcucHJlbG9hZCcpLnRvQXJyYXkoKSwgPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWRPcHRpb25zPnsgYmFja2dyb3VuZDogdHJ1ZSB9KTtcclxuICAgICAgICBsZXQgaW1hZ2VzID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgaW1hZ2VzID0gaW1hZ2VzLmNvbmNhdChjb21wb25lbnQucHJlbG9hZEltYWdlcygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgdXJsIG9mIGltYWdlcykge1xyXG4gICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKHVybCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlciA9IGlsLmpxRGVmZXJyZWQ7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyLnByb2dyZXNzKChpbnN0YW5jZTogSW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZCwgaW1hZ2U6IEltYWdlc0xvYWRlZC5Mb2FkaW5nSW1hZ2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyID0gaW5zdGFuY2UucHJvZ3Jlc3NlZENvdW50IC8gaW5zdGFuY2UuaW1hZ2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLlBST0dSRVNTLCBwcm9ncmVzcyk7XHJcbiAgICAgICAgICAgIH0pLmFsd2F5cygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoUGFnZUV2ZW50cy5DT01QTEVURSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGVjayBpZiBhbnkgQ29tcG9uZW50IGNhbiBiZSBjaGFuZ2VkIGFmdGVyIG9uU3RhdGVcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSB3aGVuIG9uZSBvZiB0aGUgY29tcG9uZW50cyB0YWtlcyBhY3Rpb24gaW4gb25TdGF0ZSBmdW5jdGlvbiBjYWxsXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY2hhbmdlZDogYm9vbGVhbiA9ICEhZmFsc2U7XHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDaGFuZ2VkOiBib29sZWFuID0gY29tcG9uZW50Lm9uU3RhdGUoKTtcclxuICAgICAgICAgICAgaWYgKCFjaGFuZ2VkICYmICEhY29tcG9uZW50Q2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjaGFuZ2VkO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWdlIGVudGVyaW5nIGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IGFuaW1hdGlvbiBkZWxheVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYW5pbWF0ZUluKGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcclxuICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5jYWxsQWxsKHRoaXMuY29tcG9uZW50cywgJ2FuaW1hdGVJbicpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb21wb25lbnRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1tpXS5hbmltYXRlSW4oaSwgZGVsYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogMC40LFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWdlIGV4aXQgYW5pbWF0aW9uXHJcbiAgICAgKiAoY2FsbGVkIGFmdGVyIG5ldyBjb250ZW50IGlzIGxvYWRlZCBhbmQgYmVmb3JlIGlzIHJlbmRlcmVkKVxyXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gYW5pbWF0aW9uIHByb21pc2VcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcclxuICAgICAgICAvLyBhbmltYXRpb24gb2YgdGhlIHBhZ2U6XHJcbiAgICAgICAgJG1haW4ucmVtb3ZlQ2xhc3MoJ2lzLWxvYWRlZCcpO1xyXG4gICAgICAgIGdzYXAuc2V0KGJnLCB7IG9wYWNpdHk6IDAsIGRpc3BsYXk6ICdub25lJ30pO1xyXG4gICAgICAgIGxldCBwYWdlQW5pbWF0aW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGFuaW1hdGlvbnMgb2YgYWxsIGNvbXBvbmVudHM6XHJcbiAgICAgICAgbGV0IGNvbXBvbmVudEFuaW1hdGlvbnM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gdGhpcy5jb21wb25lbnRzLm1hcCgob2JqKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiA8UHJvbWlzZTx2b2lkPj5vYmouYW5pbWF0ZU91dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyByZXR1cm4gb25lIHByb21pc2Ugd2FpdGluZyBmb3IgYWxsIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbGxQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBjb21wb25lbnRBbmltYXRpb25zLmNvbmNhdChwYWdlQW5pbWF0aW9uUHJvbWlzZSk7XHJcblxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihhbGxQcm9taXNlcykudGhlbigocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PZmYnKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWaXNpYmlsaXR5IHdpZGdldCBoYW5kbGVyLCBmaXJlcyB3aGVuIHVzZXIgZXhpdHMgYnJvd3NlciB0YWJcclxuICAgICAqL1xyXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PbicpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IHdkdCAgICAgICAgd2luZG93IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gaGd0ICAgICAgICB3aW5kb3cgaGVpZ2h0XHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gYnJlYWtwb2ludCBJQnJlYWtwb2ludCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ6IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jYWxsQWxsKCdyZXNpemUnLCB3ZHQsIGhndCwgYnJlYWtwb2ludCwgYnBDaGFuZ2VkKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xlYW51cCB3aGVuIGNsb3NpbmcgUGFnZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ2Rlc3Ryb3knKTtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcclxuICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzID0ge307XHJcblxyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldyk7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcclxuXHJcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGJ1aWxkQ29tcG9uZW50cygkY29tcG9uZW50czogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9ICRjb21wb25lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRjb21wb25lbnQ6IEpRdWVyeSA9ICRjb21wb25lbnRzLmVxKGkpO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lOiBzdHJpbmcgPSAkY29tcG9uZW50LmRhdGEoJ2NvbXBvbmVudCcpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb21wb25lbnROYW1lLCBjb21wb25lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnROYW1lICE9PSB1bmRlZmluZWQgJiYgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogT2JqZWN0ID0gJGNvbXBvbmVudC5kYXRhKCdvcHRpb25zJyksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBDb21wb25lbnQgPSBuZXcgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSgkY29tcG9uZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnQub24oQ29tcG9uZW50RXZlbnRzLkNIQU5HRSwgdGhpcy5vbkNvbXBvbmVudENoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBgJXNgIGNvbXBvbmVudCEnLCBjb21wb25lbnROYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ29tcG9uZW50Q2hhbmdlID0gKGVsKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudHMoZWwuZmlsdGVyKCdbZGF0YS1jb21wb25lbnRdJykuYWRkKGVsLmZpbmQoJ1tkYXRhLWNvbXBvbmVudF0nKSkpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNIQU5HRSwgZWwpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBzaG9ydCBjYWxsXHJcbiAgICBwcml2YXRlIGNhbGxBbGwoZm46IHN0cmluZywgLi4uYXJncyk6IHZvaWQge1xyXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRbZm5dID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnRbZm5dLmFwcGx5KGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuIl19
