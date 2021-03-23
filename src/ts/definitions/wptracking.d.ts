interface IVideoVars {
    avName: string;
    avPlayer: string;
    category: string;
    label: string;
}

interface WpTracking {
    /**
     * object with video tracking attributes
     */
    videoVars: IVideoVars;

    /**
     * method that sends tracking
     */
    sendTracking(value: string): void;

    /**
     * method that sends video tracking
     */
    sendVideoTracking(event: string): void;

    /**
     * method that attaches click event listener to data-gtm elements
     */
    attachTrackingEvent(elements: HTMLElement): void;

}

declare var WpTracking: WpTracking;