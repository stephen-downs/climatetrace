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
        Utils.enableBodyScrolling(Scroll_1.Scroll.scrollTop);
    }
    else {
        gsap.set(Site_1.$article, { clearProps: 'will-change' });
        Utils.disableBodyScrolling(Scroll_1.Scroll.scrollTop);
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
            console.log(this.currentCharts);
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
        console.log(this.currentCharts);
        this.createDataObject();
        this.bind();
        this.resize();
    }
    enable() {
        this.showBg();
        for (let i = 0; i < this.$tab.length; i++) {
            this.toggleChart(i, this.currentCharts.indexOf(i) >= 0);
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
    toggleChart(index, show, quick) {
        const data = this.graphsData[index];
        if (typeof show === 'undefined') {
            show = !data.shown;
        }
        gsap.to(data, {
            duration: !quick ? 3.2 : 0,
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
            this.ctx.lineTo(this.graph.left + this.graph.width * this.bgLines[i].scaleX, (this.graph.height) / helpersLine * i + this.margin.top);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0FzaWRlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ2hhcnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Db21wb25lbnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9EYXNoYm9hcmQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Ecm9wZG93bi50cyIsInNyYy90cy9jb21wb25lbnRzL0ZpbHRlcnMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9NYXNvbnJ5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUGFyYWxsYXgudHMiLCJzcmMvdHMvY29tcG9uZW50cy9SYW5nZS50cyIsInNyYy90cy9jb21wb25lbnRzL1NsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL1N0YXRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFbkUsT0FB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QUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBR2xCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLGFBQWEsQ0FBQztnQkFDckMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztnQkFDaEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDMUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQ3pELElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBR2hCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLENBQUM7Z0JBQ3JCLElBQUksQ0FBQyxH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RUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUs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QUFXLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQzlDLFNBQVMsR0FBYyxJQUFJLG9CQUFVLENBQUMsYUFBYSxDQUFDLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDaEMsU0FBUyxDQUFDLEVBQUUsQ0FBQywyQkFBZSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQzthQUNoRTtpQkFBTTtnQkFDSCxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyw2QkFBNkIsRUFBRSxhQUFhLENBQUMsQ0FBQzthQUNyRTtTQUNKO0lBQ0wsQ0FBQztJQVNPLE9BQU8sQ0FBQyxFQUFVLEVBQUUsR0FBRyxJQUFJO1FBQy9CLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQyxJQUFJLE9BQU8sU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLFVBQVUsRUFBRTtnQkFDckMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDL0Q7U0FDSjtJQUVMLENBQUM7Q0FDSjtBQWhORCxvQkFnTkMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvLyAvIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XHJcbmltcG9ydCB7IGRlYnVnIH0gZnJvbSAnLi9TaXRlJztcclxuXHJcblxyXG5cclxuZGVjbGFyZSB2YXIgJGJvZHk7XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElBcGlEYXRhIHtcclxuICAgIHVybDogc3RyaW5nO1xyXG4gICAgYmVmb3JlQ2FsbD86IHN0cmluZztcclxuICAgIGNhbGxiYWNrPzogc3RyaW5nO1xyXG4gICAgZm9ybT86IGFueTtcclxuICAgIHBhcmFtcz86IGFueTtcclxuICAgIGxpa2U/OiBib29sZWFuO1xyXG4gICAgYWN0aW9uPzogJ1BPU1QnIHwgJ0RFTEVURScgfCAnR0VUJyB8ICdQVVQnIHwgJ1BBVENIJztcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBBUEkge1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYmVmb3JlQ2FsbHMgPSB7XHJcblxyXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICAgICAgaWYgKCEkYm9keS5oYXNDbGFzcygnaXMtbG9nZ2VkJykpIHtcclxuICAgICAgICAgICAgICAgICQoJy5qcy1sb2dpbicpLmxhc3QoKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcblxyXG4gICAgICAgIHZhbGlkYXRlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICAgICAgbGV0IHBhc3NlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgIGxldCAkZm9ybSA9ICRlbC5pcygnZm9ybScpID8gJGVsIDogJGVsLmNsb3Nlc3QoJ2Zvcm0nKTtcclxuICAgICAgICAgICAgbGV0ICR2YWxpZGF0aW9uRWxlbSA9ICRmb3JtO1xyXG4gICAgICAgICAgICBsZXQgc3RlcFZhbGlkYXRpb247XHJcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcclxuICAgICAgICAgICAgaWYgKCRmb3JtLmhhc0NsYXNzKCdpcy1kb25lJykpIHtcclxuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdpcy1kb25lJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIGlmICggISFkYXRhLnBhcmFtcyApIHtcclxuICAgICAgICAgICAgLy8gICAgIGlmIChkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSAgZGF0YS5wYXJhbXMudmFsaWRhdGVPbmU7XHJcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHN0ZXBWYWxpZGF0aW9uID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnNjcm9sbFRvICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9ICBkYXRhLnBhcmFtcy5zY3JvbGxUbztcclxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcclxuXHJcbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdbcmVxdWlyZWRdOmlucHV0JykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ0lOUFVUJyApIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoICgoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlID0gL14oKFtePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSsoXFwuW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKykqKXwoXCIuK1wiKSlAKChcXFtbMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XSl8KChbYS16QS1aXFwtMC05XStcXC4pK1thLXpBLVpdezIsfSkpJC87XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlLnRlc3QodmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9IFV0aWxzLnRyYW5zbGF0aW9uc1t2YWx1ZS5sZW5ndGggPiAwID8gJ2ludmFsaWQtZW1haWwnIDogJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnY2hlY2tib3gnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbCA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykpIHttZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Bob25lJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxUZWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsVGVsLmxlbmd0aCA8IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydyZXF1aXJlZC1maWVsZCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoaW5wdXQubm9kZU5hbWUgPT09ICdURVhUQVJFQScpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnaW5wdXRbbmFtZT16aXBjb2RlXScpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxUZXh0QXJlYUVsZW1lbnQpLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykgJiYgdmFsLmxlbmd0aCAhPSA1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1snaW52YWxpZC16aXAnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKCEhcGFzc2VkKSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRmb3JtKTtcclxuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdoYXMtZXJyb3JzJyk7XHJcbiAgICAgICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkZm9ybS5hZGRDbGFzcygnaGFzLWVycm9ycycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY2FsbGJhY2tzID0ge1xyXG5cclxuICAgICAgICBvbkNvb2tpZXNDbG9zZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xyXG4gICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLWhpZGRlbicpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgICAgIG9uU3Vic2NyaWJlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblN1YnNjcmliZScpO1xyXG4gICAgICAgICAgICBsZXQgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcclxuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgKGRhdGEuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSAgZGF0YS5zY3JvbGxUbztcclxuICAgICAgICAgICAgLy8gfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcblxyXG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoISRtZXNzYWdlWzBdKSB7XHJcbiAgICAgICAgICAgICAgICAkZWwuYXBwZW5kKCc8ZGl2IGNsYXNzPVwianMtbWVzc2FnZSBtZXNzYWdlXCI+Jyk7XHJcbiAgICAgICAgICAgICAgICAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgaHRtbCA9ICQoJzxwPicgKyByZXNwb25zZS5tZXNzYWdlICsgJzwvcD4nKTtcclxuXHJcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpLmFwcGVuZChodG1sKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQpIHtcclxuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtY29tcGxldGVkJyk7XHJcbiAgICAgICAgICAgICAgICAkZWwucGFyZW50KCkuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcclxuICAgICAgICAgICAgICAgICRlbC5jbG9zZXN0KCcuam9pbicpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudmFsKCcnKTtcclxuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dDpjaGVja2VkJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkZWxbMF0uaGFzQXR0cmlidXRlKCdkYXRhLXJlZGlyZWN0JykpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5hc3NpZ24oJy8nKTtcclxuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgLy8gICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkbWVzc2FnZSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0JykudHJpZ2dlcignYmx1cicpO1xyXG4gICAgICAgIH0sXHJcblxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBhbnkpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgJHRhcmdldCA9ICQodHlwZW9mIHRhcmdldCAhPT0gJ3VuZGVmaW5lZCcgPyB0YXJnZXQgOiAnYm9keScpO1xyXG5cclxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ1tkYXRhLWFwaV0nKS5ub3QoJ2Zvcm0nKS5vZmYoJy5hcGknKS5vbignY2xpY2suYXBpJywgQVBJLm9uQWN0aW9uKTtcclxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ2Zvcm1bZGF0YS1hcGldJykub2ZmKCcuYXBpJykub24oJ3N1Ym1pdC5hcGknLCBBUEkub25BY3Rpb24pLmF0dHIoJ25vdmFsaWRhdGUnLCAnbm92YWxpZGF0ZScpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBjYWxsSXQoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCBjdXN0b21DYWxsYmFjaz86IEZ1bmN0aW9uKTogIFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0YSA9IEFQSS5wcmVwcm9jZXNzRGF0YShkYXRhLCAkZWwpO1xyXG5cclxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcclxuXHJcbiAgICAgICAgY29uc3QgYWN0aW9uID0gZGF0YS5hY3Rpb24gfHwgJ1BPU1QnO1xyXG4gICAgICAgIGRlbGV0ZSBkYXRhLmFjdGlvbjtcclxuXHJcbiAgICAgICAgY29uc3QgdXJsID0gZGF0YS51cmwgfHwgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG4gICAgICAgIGRlbGV0ZSBkYXRhLnVybDtcclxuXHJcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuXHJcbiAgICAgICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcclxuICAgICAgICAgICAgICAgIGdsb2JhbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBhY3Rpb24sXHJcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxyXG4gICAgICAgICAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZG9uZSgocmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuZmFpbCgoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdBUEkgZXJyb3I6ICcgKyBlLCBkYXRhKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoISFkZWJ1Zykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY3VzdG9tQ2FsbGJhY2soZGF0YSwgJGVsLCBudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVqZWN0KGUpO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAuYWx3YXlzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIHByZXByb2Nlc3NEYXRhKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IElBcGlEYXRhIHtcclxuXHJcbiAgICAgICAgLy8gZ2V0IGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBmb3JtIGVsZW1lbnQ6XHJcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XHJcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdhY3Rpb24nKSA/ICRlbC5hdHRyKCdhY3Rpb24nKSA6IGRhdGEudXJsO1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJGVsLmZpbmQoJzppbnB1dCcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIGZvcm0nLCBkYXRhLCBkYXRhLnBhcmFtcyxkYXRhLmZvcm0sICRlbC5maW5kKCc6aW5wdXQnKSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdXBkYXRlIGRhdGEgaWYgYXBpIGNhbGxlZCBvbiBsaW5rIGVsZW1lbnQ6XHJcbiAgICAgICAgaWYgKCRlbC5pcygnW2hyZWZdJykpIHtcclxuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2hyZWYnKSA/ICRlbC5hdHRyKCdocmVmJykgOiBkYXRhLnVybDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGdldCBhZGRpdGlvbmFsIGRhdGEgZnJvbSBleHRlcm5hbCBmb3JtOlxyXG4gICAgICAgIGlmIChkYXRhLmZvcm0gJiYgJChkYXRhLmZvcm0gYXMgc3RyaW5nKVswXSkge1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJChkYXRhLmZvcm0gYXMgc3RyaW5nKS5zZXJpYWxpemVPYmplY3QoKSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLmZvcm07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBmbGF0dGVuOlxyXG4gICAgICAgIGlmIChkYXRhLnBhcmFtcykge1xyXG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgZGF0YS5wYXJhbXMpO1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YS5wYXJhbXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIHByZScsIGRhdGEsIGRhdGEucGFyYW1zKTtcclxuICAgICAgICByZXR1cm4gZGF0YTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkFjdGlvbiA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICBsZXQgJGVsID0gJChlLmN1cnJlbnRUYXJnZXQgYXMgSFRNTEVsZW1lbnQpO1xyXG4gICAgICAgIGNvbnN0IGRhdGE6IElBcGlEYXRhID0gey4uLiQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdhcGknKX07XHJcbiAgICAgICAgY29uc29sZS5sb2coZGF0YSwgJ2RhdGEnKTtcclxuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcclxuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkZWwuY2xvc2VzdCgnZm9ybScpLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGJlZm9yZUNhbGwgaGFuZGxlcjpcclxuICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhLmJlZm9yZUNhbGwgaW4gQVBJLmJlZm9yZUNhbGxzKSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuYmVmb3JlQ2FsbHNbZGF0YS5iZWZvcmVDYWxsXShkYXRhLCAkZWwpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25TdWNjZXNzID0gKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2sgaW4gQVBJLmNhbGxiYWNrcykge1xyXG4gICAgICAgICAgICAgICAgQVBJLmNhbGxiYWNrc1tkYXRhLmNhbGxiYWNrXShkYXRhLCAkZWwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn0iLCJleHBvcnQgaW50ZXJmYWNlIElCcmVha3BvaW50IHtcclxuICAgIGRlc2t0b3A6IGJvb2xlYW47XHJcbiAgICB0YWJsZXQ6IGJvb2xlYW47XHJcbiAgICBwaG9uZTogYm9vbGVhbjtcclxuICAgIHZhbHVlOiBzdHJpbmc7XHJcbn1cclxuXHJcbmV4cG9ydCBsZXQgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XHJcblxyXG5leHBvcnQgY2xhc3MgQnJlYWtwb2ludCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyB1cGRhdGUoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKSwgJzpiZWZvcmUnKTtcclxuICAgICAgICBjb25zdCBjc3NCZWZvcmVWYWx1ZSA9IGNzc0JlZm9yZS5nZXRQcm9wZXJ0eVZhbHVlKCdjb250ZW50JykucmVwbGFjZSgvW1xcXCJcXCddL2csICcnKTtcclxuXHJcbiAgICAgICAgYnJlYWtwb2ludCA9IHtcclxuICAgICAgICAgICAgZGVza3RvcDogY3NzQmVmb3JlVmFsdWUgPT09ICdkZXNrdG9wJyxcclxuICAgICAgICAgICAgcGhvbmU6IGNzc0JlZm9yZVZhbHVlID09PSAncGhvbmUnLFxyXG4gICAgICAgICAgICB0YWJsZXQ6IGNzc0JlZm9yZVZhbHVlID09PSAndGFibGV0JyxcclxuICAgICAgICAgICAgdmFsdWU6IGNzc0JlZm9yZVZhbHVlLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKFwiQlA6XCIsIGJyZWFrcG9pbnQudmFsdWUpO1xyXG4gICAgfVxyXG59XHJcbiIsImV4cG9ydCBsZXQgYnJvd3NlcjogSUJyb3dzZXI7XHJcbmRlY2xhcmUgbGV0IG9wcjtcclxuLy8gdHNsaW50OmRpc2FibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXHJcbmludGVyZmFjZSBXaW5kb3cge1xyXG4gICAgb3ByOiBhbnk7XHJcbiAgICBvcGVyYTogYW55O1xyXG4gICAgc2FmYXJpOiBhbnk7XHJcbiAgICBIVE1MRWxlbWVudDogYW55O1xyXG59XHJcbi8vIHRzbGludDplbmFibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXHJcblxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJQnJvd3NlciB7XHJcbiAgICBtb2JpbGU/OiBib29sZWFuO1xyXG4gICAgd2luZG93cz86IGJvb2xlYW47XHJcbiAgICBtYWM/OiBib29sZWFuO1xyXG4gICAgaWU/OiBib29sZWFuO1xyXG4gICAgaW9zPzogYm9vbGVhbjtcclxuICAgIG9wZXJhPzogYm9vbGVhbjtcclxuICAgIGZpcmVmb3g/OiBib29sZWFuO1xyXG4gICAgc2FmYXJpPzogYm9vbGVhbjtcclxuICAgIGNocm9tZT86IGJvb2xlYW47XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0QnJvd3NlcigpOiBJQnJvd3NlciB7XHJcbiAgICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xyXG4gICAgYnJvd3NlciA9IHtcclxuICAgICAgICBtb2JpbGU6ICgvKGFuZHJvaWR8YmJcXGQrfG1lZWdvKS4rbW9iaWxlfGF2YW50Z298YmFkYVxcL3xibGFja2JlcnJ5fGJsYXplcnxjb21wYWx8ZWxhaW5lfGZlbm5lY3xoaXB0b3B8aWVtb2JpbGV8aXAoaG9uZXxvZCl8aXBhZHxpcmlzfGtpbmRsZXxBbmRyb2lkfFNpbGt8bGdlIHxtYWVtb3xtaWRwfG1tcHxuZXRmcm9udHxvcGVyYSBtKG9ifGluKWl8cGFsbSggb3MpP3xwaG9uZXxwKGl4aXxyZSlcXC98cGx1Y2tlcnxwb2NrZXR8cHNwfHNlcmllcyg0fDYpMHxzeW1iaWFufHRyZW98dXBcXC4oYnJvd3NlcnxsaW5rKXx2b2RhZm9uZXx3YXB8d2luZG93cyAoY2V8cGhvbmUpfHhkYXx4aWluby9pLnRlc3QodWEpIHx8IC8xMjA3fDYzMTB8NjU5MHwzZ3NvfDR0aHB8NTBbMS02XWl8Nzcwc3w4MDJzfGEgd2F8YWJhY3xhYyhlcnxvb3xzXFwtKXxhaShrb3xybil8YWwoYXZ8Y2F8Y28pfGFtb2l8YW4oZXh8bnl8eXcpfGFwdHV8YXIoY2h8Z28pfGFzKHRlfHVzKXxhdHR3fGF1KGRpfFxcLW18ciB8cyApfGF2YW58YmUoY2t8bGx8bnEpfGJpKGxifHJkKXxibChhY3xheil8YnIoZXx2KXd8YnVtYnxid1xcLShufHUpfGM1NVxcL3xjYXBpfGNjd2F8Y2RtXFwtfGNlbGx8Y2h0bXxjbGRjfGNtZFxcLXxjbyhtcHxuZCl8Y3Jhd3xkYShpdHxsbHxuZyl8ZGJ0ZXxkY1xcLXN8ZGV2aXxkaWNhfGRtb2J8ZG8oY3xwKW98ZHMoMTJ8XFwtZCl8ZWwoNDl8YWkpfGVtKGwyfHVsKXxlcihpY3xrMCl8ZXNsOHxleihbNC03XTB8b3N8d2F8emUpfGZldGN8Zmx5KFxcLXxfKXxnMSB1fGc1NjB8Z2VuZXxnZlxcLTV8Z1xcLW1vfGdvKFxcLnd8b2QpfGdyKGFkfHVuKXxoYWllfGhjaXR8aGRcXC0obXxwfHQpfGhlaVxcLXxoaShwdHx0YSl8aHAoIGl8aXApfGhzXFwtY3xodChjKFxcLXwgfF98YXxnfHB8c3x0KXx0cCl8aHUoYXd8dGMpfGlcXC0oMjB8Z298bWEpfGkyMzB8aWFjKCB8XFwtfFxcLyl8aWJyb3xpZGVhfGlnMDF8aWtvbXxpbTFrfGlubm98aXBhcXxpcmlzfGphKHR8dilhfGpicm98amVtdXxqaWdzfGtkZGl8a2VqaXxrZ3QoIHxcXC8pfGtsb258a3B0IHxrd2NcXC18a3lvKGN8ayl8bGUobm98eGkpfGxnKCBnfFxcLyhrfGx8dSl8NTB8NTR8XFwtW2Etd10pfGxpYnd8bHlueHxtMVxcLXd8bTNnYXxtNTBcXC98bWEodGV8dWl8eG8pfG1jKDAxfDIxfGNhKXxtXFwtY3J8bWUocmN8cmkpfG1pKG84fG9hfHRzKXxtbWVmfG1vKDAxfDAyfGJpfGRlfGRvfHQoXFwtfCB8b3x2KXx6eil8bXQoNTB8cDF8diApfG13YnB8bXl3YXxuMTBbMC0yXXxuMjBbMi0zXXxuMzAoMHwyKXxuNTAoMHwyfDUpfG43KDAoMHwxKXwxMCl8bmUoKGN8bSlcXC18b258dGZ8d2Z8d2d8d3QpfG5vayg2fGkpfG56cGh8bzJpbXxvcCh0aXx3dil8b3Jhbnxvd2cxfHA4MDB8cGFuKGF8ZHx0KXxwZHhnfHBnKDEzfFxcLShbMS04XXxjKSl8cGhpbHxwaXJlfHBsKGF5fHVjKXxwblxcLTJ8cG8oY2t8cnR8c2UpfHByb3h8cHNpb3xwdFxcLWd8cWFcXC1hfHFjKDA3fDEyfDIxfDMyfDYwfFxcLVsyLTddfGlcXC0pfHF0ZWt8cjM4MHxyNjAwfHJha3N8cmltOXxybyh2ZXx6byl8czU1XFwvfHNhKGdlfG1hfG1tfG1zfG55fHZhKXxzYygwMXxoXFwtfG9vfHBcXC0pfHNka1xcL3xzZShjKFxcLXwwfDEpfDQ3fG1jfG5kfHJpKXxzZ2hcXC18c2hhcnxzaWUoXFwtfG0pfHNrXFwtMHxzbCg0NXxpZCl8c20oYWx8YXJ8YjN8aXR8dDUpfHNvKGZ0fG55KXxzcCgwMXxoXFwtfHZcXC18diApfHN5KDAxfG1iKXx0MigxOHw1MCl8dDYoMDB8MTB8MTgpfHRhKGd0fGxrKXx0Y2xcXC18dGRnXFwtfHRlbChpfG0pfHRpbVxcLXx0XFwtbW98dG8ocGx8c2gpfHRzKDcwfG1cXC18bTN8bTUpfHR4XFwtOXx1cChcXC5ifGcxfHNpKXx1dHN0fHY0MDB8djc1MHx2ZXJpfHZpKHJnfHRlKXx2ayg0MHw1WzAtM118XFwtdil8dm00MHx2b2RhfHZ1bGN8dngoNTJ8NTN8NjB8NjF8NzB8ODB8ODF8ODN8ODV8OTgpfHczYyhcXC18ICl8d2ViY3x3aGl0fHdpKGcgfG5jfG53KXx3bWxifHdvbnV8eDcwMHx5YXNcXC18eW91cnx6ZXRvfHp0ZVxcLS9pLnRlc3QodWEuc3Vic3RyKDAsIDQpKSkgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgaW9zOiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdCh1YSksXHJcbiAgICAgICAgbWFjOiBuYXZpZ2F0b3IucGxhdGZvcm0udG9VcHBlckNhc2UoKS5pbmRleE9mKCdNQUMnKSA+PSAwLFxyXG4gICAgICAgIGllOiB1YS5pbmRleE9mKCdNU0lFICcpID4gMCB8fCAhIXVhLm1hdGNoKC9UcmlkZW50LipydlxcOjExXFwuLyksXHJcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1hbnlcclxuICAgICAgICBvcGVyYTogKCEhKHdpbmRvdyBhcyBhbnkpLm9wciAmJiAhIW9wci5hZGRvbnMpIHx8ICEhKHdpbmRvdyBhcyBhbnkpLm9wZXJhIHx8IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignIE9QUi8nKSA+PSAwLFxyXG4gICAgICAgIGZpcmVmb3g6IHVhLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXHJcbiAgICAgICAgc2FmYXJpOiAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KHVhKSxcclxuICAgICAgICB3aW5kb3dzOiB3aW5kb3cubmF2aWdhdG9yLnBsYXRmb3JtLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignd2luJykgPiAtMSxcclxuICAgIH07XHJcblxyXG4gICAgJCgnaHRtbCcpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtYWMnLCAhYnJvd3Nlci53aW5kb3dzICYmIChicm93c2VyLmlvcyB8fCBicm93c2VyLm1hYykpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCd3aW5kb3dzJywgYnJvd3Nlci53aW5kb3dzICYmICFicm93c2VyLm1hYyAmJiAhYnJvd3Nlci5pb3MpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdtb2JpbGUnLCBicm93c2VyLm1vYmlsZSlcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2ZpcmVmb3gnLCBicm93c2VyLmZpcmVmb3gpXHJcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdzYWZhcmknLCBicm93c2VyLnNhZmFyaSlcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ2llJywgYnJvd3Nlci5pZSk7XHJcblxyXG4gICAgcmV0dXJuIGJyb3dzZXI7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQnJvd3NlciB7XHJcbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBicm93c2VyID0gZ2V0QnJvd3NlcigpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IFNsaWRlciB9IGZyb20gJy4vY29tcG9uZW50cy9TbGlkZXInO1xyXG5pbXBvcnQgeyBUb29sdGlwIH0gZnJvbSAnLi9jb21wb25lbnRzL1Rvb2x0aXAnO1xyXG5pbXBvcnQgeyBEcm9wZG93biB9IGZyb20gJy4vY29tcG9uZW50cy9Ecm9wZG93bic7XHJcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL2NvbXBvbmVudHMvRmlsdGVycyc7XHJcbmltcG9ydCB7IERhc2hib2FyZCB9IGZyb20gJy4vY29tcG9uZW50cy9EYXNoYm9hcmQnO1xyXG5pbXBvcnQgeyBTdGF0cyB9IGZyb20gJy4vY29tcG9uZW50cy9TdGF0cyc7XHJcbmltcG9ydCB7IE1hc29ucnkgfSBmcm9tICcuL2NvbXBvbmVudHMvTWFzb25yeSc7XHJcbmltcG9ydCB7IFJhbmdlIH0gZnJvbSAnLi9jb21wb25lbnRzL1JhbmdlJztcclxuaW1wb3J0IHsgQ2hhcnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ2hhcnQnO1xyXG5pbXBvcnQgeyBBc2lkZSB9IGZyb20gJy4vY29tcG9uZW50cy9Bc2lkZSc7XHJcbmltcG9ydCB7IFBhcmFsbGF4IH0gZnJvbSAnLi9jb21wb25lbnRzL1BhcmFsbGF4JztcclxuXHJcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XHJcbiAgICBTbGlkZXIsXHJcbiAgICBUb29sdGlwLFxyXG4gICAgRHJvcGRvd24sXHJcbiAgICBGaWx0ZXJzLFxyXG4gICAgRGFzaGJvYXJkLFxyXG4gICAgU3RhdHMsXHJcbiAgICBNYXNvbnJ5LFxyXG4gICAgUmFuZ2UsXHJcbiAgICBDaGFydCxcclxuICAgIFBhcmFsbGF4LFxyXG4gICAgQXNpZGVcclxufTtcclxuXHJcblxyXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XHJcbiAgICBQYWdlXHJcbn07XHJcblxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2NsaXBib2FyZC5kLnRzXCIgLz5cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENvcHkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnW2RhdGEtY29weV0nKS5vbignY2xpY2snLCAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcclxuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuaW5mbygnXCIlc1wiIGNvcGllZCcsIHVybCk7XHJcblxyXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgJGVsLnJlbW92ZUNsYXNzKCdpcy1jb3BpZWQnKTsgfSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhbmRsZXIge1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGV2ZW50czogeyBba2V5OiBzdHJpbmddOiBGdW5jdGlvbltdIH07XHJcblxyXG4gICAgY29uc3RydWN0b3IgKCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgKiBAcmV0dXJuIHtIYW5kbGVyfSAgICAgICAgICAgIHJldHVybnMgY3VycmVudCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJyAmJiB0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ldmVudHNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xyXG5cclxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIHRyaWdnZXIoZXZlbnROYW1lOiBzdHJpbmcsIC4uLmV4dHJhUGFyYW1ldGVycyk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkgeyByZXR1cm47IH1cclxuICAgICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJleHBvcnQgY2xhc3MgTG9hZGVyIHtcclxuXHJcbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHdpZHRoOiBudW1iZXI7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5KSB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgeTogMCwgZHVyYXRpb246IDAuMiB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcclxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyBkdXJhdGlvbjogMC41LCB5OiAxMCwgd2lkdGg6IHRoaXMud2lkdGggfHwgJzEwMCUnIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNldChwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsneSddKTtcclxuXHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xyXG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XHJcbmltcG9ydCB7ICRib2R5LCAkYXJ0aWNsZSwgJHBhZ2VIZWFkZXIgfSBmcm9tICcuL1NpdGUnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xyXG4vLyBpbXBvcnQgeyBTaWdudXAgfSBmcm9tICcuL1NpZ251cCc7XHJcblxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXHJcbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXNFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFB1c2hTdGF0ZXM7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRJTUVfTElNSVQgPSA1MDAwO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGxvYWRlZERhdGE6IHN0cmluZztcclxuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XHJcbiAgICBwcml2YXRlIHRpbWVvdXQ7XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGRvY3VtZW50IHRpdGxlICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSB8fCAkKCcjbWFpbiA+IFtkYXRhLXRpdGxlXScpLmRhdGEoJ3RpdGxlJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZ29Ubyhsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXHJcbiAgICAgICAgICAgIGlzRGlmZmVyZW50ID0gcGF0aG5hbWUgIT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XHJcbiAgICAgICAgICAgIGlmICghIXJlcGxhY2UpIHtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBwYXRobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGlzRGlmZmVyZW50O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNoYW5nZVBhdGgobG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4sIHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgIGxldCBjaGFuZ2VkID0gUHVzaFN0YXRlcy5nb1RvKGxvY2F0aW9uLCByZXBsYWNlIHx8IHRydWUpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCEhY2hhbmdlZCkge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLnNldFRpdGxlKHRpdGxlIHx8IGRvY3VtZW50LnRpdGxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyB0byBiZSB1c2VkIHdpdGggUHVzaFN0YXRlcyAvIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFlbGVtZW50SXRzZWxmKSB7XHJcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmtzKHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGluayh0YXJnZXQgYXMgRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnbyBiYWNrIGluIGJyb3dzZXIgaGlzdG9yeVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmFjayh1cmw/OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgSGlzdG9yeWpzLmJhY2soKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybCkge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgJy8nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlbG9hZCgpOiB2b2lkIHtcclxuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCEkcGFnZUhlYWRlcikge1xyXG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XHJcbiAgICAgICAgICAgICRib2R5LmFkZENsYXNzKCduYXZiYXItYWx3YXlzLXNob3duJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXNpZGVUb2dnbGUgPSAoZT8pOiB2b2lkID0+IHtcclxuICAgICAgICBsZXQgZWwgPSBlID8gJChlLmN1cnJlbnRUYXJnZXQpIDogJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1hc2lkZS1vcGVuJyk7XHJcbiAgICAgICAgZWwudG9nZ2xlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuXHJcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcclxuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsnd2lsbC1jaGFuZ2UnOiAndHJhbnNmb3JtJ30pO1xyXG4gICAgICAgICAgICBVdGlscy5lbmFibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGdzYXAuc2V0KCRhcnRpY2xlLCB7IGNsZWFyUHJvcHM6ICd3aWxsLWNoYW5nZSd9KTtcclxuICAgICAgICAgICAgVXRpbHMuZGlzYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEFzaWRlLmFzaWRlQW5pbWF0aW9uKCk7XHJcblxyXG5cclxuICAgICAgICAvLyByZXR1cm47XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xyXG4gICAgICAgICAgICBIaXN0b3J5anMuQWRhcHRlci5iaW5kKHdpbmRvdywgJ3N0YXRlY2hhbmdlJywgdGhpcy5vblN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsb2FkIG5ldyBjb250ZW50IHZpYSBhamF4IGJhc2VkIG9uIGN1cnJlbnQgbG9jYXRpb246XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHVybFxyXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuICAgICAgICBjb25zdCBzZWFyY2g6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHwgJyc7XHJcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHRpbWVvdXRcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIFB1c2hTdGF0ZXMuVElNRV9MSU1JVCk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXHJcbiAgICAgICAgLy8gYW5kIGRvIHRoZSByZXF1ZXN0OlxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyB0aGUgdXN1YWwgeGhyIHN0dWZmOlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXNUZXh0ICE9PSAnYWJvcnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNhdGNoaW5nIGVycm9yczpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGZ1bmN0aW9uIGNhbGxlZCBvbiBzdWNjZXNzZnVsIGRhdGEgbG9hZCAqL1xyXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YTogc3RyaW5nID0gdGhpcy5sb2FkZWREYXRhLnRyaW0oKTtcclxuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xyXG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xyXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxyXG4gICAgICAgIGlmIChjb250YWluZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlLXRyeSByZW5kZXJpbmcgaWYgbm9uZSBvZiBjb250YWluZXJzIHdlcmUgcmVuZGVyZWQ6XHJcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xyXG5cclxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2FqYXhfbG9hZGVkJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XHJcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xyXG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICQoY29udGFpbmVyKVxyXG4gICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcclxuICAgICAgICAgICAgLnNob3coKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyAqL1xyXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBiaW5kIGxpbmtzICovXHJcbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcclxuXHJcbiAgICAgICAgJCh0YXJnZXQpLmZpbmQoJ2EnKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcclxuICAgICAgICAgICAgLm5vdCgnW2Rvd25sb2FkXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZiQ9XCIuanBnXCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJ0ZWw6XCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxhbmddJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xyXG5cclxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jyk7XHJcblxyXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcclxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcclxuXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XHJcbiAgICAgICAgY29uc3QgYWx0ZXJuYXRlID0gJCgnW2RhdGEtYWx0ZXJuYXRlXScpLmRhdGEoJ2FsdGVybmF0ZScpO1xyXG4gICAgICAgIGNvbnN0IGFydGljbGVVUkwgPSBhbHRlcm5hdGUgPyBhbHRlcm5hdGVbbGFuZyB8fCBPYmplY3Qua2V5cyhhbHRlcm5hdGUpWzBdXSA6IG51bGw7XHJcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XHJcbiAgICAgICAgY29uc3QgaGVhZFVSTCA9IGhlYWRMaW5rID8gaGVhZExpbmsuaHJlZiA6IG51bGw7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbihhcnRpY2xlVVJMIHx8IGhlYWRVUkwgfHwgZS5jdXJyZW50VGFyZ2V0LmhyZWYpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGxpbmtzIGNsaWNrIGhhbmRsZXIgKi9cclxuICAgIHByaXZhdGUgb25DbGljayA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgbGV0ICRzZWxmOiBKUXVlcnkgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCksXHJcbiAgICAgICAgICAgIHN0YXRlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdocmVmJykucmVwbGFjZSgnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdkYXRhLWhpc3RvcnknKTtcclxuICAgICAgICBcclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2JhY2snKSB7XHJcbiAgICAgICAgICAgICAgICBQdXNoU3RhdGVzLmJhY2soc3RhdGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZXBsYWNlJykge1xyXG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFNjcm9sbC5yZXNldFNjcm9sbENhY2hlKHN0YXRlKTtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5wdXNoU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBvbiBoYXNoLWxpbmsgY2xpY2sgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIGxpbmsnKTtcclxuICAgICAgICBpZiAoJGJvZHkuaGFzQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKSkge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgICAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogSGlzdG9yeWpzIGBzdGF0ZWNoYW5nZWAgZXZlbnQgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcclxuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcclxuICAgICAgICBpZiAoIVB1c2hTdGF0ZXMubm9DaGFuZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogbWFyayBsaW5rcyBhcyBhY3RpdmUgKi9cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlTGlua3MoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnYVtocmVmXScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAkKCdhW2hyZWY9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvZ3NhcC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvc3BsaXQtdGV4dC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IFB1c2hTdGF0ZXMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50JztcclxuLy8gaW1wb3J0IHsgUHJvZ3Jlc3NiYXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZ3Jlc3NiYXInO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XHJcbmltcG9ydCB7ICR3aW5kb3csICRib2R5IH0gZnJvbSAnLi9TaXRlJztcclxuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XHJcblxyXG5pbnRlcmZhY2UgSUJhY2tncm91bmREYXRhIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdGVwOiBudW1iZXI7XHJcbiAgICBkYXJrZW46IGJvb2xlYW47XHJcbiAgICBkYXJrZW5EZWxheTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTY3JvbGxQYXJhbXMgZXh0ZW5kcyBPYmplY3Qge1xyXG4gICAgeD86IG51bWJlcjtcclxuICAgIHk/OiBudW1iZXI7XHJcbiAgICBzcGVlZD86IG51bWJlcjtcclxuICAgIGFuaW1hdGU/OiBib29sZWFuO1xyXG4gICAgcmVsYXRpdmVTcGVlZD86IGJvb2xlYW47XHJcbiAgICBlYXNlPzogc3RyaW5nO1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgICRlbD86IEpRdWVyeTtcclxuICAgIGRvbmU/OiBib29sZWFuO1xyXG4gICAgaGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgc3RhcnQ/OiBudW1iZXI7XHJcbiAgICB0eXBlPzogc3RyaW5nO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIGNvbXBvbmVudD86IENvbXBvbmVudDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElTY3JvbGxpbmdEYXRhIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xyXG4gICAgdG9wOiBudW1iZXI7XHJcbiAgICByb2xlOiBzdHJpbmc7XHJcbiAgICBwYXRoPzogc3RyaW5nO1xyXG4gICAgdGl0bGU/OiBzdHJpbmc7XHJcbiAgICBib3R0b20/OiBudW1iZXI7XHJcbiAgICBjaGlsZHJlbj86IGFueTtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgZGVsYXk/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBpbml0aWFsaXplZD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUGFyYWxsYXhDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBzaGlmdD86IG51bWJlcjtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFuaW1hdGlvbkNhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgIGRlbGF5PzogbnVtYmVyO1xyXG4gICAgdW5jYWNoZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJU2Nyb2xsQ2FjaGUge1xyXG4gICAgYW5pbWF0aW9ucz86IElBbmltYXRpb25DYWNoZUl0ZW1bXTtcclxuICAgIHBhcmFsbGF4ZXM/OiBJUGFyYWxsYXhDYWNoZUl0ZW1bXTtcclxuICAgIG1vZHVsZXM/OiBJQmFzZUNhY2hlSXRlbVtdO1xyXG4gICAgYmFja2dyb3VuZHM/OiBJQmFja2dyb3VuZENhY2hlSXRlbVtdO1xyXG4gICAgc2VjdGlvbnM/OiBJU2Nyb2xsaW5nRGF0YVtdO1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kQ2FjaGVJdGVtIGV4dGVuZHMgSUJhY2tncm91bmREYXRhLCBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBwZXJjZW50YWdlPzogbnVtYmVyO1xyXG4gICAgaW5kZXg/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBkZWxheT86IG51bWJlcjtcclxuICAgIGJyZWFrcG9pbnRzPzogc3RyaW5nW107XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNjcm9sbCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2Nyb2xsO1xyXG4gICAgcHVibGljIHN0YXRpYyB3aW5kb3dIZWlnaHQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBzdGF0aWMgaGVhZGVySGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1heFNjcm9sbDogbnVtYmVyO1xyXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlZDogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9wOiBudW1iZXI7XHJcbiAgICAvLyBwdWJsaWMgc3RhdGljIGN1c3RvbVNjcm9sbDogU2Nyb2xsYmFyO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VzdG9tU2Nyb2xsO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cclxuICAgIHByaXZhdGUgY2FjaGU6IElTY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBpZ25vcmVDYWNoZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcclxuICAgIHByaXZhdGUgdGFyZ2V0OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIHN0b3JlZFBhdGg6IHN0cmluZztcclxuICAgIHByaXZhdGUgc2VjdGlvbnM6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgY2hhbmdpbmdQYXRoOiBib29sZWFuO1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNjcm9sbHMgcGFnZSB0byBjZXJ0YWluIGVsZW1lbnQgKHRvcCBlZGdlKSB3aXRoIHNvbWUgc3BlZWRcclxuICAgICAqIEBwYXJhbSAge0pRdWVyeX0gICAgICAgICRlbCAgICBbdGFyZ2V0IGVsbWVudF1cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIG9mZnNldFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgZHVyYXRpb25cclxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59ICAgICAgICBbYWZ0ZXIgY29tcGxldGVkIGFuaW1hdGlvbl1cclxuICAgICAqL1xyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9FbGVtZW50KCRlbDogSlF1ZXJ5LCBvZmZzZXQ/OiBudW1iZXIsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCB5ID0gJGVsLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgKyAob2Zmc2V0IHx8IDApO1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSB7XHJcbiAgICAgICAgICAgICAgICB5OiBNYXRoLm1heChkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCwgd2luZG93LnBhZ2VZT2Zmc2V0KSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKG9iaik7XHJcbiAgICAgICAgICAgIGdzYXAudG8ob2JqLCB7XHJcbiAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogZHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBvYmoueSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlc2V0U2Nyb2xsQ2FjaGUocGF0aG5hbWUpOiB2b2lkIHtcclxuICAgICAgICBTY3JvbGwuaW5zdGFuY2UuY2FjaGVbcGF0aG5hbWVdID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuaWdub3JlQ2FjaGUgPSAhIWJyb3dzZXIuc2FmYXJpO1xyXG5cclxuICAgICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xyXG4gICAgICAgIC8vICQoJ2FbaHJlZl49XCIjXCJdOm5vdChcIi5qcy1uYXYtaXRlbSwgW2RhdGEtbGlnaHRib3hdXCIpJykub24oJ2NsaWNrJywgdGhpcy5vbkhhc2hDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuICAgICAgICAvLyBTY3JvbGwuaXNDdXN0b21TY3JvbGwgPSAkKCcjd3BicycpLmRhdGEoJ3Njcm9sbGJhcicpO1xyXG5cclxuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gNzA7XHJcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZWRQYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC53aW5kb3dIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9ICQoJyNuYXZiYXInKS5oZWlnaHQoKTtcclxuICAgICAgICBTY3JvbGwubWF4U2Nyb2xsID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gU2Nyb2xsLndpbmRvd0hlaWdodCArIFNjcm9sbC5oZWFkZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9QYXRoKGZhc3Q/OiBib29sZWFuKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcclxuXHJcbiAgICAgICAgaWYgKCR0YXJnZXRbMF0pIHtcclxuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkdGFyZ2V0LCAwLCAwKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoISF0aGlzLmNoYW5naW5nUGF0aCkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gU2Nyb2xsLnNjcm9sbFRvUGF0aCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC5kaXNhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xyXG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJykub24oJ3Njcm9sbC5zY3JvbGxpbmcnLCAoKSA9PiB0aGlzLm9uU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhcnQoKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLmVuYWJsZSgpO1xyXG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5vblNjcm9sbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcclxuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHByaXZhdGUgb25IYXNoQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyAgICAgLy8gZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAvLyAgICAgaWYgKCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykpIHtcclxuICAgIC8vICAgICAgICAgbGV0IG9mZnNldCA9IHBhcnNlSW50KCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JyksIDEwKTtcclxuXHJcbiAgICAvLyAgICAgICAgIGlmICggdHlwZW9mICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykgPT09ICdzdHJpbmcnICkge1xyXG4gICAgLy8gICAgICAgICAgICAgY29uc3Qgb2ZmID0gJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKS5yZXBsYWNlKCd2aCcsICcnKTtcclxuICAgIC8vICAgICAgICAgICAgIG9mZnNldCA9ICQod2luZG93KS5oZWlnaHQoKSAqIChwYXJzZUludChvZmYsIDEwKSAvIDEwMCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCksIG9mZnNldCk7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBidWlsZEJhY2tncm91bmRzKCk6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kIH0ge1xyXG4gICAgICAgIGxldCBiZ3MgPSB7fTtcclxuICAgICAgICAkKCdbZGF0YS1iZy1jb21wb25lbnRdJykudG9BcnJheSgpLmZvckVhY2goKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkYmdFbCA9ICQoZWwpO1xyXG4gICAgICAgICAgICBsZXQgYmdOYW1lID0gJGJnRWwuZGF0YSgnYmctY29tcG9uZW50Jyk7XHJcbiAgICAgICAgICAgIGxldCBiZ09wdGlvbnMgPSAkYmdFbC5kYXRhKCdvcHRpb25zJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50c1tiZ05hbWVdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmcgPSBuZXcgY29tcG9uZW50c1tiZ05hbWVdKCRiZ0VsLCBiZ09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYmcuaWQgPSBlbC5pZDtcclxuICAgICAgICAgICAgICAgIGJnc1tlbC5pZF0gPSBiZztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBjb21wb25lbnQgYXZhaWxhYmxlIScsIGJnTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhiZ3MsICdCR1MgU0NST0xMJyk7XHJcbiAgICAgICAgcmV0dXJuIGJncztcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLmVsZW1lbnRzKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnM6IEFycmF5PElBbmltYXRpb25DYWNoZUl0ZW0+ID0gW107XHJcbiAgICAgICAgY29uc3QgbWFyZ2luID0gMCA7XHJcblxyXG4gICAgICAgIC8vIGxldCBzZWN0aW9uczogQXJyYXk8SVNjcm9sbGluZ0RhdGE+ID0gW107XHJcbiAgICAgICAgLy8gaWYgKHRoaXMuc2VjdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGg7ICsraSkge1xyXG5cclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gdGhpcy5zZWN0aW9ucy5lcShpKTtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJvbGUgPSAkZWwuZGF0YSgnc2Nyb2xsJyk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0b3AgPSAkZWwub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgaGVpZ2h0ID0gJGVsLm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkZWxheSA9ICRlbC5kYXRhKCdkZWxheScpIHx8IDA7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0aXRsZSA9ICRlbC5kYXRhKCd0aXRsZScpIHx8IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgcGF0aCA9ICRlbC5kYXRhKCdwYXRoJykgfHwgZmFsc2U7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkYXRhOiBJU2Nyb2xsaW5nRGF0YSA9IHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAvLyAgICAgICAgICAgICByb2xlOiByb2xlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGJvdHRvbTogdG9wICsgaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZHJlbjoge30sXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgc2hvd246ICRlbC5kYXRhKCdzaG93bicpIHx8IGZhbHNlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGRlbGF5OiBkZWxheSxcclxuICAgICAgICAvLyAgICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vICAgICAgICAgc2VjdGlvbnMucHVzaChkYXRhKTtcclxuICAgICAgICAvLyAgICAgICAgICRlbC5kYXRhKCdjYWNoZScsIGkpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfVxyXG5cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtYW5pbWF0aW9uXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiB0eXBlb2YgJGVsLmRhdGEoJ3N0YXJ0JykgIT09ICd1bmRlZmluZWQnID8gJGVsLmRhdGEoJ3N0YXJ0JykgOiAwLjEsXHJcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wIC0gbWFyZ2luLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgIGRvbmU6ICRlbC5oYXNDbGFzcygnYW5pbWF0ZWQnKSxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICRlbC5kYXRhKCdhbmltYXRpb24nKSxcclxuICAgICAgICAgICAgICAgIGRlbGF5OiAkZWwuZGF0YSgnZGVsYXknKSB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgdW5jYWNoZTogJGVsLmRhdGEoJ3VuY2FjaGUnKSxcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogJGVsLmRhdGEoJ2NvbXAnKSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgY29uc3QgcGFyYWxsYXhlczogQXJyYXk8SVBhcmFsbGF4Q2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLXBhcmFsbGF4XScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJCg8SFRNTEVsZW1lbnQ+ZWwpO1xyXG4gICAgICAgICAgICBjb25zdCBwID0gJGVsLmRhdGEoJ3BhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgIHBhcmFsbGF4ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiAwLFxyXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgcCA9PT0gJ3N0cmluZycgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIHNoaWZ0OiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgYmFja2dyb3VuZHM6IEFycmF5PElCYWNrZ3JvdW5kQ2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLWJhY2tncm91bmRdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcclxuICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZERhdGEgPSAkZWwuZGF0YSgnYmFja2dyb3VuZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBicmVha3BvaW50cyA9IGJhY2tncm91bmREYXRhLmJyZWFrcG9pbnRzIHx8IFsnZGVza3RvcCcsICd0YWJsZXQnLCAncGhvbmUnXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChicmVha3BvaW50cy5pbmRleE9mKGJyZWFrcG9pbnQudmFsdWUpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iYWNrZ3JvdW5kc1tiYWNrZ3JvdW5kRGF0YS5pZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3RoZXJlXFwncyBubyBiYWNrZ3JvdW5kIHdpdGggaWQ9JyArIGJhY2tncm91bmREYXRhLmlkICsgJyEnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZHMucHVzaCgkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbDogJGVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtlbkRlbGF5OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGJhY2tncm91bmREYXRhIHx8IHt9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmNhY2hlLmFuaW1hdGlvbnMgPSBhbmltYXRpb25zO1xyXG4gICAgICAgIHRoaXMuY2FjaGUucGFyYWxsYXhlcyA9IHBhcmFsbGF4ZXM7XHJcbiAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcyA9IGJhY2tncm91bmRzO1xyXG4gICAgICAgIC8vIHRoaXMuY2FjaGUuc2VjdGlvbnMgPSBzZWN0aW9ucztcclxuXHJcblxyXG5cclxuICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uU2Nyb2xsID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoU2Nyb2xsLmRpc2FibGVkIHx8ICRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNUID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgMDtcclxuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSBTY3JvbGwud2luZG93SGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcmVlbkNlbnRlcjogbnVtYmVyID0gc1QgKyBTY3JvbGwud2luZG93SGVpZ2h0ICogMC4zMztcclxuICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBTY3JvbGwuaGVhZGVySGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcm9sbGVuZCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIHdpbmRvdy5pbm5lckhlaWdodCAtIDI7XHJcbiAgICAgICAgY29uc3QgcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSAoU2Nyb2xsLmhlYWRlckhlaWdodCAqIDIpIDogMDtcclxuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kcyA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0IDogMDtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9wID0gc1Q7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxDYWNoZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVdID0gc1Q7XHJcblxyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC13aW5kb3ctaGVpZ2h0Jywgc1QgPiB3aW5kb3dIZWlnaHQgLSAxMDApO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC1uYXZiYXInLCBzVCA+IDEwMCk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkJywgc1QgPiAwKTtcclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcsIHNUID4gcGFnZUhlYWRlcik7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWJhY2tncm91bmRzLXNjcm9sbGVkJywgc1QgPiBiYWNrZ3JvdW5kcyk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbC1lbmQnLCBzVCA+PSBzY3JvbGxlbmQpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9uczpcclxuICAgICAgICBpZiAodGhpcy5jYWNoZS5hbmltYXRpb25zICYmIHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtOiBJQW5pbWF0aW9uQ2FjaGVJdGVtID0gdGhpcy5jYWNoZS5hbmltYXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeVRvcDogbnVtYmVyID0gc1Q7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRvbmUgJiYgaXRlbVkgPD0geUJvdHRvbSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1aWNrOiBib29sZWFuID0geVRvcCA+PSBpdGVtWSArIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uY29tcG9uZW50ICYmIGl0ZW0udHlwZSA9PT0gJ3RvZ2dsZScgJiYgdHlwZW9mIGl0ZW0uY29tcG9uZW50WydlbmFibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBvbmVudFsnZW5hYmxlJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFuaW1hdGUoaXRlbSwgaXRlbS4kZWwsIGl0ZW0udHlwZSwgaXRlbS5kZWxheSwgcXVpY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLmRvbmUgJiYgaXRlbS5jb21wb25lbnQgJiYgaXRlbS50eXBlID09PSAndG9nZ2xlJyAmJiAoaXRlbVkgPiB5Qm90dG9tIHx8IGl0ZW1ZICsgaXRlbUhlaWdodCA8IHlUb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udW5jYWNoZSAmJiBpdGVtLmRvbmUgJiYgKHNUIDw9IGl0ZW1ZIC0gd2luZG93SGVpZ2h0IHx8IHNUID49IGl0ZW1ZICsgd2luZG93SGVpZ2h0ICkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykubGVuZ3RoID4gMCkgeyBpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmF0dHIoJ2RhdGEtdW5jYWNoZScpKSB7IGl0ZW0uJGVsLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIHBhcmFsbGF4ZXM6XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUucGFyYWxsYXhlcyAmJiB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoID4gMCAmJiBicmVha3BvaW50LmRlc2t0b3ApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyYWxsYXgodGhpcy5jYWNoZS5wYXJhbGxheGVzW2ldLCBzVCwgd2luZG93SGVpZ2h0LCAtaGVhZGVySGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICAvL2Jnc1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAuNSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgLy8gY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgYmdzVG9TaG93ID0gW107XHJcbiAgICAgICAgICAgIGxldCBiZ3NUb0hpZGUgPSBbXTtcclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzLmZvckVhY2goKGl0ZW06IElCYWNrZ3JvdW5kQ2FjaGVJdGVtLCBpbmRleCkgPT4ge1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Cb3R0b206IG51bWJlciA9IGl0ZW1ZICsgaXRlbUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IHNUICsgaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHRoaXMuYmFja2dyb3VuZHNbaXRlbS5pZF07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWxheSA9IHR5cGVvZiBpdGVtLmRlbGF5ICE9PSAndW5kZWZpbmVkJyA/IGl0ZW0uZGVsYXkgOiAwLjE7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gLSAoaXRlbVkgLSB5Q2VudGVyKSAvIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50ID0gJGJvZHkuaGFzQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnKSA/IHNUICsgd2luZG93SGVpZ2h0ID49IGl0ZW1ZICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCA6IGl0ZW1ZIC0gc1QgPD0gd2luZG93Q2VudGVyICYmIGl0ZW1Cb3R0b20gLSBzVCA+PSB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgZGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC51cGRhdGUocGVyY2VudGFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5zZXRTdGVwKGl0ZW0uc3RlcCwgYmFja2dyb3VuZFF1aWNrU2V0dXApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmRhcmtlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmRhcmtlbihpdGVtWSA8PSB5Q2VudGVyIC0gd2luZG93SGVpZ2h0ICogaXRlbS5kYXJrZW5EZWxheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJnc1RvU2hvdy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBiZ3NUb0hpZGUucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChiZ3NUb0hpZGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBiZ3NUb0hpZGUuZm9yRWFjaCgoYmdJRCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiZ3NUb1Nob3cuaW5kZXhPZihiZ0lEKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5hbmltYXRpb25PdXQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzW2JnSURdLnNob3duPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAvLyBQcm9ncmVzc2Jhci51cGRhdGUoc1QpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFuaW1hdGUoZGF0YTogSUFuaW1hdGlvbkNhY2hlSXRlbSwgJGVsOiBKUXVlcnksIHR5cGU6IHN0cmluZywgZGVsYXk6IG51bWJlciA9IDAuMSBhcyBudW1iZXIsIHF1aWNrPzogYm9vbGVhbiwgdW5jYWNoZT86IGJvb2xlYW4pOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZSA9ICFxdWljayA/IC42IDogMDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVVcCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiA0MCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZURvd24nOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeTogLTEwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVSaWdodCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAtMTAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZUxlZnQnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeDogMTAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaVRhYnMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbFRleHQgPSAkZWwuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgclRleHQgPSAkZWwuZmluZCgnc3BhbjpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obFRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJzUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oclRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJy01MCUnLCBvcGFjaXR5OiAwIH0sIHsgeDogJzAlJywgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2VsZW1lbnRzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbC5maW5kKCdbZGF0YS12aWV3LXRhYl0nKSwgeyBkdXJhdGlvbjogMSwgeTogJzEwMCUnIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICB5OiAnMCUnLCBzdGFnZ2VyOiAwLjIsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcuaXRlbV9fdGFicycpLCB7IGR1cmF0aW9uOiAxLCBvdmVyZmxvdzogJ3Vuc2V0JyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhY3QnOlxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBmVGV4dCA9ICRlbC5maW5kKCcuZmFjdF9fdGV4dCBzcGFuJyksXHJcbiAgICAgICAgICAgICAgICAgICAgc3BsaXRGVHh0ID0gbmV3IFNwbGl0VGV4dChmVGV4dCwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJ30pLFxyXG4gICAgICAgICAgICAgICAgICAgIGZJbWcgPSAkZWwuZmluZCgnLmZhY3RfX2ltYWdlLXdyYXAnKSxcclxuICAgICAgICAgICAgICAgICAgICBmQXJyID0gJGVsLmZpbmQoJy5mYWN0X19pY29uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhmQXJyLCB7IGR1cmF0aW9uOiAxLCByb3RhdGU6IDkwIH0sIHsgcm90YXRlOiAwLCBkZWxheTogMC41IH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhzcGxpdEZUeHQuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC01IH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wMSB9LCAnLT0wLjgnKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oZkltZywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSB9LCAnLT0wLjUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2xlYWQnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXQgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgbGluZXMnLCBsaW5lc0NsYXNzOiAnbGluZScgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsaW5lcyA9ICRlbC5maW5kKCcubGluZScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAkKGxpbmVzW2ldKS5hZnRlcignPGJyPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICQobGluZXNbaV0pLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCJsaW5lX19iZ1wiPjwvc3Bhbj4nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdC53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMSwgZGVsYXk6IDAuNCB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLmZpbmQoJy5saW5lX19iZycpLCB7IGR1cmF0aW9uOiAwLjc1LCBzY2FsZVg6IDEsIHN0YWdnZXI6IDAuMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnc2NhbGUnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDB9LHtzY2FsZVg6IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkZWxheX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnY2hhcnMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRIID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0SC5jaGFycywgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwLCBvcGFjaXR5OiAwIH0sIHsgc2NhbGVYOiAxLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnY2hhcnMtc2ltcGxlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0SDIgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRIMi5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd3b3Jkcy1zaW1wbGUnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgd29yZHMgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcycgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZ2VyID0gJGVsLmRhdGEoJ3N0YWdnZXInKSA/ICRlbC5kYXRhKCdzdGFnZ2VyJykgOiAwLjI7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21Ubyh3b3Jkcy53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJ9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ltYWdlcyc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwuZmluZCgnaW1nJyksIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEsIHN0YWdnZXI6IDAuMiB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hlcm8nOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gJGVsLmZpbmQoJ1tkYXRhLWl0ZW09XCIwXCJdIC5qcy1tYXAnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9FbCA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXSAuanMtZWwnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGhlcm9DYXB0aW9uID0gJGVsLmZpbmQoJ1tkYXRhLWNhcHRpb249XCIwXCJdJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvTmF2ID0gJGVsLmZpbmQoJy5qcy1uYXZpZ2F0aW9uJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoW21hcCwgaGVyb0VsLCBoZXJvTmF2XSwgeyBvcGFjaXR5OiAwfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obWFwLCAxLjUsIHtkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMC44NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvQ2FwdGlvbiwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC41LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24ucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24uYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhlcm9FbCwgMSwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7b3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDEuMjUsIHN0YWdnZXI6IDAuMixcclxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGhlcm9OYXYsIDEsIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDEuNSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9FbC5yZW1vdmVBdHRyKCdzdHlsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLXJlYWR5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdxdW90ZSc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkcXVvdGUgPSAkZWwuZmluZCgnLmpzLXF1b3RlLXdvcmRzJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkYXV0aG9yID0gJGVsLmZpbmQoJy5qcy1xdW90ZS1hdXRob3InKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0ICRsaW5lID0gJGVsLmZpbmQoJ2hyJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoWyRxdW90ZSwgJGVsLCAkYXV0aG9yXSwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gJHF1b3RlLmNoaWxkcmVuKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFF1b3RlID0gbmV3IFNwbGl0VGV4dCgkcXVvdGUsIHsgdHlwZTogJ3dvcmRzJyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBGT1IgVU5DQUNIRSBPUFRJT04gT0YgQU5JTUFUSU9OIFFVT1RFXHJcbiAgICAgICAgICAgICAgICAvLyBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXRRdW90ZS53b3Jkcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHNwbGl0UXVvdGUud29yZHNbaV0uY2xhc3NMaXN0LmFkZCgndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnRpbWVsaW5lKHtcclxuICAgICAgICAgICAgICAgICAgICBhdXRvUmVtb3ZlQ2hpbGRyZW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5zZXQoJHF1b3RlLCB7IG9wYWNpdHk6IDEgfSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGNoaWxkLCAwLjUsIHsgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIGVhc2U6ICdwb3dlcjMnIH0sICcrPScgKyBkZWxheSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbShzcGxpdFF1b3RlLndvcmRzLCAwLjUsIHsgb3BhY2l0eTogMCwgeDogOCwgdHJhbnNmb3JtT3JpZ2luOiAnMCUgMTAwJScsIGVhc2U6ICdwb3dlcjMnLCBzdGFnZ2VyOiAwLjA1IH0sIDAuMSlcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKCRhdXRob3IsIDAuNywgeyBvcGFjaXR5OiAwLCB4OiAtMTAgfSwgeyBvcGFjaXR5OiAxLCB4OiAwIH0sICctPScgKyAwLjMpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkbGluZSwgeyBkdXJhdGlvbjogMC43LCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEgfSwgJy09MC4zJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd3b3Jkcyc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHR4dCA9ICRlbDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0dHh0ID0gbmV3IFNwbGl0VGV4dCh0eHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXR0eHQuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXR0eHQuY2hhcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3BsaXR0eHQuY2hhcnNbaV0uY2xhc3NMaXN0LmFkZCgndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgY2FzZSAndXBEb3duJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHlTaGlmdCA9ICRlbC5kYXRhKCdzaGlmdCcpID09PSAndXAnID8gMTAgOiAtMTA7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIHk6IDAsIG9wYWNpdHk6IDF9LCB7b3BhY2l0eTogMC4yLCB5OiB5U2hpZnQsIHJlcGVhdDogMiwgZWFzZTogJ25vbmUnLCB5b3lvOiB0cnVlLCBkZWxheTogZGVsYXksXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpdGVtc0ZhZGUnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSAkZWwuZmluZCgnLicgKyAkZWwuZGF0YSgnZWxlbWVudHMnKSArICcnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzSW4gPSAkZWwuZGF0YSgnZWxlbWVudHMtaW4nKSA/ICRlbC5maW5kKCcuJyArICRlbC5kYXRhKCdlbGVtZW50cy1pbicpICsgJycpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXJFbCA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZGVsID0gZGVsYXkgPyBkZWxheSA6IDAuMjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHNoaWZ0WUF4aXMgPSAkZWwuZGF0YSgneScpID8gdHJ1ZSA6IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZWxTY2FsZSA9ICAkZWwuZGF0YSgnc2NhbGUnKSA/IHRydWUgOiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KGVsZW1lbnRzLCB7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCRlbC5kYXRhKCd1bmNhY2hlJykgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudHNJbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgZWxlbWVudHNJbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNJbltpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbFNjYWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIDAuOCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOX0sIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzSW4sIDAuOCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMH0sIHsgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgKyAwLjQgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGlmdFlBeGlzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAxMH0sIHsgeTogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3ZpZGVvLXRleHQnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgdmlkID0gJGVsLmZpbmQoJy5qcy1jb2wtNjYnKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGluZiA9ICRlbC5maW5kKCcuanMtY29sLTMzJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldChbdmlkLCBpbmZdLCB7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAudG8odmlkLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC4yfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhpbmYsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0yMH0sIHsgb3BhY2l0eTogMSwgeDogMCwgZGVsYXk6IDAuNH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGVhZGluZyc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoVGl0bGUgPSAkZWwuZmluZCgnLmpzLXRpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaHIgPSAkZWwuZmluZCgnLmpzLWhlYWRpbmctaHInKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFRpdGxlID0gbmV3IFNwbGl0VGV4dChoVGl0bGUsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdFRpdGxlLmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhociwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxLCBkZWxheTogMC41IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAndGl0bGVGYWRlSW4nOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVhZCA9ICRlbC5maW5kKCcuanMtZml4ZWQtdGl0bGUnKSxcclxuICAgICAgICAgICAgICAgICAgICAgIHN1YiA9ICRlbC5maW5kKCcuanMtc3ViJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICBhcnIgPSAkZWwuZmluZCgnLmpzLWFycicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShsZWFkLCB7IGR1cmF0aW9uOiAxLjUsIG9wYWNpdHk6IDAsIHNjYWxlOiAxLjIsIGRlbGF5OiAyfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oc3ViLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAzMCwgZGVsYXk6IDMuMn0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGFyciwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjd9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ludHJvJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnRhaW4gPSAkZWwuZmluZCgnLmpzLWN1cnRhaW4nKTtcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGN1cnRhaW4sIHsgZHVyYXRpb246IDMsIG9wYWNpdHk6IDAsIGRlbGF5OiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJCgnaHRtbCcpLmFkZENsYXNzKCdpcy1hbmltYXRlZCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaGVhZGVyJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgaHRpbWUgPSAkZWwuZmluZCgnLmpzLXRpbWUnKSxcclxuICAgICAgICAgICAgICAgICAgICBzb2NpYWxEID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX2l0ZW0nKSxcclxuICAgICAgICAgICAgICAgICAgICBzaGFyZVRleHQgPSAkZWwuZmluZCgnLnBob25lLWhpZGUgLnNvY2lhbF9fdGl0bGUnKSxcclxuICAgICAgICAgICAgICAgICAgICBoSHIgPSAkZWwuZmluZCgnLmpzLWhlYWRlci1ocicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKFtodGltZSwgc2hhcmVUZXh0LCBzb2NpYWxEXSwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTEwfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjF9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhIciwgeyBzY2FsZVg6IDB9LCB7IHNjYWxlWDogMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBudW1FbCA9ICRlbC5maW5kKCdbZGF0YS1udW1dJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpLmRhdGEoJ251bScpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZHVyID0gJGVsLmRhdGEoJ3RpbWUnKSA/ICRlbC5kYXRhKCd0aW1lJykgKiAxMDAwIDogMjAwMDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG51bVRleHQgPSAkZWwuZmluZCgnW2RhdGEtdGV4dF0nKS5sZW5ndGggPiAwID8gJGVsLmZpbmQoJ1tkYXRhLXRleHRdJykgOiBudWxsO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpeGVkID0gbnVtLnRvU3RyaW5nKCkuaW5kZXhPZignLicpID4gLTEgPyBudW0udG9TdHJpbmcoKS5sZW5ndGggLSBudW0udG9TdHJpbmcoKS5pbmRleE9mKCcuJykgLSAxIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBudW1FbC5jc3Moe1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG51bUVsLndpZHRoKCksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2Rpc3BsYXknOiAnaW5saW5lLWJsb2NrJ1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDF9KTtcclxuICAgICAgICAgICAgICAgIGlmIChudW1UZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQobnVtVGV4dCwgeyBvcGFjaXR5OiAwfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC50byhudW1UZXh0LCAxLHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IGR1ci8xMDAwfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbnVtRWwucHJvcCgnQ291bnRlcicsIDApLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgIENvdW50ZXI6IG51bSxcclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogZHVyLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2luZzogJ3N3aW5nJyxcclxuICAgICAgICAgICAgICAgICAgICBzdGVwOiAobm93KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmaXhlZCAmJiBmaXhlZCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChudW1FbC5kYXRhKCdyZXBsYWNlJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KChub3cudG9GaXhlZChmaXhlZCkudG9TdHJpbmcoKS5yZXBsYWNlKCcuJywgJywnKSkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KG5vdy50b0ZpeGVkKGZpeGVkKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KE1hdGguY2VpbChub3cpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgZGVmYXVsdDpcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke3R5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgcGFyYWxsYXgoaXRlbTogSVBhcmFsbGF4Q2FjaGVJdGVtLCBzVDogbnVtYmVyLCB3aW5kb3dIZWlnaHQ6IG51bWJlciwgaGVhZGVySGVpZ2h0OiBudW1iZXIpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKGl0ZW0uc2hpZnQpIHtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gaXRlbS4kZWw7XHJcbiAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBpdGVtLnk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBweUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQ6IG51bWJlciA9ICh5IC0gc1QgKyBpdGVtLmhlaWdodCAtIGhlYWRlckhlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgeSA9IE1hdGgucm91bmQocGVyY2VudCAqIGl0ZW0uc2hpZnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHRpbWU6IG51bWJlciA9ICFpdGVtLmRvbmUgPyAwIDogMC41O1xyXG4gICAgICAgICAgICAgICAgaXRlbS5kb25lID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwpO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50bygkZWwsIHtcclxuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGltZSxcclxuICAgICAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgICAgIHJvdW5kUHJvcHM6IFsneSddLFxyXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAoaXRlbS50eXBlKSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gaXRlbS4kZWw7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbFN0aWNreTogSlF1ZXJ5ID0gJGVsLnBhcmVudCgpLnBhcmVudCgpO1xyXG4gICAgICAgICAgICBjb25zdCB5OiBudW1iZXIgPSBpdGVtLnk7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XHJcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBweVRvcFN0aWNreTogbnVtYmVyID0gc1QgLSAkZWxTdGlja3kuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2hlcm8nOlxyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGVsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICFicm93c2VyLm1vYmlsZSA/IHNUICogMC41IDogMCxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2ZpeGVkSW1hZ2UnOlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHksIFwieVwiLCBzVCwgcHlCb3R0b20sIHdpbmRvd0hlaWdodCx3aW5kb3dIZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IHB5VG9wICYmIHkgPD0gcHlCb3R0b20pIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghJGVsLmhhc0NsYXNzKCdoYXMtcGFyYWxsYXgnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdoYXMtcGFyYWxsYXgnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdoYXMtcGFyYWxsYXgnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGNhc2UgJ2Nzcy1hbmltYXRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IChweVRvcCArIGhlYWRlckhlaWdodCkgJiYgeSA8PSBweUJvdHRvbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5oYXNDbGFzcygnYW5pbWF0aW9uLXBsYXknKSA/IG51bGwgOiBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdyZWxhdGl2ZVBhcmFsbGF4JzpcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGVTcGFjZSA9IGl0ZW0uY2hpbGRIZWlnaHQgLSBpdGVtLmhlaWdodDsgLy8gcmVzZXJ2ZSBzcGFjZVxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1heFNoaWZ0ID0gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsIGl0ZW0uaGVpZ2h0ICsgaGVhZGVySGVpZ2h0KTsgLy8gTWF0aC5taW4oYXZhaWxhYmxlU3BhY2UsICh3aW5kb3dIZWlnaHQgLSBkYXRhLmhlaWdodCkgKiAwLjUgKTsgLy8gZG8gbm90IG1vdmUgdG9vIG11Y2ggb24gYmlnIHNjcmVlbnNcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50ID0gKHNUIC0gaXRlbS55ICsgd2luZG93SGVpZ2h0KSAvICh3aW5kb3dIZWlnaHQgKyBpdGVtLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwb3NZOiBzdHJpbmcgfCBudW1iZXIgPSBNYXRoLnJvdW5kKCgxIC0gcGVyY2VudCkgKiBtYXhTaGlmdCk7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPCAwID8gMCA6IHBvc1k7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPiBtYXhTaGlmdCA/IG1heFNoaWZ0IDogcG9zWTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQoaXRlbS4kY2hpbGQsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeTogLXBvc1ksXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7aXRlbS50eXBlfVwiIGRvZXMgbm90IGV4aXN0YCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmV4cG9ydCBjbGFzcyBTaGFyZSB7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG5cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtc2hhcmVdJykub24oJ2NsaWNrJywgKGUpOiBib29sZWFuID0+IHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHdpbldpZHRoID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2lud2lkdGgnKSwgMTApIHx8IDUyMDtcclxuICAgICAgICAgICAgbGV0IHdpbkhlaWdodCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbmhlaWdodCcpLCAxMCkgfHwgMzUwO1xyXG4gICAgICAgICAgICBsZXQgd2luVG9wID0gKHNjcmVlbi5oZWlnaHQgLyAyKSAtICh3aW5IZWlnaHQgLyAyKTtcclxuICAgICAgICAgICAgbGV0IHdpbkxlZnQgPSAoc2NyZWVuLndpZHRoIC8gMikgLSAod2luV2lkdGggLyAyKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSA8YW55PmUuY3VycmVudFRhcmdldDtcclxuICAgICAgICAgICAgY29uc3QgaHJlZiA9IGN1cnJlbnRUYXJnZXQuaHJlZjtcclxuICAgICAgICAgICAgY29uc3QgZGF0YSA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdzaGFyZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGRhdGEgPT09ICdsaW5rZWRpbicpIHtcclxuICAgICAgICAgICAgICAgIHdpbldpZHRoID0gNDIwO1xyXG4gICAgICAgICAgICAgICAgd2luSGVpZ2h0ID0gNDMwO1xyXG4gICAgICAgICAgICAgICAgd2luVG9wID0gd2luVG9wIC0gMTAwO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB3aW5kb3cub3BlbihocmVmLCAnc2hhcmVyJyArIGRhdGEsICd0b3A9JyArIHdpblRvcCArICcsbGVmdD0nICsgd2luTGVmdCArICcsdG9vbGJhcj0wLHN0YXR1cz0wLHdpZHRoPScgKyB3aW5XaWR0aCArICcsaGVpZ2h0PScgKyB3aW5IZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL3JlZmVyZW5jZXMuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBQdXNoU3RhdGVzLCBQdXNoU3RhdGVzRXZlbnRzIH0gZnJvbSAnLi9QdXNoU3RhdGVzJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XHJcbmltcG9ydCB7IFBhZ2UsIFBhZ2VFdmVudHMgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5pbXBvcnQgeyBDb21wb25lbnRFdmVudHMsIENvbXBvbmVudCB9IGZyb20gJy4vY29tcG9uZW50cy9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBCcm93c2VyLCBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcclxuaW1wb3J0IHsgTG9hZGVyIH0gZnJvbSAnLi9Mb2FkZXInO1xyXG5pbXBvcnQgeyBwYWdlcywgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XHJcbmltcG9ydCB7IENvcHkgfSBmcm9tICcuL0NvcHknO1xyXG5pbXBvcnQgeyBTaGFyZSB9IGZyb20gJy4vU2hhcmUnO1xyXG5pbXBvcnQgeyBBUEkgfSBmcm9tICcuL0FwaSc7XHJcblxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuXHJcbmV4cG9ydCBsZXQgc2l0ZTogU2l0ZTtcclxuZXhwb3J0IGxldCAkZG9jOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJHdpbmRvdzogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRib2R5OiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJGFydGljbGU6IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkbWFpbjogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRwYWdlSGVhZGVyOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgcGl4ZWxSYXRpbzogbnVtYmVyO1xyXG5leHBvcnQgbGV0IGRlYnVnOiBib29sZWFuO1xyXG5leHBvcnQgbGV0IGVhc2luZzogc3RyaW5nO1xyXG5leHBvcnQgbGV0IGxhbmc6IHN0cmluZztcclxuZXhwb3J0IGxldCBmaXhlZHBvc2l0aW9uOiBudW1iZXI7XHJcblxyXG4vLyBkZWNsYXJlIGxldCBDdXN0b21FYXNlO1xyXG5cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNpdGUge1xyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTaXRlO1xyXG5cclxuICAgIHByaXZhdGUgY3VycmVudFBhZ2U6IFBhZ2U7XHJcbiAgICBwcml2YXRlIHB1c2hTdGF0ZXM6IFB1c2hTdGF0ZXM7XHJcbiAgICBwcml2YXRlIHNjcm9sbDogU2Nyb2xsO1xyXG4gICAgcHJpdmF0ZSBsYXN0QnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XHJcbiAgICBwcml2YXRlIGxvYWRlcjogTG9hZGVyO1xyXG4gICAgLy8gcHJpdmF0ZSBpc1JlYWR5OiBib29sZWFuO1xyXG4gICAgLy8gcHJpdmF0ZSBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XHJcbiAgICAvLyBwcml2YXRlICRoYW1idXJnZXI6IEpRdWVyeTtcclxuICAgIC8vIHByaXZhdGUgJHBhZ2VIZWFkZXI6IEpRdWVyeTtcclxuICAgIC8vIHByaXZhdGUgJGFydGljbGU6IEpRdWVyeTtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnc2l0ZScpO1xyXG5cclxuICAgICAgICBTaXRlLmluc3RhbmNlID0gdGhpcztcclxuICAgICAgICAvLyBsYW5nID0gJCgnaHRtbCcpLmF0dHIoJ2xhbmcnKTtcclxuXHJcbiAgICAgICAgcGl4ZWxSYXRpbyA9IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDE7XHJcbiAgICAgICAgZGVidWcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoLmluZGV4T2YoJ2RlYnVnJykgPj0gMDtcclxuICAgICAgICAvLyBlYXNpbmcgPSBDdXN0b21FYXNlLmNyZWF0ZSgnY3VzdG9tJywgJ00wLDAsQzAuNSwwLDAuMywxLDEsMScpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGluaXQoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XHJcbiAgICAgICAgQnJvd3Nlci51cGRhdGUoKTtcclxuXHJcbiAgICAgICAgJGRvYyA9ICQoZG9jdW1lbnQpO1xyXG4gICAgICAgICR3aW5kb3cgPSAkKHdpbmRvdyk7XHJcbiAgICAgICAgJGJvZHkgPSAkKCdib2R5Jyk7XHJcbiAgICAgICAgJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XHJcbiAgICAgICAgJG1haW4gPSAkKCcjbWFpbicpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzID0gbmV3IFB1c2hTdGF0ZXMoKTtcclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UsIHRoaXMub25TdGF0ZSk7XHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLm9uKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIHRoaXMub25Mb2FkUHJvZ3Jlc3MpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLiRoYW1idXJnZXIgPSAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XHJcbiAgICAgICAgLy8gdGhpcy4kYXJ0aWNsZSA9ICQoJyNhcnRpY2xlLW1haW4nKTtcclxuICAgICAgICAvLyB0aGlzLiRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5zY3JvbGwgPSBuZXcgU2Nyb2xsKCk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIgPSBuZXcgTG9hZGVyKCQoJy5qcy1sb2FkZXInKSk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUpO1xyXG5cclxuXHJcbiAgICAgICAgbmV3IENvcHkoKTtcclxuICAgICAgICBuZXcgU2hhcmUoKTtcclxuICAgICAgICBuZXcgQVBJKCk7XHJcbiAgICAgICAgQVBJLmJpbmQoKTtcclxuICAgICAgICAvLyB0aGlzLm1lbnUgPSBuZXcgTWVudSgkKCcuanMtbWVudScpKTtcclxuICAgICAgICAvLyB0aGlzLmNvb2tpZXMgPSBuZXcgQ29va2llcygkKCcuanMtY29va2llcycpKTtcclxuXHJcblxyXG4gICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KFtcclxuICAgICAgICAgICAgdGhpcy5zZXRDdXJyZW50UGFnZSgpLFxyXG4gICAgICAgICAgICAvLyB0aGlzLnByZWxvYWRBc3NldHMoKSxcclxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKSxcclxuICAgICAgICBdKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcclxuXHJcblxyXG4gICAgICAgIGlmIChkZWJ1ZykgeyBVdGlscy5zdGF0cygpOyB9XHJcblxyXG4gICAgICAgICR3aW5kb3cub24oJ29yaWVudGF0aW9uY2hhbmdlJywgKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XHJcblxyXG4gICAgICAgIH0sIDEwMCkpO1xyXG4gICAgICAgICR3aW5kb3cub24oJ3Jlc2l6ZScsICgpID0+IHRoaXMub25SZXNpemUoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uUmVzaXplKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xyXG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3AgJiYgIWJyb3dzZXIubW9iaWxlKSB7XHJcbiAgICAgICAgICAgIFV0aWxzLnNldFJvb3RWYXJzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3aWR0aCA9ICR3aW5kb3cud2lkdGgoKTtcclxuICAgICAgICBjb25zdCBoZWlnaHQgPSAkd2luZG93LmhlaWdodCgpO1xyXG5cclxuICAgICAgICBjb25zdCBjaGFuZ2VkID0gIXRoaXMubGFzdEJyZWFrcG9pbnQgfHwgdGhpcy5sYXN0QnJlYWtwb2ludC52YWx1ZSAhPT0gYnJlYWtwb2ludC52YWx1ZTtcclxuICAgICAgICB0aGlzLmxhc3RCcmVha3BvaW50ID0gYnJlYWtwb2ludDtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFBhZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5yZXNpemUod2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdpZHRoLCBoZWlnaHQsIGJyZWFrcG9pbnQsIGNoYW5nZWQpO1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5yZXNpemUoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgcHJlbG9hZEFzc2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgICAgICAgbGV0IGFzc2V0cyA9IFtdO1xyXG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCgnLnByZWxvYWQtYmcnLCB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChhc3NldHMgJiYgYXNzZXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhc3NldHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQoYXNzZXRzW2ldLCBudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgaWwuanFEZWZlcnJlZC5hbHdheXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGNoZWNrIGlmIGFueSBjb21wb25lbnQgaGFuZGxlIG9uU3RhdGUgZXZlbnRcclxuICAgIC8vIGlmIG5vdCwgcmVsb2FkIGh0bWw6XHJcbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIC8vIGNvbnN0IHNjcm9sbGluZ0NoYW5nZWRTdGF0ZSA9IHRoaXMuc2Nyb2xsLm9uU3RhdGUoKTtcclxuICAgICAgICBjb25zdCBwYWdlQ2hhbmdlZFN0YXRlID0gdGhpcy5jdXJyZW50UGFnZS5vblN0YXRlKCk7XHJcblxyXG4gICAgICAgIC8vIGlmICghc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlICYmICFvZmZzY3JlZW5DaGFuZ2VkU3RhdGUgJiYgIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcclxuICAgICAgICBpZiAoIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcclxuXHJcbiAgICAgICAgICAgIC8vIEFuYWx5dGljcy5zZW5kUGFnZXZpZXcod2luZG93LmxvY2F0aW9uLnBhdGhuYW1lKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHB1c2hTdGF0ZXNMb2FkUHJvbWlzZSA9IHRoaXMucHVzaFN0YXRlcy5sb2FkKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGFuaW1hdGVPdXRQcm9taXNlID0gdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlT3V0KCk7XHJcblxyXG4gICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9hZGVyLnNob3coKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNjcm9sbC5zdG9wKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBhbGwgcHJvbWlzZXMgYXJyYXk6XHJcbiAgICAgICAgICAgIGNvbnN0IGxvYWRpbmdQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBbXHJcbiAgICAgICAgICAgICAgICBwdXNoU3RhdGVzTG9hZFByb21pc2UsXHJcbiAgICAgICAgICAgICAgICBhbmltYXRlT3V0UHJvbWlzZSxcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIHJlbmRlciBodG1sIHdoZW4gZXZlcnl0aGluZydzIHJlYWR5OlxyXG4gICAgICAgICAgICBQcm9taXNlLmFsbDx2b2lkPihsb2FkaW5nUHJvbWlzZXMpLnRoZW4odGhpcy5yZW5kZXIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGRpc3BsYXkgYWpheCBwcm9ncmVzczpcclxuICAgIHByaXZhdGUgb25Mb2FkUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKiBwcm9ncmVzcyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBwYXNzIGxvYWRpbmcgcHJvZ3Jlc3MgZnJvbSBwYWdlIHRvIHByZWxvYWRlcjpcclxuICAgIHByaXZhdGUgb25QYWdlUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMubG9hZGVyLnNldCgwLjUgKyAwLjUgKiBwcm9ncmVzcyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBkZWFsIHdpdGggbmV3bHkgYWRkZWQgZWxlbWVudHNcclxuICAgIHByaXZhdGUgb25QYWdlQXBwZW5kID0gKGVsOiBKUXVlcnkpOiB2b2lkID0+IHtcclxuICAgICAgICBQdXNoU3RhdGVzLmJpbmQoZWxbMF0pO1xyXG4gICAgICAgIC8vIFdpZGdldHMuYmluZChlbFswXSk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gY2FsbGVkIGFmdGVyIG5ldyBodG1sIGlzIGxvYWRlZFxyXG4gICAgLy8gYW5kIG9sZCBjb250ZW50IGlzIGFuaW1hdGVkIG91dDpcclxuICAgIHByaXZhdGUgcmVuZGVyID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLm9mZigpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNjcm9sbC5kZXN0cm95KCk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUuZ3JvdXBFbmQoKTtcclxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5yZW5kZXIoKTtcclxuICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSgkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JykpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGRldGVjdEhvbWVQYWdlKCk6IHZvaWQge1xyXG4gICAgICAgICRwYWdlSGVhZGVyID8gJGJvZHkuYWRkQ2xhc3MoJ2lzLWhvbWUtcGFnZScpIDogbnVsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gd2hlbiBjdXJyZW50IHBhZ2UgaXMgbG9hZGVkOlxyXG4gICAgcHJpdmF0ZSBvblBhZ2VMb2FkZWQgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgLy8gJGJvZHkucmVtb3ZlQ2xhc3MoJ2lzLW5vdC1yZWFkeScpO1xyXG4gICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuaGlkZSgpO1xyXG4gICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkYm9keSwgMCwgMCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5hbmltYXRlSW4oKTtcclxuICAgICAgICAkcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKSA6IG51bGw7XHJcbiAgICAgICAgdGhpcy5kZXRlY3RIb21lUGFnZSgpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuc2V0TmF2YmFyVmlzaWJpbGl0eSgpO1xyXG4gICAgICAgIC8vIHRoaXMuY29va2llcy50cnlUb1Nob3coKTtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9QYXRoKHRydWUpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsLmxvYWQoKTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5zdGFydCgpO1xyXG4gICAgICAgICQoJ2FydGljbGUnKS5wYXJlbnQoKS5hZGRDbGFzcygnaXMtbG9hZGVkJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBydW4gbmV3IFBhZ2Ugb2JqZWN0XHJcbiAgICAvLyAoZm91bmQgYnkgYGRhdGEtcGFnZWAgYXR0cmlidXRlKVxyXG4gICAgLy8gYmluZCBpdCBhbmQgc3RvcmUgYXMgY3VycmVudFBhZ2U6XHJcbiAgICBwcml2YXRlIHNldEN1cnJlbnRQYWdlKCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIGxldCAkcGFnZUVsOiBKUXVlcnkgPSAkKCdbZGF0YS1wYWdlXScpLFxyXG4gICAgICAgICAgICBwYWdlTmFtZTogc3RyaW5nID0gJHBhZ2VFbC5kYXRhKCdwYWdlJykgfHwgJ1BhZ2UnLFxyXG4gICAgICAgICAgICBwYWdlT3B0aW9uczogT2JqZWN0ID0gJHBhZ2VFbC5kYXRhKCdvcHRpb25zJyk7XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCRwYWdlRWwsIHBhZ2VOYW1lKTtcclxuXHJcbiAgICAgICAgLy8gcGFnZSBub3QgZm91bmQ6XHJcbiAgICAgICAgaWYgKHBhZ2VOYW1lID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBcIiVzXCIgaW4gUGFnZXMhJywgcGFnZU5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHBhZ2VOYW1lID0gJ1BhZ2UnO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbW9yZSB0aGFuIG9uZSBkYXRhLXBhZ2U6XHJcbiAgICAgICAgaWYgKCRwYWdlRWwubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oJ09ubHkgb25lIFtkYXRhLXBhZ2VdIGVsZW1lbnQsIHBsZWFzZSEnKTtcclxuXHJcbiAgICAgICAgLy8gcGFnZSBub3QgZGVmaW5lZCBpbiBodG1sOlxyXG4gICAgICAgIH0gZWxzZSBpZiAoJHBhZ2VFbC5sZW5ndGggPT09IDApIHtcclxuICAgICAgICAgICAgJHBhZ2VFbCA9ICQoJCgnI21haW4nKS5maW5kKCdhcnRpY2xlJylbMF0gfHwgJCgnI21haW4nKS5jaGlsZHJlbigpLmZpcnN0KClbMF0pO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICAvLyBjcmVhdGUgUGFnZSBvYmplY3Q6XHJcbiAgICAgICAgbGV0IHBhZ2U6IFBhZ2UgPSBuZXcgcGFnZXNbcGFnZU5hbWVdKCRwYWdlRWwsIHBhZ2VPcHRpb25zKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gcGFnZTtcclxuXHJcbiAgICAgICAgLy8gYmluZCBldmVudHM6XHJcbiAgICAgICAgQVBJLmJpbmQoKTtcclxuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHRoaXMub25QYWdlUHJvZ3Jlc3MpO1xyXG4gICAgICAgIHBhZ2Uub24oUGFnZUV2ZW50cy5DSEFOR0UsIHRoaXMub25QYWdlQXBwZW5kKTtcclxuXHJcbiAgICAgICAgdGhpcy5vblJlc2l6ZSgpO1xyXG5cclxuICAgICAgICByZXR1cm4gcGFnZS5wcmVsb2FkKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XHJcbiAgICBzaXRlID0gbmV3IFNpdGUoKTtcclxuICAgIHNpdGUuaW5pdCgpO1xyXG59KTtcclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL3N0YXRzLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvbW9kZXJuaXpyLmQudHNcIiAvPlxyXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IGJyZWFrcG9pbnQgfSBmcm9tICcuL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVVSUQoKTogc3RyaW5nIHtcclxuICAgIHJldHVybiAnJyArIChuZXcgRGF0ZSgpKS5nZXRUaW1lKCkgKyBNYXRoLmZsb29yKCgxICsgTWF0aC5yYW5kb20oKSkgKiAweDEwMDAwKS50b1N0cmluZygxNikuc3Vic3RyaW5nKDEpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IGtleXMgPSB7XHJcbiAgICBlbnRlcjogMTMsXHJcbiAgICBlc2M6IDI3LFxyXG4gICAgc3BhY2U6IDMyLFxyXG4gICAgbGVmdDogMzcsXHJcbiAgICB1cDogMzgsXHJcbiAgICByaWdodDogMzksXHJcbiAgICBkb3duOiA0MCxcclxuICAgIHBhZ2VVcDogMzMsXHJcbiAgICBwYWdlRG93bjogMzQsXHJcbiAgICBlbmQ6IDM1LFxyXG4gICAgaG9tZTogMzYsXHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmFtcyh1cmwpOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSB7XHJcbiAgICB2YXIgcGFyYW1zID0ge307XHJcbiAgICB2YXIgcGFyc2VyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgcGFyc2VyLmhyZWYgPSB1cmw7XHJcbiAgICB2YXIgcXVlcnkgPSBwYXJzZXIuc2VhcmNoLnN1YnN0cmluZygxKTtcclxuICAgIHZhciB2YXJzID0gcXVlcnkuc3BsaXQoJyYnKTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHZhciBwYWlyID0gdmFyc1tpXS5zcGxpdCgnPScpO1xyXG4gICAgICAgIHBhcmFtc1twYWlyWzBdXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcclxuICAgIH1cclxuICAgIHJldHVybiBwYXJhbXM7XHJcbn07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRlc3RBdXRvcGxheSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxib29sZWFuPigocmVzb2x2ZSkgPT4ge1xyXG4gICAgICAgIGlmICh0eXBlb2YgTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBNb2Rlcm5penIub24oJ3ZpZGVvYXV0b3BsYXknLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKE1vZGVybml6ci52aWRlb2F1dG9wbGF5KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VUb1RpbWUoc2VjOiBudW1iZXIpOiBzdHJpbmcge1xyXG5cclxuICAgIGNvbnN0IHRvdGFsU2VjID0gcGFyc2VJbnQoJycgKyBzZWMsIDEwKTtcclxuICAgIGNvbnN0IGhvdXJzID0gcGFyc2VJbnQoJycgKyB0b3RhbFNlYyAvIDM2MDAsIDEwKSAlIDI0O1xyXG4gICAgY29uc3QgbWludXRlcyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyA2MCwgMTApICUgNjA7XHJcbiAgICBjb25zdCBzZWNvbmRzID0gdG90YWxTZWMgJSA2MDtcclxuICAgIGNvbnN0IGhyc0Rpc3BsYXkgPSAoaG91cnMgPCAxMCA/ICcwJyArIGhvdXJzIDogaG91cnMpICsgJzonO1xyXG5cclxuICAgIHJldHVybiAoaG91cnMgPiAwID8gaHJzRGlzcGxheSA6ICcnKSArIChtaW51dGVzIDwgMTAgPyAnMCcgKyBtaW51dGVzIDogbWludXRlcykgKyAnOicgKyAoc2Vjb25kcyA8IDEwID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzdGF0cygpOiBTdGF0cyB7XHJcblxyXG4gICAgY29uc3Qgc3RhdHMgPSBuZXcgU3RhdHMoKTtcclxuXHJcbiAgICBzdGF0cy5zaG93UGFuZWwoIDAgKTsgLy8gMDogZnBzLCAxOiBtcywgMjogbWIsIDMrOiBjdXN0b21cclxuICAgICQoc3RhdHMuZG9tKS5jc3Moeydwb2ludGVyLWV2ZW50cyc6ICdub25lJywgJ3RvcCc6IDExMH0pO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggc3RhdHMuZG9tICk7XHJcblxyXG4gICAgZnVuY3Rpb24gYW5pbWF0ZSgpOiB2b2lkIHtcclxuICAgICAgICBzdGF0cy5iZWdpbigpO1xyXG4gICAgICAgIC8vIG1vbml0b3JlZCBjb2RlIGdvZXMgaGVyZVxyXG4gICAgICAgIHN0YXRzLmVuZCgpO1xyXG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xyXG4gICAgfVxyXG5cclxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xyXG5cclxuICAgIHJldHVybiBzdGF0cztcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gdGltZUZvcm1hdCh0aW1lOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgbGV0IG1pbnV0ZXMgPSBNYXRoLmZsb29yKHRpbWUgLyA2MCkudG9TdHJpbmcoKTtcclxuICAgIG1pbnV0ZXMgPSAocGFyc2VJbnQobWludXRlcywgMTApID49IDEwKSA/IG1pbnV0ZXMgOiAnMCcgKyBtaW51dGVzO1xyXG4gICAgbGV0IHNlY29uZHMgPSBNYXRoLmZsb29yKHRpbWUgJSA2MCkudG9TdHJpbmcoKTtcclxuICAgIHNlY29uZHMgPSAocGFyc2VJbnQoc2Vjb25kcywgMTApID49IDEwKSA/IHNlY29uZHMgOiAnMCcgKyBzZWNvbmRzO1xyXG5cclxuICAgIHJldHVybiBtaW51dGVzLnRvU3RyaW5nKCkgKyAnOicgKyBzZWNvbmRzLnRvU3RyaW5nKCk7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUltYWdlU291cmNlcygpOiB2b2lkIHtcclxuICAgIGlmIChicm93c2VyLmllKSB7XHJcbiAgICAgICAgJCgnW2RhdGEtaWVzcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKSk7XHJcbiAgICAgICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAkKCdbZGF0YS1zcmNdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKSk7XHJcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmMnKTtcclxuICAgIH0pO1xyXG5cclxuICAgICQoJ1tkYXRhLXNyY3NldF0nKS5lYWNoKChpLCBpbWcpOiB2b2lkID0+IHtcclxuICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmNzZXQnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLXNyY3NldCcpKTtcclxuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5cclxuLy8gZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWRJbWFnZXMoaW1hZ2VzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZFtdPiB7XHJcbi8vICAgICByZXR1cm4gUHJvbWlzZS5hbGwoaW1hZ2VzLm1hcCgoaW1hZ2UpOiBQcm9taXNlPHZvaWQ+ID0+IHtcclxuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4vLyAgICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcclxuLy8gICAgICAgICAgICAgaW1nLm9ubG9hZCA9ICgpID0+IHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSAoKSA9PiByZXNvbHZlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmFib3J0ID0gKCkgPT4gcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICBpbWcuc3JjID0gaW1hZ2U7XHJcbi8vICAgICAgICAgICAgIGlmIChpbWcuY29tcGxldGUgJiYgJChpbWcpLmhlaWdodCgpID4gMCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgfSkpO1xyXG4vLyB9XHJcblxyXG5cclxuXHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlczogSlF1ZXJ5KTogUHJvbWlzZTx2b2lkW10+IHtcclxuLy8gICAgIGxldCBpc0Jhc2U2NDogYm9vbGVhbjtcclxuLy8gICAgIGNvbnN0IGltYWdlczogc3RyaW5nW10gPSAkaW1hZ2VzLnRvQXJyYXkoKVxyXG4vLyAgICAgICAgIC5tYXAoKGltZzogSFRNTEltYWdlRWxlbWVudCk6IHN0cmluZyA9PiB7XHJcbi8vICAgICAgICAgICAgIGxldCBpbWFnZVNvdXJjZSA9IGltZy5jdXJyZW50U3JjIHx8IGltZy5zcmM7XHJcbi8vICAgICAgICAgICAgIGlmIChpbWFnZVNvdXJjZS5pbmRleE9mKCdkYXRhOmltYWdlL3BuZztiYXNlNjQsJykgPj0gMCkgeyBpc0Jhc2U2NCA9IHRydWU7IH1cclxuLy8gICAgICAgICAgICAgcmV0dXJuIGltYWdlU291cmNlO1xyXG4vLyAgICAgICAgIH0pO1xyXG5cclxuLy8gICAgIC8vIGNvbnNvbGUubG9nKGltYWdlcyk7XHJcblxyXG4vLyAgICAgaWYgKCFpc0Jhc2U2NCkge1xyXG4vLyAgICAgICAgIHJldHVybiBwcmVsb2FkSW1hZ2VzKGltYWdlcyk7XHJcbi8vICAgICB9IGVsc2Uge1xyXG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcclxuLy8gICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbi8vICAgICAgICAgICAgICAgICBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlcykudGhlbigoKSA9PiB7XHJcbi8vICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICAgICAgfSk7XHJcbi8vICAgICAgICAgICAgIH0sIDIwMCk7XHJcbi8vICAgICAgICAgfSk7XHJcbi8vICAgICB9XHJcbi8vIH1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc2h1ZmZsZShhKTogQXJyYXk8YW55PiB7XHJcbiAgICBsZXQgaiwgeCwgaTtcclxuICAgIGZvciAoaSA9IGEubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xyXG4gICAgICAgIGogPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoaSArIDEpKTtcclxuICAgICAgICB4ID0gYVtpXTtcclxuICAgICAgICBhW2ldID0gYVtqXTtcclxuICAgICAgICBhW2pdID0geDtcclxuICAgIH1cclxuICAgIHJldHVybiBhO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFJvb3RWYXJzKCk6IHZvaWQge1xyXG4gICAgY29uc3QgaGVhZGVySGVpZ2h0ID0gYnJlYWtwb2ludC5kZXNrdG9wID8gJCgnI25hdmJhcicpLmhlaWdodCgpIDogMDtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcHAtaGVpZ2h0JywgYCR7d2luZG93LmlubmVySGVpZ2h0IC0gaGVhZGVySGVpZ2h0fXB4YCk7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sLTI1JywgYCR7JCgnLmNvbC1wYXR0ZXJuLTI1Jykud2lkdGgoKX1weGApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC02NicsIGAkeyQoJy5jb2wtNjYnKS53aWR0aCgpfXB4YCk7XHJcbiAgICBsZXQgbWFyZyA9ICFicmVha3BvaW50LmRlc2t0b3AgPyA1MCA6IDEyMDtcclxuICAgICQoJy5hc2lkZScpLmNzcygnaGVpZ2h0JywgJHdpbmRvdy5oZWlnaHQoKSArIG1hcmcpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZW5hYmxlQm9keVNjcm9sbGluZyhzVDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAkKCdib2R5JykucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnc2Nyb2xsaW5nLWRpc2FibGUnKTtcclxuICAgIHdpbmRvdy5zY3JvbGxUbygwLCBzVCk7XHJcbn1cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZGlzYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xyXG4gICAgbGV0IHBvc2l0aW9uID0gYnJvd3Nlci5pZSA/ICdhYnNvbHV0ZScgOiAnZml4ZWQnO1xyXG4gICAgbGV0IHRvcCA9IGJyb3dzZXIuaWUgPyAnJyA6IC1zVCArICdweCc7XHJcbiAgICAkKCdib2R5JykuYWRkQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XHJcbiAgICAkKCdib2R5JykuY3NzKHtcclxuICAgICAgICAvLyAncG9zaXRpb24nOiBwb3NpdGlvbixcclxuICAgICAgICAvLyAndG9wJzogdG9wLFxyXG4gICAgICAgIC8vICdib3R0b20nOiAnMCcsXHJcbiAgICAgICAgJ292ZXJmbG93JzogJ2hpZGRlbicsXHJcbiAgICAgICAgJ3dpbGwtY2hhbmdlJzogJ3RvcCcsXHJcbiAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxyXG4gICAgICAgICd0b3VjaC1hY3Rpb24nOiAnbm9uZScsXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY29uc3QgdHJhbnNsYXRpb25zID0ge1xyXG4gICAgJ2ludmFsaWQtZW1haWwnOiB7XHJcbiAgICAgICAgJ2VuJzogJ0ludmFsaWQgZW1haWwgYWRkcmVzcyBmb3JtYXQnLFxyXG4gICAgICAgICdwbCc6ICdOaWVwb3ByYXdueSBmb3JtYXQgYWRyZXN1IGUtbWFpbCcsXHJcbiAgICB9LFxyXG4gICAgJ3JlcXVpcmVkLWZpZWxkJzoge1xyXG4gICAgICAgICdlbic6ICdSZXF1aXJlZCBmaWVsZCcsXHJcbiAgICAgICAgJ3BsJzogJ1BvbGUgb2Jvd2nEhXprb3dlJyxcclxuICAgIH0sXHJcbiAgICAnaW52YWxpZC16aXAnOiB7XHJcbiAgICAgICAgJ2VuJzogJ0VudGVyIHppcC1jb2RlIGluIGZpdmUgZGlnaXRzIGZvcm1hdCcsXHJcbiAgICAgICAgJ3BsJzogJ1dwaXN6IGtvZCBwb2N6dG93eSB3IGZvcm1hY2llIFhYLVhYWCcsXHJcbiAgICB9LFxyXG59O1xyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRib2R5LCAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi4vUHVzaFN0YXRlcyc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFzaWRlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogQXNpZGU7XHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgJGhhbWJ1cmdlckxpbmU6IEpRdWVyeTtcclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZUFuaW1hdGlvbigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKEFzaWRlLmluc3RhbmNlLmlzT3Blbikge1xyXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRpdGVtLCAwLjI1LCB7IGR1cmF0aW9uOiAwLjI1LCBzdGFnZ2VyOiAtMC4xLCBvcGFjaXR5OiAwLCB4OiAyMCwgZGVsYXk6IDAuMn0pXHJcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGhhbWJ1cmdlckxpbmUsIDAuMywgeyBkdXJhdGlvbjogMC4zLCBzY2FsZVk6IDB9KTtcclxuICAgICAgICAgICAgQXNpZGUuaW5zdGFuY2UuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaXRlbSwgMC41LCB7IGR1cmF0aW9uOiAwLjUsIHN0YWdnZXI6IDAuMDUsIG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjJ9KVxyXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRoYW1idXJnZXJMaW5lLCAwLjMsIHsgZHVyYXRpb246IDAuMywgc2NhbGVZOiAxLCBkZWxheTogMC41fSk7XHJcbiAgICAgICAgICAgIEFzaWRlLmluc3RhbmNlLmlzT3BlbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XHJcbiAgICAgICAgdGhpcy4kaGFtYnVyZ2VyTGluZSA9ICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5maW5kKCdpJyk7XHJcblxyXG4gICAgICAgIEFzaWRlLmluc3RhbmNlID0gdGhpcztcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcubWVudScpLm9uKCdjbGljay5tZW51JywgdGhpcy5oaWRlTWVudSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlTWVudSA9IChlKSA9PiB7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5hc2lkZVRvZ2dsZShlKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcclxuXHJcbmludGVyZmFjZSBJQ2hhcnRTZXR0aW5ncyB7XHJcbiAgICBpZDogbnVtYmVyO1xyXG4gICAgeFBlcmNlbnQ6IG51bWJlcjtcclxuICAgIHlQb2ludHM6IEFycmF5PG51bWJlcj47XHJcbiAgICBjb2xvcjogc3RyaW5nO1xyXG4gICAgeVB4OiBBcnJheTxudW1iZXI+O1xyXG4gICAgZmlsbD86IGJvb2xlYW47XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBsYWJlbFk/OiBudW1iZXI7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDaGFydCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSAkdGFiOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICR3cmFwcGVyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XHJcbiAgICBwcml2YXRlIGN0eDogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XHJcbiAgICAgICAgdG9wOiA1LFxyXG4gICAgICAgIGxlZnQ6IDI1LFxyXG4gICAgICAgIHJpZ2h0OiAxMTAsXHJcbiAgICAgICAgYm90dG9tOiA0OVxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdyYXBoOiBhbnkgPSB7XHJcbiAgICAgICAgdG9wOiAwLFxyXG4gICAgICAgIGxlZnQ6IDAsXHJcbiAgICAgICAgcmlnaHQ6IDAsXHJcbiAgICAgICAgYm90dG9tOiAwLFxyXG4gICAgICAgIGhlaWdodDogMCxcclxuICAgICAgICB3aWR0aDogMCxcclxuICAgIH07XHJcblxyXG4gICAgcHJpdmF0ZSBjb2xvcnM6IGFueSA9IHtcclxuICAgICAgICBncmF5OiAncmdiYSg5Nyw5Nyw5NywwLjUpJyxcclxuICAgICAgICBvcmFuZ2U6ICcjZmM4YzU5JyxcclxuICAgICAgICBtaW50OiAnIzRmZGJjNScsXHJcbiAgICAgICAgYmx1ZTogJyM1ODc3Y2MnLFxyXG4gICAgICAgIHBpbms6ICcjQjYwRTYzJyxcclxuICAgICAgICB3aGl0ZTogJyNmZmYnLFxyXG4gICAgICAgIGJlaWdlOiAnI2ZkZDQ5ZScsXHJcbiAgICAgICAgY2lubmFiYXI6ICcjZTc1MDQwJyxcclxuICAgICAgICBzZWE6ICcjMjZiYmUzJyxcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGdyYXBoc0RhdGE6IEFycmF5PElDaGFydFNldHRpbmdzPiA9IFtdO1xyXG5cclxuICAgIHByaXZhdGUgYmdMaW5lczogQXJyYXk8e3NjYWxlWDogbnVtYmVyfT47XHJcbiAgICBwcml2YXRlIGN1cnJlbnRDaGFydHM6IG51bWJlcltdO1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kd3JhcHBlciA9IHRoaXMudmlldy5maW5kKCcuanMtd3JhcHBlcicpO1xyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1jaGFydC10YWJdJyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+dGhpcy52aWV3LmZpbmQoJ2NhbnZhcycpWzBdO1xyXG4gICAgICAgIHRoaXMuY3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgdGhpcy5iZ0xpbmVzID0gQXJyYXkuYXBwbHkoMCwgeyBsZW5ndGg6IDkgfSkubWFwKCgpID0+IHsgcmV0dXJuIHsgc2NhbGVYOiAwIH07IH0pO1xyXG5cclxuICAgICAgICBjb25zdCBwYXJhbXNDaGFydHMgPSBVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkuY2hhcnRzO1xyXG4gICAgICAgIHRoaXMuY3VycmVudENoYXJ0cyA9IHBhcmFtc0NoYXJ0cyA/IHBhcmFtc0NoYXJ0cy5zcGxpdCgnLCcpLm1hcCgoaSkgPT4gcGFyc2VJbnQoaSwgMTApKSA6IFswLCAzLCA0XTtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmN1cnJlbnRDaGFydHMpO1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZURhdGFPYmplY3QoKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVzaXplKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy4kd3JhcHBlci53aWR0aCgpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzLmhlaWdodCA9IHRoaXMuJHdyYXBwZXIuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuZ3JhcGggPSB7XHJcbiAgICAgICAgICAgIHRvcDogdGhpcy5tYXJnaW4udG9wLFxyXG4gICAgICAgICAgICBsZWZ0OiB0aGlzLm1hcmdpbi5sZWZ0LFxyXG4gICAgICAgICAgICByaWdodDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCxcclxuICAgICAgICAgICAgYm90dG9tOiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20sXHJcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4udG9wIC0gdGhpcy5tYXJnaW4uYm90dG9tLFxyXG4gICAgICAgICAgICB3aWR0aDogdGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5sZWZ0IC0gdGhpcy5tYXJnaW4ucmlnaHQsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5zYXZlQ2FjaGUoKTtcclxuICAgICAgICB0aGlzLmRyYXcoKTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZW5hYmxlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuc2hvd0JnKCk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdGhpcy50b2dnbGVDaGFydChpLCB0aGlzLmN1cnJlbnRDaGFydHMuaW5kZXhPZihpKSA+PSAwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGlzYWJsZSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmhpZGVCZyh0cnVlKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuJHRhYi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNoYXJ0KGksIGZhbHNlLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZURhdGFPYmplY3QoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhID0gdGhpcy4kdGFiLnRvQXJyYXkoKS5tYXAoKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xyXG4gICAgICAgICAgICByZXR1cm4gPElDaGFydFNldHRpbmdzPntcclxuICAgICAgICAgICAgICAgIGlkOiBpLFxyXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXHJcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiAkZWwuZGF0YSgncG9pbnRzJyksXHJcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiB0aGlzLmdldFJhbmRvbVBvaW50cyhNYXRoLnJhbmRvbSgpICogMTAgKyA3LCBNYXRoLnJhbmRvbSgpICogMzAgKyAxOCwgNjAsIDAuMyksXHJcbiAgICAgICAgICAgICAgICB5UG9pbnRzOiB0aGlzLmdldFBvaW50cyhpKSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiB0aGlzLmNvbG9yc1skZWwuZGF0YSgnY29sb3InKV0sXHJcbiAgICAgICAgICAgICAgICBmaWxsOiBpID09PSAwID8gdHJ1ZSA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc2hvd246IGZhbHNlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JhcGhzRGF0YS5tYXAoKGRhdGEpID0+IGRhdGEueVBvaW50cykpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZ2V0UG9pbnRzKGkpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgcmV0dXJuIFtbMTQsIDEwLCAxMiwgMTMsIDE0LCA5ICwgMTIsIDE3LCAxNiwgMTEsIDEzLCAxOSwgMTAsIDksIDgsIDE1LCAxNywgMTUsIDIyLCAyNSwgMjEsIDIwLCAxOSwgMjEsIDIwLCAxOSwgMjQsIDI4LCAyMSwgMjcsIDE4LCAyMywgMzMsIDMxLCAxOCwgMjUsIDM2LCAyNCwgMzEsIDMzLCAyMSwgMzYsIDM0LCAzMCwgMjYsIDI0LCAzNSwgMjcsIDMwLCAxOCwgMjAsIDMwLCAyNiwgMjgsIDMzLCAyNSwgMzksIDI4LCAxNywgMzVdLCBbMSwgMiwgOCwgNywgNiwgMywgOCwgNSwgNSwgNCwgOCwgNywgNywgMTEsIDEwLCA4LCA3LCA5LCA4LCA2LCA4LCAxMiwgOCwgMTQsIDExLCA4LCA4LCAxMSwgNywgMTMsIDEzLCAxNiwgMjAsIDEwLCAxMCwgMTMsIDE0LCAyMCwgMTYsIDExLCAxNywgMTYsIDE4LCAyMSwgOCwgMjAsIDE1LCAxNSwgMTYsIDE1LCAxOSwgMjAsIDExLCAyMCwgMjAsIDEyLCAxNywgMjAsIDIzLCAxNl0sIFsxMywgMTEsIDYsIDksIDksIDgsIDksIDExLCA3LCAxNCwgMTIsIDgsIDEwLCAxNiwgOSwgMjAsIDE5LCAxMiwgMTIsIDE1LCAxOCwgMTUsIDE0LCAyMiwgMTksIDIwLCAyMCwgMTcsIDI0LCAyMywgMjcsIDIwLCAyMCwgMjEsIDIxLCAyNSwgMjAsIDI3LCAyMiwgMjQsIDI0LCAyNiwgMjMsIDI1LCAyNiwgMjEsIDI5LCAyNiwgMjcsIDI2LCAyNSwgMjAsIDE1LCAyNSwgMjIsIDI2LCAyMCwgMjMsIDMzLCAyOF0sIFsyLCA1LCAxMCwgOSwgMTgsIDksIDEwLCAxMiwgMjAsIDE5LCAxMywgOSwgMTUsIDExLCAyMSwgMTksIDIzLCAyMywgMjYsIDIzLCAyMywgMjMsIDI1LCAyNSwgMjYsIDI2LCAzMCwgMjIsIDI1LCAzMywgMzgsIDE2LCAzMiwgMjcsIDI3LCAzNSwgMjgsIDI4LCAzNSwgMzQsIDM2LCAyNSwgMjcsIDI1LCA0NSwgMzcsIDMxLCAzNiwgMzcsIDM2LCAyOCwgMzgsIDQyLCA0MiwgNDQsIDQzLCA0MSwgMzQsIDMxLCAzNl0sIFs3LCAxMCwgMTAsIDYsIDUsIDEzLCAxNywgMTMsIDEwLCAxMSwgMTQsIDE3LCAxNiwgMTksIDIyLCAyMCwgMjUsIDE3LCAyNCwgMTMsIDI1LCAyMCwgMjYsIDI0LCAyNiwgMTUsIDIzLCAyNCwgMzAsIDMwLCAyOSwgMzEsIDMxLCAyMSwgMzIsIDMxLCAyNSwgMzgsIDM1LCAyOCwgNDAsIDMyLCAzNywgMzEsIDM2LCA0MCwgMzUsIDM3LCAyMywgMzYsIDM3LCA0MCwgNDAsIDQxLCAxNywgMjMsIDQwLCAzNCwgNDAsIDQwXSwgWzYsIDYsIDIsIDEyLCAxMCwgMTMsIDEyLCA0LCAxMiwgMTEsIDEzLCAxNiwgMTQsIDE0LCAxNCwgMTQsIDE0LCAxNywgMTUsIDE2LCAxNiwgMTIsIDE4LCAxNSwgMjIsIDE2LCAxOSwgMTgsIDIxLCAyMSwgMjUsIDE1LCAyNiwgMTcsIDI3LCAyNywgMjEsIDEyLCAyNCwgMTUsIDE5LCAyOSwgMTgsIDI0LCAyNSwgMTgsIDI4LCAzMiwgMjUsIDI4LCAyNywgMjgsIDMxLCAyNSwgMjcsIDM1LCAyNCwgMjcsIDE1LCAyOF0sIFs0LCA1LCAxMCwgMTMsIDE1LCAxNywgNywgMTcsIDEyLCAxMiwgMTcsIDEyLCAxMiwgMTEsIDIyLCAyMSwgMTksIDIwLCAyMSwgMjYsIDIyLCAxOSwgMjEsIDI0LCAyNSwgMTIsIDI4LCAyNywgMjgsIDI3LCAzMSwgMzEsIDE1LCAzMCwgMjYsIDE5LCAyOSwgMjksIDMzLCAzMywgMTcsIDMwLCAzMCwgMzMsIDI3LCAzNCwgMzMsIDE3LCAzOSwgMjEsIDM1LCAzMywgMzMsIDIxLCAzNSwgMzAsIDM5LCAzMSwgMzUsIDI5XV1baV07XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGdldFJhbmRvbVBvaW50cyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGFtb3VudDogbnVtYmVyLCBjYXN0OiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5LmFwcGx5KG51bGwsIHsgbGVuZ3RoOiBhbW91bnQgfSlcclxuICAgICAgICAgICAgLm1hcCgocCwgaSwgYSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBtYXggLSBtaW47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjID0gaSAvIGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocGVyYyAqIE1hdGguUEkgLyAyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJuZCA9IDAuNCAqIChNYXRoLnJhbmRvbSgpIDwgY2FzdCA/IC0wLjUgKyBNYXRoLnJhbmRvbSgpIDogMSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5SbmQgPSAoTWF0aC5yYW5kb20oKSAqIChwZXJjIDwgMC41ID8gMC45IDogMSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKG1pbiAqIG1pblJuZCkgKyAoTWF0aC5yYW5kb20oKSAqIHJhbmdlICogMC4yKSArIChzaW4gKiByYW5nZSAqICgwLjYgKyBybmQpKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhLmZvckVhY2goKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgZGF0YS55UHggPSB0aGlzLmNhbGNZUHgoZGF0YS55UG9pbnRzKTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhLmxhYmVsWSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5sYWJlbFkgPSBkYXRhLnlQeFswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vbkNsaWNrVGFiKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja1RhYiA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy50b2dnbGVDaGFydCgkKGUuY3VycmVudFRhcmdldCkuaW5kZXgoKSk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50Q2hhcnRzID0gdGhpcy5ncmFwaHNEYXRhLm1hcCgoZGF0YSwgaSkgPT4gZGF0YS5zaG93biA/IGkgOiBudWxsKS5maWx0ZXIoKGluZGV4KSA9PiBpbmRleCAhPT0gbnVsbCk7XHJcbiAgICAgICAgY29uc29sZS5sb2codGhpcy5jdXJyZW50Q2hhcnRzKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2hvd0JnKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMsIHsgYmc6IHRydWUgfSk7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLmJnTGluZXMsIHtcclxuICAgICAgICAgICAgc2NhbGVYOiAxLFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMixcclxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMycsXHJcbiAgICAgICAgICAgIHN0YWdnZXI6IC0wLjEsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGhpZGVCZyhxdWljaz86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLCB7IGJnOiB0cnVlIH0pO1xyXG4gICAgICAgIGdzYXAudG8odGhpcy5iZ0xpbmVzLCB7XHJcbiAgICAgICAgICAgIHNjYWxlWDogMCxcclxuICAgICAgICAgICAgZHVyYXRpb246ICFxdWljayA/IDIgOiAwLFxyXG4gICAgICAgICAgICBlYXNlOiAncG93ZXIzJyxcclxuICAgICAgICAgICAgc3RhZ2dlcjogIXF1aWNrID8gLTAuMSA6IDAsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZUNoYXJ0KGluZGV4OiBudW1iZXIsIHNob3c/OiBib29sZWFuLCBxdWljaz86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBkYXRhID0gdGhpcy5ncmFwaHNEYXRhW2luZGV4XTtcclxuICAgICAgICBpZiAodHlwZW9mIHNob3cgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHNob3cgPSAhZGF0YS5zaG93bjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdzYXAudG8oZGF0YSwge1xyXG4gICAgICAgICAgICBkdXJhdGlvbjogIXF1aWNrID8gMy4yIDogMCxcclxuICAgICAgICAgICAgeFBlcmNlbnQ6IHNob3cgPyAxIDogMCxcclxuICAgICAgICAgICAgbGFiZWxZOiBkYXRhLnlQeFtzaG93ID8gZGF0YS55UHgubGVuZ3RoIC0gMSA6IDBdLFxyXG4gICAgICAgICAgICByb3VuZFByb3BzOiAnbGFiZWxZJyxcclxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMy5pbk91dCcsXHJcbiAgICAgICAgICAgIG9uVXBkYXRlOiB0aGlzLmRyYXcsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYi5lcShpbmRleCkudG9nZ2xlQ2xhc3MoJ2lzLW9uLWNoYXJ0Jywgc2hvdyk7XHJcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhW2luZGV4XS5zaG93biA9IHNob3c7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGRyYXcgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5jdHguY2xlYXJSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuZHJhd0JnKCk7XHJcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhLmZvckVhY2goKGdyYXBoRGF0YSkgPT4gdGhpcy5kcmF3R3JhcGgoZ3JhcGhEYXRhKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGRyYXdCZygpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgLy8gZHJhdyBYIGF4aXNcclxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xyXG5cclxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xyXG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLm1hcmdpbi5sZWZ0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20pO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LCB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi5ib3R0b20pO1xyXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAvLyB0aGlzLmN0eC5tb3ZlVG8odGhpcy5tYXJnaW4ubGVmdCwgdGhpcy5tYXJnaW4udG9wKTtcclxuICAgICAgICAvLyB0aGlzLmN0eC5saW5lVG8odGhpcy5jYW52YXMud2lkdGggLSB0aGlzLm1hcmdpbi5yaWdodCwgdGhpcy5tYXJnaW4udG9wKTtcclxuICAgICAgICAvLyB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgY29uc3QgaGVscGVyc0xpbmUgPSA4O1xyXG4gICAgICAgIGNvbnN0IHRleHRUcmFuc2Zvcm0gPSA1O1xyXG4gICAgICAgIGNvbnN0IHN0ZXAgPSA1O1xyXG4gICAgICAgIGxldCB2YWw7XHJcbiAgICAgICAgY29uc3QgeWVhcnMgPSBbMjAxNSwgMjAxNiwgMjAxNywgMjAxOCwgMjAxOSwgMjAyMCwgMjAyMV07XHJcblxyXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMuZ3JheTtcclxuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XHJcbiAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMuYmx1ZTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gaGVscGVyc0xpbmU7IGkrKykge1xyXG4gICAgICAgICAgICB2YWwgPSA1MCAtIHN0ZXAgKiBpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IHRoaXMuYmdMaW5lc1tpXS5zY2FsZVg7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgdmFsICsgJycsIDAsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3AgKyB0ZXh0VHJhbnNmb3JtKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgubGVmdCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLmxlZnQgKyB0aGlzLmdyYXBoLndpZHRoICogdGhpcy5iZ0xpbmVzW2ldLnNjYWxlWCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeWVhcnMubGVuZ3RoOyBqKyspIHtcclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcclxuICAgICAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB5ZWFyc1tqXSArICcnLCB0aGlzLmdyYXBoLndpZHRoIC8geWVhcnMubGVuZ3RoICogaiArIHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRleHRUcmFuc2Zvcm0gKiAyKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3R3JhcGggPSAoZGF0YTogSUNoYXJ0U2V0dGluZ3MpOiB2b2lkID0+IHtcclxuICAgICAgICBsZXQgbGFzdFZhbDogbnVtYmVyO1xyXG4gICAgICAgIGxldCBsYXN0WTogbnVtYmVyO1xyXG5cclxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IGRhdGEuY29sb3I7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMztcclxuICAgICAgICB0aGlzLmN0eC5saW5lQ2FwID0gJ3JvdW5kJztcclxuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XHJcbiAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xyXG5cclxuICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICBjb25zdCBjb2xXaWR0aCA9IHRoaXMuZ3JhcGgud2lkdGggLyAoZGF0YS55UHgubGVuZ3RoIC0gMSk7XHJcbiAgICAgICAgY29uc3QgbWF4WCA9IChkYXRhLnhQZXJjZW50ICogY29sV2lkdGggKiBkYXRhLnlQeC5sZW5ndGgpICsgdGhpcy5ncmFwaC5sZWZ0O1xyXG5cclxuICAgICAgICBkYXRhLnlQeC5mb3JFYWNoKCAoeSwgaSwgYSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB4ID0gY29sV2lkdGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0O1xyXG4gICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oeCwgeSk7XHJcbiAgICAgICAgICAgICAgICBsYXN0WSA9IHk7XHJcbiAgICAgICAgICAgICAgICBsYXN0VmFsID0gZGF0YS55UG9pbnRzW2ldO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgIHkgPSB0aGlzLmdldEludGVyUG9pbnRzWShtYXhYLCBbeCAtIGNvbFdpZHRoLCBhW2kgLSAxXV0sIFt4LCB5XSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgeSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcclxuXHJcbiAgICAgICAgLy8gZmlsbDpcclxuICAgICAgICBpZiAoZGF0YS5maWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBsYXN0WCA9IHRoaXMubWFyZ2luLmxlZnQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGRhdGEuY29sb3I7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMC40O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIGRhdGEueVB4LmZvckVhY2goICh5LCBpLCBhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gY29sV2lkdGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0O1xyXG4gICAgICAgICAgICAgICAgaWYgKHggPD0gbWF4WCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh4LCB5KTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IHg7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obWF4WCwgdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pKTtcclxuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IG1heFg7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obGFzdFgsIHRoaXMuZ3JhcGguYm90dG9tKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgubGVmdCwgdGhpcy5ncmFwaC5ib3R0b20pO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbGFiZWw6XHJcbiAgICAgICAgaWYgKGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgICAgIC8vIGxpbmU6XHJcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcclxuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgucmlnaHQsIGRhdGEubGFiZWxZKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyNCwgZGF0YS5sYWJlbFkpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHBlbnRhZ29uOlxyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5yaWdodCArIDIwLCBkYXRhLmxhYmVsWSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgNDAsIGRhdGEubGFiZWxZIC0gMTIpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgLSAxMik7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgMTEwLCBkYXRhLmxhYmVsWSArIDEyKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyA0MCwgZGF0YS5sYWJlbFkgKyAxMik7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgICAgICAgICAvLyB0ZXh0OlxyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxNHB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsVGV4dChsYXN0VmFsICsgJycsIHRoaXMuZ3JhcGgucmlnaHQgKyA0NCwgZGF0YS5sYWJlbFkgKyA0ICk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vLyBIRUxQRVJTXHJcblxyXG4gICAgcHJpdmF0ZSBsYXJnZXN0WVZhbChkYXRhOiBBcnJheTxudW1iZXI+KTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3Q7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNhbGNZUHgoZGF0YSk6IEFycmF5PG51bWJlcj4ge1xyXG4gICAgICAgIGNvbnN0IGxhcmdlc3QgPSB0aGlzLmxhcmdlc3RZVmFsKGRhdGEpO1xyXG4gICAgICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gTWF0aC5yb3VuZCgodGhpcy5ncmFwaC5oZWlnaHQgLSBkYXRhW2ldIC8gbGFyZ2VzdCAqIHRoaXMuZ3JhcGguaGVpZ2h0KSArIHRoaXMuZ3JhcGgudG9wKTtcclxuICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBnZXRJbnRlclBvaW50c1koeDogbnVtYmVyLCBwb2ludEE6IG51bWJlcltdLCBwb2ludEI6IG51bWJlcltdKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBbeDEsIHkxXSA9IHBvaW50QTtcclxuICAgICAgICBjb25zdCBbeDIsIHkyXSA9IHBvaW50QjtcclxuICAgICAgICByZXR1cm4gKHkyIC0geTEpICogKHggLSB4MSkgLyAoeDIgLSB4MSkgKyB5MTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XHJcbmltcG9ydCB7IElCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RXZlbnRzIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnY2hhbmdlJztcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIEhhbmRsZXIge1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz86IE9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgaWYgKCF2aWV3WzBdKSB7IGNvbnNvbGUud2FybignY29tcG9uZW50IGJ1aWx0IHdpdGhvdXQgdmlldycpOyB9XHJcbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCB0aGlzKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBwcmVsb2FkSW1hZ2VzKCk6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBhbmltYXRlSW4oaW5kZXg/OiBudW1iZXIsIGRlbGF5PzogbnVtYmVyKTogdm9pZCB7IH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBhbmltYXRlT3V0KCk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgd2FudCB0byBhbmltYXRlIGNvbXBvbmVudCxcclxuICAgICAgICAvLyBqdXN0IHJldHVybiBlbXB0eSBQcm9taXNlOlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcblxyXG4gICAgICAgIC8vIGlmIHlvdSBuZWVkIGFuaW1hdGlvbjpcclxuICAgICAgICAvLyByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIC8vICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgIC8vICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAvLyAgICAgICAgIH0sXHJcbiAgICAgICAgLy8gICAgICAgICBkdXJhdGlvbjogMC4zLFxyXG4gICAgICAgIC8vICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAvLyAgICAgfSk7XHJcbiAgICAgICAgLy8gfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHsgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHsgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4geyB9O1xyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCBudWxsKTtcclxuICAgICAgICB0aGlzLnZpZXcub2ZmKCk7XHJcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlICR0b2dnbGU6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGJvZHk6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgaXNUb2dnbGVkOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBib2R5SGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRvZ2dsZSA9IHRoaXMudmlldy5maW5kKCcuanMtYnV0dG9uLXRvZ2dsZScpO1xyXG4gICAgICAgIHRoaXMuJGJvZHkgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWRhc2hib2FyZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbFN0YXRlKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiR0b2dnbGUub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlUGFuZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlUGFuZWwgPSAoZSkgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5pc1RvZ2dsZWQpIHtcclxuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJ2F1dG8nLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcclxuICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYm9keS5hZGRDbGFzcygnaXMtdG9nZ2xlZCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kYm9keS5yZW1vdmVDbGFzcygnaXMtdG9nZ2xlZCcpO1xyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnMCcsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNUb2dnbGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgaW5pdGlhbFN0YXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAuc2V0KHRoaXMuJGJvZHksIHsgaGVpZ2h0OiAnMCd9KTtcclxuICAgIH1cclxuICAgIFxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vRmlsdGVycyc7XHJcblxyXG5leHBvcnQgY2xhc3MgRHJvcGRvd24gZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuXHJcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZhbHVlXScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZCcsIHRoaXMuJHNlbGVjdGVkLnRleHQoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZpZXcub2ZmKCcuc2VsZWN0Jykub24oJ2NsaWNrLnNlbGVjdCcsIHRoaXMudG9nZ2xlKTtcclxuICAgICAgICAkZG9jLm9mZignLmRyb3Bkb3duJykub24oJ2NsaWNrLmRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcclxuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpICYmICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd2YWx1ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQtY291bnRyeScsIGN1cnJlbnQpO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudCk7XHJcbiAgICAgICAgfSwgMzAwKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEZpbHRlcnMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IEZpbHRlcnM7XHJcblxyXG4gICAgcHJpdmF0ZSAkY2xlYXI6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHBhbmVsOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRpdGVtU2VjdG9yOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRpdGVtVGltZTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkdGltZWxpbmVJdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRhbGxTZWN0b3JzOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRwaWNrZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHNlbGVjdGVkQ291bnRyeTogSlF1ZXJ5O1xyXG5cclxuICAgIHByaXZhdGUgZmlsdGVyczogQXJyYXk8c3RyaW5nPiA9IFtdO1xyXG4gICAgcHJpdmF0ZSBpc0FsbENoZWNrZWQ6IGJvb2xlYW47XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2hvd1BpY2tlZEZpbHRlcnMoY291bnRyeT86IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIGxldCBwaWNrZWRTZWN0b3JzID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XHJcbiAgICAgICAgbGV0IHBpY2tlZFRpbWUgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xyXG4gICAgICAgIGxldCBwaWNrZWRDb3VudHJ5ID0gY291bnRyeSA/IGNvdW50cnkgOiBGaWx0ZXJzLmluc3RhbmNlLiRzZWxlY3RlZENvdW50cnkudGV4dCgpO1xyXG5cclxuXHJcbiAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmZpbmQoJ3NwYW4nKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgaWYgKHBpY2tlZFNlY3RvcnMpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGlja2VkU2VjdG9ycyk7XHJcblxyXG4gICAgICAgICAgICBpZiAocGlja2VkU2VjdG9ycy5sZW5ndGggPT09IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnYWFsJywgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycyk7XHJcbiAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycy50ZXh0KCkgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcGlja2VkU2VjdG9ycy5lYWNoKChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyAkKGVsKS50ZXh0KCkgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChwaWNrZWRDb3VudHJ5KSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBpY2tlZENvdW50cnkpO1xyXG4gICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgcGlja2VkQ291bnRyeSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocGlja2VkVGltZSkge1xyXG4gICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgcGlja2VkVGltZS5kYXRhKCdpdGVtLWxhYmVsJykgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kY2xlYXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsZWFyJyk7XHJcbiAgICAgICAgdGhpcy4kcGFuZWwgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXBhbmVsJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3RvciA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lID0gdGhpcy52aWV3LmZpbmQoJy5qcy10aW1lJyk7XHJcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXRpbWVdJyk7XHJcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycyA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbS1hbGwnKTtcclxuICAgICAgICB0aGlzLiRwaWNrZWQgPSAkKCcuanMtcGlja2VkLWZpbHRlcicpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkQ291bnRyeSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RdJyk7XHJcblxyXG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UgPSB0aGlzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IsIEZpbHRlcnMuaW5zdGFuY2Uudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKS5kYXRhKCdzZWxlY3RlZCcpKTtcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLiRjbGVhci5jc3MoJ2hlaWdodCcsIHRoaXMuJHBhbmVsLm91dGVySGVpZ2h0KCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3Iub2ZmKCcuc2VjdG9yJykub24oJ2NsaWNrLnNlY3RvcicsIHRoaXMudG9nZ2xlU2VjdG9yKTtcclxuICAgICAgICB0aGlzLiRpdGVtVGltZS5vZmYoJy50aW1lJykub24oJ2NsaWNrLnRpbWUnLCB0aGlzLnRvZ2dsZVRpbWUpO1xyXG4gICAgICAgIHRoaXMuJGNsZWFyLm9mZignLmNsZWFyJykub24oJ2NsaWNrLmNsZWFyJywgdGhpcy5jbGVhckFycmF5KTtcclxuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLm9mZignLmFsbCcpLm9uKCdjbGljay5hbGwnLCB0aGlzLm1hcmtBbGxTZWN0b3JzKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBtYXJrQWxsU2VjdG9ycyA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zdCB0aW1lQ2hlY2tlZCA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuY2xlYXJBcnJheSgpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IuZWFjaCgoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSgkKGVsKSwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICh0aW1lQ2hlY2tlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KHRpbWVDaGVja2VkLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZSh0aW1lQ2hlY2tlZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgY2xlYXJBcnJheSA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmZpbHRlcnMgPSBbXTtcclxuICAgICAgICB0aGlzLiRpdGVtVGltZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XHJcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZVNlY3RvciA9IChlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuXHJcbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGxDaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlVGltZSA9IChlKSA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XHJcblxyXG4gICAgICAgIGlmIChjdXJyZW50Lmhhc0NsYXNzKCdpcy1hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVQcmV2ID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGlmIChhY3RpdmVQcmV2KSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoYWN0aXZlUHJldiwgdGhpcy5maWx0ZXJzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKGN1cnJlbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG1hcmtUaW1lbGluZShlbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdqcy10aW1lJykpIHtcclxuICAgICAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgY29uc3QgdGltZWxpbmVkb3QgPSB0aGlzLiR0aW1lbGluZUl0ZW0uZmlsdGVyKCdbZGF0YS10aW1lPScgKyBlbC5kYXRhKCdpdGVtJykgKyAnXScpO1xyXG4gICAgICAgICAgICB0aW1lbGluZWRvdC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHVubWFya1RpbWVsaW5lKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSByZW1vdmVFbGVtZW50RnJvbUFycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5maWx0ZXJzLmluZGV4T2YoJGVsLmRhdGEoJ2l0ZW0nKSk7XHJcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcclxuICAgICAgICAgICAgYXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBhZGRFbGVtZW50VG9BcnJheSgkZWw6IEpRdWVyeSwgYXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcclxuICAgICAgICBhcnJheS5wdXNoKCRlbC5kYXRhKCdpdGVtJykpO1xyXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5cclxuaW50ZXJmYWNlIElEYXRhU3RhdCB7XHJcbiAgICBzZWN0b3I6IHN0cmluZztcclxuICAgIHZhbHVlOiBudW1iZXI7XHJcbiAgICBjb2xvcjogc3RyaW5nO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUdyaWRJdGVtUG9zaXRpb24ge1xyXG4gICAgY29sdW1uX3N0YXJ0OiBudW1iZXI7XHJcbiAgICBjb2x1bW5fZW5kOiBudW1iZXI7XHJcbiAgICByb3dfc3RhcnQ6IG51bWJlcjtcclxuICAgIHJvd19lbmQ6IG51bWJlcjtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIE1hc29ucnkgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgZGF0YTogQXJyYXk8SURhdGFTdGF0PiA9IFtdO1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBkYXRhQXJyYXk6IEFycmF5PGFueT4gPSBbXTtcclxuICAgIHByaXZhdGUgYXJlYTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBpdGVtTWFyZ2luOiBudW1iZXIgPSAzO1xyXG4gICAgcHJpdmF0ZSBncmlkUm93czogbnVtYmVyID0gMjA7XHJcbiAgICBwcml2YXRlIGdyaWRDb2xzOiBudW1iZXIgPSAyMDtcclxuICAgIHByaXZhdGUgZ3JpZENlbGxzOiBudW1iZXIgPSB0aGlzLmdyaWRDb2xzICogdGhpcy5ncmlkUm93cztcclxuICAgIHByaXZhdGUgY2VsbHNCYWxhbmNlOiBudW1iZXIgPSB0aGlzLmdyaWRDZWxscztcclxuICAgIHByaXZhdGUgZ3JpZENlbGw6IGFueSA9IHtcclxuICAgICAgICB3aWR0aDogdGhpcy52aWV3LndpZHRoKCkgLyB0aGlzLmdyaWRDb2xzLFxyXG4gICAgICAgIGhlaWdodDogdGhpcy52aWV3LmhlaWdodCgpIC8gdGhpcy5ncmlkUm93cyxcclxuICAgIH07XHJcbiAgICBwcml2YXRlIG1pbkNlbGxXaWR0aDogbnVtYmVyID0gMztcclxuICAgIHByaXZhdGUgbWluQ2VsbEhlaWdodDogbnVtYmVyID0gMztcclxuXHJcbiAgICBwcml2YXRlIGl0ZW1Qb3NpdGlvbmluZzogQXJyYXk8SUdyaWRJdGVtUG9zaXRpb24+ID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLW1hc29ucnktdGlsZScpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW0uZWFjaCggKGksIGVsKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGFJdGVtID0gPElEYXRhU3RhdD57XHJcbiAgICAgICAgICAgICAgICBzZWN0b3I6ICQoZWwpLmRhdGEoJ3RpbGUnKSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiAkKGVsKS5kYXRhKCd2YWx1ZScpLFxyXG4gICAgICAgICAgICAgICAgY29sb3I6ICQoZWwpLmRhdGEoJ2NvbG9yJyksXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGFJdGVtKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmFyZWEgPSAodGhpcy52aWV3LndpZHRoKCkgLSB0aGlzLml0ZW1NYXJnaW4gKiAzKSAqIHRoaXMudmlldy5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kYXRhLCB0aGlzLmFyZWEsICdjZWxsIHdpZHRoJywgdGhpcy5ncmlkQ2VsbC53aWR0aCwgJ2NlbGwgaGVpZ2h0JywgdGhpcy5ncmlkQ2VsbC5oZWlnaHQpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgICAgIFxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gdGhpcy5zZXRUaWxlU2l6ZSgpO1xyXG4gICAgICAgIHRoaXMuZ2V0QXJyRnJvbU9iamVjdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZ2V0QXJyRnJvbU9iamVjdCgpOiBhbnkge1xyXG4gICAgICAgIHRoaXMuZGF0YUFycmF5ID0gT2JqZWN0LmVudHJpZXModGhpcy5kYXRhKS5zb3J0KChhLCBiKSA9PiBhWzBdLmxvY2FsZUNvbXBhcmUoYlswXSkpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGFBcnJheSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGF0YUFycmF5LmZvckVhY2goIChlbCwgaSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhlbFsxXS52YWx1ZSwgaSwgJ2VsJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZWxbMV0udmFsdWU7XHJcbiAgICAgICAgICAgIGNvbnN0IHNlY3RvciA9IGVsWzFdLnNlY3RvcjtcclxuICAgICAgICAgICAgY29uc3QgY29sb3IgPSBlbFsxXS5jb2xvcjtcclxuICAgICAgICAgICAgY29uc3QgaW5kZXggPSBpO1xyXG5cclxuICAgICAgICAgICAgLy8gdGhpcy5zZXRUaWxlU2l6ZShzZWN0b3IsIHZhbHVlLCBjb2xvciwgaW5kZXgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2V0VGlsZVNpemUoc2VjdG9yOiBzdHJpbmcsIHZhbHVlOiBudW1iZXIsIGNvbG9yOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXRpbGU9JyArIHNlY3RvciArICddJyk7XHJcbiAgICAgICAgbGV0IGFyZWEsIGgsIHcsIHQsIGwsIGNvbHVtbl9zdGFydCwgY29sdW1uX2VuZCwgcm93X3N0YXJ0LCByb3dfZW5kLCBpdGVtLCBhcmVhR3JpZDtcclxuICAgICAgICBcclxuICAgICAgICBhcmVhID0gdGhpcy5hcmVhICogKHZhbHVlIC8gMTAwKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coYXJlYSwgJzphcmVhJywgdGhpcy5pdGVtUG9zaXRpb25pbmcsdGhpcy5pdGVtUG9zaXRpb25pbmcubGVuZ3RoID4gMCwgJ2NoZWNrIGlmIHNvbWUgaXRlbSBvbiBhcnJheScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChpbmRleCA9PT0gMCkge1xyXG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQgPSAxO1xyXG4gICAgICAgICAgICByb3dfc3RhcnQgPSAxO1xyXG4gICAgICAgICAgICByb3dfZW5kID0gdGhpcy5ncmlkUm93cztcclxuICAgICAgICAgICAgY29sdW1uX2VuZCA9IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLmhlaWdodCAqIHJvd19lbmQpIC8gdGhpcy5ncmlkQ2VsbC53aWR0aCk7XHJcbiAgICAgICAgICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpO1xyXG4gICAgICAgICAgICBhcmVhR3JpZCA9IGFyZWFHcmlkICUgMiA9PT0gMCA/IGFyZWFHcmlkIDogYXJlYUdyaWQgLSAxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gaWYgKGluZGV4ID4gMCkge1xyXG4gICAgICAgIC8vICAgICBjb2x1bW5fc3RhcnQgPSB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0xXS5jb2x1bW5fZW5kICsgMSA8IHRoaXMuZ3JpZENvbHMgLSB0aGlzLm1pbkNlbGxXaWR0aCA/IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDogdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMl0uY29sdW1uX2VuZCArIDE7XHJcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpID49IDYgPyBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgOiA2O1xyXG4gICAgICAgIC8vICAgICBhcmVhR3JpZCA9IGFyZWFHcmlkICUgMiA9PT0gMCA/IGFyZWFHcmlkIDogYXJlYUdyaWQgLSAxO1xyXG4gICAgICAgIC8vICAgICBjb2x1bW5fZW5kID0gYXJlYUdyaWQgLyB0aGlzLm1pbkNlbGxXaWR0aCBcclxuXHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKGFyZWFHcmlkLCAnYW1vdW50IG9mIGNlbGxzJyk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpdGVtID0gPElHcmlkSXRlbVBvc2l0aW9uPntcclxuICAgICAgICAgICAgY29sdW1uX3N0YXJ0OiBjb2x1bW5fc3RhcnQsXHJcbiAgICAgICAgICAgIGNvbHVtbl9lbmQ6IGNvbHVtbl9lbmQsXHJcbiAgICAgICAgICAgIHJvd19zdGFydDogcm93X3N0YXJ0LFxyXG4gICAgICAgICAgICByb3dfZW5kOiByb3dfZW5kLFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGN1cnJlbnQuY3NzKHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXHJcbiAgICAgICAgICAgICdncmlkLWNvbHVtbi1zdGFydCc6IGNvbHVtbl9zdGFydCxcclxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLWVuZCc6IGNvbHVtbl9lbmQsXHJcbiAgICAgICAgICAgICdncmlkLXJvdy1zdGFydCc6IHJvd19zdGFydCxcclxuICAgICAgICAgICAgJ2dyaWQtcm93LWVuZCc6ICdzcGFuJyArIHJvd19lbmQsXHJcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogY29sb3IsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbVBvc2l0aW9uaW5nLnB1c2goaXRlbSk7XHJcbiAgICAgICAgdGhpcy5jZWxsc0JhbGFuY2UgPSB0aGlzLmNlbGxzQmFsYW5jZSAtIGFyZWFHcmlkO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuY2VsbHNCYWxhbmNlLCAnOmZyZWUgY2VsbHMnKTtcclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbn1cclxuIiwiaW1wb3J0IHtDb21wb25lbnR9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuXHJcblxyXG5cclxuaW50ZXJmYWNlIElQYXJhbGxheFNldHRpbmdzIHtcclxuICAgIGVsZW1lbnRzOiBBcnJheTxzdHJpbmc+O1xyXG4gICAgbW92ZVg6IEFycmF5PG51bWJlcj47XHJcbiAgICBtb3ZlWTogQXJyYXk8bnVtYmVyPjtcclxufVxyXG5cclxuXHJcbmludGVyZmFjZSBJUGFyYWxsYXhFbGVtZW50RGF0YSB7XHJcbiAgICAkZWw6IEpRdWVyeTtcclxuICAgIG1vdmVYOiBudW1iZXI7XHJcbiAgICBtb3ZlWTogbnVtYmVyO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBQYXJhbGxheCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSBtb3ZlWDogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSBtb3ZlWTogbnVtYmVyO1xyXG4gICAgcHJpdmF0ZSB0aW1lOiBudW1iZXIgPSAyO1xyXG4gICAgcHJpdmF0ZSBzZXR0aW5nczogSVBhcmFsbGF4U2V0dGluZ3M7XHJcbiAgICBwcml2YXRlIGl0ZW1zOiBJUGFyYWxsYXhFbGVtZW50RGF0YVtdO1xyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSBvcHRpb25zO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlVmFsdWVBcnJheSgpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcuZGF0YSgnUGFyYWxsYXgnLCB0aGlzKTtcclxuXHJcblxyXG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3ApIHtcclxuICAgICAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5vbignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVZhbHVlQXJyYXkoKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3Qgc2VsZWN0b3JzID0gKHRoaXMuc2V0dGluZ3MuZWxlbWVudHMpLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xyXG4gICAgICAgIGNvbnN0IG1vdmVYID0gKHRoaXMuc2V0dGluZ3MubW92ZVgpLm1hcChOdW1iZXIpO1xyXG4gICAgICAgIGNvbnN0IG1vdmVZID0gKHRoaXMuc2V0dGluZ3MubW92ZVkpLm1hcChOdW1iZXIpO1xyXG5cclxuICAgICAgICB0aGlzLml0ZW1zID0gc2VsZWN0b3JzLm1hcCgoc2VsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9IHRoaXMudmlldy5maW5kKCcuJyArIHNlbCk7XHJcbiAgICAgICAgICAgIGlmICghJGVsWzBdKSB7IGNvbnNvbGUud2FybihgVGhlcmUgaXMgbm8gLiR7c2VsfSBlbGVtZW50IHRvIHVzZSBpbiBwYXJhbGxheGApOyB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIG1vdmVYOiBtb3ZlWFtpXSxcclxuICAgICAgICAgICAgICAgIG1vdmVZOiBtb3ZlWVtpXSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KS5maWx0ZXIoKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuICEhaXRlbS4kZWxbMF07XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uTW91c2VNb3ZlID0gKGV2ZW50KTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5tb3ZlWCA9ICggZXZlbnQuY2xpZW50WCAvIHdpbmRvdy5pbm5lcldpZHRoKSAtIDAuNTtcclxuICAgICAgICB0aGlzLm1vdmVZID0gKCBldmVudC5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAtIDAuNTtcclxuXHJcbiAgICAgICAgdGhpcy5hbmltYXRlKC10aGlzLm1vdmVYLCAtdGhpcy5tb3ZlWSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFuaW1hdGUobW92ZVgsIG1vdmVZKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCF0aGlzLml0ZW1zKSB7IHJldHVybjsgfVxyXG4gICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xyXG4gICAgICAgICAgICBnc2FwLnRvKGl0ZW0uJGVsLCB7XHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGhpcy50aW1lLFxyXG4gICAgICAgICAgICAgICAgeDogbW92ZVggKiBpdGVtLm1vdmVYLFxyXG4gICAgICAgICAgICAgICAgeTogbW92ZVkgKiBpdGVtLm1vdmVZLFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMicsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUmFuZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIFxyXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHByaXZhdGUgJHNlbGVjdGVkOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRyYWRpbzogSlF1ZXJ5O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiR0cmlnZ2VyID0gdGhpcy52aWV3LmZpbmQoJy5qcy10cmlnZ2VyJyk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJyk7XHJcbiAgICAgICAgdGhpcy4kcmFkaW8gPSB0aGlzLnZpZXcuZmluZCgnaW5wdXRbdHlwZT1yYWRpb10nKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiR0cmlnZ2VyLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZSk7XHJcbiAgICAgICAgJGRvYy5vZmYoJy5zbWFsbGRyb3Bkb3duJykub24oJ2NsaWNrLnNtYWxsZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuJHJhZGlvLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcclxuICAgICAgICBjb25zb2xlLmxvZyh0aGlzLmlzT3BlbiwgJ29wZW4/Jyk7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgICAgICB0aGlzLmlzT3BlbiA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSB8fCAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgaWYgKCQoZS50YXJnZXQpLmNsb3Nlc3QodGhpcy52aWV3KS5sZW5ndGggPD0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuYXR0cigndmFsdWUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XHJcblxyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCBjdXJyZW50KTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBjbGFzcyBTbGlkZXIgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBpbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgJG5hdjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkY2FwdGlvbnM6IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG4gICAgICAgIHRoaXMuJG5hdiA9IHRoaXMudmlldy5maW5kKCcuanMtbmF2Jyk7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNhcHRpb24nKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRuYXYub2ZmKCcubmF2Jykub24oJ2NsaWNrLm5hdicsIHRoaXMuc3dpdGNoU2xpZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3dpdGNoU2xpZGUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IGN1cnJlbnQuaW5kZXgoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJG5hdiwgMCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGl0ZW0sIDEwMCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGNhcHRpb25zLCAxMDAwKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVFbGVtZW50KGVsOiBKUXVlcnksIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xyXG4gICAgICAgICAgICBlbC5lcSh0aGlzLmluZGV4KS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkd3JhcDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkY3VycmVudDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSB0YWJUb1Nob3c6IG51bWJlcjsgLy8gZm9yIGFzeW5jIHN3aXRjaFxyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12aWV3XScpO1xyXG4gICAgICAgIHRoaXMuJHdyYXAgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRhYnMtd3JhcHBlcicpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcocGFyc2VJbnQoVXRpbHMuZ2V0UGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpLnRhYiwgMTApIHx8IDApO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vblRhYkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25UYWJDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBjb25zdCBpbmRleCA9IGN1cnJlbnQuZGF0YSgndGFiJyk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVWaWV3KGluZGV4KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlVmlldyhpbmRleDogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBpbmRleDtcclxuICAgICAgICB0aGlzLiR0YWIucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuJHRhYi5maWx0ZXIoJ1tkYXRhLXRhYj0nICsgaW5kZXggKyAnXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmhpZGVDdXJyZW50KCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW5DYWNoZWRBbmltKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvdyh0aGlzLnRhYlRvU2hvdyk7XHJcbiAgICAgICAgICAgIHRoaXMudGFiVG9TaG93ID0gbnVsbDtcclxuICAgICAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGhpZGVDdXJyZW50KCk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy4kY3VycmVudCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGN1cnJlbnQsIHtcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC4zLFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbGVhbkNhY2hlZEFuaW0oKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgYW5pbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS11bmNhY2hlXScpO1xyXG4gICAgICAgIGNvbnN0IHVuY2FjaGVzID0gdGhpcy52aWV3LmZpbmQoJy51bmNhY2hlZCcpO1xyXG4gICAgICAgIHVuY2FjaGVzLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XHJcbiAgICAgICAgYW5pbS5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY29tcG9uZW50XScpLmVhY2goKGksIGVsKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXAgPSAkKGVsKS5kYXRhKCdjb21wJykgYXMgQ29tcG9uZW50O1xyXG4gICAgICAgICAgICBpZiAoY29tcCAmJiB0eXBlb2YgY29tcFsnZGlzYWJsZSddICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29tcFsnZGlzYWJsZSddKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNob3coaW5kZXg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQgPSB0aGlzLiRpdGVtLmZpbHRlcignW2RhdGEtdmlldz0nICsgaW5kZXggKyAnXScpO1xyXG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgZ3NhcC5mcm9tVG8odGhpcy4kY3VycmVudCwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjcsXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuZmluZCgnW2RhdGEtY29tcG9uZW50XScpLmVhY2goKGksIGVsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gJChlbCkuZGF0YSgnY29tcCcpIGFzIENvbXBvbmVudDtcclxuICAgICAgICAgICAgICAgIGlmIChjb21wICYmIHR5cGVvZiBjb21wWydlbmFibGUnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wWydlbmFibGUnXSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgVG9vbHRpcCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW47XHJcbiAgICBwcml2YXRlICRidXR0b246IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGNsb3NlOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJ1dHRvbiA9IHRoaXMudmlldy5maW5kKCcuanMtdG9nZ2xlJyk7XHJcbiAgICAgICAgdGhpcy4kY2xvc2UgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykubGVuZ3RoID4gMCA/IHRoaXMudmlldy5maW5kKCcuanMtY2xvc2UnKSA6IG51bGw7XHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkJ1dHRvbkNsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgIHRoaXMudmlld1xyXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9uJykub24oJ21vdXNlZW50ZXIubW91c2VvbicsIHRoaXMub25Nb3VzZUVudGVyKVxyXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9mZicpLm9uKCdtb3VzZWxlYXZlLm1vdXNlb2ZmJywgdGhpcy5vbk1vdXNlTGVhdmUpO1xyXG5cclxuICAgICAgICAkZG9jLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy4kY2xvc2UpIHtcclxuICAgICAgICAgICAgdGhpcy4kY2xvc2Uub24oJ2NsaWNrLnRvb2x0aXAnLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTW91c2VFbnRlciA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlTGVhdmUgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkJ1dHRvbkNsaWNrSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIC8vIGlmICghYnJlYWtwb2ludC5kZXNrdG9wKSB7XHJcbiAgICAgICAgLy8gICAgIGFsZXJ0KCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwICkge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb3BlbigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgfSwgMjUwKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmFkZENsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAzMDAwKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY2xvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgQ29tcG9uZW50LCBDb21wb25lbnRFdmVudHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XHJcbi8vIGltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4uL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xyXG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi4vQ2xhc3Nlcyc7XHJcbmltcG9ydCB7ICRhcnRpY2xlLCAkYm9keSwgJG1haW4gfSBmcm9tICcuLi9TaXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYWdlRXZlbnRzIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUFJPR1JFU1M6IHN0cmluZyA9ICdwcm9ncmVzcyc7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENPTVBMRVRFOiBzdHJpbmcgPSAnY29tcGxldGUnO1xyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdhcHBlbmQnO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFnZSBleHRlbmRzIEhhbmRsZXIge1xyXG5cclxuICAgIHB1YmxpYyBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XHJcbiAgICAvLyBwdWJsaWMgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcclxuICAgIHByaXZhdGUgbG9hZGVyOiBKUXVlcnlEZWZlcnJlZDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkPjtcclxuXHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIG9wdGlvbnM/KSB7XHJcblxyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKHRoaXMudmlldy5wYXJlbnQoKS5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmVsb2FkIG5lY2Vzc2FyeSBhc3NldHM6XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBsb2FkaW5nIGltYWdlcyBwcm9taXNlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBwcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQodGhpcy52aWV3LmZpbmQoJy5wcmVsb2FkJykudG9BcnJheSgpLCA8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZE9wdGlvbnM+eyBiYWNrZ3JvdW5kOiB0cnVlIH0pO1xyXG4gICAgICAgIGxldCBpbWFnZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBpbWFnZXMgPSBpbWFnZXMuY29uY2F0KGNvbXBvbmVudC5wcmVsb2FkSW1hZ2VzKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCB1cmwgb2YgaW1hZ2VzKSB7XHJcbiAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQodXJsLCBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyID0gaWwuanFEZWZlcnJlZDtcclxuICAgICAgICAgICAgdGhpcy5sb2FkZXIucHJvZ3Jlc3MoKGluc3RhbmNlOiBJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkLCBpbWFnZTogSW1hZ2VzTG9hZGVkLkxvYWRpbmdJbWFnZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXIgPSBpbnN0YW5jZS5wcm9ncmVzc2VkQ291bnQgLyBpbnN0YW5jZS5pbWFnZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHByb2dyZXNzKTtcclxuICAgICAgICAgICAgfSkuYWx3YXlzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNPTVBMRVRFKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoZWNrIGlmIGFueSBDb21wb25lbnQgY2FuIGJlIGNoYW5nZWQgYWZ0ZXIgb25TdGF0ZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyB0cnVlIHdoZW4gb25lIG9mIHRoZSBjb21wb25lbnRzIHRha2VzIGFjdGlvbiBpbiBvblN0YXRlIGZ1bmN0aW9uIGNhbGxcclxuICAgICAqL1xyXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VkOiBib29sZWFuID0gISFmYWxzZTtcclxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENoYW5nZWQ6IGJvb2xlYW4gPSBjb21wb25lbnQub25TdGF0ZSgpO1xyXG4gICAgICAgICAgICBpZiAoIWNoYW5nZWQgJiYgISFjb21wb25lbnRDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNoYW5nZWQ7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhZ2UgZW50ZXJpbmcgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVsYXkgYW5pbWF0aW9uIGRlbGF5XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhbmltYXRlSW4oZGVsYXk/OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xyXG4gICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwodGhpcy5jb21wb25lbnRzLCAnYW5pbWF0ZUluJyk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbXBvbmVudHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzW2ldLmFuaW1hdGVJbihpLCBkZWxheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXHJcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhZ2UgZXhpdCBhbmltYXRpb25cclxuICAgICAqIChjYWxsZWQgYWZ0ZXIgbmV3IGNvbnRlbnQgaXMgbG9hZGVkIGFuZCBiZWZvcmUgaXMgcmVuZGVyZWQpXHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBhbmltYXRpb24gcHJvbWlzZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xyXG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiB0aGUgcGFnZTpcclxuICAgICAgICAkbWFpbi5yZW1vdmVDbGFzcygnaXMtbG9hZGVkJyk7XHJcbiAgICAgICAgZ3NhcC5zZXQoYmcsIHsgb3BhY2l0eTogMCwgZGlzcGxheTogJ25vbmUnfSk7XHJcbiAgICAgICAgbGV0IHBhZ2VBbmltYXRpb25Qcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuNCxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGJvZHkucmVtb3ZlQXR0cignY2xhc3MnKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9ucyBvZiBhbGwgY29tcG9uZW50czpcclxuICAgICAgICBsZXQgY29tcG9uZW50QW5pbWF0aW9uczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSB0aGlzLmNvbXBvbmVudHMubWFwKChvYmopOiBQcm9taXNlPHZvaWQ+ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIDxQcm9taXNlPHZvaWQ+Pm9iai5hbmltYXRlT3V0KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBvbmUgcHJvbWlzZSB3YWl0aW5nIGZvciBhbGwgYW5pbWF0aW9uczpcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgbGV0IGFsbFByb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IGNvbXBvbmVudEFuaW1hdGlvbnMuY29uY2F0KHBhZ2VBbmltYXRpb25Qcm9taXNlKTtcclxuXHJcbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGFsbFByb21pc2VzKS50aGVuKChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmlzaWJpbGl0eSB3aWRnZXQgaGFuZGxlciwgZmlyZXMgd2hlbiB1c2VyIGV4aXRzIGJyb3dzZXIgdGFiXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9mZicpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9uJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gd2R0ICAgICAgICB3aW5kb3cgd2lkdGhcclxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBoZ3QgICAgICAgIHdpbmRvdyBoZWlnaHRcclxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBicmVha3BvaW50IElCcmVha3BvaW50IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdkdCwgaGd0LCBicmVha3BvaW50LCBicENoYW5nZWQpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbGVhbnVwIHdoZW4gY2xvc2luZyBQYWdlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgnZGVzdHJveScpO1xyXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xyXG4gICAgICAgIC8vIHRoaXMuYmFja2dyb3VuZHMgPSB7fTtcclxuXHJcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3KTtcclxuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xyXG5cclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcm90ZWN0ZWQgYnVpbGRDb21wb25lbnRzKCRjb21wb25lbnRzOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gJGNvbXBvbmVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgJGNvbXBvbmVudDogSlF1ZXJ5ID0gJGNvbXBvbmVudHMuZXEoaSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWU6IHN0cmluZyA9ICRjb21wb25lbnQuZGF0YSgnY29tcG9uZW50Jyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zOiBPYmplY3QgPSAkY29tcG9uZW50LmRhdGEoJ29wdGlvbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IENvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKCRjb21wb25lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5vbihDb21wb25lbnRFdmVudHMuQ0hBTkdFLCB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIGAlc2AgY29tcG9uZW50IScsIGNvbXBvbmVudE5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Db21wb25lbnRDaGFuZ2UgPSAoZWwpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyhlbC5maWx0ZXIoJ1tkYXRhLWNvbXBvbmVudF0nKS5hZGQoZWwuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKSk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuQ0hBTkdFLCBlbCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIHNob3J0IGNhbGxcclxuICAgIHByaXZhdGUgY2FsbEFsbChmbjogc3RyaW5nLCAuLi5hcmdzKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudFtmbl0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudFtmbl0uYXBwbHkoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufVxyXG4iXX0=
