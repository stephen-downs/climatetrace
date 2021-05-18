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
const Linechart_1 = require("./components/Linechart");
const Aside_1 = require("./components/Aside");
const Parallax_1 = require("./components/Parallax");
const Search_1 = require("./components/Search");
const Compare_1 = require("./components/Compare");
const Charts_1 = require("./components/Charts");
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
    Linechart: Linechart_1.Linechart,
    Aside: Aside_1.Aside,
    Parallax: Parallax_1.Parallax,
    Search: Search_1.Search,
    Compare: Compare_1.Compare,
    Charts: Charts_1.Charts,
};
exports.pages = {
    Page: Page_1.Page
};
},{"./components/Aside":13,"./components/Charts":14,"./components/Compare":15,"./components/Dashboard":17,"./components/Dropdown":18,"./components/Filters":19,"./components/Linechart":21,"./components/Masonry":22,"./components/Parallax":23,"./components/Range":24,"./components/Search":25,"./components/Slider":26,"./components/Stats":27,"./components/Tooltip":28,"./pages/Page":29}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Copy {
    constructor() {
        Copy.bind();
    }
    static bind() {
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
            }, 1);
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
            case 'percentBox':
                gsap.set($el, { opacity: 1 });
                const per = parseInt($el.find('.js-cover-num').text().split('%')[0], 10) / 100;
                const level = $el.find('.js-cover-percent');
                gsap.fromTo(level, 1, { duration: 1, scaleY: 0 }, { scaleY: per });
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
                const hTitle = $el.find('.js-title'), hr = $el.find('.js-heading-hr'), subTitle = $el.find('.js-subtitle').length > 0 ? $el.find('.js-subtitle') : null;
                const splitTitle = new SplitText(hTitle, { type: 'words, chars' });
                gsap.set($el, { opacity: 1 });
                gsap.fromTo(splitTitle.chars, { duration: 1, opacity: 0 }, { opacity: 1, stagger: 0.05 });
                gsap.fromTo(hr, { duration: 1, scaleX: 0 }, { scaleX: 1, delay: 0.5 });
                if (subTitle) {
                    gsap.set(subTitle, { opacity: 0, y: 20 });
                    gsap.to(subTitle, 0.5, { duration: 0.5, opacity: 1, y: 0 });
                }
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
        Share.bind();
    }
    static bind() {
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
const All_1 = require("./widgets/All");
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
            All_1.Widgets.bind(el[0]);
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
        exports.$navbar = $('#navbar');
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
        Copy_1.Copy.bind();
        Share_1.Share.bind();
        All_1.Widgets.bind();
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
},{"./Api":1,"./Breakpoint":2,"./Browser":3,"./Classes":4,"./Copy":5,"./Loader":7,"./PushStates":8,"./Scroll":9,"./Share":10,"./Utils":12,"./pages/Page":29,"./widgets/All":30}],12:[function(require,module,exports){
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
function colorToRGBA(hex, alpha) {
    let c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length == 3) {
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + `,${typeof alpha === 'undefined' ? 1 : alpha})`;
    }
    throw new Error('Bad Hex');
}
exports.colorToRGBA = colorToRGBA;
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
},{"../PushStates":8,"./Component":16}],14:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
const GlobalVars_1 = require("./GlobalVars");
class Charts extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.labels = [
            'BUILDINGS',
            'ELECTRICITY',
            'TRANSPORTATION',
            'AGRICULTURE',
            'EXTRACTIVE INDUSTRIES',
            'MANUFACTURING',
            'FORESTRY'
        ];
        this.tooltips = [
            [
                '<strong>Coal Power 52%</strong> of buildings generation emissions',
                '<strong>Natural Gas 34%</strong> of buildings generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of electricity generation emissions',
                '<strong>Natural Gas 34%</strong> of electricity generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of transportation generation emissions',
                '<strong>Natural Gas 34%</strong> of transportation generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of agriculture generation emissions',
                '<strong>Natural Gas 34%</strong> of agriculture generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of extractive industries generation emissions',
                '<strong>Natural Gas 34%</strong> of extractive industries generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of manufacturing generation emissions',
                '<strong>Natural Gas 34%</strong> of manufacturing generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ],
            [
                '<strong>Coal Power 52%</strong> of forestry generation emissions',
                '<strong>Natural Gas 34%</strong> of forestry generation emissions',
                'BioGas - not present in data',
                'Combined heat and power - not present in data'
            ]
        ];
        this.colors = [
            GlobalVars_1.GlobalVars.colors.indigo,
            GlobalVars_1.GlobalVars.colors.blue,
            GlobalVars_1.GlobalVars.colors.green,
            GlobalVars_1.GlobalVars.colors.violet,
            GlobalVars_1.GlobalVars.colors.viking,
            GlobalVars_1.GlobalVars.colors.shamrock,
            GlobalVars_1.GlobalVars.colors.winter,
        ];
        this.onViewSwitch = (e) => {
            const current = $(e.currentTarget);
            const view = current.data('chart-type');
            this.$viewSwitcher.removeClass('is-active');
            current.addClass('is-active');
            this.setActiveSubview(view);
            setTimeout(() => this.destroyCharts(), 300);
            setTimeout(() => this.setCharts(), 450);
        };
        this.$viewSwitcher = this.view.find('[data-chart-type]');
        this.$subviews = this.view.find('[data-chart-app]');
        this.pieCanvas = this.view.find('#pie-chart')[0];
        this.barCanvas = this.view.find('#bar-chart')[0];
        this.ctxBar = this.barCanvas.getContext('2d');
        this.ctxPie = this.pieCanvas.getContext('2d');
        this.barCanvas.height = 250;
        this.$pieChartWrapper = this.view.find('.js-pie-chart');
        this.bind();
        this.setCharts();
    }
    bind() {
        this.$viewSwitcher.off('.switch').on('click.switch', this.onViewSwitch);
    }
    destroyCharts() {
        this.barChart.destroy();
        this.pieChart.destroy();
    }
    setBiggestValue(values) {
        let largest = this.getLargestValue(values);
        this.$pieChartWrapper.append('<div class="chart__center js-center-value"><img src="" alt="" class="chart__largesticon js-largest-icon"><span class="chart__largestname js-largest-name"></span><span class="chart__largest js-largest-num"></span></div>');
        let index = values.indexOf(largest);
        let areaName = this.labels[index].toLowerCase();
        this.view.find('.js-largest-name').text(areaName);
        this.view.find('.js-largest-num').text(largest + '%');
        let icon;
        for (const prop in GlobalVars_1.GlobalVars.icons) {
            console.log(prop === areaName);
            if (prop === areaName) {
                icon = GlobalVars_1.GlobalVars.icons[prop];
                console.log(icon);
            }
        }
        this.view.find('.js-largest-icon').attr('src', icon);
    }
    setCharts() {
        const values = [23.6, 3.1, 28.7, 8.2, 11.9, 6.7, 15.3];
        this.setBiggestValue(values);
        const pieData = {
            labels: this.labels,
            datasets: [{
                    labels: this.labels,
                    data: values,
                    backgroundColor: this.colors,
                    borderWidth: 0,
                    cutout: '70%',
                    hoverOffset: 5,
                }],
        };
        const barChart = {
            labels: this.labels,
            datasets: [{
                    axis: 'y',
                    data: values,
                    fill: true,
                    backgroundColor: this.colors,
                    borderWidth: 0,
                    barThickness: 50,
                    padding: 20,
                }],
        };
        this.barChart = new Chart(this.ctxBar, {
            type: 'bar',
            data: barChart,
            options: {
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                        external: (context) => this.customBarTooltip(context),
                        callbacks: {
                            afterBody: (item) => {
                                return this.tooltips[item[0].dataIndex];
                            },
                        },
                    },
                },
                responsive: true,
                indexAxis: 'y',
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'TONNES',
                            color: 'rgba(88,88,88, 0.45)',
                            font: {
                                size: 20,
                                family: 'Quicksand',
                                weight: 'normal'
                            },
                        },
                        ticks: {
                            callback: (value) => {
                                return value + 'B';
                            },
                            font: {
                                size: 20,
                                family: 'Quicksand',
                            },
                            padding: 20,
                        },
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 16,
                                family: 'Kanit',
                            },
                            padding: 20,
                        },
                        grid: {
                            display: false,
                            drawBorder: false,
                            drawOnChartArea: false,
                            drawTicks: false,
                        }
                    },
                },
                animation: {
                    duration: 2000,
                    onProgress: (chart) => this.percentOnBarHack(chart),
                    onComplete: (chart) => this.percentOnBarHack(chart),
                },
            },
        });
        this.pieChart = new Chart(this.ctxPie, {
            type: 'doughnut',
            data: pieData,
            plugins: [ChartDataLabels],
            options: {
                layout: {
                    padding: 50
                },
                plugins: {
                    datalabels: {
                        display: true,
                        clamp: false,
                        anchor: 'center',
                        align: 'center',
                        offset: 10,
                        color: GlobalVars_1.GlobalVars.colors.white,
                        labels: {
                            value: {
                                font: {
                                    family: 'Kanit',
                                    weight: 'bold',
                                    size: 22
                                }
                            },
                        },
                        formatter: (value, context) => {
                            return value + '%';
                        }
                    },
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                        external: (context) => this.customBarTooltip(context),
                        intersect: false,
                        callbacks: {
                            afterBody: (item) => {
                                return this.tooltips[item[0].dataIndex];
                            },
                        },
                    },
                }
            }
        });
    }
    percentOnBarHack(chart) {
        let chartInstance = chart.chart, ctx = chartInstance.ctx;
        ctx.font = '500 22px Kanit';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = GlobalVars_1.GlobalVars.colors.white;
        chartInstance.data.datasets.forEach((dataset, i) => {
            let meta = chartInstance.getDatasetMeta(i);
            meta.data.forEach((bar, index) => {
                let data = dataset.data[index] + '%';
                ctx.fillText(data, 230, bar.y);
            });
        });
    }
    customBarTooltip(context) {
        let tooltipEl = $('#chartjs-tooltip')[0];
        if (!tooltipEl) {
            tooltipEl = document.createElement('div');
            tooltipEl.id = 'chartjs-tooltip';
            tooltipEl.innerHTML = '<div class="tooltip tooltip--chart"><div class="tooltip__wrapper"></div></div>';
            document.body.appendChild(tooltipEl);
        }
        let tooltipModel = context.tooltip;
        console.log(tooltipModel, 'model', context, 'ctx');
        if (tooltipModel.opacity === '0') {
            tooltipEl.style.opacity = '0';
            return;
        }
        let index = null;
        let color = '';
        this.labels.forEach((el, i) => {
            let title = tooltipModel.title.length <= 0 ? tooltipModel.dataPoints[0].label : tooltipModel.title[0];
            if (el === title) {
                index = i;
            }
        });
        color = this.colors[index];
        if (tooltipModel.body) {
            let titleLines = tooltipModel.title.length <= 0 ? tooltipModel.dataPoints[0].label : tooltipModel.title;
            console.log(titleLines);
            let bodyLines = tooltipModel.afterBody.map((bodyItem) => {
                return bodyItem;
            });
            let innerHtml = '<h4>';
            if (typeof titleLines == 'string') {
                innerHtml += titleLines;
            }
            else {
                titleLines.forEach((title) => {
                    innerHtml += title;
                });
            }
            innerHtml += '</h4><hr class="tooltip__hr"><ul>';
            bodyLines.forEach((body, i) => {
                innerHtml += '<li>' + body + '</li>';
            });
            innerHtml += '</ul>';
            let wrapper = $(tooltipEl).find('.tooltip__wrapper')[0];
            wrapper.innerHTML = innerHtml;
        }
        let position = context.chart.canvas.getBoundingClientRect();
        $(tooltipEl).find('strong').css('color', color);
        $(tooltipEl).find('hr').css('background-color', color);
        tooltipEl.style.opacity = '1';
        tooltipEl.style.position = 'absolute';
        tooltipEl.style.zIndex = '4';
        tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
        tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
        tooltipEl.style.font = 'Kanit';
        tooltipEl.style.padding = tooltipModel.padding + 'px ' + tooltipModel.padding + 'px';
        tooltipEl.style.pointerEvents = 'none';
        gsap.fromTo($(tooltipEl).find('.tooltip'), { duration: 0.5, opacity: 0 }, { opacity: 1 });
        if (tooltipModel.opacity === 0) {
            gsap.fromTo($(tooltipEl).find('.tooltip'), { duration: 0.5, opacity: 1 }, { opacity: 0 });
        }
    }
    setActiveSubview(view) {
        const current = this.$subviews.filter('.is-active');
        this.hideCurrent(current).then(() => {
            this.show(null, view);
            Site_1.$window.resize();
        });
    }
    hideCurrent(element) {
        return new Promise((resolve, reject) => {
            const current = element ? element : this.$current;
            if (!current) {
                resolve();
                return;
            }
            gsap.to(current, {
                opacity: 0,
                duration: 0.3,
                ease: 'sine',
                onComplete: () => {
                    current.removeClass('is-active');
                    resolve();
                },
            });
        });
    }
    show(index, type) {
        return new Promise((resolve, reject) => {
            if (typeof index != undefined && index != null) {
                this.$current = this.$subviews.filter('[data-chart-app=' + index + ']');
            }
            const current = typeof index != undefined && index != null ? this.$current : this.$subviews.filter('[data-chart-app=' + type + ']');
            current.addClass('is-active');
            gsap.fromTo(current, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.7,
                ease: 'sine',
                onComplete: () => resolve(),
            });
        });
    }
    getLargestValue(data) {
        let largest = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i] > largest) {
                largest = data[i];
            }
        }
        return largest;
    }
}
exports.Charts = Charts;
},{"../Site":11,"./Component":16,"./GlobalVars":20}],15:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Site_1 = require("../Site");
class Compare extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.removeItem = (e) => {
            e.stopPropagation();
            const current = $(e.currentTarget).parent();
            let elCompare = current.hasClass('is-compare') ? true : false;
            let el = current.next().length > 0 ? current.next() : current.prev();
            if (el.hasClass('js-add-item')) {
                el = current.prev();
            }
            current.remove();
            setTimeout(() => {
                Site_1.$window.resize();
                this.$item = this.view.find('.js-item');
                if (this.$item.length < 2) {
                    this.$item.addClass('is-remove-blocking');
                }
                if (elCompare) {
                    this.onCompare(e, el);
                }
            }, 10);
        };
        this.$item = this.view.find('.js-item');
        this.$itemMain = this.view.find('.js-item-main');
        this.$delete = this.view.find('.js-delete');
        this.$addItem = this.view.find('.js-add-item');
        this.bind();
        this.$item.eq(0).addClass('is-compare');
        this.compareNumbers(this.$item.eq(0));
    }
    bind() {
        this.$item.on('click', (e) => this.onCompare(e));
        this.$delete.on('click', this.removeItem);
    }
    onCompare(e, element) {
        const current = element ? element : $(e.currentTarget);
        const index = current.index();
        this.$item.removeClass('is-compare');
        current.addClass('is-compare');
        gsap.to(this.$itemMain, { duration: 0.5, y: this.$itemMain.outerHeight() * index + (10 * index) });
        this.compareNumbers(current);
    }
    compareNumbers(el) {
        const valueMain = parseInt(this.$itemMain.find('.js-comp-num').text(), 10);
        const valueSecond = parseInt(el.find('.js-comp-num').text(), 10);
        this.$item.removeClass('is-higher is-lower');
        this.$itemMain.removeClass('is-higher is-lower');
        if (valueMain > valueSecond) {
            this.$itemMain.addClass('is-higher');
            el.addClass('is-lower');
        }
        if (valueMain < valueSecond) {
            el.addClass('is-higher');
            this.$itemMain.addClass('is-lower');
        }
    }
}
exports.Compare = Compare;
},{"../Site":11,"./Component":16}],16:[function(require,module,exports){
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
},{"../Handler":6}],17:[function(require,module,exports){
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
                this.$toggle.addClass('is-open');
                gsap.to(this.$body, { duration: 0.5, height: 'auto', ease: 'power2.inOut',
                    onComplete: () => {
                        this.view.addClass('is-toggled');
                        this.isToggled = true;
                    },
                });
            }
            else {
                this.view.removeClass('is-toggled');
                this.$toggle.removeClass('is-open');
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
},{"./Component":16}],18:[function(require,module,exports){
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
},{"../Site":11,"./Component":16,"./Filters":19}],19:[function(require,module,exports){
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
            }
            else {
                const activePrev = this.$itemSector.filter('.is-active').length > 0 ? this.$itemSector.filter('.is-active') : null;
                if (activePrev) {
                    this.removeElementFromArray(activePrev, this.filters);
                }
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
        this.settings = $.extend({
            status: '',
        }, options || view.data('options') || {});
        Filters.instance = this;
        console.log(Filters.instance.$itemSector, Filters.instance.view.find('[data-selected]').data('selected'));
        this.bind();
        this.setDefaultSelection();
    }
    static showPickedFilters(country) {
        if (Filters.instance.settings.tags === 'hidden') {
            return;
        }
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
            Filters.instance.selectedCountry = pickedCountry;
            Filters.instance.$picked.append('<span>' + pickedCountry + '</span>');
        }
        if (pickedTime) {
            Filters.instance.$picked.append('<span>' + pickedTime.data('item-label') + '</span>');
        }
    }
    static addCountryToFilters(country) {
        const countryName = country.split(' ').join('-').toLowerCase();
        Filters.instance.selectedCountry = country;
        console.log(countryName, 'country name');
    }
    bind() {
        this.$itemSector.off('.sector').on('click.sector', this.toggleSector);
        this.$itemTime.off('.time').on('click.time', this.toggleTime);
        this.$itemCountry.off('.country').on('click.country', this.toggleCountry);
        this.$clear.off('.clear').on('click.clear', this.clearArray);
    }
    markAllSectors() {
        const timeChecked = this.$itemTime.filter('.is-active').length > 0 ? this.$itemTime.filter('.is-active') : null;
        this.clearArray();
        this.$itemSector.each((i, el) => {
            this.addElementToArray($(el), this.filters, true);
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
        if (this.settings.status === 'unchecked') {
            this.filters = [];
            this.isAllChecked = false;
        }
        else {
            this.addElementToArray(this.$itemTime.filter('[data-item="all-time"]'), this.filters);
            this.addElementToArray(this.$itemCountry, this.filters);
            this.$itemSector.each((i, el) => {
                this.addElementToArray($(el), this.filters, true);
            });
            this.$allSectors.addClass('is-active');
            this.isAllChecked = true;
            Filters.showPickedFilters();
        }
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
    addElementToArray($el, array, notActivate) {
        array.push($el.data('item'));
        notActivate ? $el.remove('is-active') : $el.addClass('is-active');
        console.log('FILTERS:', this.filters);
    }
}
exports.Filters = Filters;
},{"./Component":16}],20:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GlobalVars {
}
exports.GlobalVars = GlobalVars;
GlobalVars.colors = {
    blue: '#427fd9',
    indigo: '#3c5bbc',
    violet: '#4c49b0',
    green: '#94c840',
    viking: '#4acfdc',
    winter: '#3cabe3',
    shamrock: '#3dd5a2',
    white: '#fff',
    gray: '#585858',
    graylight: 'rgba(216, 216, 216, 1)',
};
GlobalVars.icons = {
    transportation: "./media/transportation.png",
    manufacturing: "./media/manufacturing.png",
    electricity: "./media/electricity.png",
    forestry: "./media/forestry.png",
    extractive: "./media/extractive.png",
    building: "./media/building.png",
    agriculture: "./media/agriculture.png"
};
},{}],21:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Component_1 = require("./Component");
const Utils = require("../Utils");
const GlobalVars_1 = require("./GlobalVars");
class Linechart extends Component_1.Component {
    constructor(view, options) {
        super(view);
        this.view = view;
        this.options = options;
        this.mouseX = 0;
        this.margin = {
            top: 5,
            left: 25,
            right: 0,
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
        this.onMouseMove = (e) => {
            const colWidth = this.graph.width / (this.graphsData[0].yPx.length - 1);
            gsap.to(this, {
                duration: 0.3,
                mouseX: Math.round((e.offsetX - this.graph.left) / colWidth) * colWidth,
                onUpdate: this.draw,
                ease: 'sine',
            });
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
                const grd = this.ctx.createLinearGradient(0, 0, 0, this.graph.height);
                grd.addColorStop(0, Utils.colorToRGBA(data.color, 0.5));
                grd.addColorStop(1, Utils.colorToRGBA(data.color, 0.1));
                this.ctx.fillStyle = grd;
                this.ctx.beginPath();
                data.yPx.forEach((y, i, a) => {
                    const x = colWidth * i + this.graph.left;
                    if (x <= maxX && data.xPercent > 0) {
                        this.ctx.lineTo(x, y);
                        lastX = x;
                    }
                    else if (x < maxX + colWidth && data.xPercent > 0) {
                        const iy = this.getInterPointsY(maxX, [x - colWidth, a[i - 1]], [x, y]);
                        this.ctx.lineTo(maxX, iy);
                        lastX = maxX;
                    }
                });
                this.ctx.lineTo(lastX, this.graph.bottom);
                this.ctx.lineTo(this.graph.left, this.graph.bottom);
                this.ctx.fill();
                this.ctx.closePath();
                let mouseX = Math.max(0, this.mouseX);
                const mxi1 = Math.floor(mouseX / colWidth);
                const mxi2 = mxi1 + 1;
                mouseX += this.graph.left;
                const mouseY = this.getInterPointsY(mouseX, [colWidth * mxi1 + this.graph.left, data.yPx[mxi1]], [colWidth * mxi2 + this.graph.left, data.yPx[mxi2]]);
                this.ctx.beginPath();
                this.ctx.strokeStyle = data.color;
                this.ctx.moveTo(mouseX, mouseY);
                this.ctx.lineTo(mouseX, this.graph.bottom);
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
                color: GlobalVars_1.GlobalVars.colors[$el.data('color')],
                fill: i === 0,
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
        this.$wrapper.off('.lc').on('mousemove.lc', this.onMouseMove);
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
        this.ctx.strokeStyle = GlobalVars_1.GlobalVars.colors.gray;
        this.ctx.moveTo(this.graph.left, this.graph.bottom);
        this.ctx.lineTo(this.graph.right + 20, this.graph.bottom);
        this.ctx.stroke();
        const helpersLine = 8;
        const textTransform = 5;
        const step = 5;
        let val;
        const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021];
        this.ctx.strokeStyle = GlobalVars_1.GlobalVars.colors.graylight;
        this.ctx.lineJoin = 'round';
        this.ctx.font = '500 12px Quicksand, sans-serif';
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = GlobalVars_1.GlobalVars.colors.gray;
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
            this.ctx.fillStyle = GlobalVars_1.GlobalVars.colors.gray;
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
exports.Linechart = Linechart;
},{"../Utils":12,"./Component":16,"./GlobalVars":20}],22:[function(require,module,exports){
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
},{"./Component":16}],23:[function(require,module,exports){
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
},{"../Breakpoint":2,"./Component":16}],24:[function(require,module,exports){
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
},{"../Site":11,"./Component":16}],25:[function(require,module,exports){
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
            Filters_1.Filters.addCountryToFilters(current.text());
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
        this.view.removeClass('is-livesearching');
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
},{"./Component":16,"./Filters":19}],26:[function(require,module,exports){
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
},{"./Component":16}],27:[function(require,module,exports){
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
        this.onViewSwitch = (e) => {
            const current = $(e.currentTarget);
            const view = current.data('rank');
            this.$viewSwitcher.removeClass('is-active');
            current.addClass('is-active');
            this.setActiveSubview(view);
        };
        this.onTabClick = (e) => {
            const current = $(e.currentTarget);
            const index = current.data('tab');
            this.setActiveView(index);
        };
        this.$tab = this.view.find('[data-tab]');
        this.$item = this.view.find('[data-view]');
        this.$wrap = this.view.find('.js-tabs-wrapper');
        this.$viewSwitcher = this.view.find('[data-rank]');
        this.$subviews = this.view.find('[data-compare]');
        this.bind();
        this.setActiveView(parseInt(Utils.getParams(window.location.search).tab, 10) || 0);
    }
    bind() {
        this.$tab.off('.tab').on('click.tab', this.onTabClick);
        this.$viewSwitcher.off('.switch').on('click.switch', this.onViewSwitch);
    }
    setActiveSubview(view) {
        const current = this.$subviews.filter('.is-active');
        this.hideCurrent(current).then(() => {
            this.cleanCachedAnim();
            this.show(null, view);
            Site_1.$window.resize();
        });
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
    hideCurrent(element) {
        return new Promise((resolve, reject) => {
            const current = element ? element : this.$current;
            if (!current) {
                resolve();
                return;
            }
            gsap.to(current, {
                opacity: 0,
                duration: 0.3,
                ease: 'sine',
                onComplete: () => {
                    current.removeClass('is-active');
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
    show(index, type) {
        return new Promise((resolve, reject) => {
            console.log(index, 'index');
            if (typeof index != undefined && index != null) {
                this.$current = this.$item.filter('[data-view=' + index + ']');
            }
            const current = typeof index != undefined && index != null ? this.$current : this.$subviews.filter('[data-compare=' + type + ']');
            current.addClass('is-active');
            gsap.fromTo(current, {
                opacity: 0,
            }, {
                opacity: 1,
                duration: 0.7,
                ease: 'sine',
                onComplete: () => resolve(),
            });
            current.find('[data-component]').each((i, el) => {
                const comp = $(el).data('comp');
                if (comp && typeof comp['enable'] !== 'undefined') {
                    comp['enable']();
                }
            });
        });
    }
}
exports.Stats = Stats;
},{"../Site":11,"../Utils":12,"./Component":16}],28:[function(require,module,exports){
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
},{"../Site":11,"./Component":16}],29:[function(require,module,exports){
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
},{"../Classes":4,"../Handler":6,"../Site":11,"../components/Component":16}],30:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Expand_1 = require("./Expand");
class Widgets {
    static bind(target) {
        Expand_1.Expand.bind(target);
        const $target = $(typeof target !== 'undefined' ? target : 'body');
        $target.find('[data-share]').off().on('click.share', this.onShareClick);
        $target.find('[data-print]').off().on('click.print', this.onPrintClick);
    }
}
exports.Widgets = Widgets;
Widgets.onShareClick = (e) => {
    e.preventDefault();
    let winWidth = parseInt($(e.currentTarget).attr('data-winwidth'), 10) || 520, winHeight = parseInt($(e.currentTarget).attr('data-winheight'), 10) || 350, winTop = (screen.height / 2) - (winHeight / 2), winLeft = (screen.width / 2) - (winWidth / 2);
    let href = e.currentTarget.href, data = $(e.currentTarget).data('share');
    if (data === 'facebook' || data === 'google') {
        href += encodeURIComponent(window.location.href);
    }
    window.open(href, 'sharer' + data, 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);
    return false;
};
Widgets.onPrintClick = (e) => {
    e.preventDefault();
    window.print();
    return false;
};
},{"./Expand":31}],31:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Site_1 = require("../Site");
class Expand {
    static bind(target) {
        const $target = $(typeof target !== 'undefined' ? target : 'body');
        $target.find('[aria-controls]').off().on('click.aria', Expand.onAriaControlsClick);
    }
}
exports.Expand = Expand;
Expand.onAriaControlsClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const that = $(e.currentTarget);
    const id = that.attr('aria-controls');
    const isExpanded = that.attr('aria-expanded') === 'true';
    const target = $('#' + id);
    const currentScrollPosition = window.scrollY ? window.scrollY : Site_1.$window.scrollTop();
    target.add(target.children()).css({
        position: 'relative',
        overflow: 'hidden',
    });
    if (!isExpanded) {
        target.parent().addClass('is-toggled');
        target.show();
        target.attr('aria-hidden', 'false');
        const hgt = target.children().outerHeight(true);
        window.scrollTo(0, currentScrollPosition);
        gsap.fromTo(target, {
            height: 0,
        }, {
            duration: hgt / 1000,
            height: hgt,
            ease: Site_1.easing,
            onComplete: () => {
                that.attr('aria-expanded', 'true');
                gsap.set(target, { height: 'auto' });
            },
        });
        if (that.data('aria-less')) {
            that.html(that.data('aria-less'));
        }
        if (that.data('expand') === false) {
            that.hide();
        }
    }
    else {
        target.parent().removeClass('is-toggled');
        const hgt = target.parent().height();
        gsap.to(target, {
            duration: hgt / 1000,
            height: 0,
            ease: Site_1.easing,
            onComplete: () => {
                that.attr('aria-expanded', 'false');
                target.attr('aria-hidden', 'true');
                target.hide();
            },
        });
        if (that.data('aria-more')) {
            that.html(that.data('aria-more'));
        }
    }
};
},{"../Site":11}]},{},[11])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvdHMvQXBpLnRzIiwic3JjL3RzL0JyZWFrcG9pbnQudHMiLCJzcmMvdHMvQnJvd3Nlci50cyIsInNyYy90cy9DbGFzc2VzLnRzIiwic3JjL3RzL0NvcHkudHMiLCJzcmMvdHMvSGFuZGxlci50cyIsInNyYy90cy9Mb2FkZXIudHMiLCJzcmMvdHMvUHVzaFN0YXRlcy50cyIsInNyYy90cy9TY3JvbGwudHMiLCJzcmMvdHMvU2hhcmUudHMiLCJzcmMvdHMvU2l0ZS50cyIsInNyYy90cy9VdGlscy50cyIsInNyYy90cy9jb21wb25lbnRzL0FzaWRlLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ2hhcnRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvQ29tcGFyZS50cyIsInNyYy90cy9jb21wb25lbnRzL0NvbXBvbmVudC50cyIsInNyYy90cy9jb21wb25lbnRzL0Rhc2hib2FyZC50cyIsInNyYy90cy9jb21wb25lbnRzL0Ryb3Bkb3duLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvRmlsdGVycy50cyIsInNyYy90cy9jb21wb25lbnRzL0dsb2JhbFZhcnMudHMiLCJzcmMvdHMvY29tcG9uZW50cy9MaW5lY2hhcnQudHMiLCJzcmMvdHMvY29tcG9uZW50cy9NYXNvbnJ5LnRzIiwic3JjL3RzL2NvbXBvbmVudHMvUGFyYWxsYXgudHMiLCJzcmMvdHMvY29tcG9uZW50cy9SYW5nZS50cyIsInNyYy90cy9jb21wb25lbnRzL1NlYXJjaC50cyIsInNyYy90cy9jb21wb25lbnRzL1NsaWRlci50cyIsInNyYy90cy9jb21wb25lbnRzL1N0YXRzLnRzIiwic3JjL3RzL2NvbXBvbmVudHMvVG9vbHRpcC50cyIsInNyYy90cy9wYWdlcy9QYWdlLnRzIiwic3JjL3RzL3dpZGdldHMvQWxsLnRzIiwic3JjL3RzL3dpZGdldHMvRXhwYW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNF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QUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxF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ZCxLQUFLLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ3RCLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDckQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0lBQ3hDLENBQUM7SUFZTyxNQUFNO1FBR1YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFFdkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsdUJBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDO1FBQzlDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDMUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVsQixNQUFNLFdBQVcsR0FBRyxDQUFDLENBQUM7UUFDdEIsTUFBTSxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQztRQUNmLElBQUksR0FBRyxDQUFDO1FBQ1IsTUFBTSxLQUFLLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMs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LE9BQU8sQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFDbkMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xCLENBQUM7U0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7U0FDckM7S0FDSjtBQUNMLENBQUMsQ0FBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8vIC8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuaW1wb3J0IHsgZGVidWcgfSBmcm9tICcuL1NpdGUnO1xyXG5cclxuXHJcblxyXG5kZWNsYXJlIHZhciAkYm9keTtcclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSUFwaURhdGEge1xyXG4gICAgdXJsOiBzdHJpbmc7XHJcbiAgICBiZWZvcmVDYWxsPzogc3RyaW5nO1xyXG4gICAgY2FsbGJhY2s/OiBzdHJpbmc7XHJcbiAgICBmb3JtPzogYW55O1xyXG4gICAgcGFyYW1zPzogYW55O1xyXG4gICAgbGlrZT86IGJvb2xlYW47XHJcbiAgICBhY3Rpb24/OiAnUE9TVCcgfCAnREVMRVRFJyB8ICdHRVQnIHwgJ1BVVCcgfCAnUEFUQ0gnO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFQSSB7XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBiZWZvcmVDYWxscyA9IHtcclxuXHJcbiAgICAgICAgbG9naW46IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgICAgICBpZiAoISRib2R5Lmhhc0NsYXNzKCdpcy1sb2dnZWQnKSkge1xyXG4gICAgICAgICAgICAgICAgJCgnLmpzLWxvZ2luJykubGFzdCgpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuY2FsbEl0KGRhdGEsICRlbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuXHJcbiAgICAgICAgdmFsaWRhdGU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSk6IHZvaWQge1xyXG4gICAgICAgICAgICBsZXQgcGFzc2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgbGV0ICRmb3JtID0gJGVsLmlzKCdmb3JtJykgPyAkZWwgOiAkZWwuY2xvc2VzdCgnZm9ybScpO1xyXG4gICAgICAgICAgICBsZXQgJHZhbGlkYXRpb25FbGVtID0gJGZvcm07XHJcbiAgICAgICAgICAgIGxldCBzdGVwVmFsaWRhdGlvbjtcclxuICAgICAgICAgICAgbGV0IHNjcm9sbFRvO1xyXG4gICAgICAgICAgICBpZiAoJGZvcm0uaGFzQ2xhc3MoJ2lzLWRvbmUnKSkge1xyXG4gICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ2lzLWRvbmUnKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gaWYgKCAhIWRhdGEucGFyYW1zICkge1xyXG4gICAgICAgICAgICAvLyAgICAgaWYgKGRhdGEucGFyYW1zLnZhbGlkYXRlT25lICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzdGVwVmFsaWRhdGlvbiA9ICBkYXRhLnBhcmFtcy52YWxpZGF0ZU9uZTtcclxuICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgc3RlcFZhbGlkYXRpb24gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vICAgICBpZiAoZGF0YS5wYXJhbXMuc2Nyb2xsVG8gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIHNjcm9sbFRvID0gIGRhdGEucGFyYW1zLnNjcm9sbFRvO1xyXG4gICAgICAgICAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzY3JvbGxUbyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJy5qcy1lcnJvcicpLnRleHQoJycpO1xyXG5cclxuICAgICAgICAgICAgJHZhbGlkYXRpb25FbGVtLmZpbmQoJ1tyZXF1aXJlZF06aW5wdXQnKS5lYWNoKChpbmRleDogbnVtYmVyLCBpbnB1dDogRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGlucHV0Lm5vZGVOYW1lID09PSAnSU5QVVQnICkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS50eXBlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdlbWFpbCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmUgPSAvXigoW148PigpXFxbXFxdXFxcXC4sOzpcXHNAXCJdKyhcXC5bXjw+KClcXFtcXF1cXFxcLiw7Olxcc0BcIl0rKSopfChcIi4rXCIpKUAoKFxcW1swLTldezEsM31cXC5bMC05XXsxLDN9XFwuWzAtOV17MSwzfVxcLlswLTldezEsM31dKXwoKFthLXpBLVpcXC0wLTldK1xcLikrW2EtekEtWl17Mix9KSkkLztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZSA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcmUudGVzdCh2YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXNzZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gVXRpbHMudHJhbnNsYXRpb25zW3ZhbHVlLmxlbmd0aCA+IDAgPyAnaW52YWxpZC1lbWFpbCcgOiAncmVxdWlyZWQtZmllbGQnXVsnZW4nXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5hZGRDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAoc3RlcFZhbGlkYXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWYgKHNjcm9sbFRvKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLnJlbW92ZUNsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdjaGVja2JveCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIShpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS5jaGVja2VkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndGV4dCc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsID0gKGlucHV0IGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCQoaW5wdXQpLmhhc0NsYXNzKCdqcy1wb3N0YWwnKSkge21lc3NhZ2UgPSBVdGlscy50cmFuc2xhdGlvbnNbJ2ludmFsaWQtemlwJ11bJ2VuJ119XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkubmV4dEFsbCgnLmpzLWVycm9yJykudGV4dChtZXNzYWdlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCQoaW5wdXQpLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ251bWJlcic6XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAncGhvbmUnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbFRlbCA9IChpbnB1dCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWxUZWwubGVuZ3RoIDwgMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gIW1lc3NhZ2UgPyBVdGlscy50cmFuc2xhdGlvbnNbJ3JlcXVpcmVkLWZpZWxkJ11bJ2VuJ10gOiBtZXNzYWdlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlmIChzdGVwVmFsaWRhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIFByb2plY3QuU2Nyb2xsaW5nLnNjcm9sbFRvRWxlbWVudCgkKGlucHV0KSwgZmFsc2UsIC0zMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbnB1dC5ub2RlTmFtZSA9PT0gJ1RFWFRBUkVBJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPCAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhc3NlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXNzYWdlID0gJyc7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAhbWVzc2FnZSA/IFV0aWxzLnRyYW5zbGF0aW9uc1sncmVxdWlyZWQtZmllbGQnXVsnZW4nXSA6IG1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlucHV0KS5uZXh0QWxsKCcuanMtZXJyb3InKS50ZXh0KG1lc3NhZ2UpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaWYgKHN0ZXBWYWxpZGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICBpZiAoc2Nyb2xsVG8pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICBQcm9qZWN0LlNjcm9sbGluZy5zY3JvbGxUb0VsZW1lbnQoJChpbnB1dCksIGZhbHNlLCAtMzApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkucmVtb3ZlQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCdpbnB1dFtuYW1lPXppcGNvZGVdJykuZWFjaCgoaW5kZXg6IG51bWJlciwgaW5wdXQ6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB2YWwgPSAoaW5wdXQgYXMgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZhbC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQoaW5wdXQpLmhhc0NsYXNzKCdqcy1wb3N0YWwnKSAmJiB2YWwubGVuZ3RoICE9IDUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFzc2VkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lc3NhZ2UgPSAnJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSA9ICFtZXNzYWdlID8gVXRpbHMudHJhbnNsYXRpb25zWydpbnZhbGlkLXppcCddWydlbiddIDogbWVzc2FnZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJChpbnB1dCkuYWRkQ2xhc3MoJ2lzLWVycm9yJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQoaW5wdXQpLm5leHRBbGwoJy5qcy1lcnJvcicpLnRleHQobWVzc2FnZSk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoISFwYXNzZWQpIHtcclxuICAgICAgICAgICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGZvcm0pO1xyXG4gICAgICAgICAgICAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoJ2hhcy1lcnJvcnMnKTtcclxuICAgICAgICAgICAgICAgICR2YWxpZGF0aW9uRWxlbS5maW5kKCcuanMtZXJyb3InKS50ZXh0KCcnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRmb3JtLmFkZENsYXNzKCdoYXMtZXJyb3JzJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBjYWxsYmFja3MgPSB7XHJcblxyXG4gICAgICAgIG9uQ29va2llc0Nsb3NlOiBmdW5jdGlvbihkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIHJlc3BvbnNlKTogdm9pZCB7XHJcbiAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtaGlkZGVuJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICAgICAgb25TdWJzY3JpYmU6IGZ1bmN0aW9uKGRhdGE6IElBcGlEYXRhLCAkZWw6IEpRdWVyeSwgcmVzcG9uc2UpOiB2b2lkIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ29uU3Vic2NyaWJlJyk7XHJcbiAgICAgICAgICAgIGxldCAkbWVzc2FnZSA9ICRlbC5maW5kKCcuanMtbWVzc2FnZScpO1xyXG4gICAgICAgICAgICBsZXQgc2Nyb2xsVG87XHJcblxyXG4gICAgICAgICAgICAvLyBpZiAoZGF0YS5zY3JvbGxUbyAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBzY3JvbGxUbyA9ICBkYXRhLnNjcm9sbFRvO1xyXG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyAgICAgc2Nyb2xsVG8gPSBmYWxzZTtcclxuICAgICAgICAgICAgLy8gfVxyXG5cclxuXHJcbiAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaXMtZXJyb3InKTtcclxuXHJcbiAgICAgICAgICAgIGlmICghJG1lc3NhZ2VbMF0pIHtcclxuICAgICAgICAgICAgICAgICRlbC5hcHBlbmQoJzxkaXYgY2xhc3M9XCJqcy1tZXNzYWdlIG1lc3NhZ2VcIj4nKTtcclxuICAgICAgICAgICAgICAgICRtZXNzYWdlID0gJGVsLmZpbmQoJy5qcy1tZXNzYWdlJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBodG1sID0gJCgnPHA+JyArIHJlc3BvbnNlLm1lc3NhZ2UgKyAnPC9wPicpO1xyXG5cclxuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJykuYXBwZW5kKGh0bWwpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1jb21wbGV0ZWQnKTtcclxuICAgICAgICAgICAgICAgICRlbC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtc3Vic2NyaWJlZCcpO1xyXG4gICAgICAgICAgICAgICAgJGVsLmNsb3Nlc3QoJy5qb2luJykuYWRkQ2xhc3MoJ2lzLXN1YnNjcmliZWQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS52YWwoJycpO1xyXG4gICAgICAgICAgICAgICAgJGVsLmZpbmQoJ2lucHV0OmNoZWNrZWQnKS5yZW1vdmVBdHRyKCdjaGVja2VkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCRlbFswXS5oYXNBdHRyaWJ1dGUoJ2RhdGEtcmVkaXJlY3QnKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbignLycpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1lcnJvcicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGlmIChzY3JvbGxUbykge1xyXG4gICAgICAgICAgICAvLyAgICAgUHJvamVjdC5TY3JvbGxpbmcuc2Nyb2xsVG9FbGVtZW50KCRtZXNzYWdlLCBmYWxzZSwgLTMwKTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAkZWwuZmluZCgnaW5wdXQnKS50cmlnZ2VyKCdibHVyJyk7XHJcbiAgICAgICAgfSxcclxuXHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IGFueSk6IHZvaWQge1xyXG5cclxuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gJCh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJyA/IHRhcmdldCA6ICdib2R5Jyk7XHJcblxyXG4gICAgICAgICR0YXJnZXQuZmluZCgnW2RhdGEtYXBpXScpLm5vdCgnZm9ybScpLm9mZignLmFwaScpLm9uKCdjbGljay5hcGknLCBBUEkub25BY3Rpb24pO1xyXG4gICAgICAgICR0YXJnZXQuZmluZCgnZm9ybVtkYXRhLWFwaV0nKS5vZmYoJy5hcGknKS5vbignc3VibWl0LmFwaScsIEFQSS5vbkFjdGlvbikuYXR0cignbm92YWxpZGF0ZScsICdub3ZhbGlkYXRlJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGNhbGxJdChkYXRhOiBJQXBpRGF0YSwgJGVsOiBKUXVlcnksIGN1c3RvbUNhbGxiYWNrPzogRnVuY3Rpb24pOiAgUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICBcclxuICAgICAgICBkYXRhID0gQVBJLnByZXByb2Nlc3NEYXRhKGRhdGEsICRlbCk7XHJcblxyXG4gICAgICAgICRlbC5hZGRDbGFzcygnaXMtZG9pbmctcmVxdWVzdCcpO1xyXG5cclxuICAgICAgICBjb25zdCBhY3Rpb24gPSBkYXRhLmFjdGlvbiB8fCAnUE9TVCc7XHJcbiAgICAgICAgZGVsZXRlIGRhdGEuYWN0aW9uO1xyXG5cclxuICAgICAgICBjb25zdCB1cmwgPSBkYXRhLnVybCB8fCB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcbiAgICAgICAgZGVsZXRlIGRhdGEudXJsO1xyXG5cclxuICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWRvaW5nLXJlcXVlc3QnKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgJC5hamF4KHtcclxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHR5cGU6IGFjdGlvbixcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXHJcbiAgICAgICAgICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5kb25lKChyZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICBBUEkub25TdWNjZXNzKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChjdXN0b21DYWxsYmFjayAmJiB0eXBlb2YgY3VzdG9tQ2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlKTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5mYWlsKChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0FQSSBlcnJvcjogJyArIGUsIGRhdGEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghIWRlYnVnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgQVBJLm9uU3VjY2VzcyhkYXRhLCAkZWwsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1c3RvbUNhbGxiYWNrICYmIHR5cGVvZiBjdXN0b21DYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXN0b21DYWxsYmFjayhkYXRhLCAkZWwsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZWplY3QoZSk7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIC5hbHdheXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgJGVsLnJlbW92ZUNsYXNzKCdpcy1kb2luZy1yZXF1ZXN0Jyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzdGF0aWMgcHJlcHJvY2Vzc0RhdGEoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5KTogSUFwaURhdGEge1xyXG5cclxuICAgICAgICAvLyBnZXQgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGZvcm0gZWxlbWVudDpcclxuICAgICAgICBpZiAoJGVsLmlzKCdmb3JtJykpIHtcclxuICAgICAgICAgICAgZGF0YS51cmwgPSAhZGF0YS51cmwgJiYgJGVsLmF0dHIoJ2FjdGlvbicpID8gJGVsLmF0dHIoJ2FjdGlvbicpIDogZGF0YS51cmw7XHJcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCAkZWwuZmluZCgnOmlucHV0Jykuc2VyaWFsaXplT2JqZWN0KCkpO1xyXG5cclxuICAgICAgICAgICAgY29uc29sZS5sb2coJ2RhdGEgZm9ybScsIGRhdGEsIGRhdGEucGFyYW1zLGRhdGEuZm9ybSwgJGVsLmZpbmQoJzppbnB1dCcpKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB1cGRhdGUgZGF0YSBpZiBhcGkgY2FsbGVkIG9uIGxpbmsgZWxlbWVudDpcclxuICAgICAgICBpZiAoJGVsLmlzKCdbaHJlZl0nKSkge1xyXG4gICAgICAgICAgICBkYXRhLnVybCA9ICFkYXRhLnVybCAmJiAkZWwuYXR0cignaHJlZicpID8gJGVsLmF0dHIoJ2hyZWYnKSA6IGRhdGEudXJsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZ2V0IGFkZGl0aW9uYWwgZGF0YSBmcm9tIGV4dGVybmFsIGZvcm06XHJcbiAgICAgICAgaWYgKGRhdGEuZm9ybSAmJiAkKGRhdGEuZm9ybSBhcyBzdHJpbmcpWzBdKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCAkKGRhdGEuZm9ybSBhcyBzdHJpbmcpLnNlcmlhbGl6ZU9iamVjdCgpKTtcclxuICAgICAgICAgICAgZGVsZXRlIGRhdGEuZm9ybTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGZsYXR0ZW46XHJcbiAgICAgICAgaWYgKGRhdGEucGFyYW1zKSB7XHJcbiAgICAgICAgICAgIGRhdGEgPSAkLmV4dGVuZChkYXRhLCBkYXRhLnBhcmFtcyk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhLnBhcmFtcztcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2RhdGEgcHJlJywgZGF0YSwgZGF0YS5wYXJhbXMpO1xyXG4gICAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uQWN0aW9uID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGxldCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCk7XHJcbiAgICAgICAgY29uc3QgZGF0YTogSUFwaURhdGEgPSB7Li4uJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ2FwaScpfTtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhLCAnZGF0YScpO1xyXG4gICAgICAgIGlmICgkZWwuaXMoJ2Zvcm0nKSkge1xyXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLXN1Ym1pdHRlZCcpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRlbC5jbG9zZXN0KCdmb3JtJykuYWRkQ2xhc3MoJ2lzLXN1Ym1pdHRlZCcpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gYmVmb3JlQ2FsbCBoYW5kbGVyOlxyXG4gICAgICAgIGlmIChkYXRhLmJlZm9yZUNhbGwpIHtcclxuICAgICAgICAgICAgaWYgKGRhdGEuYmVmb3JlQ2FsbCBpbiBBUEkuYmVmb3JlQ2FsbHMpIHtcclxuICAgICAgICAgICAgICAgIEFQSS5iZWZvcmVDYWxsc1tkYXRhLmJlZm9yZUNhbGxdKGRhdGEsICRlbCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEFQSS5jYWxsSXQoZGF0YSwgJGVsKTtcclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvblN1Y2Nlc3MgPSAoZGF0YTogSUFwaURhdGEsICRlbDogSlF1ZXJ5LCByZXNwb25zZSk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoZGF0YS5jYWxsYmFjaykge1xyXG4gICAgICAgICAgICBpZiAoZGF0YS5jYWxsYmFjayBpbiBBUEkuY2FsbGJhY2tzKSB7XHJcbiAgICAgICAgICAgICAgICBBUEkuY2FsbGJhY2tzW2RhdGEuY2FsbGJhY2tdKGRhdGEsICRlbCwgcmVzcG9uc2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufSIsImV4cG9ydCBpbnRlcmZhY2UgSUJyZWFrcG9pbnQge1xyXG4gICAgZGVza3RvcDogYm9vbGVhbjtcclxuICAgIHRhYmxldDogYm9vbGVhbjtcclxuICAgIHBob25lOiBib29sZWFuO1xyXG4gICAgdmFsdWU6IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGxldCBicmVha3BvaW50OiBJQnJlYWtwb2ludDtcclxuXHJcbmV4cG9ydCBjbGFzcyBCcmVha3BvaW50IHtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHVwZGF0ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgY3NzQmVmb3JlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLCAnOmJlZm9yZScpO1xyXG4gICAgICAgIGNvbnN0IGNzc0JlZm9yZVZhbHVlID0gY3NzQmVmb3JlLmdldFByb3BlcnR5VmFsdWUoJ2NvbnRlbnQnKS5yZXBsYWNlKC9bXFxcIlxcJ10vZywgJycpO1xyXG5cclxuICAgICAgICBicmVha3BvaW50ID0ge1xyXG4gICAgICAgICAgICBkZXNrdG9wOiBjc3NCZWZvcmVWYWx1ZSA9PT0gJ2Rlc2t0b3AnLFxyXG4gICAgICAgICAgICBwaG9uZTogY3NzQmVmb3JlVmFsdWUgPT09ICdwaG9uZScsXHJcbiAgICAgICAgICAgIHRhYmxldDogY3NzQmVmb3JlVmFsdWUgPT09ICd0YWJsZXQnLFxyXG4gICAgICAgICAgICB2YWx1ZTogY3NzQmVmb3JlVmFsdWUsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coXCJCUDpcIiwgYnJlYWtwb2ludC52YWx1ZSk7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGxldCBicm93c2VyOiBJQnJvd3NlcjtcclxuZGVjbGFyZSBsZXQgb3ByO1xyXG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1hbnkgaW50ZXJmYWNlLW5hbWVcclxuaW50ZXJmYWNlIFdpbmRvdyB7XHJcbiAgICBvcHI6IGFueTtcclxuICAgIG9wZXJhOiBhbnk7XHJcbiAgICBzYWZhcmk6IGFueTtcclxuICAgIEhUTUxFbGVtZW50OiBhbnk7XHJcbn1cclxuLy8gdHNsaW50OmVuYWJsZTpuby1hbnkgaW50ZXJmYWNlLW5hbWVcclxuXHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElCcm93c2VyIHtcclxuICAgIG1vYmlsZT86IGJvb2xlYW47XHJcbiAgICB3aW5kb3dzPzogYm9vbGVhbjtcclxuICAgIG1hYz86IGJvb2xlYW47XHJcbiAgICBpZT86IGJvb2xlYW47XHJcbiAgICBpb3M/OiBib29sZWFuO1xyXG4gICAgb3BlcmE/OiBib29sZWFuO1xyXG4gICAgZmlyZWZveD86IGJvb2xlYW47XHJcbiAgICBzYWZhcmk/OiBib29sZWFuO1xyXG4gICAgY2hyb21lPzogYm9vbGVhbjtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRCcm93c2VyKCk6IElCcm93c2VyIHtcclxuICAgIGNvbnN0IHVhID0gd2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQ7XHJcbiAgICBicm93c2VyID0ge1xyXG4gICAgICAgIG1vYmlsZTogKC8oYW5kcm9pZHxiYlxcZCt8bWVlZ28pLittb2JpbGV8YXZhbnRnb3xiYWRhXFwvfGJsYWNrYmVycnl8YmxhemVyfGNvbXBhbHxlbGFpbmV8ZmVubmVjfGhpcHRvcHxpZW1vYmlsZXxpcChob25lfG9kKXxpcGFkfGlyaXN8a2luZGxlfEFuZHJvaWR8U2lsa3xsZ2UgfG1hZW1vfG1pZHB8bW1wfG5ldGZyb250fG9wZXJhIG0ob2J8aW4paXxwYWxtKCBvcyk/fHBob25lfHAoaXhpfHJlKVxcL3xwbHVja2VyfHBvY2tldHxwc3B8c2VyaWVzKDR8NikwfHN5bWJpYW58dHJlb3x1cFxcLihicm93c2VyfGxpbmspfHZvZGFmb25lfHdhcHx3aW5kb3dzIChjZXxwaG9uZSl8eGRhfHhpaW5vL2kudGVzdCh1YSkgfHwgLzEyMDd8NjMxMHw2NTkwfDNnc298NHRocHw1MFsxLTZdaXw3NzBzfDgwMnN8YSB3YXxhYmFjfGFjKGVyfG9vfHNcXC0pfGFpKGtvfHJuKXxhbChhdnxjYXxjbyl8YW1vaXxhbihleHxueXx5dyl8YXB0dXxhcihjaHxnbyl8YXModGV8dXMpfGF0dHd8YXUoZGl8XFwtbXxyIHxzICl8YXZhbnxiZShja3xsbHxucSl8YmkobGJ8cmQpfGJsKGFjfGF6KXxicihlfHYpd3xidW1ifGJ3XFwtKG58dSl8YzU1XFwvfGNhcGl8Y2N3YXxjZG1cXC18Y2VsbHxjaHRtfGNsZGN8Y21kXFwtfGNvKG1wfG5kKXxjcmF3fGRhKGl0fGxsfG5nKXxkYnRlfGRjXFwtc3xkZXZpfGRpY2F8ZG1vYnxkbyhjfHApb3xkcygxMnxcXC1kKXxlbCg0OXxhaSl8ZW0obDJ8dWwpfGVyKGljfGswKXxlc2w4fGV6KFs0LTddMHxvc3x3YXx6ZSl8ZmV0Y3xmbHkoXFwtfF8pfGcxIHV8ZzU2MHxnZW5lfGdmXFwtNXxnXFwtbW98Z28oXFwud3xvZCl8Z3IoYWR8dW4pfGhhaWV8aGNpdHxoZFxcLShtfHB8dCl8aGVpXFwtfGhpKHB0fHRhKXxocCggaXxpcCl8aHNcXC1jfGh0KGMoXFwtfCB8X3xhfGd8cHxzfHQpfHRwKXxodShhd3x0Yyl8aVxcLSgyMHxnb3xtYSl8aTIzMHxpYWMoIHxcXC18XFwvKXxpYnJvfGlkZWF8aWcwMXxpa29tfGltMWt8aW5ub3xpcGFxfGlyaXN8amEodHx2KWF8amJyb3xqZW11fGppZ3N8a2RkaXxrZWppfGtndCggfFxcLyl8a2xvbnxrcHQgfGt3Y1xcLXxreW8oY3xrKXxsZShub3x4aSl8bGcoIGd8XFwvKGt8bHx1KXw1MHw1NHxcXC1bYS13XSl8bGlid3xseW54fG0xXFwtd3xtM2dhfG01MFxcL3xtYSh0ZXx1aXx4byl8bWMoMDF8MjF8Y2EpfG1cXC1jcnxtZShyY3xyaSl8bWkobzh8b2F8dHMpfG1tZWZ8bW8oMDF8MDJ8Yml8ZGV8ZG98dChcXC18IHxvfHYpfHp6KXxtdCg1MHxwMXx2ICl8bXdicHxteXdhfG4xMFswLTJdfG4yMFsyLTNdfG4zMCgwfDIpfG41MCgwfDJ8NSl8bjcoMCgwfDEpfDEwKXxuZSgoY3xtKVxcLXxvbnx0Znx3Znx3Z3x3dCl8bm9rKDZ8aSl8bnpwaHxvMmltfG9wKHRpfHd2KXxvcmFufG93ZzF8cDgwMHxwYW4oYXxkfHQpfHBkeGd8cGcoMTN8XFwtKFsxLThdfGMpKXxwaGlsfHBpcmV8cGwoYXl8dWMpfHBuXFwtMnxwbyhja3xydHxzZSl8cHJveHxwc2lvfHB0XFwtZ3xxYVxcLWF8cWMoMDd8MTJ8MjF8MzJ8NjB8XFwtWzItN118aVxcLSl8cXRla3xyMzgwfHI2MDB8cmFrc3xyaW05fHJvKHZlfHpvKXxzNTVcXC98c2EoZ2V8bWF8bW18bXN8bnl8dmEpfHNjKDAxfGhcXC18b298cFxcLSl8c2RrXFwvfHNlKGMoXFwtfDB8MSl8NDd8bWN8bmR8cmkpfHNnaFxcLXxzaGFyfHNpZShcXC18bSl8c2tcXC0wfHNsKDQ1fGlkKXxzbShhbHxhcnxiM3xpdHx0NSl8c28oZnR8bnkpfHNwKDAxfGhcXC18dlxcLXx2ICl8c3koMDF8bWIpfHQyKDE4fDUwKXx0NigwMHwxMHwxOCl8dGEoZ3R8bGspfHRjbFxcLXx0ZGdcXC18dGVsKGl8bSl8dGltXFwtfHRcXC1tb3x0byhwbHxzaCl8dHMoNzB8bVxcLXxtM3xtNSl8dHhcXC05fHVwKFxcLmJ8ZzF8c2kpfHV0c3R8djQwMHx2NzUwfHZlcml8dmkocmd8dGUpfHZrKDQwfDVbMC0zXXxcXC12KXx2bTQwfHZvZGF8dnVsY3x2eCg1Mnw1M3w2MHw2MXw3MHw4MHw4MXw4M3w4NXw5OCl8dzNjKFxcLXwgKXx3ZWJjfHdoaXR8d2koZyB8bmN8bncpfHdtbGJ8d29udXx4NzAwfHlhc1xcLXx5b3VyfHpldG98enRlXFwtL2kudGVzdCh1YS5zdWJzdHIoMCwgNCkpKSA/IHRydWUgOiBmYWxzZSxcclxuICAgICAgICBpb3M6IC9pUGFkfGlQaG9uZXxpUG9kLy50ZXN0KHVhKSxcclxuICAgICAgICBtYWM6IG5hdmlnYXRvci5wbGF0Zm9ybS50b1VwcGVyQ2FzZSgpLmluZGV4T2YoJ01BQycpID49IDAsXHJcbiAgICAgICAgaWU6IHVhLmluZGV4T2YoJ01TSUUgJykgPiAwIHx8ICEhdWEubWF0Y2goL1RyaWRlbnQuKnJ2XFw6MTFcXC4vKSxcclxuICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLWFueVxyXG4gICAgICAgIG9wZXJhOiAoISEod2luZG93IGFzIGFueSkub3ByICYmICEhb3ByLmFkZG9ucykgfHwgISEod2luZG93IGFzIGFueSkub3BlcmEgfHwgbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCcgT1BSLycpID49IDAsXHJcbiAgICAgICAgZmlyZWZveDogdWEudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcclxuICAgICAgICBzYWZhcmk6IC9eKCg/IWNocm9tZXxhbmRyb2lkKS4pKnNhZmFyaS9pLnRlc3QodWEpLFxyXG4gICAgICAgIHdpbmRvd3M6IHdpbmRvdy5uYXZpZ2F0b3IucGxhdGZvcm0udG9Mb3dlckNhc2UoKS5pbmRleE9mKCd3aW4nKSA+IC0xLFxyXG4gICAgfTtcclxuXHJcbiAgICAkKCdodG1sJylcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21hYycsICFicm93c2VyLndpbmRvd3MgJiYgKGJyb3dzZXIuaW9zIHx8IGJyb3dzZXIubWFjKSlcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ3dpbmRvd3MnLCBicm93c2VyLndpbmRvd3MgJiYgIWJyb3dzZXIubWFjICYmICFicm93c2VyLmlvcylcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ21vYmlsZScsIGJyb3dzZXIubW9iaWxlKVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnZmlyZWZveCcsIGJyb3dzZXIuZmlyZWZveClcclxuICAgICAgICAudG9nZ2xlQ2xhc3MoJ3NhZmFyaScsIGJyb3dzZXIuc2FmYXJpKVxyXG4gICAgICAgIC50b2dnbGVDbGFzcygnaWUnLCBicm93c2VyLmllKTtcclxuXHJcbiAgICByZXR1cm4gYnJvd3NlcjtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBCcm93c2VyIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgdXBkYXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGJyb3dzZXIgPSBnZXRCcm93c2VyKCk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgU2xpZGVyIH0gZnJvbSAnLi9jb21wb25lbnRzL1NsaWRlcic7XHJcbmltcG9ydCB7IFRvb2x0aXAgfSBmcm9tICcuL2NvbXBvbmVudHMvVG9vbHRpcCc7XHJcbmltcG9ydCB7IERyb3Bkb3duIH0gZnJvbSAnLi9jb21wb25lbnRzL0Ryb3Bkb3duJztcclxuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vY29tcG9uZW50cy9GaWx0ZXJzJztcclxuaW1wb3J0IHsgRGFzaGJvYXJkIH0gZnJvbSAnLi9jb21wb25lbnRzL0Rhc2hib2FyZCc7XHJcbmltcG9ydCB7IFN0YXRzIH0gZnJvbSAnLi9jb21wb25lbnRzL1N0YXRzJztcclxuaW1wb3J0IHsgTWFzb25yeSB9IGZyb20gJy4vY29tcG9uZW50cy9NYXNvbnJ5JztcclxuaW1wb3J0IHsgUmFuZ2UgfSBmcm9tICcuL2NvbXBvbmVudHMvUmFuZ2UnO1xyXG5pbXBvcnQgeyBMaW5lY2hhcnQgfSBmcm9tICcuL2NvbXBvbmVudHMvTGluZWNoYXJ0JztcclxuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xyXG5pbXBvcnQgeyBQYXJhbGxheCB9IGZyb20gJy4vY29tcG9uZW50cy9QYXJhbGxheCc7XHJcbmltcG9ydCB7IFNlYXJjaCB9IGZyb20gJy4vY29tcG9uZW50cy9TZWFyY2gnO1xyXG5pbXBvcnQgeyBDb21wYXJlIH0gZnJvbSAnLi9jb21wb25lbnRzL0NvbXBhcmUnO1xyXG5pbXBvcnQgeyBDaGFydHMgfSBmcm9tICcuL2NvbXBvbmVudHMvQ2hhcnRzJztcclxuXHJcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3BhZ2VzL1BhZ2UnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbXBvbmVudHMgPSB7XHJcbiAgICBTbGlkZXIsXHJcbiAgICBUb29sdGlwLFxyXG4gICAgRHJvcGRvd24sXHJcbiAgICBGaWx0ZXJzLFxyXG4gICAgRGFzaGJvYXJkLFxyXG4gICAgU3RhdHMsXHJcbiAgICBNYXNvbnJ5LFxyXG4gICAgUmFuZ2UsXHJcbiAgICBMaW5lY2hhcnQsXHJcbiAgICBBc2lkZSxcclxuICAgIFBhcmFsbGF4LFxyXG4gICAgU2VhcmNoLFxyXG4gICAgQ29tcGFyZSxcclxuICAgIENoYXJ0cyxcclxufTtcclxuXHJcblxyXG5leHBvcnQgY29uc3QgcGFnZXMgPSB7XHJcbiAgICBQYWdlXHJcbn07XHJcblxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuL2RlZmluaXRpb25zL2NsaXBib2FyZC5kLnRzXCIgLz5cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENvcHkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIENvcHkuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnW2RhdGEtY29weV0nKS5vbignY2xpY2snLCAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHVybCA9IHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4gKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWU7XHJcblxyXG4gICAgICAgICAgICAod2luZG93LkNsaXBib2FyZCBhcyBhbnkpLmNvcHkodXJsKTtcclxuICAgICAgICAgICAgd2luZG93LmNvbnNvbGUuaW5mbygnXCIlc1wiIGNvcGllZCcsIHVybCk7XHJcblxyXG4gICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ2lzLWNvcGllZCcpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgJGVsLnJlbW92ZUNsYXNzKCdpcy1jb3BpZWQnKTsgfSwgMTAwMCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiZXhwb3J0IGFic3RyYWN0IGNsYXNzIEhhbmRsZXIge1xyXG5cclxuXHJcbiAgICBwcml2YXRlIGV2ZW50czogeyBba2V5OiBzdHJpbmddOiBGdW5jdGlvbltdIH07XHJcblxyXG4gICAgY29uc3RydWN0b3IgKCkge1xyXG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXR0YWNoIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0gIHtzdHJpbmd9ICAgZXZlbnROYW1lIHBsZWFzZSB1c2Ugc3RhdGljIG5hbWVzXHJcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gaGFuZGxlciAgIGNhbGxiYWNrIGZ1bmN0aW9uXHJcbiAgICAgKiBAcmV0dXJuIHtIYW5kbGVyfSAgICAgICAgICAgIHJldHVybnMgY3VycmVudCBvYmplY3RcclxuICAgICAqL1xyXG4gICAgcHVibGljIG9uKGV2ZW50TmFtZTogc3RyaW5nLCBoYW5kbGVyOiBGdW5jdGlvbik6IEhhbmRsZXIge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdID0gW107XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmV2ZW50c1tldmVudE5hbWVdLnB1c2goaGFuZGxlcik7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIERldGFjaCBhbiBldmVudCBoYW5kbGVyIGZ1bmN0aW9uLlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSAgIGV2ZW50TmFtZSBwbGVhc2UgdXNlIHN0YXRpYyBuYW1lc1xyXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGhhbmRsZXIgICBjYWxsYmFjayBmdW5jdGlvblxyXG4gICAgICogQHJldHVybiB7SGFuZGxlcn0gICAgICAgICAgICByZXR1cm5zIGN1cnJlbnQgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBvZmYoZXZlbnROYW1lPzogc3RyaW5nLCBoYW5kbGVyPzogRnVuY3Rpb24pOiBIYW5kbGVyIHtcclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBldmVudE5hbWUgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzID0ge307XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyID09PSAndW5kZWZpbmVkJyAmJiB0aGlzLmV2ZW50c1tldmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0gPSBbXTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gdGhpcy5ldmVudHNbZXZlbnROYW1lXS5pbmRleE9mKGhhbmRsZXIpO1xyXG5cclxuICAgICAgICBpZiAoIGluZGV4ID4gLTEgKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYWxsIGFuIGV2ZW50IGhhbmRsZXIgZnVuY3Rpb24uXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnROYW1lXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gLi4uZXh0cmFQYXJhbWV0ZXJzIHBhc3MgYW55IHBhcmFtZXRlcnMgdG8gY2FsbGJhY2sgZnVuY3Rpb25cclxuICAgICAqL1xyXG4gICAgcHVibGljIHRyaWdnZXIoZXZlbnROYW1lOiBzdHJpbmcsIC4uLmV4dHJhUGFyYW1ldGVycyk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAoICF0aGlzLmV2ZW50c1tldmVudE5hbWVdICkgeyByZXR1cm47IH1cclxuICAgICAgICBjb25zdCBhcmdzID0gYXJndW1lbnRzO1xyXG4gICAgICAgIHRoaXMuZXZlbnRzW2V2ZW50TmFtZV0uZm9yRWFjaChldmVudCA9PiBldmVudC5hcHBseSh0aGlzLCBbXS5zbGljZS5jYWxsKGFyZ3MsIDEpKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgZGVzdHJveSgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xyXG4gICAgfVxyXG59XHJcblxyXG4iLCJleHBvcnQgY2xhc3MgTG9hZGVyIHtcclxuXHJcbiAgICBwcml2YXRlIHByb2dyZXNzOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHdpZHRoOiBudW1iZXI7XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5KSB7XHJcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoO1xyXG4gICAgICAgIHRoaXMucHJvZ3Jlc3MgPSAwO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNob3coKTogdm9pZCB7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgeTogMCwgZHVyYXRpb246IDAuMiB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBoaWRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKHRoaXMudmlldywgWyd3aWR0aCddKTtcclxuICAgICAgICBnc2FwLnRvKHRoaXMudmlldywgeyBkdXJhdGlvbjogMC41LCB5OiAxMCwgd2lkdGg6IHRoaXMud2lkdGggfHwgJzEwMCUnIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHNldChwcm9ncmVzczogbnVtYmVyKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5wcm9ncmVzcyA9IHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsneSddKTtcclxuXHJcbiAgICAgICAgbGV0IHdpZHRoID0gdGhpcy53aWR0aCAqIHByb2dyZXNzO1xyXG5cclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLnZpZXcsIFsnd2lkdGgnXSk7XHJcbiAgICAgICAgZ3NhcC50byh0aGlzLnZpZXcsIHsgZHVyYXRpb246IDAuMywgd2lkdGg6IHdpZHRoIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLndpZHRoID0gd2R0O1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuL0hhbmRsZXInO1xyXG5pbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuL1Njcm9sbCc7XHJcbmltcG9ydCB7ICRib2R5LCAkYXJ0aWNsZSwgJHBhZ2VIZWFkZXIgfSBmcm9tICcuL1NpdGUnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuL1V0aWxzJztcclxuaW1wb3J0IHsgQXNpZGUgfSBmcm9tICcuL2NvbXBvbmVudHMvQXNpZGUnO1xyXG4vLyBpbXBvcnQgeyBTaWdudXAgfSBmcm9tICcuL1NpZ251cCc7XHJcblxyXG5cclxuLyogdHNsaW50OmRpc2FibGU6dmFyaWFibGUtbmFtZSBkaXNhYmxlLW5leHQtbGluZTogbm8tYW55ICovXHJcbmxldCBIaXN0b3J5anM6IEhpc3RvcnlqcyA9IDxhbnk+SGlzdG9yeTtcclxuLyogdHNsaW50OmVuYWJsZTp2YXJpYWJsZS1uYW1lIGRpc2FibGUtbmV4dC1saW5lOiBuby1hbnkgKi9cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXNFdmVudHMge1xyXG4gICAgcHVibGljIHN0YXRpYyBDSEFOR0UgPSAnc3RhdGUnO1xyXG4gICAgcHVibGljIHN0YXRpYyBQUk9HUkVTUyA9ICdwcm9ncmVzcyc7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFB1c2hTdGF0ZXMgZXh0ZW5kcyBIYW5kbGVyIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgaW5zdGFuY2U6IFB1c2hTdGF0ZXM7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IFRJTUVfTElNSVQgPSA1MDAwO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgbm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICBwcml2YXRlIGxvYWRlZERhdGE6IHN0cmluZztcclxuICAgIHByaXZhdGUgcmVxdWVzdDogWE1MSHR0cFJlcXVlc3Q7XHJcbiAgICBwcml2YXRlIHRpbWVvdXQ7XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGRvY3VtZW50IHRpdGxlICovXHJcbiAgICBwdWJsaWMgc3RhdGljIHNldFRpdGxlKHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgZG9jdW1lbnQudGl0bGUgPSB0aXRsZSB8fCAkKCcjbWFpbiA+IFtkYXRhLXRpdGxlXScpLmRhdGEoJ3RpdGxlJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIGFuZCB0cmlnZ2VyIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgZ29Ubyhsb2NhdGlvbjogc3RyaW5nLCByZXBsYWNlPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgcGF0aG5hbWUgPSBsb2NhdGlvbi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCArIHdpbmRvdy5sb2NhdGlvbi5ob3N0LCAnJyksXHJcbiAgICAgICAgICAgIGlzRGlmZmVyZW50ID0gcGF0aG5hbWUgIT09IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuXHJcbiAgICAgICAgaWYgKE1vZGVybml6ci5oaXN0b3J5KSB7XHJcbiAgICAgICAgICAgIGlmICghIXJlcGxhY2UpIHtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5yZXBsYWNlU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBwYXRobmFtZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBIaXN0b3J5anMucHVzaFN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgcGF0aG5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlcGxhY2UobG9jYXRpb24pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGlzRGlmZmVyZW50O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIG9ubHkgY2hhbmdlIGxvYWN0aW9uIHBhdGhuYW1lIHdpdGhvdXQgdHJpZ2dlcmluZyBIaXN0b3J5ICovXHJcbiAgICBwdWJsaWMgc3RhdGljIGNoYW5nZVBhdGgobG9jYXRpb246IHN0cmluZywgcmVwbGFjZT86IGJvb2xlYW4sIHRpdGxlPzogc3RyaW5nKTogdm9pZCB7XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSB0cnVlO1xyXG4gICAgICAgIGxldCBjaGFuZ2VkID0gUHVzaFN0YXRlcy5nb1RvKGxvY2F0aW9uLCByZXBsYWNlIHx8IHRydWUpO1xyXG4gICAgICAgIFB1c2hTdGF0ZXMubm9DaGFuZ2UgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCEhY2hhbmdlZCkge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLnNldFRpdGxlKHRpdGxlIHx8IGRvY3VtZW50LnRpdGxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyB0byBiZSB1c2VkIHdpdGggUHVzaFN0YXRlcyAvIEhpc3RvcnkgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmluZCh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcsIGVsZW1lbnRJdHNlbGY/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgaWYgKCFlbGVtZW50SXRzZWxmKSB7XHJcbiAgICAgICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UuYmluZExpbmtzKHRhcmdldCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgUHVzaFN0YXRlcy5pbnN0YW5jZS5iaW5kTGluayh0YXJnZXQgYXMgRWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBnbyBiYWNrIGluIGJyb3dzZXIgaGlzdG9yeVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG9wdGlvbmFsIGZhbGxiYWNrIHVybCAod2hlbiBicm93c2VyIGRlb2Vzbid0IGhhdmUgYW55IGl0ZW1zIGluIGhpc3RvcnkpXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBzdGF0aWMgYmFjayh1cmw/OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBpZiAoaGlzdG9yeS5sZW5ndGggPiAyKSB7IC8vIHx8IGRvY3VtZW50LnJlZmVycmVyLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgSGlzdG9yeWpzLmJhY2soKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHVybCkge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgdXJsKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBIaXN0b3J5anMucmVwbGFjZVN0YXRlKHsgcmFuZG9tRGF0YTogTWF0aC5yYW5kb20oKSB9LCBkb2N1bWVudC50aXRsZSwgJy8nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlbG9hZCgpOiB2b2lkIHtcclxuICAgICAgICBQdXNoU3RhdGVzLmluc3RhbmNlLnRyaWdnZXIoUHVzaFN0YXRlc0V2ZW50cy5DSEFOR0UpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2V0TmF2YmFyVmlzaWJpbGl0eSgpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKCEkcGFnZUhlYWRlcikge1xyXG4gICAgICAgICAgICAkKCdodG1sJykuYWRkQ2xhc3MoJ2lzLWFuaW1hdGVkJyk7XHJcbiAgICAgICAgICAgICRib2R5LmFkZENsYXNzKCduYXZiYXItYWx3YXlzLXNob3duJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYXNpZGVUb2dnbGUgPSAoZT8pOiB2b2lkID0+IHtcclxuICAgICAgICBsZXQgZWwgPSBlID8gJChlLmN1cnJlbnRUYXJnZXQpIDogJCgnW2RhdGEtaGFtYnVyZ2VyXScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1hc2lkZS1vcGVuJyk7XHJcbiAgICAgICAgZWwudG9nZ2xlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuXHJcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdpcy1vcGVuJykpIHtcclxuICAgICAgICAgICAgZ3NhcC5zZXQoJGFydGljbGUsIHsnd2lsbC1jaGFuZ2UnOiAndHJhbnNmb3JtJ30pO1xyXG4gICAgICAgICAgICBVdGlscy5kaXNhYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnc2FwLnNldCgkYXJ0aWNsZSwgeyBjbGVhclByb3BzOiAnd2lsbC1jaGFuZ2UnfSk7XHJcbiAgICAgICAgICAgIFV0aWxzLmVuYWJsZUJvZHlTY3JvbGxpbmcoU2Nyb2xsLnNjcm9sbFRvcCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIEFzaWRlLmFzaWRlQW5pbWF0aW9uKCk7XHJcblxyXG5cclxuICAgICAgICAvLyByZXR1cm47XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoKTtcclxuXHJcbiAgICAgICAgaWYgKEhpc3Rvcnlqcykge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmRMaW5rcygpO1xyXG4gICAgICAgICAgICBIaXN0b3J5anMuQWRhcHRlci5iaW5kKHdpbmRvdywgJ3N0YXRlY2hhbmdlJywgdGhpcy5vblN0YXRlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIFB1c2hTdGF0ZXMuaW5zdGFuY2UgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZUxpbmtzKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBsb2FkIG5ldyBjb250ZW50IHZpYSBhamF4IGJhc2VkIG9uIGN1cnJlbnQgbG9jYXRpb246XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBwcm9taXNlIHJlc29sdmVkIHdoZW4gWE1MSHR0cFJlcXVlc3QgaXMgZmluaXNoZWRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XHJcblxyXG4gICAgICAgIC8vIGNhbmNlbCBvbGQgcmVxdWVzdDpcclxuICAgICAgICBpZiAodGhpcy5yZXF1ZXN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5hYm9ydCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHVybFxyXG4gICAgICAgIGNvbnN0IHBhdGg6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZTtcclxuICAgICAgICBjb25zdCBzZWFyY2g6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggfHwgJyc7XHJcbiAgICAgICAgY29uc3QgdXJsID0gcGF0aCArIHNlYXJjaDtcclxuXHJcbiAgICAgICAgLy8gZGVmaW5lIHRpbWVvdXRcclxuICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJlcXVlc3QpIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIFB1c2hTdGF0ZXMuVElNRV9MSU1JVCk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBwcm9taXNlXHJcbiAgICAgICAgLy8gYW5kIGRvIHRoZSByZXF1ZXN0OlxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyBkbyB0aGUgdXN1YWwgeGhyIHN0dWZmOlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9wZW4oJ0dFVCcsIHVybCk7XHJcbiAgICAgICAgICAgIHRoaXMucmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVJlcXVlc3RlZC1XaXRoJywgJ1hNTEh0dHBSZXF1ZXN0Jyk7XHJcblxyXG4gICAgICAgICAgICAvLyBvbmxvYWQgaGFuZGxlcjpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ubG9hZCA9ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yZXF1ZXN0LnN0YXR1cyA9PT0gMjAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubG9hZGVkRGF0YSA9IHRoaXMucmVxdWVzdC5yZXNwb25zZVRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuUFJPR1JFU1MsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IodGhpcy5yZXF1ZXN0LnN0YXR1c1RleHQpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMucmVxdWVzdC5zdGF0dXNUZXh0ICE9PSAnYWJvcnQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXF1ZXN0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNhdGNoaW5nIGVycm9yczpcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9uZXJyb3IgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QoRXJyb3IoJ05ldHdvcmsgRXJyb3InKSk7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcXVlc3QgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gY2F0Y2ggcHJvZ3Jlc3NcclxuICAgICAgICAgICAgdGhpcy5yZXF1ZXN0Lm9ucHJvZ3Jlc3MgPSAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQdXNoU3RhdGVzRXZlbnRzLlBST0dSRVNTLCBlLmxvYWRlZCAvIGUudG90YWwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgLy8gc2VuZCByZXF1ZXN0OlxyXG4gICAgICAgICAgICB0aGlzLnJlcXVlc3Quc2VuZCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGZ1bmN0aW9uIGNhbGxlZCBvbiBzdWNjZXNzZnVsIGRhdGEgbG9hZCAqL1xyXG4gICAgcHVibGljIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgZGF0YTogc3RyaW5nID0gdGhpcy5sb2FkZWREYXRhLnRyaW0oKTtcclxuICAgICAgICBjb25zdCBjb250YWluZXJzOiBhbnkgPSAkKCcuanMtcmVwbGFjZVtpZF0sICNtYWluJykudG9BcnJheSgpO1xyXG4gICAgICAgIGxldCByZW5kZXJlZENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyIGVhY2ggb2YgY29udGFpbmVyc1xyXG4gICAgICAgIC8vIGlmIG9ubHkgb25lIGNvbnRhaW5lciwgZm9yY2UgYHBsYWluYFxyXG4gICAgICAgIGlmIChjb250YWluZXJzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgY29udGFpbmVycy5mb3JFYWNoKChjb250YWluZXIsIGluZGV4KTogdm9pZCA9PiB7XHJcbiAgICAgICAgICAgICAgICByZW5kZXJlZENvdW50ICs9IHRoaXMucmVuZGVyRWxlbWVudChjb250YWluZXIsIGRhdGEsIGluZGV4ID09PSAwICYmIGNvbnRhaW5lcnMubGVuZ3RoID09PSAxKSA/IDEgOiAwO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlLXRyeSByZW5kZXJpbmcgaWYgbm9uZSBvZiBjb250YWluZXJzIHdlcmUgcmVuZGVyZWQ6XHJcbiAgICAgICAgaWYgKHJlbmRlcmVkQ291bnQgPT09IDAgJiYgY29udGFpbmVycy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyRWxlbWVudCgkKCcjbWFpbicpWzBdLCBkYXRhLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYmluZExpbmtzKCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVMaW5rcygpO1xyXG5cclxuICAgICAgICAvLyBkaXNwYXRjaCBnbG9iYWwgZXZlbnQgZm9yIHNlcmRlbGlhIENNUzpcclxuICAgICAgICB3aW5kb3cuZG9jdW1lbnQuZGlzcGF0Y2hFdmVudChuZXcgRXZlbnQoJ2FqYXhfbG9hZGVkJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSByZW5kZXJFbGVtZW50KGVsOiBIVE1MRWxlbWVudCwgZGF0YTogc3RyaW5nLCBmb3JjZVBsYWluPzogYm9vbGVhbik6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgY29kZTogc3RyaW5nID0gbnVsbDtcclxuICAgICAgICBjb25zdCBjb250YWluZXIgPSAnIycgKyBlbC5pZDtcclxuXHJcbiAgICAgICAgaWYgKCEhZm9yY2VQbGFpbiAmJiBkYXRhLmluZGV4T2YoJzxhcnRpY2xlJykgPT09IDAgJiYgZWwuaWQgPT09ICdhcnRpY2xlLW1haW4nKSB7XHJcbiAgICAgICAgICAgIGNvZGUgPSBkYXRhO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0ICRsb2FkZWRDb250ZW50OiBKUXVlcnkgPSAkKCQoZGF0YSkuZmluZChjb250YWluZXIpWzBdIHx8ICQoZGF0YSkuZmlsdGVyKGNvbnRhaW5lcilbMF0pO1xyXG4gICAgICAgICAgICBjb2RlID0gJGxvYWRlZENvbnRlbnQuaHRtbCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCFjb2RlKSB7IGNvbnNvbGUuaW5mbyhgQ291bGRuJ3QgcmVyZW5kZXIgIyR7ZWwuaWR9IGVsZW1lbnRgKTsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgICAgICQoY29udGFpbmVyKVxyXG4gICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgICAgIC5lbXB0eSgpXHJcbiAgICAgICAgICAgIC5odG1sKGNvZGUgfHwgZGF0YSlcclxuICAgICAgICAgICAgLnNob3coKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogYmluZCBsaW5rcyAqL1xyXG4gICAgcHJpdmF0ZSBiaW5kTGluayh0YXJnZXQ6IEVsZW1lbnQpOiB2b2lkIHtcclxuICAgICAgICAkKHRhcmdldCkub2ZmKCdjbGljaycpLm9uKCdjbGljay5oaXN0b3J5JywgdGhpcy5vbkNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBiaW5kIGxpbmtzICovXHJcbiAgICBwcml2YXRlIGJpbmRMaW5rcyh0YXJnZXQ/OiBFbGVtZW50IHwgTm9kZUxpc3QgfCBFbGVtZW50W10gfCBzdHJpbmcpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0IHx8ICdib2R5JztcclxuXHJcbiAgICAgICAgJCh0YXJnZXQpLmZpbmQoJ2EnKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1oaXN0b3J5PVwiZmFsc2VcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbZGF0YS1hcGldJylcclxuICAgICAgICAgICAgLm5vdCgnW2Rvd25sb2FkXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLW1vZGFsXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIiNcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZiQ9XCIuanBnXCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW3RhcmdldD1cIl9ibGFua1wiXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tocmVmXj1cIm1haWx0bzpcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJ0ZWw6XCJdJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtcG9jenRhXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxvZ2luXScpXHJcbiAgICAgICAgICAgIC5ub3QoJ1tkYXRhLWxhbmddJylcclxuICAgICAgICAgICAgLm5vdCgnW2RhdGEtc2Nyb2xsLXRvXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jykub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uQ2xpY2spO1xyXG5cclxuICAgICAgICAkKHRhcmdldCkuZmluZCgnYVtocmVmXj1cImh0dHBcIl0nKVxyXG4gICAgICAgICAgICAubm90KCdbaHJlZl49XCJodHRwOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0ICsgJ1wiXScpXHJcbiAgICAgICAgICAgIC5vZmYoJy5oaXN0b3J5Jyk7XHJcblxyXG4gICAgICAgICQodGFyZ2V0KS5maW5kKCdhW2hyZWZePVwiI1wiXScpLm5vdCgnW2hyZWY9XCIjXCJdJylcclxuICAgICAgICAgICAgLm9mZignLmhpc3RvcnknKVxyXG4gICAgICAgICAgICAub24oJ2NsaWNrLmhpc3RvcnknLCB0aGlzLm9uSGFzaENsaWNrKTtcclxuXHJcblxyXG4gICAgICAgICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5vbignY2xpY2snLCBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTGFuZ3VhZ2VDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc3QgbGFuZyA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCdsYW5nJyk7XHJcbiAgICAgICAgY29uc3QgYWx0ZXJuYXRlID0gJCgnW2RhdGEtYWx0ZXJuYXRlXScpLmRhdGEoJ2FsdGVybmF0ZScpO1xyXG4gICAgICAgIGNvbnN0IGFydGljbGVVUkwgPSBhbHRlcm5hdGUgPyBhbHRlcm5hdGVbbGFuZyB8fCBPYmplY3Qua2V5cyhhbHRlcm5hdGUpWzBdXSA6IG51bGw7XHJcbiAgICAgICAgY29uc3QgaGVhZExpbmsgPSAkKCdsaW5rW3JlbD1cImFsdGVybmF0ZVwiXVtocmVmbGFuZ10nKVswXSBhcyBIVE1MTGlua0VsZW1lbnQ7XHJcbiAgICAgICAgY29uc3QgaGVhZFVSTCA9IGhlYWRMaW5rID8gaGVhZExpbmsuaHJlZiA6IG51bGw7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmFzc2lnbihhcnRpY2xlVVJMIHx8IGhlYWRVUkwgfHwgZS5jdXJyZW50VGFyZ2V0LmhyZWYpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqIGxpbmtzIGNsaWNrIGhhbmRsZXIgKi9cclxuICAgIHByaXZhdGUgb25DbGljayA9IChlOiBKUXVlcnlFdmVudE9iamVjdCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgbGV0ICRzZWxmOiBKUXVlcnkgPSAkKGUuY3VycmVudFRhcmdldCBhcyBIVE1MRWxlbWVudCksXHJcbiAgICAgICAgICAgIHN0YXRlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdocmVmJykucmVwbGFjZSgnaHR0cDovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdCwgJycpLFxyXG4gICAgICAgICAgICB0eXBlOiBzdHJpbmcgPSAkc2VsZi5hdHRyKCdkYXRhLWhpc3RvcnknKTtcclxuICAgICAgICBcclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZSA9PT0gJ2JhY2snKSB7XHJcbiAgICAgICAgICAgICAgICBQdXNoU3RhdGVzLmJhY2soc3RhdGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdyZXBsYWNlJykge1xyXG4gICAgICAgICAgICAgICAgSGlzdG9yeWpzLnJlcGxhY2VTdGF0ZSh7IHJhbmRvbURhdGE6IE1hdGgucmFuZG9tKCkgfSwgZG9jdW1lbnQudGl0bGUsIHN0YXRlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIFNjcm9sbC5yZXNldFNjcm9sbENhY2hlKHN0YXRlKTtcclxuICAgICAgICAgICAgICAgIEhpc3Rvcnlqcy5wdXNoU3RhdGUoeyByYW5kb21EYXRhOiBNYXRoLnJhbmRvbSgpIH0sIGRvY3VtZW50LnRpdGxlLCBzdGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LCAxKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8qKiBvbiBoYXNoLWxpbmsgY2xpY2sgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvbkhhc2hDbGljayA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ2NsaWNrIGxpbmsnKTtcclxuICAgICAgICBpZiAoJGJvZHkuaGFzQ2xhc3MoJ2lzLWFzaWRlLW9wZW4nKSkge1xyXG4gICAgICAgICAgICBQdXNoU3RhdGVzLmFzaWRlVG9nZ2xlKCk7XHJcblxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgICAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCQoZS5jdXJyZW50VGFyZ2V0Lmhhc2gpKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogSGlzdG9yeWpzIGBzdGF0ZWNoYW5nZWAgZXZlbnQgaGFuZGxlciAqL1xyXG4gICAgcHJpdmF0ZSBvblN0YXRlID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlTGlua3MoKTtcclxuICAgICAgICBQdXNoU3RhdGVzLnNldE5hdmJhclZpc2liaWxpdHkoKTtcclxuICAgICAgICBpZiAoIVB1c2hTdGF0ZXMubm9DaGFuZ2UpIHtcclxuICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFB1c2hTdGF0ZXNFdmVudHMuQ0hBTkdFKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKiogbWFyayBsaW5rcyBhcyBhY3RpdmUgKi9cclxuICAgIHByaXZhdGUgc2V0QWN0aXZlTGlua3MoKTogdm9pZCB7XHJcbiAgICAgICAgJCgnYVtocmVmXScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAkKCdhW2hyZWY9XCInICsgd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lICsgJ1wiXScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxufVxyXG5cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvZ3NhcC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvc3BsaXQtdGV4dC5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vZGVmaW5pdGlvbnMvanF1ZXJ5LmQudHNcIiAvPlxyXG5cclxuaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJy4vQnJvd3Nlcic7XHJcbmltcG9ydCB7IFB1c2hTdGF0ZXMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL2NvbXBvbmVudHMvQ29tcG9uZW50JztcclxuLy8gaW1wb3J0IHsgUHJvZ3Jlc3NiYXIgfSBmcm9tICcuL2NvbXBvbmVudHMvUHJvZ3Jlc3NiYXInO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4vYmFja2dyb3VuZHMvQmFja2dyb3VuZCc7XHJcbmltcG9ydCB7ICR3aW5kb3csICRib2R5IH0gZnJvbSAnLi9TaXRlJztcclxuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gJy4vQ2xhc3Nlcyc7XHJcblxyXG5pbnRlcmZhY2UgSUJhY2tncm91bmREYXRhIHtcclxuICAgIGlkOiBzdHJpbmc7XHJcbiAgICBzdGVwOiBudW1iZXI7XHJcbiAgICBkYXJrZW46IGJvb2xlYW47XHJcbiAgICBkYXJrZW5EZWxheTogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTY3JvbGxQYXJhbXMgZXh0ZW5kcyBPYmplY3Qge1xyXG4gICAgeD86IG51bWJlcjtcclxuICAgIHk/OiBudW1iZXI7XHJcbiAgICBzcGVlZD86IG51bWJlcjtcclxuICAgIGFuaW1hdGU/OiBib29sZWFuO1xyXG4gICAgcmVsYXRpdmVTcGVlZD86IGJvb2xlYW47XHJcbiAgICBlYXNlPzogc3RyaW5nO1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgICRlbD86IEpRdWVyeTtcclxuICAgIGRvbmU/OiBib29sZWFuO1xyXG4gICAgaGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgc3RhcnQ/OiBudW1iZXI7XHJcbiAgICB0eXBlPzogc3RyaW5nO1xyXG4gICAgeT86IG51bWJlcjtcclxuICAgIGNvbXBvbmVudD86IENvbXBvbmVudDtcclxufVxyXG5cclxuaW50ZXJmYWNlIElTY3JvbGxpbmdEYXRhIGV4dGVuZHMgSUJhc2VDYWNoZUl0ZW0ge1xyXG4gICAgdG9wOiBudW1iZXI7XHJcbiAgICByb2xlOiBzdHJpbmc7XHJcbiAgICBwYXRoPzogc3RyaW5nO1xyXG4gICAgdGl0bGU/OiBzdHJpbmc7XHJcbiAgICBib3R0b20/OiBudW1iZXI7XHJcbiAgICBjaGlsZHJlbj86IGFueTtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG4gICAgZGVsYXk/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBpbml0aWFsaXplZD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJUGFyYWxsYXhDYWNoZUl0ZW0gZXh0ZW5kcyBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBzaGlmdD86IG51bWJlcjtcclxuICAgICRjaGlsZD86IEpRdWVyeTtcclxuICAgIGNoaWxkSGVpZ2h0PzogbnVtYmVyO1xyXG59XHJcblxyXG5pbnRlcmZhY2UgSUFuaW1hdGlvbkNhY2hlSXRlbSBleHRlbmRzIElCYXNlQ2FjaGVJdGVtIHtcclxuICAgIGRlbGF5PzogbnVtYmVyO1xyXG4gICAgdW5jYWNoZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmludGVyZmFjZSBJU2Nyb2xsQ2FjaGUge1xyXG4gICAgYW5pbWF0aW9ucz86IElBbmltYXRpb25DYWNoZUl0ZW1bXTtcclxuICAgIHBhcmFsbGF4ZXM/OiBJUGFyYWxsYXhDYWNoZUl0ZW1bXTtcclxuICAgIG1vZHVsZXM/OiBJQmFzZUNhY2hlSXRlbVtdO1xyXG4gICAgYmFja2dyb3VuZHM/OiBJQmFja2dyb3VuZENhY2hlSXRlbVtdO1xyXG4gICAgc2VjdGlvbnM/OiBJU2Nyb2xsaW5nRGF0YVtdO1xyXG5cclxufVxyXG5cclxuaW50ZXJmYWNlIElCYWNrZ3JvdW5kQ2FjaGVJdGVtIGV4dGVuZHMgSUJhY2tncm91bmREYXRhLCBJQmFzZUNhY2hlSXRlbSB7XHJcbiAgICBwZXJjZW50YWdlPzogbnVtYmVyO1xyXG4gICAgaW5kZXg/OiBudW1iZXI7XHJcbiAgICBzaG93bj86IGJvb2xlYW47XHJcbiAgICBkZWxheT86IG51bWJlcjtcclxuICAgIGJyZWFrcG9pbnRzPzogc3RyaW5nW107XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFNjcm9sbCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2Nyb2xsO1xyXG4gICAgcHVibGljIHN0YXRpYyB3aW5kb3dIZWlnaHQ6IG51bWJlcjtcclxuICAgIHB1YmxpYyBzdGF0aWMgaGVhZGVySGVpZ2h0OiBudW1iZXI7XHJcbiAgICBwdWJsaWMgc3RhdGljIG1heFNjcm9sbDogbnVtYmVyO1xyXG4gICAgcHVibGljIHN0YXRpYyBkaXNhYmxlZDogYm9vbGVhbjtcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9wOiBudW1iZXI7XHJcbiAgICAvLyBwdWJsaWMgc3RhdGljIGN1c3RvbVNjcm9sbDogU2Nyb2xsYmFyO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgY3VzdG9tU2Nyb2xsO1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgYW5pbWF0aW5nOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG5cclxuICAgIHByaXZhdGUgY2FjaGU6IElTY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBzY3JvbGxDYWNoZSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBpZ25vcmVDYWNoZTogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcclxuICAgIHByaXZhdGUgdGFyZ2V0OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIHN0b3JlZFBhdGg6IHN0cmluZztcclxuICAgIHByaXZhdGUgc2VjdGlvbnM6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgY2hhbmdpbmdQYXRoOiBib29sZWFuO1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHNjcm9sbHMgcGFnZSB0byBjZXJ0YWluIGVsZW1lbnQgKHRvcCBlZGdlKSB3aXRoIHNvbWUgc3BlZWRcclxuICAgICAqIEBwYXJhbSAge0pRdWVyeX0gICAgICAgICRlbCAgICBbdGFyZ2V0IGVsbWVudF1cclxuICAgICAqIEBwYXJhbSAge251bWJlcn0gICAgICAgIG9mZnNldFxyXG4gICAgICogQHBhcmFtICB7bnVtYmVyfSAgICAgICAgZHVyYXRpb25cclxuICAgICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59ICAgICAgICBbYWZ0ZXIgY29tcGxldGVkIGFuaW1hdGlvbl1cclxuICAgICAqL1xyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9FbGVtZW50KCRlbDogSlF1ZXJ5LCBvZmZzZXQ/OiBudW1iZXIsIGR1cmF0aW9uPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlKSA9PiB7XHJcbiAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICBjb25zdCB5ID0gJGVsLm9mZnNldCgpLnRvcCAtIFNjcm9sbC5oZWFkZXJIZWlnaHQgKyAob2Zmc2V0IHx8IDApO1xyXG4gICAgICAgICAgICBjb25zdCBvYmogPSB7XHJcbiAgICAgICAgICAgICAgICB5OiBNYXRoLm1heChkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCwgd2luZG93LnBhZ2VZT2Zmc2V0KSxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKG9iaik7XHJcbiAgICAgICAgICAgIGdzYXAudG8ob2JqLCB7XHJcbiAgICAgICAgICAgICAgICB5OiB5LFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IHR5cGVvZiBkdXJhdGlvbiA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogZHVyYXRpb24sXHJcbiAgICAgICAgICAgICAgICBvblVwZGF0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5zY3JvbGxUbygwLCBvYmoueSk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFNjcm9sbC5hbmltYXRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIHJlc2V0U2Nyb2xsQ2FjaGUocGF0aG5hbWUpOiB2b2lkIHtcclxuICAgICAgICBTY3JvbGwuaW5zdGFuY2UuY2FjaGVbcGF0aG5hbWVdID0gMDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGRpc2FibGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgZW5hYmxlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuaWdub3JlQ2FjaGUgPSAhIWJyb3dzZXIuc2FmYXJpO1xyXG5cclxuICAgICAgICAkKHdpbmRvdykub24oJ3Njcm9sbCcsIHRoaXMub25TY3JvbGwpO1xyXG4gICAgICAgIC8vICQoJ2FbaHJlZl49XCIjXCJdOm5vdChcIi5qcy1uYXYtaXRlbSwgW2RhdGEtbGlnaHRib3hdXCIpJykub24oJ2NsaWNrJywgdGhpcy5vbkhhc2hDbGlja0hhbmRsZXIpO1xyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuICAgICAgICAvLyBTY3JvbGwuaXNDdXN0b21TY3JvbGwgPSAkKCcjd3BicycpLmRhdGEoJ3Njcm9sbGJhcicpO1xyXG5cclxuICAgICAgICBTY3JvbGwuaGVhZGVySGVpZ2h0ID0gNzA7XHJcbiAgICAgICAgU2Nyb2xsLmluc3RhbmNlID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZWRQYXRoID0gd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lO1xyXG4gICAgICAgIHRoaXMudGFyZ2V0ID0gJCgnW2RhdGEtcGF0aD1cIicgKyB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyAnXCJdJyk7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC53aW5kb3dIZWlnaHQgPSB3aW5kb3cuaW5uZXJIZWlnaHQ7XHJcbiAgICAgICAgU2Nyb2xsLmhlYWRlckhlaWdodCA9ICQoJyNuYXZiYXInKS5oZWlnaHQoKTtcclxuICAgICAgICBTY3JvbGwubWF4U2Nyb2xsID0gJCgnI21haW4nKS5vdXRlckhlaWdodCgpIC0gU2Nyb2xsLndpbmRvd0hlaWdodCArIFNjcm9sbC5oZWFkZXJIZWlnaHQ7XHJcblxyXG4gICAgICAgIHRoaXMuYmFja2dyb3VuZHMgPSB0aGlzLmJ1aWxkQmFja2dyb3VuZHMoKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuc2F2ZUNhY2hlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOiBtZW1iZXItb3JkZXJpbmdcclxuICAgIHB1YmxpYyBzdGF0aWMgc2Nyb2xsVG9QYXRoKGZhc3Q/OiBib29sZWFuKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKCdbZGF0YS1wYXRoPVwiJyArIHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArICdcIl0nKTtcclxuXHJcbiAgICAgICAgaWYgKCR0YXJnZXRbMF0pIHtcclxuICAgICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkdGFyZ2V0LCAwLCAwKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgb25TdGF0ZSgpOiBib29sZWFuIHtcclxuICAgICAgICBpZiAoISF0aGlzLmNoYW5naW5nUGF0aCkgeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICByZXR1cm4gU2Nyb2xsLnNjcm9sbFRvUGF0aCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdG9wKCk6IHZvaWQge1xyXG4gICAgICAgIFNjcm9sbC5kaXNhYmxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGxvYWQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zZWN0aW9ucyA9ICQoJ1tkYXRhLXNjcm9sbF0nKTtcclxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xyXG4gICAgICAgICR3aW5kb3cub2ZmKCcuc2Nyb2xsaW5nJykub24oJ3Njcm9sbC5zY3JvbGxpbmcnLCAoKSA9PiB0aGlzLm9uU2Nyb2xsKCkpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhcnQoKTogdm9pZCB7XHJcbiAgICAgICAgU2Nyb2xsLmVuYWJsZSgpO1xyXG4gICAgICAgIFNjcm9sbC5pbnN0YW5jZS5vblNjcm9sbCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FjaGUgPSB7fTtcclxuICAgICAgICAkd2luZG93Lm9mZignLnNjcm9sbGluZycpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHByaXZhdGUgb25IYXNoQ2xpY2tIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyAgICAgLy8gZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAvLyAgICAgaWYgKCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykpIHtcclxuICAgIC8vICAgICAgICAgbGV0IG9mZnNldCA9IHBhcnNlSW50KCQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JyksIDEwKTtcclxuXHJcbiAgICAvLyAgICAgICAgIGlmICggdHlwZW9mICQoZS50YXJnZXQpLmF0dHIoJ2RhdGEtb2Zmc2V0JykgPT09ICdzdHJpbmcnICkge1xyXG4gICAgLy8gICAgICAgICAgICAgY29uc3Qgb2ZmID0gJChlLnRhcmdldCkuYXR0cignZGF0YS1vZmZzZXQnKS5yZXBsYWNlKCd2aCcsICcnKTtcclxuICAgIC8vICAgICAgICAgICAgIG9mZnNldCA9ICQod2luZG93KS5oZWlnaHQoKSAqIChwYXJzZUludChvZmYsIDEwKSAvIDEwMCk7XHJcbiAgICAvLyAgICAgICAgIH1cclxuXHJcbiAgICAvLyAgICAgICAgIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQoJChlLmN1cnJlbnRUYXJnZXQuaGFzaCksIG9mZnNldCk7XHJcbiAgICAvLyAgICAgfSBlbHNlIHtcclxuICAgIC8vICAgICAgICAgU2Nyb2xsLnNjcm9sbFRvRWxlbWVudCgkKGUuY3VycmVudFRhcmdldC5oYXNoKSk7XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBidWlsZEJhY2tncm91bmRzKCk6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kIH0ge1xyXG4gICAgICAgIGxldCBiZ3MgPSB7fTtcclxuICAgICAgICAkKCdbZGF0YS1iZy1jb21wb25lbnRdJykudG9BcnJheSgpLmZvckVhY2goKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkYmdFbCA9ICQoZWwpO1xyXG4gICAgICAgICAgICBsZXQgYmdOYW1lID0gJGJnRWwuZGF0YSgnYmctY29tcG9uZW50Jyk7XHJcbiAgICAgICAgICAgIGxldCBiZ09wdGlvbnMgPSAkYmdFbC5kYXRhKCdvcHRpb25zJyk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY29tcG9uZW50c1tiZ05hbWVdICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYmcgPSBuZXcgY29tcG9uZW50c1tiZ05hbWVdKCRiZ0VsLCBiZ09wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgYmcuaWQgPSBlbC5pZDtcclxuICAgICAgICAgICAgICAgIGJnc1tlbC5pZF0gPSBiZztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBjb21wb25lbnQgYXZhaWxhYmxlIScsIGJnTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhiZ3MsICdCR1MgU0NST0xMJyk7XHJcbiAgICAgICAgcmV0dXJuIGJncztcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gaWYgKCF0aGlzLmVsZW1lbnRzKSB7IHJldHVybjsgfVxyXG4gICAgICAgIGNvbnN0IGFuaW1hdGlvbnM6IEFycmF5PElBbmltYXRpb25DYWNoZUl0ZW0+ID0gW107XHJcbiAgICAgICAgY29uc3QgbWFyZ2luID0gMCA7XHJcblxyXG4gICAgICAgIC8vIGxldCBzZWN0aW9uczogQXJyYXk8SVNjcm9sbGluZ0RhdGE+ID0gW107XHJcbiAgICAgICAgLy8gaWYgKHRoaXMuc2VjdGlvbnMpIHtcclxuXHJcbiAgICAgICAgLy8gICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zZWN0aW9ucy5sZW5ndGg7ICsraSkge1xyXG5cclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0ICRlbDogSlF1ZXJ5ID0gdGhpcy5zZWN0aW9ucy5lcShpKTtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnN0IHJvbGUgPSAkZWwuZGF0YSgnc2Nyb2xsJyk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0b3AgPSAkZWwub2Zmc2V0KCkudG9wO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgaGVpZ2h0ID0gJGVsLm91dGVySGVpZ2h0KCk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkZWxheSA9ICRlbC5kYXRhKCdkZWxheScpIHx8IDA7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCB0aXRsZSA9ICRlbC5kYXRhKCd0aXRsZScpIHx8IGZhbHNlO1xyXG4gICAgICAgIC8vICAgICAgICAgY29uc3QgcGF0aCA9ICRlbC5kYXRhKCdwYXRoJykgfHwgZmFsc2U7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zdCBkYXRhOiBJU2Nyb2xsaW5nRGF0YSA9IHtcclxuICAgICAgICAvLyAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAvLyAgICAgICAgICAgICByb2xlOiByb2xlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHRvcDogdG9wLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGhlaWdodDogaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGJvdHRvbTogdG9wICsgaGVpZ2h0LFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIHBhdGg6IHBhdGgsXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgdGl0bGU6IHRpdGxlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgICRjaGlsZDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZEhlaWdodDogJGVsLmNoaWxkcmVuKCkuZmlyc3QoKS5oZWlnaHQoKSxcclxuICAgICAgICAvLyAgICAgICAgICAgICBjaGlsZHJlbjoge30sXHJcbiAgICAgICAgLy8gICAgICAgICAgICAgc2hvd246ICRlbC5kYXRhKCdzaG93bicpIHx8IGZhbHNlLFxyXG4gICAgICAgIC8vICAgICAgICAgICAgIGRlbGF5OiBkZWxheSxcclxuICAgICAgICAvLyAgICAgICAgIH07XHJcblxyXG4gICAgICAgIC8vICAgICAgICAgc2VjdGlvbnMucHVzaChkYXRhKTtcclxuICAgICAgICAvLyAgICAgICAgICRlbC5kYXRhKCdjYWNoZScsIGkpO1xyXG4gICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgLy8gfVxyXG5cclxuXHJcbiAgICAgICAgJCgnW2RhdGEtYW5pbWF0aW9uXScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XHJcbiAgICAgICAgICAgIGFuaW1hdGlvbnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiB0eXBlb2YgJGVsLmRhdGEoJ3N0YXJ0JykgIT09ICd1bmRlZmluZWQnID8gJGVsLmRhdGEoJ3N0YXJ0JykgOiAwLjEsXHJcbiAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wIC0gbWFyZ2luLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAkZWwub3V0ZXJIZWlnaHQoKSxcclxuICAgICAgICAgICAgICAgIGRvbmU6ICRlbC5oYXNDbGFzcygnYW5pbWF0ZWQnKSxcclxuICAgICAgICAgICAgICAgIHR5cGU6ICRlbC5kYXRhKCdhbmltYXRpb24nKSxcclxuICAgICAgICAgICAgICAgIGRlbGF5OiAkZWwuZGF0YSgnZGVsYXknKSB8fCBudWxsLFxyXG4gICAgICAgICAgICAgICAgdW5jYWNoZTogJGVsLmRhdGEoJ3VuY2FjaGUnKSxcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudDogJGVsLmRhdGEoJ2NvbXAnKSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgY29uc3QgcGFyYWxsYXhlczogQXJyYXk8SVBhcmFsbGF4Q2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLXBhcmFsbGF4XScpLmVhY2goKGk6IG51bWJlciwgZWw6IEVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJCg8SFRNTEVsZW1lbnQ+ZWwpO1xyXG4gICAgICAgICAgICBjb25zdCBwID0gJGVsLmRhdGEoJ3BhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgIHBhcmFsbGF4ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAkZWw6ICRlbCxcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiAwLFxyXG4gICAgICAgICAgICAgICAgeTogJGVsLm9mZnNldCgpLnRvcCxcclxuICAgICAgICAgICAgICAgIGhlaWdodDogJGVsLm91dGVySGVpZ2h0KCksXHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlb2YgcCA9PT0gJ3N0cmluZycgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIHNoaWZ0OiB0eXBlb2YgcCA9PT0gJ251bWJlcicgPyBwIDogbnVsbCxcclxuICAgICAgICAgICAgICAgIGRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgJGNoaWxkOiAkZWwuY2hpbGRyZW4oKS5maXJzdCgpLFxyXG4gICAgICAgICAgICAgICAgY2hpbGRIZWlnaHQ6ICRlbC5jaGlsZHJlbigpLmZpcnN0KCkuaGVpZ2h0KCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgYmFja2dyb3VuZHM6IEFycmF5PElCYWNrZ3JvdW5kQ2FjaGVJdGVtPiA9IFtdO1xyXG4gICAgICAgICQoJ1tkYXRhLWJhY2tncm91bmRdJykuZWFjaCgoaTogbnVtYmVyLCBlbDogRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCAkZWwgPSAkKGVsKTtcclxuICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZERhdGEgPSAkZWwuZGF0YSgnYmFja2dyb3VuZCcpO1xyXG4gICAgICAgICAgICBjb25zdCBicmVha3BvaW50cyA9IGJhY2tncm91bmREYXRhLmJyZWFrcG9pbnRzIHx8IFsnZGVza3RvcCcsICd0YWJsZXQnLCAncGhvbmUnXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChicmVha3BvaW50cy5pbmRleE9mKGJyZWFrcG9pbnQudmFsdWUpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5iYWNrZ3JvdW5kc1tiYWNrZ3JvdW5kRGF0YS5pZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ3RoZXJlXFwncyBubyBiYWNrZ3JvdW5kIHdpdGggaWQ9JyArIGJhY2tncm91bmREYXRhLmlkICsgJyEnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZHMucHVzaCgkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbDogJGVsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAkZWwub2Zmc2V0KCkudG9wLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICRlbC5vdXRlckhlaWdodCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydDogMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhcmtlbkRlbGF5OiAwLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIGJhY2tncm91bmREYXRhIHx8IHt9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmNhY2hlLmFuaW1hdGlvbnMgPSBhbmltYXRpb25zO1xyXG4gICAgICAgIHRoaXMuY2FjaGUucGFyYWxsYXhlcyA9IHBhcmFsbGF4ZXM7XHJcbiAgICAgICAgdGhpcy5jYWNoZS5iYWNrZ3JvdW5kcyA9IGJhY2tncm91bmRzO1xyXG4gICAgICAgIC8vIHRoaXMuY2FjaGUuc2VjdGlvbnMgPSBzZWN0aW9ucztcclxuXHJcblxyXG5cclxuICAgICAgICB0aGlzLm9uU2Nyb2xsKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uU2Nyb2xsID0gKCk6IHZvaWQgPT4ge1xyXG5cclxuICAgICAgICBpZiAoU2Nyb2xsLmRpc2FibGVkIHx8ICRib2R5Lmhhc0NsYXNzKCdpcy1hc2lkZS1vcGVuJykpIHsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgIGNvbnN0IHNUID0gd2luZG93LnBhZ2VZT2Zmc2V0IHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxUb3AgfHwgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgfHwgMDtcclxuICAgICAgICBjb25zdCB3aW5kb3dIZWlnaHQgPSBTY3JvbGwud2luZG93SGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcmVlbkNlbnRlcjogbnVtYmVyID0gc1QgKyBTY3JvbGwud2luZG93SGVpZ2h0ICogMC4zMztcclxuICAgICAgICBjb25zdCBoZWFkZXJIZWlnaHQgPSBTY3JvbGwuaGVhZGVySGVpZ2h0O1xyXG4gICAgICAgIGNvbnN0IHNjcm9sbGVuZCA9ICQoJyNtYWluJykub3V0ZXJIZWlnaHQoKSAtIHdpbmRvdy5pbm5lckhlaWdodCAtIDI7XHJcbiAgICAgICAgY29uc3QgcGFnZUhlYWRlciA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSAoU2Nyb2xsLmhlYWRlckhlaWdodCAqIDIpIDogMDtcclxuICAgICAgICBjb25zdCBiYWNrZ3JvdW5kcyA9ICQoJyNwYWdlLWhlYWRlcicpLmxlbmd0aCA+IDAgPyAkKCcjcGFnZS1oZWFkZXInKS5vZmZzZXQoKS50b3AgLSBTY3JvbGwuaGVhZGVySGVpZ2h0IDogMDtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9wID0gc1Q7XHJcbiAgICAgICAgdGhpcy5zY3JvbGxDYWNoZVt3aW5kb3cubG9jYXRpb24ucGF0aG5hbWVdID0gc1Q7XHJcblxyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC13aW5kb3ctaGVpZ2h0Jywgc1QgPiB3aW5kb3dIZWlnaHQgLSAxMDApO1xyXG4gICAgICAgICRib2R5LnRvZ2dsZUNsYXNzKCdpcy1zY3JvbGxlZC1uYXZiYXInLCBzVCA+IDEwMCk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbGVkJywgc1QgPiAwKTtcclxuICAgICAgICAkYm9keS50b2dnbGVDbGFzcygnaXMtdHJhaWxlci1zY3JvbGxlZCcsIHNUID4gcGFnZUhlYWRlcik7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLWJhY2tncm91bmRzLXNjcm9sbGVkJywgc1QgPiBiYWNrZ3JvdW5kcyk7XHJcbiAgICAgICAgJGJvZHkudG9nZ2xlQ2xhc3MoJ2lzLXNjcm9sbC1lbmQnLCBzVCA+PSBzY3JvbGxlbmQpO1xyXG5cclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9uczpcclxuICAgICAgICBpZiAodGhpcy5jYWNoZS5hbmltYXRpb25zICYmIHRoaXMuY2FjaGUuYW5pbWF0aW9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5jYWNoZS5hbmltYXRpb25zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtOiBJQW5pbWF0aW9uQ2FjaGVJdGVtID0gdGhpcy5jYWNoZS5hbmltYXRpb25zW2ldO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeVRvcDogbnVtYmVyID0gc1Q7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFpdGVtLmRvbmUgJiYgaXRlbVkgPD0geUJvdHRvbSAmJiBpdGVtWSArIGl0ZW1IZWlnaHQgPj0gc1QpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5hZGRDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHF1aWNrOiBib29sZWFuID0geVRvcCA+PSBpdGVtWSArIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uY29tcG9uZW50ICYmIGl0ZW0udHlwZSA9PT0gJ3RvZ2dsZScgJiYgdHlwZW9mIGl0ZW0uY29tcG9uZW50WydlbmFibGUnXSA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtLmNvbXBvbmVudFsnZW5hYmxlJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFuaW1hdGUoaXRlbSwgaXRlbS4kZWwsIGl0ZW0udHlwZSwgaXRlbS5kZWxheSwgcXVpY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoISFpdGVtLmRvbmUgJiYgaXRlbS5jb21wb25lbnQgJiYgaXRlbS50eXBlID09PSAndG9nZ2xlJyAmJiAoaXRlbVkgPiB5Qm90dG9tIHx8IGl0ZW1ZICsgaXRlbUhlaWdodCA8IHlUb3ApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coaXRlbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBpdGVtLmNvbXBvbmVudFsnZGlzYWJsZSddID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0uY29tcG9uZW50WydkaXNhYmxlJ10oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5kb25lID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udW5jYWNoZSAmJiBpdGVtLmRvbmUgJiYgKHNUIDw9IGl0ZW1ZIC0gd2luZG93SGVpZ2h0IHx8IHNUID49IGl0ZW1ZICsgd2luZG93SGVpZ2h0ICkpIHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLmRvbmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaXRlbS4kZWwuZmluZCgnLnVuY2FjaGVkJykubGVuZ3RoID4gMCkgeyBpdGVtLiRlbC5maW5kKCcudW5jYWNoZWQnKS5yZW1vdmVBdHRyKCdzdHlsZScpOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0uJGVsLmF0dHIoJ2RhdGEtdW5jYWNoZScpKSB7IGl0ZW0uJGVsLnJlbW92ZUF0dHIoJ3N0eWxlJyk7IH1cclxuICAgICAgICAgICAgICAgICAgICBpdGVtLiRlbC5yZW1vdmVDbGFzcygnYW5pbWF0ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIC8vIHBhcmFsbGF4ZXM6XHJcbiAgICAgICAgaWYgKHRoaXMuY2FjaGUucGFyYWxsYXhlcyAmJiB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoID4gMCAmJiBicmVha3BvaW50LmRlc2t0b3ApIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNhY2hlLnBhcmFsbGF4ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGFyYWxsYXgodGhpcy5jYWNoZS5wYXJhbGxheGVzW2ldLCBzVCwgd2luZG93SGVpZ2h0LCAtaGVhZGVySGVpZ2h0KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICAvL2Jnc1xyXG4gICAgICAgIGlmICh0aGlzLmNhY2hlLmJhY2tncm91bmRzKSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCB3aW5kb3dDZW50ZXI6IG51bWJlciA9IDAuNSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgLy8gY29uc3Qgd2luZG93Q2VudGVyOiBudW1iZXIgPSAwICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBsZXQgYmdzVG9TaG93ID0gW107XHJcbiAgICAgICAgICAgIGxldCBiZ3NUb0hpZGUgPSBbXTtcclxuXHJcblxyXG4gICAgICAgICAgICB0aGlzLmNhY2hlLmJhY2tncm91bmRzLmZvckVhY2goKGl0ZW06IElCYWNrZ3JvdW5kQ2FjaGVJdGVtLCBpbmRleCkgPT4ge1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtWTogbnVtYmVyID0gIXRoaXMuaWdub3JlQ2FjaGUgPyBpdGVtLnkgOiBpdGVtLiRlbC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpdGVtSGVpZ2h0OiBudW1iZXIgPSAhdGhpcy5pZ25vcmVDYWNoZSA/IGl0ZW0uaGVpZ2h0IDogaXRlbS4kZWwub3V0ZXJIZWlnaHQoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGl0ZW1Cb3R0b206IG51bWJlciA9IGl0ZW1ZICsgaXRlbUhlaWdodDtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IHNUICsgaXRlbS5zdGFydCAqIHdpbmRvd0hlaWdodCA6IHdpbmRvd0NlbnRlcjtcclxuICAgICAgICAgICAgICAgIC8vIGNvbnN0IHlDZW50ZXIgPSAodHlwZW9mIGl0ZW0uc3RhcnQgIT09ICd1bmRlZmluZWQnKSA/IGl0ZW0uc3RhcnQgKiB3aW5kb3dIZWlnaHQgOiB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgYmFja2dyb3VuZCA9IHRoaXMuYmFja2dyb3VuZHNbaXRlbS5pZF07XHJcbiAgICAgICAgICAgICAgICBjb25zdCBkZWxheSA9IHR5cGVvZiBpdGVtLmRlbGF5ICE9PSAndW5kZWZpbmVkJyA/IGl0ZW0uZGVsYXkgOiAwLjE7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50YWdlID0gLSAoaXRlbVkgLSB5Q2VudGVyKSAvIGl0ZW1IZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmFja2dyb3VuZFF1aWNrU2V0dXAgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50ID0gJGJvZHkuaGFzQ2xhc3MoJ2lzLXRyYWlsZXItc2Nyb2xsZWQnKSA/IHNUICsgd2luZG93SGVpZ2h0ID49IGl0ZW1ZICYmIGl0ZW1ZICsgaXRlbUhlaWdodCA+PSBzVCA6IGl0ZW1ZIC0gc1QgPD0gd2luZG93Q2VudGVyICYmIGl0ZW1Cb3R0b20gLSBzVCA+PSB3aW5kb3dDZW50ZXI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY2FjaGUuYmFja2dyb3VuZHMubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFiYWNrZ3JvdW5kLnNob3duKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQuYW5pbWF0aW9uSW4oZmFsc2UsIDIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kUXVpY2tTZXR1cCA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS5zaG93biA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYmFja2dyb3VuZC5zaG93bikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5hbmltYXRpb25JbihmYWxzZSwgZGVsYXkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRRdWlja1NldHVwID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC51cGRhdGUocGVyY2VudGFnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZC5zZXRTdGVwKGl0ZW0uc3RlcCwgYmFja2dyb3VuZFF1aWNrU2V0dXApO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpdGVtLmRhcmtlbikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kLmRhcmtlbihpdGVtWSA8PSB5Q2VudGVyIC0gd2luZG93SGVpZ2h0ICogaXRlbS5kYXJrZW5EZWxheSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJnc1RvU2hvdy5wdXNoKGl0ZW0uaWQpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghIWl0ZW0uc2hvd24pIHtcclxuICAgICAgICAgICAgICAgICAgICBiZ3NUb0hpZGUucHVzaChpdGVtLmlkKTtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtLnNob3duID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGlmIChiZ3NUb0hpZGUubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICBiZ3NUb0hpZGUuZm9yRWFjaCgoYmdJRCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChiZ3NUb1Nob3cuaW5kZXhPZihiZ0lEKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5iYWNrZ3JvdW5kc1tiZ0lEXS5hbmltYXRpb25PdXQoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmJhY2tncm91bmRzW2JnSURdLnNob3duPSBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAvLyBQcm9ncmVzc2Jhci51cGRhdGUoc1QpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFuaW1hdGUoZGF0YTogSUFuaW1hdGlvbkNhY2hlSXRlbSwgJGVsOiBKUXVlcnksIHR5cGU6IHN0cmluZywgZGVsYXk6IG51bWJlciA9IDAuMSBhcyBudW1iZXIsIHF1aWNrPzogYm9vbGVhbiwgdW5jYWNoZT86IGJvb2xlYW4pOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgdGltZSA9ICFxdWljayA/IC42IDogMDtcclxuXHJcbiAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWRlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAua2lsbFR3ZWVuc09mKCRlbCwgeyBvcGFjaXR5OiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLCB7IG9wYWNpdHk6IDAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoJGVsLmRhdGEoJ3VuY2FjaGUnKSA9PT0gJycpIHtcclxuICAgICAgICAgICAgICAgICAgICAkZWwuYWRkQ2xhc3MoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVVcCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeTogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB5OiA0MCB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZHVyYXRpb246IHRpbWUsIG9wYWNpdHk6IDEsIHk6IDAsIGVhc2U6ICdzaW5lJywgZGVsYXk6IGRlbGF5IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZURvd24nOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHk6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeTogLTEwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBkdXJhdGlvbjogdGltZSwgb3BhY2l0eTogMSwgeTogMCwgZWFzZTogJ3NpbmUnLCBkZWxheTogZGVsYXkgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2ZhZGVSaWdodCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZigkZWwsIHsgb3BhY2l0eTogdHJ1ZSwgeDogdHJ1ZSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBvcGFjaXR5OiAwLCB4OiAtMTAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnZmFkZUxlZnQnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsLCB7IG9wYWNpdHk6IHRydWUsIHg6IHRydWUgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbygkZWwsIHsgb3BhY2l0eTogMCwgeDogMTAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGR1cmF0aW9uOiB0aW1lLCBvcGFjaXR5OiAxLCB4OiAwLCBlYXNlOiAnc2luZScsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaVRhYnMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgbFRleHQgPSAkZWwuZmluZCgnc3BhbjpmaXJzdC1jaGlsZCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgclRleHQgPSAkZWwuZmluZCgnc3BhbjpsYXN0LWNoaWxkJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8obFRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJzUwJScsIG9wYWNpdHk6IDAgfSwgeyB4OiAnMCUnLCBvcGFjaXR5OiAxIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oclRleHQsIHsgZHVyYXRpb246IDAuNSwgeDogJy01MCUnLCBvcGFjaXR5OiAwIH0sIHsgeDogJzAlJywgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2VsZW1lbnRzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbC5maW5kKCdbZGF0YS12aWV3LXRhYl0nKSwgeyBkdXJhdGlvbjogMSwgeTogJzEwMCUnIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICB5OiAnMCUnLCBzdGFnZ2VyOiAwLjIsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcuaXRlbV9fdGFicycpLCB7IGR1cmF0aW9uOiAxLCBvdmVyZmxvdzogJ3Vuc2V0JyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICBcclxuICAgICAgICAgICAgY2FzZSAncGVyY2VudEJveCc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXIgPSBwYXJzZUludCgkZWwuZmluZCgnLmpzLWNvdmVyLW51bScpLnRleHQoKS5zcGxpdCgnJScpWzBdLCAxMCkgLyAxMDA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZXZlbCA9ICRlbC5maW5kKCcuanMtY292ZXItcGVyY2VudCcpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGxldmVsLCAxLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVk6IDB9LCB7IHNjYWxlWTogcGVyfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdmYWN0JzpcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZlRleHQgPSAkZWwuZmluZCgnLmZhY3RfX3RleHQgc3BhbicpLFxyXG4gICAgICAgICAgICAgICAgICAgIHNwbGl0RlR4dCA9IG5ldyBTcGxpdFRleHQoZlRleHQsIHsgdHlwZTogJ3dvcmRzLCBjaGFycyd9KSxcclxuICAgICAgICAgICAgICAgICAgICBmSW1nID0gJGVsLmZpbmQoJy5mYWN0X19pbWFnZS13cmFwJyksXHJcbiAgICAgICAgICAgICAgICAgICAgZkFyciA9ICRlbC5maW5kKCcuZmFjdF9faWNvbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAudGltZWxpbmUoKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oZkFyciwgeyBkdXJhdGlvbjogMSwgcm90YXRlOiA5MCB9LCB7IHJvdGF0ZTogMCwgZGVsYXk6IDAuNSB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oc3BsaXRGVHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtNSB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDEgfSwgJy09MC44JylcclxuICAgICAgICAgICAgICAgICAgICAuZnJvbVRvKGZJbWcsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjk1IH0sIHsgb3BhY2l0eTogMSwgc2NhbGU6IDEgfSwgJy09MC41Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdsZWFkJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0ID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGxpbmVzJywgbGluZXNDbGFzczogJ2xpbmUnIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGluZXMgPSAkZWwuZmluZCgnLmxpbmUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJChsaW5lc1tpXSkuYWZ0ZXIoJzxicj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAkKGxpbmVzW2ldKS5hcHBlbmQoJzxzcGFuIGNsYXNzPVwibGluZV9fYmdcIj48L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oc3BsaXQud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjEsIGRlbGF5OiAwLjQgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKCRlbC5maW5kKCcubGluZV9fYmcnKSwgeyBkdXJhdGlvbjogMC43NSwgc2NhbGVYOiAxLCBzdGFnZ2VyOiAwLjF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3NjYWxlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMSwgc2NhbGVYOiAwfSx7c2NhbGVYOiAxLCBvcGFjaXR5OiAxLCBkZWxheTogZGVsYXl9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHNwbGl0SCA9IG5ldyBTcGxpdFRleHQoJGVsLmNoaWxkcmVuKCksIHsgdHlwZTogJ3dvcmRzLCBjaGFycycgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhzcGxpdEguY2hhcnMsIHsgZHVyYXRpb246IDEsIHNjYWxlWDogMCwgb3BhY2l0eTogMCB9LCB7IHNjYWxlWDogMSwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2NoYXJzLXNpbXBsZSc6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdEgyID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMsIGNoYXJzJyB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0SDIuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiAwLjA1IH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHMtc2ltcGxlJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IHdvcmRzID0gbmV3IFNwbGl0VGV4dCgkZWwuY2hpbGRyZW4oKSwgeyB0eXBlOiAnd29yZHMnIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RhZ2dlciA9ICRlbC5kYXRhKCdzdGFnZ2VyJykgPyAkZWwuZGF0YSgnc3RhZ2dlcicpIDogMC4yO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8od29yZHMud29yZHMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBzdGFnZ2VyOiBzdGFnZ2VyfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbWFnZXMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJGVsLmZpbmQoJ2ltZycpLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCBzY2FsZTogMC45NSB9LCB7IG9wYWNpdHk6IDEsIHNjYWxlOiAxLCBzdGFnZ2VyOiAwLjIgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdoZXJvJzpcclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hcCA9ICRlbC5maW5kKCdbZGF0YS1pdGVtPVwiMFwiXSAuanMtbWFwJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvRWwgPSAkZWwuZmluZCgnW2RhdGEtY2FwdGlvbj1cIjBcIl0gLmpzLWVsJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBoZXJvQ2FwdGlvbiA9ICRlbC5maW5kKCdbZGF0YS1jYXB0aW9uPVwiMFwiXScpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgaGVyb05hdiA9ICRlbC5maW5kKCcuanMtbmF2aWdhdGlvbicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFttYXAsIGhlcm9FbCwgaGVyb05hdl0sIHsgb3BhY2l0eTogMH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKG1hcCwgMS41LCB7ZHVyYXRpb246IDEuNSwgb3BhY2l0eTogMCwgc2NhbGU6IDAuODUgfSwgeyBvcGFjaXR5OiAxLCBzY2FsZTogMSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hcC5yZW1vdmVBdHRyKCdzdHlsZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAudG8oaGVyb0NhcHRpb24sIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDAuNSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9DYXB0aW9uLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlcm9DYXB0aW9uLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhoZXJvRWwsIDEsIHtkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeDogLTIwfSwge29wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAxLjI1LCBzdGFnZ2VyOiAwLjIsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50byhoZXJvTmF2LCAxLCB7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiAxLjUsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZXJvRWwucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGVsLmFkZENsYXNzKCdpcy1yZWFkeScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAncXVvdGUnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgJHF1b3RlID0gJGVsLmZpbmQoJy5qcy1xdW90ZS13b3JkcycpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgJGF1dGhvciA9ICRlbC5maW5kKCcuanMtcXVvdGUtYXV0aG9yJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCAkbGluZSA9ICRlbC5maW5kKCdocicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KFskcXVvdGUsICRlbCwgJGF1dGhvcl0sIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjaGlsZCA9ICRxdW90ZS5jaGlsZHJlbigpO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRRdW90ZSA9IG5ldyBTcGxpdFRleHQoJHF1b3RlLCB7IHR5cGU6ICd3b3JkcycgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gRk9SIFVOQ0FDSEUgT1BUSU9OIE9GIEFOSU1BVElPTiBRVU9URVxyXG4gICAgICAgICAgICAgICAgLy8gZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0UXVvdGUud29yZHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBzcGxpdFF1b3RlLndvcmRzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC50aW1lbGluZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0b1JlbW92ZUNoaWxkcmVuOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICAuc2V0KCRxdW90ZSwgeyBvcGFjaXR5OiAxIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbyhjaGlsZCwgMC41LCB7IG9wYWNpdHk6IDAgfSwgeyBvcGFjaXR5OiAxLCBlYXNlOiAncG93ZXIzJyB9LCAnKz0nICsgZGVsYXkpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb20oc3BsaXRRdW90ZS53b3JkcywgMC41LCB7IG9wYWNpdHk6IDAsIHg6IDgsIHRyYW5zZm9ybU9yaWdpbjogJzAlIDEwMCUnLCBlYXNlOiAncG93ZXIzJywgc3RhZ2dlcjogMC4wNSB9LCAwLjEpXHJcbiAgICAgICAgICAgICAgICAgICAgLmZyb21UbygkYXV0aG9yLCAwLjcsIHsgb3BhY2l0eTogMCwgeDogLTEwIH0sIHsgb3BhY2l0eTogMSwgeDogMCB9LCAnLT0nICsgMC4zKVxyXG4gICAgICAgICAgICAgICAgICAgIC5mcm9tVG8oJGxpbmUsIHsgZHVyYXRpb246IDAuNywgc2NhbGVYOiAwIH0sIHsgc2NhbGVYOiAxIH0sICctPTAuMycpO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnd29yZHMnOlxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0eHQgPSAkZWw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzcGxpdHR4dCA9IG5ldyBTcGxpdFRleHQodHh0LCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0dHh0LmNoYXJzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwIH0sIHsgIG9wYWNpdHk6IDEsIHN0YWdnZXI6IDAuMDUgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCRlbC5kYXRhKCd1bmNhY2hlJykgPT09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIHNwbGl0dHh0LmNoYXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwbGl0dHh0LmNoYXJzW2ldLmNsYXNzTGlzdC5hZGQoJ3VuY2FjaGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3VwRG93bic6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB5U2hpZnQgPSAkZWwuZGF0YSgnc2hpZnQnKSA9PT0gJ3VwJyA/IDEwIDogLTEwO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCB5OiAwLCBvcGFjaXR5OiAxfSwge29wYWNpdHk6IDAuMiwgeTogeVNoaWZ0LCByZXBlYXQ6IDIsIGVhc2U6ICdub25lJywgeW95bzogdHJ1ZSwgZGVsYXk6IGRlbGF5LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZ3NhcC50bygkZWwsIHsgZHVyYXRpb246IDAuNSwgeTogMCwgb3BhY2l0eTogMX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSAnaXRlbXNGYWRlJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gJGVsLmZpbmQoJy4nICsgJGVsLmRhdGEoJ2VsZW1lbnRzJykgKyAnJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBlbGVtZW50c0luID0gJGVsLmRhdGEoJ2VsZW1lbnRzLWluJykgPyAkZWwuZmluZCgnLicgKyAkZWwuZGF0YSgnZWxlbWVudHMtaW4nKSArICcnKSA6IG51bGw7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzdGFnZ2VyRWwgPSAkZWwuZGF0YSgnc3RhZ2dlcicpID8gJGVsLmRhdGEoJ3N0YWdnZXInKSA6IDAuMjtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlbCA9IGRlbGF5ID8gZGVsYXkgOiAwLjI7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzaGlmdFlBeGlzID0gJGVsLmRhdGEoJ3knKSA/IHRydWUgOiBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGVsU2NhbGUgPSAgJGVsLmRhdGEoJ3NjYWxlJykgPyB0cnVlIDogZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoJGVsLCB7IG9wYWNpdHk6IDEgfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldChlbGVtZW50cywgeyBvcGFjaXR5OiAwIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICgkZWwuZGF0YSgndW5jYWNoZScpID09PSAnJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoIGxldCBpID0gMDsgaSA8ICBlbGVtZW50cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50c1tpXS5jbGFzc0xpc3QuYWRkKCd1bmNhY2hlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVsZW1lbnRzSW4pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICggbGV0IGkgPSAwOyBpIDwgIGVsZW1lbnRzSW4ubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnRzSW5baV0uY2xhc3NMaXN0LmFkZCgndW5jYWNoZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZWxTY2FsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCAwLjgsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHNjYWxlOiAwLjl9LCB7IHNjYWxlOiAxLCBvcGFjaXR5OiAxLCBzdGFnZ2VyOiBzdGFnZ2VyRWwsIGRlbGF5OiBkZWxheSB9KTtcclxuICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50c0luLCAwLjgsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5ICsgMC40IH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hpZnRZQXhpcykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhlbGVtZW50cywgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMTB9LCB7IHk6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGVsZW1lbnRzLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMTB9LCB7IHg6IDAsIG9wYWNpdHk6IDEsIHN0YWdnZXI6IHN0YWdnZXJFbCwgZGVsYXk6IGRlbGF5IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICd2aWRlby10ZXh0JzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IHZpZCA9ICRlbC5maW5kKCcuanMtY29sLTY2Jyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBpbmYgPSAkZWwuZmluZCgnLmpzLWNvbC0zMycpO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxIH0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5zZXQoW3ZpZCwgaW5mXSwgeyBvcGFjaXR5OiAwIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLnRvKHZpZCwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMSwgZGVsYXk6IDAuMn0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tVG8oaW5mLCB7IGR1cmF0aW9uOiAxLCBvcGFjaXR5OiAwLCB4OiAtMjB9LCB7IG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjR9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hlYWRpbmcnOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgaFRpdGxlID0gJGVsLmZpbmQoJy5qcy10aXRsZScpLFxyXG4gICAgICAgICAgICAgICAgICAgIGhyID0gJGVsLmZpbmQoJy5qcy1oZWFkaW5nLWhyJyksXHJcbiAgICAgICAgICAgICAgICAgICAgc3ViVGl0bGUgPSAkZWwuZmluZCgnLmpzLXN1YnRpdGxlJykubGVuZ3RoID4gMCA/ICRlbC5maW5kKCcuanMtc3VidGl0bGUnKSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3BsaXRUaXRsZSA9IG5ldyBTcGxpdFRleHQoaFRpdGxlLCB7IHR5cGU6ICd3b3JkcywgY2hhcnMnIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuc2V0KCRlbCwgeyBvcGFjaXR5OiAxfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKHNwbGl0VGl0bGUuY2hhcnMsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAgfSwgeyAgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4wNSB9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKGhyLCB7IGR1cmF0aW9uOiAxLCBzY2FsZVg6IDAgfSwgeyBzY2FsZVg6IDEsIGRlbGF5OiAwLjUgfSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmIChzdWJUaXRsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KHN1YlRpdGxlLCB7IG9wYWNpdHk6IDAsIHk6IDIwfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgZ3NhcC50byhzdWJUaXRsZSwgMC41LCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDEsIHk6IDB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ3RpdGxlRmFkZUluJzpcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlYWQgPSAkZWwuZmluZCgnLmpzLWZpeGVkLXRpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgICBzdWIgPSAkZWwuZmluZCgnLmpzLXN1YicpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgYXJyID0gJGVsLmZpbmQoJy5qcy1hcnInKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb20obGVhZCwgeyBkdXJhdGlvbjogMS41LCBvcGFjaXR5OiAwLCBzY2FsZTogMS4yLCBkZWxheTogMn0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC5mcm9tKHN1YiwgeyBkdXJhdGlvbjogMSwgb3BhY2l0eTogMCwgeTogMzAsIGRlbGF5OiAzLjJ9KTtcclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbShhcnIsIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHk6IDMwLCBkZWxheTogMy43fSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlICdpbnRybyc6XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjdXJ0YWluID0gJGVsLmZpbmQoJy5qcy1jdXJ0YWluJyk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xyXG4gICAgICAgICAgICAgICAgZ3NhcC50byhjdXJ0YWluLCB7IGR1cmF0aW9uOiAzLCBvcGFjaXR5OiAwLCBkZWxheTogMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgICQoJ2h0bWwnKS5hZGRDbGFzcygnaXMtYW5pbWF0ZWQnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgJ2hlYWRlcic6XHJcbiAgICAgICAgICAgICAgICBnc2FwLnNldCgkZWwsIHsgb3BhY2l0eTogMX0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IGh0aW1lID0gJGVsLmZpbmQoJy5qcy10aW1lJyksXHJcbiAgICAgICAgICAgICAgICAgICAgc29jaWFsRCA9ICRlbC5maW5kKCcucGhvbmUtaGlkZSAuc29jaWFsX19pdGVtJyksXHJcbiAgICAgICAgICAgICAgICAgICAgc2hhcmVUZXh0ID0gJGVsLmZpbmQoJy5waG9uZS1oaWRlIC5zb2NpYWxfX3RpdGxlJyksXHJcbiAgICAgICAgICAgICAgICAgICAgaEhyID0gJGVsLmZpbmQoJy5qcy1oZWFkZXItaHInKTtcclxuXHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhbaHRpbWUsIHNoYXJlVGV4dCwgc29jaWFsRF0sIHsgZHVyYXRpb246IDEsIG9wYWNpdHk6IDAsIHg6IC0xMH0sIHsgeDogMCwgb3BhY2l0eTogMSwgc3RhZ2dlcjogMC4xfSk7XHJcbiAgICAgICAgICAgICAgICBnc2FwLmZyb21UbyhoSHIsIHsgc2NhbGVYOiAwfSwgeyBzY2FsZVg6IDF9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcblxyXG4gICAgICAgICAgICBjYXNlICdudW1iZXInOlxyXG4gICAgICAgICAgICAgICAgY29uc3QgbnVtRWwgPSAkZWwuZmluZCgnW2RhdGEtbnVtXScpO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbnVtID0gJGVsLmZpbmQoJ1tkYXRhLW51bV0nKS5kYXRhKCdudW0nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGR1ciA9ICRlbC5kYXRhKCd0aW1lJykgPyAkZWwuZGF0YSgndGltZScpICogMTAwMCA6IDIwMDA7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBudW1UZXh0ID0gJGVsLmZpbmQoJ1tkYXRhLXRleHRdJykubGVuZ3RoID4gMCA/ICRlbC5maW5kKCdbZGF0YS10ZXh0XScpIDogbnVsbDtcclxuICAgICAgICAgICAgICAgIGxldCBmaXhlZCA9IG51bS50b1N0cmluZygpLmluZGV4T2YoJy4nKSA+IC0xID8gbnVtLnRvU3RyaW5nKCkubGVuZ3RoIC0gbnVtLnRvU3RyaW5nKCkuaW5kZXhPZignLicpIC0gMSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgbnVtRWwuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOiBudW1FbC53aWR0aCgpLFxyXG4gICAgICAgICAgICAgICAgICAgICdkaXNwbGF5JzogJ2lubGluZS1ibG9jaydcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGdzYXAuZnJvbVRvKCRlbCwgeyBkdXJhdGlvbjogMC41LCBvcGFjaXR5OiAwfSwgeyBvcGFjaXR5OiAxfSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobnVtVGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KG51bVRleHQsIHsgb3BhY2l0eTogMH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAudG8obnVtVGV4dCwgMSx7ZHVyYXRpb246IDEsIG9wYWNpdHk6IDEsIGRlbGF5OiBkdXIvMTAwMH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIG51bUVsLnByb3AoJ0NvdW50ZXInLCAwKS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICBDb3VudGVyOiBudW0sXHJcbiAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IGR1cixcclxuICAgICAgICAgICAgICAgICAgICBlYXNpbmc6ICdzd2luZycsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcDogKG5vdyk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZml4ZWQgJiYgZml4ZWQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobnVtRWwuZGF0YSgncmVwbGFjZScpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtRWwudGV4dCgobm93LnRvRml4ZWQoZml4ZWQpLnRvU3RyaW5nKCkucmVwbGFjZSgnLicsICcsJykpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtRWwudGV4dChub3cudG9GaXhlZChmaXhlZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtRWwudGV4dChNYXRoLmNlaWwobm93KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oYGFuaW1hdGlvbiB0eXBlIFwiJHt0eXBlfVwiIGRvZXMgbm90IGV4aXN0YCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHBhcmFsbGF4KGl0ZW06IElQYXJhbGxheENhY2hlSXRlbSwgc1Q6IG51bWJlciwgd2luZG93SGVpZ2h0OiBudW1iZXIsIGhlYWRlckhlaWdodDogbnVtYmVyKTogdm9pZCB7XHJcblxyXG4gICAgICAgIGlmIChpdGVtLnNoaWZ0KSB7XHJcblxyXG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xyXG4gICAgICAgICAgICBsZXQgeTogbnVtYmVyID0gaXRlbS55O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcHlCb3R0b206IG51bWJlciA9IHNUICsgKDEgLSBpdGVtLnN0YXJ0KSAqIHdpbmRvd0hlaWdodDtcclxuICAgICAgICAgICAgY29uc3QgcHlUb3A6IG51bWJlciA9IHNUIC0gaXRlbS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjZW50OiBudW1iZXIgPSAoeSAtIHNUICsgaXRlbS5oZWlnaHQgLSBoZWFkZXJIZWlnaHQpIC8gKHdpbmRvd0hlaWdodCArIGl0ZW0uaGVpZ2h0IC0gaGVhZGVySGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIHkgPSBNYXRoLnJvdW5kKHBlcmNlbnQgKiBpdGVtLnNoaWZ0KTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lOiBudW1iZXIgPSAhaXRlbS5kb25lID8gMCA6IDAuNTtcclxuICAgICAgICAgICAgICAgIGl0ZW0uZG9uZSA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YoJGVsKTtcclxuICAgICAgICAgICAgICAgIGdzYXAudG8oJGVsLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IHRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgICAgICAgICByb3VuZFByb3BzOiBbJ3knXSxcclxuICAgICAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKGl0ZW0udHlwZSkge1xyXG4gICAgICAgICAgICBjb25zdCAkZWw6IEpRdWVyeSA9IGl0ZW0uJGVsO1xyXG4gICAgICAgICAgICBjb25zdCAkZWxTdGlja3k6IEpRdWVyeSA9ICRlbC5wYXJlbnQoKS5wYXJlbnQoKTtcclxuICAgICAgICAgICAgY29uc3QgeTogbnVtYmVyID0gaXRlbS55O1xyXG4gICAgICAgICAgICBjb25zdCBweUJvdHRvbTogbnVtYmVyID0gc1QgKyAoMSAtIGl0ZW0uc3RhcnQpICogd2luZG93SGVpZ2h0O1xyXG4gICAgICAgICAgICBjb25zdCBweVRvcDogbnVtYmVyID0gc1QgLSBpdGVtLmhlaWdodDtcclxuICAgICAgICAgICAgY29uc3QgcHlUb3BTdGlja3k6IG51bWJlciA9IHNUIC0gJGVsU3RpY2t5LmhlaWdodCgpO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChpdGVtLnR5cGUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdoZXJvJzpcclxuICAgICAgICAgICAgICAgICAgICBnc2FwLnNldChpdGVtLiRlbCwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB5OiAhYnJvd3Nlci5tb2JpbGUgPyBzVCAqIDAuNSA6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdmaXhlZEltYWdlJzpcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyh5LCBcInlcIiwgc1QsIHB5Qm90dG9tLCB3aW5kb3dIZWlnaHQsd2luZG93SGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSBweVRvcCAmJiB5IDw9IHB5Qm90dG9tKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoISRlbC5oYXNDbGFzcygnaGFzLXBhcmFsbGF4JykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRlbC5hZGRDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRlbC5yZW1vdmVDbGFzcygnaGFzLXBhcmFsbGF4Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlICdjc3MtYW5pbWF0aW9uJzpcclxuICAgICAgICAgICAgICAgICAgICBpZiAoeSA+PSAocHlUb3AgKyBoZWFkZXJIZWlnaHQpICYmIHkgPD0gcHlCb3R0b20pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwuaGFzQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5JykgPyBudWxsIDogaXRlbS4kZWwuYWRkQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbS4kZWwucmVtb3ZlQ2xhc3MoJ2FuaW1hdGlvbi1wbGF5Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSAncmVsYXRpdmVQYXJhbGxheCc6XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgYXZhaWxhYmxlU3BhY2UgPSBpdGVtLmNoaWxkSGVpZ2h0IC0gaXRlbS5oZWlnaHQ7IC8vIHJlc2VydmUgc3BhY2VcclxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXhTaGlmdCA9IE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCBpdGVtLmhlaWdodCArIGhlYWRlckhlaWdodCk7IC8vIE1hdGgubWluKGF2YWlsYWJsZVNwYWNlLCAod2luZG93SGVpZ2h0IC0gZGF0YS5oZWlnaHQpICogMC41ICk7IC8vIGRvIG5vdCBtb3ZlIHRvbyBtdWNoIG9uIGJpZyBzY3JlZW5zXHJcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGVyY2VudCA9IChzVCAtIGl0ZW0ueSArIHdpbmRvd0hlaWdodCkgLyAod2luZG93SGVpZ2h0ICsgaXRlbS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgcG9zWTogc3RyaW5nIHwgbnVtYmVyID0gTWF0aC5yb3VuZCgoMSAtIHBlcmNlbnQpICogbWF4U2hpZnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZIDwgMCA/IDAgOiBwb3NZO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc1kgPSBwb3NZID4gbWF4U2hpZnQgPyBtYXhTaGlmdCA6IHBvc1k7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KGl0ZW0uJGNoaWxkLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IC1wb3NZLFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihgYW5pbWF0aW9uIHR5cGUgXCIke2l0ZW0udHlwZX1cIiBkb2VzIG5vdCBleGlzdGApO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5leHBvcnQgY2xhc3MgU2hhcmUge1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHtcclxuXHJcbiAgICAgICAgU2hhcmUuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGJpbmQoKTogdm9pZCB7XHJcblxyXG5cclxuICAgICAgICAkKCdbZGF0YS1zaGFyZV0nKS5vbignY2xpY2snLCAoZSk6IGJvb2xlYW4gPT4ge1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgd2luV2lkdGggPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW53aWR0aCcpLCAxMCkgfHwgNTIwO1xyXG4gICAgICAgICAgICBsZXQgd2luSGVpZ2h0ID0gcGFyc2VJbnQoJChlLmN1cnJlbnRUYXJnZXQpLmF0dHIoJ2RhdGEtd2luaGVpZ2h0JyksIDEwKSB8fCAzNTA7XHJcbiAgICAgICAgICAgIGxldCB3aW5Ub3AgPSAoc2NyZWVuLmhlaWdodCAvIDIpIC0gKHdpbkhlaWdodCAvIDIpO1xyXG4gICAgICAgICAgICBsZXQgd2luTGVmdCA9IChzY3JlZW4ud2lkdGggLyAyKSAtICh3aW5XaWR0aCAvIDIpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgY3VycmVudFRhcmdldCA9IDxhbnk+ZS5jdXJyZW50VGFyZ2V0O1xyXG4gICAgICAgICAgICBjb25zdCBocmVmID0gY3VycmVudFRhcmdldC5ocmVmO1xyXG4gICAgICAgICAgICBjb25zdCBkYXRhID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3NoYXJlJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PT0gJ2xpbmtlZGluJykge1xyXG4gICAgICAgICAgICAgICAgd2luV2lkdGggPSA0MjA7XHJcbiAgICAgICAgICAgICAgICB3aW5IZWlnaHQgPSA0MzA7XHJcbiAgICAgICAgICAgICAgICB3aW5Ub3AgPSB3aW5Ub3AgLSAxMDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGhyZWYsICdzaGFyZXInICsgZGF0YSwgJ3RvcD0nICsgd2luVG9wICsgJyxsZWZ0PScgKyB3aW5MZWZ0ICsgJyx0b29sYmFyPTAsc3RhdHVzPTAsd2lkdGg9JyArIHdpbldpZHRoICsgJyxoZWlnaHQ9JyArIHdpbkhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4vcmVmZXJlbmNlcy5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCB7IFB1c2hTdGF0ZXMsIFB1c2hTdGF0ZXNFdmVudHMgfSBmcm9tICcuL1B1c2hTdGF0ZXMnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IFNjcm9sbCB9IGZyb20gJy4vU2Nyb2xsJztcclxuaW1wb3J0IHsgUGFnZSwgUGFnZUV2ZW50cyB9IGZyb20gJy4vcGFnZXMvUGFnZSc7XHJcbmltcG9ydCB7IENvbXBvbmVudEV2ZW50cywgQ29tcG9uZW50IH0gZnJvbSAnLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IEJyb3dzZXIsIGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xyXG5pbXBvcnQgeyBMb2FkZXIgfSBmcm9tICcuL0xvYWRlcic7XHJcbmltcG9ydCB7IFdpZGdldHMgfSBmcm9tICcuL3dpZGdldHMvQWxsJztcclxuaW1wb3J0IHsgcGFnZXMsIGNvbXBvbmVudHMgfSBmcm9tICcuL0NsYXNzZXMnO1xyXG5pbXBvcnQgeyBDb3B5IH0gZnJvbSAnLi9Db3B5JztcclxuaW1wb3J0IHsgU2hhcmUgfSBmcm9tICcuL1NoYXJlJztcclxuaW1wb3J0IHsgQVBJIH0gZnJvbSAnLi9BcGknO1xyXG5cclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi9VdGlscyc7XHJcblxyXG5leHBvcnQgbGV0IHNpdGU6IFNpdGU7XHJcbmV4cG9ydCBsZXQgJGRvYzogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICR3aW5kb3c6IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkYm9keTogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0ICRhcnRpY2xlOiBKUXVlcnk7XHJcbmV4cG9ydCBsZXQgJG1haW46IEpRdWVyeTtcclxuZXhwb3J0IGxldCAkcGFnZUhlYWRlcjogSlF1ZXJ5O1xyXG5leHBvcnQgbGV0IHBpeGVsUmF0aW86IG51bWJlcjtcclxuZXhwb3J0IGxldCBkZWJ1ZzogYm9vbGVhbjtcclxuZXhwb3J0IGxldCBlYXNpbmc6IHN0cmluZztcclxuZXhwb3J0IGxldCBsYW5nOiBzdHJpbmc7XHJcbmV4cG9ydCBsZXQgZml4ZWRwb3NpdGlvbjogbnVtYmVyO1xyXG5leHBvcnQgbGV0ICRuYXZiYXI6IEpRdWVyeVxyXG5cclxuLy8gZGVjbGFyZSBsZXQgQ3VzdG9tRWFzZTtcclxuXHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTaXRlIHtcclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogU2l0ZTtcclxuXHJcbiAgICBwcml2YXRlIGN1cnJlbnRQYWdlOiBQYWdlO1xyXG4gICAgcHJpdmF0ZSBwdXNoU3RhdGVzOiBQdXNoU3RhdGVzO1xyXG4gICAgcHJpdmF0ZSBzY3JvbGw6IFNjcm9sbDtcclxuICAgIHByaXZhdGUgbGFzdEJyZWFrcG9pbnQ6IElCcmVha3BvaW50O1xyXG4gICAgcHJpdmF0ZSBsb2FkZXI6IExvYWRlcjtcclxuICAgIC8vIHByaXZhdGUgaXNSZWFkeTogYm9vbGVhbjtcclxuICAgIC8vIHByaXZhdGUgY29tcG9uZW50czogQXJyYXk8Q29tcG9uZW50PiA9IFtdO1xyXG4gICAgLy8gcHJpdmF0ZSAkaGFtYnVyZ2VyOiBKUXVlcnk7XHJcbiAgICAvLyBwcml2YXRlICRwYWdlSGVhZGVyOiBKUXVlcnk7XHJcbiAgICAvLyBwcml2YXRlICRhcnRpY2xlOiBKUXVlcnk7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG5cclxuICAgICAgICBjb25zb2xlLmdyb3VwKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ3NpdGUnKTtcclxuXHJcbiAgICAgICAgU2l0ZS5pbnN0YW5jZSA9IHRoaXM7XHJcbiAgICAgICAgLy8gbGFuZyA9ICQoJ2h0bWwnKS5hdHRyKCdsYW5nJyk7XHJcblxyXG4gICAgICAgIHBpeGVsUmF0aW8gPSB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxO1xyXG4gICAgICAgIGRlYnVnID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5pbmRleE9mKCdkZWJ1ZycpID49IDA7XHJcbiAgICAgICAgLy8gZWFzaW5nID0gQ3VzdG9tRWFzZS5jcmVhdGUoJ2N1c3RvbScsICdNMCwwLEMwLjUsMCwwLjMsMSwxLDEnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBpbml0KCk6IHZvaWQge1xyXG5cclxuICAgICAgICBCcmVha3BvaW50LnVwZGF0ZSgpO1xyXG4gICAgICAgIEJyb3dzZXIudXBkYXRlKCk7XHJcblxyXG4gICAgICAgICRkb2MgPSAkKGRvY3VtZW50KTtcclxuICAgICAgICAkd2luZG93ID0gJCh3aW5kb3cpO1xyXG4gICAgICAgICRib2R5ID0gJCgnYm9keScpO1xyXG4gICAgICAgICRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xyXG4gICAgICAgICRtYWluID0gJCgnI21haW4nKTtcclxuICAgICAgICAkbmF2YmFyID0gJCgnI25hdmJhcicpO1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMgPSBuZXcgUHVzaFN0YXRlcygpO1xyXG4gICAgICAgIHRoaXMucHVzaFN0YXRlcy5vbihQdXNoU3RhdGVzRXZlbnRzLkNIQU5HRSwgdGhpcy5vblN0YXRlKTtcclxuICAgICAgICB0aGlzLnB1c2hTdGF0ZXMub24oUHVzaFN0YXRlc0V2ZW50cy5QUk9HUkVTUywgdGhpcy5vbkxvYWRQcm9ncmVzcyk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuJGhhbWJ1cmdlciA9ICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKTtcclxuICAgICAgICAvLyB0aGlzLiRhcnRpY2xlID0gJCgnI2FydGljbGUtbWFpbicpO1xyXG4gICAgICAgIC8vIHRoaXMuJHBhZ2VIZWFkZXIgPSAkKCcjcGFnZS1oZWFkZXInKS5sZW5ndGggPiAwID8gJCgnI3BhZ2UtaGVhZGVyJykgOiBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLnNjcm9sbCA9IG5ldyBTY3JvbGwoKTtcclxuICAgICAgICB0aGlzLmxvYWRlciA9IG5ldyBMb2FkZXIoJCgnLmpzLWxvYWRlcicpKTtcclxuICAgICAgICB0aGlzLmxvYWRlci5zaG93KCk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSk7XHJcblxyXG5cclxuICAgICAgICBuZXcgQ29weSgpO1xyXG4gICAgICAgIG5ldyBTaGFyZSgpO1xyXG4gICAgICAgIG5ldyBBUEkoKTtcclxuICAgICAgICBBUEkuYmluZCgpO1xyXG4gICAgICAgIC8vIHRoaXMubWVudSA9IG5ldyBNZW51KCQoJy5qcy1tZW51JykpO1xyXG4gICAgICAgIC8vIHRoaXMuY29va2llcyA9IG5ldyBDb29raWVzKCQoJy5qcy1jb29raWVzJykpO1xyXG5cclxuXHJcbiAgICAgICAgUHJvbWlzZS5hbGw8dm9pZD4oW1xyXG4gICAgICAgICAgICB0aGlzLnNldEN1cnJlbnRQYWdlKCksXHJcbiAgICAgICAgICAgIC8vIHRoaXMucHJlbG9hZEFzc2V0cygpLFxyXG4gICAgICAgICAgICBVdGlscy5zZXRSb290VmFycygpLFxyXG4gICAgICAgIF0pLnRoZW4odGhpcy5vblBhZ2VMb2FkZWQpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGRlYnVnKSB7IFV0aWxzLnN0YXRzKCk7IH1cclxuXHJcbiAgICAgICAgJHdpbmRvdy5vbignb3JpZW50YXRpb25jaGFuZ2UnLCAoKSA9PiBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcclxuXHJcbiAgICAgICAgfSwgMTAwKSk7XHJcbiAgICAgICAgJHdpbmRvdy5vbigncmVzaXplJywgKCkgPT4gdGhpcy5vblJlc2l6ZSgpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25SZXNpemUoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIEJyZWFrcG9pbnQudXBkYXRlKCk7XHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCAmJiAhYnJvd3Nlci5tb2JpbGUpIHtcclxuICAgICAgICAgICAgVXRpbHMuc2V0Um9vdFZhcnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHdpZHRoID0gJHdpbmRvdy53aWR0aCgpO1xyXG4gICAgICAgIGNvbnN0IGhlaWdodCA9ICR3aW5kb3cuaGVpZ2h0KCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYW5nZWQgPSAhdGhpcy5sYXN0QnJlYWtwb2ludCB8fCB0aGlzLmxhc3RCcmVha3BvaW50LnZhbHVlICE9PSBicmVha3BvaW50LnZhbHVlO1xyXG4gICAgICAgIHRoaXMubGFzdEJyZWFrcG9pbnQgPSBicmVha3BvaW50O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UGFnZSkge1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLnJlc2l6ZSh3aWR0aCwgaGVpZ2h0LCBicmVha3BvaW50LCBjaGFuZ2VkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHRoaXMuY2FsbEFsbCgncmVzaXplJywgd2lkdGgsIGhlaWdodCwgYnJlYWtwb2ludCwgY2hhbmdlZCk7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIucmVzaXplKHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsLnJlc2l6ZSgpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBwcmVsb2FkQXNzZXRzKCk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgICAgICBsZXQgYXNzZXRzID0gW107XHJcbiAgICAgICAgbGV0IGlsID0gaW1hZ2VzTG9hZGVkKCcucHJlbG9hZC1iZycsIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZDogdHJ1ZSxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKGFzc2V0cyAmJiBhc3NldHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFzc2V0cy5sZW5ndGg7ICsraSkge1xyXG4gICAgICAgICAgICAgICAgaWwuYWRkQmFja2dyb3VuZChhc3NldHNbaV0sIG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBpbC5qcURlZmVycmVkLmFsd2F5cygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gY2hlY2sgaWYgYW55IGNvbXBvbmVudCBoYW5kbGUgb25TdGF0ZSBldmVudFxyXG4gICAgLy8gaWYgbm90LCByZWxvYWQgaHRtbDpcclxuICAgIHByaXZhdGUgb25TdGF0ZSA9ICgpOiB2b2lkID0+IHtcclxuXHJcbiAgICAgICAgLy8gY29uc3Qgc2Nyb2xsaW5nQ2hhbmdlZFN0YXRlID0gdGhpcy5zY3JvbGwub25TdGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IHBhZ2VDaGFuZ2VkU3RhdGUgPSB0aGlzLmN1cnJlbnRQYWdlLm9uU3RhdGUoKTtcclxuXHJcbiAgICAgICAgLy8gaWYgKCFzY3JvbGxpbmdDaGFuZ2VkU3RhdGUgJiYgIW9mZnNjcmVlbkNoYW5nZWRTdGF0ZSAmJiAhcGFnZUNoYW5nZWRTdGF0ZSkge1xyXG4gICAgICAgIGlmICghcGFnZUNoYW5nZWRTdGF0ZSkge1xyXG5cclxuICAgICAgICAgICAgLy8gQW5hbHl0aWNzLnNlbmRQYWdldmlldyh3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUpO1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcHVzaFN0YXRlc0xvYWRQcm9taXNlID0gdGhpcy5wdXNoU3RhdGVzLmxvYWQoKTtcclxuICAgICAgICAgICAgY29uc3QgYW5pbWF0ZU91dFByb21pc2UgPSB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVPdXQoKTtcclxuXHJcbiAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sb2FkZXIuc2hvdygpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2Nyb2xsLnN0b3AoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGFsbCBwcm9taXNlcyBhcnJheTpcclxuICAgICAgICAgICAgY29uc3QgbG9hZGluZ1Byb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IFtcclxuICAgICAgICAgICAgICAgIHB1c2hTdGF0ZXNMb2FkUHJvbWlzZSxcclxuICAgICAgICAgICAgICAgIGFuaW1hdGVPdXRQcm9taXNlLFxyXG4gICAgICAgICAgICBdO1xyXG5cclxuICAgICAgICAgICAgLy8gcmVuZGVyIGh0bWwgd2hlbiBldmVyeXRoaW5nJ3MgcmVhZHk6XHJcbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGxvYWRpbmdQcm9taXNlcykudGhlbih0aGlzLnJlbmRlcik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLy8gZGlzcGxheSBhamF4IHByb2dyZXNzOlxyXG4gICAgcHJpdmF0ZSBvbkxvYWRQcm9ncmVzcyA9IChwcm9ncmVzczogbnVtYmVyKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSAqIHByb2dyZXNzKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIHBhc3MgbG9hZGluZyBwcm9ncmVzcyBmcm9tIHBhZ2UgdG8gcHJlbG9hZGVyOlxyXG4gICAgcHJpdmF0ZSBvblBhZ2VQcm9ncmVzcyA9IChwcm9ncmVzczogbnVtYmVyKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5sb2FkZXIuc2V0KDAuNSArIDAuNSAqIHByb2dyZXNzKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIGRlYWwgd2l0aCBuZXdseSBhZGRlZCBlbGVtZW50c1xyXG4gICAgcHJpdmF0ZSBvblBhZ2VBcHBlbmQgPSAoZWw6IEpRdWVyeSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIFB1c2hTdGF0ZXMuYmluZChlbFswXSk7XHJcbiAgICAgICAgV2lkZ2V0cy5iaW5kKGVsWzBdKTtcclxuICAgICAgICB0aGlzLnNjcm9sbC5sb2FkKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvLyBjYWxsZWQgYWZ0ZXIgbmV3IGh0bWwgaXMgbG9hZGVkXHJcbiAgICAvLyBhbmQgb2xkIGNvbnRlbnQgaXMgYW5pbWF0ZWQgb3V0OlxyXG4gICAgcHJpdmF0ZSByZW5kZXIgPSAoKTogdm9pZCA9PiB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQYWdlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2Uub2ZmKCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFBhZ2UuZGVzdHJveSgpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQYWdlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2Nyb2xsLmRlc3Ryb3koKTtcclxuXHJcbiAgICAgICAgY29uc29sZS5ncm91cEVuZCgpO1xyXG4gICAgICAgIGNvbnNvbGUuZ3JvdXAoKTtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoU3RhdGVzLnJlbmRlcigpO1xyXG4gICAgICAgIHRoaXMuc2V0Q3VycmVudFBhZ2UoKS50aGVuKHRoaXMub25QYWdlTG9hZGVkKTtcclxuICAgICAgICBQdXNoU3RhdGVzLnNldFRpdGxlKCQoJ21ldGFbcHJvcGVydHk9XCJvZzp0aXRsZVwiXScpLmF0dHIoJ2NvbnRlbnQnKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgZGV0ZWN0SG9tZVBhZ2UoKTogdm9pZCB7XHJcbiAgICAgICAgJHBhZ2VIZWFkZXIgPyAkYm9keS5hZGRDbGFzcygnaXMtaG9tZS1wYWdlJykgOiBudWxsO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLyB3aGVuIGN1cnJlbnQgcGFnZSBpcyBsb2FkZWQ6XHJcbiAgICBwcml2YXRlIG9uUGFnZUxvYWRlZCA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAvLyAkYm9keS5yZW1vdmVDbGFzcygnaXMtbm90LXJlYWR5Jyk7XHJcbiAgICAgICAgJGJvZHkucmVtb3ZlQXR0cignY2xhc3MnKTtcclxuICAgICAgICB0aGlzLmxvYWRlci5oaWRlKCk7XHJcbiAgICAgICAgVXRpbHMuZW5hYmxlQm9keVNjcm9sbGluZyhTY3JvbGwuc2Nyb2xsVG9wKTtcclxuICAgICAgICBTY3JvbGwuc2Nyb2xsVG9FbGVtZW50KCRib2R5LCAwLCAwKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlLmFuaW1hdGVJbigpO1xyXG4gICAgICAgICRwYWdlSGVhZGVyID0gJCgnI3BhZ2UtaGVhZGVyJykubGVuZ3RoID4gMCA/ICQoJyNwYWdlLWhlYWRlcicpIDogbnVsbDtcclxuICAgICAgICB0aGlzLmRldGVjdEhvbWVQYWdlKCk7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5zZXROYXZiYXJWaXNpYmlsaXR5KCk7XHJcbiAgICAgICAgLy8gdGhpcy5jb29raWVzLnRyeVRvU2hvdygpO1xyXG4gICAgICAgIFNjcm9sbC5zY3JvbGxUb1BhdGgodHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5zY3JvbGwubG9hZCgpO1xyXG4gICAgICAgIHRoaXMuc2Nyb2xsLnN0YXJ0KCk7XHJcbiAgICAgICAgJCgnYXJ0aWNsZScpLnBhcmVudCgpLmFkZENsYXNzKCdpcy1sb2FkZWQnKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIHJ1biBuZXcgUGFnZSBvYmplY3RcclxuICAgIC8vIChmb3VuZCBieSBgZGF0YS1wYWdlYCBhdHRyaWJ1dGUpXHJcbiAgICAvLyBiaW5kIGl0IGFuZCBzdG9yZSBhcyBjdXJyZW50UGFnZTpcclxuICAgIHByaXZhdGUgc2V0Q3VycmVudFBhZ2UoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgbGV0ICRwYWdlRWw6IEpRdWVyeSA9ICQoJ1tkYXRhLXBhZ2VdJyksXHJcbiAgICAgICAgICAgIHBhZ2VOYW1lOiBzdHJpbmcgPSAkcGFnZUVsLmRhdGEoJ3BhZ2UnKSB8fCAnUGFnZScsXHJcbiAgICAgICAgICAgIHBhZ2VPcHRpb25zOiBPYmplY3QgPSAkcGFnZUVsLmRhdGEoJ29wdGlvbnMnKTtcclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJHBhZ2VFbCwgcGFnZU5hbWUpO1xyXG5cclxuICAgICAgICAvLyBwYWdlIG5vdCBmb3VuZDpcclxuICAgICAgICBpZiAocGFnZU5hbWUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBpZiAocGFnZU5hbWUgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIFwiJXNcIiBpbiBQYWdlcyEnLCBwYWdlTmFtZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcGFnZU5hbWUgPSAnUGFnZSc7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBtb3JlIHRoYW4gb25lIGRhdGEtcGFnZTpcclxuICAgICAgICBpZiAoJHBhZ2VFbC5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybignT25seSBvbmUgW2RhdGEtcGFnZV0gZWxlbWVudCwgcGxlYXNlIScpO1xyXG5cclxuICAgICAgICAvLyBwYWdlIG5vdCBkZWZpbmVkIGluIGh0bWw6XHJcbiAgICAgICAgfSBlbHNlIGlmICgkcGFnZUVsLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICAkcGFnZUVsID0gJCgkKCcjbWFpbicpLmZpbmQoJ2FydGljbGUnKVswXSB8fCAkKCcjbWFpbicpLmNoaWxkcmVuKCkuZmlyc3QoKVswXSk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcblxyXG4gICAgICAgIC8vIGNyZWF0ZSBQYWdlIG9iamVjdDpcclxuICAgICAgICBsZXQgcGFnZTogUGFnZSA9IG5ldyBwYWdlc1twYWdlTmFtZV0oJHBhZ2VFbCwgcGFnZU9wdGlvbnMpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFBhZ2UgPSBwYWdlO1xyXG5cclxuICAgICAgICAvLyBiaW5kIGV2ZW50czpcclxuICAgICAgICBBUEkuYmluZCgpO1xyXG4gICAgICAgIENvcHkuYmluZCgpO1xyXG4gICAgICAgIFNoYXJlLmJpbmQoKTtcclxuICAgICAgICBXaWRnZXRzLmJpbmQoKTtcclxuXHJcbiAgICAgICAgcGFnZS5vbihQYWdlRXZlbnRzLlBST0dSRVNTLCB0aGlzLm9uUGFnZVByb2dyZXNzKTtcclxuICAgICAgICBwYWdlLm9uKFBhZ2VFdmVudHMuQ0hBTkdFLCB0aGlzLm9uUGFnZUFwcGVuZCk7XHJcblxyXG4gICAgICAgIHRoaXMub25SZXNpemUoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBhZ2UucHJlbG9hZCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xyXG4gICAgc2l0ZSA9IG5ldyBTaXRlKCk7XHJcbiAgICBzaXRlLmluaXQoKTtcclxufSk7XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJkZWZpbml0aW9ucy9zdGF0cy5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL21vZGVybml6ci5kLnRzXCIgLz5cclxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImRlZmluaXRpb25zL2pxdWVyeS5kLnRzXCIgLz5cclxuXHJcbmltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICcuL0Jyb3dzZXInO1xyXG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJHdpbmRvdyB9IGZyb20gJy4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlVUlEKCk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gJycgKyAobmV3IERhdGUoKSkuZ2V0VGltZSgpICsgTWF0aC5mbG9vcigoMSArIE1hdGgucmFuZG9tKCkpICogMHgxMDAwMCkudG9TdHJpbmcoMTYpLnN1YnN0cmluZygxKTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBjb25zdCBrZXlzID0ge1xyXG4gICAgZW50ZXI6IDEzLFxyXG4gICAgZXNjOiAyNyxcclxuICAgIHNwYWNlOiAzMixcclxuICAgIGxlZnQ6IDM3LFxyXG4gICAgdXA6IDM4LFxyXG4gICAgcmlnaHQ6IDM5LFxyXG4gICAgZG93bjogNDAsXHJcbiAgICBwYWdlVXA6IDMzLFxyXG4gICAgcGFnZURvd246IDM0LFxyXG4gICAgZW5kOiAzNSxcclxuICAgIGhvbWU6IDM2LFxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJhbXModXJsKTogeyBba2V5OiBzdHJpbmddOiBzdHJpbmc7IH0ge1xyXG4gICAgdmFyIHBhcmFtcyA9IHt9O1xyXG4gICAgdmFyIHBhcnNlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKTtcclxuICAgIHBhcnNlci5ocmVmID0gdXJsO1xyXG4gICAgdmFyIHF1ZXJ5ID0gcGFyc2VyLnNlYXJjaC5zdWJzdHJpbmcoMSk7XHJcbiAgICB2YXIgdmFycyA9IHF1ZXJ5LnNwbGl0KCcmJyk7XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhcnMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgcGFpciA9IHZhcnNbaV0uc3BsaXQoJz0nKTtcclxuICAgICAgICBwYXJhbXNbcGFpclswXV0gPSBkZWNvZGVVUklDb21wb25lbnQocGFpclsxXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcGFyYW1zO1xyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB0ZXN0QXV0b3BsYXkoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2U8Ym9vbGVhbj4oKHJlc29sdmUpID0+IHtcclxuICAgICAgICBpZiAodHlwZW9mIE1vZGVybml6ci52aWRlb2F1dG9wbGF5ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgTW9kZXJuaXpyLm9uKCd2aWRlb2F1dG9wbGF5JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShNb2Rlcm5penIudmlkZW9hdXRvcGxheSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlVG9UaW1lKHNlYzogbnVtYmVyKTogc3RyaW5nIHtcclxuXHJcbiAgICBjb25zdCB0b3RhbFNlYyA9IHBhcnNlSW50KCcnICsgc2VjLCAxMCk7XHJcbiAgICBjb25zdCBob3VycyA9IHBhcnNlSW50KCcnICsgdG90YWxTZWMgLyAzNjAwLCAxMCkgJSAyNDtcclxuICAgIGNvbnN0IG1pbnV0ZXMgPSBwYXJzZUludCgnJyArIHRvdGFsU2VjIC8gNjAsIDEwKSAlIDYwO1xyXG4gICAgY29uc3Qgc2Vjb25kcyA9IHRvdGFsU2VjICUgNjA7XHJcbiAgICBjb25zdCBocnNEaXNwbGF5ID0gKGhvdXJzIDwgMTAgPyAnMCcgKyBob3VycyA6IGhvdXJzKSArICc6JztcclxuXHJcbiAgICByZXR1cm4gKGhvdXJzID4gMCA/IGhyc0Rpc3BsYXkgOiAnJykgKyAobWludXRlcyA8IDEwID8gJzAnICsgbWludXRlcyA6IG1pbnV0ZXMpICsgJzonICsgKHNlY29uZHMgPCAxMCA/ICcwJyArIHNlY29uZHMgOiBzZWNvbmRzKTtcclxufVxyXG5cclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gc3RhdHMoKTogU3RhdHMge1xyXG5cclxuICAgIGNvbnN0IHN0YXRzID0gbmV3IFN0YXRzKCk7XHJcblxyXG4gICAgc3RhdHMuc2hvd1BhbmVsKCAwICk7IC8vIDA6IGZwcywgMTogbXMsIDI6IG1iLCAzKzogY3VzdG9tXHJcbiAgICAkKHN0YXRzLmRvbSkuY3NzKHsncG9pbnRlci1ldmVudHMnOiAnbm9uZScsICd0b3AnOiAxMTB9KTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoIHN0YXRzLmRvbSApO1xyXG5cclxuICAgIGZ1bmN0aW9uIGFuaW1hdGUoKTogdm9pZCB7XHJcbiAgICAgICAgc3RhdHMuYmVnaW4oKTtcclxuICAgICAgICAvLyBtb25pdG9yZWQgY29kZSBnb2VzIGhlcmVcclxuICAgICAgICBzdGF0cy5lbmQoKTtcclxuICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoIGFuaW1hdGUgKTtcclxuXHJcbiAgICByZXR1cm4gc3RhdHM7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHRpbWVGb3JtYXQodGltZTogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGxldCBtaW51dGVzID0gTWF0aC5mbG9vcih0aW1lIC8gNjApLnRvU3RyaW5nKCk7XHJcbiAgICBtaW51dGVzID0gKHBhcnNlSW50KG1pbnV0ZXMsIDEwKSA+PSAxMCkgPyBtaW51dGVzIDogJzAnICsgbWludXRlcztcclxuICAgIGxldCBzZWNvbmRzID0gTWF0aC5mbG9vcih0aW1lICUgNjApLnRvU3RyaW5nKCk7XHJcbiAgICBzZWNvbmRzID0gKHBhcnNlSW50KHNlY29uZHMsIDEwKSA+PSAxMCkgPyBzZWNvbmRzIDogJzAnICsgc2Vjb25kcztcclxuXHJcbiAgICByZXR1cm4gbWludXRlcy50b1N0cmluZygpICsgJzonICsgc2Vjb25kcy50b1N0cmluZygpO1xyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVJbWFnZVNvdXJjZXMoKTogdm9pZCB7XHJcbiAgICBpZiAoYnJvd3Nlci5pZSkge1xyXG4gICAgICAgICQoJ1tkYXRhLWllc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICBpbWcuc2V0QXR0cmlidXRlKCdzcmMnLCBpbWcuZ2V0QXR0cmlidXRlKCdkYXRhLWllc3JjJykpO1xyXG4gICAgICAgICAgICBpbWcucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWllc3JjJyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgJCgnW2RhdGEtc3JjXScpLmVhY2goKGksIGltZyk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGltZy5zZXRBdHRyaWJ1dGUoJ3NyYycsIGltZy5nZXRBdHRyaWJ1dGUoJ2RhdGEtc3JjJykpO1xyXG4gICAgICAgIGltZy5yZW1vdmVBdHRyaWJ1dGUoJ2RhdGEtc3JjJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAkKCdbZGF0YS1zcmNzZXRdJykuZWFjaCgoaSwgaW1nKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaW1nLnNldEF0dHJpYnV0ZSgnc3Jjc2V0JywgaW1nLmdldEF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKSk7XHJcbiAgICAgICAgaW1nLnJlbW92ZUF0dHJpYnV0ZSgnZGF0YS1zcmNzZXQnKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuXHJcbi8vIGV4cG9ydCBmdW5jdGlvbiBwcmVsb2FkSW1hZ2VzKGltYWdlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWRbXT4ge1xyXG4vLyAgICAgcmV0dXJuIFByb21pc2UuYWxsKGltYWdlcy5tYXAoKGltYWdlKTogUHJvbWlzZTx2b2lkPiA9PiB7XHJcbi8vICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuLy8gICAgICAgICAgICAgY29uc3QgaW1nID0gbmV3IEltYWdlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmxvYWQgPSAoKSA9PiByZXNvbHZlKCk7XHJcbi8vICAgICAgICAgICAgIGltZy5vbmVycm9yID0gKCkgPT4gcmVzb2x2ZSgpO1xyXG4vLyAgICAgICAgICAgICBpbWcub25hYm9ydCA9ICgpID0+IHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgaW1nLnNyYyA9IGltYWdlO1xyXG4vLyAgICAgICAgICAgICBpZiAoaW1nLmNvbXBsZXRlICYmICQoaW1nKS5oZWlnaHQoKSA+IDApIHsgcmVzb2x2ZSgpOyByZXR1cm47IH1cclxuLy8gICAgICAgICB9KTtcclxuLy8gICAgIH0pKTtcclxuLy8gfVxyXG5cclxuXHJcblxyXG4vLyBleHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXM6IEpRdWVyeSk6IFByb21pc2U8dm9pZFtdPiB7XHJcbi8vICAgICBsZXQgaXNCYXNlNjQ6IGJvb2xlYW47XHJcbi8vICAgICBjb25zdCBpbWFnZXM6IHN0cmluZ1tdID0gJGltYWdlcy50b0FycmF5KClcclxuLy8gICAgICAgICAubWFwKChpbWc6IEhUTUxJbWFnZUVsZW1lbnQpOiBzdHJpbmcgPT4ge1xyXG4vLyAgICAgICAgICAgICBsZXQgaW1hZ2VTb3VyY2UgPSBpbWcuY3VycmVudFNyYyB8fCBpbWcuc3JjO1xyXG4vLyAgICAgICAgICAgICBpZiAoaW1hZ2VTb3VyY2UuaW5kZXhPZignZGF0YTppbWFnZS9wbmc7YmFzZTY0LCcpID49IDApIHsgaXNCYXNlNjQgPSB0cnVlOyB9XHJcbi8vICAgICAgICAgICAgIHJldHVybiBpbWFnZVNvdXJjZTtcclxuLy8gICAgICAgICB9KTtcclxuXHJcbi8vICAgICAvLyBjb25zb2xlLmxvZyhpbWFnZXMpO1xyXG5cclxuLy8gICAgIGlmICghaXNCYXNlNjQpIHtcclxuLy8gICAgICAgICByZXR1cm4gcHJlbG9hZEltYWdlcyhpbWFnZXMpO1xyXG4vLyAgICAgfSBlbHNlIHtcclxuLy8gICAgICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XHJcbi8vICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgY2hlY2tBbmRQcmVsb2FkSW1hZ2VzKCRpbWFnZXMpLnRoZW4oKCkgPT4ge1xyXG4vLyAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuLy8gICAgICAgICAgICAgICAgIH0pO1xyXG4vLyAgICAgICAgICAgICB9LCAyMDApO1xyXG4vLyAgICAgICAgIH0pO1xyXG4vLyAgICAgfVxyXG4vLyB9XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNodWZmbGUoYSk6IEFycmF5PGFueT4ge1xyXG4gICAgbGV0IGosIHgsIGk7XHJcbiAgICBmb3IgKGkgPSBhLmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcclxuICAgICAgICBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XHJcbiAgICAgICAgeCA9IGFbaV07XHJcbiAgICAgICAgYVtpXSA9IGFbal07XHJcbiAgICAgICAgYVtqXSA9IHg7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYTtcclxufVxyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzZXRSb290VmFycygpOiB2b2lkIHtcclxuICAgIGNvbnN0IGhlYWRlckhlaWdodCA9IGJyZWFrcG9pbnQuZGVza3RvcCA/ICQoJyNuYXZiYXInKS5oZWlnaHQoKSA6IDA7XHJcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYXBwLWhlaWdodCcsIGAke3dpbmRvdy5pbm5lckhlaWdodCAtIGhlYWRlckhlaWdodH1weGApO1xyXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWNvbC0yNScsIGAkeyQoJy5jb2wtcGF0dGVybi0yNScpLndpZHRoKCl9cHhgKTtcclxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1jb2wtNjYnLCBgJHskKCcuY29sLTY2Jykud2lkdGgoKX1weGApO1xyXG4gICAgbGV0IG1hcmcgPSAhYnJlYWtwb2ludC5kZXNrdG9wID8gNTAgOiAxMjA7XHJcbiAgICAkKCcuYXNpZGUnKS5jc3MoJ2hlaWdodCcsICR3aW5kb3cuaGVpZ2h0KCkgKyBtYXJnKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUJvZHlTY3JvbGxpbmcoc1Q6IG51bWJlcik6IHZvaWQge1xyXG4gICAgJCgnYm9keScpLnJlbW92ZUF0dHIoJ3N0eWxlJyk7XHJcbiAgICAkKCdib2R5JykucmVtb3ZlQ2xhc3MoJ3Njcm9sbGluZy1kaXNhYmxlJyk7XHJcbiAgICB3aW5kb3cuc2Nyb2xsVG8oMCwgc1QpO1xyXG59XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRpc2FibGVCb2R5U2Nyb2xsaW5nKHNUOiBudW1iZXIpOiB2b2lkIHtcclxuICAgIGxldCBwb3NpdGlvbiA9IGJyb3dzZXIuaWUgPyAnYWJzb2x1dGUnIDogJ2ZpeGVkJztcclxuICAgIGxldCB0b3AgPSBicm93c2VyLmllID8gJycgOiAtc1QgKyAncHgnO1xyXG4gICAgJCgnYm9keScpLmFkZENsYXNzKCdzY3JvbGxpbmctZGlzYWJsZScpO1xyXG4gICAgJCgnYm9keScpLmNzcyh7XHJcbiAgICAgICAgLy8gJ3Bvc2l0aW9uJzogcG9zaXRpb24sXHJcbiAgICAgICAgLy8gJ3RvcCc6IHRvcCxcclxuICAgICAgICAvLyAnYm90dG9tJzogJzAnLFxyXG4gICAgICAgICdvdmVyZmxvdyc6ICdoaWRkZW4nLFxyXG4gICAgICAgICd3aWxsLWNoYW5nZSc6ICd0b3AnLFxyXG4gICAgICAgICd3aWR0aCc6ICcxMDAlJyxcclxuICAgICAgICAndG91Y2gtYWN0aW9uJzogJ25vbmUnLFxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNvbnN0IHRyYW5zbGF0aW9ucyA9IHtcclxuICAgICdpbnZhbGlkLWVtYWlsJzoge1xyXG4gICAgICAgICdlbic6ICdJbnZhbGlkIGVtYWlsIGFkZHJlc3MgZm9ybWF0JyxcclxuICAgICAgICAncGwnOiAnTmllcG9wcmF3bnkgZm9ybWF0IGFkcmVzdSBlLW1haWwnLFxyXG4gICAgfSxcclxuICAgICdyZXF1aXJlZC1maWVsZCc6IHtcclxuICAgICAgICAnZW4nOiAnUmVxdWlyZWQgZmllbGQnLFxyXG4gICAgICAgICdwbCc6ICdQb2xlIG9ib3dpxIV6a293ZScsXHJcbiAgICB9LFxyXG4gICAgJ2ludmFsaWQtemlwJzoge1xyXG4gICAgICAgICdlbic6ICdFbnRlciB6aXAtY29kZSBpbiBmaXZlIGRpZ2l0cyBmb3JtYXQnLFxyXG4gICAgICAgICdwbCc6ICdXcGlzeiBrb2QgcG9jenRvd3kgdyBmb3JtYWNpZSBYWC1YWFgnLFxyXG4gICAgfSxcclxufTtcclxuXHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29sb3JUb1JHQkEoaGV4OiBzdHJpbmcsIGFscGhhPzogbnVtYmVyKTogc3RyaW5nIHtcclxuICAgIGxldCBjO1xyXG4gICAgaWYgKC9eIyhbQS1GYS1mMC05XXszfSl7MSwyfSQvLnRlc3QoaGV4KSkge1xyXG4gICAgICAgIGMgPSBoZXguc3Vic3RyaW5nKDEpLnNwbGl0KCcnKTtcclxuICAgICAgICBpZiAoYy5sZW5ndGggPT0gMykge1xyXG4gICAgICAgICAgICBjID0gW2NbMF0sIGNbMF0sIGNbMV0sIGNbMV0sIGNbMl0sIGNbMl1dO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjID0gJzB4JyArIGMuam9pbignJyk7XHJcbiAgICAgICAgcmV0dXJuICdyZ2JhKCcgKyBbKGMgPj4gMTYpICYgMjU1LCAoYyA+PiA4KSAmIDI1NSwgYyAmIDI1NV0uam9pbignLCcpICsgYCwke3R5cGVvZiBhbHBoYSA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogYWxwaGF9KWA7XHJcbiAgICB9XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0JhZCBIZXgnKTtcclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRib2R5LCAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi4vUHVzaFN0YXRlcyc7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFzaWRlIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogQXNpZGU7XHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHByaXZhdGUgJGhhbWJ1cmdlckxpbmU6IEpRdWVyeTtcclxuICAgIFxyXG4gICAgcHVibGljIHN0YXRpYyBhc2lkZUFuaW1hdGlvbigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgaWYgKEFzaWRlLmluc3RhbmNlLmlzT3Blbikge1xyXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRpdGVtLCAwLjI1LCB7IGR1cmF0aW9uOiAwLjI1LCBzdGFnZ2VyOiAtMC4xLCBvcGFjaXR5OiAwLCB4OiAyMCwgZGVsYXk6IDAuMn0pXHJcbiAgICAgICAgICAgIGdzYXAudG8oQXNpZGUuaW5zdGFuY2UuJGhhbWJ1cmdlckxpbmUsIDAuMywgeyBkdXJhdGlvbjogMC4zLCBzY2FsZVk6IDB9KTtcclxuICAgICAgICAgICAgQXNpZGUuaW5zdGFuY2UuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZ3NhcC50byhBc2lkZS5pbnN0YW5jZS4kaXRlbSwgMC41LCB7IGR1cmF0aW9uOiAwLjUsIHN0YWdnZXI6IDAuMDUsIG9wYWNpdHk6IDEsIHg6IDAsIGRlbGF5OiAwLjJ9KVxyXG4gICAgICAgICAgICBnc2FwLnRvKEFzaWRlLmluc3RhbmNlLiRoYW1idXJnZXJMaW5lLCAwLjMsIHsgZHVyYXRpb246IDAuMywgc2NhbGVZOiAxLCBkZWxheTogMC41fSk7XHJcbiAgICAgICAgICAgIEFzaWRlLmluc3RhbmNlLmlzT3BlbiA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIHByb3RlY3RlZCBvcHRpb25zPykge1xyXG4gICAgICAgIHN1cGVyKHZpZXcpO1xyXG5cclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtJyk7XHJcbiAgICAgICAgdGhpcy4kaGFtYnVyZ2VyTGluZSA9ICQoJ1tkYXRhLWhhbWJ1cmdlcl0nKS5maW5kKCdpJyk7XHJcblxyXG4gICAgICAgIEFzaWRlLmluc3RhbmNlID0gdGhpcztcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICBBc2lkZS5pbnN0YW5jZS5pc09wZW4gPSBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGl0ZW0ub2ZmKCcubWVudScpLm9uKCdjbGljay5tZW51JywgdGhpcy5oaWRlTWVudSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlTWVudSA9IChlKSA9PiB7XHJcbiAgICAgICAgUHVzaFN0YXRlcy5hc2lkZVRvZ2dsZShlKTtcclxuICAgIH1cclxufVxyXG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vZGVmaW5pdGlvbnMvY2hhcnQuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7ICRkb2MsICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcclxuLy8gaW1wb3J0IHsgQ2hhcnQgfSBmcm9tICdjaGFydC5qcyc7XHJcbi8vIGltcG9ydCAqIGFzIENoYXJ0RGF0YUxhYmVscyBmcm9tICdjaGFydGpzLXBsdWdpbi1kYXRhbGFiZWxzJztcclxuaW1wb3J0IHsgR2xvYmFsVmFycyB9IGZyb20gJy4vR2xvYmFsVmFycyc7XHJcblxyXG5kZWNsYXJlIGxldCBDaGFydDtcclxuZGVjbGFyZSBsZXQgQ2hhcnREYXRhTGFiZWxzO1xyXG4vLyB2YXIgQ2hhcnQgPSByZXF1aXJlKCdjaGFydC5qcycpO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBDaGFydHMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHZpZXdTd2l0Y2hlcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkc3Vidmlld3M6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGN1cnJlbnQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHBpZUNoYXJ0V3JhcHBlcjogSlF1ZXJ5O1xyXG5cclxuICAgIHByaXZhdGUgcGllQ2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIHByaXZhdGUgYmFyQ2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIHByaXZhdGUgY3R4UGllOiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICBwcml2YXRlIGN0eEJhcjogQ2FudmFzUmVuZGVyaW5nQ29udGV4dDJEO1xyXG5cclxuICAgIHByaXZhdGUgcGllQ2hhcnQ6IGFueTtcclxuICAgIHByaXZhdGUgYmFyQ2hhcnQ6IGFueTtcclxuXHJcbiAgICBwcml2YXRlIGljb25zOiBhbnk7XHJcblxyXG4gICAgcHJpdmF0ZSBsYWJlbHM6IGFueSA9IFtcclxuICAgICAgICAnQlVJTERJTkdTJyxcclxuICAgICAgICAnRUxFQ1RSSUNJVFknLFxyXG4gICAgICAgICdUUkFOU1BPUlRBVElPTicsXHJcbiAgICAgICAgJ0FHUklDVUxUVVJFJyxcclxuICAgICAgICAnRVhUUkFDVElWRSBJTkRVU1RSSUVTJyxcclxuICAgICAgICAnTUFOVUZBQ1RVUklORycsXHJcbiAgICAgICAgJ0ZPUkVTVFJZJ1xyXG4gICAgXTtcclxuXHJcbiAgICBwcml2YXRlIHRvb2x0aXBzOiBhbnkgPSBbXHJcbiAgICAgICAgWyBcclxuICAgICAgICAnPHN0cm9uZz5Db2FsIFBvd2VyIDUyJTwvc3Ryb25nPiBvZiBidWlsZGluZ3MgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICc8c3Ryb25nPk5hdHVyYWwgR2FzIDM0JTwvc3Ryb25nPiBvZiBidWlsZGluZ3MgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICdCaW9HYXMgLSBub3QgcHJlc2VudCBpbiBkYXRhJyxcclxuICAgICAgICAnQ29tYmluZWQgaGVhdCBhbmQgcG93ZXIgLSBub3QgcHJlc2VudCBpbiBkYXRhJ1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgWyBcclxuICAgICAgICAnPHN0cm9uZz5Db2FsIFBvd2VyIDUyJTwvc3Ryb25nPiBvZiBlbGVjdHJpY2l0eSBnZW5lcmF0aW9uIGVtaXNzaW9ucycsXHJcbiAgICAgICAgJzxzdHJvbmc+TmF0dXJhbCBHYXMgMzQlPC9zdHJvbmc+IG9mIGVsZWN0cmljaXR5IGdlbmVyYXRpb24gZW1pc3Npb25zJyxcclxuICAgICAgICAnQmlvR2FzIC0gbm90IHByZXNlbnQgaW4gZGF0YScsXHJcbiAgICAgICAgJ0NvbWJpbmVkIGhlYXQgYW5kIHBvd2VyIC0gbm90IHByZXNlbnQgaW4gZGF0YSdcclxuICAgICAgICBdLFxyXG4gICAgICAgIFsgXHJcbiAgICAgICAgJzxzdHJvbmc+Q29hbCBQb3dlciA1MiU8L3N0cm9uZz4gb2YgdHJhbnNwb3J0YXRpb24gZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICc8c3Ryb25nPk5hdHVyYWwgR2FzIDM0JTwvc3Ryb25nPiBvZiB0cmFuc3BvcnRhdGlvbiBnZW5lcmF0aW9uIGVtaXNzaW9ucycsXHJcbiAgICAgICAgJ0Jpb0dhcyAtIG5vdCBwcmVzZW50IGluIGRhdGEnLFxyXG4gICAgICAgICdDb21iaW5lZCBoZWF0IGFuZCBwb3dlciAtIG5vdCBwcmVzZW50IGluIGRhdGEnXHJcbiAgICAgICAgXSxcclxuICAgICAgICBbIFxyXG4gICAgICAgICc8c3Ryb25nPkNvYWwgUG93ZXIgNTIlPC9zdHJvbmc+IG9mIGFncmljdWx0dXJlIGdlbmVyYXRpb24gZW1pc3Npb25zJyxcclxuICAgICAgICAnPHN0cm9uZz5OYXR1cmFsIEdhcyAzNCU8L3N0cm9uZz4gb2YgYWdyaWN1bHR1cmUgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICdCaW9HYXMgLSBub3QgcHJlc2VudCBpbiBkYXRhJyxcclxuICAgICAgICAnQ29tYmluZWQgaGVhdCBhbmQgcG93ZXIgLSBub3QgcHJlc2VudCBpbiBkYXRhJ1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgWyBcclxuICAgICAgICAnPHN0cm9uZz5Db2FsIFBvd2VyIDUyJTwvc3Ryb25nPiBvZiBleHRyYWN0aXZlIGluZHVzdHJpZXMgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICc8c3Ryb25nPk5hdHVyYWwgR2FzIDM0JTwvc3Ryb25nPiBvZiBleHRyYWN0aXZlIGluZHVzdHJpZXMgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICdCaW9HYXMgLSBub3QgcHJlc2VudCBpbiBkYXRhJyxcclxuICAgICAgICAnQ29tYmluZWQgaGVhdCBhbmQgcG93ZXIgLSBub3QgcHJlc2VudCBpbiBkYXRhJ1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgWyBcclxuICAgICAgICAnPHN0cm9uZz5Db2FsIFBvd2VyIDUyJTwvc3Ryb25nPiBvZiBtYW51ZmFjdHVyaW5nIGdlbmVyYXRpb24gZW1pc3Npb25zJyxcclxuICAgICAgICAnPHN0cm9uZz5OYXR1cmFsIEdhcyAzNCU8L3N0cm9uZz4gb2YgbWFudWZhY3R1cmluZyBnZW5lcmF0aW9uIGVtaXNzaW9ucycsXHJcbiAgICAgICAgJ0Jpb0dhcyAtIG5vdCBwcmVzZW50IGluIGRhdGEnLFxyXG4gICAgICAgICdDb21iaW5lZCBoZWF0IGFuZCBwb3dlciAtIG5vdCBwcmVzZW50IGluIGRhdGEnXHJcbiAgICAgICAgXSxcclxuICAgICAgICBbIFxyXG4gICAgICAgICc8c3Ryb25nPkNvYWwgUG93ZXIgNTIlPC9zdHJvbmc+IG9mIGZvcmVzdHJ5IGdlbmVyYXRpb24gZW1pc3Npb25zJyxcclxuICAgICAgICAnPHN0cm9uZz5OYXR1cmFsIEdhcyAzNCU8L3N0cm9uZz4gb2YgZm9yZXN0cnkgZ2VuZXJhdGlvbiBlbWlzc2lvbnMnLFxyXG4gICAgICAgICdCaW9HYXMgLSBub3QgcHJlc2VudCBpbiBkYXRhJyxcclxuICAgICAgICAnQ29tYmluZWQgaGVhdCBhbmQgcG93ZXIgLSBub3QgcHJlc2VudCBpbiBkYXRhJ1xyXG4gICAgICAgIF1cclxuXHJcbiAgICBdXHJcblxyXG4gICAgcHJpdmF0ZSBjb2xvcnM6IGFueSA9IFtcclxuICAgICAgICBHbG9iYWxWYXJzLmNvbG9ycy5pbmRpZ28sXHJcbiAgICAgICAgR2xvYmFsVmFycy5jb2xvcnMuYmx1ZSxcclxuICAgICAgICBHbG9iYWxWYXJzLmNvbG9ycy5ncmVlbixcclxuICAgICAgICBHbG9iYWxWYXJzLmNvbG9ycy52aW9sZXQsXHJcbiAgICAgICAgR2xvYmFsVmFycy5jb2xvcnMudmlraW5nLFxyXG4gICAgICAgIEdsb2JhbFZhcnMuY29sb3JzLnNoYW1yb2NrLFxyXG4gICAgICAgIEdsb2JhbFZhcnMuY29sb3JzLndpbnRlcixcclxuICAgIF1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdmlld1N3aXRjaGVyID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLWNoYXJ0LXR5cGVdJyk7XHJcbiAgICAgICAgdGhpcy4kc3Vidmlld3MgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY2hhcnQtYXBwXScpO1xyXG5cclxuICAgICAgICB0aGlzLnBpZUNhbnZhcyA9IDxIVE1MQ2FudmFzRWxlbWVudD50aGlzLnZpZXcuZmluZCgnI3BpZS1jaGFydCcpWzBdO1xyXG4gICAgICAgIHRoaXMuYmFyQ2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PnRoaXMudmlldy5maW5kKCcjYmFyLWNoYXJ0JylbMF07XHJcbiAgICAgICAgdGhpcy5jdHhCYXIgPSB0aGlzLmJhckNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgIHRoaXMuY3R4UGllID0gdGhpcy5waWVDYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgICAgICB0aGlzLmJhckNhbnZhcy5oZWlnaHQgPSAyNTA7XHJcbiAgICAgICAgdGhpcy4kcGllQ2hhcnRXcmFwcGVyID0gdGhpcy52aWV3LmZpbmQoJy5qcy1waWUtY2hhcnQnKTtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnNldENoYXJ0cygpO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHZpZXdTd2l0Y2hlci5vZmYoJy5zd2l0Y2gnKS5vbignY2xpY2suc3dpdGNoJywgdGhpcy5vblZpZXdTd2l0Y2gpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGVzdHJveUNoYXJ0cygpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmJhckNoYXJ0LmRlc3Ryb3koKTtcclxuICAgICAgICB0aGlzLnBpZUNoYXJ0LmRlc3Ryb3koKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHNldEJpZ2dlc3RWYWx1ZSh2YWx1ZXM6IEFycmF5PG51bWJlcj4pOiB2b2lkIHtcclxuICAgICAgICBsZXQgbGFyZ2VzdCA9IHRoaXMuZ2V0TGFyZ2VzdFZhbHVlKHZhbHVlcyk7XHJcbiAgICAgICAgdGhpcy4kcGllQ2hhcnRXcmFwcGVyLmFwcGVuZCgnPGRpdiBjbGFzcz1cImNoYXJ0X19jZW50ZXIganMtY2VudGVyLXZhbHVlXCI+PGltZyBzcmM9XCJcIiBhbHQ9XCJcIiBjbGFzcz1cImNoYXJ0X19sYXJnZXN0aWNvbiBqcy1sYXJnZXN0LWljb25cIj48c3BhbiBjbGFzcz1cImNoYXJ0X19sYXJnZXN0bmFtZSBqcy1sYXJnZXN0LW5hbWVcIj48L3NwYW4+PHNwYW4gY2xhc3M9XCJjaGFydF9fbGFyZ2VzdCBqcy1sYXJnZXN0LW51bVwiPjwvc3Bhbj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgbGV0IGluZGV4ID0gdmFsdWVzLmluZGV4T2YobGFyZ2VzdCk7XHJcblxyXG4gICAgICAgIGxldCBhcmVhTmFtZSA9IHRoaXMubGFiZWxzW2luZGV4XS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXcuZmluZCgnLmpzLWxhcmdlc3QtbmFtZScpLnRleHQoYXJlYU5hbWUpO1xyXG4gICAgICAgIHRoaXMudmlldy5maW5kKCcuanMtbGFyZ2VzdC1udW0nKS50ZXh0KGxhcmdlc3QgKyAnJScpO1xyXG4gICAgICAgIGxldCBpY29uO1xyXG5cclxuICAgICAgICBmb3IgKGNvbnN0IHByb3AgaW4gR2xvYmFsVmFycy5pY29ucykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9wID09PSBhcmVhTmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChwcm9wID09PSBhcmVhTmFtZSkge1xyXG4gICAgICAgICAgICAgICAgaWNvbiA9IEdsb2JhbFZhcnMuaWNvbnNbcHJvcF07XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhpY29uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy52aWV3LmZpbmQoJy5qcy1sYXJnZXN0LWljb24nKS5hdHRyKCdzcmMnLCBpY29uKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRDaGFydHMoKTogdm9pZCB7XHJcbiAgICAgICAgLy8gQ2hhcnQucGx1Z2lucy5yZWdpc3RlcihDaGFydERhdGFMYWJlbHMpO1xyXG4gICAgICAgIC8vIENoYXJ0LnJlZ2lzdGVyKC4uLnJlZ2lzdGVyYWJsZXMpO1xyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IFsyMy42LCAzLjEsIDI4LjcsIDguMiwgMTEuOSwgNi43LCAxNS4zXTtcclxuICAgICAgICB0aGlzLnNldEJpZ2dlc3RWYWx1ZSh2YWx1ZXMpO1xyXG4gICAgICAgIGNvbnN0IHBpZURhdGEgPSB7XHJcbiAgICAgICAgICAgIGxhYmVsczogdGhpcy5sYWJlbHMsXHJcbiAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xyXG4gICAgICAgICAgICAgICAgbGFiZWxzOiB0aGlzLmxhYmVscyxcclxuICAgICAgICAgICAgICAgIGRhdGE6IHZhbHVlcyxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5jb2xvcnMsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogMCxcclxuICAgICAgICAgICAgICAgIGN1dG91dDogJzcwJScsXHJcbiAgICAgICAgICAgICAgICBob3Zlck9mZnNldDogNSxcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgYmFyQ2hhcnQgPSB7XHJcbiAgICAgICAgICAgIGxhYmVsczogdGhpcy5sYWJlbHMsXHJcbiAgICAgICAgICAgIGRhdGFzZXRzOiBbe1xyXG4gICAgICAgICAgICAgICAgYXhpczogJ3knLFxyXG4gICAgICAgICAgICAgICAgZGF0YTogdmFsdWVzLFxyXG4gICAgICAgICAgICAgICAgZmlsbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogdGhpcy5jb2xvcnMsXHJcbiAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogMCxcclxuICAgICAgICAgICAgICAgIGJhclRoaWNrbmVzczogNTAsXHJcbiAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMCxcclxuICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmJhckNoYXJ0ID0gbmV3IENoYXJ0KHRoaXMuY3R4QmFyLCB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdiYXInLFxyXG4gICAgICAgICAgICBkYXRhOiBiYXJDaGFydCxcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgcGx1Z2luczoge1xyXG4gICAgICAgICAgICAgICAgICAgIGxlZ2VuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2x0aXA6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4dGVybmFsOiAoY29udGV4dCkgPT4gdGhpcy5jdXN0b21CYXJUb29sdGlwKGNvbnRleHQpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja3M6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFmdGVyQm9keTogKGl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy50b29sdGlwc1tpdGVtWzBdLmRhdGFJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIGluZGV4QXhpczogJ3knLFxyXG4gICAgICAgICAgICAgICAgc2NhbGVzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgeDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdUT05ORVMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6ICdyZ2JhKDg4LDg4LDg4LCAwLjQ1KScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMjAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFtaWx5OiAnUXVpY2tzYW5kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3ZWlnaHQ6ICdub3JtYWwnXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aWNrczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSArICdCJztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2l6ZTogMjAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFtaWx5OiAnUXVpY2tzYW5kJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiAyMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHk6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGlja3M6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaXplOiAxNixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYW1pbHk6ICdLYW5pdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFkZGluZzogMjAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyaWQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJhd0JvcmRlcjogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkcmF3T25DaGFydEFyZWE6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJhd1RpY2tzOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHVyYXRpb246IDIwMDAsXHJcbiAgICAgICAgICAgICAgICAgICAgb25Qcm9ncmVzczogKGNoYXJ0KSA9PiB0aGlzLnBlcmNlbnRPbkJhckhhY2soY2hhcnQpLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6IChjaGFydCkgPT4gdGhpcy5wZXJjZW50T25CYXJIYWNrKGNoYXJ0KSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgLy8gQ2hhcnQucmVnaXN0ZXIoQ2hhcnREYXRhTGFiZWxzKTtcclxuICAgICAgICB0aGlzLnBpZUNoYXJ0ID0gbmV3IENoYXJ0KHRoaXMuY3R4UGllLCB7XHJcbiAgICAgICAgICAgIHR5cGU6ICdkb3VnaG51dCcsXHJcbiAgICAgICAgICAgIGRhdGE6IHBpZURhdGEsXHJcbiAgICAgICAgICAgIHBsdWdpbnM6IFsoQ2hhcnREYXRhTGFiZWxzIGFzIGFueSldLFxyXG4gICAgICAgICAgICBvcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsYXlvdXQ6IHtcclxuICAgICAgICAgICAgICAgICAgICBwYWRkaW5nOiA1MFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBsdWdpbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhbGFiZWxzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYW1wOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYW5jaG9yOiAnY2VudGVyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxpZ246ICdjZW50ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvZmZzZXQ6IDEwLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogR2xvYmFsVmFycy5jb2xvcnMud2hpdGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhYmVsczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb250OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhbWlseTogJ0thbml0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2VpZ2h0OiAnYm9sZCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNpemU6IDIyXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0dGVyOiAodmFsdWUsIGNvbnRleHQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZSArJyUnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBsZWdlbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sdGlwOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBleHRlcm5hbDogKGNvbnRleHQpID0+IHRoaXMuY3VzdG9tQmFyVG9vbHRpcChjb250ZXh0KSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJzZWN0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZnRlckJvZHk6IChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9vbHRpcHNbaXRlbVswXS5kYXRhSW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBwZXJjZW50T25CYXJIYWNrKGNoYXJ0KTogdm9pZCB7XHJcbiAgICAgICAgbGV0IGNoYXJ0SW5zdGFuY2UgPSBjaGFydC5jaGFydCxcclxuICAgICAgICAgICAgY3R4ID0gY2hhcnRJbnN0YW5jZS5jdHg7XHJcblxyXG4gICAgICAgIGN0eC5mb250ID0gJzUwMCAyMnB4IEthbml0JztcclxuICAgICAgICBjdHgudGV4dEFsaWduID0gJ2xlZnQnO1xyXG4gICAgICAgIGN0eC50ZXh0QmFzZWxpbmUgPSAnbWlkZGxlJztcclxuICAgICAgICBjdHguZmlsbFN0eWxlID0gR2xvYmFsVmFycy5jb2xvcnMud2hpdGU7XHJcblxyXG4gICAgICAgIGNoYXJ0SW5zdGFuY2UuZGF0YS5kYXRhc2V0cy5mb3JFYWNoKChkYXRhc2V0LCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBtZXRhID0gY2hhcnRJbnN0YW5jZS5nZXREYXRhc2V0TWV0YShpKTtcclxuICAgICAgICAgICAgbWV0YS5kYXRhLmZvckVhY2goKGJhciwgaW5kZXgpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBkYXRhID0gZGF0YXNldC5kYXRhW2luZGV4XSArICclJztcclxuICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dChkYXRhLCAyMzAsIGJhci55KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgY3VzdG9tQmFyVG9vbHRpcChjb250ZXh0KTogdm9pZCB7XHJcbiAgICAgICAgLy8gVG9vbHRpcCBFbGVtZW50XHJcbiAgICAgICAgbGV0IHRvb2x0aXBFbCA9ICQoJyNjaGFydGpzLXRvb2x0aXAnKVswXTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGVsZW1lbnQgb24gZmlyc3QgcmVuZGVyXHJcbiAgICAgICAgaWYgKCF0b29sdGlwRWwpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRvb2x0aXBFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICB0b29sdGlwRWwuaWQgPSAnY2hhcnRqcy10b29sdGlwJztcclxuICAgICAgICAgICAgdG9vbHRpcEVsLmlubmVySFRNTCA9ICc8ZGl2IGNsYXNzPVwidG9vbHRpcCB0b29sdGlwLS1jaGFydFwiPjxkaXYgY2xhc3M9XCJ0b29sdGlwX193cmFwcGVyXCI+PC9kaXY+PC9kaXY+JztcclxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0b29sdGlwRWwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSGlkZSBpZiBubyB0b29sdGlwXHJcbiAgICAgICAgbGV0IHRvb2x0aXBNb2RlbCA9IGNvbnRleHQudG9vbHRpcDtcclxuICAgICAgICBjb25zb2xlLmxvZyh0b29sdGlwTW9kZWwsICdtb2RlbCcsIGNvbnRleHQsICdjdHgnKTtcclxuICAgICAgICBpZiAodG9vbHRpcE1vZGVsLm9wYWNpdHkgPT09ICcwJykge1xyXG4gICAgICAgICAgICB0b29sdGlwRWwuc3R5bGUub3BhY2l0eSA9ICcwJztcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGluZGV4ID0gbnVsbDtcclxuICAgICAgICBsZXQgY29sb3IgPSAnJztcclxuXHJcbiAgICAgICAgdGhpcy5sYWJlbHMuZm9yRWFjaCggKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB0aXRsZSA9IHRvb2x0aXBNb2RlbC50aXRsZS5sZW5ndGggPD0gMCA/IHRvb2x0aXBNb2RlbC5kYXRhUG9pbnRzWzBdLmxhYmVsIDogdG9vbHRpcE1vZGVsLnRpdGxlWzBdOyBcclxuICAgICAgICAgICAgaWYgKGVsID09PSB0aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbG9yID0gdGhpcy5jb2xvcnNbaW5kZXhdO1xyXG5cclxuXHJcbiAgICAgICAgLy8gU2V0IFRleHRcclxuICAgICAgICBpZiAodG9vbHRpcE1vZGVsLmJvZHkpIHtcclxuICAgICAgICAgICAgbGV0IHRpdGxlTGluZXMgPSB0b29sdGlwTW9kZWwudGl0bGUubGVuZ3RoIDw9IDAgPyB0b29sdGlwTW9kZWwuZGF0YVBvaW50c1swXS5sYWJlbCA6IHRvb2x0aXBNb2RlbC50aXRsZTtcclxuICAgICAgICAgICAgY29uc29sZS5sb2codGl0bGVMaW5lcyk7XHJcbiAgICAgICAgICAgIGxldCBib2R5TGluZXMgPSB0b29sdGlwTW9kZWwuYWZ0ZXJCb2R5Lm1hcCgoYm9keUl0ZW0pID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBib2R5SXRlbTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgaW5uZXJIdG1sID0gJzxoND4nO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aXRsZUxpbmVzID09ICdzdHJpbmcnKSB7XHJcbiAgICAgICAgICAgICAgICBpbm5lckh0bWwgKz0gdGl0bGVMaW5lcztcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlTGluZXMuZm9yRWFjaCgodGl0bGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpbm5lckh0bWwgKz0gdGl0bGU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpbm5lckh0bWwgKz0gJzwvaDQ+PGhyIGNsYXNzPVwidG9vbHRpcF9faHJcIj48dWw+JztcclxuXHJcbiAgICAgICAgICAgIGJvZHlMaW5lcy5mb3JFYWNoKChib2R5LCBpKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpbm5lckh0bWwgKz0gJzxsaT4nICsgYm9keSArICc8L2xpPic7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBpbm5lckh0bWwgKz0gJzwvdWw+JztcclxuXHJcbiAgICAgICAgICAgIGxldCB3cmFwcGVyID0gJCh0b29sdGlwRWwpLmZpbmQoJy50b29sdGlwX193cmFwcGVyJylbMF07XHJcbiAgICAgICAgICAgIHdyYXBwZXIuaW5uZXJIVE1MID0gaW5uZXJIdG1sO1xyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBjb250ZXh0LmNoYXJ0LmNhbnZhcy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcclxuXHJcbiAgICAgICAgLy8gRGlzcGxheSwgcG9zaXRpb24sIGFuZCBzZXQgc3R5bGVzIGZvciBmb250XHJcbiAgICAgICAgJCh0b29sdGlwRWwpLmZpbmQoJ3N0cm9uZycpLmNzcygnY29sb3InLCBjb2xvcik7XHJcbiAgICAgICAgJCh0b29sdGlwRWwpLmZpbmQoJ2hyJykuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpO1xyXG4gICAgICAgIHRvb2x0aXBFbC5zdHlsZS5vcGFjaXR5ID0gJzEnO1xyXG4gICAgICAgIHRvb2x0aXBFbC5zdHlsZS5wb3NpdGlvbiA9ICdhYnNvbHV0ZSc7XHJcbiAgICAgICAgdG9vbHRpcEVsLnN0eWxlLnpJbmRleCA9ICc0JztcclxuICAgICAgICB0b29sdGlwRWwuc3R5bGUubGVmdCA9IHBvc2l0aW9uLmxlZnQgKyB3aW5kb3cucGFnZVhPZmZzZXQgKyB0b29sdGlwTW9kZWwuY2FyZXRYICsgJ3B4JztcclxuICAgICAgICB0b29sdGlwRWwuc3R5bGUudG9wID0gcG9zaXRpb24udG9wICsgd2luZG93LnBhZ2VZT2Zmc2V0ICsgdG9vbHRpcE1vZGVsLmNhcmV0WSArICdweCc7XHJcbiAgICAgICAgdG9vbHRpcEVsLnN0eWxlLmZvbnQgPSAnS2FuaXQnO1xyXG4gICAgICAgIHRvb2x0aXBFbC5zdHlsZS5wYWRkaW5nID0gdG9vbHRpcE1vZGVsLnBhZGRpbmcgKyAncHggJyArIHRvb2x0aXBNb2RlbC5wYWRkaW5nICsgJ3B4JztcclxuICAgICAgICB0b29sdGlwRWwuc3R5bGUucG9pbnRlckV2ZW50cyA9ICdub25lJztcclxuXHJcblxyXG4gICAgICAgIGdzYXAuZnJvbVRvKCQodG9vbHRpcEVsKS5maW5kKCcudG9vbHRpcCcpLCB7IGR1cmF0aW9uOiAwLjUsIG9wYWNpdHk6IDB9LCB7IG9wYWNpdHk6IDF9KTtcclxuICAgICAgICBpZiAodG9vbHRpcE1vZGVsLm9wYWNpdHkgPT09IDApIHtcclxuICAgICAgICAgICAgZ3NhcC5mcm9tVG8oJCh0b29sdGlwRWwpLmZpbmQoJy50b29sdGlwJyksIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMX0sIHsgb3BhY2l0eTogMH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblZpZXdTd2l0Y2ggPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgY29uc3QgdmlldyA9IGN1cnJlbnQuZGF0YSgnY2hhcnQtdHlwZScpO1xyXG5cclxuICAgICAgICB0aGlzLiR2aWV3U3dpdGNoZXIucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEFjdGl2ZVN1YnZpZXcodmlldyk7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy5kZXN0cm95Q2hhcnRzKCksIDMwMCk7XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnNldENoYXJ0cygpLCA0NTApO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNldEFjdGl2ZVN1YnZpZXcodmlldzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuJHN1YnZpZXdzLmZpbHRlcignLmlzLWFjdGl2ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVDdXJyZW50KGN1cnJlbnQpLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNob3cobnVsbCwgdmlldyk7XHJcbiAgICAgICAgICAgICR3aW5kb3cucmVzaXplKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgaGlkZUN1cnJlbnQoZWxlbWVudD86IEpRdWVyeSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnQgPSBlbGVtZW50ID8gZWxlbWVudCA6IHRoaXMuJGN1cnJlbnQ7XHJcbiAgICAgICAgICAgIGlmICghY3VycmVudCkgeyByZXNvbHZlKCk7IHJldHVybjsgfVxyXG4gICAgICAgICAgICBnc2FwLnRvKGN1cnJlbnQsIHtcclxuICAgICAgICAgICAgICAgIG9wYWNpdHk6IDAsXHJcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMC4zLFxyXG4gICAgICAgICAgICAgICAgZWFzZTogJ3NpbmUnLFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnQucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgc2hvdyhpbmRleD86IG51bWJlciwgdHlwZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGluZGV4ICE9IHVuZGVmaW5lZCAmJiBpbmRleCAhPSBudWxsICkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kY3VycmVudCA9IHRoaXMuJHN1YnZpZXdzLmZpbHRlcignW2RhdGEtY2hhcnQtYXBwPScgKyBpbmRleCArICddJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IHR5cGVvZiBpbmRleCAhPSB1bmRlZmluZWQgJiYgaW5kZXggIT0gbnVsbCA/IHRoaXMuJGN1cnJlbnQgOiB0aGlzLiRzdWJ2aWV3cy5maWx0ZXIoJ1tkYXRhLWNoYXJ0LWFwcD0nICsgdHlwZSArICddJyk7XHJcbiAgICAgICAgICAgIGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgICAgICAgICAgZ3NhcC5mcm9tVG8oY3VycmVudCwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjcsXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgZ2V0TGFyZ2VzdFZhbHVlKGRhdGE6IEFycmF5PG51bWJlcj4pOiBudW1iZXIge1xyXG4gICAgICAgIGxldCBsYXJnZXN0ID0gMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrICkge1xyXG4gICAgICAgICAgICBpZiAoZGF0YVtpXSA+IGxhcmdlc3QpIHtcclxuICAgICAgICAgICAgICAgIGxhcmdlc3QgPSBkYXRhW2ldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbGFyZ2VzdDtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7ICR3aW5kb3cgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcGFyZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgXHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRpdGVtTWFpbjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkZGVsZXRlOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRhZGRJdGVtOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGl0ZW0gPSB0aGlzLnZpZXcuZmluZCgnLmpzLWl0ZW0nKTtcclxuICAgICAgICB0aGlzLiRpdGVtTWFpbiA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbS1tYWluJyk7XHJcbiAgICAgICAgdGhpcy4kZGVsZXRlID0gdGhpcy52aWV3LmZpbmQoJy5qcy1kZWxldGUnKTtcclxuICAgICAgICB0aGlzLiRhZGRJdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1hZGQtaXRlbScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbS5lcSgwKS5hZGRDbGFzcygnaXMtY29tcGFyZScpO1xyXG4gICAgICAgIHRoaXMuY29tcGFyZU51bWJlcnModGhpcy4kaXRlbS5lcSgwKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRpdGVtLm9uKCdjbGljaycsIChlKSA9PiB0aGlzLm9uQ29tcGFyZShlKSk7XHJcbiAgICAgICAgdGhpcy4kZGVsZXRlLm9uKCdjbGljaycsIHRoaXMucmVtb3ZlSXRlbSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Db21wYXJlKGUsIGVsZW1lbnQ/OiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gZWxlbWVudCA/IGVsZW1lbnQgOiAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSBjdXJyZW50LmluZGV4KCk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5yZW1vdmVDbGFzcygnaXMtY29tcGFyZScpO1xyXG4gICAgICAgIGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWNvbXBhcmUnKTtcclxuXHJcbiAgICAgICAgZ3NhcC50byh0aGlzLiRpdGVtTWFpbiwgeyBkdXJhdGlvbjogMC41LCB5OiB0aGlzLiRpdGVtTWFpbi5vdXRlckhlaWdodCgpICogaW5kZXggKyAoMTAgKiBpbmRleCkgfSk7XHJcbiAgICAgICAgdGhpcy5jb21wYXJlTnVtYmVycyhjdXJyZW50KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBjb21wYXJlTnVtYmVycyhlbDogSlF1ZXJ5KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgdmFsdWVNYWluOiBudW1iZXIgPSBwYXJzZUludCh0aGlzLiRpdGVtTWFpbi5maW5kKCcuanMtY29tcC1udW0nKS50ZXh0KCksIDEwKTtcclxuICAgICAgICBjb25zdCB2YWx1ZVNlY29uZDogbnVtYmVyID0gcGFyc2VJbnQoZWwuZmluZCgnLmpzLWNvbXAtbnVtJykudGV4dCgpLCAxMCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWhpZ2hlciBpcy1sb3dlcicpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1NYWluLnJlbW92ZUNsYXNzKCdpcy1oaWdoZXIgaXMtbG93ZXInKTtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlTWFpbiA+IHZhbHVlU2Vjb25kKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGl0ZW1NYWluLmFkZENsYXNzKCdpcy1oaWdoZXInKTtcclxuICAgICAgICAgICAgZWwuYWRkQ2xhc3MoJ2lzLWxvd2VyJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodmFsdWVNYWluIDwgdmFsdWVTZWNvbmQpIHtcclxuICAgICAgICAgICAgZWwuYWRkQ2xhc3MoJ2lzLWhpZ2hlcicpO1xyXG4gICAgICAgICAgICB0aGlzLiRpdGVtTWFpbi5hZGRDbGFzcygnaXMtbG93ZXInKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgcmVtb3ZlSXRlbSA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpLnBhcmVudCgpO1xyXG4gICAgICAgIGxldCBlbENvbXBhcmUgPSBjdXJyZW50Lmhhc0NsYXNzKCdpcy1jb21wYXJlJykgPyB0cnVlIDogZmFsc2U7XHJcbiAgICAgICAgbGV0IGVsID0gY3VycmVudC5uZXh0KCkubGVuZ3RoID4gMCA/IGN1cnJlbnQubmV4dCgpIDogY3VycmVudC5wcmV2KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGVsLmhhc0NsYXNzKCdqcy1hZGQtaXRlbScpKSB7XHJcbiAgICAgICAgICAgIGVsID0gY3VycmVudC5wcmV2KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjdXJyZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcclxuICAgICAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcclxuICAgICAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuJGl0ZW0ubGVuZ3RoIDwgMikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kaXRlbS5hZGRDbGFzcygnaXMtcmVtb3ZlLWJsb2NraW5nJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChlbENvbXBhcmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25Db21wYXJlKGUsIGVsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDEwKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBIYW5kbGVyIH0gZnJvbSAnLi4vSGFuZGxlcic7XHJcbmltcG9ydCB7IElCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29tcG9uZW50RXZlbnRzIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgQ0hBTkdFOiBzdHJpbmcgPSAnY2hhbmdlJztcclxufVxyXG5cclxuZXhwb3J0IGFic3RyYWN0IGNsYXNzIENvbXBvbmVudCBleHRlbmRzIEhhbmRsZXIge1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz86IE9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgaWYgKCF2aWV3WzBdKSB7IGNvbnNvbGUud2FybignY29tcG9uZW50IGJ1aWx0IHdpdGhvdXQgdmlldycpOyB9XHJcbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCB0aGlzKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBwcmVsb2FkSW1hZ2VzKCk6IEFycmF5PHN0cmluZz4ge1xyXG4gICAgICAgIHJldHVybiBbXTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBvblN0YXRlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBhbmltYXRlSW4oaW5kZXg/OiBudW1iZXIsIGRlbGF5PzogbnVtYmVyKTogdm9pZCB7IH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBhbmltYXRlT3V0KCk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgICAgICAvLyBpZiB5b3UgZG9uJ3Qgd2FudCB0byBhbmltYXRlIGNvbXBvbmVudCxcclxuICAgICAgICAvLyBqdXN0IHJldHVybiBlbXB0eSBQcm9taXNlOlxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XHJcblxyXG4gICAgICAgIC8vIGlmIHlvdSBuZWVkIGFuaW1hdGlvbjpcclxuICAgICAgICAvLyByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIC8vICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgIC8vICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAvLyAgICAgICAgIH0sXHJcbiAgICAgICAgLy8gICAgICAgICBkdXJhdGlvbjogMC4zLFxyXG4gICAgICAgIC8vICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAvLyAgICAgfSk7XHJcbiAgICAgICAgLy8gfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwdWJsaWMgdHVybk9mZigpOiB2b2lkIHsgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHR1cm5PbigpOiB2b2lkIHsgfVxyXG5cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4geyB9O1xyXG5cclxuXHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy52aWV3LmRhdGEoJ2NvbXAnLCBudWxsKTtcclxuICAgICAgICB0aGlzLnZpZXcub2ZmKCk7XHJcbiAgICAgICAgc3VwZXIuZGVzdHJveSgpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRGFzaGJvYXJkIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlICR0b2dnbGU6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGJvZHk6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgaXNUb2dnbGVkOiBib29sZWFuO1xyXG4gICAgcHJpdmF0ZSBib2R5SGVpZ2h0OiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRvZ2dsZSA9IHRoaXMudmlldy5maW5kKCcuanMtYnV0dG9uLXRvZ2dsZScpO1xyXG4gICAgICAgIHRoaXMuJGJvZHkgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWRhc2hib2FyZC1ib2R5Jyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbFN0YXRlKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAod2R0OiBudW1iZXIsIGhndDogbnVtYmVyLCBicmVha3BvaW50PzogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkID0+IHtcclxuXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiR0b2dnbGUub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlUGFuZWwpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlUGFuZWwgPSAoZSkgPT4ge1xyXG4gICAgICAgIGlmICghdGhpcy5pc1RvZ2dsZWQpIHtcclxuICAgICAgICAgICAgdGhpcy4kdG9nZ2xlLmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIGdzYXAudG8odGhpcy4kYm9keSwgeyBkdXJhdGlvbjogMC41LCBoZWlnaHQ6ICdhdXRvJywgZWFzZTogJ3Bvd2VyMi5pbk91dCcsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtdG9nZ2xlZCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pc1RvZ2dsZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XHJcbiAgICAgICAgICAgIHRoaXMuJHRvZ2dsZS5yZW1vdmVDbGFzcygnaXMtb3BlbicpO1xyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMuJGJvZHksIHsgZHVyYXRpb246IDAuNSwgaGVpZ2h0OiAnMCcsIGVhc2U6ICdwb3dlcjIuaW5PdXQnLFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNUb2dnbGVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgaW5pdGlhbFN0YXRlKCk6IHZvaWQge1xyXG4gICAgICAgIGdzYXAuc2V0KHRoaXMuJGJvZHksIHsgaGVpZ2h0OiAnMCd9KTtcclxuICAgIH1cclxuICAgIFxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vRmlsdGVycyc7XHJcblxyXG5leHBvcnQgY2xhc3MgRHJvcGRvd24gZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuXHJcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kdHJpZ2dlciA9IHRoaXMudmlldy5maW5kKCcuanMtdHJpZ2dlcicpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXNlbGVjdF0nKTtcclxuICAgICAgICB0aGlzLiRpdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXZhbHVlXScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnZpZXcuYXR0cignZGF0YS1zZWxlY3RlZCcsIHRoaXMuJHNlbGVjdGVkLnRleHQoKSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZpZXcub2ZmKCcuc2VsZWN0Jykub24oJ2NsaWNrLnNlbGVjdCcsIHRoaXMudG9nZ2xlKTtcclxuICAgICAgICAkZG9jLm9mZignLmRyb3Bkb3duJykub24oJ2NsaWNrLmRyb3Bkb3duJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcclxuICAgICAgICB0aGlzLiRpdGVtLm9mZignLnNlbGVjdGlvbicpLm9uKCdjbGljay5zZWxlY3Rpb24nLCB0aGlzLm9uSXRlbUNsaWNrKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGUgPSAoZSkgPT4ge1xyXG4gICAgICAgIHRoaXMuaXNPcGVuID8gdGhpcy5jbG9zZVNlbGVjdCgpIDogdGhpcy5vcGVuU2VsZWN0KGUpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9wZW5TZWxlY3QoZSk6IHZvaWQge1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGlmICghdGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjbG9zZVNlbGVjdCgpOiB2b2lkIHtcclxuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpICYmICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5kYXRhKCd2YWx1ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3LmF0dHIoJ2RhdGEtc2VsZWN0ZWQtY291bnRyeScsIGN1cnJlbnQpO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCAoKSA9PiB7XHJcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoY3VycmVudCk7XHJcbiAgICAgICAgfSwgMzAwKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5cclxuaW50ZXJmYWNlIElGaWx0ZXJzU2V0dGluZ3Mge1xyXG4gICAgc3RhdHVzOiBzdHJpbmcsXHJcbiAgICB0YWdzOiBzdHJpbmcsXHJcbn1cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRmlsdGVycyBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpbnN0YW5jZTogRmlsdGVycztcclxuXHJcbiAgICBwcml2YXRlICRjbGVhcjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkcGFuZWw6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW1TZWN0b3I6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW1UaW1lOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICR0aW1lbGluZUl0ZW06IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGl0ZW1Db3VudHJ5OiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRhbGxTZWN0b3JzOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRwaWNrZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHNlbGVjdGVkQ291bnRyeTogSlF1ZXJ5O1xyXG5cclxuICAgIHByaXZhdGUgc2VsZWN0ZWRDb3VudHJ5OiBzdHJpbmc7XHJcblxyXG4gICAgcHJpdmF0ZSBmaWx0ZXJzOiBBcnJheTxzdHJpbmc+ID0gW107XHJcbiAgICBwcml2YXRlIGlzQWxsQ2hlY2tlZDogYm9vbGVhbjtcclxuICAgIHByaXZhdGUgc2V0dGluZ3M6IElGaWx0ZXJzU2V0dGluZ3M7XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgc2hvd1BpY2tlZEZpbHRlcnMoY291bnRyeT86IHN0cmluZyk6IHZvaWQge1xyXG4gICAgICAgIGlmIChGaWx0ZXJzLmluc3RhbmNlLnNldHRpbmdzLnRhZ3MgPT09ICdoaWRkZW4nKSB7IHJldHVybiA7IH1cclxuICAgICAgICBsZXQgcGlja2VkU2VjdG9ycyA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IuZmlsdGVyKCcuaXMtYWN0aXZlJykgOiBudWxsO1xyXG4gICAgICAgIGxldCBwaWNrZWRUaW1lID0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuICAgICAgICBsZXQgcGlja2VkQ291bnRyeSA9IEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1Db3VudHJ5LmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyBGaWx0ZXJzLmluc3RhbmNlLiRpdGVtQ291bnRyeS5maWx0ZXIoJy5pcy1hY3RpdmUnKS50ZXh0KCkgOiBGaWx0ZXJzLmluc3RhbmNlLiRzZWxlY3RlZENvdW50cnkudmFsKCk7XHJcblxyXG5cclxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuZmluZCgnc3BhbicpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBpZiAocGlja2VkU2VjdG9ycykge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhwaWNrZWRTZWN0b3JzKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwaWNrZWRTZWN0b3JzLmxlbmd0aCA9PT0gRmlsdGVycy5pbnN0YW5jZS4kaXRlbVNlY3Rvci5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWwnLCBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzKTtcclxuICAgICAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2UuJHBpY2tlZC5hcHBlbmQoJzxzcGFuPicgKyBGaWx0ZXJzLmluc3RhbmNlLiRhbGxTZWN0b3JzLnRleHQoKSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tYSA9ICcsJztcclxuICAgICAgICAgICAgICAgIGxldCBjbHMgPSAndGFnJztcclxuICAgICAgICAgICAgICAgIHBpY2tlZFNlY3RvcnMuZWFjaCgoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSA9PSBwaWNrZWRTZWN0b3JzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29tYSA9ICcnO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbHMgPSAndGFnLWxhc3QnO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRwaWNrZWQuYXBwZW5kKCc8c3BhbiBjbGFzcz0nICsgY2xzICsgJz4nICsgJChlbCkudGV4dCgpICsgY29tYSArICc8L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBpY2tlZENvdW50cnkpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2cocGlja2VkQ291bnRyeSk7XHJcbiAgICAgICAgICAgIEZpbHRlcnMuaW5zdGFuY2Uuc2VsZWN0ZWRDb3VudHJ5ID0gcGlja2VkQ291bnRyeTtcclxuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZENvdW50cnkgKyAnPC9zcGFuPicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBpY2tlZFRpbWUpIHtcclxuICAgICAgICAgICAgRmlsdGVycy5pbnN0YW5jZS4kcGlja2VkLmFwcGVuZCgnPHNwYW4+JyArIHBpY2tlZFRpbWUuZGF0YSgnaXRlbS1sYWJlbCcpICsgJzwvc3Bhbj4nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgYWRkQ291bnRyeVRvRmlsdGVycyhjb3VudHJ5OiBzdHJpbmcpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBjb3VudHJ5TmFtZTogc3RyaW5nID0gY291bnRyeS5zcGxpdCgnICcpLmpvaW4oJy0nKS50b0xvd2VyQ2FzZSgpO1xyXG5cclxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLnNlbGVjdGVkQ291bnRyeSA9IGNvdW50cnk7XHJcbiAgICAgICAgY29uc29sZS5sb2coY291bnRyeU5hbWUsICdjb3VudHJ5IG5hbWUnKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kY2xlYXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsZWFyJyk7XHJcbiAgICAgICAgdGhpcy4kcGFuZWwgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXBhbmVsJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3RvciA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lID0gdGhpcy52aWV3LmZpbmQoJy5qcy10aW1lJyk7XHJcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXRpbWVdJyk7XHJcbiAgICAgICAgdGhpcy4kYWxsU2VjdG9ycyA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbS1hbGwnKTtcclxuICAgICAgICB0aGlzLiRwaWNrZWQgPSAkKCcuanMtcGlja2VkLWZpbHRlcicpO1xyXG4gICAgICAgIHRoaXMuJHNlbGVjdGVkQ291bnRyeSA9IHRoaXMudmlldy5maW5kKCcjc2VhcmNoLWNvdW50cnknKTtcclxuICAgICAgICB0aGlzLiRpdGVtQ291bnRyeSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbS1jb3VudHJ5Jyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dGluZ3MgPSAkLmV4dGVuZCh7XHJcbiAgICAgICAgICAgIHN0YXR1czogJycsXHJcbiAgICAgICAgfSwgb3B0aW9ucyB8fCB2aWV3LmRhdGEoJ29wdGlvbnMnKSB8fCB7fSk7XHJcblxyXG4gICAgICAgIEZpbHRlcnMuaW5zdGFuY2UgPSB0aGlzO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKEZpbHRlcnMuaW5zdGFuY2UuJGl0ZW1TZWN0b3IsIEZpbHRlcnMuaW5zdGFuY2Uudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKS5kYXRhKCdzZWxlY3RlZCcpKTtcclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB0aGlzLnNldERlZmF1bHRTZWxlY3Rpb24oKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHJlc2l6ZSA9ICh3ZHQ6IG51bWJlciwgaGd0OiBudW1iZXIsIGJyZWFrcG9pbnQ/OiBJQnJlYWtwb2ludCwgYnBDaGFuZ2VkPzogYm9vbGVhbik6IHZvaWQgPT4ge1xyXG4gICAgICAgIC8vIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIC8vICAgICB0aGlzLiRjbGVhci5jc3MoJ2hlaWdodCcsIHRoaXMuJHBhbmVsLm91dGVySGVpZ2h0KCkpO1xyXG4gICAgICAgIC8vIH0pO1xyXG4gICAgfTtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJGl0ZW1TZWN0b3Iub2ZmKCcuc2VjdG9yJykub24oJ2NsaWNrLnNlY3RvcicsIHRoaXMudG9nZ2xlU2VjdG9yKTtcclxuICAgICAgICB0aGlzLiRpdGVtVGltZS5vZmYoJy50aW1lJykub24oJ2NsaWNrLnRpbWUnLCB0aGlzLnRvZ2dsZVRpbWUpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5Lm9mZignLmNvdW50cnknKS5vbignY2xpY2suY291bnRyeScsIHRoaXMudG9nZ2xlQ291bnRyeSk7XHJcbiAgICAgICAgdGhpcy4kY2xlYXIub2ZmKCcuY2xlYXInKS5vbignY2xpY2suY2xlYXInLCB0aGlzLmNsZWFyQXJyYXkpO1xyXG4gICAgICAgIC8vIHRoaXMuJGFsbFNlY3RvcnMub2ZmKCcuYWxsJykub24oJ2NsaWNrLmFsbCcsIHRoaXMubWFya0FsbFNlY3RvcnMpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG1hcmtBbGxTZWN0b3JzKCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHRpbWVDaGVja2VkID0gdGhpcy4kaXRlbVRpbWUuZmlsdGVyKCcuaXMtYWN0aXZlJykubGVuZ3RoID4gMCA/IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpIDogbnVsbDtcclxuXHJcbiAgICAgICAgdGhpcy5jbGVhckFycmF5KCk7XHJcbiAgICAgICAgdGhpcy4kaXRlbVNlY3Rvci5lYWNoKChpLCBlbCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KCQoZWwpLCB0aGlzLmZpbHRlcnMsIHRydWUpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJGFsbFNlY3RvcnMuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuaXNBbGxDaGVja2VkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgaWYgKHRpbWVDaGVja2VkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkodGltZUNoZWNrZWQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIHRoaXMubWFya1RpbWVsaW5lKHRpbWVDaGVja2VkKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBjbGVhckFycmF5ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1UaW1lLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRpdGVtU2VjdG9yLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudW5tYXJrVGltZWxpbmUoKTtcclxuICAgICAgICBGaWx0ZXJzLmluc3RhbmNlLiRzZWxlY3RlZENvdW50cnkudmFsKCcnKTtcclxuICAgICAgICB0aGlzLnNldERlZmF1bHRTZWxlY3Rpb24oKTtcclxuICAgICAgICBGaWx0ZXJzLnNob3dQaWNrZWRGaWx0ZXJzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gREVGQVVMVCBTRUxFQ1RJT046IEFMTCBGSUxURVJTIChBTEwgU0VDVE9SUy9BTEwgQ09VTlRSSUVTL0FMTCBUSU1FKVxyXG4gICAgcHJpdmF0ZSBzZXREZWZhdWx0U2VsZWN0aW9uKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zZXR0aW5ncy5zdGF0dXMgPT09ICd1bmNoZWNrZWQnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsdGVycyA9IFtdO1xyXG4gICAgICAgICAgICB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheSh0aGlzLiRpdGVtVGltZS5maWx0ZXIoJ1tkYXRhLWl0ZW09XCJhbGwtdGltZVwiXScpLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVsZW1lbnRUb0FycmF5KHRoaXMuJGl0ZW1Db3VudHJ5LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgXHJcbiAgICAgICAgICAgIHRoaXMuJGl0ZW1TZWN0b3IuZWFjaCgoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkRWxlbWVudFRvQXJyYXkoJChlbCksIHRoaXMuZmlsdGVycywgdHJ1ZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLiRhbGxTZWN0b3JzLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICAgICAgdGhpcy5pc0FsbENoZWNrZWQgPSB0cnVlO1xyXG4gICAgXHJcbiAgICAgICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdG9nZ2xlU2VjdG9yID0gKGUpID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuJGFsbFNlY3RvcnMucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICAvLyB0aGlzLmlzQWxsQ2hlY2tlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zdCBhY3RpdmVQcmV2ID0gdGhpcy4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwID8gdGhpcy4kaXRlbVNlY3Rvci5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoYWN0aXZlUHJldikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGFjdGl2ZVByZXYsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycygpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZVRpbWUgPSAoZSkgPT4ge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgdGhpcy51bm1hcmtUaW1lbGluZSgpO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc3QgYWN0aXZlUHJldiA9IHRoaXMuJGl0ZW1UaW1lLmZpbHRlcignLmlzLWFjdGl2ZScpLmxlbmd0aCA+IDAgPyB0aGlzLiRpdGVtVGltZS5maWx0ZXIoJy5pcy1hY3RpdmUnKSA6IG51bGw7XHJcblxyXG4gICAgICAgICAgICBpZiAoYWN0aXZlUHJldikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGFjdGl2ZVByZXYsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgICAgICB0aGlzLm1hcmtUaW1lbGluZShjdXJyZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVDb3VudHJ5ID0gKGUpID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudC5oYXNDbGFzcygnaXMtYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgdGhpcy5yZW1vdmVFbGVtZW50RnJvbUFycmF5KGN1cnJlbnQsIHRoaXMuZmlsdGVycyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5hZGRFbGVtZW50VG9BcnJheShjdXJyZW50LCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgRmlsdGVycy5zaG93UGlja2VkRmlsdGVycyhjdXJyZW50LmRhdGEoJ2l0ZW0nKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgbWFya1RpbWVsaW5lKGVsOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBpZiAoZWwuaGFzQ2xhc3MoJ2pzLXRpbWUnKSkge1xyXG4gICAgICAgICAgICB0aGlzLiR0aW1lbGluZUl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lbGluZWRvdCA9IHRoaXMuJHRpbWVsaW5lSXRlbS5maWx0ZXIoJ1tkYXRhLXRpbWU9JyArIGVsLmRhdGEoJ2l0ZW0nKSArICddJyk7XHJcbiAgICAgICAgICAgIHRpbWVsaW5lZG90LmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdW5tYXJrVGltZWxpbmUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGltZWxpbmVJdGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIHJlbW92ZUVsZW1lbnRGcm9tQXJyYXkoJGVsOiBKUXVlcnksIGFycmF5OiBBcnJheTxzdHJpbmc+KTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgaW5kZXggPSB0aGlzLmZpbHRlcnMuaW5kZXhPZigkZWwuZGF0YSgnaXRlbScpKTtcclxuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xyXG4gICAgICAgICAgICBhcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICAkZWwucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIGFkZEVsZW1lbnRUb0FycmF5KCRlbDogSlF1ZXJ5LCBhcnJheTogQXJyYXk8c3RyaW5nPiwgbm90QWN0aXZhdGU/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgYXJyYXkucHVzaCgkZWwuZGF0YSgnaXRlbScpKTtcclxuICAgICAgICBub3RBY3RpdmF0ZSA/ICRlbC5yZW1vdmUoJ2lzLWFjdGl2ZScpIDogJGVsLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnRklMVEVSUzonLCB0aGlzLmZpbHRlcnMpO1xyXG4gICAgfVxyXG5cclxufVxyXG4iLCJleHBvcnQgY2xhc3MgR2xvYmFsVmFycyB7XHJcbiAgICBwdWJsaWMgc3RhdGljIGNvbG9yczogYW55ID0ge1xyXG4gICAgICAgIGJsdWU6ICcjNDI3ZmQ5JyxcclxuICAgICAgICBpbmRpZ286ICcjM2M1YmJjJyxcclxuICAgICAgICB2aW9sZXQ6ICcjNGM0OWIwJyxcclxuICAgICAgICBncmVlbjogJyM5NGM4NDAnLFxyXG4gICAgICAgIHZpa2luZzogJyM0YWNmZGMnLFxyXG4gICAgICAgIHdpbnRlcjogJyMzY2FiZTMnLFxyXG4gICAgICAgIHNoYW1yb2NrOiAnIzNkZDVhMicsXHJcbiAgICAgICAgd2hpdGU6ICcjZmZmJyxcclxuICAgICAgICBncmF5OiAnIzU4NTg1OCcsXHJcbiAgICAgICAgZ3JheWxpZ2h0OiAncmdiYSgyMTYsIDIxNiwgMjE2LCAxKScsXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBpY29uczogYW55ID0ge1xyXG4gICAgICAgIHRyYW5zcG9ydGF0aW9uOiBcIi4vbWVkaWEvdHJhbnNwb3J0YXRpb24ucG5nXCIsXHJcbiAgICAgICAgbWFudWZhY3R1cmluZzogXCIuL21lZGlhL21hbnVmYWN0dXJpbmcucG5nXCIsXHJcbiAgICAgICAgZWxlY3RyaWNpdHk6IFwiLi9tZWRpYS9lbGVjdHJpY2l0eS5wbmdcIixcclxuICAgICAgICBmb3Jlc3RyeTogXCIuL21lZGlhL2ZvcmVzdHJ5LnBuZ1wiLFxyXG4gICAgICAgIGV4dHJhY3RpdmU6IFwiLi9tZWRpYS9leHRyYWN0aXZlLnBuZ1wiLFxyXG4gICAgICAgIGJ1aWxkaW5nOiBcIi4vbWVkaWEvYnVpbGRpbmcucG5nXCIsXHJcbiAgICAgICAgYWdyaWN1bHR1cmU6IFwiLi9tZWRpYS9hZ3JpY3VsdHVyZS5wbmdcIlxyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi9VdGlscyc7XHJcbmltcG9ydCB7IEdsb2JhbFZhcnMgfSBmcm9tICcuL0dsb2JhbFZhcnMnO1xyXG5cclxuXHJcbmludGVyZmFjZSBJTGluZWNoYXJ0U2V0dGluZ3Mge1xyXG4gICAgaWQ6IG51bWJlcjtcclxuICAgIHhQZXJjZW50OiBudW1iZXI7XHJcbiAgICB5UG9pbnRzOiBBcnJheTxudW1iZXI+O1xyXG4gICAgY29sb3I6IHN0cmluZztcclxuICAgIHlQeDogQXJyYXk8bnVtYmVyPjtcclxuICAgIGZpbGw/OiBib29sZWFuO1xyXG4gICAgc2hvd24/OiBib29sZWFuO1xyXG4gICAgbGFiZWxZPzogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTGluZWNoYXJ0IGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlICR0YWI6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHdyYXBwZXI6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgY2FudmFzOiBIVE1MQ2FudmFzRWxlbWVudDtcclxuICAgIHByaXZhdGUgY3R4OiBDYW52YXNSZW5kZXJpbmdDb250ZXh0MkQ7XHJcbiAgICBwcml2YXRlIG1vdXNlWDogbnVtYmVyID0gMDtcclxuXHJcbiAgICBwcml2YXRlIG1hcmdpbjogYW55ID0ge1xyXG4gICAgICAgIHRvcDogNSxcclxuICAgICAgICBsZWZ0OiAyNSxcclxuICAgICAgICByaWdodDogMCxcclxuICAgICAgICBib3R0b206IDQ5XHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgZ3JhcGg6IGFueSA9IHtcclxuICAgICAgICB0b3A6IDAsXHJcbiAgICAgICAgbGVmdDogMCxcclxuICAgICAgICByaWdodDogMCxcclxuICAgICAgICBib3R0b206IDAsXHJcbiAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgIHdpZHRoOiAwLFxyXG4gICAgfTtcclxuXHJcbiAgICBwcml2YXRlIGdyYXBoc0RhdGE6IEFycmF5PElMaW5lY2hhcnRTZXR0aW5ncz4gPSBbXTtcclxuXHJcbiAgICBwcml2YXRlIGJnTGluZXM6IEFycmF5PHtzY2FsZVg6IG51bWJlcn0+O1xyXG4gICAgcHJpdmF0ZSBjdXJyZW50Q2hhcnRzOiBudW1iZXJbXTtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHdyYXBwZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXdyYXBwZXInKTtcclxuICAgICAgICB0aGlzLiR0YWIgPSB0aGlzLnZpZXcuZmluZCgnW2RhdGEtY2hhcnQtdGFiXScpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzID0gPEhUTUxDYW52YXNFbGVtZW50PnRoaXMudmlldy5maW5kKCdjYW52YXMnKVswXTtcclxuICAgICAgICB0aGlzLmN0eCA9IHRoaXMuY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmdMaW5lcyA9IEFycmF5LmFwcGx5KDAsIHsgbGVuZ3RoOiA5IH0pLm1hcCgoKSA9PiB7IHJldHVybiB7IHNjYWxlWDogMCB9OyB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgcGFyYW1zQ2hhcnRzID0gVXRpbHMuZ2V0UGFyYW1zKHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpLmNoYXJ0cztcclxuICAgICAgICB0aGlzLmN1cnJlbnRDaGFydHMgPSBwYXJhbXNDaGFydHMgPyBwYXJhbXNDaGFydHMuc3BsaXQoJywnKS5tYXAoKGkpID0+IHBhcnNlSW50KGksIDEwKSkgOiBbMCwgMywgNF07XHJcblxyXG4gICAgICAgIHRoaXMuY3JlYXRlRGF0YU9iamVjdCgpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZXNpemUoKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyByZXNpemUgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB0aGlzLiR3cmFwcGVyLndpZHRoKCk7XHJcbiAgICAgICAgdGhpcy5jYW52YXMuaGVpZ2h0ID0gdGhpcy4kd3JhcHBlci5oZWlnaHQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5ncmFwaCA9IHtcclxuICAgICAgICAgICAgdG9wOiB0aGlzLm1hcmdpbi50b3AsXHJcbiAgICAgICAgICAgIGxlZnQ6IHRoaXMubWFyZ2luLmxlZnQsXHJcbiAgICAgICAgICAgIHJpZ2h0OiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLnJpZ2h0LFxyXG4gICAgICAgICAgICBib3R0b206IHRoaXMuY2FudmFzLmhlaWdodCAtIHRoaXMubWFyZ2luLmJvdHRvbSxcclxuICAgICAgICAgICAgaGVpZ2h0OiB0aGlzLmNhbnZhcy5oZWlnaHQgLSB0aGlzLm1hcmdpbi50b3AgLSB0aGlzLm1hcmdpbi5ib3R0b20sXHJcbiAgICAgICAgICAgIHdpZHRoOiB0aGlzLmNhbnZhcy53aWR0aCAtIHRoaXMubWFyZ2luLmxlZnQgLSB0aGlzLm1hcmdpbi5yaWdodCxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnNhdmVDYWNoZSgpO1xyXG4gICAgICAgIHRoaXMuZHJhdygpO1xyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBlbmFibGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5zaG93QmcoKTtcclxuICAgICAgICBsZXQgdmlzaWJsZSA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLiR0YWIubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgY29uc3QgdiA9IHRoaXMuY3VycmVudENoYXJ0cy5pbmRleE9mKGkpID49IDA7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoaSwgdiwgZmFsc2UsIHZpc2libGUgKiAwLjMpO1xyXG4gICAgICAgICAgICB2aXNpYmxlICs9ICEhdiA/IDEgOiAwO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHB1YmxpYyBkaXNhYmxlKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuaGlkZUJnKHRydWUpO1xyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy4kdGFiLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ2hhcnQoaSwgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRGF0YU9iamVjdCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmdyYXBoc0RhdGEgPSB0aGlzLiR0YWIudG9BcnJheSgpLm1hcCgoZWwsIGkpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gJChlbCk7XHJcbiAgICAgICAgICAgIHJldHVybiA8SUxpbmVjaGFydFNldHRpbmdzPntcclxuICAgICAgICAgICAgICAgIGlkOiBpLFxyXG4gICAgICAgICAgICAgICAgeFBlcmNlbnQ6IDAsXHJcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiAkZWwuZGF0YSgncG9pbnRzJyksXHJcbiAgICAgICAgICAgICAgICAvLyB5UG9pbnRzOiB0aGlzLmdldFJhbmRvbVBvaW50cyhNYXRoLnJhbmRvbSgpICogMTAgKyA3LCBNYXRoLnJhbmRvbSgpICogMzAgKyAxOCwgNjAsIDAuMyksXHJcbiAgICAgICAgICAgICAgICB5UG9pbnRzOiB0aGlzLmdldFBvaW50cyhpKSxcclxuICAgICAgICAgICAgICAgIGNvbG9yOiBHbG9iYWxWYXJzLmNvbG9yc1skZWwuZGF0YSgnY29sb3InKV0sXHJcbiAgICAgICAgICAgICAgICBmaWxsOiBpID09PSAwLFxyXG4gICAgICAgICAgICAgICAgc2hvd246IGZhbHNlLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KHRoaXMuZ3JhcGhzRGF0YS5tYXAoKGRhdGEpID0+IGRhdGEueVBvaW50cykpKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgZ2V0UG9pbnRzKGkpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgcmV0dXJuIFtbMTQsIDEwLCAxMiwgMTMsIDE0LCA5ICwgMTIsIDE3LCAxNiwgMTEsIDEzLCAxOSwgMTAsIDksIDgsIDE1LCAxNywgMTUsIDIyLCAyNSwgMjEsIDIwLCAxOSwgMjEsIDIwLCAxOSwgMjQsIDI4LCAyMSwgMjcsIDE4LCAyMywgMzMsIDMxLCAxOCwgMjUsIDM2LCAyNCwgMzEsIDMzLCAyMSwgMzYsIDM0LCAzMCwgMjYsIDI0LCAzNSwgMjcsIDMwLCAxOCwgMjAsIDMwLCAyNiwgMjgsIDMzLCAyNSwgMzksIDI4LCAxNywgMzVdLCBbMSwgMiwgOCwgNywgNiwgMywgOCwgNSwgNSwgNCwgOCwgNywgNywgMTEsIDEwLCA4LCA3LCA5LCA4LCA2LCA4LCAxMiwgOCwgMTQsIDExLCA4LCA4LCAxMSwgNywgMTMsIDEzLCAxNiwgMjAsIDEwLCAxMCwgMTMsIDE0LCAyMCwgMTYsIDExLCAxNywgMTYsIDE4LCAyMSwgOCwgMjAsIDE1LCAxNSwgMTYsIDE1LCAxOSwgMjAsIDExLCAyMCwgMjAsIDEyLCAxNywgMjAsIDIzLCAxNl0sIFsxMywgMTEsIDYsIDksIDksIDgsIDksIDExLCA3LCAxNCwgMTIsIDgsIDEwLCAxNiwgOSwgMjAsIDE5LCAxMiwgMTIsIDE1LCAxOCwgMTUsIDE0LCAyMiwgMTksIDIwLCAyMCwgMTcsIDI0LCAyMywgMjcsIDIwLCAyMCwgMjEsIDIxLCAyNSwgMjAsIDI3LCAyMiwgMjQsIDI0LCAyNiwgMjMsIDI1LCAyNiwgMjEsIDI5LCAyNiwgMjcsIDI2LCAyNSwgMjAsIDE1LCAyNSwgMjIsIDI2LCAyMCwgMjMsIDMzLCAyOF0sIFsyLCA1LCAxMCwgOSwgMTgsIDksIDEwLCAxMiwgMjAsIDE5LCAxMywgOSwgMTUsIDExLCAyMSwgMTksIDIzLCAyMywgMjYsIDIzLCAyMywgMjMsIDI1LCAyNSwgMjYsIDI2LCAzMCwgMjIsIDI1LCAzMywgMzgsIDE2LCAzMiwgMjcsIDI3LCAzNSwgMjgsIDI4LCAzNSwgMzQsIDM2LCAyNSwgMjcsIDI1LCA0NSwgMzcsIDMxLCAzNiwgMzcsIDM2LCAyOCwgMzgsIDQyLCA0MiwgNDQsIDQzLCA0MSwgMzQsIDMxLCAzNl0sIFs3LCAxMCwgMTAsIDYsIDUsIDEzLCAxNywgMTMsIDEwLCAxMSwgMTQsIDE3LCAxNiwgMTksIDIyLCAyMCwgMjUsIDE3LCAyNCwgMTMsIDI1LCAyMCwgMjYsIDI0LCAyNiwgMTUsIDIzLCAyNCwgMzAsIDMwLCAyOSwgMzEsIDMxLCAyMSwgMzIsIDMxLCAyNSwgMzgsIDM1LCAyOCwgNDAsIDMyLCAzNywgMzEsIDM2LCA0MCwgMzUsIDM3LCAyMywgMzYsIDM3LCA0MCwgNDAsIDQxLCAxNywgMjMsIDQwLCAzNCwgNDAsIDQwXSwgWzYsIDYsIDIsIDEyLCAxMCwgMTMsIDEyLCA0LCAxMiwgMTEsIDEzLCAxNiwgMTQsIDE0LCAxNCwgMTQsIDE0LCAxNywgMTUsIDE2LCAxNiwgMTIsIDE4LCAxNSwgMjIsIDE2LCAxOSwgMTgsIDIxLCAyMSwgMjUsIDE1LCAyNiwgMTcsIDI3LCAyNywgMjEsIDEyLCAyNCwgMTUsIDE5LCAyOSwgMTgsIDI0LCAyNSwgMTgsIDI4LCAzMiwgMjUsIDI4LCAyNywgMjgsIDMxLCAyNSwgMjcsIDM1LCAyNCwgMjcsIDE1LCAyOF0sIFs0LCA1LCAxMCwgMTMsIDE1LCAxNywgNywgMTcsIDEyLCAxMiwgMTcsIDEyLCAxMiwgMTEsIDIyLCAyMSwgMTksIDIwLCAyMSwgMjYsIDIyLCAxOSwgMjEsIDI0LCAyNSwgMTIsIDI4LCAyNywgMjgsIDI3LCAzMSwgMzEsIDE1LCAzMCwgMjYsIDE5LCAyOSwgMjksIDMzLCAzMywgMTcsIDMwLCAzMCwgMzMsIDI3LCAzNCwgMzMsIDE3LCAzOSwgMjEsIDM1LCAzMywgMzMsIDIxLCAzNSwgMzAsIDM5LCAzMSwgMzUsIDI5XV1baV07XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGdldFJhbmRvbVBvaW50cyhtaW46IG51bWJlciwgbWF4OiBudW1iZXIsIGFtb3VudDogbnVtYmVyLCBjYXN0OiBudW1iZXIpOiBudW1iZXJbXSB7XHJcbiAgICAgICAgcmV0dXJuIEFycmF5LmFwcGx5KG51bGwsIHsgbGVuZ3RoOiBhbW91bnQgfSlcclxuICAgICAgICAgICAgLm1hcCgocCwgaSwgYSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBtYXggLSBtaW47XHJcbiAgICAgICAgICAgICAgICBjb25zdCBwZXJjID0gaSAvIGEubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc2luID0gTWF0aC5zaW4ocGVyYyAqIE1hdGguUEkgLyAyKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHJuZCA9IDAuNCAqIChNYXRoLnJhbmRvbSgpIDwgY2FzdCA/IC0wLjUgKyBNYXRoLnJhbmRvbSgpIDogMSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBtaW5SbmQgPSAoTWF0aC5yYW5kb20oKSAqIChwZXJjIDwgMC41ID8gMC45IDogMSkpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucm91bmQoKG1pbiAqIG1pblJuZCkgKyAoTWF0aC5yYW5kb20oKSAqIHJhbmdlICogMC4yKSArIChzaW4gKiByYW5nZSAqICgwLjYgKyBybmQpKSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzYXZlQ2FjaGUoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5ncmFwaHNEYXRhLmZvckVhY2goKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgZGF0YS55UHggPSB0aGlzLmNhbGNZUHgoZGF0YS55UG9pbnRzKTtcclxuICAgICAgICAgICAgaWYgKCFkYXRhLmxhYmVsWSkge1xyXG4gICAgICAgICAgICAgICAgZGF0YS5sYWJlbFkgPSBkYXRhLnlQeFswXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRhYi5vZmYoJy50YWInKS5vbignY2xpY2sudGFiJywgdGhpcy5vbkNsaWNrVGFiKTtcclxuICAgICAgICB0aGlzLiR3cmFwcGVyLm9mZignLmxjJykub24oJ21vdXNlbW92ZS5sYycsIHRoaXMub25Nb3VzZU1vdmUpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbkNsaWNrVGFiID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLnRvZ2dsZUNoYXJ0KCQoZS5jdXJyZW50VGFyZ2V0KS5pbmRleCgpKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRDaGFydHMgPSB0aGlzLmdyYXBoc0RhdGEubWFwKChkYXRhLCBpKSA9PiBkYXRhLnNob3duID8gaSA6IG51bGwpLmZpbHRlcigoaW5kZXgpID0+IGluZGV4ICE9PSBudWxsKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGNvbFdpZHRoID0gdGhpcy5ncmFwaC53aWR0aCAvICh0aGlzLmdyYXBoc0RhdGFbMF0ueVB4Lmxlbmd0aCAtIDEpOyAvLyBJTkZPOiBhc3N1bWUgdGhhdCBmaXJzdCBvbmUgbmVlZHMgYSB0b29sdGlwXHJcbiAgICAgICAgZ3NhcC50byh0aGlzLCB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXHJcbiAgICAgICAgICAgIG1vdXNlWDogTWF0aC5yb3VuZCgoZS5vZmZzZXRYIC0gdGhpcy5ncmFwaC5sZWZ0KSAvIGNvbFdpZHRoKSAqIGNvbFdpZHRoLFxyXG4gICAgICAgICAgICBvblVwZGF0ZTogdGhpcy5kcmF3LFxyXG4gICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNob3dCZygpOiB2b2lkIHtcclxuICAgICAgICBnc2FwLmtpbGxUd2VlbnNPZih0aGlzLCB7IGJnOiB0cnVlIH0pO1xyXG4gICAgICAgIGdzYXAudG8odGhpcy5iZ0xpbmVzLCB7XHJcbiAgICAgICAgICAgIHNjYWxlWDogMSxcclxuICAgICAgICAgICAgZHVyYXRpb246IDIsXHJcbiAgICAgICAgICAgIGVhc2U6ICdwb3dlcjMnLFxyXG4gICAgICAgICAgICBzdGFnZ2VyOiAtMC4xLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlQmcocXVpY2s/OiBib29sZWFuKTogdm9pZCB7XHJcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcywgeyBiZzogdHJ1ZSB9KTtcclxuICAgICAgICBnc2FwLnRvKHRoaXMuYmdMaW5lcywge1xyXG4gICAgICAgICAgICBzY2FsZVg6IDAsXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAhcXVpY2sgPyAyIDogMCxcclxuICAgICAgICAgICAgZWFzZTogJ3Bvd2VyMycsXHJcbiAgICAgICAgICAgIHN0YWdnZXI6ICFxdWljayA/IC0wLjEgOiAwLFxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB0b2dnbGVDaGFydChpbmRleDogbnVtYmVyLCBzaG93PzogYm9vbGVhbiwgcXVpY2s/OiBib29sZWFuLCBkZWxheT86IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGRhdGEgPSB0aGlzLmdyYXBoc0RhdGFbaW5kZXhdO1xyXG4gICAgICAgIGlmICh0eXBlb2Ygc2hvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgc2hvdyA9ICFkYXRhLnNob3duO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ3NhcC50byhkYXRhLCB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAhcXVpY2sgPyAzLjIgOiAwLFxyXG4gICAgICAgICAgICB4UGVyY2VudDogc2hvdyA/IDEgOiAwLFxyXG4gICAgICAgICAgICBsYWJlbFk6IGRhdGEueVB4W3Nob3cgPyBkYXRhLnlQeC5sZW5ndGggLSAxIDogMF0sXHJcbiAgICAgICAgICAgIHJvdW5kUHJvcHM6ICdsYWJlbFknLFxyXG4gICAgICAgICAgICBlYXNlOiAncG93ZXIzJyxcclxuICAgICAgICAgICAgZGVsYXk6ICFxdWljayA/IGRlbGF5IHx8IDAgOiAwLFxyXG4gICAgICAgICAgICBvblVwZGF0ZTogdGhpcy5kcmF3LFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiR0YWIuZXEoaW5kZXgpLnRvZ2dsZUNsYXNzKCdpcy1vbi1jaGFydCcsIHNob3cpO1xyXG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YVtpbmRleF0uc2hvd24gPSBzaG93O1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3ID0gKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgIHRoaXMuY3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmNhbnZhcy53aWR0aCwgdGhpcy5jYW52YXMuaGVpZ2h0KTtcclxuICAgICAgICB0aGlzLmRyYXdCZygpO1xyXG4gICAgICAgIHRoaXMuZ3JhcGhzRGF0YS5mb3JFYWNoKChncmFwaERhdGEpID0+IHRoaXMuZHJhd0dyYXBoKGdyYXBoRGF0YSkpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3QmcoKTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIGRyYXcgWCBheGlzXHJcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBHbG9iYWxWYXJzLmNvbG9ycy5ncmF5O1xyXG4gICAgICAgIHRoaXMuY3R4Lm1vdmVUbyh0aGlzLmdyYXBoLmxlZnQsIHRoaXMuZ3JhcGguYm90dG9tKTtcclxuICAgICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDIwLCB0aGlzLmdyYXBoLmJvdHRvbSk7XHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IGhlbHBlcnNMaW5lID0gODtcclxuICAgICAgICBjb25zdCB0ZXh0VHJhbnNmb3JtID0gNTtcclxuICAgICAgICBjb25zdCBzdGVwID0gNTtcclxuICAgICAgICBsZXQgdmFsO1xyXG4gICAgICAgIGNvbnN0IHllYXJzID0gWzIwMTUsIDIwMTYsIDIwMTcsIDIwMTgsIDIwMTksIDIwMjAsIDIwMjFdO1xyXG5cclxuICAgICAgICB0aGlzLmN0eC5zdHJva2VTdHlsZSA9IEdsb2JhbFZhcnMuY29sb3JzLmdyYXlsaWdodDtcclxuICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XHJcbiAgICAgICAgdGhpcy5jdHguZm9udCA9ICc1MDAgMTJweCBRdWlja3NhbmQsIHNhbnMtc2VyaWYnO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gR2xvYmFsVmFycy5jb2xvcnMuZ3JheTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPD0gaGVscGVyc0xpbmU7IGkrKykge1xyXG4gICAgICAgICAgICB2YWwgPSA1MCAtIHN0ZXAgKiBpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IHRoaXMuYmdMaW5lc1tpXS5zY2FsZVg7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZpbGxUZXh0KCcnICsgdmFsICsgJycsIDAsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3AgKyB0ZXh0VHJhbnNmb3JtKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZ2xvYmFsQWxwaGEgPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgubGVmdCwgKHRoaXMuZ3JhcGguaGVpZ2h0KSAvIGhlbHBlcnNMaW5lICogaSArIHRoaXMubWFyZ2luLnRvcCk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLmxlZnQgKyAodGhpcy5ncmFwaC53aWR0aCArIDIwKSAqIHRoaXMuYmdMaW5lc1tpXS5zY2FsZVgsICh0aGlzLmdyYXBoLmhlaWdodCkgLyBoZWxwZXJzTGluZSAqIGkgKyB0aGlzLm1hcmdpbi50b3ApO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHllYXJzLmxlbmd0aDsgaisrKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmJlZ2luUGF0aCgpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lV2lkdGggPSAxO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lSm9pbiA9ICdyb3VuZCc7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmZvbnQgPSAnNTAwIDEycHggUXVpY2tzYW5kLCBzYW5zLXNlcmlmJztcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gR2xvYmFsVmFycy5jb2xvcnMuZ3JheTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJycgKyB5ZWFyc1tqXSArICcnLCB0aGlzLmdyYXBoLndpZHRoIC8geWVhcnMubGVuZ3RoICogaiArIHRoaXMubWFyZ2luLmxlZnQsIHRoaXMuY2FudmFzLmhlaWdodCAtIHRleHRUcmFuc2Zvcm0gKiAyKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBkcmF3R3JhcGggPSAoZGF0YTogSUxpbmVjaGFydFNldHRpbmdzKTogdm9pZCA9PiB7XHJcbiAgICAgICAgbGV0IGxhc3RWYWw6IG51bWJlcjtcclxuICAgICAgICBsZXQgbGFzdFk6IG51bWJlcjtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDM7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZUNhcCA9ICdyb3VuZCc7XHJcbiAgICAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG4gICAgICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuXHJcbiAgICAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgY29uc3QgY29sV2lkdGggPSB0aGlzLmdyYXBoLndpZHRoIC8gKGRhdGEueVB4Lmxlbmd0aCAtIDEpO1xyXG4gICAgICAgIGNvbnN0IG1heFggPSAoZGF0YS54UGVyY2VudCAqIGNvbFdpZHRoICogZGF0YS55UHgubGVuZ3RoKSArIHRoaXMuZ3JhcGgubGVmdDtcclxuXHJcbiAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgeCA9IGNvbFdpZHRoICogaSArIHRoaXMuZ3JhcGgubGVmdDtcclxuICAgICAgICAgICAgaWYgKHggPD0gbWF4WCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgbGFzdFkgPSB5O1xyXG4gICAgICAgICAgICAgICAgbGFzdFZhbCA9IGRhdGEueVBvaW50c1tpXTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmICh4IDwgbWF4WCArIGNvbFdpZHRoICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICB5ID0gdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKG1heFgsIHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5jdHguc3Ryb2tlKCk7XHJcbiAgICAgICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XHJcblxyXG4gICAgICAgIC8vIGZpbGwvZ3JhZGllbnQ6XHJcbiAgICAgICAgaWYgKGRhdGEuZmlsbCkge1xyXG4gICAgICAgICAgICBsZXQgbGFzdFggPSB0aGlzLm1hcmdpbi5sZWZ0O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICAgICAgICAvLyB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgICAgICAvLyB0aGlzLmN0eC5nbG9iYWxBbHBoYSA9IDAuNDtcclxuICAgICAgICAgICAgY29uc3QgZ3JkID0gdGhpcy5jdHguY3JlYXRlTGluZWFyR3JhZGllbnQoMCwgMCwgMCwgdGhpcy5ncmFwaC5oZWlnaHQpO1xyXG4gICAgICAgICAgICBncmQuYWRkQ29sb3JTdG9wKDAsIFV0aWxzLmNvbG9yVG9SR0JBKGRhdGEuY29sb3IsIDAuNSkpO1xyXG4gICAgICAgICAgICBncmQuYWRkQ29sb3JTdG9wKDEsIFV0aWxzLmNvbG9yVG9SR0JBKGRhdGEuY29sb3IsIDAuMSkpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBncmQ7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgZGF0YS55UHguZm9yRWFjaCggKHksIGksIGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBjb2xXaWR0aCAqIGkgKyB0aGlzLmdyYXBoLmxlZnQ7XHJcbiAgICAgICAgICAgICAgICBpZiAoeCA8PSBtYXhYICYmIGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKHgsIHkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RYID0geDtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoeCA8IG1heFggKyBjb2xXaWR0aCAmJiBkYXRhLnhQZXJjZW50ID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGl5ID0gdGhpcy5nZXRJbnRlclBvaW50c1kobWF4WCwgW3ggLSBjb2xXaWR0aCwgYVtpIC0gMV1dLCBbeCwgeV0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyhtYXhYLCBpeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdFggPSBtYXhYO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhpcy5jdHgubGluZVRvKGxhc3RYLCB0aGlzLmdyYXBoLmJvdHRvbSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLmxlZnQsIHRoaXMuZ3JhcGguYm90dG9tKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguZmlsbCgpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRvb2x0aXA6XHJcbiAgICAgICAgICAgIGxldCBtb3VzZVggPSBNYXRoLm1heCgwLCB0aGlzLm1vdXNlWCk7XHJcbiAgICAgICAgICAgIGNvbnN0IG14aTEgPSBNYXRoLmZsb29yKG1vdXNlWCAvIGNvbFdpZHRoKTtcclxuICAgICAgICAgICAgY29uc3QgbXhpMiA9IG14aTEgKyAxO1xyXG4gICAgICAgICAgICBtb3VzZVggKz0gdGhpcy5ncmFwaC5sZWZ0O1xyXG4gICAgICAgICAgICBjb25zdCBtb3VzZVkgPSB0aGlzLmdldEludGVyUG9pbnRzWShcclxuICAgICAgICAgICAgICAgIG1vdXNlWCxcclxuICAgICAgICAgICAgICAgIFtjb2xXaWR0aCAqIG14aTEgKyB0aGlzLmdyYXBoLmxlZnQsIGRhdGEueVB4W214aTFdXSxcclxuICAgICAgICAgICAgICAgIFtjb2xXaWR0aCAqIG14aTIgKyB0aGlzLmdyYXBoLmxlZnQsIGRhdGEueVB4W214aTJdXVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5tb3ZlVG8obW91c2VYLCBtb3VzZVkpO1xyXG4gICAgICAgICAgICB0aGlzLmN0eC5saW5lVG8obW91c2VYLCB0aGlzLmdyYXBoLmJvdHRvbSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gbGFiZWw6XHJcbiAgICAgICAgLy8gaWYgKGRhdGEueFBlcmNlbnQgPiAwKSB7XHJcbiAgICAgICAgLy8gICAgIC8vIGxpbmU6XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4Lmdsb2JhbEFscGhhID0gMTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LmxpbmVXaWR0aCA9IDE7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LnN0cm9rZVN0eWxlID0gZGF0YS5jb2xvcjtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHgubW92ZVRvKHRoaXMuZ3JhcGgucmlnaHQsIGRhdGEubGFiZWxZKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyAyNCwgZGF0YS5sYWJlbFkpO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5zdHJva2UoKTtcclxuXHJcbiAgICAgICAgLy8gICAgIC8vIHBlbnRhZ29uOlxyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAndHJhbnNwYXJlbnQnO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSBkYXRhLmNvbG9yO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5tb3ZlVG8odGhpcy5ncmFwaC5yaWdodCArIDIwLCBkYXRhLmxhYmVsWSk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgNDAsIGRhdGEubGFiZWxZIC0gMTIpO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5saW5lVG8odGhpcy5ncmFwaC5yaWdodCArIDExMCwgZGF0YS5sYWJlbFkgLSAxMik7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LmxpbmVUbyh0aGlzLmdyYXBoLnJpZ2h0ICsgMTEwLCBkYXRhLmxhYmVsWSArIDEyKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHgubGluZVRvKHRoaXMuZ3JhcGgucmlnaHQgKyA0MCwgZGF0YS5sYWJlbFkgKyAxMik7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5maWxsKCk7XHJcblxyXG4gICAgICAgIC8vICAgICAvLyB0ZXh0OlxyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHgubGluZVdpZHRoID0gMTtcclxuICAgICAgICAvLyAgICAgdGhpcy5jdHgubGluZUpvaW4gPSAncm91bmQnO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5mb250ID0gJzUwMCAxNHB4IFF1aWNrc2FuZCwgc2Fucy1zZXJpZic7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LmZpbGxTdHlsZSA9IEdsb2JhbFZhcnMuY29sb3JzLndoaXRlO1xyXG4gICAgICAgIC8vICAgICB0aGlzLmN0eC5maWxsVGV4dChsYXN0VmFsICsgJycsIHRoaXMuZ3JhcGgucmlnaHQgKyA0NCwgZGF0YS5sYWJlbFkgKyA0ICk7XHJcbiAgICAgICAgLy8gICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xyXG4gICAgICAgIC8vIH1cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vLyBIRUxQRVJTXHJcblxyXG4gICAgcHJpdmF0ZSBsYXJnZXN0WVZhbChkYXRhOiBBcnJheTxudW1iZXI+KTogbnVtYmVyIHtcclxuICAgICAgICBsZXQgbGFyZ2VzdCA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKyApIHtcclxuICAgICAgICAgICAgaWYgKGRhdGFbaV0gPiBsYXJnZXN0KSB7XHJcbiAgICAgICAgICAgICAgICBsYXJnZXN0ID0gZGF0YVtpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGxhcmdlc3Q7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGNhbGNZUHgoZGF0YSk6IEFycmF5PG51bWJlcj4ge1xyXG4gICAgICAgIGNvbnN0IGxhcmdlc3QgPSB0aGlzLmxhcmdlc3RZVmFsKGRhdGEpO1xyXG4gICAgICAgIGxldCBhcnIgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gTWF0aC5yb3VuZCgodGhpcy5ncmFwaC5oZWlnaHQgLSBkYXRhW2ldIC8gbGFyZ2VzdCAqIHRoaXMuZ3JhcGguaGVpZ2h0KSArIHRoaXMuZ3JhcGgudG9wKTtcclxuICAgICAgICAgICAgYXJyLnB1c2goaXRlbSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gYXJyO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBnZXRJbnRlclBvaW50c1koeDogbnVtYmVyLCBwb2ludEE6IG51bWJlcltdLCBwb2ludEI6IG51bWJlcltdKTogbnVtYmVyIHtcclxuICAgICAgICBjb25zdCBbeDEsIHkxXSA9IHBvaW50QTtcclxuICAgICAgICBjb25zdCBbeDIsIHkyXSA9IHBvaW50QjtcclxuICAgICAgICByZXR1cm4gKHkyIC0geTEpICogKHggLSB4MSkgLyAoeDIgLSB4MSkgKyB5MTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRkb2MgIH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5pbnRlcmZhY2UgSURhdGFTdGF0IHtcclxuICAgIHNlY3Rvcjogc3RyaW5nO1xyXG4gICAgdmFsdWU6IG51bWJlcjtcclxuICAgIGNvbG9yOiBzdHJpbmc7XHJcbn1cclxuXHJcbmludGVyZmFjZSBJR3JpZEl0ZW1Qb3NpdGlvbiB7XHJcbiAgICBjb2x1bW5fc3RhcnQ6IG51bWJlcjtcclxuICAgIGNvbHVtbl9lbmQ6IG51bWJlcjtcclxuICAgIHJvd19zdGFydDogbnVtYmVyO1xyXG4gICAgcm93X2VuZDogbnVtYmVyO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFzb25yeSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSBkYXRhOiBBcnJheTxJRGF0YVN0YXQ+ID0gW107XHJcbiAgICBwcml2YXRlICRpdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGRhdGFBcnJheTogQXJyYXk8YW55PiA9IFtdO1xyXG4gICAgcHJpdmF0ZSBhcmVhOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIGl0ZW1NYXJnaW46IG51bWJlciA9IDM7XHJcbiAgICBwcml2YXRlIGdyaWRSb3dzOiBudW1iZXIgPSAyMDtcclxuICAgIHByaXZhdGUgZ3JpZENvbHM6IG51bWJlciA9IDIwO1xyXG4gICAgcHJpdmF0ZSBncmlkQ2VsbHM6IG51bWJlciA9IHRoaXMuZ3JpZENvbHMgKiB0aGlzLmdyaWRSb3dzO1xyXG4gICAgcHJpdmF0ZSBjZWxsc0JhbGFuY2U6IG51bWJlciA9IHRoaXMuZ3JpZENlbGxzO1xyXG4gICAgcHJpdmF0ZSBncmlkQ2VsbDogYW55ID0ge1xyXG4gICAgICAgIHdpZHRoOiB0aGlzLnZpZXcud2lkdGgoKSAvIHRoaXMuZ3JpZENvbHMsXHJcbiAgICAgICAgaGVpZ2h0OiB0aGlzLnZpZXcuaGVpZ2h0KCkgLyB0aGlzLmdyaWRSb3dzLFxyXG4gICAgfTtcclxuICAgIHByaXZhdGUgbWluQ2VsbFdpZHRoOiBudW1iZXIgPSAzO1xyXG4gICAgcHJpdmF0ZSBtaW5DZWxsSGVpZ2h0OiBudW1iZXIgPSAzO1xyXG5cclxuICAgIHByaXZhdGUgaXRlbVBvc2l0aW9uaW5nOiBBcnJheTxJR3JpZEl0ZW1Qb3NpdGlvbj4gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbWFzb25yeS10aWxlJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbS5lYWNoKCAoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgZGF0YUl0ZW0gPSA8SURhdGFTdGF0PntcclxuICAgICAgICAgICAgICAgIHNlY3RvcjogJChlbCkuZGF0YSgndGlsZScpLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6ICQoZWwpLmRhdGEoJ3ZhbHVlJyksXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogJChlbCkuZGF0YSgnY29sb3InKSxcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgdGhpcy5kYXRhLnB1c2goZGF0YUl0ZW0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuYXJlYSA9ICh0aGlzLnZpZXcud2lkdGgoKSAtIHRoaXMuaXRlbU1hcmdpbiAqIDMpICogdGhpcy52aWV3LmhlaWdodCgpO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyh0aGlzLmRhdGEsIHRoaXMuYXJlYSwgJ2NlbGwgd2lkdGgnLCB0aGlzLmdyaWRDZWxsLndpZHRoLCAnY2VsbCBoZWlnaHQnLCB0aGlzLmdyaWRDZWxsLmhlaWdodCk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwdWJsaWMgcmVzaXplID0gKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludD86IElCcmVha3BvaW50LCBicENoYW5nZWQ/OiBib29sZWFuKTogdm9pZCA9PiB7XHJcbiAgICAgICAgXHJcbiAgICB9O1xyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKCk7XHJcbiAgICAgICAgdGhpcy5nZXRBcnJGcm9tT2JqZWN0KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBnZXRBcnJGcm9tT2JqZWN0KCk6IGFueSB7XHJcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkgPSBPYmplY3QuZW50cmllcyh0aGlzLmRhdGEpLnNvcnQoKGEsIGIpID0+IGFbMF0ubG9jYWxlQ29tcGFyZShiWzBdKSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMuZGF0YUFycmF5KTtcclxuXHJcbiAgICAgICAgdGhpcy5kYXRhQXJyYXkuZm9yRWFjaCggKGVsLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGVsWzFdLnZhbHVlLCBpLCAnZWwnKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBlbFsxXS52YWx1ZTtcclxuICAgICAgICAgICAgY29uc3Qgc2VjdG9yID0gZWxbMV0uc2VjdG9yO1xyXG4gICAgICAgICAgICBjb25zdCBjb2xvciA9IGVsWzFdLmNvbG9yO1xyXG4gICAgICAgICAgICBjb25zdCBpbmRleCA9IGk7XHJcblxyXG4gICAgICAgICAgICAvLyB0aGlzLnNldFRpbGVTaXplKHNlY3RvciwgdmFsdWUsIGNvbG9yLCBpbmRleCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBzZXRUaWxlU2l6ZShzZWN0b3I6IHN0cmluZywgdmFsdWU6IG51bWJlciwgY29sb3I6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSB0aGlzLiRpdGVtLmZpbHRlcignW2RhdGEtdGlsZT0nICsgc2VjdG9yICsgJ10nKTtcclxuICAgICAgICBsZXQgYXJlYSwgaCwgdywgdCwgbCwgY29sdW1uX3N0YXJ0LCBjb2x1bW5fZW5kLCByb3dfc3RhcnQsIHJvd19lbmQsIGl0ZW0sIGFyZWFHcmlkO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFyZWEgPSB0aGlzLmFyZWEgKiAodmFsdWUgLyAxMDApO1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhhcmVhLCAnOmFyZWEnLCB0aGlzLml0ZW1Qb3NpdGlvbmluZyx0aGlzLml0ZW1Qb3NpdGlvbmluZy5sZW5ndGggPiAwLCAnY2hlY2sgaWYgc29tZSBpdGVtIG9uIGFycmF5Jyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XHJcbiAgICAgICAgICAgIGNvbHVtbl9zdGFydCA9IDE7XHJcbiAgICAgICAgICAgIHJvd19zdGFydCA9IDE7XHJcbiAgICAgICAgICAgIHJvd19lbmQgPSB0aGlzLmdyaWRSb3dzO1xyXG4gICAgICAgICAgICBjb2x1bW5fZW5kID0gTWF0aC5yb3VuZChhcmVhIC8gKHRoaXMuZ3JpZENlbGwuaGVpZ2h0ICogcm93X2VuZCkgLyB0aGlzLmdyaWRDZWxsLndpZHRoKTtcclxuICAgICAgICAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSk7XHJcbiAgICAgICAgICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpZiAoaW5kZXggPiAwKSB7XHJcbiAgICAgICAgLy8gICAgIGNvbHVtbl9zdGFydCA9IHRoaXMuaXRlbVBvc2l0aW9uaW5nW2luZGV4LTFdLmNvbHVtbl9lbmQgKyAxIDwgdGhpcy5ncmlkQ29scyAtIHRoaXMubWluQ2VsbFdpZHRoID8gdGhpcy5pdGVtUG9zaXRpb25pbmdbaW5kZXgtMV0uY29sdW1uX2VuZCArIDEgOiB0aGlzLml0ZW1Qb3NpdGlvbmluZ1tpbmRleC0yXS5jb2x1bW5fZW5kICsgMTtcclxuICAgICAgICAvLyAgICAgYXJlYUdyaWQgPSBNYXRoLnJvdW5kKGFyZWEgLyAodGhpcy5ncmlkQ2VsbC53aWR0aCAqIHRoaXMuZ3JpZENlbGwuaGVpZ2h0KSkgPj0gNiA/IE1hdGgucm91bmQoYXJlYSAvICh0aGlzLmdyaWRDZWxsLndpZHRoICogdGhpcy5ncmlkQ2VsbC5oZWlnaHQpKSA6IDY7XHJcbiAgICAgICAgLy8gICAgIGFyZWFHcmlkID0gYXJlYUdyaWQgJSAyID09PSAwID8gYXJlYUdyaWQgOiBhcmVhR3JpZCAtIDE7XHJcbiAgICAgICAgLy8gICAgIGNvbHVtbl9lbmQgPSBhcmVhR3JpZCAvIHRoaXMubWluQ2VsbFdpZHRoIFxyXG5cclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coYXJlYUdyaWQsICdhbW91bnQgb2YgY2VsbHMnKTtcclxuICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIGl0ZW0gPSA8SUdyaWRJdGVtUG9zaXRpb24+e1xyXG4gICAgICAgICAgICBjb2x1bW5fc3RhcnQ6IGNvbHVtbl9zdGFydCxcclxuICAgICAgICAgICAgY29sdW1uX2VuZDogY29sdW1uX2VuZCxcclxuICAgICAgICAgICAgcm93X3N0YXJ0OiByb3dfc3RhcnQsXHJcbiAgICAgICAgICAgIHJvd19lbmQ6IHJvd19lbmQsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY3VycmVudC5jc3Moe1xyXG4gICAgICAgICAgICBwb3NpdGlvbjogJ3JlbGF0aXZlJyxcclxuICAgICAgICAgICAgb3BhY2l0eTogMSxcclxuICAgICAgICAgICAgJ2dyaWQtY29sdW1uLXN0YXJ0JzogY29sdW1uX3N0YXJ0LFxyXG4gICAgICAgICAgICAnZ3JpZC1jb2x1bW4tZW5kJzogY29sdW1uX2VuZCxcclxuICAgICAgICAgICAgJ2dyaWQtcm93LXN0YXJ0Jzogcm93X3N0YXJ0LFxyXG4gICAgICAgICAgICAnZ3JpZC1yb3ctZW5kJzogJ3NwYW4nICsgcm93X2VuZCxcclxuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBjb2xvcixcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5pdGVtUG9zaXRpb25pbmcucHVzaChpdGVtKTtcclxuICAgICAgICB0aGlzLmNlbGxzQmFsYW5jZSA9IHRoaXMuY2VsbHNCYWxhbmNlIC0gYXJlYUdyaWQ7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy5jZWxsc0JhbGFuY2UsICc6ZnJlZSBjZWxscycpO1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxufVxyXG4iLCJpbXBvcnQge0NvbXBvbmVudH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5cclxuXHJcblxyXG5pbnRlcmZhY2UgSVBhcmFsbGF4U2V0dGluZ3Mge1xyXG4gICAgZWxlbWVudHM6IEFycmF5PHN0cmluZz47XHJcbiAgICBtb3ZlWDogQXJyYXk8bnVtYmVyPjtcclxuICAgIG1vdmVZOiBBcnJheTxudW1iZXI+O1xyXG59XHJcblxyXG5cclxuaW50ZXJmYWNlIElQYXJhbGxheEVsZW1lbnREYXRhIHtcclxuICAgICRlbDogSlF1ZXJ5O1xyXG4gICAgbW92ZVg6IG51bWJlcjtcclxuICAgIG1vdmVZOiBudW1iZXI7XHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFBhcmFsbGF4IGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcbiAgICBwcml2YXRlIG1vdmVYOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIG1vdmVZOiBudW1iZXI7XHJcbiAgICBwcml2YXRlIHRpbWU6IG51bWJlciA9IDI7XHJcbiAgICBwcml2YXRlIHNldHRpbmdzOiBJUGFyYWxsYXhTZXR0aW5ncztcclxuICAgIHByaXZhdGUgaXRlbXM6IElQYXJhbGxheEVsZW1lbnREYXRhW107XHJcblxyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR0aW5ncyA9IG9wdGlvbnM7XHJcbiAgICAgICAgdGhpcy5jcmVhdGVWYWx1ZUFycmF5KCk7XHJcblxyXG4gICAgICAgIHRoaXMudmlldy5kYXRhKCdQYXJhbGxheCcsIHRoaXMpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKGJyZWFrcG9pbnQuZGVza3RvcCkge1xyXG4gICAgICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy52aWV3Lm9uKCdtb3VzZW1vdmUnLCB0aGlzLm9uTW91c2VNb3ZlKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlVmFsdWVBcnJheSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBzZWxlY3RvcnMgPSAodGhpcy5zZXR0aW5ncy5lbGVtZW50cykudG9TdHJpbmcoKS5yZXBsYWNlKC9cXHMvZywgJycpLnNwbGl0KCcsJyk7XHJcbiAgICAgICAgY29uc3QgbW92ZVggPSAodGhpcy5zZXR0aW5ncy5tb3ZlWCkubWFwKE51bWJlcik7XHJcbiAgICAgICAgY29uc3QgbW92ZVkgPSAodGhpcy5zZXR0aW5ncy5tb3ZlWSkubWFwKE51bWJlcik7XHJcblxyXG4gICAgICAgIHRoaXMuaXRlbXMgPSBzZWxlY3RvcnMubWFwKChzZWwsIGkpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgJGVsID0gdGhpcy52aWV3LmZpbmQoJy4nICsgc2VsKTtcclxuICAgICAgICAgICAgaWYgKCEkZWxbMF0pIHsgY29uc29sZS53YXJuKGBUaGVyZSBpcyBubyAuJHtzZWx9IGVsZW1lbnQgdG8gdXNlIGluIHBhcmFsbGF4YCk7IH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICRlbDogJGVsLFxyXG4gICAgICAgICAgICAgICAgbW92ZVg6IG1vdmVYW2ldLFxyXG4gICAgICAgICAgICAgICAgbW92ZVk6IG1vdmVZW2ldLFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pLmZpbHRlcigoaXRlbSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gISFpdGVtLiRlbFswXTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb25Nb3VzZU1vdmUgPSAoZXZlbnQpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLm1vdmVYID0gKCBldmVudC5jbGllbnRYIC8gd2luZG93LmlubmVyV2lkdGgpIC0gMC41O1xyXG4gICAgICAgIHRoaXMubW92ZVkgPSAoIGV2ZW50LmNsaWVudFkgLyB3aW5kb3cuaW5uZXJIZWlnaHQpIC0gMC41O1xyXG5cclxuICAgICAgICB0aGlzLmFuaW1hdGUoLXRoaXMubW92ZVgsIC10aGlzLm1vdmVZKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgYW5pbWF0ZShtb3ZlWCwgbW92ZVkpOiB2b2lkIHtcclxuICAgICAgICBpZiAoIXRoaXMuaXRlbXMpIHsgcmV0dXJuOyB9XHJcbiAgICAgICAgdGhpcy5pdGVtcy5mb3JFYWNoKChpdGVtLCBpKSA9PiB7XHJcbiAgICAgICAgICAgIGdzYXAudG8oaXRlbS4kZWwsIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiB0aGlzLnRpbWUsXHJcbiAgICAgICAgICAgICAgICB4OiBtb3ZlWCAqIGl0ZW0ubW92ZVgsXHJcbiAgICAgICAgICAgICAgICB5OiBtb3ZlWSAqIGl0ZW0ubW92ZVksXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAncG93ZXIyJyxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyBJQnJlYWtwb2ludCwgYnJlYWtwb2ludCwgQnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5pbXBvcnQgeyAkZG9jICB9IGZyb20gJy4uL1NpdGUnO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSYW5nZSBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgXHJcbiAgICBwcml2YXRlICR0cmlnZ2VyOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlIGlzT3BlbjogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSAkc2VsZWN0ZWQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJHJhZGlvOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRyaWdnZXIgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRyaWdnZXInKTtcclxuICAgICAgICB0aGlzLiRzZWxlY3RlZCA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1zZWxlY3RlZF0nKTtcclxuICAgICAgICB0aGlzLiRyYWRpbyA9IHRoaXMudmlldy5maW5kKCdpbnB1dFt0eXBlPXJhZGlvXScpO1xyXG5cclxuICAgICAgICB0aGlzLmJpbmQoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBiaW5kKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuJHRyaWdnZXIub2ZmKCcudG9nZ2xlJykub24oJ2NsaWNrLnRvZ2dsZScsIHRoaXMudG9nZ2xlKTtcclxuICAgICAgICAkZG9jLm9mZignLnNtYWxsZHJvcGRvd24nKS5vbignY2xpY2suc21hbGxkcm9wZG93bicsIHRoaXMub25DbGlja0FueXdoZXJlSGFuZGxlcik7XHJcbiAgICAgICAgdGhpcy4kcmFkaW8ub2ZmKCcuc2VsZWN0aW9uJykub24oJ2NsaWNrLnNlbGVjdGlvbicsIHRoaXMub25JdGVtQ2xpY2spO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHRvZ2dsZSA9IChlKSA9PiB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPyB0aGlzLmNsb3NlU2VsZWN0KCkgOiB0aGlzLm9wZW5TZWxlY3QoZSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgb3BlblNlbGVjdChlKTogdm9pZCB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzT3Blbikge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuYWRkQ2xhc3MoJ2lzLW9wZW4nKTtcclxuICAgICAgICAgICAgdGhpcy5pc09wZW4gPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNsb3NlU2VsZWN0KCk6IHZvaWQge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuaXNPcGVuLCAnb3Blbj8nKTtcclxuICAgICAgICBpZiAodGhpcy5pc09wZW4pIHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25DbGlja0FueXdoZXJlSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKCQoZS5jdXJyZW50VGFyZ2V0KS5oYXNDbGFzcygnanMtaXRlbScpIHx8ICF0aGlzLmlzT3BlbikgeyByZXR1cm47IH1cclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VTZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkl0ZW1DbGljayA9IChlKSA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KS5hdHRyKCd2YWx1ZScpO1xyXG5cclxuICAgICAgICB0aGlzLmNsb3NlU2VsZWN0KCk7XHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuaHRtbChjdXJyZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy4kc2VsZWN0ZWQuYXR0cignZGF0YS1zZWxlY3RlZCcsIGN1cnJlbnQpO1xyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgJGRvYyAgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgRmlsdGVycyB9IGZyb20gJy4vRmlsdGVycyc7XHJcblxyXG5leHBvcnQgY2xhc3MgU2VhcmNoIGV4dGVuZHMgQ29tcG9uZW50IHtcclxuXHJcblxyXG4gICAgcHJpdmF0ZSAkaW5wdXQ6IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGxpdmVJdGVtOiBKUXVlcnk7XHJcbiAgICBwcml2YXRlICRsaXZlTGlzdDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbUNvdW50cnk6IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaW5wdXQgPSB0aGlzLnZpZXcuZmluZCgnaW5wdXQnKTtcclxuICAgICAgICAvLyB0aGlzLiRsaXZlSXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtbGl2ZS1pdGVtJyk7XHJcbiAgICAgICAgdGhpcy4kbGl2ZUxpc3QgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWxpdmUtbGlzdCcpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5ID0gdGhpcy52aWV3LmZpbmQoJy5qcy1pdGVtLWNvdW50cnknKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRpbnB1dC5vbignZm9jdXMnLCAoKSA9PiB0aGlzLm9uRm9jdXMoKSk7XHJcbiAgICAgICAgdGhpcy4kaW5wdXQub24oJ2JsdXInLCAoKSA9PiB0aGlzLm9uQmx1cigpKTtcclxuICAgICAgICB0aGlzLiRpbnB1dC5vbignaW5wdXQnLCAoKSA9PiB0aGlzLm9uSW5wdXQoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkZvY3VzKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudmlldy5hZGRDbGFzcygnaXMtZm9jdXMnKTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uQmx1cigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLWZvY3VzJyk7XHJcbiAgICAgICAgdGhpcy52aWV3LnJlbW92ZUNsYXNzKCdpcy1saXZlc2VhcmNoaW5nJyk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHByaXZhdGUgb25JbnB1dCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRpbnB1dC52YWwoKS5sZW5ndGggPiAwID8gdGhpcy52aWV3LmFkZENsYXNzKCdpcy1saXZlc2VhcmNoaW5nJykgOiB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLWxpdmVzZWFyY2hpbmcnKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuJGxpdmVMaXN0LmZpbmQoJy5qcy1saXZlLWl0ZW0nKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGxpdmVJdGVtID0gdGhpcy52aWV3LmZpbmQoJy5qcy1saXZlLWl0ZW0nKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGxpdmVJdGVtLm9mZignLmxpdmUnKS5vbignY2xpY2subGl2ZScsIHRoaXMub25MaXZlQ2xpY2spO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTGl2ZUNsaWNrID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICB0aGlzLiRpbnB1dC52YWwoY3VycmVudC50ZXh0KCkpO1xyXG4gICAgICAgIHRoaXMuJGl0ZW1Db3VudHJ5LnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgICAgICBGaWx0ZXJzLmFkZENvdW50cnlUb0ZpbHRlcnMoY3VycmVudC50ZXh0KCkpO1xyXG4gICAgICAgIEZpbHRlcnMuc2hvd1BpY2tlZEZpbHRlcnMoKTtcclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCB7IElCcmVha3BvaW50LCBicmVha3BvaW50LCBCcmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7IENvbXBvbmVudCB9IGZyb20gJy4vQ29tcG9uZW50JztcclxuXHJcbmV4cG9ydCBjbGFzcyBTbGlkZXIgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJGl0ZW06IEpRdWVyeTtcclxuICAgIFxyXG4gICAgcHJpdmF0ZSBpbmRleDogbnVtYmVyID0gMDtcclxuICAgIHByaXZhdGUgJG5hdjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkY2FwdGlvbnM6IEpRdWVyeTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm90ZWN0ZWQgdmlldzogSlF1ZXJ5LCBwcm90ZWN0ZWQgb3B0aW9ucz8pIHtcclxuICAgICAgICBzdXBlcih2aWV3KTtcclxuXHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCcuanMtaXRlbScpO1xyXG4gICAgICAgIHRoaXMuJG5hdiA9IHRoaXMudmlldy5maW5kKCcuanMtbmF2Jyk7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbnMgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNhcHRpb24nKTtcclxuXHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgYmluZCgpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLiRuYXYub2ZmKCcubmF2Jykub24oJ2NsaWNrLm5hdicsIHRoaXMuc3dpdGNoU2xpZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc3dpdGNoU2xpZGUgPSAoZSk6IHZvaWQgPT4ge1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgdGhpcy5pbmRleCA9IGN1cnJlbnQuaW5kZXgoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJG5hdiwgMCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGl0ZW0sIDEwMCk7XHJcbiAgICAgICAgdGhpcy5zZXRBY3RpdmVFbGVtZW50KHRoaXMuJGNhcHRpb25zLCAxMDAwKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVFbGVtZW50KGVsOiBKUXVlcnksIGRlbGF5OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBlbC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgc2V0VGltZW91dCggKCkgPT4ge1xyXG4gICAgICAgICAgICBlbC5lcSh0aGlzLmluZGV4KS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgfVxyXG59IiwiaW1wb3J0IHsgQ29tcG9uZW50IH0gZnJvbSAnLi9Db21wb25lbnQnO1xyXG5pbXBvcnQgeyAkd2luZG93IH0gZnJvbSAnLi4vU2l0ZSc7XHJcbmltcG9ydCAqIGFzIFV0aWxzIGZyb20gJy4uL1V0aWxzJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgU3RhdHMgZXh0ZW5kcyBDb21wb25lbnQge1xyXG5cclxuICAgIHByaXZhdGUgJHRhYjogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkaXRlbTogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkd3JhcDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSAkY3VycmVudDogSlF1ZXJ5O1xyXG4gICAgcHJpdmF0ZSB0YWJUb1Nob3c6IG51bWJlcjsgLy8gZm9yIGFzeW5jIHN3aXRjaFxyXG4gICAgcHJpdmF0ZSAkdmlld1N3aXRjaGVyOiBKUXVlcnk7XHJcblxyXG4gICAgcHJpdmF0ZSAkc3Vidmlld3M6IEpRdWVyeTtcclxuXHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHRhYiA9IHRoaXMudmlldy5maW5kKCdbZGF0YS10YWJdJyk7XHJcbiAgICAgICAgdGhpcy4kaXRlbSA9IHRoaXMudmlldy5maW5kKCdbZGF0YS12aWV3XScpO1xyXG4gICAgICAgIHRoaXMuJHdyYXAgPSB0aGlzLnZpZXcuZmluZCgnLmpzLXRhYnMtd3JhcHBlcicpO1xyXG4gICAgICAgIHRoaXMuJHZpZXdTd2l0Y2hlciA9IHRoaXMudmlldy5maW5kKCdbZGF0YS1yYW5rXScpO1xyXG4gICAgICAgIHRoaXMuJHN1YnZpZXdzID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLWNvbXBhcmVdJyk7XHJcblxyXG4gICAgICAgIHRoaXMuYmluZCgpO1xyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlVmlldyhwYXJzZUludChVdGlscy5nZXRQYXJhbXMod2luZG93LmxvY2F0aW9uLnNlYXJjaCkudGFiLCAxMCkgfHwgMCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kdGFiLm9mZignLnRhYicpLm9uKCdjbGljay50YWInLCB0aGlzLm9uVGFiQ2xpY2spO1xyXG4gICAgICAgIHRoaXMuJHZpZXdTd2l0Y2hlci5vZmYoJy5zd2l0Y2gnKS5vbignY2xpY2suc3dpdGNoJywgdGhpcy5vblZpZXdTd2l0Y2gpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIG9uVmlld1N3aXRjaCA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9ICQoZS5jdXJyZW50VGFyZ2V0KTtcclxuICAgICAgICBjb25zdCB2aWV3ID0gY3VycmVudC5kYXRhKCdyYW5rJyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHZpZXdTd2l0Y2hlci5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgY3VycmVudC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QWN0aXZlU3Vidmlldyh2aWV3KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvblRhYkNsaWNrID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBjb25zdCBjdXJyZW50ID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG4gICAgICAgIGNvbnN0IGluZGV4ID0gY3VycmVudC5kYXRhKCd0YWInKTtcclxuICAgICAgICB0aGlzLnNldEFjdGl2ZVZpZXcoaW5kZXgpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNldEFjdGl2ZVN1YnZpZXcodmlldzogc3RyaW5nKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY3VycmVudCA9IHRoaXMuJHN1YnZpZXdzLmZpbHRlcignLmlzLWFjdGl2ZScpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuaGlkZUN1cnJlbnQoY3VycmVudCkudGhlbigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYW5DYWNoZWRBbmltKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2hvdyhudWxsLCB2aWV3KTtcclxuICAgICAgICAgICAgJHdpbmRvdy5yZXNpemUoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzZXRBY3RpdmVWaWV3KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLnRhYlRvU2hvdyA9IGluZGV4O1xyXG4gICAgICAgIHRoaXMuJHRhYi5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kdGFiLmZpbHRlcignW2RhdGEtdGFiPScgKyBpbmRleCArICddJykuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAgIHRoaXMuaGlkZUN1cnJlbnQoKS50aGVuKCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5jbGVhbkNhY2hlZEFuaW0oKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93KHRoaXMudGFiVG9TaG93KTtcclxuICAgICAgICAgICAgdGhpcy50YWJUb1Nob3cgPSBudWxsO1xyXG4gICAgICAgICAgICAkd2luZG93LnJlc2l6ZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBoaWRlQ3VycmVudChlbGVtZW50PzogSlF1ZXJ5KTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY3VycmVudCA9IGVsZW1lbnQgPyBlbGVtZW50IDogdGhpcy4kY3VycmVudDtcclxuICAgICAgICAgICAgaWYgKCFjdXJyZW50KSB7IHJlc29sdmUoKTsgcmV0dXJuOyB9XHJcbiAgICAgICAgICAgIGdzYXAudG8oY3VycmVudCwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjMsXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudC5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNsZWFuQ2FjaGVkQW5pbSgpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBhbmltID0gdGhpcy52aWV3LmZpbmQoJ1tkYXRhLXVuY2FjaGVdJyk7XHJcbiAgICAgICAgY29uc3QgdW5jYWNoZXMgPSB0aGlzLnZpZXcuZmluZCgnLnVuY2FjaGVkJyk7XHJcbiAgICAgICAgdW5jYWNoZXMucmVtb3ZlQXR0cignc3R5bGUnKTtcclxuICAgICAgICBhbmltLnJlbW92ZUNsYXNzKCdhbmltYXRlZCcpO1xyXG4gICAgICAgIHRoaXMudmlldy5maW5kKCdbZGF0YS1jb21wb25lbnRdJykuZWFjaCgoaSwgZWwpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgY29tcCA9ICQoZWwpLmRhdGEoJ2NvbXAnKSBhcyBDb21wb25lbnQ7XHJcbiAgICAgICAgICAgIGlmIChjb21wICYmIHR5cGVvZiBjb21wWydkaXNhYmxlJ10gIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgICAgICAgICAgICBjb21wWydkaXNhYmxlJ10oKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvdyhpbmRleD86IG51bWJlciwgdHlwZT86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGluZGV4LCAnaW5kZXgnKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0eXBlb2YgaW5kZXggIT0gdW5kZWZpbmVkICYmIGluZGV4ICE9IG51bGwgKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRjdXJyZW50ID0gdGhpcy4kaXRlbS5maWx0ZXIoJ1tkYXRhLXZpZXc9JyArIGluZGV4ICsgJ10nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBjdXJyZW50ID0gdHlwZW9mIGluZGV4ICE9IHVuZGVmaW5lZCAmJiBpbmRleCAhPSBudWxsID8gdGhpcy4kY3VycmVudCA6IHRoaXMuJHN1YnZpZXdzLmZpbHRlcignW2RhdGEtY29tcGFyZT0nICsgdHlwZSArICddJyk7XHJcbiAgICAgICAgICAgIGN1cnJlbnQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG5cclxuICAgICAgICAgICAgZ3NhcC5mcm9tVG8oY3VycmVudCwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMCxcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgb3BhY2l0eTogMSxcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAwLjcsXHJcbiAgICAgICAgICAgICAgICBlYXNlOiAnc2luZScsXHJcbiAgICAgICAgICAgICAgICBvbkNvbXBsZXRlOiAoKSA9PiByZXNvbHZlKCksXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIGN1cnJlbnQuZmluZCgnW2RhdGEtY29tcG9uZW50XScpLmVhY2goKGksIGVsKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb21wID0gJChlbCkuZGF0YSgnY29tcCcpIGFzIENvbXBvbmVudDtcclxuICAgICAgICAgICAgICAgIGlmIChjb21wICYmIHR5cGVvZiBjb21wWydlbmFibGUnXSAhPT0gJ3VuZGVmaW5lZCcpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb21wWydlbmFibGUnXSgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9kZWZpbml0aW9ucy9qcXVlcnkuZC50c1wiIC8+XHJcblxyXG5pbXBvcnQgeyBDb21wb25lbnQgfSBmcm9tICcuL0NvbXBvbmVudCc7XHJcbmltcG9ydCB7ICRkb2MgfSBmcm9tICcuLi9TaXRlJztcclxuaW1wb3J0IHsgYnJlYWtwb2ludCB9IGZyb20gJy4uL0JyZWFrcG9pbnQnO1xyXG5cclxuXHJcblxyXG5leHBvcnQgY2xhc3MgVG9vbHRpcCBleHRlbmRzIENvbXBvbmVudCB7XHJcblxyXG4gICAgcHJpdmF0ZSBpc09wZW46IGJvb2xlYW47XHJcbiAgICBwcml2YXRlICRidXR0b246IEpRdWVyeTtcclxuICAgIHByaXZhdGUgJGNsb3NlOiBKUXVlcnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvdGVjdGVkIHZpZXc6IEpRdWVyeSwgcHJvdGVjdGVkIG9wdGlvbnM/KSB7XHJcbiAgICAgICAgc3VwZXIodmlldyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJ1dHRvbiA9IHRoaXMudmlldy5maW5kKCcuanMtdG9nZ2xlJyk7XHJcbiAgICAgICAgdGhpcy4kY2xvc2UgPSB0aGlzLnZpZXcuZmluZCgnLmpzLWNsb3NlJykubGVuZ3RoID4gMCA/IHRoaXMudmlldy5maW5kKCcuanMtY2xvc2UnKSA6IG51bGw7XHJcbiAgICAgICAgdGhpcy5iaW5kKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIGJpbmQoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkJ1dHRvbkNsaWNrSGFuZGxlcik7XHJcblxyXG4gICAgICAgIC8vIHRoaXMudmlld1xyXG4gICAgICAgIC8vICAgICAub2ZmKCdtb3VzZW9uJykub24oJ21vdXNlZW50ZXIubW91c2VvbicsIHRoaXMub25Nb3VzZUVudGVyKVxyXG4gICAgICAgIC8vICAgICAub2ZmKCdtb3VzZW9mZicpLm9uKCdtb3VzZWxlYXZlLm1vdXNlb2ZmJywgdGhpcy5vbk1vdXNlTGVhdmUpO1xyXG5cclxuICAgICAgICAkZG9jLm9uKCdjbGljay50b29sdGlwJywgdGhpcy5vbkNsaWNrQW55d2hlcmVIYW5kbGVyKTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAodGhpcy4kY2xvc2UpIHtcclxuICAgICAgICAgICAgdGhpcy4kY2xvc2Uub24oJ2NsaWNrLnRvb2x0aXAnLCAoKSA9PiB0aGlzLmNsb3NlKCkpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIG9uTW91c2VFbnRlciA9ICgpOiB2b2lkID0+IHtcclxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbk1vdXNlTGVhdmUgPSAoKTogdm9pZCA9PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBvbkJ1dHRvbkNsaWNrSGFuZGxlciA9IChlKTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIC8vIGlmICghYnJlYWtwb2ludC5kZXNrdG9wKSB7XHJcbiAgICAgICAgLy8gICAgIGFsZXJ0KCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKCQoZS5jdXJyZW50VGFyZ2V0KVswXSk7XHJcbiAgICAgICAgLy8gfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgICAgIHRoaXMub3BlbigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2UoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBvbkNsaWNrQW55d2hlcmVIYW5kbGVyID0gKGUpOiB2b2lkID0+IHtcclxuICAgICAgICBpZiAoJChlLnRhcmdldCkuY2xvc2VzdCh0aGlzLnZpZXcpLmxlbmd0aCA8PSAwICkge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgb3BlbigpOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmlzT3BlbiA9IHRydWU7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy52aWV3LmFkZENsYXNzKCdpcy1vcGVuJyk7XHJcbiAgICAgICAgfSwgMjUwKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLmFkZENsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAvLyAgICAgaWYgKHRoaXMuaXNPcGVuKSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAvLyB9LCAzMDAwKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgY2xvc2UoKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5pc09wZW4gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnZpZXcucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudmlldy5jbG9zZXN0KCcuaGVhZGVyJykubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnZpZXcuY2xvc2VzdCgnLmhlYWRlcicpLnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkLXNoYXJlJyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbiIsImltcG9ydCB7IEhhbmRsZXIgfSBmcm9tICcuLi9IYW5kbGVyJztcclxuaW1wb3J0IHsgSUJyZWFrcG9pbnQsIGJyZWFrcG9pbnQsIEJyZWFrcG9pbnQgfSBmcm9tICcuLi9CcmVha3BvaW50JztcclxuaW1wb3J0IHsgQ29tcG9uZW50LCBDb21wb25lbnRFdmVudHMgfSBmcm9tICcuLi9jb21wb25lbnRzL0NvbXBvbmVudCc7XHJcbi8vIGltcG9ydCBCYWNrZ3JvdW5kIGZyb20gJy4uL2JhY2tncm91bmRzL0JhY2tncm91bmQnO1xyXG5pbXBvcnQgeyBjb21wb25lbnRzIH0gZnJvbSAnLi4vQ2xhc3Nlcyc7XHJcbmltcG9ydCB7ICRhcnRpY2xlLCAkYm9keSwgJG1haW4gfSBmcm9tICcuLi9TaXRlJztcclxuXHJcbmV4cG9ydCBjbGFzcyBQYWdlRXZlbnRzIHtcclxuICAgIHB1YmxpYyBzdGF0aWMgcmVhZG9ubHkgUFJPR1JFU1M6IHN0cmluZyA9ICdwcm9ncmVzcyc7XHJcbiAgICBwdWJsaWMgc3RhdGljIHJlYWRvbmx5IENPTVBMRVRFOiBzdHJpbmcgPSAnY29tcGxldGUnO1xyXG4gICAgcHVibGljIHN0YXRpYyByZWFkb25seSBDSEFOR0U6IHN0cmluZyA9ICdhcHBlbmQnO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgUGFnZSBleHRlbmRzIEhhbmRsZXIge1xyXG5cclxuICAgIHB1YmxpYyBjb21wb25lbnRzOiBBcnJheTxDb21wb25lbnQ+ID0gW107XHJcbiAgICAvLyBwdWJsaWMgYmFja2dyb3VuZHM6IHtba2V5OiBzdHJpbmddOiBCYWNrZ3JvdW5kfTtcclxuICAgIHByaXZhdGUgbG9hZGVyOiBKUXVlcnlEZWZlcnJlZDxJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkPjtcclxuXHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3RlY3RlZCB2aWV3OiBKUXVlcnksIG9wdGlvbnM/KSB7XHJcblxyXG4gICAgICAgIHN1cGVyKCk7XHJcbiAgICAgICAgdGhpcy52aWV3LmNzcyh7IG9wYWNpdHk6IDAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMuYnVpbGRDb21wb25lbnRzKHRoaXMudmlldy5wYXJlbnQoKS5maW5kKCdbZGF0YS1jb21wb25lbnRdJykpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBwcmVsb2FkIG5lY2Vzc2FyeSBhc3NldHM6XHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBsb2FkaW5nIGltYWdlcyBwcm9taXNlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBwcmVsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICAgICAgICBsZXQgaWwgPSBpbWFnZXNMb2FkZWQodGhpcy52aWV3LmZpbmQoJy5wcmVsb2FkJykudG9BcnJheSgpLCA8SW1hZ2VzTG9hZGVkLkltYWdlc0xvYWRlZE9wdGlvbnM+eyBiYWNrZ3JvdW5kOiB0cnVlIH0pO1xyXG4gICAgICAgIGxldCBpbWFnZXMgPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBpbWFnZXMgPSBpbWFnZXMuY29uY2F0KGNvbXBvbmVudC5wcmVsb2FkSW1hZ2VzKCkpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBmb3IgKGxldCB1cmwgb2YgaW1hZ2VzKSB7XHJcbiAgICAgICAgICAgIGlsLmFkZEJhY2tncm91bmQodXJsLCBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMubG9hZGVyID0gaWwuanFEZWZlcnJlZDtcclxuICAgICAgICAgICAgdGhpcy5sb2FkZXIucHJvZ3Jlc3MoKGluc3RhbmNlOiBJbWFnZXNMb2FkZWQuSW1hZ2VzTG9hZGVkLCBpbWFnZTogSW1hZ2VzTG9hZGVkLkxvYWRpbmdJbWFnZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzOiBudW1iZXIgPSBpbnN0YW5jZS5wcm9ncmVzc2VkQ291bnQgLyBpbnN0YW5jZS5pbWFnZXMubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuUFJPR1JFU1MsIHByb2dyZXNzKTtcclxuICAgICAgICAgICAgfSkuYWx3YXlzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMudHJpZ2dlcihQYWdlRXZlbnRzLkNPTVBMRVRFKTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIGNoZWNrIGlmIGFueSBDb21wb25lbnQgY2FuIGJlIGNoYW5nZWQgYWZ0ZXIgb25TdGF0ZVxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gcmV0dXJucyB0cnVlIHdoZW4gb25lIG9mIHRoZSBjb21wb25lbnRzIHRha2VzIGFjdGlvbiBpbiBvblN0YXRlIGZ1bmN0aW9uIGNhbGxcclxuICAgICAqL1xyXG4gICAgcHVibGljIG9uU3RhdGUoKTogYm9vbGVhbiB7XHJcblxyXG4gICAgICAgIGxldCBjaGFuZ2VkOiBib29sZWFuID0gISFmYWxzZTtcclxuICAgICAgICBmb3IgKGxldCBjb21wb25lbnQgb2YgdGhpcy5jb21wb25lbnRzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudENoYW5nZWQ6IGJvb2xlYW4gPSBjb21wb25lbnQub25TdGF0ZSgpO1xyXG4gICAgICAgICAgICBpZiAoIWNoYW5nZWQgJiYgISFjb21wb25lbnRDaGFuZ2VkKSB7XHJcbiAgICAgICAgICAgICAgICBjaGFuZ2VkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNoYW5nZWQ7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhZ2UgZW50ZXJpbmcgYW5pbWF0aW9uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVsYXkgYW5pbWF0aW9uIGRlbGF5XHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBhbmltYXRlSW4oZGVsYXk/OiBudW1iZXIpOiB2b2lkIHtcclxuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xyXG4gICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmNhbGxBbGwodGhpcy5jb21wb25lbnRzLCAnYW5pbWF0ZUluJyk7XHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvbXBvbmVudHMubGVuZ3RoOyArK2kpIHtcclxuICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzW2ldLmFuaW1hdGVJbihpLCBkZWxheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGdzYXAudG8odGhpcy52aWV3LCB7XHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAwLjQsXHJcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXHJcbiAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGdzYXAudG8oYmcsIHsgZHVyYXRpb246IDAuNSwgb3BhY2l0eTogMSwgZGlzcGxheTogJ2Jsb2NrJ30pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHBhZ2UgZXhpdCBhbmltYXRpb25cclxuICAgICAqIChjYWxsZWQgYWZ0ZXIgbmV3IGNvbnRlbnQgaXMgbG9hZGVkIGFuZCBiZWZvcmUgaXMgcmVuZGVyZWQpXHJcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSBhbmltYXRpb24gcHJvbWlzZVxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgYW5pbWF0ZU91dCgpOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgICAgICBjb25zdCBiZyA9ICQoJyNiYWNrZ3JvdW5kcy1maXhlZCcpO1xyXG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiB0aGUgcGFnZTpcclxuICAgICAgICAkbWFpbi5yZW1vdmVDbGFzcygnaXMtbG9hZGVkJyk7XHJcbiAgICAgICAgZ3NhcC5zZXQoYmcsIHsgb3BhY2l0eTogMCwgZGlzcGxheTogJ25vbmUnfSk7XHJcbiAgICAgICAgbGV0IHBhZ2VBbmltYXRpb25Qcm9taXNlID0gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBnc2FwLnRvKHRoaXMudmlldywge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDAuNCxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJGJvZHkucmVtb3ZlQXR0cignY2xhc3MnKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBvcGFjaXR5OiAwLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gYW5pbWF0aW9ucyBvZiBhbGwgY29tcG9uZW50czpcclxuICAgICAgICBsZXQgY29tcG9uZW50QW5pbWF0aW9uczogQXJyYXk8UHJvbWlzZTx2b2lkPj4gPSB0aGlzLmNvbXBvbmVudHMubWFwKChvYmopOiBQcm9taXNlPHZvaWQ+ID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIDxQcm9taXNlPHZvaWQ+Pm9iai5hbmltYXRlT3V0KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIHJldHVybiBvbmUgcHJvbWlzZSB3YWl0aW5nIGZvciBhbGwgYW5pbWF0aW9uczpcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgbGV0IGFsbFByb21pc2VzOiBBcnJheTxQcm9taXNlPHZvaWQ+PiA9IGNvbXBvbmVudEFuaW1hdGlvbnMuY29uY2F0KHBhZ2VBbmltYXRpb25Qcm9taXNlKTtcclxuXHJcbiAgICAgICAgICAgIFByb21pc2UuYWxsPHZvaWQ+KGFsbFByb21pc2VzKS50aGVuKChyZXN1bHRzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVmlzaWJpbGl0eSB3aWRnZXQgaGFuZGxlciwgZmlyZXMgd2hlbiB1c2VyIGV4aXRzIGJyb3dzZXIgdGFiXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyB0dXJuT2ZmKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9mZicpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZpc2liaWxpdHkgd2lkZ2V0IGhhbmRsZXIsIGZpcmVzIHdoZW4gdXNlciBleGl0cyBicm93c2VyIHRhYlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgdHVybk9uKCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgndHVybk9uJyk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIHJlc2l6ZSBoYW5kbGVyXHJcbiAgICAgKiBAcGFyYW0ge1t0eXBlXX0gd2R0ICAgICAgICB3aW5kb3cgd2lkdGhcclxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBoZ3QgICAgICAgIHdpbmRvdyBoZWlnaHRcclxuICAgICAqIEBwYXJhbSB7W3R5cGVdfSBicmVha3BvaW50IElCcmVha3BvaW50IG9iamVjdFxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVzaXplKHdkdDogbnVtYmVyLCBoZ3Q6IG51bWJlciwgYnJlYWtwb2ludDogSUJyZWFrcG9pbnQsIGJwQ2hhbmdlZD86IGJvb2xlYW4pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmNhbGxBbGwoJ3Jlc2l6ZScsIHdkdCwgaGd0LCBicmVha3BvaW50LCBicENoYW5nZWQpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBjbGVhbnVwIHdoZW4gY2xvc2luZyBQYWdlXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBkZXN0cm95KCk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuY2FsbEFsbCgnZGVzdHJveScpO1xyXG4gICAgICAgIHRoaXMuY29tcG9uZW50cyA9IFtdO1xyXG4gICAgICAgIC8vIHRoaXMuYmFja2dyb3VuZHMgPSB7fTtcclxuXHJcbiAgICAgICAgZ3NhcC5raWxsVHdlZW5zT2YodGhpcy52aWV3KTtcclxuICAgICAgICB0aGlzLnZpZXcgPSBudWxsO1xyXG5cclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcm90ZWN0ZWQgYnVpbGRDb21wb25lbnRzKCRjb21wb25lbnRzOiBKUXVlcnkpOiB2b2lkIHtcclxuICAgICAgICBmb3IgKGxldCBpID0gJGNvbXBvbmVudHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuICAgICAgICAgICAgY29uc3QgJGNvbXBvbmVudDogSlF1ZXJ5ID0gJGNvbXBvbmVudHMuZXEoaSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE5hbWU6IHN0cmluZyA9ICRjb21wb25lbnQuZGF0YSgnY29tcG9uZW50Jyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGNvbXBvbmVudE5hbWUsIGNvbXBvbmVudHMpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbXBvbmVudE5hbWUgIT09IHVuZGVmaW5lZCAmJiBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBvcHRpb25zOiBPYmplY3QgPSAkY29tcG9uZW50LmRhdGEoJ29wdGlvbnMnKSxcclxuICAgICAgICAgICAgICAgICAgICBjb21wb25lbnQ6IENvbXBvbmVudCA9IG5ldyBjb21wb25lbnRzW2NvbXBvbmVudE5hbWVdKCRjb21wb25lbnQsIG9wdGlvbnMpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wb25lbnRzLnB1c2goY29tcG9uZW50KTtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudC5vbihDb21wb25lbnRFdmVudHMuQ0hBTkdFLCB0aGlzLm9uQ29tcG9uZW50Q2hhbmdlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5jb25zb2xlLndhcm4oJ1RoZXJlIGlzIG5vIGAlc2AgY29tcG9uZW50IScsIGNvbXBvbmVudE5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgb25Db21wb25lbnRDaGFuZ2UgPSAoZWwpOiB2b2lkID0+IHtcclxuICAgICAgICB0aGlzLmJ1aWxkQ29tcG9uZW50cyhlbC5maWx0ZXIoJ1tkYXRhLWNvbXBvbmVudF0nKS5hZGQoZWwuZmluZCgnW2RhdGEtY29tcG9uZW50XScpKSk7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKFBhZ2VFdmVudHMuQ0hBTkdFLCBlbCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vIHNob3J0IGNhbGxcclxuICAgIHByaXZhdGUgY2FsbEFsbChmbjogc3RyaW5nLCAuLi5hcmdzKTogdm9pZCB7XHJcbiAgICAgICAgZm9yIChsZXQgY29tcG9uZW50IG9mIHRoaXMuY29tcG9uZW50cykge1xyXG4gICAgICAgICAgICBpZiAodHlwZW9mIGNvbXBvbmVudFtmbl0gPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBvbmVudFtmbl0uYXBwbHkoY29tcG9uZW50LCBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxufVxyXG4iLCJpbXBvcnQgeyBTY3JvbGwgfSBmcm9tICcuLi9TY3JvbGwnO1xyXG4vLyBpbXBvcnQgeyBBUEksIElBcGlEYXRhIH0gZnJvbSAnLi9BcGknO1xyXG5pbXBvcnQgeyBQdXNoU3RhdGVzIH0gZnJvbSAnLi4vUHVzaFN0YXRlcyc7XHJcbmltcG9ydCB7IEV4cGFuZCB9IGZyb20gJy4vRXhwYW5kJztcclxuaW1wb3J0ICogYXMgVXRpbHMgZnJvbSAnLi4vVXRpbHMnO1xyXG5pbXBvcnQgeyBicmVha3BvaW50IH0gZnJvbSAnLi4vQnJlYWtwb2ludCc7XHJcbmltcG9ydCB7ICRib2R5IH0gZnJvbSAnLi4vU2l0ZSc7XHJcblxyXG5cclxuZXhwb3J0IHR5cGUgRWxlbWVudFNlbGVjdG9yID0gRWxlbWVudCB8IE5vZGVMaXN0IHwgQXJyYXk8RWxlbWVudD4gfCBzdHJpbmc7XHJcblxyXG5leHBvcnQgY2xhc3MgV2lkZ2V0cyB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IEVsZW1lbnRTZWxlY3Rvcik6IHZvaWQge1xyXG5cclxuICAgICAgICAvLyBBUEkuYmluZCh0YXJnZXQpO1xyXG4gICAgICAgIEV4cGFuZC5iaW5kKHRhcmdldCk7XHJcblxyXG5cclxuICAgICAgICBjb25zdCAkdGFyZ2V0ID0gJCh0eXBlb2YgdGFyZ2V0ICE9PSAndW5kZWZpbmVkJyA/IHRhcmdldCBhcyB7fSA6ICdib2R5Jyk7XHJcblxyXG4gICAgICAgICR0YXJnZXQuZmluZCgnW2RhdGEtc2hhcmVdJykub2ZmKCkub24oJ2NsaWNrLnNoYXJlJywgdGhpcy5vblNoYXJlQ2xpY2spO1xyXG4gICAgICAgICR0YXJnZXQuZmluZCgnW2RhdGEtcHJpbnRdJykub2ZmKCkub24oJ2NsaWNrLnByaW50JywgdGhpcy5vblByaW50Q2xpY2spO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uU2hhcmVDbGljayA9IChlKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBsZXQgd2luV2lkdGggPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW53aWR0aCcpLCAxMCkgfHwgNTIwLFxyXG4gICAgICAgICAgICB3aW5IZWlnaHQgPSBwYXJzZUludCgkKGUuY3VycmVudFRhcmdldCkuYXR0cignZGF0YS13aW5oZWlnaHQnKSwgMTApIHx8IDM1MCxcclxuICAgICAgICAgICAgd2luVG9wID0gKHNjcmVlbi5oZWlnaHQgLyAyKSAtICh3aW5IZWlnaHQgLyAyKSxcclxuICAgICAgICAgICAgd2luTGVmdCA9IChzY3JlZW4ud2lkdGggLyAyKSAtICh3aW5XaWR0aCAvIDIpO1xyXG5cclxuICAgICAgICBsZXQgaHJlZiA9IGUuY3VycmVudFRhcmdldC5ocmVmLFxyXG4gICAgICAgICAgICBkYXRhID0gJChlLmN1cnJlbnRUYXJnZXQpLmRhdGEoJ3NoYXJlJyk7XHJcblxyXG4gICAgICAgIGlmIChkYXRhID09PSAnZmFjZWJvb2snIHx8IGRhdGEgPT09ICdnb29nbGUnKSB7XHJcbiAgICAgICAgICAgIGhyZWYgKz0gZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHdpbmRvdy5vcGVuKGhyZWYsICdzaGFyZXInICsgZGF0YSwgJ3RvcD0nICsgd2luVG9wICsgJyxsZWZ0PScgKyB3aW5MZWZ0ICsgJyx0b29sYmFyPTAsc3RhdHVzPTAsd2lkdGg9JyArIHdpbldpZHRoICsgJyxoZWlnaHQ9JyArIHdpbkhlaWdodCk7XHJcblxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIHByaXZhdGUgc3RhdGljIG9uUHJpbnRDbGljayA9IChlKTogYm9vbGVhbiA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHdpbmRvdy5wcmludCgpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIC8vIHByaXZhdGUgc3RhdGljIG9uU2Nyb2xsRG93bkNsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XHJcbiAgICAvLyAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgLy8gICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAvLyAgICAgU2Nyb2xsLnNjcm9sbCh7XHJcbiAgICAvLyAgICAgICAgIHk6IHdpbmRvdy5pbm5lckhlaWdodCxcclxuICAgIC8vICAgICB9KTtcclxuICAgIC8vIH1cclxuXHJcblxyXG5cclxuICAgIC8vIHByaXZhdGUgc3RhdGljIG9uU2Nyb2xsVG9wQ2xpY2sgPSAoZTogSlF1ZXJ5RXZlbnRPYmplY3QpOiB2b2lkID0+IHtcclxuICAgIC8vICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAvLyAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgIC8vICAgICBTY3JvbGwuc2Nyb2xsKHtcclxuICAgIC8vICAgICAgICAgeTogMCxcclxuICAgIC8vICAgICB9KTtcclxuICAgIC8vIH1cclxuXHJcblxyXG59XHJcbiIsImltcG9ydCB7IFNjcm9sbCB9IGZyb20gJy4vLi4vU2Nyb2xsJztcclxuaW1wb3J0IHsgRWxlbWVudFNlbGVjdG9yIH0gZnJvbSAnLi9BbGwnO1xyXG5pbXBvcnQgeyAkd2luZG93LCBlYXNpbmcsICRuYXZiYXIgfSBmcm9tICcuLi9TaXRlJztcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgRXhwYW5kIHtcclxuXHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBiaW5kKHRhcmdldD86IEVsZW1lbnRTZWxlY3Rvcik6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0ICR0YXJnZXQgPSAkKHR5cGVvZiB0YXJnZXQgIT09ICd1bmRlZmluZWQnID8gdGFyZ2V0IDogJ2JvZHknKTtcclxuICAgICAgICAkdGFyZ2V0LmZpbmQoJ1thcmlhLWNvbnRyb2xzXScpLm9mZigpLm9uKCdjbGljay5hcmlhJywgRXhwYW5kLm9uQXJpYUNvbnRyb2xzQ2xpY2spO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdiaW5kIGV4cGFuZCcsIHRhcmdldCwgJHRhcmdldCwgJHRhcmdldC5maW5kKCdbYXJpYS1jb250cm9sc10nKSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBwcml2YXRlIHN0YXRpYyBvbkFyaWFDb250cm9sc0NsaWNrID0gKGU6IEpRdWVyeUV2ZW50T2JqZWN0KTogdm9pZCA9PiB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHRoYXQgPSAkKGUuY3VycmVudFRhcmdldCk7XHJcbiAgICAgICAgY29uc3QgaWQgPSB0aGF0LmF0dHIoJ2FyaWEtY29udHJvbHMnKTtcclxuICAgICAgICBjb25zdCBpc0V4cGFuZGVkID0gdGhhdC5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICd0cnVlJztcclxuICAgICAgICBjb25zdCB0YXJnZXQgPSAkKCcjJyArIGlkKTtcclxuICAgICAgICBjb25zdCBjdXJyZW50U2Nyb2xsUG9zaXRpb24gPSB3aW5kb3cuc2Nyb2xsWSA/IHdpbmRvdy5zY3JvbGxZIDogJHdpbmRvdy5zY3JvbGxUb3AoKTtcclxuXHJcbiAgICAgICAgdGFyZ2V0LmFkZCh0YXJnZXQuY2hpbGRyZW4oKSkuY3NzKHtcclxuICAgICAgICAgICAgcG9zaXRpb246ICdyZWxhdGl2ZScsXHJcbiAgICAgICAgICAgIG92ZXJmbG93OiAnaGlkZGVuJyxcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKCFpc0V4cGFuZGVkKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBleHBhbmQ6XHJcbiAgICAgICAgICAgIHRhcmdldC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtdG9nZ2xlZCcpO1xyXG5cclxuICAgICAgICAgICAgdGFyZ2V0LnNob3coKTtcclxuICAgICAgICAgICAgdGFyZ2V0LmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGhndCA9IHRhcmdldC5jaGlsZHJlbigpLm91dGVySGVpZ2h0KHRydWUpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgd2luZG93LnNjcm9sbFRvKDAsIGN1cnJlbnRTY3JvbGxQb3NpdGlvbik7XHJcblxyXG4gICAgICAgICAgICBnc2FwLmZyb21Ubyh0YXJnZXQsIHtcclxuICAgICAgICAgICAgICAgIGhlaWdodDogMCxcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgZHVyYXRpb246IGhndCAvIDEwMDAsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGhndCxcclxuICAgICAgICAgICAgICAgIGVhc2U6IGVhc2luZyxcclxuICAgICAgICAgICAgICAgIG9uQ29tcGxldGU6ICgpOiB2b2lkID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCAndHJ1ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGdzYXAuc2V0KHRhcmdldCwgeyBoZWlnaHQ6ICdhdXRvJ30pO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5kYXRhKCdhcmlhLWxlc3MnKSkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5odG1sKHRoYXQuZGF0YSgnYXJpYS1sZXNzJykpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5kYXRhKCdleHBhbmQnKSA9PT0gZmFsc2UpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAvLyBjb2xsYXBzZTpcclxuICAgICAgICAgICAgdGFyZ2V0LnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy10b2dnbGVkJyk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBoZ3QgPSB0YXJnZXQucGFyZW50KCkuaGVpZ2h0KCk7XHJcbiAgICAgICAgICAgIC8vIFNjcm9sbC5zY3JvbGxUb0VsZW1lbnQodGFyZ2V0LCAyMCwgMC41KTtcclxuICAgICAgICAgICAgZ3NhcC50byh0YXJnZXQsIHtcclxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBoZ3QgLyAxMDAwLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiAwLFxyXG4gICAgICAgICAgICAgICAgZWFzZTogZWFzaW5nLFxyXG4gICAgICAgICAgICAgICAgb25Db21wbGV0ZTogKCk6IHZvaWQgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0LmhpZGUoKTtcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQuZGF0YSgnYXJpYS1tb3JlJykpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuaHRtbCh0aGF0LmRhdGEoJ2FyaWEtbW9yZScpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG4iXX0=
