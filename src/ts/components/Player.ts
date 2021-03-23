/// <reference path="../definitions/screenfull.d.ts" />
/// <reference path="../definitions/modernizr.d.ts" />
/// <reference path="../definitions/jquery.d.ts" />


import {Component} from './Component';
import { $doc, $window } from '../Site';
import { Swipe, SwipeEvents } from './Swipe';
import * as Utils from '../Utils';
import { browser } from '../Browser';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';

export interface IPlayerSettings {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    controls?: boolean;
    full?: boolean;

    id?: string | number;
    src?: string;
    src_mobile?: string;
    poster?: string;
    poster_mobile?: string;

    ratio?: number;
    ratio_mobile?: number;
    width?: number;
    height?: number;
    size?: PlayerSize;

    volume?: number;
    hotkeys?: boolean;
    ready_time?: number; // started class
    tracking?: Array<ITrackingElem>;
}

export interface IPlayerElements {
    duration?: JQuery;
    fullBtn?: JQuery;
    loaded?: JQuery;
    next?: JQuery;
    playBtn?: JQuery;
    playerBar?: JQuery;
    poster?: JQuery;
    prev?: JQuery;
    progress?: JQuery;
    scrubber?: JQuery;
    time?: JQuery;
    title?: JQuery;
    toggleBtn?: JQuery;
    volume?: JQuery;
    volumeBar?: JQuery;
    volumeButton?: JQuery;
    volumeValue?: JQuery;
    captions?: JQuery;
    cc?: JQuery;
    spots?: Array<ISpotData>;
    cta?: JQuery;
    share?: JQuery;
}


export interface ISpotData {
    $el?: JQuery;
    id?: string;
    $hotspot?: JQuery;
    $lightbox?: JQuery;
    start?: number;
    stop?: number;
}


export interface ITrackingElem {
    breakpoint: number;
    isSend: boolean;
    value: string;
}


export class PlayerEvents {
    public static END = 'end';
    public static NEXT = 'next';
    public static PREV = 'prev';
}


export class PlayerSize {
    public static COVER = 'cover';
    public static CONTAIN = 'contain';
    public static AUTO = 'auto';
}


export abstract class Player extends Component {


    public static instances: Array<Player> = [];


    protected uid: string;
    protected mediaEl: JQuery;
    protected controls: IPlayerElements;
    protected isLoaded: boolean;
    protected scrubbing: boolean;
    protected volumeUpdating: boolean;
    protected settings: IPlayerSettings;
    protected isReady = false;
    protected isTracking = true;
    protected isFullscreen = false;
    protected wasPaused = false;

    private timeout;
    private wasPlaying: boolean;
    private isPlayed: boolean;
    private isFinished: boolean;
    private swipe: Swipe;
    private $wrapper: JQuery;


    constructor(protected view: JQuery, options?: Object) {
        super(view, options);

        // extend settings:
        this.settings = $.extend({
            autoplay: false,
            loop: false,
            muted: false,
            controls: false,
            volume: 1,
            width: 480,
            height: 270,
            size: PlayerSize.AUTO,
            ready_time: 0.001,
            hotkeys: true,
        }, options || view.data('options') || {});


        // generate unique id:
        this.uid = Utils.generateUID();

        this.$wrapper = this.view.find('.js-player-wrapper');

        this.isPlayed = false;
        this.isFinished = false;

        // setup:
        this.setup();
        this.resize();

        // store the object in the DOM element
        // and in instances array:
        this.view.data('player', this);
        if (typeof Player.instances === 'undefined') { Player.instances = []; }
        Player.instances.push(this);

        this.view.addClass('is-initialized');
    }



    // pause all instances of Player class:
    static pauseAll(uid?: string): void {
        Player.instances.forEach((item) => {
            if (typeof uid === undefined || uid !== item.uid) {
                item.pause();
            }
        });
    }



    // pause all instances of Player class inside element:
    static pauseAllIn($el: JQuery): void {
        Player.instances.forEach((item) => {
            if (item.view.closest($el)[0]) {
                item.pause();
            }
        });
    }



    public abstract play(): void;
    public abstract pause(): void;
    public abstract toggle(e?: JQueryEventObject): void;
    public abstract seek(value): void;
    public abstract toggleMute(): void;
    public abstract setVolume(value): void;
    public abstract createPlayer(): void;
    public abstract unload(): void;
    public abstract load(data: IPlayerSettings): any | Promise<any>;
    public abstract preload(): Promise<any>;

    public hide(): void { this.view.hide(); }
    public show(): void { this.view.show(); }



    public resize = (): void => {

        if (!this.settings.ratio && this.settings.width && this.settings.height) {
            this.settings.ratio = this.settings.width / this.settings.height;
        }

        const size = this.settings.size;
        const mediaRatio = !!browser.mobile && this.settings.ratio_mobile ? this.settings.ratio_mobile : this.settings.ratio;

        switch (size) {

            case PlayerSize.AUTO:
                this.view.addClass('is-proportional');
                this.$wrapper.css('padding-top', 100 / mediaRatio + '%');
                break;

            case PlayerSize.CONTAIN:
                const width = this.view.parent().width();
                this.view.removeClass('is-proportional');
                this.$wrapper.css({
                        width: width,
                        height: width * 0.5625,
                    });
            case PlayerSize.COVER:
                const wrap: JQuery = this.view.parent();
                const wrapWidth: number = wrap.width();
                const wrapHeight: number = this.settings.full ? wrap.height() < $window.height() ? $window.height() : wrap.height() : wrap.height();
                const wrapRatio: number = wrapWidth / wrapHeight;
                
                this.view.addClass('is-covering');

                let wdt: number;
                if (size === PlayerSize.CONTAIN) {
                    wdt = wrapRatio < mediaRatio ? wrapWidth : wrapHeight * mediaRatio;
                } else if (size === PlayerSize.COVER) {
                    wdt = wrapRatio < mediaRatio ? wrapHeight * mediaRatio : wrapWidth;
                }

                const hgt = wdt / mediaRatio;
                const marginLeft = size === PlayerSize.CONTAIN ? 'auto' : Math.min(0, (wrapWidth - wdt) * 0.5);
                const marginRight = size === PlayerSize.CONTAIN ? 'auto' : '';
                const marginTop = Math.min(0, (wrapHeight - hgt) * 0.5);

                this.view.removeClass('is-proportional');
                this.$wrapper.css({
                        width: wdt,
                        height: hgt,
                        marginRight: marginRight,
                        marginLeft: marginLeft,
                        marginTop: marginTop,
                        paddingTop: '',
                    });
                break;

            default:
                break;
        }
    }



    protected abstract isPaused(): boolean;
    protected abstract setup(): void;
    protected abstract bindPlayer(): void;
    protected abstract unbindPlayer(): void;



    protected toggleFullscreen(): void {

        if (screenfull.isEnabled) {
            screenfull.toggle(this.view[0]);

            if (this.isTracking) {
                this.isFullscreen = !this.isFullscreen;
                
            }
        } else {
            let video;
            video = <any>this.view.find('video')[0];
            video.webkitSetPresentationMode('fullscreen');
        }
    }



    protected buildUI(): void {


        this.controls = {};
        this.controls.poster = this.view.find('.player__poster');
        this.controls.title = this.view.find('.player__title');
        this.controls.playerBar = this.view.find('.player__bar');
        this.controls.toggleBtn = this.view.find('.player__playpause');
        this.controls.playBtn = this.view.find('.player__toggle');
        this.controls.fullBtn = this.view.find('.player__full');
        this.controls.volume = this.view.find('.player__volume');
        this.controls.volumeBar = this.view.find('.volume__bar');
        this.controls.volumeValue = this.view.find('.volume__value');
        this.controls.volumeButton = this.view.find('.volume__button');
        this.controls.scrubber = this.view.find('.player__scrubber');
        this.controls.duration = this.view.find('.player__duration');
        this.controls.time = this.view.find('.player__played');
        this.controls.loaded = this.view.find('.player__loaded');
        this.controls.progress = this.view.find('.player__progress');
        this.controls.prev = this.view.find('.player__prev');
        this.controls.next = this.view.find('.player__next');
        this.controls.captions = this.view.find('.player__captions');
        this.controls.cc = this.view.find('.player__cc');
        this.controls.share = this.view.find('.social__button');
        this.controls.spots = this.view.find('.js-video-spots').toArray().map((el, i) => {
            const $spot = $(el);

            return {
                $el: $spot,
                id: $spot.data('id'),
                $hotspot: $(`#video-hotspot-${$spot.data('id')}`),
                $lightbox: $(`#video-lightbox-${$spot.data('id')}`),
                start: $spot.data('show'),
                stop: $spot.data('hide') !== '' ? $spot.data('hide') : $spot.data('show') + 4,
            };
        });
        this.controls.cta = this.view.find('.cta');

        if (this.controls.cta.length > 0) {
            this.view.addClass('has-cta');
        }

        if (!!this.settings.autoplay) {
            this.view.addClass('has-autoplay');
        }

        this.view.addClass('has-controls');

        if (this.settings.muted) {
            this.setVolume(0);
        }

        if (!!this.controls.spots && this.controls.spots.length > 0) {
            this.buildHotspots();
        }

        // poster
        this.loadPoster();

    }



    protected bind(): void {
        if (this.controls) {
            this.controls.toggleBtn.on('click', this.onToggleClick);
            this.controls.playBtn.on('click', this.onToggleClick);
            this.controls.cta.on('click', this.onToggleClick);
            this.controls.fullBtn.on('click', this.onFullClick);
            this.controls.prev.on('click', this.onPrevClick);
            this.controls.next.on('click', this.onNextClick);
            this.controls.share.on('click', this.onShareClick);
            this.controls.volumeButton.on('click', this.onVolumeButtonClick);

            this.controls.scrubber
                .on('mousedown', this.onScrubberDown)
                .on('click', this.onScrubberClick);
            this.controls.cc.on('click', this.toggleSubtitles);
            this.controls.spots.forEach(spot => {
                spot.$el.on('click', this.onSpotClick);
                spot.$hotspot.on('click', (e) => {this.openLightbox(e, spot.$lightbox); });
                spot.$lightbox.find('.btn__close').on('click', (e) => {this.closeLightbox(e, spot.$lightbox); });
            });

            if (Modernizr.touchevents) {
                this.swipe = new Swipe(this.controls.scrubber, {vertical: true});

                this.swipe
                    .on(SwipeEvents.START, (data): void => {
                        let posX = data.x;
                        let width = this.controls.scrubber.width();
                        let value = Math.max(0, Math.min(1, posX / width));

                        // this.controls.progress.width(value * 100 + '%');
                        this.seek(value);
                    })
                    .on(SwipeEvents.UPDATE, (data): void => {
                        let posX = data.x - this.controls.scrubber.offset().left;
                        let width = this.controls.scrubber.width();
                        let value = Math.max(0, Math.min(1, posX / width));

                        // this.controls.progress.width(value * 100 + '%');
                        this.seek(value);
                    });
            }

            if (breakpoint.desktop) {
                this.controls.volumeBar
                    .on('mousedown', this.onVolumeDown)
                    .on('click', this.onVolumeClick);
            }
        }


        this.view
            .off('.player')
            .on('mousemove.player', this.onMouseMove)
            .on('mouseup.player', this.onMouseUp)
            .on('mouseleave.player', this.onMouseLeave)
            .on('click.player', this.onClick);

        $doc.off('.player-' + this.uid).on('keydown.player-' + this.uid, this.onKeyDown);

        this.bindPlayer();
    }



    protected unbind(): void {

        if (this.controls) {
            this.controls.toggleBtn.off();
            this.controls.playBtn.off();
            this.controls.scrubber.off();
            this.controls.fullBtn.off();
            this.controls.volumeBar.off();
        }

        this.unbindPlayer();

    }



    protected onDurationChange(data?): void {}
    protected onProgress(data?): void {}
    protected onTimeupdate(data?): void {}



    protected onCanplay(): void {
        this.view.addClass('is-canplay').removeClass('is-error');
    }



    protected onPlay(): void {
        if (!this.isPlayed && !!this.isTracking) {
            this.isPlayed = true;
        }

        if (this.wasPaused && !!this.isTracking) {
            this.wasPaused = false;
        }
        this.view.addClass('is-played').removeClass('is-ended is-error is-share-open');
        Player.pauseAll(this.uid);
    }



    protected onPlaying(): void {
        this.view
            .addClass('is-playing')
            .removeClass('is-loading is-error');
    }



    protected onPause(): void {
        this.view.removeClass('is-playing is-share-open');

        if (!!this.isTracking) {
            this.wasPaused = true;
        }
    }



    protected onWaiting(): void {
        this.view
            .removeClass('is-playing')
            .addClass('is-loading');
    }



    protected onEnd(): void {
        this.view.removeClass('is-playing is-played is-started').addClass('is-ended');
        if (!this.settings.autoplay) {
            this.trigger(PlayerEvents.END);
        }
        if (!this.isFinished && !!this.isTracking) {
            this.isFinished = true;
        }
    }



    protected onError(e): void {
        if (this.view && e.target.networkState && e.target.networkState === 3) {
            console.warn('Can\'t load media ' + (e.target as HTMLMediaElement).src);
            this.view.addClass('is-error');
        }
    }



    protected onFullClick = (e): void => {
        e.stopPropagation();
        this.toggleFullscreen();
    }



    protected onNextClick = (e): void => {
        e.preventDefault();
        e.stopPropagation();
    }



    protected onClick = (e): void => {
        if ($(e.target).closest('.player__bar').length === 0 && $(e.target).closest('.playlist').length === 0 ) {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            this.view.removeClass('is-share-open');
        }
    }



    protected onKeyDown = (e: JQueryEventObject): void | boolean => {
        if (!!this.settings.hotkeys && (e.keyCode || e.which) === Utils.keys.space) {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
            return false;
        }
    }



    protected onMouseUp = (e): void => {
        if (!!this.scrubbing) {
            e.stopPropagation();
            let seek = (e.pageX - this.controls.scrubber.offset().left) / this.controls.scrubber.width();
            this.seek(seek);
        }
        this.scrubbing = false;
        this.volumeUpdating = false;
        this.view.removeClass('is-scrubbing');
    }



    protected onMouseLeave = (e): void => {
        this.scrubbing = false;
        this.volumeUpdating = false;
        this.view.removeClass('is-scrubbing');
    }



    protected onMouseMove = (e): void => {
        this.view.addClass('is-mousemove');
        window.clearTimeout(this.timeout);
        this.timeout = setTimeout(() => {
            this.hideBar();
        }, 2000);

        if (!!this.scrubbing) {
            e.stopPropagation();
            let posX = e.pageX - this.controls.scrubber.offset().left;
            let width = this.controls.scrubber.width();
            let value = Math.max(0, Math.min(1, posX / width));
            this.controls.progress.width(value * 100 + '%');
            this.seek(value);
        }

        if (!!this.volumeUpdating) {
            e.stopPropagation();
            let posX = e.pageX - this.controls.volumeBar.offset().left;
            let width = this.controls.volumeBar.width();
            let value = Math.max(0, Math.min(1, posX / width));
            this.setVolume(value);
        }
    }



    protected onVolumeClick = (e): void => {

        e.stopPropagation();

        let offset = this.controls.volumeBar.offset(),
            valuePos = e.clientX - offset.left,
            value = valuePos / this.controls.volumeBar.outerWidth();

        this.setVolume(value);
    }



    protected onVolumeButtonClick = (e): void => {
        e.preventDefault();

        this.toggleMute();
    }



    protected onVolumeDown = (e): void => {
        e.stopPropagation();
        this.volumeUpdating = true;
    }



    protected onScrubberDown = (e): void => {
        e.stopPropagation();
        this.scrubbing = true;
        this.view.addClass('is-scrubbing');
    }



    protected onScrubberClick = (e): void => {
        e.stopPropagation();
        let seek = (e.pageX - $(e.currentTarget).offset().left) / $(e.currentTarget).width();
        this.seek(seek);
    }




    protected updateSpots(time): void {
        this.controls.spots.forEach(spot => {
            const isActive = time >= spot.start && time <= spot.stop;
            spot.$el.toggleClass('active', isActive);
            spot.$hotspot.toggleClass('active', isActive);
        });
    }




    protected onSpotClick = (e): void => {
        e.stopPropagation();
        let seek = $(e.currentTarget).data('show') / 100;
        this.seek(seek);
        Player.pauseAll();
    }




    protected openLightbox = (e: JQueryEventObject, $lightbox: JQuery): void => {
        e.stopPropagation();

        Player.pauseAll();
        this.view.addClass('is-lightbox');
        $lightbox.addClass('active');
    }



    protected closeLightbox = (e: JQueryEventObject, $lightbox: JQuery): void => {
        // e.stopPropagation();

        this.view.removeClass('is-lightbox');
        $lightbox.removeClass('active');
    }



    protected toggleSubtitles = (e): void => {
        e.stopPropagation();

        if (this.controls.cc.hasClass('is-active')) {
            this.controls.cc.removeClass('is-active');
            this.controls.captions.css('opacity', 0);
        } else {
            this.controls.cc.addClass('is-active');
            this.controls.captions.css('opacity', 1);
        }
    }



    protected onToggleClick = (e): void => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
    }



    protected onPrevClick = (e): void => {
        e.preventDefault();
        e.stopPropagation();
    }



    protected onShareClick = (e): void => {
        e.stopPropagation();

        if (this.view.hasClass('is-share-open')) {
            this.view.removeClass('is-share-open');
        } else {
            this.view.addClass('is-share-open');
        }
    }



    protected loadPoster(): void {
        if (this.settings.poster) {
            const poster = !!browser.mobile && this.settings.poster_mobile && this.settings.poster_mobile !== '' ? this.settings.poster_mobile : this.settings.poster;
            if (this.controls && this.controls.poster) {
                this.controls.poster.css('background-image', 'url(' + poster + ')');
            }
        }

        this.view.toggleClass('has-poster', !!this.settings.poster);
    }



    protected resetTimeline(): void {
        if (this.controls) {
            this.controls.time.text(Utils.parseToTime(0));
            this.controls.progress.width(0);
            this.controls.loaded.width(0);
        }
    }



    protected updateTimeline(duration: number, buffered?: number, current?: number): void {
        if (!duration || !this.controls) { return; }
        this.controls.duration.text(Utils.parseToTime(duration));
        if (current) { this.controls.time.text(Utils.parseToTime(current || 0)); }
        if (buffered) { this.controls.loaded.width((Math.max(buffered, (current || 0)) / duration * 100) + '%'); }
        this.controls.progress.width((current / duration * 100) + '%');
        if (!!this.settings.tracking) { this.sendTrackingBreakpoints(current / duration * 100); }
        if (current) { this.view.toggleClass('is-started', current > this.settings.ready_time); }
        if (current && duration) { this.updateSpots(Math.ceil(current / duration * 100)); }
    }



    protected updateVolume(volume: number, isMuted = false): void {
        // console.log(volume, isMuted);

        this.view.toggleClass('is-muted', isMuted);

        // if (this.isTracking && typeof WpTracking !== 'undefined') {
        // }
        if (this.controls && this.controls.volumeValue) {
            this.controls.volumeValue.css({ width: volume * 100 + '%' });
        }
    }



    protected showPlayerBar(): void {
        this.view.addClass('show-playerbar');
        setTimeout(() => {
            this.view.removeClass('show-playerbar');
        }, 2500);
    }



    protected hideBar(): void {
        // if (!this.controls.playerBar.is(':hover')) {
            this.view.removeClass('is-mousemove');
        // }
    }



    protected sendTrackingBreakpoints(progress: number): void {
        for (let index = 0; index < this.settings.tracking.length; index++) {
            if (progress > this.settings.tracking[index].breakpoint && !this.settings.tracking[index].isSend) {
                this.settings.tracking[index].isSend = true;
                // Tracking.sendDataToOmniture(this.settings.tracking[index].value);
            }
        }
    }



    protected buildHotspots(): void {
        this.view.addClass('has-hotspots');
        this.controls.spots.forEach(spot => {
            spot.$el.css('left', spot.start + '%');
        });
    }
}
