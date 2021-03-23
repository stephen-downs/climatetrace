/// <reference path="../definitions/youtube.d.ts" />

import { Player, IPlayerSettings } from './Player';
import { browser } from '../Browser';
import * as Utils from '../Utils';



export class Youtube extends Player {

    static allYoutubeInstances: Array<Youtube> = [];

    protected uid: string;
    protected videoEl: JQuery;
    public isNative = false;

    private id: string;
    private player: YT.Player;
    private currentState = -1;
    private interval;
    private timeoutCreateYoutubePlayer;



    constructor(protected view: JQuery, options?: Object) {
        super(view, options);
        Youtube.allYoutubeInstances.push(this);
    }



    public play(): void {
        this.player.playVideo();
    }



    public pause(): void {
        window.clearTimeout(this.interval);
        if (this.player && typeof this.player.pauseVideo === 'function') {
            if (this.currentState === 1 || this.currentState === 3) {
                this.player.pauseVideo();
            }
        }
    }



    public toggle(e?: JQueryEventObject): void {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        switch (this.currentState) {

            case 0: // ended (zakoÅ„czono)
            case -1: // unstarted (nie uruchomiono)
            case 2: // paused (wstrzymano)
            case 5: // video cued (film zostaÅ‚ wskazany)
                this.play();
                break;

            case 1: // playing (odtwarzanie)
            case 3: // buffering (buforowanie)
                this.pause();
                break;

            default:
                this.play();
                break;
        }
    }



    public seek(seek): void {
        let goTo = parseInt('' + this.player.getDuration() * seek, 10);
        this.player.seekTo(goTo, true);
        this.play();
    }



    public setVolume(value: number): void {
        this.player.setVolume(value * 100);
        this.updateVolume(value);
    }



    public toggleMute(): void {
        const vol = this.player.isMuted() || this.player.getVolume() === 0 ? 100 : 0;
        this.player.setVolume(vol);
        this.updateVolume(vol, vol === 0);
    }



    public createPlayer(): void {
        if (typeof this.settings.id !== 'undefined') {
            this.timeoutCreateYoutubePlayer = setTimeout(() => {
                const playerVars: YT.PlayerVars = {
                    autohide: 1,
                    autoplay: this.settings.autoplay ? 1 : 0,
                    cc_load_policy: 0,
                    controls: 0,
                    disablekb: 1,
                    enablejsapi: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    loop: this.settings.loop ? 1 : 0,
                    modestbranding: 1,
                    origin: window.location.origin,
                    playsinline: 1,
                    rel: 0,
                    showinfo: 0,
                };

                if (!!browser.mobile) {
                    playerVars.autoplay = 0;
                    this.isNative = true;
                }

                this.player = new YT.Player(this.id, {
                    videoId: <string>this.settings.id,
                    width: this.settings.width,
                    height: this.settings.height,
                    playerVars: playerVars,
                    events: {
                        'onReady': (): void =>  this.onPlayerReady(),
                        'onStateChange': (event): void =>  this.onPlayerStateChange(event),
                    },
                });
            }, 300);
        } else {
            console.warn('You should provide Youtube ID!');
        }
    }



    public preload(): Promise<void> {
        return Promise.resolve();
    }



    public load(data: IPlayerSettings): any | Promise<any> {
        return this.player.loadVideoById({
            videoId: <string>data.id,
        });
    }



    public destroy(): void {
        Youtube.allYoutubeInstances.splice(Youtube.allYoutubeInstances.indexOf(this), 1);
        super.destroy();
    }



    public unload(): void {
        if (this.player) {

            if (typeof this.player.stopVideo === 'function') {
                this.player.stopVideo();
            }

            if (typeof this.player.clearVideo === 'function') {
                this.player.clearVideo();
            }

            if (typeof this.player.destroy === 'function') {
                this.player.destroy();
            }
        }
    }



    protected isPaused(): boolean {
        return this.player && typeof this.player.getPlayerState === 'function' && this.player.getPlayerState() !== 1 && this.player.getPlayerState() !== 3;
    }



    protected setup(): void {

        if (!this.view.find('.youtube')[0]) {
            this.view.append('<div class="youtube">');
        }
        this.videoEl = this.view.find('.youtube');


        // set unique id
        this.id = 'youtube-' + this.uid;
        this.videoEl.attr('id', this.id);


        // leave native YT player on mobile browsers:
        if (!!browser.mobile) {
            if (this.videoEl[0].nodeName === 'iframe') {
                let iframeSource = this.videoEl.attr('src');
                iframeSource = iframeSource.split('?')[0] + '?showinfo=0&controls=0&rel=0'; // youtube url needs to be clean (without autoplay)
                this.videoEl.attr('src', iframeSource);
            }
            this.view.addClass('is-native');
            this.settings.autoplay = false;
            this.isNative = true;
        }


        // setup poster image
        this.settings.poster = this.settings.poster || '//img.youtube.com/vi/' + this.settings.id + '/maxresdefault.jpg';


        // load YT API:
        if (typeof (YT) === 'undefined' || typeof (YT.Player) === 'undefined') {
            (window as any).onYouTubePlayerAPIReady = () => this.onYouTubeIframeAPIReady();
            $.getScript('//www.youtube.com/iframe_api');
        } else {
            this.createPlayer();
        }


        // add controls:
        this.buildUI();


        this.resize();
    }



    protected bindPlayer(): void {
        if (screenfull.isEnabled) {
            document.addEventListener(screenfull.raw.fullscreenchange, () => {
                this.view.toggleClass('is-fullscreen', screenfull.isFullscreen);
            });
        }
    }



    protected unbindPlayer(): void {
        // can't remove event listeners tough :(
    }



    protected onPlay(): void {
        super.onPlay();

        window.clearTimeout(this.interval);
        this.interval = setInterval(() => {
            this.onDurationChange();
            this.onProgress();
            this.onTimeupdate();
        }, 100);
    }



    protected onDurationChange(): void {
        let duration = this.player.getDuration();
        if (!duration) { return; }
        this.controls.duration.text(Utils.parseToTime(duration));
    }



    protected onProgress(): void {
        let buffered = this.player.getVideoLoadedFraction();
        this.controls.loaded.width((buffered * 100) + '%');
    }



    protected onTimeupdate(): void {
        let current = this.player.getCurrentTime();
        if (!current) {
            return;
        }
        this.controls.time.text(Utils.parseToTime(current));
        this.controls.progress.width((current / this.player.getDuration() * 100) + '%');
        this.view.toggleClass('is-started', current > this.settings.ready_time);
    }



    protected onEnd(): void {
        super.onEnd();
        window.clearTimeout(this.interval);
    }



    private onYouTubeIframeAPIReady(): void {
        Youtube.allYoutubeInstances.forEach((item) => item.createPlayer());
    }



    private onPlayerReady = (): void => {
        this.bind();
        this.resize();
    }



    private onPlayerStateChange = (event): void => {
        const state = this.player.getPlayerState();

        switch (state) {
            case -1: // unstarted (nie uruchomiono)
                break;

            case 0: // ended (zakoÅ„czono)
                this.onEnd();
                break;

            case 1: // playing (odtwarzanie)
                this.onCanplay();
                this.onPlay();
                this.onPlaying();
                break;

            case 2: // paused (wstrzymano)
                this.onPause();
                break;

            case 3: // buffering (buforowanie)
                this.onWaiting();
                break;

            case 5: // video cued (film zostaÅ‚ wskazany)
                break;

            default:
                break;
        }

        this.currentState = state;
    }
}

interface Window {
    onYouTubePlayerAPIReady?: Function;
}
