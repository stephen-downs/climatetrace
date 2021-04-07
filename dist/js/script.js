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
            const current = $(e.currentTarget);
            if (current.hasClass('is-on-chart')) {
                this.animateChart(current.index(), false);
                current.removeClass('is-on-chart');
            }
            else {
                this.animateChart(current.index(), true);
                current.addClass('is-on-chart');
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
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            data.yPx.forEach((y, i, a) => {
                if (i / a.length <= data.xPercent && data.xPercent > 0) {
                    this.ctx.lineTo(this.graph.right / a.length * i + this.graph.left, y);
                    this.ctx.stroke();
                }
            });
            this.ctx.closePath();
            if (data.fill) {
                let lastX = this.margin.left;
                this.ctx.strokeStyle = 'transparent';
                this.ctx.fillStyle = data.color;
                this.ctx.globalAlpha = 0.4;
                this.ctx.beginPath();
                data.yPx.forEach((y, i, a) => {
                    if (i / a.length <= data.xPercent && data.xPercent > 0) {
                        this.ctx.lineTo(this.graph.right / a.length * i + this.graph.left, y);
                        this.ctx.lineTo(this.graph.right / a.length * i + this.graph.left, this.canvas.height - this.margin.bottom);
                        this.ctx.lineTo(lastX, this.canvas.height - this.margin.bottom);
                        this.ctx.moveTo(this.graph.right / a.length * i + this.graph.left, y);
                        lastX = this.graph.right / a.length * i + this.graph.left;
                    }
                });
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
        for (let i = 0; i < this.$tab.length; i++) {
            this.animateChart(i, false);
        }
        this.animateChart(0, true);
        this.markTab(0);
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
        console.log(this.graphsData);
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }
    markTab(id) {
        this.$tab.eq(id).addClass('is-on-chart');
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
    animateChart(id, direction) {
        const dir = direction ? 1 : 0;
        gsap.to(this.graphsData[id], {
            xPercent: dir,
            ease: 'linear',
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
        this.setActiveView(0);
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

},{"../Site":11,"./Component":14}],23:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0NoYXJ0LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ29tcG9uZW50LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRGFzaGJvYXJkLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRHJvcGRvd24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9GaWx0ZXJzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvTWFzb25yeS50cyIsInNyYy90cy9jb21wb25lbnRzL1BhcmFsbGF4LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUmFuZ2UudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TbGlkZXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TdGF0cy50cyIsInNyYy90cy9jb21wb25lbnRzL1N3aXBlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsT0FB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QWEsQ0FBQyxDQUFDO0lBQzdDLENBQUM7SUFRTyxNQUFNO1FBSVYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUUsQ0FBQztRQUM3RSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQ2xHLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQztRQUN4QyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBRSxDQUFDO1FBQ3JELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFFLENBQUM7UUFDMUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztR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QkFBNkIsRUFBRSxhQUFhLENBQUMsQ0FBQzthQUNyRTtTQUNKO0lBQ0wsQ0FBQztJQVNPLE9BQU8sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFJO1FBQy9CLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQyxJQUFJLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFVBQVUsRUFBRTtnQkFDckMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDL0Q7U0FDSjtJQUVMLENBQUM7Q0FDSjtBQWhORCxvQkFnTkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyAvIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IGRlYnVnIH0gZnJvbSAnLi9TaXRlJztcblxuXG5cbmRlY2xhcmUgdmFyICRib2R5O1xuXG5leHBvcnQgaW50ZXJmYWNlIElBcGlEYXRhIHtcbiAgICB1cmw6IHN0cmluZztcbiAgICBiZWZvcmVDYWxsPzogc3RyaW5nO1xuICAgIGNhbGxiYWNrPzogc3RyaW5nO1xuICAgIGZvcm0/OiBhbnk7XG4gICAgcGFyYW1zPzogYW55O1xuICAgIGxpa2U/OiBib29sZWFuO1xuICAgIGFjdGlvbj86ICdQT1NUJyB8ICdERUxFVEUnIHwgJ0dFVCcgfCAnUFVUJyB8ICdQQVRDSCc7XG59XG5cblxuZXhwb3J0IGNsYXNzIEFQSSB7XG5cblxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgYmVmb3JlQ2FsbHMgPSB7XG5cbiAgICAgICAgbG9naW46IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICAgICAgaWYgKCEkYm9keS5oYXNDbGFzcygnaXMtbG9nZ2VkJykpIHtcbiAgICAgICAgICAgICAgICAkKCcuanMtbG9naW4nKS5sYXN0KCkudHJpZ2dlcignY2xpY2snKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuXG4gICAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgICAgIGxldCBwYXNzZWQgPSB0cnVlO1xuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgIGxldCAkZm9ybSA9ICRlbC5pcygnZm9ybScpID8gJGVsIDogJGVsLmNsb3Nlc3QoJ2Zvcm0nKTtcbiAgICAgICAgICAgIGxldCAkdmFsaWRhdGlvbkVsZW0gPSAkZm9ybTtcbiAgICAgICAgICAgIGxldCBzdGVwVmFsaWRhdGlvbjtcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcbiAgICAgICAgICAgIGlmICgkZm9ybS5oYXNDbGFzcygnaXMtZG9uZScpKSB7XG4gICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ2lzLWRvbmUnKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmICggISFkYXRhLnBhcmFtcyApIHtcbiAgICAgICAgICAgIC8vICAgICBpZiAoZGF0YS5wYXJhbXMudmFsaWRhdGVPbmUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gICAgICAgICBzdGVwVmFsaWRhdGlvbiA9ICBkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZTtcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBzdGVwVmFsaWRhdGlvbiA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gICAgIH1cblxuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy5zY3JvbGxUbyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHNjcm9sbFRvID0gIGRhdGEucGFyYW1zLnNjcm9sbFRvO1xuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHNjcm9sbFRvID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XG5cbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdbcmVxdWlyZWRdOmlucHV0JykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubm9kZU5hbWUgPT09ICdJTlBVVCcgKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICgoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdlbWFpbCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlID0gL14oKFtePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSsoXFwuW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpJC87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmUudGVzdCh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSBVdGlscy50cmFuc2xhdGlvbnNbdmFsdWUubGVuZ3RoID4gMCA/ICdpbnZhbGlkLWVtYWlsJyA6ICdyZXF1aXJlZC1maWVsZCddWydlbiddO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQoaW5wdXQpLmhhc0NsYXNzKCdqcy1wb3N0YWwnKSkge21lc3NhZ2UgPSBVdGlscy50cmFuc2xhdGlvbnNbJ2ludmFsaWQtemlwJ11bJ2VuJ119XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdwaG9uZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbFRlbCA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsVGVsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnaW5wdXRbbmFtZT16aXBjb2RlXScpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MVGV4dEFyZWFFbGVtZW50KS52YWx1ZTtcblxuICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoJChpbnB1dCkuaGFzQ2xhc3MoJ2pzLXBvc3RhbCcpICYmIHZhbC5sZW5ndGggIT0gNSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ2ludmFsaWQtemlwJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuICAgIFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBpZiAoISFwYXNzZWQpIHtcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRmb3JtKTtcbiAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVDbGFzcygnaGFzLWVycm9ycycpO1xuICAgICAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGZvcm0uYWRkQ2xhc3MoJ2hhcy1lcnJvcnMnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgY2FsbGJhY2tzID0ge1xuXG4gICAgICAgIG9uQ29va2llc0Nsb3NlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCB7XG4gICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWhpZGRlbicpO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9uU3Vic2NyaWJlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnb25TdWJzY3JpYmUnKTtcbiAgICAgICAgICAgIGxldCAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xuXG4gICAgICAgICAgICAvLyBpZiAoZGF0YS5zY3JvbGxUbyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSAgZGF0YS5zY3JvbGxUbztcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIH1cblxuXG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG5cbiAgICAgICAgICAgIGlmICghJG1lc3NhZ2VbMF0pIHtcbiAgICAgICAgICAgICAgICAkZWwuYXBwZW5kKCc8ZGl2IGNsYXNzPVwianMtbWVzc2FnZSBtZXNzYWdlXCI+Jyk7XG4gICAgICAgICAgICAgICAgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbGV0IGh0bWwgPSAkKCc8cD4nICsgcmVzcG9uc2UubWVzc2FnZSArICc8L3A+Jyk7XG5cbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpLmFwcGVuZChodG1sKTtcblxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnJlc3VsdCkge1xuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtY29tcGxldGVkJyk7XG4gICAgICAgICAgICAgICAgJGVsLnBhcmVudCgpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XG4gICAgICAgICAgICAgICAgJGVsLmNsb3Nlc3QoJy5qb2luJykuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcblxuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dCcpLnZhbCgnJyk7XG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0OmNoZWNrZWQnKS5yZW1vdmVBdHRyKCdjaGVja2VkJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsWzBdLmhhc0F0dHJpYnV0ZSgnZGF0YS1yZWRpcmVjdCcpKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKCcvJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAvLyAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCRtZXNzYWdlLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dCcpLnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgfSxcblxuICAgIH07XG5cblxuXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IGFueSk6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKHR5cGVvZiB0YXJnZXQgIT09ICd1bmRlZmluZWQnID8gdGFyZ2V0IDogJ2JvZHknKTtcblxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ1tkYXRhLWFwaV0nKS5ub3QoJ2Zvcm0nKS5vZmYoJy5hcGknKS5vbignY2xpY2suYXBpJywgQVBJLm9uQWN0aW9uKTtcbiAgICAgICAgJHRhcmdldC5maW5kKCdmb3JtW2RhdGEtYXBpXScpLm9mZignLmFwaScpLm9uKCdzdWJtaXQuYXBpJywgQVBJLm9uQWN0aW9uKS5hdHRyKCdub3ZhbGlkYXRlJywgJ25vdmFsaWRhdGUnKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHN0YXRpYyBjYWxsSXQoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCBjdXN0b21DYWxsYmFjaz86IEZ1bmN0aW9uKTogIFByb21pc2U8YW55PiB7XG4gICAgICAgIFxuICAgICAgICBkYXRhID0gQVBJLnByZXByb2Nlc3NEYXRhKGRhdGEsICRlbCk7XG5cbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XG5cbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5hY3Rpb24gfHwgJ1BPU1QnO1xuICAgICAgICBkZWxldGUgZGF0YS5hY3Rpb247XG5cbiAgICAgICAgY29uc3QgdXJsID0gZGF0YS51cmwgfHwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICBkZWxldGUgZGF0YS51cmw7XG5cbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdHlwZTogYWN0aW9uLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXG4gICAgICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZG9uZSgocmVzcG9uc2UpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICBBUEkub25TdWNjZXNzKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XG5cbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmFpbCgoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignQVBJIGVycm9yOiAnICsgZSwgZGF0YSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoISFkZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbUNhbGxiYWNrICYmIHR5cGVvZiBjdXN0b21DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuYWx3YXlzKCgpID0+IHtcbiAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0pO1xuXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgcHJlcHJvY2Vzc0RhdGEoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogSUFwaURhdGEge1xuXG4gICAgICAgIC8vIGdldCBkYXRhIGlmIGFwaSBjYWxsZWQgb24gZm9ybSBlbGVtZW50OlxuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdhY3Rpb24nKSA/ICRlbC5hdHRyKCdhY3Rpb24nKSA6IGRhdGEudXJsO1xuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsICRlbC5maW5kKCc6aW5wdXQnKS5zZXJpYWxpemVPYmplY3QoKSk7XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIGZvcm0nLCBkYXRhLCBkYXRhLnBhcmFtcyxkYXRhLmZvcm0sICRlbC5maW5kKCc6aW5wdXQnKSk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHVwZGF0ZSBkYXRhIGlmIGFwaSBjYWxsZWQgb24gbGluayBlbGVtZW50OlxuICAgICAgICBpZiAoJGVsLmlzKCdbaHJlZl0nKSkge1xuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2hyZWYnKSA/ICRlbC5hdHRyKCdocmVmJykgOiBkYXRhLnVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGdldCBhZGRpdGlvbmFsIGRhdGEgZnJvbSBleHRlcm5hbCBmb3JtOlxuICAgICAgICBpZiAoZGF0YS5mb3JtICYmICQoZGF0YS5mb3JtIGFzIHN0cmluZylbMF0pIHtcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCAkKGRhdGEuZm9ybSBhcyBzdHJpbmcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLmZvcm07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBmbGF0dGVuOlxuICAgICAgICBpZiAoZGF0YS5wYXJhbXMpIHtcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCBkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBkZWxldGUgZGF0YS5wYXJhbXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ2RhdGEgcHJlJywgZGF0YSwgZGF0YS5wYXJhbXMpO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBvbkFjdGlvbiA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgbGV0ICRlbCA9ICQoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50KTtcbiAgICAgICAgY29uc3QgZGF0YTogSUFwaURhdGEgPSB7Li4uJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2FwaScpfTtcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSwgJ2RhdGEnKTtcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLXN1Ym1pdHRlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJGVsLmNsb3Nlc3QoJ2Zvcm0nKS5hZGRDbGFzcygnaXMtc3VibWl0dGVkJyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBiZWZvcmVDYWxsIGhhbmRsZXI6XG4gICAgICAgIGlmIChkYXRhLmJlZm9yZUNhbGwpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmJlZm9yZUNhbGwgaW4gQVBJLmJlZm9yZUNhbGxzKSB7XG4gICAgICAgICAgICAgICAgQVBJLmJlZm9yZUNhbGxzW2RhdGEuYmVmb3JlQ2FsbF0oZGF0YSwgJGVsKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIHN0YXRpYyBvblN1Y2Nlc3MgPSAoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjayBpbiBBUEkuY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAgICAgQVBJLmNhbGxiYWNrc1tkYXRhLmNhbGxiYWNrXShkYXRhLCAkZWwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59IiwiZXhwb3J0IGludGVyZmFjZSBJQnJlYWtwb2ludCB7XG4gICAgZGVza3RvcDogYm9vbGVhbjtcbiAgICB0YWJsZXQ6IGJvb2xlYW47XG4gICAgcGhvbmU6IGJvb2xlYW47XG4gICAgdmFsdWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGxldCBicmVha3BvaW50OiBJQnJlYWtwb2ludDtcblxuZXhwb3J0IGNsYXNzIEJyZWFrcG9pbnQge1xuXG4gICAgcHVibGljIHN0YXRpYyB1cGRhdGUoKTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgY3NzQmVmb3JlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLCAnOmJlZm9yZScpO1xuICAgICAgICBjb25zdCBjc3NCZWZvcmVWYWx1ZSA9IGNzc0JlZm9yZS5nZXRQcm9wZXJ0eVZhbHVlKCdjb250ZW50JykucmVwbGFjZSgvW1xcXCJcXCddL2csICcnKTtcblxuICAgICAgICBicmVha3BvaW50ID0ge1xuICAgICAgICAgICAgZGVza3RvcDogY3NzQmVmb3JlVmFsdWUgPT09ICdkZXNrdG9wJyxcbiAgICAgICAgICAgIHBob25lOiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ3Bob25lJyxcbiAgICAgICAgICAgIHRhYmxldDogY3NzQmVmb3JlVmFsdWUgPT09ICd0YWJsZXQnLFxuICAgICAgICAgICAgdmFsdWU6IGNzc0JlZm9yZVZhbHVlLFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQlA6XCIsIGJyZWFrcG9pbnQudmFsdWUpO1xuICAgIH1cbn1cbiIsImV4cG9ydCBsZXQgYnJvd3NlcjogSUJyb3dzZXI7XG5kZWNsYXJlIGxldCBvcHI7XG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1hbnkgaW50ZXJmYWNlLW5hbWVcbmludGVyZmFjZSBXaW5kb3cge1xuICAgIG9wcjogYW55O1xuICAgIG9wZXJhOiBhbnk7XG4gICAgc2FmYXJpOiBhbnk7XG4gICAgSFRNTEVsZW1lbnQ6IGFueTtcbn1cbi8vIHRzbGludDplbmFibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXG5cblxuZXhwb3J0IGludGVyZmFjZSBJQnJvd3NlciB7XG4gICAgbW9iaWxlPzogYm9vbGVhbjtcbiAgICB3aW5kb3dzPzogYm9vbGVhbjtcbiAgICBtYWM/OiBib29sZWFuO1xuICAgIGllPzogYm9vbGVhbjtcbiAgICBpb3M/OiBib29sZWFuO1xuICAgIG9wZXJhPzogYm9vbGVhbjtcbiAgICBmaXJlZm94PzogYm9vbGVhbjtcbiAgICBzYWZhcmk/OiBib29sZWFuO1xuICAgIGNocm9tZT86IGJvb2xlYW47XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEJyb3dzZXIoKTogSUJyb3dzZXIge1xuICAgIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XG4gICAgYnJvd3NlciA9IHtcbiAgICAgICAgbW9iaWxlOiAoLyhhbmRyb2lkfGJiXFxkK3xtZWVnbykuK21vYmlsZXxhdmFudGdvfGJhZGFcXC98YmxhY2tiZXJyeXxibGF6ZXJ8Y29tcGFsfGVsYWluZXxmZW5uZWN8aGlwdG9wfGllbW9iaWxlfGlwKGhvbmV8b2QpfGlwYWR8aXJpc3xraW5kbGV8QW5kcm9pZHxTaWxrfGxnZSB8bWFlbW98bWlkcHxtbXB8bmV0ZnJvbnR8b3BlcmEgbShvYnxpbilpfHBhbG0oIG9zKT98cGhvbmV8cChpeGl8cmUpXFwvfHBsdWNrZXJ8cG9ja2V0fHBzcHxzZXJpZXMoNHw2KTB8c3ltYmlhbnx0cmVvfHVwXFwuKGJyb3dzZXJ8bGluayl8dm9kYWZvbmV8d2FwfHdpbmRvd3MgKGNlfHBob25lKXx4ZGF8eGlpbm8vaS50ZXN0KHVhKSB8fCAvMTIwN3w2MzEwfDY1OTB8M2dzb3w0dGhwfDUwWzEtNl1pfDc3MHN8ODAyc3xhIHdhfGFiYWN8YWMoZXJ8b298c1xcLSl8YWkoa298cm4pfGFsKGF2fGNhfGNvKXxhbW9pfGFuKGV4fG55fHl3KXxhcHR1fGFyKGNofGdvKXxhcyh0ZXx1cyl8YXR0d3xhdShkaXxcXC1tfHIgfHMgKXxhdmFufGJlKGNrfGxsfG5xKXxiaShsYnxyZCl8YmwoYWN8YXopfGJyKGV8dil3fGJ1bWJ8YndcXC0obnx1KXxjNTVcXC98Y2FwaXxjY3dhfGNkbVxcLXxjZWxsfGNodG18Y2xkY3xjbWRcXC18Y28obXB8bmQpfGNyYXd8ZGEoaXR8bGx8bmcpfGRidGV8ZGNcXC1zfGRldml8ZGljYXxkbW9ifGRvKGN8cClvfGRzKDEyfFxcLWQpfGVsKDQ5fGFpKXxlbShsMnx1bCl8ZXIoaWN8azApfGVzbDh8ZXooWzQtN10wfG9zfHdhfHplKXxmZXRjfGZseShcXC18Xyl8ZzEgdXxnNTYwfGdlbmV8Z2ZcXC01fGdcXC1tb3xnbyhcXC53fG9kKXxncihhZHx1bil8aGFpZXxoY2l0fGhkXFwtKG18cHx0KXxoZWlcXC18aGkocHR8dGEpfGhwKCBpfGlwKXxoc1xcLWN8aHQoYyhcXC18IHxffGF8Z3xwfHN8dCl8dHApfGh1KGF3fHRjKXxpXFwtKDIwfGdvfG1hKXxpMjMwfGlhYyggfFxcLXxcXC8pfGlicm98aWRlYXxpZzAxfGlrb218aW0xa3xpbm5vfGlwYXF8aXJpc3xqYSh0fHYpYXxqYnJvfGplbXV8amlnc3xrZGRpfGtlaml8a2d0KCB8XFwvKXxrbG9ufGtwdCB8a3djXFwtfGt5byhjfGspfGxlKG5vfHhpKXxsZyggZ3xcXC8oa3xsfHUpfDUwfDU0fFxcLVthLXddKXxsaWJ3fGx5bnh8bTFcXC13fG0zZ2F8bTUwXFwvfG1hKHRlfHVpfHhvKXxtYygwMXwyMXxjYSl8bVxcLWNyfG1lKHJjfHJpKXxtaShvOHxvYXx0cyl8bW1lZnxtbygwMXwwMnxiaXxkZXxkb3x0KFxcLXwgfG98dil8enopfG10KDUwfHAxfHYgKXxtd2JwfG15d2F8bjEwWzAtMl18bjIwWzItM118bjMwKDB8Mil8bjUwKDB8Mnw1KXxuNygwKDB8MSl8MTApfG5lKChjfG0pXFwtfG9ufHRmfHdmfHdnfHd0KXxub2soNnxpKXxuenBofG8yaW18b3AodGl8d3YpfG9yYW58b3dnMXxwODAwfHBhbihhfGR8dCl8cGR4Z3xwZygxM3xcXC0oWzEtOF18YykpfHBoaWx8cGlyZXxwbChheXx1Yyl8cG5cXC0yfHBvKGNrfHJ0fHNlKXxwcm94fHBzaW98cHRcXC1nfHFhXFwtYXxxYygwN3wxMnwyMXwzMnw2MHxcXC1bMi03XXxpXFwtKXxxdGVrfHIzODB8cjYwMHxyYWtzfHJpbTl8cm8odmV8em8pfHM1NVxcL3xzYShnZXxtYXxtbXxtc3xueXx2YSl8c2MoMDF8aFxcLXxvb3xwXFwtKXxzZGtcXC98c2UoYyhcXC18MHwxKXw0N3xtY3xuZHxyaSl8c2doXFwtfHNoYXJ8c2llKFxcLXxtKXxza1xcLTB8c2woNDV8aWQpfHNtKGFsfGFyfGIzfGl0fHQ1KXxzbyhmdHxueSl8c3AoMDF8aFxcLXx2XFwtfHYgKXxzeSgwMXxtYil8dDIoMTh8NTApfHQ2KDAwfDEwfDE4KXx0YShndHxsayl8dGNsXFwtfHRkZ1xcLXx0ZWwoaXxtKXx0aW1cXC18dFxcLW1vfHRvKHBsfHNoKXx0cyg3MHxtXFwtfG0zfG01KXx0eFxcLTl8dXAoXFwuYnxnMXxzaSl8dXRzdHx2NDAwfHY3NTB8dmVyaXx2aShyZ3x0ZSl8dmsoNDB8NVswLTNdfFxcLXYpfHZtNDB8dm9kYXx2dWxjfHZ4KDUyfDUzfDYwfDYxfDcwfDgwfDgxfDgzfDg1fDk4KXx3M2MoXFwtfCApfHdlYmN8d2hpdHx3aShnIHxuY3xudyl8d21sYnx3b251fHg3MDB8eWFzXFwtfHlvdXJ8emV0b3x6dGVcXC0vaS50ZXN0KHVhLnN1YnN0cigwLCA0KSkpID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICBpb3M6IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KHVhKSxcbiAgICAgICAgbWFjOiBuYXZpZ2F0b3IucGxhdGZvcm0udG9VcHBlckNhc2UoKS5pbmRleE9mKCdNQUMnKSA+PSAwLFxuICAgICAgICBpZTogdWEuaW5kZXhPZignTVNJRSAnKSA+IDAgfHwgISF1YS5tYXRjaCgvVHJpZGVudC4qcnZcXDoxMVxcLi8pLFxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWFueVxuICAgICAgICBvcGVyYTogKCEhKHdpbmRvdyBhcyBhbnkpLm9wciAmJiAhIW9wci5hZGRvbnMpIHx8ICEhKHdpbmRvdyBhcyBhbnkpLm9wZXJhIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignIE9QUi8nKSA+PSAwLFxuICAgICAgICBmaXJlZm94OiB1YS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxuICAgICAgICBzYWZhcmk6IC9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QodWEpLFxuICAgICAgICB3aW5kb3dzOiB3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignd2luJykgPiAtMSxcbiAgICB9O1xuXG4gICAgJCgnaHRtbCcpXG4gICAgICAgIC50b2dnbGVDbGFzcygnbWFjJywgIWJyb3dzZXIud2luZG93cyAmJiAoYnJvd3Nlci5pb3MgfHwgYnJvd3Nlci5tYWMpKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ3dpbmRvd3MnLCBicm93c2VyLndpbmRvd3MgJiYgIWJyb3dzZXIubWFjICYmICFicm93c2VyLmlvcylcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtb2JpbGUnLCBicm93c2VyLm1vYmlsZSlcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdmaXJlZm94JywgYnJvd3Nlci5maXJlZm94KVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ3NhZmFyaScsIGJyb3dzZXIuc2FmYXJpKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2llJywgYnJvd3Nlci5pZSk7XG5cbiAgICByZXR1cm4gYnJvd3Nlcjtcbn1cblxuXG5leHBvcnQgY2xhc3MgQnJvd3NlciB7XG4gICAgcHVibGljIHN0YXRpYyB1cGRhdGUoKTogdm9pZCB7XG4gICAgICAgIGJyb3dzZXIgPSBnZXRCcm93c2VyKCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgU2xpZGVyIH0gZnJvbSAnLi9jb21wb25lbnRzL1NsaWRlcic7XG5pbXBvcnQgeyBUb29sdGlwIH0gZnJvbSAnLi9jb21wb25lbnRzL1Rvb2x0aXAnO1xuaW1wb3J0IHsgRHJvcGRvd24gfSBmcm9tICcuL2NvbXBvbmVudHMvRHJvcGRvd24nO1xuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vY29tcG9uZW50cy9GaWx0ZXJzJztcbmltcG9ydCB7IERhc2hib2FyZCB9IGZyb20gJy4vY29tcG9uZW50cy9EYXNoYm9hcmQnO1xuaW1wb3J0IHsgU3RhdHMgfSBmcm9tICcuL2NvbXBvbmVudHMvU3RhdHMnO1xuaW1wb3J0IHsgTWFzb25yeSB9IGZyb20gJy4vY29tcG9uZW50cy9NYXNvbnJ5JztcbmltcG9ydCB7IFJhbmdlIH0gZnJvbSAnLi9jb21wb25lbnRzL1JhbmdlJztcbmltcG9ydCB7IENoYXJ0IH0gZnJvbSAnLi9jb21wb25lbnRzL0NoYXJ0JztcbmltcG9ydCB7IEFzaWRlIH0gZnJvbSAnLi9jb21wb25lbnRzL0FzaWRlJztcbmltcG9ydCB7IFBhcmFsbGF4IH0gZnJvbSAnLi9jb21wb25lbnRzL1BhcmFsbGF4JztcblxuaW1wb3J0IHsgUGFnZSB9IGZyb20gJy4vcGFnZXMvUGFnZSc7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgIFNsaWRlcixcbiAgICBUb29sdGlwLFxuICAgIERyb3Bkb3duLFxuICAgIEZpbHRlcnMsXG4gICAgRGFzaGJvYXJkLFxuICAgIFN0YXRzLFxuICAgIE1hc29ucnksXG4gICAgUmFuZ2UsXG4gICAgQ2hhcnQsXG4gICAgUGFyYWxsYXhcbn07XG5cblxuZXhwb3J0IGNvbnN0IHBhZ2VzID0ge1xuICAgIFBhZ2Vcbn07XG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2NsaXBib2FyZC5kLnRzXCIgLz5cblxuXG5cbmV4cG9ydCBjbGFzcyBDb3B5IHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgJCgnW2RhdGEtY29weV0nKS5vbignY2xpY2snLCAoZSk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICAgICAgY29uc3QgdXJsID0gd2luZG93LmxvY2F0aW9uLm9yaWdpbiArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICAgICAgKHdpbmRvdy5DbGlwYm9hcmQgYXMgYW55KS5jb3B5KHVybCk7XG4gICAgICAgICAgICB3aW5kb3cuY29uc29sZS5pbmZvKCdcIiVzXCIgY29waWVkJywgdXJsKTtcblxuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1jb3BpZWQnKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWNvcGllZCcpOyB9LCAxMDAwKTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhbmRsZXIge1xuXG5cbiAgICBwcml2YXRlIGV2ZW50czogeyBba2V5OiBzdHJpbmddOiBGdW5jdGlvbltdIH07XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBBdHRhY2ggYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm4ge0hhbmRsZXJ9ICAgICAgICAgICAgcmV0dXJucyBjdXJyZW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyBvbihldmVudE5hbWU6IHN0cmluZywgaGFuZGxlcjogRnVuY3Rpb24pOiBIYW5kbGVyIHtcblxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogRGV0YWNoIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBoYW5kbGVyICAgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtIYW5kbGVyfSAgICAgICAgICAgIHJldHVybnMgY3VycmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwdWJsaWMgb2ZmKGV2ZW50TmFtZT86IHN0cmluZywgaGFuZGxlcj86IEZ1bmN0aW9uKTogSGFuZGxlciB7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGhhbmRsZXIgPT09ICd1bmRlZmluZWQnICYmIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0pIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmV2ZW50c1tldmVudE5hbWVdLmluZGV4T2YoaGFuZGxlcik7XG5cbiAgICAgICAgaWYgKCBpbmRleCA+IC0xICkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIENhbGwgYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lXG4gICAgICogQHBhcmFtIHtbdHlwZV19IC4uLmV4dHJhUGFyYW1ldGVycyBwYXNzIGFueSBwYXJhbWV0ZXJzIHRvIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICovXG4gICAgcHVibGljIHRyaWdnZXIoZXZlbnROYW1lOiBzdHJpbmcsIC4uLmV4dHJhUGFyYW1ldGVycyk6IHZvaWQge1xuXG4gICAgICAgIGlmICggIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLmZvckVhY2goZXZlbnQgPT4gZXZlbnQuYXBwbHkodGhpcywgW10uc2xpY2UuY2FsbChhcmdzLCAxKSkpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcbiAgICB9XG59XG5cbiIsImV4cG9ydCBjbGFzcyBMb2FkZXIge1xuXG4gICAgcHJpdmF0ZSBwcm9ncmVzczogbnVtYmVyO1xuICAgIHByaXZhdGUgd2lkdGg6IG51bWJlcjtcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5KSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aW5kb3cuaW5uZXJXaWR0aDtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IDA7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzaG93KCk6IHZvaWQge1xuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyB5OiAwLCBkdXJhdGlvbjogMC4yIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgaGlkZSgpOiB2b2lkIHtcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3dpZHRoJ10pO1xuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyBkdXJhdGlvbjogMC41LCB5OiAxMCwgd2lkdGg6IHRoaXMud2lkdGggfHwgJzEwMCUnIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgc2V0KHByb2dyZXNzOiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd5J10pO1xuXG4gICAgICAgIGxldCB3aWR0aCA9IHRoaXMud2lkdGggKiBwcm9ncmVzcztcblxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IGR1cmF0aW9uOiAwLjMsIHdpZHRoOiB3aWR0aCB9KTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdkdDtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi9IYW5kbGVyJztcbmltcG9ydCB7IFNjcm9sbCB9IGZyb20gJy4vU2Nyb2xsJztcbmltcG9ydCB7ICRib2R5LCAkYXJ0aWNsZSwgJHBhZ2VIZWFkZXIgfSBmcm9tICcuL1NpdGUnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XG5cbi8vIGltcG9ydCB7IFNpZ251cCB9IGZyb20gJy4vU2lnbnVwJztcblxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXG5cblxuXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlc0V2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgUFJPR1JFU1MgPSAncHJvZ3Jlc3MnO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBQdXNoU3RhdGVzO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVElNRV9MSU1JVCA9IDUwMDA7XG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgbG9hZGVkRGF0YTogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XG4gICAgcHJpdmF0ZSB0aW1lb3V0O1xuXG5cblxuICAgIC8qKiBjaGFuZ2UgZG9jdW1lbnQgdGl0bGUgKi9cbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGUgfHwgJCgnI21haW4gPiBbZGF0YS10aXRsZV0nKS5kYXRhKCd0aXRsZScpO1xuICAgIH1cblxuXG5cbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdvVG8obG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXG4gICAgICAgICAgICBpc0RpZmZlcmVudCA9IHBhdGhuYW1lICE9PSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XG4gICAgICAgICAgICBpZiAoISFyZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0RpZmZlcmVudDtcbiAgICB9XG5cblxuXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXG4gICAgcHVibGljIHN0YXRpYyBjaGFuZ2VQYXRoKGxvY2F0aW9uOiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuLCB0aXRsZT86IHN0cmluZyk6IHZvaWQge1xuXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xuICAgICAgICBsZXQgY2hhbmdlZCA9IFB1c2hTdGF0ZXMuZ29Ubyhsb2NhdGlvbiwgcmVwbGFjZSB8fCB0cnVlKTtcbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmICghIWNoYW5nZWQpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUodGl0bGUgfHwgZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzIHRvIGJlIHVzZWQgd2l0aCBQdXNoU3RhdGVzIC8gSGlzdG9yeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmICghZWxlbWVudEl0c2VsZikge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGlua3ModGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmsodGFyZ2V0IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGdvIGJhY2sgaW4gYnJvd3NlciBoaXN0b3J5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBiYWNrKHVybD86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5iYWNrKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodXJsKSB7XG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCAnLycpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgcmVsb2FkKCk6IHZvaWQge1xuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcblxuICAgICAgICBpZiAoISRwYWdlSGVhZGVyKSB7XG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XG4gICAgICAgICAgICAkYm9keS5hZGRDbGFzcygnbmF2YmFyLWFsd2F5cy1zaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZVRvZ2dsZSA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGxldCBlbCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcblxuICAgICAgICBlbC50b2dnbGVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtYXNpZGUtb3BlbicpO1xuXG4gICAgICAgIGlmIChlbC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyd3aWxsLWNoYW5nZSc6ICd0cmFuc2Zvcm0nfSk7XG4gICAgICAgICAgICAvLyBmaXhlZHBvc2l0aW9uID0gU2Nyb2xsLnNjcm9sbFRvcDtcbiAgICAgICAgICAgIFV0aWxzLmRpc2FibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsgY2xlYXJQcm9wczogJ3dpbGwtY2hhbmdlJ30pO1xuICAgICAgICAgICAgVXRpbHMuZW5hYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoSGlzdG9yeWpzKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xuICAgICAgICAgICAgSGlzdG9yeWpzLkFkYXB0ZXIuYmluZCh3aW5kb3csICdzdGF0ZWNoYW5nZScsIHRoaXMub25TdGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlID0gdGhpcztcblxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG4gICAgfVxuXG5cblxuXG4gICAgLyoqXG4gICAgICogbG9hZCBuZXcgY29udGVudCB2aWEgYWpheCBiYXNlZCBvbiBjdXJyZW50IGxvY2F0aW9uOlxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHByb21pc2UgcmVzb2x2ZWQgd2hlbiBYTUxIdHRwUmVxdWVzdCBpcyBmaW5pc2hlZFxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdCkge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LmFib3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZpbmUgdXJsXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgY29uc3Qgc2VhcmNoOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoIHx8ICcnO1xuICAgICAgICBjb25zdCB1cmwgPSBwYXRoICsgc2VhcmNoO1xuXG4gICAgICAgIC8vIGRlZmluZSB0aW1lb3V0XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBQdXNoU3RhdGVzLlRJTUVfTElNSVQpO1xuXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXG4gICAgICAgIC8vIGFuZCBkbyB0aGUgcmVxdWVzdDpcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gZG8gdGhlIHVzdWFsIHhociBzdHVmZjpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xuXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vbmxvYWQgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkZWREYXRhID0gdGhpcy5yZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChFcnJvcih0aGlzLnJlcXVlc3Quc3RhdHVzVGV4dCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3Quc3RhdHVzVGV4dCAhPT0gJ2Fib3J0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBjYXRjaGluZyBlcnJvcnM6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBjYXRjaCBwcm9ncmVzc1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIGUubG9hZGVkIC8gZS50b3RhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnNlbmQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBmdW5jdGlvbiBjYWxsZWQgb24gc3VjY2Vzc2Z1bCBkYXRhIGxvYWQgKi9cbiAgICBwdWJsaWMgcmVuZGVyKCk6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IGRhdGE6IHN0cmluZyA9IHRoaXMubG9hZGVkRGF0YS50cmltKCk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcnM6IGFueSA9ICQoJy5qcy1yZXBsYWNlW2lkXSwgI21haW4nKS50b0FycmF5KCk7XG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcblxuICAgICAgICAvLyByZW5kZXIgZWFjaCBvZiBjb250YWluZXJzXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxuICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb250YWluZXJzLmZvckVhY2goKGNvbnRhaW5lciwgaW5kZXgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZS10cnkgcmVuZGVyaW5nIGlmIG5vbmUgb2YgY29udGFpbmVycyB3ZXJlIHJlbmRlcmVkOlxuICAgICAgICBpZiAocmVuZGVyZWRDb3VudCA9PT0gMCAmJiBjb250YWluZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcblxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcbiAgICAgICAgd2luZG93LmRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdhamF4X2xvYWRlZCcpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGxldCBjb2RlOiBzdHJpbmcgPSBudWxsO1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcblxuICAgICAgICBpZiAoISFmb3JjZVBsYWluICYmIGRhdGEuaW5kZXhPZignPGFydGljbGUnKSA9PT0gMCAmJiBlbC5pZCA9PT0gJ2FydGljbGUtbWFpbicpIHtcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgJGxvYWRlZENvbnRlbnQ6IEpRdWVyeSA9ICQoJChkYXRhKS5maW5kKGNvbnRhaW5lcilbMF0gfHwgJChkYXRhKS5maWx0ZXIoY29udGFpbmVyKVswXSk7XG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgJChjb250YWluZXIpXG4gICAgICAgICAgICAuaGlkZSgpXG4gICAgICAgICAgICAuZW1wdHkoKVxuICAgICAgICAgICAgLmh0bWwoY29kZSB8fCBkYXRhKVxuICAgICAgICAgICAgLnNob3coKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgKi9cbiAgICBwcml2YXRlIGJpbmRMaW5rKHRhcmdldDogRWxlbWVudCk6IHZvaWQge1xuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgKi9cbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcblxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwgJ2JvZHknO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWhpc3Rvcnk9XCJmYWxzZVwiXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcbiAgICAgICAgICAgIC5ub3QoJ1tkb3dubG9hZF0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtbW9kYWxdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWYkPVwiLmpwZ1wiXScpXG4gICAgICAgICAgICAubm90KCdbdGFyZ2V0PVwiX2JsYW5rXCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWZePVwidGVsOlwiXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1wb2N6dGFdJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1sYW5nXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1zY3JvbGwtdG9dJylcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiaHR0cFwiXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5JylcbiAgICAgICAgICAgIC5vbignY2xpY2suaGlzdG9yeScsIHRoaXMub25IYXNoQ2xpY2spO1xuXG5cbiAgICAgICAgJCgnW2RhdGEtaGFtYnVyZ2VyXScpLm9uKCdjbGljaycsIFB1c2hTdGF0ZXMuYXNpZGVUb2dnbGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25MYW5ndWFnZUNsaWNrID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBjb25zdCBsYW5nID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgYWx0ZXJuYXRlID0gJCgnW2RhdGEtYWx0ZXJuYXRlXScpLmRhdGEoJ2FsdGVybmF0ZScpO1xuICAgICAgICBjb25zdCBhcnRpY2xlVVJMID0gYWx0ZXJuYXRlID8gYWx0ZXJuYXRlW2xhbmcgfHwgT2JqZWN0LmtleXMoYWx0ZXJuYXRlKVswXV0gOiBudWxsO1xuICAgICAgICBjb25zdCBoZWFkTGluayA9ICQoJ2xpbmtbcmVsPVwiYWx0ZXJuYXRlXCJdW2hyZWZsYW5nXScpWzBdIGFzIEhUTUxMaW5rRWxlbWVudDtcbiAgICAgICAgY29uc3QgaGVhZFVSTCA9IGhlYWRMaW5rID8gaGVhZExpbmsuaHJlZiA6IG51bGw7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oYXJ0aWNsZVVSTCB8fCBoZWFkVVJMIHx8IGUuY3VycmVudFRhcmdldC5ocmVmKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGxpbmtzIGNsaWNrIGhhbmRsZXIgKi9cbiAgICBwcml2YXRlIG9uQ2xpY2sgPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgbGV0ICRzZWxmOiBKUXVlcnkgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCksXG4gICAgICAgICAgICBzdGF0ZTogc3RyaW5nID0gJHNlbGYuYXR0cignaHJlZicpLnJlcGxhY2UoJ2h0dHA6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3QsICcnKSxcbiAgICAgICAgICAgIHR5cGU6IHN0cmluZyA9ICRzZWxmLmF0dHIoJ2RhdGEtaGlzdG9yeScpO1xuXG4gICAgICAgIGlmICh0eXBlID09PSAnYmFjaycpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuYmFjayhzdGF0ZSk7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3JlcGxhY2UnKSB7XG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgU2Nyb2xsLnJlc2V0U2Nyb2xsQ2FjaGUoc3RhdGUpO1xuICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKiogb24gaGFzaC1saW5rIGNsaWNrIGhhbmRsZXIgKi9cbiAgICBwcml2YXRlIG9uSGFzaENsaWNrID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBjb25zb2xlLmxvZygnY2xpY2sgbGluaycpO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIEhpc3RvcnlqcyBgc3RhdGVjaGFuZ2VgIGV2ZW50IGhhbmRsZXIgKi9cbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcbiAgICAgICAgUHVzaFN0YXRlcy5zZXROYXZiYXJWaXNpYmlsaXR5KCk7XG4gICAgICAgIGlmICghUHVzaFN0YXRlcy5ub0NoYW5nZSkge1xuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKiogbWFyayBsaW5rcyBhcyBhY3RpdmUgKi9cbiAgICBwcml2YXRlIHNldEFjdGl2ZUxpbmtzKCk6IHZvaWQge1xuICAgICAgICAkKCdhW2hyZWZdJykucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAkKCdhW2hyZWY9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICB9XG59XG5cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2dzYXAuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9zcGxpdC10ZXh0LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcbmltcG9ydCB7IFB1c2hTdGF0ZXMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XG4vLyBpbXBvcnQgeyBQcm9ncmVzc2JhciB9IGZyb20gJy4vY29tcG9uZW50cy9Qcm9ncmVzc2Jhcic7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XG5pbXBvcnQgQmFja2dyb3VuZCBmcm9tICcuL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xuaW1wb3J0IHsgJHdpbmRvdywgJGJvZHkgfSBmcm9tICcuL1NpdGUnO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XG5cbmludGVyZmFjZSBJQmFja2dyb3VuZERhdGEge1xuICAgIGlkOiBzdHJpbmc7XG4gICAgc3RlcDogbnVtYmVyO1xuICAgIGRhcmtlbjogYm9vbGVhbjtcbiAgICBkYXJrZW5EZWxheTogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTY3JvbGxQYXJhbXMgZXh0ZW5kcyBPYmplY3Qge1xuICAgIHg/OiBudW1iZXI7XG4gICAgeT86IG51bWJlcjtcbiAgICBzcGVlZD86IG51bWJlcjtcbiAgICBhbmltYXRlPzogYm9vbGVhbjtcbiAgICByZWxhdGl2ZVNwZWVkPzogYm9vbGVhbjtcbiAgICBlYXNlPzogc3RyaW5nO1xufVxuXG5cbmludGVyZmFjZSBJQmFzZUNhY2hlSXRlbSB7XG4gICAgJGVsPzogSlF1ZXJ5O1xuICAgIGRvbmU/OiBib29sZWFuO1xuICAgIGhlaWdodD86IG51bWJlcjtcbiAgICBzdGFydD86IG51bWJlcjtcbiAgICB0eXBlPzogc3RyaW5nO1xuICAgIHk/OiBudW1iZXI7XG4gICAgY29tcG9uZW50PzogQ29tcG9uZW50O1xufVxuXG5pbnRlcmZhY2UgSVNjcm9sbGluZ0RhdGEgZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XG4gICAgdG9wOiBudW1iZXI7XG4gICAgcm9sZTogc3RyaW5nO1xuICAgIHBhdGg/OiBzdHJpbmc7XG4gICAgdGl0bGU/OiBzdHJpbmc7XG4gICAgYm90dG9tPzogbnVtYmVyO1xuICAgIGNoaWxkcmVuPzogYW55O1xuICAgICRjaGlsZD86IEpRdWVyeTtcbiAgICBjaGlsZEhlaWdodD86IG51bWJlcjtcbiAgICBkZWxheT86IG51bWJlcjtcbiAgICBzaG93bj86IGJvb2xlYW47XG4gICAgaW5pdGlhbGl6ZWQ/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSVBhcmFsbGF4Q2FjaGVJdGVtIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIHNoaWZ0PzogbnVtYmVyO1xuICAgICRjaGlsZD86IEpRdWVyeTtcbiAgICBjaGlsZEhlaWdodD86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIElBbmltYXRpb25DYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XG4gICAgZGVsYXk/OiBudW1iZXI7XG4gICAgdW5jYWNoZT86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBJU2Nyb2xsQ2FjaGUge1xuICAgIGFuaW1hdGlvbnM/OiBJQW5pbWF0aW9uQ2FjaGVJdGVtW107XG4gICAgcGFyYWxsYXhlcz86IElQYXJhbGxheENhY2hlSXRlbVtdO1xuICAgIG1vZHVsZXM/OiBJQmFzZUNhY2hlSXRlbVtdO1xuICAgIGJhY2tncm91bmRzPzogSUJhY2tncm91bmRDYWNoZUl0ZW1bXTtcbiAgICBzZWN0aW9ucz86IElTY3JvbGxpbmdEYXRhW107XG5cbn1cblxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kQ2FjaGVJdGVtIGV4dGVuZHMgSUJhY2tncm91bmREYXRhLCBJQmFzZUNhY2hlSXRlbSB7XG4gICAgcGVyY2VudGFnZT86IG51bWJlcjtcbiAgICBpbmRleD86IG51bWJlcjtcbiAgICBzaG93bj86IGJvb2xlYW47XG4gICAgZGVsYXk/OiBudW1iZXI7XG4gICAgYnJlYWtwb2ludHM/OiBzdHJpbmdbXTtcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBTY3JvbGwge1xuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2Nyb2xsO1xuICAgIHB1YmxpYyBzdGF0aWMgd2luZG93SGVpZ2h0OiBudW1iZXI7XG4gICAgcHVibGljIHN0YXRpYyBoZWFkZXJIZWlnaHQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhdGljIG1heFNjcm9sbDogbnVtYmVyO1xuICAgIHB1YmxpYyBzdGF0aWMgZGlzYWJsZWQ6IGJvb2xlYW47XG4gICAgcHVibGljIHN0YXRpYyBzY3JvbGxUb3A6IG51bWJlcjtcbiAgICAvLyBwdWJsaWMgc3RhdGljIGN1c3RvbVNjcm9sbDogU2Nyb2xsYmFyO1xuICAgIHByaXZhdGUgc3RhdGljIGN1c3RvbVNjcm9sbDtcbiAgICBwcml2YXRlIHN0YXRpYyBhbmltYXRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcblxuXG4gICAgcHJpdmF0ZSBjYWNoZTogSVNjcm9sbENhY2hlID0ge307XG4gICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHt9O1xuICAgIHByaXZhdGUgaWdub3JlQ2FjaGU6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBiYWNrZ3JvdW5kczoge1trZXk6IHN0cmluZ106IEJhY2tncm91bmR9O1xuICAgIHByaXZhdGUgdGFyZ2V0OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBzdG9yZWRQYXRoOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBzZWN0aW9uczogSlF1ZXJ5O1xuICAgIHByaXZhdGUgY2hhbmdpbmdQYXRoOiBib29sZWFuO1xuXG4gICAgXG4gICAgLyoqXG4gICAgICogc2Nyb2xscyBwYWdlIHRvIGNlcnRhaW4gZWxlbWVudCAodG9wIGVkZ2UpIHdpdGggc29tZSBzcGVlZFxuICAgICAqIEBwYXJhbSAge0pRdWVyeX0gICAgICAgICRlbCAgICBbdGFyZ2V0IGVsbWVudF1cbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICBvZmZzZXRcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICBkdXJhdGlvblxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59ICAgICAgICBbYWZ0ZXIgY29tcGxldGVkIGFuaW1hdGlvbl1cbiAgICAgKi9cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9FbGVtZW50KCRlbDogSlF1ZXJ5LCBvZmZzZXQ/OiBudW1iZXIsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgU2Nyb2xsLmFuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB5ID0gJGVsLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgKyAob2Zmc2V0IHx8IDApO1xuICAgICAgICAgICAgY29uc3Qgb2JqID0ge1xuICAgICAgICAgICAgICAgIHk6IE1hdGgubWF4KGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wLCB3aW5kb3cucGFnZVlPZmZzZXQpLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2Yob2JqKTtcbiAgICAgICAgICAgIGdzYXAudG8ob2JqLCB7XG4gICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIG9iai55KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgU2Nyb2xsLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIHJlc2V0U2Nyb2xsQ2FjaGUocGF0aG5hbWUpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlLmNhY2hlW3BhdGhuYW1lXSA9IDA7XG4gICAgfVxuICAgIFxuICAgIHB1YmxpYyBzdGF0aWMgZGlzYWJsZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGVuYWJsZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuXG4gICAgXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5pZ25vcmVDYWNoZSA9ICEhYnJvd3Nlci5zYWZhcmk7XG5cbiAgICAgICAgJCh3aW5kb3cpLm9uKCdzY3JvbGwnLCB0aGlzLm9uU2Nyb2xsKTtcbiAgICAgICAgJCgnYVtocmVmXj1cIiNcIl06bm90KFwiLmpzLW5hdi1pdGVtLCBbZGF0YS1saWdodGJveF1cIiknKS5vbignY2xpY2snLCB0aGlzLm9uSGFzaENsaWNrSGFuZGxlcik7XG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcbiAgICAgICAgLy8gU2Nyb2xsLmlzQ3VzdG9tU2Nyb2xsID0gJCgnI3dwYnMnKS5kYXRhKCdzY3JvbGxiYXInKTtcblxuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gNzA7XG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZSA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zdG9yZWRQYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuICAgICAgICB0aGlzLnRhcmdldCA9ICQoJ1tkYXRhLXBhdGg9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpO1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZXNpemUoKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC53aW5kb3dIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XG4gICAgICAgIFNjcm9sbC5oZWFkZXJIZWlnaHQgPSAkKCcjbmF2YmFyJykuaGVpZ2h0KCk7XG4gICAgICAgIFNjcm9sbC5tYXhTY3JvbGwgPSAkKCcjbWFpbicpLm91dGVySGVpZ2h0KCkgLSBTY3JvbGwud2luZG93SGVpZ2h0ICsgU2Nyb2xsLmhlYWRlckhlaWdodDtcblxuICAgICAgICB0aGlzLmJhY2tncm91bmRzID0gdGhpcy5idWlsZEJhY2tncm91bmRzKCk7XG5cblxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xuICAgIH1cblxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXG4gICAgcHVibGljIHN0YXRpYyBzY3JvbGxUb1BhdGgoZmFzdD86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XG5cbiAgICAgICAgaWYgKCR0YXJnZXRbMF0pIHtcbiAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJHRhcmdldCwgMCwgMCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICBpZiAoISF0aGlzLmNoYW5naW5nUGF0aCkgeyByZXR1cm4gZmFsc2U7IH1cbiAgICAgICAgcmV0dXJuIFNjcm9sbC5zY3JvbGxUb1BhdGgoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RvcCgpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLmRpc2FibGUoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbG9hZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcbiAgICAgICAgJHdpbmRvdy5vZmYoJy5zY3JvbGxpbmcnKS5vbignc2Nyb2xsLnNjcm9sbGluZycsICgpID0+IHRoaXMub25TY3JvbGwoKSk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgc3RhcnQoKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC5lbmFibGUoKTtcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlLm9uU2Nyb2xsKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcbiAgICAgICAgJHdpbmRvdy5vZmYoJy5zY3JvbGxpbmcnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uSGFzaENsaWNrSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgLy8gZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSkge1xuICAgICAgICAgICAgbGV0IG9mZnNldCA9IHBhcnNlSW50KCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JyksIDEwKTtcblxuICAgICAgICAgICAgaWYgKCB0eXBlb2YgJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSA9PT0gJ3N0cmluZycgKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb2ZmID0gJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKS5yZXBsYWNlKCd2aCcsICcnKTtcbiAgICAgICAgICAgICAgICBvZmZzZXQgPSAkKHdpbmRvdykuaGVpZ2h0KCkgKiAocGFyc2VJbnQob2ZmLCAxMCkgLyAxMDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpLCBvZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICBwcml2YXRlIGJ1aWxkQmFja2dyb3VuZHMoKToge1trZXk6IHN0cmluZ106IEJhY2tncm91bmQgfSB7XG4gICAgICAgIGxldCBiZ3MgPSB7fTtcbiAgICAgICAgJCgnW2RhdGEtYmctY29tcG9uZW50XScpLnRvQXJyYXkoKS5mb3JFYWNoKChlbCwgaSkgPT4ge1xuICAgICAgICAgICAgbGV0ICRiZ0VsID0gJChlbCk7XG4gICAgICAgICAgICBsZXQgYmdOYW1lID0gJGJnRWwuZGF0YSgnYmctY29tcG9uZW50Jyk7XG4gICAgICAgICAgICBsZXQgYmdPcHRpb25zID0gJGJnRWwuZGF0YSgnb3B0aW9ucycpO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRzW2JnTmFtZV0gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYmcgPSBuZXcgY29tcG9uZW50c1tiZ05hbWVdKCRiZ0VsLCBiZ09wdGlvbnMpO1xuICAgICAgICAgICAgICAgIGJnLmlkID0gZWwuaWQ7XG4gICAgICAgICAgICAgICAgYmdzW2VsLmlkXSA9IGJnO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBcIiVzXCIgY29tcG9uZW50IGF2YWlsYWJsZSEnLCBiZ05hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coYmdzLCAnQkdTIFNDUk9MTCcpO1xuICAgICAgICByZXR1cm4gYmdzO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XG4gICAgICAgIC8vIGlmICghdGhpcy5lbGVtZW50cykgeyByZXR1cm47IH1cbiAgICAgICAgY29uc3QgYW5pbWF0aW9uczogQXJyYXk8SUFuaW1hdGlvbkNhY2hlSXRlbT4gPSBbXTtcbiAgICAgICAgY29uc3QgbWFyZ2luID0gMCA7XG5cbiAgICAgICAgLy8gbGV0IHNlY3Rpb25zOiBBcnJheTxJU2Nyb2xsaW5nRGF0YT4gPSBbXTtcbiAgICAgICAgLy8gaWYgKHRoaXMuc2VjdGlvbnMpIHtcblxuICAgICAgICAvLyAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNlY3Rpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSB0aGlzLnNlY3Rpb25zLmVxKGkpO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJvbGUgPSAkZWwuZGF0YSgnc2Nyb2xsJyk7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdG9wID0gJGVsLm9mZnNldCgpLnRvcDtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBoZWlnaHQgPSAkZWwub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkZWxheSA9ICRlbC5kYXRhKCdkZWxheScpIHx8IDA7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdGl0bGUgPSAkZWwuZGF0YSgndGl0bGUnKSB8fCBmYWxzZTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBwYXRoID0gJGVsLmRhdGEoJ3BhdGgnKSB8fCBmYWxzZTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkYXRhOiBJU2Nyb2xsaW5nRGF0YSA9IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgIC8vICAgICAgICAgICAgIHJvbGU6IHJvbGUsXG4gICAgICAgIC8vICAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAvLyAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgLy8gICAgICAgICAgICAgYm90dG9tOiB0b3AgKyBoZWlnaHQsXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRyZW46IHt9LFxuICAgICAgICAvLyAgICAgICAgICAgICBzaG93bjogJGVsLmRhdGEoJ3Nob3duJykgfHwgZmFsc2UsXG4gICAgICAgIC8vICAgICAgICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgLy8gICAgICAgICB9O1xuICAgIFxuICAgICAgICAvLyAgICAgICAgIHNlY3Rpb25zLnB1c2goZGF0YSk7XG4gICAgICAgIC8vICAgICAgICAgJGVsLmRhdGEoJ2NhY2hlJywgaSk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuICAgICAgICBcbiAgICAgICAgJCgnW2RhdGEtYW5pbWF0aW9uXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xuICAgICAgICAgICAgYW5pbWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICBzdGFydDogdHlwZW9mICRlbC5kYXRhKCdzdGFydCcpICE9PSAndW5kZWZpbmVkJyA/ICRlbC5kYXRhKCdzdGFydCcpIDogMC4xLFxuICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AgLSBtYXJnaW4sXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICBkb25lOiAkZWwuaGFzQ2xhc3MoJ2FuaW1hdGVkJyksXG4gICAgICAgICAgICAgICAgdHlwZTogJGVsLmRhdGEoJ2FuaW1hdGlvbicpLFxuICAgICAgICAgICAgICAgIGRlbGF5OiAkZWwuZGF0YSgnZGVsYXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHVuY2FjaGU6ICRlbC5kYXRhKCd1bmNhY2hlJyksXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICBcblxuICAgICAgICBjb25zdCBwYXJhbGxheGVzOiBBcnJheTxJUGFyYWxsYXhDYWNoZUl0ZW0+ID0gW107XG4gICAgICAgICQoJ1tkYXRhLXBhcmFsbGF4XScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoPEhUTUxFbGVtZW50PmVsKTtcbiAgICAgICAgICAgIGNvbnN0IHAgPSAkZWwuZGF0YSgncGFyYWxsYXgnKTtcbiAgICAgICAgICAgIHBhcmFsbGF4ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVvZiBwID09PSAnc3RyaW5nJyA/IHAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHNoaWZ0OiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBwIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAkY2hpbGQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCksXG4gICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGJhY2tncm91bmRzOiBBcnJheTxJQmFja2dyb3VuZENhY2hlSXRlbT4gPSBbXTtcbiAgICAgICAgJCgnW2RhdGEtYmFja2dyb3VuZF0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmREYXRhID0gJGVsLmRhdGEoJ2JhY2tncm91bmQnKTtcbiAgICAgICAgICAgIGNvbnN0IGJyZWFrcG9pbnRzID0gYmFja2dyb3VuZERhdGEuYnJlYWtwb2ludHMgfHwgWydkZXNrdG9wJywgJ3RhYmxldCcsICdwaG9uZSddO1xuXG4gICAgICAgICAgICBpZiAoYnJlYWtwb2ludHMuaW5kZXhPZihicmVha3BvaW50LnZhbHVlKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmJhY2tncm91bmRzW2JhY2tncm91bmREYXRhLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3RoZXJlXFwncyBubyBiYWNrZ3JvdW5kIHdpdGggaWQ9JyArIGJhY2tncm91bmREYXRhLmlkICsgJyEnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kcy5wdXNoKCQuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGFya2VuRGVsYXk6IDAsXG4gICAgICAgICAgICAgICAgICAgIH0sIGJhY2tncm91bmREYXRhIHx8IHt9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdGhpcy5jYWNoZS5hbmltYXRpb25zID0gYW5pbWF0aW9ucztcbiAgICAgICAgdGhpcy5jYWNoZS5wYXJhbGxheGVzID0gcGFyYWxsYXhlcztcbiAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcyA9IGJhY2tncm91bmRzO1xuICAgICAgICAvLyB0aGlzLmNhY2hlLnNlY3Rpb25zID0gc2VjdGlvbnM7XG5cblxuXG4gICAgICAgIHRoaXMub25TY3JvbGwoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvblNjcm9sbCA9ICgpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAoU2Nyb2xsLmRpc2FibGVkIHx8ICRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgY29uc3Qgc1QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCAwO1xuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSBTY3JvbGwud2luZG93SGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JlZW5DZW50ZXI6IG51bWJlciA9IHNUICsgU2Nyb2xsLndpbmRvd0hlaWdodCAqIDAuMzM7XG4gICAgICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IFNjcm9sbC5oZWFkZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHNjcm9sbGVuZCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIHdpbmRvdy5pbm5lckhlaWdodCAtIDI7XG4gICAgICAgIGNvbnN0IHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykub2Zmc2V0KCkudG9wIC0gKFNjcm9sbC5oZWFkZXJIZWlnaHQgKiAyKSA6IDA7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmRzID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgOiAwO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9wID0gc1Q7XG4gICAgICAgIHRoaXMuc2Nyb2xsQ2FjaGVbd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXSA9IHNUO1xuXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC13aW5kb3ctaGVpZ2h0Jywgc1QgPiB3aW5kb3dIZWlnaHQgLSAxMDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtbmF2YmFyJywgc1QgPiAxMDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQnLCBzVCA+IDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcsIHNUID4gcGFnZUhlYWRlcik7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1iYWNrZ3JvdW5kcy1zY3JvbGxlZCcsIHNUID4gYmFja2dyb3VuZHMpO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsLWVuZCcsIHNUID49IHNjcm9sbGVuZCk7XG5cblxuICAgICAgICAvLyBhbmltYXRpb25zOlxuICAgICAgICBpZiAodGhpcy5jYWNoZS5hbmltYXRpb25zICYmIHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW06IElBbmltYXRpb25DYWNoZUl0ZW0gPSB0aGlzLmNhY2hlLmFuaW1hdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgeUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHlUb3A6IG51bWJlciA9IHNUO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1ZOiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0ueSA6IGl0ZW0uJGVsLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uZG9uZSAmJiBpdGVtWSA8PSB5Qm90dG9tICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVpY2s6IGJvb2xlYW4gPSB5VG9wID49IGl0ZW1ZICsgaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlKGl0ZW0sIGl0ZW0uJGVsLCBpdGVtLnR5cGUsIGl0ZW0uZGVsYXksIHF1aWNrKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEhaXRlbS5kb25lICYmIGl0ZW0uY29tcG9uZW50ICYmIGl0ZW0udHlwZSA9PT0gJ3RvZ2dsZScgJiYgKGl0ZW1ZID4geUJvdHRvbSB8fCBpdGVtWSArIGl0ZW1IZWlnaHQgPCB5VG9wKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udW5jYWNoZSAmJiBpdGVtLmRvbmUgJiYgKHNUIDw9IGl0ZW1ZIC0gd2luZG93SGVpZ2h0IHx8IHNUID49IGl0ZW1ZICsgd2luZG93SGVpZ2h0ICkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5sZW5ndGggPiAwKSB7IGl0ZW0uJGVsLmZpbmQoJy51bmNhY2hlZCcpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmF0dHIoJ2RhdGEtdW5jYWNoZScpKSB7IGl0ZW0uJGVsLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBwYXJhbGxheGVzOlxuICAgICAgICBpZiAodGhpcy5jYWNoZS5wYXJhbGxheGVzICYmIHRoaXMuY2FjaGUucGFyYWxsYXhlcy5sZW5ndGggPiAwICYmIGJyZWFrcG9pbnQuZGVza3RvcCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFsbGF4KHRoaXMuY2FjaGUucGFyYWxsYXhlc1tpXSwgc1QsIHdpbmRvd0hlaWdodCwgLWhlYWRlckhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBcblxuICAgICAgICAvL2Jnc1xuICAgICAgICBpZiAodGhpcy5jYWNoZS5iYWNrZ3JvdW5kcykge1xuXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAuNSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIC8vIGNvbnN0IHdpbmRvd0NlbnRlcjogbnVtYmVyID0gMCAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGxldCBiZ3NUb1Nob3cgPSBbXTtcbiAgICAgICAgICAgIGxldCBiZ3NUb0hpZGUgPSBbXTtcblxuXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzLmZvckVhY2goKGl0ZW06IElCYWNrZ3JvdW5kQ2FjaGVJdGVtLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVk6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS55IDogaXRlbS4kZWwub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1IZWlnaHQ6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS5oZWlnaHQgOiBpdGVtLiRlbC5vdXRlckhlaWdodCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Cb3R0b206IG51bWJlciA9IGl0ZW1ZICsgaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBzVCArIGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XG4gICAgICAgICAgICAgICAgLy8gY29uc3QgeUNlbnRlciA9ICh0eXBlb2YgaXRlbS5zdGFydCAhPT0gJ3VuZGVmaW5lZCcpID8gaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSB0aGlzLmJhY2tncm91bmRzW2l0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbGF5ID0gdHlwZW9mIGl0ZW0uZGVsYXkgIT09ICd1bmRlZmluZWQnID8gaXRlbS5kZWxheSA6IDAuMTtcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gLSAoaXRlbVkgLSB5Q2VudGVyKSAvIGl0ZW1IZWlnaHQ7XG4gICAgICAgICAgICAgICAgbGV0IGJhY2tncm91bmRRdWlja1NldHVwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJlbnQgPSAkYm9keS5oYXNDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcpID8gc1QgKyB3aW5kb3dIZWlnaHQgPj0gaXRlbVkgJiYgaXRlbVkgKyBpdGVtSGVpZ2h0ID49IHNUIDogaXRlbVkgLSBzVCA8PSB3aW5kb3dDZW50ZXIgJiYgaXRlbUJvdHRvbSAtIHNUID49IHdpbmRvd0NlbnRlcjtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdGlvbkluKGZhbHNlLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIGRlbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLnVwZGF0ZShwZXJjZW50YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5zZXRTdGVwKGl0ZW0uc3RlcCwgYmFja2dyb3VuZFF1aWNrU2V0dXApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5kYXJrZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuZGFya2VuKGl0ZW1ZIDw9IHlDZW50ZXIgLSB3aW5kb3dIZWlnaHQgKiBpdGVtLmRhcmtlbkRlbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiZ3NUb1Nob3cucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEhaXRlbS5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICBiZ3NUb0hpZGUucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGlmIChiZ3NUb0hpZGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYmdzVG9IaWRlLmZvckVhY2goKGJnSUQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJnc1RvU2hvdy5pbmRleE9mKGJnSUQpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5hbmltYXRpb25PdXQoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5zaG93bj0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIFByb2dyZXNzYmFyLnVwZGF0ZShzVCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgYW5pbWF0ZShkYXRhOiBJQW5pbWF0aW9uQ2FjaGVJdGVtLCAkZWw6IEpRdWVyeSwgdHlwZTogc3RyaW5nLCBkZWxheTogbnVtYmVyID0gMC4xIGFzIG51bWJlciwgcXVpY2s/OiBib29sZWFuLCB1bmNhY2hlPzogYm9vbGVhbik6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IHRpbWUgPSAhcXVpY2sgPyAuNiA6IDA7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlVXAnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiA0MCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB5OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZURvd24nOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiAtMTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVSaWdodCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZUxlZnQnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAxMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaVRhYnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbFRleHQgPSAkZWwuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJUZXh0ID0gJGVsLmZpbmQoJ3NwYW46bGFzdC1jaGlsZCcpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obFRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJzUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHJUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICctNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZWxlbWVudHMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ1tkYXRhLXZpZXctdGFiXScpLCB7IGR1cmF0aW9uOiAxLCB5OiAnMTAwJScgfSwge1xuICAgICAgICAgICAgICAgICAgICB5OiAnMCUnLCBzdGFnZ2VyOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5pdGVtX190YWJzJyksIHsgZHVyYXRpb246IDEsIG92ZXJmbG93OiAndW5zZXQnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFjdCc6XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGxldCBmVGV4dCA9ICRlbC5maW5kKCcuZmFjdF9fdGV4dCBzcGFuJyksXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0RlR4dCA9IG5ldyBTcGxpdFRleHQoZlRleHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycyd9KSxcbiAgICAgICAgICAgICAgICAgICAgZkltZyA9ICRlbC5maW5kKCcuZmFjdF9faW1hZ2Utd3JhcCcpLFxuICAgICAgICAgICAgICAgICAgICBmQXJyID0gJGVsLmZpbmQoJy5mYWN0X19pY29uJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKClcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmQXJyLCB7IGR1cmF0aW9uOiAxLCByb3RhdGU6IDkwIH0sIHsgcm90YXRlOiAwLCBkZWxheTogMC41IH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oc3BsaXRGVHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtNSB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDEgfSwgJy09MC44JylcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmSW1nLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxIH0sICctPTAuNScpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2xlYWQnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXQgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgbGluZXMnLCBsaW5lc0NsYXNzOiAnbGluZScgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZWwuZmluZCgnLmxpbmUnKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYWZ0ZXIoJzxicj4nKTtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYXBwZW5kKCc8c3BhbiBjbGFzcz1cImxpbmVfX2JnXCI+PC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0LndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xLCBkZWxheTogMC40IH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5saW5lX19iZycpLCB7IGR1cmF0aW9uOiAwLjc1LCBzY2FsZVg6IDEsIHN0YWdnZXI6IDAuMX0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMH0se3NjYWxlWDogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGRlbGF5fSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnY2hhcnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEguY2hhcnMsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCwgb3BhY2l0eTogMCB9LCB7IHNjYWxlWDogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdjaGFycy1zaW1wbGUnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIMiA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRIMi5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnd29yZHMtc2ltcGxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMnIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXIgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21Ubyh3b3Jkcy53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJ9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpbWFnZXMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ2ltZycpLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBzdGFnZ2VyOiAwLjIgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaGVybyc6XG5cbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgcG9pbnRlckV2ZW50czogJ25vbmUnLCBkZWxheTogMC41IH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaGVyb0VsZW1lbnRzID0gJGVsLmZpbmQoJy5oZXJvLWltYWdlOm5vdCguanMtdGlueSknKTtcbiAgICAgICAgICAgICAgICBjb25zdCB0aW55ID0gJGVsLmZpbmQoJy5qcy10aW55Jyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb20odGlueSwgeyBkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzdGFnZ2VyOiAtMC4wNSwgZGVsYXk6IDAuNX0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGhlcm9FbGVtZW50cywge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogMS41LCB4OiAnLTUwJScsIHk6ICc1MCUnLCBzdGFnZ2VyOiAtMC4wNSxcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IHBvaW50ZXJFdmVudHM6ICdhbGwnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAncXVvdGUnOlxuICAgICAgICAgICAgICAgIGNvbnN0ICRxdW90ZSA9ICRlbC5maW5kKCcuanMtcXVvdGUtd29yZHMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkYXV0aG9yID0gJGVsLmZpbmQoJy5qcy1xdW90ZS1hdXRob3InKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkbGluZSA9ICRlbC5maW5kKCdocicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoWyRxdW90ZSwgJGVsLCAkYXV0aG9yXSwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSAkcXVvdGUuY2hpbGRyZW4oKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFF1b3RlID0gbmV3IFNwbGl0VGV4dCgkcXVvdGUsIHsgdHlwZTogJ3dvcmRzJyB9KTtcblxuICAgICAgICAgICAgICAgIC8vIEZPUiBVTkNBQ0hFIE9QVElPTiBPRiBBTklNQVRJT04gUVVPVEVcbiAgICAgICAgICAgICAgICAvLyBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXRRdW90ZS53b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vICAgICBzcGxpdFF1b3RlLndvcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSh7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9SZW1vdmVDaGlsZHJlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc2V0KCRxdW90ZSwgeyBvcGFjaXR5OiAxIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oY2hpbGQsIDAuNSwgeyBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgZWFzZTogJ3Bvd2VyMycgfSwgJys9JyArIGRlbGF5KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbShzcGxpdFF1b3RlLndvcmRzLCAwLjUsIHsgb3BhY2l0eTogMCwgeDogOCwgdHJhbnNmb3JtT3JpZ2luOiAnMCUgMTAwJScsIGVhc2U6ICdwb3dlcjMnLCBzdGFnZ2VyOiAwLjA1IH0sIDAuMSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkYXV0aG9yLCAwLjcsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sIHsgb3BhY2l0eTogMSwgeDogMCB9LCAnLT0nICsgMC4zKVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKCRsaW5lLCB7IGR1cmF0aW9uOiAwLjcsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSB9LCAnLT0wLjMnKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd3b3Jkcyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHh0ID0gJGVsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0dHh0ID0gbmV3IFNwbGl0VGV4dCh0eHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdHR4dC5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7ICBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuXG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaXRlbXNGYWRlJzpcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9ICRlbC5maW5kKCcuJyArICRlbC5kYXRhKCdlbGVtZW50cycpICsgJycpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXJFbCA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoZWxlbWVudHMsIHsgb3BhY2l0eTogMCB9KTtcblxuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogMC4yfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAndmlkZW8tdGV4dCc6XG4gICAgICAgICAgICAgICAgY29uc3QgdmlkID0gJGVsLmZpbmQoJy5qcy1jb2wtNjYnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmYgPSAkZWwuZmluZCgnLmpzLWNvbC0zMycpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoW3ZpZCwgaW5mXSwgeyBvcGFjaXR5OiAwIH0pO1xuXG5cbiAgICAgICAgICAgICAgICBnc2FwLnRvKHZpZCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDAuMn0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGluZiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTIwfSwgeyBvcGFjaXR5OiAxLCB4OiAwLCBkZWxheTogMC40fSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaGVhZGluZyc6XG4gICAgICAgICAgICAgICAgY29uc3QgaFRpdGxlID0gJGVsLmZpbmQoJy5qcy10aXRsZScpLFxuICAgICAgICAgICAgICAgICAgICBociA9ICRlbC5maW5kKCcuanMtaGVhZGluZy1ocicpO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0VGl0bGUgPSBuZXcgU3BsaXRUZXh0KGhUaXRsZSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdFRpdGxlLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaHIsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSwgZGVsYXk6IDAuNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd0aXRsZUZhZGVJbic6XG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZCA9ICRlbC5maW5kKCcuanMtZml4ZWQtdGl0bGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAkZWwuZmluZCgnLmpzLXN1YicpLFxuICAgICAgICAgICAgICAgICAgICAgIGFyciA9ICRlbC5maW5kKCcuanMtYXJyJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb20obGVhZCwgeyBkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMS4yLCBkZWxheTogMn0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShzdWIsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHk6IDMwLCBkZWxheTogMy4yfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGFyciwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjd9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpbnRybyc6XG4gICAgICAgICAgICAgICAgY29uc3QgY3VydGFpbiA9ICRlbC5maW5kKCcuanMtY3VydGFpbicpO1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhjdXJ0YWluLCB7IGR1cmF0aW9uOiAzLCBvcGFjaXR5OiAwLCBkZWxheTogMX0pO1xuXG4gICAgICAgICAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1hbmltYXRlZCcpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIFxuICAgICAgICAgICAgY2FzZSAnaGVhZGVyJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgaHRpbWUgPSAkZWwuZmluZCgnLmpzLXRpbWUnKSxcbiAgICAgICAgICAgICAgICAgICAgc29jaWFsRCA9ICRlbC5maW5kKCcucGhvbmUtaGlkZSAuc29jaWFsX19pdGVtJyksXG4gICAgICAgICAgICAgICAgICAgIHNoYXJlVGV4dCA9ICRlbC5maW5kKCcucGhvbmUtaGlkZSAuc29jaWFsX190aXRsZScpLFxuICAgICAgICAgICAgICAgICAgICBoSHIgPSAkZWwuZmluZCgnLmpzLWhlYWRlci1ocicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oW2h0aW1lLCBzaGFyZVRleHQsIHNvY2lhbERdLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMTB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMX0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhIciwgeyBzY2FsZVg6IDB9LCB7IHNjYWxlWDogMX0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7dHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcGFyYWxsYXgoaXRlbTogSVBhcmFsbGF4Q2FjaGVJdGVtLCBzVDogbnVtYmVyLCB3aW5kb3dIZWlnaHQ6IG51bWJlciwgaGVhZGVySGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICBpZiAoaXRlbS5zaGlmdCkge1xuXG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xuICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IGl0ZW0ueTtcblxuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQ6IG51bWJlciA9ICh5IC0gc1QgKyBpdGVtLmhlaWdodCAtIGhlYWRlckhlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpO1xuICAgICAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiBpdGVtLnNoaWZ0KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWU6IG51bWJlciA9ICFpdGVtLmRvbmUgPyAwIDogMC41O1xuICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwpO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLCB7XG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aW1lLFxuICAgICAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgICAgICByb3VuZFByb3BzOiBbJ3knXSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlKSB7XG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xuICAgICAgICAgICAgY29uc3QgJGVsU3RpY2t5OiBKUXVlcnkgPSAkZWwucGFyZW50KCkucGFyZW50KCk7XG4gICAgICAgICAgICBjb25zdCB5OiBudW1iZXIgPSBpdGVtLnk7XG4gICAgICAgICAgICBjb25zdCBweUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgcHlUb3A6IG51bWJlciA9IHNUIC0gaXRlbS5oZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBweVRvcFN0aWNreTogbnVtYmVyID0gc1QgLSAkZWxTdGlja3kuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdoZXJvJzpcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICFicm93c2VyLm1vYmlsZSA/IHNUICogMC41IDogMCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBjYXNlICdmaXhlZEltYWdlJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coeSwgXCJ5XCIsIHNULCBweUJvdHRvbSwgd2luZG93SGVpZ2h0LHdpbmRvd0hlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IHB5VG9wICYmIHkgPD0gcHlCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkZWwuaGFzQ2xhc3MoJ2hhcy1wYXJhbGxheCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdoYXMtcGFyYWxsYXgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2hhcy1wYXJhbGxheCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgICAgICBjYXNlICdjc3MtYW5pbWF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5oYXNDbGFzcygnYW5pbWF0aW9uLXBsYXknKSA/IG51bGwgOiBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uJGVsLnJlbW92ZUNsYXNzKCdhbmltYXRpb24tcGxheScpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgIGNhc2UgJ3JlbGF0aXZlUGFyYWxsYXgnOlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGVTcGFjZSA9IGl0ZW0uY2hpbGRIZWlnaHQgLSBpdGVtLmhlaWdodDsgLy8gcmVzZXJ2ZSBzcGFjZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhTaGlmdCA9IE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCBpdGVtLmhlaWdodCArIGhlYWRlckhlaWdodCk7IC8vIE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCAod2luZG93SGVpZ2h0IC0gZGF0YS5oZWlnaHQpICogMC41ICk7IC8vIGRvIG5vdCBtb3ZlIHRvbyBtdWNoIG9uIGJpZyBzY3JlZW5zXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQgPSAoc1QgLSBpdGVtLnkgKyB3aW5kb3dIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zWTogc3RyaW5nIHwgbnVtYmVyID0gTWF0aC5yb3VuZCgoMSAtIHBlcmNlbnQpICogbWF4U2hpZnQpO1xuICAgICAgICAgICAgICAgICAgICBwb3NZID0gcG9zWSA8IDAgPyAwIDogcG9zWTtcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPiBtYXhTaGlmdCA/IG1heFNoaWZ0IDogcG9zWTtcblxuICAgICAgICAgICAgICAgICAgICBnc2FwLnNldChpdGVtLiRjaGlsZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgeTogLXBvc1ksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7aXRlbS50eXBlfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmV4cG9ydCBjbGFzcyBTaGFyZSB7XG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuXG5cbiAgICAgICAgJCgnW2RhdGEtc2hhcmVdJykub24oJ2NsaWNrJywgKGUpOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGxldCB3aW5XaWR0aCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbndpZHRoJyksIDEwKSB8fCA1MjA7XG4gICAgICAgICAgICBsZXQgd2luSGVpZ2h0ID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2luaGVpZ2h0JyksIDEwKSB8fCAzNTA7XG4gICAgICAgICAgICBsZXQgd2luVG9wID0gKHNjcmVlbi5oZWlnaHQgLyAyKSAtICh3aW5IZWlnaHQgLyAyKTtcbiAgICAgICAgICAgIGxldCB3aW5MZWZ0ID0gKHNjcmVlbi53aWR0aCAvIDIpIC0gKHdpbldpZHRoIC8gMik7XG5cbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSA8YW55PmUuY3VycmVudFRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGhyZWYgPSBjdXJyZW50VGFyZ2V0LmhyZWY7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3NoYXJlJyk7XG5cbiAgICAgICAgICAgIGlmIChkYXRhID09PSAnbGlua2VkaW4nKSB7XG4gICAgICAgICAgICAgICAgd2luV2lkdGggPSA0MjA7XG4gICAgICAgICAgICAgICAgd2luSGVpZ2h0ID0gNDMwO1xuICAgICAgICAgICAgICAgIHdpblRvcCA9IHdpblRvcCAtIDEwMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93Lm9wZW4oaHJlZiwgJ3NoYXJlcicgKyBkYXRhLCAndG9wPScgKyB3aW5Ub3AgKyAnLGxlZnQ9JyArIHdpbkxlZnQgKyAnLHRvb2xiYXI9MCxzdGF0dXM9MCx3aWR0aD0nICsgd2luV2lkdGggKyAnLGhlaWdodD0nICsgd2luSGVpZ2h0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9yZWZlcmVuY2VzLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgUHVzaFN0YXRlcywgUHVzaFN0YXRlc0V2ZW50cyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XG5pbXBvcnQgeyBQYWdlLCBQYWdlRXZlbnRzIH0gZnJvbSAnLi9wYWdlcy9QYWdlJztcbmltcG9ydCB7IENvbXBvbmVudEV2ZW50cywgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBCcm93c2VyLCBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vTG9hZGVyJztcbmltcG9ydCB7IHBhZ2VzLCBjb21wb25lbnRzIH0gZnJvbSAnLi9DbGFzc2VzJztcbmltcG9ydCB7IENvcHkgfSBmcm9tICcuL0NvcHknO1xuaW1wb3J0IHsgU2hhcmUgfSBmcm9tICcuL1NoYXJlJztcbmltcG9ydCB7IEFQSSB9IGZyb20gJy4vQXBpJztcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XG5cbmV4cG9ydCBsZXQgc2l0ZTogU2l0ZTtcbmV4cG9ydCBsZXQgJGRvYzogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkd2luZG93OiBKUXVlcnk7XG5leHBvcnQgbGV0ICRib2R5OiBKUXVlcnk7XG5leHBvcnQgbGV0ICRhcnRpY2xlOiBKUXVlcnk7XG5leHBvcnQgbGV0ICRtYWluOiBKUXVlcnk7XG5leHBvcnQgbGV0ICRwYWdlSGVhZGVyOiBKUXVlcnk7XG5leHBvcnQgbGV0IHBpeGVsUmF0aW86IG51bWJlcjtcbmV4cG9ydCBsZXQgZGVidWc6IGJvb2xlYW47XG5leHBvcnQgbGV0IGVhc2luZzogc3RyaW5nO1xuZXhwb3J0IGxldCBsYW5nOiBzdHJpbmc7XG5leHBvcnQgbGV0IGZpeGVkcG9zaXRpb246IG51bWJlcjtcblxuLy8gZGVjbGFyZSBsZXQgQ3VzdG9tRWFzZTtcblxuXG5cblxuZXhwb3J0IGNsYXNzIFNpdGUge1xuXG5cbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTaXRlO1xuXG4gICAgcHJpdmF0ZSBjdXJyZW50UGFnZTogUGFnZTtcbiAgICBwcml2YXRlIHB1c2hTdGF0ZXM6IFB1c2hTdGF0ZXM7XG4gICAgcHJpdmF0ZSBzY3JvbGw6IFNjcm9sbDtcbiAgICBwcml2YXRlIGxhc3RCcmVha3BvaW50OiBJQnJlYWtwb2ludDtcbiAgICBwcml2YXRlIGxvYWRlcjogTG9hZGVyO1xuICAgIC8vIHByaXZhdGUgaXNSZWFkeTogYm9vbGVhbjtcbiAgICAvLyBwcml2YXRlIGNvbXBvbmVudHM6IEFycmF5PENvbXBvbmVudD4gPSBbXTtcbiAgICAvLyBwcml2YXRlICRoYW1idXJnZXI6IEpRdWVyeTtcbiAgICAvLyBwcml2YXRlICRwYWdlSGVhZGVyOiBKUXVlcnk7XG4gICAgLy8gcHJpdmF0ZSAkYXJ0aWNsZTogSlF1ZXJ5O1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzaXRlJyk7XG5cbiAgICAgICAgU2l0ZS5pbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIC8vIGxhbmcgPSAkKCdodG1sJykuYXR0cignbGFuZycpO1xuXG4gICAgICAgIHBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICAgICAgICBkZWJ1ZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guaW5kZXhPZignZGVidWcnKSA+PSAwO1xuICAgICAgICAvLyBlYXNpbmcgPSBDdXN0b21FYXNlLmNyZWF0ZSgnY3VzdG9tJywgJ00wLDAsQzAuNSwwLDAuMywxLDEsMScpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgaW5pdCgpOiB2b2lkIHtcblxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xuICAgICAgICBCcm93c2VyLnVwZGF0ZSgpO1xuXG4gICAgICAgICRkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgJHdpbmRvdyA9ICQod2luZG93KTtcbiAgICAgICAgJGJvZHkgPSAkKCdib2R5Jyk7XG4gICAgICAgICRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xuICAgICAgICAkbWFpbiA9ICQoJyNtYWluJyk7XG5cblxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMgPSBuZXcgUHVzaFN0YXRlcygpO1xuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UsIHRoaXMub25TdGF0ZSk7XG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5vbihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uTG9hZFByb2dyZXNzKTtcblxuICAgICAgICAvLyB0aGlzLiRoYW1idXJnZXIgPSAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XG4gICAgICAgIC8vIHRoaXMuJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XG4gICAgICAgIC8vIHRoaXMuJHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykgOiBudWxsO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsID0gbmV3IFNjcm9sbCgpO1xuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBMb2FkZXIoJCgnLmpzLWxvYWRlcicpKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41KTtcblxuXG4gICAgICAgIG5ldyBDb3B5KCk7XG4gICAgICAgIG5ldyBTaGFyZSgpO1xuICAgICAgICBuZXcgQVBJKCk7XG4gICAgICAgIEFQSS5iaW5kKCk7XG4gICAgICAgIC8vIHRoaXMubWVudSA9IG5ldyBNZW51KCQoJy5qcy1tZW51JykpO1xuICAgICAgICAvLyB0aGlzLmNvb2tpZXMgPSBuZXcgQ29va2llcygkKCcuanMtY29va2llcycpKTtcblxuXG4gICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KFtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKSxcbiAgICAgICAgICAgIC8vIHRoaXMucHJlbG9hZEFzc2V0cygpLFxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKSxcbiAgICAgICAgXSkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XG5cblxuICAgICAgICBpZiAoZGVidWcpIHsgVXRpbHMuc3RhdHMoKTsgfVxuXG4gICAgICAgICR3aW5kb3cub24oJ29yaWVudGF0aW9uY2hhbmdlJywgKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xuXG4gICAgICAgIH0sIDEwMCkpO1xuICAgICAgICAkd2luZG93Lm9uKCdyZXNpemUnLCAoKSA9PiB0aGlzLm9uUmVzaXplKCkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uUmVzaXplKCk6IHZvaWQge1xuXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3AgJiYgIWJyb3dzZXIubW9iaWxlKSB7XG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd2lkdGggPSAkd2luZG93LndpZHRoKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9ICR3aW5kb3cuaGVpZ2h0KCk7XG5cbiAgICAgICAgY29uc3QgY2hhbmdlZCA9ICF0aGlzLmxhc3RCcmVha3BvaW50IHx8IHRoaXMubGFzdEJyZWFrcG9pbnQudmFsdWUgIT09IGJyZWFrcG9pbnQudmFsdWU7XG4gICAgICAgIHRoaXMubGFzdEJyZWFrcG9pbnQgPSBicmVha3BvaW50O1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0LCBicmVha3BvaW50LCBjaGFuZ2VkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCgncmVzaXplJywgd2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XG4gICAgICAgIHRoaXMubG9hZGVyLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5zY3JvbGwucmVzaXplKCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcHJlbG9hZEFzc2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgYXNzZXRzID0gW107XG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCgnLnByZWxvYWQtYmcnLCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYXNzZXRzICYmIGFzc2V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzc2V0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQoYXNzZXRzW2ldLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbC5qcURlZmVycmVkLmFsd2F5cygoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvLyBjaGVjayBpZiBhbnkgY29tcG9uZW50IGhhbmRsZSBvblN0YXRlIGV2ZW50XG4gICAgLy8gaWYgbm90LCByZWxvYWQgaHRtbDpcbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XG5cbiAgICAgICAgLy8gY29uc3Qgc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlID0gdGhpcy5zY3JvbGwub25TdGF0ZSgpO1xuICAgICAgICBjb25zdCBwYWdlQ2hhbmdlZFN0YXRlID0gdGhpcy5jdXJyZW50UGFnZS5vblN0YXRlKCk7XG5cbiAgICAgICAgLy8gaWYgKCFzY3JvbGxpbmdDaGFuZ2VkU3RhdGUgJiYgIW9mZnNjcmVlbkNoYW5nZWRTdGF0ZSAmJiAhcGFnZUNoYW5nZWRTdGF0ZSkge1xuICAgICAgICBpZiAoIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcblxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzLnNlbmRQYWdldmlldyh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuXG4gICAgICAgICAgICBjb25zdCBwdXNoU3RhdGVzTG9hZFByb21pc2UgPSB0aGlzLnB1c2hTdGF0ZXMubG9hZCgpO1xuICAgICAgICAgICAgY29uc3QgYW5pbWF0ZU91dFByb21pc2UgPSB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVPdXQoKTtcblxuICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsLnN0b3AoKTtcblxuICAgICAgICAgICAgLy8gYWxsIHByb21pc2VzIGFycmF5OlxuICAgICAgICAgICAgY29uc3QgbG9hZGluZ1Byb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IFtcbiAgICAgICAgICAgICAgICBwdXNoU3RhdGVzTG9hZFByb21pc2UsXG4gICAgICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAvLyByZW5kZXIgaHRtbCB3aGVuIGV2ZXJ5dGhpbmcncyByZWFkeTpcbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGxvYWRpbmdQcm9taXNlcykudGhlbih0aGlzLnJlbmRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLy8gZGlzcGxheSBhamF4IHByb2dyZXNzOlxuICAgIHByaXZhdGUgb25Mb2FkUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41ICogcHJvZ3Jlc3MpO1xuICAgIH1cblxuXG5cbiAgICAvLyBwYXNzIGxvYWRpbmcgcHJvZ3Jlc3MgZnJvbSBwYWdlIHRvIHByZWxvYWRlcjpcbiAgICBwcml2YXRlIG9uUGFnZVByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSArIDAuNSAqIHByb2dyZXNzKTtcbiAgICB9XG5cblxuXG4gICAgLy8gZGVhbCB3aXRoIG5ld2x5IGFkZGVkIGVsZW1lbnRzXG4gICAgcHJpdmF0ZSBvblBhZ2VBcHBlbmQgPSAoZWw6IEpRdWVyeSk6IHZvaWQgPT4ge1xuICAgICAgICBQdXNoU3RhdGVzLmJpbmQoZWxbMF0pO1xuICAgICAgICAvLyBXaWRnZXRzLmJpbmQoZWxbMF0pO1xuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XG4gICAgfVxuXG5cblxuICAgIC8vIGNhbGxlZCBhZnRlciBuZXcgaHRtbCBpcyBsb2FkZWRcbiAgICAvLyBhbmQgb2xkIGNvbnRlbnQgaXMgYW5pbWF0ZWQgb3V0OlxuICAgIHByaXZhdGUgcmVuZGVyID0gKCk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLm9mZigpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2Nyb2xsLmRlc3Ryb3koKTtcblxuICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcblxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMucmVuZGVyKCk7XG4gICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcbiAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSgkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JykpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBkZXRlY3RIb21lUGFnZSgpOiB2b2lkIHtcbiAgICAgICAgJHBhZ2VIZWFkZXIgPyAkYm9keS5hZGRDbGFzcygnaXMtaG9tZS1wYWdlJykgOiBudWxsO1xuICAgIH1cblxuXG4gICAgLy8gd2hlbiBjdXJyZW50IHBhZ2UgaXMgbG9hZGVkOlxuICAgIHByaXZhdGUgb25QYWdlTG9hZGVkID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAvLyAkYm9keS5yZW1vdmVDbGFzcygnaXMtbm90LXJlYWR5Jyk7XG4gICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIHRoaXMubG9hZGVyLmhpZGUoKTtcbiAgICAgICAgVXRpbHMuZW5hYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkYm9keSwgMCwgMCk7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UuYW5pbWF0ZUluKCk7XG4gICAgICAgICRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcbiAgICAgICAgdGhpcy5kZXRlY3RIb21lUGFnZSgpO1xuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcbiAgICAgICAgLy8gdGhpcy5jb29raWVzLnRyeVRvU2hvdygpO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9QYXRoKHRydWUpO1xuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLnN0YXJ0KCk7XG4gICAgICAgICQoJ2FydGljbGUnKS5wYXJlbnQoKS5hZGRDbGFzcygnaXMtbG9hZGVkJyk7XG4gICAgfVxuXG5cblxuICAgIC8vIHJ1biBuZXcgUGFnZSBvYmplY3RcbiAgICAvLyAoZm91bmQgYnkgYGRhdGEtcGFnZWAgYXR0cmlidXRlKVxuICAgIC8vIGJpbmQgaXQgYW5kIHN0b3JlIGFzIGN1cnJlbnRQYWdlOlxuICAgIHByaXZhdGUgc2V0Q3VycmVudFBhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCAkcGFnZUVsOiBKUXVlcnkgPSAkKCdbZGF0YS1wYWdlXScpLFxuICAgICAgICAgICAgcGFnZU5hbWU6IHN0cmluZyA9ICRwYWdlRWwuZGF0YSgncGFnZScpIHx8ICdQYWdlJyxcbiAgICAgICAgICAgIHBhZ2VPcHRpb25zOiBPYmplY3QgPSAkcGFnZUVsLmRhdGEoJ29wdGlvbnMnKTtcblxuICAgICAgICBjb25zb2xlLmxvZygkcGFnZUVsLCBwYWdlTmFtZSk7XG5cbiAgICAgICAgLy8gcGFnZSBub3QgZm91bmQ6XG4gICAgICAgIGlmIChwYWdlTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAocGFnZU5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBcIiVzXCIgaW4gUGFnZXMhJywgcGFnZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFnZU5hbWUgPSAnUGFnZSc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3JlIHRoYW4gb25lIGRhdGEtcGFnZTpcbiAgICAgICAgaWYgKCRwYWdlRWwubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdPbmx5IG9uZSBbZGF0YS1wYWdlXSBlbGVtZW50LCBwbGVhc2UhJyk7XG5cbiAgICAgICAgLy8gcGFnZSBub3QgZGVmaW5lZCBpbiBodG1sOlxuICAgICAgICB9IGVsc2UgaWYgKCRwYWdlRWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAkcGFnZUVsID0gJCgkKCcjbWFpbicpLmZpbmQoJ2FydGljbGUnKVswXSB8fCAkKCcjbWFpbicpLmNoaWxkcmVuKCkuZmlyc3QoKVswXSk7XG4gICAgICAgIH1cblxuXG5cbiAgICAgICAgLy8gY3JlYXRlIFBhZ2Ugb2JqZWN0OlxuICAgICAgICBsZXQgcGFnZTogUGFnZSA9IG5ldyBwYWdlc1twYWdlTmFtZV0oJHBhZ2VFbCwgcGFnZU9wdGlvbnMpO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gcGFnZTtcblxuICAgICAgICAvLyBiaW5kIGV2ZW50czpcbiAgICAgICAgQVBJLmJpbmQoKTtcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uUGFnZVByb2dyZXNzKTtcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLkNIQU5HRSwgdGhpcy5vblBhZ2VBcHBlbmQpO1xuXG4gICAgICAgIHRoaXMub25SZXNpemUoKTtcblxuICAgICAgICByZXR1cm4gcGFnZS5wcmVsb2FkKCk7XG4gICAgfVxufVxuXG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBzaXRlID0gbmV3IFNpdGUoKTtcbiAgICBzaXRlLmluaXQoKTtcbn0pO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL3N0YXRzLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL21vZGVybml6ci5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi9TaXRlJztcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVVSUQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJycgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpICsgTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbn1cblxuXG5leHBvcnQgY29uc3Qga2V5cyA9IHtcbiAgICBlbnRlcjogMTMsXG4gICAgZXNjOiAyNyxcbiAgICBzcGFjZTogMzIsXG4gICAgbGVmdDogMzcsXG4gICAgdXA6IDM4LFxuICAgIHJpZ2h0OiAzOSxcbiAgICBkb3duOiA0MCxcbiAgICBwYWdlVXA6IDMzLFxuICAgIHBhZ2VEb3duOiAzNCxcbiAgICBlbmQ6IDM1LFxuICAgIGhvbWU6IDM2LFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdEF1dG9wbGF5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIE1vZGVybml6ci52aWRlb2F1dG9wbGF5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTW9kZXJuaXpyLm9uKCd2aWRlb2F1dG9wbGF5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb1RpbWUoc2VjOiBudW1iZXIpOiBzdHJpbmcge1xuXG4gICAgY29uc3QgdG90YWxTZWMgPSBwYXJzZUludCgnJyArIHNlYywgMTApO1xuICAgIGNvbnN0IGhvdXJzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDM2MDAsIDEwKSAlIDI0O1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gNjAsIDEwKSAlIDYwO1xuICAgIGNvbnN0IHNlY29uZHMgPSB0b3RhbFNlYyAlIDYwO1xuICAgIGNvbnN0IGhyc0Rpc3BsYXkgPSAoaG91cnMgPCAxMCA/ICcwJyArIGhvdXJzIDogaG91cnMpICsgJzonO1xuXG4gICAgcmV0dXJuIChob3VycyA+IDAgPyBocnNEaXNwbGF5IDogJycpICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArIChzZWNvbmRzIDwgMTAgPyAnMCcgKyBzZWNvbmRzIDogc2Vjb25kcyk7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHMoKTogU3RhdHMge1xuXG4gICAgY29uc3Qgc3RhdHMgPSBuZXcgU3RhdHMoKTtcblxuICAgIHN0YXRzLnNob3dQYW5lbCggMCApOyAvLyAwOiBmcHMsIDE6IG1zLCAyOiBtYiwgMys6IGN1c3RvbVxuICAgICQoc3RhdHMuZG9tKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6ICdub25lJywgJ3RvcCc6IDExMH0pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbSApO1xuXG4gICAgZnVuY3Rpb24gYW5pbWF0ZSgpOiB2b2lkIHtcbiAgICAgICAgc3RhdHMuYmVnaW4oKTtcbiAgICAgICAgLy8gbW9uaXRvcmVkIGNvZGUgZ29lcyBoZXJlXG4gICAgICAgIHN0YXRzLmVuZCgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcblxuICAgIHJldHVybiBzdGF0cztcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lRm9ybWF0KHRpbWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCkudG9TdHJpbmcoKTtcbiAgICBtaW51dGVzID0gKHBhcnNlSW50KG1pbnV0ZXMsIDEwKSA+PSAxMCkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcbiAgICBsZXQgc2Vjb25kcyA9IE1hdGguZmxvb3IodGltZSAlIDYwKS50b1N0cmluZygpO1xuICAgIHNlY29uZHMgPSAocGFyc2VJbnQoc2Vjb25kcywgMTApID49IDEwKSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMudG9TdHJpbmcoKSArICc6JyArIHNlY29uZHMudG9TdHJpbmcoKTtcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJbWFnZVNvdXJjZXMoKTogdm9pZCB7XG4gICAgaWYgKGJyb3dzZXIuaWUpIHtcbiAgICAgICAgJCgnW2RhdGEtaWVzcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLWllc3JjJykpO1xuICAgICAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1pZXNyYycpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkKCdbZGF0YS1zcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuXG4gICAgJCgnW2RhdGEtc3Jjc2V0XScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpKTtcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcbiAgICB9KTtcbn1cblxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKGltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWRbXT4ge1xuLy8gICAgIHJldHVybiBQcm9taXNlLmFsbChpbWFnZXMubWFwKChpbWFnZSk6IFByb21pc2U8dm9pZD4gPT4ge1xuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLy8gICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25hYm9ydCA9ICgpID0+IHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgIGltZy5zcmMgPSBpbWFnZTtcbi8vICAgICAgICAgICAgIGlmIChpbWcuY29tcGxldGUgJiYgJChpbWcpLmhlaWdodCgpID4gMCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxuLy8gICAgICAgICB9KTtcbi8vICAgICB9KSk7XG4vLyB9XG5cblxuXG4vLyBleHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXM6IEpRdWVyeSk6IFByb21pc2U8dm9pZFtdPiB7XG4vLyAgICAgbGV0IGlzQmFzZTY0OiBib29sZWFuO1xuLy8gICAgIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSAkaW1hZ2VzLnRvQXJyYXkoKVxuLy8gICAgICAgICAubWFwKChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xuLy8gICAgICAgICAgICAgbGV0IGltYWdlU291cmNlID0gaW1nLmN1cnJlbnRTcmMgfHwgaW1nLnNyYztcbi8vICAgICAgICAgICAgIGlmIChpbWFnZVNvdXJjZS5pbmRleE9mKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsJykgPj0gMCkgeyBpc0Jhc2U2NCA9IHRydWU7IH1cbi8vICAgICAgICAgICAgIHJldHVybiBpbWFnZVNvdXJjZTtcbi8vICAgICAgICAgfSk7XG5cbi8vICAgICAvLyBjb25zb2xlLmxvZyhpbWFnZXMpO1xuXG4vLyAgICAgaWYgKCFpc0Jhc2U2NCkge1xuLy8gICAgICAgICByZXR1cm4gcHJlbG9hZEltYWdlcyhpbWFnZXMpO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbi8vICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuLy8gICAgICAgICAgICAgICAgIGNoZWNrQW5kUHJlbG9hZEltYWdlcygkaW1hZ2VzKS50aGVuKCgpID0+IHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgICAgIH0pO1xuLy8gICAgICAgICAgICAgfSwgMjAwKTtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgfVxuLy8gfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlKGEpOiBBcnJheTxhbnk+IHtcbiAgICBsZXQgaiwgeCwgaTtcbiAgICBmb3IgKGkgPSBhLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB4ID0gYVtpXTtcbiAgICAgICAgYVtpXSA9IGFbal07XG4gICAgICAgIGFbal0gPSB4O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Um9vdFZhcnMoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gYnJlYWtwb2ludC5kZXNrdG9wID8gJCgnI25hdmJhcicpLmhlaWdodCgpIDogMDtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXBwLWhlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtIGhlYWRlckhlaWdodH1weGApO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtMjUnLCBgJHskKCcuY29sLXBhdHRlcm4tMjUnKS53aWR0aCgpfXB4YCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC02NicsIGAkeyQoJy5jb2wtNjYnKS53aWR0aCgpfXB4YCk7XG4gICAgbGV0IG1hcmcgPSAhYnJlYWtwb2ludC5kZXNrdG9wID8gNTAgOiAxMjA7XG4gICAgJCgnLmFzaWRlJykuY3NzKCdoZWlnaHQnLCAkd2luZG93LmhlaWdodCgpICsgbWFyZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcbiAgICAkKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNUKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xuICAgIGxldCBwb3NpdGlvbiA9IGJyb3dzZXIuaWUgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJztcbiAgICBsZXQgdG9wID0gYnJvd3Nlci5pZSA/ICcnIDogLXNUICsgJ3B4JztcbiAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgJCgnYm9keScpLmNzcyh7XG4gICAgICAgIC8vICdwb3NpdGlvbic6IHBvc2l0aW9uLFxuICAgICAgICAvLyAndG9wJzogdG9wLFxuICAgICAgICAvLyAnYm90dG9tJzogJzAnLFxuICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcbiAgICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RvcCcsXG4gICAgICAgICd3aWR0aCc6ICcxMDAlJyxcbiAgICAgICAgJ3RvdWNoLWFjdGlvbic6ICdub25lJyxcbiAgICB9KTtcblxufVxuXG5cbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnMgPSB7XG4gICAgJ2ludmFsaWQtZW1haWwnOiB7XG4gICAgICAgICdlbic6ICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MgZm9ybWF0JyxcbiAgICAgICAgJ3BsJzogJ05pZXBvcHJhd255IGZvcm1hdCBhZHJlc3UgZS1tYWlsJyxcbiAgICB9LFxuICAgICdyZXF1aXJlZC1maWVsZCc6IHtcbiAgICAgICAgJ2VuJzogJ1JlcXVpcmVkIGZpZWxkJyxcbiAgICAgICAgJ3BsJzogJ1BvbGUgb2Jvd2nEhXprb3dlJyxcbiAgICB9LFxuICAgICdpbnZhbGlkLXppcCc6IHtcbiAgICAgICAgJ2VuJzogJ0VudGVyIHppcC1jb2RlIGluIGZpdmUgZGlnaXRzIGZvcm1hdCcsXG4gICAgICAgICdwbCc6ICdXcGlzeiBrb2QgcG9jenRvd3kgdyBmb3JtYWNpZSBYWC1YWFgnLFxuICAgIH0sXG59O1xuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcblxuaW50ZXJmYWNlIElDaGFydFNldHRpbmdzIHtcbiAgICBpZDogbnVtYmVyO1xuICAgIHhQZXJjZW50OiBudW1iZXI7XG4gICAgeVBvaW50czogQXJyYXk8bnVtYmVyPjtcbiAgICBjb2xvcjogc3RyaW5nO1xuICAgIHlQeDogQXJyYXk8bnVtYmVyPjtcbiAgICBmaWxsPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIENoYXJ0IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcbiAgICBwcml2YXRlIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIG1hcmdpbjogYW55ID0ge1xuICAgICAgICB0b3A6IDUsXG4gICAgICAgIGxlZnQ6IDI1LFxuICAgICAgICByaWdodDogNTAsXG4gICAgICAgIGJvdHRvbTogNDlcbiAgICB9O1xuICAgIHByaXZhdGUgZ3JhcGg6IGFueSA9IHtcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgIHdpZHRoOiAwLFxuICAgIH07XG5cbiAgICBwcml2YXRlIGNvbG9yczogYW55ID0ge1xuICAgICAgICBncmF5OiAncmdiYSg5Nyw5Nyw5NywwLjUpJyxcbiAgICAgICAgb3JhbmdlOiAnI2ZjOGM1OScsXG4gICAgICAgIG1pbnQ6ICcjNGZkYmM1JyxcbiAgICAgICAgYmx1ZTogJyM1ODc3Y2MnLFxuICAgICAgICBwaW5rOiAnI0I2MEU2MycsXG4gICAgICAgIHdoaXRlOiAnI2ZmZicsXG4gICAgICAgIGJlaWdlOiAnI2ZkZDQ5ZScsXG4gICAgICAgIGNpbm5hYmFyOiAnI2U3NTA0MCcsXG4gICAgICAgIHNlYTogJyMyNmJiZTMnLFxuICAgIH1cblxuICAgIHByaXZhdGUgZ3JhcGhzRGF0YTogQXJyYXk8SUNoYXJ0U2V0dGluZ3M+ID0gW107XG4gICAgcHJpdmF0ZSBkYXRhSW5pdDogYm9vbGVhbjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR3cmFwcGVyID0gdGhpcy52aWV3LmZpbmQoJy5qcy13cmFwcGVyJyk7XG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1jaGFydC10YWJdJyk7XG4gICAgICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PnRoaXMudmlldy5maW5kKCdjYW52YXMnKVswXTtcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuXG4gICAgICAgIHRoaXMucmVzaXplKCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0ZUNoYXJ0KGksIGZhbHNlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmFuaW1hdGVDaGFydCgwLCB0cnVlKTtcbiAgICAgICAgdGhpcy5tYXJrVGFiKDApO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLiR3cmFwcGVyLndpZHRoKCk7XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuJHdyYXBwZXIuaGVpZ2h0KCk7XG5cbiAgICAgICAgdGhpcy5ncmFwaCA9IHtcbiAgICAgICAgICAgIHRvcDogdGhpcy5tYXJnaW4udG9wLFxuICAgICAgICAgICAgbGVmdDogdGhpcy5tYXJnaW4ubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0ICsgdGhpcy5tYXJnaW4ubGVmdCxcbiAgICAgICAgICAgIGJvdHRvbTogdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi50b3AgLSB0aGlzLm1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5sZWZ0IC0gdGhpcy5tYXJnaW4ucmlnaHQsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgICAgIGlmICghdGhpcy5kYXRhSW5pdCkge1xuICAgICAgICAgICAgdGhpcy5jcmVhdGVEYXRhT2JqZWN0KCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cblxuICAgIHByaXZhdGUgY3JlYXRlRGF0YU9iamVjdCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLiR0YWIuZWFjaCggKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJQ2hhcnRTZXR0aW5ncz57XG4gICAgICAgICAgICAgICAgaWQ6IGksXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXG4gICAgICAgICAgICAgICAgeVBvaW50czogJChlbCkuZGF0YSgncG9pbnRzJyksXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuc2V0Q29sb3IoJChlbCkuZGF0YSgnY29sb3InKSksXG4gICAgICAgICAgICAgICAgeVB4OiB0aGlzLmNhbGNZUHgoJChlbCkuZGF0YSgncG9pbnRzJykpLFxuICAgICAgICAgICAgICAgIGZpbGw6IGkgPT09IDAgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdyYXBoc0RhdGEucHVzaChkYXRhSXRlbSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZGF0YUluaXQgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmdyYXBoc0RhdGEpO1xuICAgIH1cblxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLiR0YWIub2ZmKCcudGFiJykub24oJ2NsaWNrLnRhYicsIHRoaXMub25DbGlja1RhYik7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9uQ2xpY2tUYWIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXG4gICAgICAgIGlmIChjdXJyZW50Lmhhc0NsYXNzKCdpcy1vbi1jaGFydCcpKSB7XG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVDaGFydChjdXJyZW50LmluZGV4KCksIGZhbHNlKTtcbiAgICAgICAgICAgIGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2lzLW9uLWNoYXJ0Jyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFuaW1hdGVDaGFydChjdXJyZW50LmluZGV4KCksIHRydWUpO1xuICAgICAgICAgICAgY3VycmVudC5hZGRDbGFzcygnaXMtb24tY2hhcnQnKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgbWFya1RhYihpZDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRhYi5lcShpZCkuYWRkQ2xhc3MoJ2lzLW9uLWNoYXJ0Jyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkcmF3ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZHJhd0JnKCk7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKCAoZ3JhcGhEYXRhKSA9PiB0aGlzLmRyYXdHcmFwaChncmFwaERhdGEpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRyYXdCZygpOiB2b2lkIHtcblxuXG4gICAgICAgIC8vIGRyYXcgWCBheGlzXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyggdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tICk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyggdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tICk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLmdyYXk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyggdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5tYXJnaW4udG9wICk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyggdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgdGhpcy5tYXJnaW4udG9wICk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIGNvbnN0IGhlbHBlcnNMaW5lID0gODtcbiAgICAgICAgY29uc3QgdGV4dFRyYW5zZm9ybSA9IDU7XG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xuICAgICAgICBsZXQgdmFsO1xuICAgICAgICBjb25zdCB5ZWFycyA9IFsyMDE1LCAyMDE2LCAyMDE3LCAyMDE4LCAyMDE5LCAyMDIwLCAyMDIxXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBoZWxwZXJzTGluZTsgaSsrKSB7XG4gICAgICAgICAgICB2YWwgPSA1MCAtIHN0ZXAgKiBpO1xuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMuYmx1ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgdmFsICsgJycsIDAsICggdGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wICsgdGV4dFRyYW5zZm9ybSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8oIHRoaXMubWFyZ2luLmxlZnQsICggdGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wICk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oIHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsICggdGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wICk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB5ZWFycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCgnJyArIHllYXJzW2pdICsgJycsICh0aGlzLmNhbnZhcy53aWR0aCArIHRoaXMubWFyZ2luLnJpZ2h0ICsgdGhpcy5tYXJnaW4ubGVmdCkgLyB5ZWFycy5sZW5ndGggKiBqICsgdGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGV4dFRyYW5zZm9ybSAqIDIpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBkcmF3R3JhcGggPSAoZGF0YTogSUNoYXJ0U2V0dGluZ3MpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBkYXRhLmNvbG9yO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAzO1xuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ3JvdW5kJztcbiAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG5cbiAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcbiAgICAgICAgICAgIGlmIChpIC8gYS5sZW5ndGggPD0gZGF0YS54UGVyY2VudCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0IC8gYS5sZW5ndGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0LCB5KTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgICAgIGlmIChkYXRhLmZpbGwpIHtcbiAgICAgICAgICAgIGxldCBsYXN0WCA9IHRoaXMubWFyZ2luLmxlZnQ7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAwLjQ7XG5cbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcblxuICAgICAgICAgICAgICAgIGlmIChpIC8gYS5sZW5ndGggPD0gZGF0YS54UGVyY2VudCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCAvIGEubGVuZ3RoICogaSArIHRoaXMuZ3JhcGgubGVmdCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0IC8gYS5sZW5ndGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obGFzdFgsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLmdyYXBoLnJpZ2h0IC8gYS5sZW5ndGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgLyBhLmxlbmd0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQsIHkpO1xuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IHRoaXMuZ3JhcGgucmlnaHQgLyBhLmxlbmd0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyB0aGlzLmN0eC5saW5lVG8obGFzdFgsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGFuaW1hdGVDaGFydChpZDogbnVtYmVyLCBkaXJlY3Rpb246IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZGlyID0gZGlyZWN0aW9uID8gMSA6IDA7XG4gICAgICAgIGdzYXAudG8odGhpcy5ncmFwaHNEYXRhW2lkXSwge1xuICAgICAgICAgICAgeFBlcmNlbnQ6IGRpcixcbiAgICAgICAgICAgIGVhc2U6ICdsaW5lYXInLFxuICAgICAgICAgICAgb25VcGRhdGU6IHRoaXMuZHJhdyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8vIEhFTFBFUlNcbiAgICBwcml2YXRlIGxhcmdlc3RZVmFsKGRhdGE6IEFycmF5PG51bWJlcj4pOiBudW1iZXIge1xuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IGRhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGFyZ2VzdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGNhbGNZUHgoZGF0YSk6IEFycmF5PG51bWJlcj4ge1xuICAgICAgICBjb25zdCBsYXJnZXN0ID0gdGhpcy5sYXJnZXN0WVZhbChkYXRhKTtcbiAgICAgICAgbGV0IGFyciA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSBNYXRoLnJvdW5kKCh0aGlzLmdyYXBoLmhlaWdodCAtIGRhdGFbaV0gLyBsYXJnZXN0ICogdGhpcy5ncmFwaC5oZWlnaHQpICsgdGhpcy5ncmFwaC50b3ApO1xuICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0Q29sb3IoY29sb3I6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgIGxldCBoZXg7XG5cbiAgICAgICAgZm9yIChjb25zdCBwcm9wZXJ0eSBpbiB0aGlzLmNvbG9ycykge1xuICAgICAgICAgICAgaWYgKGNvbG9yID09PSBwcm9wZXJ0eSkge1xuICAgICAgICAgICAgICAgIGhleCA9IHRoaXMuY29sb3JzW3Byb3BlcnR5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBoZXg7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdjaGFuZ2UnO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgSGFuZGxlciB7XG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPzogT2JqZWN0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGlmICghdmlld1swXSkgeyBjb25zb2xlLndhcm4oJ2NvbXBvbmVudCBidWlsdCB3aXRob3V0IHZpZXcnKTsgfVxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIHRoaXMpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcHJlbG9hZEltYWdlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgYW5pbWF0ZUluKGluZGV4PzogbnVtYmVyLCBkZWxheT86IG51bWJlcik6IHZvaWQgeyB9XG5cblxuXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gaWYgeW91IGRvbid0IHdhbnQgdG8gYW5pbWF0ZSBjb21wb25lbnQsXG4gICAgICAgIC8vIGp1c3QgcmV0dXJuIGVtcHR5IFByb21pc2U6XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbiAgICAgICAgLy8gaWYgeW91IG5lZWQgYW5pbWF0aW9uOlxuICAgICAgICAvLyByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgLy8gICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgLy8gICAgICAgICB9LFxuICAgICAgICAvLyAgICAgICAgIGR1cmF0aW9uOiAwLjMsXG4gICAgICAgIC8vICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9KTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHR1cm5PZmYoKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQgeyB9XG5cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4geyB9O1xuXG5cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIG51bGwpO1xuICAgICAgICB0aGlzLnZpZXcub2ZmKCk7XG4gICAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRvZ2dsZTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGJvZHk6IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzVG9nZ2xlZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIGJvZHlIZWlnaHQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0b2dnbGUgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWJ1dHRvbi10b2dnbGUnKTtcbiAgICAgICAgdGhpcy4kYm9keSA9IHRoaXMudmlldy5maW5kKCcuanMtZGFzaGJvYXJkLWJvZHknKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsU3RhdGUoKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcblxuICAgIH07XG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRvZ2dsZS5vZmYoJy50b2dnbGUnKS5vbignY2xpY2sudG9nZ2xlJywgdGhpcy50b2dnbGVQYW5lbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b2dnbGVQYW5lbCA9IChlKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5pc1RvZ2dsZWQpIHtcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kYm9keSwgeyBkdXJhdGlvbjogMC41LCBoZWlnaHQ6ICdhdXRvJywgZWFzZTogJ3Bvd2VyMi5pbk91dCcsXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy4kYm9keS5hZGRDbGFzcygnaXMtdG9nZ2xlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNUb2dnbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiRib2R5LnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnMCcsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgaW5pdGlhbFN0YXRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLnNldCh0aGlzLiRib2R5LCB7IGhlaWdodDogJzAnfSk7XG4gICAgfVxuICAgIFxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9GaWx0ZXJzJztcblxuZXhwb3J0IGNsYXNzIERyb3Bkb3duIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIFxuICAgIHByaXZhdGUgJHRyaWdnZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgJHNlbGVjdGVkOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRyaWdnZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRyaWdnZXInKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0XScpO1xuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZhbHVlXScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZCcsIHRoaXMuJHNlbGVjdGVkLnRleHQoKSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5vZmYoJy5zZWxlY3QnKS5vbignY2xpY2suc2VsZWN0JywgdGhpcy50b2dnbGUpO1xuICAgICAgICAkZG9jLm9mZignLmRyb3Bkb3duJykub24oJ2NsaWNrLmRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcbiAgICAgICAgdGhpcy4kaXRlbS5vZmYoJy5zZWxlY3Rpb24nKS5vbignY2xpY2suc2VsZWN0aW9uJywgdGhpcy5vbkl0ZW1DbGljayk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCd0b2dnbGUgZHAnKTtcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pc09wZW4sICdvcGVuPycpO1xuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pc09wZW4sICc/Pz8/PycpO1xuICAgICAgICBpZiAoJChlLmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCdqcy1pdGVtJykgJiYgIXRoaXMuaXNPcGVuKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uSXRlbUNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3ZhbHVlJyk7XG5cbiAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZC5odG1sKGN1cnJlbnQpO1xuXG4gICAgICAgIHRoaXMudmlldy5hdHRyKCdkYXRhLXNlbGVjdGVkLWNvdW50cnknLCBjdXJyZW50KTtcblxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKGN1cnJlbnQpO1xuICAgICAgICB9LCAzMDApO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5cbmV4cG9ydCBjbGFzcyBGaWx0ZXJzIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IEZpbHRlcnM7XG5cbiAgICBwcml2YXRlICRjbGVhcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHBhbmVsOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbVNlY3RvcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGl0ZW1UaW1lOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkdGltZWxpbmVJdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkYWxsU2VjdG9yczogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHBpY2tlZDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHNlbGVjdGVkQ291bnRyeTogSlF1ZXJ5O1xuXG4gICAgcHJpdmF0ZSBmaWx0ZXJzOiBBcnJheTxzdHJpbmc+ID0gW107XG4gICAgcHJpdmF0ZSBpc0FsbENoZWNrZWQ6IGJvb2xlYW47XG5cblxuICAgIHB1YmxpYyBzdGF0aWMgc2hvd1BpY2tlZEZpbHRlcnMoY291bnRyeT86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBsZXQgcGlja2VkU2VjdG9ycyA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuICAgICAgICBsZXQgcGlja2VkVGltZSA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG4gICAgICAgIGxldCBwaWNrZWRDb3VudHJ5ID0gY291bnRyeSA/IGNvdW50cnkgOiBGaWx0ZXJzLmluc3RhbmNlLiRzZWxlY3RlZENvdW50cnkudGV4dCgpO1xuXG5cbiAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmZpbmQoJ3NwYW4nKS5yZW1vdmUoKTtcblxuICAgICAgICBpZiAocGlja2VkU2VjdG9ycykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGlja2VkU2VjdG9ycyk7XG5cbiAgICAgICAgICAgIGlmIChwaWNrZWRTZWN0b3JzLmxlbmd0aCA9PT0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWFsJywgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycyk7XG4gICAgICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIEZpbHRlcnMuaW5zdGFuY2UuJGFsbFNlY3RvcnMudGV4dCgpICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcGlja2VkU2VjdG9ycy5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgJChlbCkudGV4dCgpICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwaWNrZWRDb3VudHJ5KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRDb3VudHJ5KTtcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRDb3VudHJ5ICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwaWNrZWRUaW1lKSB7XG4gICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgcGlja2VkVGltZS5kYXRhKCdpdGVtLWxhYmVsJykgKyAnPC9zcGFuPicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGNsZWFyID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbGVhcicpO1xuICAgICAgICB0aGlzLiRwYW5lbCA9IHRoaXMudmlldy5maW5kKCcuanMtcGFuZWwnKTtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3RvciA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xuICAgICAgICB0aGlzLiRpdGVtVGltZSA9IHRoaXMudmlldy5maW5kKCcuanMtdGltZScpO1xuICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdGltZV0nKTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycyA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbS1hbGwnKTtcbiAgICAgICAgdGhpcy4kcGlja2VkID0gJCgnLmpzLXBpY2tlZC1maWx0ZXInKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWRDb3VudHJ5ID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcblxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlID0gdGhpcztcbiAgICAgICAgY29uc29sZS5sb2coRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3RvciwgRmlsdGVycy5pbnN0YW5jZS52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdGVkXScpLmRhdGEoJ3NlbGVjdGVkJykpO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRjbGVhci5jc3MoJ2hlaWdodCcsIHRoaXMuJHBhbmVsLm91dGVySGVpZ2h0KCkpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3Iub2ZmKCcuc2VjdG9yJykub24oJ2NsaWNrLnNlY3RvcicsIHRoaXMudG9nZ2xlU2VjdG9yKTtcbiAgICAgICAgdGhpcy4kaXRlbVRpbWUub2ZmKCcudGltZScpLm9uKCdjbGljay50aW1lJywgdGhpcy50b2dnbGVUaW1lKTtcbiAgICAgICAgdGhpcy4kY2xlYXIub2ZmKCcuY2xlYXInKS5vbignY2xpY2suY2xlYXInLCB0aGlzLmNsZWFyQXJyYXkpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLm9mZignLmFsbCcpLm9uKCdjbGljay5hbGwnLCB0aGlzLm1hcmtBbGxTZWN0b3JzKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgbWFya0FsbFNlY3RvcnMgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IHRpbWVDaGVja2VkID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcblxuICAgICAgICB0aGlzLmNsZWFyQXJyYXkoKTtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSgkKGVsKSwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IHRydWU7XG5cbiAgICAgICAgaWYgKHRpbWVDaGVja2VkKSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KHRpbWVDaGVja2VkLCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICAgICAgdGhpcy5tYXJrVGltZWxpbmUodGltZUNoZWNrZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBjbGVhckFycmF5ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcbiAgICAgICAgdGhpcy4kaXRlbVRpbWUucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gZmFsc2U7XG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB0b2dnbGVTZWN0b3IgPSAoZSkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXG4gICAgICAgIGlmIChjdXJyZW50Lmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQWxsQ2hlY2tlZCkge1xuICAgICAgICAgICAgICAgIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgIH1cblxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZVRpbWUgPSAoZSkgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IGFjdGl2ZVByZXYgPSB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuXG4gICAgICAgICAgICBpZiAoYWN0aXZlUHJldikge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShhY3RpdmVQcmV2LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICAgICAgdGhpcy5tYXJrVGltZWxpbmUoY3VycmVudCk7XG4gICAgICAgIH1cblxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG1hcmtUaW1lbGluZShlbDogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgIGlmIChlbC5oYXNDbGFzcygnanMtdGltZScpKSB7XG4gICAgICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgY29uc3QgdGltZWxpbmVkb3QgPSB0aGlzLiR0aW1lbGluZUl0ZW0uZmlsdGVyKCdbZGF0YS10aW1lPScgKyBlbC5kYXRhKCdpdGVtJykgKyAnXScpO1xuICAgICAgICAgICAgdGltZWxpbmVkb3QuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHVubWFya1RpbWVsaW5lKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIH1cblxuICAgIHByaXZhdGUgcmVtb3ZlRWxlbWVudEZyb21BcnJheSgkZWw6IEpRdWVyeSwgYXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmZpbHRlcnMuaW5kZXhPZigkZWwuZGF0YSgnaXRlbScpKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGFycmF5LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdGSUxURVJTOicsIHRoaXMuZmlsdGVycyk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGFkZEVsZW1lbnRUb0FycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBhcnJheS5wdXNoKCRlbC5kYXRhKCdpdGVtJykpO1xuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cbmludGVyZmFjZSBJRGF0YVN0YXQge1xuICAgIHNlY3Rvcjogc3RyaW5nO1xuICAgIHZhbHVlOiBudW1iZXI7XG4gICAgY29sb3I6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIElHcmlkSXRlbVBvc2l0aW9uIHtcbiAgICBjb2x1bW5fc3RhcnQ6IG51bWJlcjtcbiAgICBjb2x1bW5fZW5kOiBudW1iZXI7XG4gICAgcm93X3N0YXJ0OiBudW1iZXI7XG4gICAgcm93X2VuZDogbnVtYmVyO1xufVxuXG5leHBvcnQgY2xhc3MgTWFzb25yeSBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIGRhdGE6IEFycmF5PElEYXRhU3RhdD4gPSBbXTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBkYXRhQXJyYXk6IEFycmF5PGFueT4gPSBbXTtcbiAgICBwcml2YXRlIGFyZWE6IG51bWJlcjtcbiAgICBwcml2YXRlIGl0ZW1NYXJnaW46IG51bWJlciA9IDM7XG4gICAgcHJpdmF0ZSBncmlkUm93czogbnVtYmVyID0gMjA7XG4gICAgcHJpdmF0ZSBncmlkQ29sczogbnVtYmVyID0gMjA7XG4gICAgcHJpdmF0ZSBncmlkQ2VsbHM6IG51bWJlciA9IHRoaXMuZ3JpZENvbHMgKiB0aGlzLmdyaWRSb3dzO1xuICAgIHByaXZhdGUgY2VsbHNCYWxhbmNlOiBudW1iZXIgPSB0aGlzLmdyaWRDZWxscztcbiAgICBwcml2YXRlIGdyaWRDZWxsOiBhbnkgPSB7XG4gICAgICAgIHdpZHRoOiB0aGlzLnZpZXcud2lkdGgoKSAvIHRoaXMuZ3JpZENvbHMsXG4gICAgICAgIGhlaWdodDogdGhpcy52aWV3LmhlaWdodCgpIC8gdGhpcy5ncmlkUm93cyxcbiAgICB9O1xuICAgIHByaXZhdGUgbWluQ2VsbFdpZHRoOiBudW1iZXIgPSAzO1xuICAgIHByaXZhdGUgbWluQ2VsbEhlaWdodDogbnVtYmVyID0gMztcblxuICAgIHByaXZhdGUgaXRlbVBvc2l0aW9uaW5nOiBBcnJheTxJR3JpZEl0ZW1Qb3NpdGlvbj4gPSBbXTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1tYXNvbnJ5LXRpbGUnKTtcbiAgICAgICAgdGhpcy4kaXRlbS5lYWNoKCAoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGFJdGVtID0gPElEYXRhU3RhdD57XG4gICAgICAgICAgICAgICAgc2VjdG9yOiAkKGVsKS5kYXRhKCd0aWxlJyksXG4gICAgICAgICAgICAgICAgdmFsdWU6ICQoZWwpLmRhdGEoJ3ZhbHVlJyksXG4gICAgICAgICAgICAgICAgY29sb3I6ICQoZWwpLmRhdGEoJ2NvbG9yJyksXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YUl0ZW0pO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5hcmVhID0gKHRoaXMudmlldy53aWR0aCgpIC0gdGhpcy5pdGVtTWFyZ2luICogMykgKiB0aGlzLnZpZXcuaGVpZ2h0KCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kYXRhLCB0aGlzLmFyZWEsICdjZWxsIHdpZHRoJywgdGhpcy5ncmlkQ2VsbC53aWR0aCwgJ2NlbGwgaGVpZ2h0JywgdGhpcy5ncmlkQ2VsbC5oZWlnaHQpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuICAgICAgICBcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKCk7XG4gICAgICAgIHRoaXMuZ2V0QXJyRnJvbU9iamVjdCgpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZ2V0QXJyRnJvbU9iamVjdCgpOiBhbnkge1xuICAgICAgICB0aGlzLmRhdGFBcnJheSA9IE9iamVjdC5lbnRyaWVzKHRoaXMuZGF0YSkuc29ydCgoYSwgYikgPT4gYVswXS5sb2NhbGVDb21wYXJlKGJbMF0pKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGFBcnJheSk7XG5cbiAgICAgICAgdGhpcy5kYXRhQXJyYXkuZm9yRWFjaCggKGVsLCBpKSA9PiB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbFsxXS52YWx1ZSwgaSwgJ2VsJyk7XG4gICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGVsWzFdLnZhbHVlO1xuICAgICAgICAgICAgY29uc3Qgc2VjdG9yID0gZWxbMV0uc2VjdG9yO1xuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBlbFsxXS5jb2xvcjtcbiAgICAgICAgICAgIGNvbnN0IGluZGV4ID0gaTtcblxuICAgICAgICAgICAgLy8gdGhpcy5zZXRUaWxlU2l6ZShzZWN0b3IsIHZhbHVlLCBjb2xvciwgaW5kZXgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHNldFRpbGVTaXplKHNlY3Rvcjogc3RyaW5nLCB2YWx1ZTogbnVtYmVyLCBjb2xvcjogc3RyaW5nLCBpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLiRpdGVtLmZpbHRlcignW2RhdGEtdGlsZT0nICsgc2VjdG9yICsgJ10nKTtcbiAgICAgICAgbGV0IGFyZWEsIGgsIHcsIHQsIGwsIGNvbHVtbl9zdGFydCwgY29sdW1uX2VuZCwgcm93X3N0YXJ0LCByb3dfZW5kLCBpdGVtLCBhcmVhR3JpZDtcbiAgICAgICAgXG4gICAgICAgIGFyZWEgPSB0aGlzLmFyZWEgKiAodmFsdWUgLyAxMDApO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGFyZWEsICc6YXJlYScsIHRoaXMuaXRlbVBvc2l0aW9uaW5nLHRoaXMuaXRlbVBvc2l0aW9uaW5nLmxlbmd0aCA+IDAsICdjaGVjayBpZiBzb21lIGl0ZW0gb24gYXJyYXknKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xuICAgICAgICAgICAgY29sdW1uX3N0YXJ0ID0gMTtcbiAgICAgICAgICAgIHJvd19zdGFydCA9IDE7XG4gICAgICAgICAgICByb3dfZW5kID0gdGhpcy5ncmlkUm93cztcbiAgICAgICAgICAgIGNvbHVtbl9lbmQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC5oZWlnaHQgKiByb3dfZW5kKSAvIHRoaXMuZ3JpZENlbGwud2lkdGgpO1xuICAgICAgICAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSk7XG4gICAgICAgICAgICBhcmVhR3JpZCA9IGFyZWFHcmlkICUgMiA9PT0gMCA/IGFyZWFHcmlkIDogYXJlYUdyaWQgLSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gaWYgKGluZGV4ID4gMCkge1xuICAgICAgICAvLyAgICAgY29sdW1uX3N0YXJ0ID0gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgPCB0aGlzLmdyaWRDb2xzIC0gdGhpcy5taW5DZWxsV2lkdGggPyB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0xXS5jb2x1bW5fZW5kICsgMSA6IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTJdLmNvbHVtbl9lbmQgKyAxO1xuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgPj0gNiA/IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA6IDY7XG4gICAgICAgIC8vICAgICBhcmVhR3JpZCA9IGFyZWFHcmlkICUgMiA9PT0gMCA/IGFyZWFHcmlkIDogYXJlYUdyaWQgLSAxO1xuICAgICAgICAvLyAgICAgY29sdW1uX2VuZCA9IGFyZWFHcmlkIC8gdGhpcy5taW5DZWxsV2lkdGggXG5cbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGFyZWFHcmlkLCAnYW1vdW50IG9mIGNlbGxzJyk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBpdGVtID0gPElHcmlkSXRlbVBvc2l0aW9uPntcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydDogY29sdW1uX3N0YXJ0LFxuICAgICAgICAgICAgY29sdW1uX2VuZDogY29sdW1uX2VuZCxcbiAgICAgICAgICAgIHJvd19zdGFydDogcm93X3N0YXJ0LFxuICAgICAgICAgICAgcm93X2VuZDogcm93X2VuZCxcbiAgICAgICAgfTtcblxuICAgICAgICBjdXJyZW50LmNzcyh7XG4gICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAnZ3JpZC1jb2x1bW4tc3RhcnQnOiBjb2x1bW5fc3RhcnQsXG4gICAgICAgICAgICAnZ3JpZC1jb2x1bW4tZW5kJzogY29sdW1uX2VuZCxcbiAgICAgICAgICAgICdncmlkLXJvdy1zdGFydCc6IHJvd19zdGFydCxcbiAgICAgICAgICAgICdncmlkLXJvdy1lbmQnOiAnc3BhbicgKyByb3dfZW5kLFxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcixcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pdGVtUG9zaXRpb25pbmcucHVzaChpdGVtKTtcbiAgICAgICAgdGhpcy5jZWxsc0JhbGFuY2UgPSB0aGlzLmNlbGxzQmFsYW5jZSAtIGFyZWFHcmlkO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmNlbGxzQmFsYW5jZSwgJzpmcmVlIGNlbGxzJyk7XG4gICAgICAgIFxuICAgIH1cblxufVxuIiwiaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5cblxuXG5pbnRlcmZhY2UgSVBhcmFsbGF4U2V0dGluZ3Mge1xuICAgIGVsZW1lbnRzOiBBcnJheTxzdHJpbmc+O1xuICAgIG1vdmVYOiBBcnJheTxudW1iZXI+O1xuICAgIG1vdmVZOiBBcnJheTxudW1iZXI+O1xufVxuXG5cbmludGVyZmFjZSBJUGFyYWxsYXhFbGVtZW50RGF0YSB7XG4gICAgJGVsOiBKUXVlcnk7XG4gICAgbW92ZVg6IG51bWJlcjtcbiAgICBtb3ZlWTogbnVtYmVyO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFBhcmFsbGF4IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgbW92ZVg6IG51bWJlcjtcbiAgICBwcml2YXRlIG1vdmVZOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB0aW1lOiBudW1iZXIgPSAyO1xuICAgIHByaXZhdGUgc2V0dGluZ3M6IElQYXJhbGxheFNldHRpbmdzO1xuICAgIHByaXZhdGUgaXRlbXM6IElQYXJhbGxheEVsZW1lbnREYXRhW107XG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmNyZWF0ZVZhbHVlQXJyYXkoKTtcblxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnUGFyYWxsYXgnLCB0aGlzKTtcblxuXG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3ApIHtcbiAgICAgICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3Lm9uKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjcmVhdGVWYWx1ZUFycmF5KCk6IHZvaWQge1xuICAgICAgICBjb25zdCBzZWxlY3RvcnMgPSAodGhpcy5zZXR0aW5ncy5lbGVtZW50cykudG9TdHJpbmcoKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XG4gICAgICAgIGNvbnN0IG1vdmVYID0gKHRoaXMuc2V0dGluZ3MubW92ZVgpLm1hcChOdW1iZXIpO1xuICAgICAgICBjb25zdCBtb3ZlWSA9ICh0aGlzLnNldHRpbmdzLm1vdmVZKS5tYXAoTnVtYmVyKTtcblxuICAgICAgICB0aGlzLml0ZW1zID0gc2VsZWN0b3JzLm1hcCgoc2VsLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSB0aGlzLnZpZXcuZmluZCgnLicgKyBzZWwpO1xuICAgICAgICAgICAgaWYgKCEkZWxbMF0pIHsgY29uc29sZS53YXJuKGBUaGVyZSBpcyBubyAuJHtzZWx9IGVsZW1lbnQgdG8gdXNlIGluIHBhcmFsbGF4YCk7IH1cbiAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgbW92ZVg6IG1vdmVYW2ldLFxuICAgICAgICAgICAgICAgIG1vdmVZOiBtb3ZlWVtpXSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pLmZpbHRlcigoaXRlbSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICEhaXRlbS4kZWxbMF07XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uTW91c2VNb3ZlID0gKGV2ZW50KTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMubW92ZVggPSAoIGV2ZW50LmNsaWVudFggLyB3aW5kb3cuaW5uZXJXaWR0aCkgLSAwLjU7XG4gICAgICAgIHRoaXMubW92ZVkgPSAoIGV2ZW50LmNsaWVudFkgLyB3aW5kb3cuaW5uZXJIZWlnaHQpIC0gMC41O1xuXG4gICAgICAgIHRoaXMuYW5pbWF0ZSgtdGhpcy5tb3ZlWCwgLXRoaXMubW92ZVkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGFuaW1hdGUobW92ZVgsIG1vdmVZKTogdm9pZCB7XG4gICAgICAgIGlmICghdGhpcy5pdGVtcykgeyByZXR1cm47IH1cbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XG4gICAgICAgICAgICBnc2FwLnRvKGl0ZW0uJGVsLCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHRoaXMudGltZSxcbiAgICAgICAgICAgICAgICB4OiBtb3ZlWCAqIGl0ZW0ubW92ZVgsXG4gICAgICAgICAgICAgICAgeTogbW92ZVkgKiBpdGVtLm1vdmVZLFxuICAgICAgICAgICAgICAgIGVhc2U6ICdwb3dlcjInLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5cbmV4cG9ydCBjbGFzcyBSYW5nZSBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlICRzZWxlY3RlZDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHJhZGlvOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKTtcbiAgICAgICAgdGhpcy4kcmFkaW8gPSB0aGlzLnZpZXcuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdHJpZ2dlci5vZmYoJy50b2dnbGUnKS5vbignY2xpY2sudG9nZ2xlJywgdGhpcy50b2dnbGUpO1xuICAgICAgICAkZG9jLm9mZignLnNtYWxsZHJvcGRvd24nKS5vbignY2xpY2suc21hbGxkcm9wZG93bicsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XG4gICAgICAgIHRoaXMuJHJhZGlvLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5pc09wZW4sICdvcGVuPycpO1xuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSB8fCAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuYXR0cigndmFsdWUnKTtcblxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XG5cbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuYXR0cignZGF0YS1zZWxlY3RlZCcsIGN1cnJlbnQpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBTd2lwZSwgU3dpcGVFdmVudHMsIElTd2lwZUNvb3JkaW5hdGVzIH0gZnJvbSAnLi9Td2lwZSc7XG4vLyBpbXBvcnQgeyBQbGF5ZXIgfSBmcm9tICcuL1BsYXllcic7XG5cbmludGVyZmFjZSBJU2xpZGVyU2V0dGluZ3Mge1xuICAgIHR5cGU6IHN0cmluZyxcbiAgICBtb2RlOiBzdHJpbmcsXG4gICAgcGhvbmU/OiBzdHJpbmcsXG4gICAgZGVza3RvcD86IHN0cmluZyxcbn1cblxuZXhwb3J0IGNsYXNzIFNsaWRlciBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkbGlzdDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgb2Zmc2V0OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgaW5kZXg6IG51bWJlciA9IDE7XG4gICAgLy8gcHJpdmF0ZSBjb3VudDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlICRidXR0b25QcmV2OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkYnV0dG9uTmV4dDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGRvdDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgc3dpcGU6IFN3aXBlO1xuICAgIHByaXZhdGUgaXRlbVdpZHRoOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBtYXJnaW46IG51bWJlciA9IDMyO1xuICAgIHByaXZhdGUgc2V0dGluZ3M6IElTbGlkZXJTZXR0aW5ncztcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xuICAgICAgICB0aGlzLiRsaXN0ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1saXN0Jyk7XG4gICAgICAgIHRoaXMuJGJ1dHRvblByZXYgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXByZXYnKTtcbiAgICAgICAgdGhpcy4kYnV0dG9uTmV4dCA9IHRoaXMudmlldy5maW5kKCcuanMtbmV4dCcpO1xuICAgICAgICB0aGlzLiRkb3QgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWRvdCcpO1xuICAgICAgICB0aGlzLm1hcmdpbiA9IHRoaXMuJGl0ZW0ub3V0ZXJXaWR0aCh0cnVlKSAtIHRoaXMuJGl0ZW0ud2lkdGgoKTtcbiAgICAgICAgdGhpcy5pdGVtV2lkdGggPSB0aGlzLiRpdGVtLndpZHRoKCkgKyB0aGlzLm1hcmdpbjtcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHR5cGU6ICcnLFxuICAgICAgICB9LCBvcHRpb25zIHx8IHZpZXcuZGF0YSgnb3B0aW9ucycpIHx8IHt9KTtcblxuICAgICAgICAvLyBpZiAodGhpcy5zZXR0aW5ncy5tYXJnaW4pIHtcbiAgICAgICAgLy8gICAgIHRoaXMubWFyZ2luID0gdGhpcy5zZXR0aW5ncy5tYXJnaW47XG4gICAgICAgIC8vIH1cblxuICAgICAgICBpZiAoYnJlYWtwb2ludC5waG9uZSAmJiAodGhpcy5zZXR0aW5ncy50eXBlICA9PT0gJ3Bob25lLWRpc2FibGUnIHx8IHRoaXMuc2V0dGluZ3MucGhvbmUgPT09ICdkaXNhYmxlZCcpKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWJyZWFrcG9pbnQuZGVza3RvcCAmJiB0aGlzLnNldHRpbmdzLm1vZGUgPT09ICdjZW50ZXItbW9iaWxlJykge1xuICAgICAgICAgICAgdGhpcy5zZXR0aW5ncy5tb2RlID0gJ2NlbnRlcic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYnJlYWtwb2ludC50YWJsZXQgJiYgdGhpcy5zZXR0aW5ncy5tb2RlID09PSAnY2VudGVyLXRhYmxldCcpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0dGluZ3MubW9kZSA9ICdjZW50ZXInO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuXG4gICAgICAgIGNvbnN0IHN3aXBlRWwgPSBicmVha3BvaW50LmRlc2t0b3AgPyB0aGlzLiRsaXN0IDogdGhpcy4kaXRlbS5maXJzdCgpO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zd2lwZSA9IG5ldyBTd2lwZSh0aGlzLiRsaXN0LCB7XG4gICAgICAgICAgICBob3Jpem9udGFsOiB0cnVlLFxuICAgICAgICAgICAgdmVydGljYWw6IGZhbHNlLFxuICAgICAgICAgICAgbWluaW11bTogODAsXG4gICAgICAgICAgICBkaXNhYmxlTW91c2U6IGZhbHNlLFxuICAgICAgICAgICAgZGlzYWJsZVRvdWNoOiBmYWxzZSxcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuc3dpcGUub24oU3dpcGVFdmVudHMuRU5ELCB0aGlzLm9uU3dpcGUpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuJGl0ZW0ub3V0ZXJXaWR0aCh0cnVlKSAtIHRoaXMuJGl0ZW0ud2lkdGgoKSk7XG4gICAgfVxuXG4gICAgXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChicmVha3BvaW50LnBob25lICYmICh0aGlzLnNldHRpbmdzLnR5cGUgPT09ICdwaG9uZS1kaXNhYmxlJyB8fCB0aGlzLnNldHRpbmdzLnBob25lID09PSAnZGlzYWJsZWQnKSkgeyByZXR1cm47IH1cbiAgICAgICAgdGhpcy5pdGVtV2lkdGggPSB0aGlzLiRpdGVtLndpZHRoKCkgKyB0aGlzLm1hcmdpbjtcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy5pdGVtV2lkdGggKiB0aGlzLiRpdGVtLmxlbmd0aDtcbiAgICAgICAgdGhpcy4kbGlzdC5jc3MoJ3dpZHRoJywgd2lkdGgpO1xuICAgICAgICB0aGlzLmdvKHRoaXMuaW5kZXgpO1xuICAgIH07XG5cblxuICAgIHByaXZhdGUgaW5pdCgpOiB2b2lkIHtcbiAgICAgICAgXG5cbiAgICAgICAgZ3NhcC5zZXQodGhpcy4kbGlzdCwgeyB4OiB0aGlzLm9mZnNldCB9KTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtcygpO1xuICAgICAgICB0aGlzLnJlc2l6ZURvdHMoKTtcblxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5tb2RlID09PSAnY2VudGVyJyAmJiB0aGlzLiRpdGVtLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSAyO1xuICAgICAgICAgICAgdGhpcy5nbygyKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kYnV0dG9uUHJldi5vZmYoJy5zbGlkZXJjdXN0b20nKS5vbignY2xpY2suc2xpZGVyY3VzdG9tJywgKGUpID0+IHRoaXMucHJldigpKTtcbiAgICAgICAgdGhpcy4kYnV0dG9uTmV4dC5vZmYoJy5zbGlkZXJjdXN0b20nKS5vbignY2xpY2suc2xpZGVyY3VzdG9tJywgKGUpID0+IHRoaXMubmV4dCgpKTtcbiAgICAgICAgdGhpcy4kZG90Lm9mZignLnNsaWRlcmN1c3RvbScpLm9uKCdjbGljay5zbGlkZXJjdXN0b20nLCAoZSkgPT4gdGhpcy5jbGlja0VsZW1lbnQoZSkpO1xuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNsaWRlcmN1c3RvbScpLm9uKCdjbGljay5zbGlkZXJjdXN0b20nLCAoZSkgPT4gdGhpcy5jbGlja0VsZW1lbnQoZSkpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSByZXNpemVEb3RzKCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuJGRvdCkgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKHRoaXMuJGRvdC5sZW5ndGggPiA3KSB7XG4gICAgICAgICAgICB0aGlzLiRkb3QuZWFjaCggZWwgPT4ge1xuICAgICAgICAgICAgICAgICQoZWwpLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6ICcxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxMHB4JyxcbiAgICAgICAgICAgICAgICAgICAgJ21hcmdpbi1sZWZ0JzogJzNweCcsXG4gICAgICAgICAgICAgICAgICAgICdtYXJnaW4tcmlnaHQnOiAnM3B4J1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBvblN3aXBlID0gKGU6IElTd2lwZUNvb3JkaW5hdGVzKTogdm9pZCA9PiB7XG4gICAgICAgIGlmIChlLmRpcmVjdGlvbiA9PT0gJ2xlZnQnIHx8IGUuZGlyZWN0aW9uID09PSAncmlnaHQnKSB7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlLmRpcmVjdGlvbiwgZS4pO1xuICAgICAgICAgICAgdGhpcy5zaGlmdCh7XG4gICAgICAgICAgICAgICAgbGVmdDogKzEsIHJpZ2h0OiAtMSxcbiAgICAgICAgICAgIH1bZS5kaXJlY3Rpb25dKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHNoaWZ0KGRpcjogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGxldCBvbGQ7XG5cbiAgICAgICAgaWYgKGRpciA9PT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucHJldigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5uZXh0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjbGlja0VsZW1lbnQoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBjb25zb2xlLmxvZygkKGUudGFyZ2V0KSk7XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5oYXNDbGFzcygnc2hhcmVfX2J1dHRvbicpIHx8ICQoZS50YXJnZXQpLmhhc0NsYXNzKCdldmFsdWF0aW9uJykgfHwgJChlLnRhcmdldCkuaGFzQ2xhc3MoJ3NsaWRlcl9faXRlbS1mb290ZXInKSkgeyByZXR1cm4gOyB9XG4gICAgICAgIGxldCBlbCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgbGV0IGkgPSBlbC5pbmRleCgpICsgMTtcbiAgICAgICAgdGhpcy5pbmRleCA9IGk7XG5cbiAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4KTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgbmV4dCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaW5kZXggPCB0aGlzLiRpdGVtLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5pbmRleCA9IHRoaXMuaW5kZXggKyAxO1xuICAgICAgICAgICAgdGhpcy5nbyh0aGlzLmluZGV4KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBwcmV2KCk6IHZvaWQge1xuICAgICAgICBpZiAodGhpcy5pbmRleCA+IDEpIHtcbiAgICAgICAgICAgIHRoaXMuaW5kZXggPSB0aGlzLmluZGV4IC0gMTtcbiAgICAgICAgICAgIHRoaXMuZ28odGhpcy5pbmRleCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBnbyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIC8vIFBsYXllci5wYXVzZUFsbCgpO1xuICAgICAgICBsZXQgeCA9IChpbmRleCAqIHRoaXMuaXRlbVdpZHRoKSAtIHRoaXMuaXRlbVdpZHRoO1xuICAgICAgICB4ID0gdGhpcy5zZXR0aW5ncy5tb2RlID09PSAnY2VudGVyJyA/ICh4IC0gKCR3aW5kb3cud2lkdGgoKSAqIDAuNSkgLSB0aGlzLm1hcmdpbikgKyB0aGlzLml0ZW1XaWR0aCAqIDAuNSA6IHhcbiAgICAgICAgZ3NhcC50byh0aGlzLiRsaXN0LCB7IGR1cmF0aW9uOiAwLjUsIHg6IC14LCB0cmFuc2Zvcm1PcmlnaW46ICc1MCUgNTAlJywgIGVhc2U6ICdzaW5lLmluT3V0Jywgb25Db21wbGV0ZTogKCkgPT4ge30gfSk7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVJdGVtcygpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVJdGVtcygpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zZXROYXZBdmFpbGJpbGl0eSgpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLiRpdGVtLmVxKHRoaXMuaW5kZXggLSAxKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGRvdC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGRvdC5lcSh0aGlzLmluZGV4IC0gMSkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuXG4gICAgICAgIHRoaXMuc2V0SW5WaWV3SXRlbUNsYXNzKCk7XG4gICAgfVxuXG4gICAgLy8gVG8gbWFrZSB2aXNpYmxlIHNvY2lhbCBmb290ZXIgZm9yIG5leHQgaXRlbSBpbiBhcnRpY2xlIHNsaWRlclxuICAgIHByaXZhdGUgc2V0SW5WaWV3SXRlbUNsYXNzKCk6IHZvaWQge1xuICAgICAgICBpZiAoIWJyZWFrcG9pbnQucGhvbmUgJiYgdGhpcy5zZXR0aW5ncy50eXBlID09PSAnYXJ0aWNsZScpIHtcbiAgICAgICAgICAgIHRoaXMuJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWluLXZpZXcnKTtcbiAgICAgICAgICAgIHRoaXMuJGl0ZW0uZmlsdGVyKCcuaXMtYWN0aXZlJykubmV4dCgpLmFkZENsYXNzKCdpcy1pbi12aWV3Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgc2V0TmF2QXZhaWxiaWxpdHkoKTogdm9pZCB7XG5cbiAgICAgICAgc3dpdGNoICh0cnVlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgdGhpcy5pbmRleCA9PSAxOlxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblByZXYuYWRkQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV4dC5yZW1vdmVDbGFzcygnaXMtZGlzYWJsZWQnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSB0aGlzLmluZGV4ID09PSB0aGlzLiRpdGVtLmxlbmd0aDpcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXh0LmFkZENsYXNzKCdpcy1kaXNhYmxlZCcpO1xuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblByZXYucmVtb3ZlQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5leHQucmVtb3ZlQ2xhc3MoJ2lzLWRpc2FibGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uUHJldi5yZW1vdmVDbGFzcygnaXMtZGlzYWJsZWQnKTtcblxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgJHdpbmRvdyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSAkdGFiOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHdyYXA6IEpRdWVyeTtcbiAgICBwcml2YXRlICRjdXJyZW50OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSB0YWJUb1Nob3c6IG51bWJlcjsgLy8gZm9yIGFzeW5jIHN3aXRjaFxuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0YWIgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdGFiXScpO1xuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZpZXddJyk7XG4gICAgICAgIHRoaXMuJHdyYXAgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRhYnMtd3JhcHBlcicpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcoMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uVGFiQ2xpY2spO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uVGFiQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhpbmRleCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFiVG9TaG93ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuJHRhYi5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJHRhYi5maWx0ZXIoJ1tkYXRhLXRhYj0nICsgaW5kZXggKyAnXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5oaWRlQ3VycmVudCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93KHRoaXMudGFiVG9TaG93KTtcbiAgICAgICAgICAgIHRoaXMudGFiVG9TaG93ID0gbnVsbDtcbiAgICAgICAgICAgICR3aW5kb3cucmVzaXplKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGhpZGVDdXJyZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLiRjdXJyZW50KSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGN1cnJlbnQsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY3VycmVudC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2hvdyhpbmRleDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXZpZXc9JyArIGluZGV4ICsgJ10nKTtcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgZ3NhcC5mcm9tVG8odGhpcy4kY3VycmVudCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC43LFxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xuaW1wb3J0IHsgJGRvYyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4uL0Jyb3dzZXInO1xuXG5cbmV4cG9ydCBpbnRlcmZhY2UgSVN3aXBlQ29vcmRpbmF0ZXMge1xuICAgIHg/OiBudW1iZXI7XG4gICAgeT86IG51bWJlcjtcbiAgICBzdGFydFg/OiBudW1iZXI7XG4gICAgc3RhcnRZPzogbnVtYmVyO1xuICAgIGRlbHRhWD86IG51bWJlcjtcbiAgICBkZWx0YVk/OiBudW1iZXI7XG4gICAgZGlyZWN0aW9uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElTd2lwZU9wdGlvbnMge1xuICAgIHZlcnRpY2FsPzogYm9vbGVhbjtcbiAgICBob3Jpem9udGFsPzogYm9vbGVhbjtcbiAgICBtaW5pbXVtPzogbnVtYmVyO1xuICAgIGRpc2FibGVNb3VzZT86IGJvb2xlYW47XG4gICAgZGlzYWJsZVRvdWNoPzogYm9vbGVhbjtcbiAgICBoYW5kbGVyPzogSlF1ZXJ5IHwgSFRNTEVsZW1lbnQgfCBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBTd2lwZUV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyBTVEFSVDogc3RyaW5nID0gJ3N0YXJ0JztcbiAgICBwdWJsaWMgc3RhdGljIFVQREFURTogc3RyaW5nID0gJ3VwZGF0ZSc7XG4gICAgcHVibGljIHN0YXRpYyBFTkQ6IHN0cmluZyA9ICdlbmQnO1xufVxuXG5leHBvcnQgY2xhc3MgU3dpcGVBeGVzIHtcbiAgICBwdWJsaWMgc3RhdGljIEhPUklaT05UQUw6IHN0cmluZyA9ICdoJztcbiAgICBwdWJsaWMgc3RhdGljIFZFUlRJQ0FMOiBzdHJpbmcgPSAndic7XG59XG5cbmV4cG9ydCBjbGFzcyBTd2lwZURpcmVjdGlvbnMge1xuICAgIHB1YmxpYyBzdGF0aWMgTEVGVDogc3RyaW5nID0gJ2xlZnQnO1xuICAgIHB1YmxpYyBzdGF0aWMgUklHSFQ6IHN0cmluZyA9ICdyaWdodCc7XG4gICAgcHVibGljIHN0YXRpYyBVUDogc3RyaW5nID0gJ3VwJztcbiAgICBwdWJsaWMgc3RhdGljIERPV046IHN0cmluZyA9ICdkb3duJztcbiAgICBwdWJsaWMgc3RhdGljIE5PTkU6IHN0cmluZyA9ICdub25lJztcbiAgICBwdWJsaWMgc3RhdGljIENMSUNLOiBzdHJpbmcgPSAnY2xpY2snO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFN3aXBlIGV4dGVuZHMgSGFuZGxlciB7XG5cbiAgICBwdWJsaWMgc3dpcGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgLy8gZGVsdGEgb2YgY3VycmVudCBtb3ZlbWVudDpcbiAgICBwdWJsaWMgZGVsdGFYOiBudW1iZXIgPSAwO1xuICAgIHB1YmxpYyBkZWx0YVk6IG51bWJlciA9IDA7XG5cbiAgICAvLyBjdXJyZW50IHBvc2l0aW9uOlxuICAgIHB1YmxpYyB4OiBudW1iZXIgPSAwO1xuICAgIHB1YmxpYyB5OiBudW1iZXIgPSAwO1xuXG4gICAgcHJpdmF0ZSAkaGFuZGxlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgc3RhcnRYOiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgc3RhcnRZOiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgdWlkOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSBtb3VzZTogSVN3aXBlQ29vcmRpbmF0ZXMgPSB7IHg6IDAsIHk6IDAgfTtcbiAgICBwcml2YXRlIGRyYWdnZWQ6IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlIGF4ZTogU3dpcGVBeGVzID0gbnVsbDtcblxuICAgIHByaXZhdGUgb2Zmc2V0WDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlIG9mZnNldFk6IG51bWJlciA9IDA7XG5cbiAgICBwcml2YXRlIGRpc2FibGVkOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlIHNldHRpbmdzOiBJU3dpcGVPcHRpb25zO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPzogSVN3aXBlT3B0aW9ucykge1xuICAgICAgICBzdXBlcigpO1xuXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSAkLmV4dGVuZCh7XG4gICAgICAgICAgICBob3Jpem9udGFsOiB0cnVlLFxuICAgICAgICAgICAgdmVydGljYWw6IGZhbHNlLFxuICAgICAgICAgICAgbWluaW11bTogODAsXG4gICAgICAgICAgICBkaXNhYmxlTW91c2U6IGZhbHNlLFxuICAgICAgICAgICAgZGlzYWJsZVRvdWNoOiBmYWxzZSxcbiAgICAgICAgICAgIGhhbmRsZXI6IG51bGwsXG4gICAgICAgIH0sIG9wdGlvbnMgfHwge30pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5zd2lwaW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuJGhhbmRsZXIgPSAodGhpcy5zZXR0aW5ncy5oYW5kbGVyID8gJCh0aGlzLnNldHRpbmdzLmhhbmRsZXIpIDogdGhpcy52aWV3KTtcblxuICAgICAgICB0aGlzLnVwZGF0ZUN1cnNvcigpO1xuICAgICAgICB0aGlzLnVpZCA9IFV0aWxzLmdlbmVyYXRlVUlEKCk7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgICAgICB0aGlzLnVuYmluZCgpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgdG9nZ2xlKGVuYWJsZTogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gIWVuYWJsZTtcbiAgICAgICAgdGhpcy51cGRhdGVDdXJzb3IoKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGVuZCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKCEhdGhpcy5zd2lwaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmVuZFN3aXBlKCk7XG4gICAgICAgICAgICB0aGlzLmF4ZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHVibGljIHJlc2l6ZSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc1QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCAwO1xuICAgICAgICB0aGlzLm9mZnNldFggPSB0aGlzLnZpZXcub2Zmc2V0KCkubGVmdDtcbiAgICAgICAgdGhpcy5vZmZzZXRZID0gdGhpcy52aWV3Lm9mZnNldCgpLnRvcCAtIHNUO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHVwZGF0ZUN1cnNvcigpOiB2b2lkIHtcbiAgICAgICAgbGV0IGlzTW91c2VEaXNhYmxlZCA9ICFNb2Rlcm5penIudG91Y2hldmVudHMgJiYgISF0aGlzLnNldHRpbmdzLmRpc2FibGVNb3VzZTtcbiAgICAgICAgdGhpcy4kaGFuZGxlci50b2dnbGVDbGFzcygnaXMtZ3JhYmJhYmxlJywgIXRoaXMuZGlzYWJsZWQgJiYgIWlzTW91c2VEaXNhYmxlZCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcblxuICAgICAgICB0aGlzLnZpZXcub2ZmKCcuc3dpcGUnKTtcblxuICAgICAgICBpZiAoIXRoaXMuc2V0dGluZ3MuZGlzYWJsZU1vdXNlKSB7XG4gICAgICAgICAgICB0aGlzLiRoYW5kbGVyXG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZWRvd24uc3dpcGUnLCB0aGlzLm9uTW91c2VEb3duKTtcblxuICAgICAgICAgICAgdGhpcy52aWV3XG4gICAgICAgICAgICAgICAgLm9uKCdtb3VzZW1vdmUuc3dpcGUnLCB0aGlzLm9uTW91c2VNb3ZlKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2V1cC5zd2lwZScsIHRoaXMub25Nb3VzZVVwKVxuICAgICAgICAgICAgICAgIC5vbignbW91c2VsZWF2ZS5zd2lwZScsIHRoaXMub25Nb3VzZVVwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdGhpcy5zZXR0aW5ncy5kaXNhYmxlVG91Y2gpIHtcbiAgICAgICAgICAgIHRoaXMuJGhhbmRsZXJcbiAgICAgICAgICAgICAgICAub24oJ3RvdWNoc3RhcnQuc3dpcGUnLCB0aGlzLm9uVG91Y2hTdGFydCk7XG5cbiAgICAgICAgICAgIHRoaXMudmlld1xuICAgICAgICAgICAgICAgIC5vbigndG91Y2htb3ZlLnN3aXBlJywgdGhpcy5vblRvdWNoTW92ZSk7XG5cbiAgICAgICAgICAgICRkb2NcbiAgICAgICAgICAgICAgICAub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpXG4gICAgICAgICAgICAgICAgLm9uKCd0b3VjaGVuZC5zd2lwZScgKyB0aGlzLnVpZCwgdGhpcy5vblRvdWNoRW5kKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHVuYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3Lm9mZignLnN3aXBlJyk7XG4gICAgICAgICRkb2Mub2ZmKCcuc3dpcGUnICsgdGhpcy51aWQpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uTW91c2VEb3duID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoKGUud2hpY2ggJiYgZS53aGljaCA9PT0gMykgfHwgKGUuYnV0dG9uICYmIGUuYnV0dG9uID09PSAyKSkgeyByZXR1cm47IH0gLy8gcmlnaHQgY2xpY2tcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHRoaXMubW91c2Uuc3RhcnRYID0gKGUuY2xpZW50WCB8fCBlLnBhZ2VYKSAtIHRoaXMub2Zmc2V0WDtcbiAgICAgICAgdGhpcy5tb3VzZS5zdGFydFkgPSAoZS5jbGllbnRZIHx8IGUucGFnZVkpIC0gdGhpcy5vZmZzZXRZO1xuICAgICAgICB0aGlzLnN0YXJ0U3dpcGUoKTtcbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xuICAgICAgICAgICAgdGhpcy5tb3VzZS54ID0gKGUuY2xpZW50WCB8fCBlLnBhZ2VYKSAtIHRoaXMub2Zmc2V0WDtcbiAgICAgICAgICAgIHRoaXMubW91c2UueSA9IChlLmNsaWVudFkgfHwgZS5wYWdlWSkgLSB0aGlzLm9mZnNldFk7XG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XG4gICAgICAgICAgICBsZXQgZGlmZlkgPSBNYXRoLmFicyh0aGlzLm1vdXNlLnkgLSB0aGlzLm1vdXNlLnN0YXJ0WSk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF4ZSA9IGRpZmZYID4gZGlmZlkgPyBTd2lwZUF4ZXMuSE9SSVpPTlRBTCA6IFN3aXBlQXhlcy5WRVJUSUNBTDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikge1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgodGhpcy5heGUgPT09IFN3aXBlQXhlcy5IT1JJWk9OVEFMICYmICEhdGhpcy5zZXR0aW5ncy5ob3Jpem9udGFsKSB8fCAodGhpcy5heGUgPT09IFN3aXBlQXhlcy5WRVJUSUNBTCAmJiAhIXRoaXMuc2V0dGluZ3MudmVydGljYWwpKSB7XG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3dpcGUoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gdGhpcy52aWV3LmZpbmQoJ2EnKS5jc3MoeyAncG9pbnRlci1ldmVudHMnOiAnbm9uZScgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgb25Nb3VzZVVwID0gKGUpOiB2b2lkfGJvb2xlYW4gPT4ge1xuICAgICAgICBpZiAoISF0aGlzLnN3aXBpbmcpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICB0aGlzLmVuZFN3aXBlKCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnZpZXcuZmluZCgnYScpLmNzcyh7ICdwb2ludGVyLWV2ZW50cyc6ICcnIH0pO1xuXG4gICAgICAgIHRoaXMuYXhlID0gbnVsbDtcbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgb25Ub3VjaFN0YXJ0ID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHRoaXMubW91c2Uuc3RhcnRYID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVg7XG4gICAgICAgIHRoaXMubW91c2Uuc3RhcnRZID0gZS5vcmlnaW5hbEV2ZW50LnRvdWNoZXNbMF0ucGFnZVk7XG4gICAgICAgIHRoaXMuc3RhcnRTd2lwZSgpO1xuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBvblRvdWNoTW92ZSA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICghIXRoaXMuc3dpcGluZykge1xuXG4gICAgICAgICAgICB0aGlzLm1vdXNlLnggPSBlLm9yaWdpbmFsRXZlbnQudG91Y2hlc1swXS5wYWdlWDtcbiAgICAgICAgICAgIHRoaXMubW91c2UueSA9IGUub3JpZ2luYWxFdmVudC50b3VjaGVzWzBdLnBhZ2VZO1xuXG4gICAgICAgICAgICBsZXQgZGlmZlggPSBNYXRoLmFicyh0aGlzLm1vdXNlLnggLSB0aGlzLm1vdXNlLnN0YXJ0WCk7XG4gICAgICAgICAgICBsZXQgZGlmZlkgPSBNYXRoLmFicyh0aGlzLm1vdXNlLnkgLSB0aGlzLm1vdXNlLnN0YXJ0WSk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5heGUgJiYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmF4ZSA9IGRpZmZYID4gZGlmZlkgPyBTd2lwZUF4ZXMuSE9SSVpPTlRBTCA6IFN3aXBlQXhlcy5WRVJUSUNBTDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGRpZmZYID4gMTIgfHwgZGlmZlkgPiAxMikge1xuICAgICAgICAgICAgICAgIHRoaXMuZHJhZ2dlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICgodGhpcy5heGUgPT09IFN3aXBlQXhlcy5IT1JJWk9OVEFMICYmICEhdGhpcy5zZXR0aW5ncy5ob3Jpem9udGFsKSB8fCAodGhpcy5heGUgPT09IFN3aXBlQXhlcy5WRVJUSUNBTCAmJiAhIXRoaXMuc2V0dGluZ3MudmVydGljYWwpKSB7XG4gICAgICAgICAgICAgICAgLy8gZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlU3dpcGUoKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5heGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnN3aXBpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBvblRvdWNoRW5kID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoISF0aGlzLnN3aXBpbmcpIHtcbiAgICAgICAgICAgIC8vIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRoaXMuZW5kU3dpcGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmF4ZSA9IG51bGw7XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIHN0YXJ0U3dpcGUoKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKCF0aGlzLmRpc2FibGVkKSB7XG5cbiAgICAgICAgICAgIHRoaXMuc3dpcGluZyA9IHRydWU7XG4gICAgICAgICAgICB0aGlzLmRyYWdnZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRYID0gMDtcbiAgICAgICAgICAgIHRoaXMuc3RhcnRZID0gMDtcbiAgICAgICAgICAgIHRoaXMuYXhlID0gbnVsbDtcblxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLlNUQVJULCB7XG4gICAgICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdbMF0sXG4gICAgICAgICAgICAgICAgeDogdGhpcy5tb3VzZS5zdGFydFggLSB0aGlzLnZpZXcub2Zmc2V0KCkubGVmdCxcbiAgICAgICAgICAgICAgICB5OiB0aGlzLm1vdXNlLnN0YXJ0WSAtIHRoaXMudmlldy5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgaW5zdGFuY2U6IHRoaXMsXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy4kaGFuZGxlci5hZGRDbGFzcygnaXMtZ3JhYmJlZCcpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgdXBkYXRlU3dpcGUoKTogdm9pZCB7XG5cbiAgICAgICAgbGV0IHggPSB0aGlzLnN0YXJ0WCArIHRoaXMubW91c2UueCAtIHRoaXMubW91c2Uuc3RhcnRYLFxuICAgICAgICAgICAgeSA9IHRoaXMuc3RhcnRZICsgdGhpcy5tb3VzZS55IC0gdGhpcy5tb3VzZS5zdGFydFk7XG5cbiAgICAgICAgdGhpcy54ID0geDtcbiAgICAgICAgdGhpcy55ID0geTtcblxuICAgICAgICB0aGlzLnRyaWdnZXIoU3dpcGVFdmVudHMuVVBEQVRFLCB7XG4gICAgICAgICAgICB0YXJnZXQ6IHRoaXMudmlld1swXSxcbiAgICAgICAgICAgIGRlbHRhWDogISF0aGlzLnNldHRpbmdzLmhvcml6b250YWwgPyB4IDogMCxcbiAgICAgICAgICAgIGRlbHRhWTogISF0aGlzLnNldHRpbmdzLnZlcnRpY2FsID8geSA6IDAsXG4gICAgICAgICAgICB4OiB0aGlzLm1vdXNlLngsXG4gICAgICAgICAgICB5OiB0aGlzLm1vdXNlLnksXG4gICAgICAgICAgICBpbnN0YW5jZTogdGhpcyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4kaGFuZGxlci5hZGRDbGFzcygnaXMtZHJhZ2dlZCcpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGVuZFN3aXBlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnN3aXBpbmcgPSBmYWxzZTtcbiAgICAgICAgbGV0IGRpcmVjdGlvbiA9IHRoaXMuYXhlID09PSBTd2lwZUF4ZXMuSE9SSVpPTlRBTCA/ICh0aGlzLnggPCB0aGlzLnN0YXJ0WCA/IFN3aXBlRGlyZWN0aW9ucy5MRUZUIDogU3dpcGVEaXJlY3Rpb25zLlJJR0hUKSA6ICh0aGlzLnkgPCB0aGlzLnN0YXJ0WSA/IFN3aXBlRGlyZWN0aW9ucy5VUCA6IFN3aXBlRGlyZWN0aW9ucy5ET1dOKTtcbiAgICAgICAgZGlyZWN0aW9uID0gdGhpcy5heGUgPT09IFN3aXBlQXhlcy5IT1JJWk9OVEFMICYmIE1hdGguYWJzKHRoaXMubW91c2UueCAtIHRoaXMubW91c2Uuc3RhcnRYKSA8IHRoaXMuc2V0dGluZ3MubWluaW11bSA/IFN3aXBlRGlyZWN0aW9ucy5OT05FIDogZGlyZWN0aW9uO1xuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gU3dpcGVBeGVzLlZFUlRJQ0FMICYmIE1hdGguYWJzKHRoaXMubW91c2UueSAtIHRoaXMubW91c2Uuc3RhcnRZKSA8IHRoaXMuc2V0dGluZ3MubWluaW11bSA/IFN3aXBlRGlyZWN0aW9ucy5OT05FIDogZGlyZWN0aW9uO1xuICAgICAgICBkaXJlY3Rpb24gPSB0aGlzLmF4ZSA9PT0gbnVsbCA/IFN3aXBlRGlyZWN0aW9ucy5OT05FIDogZGlyZWN0aW9uO1xuICAgICAgICBkaXJlY3Rpb24gPSBkaXJlY3Rpb24gPT09IFN3aXBlRGlyZWN0aW9ucy5OT05FICYmICF0aGlzLmRyYWdnZWQgPyBTd2lwZURpcmVjdGlvbnMuQ0xJQ0sgOiBkaXJlY3Rpb247XG5cbiAgICAgICAgdGhpcy50cmlnZ2VyKFN3aXBlRXZlbnRzLkVORCwge1xuICAgICAgICAgICAgdGFyZ2V0OiB0aGlzLnZpZXdbMF0sXG4gICAgICAgICAgICBkaXJlY3Rpb246IGRpcmVjdGlvbixcbiAgICAgICAgICAgIGluc3RhbmNlOiB0aGlzLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiRoYW5kbGVyLnJlbW92ZUNsYXNzKCdpcy1ncmFiYmVkIGlzLWRyYWdnZWQnKTtcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5cblxuXG5leHBvcnQgY2xhc3MgVG9vbHRpcCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbjtcbiAgICBwcml2YXRlICRidXR0b246IEpRdWVyeTtcbiAgICBwcml2YXRlICRjbG9zZTogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGJ1dHRvbiA9IHRoaXMudmlldy5maW5kKCcuanMtdG9nZ2xlJyk7XG4gICAgICAgIHRoaXMuJGNsb3NlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykgOiBudWxsO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRidXR0b24ub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQnV0dG9uQ2xpY2tIYW5kbGVyKTtcblxuICAgICAgICB0aGlzLnZpZXdcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlb24nKS5vbignbW91c2VlbnRlci5tb3VzZW9uJywgdGhpcy5vbk1vdXNlRW50ZXIpXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9mZicpLm9uKCdtb3VzZWxlYXZlLm1vdXNlb2ZmJywgdGhpcy5vbk1vdXNlTGVhdmUpO1xuXG4gICAgICAgICRkb2Mub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuJGNsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLiRjbG9zZS5vbignY2xpY2sudG9vbHRpcCcsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VFbnRlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VMZWF2ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQnV0dG9uQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIGlmICghYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgIC8vICAgICBhbGVydCgkKGUuY3VycmVudFRhcmdldClbMF0pO1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coJChlLmN1cnJlbnRUYXJnZXQpWzBdKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwICkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9wZW4oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcblxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICBpZiAodGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmFkZENsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMzAwMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykucmVtb3ZlQ2xhc3MoJ2lzLXRvZ2dsZWQtc2hhcmUnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBDb21wb25lbnQsIENvbXBvbmVudEV2ZW50cyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ29tcG9uZW50Jztcbi8vIGltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4uL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4uL0NsYXNzZXMnO1xuaW1wb3J0IHsgJGFydGljbGUsICRib2R5LCAkbWFpbiB9IGZyb20gJy4uL1NpdGUnO1xuXG5leHBvcnQgY2xhc3MgUGFnZUV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9HUkVTUzogc3RyaW5nID0gJ3Byb2dyZXNzJztcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENPTVBMRVRFOiBzdHJpbmcgPSAnY29tcGxldGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnYXBwZW5kJztcbn1cblxuZXhwb3J0IGNsYXNzIFBhZ2UgZXh0ZW5kcyBIYW5kbGVyIHtcblxuICAgIHB1YmxpYyBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XG4gICAgLy8gcHVibGljIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XG4gICAgcHJpdmF0ZSBsb2FkZXI6IEpRdWVyeURlZmVycmVkPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQ+O1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIG9wdGlvbnM/KSB7XG5cbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7IG9wYWNpdHk6IDAgfSk7XG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKHRoaXMudmlldy5wYXJlbnQoKS5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwcmVsb2FkIG5lY2Vzc2FyeSBhc3NldHM6XG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gbG9hZGluZyBpbWFnZXMgcHJvbWlzZVxuICAgICAqL1xuICAgIHB1YmxpYyBwcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCh0aGlzLnZpZXcuZmluZCgnLnByZWxvYWQnKS50b0FycmF5KCksIDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkT3B0aW9ucz57IGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICAgIGxldCBpbWFnZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBpbWFnZXMgPSBpbWFnZXMuY29uY2F0KGNvbXBvbmVudC5wcmVsb2FkSW1hZ2VzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHVybCBvZiBpbWFnZXMpIHtcbiAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQodXJsLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlciA9IGlsLmpxRGVmZXJyZWQ7XG4gICAgICAgICAgICB0aGlzLmxvYWRlci5wcm9ncmVzcygoaW5zdGFuY2U6IEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQsIGltYWdlOiBJbWFnZXNMb2FkZWQuTG9hZGluZ0ltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXIgPSBpbnN0YW5jZS5wcm9ncmVzc2VkQ291bnQgLyBpbnN0YW5jZS5pbWFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLlBST0dSRVNTLCBwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KS5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNPTVBMRVRFKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGlmIGFueSBDb21wb25lbnQgY2FuIGJlIGNoYW5nZWQgYWZ0ZXIgb25TdGF0ZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSB3aGVuIG9uZSBvZiB0aGUgY29tcG9uZW50cyB0YWtlcyBhY3Rpb24gaW4gb25TdGF0ZSBmdW5jdGlvbiBjYWxsXG4gICAgICovXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG5cbiAgICAgICAgbGV0IGNoYW5nZWQ6IGJvb2xlYW4gPSAhIWZhbHNlO1xuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDaGFuZ2VkOiBib29sZWFuID0gY29tcG9uZW50Lm9uU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghY2hhbmdlZCAmJiAhIWNvbXBvbmVudENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwYWdlIGVudGVyaW5nIGFuaW1hdGlvblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheSBhbmltYXRpb24gZGVsYXlcbiAgICAgKi9cbiAgICBwdWJsaWMgYW5pbWF0ZUluKGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xuXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCh0aGlzLmNvbXBvbmVudHMsICdhbmltYXRlSW4nKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbXBvbmVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1tpXS5hbmltYXRlSW4oaSwgZGVsYXkpO1xuICAgICAgICB9XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XG4gICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHBhZ2UgZXhpdCBhbmltYXRpb25cbiAgICAgKiAoY2FsbGVkIGFmdGVyIG5ldyBjb250ZW50IGlzIGxvYWRlZCBhbmQgYmVmb3JlIGlzIHJlbmRlcmVkKVxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IGFuaW1hdGlvbiBwcm9taXNlXG4gICAgICovXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiB0aGUgcGFnZTpcbiAgICAgICAgJG1haW4ucmVtb3ZlQ2xhc3MoJ2lzLWxvYWRlZCcpO1xuICAgICAgICBnc2FwLnNldChiZywgeyBvcGFjaXR5OiAwLCBkaXNwbGF5OiAnbm9uZSd9KTtcbiAgICAgICAgbGV0IHBhZ2VBbmltYXRpb25Qcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBhbmltYXRpb25zIG9mIGFsbCBjb21wb25lbnRzOlxuICAgICAgICBsZXQgY29tcG9uZW50QW5pbWF0aW9uczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSB0aGlzLmNvbXBvbmVudHMubWFwKChvYmopOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8UHJvbWlzZTx2b2lkPj5vYmouYW5pbWF0ZU91dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZXR1cm4gb25lIHByb21pc2Ugd2FpdGluZyBmb3IgYWxsIGFuaW1hdGlvbnM6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBhbGxQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBjb21wb25lbnRBbmltYXRpb25zLmNvbmNhdChwYWdlQW5pbWF0aW9uUHJvbWlzZSk7XG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGFsbFByb21pc2VzKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PZmYnKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9uJyk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHJlc2l6ZSBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IHdkdCAgICAgICAgd2luZG93IHdpZHRoXG4gICAgICogQHBhcmFtIHtbdHlwZV19IGhndCAgICAgICAgd2luZG93IGhlaWdodFxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBicmVha3BvaW50IElCcmVha3BvaW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyByZXNpemUod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdkdCwgaGd0LCBicmVha3BvaW50LCBicENoYW5nZWQpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBjbGVhbnVwIHdoZW4gY2xvc2luZyBQYWdlXG4gICAgICovXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgnZGVzdHJveScpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kcyA9IHt9O1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldyk7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG5cbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIH1cblxuXG5cbiAgICBwcm90ZWN0ZWQgYnVpbGRDb21wb25lbnRzKCRjb21wb25lbnRzOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgZm9yIChsZXQgaSA9ICRjb21wb25lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCAkY29tcG9uZW50OiBKUXVlcnkgPSAkY29tcG9uZW50cy5lcShpKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWU6IHN0cmluZyA9ICRjb21wb25lbnQuZGF0YSgnY29tcG9uZW50Jyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb21wb25lbnROYW1lLCBjb21wb25lbnRzKTtcblxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogT2JqZWN0ID0gJGNvbXBvbmVudC5kYXRhKCdvcHRpb25zJyksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogQ29tcG9uZW50ID0gbmV3IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0oJGNvbXBvbmVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQub24oQ29tcG9uZW50RXZlbnRzLkNIQU5HRSwgdGhpcy5vbkNvbXBvbmVudENoYW5nZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIGAlc2AgY29tcG9uZW50IScsIGNvbXBvbmVudE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNvbXBvbmVudENoYW5nZSA9IChlbCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyhlbC5maWx0ZXIoJ1tkYXRhLWNvbXBvbmVudF0nKS5hZGQoZWwuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKSk7XG4gICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNIQU5HRSwgZWwpO1xuICAgIH1cblxuXG4gICAgLy8gc2hvcnQgY2FsbFxuICAgIHByaXZhdGUgY2FsbEFsbChmbjogc3RyaW5nLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50W2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudFtmbl0uYXBwbHkoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG59XG4iXX0=
