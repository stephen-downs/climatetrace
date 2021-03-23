/// <reference path="jquery.d.ts" />

interface ScrollifyOptions {

    /**
     * A CSS selector for the sections of the page.
     * @type string
     */
    section?: string;

    /**
     * Scrollify lets you define a hash value for each section. This makes it possible to permalink to particular sections. This is set as a data attribute on the sections. The name of the data attribute is defined by sectionName.
     * @type string
     */
    sectionName?: string;

    /**
     * A CSS selector for non-full-height sections, such as a header and footer.
     * @type string
     */
    interstitialSection?: string;

    /**
     * Define the easing method.
     * @type string
     */
    easing?: string;


    scrollSpeed?: number;

    /**
     * A distance in pixels to offset each sections position by.
     * @type number
     */
    offset?: number;

    /**
     * A boolean to define whether scroll bars are visible or not.
     * @type boolean
     */
    scrollbars?: boolean;

    /**
     * A CSS selector for elements within sections that require standard scrolling behaviour. For example standardScrollElements: ".map, .frame".
     * @type string
     */
    standardScrollElements?: string;

    /**
     * A boolean to define whether Scollify assigns a height to the sections. True by default.
     * @type boolean
     */
    setHeights?: boolean;

    /**
     * A boolean to define whether Scrollify will allow scrolling over overflowing content within sections. True by default. (This will be false if scrollbars is false)
     * @type boolean
     */
    overflowScroll?: boolean;

    /**
     * A boolean to define whether Scrollify updates the browser location hash when scrolling through sections. True by default.
     * @type boolean
     */
    updateHash?: boolean;

    /**
     * A boolean to define whether Scrollify handles touch scroll events. True by default.
     * @type boolean
     */
    touchScroll?: boolean;

    /**
     * A callback that is fired before a section is scrolled to. Arguments include the index of the section and an array of all section elements.
     */
    before?: {(index: number, sections: Array<any>): void};

    /**
     * A callback that is fired after a new section is scrolled to. Arguments include the index of the section and an array of all section elements.
     */
    after?: {(index: number, sections: Array<any>): void};

    /**
     * A callback that is fired after the window is resized.
     */
    afterResize?: {(): void};

    /**
     * A callback that is fired after Scrollify's initialisation.
     */
    afterRender?: {(): void};
}

interface Scrollify {
    (options: ScrollifyOptions): void;

    /**
     * The move method can be used to scroll to a particular section. It can be passed the index of the section, or the name of the section preceded by a hash.
     * @param {string} panel [description]
     */
    move(panel: string | number): void;

    /**
     * The instantMove method can be used to scroll to a particular section without animation. It can be passed the index of the section, or the name of the section preceded by a hash.
     * @param {string | number} panel index of the section, or the name of the section preceded by a hash
     */
    instantMove(panel: string | number);

    /**
     * The next method can be used to scroll to a panel that immediately follows the current panel.
     */
    next();

    /**
     * The previous method can be used to scroll to a panel that immediately precedes the current panel.
     */
    previous();

    /**
     * The instantNext method can be used to scroll to a panel that immediately follows the current panel, without animation.
     */
    instantNext();

    /**
     * The instantPrevious method can be used to scroll to a panel that immediately precedes the current panel.
     */
    instantPrevious();

    /**
     * The destroy method removes all Scrollify events and removes set heights from the panels.
     */
    destroy();

    /**
     * The update method recalculates the heights and positions of the panels.
     */
    update();

    /**
     * The current method returns the current section as a jQuery object.
     * @return {JQuery} current section
     */
    current(): JQuery;

    /**
     * The currentIndex method returns the current section index, starting at 0.
     * @return {number} index, starting at 0
     */
    currentIndex(): number;

    /**
     * The disable method turns off the scroll snap behaviour so that the page scroll like normal.
     */
    disable();

    /**
     * The enable method resumes the scroll snap behaviour after the disable method has been used.
     */
    enable();

    /**
     * The isDisabled method returns true if Scrollify is currently disabled, otherwise false.
     * @return {boolean}
     */
    isDisabled(): boolean;

    /**
     * The setOptions method can be used to change any of the initialisation options. Just parse it an options object.
     * @param {ScrollOptions} updatedOptions
     */
    setOptions(updatedOptions: ScrollifyOptions);
}

interface JQueryStatic {
    scrollify: Scrollify;
}
