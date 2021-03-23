/// <reference path="../definitions/vimeo.d.ts" />

import { Player, IPlayerSettings } from './Player';
import { browser } from '../Browser';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';

import * as Utils from '../Utils';



export class VimeoCustom extends Player {

    static allVimeoInstances: Array<VimeoCustom> = [];

    protected uid: string;
    protected videoEl: JQuery;
    protected width: number;
    protected height: number;
    protected isLoaded: boolean;

    public isNative: boolean;

    private currentVimeoId: number | Error;
    private elementId: string;
    private player: Vimeo.Player;
    private duration: number = null;
    private paused: boolean = true;
    private shown: boolean = false;
    private volume: number = 1;



    constructor(protected view: JQuery, options?: Object) {
        super(view, options);
        VimeoCustom.allVimeoInstances.push(this);
    }



    public play(): void {
        this.player.play();
    }



    public pause(): void {
        this.player.pause();
    }



    public toggle(e?: JQueryEventObject): void {
        if (e) {
            e.stopPropagation();
        }

        this.player.getPaused().then((paused) => {
            if (!paused) {
                this.pause();
            } else {
                this.play();
            }
        });
    }



    public seek(seek): void {
        if (!this.duration) { return; }
        let goTo = parseInt('' + this.duration * seek, 10);
        this.player.setCurrentTime(goTo);
    }



    public setVolume(value: number): void {
        this.volume = value;
        this.player.setVolume(value);
        this.updateVolume(value);
    }



    public toggleMute(): void {
        this.player.setVolume(this.volume > 0 ? 0 : 1);
    }



    public createPlayer(): void {

        if (typeof this.settings.id !== 'undefined') {
            let options = {
                id: this.settings.id,
                title: 0,
                byline: 0,
                portrait: 0,
                autopause: 0,
                autoplay: !!this.settings.autoplay && !this.isNative ? 1 : 0,
                loop: !!this.settings.loop && breakpoint.desktop ? 1 : 0,
                background: 1,
            };

            this.player = new Vimeo.Player(this.elementId, options);
            this.player.ready().catch((e) => { window.console.error(e); }).then(this.onPlayerReady);
            this.view.addClass('is-vimeo');

            this.bind();
            this.resize();

        } else {
            console.warn('You should provide Vimeo ID!');
        }
    }



    public load(data: IPlayerSettings): Promise<number|any> {

        // disable loading the same video:
        if (data.id === this.currentVimeoId) {
            return new Promise<number>((resolve, reject) => {
                resolve(<number>data.id);
            });
        }

        // if different video:
        this.isLoaded = false;
        this.isReady = false;
        this.view.removeClass('is-ready is-ended is-playing');

        this.resetTimeline();

        return this.player.loadVideo(<number>data.id).then((id) => { // the video successfully loaded

            this.updateDuration();

            if (!!this.settings.autoplay) {
                this.player.play();
            }

            if (typeof data.poster !== 'undefined') {
                this.settings.poster = data.poster;
                this.settings.poster_mobile = data.poster_mobile;
                this.loadPoster();
            }
            this.isLoaded = true;

            this.view.removeClass('is-ended');

        }).catch((error) => {
            console.error(error.name);
        });
    }



    public preload(): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            if (!this.settings.autoplay) {
                // window.console.info('> Vimeo without autoplay');
                resolve(true);
            } else if (!!this.isNative) {
                // window.console.info('> Vimeo native');
                resolve(true);
            } else if (this.isLoaded) {
                // window.console.info('> Vimeo already loaded');
                resolve(true);
            } else {
                const preloadingInterval = setInterval(() => {
                    if ((!!this.settings.autoplay && !!this.isReady) || (!this.settings.autoplay && this.isLoaded)) {
                        window.clearInterval(preloadingInterval as any);
                        resolve(true);
                    }
                }, 250);
            }
        });
    }



    public unload(): void {
        if (this.player) {
            this.player.unload();
        }
    }



    public destroy(): void {
        this.unload();
        VimeoCustom.allVimeoInstances.splice(VimeoCustom.allVimeoInstances.indexOf(this), 1);
        super.destroy();
    }


    // public animateIn(): void {
    //     super.animateIn();
    // }



    protected setup(): void {

        if (!this.view.find('.vimeo')[0]) {
            this.view.append('<div class="vimeo">');
        }
        this.videoEl = this.view.find('.vimeo');

        // set unique id
        this.elementId = 'vimeo-' + this.uid;
        this.videoEl.attr('id', this.elementId);


        // leave native Vimeo player on mobile browsers:
        if (!!browser.mobile) {
            if (this.videoEl[0].nodeName === 'iframe') {
                let iframeSource = this.videoEl.attr('src');
                iframeSource = iframeSource.split('?')[0] + '?showinfo=0&controls=0&rel=0&loop=1'; // youtube url needs to be clean (without autoplay)

                this.videoEl.attr('src', iframeSource);
            }
            this.view.addClass('is-native');
            this.settings.autoplay = false;
            this.isNative = true;
        }

        // add controls:
        this.buildUI();

        // build VimeoAPI player:
        this.createPlayer();

        this.resize();
    }



    protected bindPlayer(): void {

        this.player.getVolume().then((volume) => this.updateVolume(volume));
        this.updateDuration();

        this.player.on('play', () => {
            this.paused = false;
            this.onPlay();
            this.onPlaying();
        });
        this.player.on('pause', (time) => {
            this.paused = true;
            this.onPause();
        });
        this.player.on('ended', (time) => this.onEnd());
        this.player.on('timeupdate', (time) => this.onTimeupdate(time));
        this.player.on('progress', (time) => this.onProgress(time));
        this.player.on('volumechange', (data) => { this.updateVolume(data.volume); });
        this.player.on('error', (data) => this.onError(data));
        this.player.on('loaded', (data) => {
            this.currentVimeoId = data.id;
        });

        if (!this.settings.ratio) {
            this.player.getVideoWidth().then((width) => {
                this.width = width;
                this.resize();
            });
            this.player.getVideoHeight().then((height) => {
                this.height = height;
                this.resize();
            });
        }

        if (screenfull.isEnabled) {
            document.addEventListener(screenfull.raw.fullscreenchange, () => {
                this.view.toggleClass('is-fullscreen', screenfull.isFullscreen);
            });
        }
    }



    protected unbindPlayer(): void {
        this.player.off('play');
        this.player.off('pause');
        this.player.off('ended');
        this.player.off('timeupdate');
        this.player.off('progress');
        this.player.off('volumechange');
        this.player.off('error');
        // this.player.off('loaded');
    }


    protected onDurationChange(duration: number): void {
        this.duration = duration;
        this.controls.duration.text(Utils.parseToTime(duration));
    }


    protected onProgress(loadedTime: Vimeo.Time): void {
        this.controls.loaded.width((loadedTime.percent * 100) + '%');
    }


    protected onTimeupdate(currentTime: Vimeo.Time): void {
        this.controls.time.text(Utils.parseToTime(currentTime.seconds));
        this.controls.progress.width((currentTime.percent * 100) + '%');
        this.view.toggleClass('is-played', currentTime.percent > 0);
        this.view.toggleClass('is-ended', currentTime.percent === 1);
        this.view.toggleClass('is-started', currentTime.seconds > this.settings.ready_time);
        this.view.addClass('is-playing');
    }


    protected isPaused(): boolean {
        return this.paused;
    }



    protected onEnd(): void {
        this.player.setCurrentTime(0);
        super.onEnd();
    };



    private onPlayerReady = (): void => {

        this.isLoaded = true;
        console.log('playerReady');

        // this.bind();
        // this.resize();

        if (this.shown && !!this.settings.autoplay) {
            this.player.play();
        }
    };



    private updateDuration(): void {
        this.player.getDuration().then((duration) => this.onDurationChange(duration));
    }
}
