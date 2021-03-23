interface IWheelIndicatorOptions {
    elem?: HTMLElement | Element | Document;
    callback?: Function;
    preventMouse?: boolean;
}


declare class WheelIndicator {

    constructor(options: IWheelIndicatorOptions);

    turnOff(): void;
    turnOn(): void;
    setOptions(options: IWheelIndicatorOptions): void;
    getOption(option: string): string;
    destroy(): void;
}
