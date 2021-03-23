/// <reference path="../definitions/modernizr.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />

import { Handler } from '../Handler';
import * as Utils from '../Utils';
import { $doc } from '../Site';
import { breakpoint } from '../Breakpoint';
import { browser } from '../Browser';


export interface ISwipeCoordinates {
    x?: number;
    y?: number;
    startX?: number;
    startY?: number;
    deltaX?: number;
    deltaY?: number;
    direction?: string;
}

export interface ISwipeOptions {
    vertical?: boolean;
    horizontal?: boolean;
    minimum?: number;
    disableMouse?: boolean;
    disableTouch?: boolean;
    handler?: JQuery | HTMLElement | string;
}

export class SwipeEvents {
    public static START: string = 'start';
    public static UPDATE: string = 'update';
    public static END: string = 'end';
}

export class SwipeAxes {
    public static HORIZONTAL: string = 'h';
    public static VERTICAL: string = 'v';
}

export class SwipeDirections {
    public static LEFT: string = 'left';
    public static RIGHT: string = 'right';
    public static UP: string = 'up';
    public static DOWN: string = 'down';
    public static NONE: string = 'none';
    public static CLICK: string = 'click';
}



export class Swipe extends Handler {

    public swiping: boolean = false;

    // delta of current movement:
    public deltaX: number = 0;
    public deltaY: number = 0;

    // current position:
    public x: number = 0;
    public y: number = 0;

    private $handler: JQuery;
    private startX: number = 0;
    private startY: number = 0;
    private uid: string;
    private mouse: ISwipeCoordinates = { x: 0, y: 0 };
    private dragged: boolean = false;
    private axe: SwipeAxes = null;

    private offsetX: number = 0;
    private offsetY: number = 0;

    private disabled: boolean = false;

    private settings: ISwipeOptions;



    constructor(protected view: JQuery, protected options?: ISwipeOptions) {
        super();

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



    public destroy(): void {
        super.destroy();
        this.unbind();
    }



    public toggle(enable: boolean): void {
        this.disabled = !enable;
        this.updateCursor();
    }



    public end(): void {
        if (!!this.swiping) {
            this.endSwipe();
            this.axe = null;
        }
    }



    public resize(): void {
        const sT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
        this.offsetX = this.view.offset().left;
        this.offsetY = this.view.offset().top - sT;
    }



    private updateCursor(): void {
        let isMouseDisabled = !Modernizr.touchevents && !!this.settings.disableMouse;
        this.$handler.toggleClass('is-grabbable', !this.disabled && !isMouseDisabled);
    }



    private bind(): void {

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

            $doc
                .off('.swipe' + this.uid)
                .on('touchend.swipe' + this.uid, this.onTouchEnd);
        }
    }



    private unbind(): void {
        this.view.off('.swipe');
        $doc.off('.swipe' + this.uid);
    }



    private onMouseDown = (e): void => {
        e.stopPropagation();

        if ((e.which && e.which === 3) || (e.button && e.button === 2)) { return; } // right click

        e.preventDefault();
        this.mouse.startX = (e.clientX || e.pageX) - this.offsetX;
        this.mouse.startY = (e.clientY || e.pageY) - this.offsetY;
        this.startSwipe();
    };



    private onMouseMove = (e): void => {
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

            // this.view.find('a').css({ 'pointer-events': 'none' });
        }
    };



    private onMouseUp = (e): void|boolean => {
        if (!!this.swiping) {
            e.preventDefault();
            e.stopPropagation();
            this.endSwipe();
            return false;
        }

        this.view.find('a').css({ 'pointer-events': '' });

        this.axe = null;
    };



    private onTouchStart = (e): void => {
        // e.stopPropagation();
        // e.preventDefault();

        this.mouse.startX = e.originalEvent.touches[0].pageX;
        this.mouse.startY = e.originalEvent.touches[0].pageY;
        this.startSwipe();
    };



    private onTouchMove = (e): void => {
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
                // e.preventDefault();
                this.updateSwipe();
            } else if (this.axe) {
                this.swiping = false;
            }
        }
    };



    private onTouchEnd = (e): void => {
        e.stopPropagation();

        if (!!this.swiping) {
            // e.preventDefault();
            this.endSwipe();
        }
        this.axe = null;
    };



    private startSwipe(): void {

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



    private updateSwipe(): void {

        let x = this.startX + this.mouse.x - this.mouse.startX,
            y = this.startY + this.mouse.y - this.mouse.startY;

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



    private endSwipe(): void {
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
