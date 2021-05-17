/// <reference path="./definitions/jquery.d.ts" />

export class Share {


    constructor() {

        Share.bind();
    }


    public static bind(): void {


        $('[data-share]').on('click', (e): boolean => {
            e.preventDefault();
            e.stopPropagation();

            let winWidth = parseInt($(e.currentTarget).attr('data-winwidth'), 10) || 520;
            let winHeight = parseInt($(e.currentTarget).attr('data-winheight'), 10) || 350;
            let winTop = (screen.height / 2) - (winHeight / 2);
            let winLeft = (screen.width / 2) - (winWidth / 2);

            const currentTarget = <any>e.currentTarget;
            const href = currentTarget.href;
            const data = $(e.currentTarget).data('share');

            if (data === 'linkedin') {
                winWidth = 420;
                winHeight = 430;
                winTop = winTop - 100;
            }

            window.open(href, 'sharer' + data, 'top=' + winTop + ',left=' + winLeft + ',toolbar=0,status=0,width=' + winWidth + ',height=' + winHeight);

            return false;
        });
    }
}
