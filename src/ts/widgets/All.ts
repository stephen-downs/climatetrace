import { Scroll } from '../Scroll';
// import { API, IApiData } from './Api';
import { PushStates } from '../PushStates';
import { Expand } from './Expand';
import * as Utils from '../Utils';
import { breakpoint } from '../Breakpoint';
import { $body } from '../Site';


export type ElementSelector = Element | NodeList | Array<Element> | string;

export class Widgets {

    public static bind(target?: ElementSelector): void {

        // API.bind(target);
        Expand.bind(target);


        const $target = $(typeof target !== 'undefined' ? target as {} : 'body');

        $target.find('[data-share]').off().on('click.share', this.onShareClick);
        $target.find('[data-print]').off().on('click.print', this.onPrintClick);

    }



    private static onShareClick = (e): boolean => {
        e.preventDefault();

        let winWidth = parseInt($(e.currentTarget).attr('data-winwidth'), 10) || 520,
            winHeight = parseInt($(e.currentTarget).attr('data-winheight'), 10) || 350,
            winTop = (screen.height / 2) - (winHeight / 2),
            winLeft = (screen.width / 2) - (winWidth / 2);

        let href = e.currentTarget.href,
            data = $(e.currentTarget).data('share');

        if (data === 'facebook' || data === 'google') {
            href += encodeURIComponent(window.location.href);
        }

        window.open(href, 'sharer' + data, 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);

        return false;
    }



    private static onPrintClick = (e): boolean => {
        e.preventDefault();
        window.print();
        return false;
    }



    // private static onScrollDownClick = (e: JQueryEventObject): void => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     Scroll.scroll({
    //         y: window.innerHeight,
    //     });
    // }



    // private static onScrollTopClick = (e: JQueryEventObject): void => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //     Scroll.scroll({
    //         y: 0,
    //     });
    // }


}
