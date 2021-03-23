/* https://greensock.com/docs/Utilities/SplitText */

declare class SplitText {
    constructor(target: Object, vars?: ISplitTextParams);

    public static selector;

    public chars: Array<Element>;
    public words: Array<Element>;
    public lines: Array<Element>;

    public static split(): SplitText;
    public revert(): SplitText;
}




declare interface ISplitTextParams {
    /**
     * a comma-delimited list of the split type(s) which can be any of the following: chars, words, or lines
     * @type {[type]}
     */
    type?: string;

    /**
     * a css class to apply to each character's <div>
     * @type {[type]}
     */
    charsClass?: string;

    /**
     * a css class to apply to each line's <div>
     * @type {[type]}
     */
    linesClass?: string;

    /**
     * By default, positioning is "relative" but if you prefer that everything be absolutely positioned with top/left/width/height css values, you can set position:"absolute"
     * @type {[type]}
     */
    position?: string;

    /**
     * typically a space character is used to distinguish where words are separated, but you can specify your own character if you prefer
     * @type {[type]}
     */
    wordDelimiter?: string;

    /**
     * a css class to apply to each word's <div>
     * @type {[type]}
     */
    wordsClass?: string;
}
