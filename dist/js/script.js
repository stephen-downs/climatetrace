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
const Aside_1 = require("./components/Aside");
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
    Parallax: Parallax_1.Parallax,
    Aside: Aside_1.Aside
};
exports.pages = {
    Page: Page_1.Page
};

},{"./components/Aside":13,"./components/Chart":14,"./components/Dashboard":16,"./components/Dropdown":17,"./components/Filters":18,"./components/Masonry":19,"./components/Parallax":20,"./components/Range":21,"./components/Slider":22,"./components/Stats":23,"./components/Tooltip":24,"./pages/Page":25}],5:[function(require,module,exports){
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
const Aside_1 = require("./components/Aside");
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
    if (el.hasClass('is-open')) {
        setTimeout(() => {
            gsap.set(Site_1.$article, { 'will-change': 'transform' });
            Utils.disableBodyScrolling(Scroll_1.Scroll.scrollTop);
            el.removeClass('is-open');
            Site_1.$body.removeClass('is-aside-open');
        }, 500);
    }
    else {
        gsap.set(Site_1.$article, { clearProps: 'will-change' });
        Utils.enableBodyScrolling(Scroll_1.Scroll.scrollTop);
        el.addClass('is-open');
        Site_1.$body.addClass('is-aside-open');
    }
    Aside_1.Aside.asideAnimation();
    return;
};

},{"./Handler":6,"./Scroll":9,"./Site":11,"./Utils":12,"./components/Aside":13}],9:[function(require,module,exports){
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
                const elementsIn = $el.data('elements-in') ? $el.find('.' + $el.data('elements-in') + '') : null;
                const staggerEl = $el.data('stagger') ? $el.data('stagger') : 0.2;
                const del = delay ? delay : 0.2;
                const shiftYAxis = $el.data('y') ? true : false;
                const elScale = $el.data('scale') ? true : false;
                gsap.set($el, { opacity: 1 });
                gsap.set(elements, { opacity: 0 });
                if ($el.data('uncache') === '') {
                    for (let i = 0; i < elements.length; i++) {
                        elements[i].classList.add('uncached');
                    }
                    if (elementsIn) {
                        for (let i = 0; i < elementsIn.length; i++) {
                            elementsIn[i].classList.add('uncached');
                        }
                    }
                }
                if (elScale) {
                    gsap.fromTo(elements, 0.8, { duration: 1, opacity: 0, scale: 0.9 }, { scale: 1, opacity: 1, stagger: staggerEl, delay: delay });
                    gsap.fromTo(elementsIn, 0.8, { duration: 1, opacity: 0 }, { opacity: 1, stagger: staggerEl, delay: delay + 0.4 });
                }
                else {
                    if (shiftYAxis) {
                        gsap.fromTo(elements, { duration: 1, opacity: 0, y: 10 }, { y: 0, opacity: 1, stagger: staggerEl, delay: delay });
                    }
                    else {
                        gsap.fromTo(elements, { duration: 1, opacity: 0, x: -10 }, { x: 0, opacity: 1, stagger: staggerEl, delay: delay });
                    }
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
const PushStates_1 = require("../PushStates");
class Aside extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.isOpen = false;
        this.hideMenu = (e) => {
            PushStates_1.PushStates.asideToggle(e);
        };
        this.$item = this.view.find('.js-item');
        this.$hamburgerLine = $('[data-hamburger]').find('i');
        Aside.instance = this;
        this.bind();
    }
    static asideAnimation() {
        if (Aside.instance.isOpen) {
            gsap.to(Aside.instance.$item, 0.25, { duration: 0.25, stagger: -0.1, opacity: 0, x: 20, delay: 0.2 });
            gsap.to(Aside.instance.$hamburgerLine, 0.5, { duration: 0.5, scaleY: 0 });
            Aside.instance.isOpen = false;
        }
        else {
            gsap.to(Aside.instance.$item, 0.5, { duration: 0.5, stagger: 0.05, opacity: 1, x: 0, delay: 0.2 });
            gsap.to(Aside.instance.$hamburgerLine, 0.5, { duration: 0.5, scaleY: 1, delay: 0.5 });
            Aside.instance.isOpen = true;
        }
    }
    bind() {
        this.$item.off('.menu').on('click.menu', this.hideMenu);
    }
}
exports.Aside = Aside;

},{"../PushStates":8,"./Component":15}],14:[function(require,module,exports){
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
            right: 110,
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
                right: this.canvas.width - this.margin.right,
                bottom: this.canvas.height - this.margin.bottom,
                height: this.canvas.height - this.margin.top - this.margin.bottom,
                width: this.canvas.width - this.margin.left - this.margin.right,
            };
            this.saveCache();
            this.draw();
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
            let lastVal;
            let lastY;
            this.ctx.strokeStyle = data.color;
            this.ctx.lineWidth = 3;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            const colWidth = this.graph.width / (data.yPx.length - 1);
            const maxX = (data.xPercent * colWidth * data.yPx.length) + this.graph.left;
            data.yPx.forEach((y, i, a) => {
                const x = colWidth * i + this.graph.left;
                if (x <= maxX && data.xPercent > 0) {
                    this.ctx.lineTo(x, y);
                    lastY = y;
                    lastVal = data.yPoints[i];
                }
                else if (x < maxX + colWidth && data.xPercent > 0) {
                    y = this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]);
                    this.ctx.lineTo(maxX, y);
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
            if (data.xPercent > 0) {
                this.ctx.globalAlpha = 1;
                this.ctx.beginPath();
                this.ctx.lineWidth = 1;
                this.ctx.strokeStyle = data.color;
                this.ctx.moveTo(this.graph.right, data.labelY);
                this.ctx.lineTo(this.graph.right + 24, data.labelY);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.strokeStyle = 'transparent';
                this.ctx.fillStyle = data.color;
                this.ctx.moveTo(this.graph.right + 20, data.labelY);
                this.ctx.lineTo(this.graph.right + 40, data.labelY - 12);
                this.ctx.lineTo(this.graph.right + 110, data.labelY - 12);
                this.ctx.lineTo(this.graph.right + 110, data.labelY + 12);
                this.ctx.lineTo(this.graph.right + 40, data.labelY + 12);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.lineWidth = 1;
                this.ctx.lineJoin = 'round';
                this.ctx.font = '500 14px Quicksand, sans-serif';
                this.ctx.fillStyle = this.colors.white;
                this.ctx.fillText(lastVal + '', this.graph.right + 44, data.labelY + 4);
                this.ctx.stroke();
            }
        };
        this.$wrapper = this.view.find('.js-wrapper');
        this.$tab = this.view.find('[data-chart-tab]');
        this.canvas = this.view.find('canvas')[0];
        this.ctx = this.canvas.getContext('2d');
        this.createDataObject();
        this.bind();
        this.resize();
        const paramsCharts = Utils.getParams(window.location.search).charts;
        const initCharts = paramsCharts ? paramsCharts.split(',').map((i) => parseInt(i, 10)) : [0, 3, 4];
        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, initCharts.indexOf(i) >= 0);
        }
    }
    createDataObject() {
        this.graphsData = this.$tab.toArray().map((el, i) => {
            const $el = $(el);
            return {
                id: i,
                xPercent: 0,
                yPoints: this.getPoints(i),
                color: this.colors[$el.data('color')],
                fill: i === 0 ? true : false,
                shown: false,
            };
        });
    }
    getPoints(i) {
        return [[14, 10, 12, 13, 14, 9, 12, 17, 16, 11, 13, 19, 10, 9, 8, 15, 17, 15, 22, 25, 21, 20, 19, 21, 20, 19, 24, 28, 21, 27, 18, 23, 33, 31, 18, 25, 36, 24, 31, 33, 21, 36, 34, 30, 26, 24, 35, 27, 30, 18, 20, 30, 26, 28, 33, 25, 39, 28, 17, 35], [1, 2, 8, 7, 6, 3, 8, 5, 5, 4, 8, 7, 7, 11, 10, 8, 7, 9, 8, 6, 8, 12, 8, 14, 11, 8, 8, 11, 7, 13, 13, 16, 20, 10, 10, 13, 14, 20, 16, 11, 17, 16, 18, 21, 8, 20, 15, 15, 16, 15, 19, 20, 11, 20, 20, 12, 17, 20, 23, 16], [13, 11, 6, 9, 9, 8, 9, 11, 7, 14, 12, 8, 10, 16, 9, 20, 19, 12, 12, 15, 18, 15, 14, 22, 19, 20, 20, 17, 24, 23, 27, 20, 20, 21, 21, 25, 20, 27, 22, 24, 24, 26, 23, 25, 26, 21, 29, 26, 27, 26, 25, 20, 15, 25, 22, 26, 20, 23, 33, 28], [2, 5, 10, 9, 18, 9, 10, 12, 20, 19, 13, 9, 15, 11, 21, 19, 23, 23, 26, 23, 23, 23, 25, 25, 26, 26, 30, 22, 25, 33, 38, 16, 32, 27, 27, 35, 28, 28, 35, 34, 36, 25, 27, 25, 45, 37, 31, 36, 37, 36, 28, 38, 42, 42, 44, 43, 41, 34, 31, 36], [7, 10, 10, 6, 5, 13, 17, 13, 10, 11, 14, 17, 16, 19, 22, 20, 25, 17, 24, 13, 25, 20, 26, 24, 26, 15, 23, 24, 30, 30, 29, 31, 31, 21, 32, 31, 25, 38, 35, 28, 40, 32, 37, 31, 36, 40, 35, 37, 23, 36, 37, 40, 40, 41, 17, 23, 40, 34, 40, 40], [6, 6, 2, 12, 10, 13, 12, 4, 12, 11, 13, 16, 14, 14, 14, 14, 14, 17, 15, 16, 16, 12, 18, 15, 22, 16, 19, 18, 21, 21, 25, 15, 26, 17, 27, 27, 21, 12, 24, 15, 19, 29, 18, 24, 25, 18, 28, 32, 25, 28, 27, 28, 31, 25, 27, 35, 24, 27, 15, 28], [4, 5, 10, 13, 15, 17, 7, 17, 12, 12, 17, 12, 12, 11, 22, 21, 19, 20, 21, 26, 22, 19, 21, 24, 25, 12, 28, 27, 28, 27, 31, 31, 15, 30, 26, 19, 29, 29, 33, 33, 17, 30, 30, 33, 27, 34, 33, 17, 39, 21, 35, 33, 33, 21, 35, 30, 39, 31, 35, 29]][i];
    }
    getRandomPoints(min, max, amount, cast) {
        return Array.apply(null, { length: amount })
            .map((p, i, a) => {
            const range = max - min;
            const perc = i / a.length;
            const sin = Math.sin(perc * Math.PI / 2);
            const rnd = 0.4 * (Math.random() < cast ? -0.5 + Math.random() : 1);
            const minRnd = (Math.random() * (perc < 0.5 ? 0.9 : 1));
            return Math.round((min * minRnd) + (Math.random() * range * 0.2) + (sin * range * (0.6 + rnd)));
        });
    }
    saveCache() {
        this.graphsData.forEach((data) => {
            data.yPx = this.calcYPx(data.yPoints);
            if (!data.labelY) {
                data.labelY = data.yPx[0];
            }
        });
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onClickTab);
    }
    toggleChart(index, show) {
        const data = this.graphsData[index];
        if (typeof show === 'undefined') {
            show = !data.shown;
        }
        gsap.to(data, {
            duration: 3.2,
            xPercent: show ? 1 : 0,
            labelY: data.yPx[show ? data.yPx.length - 1 : 0],
            roundProps: 'labelY',
            ease: 'power3.inOut',
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
            this.ctx.fillText('' + years[j] + '', this.graph.width / years.length * j + this.margin.left, this.canvas.height - textTransform * 2);
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
    getInterPointsY(x, pointA, pointB) {
        const [x1, y1] = pointA;
        const [x2, y2] = pointB;
        return (y2 - y1) * (x - x1) / (x2 - x1) + y1;
    }
}
exports.Chart = Chart;

},{"../Utils":12,"./Component":15}],15:[function(require,module,exports){
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

},{"../Handler":6}],16:[function(require,module,exports){
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

},{"./Component":15}],17:[function(require,module,exports){
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
            this.isOpen ? this.closeSelect() : this.openSelect(e);
        };
        this.onClickAnywhereHandler = (e) => {
            e.stopPropagation();
            e.preventDefault();
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
        if (this.isOpen) {
            this.view.removeClass('is-open');
            this.isOpen = false;
        }
    }
}
exports.Dropdown = Dropdown;

},{"../Site":11,"./Component":15,"./Filters":18}],18:[function(require,module,exports){
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

},{"./Component":15}],19:[function(require,module,exports){
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

},{"./Component":15}],20:[function(require,module,exports){
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

},{"../Breakpoint":2,"./Component":15}],21:[function(require,module,exports){
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

},{"../Site":11,"./Component":15}],22:[function(require,module,exports){
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

},{"./Component":15}],23:[function(require,module,exports){
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

},{"../Site":11,"../Utils":12,"./Component":15}],24:[function(require,module,exports){
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

},{"../Site":11,"./Component":15}],25:[function(require,module,exports){
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

},{"../Classes":4,"../Handler":6,"../Site":11,"../components/Component":15}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0FzaWRlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ2hhcnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Db21wb25lbnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9EYXNoYm9hcmQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Ecm9wZG93bi50cyIsInNyYy90cy9jb21wb25lbnRzL0ZpbHRlcnMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9NYXNvbnJ5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUGFyYWxsYXgudHMiLCJzcmMvdHMvY29tcG9uZW50cy9SYW5nZS50cyIsInNyYy90cy9jb21wb25lbnRzL1NsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL1N0YXRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsT0FB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LE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQztvQkFDekUsTUFBTSxVQUFVLEdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO29CQUUvRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLElBQUksT0FBTyxJQUFJLEtBQUssR0FBRyxVQUFVLElBQUksRUFBRSxFQUFFO3dCQUM1RCxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDOUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7d0JBQ2pCLE1BQU0sS0FBSyxHQUFZLElBQUksSUFBSSxLQUFLLEdBQUcsVUFBVSxDQUFDO3dCQUNsRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztxQkFDOUQ7eUJBQU0sSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQyxJQUFJLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sSUFBSSxLQUFLLEdBQUcsVUFBVSxHQUFHLElBQUksQ0FBQyxFQUFFO3dCQUNsSCxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsS0FBSyxVQUFVLEVBQUU7NEJBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQzt5QkFDL0I7d0JBQ0QsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7cUJBQ3JCO3lCQUFNLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLEtBQUssR0FBRyxZQUFZLElBQUksRUFBRSxJQUFJ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RSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFB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TUFBTSxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ2hFO2lCQUFNO2dCQUNILE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLDZCQUE2QixFQUFFLGFBQWEsQ0FBQyxDQUFDO2FBQ3JFO1NBQ0o7SUFDTCxDQUFDO0lBU08sT0FBTyxDQUFDLEVBQVUsRUFBRSxHQUFHLElBQUk7UUFDL0IsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25DLElBQUksT0FBTyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssVUFBVSxFQUFFO2dCQUNyQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUMvRDtTQUNKO0lBRUwsQ0FBQztDQUNKO0FBaE5ELG9CQWdOQyIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIC8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IHsgZGVidWcgfSBmcm9tICcuL1NpdGUnO1xuXG5cblxuZGVjbGFyZSB2YXIgJGJvZHk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUFwaURhdGEge1xuICAgIHVybDogc3RyaW5nO1xuICAgIGJlZm9yZUNhbGw/OiBzdHJpbmc7XG4gICAgY2FsbGJhY2s/OiBzdHJpbmc7XG4gICAgZm9ybT86IGFueTtcbiAgICBwYXJhbXM/OiBhbnk7XG4gICAgbGlrZT86IGJvb2xlYW47XG4gICAgYWN0aW9uPzogJ1BPU1QnIHwgJ0RFTEVURScgfCAnR0VUJyB8ICdQVVQnIHwgJ1BBVENIJztcbn1cblxuXG5leHBvcnQgY2xhc3MgQVBJIHtcblxuXG5cbiAgICBwcml2YXRlIHN0YXRpYyBiZWZvcmVDYWxscyA9IHtcblxuICAgICAgICBsb2dpbjogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdpcy1sb2dnZWQnKSkge1xuICAgICAgICAgICAgICAgICQoJy5qcy1sb2dpbicpLmxhc3QoKS50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG5cbiAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICAgICAgbGV0IHBhc3NlZCA9IHRydWU7XG4gICAgICAgICAgICBsZXQgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgbGV0ICRmb3JtID0gJGVsLmlzKCdmb3JtJykgPyAkZWwgOiAkZWwuY2xvc2VzdCgnZm9ybScpO1xuICAgICAgICAgICAgbGV0ICR2YWxpZGF0aW9uRWxlbSA9ICRmb3JtO1xuICAgICAgICAgICAgbGV0IHN0ZXBWYWxpZGF0aW9uO1xuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xuICAgICAgICAgICAgaWYgKCRmb3JtLmhhc0NsYXNzKCdpcy1kb25lJykpIHtcbiAgICAgICAgICAgICAgICAkZm9ybS5yZW1vdmVDbGFzcygnaXMtZG9uZScpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gaWYgKCAhIWRhdGEucGFyYW1zICkge1xuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gIGRhdGEucGFyYW1zLnZhbGlkYXRlT25lO1xuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgICAvLyAgICAgfVxuXG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSAgZGF0YS5wYXJhbXMuc2Nyb2xsVG87XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB9XG5cbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ1tyZXF1aXJlZF06aW5wdXQnKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyApIHtcblxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmUgPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFyZS50ZXN0KHZhbHVlKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1t2YWx1ZS5sZW5ndGggPiAwID8gJ2ludmFsaWQtZW1haWwnIDogJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLmNoZWNrZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICd0ZXh0JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoJChpbnB1dCkuaGFzQ2xhc3MoJ2pzLXBvc3RhbCcpKSB7bWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXX1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Bob25lJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsVGVsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWxUZWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ1RFWFRBUkVBJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdpbnB1dFtuYW1lPXppcGNvZGVdJykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykgJiYgdmFsLmxlbmd0aCAhPSA1KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG4gICAgXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGlmICghIXBhc3NlZCkge1xuICAgICAgICAgICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGZvcm0pO1xuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdoYXMtZXJyb3JzJyk7XG4gICAgICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZm9ybS5hZGRDbGFzcygnaGFzLWVycm9ycycpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIHN0YXRpYyBjYWxsYmFja3MgPSB7XG5cbiAgICAgICAgb25Db29raWVzQ2xvc2U6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcbiAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtaGlkZGVuJyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb25TdWJzY3JpYmU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblN1YnNjcmliZScpO1xuICAgICAgICAgICAgbGV0ICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XG5cbiAgICAgICAgICAgIC8vIGlmIChkYXRhLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9ICBkYXRhLnNjcm9sbFRvO1xuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcblxuICAgICAgICAgICAgaWYgKCEkbWVzc2FnZVswXSkge1xuICAgICAgICAgICAgICAgICRlbC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJqcy1tZXNzYWdlIG1lc3NhZ2VcIj4nKTtcbiAgICAgICAgICAgICAgICAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgaHRtbCA9ICQoJzxwPicgKyByZXNwb25zZS5tZXNzYWdlICsgJzwvcD4nKTtcblxuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJykuYXBwZW5kKGh0bWwpO1xuXG4gICAgICAgICAgICBpZiAocmVzcG9uc2UucmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1jb21wbGV0ZWQnKTtcbiAgICAgICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcbiAgICAgICAgICAgICAgICAkZWwuY2xvc2VzdCgnLmpvaW4nKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xuXG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQ6Y2hlY2tlZCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWxbMF0uaGFzQXR0cmlidXRlKCdkYXRhLXJlZGlyZWN0JykpIHtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oJy8nKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgIC8vICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJG1lc3NhZ2UsIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudHJpZ2dlcignYmx1cicpO1xuICAgICAgICB9LFxuXG4gICAgfTtcblxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGJpbmQodGFyZ2V0PzogYW55KTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQodHlwZW9mIHRhcmdldCAhPT0gJ3VuZGVmaW5lZCcgPyB0YXJnZXQgOiAnYm9keScpO1xuXG4gICAgICAgICR0YXJnZXQuZmluZCgnW2RhdGEtYXBpXScpLm5vdCgnZm9ybScpLm9mZignLmFwaScpLm9uKCdjbGljay5hcGknLCBBUEkub25BY3Rpb24pO1xuICAgICAgICAkdGFyZ2V0LmZpbmQoJ2Zvcm1bZGF0YS1hcGldJykub2ZmKCcuYXBpJykub24oJ3N1Ym1pdC5hcGknLCBBUEkub25BY3Rpb24pLmF0dHIoJ25vdmFsaWRhdGUnLCAnbm92YWxpZGF0ZScpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGNhbGxJdChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIGN1c3RvbUNhbGxiYWNrPzogRnVuY3Rpb24pOiAgUHJvbWlzZTxhbnk+IHtcbiAgICAgICAgXG4gICAgICAgIGRhdGEgPSBBUEkucHJlcHJvY2Vzc0RhdGEoZGF0YSwgJGVsKTtcblxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcblxuICAgICAgICBjb25zdCBhY3Rpb24gPSBkYXRhLmFjdGlvbiB8fCAnUE9TVCc7XG4gICAgICAgIGRlbGV0ZSBkYXRhLmFjdGlvbjtcblxuICAgICAgICBjb25zdCB1cmwgPSBkYXRhLnVybCB8fCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIGRlbGV0ZSBkYXRhLnVybDtcblxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBmYWxzZSxcbiAgICAgICAgICAgICAgICB0eXBlOiBhY3Rpb24sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5kb25lKChyZXNwb25zZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1c3RvbUNhbGxiYWNrICYmIHR5cGVvZiBjdXN0b21DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcblxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5mYWlsKChlKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUEkgZXJyb3I6ICcgKyBlLCBkYXRhKTtcblxuICAgICAgICAgICAgICAgIGlmICghIWRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBBUEkub25TdWNjZXNzKGRhdGEsICRlbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIG51bGwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHN0YXRpYyBwcmVwcm9jZXNzRGF0YShkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiBJQXBpRGF0YSB7XG5cbiAgICAgICAgLy8gZ2V0IGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBmb3JtIGVsZW1lbnQ6XG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2FjdGlvbicpID8gJGVsLmF0dHIoJ2FjdGlvbicpIDogZGF0YS51cmw7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJGVsLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2RhdGEgZm9ybScsIGRhdGEsIGRhdGEucGFyYW1zLGRhdGEuZm9ybSwgJGVsLmZpbmQoJzppbnB1dCcpKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdXBkYXRlIGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBsaW5rIGVsZW1lbnQ6XG4gICAgICAgIGlmICgkZWwuaXMoJ1tocmVmXScpKSB7XG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignaHJlZicpID8gJGVsLmF0dHIoJ2hyZWYnKSA6IGRhdGEudXJsO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZ2V0IGFkZGl0aW9uYWwgZGF0YSBmcm9tIGV4dGVybmFsIGZvcm06XG4gICAgICAgIGlmIChkYXRhLmZvcm0gJiYgJChkYXRhLmZvcm0gYXMgc3RyaW5nKVswXSkge1xuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsICQoZGF0YS5mb3JtIGFzIHN0cmluZykuc2VyaWFsaXplT2JqZWN0KCkpO1xuICAgICAgICAgICAgZGVsZXRlIGRhdGEuZm9ybTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGZsYXR0ZW46XG4gICAgICAgIGlmIChkYXRhLnBhcmFtcykge1xuICAgICAgICAgICAgZGF0YSA9ICQuZXh0ZW5kKGRhdGEsIGRhdGEucGFyYW1zKTtcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLnBhcmFtcztcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBwcmUnLCBkYXRhLCBkYXRhLnBhcmFtcyk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIG9uQWN0aW9uID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBsZXQgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgICBjb25zdCBkYXRhOiBJQXBpRGF0YSA9IHsuLi4kKGUuY3VycmVudFRhcmdldCkuZGF0YSgnYXBpJyl9O1xuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLCAnZGF0YScpO1xuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcbiAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtc3VibWl0dGVkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkZWwuY2xvc2VzdCgnZm9ybScpLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGJlZm9yZUNhbGwgaGFuZGxlcjpcbiAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCkge1xuICAgICAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCBpbiBBUEkuYmVmb3JlQ2FsbHMpIHtcbiAgICAgICAgICAgICAgICBBUEkuYmVmb3JlQ2FsbHNbZGF0YS5iZWZvcmVDYWxsXShkYXRhLCAkZWwpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGVsKTtcbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIG9uU3VjY2VzcyA9IChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCA9PiB7XG5cbiAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrIGluIEFQSS5jYWxsYmFja3MpIHtcbiAgICAgICAgICAgICAgICBBUEkuY2FsbGJhY2tzW2RhdGEuY2FsbGJhY2tdKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0iLCJleHBvcnQgaW50ZXJmYWNlIElCcmVha3BvaW50IHtcbiAgICBkZXNrdG9wOiBib29sZWFuO1xuICAgIHRhYmxldDogYm9vbGVhbjtcbiAgICBwaG9uZTogYm9vbGVhbjtcbiAgICB2YWx1ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgbGV0IGJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xuXG5leHBvcnQgY2xhc3MgQnJlYWtwb2ludCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCBjc3NCZWZvcmUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JyksICc6YmVmb3JlJyk7XG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZVZhbHVlID0gY3NzQmVmb3JlLmdldFByb3BlcnR5VmFsdWUoJ2NvbnRlbnQnKS5yZXBsYWNlKC9bXFxcIlxcJ10vZywgJycpO1xuXG4gICAgICAgIGJyZWFrcG9pbnQgPSB7XG4gICAgICAgICAgICBkZXNrdG9wOiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ2Rlc2t0b3AnLFxuICAgICAgICAgICAgcGhvbmU6IGNzc0JlZm9yZVZhbHVlID09PSAncGhvbmUnLFxuICAgICAgICAgICAgdGFibGV0OiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ3RhYmxldCcsXG4gICAgICAgICAgICB2YWx1ZTogY3NzQmVmb3JlVmFsdWUsXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJCUDpcIiwgYnJlYWtwb2ludC52YWx1ZSk7XG4gICAgfVxufVxuIiwiZXhwb3J0IGxldCBicm93c2VyOiBJQnJvd3NlcjtcbmRlY2xhcmUgbGV0IG9wcjtcbi8vIHRzbGludDpkaXNhYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxuaW50ZXJmYWNlIFdpbmRvdyB7XG4gICAgb3ByOiBhbnk7XG4gICAgb3BlcmE6IGFueTtcbiAgICBzYWZhcmk6IGFueTtcbiAgICBIVE1MRWxlbWVudDogYW55O1xufVxuLy8gdHNsaW50OmVuYWJsZTpuby1hbnkgaW50ZXJmYWNlLW5hbWVcblxuXG5leHBvcnQgaW50ZXJmYWNlIElCcm93c2VyIHtcbiAgICBtb2JpbGU/OiBib29sZWFuO1xuICAgIHdpbmRvd3M/OiBib29sZWFuO1xuICAgIG1hYz86IGJvb2xlYW47XG4gICAgaWU/OiBib29sZWFuO1xuICAgIGlvcz86IGJvb2xlYW47XG4gICAgb3BlcmE/OiBib29sZWFuO1xuICAgIGZpcmVmb3g/OiBib29sZWFuO1xuICAgIHNhZmFyaT86IGJvb2xlYW47XG4gICAgY2hyb21lPzogYm9vbGVhbjtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnJvd3NlcigpOiBJQnJvd3NlciB7XG4gICAgY29uc3QgdWEgPSB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudDtcbiAgICBicm93c2VyID0ge1xuICAgICAgICBtb2JpbGU6ICgvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXBhZHxpcmlzfGtpbmRsZXxBbmRyb2lkfFNpbGt8bGdlIHxtYWVtb3xtaWRwfG1tcHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyAoY2V8cGhvbmUpfHhkYXx4aWluby9pLnRlc3QodWEpIHx8IC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QodWEuc3Vic3RyKDAsIDQpKSkgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgIGlvczogL2lQYWR8aVBob25lfGlQb2QvLnRlc3QodWEpLFxuICAgICAgICBtYWM6IG5hdmlnYXRvci5wbGF0Zm9ybS50b1VwcGVyQ2FzZSgpLmluZGV4T2YoJ01BQycpID49IDAsXG4gICAgICAgIGllOiB1YS5pbmRleE9mKCdNU0lFICcpID4gMCB8fCAhIXVhLm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLyksXG4gICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbm8tYW55XG4gICAgICAgIG9wZXJhOiAoISEod2luZG93IGFzIGFueSkub3ByICYmICEhb3ByLmFkZG9ucykgfHwgISEod2luZG93IGFzIGFueSkub3BlcmEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCcgT1BSLycpID49IDAsXG4gICAgICAgIGZpcmVmb3g6IHVhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgIHNhZmFyaTogL14oKD8hY2hyb21lfGFuZHJvaWQpLikqc2FmYXJpL2kudGVzdCh1YSksXG4gICAgICAgIHdpbmRvd3M6IHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCd3aW4nKSA+IC0xLFxuICAgIH07XG5cbiAgICAkKCdodG1sJylcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtYWMnLCAhYnJvd3Nlci53aW5kb3dzICYmIChicm93c2VyLmlvcyB8fCBicm93c2VyLm1hYykpXG4gICAgICAgIC50b2dnbGVDbGFzcygnd2luZG93cycsIGJyb3dzZXIud2luZG93cyAmJiAhYnJvd3Nlci5tYWMgJiYgIWJyb3dzZXIuaW9zKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21vYmlsZScsIGJyb3dzZXIubW9iaWxlKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2ZpcmVmb3gnLCBicm93c2VyLmZpcmVmb3gpXG4gICAgICAgIC50b2dnbGVDbGFzcygnc2FmYXJpJywgYnJvd3Nlci5zYWZhcmkpXG4gICAgICAgIC50b2dnbGVDbGFzcygnaWUnLCBicm93c2VyLmllKTtcblxuICAgIHJldHVybiBicm93c2VyO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBCcm93c2VyIHtcbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcbiAgICAgICAgYnJvd3NlciA9IGdldEJyb3dzZXIoKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBTbGlkZXIgfSBmcm9tICcuL2NvbXBvbmVudHMvU2xpZGVyJztcbmltcG9ydCB7IFRvb2x0aXAgfSBmcm9tICcuL2NvbXBvbmVudHMvVG9vbHRpcCc7XG5pbXBvcnQgeyBEcm9wZG93biB9IGZyb20gJy4vY29tcG9uZW50cy9Ecm9wZG93bic7XG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9jb21wb25lbnRzL0ZpbHRlcnMnO1xuaW1wb3J0IHsgRGFzaGJvYXJkIH0gZnJvbSAnLi9jb21wb25lbnRzL0Rhc2hib2FyZCc7XG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0cyc7XG5pbXBvcnQgeyBNYXNvbnJ5IH0gZnJvbSAnLi9jb21wb25lbnRzL01hc29ucnknO1xuaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICcuL2NvbXBvbmVudHMvUmFuZ2UnO1xuaW1wb3J0IHsgQ2hhcnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ2hhcnQnO1xuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xuaW1wb3J0IHsgUGFyYWxsYXggfSBmcm9tICcuL2NvbXBvbmVudHMvUGFyYWxsYXgnO1xuXG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAnLi9wYWdlcy9QYWdlJztcblxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XG4gICAgU2xpZGVyLFxuICAgIFRvb2x0aXAsXG4gICAgRHJvcGRvd24sXG4gICAgRmlsdGVycyxcbiAgICBEYXNoYm9hcmQsXG4gICAgU3RhdHMsXG4gICAgTWFzb25yeSxcbiAgICBSYW5nZSxcbiAgICBDaGFydCxcbiAgICBQYXJhbGxheCxcbiAgICBBc2lkZVxufTtcblxuXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XG4gICAgUGFnZVxufTtcblxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvY2xpcGJvYXJkLmQudHNcIiAvPlxuXG5cblxuZXhwb3J0IGNsYXNzIENvcHkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICAkKCdbZGF0YS1jb3B5XScpLm9uKCdjbGljaycsIChlKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcbiAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmluZm8oJ1wiJXNcIiBjb3BpZWQnLCB1cmwpO1xuXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7ICRlbC5yZW1vdmVDbGFzcygnaXMtY29waWVkJyk7IH0sIDEwMDApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFuZGxlciB7XG5cblxuICAgIHByaXZhdGUgZXZlbnRzOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uW10gfTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gICBldmVudE5hbWUgcGxlYXNlIHVzZSBzdGF0aWMgbmFtZXNcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xuXG4gICAgICAgIGlmICggIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm4ge0hhbmRsZXJ9ICAgICAgICAgICAgcmV0dXJucyBjdXJyZW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcblxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5ldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcblxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgdHJpZ2dlcihldmVudE5hbWU6IHN0cmluZywgLi4uZXh0cmFQYXJhbWV0ZXJzKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgIH1cbn1cblxuIiwiZXhwb3J0IGNsYXNzIExvYWRlciB7XG5cbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnkpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IHk6IDAsIGR1cmF0aW9uOiAwLjIgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IGR1cmF0aW9uOiAwLjUsIHk6IDEwLCB3aWR0aDogdGhpcy53aWR0aCB8fCAnMTAwJScgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzZXQocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5cbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3knXSk7XG5cbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xuaW1wb3J0IHsgJGJvZHksICRhcnRpY2xlLCAkcGFnZUhlYWRlciB9IGZyb20gJy4vU2l0ZSc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IEFzaWRlIH0gZnJvbSAnLi9jb21wb25lbnRzL0FzaWRlJztcbi8vIGltcG9ydCB7IFNpZ251cCB9IGZyb20gJy4vU2lnbnVwJztcblxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXG5cblxuXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlc0V2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgUFJPR1JFU1MgPSAncHJvZ3Jlc3MnO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBQdXNoU3RhdGVzO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVElNRV9MSU1JVCA9IDUwMDA7XG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgbG9hZGVkRGF0YTogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XG4gICAgcHJpdmF0ZSB0aW1lb3V0O1xuXG5cblxuICAgIC8qKiBjaGFuZ2UgZG9jdW1lbnQgdGl0bGUgKi9cbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGUgfHwgJCgnI21haW4gPiBbZGF0YS10aXRsZV0nKS5kYXRhKCd0aXRsZScpO1xuICAgIH1cblxuXG5cbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdvVG8obG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXG4gICAgICAgICAgICBpc0RpZmZlcmVudCA9IHBhdGhuYW1lICE9PSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XG4gICAgICAgICAgICBpZiAoISFyZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0RpZmZlcmVudDtcbiAgICB9XG5cblxuXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXG4gICAgcHVibGljIHN0YXRpYyBjaGFuZ2VQYXRoKGxvY2F0aW9uOiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuLCB0aXRsZT86IHN0cmluZyk6IHZvaWQge1xuXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xuICAgICAgICBsZXQgY2hhbmdlZCA9IFB1c2hTdGF0ZXMuZ29Ubyhsb2NhdGlvbiwgcmVwbGFjZSB8fCB0cnVlKTtcbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmICghIWNoYW5nZWQpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUodGl0bGUgfHwgZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzIHRvIGJlIHVzZWQgd2l0aCBQdXNoU3RhdGVzIC8gSGlzdG9yeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmICghZWxlbWVudEl0c2VsZikge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGlua3ModGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmsodGFyZ2V0IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGdvIGJhY2sgaW4gYnJvd3NlciBoaXN0b3J5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBiYWNrKHVybD86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5iYWNrKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodXJsKSB7XG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCAnLycpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgcmVsb2FkKCk6IHZvaWQge1xuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcblxuICAgICAgICBpZiAoISRwYWdlSGVhZGVyKSB7XG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XG4gICAgICAgICAgICAkYm9keS5hZGRDbGFzcygnbmF2YmFyLWFsd2F5cy1zaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZVRvZ2dsZSA9IChlPyk6IHZvaWQgPT4ge1xuICAgICAgICBsZXQgZWwgPSBlID8gJChlLmN1cnJlbnRUYXJnZXQpIDogJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcblxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRhcnRpY2xlLCB7J3dpbGwtY2hhbmdlJzogJ3RyYW5zZm9ybSd9KTtcbiAgICAgICAgICAgICAgICBVdGlscy5kaXNhYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgICAgICAgICBlbC5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgICAgICRib2R5LnJlbW92ZUNsYXNzKCdpcy1hc2lkZS1vcGVuJyk7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsgY2xlYXJQcm9wczogJ3dpbGwtY2hhbmdlJ30pO1xuICAgICAgICAgICAgVXRpbHMuZW5hYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgICAgIGVsLmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICAkYm9keS5hZGRDbGFzcygnaXMtYXNpZGUtb3BlbicpO1xuICAgICAgICB9XG5cbiAgICAgICAgQXNpZGUuYXNpZGVBbmltYXRpb24oKTtcblxuICAgICAgICByZXR1cm47XG4gICAgfVxuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xuICAgICAgICAgICAgdGhpcy5iaW5kTGlua3MoKTtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5BZGFwdGVyLmJpbmQod2luZG93LCAnc3RhdGVjaGFuZ2UnLCB0aGlzLm9uU3RhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZSA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIGxvYWQgbmV3IGNvbnRlbnQgdmlhIGFqYXggYmFzZWQgb24gY3VycmVudCBsb2NhdGlvbjpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBjYW5jZWwgb2xkIHJlcXVlc3Q6XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmaW5lIHVybFxuICAgICAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIGNvbnN0IHNlYXJjaDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCB8fCAnJztcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcblxuICAgICAgICAvLyBkZWZpbmUgdGltZW91dFxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgUHVzaFN0YXRlcy5USU1FX0xJTUlUKTtcblxuICAgICAgICAvLyByZXR1cm4gcHJvbWlzZVxuICAgICAgICAvLyBhbmQgZG8gdGhlIHJlcXVlc3Q6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGRvIHRoZSB1c3VhbCB4aHIgc3R1ZmY6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgICAgICAgICAgLy8gb25sb2FkIGhhbmRsZXI6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQgIT09ICdhYm9ydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2hpbmcgZXJyb3JzOlxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KEVycm9yKCdOZXR3b3JrIEVycm9yJykpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vbnByb2dyZXNzID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIHNlbmQgcmVxdWVzdDpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvKiogZnVuY3Rpb24gY2FsbGVkIG9uIHN1Y2Nlc3NmdWwgZGF0YSBsb2FkICovXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCBkYXRhOiBzdHJpbmcgPSB0aGlzLmxvYWRlZERhdGEudHJpbSgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xuICAgICAgICBsZXQgcmVuZGVyZWRDb3VudCA9IDA7XG5cbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xuICAgICAgICAvLyBpZiBvbmx5IG9uZSBjb250YWluZXIsIGZvcmNlIGBwbGFpbmBcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgcmVuZGVyZWRDb3VudCArPSB0aGlzLnJlbmRlckVsZW1lbnQoY29udGFpbmVyLCBkYXRhLCBpbmRleCA9PT0gMCAmJiBjb250YWluZXJzLmxlbmd0aCA9PT0gMSkgPyAxIDogMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmUtdHJ5IHJlbmRlcmluZyBpZiBub25lIG9mIGNvbnRhaW5lcnMgd2VyZSByZW5kZXJlZDpcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckVsZW1lbnQoJCgnI21haW4nKVswXSwgZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG5cbiAgICAgICAgLy8gZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50IGZvciBzZXJkZWxpYSBDTVM6XG4gICAgICAgIHdpbmRvdy5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnYWpheF9sb2FkZWQnKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcmVuZGVyRWxlbWVudChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IHN0cmluZywgZm9yY2VQbGFpbj86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gJyMnICsgZWwuaWQ7XG5cbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XG4gICAgICAgICAgICBjb2RlID0gZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xuICAgICAgICAgICAgY29kZSA9ICRsb2FkZWRDb250ZW50Lmh0bWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29kZSkgeyBjb25zb2xlLmluZm8oYENvdWxkbid0IHJlcmVuZGVyICMke2VsLmlkfSBlbGVtZW50YCk7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICQoY29udGFpbmVyKVxuICAgICAgICAgICAgLmhpZGUoKVxuICAgICAgICAgICAgLmVtcHR5KClcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcbiAgICAgICAgICAgIC5zaG93KCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgJCh0YXJnZXQpLm9mZignY2xpY2snKS5vbignY2xpY2suaGlzdG9yeScsIHRoaXMub25DbGljayk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGlua3ModGFyZ2V0PzogRWxlbWVudCB8IE5vZGVMaXN0IHwgRWxlbWVudFtdIHwgc3RyaW5nKTogdm9pZCB7XG5cbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtYXBpXScpXG4gICAgICAgICAgICAubm90KCdbZG93bmxvYWRdJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCIjXCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmJD1cIi5qcGdcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJtYWlsdG86XCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cInRlbDpcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1sb2dpbl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtbGFuZ10nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWZePVwiaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArICdcIl0nKVxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cIiNcIl0nKS5ub3QoJ1tocmVmPVwiI1wiXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcblxuXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGFsdGVybmF0ZSA9ICQoJ1tkYXRhLWFsdGVybmF0ZV0nKS5kYXRhKCdhbHRlcm5hdGUnKTtcbiAgICAgICAgY29uc3QgYXJ0aWNsZVVSTCA9IGFsdGVybmF0ZSA/IGFsdGVybmF0ZVtsYW5nIHx8IE9iamVjdC5rZXlzKGFsdGVybmF0ZSlbMF1dIDogbnVsbDtcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGhlYWRVUkwgPSBoZWFkTGluayA/IGhlYWRMaW5rLmhyZWYgOiBudWxsO1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKGFydGljbGVVUkwgfHwgaGVhZFVSTCB8fCBlLmN1cnJlbnRUYXJnZXQuaHJlZik7XG4gICAgfVxuXG5cblxuICAgIC8qKiBsaW5rcyBjbGljayBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvbkNsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsZXQgJHNlbGY6IEpRdWVyeSA9ICQoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50KSxcbiAgICAgICAgICAgIHN0YXRlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdocmVmJykucmVwbGFjZSgnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCwgJycpLFxuICAgICAgICAgICAgdHlwZTogc3RyaW5nID0gJHNlbGYuYXR0cignZGF0YS1oaXN0b3J5Jyk7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdiYWNrJykge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5iYWNrKHN0YXRlKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAncmVwbGFjZScpIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGwucmVzZXRTY3JvbGxDYWNoZShzdGF0ZSk7XG4gICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBvbiBoYXNoLWxpbmsgY2xpY2sgaGFuZGxlciAqL1xuICAgIHByaXZhdGUgb25IYXNoQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjbGljayBsaW5rJyk7XG4gICAgICAgIGlmICgkYm9keS5oYXNDbGFzcygnaXMtYXNpZGUtb3BlbicpKSB7XG4gICAgICAgICAgICBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKCk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKiogSGlzdG9yeWpzIGBzdGF0ZWNoYW5nZWAgZXZlbnQgaGFuZGxlciAqL1xuICAgIHByaXZhdGUgb25TdGF0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcbiAgICAgICAgaWYgKCFQdXNoU3RhdGVzLm5vQ2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBtYXJrIGxpbmtzIGFzIGFjdGl2ZSAqL1xuICAgIHByaXZhdGUgc2V0QWN0aXZlTGlua3MoKTogdm9pZCB7XG4gICAgICAgICQoJ2FbaHJlZl0nKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICQoJ2FbaHJlZj1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIH1cbn1cblxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvZ3NhcC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL3NwbGl0LXRleHQuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xuaW1wb3J0IHsgUHVzaFN0YXRlcyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50Jztcbi8vIGltcG9ydCB7IFByb2dyZXNzYmFyIH0gZnJvbSAnLi9jb21wb25lbnRzL1Byb2dyZXNzYmFyJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcbmltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XG5pbXBvcnQgeyAkd2luZG93LCAkYm9keSB9IGZyb20gJy4vU2l0ZSc7XG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi9DbGFzc2VzJztcblxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kRGF0YSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBzdGVwOiBudW1iZXI7XG4gICAgZGFya2VuOiBib29sZWFuO1xuICAgIGRhcmtlbkRlbGF5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNjcm9sbFBhcmFtcyBleHRlbmRzIE9iamVjdCB7XG4gICAgeD86IG51bWJlcjtcbiAgICB5PzogbnVtYmVyO1xuICAgIHNwZWVkPzogbnVtYmVyO1xuICAgIGFuaW1hdGU/OiBib29sZWFuO1xuICAgIHJlbGF0aXZlU3BlZWQ/OiBib29sZWFuO1xuICAgIGVhc2U/OiBzdHJpbmc7XG59XG5cblxuaW50ZXJmYWNlIElCYXNlQ2FjaGVJdGVtIHtcbiAgICAkZWw/OiBKUXVlcnk7XG4gICAgZG9uZT86IGJvb2xlYW47XG4gICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgIHN0YXJ0PzogbnVtYmVyO1xuICAgIHR5cGU/OiBzdHJpbmc7XG4gICAgeT86IG51bWJlcjtcbiAgICBjb21wb25lbnQ/OiBDb21wb25lbnQ7XG59XG5cbmludGVyZmFjZSBJU2Nyb2xsaW5nRGF0YSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICB0b3A6IG51bWJlcjtcbiAgICByb2xlOiBzdHJpbmc7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICB0aXRsZT86IHN0cmluZztcbiAgICBib3R0b20/OiBudW1iZXI7XG4gICAgY2hpbGRyZW4/OiBhbnk7XG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIHNob3duPzogYm9vbGVhbjtcbiAgICBpbml0aWFsaXplZD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBJUGFyYWxsYXhDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XG4gICAgc2hpZnQ/OiBudW1iZXI7XG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSUFuaW1hdGlvbkNhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBkZWxheT86IG51bWJlcjtcbiAgICB1bmNhY2hlPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIElTY3JvbGxDYWNoZSB7XG4gICAgYW5pbWF0aW9ucz86IElBbmltYXRpb25DYWNoZUl0ZW1bXTtcbiAgICBwYXJhbGxheGVzPzogSVBhcmFsbGF4Q2FjaGVJdGVtW107XG4gICAgbW9kdWxlcz86IElCYXNlQ2FjaGVJdGVtW107XG4gICAgYmFja2dyb3VuZHM/OiBJQmFja2dyb3VuZENhY2hlSXRlbVtdO1xuICAgIHNlY3Rpb25zPzogSVNjcm9sbGluZ0RhdGFbXTtcblxufVxuXG5pbnRlcmZhY2UgSUJhY2tncm91bmRDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFja2dyb3VuZERhdGEsIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBwZXJjZW50YWdlPzogbnVtYmVyO1xuICAgIGluZGV4PzogbnVtYmVyO1xuICAgIHNob3duPzogYm9vbGVhbjtcbiAgICBkZWxheT86IG51bWJlcjtcbiAgICBicmVha3BvaW50cz86IHN0cmluZ1tdO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFNjcm9sbCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTY3JvbGw7XG4gICAgcHVibGljIHN0YXRpYyB3aW5kb3dIZWlnaHQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhdGljIGhlYWRlckhlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBzdGF0aWMgbWF4U2Nyb2xsOiBudW1iZXI7XG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlZDogYm9vbGVhbjtcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvcDogbnVtYmVyO1xuICAgIC8vIHB1YmxpYyBzdGF0aWMgY3VzdG9tU2Nyb2xsOiBTY3JvbGxiYXI7XG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VzdG9tU2Nyb2xsO1xuICAgIHByaXZhdGUgc3RhdGljIGFuaW1hdGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cbiAgICBwcml2YXRlIGNhY2hlOiBJU2Nyb2xsQ2FjaGUgPSB7fTtcbiAgICBwcml2YXRlIHNjcm9sbENhY2hlID0ge307XG4gICAgcHJpdmF0ZSBpZ25vcmVDYWNoZTogYm9vbGVhbjtcbiAgICBwcml2YXRlIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XG4gICAgcHJpdmF0ZSB0YXJnZXQ6IEpRdWVyeTtcbiAgICBwcml2YXRlIHN0b3JlZFBhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIHNlY3Rpb25zOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBjaGFuZ2luZ1BhdGg6IGJvb2xlYW47XG5cbiAgICBcbiAgICAvKipcbiAgICAgKiBzY3JvbGxzIHBhZ2UgdG8gY2VydGFpbiBlbGVtZW50ICh0b3AgZWRnZSkgd2l0aCBzb21lIHNwZWVkXG4gICAgICogQHBhcmFtICB7SlF1ZXJ5fSAgICAgICAgJGVsICAgIFt0YXJnZXQgZWxtZW50XVxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIG9mZnNldFxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIGR1cmF0aW9uXG4gICAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn0gICAgICAgIFthZnRlciBjb21wbGV0ZWQgYW5pbWF0aW9uXVxuICAgICAqL1xuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTogbWVtYmVyLW9yZGVyaW5nXG4gICAgcHVibGljIHN0YXRpYyBzY3JvbGxUb0VsZW1lbnQoJGVsOiBKUXVlcnksIG9mZnNldD86IG51bWJlciwgZHVyYXRpb24/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICBTY3JvbGwuYW5pbWF0aW5nID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnN0IHkgPSAkZWwub2Zmc2V0KCkudG9wIC0gU2Nyb2xsLmhlYWRlckhlaWdodCArIChvZmZzZXQgfHwgMCk7XG4gICAgICAgICAgICBjb25zdCBvYmogPSB7XG4gICAgICAgICAgICAgICAgeTogTWF0aC5tYXgoZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AsIHdpbmRvdy5wYWdlWU9mZnNldCksXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZihvYmopO1xuICAgICAgICAgICAgZ3NhcC50byhvYmosIHtcbiAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogdHlwZW9mIGR1cmF0aW9uID09PSAndW5kZWZpbmVkJyA/IDEgOiBkdXJhdGlvbixcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgb2JqLnkpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBTY3JvbGwuYW5pbWF0aW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgcmVzZXRTY3JvbGxDYWNoZShwYXRobmFtZSk6IHZvaWQge1xuICAgICAgICBTY3JvbGwuaW5zdGFuY2UuY2FjaGVbcGF0aG5hbWVdID0gMDtcbiAgICB9XG4gICAgXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG5cbiAgICBcbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmlnbm9yZUNhY2hlID0gISFicm93c2VyLnNhZmFyaTtcblxuICAgICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICAvLyAkKCdhW2hyZWZePVwiI1wiXTpub3QoXCIuanMtbmF2LWl0ZW0sIFtkYXRhLWxpZ2h0Ym94XVwiKScpLm9uKCdjbGljaycsIHRoaXMub25IYXNoQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgICAvLyBTY3JvbGwuaXNDdXN0b21TY3JvbGwgPSAkKCcjd3BicycpLmRhdGEoJ3Njcm9sbGJhcicpO1xuXG4gICAgICAgIFNjcm9sbC5oZWFkZXJIZWlnaHQgPSA3MDtcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlID0gdGhpcztcblxuICAgICAgICB0aGlzLnN0b3JlZFBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XG4gICAgICAgIHRoaXMuc2VjdGlvbnMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlc2l6ZSgpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLndpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9ICQoJyNuYXZiYXInKS5oZWlnaHQoKTtcbiAgICAgICAgU2Nyb2xsLm1heFNjcm9sbCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIFNjcm9sbC53aW5kb3dIZWlnaHQgKyBTY3JvbGwuaGVhZGVySGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcblxuXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XG4gICAgfVxuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvUGF0aChmYXN0PzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcblxuICAgICAgICBpZiAoJHRhcmdldFswXSkge1xuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkdGFyZ2V0LCAwLCAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghIXRoaXMuY2hhbmdpbmdQYXRoKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICByZXR1cm4gU2Nyb2xsLnNjcm9sbFRvUGF0aCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwuZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpLm9uKCdzY3JvbGwuc2Nyb2xsaW5nJywgKCkgPT4gdGhpcy5vblNjcm9sbCgpKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyBzdGFydCgpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLmVuYWJsZSgpO1xuICAgICAgICBTY3JvbGwuaW5zdGFuY2Uub25TY3JvbGwoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHt9O1xuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpO1xuICAgIH1cblxuICAgIC8vIHByaXZhdGUgb25IYXNoQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAvLyAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vICAgICAvLyBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gICAgIGlmICgkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpKSB7XG4gICAgLy8gICAgICAgICBsZXQgb2Zmc2V0ID0gcGFyc2VJbnQoJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSwgMTApO1xuXG4gICAgLy8gICAgICAgICBpZiAoIHR5cGVvZiAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpID09PSAnc3RyaW5nJyApIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zdCBvZmYgPSAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpLnJlcGxhY2UoJ3ZoJywgJycpO1xuICAgIC8vICAgICAgICAgICAgIG9mZnNldCA9ICQod2luZG93KS5oZWlnaHQoKSAqIChwYXJzZUludChvZmYsIDEwKSAvIDEwMCk7XG4gICAgLy8gICAgICAgICB9XG5cbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCksIG9mZnNldCk7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH07XG5cblxuICAgIHByaXZhdGUgYnVpbGRCYWNrZ3JvdW5kcygpOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZCB9IHtcbiAgICAgICAgbGV0IGJncyA9IHt9O1xuICAgICAgICAkKCdbZGF0YS1iZy1jb21wb25lbnRdJykudG9BcnJheSgpLmZvckVhY2goKGVsLCBpKSA9PiB7XG4gICAgICAgICAgICBsZXQgJGJnRWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGxldCBiZ05hbWUgPSAkYmdFbC5kYXRhKCdiZy1jb21wb25lbnQnKTtcbiAgICAgICAgICAgIGxldCBiZ09wdGlvbnMgPSAkYmdFbC5kYXRhKCdvcHRpb25zJyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudHNbYmdOYW1lXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiZyA9IG5ldyBjb21wb25lbnRzW2JnTmFtZV0oJGJnRWwsIGJnT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgYmcuaWQgPSBlbC5pZDtcbiAgICAgICAgICAgICAgICBiZ3NbZWwuaWRdID0gYmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBjb21wb25lbnQgYXZhaWxhYmxlIScsIGJnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhiZ3MsICdCR1MgU0NST0xMJyk7XG4gICAgICAgIHJldHVybiBiZ3M7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHNhdmVDYWNoZSgpOiB2b2lkIHtcbiAgICAgICAgLy8gaWYgKCF0aGlzLmVsZW1lbnRzKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhbmltYXRpb25zOiBBcnJheTxJQW5pbWF0aW9uQ2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICBjb25zdCBtYXJnaW4gPSAwIDtcblxuICAgICAgICAvLyBsZXQgc2VjdGlvbnM6IEFycmF5PElTY3JvbGxpbmdEYXRhPiA9IFtdO1xuICAgICAgICAvLyBpZiAodGhpcy5zZWN0aW9ucykge1xuXG4gICAgICAgIC8vICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoOyArK2kpIHtcbiAgICBcbiAgICAgICAgLy8gICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IHRoaXMuc2VjdGlvbnMuZXEoaSk7XG4gICAgICAgIC8vICAgICAgICAgY29uc3Qgcm9sZSA9ICRlbC5kYXRhKCdzY3JvbGwnKTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0b3AgPSAkZWwub2Zmc2V0KCkudG9wO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IGhlaWdodCA9ICRlbC5vdXRlckhlaWdodCgpO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IGRlbGF5ID0gJGVsLmRhdGEoJ2RlbGF5JykgfHwgMDtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0aXRsZSA9ICRlbC5kYXRhKCd0aXRsZScpIHx8IGZhbHNlO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHBhdGggPSAkZWwuZGF0YSgncGF0aCcpIHx8IGZhbHNlO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IGRhdGE6IElTY3JvbGxpbmdEYXRhID0ge1xuICAgICAgICAvLyAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgLy8gICAgICAgICAgICAgcm9sZTogcm9sZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgdG9wOiB0b3AsXG4gICAgICAgIC8vICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxuICAgICAgICAvLyAgICAgICAgICAgICBib3R0b206IHRvcCArIGhlaWdodCxcbiAgICAgICAgLy8gICAgICAgICAgICAgcGF0aDogcGF0aCxcbiAgICAgICAgLy8gICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAvLyAgICAgICAgICAgICAkY2hpbGQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCksXG4gICAgICAgIC8vICAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLmhlaWdodCgpLFxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZHJlbjoge30sXG4gICAgICAgIC8vICAgICAgICAgICAgIHNob3duOiAkZWwuZGF0YSgnc2hvd24nKSB8fCBmYWxzZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgZGVsYXk6IGRlbGF5LFxuICAgICAgICAvLyAgICAgICAgIH07XG4gICAgXG4gICAgICAgIC8vICAgICAgICAgc2VjdGlvbnMucHVzaChkYXRhKTtcbiAgICAgICAgLy8gICAgICAgICAkZWwuZGF0YSgnY2FjaGUnLCBpKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG4gICAgICAgIFxuICAgICAgICAkKCdbZGF0YS1hbmltYXRpb25dJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XG4gICAgICAgICAgICBhbmltYXRpb25zLnB1c2goe1xuICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiB0eXBlb2YgJGVsLmRhdGEoJ3N0YXJ0JykgIT09ICd1bmRlZmluZWQnID8gJGVsLmRhdGEoJ3N0YXJ0JykgOiAwLjEsXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCAtIG1hcmdpbixcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgIGRvbmU6ICRlbC5oYXNDbGFzcygnYW5pbWF0ZWQnKSxcbiAgICAgICAgICAgICAgICB0eXBlOiAkZWwuZGF0YSgnYW5pbWF0aW9uJyksXG4gICAgICAgICAgICAgICAgZGVsYXk6ICRlbC5kYXRhKCdkZWxheScpIHx8IG51bGwsXG4gICAgICAgICAgICAgICAgdW5jYWNoZTogJGVsLmRhdGEoJ3VuY2FjaGUnKSxcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIFxuXG4gICAgICAgIGNvbnN0IHBhcmFsbGF4ZXM6IEFycmF5PElQYXJhbGxheENhY2hlSXRlbT4gPSBbXTtcbiAgICAgICAgJCgnW2RhdGEtcGFyYWxsYXhdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gJCg8SFRNTEVsZW1lbnQ+ZWwpO1xuICAgICAgICAgICAgY29uc3QgcCA9ICRlbC5kYXRhKCdwYXJhbGxheCcpO1xuICAgICAgICAgICAgcGFyYWxsYXhlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICBzdGFydDogMCxcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZW9mIHAgPT09ICdzdHJpbmcnID8gcCA6IG51bGwsXG4gICAgICAgICAgICAgICAgc2hpZnQ6IHR5cGVvZiBwID09PSAnbnVtYmVyJyA/IHAgOiBudWxsLFxuICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcbiAgICAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgYmFja2dyb3VuZHM6IEFycmF5PElCYWNrZ3JvdW5kQ2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICAkKCdbZGF0YS1iYWNrZ3JvdW5kXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xuICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZERhdGEgPSAkZWwuZGF0YSgnYmFja2dyb3VuZCcpO1xuICAgICAgICAgICAgY29uc3QgYnJlYWtwb2ludHMgPSBiYWNrZ3JvdW5kRGF0YS5icmVha3BvaW50cyB8fCBbJ2Rlc2t0b3AnLCAndGFibGV0JywgJ3Bob25lJ107XG5cbiAgICAgICAgICAgIGlmIChicmVha3BvaW50cy5pbmRleE9mKGJyZWFrcG9pbnQudmFsdWUpID49IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYmFja2dyb3VuZHNbYmFja2dyb3VuZERhdGEuaWRdKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybigndGhlcmVcXCdzIG5vIGJhY2tncm91bmQgd2l0aCBpZD0nICsgYmFja2dyb3VuZERhdGEuaWQgKyAnIScpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRzLnB1c2goJC5leHRlbmQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wLFxuICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0OiAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGksXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXJrZW5EZWxheTogMCxcbiAgICAgICAgICAgICAgICAgICAgfSwgYmFja2dyb3VuZERhdGEgfHwge30pKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cblxuICAgICAgICB0aGlzLmNhY2hlLmFuaW1hdGlvbnMgPSBhbmltYXRpb25zO1xuICAgICAgICB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMgPSBwYXJhbGxheGVzO1xuICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzID0gYmFja2dyb3VuZHM7XG4gICAgICAgIC8vIHRoaXMuY2FjaGUuc2VjdGlvbnMgPSBzZWN0aW9ucztcblxuXG5cbiAgICAgICAgdGhpcy5vblNjcm9sbCgpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uU2Nyb2xsID0gKCk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGlmIChTY3JvbGwuZGlzYWJsZWQgfHwgJGJvZHkuaGFzQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKSkgeyByZXR1cm47IH1cblxuICAgICAgICBjb25zdCBzVCA9IHdpbmRvdy5wYWdlWU9mZnNldCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsVG9wIHx8IGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wIHx8IDA7XG4gICAgICAgIGNvbnN0IHdpbmRvd0hlaWdodCA9IFNjcm9sbC53aW5kb3dIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHNjcmVlbkNlbnRlcjogbnVtYmVyID0gc1QgKyBTY3JvbGwud2luZG93SGVpZ2h0ICogMC4zMztcbiAgICAgICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gU2Nyb2xsLmhlYWRlckhlaWdodDtcbiAgICAgICAgY29uc3Qgc2Nyb2xsZW5kID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gd2luZG93LmlubmVySGVpZ2h0IC0gMjtcbiAgICAgICAgY29uc3QgcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSAoU2Nyb2xsLmhlYWRlckhlaWdodCAqIDIpIDogMDtcbiAgICAgICAgY29uc3QgYmFja2dyb3VuZHMgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykub2Zmc2V0KCkudG9wIC0gU2Nyb2xsLmhlYWRlckhlaWdodCA6IDA7XG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb3AgPSBzVDtcbiAgICAgICAgdGhpcy5zY3JvbGxDYWNoZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVdID0gc1Q7XG5cbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkLXdpbmRvdy1oZWlnaHQnLCBzVCA+IHdpbmRvd0hlaWdodCAtIDEwMCk7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC1uYXZiYXInLCBzVCA+IDEwMCk7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZCcsIHNUID4gMCk7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy10cmFpbGVyLXNjcm9sbGVkJywgc1QgPiBwYWdlSGVhZGVyKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWJhY2tncm91bmRzLXNjcm9sbGVkJywgc1QgPiBiYWNrZ3JvdW5kcyk7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGwtZW5kJywgc1QgPj0gc2Nyb2xsZW5kKTtcblxuXG4gICAgICAgIC8vIGFuaW1hdGlvbnM6XG4gICAgICAgIGlmICh0aGlzLmNhY2hlLmFuaW1hdGlvbnMgJiYgdGhpcy5jYWNoZS5hbmltYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbTogSUFuaW1hdGlvbkNhY2hlSXRlbSA9IHRoaXMuY2FjaGUuYW5pbWF0aW9uc1tpXTtcbiAgICAgICAgICAgICAgICBjb25zdCB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICAgICAgY29uc3QgeVRvcDogbnVtYmVyID0gc1Q7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVk6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS55IDogaXRlbS4kZWwub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1IZWlnaHQ6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS5oZWlnaHQgOiBpdGVtLiRlbC5oZWlnaHQoKTtcblxuICAgICAgICAgICAgICAgIGlmICghaXRlbS5kb25lICYmIGl0ZW1ZIDw9IHlCb3R0b20gJiYgaXRlbVkgKyBpdGVtSGVpZ2h0ID49IHNUKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uJGVsLmFkZENsYXNzKCdhbmltYXRlZCcpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBxdWljazogYm9vbGVhbiA9IHlUb3AgPj0gaXRlbVkgKyBpdGVtSGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFuaW1hdGUoaXRlbSwgaXRlbS4kZWwsIGl0ZW0udHlwZSwgaXRlbS5kZWxheSwgcXVpY2spO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLmRvbmUgJiYgaXRlbS5jb21wb25lbnQgJiYgaXRlbS50eXBlID09PSAndG9nZ2xlJyAmJiAoaXRlbVkgPiB5Qm90dG9tIHx8IGl0ZW1ZICsgaXRlbUhlaWdodCA8IHlUb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5jb21wb25lbnRbJ2Rpc2FibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jb21wb25lbnRbJ2Rpc2FibGUnXSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS51bmNhY2hlICYmIGl0ZW0uZG9uZSAmJiAoc1QgPD0gaXRlbVkgLSB3aW5kb3dIZWlnaHQgfHwgc1QgPj0gaXRlbVkgKyB3aW5kb3dIZWlnaHQgKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmZpbmQoJy51bmNhY2hlZCcpLmxlbmd0aCA+IDApIHsgaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykucmVtb3ZlQXR0cignc3R5bGUnKTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuYXR0cignZGF0YS11bmNhY2hlJykpIHsgaXRlbS4kZWwucmVtb3ZlQXR0cignc3R5bGUnKTsgfVxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIHBhcmFsbGF4ZXM6XG4gICAgICAgIGlmICh0aGlzLmNhY2hlLnBhcmFsbGF4ZXMgJiYgdGhpcy5jYWNoZS5wYXJhbGxheGVzLmxlbmd0aCA+IDAgJiYgYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUucGFyYWxsYXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYWxsYXgodGhpcy5jYWNoZS5wYXJhbGxheGVzW2ldLCBzVCwgd2luZG93SGVpZ2h0LCAtaGVhZGVySGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFxuXG4gICAgICAgIC8vYmdzXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzKSB7XG5cbiAgICAgICAgICAgIGNvbnN0IHdpbmRvd0NlbnRlcjogbnVtYmVyID0gMC41ICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgLy8gY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgbGV0IGJnc1RvU2hvdyA9IFtdO1xuICAgICAgICAgICAgbGV0IGJnc1RvSGlkZSA9IFtdO1xuXG5cbiAgICAgICAgICAgIHRoaXMuY2FjaGUuYmFja2dyb3VuZHMuZm9yRWFjaCgoaXRlbTogSUJhY2tncm91bmRDYWNoZUl0ZW0sIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLm91dGVySGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUJvdHRvbTogbnVtYmVyID0gaXRlbVkgKyBpdGVtSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IHNUICsgaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBpdGVtLnN0YXJ0ICogd2luZG93SGVpZ2h0IDogd2luZG93Q2VudGVyO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHRoaXMuYmFja2dyb3VuZHNbaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsYXkgPSB0eXBlb2YgaXRlbS5kZWxheSAhPT0gJ3VuZGVmaW5lZCcgPyBpdGVtLmRlbGF5IDogMC4xO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnRhZ2UgPSAtIChpdGVtWSAtIHlDZW50ZXIpIC8gaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICBsZXQgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgY3VycmVudCA9ICRib2R5Lmhhc0NsYXNzKCdpcy10cmFpbGVyLXNjcm9sbGVkJykgPyBzVCArIHdpbmRvd0hlaWdodCA+PSBpdGVtWSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QgOiBpdGVtWSAtIHNUIDw9IHdpbmRvd0NlbnRlciAmJiBpdGVtQm90dG9tIC0gc1QgPj0gd2luZG93Q2VudGVyO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJhY2tncm91bmQuc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIDIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgZGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQudXBkYXRlKHBlcmNlbnRhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLnNldFN0ZXAoaXRlbS5zdGVwLCBiYWNrZ3JvdW5kUXVpY2tTZXR1cCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmRhcmtlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5kYXJrZW4oaXRlbVkgPD0geUNlbnRlciAtIHdpbmRvd0hlaWdodCAqIGl0ZW0uZGFya2VuRGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJnc1RvU2hvdy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgIGJnc1RvSGlkZS5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaWYgKGJnc1RvSGlkZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBiZ3NUb0hpZGUuZm9yRWFjaCgoYmdJRCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmdzVG9TaG93LmluZGV4T2YoYmdJRCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJhY2tncm91bmRzW2JnSURdLmFuaW1hdGlvbk91dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzW2JnSURdLnNob3duPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gUHJvZ3Jlc3NiYXIudXBkYXRlKHNUKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBhbmltYXRlKGRhdGE6IElBbmltYXRpb25DYWNoZUl0ZW0sICRlbDogSlF1ZXJ5LCB0eXBlOiBzdHJpbmcsIGRlbGF5OiBudW1iZXIgPSAwLjEgYXMgbnVtYmVyLCBxdWljaz86IGJvb2xlYW4sIHVuY2FjaGU/OiBib29sZWFuKTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgdGltZSA9ICFxdWljayA/IC42IDogMDtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmFkZSc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZVVwJzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeTogNDAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZURvd24nOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiAtMTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVSaWdodCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZUxlZnQnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAxMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaVRhYnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbFRleHQgPSAkZWwuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJUZXh0ID0gJGVsLmZpbmQoJ3NwYW46bGFzdC1jaGlsZCcpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obFRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJzUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHJUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICctNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZWxlbWVudHMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ1tkYXRhLXZpZXctdGFiXScpLCB7IGR1cmF0aW9uOiAxLCB5OiAnMTAwJScgfSwge1xuICAgICAgICAgICAgICAgICAgICB5OiAnMCUnLCBzdGFnZ2VyOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5pdGVtX190YWJzJyksIHsgZHVyYXRpb246IDEsIG92ZXJmbG93OiAndW5zZXQnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFjdCc6XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGxldCBmVGV4dCA9ICRlbC5maW5kKCcuZmFjdF9fdGV4dCBzcGFuJyksXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0RlR4dCA9IG5ldyBTcGxpdFRleHQoZlRleHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycyd9KSxcbiAgICAgICAgICAgICAgICAgICAgZkltZyA9ICRlbC5maW5kKCcuZmFjdF9faW1hZ2Utd3JhcCcpLFxuICAgICAgICAgICAgICAgICAgICBmQXJyID0gJGVsLmZpbmQoJy5mYWN0X19pY29uJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKClcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmQXJyLCB7IGR1cmF0aW9uOiAxLCByb3RhdGU6IDkwIH0sIHsgcm90YXRlOiAwLCBkZWxheTogMC41IH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oc3BsaXRGVHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtNSB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDEgfSwgJy09MC44JylcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmSW1nLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxIH0sICctPTAuNScpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2xlYWQnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXQgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgbGluZXMnLCBsaW5lc0NsYXNzOiAnbGluZScgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZWwuZmluZCgnLmxpbmUnKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYWZ0ZXIoJzxicj4nKTtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYXBwZW5kKCc8c3BhbiBjbGFzcz1cImxpbmVfX2JnXCI+PC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0LndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xLCBkZWxheTogMC40IH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5saW5lX19iZycpLCB7IGR1cmF0aW9uOiAwLjc1LCBzY2FsZVg6IDEsIHN0YWdnZXI6IDAuMX0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMH0se3NjYWxlWDogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGRlbGF5fSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnY2hhcnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEguY2hhcnMsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCwgb3BhY2l0eTogMCB9LCB7IHNjYWxlWDogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdjaGFycy1zaW1wbGUnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIMiA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRIMi5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnd29yZHMtc2ltcGxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMnIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXIgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21Ubyh3b3Jkcy53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJ9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpbWFnZXMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ2ltZycpLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBzdGFnZ2VyOiAwLjIgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaGVybyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXAgPSAkZWwuZmluZCgnW2RhdGEtaXRlbT1cIjBcIl0gLmpzLW1hcCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9FbCA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXSAuanMtZWwnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvQ2FwdGlvbiA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9OYXYgPSAkZWwuZmluZCgnLmpzLW5hdmlnYXRpb24nKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFttYXAsIGhlcm9FbCwgaGVyb05hdl0sIHsgb3BhY2l0eTogMH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obWFwLCAxLjUsIHtkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMC44NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oaGVyb0NhcHRpb24sIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDAuNSxcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24ucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9DYXB0aW9uLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhoZXJvRWwsIDEsIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTIwfSwge29wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAxLjI1LCBzdGFnZ2VyOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oaGVyb05hdiwgMSwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMS41LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZXJvRWwucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtcmVhZHknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3F1b3RlJzpcbiAgICAgICAgICAgICAgICBjb25zdCAkcXVvdGUgPSAkZWwuZmluZCgnLmpzLXF1b3RlLXdvcmRzJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGF1dGhvciA9ICRlbC5maW5kKCcuanMtcXVvdGUtYXV0aG9yJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGxpbmUgPSAkZWwuZmluZCgnaHInKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFskcXVvdGUsICRlbCwgJGF1dGhvcl0sIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gJHF1b3RlLmNoaWxkcmVuKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRRdW90ZSA9IG5ldyBTcGxpdFRleHQoJHF1b3RlLCB7IHR5cGU6ICd3b3JkcycgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBGT1IgVU5DQUNIRSBPUFRJT04gT0YgQU5JTUFUSU9OIFFVT1RFXG4gICAgICAgICAgICAgICAgLy8gZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0UXVvdGUud29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgc3BsaXRRdW90ZS53b3Jkc1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgIGdzYXAudGltZWxpbmUoe1xuICAgICAgICAgICAgICAgICAgICBhdXRvUmVtb3ZlQ2hpbGRyZW46IHRydWUsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnNldCgkcXVvdGUsIHsgb3BhY2l0eTogMSB9KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGNoaWxkLCAwLjUsIHsgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIGVhc2U6ICdwb3dlcjMnIH0sICcrPScgKyBkZWxheSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb20oc3BsaXRRdW90ZS53b3JkcywgMC41LCB7IG9wYWNpdHk6IDAsIHg6IDgsIHRyYW5zZm9ybU9yaWdpbjogJzAlIDEwMCUnLCBlYXNlOiAncG93ZXIzJywgc3RhZ2dlcjogMC4wNSB9LCAwLjEpXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oJGF1dGhvciwgMC43LCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LCB7IG9wYWNpdHk6IDEsIHg6IDAgfSwgJy09JyArIDAuMylcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkbGluZSwgeyBkdXJhdGlvbjogMC43LCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEgfSwgJy09MC4zJyk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnd29yZHMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR4dCA9ICRlbDtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdHR4dCA9IG5ldyBTcGxpdFRleHQodHh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXR0eHQuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcbiAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0dHh0LmNoYXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzcGxpdHR4dC5jaGFyc1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgXG4gICAgICAgICAgICBjYXNlICd1cERvd24nOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeVNoaWZ0ID0gJGVsLmRhdGEoJ3NoaWZ0JykgPT09ICd1cCcgPyAxMCA6IC0xMDtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSwge29wYWNpdHk6IDAuMiwgeTogeVNoaWZ0LCByZXBlYXQ6IDIsIGVhc2U6ICdub25lJywgeW95bzogdHJ1ZSwgZGVsYXk6IGRlbGF5LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpdGVtc0ZhZGUnOlxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzJykgKyAnJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHNJbiA9ICRlbC5kYXRhKCdlbGVtZW50cy1pbicpID8gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzLWluJykgKyAnJykgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXJFbCA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbCA9IGRlbGF5ID8gZGVsYXkgOiAwLjI7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hpZnRZQXhpcyA9ICRlbC5kYXRhKCd5JykgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxTY2FsZSA9ICAkZWwuZGF0YSgnc2NhbGUnKSA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KGVsZW1lbnRzLCB7IG9wYWNpdHk6IDAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8ICBlbGVtZW50c0luLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNJbltpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVsU2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIDAuOCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOX0sIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50c0luLCAwLjgsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5ICsgMC40IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGlmdFlBeGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMTB9LCB7IHk6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd2aWRlby10ZXh0JzpcbiAgICAgICAgICAgICAgICBjb25zdCB2aWQgPSAkZWwuZmluZCgnLmpzLWNvbC02NicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZiA9ICRlbC5maW5kKCcuanMtY29sLTMzJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnNldChbdmlkLCBpbmZdLCB7IG9wYWNpdHk6IDAgfSk7XG5cblxuICAgICAgICAgICAgICAgIGdzYXAudG8odmlkLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC4yfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaW5mLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7IG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjR9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdoZWFkaW5nJzpcbiAgICAgICAgICAgICAgICBjb25zdCBoVGl0bGUgPSAkZWwuZmluZCgnLmpzLXRpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhyID0gJGVsLmZpbmQoJy5qcy1oZWFkaW5nLWhyJyk7XG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRUaXRsZSA9IG5ldyBTcGxpdFRleHQoaFRpdGxlLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0VGl0bGUuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhociwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxLCBkZWxheTogMC41IH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3RpdGxlRmFkZUluJzpcbiAgICAgICAgICAgICAgICBjb25zdCBsZWFkID0gJGVsLmZpbmQoJy5qcy1maXhlZC10aXRsZScpLFxuICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICRlbC5maW5kKCcuanMtc3ViJyksXG4gICAgICAgICAgICAgICAgICAgICAgYXJyID0gJGVsLmZpbmQoJy5qcy1hcnInKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShsZWFkLCB7IGR1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHNjYWxlOiAxLjIsIGRlbGF5OiAyfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKHN1YiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjJ9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oYXJyLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAzMCwgZGVsYXk6IDMuN30pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ludHJvJzpcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ0YWluID0gJGVsLmZpbmQoJy5qcy1jdXJ0YWluJyk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGN1cnRhaW4sIHsgZHVyYXRpb246IDMsIG9wYWNpdHk6IDAsIGRlbGF5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgXG4gICAgICAgICAgICBjYXNlICdoZWFkZXInOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBodGltZSA9ICRlbC5maW5kKCcuanMtdGltZScpLFxuICAgICAgICAgICAgICAgICAgICBzb2NpYWxEID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX2l0ZW0nKSxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVUZXh0ID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX3RpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhIciA9ICRlbC5maW5kKCcuanMtaGVhZGVyLWhyJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhbaHRpbWUsIHNoYXJlVGV4dCwgc29jaWFsRF0sIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaEhyLCB7IHNjYWxlWDogMH0sIHsgc2NhbGVYOiAxfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGNvbnN0IG51bUVsID0gJGVsLmZpbmQoJ1tkYXRhLW51bV0nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpLmRhdGEoJ251bScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1ciA9ICRlbC5kYXRhKCd0aW1lJykgPyAkZWwuZGF0YSgndGltZScpICogMTAwMCA6IDIwMDA7XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtVGV4dCA9ICRlbC5maW5kKCdbZGF0YS10ZXh0XScpLmxlbmd0aCA+IDAgPyAkZWwuZmluZCgnW2RhdGEtdGV4dF0nKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgbGV0IGZpeGVkID0gbnVtLnRvU3RyaW5nKCkuaW5kZXhPZignLicpID4gLTEgPyBudW0udG9TdHJpbmcoKS5sZW5ndGggLSBudW0udG9TdHJpbmcoKS5pbmRleE9mKCcuJykgLSAxIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIG51bUVsLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG51bUVsLndpZHRoKCksXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAwfSwgeyBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgaWYgKG51bVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQobnVtVGV4dCwgeyBvcGFjaXR5OiAwfSk7XG4gICAgICAgICAgICAgICAgICAgIGdzYXAudG8obnVtVGV4dCwgMSx7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkdXIvMTAwMH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG51bUVsLnByb3AoJ0NvdW50ZXInLCAwKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgQ291bnRlcjogbnVtLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cixcbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiAnc3dpbmcnLFxuICAgICAgICAgICAgICAgICAgICBzdGVwOiAobm93KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQgJiYgZml4ZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG51bUVsLmRhdGEoJ3JlcGxhY2UnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KChub3cudG9GaXhlZChmaXhlZCkudG9TdHJpbmcoKS5yZXBsYWNlKCcuJywgJywnKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQobm93LnRvRml4ZWQoZml4ZWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQoTWF0aC5jZWlsKG5vdykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke3R5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHBhcmFsbGF4KGl0ZW06IElQYXJhbGxheENhY2hlSXRlbSwgc1Q6IG51bWJlciwgd2luZG93SGVpZ2h0OiBudW1iZXIsIGhlYWRlckhlaWdodDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKGl0ZW0uc2hpZnQpIHtcblxuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBpdGVtLnk7XG5cbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcblxuICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50OiBudW1iZXIgPSAoeSAtIHNUICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0IC0gaGVhZGVySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChwZXJjZW50ICogaXRlbS5zaGlmdCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lOiBudW1iZXIgPSAhaXRlbS5kb25lID8gMCA6IDAuNTtcbiAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsKTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGltZSxcbiAgICAgICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICAgICAgcm91bmRQcm9wczogWyd5J10sXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSkge1xuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGNvbnN0ICRlbFN0aWNreTogSlF1ZXJ5ID0gJGVsLnBhcmVudCgpLnBhcmVudCgpO1xuICAgICAgICAgICAgY29uc3QgeTogbnVtYmVyID0gaXRlbS55O1xuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgcHlUb3BTdGlja3k6IG51bWJlciA9IHNUIC0gJGVsU3RpY2t5LmhlaWdodCgpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVybyc6XG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGVsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAhYnJvd3Nlci5tb2JpbGUgPyBzVCAqIDAuNSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgY2FzZSAnZml4ZWRJbWFnZSc6XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHksIFwieVwiLCBzVCwgcHlCb3R0b20sIHdpbmRvd0hlaWdodCx3aW5kb3dIZWlnaHQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSBweVRvcCAmJiB5IDw9IHB5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGVsLmhhc0NsYXNzKCdoYXMtcGFyYWxsYXgnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBcblxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdoYXMtcGFyYWxsYXgnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICAgICAgY2FzZSAnY3NzLWFuaW1hdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuaGFzQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5JykgPyBudWxsIDogaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgXG5cbiAgICAgICAgICAgICAgICBjYXNlICdyZWxhdGl2ZVBhcmFsbGF4JzpcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBpdGVtLmNoaWxkSGVpZ2h0IC0gaXRlbS5oZWlnaHQ7IC8vIHJlc2VydmUgc3BhY2VcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF4U2hpZnQgPSBNYXRoLm1pbihhdmFpbGFibGVTcGFjZSwgaXRlbS5oZWlnaHQgKyBoZWFkZXJIZWlnaHQpOyAvLyBNYXRoLm1pbihhdmFpbGFibGVTcGFjZSwgKHdpbmRvd0hlaWdodCAtIGRhdGEuaGVpZ2h0KSAqIDAuNSApOyAvLyBkbyBub3QgbW92ZSB0b28gbXVjaCBvbiBiaWcgc2NyZWVuc1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gKHNUIC0gaXRlbS55ICsgd2luZG93SGVpZ2h0KSAvICh3aW5kb3dIZWlnaHQgKyBpdGVtLmhlaWdodCk7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IHBvc1k6IHN0cmluZyB8IG51bWJlciA9IE1hdGgucm91bmQoKDEgLSBwZXJjZW50KSAqIG1heFNoaWZ0KTtcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPCAwID8gMCA6IHBvc1k7XG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZID4gbWF4U2hpZnQgPyBtYXhTaGlmdCA6IHBvc1k7XG5cbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kY2hpbGQsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IC1wb3NZLFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke2l0ZW0udHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5leHBvcnQgY2xhc3MgU2hhcmUge1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcblxuXG4gICAgICAgICQoJ1tkYXRhLXNoYXJlXScpLm9uKCdjbGljaycsIChlKTogYm9vbGVhbiA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBsZXQgd2luV2lkdGggPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW53aWR0aCcpLCAxMCkgfHwgNTIwO1xuICAgICAgICAgICAgbGV0IHdpbkhlaWdodCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbmhlaWdodCcpLCAxMCkgfHwgMzUwO1xuICAgICAgICAgICAgbGV0IHdpblRvcCA9IChzY3JlZW4uaGVpZ2h0IC8gMikgLSAod2luSGVpZ2h0IC8gMik7XG4gICAgICAgICAgICBsZXQgd2luTGVmdCA9IChzY3JlZW4ud2lkdGggLyAyKSAtICh3aW5XaWR0aCAvIDIpO1xuXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50VGFyZ2V0ID0gPGFueT5lLmN1cnJlbnRUYXJnZXQ7XG4gICAgICAgICAgICBjb25zdCBocmVmID0gY3VycmVudFRhcmdldC5ocmVmO1xuICAgICAgICAgICAgY29uc3QgZGF0YSA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdzaGFyZScpO1xuXG4gICAgICAgICAgICBpZiAoZGF0YSA9PT0gJ2xpbmtlZGluJykge1xuICAgICAgICAgICAgICAgIHdpbldpZHRoID0gNDIwO1xuICAgICAgICAgICAgICAgIHdpbkhlaWdodCA9IDQzMDtcbiAgICAgICAgICAgICAgICB3aW5Ub3AgPSB3aW5Ub3AgLSAxMDA7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGhyZWYsICdzaGFyZXInICsgZGF0YSwgJ3RvcD0nICsgd2luVG9wICsgJyxsZWZ0PScgKyB3aW5MZWZ0ICsgJyx0b29sYmFyPTAsc3RhdHVzPTAsd2lkdGg9JyArIHdpbldpZHRoICsgJyxoZWlnaHQ9JyArIHdpbkhlaWdodCk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vcmVmZXJlbmNlcy5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IFB1c2hTdGF0ZXMsIFB1c2hTdGF0ZXNFdmVudHMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xuaW1wb3J0IHsgUGFnZSwgUGFnZUV2ZW50cyB9IGZyb20gJy4vcGFnZXMvUGFnZSc7XG5pbXBvcnQgeyBDb21wb25lbnRFdmVudHMsIENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xuaW1wb3J0IHsgQnJvd3NlciwgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlcic7XG5pbXBvcnQgeyBwYWdlcywgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XG5pbXBvcnQgeyBDb3B5IH0gZnJvbSAnLi9Db3B5JztcbmltcG9ydCB7IFNoYXJlIH0gZnJvbSAnLi9TaGFyZSc7XG5pbXBvcnQgeyBBUEkgfSBmcm9tICcuL0FwaSc7XG5cbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xuXG5leHBvcnQgbGV0IHNpdGU6IFNpdGU7XG5leHBvcnQgbGV0ICRkb2M6IEpRdWVyeTtcbmV4cG9ydCBsZXQgJHdpbmRvdzogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkYm9keTogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkYXJ0aWNsZTogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkbWFpbjogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xuZXhwb3J0IGxldCBwaXhlbFJhdGlvOiBudW1iZXI7XG5leHBvcnQgbGV0IGRlYnVnOiBib29sZWFuO1xuZXhwb3J0IGxldCBlYXNpbmc6IHN0cmluZztcbmV4cG9ydCBsZXQgbGFuZzogc3RyaW5nO1xuZXhwb3J0IGxldCBmaXhlZHBvc2l0aW9uOiBudW1iZXI7XG5cbi8vIGRlY2xhcmUgbGV0IEN1c3RvbUVhc2U7XG5cblxuXG5cbmV4cG9ydCBjbGFzcyBTaXRlIHtcblxuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2l0ZTtcblxuICAgIHByaXZhdGUgY3VycmVudFBhZ2U6IFBhZ2U7XG4gICAgcHJpdmF0ZSBwdXNoU3RhdGVzOiBQdXNoU3RhdGVzO1xuICAgIHByaXZhdGUgc2Nyb2xsOiBTY3JvbGw7XG4gICAgcHJpdmF0ZSBsYXN0QnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XG4gICAgcHJpdmF0ZSBsb2FkZXI6IExvYWRlcjtcbiAgICAvLyBwcml2YXRlIGlzUmVhZHk6IGJvb2xlYW47XG4gICAgLy8gcHJpdmF0ZSBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XG4gICAgLy8gcHJpdmF0ZSAkaGFtYnVyZ2VyOiBKUXVlcnk7XG4gICAgLy8gcHJpdmF0ZSAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xuICAgIC8vIHByaXZhdGUgJGFydGljbGU6IEpRdWVyeTtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgY29uc29sZS5ncm91cCgpO1xuICAgICAgICBjb25zb2xlLmxvZygnc2l0ZScpO1xuXG4gICAgICAgIFNpdGUuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICAvLyBsYW5nID0gJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKTtcblxuICAgICAgICBwaXhlbFJhdGlvID0gd2luZG93LmRldmljZVBpeGVsUmF0aW8gfHwgMTtcbiAgICAgICAgZGVidWcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLmluZGV4T2YoJ2RlYnVnJykgPj0gMDtcbiAgICAgICAgLy8gZWFzaW5nID0gQ3VzdG9tRWFzZS5jcmVhdGUoJ2N1c3RvbScsICdNMCwwLEMwLjUsMCwwLjMsMSwxLDEnKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGluaXQoKTogdm9pZCB7XG5cbiAgICAgICAgQnJlYWtwb2ludC51cGRhdGUoKTtcbiAgICAgICAgQnJvd3Nlci51cGRhdGUoKTtcblxuICAgICAgICAkZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgICR3aW5kb3cgPSAkKHdpbmRvdyk7XG4gICAgICAgICRib2R5ID0gJCgnYm9keScpO1xuICAgICAgICAkYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLW1haW4nKTtcbiAgICAgICAgJG1haW4gPSAkKCcjbWFpbicpO1xuXG5cbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzID0gbmV3IFB1c2hTdGF0ZXMoKTtcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFLCB0aGlzLm9uU3RhdGUpO1xuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5QUk9HUkVTUywgdGhpcy5vbkxvYWRQcm9ncmVzcyk7XG5cbiAgICAgICAgLy8gdGhpcy4kaGFtYnVyZ2VyID0gJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xuICAgICAgICAvLyB0aGlzLiRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xuICAgICAgICAvLyB0aGlzLiRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcblxuICAgICAgICB0aGlzLnNjcm9sbCA9IG5ldyBTY3JvbGwoKTtcbiAgICAgICAgdGhpcy5sb2FkZXIgPSBuZXcgTG9hZGVyKCQoJy5qcy1sb2FkZXInKSk7XG4gICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSk7XG5cblxuICAgICAgICBuZXcgQ29weSgpO1xuICAgICAgICBuZXcgU2hhcmUoKTtcbiAgICAgICAgbmV3IEFQSSgpO1xuICAgICAgICBBUEkuYmluZCgpO1xuICAgICAgICAvLyB0aGlzLm1lbnUgPSBuZXcgTWVudSgkKCcuanMtbWVudScpKTtcbiAgICAgICAgLy8gdGhpcy5jb29raWVzID0gbmV3IENvb2tpZXMoJCgnLmpzLWNvb2tpZXMnKSk7XG5cblxuICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihbXG4gICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCksXG4gICAgICAgICAgICAvLyB0aGlzLnByZWxvYWRBc3NldHMoKSxcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCksXG4gICAgICAgIF0pLnRoZW4odGhpcy5vblBhZ2VMb2FkZWQpO1xuXG5cbiAgICAgICAgaWYgKGRlYnVnKSB7IFV0aWxzLnN0YXRzKCk7IH1cblxuICAgICAgICAkd2luZG93Lm9uKCdvcmllbnRhdGlvbmNoYW5nZScsICgpID0+IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcblxuICAgICAgICB9LCAxMDApKTtcbiAgICAgICAgJHdpbmRvdy5vbigncmVzaXplJywgKCkgPT4gdGhpcy5vblJlc2l6ZSgpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvblJlc2l6ZSgpOiB2b2lkIHtcblxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xuICAgICAgICBpZiAoYnJlYWtwb2ludC5kZXNrdG9wICYmICFicm93c2VyLm1vYmlsZSkge1xuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHdpZHRoID0gJHdpbmRvdy53aWR0aCgpO1xuICAgICAgICBjb25zdCBoZWlnaHQgPSAkd2luZG93LmhlaWdodCgpO1xuXG4gICAgICAgIGNvbnN0IGNoYW5nZWQgPSAhdGhpcy5sYXN0QnJlYWtwb2ludCB8fCB0aGlzLmxhc3RCcmVha3BvaW50LnZhbHVlICE9PSBicmVha3BvaW50LnZhbHVlO1xuICAgICAgICB0aGlzLmxhc3RCcmVha3BvaW50ID0gYnJlYWtwb2ludDtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5yZXNpemUod2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xuICAgICAgICB0aGlzLmxvYWRlci5yZXNpemUod2lkdGgsIGhlaWdodCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLnJlc2l6ZSgpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHByZWxvYWRBc3NldHMoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IGFzc2V0cyA9IFtdO1xuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQoJy5wcmVsb2FkLWJnJywge1xuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJ1ZSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGFzc2V0cyAmJiBhc3NldHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKGFzc2V0c1tpXSwgbnVsbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWwuanFEZWZlcnJlZC5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgLy8gY2hlY2sgaWYgYW55IGNvbXBvbmVudCBoYW5kbGUgb25TdGF0ZSBldmVudFxuICAgIC8vIGlmIG5vdCwgcmVsb2FkIGh0bWw6XG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xuXG4gICAgICAgIC8vIGNvbnN0IHNjcm9sbGluZ0NoYW5nZWRTdGF0ZSA9IHRoaXMuc2Nyb2xsLm9uU3RhdGUoKTtcbiAgICAgICAgY29uc3QgcGFnZUNoYW5nZWRTdGF0ZSA9IHRoaXMuY3VycmVudFBhZ2Uub25TdGF0ZSgpO1xuXG4gICAgICAgIC8vIGlmICghc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlICYmICFvZmZzY3JlZW5DaGFuZ2VkU3RhdGUgJiYgIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcbiAgICAgICAgaWYgKCFwYWdlQ2hhbmdlZFN0YXRlKSB7XG5cbiAgICAgICAgICAgIC8vIEFuYWx5dGljcy5zZW5kUGFnZXZpZXcod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcblxuICAgICAgICAgICAgY29uc3QgcHVzaFN0YXRlc0xvYWRQcm9taXNlID0gdGhpcy5wdXNoU3RhdGVzLmxvYWQoKTtcbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGVPdXRQcm9taXNlID0gdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlT3V0KCk7XG5cbiAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLnNjcm9sbC5zdG9wKCk7XG5cbiAgICAgICAgICAgIC8vIGFsbCBwcm9taXNlcyBhcnJheTpcbiAgICAgICAgICAgIGNvbnN0IGxvYWRpbmdQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBbXG4gICAgICAgICAgICAgICAgcHVzaFN0YXRlc0xvYWRQcm9taXNlLFxuICAgICAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLFxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgLy8gcmVuZGVyIGh0bWwgd2hlbiBldmVyeXRoaW5nJ3MgcmVhZHk6XG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihsb2FkaW5nUHJvbWlzZXMpLnRoZW4odGhpcy5yZW5kZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8vIGRpc3BsYXkgYWpheCBwcm9ncmVzczpcbiAgICBwcml2YXRlIG9uTG9hZFByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSAqIHByb2dyZXNzKTtcbiAgICB9XG5cblxuXG4gICAgLy8gcGFzcyBsb2FkaW5nIHByb2dyZXNzIGZyb20gcGFnZSB0byBwcmVsb2FkZXI6XG4gICAgcHJpdmF0ZSBvblBhZ2VQcm9ncmVzcyA9IChwcm9ncmVzczogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKyAwLjUgKiBwcm9ncmVzcyk7XG4gICAgfVxuXG5cblxuICAgIC8vIGRlYWwgd2l0aCBuZXdseSBhZGRlZCBlbGVtZW50c1xuICAgIHByaXZhdGUgb25QYWdlQXBwZW5kID0gKGVsOiBKUXVlcnkpOiB2b2lkID0+IHtcbiAgICAgICAgUHVzaFN0YXRlcy5iaW5kKGVsWzBdKTtcbiAgICAgICAgLy8gV2lkZ2V0cy5iaW5kKGVsWzBdKTtcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xuICAgIH1cblxuXG5cbiAgICAvLyBjYWxsZWQgYWZ0ZXIgbmV3IGh0bWwgaXMgbG9hZGVkXG4gICAgLy8gYW5kIG9sZCBjb250ZW50IGlzIGFuaW1hdGVkIG91dDpcbiAgICBwcml2YXRlIHJlbmRlciA9ICgpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5vZmYoKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UuZGVzdHJveSgpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnNjcm9sbC5kZXN0cm95KCk7XG5cbiAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XG5cbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLnJlbmRlcigpO1xuICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUoJCgnbWV0YVtwcm9wZXJ0eT1cIm9nOnRpdGxlXCJdJykuYXR0cignY29udGVudCcpKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgZGV0ZWN0SG9tZVBhZ2UoKTogdm9pZCB7XG4gICAgICAgICRwYWdlSGVhZGVyID8gJGJvZHkuYWRkQ2xhc3MoJ2lzLWhvbWUtcGFnZScpIDogbnVsbDtcbiAgICB9XG5cblxuICAgIC8vIHdoZW4gY3VycmVudCBwYWdlIGlzIGxvYWRlZDpcbiAgICBwcml2YXRlIG9uUGFnZUxvYWRlZCA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLW5vdC1yZWFkeScpO1xuICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xuICAgICAgICB0aGlzLmxvYWRlci5oaWRlKCk7XG4gICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJGJvZHksIDAsIDApO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVJbigpO1xuICAgICAgICAkcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XG4gICAgICAgIHRoaXMuZGV0ZWN0SG9tZVBhZ2UoKTtcbiAgICAgICAgUHVzaFN0YXRlcy5zZXROYXZiYXJWaXNpYmlsaXR5KCk7XG4gICAgICAgIC8vIHRoaXMuY29va2llcy50cnlUb1Nob3coKTtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvUGF0aCh0cnVlKTtcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xuICAgICAgICB0aGlzLnNjcm9sbC5zdGFydCgpO1xuICAgICAgICAkKCdhcnRpY2xlJykucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWxvYWRlZCcpO1xuICAgIH1cblxuXG5cbiAgICAvLyBydW4gbmV3IFBhZ2Ugb2JqZWN0XG4gICAgLy8gKGZvdW5kIGJ5IGBkYXRhLXBhZ2VgIGF0dHJpYnV0ZSlcbiAgICAvLyBiaW5kIGl0IGFuZCBzdG9yZSBhcyBjdXJyZW50UGFnZTpcbiAgICBwcml2YXRlIHNldEN1cnJlbnRQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBsZXQgJHBhZ2VFbDogSlF1ZXJ5ID0gJCgnW2RhdGEtcGFnZV0nKSxcbiAgICAgICAgICAgIHBhZ2VOYW1lOiBzdHJpbmcgPSAkcGFnZUVsLmRhdGEoJ3BhZ2UnKSB8fCAnUGFnZScsXG4gICAgICAgICAgICBwYWdlT3B0aW9uczogT2JqZWN0ID0gJHBhZ2VFbC5kYXRhKCdvcHRpb25zJyk7XG5cbiAgICAgICAgY29uc29sZS5sb2coJHBhZ2VFbCwgcGFnZU5hbWUpO1xuXG4gICAgICAgIC8vIHBhZ2Ugbm90IGZvdW5kOlxuICAgICAgICBpZiAocGFnZU5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGluIFBhZ2VzIScsIHBhZ2VOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhZ2VOYW1lID0gJ1BhZ2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbW9yZSB0aGFuIG9uZSBkYXRhLXBhZ2U6XG4gICAgICAgIGlmICgkcGFnZUVsLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignT25seSBvbmUgW2RhdGEtcGFnZV0gZWxlbWVudCwgcGxlYXNlIScpO1xuXG4gICAgICAgIC8vIHBhZ2Ugbm90IGRlZmluZWQgaW4gaHRtbDpcbiAgICAgICAgfSBlbHNlIGlmICgkcGFnZUVsLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgJHBhZ2VFbCA9ICQoJCgnI21haW4nKS5maW5kKCdhcnRpY2xlJylbMF0gfHwgJCgnI21haW4nKS5jaGlsZHJlbigpLmZpcnN0KClbMF0pO1xuICAgICAgICB9XG5cblxuXG4gICAgICAgIC8vIGNyZWF0ZSBQYWdlIG9iamVjdDpcbiAgICAgICAgbGV0IHBhZ2U6IFBhZ2UgPSBuZXcgcGFnZXNbcGFnZU5hbWVdKCRwYWdlRWwsIHBhZ2VPcHRpb25zKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IHBhZ2U7XG5cbiAgICAgICAgLy8gYmluZCBldmVudHM6XG4gICAgICAgIEFQSS5iaW5kKCk7XG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5QUk9HUkVTUywgdGhpcy5vblBhZ2VQcm9ncmVzcyk7XG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5DSEFOR0UsIHRoaXMub25QYWdlQXBwZW5kKTtcblxuICAgICAgICB0aGlzLm9uUmVzaXplKCk7XG5cbiAgICAgICAgcmV0dXJuIHBhZ2UucHJlbG9hZCgpO1xuICAgIH1cbn1cblxuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG4gICAgc2l0ZSA9IG5ldyBTaXRlKCk7XG4gICAgc2l0ZS5pbml0KCk7XG59KTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9zdGF0cy5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9tb2Rlcm5penIuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4vU2l0ZSc7XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVUlEKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuICcnICsgKG5ldyBEYXRlKCkpLmdldFRpbWUoKSArIE1hdGguZmxvb3IoKDEgKyBNYXRoLnJhbmRvbSgpKSAqIDB4MTAwMDApLnRvU3RyaW5nKDE2KS5zdWJzdHJpbmcoMSk7XG59XG5cblxuZXhwb3J0IGNvbnN0IGtleXMgPSB7XG4gICAgZW50ZXI6IDEzLFxuICAgIGVzYzogMjcsXG4gICAgc3BhY2U6IDMyLFxuICAgIGxlZnQ6IDM3LFxuICAgIHVwOiAzOCxcbiAgICByaWdodDogMzksXG4gICAgZG93bjogNDAsXG4gICAgcGFnZVVwOiAzMyxcbiAgICBwYWdlRG93bjogMzQsXG4gICAgZW5kOiAzNSxcbiAgICBob21lOiAzNixcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtcyh1cmwpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSB7XG4gICAgdmFyIHBhcmFtcyA9IHt9O1xuICAgIHZhciBwYXJzZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7XG4gICAgcGFyc2VyLmhyZWYgPSB1cmw7XG4gICAgdmFyIHF1ZXJ5ID0gcGFyc2VyLnNlYXJjaC5zdWJzdHJpbmcoMSk7XG4gICAgdmFyIHZhcnMgPSBxdWVyeS5zcGxpdCgnJicpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcbiAgICAgICAgcGFyYW1zW3BhaXJbMF1dID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gcGFyYW1zO1xufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdEF1dG9wbGF5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIE1vZGVybml6ci52aWRlb2F1dG9wbGF5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgTW9kZXJuaXpyLm9uKCd2aWRlb2F1dG9wbGF5JywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb1RpbWUoc2VjOiBudW1iZXIpOiBzdHJpbmcge1xuXG4gICAgY29uc3QgdG90YWxTZWMgPSBwYXJzZUludCgnJyArIHNlYywgMTApO1xuICAgIGNvbnN0IGhvdXJzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDM2MDAsIDEwKSAlIDI0O1xuICAgIGNvbnN0IG1pbnV0ZXMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gNjAsIDEwKSAlIDYwO1xuICAgIGNvbnN0IHNlY29uZHMgPSB0b3RhbFNlYyAlIDYwO1xuICAgIGNvbnN0IGhyc0Rpc3BsYXkgPSAoaG91cnMgPCAxMCA/ICcwJyArIGhvdXJzIDogaG91cnMpICsgJzonO1xuXG4gICAgcmV0dXJuIChob3VycyA+IDAgPyBocnNEaXNwbGF5IDogJycpICsgKG1pbnV0ZXMgPCAxMCA/ICcwJyArIG1pbnV0ZXMgOiBtaW51dGVzKSArICc6JyArIChzZWNvbmRzIDwgMTAgPyAnMCcgKyBzZWNvbmRzIDogc2Vjb25kcyk7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gc3RhdHMoKTogU3RhdHMge1xuXG4gICAgY29uc3Qgc3RhdHMgPSBuZXcgU3RhdHMoKTtcblxuICAgIHN0YXRzLnNob3dQYW5lbCggMCApOyAvLyAwOiBmcHMsIDE6IG1zLCAyOiBtYiwgMys6IGN1c3RvbVxuICAgICQoc3RhdHMuZG9tKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6ICdub25lJywgJ3RvcCc6IDExMH0pO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbSApO1xuXG4gICAgZnVuY3Rpb24gYW5pbWF0ZSgpOiB2b2lkIHtcbiAgICAgICAgc3RhdHMuYmVnaW4oKTtcbiAgICAgICAgLy8gbW9uaXRvcmVkIGNvZGUgZ29lcyBoZXJlXG4gICAgICAgIHN0YXRzLmVuZCgpO1xuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcbiAgICB9XG5cbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcblxuICAgIHJldHVybiBzdGF0cztcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB0aW1lRm9ybWF0KHRpbWU6IG51bWJlcik6IHN0cmluZyB7XG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCkudG9TdHJpbmcoKTtcbiAgICBtaW51dGVzID0gKHBhcnNlSW50KG1pbnV0ZXMsIDEwKSA+PSAxMCkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcbiAgICBsZXQgc2Vjb25kcyA9IE1hdGguZmxvb3IodGltZSAlIDYwKS50b1N0cmluZygpO1xuICAgIHNlY29uZHMgPSAocGFyc2VJbnQoc2Vjb25kcywgMTApID49IDEwKSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xuXG4gICAgcmV0dXJuIG1pbnV0ZXMudG9TdHJpbmcoKSArICc6JyArIHNlY29uZHMudG9TdHJpbmcoKTtcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJbWFnZVNvdXJjZXMoKTogdm9pZCB7XG4gICAgaWYgKGJyb3dzZXIuaWUpIHtcbiAgICAgICAgJCgnW2RhdGEtaWVzcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLWllc3JjJykpO1xuICAgICAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1pZXNyYycpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkKCdbZGF0YS1zcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyYycpO1xuICAgIH0pO1xuXG4gICAgJCgnW2RhdGEtc3Jjc2V0XScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpKTtcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcbiAgICB9KTtcbn1cblxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKGltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWRbXT4ge1xuLy8gICAgIHJldHVybiBQcm9taXNlLmFsbChpbWFnZXMubWFwKChpbWFnZSk6IFByb21pc2U8dm9pZD4gPT4ge1xuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuLy8gICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25sb2FkID0gKCkgPT4gcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25hYm9ydCA9ICgpID0+IHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgIGltZy5zcmMgPSBpbWFnZTtcbi8vICAgICAgICAgICAgIGlmIChpbWcuY29tcGxldGUgJiYgJChpbWcpLmhlaWdodCgpID4gMCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxuLy8gICAgICAgICB9KTtcbi8vICAgICB9KSk7XG4vLyB9XG5cblxuXG4vLyBleHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXM6IEpRdWVyeSk6IFByb21pc2U8dm9pZFtdPiB7XG4vLyAgICAgbGV0IGlzQmFzZTY0OiBib29sZWFuO1xuLy8gICAgIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSAkaW1hZ2VzLnRvQXJyYXkoKVxuLy8gICAgICAgICAubWFwKChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xuLy8gICAgICAgICAgICAgbGV0IGltYWdlU291cmNlID0gaW1nLmN1cnJlbnRTcmMgfHwgaW1nLnNyYztcbi8vICAgICAgICAgICAgIGlmIChpbWFnZVNvdXJjZS5pbmRleE9mKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsJykgPj0gMCkgeyBpc0Jhc2U2NCA9IHRydWU7IH1cbi8vICAgICAgICAgICAgIHJldHVybiBpbWFnZVNvdXJjZTtcbi8vICAgICAgICAgfSk7XG5cbi8vICAgICAvLyBjb25zb2xlLmxvZyhpbWFnZXMpO1xuXG4vLyAgICAgaWYgKCFpc0Jhc2U2NCkge1xuLy8gICAgICAgICByZXR1cm4gcHJlbG9hZEltYWdlcyhpbWFnZXMpO1xuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbi8vICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuLy8gICAgICAgICAgICAgICAgIGNoZWNrQW5kUHJlbG9hZEltYWdlcygkaW1hZ2VzKS50aGVuKCgpID0+IHtcbi8vICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgICAgIH0pO1xuLy8gICAgICAgICAgICAgfSwgMjAwKTtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgfVxuLy8gfVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlKGEpOiBBcnJheTxhbnk+IHtcbiAgICBsZXQgaiwgeCwgaTtcbiAgICBmb3IgKGkgPSBhLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICAgICAgaiA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChpICsgMSkpO1xuICAgICAgICB4ID0gYVtpXTtcbiAgICAgICAgYVtpXSA9IGFbal07XG4gICAgICAgIGFbal0gPSB4O1xuICAgIH1cbiAgICByZXR1cm4gYTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2V0Um9vdFZhcnMoKTogdm9pZCB7XG4gICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gYnJlYWtwb2ludC5kZXNrdG9wID8gJCgnI25hdmJhcicpLmhlaWdodCgpIDogMDtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXBwLWhlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtIGhlYWRlckhlaWdodH1weGApO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtMjUnLCBgJHskKCcuY29sLXBhdHRlcm4tMjUnKS53aWR0aCgpfXB4YCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC02NicsIGAkeyQoJy5jb2wtNjYnKS53aWR0aCgpfXB4YCk7XG4gICAgbGV0IG1hcmcgPSAhYnJlYWtwb2ludC5kZXNrdG9wID8gNTAgOiAxMjA7XG4gICAgJCgnLmFzaWRlJykuY3NzKCdoZWlnaHQnLCAkd2luZG93LmhlaWdodCgpICsgbWFyZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcbiAgICAkKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgd2luZG93LnNjcm9sbFRvKDAsIHNUKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xuICAgIGxldCBwb3NpdGlvbiA9IGJyb3dzZXIuaWUgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJztcbiAgICBsZXQgdG9wID0gYnJvd3Nlci5pZSA/ICcnIDogLXNUICsgJ3B4JztcbiAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XG4gICAgJCgnYm9keScpLmNzcyh7XG4gICAgICAgIC8vICdwb3NpdGlvbic6IHBvc2l0aW9uLFxuICAgICAgICAvLyAndG9wJzogdG9wLFxuICAgICAgICAvLyAnYm90dG9tJzogJzAnLFxuICAgICAgICAnb3ZlcmZsb3cnOiAnaGlkZGVuJyxcbiAgICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RvcCcsXG4gICAgICAgICd3aWR0aCc6ICcxMDAlJyxcbiAgICAgICAgJ3RvdWNoLWFjdGlvbic6ICdub25lJyxcbiAgICB9KTtcblxufVxuXG5cbmV4cG9ydCBjb25zdCB0cmFuc2xhdGlvbnMgPSB7XG4gICAgJ2ludmFsaWQtZW1haWwnOiB7XG4gICAgICAgICdlbic6ICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MgZm9ybWF0JyxcbiAgICAgICAgJ3BsJzogJ05pZXBvcHJhd255IGZvcm1hdCBhZHJlc3UgZS1tYWlsJyxcbiAgICB9LFxuICAgICdyZXF1aXJlZC1maWVsZCc6IHtcbiAgICAgICAgJ2VuJzogJ1JlcXVpcmVkIGZpZWxkJyxcbiAgICAgICAgJ3BsJzogJ1BvbGUgb2Jvd2nEhXprb3dlJyxcbiAgICB9LFxuICAgICdpbnZhbGlkLXppcCc6IHtcbiAgICAgICAgJ2VuJzogJ0VudGVyIHppcC1jb2RlIGluIGZpdmUgZGlnaXRzIGZvcm1hdCcsXG4gICAgICAgICdwbCc6ICdXcGlzeiBrb2QgcG9jenRvd3kgdyBmb3JtYWNpZSBYWC1YWFgnLFxuICAgIH0sXG59O1xuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRib2R5LCAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgUHVzaFN0YXRlcyB9IGZyb20gJy4uL1B1c2hTdGF0ZXMnO1xuXG5cbmV4cG9ydCBjbGFzcyBBc2lkZSBleHRlbmRzIENvbXBvbmVudCB7XG4gICAgXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogQXNpZGU7XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG5cbiAgICBwcml2YXRlICRoYW1idXJnZXJMaW5lOiBKUXVlcnk7XG4gICAgXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZUFuaW1hdGlvbigpOiB2b2lkIHtcblxuICAgICAgICBpZiAoQXNpZGUuaW5zdGFuY2UuaXNPcGVuKSB7XG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRpdGVtLCAwLjI1LCB7IGR1cmF0aW9uOiAwLjI1LCBzdGFnZ2VyOiAtMC4xLCBvcGFjaXR5OiAwLCB4OiAyMCwgZGVsYXk6IDAuMn0pXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRoYW1idXJnZXJMaW5lLCAwLjUsIHsgZHVyYXRpb246IDAuNSwgc2NhbGVZOiAwfSk7XG4gICAgICAgICAgICBBc2lkZS5pbnN0YW5jZS5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGl0ZW0sIDAuNSwgeyBkdXJhdGlvbjogMC41LCBzdGFnZ2VyOiAwLjA1LCBvcGFjaXR5OiAxLCB4OiAwLCBkZWxheTogMC4yfSlcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGhhbWJ1cmdlckxpbmUsIDAuNSwgeyBkdXJhdGlvbjogMC41LCBzY2FsZVk6IDEsIGRlbGF5OiAwLjV9KTtcbiAgICAgICAgICAgIEFzaWRlLmluc3RhbmNlLmlzT3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xuICAgICAgICB0aGlzLiRoYW1idXJnZXJMaW5lID0gJCgnW2RhdGEtaGFtYnVyZ2VyXScpLmZpbmQoJ2knKTtcblxuICAgICAgICBBc2lkZS5pbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIFxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kaXRlbS5vZmYoJy5tZW51Jykub24oJ2NsaWNrLm1lbnUnLCB0aGlzLmhpZGVNZW51KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhpZGVNZW51ID0gKGUpID0+IHtcbiAgICAgICAgUHVzaFN0YXRlcy5hc2lkZVRvZ2dsZShlKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XG5cbmludGVyZmFjZSBJQ2hhcnRTZXR0aW5ncyB7XG4gICAgaWQ6IG51bWJlcjtcbiAgICB4UGVyY2VudDogbnVtYmVyO1xuICAgIHlQb2ludHM6IEFycmF5PG51bWJlcj47XG4gICAgY29sb3I6IHN0cmluZztcbiAgICB5UHg6IEFycmF5PG51bWJlcj47XG4gICAgZmlsbD86IGJvb2xlYW47XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGxhYmVsWT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENoYXJ0IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcblxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XG4gICAgICAgIHRvcDogNSxcbiAgICAgICAgbGVmdDogMjUsXG4gICAgICAgIHJpZ2h0OiAxMTAsXG4gICAgICAgIGJvdHRvbTogNDlcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBncmFwaDogYW55ID0ge1xuICAgICAgICB0b3A6IDAsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgfTtcblxuICAgIHByaXZhdGUgY29sb3JzOiBhbnkgPSB7XG4gICAgICAgIGdyYXk6ICdyZ2JhKDk3LDk3LDk3LDAuNSknLFxuICAgICAgICBvcmFuZ2U6ICcjZmM4YzU5JyxcbiAgICAgICAgbWludDogJyM0ZmRiYzUnLFxuICAgICAgICBibHVlOiAnIzU4NzdjYycsXG4gICAgICAgIHBpbms6ICcjQjYwRTYzJyxcbiAgICAgICAgd2hpdGU6ICcjZmZmJyxcbiAgICAgICAgYmVpZ2U6ICcjZmRkNDllJyxcbiAgICAgICAgY2lubmFiYXI6ICcjZTc1MDQwJyxcbiAgICAgICAgc2VhOiAnIzI2YmJlMycsXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBncmFwaHNEYXRhOiBBcnJheTxJQ2hhcnRTZXR0aW5ncz4gPSBbXTtcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kd3JhcHBlciA9IHRoaXMudmlldy5maW5kKCcuanMtd3JhcHBlcicpO1xuICAgICAgICB0aGlzLiR0YWIgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY2hhcnQtdGFiXScpO1xuICAgICAgICB0aGlzLmNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD50aGlzLnZpZXcuZmluZCgnY2FudmFzJylbMF07XG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcblxuICAgICAgICB0aGlzLmNyZWF0ZURhdGFPYmplY3QoKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcblxuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuXG4gICAgICAgIGNvbnN0IHBhcmFtc0NoYXJ0cyA9IFV0aWxzLmdldFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS5jaGFydHM7XG4gICAgICAgIGNvbnN0IGluaXRDaGFydHMgPSBwYXJhbXNDaGFydHMgPyBwYXJhbXNDaGFydHMuc3BsaXQoJywnKS5tYXAoKGkpID0+IHBhcnNlSW50KGksIDEwKSkgOiBbMCwgMywgNF07XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoaSwgaW5pdENoYXJ0cy5pbmRleE9mKGkpID49IDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy4kd3JhcHBlci53aWR0aCgpO1xuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLiR3cmFwcGVyLmhlaWdodCgpO1xuXG4gICAgICAgIHRoaXMuZ3JhcGggPSB7XG4gICAgICAgICAgICB0b3A6IHRoaXMubWFyZ2luLnRvcCxcbiAgICAgICAgICAgIGxlZnQ6IHRoaXMubWFyZ2luLmxlZnQsXG4gICAgICAgICAgICByaWdodDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCxcbiAgICAgICAgICAgIGJvdHRvbTogdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4uYm90dG9tLFxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi50b3AgLSB0aGlzLm1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5sZWZ0IC0gdGhpcy5tYXJnaW4ucmlnaHQsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcbiAgICAgICAgdGhpcy5kcmF3KCk7XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIGNyZWF0ZURhdGFPYmplY3QoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YSA9IHRoaXMuJHRhYi50b0FycmF5KCkubWFwKChlbCwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XG4gICAgICAgICAgICByZXR1cm4gPElDaGFydFNldHRpbmdzPntcbiAgICAgICAgICAgICAgICBpZDogaSxcbiAgICAgICAgICAgICAgICB4UGVyY2VudDogMCxcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiAkZWwuZGF0YSgncG9pbnRzJyksXG4gICAgICAgICAgICAgICAgLy8geVBvaW50czogdGhpcy5nZXRSYW5kb21Qb2ludHMoTWF0aC5yYW5kb20oKSAqIDEwICsgNywgTWF0aC5yYW5kb20oKSAqIDMwICsgMTgsIDYwLCAwLjMpLFxuICAgICAgICAgICAgICAgIHlQb2ludHM6IHRoaXMuZ2V0UG9pbnRzKGkpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9yc1skZWwuZGF0YSgnY29sb3InKV0sXG4gICAgICAgICAgICAgICAgZmlsbDogaSA9PT0gMCA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBzaG93bjogZmFsc2UsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkodGhpcy5ncmFwaHNEYXRhLm1hcCgoZGF0YSkgPT4gZGF0YS55UG9pbnRzKSkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGdldFBvaW50cyhpKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gW1sxNCwgMTAsIDEyLCAxMywgMTQsIDkgLCAxMiwgMTcsIDE2LCAxMSwgMTMsIDE5LCAxMCwgOSwgOCwgMTUsIDE3LCAxNSwgMjIsIDI1LCAyMSwgMjAsIDE5LCAyMSwgMjAsIDE5LCAyNCwgMjgsIDIxLCAyNywgMTgsIDIzLCAzMywgMzEsIDE4LCAyNSwgMzYsIDI0LCAzMSwgMzMsIDIxLCAzNiwgMzQsIDMwLCAyNiwgMjQsIDM1LCAyNywgMzAsIDE4LCAyMCwgMzAsIDI2LCAyOCwgMzMsIDI1LCAzOSwgMjgsIDE3LCAzNV0sIFsxLCAyLCA4LCA3LCA2LCAzLCA4LCA1LCA1LCA0LCA4LCA3LCA3LCAxMSwgMTAsIDgsIDcsIDksIDgsIDYsIDgsIDEyLCA4LCAxNCwgMTEsIDgsIDgsIDExLCA3LCAxMywgMTMsIDE2LCAyMCwgMTAsIDEwLCAxMywgMTQsIDIwLCAxNiwgMTEsIDE3LCAxNiwgMTgsIDIxLCA4LCAyMCwgMTUsIDE1LCAxNiwgMTUsIDE5LCAyMCwgMTEsIDIwLCAyMCwgMTIsIDE3LCAyMCwgMjMsIDE2XSwgWzEzLCAxMSwgNiwgOSwgOSwgOCwgOSwgMTEsIDcsIDE0LCAxMiwgOCwgMTAsIDE2LCA5LCAyMCwgMTksIDEyLCAxMiwgMTUsIDE4LCAxNSwgMTQsIDIyLCAxOSwgMjAsIDIwLCAxNywgMjQsIDIzLCAyNywgMjAsIDIwLCAyMSwgMjEsIDI1LCAyMCwgMjcsIDIyLCAyNCwgMjQsIDI2LCAyMywgMjUsIDI2LCAyMSwgMjksIDI2LCAyNywgMjYsIDI1LCAyMCwgMTUsIDI1LCAyMiwgMjYsIDIwLCAyMywgMzMsIDI4XSwgWzIsIDUsIDEwLCA5LCAxOCwgOSwgMTAsIDEyLCAyMCwgMTksIDEzLCA5LCAxNSwgMTEsIDIxLCAxOSwgMjMsIDIzLCAyNiwgMjMsIDIzLCAyMywgMjUsIDI1LCAyNiwgMjYsIDMwLCAyMiwgMjUsIDMzLCAzOCwgMTYsIDMyLCAyNywgMjcsIDM1LCAyOCwgMjgsIDM1LCAzNCwgMzYsIDI1LCAyNywgMjUsIDQ1LCAzNywgMzEsIDM2LCAzNywgMzYsIDI4LCAzOCwgNDIsIDQyLCA0NCwgNDMsIDQxLCAzNCwgMzEsIDM2XSwgWzcsIDEwLCAxMCwgNiwgNSwgMTMsIDE3LCAxMywgMTAsIDExLCAxNCwgMTcsIDE2LCAxOSwgMjIsIDIwLCAyNSwgMTcsIDI0LCAxMywgMjUsIDIwLCAyNiwgMjQsIDI2LCAxNSwgMjMsIDI0LCAzMCwgMzAsIDI5LCAzMSwgMzEsIDIxLCAzMiwgMzEsIDI1LCAzOCwgMzUsIDI4LCA0MCwgMzIsIDM3LCAzMSwgMzYsIDQwLCAzNSwgMzcsIDIzLCAzNiwgMzcsIDQwLCA0MCwgNDEsIDE3LCAyMywgNDAsIDM0LCA0MCwgNDBdLCBbNiwgNiwgMiwgMTIsIDEwLCAxMywgMTIsIDQsIDEyLCAxMSwgMTMsIDE2LCAxNCwgMTQsIDE0LCAxNCwgMTQsIDE3LCAxNSwgMTYsIDE2LCAxMiwgMTgsIDE1LCAyMiwgMTYsIDE5LCAxOCwgMjEsIDIxLCAyNSwgMTUsIDI2LCAxNywgMjcsIDI3LCAyMSwgMTIsIDI0LCAxNSwgMTksIDI5LCAxOCwgMjQsIDI1LCAxOCwgMjgsIDMyLCAyNSwgMjgsIDI3LCAyOCwgMzEsIDI1LCAyNywgMzUsIDI0LCAyNywgMTUsIDI4XSwgWzQsIDUsIDEwLCAxMywgMTUsIDE3LCA3LCAxNywgMTIsIDEyLCAxNywgMTIsIDEyLCAxMSwgMjIsIDIxLCAxOSwgMjAsIDIxLCAyNiwgMjIsIDE5LCAyMSwgMjQsIDI1LCAxMiwgMjgsIDI3LCAyOCwgMjcsIDMxLCAzMSwgMTUsIDMwLCAyNiwgMTksIDI5LCAyOSwgMzMsIDMzLCAxNywgMzAsIDMwLCAzMywgMjcsIDM0LCAzMywgMTcsIDM5LCAyMSwgMzUsIDMzLCAzMywgMjEsIDM1LCAzMCwgMzksIDMxLCAzNSwgMjldXVtpXTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBnZXRSYW5kb21Qb2ludHMobWluOiBudW1iZXIsIG1heDogbnVtYmVyLCBhbW91bnQ6IG51bWJlciwgY2FzdDogbnVtYmVyKTogbnVtYmVyW10ge1xuICAgICAgICByZXR1cm4gQXJyYXkuYXBwbHkobnVsbCwgeyBsZW5ndGg6IGFtb3VudCB9KVxuICAgICAgICAgICAgLm1hcCgocCwgaSwgYSkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJhbmdlID0gbWF4IC0gbWluO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmMgPSBpIC8gYS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocGVyYyAqIE1hdGguUEkgLyAyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBybmQgPSAwLjQgKiAoTWF0aC5yYW5kb20oKSA8IGNhc3QgPyAtMC41ICsgTWF0aC5yYW5kb20oKSA6IDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1pblJuZCA9IChNYXRoLnJhbmRvbSgpICogKHBlcmMgPCAwLjUgPyAwLjkgOiAxKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKG1pbiAqIG1pblJuZCkgKyAoTWF0aC5yYW5kb20oKSAqIHJhbmdlICogMC4yKSArIChzaW4gKiByYW5nZSAqICgwLjYgKyBybmQpKSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKChkYXRhKSA9PiB7XG4gICAgICAgICAgICBkYXRhLnlQeCA9IHRoaXMuY2FsY1lQeChkYXRhLnlQb2ludHMpO1xuICAgICAgICAgICAgaWYgKCFkYXRhLmxhYmVsWSkge1xuICAgICAgICAgICAgICAgIGRhdGEubGFiZWxZID0gZGF0YS55UHhbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vbkNsaWNrVGFiKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvbkNsaWNrVGFiID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy50b2dnbGVDaGFydCgkKGUuY3VycmVudFRhcmdldCkuaW5kZXgoKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgdG9nZ2xlQ2hhcnQoaW5kZXg6IG51bWJlciwgc2hvdz86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZ3JhcGhzRGF0YVtpbmRleF07XG4gICAgICAgIGlmICh0eXBlb2Ygc2hvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNob3cgPSAhZGF0YS5zaG93bjtcbiAgICAgICAgfVxuXG4gICAgICAgIGdzYXAudG8oZGF0YSwge1xuICAgICAgICAgICAgZHVyYXRpb246IDMuMixcbiAgICAgICAgICAgIHhQZXJjZW50OiBzaG93ID8gMSA6IDAsXG4gICAgICAgICAgICBsYWJlbFk6IGRhdGEueVB4W3Nob3cgPyBkYXRhLnlQeC5sZW5ndGggLSAxIDogMF0sXG4gICAgICAgICAgICByb3VuZFByb3BzOiAnbGFiZWxZJyxcbiAgICAgICAgICAgIGVhc2U6ICdwb3dlcjMuaW5PdXQnLFxuICAgICAgICAgICAgb25VcGRhdGU6IHRoaXMuZHJhdyxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy4kdGFiLmVxKGluZGV4KS50b2dnbGVDbGFzcygnaXMtb24tY2hhcnQnLCBzaG93KTtcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhW2luZGV4XS5zaG93biA9IHNob3c7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZHJhdyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuICAgICAgICB0aGlzLmRyYXdCZygpO1xuICAgICAgICB0aGlzLmdyYXBoc0RhdGEuZm9yRWFjaCgoZ3JhcGhEYXRhKSA9PiB0aGlzLmRyYXdHcmFwaChncmFwaERhdGEpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBkcmF3QmcoKTogdm9pZCB7XG5cbiAgICAgICAgLy8gZHJhdyBYIGF4aXNcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG5cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcbiAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20pO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9ycy5ncmF5O1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsIHRoaXMubWFyZ2luLnRvcCk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuXG4gICAgICAgIGNvbnN0IGhlbHBlcnNMaW5lID0gODtcbiAgICAgICAgY29uc3QgdGV4dFRyYW5zZm9ybSA9IDU7XG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xuICAgICAgICBsZXQgdmFsO1xuICAgICAgICBjb25zdCB5ZWFycyA9IFsyMDE1LCAyMDE2LCAyMDE3LCAyMDE4LCAyMDE5LCAyMDIwLCAyMDIxXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBoZWxwZXJzTGluZTsgaSsrKSB7XG4gICAgICAgICAgICB2YWwgPSA1MCAtIHN0ZXAgKiBpO1xuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMuYmx1ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgdmFsICsgJycsIDAsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3AgKyB0ZXh0VHJhbnNmb3JtKTtcbiAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLm1hcmdpbi5sZWZ0LCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHllYXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgeWVhcnNbal0gKyAnJywgdGhpcy5ncmFwaC53aWR0aCAvIHllYXJzLmxlbmd0aCAqIGogKyB0aGlzLm1hcmdpbi5sZWZ0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0ZXh0VHJhbnNmb3JtICogMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGRyYXdHcmFwaCA9IChkYXRhOiBJQ2hhcnRTZXR0aW5ncyk6IHZvaWQgPT4ge1xuICAgICAgICBsZXQgbGFzdFZhbDogbnVtYmVyO1xuICAgICAgICBsZXQgbGFzdFk6IG51bWJlcjtcblxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY29uc3QgY29sV2lkdGggPSB0aGlzLmdyYXBoLndpZHRoIC8gKGRhdGEueVB4Lmxlbmd0aCAtIDEpO1xuICAgICAgICBjb25zdCBtYXhYID0gKGRhdGEueFBlcmNlbnQgKiBjb2xXaWR0aCAqIGRhdGEueVB4Lmxlbmd0aCkgKyB0aGlzLmdyYXBoLmxlZnQ7XG5cbiAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHggPSBjb2xXaWR0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XG4gICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgIGxhc3RZID0geTtcbiAgICAgICAgICAgICAgICBsYXN0VmFsID0gZGF0YS55UG9pbnRzW2ldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IDwgbWF4WCArIGNvbFdpZHRoICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0SW50ZXJQb2ludHNZKG1heFgsIFt4IC0gY29sV2lkdGgsIGFbaSAtIDFdXSwgW3gsIHldKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgLy8gZmlsbDpcbiAgICAgICAgaWYgKGRhdGEuZmlsbCkge1xuICAgICAgICAgICAgbGV0IGxhc3RYID0gdGhpcy5tYXJnaW4ubGVmdDtcblxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gZGF0YS5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMC40O1xuXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIGRhdGEueVB4LmZvckVhY2goICh5LCBpLCBhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IGNvbFdpZHRoICogaSArIHRoaXMuZ3JhcGgubGVmdDtcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFggPSB4O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeCA8IG1heFggKyBjb2xXaWR0aCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pKTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFggPSBtYXhYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKGxhc3RYLCB0aGlzLmdyYXBoLmJvdHRvbSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5sZWZ0LCB0aGlzLmdyYXBoLmJvdHRvbSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxhYmVsOlxuICAgICAgICBpZiAoZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgIC8vIGxpbmU6XG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5yaWdodCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyNCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgICAgIC8vIHBlbnRhZ29uOlxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyMCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyA0MCwgZGF0YS5sYWJlbFkgLSAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgLSAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgKyAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDQwLCBkYXRhLmxhYmVsWSArIDEyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuXG4gICAgICAgICAgICAvLyB0ZXh0OlxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2cobGFzdFZhbCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxNHB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KGxhc3RWYWwgKyAnJywgdGhpcy5ncmFwaC5yaWdodCArIDQ0LCBkYXRhLmxhYmVsWSArIDQgKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8vLyBIRUxQRVJTXG5cbiAgICBwcml2YXRlIGxhcmdlc3RZVmFsKGRhdGE6IEFycmF5PG51bWJlcj4pOiBudW1iZXIge1xuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IGRhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGFyZ2VzdDtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjYWxjWVB4KGRhdGEpOiBBcnJheTxudW1iZXI+IHtcbiAgICAgICAgY29uc3QgbGFyZ2VzdCA9IHRoaXMubGFyZ2VzdFlWYWwoZGF0YSk7XG4gICAgICAgIGxldCBhcnIgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBpdGVtID0gTWF0aC5yb3VuZCgodGhpcy5ncmFwaC5oZWlnaHQgLSBkYXRhW2ldIC8gbGFyZ2VzdCAqIHRoaXMuZ3JhcGguaGVpZ2h0KSArIHRoaXMuZ3JhcGgudG9wKTtcbiAgICAgICAgICAgIGFyci5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBnZXRJbnRlclBvaW50c1koeDogbnVtYmVyLCBwb2ludEE6IG51bWJlcltdLCBwb2ludEI6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgW3gxLCB5MV0gPSBwb2ludEE7XG4gICAgICAgIGNvbnN0IFt4MiwgeTJdID0gcG9pbnRCO1xuICAgICAgICByZXR1cm4gKHkyIC0geTEpICogKHggLSB4MSkgLyAoeDIgLSB4MSkgKyB5MTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RXZlbnRzIHtcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENIQU5HRTogc3RyaW5nID0gJ2NoYW5nZSc7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBIYW5kbGVyIHtcblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgaWYgKCF2aWV3WzBdKSB7IGNvbnNvbGUud2FybignY29tcG9uZW50IGJ1aWx0IHdpdGhvdXQgdmlldycpOyB9XG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgdGhpcyk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBwcmVsb2FkSW1hZ2VzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBhbmltYXRlSW4oaW5kZXg/OiBudW1iZXIsIGRlbGF5PzogbnVtYmVyKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgd2FudCB0byBhbmltYXRlIGNvbXBvbmVudCxcbiAgICAgICAgLy8ganVzdCByZXR1cm4gZW1wdHkgUHJvbWlzZTpcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuICAgICAgICAvLyBpZiB5b3UgbmVlZCBhbmltYXRpb246XG4gICAgICAgIC8vIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vICAgICBnc2FwLnRvKHRoaXMudmlldywge1xuICAgICAgICAvLyAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAvLyAgICAgICAgIH0sXG4gICAgICAgIC8vICAgICAgICAgZHVyYXRpb246IDAuMyxcbiAgICAgICAgLy8gICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHsgfVxuXG5cblxuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7IH07XG5cblxuXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgbnVsbCk7XG4gICAgICAgIHRoaXMudmlldy5vZmYoKTtcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5cbmV4cG9ydCBjbGFzcyBEYXNoYm9hcmQgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSAkdG9nZ2xlOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkYm9keTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNUb2dnbGVkOiBib29sZWFuO1xuICAgIHByaXZhdGUgYm9keUhlaWdodDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRvZ2dsZSA9IHRoaXMudmlldy5maW5kKCcuanMtYnV0dG9uLXRvZ2dsZScpO1xuICAgICAgICB0aGlzLiRib2R5ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1kYXNoYm9hcmQtYm9keScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB0aGlzLmluaXRpYWxTdGF0ZSgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuXG4gICAgfTtcblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdG9nZ2xlLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZVBhbmVsKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZVBhbmVsID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVG9nZ2xlZCkge1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJ2F1dG8nLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLiRib2R5LmFkZENsYXNzKCdpcy10b2dnbGVkJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLXRvZ2dsZWQnKTtcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kYm9keSwgeyBkdXJhdGlvbjogMC41LCBoZWlnaHQ6ICcwJywgZWFzZTogJ3Bvd2VyMi5pbk91dCcsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBpbml0aWFsU3RhdGUoKTogdm9pZCB7XG4gICAgICAgIGdzYXAuc2V0KHRoaXMuJGJvZHksIHsgaGVpZ2h0OiAnMCd9KTtcbiAgICB9XG4gICAgXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL0ZpbHRlcnMnO1xuXG5leHBvcnQgY2xhc3MgRHJvcGRvd24gZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RdJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmFsdWVdJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMudmlldy5hdHRyKCdkYXRhLXNlbGVjdGVkJywgdGhpcy4kc2VsZWN0ZWQudGV4dCgpKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3Lm9mZignLnNlbGVjdCcpLm9uKCdjbGljay5zZWxlY3QnLCB0aGlzLnRvZ2dsZSk7XG4gICAgICAgICRkb2Mub2ZmKCcuZHJvcGRvd24nKS5vbignY2xpY2suZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSAmJiAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgndmFsdWUnKTtcblxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XG5cbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQtY291bnRyeScsIGN1cnJlbnQpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudCk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIEZpbHRlcnMgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogRmlsdGVycztcblxuICAgIHByaXZhdGUgJGNsZWFyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcGFuZWw6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtU2VjdG9yOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbVRpbWU6IEpRdWVyeTtcbiAgICBwcml2YXRlICR0aW1lbGluZUl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlICRhbGxTZWN0b3JzOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcGlja2VkOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWRDb3VudHJ5OiBKUXVlcnk7XG5cbiAgICBwcml2YXRlIGZpbHRlcnM6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBwcml2YXRlIGlzQWxsQ2hlY2tlZDogYm9vbGVhbjtcblxuXG4gICAgcHVibGljIHN0YXRpYyBzaG93UGlja2VkRmlsdGVycyhjb3VudHJ5Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGxldCBwaWNrZWRTZWN0b3JzID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG4gICAgICAgIGxldCBwaWNrZWRUaW1lID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcbiAgICAgICAgbGV0IHBpY2tlZENvdW50cnkgPSBjb3VudHJ5ID8gY291bnRyeSA6IEZpbHRlcnMuaW5zdGFuY2UuJHNlbGVjdGVkQ291bnRyeS50ZXh0KCk7XG5cblxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuZmluZCgnc3BhbicpLnJlbW92ZSgpO1xuXG4gICAgICAgIGlmIChwaWNrZWRTZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRTZWN0b3JzKTtcblxuICAgICAgICAgICAgaWYgKHBpY2tlZFNlY3RvcnMubGVuZ3RoID09PSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWwnLCBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzKTtcbiAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycy50ZXh0KCkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwaWNrZWRTZWN0b3JzLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyAkKGVsKS50ZXh0KCkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZENvdW50cnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBpY2tlZENvdW50cnkpO1xuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZENvdW50cnkgKyAnPC9zcGFuPicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZFRpbWUpIHtcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRUaW1lLmRhdGEoJ2l0ZW0tbGFiZWwnKSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kY2xlYXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsZWFyJyk7XG4gICAgICAgIHRoaXMuJHBhbmVsID0gdGhpcy52aWV3LmZpbmQoJy5qcy1wYW5lbCcpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lID0gdGhpcy52aWV3LmZpbmQoJy5qcy10aW1lJyk7XG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10aW1lXScpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWFsbCcpO1xuICAgICAgICB0aGlzLiRwaWNrZWQgPSAkKCcuanMtcGlja2VkLWZpbHRlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZENvdW50cnkgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0XScpO1xuXG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICBjb25zb2xlLmxvZyhGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLCBGaWx0ZXJzLmluc3RhbmNlLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJykuZGF0YSgnc2VsZWN0ZWQnKSk7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuJGNsZWFyLmNzcygnaGVpZ2h0JywgdGhpcy4kcGFuZWwub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5vZmYoJy5zZWN0b3InKS5vbignY2xpY2suc2VjdG9yJywgdGhpcy50b2dnbGVTZWN0b3IpO1xuICAgICAgICB0aGlzLiRpdGVtVGltZS5vZmYoJy50aW1lJykub24oJ2NsaWNrLnRpbWUnLCB0aGlzLnRvZ2dsZVRpbWUpO1xuICAgICAgICB0aGlzLiRjbGVhci5vZmYoJy5jbGVhcicpLm9uKCdjbGljay5jbGVhcicsIHRoaXMuY2xlYXJBcnJheSk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMub2ZmKCcuYWxsJykub24oJ2NsaWNrLmFsbCcsIHRoaXMubWFya0FsbFNlY3RvcnMpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBtYXJrQWxsU2VjdG9ycyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgdGltZUNoZWNrZWQgPSB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuXG4gICAgICAgIHRoaXMuY2xlYXJBcnJheSgpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcblxuICAgICAgICBpZiAodGltZUNoZWNrZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGltZUNoZWNrZWQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZSh0aW1lQ2hlY2tlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGNsZWFyQXJyYXkgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xuICAgICAgICB0aGlzLiRpdGVtVGltZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51bm1hcmtUaW1lbGluZSgpO1xuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZVNlY3RvciA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGxDaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlVGltZSA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcblxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlUHJldiA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhY3RpdmVQcmV2KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGFjdGl2ZVByZXYsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZShjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgbWFya1RpbWVsaW5lKGVsOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdqcy10aW1lJykpIHtcbiAgICAgICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZWRvdCA9IHRoaXMuJHRpbWVsaW5lSXRlbS5maWx0ZXIoJ1tkYXRhLXRpbWU9JyArIGVsLmRhdGEoJ2l0ZW0nKSArICddJyk7XG4gICAgICAgICAgICB0aW1lbGluZWRvdC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgdW5tYXJrVGltZWxpbmUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVFbGVtZW50RnJvbUFycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZmlsdGVycy5pbmRleE9mKCRlbC5kYXRhKCdpdGVtJykpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYWRkRWxlbWVudFRvQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGFycmF5LnB1c2goJGVsLmRhdGEoJ2l0ZW0nKSk7XG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGSUxURVJTOicsIHRoaXMuZmlsdGVycyk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuaW50ZXJmYWNlIElEYXRhU3RhdCB7XG4gICAgc2VjdG9yOiBzdHJpbmc7XG4gICAgdmFsdWU6IG51bWJlcjtcbiAgICBjb2xvcjogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUdyaWRJdGVtUG9zaXRpb24ge1xuICAgIGNvbHVtbl9zdGFydDogbnVtYmVyO1xuICAgIGNvbHVtbl9lbmQ6IG51bWJlcjtcbiAgICByb3dfc3RhcnQ6IG51bWJlcjtcbiAgICByb3dfZW5kOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNYXNvbnJ5IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgZGF0YTogQXJyYXk8SURhdGFTdGF0PiA9IFtdO1xuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlIGRhdGFBcnJheTogQXJyYXk8YW55PiA9IFtdO1xuICAgIHByaXZhdGUgYXJlYTogbnVtYmVyO1xuICAgIHByaXZhdGUgaXRlbU1hcmdpbjogbnVtYmVyID0gMztcbiAgICBwcml2YXRlIGdyaWRSb3dzOiBudW1iZXIgPSAyMDtcbiAgICBwcml2YXRlIGdyaWRDb2xzOiBudW1iZXIgPSAyMDtcbiAgICBwcml2YXRlIGdyaWRDZWxsczogbnVtYmVyID0gdGhpcy5ncmlkQ29scyAqIHRoaXMuZ3JpZFJvd3M7XG4gICAgcHJpdmF0ZSBjZWxsc0JhbGFuY2U6IG51bWJlciA9IHRoaXMuZ3JpZENlbGxzO1xuICAgIHByaXZhdGUgZ3JpZENlbGw6IGFueSA9IHtcbiAgICAgICAgd2lkdGg6IHRoaXMudmlldy53aWR0aCgpIC8gdGhpcy5ncmlkQ29scyxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLnZpZXcuaGVpZ2h0KCkgLyB0aGlzLmdyaWRSb3dzLFxuICAgIH07XG4gICAgcHJpdmF0ZSBtaW5DZWxsV2lkdGg6IG51bWJlciA9IDM7XG4gICAgcHJpdmF0ZSBtaW5DZWxsSGVpZ2h0OiBudW1iZXIgPSAzO1xuXG4gICAgcHJpdmF0ZSBpdGVtUG9zaXRpb25pbmc6IEFycmF5PElHcmlkSXRlbVBvc2l0aW9uPiA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLW1hc29ucnktdGlsZScpO1xuICAgICAgICB0aGlzLiRpdGVtLmVhY2goIChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YUl0ZW0gPSA8SURhdGFTdGF0PntcbiAgICAgICAgICAgICAgICBzZWN0b3I6ICQoZWwpLmRhdGEoJ3RpbGUnKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJChlbCkuZGF0YSgndmFsdWUnKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogJChlbCkuZGF0YSgnY29sb3InKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFyZWEgPSAodGhpcy52aWV3LndpZHRoKCkgLSB0aGlzLml0ZW1NYXJnaW4gKiAzKSAqIHRoaXMudmlldy5oZWlnaHQoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGEsIHRoaXMuYXJlYSwgJ2NlbGwgd2lkdGgnLCB0aGlzLmdyaWRDZWxsLndpZHRoLCAnY2VsbCBoZWlnaHQnLCB0aGlzLmdyaWRDZWxsLmhlaWdodCk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIFxuICAgIH07XG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoKTtcbiAgICAgICAgdGhpcy5nZXRBcnJGcm9tT2JqZWN0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBcnJGcm9tT2JqZWN0KCk6IGFueSB7XG4gICAgICAgIHRoaXMuZGF0YUFycmF5ID0gT2JqZWN0LmVudHJpZXModGhpcy5kYXRhKS5zb3J0KChhLCBiKSA9PiBhWzBdLmxvY2FsZUNvbXBhcmUoYlswXSkpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YUFycmF5KTtcblxuICAgICAgICB0aGlzLmRhdGFBcnJheS5mb3JFYWNoKCAoZWwsIGkpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsWzFdLnZhbHVlLCBpLCAnZWwnKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZWxbMV0udmFsdWU7XG4gICAgICAgICAgICBjb25zdCBzZWN0b3IgPSBlbFsxXS5zZWN0b3I7XG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGVsWzFdLmNvbG9yO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xuXG4gICAgICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKHNlY3RvciwgdmFsdWUsIGNvbG9yLCBpbmRleCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGlsZVNpemUoc2VjdG9yOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIGNvbG9yOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuJGl0ZW0uZmlsdGVyKCdbZGF0YS10aWxlPScgKyBzZWN0b3IgKyAnXScpO1xuICAgICAgICBsZXQgYXJlYSwgaCwgdywgdCwgbCwgY29sdW1uX3N0YXJ0LCBjb2x1bW5fZW5kLCByb3dfc3RhcnQsIHJvd19lbmQsIGl0ZW0sIGFyZWFHcmlkO1xuICAgICAgICBcbiAgICAgICAgYXJlYSA9IHRoaXMuYXJlYSAqICh2YWx1ZSAvIDEwMCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYXJlYSwgJzphcmVhJywgdGhpcy5pdGVtUG9zaXRpb25pbmcsdGhpcy5pdGVtUG9zaXRpb25pbmcubGVuZ3RoID4gMCwgJ2NoZWNrIGlmIHNvbWUgaXRlbSBvbiBhcnJheScpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQgPSAxO1xuICAgICAgICAgICAgcm93X3N0YXJ0ID0gMTtcbiAgICAgICAgICAgIHJvd19lbmQgPSB0aGlzLmdyaWRSb3dzO1xuICAgICAgICAgICAgY29sdW1uX2VuZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLmhlaWdodCAqIHJvd19lbmQpIC8gdGhpcy5ncmlkQ2VsbC53aWR0aCk7XG4gICAgICAgICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKTtcbiAgICAgICAgICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgIC8vICAgICBjb2x1bW5fc3RhcnQgPSB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0xXS5jb2x1bW5fZW5kICsgMSA8IHRoaXMuZ3JpZENvbHMgLSB0aGlzLm1pbkNlbGxXaWR0aCA/IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDogdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMl0uY29sdW1uX2VuZCArIDE7XG4gICAgICAgIC8vICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA+PSA2ID8gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpIDogNjtcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XG4gICAgICAgIC8vICAgICBjb2x1bW5fZW5kID0gYXJlYUdyaWQgLyB0aGlzLm1pbkNlbGxXaWR0aCBcblxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYXJlYUdyaWQsICdhbW91bnQgb2YgY2VsbHMnKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGl0ZW0gPSA8SUdyaWRJdGVtUG9zaXRpb24+e1xuICAgICAgICAgICAgY29sdW1uX3N0YXJ0OiBjb2x1bW5fc3RhcnQsXG4gICAgICAgICAgICBjb2x1bW5fZW5kOiBjb2x1bW5fZW5kLFxuICAgICAgICAgICAgcm93X3N0YXJ0OiByb3dfc3RhcnQsXG4gICAgICAgICAgICByb3dfZW5kOiByb3dfZW5kLFxuICAgICAgICB9O1xuXG4gICAgICAgIGN1cnJlbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1zdGFydCc6IGNvbHVtbl9zdGFydCxcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1lbmQnOiBjb2x1bW5fZW5kLFxuICAgICAgICAgICAgJ2dyaWQtcm93LXN0YXJ0Jzogcm93X3N0YXJ0LFxuICAgICAgICAgICAgJ2dyaWQtcm93LWVuZCc6ICdzcGFuJyArIHJvd19lbmQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLml0ZW1Qb3NpdGlvbmluZy5wdXNoKGl0ZW0pO1xuICAgICAgICB0aGlzLmNlbGxzQmFsYW5jZSA9IHRoaXMuY2VsbHNCYWxhbmNlIC0gYXJlYUdyaWQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY2VsbHNCYWxhbmNlLCAnOmZyZWUgY2VsbHMnKTtcbiAgICAgICAgXG4gICAgfVxuXG59XG4iLCJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcblxuXG5cbmludGVyZmFjZSBJUGFyYWxsYXhTZXR0aW5ncyB7XG4gICAgZWxlbWVudHM6IEFycmF5PHN0cmluZz47XG4gICAgbW92ZVg6IEFycmF5PG51bWJlcj47XG4gICAgbW92ZVk6IEFycmF5PG51bWJlcj47XG59XG5cblxuaW50ZXJmYWNlIElQYXJhbGxheEVsZW1lbnREYXRhIHtcbiAgICAkZWw6IEpRdWVyeTtcbiAgICBtb3ZlWDogbnVtYmVyO1xuICAgIG1vdmVZOiBudW1iZXI7XG59XG5cblxuXG5leHBvcnQgY2xhc3MgUGFyYWxsYXggZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSBtb3ZlWDogbnVtYmVyO1xuICAgIHByaXZhdGUgbW92ZVk6IG51bWJlcjtcbiAgICBwcml2YXRlIHRpbWU6IG51bWJlciA9IDI7XG4gICAgcHJpdmF0ZSBzZXR0aW5nczogSVBhcmFsbGF4U2V0dGluZ3M7XG4gICAgcHJpdmF0ZSBpdGVtczogSVBhcmFsbGF4RWxlbWVudERhdGFbXTtcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuY3JlYXRlVmFsdWVBcnJheSgpO1xuXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdQYXJhbGxheCcsIHRoaXMpO1xuXG5cbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCkge1xuICAgICAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnZpZXcub24oJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGNyZWF0ZVZhbHVlQXJyYXkoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9ycyA9ICh0aGlzLnNldHRpbmdzLmVsZW1lbnRzKS50b1N0cmluZygpLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgbW92ZVggPSAodGhpcy5zZXR0aW5ncy5tb3ZlWCkubWFwKE51bWJlcik7XG4gICAgICAgIGNvbnN0IG1vdmVZID0gKHRoaXMuc2V0dGluZ3MubW92ZVkpLm1hcChOdW1iZXIpO1xuXG4gICAgICAgIHRoaXMuaXRlbXMgPSBzZWxlY3RvcnMubWFwKChzZWwsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9IHRoaXMudmlldy5maW5kKCcuJyArIHNlbCk7XG4gICAgICAgICAgICBpZiAoISRlbFswXSkgeyBjb25zb2xlLndhcm4oYFRoZXJlIGlzIG5vIC4ke3NlbH0gZWxlbWVudCB0byB1c2UgaW4gcGFyYWxsYXhgKTsgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICBtb3ZlWDogbW92ZVhbaV0sXG4gICAgICAgICAgICAgICAgbW92ZVk6IG1vdmVZW2ldLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gISFpdGVtLiRlbFswXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZXZlbnQpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5tb3ZlWCA9ICggZXZlbnQuY2xpZW50WCAvIHdpbmRvdy5pbm5lcldpZHRoKSAtIDAuNTtcbiAgICAgICAgdGhpcy5tb3ZlWSA9ICggZXZlbnQuY2xpZW50WSAvIHdpbmRvdy5pbm5lckhlaWdodCkgLSAwLjU7XG5cbiAgICAgICAgdGhpcy5hbmltYXRlKC10aGlzLm1vdmVYLCAtdGhpcy5tb3ZlWSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYW5pbWF0ZShtb3ZlWCwgbW92ZVkpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zKSB7IHJldHVybjsgfVxuICAgICAgICB0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgIGdzYXAudG8oaXRlbS4kZWwsIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGhpcy50aW1lLFxuICAgICAgICAgICAgICAgIHg6IG1vdmVYICogaXRlbS5tb3ZlWCxcbiAgICAgICAgICAgICAgICB5OiBtb3ZlWSAqIGl0ZW0ubW92ZVksXG4gICAgICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMicsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIFJhbmdlIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIFxuICAgIHByaXZhdGUgJHRyaWdnZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgJHNlbGVjdGVkOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcmFkaW86IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdGVkXScpO1xuICAgICAgICB0aGlzLiRyYWRpbyA9IHRoaXMudmlldy5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0cmlnZ2VyLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZSk7XG4gICAgICAgICRkb2Mub2ZmKCcuc21hbGxkcm9wZG93bicpLm9uKCdjbGljay5zbWFsbGRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcbiAgICAgICAgdGhpcy4kcmFkaW8ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLmlzT3BlbiA/IHRoaXMuY2xvc2VTZWxlY3QoKSA6IHRoaXMub3BlblNlbGVjdChlKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgb3BlblNlbGVjdChlKTogdm9pZCB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNsb3NlU2VsZWN0KCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJ29wZW4/Jyk7XG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpIHx8ICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCd2YWx1ZScpO1xuXG4gICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcblxuICAgICAgICB0aGlzLiRzZWxlY3RlZC5hdHRyKCdkYXRhLXNlbGVjdGVkJywgY3VycmVudCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcblxuZXhwb3J0IGNsYXNzIFNsaWRlciBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgXG4gICAgcHJpdmF0ZSBpbmRleDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlICRuYXY6IEpRdWVyeTtcbiAgICBwcml2YXRlICRjYXB0aW9uczogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcbiAgICAgICAgdGhpcy4kbmF2ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1uYXYnKTtcbiAgICAgICAgdGhpcy4kY2FwdGlvbnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNhcHRpb24nKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kbmF2Lm9mZignLm5hdicpLm9uKCdjbGljay5uYXYnLCB0aGlzLnN3aXRjaFNsaWRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN3aXRjaFNsaWRlID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgdGhpcy5pbmRleCA9IGN1cnJlbnQuaW5kZXgoKTtcblxuICAgICAgICB0aGlzLnNldEFjdGl2ZUVsZW1lbnQodGhpcy4kbmF2LCAwKTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGl0ZW0sIDEwMCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlRWxlbWVudCh0aGlzLiRjYXB0aW9ucywgMTAwMCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHNldEFjdGl2ZUVsZW1lbnQoZWw6IEpRdWVyeSwgZGVsYXk6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICBlbC5lcSh0aGlzLmluZGV4KS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xuXG5cbmV4cG9ydCBjbGFzcyBTdGF0cyBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICR0YWI6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkd3JhcDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGN1cnJlbnQ6IEpRdWVyeTtcbiAgICBwcml2YXRlIHRhYlRvU2hvdzogbnVtYmVyOyAvLyBmb3IgYXN5bmMgc3dpdGNoXG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmlld10nKTtcbiAgICAgICAgdGhpcy4kd3JhcCA9IHRoaXMudmlldy5maW5kKCcuanMtdGFicy13cmFwcGVyJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhwYXJzZUludChVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkudGFiLCAxMCkgfHwgMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uVGFiQ2xpY2spO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uVGFiQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhpbmRleCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFiVG9TaG93ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuJHRhYi5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJHRhYi5maWx0ZXIoJ1tkYXRhLXRhYj0nICsgaW5kZXggKyAnXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5oaWRlQ3VycmVudCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5zaG93KHRoaXMudGFiVG9TaG93KTtcbiAgICAgICAgICAgIHRoaXMudGFiVG9TaG93ID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMuY2xlYW5DYWNoZWRBbmltKCk7XG4gICAgICAgICAgICAkd2luZG93LnJlc2l6ZSgpO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGhpZGVDdXJyZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLiRjdXJyZW50KSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGN1cnJlbnQsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY3VycmVudC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbGVhbkNhY2hlZEFuaW0oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGFuaW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdW5jYWNoZV0nKTtcbiAgICAgICAgY29uc3QgdW5jYWNoZXMgPSB0aGlzLnZpZXcuZmluZCgnLnVuY2FjaGVkJyk7XG4gICAgICAgIHVuY2FjaGVzLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGFuaW0ucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkJyk7XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIHNob3coaW5kZXg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy4kY3VycmVudCA9IHRoaXMuJGl0ZW0uZmlsdGVyKCdbZGF0YS12aWV3PScgKyBpbmRleCArICddJyk7XG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgIGdzYXAuZnJvbVRvKHRoaXMuJGN1cnJlbnQsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuNyxcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4gcmVzb2x2ZSgpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgJGRvYyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuXG5cblxuZXhwb3J0IGNsYXNzIFRvb2x0aXAgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW47XG4gICAgcHJpdmF0ZSAkYnV0dG9uOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkY2xvc2U6IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRidXR0b24gPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRvZ2dsZScpO1xuICAgICAgICB0aGlzLiRjbG9zZSA9IHRoaXMudmlldy5maW5kKCcuanMtY2xvc2UnKS5sZW5ndGggPiAwID8gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpIDogbnVsbDtcbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kYnV0dG9uLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkJ1dHRvbkNsaWNrSGFuZGxlcik7XG5cbiAgICAgICAgdGhpcy52aWV3XG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9uJykub24oJ21vdXNlZW50ZXIubW91c2VvbicsIHRoaXMub25Nb3VzZUVudGVyKVxuICAgICAgICAgICAgLm9mZignbW91c2VvZmYnKS5vbignbW91c2VsZWF2ZS5tb3VzZW9mZicsIHRoaXMub25Nb3VzZUxlYXZlKTtcblxuICAgICAgICAkZG9jLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLiRjbG9zZSkge1xuICAgICAgICAgICAgdGhpcy4kY2xvc2Uub24oJ2NsaWNrLnRvb2x0aXAnLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbk1vdXNlRW50ZXIgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbk1vdXNlTGVhdmUgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkJ1dHRvbkNsaWNrSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAvLyBpZiAoIWJyZWFrcG9pbnQuZGVza3RvcCkge1xuICAgICAgICAvLyAgICAgYWxlcnQoJChlLmN1cnJlbnRUYXJnZXQpWzBdKTtcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XG4gICAgICAgIC8vIH1cblxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCApIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBvcGVuKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG5cbiAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgIH0sIDI1MCk7XG5cbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5hZGRDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDMwMDApO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGNsb3NlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgICAgICBpZiAodGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgQ29tcG9uZW50LCBDb21wb25lbnRFdmVudHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XG4vLyBpbXBvcnQgQmFja2dyb3VuZCBmcm9tICcuLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tICcuLi9DbGFzc2VzJztcbmltcG9ydCB7ICRhcnRpY2xlLCAkYm9keSwgJG1haW4gfSBmcm9tICcuLi9TaXRlJztcblxuZXhwb3J0IGNsYXNzIFBhZ2VFdmVudHMge1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUFJPR1JFU1M6IHN0cmluZyA9ICdwcm9ncmVzcyc7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDT01QTEVURTogc3RyaW5nID0gJ2NvbXBsZXRlJztcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENIQU5HRTogc3RyaW5nID0gJ2FwcGVuZCc7XG59XG5cbmV4cG9ydCBjbGFzcyBQYWdlIGV4dGVuZHMgSGFuZGxlciB7XG5cbiAgICBwdWJsaWMgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xuICAgIC8vIHB1YmxpYyBiYWNrZ3JvdW5kczoge1trZXk6IHN0cmluZ106IEJhY2tncm91bmR9O1xuICAgIHByaXZhdGUgbG9hZGVyOiBKUXVlcnlEZWZlcnJlZDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkPjtcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBvcHRpb25zPykge1xuXG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMudmlldy5jc3MoeyBvcGFjaXR5OiAwIH0pO1xuXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyh0aGlzLnZpZXcucGFyZW50KCkuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKTtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogcHJlbG9hZCBuZWNlc3NhcnkgYXNzZXRzOlxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IGxvYWRpbmcgaW1hZ2VzIHByb21pc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgcHJlbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQodGhpcy52aWV3LmZpbmQoJy5wcmVsb2FkJykudG9BcnJheSgpLCA8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZE9wdGlvbnM+eyBiYWNrZ3JvdW5kOiB0cnVlIH0pO1xuICAgICAgICBsZXQgaW1hZ2VzID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgaW1hZ2VzID0gaW1hZ2VzLmNvbmNhdChjb21wb25lbnQucHJlbG9hZEltYWdlcygpKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCB1cmwgb2YgaW1hZ2VzKSB7XG4gICAgICAgICAgICBpbC5hZGRCYWNrZ3JvdW5kKHVybCwgbnVsbCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5sb2FkZXIgPSBpbC5qcURlZmVycmVkO1xuICAgICAgICAgICAgdGhpcy5sb2FkZXIucHJvZ3Jlc3MoKGluc3RhbmNlOiBJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkLCBpbWFnZTogSW1hZ2VzTG9hZGVkLkxvYWRpbmdJbWFnZSkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzczogbnVtYmVyID0gaW5zdGFuY2UucHJvZ3Jlc3NlZENvdW50IC8gaW5zdGFuY2UuaW1hZ2VzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoUGFnZUV2ZW50cy5QUk9HUkVTUywgcHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfSkuYWx3YXlzKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLnRyaWdnZXIoUGFnZUV2ZW50cy5DT01QTEVURSk7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBjaGVjayBpZiBhbnkgQ29tcG9uZW50IGNhbiBiZSBjaGFuZ2VkIGFmdGVyIG9uU3RhdGVcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSByZXR1cm5zIHRydWUgd2hlbiBvbmUgb2YgdGhlIGNvbXBvbmVudHMgdGFrZXMgYWN0aW9uIGluIG9uU3RhdGUgZnVuY3Rpb24gY2FsbFxuICAgICAqL1xuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xuXG4gICAgICAgIGxldCBjaGFuZ2VkOiBib29sZWFuID0gISFmYWxzZTtcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50Q2hhbmdlZDogYm9vbGVhbiA9IGNvbXBvbmVudC5vblN0YXRlKCk7XG4gICAgICAgICAgICBpZiAoIWNoYW5nZWQgJiYgISFjb21wb25lbnRDaGFuZ2VkKSB7XG4gICAgICAgICAgICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2hhbmdlZDtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogcGFnZSBlbnRlcmluZyBhbmltYXRpb25cbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVsYXkgYW5pbWF0aW9uIGRlbGF5XG4gICAgICovXG4gICAgcHVibGljIGFuaW1hdGVJbihkZWxheT86IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xuICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcblxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwodGhpcy5jb21wb25lbnRzLCAnYW5pbWF0ZUluJyk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jb21wb25lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB0aGlzLmNvbXBvbmVudHNbaV0uYW5pbWF0ZUluKGksIGRlbGF5KTtcbiAgICAgICAgfVxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xuICAgICAgICAgICAgZHVyYXRpb246IDAuNCxcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhiZywgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAxLCBkaXNwbGF5OiAnYmxvY2snfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwYWdlIGV4aXQgYW5pbWF0aW9uXG4gICAgICogKGNhbGxlZCBhZnRlciBuZXcgY29udGVudCBpcyBsb2FkZWQgYW5kIGJlZm9yZSBpcyByZW5kZXJlZClcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBhbmltYXRpb24gcHJvbWlzZVxuICAgICAqL1xuICAgIHB1YmxpYyBhbmltYXRlT3V0KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xuICAgICAgICAvLyBhbmltYXRpb24gb2YgdGhlIHBhZ2U6XG4gICAgICAgICRtYWluLnJlbW92ZUNsYXNzKCdpcy1sb2FkZWQnKTtcbiAgICAgICAgZ3NhcC5zZXQoYmcsIHsgb3BhY2l0eTogMCwgZGlzcGxheTogJ25vbmUnfSk7XG4gICAgICAgIGxldCBwYWdlQW5pbWF0aW9uUHJvbWlzZSA9IG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuNCxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgJGJvZHkucmVtb3ZlQXR0cignY2xhc3MnKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gYW5pbWF0aW9ucyBvZiBhbGwgY29tcG9uZW50czpcbiAgICAgICAgbGV0IGNvbXBvbmVudEFuaW1hdGlvbnM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gdGhpcy5jb21wb25lbnRzLm1hcCgob2JqKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gICAgICAgICAgICByZXR1cm4gPFByb21pc2U8dm9pZD4+b2JqLmFuaW1hdGVPdXQoKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gcmV0dXJuIG9uZSBwcm9taXNlIHdhaXRpbmcgZm9yIGFsbCBhbmltYXRpb25zOlxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuXG4gICAgICAgICAgICBsZXQgYWxsUHJvbWlzZXM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gY29tcG9uZW50QW5pbWF0aW9ucy5jb25jYXQocGFnZUFuaW1hdGlvblByb21pc2UpO1xuXG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihhbGxQcm9taXNlcykudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG5cbiAgICAvKipcbiAgICAgKiBWaXNpYmlsaXR5IHdpZGdldCBoYW5kbGVyLCBmaXJlcyB3aGVuIHVzZXIgZXhpdHMgYnJvd3NlciB0YWJcbiAgICAgKi9cbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWxsQWxsKCd0dXJuT2ZmJyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBWaXNpYmlsaXR5IHdpZGdldCBoYW5kbGVyLCBmaXJlcyB3aGVuIHVzZXIgZXhpdHMgYnJvd3NlciB0YWJcbiAgICAgKi9cbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PbicpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiByZXNpemUgaGFuZGxlclxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSB3ZHQgICAgICAgIHdpbmRvdyB3aWR0aFxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBoZ3QgICAgICAgIHdpbmRvdyBoZWlnaHRcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gYnJlYWtwb2ludCBJQnJlYWtwb2ludCBvYmplY3RcbiAgICAgKi9cbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWxsQWxsKCdyZXNpemUnLCB3ZHQsIGhndCwgYnJlYWtwb2ludCwgYnBDaGFuZ2VkKTtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogY2xlYW51cCB3aGVuIGNsb3NpbmcgUGFnZVxuICAgICAqL1xuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ2Rlc3Ryb3knKTtcbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIC8vIHRoaXMuYmFja2dyb3VuZHMgPSB7fTtcblxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcpO1xuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xuXG4gICAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9XG5cblxuXG4gICAgcHJvdGVjdGVkIGJ1aWxkQ29tcG9uZW50cygkY29tcG9uZW50czogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgIGZvciAobGV0IGkgPSAkY29tcG9uZW50cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgY29uc3QgJGNvbXBvbmVudDogSlF1ZXJ5ID0gJGNvbXBvbmVudHMuZXEoaSk7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnROYW1lOiBzdHJpbmcgPSAkY29tcG9uZW50LmRhdGEoJ2NvbXBvbmVudCcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coY29tcG9uZW50TmFtZSwgY29tcG9uZW50cyk7XG5cbiAgICAgICAgICAgIGlmIChjb21wb25lbnROYW1lICE9PSB1bmRlZmluZWQgJiYgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG9wdGlvbnM6IE9iamVjdCA9ICRjb21wb25lbnQuZGF0YSgnb3B0aW9ucycpLFxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IENvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKCRjb21wb25lbnQsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcG9uZW50cy5wdXNoKGNvbXBvbmVudCk7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50Lm9uKENvbXBvbmVudEV2ZW50cy5DSEFOR0UsIHRoaXMub25Db21wb25lbnRDaGFuZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBgJXNgIGNvbXBvbmVudCEnLCBjb21wb25lbnROYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25Db21wb25lbnRDaGFuZ2UgPSAoZWwpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudHMoZWwuZmlsdGVyKCdbZGF0YS1jb21wb25lbnRdJykuYWRkKGVsLmZpbmQoJ1tkYXRhLWNvbXBvbmVudF0nKSkpO1xuICAgICAgICB0aGlzLnRyaWdnZXIoUGFnZUV2ZW50cy5DSEFOR0UsIGVsKTtcbiAgICB9XG5cblxuICAgIC8vIHNob3J0IGNhbGxcbiAgICBwcml2YXRlIGNhbGxBbGwoZm46IHN0cmluZywgLi4uYXJncyk6IHZvaWQge1xuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudFtmbl0gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICBjb21wb25lbnRbZm5dLmFwcGx5KGNvbXBvbmVudCwgW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgfVxufVxuIl19
