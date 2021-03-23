/// <reference path="../definitions/jquery.d.ts" />

import * as Utils from '../Utils';
import { Handler } from '../Handler';



export class GyroEvents {
    public static MOVE: string = 'move';
}


export interface IGyroData {
    x: number;
    y: number;
}


export interface IGyroSettings {
    maxTiltX: number;
    maxTiltY: number;
}




export class Gyro extends Handler {

    private uid: string;
    private settings: IGyroSettings = {
        maxTiltX: 20,
        maxTiltY: 20,
    };



    constructor(protected options?: IGyroSettings) {
        super();
        this.uid = Utils.generateUID();

        if (typeof options === 'object') {
            $.extend(this.settings, options);
        }


        this.bind();
    }



    public destroy(): void {
        this.unbind();
        super.destroy();
    }



    private bind(): void {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => this.handleDeviceOrientation(e), false);
        } else if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (e) => this.handleDeviceMotion(e), false);
        }
    }



    private unbind(): void {}



    private handleDeviceOrientation(e): void {
        this.onTilt(e.beta, e.gamma);
    }



    private handleDeviceMotion(e): void {
        this.onTilt(e.acceleration.x * 2, e.acceleration.y * 2);
    }



    private onTilt(beta, gamma): void {
        if (!beta && !gamma) { return; }
        const percentX = Math.min(1, Math.max(0, (this.settings.maxTiltX + gamma) / (this.settings.maxTiltX * 2)));
        const percentY = Math.min(1, Math.max(0, (this.settings.maxTiltY + beta) / (this.settings.maxTiltY * 2)));
        this.trigger(GyroEvents.MOVE, <IGyroData>{ x: percentX, y: percentY });
    }
}


interface Window {
    DeviceOrientationEvent: Event;
    DeviceMotionEvent: Event;
}
