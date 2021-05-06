/// <reference path="../definitions/jquery.d.ts" />

import { Component } from './Component';
import { $doc } from '../Site';
import { breakpoint } from '../Breakpoint';



export class Tooltip extends Component {

    private isOpen: boolean;
    private $button: JQuery;
    private $close: JQuery;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$button = this.view.find('.js-toggle');
        this.$close = this.view.find('.js-close').length > 0 ? this.view.find('.js-close') : null;
        this.bind();
    }



    private bind(): void {
        this.$button.on('click.tooltip', this.onButtonClickHandler);

        // this.view
        //     .off('mouseon').on('mouseenter.mouseon', this.onMouseEnter)
        //     .off('mouseoff').on('mouseleave.mouseoff', this.onMouseLeave);

        $doc.on('click.tooltip', this.onClickAnywhereHandler);
        
        if (this.$close) {
            this.$close.on('click.tooltip', () => this.close());
        }
    }

    private onMouseEnter = (): void => {
        if (!this.isOpen) {
            this.open();
        }

        
    }

    private onMouseLeave = (): void => {
        if (this.isOpen) {
            this.close();
        }
    }

    private onButtonClickHandler = (e): void => {
        e.stopPropagation();
        e.preventDefault();

        // if (!breakpoint.desktop) {
        //     alert($(e.currentTarget)[0]);
        //     console.log($(e.currentTarget)[0]);
        // }

        if (!this.isOpen) {
            this.open();
        } else {
            this.close();
        }
    };



    private onClickAnywhereHandler = (e): void => {
        if ($(e.target).closest(this.view).length <= 0 ) {
            this.close();
        }
    };



    private open(): void {
        this.isOpen = true;

        setTimeout( () => {
            this.view.addClass('is-open');
        }, 250);

        if (this.view.closest('.header').length > 0) {
            this.view.closest('.header').addClass('is-toggled-share');
        }

        // setTimeout(() => {
        //     if (this.isOpen) {
        //         this.close();
        //     }
        // }, 3000);
    }



    private close(): void {
        this.isOpen = false;
        this.view.removeClass('is-open');

        if (this.view.closest('.header').length > 0) {
            this.view.closest('.header').removeClass('is-toggled-share');
        }
    }
}
