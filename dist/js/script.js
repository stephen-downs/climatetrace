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
const Parallax_1 = require("./components/Parallax");
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
    Parallax: Parallax_1.Parallax
};
exports.pages = {
    Page: Page_1.Page
};
},{"./components/Chart":13,"./components/Dashboard":15,"./components/Dropdown":16,"./components/Filters":17,"./components/Masonry":18,"./components/Parallax":19,"./components/Range":20,"./components/Slider":21,"./components/Stats":22,"./components/Tooltip":24,"./pages/Page":25}],5:[function(require,module,exports){
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
        $('[data-hamburger]').on('click', PushStates.asideToggle);
    }
    setActiveLinks() {
        $('a[href]').removeClass('is-active');
        $('a[href="' + window.location.pathname + '"]').addClass('is-active');
    }
}
exports.PushStates = PushStates;
PushStates.TIME_LIMIT = 5000;
PushStates.noChange = false;
PushStates.asideToggle = (e) => {
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
            case 'words':
                gsap.set($el, { opacity: 1 });
                const txt = $el;
                const splittxt = new SplitText(txt, { type: 'words, chars' });
                gsap.fromTo(splittxt.chars, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.05 });
                break;
            case 'itemsFade':
                const elements = $el.find('.' + $el.data('elements') + '');
                const staggerEl = $el.data('stagger') ? $el.data('stagger') : 0.2;
                gsap.set($el, { opacity: 1 });
                gsap.set(elements, { opacity: 0 });
                gsap.fromTo(elements, { duration: 1, opacity: 0, x: -10 }, { x: 0, opacity: 1, stagger: staggerEl, delay: 0.2 });
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
},{"./Api":1,"./Breakpoint":2,"./Browser":3,"./Classes":4,"./Copy":5,"./Loader":7,"./PushStates":8,"./Scroll":9,"./Share":10,"./Utils":12,"./pages/Page":25}],12:[function(require,module,exports){
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
function getParams(url) {
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
}
exports.getParams = getParams;
;
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
const Utils = require("../Utils");
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
        this.resize = () => {
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
            if (!this.dataInit) {
                this.createDataObject();
            }
        };
        this.onClickTab = (e) => {
            this.toggleChart($(e.currentTarget).index());
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
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            const colWidth = this.graph.right / data.yPx.length;
            const maxX = data.xPercent * (this.graph.right - this.graph.left) + this.graph.left;
            data.yPx.forEach((y, i, a) => {
                const x = colWidth * i + this.graph.left;
                if (x <= maxX && data.xPercent > 0) {
                    this.ctx.lineTo(x, y);
                }
                else if (x < maxX + colWidth && data.xPercent > 0) {
                    this.ctx.lineTo(maxX, this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]));
                }
            });
            this.ctx.stroke();
            this.ctx.closePath();
            if (data.fill) {
                let lastX = this.margin.left;
                this.ctx.strokeStyle = 'transparent';
                this.ctx.fillStyle = data.color;
                this.ctx.globalAlpha = 0.4;
                this.ctx.beginPath();
                data.yPx.forEach((y, i, a) => {
                    const x = colWidth * i + this.graph.left;
                    if (x <= maxX && data.xPercent > 0) {
                        this.ctx.lineTo(x, y);
                        lastX = x;
                    }
                    else if (x < maxX + colWidth && data.xPercent > 0) {
                        this.ctx.lineTo(maxX, this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]));
                        lastX = maxX;
                    }
                });
                this.ctx.lineTo(lastX, this.graph.bottom);
                this.ctx.lineTo(this.graph.left, this.graph.bottom);
                this.ctx.fill();
                this.ctx.closePath();
            }
        };
        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');
        this.bind();
        this.resize();
        const paramsCharts = Utils.getParams(window.location.search).charts;
        const initCharts = paramsCharts ? paramsCharts.split(',').map((i) => parseInt(i, 10)) : [0, 3, 4];
        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, initCharts.indexOf(i) >= 0);
        }
    }
    createDataObject() {
        this.$tab.each((i, el) => {
            const dataItem = {
                id: i,
                xPercent: 0,
                yPoints: $(el).data('points'),
                color: this.setColor($(el).data('color')),
                yPx: this.calcYPx($(el).data('points')),
                fill: i === 0 ? true : false,
            };
            this.graphsData.push(dataItem);
        });
        this.dataInit = true;
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }
    toggleChart(index, show) {
        if (typeof show === 'undefined') {
            show = !this.graphsData[index].shown;
        }
        gsap.to(this.graphsData[index], {
            duration: 2,
            xPercent: show ? 1 : 0,
            ease: 'sine.inOut',
            onUpdate: this.draw,
        });
        this.$tab.eq(index).toggleClass('is-on-chart', show);
        this.graphsData[index].shown = show;
    }
    drawBg() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
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
            this.ctx.lineWidth = 1;
            this.ctx.fillStyle = this.colors.blue;
            this.ctx.fillText('' + val + '', 0, (this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.moveTo(this.margin.left, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.lineTo(this.canvas.width - this.margin.right, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.stroke();
        }
        for (let j = 0; j < years.length; j++) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.lineJoin = 'round';
            this.ctx.font = '500 12px Quicksand, sans-serif';
            this.ctx.fillStyle = this.colors.white;
            this.ctx.fillText('' + years[j] + '', (this.canvas.width + this.margin.right + this.margin.left) / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
            this.ctx.stroke();
        }
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
    getInterPointsY(x, pointA, pointB) {
        const [x1, y1] = pointA;
        const [x2, y2] = pointB;
        return (y2 - y1) * (x - x1) / (x2 - x1) + y1;
    }
}
exports.Chart = Chart;
},{"../Utils":12,"./Component":14}],14:[function(require,module,exports){
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
const Filters_1 = require("./Filters");
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
            this.view.attr('data-selected-country', current);
            setTimeout(() => {
                Filters_1.Filters.showPickedFilters(current);
            }, 300);
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
},{"../Site":11,"./Component":14,"./Filters":17}],17:[function(require,module,exports){
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
            Filters.showPickedFilters();
        };
        this.clearArray = () => {
            this.filters = [];
            this.$itemTime.removeClass('is-active');
            this.$itemSector.removeClass('is-active');
            this.$allSectors.removeClass('is-active');
            this.isAllChecked = false;
            this.unmarkTimeline();
            Filters.showPickedFilters();
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
            Filters.showPickedFilters();
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
            Filters.showPickedFilters();
        };
        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');
        this.$allSectors = this.view.find('.js-item-all');
        this.$picked = $('.js-picked-filter');
        this.$selectedCountry = this.view.find('[data-select]');
        Filters.instance = this;
        console.log(Filters.instance.$itemSector, Filters.instance.view.find('[data-selected]').data('selected'));
        this.bind();
    }
    static showPickedFilters(country) {
        let pickedSectors = Filters.instance.$itemSector.filter('.is-active').length > 0 ? Filters.instance.$itemSector.filter('.is-active') : null;
        let pickedTime = Filters.instance.$itemTime.filter('.is-active').length > 0 ? Filters.instance.$itemTime.filter('.is-active') : null;
        let pickedCountry = country ? country : Filters.instance.$selectedCountry.text();
        Filters.instance.$picked.find('span').remove();
        if (pickedSectors) {
            console.log(pickedSectors);
            if (pickedSectors.length === Filters.instance.$itemSector.length) {
                console.log('aal', Filters.instance.$allSectors);
                Filters.instance.$picked.append('<span>' + Filters.instance.$allSectors.text() + '</span>');
            }
            else {
                pickedSectors.each((i, el) => {
                    Filters.instance.$picked.append('<span>' + $(el).text() + '</span>');
                });
            }
        }
        if (pickedCountry) {
            console.log(pickedCountry);
            Filters.instance.$picked.append('<span>' + pickedCountry + '</span>');
        }
        if (pickedTime) {
            Filters.instance.$picked.append('<span>' + pickedTime.data('item-label') + '</span>');
        }
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
const Breakpoint_1 = require("../Breakpoint");
class Parallax extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.time = 2;
        this.onMouseMove = (event) => {
            this.moveX = (event.clientX / window.innerWidth) - 0.5;
            this.moveY = (event.clientY / window.innerHeight) - 0.5;
            this.animate(-this.moveX, -this.moveY);
        };
        this.settings = options;
        this.createValueArray();
        this.view.data('Parallax', this);
        if (Breakpoint_1.breakpoint.desktop) {
            this.bind();
        }
    }
    bind() {
        this.view.on('mousemove', this.onMouseMove);
    }
    createValueArray() {
        const selectors = (this.settings.elements).toString().replace(/\s/g, '').split(',');
        const moveX = (this.settings.moveX).map(Number);
        const moveY = (this.settings.moveY).map(Number);
        this.items = selectors.map((sel, i) => {
            const $el = this.view.find('.' + sel);
            if (!$el[0]) {
                console.warn(`There is no .${sel} element to use in parallax`);
            }
            return {
                $el: $el,
                moveX: moveX[i],
                moveY: moveY[i],
            };
        }).filter((item) => {
            return !!item.$el[0];
        });
    }
    animate(moveX, moveY) {
        if (!this.items) {
            return;
        }
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
exports.Parallax = Parallax;
},{"../Breakpoint":2,"./Component":14}],20:[function(require,module,exports){
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
},{"../Site":11,"./Component":14}],21:[function(require,module,exports){
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
},{"../Breakpoint":2,"../Site":11,"./Component":14,"./Swipe":23}],22:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
const Utils = require("../Utils");
class Stats extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.onTabClick = (e) => {
            const current = $(e.currentTarget);
            const index = current.data('tab');
            this.setActiveView(index);
        };
        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');
        this.$wrap = this.view.find('.js-tabs-wrapper');
        this.bind();
        this.setActiveView(parseInt(Utils.getParams(window.location.search).tab, 10) || 0);
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onTabClick);
    }
    setActiveView(index) {
        this.tabToShow = index;
        this.$tab.removeClass('is-active');
        this.$tab.filter('[data-tab=' + index + ']').addClass('is-active');
        this.hideCurrent().then(() => {
            this.show(this.tabToShow);
            this.tabToShow = null;
            Site_1.$window.resize();
        });
    }
    hideCurrent() {
        return new Promise((resolve, reject) => {
            if (!this.$current) {
                resolve();
                return;
            }
            gsap.to(this.$current, {
                opacity: 0,
                duration: 0.3,
                ease: 'sine',
                onComplete: () => {
                    this.$current.removeClass('is-active');
                    resolve();
                },
            });
        });
    }
    show(index) {
        return new Promise((resolve, reject) => {
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
        });
    }
}
exports.Stats = Stats;
},{"../Site":11,"../Utils":12,"./Component":14}],23:[function(require,module,exports){
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
},{"../Handler":6,"../Site":11,"../Utils":12}],24:[function(require,module,exports){
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
},{"../Site":11,"./Component":14}],25:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0NoYXJ0LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ29tcG9uZW50LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRGFzaGJvYXJkLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRHJvcGRvd24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9GaWx0ZXJzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvTWFzb25yeS50cyIsInNyYy90cy9jb21wb25lbnRzL1BhcmFsbGF4LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUmFuZ2UudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TbGlkZXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TdGF0cy50cyIsInNyYy90cy9jb21wb25lbnRzL1N3aXBlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsT0FB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RUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdDLE1BQU0sYUFBYSxHQUFXLFVBQVUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFHM0QsSUFBSSxhQUFhLEtBQUssU0FBUyxJQUFJLG9CQUFVLENBQUMsYUFBYSxDQUFDLEVBQUU7Z0JBQzFELE1BQU0sT0FBTyxHQUFXLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQzlDLFNBQVMsR0FBYyxJQUFJLG9CQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLEVBQUUsQ0FBQywyQkFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUNoRTtpQkFBTTtnQkFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxhQUFhLENBQUMsQ0FBQzthQUNyRTtTQUNKO0lBQ0wsQ0FBQztJQVNPLE9BQU8sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFJO1FBQy9CLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQyxJQUFJLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFVBQVUsRUFBRTtnQkFDckMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDL0Q7U0FDSjtJQUVMLENBQUM7Q0FDSjtBQWhORCxvQkFnTkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyAvIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XHJcbmltcG9ydCB7IGRlYnVnIH0gZnJvbSAnLi9TaXRlJztcclxuXHJcblxyXG5cclxuZGVjbGFyZSB2YXIgJGJvZHk7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBcGlEYXRhIHtcclxuICAgIHVybDogc3RyaW5nO1xyXG4gICAgYmVmb3JlQ2FsbD86IHN0cmluZztcclxuICAgIGNhbGxiYWNrPzogc3RyaW5nO1xyXG4gICAgZm9ybT86IGFueTtcclxuICAgIHBhcmFtcz86IGFueTtcclxuICAgIGxpa2U/OiBib29sZWFuO1xyXG4gICAgYWN0aW9uPzogJ1BPU1QnIHwgJ0RFTEVURScgfCAnR0VUJyB8ICdQVVQnIHwgJ1BBVENIJztcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBBUEkge1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYmVmb3JlQ2FsbHMgPSB7XHJcblxyXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICAgICAgaWYgKCEkYm9keS5oYXNDbGFzcygnaXMtbG9nZ2VkJykpIHtcclxuICAgICAgICAgICAgICAgICQoJy5qcy1sb2dpbicpLmxhc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICAgICAgbGV0IHBhc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgIGxldCAkZm9ybSA9ICRlbC5pcygnZm9ybScpID8gJGVsIDogJGVsLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAgICAgbGV0ICR2YWxpZGF0aW9uRWxlbSA9ICRmb3JtO1xyXG4gICAgICAgICAgICBsZXQgc3RlcFZhbGlkYXRpb247XHJcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcclxuICAgICAgICAgICAgaWYgKCRmb3JtLmhhc0NsYXNzKCdpcy1kb25lJykpIHtcclxuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdpcy1kb25lJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGlmICggISFkYXRhLnBhcmFtcyApIHtcclxuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSAgZGF0YS5wYXJhbXMudmFsaWRhdGVPbmU7XHJcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9ICBkYXRhLnBhcmFtcy5zY3JvbGxUbztcclxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcclxuXHJcbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdbcmVxdWlyZWRdOmlucHV0JykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICgoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlID0gL14oKFtePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSsoXFwuW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpJC87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlLnRlc3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1t2YWx1ZS5sZW5ndGggPiAwID8gJ2ludmFsaWQtZW1haWwnIDogJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykpIHttZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Bob25lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxUZWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsVGVsLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnaW5wdXRbbmFtZT16aXBjb2RlXScpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykgJiYgdmFsLmxlbmd0aCAhPSA1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKCEhcGFzc2VkKSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRmb3JtKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdoYXMtZXJyb3JzJyk7XHJcbiAgICAgICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkZm9ybS5hZGRDbGFzcygnaGFzLWVycm9ycycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY2FsbGJhY2tzID0ge1xyXG5cclxuICAgICAgICBvbkNvb2tpZXNDbG9zZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xyXG4gICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWhpZGRlbicpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9uU3Vic2NyaWJlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblN1YnNjcmliZScpO1xyXG4gICAgICAgICAgICBsZXQgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcclxuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgKGRhdGEuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSAgZGF0YS5zY3JvbGxUbztcclxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcblxyXG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISRtZXNzYWdlWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYXBwZW5kKCc8ZGl2IGNsYXNzPVwianMtbWVzc2FnZSBtZXNzYWdlXCI+Jyk7XHJcbiAgICAgICAgICAgICAgICAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgaHRtbCA9ICQoJzxwPicgKyByZXNwb25zZS5tZXNzYWdlICsgJzwvcD4nKTtcclxuXHJcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpLmFwcGVuZChodG1sKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtY29tcGxldGVkJyk7XHJcbiAgICAgICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcclxuICAgICAgICAgICAgICAgICRlbC5jbG9zZXN0KCcuam9pbicpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcclxuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dDpjaGVja2VkJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkZWxbMF0uaGFzQXR0cmlidXRlKCdkYXRhLXJlZGlyZWN0JykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgLy8gICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkbWVzc2FnZSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudHJpZ2dlcignYmx1cicpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBhbnkpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQodHlwZW9mIHRhcmdldCAhPT0gJ3VuZGVmaW5lZCcgPyB0YXJnZXQgOiAnYm9keScpO1xyXG5cclxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ1tkYXRhLWFwaV0nKS5ub3QoJ2Zvcm0nKS5vZmYoJy5hcGknKS5vbignY2xpY2suYXBpJywgQVBJLm9uQWN0aW9uKTtcclxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ2Zvcm1bZGF0YS1hcGldJykub2ZmKCcuYXBpJykub24oJ3N1Ym1pdC5hcGknLCBBUEkub25BY3Rpb24pLmF0dHIoJ25vdmFsaWRhdGUnLCAnbm92YWxpZGF0ZScpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjYWxsSXQoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCBjdXN0b21DYWxsYmFjaz86IEZ1bmN0aW9uKTogIFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0YSA9IEFQSS5wcmVwcm9jZXNzRGF0YShkYXRhLCAkZWwpO1xyXG5cclxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcclxuXHJcbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5hY3Rpb24gfHwgJ1BPU1QnO1xyXG4gICAgICAgIGRlbGV0ZSBkYXRhLmFjdGlvbjtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gZGF0YS51cmwgfHwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG4gICAgICAgIGRlbGV0ZSBkYXRhLnVybDtcclxuXHJcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUEkgZXJyb3I6ICcgKyBlLCBkYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoISFkZWJ1Zykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuYWx3YXlzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHByZXByb2Nlc3NEYXRhKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IElBcGlEYXRhIHtcclxuXHJcbiAgICAgICAgLy8gZ2V0IGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBmb3JtIGVsZW1lbnQ6XHJcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XHJcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdhY3Rpb24nKSA/ICRlbC5hdHRyKCdhY3Rpb24nKSA6IGRhdGEudXJsO1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJGVsLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIGZvcm0nLCBkYXRhLCBkYXRhLnBhcmFtcyxkYXRhLmZvcm0sICRlbC5maW5kKCc6aW5wdXQnKSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBsaW5rIGVsZW1lbnQ6XHJcbiAgICAgICAgaWYgKCRlbC5pcygnW2hyZWZdJykpIHtcclxuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2hyZWYnKSA/ICRlbC5hdHRyKCdocmVmJykgOiBkYXRhLnVybDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGdldCBhZGRpdGlvbmFsIGRhdGEgZnJvbSBleHRlcm5hbCBmb3JtOlxyXG4gICAgICAgIGlmIChkYXRhLmZvcm0gJiYgJChkYXRhLmZvcm0gYXMgc3RyaW5nKVswXSkge1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJChkYXRhLmZvcm0gYXMgc3RyaW5nKS5zZXJpYWxpemVPYmplY3QoKSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLmZvcm07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmbGF0dGVuOlxyXG4gICAgICAgIGlmIChkYXRhLnBhcmFtcykge1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgZGF0YS5wYXJhbXMpO1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5wYXJhbXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIHByZScsIGRhdGEsIGRhdGEucGFyYW1zKTtcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkFjdGlvbiA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpO1xyXG4gICAgICAgIGNvbnN0IGRhdGE6IElBcGlEYXRhID0gey4uLiQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdhcGknKX07XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSwgJ2RhdGEnKTtcclxuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcclxuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkZWwuY2xvc2VzdCgnZm9ybScpLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGJlZm9yZUNhbGwgaGFuZGxlcjpcclxuICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLmJlZm9yZUNhbGwgaW4gQVBJLmJlZm9yZUNhbGxzKSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuYmVmb3JlQ2FsbHNbZGF0YS5iZWZvcmVDYWxsXShkYXRhLCAkZWwpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25TdWNjZXNzID0gKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2sgaW4gQVBJLmNhbGxiYWNrcykge1xyXG4gICAgICAgICAgICAgICAgQVBJLmNhbGxiYWNrc1tkYXRhLmNhbGxiYWNrXShkYXRhLCAkZWwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIElCcmVha3BvaW50IHtcclxuICAgIGRlc2t0b3A6IGJvb2xlYW47XHJcbiAgICB0YWJsZXQ6IGJvb2xlYW47XHJcbiAgICBwaG9uZTogYm9vbGVhbjtcclxuICAgIHZhbHVlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBsZXQgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XHJcblxyXG5leHBvcnQgY2xhc3MgQnJlYWtwb2ludCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKSwgJzpiZWZvcmUnKTtcclxuICAgICAgICBjb25zdCBjc3NCZWZvcmVWYWx1ZSA9IGNzc0JlZm9yZS5nZXRQcm9wZXJ0eVZhbHVlKCdjb250ZW50JykucmVwbGFjZSgvW1xcXCJcXCddL2csICcnKTtcclxuXHJcbiAgICAgICAgYnJlYWtwb2ludCA9IHtcclxuICAgICAgICAgICAgZGVza3RvcDogY3NzQmVmb3JlVmFsdWUgPT09ICdkZXNrdG9wJyxcclxuICAgICAgICAgICAgcGhvbmU6IGNzc0JlZm9yZVZhbHVlID09PSAncGhvbmUnLFxyXG4gICAgICAgICAgICB0YWJsZXQ6IGNzc0JlZm9yZVZhbHVlID09PSAndGFibGV0JyxcclxuICAgICAgICAgICAgdmFsdWU6IGNzc0JlZm9yZVZhbHVlLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQlA6XCIsIGJyZWFrcG9pbnQudmFsdWUpO1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBsZXQgYnJvd3NlcjogSUJyb3dzZXI7XHJcbmRlY2xhcmUgbGV0IG9wcjtcclxuLy8gdHNsaW50OmRpc2FibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG4gICAgb3ByOiBhbnk7XHJcbiAgICBvcGVyYTogYW55O1xyXG4gICAgc2FmYXJpOiBhbnk7XHJcbiAgICBIVE1MRWxlbWVudDogYW55O1xyXG59XHJcbi8vIHRzbGludDplbmFibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQnJvd3NlciB7XHJcbiAgICBtb2JpbGU/OiBib29sZWFuO1xyXG4gICAgd2luZG93cz86IGJvb2xlYW47XHJcbiAgICBtYWM/OiBib29sZWFuO1xyXG4gICAgaWU/OiBib29sZWFuO1xyXG4gICAgaW9zPzogYm9vbGVhbjtcclxuICAgIG9wZXJhPzogYm9vbGVhbjtcclxuICAgIGZpcmVmb3g/OiBib29sZWFuO1xyXG4gICAgc2FmYXJpPzogYm9vbGVhbjtcclxuICAgIGNocm9tZT86IGJvb2xlYW47XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnJvd3NlcigpOiBJQnJvd3NlciB7XHJcbiAgICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xyXG4gICAgYnJvd3NlciA9IHtcclxuICAgICAgICBtb2JpbGU6ICgvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXBhZHxpcmlzfGtpbmRsZXxBbmRyb2lkfFNpbGt8bGdlIHxtYWVtb3xtaWRwfG1tcHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyAoY2V8cGhvbmUpfHhkYXx4aWluby9pLnRlc3QodWEpIHx8IC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QodWEuc3Vic3RyKDAsIDQpKSkgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgaW9zOiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdCh1YSksXHJcbiAgICAgICAgbWFjOiBuYXZpZ2F0b3IucGxhdGZvcm0udG9VcHBlckNhc2UoKS5pbmRleE9mKCdNQUMnKSA+PSAwLFxyXG4gICAgICAgIGllOiB1YS5pbmRleE9mKCdNU0lFICcpID4gMCB8fCAhIXVhLm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLyksXHJcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1hbnlcclxuICAgICAgICBvcGVyYTogKCEhKHdpbmRvdyBhcyBhbnkpLm9wciAmJiAhIW9wci5hZGRvbnMpIHx8ICEhKHdpbmRvdyBhcyBhbnkpLm9wZXJhIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignIE9QUi8nKSA+PSAwLFxyXG4gICAgICAgIGZpcmVmb3g6IHVhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXHJcbiAgICAgICAgc2FmYXJpOiAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KHVhKSxcclxuICAgICAgICB3aW5kb3dzOiB3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignd2luJykgPiAtMSxcclxuICAgIH07XHJcblxyXG4gICAgJCgnaHRtbCcpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtYWMnLCAhYnJvd3Nlci53aW5kb3dzICYmIChicm93c2VyLmlvcyB8fCBicm93c2VyLm1hYykpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCd3aW5kb3dzJywgYnJvd3Nlci53aW5kb3dzICYmICFicm93c2VyLm1hYyAmJiAhYnJvd3Nlci5pb3MpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtb2JpbGUnLCBicm93c2VyLm1vYmlsZSlcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2ZpcmVmb3gnLCBicm93c2VyLmZpcmVmb3gpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdzYWZhcmknLCBicm93c2VyLnNhZmFyaSlcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2llJywgYnJvd3Nlci5pZSk7XHJcblxyXG4gICAgcmV0dXJuIGJyb3dzZXI7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQnJvd3NlciB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBicm93c2VyID0gZ2V0QnJvd3NlcigpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IFNsaWRlciB9IGZyb20gJy4vY29tcG9uZW50cy9TbGlkZXInO1xyXG5pbXBvcnQgeyBUb29sdGlwIH0gZnJvbSAnLi9jb21wb25lbnRzL1Rvb2x0aXAnO1xyXG5pbXBvcnQgeyBEcm9wZG93biB9IGZyb20gJy4vY29tcG9uZW50cy9Ecm9wZG93bic7XHJcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL2NvbXBvbmVudHMvRmlsdGVycyc7XHJcbmltcG9ydCB7IERhc2hib2FyZCB9IGZyb20gJy4vY29tcG9uZW50cy9EYXNoYm9hcmQnO1xyXG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0cyc7XHJcbmltcG9ydCB7IE1hc29ucnkgfSBmcm9tICcuL2NvbXBvbmVudHMvTWFzb25yeSc7XHJcbmltcG9ydCB7IFJhbmdlIH0gZnJvbSAnLi9jb21wb25lbnRzL1JhbmdlJztcclxuaW1wb3J0IHsgQ2hhcnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ2hhcnQnO1xyXG5pbXBvcnQgeyBBc2lkZSB9IGZyb20gJy4vY29tcG9uZW50cy9Bc2lkZSc7XHJcbmltcG9ydCB7IFBhcmFsbGF4IH0gZnJvbSAnLi9jb21wb25lbnRzL1BhcmFsbGF4JztcclxuXHJcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XHJcbiAgICBTbGlkZXIsXHJcbiAgICBUb29sdGlwLFxyXG4gICAgRHJvcGRvd24sXHJcbiAgICBGaWx0ZXJzLFxyXG4gICAgRGFzaGJvYXJkLFxyXG4gICAgU3RhdHMsXHJcbiAgICBNYXNvbnJ5LFxyXG4gICAgUmFuZ2UsXHJcbiAgICBDaGFydCxcclxuICAgIFBhcmFsbGF4XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IHBhZ2VzID0ge1xyXG4gICAgUGFnZVxyXG59O1xyXG5cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9jbGlwYm9hcmQuZC50c1wiIC8+XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBDb3B5IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgICQoJ1tkYXRhLWNvcHldJykub24oJ2NsaWNrJywgKGUpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG5cclxuICAgICAgICAgICAgKHdpbmRvdy5DbGlwYm9hcmQgYXMgYW55KS5jb3B5KHVybCk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmluZm8oJ1wiJXNcIiBjb3BpZWQnLCB1cmwpO1xyXG5cclxuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1jb3BpZWQnKTtcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7ICRlbC5yZW1vdmVDbGFzcygnaXMtY29waWVkJyk7IH0sIDEwMDApO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBhYnN0cmFjdCBjbGFzcyBIYW5kbGVyIHtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBldmVudHM6IHsgW2tleTogc3RyaW5nXTogRnVuY3Rpb25bXSB9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yICgpIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIEF0dGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvbihldmVudE5hbWU6IHN0cmluZywgaGFuZGxlcjogRnVuY3Rpb24pOiBIYW5kbGVyIHtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHtcclxuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGhhbmRsZXIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZXRhY2ggYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cclxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gICBldmVudE5hbWUgcGxlYXNlIHVzZSBzdGF0aWMgbmFtZXNcclxuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBoYW5kbGVyICAgY2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAqIEByZXR1cm4ge0hhbmRsZXJ9ICAgICAgICAgICAgcmV0dXJucyBjdXJyZW50IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgb2ZmKGV2ZW50TmFtZT86IHN0cmluZywgaGFuZGxlcj86IEZ1bmN0aW9uKTogSGFuZGxlciB7XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnROYW1lID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5ldmVudHNbZXZlbnROYW1lXSkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcclxuXHJcbiAgICAgICAgaWYgKCBpbmRleCA+IC0xICkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ2FsbCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZVxyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IC4uLmV4dHJhUGFyYW1ldGVycyBwYXNzIGFueSBwYXJhbWV0ZXJzIHRvIGNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0cmlnZ2VyKGV2ZW50TmFtZTogc3RyaW5nLCAuLi5leHRyYVBhcmFtZXRlcnMpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcclxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLmZvckVhY2goZXZlbnQgPT4gZXZlbnQuYXBwbHkodGhpcywgW10uc2xpY2UuY2FsbChhcmdzLCAxKSkpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiZXhwb3J0IGNsYXNzIExvYWRlciB7XHJcblxyXG4gICAgcHJpdmF0ZSBwcm9ncmVzczogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSkge1xyXG4gICAgICAgIHRoaXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcclxuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzaG93KCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IHk6IDAsIGR1cmF0aW9uOiAwLjIgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuNSwgeTogMTAsIHdpZHRoOiB0aGlzLndpZHRoIHx8ICcxMDAlJyB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzZXQocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcclxuXHJcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3knXSk7XHJcblxyXG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMud2lkdGggKiBwcm9ncmVzcztcclxuXHJcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3dpZHRoJ10pO1xyXG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IGR1cmF0aW9uOiAwLjMsIHdpZHRoOiB3aWR0aCB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUod2R0OiBudW1iZXIsIGhndDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdkdDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9IYW5kbGVyJztcclxuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xyXG5pbXBvcnQgeyAkYm9keSwgJGFydGljbGUsICRwYWdlSGVhZGVyIH0gZnJvbSAnLi9TaXRlJztcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XHJcblxyXG4vLyBpbXBvcnQgeyBTaWdudXAgfSBmcm9tICcuL1NpZ251cCc7XHJcblxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXHJcbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXNFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFB1c2hTdGF0ZXM7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRJTUVfTElNSVQgPSA1MDAwO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGxvYWRlZERhdGE6IHN0cmluZztcclxuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XHJcbiAgICBwcml2YXRlIHRpbWVvdXQ7XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGRvY3VtZW50IHRpdGxlICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSB8fCAkKCcjbWFpbiA+IFtkYXRhLXRpdGxlXScpLmRhdGEoJ3RpdGxlJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZ29Ubyhsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXHJcbiAgICAgICAgICAgIGlzRGlmZmVyZW50ID0gcGF0aG5hbWUgIT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XHJcbiAgICAgICAgICAgIGlmICghIXJlcGxhY2UpIHtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBwYXRobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGlzRGlmZmVyZW50O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNoYW5nZVBhdGgobG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4sIHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgIGxldCBjaGFuZ2VkID0gUHVzaFN0YXRlcy5nb1RvKGxvY2F0aW9uLCByZXBsYWNlIHx8IHRydWUpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCEhY2hhbmdlZCkge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLnNldFRpdGxlKHRpdGxlIHx8IGRvY3VtZW50LnRpdGxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyB0byBiZSB1c2VkIHdpdGggUHVzaFN0YXRlcyAvIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFlbGVtZW50SXRzZWxmKSB7XHJcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmtzKHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGluayh0YXJnZXQgYXMgRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnbyBiYWNrIGluIGJyb3dzZXIgaGlzdG9yeVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmFjayh1cmw/OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgSGlzdG9yeWpzLmJhY2soKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybCkge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgJy8nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlbG9hZCgpOiB2b2lkIHtcclxuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCEkcGFnZUhlYWRlcikge1xyXG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XHJcbiAgICAgICAgICAgICRib2R5LmFkZENsYXNzKCduYXZiYXItYWx3YXlzLXNob3duJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXNpZGVUb2dnbGUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGxldCBlbCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgZWwudG9nZ2xlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtYXNpZGUtb3BlbicpO1xyXG5cclxuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xyXG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyd3aWxsLWNoYW5nZSc6ICd0cmFuc2Zvcm0nfSk7XHJcbiAgICAgICAgICAgIC8vIGZpeGVkcG9zaXRpb24gPSBTY3JvbGwuc2Nyb2xsVG9wO1xyXG4gICAgICAgICAgICBVdGlscy5kaXNhYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyBjbGVhclByb3BzOiAnd2lsbC1jaGFuZ2UnfSk7XHJcbiAgICAgICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xyXG4gICAgICAgICAgICBIaXN0b3J5anMuQWRhcHRlci5iaW5kKHdpbmRvdywgJ3N0YXRlY2hhbmdlJywgdGhpcy5vblN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsb2FkIG5ldyBjb250ZW50IHZpYSBhamF4IGJhc2VkIG9uIGN1cnJlbnQgbG9jYXRpb246XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHVybFxyXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuICAgICAgICBjb25zdCBzZWFyY2g6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHwgJyc7XHJcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHRpbWVvdXRcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIFB1c2hTdGF0ZXMuVElNRV9MSU1JVCk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXHJcbiAgICAgICAgLy8gYW5kIGRvIHRoZSByZXF1ZXN0OlxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyB0aGUgdXN1YWwgeGhyIHN0dWZmOlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXNUZXh0ICE9PSAnYWJvcnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNhdGNoaW5nIGVycm9yczpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGZ1bmN0aW9uIGNhbGxlZCBvbiBzdWNjZXNzZnVsIGRhdGEgbG9hZCAqL1xyXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YTogc3RyaW5nID0gdGhpcy5sb2FkZWREYXRhLnRyaW0oKTtcclxuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xyXG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xyXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxyXG4gICAgICAgIGlmIChjb250YWluZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlLXRyeSByZW5kZXJpbmcgaWYgbm9uZSBvZiBjb250YWluZXJzIHdlcmUgcmVuZGVyZWQ6XHJcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xyXG5cclxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2FqYXhfbG9hZGVkJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XHJcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xyXG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICQoY29udGFpbmVyKVxyXG4gICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcclxuICAgICAgICAgICAgLnNob3coKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyAqL1xyXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBiaW5kIGxpbmtzICovXHJcbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcclxuXHJcbiAgICAgICAgJCh0YXJnZXQpLmZpbmQoJ2EnKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcclxuICAgICAgICAgICAgLm5vdCgnW2Rvd25sb2FkXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZiQ9XCIuanBnXCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJ0ZWw6XCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxhbmddJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xyXG5cclxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jyk7XHJcblxyXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcclxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcclxuXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XHJcbiAgICAgICAgY29uc3QgYWx0ZXJuYXRlID0gJCgnW2RhdGEtYWx0ZXJuYXRlXScpLmRhdGEoJ2FsdGVybmF0ZScpO1xyXG4gICAgICAgIGNvbnN0IGFydGljbGVVUkwgPSBhbHRlcm5hdGUgPyBhbHRlcm5hdGVbbGFuZyB8fCBPYmplY3Qua2V5cyhhbHRlcm5hdGUpWzBdXSA6IG51bGw7XHJcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XHJcbiAgICAgICAgY29uc3QgaGVhZFVSTCA9IGhlYWRMaW5rID8gaGVhZExpbmsuaHJlZiA6IG51bGw7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbihhcnRpY2xlVVJMIHx8IGhlYWRVUkwgfHwgZS5jdXJyZW50VGFyZ2V0LmhyZWYpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGxpbmtzIGNsaWNrIGhhbmRsZXIgKi9cclxuICAgIHByaXZhdGUgb25DbGljayA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIGxldCAkc2VsZjogSlF1ZXJ5ID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpLFxyXG4gICAgICAgICAgICBzdGF0ZTogc3RyaW5nID0gJHNlbGYuYXR0cignaHJlZicpLnJlcGxhY2UoJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3QsICcnKSxcclxuICAgICAgICAgICAgdHlwZTogc3RyaW5nID0gJHNlbGYuYXR0cignZGF0YS1oaXN0b3J5Jyk7XHJcblxyXG4gICAgICAgIGlmICh0eXBlID09PSAnYmFjaycpIHtcclxuICAgICAgICAgICAgUHVzaFN0YXRlcy5iYWNrKHN0YXRlKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZXBsYWNlJykge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIFNjcm9sbC5yZXNldFNjcm9sbENhY2hlKHN0YXRlKTtcclxuICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogb24gaGFzaC1saW5rIGNsaWNrIGhhbmRsZXIgKi9cclxuICAgIHByaXZhdGUgb25IYXNoQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjbGljayBsaW5rJyk7XHJcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogSGlzdG9yeWpzIGBzdGF0ZWNoYW5nZWAgZXZlbnQgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcclxuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcclxuICAgICAgICBpZiAoIVB1c2hTdGF0ZXMubm9DaGFuZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogbWFyayBsaW5rcyBhcyBhY3RpdmUgKi9cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlTGlua3MoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnYVtocmVmXScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAkKCdhW2hyZWY9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvZ3NhcC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvc3BsaXQtdGV4dC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IFB1c2hTdGF0ZXMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50JztcclxuLy8gaW1wb3J0IHsgUHJvZ3Jlc3NiYXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZ3Jlc3NiYXInO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XHJcbmltcG9ydCB7ICR3aW5kb3csICRib2R5IH0gZnJvbSAnLi9TaXRlJztcclxuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XHJcblxyXG5pbnRlcmZhY2UgSUJhY2tncm91bmREYXRhIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdGVwOiBudW1iZXI7XHJcbiAgICBkYXJrZW46IGJvb2xlYW47XHJcbiAgICBkYXJrZW5EZWxheTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTY3JvbGxQYXJhbXMgZXh0ZW5kcyBPYmplY3Qge1xyXG4gICAgeD86IG51bWJlcjtcclxuICAgIHk/OiBudW1iZXI7XHJcbiAgICBzcGVlZD86IG51bWJlcjtcclxuICAgIGFuaW1hdGU/OiBib29sZWFuO1xyXG4gICAgcmVsYXRpdmVTcGVlZD86IGJvb2xlYW47XHJcbiAgICBlYXNlPzogc3RyaW5nO1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgICRlbD86IEpRdWVyeTtcclxuICAgIGRvbmU/OiBib29sZWFuO1xyXG4gICAgaGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgc3RhcnQ/OiBudW1iZXI7XHJcbiAgICB0eXBlPzogc3RyaW5nO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIGNvbXBvbmVudD86IENvbXBvbmVudDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElTY3JvbGxpbmdEYXRhIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xyXG4gICAgdG9wOiBudW1iZXI7XHJcbiAgICByb2xlOiBzdHJpbmc7XHJcbiAgICBwYXRoPzogc3RyaW5nO1xyXG4gICAgdGl0bGU/OiBzdHJpbmc7XHJcbiAgICBib3R0b20/OiBudW1iZXI7XHJcbiAgICBjaGlsZHJlbj86IGFueTtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgZGVsYXk/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBpbml0aWFsaXplZD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUGFyYWxsYXhDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBzaGlmdD86IG51bWJlcjtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFuaW1hdGlvbkNhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgIGRlbGF5PzogbnVtYmVyO1xyXG4gICAgdW5jYWNoZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJU2Nyb2xsQ2FjaGUge1xyXG4gICAgYW5pbWF0aW9ucz86IElBbmltYXRpb25DYWNoZUl0ZW1bXTtcclxuICAgIHBhcmFsbGF4ZXM/OiBJUGFyYWxsYXhDYWNoZUl0ZW1bXTtcclxuICAgIG1vZHVsZXM/OiBJQmFzZUNhY2hlSXRlbVtdO1xyXG4gICAgYmFja2dyb3VuZHM/OiBJQmFja2dyb3VuZENhY2hlSXRlbVtdO1xyXG4gICAgc2VjdGlvbnM/OiBJU2Nyb2xsaW5nRGF0YVtdO1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kQ2FjaGVJdGVtIGV4dGVuZHMgSUJhY2tncm91bmREYXRhLCBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBwZXJjZW50YWdlPzogbnVtYmVyO1xyXG4gICAgaW5kZXg/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBkZWxheT86IG51bWJlcjtcclxuICAgIGJyZWFrcG9pbnRzPzogc3RyaW5nW107XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNjcm9sbCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2Nyb2xsO1xyXG4gICAgcHVibGljIHN0YXRpYyB3aW5kb3dIZWlnaHQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBzdGF0aWMgaGVhZGVySGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1heFNjcm9sbDogbnVtYmVyO1xyXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlZDogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9wOiBudW1iZXI7XHJcbiAgICAvLyBwdWJsaWMgc3RhdGljIGN1c3RvbVNjcm9sbDogU2Nyb2xsYmFyO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VzdG9tU2Nyb2xsO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cclxuICAgIHByaXZhdGUgY2FjaGU6IElTY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBpZ25vcmVDYWNoZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcclxuICAgIHByaXZhdGUgdGFyZ2V0OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIHN0b3JlZFBhdGg6IHN0cmluZztcclxuICAgIHByaXZhdGUgc2VjdGlvbnM6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgY2hhbmdpbmdQYXRoOiBib29sZWFuO1xyXG5cclxuICAgIFxyXG4gICAgLyoqXHJcbiAgICAgKiBzY3JvbGxzIHBhZ2UgdG8gY2VydGFpbiBlbGVtZW50ICh0b3AgZWRnZSkgd2l0aCBzb21lIHNwZWVkXHJcbiAgICAgKiBAcGFyYW0gIHtKUXVlcnl9ICAgICAgICAkZWwgICAgW3RhcmdldCBlbG1lbnRdXHJcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICBvZmZzZXRcclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIGR1cmF0aW9uXHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSAgICAgICAgW2FmdGVyIGNvbXBsZXRlZCBhbmltYXRpb25dXHJcbiAgICAgKi9cclxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXHJcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvRWxlbWVudCgkZWw6IEpRdWVyeSwgb2Zmc2V0PzogbnVtYmVyLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgICAgICBTY3JvbGwuYW5pbWF0aW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgY29uc3QgeSA9ICRlbC5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0ICsgKG9mZnNldCB8fCAwKTtcclxuICAgICAgICAgICAgY29uc3Qgb2JqID0ge1xyXG4gICAgICAgICAgICAgICAgeTogTWF0aC5tYXgoZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AsIHdpbmRvdy5wYWdlWU9mZnNldCksXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZihvYmopO1xyXG4gICAgICAgICAgICBnc2FwLnRvKG9iaiwge1xyXG4gICAgICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0eXBlb2YgZHVyYXRpb24gPT09ICd1bmRlZmluZWQnID8gMSA6IGR1cmF0aW9uLFxyXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgb2JqLnkpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBTY3JvbGwuYW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyByZXNldFNjcm9sbENhY2hlKHBhdGhuYW1lKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlLmNhY2hlW3BhdGhuYW1lXSA9IDA7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHB1YmxpYyBzdGF0aWMgZGlzYWJsZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBlbmFibGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmRpc2FibGVkID0gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIFxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuaWdub3JlQ2FjaGUgPSAhIWJyb3dzZXIuc2FmYXJpO1xyXG5cclxuICAgICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xyXG4gICAgICAgICQoJ2FbaHJlZl49XCIjXCJdOm5vdChcIi5qcy1uYXYtaXRlbSwgW2RhdGEtbGlnaHRib3hdXCIpJykub24oJ2NsaWNrJywgdGhpcy5vbkhhc2hDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuICAgICAgICAvLyBTY3JvbGwuaXNDdXN0b21TY3JvbGwgPSAkKCcjd3BicycpLmRhdGEoJ3Njcm9sbGJhcicpO1xyXG5cclxuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gNzA7XHJcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZWRQYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC53aW5kb3dIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9ICQoJyNuYXZiYXInKS5oZWlnaHQoKTtcclxuICAgICAgICBTY3JvbGwubWF4U2Nyb2xsID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gU2Nyb2xsLndpbmRvd0hlaWdodCArIFNjcm9sbC5oZWFkZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9QYXRoKGZhc3Q/OiBib29sZWFuKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcclxuXHJcbiAgICAgICAgaWYgKCR0YXJnZXRbMF0pIHtcclxuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkdGFyZ2V0LCAwLCAwKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoISF0aGlzLmNoYW5naW5nUGF0aCkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gU2Nyb2xsLnNjcm9sbFRvUGF0aCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC5kaXNhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xyXG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJykub24oJ3Njcm9sbC5zY3JvbGxpbmcnLCAoKSA9PiB0aGlzLm9uU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhcnQoKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLmVuYWJsZSgpO1xyXG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5vblNjcm9sbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcclxuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25IYXNoQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgLy8gZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykpIHtcclxuICAgICAgICAgICAgbGV0IG9mZnNldCA9IHBhcnNlSW50KCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JyksIDEwKTtcclxuXHJcbiAgICAgICAgICAgIGlmICggdHlwZW9mICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykgPT09ICdzdHJpbmcnICkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb2ZmID0gJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKS5yZXBsYWNlKCd2aCcsICcnKTtcclxuICAgICAgICAgICAgICAgIG9mZnNldCA9ICQod2luZG93KS5oZWlnaHQoKSAqIChwYXJzZUludChvZmYsIDEwKSAvIDEwMCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCksIG9mZnNldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBidWlsZEJhY2tncm91bmRzKCk6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kIH0ge1xyXG4gICAgICAgIGxldCBiZ3MgPSB7fTtcclxuICAgICAgICAkKCdbZGF0YS1iZy1jb21wb25lbnRdJykudG9BcnJheSgpLmZvckVhY2goKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkYmdFbCA9ICQoZWwpO1xyXG4gICAgICAgICAgICBsZXQgYmdOYW1lID0gJGJnRWwuZGF0YSgnYmctY29tcG9uZW50Jyk7XHJcbiAgICAgICAgICAgIGxldCBiZ09wdGlvbnMgPSAkYmdFbC5kYXRhKCdvcHRpb25zJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50c1tiZ05hbWVdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmcgPSBuZXcgY29tcG9uZW50c1tiZ05hbWVdKCRiZ0VsLCBiZ09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYmcuaWQgPSBlbC5pZDtcclxuICAgICAgICAgICAgICAgIGJnc1tlbC5pZF0gPSBiZztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBjb21wb25lbnQgYXZhaWxhYmxlIScsIGJnTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhiZ3MsICdCR1MgU0NST0xMJyk7XHJcbiAgICAgICAgcmV0dXJuIGJncztcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLmVsZW1lbnRzKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnM6IEFycmF5PElBbmltYXRpb25DYWNoZUl0ZW0+ID0gW107XHJcbiAgICAgICAgY29uc3QgbWFyZ2luID0gMCA7XHJcblxyXG4gICAgICAgIC8vIGxldCBzZWN0aW9uczogQXJyYXk8SVNjcm9sbGluZ0RhdGE+ID0gW107XHJcbiAgICAgICAgLy8gaWYgKHRoaXMuc2VjdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGg7ICsraSkge1xyXG4gICAgXHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IHRoaXMuc2VjdGlvbnMuZXEoaSk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCByb2xlID0gJGVsLmRhdGEoJ3Njcm9sbCcpO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdG9wID0gJGVsLm9mZnNldCgpLnRvcDtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IGhlaWdodCA9ICRlbC5vdXRlckhlaWdodCgpO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGVsYXkgPSAkZWwuZGF0YSgnZGVsYXknKSB8fCAwO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdGl0bGUgPSAkZWwuZGF0YSgndGl0bGUnKSB8fCBmYWxzZTtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHBhdGggPSAkZWwuZGF0YSgncGF0aCcpIHx8IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGF0YTogSVNjcm9sbGluZ0RhdGEgPSB7XHJcbiAgICAgICAgLy8gICAgICAgICAgICAgJGVsOiAkZWwsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgcm9sZTogcm9sZSxcclxuICAgICAgICAvLyAgICAgICAgICAgICB0b3A6IHRvcCxcclxuICAgICAgICAvLyAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcclxuICAgICAgICAvLyAgICAgICAgICAgICBib3R0b206IHRvcCArIGhlaWdodCxcclxuICAgICAgICAvLyAgICAgICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcclxuICAgICAgICAvLyAgICAgICAgICAgICAkY2hpbGQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCksXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRyZW46IHt9LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHNob3duOiAkZWwuZGF0YSgnc2hvd24nKSB8fCBmYWxzZSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBkZWxheTogZGVsYXksXHJcbiAgICAgICAgLy8gICAgICAgICB9O1xyXG4gICAgXHJcbiAgICAgICAgLy8gICAgICAgICBzZWN0aW9ucy5wdXNoKGRhdGEpO1xyXG4gICAgICAgIC8vICAgICAgICAgJGVsLmRhdGEoJ2NhY2hlJywgaSk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgICAgICQoJ1tkYXRhLWFuaW1hdGlvbl0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xyXG4gICAgICAgICAgICBhbmltYXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXHJcbiAgICAgICAgICAgICAgICBzdGFydDogdHlwZW9mICRlbC5kYXRhKCdzdGFydCcpICE9PSAndW5kZWZpbmVkJyA/ICRlbC5kYXRhKCdzdGFydCcpIDogMC4xLFxyXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCAtIG1hcmdpbixcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICBkb25lOiAkZWwuaGFzQ2xhc3MoJ2FuaW1hdGVkJyksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiAkZWwuZGF0YSgnYW5pbWF0aW9uJyksXHJcbiAgICAgICAgICAgICAgICBkZWxheTogJGVsLmRhdGEoJ2RlbGF5JykgfHwgbnVsbCxcclxuICAgICAgICAgICAgICAgIHVuY2FjaGU6ICRlbC5kYXRhKCd1bmNhY2hlJyksXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIGNvbnN0IHBhcmFsbGF4ZXM6IEFycmF5PElQYXJhbGxheENhY2hlSXRlbT4gPSBbXTtcclxuICAgICAgICAkKCdbZGF0YS1wYXJhbGxheF0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoPEhUTUxFbGVtZW50PmVsKTtcclxuICAgICAgICAgICAgY29uc3QgcCA9ICRlbC5kYXRhKCdwYXJhbGxheCcpO1xyXG4gICAgICAgICAgICBwYXJhbGxheGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXHJcbiAgICAgICAgICAgICAgICBzdGFydDogMCxcclxuICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZW9mIHAgPT09ICdzdHJpbmcnID8gcCA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBzaGlmdDogdHlwZW9mIHAgPT09ICdudW1iZXInID8gcCA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcclxuICAgICAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLmhlaWdodCgpLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGJhY2tncm91bmRzOiBBcnJheTxJQmFja2dyb3VuZENhY2hlSXRlbT4gPSBbXTtcclxuICAgICAgICAkKCdbZGF0YS1iYWNrZ3JvdW5kXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmREYXRhID0gJGVsLmRhdGEoJ2JhY2tncm91bmQnKTtcclxuICAgICAgICAgICAgY29uc3QgYnJlYWtwb2ludHMgPSBiYWNrZ3JvdW5kRGF0YS5icmVha3BvaW50cyB8fCBbJ2Rlc2t0b3AnLCAndGFibGV0JywgJ3Bob25lJ107XHJcblxyXG4gICAgICAgICAgICBpZiAoYnJlYWtwb2ludHMuaW5kZXhPZihicmVha3BvaW50LnZhbHVlKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYmFja2dyb3VuZHNbYmFja2dyb3VuZERhdGEuaWRdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd0aGVyZVxcJ3Mgbm8gYmFja2dyb3VuZCB3aXRoIGlkPScgKyBiYWNrZ3JvdW5kRGF0YS5pZCArICchJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRzLnB1c2goJC5leHRlbmQoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXJrZW5EZWxheTogMCxcclxuICAgICAgICAgICAgICAgICAgICB9LCBiYWNrZ3JvdW5kRGF0YSB8fCB7fSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jYWNoZS5hbmltYXRpb25zID0gYW5pbWF0aW9ucztcclxuICAgICAgICB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMgPSBwYXJhbGxheGVzO1xyXG4gICAgICAgIHRoaXMuY2FjaGUuYmFja2dyb3VuZHMgPSBiYWNrZ3JvdW5kcztcclxuICAgICAgICAvLyB0aGlzLmNhY2hlLnNlY3Rpb25zID0gc2VjdGlvbnM7XHJcblxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblNjcm9sbCA9ICgpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKFNjcm9sbC5kaXNhYmxlZCB8fCAkYm9keS5oYXNDbGFzcygnaXMtYXNpZGUtb3BlbicpKSB7IHJldHVybjsgfVxyXG5cclxuICAgICAgICBjb25zdCBzVCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IDA7XHJcbiAgICAgICAgY29uc3Qgd2luZG93SGVpZ2h0ID0gU2Nyb2xsLndpbmRvd0hlaWdodDtcclxuICAgICAgICBjb25zdCBzY3JlZW5DZW50ZXI6IG51bWJlciA9IHNUICsgU2Nyb2xsLndpbmRvd0hlaWdodCAqIDAuMzM7XHJcbiAgICAgICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gU2Nyb2xsLmhlYWRlckhlaWdodDtcclxuICAgICAgICBjb25zdCBzY3JvbGxlbmQgPSAkKCcjbWFpbicpLm91dGVySGVpZ2h0KCkgLSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAyO1xyXG4gICAgICAgIGNvbnN0IHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykub2Zmc2V0KCkudG9wIC0gKFNjcm9sbC5oZWFkZXJIZWlnaHQgKiAyKSA6IDA7XHJcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZHMgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykub2Zmc2V0KCkudG9wIC0gU2Nyb2xsLmhlYWRlckhlaWdodCA6IDA7XHJcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvcCA9IHNUO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsQ2FjaGVbd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXSA9IHNUO1xyXG5cclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtd2luZG93LWhlaWdodCcsIHNUID4gd2luZG93SGVpZ2h0IC0gMTAwKTtcclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtbmF2YmFyJywgc1QgPiAxMDApO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZCcsIHNUID4gMCk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnLCBzVCA+IHBhZ2VIZWFkZXIpO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1iYWNrZ3JvdW5kcy1zY3JvbGxlZCcsIHNUID4gYmFja2dyb3VuZHMpO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGwtZW5kJywgc1QgPj0gc2Nyb2xsZW5kKTtcclxuXHJcblxyXG4gICAgICAgIC8vIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYW5pbWF0aW9ucyAmJiB0aGlzLmNhY2hlLmFuaW1hdGlvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbTogSUFuaW1hdGlvbkNhY2hlSXRlbSA9IHRoaXMuY2FjaGUuYW5pbWF0aW9uc1tpXTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHlUb3A6IG51bWJlciA9IHNUO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVk6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS55IDogaXRlbS4kZWwub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLmhlaWdodCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghaXRlbS5kb25lICYmIGl0ZW1ZIDw9IHlCb3R0b20gJiYgaXRlbVkgKyBpdGVtSGVpZ2h0ID49IHNUKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBxdWljazogYm9vbGVhbiA9IHlUb3AgPj0gaXRlbVkgKyBpdGVtSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW5pbWF0ZShpdGVtLCBpdGVtLiRlbCwgaXRlbS50eXBlLCBpdGVtLmRlbGF5LCBxdWljayk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEhaXRlbS5kb25lICYmIGl0ZW0uY29tcG9uZW50ICYmIGl0ZW0udHlwZSA9PT0gJ3RvZ2dsZScgJiYgKGl0ZW1ZID4geUJvdHRvbSB8fCBpdGVtWSArIGl0ZW1IZWlnaHQgPCB5VG9wKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5jb21wb25lbnRbJ2Rpc2FibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLnVuY2FjaGUgJiYgaXRlbS5kb25lICYmIChzVCA8PSBpdGVtWSAtIHdpbmRvd0hlaWdodCB8fCBzVCA+PSBpdGVtWSArIHdpbmRvd0hlaWdodCApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmZpbmQoJy51bmNhY2hlZCcpLmxlbmd0aCA+IDApIHsgaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykucmVtb3ZlQXR0cignc3R5bGUnKTsgfVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLiRlbC5hdHRyKCdkYXRhLXVuY2FjaGUnKSkgeyBpdGVtLiRlbC5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAvLyBwYXJhbGxheGVzOlxyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLnBhcmFsbGF4ZXMgJiYgdGhpcy5jYWNoZS5wYXJhbGxheGVzLmxlbmd0aCA+IDAgJiYgYnJlYWtwb2ludC5kZXNrdG9wKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5wYXJhbGxheGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFsbGF4KHRoaXMuY2FjaGUucGFyYWxsYXhlc1tpXSwgc1QsIHdpbmRvd0hlaWdodCwgLWhlYWRlckhlaWdodCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAvL2Jnc1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAuNSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgLy8gY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgYmdzVG9TaG93ID0gW107XHJcbiAgICAgICAgICAgIGxldCBiZ3NUb0hpZGUgPSBbXTtcclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzLmZvckVhY2goKGl0ZW06IElCYWNrZ3JvdW5kQ2FjaGVJdGVtLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgXHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVk6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS55IDogaXRlbS4kZWwub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtQm90dG9tOiBudW1iZXIgPSBpdGVtWSArIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBzVCArIGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBpdGVtLnN0YXJ0ICogd2luZG93SGVpZ2h0IDogd2luZG93Q2VudGVyO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSB0aGlzLmJhY2tncm91bmRzW2l0ZW0uaWRdO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsYXkgPSB0eXBlb2YgaXRlbS5kZWxheSAhPT0gJ3VuZGVmaW5lZCcgPyBpdGVtLmRlbGF5IDogMC4xO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudGFnZSA9IC0gKGl0ZW1ZIC0geUNlbnRlcikgLyBpdGVtSGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgbGV0IGJhY2tncm91bmRRdWlja1NldHVwID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBsZXQgY3VycmVudCA9ICRib2R5Lmhhc0NsYXNzKCdpcy10cmFpbGVyLXNjcm9sbGVkJykgPyBzVCArIHdpbmRvd0hlaWdodCA+PSBpdGVtWSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QgOiBpdGVtWSAtIHNUIDw9IHdpbmRvd0NlbnRlciAmJiBpdGVtQm90dG9tIC0gc1QgPj0gd2luZG93Q2VudGVyO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdGlvbkluKGZhbHNlLCAyKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLnNob3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWJhY2tncm91bmQuc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIGRlbGF5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQudXBkYXRlKHBlcmNlbnRhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuc2V0U3RlcChpdGVtLnN0ZXAsIGJhY2tncm91bmRRdWlja1NldHVwKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5kYXJrZW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5kYXJrZW4oaXRlbVkgPD0geUNlbnRlciAtIHdpbmRvd0hlaWdodCAqIGl0ZW0uZGFya2VuRGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiZ3NUb1Nob3cucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLnNob3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmdzVG9IaWRlLnB1c2goaXRlbS5pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoYmdzVG9IaWRlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgYmdzVG9IaWRlLmZvckVhY2goKGJnSUQpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYmdzVG9TaG93LmluZGV4T2YoYmdJRCkgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZHNbYmdJRF0uYW5pbWF0aW9uT3V0KGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5zaG93bj0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gUHJvZ3Jlc3NiYXIudXBkYXRlKHNUKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBhbmltYXRlKGRhdGE6IElBbmltYXRpb25DYWNoZUl0ZW0sICRlbDogSlF1ZXJ5LCB0eXBlOiBzdHJpbmcsIGRlbGF5OiBudW1iZXIgPSAwLjEgYXMgbnVtYmVyLCBxdWljaz86IGJvb2xlYW4sIHVuY2FjaGU/OiBib29sZWFuKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGNvbnN0IHRpbWUgPSAhcXVpY2sgPyAuNiA6IDA7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZSc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVVcCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiA0MCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlRG93bic6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiAtMTAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB5OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZVJpZ2h0JzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHg6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlTGVmdCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAxMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHg6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpVGFicyc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBsVGV4dCA9ICRlbC5maW5kKCdzcGFuOmZpcnN0LWNoaWxkJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByVGV4dCA9ICRlbC5maW5kKCdzcGFuOmxhc3QtY2hpbGQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhsVGV4dCwgeyBkdXJhdGlvbjogMC41LCB4OiAnNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhyVGV4dCwgeyBkdXJhdGlvbjogMC41LCB4OiAnLTUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZWxlbWVudHMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ1tkYXRhLXZpZXctdGFiXScpLCB7IGR1cmF0aW9uOiAxLCB5OiAnMTAwJScgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIHk6ICcwJScsIHN0YWdnZXI6IDAuMixcclxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5pdGVtX190YWJzJyksIHsgZHVyYXRpb246IDEsIG92ZXJmbG93OiAndW5zZXQnIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFjdCc6XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGZUZXh0ID0gJGVsLmZpbmQoJy5mYWN0X190ZXh0IHNwYW4nKSxcclxuICAgICAgICAgICAgICAgICAgICBzcGxpdEZUeHQgPSBuZXcgU3BsaXRUZXh0KGZUZXh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnfSksXHJcbiAgICAgICAgICAgICAgICAgICAgZkltZyA9ICRlbC5maW5kKCcuZmFjdF9faW1hZ2Utd3JhcCcpLFxyXG4gICAgICAgICAgICAgICAgICAgIGZBcnIgPSAkZWwuZmluZCgnLmZhY3RfX2ljb24nKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKClcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGZBcnIsIHsgZHVyYXRpb246IDEsIHJvdGF0ZTogOTAgfSwgeyByb3RhdGU6IDAsIGRlbGF5OiAwLjUgfSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKHNwbGl0RlR4dC5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTUgfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjAxIH0sICctPTAuOCcpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmSW1nLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxIH0sICctPTAuNScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnbGVhZCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdCA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBsaW5lcycsIGxpbmVzQ2xhc3M6ICdsaW5lJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gJGVsLmZpbmQoJy5saW5lJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICQobGluZXNbaV0pLmFmdGVyKCc8YnI+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYXBwZW5kKCc8c3BhbiBjbGFzcz1cImxpbmVfX2JnXCI+PC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0LndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xLCBkZWxheTogMC40IH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50bygkZWwuZmluZCgnLmxpbmVfX2JnJyksIHsgZHVyYXRpb246IDAuNzUsIHNjYWxlWDogMSwgc3RhZ2dlcjogMC4xfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdzY2FsZSc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMH0se3NjYWxlWDogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGRlbGF5fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdjaGFycyc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdEggPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRILmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDAsIG9wYWNpdHk6IDAgfSwgeyBzY2FsZVg6IDEsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdjaGFycy1zaW1wbGUnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIMiA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEgyLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3dvcmRzLXNpbXBsZSc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB3b3JkcyA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXIgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHdvcmRzLndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlcn0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaW1hZ2VzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbC5maW5kKCdpbWcnKSwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSwgc3RhZ2dlcjogMC4yIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGVybyc6XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC50bygkZWwsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIHBvaW50ZXJFdmVudHM6ICdub25lJywgZGVsYXk6IDAuNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvRWxlbWVudHMgPSAkZWwuZmluZCgnLmhlcm8taW1hZ2U6bm90KC5qcy10aW55KScpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdGlueSA9ICRlbC5maW5kKCcuanMtdGlueScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbSh0aW55LCB7IGR1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHN0YWdnZXI6IC0wLjA1LCBkZWxheTogMC41fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGhlcm9FbGVtZW50cywge1xyXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAxLjUsIHg6ICctNTAlJywgeTogJzUwJScsIHN0YWdnZXI6IC0wLjA1LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IHBvaW50ZXJFdmVudHM6ICdhbGwnIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAncXVvdGUnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgJHF1b3RlID0gJGVsLmZpbmQoJy5qcy1xdW90ZS13b3JkcycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgJGF1dGhvciA9ICRlbC5maW5kKCcuanMtcXVvdGUtYXV0aG9yJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkbGluZSA9ICRlbC5maW5kKCdocicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFskcXVvdGUsICRlbCwgJGF1dGhvcl0sIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9ICRxdW90ZS5jaGlsZHJlbigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRRdW90ZSA9IG5ldyBTcGxpdFRleHQoJHF1b3RlLCB7IHR5cGU6ICd3b3JkcycgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRk9SIFVOQ0FDSEUgT1BUSU9OIE9GIEFOSU1BVElPTiBRVU9URVxyXG4gICAgICAgICAgICAgICAgLy8gZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0UXVvdGUud29yZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBzcGxpdFF1b3RlLndvcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b1JlbW92ZUNoaWxkcmVuOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc2V0KCRxdW90ZSwgeyBvcGFjaXR5OiAxIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhjaGlsZCwgMC41LCB7IG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBlYXNlOiAncG93ZXIzJyB9LCAnKz0nICsgZGVsYXkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb20oc3BsaXRRdW90ZS53b3JkcywgMC41LCB7IG9wYWNpdHk6IDAsIHg6IDgsIHRyYW5zZm9ybU9yaWdpbjogJzAlIDEwMCUnLCBlYXNlOiAncG93ZXIzJywgc3RhZ2dlcjogMC4wNSB9LCAwLjEpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkYXV0aG9yLCAwLjcsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sIHsgb3BhY2l0eTogMSwgeDogMCB9LCAnLT0nICsgMC4zKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oJGxpbmUsIHsgZHVyYXRpb246IDAuNywgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxIH0sICctPTAuMycpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0eHQgPSAkZWw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdHR4dCA9IG5ldyBTcGxpdFRleHQodHh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0dHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaXRlbXNGYWRlJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzJykgKyAnJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZ2VyRWwgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KGVsZW1lbnRzLCB7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMTB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IDAuMn0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndmlkZW8tdGV4dCc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCB2aWQgPSAkZWwuZmluZCgnLmpzLWNvbC02NicpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaW5mID0gJGVsLmZpbmQoJy5qcy1jb2wtMzMnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFt2aWQsIGluZl0sIHsgb3BhY2l0eTogMCB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC50byh2aWQsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiAwLjJ9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGluZiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTIwfSwgeyBvcGFjaXR5OiAxLCB4OiAwLCBkZWxheTogMC40fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdoZWFkaW5nJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhUaXRsZSA9ICRlbC5maW5kKCcuanMtdGl0bGUnKSxcclxuICAgICAgICAgICAgICAgICAgICBociA9ICRlbC5maW5kKCcuanMtaGVhZGluZy1ocicpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFRpdGxlID0gbmV3IFNwbGl0VGV4dChoVGl0bGUsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdFRpdGxlLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhociwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxLCBkZWxheTogMC41IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndGl0bGVGYWRlSW4nOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZCA9ICRlbC5maW5kKCcuanMtZml4ZWQtdGl0bGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICRlbC5maW5kKCcuanMtc3ViJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICBhcnIgPSAkZWwuZmluZCgnLmpzLWFycicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShsZWFkLCB7IGR1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHNjYWxlOiAxLjIsIGRlbGF5OiAyfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oc3ViLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAzMCwgZGVsYXk6IDMuMn0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGFyciwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjd9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ludHJvJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnRhaW4gPSAkZWwuZmluZCgnLmpzLWN1cnRhaW4nKTtcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGN1cnRhaW4sIHsgZHVyYXRpb246IDMsIG9wYWNpdHk6IDAsIGRlbGF5OiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1hbmltYXRlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIFxyXG4gICAgICAgICAgICBjYXNlICdoZWFkZXInOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBodGltZSA9ICRlbC5maW5kKCcuanMtdGltZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvY2lhbEQgPSAkZWwuZmluZCgnLnBob25lLWhpZGUgLnNvY2lhbF9faXRlbScpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlVGV4dCA9ICRlbC5maW5kKCcucGhvbmUtaGlkZSAuc29jaWFsX190aXRsZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIGhIciA9ICRlbC5maW5kKCcuanMtaGVhZGVyLWhyJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oW2h0aW1lLCBzaGFyZVRleHQsIHNvY2lhbERdLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMTB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMX0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaEhyLCB7IHNjYWxlWDogMH0sIHsgc2NhbGVYOiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7dHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBwYXJhbGxheChpdGVtOiBJUGFyYWxsYXhDYWNoZUl0ZW0sIHNUOiBudW1iZXIsIHdpbmRvd0hlaWdodDogbnVtYmVyLCBoZWFkZXJIZWlnaHQ6IG51bWJlcik6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoaXRlbS5zaGlmdCkge1xyXG5cclxuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcclxuICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IGl0ZW0ueTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudDogbnVtYmVyID0gKHkgLSBzVCArIGl0ZW0uaGVpZ2h0IC0gaGVhZGVySGVpZ2h0KSAvICh3aW5kb3dIZWlnaHQgKyBpdGVtLmhlaWdodCAtIGhlYWRlckhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChwZXJjZW50ICogaXRlbS5zaGlmdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgdGltZTogbnVtYmVyID0gIWl0ZW0uZG9uZSA/IDAgOiAwLjU7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwge1xyXG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgICAgICAgICAgICAgcm91bmRQcm9wczogWyd5J10sXHJcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIGlmIChpdGVtLnR5cGUpIHtcclxuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcclxuICAgICAgICAgICAgY29uc3QgJGVsU3RpY2t5OiBKUXVlcnkgPSAkZWwucGFyZW50KCkucGFyZW50KCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHk6IG51bWJlciA9IGl0ZW0ueTtcclxuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgY29uc3QgcHlUb3A6IG51bWJlciA9IHNUIC0gaXRlbS5oZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wU3RpY2t5OiBudW1iZXIgPSBzVCAtICRlbFN0aWNreS5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVybyc6XHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kZWwsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTogIWJyb3dzZXIubW9iaWxlID8gc1QgKiAwLjUgOiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZpeGVkSW1hZ2UnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHksIFwieVwiLCBzVCwgcHlCb3R0b20sIHdpbmRvd0hlaWdodCx3aW5kb3dIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IHB5VG9wICYmIHkgPD0gcHlCb3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGVsLmhhc0NsYXNzKCdoYXMtcGFyYWxsYXgnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdoYXMtcGFyYWxsYXgnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdoYXMtcGFyYWxsYXgnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2Nzcy1hbmltYXRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5oYXNDbGFzcygnYW5pbWF0aW9uLXBsYXknKSA/IG51bGwgOiBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdyZWxhdGl2ZVBhcmFsbGF4JzpcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGVTcGFjZSA9IGl0ZW0uY2hpbGRIZWlnaHQgLSBpdGVtLmhlaWdodDsgLy8gcmVzZXJ2ZSBzcGFjZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heFNoaWZ0ID0gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsIGl0ZW0uaGVpZ2h0ICsgaGVhZGVySGVpZ2h0KTsgLy8gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsICh3aW5kb3dIZWlnaHQgLSBkYXRhLmhlaWdodCkgKiAwLjUgKTsgLy8gZG8gbm90IG1vdmUgdG9vIG11Y2ggb24gYmlnIHNjcmVlbnNcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gKHNUIC0gaXRlbS55ICsgd2luZG93SGVpZ2h0KSAvICh3aW5kb3dIZWlnaHQgKyBpdGVtLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3NZOiBzdHJpbmcgfCBudW1iZXIgPSBNYXRoLnJvdW5kKCgxIC0gcGVyY2VudCkgKiBtYXhTaGlmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPCAwID8gMCA6IHBvc1k7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPiBtYXhTaGlmdCA/IG1heFNoaWZ0IDogcG9zWTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kY2hpbGQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTogLXBvc1ksXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7aXRlbS50eXBlfVwiIGRvZXMgbm90IGV4aXN0YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFyZSB7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG5cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtc2hhcmVdJykub24oJ2NsaWNrJywgKGUpOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHdpbldpZHRoID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2lud2lkdGgnKSwgMTApIHx8IDUyMDtcclxuICAgICAgICAgICAgbGV0IHdpbkhlaWdodCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbmhlaWdodCcpLCAxMCkgfHwgMzUwO1xyXG4gICAgICAgICAgICBsZXQgd2luVG9wID0gKHNjcmVlbi5oZWlnaHQgLyAyKSAtICh3aW5IZWlnaHQgLyAyKTtcclxuICAgICAgICAgICAgbGV0IHdpbkxlZnQgPSAoc2NyZWVuLndpZHRoIC8gMikgLSAod2luV2lkdGggLyAyKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSA8YW55PmUuY3VycmVudFRhcmdldDtcclxuICAgICAgICAgICAgY29uc3QgaHJlZiA9IGN1cnJlbnRUYXJnZXQuaHJlZjtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdzaGFyZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEgPT09ICdsaW5rZWRpbicpIHtcclxuICAgICAgICAgICAgICAgIHdpbldpZHRoID0gNDIwO1xyXG4gICAgICAgICAgICAgICAgd2luSGVpZ2h0ID0gNDMwO1xyXG4gICAgICAgICAgICAgICAgd2luVG9wID0gd2luVG9wIC0gMTAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihocmVmLCAnc2hhcmVyJyArIGRhdGEsICd0b3A9JyArIHdpblRvcCArICcsbGVmdD0nICsgd2luTGVmdCArICcsdG9vbGJhcj0wLHN0YXR1cz0wLHdpZHRoPScgKyB3aW5XaWR0aCArICcsaGVpZ2h0PScgKyB3aW5IZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3JlZmVyZW5jZXMuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBQdXNoU3RhdGVzLCBQdXNoU3RhdGVzRXZlbnRzIH0gZnJvbSAnLi9QdXNoU3RhdGVzJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XHJcbmltcG9ydCB7IFBhZ2UsIFBhZ2VFdmVudHMgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5pbXBvcnQgeyBDb21wb25lbnRFdmVudHMsIENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBCcm93c2VyLCBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcclxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXInO1xyXG5pbXBvcnQgeyBwYWdlcywgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XHJcbmltcG9ydCB7IENvcHkgfSBmcm9tICcuL0NvcHknO1xyXG5pbXBvcnQgeyBTaGFyZSB9IGZyb20gJy4vU2hhcmUnO1xyXG5pbXBvcnQgeyBBUEkgfSBmcm9tICcuL0FwaSc7XHJcblxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuXHJcbmV4cG9ydCBsZXQgc2l0ZTogU2l0ZTtcclxuZXhwb3J0IGxldCAkZG9jOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJHdpbmRvdzogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRib2R5OiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJGFydGljbGU6IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkbWFpbjogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRwYWdlSGVhZGVyOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgcGl4ZWxSYXRpbzogbnVtYmVyO1xyXG5leHBvcnQgbGV0IGRlYnVnOiBib29sZWFuO1xyXG5leHBvcnQgbGV0IGVhc2luZzogc3RyaW5nO1xyXG5leHBvcnQgbGV0IGxhbmc6IHN0cmluZztcclxuZXhwb3J0IGxldCBmaXhlZHBvc2l0aW9uOiBudW1iZXI7XHJcblxyXG4vLyBkZWNsYXJlIGxldCBDdXN0b21FYXNlO1xyXG5cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNpdGUge1xyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTaXRlO1xyXG5cclxuICAgIHByaXZhdGUgY3VycmVudFBhZ2U6IFBhZ2U7XHJcbiAgICBwcml2YXRlIHB1c2hTdGF0ZXM6IFB1c2hTdGF0ZXM7XHJcbiAgICBwcml2YXRlIHNjcm9sbDogU2Nyb2xsO1xyXG4gICAgcHJpdmF0ZSBsYXN0QnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XHJcbiAgICBwcml2YXRlIGxvYWRlcjogTG9hZGVyO1xyXG4gICAgLy8gcHJpdmF0ZSBpc1JlYWR5OiBib29sZWFuO1xyXG4gICAgLy8gcHJpdmF0ZSBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XHJcbiAgICAvLyBwcml2YXRlICRoYW1idXJnZXI6IEpRdWVyeTtcclxuICAgIC8vIHByaXZhdGUgJHBhZ2VIZWFkZXI6IEpRdWVyeTtcclxuICAgIC8vIHByaXZhdGUgJGFydGljbGU6IEpRdWVyeTtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnc2l0ZScpO1xyXG5cclxuICAgICAgICBTaXRlLmluc3RhbmNlID0gdGhpcztcclxuICAgICAgICAvLyBsYW5nID0gJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKTtcclxuXHJcbiAgICAgICAgcGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XHJcbiAgICAgICAgZGVidWcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLmluZGV4T2YoJ2RlYnVnJykgPj0gMDtcclxuICAgICAgICAvLyBlYXNpbmcgPSBDdXN0b21FYXNlLmNyZWF0ZSgnY3VzdG9tJywgJ00wLDAsQzAuNSwwLDAuMywxLDEsMScpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGluaXQoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XHJcbiAgICAgICAgQnJvd3Nlci51cGRhdGUoKTtcclxuXHJcbiAgICAgICAgJGRvYyA9ICQoZG9jdW1lbnQpO1xyXG4gICAgICAgICR3aW5kb3cgPSAkKHdpbmRvdyk7XHJcbiAgICAgICAgJGJvZHkgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XHJcbiAgICAgICAgJG1haW4gPSAkKCcjbWFpbicpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzID0gbmV3IFB1c2hTdGF0ZXMoKTtcclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UsIHRoaXMub25TdGF0ZSk7XHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIHRoaXMub25Mb2FkUHJvZ3Jlc3MpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLiRoYW1idXJnZXIgPSAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XHJcbiAgICAgICAgLy8gdGhpcy4kYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLW1haW4nKTtcclxuICAgICAgICAvLyB0aGlzLiRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5zY3JvbGwgPSBuZXcgU2Nyb2xsKCk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIgPSBuZXcgTG9hZGVyKCQoJy5qcy1sb2FkZXInKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUpO1xyXG5cclxuXHJcbiAgICAgICAgbmV3IENvcHkoKTtcclxuICAgICAgICBuZXcgU2hhcmUoKTtcclxuICAgICAgICBuZXcgQVBJKCk7XHJcbiAgICAgICAgQVBJLmJpbmQoKTtcclxuICAgICAgICAvLyB0aGlzLm1lbnUgPSBuZXcgTWVudSgkKCcuanMtbWVudScpKTtcclxuICAgICAgICAvLyB0aGlzLmNvb2tpZXMgPSBuZXcgQ29va2llcygkKCcuanMtY29va2llcycpKTtcclxuXHJcblxyXG4gICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KFtcclxuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50UGFnZSgpLFxyXG4gICAgICAgICAgICAvLyB0aGlzLnByZWxvYWRBc3NldHMoKSxcclxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKSxcclxuICAgICAgICBdKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcclxuXHJcblxyXG4gICAgICAgIGlmIChkZWJ1ZykgeyBVdGlscy5zdGF0cygpOyB9XHJcblxyXG4gICAgICAgICR3aW5kb3cub24oJ29yaWVudGF0aW9uY2hhbmdlJywgKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XHJcblxyXG4gICAgICAgIH0sIDEwMCkpO1xyXG4gICAgICAgICR3aW5kb3cub24oJ3Jlc2l6ZScsICgpID0+IHRoaXMub25SZXNpemUoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uUmVzaXplKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xyXG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3AgJiYgIWJyb3dzZXIubW9iaWxlKSB7XHJcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3aWR0aCA9ICR3aW5kb3cud2lkdGgoKTtcclxuICAgICAgICBjb25zdCBoZWlnaHQgPSAkd2luZG93LmhlaWdodCgpO1xyXG5cclxuICAgICAgICBjb25zdCBjaGFuZ2VkID0gIXRoaXMubGFzdEJyZWFrcG9pbnQgfHwgdGhpcy5sYXN0QnJlYWtwb2ludC52YWx1ZSAhPT0gYnJlYWtwb2ludC52YWx1ZTtcclxuICAgICAgICB0aGlzLmxhc3RCcmVha3BvaW50ID0gYnJlYWtwb2ludDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5yZXNpemUod2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5yZXNpemUoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgcHJlbG9hZEFzc2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgICAgbGV0IGFzc2V0cyA9IFtdO1xyXG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCgnLnByZWxvYWQtYmcnLCB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChhc3NldHMgJiYgYXNzZXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQoYXNzZXRzW2ldLCBudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWwuanFEZWZlcnJlZC5hbHdheXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGNoZWNrIGlmIGFueSBjb21wb25lbnQgaGFuZGxlIG9uU3RhdGUgZXZlbnRcclxuICAgIC8vIGlmIG5vdCwgcmVsb2FkIGh0bWw6XHJcbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIC8vIGNvbnN0IHNjcm9sbGluZ0NoYW5nZWRTdGF0ZSA9IHRoaXMuc2Nyb2xsLm9uU3RhdGUoKTtcclxuICAgICAgICBjb25zdCBwYWdlQ2hhbmdlZFN0YXRlID0gdGhpcy5jdXJyZW50UGFnZS5vblN0YXRlKCk7XHJcblxyXG4gICAgICAgIC8vIGlmICghc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlICYmICFvZmZzY3JlZW5DaGFuZ2VkU3RhdGUgJiYgIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcclxuICAgICAgICBpZiAoIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcy5zZW5kUGFnZXZpZXcod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHB1c2hTdGF0ZXNMb2FkUHJvbWlzZSA9IHRoaXMucHVzaFN0YXRlcy5sb2FkKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGVPdXRQcm9taXNlID0gdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlT3V0KCk7XHJcblxyXG4gICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbC5zdG9wKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBhbGwgcHJvbWlzZXMgYXJyYXk6XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYWRpbmdQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBbXHJcbiAgICAgICAgICAgICAgICBwdXNoU3RhdGVzTG9hZFByb21pc2UsXHJcbiAgICAgICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZSxcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlbmRlciBodG1sIHdoZW4gZXZlcnl0aGluZydzIHJlYWR5OlxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihsb2FkaW5nUHJvbWlzZXMpLnRoZW4odGhpcy5yZW5kZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGRpc3BsYXkgYWpheCBwcm9ncmVzczpcclxuICAgIHByaXZhdGUgb25Mb2FkUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKiBwcm9ncmVzcyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBwYXNzIGxvYWRpbmcgcHJvZ3Jlc3MgZnJvbSBwYWdlIHRvIHByZWxvYWRlcjpcclxuICAgIHByaXZhdGUgb25QYWdlUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKyAwLjUgKiBwcm9ncmVzcyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBkZWFsIHdpdGggbmV3bHkgYWRkZWQgZWxlbWVudHNcclxuICAgIHByaXZhdGUgb25QYWdlQXBwZW5kID0gKGVsOiBKUXVlcnkpOiB2b2lkID0+IHtcclxuICAgICAgICBQdXNoU3RhdGVzLmJpbmQoZWxbMF0pO1xyXG4gICAgICAgIC8vIFdpZGdldHMuYmluZChlbFswXSk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gY2FsbGVkIGFmdGVyIG5ldyBodG1sIGlzIGxvYWRlZFxyXG4gICAgLy8gYW5kIG9sZCBjb250ZW50IGlzIGFuaW1hdGVkIG91dDpcclxuICAgIHByaXZhdGUgcmVuZGVyID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLm9mZigpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNjcm9sbC5kZXN0cm95KCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcclxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5yZW5kZXIoKTtcclxuICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSgkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JykpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEhvbWVQYWdlKCk6IHZvaWQge1xyXG4gICAgICAgICRwYWdlSGVhZGVyID8gJGJvZHkuYWRkQ2xhc3MoJ2lzLWhvbWUtcGFnZScpIDogbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gd2hlbiBjdXJyZW50IHBhZ2UgaXMgbG9hZGVkOlxyXG4gICAgcHJpdmF0ZSBvblBhZ2VMb2FkZWQgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgLy8gJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLW5vdC1yZWFkeScpO1xyXG4gICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuaGlkZSgpO1xyXG4gICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkYm9keSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlSW4oKTtcclxuICAgICAgICAkcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RIb21lUGFnZSgpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xyXG4gICAgICAgIC8vIHRoaXMuY29va2llcy50cnlUb1Nob3coKTtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9QYXRoKHRydWUpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsLmxvYWQoKTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5zdGFydCgpO1xyXG4gICAgICAgICQoJ2FydGljbGUnKS5wYXJlbnQoKS5hZGRDbGFzcygnaXMtbG9hZGVkJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBydW4gbmV3IFBhZ2Ugb2JqZWN0XHJcbiAgICAvLyAoZm91bmQgYnkgYGRhdGEtcGFnZWAgYXR0cmlidXRlKVxyXG4gICAgLy8gYmluZCBpdCBhbmQgc3RvcmUgYXMgY3VycmVudFBhZ2U6XHJcbiAgICBwcml2YXRlIHNldEN1cnJlbnRQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGxldCAkcGFnZUVsOiBKUXVlcnkgPSAkKCdbZGF0YS1wYWdlXScpLFxyXG4gICAgICAgICAgICBwYWdlTmFtZTogc3RyaW5nID0gJHBhZ2VFbC5kYXRhKCdwYWdlJykgfHwgJ1BhZ2UnLFxyXG4gICAgICAgICAgICBwYWdlT3B0aW9uczogT2JqZWN0ID0gJHBhZ2VFbC5kYXRhKCdvcHRpb25zJyk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCRwYWdlRWwsIHBhZ2VOYW1lKTtcclxuXHJcbiAgICAgICAgLy8gcGFnZSBub3QgZm91bmQ6XHJcbiAgICAgICAgaWYgKHBhZ2VOYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBcIiVzXCIgaW4gUGFnZXMhJywgcGFnZU5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBhZ2VOYW1lID0gJ1BhZ2UnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbW9yZSB0aGFuIG9uZSBkYXRhLXBhZ2U6XHJcbiAgICAgICAgaWYgKCRwYWdlRWwubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ09ubHkgb25lIFtkYXRhLXBhZ2VdIGVsZW1lbnQsIHBsZWFzZSEnKTtcclxuXHJcbiAgICAgICAgLy8gcGFnZSBub3QgZGVmaW5lZCBpbiBodG1sOlxyXG4gICAgICAgIH0gZWxzZSBpZiAoJHBhZ2VFbC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgJHBhZ2VFbCA9ICQoJCgnI21haW4nKS5maW5kKCdhcnRpY2xlJylbMF0gfHwgJCgnI21haW4nKS5jaGlsZHJlbigpLmZpcnN0KClbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgUGFnZSBvYmplY3Q6XHJcbiAgICAgICAgbGV0IHBhZ2U6IFBhZ2UgPSBuZXcgcGFnZXNbcGFnZU5hbWVdKCRwYWdlRWwsIHBhZ2VPcHRpb25zKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gcGFnZTtcclxuXHJcbiAgICAgICAgLy8gYmluZCBldmVudHM6XHJcbiAgICAgICAgQVBJLmJpbmQoKTtcclxuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHRoaXMub25QYWdlUHJvZ3Jlc3MpO1xyXG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5DSEFOR0UsIHRoaXMub25QYWdlQXBwZW5kKTtcclxuXHJcbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gcGFnZS5wcmVsb2FkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XHJcbiAgICBzaXRlID0gbmV3IFNpdGUoKTtcclxuICAgIHNpdGUuaW5pdCgpO1xyXG59KTtcclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL3N0YXRzLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVVSUQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiAnJyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgKyBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IGtleXMgPSB7XHJcbiAgICBlbnRlcjogMTMsXHJcbiAgICBlc2M6IDI3LFxyXG4gICAgc3BhY2U6IDMyLFxyXG4gICAgbGVmdDogMzcsXHJcbiAgICB1cDogMzgsXHJcbiAgICByaWdodDogMzksXHJcbiAgICBkb3duOiA0MCxcclxuICAgIHBhZ2VVcDogMzMsXHJcbiAgICBwYWdlRG93bjogMzQsXHJcbiAgICBlbmQ6IDM1LFxyXG4gICAgaG9tZTogMzYsXHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtcyh1cmwpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSB7XHJcbiAgICB2YXIgcGFyYW1zID0ge307XHJcbiAgICB2YXIgcGFyc2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgcGFyc2VyLmhyZWYgPSB1cmw7XHJcbiAgICB2YXIgcXVlcnkgPSBwYXJzZXIuc2VhcmNoLnN1YnN0cmluZygxKTtcclxuICAgIHZhciB2YXJzID0gcXVlcnkuc3BsaXQoJyYnKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYWlyID0gdmFyc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgIHBhcmFtc1twYWlyWzBdXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXJhbXM7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RBdXRvcGxheSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNb2Rlcm5penIub24oJ3ZpZGVvYXV0b3BsYXknLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb1RpbWUoc2VjOiBudW1iZXIpOiBzdHJpbmcge1xyXG5cclxuICAgIGNvbnN0IHRvdGFsU2VjID0gcGFyc2VJbnQoJycgKyBzZWMsIDEwKTtcclxuICAgIGNvbnN0IGhvdXJzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDM2MDAsIDEwKSAlIDI0O1xyXG4gICAgY29uc3QgbWludXRlcyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyA2MCwgMTApICUgNjA7XHJcbiAgICBjb25zdCBzZWNvbmRzID0gdG90YWxTZWMgJSA2MDtcclxuICAgIGNvbnN0IGhyc0Rpc3BsYXkgPSAoaG91cnMgPCAxMCA/ICcwJyArIGhvdXJzIDogaG91cnMpICsgJzonO1xyXG5cclxuICAgIHJldHVybiAoaG91cnMgPiAwID8gaHJzRGlzcGxheSA6ICcnKSArIChtaW51dGVzIDwgMTAgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcykgKyAnOicgKyAoc2Vjb25kcyA8IDEwID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdGF0cygpOiBTdGF0cyB7XHJcblxyXG4gICAgY29uc3Qgc3RhdHMgPSBuZXcgU3RhdHMoKTtcclxuXHJcbiAgICBzdGF0cy5zaG93UGFuZWwoIDAgKTsgLy8gMDogZnBzLCAxOiBtcywgMjogbWIsIDMrOiBjdXN0b21cclxuICAgICQoc3RhdHMuZG9tKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6ICdub25lJywgJ3RvcCc6IDExMH0pO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggc3RhdHMuZG9tICk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBzdGF0cy5iZWdpbigpO1xyXG4gICAgICAgIC8vIG1vbml0b3JlZCBjb2RlIGdvZXMgaGVyZVxyXG4gICAgICAgIHN0YXRzLmVuZCgpO1xyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xyXG5cclxuICAgIHJldHVybiBzdGF0cztcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZUZvcm1hdCh0aW1lOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCkudG9TdHJpbmcoKTtcclxuICAgIG1pbnV0ZXMgPSAocGFyc2VJbnQobWludXRlcywgMTApID49IDEwKSA/IG1pbnV0ZXMgOiAnMCcgKyBtaW51dGVzO1xyXG4gICAgbGV0IHNlY29uZHMgPSBNYXRoLmZsb29yKHRpbWUgJSA2MCkudG9TdHJpbmcoKTtcclxuICAgIHNlY29uZHMgPSAocGFyc2VJbnQoc2Vjb25kcywgMTApID49IDEwKSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xyXG5cclxuICAgIHJldHVybiBtaW51dGVzLnRvU3RyaW5nKCkgKyAnOicgKyBzZWNvbmRzLnRvU3RyaW5nKCk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUltYWdlU291cmNlcygpOiB2b2lkIHtcclxuICAgIGlmIChicm93c2VyLmllKSB7XHJcbiAgICAgICAgJCgnW2RhdGEtaWVzcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKSk7XHJcbiAgICAgICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAkKCdbZGF0YS1zcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKSk7XHJcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoJ1tkYXRhLXNyY3NldF0nKS5lYWNoKChpLCBpbWcpOiB2b2lkID0+IHtcclxuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpKTtcclxuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWRJbWFnZXMoaW1hZ2VzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZFtdPiB7XHJcbi8vICAgICByZXR1cm4gUHJvbWlzZS5hbGwoaW1hZ2VzLm1hcCgoaW1hZ2UpOiBQcm9taXNlPHZvaWQ+ID0+IHtcclxuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4vLyAgICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuLy8gICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmFib3J0ID0gKCkgPT4gcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICBpbWcuc3JjID0gaW1hZ2U7XHJcbi8vICAgICAgICAgICAgIGlmIChpbWcuY29tcGxldGUgJiYgJChpbWcpLmhlaWdodCgpID4gMCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgfSkpO1xyXG4vLyB9XHJcblxyXG5cclxuXHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlczogSlF1ZXJ5KTogUHJvbWlzZTx2b2lkW10+IHtcclxuLy8gICAgIGxldCBpc0Jhc2U2NDogYm9vbGVhbjtcclxuLy8gICAgIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSAkaW1hZ2VzLnRvQXJyYXkoKVxyXG4vLyAgICAgICAgIC5tYXAoKGltZzogSFRNTEltYWdlRWxlbWVudCk6IHN0cmluZyA9PiB7XHJcbi8vICAgICAgICAgICAgIGxldCBpbWFnZVNvdXJjZSA9IGltZy5jdXJyZW50U3JjIHx8IGltZy5zcmM7XHJcbi8vICAgICAgICAgICAgIGlmIChpbWFnZVNvdXJjZS5pbmRleE9mKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsJykgPj0gMCkgeyBpc0Jhc2U2NCA9IHRydWU7IH1cclxuLy8gICAgICAgICAgICAgcmV0dXJuIGltYWdlU291cmNlO1xyXG4vLyAgICAgICAgIH0pO1xyXG5cclxuLy8gICAgIC8vIGNvbnNvbGUubG9nKGltYWdlcyk7XHJcblxyXG4vLyAgICAgaWYgKCFpc0Jhc2U2NCkge1xyXG4vLyAgICAgICAgIHJldHVybiBwcmVsb2FkSW1hZ2VzKGltYWdlcyk7XHJcbi8vICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuLy8gICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbi8vICAgICAgICAgICAgICAgICBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlcykudGhlbigoKSA9PiB7XHJcbi8vICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICAgICAgfSk7XHJcbi8vICAgICAgICAgICAgIH0sIDIwMCk7XHJcbi8vICAgICAgICAgfSk7XHJcbi8vICAgICB9XHJcbi8vIH1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZShhKTogQXJyYXk8YW55PiB7XHJcbiAgICBsZXQgaiwgeCwgaTtcclxuICAgIGZvciAoaSA9IGEubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcclxuICAgICAgICB4ID0gYVtpXTtcclxuICAgICAgICBhW2ldID0gYVtqXTtcclxuICAgICAgICBhW2pdID0geDtcclxuICAgIH1cclxuICAgIHJldHVybiBhO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJvb3RWYXJzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gYnJlYWtwb2ludC5kZXNrdG9wID8gJCgnI25hdmJhcicpLmhlaWdodCgpIDogMDtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcHAtaGVpZ2h0JywgYCR7d2luZG93LmlubmVySGVpZ2h0IC0gaGVhZGVySGVpZ2h0fXB4YCk7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sLTI1JywgYCR7JCgnLmNvbC1wYXR0ZXJuLTI1Jykud2lkdGgoKX1weGApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC02NicsIGAkeyQoJy5jb2wtNjYnKS53aWR0aCgpfXB4YCk7XHJcbiAgICBsZXQgbWFyZyA9ICFicmVha3BvaW50LmRlc2t0b3AgPyA1MCA6IDEyMDtcclxuICAgICQoJy5hc2lkZScpLmNzcygnaGVpZ2h0JywgJHdpbmRvdy5oZWlnaHQoKSArIG1hcmcpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlQm9keVNjcm9sbGluZyhzVDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAkKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnc2Nyb2xsaW5nLWRpc2FibGUnKTtcclxuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzVCk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xyXG4gICAgbGV0IHBvc2l0aW9uID0gYnJvd3Nlci5pZSA/ICdhYnNvbHV0ZScgOiAnZml4ZWQnO1xyXG4gICAgbGV0IHRvcCA9IGJyb3dzZXIuaWUgPyAnJyA6IC1zVCArICdweCc7XHJcbiAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XHJcbiAgICAkKCdib2R5JykuY3NzKHtcclxuICAgICAgICAvLyAncG9zaXRpb24nOiBwb3NpdGlvbixcclxuICAgICAgICAvLyAndG9wJzogdG9wLFxyXG4gICAgICAgIC8vICdib3R0b20nOiAnMCcsXHJcbiAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RvcCcsXHJcbiAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICd0b3VjaC1hY3Rpb24nOiAnbm9uZScsXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zID0ge1xyXG4gICAgJ2ludmFsaWQtZW1haWwnOiB7XHJcbiAgICAgICAgJ2VuJzogJ0ludmFsaWQgZW1haWwgYWRkcmVzcyBmb3JtYXQnLFxyXG4gICAgICAgICdwbCc6ICdOaWVwb3ByYXdueSBmb3JtYXQgYWRyZXN1IGUtbWFpbCcsXHJcbiAgICB9LFxyXG4gICAgJ3JlcXVpcmVkLWZpZWxkJzoge1xyXG4gICAgICAgICdlbic6ICdSZXF1aXJlZCBmaWVsZCcsXHJcbiAgICAgICAgJ3BsJzogJ1BvbGUgb2Jvd2nEhXprb3dlJyxcclxuICAgIH0sXHJcbiAgICAnaW52YWxpZC16aXAnOiB7XHJcbiAgICAgICAgJ2VuJzogJ0VudGVyIHppcC1jb2RlIGluIGZpdmUgZGlnaXRzIGZvcm1hdCcsXHJcbiAgICAgICAgJ3BsJzogJ1dwaXN6IGtvZCBwb2N6dG93eSB3IGZvcm1hY2llIFhYLVhYWCcsXHJcbiAgICB9LFxyXG59O1xyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcclxuXHJcbmludGVyZmFjZSBJQ2hhcnRTZXR0aW5ncyB7XHJcbiAgICBpZDogbnVtYmVyO1xyXG4gICAgeFBlcmNlbnQ6IG51bWJlcjtcclxuICAgIHlQb2ludHM6IEFycmF5PG51bWJlcj47XHJcbiAgICBjb2xvcjogc3RyaW5nO1xyXG4gICAgeVB4OiBBcnJheTxudW1iZXI+O1xyXG4gICAgZmlsbD86IGJvb2xlYW47XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDaGFydCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSAkdGFiOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICR3cmFwcGVyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XHJcbiAgICAgICAgdG9wOiA1LFxyXG4gICAgICAgIGxlZnQ6IDI1LFxyXG4gICAgICAgIHJpZ2h0OiA1MCxcclxuICAgICAgICBib3R0b206IDQ5XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ3JhcGg6IGFueSA9IHtcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgbGVmdDogMCxcclxuICAgICAgICByaWdodDogMCxcclxuICAgICAgICBib3R0b206IDAsXHJcbiAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgIHdpZHRoOiAwLFxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGNvbG9yczogYW55ID0ge1xyXG4gICAgICAgIGdyYXk6ICdyZ2JhKDk3LDk3LDk3LDAuNSknLFxyXG4gICAgICAgIG9yYW5nZTogJyNmYzhjNTknLFxyXG4gICAgICAgIG1pbnQ6ICcjNGZkYmM1JyxcclxuICAgICAgICBibHVlOiAnIzU4NzdjYycsXHJcbiAgICAgICAgcGluazogJyNCNjBFNjMnLFxyXG4gICAgICAgIHdoaXRlOiAnI2ZmZicsXHJcbiAgICAgICAgYmVpZ2U6ICcjZmRkNDllJyxcclxuICAgICAgICBjaW5uYWJhcjogJyNlNzUwNDAnLFxyXG4gICAgICAgIHNlYTogJyMyNmJiZTMnLFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ3JhcGhzRGF0YTogQXJyYXk8SUNoYXJ0U2V0dGluZ3M+ID0gW107XHJcbiAgICBwcml2YXRlIGRhdGFJbml0OiBib29sZWFuO1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXdyYXBwZXInKTtcclxuICAgICAgICB0aGlzLiR0YWIgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY2hhcnQtdGFiXScpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PnRoaXMudmlldy5maW5kKCdjYW52YXMnKVswXTtcclxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG5cclxuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJhbXNDaGFydHMgPSBVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkuY2hhcnRzO1xyXG4gICAgICAgIGNvbnN0IGluaXRDaGFydHMgPSBwYXJhbXNDaGFydHMgPyBwYXJhbXNDaGFydHMuc3BsaXQoJywnKS5tYXAoKGkpID0+IHBhcnNlSW50KGksIDEwKSkgOiBbMCwgMywgNF07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4kdGFiLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoaSwgaW5pdENoYXJ0cy5pbmRleE9mKGkpID49IDApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLiR3cmFwcGVyLndpZHRoKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy4kd3JhcHBlci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmFwaCA9IHtcclxuICAgICAgICAgICAgdG9wOiB0aGlzLm1hcmdpbi50b3AsXHJcbiAgICAgICAgICAgIGxlZnQ6IHRoaXMubWFyZ2luLmxlZnQsXHJcbiAgICAgICAgICAgIHJpZ2h0OiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0ICsgdGhpcy5tYXJnaW4ubGVmdCxcclxuICAgICAgICAgICAgYm90dG9tOiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20sXHJcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4udG9wIC0gdGhpcy5tYXJnaW4uYm90dG9tLFxyXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5sZWZ0IC0gdGhpcy5tYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3KCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFJbml0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlRGF0YU9iamVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZURhdGFPYmplY3QoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGFiLmVhY2goIChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJQ2hhcnRTZXR0aW5ncz57XHJcbiAgICAgICAgICAgICAgICBpZDogaSxcclxuICAgICAgICAgICAgICAgIHhQZXJjZW50OiAwLFxyXG4gICAgICAgICAgICAgICAgeVBvaW50czogJChlbCkuZGF0YSgncG9pbnRzJyksXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5zZXRDb2xvcigkKGVsKS5kYXRhKCdjb2xvcicpKSxcclxuICAgICAgICAgICAgICAgIHlQeDogdGhpcy5jYWxjWVB4KCQoZWwpLmRhdGEoJ3BvaW50cycpKSxcclxuICAgICAgICAgICAgICAgIGZpbGw6IGkgPT09IDAgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdyYXBoc0RhdGEucHVzaChkYXRhSXRlbSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YUluaXQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vbkNsaWNrVGFiKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja1RhYiA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVDaGFydCgkKGUuY3VycmVudFRhcmdldCkuaW5kZXgoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZUNoYXJ0KGluZGV4OiBudW1iZXIsIHNob3c/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBzaG93ID09PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICBzaG93ID0gIXRoaXMuZ3JhcGhzRGF0YVtpbmRleF0uc2hvd247XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnc2FwLnRvKHRoaXMuZ3JhcGhzRGF0YVtpbmRleF0sIHtcclxuICAgICAgICAgICAgZHVyYXRpb246IDIsXHJcbiAgICAgICAgICAgIHhQZXJjZW50OiBzaG93ID8gMSA6IDAsXHJcbiAgICAgICAgICAgIGVhc2U6ICdzaW5lLmluT3V0JyxcclxuICAgICAgICAgICAgb25VcGRhdGU6IHRoaXMuZHJhdyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdGFiLmVxKGluZGV4KS50b2dnbGVDbGFzcygnaXMtb24tY2hhcnQnLCBzaG93KTtcclxuICAgICAgICB0aGlzLmdyYXBoc0RhdGFbaW5kZXhdLnNob3duID0gc2hvdztcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZHJhdyA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XHJcbiAgICAgICAgdGhpcy5kcmF3QmcoKTtcclxuICAgICAgICB0aGlzLmdyYXBoc0RhdGEuZm9yRWFjaCgoZ3JhcGhEYXRhKSA9PiB0aGlzLmRyYXdHcmFwaChncmFwaERhdGEpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZHJhd0JnKCk6IHZvaWQge1xyXG5cclxuICAgICAgICAvLyBkcmF3IFggYXhpc1xyXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcblxyXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XHJcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMuZ3JheTtcclxuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5tYXJnaW4udG9wKTtcclxuICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgdGhpcy5tYXJnaW4udG9wKTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVscGVyc0xpbmUgPSA4O1xyXG4gICAgICAgIGNvbnN0IHRleHRUcmFuc2Zvcm0gPSA1O1xyXG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xyXG4gICAgICAgIGxldCB2YWw7XHJcbiAgICAgICAgY29uc3QgeWVhcnMgPSBbMjAxNSwgMjAxNiwgMjAxNywgMjAxOCwgMjAxOSwgMjAyMCwgMjAyMV07XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGhlbHBlcnNMaW5lOyBpKyspIHtcclxuICAgICAgICAgICAgdmFsID0gNTAgLSBzdGVwICogaTtcclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcclxuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy5ibHVlO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCgnJyArIHZhbCArICcnLCAwLCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wICsgdGV4dFRyYW5zZm9ybSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLm1hcmdpbi5sZWZ0LCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3ApO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHllYXJzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgeWVhcnNbal0gKyAnJywgKHRoaXMuY2FudmFzLndpZHRoICsgdGhpcy5tYXJnaW4ucmlnaHQgKyB0aGlzLm1hcmdpbi5sZWZ0KSAvIHllYXJzLmxlbmd0aCAqIGogKyB0aGlzLm1hcmdpbi5sZWZ0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0ZXh0VHJhbnNmb3JtICogMik7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZHJhd0dyYXBoID0gKGRhdGE6IElDaGFydFNldHRpbmdzKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDM7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG4gICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY29uc3QgY29sV2lkdGggPSB0aGlzLmdyYXBoLnJpZ2h0IC8gZGF0YS55UHgubGVuZ3RoO1xyXG4gICAgICAgIGNvbnN0IG1heFggPSBkYXRhLnhQZXJjZW50ICogKHRoaXMuZ3JhcGgucmlnaHQgLSB0aGlzLmdyYXBoLmxlZnQpICsgdGhpcy5ncmFwaC5sZWZ0O1xyXG4gICAgICAgIGRhdGEueVB4LmZvckVhY2goICh5LCBpLCBhKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHggPSBjb2xXaWR0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XHJcbiAgICAgICAgICAgIGlmICh4IDw9IG1heFggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh4IDwgbWF4WCArIGNvbFdpZHRoICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpLTFdXSwgW3gsIHldKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuZmlsbCkge1xyXG4gICAgICAgICAgICBsZXQgbGFzdFggPSB0aGlzLm1hcmdpbi5sZWZ0O1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGRhdGEuY29sb3I7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMC40O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGRhdGEueVB4LmZvckVhY2goICh5LCBpLCBhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gY29sV2lkdGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0O1xyXG4gICAgICAgICAgICAgICAgaWYgKHggPD0gbWF4WCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IHg7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IG1heFg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obGFzdFgsIHRoaXMuZ3JhcGguYm90dG9tKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgubGVmdCwgdGhpcy5ncmFwaC5ib3R0b20pO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vLyBIRUxQRVJTXHJcblxyXG4gICAgcHJpdmF0ZSBsYXJnZXN0WVZhbChkYXRhOiBBcnJheTxudW1iZXI+KTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3Q7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNhbGNZUHgoZGF0YSk6IEFycmF5PG51bWJlcj4ge1xyXG4gICAgICAgIGNvbnN0IGxhcmdlc3QgPSB0aGlzLmxhcmdlc3RZVmFsKGRhdGEpO1xyXG4gICAgICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gTWF0aC5yb3VuZCgodGhpcy5ncmFwaC5oZWlnaHQgLSBkYXRhW2ldIC8gbGFyZ2VzdCAqIHRoaXMuZ3JhcGguaGVpZ2h0KSArIHRoaXMuZ3JhcGgudG9wKTtcclxuICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzZXRDb2xvcihjb2xvcjogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICBsZXQgaGV4O1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5IGluIHRoaXMuY29sb3JzKSB7XHJcbiAgICAgICAgICAgIGlmIChjb2xvciA9PT0gcHJvcGVydHkpIHtcclxuICAgICAgICAgICAgICAgIGhleCA9IHRoaXMuY29sb3JzW3Byb3BlcnR5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGhleDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZ2V0SW50ZXJQb2ludHNZKHg6IG51bWJlciwgcG9pbnRBOiBudW1iZXJbXSwgcG9pbnRCOiBudW1iZXJbXSk6IG51bWJlciB7XHJcbiAgICAgICAgY29uc3QgW3gxLCB5MV0gPSBwb2ludEE7XHJcbiAgICAgICAgY29uc3QgW3gyLCB5Ml0gPSBwb2ludEI7XHJcbiAgICAgICAgcmV0dXJuICh5MiAtIHkxKSAqICh4IC0geDEpIC8gKHgyIC0geDEpICsgeTE7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEV2ZW50cyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENIQU5HRTogc3RyaW5nID0gJ2NoYW5nZSc7XHJcbn1cclxuXHJcbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBIYW5kbGVyIHtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/OiBPYmplY3QpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIGlmICghdmlld1swXSkgeyBjb25zb2xlLndhcm4oJ2NvbXBvbmVudCBidWlsdCB3aXRob3V0IHZpZXcnKTsgfVxyXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgdGhpcyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgcHJlbG9hZEltYWdlcygpOiBBcnJheTxzdHJpbmc+IHtcclxuICAgICAgICByZXR1cm4gW107XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgYW5pbWF0ZUluKGluZGV4PzogbnVtYmVyLCBkZWxheT86IG51bWJlcik6IHZvaWQgeyB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgICAgLy8gaWYgeW91IGRvbid0IHdhbnQgdG8gYW5pbWF0ZSBjb21wb25lbnQsXHJcbiAgICAgICAgLy8ganVzdCByZXR1cm4gZW1wdHkgUHJvbWlzZTpcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xyXG5cclxuICAgICAgICAvLyBpZiB5b3UgbmVlZCBhbmltYXRpb246XHJcbiAgICAgICAgLy8gcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAvLyAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcclxuICAgICAgICAvLyAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAvLyAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgLy8gICAgICAgICB9LFxyXG4gICAgICAgIC8vICAgICAgICAgZHVyYXRpb246IDAuMyxcclxuICAgICAgICAvLyAgICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgLy8gICAgIH0pO1xyXG4gICAgICAgIC8vIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHR1cm5PZmYoKTogdm9pZCB7IH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7IH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHsgfTtcclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgbnVsbCk7XHJcbiAgICAgICAgdGhpcy52aWV3Lm9mZigpO1xyXG4gICAgICAgIHN1cGVyLmRlc3Ryb3koKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIERhc2hib2FyZCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSAkdG9nZ2xlOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRib2R5OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzVG9nZ2xlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgYm9keUhlaWdodDogbnVtYmVyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiR0b2dnbGUgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWJ1dHRvbi10b2dnbGUnKTtcclxuICAgICAgICB0aGlzLiRib2R5ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1kYXNoYm9hcmQtYm9keScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLmluaXRpYWxTdGF0ZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcblxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdG9nZ2xlLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZVBhbmVsKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZVBhbmVsID0gKGUpID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNUb2dnbGVkKSB7XHJcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kYm9keSwgeyBkdXJhdGlvbjogMC41LCBoZWlnaHQ6ICdhdXRvJywgZWFzZTogJ3Bvd2VyMi5pbk91dCcsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJvZHkuYWRkQ2xhc3MoJ2lzLXRvZ2dsZWQnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNUb2dnbGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLXRvZ2dsZWQnKTtcclxuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJzAnLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGluaXRpYWxTdGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBnc2FwLnNldCh0aGlzLiRib2R5LCB7IGhlaWdodDogJzAnfSk7XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL0ZpbHRlcnMnO1xyXG5cclxuZXhwb3J0IGNsYXNzIERyb3Bkb3duIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBcclxuICAgIHByaXZhdGUgJHRyaWdnZXI6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlICRzZWxlY3RlZDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0XScpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmFsdWVdJyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgICAgIHRoaXMudmlldy5hdHRyKCdkYXRhLXNlbGVjdGVkJywgdGhpcy4kc2VsZWN0ZWQudGV4dCgpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zZWxlY3QnKS5vbignY2xpY2suc2VsZWN0JywgdGhpcy50b2dnbGUpO1xyXG4gICAgICAgICRkb2Mub2ZmKCcuZHJvcGRvd24nKS5vbignY2xpY2suZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3RvZ2dsZSBkcCcpO1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJ29wZW4/Jyk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnPz8/Pz8nKTtcclxuICAgICAgICBpZiAoJChlLmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCdqcy1pdGVtJykgJiYgIXRoaXMuaXNPcGVuKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uSXRlbUNsaWNrID0gKGUpID0+IHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3ZhbHVlJyk7XHJcblxyXG4gICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB0aGlzLiRzZWxlY3RlZC5odG1sKGN1cnJlbnQpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZC1jb3VudHJ5JywgY3VycmVudCk7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcclxuICAgICAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycyhjdXJyZW50KTtcclxuICAgICAgICB9LCAzMDApO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRmlsdGVycyBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogRmlsdGVycztcclxuXHJcbiAgICBwcml2YXRlICRjbGVhcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkcGFuZWw6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW1TZWN0b3I6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW1UaW1lOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICR0aW1lbGluZUl0ZW06IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGFsbFNlY3RvcnM6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHBpY2tlZDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWRDb3VudHJ5OiBKUXVlcnk7XHJcblxyXG4gICAgcHJpdmF0ZSBmaWx0ZXJzOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgICBwcml2YXRlIGlzQWxsQ2hlY2tlZDogYm9vbGVhbjtcclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBzaG93UGlja2VkRmlsdGVycyhjb3VudHJ5Pzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgbGV0IHBpY2tlZFNlY3RvcnMgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuICAgICAgICBsZXQgcGlja2VkVGltZSA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XHJcbiAgICAgICAgbGV0IHBpY2tlZENvdW50cnkgPSBjb3VudHJ5ID8gY291bnRyeSA6IEZpbHRlcnMuaW5zdGFuY2UuJHNlbGVjdGVkQ291bnRyeS50ZXh0KCk7XHJcblxyXG5cclxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuZmluZCgnc3BhbicpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBpZiAocGlja2VkU2VjdG9ycykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRTZWN0b3JzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwaWNrZWRTZWN0b3JzLmxlbmd0aCA9PT0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWwnLCBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzKTtcclxuICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzLnRleHQoKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBwaWNrZWRTZWN0b3JzLmVhY2goKGksIGVsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArICQoZWwpLnRleHQoKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBpY2tlZENvdW50cnkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGlja2VkQ291bnRyeSk7XHJcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRDb3VudHJ5ICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwaWNrZWRUaW1lKSB7XHJcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRUaW1lLmRhdGEoJ2l0ZW0tbGFiZWwnKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRjbGVhciA9IHRoaXMudmlldy5maW5kKCcuanMtY2xlYXInKTtcclxuICAgICAgICB0aGlzLiRwYW5lbCA9IHRoaXMudmlldy5maW5kKCcuanMtcGFuZWwnKTtcclxuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVRpbWUgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRpbWUnKTtcclxuICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdGltZV0nKTtcclxuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWFsbCcpO1xyXG4gICAgICAgIHRoaXMuJHBpY2tlZCA9ICQoJy5qcy1waWNrZWQtZmlsdGVyJyk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWRDb3VudHJ5ID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcclxuXHJcbiAgICAgICAgRmlsdGVycy5pbnN0YW5jZSA9IHRoaXM7XHJcbiAgICAgICAgY29uc29sZS5sb2coRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3RvciwgRmlsdGVycy5pbnN0YW5jZS52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdGVkXScpLmRhdGEoJ3NlbGVjdGVkJykpO1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNsZWFyLmNzcygnaGVpZ2h0JywgdGhpcy4kcGFuZWwub3V0ZXJIZWlnaHQoKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9O1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5vZmYoJy5zZWN0b3InKS5vbignY2xpY2suc2VjdG9yJywgdGhpcy50b2dnbGVTZWN0b3IpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLm9mZignLnRpbWUnKS5vbignY2xpY2sudGltZScsIHRoaXMudG9nZ2xlVGltZSk7XHJcbiAgICAgICAgdGhpcy4kY2xlYXIub2ZmKCcuY2xlYXInKS5vbignY2xpY2suY2xlYXInLCB0aGlzLmNsZWFyQXJyYXkpO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMub2ZmKCcuYWxsJykub24oJ2NsaWNrLmFsbCcsIHRoaXMubWFya0FsbFNlY3RvcnMpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG1hcmtBbGxTZWN0b3JzID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IHRpbWVDaGVja2VkID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhckFycmF5KCk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5lYWNoKChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHRpbWVDaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGltZUNoZWNrZWQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKHRpbWVDaGVja2VkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBjbGVhckFycmF5ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcclxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlU2VjdG9yID0gKGUpID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsbENoZWNrZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVUaW1lID0gKGUpID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcclxuXHJcbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVByZXYgPSB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xyXG5cclxuICAgICAgICAgICAgaWYgKGFjdGl2ZVByZXYpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShhY3RpdmVQcmV2LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICAgICAgdGhpcy5tYXJrVGltZWxpbmUoY3VycmVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgbWFya1RpbWVsaW5lKGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2pzLXRpbWUnKSkge1xyXG4gICAgICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZWRvdCA9IHRoaXMuJHRpbWVsaW5lSXRlbS5maWx0ZXIoJ1tkYXRhLXRpbWU9JyArIGVsLmRhdGEoJ2l0ZW0nKSArICddJyk7XHJcbiAgICAgICAgICAgIHRpbWVsaW5lZG90LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdW5tYXJrVGltZWxpbmUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmZpbHRlcnMuaW5kZXhPZigkZWwuZGF0YSgnaXRlbScpKTtcclxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFkZEVsZW1lbnRUb0FycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xyXG4gICAgICAgIGFycmF5LnB1c2goJGVsLmRhdGEoJ2l0ZW0nKSk7XHJcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5pbnRlcmZhY2UgSURhdGFTdGF0IHtcclxuICAgIHNlY3Rvcjogc3RyaW5nO1xyXG4gICAgdmFsdWU6IG51bWJlcjtcclxuICAgIGNvbG9yOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JpZEl0ZW1Qb3NpdGlvbiB7XHJcbiAgICBjb2x1bW5fc3RhcnQ6IG51bWJlcjtcclxuICAgIGNvbHVtbl9lbmQ6IG51bWJlcjtcclxuICAgIHJvd19zdGFydDogbnVtYmVyO1xyXG4gICAgcm93X2VuZDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFzb25yeSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSBkYXRhOiBBcnJheTxJRGF0YVN0YXQ+ID0gW107XHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGRhdGFBcnJheTogQXJyYXk8YW55PiA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhcmVhOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGl0ZW1NYXJnaW46IG51bWJlciA9IDM7XHJcbiAgICBwcml2YXRlIGdyaWRSb3dzOiBudW1iZXIgPSAyMDtcclxuICAgIHByaXZhdGUgZ3JpZENvbHM6IG51bWJlciA9IDIwO1xyXG4gICAgcHJpdmF0ZSBncmlkQ2VsbHM6IG51bWJlciA9IHRoaXMuZ3JpZENvbHMgKiB0aGlzLmdyaWRSb3dzO1xyXG4gICAgcHJpdmF0ZSBjZWxsc0JhbGFuY2U6IG51bWJlciA9IHRoaXMuZ3JpZENlbGxzO1xyXG4gICAgcHJpdmF0ZSBncmlkQ2VsbDogYW55ID0ge1xyXG4gICAgICAgIHdpZHRoOiB0aGlzLnZpZXcud2lkdGgoKSAvIHRoaXMuZ3JpZENvbHMsXHJcbiAgICAgICAgaGVpZ2h0OiB0aGlzLnZpZXcuaGVpZ2h0KCkgLyB0aGlzLmdyaWRSb3dzLFxyXG4gICAgfTtcclxuICAgIHByaXZhdGUgbWluQ2VsbFdpZHRoOiBudW1iZXIgPSAzO1xyXG4gICAgcHJpdmF0ZSBtaW5DZWxsSGVpZ2h0OiBudW1iZXIgPSAzO1xyXG5cclxuICAgIHByaXZhdGUgaXRlbVBvc2l0aW9uaW5nOiBBcnJheTxJR3JpZEl0ZW1Qb3NpdGlvbj4gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbWFzb25yeS10aWxlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5lYWNoKCAoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YUl0ZW0gPSA8SURhdGFTdGF0PntcclxuICAgICAgICAgICAgICAgIHNlY3RvcjogJChlbCkuZGF0YSgndGlsZScpLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICQoZWwpLmRhdGEoJ3ZhbHVlJyksXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJChlbCkuZGF0YSgnY29sb3InKSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YUl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYXJlYSA9ICh0aGlzLnZpZXcud2lkdGgoKSAtIHRoaXMuaXRlbU1hcmdpbiAqIDMpICogdGhpcy52aWV3LmhlaWdodCgpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGEsIHRoaXMuYXJlYSwgJ2NlbGwgd2lkdGgnLCB0aGlzLmdyaWRDZWxsLndpZHRoLCAnY2VsbCBoZWlnaHQnLCB0aGlzLmdyaWRDZWxsLmhlaWdodCk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKCk7XHJcbiAgICAgICAgdGhpcy5nZXRBcnJGcm9tT2JqZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRBcnJGcm9tT2JqZWN0KCk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkgPSBPYmplY3QuZW50cmllcyh0aGlzLmRhdGEpLnNvcnQoKGEsIGIpID0+IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YUFycmF5KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkuZm9yRWFjaCggKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsWzFdLnZhbHVlLCBpLCAnZWwnKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBlbFsxXS52YWx1ZTtcclxuICAgICAgICAgICAgY29uc3Qgc2VjdG9yID0gZWxbMV0uc2VjdG9yO1xyXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGVsWzFdLmNvbG9yO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKHNlY3RvciwgdmFsdWUsIGNvbG9yLCBpbmRleCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRUaWxlU2l6ZShzZWN0b3I6IHN0cmluZywgdmFsdWU6IG51bWJlciwgY29sb3I6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLiRpdGVtLmZpbHRlcignW2RhdGEtdGlsZT0nICsgc2VjdG9yICsgJ10nKTtcclxuICAgICAgICBsZXQgYXJlYSwgaCwgdywgdCwgbCwgY29sdW1uX3N0YXJ0LCBjb2x1bW5fZW5kLCByb3dfc3RhcnQsIHJvd19lbmQsIGl0ZW0sIGFyZWFHcmlkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFyZWEgPSB0aGlzLmFyZWEgKiAodmFsdWUgLyAxMDApO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmVhLCAnOmFyZWEnLCB0aGlzLml0ZW1Qb3NpdGlvbmluZyx0aGlzLml0ZW1Qb3NpdGlvbmluZy5sZW5ndGggPiAwLCAnY2hlY2sgaWYgc29tZSBpdGVtIG9uIGFycmF5Jyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydCA9IDE7XHJcbiAgICAgICAgICAgIHJvd19zdGFydCA9IDE7XHJcbiAgICAgICAgICAgIHJvd19lbmQgPSB0aGlzLmdyaWRSb3dzO1xyXG4gICAgICAgICAgICBjb2x1bW5fZW5kID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwuaGVpZ2h0ICogcm93X2VuZCkgLyB0aGlzLmdyaWRDZWxsLndpZHRoKTtcclxuICAgICAgICAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSk7XHJcbiAgICAgICAgICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAoaW5kZXggPiAwKSB7XHJcbiAgICAgICAgLy8gICAgIGNvbHVtbl9zdGFydCA9IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDwgdGhpcy5ncmlkQ29scyAtIHRoaXMubWluQ2VsbFdpZHRoID8gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgOiB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0yXS5jb2x1bW5fZW5kICsgMTtcclxuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgPj0gNiA/IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA6IDY7XHJcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XHJcbiAgICAgICAgLy8gICAgIGNvbHVtbl9lbmQgPSBhcmVhR3JpZCAvIHRoaXMubWluQ2VsbFdpZHRoIFxyXG5cclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYXJlYUdyaWQsICdhbW91bnQgb2YgY2VsbHMnKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGl0ZW0gPSA8SUdyaWRJdGVtUG9zaXRpb24+e1xyXG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQ6IGNvbHVtbl9zdGFydCxcclxuICAgICAgICAgICAgY29sdW1uX2VuZDogY29sdW1uX2VuZCxcclxuICAgICAgICAgICAgcm93X3N0YXJ0OiByb3dfc3RhcnQsXHJcbiAgICAgICAgICAgIHJvd19lbmQ6IHJvd19lbmQsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY3VycmVudC5jc3Moe1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgb3BhY2l0eTogMSxcclxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLXN0YXJ0JzogY29sdW1uX3N0YXJ0LFxyXG4gICAgICAgICAgICAnZ3JpZC1jb2x1bW4tZW5kJzogY29sdW1uX2VuZCxcclxuICAgICAgICAgICAgJ2dyaWQtcm93LXN0YXJ0Jzogcm93X3N0YXJ0LFxyXG4gICAgICAgICAgICAnZ3JpZC1yb3ctZW5kJzogJ3NwYW4nICsgcm93X2VuZCxcclxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcixcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pdGVtUG9zaXRpb25pbmcucHVzaChpdGVtKTtcclxuICAgICAgICB0aGlzLmNlbGxzQmFsYW5jZSA9IHRoaXMuY2VsbHNCYWxhbmNlIC0gYXJlYUdyaWQ7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5jZWxsc0JhbGFuY2UsICc6ZnJlZSBjZWxscycpO1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgSVBhcmFsbGF4U2V0dGluZ3Mge1xyXG4gICAgZWxlbWVudHM6IEFycmF5PHN0cmluZz47XHJcbiAgICBtb3ZlWDogQXJyYXk8bnVtYmVyPjtcclxuICAgIG1vdmVZOiBBcnJheTxudW1iZXI+O1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElQYXJhbGxheEVsZW1lbnREYXRhIHtcclxuICAgICRlbDogSlF1ZXJ5O1xyXG4gICAgbW92ZVg6IG51bWJlcjtcclxuICAgIG1vdmVZOiBudW1iZXI7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFBhcmFsbGF4IGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlIG1vdmVYOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIG1vdmVZOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHRpbWU6IG51bWJlciA9IDI7XHJcbiAgICBwcml2YXRlIHNldHRpbmdzOiBJUGFyYWxsYXhTZXR0aW5ncztcclxuICAgIHByaXZhdGUgaXRlbXM6IElQYXJhbGxheEVsZW1lbnREYXRhW107XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnM7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVWYWx1ZUFycmF5KCk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdQYXJhbGxheCcsIHRoaXMpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCkge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy52aWV3Lm9uKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlVmFsdWVBcnJheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBzZWxlY3RvcnMgPSAodGhpcy5zZXR0aW5ncy5lbGVtZW50cykudG9TdHJpbmcoKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgY29uc3QgbW92ZVggPSAodGhpcy5zZXR0aW5ncy5tb3ZlWCkubWFwKE51bWJlcik7XHJcbiAgICAgICAgY29uc3QgbW92ZVkgPSAodGhpcy5zZXR0aW5ncy5tb3ZlWSkubWFwKE51bWJlcik7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBzZWxlY3RvcnMubWFwKChzZWwsIGkpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy52aWV3LmZpbmQoJy4nICsgc2VsKTtcclxuICAgICAgICAgICAgaWYgKCEkZWxbMF0pIHsgY29uc29sZS53YXJuKGBUaGVyZSBpcyBubyAuJHtzZWx9IGVsZW1lbnQgdG8gdXNlIGluIHBhcmFsbGF4YCk7IH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICRlbDogJGVsLFxyXG4gICAgICAgICAgICAgICAgbW92ZVg6IG1vdmVYW2ldLFxyXG4gICAgICAgICAgICAgICAgbW92ZVk6IG1vdmVZW2ldLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pLmZpbHRlcigoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gISFpdGVtLiRlbFswXTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZXZlbnQpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLm1vdmVYID0gKCBldmVudC5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpIC0gMC41O1xyXG4gICAgICAgIHRoaXMubW92ZVkgPSAoIGV2ZW50LmNsaWVudFkgLyB3aW5kb3cuaW5uZXJIZWlnaHQpIC0gMC41O1xyXG5cclxuICAgICAgICB0aGlzLmFuaW1hdGUoLXRoaXMubW92ZVgsIC10aGlzLm1vdmVZKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgYW5pbWF0ZShtb3ZlWCwgbW92ZVkpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXRlbXMpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGdzYXAudG8oaXRlbS4kZWwsIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnRpbWUsXHJcbiAgICAgICAgICAgICAgICB4OiBtb3ZlWCAqIGl0ZW0ubW92ZVgsXHJcbiAgICAgICAgICAgICAgICB5OiBtb3ZlWSAqIGl0ZW0ubW92ZVksXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAncG93ZXIyJyxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSYW5nZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgXHJcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHJhZGlvOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRyaWdnZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRyaWdnZXInKTtcclxuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKTtcclxuICAgICAgICB0aGlzLiRyYWRpbyA9IHRoaXMudmlldy5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRyaWdnZXIub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlKTtcclxuICAgICAgICAkZG9jLm9mZignLnNtYWxsZHJvcGRvd24nKS5vbignY2xpY2suc21hbGxkcm9wZG93bicsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XHJcbiAgICAgICAgdGhpcy4kcmFkaW8ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgb3BlblNlbGVjdChlKTogdm9pZCB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcclxuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNsb3NlU2VsZWN0KCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnb3Blbj8nKTtcclxuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpIHx8ICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCd2YWx1ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuYXR0cignZGF0YS1zZWxlY3RlZCcsIGN1cnJlbnQpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBTd2lwZSwgU3dpcGVFdmVudHMsIElTd2lwZUNvb3JkaW5hdGVzIH0gZnJvbSAnLi9Td2lwZSc7XHJcbi8vIGltcG9ydCB7IFBsYXllciB9IGZyb20gJy4vUGxheWVyJztcclxuXHJcbmludGVyZmFjZSBJU2xpZGVyU2V0dGluZ3Mge1xyXG4gICAgdHlwZTogc3RyaW5nLFxyXG4gICAgbW9kZTogc3RyaW5nLFxyXG4gICAgcGhvbmU/OiBzdHJpbmcsXHJcbiAgICBkZXNrdG9wPzogc3RyaW5nLFxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU2xpZGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRsaXN0OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIG9mZnNldDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgaW5kZXg6IG51bWJlciA9IDE7XHJcbiAgICAvLyBwcml2YXRlIGNvdW50OiBudW1iZXIgPSAwO1xyXG4gICAgcHJpdmF0ZSAkYnV0dG9uUHJldjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkYnV0dG9uTmV4dDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkZG90OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIHN3aXBlOiBTd2lwZTtcclxuICAgIHByaXZhdGUgaXRlbVdpZHRoOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIG1hcmdpbjogbnVtYmVyID0gMzI7XHJcbiAgICBwcml2YXRlIHNldHRpbmdzOiBJU2xpZGVyU2V0dGluZ3M7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG4gICAgICAgIHRoaXMuJGxpc3QgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWxpc3QnKTtcclxuICAgICAgICB0aGlzLiRidXR0b25QcmV2ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1wcmV2Jyk7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTmV4dCA9IHRoaXMudmlldy5maW5kKCcuanMtbmV4dCcpO1xyXG4gICAgICAgIHRoaXMuJGRvdCA9IHRoaXMudmlldy5maW5kKCcuanMtZG90Jyk7XHJcbiAgICAgICAgdGhpcy5tYXJnaW4gPSB0aGlzLiRpdGVtLm91dGVyV2lkdGgodHJ1ZSkgLSB0aGlzLiRpdGVtLndpZHRoKCk7XHJcbiAgICAgICAgdGhpcy5pdGVtV2lkdGggPSB0aGlzLiRpdGVtLndpZHRoKCkgKyB0aGlzLm1hcmdpbjtcclxuICAgICAgICB0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICB0eXBlOiAnJyxcclxuICAgICAgICB9LCBvcHRpb25zIHx8IHZpZXcuZGF0YSgnb3B0aW9ucycpIHx8IHt9KTtcclxuXHJcbiAgICAgICAgLy8gaWYgKHRoaXMuc2V0dGluZ3MubWFyZ2luKSB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMubWFyZ2luID0gdGhpcy5zZXR0aW5ncy5tYXJnaW47XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAoYnJlYWtwb2ludC5waG9uZSAmJiAodGhpcy5zZXR0aW5ncy50eXBlICA9PT0gJ3Bob25lLWRpc2FibGUnIHx8IHRoaXMuc2V0dGluZ3MucGhvbmUgPT09ICdkaXNhYmxlZCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghYnJlYWtwb2ludC5kZXNrdG9wICYmIHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ2NlbnRlci1tb2JpbGUnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MubW9kZSA9ICdjZW50ZXInO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQudGFibGV0ICYmIHRoaXMuc2V0dGluZ3MubW9kZSA9PT0gJ2NlbnRlci10YWJsZXQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MubW9kZSA9ICdjZW50ZXInO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHN3aXBlRWwgPSBicmVha3BvaW50LmRlc2t0b3AgPyB0aGlzLiRsaXN0IDogdGhpcy4kaXRlbS5maXJzdCgpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3dpcGUgPSBuZXcgU3dpcGUodGhpcy4kbGlzdCwge1xyXG4gICAgICAgICAgICBob3Jpem9udGFsOiB0cnVlLFxyXG4gICAgICAgICAgICB2ZXJ0aWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbmltdW06IDgwLFxyXG4gICAgICAgICAgICBkaXNhYmxlTW91c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBkaXNhYmxlVG91Y2g6IGZhbHNlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuc3dpcGUub24oU3dpcGVFdmVudHMuRU5ELCB0aGlzLm9uU3dpcGUpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLiRpdGVtLm91dGVyV2lkdGgodHJ1ZSkgLSB0aGlzLiRpdGVtLndpZHRoKCkpO1xyXG4gICAgfVxyXG5cclxuICAgIFxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQucGhvbmUgJiYgKHRoaXMuc2V0dGluZ3MudHlwZSA9PT0gJ3Bob25lLWRpc2FibGUnIHx8IHRoaXMuc2V0dGluZ3MucGhvbmUgPT09ICdkaXNhYmxlZCcpKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHRoaXMuaXRlbVdpZHRoID0gdGhpcy4kaXRlbS53aWR0aCgpICsgdGhpcy5tYXJnaW47XHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5pdGVtV2lkdGggKiB0aGlzLiRpdGVtLmxlbmd0aDtcclxuICAgICAgICB0aGlzLiRsaXN0LmNzcygnd2lkdGgnLCB3aWR0aCk7XHJcbiAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4KTtcclxuICAgIH07XHJcblxyXG5cclxuICAgIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgZ3NhcC5zZXQodGhpcy4kbGlzdCwgeyB4OiB0aGlzLm9mZnNldCB9KTtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUl0ZW1zKCk7XHJcbiAgICAgICAgdGhpcy5yZXNpemVEb3RzKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnNldHRpbmdzLm1vZGUgPT09ICdjZW50ZXInICYmIHRoaXMuJGl0ZW0ubGVuZ3RoID4gMikge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gMjtcclxuICAgICAgICAgICAgdGhpcy5nbygyKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvblByZXYub2ZmKCcuc2xpZGVyY3VzdG9tJykub24oJ2NsaWNrLnNsaWRlcmN1c3RvbScsIChlKSA9PiB0aGlzLnByZXYoKSk7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTmV4dC5vZmYoJy5zbGlkZXJjdXN0b20nKS5vbignY2xpY2suc2xpZGVyY3VzdG9tJywgKGUpID0+IHRoaXMubmV4dCgpKTtcclxuICAgICAgICB0aGlzLiRkb3Qub2ZmKCcuc2xpZGVyY3VzdG9tJykub24oJ2NsaWNrLnNsaWRlcmN1c3RvbScsIChlKSA9PiB0aGlzLmNsaWNrRWxlbWVudChlKSk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5vZmYoJy5zbGlkZXJjdXN0b20nKS5vbignY2xpY2suc2xpZGVyY3VzdG9tJywgKGUpID0+IHRoaXMuY2xpY2tFbGVtZW50KGUpKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSByZXNpemVEb3RzKCk6IHZvaWQge1xyXG4gICAgICAgIGlmICghdGhpcy4kZG90KSB7IHJldHVybjsgfVxyXG4gICAgICAgIGlmICh0aGlzLiRkb3QubGVuZ3RoID4gNykge1xyXG4gICAgICAgICAgICB0aGlzLiRkb3QuZWFjaCggZWwgPT4ge1xyXG4gICAgICAgICAgICAgICAgJChlbCkuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiAnMTBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMHB4JyxcclxuICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLWxlZnQnOiAnM3B4JyxcclxuICAgICAgICAgICAgICAgICAgICAnbWFyZ2luLXJpZ2h0JzogJzNweCdcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblN3aXBlID0gKGU6IElTd2lwZUNvb3JkaW5hdGVzKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKGUuZGlyZWN0aW9uID09PSAnbGVmdCcgfHwgZS5kaXJlY3Rpb24gPT09ICdyaWdodCcpIHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZS5kaXJlY3Rpb24sIGUuKTtcclxuICAgICAgICAgICAgdGhpcy5zaGlmdCh7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiArMSwgcmlnaHQ6IC0xLFxyXG4gICAgICAgICAgICB9W2UuZGlyZWN0aW9uXSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzaGlmdChkaXI6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGxldCBvbGQ7XHJcblxyXG4gICAgICAgIGlmIChkaXIgPT09IC0xKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJldigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMubmV4dCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY2xpY2tFbGVtZW50KGUpOiB2b2lkIHtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCQoZS50YXJnZXQpKTtcclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuaGFzQ2xhc3MoJ3NoYXJlX19idXR0b24nKSB8fCAkKGUudGFyZ2V0KS5oYXNDbGFzcygnZXZhbHVhdGlvbicpIHx8ICQoZS50YXJnZXQpLmhhc0NsYXNzKCdzbGlkZXJfX2l0ZW0tZm9vdGVyJykpIHsgcmV0dXJuIDsgfVxyXG4gICAgICAgIGxldCBlbCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBsZXQgaSA9IGVsLmluZGV4KCkgKyAxO1xyXG4gICAgICAgIHRoaXMuaW5kZXggPSBpO1xyXG5cclxuICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG5leHQoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLiRpdGVtLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLmluZGV4ID0gdGhpcy5pbmRleCArIDE7XHJcbiAgICAgICAgICAgIHRoaXMuZ28odGhpcy5pbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHByZXYoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4IC0gMTtcclxuICAgICAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGdvKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICAvLyBQbGF5ZXIucGF1c2VBbGwoKTtcclxuICAgICAgICBsZXQgeCA9IChpbmRleCAqIHRoaXMuaXRlbVdpZHRoKSAtIHRoaXMuaXRlbVdpZHRoO1xyXG4gICAgICAgIHggPSB0aGlzLnNldHRpbmdzLm1vZGUgPT09ICdjZW50ZXInID8gKHggLSAoJHdpbmRvdy53aWR0aCgpICogMC41KSAtIHRoaXMubWFyZ2luKSArIHRoaXMuaXRlbVdpZHRoICogMC41IDogeFxyXG4gICAgICAgIGdzYXAudG8odGhpcy4kbGlzdCwgeyBkdXJhdGlvbjogMC41LCB4OiAteCwgdHJhbnNmb3JtT3JpZ2luOiAnNTAlIDUwJScsICBlYXNlOiAnc2luZS5pbk91dCcsIG9uQ29tcGxldGU6ICgpID0+IHt9IH0pO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUl0ZW1zKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlSXRlbXMoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zZXROYXZBdmFpbGJpbGl0eSgpO1xyXG5cclxuICAgICAgICB0aGlzLiRpdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRpdGVtLmVxKHRoaXMuaW5kZXggLSAxKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kZG90LnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRkb3QuZXEodGhpcy5pbmRleCAtIDEpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRJblZpZXdJdGVtQ2xhc3MoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBUbyBtYWtlIHZpc2libGUgc29jaWFsIGZvb3RlciBmb3IgbmV4dCBpdGVtIGluIGFydGljbGUgc2xpZGVyXHJcbiAgICBwcml2YXRlIHNldEluVmlld0l0ZW1DbGFzcygpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIWJyZWFrcG9pbnQucGhvbmUgJiYgdGhpcy5zZXR0aW5ncy50eXBlID09PSAnYXJ0aWNsZScpIHtcclxuICAgICAgICAgICAgdGhpcy4kaXRlbS5yZW1vdmVDbGFzcygnaXMtaW4tdmlldycpO1xyXG4gICAgICAgICAgICB0aGlzLiRpdGVtLmZpbHRlcignLmlzLWFjdGl2ZScpLm5leHQoKS5hZGRDbGFzcygnaXMtaW4tdmlldycpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzZXROYXZBdmFpbGJpbGl0eSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0cnVlKSB7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjYXNlIHRoaXMuaW5kZXggPT0gMTpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblByZXYuYWRkQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXh0LnJlbW92ZUNsYXNzKCdpcy1kaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIHRoaXMuaW5kZXggPT09IHRoaXMuJGl0ZW0ubGVuZ3RoOlxyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV4dC5hZGRDbGFzcygnaXMtZGlzYWJsZWQnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblByZXYucmVtb3ZlQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5leHQucmVtb3ZlQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25QcmV2LnJlbW92ZUNsYXNzKCdpcy1kaXNhYmxlZCcpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkd3JhcDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkY3VycmVudDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSB0YWJUb1Nob3c6IG51bWJlcjsgLy8gZm9yIGFzeW5jIHN3aXRjaFxyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12aWV3XScpO1xyXG4gICAgICAgIHRoaXMuJHdyYXAgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRhYnMtd3JhcHBlcicpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcocGFyc2VJbnQoVXRpbHMuZ2V0UGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpLnRhYiwgMTApIHx8IDApO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vblRhYkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25UYWJDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVWaWV3KGluZGV4KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBpbmRleDtcclxuICAgICAgICB0aGlzLiR0YWIucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuJHRhYi5maWx0ZXIoJ1tkYXRhLXRhYj0nICsgaW5kZXggKyAnXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmhpZGVDdXJyZW50KCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvdyh0aGlzLnRhYlRvU2hvdyk7XHJcbiAgICAgICAgICAgIHRoaXMudGFiVG9TaG93ID0gbnVsbDtcclxuICAgICAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgaGlkZUN1cnJlbnQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWYgKCF0aGlzLiRjdXJyZW50KSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kY3VycmVudCwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY3VycmVudC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2hvdyhpbmRleDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgdGhpcy4kY3VycmVudCA9IHRoaXMuJGl0ZW0uZmlsdGVyKCdbZGF0YS12aWV3PScgKyBpbmRleCArICddJyk7XHJcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICBnc2FwLmZyb21Ubyh0aGlzLiRjdXJyZW50LCB7XHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuNyxcclxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHJlc29sdmUoKSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XHJcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi4vQnJvd3Nlcic7XHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU3dpcGVDb29yZGluYXRlcyB7XHJcbiAgICB4PzogbnVtYmVyO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIHN0YXJ0WD86IG51bWJlcjtcclxuICAgIHN0YXJ0WT86IG51bWJlcjtcclxuICAgIGRlbHRhWD86IG51bWJlcjtcclxuICAgIGRlbHRhWT86IG51bWJlcjtcclxuICAgIGRpcmVjdGlvbj86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU3dpcGVPcHRpb25zIHtcclxuICAgIHZlcnRpY2FsPzogYm9vbGVhbjtcclxuICAgIGhvcml6b250YWw/OiBib29sZWFuO1xyXG4gICAgbWluaW11bT86IG51bWJlcjtcclxuICAgIGRpc2FibGVNb3VzZT86IGJvb2xlYW47XHJcbiAgICBkaXNhYmxlVG91Y2g/OiBib29sZWFuO1xyXG4gICAgaGFuZGxlcj86IEpRdWVyeSB8IEhUTUxFbGVtZW50IHwgc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3dpcGVFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyBTVEFSVDogc3RyaW5nID0gJ3N0YXJ0JztcclxuICAgIHB1YmxpYyBzdGF0aWMgVVBEQVRFOiBzdHJpbmcgPSAndXBkYXRlJztcclxuICAgIHB1YmxpYyBzdGF0aWMgRU5EOiBzdHJpbmcgPSAnZW5kJztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlQXhlcyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIEhPUklaT05UQUw6IHN0cmluZyA9ICdoJztcclxuICAgIHB1YmxpYyBzdGF0aWMgVkVSVElDQUw6IHN0cmluZyA9ICd2JztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlRGlyZWN0aW9ucyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIExFRlQ6IHN0cmluZyA9ICdsZWZ0JztcclxuICAgIHB1YmxpYyBzdGF0aWMgUklHSFQ6IHN0cmluZyA9ICdyaWdodCc7XHJcbiAgICBwdWJsaWMgc3RhdGljIFVQOiBzdHJpbmcgPSAndXAnO1xyXG4gICAgcHVibGljIHN0YXRpYyBET1dOOiBzdHJpbmcgPSAnZG93bic7XHJcbiAgICBwdWJsaWMgc3RhdGljIE5PTkU6IHN0cmluZyA9ICdub25lJztcclxuICAgIHB1YmxpYyBzdGF0aWMgQ0xJQ0s6IHN0cmluZyA9ICdjbGljayc7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFN3aXBlIGV4dGVuZHMgSGFuZGxlciB7XHJcblxyXG4gICAgcHVibGljIHN3aXBpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAvLyBkZWx0YSBvZiBjdXJyZW50IG1vdmVtZW50OlxyXG4gICAgcHVibGljIGRlbHRhWDogbnVtYmVyID0gMDtcclxuICAgIHB1YmxpYyBkZWx0YVk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgLy8gY3VycmVudCBwb3NpdGlvbjpcclxuICAgIHB1YmxpYyB4OiBudW1iZXIgPSAwO1xyXG4gICAgcHVibGljIHk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHJpdmF0ZSAkaGFuZGxlcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBzdGFydFg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIHN0YXJ0WTogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgdWlkOiBzdHJpbmc7XHJcbiAgICBwcml2YXRlIG1vdXNlOiBJU3dpcGVDb29yZGluYXRlcyA9IHsgeDogMCwgeTogMCB9O1xyXG4gICAgcHJpdmF0ZSBkcmFnZ2VkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBwcml2YXRlIGF4ZTogU3dpcGVBeGVzID0gbnVsbDtcclxuXHJcbiAgICBwcml2YXRlIG9mZnNldFg6IG51bWJlciA9IDA7XHJcbiAgICBwcml2YXRlIG9mZnNldFk6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHJpdmF0ZSBkaXNhYmxlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgc2V0dGluZ3M6IElTd2lwZU9wdGlvbnM7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz86IElTd2lwZU9wdGlvbnMpIHtcclxuICAgICAgICBzdXBlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnNldHRpbmdzID0gJC5leHRlbmQoe1xyXG4gICAgICAgICAgICBob3Jpem9udGFsOiB0cnVlLFxyXG4gICAgICAgICAgICB2ZXJ0aWNhbDogZmFsc2UsXHJcbiAgICAgICAgICAgIG1pbmltdW06IDgwLFxyXG4gICAgICAgICAgICBkaXNhYmxlTW91c2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBkaXNhYmxlVG91Y2g6IGZhbHNlLFxyXG4gICAgICAgICAgICBoYW5kbGVyOiBudWxsLFxyXG4gICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuc3dpcGluZyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuJGhhbmRsZXIgPSAodGhpcy5zZXR0aW5ncy5oYW5kbGVyID8gJCh0aGlzLnNldHRpbmdzLmhhbmRsZXIpIDogdGhpcy52aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcclxuICAgICAgICB0aGlzLnVpZCA9IFV0aWxzLmdlbmVyYXRlVUlEKCk7XHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICAgICAgdGhpcy51bmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyB0b2dnbGUoZW5hYmxlOiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9ICFlbmFibGU7XHJcbiAgICAgICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBlbmQoKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kU3dpcGUoKTtcclxuICAgICAgICAgICAgdGhpcy5heGUgPSBudWxsO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3Qgc1QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCAwO1xyXG4gICAgICAgIHRoaXMub2Zmc2V0WCA9IHRoaXMudmlldy5vZmZzZXQoKS5sZWZ0O1xyXG4gICAgICAgIHRoaXMub2Zmc2V0WSA9IHRoaXMudmlldy5vZmZzZXQoKS50b3AgLSBzVDtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlQ3Vyc29yKCk6IHZvaWQge1xyXG4gICAgICAgIGxldCBpc01vdXNlRGlzYWJsZWQgPSAhTW9kZXJuaXpyLnRvdWNoZXZlbnRzICYmICEhdGhpcy5zZXR0aW5ncy5kaXNhYmxlTW91c2U7XHJcbiAgICAgICAgdGhpcy4kaGFuZGxlci50b2dnbGVDbGFzcygnaXMtZ3JhYmJhYmxlJywgIXRoaXMuZGlzYWJsZWQgJiYgIWlzTW91c2VEaXNhYmxlZCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zd2lwZScpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZGlzYWJsZU1vdXNlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGhhbmRsZXJcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2Vkb3duLnN3aXBlJywgdGhpcy5vbk1vdXNlRG93bik7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2Vtb3ZlLnN3aXBlJywgdGhpcy5vbk1vdXNlTW92ZSlcclxuICAgICAgICAgICAgICAgIC5vbignbW91c2V1cC5zd2lwZScsIHRoaXMub25Nb3VzZVVwKVxyXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZWxlYXZlLnN3aXBlJywgdGhpcy5vbk1vdXNlVXApO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLnNldHRpbmdzLmRpc2FibGVUb3VjaCkge1xyXG4gICAgICAgICAgICB0aGlzLiRoYW5kbGVyXHJcbiAgICAgICAgICAgICAgICAub24oJ3RvdWNoc3RhcnQuc3dpcGUnLCB0aGlzLm9uVG91Y2hTdGFydCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgICAgIC5vbigndG91Y2htb3ZlLnN3aXBlJywgdGhpcy5vblRvdWNoTW92ZSk7XHJcblxyXG4gICAgICAgICAgICAkZG9jXHJcbiAgICAgICAgICAgICAgICAub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpXHJcbiAgICAgICAgICAgICAgICAub24oJ3RvdWNoZW5kLnN3aXBlJyArIHRoaXMudWlkLCB0aGlzLm9uVG91Y2hFbmQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdW5iaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zd2lwZScpO1xyXG4gICAgICAgICRkb2Mub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlRG93biA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKChlLndoaWNoICYmIGUud2hpY2ggPT09IDMpIHx8IChlLmJ1dHRvbiAmJiBlLmJ1dHRvbiA9PT0gMikpIHsgcmV0dXJuOyB9IC8vIHJpZ2h0IGNsaWNrXHJcblxyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB0aGlzLm1vdXNlLnN0YXJ0WCA9IChlLmNsaWVudFggfHwgZS5wYWdlWCkgLSB0aGlzLm9mZnNldFg7XHJcbiAgICAgICAgdGhpcy5tb3VzZS5zdGFydFkgPSAoZS5jbGllbnRZIHx8IGUucGFnZVkpIC0gdGhpcy5vZmZzZXRZO1xyXG4gICAgICAgIHRoaXMuc3RhcnRTd2lwZSgpO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnggPSAoZS5jbGllbnRYIHx8IGUucGFnZVgpIC0gdGhpcy5vZmZzZXRYO1xyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnkgPSAoZS5jbGllbnRZIHx8IGUucGFnZVkpIC0gdGhpcy5vZmZzZXRZO1xyXG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XHJcbiAgICAgICAgICAgIGxldCBkaWZmWSA9IE1hdGguYWJzKHRoaXMubW91c2UueSAtIHRoaXMubW91c2Uuc3RhcnRZKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXhlID0gZGlmZlggPiBkaWZmWSA/IFN3aXBlQXhlcy5IT1JJWk9OVEFMIDogU3dpcGVBeGVzLlZFUlRJQ0FMO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZlggPiAxMiB8fCBkaWZmWSA+IDEyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCAmJiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCkgfHwgKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuVkVSVElDQUwgJiYgISF0aGlzLnNldHRpbmdzLnZlcnRpY2FsKSkge1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTd2lwZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzLnZpZXcuZmluZCgnYScpLmNzcyh7ICdwb2ludGVyLWV2ZW50cyc6ICdub25lJyB9KTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlVXAgPSAoZSk6IHZvaWR8Ym9vbGVhbiA9PiB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgdGhpcy5lbmRTd2lwZSgpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnZpZXcuZmluZCgnYScpLmNzcyh7ICdwb2ludGVyLWV2ZW50cyc6ICcnIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmF4ZSA9IG51bGw7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblRvdWNoU3RhcnQgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlLnN0YXJ0WCA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VYO1xyXG4gICAgICAgIHRoaXMubW91c2Uuc3RhcnRZID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XHJcbiAgICAgICAgdGhpcy5zdGFydFN3aXBlKCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblRvdWNoTW92ZSA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnggPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgICAgICAgdGhpcy5tb3VzZS55ID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XHJcbiAgICAgICAgICAgIGxldCBkaWZmWSA9IE1hdGguYWJzKHRoaXMubW91c2UueSAtIHRoaXMubW91c2Uuc3RhcnRZKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYXhlID0gZGlmZlggPiBkaWZmWSA/IFN3aXBlQXhlcy5IT1JJWk9OVEFMIDogU3dpcGVBeGVzLlZFUlRJQ0FMO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZGlmZlggPiAxMiB8fCBkaWZmWSA+IDEyKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCAmJiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCkgfHwgKHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuVkVSVElDQUwgJiYgISF0aGlzLnNldHRpbmdzLnZlcnRpY2FsKSkge1xyXG4gICAgICAgICAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVTd2lwZSgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuYXhlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXBpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uVG91Y2hFbmQgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xyXG4gICAgICAgICAgICAvLyBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIHRoaXMuZW5kU3dpcGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5heGUgPSBudWxsO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhcnRTd2lwZSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN3aXBpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5zdGFydFggPSAwO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0WSA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuYXhlID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihTd2lwZUV2ZW50cy5TVEFSVCwge1xyXG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdbMF0sXHJcbiAgICAgICAgICAgICAgICB4OiB0aGlzLm1vdXNlLnN0YXJ0WCAtIHRoaXMudmlldy5vZmZzZXQoKS5sZWZ0LFxyXG4gICAgICAgICAgICAgICAgeTogdGhpcy5tb3VzZS5zdGFydFkgLSB0aGlzLnZpZXcub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMsXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy4kaGFuZGxlci5hZGRDbGFzcygnaXMtZ3JhYmJlZCcpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlU3dpcGUoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGxldCB4ID0gdGhpcy5zdGFydFggKyB0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCxcclxuICAgICAgICAgICAgeSA9IHRoaXMuc3RhcnRZICsgdGhpcy5tb3VzZS55IC0gdGhpcy5tb3VzZS5zdGFydFk7XHJcblxyXG4gICAgICAgIHRoaXMueCA9IHg7XHJcbiAgICAgICAgdGhpcy55ID0geTtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLlVQREFURSwge1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudmlld1swXSxcclxuICAgICAgICAgICAgZGVsdGFYOiAhIXRoaXMuc2V0dGluZ3MuaG9yaXpvbnRhbCA/IHggOiAwLFxyXG4gICAgICAgICAgICBkZWx0YVk6ICEhdGhpcy5zZXR0aW5ncy52ZXJ0aWNhbCA/IHkgOiAwLFxyXG4gICAgICAgICAgICB4OiB0aGlzLm1vdXNlLngsXHJcbiAgICAgICAgICAgIHk6IHRoaXMubW91c2UueSxcclxuICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhhbmRsZXIuYWRkQ2xhc3MoJ2lzLWRyYWdnZWQnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZW5kU3dpcGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zd2lwaW5nID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IGRpcmVjdGlvbiA9IHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCA/ICh0aGlzLnggPCB0aGlzLnN0YXJ0WCA/IFN3aXBlRGlyZWN0aW9ucy5MRUZUIDogU3dpcGVEaXJlY3Rpb25zLlJJR0hUKSA6ICh0aGlzLnkgPCB0aGlzLnN0YXJ0WSA/IFN3aXBlRGlyZWN0aW9ucy5VUCA6IFN3aXBlRGlyZWN0aW9ucy5ET1dOKTtcclxuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gU3dpcGVBeGVzLkhPUklaT05UQUwgJiYgTWF0aC5hYnModGhpcy5tb3VzZS54IC0gdGhpcy5tb3VzZS5zdGFydFgpIDwgdGhpcy5zZXR0aW5ncy5taW5pbXVtID8gU3dpcGVEaXJlY3Rpb25zLk5PTkUgOiBkaXJlY3Rpb247XHJcbiAgICAgICAgZGlyZWN0aW9uID0gdGhpcy5heGUgPT09IFN3aXBlQXhlcy5WRVJUSUNBTCAmJiBNYXRoLmFicyh0aGlzLm1vdXNlLnkgLSB0aGlzLm1vdXNlLnN0YXJ0WSkgPCB0aGlzLnNldHRpbmdzLm1pbmltdW0gPyBTd2lwZURpcmVjdGlvbnMuTk9ORSA6IGRpcmVjdGlvbjtcclxuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gbnVsbCA/IFN3aXBlRGlyZWN0aW9ucy5OT05FIDogZGlyZWN0aW9uO1xyXG4gICAgICAgIGRpcmVjdGlvbiA9IGRpcmVjdGlvbiA9PT0gU3dpcGVEaXJlY3Rpb25zLk5PTkUgJiYgIXRoaXMuZHJhZ2dlZCA/IFN3aXBlRGlyZWN0aW9ucy5DTElDSyA6IGRpcmVjdGlvbjtcclxuXHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLkVORCwge1xyXG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudmlld1swXSxcclxuICAgICAgICAgICAgZGlyZWN0aW9uOiBkaXJlY3Rpb24sXHJcbiAgICAgICAgICAgIGluc3RhbmNlOiB0aGlzLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRoYW5kbGVyLnJlbW92ZUNsYXNzKCdpcy1ncmFiYmVkIGlzLWRyYWdnZWQnKTtcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFRvb2x0aXAgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSAkYnV0dG9uOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRjbG9zZTogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRidXR0b24gPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRvZ2dsZScpO1xyXG4gICAgICAgIHRoaXMuJGNsb3NlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykgOiBudWxsO1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvbi5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25CdXR0b25DbGlja0hhbmRsZXIpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdcclxuICAgICAgICAgICAgLm9mZignbW91c2VvbicpLm9uKCdtb3VzZWVudGVyLm1vdXNlb24nLCB0aGlzLm9uTW91c2VFbnRlcilcclxuICAgICAgICAgICAgLm9mZignbW91c2VvZmYnKS5vbignbW91c2VsZWF2ZS5tb3VzZW9mZicsIHRoaXMub25Nb3VzZUxlYXZlKTtcclxuXHJcbiAgICAgICAgJGRvYy5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuJGNsb3NlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNsb3NlLm9uKCdjbGljay50b29sdGlwJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlRW50ZXIgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZUxlYXZlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25CdXR0b25DbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAvLyBpZiAoIWJyZWFrcG9pbnQuZGVza3RvcCkge1xyXG4gICAgICAgIC8vICAgICBhbGVydCgkKGUuY3VycmVudFRhcmdldClbMF0pO1xyXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygkKGUuY3VycmVudFRhcmdldClbMF0pO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCApIHtcclxuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW4oKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgIH0sIDI1MCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5hZGRDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgMzAwMCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNsb3NlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5yZW1vdmVDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IENvbXBvbmVudCwgQ29tcG9uZW50RXZlbnRzIH0gZnJvbSAnLi4vY29tcG9uZW50cy9Db21wb25lbnQnO1xyXG4vLyBpbXBvcnQgQmFja2dyb3VuZCBmcm9tICcuLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcclxuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4uL0NsYXNzZXMnO1xyXG5pbXBvcnQgeyAkYXJ0aWNsZSwgJGJvZHksICRtYWluIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5leHBvcnQgY2xhc3MgUGFnZUV2ZW50cyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST0dSRVNTOiBzdHJpbmcgPSAncHJvZ3Jlc3MnO1xyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDT01QTEVURTogc3RyaW5nID0gJ2NvbXBsZXRlJztcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnYXBwZW5kJztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFBhZ2UgZXh0ZW5kcyBIYW5kbGVyIHtcclxuXHJcbiAgICBwdWJsaWMgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xyXG4gICAgLy8gcHVibGljIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XHJcbiAgICBwcml2YXRlIGxvYWRlcjogSlF1ZXJ5RGVmZXJyZWQ8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZD47XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBvcHRpb25zPykge1xyXG5cclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMudmlldy5jc3MoeyBvcGFjaXR5OiAwIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyh0aGlzLnZpZXcucGFyZW50KCkuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogcHJlbG9hZCBuZWNlc3NhcnkgYXNzZXRzOlxyXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gbG9hZGluZyBpbWFnZXMgcHJvbWlzZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcHJlbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgICAgbGV0IGlsID0gaW1hZ2VzTG9hZGVkKHRoaXMudmlldy5maW5kKCcucHJlbG9hZCcpLnRvQXJyYXkoKSwgPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWRPcHRpb25zPnsgYmFja2dyb3VuZDogdHJ1ZSB9KTtcclxuICAgICAgICBsZXQgaW1hZ2VzID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgaW1hZ2VzID0gaW1hZ2VzLmNvbmNhdChjb21wb25lbnQucHJlbG9hZEltYWdlcygpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgdXJsIG9mIGltYWdlcykge1xyXG4gICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKHVybCwgbnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRlciA9IGlsLmpxRGVmZXJyZWQ7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyLnByb2dyZXNzKChpbnN0YW5jZTogSW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZCwgaW1hZ2U6IEltYWdlc0xvYWRlZC5Mb2FkaW5nSW1hZ2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyID0gaW5zdGFuY2UucHJvZ3Jlc3NlZENvdW50IC8gaW5zdGFuY2UuaW1hZ2VzLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLlBST0dSRVNTLCBwcm9ncmVzcyk7XHJcbiAgICAgICAgICAgIH0pLmFsd2F5cygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoUGFnZUV2ZW50cy5DT01QTEVURSk7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjaGVjayBpZiBhbnkgQ29tcG9uZW50IGNhbiBiZSBjaGFuZ2VkIGFmdGVyIG9uU3RhdGVcclxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSB3aGVuIG9uZSBvZiB0aGUgY29tcG9uZW50cyB0YWtlcyBhY3Rpb24gaW4gb25TdGF0ZSBmdW5jdGlvbiBjYWxsXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY2hhbmdlZDogYm9vbGVhbiA9ICEhZmFsc2U7XHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDaGFuZ2VkOiBib29sZWFuID0gY29tcG9uZW50Lm9uU3RhdGUoKTtcclxuICAgICAgICAgICAgaWYgKCFjaGFuZ2VkICYmICEhY29tcG9uZW50Q2hhbmdlZCkge1xyXG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjaGFuZ2VkO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWdlIGVudGVyaW5nIGFuaW1hdGlvblxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IGFuaW1hdGlvbiBkZWxheVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYW5pbWF0ZUluKGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcclxuICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5jYWxsQWxsKHRoaXMuY29tcG9uZW50cywgJ2FuaW1hdGVJbicpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb21wb25lbnRzLmxlbmd0aDsgKytpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1tpXS5hbmltYXRlSW4oaSwgZGVsYXkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogMC40LFxyXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxyXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwYWdlIGV4aXQgYW5pbWF0aW9uXHJcbiAgICAgKiAoY2FsbGVkIGFmdGVyIG5ldyBjb250ZW50IGlzIGxvYWRlZCBhbmQgYmVmb3JlIGlzIHJlbmRlcmVkKVxyXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gYW5pbWF0aW9uIHByb21pc2VcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcclxuICAgICAgICAvLyBhbmltYXRpb24gb2YgdGhlIHBhZ2U6XHJcbiAgICAgICAgJG1haW4ucmVtb3ZlQ2xhc3MoJ2lzLWxvYWRlZCcpO1xyXG4gICAgICAgIGdzYXAuc2V0KGJnLCB7IG9wYWNpdHk6IDAsIGRpc3BsYXk6ICdub25lJ30pO1xyXG4gICAgICAgIGxldCBwYWdlQW5pbWF0aW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIGFuaW1hdGlvbnMgb2YgYWxsIGNvbXBvbmVudHM6XHJcbiAgICAgICAgbGV0IGNvbXBvbmVudEFuaW1hdGlvbnM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gdGhpcy5jb21wb25lbnRzLm1hcCgob2JqKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiA8UHJvbWlzZTx2b2lkPj5vYmouYW5pbWF0ZU91dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyByZXR1cm4gb25lIHByb21pc2Ugd2FpdGluZyBmb3IgYWxsIGFuaW1hdGlvbnM6XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhbGxQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBjb21wb25lbnRBbmltYXRpb25zLmNvbmNhdChwYWdlQW5pbWF0aW9uUHJvbWlzZSk7XHJcblxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihhbGxQcm9taXNlcykudGhlbigocmVzdWx0cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PZmYnKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWaXNpYmlsaXR5IHdpZGdldCBoYW5kbGVyLCBmaXJlcyB3aGVuIHVzZXIgZXhpdHMgYnJvd3NlciB0YWJcclxuICAgICAqL1xyXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PbicpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiByZXNpemUgaGFuZGxlclxyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IHdkdCAgICAgICAgd2luZG93IHdpZHRoXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gaGd0ICAgICAgICB3aW5kb3cgaGVpZ2h0XHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gYnJlYWtwb2ludCBJQnJlYWtwb2ludCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ6IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5jYWxsQWxsKCdyZXNpemUnLCB3ZHQsIGhndCwgYnJlYWtwb2ludCwgYnBDaGFuZ2VkKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogY2xlYW51cCB3aGVuIGNsb3NpbmcgUGFnZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ2Rlc3Ryb3knKTtcclxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcclxuICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzID0ge307XHJcblxyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldyk7XHJcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcclxuXHJcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJvdGVjdGVkIGJ1aWxkQ29tcG9uZW50cygkY29tcG9uZW50czogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9ICRjb21wb25lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRjb21wb25lbnQ6IEpRdWVyeSA9ICRjb21wb25lbnRzLmVxKGkpO1xyXG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lOiBzdHJpbmcgPSAkY29tcG9uZW50LmRhdGEoJ2NvbXBvbmVudCcpO1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb21wb25lbnROYW1lLCBjb21wb25lbnRzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb21wb25lbnROYW1lICE9PSB1bmRlZmluZWQgJiYgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogT2JqZWN0ID0gJGNvbXBvbmVudC5kYXRhKCdvcHRpb25zJyksXHJcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBDb21wb25lbnQgPSBuZXcgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSgkY29tcG9uZW50LCBvcHRpb25zKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnQub24oQ29tcG9uZW50RXZlbnRzLkNIQU5HRSwgdGhpcy5vbkNvbXBvbmVudENoYW5nZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBgJXNgIGNvbXBvbmVudCEnLCBjb21wb25lbnROYW1lKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ29tcG9uZW50Q2hhbmdlID0gKGVsKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudHMoZWwuZmlsdGVyKCdbZGF0YS1jb21wb25lbnRdJykuYWRkKGVsLmZpbmQoJ1tkYXRhLWNvbXBvbmVudF0nKSkpO1xyXG4gICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNIQU5HRSwgZWwpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyBzaG9ydCBjYWxsXHJcbiAgICBwcml2YXRlIGNhbGxBbGwoZm46IHN0cmluZywgLi4uYXJncyk6IHZvaWQge1xyXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRbZm5dID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICBjb21wb25lbnRbZm5dLmFwcGx5KGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbn1cclxuIl19
