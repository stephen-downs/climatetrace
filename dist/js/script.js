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

},{"./components/Chart":13,"./components/Dashboard":15,"./components/Dropdown":16,"./components/Filters":17,"./components/Masonry":18,"./components/Parallax":19,"./components/Range":20,"./components/Slider":21,"./components/Stats":22,"./components/Tooltip":23,"./pages/Page":24}],5:[function(require,module,exports){
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
            if (Site_1.$body.hasClass('is-aside-open')) {
                PushStates.asideToggle();
            }
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
            if (Site_1.$body.hasClass('is-aside-open')) {
                PushStates.asideToggle();
                setTimeout(() => {
                    Scroll_1.Scroll.scrollToElement($(e.currentTarget.hash));
                }, 500);
            }
            else {
                Scroll_1.Scroll.scrollToElement($(e.currentTarget.hash));
            }
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
    let el = e ? $(e.currentTarget) : $('[data-hamburger]');
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
                if ($el.data('uncache') === '') {
                    $el.addClass('uncached');
                }
                break;
            case 'fadeUp':
                gsap.killTweensOf($el, { opacity: true, y: true });
                gsap.fromTo($el, { opacity: 0, y: 40 }, { duration: time, opacity: 1, y: 0, ease: 'sine', delay: delay });
                if ($el.data('uncache') === '') {
                    $el.addClass('uncached');
                }
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
                gsap.set($el, { opacity: 1 });
                const map = $el.find('[data-item="0"] .js-map');
                const heroEl = $el.find('[data-caption="0"] .js-el');
                const heroCaption = $el.find('[data-caption="0"]');
                const heroNav = $el.find('.js-navigation');
                gsap.set([map, heroEl, heroNav], { opacity: 0 });
                gsap.fromTo(map, 1.5, { duration: 1.5, opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1,
                    onComplete: () => {
                        map.addClass('is-active');
                        map.removeAttr('style');
                    },
                });
                gsap.to(heroCaption, { duration: 1, opacity: 1, delay: 0.5,
                    onComplete: () => {
                        heroCaption.removeAttr('style');
                        heroCaption.addClass('is-active');
                    },
                });
                gsap.fromTo(heroEl, 1, { duration: 1, opacity: 0, x: -20 }, { opacity: 1, x: 0, delay: 1.25, stagger: 0.2,
                    onComplete: () => {
                    }
                });
                gsap.to(heroNav, 1, { duration: 1, opacity: 1, delay: 1.5,
                    onComplete: () => {
                        heroEl.removeAttr('style');
                        $el.addClass('is-ready');
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
                if ($el.data('uncache') === '') {
                    for (let i = 0; i < splittxt.chars.length; i++) {
                        splittxt.chars[i].classList.add('uncached');
                    }
                }
                break;
            case 'upDown':
                gsap.set($el, { opacity: 1 });
                const yShift = $el.data('shift') === 'up' ? 10 : -10;
                gsap.fromTo($el, { duration: 0.5, y: 0, opacity: 1 }, { opacity: 0.2, y: yShift, repeat: 2, ease: 'none', yoyo: true, delay: delay,
                    onComplete: () => {
                        gsap.to($el, { duration: 0.5, y: 0, opacity: 1 });
                    }
                });
                break;
            case 'itemsFade':
                const elements = $el.find('.' + $el.data('elements') + '');
                const staggerEl = $el.data('stagger') ? $el.data('stagger') : 0.2;
                const del = delay ? delay : 0.2;
                const shiftYAxis = $el.data('y') ? true : false;
                gsap.set($el, { opacity: 1 });
                gsap.set(elements, { opacity: 0 });
                if ($el.data('uncache') === '') {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].classList.add('uncached');
                    }
                }
                if (shiftYAxis) {
                    gsap.fromTo(elements, { duration: 1, opacity: 0, y: 10 }, { y: 0, opacity: 1, stagger: staggerEl, delay: delay });
                }
                else {
                    gsap.fromTo(elements, { duration: 1, opacity: 0, x: -10 }, { x: 0, opacity: 1, stagger: staggerEl, delay: delay });
                }
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
            case 'number':
                const numEl = $el.find('[data-num]');
                const num = $el.find('[data-num]').data('num');
                const dur = $el.data('time') ? $el.data('time') * 1000 : 2000;
                const numText = $el.find('[data-text]').length > 0 ? $el.find('[data-text]') : null;
                let fixed = num.toString().indexOf('.') > -1 ? num.toString().length - num.toString().indexOf('.') - 1 : null;
                numEl.css({
                    'width': numEl.width(),
                    'display': 'inline-block'
                });
                gsap.fromTo($el, { duration: 0.5, opacity: 0 }, { opacity: 1 });
                if (numText) {
                    gsap.set(numText, { opacity: 0 });
                    gsap.to(numText, 1, { duration: 1, opacity: 1, delay: dur / 1000 });
                }
                numEl.prop('Counter', 0).animate({
                    Counter: num,
                }, {
                    duration: dur,
                    easing: 'swing',
                    step: (now) => {
                        if (fixed && fixed > 0) {
                            if (numEl.data('replace')) {
                                numEl.text((now.toFixed(fixed).toString().replace('.', ',')));
                            }
                            else {
                                numEl.text(now.toFixed(fixed));
                            }
                        }
                        else {
                            numEl.text(Math.ceil(now));
                        }
                    },
                });
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
const Component_1 = require("./Component");
class Slider extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.index = 0;
        this.switchSlide = (e) => {
            const current = $(e.currentTarget);
            this.index = current.index();
            this.setActiveElement(this.$nav, 0);
            this.setActiveElement(this.$item, 100);
            this.setActiveElement(this.$captions, 1000);
        };
        this.$item = this.view.find('.js-item');
        this.$nav = this.view.find('.js-nav');
        this.$captions = this.view.find('.js-caption');
        this.bind();
    }
    bind() {
        this.$nav.off('.nav').on('click.nav', this.switchSlide);
    }
    setActiveElement(el, delay) {
        el.removeClass('is-active');
        setTimeout(() => {
            el.eq(this.index).addClass('is-active');
        }, delay);
    }
}
exports.Slider = Slider;

},{"./Component":14}],22:[function(require,module,exports){
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
            this.cleanCachedAnim();
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
    cleanCachedAnim() {
        const anim = this.view.find('[data-uncache]');
        const uncaches = this.view.find('.uncached');
        uncaches.removeAttr('style');
        anim.removeClass('animated');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0NoYXJ0LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ29tcG9uZW50LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRGFzaGJvYXJkLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRHJvcGRvd24udHMiLCJzcmMvdHMvY29tcG9uZW50cy9GaWx0ZXJzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvTWFzb25yeS50cyIsInNyYy90cy9jb21wb25lbnRzL1BhcmFsbGF4LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUmFuZ2UudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TbGlkZXIudHMiLCJzcmMvdHMvY29tcG9uZW50cy9TdGF0cy50cyIsInNyYy90cy9jb21wb25lbnRzL1Rvb2x0aXAudHMiLCJzcmMvdHMvcGFnZXMvUGFnZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDRUEsaUNBQWlDO0FBQ2pDLGlDQUErQjtBQWlCL0IsTUFBYSxHQUFHO0lBeVBMLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBWTtRQUUzQixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsT0FBTyxNQUFNLEtBQUssV0FBVyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5FLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENB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RSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvRDtTQUNKO0lBRUwsQ0FBQztDQUNKO0FBaE5ELG9CQWdOQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIC8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IHsgZGVidWcgfSBmcm9tICcuL1NpdGUnO1xuXG5cblxuZGVjbGFyZSB2YXIgJGJvZHk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUFwaURhdGEge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGJlZm9yZUNhbGw/OiBzdHJpbmc7XG4gICAgY2FsbGJhY2s/OiBzdHJpbmc7XG4gICAgZm9ybT86IGFueTtcbiAgICBwYXJhbXM/OiBhbnk7XG4gICAgbGlrZT86IGJvb2xlYW47XG4gICAgYWN0aW9uPzogJ1BPU1QnIHwgJ0RFTEVURScgfCAnR0VUJyB8ICdQVVQnIHwgJ1BBVENIJztcbn1cblxuXG5leHBvcnQgY2xhc3MgQVBJIHtcblxuXG5cbiAgICBwcml2YXRlIHN0YXRpYyBiZWZvcmVDYWxscyA9IHtcblxuICAgICAgICBsb2dpbjogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdpcy1sb2dnZWQnKSkge1xuICAgICAgICAgICAgICAgICQoJy5qcy1sb2dpbicpLmxhc3QoKS50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG5cbiAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICAgICAgbGV0IHBhc3NlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgbGV0ICRmb3JtID0gJGVsLmlzKCdmb3JtJykgPyAkZWwgOiAkZWwuY2xvc2VzdCgnZm9ybScpO1xuICAgICAgICAgICAgbGV0ICR2YWxpZGF0aW9uRWxlbSA9ICRmb3JtO1xuICAgICAgICAgICAgbGV0IHN0ZXBWYWxpZGF0aW9uO1xuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xuICAgICAgICAgICAgaWYgKCRmb3JtLmhhc0NsYXNzKCdpcy1kb25lJykpIHtcbiAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVDbGFzcygnaXMtZG9uZScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgKCAhIWRhdGEucGFyYW1zICkge1xuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gIGRhdGEucGFyYW1zLnZhbGlkYXRlT25lO1xuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSAgZGF0YS5wYXJhbXMuc2Nyb2xsVG87XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ1tyZXF1aXJlZF06aW5wdXQnKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyApIHtcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmUgPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZS50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1t2YWx1ZS5sZW5ndGggPiAwID8gJ2ludmFsaWQtZW1haWwnIDogJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJChpbnB1dCkuaGFzQ2xhc3MoJ2pzLXBvc3RhbCcpKSB7bWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Bob25lJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsVGVsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWxUZWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ1RFWFRBUkVBJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdpbnB1dFtuYW1lPXppcGNvZGVdJykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykgJiYgdmFsLmxlbmd0aCAhPSA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGlmICghIXBhc3NlZCkge1xuICAgICAgICAgICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGZvcm0pO1xuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdoYXMtZXJyb3JzJyk7XG4gICAgICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZm9ybS5hZGRDbGFzcygnaGFzLWVycm9ycycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIHN0YXRpYyBjYWxsYmFja3MgPSB7XG5cbiAgICAgICAgb25Db29raWVzQ2xvc2U6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcbiAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtaGlkZGVuJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25TdWJzY3JpYmU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblN1YnNjcmliZScpO1xuICAgICAgICAgICAgbGV0ICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XG5cbiAgICAgICAgICAgIC8vIGlmIChkYXRhLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9ICBkYXRhLnNjcm9sbFRvO1xuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcblxuICAgICAgICAgICAgaWYgKCEkbWVzc2FnZVswXSkge1xuICAgICAgICAgICAgICAgICRlbC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJqcy1tZXNzYWdlIG1lc3NhZ2VcIj4nKTtcbiAgICAgICAgICAgICAgICAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgaHRtbCA9ICQoJzxwPicgKyByZXNwb25zZS5tZXNzYWdlICsgJzwvcD4nKTtcblxuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJykuYXBwZW5kKGh0bWwpO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1jb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcbiAgICAgICAgICAgICAgICAkZWwuY2xvc2VzdCgnLmpvaW4nKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xuXG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWxbMF0uaGFzQXR0cmlidXRlKCdkYXRhLXJlZGlyZWN0JykpIHtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgIC8vICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJG1lc3NhZ2UsIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudHJpZ2dlcignYmx1cicpO1xuICAgICAgICB9LFxuXG4gICAgfTtcblxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGJpbmQodGFyZ2V0PzogYW55KTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQodHlwZW9mIHRhcmdldCAhPT0gJ3VuZGVmaW5lZCcgPyB0YXJnZXQgOiAnYm9keScpO1xuXG4gICAgICAgICR0YXJnZXQuZmluZCgnW2RhdGEtYXBpXScpLm5vdCgnZm9ybScpLm9mZignLmFwaScpLm9uKCdjbGljay5hcGknLCBBUEkub25BY3Rpb24pO1xuICAgICAgICAkdGFyZ2V0LmZpbmQoJ2Zvcm1bZGF0YS1hcGldJykub2ZmKCcuYXBpJykub24oJ3N1Ym1pdC5hcGknLCBBUEkub25BY3Rpb24pLmF0dHIoJ25vdmFsaWRhdGUnLCAnbm92YWxpZGF0ZScpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGNhbGxJdChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIGN1c3RvbUNhbGxiYWNrPzogRnVuY3Rpb24pOiAgUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgXG4gICAgICAgIGRhdGEgPSBBUEkucHJlcHJvY2Vzc0RhdGEoZGF0YSwgJGVsKTtcblxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcblxuICAgICAgICBjb25zdCBhY3Rpb24gPSBkYXRhLmFjdGlvbiB8fCAnUE9TVCc7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmFjdGlvbjtcblxuICAgICAgICBjb25zdCB1cmwgPSBkYXRhLnVybCB8fCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIGRlbGV0ZSBkYXRhLnVybDtcblxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5kb25lKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbUNhbGxiYWNrICYmIHR5cGVvZiBjdXN0b21DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5mYWlsKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUEkgZXJyb3I6ICcgKyBlLCBkYXRhKTtcblxuICAgICAgICAgICAgICAgIGlmICghIWRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkub25TdWNjZXNzKGRhdGEsICRlbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBwcmVwcm9jZXNzRGF0YShkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiBJQXBpRGF0YSB7XG5cbiAgICAgICAgLy8gZ2V0IGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBmb3JtIGVsZW1lbnQ6XG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2FjdGlvbicpID8gJGVsLmF0dHIoJ2FjdGlvbicpIDogZGF0YS51cmw7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJGVsLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2RhdGEgZm9ybScsIGRhdGEsIGRhdGEucGFyYW1zLGRhdGEuZm9ybSwgJGVsLmZpbmQoJzppbnB1dCcpKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBsaW5rIGVsZW1lbnQ6XG4gICAgICAgIGlmICgkZWwuaXMoJ1tocmVmXScpKSB7XG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignaHJlZicpID8gJGVsLmF0dHIoJ2hyZWYnKSA6IGRhdGEudXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2V0IGFkZGl0aW9uYWwgZGF0YSBmcm9tIGV4dGVybmFsIGZvcm06XG4gICAgICAgIGlmIChkYXRhLmZvcm0gJiYgJChkYXRhLmZvcm0gYXMgc3RyaW5nKVswXSkge1xuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsICQoZGF0YS5mb3JtIGFzIHN0cmluZykuc2VyaWFsaXplT2JqZWN0KCkpO1xuICAgICAgICAgICAgZGVsZXRlIGRhdGEuZm9ybTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZsYXR0ZW46XG4gICAgICAgIGlmIChkYXRhLnBhcmFtcykge1xuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsIGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLnBhcmFtcztcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBwcmUnLCBkYXRhLCBkYXRhLnBhcmFtcyk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIG9uQWN0aW9uID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBsZXQgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgICBjb25zdCBkYXRhOiBJQXBpRGF0YSA9IHsuLi4kKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYXBpJyl9O1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLCAnZGF0YScpO1xuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcbiAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtc3VibWl0dGVkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkZWwuY2xvc2VzdCgnZm9ybScpLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJlZm9yZUNhbGwgaGFuZGxlcjpcbiAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCkge1xuICAgICAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCBpbiBBUEkuYmVmb3JlQ2FsbHMpIHtcbiAgICAgICAgICAgICAgICBBUEkuYmVmb3JlQ2FsbHNbZGF0YS5iZWZvcmVDYWxsXShkYXRhLCAkZWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGVsKTtcbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIG9uU3VjY2VzcyA9IChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCA9PiB7XG5cbiAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrIGluIEFQSS5jYWxsYmFja3MpIHtcbiAgICAgICAgICAgICAgICBBUEkuY2FsbGJhY2tzW2RhdGEuY2FsbGJhY2tdKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0iLCJleHBvcnQgaW50ZXJmYWNlIElCcmVha3BvaW50IHtcbiAgICBkZXNrdG9wOiBib29sZWFuO1xuICAgIHRhYmxldDogYm9vbGVhbjtcbiAgICBwaG9uZTogYm9vbGVhbjtcbiAgICB2YWx1ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgbGV0IGJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xuXG5leHBvcnQgY2xhc3MgQnJlYWtwb2ludCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCBjc3NCZWZvcmUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JyksICc6YmVmb3JlJyk7XG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZVZhbHVlID0gY3NzQmVmb3JlLmdldFByb3BlcnR5VmFsdWUoJ2NvbnRlbnQnKS5yZXBsYWNlKC9bXFxcIlxcJ10vZywgJycpO1xuXG4gICAgICAgIGJyZWFrcG9pbnQgPSB7XG4gICAgICAgICAgICBkZXNrdG9wOiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ2Rlc2t0b3AnLFxuICAgICAgICAgICAgcGhvbmU6IGNzc0JlZm9yZVZhbHVlID09PSAncGhvbmUnLFxuICAgICAgICAgICAgdGFibGV0OiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ3RhYmxldCcsXG4gICAgICAgICAgICB2YWx1ZTogY3NzQmVmb3JlVmFsdWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJCUDpcIiwgYnJlYWtwb2ludC52YWx1ZSk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGxldCBicm93c2VyOiBJQnJvd3NlcjtcbmRlY2xhcmUgbGV0IG9wcjtcbi8vIHRzbGludDpkaXNhYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxuaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgb3ByOiBhbnk7XG4gICAgb3BlcmE6IGFueTtcbiAgICBzYWZhcmk6IGFueTtcbiAgICBIVE1MRWxlbWVudDogYW55O1xufVxuLy8gdHNsaW50OmVuYWJsZTpuby1hbnkgaW50ZXJmYWNlLW5hbWVcblxuXG5leHBvcnQgaW50ZXJmYWNlIElCcm93c2VyIHtcbiAgICBtb2JpbGU/OiBib29sZWFuO1xuICAgIHdpbmRvd3M/OiBib29sZWFuO1xuICAgIG1hYz86IGJvb2xlYW47XG4gICAgaWU/OiBib29sZWFuO1xuICAgIGlvcz86IGJvb2xlYW47XG4gICAgb3BlcmE/OiBib29sZWFuO1xuICAgIGZpcmVmb3g/OiBib29sZWFuO1xuICAgIHNhZmFyaT86IGJvb2xlYW47XG4gICAgY2hyb21lPzogYm9vbGVhbjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnJvd3NlcigpOiBJQnJvd3NlciB7XG4gICAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICBicm93c2VyID0ge1xuICAgICAgICBtb2JpbGU6ICgvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXBhZHxpcmlzfGtpbmRsZXxBbmRyb2lkfFNpbGt8bGdlIHxtYWVtb3xtaWRwfG1tcHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyAoY2V8cGhvbmUpfHhkYXx4aWluby9pLnRlc3QodWEpIHx8IC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QodWEuc3Vic3RyKDAsIDQpKSkgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgIGlvczogL2lQYWR8aVBob25lfGlQb2QvLnRlc3QodWEpLFxuICAgICAgICBtYWM6IG5hdmlnYXRvci5wbGF0Zm9ybS50b1VwcGVyQ2FzZSgpLmluZGV4T2YoJ01BQycpID49IDAsXG4gICAgICAgIGllOiB1YS5pbmRleE9mKCdNU0lFICcpID4gMCB8fCAhIXVhLm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLyksXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tYW55XG4gICAgICAgIG9wZXJhOiAoISEod2luZG93IGFzIGFueSkub3ByICYmICEhb3ByLmFkZG9ucykgfHwgISEod2luZG93IGFzIGFueSkub3BlcmEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCcgT1BSLycpID49IDAsXG4gICAgICAgIGZpcmVmb3g6IHVhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgIHNhZmFyaTogL14oKD8hY2hyb21lfGFuZHJvaWQpLikqc2FmYXJpL2kudGVzdCh1YSksXG4gICAgICAgIHdpbmRvd3M6IHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCd3aW4nKSA+IC0xLFxuICAgIH07XG5cbiAgICAkKCdodG1sJylcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtYWMnLCAhYnJvd3Nlci53aW5kb3dzICYmIChicm93c2VyLmlvcyB8fCBicm93c2VyLm1hYykpXG4gICAgICAgIC50b2dnbGVDbGFzcygnd2luZG93cycsIGJyb3dzZXIud2luZG93cyAmJiAhYnJvd3Nlci5tYWMgJiYgIWJyb3dzZXIuaW9zKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21vYmlsZScsIGJyb3dzZXIubW9iaWxlKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2ZpcmVmb3gnLCBicm93c2VyLmZpcmVmb3gpXG4gICAgICAgIC50b2dnbGVDbGFzcygnc2FmYXJpJywgYnJvd3Nlci5zYWZhcmkpXG4gICAgICAgIC50b2dnbGVDbGFzcygnaWUnLCBicm93c2VyLmllKTtcblxuICAgIHJldHVybiBicm93c2VyO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBCcm93c2VyIHtcbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgYnJvd3NlciA9IGdldEJyb3dzZXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBTbGlkZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvU2xpZGVyJztcbmltcG9ydCB7IFRvb2x0aXAgfSBmcm9tICcuL2NvbXBvbmVudHMvVG9vbHRpcCc7XG5pbXBvcnQgeyBEcm9wZG93biB9IGZyb20gJy4vY29tcG9uZW50cy9Ecm9wZG93bic7XG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9jb21wb25lbnRzL0ZpbHRlcnMnO1xuaW1wb3J0IHsgRGFzaGJvYXJkIH0gZnJvbSAnLi9jb21wb25lbnRzL0Rhc2hib2FyZCc7XG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0cyc7XG5pbXBvcnQgeyBNYXNvbnJ5IH0gZnJvbSAnLi9jb21wb25lbnRzL01hc29ucnknO1xuaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICcuL2NvbXBvbmVudHMvUmFuZ2UnO1xuaW1wb3J0IHsgQ2hhcnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ2hhcnQnO1xuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xuaW1wb3J0IHsgUGFyYWxsYXggfSBmcm9tICcuL2NvbXBvbmVudHMvUGFyYWxsYXgnO1xuXG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAnLi9wYWdlcy9QYWdlJztcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgU2xpZGVyLFxuICAgIFRvb2x0aXAsXG4gICAgRHJvcGRvd24sXG4gICAgRmlsdGVycyxcbiAgICBEYXNoYm9hcmQsXG4gICAgU3RhdHMsXG4gICAgTWFzb25yeSxcbiAgICBSYW5nZSxcbiAgICBDaGFydCxcbiAgICBQYXJhbGxheFxufTtcblxuXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XG4gICAgUGFnZVxufTtcblxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvY2xpcGJvYXJkLmQudHNcIiAvPlxuXG5cblxuZXhwb3J0IGNsYXNzIENvcHkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICAkKCdbZGF0YS1jb3B5XScpLm9uKCdjbGljaycsIChlKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcbiAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmluZm8oJ1wiJXNcIiBjb3BpZWQnLCB1cmwpO1xuXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7ICRlbC5yZW1vdmVDbGFzcygnaXMtY29waWVkJyk7IH0sIDEwMDApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFuZGxlciB7XG5cblxuICAgIHByaXZhdGUgZXZlbnRzOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uW10gfTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gICBldmVudE5hbWUgcGxlYXNlIHVzZSBzdGF0aWMgbmFtZXNcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xuXG4gICAgICAgIGlmICggIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm4ge0hhbmRsZXJ9ICAgICAgICAgICAgcmV0dXJucyBjdXJyZW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcblxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5ldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcblxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgdHJpZ2dlcihldmVudE5hbWU6IHN0cmluZywgLi4uZXh0cmFQYXJhbWV0ZXJzKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgIH1cbn1cblxuIiwiZXhwb3J0IGNsYXNzIExvYWRlciB7XG5cbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnkpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IHk6IDAsIGR1cmF0aW9uOiAwLjIgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IGR1cmF0aW9uOiAwLjUsIHk6IDEwLCB3aWR0aDogdGhpcy53aWR0aCB8fCAnMTAwJScgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzZXQocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5cbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3knXSk7XG5cbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xuaW1wb3J0IHsgJGJvZHksICRhcnRpY2xlLCAkcGFnZUhlYWRlciB9IGZyb20gJy4vU2l0ZSc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcblxuLy8gaW1wb3J0IHsgU2lnbnVwIH0gZnJvbSAnLi9TaWdudXAnO1xuXG5cbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWFueSAqL1xubGV0IEhpc3RvcnlqczogSGlzdG9yeWpzID0gPGFueT5IaXN0b3J5O1xuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cblxuXG5cbmV4cG9ydCBjbGFzcyBQdXNoU3RhdGVzRXZlbnRzIHtcbiAgICBwdWJsaWMgc3RhdGljIENIQU5HRSA9ICdzdGF0ZSc7XG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XG59XG5cblxuXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlcyBleHRlbmRzIEhhbmRsZXIge1xuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFB1c2hTdGF0ZXM7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBUSU1FX0xJTUlUID0gNTAwMDtcbiAgICBwcml2YXRlIHN0YXRpYyBub0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSBsb2FkZWREYXRhOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZXF1ZXN0OiBYTUxIdHRwUmVxdWVzdDtcbiAgICBwcml2YXRlIHRpbWVvdXQ7XG5cblxuXG4gICAgLyoqIGNoYW5nZSBkb2N1bWVudCB0aXRsZSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgc2V0VGl0bGUodGl0bGU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSB8fCAkKCcjbWFpbiA+IFtkYXRhLXRpdGxlXScpLmRhdGEoJ3RpdGxlJyk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgYW5kIHRyaWdnZXIgSGlzdG9yeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZ29Ubyhsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGxldCBwYXRobmFtZSA9IGxvY2F0aW9uLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgd2luZG93LmxvY2F0aW9uLmhvc3QsICcnKSxcbiAgICAgICAgICAgIGlzRGlmZmVyZW50ID0gcGF0aG5hbWUgIT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICBpZiAoTW9kZXJuaXpyLmhpc3RvcnkpIHtcbiAgICAgICAgICAgIGlmICghIXJlcGxhY2UpIHtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzRGlmZmVyZW50O1xuICAgIH1cblxuXG5cbiAgICAvKiogb25seSBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgd2l0aG91dCB0cmlnZ2VyaW5nIEhpc3RvcnkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNoYW5nZVBhdGgobG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4sIHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XG5cbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IHRydWU7XG4gICAgICAgIGxldCBjaGFuZ2VkID0gUHVzaFN0YXRlcy5nb1RvKGxvY2F0aW9uLCByZXBsYWNlIHx8IHRydWUpO1xuICAgICAgICBQdXNoU3RhdGVzLm5vQ2hhbmdlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCEhY2hhbmdlZCkge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSh0aXRsZSB8fCBkb2N1bWVudC50aXRsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgdG8gYmUgdXNlZCB3aXRoIFB1c2hTdGF0ZXMgLyBIaXN0b3J5ICovXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IEVsZW1lbnQgfCBOb2RlTGlzdCB8IEVsZW1lbnRbXSB8IHN0cmluZywgZWxlbWVudEl0c2VsZj86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKCFlbGVtZW50SXRzZWxmKSB7XG4gICAgICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLmJpbmRMaW5rcyh0YXJnZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGluayh0YXJnZXQgYXMgRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogZ28gYmFjayBpbiBicm93c2VyIGhpc3RvcnlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uYWwgZmFsbGJhY2sgdXJsICh3aGVuIGJyb3dzZXIgZGVvZXNuJ3QgaGF2ZSBhbnkgaXRlbXMgaW4gaGlzdG9yeSlcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGJhY2sodXJsPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDIpIHsgLy8gfHwgZG9jdW1lbnQucmVmZXJyZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgSGlzdG9yeWpzLmJhY2soKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cmwpIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCB1cmwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsICcvJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHVibGljIHN0YXRpYyByZWxvYWQoKTogdm9pZCB7XG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBzZXROYXZiYXJWaXNpYmlsaXR5KCk6IHZvaWQge1xuXG4gICAgICAgIGlmICghJHBhZ2VIZWFkZXIpIHtcbiAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICRib2R5LmFkZENsYXNzKCduYXZiYXItYWx3YXlzLXNob3duJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGFzaWRlVG9nZ2xlID0gKGU/KTogdm9pZCA9PiB7XG4gICAgICAgIGxldCBlbCA9IGUgPyAkKGUuY3VycmVudFRhcmdldCkgOiAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XG5cbiAgICAgICAgZWwudG9nZ2xlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKTtcblxuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsnd2lsbC1jaGFuZ2UnOiAndHJhbnNmb3JtJ30pO1xuICAgICAgICAgICAgLy8gZml4ZWRwb3NpdGlvbiA9IFNjcm9sbC5zY3JvbGxUb3A7XG4gICAgICAgICAgICBVdGlscy5kaXNhYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdzYXAuc2V0KCRhcnRpY2xlLCB7IGNsZWFyUHJvcHM6ICd3aWxsLWNoYW5nZSd9KTtcbiAgICAgICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xuICAgICAgICAgICAgdGhpcy5iaW5kTGlua3MoKTtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5BZGFwdGVyLmJpbmQod2luZG93LCAnc3RhdGVjaGFuZ2UnLCB0aGlzLm9uU3RhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZSA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIGxvYWQgbmV3IGNvbnRlbnQgdmlhIGFqYXggYmFzZWQgb24gY3VycmVudCBsb2NhdGlvbjpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBjYW5jZWwgb2xkIHJlcXVlc3Q6XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmaW5lIHVybFxuICAgICAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIGNvbnN0IHNlYXJjaDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCB8fCAnJztcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcblxuICAgICAgICAvLyBkZWZpbmUgdGltZW91dFxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgUHVzaFN0YXRlcy5USU1FX0xJTUlUKTtcblxuICAgICAgICAvLyByZXR1cm4gcHJvbWlzZVxuICAgICAgICAvLyBhbmQgZG8gdGhlIHJlcXVlc3Q6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGRvIHRoZSB1c3VhbCB4aHIgc3R1ZmY6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgICAgICAgICAgLy8gb25sb2FkIGhhbmRsZXI6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQgIT09ICdhYm9ydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2hpbmcgZXJyb3JzOlxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KEVycm9yKCdOZXR3b3JrIEVycm9yJykpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vbnByb2dyZXNzID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIHNlbmQgcmVxdWVzdDpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvKiogZnVuY3Rpb24gY2FsbGVkIG9uIHN1Y2Nlc3NmdWwgZGF0YSBsb2FkICovXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCBkYXRhOiBzdHJpbmcgPSB0aGlzLmxvYWRlZERhdGEudHJpbSgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xuICAgICAgICBsZXQgcmVuZGVyZWRDb3VudCA9IDA7XG5cbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xuICAgICAgICAvLyBpZiBvbmx5IG9uZSBjb250YWluZXIsIGZvcmNlIGBwbGFpbmBcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgcmVuZGVyZWRDb3VudCArPSB0aGlzLnJlbmRlckVsZW1lbnQoY29udGFpbmVyLCBkYXRhLCBpbmRleCA9PT0gMCAmJiBjb250YWluZXJzLmxlbmd0aCA9PT0gMSkgPyAxIDogMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmUtdHJ5IHJlbmRlcmluZyBpZiBub25lIG9mIGNvbnRhaW5lcnMgd2VyZSByZW5kZXJlZDpcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckVsZW1lbnQoJCgnI21haW4nKVswXSwgZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG5cbiAgICAgICAgLy8gZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50IGZvciBzZXJkZWxpYSBDTVM6XG4gICAgICAgIHdpbmRvdy5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnYWpheF9sb2FkZWQnKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcmVuZGVyRWxlbWVudChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IHN0cmluZywgZm9yY2VQbGFpbj86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gJyMnICsgZWwuaWQ7XG5cbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XG4gICAgICAgICAgICBjb2RlID0gZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xuICAgICAgICAgICAgY29kZSA9ICRsb2FkZWRDb250ZW50Lmh0bWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29kZSkgeyBjb25zb2xlLmluZm8oYENvdWxkbid0IHJlcmVuZGVyICMke2VsLmlkfSBlbGVtZW50YCk7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICQoY29udGFpbmVyKVxuICAgICAgICAgICAgLmhpZGUoKVxuICAgICAgICAgICAgLmVtcHR5KClcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcbiAgICAgICAgICAgIC5zaG93KCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgJCh0YXJnZXQpLm9mZignY2xpY2snKS5vbignY2xpY2suaGlzdG9yeScsIHRoaXMub25DbGljayk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGlua3ModGFyZ2V0PzogRWxlbWVudCB8IE5vZGVMaXN0IHwgRWxlbWVudFtdIHwgc3RyaW5nKTogdm9pZCB7XG5cbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtYXBpXScpXG4gICAgICAgICAgICAubm90KCdbZG93bmxvYWRdJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCIjXCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmJD1cIi5qcGdcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJtYWlsdG86XCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cInRlbDpcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1sb2dpbl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtbGFuZ10nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWZePVwiaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArICdcIl0nKVxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cIiNcIl0nKS5ub3QoJ1tocmVmPVwiI1wiXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcblxuXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGFsdGVybmF0ZSA9ICQoJ1tkYXRhLWFsdGVybmF0ZV0nKS5kYXRhKCdhbHRlcm5hdGUnKTtcbiAgICAgICAgY29uc3QgYXJ0aWNsZVVSTCA9IGFsdGVybmF0ZSA/IGFsdGVybmF0ZVtsYW5nIHx8IE9iamVjdC5rZXlzKGFsdGVybmF0ZSlbMF1dIDogbnVsbDtcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGhlYWRVUkwgPSBoZWFkTGluayA/IGhlYWRMaW5rLmhyZWYgOiBudWxsO1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKGFydGljbGVVUkwgfHwgaGVhZFVSTCB8fCBlLmN1cnJlbnRUYXJnZXQuaHJlZik7XG4gICAgfVxuXG5cblxuICAgIC8qKiBsaW5rcyBjbGljayBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvbkNsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoJGJvZHkuaGFzQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKSkge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5hc2lkZVRvZ2dsZSgpO1xuICAgICAgICB9XG4gICAgICAgIGxldCAkc2VsZjogSlF1ZXJ5ID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpLFxuICAgICAgICAgICAgc3RhdGU6IHN0cmluZyA9ICRzZWxmLmF0dHIoJ2hyZWYnKS5yZXBsYWNlKCdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXG4gICAgICAgICAgICB0eXBlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdkYXRhLWhpc3RvcnknKTtcblxuICAgICAgICBpZiAodHlwZSA9PT0gJ2JhY2snKSB7XG4gICAgICAgICAgICBQdXNoU3RhdGVzLmJhY2soc3RhdGUpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZXBsYWNlJykge1xuICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbC5yZXNldFNjcm9sbENhY2hlKHN0YXRlKTtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5wdXNoU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqIG9uIGhhc2gtbGluayBjbGljayBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIGxpbmsnKTtcbiAgICAgICAgaWYgKCRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuYXNpZGVUb2dnbGUoKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBIaXN0b3J5anMgYHN0YXRlY2hhbmdlYCBldmVudCBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xuICAgICAgICBpZiAoIVB1c2hTdGF0ZXMubm9DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqIG1hcmsgbGlua3MgYXMgYWN0aXZlICovXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVMaW5rcygpOiB2b2lkIHtcbiAgICAgICAgJCgnYVtocmVmXScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgJCgnYVtocmVmPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgfVxufVxuXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9nc2FwLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvc3BsaXQtdGV4dC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi9QdXNoU3RhdGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xuLy8gaW1wb3J0IHsgUHJvZ3Jlc3NiYXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZ3Jlc3NiYXInO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IEJhY2tncm91bmQgZnJvbSAnLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcbmltcG9ydCB7ICR3aW5kb3csICRib2R5IH0gZnJvbSAnLi9TaXRlJztcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tICcuL0NsYXNzZXMnO1xuXG5pbnRlcmZhY2UgSUJhY2tncm91bmREYXRhIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHN0ZXA6IG51bWJlcjtcbiAgICBkYXJrZW46IGJvb2xlYW47XG4gICAgZGFya2VuRGVsYXk6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU2Nyb2xsUGFyYW1zIGV4dGVuZHMgT2JqZWN0IHtcbiAgICB4PzogbnVtYmVyO1xuICAgIHk/OiBudW1iZXI7XG4gICAgc3BlZWQ/OiBudW1iZXI7XG4gICAgYW5pbWF0ZT86IGJvb2xlYW47XG4gICAgcmVsYXRpdmVTcGVlZD86IGJvb2xlYW47XG4gICAgZWFzZT86IHN0cmluZztcbn1cblxuXG5pbnRlcmZhY2UgSUJhc2VDYWNoZUl0ZW0ge1xuICAgICRlbD86IEpRdWVyeTtcbiAgICBkb25lPzogYm9vbGVhbjtcbiAgICBoZWlnaHQ/OiBudW1iZXI7XG4gICAgc3RhcnQ/OiBudW1iZXI7XG4gICAgdHlwZT86IHN0cmluZztcbiAgICB5PzogbnVtYmVyO1xuICAgIGNvbXBvbmVudD86IENvbXBvbmVudDtcbn1cblxuaW50ZXJmYWNlIElTY3JvbGxpbmdEYXRhIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIHRvcDogbnVtYmVyO1xuICAgIHJvbGU6IHN0cmluZztcbiAgICBwYXRoPzogc3RyaW5nO1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICAgIGJvdHRvbT86IG51bWJlcjtcbiAgICBjaGlsZHJlbj86IGFueTtcbiAgICAkY2hpbGQ/OiBKUXVlcnk7XG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XG4gICAgZGVsYXk/OiBudW1iZXI7XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGluaXRpYWxpemVkPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIElQYXJhbGxheENhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBzaGlmdD86IG51bWJlcjtcbiAgICAkY2hpbGQ/OiBKUXVlcnk7XG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBJQW5pbWF0aW9uQ2FjaGVJdGVtIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIHVuY2FjaGU/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSVNjcm9sbENhY2hlIHtcbiAgICBhbmltYXRpb25zPzogSUFuaW1hdGlvbkNhY2hlSXRlbVtdO1xuICAgIHBhcmFsbGF4ZXM/OiBJUGFyYWxsYXhDYWNoZUl0ZW1bXTtcbiAgICBtb2R1bGVzPzogSUJhc2VDYWNoZUl0ZW1bXTtcbiAgICBiYWNrZ3JvdW5kcz86IElCYWNrZ3JvdW5kQ2FjaGVJdGVtW107XG4gICAgc2VjdGlvbnM/OiBJU2Nyb2xsaW5nRGF0YVtdO1xuXG59XG5cbmludGVyZmFjZSBJQmFja2dyb3VuZENhY2hlSXRlbSBleHRlbmRzIElCYWNrZ3JvdW5kRGF0YSwgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIHBlcmNlbnRhZ2U/OiBudW1iZXI7XG4gICAgaW5kZXg/OiBudW1iZXI7XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIGJyZWFrcG9pbnRzPzogc3RyaW5nW107XG59XG5cblxuXG5leHBvcnQgY2xhc3MgU2Nyb2xsIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFNjcm9sbDtcbiAgICBwdWJsaWMgc3RhdGljIHdpbmRvd0hlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBzdGF0aWMgaGVhZGVySGVpZ2h0OiBudW1iZXI7XG4gICAgcHVibGljIHN0YXRpYyBtYXhTY3JvbGw6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9wOiBudW1iZXI7XG4gICAgLy8gcHVibGljIHN0YXRpYyBjdXN0b21TY3JvbGw6IFNjcm9sbGJhcjtcbiAgICBwcml2YXRlIHN0YXRpYyBjdXN0b21TY3JvbGw7XG4gICAgcHJpdmF0ZSBzdGF0aWMgYW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XG5cblxuICAgIHByaXZhdGUgY2FjaGU6IElTY3JvbGxDYWNoZSA9IHt9O1xuICAgIHByaXZhdGUgc2Nyb2xsQ2FjaGUgPSB7fTtcbiAgICBwcml2YXRlIGlnbm9yZUNhY2hlOiBib29sZWFuO1xuICAgIHByaXZhdGUgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcbiAgICBwcml2YXRlIHRhcmdldDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgc3RvcmVkUGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgc2VjdGlvbnM6IEpRdWVyeTtcbiAgICBwcml2YXRlIGNoYW5naW5nUGF0aDogYm9vbGVhbjtcblxuICAgIFxuICAgIC8qKlxuICAgICAqIHNjcm9sbHMgcGFnZSB0byBjZXJ0YWluIGVsZW1lbnQgKHRvcCBlZGdlKSB3aXRoIHNvbWUgc3BlZWRcbiAgICAgKiBAcGFyYW0gIHtKUXVlcnl9ICAgICAgICAkZWwgICAgW3RhcmdldCBlbG1lbnRdXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgb2Zmc2V0XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgZHVyYXRpb25cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSAgICAgICAgW2FmdGVyIGNvbXBsZXRlZCBhbmltYXRpb25dXG4gICAgICovXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvRWxlbWVudCgkZWw6IEpRdWVyeSwgb2Zmc2V0PzogbnVtYmVyLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgeSA9ICRlbC5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0ICsgKG9mZnNldCB8fCAwKTtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHtcbiAgICAgICAgICAgICAgICB5OiBNYXRoLm1heChkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCwgd2luZG93LnBhZ2VZT2Zmc2V0KSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKG9iaik7XG4gICAgICAgICAgICBnc2FwLnRvKG9iaiwge1xuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0eXBlb2YgZHVyYXRpb24gPT09ICd1bmRlZmluZWQnID8gMSA6IGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBvYmoueSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyByZXNldFNjcm9sbENhY2hlKHBhdGhuYW1lKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5jYWNoZVtwYXRobmFtZV0gPSAwO1xuICAgIH1cbiAgICBcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSB0cnVlO1xuICAgIH1cblxuXG4gICAgcHVibGljIHN0YXRpYyBlbmFibGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgIHRoaXMuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICB9XG5cblxuICAgIFxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHRoaXMuaWdub3JlQ2FjaGUgPSAhIWJyb3dzZXIuc2FmYXJpO1xuXG4gICAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICAgIC8vICQoJ2FbaHJlZl49XCIjXCJdOm5vdChcIi5qcy1uYXYtaXRlbSwgW2RhdGEtbGlnaHRib3hdXCIpJykub24oJ2NsaWNrJywgdGhpcy5vbkhhc2hDbGlja0hhbmRsZXIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRzID0gdGhpcy5idWlsZEJhY2tncm91bmRzKCk7XG4gICAgICAgIC8vIFNjcm9sbC5pc0N1c3RvbVNjcm9sbCA9ICQoJyN3cGJzJykuZGF0YSgnc2Nyb2xsYmFyJyk7XG5cbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9IDcwO1xuICAgICAgICBTY3JvbGwuaW5zdGFuY2UgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuc3RvcmVkUGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzaXplKCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwud2luZG93SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gJCgnI25hdmJhcicpLmhlaWdodCgpO1xuICAgICAgICBTY3JvbGwubWF4U2Nyb2xsID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gU2Nyb2xsLndpbmRvd0hlaWdodCArIFNjcm9sbC5oZWFkZXJIZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xuXG5cbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcbiAgICB9XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9QYXRoKGZhc3Q/OiBib29sZWFuKTogYm9vbGVhbiB7XG5cbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQoJ1tkYXRhLXBhdGg9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpO1xuXG4gICAgICAgIGlmICgkdGFyZ2V0WzBdKSB7XG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCR0YXJnZXQsIDAsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCEhdGhpcy5jaGFuZ2luZ1BhdGgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIHJldHVybiBTY3JvbGwuc2Nyb2xsVG9QYXRoKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC5kaXNhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvYWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2VjdGlvbnMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJykub24oJ3Njcm9sbC5zY3JvbGxpbmcnLCAoKSA9PiB0aGlzLm9uU2Nyb2xsKCkpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHN0YXJ0KCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwuZW5hYmxlKCk7XG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5vblNjcm9sbCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhY2hlID0ge307XG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJyk7XG4gICAgfVxuXG4gICAgLy8gcHJpdmF0ZSBvbkhhc2hDbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gICAgIC8vIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAvLyAgICAgaWYgKCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykpIHtcbiAgICAvLyAgICAgICAgIGxldCBvZmZzZXQgPSBwYXJzZUludCgkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpLCAxMCk7XG5cbiAgICAvLyAgICAgICAgIGlmICggdHlwZW9mICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykgPT09ICdzdHJpbmcnICkge1xuICAgIC8vICAgICAgICAgICAgIGNvbnN0IG9mZiA9ICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykucmVwbGFjZSgndmgnLCAnJyk7XG4gICAgLy8gICAgICAgICAgICAgb2Zmc2V0ID0gJCh3aW5kb3cpLmhlaWdodCgpICogKHBhcnNlSW50KG9mZiwgMTApIC8gMTAwKTtcbiAgICAvLyAgICAgICAgIH1cblxuICAgIC8vICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSwgb2Zmc2V0KTtcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfTtcblxuXG4gICAgcHJpdmF0ZSBidWlsZEJhY2tncm91bmRzKCk6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kIH0ge1xuICAgICAgICBsZXQgYmdzID0ge307XG4gICAgICAgICQoJ1tkYXRhLWJnLWNvbXBvbmVudF0nKS50b0FycmF5KCkuZm9yRWFjaCgoZWwsIGkpID0+IHtcbiAgICAgICAgICAgIGxldCAkYmdFbCA9ICQoZWwpO1xuICAgICAgICAgICAgbGV0IGJnTmFtZSA9ICRiZ0VsLmRhdGEoJ2JnLWNvbXBvbmVudCcpO1xuICAgICAgICAgICAgbGV0IGJnT3B0aW9ucyA9ICRiZ0VsLmRhdGEoJ29wdGlvbnMnKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50c1tiZ05hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJnID0gbmV3IGNvbXBvbmVudHNbYmdOYW1lXSgkYmdFbCwgYmdPcHRpb25zKTtcbiAgICAgICAgICAgICAgICBiZy5pZCA9IGVsLmlkO1xuICAgICAgICAgICAgICAgIGJnc1tlbC5pZF0gPSBiZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGNvbXBvbmVudCBhdmFpbGFibGUhJywgYmdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGJncywgJ0JHUyBTQ1JPTEwnKTtcbiAgICAgICAgcmV0dXJuIGJncztcbiAgICB9XG5cblxuICAgIHByaXZhdGUgc2F2ZUNhY2hlKCk6IHZvaWQge1xuICAgICAgICAvLyBpZiAoIXRoaXMuZWxlbWVudHMpIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnM6IEFycmF5PElBbmltYXRpb25DYWNoZUl0ZW0+ID0gW107XG4gICAgICAgIGNvbnN0IG1hcmdpbiA9IDAgO1xuXG4gICAgICAgIC8vIGxldCBzZWN0aW9uczogQXJyYXk8SVNjcm9sbGluZ0RhdGE+ID0gW107XG4gICAgICAgIC8vIGlmICh0aGlzLnNlY3Rpb25zKSB7XG5cbiAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGg7ICsraSkge1xuICAgIFxuICAgICAgICAvLyAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gdGhpcy5zZWN0aW9ucy5lcShpKTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCByb2xlID0gJGVsLmRhdGEoJ3Njcm9sbCcpO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHRvcCA9ICRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgaGVpZ2h0ID0gJGVsLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGVsYXkgPSAkZWwuZGF0YSgnZGVsYXknKSB8fCAwO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHRpdGxlID0gJGVsLmRhdGEoJ3RpdGxlJykgfHwgZmFsc2U7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgcGF0aCA9ICRlbC5kYXRhKCdwYXRoJykgfHwgZmFsc2U7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGF0YTogSVNjcm9sbGluZ0RhdGEgPSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAvLyAgICAgICAgICAgICByb2xlOiByb2xlLFxuICAgICAgICAvLyAgICAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgLy8gICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIC8vICAgICAgICAgICAgIGJvdHRvbTogdG9wICsgaGVpZ2h0LFxuICAgICAgICAvLyAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIC8vICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXG4gICAgICAgIC8vICAgICAgICAgICAgIGNoaWxkcmVuOiB7fSxcbiAgICAgICAgLy8gICAgICAgICAgICAgc2hvd246ICRlbC5kYXRhKCdzaG93bicpIHx8IGZhbHNlLFxuICAgICAgICAvLyAgICAgICAgICAgICBkZWxheTogZGVsYXksXG4gICAgICAgIC8vICAgICAgICAgfTtcbiAgICBcbiAgICAgICAgLy8gICAgICAgICBzZWN0aW9ucy5wdXNoKGRhdGEpO1xuICAgICAgICAvLyAgICAgICAgICRlbC5kYXRhKCdjYWNoZScsIGkpO1xuICAgICAgICAvLyAgICAgfVxuICAgICAgICAvLyB9XG5cbiAgICAgICAgXG4gICAgICAgICQoJ1tkYXRhLWFuaW1hdGlvbl0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHR5cGVvZiAkZWwuZGF0YSgnc3RhcnQnKSAhPT0gJ3VuZGVmaW5lZCcgPyAkZWwuZGF0YSgnc3RhcnQnKSA6IDAuMSxcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wIC0gbWFyZ2luLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgZG9uZTogJGVsLmhhc0NsYXNzKCdhbmltYXRlZCcpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICRlbC5kYXRhKCdhbmltYXRpb24nKSxcbiAgICAgICAgICAgICAgICBkZWxheTogJGVsLmRhdGEoJ2RlbGF5JykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB1bmNhY2hlOiAkZWwuZGF0YSgndW5jYWNoZScpLFxuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgXG5cbiAgICAgICAgY29uc3QgcGFyYWxsYXhlczogQXJyYXk8SVBhcmFsbGF4Q2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICAkKCdbZGF0YS1wYXJhbGxheF0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKDxIVE1MRWxlbWVudD5lbCk7XG4gICAgICAgICAgICBjb25zdCBwID0gJGVsLmRhdGEoJ3BhcmFsbGF4Jyk7XG4gICAgICAgICAgICBwYXJhbGxheGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgcCA9PT0gJ3N0cmluZycgPyBwIDogbnVsbCxcbiAgICAgICAgICAgICAgICBzaGlmdDogdHlwZW9mIHAgPT09ICdudW1iZXInID8gcCA6IG51bGwsXG4gICAgICAgICAgICAgICAgZG9uZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLmhlaWdodCgpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBiYWNrZ3JvdW5kczogQXJyYXk8SUJhY2tncm91bmRDYWNoZUl0ZW0+ID0gW107XG4gICAgICAgICQoJ1tkYXRhLWJhY2tncm91bmRdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrZ3JvdW5kRGF0YSA9ICRlbC5kYXRhKCdiYWNrZ3JvdW5kJyk7XG4gICAgICAgICAgICBjb25zdCBicmVha3BvaW50cyA9IGJhY2tncm91bmREYXRhLmJyZWFrcG9pbnRzIHx8IFsnZGVza3RvcCcsICd0YWJsZXQnLCAncGhvbmUnXTtcblxuICAgICAgICAgICAgaWYgKGJyZWFrcG9pbnRzLmluZGV4T2YoYnJlYWtwb2ludC52YWx1ZSkgPj0gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iYWNrZ3JvdW5kc1tiYWNrZ3JvdW5kRGF0YS5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd0aGVyZVxcJ3Mgbm8gYmFja2dyb3VuZCB3aXRoIGlkPScgKyBiYWNrZ3JvdW5kRGF0YS5pZCArICchJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZHMucHVzaCgkLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtlbkRlbGF5OiAwLFxuICAgICAgICAgICAgICAgICAgICB9LCBiYWNrZ3JvdW5kRGF0YSB8fCB7fSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY2FjaGUuYW5pbWF0aW9ucyA9IGFuaW1hdGlvbnM7XG4gICAgICAgIHRoaXMuY2FjaGUucGFyYWxsYXhlcyA9IHBhcmFsbGF4ZXM7XG4gICAgICAgIHRoaXMuY2FjaGUuYmFja2dyb3VuZHMgPSBiYWNrZ3JvdW5kcztcbiAgICAgICAgLy8gdGhpcy5jYWNoZS5zZWN0aW9ucyA9IHNlY3Rpb25zO1xuXG5cblxuICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25TY3JvbGwgPSAoKTogdm9pZCA9PiB7XG5cbiAgICAgICAgaWYgKFNjcm9sbC5kaXNhYmxlZCB8fCAkYm9keS5oYXNDbGFzcygnaXMtYXNpZGUtb3BlbicpKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGNvbnN0IHNUID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgMDtcbiAgICAgICAgY29uc3Qgd2luZG93SGVpZ2h0ID0gU2Nyb2xsLndpbmRvd0hlaWdodDtcbiAgICAgICAgY29uc3Qgc2NyZWVuQ2VudGVyOiBudW1iZXIgPSBzVCArIFNjcm9sbC53aW5kb3dIZWlnaHQgKiAwLjMzO1xuICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBTY3JvbGwuaGVhZGVySGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JvbGxlbmQgPSAkKCcjbWFpbicpLm91dGVySGVpZ2h0KCkgLSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAyO1xuICAgICAgICBjb25zdCBwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpLm9mZnNldCgpLnRvcCAtIChTY3JvbGwuaGVhZGVySGVpZ2h0ICogMikgOiAwO1xuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kcyA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0IDogMDtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvcCA9IHNUO1xuICAgICAgICB0aGlzLnNjcm9sbENhY2hlW3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZV0gPSBzVDtcblxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtd2luZG93LWhlaWdodCcsIHNUID4gd2luZG93SGVpZ2h0IC0gMTAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkLW5hdmJhcicsIHNUID4gMTAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkJywgc1QgPiAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnLCBzVCA+IHBhZ2VIZWFkZXIpO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtYmFja2dyb3VuZHMtc2Nyb2xsZWQnLCBzVCA+IGJhY2tncm91bmRzKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbC1lbmQnLCBzVCA+PSBzY3JvbGxlbmQpO1xuXG5cbiAgICAgICAgLy8gYW5pbWF0aW9uczpcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYW5pbWF0aW9ucyAmJiB0aGlzLmNhY2hlLmFuaW1hdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLmFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtOiBJQW5pbWF0aW9uQ2FjaGVJdGVtID0gdGhpcy5jYWNoZS5hbmltYXRpb25zW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCB5VG9wOiBudW1iZXIgPSBzVDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRvbmUgJiYgaXRlbVkgPD0geUJvdHRvbSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1aWNrOiBib29sZWFuID0geVRvcCA+PSBpdGVtWSArIGl0ZW1IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYW5pbWF0ZShpdGVtLCBpdGVtLiRlbCwgaXRlbS50eXBlLCBpdGVtLmRlbGF5LCBxdWljayk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uZG9uZSAmJiBpdGVtLmNvbXBvbmVudCAmJiBpdGVtLnR5cGUgPT09ICd0b2dnbGUnICYmIChpdGVtWSA+IHlCb3R0b20gfHwgaXRlbVkgKyBpdGVtSGVpZ2h0IDwgeVRvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChpdGVtLnVuY2FjaGUgJiYgaXRlbS5kb25lICYmIChzVCA8PSBpdGVtWSAtIHdpbmRvd0hlaWdodCB8fCBzVCA+PSBpdGVtWSArIHdpbmRvd0hlaWdodCApKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykubGVuZ3RoID4gMCkgeyBpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLiRlbC5hdHRyKCdkYXRhLXVuY2FjaGUnKSkgeyBpdGVtLiRlbC5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uJGVsLnJlbW92ZUNsYXNzKCdhbmltYXRlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gcGFyYWxsYXhlczpcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUucGFyYWxsYXhlcyAmJiB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoID4gMCAmJiBicmVha3BvaW50LmRlc2t0b3ApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5wYXJhbGxheGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbGxheCh0aGlzLmNhY2hlLnBhcmFsbGF4ZXNbaV0sIHNULCB3aW5kb3dIZWlnaHQsIC1oZWFkZXJIZWlnaHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgXG5cbiAgICAgICAgLy9iZ3NcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMpIHtcblxuICAgICAgICAgICAgY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwLjUgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICAvLyBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICBsZXQgYmdzVG9TaG93ID0gW107XG4gICAgICAgICAgICBsZXQgYmdzVG9IaWRlID0gW107XG5cblxuICAgICAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcy5mb3JFYWNoKChpdGVtOiBJQmFja2dyb3VuZENhY2hlSXRlbSwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1ZOiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0ueSA6IGl0ZW0uJGVsLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtQm90dG9tOiBudW1iZXIgPSBpdGVtWSArIGl0ZW1IZWlnaHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgeUNlbnRlciA9ICh0eXBlb2YgaXRlbS5zdGFydCAhPT0gJ3VuZGVmaW5lZCcpID8gc1QgKyBpdGVtLnN0YXJ0ICogd2luZG93SGVpZ2h0IDogd2luZG93Q2VudGVyO1xuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBiYWNrZ3JvdW5kID0gdGhpcy5iYWNrZ3JvdW5kc1tpdGVtLmlkXTtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWxheSA9IHR5cGVvZiBpdGVtLmRlbGF5ICE9PSAndW5kZWZpbmVkJyA/IGl0ZW0uZGVsYXkgOiAwLjE7XG4gICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudGFnZSA9IC0gKGl0ZW1ZIC0geUNlbnRlcikgLyBpdGVtSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGxldCBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50ID0gJGJvZHkuaGFzQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnKSA/IHNUICsgd2luZG93SGVpZ2h0ID49IGl0ZW1ZICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCA6IGl0ZW1ZIC0gc1QgPD0gd2luZG93Q2VudGVyICYmIGl0ZW1Cb3R0b20gLSBzVCA+PSB3aW5kb3dDZW50ZXI7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jYWNoZS5iYWNrZ3JvdW5kcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgMik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCkge1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICghaXRlbS5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWJhY2tncm91bmQuc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdGlvbkluKGZhbHNlLCBkZWxheSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC51cGRhdGUocGVyY2VudGFnZSk7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuc2V0U3RlcChpdGVtLnN0ZXAsIGJhY2tncm91bmRRdWlja1NldHVwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uZGFya2VuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmRhcmtlbihpdGVtWSA8PSB5Q2VudGVyIC0gd2luZG93SGVpZ2h0ICogaXRlbS5kYXJrZW5EZWxheSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYmdzVG9TaG93LnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgYmdzVG9IaWRlLnB1c2goaXRlbS5pZCk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBpZiAoYmdzVG9IaWRlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGJnc1RvSGlkZS5mb3JFYWNoKChiZ0lEKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiZ3NUb1Nob3cuaW5kZXhPZihiZ0lEKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYmFja2dyb3VuZHNbYmdJRF0uYW5pbWF0aW9uT3V0KGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMuYmFja2dyb3VuZHNbYmdJRF0uc2hvd249IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAvLyBQcm9ncmVzc2Jhci51cGRhdGUoc1QpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIGFuaW1hdGUoZGF0YTogSUFuaW1hdGlvbkNhY2hlSXRlbSwgJGVsOiBKUXVlcnksIHR5cGU6IHN0cmluZywgZGVsYXk6IG51bWJlciA9IDAuMSBhcyBudW1iZXIsIHF1aWNrPzogYm9vbGVhbiwgdW5jYWNoZT86IGJvb2xlYW4pOiB2b2lkIHtcblxuICAgICAgICBjb25zdCB0aW1lID0gIXF1aWNrID8gLjYgOiAwO1xuXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlJzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlVXAnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiA0MCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB5OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlRG93bic6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHk6IC0xMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB5OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZVJpZ2h0JzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeDogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHg6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlTGVmdCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IDEwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHg6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpVGFicyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBsVGV4dCA9ICRlbC5maW5kKCdzcGFuOmZpcnN0LWNoaWxkJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgclRleHQgPSAkZWwuZmluZCgnc3BhbjpsYXN0LWNoaWxkJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhsVGV4dCwgeyBkdXJhdGlvbjogMC41LCB4OiAnNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oclRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJy01MCUnLCBvcGFjaXR5OiAwIH0sIHsgeDogJzAlJywgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdlbGVtZW50cyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwuZmluZCgnW2RhdGEtdmlldy10YWJdJyksIHsgZHVyYXRpb246IDEsIHk6ICcxMDAlJyB9LCB7XG4gICAgICAgICAgICAgICAgICAgIHk6ICcwJScsIHN0YWdnZXI6IDAuMixcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC50bygkZWwuZmluZCgnLml0ZW1fX3RhYnMnKSwgeyBkdXJhdGlvbjogMSwgb3ZlcmZsb3c6ICd1bnNldCcgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWN0JzpcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgbGV0IGZUZXh0ID0gJGVsLmZpbmQoJy5mYWN0X190ZXh0IHNwYW4nKSxcbiAgICAgICAgICAgICAgICAgICAgc3BsaXRGVHh0ID0gbmV3IFNwbGl0VGV4dChmVGV4dCwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJ30pLFxuICAgICAgICAgICAgICAgICAgICBmSW1nID0gJGVsLmZpbmQoJy5mYWN0X19pbWFnZS13cmFwJyksXG4gICAgICAgICAgICAgICAgICAgIGZBcnIgPSAkZWwuZmluZCgnLmZhY3RfX2ljb24nKTtcblxuICAgICAgICAgICAgICAgIGdzYXAudGltZWxpbmUoKVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGZBcnIsIHsgZHVyYXRpb246IDEsIHJvdGF0ZTogOTAgfSwgeyByb3RhdGU6IDAsIGRlbGF5OiAwLjUgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhzcGxpdEZUeHQuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC01IH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wMSB9LCAnLT0wLjgnKVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGZJbWcsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEgfSwgJy09MC41Jyk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnbGVhZCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdCA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBsaW5lcycsIGxpbmVzQ2xhc3M6ICdsaW5lJyB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRlbC5maW5kKCcubGluZScpO1xuXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAkKGxpbmVzW2ldKS5hZnRlcignPGJyPicpO1xuICAgICAgICAgICAgICAgICAgICAkKGxpbmVzW2ldKS5hcHBlbmQoJzxzcGFuIGNsYXNzPVwibGluZV9fYmdcIj48L3NwYW4+Jyk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXQud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjEsIGRlbGF5OiAwLjQgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50bygkZWwuZmluZCgnLmxpbmVfX2JnJyksIHsgZHVyYXRpb246IDAuNzUsIHNjYWxlWDogMSwgc3RhZ2dlcjogMC4xfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnc2NhbGUnOlxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwfSx7c2NhbGVYOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogZGVsYXl9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdjaGFycyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdEggPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0SC5jaGFycywgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwLCBvcGFjaXR5OiAwIH0sIHsgc2NhbGVYOiAxLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzLXNpbXBsZSc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdEgyID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEgyLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd3b3Jkcy1zaW1wbGUnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgd29yZHMgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcycgfSk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhZ2dlciA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHdvcmRzLndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlcn0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlcyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwuZmluZCgnaW1nJyksIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEsIHN0YWdnZXI6IDAuMiB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdoZXJvJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcCA9ICRlbC5maW5kKCdbZGF0YS1pdGVtPVwiMFwiXSAuanMtbWFwJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVyb0VsID0gJGVsLmZpbmQoJ1tkYXRhLWNhcHRpb249XCIwXCJdIC5qcy1lbCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9DYXB0aW9uID0gJGVsLmZpbmQoJ1tkYXRhLWNhcHRpb249XCIwXCJdJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVyb05hdiA9ICRlbC5maW5kKCcuanMtbmF2aWdhdGlvbicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoW21hcCwgaGVyb0VsLCBoZXJvTmF2XSwgeyBvcGFjaXR5OiAwfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhtYXAsIDEuNSwge2R1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjg1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEsIFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvQ2FwdGlvbiwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC41LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZXJvQ2FwdGlvbi5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24uYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhlcm9FbCwgMSwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7b3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDEuMjUsIHN0YWdnZXI6IDAuMixcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvTmF2LCAxLCB7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiAxLjUsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9FbC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1yZWFkeScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAncXVvdGUnOlxuICAgICAgICAgICAgICAgIGNvbnN0ICRxdW90ZSA9ICRlbC5maW5kKCcuanMtcXVvdGUtd29yZHMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkYXV0aG9yID0gJGVsLmZpbmQoJy5qcy1xdW90ZS1hdXRob3InKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkbGluZSA9ICRlbC5maW5kKCdocicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoWyRxdW90ZSwgJGVsLCAkYXV0aG9yXSwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSAkcXVvdGUuY2hpbGRyZW4oKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFF1b3RlID0gbmV3IFNwbGl0VGV4dCgkcXVvdGUsIHsgdHlwZTogJ3dvcmRzJyB9KTtcblxuICAgICAgICAgICAgICAgIC8vIEZPUiBVTkNBQ0hFIE9QVElPTiBPRiBBTklNQVRJT04gUVVPVEVcbiAgICAgICAgICAgICAgICAvLyBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXRRdW90ZS53b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vICAgICBzcGxpdFF1b3RlLndvcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSh7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9SZW1vdmVDaGlsZHJlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc2V0KCRxdW90ZSwgeyBvcGFjaXR5OiAxIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oY2hpbGQsIDAuNSwgeyBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgZWFzZTogJ3Bvd2VyMycgfSwgJys9JyArIGRlbGF5KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbShzcGxpdFF1b3RlLndvcmRzLCAwLjUsIHsgb3BhY2l0eTogMCwgeDogOCwgdHJhbnNmb3JtT3JpZ2luOiAnMCUgMTAwJScsIGVhc2U6ICdwb3dlcjMnLCBzdGFnZ2VyOiAwLjA1IH0sIDAuMSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkYXV0aG9yLCAwLjcsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sIHsgb3BhY2l0eTogMSwgeDogMCB9LCAnLT0nICsgMC4zKVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKCRsaW5lLCB7IGR1cmF0aW9uOiAwLjcsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSB9LCAnLT0wLjMnKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd3b3Jkcyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHh0ID0gJGVsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0dHh0ID0gbmV3IFNwbGl0VGV4dCh0eHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdHR4dC5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7ICBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXR0eHQuY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0dHh0LmNoYXJzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICBcbiAgICAgICAgICAgIGNhc2UgJ3VwRG93bic6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB5U2hpZnQgPSAkZWwuZGF0YSgnc2hpZnQnKSA9PT0gJ3VwJyA/IDEwIDogLTEwO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIHk6IDAsIG9wYWNpdHk6IDF9LCB7b3BhY2l0eTogMC4yLCB5OiB5U2hpZnQsIHJlcGVhdDogMiwgZWFzZTogJ25vbmUnLCB5b3lvOiB0cnVlLCBkZWxheTogZGVsYXksXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIHk6IDAsIG9wYWNpdHk6IDF9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2l0ZW1zRmFkZSc6XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSAkZWwuZmluZCgnLicgKyAkZWwuZGF0YSgnZWxlbWVudHMnKSArICcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZ2VyRWwgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWwgPSBkZWxheSA/IGRlbGF5IDogMC4yO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNoaWZ0WUF4aXMgPSAkZWwuZGF0YSgneScpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoZWxlbWVudHMsIHsgb3BhY2l0eTogMCB9KTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2hpZnRZQXhpcykge1xuICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMTB9LCB7IHk6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMTB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd2aWRlby10ZXh0JzpcbiAgICAgICAgICAgICAgICBjb25zdCB2aWQgPSAkZWwuZmluZCgnLmpzLWNvbC02NicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZiA9ICRlbC5maW5kKCcuanMtY29sLTMzJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnNldChbdmlkLCBpbmZdLCB7IG9wYWNpdHk6IDAgfSk7XG5cblxuICAgICAgICAgICAgICAgIGdzYXAudG8odmlkLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC4yfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaW5mLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7IG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjR9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdoZWFkaW5nJzpcbiAgICAgICAgICAgICAgICBjb25zdCBoVGl0bGUgPSAkZWwuZmluZCgnLmpzLXRpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhyID0gJGVsLmZpbmQoJy5qcy1oZWFkaW5nLWhyJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRUaXRsZSA9IG5ldyBTcGxpdFRleHQoaFRpdGxlLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0VGl0bGUuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhociwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxLCBkZWxheTogMC41IH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3RpdGxlRmFkZUluJzpcbiAgICAgICAgICAgICAgICBjb25zdCBsZWFkID0gJGVsLmZpbmQoJy5qcy1maXhlZC10aXRsZScpLFxuICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICRlbC5maW5kKCcuanMtc3ViJyksXG4gICAgICAgICAgICAgICAgICAgICAgYXJyID0gJGVsLmZpbmQoJy5qcy1hcnInKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShsZWFkLCB7IGR1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHNjYWxlOiAxLjIsIGRlbGF5OiAyfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKHN1YiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjJ9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oYXJyLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAzMCwgZGVsYXk6IDMuN30pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ludHJvJzpcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ0YWluID0gJGVsLmZpbmQoJy5qcy1jdXJ0YWluJyk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGN1cnRhaW4sIHsgZHVyYXRpb246IDMsIG9wYWNpdHk6IDAsIGRlbGF5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICAgICAgICBjYXNlICdoZWFkZXInOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBodGltZSA9ICRlbC5maW5kKCcuanMtdGltZScpLFxuICAgICAgICAgICAgICAgICAgICBzb2NpYWxEID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX2l0ZW0nKSxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVUZXh0ID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX3RpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhIciA9ICRlbC5maW5kKCcuanMtaGVhZGVyLWhyJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhbaHRpbWUsIHNoYXJlVGV4dCwgc29jaWFsRF0sIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaEhyLCB7IHNjYWxlWDogMH0sIHsgc2NhbGVYOiAxfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGNvbnN0IG51bUVsID0gJGVsLmZpbmQoJ1tkYXRhLW51bV0nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpLmRhdGEoJ251bScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1ciA9ICRlbC5kYXRhKCd0aW1lJykgPyAkZWwuZGF0YSgndGltZScpICogMTAwMCA6IDIwMDA7XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtVGV4dCA9ICRlbC5maW5kKCdbZGF0YS10ZXh0XScpLmxlbmd0aCA+IDAgPyAkZWwuZmluZCgnW2RhdGEtdGV4dF0nKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgbGV0IGZpeGVkID0gbnVtLnRvU3RyaW5nKCkuaW5kZXhPZignLicpID4gLTEgPyBudW0udG9TdHJpbmcoKS5sZW5ndGggLSBudW0udG9TdHJpbmcoKS5pbmRleE9mKCcuJykgLSAxIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIG51bUVsLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG51bUVsLndpZHRoKCksXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAwfSwgeyBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgaWYgKG51bVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQobnVtVGV4dCwgeyBvcGFjaXR5OiAwfSk7XG4gICAgICAgICAgICAgICAgICAgIGdzYXAudG8obnVtVGV4dCwgMSx7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkdXIvMTAwMH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG51bUVsLnByb3AoJ0NvdW50ZXInLCAwKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgQ291bnRlcjogbnVtLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cixcbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiAnc3dpbmcnLFxuICAgICAgICAgICAgICAgICAgICBzdGVwOiAobm93KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQgJiYgZml4ZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG51bUVsLmRhdGEoJ3JlcGxhY2UnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KChub3cudG9GaXhlZChmaXhlZCkudG9TdHJpbmcoKS5yZXBsYWNlKCcuJywgJywnKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQobm93LnRvRml4ZWQoZml4ZWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQoTWF0aC5jZWlsKG5vdykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke3R5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHBhcmFsbGF4KGl0ZW06IElQYXJhbGxheENhY2hlSXRlbSwgc1Q6IG51bWJlciwgd2luZG93SGVpZ2h0OiBudW1iZXIsIGhlYWRlckhlaWdodDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKGl0ZW0uc2hpZnQpIHtcblxuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBpdGVtLnk7XG5cbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcblxuICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50OiBudW1iZXIgPSAoeSAtIHNUICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0IC0gaGVhZGVySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChwZXJjZW50ICogaXRlbS5zaGlmdCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lOiBudW1iZXIgPSAhaXRlbS5kb25lID8gMCA6IDAuNTtcbiAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsKTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGltZSxcbiAgICAgICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICAgICAgcm91bmRQcm9wczogWyd5J10sXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSkge1xuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGNvbnN0ICRlbFN0aWNreTogSlF1ZXJ5ID0gJGVsLnBhcmVudCgpLnBhcmVudCgpO1xuICAgICAgICAgICAgY29uc3QgeTogbnVtYmVyID0gaXRlbS55O1xuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgcHlUb3BTdGlja3k6IG51bWJlciA9IHNUIC0gJGVsU3RpY2t5LmhlaWdodCgpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVybyc6XG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGVsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAhYnJvd3Nlci5tb2JpbGUgPyBzVCAqIDAuNSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FzZSAnZml4ZWRJbWFnZSc6XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHksIFwieVwiLCBzVCwgcHlCb3R0b20sIHdpbmRvd0hlaWdodCx3aW5kb3dIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSBweVRvcCAmJiB5IDw9IHB5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGVsLmhhc0NsYXNzKCdoYXMtcGFyYWxsYXgnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdoYXMtcGFyYWxsYXgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICAgICAgY2FzZSAnY3NzLWFuaW1hdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuaGFzQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5JykgPyBudWxsIDogaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBjYXNlICdyZWxhdGl2ZVBhcmFsbGF4JzpcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBpdGVtLmNoaWxkSGVpZ2h0IC0gaXRlbS5oZWlnaHQ7IC8vIHJlc2VydmUgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4U2hpZnQgPSBNYXRoLm1pbihhdmFpbGFibGVTcGFjZSwgaXRlbS5oZWlnaHQgKyBoZWFkZXJIZWlnaHQpOyAvLyBNYXRoLm1pbihhdmFpbGFibGVTcGFjZSwgKHdpbmRvd0hlaWdodCAtIGRhdGEuaGVpZ2h0KSAqIDAuNSApOyAvLyBkbyBub3QgbW92ZSB0b28gbXVjaCBvbiBiaWcgc2NyZWVuc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gKHNUIC0gaXRlbS55ICsgd2luZG93SGVpZ2h0KSAvICh3aW5kb3dIZWlnaHQgKyBpdGVtLmhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvc1k6IHN0cmluZyB8IG51bWJlciA9IE1hdGgucm91bmQoKDEgLSBwZXJjZW50KSAqIG1heFNoaWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPCAwID8gMCA6IHBvc1k7XG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZID4gbWF4U2hpZnQgPyBtYXhTaGlmdCA6IHBvc1k7XG5cbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kY2hpbGQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IC1wb3NZLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke2l0ZW0udHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5leHBvcnQgY2xhc3MgU2hhcmUge1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcblxuXG4gICAgICAgICQoJ1tkYXRhLXNoYXJlXScpLm9uKCdjbGljaycsIChlKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBsZXQgd2luV2lkdGggPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW53aWR0aCcpLCAxMCkgfHwgNTIwO1xuICAgICAgICAgICAgbGV0IHdpbkhlaWdodCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbmhlaWdodCcpLCAxMCkgfHwgMzUwO1xuICAgICAgICAgICAgbGV0IHdpblRvcCA9IChzY3JlZW4uaGVpZ2h0IC8gMikgLSAod2luSGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBsZXQgd2luTGVmdCA9IChzY3JlZW4ud2lkdGggLyAyKSAtICh3aW5XaWR0aCAvIDIpO1xuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGFyZ2V0ID0gPGFueT5lLmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBocmVmID0gY3VycmVudFRhcmdldC5ocmVmO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdzaGFyZScpO1xuXG4gICAgICAgICAgICBpZiAoZGF0YSA9PT0gJ2xpbmtlZGluJykge1xuICAgICAgICAgICAgICAgIHdpbldpZHRoID0gNDIwO1xuICAgICAgICAgICAgICAgIHdpbkhlaWdodCA9IDQzMDtcbiAgICAgICAgICAgICAgICB3aW5Ub3AgPSB3aW5Ub3AgLSAxMDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGhyZWYsICdzaGFyZXInICsgZGF0YSwgJ3RvcD0nICsgd2luVG9wICsgJyxsZWZ0PScgKyB3aW5MZWZ0ICsgJyx0b29sYmFyPTAsc3RhdHVzPTAsd2lkdGg9JyArIHdpbldpZHRoICsgJyxoZWlnaHQ9JyArIHdpbkhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vcmVmZXJlbmNlcy5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IFB1c2hTdGF0ZXMsIFB1c2hTdGF0ZXNFdmVudHMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xuaW1wb3J0IHsgUGFnZSwgUGFnZUV2ZW50cyB9IGZyb20gJy4vcGFnZXMvUGFnZSc7XG5pbXBvcnQgeyBDb21wb25lbnRFdmVudHMsIENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xuaW1wb3J0IHsgQnJvd3NlciwgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlcic7XG5pbXBvcnQgeyBwYWdlcywgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XG5pbXBvcnQgeyBDb3B5IH0gZnJvbSAnLi9Db3B5JztcbmltcG9ydCB7IFNoYXJlIH0gZnJvbSAnLi9TaGFyZSc7XG5pbXBvcnQgeyBBUEkgfSBmcm9tICcuL0FwaSc7XG5cbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xuXG5leHBvcnQgbGV0IHNpdGU6IFNpdGU7XG5leHBvcnQgbGV0ICRkb2M6IEpRdWVyeTtcbmV4cG9ydCBsZXQgJHdpbmRvdzogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkYm9keTogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkYXJ0aWNsZTogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkbWFpbjogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xuZXhwb3J0IGxldCBwaXhlbFJhdGlvOiBudW1iZXI7XG5leHBvcnQgbGV0IGRlYnVnOiBib29sZWFuO1xuZXhwb3J0IGxldCBlYXNpbmc6IHN0cmluZztcbmV4cG9ydCBsZXQgbGFuZzogc3RyaW5nO1xuZXhwb3J0IGxldCBmaXhlZHBvc2l0aW9uOiBudW1iZXI7XG5cbi8vIGRlY2xhcmUgbGV0IEN1c3RvbUVhc2U7XG5cblxuXG5cbmV4cG9ydCBjbGFzcyBTaXRlIHtcblxuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2l0ZTtcblxuICAgIHByaXZhdGUgY3VycmVudFBhZ2U6IFBhZ2U7XG4gICAgcHJpdmF0ZSBwdXNoU3RhdGVzOiBQdXNoU3RhdGVzO1xuICAgIHByaXZhdGUgc2Nyb2xsOiBTY3JvbGw7XG4gICAgcHJpdmF0ZSBsYXN0QnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XG4gICAgcHJpdmF0ZSBsb2FkZXI6IExvYWRlcjtcbiAgICAvLyBwcml2YXRlIGlzUmVhZHk6IGJvb2xlYW47XG4gICAgLy8gcHJpdmF0ZSBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XG4gICAgLy8gcHJpdmF0ZSAkaGFtYnVyZ2VyOiBKUXVlcnk7XG4gICAgLy8gcHJpdmF0ZSAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xuICAgIC8vIHByaXZhdGUgJGFydGljbGU6IEpRdWVyeTtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgY29uc29sZS5ncm91cCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnc2l0ZScpO1xuXG4gICAgICAgIFNpdGUuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICAvLyBsYW5nID0gJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKTtcblxuICAgICAgICBwaXhlbFJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICAgICAgZGVidWcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLmluZGV4T2YoJ2RlYnVnJykgPj0gMDtcbiAgICAgICAgLy8gZWFzaW5nID0gQ3VzdG9tRWFzZS5jcmVhdGUoJ2N1c3RvbScsICdNMCwwLEMwLjUsMCwwLjMsMSwxLDEnKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGluaXQoKTogdm9pZCB7XG5cbiAgICAgICAgQnJlYWtwb2ludC51cGRhdGUoKTtcbiAgICAgICAgQnJvd3Nlci51cGRhdGUoKTtcblxuICAgICAgICAkZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgICR3aW5kb3cgPSAkKHdpbmRvdyk7XG4gICAgICAgICRib2R5ID0gJCgnYm9keScpO1xuICAgICAgICAkYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLW1haW4nKTtcbiAgICAgICAgJG1haW4gPSAkKCcjbWFpbicpO1xuXG5cbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzID0gbmV3IFB1c2hTdGF0ZXMoKTtcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFLCB0aGlzLm9uU3RhdGUpO1xuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5QUk9HUkVTUywgdGhpcy5vbkxvYWRQcm9ncmVzcyk7XG5cbiAgICAgICAgLy8gdGhpcy4kaGFtYnVyZ2VyID0gJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xuICAgICAgICAvLyB0aGlzLiRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xuICAgICAgICAvLyB0aGlzLiRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcblxuICAgICAgICB0aGlzLnNjcm9sbCA9IG5ldyBTY3JvbGwoKTtcbiAgICAgICAgdGhpcy5sb2FkZXIgPSBuZXcgTG9hZGVyKCQoJy5qcy1sb2FkZXInKSk7XG4gICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSk7XG5cblxuICAgICAgICBuZXcgQ29weSgpO1xuICAgICAgICBuZXcgU2hhcmUoKTtcbiAgICAgICAgbmV3IEFQSSgpO1xuICAgICAgICBBUEkuYmluZCgpO1xuICAgICAgICAvLyB0aGlzLm1lbnUgPSBuZXcgTWVudSgkKCcuanMtbWVudScpKTtcbiAgICAgICAgLy8gdGhpcy5jb29raWVzID0gbmV3IENvb2tpZXMoJCgnLmpzLWNvb2tpZXMnKSk7XG5cblxuICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihbXG4gICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCksXG4gICAgICAgICAgICAvLyB0aGlzLnByZWxvYWRBc3NldHMoKSxcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCksXG4gICAgICAgIF0pLnRoZW4odGhpcy5vblBhZ2VMb2FkZWQpO1xuXG5cbiAgICAgICAgaWYgKGRlYnVnKSB7IFV0aWxzLnN0YXRzKCk7IH1cblxuICAgICAgICAkd2luZG93Lm9uKCdvcmllbnRhdGlvbmNoYW5nZScsICgpID0+IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcblxuICAgICAgICB9LCAxMDApKTtcbiAgICAgICAgJHdpbmRvdy5vbigncmVzaXplJywgKCkgPT4gdGhpcy5vblJlc2l6ZSgpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvblJlc2l6ZSgpOiB2b2lkIHtcblxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xuICAgICAgICBpZiAoYnJlYWtwb2ludC5kZXNrdG9wICYmICFicm93c2VyLm1vYmlsZSkge1xuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gJHdpbmRvdy53aWR0aCgpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSAkd2luZG93LmhlaWdodCgpO1xuXG4gICAgICAgIGNvbnN0IGNoYW5nZWQgPSAhdGhpcy5sYXN0QnJlYWtwb2ludCB8fCB0aGlzLmxhc3RCcmVha3BvaW50LnZhbHVlICE9PSBicmVha3BvaW50LnZhbHVlO1xuICAgICAgICB0aGlzLmxhc3RCcmVha3BvaW50ID0gYnJlYWtwb2ludDtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5yZXNpemUod2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xuICAgICAgICB0aGlzLmxvYWRlci5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLnJlc2l6ZSgpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHByZWxvYWRBc3NldHMoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IGFzc2V0cyA9IFtdO1xuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQoJy5wcmVsb2FkLWJnJywge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFzc2V0cyAmJiBhc3NldHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKGFzc2V0c1tpXSwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWwuanFEZWZlcnJlZC5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgLy8gY2hlY2sgaWYgYW55IGNvbXBvbmVudCBoYW5kbGUgb25TdGF0ZSBldmVudFxuICAgIC8vIGlmIG5vdCwgcmVsb2FkIGh0bWw6XG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xuXG4gICAgICAgIC8vIGNvbnN0IHNjcm9sbGluZ0NoYW5nZWRTdGF0ZSA9IHRoaXMuc2Nyb2xsLm9uU3RhdGUoKTtcbiAgICAgICAgY29uc3QgcGFnZUNoYW5nZWRTdGF0ZSA9IHRoaXMuY3VycmVudFBhZ2Uub25TdGF0ZSgpO1xuXG4gICAgICAgIC8vIGlmICghc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlICYmICFvZmZzY3JlZW5DaGFuZ2VkU3RhdGUgJiYgIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcbiAgICAgICAgaWYgKCFwYWdlQ2hhbmdlZFN0YXRlKSB7XG5cbiAgICAgICAgICAgIC8vIEFuYWx5dGljcy5zZW5kUGFnZXZpZXcod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcblxuICAgICAgICAgICAgY29uc3QgcHVzaFN0YXRlc0xvYWRQcm9taXNlID0gdGhpcy5wdXNoU3RhdGVzLmxvYWQoKTtcbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGVPdXRQcm9taXNlID0gdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlT3V0KCk7XG5cbiAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnNjcm9sbC5zdG9wKCk7XG5cbiAgICAgICAgICAgIC8vIGFsbCBwcm9taXNlcyBhcnJheTpcbiAgICAgICAgICAgIGNvbnN0IGxvYWRpbmdQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBbXG4gICAgICAgICAgICAgICAgcHVzaFN0YXRlc0xvYWRQcm9taXNlLFxuICAgICAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgLy8gcmVuZGVyIGh0bWwgd2hlbiBldmVyeXRoaW5nJ3MgcmVhZHk6XG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihsb2FkaW5nUHJvbWlzZXMpLnRoZW4odGhpcy5yZW5kZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8vIGRpc3BsYXkgYWpheCBwcm9ncmVzczpcbiAgICBwcml2YXRlIG9uTG9hZFByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSAqIHByb2dyZXNzKTtcbiAgICB9XG5cblxuXG4gICAgLy8gcGFzcyBsb2FkaW5nIHByb2dyZXNzIGZyb20gcGFnZSB0byBwcmVsb2FkZXI6XG4gICAgcHJpdmF0ZSBvblBhZ2VQcm9ncmVzcyA9IChwcm9ncmVzczogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKyAwLjUgKiBwcm9ncmVzcyk7XG4gICAgfVxuXG5cblxuICAgIC8vIGRlYWwgd2l0aCBuZXdseSBhZGRlZCBlbGVtZW50c1xuICAgIHByaXZhdGUgb25QYWdlQXBwZW5kID0gKGVsOiBKUXVlcnkpOiB2b2lkID0+IHtcbiAgICAgICAgUHVzaFN0YXRlcy5iaW5kKGVsWzBdKTtcbiAgICAgICAgLy8gV2lkZ2V0cy5iaW5kKGVsWzBdKTtcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xuICAgIH1cblxuXG5cbiAgICAvLyBjYWxsZWQgYWZ0ZXIgbmV3IGh0bWwgaXMgbG9hZGVkXG4gICAgLy8gYW5kIG9sZCBjb250ZW50IGlzIGFuaW1hdGVkIG91dDpcbiAgICBwcml2YXRlIHJlbmRlciA9ICgpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5vZmYoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNjcm9sbC5kZXN0cm95KCk7XG5cbiAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XG5cbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLnJlbmRlcigpO1xuICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUoJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJykuYXR0cignY29udGVudCcpKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgZGV0ZWN0SG9tZVBhZ2UoKTogdm9pZCB7XG4gICAgICAgICRwYWdlSGVhZGVyID8gJGJvZHkuYWRkQ2xhc3MoJ2lzLWhvbWUtcGFnZScpIDogbnVsbDtcbiAgICB9XG5cblxuICAgIC8vIHdoZW4gY3VycmVudCBwYWdlIGlzIGxvYWRlZDpcbiAgICBwcml2YXRlIG9uUGFnZUxvYWRlZCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLW5vdC1yZWFkeScpO1xuICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xuICAgICAgICB0aGlzLmxvYWRlci5oaWRlKCk7XG4gICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJGJvZHksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVJbigpO1xuICAgICAgICAkcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XG4gICAgICAgIHRoaXMuZGV0ZWN0SG9tZVBhZ2UoKTtcbiAgICAgICAgUHVzaFN0YXRlcy5zZXROYXZiYXJWaXNpYmlsaXR5KCk7XG4gICAgICAgIC8vIHRoaXMuY29va2llcy50cnlUb1Nob3coKTtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvUGF0aCh0cnVlKTtcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xuICAgICAgICB0aGlzLnNjcm9sbC5zdGFydCgpO1xuICAgICAgICAkKCdhcnRpY2xlJykucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWxvYWRlZCcpO1xuICAgIH1cblxuXG5cbiAgICAvLyBydW4gbmV3IFBhZ2Ugb2JqZWN0XG4gICAgLy8gKGZvdW5kIGJ5IGBkYXRhLXBhZ2VgIGF0dHJpYnV0ZSlcbiAgICAvLyBiaW5kIGl0IGFuZCBzdG9yZSBhcyBjdXJyZW50UGFnZTpcbiAgICBwcml2YXRlIHNldEN1cnJlbnRQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgJHBhZ2VFbDogSlF1ZXJ5ID0gJCgnW2RhdGEtcGFnZV0nKSxcbiAgICAgICAgICAgIHBhZ2VOYW1lOiBzdHJpbmcgPSAkcGFnZUVsLmRhdGEoJ3BhZ2UnKSB8fCAnUGFnZScsXG4gICAgICAgICAgICBwYWdlT3B0aW9uczogT2JqZWN0ID0gJHBhZ2VFbC5kYXRhKCdvcHRpb25zJyk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJHBhZ2VFbCwgcGFnZU5hbWUpO1xuXG4gICAgICAgIC8vIHBhZ2Ugbm90IGZvdW5kOlxuICAgICAgICBpZiAocGFnZU5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGluIFBhZ2VzIScsIHBhZ2VOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhZ2VOYW1lID0gJ1BhZ2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW9yZSB0aGFuIG9uZSBkYXRhLXBhZ2U6XG4gICAgICAgIGlmICgkcGFnZUVsLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignT25seSBvbmUgW2RhdGEtcGFnZV0gZWxlbWVudCwgcGxlYXNlIScpO1xuXG4gICAgICAgIC8vIHBhZ2Ugbm90IGRlZmluZWQgaW4gaHRtbDpcbiAgICAgICAgfSBlbHNlIGlmICgkcGFnZUVsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgJHBhZ2VFbCA9ICQoJCgnI21haW4nKS5maW5kKCdhcnRpY2xlJylbMF0gfHwgJCgnI21haW4nKS5jaGlsZHJlbigpLmZpcnN0KClbMF0pO1xuICAgICAgICB9XG5cblxuXG4gICAgICAgIC8vIGNyZWF0ZSBQYWdlIG9iamVjdDpcbiAgICAgICAgbGV0IHBhZ2U6IFBhZ2UgPSBuZXcgcGFnZXNbcGFnZU5hbWVdKCRwYWdlRWwsIHBhZ2VPcHRpb25zKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IHBhZ2U7XG5cbiAgICAgICAgLy8gYmluZCBldmVudHM6XG4gICAgICAgIEFQSS5iaW5kKCk7XG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5QUk9HUkVTUywgdGhpcy5vblBhZ2VQcm9ncmVzcyk7XG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5DSEFOR0UsIHRoaXMub25QYWdlQXBwZW5kKTtcblxuICAgICAgICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgICAgICAgcmV0dXJuIHBhZ2UucHJlbG9hZCgpO1xuICAgIH1cbn1cblxuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgc2l0ZSA9IG5ldyBTaXRlKCk7XG4gICAgc2l0ZS5pbml0KCk7XG59KTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9zdGF0cy5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9tb2Rlcm5penIuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4vU2l0ZSc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVUlEKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICcnICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSArIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XG59XG5cblxuZXhwb3J0IGNvbnN0IGtleXMgPSB7XG4gICAgZW50ZXI6IDEzLFxuICAgIGVzYzogMjcsXG4gICAgc3BhY2U6IDMyLFxuICAgIGxlZnQ6IDM3LFxuICAgIHVwOiAzOCxcbiAgICByaWdodDogMzksXG4gICAgZG93bjogNDAsXG4gICAgcGFnZVVwOiAzMyxcbiAgICBwYWdlRG93bjogMzQsXG4gICAgZW5kOiAzNSxcbiAgICBob21lOiAzNixcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtcyh1cmwpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgIHZhciBwYXJzZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgcGFyc2VyLmhyZWYgPSB1cmw7XG4gICAgdmFyIHF1ZXJ5ID0gcGFyc2VyLnNlYXJjaC5zdWJzdHJpbmcoMSk7XG4gICAgdmFyIHZhcnMgPSBxdWVyeS5zcGxpdCgnJicpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgcGFyYW1zW3BhaXJbMF1dID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zO1xufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdEF1dG9wbGF5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIE1vZGVybml6ci52aWRlb2F1dG9wbGF5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTW9kZXJuaXpyLm9uKCd2aWRlb2F1dG9wbGF5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb1RpbWUoc2VjOiBudW1iZXIpOiBzdHJpbmcge1xuXG4gICAgY29uc3QgdG90YWxTZWMgPSBwYXJzZUludCgnJyArIHNlYywgMTApO1xuICAgIGNvbnN0IGhvdXJzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDM2MDAsIDEwKSAlIDI0O1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gNjAsIDEwKSAlIDYwO1xuICAgIGNvbnN0IHNlY29uZHMgPSB0b3RhbFNlYyAlIDYwO1xuICAgIGNvbnN0IGhyc0Rpc3BsYXkgPSAoaG91cnMgPCAxMCA/ICcwJyArIGhvdXJzIDogaG91cnMpICsgJzonO1xuXG4gICAgcmV0dXJuIChob3VycyA+IDAgPyBocnNEaXNwbGF5IDogJycpICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArIChzZWNvbmRzIDwgMTAgPyAnMCcgKyBzZWNvbmRzIDogc2Vjb25kcyk7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHMoKTogU3RhdHMge1xuXG4gICAgY29uc3Qgc3RhdHMgPSBuZXcgU3RhdHMoKTtcblxuICAgIHN0YXRzLnNob3dQYW5lbCggMCApOyAvLyAwOiBmcHMsIDE6IG1zLCAyOiBtYiwgMys6IGN1c3RvbVxuICAgICQoc3RhdHMuZG9tKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6ICdub25lJywgJ3RvcCc6IDExMH0pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbSApO1xuXG4gICAgZnVuY3Rpb24gYW5pbWF0ZSgpOiB2b2lkIHtcbiAgICAgICAgc3RhdHMuYmVnaW4oKTtcbiAgICAgICAgLy8gbW9uaXRvcmVkIGNvZGUgZ29lcyBoZXJlXG4gICAgICAgIHN0YXRzLmVuZCgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcblxuICAgIHJldHVybiBzdGF0cztcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lRm9ybWF0KHRpbWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCkudG9TdHJpbmcoKTtcbiAgICBtaW51dGVzID0gKHBhcnNlSW50KG1pbnV0ZXMsIDEwKSA+PSAxMCkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcbiAgICBsZXQgc2Vjb25kcyA9IE1hdGguZmxvb3IodGltZSAlIDYwKS50b1N0cmluZygpO1xuICAgIHNlY29uZHMgPSAocGFyc2VJbnQoc2Vjb25kcywgMTApID49IDEwKSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMudG9TdHJpbmcoKSArICc6JyArIHNlY29uZHMudG9TdHJpbmcoKTtcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJbWFnZVNvdXJjZXMoKTogdm9pZCB7XG4gICAgaWYgKGJyb3dzZXIuaWUpIHtcbiAgICAgICAgJCgnW2RhdGEtaWVzcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLWllc3JjJykpO1xuICAgICAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1pZXNyYycpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkKCdbZGF0YS1zcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuXG4gICAgJCgnW2RhdGEtc3Jjc2V0XScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpKTtcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcbiAgICB9KTtcbn1cblxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKGltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWRbXT4ge1xuLy8gICAgIHJldHVybiBQcm9taXNlLmFsbChpbWFnZXMubWFwKChpbWFnZSk6IFByb21pc2U8dm9pZD4gPT4ge1xuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLy8gICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25hYm9ydCA9ICgpID0+IHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgIGltZy5zcmMgPSBpbWFnZTtcbi8vICAgICAgICAgICAgIGlmIChpbWcuY29tcGxldGUgJiYgJChpbWcpLmhlaWdodCgpID4gMCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxuLy8gICAgICAgICB9KTtcbi8vICAgICB9KSk7XG4vLyB9XG5cblxuXG4vLyBleHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXM6IEpRdWVyeSk6IFByb21pc2U8dm9pZFtdPiB7XG4vLyAgICAgbGV0IGlzQmFzZTY0OiBib29sZWFuO1xuLy8gICAgIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSAkaW1hZ2VzLnRvQXJyYXkoKVxuLy8gICAgICAgICAubWFwKChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xuLy8gICAgICAgICAgICAgbGV0IGltYWdlU291cmNlID0gaW1nLmN1cnJlbnRTcmMgfHwgaW1nLnNyYztcbi8vICAgICAgICAgICAgIGlmIChpbWFnZVNvdXJjZS5pbmRleE9mKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsJykgPj0gMCkgeyBpc0Jhc2U2NCA9IHRydWU7IH1cbi8vICAgICAgICAgICAgIHJldHVybiBpbWFnZVNvdXJjZTtcbi8vICAgICAgICAgfSk7XG5cbi8vICAgICAvLyBjb25zb2xlLmxvZyhpbWFnZXMpO1xuXG4vLyAgICAgaWYgKCFpc0Jhc2U2NCkge1xuLy8gICAgICAgICByZXR1cm4gcHJlbG9hZEltYWdlcyhpbWFnZXMpO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbi8vICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuLy8gICAgICAgICAgICAgICAgIGNoZWNrQW5kUHJlbG9hZEltYWdlcygkaW1hZ2VzKS50aGVuKCgpID0+IHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgICAgIH0pO1xuLy8gICAgICAgICAgICAgfSwgMjAwKTtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgfVxuLy8gfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlKGEpOiBBcnJheTxhbnk+IHtcbiAgICBsZXQgaiwgeCwgaTtcbiAgICBmb3IgKGkgPSBhLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB4ID0gYVtpXTtcbiAgICAgICAgYVtpXSA9IGFbal07XG4gICAgICAgIGFbal0gPSB4O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Um9vdFZhcnMoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gYnJlYWtwb2ludC5kZXNrdG9wID8gJCgnI25hdmJhcicpLmhlaWdodCgpIDogMDtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXBwLWhlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtIGhlYWRlckhlaWdodH1weGApO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtMjUnLCBgJHskKCcuY29sLXBhdHRlcm4tMjUnKS53aWR0aCgpfXB4YCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC02NicsIGAkeyQoJy5jb2wtNjYnKS53aWR0aCgpfXB4YCk7XG4gICAgbGV0IG1hcmcgPSAhYnJlYWtwb2ludC5kZXNrdG9wID8gNTAgOiAxMjA7XG4gICAgJCgnLmFzaWRlJykuY3NzKCdoZWlnaHQnLCAkd2luZG93LmhlaWdodCgpICsgbWFyZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcbiAgICAkKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNUKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xuICAgIGxldCBwb3NpdGlvbiA9IGJyb3dzZXIuaWUgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJztcbiAgICBsZXQgdG9wID0gYnJvd3Nlci5pZSA/ICcnIDogLXNUICsgJ3B4JztcbiAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgJCgnYm9keScpLmNzcyh7XG4gICAgICAgIC8vICdwb3NpdGlvbic6IHBvc2l0aW9uLFxuICAgICAgICAvLyAndG9wJzogdG9wLFxuICAgICAgICAvLyAnYm90dG9tJzogJzAnLFxuICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcbiAgICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RvcCcsXG4gICAgICAgICd3aWR0aCc6ICcxMDAlJyxcbiAgICAgICAgJ3RvdWNoLWFjdGlvbic6ICdub25lJyxcbiAgICB9KTtcblxufVxuXG5cbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnMgPSB7XG4gICAgJ2ludmFsaWQtZW1haWwnOiB7XG4gICAgICAgICdlbic6ICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MgZm9ybWF0JyxcbiAgICAgICAgJ3BsJzogJ05pZXBvcHJhd255IGZvcm1hdCBhZHJlc3UgZS1tYWlsJyxcbiAgICB9LFxuICAgICdyZXF1aXJlZC1maWVsZCc6IHtcbiAgICAgICAgJ2VuJzogJ1JlcXVpcmVkIGZpZWxkJyxcbiAgICAgICAgJ3BsJzogJ1BvbGUgb2Jvd2nEhXprb3dlJyxcbiAgICB9LFxuICAgICdpbnZhbGlkLXppcCc6IHtcbiAgICAgICAgJ2VuJzogJ0VudGVyIHppcC1jb2RlIGluIGZpdmUgZGlnaXRzIGZvcm1hdCcsXG4gICAgICAgICdwbCc6ICdXcGlzeiBrb2QgcG9jenRvd3kgdyBmb3JtYWNpZSBYWC1YWFgnLFxuICAgIH0sXG59O1xuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xuXG5pbnRlcmZhY2UgSUNoYXJ0U2V0dGluZ3Mge1xuICAgIGlkOiBudW1iZXI7XG4gICAgeFBlcmNlbnQ6IG51bWJlcjtcbiAgICB5UG9pbnRzOiBBcnJheTxudW1iZXI+O1xuICAgIGNvbG9yOiBzdHJpbmc7XG4gICAgeVB4OiBBcnJheTxudW1iZXI+O1xuICAgIGZpbGw/OiBib29sZWFuO1xuICAgIHNob3duPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIENoYXJ0IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcblxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XG4gICAgICAgIHRvcDogNSxcbiAgICAgICAgbGVmdDogMjUsXG4gICAgICAgIHJpZ2h0OiA1MCxcbiAgICAgICAgYm90dG9tOiA0OVxuICAgIH07XG5cbiAgICBwcml2YXRlIGdyYXBoOiBhbnkgPSB7XG4gICAgICAgIHRvcDogMCxcbiAgICAgICAgbGVmdDogMCxcbiAgICAgICAgcmlnaHQ6IDAsXG4gICAgICAgIGJvdHRvbTogMCxcbiAgICAgICAgaGVpZ2h0OiAwLFxuICAgICAgICB3aWR0aDogMCxcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBjb2xvcnM6IGFueSA9IHtcbiAgICAgICAgZ3JheTogJ3JnYmEoOTcsOTcsOTcsMC41KScsXG4gICAgICAgIG9yYW5nZTogJyNmYzhjNTknLFxuICAgICAgICBtaW50OiAnIzRmZGJjNScsXG4gICAgICAgIGJsdWU6ICcjNTg3N2NjJyxcbiAgICAgICAgcGluazogJyNCNjBFNjMnLFxuICAgICAgICB3aGl0ZTogJyNmZmYnLFxuICAgICAgICBiZWlnZTogJyNmZGQ0OWUnLFxuICAgICAgICBjaW5uYWJhcjogJyNlNzUwNDAnLFxuICAgICAgICBzZWE6ICcjMjZiYmUzJyxcbiAgICB9XG5cbiAgICBwcml2YXRlIGdyYXBoc0RhdGE6IEFycmF5PElDaGFydFNldHRpbmdzPiA9IFtdO1xuICAgIHByaXZhdGUgZGF0YUluaXQ6IGJvb2xlYW47XG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXdyYXBwZXInKTtcbiAgICAgICAgdGhpcy4kdGFiID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLWNoYXJ0LXRhYl0nKTtcbiAgICAgICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+dGhpcy52aWV3LmZpbmQoJ2NhbnZhcycpWzBdO1xuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG5cbiAgICAgICAgdGhpcy5yZXNpemUoKTtcblxuICAgICAgICBjb25zdCBwYXJhbXNDaGFydHMgPSBVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkuY2hhcnRzO1xuICAgICAgICBjb25zdCBpbml0Q2hhcnRzID0gcGFyYW1zQ2hhcnRzID8gcGFyYW1zQ2hhcnRzLnNwbGl0KCcsJykubWFwKChpKSA9PiBwYXJzZUludChpLCAxMCkpIDogWzAsIDMsIDRdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4kdGFiLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNoYXJ0KGksIGluaXRDaGFydHMuaW5kZXhPZihpKSA+PSAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuJHdyYXBwZXIud2lkdGgoKTtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy4kd3JhcHBlci5oZWlnaHQoKTtcblxuICAgICAgICB0aGlzLmdyYXBoID0ge1xuICAgICAgICAgICAgdG9wOiB0aGlzLm1hcmdpbi50b3AsXG4gICAgICAgICAgICBsZWZ0OiB0aGlzLm1hcmdpbi5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQgKyB0aGlzLm1hcmdpbi5sZWZ0LFxuICAgICAgICAgICAgYm90dG9tOiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLnRvcCAtIHRoaXMubWFyZ2luLmJvdHRvbSxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLmxlZnQgLSB0aGlzLm1hcmdpbi5yaWdodCxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICAgICAgaWYgKCF0aGlzLmRhdGFJbml0KSB7XG4gICAgICAgICAgICB0aGlzLmNyZWF0ZURhdGFPYmplY3QoKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBjcmVhdGVEYXRhT2JqZWN0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0YWIuZWFjaCggKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJQ2hhcnRTZXR0aW5ncz57XG4gICAgICAgICAgICAgICAgaWQ6IGksXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXG4gICAgICAgICAgICAgICAgeVBvaW50czogJChlbCkuZGF0YSgncG9pbnRzJyksXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuc2V0Q29sb3IoJChlbCkuZGF0YSgnY29sb3InKSksXG4gICAgICAgICAgICAgICAgeVB4OiB0aGlzLmNhbGNZUHgoJChlbCkuZGF0YSgncG9pbnRzJykpLFxuICAgICAgICAgICAgICAgIGZpbGw6IGkgPT09IDAgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB0aGlzLmdyYXBoc0RhdGEucHVzaChkYXRhSXRlbSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuZGF0YUluaXQgPSB0cnVlO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vbkNsaWNrVGFiKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvbkNsaWNrVGFiID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGVDaGFydCgkKGUuY3VycmVudFRhcmdldCkuaW5kZXgoKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgdG9nZ2xlQ2hhcnQoaW5kZXg6IG51bWJlciwgc2hvdz86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzaG93ID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgc2hvdyA9ICF0aGlzLmdyYXBoc0RhdGFbaW5kZXhdLnNob3duO1xuICAgICAgICB9XG5cbiAgICAgICAgZ3NhcC50byh0aGlzLmdyYXBoc0RhdGFbaW5kZXhdLCB7XG4gICAgICAgICAgICBkdXJhdGlvbjogMixcbiAgICAgICAgICAgIHhQZXJjZW50OiBzaG93ID8gMSA6IDAsXG4gICAgICAgICAgICBlYXNlOiAnc2luZS5pbk91dCcsXG4gICAgICAgICAgICBvblVwZGF0ZTogdGhpcy5kcmF3LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiR0YWIuZXEoaW5kZXgpLnRvZ2dsZUNsYXNzKCdpcy1vbi1jaGFydCcsIHNob3cpO1xuICAgICAgICB0aGlzLmdyYXBoc0RhdGFbaW5kZXhdLnNob3duID0gc2hvdztcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBkcmF3ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZHJhd0JnKCk7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKChncmFwaERhdGEpID0+IHRoaXMuZHJhd0dyYXBoKGdyYXBoRGF0YSkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGRyYXdCZygpOiB2b2lkIHtcblxuICAgICAgICAvLyBkcmF3IFggYXhpc1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcblxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLmdyYXk7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLm1hcmdpbi5sZWZ0LCB0aGlzLm1hcmdpbi50b3ApO1xuICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgY29uc3QgaGVscGVyc0xpbmUgPSA4O1xuICAgICAgICBjb25zdCB0ZXh0VHJhbnNmb3JtID0gNTtcbiAgICAgICAgY29uc3Qgc3RlcCA9IDU7XG4gICAgICAgIGxldCB2YWw7XG4gICAgICAgIGNvbnN0IHllYXJzID0gWzIwMTUsIDIwMTYsIDIwMTcsIDIwMTgsIDIwMTksIDIwMjAsIDIwMjFdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGhlbHBlcnNMaW5lOyBpKyspIHtcbiAgICAgICAgICAgIHZhbCA9IDUwIC0gc3RlcCAqIGk7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy5ibHVlO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB2YWwgKyAnJywgMCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCArIHRleHRUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMubWFyZ2luLmxlZnQsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3ApO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3ApO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeWVhcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB5ZWFyc1tqXSArICcnLCAodGhpcy5jYW52YXMud2lkdGggKyB0aGlzLm1hcmdpbi5yaWdodCArIHRoaXMubWFyZ2luLmxlZnQpIC8geWVhcnMubGVuZ3RoICogaiArIHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRleHRUcmFuc2Zvcm0gKiAyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZHJhd0dyYXBoID0gKGRhdGE6IElDaGFydFNldHRpbmdzKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMztcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjb25zdCBjb2xXaWR0aCA9IHRoaXMuZ3JhcGgucmlnaHQgLyBkYXRhLnlQeC5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG1heFggPSBkYXRhLnhQZXJjZW50ICogKHRoaXMuZ3JhcGgucmlnaHQgLSB0aGlzLmdyYXBoLmxlZnQpICsgdGhpcy5ncmFwaC5sZWZ0O1xuICAgICAgICBkYXRhLnlQeC5mb3JFYWNoKCAoeSwgaSwgYSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeCA9IGNvbFdpZHRoICogaSArIHRoaXMuZ3JhcGgubGVmdDtcbiAgICAgICAgICAgIGlmICh4IDw9IG1heFggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpLTFdXSwgW3gsIHldKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgaWYgKGRhdGEuZmlsbCkge1xuICAgICAgICAgICAgbGV0IGxhc3RYID0gdGhpcy5tYXJnaW4ubGVmdDtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IDAuNDtcblxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICBkYXRhLnlQeC5mb3JFYWNoKCAoeSwgaSwgYSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBjb2xXaWR0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XG4gICAgICAgICAgICAgICAgaWYgKHggPD0gbWF4WCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RYID0geDtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKG1heFgsIHRoaXMuZ2V0SW50ZXJQb2ludHNZKG1heFgsIFt4IC0gY29sV2lkdGgsIGFbaSAtIDFdXSwgW3gsIHldKSk7XG4gICAgICAgICAgICAgICAgICAgIGxhc3RYID0gbWF4WDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyhsYXN0WCwgdGhpcy5ncmFwaC5ib3R0b20pO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgubGVmdCwgdGhpcy5ncmFwaC5ib3R0b20pO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuICAgICAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLy8vIEhFTFBFUlNcblxuICAgIHByaXZhdGUgbGFyZ2VzdFlWYWwoZGF0YTogQXJyYXk8bnVtYmVyPik6IG51bWJlciB7XG4gICAgICAgIGxldCBsYXJnZXN0ID0gMDtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKysgKSB7XG4gICAgICAgICAgICBpZiAoZGF0YVtpXSA+IGxhcmdlc3QpIHtcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gZGF0YVtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsYXJnZXN0O1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGNhbGNZUHgoZGF0YSk6IEFycmF5PG51bWJlcj4ge1xuICAgICAgICBjb25zdCBsYXJnZXN0ID0gdGhpcy5sYXJnZXN0WVZhbChkYXRhKTtcbiAgICAgICAgbGV0IGFyciA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IGl0ZW0gPSBNYXRoLnJvdW5kKCh0aGlzLmdyYXBoLmhlaWdodCAtIGRhdGFbaV0gLyBsYXJnZXN0ICogdGhpcy5ncmFwaC5oZWlnaHQpICsgdGhpcy5ncmFwaC50b3ApO1xuICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHNldENvbG9yKGNvbG9yOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgICAgICBsZXQgaGV4O1xuXG4gICAgICAgIGZvciAoY29uc3QgcHJvcGVydHkgaW4gdGhpcy5jb2xvcnMpIHtcbiAgICAgICAgICAgIGlmIChjb2xvciA9PT0gcHJvcGVydHkpIHtcbiAgICAgICAgICAgICAgICBoZXggPSB0aGlzLmNvbG9yc1twcm9wZXJ0eV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaGV4O1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGdldEludGVyUG9pbnRzWSh4OiBudW1iZXIsIHBvaW50QTogbnVtYmVyW10sIHBvaW50QjogbnVtYmVyW10pOiBudW1iZXIge1xuICAgICAgICBjb25zdCBbeDEsIHkxXSA9IHBvaW50QTtcbiAgICAgICAgY29uc3QgW3gyLCB5Ml0gPSBwb2ludEI7XG4gICAgICAgIHJldHVybiAoeTIgLSB5MSkgKiAoeCAtIHgxKSAvICh4MiAtIHgxKSArIHkxO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcbmltcG9ydCB7IElCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb25lbnRFdmVudHMge1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnY2hhbmdlJztcbn1cblxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIEhhbmRsZXIge1xuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz86IE9iamVjdCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICBpZiAoIXZpZXdbMF0pIHsgY29uc29sZS53YXJuKCdjb21wb25lbnQgYnVpbHQgd2l0aG91dCB2aWV3Jyk7IH1cbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCB0aGlzKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHByZWxvYWRJbWFnZXMoKTogQXJyYXk8c3RyaW5nPiB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGFuaW1hdGVJbihpbmRleD86IG51bWJlciwgZGVsYXk/OiBudW1iZXIpOiB2b2lkIHsgfVxuXG5cblxuICAgIHB1YmxpYyBhbmltYXRlT3V0KCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGlmIHlvdSBkb24ndCB3YW50IHRvIGFuaW1hdGUgY29tcG9uZW50LFxuICAgICAgICAvLyBqdXN0IHJldHVybiBlbXB0eSBQcm9taXNlOlxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG4gICAgICAgIC8vIGlmIHlvdSBuZWVkIGFuaW1hdGlvbjpcbiAgICAgICAgLy8gcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgLy8gICAgIGdzYXAudG8odGhpcy52aWV3LCB7XG4gICAgICAgIC8vICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xuICAgICAgICAvLyAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgIC8vICAgICAgICAgfSxcbiAgICAgICAgLy8gICAgICAgICBkdXJhdGlvbjogMC4zLFxuICAgICAgICAvLyAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgIC8vICAgICB9KTtcbiAgICAgICAgLy8gfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQgeyB9XG5cblxuXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHsgfVxuXG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHsgfTtcblxuXG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCBudWxsKTtcbiAgICAgICAgdGhpcy52aWV3Lm9mZigpO1xuICAgICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIERhc2hib2FyZCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICR0b2dnbGU6IEpRdWVyeTtcbiAgICBwcml2YXRlICRib2R5OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBpc1RvZ2dsZWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSBib2R5SGVpZ2h0OiBudW1iZXI7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdG9nZ2xlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1idXR0b24tdG9nZ2xlJyk7XG4gICAgICAgIHRoaXMuJGJvZHkgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWRhc2hib2FyZC1ib2R5Jyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMuaW5pdGlhbFN0YXRlKCk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG5cbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0b2dnbGUub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlUGFuZWwpO1xuICAgIH1cblxuICAgIHByaXZhdGUgdG9nZ2xlUGFuZWwgPSAoZSkgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNUb2dnbGVkKSB7XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnYXV0bycsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxuICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuJGJvZHkuYWRkQ2xhc3MoJ2lzLXRvZ2dsZWQnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kYm9keS5yZW1vdmVDbGFzcygnaXMtdG9nZ2xlZCcpO1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJzAnLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNUb2dnbGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGluaXRpYWxTdGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgZ3NhcC5zZXQodGhpcy4kYm9keSwgeyBoZWlnaHQ6ICcwJ30pO1xuICAgIH1cbiAgICBcbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vRmlsdGVycyc7XG5cbmV4cG9ydCBjbGFzcyBEcm9wZG93biBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW4gPSBmYWxzZTtcbiAgICBwcml2YXRlICRzZWxlY3RlZDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12YWx1ZV0nKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCB0aGlzLiRzZWxlY3RlZC50ZXh0KCkpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnZpZXcub2ZmKCcuc2VsZWN0Jykub24oJ2NsaWNrLnNlbGVjdCcsIHRoaXMudG9nZ2xlKTtcbiAgICAgICAgJGRvYy5vZmYoJy5kcm9wZG93bicpLm9uKCdjbGljay5kcm9wZG93bicsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZygndG9nZ2xlIGRwJyk7XG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBvcGVuU2VsZWN0KGUpOiB2b2lkIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY2xvc2VTZWxlY3QoKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnb3Blbj8nKTtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnPz8/Pz8nKTtcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpICYmICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd2YWx1ZScpO1xuXG4gICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcblxuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZC1jb3VudHJ5JywgY3VycmVudCk7XG5cbiAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycyhjdXJyZW50KTtcbiAgICAgICAgfSwgMzAwKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgRmlsdGVycyBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBGaWx0ZXJzO1xuXG4gICAgcHJpdmF0ZSAkY2xlYXI6IEpRdWVyeTtcbiAgICBwcml2YXRlICRwYW5lbDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGl0ZW1TZWN0b3I6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtVGltZTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHRpbWVsaW5lSXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGFsbFNlY3RvcnM6IEpRdWVyeTtcbiAgICBwcml2YXRlICRwaWNrZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRzZWxlY3RlZENvdW50cnk6IEpRdWVyeTtcblxuICAgIHByaXZhdGUgZmlsdGVyczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIHByaXZhdGUgaXNBbGxDaGVja2VkOiBib29sZWFuO1xuXG5cbiAgICBwdWJsaWMgc3RhdGljIHNob3dQaWNrZWRGaWx0ZXJzKGNvdW50cnk/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgbGV0IHBpY2tlZFNlY3RvcnMgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcbiAgICAgICAgbGV0IHBpY2tlZFRpbWUgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuICAgICAgICBsZXQgcGlja2VkQ291bnRyeSA9IGNvdW50cnkgPyBjb3VudHJ5IDogRmlsdGVycy5pbnN0YW5jZS4kc2VsZWN0ZWRDb3VudHJ5LnRleHQoKTtcblxuXG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5maW5kKCdzcGFuJykucmVtb3ZlKCk7XG5cbiAgICAgICAgaWYgKHBpY2tlZFNlY3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBpY2tlZFNlY3RvcnMpO1xuXG4gICAgICAgICAgICBpZiAocGlja2VkU2VjdG9ycy5sZW5ndGggPT09IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FhbCcsIEZpbHRlcnMuaW5zdGFuY2UuJGFsbFNlY3RvcnMpO1xuICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzLnRleHQoKSArICc8L3NwYW4+Jyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHBpY2tlZFNlY3RvcnMuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArICQoZWwpLnRleHQoKSArICc8L3NwYW4+Jyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGlja2VkQ291bnRyeSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2cocGlja2VkQ291bnRyeSk7XG4gICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgcGlja2VkQ291bnRyeSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocGlja2VkVGltZSkge1xuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZFRpbWUuZGF0YSgnaXRlbS1sYWJlbCcpICsgJzwvc3Bhbj4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRjbGVhciA9IHRoaXMudmlldy5maW5kKCcuanMtY2xlYXInKTtcbiAgICAgICAgdGhpcy4kcGFuZWwgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXBhbmVsJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcbiAgICAgICAgdGhpcy4kaXRlbVRpbWUgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRpbWUnKTtcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXRpbWVdJyk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0tYWxsJyk7XG4gICAgICAgIHRoaXMuJHBpY2tlZCA9ICQoJy5qcy1waWNrZWQtZmlsdGVyJyk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkQ291bnRyeSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RdJyk7XG5cbiAgICAgICAgRmlsdGVycy5pbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIGNvbnNvbGUubG9nKEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IsIEZpbHRlcnMuaW5zdGFuY2Uudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKS5kYXRhKCdzZWxlY3RlZCcpKTtcbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4kY2xlYXIuY3NzKCdoZWlnaHQnLCB0aGlzLiRwYW5lbC5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLm9mZignLnNlY3RvcicpLm9uKCdjbGljay5zZWN0b3InLCB0aGlzLnRvZ2dsZVNlY3Rvcik7XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLm9mZignLnRpbWUnKS5vbignY2xpY2sudGltZScsIHRoaXMudG9nZ2xlVGltZSk7XG4gICAgICAgIHRoaXMuJGNsZWFyLm9mZignLmNsZWFyJykub24oJ2NsaWNrLmNsZWFyJywgdGhpcy5jbGVhckFycmF5KTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5vZmYoJy5hbGwnKS5vbignY2xpY2suYWxsJywgdGhpcy5tYXJrQWxsU2VjdG9ycyk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG1hcmtBbGxTZWN0b3JzID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCB0aW1lQ2hlY2tlZCA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG5cbiAgICAgICAgdGhpcy5jbGVhckFycmF5KCk7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoJChlbCksIHRoaXMuZmlsdGVycyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aW1lQ2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSh0aW1lQ2hlY2tlZCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKHRpbWVDaGVja2VkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgY2xlYXJBcnJheSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlU2VjdG9yID0gKGUpID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcblxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICBpZiAodGhpcy5pc0FsbENoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB0b2dnbGVUaW1lID0gKGUpID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgdGhpcy51bm1hcmtUaW1lbGluZSgpO1xuXG4gICAgICAgIGlmIChjdXJyZW50Lmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBhY3RpdmVQcmV2ID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcblxuICAgICAgICAgICAgaWYgKGFjdGl2ZVByZXYpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoYWN0aXZlUHJldiwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKGN1cnJlbnQpO1xuICAgICAgICB9XG5cbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBtYXJrVGltZWxpbmUoZWw6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2pzLXRpbWUnKSkge1xuICAgICAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVsaW5lZG90ID0gdGhpcy4kdGltZWxpbmVJdGVtLmZpbHRlcignW2RhdGEtdGltZT0nICsgZWwuZGF0YSgnaXRlbScpICsgJ10nKTtcbiAgICAgICAgICAgIHRpbWVsaW5lZG90LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB1bm1hcmtUaW1lbGluZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5maWx0ZXJzLmluZGV4T2YoJGVsLmRhdGEoJ2l0ZW0nKSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhZGRFbGVtZW50VG9BcnJheSgkZWw6IEpRdWVyeSwgYXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgYXJyYXkucHVzaCgkZWwuZGF0YSgnaXRlbScpKTtcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5pbnRlcmZhY2UgSURhdGFTdGF0IHtcbiAgICBzZWN0b3I6IHN0cmluZztcbiAgICB2YWx1ZTogbnVtYmVyO1xuICAgIGNvbG9yOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJR3JpZEl0ZW1Qb3NpdGlvbiB7XG4gICAgY29sdW1uX3N0YXJ0OiBudW1iZXI7XG4gICAgY29sdW1uX2VuZDogbnVtYmVyO1xuICAgIHJvd19zdGFydDogbnVtYmVyO1xuICAgIHJvd19lbmQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIE1hc29ucnkgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSBkYXRhOiBBcnJheTxJRGF0YVN0YXQ+ID0gW107XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgZGF0YUFycmF5OiBBcnJheTxhbnk+ID0gW107XG4gICAgcHJpdmF0ZSBhcmVhOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBpdGVtTWFyZ2luOiBudW1iZXIgPSAzO1xuICAgIHByaXZhdGUgZ3JpZFJvd3M6IG51bWJlciA9IDIwO1xuICAgIHByaXZhdGUgZ3JpZENvbHM6IG51bWJlciA9IDIwO1xuICAgIHByaXZhdGUgZ3JpZENlbGxzOiBudW1iZXIgPSB0aGlzLmdyaWRDb2xzICogdGhpcy5ncmlkUm93cztcbiAgICBwcml2YXRlIGNlbGxzQmFsYW5jZTogbnVtYmVyID0gdGhpcy5ncmlkQ2VsbHM7XG4gICAgcHJpdmF0ZSBncmlkQ2VsbDogYW55ID0ge1xuICAgICAgICB3aWR0aDogdGhpcy52aWV3LndpZHRoKCkgLyB0aGlzLmdyaWRDb2xzLFxuICAgICAgICBoZWlnaHQ6IHRoaXMudmlldy5oZWlnaHQoKSAvIHRoaXMuZ3JpZFJvd3MsXG4gICAgfTtcbiAgICBwcml2YXRlIG1pbkNlbGxXaWR0aDogbnVtYmVyID0gMztcbiAgICBwcml2YXRlIG1pbkNlbGxIZWlnaHQ6IG51bWJlciA9IDM7XG5cbiAgICBwcml2YXRlIGl0ZW1Qb3NpdGlvbmluZzogQXJyYXk8SUdyaWRJdGVtUG9zaXRpb24+ID0gW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbWFzb25yeS10aWxlJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0uZWFjaCggKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJRGF0YVN0YXQ+e1xuICAgICAgICAgICAgICAgIHNlY3RvcjogJChlbCkuZGF0YSgndGlsZScpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAkKGVsKS5kYXRhKCd2YWx1ZScpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAkKGVsKS5kYXRhKCdjb2xvcicpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGFJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYXJlYSA9ICh0aGlzLnZpZXcud2lkdGgoKSAtIHRoaXMuaXRlbU1hcmdpbiAqIDMpICogdGhpcy52aWV3LmhlaWdodCgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YSwgdGhpcy5hcmVhLCAnY2VsbCB3aWR0aCcsIHRoaXMuZ3JpZENlbGwud2lkdGgsICdjZWxsIGhlaWdodCcsIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICAgICAgXG4gICAgfTtcblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gdGhpcy5zZXRUaWxlU2l6ZSgpO1xuICAgICAgICB0aGlzLmdldEFyckZyb21PYmplY3QoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFyckZyb21PYmplY3QoKTogYW55IHtcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkgPSBPYmplY3QuZW50cmllcyh0aGlzLmRhdGEpLnNvcnQoKGEsIGIpID0+IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kYXRhQXJyYXkpO1xuXG4gICAgICAgIHRoaXMuZGF0YUFycmF5LmZvckVhY2goIChlbCwgaSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZWxbMV0udmFsdWUsIGksICdlbCcpO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBlbFsxXS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHNlY3RvciA9IGVsWzFdLnNlY3RvcjtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZWxbMV0uY29sb3I7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoc2VjdG9yLCB2YWx1ZSwgY29sb3IsIGluZGV4KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUaWxlU2l6ZShzZWN0b3I6IHN0cmluZywgdmFsdWU6IG51bWJlciwgY29sb3I6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXRpbGU9JyArIHNlY3RvciArICddJyk7XG4gICAgICAgIGxldCBhcmVhLCBoLCB3LCB0LCBsLCBjb2x1bW5fc3RhcnQsIGNvbHVtbl9lbmQsIHJvd19zdGFydCwgcm93X2VuZCwgaXRlbSwgYXJlYUdyaWQ7XG4gICAgICAgIFxuICAgICAgICBhcmVhID0gdGhpcy5hcmVhICogKHZhbHVlIC8gMTAwKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmVhLCAnOmFyZWEnLCB0aGlzLml0ZW1Qb3NpdGlvbmluZyx0aGlzLml0ZW1Qb3NpdGlvbmluZy5sZW5ndGggPiAwLCAnY2hlY2sgaWYgc29tZSBpdGVtIG9uIGFycmF5Jyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydCA9IDE7XG4gICAgICAgICAgICByb3dfc3RhcnQgPSAxO1xuICAgICAgICAgICAgcm93X2VuZCA9IHRoaXMuZ3JpZFJvd3M7XG4gICAgICAgICAgICBjb2x1bW5fZW5kID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwuaGVpZ2h0ICogcm93X2VuZCkgLyB0aGlzLmdyaWRDZWxsLndpZHRoKTtcbiAgICAgICAgICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpO1xuICAgICAgICAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgLy8gICAgIGNvbHVtbl9zdGFydCA9IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDwgdGhpcy5ncmlkQ29scyAtIHRoaXMubWluQ2VsbFdpZHRoID8gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgOiB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0yXS5jb2x1bW5fZW5kICsgMTtcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpID49IDYgPyBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgOiA2O1xuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcbiAgICAgICAgLy8gICAgIGNvbHVtbl9lbmQgPSBhcmVhR3JpZCAvIHRoaXMubWluQ2VsbFdpZHRoIFxuXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhhcmVhR3JpZCwgJ2Ftb3VudCBvZiBjZWxscycpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgaXRlbSA9IDxJR3JpZEl0ZW1Qb3NpdGlvbj57XG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQ6IGNvbHVtbl9zdGFydCxcbiAgICAgICAgICAgIGNvbHVtbl9lbmQ6IGNvbHVtbl9lbmQsXG4gICAgICAgICAgICByb3dfc3RhcnQ6IHJvd19zdGFydCxcbiAgICAgICAgICAgIHJvd19lbmQ6IHJvd19lbmQsXG4gICAgICAgIH07XG5cbiAgICAgICAgY3VycmVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLXN0YXJ0JzogY29sdW1uX3N0YXJ0LFxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLWVuZCc6IGNvbHVtbl9lbmQsXG4gICAgICAgICAgICAnZ3JpZC1yb3ctc3RhcnQnOiByb3dfc3RhcnQsXG4gICAgICAgICAgICAnZ3JpZC1yb3ctZW5kJzogJ3NwYW4nICsgcm93X2VuZCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogY29sb3IsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaXRlbVBvc2l0aW9uaW5nLnB1c2goaXRlbSk7XG4gICAgICAgIHRoaXMuY2VsbHNCYWxhbmNlID0gdGhpcy5jZWxsc0JhbGFuY2UgLSBhcmVhR3JpZDtcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5jZWxsc0JhbGFuY2UsICc6ZnJlZSBjZWxscycpO1xuICAgICAgICBcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuXG5cblxuaW50ZXJmYWNlIElQYXJhbGxheFNldHRpbmdzIHtcbiAgICBlbGVtZW50czogQXJyYXk8c3RyaW5nPjtcbiAgICBtb3ZlWDogQXJyYXk8bnVtYmVyPjtcbiAgICBtb3ZlWTogQXJyYXk8bnVtYmVyPjtcbn1cblxuXG5pbnRlcmZhY2UgSVBhcmFsbGF4RWxlbWVudERhdGEge1xuICAgICRlbDogSlF1ZXJ5O1xuICAgIG1vdmVYOiBudW1iZXI7XG4gICAgbW92ZVk6IG51bWJlcjtcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBQYXJhbGxheCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIG1vdmVYOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBtb3ZlWTogbnVtYmVyO1xuICAgIHByaXZhdGUgdGltZTogbnVtYmVyID0gMjtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBJUGFyYWxsYXhTZXR0aW5ncztcbiAgICBwcml2YXRlIGl0ZW1zOiBJUGFyYWxsYXhFbGVtZW50RGF0YVtdO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5jcmVhdGVWYWx1ZUFycmF5KCk7XG5cbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ1BhcmFsbGF4JywgdGhpcyk7XG5cblxuICAgICAgICBpZiAoYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5vbignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY3JlYXRlVmFsdWVBcnJheSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3JzID0gKHRoaXMuc2V0dGluZ3MuZWxlbWVudHMpLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuICAgICAgICBjb25zdCBtb3ZlWCA9ICh0aGlzLnNldHRpbmdzLm1vdmVYKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgY29uc3QgbW92ZVkgPSAodGhpcy5zZXR0aW5ncy5tb3ZlWSkubWFwKE51bWJlcik7XG5cbiAgICAgICAgdGhpcy5pdGVtcyA9IHNlbGVjdG9ycy5tYXAoKHNlbCwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy52aWV3LmZpbmQoJy4nICsgc2VsKTtcbiAgICAgICAgICAgIGlmICghJGVsWzBdKSB7IGNvbnNvbGUud2FybihgVGhlcmUgaXMgbm8gLiR7c2VsfSBlbGVtZW50IHRvIHVzZSBpbiBwYXJhbGxheGApOyB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgIG1vdmVYOiBtb3ZlWFtpXSxcbiAgICAgICAgICAgICAgICBtb3ZlWTogbW92ZVlbaV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KS5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIWl0ZW0uJGVsWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvbk1vdXNlTW92ZSA9IChldmVudCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLm1vdmVYID0gKCBldmVudC5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpIC0gMC41O1xuICAgICAgICB0aGlzLm1vdmVZID0gKCBldmVudC5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAtIDAuNTtcblxuICAgICAgICB0aGlzLmFuaW1hdGUoLXRoaXMubW92ZVgsIC10aGlzLm1vdmVZKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBhbmltYXRlKG1vdmVYLCBtb3ZlWSk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMpIHsgcmV0dXJuOyB9XG4gICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgZ3NhcC50byhpdGVtLiRlbCwge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnRpbWUsXG4gICAgICAgICAgICAgICAgeDogbW92ZVggKiBpdGVtLm1vdmVYLFxuICAgICAgICAgICAgICAgIHk6IG1vdmVZICogaXRlbS5tb3ZlWSxcbiAgICAgICAgICAgICAgICBlYXNlOiAncG93ZXIyJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgUmFuZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRyYWRpbzogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRyaWdnZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRyaWdnZXInKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJyk7XG4gICAgICAgIHRoaXMuJHJhZGlvID0gdGhpcy52aWV3LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRyaWdnZXIub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlKTtcbiAgICAgICAgJGRvYy5vZmYoJy5zbWFsbGRyb3Bkb3duJykub24oJ2NsaWNrLnNtYWxsZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICB0aGlzLiRyYWRpby5vZmYoJy5zZWxlY3Rpb24nKS5vbignY2xpY2suc2VsZWN0aW9uJywgdGhpcy5vbkl0ZW1DbGljayk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBvcGVuU2VsZWN0KGUpOiB2b2lkIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY2xvc2VTZWxlY3QoKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnb3Blbj8nKTtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoJChlLmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCdqcy1pdGVtJykgfHwgIXRoaXMuaXNPcGVuKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uSXRlbUNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ3ZhbHVlJyk7XG5cbiAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZC5odG1sKGN1cnJlbnQpO1xuXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCBjdXJyZW50KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuXG5leHBvcnQgY2xhc3MgU2xpZGVyIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcbiAgICBcbiAgICBwcml2YXRlIGluZGV4OiBudW1iZXIgPSAwO1xuICAgIHByaXZhdGUgJG5hdjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGNhcHRpb25zOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xuICAgICAgICB0aGlzLiRuYXYgPSB0aGlzLnZpZXcuZmluZCgnLmpzLW5hdicpO1xuICAgICAgICB0aGlzLiRjYXB0aW9ucyA9IHRoaXMudmlldy5maW5kKCcuanMtY2FwdGlvbicpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRuYXYub2ZmKCcubmF2Jykub24oJ2NsaWNrLm5hdicsIHRoaXMuc3dpdGNoU2xpZGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3dpdGNoU2xpZGUgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICB0aGlzLmluZGV4ID0gY3VycmVudC5pbmRleCgpO1xuXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlRWxlbWVudCh0aGlzLiRuYXYsIDApO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUVsZW1lbnQodGhpcy4kaXRlbSwgMTAwKTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGNhcHRpb25zLCAxMDAwKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgc2V0QWN0aXZlRWxlbWVudChlbDogSlF1ZXJ5LCBkZWxheTogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGVsLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIGVsLmVxKHRoaXMuaW5kZXgpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgfSwgZGVsYXkpO1xuICAgIH1cbn0iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XG5cblxuZXhwb3J0IGNsYXNzIFN0YXRzIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlICR3cmFwOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkY3VycmVudDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgdGFiVG9TaG93OiBudW1iZXI7IC8vIGZvciBhc3luYyBzd2l0Y2hcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdGFiID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXRhYl0nKTtcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12aWV3XScpO1xuICAgICAgICB0aGlzLiR3cmFwID0gdGhpcy52aWV3LmZpbmQoJy5qcy10YWJzLXdyYXBwZXInKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVWaWV3KHBhcnNlSW50KFV0aWxzLmdldFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS50YWIsIDEwKSB8fCAwKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0YWIub2ZmKCcudGFiJykub24oJ2NsaWNrLnRhYicsIHRoaXMub25UYWJDbGljayk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25UYWJDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gY3VycmVudC5kYXRhKCd0YWInKTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVWaWV3KGluZGV4KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBpbmRleDtcbiAgICAgICAgdGhpcy4kdGFiLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy4kdGFiLmZpbHRlcignW2RhdGEtdGFiPScgKyBpbmRleCArICddJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLmhpZGVDdXJyZW50KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnNob3codGhpcy50YWJUb1Nob3cpO1xuICAgICAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy5jbGVhbkNhY2hlZEFuaW0oKTtcbiAgICAgICAgICAgICR3aW5kb3cucmVzaXplKCk7XG5cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgaGlkZUN1cnJlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuJGN1cnJlbnQpIHsgcmVzb2x2ZSgpOyByZXR1cm47IH1cbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kY3VycmVudCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuMyxcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLiRjdXJyZW50LnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBwcml2YXRlIGNsZWFuQ2FjaGVkQW5pbSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYW5pbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS11bmNhY2hlXScpO1xuICAgICAgICBjb25zdCB1bmNhY2hlcyA9IHRoaXMudmlldy5maW5kKCcudW5jYWNoZWQnKTtcbiAgICAgICAgdW5jYWNoZXMucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgYW5pbS5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcblxuICAgIH1cblxuICAgIHByaXZhdGUgc2hvdyhpbmRleDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXZpZXc9JyArIGluZGV4ICsgJ10nKTtcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgZ3NhcC5mcm9tVG8odGhpcy4kY3VycmVudCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC43LFxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5cblxuXG5leHBvcnQgY2xhc3MgVG9vbHRpcCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbjtcbiAgICBwcml2YXRlICRidXR0b246IEpRdWVyeTtcbiAgICBwcml2YXRlICRjbG9zZTogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGJ1dHRvbiA9IHRoaXMudmlldy5maW5kKCcuanMtdG9nZ2xlJyk7XG4gICAgICAgIHRoaXMuJGNsb3NlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykgOiBudWxsO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRidXR0b24ub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQnV0dG9uQ2xpY2tIYW5kbGVyKTtcblxuICAgICAgICB0aGlzLnZpZXdcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlb24nKS5vbignbW91c2VlbnRlci5tb3VzZW9uJywgdGhpcy5vbk1vdXNlRW50ZXIpXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9mZicpLm9uKCdtb3VzZWxlYXZlLm1vdXNlb2ZmJywgdGhpcy5vbk1vdXNlTGVhdmUpO1xuXG4gICAgICAgICRkb2Mub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuJGNsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLiRjbG9zZS5vbignY2xpY2sudG9vbHRpcCcsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VFbnRlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VMZWF2ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQnV0dG9uQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIGlmICghYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgIC8vICAgICBhbGVydCgkKGUuY3VycmVudFRhcmdldClbMF0pO1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coJChlLmN1cnJlbnRUYXJnZXQpWzBdKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwICkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9wZW4oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcblxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICBpZiAodGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmFkZENsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMzAwMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykucmVtb3ZlQ2xhc3MoJ2lzLXRvZ2dsZWQtc2hhcmUnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBDb21wb25lbnQsIENvbXBvbmVudEV2ZW50cyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ29tcG9uZW50Jztcbi8vIGltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4uL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4uL0NsYXNzZXMnO1xuaW1wb3J0IHsgJGFydGljbGUsICRib2R5LCAkbWFpbiB9IGZyb20gJy4uL1NpdGUnO1xuXG5leHBvcnQgY2xhc3MgUGFnZUV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9HUkVTUzogc3RyaW5nID0gJ3Byb2dyZXNzJztcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENPTVBMRVRFOiBzdHJpbmcgPSAnY29tcGxldGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnYXBwZW5kJztcbn1cblxuZXhwb3J0IGNsYXNzIFBhZ2UgZXh0ZW5kcyBIYW5kbGVyIHtcblxuICAgIHB1YmxpYyBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XG4gICAgLy8gcHVibGljIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XG4gICAgcHJpdmF0ZSBsb2FkZXI6IEpRdWVyeURlZmVycmVkPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQ+O1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIG9wdGlvbnM/KSB7XG5cbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7IG9wYWNpdHk6IDAgfSk7XG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKHRoaXMudmlldy5wYXJlbnQoKS5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwcmVsb2FkIG5lY2Vzc2FyeSBhc3NldHM6XG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gbG9hZGluZyBpbWFnZXMgcHJvbWlzZVxuICAgICAqL1xuICAgIHB1YmxpYyBwcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCh0aGlzLnZpZXcuZmluZCgnLnByZWxvYWQnKS50b0FycmF5KCksIDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkT3B0aW9ucz57IGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICAgIGxldCBpbWFnZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBpbWFnZXMgPSBpbWFnZXMuY29uY2F0KGNvbXBvbmVudC5wcmVsb2FkSW1hZ2VzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHVybCBvZiBpbWFnZXMpIHtcbiAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQodXJsLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlciA9IGlsLmpxRGVmZXJyZWQ7XG4gICAgICAgICAgICB0aGlzLmxvYWRlci5wcm9ncmVzcygoaW5zdGFuY2U6IEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQsIGltYWdlOiBJbWFnZXNMb2FkZWQuTG9hZGluZ0ltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXIgPSBpbnN0YW5jZS5wcm9ncmVzc2VkQ291bnQgLyBpbnN0YW5jZS5pbWFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLlBST0dSRVNTLCBwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KS5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNPTVBMRVRFKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGlmIGFueSBDb21wb25lbnQgY2FuIGJlIGNoYW5nZWQgYWZ0ZXIgb25TdGF0ZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSB3aGVuIG9uZSBvZiB0aGUgY29tcG9uZW50cyB0YWtlcyBhY3Rpb24gaW4gb25TdGF0ZSBmdW5jdGlvbiBjYWxsXG4gICAgICovXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG5cbiAgICAgICAgbGV0IGNoYW5nZWQ6IGJvb2xlYW4gPSAhIWZhbHNlO1xuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDaGFuZ2VkOiBib29sZWFuID0gY29tcG9uZW50Lm9uU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghY2hhbmdlZCAmJiAhIWNvbXBvbmVudENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwYWdlIGVudGVyaW5nIGFuaW1hdGlvblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheSBhbmltYXRpb24gZGVsYXlcbiAgICAgKi9cbiAgICBwdWJsaWMgYW5pbWF0ZUluKGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xuXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCh0aGlzLmNvbXBvbmVudHMsICdhbmltYXRlSW4nKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbXBvbmVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1tpXS5hbmltYXRlSW4oaSwgZGVsYXkpO1xuICAgICAgICB9XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XG4gICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHBhZ2UgZXhpdCBhbmltYXRpb25cbiAgICAgKiAoY2FsbGVkIGFmdGVyIG5ldyBjb250ZW50IGlzIGxvYWRlZCBhbmQgYmVmb3JlIGlzIHJlbmRlcmVkKVxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IGFuaW1hdGlvbiBwcm9taXNlXG4gICAgICovXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiB0aGUgcGFnZTpcbiAgICAgICAgJG1haW4ucmVtb3ZlQ2xhc3MoJ2lzLWxvYWRlZCcpO1xuICAgICAgICBnc2FwLnNldChiZywgeyBvcGFjaXR5OiAwLCBkaXNwbGF5OiAnbm9uZSd9KTtcbiAgICAgICAgbGV0IHBhZ2VBbmltYXRpb25Qcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBhbmltYXRpb25zIG9mIGFsbCBjb21wb25lbnRzOlxuICAgICAgICBsZXQgY29tcG9uZW50QW5pbWF0aW9uczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSB0aGlzLmNvbXBvbmVudHMubWFwKChvYmopOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8UHJvbWlzZTx2b2lkPj5vYmouYW5pbWF0ZU91dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZXR1cm4gb25lIHByb21pc2Ugd2FpdGluZyBmb3IgYWxsIGFuaW1hdGlvbnM6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBhbGxQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBjb21wb25lbnRBbmltYXRpb25zLmNvbmNhdChwYWdlQW5pbWF0aW9uUHJvbWlzZSk7XG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGFsbFByb21pc2VzKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PZmYnKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9uJyk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHJlc2l6ZSBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IHdkdCAgICAgICAgd2luZG93IHdpZHRoXG4gICAgICogQHBhcmFtIHtbdHlwZV19IGhndCAgICAgICAgd2luZG93IGhlaWdodFxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBicmVha3BvaW50IElCcmVha3BvaW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyByZXNpemUod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdkdCwgaGd0LCBicmVha3BvaW50LCBicENoYW5nZWQpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBjbGVhbnVwIHdoZW4gY2xvc2luZyBQYWdlXG4gICAgICovXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgnZGVzdHJveScpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kcyA9IHt9O1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldyk7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG5cbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIH1cblxuXG5cbiAgICBwcm90ZWN0ZWQgYnVpbGRDb21wb25lbnRzKCRjb21wb25lbnRzOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgZm9yIChsZXQgaSA9ICRjb21wb25lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCAkY29tcG9uZW50OiBKUXVlcnkgPSAkY29tcG9uZW50cy5lcShpKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWU6IHN0cmluZyA9ICRjb21wb25lbnQuZGF0YSgnY29tcG9uZW50Jyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb21wb25lbnROYW1lLCBjb21wb25lbnRzKTtcblxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogT2JqZWN0ID0gJGNvbXBvbmVudC5kYXRhKCdvcHRpb25zJyksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogQ29tcG9uZW50ID0gbmV3IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0oJGNvbXBvbmVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQub24oQ29tcG9uZW50RXZlbnRzLkNIQU5HRSwgdGhpcy5vbkNvbXBvbmVudENoYW5nZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIGAlc2AgY29tcG9uZW50IScsIGNvbXBvbmVudE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNvbXBvbmVudENoYW5nZSA9IChlbCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyhlbC5maWx0ZXIoJ1tkYXRhLWNvbXBvbmVudF0nKS5hZGQoZWwuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKSk7XG4gICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNIQU5HRSwgZWwpO1xuICAgIH1cblxuXG4gICAgLy8gc2hvcnQgY2FsbFxuICAgIHByaXZhdGUgY2FsbEFsbChmbjogc3RyaW5nLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50W2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudFtmbl0uYXBwbHkoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG59XG4iXX0=
