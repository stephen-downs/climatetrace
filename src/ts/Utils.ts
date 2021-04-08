/// <reference path="definitions/stats.d.ts" />
/// <reference path="definitions/modernizr.d.ts" />
/// <reference path="definitions/jquery.d.ts" />

import { browser } from './Browser';
import { breakpoint } from './Breakpoint';
import { $window } from './Site';


export function generateUID(): string {
    return '' + (new Date()).getTime() + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
}


export const keys = {
    enter: 13,
    esc: 27,
    space: 32,
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
};


export function getParams(url): { [key: string]: string; } {
    var params = {};
    var parser = document.createElement('a');
    parser.href = url;
    var query = parser.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        params[pair[0]] = decodeURIComponent(pair[1]);
    }
    return params;
};


export function testAutoplay(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
        if (typeof Modernizr.videoautoplay !== undefined) {
            resolve(Modernizr.videoautoplay);
        } else {
            Modernizr.on('videoautoplay', () => {
                resolve(Modernizr.videoautoplay);
            });
        }
    });
}


export function parseToTime(sec: number): string {

    const totalSec = parseInt('' + sec, 10);
    const hours = parseInt('' + totalSec / 3600, 10) % 24;
    const minutes = parseInt('' + totalSec / 60, 10) % 60;
    const seconds = totalSec % 60;
    const hrsDisplay = (hours < 10 ? '0' + hours : hours) + ':';

    return (hours > 0 ? hrsDisplay : '') + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds);
}



export function stats(): Stats {

    const stats = new Stats();

    stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
    $(stats.dom).css({'pointer-events': 'none', 'top': 110});
    document.body.appendChild( stats.dom );

    function animate(): void {
        stats.begin();
        // monitored code goes here
        stats.end();
        requestAnimationFrame( animate );
    }

    requestAnimationFrame( animate );

    return stats;
}



export function timeFormat(time: number): string {
    let minutes = Math.floor(time / 60).toString();
    minutes = (parseInt(minutes, 10) >= 10) ? minutes : '0' + minutes;
    let seconds = Math.floor(time % 60).toString();
    seconds = (parseInt(seconds, 10) >= 10) ? seconds : '0' + seconds;

    return minutes.toString() + ':' + seconds.toString();
}



export function updateImageSources(): void {
    if (browser.ie) {
        $('[data-iesrc]').each((i, img): void => {
            img.setAttribute('src', img.getAttribute('data-iesrc'));
            img.removeAttribute('data-iesrc');
        });
    }

    $('[data-src]').each((i, img): void => {
        img.setAttribute('src', img.getAttribute('data-src'));
        img.removeAttribute('data-src');
    });

    $('[data-srcset]').each((i, img): void => {
        img.setAttribute('srcset', img.getAttribute('data-srcset'));
        img.removeAttribute('data-srcset');
    });
}



// export function preloadImages(images: string[]): Promise<void[]> {
//     return Promise.all(images.map((image): Promise<void> => {
//         return new Promise<void>((resolve, reject) => {
//             const img = new Image();
//             img.onload = () => resolve();
//             img.onerror = () => resolve();
//             img.onabort = () => resolve();
//             img.src = image;
//             if (img.complete && $(img).height() > 0) { resolve(); return; }
//         });
//     }));
// }



// export function checkAndPreloadImages($images: JQuery): Promise<void[]> {
//     let isBase64: boolean;
//     const images: string[] = $images.toArray()
//         .map((img: HTMLImageElement): string => {
//             let imageSource = img.currentSrc || img.src;
//             if (imageSource.indexOf('data:image/png;base64,') >= 0) { isBase64 = true; }
//             return imageSource;
//         });

//     // console.log(images);

//     if (!isBase64) {
//         return preloadImages(images);
//     } else {
//         return new Promise(resolve => {
//             setTimeout(() => {
//                 checkAndPreloadImages($images).then(() => {
//                     resolve();
//                 });
//             }, 200);
//         });
//     }
// }


export function shuffle(a): Array<any> {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}


export function setRootVars(): void {
    const headerHeight = breakpoint.desktop ? $('#navbar').height() : 0;
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight - headerHeight}px`);
    document.documentElement.style.setProperty('--col-25', `${$('.col-pattern-25').width()}px`);
    document.documentElement.style.setProperty('--col-66', `${$('.col-66').width()}px`);
    let marg = !breakpoint.desktop ? 50 : 120;
    $('.aside').css('height', $window.height() + marg);
}

export function enableBodyScrolling(sT: number): void {
    $('body').removeAttr('style');
    $('body').removeClass('scrolling-disable');
    window.scrollTo(0, sT);
}


export function disableBodyScrolling(sT: number): void {
    let position = browser.ie ? 'absolute' : 'fixed';
    let top = browser.ie ? '' : -sT + 'px';
    $('body').addClass('scrolling-disable');
    $('body').css({
        // 'position': position,
        // 'top': top,
        // 'bottom': '0',
        'overflow': 'hidden',
        'will-change': 'top',
        'width': '100%',
        'touch-action': 'none',
    });

}


export const translations = {
    'invalid-email': {
        'en': 'Invalid email address format',
        'pl': 'Niepoprawny format adresu e-mail',
    },
    'required-field': {
        'en': 'Required field',
        'pl': 'Pole obowiązkowe',
    },
    'invalid-zip': {
        'en': 'Enter zip-code in five digits format',
        'pl': 'Wpisz kod pocztowy w formacie XX-XXX',
    },
};
