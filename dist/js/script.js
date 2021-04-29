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
const Search_1 = require("./components/Search");
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
    Aside: Aside_1.Aside,
    Parallax: Parallax_1.Parallax,
    Search: Search_1.Search,
};
exports.pages = {
    Page: Page_1.Page
};

},{"./components/Aside":13,"./components/Chart":14,"./components/Dashboard":16,"./components/Dropdown":17,"./components/Filters":18,"./components/Masonry":19,"./components/Parallax":20,"./components/Range":21,"./components/Search":22,"./components/Slider":23,"./components/Stats":24,"./components/Tooltip":25,"./pages/Page":26}],5:[function(require,module,exports){
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

},{"./Api":1,"./Breakpoint":2,"./Browser":3,"./Classes":4,"./Copy":5,"./Loader":7,"./PushStates":8,"./Scroll":9,"./Share":10,"./Utils":12,"./pages/Page":26}],12:[function(require,module,exports){
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
        Aside.instance.isOpen = false;
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
                gsap.to(this.$body, { duration: 0.5, height: 'auto', ease: 'power2.inOut',
                    onComplete: () => {
                        this.isToggled = true;
                        this.view.addClass('is-toggled');
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
        this.clearArray = () => {
            this.filters = [];
            this.$itemTime.removeClass('is-active');
            this.$itemSector.removeClass('is-active');
            this.$allSectors.removeClass('is-active');
            this.isAllChecked = false;
            this.unmarkTimeline();
            Filters.instance.$selectedCountry.val('');
            this.setDefaultSelection();
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
        this.toggleCountry = (e) => {
            const current = $(e.currentTarget);
            if (current.hasClass('is-active')) {
                this.removeElementFromArray(current, this.filters);
            }
            else {
                this.addElementToArray(current, this.filters);
            }
            Filters.showPickedFilters(current.data('item'));
        };
        this.$clear = this.view.find('.js-clear');
        this.$panel = this.view.find('.js-panel');
        this.$itemSector = this.view.find('.js-item');
        this.$itemTime = this.view.find('.js-time');
        this.$timelineItem = this.view.find('[data-time]');
        this.$allSectors = this.view.find('.js-item-all');
        this.$picked = $('.js-picked-filter');
        this.$selectedCountry = this.view.find('#search-country');
        this.$itemCountry = this.view.find('.js-item-country');
        Filters.instance = this;
        console.log(Filters.instance.$itemSector, Filters.instance.view.find('[data-selected]').data('selected'));
        this.bind();
        this.setDefaultSelection();
    }
    static showPickedFilters(country) {
        let pickedSectors = Filters.instance.$itemSector.filter('.is-active').length > 0 ? Filters.instance.$itemSector.filter('.is-active') : null;
        let pickedTime = Filters.instance.$itemTime.filter('.is-active').length > 0 ? Filters.instance.$itemTime.filter('.is-active') : null;
        let pickedCountry = Filters.instance.$itemCountry.filter('.is-active').length > 0 ? Filters.instance.$itemCountry.filter('.is-active').text() : Filters.instance.$selectedCountry.val();
        Filters.instance.$picked.find('span').remove();
        if (pickedSectors) {
            console.log(pickedSectors);
            if (pickedSectors.length === Filters.instance.$itemSector.length) {
                console.log('aal', Filters.instance.$allSectors);
                Filters.instance.$picked.append('<span>' + Filters.instance.$allSectors.text() + '</span>');
            }
            else {
                let coma = ',';
                let cls = 'tag';
                pickedSectors.each((i, el) => {
                    if (i == pickedSectors.length - 1) {
                        coma = '';
                        cls = 'tag-last';
                    }
                    Filters.instance.$picked.append('<span class=' + cls + '>' + $(el).text() + coma + '</span>');
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
        this.$itemCountry.off('.country').on('click.country', this.toggleCountry);
        this.$clear.off('.clear').on('click.clear', this.clearArray);
        this.$allSectors.off('.all').on('click.all', this.markAllSectors);
    }
    markAllSectors() {
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
    }
    setDefaultSelection() {
        this.addElementToArray(this.$itemTime.filter('[data-item="all-time"]'), this.filters);
        this.addElementToArray(this.$itemCountry, this.filters);
        this.$itemSector.each((i, el) => {
            this.addElementToArray($(el), this.filters);
        });
        this.$allSectors.addClass('is-active');
        this.isAllChecked = true;
        Filters.showPickedFilters();
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
const Filters_1 = require("./Filters");
class Search extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.onLiveClick = (e) => {
            const current = $(e.currentTarget);
            this.$input.val(current.text());
            this.$itemCountry.removeClass('is-active');
            Filters_1.Filters.showPickedFilters();
        };
        this.$input = this.view.find('input');
        this.$liveList = this.view.find('.js-live-list');
        this.$itemCountry = this.view.find('.js-item-country');
        this.bind();
    }
    bind() {
        this.$input.on('focus', () => this.onFocus());
        this.$input.on('blur', () => this.onBlur());
        this.$input.on('input', () => this.onInput());
    }
    onFocus() {
        this.view.addClass('is-focus');
    }
    onBlur() {
        this.view.removeClass('is-focus');
    }
    onInput() {
        this.$input.val().length > 0 ? this.view.addClass('is-livesearching') : this.view.removeClass('is-livesearching');
        if (this.$liveList.find('.js-live-item').length > 0) {
            this.$liveItem = this.view.find('.js-live-item');
            this.$liveItem.off('.live').on('click.live', this.onLiveClick);
        }
    }
}
exports.Search = Search;

},{"./Component":15,"./Filters":18}],23:[function(require,module,exports){
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

},{"./Component":15}],24:[function(require,module,exports){
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

},{"../Site":11,"../Utils":12,"./Component":15}],25:[function(require,module,exports){
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

},{"../Site":11,"./Component":15}],26:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0FzaWRlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ2hhcnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Db21wb25lbnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9EYXNoYm9hcmQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9Ecm9wZG93bi50cyIsInNyYy90cy9jb21wb25lbnRzL0ZpbHRlcnMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9NYXNvbnJ5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUGFyYWxsYXgudHMiLCJzcmMvdHMvY29tcG9uZW50cy9SYW5nZS50cyIsInNyYy90cy9jb21wb25lbnRzL1NlYXJjaC50cyIsInNyYy90cy9jb21wb25lbnRzL1NsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL1N0YXRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNFQSxpQ0FBaUM7QUFDakMsaUNBQStCO0FBaUIvQixNQUFhLEdBQUc7SUF5UEwsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFZO1FBRTNCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxPQUFPLE1BQU0sS0FBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFD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LElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDM0UsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUU1RCxPQUFPLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBQyxJQUFJLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUU3RTtRQUdELElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQixJQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1NBQzFFO1FBR0QsSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDeEMsSUFBSSxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBYyxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUNoRSxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDcEI7UUFHRCxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDYixJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxD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QUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFHbEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsYUFBYSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNoQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2dCQUNwRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsR0FBRyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLENBQUM7Z0JBQzFELElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQztnQkFDekQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDckIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJ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QUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzVuRCxDQUFDO0lBSU8sZUFBZSxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsTUFBYyxFQUFFLElBQVk7UUFDMUUsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQzthQUN2QyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2IsTUFBTSxLQUFLLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztZQUN4QixNQUFNLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUMxQixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3pDLE1BQU0sR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEUsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxLQUFLLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLENBQUMsQ0FBQyxDQUFDO0lBQ1gsQ0FBQztJQUlPLFNBQVM7UUFDYixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQzdCLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzdCO1FBQ0wsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBSU8sSUFBSTtRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFXTyxNQUFNO1FBQ1YsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDbEIsTUFBTSxFQUFFLENBQUM7WUFDVCxRQUFRLEVBQUUsQ0FBQztZQUNYLElBQUksRUFBRSxRQUFRO1lBQ2QsT0FBTyxFQUFFLENBQUMsR0FBRztTQUNoQixDQUFDLENBQUM7SUFDUCxDQUFDO0lBSU8sTUFBTSxDQUFDLEtBQWU7UUFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDbEIsTUFBTSxFQUFFLENBQUM7WUFDVCxRQUFRLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QixJQUFJLEVBQUUsUUFBUTtZQUNkLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDN0IsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUlPLFdBQVcsQ0FBQyxLQUFhLEVBQUUsSUFBYyxFQUFFLEtBQWUsRUFBRSxLQUFjO1FBQzlFLE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEMsSUFBSSxPQUFPLElBQUksS0FBSyxXQUFXLEVBQUU7WUFDN0IsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztTQUN0QjtRQUVELElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFO1lBQ1YsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUIsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEQsVUFBVSxFQUFFLFFBQVE7WUFDcEIsSUFBSSxFQUFFLFFBQVE7WUFDZCxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ3RCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3hDLENBQUM7SUFZTyxNQUFNO1FBR1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7UUFDekMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMxRCxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRWxCLE1BQU0sV0FBVyxHQUFHLENBQUMsQ0FBQztRQUN0QixNQUFNLGFBQWEsR0FBRyxDQUFDLENBQUM7UUFDeEIsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ2YsSUFBSSxHQUFHLENBQUM7UUFDUixNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXpELElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQztRQUM1QixJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxnQ0FBZ0MsQ0FBQztRQUNqRCxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUM7UUFFdEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFdBQVcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxHQUFHLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7WUFDcEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7WUFDOUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLGFBQWEsQ0FBQyxDQUFDO1lBQzdHLElBQUksQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztZQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDMUYsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDckI7UUFHRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNuQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JCLElBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7WUFDNUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsZ0NBQWdDLENBQUM7WUFDakQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDdkMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RJLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDckI7SUFDTCxDQUFDO0lBK0ZPLFdBQVcsQ0FBQyxJQUFtQjtRQUNuQyxJQUFJLE9BQU8sR0FBRyxDQUFDLENBQUM7UUFFaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUc7WUFDbkMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxFQUFFO2dCQUNuQixPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0o7UUFFRCxPQUFPLE9BQU8sQ0FBQztJQUNuQixDQUFDO0lBSU8sT0FBTyxDQUFDLElBQUk7UUFDaEIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QyxJQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFFYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNsQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDcEcsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNsQjtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUlPLGVBQWUsQ0FBQyxDQUFTLEVBQUUsTUFBZ0IsRUFBRSxNQUFnQjtRQUNqRSxNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUN4QixNQUFNLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQztRQUN4QixPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNqRCxDQUFDO0NBQ0o7QUF4WUQsc0JBd1lDOzs7OztBQ3RaRCx3Q0FBcUM7QUFHckMsTUFBYSxlQUFlOztBQUE1QiwwQ0FFQztBQUQwQixzQkFBTSxHQUFXLFFBQVEsQ0FBQztBQUdyRCxNQUFzQixTQUFVLFNBQVEsaUJBQU87SUFHM0MsWUFBc0IsSUFBWSxFQUFZLE9BQWdCO1FBQzFELEtBQUssRUFBRSxDQUFDO1FBRFUsU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFvRHZELFdBQU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsVUFBd0IsRUFBRSxTQUFtQixFQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFsRG5HLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLDhCQUE4QixDQUFDLENBQUM7U0FBRTtRQUMvRCxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUlNLGFBQWE7UUFDaEIsT0FBTyxFQUFFLENBQUM7SUFDZCxDQUFDO0lBSU0sT0FBTztRQUNWLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7SUFJTSxTQUFTLENBQUMsS0FBYyxFQUFFLEtBQWMsSUFBVSxDQUFDO0lBSW5ELFVBQVU7UUFJYixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFZakMsQ0FBQztJQUlNLE9BQU8sS0FBVyxDQUFDO0lBSW5CLE1BQU0sS0FBVyxDQUFDO0lBUWxCLE9BQU87UUFDVixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNoQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQztDQUNKO0FBaEVELDhCQWdFQzs7Ozs7QUN2RUQsMkNBQXdDO0FBS3hDLE1BQWEsU0FBVSxTQUFRLHFCQUFTO0lBT3BDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBVy9DLFdBQU0sR0FBRyxDQUFDLEdBQVcsRUFBRSxHQUFXLEVBQUUsVUFBd0IsRUFBRSxTQUFtQixFQUFRLEVBQUU7UUFFbEcsQ0FBQyxDQUFDO1FBTU0sZ0JBQVcsR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNqQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLGNBQWM7b0JBQ3pFLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7d0JBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO29CQUNqQyxDQUFDO2lCQUNKLENBQUMsQ0FBQzthQUNOO2lCQUFNO2dCQUNILElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNwQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLGNBQWM7b0JBQ2xFLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2IsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQzNCLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2FBQ047UUFDTCxDQUFDLENBQUE7UUFoQ0csSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDWixJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDeEIsQ0FBQztJQU9PLElBQUk7UUFDUixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBcUJPLFlBQVk7UUFDaEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBQyxDQUFDLENBQUM7SUFDekMsQ0FBQztDQUVKO0FBakRELDhCQWlEQzs7Ozs7QUN0REQsMkNBQXdDO0FBRXhDLGtDQUFnQztBQUNoQyx1Q0FBb0M7QUFFcEMsTUFBYSxRQUFTLFNBQVEscUJBQVM7SUFRbkMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFKOUMsV0FBTSxHQUFZLEtBQUssQ0FBQztRQXVCeEIsV0FBTSxHQUFHLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDbkIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUMsQ0FBQTtRQW1CTywyQkFBc0IsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQ3pDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDbkIsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQUUsT0FBTzthQUFFO1lBQ3ZFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUN0QjtRQUNMLENBQUMsQ0FBQTtRQUVPLGdCQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUN4QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU3QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyx1QkFBdUIsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUVqRCxVQUFVLENBQUUsR0FBRyxFQUFFO2dCQUNiLGlCQUFPLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ1osQ0FBQyxDQUFBO1FBM0RHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTVDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7SUFDM0QsQ0FBQztJQUdPLElBQUk7UUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6RCxXQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQUN4RSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQUMsQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3pFLENBQUM7SUFRTyxVQUFVLENBQUMsQ0FBQztRQUNoQixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2QsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDdEI7SUFDTCxDQUFDO0lBRU8sV0FBVztRQUNmLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQztDQXlCSjtBQXZFRCw0QkF1RUM7Ozs7O0FDNUVELDJDQUF3QztBQUt4QyxNQUFhLE9BQVEsU0FBUSxxQkFBUztJQXVEbEMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUF6QzlDLFlBQU8sR0FBa0IsRUFBRSxDQUFDO1FBNkQ3QixXQUFNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLFVBQXdCLEVBQUUsU0FBbUIsRUFBUSxFQUFFO1FBSWxHLENBQUMsQ0FBQztRQStCTSxlQUFVLEdBQUcsR0FBUyxFQUFFO1lBQzVCLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ3hDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUN0QixPQUFPLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUMzQixPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNoQyxDQUFDLENBQUE7UUFpQk8saUJBQVksR0FBRyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFbkMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMsc0JBQXNCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFFbkQsSUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO29CQUNuQixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDMUMsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7aUJBQzdCO2FBQ0o7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakQ7WUFFRCxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNoQyxDQUFDLENBQUE7UUFHTyxlQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUN2QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV0QixJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3REO2lCQUFNO2dCQUNILE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBRS9HLElBQUksVUFBVSxFQUFFO29CQUNaLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2lCQUN6RDtnQkFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM5QjtZQUVELE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQ2hDLENBQUMsQ0FBQTtRQUdPLGtCQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUMxQixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRW5DLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDdEQ7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDakQ7WUFFRCxPQUFPLENBQUMsaUJBQWlCLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3BELENBQUMsQ0FBQTtRQS9IRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM5QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDbkQsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNsRCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzFELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUV2RCxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQztRQUN4QixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQzFHLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0lBQy9CLENBQUM7SUF0RE0sTUFBTSxDQUFDLGlCQUFpQixDQUFDLE9BQWdCO1FBQzVDLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUM1SSxJQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDckksSUFBSSxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUd4TCxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFL0MsSUFBSSxhQUFhLEVBQUU7WUFDZixPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRTNCLElBQUksYUFBYSxDQUFDLE1BQU0sS0FBSyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUU7Z0JBQzlELE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2pELE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7YUFDL0Y7aUJBQU07Z0JBQ0gsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO2dCQUNmLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQztnQkFDaEIsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtvQkFDekIsSUFBSSxDQUFDLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7d0JBQy9CLElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ1YsR0FBRyxHQUFHLFVBQVUsQ0FBQztxQkFDcEI7b0JBQ0QsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGNBQWMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxJQUFJLEdBQUcsU0FBUyxDQUFDLENBQUM7Z0JBQ2xHLENBQUMsQ0FBQyxDQUFDO2FBQ047U0FDSjtRQUVELElBQUksYUFBYSxFQUFFO1lBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQztZQUMzQixPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFHLGFBQWEsR0FBRyxTQUFTLENBQUMsQ0FBQztTQUN6RTtRQUVELElBQUksVUFBVSxFQUFFO1lBQ1osT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FBRyxVQUFVLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFDO1NBQ3pGO0lBQ0wsQ0FBQztJQTZCTyxJQUFJO1FBQ1IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUQsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDMUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDdEUsQ0FBQztJQUdPLGNBQWM7UUFDbEIsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUVoSCxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDNUIsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUN2QyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztRQUV6QixJQUFJLFdBQVcsRUFBRTtZQUNiLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ2xELElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbEM7UUFFRCxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBZ0JPLG1CQUFtQjtRQUN2QixJQUFJLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsd0JBQXdCLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEYsSUFBSSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXhELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQzVCLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDdkMsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7UUFFekIsT0FBTyxDQUFDLGlCQUFpQixFQUFFLENBQUM7SUFDaEMsQ0FBQztJQXNETyxZQUFZLENBQUMsRUFBVTtRQUMzQixJQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDNUMsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDckYsV0FBVyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNyQztJQUNMLENBQUM7SUFHTyxjQUFjO1FBQ2xCLElBQUksQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFFTyxzQkFBc0IsQ0FBQyxHQUFXLEVBQUUsS0FBb0I7UUFDNUQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JELElBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxFQUFFO1lBQ1osS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDdkIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUNoQztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQyxDQUFDO0lBR08saUJBQWlCLENBQUMsR0FBVyxFQUFFLEtBQW9CO1FBQ3ZELEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdCLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFDLENBQUM7Q0FFSjtBQXpORCwwQkF5TkM7Ozs7O0FDOU5ELDJDQUF3QztBQWlCeEMsTUFBYSxPQUFRLFNBQVEscUJBQVM7SUFvQmxDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBbEI5QyxTQUFJLEdBQXFCLEVBQUUsQ0FBQztRQUU1QixjQUFTLEdBQWUsRUFBRSxDQUFDO1FBRTNCLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFDdkIsYUFBUSxHQUFXLEVBQUUsQ0FBQztRQUN0QixhQUFRLEdBQVcsRUFBRSxDQUFDO1FBQ3RCLGNBQVMsR0FBVyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7UUFDbEQsaUJBQVksR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQ3RDLGFBQVEsR0FBUTtZQUNwQixLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUTtZQUN4QyxNQUFNLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsUUFBUTtTQUM3QyxDQUFDO1FBQ00saUJBQVksR0FBVyxDQUFDLENBQUM7UUFDekIsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFFMUIsb0JBQWUsR0FBNkIsRUFBRSxDQUFDO1FBc0JoRCxXQUFNLEdBQUcsQ0FBQyxHQUFXLEVBQUUsR0FBVyxFQUFFLFVBQXdCLEVBQUUsU0FBbUIsRUFBUSxFQUFFO1FBRWxHLENBQUMsQ0FBQztRQW5CRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFDaEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDdkIsTUFBTSxRQUFRLEdBQWM7Z0JBQ3hCLE1BQU0sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztnQkFDMUIsS0FBSyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUMxQixLQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7YUFDN0IsQ0FBQztZQUNGLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdCLENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBSTNFLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBT08sSUFBSTtRQUVSLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzVCLENBQUM7SUFFTyxnQkFBZ0I7UUFDcEIsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFJcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFFOUIsTUFBTSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUMxQixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzVCLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFDMUIsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBR3BCLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUVPLFdBQVcsQ0FBQyxNQUFjLEVBQUUsS0FBYSxFQUFFLEtBQWEsRUFBRSxLQUFhO1FBQzNFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDaEUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDO1FBRW5GLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1FBSWpDLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtZQUNiLFlBQVksR0FBRyxDQUFDLENBQUM7WUFDakIsU0FBUyxHQUFHLENBQUMsQ0FBQztZQUNkLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQ3hCLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkYsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQzNFLFFBQVEsR0FBRyxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1NBQzNEO1FBV0QsSUFBSSxHQUFzQjtZQUN0QixZQUFZLEVBQUUsWUFBWTtZQUMxQixVQUFVLEVBQUUsVUFBVTtZQUN0QixTQUFTLEVBQUUsU0FBUztZQUNwQixPQUFPLEVBQUUsT0FBTztTQUNuQixDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQztZQUNSLFFBQVEsRUFBRSxVQUFVO1lBQ3BCLE9BQU8sRUFBRSxDQUFDO1lBQ1YsbUJBQW1CLEVBQUUsWUFBWTtZQUNqQyxpQkFBaUIsRUFBRSxVQUFVO1lBQzdCLGdCQUFnQixFQUFFLFNBQVM7WUFDM0IsY0FBYyxFQUFFLE1BQU0sR0FBRyxPQUFPO1lBQ2hDLGVBQWUsRUFBRSxLQUFLO1NBQ3pCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxRQUFRLENBQUM7SUFHckQsQ0FBQztDQUVKO0FBbEhELDBCQWtIQzs7Ozs7QUNuSUQsMkNBQXNDO0FBQ3RDLDhDQUFvRTtBQW1CcEUsTUFBYSxRQUFTLFNBQVEscUJBQVM7SUFVbkMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFOOUMsU0FBSSxHQUFXLENBQUMsQ0FBQztRQWdEakIsZ0JBQVcsR0FBRyxDQUFDLEtBQUssRUFBUSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBRSxLQUFLLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxHQUFHLENBQUM7WUFDeEQsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFFLEtBQUssQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUV6RCxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUE7UUE1Q0csSUFBSSxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUM7UUFDeEIsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBR2pDLElBQUksdUJBQVUsQ0FBQyxPQUFPLEVBQUU7WUFDcEIsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2Y7SUFDTCxDQUFDO0lBSU8sSUFBSTtRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUlPLGdCQUFnQjtRQUNwQixNQUFNLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEYsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRCxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNsQyxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7WUFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLDZCQUE2QixDQUFDLENBQUM7YUFBRTtZQUNoRixPQUFPO2dCQUNILEdBQUcsRUFBRSxHQUFHO2dCQUNSLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNmLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQ2xCLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUNmLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBYU8sT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLO1FBQ3hCLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQUUsT0FBTztTQUFFO1FBQzVCLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzNCLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDZCxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7Z0JBQ25CLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUs7Z0JBQ3JCLElBQUksRUFBRSxRQUFRO2FBQ2pCLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBeEVELDRCQXdFQzs7Ozs7QUM1RkQsMkNBQXdDO0FBRXhDLGtDQUFnQztBQUdoQyxNQUFhLEtBQU0sU0FBUSxxQkFBUztJQVFoQyxZQUFzQixJQUFZLEVBQVksT0FBUTtRQUNsRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFETSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBQVksWUFBTyxHQUFQLE9BQU8sQ0FBQztRQUo5QyxXQUFNLEdBQVksS0FBSyxDQUFDO1FBc0J4QixXQUFNLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFBO1FBb0JPLDJCQUFzQixHQUFHLENBQUMsQ0FBQyxFQUFRLEVBQUU7WUFDekMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQUUsT0FBTzthQUFFO1lBQ3ZFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQzVDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQzthQUN0QjtRQUNMLENBQUMsQ0FBQTtRQUVPLGdCQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUN4QixDQUFDLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDcEIsQ0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO1lBQ25CLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRWpELElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztZQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUU3QixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBO1FBckRHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ25ELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUdPLElBQUk7UUFDUixJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUM3RCxXQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ2xGLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQVFPLFVBQVUsQ0FBQyxDQUFDO1FBQ2hCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztRQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUM5QixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztTQUN0QjtJQUNMLENBQUM7SUFFTyxXQUFXO1FBQ2YsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2xDLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDO1NBQ3ZCO0lBQ0wsQ0FBQztDQW1CSjtBQWpFRCxzQkFpRUM7Ozs7O0FDdEVELDJDQUF3QztBQUd4Qyx1Q0FBb0M7QUFFcEMsTUFBYSxNQUFPLFNBQVEscUJBQVM7SUFRakMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFvQzlDLGdCQUFXLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUM5QixNQUFNLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBRW5DLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQzNDLGlCQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUNoQyxDQUFDLENBQUE7UUF2Q0csSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV0QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUdPLElBQUk7UUFDUixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRU8sT0FBTztRQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFTyxNQUFNO1FBQ1YsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVPLE9BQU87UUFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLGtCQUFrQixDQUFDLENBQUM7UUFFbEgsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2pELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7WUFFakQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbEU7SUFDTCxDQUFDO0NBU0o7QUFuREQsd0JBbURDOzs7OztBQ3RERCwyQ0FBd0M7QUFFeEMsTUFBYSxNQUFPLFNBQVEscUJBQVM7SUFRakMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFKOUMsVUFBSyxHQUFXLENBQUMsQ0FBQztRQW1CbEIsZ0JBQVcsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQzlCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFN0IsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFBO1FBbkJHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRS9DLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBR08sSUFBSTtRQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFZTyxnQkFBZ0IsQ0FBQyxFQUFVLEVBQUUsS0FBYTtRQUM5QyxFQUFFLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTVCLFVBQVUsQ0FBRSxHQUFHLEVBQUU7WUFDYixFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2QsQ0FBQztDQUNKO0FBeENELHdCQXdDQzs7Ozs7QUM1Q0QsMkNBQXdDO0FBQ3hDLGtDQUFrQztBQUNsQyxrQ0FBa0M7QUFHbEMsTUFBYSxLQUFNLFNBQVEscUJBQVM7SUFVaEMsWUFBc0IsSUFBWSxFQUFZLE9BQVE7UUFDbEQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRE0sU0FBSSxHQUFKLElBQUksQ0FBUTtRQUFZLFlBQU8sR0FBUCxPQUFPLENBQUM7UUFtQjlDLGVBQVUsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQzdCLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbkMsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNsQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLENBQUMsQ0FBQTtRQXBCRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDM0MsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBRWhELElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNaLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDdkYsQ0FBQztJQUlPLElBQUk7UUFDUixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztJQUMzRCxDQUFDO0lBWU8sYUFBYSxDQUFDLEtBQWE7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7UUFDdkIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkUsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7WUFDekIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1lBQ3ZCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzFCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLGNBQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVyQixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFJTyxXQUFXO1FBQ2YsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFBRSxPQUFPLEVBQUUsQ0FBQztnQkFBQyxPQUFPO2FBQUU7WUFDMUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNuQixPQUFPLEVBQUUsQ0FBQztnQkFDVixRQUFRLEVBQUUsR0FBRztnQkFDYixJQUFJLEVBQUUsTUFBTTtnQkFDWixVQUFVLEVBQUUsR0FBRyxFQUFFO29CQUNiLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO29CQUN2QyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDO2FBQ0osQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0lBRU8sZUFBZTtRQUNuQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzlDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUM5QyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBYyxDQUFDO1lBQzdDLElBQUksSUFBSSxJQUFJLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFdBQVcsRUFBRTtnQkFDaEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUM7YUFDckI7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxJQUFJLENBQUMsS0FBYTtRQUN0QixPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUMsQ0FBQztZQUMvRCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ3ZCLE9BQU8sRUFBRSxDQUFDO2FBQ2IsRUFBRTtnQkFDQyxPQUFPLEVBQUUsQ0FBQztnQkFDVixRQUFRLEVBQUUsR0FBRztnQkFDYixJQUFJLEVBQUUsTUFBTTtnQkFDWixVQUFVLEVBQUUsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFO2FBQzlCLENBQUMsQ0FBQztZQUdILElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFO2dCQUNsRCxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBYyxDQUFDO2dCQUM3QyxJQUFJLElBQUksSUFBSSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxXQUFXLEVBQUU7b0JBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2lCQUNwQjtZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUE7SUFDTixDQUFDO0NBQ0o7QUF0R0Qsc0JBc0dDOzs7OztBQ3pHRCwyQ0FBd0M7QUFDeEMsa0NBQStCO0FBSy9CLE1BQWEsT0FBUSxTQUFRLHFCQUFTO0lBTWxDLFlBQXNCLElBQVksRUFBWSxPQUFRO1FBQ2xELEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQURNLFNBQUksR0FBSixJQUFJLENBQVE7UUFBWSxZQUFPLEdBQVAsT0FBTyxDQUFDO1FBd0I5QyxpQkFBWSxHQUFHLEdBQVMsRUFBRTtZQUM5QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDZCxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDZjtRQUdMLENBQUMsQ0FBQTtRQUVPLGlCQUFZLEdBQUcsR0FBUyxFQUFFO1lBQzlCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtnQkFDYixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEI7UUFDTCxDQUFDLENBQUE7UUFFTyx5QkFBb0IsR0FBRyxDQUFDLENBQUMsRUFBUSxFQUFFO1lBQ3ZDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7WUFPbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2Y7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2hCO1FBQ0wsQ0FBQyxDQUFDO1FBSU0sMkJBQXNCLEdBQUcsQ0FBQyxDQUFDLEVBQVEsRUFBRTtZQUN6QyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFHO2dCQUM3QyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7YUFDaEI7UUFDTCxDQUFDLENBQUM7UUF6REUsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDMUYsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFJTyxJQUFJO1FBQ1IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRTVELElBQUksQ0FBQyxJQUFJO2FBQ0osR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDO2FBQzFELEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRWxFLFdBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBRXRELElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNiLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUN2RDtJQUNMLENBQUM7SUEwQ08sSUFBSTtRQUNSLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBRW5CLFVBQVUsQ0FBRSxHQUFHLEVBQUU7WUFDYixJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFUixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDekMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDN0Q7UUFFRCxVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ1osSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNiLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNoQjtRQUNMLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNiLENBQUM7SUFJTyxLQUFLO1FBQ1QsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFakMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3pDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2hFO0lBQ0wsQ0FBQztDQUNKO0FBbEdELDBCQWtHQzs7Ozs7QUMxR0Qsd0NBQXFDO0FBRXJDLHVEQUFxRTtBQUVyRSx3Q0FBd0M7QUFDeEMsa0NBQWlEO0FBRWpELE1BQWEsVUFBVTs7QUFBdkIsZ0NBSUM7QUFIMEIsbUJBQVEsR0FBVyxVQUFVLENBQUM7QUFDOUIsbUJBQVEsR0FBVyxVQUFVLENBQUM7QUFDOUIsaUJBQU0sR0FBVyxRQUFRLENBQUM7QUFHckQsTUFBYSxJQUFLLFNBQVEsaUJBQU87SUFRN0IsWUFBc0IsSUFBWSxFQUFFLE9BQVE7UUFFeEMsS0FBSyxFQUFFLENBQUM7UUFGVSxTQUFJLEdBQUosSUFBSSxDQUFRO1FBTjNCLGVBQVUsR0FBcUIsRUFBRSxDQUFDO1FBK0xqQyxzQkFBaUIsR0FBRyxDQUFDLEVBQUUsRUFBUSxFQUFFO1lBQ3JDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JGLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUN4QyxDQUFDLENBQUE7UUF6TEcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU5QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBUU0sT0FBTztRQUVWLElBQUksRUFBRSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBb0MsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNwSCxJQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFFaEIsS0FBSyxJQUFJLFNBQVMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO1lBQ25DLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDO1NBQ3JEO1FBQ0QsS0FBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEVBQUU7WUFDcEIsRUFBRSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDL0I7UUFFRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQ3pDLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLFVBQVUsQ0FBQztZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQW1DLEVBQUUsS0FBZ0MsRUFBRSxFQUFFO2dCQUMzRixJQUFJLFFBQVEsR0FBVyxRQUFRLENBQUMsZUFBZSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDO2dCQUN6RSxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRTtnQkFDWCxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbEMsT0FBTyxFQUFFLENBQUM7WUFDZCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQVFNLE9BQU87UUFFVixJQUFJLE9BQU8sR0FBWSxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQy9CLEtBQUssSUFBSSxTQUFTLElBQUksSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNuQyxNQUFNLGdCQUFnQixHQUFZLFNBQVMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0RCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxnQkFBZ0IsRUFBRTtnQkFDaEMsT0FBTyxHQUFHLElBQUksQ0FBQzthQUNsQjtTQUNKO1FBRUQsT0FBTyxPQUFPLENBQUM7SUFDbkIsQ0FBQztJQVFNLFNBQVMsQ0FBQyxLQUFjO1FBQzNCLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBRzVELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtZQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDMUM7UUFDRCxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDZixRQUFRLEVBQUUsR0FBRztZQUNiLE9BQU8sRUFBRSxDQUFDO1lBQ1YsVUFBVSxFQUFFLEdBQUcsRUFBRTtnQkFDYixJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztZQUNoRSxDQUFDO1NBQ0osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQVNNLFVBQVU7UUFDYixNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUVuQyxZQUFLLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQztRQUM3QyxJQUFJLG9CQUFvQixHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBQzdELElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRTtnQkFDZixRQUFRLEVBQUUsR0FBRztnQkFDYixVQUFVLEVBQUUsR0FBUyxFQUFFO29CQUNuQixPQUFPLEVBQUUsQ0FBQztvQkFDVixZQUFLLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2dCQUNELE9BQU8sRUFBRSxDQUFDO2FBQ2IsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7UUFHSCxJQUFJLG1CQUFtQixHQUF5QixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBaUIsRUFBRTtZQUN2RixPQUFzQixHQUFHLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFHSCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1lBRXpDLElBQUksV0FBVyxHQUF5QixtQkFBbUIsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUV6RixPQUFPLENBQUMsR0FBRyxDQUFPLFdBQVcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUM1QyxPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBUU0sT0FBTztRQUNWLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDNUIsQ0FBQztJQU1NLE1BQU07UUFDVCxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzNCLENBQUM7SUFVTSxNQUFNLENBQUMsR0FBVyxFQUFFLEdBQVcsRUFBRSxVQUF1QixFQUFFLFNBQW1CO1FBQ2hGLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELENBQUM7SUFPTSxPQUFPO1FBQ1YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN4QixJQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUdyQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM3QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUVqQixLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7SUFDcEIsQ0FBQztJQUlTLGVBQWUsQ0FBQyxXQUFtQjtRQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDOUMsTUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3QyxNQUFNLGFBQWEsR0FBVyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBRzNELElBQUksYUFBYSxLQUFLLFNBQVMsSUFBSSxvQkFBVSxDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUMxRCxNQUFNLE9BQU8sR0FBVyxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUM5QyxTQUFTLEdBQWMsSUFBSSxvQkFBVSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2hDLFNBQVMsQ0FBQyxFQUFFLENBQUMsMkJBQWUsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7YUFDaEU7aUJBQU07Z0JBQ0gsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsNkJBQTZCLEVBQUUsYUFBYSxDQUFDLENBQUM7YUFDckU7U0FDSjtJQUNMLENBQUM7SUFTTyxPQUFPLENBQUMsRUFBVSxFQUFFLEdBQUcsSUFBSTtRQUMvQixLQUFLLElBQUksU0FBUyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDbkMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxVQUFVLEVBQUU7Z0JBQ3JDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQy9EO1NBQ0o7SUFFTCxDQUFDO0NBQ0o7QUFoTkQsb0JBZ05DIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLy8gLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XG5pbXBvcnQgeyBkZWJ1ZyB9IGZyb20gJy4vU2l0ZSc7XG5cblxuXG5kZWNsYXJlIHZhciAkYm9keTtcblxuZXhwb3J0IGludGVyZmFjZSBJQXBpRGF0YSB7XG4gICAgdXJsOiBzdHJpbmc7XG4gICAgYmVmb3JlQ2FsbD86IHN0cmluZztcbiAgICBjYWxsYmFjaz86IHN0cmluZztcbiAgICBmb3JtPzogYW55O1xuICAgIHBhcmFtcz86IGFueTtcbiAgICBsaWtlPzogYm9vbGVhbjtcbiAgICBhY3Rpb24/OiAnUE9TVCcgfCAnREVMRVRFJyB8ICdHRVQnIHwgJ1BVVCcgfCAnUEFUQ0gnO1xufVxuXG5cbmV4cG9ydCBjbGFzcyBBUEkge1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIGJlZm9yZUNhbGxzID0ge1xuXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgICAgIGlmICghJGJvZHkuaGFzQ2xhc3MoJ2lzLWxvZ2dlZCcpKSB7XG4gICAgICAgICAgICAgICAgJCgnLmpzLWxvZ2luJykubGFzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cblxuICAgICAgICB2YWxpZGF0ZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogdm9pZCB7XG4gICAgICAgICAgICBsZXQgcGFzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICBsZXQgJGZvcm0gPSAkZWwuaXMoJ2Zvcm0nKSA/ICRlbCA6ICRlbC5jbG9zZXN0KCdmb3JtJyk7XG4gICAgICAgICAgICBsZXQgJHZhbGlkYXRpb25FbGVtID0gJGZvcm07XG4gICAgICAgICAgICBsZXQgc3RlcFZhbGlkYXRpb247XG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XG4gICAgICAgICAgICBpZiAoJGZvcm0uaGFzQ2xhc3MoJ2lzLWRvbmUnKSkge1xuICAgICAgICAgICAgICAgICRmb3JtLnJlbW92ZUNsYXNzKCdpcy1kb25lJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBpZiAoICEhZGF0YS5wYXJhbXMgKSB7XG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnZhbGlkYXRlT25lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSAgZGF0YS5wYXJhbXMudmFsaWRhdGVPbmU7XG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vICAgICB9XG5cbiAgICAgICAgICAgIC8vICAgICBpZiAoZGF0YS5wYXJhbXMuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9ICBkYXRhLnBhcmFtcy5zY3JvbGxUbztcbiAgICAgICAgICAgIC8vICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xuXG4gICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnW3JlcXVpcmVkXTppbnB1dCcpLmVhY2goKGluZGV4OiBudW1iZXIsIGlucHV0OiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnSU5QVVQnICkge1xuXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnR5cGUpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZSA9IC9eKChbXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKFxcLltePD4oKVxcW1xcXVxcXFwuLDs6XFxzQFwiXSspKil8KFwiLitcIikpQCgoXFxbWzAtOV17MSwzfVxcLlswLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfV0pfCgoW2EtekEtWlxcLTAtOV0rXFwuKStbYS16QS1aXXsyLH0pKSQvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJlLnRlc3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zW3ZhbHVlLmxlbmd0aCA+IDAgPyAnaW52YWxpZC1lbWFpbCcgOiAncmVxdWlyZWQtZmllbGQnXVsnZW4nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkuY2hlY2tlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RleHQnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICgkKGlucHV0KS5oYXNDbGFzcygnanMtcG9zdGFsJykpIHttZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbnVtYmVyJzpcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncGhvbmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWxUZWwgPSAoaW5wdXQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbFRlbC5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnVEVYVEFSRUEnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWwubGVuZ3RoIDwgMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ2lucHV0W25hbWU9emlwY29kZV0nKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XG5cbiAgICAgICAgICAgICAgICBpZiAodmFsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoaW5wdXQpLmhhc0NsYXNzKCdqcy1wb3N0YWwnKSAmJiB2YWwubGVuZ3RoICE9IDUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddIDogbWVzc2FnZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcbiAgICBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgaWYgKCEhcGFzc2VkKSB7XG4gICAgICAgICAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZm9ybSk7XG4gICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcnMnKTtcbiAgICAgICAgICAgICAgICAkdmFsaWRhdGlvbkVsZW0uZmluZCgnLmpzLWVycm9yJykudGV4dCgnJyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRmb3JtLmFkZENsYXNzKCdoYXMtZXJyb3JzJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgc3RhdGljIGNhbGxiYWNrcyA9IHtcblxuICAgICAgICBvbkNvb2tpZXNDbG9zZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xuICAgICAgICAgICAgJGVsLnBhcmVudCgpLmFkZENsYXNzKCdpcy1oaWRkZW4nKTtcbiAgICAgICAgfSxcblxuICAgICAgICBvblN1YnNjcmliZTogZnVuY3Rpb24oZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ29uU3Vic2NyaWJlJyk7XG4gICAgICAgICAgICBsZXQgJG1lc3NhZ2UgPSAkZWwuZmluZCgnLmpzLW1lc3NhZ2UnKTtcbiAgICAgICAgICAgIGxldCBzY3JvbGxUbztcblxuICAgICAgICAgICAgLy8gaWYgKGRhdGEuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gIGRhdGEuc2Nyb2xsVG87XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgIHNjcm9sbFRvID0gZmFsc2U7XG4gICAgICAgICAgICAvLyB9XG5cblxuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xuXG4gICAgICAgICAgICBpZiAoISRtZXNzYWdlWzBdKSB7XG4gICAgICAgICAgICAgICAgJGVsLmFwcGVuZCgnPGRpdiBjbGFzcz1cImpzLW1lc3NhZ2UgbWVzc2FnZVwiPicpO1xuICAgICAgICAgICAgICAgICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBodG1sID0gJCgnPHA+JyArIHJlc3BvbnNlLm1lc3NhZ2UgKyAnPC9wPicpO1xuXG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKS5hcHBlbmQoaHRtbCk7XG5cbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5yZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvbXBsZXRlZCcpO1xuICAgICAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xuICAgICAgICAgICAgICAgICRlbC5jbG9zZXN0KCcuam9pbicpLmFkZENsYXNzKCdpcy1zdWJzY3JpYmVkJyk7XG5cbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS52YWwoJycpO1xuICAgICAgICAgICAgICAgICRlbC5maW5kKCdpbnB1dDpjaGVja2VkJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRlbFswXS5oYXNBdHRyaWJ1dGUoJ2RhdGEtcmVkaXJlY3QnKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbignLycpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtZXJyb3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGlmIChzY3JvbGxUbykge1xuICAgICAgICAgICAgLy8gICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkbWVzc2FnZSwgZmFsc2UsIC0zMCk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgIH0sXG5cbiAgICB9O1xuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBhbnkpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gJCh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJyA/IHRhcmdldCA6ICdib2R5Jyk7XG5cbiAgICAgICAgJHRhcmdldC5maW5kKCdbZGF0YS1hcGldJykubm90KCdmb3JtJykub2ZmKCcuYXBpJykub24oJ2NsaWNrLmFwaScsIEFQSS5vbkFjdGlvbik7XG4gICAgICAgICR0YXJnZXQuZmluZCgnZm9ybVtkYXRhLWFwaV0nKS5vZmYoJy5hcGknKS5vbignc3VibWl0LmFwaScsIEFQSS5vbkFjdGlvbikuYXR0cignbm92YWxpZGF0ZScsICdub3ZhbGlkYXRlJyk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgY2FsbEl0KGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgY3VzdG9tQ2FsbGJhY2s/OiBGdW5jdGlvbik6ICBQcm9taXNlPGFueT4ge1xuICAgICAgICBcbiAgICAgICAgZGF0YSA9IEFQSS5wcmVwcm9jZXNzRGF0YShkYXRhLCAkZWwpO1xuXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuXG4gICAgICAgIGNvbnN0IGFjdGlvbiA9IGRhdGEuYWN0aW9uIHx8ICdQT1NUJztcbiAgICAgICAgZGVsZXRlIGRhdGEuYWN0aW9uO1xuXG4gICAgICAgIGNvbnN0IHVybCA9IGRhdGEudXJsIHx8IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcbiAgICAgICAgZGVsZXRlIGRhdGEudXJsO1xuXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTxhbnk+KChyZXNvbHZlLCByZWplY3QpID0+IHtcblxuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBnbG9iYWw6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHR5cGU6IGFjdGlvbixcbiAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmRvbmUoKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VzdG9tQ2FsbGJhY2sgJiYgdHlwZW9mIGN1c3RvbUNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2UpO1xuXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZhaWwoKGUpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FQSSBlcnJvcjogJyArIGUsIGRhdGEpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCEhZGVidWcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIEFQSS5vblN1Y2Nlc3MoZGF0YSwgJGVsLCBudWxsKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1c3RvbUNhbGxiYWNrKGRhdGEsICRlbCwgbnVsbCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmFsd2F5cygoKSA9PiB7XG4gICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcblxuICAgIH1cblxuICAgIHByaXZhdGUgc3RhdGljIHByZXByb2Nlc3NEYXRhKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IElBcGlEYXRhIHtcblxuICAgICAgICAvLyBnZXQgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGZvcm0gZWxlbWVudDpcbiAgICAgICAgaWYgKCRlbC5pcygnZm9ybScpKSB7XG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignYWN0aW9uJykgPyAkZWwuYXR0cignYWN0aW9uJykgOiBkYXRhLnVybDtcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCAkZWwuZmluZCgnOmlucHV0Jykuc2VyaWFsaXplT2JqZWN0KCkpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnZGF0YSBmb3JtJywgZGF0YSwgZGF0YS5wYXJhbXMsZGF0YS5mb3JtLCAkZWwuZmluZCgnOmlucHV0JykpO1xuXG4gICAgICAgIH1cblxuICAgICAgICAvLyB1cGRhdGUgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGxpbmsgZWxlbWVudDpcbiAgICAgICAgaWYgKCRlbC5pcygnW2hyZWZdJykpIHtcbiAgICAgICAgICAgIGRhdGEudXJsID0gIWRhdGEudXJsICYmICRlbC5hdHRyKCdocmVmJykgPyAkZWwuYXR0cignaHJlZicpIDogZGF0YS51cmw7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBnZXQgYWRkaXRpb25hbCBkYXRhIGZyb20gZXh0ZXJuYWwgZm9ybTpcbiAgICAgICAgaWYgKGRhdGEuZm9ybSAmJiAkKGRhdGEuZm9ybSBhcyBzdHJpbmcpWzBdKSB7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgJChkYXRhLmZvcm0gYXMgc3RyaW5nKS5zZXJpYWxpemVPYmplY3QoKSk7XG4gICAgICAgICAgICBkZWxldGUgZGF0YS5mb3JtO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZmxhdHRlbjpcbiAgICAgICAgaWYgKGRhdGEucGFyYW1zKSB7XG4gICAgICAgICAgICBkYXRhID0gJC5leHRlbmQoZGF0YSwgZGF0YS5wYXJhbXMpO1xuICAgICAgICAgICAgZGVsZXRlIGRhdGEucGFyYW1zO1xuICAgICAgICB9XG4gICAgICAgIGNvbnNvbGUubG9nKCdkYXRhIHByZScsIGRhdGEsIGRhdGEucGFyYW1zKTtcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25BY3Rpb24gPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGxldCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCk7XG4gICAgICAgIGNvbnN0IGRhdGE6IElBcGlEYXRhID0gey4uLiQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdhcGknKX07XG4gICAgICAgIGNvbnNvbGUubG9nKGRhdGEsICdkYXRhJyk7XG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xuICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1zdWJtaXR0ZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRlbC5jbG9zZXN0KCdmb3JtJykuYWRkQ2xhc3MoJ2lzLXN1Ym1pdHRlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gYmVmb3JlQ2FsbCBoYW5kbGVyOlxuICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5iZWZvcmVDYWxsIGluIEFQSS5iZWZvcmVDYWxscykge1xuICAgICAgICAgICAgICAgIEFQSS5iZWZvcmVDYWxsc1tkYXRhLmJlZm9yZUNhbGxdKGRhdGEsICRlbCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgQVBJLmNhbGxJdChkYXRhLCAkZWwpO1xuICAgIH07XG5cblxuXG4gICAgcHJpdmF0ZSBzdGF0aWMgb25TdWNjZXNzID0gKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkID0+IHtcblxuICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xuICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2sgaW4gQVBJLmNhbGxiYWNrcykge1xuICAgICAgICAgICAgICAgIEFQSS5jYWxsYmFja3NbZGF0YS5jYWxsYmFja10oZGF0YSwgJGVsLCByZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xufSIsImV4cG9ydCBpbnRlcmZhY2UgSUJyZWFrcG9pbnQge1xuICAgIGRlc2t0b3A6IGJvb2xlYW47XG4gICAgdGFibGV0OiBib29sZWFuO1xuICAgIHBob25lOiBib29sZWFuO1xuICAgIHZhbHVlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBsZXQgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQ7XG5cbmV4cG9ydCBjbGFzcyBCcmVha3BvaW50IHtcblxuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKSwgJzpiZWZvcmUnKTtcbiAgICAgICAgY29uc3QgY3NzQmVmb3JlVmFsdWUgPSBjc3NCZWZvcmUuZ2V0UHJvcGVydHlWYWx1ZSgnY29udGVudCcpLnJlcGxhY2UoL1tcXFwiXFwnXS9nLCAnJyk7XG5cbiAgICAgICAgYnJlYWtwb2ludCA9IHtcbiAgICAgICAgICAgIGRlc2t0b3A6IGNzc0JlZm9yZVZhbHVlID09PSAnZGVza3RvcCcsXG4gICAgICAgICAgICBwaG9uZTogY3NzQmVmb3JlVmFsdWUgPT09ICdwaG9uZScsXG4gICAgICAgICAgICB0YWJsZXQ6IGNzc0JlZm9yZVZhbHVlID09PSAndGFibGV0JyxcbiAgICAgICAgICAgIHZhbHVlOiBjc3NCZWZvcmVWYWx1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkJQOlwiLCBicmVha3BvaW50LnZhbHVlKTtcbiAgICB9XG59XG4iLCJleHBvcnQgbGV0IGJyb3dzZXI6IElCcm93c2VyO1xuZGVjbGFyZSBsZXQgb3ByO1xuLy8gdHNsaW50OmRpc2FibGU6bm8tYW55IGludGVyZmFjZS1uYW1lXG5pbnRlcmZhY2UgV2luZG93IHtcbiAgICBvcHI6IGFueTtcbiAgICBvcGVyYTogYW55O1xuICAgIHNhZmFyaTogYW55O1xuICAgIEhUTUxFbGVtZW50OiBhbnk7XG59XG4vLyB0c2xpbnQ6ZW5hYmxlOm5vLWFueSBpbnRlcmZhY2UtbmFtZVxuXG5cbmV4cG9ydCBpbnRlcmZhY2UgSUJyb3dzZXIge1xuICAgIG1vYmlsZT86IGJvb2xlYW47XG4gICAgd2luZG93cz86IGJvb2xlYW47XG4gICAgbWFjPzogYm9vbGVhbjtcbiAgICBpZT86IGJvb2xlYW47XG4gICAgaW9zPzogYm9vbGVhbjtcbiAgICBvcGVyYT86IGJvb2xlYW47XG4gICAgZmlyZWZveD86IGJvb2xlYW47XG4gICAgc2FmYXJpPzogYm9vbGVhbjtcbiAgICBjaHJvbWU/OiBib29sZWFuO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRCcm93c2VyKCk6IElCcm93c2VyIHtcbiAgICBjb25zdCB1YSA9IHdpbmRvdy5uYXZpZ2F0b3IudXNlckFnZW50O1xuICAgIGJyb3dzZXIgPSB7XG4gICAgICAgIG1vYmlsZTogKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcGFkfGlyaXN8a2luZGxlfEFuZHJvaWR8U2lsa3xsZ2UgfG1hZW1vfG1pZHB8bW1wfG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIChjZXxwaG9uZSl8eGRhfHhpaW5vL2kudGVzdCh1YSkgfHwgLzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdCh1YS5zdWJzdHIoMCwgNCkpKSA/IHRydWUgOiBmYWxzZSxcbiAgICAgICAgaW9zOiAvaVBhZHxpUGhvbmV8aVBvZC8udGVzdCh1YSksXG4gICAgICAgIG1hYzogbmF2aWdhdG9yLnBsYXRmb3JtLnRvVXBwZXJDYXNlKCkuaW5kZXhPZignTUFDJykgPj0gMCxcbiAgICAgICAgaWU6IHVhLmluZGV4T2YoJ01TSUUgJykgPiAwIHx8ICEhdWEubWF0Y2goL1RyaWRlbnQuKnJ2XFw6MTFcXC4vKSxcbiAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBuby1hbnlcbiAgICAgICAgb3BlcmE6ICghISh3aW5kb3cgYXMgYW55KS5vcHIgJiYgISFvcHIuYWRkb25zKSB8fCAhISh3aW5kb3cgYXMgYW55KS5vcGVyYSB8fCBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJyBPUFIvJykgPj0gMCxcbiAgICAgICAgZmlyZWZveDogdWEudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgc2FmYXJpOiAvXigoPyFjaHJvbWV8YW5kcm9pZCkuKSpzYWZhcmkvaS50ZXN0KHVhKSxcbiAgICAgICAgd2luZG93czogd2luZG93Lm5hdmlnYXRvci5wbGF0Zm9ybS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3dpbicpID4gLTEsXG4gICAgfTtcblxuICAgICQoJ2h0bWwnKVxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21hYycsICFicm93c2VyLndpbmRvd3MgJiYgKGJyb3dzZXIuaW9zIHx8IGJyb3dzZXIubWFjKSlcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCd3aW5kb3dzJywgYnJvd3Nlci53aW5kb3dzICYmICFicm93c2VyLm1hYyAmJiAhYnJvd3Nlci5pb3MpXG4gICAgICAgIC50b2dnbGVDbGFzcygnbW9iaWxlJywgYnJvd3Nlci5tb2JpbGUpXG4gICAgICAgIC50b2dnbGVDbGFzcygnZmlyZWZveCcsIGJyb3dzZXIuZmlyZWZveClcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdzYWZhcmknLCBicm93c2VyLnNhZmFyaSlcbiAgICAgICAgLnRvZ2dsZUNsYXNzKCdpZScsIGJyb3dzZXIuaWUpO1xuXG4gICAgcmV0dXJuIGJyb3dzZXI7XG59XG5cblxuZXhwb3J0IGNsYXNzIEJyb3dzZXIge1xuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xuICAgICAgICBicm93c2VyID0gZ2V0QnJvd3NlcigpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IFNsaWRlciB9IGZyb20gJy4vY29tcG9uZW50cy9TbGlkZXInO1xuaW1wb3J0IHsgVG9vbHRpcCB9IGZyb20gJy4vY29tcG9uZW50cy9Ub29sdGlwJztcbmltcG9ydCB7IERyb3Bkb3duIH0gZnJvbSAnLi9jb21wb25lbnRzL0Ryb3Bkb3duJztcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL2NvbXBvbmVudHMvRmlsdGVycyc7XG5pbXBvcnQgeyBEYXNoYm9hcmQgfSBmcm9tICcuL2NvbXBvbmVudHMvRGFzaGJvYXJkJztcbmltcG9ydCB7IFN0YXRzIH0gZnJvbSAnLi9jb21wb25lbnRzL1N0YXRzJztcbmltcG9ydCB7IE1hc29ucnkgfSBmcm9tICcuL2NvbXBvbmVudHMvTWFzb25yeSc7XG5pbXBvcnQgeyBSYW5nZSB9IGZyb20gJy4vY29tcG9uZW50cy9SYW5nZSc7XG5pbXBvcnQgeyBDaGFydCB9IGZyb20gJy4vY29tcG9uZW50cy9DaGFydCc7XG5pbXBvcnQgeyBBc2lkZSB9IGZyb20gJy4vY29tcG9uZW50cy9Bc2lkZSc7XG5pbXBvcnQgeyBQYXJhbGxheCB9IGZyb20gJy4vY29tcG9uZW50cy9QYXJhbGxheCc7XG5pbXBvcnQgeyBTZWFyY2ggfSBmcm9tICcuL2NvbXBvbmVudHMvU2VhcmNoJztcblxuaW1wb3J0IHsgUGFnZSB9IGZyb20gJy4vcGFnZXMvUGFnZSc7XG5cbmV4cG9ydCBjb25zdCBjb21wb25lbnRzID0ge1xuICAgIFNsaWRlcixcbiAgICBUb29sdGlwLFxuICAgIERyb3Bkb3duLFxuICAgIEZpbHRlcnMsXG4gICAgRGFzaGJvYXJkLFxuICAgIFN0YXRzLFxuICAgIE1hc29ucnksXG4gICAgUmFuZ2UsXG4gICAgQ2hhcnQsXG4gICAgQXNpZGUsXG4gICAgUGFyYWxsYXgsXG4gICAgU2VhcmNoLFxufTtcblxuXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XG4gICAgUGFnZVxufTtcblxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvY2xpcGJvYXJkLmQudHNcIiAvPlxuXG5cblxuZXhwb3J0IGNsYXNzIENvcHkge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICAkKCdbZGF0YS1jb3B5XScpLm9uKCdjbGljaycsIChlKTogdm9pZCA9PiB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgICAgICBjb25zdCB1cmwgPSB3aW5kb3cubG9jYXRpb24ub3JpZ2luICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xuXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcbiAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLmluZm8oJ1wiJXNcIiBjb3BpZWQnLCB1cmwpO1xuXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7ICRlbC5yZW1vdmVDbGFzcygnaXMtY29waWVkJyk7IH0sIDEwMDApO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJleHBvcnQgYWJzdHJhY3QgY2xhc3MgSGFuZGxlciB7XG5cblxuICAgIHByaXZhdGUgZXZlbnRzOiB7IFtrZXk6IHN0cmluZ106IEZ1bmN0aW9uW10gfTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgdGhpcy5ldmVudHMgPSB7fTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEF0dGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSAge3N0cmluZ30gICBldmVudE5hbWUgcGxlYXNlIHVzZSBzdGF0aWMgbmFtZXNcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XG4gICAgICovXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xuXG4gICAgICAgIGlmICggIXRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBEZXRhY2ggYW4gZXZlbnQgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxuICAgICAqIEByZXR1cm4ge0hhbmRsZXJ9ICAgICAgICAgICAgcmV0dXJucyBjdXJyZW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcblxuICAgICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgaGFuZGxlciA9PT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5ldmVudHNbZXZlbnROYW1lXSkge1xuICAgICAgICAgICAgdGhpcy5ldmVudHNbZXZlbnROYW1lXSA9IFtdO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uaW5kZXhPZihoYW5kbGVyKTtcblxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cblxuXG4gICAgLyoqXG4gICAgICogQ2FsbCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBldmVudE5hbWVcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cbiAgICAgKi9cbiAgICBwdWJsaWMgdHJpZ2dlcihldmVudE5hbWU6IHN0cmluZywgLi4uZXh0cmFQYXJhbWV0ZXJzKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKCAhdGhpcy5ldmVudHNbZXZlbnROYW1lXSApIHsgcmV0dXJuOyB9XG4gICAgICAgIGNvbnN0IGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgIH1cbn1cblxuIiwiZXhwb3J0IGNsYXNzIExvYWRlciB7XG5cbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XG4gICAgcHJpdmF0ZSB3aWR0aDogbnVtYmVyO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnkpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gMDtcbiAgICB9XG5cblxuXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IHk6IDAsIGR1cmF0aW9uOiAwLjIgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7IGR1cmF0aW9uOiAwLjUsIHk6IDEwLCB3aWR0aDogdGhpcy53aWR0aCB8fCAnMTAwJScgfSk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzZXQocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLnByb2dyZXNzID0gcHJvZ3Jlc3M7XG5cbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3LCBbJ3knXSk7XG5cbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xuaW1wb3J0IHsgU2Nyb2xsIH0gZnJvbSAnLi9TY3JvbGwnO1xuaW1wb3J0IHsgJGJvZHksICRhcnRpY2xlLCAkcGFnZUhlYWRlciB9IGZyb20gJy4vU2l0ZSc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcbmltcG9ydCB7IEFzaWRlIH0gZnJvbSAnLi9jb21wb25lbnRzL0FzaWRlJztcbi8vIGltcG9ydCB7IFNpZ251cCB9IGZyb20gJy4vU2lnbnVwJztcblxuXG4vKiB0c2xpbnQ6ZGlzYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcbi8qIHRzbGludDplbmFibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXG5cblxuXG5leHBvcnQgY2xhc3MgUHVzaFN0YXRlc0V2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgUFJPR1JFU1MgPSAncHJvZ3Jlc3MnO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBQdXNoU3RhdGVzO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgVElNRV9MSU1JVCA9IDUwMDA7XG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcblxuICAgIHByaXZhdGUgbG9hZGVkRGF0YTogc3RyaW5nO1xuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XG4gICAgcHJpdmF0ZSB0aW1lb3V0O1xuXG5cblxuICAgIC8qKiBjaGFuZ2UgZG9jdW1lbnQgdGl0bGUgKi9cbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGRvY3VtZW50LnRpdGxlID0gdGl0bGUgfHwgJCgnI21haW4gPiBbZGF0YS10aXRsZV0nKS5kYXRhKCd0aXRsZScpO1xuICAgIH1cblxuXG5cbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cbiAgICBwdWJsaWMgc3RhdGljIGdvVG8obG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXG4gICAgICAgICAgICBpc0RpZmZlcmVudCA9IHBhdGhuYW1lICE9PSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG5cbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XG4gICAgICAgICAgICBpZiAoISFyZXBsYWNlKSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHBhdGhuYW1lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZXBsYWNlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpc0RpZmZlcmVudDtcbiAgICB9XG5cblxuXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXG4gICAgcHVibGljIHN0YXRpYyBjaGFuZ2VQYXRoKGxvY2F0aW9uOiBzdHJpbmcsIHJlcGxhY2U/OiBib29sZWFuLCB0aXRsZT86IHN0cmluZyk6IHZvaWQge1xuXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xuICAgICAgICBsZXQgY2hhbmdlZCA9IFB1c2hTdGF0ZXMuZ29Ubyhsb2NhdGlvbiwgcmVwbGFjZSB8fCB0cnVlKTtcbiAgICAgICAgUHVzaFN0YXRlcy5ub0NoYW5nZSA9IGZhbHNlO1xuXG4gICAgICAgIGlmICghIWNoYW5nZWQpIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuc2V0VGl0bGUodGl0bGUgfHwgZG9jdW1lbnQudGl0bGUpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzIHRvIGJlIHVzZWQgd2l0aCBQdXNoU3RhdGVzIC8gSGlzdG9yeSAqL1xuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XG4gICAgICAgIGlmICghZWxlbWVudEl0c2VsZikge1xuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGlua3ModGFyZ2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmsodGFyZ2V0IGFzIEVsZW1lbnQpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGdvIGJhY2sgaW4gYnJvd3NlciBoaXN0b3J5XG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXG4gICAgICovXG4gICAgcHVibGljIHN0YXRpYyBiYWNrKHVybD86IHN0cmluZyk6IHZvaWQge1xuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5iYWNrKCk7XG4gICAgICAgIH0gZWxzZSBpZiAodXJsKSB7XG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCAnLycpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBzdGF0aWMgcmVsb2FkKCk6IHZvaWQge1xuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcblxuICAgICAgICBpZiAoISRwYWdlSGVhZGVyKSB7XG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XG4gICAgICAgICAgICAkYm9keS5hZGRDbGFzcygnbmF2YmFyLWFsd2F5cy1zaG93bicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZVRvZ2dsZSA9IChlPyk6IHZvaWQgPT4ge1xuICAgICAgICBsZXQgZWwgPSBlID8gJChlLmN1cnJlbnRUYXJnZXQpIDogJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xuICAgICAgICBcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKTtcbiAgICAgICAgZWwudG9nZ2xlQ2xhc3MoJ2lzLW9wZW4nKTtcblxuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2lzLW9wZW4nKSkge1xuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsnd2lsbC1jaGFuZ2UnOiAndHJhbnNmb3JtJ30pO1xuICAgICAgICAgICAgVXRpbHMuZGlzYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyBjbGVhclByb3BzOiAnd2lsbC1jaGFuZ2UnfSk7XG4gICAgICAgICAgICBVdGlscy5lbmFibGVCb2R5U2Nyb2xsaW5nKFNjcm9sbC5zY3JvbGxUb3ApO1xuICAgICAgICB9XG4gICAgICAgIEFzaWRlLmFzaWRlQW5pbWF0aW9uKCk7XG5cblxuICAgICAgICAvLyByZXR1cm47XG4gICAgfVxuXG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHN1cGVyKCk7XG5cbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xuICAgICAgICAgICAgdGhpcy5iaW5kTGlua3MoKTtcbiAgICAgICAgICAgIEhpc3Rvcnlqcy5BZGFwdGVyLmJpbmQod2luZG93LCAnc3RhdGVjaGFuZ2UnLCB0aGlzLm9uU3RhdGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZSA9IHRoaXM7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIGxvYWQgbmV3IGNvbnRlbnQgdmlhIGFqYXggYmFzZWQgb24gY3VycmVudCBsb2NhdGlvbjpcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcbiAgICAgKi9cbiAgICBwdWJsaWMgbG9hZCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBjYW5jZWwgb2xkIHJlcXVlc3Q6XG4gICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZGVmaW5lIHVybFxuICAgICAgICBjb25zdCBwYXRoOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIGNvbnN0IHNlYXJjaDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCB8fCAnJztcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcblxuICAgICAgICAvLyBkZWZpbmUgdGltZW91dFxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgIHRoaXMudGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdCkge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgUHVzaFN0YXRlcy5USU1FX0xJTUlUKTtcblxuICAgICAgICAvLyByZXR1cm4gcHJvbWlzZVxuICAgICAgICAvLyBhbmQgZG8gdGhlIHJlcXVlc3Q6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIC8vIGRvIHRoZSB1c3VhbCB4aHIgc3R1ZmY6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vcGVuKCdHRVQnLCB1cmwpO1xuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ1gtUmVxdWVzdGVkLVdpdGgnLCAnWE1MSHR0cFJlcXVlc3QnKTtcblxuICAgICAgICAgICAgLy8gb25sb2FkIGhhbmRsZXI6XG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Qub25sb2FkID0gKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQgIT09ICdhYm9ydCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMucmVxdWVzdCA9IG51bGw7XG4gICAgICAgICAgICAgICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2hpbmcgZXJyb3JzOlxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVqZWN0KEVycm9yKCdOZXR3b3JrIEVycm9yJykpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5vbnByb2dyZXNzID0gKGUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIC8vIHNlbmQgcmVxdWVzdDpcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvKiogZnVuY3Rpb24gY2FsbGVkIG9uIHN1Y2Nlc3NmdWwgZGF0YSBsb2FkICovXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcblxuICAgICAgICBjb25zdCBkYXRhOiBzdHJpbmcgPSB0aGlzLmxvYWRlZERhdGEudHJpbSgpO1xuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xuICAgICAgICBsZXQgcmVuZGVyZWRDb3VudCA9IDA7XG5cbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xuICAgICAgICAvLyBpZiBvbmx5IG9uZSBjb250YWluZXIsIGZvcmNlIGBwbGFpbmBcbiAgICAgICAgaWYgKGNvbnRhaW5lcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgcmVuZGVyZWRDb3VudCArPSB0aGlzLnJlbmRlckVsZW1lbnQoY29udGFpbmVyLCBkYXRhLCBpbmRleCA9PT0gMCAmJiBjb250YWluZXJzLmxlbmd0aCA9PT0gMSkgPyAxIDogMDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmUtdHJ5IHJlbmRlcmluZyBpZiBub25lIG9mIGNvbnRhaW5lcnMgd2VyZSByZW5kZXJlZDpcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnJlbmRlckVsZW1lbnQoJCgnI21haW4nKVswXSwgZGF0YSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XG5cbiAgICAgICAgLy8gZGlzcGF0Y2ggZ2xvYmFsIGV2ZW50IGZvciBzZXJkZWxpYSBDTVM6XG4gICAgICAgIHdpbmRvdy5kb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBFdmVudCgnYWpheF9sb2FkZWQnKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcmVuZGVyRWxlbWVudChlbDogSFRNTEVsZW1lbnQsIGRhdGE6IHN0cmluZywgZm9yY2VQbGFpbj86IGJvb2xlYW4pOiBib29sZWFuIHtcblxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gJyMnICsgZWwuaWQ7XG5cbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XG4gICAgICAgICAgICBjb2RlID0gZGF0YTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xuICAgICAgICAgICAgY29kZSA9ICRsb2FkZWRDb250ZW50Lmh0bWwoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29kZSkgeyBjb25zb2xlLmluZm8oYENvdWxkbid0IHJlcmVuZGVyICMke2VsLmlkfSBlbGVtZW50YCk7IHJldHVybiBmYWxzZTsgfVxuXG4gICAgICAgICQoY29udGFpbmVyKVxuICAgICAgICAgICAgLmhpZGUoKVxuICAgICAgICAgICAgLmVtcHR5KClcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcbiAgICAgICAgICAgIC5zaG93KCk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICAgICAgJCh0YXJnZXQpLm9mZignY2xpY2snKS5vbignY2xpY2suaGlzdG9yeScsIHRoaXMub25DbGljayk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBiaW5kIGxpbmtzICovXG4gICAgcHJpdmF0ZSBiaW5kTGlua3ModGFyZ2V0PzogRWxlbWVudCB8IE5vZGVMaXN0IHwgRWxlbWVudFtdIHwgc3RyaW5nKTogdm9pZCB7XG5cbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtYXBpXScpXG4gICAgICAgICAgICAubm90KCdbZG93bmxvYWRdJylcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCIjXCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmJD1cIi5qcGdcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJtYWlsdG86XCJdJylcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cInRlbDpcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXG4gICAgICAgICAgICAubm90KCdbZGF0YS1sb2dpbl0nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtbGFuZ10nKVxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxuICAgICAgICAgICAgLm5vdCgnW2hyZWZePVwiaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCArICdcIl0nKVxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKTtcblxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cIiNcIl0nKS5ub3QoJ1tocmVmPVwiI1wiXScpXG4gICAgICAgICAgICAub2ZmKCcuaGlzdG9yeScpXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcblxuXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XG4gICAgICAgIGNvbnN0IGFsdGVybmF0ZSA9ICQoJ1tkYXRhLWFsdGVybmF0ZV0nKS5kYXRhKCdhbHRlcm5hdGUnKTtcbiAgICAgICAgY29uc3QgYXJ0aWNsZVVSTCA9IGFsdGVybmF0ZSA/IGFsdGVybmF0ZVtsYW5nIHx8IE9iamVjdC5rZXlzKGFsdGVybmF0ZSlbMF1dIDogbnVsbDtcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XG4gICAgICAgIGNvbnN0IGhlYWRVUkwgPSBoZWFkTGluayA/IGhlYWRMaW5rLmhyZWYgOiBudWxsO1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uYXNzaWduKGFydGljbGVVUkwgfHwgaGVhZFVSTCB8fCBlLmN1cnJlbnRUYXJnZXQuaHJlZik7XG4gICAgfVxuXG5cblxuICAgIC8qKiBsaW5rcyBjbGljayBoYW5kbGVyICovXG4gICAgcHJpdmF0ZSBvbkNsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XG5cbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBsZXQgJHNlbGY6IEpRdWVyeSA9ICQoZS5jdXJyZW50VGFyZ2V0IGFzIEhUTUxFbGVtZW50KSxcbiAgICAgICAgICAgIHN0YXRlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdocmVmJykucmVwbGFjZSgnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCwgJycpLFxuICAgICAgICAgICAgdHlwZTogc3RyaW5nID0gJHNlbGYuYXR0cignZGF0YS1oaXN0b3J5Jyk7XG4gICAgICAgIFxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnYmFjaycpIHtcbiAgICAgICAgICAgICAgICBQdXNoU3RhdGVzLmJhY2soc3RhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAncmVwbGFjZScpIHtcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgc3RhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTY3JvbGwucmVzZXRTY3JvbGxDYWNoZShzdGF0ZSk7XG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnB1c2hTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMTAwMCk7XG4gICAgfVxuXG5cblxuICAgIC8qKiBvbiBoYXNoLWxpbmsgY2xpY2sgaGFuZGxlciAqL1xuICAgIHByaXZhdGUgb25IYXNoQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdjbGljayBsaW5rJyk7XG4gICAgICAgIGlmICgkYm9keS5oYXNDbGFzcygnaXMtYXNpZGUtb3BlbicpKSB7XG4gICAgICAgICAgICBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKCk7XG5cbiAgICAgICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICAvKiogSGlzdG9yeWpzIGBzdGF0ZWNoYW5nZWAgZXZlbnQgaGFuZGxlciAqL1xuICAgIHByaXZhdGUgb25TdGF0ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcbiAgICAgICAgaWYgKCFQdXNoU3RhdGVzLm5vQ2hhbmdlKSB7XG4gICAgICAgICAgICB0aGlzLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8qKiBtYXJrIGxpbmtzIGFzIGFjdGl2ZSAqL1xuICAgIHByaXZhdGUgc2V0QWN0aXZlTGlua3MoKTogdm9pZCB7XG4gICAgICAgICQoJ2FbaHJlZl0nKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICQoJ2FbaHJlZj1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgIH1cbn1cblxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvZ3NhcC5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL3NwbGl0LXRleHQuZC50c1wiIC8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xuaW1wb3J0IHsgUHVzaFN0YXRlcyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50Jztcbi8vIGltcG9ydCB7IFByb2dyZXNzYmFyIH0gZnJvbSAnLi9jb21wb25lbnRzL1Byb2dyZXNzYmFyJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcbmltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XG5pbXBvcnQgeyAkd2luZG93LCAkYm9keSB9IGZyb20gJy4vU2l0ZSc7XG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi9DbGFzc2VzJztcblxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kRGF0YSB7XG4gICAgaWQ6IHN0cmluZztcbiAgICBzdGVwOiBudW1iZXI7XG4gICAgZGFya2VuOiBib29sZWFuO1xuICAgIGRhcmtlbkRlbGF5OiBudW1iZXI7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVNjcm9sbFBhcmFtcyBleHRlbmRzIE9iamVjdCB7XG4gICAgeD86IG51bWJlcjtcbiAgICB5PzogbnVtYmVyO1xuICAgIHNwZWVkPzogbnVtYmVyO1xuICAgIGFuaW1hdGU/OiBib29sZWFuO1xuICAgIHJlbGF0aXZlU3BlZWQ/OiBib29sZWFuO1xuICAgIGVhc2U/OiBzdHJpbmc7XG59XG5cblxuaW50ZXJmYWNlIElCYXNlQ2FjaGVJdGVtIHtcbiAgICAkZWw/OiBKUXVlcnk7XG4gICAgZG9uZT86IGJvb2xlYW47XG4gICAgaGVpZ2h0PzogbnVtYmVyO1xuICAgIHN0YXJ0PzogbnVtYmVyO1xuICAgIHR5cGU/OiBzdHJpbmc7XG4gICAgeT86IG51bWJlcjtcbiAgICBjb21wb25lbnQ/OiBDb21wb25lbnQ7XG59XG5cbmludGVyZmFjZSBJU2Nyb2xsaW5nRGF0YSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICB0b3A6IG51bWJlcjtcbiAgICByb2xlOiBzdHJpbmc7XG4gICAgcGF0aD86IHN0cmluZztcbiAgICB0aXRsZT86IHN0cmluZztcbiAgICBib3R0b20/OiBudW1iZXI7XG4gICAgY2hpbGRyZW4/OiBhbnk7XG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xuICAgIGRlbGF5PzogbnVtYmVyO1xuICAgIHNob3duPzogYm9vbGVhbjtcbiAgICBpbml0aWFsaXplZD86IGJvb2xlYW47XG59XG5cbmludGVyZmFjZSBJUGFyYWxsYXhDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XG4gICAgc2hpZnQ/OiBudW1iZXI7XG4gICAgJGNoaWxkPzogSlF1ZXJ5O1xuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgSUFuaW1hdGlvbkNhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBkZWxheT86IG51bWJlcjtcbiAgICB1bmNhY2hlPzogYm9vbGVhbjtcbn1cblxuaW50ZXJmYWNlIElTY3JvbGxDYWNoZSB7XG4gICAgYW5pbWF0aW9ucz86IElBbmltYXRpb25DYWNoZUl0ZW1bXTtcbiAgICBwYXJhbGxheGVzPzogSVBhcmFsbGF4Q2FjaGVJdGVtW107XG4gICAgbW9kdWxlcz86IElCYXNlQ2FjaGVJdGVtW107XG4gICAgYmFja2dyb3VuZHM/OiBJQmFja2dyb3VuZENhY2hlSXRlbVtdO1xuICAgIHNlY3Rpb25zPzogSVNjcm9sbGluZ0RhdGFbXTtcblxufVxuXG5pbnRlcmZhY2UgSUJhY2tncm91bmRDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFja2dyb3VuZERhdGEsIElCYXNlQ2FjaGVJdGVtIHtcbiAgICBwZXJjZW50YWdlPzogbnVtYmVyO1xuICAgIGluZGV4PzogbnVtYmVyO1xuICAgIHNob3duPzogYm9vbGVhbjtcbiAgICBkZWxheT86IG51bWJlcjtcbiAgICBicmVha3BvaW50cz86IHN0cmluZ1tdO1xufVxuXG5cblxuZXhwb3J0IGNsYXNzIFNjcm9sbCB7XG5cbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTY3JvbGw7XG4gICAgcHVibGljIHN0YXRpYyB3aW5kb3dIZWlnaHQ6IG51bWJlcjtcbiAgICBwdWJsaWMgc3RhdGljIGhlYWRlckhlaWdodDogbnVtYmVyO1xuICAgIHB1YmxpYyBzdGF0aWMgbWF4U2Nyb2xsOiBudW1iZXI7XG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlZDogYm9vbGVhbjtcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvcDogbnVtYmVyO1xuICAgIC8vIHB1YmxpYyBzdGF0aWMgY3VzdG9tU2Nyb2xsOiBTY3JvbGxiYXI7XG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VzdG9tU2Nyb2xsO1xuICAgIHByaXZhdGUgc3RhdGljIGFuaW1hdGluZzogYm9vbGVhbiA9IGZhbHNlO1xuXG5cbiAgICBwcml2YXRlIGNhY2hlOiBJU2Nyb2xsQ2FjaGUgPSB7fTtcbiAgICBwcml2YXRlIHNjcm9sbENhY2hlID0ge307XG4gICAgcHJpdmF0ZSBpZ25vcmVDYWNoZTogYm9vbGVhbjtcbiAgICBwcml2YXRlIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XG4gICAgcHJpdmF0ZSB0YXJnZXQ6IEpRdWVyeTtcbiAgICBwcml2YXRlIHN0b3JlZFBhdGg6IHN0cmluZztcbiAgICBwcml2YXRlIHNlY3Rpb25zOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBjaGFuZ2luZ1BhdGg6IGJvb2xlYW47XG5cblxuICAgIC8qKlxuICAgICAqIHNjcm9sbHMgcGFnZSB0byBjZXJ0YWluIGVsZW1lbnQgKHRvcCBlZGdlKSB3aXRoIHNvbWUgc3BlZWRcbiAgICAgKiBAcGFyYW0gIHtKUXVlcnl9ICAgICAgICAkZWwgICAgW3RhcmdldCBlbG1lbnRdXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgb2Zmc2V0XG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgZHVyYXRpb25cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fSAgICAgICAgW2FmdGVyIGNvbXBsZXRlZCBhbmltYXRpb25dXG4gICAgICovXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvRWxlbWVudCgkZWw6IEpRdWVyeSwgb2Zmc2V0PzogbnVtYmVyLCBkdXJhdGlvbj86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSB0cnVlO1xuICAgICAgICAgICAgY29uc3QgeSA9ICRlbC5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0ICsgKG9mZnNldCB8fCAwKTtcbiAgICAgICAgICAgIGNvbnN0IG9iaiA9IHtcbiAgICAgICAgICAgICAgICB5OiBNYXRoLm1heChkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCwgd2luZG93LnBhZ2VZT2Zmc2V0KSxcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKG9iaik7XG4gICAgICAgICAgICBnc2FwLnRvKG9iaiwge1xuICAgICAgICAgICAgICAgIHk6IHksXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0eXBlb2YgZHVyYXRpb24gPT09ICd1bmRlZmluZWQnID8gMSA6IGR1cmF0aW9uLFxuICAgICAgICAgICAgICAgIG9uVXBkYXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBvYmoueSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIHN0YXRpYyByZXNldFNjcm9sbENhY2hlKHBhdGhuYW1lKTogdm9pZCB7XG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5jYWNoZVtwYXRobmFtZV0gPSAwO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdGF0aWMgZGlzYWJsZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgc3RhdGljIGVuYWJsZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5hbmltYXRpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xuICAgIH1cblxuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICB0aGlzLmlnbm9yZUNhY2hlID0gISFicm93c2VyLnNhZmFyaTtcblxuICAgICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xuICAgICAgICAvLyAkKCdhW2hyZWZePVwiI1wiXTpub3QoXCIuanMtbmF2LWl0ZW0sIFtkYXRhLWxpZ2h0Ym94XVwiKScpLm9uKCdjbGljaycsIHRoaXMub25IYXNoQ2xpY2tIYW5kbGVyKTtcbiAgICAgICAgdGhpcy5iYWNrZ3JvdW5kcyA9IHRoaXMuYnVpbGRCYWNrZ3JvdW5kcygpO1xuICAgICAgICAvLyBTY3JvbGwuaXNDdXN0b21TY3JvbGwgPSAkKCcjd3BicycpLmRhdGEoJ3Njcm9sbGJhcicpO1xuXG4gICAgICAgIFNjcm9sbC5oZWFkZXJIZWlnaHQgPSA3MDtcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlID0gdGhpcztcblxuICAgICAgICB0aGlzLnN0b3JlZFBhdGggPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XG4gICAgICAgIHRoaXMudGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XG4gICAgICAgIHRoaXMuc2VjdGlvbnMgPSAkKCdbZGF0YS1zY3JvbGxdJyk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlc2l6ZSgpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLndpbmRvd0hlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9ICQoJyNuYXZiYXInKS5oZWlnaHQoKTtcbiAgICAgICAgU2Nyb2xsLm1heFNjcm9sbCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIFNjcm9sbC53aW5kb3dIZWlnaHQgKyBTY3JvbGwuaGVhZGVySGVpZ2h0O1xuXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcblxuXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XG4gICAgfVxuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcbiAgICBwdWJsaWMgc3RhdGljIHNjcm9sbFRvUGF0aChmYXN0PzogYm9vbGVhbik6IGJvb2xlYW4ge1xuXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcblxuICAgICAgICBpZiAoJHRhcmdldFswXSkge1xuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkdGFyZ2V0LCAwLCAwKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICghIXRoaXMuY2hhbmdpbmdQYXRoKSB7IHJldHVybiBmYWxzZTsgfVxuICAgICAgICByZXR1cm4gU2Nyb2xsLnNjcm9sbFRvUGF0aCgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xuICAgICAgICBTY3JvbGwuZGlzYWJsZSgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBsb2FkKCk6IHZvaWQge1xuICAgICAgICB0aGlzLnNlY3Rpb25zID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpLm9uKCdzY3JvbGwuc2Nyb2xsaW5nJywgKCkgPT4gdGhpcy5vblNjcm9sbCgpKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyBzdGFydCgpOiB2b2lkIHtcbiAgICAgICAgU2Nyb2xsLmVuYWJsZSgpO1xuICAgICAgICBTY3JvbGwuaW5zdGFuY2Uub25TY3JvbGwoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jYWNoZSA9IHt9O1xuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpO1xuICAgIH1cblxuICAgIC8vIHByaXZhdGUgb25IYXNoQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAvLyAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vICAgICAvLyBlLnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgLy8gICAgIGlmICgkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpKSB7XG4gICAgLy8gICAgICAgICBsZXQgb2Zmc2V0ID0gcGFyc2VJbnQoJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKSwgMTApO1xuXG4gICAgLy8gICAgICAgICBpZiAoIHR5cGVvZiAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpID09PSAnc3RyaW5nJyApIHtcbiAgICAvLyAgICAgICAgICAgICBjb25zdCBvZmYgPSAkKGUudGFyZ2V0KS5hdHRyKCdkYXRhLW9mZnNldCcpLnJlcGxhY2UoJ3ZoJywgJycpO1xuICAgIC8vICAgICAgICAgICAgIG9mZnNldCA9ICQod2luZG93KS5oZWlnaHQoKSAqIChwYXJzZUludChvZmYsIDEwKSAvIDEwMCk7XG4gICAgLy8gICAgICAgICB9XG5cbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCksIG9mZnNldCk7XG4gICAgLy8gICAgIH0gZWxzZSB7XG4gICAgLy8gICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH07XG5cblxuICAgIHByaXZhdGUgYnVpbGRCYWNrZ3JvdW5kcygpOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZCB9IHtcbiAgICAgICAgbGV0IGJncyA9IHt9O1xuICAgICAgICAkKCdbZGF0YS1iZy1jb21wb25lbnRdJykudG9BcnJheSgpLmZvckVhY2goKGVsLCBpKSA9PiB7XG4gICAgICAgICAgICBsZXQgJGJnRWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGxldCBiZ05hbWUgPSAkYmdFbC5kYXRhKCdiZy1jb21wb25lbnQnKTtcbiAgICAgICAgICAgIGxldCBiZ09wdGlvbnMgPSAkYmdFbC5kYXRhKCdvcHRpb25zJyk7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudHNbYmdOYW1lXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiZyA9IG5ldyBjb21wb25lbnRzW2JnTmFtZV0oJGJnRWwsIGJnT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgYmcuaWQgPSBlbC5pZDtcbiAgICAgICAgICAgICAgICBiZ3NbZWwuaWRdID0gYmc7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBjb21wb25lbnQgYXZhaWxhYmxlIScsIGJnTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhiZ3MsICdCR1MgU0NST0xMJyk7XG4gICAgICAgIHJldHVybiBiZ3M7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHNhdmVDYWNoZSgpOiB2b2lkIHtcbiAgICAgICAgLy8gaWYgKCF0aGlzLmVsZW1lbnRzKSB7IHJldHVybjsgfVxuICAgICAgICBjb25zdCBhbmltYXRpb25zOiBBcnJheTxJQW5pbWF0aW9uQ2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICBjb25zdCBtYXJnaW4gPSAwIDtcblxuICAgICAgICAvLyBsZXQgc2VjdGlvbnM6IEFycmF5PElTY3JvbGxpbmdEYXRhPiA9IFtdO1xuICAgICAgICAvLyBpZiAodGhpcy5zZWN0aW9ucykge1xuXG4gICAgICAgIC8vICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2VjdGlvbnMubGVuZ3RoOyArK2kpIHtcblxuICAgICAgICAvLyAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gdGhpcy5zZWN0aW9ucy5lcShpKTtcbiAgICAgICAgLy8gICAgICAgICBjb25zdCByb2xlID0gJGVsLmRhdGEoJ3Njcm9sbCcpO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHRvcCA9ICRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgaGVpZ2h0ID0gJGVsLm91dGVySGVpZ2h0KCk7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGVsYXkgPSAkZWwuZGF0YSgnZGVsYXknKSB8fCAwO1xuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHRpdGxlID0gJGVsLmRhdGEoJ3RpdGxlJykgfHwgZmFsc2U7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgcGF0aCA9ICRlbC5kYXRhKCdwYXRoJykgfHwgZmFsc2U7XG4gICAgICAgIC8vICAgICAgICAgY29uc3QgZGF0YTogSVNjcm9sbGluZ0RhdGEgPSB7XG4gICAgICAgIC8vICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAvLyAgICAgICAgICAgICByb2xlOiByb2xlLFxuICAgICAgICAvLyAgICAgICAgICAgICB0b3A6IHRvcCxcbiAgICAgICAgLy8gICAgICAgICAgICAgaGVpZ2h0OiBoZWlnaHQsXG4gICAgICAgIC8vICAgICAgICAgICAgIGJvdHRvbTogdG9wICsgaGVpZ2h0LFxuICAgICAgICAvLyAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAvLyAgICAgICAgICAgICB0aXRsZTogdGl0bGUsXG4gICAgICAgIC8vICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcbiAgICAgICAgLy8gICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXG4gICAgICAgIC8vICAgICAgICAgICAgIGNoaWxkcmVuOiB7fSxcbiAgICAgICAgLy8gICAgICAgICAgICAgc2hvd246ICRlbC5kYXRhKCdzaG93bicpIHx8IGZhbHNlLFxuICAgICAgICAvLyAgICAgICAgICAgICBkZWxheTogZGVsYXksXG4gICAgICAgIC8vICAgICAgICAgfTtcblxuICAgICAgICAvLyAgICAgICAgIHNlY3Rpb25zLnB1c2goZGF0YSk7XG4gICAgICAgIC8vICAgICAgICAgJGVsLmRhdGEoJ2NhY2hlJywgaSk7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vIH1cblxuXG4gICAgICAgICQoJ1tkYXRhLWFuaW1hdGlvbl0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcbiAgICAgICAgICAgIGFuaW1hdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgJGVsOiAkZWwsXG4gICAgICAgICAgICAgICAgc3RhcnQ6IHR5cGVvZiAkZWwuZGF0YSgnc3RhcnQnKSAhPT0gJ3VuZGVmaW5lZCcgPyAkZWwuZGF0YSgnc3RhcnQnKSA6IDAuMSxcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wIC0gbWFyZ2luLFxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXG4gICAgICAgICAgICAgICAgZG9uZTogJGVsLmhhc0NsYXNzKCdhbmltYXRlZCcpLFxuICAgICAgICAgICAgICAgIHR5cGU6ICRlbC5kYXRhKCdhbmltYXRpb24nKSxcbiAgICAgICAgICAgICAgICBkZWxheTogJGVsLmRhdGEoJ2RlbGF5JykgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICB1bmNhY2hlOiAkZWwuZGF0YSgndW5jYWNoZScpLFxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogJGVsLmRhdGEoJ2NvbXAnKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuXG5cbiAgICAgICAgY29uc3QgcGFyYWxsYXhlczogQXJyYXk8SVBhcmFsbGF4Q2FjaGVJdGVtPiA9IFtdO1xuICAgICAgICAkKCdbZGF0YS1wYXJhbGxheF0nKS5lYWNoKChpOiBudW1iZXIsIGVsOiBFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKDxIVE1MRWxlbWVudD5lbCk7XG4gICAgICAgICAgICBjb25zdCBwID0gJGVsLmRhdGEoJ3BhcmFsbGF4Jyk7XG4gICAgICAgICAgICBwYXJhbGxheGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgIHN0YXJ0OiAwLFxuICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgcCA9PT0gJ3N0cmluZycgPyBwIDogbnVsbCxcbiAgICAgICAgICAgICAgICBzaGlmdDogdHlwZW9mIHAgPT09ICdudW1iZXInID8gcCA6IG51bGwsXG4gICAgICAgICAgICAgICAgZG9uZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxuICAgICAgICAgICAgICAgIGNoaWxkSGVpZ2h0OiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLmhlaWdodCgpLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBiYWNrZ3JvdW5kczogQXJyYXk8SUJhY2tncm91bmRDYWNoZUl0ZW0+ID0gW107XG4gICAgICAgICQoJ1tkYXRhLWJhY2tncm91bmRdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XG4gICAgICAgICAgICBjb25zdCBiYWNrZ3JvdW5kRGF0YSA9ICRlbC5kYXRhKCdiYWNrZ3JvdW5kJyk7XG4gICAgICAgICAgICBjb25zdCBicmVha3BvaW50cyA9IGJhY2tncm91bmREYXRhLmJyZWFrcG9pbnRzIHx8IFsnZGVza3RvcCcsICd0YWJsZXQnLCAncGhvbmUnXTtcblxuICAgICAgICAgICAgaWYgKGJyZWFrcG9pbnRzLmluZGV4T2YoYnJlYWtwb2ludC52YWx1ZSkgPj0gMCkge1xuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iYWNrZ3JvdW5kc1tiYWNrZ3JvdW5kRGF0YS5pZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCd0aGVyZVxcJ3Mgbm8gYmFja2dyb3VuZCB3aXRoIGlkPScgKyBiYWNrZ3JvdW5kRGF0YS5pZCArICchJyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZHMucHVzaCgkLmV4dGVuZCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWw6ICRlbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6ICRlbC5vZmZzZXQoKS50b3AsXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnQ6IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtlbkRlbGF5OiAwLFxuICAgICAgICAgICAgICAgICAgICB9LCBiYWNrZ3JvdW5kRGF0YSB8fCB7fSkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuXG4gICAgICAgIHRoaXMuY2FjaGUuYW5pbWF0aW9ucyA9IGFuaW1hdGlvbnM7XG4gICAgICAgIHRoaXMuY2FjaGUucGFyYWxsYXhlcyA9IHBhcmFsbGF4ZXM7XG4gICAgICAgIHRoaXMuY2FjaGUuYmFja2dyb3VuZHMgPSBiYWNrZ3JvdW5kcztcbiAgICAgICAgLy8gdGhpcy5jYWNoZS5zZWN0aW9ucyA9IHNlY3Rpb25zO1xuXG5cblxuICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25TY3JvbGwgPSAoKTogdm9pZCA9PiB7XG5cbiAgICAgICAgaWYgKFNjcm9sbC5kaXNhYmxlZCB8fCAkYm9keS5oYXNDbGFzcygnaXMtYXNpZGUtb3BlbicpKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGNvbnN0IHNUID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgMDtcbiAgICAgICAgY29uc3Qgd2luZG93SGVpZ2h0ID0gU2Nyb2xsLndpbmRvd0hlaWdodDtcbiAgICAgICAgY29uc3Qgc2NyZWVuQ2VudGVyOiBudW1iZXIgPSBzVCArIFNjcm9sbC53aW5kb3dIZWlnaHQgKiAwLjMzO1xuICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBTY3JvbGwuaGVhZGVySGVpZ2h0O1xuICAgICAgICBjb25zdCBzY3JvbGxlbmQgPSAkKCcjbWFpbicpLm91dGVySGVpZ2h0KCkgLSB3aW5kb3cuaW5uZXJIZWlnaHQgLSAyO1xuICAgICAgICBjb25zdCBwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpLm9mZnNldCgpLnRvcCAtIChTY3JvbGwuaGVhZGVySGVpZ2h0ICogMikgOiAwO1xuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kcyA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0IDogMDtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvcCA9IHNUO1xuICAgICAgICB0aGlzLnNjcm9sbENhY2hlW3dpbmRvdy5sb2NhdGlvbi5wYXRobmFtZV0gPSBzVDtcblxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtc2Nyb2xsZWQtd2luZG93LWhlaWdodCcsIHNUID4gd2luZG93SGVpZ2h0IC0gMTAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkLW5hdmJhcicsIHNUID4gMTAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkJywgc1QgPiAwKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnLCBzVCA+IHBhZ2VIZWFkZXIpO1xuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtYmFja2dyb3VuZHMtc2Nyb2xsZWQnLCBzVCA+IGJhY2tncm91bmRzKTtcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbC1lbmQnLCBzVCA+PSBzY3JvbGxlbmQpO1xuXG5cbiAgICAgICAgLy8gYW5pbWF0aW9uczpcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYW5pbWF0aW9ucyAmJiB0aGlzLmNhY2hlLmFuaW1hdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLmFuaW1hdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtOiBJQW5pbWF0aW9uQ2FjaGVJdGVtID0gdGhpcy5jYWNoZS5hbmltYXRpb25zW2ldO1xuICAgICAgICAgICAgICAgIGNvbnN0IHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCB5VG9wOiBudW1iZXIgPSBzVDtcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbUhlaWdodDogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLmhlaWdodCA6IGl0ZW0uJGVsLmhlaWdodCgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRvbmUgJiYgaXRlbVkgPD0geUJvdHRvbSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1aWNrOiBib29sZWFuID0geVRvcCA+PSBpdGVtWSArIGl0ZW1IZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmNvbXBvbmVudCAmJiBpdGVtLnR5cGUgPT09ICd0b2dnbGUnICYmIHR5cGVvZiBpdGVtLmNvbXBvbmVudFsnZW5hYmxlJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydlbmFibGUnXSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hbmltYXRlKGl0ZW0sIGl0ZW0uJGVsLCBpdGVtLnR5cGUsIGl0ZW0uZGVsYXksIHF1aWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLmRvbmUgJiYgaXRlbS5jb21wb25lbnQgJiYgaXRlbS50eXBlID09PSAndG9nZ2xlJyAmJiAoaXRlbVkgPiB5Qm90dG9tIHx8IGl0ZW1ZICsgaXRlbUhlaWdodCA8IHlUb3ApKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGl0ZW0pO1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udW5jYWNoZSAmJiBpdGVtLmRvbmUgJiYgKHNUIDw9IGl0ZW1ZIC0gd2luZG93SGVpZ2h0IHx8IHNUID49IGl0ZW1ZICsgd2luZG93SGVpZ2h0ICkpIHtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5sZW5ndGggPiAwKSB7IGl0ZW0uJGVsLmZpbmQoJy51bmNhY2hlZCcpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmF0dHIoJ2RhdGEtdW5jYWNoZScpKSB7IGl0ZW0uJGVsLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cbiAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGVkJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgICAgICAvLyBwYXJhbGxheGVzOlxuICAgICAgICBpZiAodGhpcy5jYWNoZS5wYXJhbGxheGVzICYmIHRoaXMuY2FjaGUucGFyYWxsYXhlcy5sZW5ndGggPiAwICYmIGJyZWFrcG9pbnQuZGVza3RvcCkge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFsbGF4KHRoaXMuY2FjaGUucGFyYWxsYXhlc1tpXSwgc1QsIHdpbmRvd0hlaWdodCwgLWhlYWRlckhlaWdodCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG5cbiAgICAgICAgLy9iZ3NcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMpIHtcblxuICAgICAgICAgICAgY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwLjUgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICAvLyBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICBsZXQgYmdzVG9TaG93ID0gW107XG4gICAgICAgICAgICBsZXQgYmdzVG9IaWRlID0gW107XG5cblxuICAgICAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcy5mb3JFYWNoKChpdGVtOiBJQmFja2dyb3VuZENhY2hlSXRlbSwgaW5kZXgpID0+IHtcblxuXG4gICAgICAgICAgICAgICAgY29uc3QgaXRlbVk6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS55IDogaXRlbS4kZWwub2Zmc2V0KCkudG9wO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1IZWlnaHQ6IG51bWJlciA9ICF0aGlzLmlnbm9yZUNhY2hlID8gaXRlbS5oZWlnaHQgOiBpdGVtLiRlbC5vdXRlckhlaWdodCgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Cb3R0b206IG51bWJlciA9IGl0ZW1ZICsgaXRlbUhlaWdodDtcbiAgICAgICAgICAgICAgICBjb25zdCB5Q2VudGVyID0gKHR5cGVvZiBpdGVtLnN0YXJ0ICE9PSAndW5kZWZpbmVkJykgPyBzVCArIGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XG4gICAgICAgICAgICAgICAgLy8gY29uc3QgeUNlbnRlciA9ICh0eXBlb2YgaXRlbS5zdGFydCAhPT0gJ3VuZGVmaW5lZCcpID8gaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGJhY2tncm91bmQgPSB0aGlzLmJhY2tncm91bmRzW2l0ZW0uaWRdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbGF5ID0gdHlwZW9mIGl0ZW0uZGVsYXkgIT09ICd1bmRlZmluZWQnID8gaXRlbS5kZWxheSA6IDAuMTtcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gLSAoaXRlbVkgLSB5Q2VudGVyKSAvIGl0ZW1IZWlnaHQ7XG4gICAgICAgICAgICAgICAgbGV0IGJhY2tncm91bmRRdWlja1NldHVwID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgbGV0IGN1cnJlbnQgPSAkYm9keS5oYXNDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcpID8gc1QgKyB3aW5kb3dIZWlnaHQgPj0gaXRlbVkgJiYgaXRlbVkgKyBpdGVtSGVpZ2h0ID49IHNUIDogaXRlbVkgLSBzVCA8PSB3aW5kb3dDZW50ZXIgJiYgaXRlbUJvdHRvbSAtIHNUID49IHdpbmRvd0NlbnRlcjtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmFuaW1hdGlvbkluKGZhbHNlLCAyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50KSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFpdGVtLnNob3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIGRlbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLnVwZGF0ZShwZXJjZW50YWdlKTtcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5zZXRTdGVwKGl0ZW0uc3RlcCwgYmFja2dyb3VuZFF1aWNrU2V0dXApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS5kYXJrZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuZGFya2VuKGl0ZW1ZIDw9IHlDZW50ZXIgLSB3aW5kb3dIZWlnaHQgKiBpdGVtLmRhcmtlbkRlbGF5KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBiZ3NUb1Nob3cucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCEhaXRlbS5zaG93bikge1xuICAgICAgICAgICAgICAgICAgICBiZ3NUb0hpZGUucHVzaChpdGVtLmlkKTtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGlmIChiZ3NUb0hpZGUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgYmdzVG9IaWRlLmZvckVhY2goKGJnSUQpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJnc1RvU2hvdy5pbmRleE9mKGJnSUQpIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5hbmltYXRpb25PdXQoZmFsc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5zaG93bj0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIFByb2dyZXNzYmFyLnVwZGF0ZShzVCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG5cblxuICAgIHByaXZhdGUgYW5pbWF0ZShkYXRhOiBJQW5pbWF0aW9uQ2FjaGVJdGVtLCAkZWw6IEpRdWVyeSwgdHlwZTogc3RyaW5nLCBkZWxheTogbnVtYmVyID0gMC4xIGFzIG51bWJlciwgcXVpY2s/OiBib29sZWFuLCB1bmNhY2hlPzogYm9vbGVhbik6IHZvaWQge1xuXG4gICAgICAgIGNvbnN0IHRpbWUgPSAhcXVpY2sgPyAuNiA6IDA7XG5cbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGUnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRlbC5kYXRhKCd1bmNhY2hlJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygndW5jYWNoZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVVcCc6XG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHk6IHRydWUgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAsIHk6IDQwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuXG4gICAgICAgICAgICAgICAgaWYgKCRlbC5kYXRhKCd1bmNhY2hlJykgPT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygndW5jYWNoZWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVEb3duJzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeTogLTEwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdmYWRlUmlnaHQnOlxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlLCB4OiB0cnVlIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAtMTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeDogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVMZWZ0JzpcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeDogdHJ1ZSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeDogMTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeDogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2lUYWJzJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGxUZXh0ID0gJGVsLmZpbmQoJ3NwYW46Zmlyc3QtY2hpbGQnKTtcbiAgICAgICAgICAgICAgICBjb25zdCByVGV4dCA9ICRlbC5maW5kKCdzcGFuOmxhc3QtY2hpbGQnKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGxUZXh0LCB7IGR1cmF0aW9uOiAwLjUsIHg6ICc1MCUnLCBvcGFjaXR5OiAwIH0sIHsgeDogJzAlJywgb3BhY2l0eTogMSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhyVGV4dCwgeyBkdXJhdGlvbjogMC41LCB4OiAnLTUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2VsZW1lbnRzJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbC5maW5kKCdbZGF0YS12aWV3LXRhYl0nKSwgeyBkdXJhdGlvbjogMSwgeTogJzEwMCUnIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgeTogJzAlJywgc3RhZ2dlcjogMC4yLFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcuaXRlbV9fdGFicycpLCB7IGR1cmF0aW9uOiAxLCBvdmVyZmxvdzogJ3Vuc2V0JyB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2ZhY3QnOlxuXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBsZXQgZlRleHQgPSAkZWwuZmluZCgnLmZhY3RfX3RleHQgc3BhbicpLFxuICAgICAgICAgICAgICAgICAgICBzcGxpdEZUeHQgPSBuZXcgU3BsaXRUZXh0KGZUZXh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnfSksXG4gICAgICAgICAgICAgICAgICAgIGZJbWcgPSAkZWwuZmluZCgnLmZhY3RfX2ltYWdlLXdyYXAnKSxcbiAgICAgICAgICAgICAgICAgICAgZkFyciA9ICRlbC5maW5kKCcuZmFjdF9faWNvbicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSgpXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oZkFyciwgeyBkdXJhdGlvbjogMSwgcm90YXRlOiA5MCB9LCB7IHJvdGF0ZTogMCwgZGVsYXk6IDAuNSB9KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKHNwbGl0RlR4dC5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTUgfSwgeyB4OiAwLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjAxIH0sICctPTAuOCcpXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oZkltZywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSB9LCAnLT0wLjUnKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdsZWFkJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0ID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGxpbmVzJywgbGluZXNDbGFzczogJ2xpbmUnIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxpbmVzID0gJGVsLmZpbmQoJy5saW5lJyk7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICQobGluZXNbaV0pLmFmdGVyKCc8YnI+Jyk7XG4gICAgICAgICAgICAgICAgICAgICQobGluZXNbaV0pLmFwcGVuZCgnPHNwYW4gY2xhc3M9XCJsaW5lX19iZ1wiPjwvc3Bhbj4nKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdC53b3JkcywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMSwgZGVsYXk6IDAuNCB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcubGluZV9fYmcnKSwgeyBkdXJhdGlvbjogMC43NSwgc2NhbGVYOiAxLCBzdGFnZ2VyOiAwLjF9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdzY2FsZSc6XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDB9LHtzY2FsZVg6IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkZWxheX0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0SCA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRILmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDAsIG9wYWNpdHk6IDAgfSwgeyBzY2FsZVg6IDEsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnY2hhcnMtc2ltcGxlJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0SDIgPSBuZXcgU3BsaXRUZXh0KCRlbC5jaGlsZHJlbigpLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0SDIuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3dvcmRzLXNpbXBsZSc6XG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB3b3JkcyA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzJyB9KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZ2VyID0gJGVsLmRhdGEoJ3N0YWdnZXInKSA/ICRlbC5kYXRhKCdzdGFnZ2VyJykgOiAwLjI7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8od29yZHMud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiBzdGFnZ2VyfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaW1hZ2VzJzpcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbC5maW5kKCdpbWcnKSwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOTUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSwgc3RhZ2dlcjogMC4yIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ2hlcm8nOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgbWFwID0gJGVsLmZpbmQoJ1tkYXRhLWl0ZW09XCIwXCJdIC5qcy1tYXAnKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvRWwgPSAkZWwuZmluZCgnW2RhdGEtY2FwdGlvbj1cIjBcIl0gLmpzLWVsJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgaGVyb0NhcHRpb24gPSAkZWwuZmluZCgnW2RhdGEtY2FwdGlvbj1cIjBcIl0nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvTmF2ID0gJGVsLmZpbmQoJy5qcy1uYXZpZ2F0aW9uJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldChbbWFwLCBoZXJvRWwsIGhlcm9OYXZdLCB7IG9wYWNpdHk6IDB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKG1hcCwgMS41LCB7ZHVyYXRpb246IDEuNSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuODUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSxcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWFwLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oaGVyb0NhcHRpb24sIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDAuNSxcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaGVyb0NhcHRpb24ucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9DYXB0aW9uLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhoZXJvRWwsIDEsIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTIwfSwge29wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAxLjI1LCBzdGFnZ2VyOiAwLjIsXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oaGVyb05hdiwgMSwge2R1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMS41LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZXJvRWwucmVtb3ZlQXR0cignc3R5bGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaXMtcmVhZHknKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgIGNhc2UgJ3F1b3RlJzpcbiAgICAgICAgICAgICAgICBjb25zdCAkcXVvdGUgPSAkZWwuZmluZCgnLmpzLXF1b3RlLXdvcmRzJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGF1dGhvciA9ICRlbC5maW5kKCcuanMtcXVvdGUtYXV0aG9yJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgJGxpbmUgPSAkZWwuZmluZCgnaHInKTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFskcXVvdGUsICRlbCwgJGF1dGhvcl0sIHsgb3BhY2l0eTogMSB9KTtcblxuICAgICAgICAgICAgICAgIGNvbnN0IGNoaWxkID0gJHF1b3RlLmNoaWxkcmVuKCk7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRRdW90ZSA9IG5ldyBTcGxpdFRleHQoJHF1b3RlLCB7IHR5cGU6ICd3b3JkcycgfSk7XG5cbiAgICAgICAgICAgICAgICAvLyBGT1IgVU5DQUNIRSBPUFRJT04gT0YgQU5JTUFUSU9OIFFVT1RFXG4gICAgICAgICAgICAgICAgLy8gZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0UXVvdGUud29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgc3BsaXRRdW90ZS53b3Jkc1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgIC8vIH1cblxuICAgICAgICAgICAgICAgIGdzYXAudGltZWxpbmUoe1xuICAgICAgICAgICAgICAgICAgICBhdXRvUmVtb3ZlQ2hpbGRyZW46IHRydWUsXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnNldCgkcXVvdGUsIHsgb3BhY2l0eTogMSB9KVxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGNoaWxkLCAwLjUsIHsgb3BhY2l0eTogMCB9LCB7IG9wYWNpdHk6IDEsIGVhc2U6ICdwb3dlcjMnIH0sICcrPScgKyBkZWxheSlcbiAgICAgICAgICAgICAgICAgICAgLmZyb20oc3BsaXRRdW90ZS53b3JkcywgMC41LCB7IG9wYWNpdHk6IDAsIHg6IDgsIHRyYW5zZm9ybU9yaWdpbjogJzAlIDEwMCUnLCBlYXNlOiAncG93ZXIzJywgc3RhZ2dlcjogMC4wNSB9LCAwLjEpXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oJGF1dGhvciwgMC43LCB7IG9wYWNpdHk6IDAsIHg6IC0xMCB9LCB7IG9wYWNpdHk6IDEsIHg6IDAgfSwgJy09JyArIDAuMylcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkbGluZSwgeyBkdXJhdGlvbjogMC43LCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEgfSwgJy09MC4zJyk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnd29yZHMnOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGNvbnN0IHR4dCA9ICRlbDtcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdHR4dCA9IG5ldyBTcGxpdFRleHQodHh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXR0eHQuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcblxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKCBsZXQgaSA9IDA7IGkgPCAgc3BsaXR0eHQuY2hhcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0dHh0LmNoYXJzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICBjYXNlICd1cERvd24nOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuXG4gICAgICAgICAgICAgICAgY29uc3QgeVNoaWZ0ID0gJGVsLmRhdGEoJ3NoaWZ0JykgPT09ICd1cCcgPyAxMCA6IC0xMDtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSwge29wYWNpdHk6IDAuMiwgeTogeVNoaWZ0LCByZXBlYXQ6IDIsIGVhc2U6ICdub25lJywgeW95bzogdHJ1ZSwgZGVsYXk6IGRlbGF5LFxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdpdGVtc0ZhZGUnOlxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzJykgKyAnJyk7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxlbWVudHNJbiA9ICRlbC5kYXRhKCdlbGVtZW50cy1pbicpID8gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzLWluJykgKyAnJykgOiBudWxsO1xuICAgICAgICAgICAgICAgIGNvbnN0IHN0YWdnZXJFbCA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRlbCA9IGRlbGF5ID8gZGVsYXkgOiAwLjI7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hpZnRZQXhpcyA9ICRlbC5kYXRhKCd5JykgPyB0cnVlIDogZmFsc2U7XG4gICAgICAgICAgICAgICAgY29uc3QgZWxTY2FsZSA9ICAkZWwuZGF0YSgnc2NhbGUnKSA/IHRydWUgOiBmYWxzZTtcblxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuc2V0KGVsZW1lbnRzLCB7IG9wYWNpdHk6IDAgfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIGVsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8ICBlbGVtZW50c0luLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNJbltpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGVsU2NhbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIDAuOCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuOX0sIHsgc2NhbGU6IDEsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50c0luLCAwLjgsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5ICsgMC40IH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGlmdFlBeGlzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMTB9LCB7IHk6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oZWxlbWVudHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogc3RhZ2dlckVsLCBkZWxheTogZGVsYXkgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICd2aWRlby10ZXh0JzpcbiAgICAgICAgICAgICAgICBjb25zdCB2aWQgPSAkZWwuZmluZCgnLmpzLWNvbC02NicpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZiA9ICRlbC5maW5kKCcuanMtY29sLTMzJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcbiAgICAgICAgICAgICAgICBnc2FwLnNldChbdmlkLCBpbmZdLCB7IG9wYWNpdHk6IDAgfSk7XG5cblxuICAgICAgICAgICAgICAgIGdzYXAudG8odmlkLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogMC4yfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaW5mLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7IG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjR9KTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdoZWFkaW5nJzpcbiAgICAgICAgICAgICAgICBjb25zdCBoVGl0bGUgPSAkZWwuZmluZCgnLmpzLXRpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhyID0gJGVsLmZpbmQoJy5qcy1oZWFkaW5nLWhyJyk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdFRpdGxlID0gbmV3IFNwbGl0VGV4dChoVGl0bGUsIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXRUaXRsZS5jaGFycywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCB9LCB7ICBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhyLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEsIGRlbGF5OiAwLjUgfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAndGl0bGVGYWRlSW4nOlxuICAgICAgICAgICAgICAgIGNvbnN0IGxlYWQgPSAkZWwuZmluZCgnLmpzLWZpeGVkLXRpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgICAgc3ViID0gJGVsLmZpbmQoJy5qcy1zdWInKSxcbiAgICAgICAgICAgICAgICAgICAgICBhcnIgPSAkZWwuZmluZCgnLmpzLWFycicpO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKGxlYWQsIHsgZHVyYXRpb246IDEuNSwgb3BhY2l0eTogMCwgc2NhbGU6IDEuMiwgZGVsYXk6IDJ9KTtcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20oc3ViLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB5OiAzMCwgZGVsYXk6IDMuMn0pO1xuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShhcnIsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHk6IDMwLCBkZWxheTogMy43fSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgY2FzZSAnaW50cm8nOlxuICAgICAgICAgICAgICAgIGNvbnN0IGN1cnRhaW4gPSAkZWwuZmluZCgnLmpzLWN1cnRhaW4nKTtcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xuICAgICAgICAgICAgICAgIGdzYXAudG8oY3VydGFpbiwgeyBkdXJhdGlvbjogMywgb3BhY2l0eTogMCwgZGVsYXk6IDF9KTtcblxuICAgICAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcblxuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBjYXNlICdoZWFkZXInOlxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBodGltZSA9ICRlbC5maW5kKCcuanMtdGltZScpLFxuICAgICAgICAgICAgICAgICAgICBzb2NpYWxEID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX2l0ZW0nKSxcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVUZXh0ID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX3RpdGxlJyksXG4gICAgICAgICAgICAgICAgICAgIGhIciA9ICRlbC5maW5kKCcuanMtaGVhZGVyLWhyJyk7XG5cbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhbaHRpbWUsIHNoYXJlVGV4dCwgc29jaWFsRF0sIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xfSk7XG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaEhyLCB7IHNjYWxlWDogMH0sIHsgc2NhbGVYOiAxfSk7XG5cbiAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxuICAgICAgICAgICAgICAgIGNvbnN0IG51bUVsID0gJGVsLmZpbmQoJ1tkYXRhLW51bV0nKTtcbiAgICAgICAgICAgICAgICBjb25zdCBudW0gPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpLmRhdGEoJ251bScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGR1ciA9ICRlbC5kYXRhKCd0aW1lJykgPyAkZWwuZGF0YSgndGltZScpICogMTAwMCA6IDIwMDA7XG4gICAgICAgICAgICAgICAgY29uc3QgbnVtVGV4dCA9ICRlbC5maW5kKCdbZGF0YS10ZXh0XScpLmxlbmd0aCA+IDAgPyAkZWwuZmluZCgnW2RhdGEtdGV4dF0nKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgbGV0IGZpeGVkID0gbnVtLnRvU3RyaW5nKCkuaW5kZXhPZignLicpID4gLTEgPyBudW0udG9TdHJpbmcoKS5sZW5ndGggLSBudW0udG9TdHJpbmcoKS5pbmRleE9mKCcuJykgLSAxIDogbnVsbDtcblxuICAgICAgICAgICAgICAgIG51bUVsLmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6IG51bUVsLndpZHRoKCksXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAwfSwgeyBvcGFjaXR5OiAxfSk7XG4gICAgICAgICAgICAgICAgaWYgKG51bVRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC5zZXQobnVtVGV4dCwgeyBvcGFjaXR5OiAwfSk7XG4gICAgICAgICAgICAgICAgICAgIGdzYXAudG8obnVtVGV4dCwgMSx7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkdXIvMTAwMH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIG51bUVsLnByb3AoJ0NvdW50ZXInLCAwKS5hbmltYXRlKHtcbiAgICAgICAgICAgICAgICAgICAgQ291bnRlcjogbnVtLFxuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cixcbiAgICAgICAgICAgICAgICAgICAgZWFzaW5nOiAnc3dpbmcnLFxuICAgICAgICAgICAgICAgICAgICBzdGVwOiAobm93KTogdm9pZCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQgJiYgZml4ZWQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG51bUVsLmRhdGEoJ3JlcGxhY2UnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1FbC50ZXh0KChub3cudG9GaXhlZChmaXhlZCkudG9TdHJpbmcoKS5yZXBsYWNlKCcuJywgJywnKSkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQobm93LnRvRml4ZWQoZml4ZWQpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bUVsLnRleHQoTWF0aC5jZWlsKG5vdykpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke3R5cGV9XCIgZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHBhcmFsbGF4KGl0ZW06IElQYXJhbGxheENhY2hlSXRlbSwgc1Q6IG51bWJlciwgd2luZG93SGVpZ2h0OiBudW1iZXIsIGhlYWRlckhlaWdodDogbnVtYmVyKTogdm9pZCB7XG5cbiAgICAgICAgaWYgKGl0ZW0uc2hpZnQpIHtcblxuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBpdGVtLnk7XG5cbiAgICAgICAgICAgIGNvbnN0IHB5Qm90dG9tOiBudW1iZXIgPSBzVCArICgxIC0gaXRlbS5zdGFydCkgKiB3aW5kb3dIZWlnaHQ7XG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcblxuICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XG5cbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50OiBudW1iZXIgPSAoeSAtIHNUICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0IC0gaGVhZGVySGVpZ2h0KTtcbiAgICAgICAgICAgICAgICB5ID0gTWF0aC5yb3VuZChwZXJjZW50ICogaXRlbS5zaGlmdCk7XG5cbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lOiBudW1iZXIgPSAhaXRlbS5kb25lID8gMCA6IDAuNTtcbiAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsKTtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbCwge1xuICAgICAgICAgICAgICAgICAgICBkdXJhdGlvbjogdGltZSxcbiAgICAgICAgICAgICAgICAgICAgeTogeSxcbiAgICAgICAgICAgICAgICAgICAgcm91bmRQcm9wczogWyd5J10sXG4gICAgICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSkge1xuICAgICAgICAgICAgY29uc3QgJGVsOiBKUXVlcnkgPSBpdGVtLiRlbDtcbiAgICAgICAgICAgIGNvbnN0ICRlbFN0aWNreTogSlF1ZXJ5ID0gJGVsLnBhcmVudCgpLnBhcmVudCgpO1xuICAgICAgICAgICAgY29uc3QgeTogbnVtYmVyID0gaXRlbS55O1xuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcbiAgICAgICAgICAgIGNvbnN0IHB5VG9wOiBudW1iZXIgPSBzVCAtIGl0ZW0uaGVpZ2h0O1xuICAgICAgICAgICAgY29uc3QgcHlUb3BTdGlja3k6IG51bWJlciA9IHNUIC0gJGVsU3RpY2t5LmhlaWdodCgpO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGl0ZW0udHlwZSkge1xuXG4gICAgICAgICAgICAgICAgY2FzZSAnaGVybyc6XG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGVsLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAhYnJvd3Nlci5tb2JpbGUgPyBzVCAqIDAuNSA6IDAsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgICAgICBjYXNlICdmaXhlZEltYWdlJzpcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coeSwgXCJ5XCIsIHNULCBweUJvdHRvbSwgd2luZG93SGVpZ2h0LHdpbmRvd0hlaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh5ID49IHB5VG9wICYmIHkgPD0gcHlCb3R0b20pIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkZWwuaGFzQ2xhc3MoJ2hhcy1wYXJhbGxheCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdoYXMtcGFyYWxsYXgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2hhcy1wYXJhbGxheCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG5cbiAgICAgICAgICAgICAgICBjYXNlICdjc3MtYW5pbWF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgaWYgKHkgPj0gKHB5VG9wICsgaGVhZGVySGVpZ2h0KSAmJiB5IDw9IHB5Qm90dG9tKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5oYXNDbGFzcygnYW5pbWF0aW9uLXBsYXknKSA/IG51bGwgOiBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0aW9uLXBsYXknKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uJGVsLnJlbW92ZUNsYXNzKCdhbmltYXRpb24tcGxheScpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cblxuICAgICAgICAgICAgICAgIGNhc2UgJ3JlbGF0aXZlUGFyYWxsYXgnOlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmFpbGFibGVTcGFjZSA9IGl0ZW0uY2hpbGRIZWlnaHQgLSBpdGVtLmhlaWdodDsgLy8gcmVzZXJ2ZSBzcGFjZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhTaGlmdCA9IE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCBpdGVtLmhlaWdodCArIGhlYWRlckhlaWdodCk7IC8vIE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCAod2luZG93SGVpZ2h0IC0gZGF0YS5oZWlnaHQpICogMC41ICk7IC8vIGRvIG5vdCBtb3ZlIHRvbyBtdWNoIG9uIGJpZyBzY3JlZW5zXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBlcmNlbnQgPSAoc1QgLSBpdGVtLnkgKyB3aW5kb3dIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0KTtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zWTogc3RyaW5nIHwgbnVtYmVyID0gTWF0aC5yb3VuZCgoMSAtIHBlcmNlbnQpICogbWF4U2hpZnQpO1xuICAgICAgICAgICAgICAgICAgICBwb3NZID0gcG9zWSA8IDAgPyAwIDogcG9zWTtcbiAgICAgICAgICAgICAgICAgICAgcG9zWSA9IHBvc1kgPiBtYXhTaGlmdCA/IG1heFNoaWZ0IDogcG9zWTtcblxuICAgICAgICAgICAgICAgICAgICBnc2FwLnNldChpdGVtLiRjaGlsZCwge1xuICAgICAgICAgICAgICAgICAgICAgICAgeTogLXBvc1ksXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuXG4gICAgICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKGBhbmltYXRpb24gdHlwZSBcIiR7aXRlbS50eXBlfVwiIGRvZXMgbm90IGV4aXN0YCk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmV4cG9ydCBjbGFzcyBTaGFyZSB7XG5cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuXG5cbiAgICAgICAgJCgnW2RhdGEtc2hhcmVdJykub24oJ2NsaWNrJywgKGUpOiBib29sZWFuID0+IHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgICAgIGxldCB3aW5XaWR0aCA9IHBhcnNlSW50KCQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCdkYXRhLXdpbndpZHRoJyksIDEwKSB8fCA1MjA7XG4gICAgICAgICAgICBsZXQgd2luSGVpZ2h0ID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2luaGVpZ2h0JyksIDEwKSB8fCAzNTA7XG4gICAgICAgICAgICBsZXQgd2luVG9wID0gKHNjcmVlbi5oZWlnaHQgLyAyKSAtICh3aW5IZWlnaHQgLyAyKTtcbiAgICAgICAgICAgIGxldCB3aW5MZWZ0ID0gKHNjcmVlbi53aWR0aCAvIDIpIC0gKHdpbldpZHRoIC8gMik7XG5cbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSA8YW55PmUuY3VycmVudFRhcmdldDtcbiAgICAgICAgICAgIGNvbnN0IGhyZWYgPSBjdXJyZW50VGFyZ2V0LmhyZWY7XG4gICAgICAgICAgICBjb25zdCBkYXRhID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3NoYXJlJyk7XG5cbiAgICAgICAgICAgIGlmIChkYXRhID09PSAnbGlua2VkaW4nKSB7XG4gICAgICAgICAgICAgICAgd2luV2lkdGggPSA0MjA7XG4gICAgICAgICAgICAgICAgd2luSGVpZ2h0ID0gNDMwO1xuICAgICAgICAgICAgICAgIHdpblRvcCA9IHdpblRvcCAtIDEwMDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgd2luZG93Lm9wZW4oaHJlZiwgJ3NoYXJlcicgKyBkYXRhLCAndG9wPScgKyB3aW5Ub3AgKyAnLGxlZnQ9JyArIHdpbkxlZnQgKyAnLHRvb2xiYXI9MCxzdGF0dXM9MCx3aWR0aD0nICsgd2luV2lkdGggKyAnLGhlaWdodD0nICsgd2luSGVpZ2h0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9yZWZlcmVuY2VzLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cblxuaW1wb3J0IHsgUHVzaFN0YXRlcywgUHVzaFN0YXRlc0V2ZW50cyB9IGZyb20gJy4vUHVzaFN0YXRlcyc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XG5pbXBvcnQgeyBQYWdlLCBQYWdlRXZlbnRzIH0gZnJvbSAnLi9wYWdlcy9QYWdlJztcbmltcG9ydCB7IENvbXBvbmVudEV2ZW50cywgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBCcm93c2VyLCBicm93c2VyIH0gZnJvbSAnLi9Ccm93c2VyJztcbmltcG9ydCB7IExvYWRlciB9IGZyb20gJy4vTG9hZGVyJztcbmltcG9ydCB7IHBhZ2VzLCBjb21wb25lbnRzIH0gZnJvbSAnLi9DbGFzc2VzJztcbmltcG9ydCB7IENvcHkgfSBmcm9tICcuL0NvcHknO1xuaW1wb3J0IHsgU2hhcmUgfSBmcm9tICcuL1NoYXJlJztcbmltcG9ydCB7IEFQSSB9IGZyb20gJy4vQXBpJztcblxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XG5cbmV4cG9ydCBsZXQgc2l0ZTogU2l0ZTtcbmV4cG9ydCBsZXQgJGRvYzogSlF1ZXJ5O1xuZXhwb3J0IGxldCAkd2luZG93OiBKUXVlcnk7XG5leHBvcnQgbGV0ICRib2R5OiBKUXVlcnk7XG5leHBvcnQgbGV0ICRhcnRpY2xlOiBKUXVlcnk7XG5leHBvcnQgbGV0ICRtYWluOiBKUXVlcnk7XG5leHBvcnQgbGV0ICRwYWdlSGVhZGVyOiBKUXVlcnk7XG5leHBvcnQgbGV0IHBpeGVsUmF0aW86IG51bWJlcjtcbmV4cG9ydCBsZXQgZGVidWc6IGJvb2xlYW47XG5leHBvcnQgbGV0IGVhc2luZzogc3RyaW5nO1xuZXhwb3J0IGxldCBsYW5nOiBzdHJpbmc7XG5leHBvcnQgbGV0IGZpeGVkcG9zaXRpb246IG51bWJlcjtcblxuLy8gZGVjbGFyZSBsZXQgQ3VzdG9tRWFzZTtcblxuXG5cblxuZXhwb3J0IGNsYXNzIFNpdGUge1xuXG5cbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBTaXRlO1xuXG4gICAgcHJpdmF0ZSBjdXJyZW50UGFnZTogUGFnZTtcbiAgICBwcml2YXRlIHB1c2hTdGF0ZXM6IFB1c2hTdGF0ZXM7XG4gICAgcHJpdmF0ZSBzY3JvbGw6IFNjcm9sbDtcbiAgICBwcml2YXRlIGxhc3RCcmVha3BvaW50OiBJQnJlYWtwb2ludDtcbiAgICBwcml2YXRlIGxvYWRlcjogTG9hZGVyO1xuICAgIC8vIHByaXZhdGUgaXNSZWFkeTogYm9vbGVhbjtcbiAgICAvLyBwcml2YXRlIGNvbXBvbmVudHM6IEFycmF5PENvbXBvbmVudD4gPSBbXTtcbiAgICAvLyBwcml2YXRlICRoYW1idXJnZXI6IEpRdWVyeTtcbiAgICAvLyBwcml2YXRlICRwYWdlSGVhZGVyOiBKUXVlcnk7XG4gICAgLy8gcHJpdmF0ZSAkYXJ0aWNsZTogSlF1ZXJ5O1xuXG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcblxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdzaXRlJyk7XG5cbiAgICAgICAgU2l0ZS5pbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgIC8vIGxhbmcgPSAkKCdodG1sJykuYXR0cignbGFuZycpO1xuXG4gICAgICAgIHBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xuICAgICAgICBkZWJ1ZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guaW5kZXhPZignZGVidWcnKSA+PSAwO1xuICAgICAgICAvLyBlYXNpbmcgPSBDdXN0b21FYXNlLmNyZWF0ZSgnY3VzdG9tJywgJ00wLDAsQzAuNSwwLDAuMywxLDEsMScpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgaW5pdCgpOiB2b2lkIHtcblxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xuICAgICAgICBCcm93c2VyLnVwZGF0ZSgpO1xuXG4gICAgICAgICRkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgJHdpbmRvdyA9ICQod2luZG93KTtcbiAgICAgICAgJGJvZHkgPSAkKCdib2R5Jyk7XG4gICAgICAgICRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xuICAgICAgICAkbWFpbiA9ICQoJyNtYWluJyk7XG5cblxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMgPSBuZXcgUHVzaFN0YXRlcygpO1xuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UsIHRoaXMub25TdGF0ZSk7XG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5vbihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uTG9hZFByb2dyZXNzKTtcblxuICAgICAgICAvLyB0aGlzLiRoYW1idXJnZXIgPSAkKCdbZGF0YS1oYW1idXJnZXJdJyk7XG4gICAgICAgIC8vIHRoaXMuJGFydGljbGUgPSAkKCcjYXJ0aWNsZS1tYWluJyk7XG4gICAgICAgIC8vIHRoaXMuJHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykgOiBudWxsO1xuXG4gICAgICAgIHRoaXMuc2Nyb2xsID0gbmV3IFNjcm9sbCgpO1xuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBMb2FkZXIoJCgnLmpzLWxvYWRlcicpKTtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41KTtcblxuXG4gICAgICAgIG5ldyBDb3B5KCk7XG4gICAgICAgIG5ldyBTaGFyZSgpO1xuICAgICAgICBuZXcgQVBJKCk7XG4gICAgICAgIEFQSS5iaW5kKCk7XG4gICAgICAgIC8vIHRoaXMubWVudSA9IG5ldyBNZW51KCQoJy5qcy1tZW51JykpO1xuICAgICAgICAvLyB0aGlzLmNvb2tpZXMgPSBuZXcgQ29va2llcygkKCcuanMtY29va2llcycpKTtcblxuXG4gICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KFtcbiAgICAgICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKSxcbiAgICAgICAgICAgIC8vIHRoaXMucHJlbG9hZEFzc2V0cygpLFxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKSxcbiAgICAgICAgXSkudGhlbih0aGlzLm9uUGFnZUxvYWRlZCk7XG5cblxuICAgICAgICBpZiAoZGVidWcpIHsgVXRpbHMuc3RhdHMoKTsgfVxuXG4gICAgICAgICR3aW5kb3cub24oJ29yaWVudGF0aW9uY2hhbmdlJywgKCkgPT4gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xuXG4gICAgICAgIH0sIDEwMCkpO1xuICAgICAgICAkd2luZG93Lm9uKCdyZXNpemUnLCAoKSA9PiB0aGlzLm9uUmVzaXplKCkpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIG9uUmVzaXplKCk6IHZvaWQge1xuXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XG4gICAgICAgIGlmIChicmVha3BvaW50LmRlc2t0b3AgJiYgIWJyb3dzZXIubW9iaWxlKSB7XG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3Qgd2lkdGggPSAkd2luZG93LndpZHRoKCk7XG4gICAgICAgIGNvbnN0IGhlaWdodCA9ICR3aW5kb3cuaGVpZ2h0KCk7XG5cbiAgICAgICAgY29uc3QgY2hhbmdlZCA9ICF0aGlzLmxhc3RCcmVha3BvaW50IHx8IHRoaXMubGFzdEJyZWFrcG9pbnQudmFsdWUgIT09IGJyZWFrcG9pbnQudmFsdWU7XG4gICAgICAgIHRoaXMubGFzdEJyZWFrcG9pbnQgPSBicmVha3BvaW50O1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0LCBicmVha3BvaW50LCBjaGFuZ2VkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCgncmVzaXplJywgd2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XG4gICAgICAgIHRoaXMubG9hZGVyLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5zY3JvbGwucmVzaXplKCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgcHJlbG9hZEFzc2V0cygpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICBsZXQgYXNzZXRzID0gW107XG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCgnLnByZWxvYWQtYmcnLCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiB0cnVlLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoYXNzZXRzICYmIGFzc2V0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzc2V0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQoYXNzZXRzW2ldLCBudWxsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICBpbC5qcURlZmVycmVkLmFsd2F5cygoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cbiAgICAvLyBjaGVjayBpZiBhbnkgY29tcG9uZW50IGhhbmRsZSBvblN0YXRlIGV2ZW50XG4gICAgLy8gaWYgbm90LCByZWxvYWQgaHRtbDpcbiAgICBwcml2YXRlIG9uU3RhdGUgPSAoKTogdm9pZCA9PiB7XG5cbiAgICAgICAgLy8gY29uc3Qgc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlID0gdGhpcy5zY3JvbGwub25TdGF0ZSgpO1xuICAgICAgICBjb25zdCBwYWdlQ2hhbmdlZFN0YXRlID0gdGhpcy5jdXJyZW50UGFnZS5vblN0YXRlKCk7XG5cbiAgICAgICAgLy8gaWYgKCFzY3JvbGxpbmdDaGFuZ2VkU3RhdGUgJiYgIW9mZnNjcmVlbkNoYW5nZWRTdGF0ZSAmJiAhcGFnZUNoYW5nZWRTdGF0ZSkge1xuICAgICAgICBpZiAoIXBhZ2VDaGFuZ2VkU3RhdGUpIHtcblxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzLnNlbmRQYWdldmlldyh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xuXG4gICAgICAgICAgICBjb25zdCBwdXNoU3RhdGVzTG9hZFByb21pc2UgPSB0aGlzLnB1c2hTdGF0ZXMubG9hZCgpO1xuICAgICAgICAgICAgY29uc3QgYW5pbWF0ZU91dFByb21pc2UgPSB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVPdXQoKTtcblxuICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsLnN0b3AoKTtcblxuICAgICAgICAgICAgLy8gYWxsIHByb21pc2VzIGFycmF5OlxuICAgICAgICAgICAgY29uc3QgbG9hZGluZ1Byb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IFtcbiAgICAgICAgICAgICAgICBwdXNoU3RhdGVzTG9hZFByb21pc2UsXG4gICAgICAgICAgICAgICAgYW5pbWF0ZU91dFByb21pc2UsXG4gICAgICAgICAgICBdO1xuXG4gICAgICAgICAgICAvLyByZW5kZXIgaHRtbCB3aGVuIGV2ZXJ5dGhpbmcncyByZWFkeTpcbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGxvYWRpbmdQcm9taXNlcykudGhlbih0aGlzLnJlbmRlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgLy8gZGlzcGxheSBhamF4IHByb2dyZXNzOlxuICAgIHByaXZhdGUgb25Mb2FkUHJvZ3Jlc3MgPSAocHJvZ3Jlc3M6IG51bWJlcik6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmxvYWRlci5zZXQoMC41ICogcHJvZ3Jlc3MpO1xuICAgIH1cblxuXG5cbiAgICAvLyBwYXNzIGxvYWRpbmcgcHJvZ3Jlc3MgZnJvbSBwYWdlIHRvIHByZWxvYWRlcjpcbiAgICBwcml2YXRlIG9uUGFnZVByb2dyZXNzID0gKHByb2dyZXNzOiBudW1iZXIpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSArIDAuNSAqIHByb2dyZXNzKTtcbiAgICB9XG5cblxuXG4gICAgLy8gZGVhbCB3aXRoIG5ld2x5IGFkZGVkIGVsZW1lbnRzXG4gICAgcHJpdmF0ZSBvblBhZ2VBcHBlbmQgPSAoZWw6IEpRdWVyeSk6IHZvaWQgPT4ge1xuICAgICAgICBQdXNoU3RhdGVzLmJpbmQoZWxbMF0pO1xuICAgICAgICAvLyBXaWRnZXRzLmJpbmQoZWxbMF0pO1xuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XG4gICAgfVxuXG5cblxuICAgIC8vIGNhbGxlZCBhZnRlciBuZXcgaHRtbCBpcyBsb2FkZWRcbiAgICAvLyBhbmQgb2xkIGNvbnRlbnQgaXMgYW5pbWF0ZWQgb3V0OlxuICAgIHByaXZhdGUgcmVuZGVyID0gKCk6IHZvaWQgPT4ge1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLm9mZigpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UGFnZS5kZXN0cm95KCk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2Nyb2xsLmRlc3Ryb3koKTtcblxuICAgICAgICBjb25zb2xlLmdyb3VwRW5kKCk7XG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcblxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMucmVuZGVyKCk7XG4gICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcbiAgICAgICAgUHVzaFN0YXRlcy5zZXRUaXRsZSgkKCdtZXRhW3Byb3BlcnR5PVwib2c6dGl0bGVcIl0nKS5hdHRyKCdjb250ZW50JykpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBkZXRlY3RIb21lUGFnZSgpOiB2b2lkIHtcbiAgICAgICAgJHBhZ2VIZWFkZXIgPyAkYm9keS5hZGRDbGFzcygnaXMtaG9tZS1wYWdlJykgOiBudWxsO1xuICAgIH1cblxuXG4gICAgLy8gd2hlbiBjdXJyZW50IHBhZ2UgaXMgbG9hZGVkOlxuICAgIHByaXZhdGUgb25QYWdlTG9hZGVkID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICAvLyAkYm9keS5yZW1vdmVDbGFzcygnaXMtbm90LXJlYWR5Jyk7XG4gICAgICAgICRib2R5LnJlbW92ZUF0dHIoJ2NsYXNzJyk7XG4gICAgICAgIHRoaXMubG9hZGVyLmhpZGUoKTtcbiAgICAgICAgVXRpbHMuZW5hYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcbiAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkYm9keSwgMCwgMCk7XG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UuYW5pbWF0ZUluKCk7XG4gICAgICAgICRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcbiAgICAgICAgdGhpcy5kZXRlY3RIb21lUGFnZSgpO1xuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcbiAgICAgICAgLy8gdGhpcy5jb29raWVzLnRyeVRvU2hvdygpO1xuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9QYXRoKHRydWUpO1xuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XG4gICAgICAgIHRoaXMuc2Nyb2xsLnN0YXJ0KCk7XG4gICAgICAgICQoJ2FydGljbGUnKS5wYXJlbnQoKS5hZGRDbGFzcygnaXMtbG9hZGVkJyk7XG4gICAgfVxuXG5cblxuICAgIC8vIHJ1biBuZXcgUGFnZSBvYmplY3RcbiAgICAvLyAoZm91bmQgYnkgYGRhdGEtcGFnZWAgYXR0cmlidXRlKVxuICAgIC8vIGJpbmQgaXQgYW5kIHN0b3JlIGFzIGN1cnJlbnRQYWdlOlxuICAgIHByaXZhdGUgc2V0Q3VycmVudFBhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGxldCAkcGFnZUVsOiBKUXVlcnkgPSAkKCdbZGF0YS1wYWdlXScpLFxuICAgICAgICAgICAgcGFnZU5hbWU6IHN0cmluZyA9ICRwYWdlRWwuZGF0YSgncGFnZScpIHx8ICdQYWdlJyxcbiAgICAgICAgICAgIHBhZ2VPcHRpb25zOiBPYmplY3QgPSAkcGFnZUVsLmRhdGEoJ29wdGlvbnMnKTtcblxuICAgICAgICBjb25zb2xlLmxvZygkcGFnZUVsLCBwYWdlTmFtZSk7XG5cbiAgICAgICAgLy8gcGFnZSBub3QgZm91bmQ6XG4gICAgICAgIGlmIChwYWdlTmFtZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAocGFnZU5hbWUgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdUaGVyZSBpcyBubyBcIiVzXCIgaW4gUGFnZXMhJywgcGFnZU5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFnZU5hbWUgPSAnUGFnZSc7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBtb3JlIHRoYW4gb25lIGRhdGEtcGFnZTpcbiAgICAgICAgaWYgKCRwYWdlRWwubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKCdPbmx5IG9uZSBbZGF0YS1wYWdlXSBlbGVtZW50LCBwbGVhc2UhJyk7XG5cbiAgICAgICAgLy8gcGFnZSBub3QgZGVmaW5lZCBpbiBodG1sOlxuICAgICAgICB9IGVsc2UgaWYgKCRwYWdlRWwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAkcGFnZUVsID0gJCgkKCcjbWFpbicpLmZpbmQoJ2FydGljbGUnKVswXSB8fCAkKCcjbWFpbicpLmNoaWxkcmVuKCkuZmlyc3QoKVswXSk7XG4gICAgICAgIH1cblxuXG5cbiAgICAgICAgLy8gY3JlYXRlIFBhZ2Ugb2JqZWN0OlxuICAgICAgICBsZXQgcGFnZTogUGFnZSA9IG5ldyBwYWdlc1twYWdlTmFtZV0oJHBhZ2VFbCwgcGFnZU9wdGlvbnMpO1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gcGFnZTtcblxuICAgICAgICAvLyBiaW5kIGV2ZW50czpcbiAgICAgICAgQVBJLmJpbmQoKTtcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uUGFnZVByb2dyZXNzKTtcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLkNIQU5HRSwgdGhpcy5vblBhZ2VBcHBlbmQpO1xuXG4gICAgICAgIHRoaXMub25SZXNpemUoKTtcblxuICAgICAgICByZXR1cm4gcGFnZS5wcmVsb2FkKCk7XG4gICAgfVxufVxuXG5cbiQoZG9jdW1lbnQpLnJlYWR5KCgpID0+IHtcbiAgICBzaXRlID0gbmV3IFNpdGUoKTtcbiAgICBzaXRlLmluaXQoKTtcbn0pO1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL3N0YXRzLmQudHNcIiAvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL21vZGVybml6ci5kLnRzXCIgLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XG5cbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi9TaXRlJztcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVVSUQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gJycgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpICsgTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcbn1cblxuXG5leHBvcnQgY29uc3Qga2V5cyA9IHtcbiAgICBlbnRlcjogMTMsXG4gICAgZXNjOiAyNyxcbiAgICBzcGFjZTogMzIsXG4gICAgbGVmdDogMzcsXG4gICAgdXA6IDM4LFxuICAgIHJpZ2h0OiAzOSxcbiAgICBkb3duOiA0MCxcbiAgICBwYWdlVXA6IDMzLFxuICAgIHBhZ2VEb3duOiAzNCxcbiAgICBlbmQ6IDM1LFxuICAgIGhvbWU6IDM2LFxufTtcblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyYW1zKHVybCk6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9IHtcbiAgICB2YXIgcGFyYW1zID0ge307XG4gICAgdmFyIHBhcnNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcbiAgICBwYXJzZXIuaHJlZiA9IHVybDtcbiAgICB2YXIgcXVlcnkgPSBwYXJzZXIuc2VhcmNoLnN1YnN0cmluZygxKTtcbiAgICB2YXIgdmFycyA9IHF1ZXJ5LnNwbGl0KCcmJyk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBwYWlyID0gdmFyc1tpXS5zcGxpdCgnPScpO1xuICAgICAgICBwYXJhbXNbcGFpclswXV0gPSBkZWNvZGVVUklDb21wb25lbnQocGFpclsxXSk7XG4gICAgfVxuICAgIHJldHVybiBwYXJhbXM7XG59O1xuXG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0QXV0b3BsYXkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPGJvb2xlYW4+KChyZXNvbHZlKSA9PiB7XG4gICAgICAgIGlmICh0eXBlb2YgTW9kZXJuaXpyLnZpZGVvYXV0b3BsYXkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBNb2Rlcm5penIub24oJ3ZpZGVvYXV0b3BsYXknLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZVRvVGltZShzZWM6IG51bWJlcik6IHN0cmluZyB7XG5cbiAgICBjb25zdCB0b3RhbFNlYyA9IHBhcnNlSW50KCcnICsgc2VjLCAxMCk7XG4gICAgY29uc3QgaG91cnMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gMzYwMCwgMTApICUgMjQ7XG4gICAgY29uc3QgbWludXRlcyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyA2MCwgMTApICUgNjA7XG4gICAgY29uc3Qgc2Vjb25kcyA9IHRvdGFsU2VjICUgNjA7XG4gICAgY29uc3QgaHJzRGlzcGxheSA9IChob3VycyA8IDEwID8gJzAnICsgaG91cnMgOiBob3VycykgKyAnOic7XG5cbiAgICByZXR1cm4gKGhvdXJzID4gMCA/IGhyc0Rpc3BsYXkgOiAnJykgKyAobWludXRlcyA8IDEwID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKHNlY29uZHMgPCAxMCA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcbn1cblxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzdGF0cygpOiBTdGF0cyB7XG5cbiAgICBjb25zdCBzdGF0cyA9IG5ldyBTdGF0cygpO1xuXG4gICAgc3RhdHMuc2hvd1BhbmVsKCAwICk7IC8vIDA6IGZwcywgMTogbXMsIDI6IG1iLCAzKzogY3VzdG9tXG4gICAgJChzdGF0cy5kb20pLmNzcyh7J3BvaW50ZXItZXZlbnRzJzogJ25vbmUnLCAndG9wJzogMTEwfSk7XG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCggc3RhdHMuZG9tICk7XG5cbiAgICBmdW5jdGlvbiBhbmltYXRlKCk6IHZvaWQge1xuICAgICAgICBzdGF0cy5iZWdpbigpO1xuICAgICAgICAvLyBtb25pdG9yZWQgY29kZSBnb2VzIGhlcmVcbiAgICAgICAgc3RhdHMuZW5kKCk7XG4gICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xuICAgIH1cblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZSggYW5pbWF0ZSApO1xuXG4gICAgcmV0dXJuIHN0YXRzO1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVGb3JtYXQodGltZTogbnVtYmVyKTogc3RyaW5nIHtcbiAgICBsZXQgbWludXRlcyA9IE1hdGguZmxvb3IodGltZSAvIDYwKS50b1N0cmluZygpO1xuICAgIG1pbnV0ZXMgPSAocGFyc2VJbnQobWludXRlcywgMTApID49IDEwKSA/IG1pbnV0ZXMgOiAnMCcgKyBtaW51dGVzO1xuICAgIGxldCBzZWNvbmRzID0gTWF0aC5mbG9vcih0aW1lICUgNjApLnRvU3RyaW5nKCk7XG4gICAgc2Vjb25kcyA9IChwYXJzZUludChzZWNvbmRzLCAxMCkgPj0gMTApID8gc2Vjb25kcyA6ICcwJyArIHNlY29uZHM7XG5cbiAgICByZXR1cm4gbWludXRlcy50b1N0cmluZygpICsgJzonICsgc2Vjb25kcy50b1N0cmluZygpO1xufVxuXG5cblxuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUltYWdlU291cmNlcygpOiB2b2lkIHtcbiAgICBpZiAoYnJvd3Nlci5pZSkge1xuICAgICAgICAkKCdbZGF0YS1pZXNyY10nKS5lYWNoKChpLCBpbWcpOiB2b2lkID0+IHtcbiAgICAgICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtaWVzcmMnKSk7XG4gICAgICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWllc3JjJyk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgICQoJ1tkYXRhLXNyY10nKS5lYWNoKChpLCBpbWcpOiB2b2lkID0+IHtcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3JjJywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmMnKSk7XG4gICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XG4gICAgfSk7XG5cbiAgICAkKCdbZGF0YS1zcmNzZXRdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyY3NldCcsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3Jjc2V0JykpO1xuICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLXNyY3NldCcpO1xuICAgIH0pO1xufVxuXG5cblxuLy8gZXhwb3J0IGZ1bmN0aW9uIHByZWxvYWRJbWFnZXMoaW1hZ2VzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZFtdPiB7XG4vLyAgICAgcmV0dXJuIFByb21pc2UuYWxsKGltYWdlcy5tYXAoKGltYWdlKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4vLyAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4vLyAgICAgICAgICAgICBjb25zdCBpbWcgPSBuZXcgSW1hZ2UoKTtcbi8vICAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICBpbWcub25lcnJvciA9ICgpID0+IHJlc29sdmUoKTtcbi8vICAgICAgICAgICAgIGltZy5vbmFib3J0ID0gKCkgPT4gcmVzb2x2ZSgpO1xuLy8gICAgICAgICAgICAgaW1nLnNyYyA9IGltYWdlO1xuLy8gICAgICAgICAgICAgaWYgKGltZy5jb21wbGV0ZSAmJiAkKGltZykuaGVpZ2h0KCkgPiAwKSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XG4vLyAgICAgICAgIH0pO1xuLy8gICAgIH0pKTtcbi8vIH1cblxuXG5cbi8vIGV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFByZWxvYWRJbWFnZXMoJGltYWdlczogSlF1ZXJ5KTogUHJvbWlzZTx2b2lkW10+IHtcbi8vICAgICBsZXQgaXNCYXNlNjQ6IGJvb2xlYW47XG4vLyAgICAgY29uc3QgaW1hZ2VzOiBzdHJpbmdbXSA9ICRpbWFnZXMudG9BcnJheSgpXG4vLyAgICAgICAgIC5tYXAoKGltZzogSFRNTEltYWdlRWxlbWVudCk6IHN0cmluZyA9PiB7XG4vLyAgICAgICAgICAgICBsZXQgaW1hZ2VTb3VyY2UgPSBpbWcuY3VycmVudFNyYyB8fCBpbWcuc3JjO1xuLy8gICAgICAgICAgICAgaWYgKGltYWdlU291cmNlLmluZGV4T2YoJ2RhdGE6aW1hZ2UvcG5nO2Jhc2U2NCwnKSA+PSAwKSB7IGlzQmFzZTY0ID0gdHJ1ZTsgfVxuLy8gICAgICAgICAgICAgcmV0dXJuIGltYWdlU291cmNlO1xuLy8gICAgICAgICB9KTtcblxuLy8gICAgIC8vIGNvbnNvbGUubG9nKGltYWdlcyk7XG5cbi8vICAgICBpZiAoIWlzQmFzZTY0KSB7XG4vLyAgICAgICAgIHJldHVybiBwcmVsb2FkSW1hZ2VzKGltYWdlcyk7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuLy8gICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4vLyAgICAgICAgICAgICAgICAgY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXMpLnRoZW4oKCkgPT4ge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4vLyAgICAgICAgICAgICAgICAgfSk7XG4vLyAgICAgICAgICAgICB9LCAyMDApO1xuLy8gICAgICAgICB9KTtcbi8vICAgICB9XG4vLyB9XG5cblxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGUoYSk6IEFycmF5PGFueT4ge1xuICAgIGxldCBqLCB4LCBpO1xuICAgIGZvciAoaSA9IGEubGVuZ3RoIC0gMTsgaSA+IDA7IGktLSkge1xuICAgICAgICBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgICAgIHggPSBhW2ldO1xuICAgICAgICBhW2ldID0gYVtqXTtcbiAgICAgICAgYVtqXSA9IHg7XG4gICAgfVxuICAgIHJldHVybiBhO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRSb290VmFycygpOiB2b2lkIHtcbiAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBicmVha3BvaW50LmRlc2t0b3AgPyAkKCcjbmF2YmFyJykuaGVpZ2h0KCkgOiAwO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1hcHAtaGVpZ2h0JywgYCR7d2luZG93LmlubmVySGVpZ2h0IC0gaGVhZGVySGVpZ2h0fXB4YCk7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC0yNScsIGAkeyQoJy5jb2wtcGF0dGVybi0yNScpLndpZHRoKCl9cHhgKTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tY29sLTY2JywgYCR7JCgnLmNvbC02NicpLndpZHRoKCl9cHhgKTtcbiAgICBsZXQgbWFyZyA9ICFicmVha3BvaW50LmRlc2t0b3AgPyA1MCA6IDEyMDtcbiAgICAkKCcuYXNpZGUnKS5jc3MoJ2hlaWdodCcsICR3aW5kb3cuaGVpZ2h0KCkgKyBtYXJnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xuICAgICQoJ2JvZHknKS5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnc2Nyb2xsaW5nLWRpc2FibGUnKTtcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc1QpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlQm9keVNjcm9sbGluZyhzVDogbnVtYmVyKTogdm9pZCB7XG4gICAgbGV0IHBvc2l0aW9uID0gYnJvd3Nlci5pZSA/ICdhYnNvbHV0ZScgOiAnZml4ZWQnO1xuICAgIGxldCB0b3AgPSBicm93c2VyLmllID8gJycgOiAtc1QgKyAncHgnO1xuICAgICQoJ2JvZHknKS5hZGRDbGFzcygnc2Nyb2xsaW5nLWRpc2FibGUnKTtcbiAgICAkKCdib2R5JykuY3NzKHtcbiAgICAgICAgLy8gJ3Bvc2l0aW9uJzogcG9zaXRpb24sXG4gICAgICAgIC8vICd0b3AnOiB0b3AsXG4gICAgICAgIC8vICdib3R0b20nOiAnMCcsXG4gICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxuICAgICAgICAnd2lsbC1jaGFuZ2UnOiAndG9wJyxcbiAgICAgICAgJ3dpZHRoJzogJzEwMCUnLFxuICAgICAgICAndG91Y2gtYWN0aW9uJzogJ25vbmUnLFxuICAgIH0pO1xuXG59XG5cblxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9ucyA9IHtcbiAgICAnaW52YWxpZC1lbWFpbCc6IHtcbiAgICAgICAgJ2VuJzogJ0ludmFsaWQgZW1haWwgYWRkcmVzcyBmb3JtYXQnLFxuICAgICAgICAncGwnOiAnTmllcG9wcmF3bnkgZm9ybWF0IGFkcmVzdSBlLW1haWwnLFxuICAgIH0sXG4gICAgJ3JlcXVpcmVkLWZpZWxkJzoge1xuICAgICAgICAnZW4nOiAnUmVxdWlyZWQgZmllbGQnLFxuICAgICAgICAncGwnOiAnUG9sZSBvYm93acSFemtvd2UnLFxuICAgIH0sXG4gICAgJ2ludmFsaWQtemlwJzoge1xuICAgICAgICAnZW4nOiAnRW50ZXIgemlwLWNvZGUgaW4gZml2ZSBkaWdpdHMgZm9ybWF0JyxcbiAgICAgICAgJ3BsJzogJ1dwaXN6IGtvZCBwb2N6dG93eSB3IGZvcm1hY2llIFhYLVhYWCcsXG4gICAgfSxcbn07XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGJvZHksICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi4vUHVzaFN0YXRlcyc7XG5cblxuZXhwb3J0IGNsYXNzIEFzaWRlIGV4dGVuZHMgQ29tcG9uZW50IHtcbiAgICBcbiAgICBwdWJsaWMgc3RhdGljIGluc3RhbmNlOiBBc2lkZTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW4gPSBmYWxzZTtcblxuICAgIHByaXZhdGUgJGhhbWJ1cmdlckxpbmU6IEpRdWVyeTtcbiAgICBcbiAgICBwdWJsaWMgc3RhdGljIGFzaWRlQW5pbWF0aW9uKCk6IHZvaWQge1xuXG4gICAgICAgIGlmIChBc2lkZS5pbnN0YW5jZS5pc09wZW4pIHtcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGl0ZW0sIDAuMjUsIHsgZHVyYXRpb246IDAuMjUsIHN0YWdnZXI6IC0wLjEsIG9wYWNpdHk6IDAsIHg6IDIwLCBkZWxheTogMC4yfSlcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGhhbWJ1cmdlckxpbmUsIDAuMywgeyBkdXJhdGlvbjogMC4zLCBzY2FsZVk6IDB9KTtcbiAgICAgICAgICAgIEFzaWRlLmluc3RhbmNlLmlzT3BlbiA9IGZhbHNlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaXRlbSwgMC41LCB7IGR1cmF0aW9uOiAwLjUsIHN0YWdnZXI6IDAuMDUsIG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjJ9KVxuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaGFtYnVyZ2VyTGluZSwgMC4zLCB7IGR1cmF0aW9uOiAwLjMsIHNjYWxlWTogMSwgZGVsYXk6IDAuNX0pO1xuICAgICAgICAgICAgQXNpZGUuaW5zdGFuY2UuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XG4gICAgICAgIHRoaXMuJGhhbWJ1cmdlckxpbmUgPSAkKCdbZGF0YS1oYW1idXJnZXJdJykuZmluZCgnaScpO1xuXG4gICAgICAgIEFzaWRlLmluc3RhbmNlID0gdGhpcztcbiAgICAgICAgXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICBBc2lkZS5pbnN0YW5jZS5pc09wZW4gPSBmYWxzZTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kaXRlbS5vZmYoJy5tZW51Jykub24oJ2NsaWNrLm1lbnUnLCB0aGlzLmhpZGVNZW51KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGhpZGVNZW51ID0gKGUpID0+IHtcbiAgICAgICAgUHVzaFN0YXRlcy5hc2lkZVRvZ2dsZShlKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XG5cbmludGVyZmFjZSBJQ2hhcnRTZXR0aW5ncyB7XG4gICAgaWQ6IG51bWJlcjtcbiAgICB4UGVyY2VudDogbnVtYmVyO1xuICAgIHlQb2ludHM6IEFycmF5PG51bWJlcj47XG4gICAgY29sb3I6IHN0cmluZztcbiAgICB5UHg6IEFycmF5PG51bWJlcj47XG4gICAgZmlsbD86IGJvb2xlYW47XG4gICAgc2hvd24/OiBib29sZWFuO1xuICAgIGxhYmVsWT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIENoYXJ0IGV4dGVuZHMgQ29tcG9uZW50IHtcblxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcbiAgICBwcml2YXRlIGNhbnZhczogSFRNTENhbnZhc0VsZW1lbnQ7XG4gICAgcHJpdmF0ZSBjdHg6IENhbnZhc1JlbmRlcmluZ0NvbnRleHQyRDtcblxuICAgIHByaXZhdGUgbWFyZ2luOiBhbnkgPSB7XG4gICAgICAgIHRvcDogNSxcbiAgICAgICAgbGVmdDogMjUsXG4gICAgICAgIHJpZ2h0OiAxMTAsXG4gICAgICAgIGJvdHRvbTogNDlcbiAgICB9O1xuXG4gICAgcHJpdmF0ZSBncmFwaDogYW55ID0ge1xuICAgICAgICB0b3A6IDAsXG4gICAgICAgIGxlZnQ6IDAsXG4gICAgICAgIHJpZ2h0OiAwLFxuICAgICAgICBib3R0b206IDAsXG4gICAgICAgIGhlaWdodDogMCxcbiAgICAgICAgd2lkdGg6IDAsXG4gICAgfTtcblxuICAgIHByaXZhdGUgY29sb3JzOiBhbnkgPSB7XG4gICAgICAgIGdyYXk6ICdyZ2JhKDk3LDk3LDk3LDAuNSknLFxuICAgICAgICBvcmFuZ2U6ICcjZmM4YzU5JyxcbiAgICAgICAgbWludDogJyM0ZmRiYzUnLFxuICAgICAgICBibHVlOiAnIzU4NzdjYycsXG4gICAgICAgIHBpbms6ICcjQjYwRTYzJyxcbiAgICAgICAgd2hpdGU6ICcjZmZmJyxcbiAgICAgICAgYmVpZ2U6ICcjZmRkNDllJyxcbiAgICAgICAgY2lubmFiYXI6ICcjZTc1MDQwJyxcbiAgICAgICAgc2VhOiAnIzI2YmJlMycsXG4gICAgfVxuXG4gICAgcHJpdmF0ZSBncmFwaHNEYXRhOiBBcnJheTxJQ2hhcnRTZXR0aW5ncz4gPSBbXTtcblxuICAgIHByaXZhdGUgYmdMaW5lczogQXJyYXk8e3NjYWxlWDogbnVtYmVyfT47XG4gICAgcHJpdmF0ZSBjdXJyZW50Q2hhcnRzOiBudW1iZXJbXTtcblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXdyYXBwZXInKTtcbiAgICAgICAgdGhpcy4kdGFiID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLWNoYXJ0LXRhYl0nKTtcbiAgICAgICAgdGhpcy5jYW52YXMgPSA8SFRNTENhbnZhc0VsZW1lbnQ+dGhpcy52aWV3LmZpbmQoJ2NhbnZhcycpWzBdO1xuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5cbiAgICAgICAgdGhpcy5iZ0xpbmVzID0gQXJyYXkuYXBwbHkoMCwgeyBsZW5ndGg6IDkgfSkubWFwKCgpID0+IHsgcmV0dXJuIHsgc2NhbGVYOiAwIH07IH0pO1xuXG4gICAgICAgIGNvbnN0IHBhcmFtc0NoYXJ0cyA9IFV0aWxzLmdldFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKS5jaGFydHM7XG4gICAgICAgIHRoaXMuY3VycmVudENoYXJ0cyA9IHBhcmFtc0NoYXJ0cyA/IHBhcmFtc0NoYXJ0cy5zcGxpdCgnLCcpLm1hcCgoaSkgPT4gcGFyc2VJbnQoaSwgMTApKSA6IFswLCAzLCA0XTtcblxuICAgICAgICB0aGlzLmNyZWF0ZURhdGFPYmplY3QoKTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcblxuICAgICAgICB0aGlzLnJlc2l6ZSgpO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmNhbnZhcy53aWR0aCA9IHRoaXMuJHdyYXBwZXIud2lkdGgoKTtcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy4kd3JhcHBlci5oZWlnaHQoKTtcblxuICAgICAgICB0aGlzLmdyYXBoID0ge1xuICAgICAgICAgICAgdG9wOiB0aGlzLm1hcmdpbi50b3AsXG4gICAgICAgICAgICBsZWZ0OiB0aGlzLm1hcmdpbi5sZWZ0LFxuICAgICAgICAgICAgcmlnaHQ6IHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ucmlnaHQsXG4gICAgICAgICAgICBib3R0b206IHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSxcbiAgICAgICAgICAgIGhlaWdodDogdGhpcy5jYW52YXMuaGVpZ2h0IC0gdGhpcy5tYXJnaW4udG9wIC0gdGhpcy5tYXJnaW4uYm90dG9tLFxuICAgICAgICAgICAgd2lkdGg6IHRoaXMuY2FudmFzLndpZHRoIC0gdGhpcy5tYXJnaW4ubGVmdCAtIHRoaXMubWFyZ2luLnJpZ2h0LFxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XG4gICAgICAgIHRoaXMuZHJhdygpO1xuICAgIH07XG5cblxuXG4gICAgcHVibGljIGVuYWJsZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5zaG93QmcoKTtcbiAgICAgICAgbGV0IHZpc2libGUgPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuJHRhYi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuY3VycmVudENoYXJ0cy5pbmRleE9mKGkpID49IDA7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNoYXJ0KGksIHYsIGZhbHNlLCB2aXNpYmxlICogMC4zKTtcbiAgICAgICAgICAgIHZpc2libGUgKz0gISF2ID8gMSA6IDA7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHVibGljIGRpc2FibGUoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaGlkZUJnKHRydWUpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuJHRhYi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVDaGFydChpLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjcmVhdGVEYXRhT2JqZWN0KCk6IHZvaWQge1xuICAgICAgICB0aGlzLmdyYXBoc0RhdGEgPSB0aGlzLiR0YWIudG9BcnJheSgpLm1hcCgoZWwsIGkpID0+IHtcbiAgICAgICAgICAgIGNvbnN0ICRlbCA9ICQoZWwpO1xuICAgICAgICAgICAgcmV0dXJuIDxJQ2hhcnRTZXR0aW5ncz57XG4gICAgICAgICAgICAgICAgaWQ6IGksXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXG4gICAgICAgICAgICAgICAgLy8geVBvaW50czogJGVsLmRhdGEoJ3BvaW50cycpLFxuICAgICAgICAgICAgICAgIC8vIHlQb2ludHM6IHRoaXMuZ2V0UmFuZG9tUG9pbnRzKE1hdGgucmFuZG9tKCkgKiAxMCArIDcsIE1hdGgucmFuZG9tKCkgKiAzMCArIDE4LCA2MCwgMC4zKSxcbiAgICAgICAgICAgICAgICB5UG9pbnRzOiB0aGlzLmdldFBvaW50cyhpKSxcbiAgICAgICAgICAgICAgICBjb2xvcjogdGhpcy5jb2xvcnNbJGVsLmRhdGEoJ2NvbG9yJyldLFxuICAgICAgICAgICAgICAgIGZpbGw6IGkgPT09IDAgPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgc2hvd246IGZhbHNlLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JhcGhzRGF0YS5tYXAoKGRhdGEpID0+IGRhdGEueVBvaW50cykpKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBnZXRQb2ludHMoaSk6IG51bWJlcltdIHtcbiAgICAgICAgcmV0dXJuIFtbMTQsIDEwLCAxMiwgMTMsIDE0LCA5ICwgMTIsIDE3LCAxNiwgMTEsIDEzLCAxOSwgMTAsIDksIDgsIDE1LCAxNywgMTUsIDIyLCAyNSwgMjEsIDIwLCAxOSwgMjEsIDIwLCAxOSwgMjQsIDI4LCAyMSwgMjcsIDE4LCAyMywgMzMsIDMxLCAxOCwgMjUsIDM2LCAyNCwgMzEsIDMzLCAyMSwgMzYsIDM0LCAzMCwgMjYsIDI0LCAzNSwgMjcsIDMwLCAxOCwgMjAsIDMwLCAyNiwgMjgsIDMzLCAyNSwgMzksIDI4LCAxNywgMzVdLCBbMSwgMiwgOCwgNywgNiwgMywgOCwgNSwgNSwgNCwgOCwgNywgNywgMTEsIDEwLCA4LCA3LCA5LCA4LCA2LCA4LCAxMiwgOCwgMTQsIDExLCA4LCA4LCAxMSwgNywgMTMsIDEzLCAxNiwgMjAsIDEwLCAxMCwgMTMsIDE0LCAyMCwgMTYsIDExLCAxNywgMTYsIDE4LCAyMSwgOCwgMjAsIDE1LCAxNSwgMTYsIDE1LCAxOSwgMjAsIDExLCAyMCwgMjAsIDEyLCAxNywgMjAsIDIzLCAxNl0sIFsxMywgMTEsIDYsIDksIDksIDgsIDksIDExLCA3LCAxNCwgMTIsIDgsIDEwLCAxNiwgOSwgMjAsIDE5LCAxMiwgMTIsIDE1LCAxOCwgMTUsIDE0LCAyMiwgMTksIDIwLCAyMCwgMTcsIDI0LCAyMywgMjcsIDIwLCAyMCwgMjEsIDIxLCAyNSwgMjAsIDI3LCAyMiwgMjQsIDI0LCAyNiwgMjMsIDI1LCAyNiwgMjEsIDI5LCAyNiwgMjcsIDI2LCAyNSwgMjAsIDE1LCAyNSwgMjIsIDI2LCAyMCwgMjMsIDMzLCAyOF0sIFsyLCA1LCAxMCwgOSwgMTgsIDksIDEwLCAxMiwgMjAsIDE5LCAxMywgOSwgMTUsIDExLCAyMSwgMTksIDIzLCAyMywgMjYsIDIzLCAyMywgMjMsIDI1LCAyNSwgMjYsIDI2LCAzMCwgMjIsIDI1LCAzMywgMzgsIDE2LCAzMiwgMjcsIDI3LCAzNSwgMjgsIDI4LCAzNSwgMzQsIDM2LCAyNSwgMjcsIDI1LCA0NSwgMzcsIDMxLCAzNiwgMzcsIDM2LCAyOCwgMzgsIDQyLCA0MiwgNDQsIDQzLCA0MSwgMzQsIDMxLCAzNl0sIFs3LCAxMCwgMTAsIDYsIDUsIDEzLCAxNywgMTMsIDEwLCAxMSwgMTQsIDE3LCAxNiwgMTksIDIyLCAyMCwgMjUsIDE3LCAyNCwgMTMsIDI1LCAyMCwgMjYsIDI0LCAyNiwgMTUsIDIzLCAyNCwgMzAsIDMwLCAyOSwgMzEsIDMxLCAyMSwgMzIsIDMxLCAyNSwgMzgsIDM1LCAyOCwgNDAsIDMyLCAzNywgMzEsIDM2LCA0MCwgMzUsIDM3LCAyMywgMzYsIDM3LCA0MCwgNDAsIDQxLCAxNywgMjMsIDQwLCAzNCwgNDAsIDQwXSwgWzYsIDYsIDIsIDEyLCAxMCwgMTMsIDEyLCA0LCAxMiwgMTEsIDEzLCAxNiwgMTQsIDE0LCAxNCwgMTQsIDE0LCAxNywgMTUsIDE2LCAxNiwgMTIsIDE4LCAxNSwgMjIsIDE2LCAxOSwgMTgsIDIxLCAyMSwgMjUsIDE1LCAyNiwgMTcsIDI3LCAyNywgMjEsIDEyLCAyNCwgMTUsIDE5LCAyOSwgMTgsIDI0LCAyNSwgMTgsIDI4LCAzMiwgMjUsIDI4LCAyNywgMjgsIDMxLCAyNSwgMjcsIDM1LCAyNCwgMjcsIDE1LCAyOF0sIFs0LCA1LCAxMCwgMTMsIDE1LCAxNywgNywgMTcsIDEyLCAxMiwgMTcsIDEyLCAxMiwgMTEsIDIyLCAyMSwgMTksIDIwLCAyMSwgMjYsIDIyLCAxOSwgMjEsIDI0LCAyNSwgMTIsIDI4LCAyNywgMjgsIDI3LCAzMSwgMzEsIDE1LCAzMCwgMjYsIDE5LCAyOSwgMjksIDMzLCAzMywgMTcsIDMwLCAzMCwgMzMsIDI3LCAzNCwgMzMsIDE3LCAzOSwgMjEsIDM1LCAzMywgMzMsIDIxLCAzNSwgMzAsIDM5LCAzMSwgMzUsIDI5XV1baV07XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZ2V0UmFuZG9tUG9pbnRzKG1pbjogbnVtYmVyLCBtYXg6IG51bWJlciwgYW1vdW50OiBudW1iZXIsIGNhc3Q6IG51bWJlcik6IG51bWJlcltdIHtcbiAgICAgICAgcmV0dXJuIEFycmF5LmFwcGx5KG51bGwsIHsgbGVuZ3RoOiBhbW91bnQgfSlcbiAgICAgICAgICAgIC5tYXAoKHAsIGksIGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCByYW5nZSA9IG1heCAtIG1pbjtcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjID0gaSAvIGEubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpbiA9IE1hdGguc2luKHBlcmMgKiBNYXRoLlBJIC8gMik7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm5kID0gMC40ICogKE1hdGgucmFuZG9tKCkgPCBjYXN0ID8gLTAuNSArIE1hdGgucmFuZG9tKCkgOiAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5SbmQgPSAoTWF0aC5yYW5kb20oKSAqIChwZXJjIDwgMC41ID8gMC45IDogMSkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLnJvdW5kKChtaW4gKiBtaW5SbmQpICsgKE1hdGgucmFuZG9tKCkgKiByYW5nZSAqIDAuMikgKyAoc2luICogcmFuZ2UgKiAoMC42ICsgcm5kKSkpO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgc2F2ZUNhY2hlKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmdyYXBoc0RhdGEuZm9yRWFjaCgoZGF0YSkgPT4ge1xuICAgICAgICAgICAgZGF0YS55UHggPSB0aGlzLmNhbGNZUHgoZGF0YS55UG9pbnRzKTtcbiAgICAgICAgICAgIGlmICghZGF0YS5sYWJlbFkpIHtcbiAgICAgICAgICAgICAgICBkYXRhLmxhYmVsWSA9IGRhdGEueVB4WzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiR0YWIub2ZmKCcudGFiJykub24oJ2NsaWNrLnRhYicsIHRoaXMub25DbGlja1RhYik7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgb25DbGlja1RhYiA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoJChlLmN1cnJlbnRUYXJnZXQpLmluZGV4KCkpO1xuICAgICAgICB0aGlzLmN1cnJlbnRDaGFydHMgPSB0aGlzLmdyYXBoc0RhdGEubWFwKChkYXRhLCBpKSA9PiBkYXRhLnNob3duID8gaSA6IG51bGwpLmZpbHRlcigoaW5kZXgpID0+IGluZGV4ICE9PSBudWxsKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBzaG93QmcoKTogdm9pZCB7XG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMsIHsgYmc6IHRydWUgfSk7XG4gICAgICAgIGdzYXAudG8odGhpcy5iZ0xpbmVzLCB7XG4gICAgICAgICAgICBzY2FsZVg6IDEsXG4gICAgICAgICAgICBkdXJhdGlvbjogMixcbiAgICAgICAgICAgIGVhc2U6ICdwb3dlcjMnLFxuICAgICAgICAgICAgc3RhZ2dlcjogLTAuMSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgaGlkZUJnKHF1aWNrPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLCB7IGJnOiB0cnVlIH0pO1xuICAgICAgICBnc2FwLnRvKHRoaXMuYmdMaW5lcywge1xuICAgICAgICAgICAgc2NhbGVYOiAwLFxuICAgICAgICAgICAgZHVyYXRpb246ICFxdWljayA/IDIgOiAwLFxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMycsXG4gICAgICAgICAgICBzdGFnZ2VyOiAhcXVpY2sgPyAtMC4xIDogMCxcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgdG9nZ2xlQ2hhcnQoaW5kZXg6IG51bWJlciwgc2hvdz86IGJvb2xlYW4sIHF1aWNrPzogYm9vbGVhbiwgZGVsYXk/OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgZGF0YSA9IHRoaXMuZ3JhcGhzRGF0YVtpbmRleF07XG4gICAgICAgIGlmICh0eXBlb2Ygc2hvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHNob3cgPSAhZGF0YS5zaG93bjtcbiAgICAgICAgfVxuXG4gICAgICAgIGdzYXAudG8oZGF0YSwge1xuICAgICAgICAgICAgZHVyYXRpb246ICFxdWljayA/IDMuMiA6IDAsXG4gICAgICAgICAgICB4UGVyY2VudDogc2hvdyA/IDEgOiAwLFxuICAgICAgICAgICAgbGFiZWxZOiBkYXRhLnlQeFtzaG93ID8gZGF0YS55UHgubGVuZ3RoIC0gMSA6IDBdLFxuICAgICAgICAgICAgcm91bmRQcm9wczogJ2xhYmVsWScsXG4gICAgICAgICAgICBlYXNlOiAncG93ZXIzJyxcbiAgICAgICAgICAgIGRlbGF5OiAhcXVpY2sgPyBkZWxheSB8fCAwIDogMCxcbiAgICAgICAgICAgIG9uVXBkYXRlOiB0aGlzLmRyYXcsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuJHRhYi5lcShpbmRleCkudG9nZ2xlQ2xhc3MoJ2lzLW9uLWNoYXJ0Jywgc2hvdyk7XG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YVtpbmRleF0uc2hvd24gPSBzaG93O1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGRyYXcgPSAoKTogdm9pZCA9PiB7XG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcbiAgICAgICAgdGhpcy5kcmF3QmcoKTtcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhLmZvckVhY2goKGdyYXBoRGF0YSkgPT4gdGhpcy5kcmF3R3JhcGgoZ3JhcGhEYXRhKSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZHJhd0JnKCk6IHZvaWQge1xuXG4gICAgICAgIC8vIGRyYXcgWCBheGlzXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gdGhpcy5jb2xvcnMud2hpdGU7XG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLmdyYXBoLmxlZnQsIHRoaXMuZ3JhcGguYm90dG9tKTtcbiAgICAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyMCwgdGhpcy5ncmFwaC5ib3R0b20pO1xuICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICBjb25zdCBoZWxwZXJzTGluZSA9IDg7XG4gICAgICAgIGNvbnN0IHRleHRUcmFuc2Zvcm0gPSA1O1xuICAgICAgICBjb25zdCBzdGVwID0gNTtcbiAgICAgICAgbGV0IHZhbDtcbiAgICAgICAgY29uc3QgeWVhcnMgPSBbMjAxNSwgMjAxNiwgMjAxNywgMjAxOCwgMjAxOSwgMjAyMCwgMjAyMV07XG5cbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmNvbG9ycy5ncmF5O1xuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gdGhpcy5jb2xvcnMuYmx1ZTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8PSBoZWxwZXJzTGluZTsgaSsrKSB7XG4gICAgICAgICAgICB2YWwgPSA1MCAtIHN0ZXAgKiBpO1xuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSB0aGlzLmJnTGluZXNbaV0uc2NhbGVYO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB2YWwgKyAnJywgMCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCArIHRleHRUcmFuc2Zvcm0pO1xuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xuICAgICAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5sZWZ0LCAodGhpcy5ncmFwaC5oZWlnaHQpIC8gaGVscGVyc0xpbmUgKiBpICsgdGhpcy5tYXJnaW4udG9wKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLmxlZnQgKyAodGhpcy5ncmFwaC53aWR0aCArIDIwKSAqIHRoaXMuYmdMaW5lc1tpXS5zY2FsZVgsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3ApO1xuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgeWVhcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IHRoaXMuY29sb3JzLndoaXRlO1xuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB5ZWFyc1tqXSArICcnLCB0aGlzLmdyYXBoLndpZHRoIC8geWVhcnMubGVuZ3RoICogaiArIHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRleHRUcmFuc2Zvcm0gKiAyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgZHJhd0dyYXBoID0gKGRhdGE6IElDaGFydFNldHRpbmdzKTogdm9pZCA9PiB7XG4gICAgICAgIGxldCBsYXN0VmFsOiBudW1iZXI7XG4gICAgICAgIGxldCBsYXN0WTogbnVtYmVyO1xuXG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMztcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICAgIHRoaXMuY3R4LmxpbmVKb2luID0gJ3JvdW5kJztcbiAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xuXG4gICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICBjb25zdCBjb2xXaWR0aCA9IHRoaXMuZ3JhcGgud2lkdGggLyAoZGF0YS55UHgubGVuZ3RoIC0gMSk7XG4gICAgICAgIGNvbnN0IG1heFggPSAoZGF0YS54UGVyY2VudCAqIGNvbFdpZHRoICogZGF0YS55UHgubGVuZ3RoKSArIHRoaXMuZ3JhcGgubGVmdDtcblxuICAgICAgICBkYXRhLnlQeC5mb3JFYWNoKCAoeSwgaSwgYSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgeCA9IGNvbFdpZHRoICogaSArIHRoaXMuZ3JhcGgubGVmdDtcbiAgICAgICAgICAgIGlmICh4IDw9IG1heFggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8oeCwgeSk7XG4gICAgICAgICAgICAgICAgbGFzdFkgPSB5O1xuICAgICAgICAgICAgICAgIGxhc3RWYWwgPSBkYXRhLnlQb2ludHNbaV07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHggPCBtYXhYICsgY29sV2lkdGggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyhtYXhYLCB5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcblxuICAgICAgICAvLyBmaWxsOlxuICAgICAgICBpZiAoZGF0YS5maWxsKSB7XG4gICAgICAgICAgICBsZXQgbGFzdFggPSB0aGlzLm1hcmdpbi5sZWZ0O1xuXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9ICd0cmFuc3BhcmVudCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAwLjQ7XG5cbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gY29sV2lkdGggKiBpICsgdGhpcy5ncmFwaC5sZWZ0O1xuICAgICAgICAgICAgICAgIGlmICh4IDw9IG1heFggJiYgZGF0YS54UGVyY2VudCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IHg7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh4IDwgbWF4WCArIGNvbFdpZHRoICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyhtYXhYLCB0aGlzLmdldEludGVyUG9pbnRzWShtYXhYLCBbeCAtIGNvbFdpZHRoLCBhW2kgLSAxXV0sIFt4LCB5XSkpO1xuICAgICAgICAgICAgICAgICAgICBsYXN0WCA9IG1heFg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obGFzdFgsIHRoaXMuZ3JhcGguYm90dG9tKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLmxlZnQsIHRoaXMuZ3JhcGguYm90dG9tKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGwoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbGFiZWw6XG4gICAgICAgIGlmIChkYXRhLnhQZXJjZW50ID4gMCkge1xuICAgICAgICAgICAgLy8gbGluZTpcbiAgICAgICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcbiAgICAgICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLmdyYXBoLnJpZ2h0LCBkYXRhLmxhYmVsWSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDI0LCBkYXRhLmxhYmVsWSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcblxuICAgICAgICAgICAgLy8gcGVudGFnb246XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gJ3RyYW5zcGFyZW50JztcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IGRhdGEuY29sb3I7XG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5yaWdodCArIDIwLCBkYXRhLmxhYmVsWSk7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDQwLCBkYXRhLmxhYmVsWSAtIDEyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgMTEwLCBkYXRhLmxhYmVsWSAtIDEyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgMTEwLCBkYXRhLmxhYmVsWSArIDEyKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgNDAsIGRhdGEubGFiZWxZICsgMTIpO1xuICAgICAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsKCk7XG5cbiAgICAgICAgICAgIC8vIHRleHQ6XG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XG4gICAgICAgICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxNHB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSB0aGlzLmNvbG9ycy53aGl0ZTtcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KGxhc3RWYWwgKyAnJywgdGhpcy5ncmFwaC5yaWdodCArIDQ0LCBkYXRhLmxhYmVsWSArIDQgKTtcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxuICAgIC8vLyBIRUxQRVJTXG5cbiAgICBwcml2YXRlIGxhcmdlc3RZVmFsKGRhdGE6IEFycmF5PG51bWJlcj4pOiBudW1iZXIge1xuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrICkge1xuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XG4gICAgICAgICAgICAgICAgbGFyZ2VzdCA9IGRhdGFbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGFyZ2VzdDtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBjYWxjWVB4KGRhdGEpOiBBcnJheTxudW1iZXI+IHtcbiAgICAgICAgY29uc3QgbGFyZ2VzdCA9IHRoaXMubGFyZ2VzdFlWYWwoZGF0YSk7XG4gICAgICAgIGxldCBhcnIgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBpdGVtID0gTWF0aC5yb3VuZCgodGhpcy5ncmFwaC5oZWlnaHQgLSBkYXRhW2ldIC8gbGFyZ2VzdCAqIHRoaXMuZ3JhcGguaGVpZ2h0KSArIHRoaXMuZ3JhcGgudG9wKTtcbiAgICAgICAgICAgIGFyci5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBnZXRJbnRlclBvaW50c1koeDogbnVtYmVyLCBwb2ludEE6IG51bWJlcltdLCBwb2ludEI6IG51bWJlcltdKTogbnVtYmVyIHtcbiAgICAgICAgY29uc3QgW3gxLCB5MV0gPSBwb2ludEE7XG4gICAgICAgIGNvbnN0IFt4MiwgeTJdID0gcG9pbnRCO1xuICAgICAgICByZXR1cm4gKHkyIC0geTEpICogKHggLSB4MSkgLyAoeDIgLSB4MSkgKyB5MTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RXZlbnRzIHtcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENIQU5HRTogc3RyaW5nID0gJ2NoYW5nZSc7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDb21wb25lbnQgZXh0ZW5kcyBIYW5kbGVyIHtcblxuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/OiBPYmplY3QpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgaWYgKCF2aWV3WzBdKSB7IGNvbnNvbGUud2FybignY29tcG9uZW50IGJ1aWx0IHdpdGhvdXQgdmlldycpOyB9XG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgdGhpcyk7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBwcmVsb2FkSW1hZ2VzKCk6IEFycmF5PHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gW107XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG5cblxuICAgIHB1YmxpYyBhbmltYXRlSW4oaW5kZXg/OiBudW1iZXIsIGRlbGF5PzogbnVtYmVyKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcblxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgd2FudCB0byBhbmltYXRlIGNvbXBvbmVudCxcbiAgICAgICAgLy8ganVzdCByZXR1cm4gZW1wdHkgUHJvbWlzZTpcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuICAgICAgICAvLyBpZiB5b3UgbmVlZCBhbmltYXRpb246XG4gICAgICAgIC8vIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgIC8vICAgICBnc2FwLnRvKHRoaXMudmlldywge1xuICAgICAgICAvLyAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgLy8gICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAvLyAgICAgICAgIH0sXG4gICAgICAgIC8vICAgICAgICAgZHVyYXRpb246IDAuMyxcbiAgICAgICAgLy8gICAgICAgICBvcGFjaXR5OiAwLFxuICAgICAgICAvLyAgICAgfSk7XG4gICAgICAgIC8vIH0pO1xuICAgIH1cblxuXG5cbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHsgfVxuXG5cblxuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7IH1cblxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7IH07XG5cblxuXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdjb21wJywgbnVsbCk7XG4gICAgICAgIHRoaXMudmlldy5vZmYoKTtcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5cbmV4cG9ydCBjbGFzcyBEYXNoYm9hcmQgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSAkdG9nZ2xlOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkYm9keTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNUb2dnbGVkOiBib29sZWFuO1xuICAgIHByaXZhdGUgYm9keUhlaWdodDogbnVtYmVyO1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRvZ2dsZSA9IHRoaXMudmlldy5maW5kKCcuanMtYnV0dG9uLXRvZ2dsZScpO1xuICAgICAgICB0aGlzLiRib2R5ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1kYXNoYm9hcmQtYm9keScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB0aGlzLmluaXRpYWxTdGF0ZSgpO1xuICAgIH1cblxuXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xuXG4gICAgfTtcblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdG9nZ2xlLm9mZignLnRvZ2dsZScpLm9uKCdjbGljay50b2dnbGUnLCB0aGlzLnRvZ2dsZVBhbmVsKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHRvZ2dsZVBhbmVsID0gKGUpID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzVG9nZ2xlZCkge1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRib2R5LCB7IGR1cmF0aW9uOiAwLjUsIGhlaWdodDogJ2F1dG8nLCBlYXNlOiAncG93ZXIyLmluT3V0JyxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzVG9nZ2xlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy10b2dnbGVkJyk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnMCcsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHByaXZhdGUgaW5pdGlhbFN0YXRlKCk6IHZvaWQge1xuICAgICAgICBnc2FwLnNldCh0aGlzLiRib2R5LCB7IGhlaWdodDogJzAnfSk7XG4gICAgfVxuICAgIFxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBGaWx0ZXJzIH0gZnJvbSAnLi9GaWx0ZXJzJztcblxuZXhwb3J0IGNsYXNzIERyb3Bkb3duIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RdJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdmFsdWVdJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgICAgIHRoaXMudmlldy5hdHRyKCdkYXRhLXNlbGVjdGVkJywgdGhpcy4kc2VsZWN0ZWQudGV4dCgpKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3Lm9mZignLnNlbGVjdCcpLm9uKCdjbGljay5zZWxlY3QnLCB0aGlzLnRvZ2dsZSk7XG4gICAgICAgICRkb2Mub2ZmKCcuZHJvcGRvd24nKS5vbignY2xpY2suZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlID0gKGUpID0+IHtcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtb3BlbicpO1xuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICgkKGUuY3VycmVudFRhcmdldCkuaGFzQ2xhc3MoJ2pzLWl0ZW0nKSAmJiAhdGhpcy5pc09wZW4pIHsgcmV0dXJuOyB9XG4gICAgICAgIGlmICgkKGUudGFyZ2V0KS5jbG9zZXN0KHRoaXMudmlldykubGVuZ3RoIDw9IDApIHtcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25JdGVtQ2xpY2sgPSAoZSkgPT4ge1xuICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCkuZGF0YSgndmFsdWUnKTtcblxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmh0bWwoY3VycmVudCk7XG5cbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQtY291bnRyeScsIGN1cnJlbnQpO1xuXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudCk7XG4gICAgICAgIH0sIDMwMCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XG5cblxuZXhwb3J0IGNsYXNzIEZpbHRlcnMgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogRmlsdGVycztcblxuICAgIHByaXZhdGUgJGNsZWFyOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkcGFuZWw6IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtU2VjdG9yOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbVRpbWU6IEpRdWVyeTtcbiAgICBwcml2YXRlICR0aW1lbGluZUl0ZW06IEpRdWVyeTtcbiAgICBwcml2YXRlICRpdGVtQ291bnRyeTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGFsbFNlY3RvcnM6IEpRdWVyeTtcbiAgICBwcml2YXRlICRwaWNrZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRzZWxlY3RlZENvdW50cnk6IEpRdWVyeTtcblxuICAgIHByaXZhdGUgZmlsdGVyczogQXJyYXk8c3RyaW5nPiA9IFtdO1xuICAgIHByaXZhdGUgaXNBbGxDaGVja2VkOiBib29sZWFuO1xuXG5cbiAgICBwdWJsaWMgc3RhdGljIHNob3dQaWNrZWRGaWx0ZXJzKGNvdW50cnk/OiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgbGV0IHBpY2tlZFNlY3RvcnMgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcbiAgICAgICAgbGV0IHBpY2tlZFRpbWUgPSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xuICAgICAgICBsZXQgcGlja2VkQ291bnRyeSA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1Db3VudHJ5LmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtQ291bnRyeS5maWx0ZXIoJy5pcy1hY3RpdmUnKS50ZXh0KCkgOiBGaWx0ZXJzLmluc3RhbmNlLiRzZWxlY3RlZENvdW50cnkudmFsKCk7XG5cblxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuZmluZCgnc3BhbicpLnJlbW92ZSgpO1xuXG4gICAgICAgIGlmIChwaWNrZWRTZWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRTZWN0b3JzKTtcblxuICAgICAgICAgICAgaWYgKHBpY2tlZFNlY3RvcnMubGVuZ3RoID09PSBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtU2VjdG9yLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWwnLCBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzKTtcbiAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3Bhbj4nICsgRmlsdGVycy5pbnN0YW5jZS4kYWxsU2VjdG9ycy50ZXh0KCkgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBsZXQgY29tYSA9ICcsJztcbiAgICAgICAgICAgICAgICBsZXQgY2xzID0gJ3RhZyc7XG4gICAgICAgICAgICAgICAgcGlja2VkU2VjdG9ycy5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBwaWNrZWRTZWN0b3JzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbWEgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGNscyA9ICd0YWctbGFzdCc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4gY2xhc3M9JyArIGNscyArICc+JyArICQoZWwpLnRleHQoKSArIGNvbWEgKyAnPC9zcGFuPicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZENvdW50cnkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHBpY2tlZENvdW50cnkpO1xuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZENvdW50cnkgKyAnPC9zcGFuPicpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHBpY2tlZFRpbWUpIHtcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBwaWNrZWRUaW1lLmRhdGEoJ2l0ZW0tbGFiZWwnKSArICc8L3NwYW4+Jyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kY2xlYXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsZWFyJyk7XG4gICAgICAgIHRoaXMuJHBhbmVsID0gdGhpcy52aWV3LmZpbmQoJy5qcy1wYW5lbCcpO1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lID0gdGhpcy52aWV3LmZpbmQoJy5qcy10aW1lJyk7XG4gICAgICAgIHRoaXMuJHRpbWVsaW5lSXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10aW1lXScpO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWFsbCcpO1xuICAgICAgICB0aGlzLiRwaWNrZWQgPSAkKCcuanMtcGlja2VkLWZpbHRlcicpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZENvdW50cnkgPSB0aGlzLnZpZXcuZmluZCgnI3NlYXJjaC1jb3VudHJ5Jyk7XG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWNvdW50cnknKTtcblxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlID0gdGhpcztcbiAgICAgICAgY29uc29sZS5sb2coRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3RvciwgRmlsdGVycy5pbnN0YW5jZS52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdGVkXScpLmRhdGEoJ3NlbGVjdGVkJykpO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgdGhpcy5zZXREZWZhdWx0U2VsZWN0aW9uKCk7XG4gICAgfVxuXG5cbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XG4gICAgICAgIC8vIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAvLyAgICAgdGhpcy4kY2xlYXIuY3NzKCdoZWlnaHQnLCB0aGlzLiRwYW5lbC5vdXRlckhlaWdodCgpKTtcbiAgICAgICAgLy8gfSk7XG4gICAgfTtcblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLm9mZignLnNlY3RvcicpLm9uKCdjbGljay5zZWN0b3InLCB0aGlzLnRvZ2dsZVNlY3Rvcik7XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLm9mZignLnRpbWUnKS5vbignY2xpY2sudGltZScsIHRoaXMudG9nZ2xlVGltZSk7XG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5Lm9mZignLmNvdW50cnknKS5vbignY2xpY2suY291bnRyeScsIHRoaXMudG9nZ2xlQ291bnRyeSk7XG4gICAgICAgIHRoaXMuJGNsZWFyLm9mZignLmNsZWFyJykub24oJ2NsaWNrLmNsZWFyJywgdGhpcy5jbGVhckFycmF5KTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5vZmYoJy5hbGwnKS5vbignY2xpY2suYWxsJywgdGhpcy5tYXJrQWxsU2VjdG9ycyk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIG1hcmtBbGxTZWN0b3JzKCk6IHZvaWQge1xuICAgICAgICBjb25zdCB0aW1lQ2hlY2tlZCA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG5cbiAgICAgICAgdGhpcy5jbGVhckFycmF5KCk7XG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IuZWFjaCgoaSwgZWwpID0+IHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoJChlbCksIHRoaXMuZmlsdGVycyk7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aW1lQ2hlY2tlZCkge1xuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSh0aW1lQ2hlY2tlZCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKHRpbWVDaGVja2VkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgY2xlYXJBcnJheSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgdGhpcy5maWx0ZXJzID0gW107XG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xuICAgICAgICB0aGlzLnVubWFya1RpbWVsaW5lKCk7XG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHNlbGVjdGVkQ291bnRyeS52YWwoJycpO1xuICAgICAgICB0aGlzLnNldERlZmF1bHRTZWxlY3Rpb24oKTtcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cblxuICAgIC8vIERFRkFVTFQgU0VMRUNUSU9OOiBBTEwgRklMVEVSUyAoQUxMIFNFQ1RPUlMvQUxMIENPVU5UUklFUy9BTEwgVElNRSlcbiAgICBwcml2YXRlIHNldERlZmF1bHRTZWxlY3Rpb24oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGhpcy4kaXRlbVRpbWUuZmlsdGVyKCdbZGF0YS1pdGVtPVwiYWxsLXRpbWVcIl0nKSwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSh0aGlzLiRpdGVtQ291bnRyeSwgdGhpcy5maWx0ZXJzKTtcblxuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcblxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZVNlY3RvciA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMuaXNBbGxDaGVja2VkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy4kYWxsU2VjdG9ycy5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlVGltZSA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcblxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlRWxlbWVudEZyb21BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgYWN0aXZlUHJldiA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XG5cbiAgICAgICAgICAgIGlmIChhY3RpdmVQcmV2KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGFjdGl2ZVByZXYsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZShjdXJyZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcbiAgICB9XG5cblxuICAgIHByaXZhdGUgdG9nZ2xlQ291bnRyeSA9IChlKSA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG5cbiAgICAgICAgaWYgKGN1cnJlbnQuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoY3VycmVudCwgdGhpcy5maWx0ZXJzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudC5kYXRhKCdpdGVtJykpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBtYXJrVGltZWxpbmUoZWw6IEpRdWVyeSk6IHZvaWQge1xuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2pzLXRpbWUnKSkge1xuICAgICAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgICAgIGNvbnN0IHRpbWVsaW5lZG90ID0gdGhpcy4kdGltZWxpbmVJdGVtLmZpbHRlcignW2RhdGEtdGltZT0nICsgZWwuZGF0YSgnaXRlbScpICsgJ10nKTtcbiAgICAgICAgICAgIHRpbWVsaW5lZG90LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgcHJpdmF0ZSB1bm1hcmtUaW1lbGluZSgpOiB2b2lkIHtcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5maWx0ZXJzLmluZGV4T2YoJGVsLmRhdGEoJ2l0ZW0nKSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBhZGRFbGVtZW50VG9BcnJheSgkZWw6IEpRdWVyeSwgYXJyYXk6IEFycmF5PHN0cmluZz4pOiB2b2lkIHtcbiAgICAgICAgYXJyYXkucHVzaCgkZWwuZGF0YSgnaXRlbScpKTtcbiAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgY29uc29sZS5sb2coJ0ZJTFRFUlM6JywgdGhpcy5maWx0ZXJzKTtcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xuXG5pbnRlcmZhY2UgSURhdGFTdGF0IHtcbiAgICBzZWN0b3I6IHN0cmluZztcbiAgICB2YWx1ZTogbnVtYmVyO1xuICAgIGNvbG9yOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJR3JpZEl0ZW1Qb3NpdGlvbiB7XG4gICAgY29sdW1uX3N0YXJ0OiBudW1iZXI7XG4gICAgY29sdW1uX2VuZDogbnVtYmVyO1xuICAgIHJvd19zdGFydDogbnVtYmVyO1xuICAgIHJvd19lbmQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIE1hc29ucnkgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSBkYXRhOiBBcnJheTxJRGF0YVN0YXQ+ID0gW107XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgZGF0YUFycmF5OiBBcnJheTxhbnk+ID0gW107XG4gICAgcHJpdmF0ZSBhcmVhOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBpdGVtTWFyZ2luOiBudW1iZXIgPSAzO1xuICAgIHByaXZhdGUgZ3JpZFJvd3M6IG51bWJlciA9IDIwO1xuICAgIHByaXZhdGUgZ3JpZENvbHM6IG51bWJlciA9IDIwO1xuICAgIHByaXZhdGUgZ3JpZENlbGxzOiBudW1iZXIgPSB0aGlzLmdyaWRDb2xzICogdGhpcy5ncmlkUm93cztcbiAgICBwcml2YXRlIGNlbGxzQmFsYW5jZTogbnVtYmVyID0gdGhpcy5ncmlkQ2VsbHM7XG4gICAgcHJpdmF0ZSBncmlkQ2VsbDogYW55ID0ge1xuICAgICAgICB3aWR0aDogdGhpcy52aWV3LndpZHRoKCkgLyB0aGlzLmdyaWRDb2xzLFxuICAgICAgICBoZWlnaHQ6IHRoaXMudmlldy5oZWlnaHQoKSAvIHRoaXMuZ3JpZFJvd3MsXG4gICAgfTtcbiAgICBwcml2YXRlIG1pbkNlbGxXaWR0aDogbnVtYmVyID0gMztcbiAgICBwcml2YXRlIG1pbkNlbGxIZWlnaHQ6IG51bWJlciA9IDM7XG5cbiAgICBwcml2YXRlIGl0ZW1Qb3NpdGlvbmluZzogQXJyYXk8SUdyaWRJdGVtUG9zaXRpb24+ID0gW107XG5cbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcbiAgICAgICAgc3VwZXIodmlldyk7XG5cbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbWFzb25yeS10aWxlJyk7XG4gICAgICAgIHRoaXMuJGl0ZW0uZWFjaCggKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBkYXRhSXRlbSA9IDxJRGF0YVN0YXQ+e1xuICAgICAgICAgICAgICAgIHNlY3RvcjogJChlbCkuZGF0YSgndGlsZScpLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAkKGVsKS5kYXRhKCd2YWx1ZScpLFxuICAgICAgICAgICAgICAgIGNvbG9yOiAkKGVsKS5kYXRhKCdjb2xvcicpLFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZGF0YS5wdXNoKGRhdGFJdGVtKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuYXJlYSA9ICh0aGlzLnZpZXcud2lkdGgoKSAtIHRoaXMuaXRlbU1hcmdpbiAqIDMpICogdGhpcy52aWV3LmhlaWdodCgpO1xuXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YSwgdGhpcy5hcmVhLCAnY2VsbCB3aWR0aCcsIHRoaXMuZ3JpZENlbGwud2lkdGgsICdjZWxsIGhlaWdodCcsIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KTtcblxuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcbiAgICAgICAgXG4gICAgfTtcblxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcbiAgICAgICAgLy8gdGhpcy5zZXRUaWxlU2l6ZSgpO1xuICAgICAgICB0aGlzLmdldEFyckZyb21PYmplY3QoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGdldEFyckZyb21PYmplY3QoKTogYW55IHtcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkgPSBPYmplY3QuZW50cmllcyh0aGlzLmRhdGEpLnNvcnQoKGEsIGIpID0+IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSk7XG5cbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5kYXRhQXJyYXkpO1xuXG4gICAgICAgIHRoaXMuZGF0YUFycmF5LmZvckVhY2goIChlbCwgaSkgPT4ge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZWxbMV0udmFsdWUsIGksICdlbCcpO1xuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBlbFsxXS52YWx1ZTtcbiAgICAgICAgICAgIGNvbnN0IHNlY3RvciA9IGVsWzFdLnNlY3RvcjtcbiAgICAgICAgICAgIGNvbnN0IGNvbG9yID0gZWxbMV0uY29sb3I7XG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XG5cbiAgICAgICAgICAgIC8vIHRoaXMuc2V0VGlsZVNpemUoc2VjdG9yLCB2YWx1ZSwgY29sb3IsIGluZGV4KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzZXRUaWxlU2l6ZShzZWN0b3I6IHN0cmluZywgdmFsdWU6IG51bWJlciwgY29sb3I6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXRpbGU9JyArIHNlY3RvciArICddJyk7XG4gICAgICAgIGxldCBhcmVhLCBoLCB3LCB0LCBsLCBjb2x1bW5fc3RhcnQsIGNvbHVtbl9lbmQsIHJvd19zdGFydCwgcm93X2VuZCwgaXRlbSwgYXJlYUdyaWQ7XG4gICAgICAgIFxuICAgICAgICBhcmVhID0gdGhpcy5hcmVhICogKHZhbHVlIC8gMTAwKTtcblxuICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmVhLCAnOmFyZWEnLCB0aGlzLml0ZW1Qb3NpdGlvbmluZyx0aGlzLml0ZW1Qb3NpdGlvbmluZy5sZW5ndGggPiAwLCAnY2hlY2sgaWYgc29tZSBpdGVtIG9uIGFycmF5Jyk7XG4gICAgICAgIFxuICAgICAgICBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydCA9IDE7XG4gICAgICAgICAgICByb3dfc3RhcnQgPSAxO1xuICAgICAgICAgICAgcm93X2VuZCA9IHRoaXMuZ3JpZFJvd3M7XG4gICAgICAgICAgICBjb2x1bW5fZW5kID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwuaGVpZ2h0ICogcm93X2VuZCkgLyB0aGlzLmdyaWRDZWxsLndpZHRoKTtcbiAgICAgICAgICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpO1xuICAgICAgICAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGlmIChpbmRleCA+IDApIHtcbiAgICAgICAgLy8gICAgIGNvbHVtbl9zdGFydCA9IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDwgdGhpcy5ncmlkQ29scyAtIHRoaXMubWluQ2VsbFdpZHRoID8gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgOiB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0yXS5jb2x1bW5fZW5kICsgMTtcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwud2lkdGggKiB0aGlzLmdyaWRDZWxsLmhlaWdodCkpID49IDYgPyBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgOiA2O1xuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBhcmVhR3JpZCAlIDIgPT09IDAgPyBhcmVhR3JpZCA6IGFyZWFHcmlkIC0gMTtcbiAgICAgICAgLy8gICAgIGNvbHVtbl9lbmQgPSBhcmVhR3JpZCAvIHRoaXMubWluQ2VsbFdpZHRoIFxuXG4gICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhhcmVhR3JpZCwgJ2Ftb3VudCBvZiBjZWxscycpO1xuICAgICAgICAvLyB9XG5cbiAgICAgICAgaXRlbSA9IDxJR3JpZEl0ZW1Qb3NpdGlvbj57XG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQ6IGNvbHVtbl9zdGFydCxcbiAgICAgICAgICAgIGNvbHVtbl9lbmQ6IGNvbHVtbl9lbmQsXG4gICAgICAgICAgICByb3dfc3RhcnQ6IHJvd19zdGFydCxcbiAgICAgICAgICAgIHJvd19lbmQ6IHJvd19lbmQsXG4gICAgICAgIH07XG5cbiAgICAgICAgY3VycmVudC5jc3Moe1xuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLXN0YXJ0JzogY29sdW1uX3N0YXJ0LFxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLWVuZCc6IGNvbHVtbl9lbmQsXG4gICAgICAgICAgICAnZ3JpZC1yb3ctc3RhcnQnOiByb3dfc3RhcnQsXG4gICAgICAgICAgICAnZ3JpZC1yb3ctZW5kJzogJ3NwYW4nICsgcm93X2VuZCxcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogY29sb3IsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuaXRlbVBvc2l0aW9uaW5nLnB1c2goaXRlbSk7XG4gICAgICAgIHRoaXMuY2VsbHNCYWxhbmNlID0gdGhpcy5jZWxsc0JhbGFuY2UgLSBhcmVhR3JpZDtcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5jZWxsc0JhbGFuY2UsICc6ZnJlZSBjZWxscycpO1xuICAgICAgICBcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7Q29tcG9uZW50fSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuXG5cblxuaW50ZXJmYWNlIElQYXJhbGxheFNldHRpbmdzIHtcbiAgICBlbGVtZW50czogQXJyYXk8c3RyaW5nPjtcbiAgICBtb3ZlWDogQXJyYXk8bnVtYmVyPjtcbiAgICBtb3ZlWTogQXJyYXk8bnVtYmVyPjtcbn1cblxuXG5pbnRlcmZhY2UgSVBhcmFsbGF4RWxlbWVudERhdGEge1xuICAgICRlbDogSlF1ZXJ5O1xuICAgIG1vdmVYOiBudW1iZXI7XG4gICAgbW92ZVk6IG51bWJlcjtcbn1cblxuXG5cbmV4cG9ydCBjbGFzcyBQYXJhbGxheCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIG1vdmVYOiBudW1iZXI7XG4gICAgcHJpdmF0ZSBtb3ZlWTogbnVtYmVyO1xuICAgIHByaXZhdGUgdGltZTogbnVtYmVyID0gMjtcbiAgICBwcml2YXRlIHNldHRpbmdzOiBJUGFyYWxsYXhTZXR0aW5ncztcbiAgICBwcml2YXRlIGl0ZW1zOiBJUGFyYWxsYXhFbGVtZW50RGF0YVtdO1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLnNldHRpbmdzID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5jcmVhdGVWYWx1ZUFycmF5KCk7XG5cbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ1BhcmFsbGF4JywgdGhpcyk7XG5cblxuICAgICAgICBpZiAoYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5vbignbW91c2Vtb3ZlJywgdGhpcy5vbk1vdXNlTW92ZSk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY3JlYXRlVmFsdWVBcnJheSgpOiB2b2lkIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3JzID0gKHRoaXMuc2V0dGluZ3MuZWxlbWVudHMpLnRvU3RyaW5nKCkucmVwbGFjZSgvXFxzL2csICcnKS5zcGxpdCgnLCcpO1xuICAgICAgICBjb25zdCBtb3ZlWCA9ICh0aGlzLnNldHRpbmdzLm1vdmVYKS5tYXAoTnVtYmVyKTtcbiAgICAgICAgY29uc3QgbW92ZVkgPSAodGhpcy5zZXR0aW5ncy5tb3ZlWSkubWFwKE51bWJlcik7XG5cbiAgICAgICAgdGhpcy5pdGVtcyA9IHNlbGVjdG9ycy5tYXAoKHNlbCwgaSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy52aWV3LmZpbmQoJy4nICsgc2VsKTtcbiAgICAgICAgICAgIGlmICghJGVsWzBdKSB7IGNvbnNvbGUud2FybihgVGhlcmUgaXMgbm8gLiR7c2VsfSBlbGVtZW50IHRvIHVzZSBpbiBwYXJhbGxheGApOyB9XG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICRlbDogJGVsLFxuICAgICAgICAgICAgICAgIG1vdmVYOiBtb3ZlWFtpXSxcbiAgICAgICAgICAgICAgICBtb3ZlWTogbW92ZVlbaV0sXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KS5maWx0ZXIoKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiAhIWl0ZW0uJGVsWzBdO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvbk1vdXNlTW92ZSA9IChldmVudCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLm1vdmVYID0gKCBldmVudC5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpIC0gMC41O1xuICAgICAgICB0aGlzLm1vdmVZID0gKCBldmVudC5jbGllbnRZIC8gd2luZG93LmlubmVySGVpZ2h0KSAtIDAuNTtcblxuICAgICAgICB0aGlzLmFuaW1hdGUoLXRoaXMubW92ZVgsIC10aGlzLm1vdmVZKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBhbmltYXRlKG1vdmVYLCBtb3ZlWSk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuaXRlbXMpIHsgcmV0dXJuOyB9XG4gICAgICAgIHRoaXMuaXRlbXMuZm9yRWFjaCgoaXRlbSwgaSkgPT4ge1xuICAgICAgICAgICAgZ3NhcC50byhpdGVtLiRlbCwge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnRpbWUsXG4gICAgICAgICAgICAgICAgeDogbW92ZVggKiBpdGVtLm1vdmVYLFxuICAgICAgICAgICAgICAgIHk6IG1vdmVZICogaXRlbS5tb3ZlWSxcbiAgICAgICAgICAgICAgICBlYXNlOiAncG93ZXIyJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcblxuXG5leHBvcnQgY2xhc3MgUmFuZ2UgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgXG4gICAgcHJpdmF0ZSAkdHJpZ2dlcjogSlF1ZXJ5O1xuICAgIHByaXZhdGUgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRyYWRpbzogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJHRyaWdnZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRyaWdnZXInKTtcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtc2VsZWN0ZWRdJyk7XG4gICAgICAgIHRoaXMuJHJhZGlvID0gdGhpcy52aWV3LmZpbmQoJ2lucHV0W3R5cGU9cmFkaW9dJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRyaWdnZXIub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlKTtcbiAgICAgICAgJGRvYy5vZmYoJy5zbWFsbGRyb3Bkb3duJykub24oJ2NsaWNrLnNtYWxsZHJvcGRvd24nLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICB0aGlzLiRyYWRpby5vZmYoJy5zZWxlY3Rpb24nKS5vbignY2xpY2suc2VsZWN0aW9uJywgdGhpcy5vbkl0ZW1DbGljayk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBvcGVuU2VsZWN0KGUpOiB2b2lkIHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgY2xvc2VTZWxlY3QoKTogdm9pZCB7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnb3Blbj8nKTtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoJChlLmN1cnJlbnRUYXJnZXQpLmhhc0NsYXNzKCdqcy1pdGVtJykgfHwgIXRoaXMuaXNPcGVuKSB7IHJldHVybjsgfVxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uSXRlbUNsaWNrID0gKGUpID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ3ZhbHVlJyk7XG5cbiAgICAgICAgdGhpcy5jbG9zZVNlbGVjdCgpO1xuICAgICAgICB0aGlzLiRzZWxlY3RlZC5odG1sKGN1cnJlbnQpO1xuXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkLmF0dHIoJ2RhdGEtc2VsZWN0ZWQnLCBjdXJyZW50KTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IEZpbHRlcnMgfSBmcm9tICcuL0ZpbHRlcnMnO1xuXG5leHBvcnQgY2xhc3MgU2VhcmNoIGV4dGVuZHMgQ29tcG9uZW50IHtcblxuXG4gICAgcHJpdmF0ZSAkaW5wdXQ6IEpRdWVyeTtcbiAgICBwcml2YXRlICRsaXZlSXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJGxpdmVMaXN0OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbUNvdW50cnk6IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRpbnB1dCA9IHRoaXMudmlldy5maW5kKCdpbnB1dCcpO1xuICAgICAgICAvLyB0aGlzLiRsaXZlSXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbGl2ZS1pdGVtJyk7XG4gICAgICAgIHRoaXMuJGxpdmVMaXN0ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1saXZlLWxpc3QnKTtcbiAgICAgICAgdGhpcy4kaXRlbUNvdW50cnkgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0tY291bnRyeScpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRpbnB1dC5vbignZm9jdXMnLCAoKSA9PiB0aGlzLm9uRm9jdXMoKSk7XG4gICAgICAgIHRoaXMuJGlucHV0Lm9uKCdibHVyJywgKCkgPT4gdGhpcy5vbkJsdXIoKSk7XG4gICAgICAgIHRoaXMuJGlucHV0Lm9uKCdpbnB1dCcsICgpID0+IHRoaXMub25JbnB1dCgpKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uRm9jdXMoKTogdm9pZCB7XG4gICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtZm9jdXMnKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQmx1cigpOiB2b2lkIHtcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1mb2N1cycpO1xuICAgIH1cbiAgICBcbiAgICBwcml2YXRlIG9uSW5wdXQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJGlucHV0LnZhbCgpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLWxpdmVzZWFyY2hpbmcnKSA6IHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtbGl2ZXNlYXJjaGluZycpO1xuXG4gICAgICAgIGlmICh0aGlzLiRsaXZlTGlzdC5maW5kKCcuanMtbGl2ZS1pdGVtJykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdGhpcy4kbGl2ZUl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWxpdmUtaXRlbScpO1xuXG4gICAgICAgICAgICB0aGlzLiRsaXZlSXRlbS5vZmYoJy5saXZlJykub24oJ2NsaWNrLmxpdmUnLCB0aGlzLm9uTGl2ZUNsaWNrKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgb25MaXZlQ2xpY2sgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xuXG4gICAgICAgIHRoaXMuJGlucHV0LnZhbChjdXJyZW50LnRleHQoKSk7XG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5LnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXIgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIFxuICAgIHByaXZhdGUgaW5kZXg6IG51bWJlciA9IDA7XG4gICAgcHJpdmF0ZSAkbmF2OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkY2FwdGlvbnM6IEpRdWVyeTtcblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XG4gICAgICAgIHRoaXMuJG5hdiA9IHRoaXMudmlldy5maW5kKCcuanMtbmF2Jyk7XG4gICAgICAgIHRoaXMuJGNhcHRpb25zID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jYXB0aW9uJyk7XG5cbiAgICAgICAgdGhpcy5iaW5kKCk7XG4gICAgfVxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJG5hdi5vZmYoJy5uYXYnKS5vbignY2xpY2submF2JywgdGhpcy5zd2l0Y2hTbGlkZSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzd2l0Y2hTbGlkZSA9IChlKTogdm9pZCA9PiB7XG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XG4gICAgICAgIHRoaXMuaW5kZXggPSBjdXJyZW50LmluZGV4KCk7XG5cbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJG5hdiwgMCk7XG4gICAgICAgIHRoaXMuc2V0QWN0aXZlRWxlbWVudCh0aGlzLiRpdGVtLCAxMDApO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZUVsZW1lbnQodGhpcy4kY2FwdGlvbnMsIDEwMDApO1xuICAgIH1cblxuXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVFbGVtZW50KGVsOiBKUXVlcnksIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcbiAgICAgICAgZWwucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICBcbiAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xuICAgICAgICAgICAgZWwuZXEodGhpcy5pbmRleCkuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB9LCBkZWxheSk7XG4gICAgfVxufSIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcbmltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcblxuXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xuXG4gICAgcHJpdmF0ZSAkdGFiOiBKUXVlcnk7XG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xuICAgIHByaXZhdGUgJHdyYXA6IEpRdWVyeTtcbiAgICBwcml2YXRlICRjdXJyZW50OiBKUXVlcnk7XG4gICAgcHJpdmF0ZSB0YWJUb1Nob3c6IG51bWJlcjsgLy8gZm9yIGFzeW5jIHN3aXRjaFxuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xuICAgICAgICBzdXBlcih2aWV3KTtcblxuICAgICAgICB0aGlzLiR0YWIgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtdGFiXScpO1xuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZpZXddJyk7XG4gICAgICAgIHRoaXMuJHdyYXAgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRhYnMtd3JhcHBlcicpO1xuXG4gICAgICAgIHRoaXMuYmluZCgpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcocGFyc2VJbnQoVXRpbHMuZ2V0UGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpLnRhYiwgMTApIHx8IDApO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vblRhYkNsaWNrKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBvblRhYkNsaWNrID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcbiAgICAgICAgY29uc3QgaW5kZXggPSBjdXJyZW50LmRhdGEoJ3RhYicpO1xuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcoaW5kZXgpO1xuICAgIH1cblxuXG5cbiAgICBwcml2YXRlIHNldEFjdGl2ZVZpZXcoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgICAgICB0aGlzLnRhYlRvU2hvdyA9IGluZGV4O1xuICAgICAgICB0aGlzLiR0YWIucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICB0aGlzLiR0YWIuZmlsdGVyKCdbZGF0YS10YWI9JyArIGluZGV4ICsgJ10nKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuaGlkZUN1cnJlbnQoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIHRoaXMuY2xlYW5DYWNoZWRBbmltKCk7XG4gICAgICAgICAgICB0aGlzLnNob3codGhpcy50YWJUb1Nob3cpO1xuICAgICAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBudWxsO1xuICAgICAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcblxuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBoaWRlQ3VycmVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgIGlmICghdGhpcy4kY3VycmVudCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxuICAgICAgICAgICAgZ3NhcC50byh0aGlzLiRjdXJyZW50LCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC4zLFxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIHByaXZhdGUgY2xlYW5DYWNoZWRBbmltKCk6IHZvaWQge1xuICAgICAgICBjb25zdCBhbmltID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXVuY2FjaGVdJyk7XG4gICAgICAgIGNvbnN0IHVuY2FjaGVzID0gdGhpcy52aWV3LmZpbmQoJy51bmNhY2hlZCcpO1xuICAgICAgICB1bmNhY2hlcy5yZW1vdmVBdHRyKCdzdHlsZScpO1xuICAgICAgICBhbmltLnJlbW92ZUNsYXNzKCdhbmltYXRlZCcpO1xuICAgICAgICB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY29tcG9uZW50XScpLmVhY2goKGksIGVsKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBjb21wID0gJChlbCkuZGF0YSgnY29tcCcpIGFzIENvbXBvbmVudDtcbiAgICAgICAgICAgIGlmIChjb21wICYmIHR5cGVvZiBjb21wWydkaXNhYmxlJ10gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgY29tcFsnZGlzYWJsZSddKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgc2hvdyhpbmRleDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXZpZXc9JyArIGluZGV4ICsgJ10nKTtcbiAgICAgICAgICAgIHRoaXMuJGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xuICAgICAgICAgICAgZ3NhcC5mcm9tVG8odGhpcy4kY3VycmVudCwge1xuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC43LFxuICAgICAgICAgICAgICAgIGVhc2U6ICdzaW5lJyxcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICB0aGlzLiRjdXJyZW50LmZpbmQoJ1tkYXRhLWNvbXBvbmVudF0nKS5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbXAgPSAkKGVsKS5kYXRhKCdjb21wJykgYXMgQ29tcG9uZW50O1xuICAgICAgICAgICAgICAgIGlmIChjb21wICYmIHR5cGVvZiBjb21wWydlbmFibGUnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgY29tcFsnZW5hYmxlJ10oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxuXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XG5pbXBvcnQgeyAkZG9jIH0gZnJvbSAnLi4vU2l0ZSc7XG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5cblxuXG5leHBvcnQgY2xhc3MgVG9vbHRpcCBleHRlbmRzIENvbXBvbmVudCB7XG5cbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbjtcbiAgICBwcml2YXRlICRidXR0b246IEpRdWVyeTtcbiAgICBwcml2YXRlICRjbG9zZTogSlF1ZXJ5O1xuXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XG4gICAgICAgIHN1cGVyKHZpZXcpO1xuXG4gICAgICAgIHRoaXMuJGJ1dHRvbiA9IHRoaXMudmlldy5maW5kKCcuanMtdG9nZ2xlJyk7XG4gICAgICAgIHRoaXMuJGNsb3NlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1jbG9zZScpLmxlbmd0aCA+IDAgPyB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykgOiBudWxsO1xuICAgICAgICB0aGlzLmJpbmQoKTtcbiAgICB9XG5cblxuXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xuICAgICAgICB0aGlzLiRidXR0b24ub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQnV0dG9uQ2xpY2tIYW5kbGVyKTtcblxuICAgICAgICB0aGlzLnZpZXdcbiAgICAgICAgICAgIC5vZmYoJ21vdXNlb24nKS5vbignbW91c2VlbnRlci5tb3VzZW9uJywgdGhpcy5vbk1vdXNlRW50ZXIpXG4gICAgICAgICAgICAub2ZmKCdtb3VzZW9mZicpLm9uKCdtb3VzZWxlYXZlLm1vdXNlb2ZmJywgdGhpcy5vbk1vdXNlTGVhdmUpO1xuXG4gICAgICAgICRkb2Mub24oJ2NsaWNrLnRvb2x0aXAnLCB0aGlzLm9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIpO1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMuJGNsb3NlKSB7XG4gICAgICAgICAgICB0aGlzLiRjbG9zZS5vbignY2xpY2sudG9vbHRpcCcsICgpID0+IHRoaXMuY2xvc2UoKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VFbnRlciA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgdGhpcy5vcGVuKCk7XG4gICAgICAgIH1cblxuICAgICAgICBcbiAgICB9XG5cbiAgICBwcml2YXRlIG9uTW91c2VMZWF2ZSA9ICgpOiB2b2lkID0+IHtcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIG9uQnV0dG9uQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIC8vIGlmICghYnJlYWtwb2ludC5kZXNrdG9wKSB7XG4gICAgICAgIC8vICAgICBhbGVydCgkKGUuY3VycmVudFRhcmdldClbMF0pO1xuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coJChlLmN1cnJlbnRUYXJnZXQpWzBdKTtcbiAgICAgICAgLy8gfVxuXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9uQ2xpY2tBbnl3aGVyZUhhbmRsZXIgPSAoZSk6IHZvaWQgPT4ge1xuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwICkge1xuICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgfTtcblxuXG5cbiAgICBwcml2YXRlIG9wZW4oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcblxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcbiAgICAgICAgfSwgMjUwKTtcblxuICAgICAgICBpZiAodGhpcy52aWV3LmNsb3Nlc3QoJy5oZWFkZXInKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmFkZENsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzT3Blbikge1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgMzAwMCk7XG4gICAgfVxuXG5cblxuICAgIHByaXZhdGUgY2xvc2UoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XG4gICAgICAgIHRoaXMudmlldy5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xuXG4gICAgICAgIGlmICh0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykucmVtb3ZlQ2xhc3MoJ2lzLXRvZ2dsZWQtc2hhcmUnKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XG5pbXBvcnQgeyBDb21wb25lbnQsIENvbXBvbmVudEV2ZW50cyB9IGZyb20gJy4uL2NvbXBvbmVudHMvQ29tcG9uZW50Jztcbi8vIGltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4uL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4uL0NsYXNzZXMnO1xuaW1wb3J0IHsgJGFydGljbGUsICRib2R5LCAkbWFpbiB9IGZyb20gJy4uL1NpdGUnO1xuXG5leHBvcnQgY2xhc3MgUGFnZUV2ZW50cyB7XG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBQUk9HUkVTUzogc3RyaW5nID0gJ3Byb2dyZXNzJztcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENPTVBMRVRFOiBzdHJpbmcgPSAnY29tcGxldGUnO1xuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnYXBwZW5kJztcbn1cblxuZXhwb3J0IGNsYXNzIFBhZ2UgZXh0ZW5kcyBIYW5kbGVyIHtcblxuICAgIHB1YmxpYyBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XG4gICAgLy8gcHVibGljIGJhY2tncm91bmRzOiB7W2tleTogc3RyaW5nXTogQmFja2dyb3VuZH07XG4gICAgcHJpdmF0ZSBsb2FkZXI6IEpRdWVyeURlZmVycmVkPEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQ+O1xuXG5cblxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIG9wdGlvbnM/KSB7XG5cbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7IG9wYWNpdHk6IDAgfSk7XG5cbiAgICAgICAgdGhpcy5jb21wb25lbnRzID0gW107XG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKHRoaXMudmlldy5wYXJlbnQoKS5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwcmVsb2FkIG5lY2Vzc2FyeSBhc3NldHM6XG4gICAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gbG9hZGluZyBpbWFnZXMgcHJvbWlzZVxuICAgICAqL1xuICAgIHB1YmxpYyBwcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuXG4gICAgICAgIGxldCBpbCA9IGltYWdlc0xvYWRlZCh0aGlzLnZpZXcuZmluZCgnLnByZWxvYWQnKS50b0FycmF5KCksIDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkT3B0aW9ucz57IGJhY2tncm91bmQ6IHRydWUgfSk7XG4gICAgICAgIGxldCBpbWFnZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBpbWFnZXMgPSBpbWFnZXMuY29uY2F0KGNvbXBvbmVudC5wcmVsb2FkSW1hZ2VzKCkpO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IHVybCBvZiBpbWFnZXMpIHtcbiAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQodXJsLCBudWxsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLmxvYWRlciA9IGlsLmpxRGVmZXJyZWQ7XG4gICAgICAgICAgICB0aGlzLmxvYWRlci5wcm9ncmVzcygoaW5zdGFuY2U6IEltYWdlc0xvYWRlZC5JbWFnZXNMb2FkZWQsIGltYWdlOiBJbWFnZXNMb2FkZWQuTG9hZGluZ0ltYWdlKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXIgPSBpbnN0YW5jZS5wcm9ncmVzc2VkQ291bnQgLyBpbnN0YW5jZS5pbWFnZXMubGVuZ3RoO1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLlBST0dSRVNTLCBwcm9ncmVzcyk7XG4gICAgICAgICAgICB9KS5hbHdheXMoKCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNPTVBMRVRFKTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIGNoZWNrIGlmIGFueSBDb21wb25lbnQgY2FuIGJlIGNoYW5nZWQgYWZ0ZXIgb25TdGF0ZVxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHJldHVybnMgdHJ1ZSB3aGVuIG9uZSBvZiB0aGUgY29tcG9uZW50cyB0YWtlcyBhY3Rpb24gaW4gb25TdGF0ZSBmdW5jdGlvbiBjYWxsXG4gICAgICovXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XG5cbiAgICAgICAgbGV0IGNoYW5nZWQ6IGJvb2xlYW4gPSAhIWZhbHNlO1xuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XG4gICAgICAgICAgICBjb25zdCBjb21wb25lbnRDaGFuZ2VkOiBib29sZWFuID0gY29tcG9uZW50Lm9uU3RhdGUoKTtcbiAgICAgICAgICAgIGlmICghY2hhbmdlZCAmJiAhIWNvbXBvbmVudENoYW5nZWQpIHtcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjaGFuZ2VkO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBwYWdlIGVudGVyaW5nIGFuaW1hdGlvblxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWxheSBhbmltYXRpb24gZGVsYXlcbiAgICAgKi9cbiAgICBwdWJsaWMgYW5pbWF0ZUluKGRlbGF5PzogbnVtYmVyKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xuXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCh0aGlzLmNvbXBvbmVudHMsICdhbmltYXRlSW4nKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbXBvbmVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuY29tcG9uZW50c1tpXS5hbmltYXRlSW4oaSwgZGVsYXkpO1xuICAgICAgICB9XG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XG4gICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcbiAgICAgICAgICAgICAgICBnc2FwLnRvKGJnLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIGRpc3BsYXk6ICdibG9jayd9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHBhZ2UgZXhpdCBhbmltYXRpb25cbiAgICAgKiAoY2FsbGVkIGFmdGVyIG5ldyBjb250ZW50IGlzIGxvYWRlZCBhbmQgYmVmb3JlIGlzIHJlbmRlcmVkKVxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IGFuaW1hdGlvbiBwcm9taXNlXG4gICAgICovXG4gICAgcHVibGljIGFuaW1hdGVPdXQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGJnID0gJCgnI2JhY2tncm91bmRzLWZpeGVkJyk7XG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiB0aGUgcGFnZTpcbiAgICAgICAgJG1haW4ucmVtb3ZlQ2xhc3MoJ2lzLWxvYWRlZCcpO1xuICAgICAgICBnc2FwLnNldChiZywgeyBvcGFjaXR5OiAwLCBkaXNwbGF5OiAnbm9uZSd9KTtcbiAgICAgICAgbGV0IHBhZ2VBbmltYXRpb25Qcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC40LFxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAkYm9keS5yZW1vdmVBdHRyKCdjbGFzcycpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyBhbmltYXRpb25zIG9mIGFsbCBjb21wb25lbnRzOlxuICAgICAgICBsZXQgY29tcG9uZW50QW5pbWF0aW9uczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSB0aGlzLmNvbXBvbmVudHMubWFwKChvYmopOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgICAgIHJldHVybiA8UHJvbWlzZTx2b2lkPj5vYmouYW5pbWF0ZU91dCgpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvLyByZXR1cm4gb25lIHByb21pc2Ugd2FpdGluZyBmb3IgYWxsIGFuaW1hdGlvbnM6XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG5cbiAgICAgICAgICAgIGxldCBhbGxQcm9taXNlczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSBjb21wb25lbnRBbmltYXRpb25zLmNvbmNhdChwYWdlQW5pbWF0aW9uUHJvbWlzZSk7XG5cbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGFsbFByb21pc2VzKS50aGVuKChyZXN1bHRzKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3R1cm5PZmYnKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxuICAgICAqL1xuICAgIHB1YmxpYyB0dXJuT24oKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9uJyk7XG4gICAgfVxuXG5cblxuICAgIC8qKlxuICAgICAqIHJlc2l6ZSBoYW5kbGVyXG4gICAgICogQHBhcmFtIHtbdHlwZV19IHdkdCAgICAgICAgd2luZG93IHdpZHRoXG4gICAgICogQHBhcmFtIHtbdHlwZV19IGhndCAgICAgICAgd2luZG93IGhlaWdodFxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBicmVha3BvaW50IElCcmVha3BvaW50IG9iamVjdFxuICAgICAqL1xuICAgIHB1YmxpYyByZXNpemUod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQge1xuICAgICAgICB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdkdCwgaGd0LCBicmVha3BvaW50LCBicENoYW5nZWQpO1xuICAgIH1cblxuXG5cbiAgICAvKipcbiAgICAgKiBjbGVhbnVwIHdoZW4gY2xvc2luZyBQYWdlXG4gICAgICovXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XG4gICAgICAgIHRoaXMuY2FsbEFsbCgnZGVzdHJveScpO1xuICAgICAgICB0aGlzLmNvbXBvbmVudHMgPSBbXTtcbiAgICAgICAgLy8gdGhpcy5iYWNrZ3JvdW5kcyA9IHt9O1xuXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldyk7XG4gICAgICAgIHRoaXMudmlldyA9IG51bGw7XG5cbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIH1cblxuXG5cbiAgICBwcm90ZWN0ZWQgYnVpbGRDb21wb25lbnRzKCRjb21wb25lbnRzOiBKUXVlcnkpOiB2b2lkIHtcbiAgICAgICAgZm9yIChsZXQgaSA9ICRjb21wb25lbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICBjb25zdCAkY29tcG9uZW50OiBKUXVlcnkgPSAkY29tcG9uZW50cy5lcShpKTtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWU6IHN0cmluZyA9ICRjb21wb25lbnQuZGF0YSgnY29tcG9uZW50Jyk7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhjb21wb25lbnROYW1lLCBjb21wb25lbnRzKTtcblxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgb3B0aW9uczogT2JqZWN0ID0gJGNvbXBvbmVudC5kYXRhKCdvcHRpb25zJyksXG4gICAgICAgICAgICAgICAgICAgIGNvbXBvbmVudDogQ29tcG9uZW50ID0gbmV3IGNvbXBvbmVudHNbY29tcG9uZW50TmFtZV0oJGNvbXBvbmVudCwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcbiAgICAgICAgICAgICAgICBjb21wb25lbnQub24oQ29tcG9uZW50RXZlbnRzLkNIQU5HRSwgdGhpcy5vbkNvbXBvbmVudENoYW5nZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIGAlc2AgY29tcG9uZW50IScsIGNvbXBvbmVudE5hbWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBvbkNvbXBvbmVudENoYW5nZSA9IChlbCk6IHZvaWQgPT4ge1xuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyhlbC5maWx0ZXIoJ1tkYXRhLWNvbXBvbmVudF0nKS5hZGQoZWwuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKSk7XG4gICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNIQU5HRSwgZWwpO1xuICAgIH1cblxuXG4gICAgLy8gc2hvcnQgY2FsbFxuICAgIHByaXZhdGUgY2FsbEFsbChmbjogc3RyaW5nLCAuLi5hcmdzKTogdm9pZCB7XG4gICAgICAgIGZvciAobGV0IGNvbXBvbmVudCBvZiB0aGlzLmNvbXBvbmVudHMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50W2ZuXSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgIGNvbXBvbmVudFtmbl0uYXBwbHkoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9XG59XG4iXX0=
