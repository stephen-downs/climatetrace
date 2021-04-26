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
            setTimeout(() => {
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
            }, 1000);
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
    Site_1.$body.toggleClass('is-aside-open');
    el.toggleClass('is-open');
    if (el.hasClass('is-open')) {
        gsap.set(Site_1.$article, { 'will-change': 'transform' });
        Utils.disableBodyScrolling(Scroll_1.Scroll.scrollTop);
    }
    else {
        gsap.set(Site_1.$article, { clearProps: 'will-change' });
        Utils.enableBodyScrolling(Scroll_1.Scroll.scrollTop);
    }
    Aside_1.Aside.asideAnimation();
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
                        if (item.component && item.type === 'toggle' && typeof item.component['enable'] === 'function') {
                            item.component['enable']();
                        }
                        else {
                            this.animate(item, item.$el, item.type, item.delay, quick);
                        }
                    }
                    else if (!!item.done && item.component && item.type === 'toggle' && (itemY > yBottom || itemY + itemHeight < yTop)) {
                        console.log(item);
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
                component: $el.data('comp'),
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
            gsap.to(Aside.instance.$hamburgerLine, 0.3, { duration: 0.3, scaleY: 0 });
            Aside.instance.isOpen = false;
        }
        else {
            gsap.to(Aside.instance.$item, 0.5, { duration: 0.5, stagger: 0.05, opacity: 1, x: 0, delay: 0.2 });
            gsap.to(Aside.instance.$hamburgerLine, 0.3, { duration: 0.3, scaleY: 1, delay: 0.5 });
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
            this.currentCharts = this.graphsData.map((data, i) => data.shown ? i : null).filter((index) => index !== null);
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
        this.bgLines = Array.apply(0, { length: 9 }).map(() => { return { scaleX: 0 }; });
        const paramsCharts = Utils.getParams(window.location.search).charts;
        this.currentCharts = paramsCharts ? paramsCharts.split(',').map((i) => parseInt(i, 10)) : [0, 3, 4];
        this.createDataObject();
        this.bind();
        this.resize();
    }
    enable() {
        this.showBg();
        let visible = 0;
        for (let i = 0; i < this.$tab.length; i++) {
            const v = this.currentCharts.indexOf(i) >= 0;
            this.toggleChart(i, v, false, visible * 0.3);
            visible += !!v ? 1 : 0;
        }
    }
    disable() {
        this.hideBg(true);
        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, false, true);
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
    showBg() {
        gsap.killTweensOf(this, { bg: true });
        gsap.to(this.bgLines, {
            scaleX: 1,
            duration: 2,
            ease: 'power3',
            stagger: -0.1,
        });
    }
    hideBg(quick) {
        gsap.killTweensOf(this, { bg: true });
        gsap.to(this.bgLines, {
            scaleX: 0,
            duration: !quick ? 2 : 0,
            ease: 'power3',
            stagger: !quick ? -0.1 : 0,
        });
    }
    toggleChart(index, show, quick, delay) {
        const data = this.graphsData[index];
        if (typeof show === 'undefined') {
            show = !data.shown;
        }
        gsap.to(data, {
            duration: !quick ? 3.2 : 0,
            xPercent: show ? 1 : 0,
            labelY: data.yPx[show ? data.yPx.length - 1 : 0],
            roundProps: 'labelY',
            ease: 'power3',
            delay: !quick ? delay || 0 : 0,
            onUpdate: this.draw,
        });
        this.$tab.eq(index).toggleClass('is-on-chart', show);
        this.graphsData[index].shown = show;
    }
    drawBg() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = this.colors.white;
        this.ctx.moveTo(this.graph.left, this.graph.bottom);
        this.ctx.lineTo(this.graph.right + 20, this.graph.bottom);
        this.ctx.stroke();
        const helpersLine = 8;
        const textTransform = 5;
        const step = 5;
        let val;
        const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021];
        this.ctx.strokeStyle = this.colors.gray;
        this.ctx.lineJoin = 'round';
        this.ctx.font = '500 12px Quicksand, sans-serif';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = this.colors.blue;
        for (let i = 0; i <= helpersLine; i++) {
            val = 50 - step * i;
            this.ctx.globalAlpha = this.bgLines[i].scaleX;
            this.ctx.fillText('' + val + '', 0, (this.graph.height) / helpersLine * i + this.margin.top + textTransform);
            this.ctx.globalAlpha = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(this.graph.left, (this.graph.height) / helpersLine * i + this.margin.top);
            this.ctx.lineTo(this.graph.left + (this.graph.width + 20) * this.bgLines[i].scaleX, (this.graph.height) / helpersLine * i + this.margin.top);
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
                this.view.addClass('is-toggled');
                gsap.to(this.$body, { duration: 0.5, height: 'auto', ease: 'power2.inOut',
                    onComplete: () => {
                        this.isToggled = true;
                    },
                });
            }
            else {
                this.view.removeClass('is-toggled');
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
            this.cleanCachedAnim();
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
    cleanCachedAnim() {
        const anim = this.view.find('[data-uncache]');
        const uncaches = this.view.find('.uncached');
        uncaches.removeAttr('style');
        anim.removeClass('animated');
        this.view.find('[data-component]').each((i, el) => {
            const comp = $(el).data('comp');
            if (comp && typeof comp['disable'] !== 'undefined') {
                comp['disable']();
            }
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
            this.$current.find('[data-component]').each((i, el) => {
                const comp = $(el).data('comp');
                if (comp && typeof comp['enable'] !== 'undefined') {
                    comp['enable']();
                }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0FzaWRlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ2hhcnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Db21wb25lbnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9EYXNoYm9hcmQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Ecm9wZG93bi50cyIsInNyYy90cy9jb21wb25lbnRzL0ZpbHRlcnMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9NYXNvbnJ5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUGFyYWxsYXgudHMiLCJzcmMvdHMvY29tcG9uZW50cy9SYW5nZS50cyIsInNyYy90cy9jb21wb25lbnRzL1NsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL1N0YXRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsT0FB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RyxDQUFDLE1BQU0sRUFBRSxDQUFDO2dCQUdsQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxhQUFhLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7Z0JBQ2hDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUdoQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7Z0JBQ3ZCLElB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QUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxF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SSxDQUFDLFNBQVMsQ0FBQyxFQUM5QyxTQUFTLEdBQWMsSUFBSSxvQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxFQUFFLENBQUMsMkJBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDaEU7aUJBQU07Z0JBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDckU7U0FDSjtJQUNMLENBQUM7SUFTTyxPQUFPLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBSTtRQUMvQixLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxVQUFVLEVBQUU7Z0JBQ3JDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7SUFFTCxDQUFDO0NBQ0o7QUFoTkQsb0JBZ05DIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBkZWJ1ZyB9IGZyb20gJy4vU2l0ZSc7XG5cblxuXG5kZWNsYXJlIHZhciAkYm9keTtcblxuZXhwb3J0IGludGVyZmFjZSBJQXBpRGF0YSB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgYmVmb3JlQ2FsbD86IHN0cmluZztcbiAgICBjYWxsYmFjaz86IHN0cmluZztcbiAgICBmb3JtPzogYW55O1xuICAgIHBhcmFtcz86IGFueTtcbiAgICBsaWtlPzogYm9vbGVhbjtcbiAgICBhY3Rpb24/OiAnUE9TVCcgfCAnREVMRVRFJyB8ICdHRVQnIHwgJ1BVVCcgfCAnUEFUQ0gnO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBBUEkge1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIGJlZm9yZUNhbGxzID0ge1xuXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgICAgIGlmICghJGJvZHkuaGFzQ2xhc3MoJ2lzLWxvZ2dlZCcpKSB7XG4gICAgICAgICAgICAgICAgJCgnLmpzLWxvZ2luJykubGFzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cblxuICAgICAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgICAgICBsZXQgcGFzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBsZXQgJGZvcm0gPSAkZWwuaXMoJ2Zvcm0nKSA/ICRlbCA6ICRlbC5jbG9zZXN0KCdmb3JtJyk7XG4gICAgICAgICAgICBsZXQgJHZhbGlkYXRpb25FbGVtID0gJGZvcm07XG4gICAgICAgICAgICBsZXQgc3RlcFZhbGlkYXRpb247XG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XG4gICAgICAgICAgICBpZiAoJGZvcm0uaGFzQ2xhc3MoJ2lzLWRvbmUnKSkge1xuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdpcy1kb25lJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiAoICEhZGF0YS5wYXJhbXMgKSB7XG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnZhbGlkYXRlT25lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSAgZGF0YS5wYXJhbXMudmFsaWRhdGVPbmU7XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG5cbiAgICAgICAgICAgIC8vICAgICBpZiAoZGF0YS5wYXJhbXMuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9ICBkYXRhLnBhcmFtcy5zY3JvbGxUbztcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xuXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnW3JlcXVpcmVkXTppbnB1dCcpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnSU5QVVQnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZSA9IC9eKChbXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKFxcLltePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSspKil8KFwiLitcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfV0pfCgoW2EtekEtWlxcLTAtOV0rXFwuKStbYS16QS1aXXsyLH0pKSQvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zW3ZhbHVlLmxlbmd0aCA+IDAgPyAnaW52YWxpZC1lbWFpbCcgOiAncmVxdWlyZWQtZmllbGQnXVsnZW4nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykpIHttZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncGhvbmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxUZWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbFRlbC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ2lucHV0W25hbWU9emlwY29kZV0nKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoaW5wdXQpLmhhc0NsYXNzKCdqcy1wb3N0YWwnKSAmJiB2YWwubGVuZ3RoICE9IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaWYgKCEhcGFzc2VkKSB7XG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZm9ybSk7XG4gICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcnMnKTtcbiAgICAgICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRmb3JtLmFkZENsYXNzKCdoYXMtZXJyb3JzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIGNhbGxiYWNrcyA9IHtcblxuICAgICAgICBvbkNvb2tpZXNDbG9zZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xuICAgICAgICAgICAgJGVsLnBhcmVudCgpLmFkZENsYXNzKCdpcy1oaWRkZW4nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblN1YnNjcmliZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ29uU3Vic2NyaWJlJyk7XG4gICAgICAgICAgICBsZXQgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcblxuICAgICAgICAgICAgLy8gaWYgKGRhdGEuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gIGRhdGEuc2Nyb2xsVG87XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB9XG5cblxuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuXG4gICAgICAgICAgICBpZiAoISRtZXNzYWdlWzBdKSB7XG4gICAgICAgICAgICAgICAgJGVsLmFwcGVuZCgnPGRpdiBjbGFzcz1cImpzLW1lc3NhZ2UgbWVzc2FnZVwiPicpO1xuICAgICAgICAgICAgICAgICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBodG1sID0gJCgnPHA+JyArIHJlc3BvbnNlLm1lc3NhZ2UgKyAnPC9wPicpO1xuXG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKS5hcHBlbmQoaHRtbCk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xuICAgICAgICAgICAgICAgICRlbC5jbG9zZXN0KCcuam9pbicpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XG5cbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dDpjaGVja2VkJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRlbFswXS5oYXNBdHRyaWJ1dGUoJ2RhdGEtcmVkaXJlY3QnKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbignLycpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgLy8gICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkbWVzc2FnZSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgIH0sXG5cbiAgICB9O1xuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBhbnkpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gJCh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJyA/IHRhcmdldCA6ICdib2R5Jyk7XG5cbiAgICAgICAgJHRhcmdldC5maW5kKCdbZGF0YS1hcGldJykubm90KCdmb3JtJykub2ZmKCcuYXBpJykub24oJ2NsaWNrLmFwaScsIEFQSS5vbkFjdGlvbik7XG4gICAgICAgICR0YXJnZXQuZmluZCgnZm9ybVtkYXRhLWFwaV0nKS5vZmYoJy5hcGknKS5vbignc3VibWl0LmFwaScsIEFQSS5vbkFjdGlvbikuYXR0cignbm92YWxpZGF0ZScsICdub3ZhbGlkYXRlJyk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgY2FsbEl0KGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgY3VzdG9tQ2FsbGJhY2s/OiBGdW5jdGlvbik6ICBQcm9taXNlPGFueT4ge1xuICAgICAgICBcbiAgICAgICAgZGF0YSA9IEFQSS5wcmVwcm9jZXNzRGF0YShkYXRhLCAkZWwpO1xuXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuXG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IGRhdGEuYWN0aW9uIHx8ICdQT1NUJztcbiAgICAgICAgZGVsZXRlIGRhdGEuYWN0aW9uO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGRhdGEudXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgZGVsZXRlIGRhdGEudXJsO1xuXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHR5cGU6IGFjdGlvbixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmRvbmUoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZhaWwoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FQSSBlcnJvcjogJyArIGUsIGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCEhZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmFsd2F5cygoKSA9PiB7XG4gICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIHByZXByb2Nlc3NEYXRhKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IElBcGlEYXRhIHtcblxuICAgICAgICAvLyBnZXQgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGZvcm0gZWxlbWVudDpcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignYWN0aW9uJykgPyAkZWwuYXR0cignYWN0aW9uJykgOiBkYXRhLnVybDtcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCAkZWwuZmluZCgnOmlucHV0Jykuc2VyaWFsaXplT2JqZWN0KCkpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBmb3JtJywgZGF0YSwgZGF0YS5wYXJhbXMsZGF0YS5mb3JtLCAkZWwuZmluZCgnOmlucHV0JykpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGxpbmsgZWxlbWVudDpcbiAgICAgICAgaWYgKCRlbC5pcygnW2hyZWZdJykpIHtcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdocmVmJykgPyAkZWwuYXR0cignaHJlZicpIDogZGF0YS51cmw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgYWRkaXRpb25hbCBkYXRhIGZyb20gZXh0ZXJuYWwgZm9ybTpcbiAgICAgICAgaWYgKGRhdGEuZm9ybSAmJiAkKGRhdGEuZm9ybSBhcyBzdHJpbmcpWzBdKSB7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJChkYXRhLmZvcm0gYXMgc3RyaW5nKS5zZXJpYWxpemVPYmplY3QoKSk7XG4gICAgICAgICAgICBkZWxldGUgZGF0YS5mb3JtO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZmxhdHRlbjpcbiAgICAgICAgaWYgKGRhdGEucGFyYW1zKSB7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgZGF0YS5wYXJhbXMpO1xuICAgICAgICAgICAgZGVsZXRlIGRhdGEucGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIHByZScsIGRhdGEsIGRhdGEucGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25BY3Rpb24gPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGxldCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCk7XG4gICAgICAgIGNvbnN0IGRhdGE6IElBcGlEYXRhID0gey4uLiQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdhcGknKX07XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEsICdkYXRhJyk7XG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRlbC5jbG9zZXN0KCdmb3JtJykuYWRkQ2xhc3MoJ2lzLXN1Ym1pdHRlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmVmb3JlQ2FsbCBoYW5kbGVyOlxuICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsIGluIEFQSS5iZWZvcmVDYWxscykge1xuICAgICAgICAgICAgICAgIEFQSS5iZWZvcmVDYWxsc1tkYXRhLmJlZm9yZUNhbGxdKGRhdGEsICRlbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25TdWNjZXNzID0gKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2sgaW4gQVBJLmNhbGxiYWNrcykge1xuICAgICAgICAgICAgICAgIEFQSS5jYWxsYmFja3NbZGF0YS5jYWxsYmFja10oZGF0YSwgJGVsLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSIsImV4cG9ydCBpbnRlcmZhY2UgSUJyZWFrcG9pbnQge1xuICAgIGRlc2t0b3A6IGJvb2xlYW47XG4gICAgdGFibGV0OiBib29sZWFuO1xuICAgIHBob25lOiBib29sZWFuO1xuICAgIHZhbHVlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBsZXQgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XG5cbmV4cG9ydCBjbGFzcyBCcmVha3BvaW50IHtcblxuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKSwgJzpiZWZvcmUnKTtcbiAgICAgICAgY29uc3QgY3NzQmVmb3JlVmFsdWUgPSBjc3NCZWZvcmUuZ2V0UHJvcGVydHlWYWx1ZSgnY29udGVudCcpLnJlcGxhY2UoL1tcXFwiXFwnXS9nLCAnJyk7XG5cbiAgICAgICAgYnJlYWtwb2ludCA9IHtcbiAgICAgICAgICAgIGRlc2t0b3A6IGNzc0JlZm9yZVZhbHVlID09PSAnZGVza3RvcCcsXG4gICAgICAgICAgICBwaG9uZTogY3NzQmVmb3JlVmFsdWUgPT09ICdwaG9uZScsXG4gICAgICAgICAgICB0YWJsZXQ6IGNzc0JlZm9yZVZhbHVlID09PSAndGFibGV0JyxcbiAgICAgICAgICAgIHZhbHVlOiBjc3NCZWZvcmVWYWx1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkJQOlwiLCBicmVha3BvaW50LnZhbHVlKTtcbiAgICB9XG59XG4iLCJleHBvcnQgbGV0IGJyb3dzZXI6IElCcm93c2VyO1xuZGVjbGFyZSBsZXQgb3ByO1xuLy8gdHNsaW50OmRpc2FibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXG5pbnRlcmZhY2UgV2luZG93IHtcbiAgICBvcHI6IGFueTtcbiAgICBvcGVyYTogYW55O1xuICAgIHNhZmFyaTogYW55O1xuICAgIEhUTUxFbGVtZW50OiBhbnk7XG59XG4vLyB0c2xpbnQ6ZW5hYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgSUJyb3dzZXIge1xuICAgIG1vYmlsZT86IGJvb2xlYW47XG4gICAgd2luZG93cz86IGJvb2xlYW47XG4gICAgbWFjPzogYm9vbGVhbjtcbiAgICBpZT86IGJvb2xlYW47XG4gICAgaW9zPzogYm9vbGVhbjtcbiAgICBvcGVyYT86IGJvb2xlYW47XG4gICAgZmlyZWZveD86IGJvb2xlYW47XG4gICAgc2FmYXJpPzogYm9vbGVhbjtcbiAgICBjaHJvbWU/OiBib29sZWFuO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCcm93c2VyKCk6IElCcm93c2VyIHtcbiAgICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuICAgIGJyb3dzZXIgPSB7XG4gICAgICAgIG1vYmlsZTogKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcGFkfGlyaXN8a2luZGxlfEFuZHJvaWR8U2lsa3xsZ2UgfG1hZW1vfG1pZHB8bW1wfG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIChjZXxwaG9uZSl8eGRhfHhpaW5vL2kudGVzdCh1YSkgfHwgLzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdCh1YS5zdWJzdHIoMCwgNCkpKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgaW9zOiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdCh1YSksXG4gICAgICAgIG1hYzogbmF2aWdhdG9yLnBsYXRmb3JtLnRvVXBwZXJDYXNlKCkuaW5kZXhPZignTUFDJykgPj0gMCxcbiAgICAgICAgaWU6IHVhLmluZGV4T2YoJ01TSUUgJykgPiAwIHx8ICEhdWEubWF0Y2goL1RyaWRlbnQuKnJ2XFw6MTFcXC4vKSxcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1hbnlcbiAgICAgICAgb3BlcmE6ICghISh3aW5kb3cgYXMgYW55KS5vcHIgJiYgISFvcHIuYWRkb25zKSB8fCAhISh3aW5kb3cgYXMgYW55KS5vcGVyYSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJyBPUFIvJykgPj0gMCxcbiAgICAgICAgZmlyZWZveDogdWEudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgc2FmYXJpOiAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KHVhKSxcbiAgICAgICAgd2luZG93czogd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3dpbicpID4gLTEsXG4gICAgfTtcblxuICAgICQoJ2h0bWwnKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21hYycsICFicm93c2VyLndpbmRvd3MgJiYgKGJyb3dzZXIuaW9zIHx8IGJyb3dzZXIubWFjKSlcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCd3aW5kb3dzJywgYnJvd3Nlci53aW5kb3dzICYmICFicm93c2VyLm1hYyAmJiAhYnJvd3Nlci5pb3MpXG4gICAgICAgIC50b2dnbGVDbGFzcygnbW9iaWxlJywgYnJvd3Nlci5tb2JpbGUpXG4gICAgICAgIC50b2dnbGVDbGFzcygnZmlyZWZveCcsIGJyb3dzZXIuZmlyZWZveClcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdzYWZhcmknLCBicm93c2VyLnNhZmFyaSlcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdpZScsIGJyb3dzZXIuaWUpO1xuXG4gICAgcmV0dXJuIGJyb3dzZXI7XG59XG5cblxuZXhwb3J0IGNsYXNzIEJyb3dzZXIge1xuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xuICAgICAgICBicm93c2VyID0gZ2V0QnJvd3NlcigpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFNsaWRlciB9IGZyb20gJy4vY29tcG9uZW50cy9TbGlkZXInO1xuaW1wb3J0IHsgVG9vbHRpcCB9IGZyb20gJy4vY29tcG9uZW50cy9Ub29sdGlwJztcbmltcG9ydCB7IERyb3Bkb3duIH0gZnJvbSAnLi9jb21wb25lbnRzL0Ryb3Bkb3duJztcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL2NvbXBvbmVudHMvRmlsdGVycyc7XG5pbXBvcnQgeyBEYXNoYm9hcmQgfSBmcm9tICcuL2NvbXBvbmVudHMvRGFzaGJvYXJkJztcbmltcG9ydCB7IFN0YXRzIH0gZnJvbSAnLi9jb21wb25lbnRzL1N0YXRzJztcbmltcG9ydCB7IE1hc29ucnkgfSBmcm9tICcuL2NvbXBvbmVudHMvTWFzb25yeSc7XG5pbXBvcnQgeyBSYW5nZSB9IGZyb20gJy4vY29tcG9uZW50cy9SYW5nZSc7XG5pbXBvcnQgeyBDaGFydCB9IGZyb20gJy4vY29tcG9uZW50cy9DaGFydCc7XG5pbXBvcnQgeyBBc2lkZSB9IGZyb20gJy4vY29tcG9uZW50cy9Bc2lkZSc7XG5pbXBvcnQgeyBQYXJhbGxheCB9IGZyb20gJy4vY29tcG9uZW50cy9QYXJhbGxheCc7XG5cbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xuXG5leHBvcnQgY29uc3QgY29tcG9uZW50cyA9IHtcbiAgICBTbGlkZXIsXG4gICAgVG9vbHRpcCxcbiAgICBEcm9wZG93bixcbiAgICBGaWx0ZXJzLFxuICAgIERhc2hib2FyZCxcbiAgICBTdGF0cyxcbiAgICBNYXNvbnJ5LFxuICAgIFJhbmdlLFxuICAgIENoYXJ0LFxuICAgIFBhcmFsbGF4LFxuICAgIEFzaWRlXG59O1xuXG5cbmV4cG9ydCBjb25zdCBwYWdlcyA9IHtcbiAgICBQYWdlXG59O1xuXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9jbGlwYm9hcmQuZC50c1wiIC8+XG5cblxuXG5leHBvcnQgY2xhc3MgQ29weSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgICQoJ1tkYXRhLWNvcHldJykub24oJ2NsaWNrJywgKGUpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgICAgICh3aW5kb3cuQ2xpcGJvYXJkIGFzIGFueSkuY29weSh1cmwpO1xuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuaW5mbygnXCIlc1wiIGNvcGllZCcsIHVybCk7XG5cbiAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtY29waWVkJyk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgJGVsLnJlbW92ZUNsYXNzKCdpcy1jb3BpZWQnKTsgfSwgMTAwMCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsImV4cG9ydCBhYnN0cmFjdCBjbGFzcyBIYW5kbGVyIHtcblxuXG4gICAgcHJpdmF0ZSBldmVudHM6IHsgW2tleTogc3RyaW5nXTogRnVuY3Rpb25bXSB9O1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQXR0YWNoIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xuICAgICAqIEBwYXJhbSAge0Z1bmN0aW9ufSBoYW5kbGVyICAgY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKiBAcmV0dXJuIHtIYW5kbGVyfSAgICAgICAgICAgIHJldHVybnMgY3VycmVudCBvYmplY3RcbiAgICAgKi9cbiAgICBwdWJsaWMgb24oZXZlbnROYW1lOiBzdHJpbmcsIGhhbmRsZXI6IEZ1bmN0aW9uKTogSGFuZGxlciB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIERldGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gICBldmVudE5hbWUgcGxlYXNlIHVzZSBzdGF0aWMgbmFtZXNcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHVibGljIG9mZihldmVudE5hbWU/OiBzdHJpbmcsIGhhbmRsZXI/OiBGdW5jdGlvbik6IEhhbmRsZXIge1xuXG4gICAgICAgIGlmICh0eXBlb2YgZXZlbnROYW1lID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJyAmJiB0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ldmVudHNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xuXG4gICAgICAgIGlmICggaW5kZXggPiAtMSApIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBDYWxsIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50TmFtZVxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSAuLi5leHRyYVBhcmFtZXRlcnMgcGFzcyBhbnkgcGFyYW1ldGVycyB0byBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqL1xuICAgIHB1YmxpYyB0cmlnZ2VyKGV2ZW50TmFtZTogc3RyaW5nLCAuLi5leHRyYVBhcmFtZXRlcnMpOiB2b2lkIHtcblxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkgeyByZXR1cm47IH1cbiAgICAgICAgY29uc3QgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXS5mb3JFYWNoKGV2ZW50ID0+IGV2ZW50LmFwcGx5KHRoaXMsIFtdLnNsaWNlLmNhbGwoYXJncywgMSkpKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgfVxufVxuXG4iLCJleHBvcnQgY2xhc3MgTG9hZGVyIHtcblxuICAgIHByaXZhdGUgcHJvZ3Jlc3M6IG51bWJlcjtcbiAgICBwcml2YXRlIHdpZHRoOiBudW1iZXI7XG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2luZG93LmlubmVyV2lkdGg7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgc2hvdygpOiB2b2lkIHtcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgeTogMCwgZHVyYXRpb246IDAuMiB9KTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIGhpZGUoKTogdm9pZCB7XG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuNSwgeTogMTAsIHdpZHRoOiB0aGlzLndpZHRoIHx8ICcxMDAlJyB9KTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHNldChwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSBwcm9ncmVzcztcblxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsneSddKTtcblxuICAgICAgICBsZXQgd2lkdGggPSB0aGlzLndpZHRoICogcHJvZ3Jlc3M7XG5cbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3dpZHRoJ10pO1xuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyBkdXJhdGlvbjogMC4zLCB3aWR0aDogd2lkdGggfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyByZXNpemUod2R0OiBudW1iZXIsIGhndDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3ZHQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4vSGFuZGxlcic7XG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XG5pbXBvcnQgeyAkYm9keSwgJGFydGljbGUsICRwYWdlSGVhZGVyIH0gZnJvbSAnLi9TaXRlJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4vVXRpbHMnO1xuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xuLy8gaW1wb3J0IHsgU2lnbnVwIH0gZnJvbSAnLi9TaWdudXAnO1xuXG5cbi8qIHRzbGludDpkaXNhYmxlOnZhcmlhYmxlLW5hbWUgZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWFueSAqL1xubGV0IEhpc3RvcnlqczogSGlzdG9yeWpzID0gPGFueT5IaXN0b3J5O1xuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cblxuXG5cbmV4cG9ydCBjbGFzcyBQdXNoU3RhdGVzRXZlbnRzIHtcbiAgICBwdWJsaWMgc3RhdGljIENIQU5HRSA9ICdzdGF0ZSc7XG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XG59XG5cblxuXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlcyBleHRlbmRzIEhhbmRsZXIge1xuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFB1c2hTdGF0ZXM7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBUSU1FX0xJTUlUID0gNTAwMDtcbiAgICBwcml2YXRlIHN0YXRpYyBub0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSBsb2FkZWREYXRhOiBzdHJpbmc7XG4gICAgcHJpdmF0ZSByZXF1ZXN0OiBYTUxIdHRwUmVxdWVzdDtcbiAgICBwcml2YXRlIHRpbWVvdXQ7XG5cblxuXG4gICAgLyoqIGNoYW5nZSBkb2N1bWVudCB0aXRsZSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgc2V0VGl0bGUodGl0bGU/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSB8fCAkKCcjbWFpbiA+IFtkYXRhLXRpdGxlXScpLmRhdGEoJ3RpdGxlJyk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgYW5kIHRyaWdnZXIgSGlzdG9yeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgZ29Ubyhsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGxldCBwYXRobmFtZSA9IGxvY2F0aW9uLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLnByb3RvY29sICsgd2luZG93LmxvY2F0aW9uLmhvc3QsICcnKSxcbiAgICAgICAgICAgIGlzRGlmZmVyZW50ID0gcGF0aG5hbWUgIT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcblxuICAgICAgICBpZiAoTW9kZXJuaXpyLmhpc3RvcnkpIHtcbiAgICAgICAgICAgIGlmICghIXJlcGxhY2UpIHtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGlzRGlmZmVyZW50O1xuICAgIH1cblxuXG5cbiAgICAvKiogb25seSBjaGFuZ2UgbG9hY3Rpb24gcGF0aG5hbWUgd2l0aG91dCB0cmlnZ2VyaW5nIEhpc3RvcnkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGNoYW5nZVBhdGgobG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4sIHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XG5cbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IHRydWU7XG4gICAgICAgIGxldCBjaGFuZ2VkID0gUHVzaFN0YXRlcy5nb1RvKGxvY2F0aW9uLCByZXBsYWNlIHx8IHRydWUpO1xuICAgICAgICBQdXNoU3RhdGVzLm5vQ2hhbmdlID0gZmFsc2U7XG5cbiAgICAgICAgaWYgKCEhY2hhbmdlZCkge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSh0aXRsZSB8fCBkb2N1bWVudC50aXRsZSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgdG8gYmUgdXNlZCB3aXRoIFB1c2hTdGF0ZXMgLyBIaXN0b3J5ICovXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IEVsZW1lbnQgfCBOb2RlTGlzdCB8IEVsZW1lbnRbXSB8IHN0cmluZywgZWxlbWVudEl0c2VsZj86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgaWYgKCFlbGVtZW50SXRzZWxmKSB7XG4gICAgICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLmJpbmRMaW5rcyh0YXJnZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGluayh0YXJnZXQgYXMgRWxlbWVudCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogZ28gYmFjayBpbiBicm93c2VyIGhpc3RvcnlcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9uYWwgZmFsbGJhY2sgdXJsICh3aGVuIGJyb3dzZXIgZGVvZXNuJ3QgaGF2ZSBhbnkgaXRlbXMgaW4gaGlzdG9yeSlcbiAgICAgKi9cbiAgICBwdWJsaWMgc3RhdGljIGJhY2sodXJsPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGlmIChoaXN0b3J5Lmxlbmd0aCA+IDIpIHsgLy8gfHwgZG9jdW1lbnQucmVmZXJyZXIubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgSGlzdG9yeWpzLmJhY2soKTtcbiAgICAgICAgfSBlbHNlIGlmICh1cmwpIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCB1cmwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsICcvJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHVibGljIHN0YXRpYyByZWxvYWQoKTogdm9pZCB7XG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBzZXROYXZiYXJWaXNpYmlsaXR5KCk6IHZvaWQge1xuXG4gICAgICAgIGlmICghJHBhZ2VIZWFkZXIpIHtcbiAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICRib2R5LmFkZENsYXNzKCduYXZiYXItYWx3YXlzLXNob3duJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGFzaWRlVG9nZ2xlID0gKGU/KTogdm9pZCA9PiB7XG4gICAgICAgIGxldCBlbCA9IGUgPyAkKGUuY3VycmVudFRhcmdldCkgOiAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XG4gICAgICAgIFxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtYXNpZGUtb3BlbicpO1xuICAgICAgICBlbC50b2dnbGVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgICAgIGlmIChlbC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyd3aWxsLWNoYW5nZSc6ICd0cmFuc2Zvcm0nfSk7XG4gICAgICAgICAgICBVdGlscy5kaXNhYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGdzYXAuc2V0KCRhcnRpY2xlLCB7IGNsZWFyUHJvcHM6ICd3aWxsLWNoYW5nZSd9KTtcbiAgICAgICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgQXNpZGUuYXNpZGVBbmltYXRpb24oKTtcblxuXG4gICAgICAgIC8vIHJldHVybjtcbiAgICB9XG5cblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICBpZiAoSGlzdG9yeWpzKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xuICAgICAgICAgICAgSGlzdG9yeWpzLkFkYXB0ZXIuYmluZCh3aW5kb3csICdzdGF0ZWNoYW5nZScsIHRoaXMub25TdGF0ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlID0gdGhpcztcblxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG4gICAgfVxuXG5cblxuXG4gICAgLyoqXG4gICAgICogbG9hZCBuZXcgY29udGVudCB2aWEgYWpheCBiYXNlZCBvbiBjdXJyZW50IGxvY2F0aW9uOlxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHByb21pc2UgcmVzb2x2ZWQgd2hlbiBYTUxIdHRwUmVxdWVzdCBpcyBmaW5pc2hlZFxuICAgICAqL1xuICAgIHB1YmxpYyBsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcbiAgICAgICAgaWYgKHRoaXMucmVxdWVzdCkge1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LmFib3J0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkZWZpbmUgdXJsXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgY29uc3Qgc2VhcmNoOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoIHx8ICcnO1xuICAgICAgICBjb25zdCB1cmwgPSBwYXRoICsgc2VhcmNoO1xuXG4gICAgICAgIC8vIGRlZmluZSB0aW1lb3V0XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBQdXNoU3RhdGVzLlRJTUVfTElNSVQpO1xuXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXG4gICAgICAgIC8vIGFuZCBkbyB0aGUgcmVxdWVzdDpcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgLy8gZG8gdGhlIHVzdWFsIHhociBzdHVmZjpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignWC1SZXF1ZXN0ZWQtV2l0aCcsICdYTUxIdHRwUmVxdWVzdCcpO1xuXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vbmxvYWQgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sb2FkZWREYXRhID0gdGhpcy5yZXF1ZXN0LnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICAgICAgICAgIHJlamVjdChFcnJvcih0aGlzLnJlcXVlc3Quc3RhdHVzVGV4dCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3Quc3RhdHVzVGV4dCAhPT0gJ2Fib3J0Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBjYXRjaGluZyBlcnJvcnM6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Qub25lcnJvciA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvLyBjYXRjaCBwcm9ncmVzc1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIGUubG9hZGVkIC8gZS50b3RhbCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnNlbmQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBmdW5jdGlvbiBjYWxsZWQgb24gc3VjY2Vzc2Z1bCBkYXRhIGxvYWQgKi9cbiAgICBwdWJsaWMgcmVuZGVyKCk6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IGRhdGE6IHN0cmluZyA9IHRoaXMubG9hZGVkRGF0YS50cmltKCk7XG4gICAgICAgIGNvbnN0IGNvbnRhaW5lcnM6IGFueSA9ICQoJy5qcy1yZXBsYWNlW2lkXSwgI21haW4nKS50b0FycmF5KCk7XG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcblxuICAgICAgICAvLyByZW5kZXIgZWFjaCBvZiBjb250YWluZXJzXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxuICAgICAgICBpZiAoY29udGFpbmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb250YWluZXJzLmZvckVhY2goKGNvbnRhaW5lciwgaW5kZXgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZS10cnkgcmVuZGVyaW5nIGlmIG5vbmUgb2YgY29udGFpbmVycyB3ZXJlIHJlbmRlcmVkOlxuICAgICAgICBpZiAocmVuZGVyZWRDb3VudCA9PT0gMCAmJiBjb250YWluZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcblxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcbiAgICAgICAgd2luZG93LmRvY3VtZW50LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KCdhamF4X2xvYWRlZCcpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGxldCBjb2RlOiBzdHJpbmcgPSBudWxsO1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcblxuICAgICAgICBpZiAoISFmb3JjZVBsYWluICYmIGRhdGEuaW5kZXhPZignPGFydGljbGUnKSA9PT0gMCAmJiBlbC5pZCA9PT0gJ2FydGljbGUtbWFpbicpIHtcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgJGxvYWRlZENvbnRlbnQ6IEpRdWVyeSA9ICQoJChkYXRhKS5maW5kKGNvbnRhaW5lcilbMF0gfHwgJChkYXRhKS5maWx0ZXIoY29udGFpbmVyKVswXSk7XG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XG5cbiAgICAgICAgJChjb250YWluZXIpXG4gICAgICAgICAgICAuaGlkZSgpXG4gICAgICAgICAgICAuZW1wdHkoKVxuICAgICAgICAgICAgLmh0bWwoY29kZSB8fCBkYXRhKVxuICAgICAgICAgICAgLnNob3coKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgKi9cbiAgICBwcml2YXRlIGJpbmRMaW5rKHRhcmdldDogRWxlbWVudCk6IHZvaWQge1xuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGJpbmQgbGlua3MgKi9cbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcblxuICAgICAgICB0YXJnZXQgPSB0YXJnZXQgfHwgJ2JvZHknO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWhpc3Rvcnk9XCJmYWxzZVwiXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcbiAgICAgICAgICAgIC5ub3QoJ1tkb3dubG9hZF0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtbW9kYWxdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWYkPVwiLmpwZ1wiXScpXG4gICAgICAgICAgICAubm90KCdbdGFyZ2V0PVwiX2JsYW5rXCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWZePVwidGVsOlwiXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1wb2N6dGFdJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1sYW5nXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1zY3JvbGwtdG9dJylcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiaHR0cFwiXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpO1xuXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5JylcbiAgICAgICAgICAgIC5vbignY2xpY2suaGlzdG9yeScsIHRoaXMub25IYXNoQ2xpY2spO1xuXG5cbiAgICAgICAgJCgnW2RhdGEtaGFtYnVyZ2VyXScpLm9uKCdjbGljaycsIFB1c2hTdGF0ZXMuYXNpZGVUb2dnbGUpO1xuICAgIH1cblxuICAgIHByaXZhdGUgb25MYW5ndWFnZUNsaWNrID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBjb25zdCBsYW5nID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2xhbmcnKTtcbiAgICAgICAgY29uc3QgYWx0ZXJuYXRlID0gJCgnW2RhdGEtYWx0ZXJuYXRlXScpLmRhdGEoJ2FsdGVybmF0ZScpO1xuICAgICAgICBjb25zdCBhcnRpY2xlVVJMID0gYWx0ZXJuYXRlID8gYWx0ZXJuYXRlW2xhbmcgfHwgT2JqZWN0LmtleXMoYWx0ZXJuYXRlKVswXV0gOiBudWxsO1xuICAgICAgICBjb25zdCBoZWFkTGluayA9ICQoJ2xpbmtbcmVsPVwiYWx0ZXJuYXRlXCJdW2hyZWZsYW5nXScpWzBdIGFzIEhUTUxMaW5rRWxlbWVudDtcbiAgICAgICAgY29uc3QgaGVhZFVSTCA9IGhlYWRMaW5rID8gaGVhZExpbmsuaHJlZiA6IG51bGw7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oYXJ0aWNsZVVSTCB8fCBoZWFkVVJMIHx8IGUuY3VycmVudFRhcmdldC5ocmVmKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIGxpbmtzIGNsaWNrIGhhbmRsZXIgKi9cbiAgICBwcml2YXRlIG9uQ2xpY2sgPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcblxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGxldCAkc2VsZjogSlF1ZXJ5ID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpLFxuICAgICAgICAgICAgc3RhdGU6IHN0cmluZyA9ICRzZWxmLmF0dHIoJ2hyZWYnKS5yZXBsYWNlKCdodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXG4gICAgICAgICAgICB0eXBlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdkYXRhLWhpc3RvcnknKTtcbiAgICAgICAgXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdiYWNrJykge1xuICAgICAgICAgICAgICAgIFB1c2hTdGF0ZXMuYmFjayhzdGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZXBsYWNlJykge1xuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIFNjcm9sbC5yZXNldFNjcm9sbENhY2hlKHN0YXRlKTtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICB9XG5cblxuXG4gICAgLyoqIG9uIGhhc2gtbGluayBjbGljayBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIGxpbmsnKTtcbiAgICAgICAgaWYgKCRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuYXNpZGVUb2dnbGUoKTtcblxuICAgICAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgICAgICAgICAgfSwgNTAwKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBIaXN0b3J5anMgYHN0YXRlY2hhbmdlYCBldmVudCBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xuICAgICAgICBpZiAoIVB1c2hTdGF0ZXMubm9DaGFuZ2UpIHtcbiAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLyoqIG1hcmsgbGlua3MgYXMgYWN0aXZlICovXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVMaW5rcygpOiB2b2lkIHtcbiAgICAgICAgJCgnYVtocmVmXScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgJCgnYVtocmVmPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgfVxufVxuXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9nc2FwLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvc3BsaXQtdGV4dC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi9QdXNoU3RhdGVzJztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xuLy8gaW1wb3J0IHsgUHJvZ3Jlc3NiYXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZ3Jlc3NiYXInO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xuaW1wb3J0IEJhY2tncm91bmQgZnJvbSAnLi9iYWNrZ3JvdW5kcy9CYWNrZ3JvdW5kJztcbmltcG9ydCB7ICR3aW5kb3csICRib2R5IH0gZnJvbSAnLi9TaXRlJztcbmltcG9ydCB7IGNvbXBvbmVudHMgfSBmcm9tICcuL0NsYXNzZXMnO1xuXG5pbnRlcmZhY2UgSUJhY2tncm91bmREYXRhIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHN0ZXA6IG51bWJlcjtcbiAgICBkYXJrZW46IGJvb2xlYW47XG4gICAgZGFya2VuRGVsYXk6IG51bWJlcjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJU2Nyb2xsUGFyYW1zIGV4dGVuZHMgT2JqZWN0IHtcbiAgICB4PzogbnVtYmVyO1xuICAgIHk/OiBudW1iZXI7XG4gICAgc3BlZWQ/OiBudW1iZXI7XG4gICAgYW5pbWF0ZT86IGJvb2xlYW47XG4gICAgcmVsYXRpdmVTcGVlZD86IGJvb2xlYW47XG4gICAgZWFzZT86IHN0cmluZztcbn1cblxuXG5pbnRlcmZhY2UgSUJhc2VDYWNoZUl0ZW0ge1xuICAgICRlbD86IEpRdWVyeTtcbiAgICBkb25lPzogYm9vbGVhbjtcbiAgICBoZWlnaHQ/OiBudW1iZXI7XG4gICAgc3RhcnQ/OiBudW1iZXI7XG4gICAgdHlwZT86IHN0cmluZztcbiAgICB5PzogbnVtYmVyO1xuICAgIGNvbXBvbmVudD86IENvbXBvbmVudDtcbn1cblxuaW50ZXJmYWNlIElTY3JvbGxpbmdEYXRhIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIHRvcDogbnVtYmVyO1xuICAgIHJvbGU6IHN0cmluZztcbiAgICBwYXRoPzogc3RyaW5nO1xuICAgIHRpdGxlPzogc3RyaW5nO1xuICAgIGJvdHRvbT86IG51bWJlcjtcbiAgICBjaGlsZHJlbj86IGFueTtcbiAgICAkY2hpbGQ/OiBKUXVlcnk7XG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XG4gICAgZGVsYXk/OiBudW1iZXI7XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGluaXRpYWxpemVkPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIElQYXJhbGxheENhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBzaGlmdD86IG51bWJlcjtcbiAgICAkY2hpbGQ/OiBKUXVlcnk7XG4gICAgY2hpbGRIZWlnaHQ/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBJQW5pbWF0aW9uQ2FjaGVJdGVtIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIHVuY2FjaGU/OiBib29sZWFuO1xufVxuXG5pbnRlcmZhY2UgSVNjcm9sbENhY2hlIHtcbiAgICBhbmltYXRpb25zPzogSUFuaW1hdGlvbkNhY2hlSXRlbVtdO1xuICAgIHBhcmFsbGF4ZXM/OiBJUGFyYWxsYXhDYWNoZUl0ZW1bXTtcbiAgICBtb2R1bGVzPzogSUJhc2VDYWNoZUl0ZW1bXTtcbiAgICBiYWNrZ3JvdW5kcz86IElCYWNrZ3JvdW5kQ2FjaGVJdGVtW107XG4gICAgc2VjdGlvbnM/OiBJU2Nyb2xsaW5nRGF0YVtdO1xuXG59XG5cbmludGVyZmFjZSBJQmFja2dyb3VuZENhY2hlSXRlbSBleHRlbmRzIElCYWNrZ3JvdW5kRGF0YSwgSUJhc2VDYWNoZUl0ZW0ge1xuICAgIHBlcmNlbnRhZ2U/OiBudW1iZXI7XG4gICAgaW5kZXg/OiBudW1iZXI7XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIGJyZWFrcG9pbnRzPzogc3RyaW5nW107XG59XG5cblxuXG5leHBvcnQgY2xhc3MgU2Nyb2xsIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFNjcm9sbDtcbiAgICBwdWJsaWMgc3RhdGljIHdpbmRvd0hlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBzdGF0aWMgaGVhZGVySGVpZ2h0OiBudW1iZXI7XG4gICAgcHVibGljIHN0YXRpYyBtYXhTY3JvbGw6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9wOiBudW1iZXI7XG4gICAgLy8gcHVibGljIHN0YXRpYyBjdXN0b21TY3JvbGw6IFNjcm9sbGJhcjtcbiAgICBwcml2YXRlIHN0YXRpYyBjdXN0b21TY3JvbGw7XG4gICAgcHJpdmF0ZSBzdGF0aWMgYW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XG5cblxuICAgIHByaXZhdGUgY2FjaGU6IElTY3JvbGxDYWNoZSA9IHt9O1xuICAgIHByaXZhdGUgc2Nyb2xsQ2FjaGUgPSB7fTtcbiAgICBwcml2YXRlIGlnbm9yZUNhY2hlOiBib29sZWFuO1xuICAgIHByaXZhdGUgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcbiAgICBwcml2YXRlIHRhcmdldDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgc3RvcmVkUGF0aDogc3RyaW5nO1xuICAgIHByaXZhdGUgc2VjdGlvbnM6IEpRdWVyeTtcbiAgICBwcml2YXRlIGNoYW5naW5nUGF0aDogYm9vbGVhbjtcblxuXG4gICAgLyoqXG4gICAgICogc2Nyb2xscyBwYWdlIHRvIGNlcnRhaW4gZWxlbWVudCAodG9wIGVkZ2UpIHdpdGggc29tZSBzcGVlZFxuICAgICAqIEBwYXJhbSAge0pRdWVyeX0gICAgICAgICRlbCAgICBbdGFyZ2V0IGVsbWVudF1cbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICBvZmZzZXRcbiAgICAgKiBAcGFyYW0gIHtudW1iZXJ9ICAgICAgICBkdXJhdGlvblxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59ICAgICAgICBbYWZ0ZXIgY29tcGxldGVkIGFuaW1hdGlvbl1cbiAgICAgKi9cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9FbGVtZW50KCRlbDogSlF1ZXJ5LCBvZmZzZXQ/OiBudW1iZXIsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgU2Nyb2xsLmFuaW1hdGluZyA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB5ID0gJGVsLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgKyAob2Zmc2V0IHx8IDApO1xuICAgICAgICAgICAgY29uc3Qgb2JqID0ge1xuICAgICAgICAgICAgICAgIHk6IE1hdGgubWF4KGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wLCB3aW5kb3cucGFnZVlPZmZzZXQpLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2Yob2JqKTtcbiAgICAgICAgICAgIGdzYXAudG8ob2JqLCB7XG4gICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogZHVyYXRpb24sXG4gICAgICAgICAgICAgICAgb25VcGRhdGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIG9iai55KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgU2Nyb2xsLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIHJlc2V0U2Nyb2xsQ2FjaGUocGF0aG5hbWUpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlLmNhY2hlW3BhdGhuYW1lXSA9IDA7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gdHJ1ZTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc2FibGVkID0gZmFsc2U7XG4gICAgfVxuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHRoaXMuaWdub3JlQ2FjaGUgPSAhIWJyb3dzZXIuc2FmYXJpO1xuXG4gICAgICAgICQod2luZG93KS5vbignc2Nyb2xsJywgdGhpcy5vblNjcm9sbCk7XG4gICAgICAgIC8vICQoJ2FbaHJlZl49XCIjXCJdOm5vdChcIi5qcy1uYXYtaXRlbSwgW2RhdGEtbGlnaHRib3hdXCIpJykub24oJ2NsaWNrJywgdGhpcy5vbkhhc2hDbGlja0hhbmRsZXIpO1xuICAgICAgICB0aGlzLmJhY2tncm91bmRzID0gdGhpcy5idWlsZEJhY2tncm91bmRzKCk7XG4gICAgICAgIC8vIFNjcm9sbC5pc0N1c3RvbVNjcm9sbCA9ICQoJyN3cGJzJykuZGF0YSgnc2Nyb2xsYmFyJyk7XG5cbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9IDcwO1xuICAgICAgICBTY3JvbGwuaW5zdGFuY2UgPSB0aGlzO1xuXG4gICAgICAgIHRoaXMuc3RvcmVkUGF0aCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgdGhpcy50YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVzaXplKCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwud2luZG93SGVpZ2h0ID0gd2luZG93LmlubmVySGVpZ2h0O1xuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gJCgnI25hdmJhcicpLmhlaWdodCgpO1xuICAgICAgICBTY3JvbGwubWF4U2Nyb2xsID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gU2Nyb2xsLndpbmRvd0hlaWdodCArIFNjcm9sbC5oZWFkZXJIZWlnaHQ7XG5cbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xuXG5cbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcbiAgICB9XG5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG1lbWJlci1vcmRlcmluZ1xuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9QYXRoKGZhc3Q/OiBib29sZWFuKTogYm9vbGVhbiB7XG5cbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQoJ1tkYXRhLXBhdGg9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpO1xuXG4gICAgICAgIGlmICgkdGFyZ2V0WzBdKSB7XG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCR0YXJnZXQsIDAsIDApO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcbiAgICAgICAgaWYgKCEhdGhpcy5jaGFuZ2luZ1BhdGgpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICAgIHJldHVybiBTY3JvbGwuc2Nyb2xsVG9QYXRoKCk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0b3AoKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC5kaXNhYmxlKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGxvYWQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2VjdGlvbnMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJykub24oJ3Njcm9sbC5zY3JvbGxpbmcnLCAoKSA9PiB0aGlzLm9uU2Nyb2xsKCkpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHN0YXJ0KCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwuZW5hYmxlKCk7XG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5vblNjcm9sbCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhY2hlID0ge307XG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJyk7XG4gICAgfVxuXG4gICAgLy8gcHJpdmF0ZSBvbkhhc2hDbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gICAgIC8vIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAvLyAgICAgaWYgKCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykpIHtcbiAgICAvLyAgICAgICAgIGxldCBvZmZzZXQgPSBwYXJzZUludCgkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpLCAxMCk7XG5cbiAgICAvLyAgICAgICAgIGlmICggdHlwZW9mICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykgPT09ICdzdHJpbmcnICkge1xuICAgIC8vICAgICAgICAgICAgIGNvbnN0IG9mZiA9ICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykucmVwbGFjZSgndmgnLCAnJyk7XG4gICAgLy8gICAgICAgICAgICAgb2Zmc2V0ID0gJCh3aW5kb3cpLmhlaWdodCgpICogKHBhcnNlSW50KG9mZiwgMTApIC8gMTAwKTtcbiAgICAvLyAgICAgICAgIH1cblxuICAgIC8vICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSwgb2Zmc2V0KTtcbiAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCkpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfTtcblxuXG4gICAgcHJpdmF0ZSBidWlsZEJhY2tncm91bmRzKCk6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kIH0ge1xuICAgICAgICBsZXQgYmdzID0ge307XG4gICAgICAgICQoJ1tkYXRhLWJnLWNvbXBvbmVudF0nKS50b0FycmF5KCkuZm9yRWFjaCgoZWwsIGkpID0+IHtcbiAgICAgICAgICAgIGxldCAkYmdFbCA9ICQoZWwpO1xuICAgICAgICAgICAgbGV0IGJnTmFtZSA9ICRiZ0VsLmRhdGEoJ2JnLWNvbXBvbmVudCcpO1xuICAgICAgICAgICAgbGV0IGJnT3B0aW9ucyA9ICRiZ0VsLmRhdGEoJ29wdGlvbnMnKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50c1tiZ05hbWVdICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGJnID0gbmV3IGNvbXBvbmVudHNbYmdOYW1lXSgkYmdFbCwgYmdPcHRpb25zKTtcbiAgICAgICAgICAgICAgICBiZy5pZCA9IGVsLmlkO1xuICAgICAgICAgICAgICAgIGJnc1tlbC5pZF0gPSBiZztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gXCIlc1wiIGNvbXBvbmVudCBhdmFpbGFibGUhJywgYmdOYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGJncywgJ0JHUyBTQ1JPTEwnKTtcbiAgICAgICAgcmV0dXJuIGJncztcbiAgICB9XG5cblxuICAgIHByaXZhdGUgc2F2ZUNhY2hlKCk6IHZvaWQge1xuICAgICAgICAvLyBpZiAoIXRoaXMuZWxlbWVudHMpIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnM6IEFycmF5PElBbmltYXRpb25DYWNoZUl0ZW0+ID0gW107XG4gICAgICAgIGNvbnN0IG1hcmdpbiA9IDAgO1xuXG4gICAgICAgIC8vIGxldCBzZWN0aW9uczogQXJyYXk8SVNjcm9sbGluZ0RhdGE+ID0gW107XG4gICAgICAgIC8vIGlmICh0aGlzLnNlY3Rpb25zKSB7XG5cbiAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGg7ICsraSkge1xuXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSB0aGlzLnNlY3Rpb25zLmVxKGkpO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJvbGUgPSAkZWwuZGF0YSgnc2Nyb2xsJyk7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdG9wID0gJGVsLm9mZnNldCgpLnRvcDtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBoZWlnaHQgPSAkZWwub3V0ZXJIZWlnaHQoKTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkZWxheSA9ICRlbC5kYXRhKCdkZWxheScpIHx8IDA7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgdGl0bGUgPSAkZWwuZGF0YSgndGl0bGUnKSB8fCBmYWxzZTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBwYXRoID0gJGVsLmRhdGEoJ3BhdGgnKSB8fCBmYWxzZTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkYXRhOiBJU2Nyb2xsaW5nRGF0YSA9IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgIC8vICAgICAgICAgICAgIHJvbGU6IHJvbGUsXG4gICAgICAgIC8vICAgICAgICAgICAgIHRvcDogdG9wLFxuICAgICAgICAvLyAgICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgLy8gICAgICAgICAgICAgYm90dG9tOiB0b3AgKyBoZWlnaHQsXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgIC8vICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgLy8gICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRyZW46IHt9LFxuICAgICAgICAvLyAgICAgICAgICAgICBzaG93bjogJGVsLmRhdGEoJ3Nob3duJykgfHwgZmFsc2UsXG4gICAgICAgIC8vICAgICAgICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgLy8gICAgICAgICB9O1xuXG4gICAgICAgIC8vICAgICAgICAgc2VjdGlvbnMucHVzaChkYXRhKTtcbiAgICAgICAgLy8gICAgICAgICAkZWwuZGF0YSgnY2FjaGUnLCBpKTtcbiAgICAgICAgLy8gICAgIH1cbiAgICAgICAgLy8gfVxuXG5cbiAgICAgICAgJCgnW2RhdGEtYW5pbWF0aW9uXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xuICAgICAgICAgICAgYW5pbWF0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICBzdGFydDogdHlwZW9mICRlbC5kYXRhKCdzdGFydCcpICE9PSAndW5kZWZpbmVkJyA/ICRlbC5kYXRhKCdzdGFydCcpIDogMC4xLFxuICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AgLSBtYXJnaW4sXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICBkb25lOiAkZWwuaGFzQ2xhc3MoJ2FuaW1hdGVkJyksXG4gICAgICAgICAgICAgICAgdHlwZTogJGVsLmRhdGEoJ2FuaW1hdGlvbicpLFxuICAgICAgICAgICAgICAgIGRlbGF5OiAkZWwuZGF0YSgnZGVsYXknKSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHVuY2FjaGU6ICRlbC5kYXRhKCd1bmNhY2hlJyksXG4gICAgICAgICAgICAgICAgY29tcG9uZW50OiAkZWwuZGF0YSgnY29tcCcpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG5cblxuICAgICAgICBjb25zdCBwYXJhbGxheGVzOiBBcnJheTxJUGFyYWxsYXhDYWNoZUl0ZW0+ID0gW107XG4gICAgICAgICQoJ1tkYXRhLXBhcmFsbGF4XScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoPEhUTUxFbGVtZW50PmVsKTtcbiAgICAgICAgICAgIGNvbnN0IHAgPSAkZWwuZGF0YSgncGFyYWxsYXgnKTtcbiAgICAgICAgICAgIHBhcmFsbGF4ZXMucHVzaCh7XG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IDAsXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGVvZiBwID09PSAnc3RyaW5nJyA/IHAgOiBudWxsLFxuICAgICAgICAgICAgICAgIHNoaWZ0OiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBwIDogbnVsbCxcbiAgICAgICAgICAgICAgICBkb25lOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAkY2hpbGQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCksXG4gICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGJhY2tncm91bmRzOiBBcnJheTxJQmFja2dyb3VuZENhY2hlSXRlbT4gPSBbXTtcbiAgICAgICAgJCgnW2RhdGEtYmFja2dyb3VuZF0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmREYXRhID0gJGVsLmRhdGEoJ2JhY2tncm91bmQnKTtcbiAgICAgICAgICAgIGNvbnN0IGJyZWFrcG9pbnRzID0gYmFja2dyb3VuZERhdGEuYnJlYWtwb2ludHMgfHwgWydkZXNrdG9wJywgJ3RhYmxldCcsICdwaG9uZSddO1xuXG4gICAgICAgICAgICBpZiAoYnJlYWtwb2ludHMuaW5kZXhPZihicmVha3BvaW50LnZhbHVlKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmJhY2tncm91bmRzW2JhY2tncm91bmREYXRhLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3RoZXJlXFwncyBubyBiYWNrZ3JvdW5kIHdpdGggaWQ9JyArIGJhY2tncm91bmREYXRhLmlkICsgJyEnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kcy5wdXNoKCQuZXh0ZW5kKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogMSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGFya2VuRGVsYXk6IDAsXG4gICAgICAgICAgICAgICAgICAgIH0sIGJhY2tncm91bmREYXRhIHx8IHt9KSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG5cbiAgICAgICAgdGhpcy5jYWNoZS5hbmltYXRpb25zID0gYW5pbWF0aW9ucztcbiAgICAgICAgdGhpcy5jYWNoZS5wYXJhbGxheGVzID0gcGFyYWxsYXhlcztcbiAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcyA9IGJhY2tncm91bmRzO1xuICAgICAgICAvLyB0aGlzLmNhY2hlLnNlY3Rpb25zID0gc2VjdGlvbnM7XG5cblxuXG4gICAgICAgIHRoaXMub25TY3JvbGwoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvblNjcm9sbCA9ICgpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAoU2Nyb2xsLmRpc2FibGVkIHx8ICRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHsgcmV0dXJuOyB9XG5cbiAgICAgICAgY29uc3Qgc1QgPSB3aW5kb3cucGFnZVlPZmZzZXQgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFRvcCB8fCBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCB8fCAwO1xuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSBTY3JvbGwud2luZG93SGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JlZW5DZW50ZXI6IG51bWJlciA9IHNUICsgU2Nyb2xsLndpbmRvd0hlaWdodCAqIDAuMzM7XG4gICAgICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IFNjcm9sbC5oZWFkZXJIZWlnaHQ7XG4gICAgICAgIGNvbnN0IHNjcm9sbGVuZCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIHdpbmRvdy5pbm5lckhlaWdodCAtIDI7XG4gICAgICAgIGNvbnN0IHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykub2Zmc2V0KCkudG9wIC0gKFNjcm9sbC5oZWFkZXJIZWlnaHQgKiAyKSA6IDA7XG4gICAgICAgIGNvbnN0IGJhY2tncm91bmRzID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgOiAwO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9wID0gc1Q7XG4gICAgICAgIHRoaXMuc2Nyb2xsQ2FjaGVbd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXSA9IHNUO1xuXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC13aW5kb3ctaGVpZ2h0Jywgc1QgPiB3aW5kb3dIZWlnaHQgLSAxMDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtbmF2YmFyJywgc1QgPiAxMDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQnLCBzVCA+IDApO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcsIHNUID4gcGFnZUhlYWRlcik7XG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1iYWNrZ3JvdW5kcy1zY3JvbGxlZCcsIHNUID4gYmFja2dyb3VuZHMpO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsLWVuZCcsIHNUID49IHNjcm9sbGVuZCk7XG5cblxuICAgICAgICAvLyBhbmltYXRpb25zOlxuICAgICAgICBpZiAodGhpcy5jYWNoZS5hbmltYXRpb25zICYmIHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW06IElBbmltYXRpb25DYWNoZUl0ZW0gPSB0aGlzLmNhY2hlLmFuaW1hdGlvbnNbaV07XG4gICAgICAgICAgICAgICAgY29uc3QgeUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHlUb3A6IG51bWJlciA9IHNUO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1ZOiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0ueSA6IGl0ZW0uJGVsLm9mZnNldCgpLnRvcDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uZG9uZSAmJiBpdGVtWSA8PSB5Qm90dG9tICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcXVpY2s6IGJvb2xlYW4gPSB5VG9wID49IGl0ZW1ZICsgaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uY29tcG9uZW50ICYmIGl0ZW0udHlwZSA9PT0gJ3RvZ2dsZScgJiYgdHlwZW9mIGl0ZW0uY29tcG9uZW50WydlbmFibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jb21wb25lbnRbJ2VuYWJsZSddKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFuaW1hdGUoaXRlbSwgaXRlbS4kZWwsIGl0ZW0udHlwZSwgaXRlbS5kZWxheSwgcXVpY2spO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uZG9uZSAmJiBpdGVtLmNvbXBvbmVudCAmJiBpdGVtLnR5cGUgPT09ICd0b2dnbGUnICYmIChpdGVtWSA+IHlCb3R0b20gfHwgaXRlbVkgKyBpdGVtSGVpZ2h0IDwgeVRvcCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgaXRlbS5jb21wb25lbnRbJ2Rpc2FibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5jb21wb25lbnRbJ2Rpc2FibGUnXSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoaXRlbS51bmNhY2hlICYmIGl0ZW0uZG9uZSAmJiAoc1QgPD0gaXRlbVkgLSB3aW5kb3dIZWlnaHQgfHwgc1QgPj0gaXRlbVkgKyB3aW5kb3dIZWlnaHQgKSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmZpbmQoJy51bmNhY2hlZCcpLmxlbmd0aCA+IDApIHsgaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykucmVtb3ZlQXR0cignc3R5bGUnKTsgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuYXR0cignZGF0YS11bmNhY2hlJykpIHsgaXRlbS4kZWwucmVtb3ZlQXR0cignc3R5bGUnKTsgfVxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIHBhcmFsbGF4ZXM6XG4gICAgICAgIGlmICh0aGlzLmNhY2hlLnBhcmFsbGF4ZXMgJiYgdGhpcy5jYWNoZS5wYXJhbGxheGVzLmxlbmd0aCA+IDAgJiYgYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY2FjaGUucGFyYWxsYXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYWxsYXgodGhpcy5jYWNoZS5wYXJhbGxheGVzW2ldLCBzVCwgd2luZG93SGVpZ2h0LCAtaGVhZGVySGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cblxuICAgICAgICAvL2Jnc1xuICAgICAgICBpZiAodGhpcy5jYWNoZS5iYWNrZ3JvdW5kcykge1xuXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAuNSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIC8vIGNvbnN0IHdpbmRvd0NlbnRlcjogbnVtYmVyID0gMCAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGxldCBiZ3NUb1Nob3cgPSBbXTtcbiAgICAgICAgICAgIGxldCBiZ3NUb0hpZGUgPSBbXTtcblxuXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzLmZvckVhY2goKGl0ZW06IElCYWNrZ3JvdW5kQ2FjaGVJdGVtLCBpbmRleCkgPT4ge1xuXG5cbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLm91dGVySGVpZ2h0KCk7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUJvdHRvbTogbnVtYmVyID0gaXRlbVkgKyBpdGVtSGVpZ2h0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IHNUICsgaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcbiAgICAgICAgICAgICAgICAvLyBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBpdGVtLnN0YXJ0ICogd2luZG93SGVpZ2h0IDogd2luZG93Q2VudGVyO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHRoaXMuYmFja2dyb3VuZHNbaXRlbS5pZF07XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsYXkgPSB0eXBlb2YgaXRlbS5kZWxheSAhPT0gJ3VuZGVmaW5lZCcgPyBpdGVtLmRlbGF5IDogMC4xO1xuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnRhZ2UgPSAtIChpdGVtWSAtIHlDZW50ZXIpIC8gaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICBsZXQgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBsZXQgY3VycmVudCA9ICRib2R5Lmhhc0NsYXNzKCdpcy10cmFpbGVyLXNjcm9sbGVkJykgPyBzVCArIHdpbmRvd0hlaWdodCA+PSBpdGVtWSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QgOiBpdGVtWSAtIHNUIDw9IHdpbmRvd0NlbnRlciAmJiBpdGVtQm90dG9tIC0gc1QgPj0gd2luZG93Q2VudGVyO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMubGVuZ3RoID09PSAxKSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWJhY2tncm91bmQuc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIDIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnQpIHtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uc2hvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uc2hvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgZGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQudXBkYXRlKHBlcmNlbnRhZ2UpO1xuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLnNldFN0ZXAoaXRlbS5zdGVwLCBiYWNrZ3JvdW5kUXVpY2tTZXR1cCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmRhcmtlbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5kYXJrZW4oaXRlbVkgPD0geUNlbnRlciAtIHdpbmRvd0hlaWdodCAqIGl0ZW0uZGFya2VuRGVsYXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJnc1RvU2hvdy5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgIGJnc1RvSGlkZS5wdXNoKGl0ZW0uaWQpO1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaWYgKGJnc1RvSGlkZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBiZ3NUb0hpZGUuZm9yRWFjaCgoYmdJRCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYmdzVG9TaG93LmluZGV4T2YoYmdJRCkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJhY2tncm91bmRzW2JnSURdLmFuaW1hdGlvbk91dChmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzW2JnSURdLnNob3duPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgLy8gUHJvZ3Jlc3NiYXIudXBkYXRlKHNUKTtcbiAgICAgICAgfVxuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBhbmltYXRlKGRhdGE6IElBbmltYXRpb25DYWNoZUl0ZW0sICRlbDogSlF1ZXJ5LCB0eXBlOiBzdHJpbmcsIGRlbGF5OiBudW1iZXIgPSAwLjEgYXMgbnVtYmVyLCBxdWljaz86IGJvb2xlYW4sIHVuY2FjaGU/OiBib29sZWFuKTogdm9pZCB7XG5cbiAgICAgICAgY29uc3QgdGltZSA9ICFxdWljayA/IC42IDogMDtcblxuICAgICAgICBzd2l0Y2ggKHR5cGUpIHtcblxuICAgICAgICAgICAgY2FzZSAnZmFkZSc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZVVwJzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeTogNDAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZURvd24nOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiAtMTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVSaWdodCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFkZUxlZnQnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAxMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaVRhYnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbFRleHQgPSAkZWwuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJUZXh0ID0gJGVsLmZpbmQoJ3NwYW46bGFzdC1jaGlsZCcpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obFRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJzUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHJUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICctNTAlJywgb3BhY2l0eTogMCB9LCB7IHg6ICcwJScsIG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZWxlbWVudHMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ1tkYXRhLXZpZXctdGFiXScpLCB7IGR1cmF0aW9uOiAxLCB5OiAnMTAwJScgfSwge1xuICAgICAgICAgICAgICAgICAgICB5OiAnMCUnLCBzdGFnZ2VyOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5pdGVtX190YWJzJyksIHsgZHVyYXRpb246IDEsIG92ZXJmbG93OiAndW5zZXQnIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnZmFjdCc6XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGxldCBmVGV4dCA9ICRlbC5maW5kKCcuZmFjdF9fdGV4dCBzcGFuJyksXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0RlR4dCA9IG5ldyBTcGxpdFRleHQoZlRleHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycyd9KSxcbiAgICAgICAgICAgICAgICAgICAgZkltZyA9ICRlbC5maW5kKCcuZmFjdF9faW1hZ2Utd3JhcCcpLFxuICAgICAgICAgICAgICAgICAgICBmQXJyID0gJGVsLmZpbmQoJy5mYWN0X19pY29uJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKClcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmQXJyLCB7IGR1cmF0aW9uOiAxLCByb3RhdGU6IDkwIH0sIHsgcm90YXRlOiAwLCBkZWxheTogMC41IH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oc3BsaXRGVHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtNSB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDEgfSwgJy09MC44JylcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmSW1nLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxIH0sICctPTAuNScpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2xlYWQnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXQgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgbGluZXMnLCBsaW5lc0NsYXNzOiAnbGluZScgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZWwuZmluZCgnLmxpbmUnKTtcblxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYWZ0ZXIoJzxicj4nKTtcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYXBwZW5kKCc8c3BhbiBjbGFzcz1cImxpbmVfX2JnXCI+PC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0LndvcmRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xLCBkZWxheTogMC40IH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5saW5lX19iZycpLCB7IGR1cmF0aW9uOiAwLjc1LCBzY2FsZVg6IDEsIHN0YWdnZXI6IDAuMX0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMH0se3NjYWxlWDogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGRlbGF5fSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnY2hhcnMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEguY2hhcnMsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCwgb3BhY2l0eTogMCB9LCB7IHNjYWxlWDogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdjaGFycy1zaW1wbGUnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIMiA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRIMi5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnd29yZHMtc2ltcGxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMnIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXIgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21Ubyh3b3Jkcy53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJ9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpbWFnZXMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ2ltZycpLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBzdGFnZ2VyOiAwLjIgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaGVybyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBtYXAgPSAkZWwuZmluZCgnW2RhdGEtaXRlbT1cIjBcIl0gLmpzLW1hcCcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9FbCA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXSAuanMtZWwnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvQ2FwdGlvbiA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9OYXYgPSAkZWwuZmluZCgnLmpzLW5hdmlnYXRpb24nKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFttYXAsIGhlcm9FbCwgaGVyb05hdl0sIHsgb3BhY2l0eTogMH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obWFwLCAxLjUsIHtkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMC44NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXAuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvQ2FwdGlvbiwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC41LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZXJvQ2FwdGlvbi5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24uYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhlcm9FbCwgMSwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7b3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDEuMjUsIHN0YWdnZXI6IDAuMixcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvTmF2LCAxLCB7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiAxLjUsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9FbC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1yZWFkeScpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAncXVvdGUnOlxuICAgICAgICAgICAgICAgIGNvbnN0ICRxdW90ZSA9ICRlbC5maW5kKCcuanMtcXVvdGUtd29yZHMnKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkYXV0aG9yID0gJGVsLmZpbmQoJy5qcy1xdW90ZS1hdXRob3InKTtcbiAgICAgICAgICAgICAgICBjb25zdCAkbGluZSA9ICRlbC5maW5kKCdocicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoWyRxdW90ZSwgJGVsLCAkYXV0aG9yXSwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY2hpbGQgPSAkcXVvdGUuY2hpbGRyZW4oKTtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFF1b3RlID0gbmV3IFNwbGl0VGV4dCgkcXVvdGUsIHsgdHlwZTogJ3dvcmRzJyB9KTtcblxuICAgICAgICAgICAgICAgIC8vIEZPUiBVTkNBQ0hFIE9QVElPTiBPRiBBTklNQVRJT04gUVVPVEVcbiAgICAgICAgICAgICAgICAvLyBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXRRdW90ZS53b3Jkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vICAgICBzcGxpdFF1b3RlLndvcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgLy8gfVxuXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSh7XG4gICAgICAgICAgICAgICAgICAgIGF1dG9SZW1vdmVDaGlsZHJlbjogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc2V0KCRxdW90ZSwgeyBvcGFjaXR5OiAxIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oY2hpbGQsIDAuNSwgeyBvcGFjaXR5OiAwIH0sIHsgb3BhY2l0eTogMSwgZWFzZTogJ3Bvd2VyMycgfSwgJys9JyArIGRlbGF5KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbShzcGxpdFF1b3RlLndvcmRzLCAwLjUsIHsgb3BhY2l0eTogMCwgeDogOCwgdHJhbnNmb3JtT3JpZ2luOiAnMCUgMTAwJScsIGVhc2U6ICdwb3dlcjMnLCBzdGFnZ2VyOiAwLjA1IH0sIDAuMSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkYXV0aG9yLCAwLjcsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sIHsgb3BhY2l0eTogMSwgeDogMCB9LCAnLT0nICsgMC4zKVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKCRsaW5lLCB7IGR1cmF0aW9uOiAwLjcsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSB9LCAnLT0wLjMnKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd3b3Jkcyc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdHh0ID0gJGVsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0dHh0ID0gbmV3IFNwbGl0VGV4dCh0eHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdHR4dC5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7ICBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRlbC5kYXRhKCd1bmNhY2hlJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8ICBzcGxpdHR4dC5jaGFycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXR0eHQuY2hhcnNbaV0uY2xhc3NMaXN0LmFkZCgndW5jYWNoZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgIGNhc2UgJ3VwRG93bic6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB5U2hpZnQgPSAkZWwuZGF0YSgnc2hpZnQnKSA9PT0gJ3VwJyA/IDEwIDogLTEwO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIHk6IDAsIG9wYWNpdHk6IDF9LCB7b3BhY2l0eTogMC4yLCB5OiB5U2hpZnQsIHJlcGVhdDogMiwgZWFzZTogJ25vbmUnLCB5b3lvOiB0cnVlLCBkZWxheTogZGVsYXksXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIHk6IDAsIG9wYWNpdHk6IDF9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2l0ZW1zRmFkZSc6XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSAkZWwuZmluZCgnLicgKyAkZWwuZGF0YSgnZWxlbWVudHMnKSArICcnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50c0luID0gJGVsLmRhdGEoJ2VsZW1lbnRzLWluJykgPyAkZWwuZmluZCgnLicgKyAkZWwuZGF0YSgnZWxlbWVudHMtaW4nKSArICcnKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhZ2dlckVsID0gJGVsLmRhdGEoJ3N0YWdnZXInKSA/ICRlbC5kYXRhKCdzdGFnZ2VyJykgOiAwLjI7XG4gICAgICAgICAgICAgICAgY29uc3QgZGVsID0gZGVsYXkgPyBkZWxheSA6IDAuMjtcbiAgICAgICAgICAgICAgICBjb25zdCBzaGlmdFlBeGlzID0gJGVsLmRhdGEoJ3knKSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBlbFNjYWxlID0gICRlbC5kYXRhKCdzY2FsZScpID8gdHJ1ZSA6IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoZWxlbWVudHMsIHsgb3BhY2l0eTogMCB9KTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudHNJbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIGVsZW1lbnRzSW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c0luW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoZWxTY2FsZSkge1xuICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgMC44LCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45fSwgeyBzY2FsZTogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzSW4sIDAuOCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgKyAwLjQgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNoaWZ0WUF4aXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAxMH0sIHsgeTogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTEwfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiBzdGFnZ2VyRWwsIGRlbGF5OiBkZWxheSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3ZpZGVvLXRleHQnOlxuICAgICAgICAgICAgICAgIGNvbnN0IHZpZCA9ICRlbC5maW5kKCcuanMtY29sLTY2Jyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mID0gJGVsLmZpbmQoJy5qcy1jb2wtMzMnKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFt2aWQsIGluZl0sIHsgb3BhY2l0eTogMCB9KTtcblxuXG4gICAgICAgICAgICAgICAgZ3NhcC50byh2aWQsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiAwLjJ9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhpbmYsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0yMH0sIHsgb3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDAuNH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2hlYWRpbmcnOlxuICAgICAgICAgICAgICAgIGNvbnN0IGhUaXRsZSA9ICRlbC5maW5kKCcuanMtdGl0bGUnKSxcbiAgICAgICAgICAgICAgICAgICAgaHIgPSAkZWwuZmluZCgnLmpzLWhlYWRpbmctaHInKTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0VGl0bGUgPSBuZXcgU3BsaXRUZXh0KGhUaXRsZSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdFRpdGxlLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaHIsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCB9LCB7IHNjYWxlWDogMSwgZGVsYXk6IDAuNSB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd0aXRsZUZhZGVJbic6XG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZCA9ICRlbC5maW5kKCcuanMtZml4ZWQtdGl0bGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAkZWwuZmluZCgnLmpzLXN1YicpLFxuICAgICAgICAgICAgICAgICAgICAgIGFyciA9ICRlbC5maW5kKCcuanMtYXJyJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb20obGVhZCwgeyBkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMS4yLCBkZWxheTogMn0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShzdWIsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHk6IDMwLCBkZWxheTogMy4yfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGFyciwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjd9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpbnRybyc6XG4gICAgICAgICAgICAgICAgY29uc3QgY3VydGFpbiA9ICRlbC5maW5kKCcuanMtY3VydGFpbicpO1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC50byhjdXJ0YWluLCB7IGR1cmF0aW9uOiAzLCBvcGFjaXR5OiAwLCBkZWxheTogMX0pO1xuXG4gICAgICAgICAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1hbmltYXRlZCcpO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2hlYWRlcic6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGh0aW1lID0gJGVsLmZpbmQoJy5qcy10aW1lJyksXG4gICAgICAgICAgICAgICAgICAgIHNvY2lhbEQgPSAkZWwuZmluZCgnLnBob25lLWhpZGUgLnNvY2lhbF9faXRlbScpLFxuICAgICAgICAgICAgICAgICAgICBzaGFyZVRleHQgPSAkZWwuZmluZCgnLnBob25lLWhpZGUgLnNvY2lhbF9fdGl0bGUnKSxcbiAgICAgICAgICAgICAgICAgICAgaEhyID0gJGVsLmZpbmQoJy5qcy1oZWFkZXItaHInKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKFtodGltZSwgc2hhcmVUZXh0LCBzb2NpYWxEXSwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTEwfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjF9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhoSHIsIHsgc2NhbGVYOiAwfSwgeyBzY2FsZVg6IDF9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtRWwgPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG51bSA9ICRlbC5maW5kKCdbZGF0YS1udW1dJykuZGF0YSgnbnVtJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZHVyID0gJGVsLmRhdGEoJ3RpbWUnKSA/ICRlbC5kYXRhKCd0aW1lJykgKiAxMDAwIDogMjAwMDtcbiAgICAgICAgICAgICAgICBjb25zdCBudW1UZXh0ID0gJGVsLmZpbmQoJ1tkYXRhLXRleHRdJykubGVuZ3RoID4gMCA/ICRlbC5maW5kKCdbZGF0YS10ZXh0XScpIDogbnVsbDtcbiAgICAgICAgICAgICAgICBsZXQgZml4ZWQgPSBudW0udG9TdHJpbmcoKS5pbmRleE9mKCcuJykgPiAtMSA/IG51bS50b1N0cmluZygpLmxlbmd0aCAtIG51bS50b1N0cmluZygpLmluZGV4T2YoJy4nKSAtIDEgOiBudWxsO1xuXG4gICAgICAgICAgICAgICAgbnVtRWwuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzogbnVtRWwud2lkdGgoKSxcbiAgICAgICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJ1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDF9KTtcbiAgICAgICAgICAgICAgICBpZiAobnVtVGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBnc2FwLnNldChudW1UZXh0LCB7IG9wYWNpdHk6IDB9KTtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC50byhudW1UZXh0LCAxLHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGR1ci8xMDAwfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbnVtRWwucHJvcCgnQ291bnRlcicsIDApLmFuaW1hdGUoe1xuICAgICAgICAgICAgICAgICAgICBDb3VudGVyOiBudW0sXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogZHVyLFxuICAgICAgICAgICAgICAgICAgICBlYXNpbmc6ICdzd2luZycsXG4gICAgICAgICAgICAgICAgICAgIHN0ZXA6IChub3cpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXhlZCAmJiBmaXhlZCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtRWwuZGF0YSgncmVwbGFjZScpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQoKG5vdy50b0ZpeGVkKGZpeGVkKS50b1N0cmluZygpLnJlcGxhY2UoJy4nLCAnLCcpKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtRWwudGV4dChub3cudG9GaXhlZChmaXhlZCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtRWwudGV4dChNYXRoLmNlaWwobm93KSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7dHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcGFyYWxsYXgoaXRlbTogSVBhcmFsbGF4Q2FjaGVJdGVtLCBzVDogbnVtYmVyLCB3aW5kb3dIZWlnaHQ6IG51bWJlciwgaGVhZGVySGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcblxuICAgICAgICBpZiAoaXRlbS5zaGlmdCkge1xuXG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xuICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IGl0ZW0ueTtcblxuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQ6IG51bWJlciA9ICh5IC0gc1QgKyBpdGVtLmhlaWdodCAtIGhlYWRlckhlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpO1xuICAgICAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiBpdGVtLnNoaWZ0KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWU6IG51bWJlciA9ICFpdGVtLmRvbmUgPyAwIDogMC41O1xuICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwpO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLCB7XG4gICAgICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aW1lLFxuICAgICAgICAgICAgICAgICAgICB5OiB5LFxuICAgICAgICAgICAgICAgICAgICByb3VuZFByb3BzOiBbJ3knXSxcbiAgICAgICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlKSB7XG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xuICAgICAgICAgICAgY29uc3QgJGVsU3RpY2t5OiBKUXVlcnkgPSAkZWwucGFyZW50KCkucGFyZW50KCk7XG4gICAgICAgICAgICBjb25zdCB5OiBudW1iZXIgPSBpdGVtLnk7XG4gICAgICAgICAgICBjb25zdCBweUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgcHlUb3A6IG51bWJlciA9IHNUIC0gaXRlbS5oZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBweVRvcFN0aWNreTogbnVtYmVyID0gc1QgLSAkZWxTdGlja3kuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoaXRlbS50eXBlKSB7XG5cbiAgICAgICAgICAgICAgICBjYXNlICdoZXJvJzpcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kZWwsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICFicm93c2VyLm1vYmlsZSA/IHNUICogMC41IDogMCxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZpeGVkSW1hZ2UnOlxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh5LCBcInlcIiwgc1QsIHB5Qm90dG9tLCB3aW5kb3dIZWlnaHQsd2luZG93SGVpZ2h0KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHkgPj0gcHlUb3AgJiYgeSA8PSBweUJvdHRvbSkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRlbC5oYXNDbGFzcygnaGFzLXBhcmFsbGF4JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2hhcy1wYXJhbGxheCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblxuICAgICAgICAgICAgICAgIGNhc2UgJ2Nzcy1hbmltYXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uJGVsLmhhc0NsYXNzKCdhbmltYXRpb24tcGxheScpID8gbnVsbCA6IGl0ZW0uJGVsLmFkZENsYXNzKCdhbmltYXRpb24tcGxheScpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICAgICAgY2FzZSAncmVsYXRpdmVQYXJhbGxheCc6XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF2YWlsYWJsZVNwYWNlID0gaXRlbS5jaGlsZEhlaWdodCAtIGl0ZW0uaGVpZ2h0OyAvLyByZXNlcnZlIHNwYWNlXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heFNoaWZ0ID0gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsIGl0ZW0uaGVpZ2h0ICsgaGVhZGVySGVpZ2h0KTsgLy8gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsICh3aW5kb3dIZWlnaHQgLSBkYXRhLmhlaWdodCkgKiAwLjUgKTsgLy8gZG8gbm90IG1vdmUgdG9vIG11Y2ggb24gYmlnIHNjcmVlbnNcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudCA9IChzVCAtIGl0ZW0ueSArIHdpbmRvd0hlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQpO1xuXG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3NZOiBzdHJpbmcgfCBudW1iZXIgPSBNYXRoLnJvdW5kKCgxIC0gcGVyY2VudCkgKiBtYXhTaGlmdCk7XG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZIDwgMCA/IDAgOiBwb3NZO1xuICAgICAgICAgICAgICAgICAgICBwb3NZID0gcG9zWSA+IG1heFNoaWZ0ID8gbWF4U2hpZnQgOiBwb3NZO1xuXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGNoaWxkLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAtcG9zWSxcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGFuaW1hdGlvbiB0eXBlIFwiJHtpdGVtLnR5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuZXhwb3J0IGNsYXNzIFNoYXJlIHtcblxuXG4gICAgY29uc3RydWN0b3IoKSB7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG5cblxuICAgICAgICAkKCdbZGF0YS1zaGFyZV0nKS5vbignY2xpY2snLCAoZSk6IGJvb2xlYW4gPT4ge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICAgICAgbGV0IHdpbldpZHRoID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2lud2lkdGgnKSwgMTApIHx8IDUyMDtcbiAgICAgICAgICAgIGxldCB3aW5IZWlnaHQgPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW5oZWlnaHQnKSwgMTApIHx8IDM1MDtcbiAgICAgICAgICAgIGxldCB3aW5Ub3AgPSAoc2NyZWVuLmhlaWdodCAvIDIpIC0gKHdpbkhlaWdodCAvIDIpO1xuICAgICAgICAgICAgbGV0IHdpbkxlZnQgPSAoc2NyZWVuLndpZHRoIC8gMikgLSAod2luV2lkdGggLyAyKTtcblxuICAgICAgICAgICAgY29uc3QgY3VycmVudFRhcmdldCA9IDxhbnk+ZS5jdXJyZW50VGFyZ2V0O1xuICAgICAgICAgICAgY29uc3QgaHJlZiA9IGN1cnJlbnRUYXJnZXQuaHJlZjtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgnc2hhcmUnKTtcblxuICAgICAgICAgICAgaWYgKGRhdGEgPT09ICdsaW5rZWRpbicpIHtcbiAgICAgICAgICAgICAgICB3aW5XaWR0aCA9IDQyMDtcbiAgICAgICAgICAgICAgICB3aW5IZWlnaHQgPSA0MzA7XG4gICAgICAgICAgICAgICAgd2luVG9wID0gd2luVG9wIC0gMTAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB3aW5kb3cub3BlbihocmVmLCAnc2hhcmVyJyArIGRhdGEsICd0b3A9JyArIHdpblRvcCArICcsbGVmdD0nICsgd2luTGVmdCArICcsdG9vbGJhcj0wLHN0YXR1cz0wLHdpZHRoPScgKyB3aW5XaWR0aCArICcsaGVpZ2h0PScgKyB3aW5IZWlnaHQpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3JlZmVyZW5jZXMuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBQdXNoU3RhdGVzLCBQdXNoU3RhdGVzRXZlbnRzIH0gZnJvbSAnLi9QdXNoU3RhdGVzJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcbmltcG9ydCB7IFNjcm9sbCB9IGZyb20gJy4vU2Nyb2xsJztcbmltcG9ydCB7IFBhZ2UsIFBhZ2VFdmVudHMgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xuaW1wb3J0IHsgQ29tcG9uZW50RXZlbnRzLCBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50JztcbmltcG9ydCB7IEJyb3dzZXIsIGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXInO1xuaW1wb3J0IHsgcGFnZXMsIGNvbXBvbmVudHMgfSBmcm9tICcuL0NsYXNzZXMnO1xuaW1wb3J0IHsgQ29weSB9IGZyb20gJy4vQ29weSc7XG5pbXBvcnQgeyBTaGFyZSB9IGZyb20gJy4vU2hhcmUnO1xuaW1wb3J0IHsgQVBJIH0gZnJvbSAnLi9BcGknO1xuXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcblxuZXhwb3J0IGxldCBzaXRlOiBTaXRlO1xuZXhwb3J0IGxldCAkZG9jOiBKUXVlcnk7XG5leHBvcnQgbGV0ICR3aW5kb3c6IEpRdWVyeTtcbmV4cG9ydCBsZXQgJGJvZHk6IEpRdWVyeTtcbmV4cG9ydCBsZXQgJGFydGljbGU6IEpRdWVyeTtcbmV4cG9ydCBsZXQgJG1haW46IEpRdWVyeTtcbmV4cG9ydCBsZXQgJHBhZ2VIZWFkZXI6IEpRdWVyeTtcbmV4cG9ydCBsZXQgcGl4ZWxSYXRpbzogbnVtYmVyO1xuZXhwb3J0IGxldCBkZWJ1ZzogYm9vbGVhbjtcbmV4cG9ydCBsZXQgZWFzaW5nOiBzdHJpbmc7XG5leHBvcnQgbGV0IGxhbmc6IHN0cmluZztcbmV4cG9ydCBsZXQgZml4ZWRwb3NpdGlvbjogbnVtYmVyO1xuXG4vLyBkZWNsYXJlIGxldCBDdXN0b21FYXNlO1xuXG5cblxuXG5leHBvcnQgY2xhc3MgU2l0ZSB7XG5cblxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFNpdGU7XG5cbiAgICBwcml2YXRlIGN1cnJlbnRQYWdlOiBQYWdlO1xuICAgIHByaXZhdGUgcHVzaFN0YXRlczogUHVzaFN0YXRlcztcbiAgICBwcml2YXRlIHNjcm9sbDogU2Nyb2xsO1xuICAgIHByaXZhdGUgbGFzdEJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xuICAgIHByaXZhdGUgbG9hZGVyOiBMb2FkZXI7XG4gICAgLy8gcHJpdmF0ZSBpc1JlYWR5OiBib29sZWFuO1xuICAgIC8vIHByaXZhdGUgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xuICAgIC8vIHByaXZhdGUgJGhhbWJ1cmdlcjogSlF1ZXJ5O1xuICAgIC8vIHByaXZhdGUgJHBhZ2VIZWFkZXI6IEpRdWVyeTtcbiAgICAvLyBwcml2YXRlICRhcnRpY2xlOiBKUXVlcnk7XG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcbiAgICAgICAgY29uc29sZS5sb2coJ3NpdGUnKTtcblxuICAgICAgICBTaXRlLmluc3RhbmNlID0gdGhpcztcbiAgICAgICAgLy8gbGFuZyA9ICQoJ2h0bWwnKS5hdHRyKCdsYW5nJyk7XG5cbiAgICAgICAgcGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XG4gICAgICAgIGRlYnVnID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5pbmRleE9mKCdkZWJ1ZycpID49IDA7XG4gICAgICAgIC8vIGVhc2luZyA9IEN1c3RvbUVhc2UuY3JlYXRlKCdjdXN0b20nLCAnTTAsMCxDMC41LDAsMC4zLDEsMSwxJyk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBpbml0KCk6IHZvaWQge1xuXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XG4gICAgICAgIEJyb3dzZXIudXBkYXRlKCk7XG5cbiAgICAgICAgJGRvYyA9ICQoZG9jdW1lbnQpO1xuICAgICAgICAkd2luZG93ID0gJCh3aW5kb3cpO1xuICAgICAgICAkYm9keSA9ICQoJ2JvZHknKTtcbiAgICAgICAgJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XG4gICAgICAgICRtYWluID0gJCgnI21haW4nKTtcblxuXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcyA9IG5ldyBQdXNoU3RhdGVzKCk7XG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5vbihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSwgdGhpcy5vblN0YXRlKTtcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIHRoaXMub25Mb2FkUHJvZ3Jlc3MpO1xuXG4gICAgICAgIC8vIHRoaXMuJGhhbWJ1cmdlciA9ICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKTtcbiAgICAgICAgLy8gdGhpcy4kYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLW1haW4nKTtcbiAgICAgICAgLy8gdGhpcy4kcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XG5cbiAgICAgICAgdGhpcy5zY3JvbGwgPSBuZXcgU2Nyb2xsKCk7XG4gICAgICAgIHRoaXMubG9hZGVyID0gbmV3IExvYWRlcigkKCcuanMtbG9hZGVyJykpO1xuICAgICAgICB0aGlzLmxvYWRlci5zaG93KCk7XG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUpO1xuXG5cbiAgICAgICAgbmV3IENvcHkoKTtcbiAgICAgICAgbmV3IFNoYXJlKCk7XG4gICAgICAgIG5ldyBBUEkoKTtcbiAgICAgICAgQVBJLmJpbmQoKTtcbiAgICAgICAgLy8gdGhpcy5tZW51ID0gbmV3IE1lbnUoJCgnLmpzLW1lbnUnKSk7XG4gICAgICAgIC8vIHRoaXMuY29va2llcyA9IG5ldyBDb29raWVzKCQoJy5qcy1jb29raWVzJykpO1xuXG5cbiAgICAgICAgUHJvbWlzZS5hbGw8dm9pZD4oW1xuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50UGFnZSgpLFxuICAgICAgICAgICAgLy8gdGhpcy5wcmVsb2FkQXNzZXRzKCksXG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpLFxuICAgICAgICBdKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcblxuXG4gICAgICAgIGlmIChkZWJ1ZykgeyBVdGlscy5zdGF0cygpOyB9XG5cbiAgICAgICAgJHdpbmRvdy5vbignb3JpZW50YXRpb25jaGFuZ2UnLCAoKSA9PiBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XG5cbiAgICAgICAgfSwgMTAwKSk7XG4gICAgICAgICR3aW5kb3cub24oJ3Jlc2l6ZScsICgpID0+IHRoaXMub25SZXNpemUoKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25SZXNpemUoKTogdm9pZCB7XG5cbiAgICAgICAgQnJlYWtwb2ludC51cGRhdGUoKTtcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCAmJiAhYnJvd3Nlci5tb2JpbGUpIHtcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB3aWR0aCA9ICR3aW5kb3cud2lkdGgoKTtcbiAgICAgICAgY29uc3QgaGVpZ2h0ID0gJHdpbmRvdy5oZWlnaHQoKTtcblxuICAgICAgICBjb25zdCBjaGFuZ2VkID0gIXRoaXMubGFzdEJyZWFrcG9pbnQgfHwgdGhpcy5sYXN0QnJlYWtwb2ludC52YWx1ZSAhPT0gYnJlYWtwb2ludC52YWx1ZTtcbiAgICAgICAgdGhpcy5sYXN0QnJlYWtwb2ludCA9IGJyZWFrcG9pbnQ7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UucmVzaXplKHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdGhpcy5jYWxsQWxsKCdyZXNpemUnLCB3aWR0aCwgaGVpZ2h0LCBicmVha3BvaW50LCBjaGFuZ2VkKTtcbiAgICAgICAgdGhpcy5sb2FkZXIucmVzaXplKHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB0aGlzLnNjcm9sbC5yZXNpemUoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBwcmVsb2FkQXNzZXRzKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBhc3NldHMgPSBbXTtcbiAgICAgICAgbGV0IGlsID0gaW1hZ2VzTG9hZGVkKCcucHJlbG9hZC1iZycsIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRydWUsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChhc3NldHMgJiYgYXNzZXRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNzZXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgaWwuYWRkQmFja2dyb3VuZChhc3NldHNbaV0sIG51bGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlsLmpxRGVmZXJyZWQuYWx3YXlzKCgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8vIGNoZWNrIGlmIGFueSBjb21wb25lbnQgaGFuZGxlIG9uU3RhdGUgZXZlbnRcbiAgICAvLyBpZiBub3QsIHJlbG9hZCBodG1sOlxuICAgIHByaXZhdGUgb25TdGF0ZSA9ICgpOiB2b2lkID0+IHtcblxuICAgICAgICAvLyBjb25zdCBzY3JvbGxpbmdDaGFuZ2VkU3RhdGUgPSB0aGlzLnNjcm9sbC5vblN0YXRlKCk7XG4gICAgICAgIGNvbnN0IHBhZ2VDaGFuZ2VkU3RhdGUgPSB0aGlzLmN1cnJlbnRQYWdlLm9uU3RhdGUoKTtcblxuICAgICAgICAvLyBpZiAoIXNjcm9sbGluZ0NoYW5nZWRTdGF0ZSAmJiAhb2Zmc2NyZWVuQ2hhbmdlZFN0YXRlICYmICFwYWdlQ2hhbmdlZFN0YXRlKSB7XG4gICAgICAgIGlmICghcGFnZUNoYW5nZWRTdGF0ZSkge1xuXG4gICAgICAgICAgICAvLyBBbmFseXRpY3Muc2VuZFBhZ2V2aWV3KHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSk7XG5cbiAgICAgICAgICAgIGNvbnN0IHB1c2hTdGF0ZXNMb2FkUHJvbWlzZSA9IHRoaXMucHVzaFN0YXRlcy5sb2FkKCk7XG4gICAgICAgICAgICBjb25zdCBhbmltYXRlT3V0UHJvbWlzZSA9IHRoaXMuY3VycmVudFBhZ2UuYW5pbWF0ZU91dCgpO1xuXG4gICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvYWRlci5zaG93KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5zY3JvbGwuc3RvcCgpO1xuXG4gICAgICAgICAgICAvLyBhbGwgcHJvbWlzZXMgYXJyYXk6XG4gICAgICAgICAgICBjb25zdCBsb2FkaW5nUHJvbWlzZXM6IEFycmF5PFByb21pc2U8dm9pZD4+ID0gW1xuICAgICAgICAgICAgICAgIHB1c2hTdGF0ZXNMb2FkUHJvbWlzZSxcbiAgICAgICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZSxcbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIC8vIHJlbmRlciBodG1sIHdoZW4gZXZlcnl0aGluZydzIHJlYWR5OlxuICAgICAgICAgICAgUHJvbWlzZS5hbGw8dm9pZD4obG9hZGluZ1Byb21pc2VzKS50aGVuKHRoaXMucmVuZGVyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvLyBkaXNwbGF5IGFqYXggcHJvZ3Jlc3M6XG4gICAgcHJpdmF0ZSBvbkxvYWRQcm9ncmVzcyA9IChwcm9ncmVzczogbnVtYmVyKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKiBwcm9ncmVzcyk7XG4gICAgfVxuXG5cblxuICAgIC8vIHBhc3MgbG9hZGluZyBwcm9ncmVzcyBmcm9tIHBhZ2UgdG8gcHJlbG9hZGVyOlxuICAgIHByaXZhdGUgb25QYWdlUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41ICsgMC41ICogcHJvZ3Jlc3MpO1xuICAgIH1cblxuXG5cbiAgICAvLyBkZWFsIHdpdGggbmV3bHkgYWRkZWQgZWxlbWVudHNcbiAgICBwcml2YXRlIG9uUGFnZUFwcGVuZCA9IChlbDogSlF1ZXJ5KTogdm9pZCA9PiB7XG4gICAgICAgIFB1c2hTdGF0ZXMuYmluZChlbFswXSk7XG4gICAgICAgIC8vIFdpZGdldHMuYmluZChlbFswXSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLmxvYWQoKTtcbiAgICB9XG5cblxuXG4gICAgLy8gY2FsbGVkIGFmdGVyIG5ldyBodG1sIGlzIGxvYWRlZFxuICAgIC8vIGFuZCBvbGQgY29udGVudCBpcyBhbmltYXRlZCBvdXQ6XG4gICAgcHJpdmF0ZSByZW5kZXIgPSAoKTogdm9pZCA9PiB7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2Uub2ZmKCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zY3JvbGwuZGVzdHJveSgpO1xuXG4gICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcbiAgICAgICAgY29uc29sZS5ncm91cCgpO1xuXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5yZW5kZXIoKTtcbiAgICAgICAgdGhpcy5zZXRDdXJyZW50UGFnZSgpLnRoZW4odGhpcy5vblBhZ2VMb2FkZWQpO1xuICAgICAgICBQdXNoU3RhdGVzLnNldFRpdGxlKCQoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpLmF0dHIoJ2NvbnRlbnQnKSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGRldGVjdEhvbWVQYWdlKCk6IHZvaWQge1xuICAgICAgICAkcGFnZUhlYWRlciA/ICRib2R5LmFkZENsYXNzKCdpcy1ob21lLXBhZ2UnKSA6IG51bGw7XG4gICAgfVxuXG5cbiAgICAvLyB3aGVuIGN1cnJlbnQgcGFnZSBpcyBsb2FkZWQ6XG4gICAgcHJpdmF0ZSBvblBhZ2VMb2FkZWQgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIC8vICRib2R5LnJlbW92ZUNsYXNzKCdpcy1ub3QtcmVhZHknKTtcbiAgICAgICAgJGJvZHkucmVtb3ZlQXR0cignY2xhc3MnKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuaGlkZSgpO1xuICAgICAgICBVdGlscy5lbmFibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCRib2R5LCAwLCAwKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlSW4oKTtcbiAgICAgICAgJHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykgOiBudWxsO1xuICAgICAgICB0aGlzLmRldGVjdEhvbWVQYWdlKCk7XG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xuICAgICAgICAvLyB0aGlzLmNvb2tpZXMudHJ5VG9TaG93KCk7XG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb1BhdGgodHJ1ZSk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLmxvYWQoKTtcbiAgICAgICAgdGhpcy5zY3JvbGwuc3RhcnQoKTtcbiAgICAgICAgJCgnYXJ0aWNsZScpLnBhcmVudCgpLmFkZENsYXNzKCdpcy1sb2FkZWQnKTtcbiAgICB9XG5cblxuXG4gICAgLy8gcnVuIG5ldyBQYWdlIG9iamVjdFxuICAgIC8vIChmb3VuZCBieSBgZGF0YS1wYWdlYCBhdHRyaWJ1dGUpXG4gICAgLy8gYmluZCBpdCBhbmQgc3RvcmUgYXMgY3VycmVudFBhZ2U6XG4gICAgcHJpdmF0ZSBzZXRDdXJyZW50UGFnZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgbGV0ICRwYWdlRWw6IEpRdWVyeSA9ICQoJ1tkYXRhLXBhZ2VdJyksXG4gICAgICAgICAgICBwYWdlTmFtZTogc3RyaW5nID0gJHBhZ2VFbC5kYXRhKCdwYWdlJykgfHwgJ1BhZ2UnLFxuICAgICAgICAgICAgcGFnZU9wdGlvbnM6IE9iamVjdCA9ICRwYWdlRWwuZGF0YSgnb3B0aW9ucycpO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKCRwYWdlRWwsIHBhZ2VOYW1lKTtcblxuICAgICAgICAvLyBwYWdlIG5vdCBmb3VuZDpcbiAgICAgICAgaWYgKHBhZ2VOYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGlmIChwYWdlTmFtZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBpbiBQYWdlcyEnLCBwYWdlTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwYWdlTmFtZSA9ICdQYWdlJztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1vcmUgdGhhbiBvbmUgZGF0YS1wYWdlOlxuICAgICAgICBpZiAoJHBhZ2VFbC5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ09ubHkgb25lIFtkYXRhLXBhZ2VdIGVsZW1lbnQsIHBsZWFzZSEnKTtcblxuICAgICAgICAvLyBwYWdlIG5vdCBkZWZpbmVkIGluIGh0bWw6XG4gICAgICAgIH0gZWxzZSBpZiAoJHBhZ2VFbC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICRwYWdlRWwgPSAkKCQoJyNtYWluJykuZmluZCgnYXJ0aWNsZScpWzBdIHx8ICQoJyNtYWluJykuY2hpbGRyZW4oKS5maXJzdCgpWzBdKTtcbiAgICAgICAgfVxuXG5cblxuICAgICAgICAvLyBjcmVhdGUgUGFnZSBvYmplY3Q6XG4gICAgICAgIGxldCBwYWdlOiBQYWdlID0gbmV3IHBhZ2VzW3BhZ2VOYW1lXSgkcGFnZUVsLCBwYWdlT3B0aW9ucyk7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSBwYWdlO1xuXG4gICAgICAgIC8vIGJpbmQgZXZlbnRzOlxuICAgICAgICBBUEkuYmluZCgpO1xuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHRoaXMub25QYWdlUHJvZ3Jlc3MpO1xuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuQ0hBTkdFLCB0aGlzLm9uUGFnZUFwcGVuZCk7XG5cbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xuXG4gICAgICAgIHJldHVybiBwYWdlLnByZWxvYWQoKTtcbiAgICB9XG59XG5cblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuICAgIHNpdGUgPSBuZXcgU2l0ZSgpO1xuICAgIHNpdGUuaW5pdCgpO1xufSk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvc3RhdHMuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuL1NpdGUnO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVVJRCgpOiBzdHJpbmcge1xuICAgIHJldHVybiAnJyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgKyBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xufVxuXG5cbmV4cG9ydCBjb25zdCBrZXlzID0ge1xuICAgIGVudGVyOiAxMyxcbiAgICBlc2M6IDI3LFxuICAgIHNwYWNlOiAzMixcbiAgICBsZWZ0OiAzNyxcbiAgICB1cDogMzgsXG4gICAgcmlnaHQ6IDM5LFxuICAgIGRvd246IDQwLFxuICAgIHBhZ2VVcDogMzMsXG4gICAgcGFnZURvd246IDM0LFxuICAgIGVuZDogMzUsXG4gICAgaG9tZTogMzYsXG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJhbXModXJsKTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH0ge1xuICAgIHZhciBwYXJhbXMgPSB7fTtcbiAgICB2YXIgcGFyc2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xuICAgIHBhcnNlci5ocmVmID0gdXJsO1xuICAgIHZhciBxdWVyeSA9IHBhcnNlci5zZWFyY2guc3Vic3RyaW5nKDEpO1xuICAgIHZhciB2YXJzID0gcXVlcnkuc3BsaXQoJyYnKTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIHBhaXIgPSB2YXJzW2ldLnNwbGl0KCc9Jyk7XG4gICAgICAgIHBhcmFtc1twYWlyWzBdXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcbiAgICB9XG4gICAgcmV0dXJuIHBhcmFtcztcbn07XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RBdXRvcGxheSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgaWYgKHR5cGVvZiBNb2Rlcm5penIudmlkZW9hdXRvcGxheSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIE1vZGVybml6ci5vbigndmlkZW9hdXRvcGxheScsICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVG9UaW1lKHNlYzogbnVtYmVyKTogc3RyaW5nIHtcblxuICAgIGNvbnN0IHRvdGFsU2VjID0gcGFyc2VJbnQoJycgKyBzZWMsIDEwKTtcbiAgICBjb25zdCBob3VycyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyAzNjAwLCAxMCkgJSAyNDtcbiAgICBjb25zdCBtaW51dGVzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDYwLCAxMCkgJSA2MDtcbiAgICBjb25zdCBzZWNvbmRzID0gdG90YWxTZWMgJSA2MDtcbiAgICBjb25zdCBocnNEaXNwbGF5ID0gKGhvdXJzIDwgMTAgPyAnMCcgKyBob3VycyA6IGhvdXJzKSArICc6JztcblxuICAgIHJldHVybiAoaG91cnMgPiAwID8gaHJzRGlzcGxheSA6ICcnKSArIChtaW51dGVzIDwgMTAgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcykgKyAnOicgKyAoc2Vjb25kcyA8IDEwID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHN0YXRzKCk6IFN0YXRzIHtcblxuICAgIGNvbnN0IHN0YXRzID0gbmV3IFN0YXRzKCk7XG5cbiAgICBzdGF0cy5zaG93UGFuZWwoIDAgKTsgLy8gMDogZnBzLCAxOiBtcywgMjogbWIsIDMrOiBjdXN0b21cbiAgICAkKHN0YXRzLmRvbSkuY3NzKHsncG9pbnRlci1ldmVudHMnOiAnbm9uZScsICd0b3AnOiAxMTB9KTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBzdGF0cy5kb20gKTtcblxuICAgIGZ1bmN0aW9uIGFuaW1hdGUoKTogdm9pZCB7XG4gICAgICAgIHN0YXRzLmJlZ2luKCk7XG4gICAgICAgIC8vIG1vbml0b3JlZCBjb2RlIGdvZXMgaGVyZVxuICAgICAgICBzdGF0cy5lbmQoKTtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCBhbmltYXRlICk7XG4gICAgfVxuXG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKCBhbmltYXRlICk7XG5cbiAgICByZXR1cm4gc3RhdHM7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gdGltZUZvcm1hdCh0aW1lOiBudW1iZXIpOiBzdHJpbmcge1xuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcih0aW1lIC8gNjApLnRvU3RyaW5nKCk7XG4gICAgbWludXRlcyA9IChwYXJzZUludChtaW51dGVzLCAxMCkgPj0gMTApID8gbWludXRlcyA6ICcwJyArIG1pbnV0ZXM7XG4gICAgbGV0IHNlY29uZHMgPSBNYXRoLmZsb29yKHRpbWUgJSA2MCkudG9TdHJpbmcoKTtcbiAgICBzZWNvbmRzID0gKHBhcnNlSW50KHNlY29uZHMsIDEwKSA+PSAxMCkgPyBzZWNvbmRzIDogJzAnICsgc2Vjb25kcztcblxuICAgIHJldHVybiBtaW51dGVzLnRvU3RyaW5nKCkgKyAnOicgKyBzZWNvbmRzLnRvU3RyaW5nKCk7XG59XG5cblxuXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlSW1hZ2VTb3VyY2VzKCk6IHZvaWQge1xuICAgIGlmIChicm93c2VyLmllKSB7XG4gICAgICAgICQoJ1tkYXRhLWllc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1pZXNyYycpKTtcbiAgICAgICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgJCgnW2RhdGEtc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyYycpKTtcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcbiAgICB9KTtcblxuICAgICQoJ1tkYXRhLXNyY3NldF0nKS5lYWNoKChpLCBpbWcpOiB2b2lkID0+IHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3Jjc2V0JywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKSk7XG4gICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0Jyk7XG4gICAgfSk7XG59XG5cblxuXG4vLyBleHBvcnQgZnVuY3Rpb24gcHJlbG9hZEltYWdlcyhpbWFnZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkW10+IHtcbi8vICAgICByZXR1cm4gUHJvbWlzZS5hbGwoaW1hZ2VzLm1hcCgoaW1hZ2UpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbi8vICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbi8vICAgICAgICAgICAgIGNvbnN0IGltZyA9IG5ldyBJbWFnZSgpO1xuLy8gICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgaW1nLm9uYWJvcnQgPSAoKSA9PiByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICBpbWcuc3JjID0gaW1hZ2U7XG4vLyAgICAgICAgICAgICBpZiAoaW1nLmNvbXBsZXRlICYmICQoaW1nKS5oZWlnaHQoKSA+IDApIHsgcmVzb2x2ZSgpOyByZXR1cm47IH1cbi8vICAgICAgICAgfSk7XG4vLyAgICAgfSkpO1xuLy8gfVxuXG5cblxuLy8gZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kUHJlbG9hZEltYWdlcygkaW1hZ2VzOiBKUXVlcnkpOiBQcm9taXNlPHZvaWRbXT4ge1xuLy8gICAgIGxldCBpc0Jhc2U2NDogYm9vbGVhbjtcbi8vICAgICBjb25zdCBpbWFnZXM6IHN0cmluZ1tdID0gJGltYWdlcy50b0FycmF5KClcbi8vICAgICAgICAgLm1hcCgoaW1nOiBIVE1MSW1hZ2VFbGVtZW50KTogc3RyaW5nID0+IHtcbi8vICAgICAgICAgICAgIGxldCBpbWFnZVNvdXJjZSA9IGltZy5jdXJyZW50U3JjIHx8IGltZy5zcmM7XG4vLyAgICAgICAgICAgICBpZiAoaW1hZ2VTb3VyY2UuaW5kZXhPZignZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcpID49IDApIHsgaXNCYXNlNjQgPSB0cnVlOyB9XG4vLyAgICAgICAgICAgICByZXR1cm4gaW1hZ2VTb3VyY2U7XG4vLyAgICAgICAgIH0pO1xuXG4vLyAgICAgLy8gY29uc29sZS5sb2coaW1hZ2VzKTtcblxuLy8gICAgIGlmICghaXNCYXNlNjQpIHtcbi8vICAgICAgICAgcmV0dXJuIHByZWxvYWRJbWFnZXMoaW1hZ2VzKTtcbi8vICAgICB9IGVsc2Uge1xuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4vLyAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbi8vICAgICAgICAgICAgICAgICBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlcykudGhlbigoKSA9PiB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgICAgICB9KTtcbi8vICAgICAgICAgICAgIH0sIDIwMCk7XG4vLyAgICAgICAgIH0pO1xuLy8gICAgIH1cbi8vIH1cblxuXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZShhKTogQXJyYXk8YW55PiB7XG4gICAgbGV0IGosIHgsIGk7XG4gICAgZm9yIChpID0gYS5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcbiAgICAgICAgeCA9IGFbaV07XG4gICAgICAgIGFbaV0gPSBhW2pdO1xuICAgICAgICBhW2pdID0geDtcbiAgICB9XG4gICAgcmV0dXJuIGE7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNldFJvb3RWYXJzKCk6IHZvaWQge1xuICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IGJyZWFrcG9pbnQuZGVza3RvcCA/ICQoJyNuYXZiYXInKS5oZWlnaHQoKSA6IDA7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWFwcC1oZWlnaHQnLCBgJHt3aW5kb3cuaW5uZXJIZWlnaHQgLSBoZWFkZXJIZWlnaHR9cHhgKTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sLTI1JywgYCR7JCgnLmNvbC1wYXR0ZXJuLTI1Jykud2lkdGgoKX1weGApO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtNjYnLCBgJHskKCcuY29sLTY2Jykud2lkdGgoKX1weGApO1xuICAgIGxldCBtYXJnID0gIWJyZWFrcG9pbnQuZGVza3RvcCA/IDUwIDogMTIwO1xuICAgICQoJy5hc2lkZScpLmNzcygnaGVpZ2h0JywgJHdpbmRvdy5oZWlnaHQoKSArIG1hcmcpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlQm9keVNjcm9sbGluZyhzVDogbnVtYmVyKTogdm9pZCB7XG4gICAgJCgnYm9keScpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgJCgnYm9keScpLnJlbW92ZUNsYXNzKCdzY3JvbGxpbmctZGlzYWJsZScpO1xuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzVCk7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGRpc2FibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcbiAgICBsZXQgcG9zaXRpb24gPSBicm93c2VyLmllID8gJ2Fic29sdXRlJyA6ICdmaXhlZCc7XG4gICAgbGV0IHRvcCA9IGJyb3dzZXIuaWUgPyAnJyA6IC1zVCArICdweCc7XG4gICAgJCgnYm9keScpLmFkZENsYXNzKCdzY3JvbGxpbmctZGlzYWJsZScpO1xuICAgICQoJ2JvZHknKS5jc3Moe1xuICAgICAgICAvLyAncG9zaXRpb24nOiBwb3NpdGlvbixcbiAgICAgICAgLy8gJ3RvcCc6IHRvcCxcbiAgICAgICAgLy8gJ2JvdHRvbSc6ICcwJyxcbiAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXG4gICAgICAgICd3aWxsLWNoYW5nZSc6ICd0b3AnLFxuICAgICAgICAnd2lkdGgnOiAnMTAwJScsXG4gICAgICAgICd0b3VjaC1hY3Rpb24nOiAnbm9uZScsXG4gICAgfSk7XG5cbn1cblxuXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zID0ge1xuICAgICdpbnZhbGlkLWVtYWlsJzoge1xuICAgICAgICAnZW4nOiAnSW52YWxpZCBlbWFpbCBhZGRyZXNzIGZvcm1hdCcsXG4gICAgICAgICdwbCc6ICdOaWVwb3ByYXdueSBmb3JtYXQgYWRyZXN1IGUtbWFpbCcsXG4gICAgfSxcbiAgICAncmVxdWlyZWQtZmllbGQnOiB7XG4gICAgICAgICdlbic6ICdSZXF1aXJlZCBmaWVsZCcsXG4gICAgICAgICdwbCc6ICdQb2xlIG9ib3dpxIV6a293ZScsXG4gICAgfSxcbiAgICAnaW52YWxpZC16aXAnOiB7XG4gICAgICAgICdlbic6ICdFbnRlciB6aXAtY29kZSBpbiBmaXZlIGRpZ2l0cyBmb3JtYXQnLFxuICAgICAgICAncGwnOiAnV3Bpc3oga29kIHBvY3p0b3d5IHcgZm9ybWFjaWUgWFgtWFhYJyxcbiAgICB9LFxufTtcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkYm9keSwgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IFB1c2hTdGF0ZXMgfSBmcm9tICcuLi9QdXNoU3RhdGVzJztcblxuXG5leHBvcnQgY2xhc3MgQXNpZGUgZXh0ZW5kcyBDb21wb25lbnQge1xuICAgIFxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IEFzaWRlO1xuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuXG4gICAgcHJpdmF0ZSAkaGFtYnVyZ2VyTGluZTogSlF1ZXJ5O1xuICAgIFxuICAgIHB1YmxpYyBzdGF0aWMgYXNpZGVBbmltYXRpb24oKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKEFzaWRlLmluc3RhbmNlLmlzT3Blbikge1xuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaXRlbSwgMC4yNSwgeyBkdXJhdGlvbjogMC4yNSwgc3RhZ2dlcjogLTAuMSwgb3BhY2l0eTogMCwgeDogMjAsIGRlbGF5OiAwLjJ9KVxuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaGFtYnVyZ2VyTGluZSwgMC4zLCB7IGR1cmF0aW9uOiAwLjMsIHNjYWxlWTogMH0pO1xuICAgICAgICAgICAgQXNpZGUuaW5zdGFuY2UuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRpdGVtLCAwLjUsIHsgZHVyYXRpb246IDAuNSwgc3RhZ2dlcjogMC4wNSwgb3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDAuMn0pXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRoYW1idXJnZXJMaW5lLCAwLjMsIHsgZHVyYXRpb246IDAuMywgc2NhbGVZOiAxLCBkZWxheTogMC41fSk7XG4gICAgICAgICAgICBBc2lkZS5pbnN0YW5jZS5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcbiAgICAgICAgdGhpcy4kaGFtYnVyZ2VyTGluZSA9ICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5maW5kKCdpJyk7XG5cbiAgICAgICAgQXNpZGUuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcubWVudScpLm9uKCdjbGljay5tZW51JywgdGhpcy5oaWRlTWVudSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBoaWRlTWVudSA9IChlKSA9PiB7XG4gICAgICAgIFB1c2hTdGF0ZXMuYXNpZGVUb2dnbGUoZSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xuXG5pbnRlcmZhY2UgSUNoYXJ0U2V0dGluZ3Mge1xuICAgIGlkOiBudW1iZXI7XG4gICAgeFBlcmNlbnQ6IG51bWJlcjtcbiAgICB5UG9pbnRzOiBBcnJheTxudW1iZXI+O1xuICAgIGNvbG9yOiBzdHJpbmc7XG4gICAgeVB4OiBBcnJheTxudW1iZXI+O1xuICAgIGZpbGw/OiBib29sZWFuO1xuICAgIHNob3duPzogYm9vbGVhbjtcbiAgICBsYWJlbFk/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBDaGFydCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICR0YWI6IEpRdWVyeTtcbiAgICBwcml2YXRlICR3cmFwcGVyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBjYW52YXM6IEhUTUxDYW52YXNFbGVtZW50O1xuICAgIHByaXZhdGUgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XG5cbiAgICBwcml2YXRlIG1hcmdpbjogYW55ID0ge1xuICAgICAgICB0b3A6IDUsXG4gICAgICAgIGxlZnQ6IDI1LFxuICAgICAgICByaWdodDogMTEwLFxuICAgICAgICBib3R0b206IDQ5XG4gICAgfTtcblxuICAgIHByaXZhdGUgZ3JhcGg6IGFueSA9IHtcbiAgICAgICAgdG9wOiAwLFxuICAgICAgICBsZWZ0OiAwLFxuICAgICAgICByaWdodDogMCxcbiAgICAgICAgYm90dG9tOiAwLFxuICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgIHdpZHRoOiAwLFxuICAgIH07XG5cbiAgICBwcml2YXRlIGNvbG9yczogYW55ID0ge1xuICAgICAgICBncmF5OiAncmdiYSg5Nyw5Nyw5NywwLjUpJyxcbiAgICAgICAgb3JhbmdlOiAnI2ZjOGM1OScsXG4gICAgICAgIG1pbnQ6ICcjNGZkYmM1JyxcbiAgICAgICAgYmx1ZTogJyM1ODc3Y2MnLFxuICAgICAgICBwaW5rOiAnI0I2MEU2MycsXG4gICAgICAgIHdoaXRlOiAnI2ZmZicsXG4gICAgICAgIGJlaWdlOiAnI2ZkZDQ5ZScsXG4gICAgICAgIGNpbm5hYmFyOiAnI2U3NTA0MCcsXG4gICAgICAgIHNlYTogJyMyNmJiZTMnLFxuICAgIH1cblxuICAgIHByaXZhdGUgZ3JhcGhzRGF0YTogQXJyYXk8SUNoYXJ0U2V0dGluZ3M+ID0gW107XG5cbiAgICBwcml2YXRlIGJnTGluZXM6IEFycmF5PHtzY2FsZVg6IG51bWJlcn0+O1xuICAgIHByaXZhdGUgY3VycmVudENoYXJ0czogbnVtYmVyW107XG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR3cmFwcGVyID0gdGhpcy52aWV3LmZpbmQoJy5qcy13cmFwcGVyJyk7XG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1jaGFydC10YWJdJyk7XG4gICAgICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PnRoaXMudmlldy5maW5kKCdjYW52YXMnKVswXTtcbiAgICAgICAgdGhpcy5jdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuXG4gICAgICAgIHRoaXMuYmdMaW5lcyA9IEFycmF5LmFwcGx5KDAsIHsgbGVuZ3RoOiA5IH0pLm1hcCgoKSA9PiB7IHJldHVybiB7IHNjYWxlWDogMCB9OyB9KTtcblxuICAgICAgICBjb25zdCBwYXJhbXNDaGFydHMgPSBVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkuY2hhcnRzO1xuICAgICAgICB0aGlzLmN1cnJlbnRDaGFydHMgPSBwYXJhbXNDaGFydHMgPyBwYXJhbXNDaGFydHMuc3BsaXQoJywnKS5tYXAoKGkpID0+IHBhcnNlSW50KGksIDEwKSkgOiBbMCwgMywgNF07XG5cbiAgICAgICAgdGhpcy5jcmVhdGVEYXRhT2JqZWN0KCk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG5cbiAgICAgICAgdGhpcy5yZXNpemUoKTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLiR3cmFwcGVyLndpZHRoKCk7XG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuJHdyYXBwZXIuaGVpZ2h0KCk7XG5cbiAgICAgICAgdGhpcy5ncmFwaCA9IHtcbiAgICAgICAgICAgIHRvcDogdGhpcy5tYXJnaW4udG9wLFxuICAgICAgICAgICAgbGVmdDogdGhpcy5tYXJnaW4ubGVmdCxcbiAgICAgICAgICAgIHJpZ2h0OiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LFxuICAgICAgICAgICAgYm90dG9tOiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20sXG4gICAgICAgICAgICBoZWlnaHQ6IHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLnRvcCAtIHRoaXMubWFyZ2luLmJvdHRvbSxcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLmxlZnQgLSB0aGlzLm1hcmdpbi5yaWdodCxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xuICAgICAgICB0aGlzLmRyYXcoKTtcbiAgICB9O1xuXG5cblxuICAgIHB1YmxpYyBlbmFibGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuc2hvd0JnKCk7XG4gICAgICAgIGxldCB2aXNpYmxlID0gMDtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHYgPSB0aGlzLmN1cnJlbnRDaGFydHMuaW5kZXhPZihpKSA+PSAwO1xuICAgICAgICAgICAgdGhpcy50b2dnbGVDaGFydChpLCB2LCBmYWxzZSwgdmlzaWJsZSAqIDAuMyk7XG4gICAgICAgICAgICB2aXNpYmxlICs9ICEhdiA/IDEgOiAwO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBkaXNhYmxlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmhpZGVCZyh0cnVlKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoaSwgZmFsc2UsIHRydWUpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY3JlYXRlRGF0YU9iamVjdCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhID0gdGhpcy4kdGFiLnRvQXJyYXkoKS5tYXAoKGVsLCBpKSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIHJldHVybiA8SUNoYXJ0U2V0dGluZ3M+e1xuICAgICAgICAgICAgICAgIGlkOiBpLFxuICAgICAgICAgICAgICAgIHhQZXJjZW50OiAwLFxuICAgICAgICAgICAgICAgIC8vIHlQb2ludHM6ICRlbC5kYXRhKCdwb2ludHMnKSxcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiB0aGlzLmdldFJhbmRvbVBvaW50cyhNYXRoLnJhbmRvbSgpICogMTAgKyA3LCBNYXRoLnJhbmRvbSgpICogMzAgKyAxOCwgNjAsIDAuMyksXG4gICAgICAgICAgICAgICAgeVBvaW50czogdGhpcy5nZXRQb2ludHMoaSksXG4gICAgICAgICAgICAgICAgY29sb3I6IHRoaXMuY29sb3JzWyRlbC5kYXRhKCdjb2xvcicpXSxcbiAgICAgICAgICAgICAgICBmaWxsOiBpID09PSAwID8gdHJ1ZSA6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHNob3duOiBmYWxzZSxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeSh0aGlzLmdyYXBoc0RhdGEubWFwKChkYXRhKSA9PiBkYXRhLnlQb2ludHMpKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZ2V0UG9pbnRzKGkpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiBbWzE0LCAxMCwgMTIsIDEzLCAxNCwgOSAsIDEyLCAxNywgMTYsIDExLCAxMywgMTksIDEwLCA5LCA4LCAxNSwgMTcsIDE1LCAyMiwgMjUsIDIxLCAyMCwgMTksIDIxLCAyMCwgMTksIDI0LCAyOCwgMjEsIDI3LCAxOCwgMjMsIDMzLCAzMSwgMTgsIDI1LCAzNiwgMjQsIDMxLCAzMywgMjEsIDM2LCAzNCwgMzAsIDI2LCAyNCwgMzUsIDI3LCAzMCwgMTgsIDIwLCAzMCwgMjYsIDI4LCAzMywgMjUsIDM5LCAyOCwgMTcsIDM1XSwgWzEsIDIsIDgsIDcsIDYsIDMsIDgsIDUsIDUsIDQsIDgsIDcsIDcsIDExLCAxMCwgOCwgNywgOSwgOCwgNiwgOCwgMTIsIDgsIDE0LCAxMSwgOCwgOCwgMTEsIDcsIDEzLCAxMywgMTYsIDIwLCAxMCwgMTAsIDEzLCAxNCwgMjAsIDE2LCAxMSwgMTcsIDE2LCAxOCwgMjEsIDgsIDIwLCAxNSwgMTUsIDE2LCAxNSwgMTksIDIwLCAxMSwgMjAsIDIwLCAxMiwgMTcsIDIwLCAyMywgMTZdLCBbMTMsIDExLCA2LCA5LCA5LCA4LCA5LCAxMSwgNywgMTQsIDEyLCA4LCAxMCwgMTYsIDksIDIwLCAxOSwgMTIsIDEyLCAxNSwgMTgsIDE1LCAxNCwgMjIsIDE5LCAyMCwgMjAsIDE3LCAyNCwgMjMsIDI3LCAyMCwgMjAsIDIxLCAyMSwgMjUsIDIwLCAyNywgMjIsIDI0LCAyNCwgMjYsIDIzLCAyNSwgMjYsIDIxLCAyOSwgMjYsIDI3LCAyNiwgMjUsIDIwLCAxNSwgMjUsIDIyLCAyNiwgMjAsIDIzLCAzMywgMjhdLCBbMiwgNSwgMTAsIDksIDE4LCA5LCAxMCwgMTIsIDIwLCAxOSwgMTMsIDksIDE1LCAxMSwgMjEsIDE5LCAyMywgMjMsIDI2LCAyMywgMjMsIDIzLCAyNSwgMjUsIDI2LCAyNiwgMzAsIDIyLCAyNSwgMzMsIDM4LCAxNiwgMzIsIDI3LCAyNywgMzUsIDI4LCAyOCwgMzUsIDM0LCAzNiwgMjUsIDI3LCAyNSwgNDUsIDM3LCAzMSwgMzYsIDM3LCAzNiwgMjgsIDM4LCA0MiwgNDIsIDQ0LCA0MywgNDEsIDM0LCAzMSwgMzZdLCBbNywgMTAsIDEwLCA2LCA1LCAxMywgMTcsIDEzLCAxMCwgMTEsIDE0LCAxNywgMTYsIDE5LCAyMiwgMjAsIDI1LCAxNywgMjQsIDEzLCAyNSwgMjAsIDI2LCAyNCwgMjYsIDE1LCAyMywgMjQsIDMwLCAzMCwgMjksIDMxLCAzMSwgMjEsIDMyLCAzMSwgMjUsIDM4LCAzNSwgMjgsIDQwLCAzMiwgMzcsIDMxLCAzNiwgNDAsIDM1LCAzNywgMjMsIDM2LCAzNywgNDAsIDQwLCA0MSwgMTcsIDIzLCA0MCwgMzQsIDQwLCA0MF0sIFs2LCA2LCAyLCAxMiwgMTAsIDEzLCAxMiwgNCwgMTIsIDExLCAxMywgMTYsIDE0LCAxNCwgMTQsIDE0LCAxNCwgMTcsIDE1LCAxNiwgMTYsIDEyLCAxOCwgMTUsIDIyLCAxNiwgMTksIDE4LCAyMSwgMjEsIDI1LCAxNSwgMjYsIDE3LCAyNywgMjcsIDIxLCAxMiwgMjQsIDE1LCAxOSwgMjksIDE4LCAyNCwgMjUsIDE4LCAyOCwgMzIsIDI1LCAyOCwgMjcsIDI4LCAzMSwgMjUsIDI3LCAzNSwgMjQsIDI3LCAxNSwgMjhdLCBbNCwgNSwgMTAsIDEzLCAxNSwgMTcsIDcsIDE3LCAxMiwgMTIsIDE3LCAxMiwgMTIsIDExLCAyMiwgMjEsIDE5LCAyMCwgMjEsIDI2LCAyMiwgMTksIDIxLCAyNCwgMjUsIDEyLCAyOCwgMjcsIDI4LCAyNywgMzEsIDMxLCAxNSwgMzAsIDI2LCAxOSwgMjksIDI5LCAzMywgMzMsIDE3LCAzMCwgMzAsIDMzLCAyNywgMzQsIDMzLCAxNywgMzksIDIxLCAzNSwgMzMsIDMzLCAyMSwgMzUsIDMwLCAzOSwgMzEsIDM1LCAyOV1dW2ldO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGdldFJhbmRvbVBvaW50cyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGFtb3VudDogbnVtYmVyLCBjYXN0OiBudW1iZXIpOiBudW1iZXJbXSB7XG4gICAgICAgIHJldHVybiBBcnJheS5hcHBseShudWxsLCB7IGxlbmd0aDogYW1vdW50IH0pXG4gICAgICAgICAgICAubWFwKChwLCBpLCBhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBtYXggLSBtaW47XG4gICAgICAgICAgICAgICAgY29uc3QgcGVyYyA9IGkgLyBhLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBjb25zdCBzaW4gPSBNYXRoLnNpbihwZXJjICogTWF0aC5QSSAvIDIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHJuZCA9IDAuNCAqIChNYXRoLnJhbmRvbSgpIDwgY2FzdCA/IC0wLjUgKyBNYXRoLnJhbmRvbSgpIDogMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgbWluUm5kID0gKE1hdGgucmFuZG9tKCkgKiAocGVyYyA8IDAuNSA/IDAuOSA6IDEpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCgobWluICogbWluUm5kKSArIChNYXRoLnJhbmRvbSgpICogcmFuZ2UgKiAwLjIpICsgKHNpbiAqIHJhbmdlICogKDAuNiArIHJuZCkpKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHNhdmVDYWNoZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhLmZvckVhY2goKGRhdGEpID0+IHtcbiAgICAgICAgICAgIGRhdGEueVB4ID0gdGhpcy5jYWxjWVB4KGRhdGEueVBvaW50cyk7XG4gICAgICAgICAgICBpZiAoIWRhdGEubGFiZWxZKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5sYWJlbFkgPSBkYXRhLnlQeFswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uQ2xpY2tUYWIpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uQ2xpY2tUYWIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLnRvZ2dsZUNoYXJ0KCQoZS5jdXJyZW50VGFyZ2V0KS5pbmRleCgpKTtcbiAgICAgICAgdGhpcy5jdXJyZW50Q2hhcnRzID0gdGhpcy5ncmFwaHNEYXRhLm1hcCgoZGF0YSwgaSkgPT4gZGF0YS5zaG93biA/IGkgOiBudWxsKS5maWx0ZXIoKGluZGV4KSA9PiBpbmRleCAhPT0gbnVsbCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2hvd0JnKCk6IHZvaWQge1xuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLCB7IGJnOiB0cnVlIH0pO1xuICAgICAgICBnc2FwLnRvKHRoaXMuYmdMaW5lcywge1xuICAgICAgICAgICAgc2NhbGVYOiAxLFxuICAgICAgICAgICAgZHVyYXRpb246IDIsXG4gICAgICAgICAgICBlYXNlOiAncG93ZXIzJyxcbiAgICAgICAgICAgIHN0YWdnZXI6IC0wLjEsXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGhpZGVCZyhxdWljaz86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcywgeyBiZzogdHJ1ZSB9KTtcbiAgICAgICAgZ3NhcC50byh0aGlzLmJnTGluZXMsIHtcbiAgICAgICAgICAgIHNjYWxlWDogMCxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAhcXVpY2sgPyAyIDogMCxcbiAgICAgICAgICAgIGVhc2U6ICdwb3dlcjMnLFxuICAgICAgICAgICAgc3RhZ2dlcjogIXF1aWNrID8gLTAuMSA6IDAsXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZUNoYXJ0KGluZGV4OiBudW1iZXIsIHNob3c/OiBib29sZWFuLCBxdWljaz86IGJvb2xlYW4sIGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdyYXBoc0RhdGFbaW5kZXhdO1xuICAgICAgICBpZiAodHlwZW9mIHNob3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBzaG93ID0gIWRhdGEuc2hvd247XG4gICAgICAgIH1cblxuICAgICAgICBnc2FwLnRvKGRhdGEsIHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiAhcXVpY2sgPyAzLjIgOiAwLFxuICAgICAgICAgICAgeFBlcmNlbnQ6IHNob3cgPyAxIDogMCxcbiAgICAgICAgICAgIGxhYmVsWTogZGF0YS55UHhbc2hvdyA/IGRhdGEueVB4Lmxlbmd0aCAtIDEgOiAwXSxcbiAgICAgICAgICAgIHJvdW5kUHJvcHM6ICdsYWJlbFknLFxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMycsXG4gICAgICAgICAgICBkZWxheTogIXF1aWNrID8gZGVsYXkgfHwgMCA6IDAsXG4gICAgICAgICAgICBvblVwZGF0ZTogdGhpcy5kcmF3LFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLiR0YWIuZXEoaW5kZXgpLnRvZ2dsZUNsYXNzKCdpcy1vbi1jaGFydCcsIHNob3cpO1xuICAgICAgICB0aGlzLmdyYXBoc0RhdGFbaW5kZXhdLnNob3duID0gc2hvdztcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBkcmF3ID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmN0eC5jbGVhclJlY3QoMCwgMCwgdGhpcy5jYW52YXMud2lkdGgsIHRoaXMuY2FudmFzLmhlaWdodCk7XG4gICAgICAgIHRoaXMuZHJhd0JnKCk7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKChncmFwaERhdGEpID0+IHRoaXMuZHJhd0dyYXBoKGdyYXBoRGF0YSkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGRyYXdCZygpOiB2b2lkIHtcblxuICAgICAgICAvLyBkcmF3IFggYXhpc1xuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcblxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xuICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5sZWZ0LCB0aGlzLmdyYXBoLmJvdHRvbSk7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgMjAsIHRoaXMuZ3JhcGguYm90dG9tKTtcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgY29uc3QgaGVscGVyc0xpbmUgPSA4O1xuICAgICAgICBjb25zdCB0ZXh0VHJhbnNmb3JtID0gNTtcbiAgICAgICAgY29uc3Qgc3RlcCA9IDU7XG4gICAgICAgIGxldCB2YWw7XG4gICAgICAgIGNvbnN0IHllYXJzID0gWzIwMTUsIDIwMTYsIDIwMTcsIDIwMTgsIDIwMTksIDIwMjAsIDIwMjFdO1xuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMuZ3JheTtcbiAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3JzLmJsdWU7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gaGVscGVyc0xpbmU7IGkrKykge1xuICAgICAgICAgICAgdmFsID0gNTAgLSBzdGVwICogaTtcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gdGhpcy5iZ0xpbmVzW2ldLnNjYWxlWDtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgdmFsICsgJycsIDAsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3AgKyB0ZXh0VHJhbnNmb3JtKTtcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgubGVmdCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5sZWZ0ICsgKHRoaXMuZ3JhcGgud2lkdGggKyAyMCkgKiB0aGlzLmJnTGluZXNbaV0uc2NhbGVYLCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHllYXJzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxMnB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgeWVhcnNbal0gKyAnJywgdGhpcy5ncmFwaC53aWR0aCAvIHllYXJzLmxlbmd0aCAqIGogKyB0aGlzLm1hcmdpbi5sZWZ0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0ZXh0VHJhbnNmb3JtICogMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGRyYXdHcmFwaCA9IChkYXRhOiBJQ2hhcnRTZXR0aW5ncyk6IHZvaWQgPT4ge1xuICAgICAgICBsZXQgbGFzdFZhbDogbnVtYmVyO1xuICAgICAgICBsZXQgbGFzdFk6IG51bWJlcjtcblxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDM7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcblxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgY29uc3QgY29sV2lkdGggPSB0aGlzLmdyYXBoLndpZHRoIC8gKGRhdGEueVB4Lmxlbmd0aCAtIDEpO1xuICAgICAgICBjb25zdCBtYXhYID0gKGRhdGEueFBlcmNlbnQgKiBjb2xXaWR0aCAqIGRhdGEueVB4Lmxlbmd0aCkgKyB0aGlzLmdyYXBoLmxlZnQ7XG5cbiAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IHggPSBjb2xXaWR0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XG4gICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgIGxhc3RZID0geTtcbiAgICAgICAgICAgICAgICBsYXN0VmFsID0gZGF0YS55UG9pbnRzW2ldO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh4IDwgbWF4WCArIGNvbFdpZHRoICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgeSA9IHRoaXMuZ2V0SW50ZXJQb2ludHNZKG1heFgsIFt4IC0gY29sV2lkdGgsIGFbaSAtIDFdXSwgW3gsIHldKTtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG5cbiAgICAgICAgLy8gZmlsbDpcbiAgICAgICAgaWYgKGRhdGEuZmlsbCkge1xuICAgICAgICAgICAgbGV0IGxhc3RYID0gdGhpcy5tYXJnaW4ubGVmdDtcblxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gZGF0YS5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMC40O1xuXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIGRhdGEueVB4LmZvckVhY2goICh5LCBpLCBhKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IGNvbFdpZHRoICogaSArIHRoaXMuZ3JhcGgubGVmdDtcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh4LCB5KTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFggPSB4O1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeCA8IG1heFggKyBjb2xXaWR0aCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pKTtcbiAgICAgICAgICAgICAgICAgICAgbGFzdFggPSBtYXhYO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKGxhc3RYLCB0aGlzLmdyYXBoLmJvdHRvbSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5sZWZ0LCB0aGlzLmdyYXBoLmJvdHRvbSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxhYmVsOlxuICAgICAgICBpZiAoZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgIC8vIGxpbmU6XG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5yaWdodCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyNCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG5cbiAgICAgICAgICAgIC8vIHBlbnRhZ29uOlxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyMCwgZGF0YS5sYWJlbFkpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyA0MCwgZGF0YS5sYWJlbFkgLSAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgLSAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgKyAxMik7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDQwLCBkYXRhLmxhYmVsWSArIDEyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xuXG4gICAgICAgICAgICAvLyB0ZXh0OlxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTRweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChsYXN0VmFsICsgJycsIHRoaXMuZ3JhcGgucmlnaHQgKyA0NCwgZGF0YS5sYWJlbFkgKyA0ICk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvLy8gSEVMUEVSU1xuXG4gICAgcHJpdmF0ZSBsYXJnZXN0WVZhbChkYXRhOiBBcnJheTxudW1iZXI+KTogbnVtYmVyIHtcbiAgICAgICAgbGV0IGxhcmdlc3QgPSAwO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKyApIHtcbiAgICAgICAgICAgIGlmIChkYXRhW2ldID4gbGFyZ2VzdCkge1xuICAgICAgICAgICAgICAgIGxhcmdlc3QgPSBkYXRhW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxhcmdlc3Q7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY2FsY1lQeChkYXRhKTogQXJyYXk8bnVtYmVyPiB7XG4gICAgICAgIGNvbnN0IGxhcmdlc3QgPSB0aGlzLmxhcmdlc3RZVmFsKGRhdGEpO1xuICAgICAgICBsZXQgYXJyID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBsZXQgaXRlbSA9IE1hdGgucm91bmQoKHRoaXMuZ3JhcGguaGVpZ2h0IC0gZGF0YVtpXSAvIGxhcmdlc3QgKiB0aGlzLmdyYXBoLmhlaWdodCkgKyB0aGlzLmdyYXBoLnRvcCk7XG4gICAgICAgICAgICBhcnIucHVzaChpdGVtKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZ2V0SW50ZXJQb2ludHNZKHg6IG51bWJlciwgcG9pbnRBOiBudW1iZXJbXSwgcG9pbnRCOiBudW1iZXJbXSk6IG51bWJlciB7XG4gICAgICAgIGNvbnN0IFt4MSwgeTFdID0gcG9pbnRBO1xuICAgICAgICBjb25zdCBbeDIsIHkyXSA9IHBvaW50QjtcbiAgICAgICAgcmV0dXJuICh5MiAtIHkxKSAqICh4IC0geDEpIC8gKHgyIC0geDEpICsgeTE7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcblxuZXhwb3J0IGNsYXNzIENvbXBvbmVudEV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdjaGFuZ2UnO1xufVxuXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgQ29tcG9uZW50IGV4dGVuZHMgSGFuZGxlciB7XG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPzogT2JqZWN0KSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIGlmICghdmlld1swXSkgeyBjb25zb2xlLndhcm4oJ2NvbXBvbmVudCBidWlsdCB3aXRob3V0IHZpZXcnKTsgfVxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIHRoaXMpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcHJlbG9hZEltYWdlcygpOiBBcnJheTxzdHJpbmc+IHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgYW5pbWF0ZUluKGluZGV4PzogbnVtYmVyLCBkZWxheT86IG51bWJlcik6IHZvaWQgeyB9XG5cblxuXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgLy8gaWYgeW91IGRvbid0IHdhbnQgdG8gYW5pbWF0ZSBjb21wb25lbnQsXG4gICAgICAgIC8vIGp1c3QgcmV0dXJuIGVtcHR5IFByb21pc2U6XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbiAgICAgICAgLy8gaWYgeW91IG5lZWQgYW5pbWF0aW9uOlxuICAgICAgICAvLyByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAvLyAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgLy8gICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgIC8vICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgLy8gICAgICAgICB9LFxuICAgICAgICAvLyAgICAgICAgIGR1cmF0aW9uOiAwLjMsXG4gICAgICAgIC8vICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgLy8gICAgIH0pO1xuICAgICAgICAvLyB9KTtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHR1cm5PZmYoKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQgeyB9XG5cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4geyB9O1xuXG5cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnY29tcCcsIG51bGwpO1xuICAgICAgICB0aGlzLnZpZXcub2ZmKCk7XG4gICAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRvZ2dsZTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGJvZHk6IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzVG9nZ2xlZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIGJvZHlIZWlnaHQ6IG51bWJlcjtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0b2dnbGUgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWJ1dHRvbi10b2dnbGUnKTtcbiAgICAgICAgdGhpcy4kYm9keSA9IHRoaXMudmlldy5maW5kKCcuanMtZGFzaGJvYXJkLWJvZHknKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgdGhpcy5pbml0aWFsU3RhdGUoKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcblxuICAgIH07XG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRvZ2dsZS5vZmYoJy50b2dnbGUnKS5vbignY2xpY2sudG9nZ2xlJywgdGhpcy50b2dnbGVQYW5lbCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSB0b2dnbGVQYW5lbCA9IChlKSA9PiB7XG4gICAgICAgIGlmICghdGhpcy5pc1RvZ2dsZWQpIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtdG9nZ2xlZCcpO1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJ2F1dG8nLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnMCcsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgaW5pdGlhbFN0YXRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLnNldCh0aGlzLiRib2R5LCB7IGhlaWdodDogJzAnfSk7XG4gICAgfVxuICAgIFxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9GaWx0ZXJzJztcblxuZXhwb3J0IGNsYXNzIERyb3Bkb3duIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RdJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmFsdWVdJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMudmlldy5hdHRyKCdkYXRhLXNlbGVjdGVkJywgdGhpcy4kc2VsZWN0ZWQudGV4dCgpKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3Lm9mZignLnNlbGVjdCcpLm9uKCdjbGljay5zZWxlY3QnLCB0aGlzLnRvZ2dsZSk7XG4gICAgICAgICRkb2Mub2ZmKCcuZHJvcGRvd24nKS5vbignY2xpY2suZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSAmJiAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgndmFsdWUnKTtcblxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XG5cbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQtY291bnRyeScsIGN1cnJlbnQpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudCk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIEZpbHRlcnMgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogRmlsdGVycztcblxuICAgIHByaXZhdGUgJGNsZWFyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcGFuZWw6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtU2VjdG9yOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbVRpbWU6IEpRdWVyeTtcbiAgICBwcml2YXRlICR0aW1lbGluZUl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlICRhbGxTZWN0b3JzOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcGlja2VkOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWRDb3VudHJ5OiBKUXVlcnk7XG5cbiAgICBwcml2YXRlIGZpbHRlcnM6IEFycmF5PHN0cmluZz4gPSBbXTtcbiAgICBwcml2YXRlIGlzQWxsQ2hlY2tlZDogYm9vbGVhbjtcblxuXG4gICAgcHVibGljIHN0YXRpYyBzaG93UGlja2VkRmlsdGVycyhjb3VudHJ5Pzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGxldCBwaWNrZWRTZWN0b3JzID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG4gICAgICAgIGxldCBwaWNrZWRUaW1lID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcbiAgICAgICAgbGV0IHBpY2tlZENvdW50cnkgPSBjb3VudHJ5ID8gY291bnRyeSA6IEZpbHRlcnMuaW5zdGFuY2UuJHNlbGVjdGVkQ291bnRyeS50ZXh0KCk7XG5cblxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuZmluZCgnc3BhbicpLnJlbW92ZSgpO1xuXG4gICAgICAgIGlmIChwaWNrZWRTZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRTZWN0b3JzKTtcblxuICAgICAgICAgICAgaWYgKHBpY2tlZFNlY3RvcnMubGVuZ3RoID09PSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWwnLCBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzKTtcbiAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycy50ZXh0KCkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwaWNrZWRTZWN0b3JzLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyAkKGVsKS50ZXh0KCkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZENvdW50cnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBpY2tlZENvdW50cnkpO1xuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZENvdW50cnkgKyAnPC9zcGFuPicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZFRpbWUpIHtcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRUaW1lLmRhdGEoJ2l0ZW0tbGFiZWwnKSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kY2xlYXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsZWFyJyk7XG4gICAgICAgIHRoaXMuJHBhbmVsID0gdGhpcy52aWV3LmZpbmQoJy5qcy1wYW5lbCcpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lID0gdGhpcy52aWV3LmZpbmQoJy5qcy10aW1lJyk7XG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10aW1lXScpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWFsbCcpO1xuICAgICAgICB0aGlzLiRwaWNrZWQgPSAkKCcuanMtcGlja2VkLWZpbHRlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZENvdW50cnkgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0XScpO1xuXG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICBjb25zb2xlLmxvZyhGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLCBGaWx0ZXJzLmluc3RhbmNlLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJykuZGF0YSgnc2VsZWN0ZWQnKSk7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgLy8gICAgIHRoaXMuJGNsZWFyLmNzcygnaGVpZ2h0JywgdGhpcy4kcGFuZWwub3V0ZXJIZWlnaHQoKSk7XG4gICAgICAgIC8vIH0pO1xuICAgIH07XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5vZmYoJy5zZWN0b3InKS5vbignY2xpY2suc2VjdG9yJywgdGhpcy50b2dnbGVTZWN0b3IpO1xuICAgICAgICB0aGlzLiRpdGVtVGltZS5vZmYoJy50aW1lJykub24oJ2NsaWNrLnRpbWUnLCB0aGlzLnRvZ2dsZVRpbWUpO1xuICAgICAgICB0aGlzLiRjbGVhci5vZmYoJy5jbGVhcicpLm9uKCdjbGljay5jbGVhcicsIHRoaXMuY2xlYXJBcnJheSk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMub2ZmKCcuYWxsJykub24oJ2NsaWNrLmFsbCcsIHRoaXMubWFya0FsbFNlY3RvcnMpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBtYXJrQWxsU2VjdG9ycyA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgdGltZUNoZWNrZWQgPSB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuXG4gICAgICAgIHRoaXMuY2xlYXJBcnJheSgpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcblxuICAgICAgICBpZiAodGltZUNoZWNrZWQpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGltZUNoZWNrZWQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZSh0aW1lQ2hlY2tlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGNsZWFyQXJyYXkgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xuICAgICAgICB0aGlzLiRpdGVtVGltZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy51bm1hcmtUaW1lbGluZSgpO1xuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZVNlY3RvciA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGxDaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlVGltZSA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcblxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlUHJldiA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhY3RpdmVQcmV2KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGFjdGl2ZVByZXYsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZShjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgbWFya1RpbWVsaW5lKGVsOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdqcy10aW1lJykpIHtcbiAgICAgICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZWRvdCA9IHRoaXMuJHRpbWVsaW5lSXRlbS5maWx0ZXIoJ1tkYXRhLXRpbWU9JyArIGVsLmRhdGEoJ2l0ZW0nKSArICddJyk7XG4gICAgICAgICAgICB0aW1lbGluZWRvdC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgdW5tYXJrVGltZWxpbmUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSByZW1vdmVFbGVtZW50RnJvbUFycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZmlsdGVycy5pbmRleE9mKCRlbC5kYXRhKCdpdGVtJykpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYWRkRWxlbWVudFRvQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGFycmF5LnB1c2goJGVsLmRhdGEoJ2l0ZW0nKSk7XG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdGSUxURVJTOicsIHRoaXMuZmlsdGVycyk7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuaW50ZXJmYWNlIElEYXRhU3RhdCB7XG4gICAgc2VjdG9yOiBzdHJpbmc7XG4gICAgdmFsdWU6IG51bWJlcjtcbiAgICBjb2xvcjogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSUdyaWRJdGVtUG9zaXRpb24ge1xuICAgIGNvbHVtbl9zdGFydDogbnVtYmVyO1xuICAgIGNvbHVtbl9lbmQ6IG51bWJlcjtcbiAgICByb3dfc3RhcnQ6IG51bWJlcjtcbiAgICByb3dfZW5kOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNYXNvbnJ5IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgZGF0YTogQXJyYXk8SURhdGFTdGF0PiA9IFtdO1xuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlIGRhdGFBcnJheTogQXJyYXk8YW55PiA9IFtdO1xuICAgIHByaXZhdGUgYXJlYTogbnVtYmVyO1xuICAgIHByaXZhdGUgaXRlbU1hcmdpbjogbnVtYmVyID0gMztcbiAgICBwcml2YXRlIGdyaWRSb3dzOiBudW1iZXIgPSAyMDtcbiAgICBwcml2YXRlIGdyaWRDb2xzOiBudW1iZXIgPSAyMDtcbiAgICBwcml2YXRlIGdyaWRDZWxsczogbnVtYmVyID0gdGhpcy5ncmlkQ29scyAqIHRoaXMuZ3JpZFJvd3M7XG4gICAgcHJpdmF0ZSBjZWxsc0JhbGFuY2U6IG51bWJlciA9IHRoaXMuZ3JpZENlbGxzO1xuICAgIHByaXZhdGUgZ3JpZENlbGw6IGFueSA9IHtcbiAgICAgICAgd2lkdGg6IHRoaXMudmlldy53aWR0aCgpIC8gdGhpcy5ncmlkQ29scyxcbiAgICAgICAgaGVpZ2h0OiB0aGlzLnZpZXcuaGVpZ2h0KCkgLyB0aGlzLmdyaWRSb3dzLFxuICAgIH07XG4gICAgcHJpdmF0ZSBtaW5DZWxsV2lkdGg6IG51bWJlciA9IDM7XG4gICAgcHJpdmF0ZSBtaW5DZWxsSGVpZ2h0OiBudW1iZXIgPSAzO1xuXG4gICAgcHJpdmF0ZSBpdGVtUG9zaXRpb25pbmc6IEFycmF5PElHcmlkSXRlbVBvc2l0aW9uPiA9IFtdO1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLW1hc29ucnktdGlsZScpO1xuICAgICAgICB0aGlzLiRpdGVtLmVhY2goIChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgZGF0YUl0ZW0gPSA8SURhdGFTdGF0PntcbiAgICAgICAgICAgICAgICBzZWN0b3I6ICQoZWwpLmRhdGEoJ3RpbGUnKSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogJChlbCkuZGF0YSgndmFsdWUnKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogJChlbCkuZGF0YSgnY29sb3InKSxcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmRhdGEucHVzaChkYXRhSXRlbSk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmFyZWEgPSAodGhpcy52aWV3LndpZHRoKCkgLSB0aGlzLml0ZW1NYXJnaW4gKiAzKSAqIHRoaXMudmlldy5oZWlnaHQoKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGEsIHRoaXMuYXJlYSwgJ2NlbGwgd2lkdGgnLCB0aGlzLmdyaWRDZWxsLndpZHRoLCAnY2VsbCBoZWlnaHQnLCB0aGlzLmdyaWRDZWxsLmhlaWdodCk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIFxuICAgIH07XG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoKTtcbiAgICAgICAgdGhpcy5nZXRBcnJGcm9tT2JqZWN0KCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBnZXRBcnJGcm9tT2JqZWN0KCk6IGFueSB7XG4gICAgICAgIHRoaXMuZGF0YUFycmF5ID0gT2JqZWN0LmVudHJpZXModGhpcy5kYXRhKS5zb3J0KChhLCBiKSA9PiBhWzBdLmxvY2FsZUNvbXBhcmUoYlswXSkpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YUFycmF5KTtcblxuICAgICAgICB0aGlzLmRhdGFBcnJheS5mb3JFYWNoKCAoZWwsIGkpID0+IHtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsWzFdLnZhbHVlLCBpLCAnZWwnKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZWxbMV0udmFsdWU7XG4gICAgICAgICAgICBjb25zdCBzZWN0b3IgPSBlbFsxXS5zZWN0b3I7XG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGVsWzFdLmNvbG9yO1xuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xuXG4gICAgICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKHNlY3RvciwgdmFsdWUsIGNvbG9yLCBpbmRleCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2V0VGlsZVNpemUoc2VjdG9yOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIGNvbG9yOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuJGl0ZW0uZmlsdGVyKCdbZGF0YS10aWxlPScgKyBzZWN0b3IgKyAnXScpO1xuICAgICAgICBsZXQgYXJlYSwgaCwgdywgdCwgbCwgY29sdW1uX3N0YXJ0LCBjb2x1bW5fZW5kLCByb3dfc3RhcnQsIHJvd19lbmQsIGl0ZW0sIGFyZWFHcmlkO1xuICAgICAgICBcbiAgICAgICAgYXJlYSA9IHRoaXMuYXJlYSAqICh2YWx1ZSAvIDEwMCk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2coYXJlYSwgJzphcmVhJywgdGhpcy5pdGVtUG9zaXRpb25pbmcsdGhpcy5pdGVtUG9zaXRpb25pbmcubGVuZ3RoID4gMCwgJ2NoZWNrIGlmIHNvbWUgaXRlbSBvbiBhcnJheScpO1xuICAgICAgICBcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQgPSAxO1xuICAgICAgICAgICAgcm93X3N0YXJ0ID0gMTtcbiAgICAgICAgICAgIHJvd19lbmQgPSB0aGlzLmdyaWRSb3dzO1xuICAgICAgICAgICAgY29sdW1uX2VuZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLmhlaWdodCAqIHJvd19lbmQpIC8gdGhpcy5ncmlkQ2VsbC53aWR0aCk7XG4gICAgICAgICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKTtcbiAgICAgICAgICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZiAoaW5kZXggPiAwKSB7XG4gICAgICAgIC8vICAgICBjb2x1bW5fc3RhcnQgPSB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0xXS5jb2x1bW5fZW5kICsgMSA8IHRoaXMuZ3JpZENvbHMgLSB0aGlzLm1pbkNlbGxXaWR0aCA/IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDogdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMl0uY29sdW1uX2VuZCArIDE7XG4gICAgICAgIC8vICAgICBhcmVhR3JpZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA+PSA2ID8gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpIDogNjtcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XG4gICAgICAgIC8vICAgICBjb2x1bW5fZW5kID0gYXJlYUdyaWQgLyB0aGlzLm1pbkNlbGxXaWR0aCBcblxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYXJlYUdyaWQsICdhbW91bnQgb2YgY2VsbHMnKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGl0ZW0gPSA8SUdyaWRJdGVtUG9zaXRpb24+e1xuICAgICAgICAgICAgY29sdW1uX3N0YXJ0OiBjb2x1bW5fc3RhcnQsXG4gICAgICAgICAgICBjb2x1bW5fZW5kOiBjb2x1bW5fZW5kLFxuICAgICAgICAgICAgcm93X3N0YXJ0OiByb3dfc3RhcnQsXG4gICAgICAgICAgICByb3dfZW5kOiByb3dfZW5kLFxuICAgICAgICB9O1xuXG4gICAgICAgIGN1cnJlbnQuY3NzKHtcbiAgICAgICAgICAgIHBvc2l0aW9uOiAncmVsYXRpdmUnLFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1zdGFydCc6IGNvbHVtbl9zdGFydCxcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1lbmQnOiBjb2x1bW5fZW5kLFxuICAgICAgICAgICAgJ2dyaWQtcm93LXN0YXJ0Jzogcm93X3N0YXJ0LFxuICAgICAgICAgICAgJ2dyaWQtcm93LWVuZCc6ICdzcGFuJyArIHJvd19lbmQsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IGNvbG9yLFxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLml0ZW1Qb3NpdGlvbmluZy5wdXNoKGl0ZW0pO1xuICAgICAgICB0aGlzLmNlbGxzQmFsYW5jZSA9IHRoaXMuY2VsbHNCYWxhbmNlIC0gYXJlYUdyaWQ7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY2VsbHNCYWxhbmNlLCAnOmZyZWUgY2VsbHMnKTtcbiAgICAgICAgXG4gICAgfVxuXG59XG4iLCJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcblxuXG5cbmludGVyZmFjZSBJUGFyYWxsYXhTZXR0aW5ncyB7XG4gICAgZWxlbWVudHM6IEFycmF5PHN0cmluZz47XG4gICAgbW92ZVg6IEFycmF5PG51bWJlcj47XG4gICAgbW92ZVk6IEFycmF5PG51bWJlcj47XG59XG5cblxuaW50ZXJmYWNlIElQYXJhbGxheEVsZW1lbnREYXRhIHtcbiAgICAkZWw6IEpRdWVyeTtcbiAgICBtb3ZlWDogbnVtYmVyO1xuICAgIG1vdmVZOiBudW1iZXI7XG59XG5cblxuXG5leHBvcnQgY2xhc3MgUGFyYWxsYXggZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSBtb3ZlWDogbnVtYmVyO1xuICAgIHByaXZhdGUgbW92ZVk6IG51bWJlcjtcbiAgICBwcml2YXRlIHRpbWU6IG51bWJlciA9IDI7XG4gICAgcHJpdmF0ZSBzZXR0aW5nczogSVBhcmFsbGF4U2V0dGluZ3M7XG4gICAgcHJpdmF0ZSBpdGVtczogSVBhcmFsbGF4RWxlbWVudERhdGFbXTtcblxuXG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuY3JlYXRlVmFsdWVBcnJheSgpO1xuXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdQYXJhbGxheCcsIHRoaXMpO1xuXG5cbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCkge1xuICAgICAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnZpZXcub24oJ21vdXNlbW92ZScsIHRoaXMub25Nb3VzZU1vdmUpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGNyZWF0ZVZhbHVlQXJyYXkoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9ycyA9ICh0aGlzLnNldHRpbmdzLmVsZW1lbnRzKS50b1N0cmluZygpLnJlcGxhY2UoL1xccy9nLCAnJykuc3BsaXQoJywnKTtcbiAgICAgICAgY29uc3QgbW92ZVggPSAodGhpcy5zZXR0aW5ncy5tb3ZlWCkubWFwKE51bWJlcik7XG4gICAgICAgIGNvbnN0IG1vdmVZID0gKHRoaXMuc2V0dGluZ3MubW92ZVkpLm1hcChOdW1iZXIpO1xuXG4gICAgICAgIHRoaXMuaXRlbXMgPSBzZWxlY3RvcnMubWFwKChzZWwsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9IHRoaXMudmlldy5maW5kKCcuJyArIHNlbCk7XG4gICAgICAgICAgICBpZiAoISRlbFswXSkgeyBjb25zb2xlLndhcm4oYFRoZXJlIGlzIG5vIC4ke3NlbH0gZWxlbWVudCB0byB1c2UgaW4gcGFyYWxsYXhgKTsgfVxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICBtb3ZlWDogbW92ZVhbaV0sXG4gICAgICAgICAgICAgICAgbW92ZVk6IG1vdmVZW2ldLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSkuZmlsdGVyKChpdGVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gISFpdGVtLiRlbFswXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZXZlbnQpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5tb3ZlWCA9ICggZXZlbnQuY2xpZW50WCAvIHdpbmRvdy5pbm5lcldpZHRoKSAtIDAuNTtcbiAgICAgICAgdGhpcy5tb3ZlWSA9ICggZXZlbnQuY2xpZW50WSAvIHdpbmRvdy5pbm5lckhlaWdodCkgLSAwLjU7XG5cbiAgICAgICAgdGhpcy5hbmltYXRlKC10aGlzLm1vdmVYLCAtdGhpcy5tb3ZlWSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYW5pbWF0ZShtb3ZlWCwgbW92ZVkpOiB2b2lkIHtcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zKSB7IHJldHVybjsgfVxuICAgICAgICB0aGlzLml0ZW1zLmZvckVhY2goKGl0ZW0sIGkpID0+IHtcbiAgICAgICAgICAgIGdzYXAudG8oaXRlbS4kZWwsIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGhpcy50aW1lLFxuICAgICAgICAgICAgICAgIHg6IG1vdmVYICogaXRlbS5tb3ZlWCxcbiAgICAgICAgICAgICAgICB5OiBtb3ZlWSAqIGl0ZW0ubW92ZVksXG4gICAgICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMicsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIFJhbmdlIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIFxuICAgIHByaXZhdGUgJHRyaWdnZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xuICAgIHByaXZhdGUgJHNlbGVjdGVkOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcmFkaW86IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdGVkXScpO1xuICAgICAgICB0aGlzLiRyYWRpbyA9IHRoaXMudmlldy5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0cmlnZ2VyLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZSk7XG4gICAgICAgICRkb2Mub2ZmKCcuc21hbGxkcm9wZG93bicpLm9uKCdjbGljay5zbWFsbGRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcbiAgICAgICAgdGhpcy4kcmFkaW8ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xuICAgICAgICB0aGlzLmlzT3BlbiA/IHRoaXMuY2xvc2VTZWxlY3QoKSA6IHRoaXMub3BlblNlbGVjdChlKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgb3BlblNlbGVjdChlKTogdm9pZCB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIGNsb3NlU2VsZWN0KCk6IHZvaWQge1xuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJ29wZW4/Jyk7XG4gICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpIHx8ICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCd2YWx1ZScpO1xuXG4gICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcblxuICAgICAgICB0aGlzLiRzZWxlY3RlZC5hdHRyKCdkYXRhLXNlbGVjdGVkJywgY3VycmVudCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcblxuZXhwb3J0IGNsYXNzIFNsaWRlciBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgXG4gICAgcHJpdmF0ZSBpbmRleDogbnVtYmVyID0gMDtcbiAgICBwcml2YXRlICRuYXY6IEpRdWVyeTtcbiAgICBwcml2YXRlICRjYXB0aW9uczogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcbiAgICAgICAgdGhpcy4kbmF2ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1uYXYnKTtcbiAgICAgICAgdGhpcy4kY2FwdGlvbnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNhcHRpb24nKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kbmF2Lm9mZignLm5hdicpLm9uKCdjbGljay5uYXYnLCB0aGlzLnN3aXRjaFNsaWRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN3aXRjaFNsaWRlID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgdGhpcy5pbmRleCA9IGN1cnJlbnQuaW5kZXgoKTtcblxuICAgICAgICB0aGlzLnNldEFjdGl2ZUVsZW1lbnQodGhpcy4kbmF2LCAwKTtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGl0ZW0sIDEwMCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlRWxlbWVudCh0aGlzLiRjYXB0aW9ucywgMTAwMCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHNldEFjdGl2ZUVsZW1lbnQoZWw6IEpRdWVyeSwgZGVsYXk6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICBlbC5lcSh0aGlzLmluZGV4KS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIH0sIGRlbGF5KTtcbiAgICB9XG59IiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4uL1NpdGUnO1xuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xuXG5cbmV4cG9ydCBjbGFzcyBTdGF0cyBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlICR0YWI6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkd3JhcDogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGN1cnJlbnQ6IEpRdWVyeTtcbiAgICBwcml2YXRlIHRhYlRvU2hvdzogbnVtYmVyOyAvLyBmb3IgYXN5bmMgc3dpdGNoXG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmlld10nKTtcbiAgICAgICAgdGhpcy4kd3JhcCA9IHRoaXMudmlldy5maW5kKCcuanMtdGFicy13cmFwcGVyJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhwYXJzZUludChVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkudGFiLCAxMCkgfHwgMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uVGFiQ2xpY2spO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uVGFiQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhpbmRleCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIHRoaXMudGFiVG9TaG93ID0gaW5kZXg7XG4gICAgICAgIHRoaXMuJHRhYi5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJHRhYi5maWx0ZXIoJ1tkYXRhLXRhYj0nICsgaW5kZXggKyAnXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5oaWRlQ3VycmVudCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5jbGVhbkNhY2hlZEFuaW0oKTtcbiAgICAgICAgICAgIHRoaXMuc2hvdyh0aGlzLnRhYlRvU2hvdyk7XG4gICAgICAgICAgICB0aGlzLnRhYlRvU2hvdyA9IG51bGw7XG4gICAgICAgICAgICAkd2luZG93LnJlc2l6ZSgpO1xuXG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGhpZGVDdXJyZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgaWYgKCF0aGlzLiRjdXJyZW50KSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGN1cnJlbnQsIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY3VycmVudC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbGVhbkNhY2hlZEFuaW0oKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGFuaW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdW5jYWNoZV0nKTtcbiAgICAgICAgY29uc3QgdW5jYWNoZXMgPSB0aGlzLnZpZXcuZmluZCgnLnVuY2FjaGVkJyk7XG4gICAgICAgIHVuY2FjaGVzLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XG4gICAgICAgIGFuaW0ucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkJyk7XG4gICAgICAgIHRoaXMudmlldy5maW5kKCdbZGF0YS1jb21wb25lbnRdJykuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSAkKGVsKS5kYXRhKCdjb21wJykgYXMgQ29tcG9uZW50O1xuICAgICAgICAgICAgaWYgKGNvbXAgJiYgdHlwZW9mIGNvbXBbJ2Rpc2FibGUnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb21wWydkaXNhYmxlJ10oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzaG93KGluZGV4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQgPSB0aGlzLiRpdGVtLmZpbHRlcignW2RhdGEtdmlldz0nICsgaW5kZXggKyAnXScpO1xuICAgICAgICAgICAgdGhpcy4kY3VycmVudC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICBnc2FwLmZyb21Ubyh0aGlzLiRjdXJyZW50LCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjcsXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHJlc29sdmUoKSxcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuZmluZCgnW2RhdGEtY29tcG9uZW50XScpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgY29tcCA9ICQoZWwpLmRhdGEoJ2NvbXAnKSBhcyBDb21wb25lbnQ7XG4gICAgICAgICAgICAgICAgaWYgKGNvbXAgJiYgdHlwZW9mIGNvbXBbJ2VuYWJsZSddICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICBjb21wWydlbmFibGUnXSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcblxuXG5cbmV4cG9ydCBjbGFzcyBUb29sdGlwIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuO1xuICAgIHByaXZhdGUgJGJ1dHRvbjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGNsb3NlOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kYnV0dG9uID0gdGhpcy52aWV3LmZpbmQoJy5qcy10b2dnbGUnKTtcbiAgICAgICAgdGhpcy4kY2xvc2UgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykubGVuZ3RoID4gMCA/IHRoaXMudmlldy5maW5kKCcuanMtY2xvc2UnKSA6IG51bGw7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGJ1dHRvbi5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25CdXR0b25DbGlja0hhbmRsZXIpO1xuXG4gICAgICAgIHRoaXMudmlld1xuICAgICAgICAgICAgLm9mZignbW91c2VvbicpLm9uKCdtb3VzZWVudGVyLm1vdXNlb24nLCB0aGlzLm9uTW91c2VFbnRlcilcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlb2ZmJykub24oJ21vdXNlbGVhdmUubW91c2VvZmYnLCB0aGlzLm9uTW91c2VMZWF2ZSk7XG5cbiAgICAgICAgJGRvYy5vbignY2xpY2sudG9vbHRpcCcsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy4kY2xvc2UpIHtcbiAgICAgICAgICAgIHRoaXMuJGNsb3NlLm9uKCdjbGljay50b29sdGlwJywgKCkgPT4gdGhpcy5jbG9zZSgpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25Nb3VzZUVudGVyID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcbiAgICAgICAgfVxuXG4gICAgICAgIFxuICAgIH1cblxuICAgIHByaXZhdGUgb25Nb3VzZUxlYXZlID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25CdXR0b25DbGlja0hhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgLy8gaWYgKCFicmVha3BvaW50LmRlc2t0b3ApIHtcbiAgICAgICAgLy8gICAgIGFsZXJ0KCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZygkKGUuY3VycmVudFRhcmdldClbMF0pO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDAgKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgb3BlbigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICB9LCAyNTApO1xuXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykuYWRkQ2xhc3MoJ2lzLXRvZ2dsZWQtc2hhcmUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCAzMDAwKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjbG9zZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XG5cbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5yZW1vdmVDbGFzcygnaXMtdG9nZ2xlZC1zaGFyZScpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgSGFuZGxlciB9IGZyb20gJy4uL0hhbmRsZXInO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7IENvbXBvbmVudCwgQ29tcG9uZW50RXZlbnRzIH0gZnJvbSAnLi4vY29tcG9uZW50cy9Db21wb25lbnQnO1xuLy8gaW1wb3J0IEJhY2tncm91bmQgZnJvbSAnLi4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi4vQ2xhc3Nlcyc7XG5pbXBvcnQgeyAkYXJ0aWNsZSwgJGJvZHksICRtYWluIH0gZnJvbSAnLi4vU2l0ZSc7XG5cbmV4cG9ydCBjbGFzcyBQYWdlRXZlbnRzIHtcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFBST0dSRVNTOiBzdHJpbmcgPSAncHJvZ3Jlc3MnO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ09NUExFVEU6IHN0cmluZyA9ICdjb21wbGV0ZSc7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdhcHBlbmQnO1xufVxuXG5leHBvcnQgY2xhc3MgUGFnZSBleHRlbmRzIEhhbmRsZXIge1xuXG4gICAgcHVibGljIGNvbXBvbmVudHM6IEFycmF5PENvbXBvbmVudD4gPSBbXTtcbiAgICAvLyBwdWJsaWMgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcbiAgICBwcml2YXRlIGxvYWRlcjogSlF1ZXJ5RGVmZXJyZWQ8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZD47XG5cblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgb3B0aW9ucz8pIHtcblxuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnZpZXcuY3NzKHsgb3BhY2l0eTogMCB9KTtcblxuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgdGhpcy5idWlsZENvbXBvbmVudHModGhpcy52aWV3LnBhcmVudCgpLmZpbmQoJ1tkYXRhLWNvbXBvbmVudF0nKSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHByZWxvYWQgbmVjZXNzYXJ5IGFzc2V0czpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBsb2FkaW5nIGltYWdlcyBwcm9taXNlXG4gICAgICovXG4gICAgcHVibGljIHByZWxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG5cbiAgICAgICAgbGV0IGlsID0gaW1hZ2VzTG9hZGVkKHRoaXMudmlldy5maW5kKCcucHJlbG9hZCcpLnRvQXJyYXkoKSwgPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWRPcHRpb25zPnsgYmFja2dyb3VuZDogdHJ1ZSB9KTtcbiAgICAgICAgbGV0IGltYWdlcyA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGltYWdlcyA9IGltYWdlcy5jb25jYXQoY29tcG9uZW50LnByZWxvYWRJbWFnZXMoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgdXJsIG9mIGltYWdlcykge1xuICAgICAgICAgICAgaWwuYWRkQmFja2dyb3VuZCh1cmwsIG51bGwpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIHRoaXMubG9hZGVyID0gaWwuanFEZWZlcnJlZDtcbiAgICAgICAgICAgIHRoaXMubG9hZGVyLnByb2dyZXNzKChpbnN0YW5jZTogSW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZCwgaW1hZ2U6IEltYWdlc0xvYWRlZC5Mb2FkaW5nSW1hZ2UpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3M6IG51bWJlciA9IGluc3RhbmNlLnByb2dyZXNzZWRDb3VudCAvIGluc3RhbmNlLmltYWdlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHByb2dyZXNzKTtcbiAgICAgICAgICAgIH0pLmFsd2F5cygoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuQ09NUExFVEUpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogY2hlY2sgaWYgYW55IENvbXBvbmVudCBjYW4gYmUgY2hhbmdlZCBhZnRlciBvblN0YXRlXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyB0cnVlIHdoZW4gb25lIG9mIHRoZSBjb21wb25lbnRzIHRha2VzIGFjdGlvbiBpbiBvblN0YXRlIGZ1bmN0aW9uIGNhbGxcbiAgICAgKi9cbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgY2hhbmdlZDogYm9vbGVhbiA9ICEhZmFsc2U7XG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENoYW5nZWQ6IGJvb2xlYW4gPSBjb21wb25lbnQub25TdGF0ZSgpO1xuICAgICAgICAgICAgaWYgKCFjaGFuZ2VkICYmICEhY29tcG9uZW50Q2hhbmdlZCkge1xuICAgICAgICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNoYW5nZWQ7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHBhZ2UgZW50ZXJpbmcgYW5pbWF0aW9uXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IGFuaW1hdGlvbiBkZWxheVxuICAgICAqL1xuICAgIHB1YmxpYyBhbmltYXRlSW4oZGVsYXk/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcbiAgICAgICAgZ3NhcC50byhiZywgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAxLCBkaXNwbGF5OiAnYmxvY2snfSk7XG5cbiAgICAgICAgLy8gdGhpcy5jYWxsQWxsKHRoaXMuY29tcG9uZW50cywgJ2FuaW1hdGVJbicpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29tcG9uZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzW2ldLmFuaW1hdGVJbihpLCBkZWxheSk7XG4gICAgICAgIH1cbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogcGFnZSBleGl0IGFuaW1hdGlvblxuICAgICAqIChjYWxsZWQgYWZ0ZXIgbmV3IGNvbnRlbnQgaXMgbG9hZGVkIGFuZCBiZWZvcmUgaXMgcmVuZGVyZWQpXG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gYW5pbWF0aW9uIHByb21pc2VcbiAgICAgKi9cbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgY29uc3QgYmcgPSAkKCcjYmFja2dyb3VuZHMtZml4ZWQnKTtcbiAgICAgICAgLy8gYW5pbWF0aW9uIG9mIHRoZSBwYWdlOlxuICAgICAgICAkbWFpbi5yZW1vdmVDbGFzcygnaXMtbG9hZGVkJyk7XG4gICAgICAgIGdzYXAuc2V0KGJnLCB7IG9wYWNpdHk6IDAsIGRpc3BsYXk6ICdub25lJ30pO1xuICAgICAgICBsZXQgcGFnZUFuaW1hdGlvblByb21pc2UgPSBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGFuaW1hdGlvbnMgb2YgYWxsIGNvbXBvbmVudHM6XG4gICAgICAgIGxldCBjb21wb25lbnRBbmltYXRpb25zOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IHRoaXMuY29tcG9uZW50cy5tYXAoKG9iaik6IFByb21pc2U8dm9pZD4gPT4ge1xuICAgICAgICAgICAgcmV0dXJuIDxQcm9taXNlPHZvaWQ+Pm9iai5hbmltYXRlT3V0KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIHJldHVybiBvbmUgcHJvbWlzZSB3YWl0aW5nIGZvciBhbGwgYW5pbWF0aW9uczpcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgbGV0IGFsbFByb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IGNvbXBvbmVudEFuaW1hdGlvbnMuY29uY2F0KHBhZ2VBbmltYXRpb25Qcm9taXNlKTtcblxuICAgICAgICAgICAgUHJvbWlzZS5hbGw8dm9pZD4oYWxsUHJvbWlzZXMpLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuXG4gICAgLyoqXG4gICAgICogVmlzaWJpbGl0eSB3aWRnZXQgaGFuZGxlciwgZmlyZXMgd2hlbiB1c2VyIGV4aXRzIGJyb3dzZXIgdGFiXG4gICAgICovXG4gICAgcHVibGljIHR1cm5PZmYoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9mZicpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogVmlzaWJpbGl0eSB3aWRnZXQgaGFuZGxlciwgZmlyZXMgd2hlbiB1c2VyIGV4aXRzIGJyb3dzZXIgdGFiXG4gICAgICovXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWxsQWxsKCd0dXJuT24nKTtcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogcmVzaXplIGhhbmRsZXJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gd2R0ICAgICAgICB3aW5kb3cgd2lkdGhcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gaGd0ICAgICAgICB3aW5kb3cgaGVpZ2h0XG4gICAgICogQHBhcmFtIHtbdHlwZV19IGJyZWFrcG9pbnQgSUJyZWFrcG9pbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ6IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgncmVzaXplJywgd2R0LCBoZ3QsIGJyZWFrcG9pbnQsIGJwQ2hhbmdlZCk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGNsZWFudXAgd2hlbiBjbG9zaW5nIFBhZ2VcbiAgICAgKi9cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWxsQWxsKCdkZXN0cm95Jyk7XG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xuICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzID0ge307XG5cbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3KTtcbiAgICAgICAgdGhpcy52aWV3ID0gbnVsbDtcblxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgfVxuXG5cblxuICAgIHByb3RlY3RlZCBidWlsZENvbXBvbmVudHMoJGNvbXBvbmVudHM6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICBmb3IgKGxldCBpID0gJGNvbXBvbmVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIGNvbnN0ICRjb21wb25lbnQ6IEpRdWVyeSA9ICRjb21wb25lbnRzLmVxKGkpO1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50TmFtZTogc3RyaW5nID0gJGNvbXBvbmVudC5kYXRhKCdjb21wb25lbnQnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudHMpO1xuXG4gICAgICAgICAgICBpZiAoY29tcG9uZW50TmFtZSAhPT0gdW5kZWZpbmVkICYmIGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zOiBPYmplY3QgPSAkY29tcG9uZW50LmRhdGEoJ29wdGlvbnMnKSxcbiAgICAgICAgICAgICAgICAgICAgY29tcG9uZW50OiBDb21wb25lbnQgPSBuZXcgY29tcG9uZW50c1tjb21wb25lbnROYW1lXSgkY29tcG9uZW50LCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBvbmVudHMucHVzaChjb21wb25lbnQpO1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5vbihDb21wb25lbnRFdmVudHMuQ0hBTkdFLCB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgd2luZG93LmNvbnNvbGUud2FybignVGhlcmUgaXMgbm8gYCVzYCBjb21wb25lbnQhJywgY29tcG9uZW50TmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ29tcG9uZW50Q2hhbmdlID0gKGVsKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKGVsLmZpbHRlcignW2RhdGEtY29tcG9uZW50XScpLmFkZChlbC5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuQ0hBTkdFLCBlbCk7XG4gICAgfVxuXG5cbiAgICAvLyBzaG9ydCBjYWxsXG4gICAgcHJpdmF0ZSBjYWxsQWxsKGZuOiBzdHJpbmcsIC4uLmFyZ3MpOiB2b2lkIHtcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBjb21wb25lbnRbZm5dID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgY29tcG9uZW50W2ZuXS5hcHBseShjb21wb25lbnQsIFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgIH1cbn1cbiJdfQ==
