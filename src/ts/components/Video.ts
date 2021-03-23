/// <reference path="../definitions/screenfull.d.ts" />

import { Player, IPlayerSettings } from './Player';
import { browser } from '../Browser';

export enum MediaState {
    HAVE_NOTHING,
    HAVE_METADATA,
    HAVE_CURRENT_DATA,
    HAVE_FUTURE_DATA,
    HAVE_ENOUGH_DATA,
}



export class Video extends Player {


    public mediaIndex = 0;
    public userPaused = false;
    protected media: HTMLVideoElement | HTMLAudioElement;
    protected isAudio: boolean;
    private isShown = false;
    private tracks: TextTrack;
    private cues;
    private lastTime: number;


    constructor(protected view: JQuery, options?: Object) {
        super(view, options);

        this.view.data('Video', this);
    }



    public preload(): Promise<boolean> {
        let state = !browser.safari ? MediaState.HAVE_ENOUGH_DATA : MediaState.HAVE_METADATA;
        return new Promise<boolean>((resolve, reject) => {
            if (!!browser.mobile || !this.settings.autoplay) {
                resolve(true);
            } else if (this.media.readyState >= state) {
                resolve(true);
            } else {
                this.mediaEl.on('loadeddata', () => {
                    if (this.media.readyState >= state) {
                        resolve(true);
                    }
                });
            }
        });
    }



    public load(data: IPlayerSettings): Promise<number|{}> {
        return new Promise<boolean>((resolve, reject) => {

            let src = !!browser.mobile && data.src_mobile && data.src_mobile !== '' ? data.src_mobile : data.src;
            src = this.decodeURL(src);

            this.media.pause();
            this.media.src = src;
            this.view.removeClass('is-ended is-started is-played is-playing');
            this.media.load();

            this.resetTimeline();

            if (this.settings.autoplay && this.isShown) {
                this.play();
            }

            this.settings.ratio = data.ratio;
            this.settings.ratio_mobile = data.ratio_mobile;
            this.resize();

            this.settings.poster = data.poster;
            this.settings.poster_mobile = data.poster_mobile;
            this.loadPoster();


            resolve(true);

        });
    }



    public play(): void {
        if (this.media.paused) {
            const playPromise = this.media.play();
            // console.log('video play');

            // show poster if autoplay fails:
            setTimeout(() => {
                this.view.addClass('should-play');
            }, 1000);

            if (playPromise !== undefined) {
                (playPromise).then(() => {
                    this.view.removeClass('autoplay-failed');
                }).catch((error) => {
                    this.view.addClass('autoplay-failed');
                });
            }
        }
    }



    public pause(): void {
        if (!this.media.paused) {
            // console.log('video pause');
            this.media.pause();
        }
    }



    public toggle(): void {

        if (!this.media.paused) {
            this.userPaused = true;
            this.media.pause();
        } else {
            Player.pauseAll();
            this.media.play();
        }
    }



    public unload(): void {
        // unload video source:
        if (this.media) {
            this.media.pause();
            this.media.src = '';
            this.media.load();
        }
    }



    public seek(value): void {
        this.media.currentTime = this.media.duration * value;
    }



    public setVolume(value: number): void {
        // console.log(value);

        this.media.volume = value;
        this.media.muted = value === 0;
        this.updateVolume(this.media.volume, value === 0);
    }



    public toggleMute(): void {
        // console.log('togglemute');

        this.media.muted = !this.media.muted;
        this.media.volume = this.media.muted ? 0 : 1;
        this.updateVolume(this.media.volume, this.media.muted);
    }



    public createPlayer(): void {}



    public updateMedia(): void {
        this.lastTime = this.media.currentTime / this.media.duration;
        this.media.pause();
        this.media = <HTMLVideoElement>this.mediaEl[this.mediaIndex];
        this.view.removeClass('is-ended is-started is-played is-playing');
        this.media.load();
        this.media.play().then(() => {
            this.seek(this.lastTime);
        });
    }



    protected isPaused(): boolean {
        return this.media.paused;
    }



    protected setup(): void {

        this.mediaEl = this.view.find('audio, video');
        if (!this.mediaEl[0]) {
            console.error('Video/Audio component must contain html `<audio>` or `<video>` element');
            return;
        }

        this.media = <HTMLVideoElement>this.mediaEl[0];
        this.isAudio = this.media.tagName === 'AUDIO';

        // make sure ratios are float numbers:
        this.settings.ratio = parseFloat(this.settings.ratio + '');
        this.settings.ratio_mobile = <number>parseFloat(this.settings.ratio_mobile + '');

        // get properties from html data
        if (this.mediaEl.first().data('src-mobile')) {
            this.settings.src_mobile = this.mediaEl.first().data('src-mobile');
        }
        if (this.mediaEl.first().data('src')) {
            this.settings.src = this.mediaEl.first().data('src');
        }

        // rmeove mobile ratio if no mobile src:
        if (!this.settings.src_mobile || this.settings.src_mobile === '') {
            delete this.settings.ratio_mobile;
            delete this.settings.src_mobile;
        }

        // mobile src:
        if (!!browser.mobile && this.settings.src_mobile && this.settings.src_mobile !== this.media.src) {
            this.media.src = this.decodeURL(this.settings.src_mobile);
            this.media.load();
        } else if (!browser.mobile && this.settings.src && this.settings.src !== this.media.src) {
            this.media.src = this.decodeURL(this.settings.src);
            this.media.load();
        }

        // volume:
        if (this.settings.volume) {
            this.media.volume = this.settings.volume;
        }

        this.settings.muted = this.media.muted;

        // autoplay:
        // if (this.media.autoplay || this.settings.autoplay) {
        //     this.settings.autoplay = true;
        //     this.media.autoplay = false;
        // }

        // loop:
        if (this.media.loop) {
            this.settings.loop = true;
        }
        if (this.settings.loop) {
            this.media.loop = true;
        }

        // poster:
        const media = <HTMLVideoElement>this.media;
        if (media.poster && !this.settings.poster) {
            this.settings.poster = media.poster;
            if (this.media.controls) {
                media.poster = '';
            }
        }

        // controls:
        if (!!this.media.controls || this.settings.controls) {
            this.buildUI();
            this.media.controls = false;
            $(this.media).removeAttr('controls');
        }

        this.updateVolume(this.media.volume, this.settings.muted);
        this.bind();
        this.resize();
    }



    protected bind(): void {
        this.mediaEl.off('.player').on('click.player', this.onToggleClick);
        super.bind();
    }



    protected bindPlayer(): void {

        if (this.media.readyState >= 2) {
            this.onLoaded();
        }

        this.mediaEl
            .on('loadedmetadata loadeddata', () => this.onLoaded())
            .on('durationchange updateMediaState', () => this.onDurationChange())
            .on('progress updateMediaState', () => this.onProgress())
            .on('timeupdate', () => this.onTimeupdate())
            .on('play', () => this.onPlay())
            .on('canplay', () => this.onCanplay())
            .on('playing', () => this.onPlaying())
            .on('pause', () => this.onPause())
            .on('waiting', () => this.onWaiting())
            .on('ended', () => this.onEnd())
            .on('error', (e) => this.onError(e));


        if (screenfull.isEnabled) {
            document.addEventListener(screenfull.raw.fullscreenchange, () => {
                this.view.toggleClass('is-fullscreen', screenfull.isFullscreen);
            });
        }
    }



    protected unbindPlayer(): void {
        this.mediaEl.off();
    }



    protected onLoaded(): void {
        this.loadCaptions();
        this.onDurationChange();
    }



    protected onDurationChange(): void {
        const duration = this.media.duration;
        const current = this.media.currentTime;
        const buffered = this.media.buffered;
        const bufferedTime = buffered && buffered.length ? buffered.end(0) : 0;
        if (!duration) { return; }
        this.updateTimeline(duration, bufferedTime, current);
    }



    protected onProgress(): void {
        this.updateLoadProgress();
    }



    protected onTimeupdate(): void {
        const current = this.media.currentTime;
        const buffered = this.media.buffered;
        const bufferedTime = buffered && buffered.length ? buffered.end(0) : 0;
        if (!current || this.scrubbing) {
            return;
        }
        this.updateTimeline(this.media.duration, bufferedTime, current);
    }



    private loadCaptions(): void {

        if (this.media.textTracks.length > 0) {
            this.tracks = this.media.textTracks[0];
            this.view.addClass('has-cc');

            this.tracks.mode = 'hidden';

            this.cues = this.tracks.cues;

            for (let i = 0; i < this.cues.length; ++i) {
                let cue = this.cues[i];

                cue.onenter = () => {
                    this.replaceText(cue.text);
                    this.showText();
                };
                cue.onexit = () => {
                    this.hideText();
                };
            }
        } else {
            this.view.removeClass('has-cc');
        }
    }



    private replaceText = (text) => {
        this.controls.captions.html(text);
    }



    private showText(): void {
        this.controls.captions.show();
    }



    private hideText(): void {
        this.controls.captions.hide();
    }



    private updateLoadProgress(): void {
        const current = this.media.currentTime;
        const buffered = this.media.buffered;
        const bufferedTime = buffered && buffered.length ? buffered.end(0) : 0;
        this.updateTimeline(this.media.duration, bufferedTime, current);
    }



    private decodeURL(src: string): string {
        let decode = (s): string => {
            try {
                let d = window.atob(s);
                return /^wq|x@$/g.test(d) ? d.replace(/^wq|x@$/g, '') : s;
            } catch (e) {
                return s;
            }
        };
        return /\.mp4$/.test(src) ? src : decode(src);
    }



    private onCCTrackClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.currentTarget.dataset.index || -1, 10);
        this.loadCC(index);
    }



    private loadCC(index): void {
        for (let i = 0; i < this.media.textTracks.length; i++) {
            this.media.textTracks[i].mode = i === index ? 'hidden' : 'disabled';
        }

        this.controls.cc.find(index >= 0 ? 'li[data-index=' + index + ']' : 'li:first-child').addClass('is-active')
            .siblings().removeClass('is-active');

        const cues = this.media.textTracks[index].cues;

        for (let i = 0; i < cues.length; ++i) {
            let cue = cues[i];

            cue.onenter = this.onCueEnter;
            cue.onexit = this.onCueExit;
        }
    }



    private onCueEnter = (e) => {
        const cue = e.currentTarget;
        this.controls.captions.show().html(cue.text);
    }



    private onCueExit = () => {
        this.controls.captions.hide();
    }
}
