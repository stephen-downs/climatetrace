// / <reference path="./definitions/jquery.d.ts" />

import * as Utils from './Utils';
import { debug } from './Site';



declare var $body;

export interface IApiData {
    url: string;
    beforeCall?: string;
    callback?: string;
    form?: any;
    params?: any;
    like?: boolean;
    action?: 'POST' | 'DELETE' | 'GET' | 'PUT' | 'PATCH';
}


export class API {



    private static beforeCalls = {

        login: function(data: IApiData, $el: JQuery): void {
            if (!$body.hasClass('is-logged')) {
                $('.js-login').last().trigger('click');
                return;
            } else {
                API.callIt(data, $el);
            }
        },


        validate: function(data: IApiData, $el: JQuery): void {
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

            // if ( !!data.params ) {
            //     if (data.params.validateOne !== undefined) {
            //         stepValidation =  data.params.validateOne;
            //     } else {
            //         stepValidation = false;
            //     }

            //     if (data.params.scrollTo !== undefined) {
            //         scrollTo =  data.params.scrollTo;
            //     } else {
            //         scrollTo = false;
            //     }
            // } else {
            //     scrollTo = false;
            // }

            $validationElem.find('.js-error').text('');

            $validationElem.find('[required]:input').each((index: number, input: Element) => {
                if (input.nodeName === 'INPUT' ) {

                    switch ((input as HTMLInputElement).type) {

                        case 'email':
                            let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                            let value = (input as HTMLInputElement).value;
                            if (!re.test(value)) {
                                passed = false;
                                message = Utils.translations[value.length > 0 ? 'invalid-email' : 'required-field']['en'];
                                $(input).addClass('is-error');
                                $(input).nextAll('.js-error').text(message);

                                // if (stepValidation) {
                                //     if (scrollTo) {
                                //         Project.Scrolling.scrollToElement($(input), false, -30);
                                //     }
                                //     return false;
                                // }
                            } else {
                                $(input).removeClass('is-error');
                            }
                            break;

                        case 'checkbox':
                            if (!(input as HTMLInputElement).checked) {
                                passed = false;
                                message = '';
                                message = !message ? Utils.translations['required-field']['en'] : message;
                                $(input).addClass('is-error');
                                $(input).nextAll('.js-error').text(message);

                                // if (stepValidation) {
                                //     if (scrollTo) {
                                //         Project.Scrolling.scrollToElement($(input), false, -30);
                                //     }
                                //     return false;
                                // }
                            } else {
                                $(input).removeClass('is-error');
                            }
                            break;

                        case 'text':
                            let val = (input as HTMLInputElement).value;
                            if (val.length < 1) {
                                passed = false;
                                message = '';
                                message = !message ? Utils.translations['required-field']['en'] : message;
                                if ($(input).hasClass('js-postal')) {message = Utils.translations['invalid-zip']['en']}
                                $(input).addClass('is-error');
                                $(input).nextAll('.js-error').text(message);

                                // if (stepValidation) {
                                //     if (scrollTo) {
                                //         Project.Scrolling.scrollToElement($(input), false, -30);
                                //     }
                                //     return false;
                                // }
                        
                            } else {
                                $(input).removeClass('is-error');
                            }
                            break;

                        case 'number':

                            
                            break;
                        case 'phone':
                            let valTel = (input as HTMLInputElement).value;
                            if (valTel.length < 1) {
                                passed = false;
                                message = '';
                                message = !message ? Utils.translations['required-field']['en'] : message;
                                $(input).addClass('is-error');
                                $(input).nextAll('.js-error').text(message);

                                // if (stepValidation) {
                                //     if (scrollTo) {
                                //         Project.Scrolling.scrollToElement($(input), false, -30);
                                //     }
                                //     return false;
                                // }
                            } else {
                                $(input).removeClass('is-error');
                            }
                            break;

                        default:
                            break;
                    }

                }

                if (input.nodeName === 'TEXTAREA') {
                    let val = (input as HTMLTextAreaElement).value;
                    if (val.length < 1) {
                        passed = false;
                        message = '';
                        message = !message ? Utils.translations['required-field']['en'] : message;
                        $(input).addClass('is-error');
                        $(input).nextAll('.js-error').text(message);

                        // if (stepValidation) {
                        //     if (scrollTo) {
                        //         Project.Scrolling.scrollToElement($(input), false, -30);
                        //     }
                        //     return false;
                        // }
                    } else {
                        $(input).removeClass('is-error');
                    }
                }
            });

            $validationElem.find('input[name=zipcode]').each((index: number, input: Element) => {
                let val = (input as HTMLTextAreaElement).value;

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
            } else {
                $form.addClass('has-errors');
            }
        },

    };



    private static callbacks = {

        onCookiesClose: function(data: IApiData, $el: JQuery, response): void {
            $el.parent().addClass('is-hidden');
        },

        onSubscribe: function(data: IApiData, $el: JQuery, response): void {
            console.log('onSubscribe');
            let $message = $el.find('.js-message');
            let scrollTo;

            // if (data.scrollTo !== undefined) {
            //     scrollTo =  data.scrollTo;
            // } else {
            //     scrollTo = false;
            // }


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
            } else {
                $el.addClass('is-error');
            }
            // if (scrollTo) {
            //     Project.Scrolling.scrollToElement($message, false, -30);
            // }
            $el.find('input').trigger('blur');
        },

    };



    public static bind(target?: any): void {

        const $target = $(typeof target !== 'undefined' ? target : 'body');

        $target.find('[data-api]').not('form').off('.api').on('click.api', API.onAction);
        $target.find('form[data-api]').off('.api').on('submit.api', API.onAction).attr('novalidate', 'novalidate');
    }



    public static callIt(data: IApiData, $el: JQuery, customCallback?: Function):  Promise<any> {
        
        data = API.preprocessData(data, $el);

        $el.addClass('is-doing-request');

        const action = data.action || 'POST';
        delete data.action;

        const url = data.url || window.location.pathname;
        delete data.url;

        $el.addClass('is-doing-request');

        return new Promise<any>((resolve, reject) => {

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

                if (!!debug) {
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

    private static preprocessData(data: IApiData, $el: JQuery): IApiData {

        // get data if api called on form element:
        if ($el.is('form')) {
            data.url = !data.url && $el.attr('action') ? $el.attr('action') : data.url;
            data = $.extend(data, $el.find(':input').serializeObject());

            console.log('data form', data, data.params,data.form, $el.find(':input'));

        }

        // update data if api called on link element:
        if ($el.is('[href]')) {
            data.url = !data.url && $el.attr('href') ? $el.attr('href') : data.url;
        }

        // get additional data from external form:
        if (data.form && $(data.form as string)[0]) {
            data = $.extend(data, $(data.form as string).serializeObject());
            delete data.form;
        }

        // flatten:
        if (data.params) {
            data = $.extend(data, data.params);
            delete data.params;
        }
        console.log('data pre', data, data.params);
        return data;
    }

    private static onAction = (e: JQueryEventObject): void => {
        e.preventDefault();
        e.stopPropagation();

        let $el = $(e.currentTarget as HTMLElement);
        const data: IApiData = {...$(e.currentTarget).data('api')};
        console.log(data, 'data');
        if ($el.is('form')) {
            $el.addClass('is-submitted');
        } else {
            $el.closest('form').addClass('is-submitted');
        }

        // beforeCall handler:
        if (data.beforeCall) {
            if (data.beforeCall in API.beforeCalls) {
                API.beforeCalls[data.beforeCall](data, $el);
                return;
            }
        }

        API.callIt(data, $el);
    };



    private static onSuccess = (data: IApiData, $el: JQuery, response): void => {

        if (data.callback) {
            if (data.callback in API.callbacks) {
                API.callbacks[data.callback](data, $el, response);
            }
        }
    };
}