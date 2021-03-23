declare namespace Vimeo {

    export class Player {
        // Constructor
        constructor(element: any, options: {});

        setVolume(volume: number): void;
        on(eventName, callback): void;
        off(eventName, callback?): void;

        // Playing
        play(): Promise<void>;
        pause(): void;
        setCurrentTime(seconds: number): void;
        setVolume(volume: number): void;
        getVolume(): Promise<number>;
        getDuration(): Promise<number>;
        getPaused(): Promise<boolean|Error>;

        getVideoWidth(): Promise<number>;
        getVideoHeight(): Promise<number>;
        ready(): Promise<void|Error>;
        unload(): Promise<void|Error>;
        loadVideo(id: number): Promise<number|TypeError|Error>

        // DOM
        destroy(): void;

    }

    export interface Time {
        duration: number;
        percent: number;
        seconds: number;
    }

}
