/// <reference path="./definitions/jquery.d.ts" />
/// <reference path="./definitions/clipboard.d.ts" />



export class Copy {

    constructor() {
        Copy.bind();
    }


    public static bind(): void {
        $('[data-copy]').on('click', (e): void => {
            e.preventDefault();
            e.stopPropagation();

            const $el = $(e.currentTarget);
            const url = window.location.origin + window.location.pathname;

            (window.Clipboard as any).copy(url);
            window.console.info('"%s" copied', url);

            $el.addClass('is-copied');
            setTimeout(() => { $el.removeClass('is-copied'); }, 1000);
        });
    }
}
