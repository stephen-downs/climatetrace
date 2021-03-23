/// <reference path="../definitions/imagesloaded.d.ts" />

import {Component} from './Component';



export class ImageFill extends Component {


    constructor(protected view: JQuery, protected options?) {
        super(view, options);


        let imgLoad = imagesLoaded(this.view[0]);
        imgLoad.on('progress', (instance, image) => {
            if (image.isLoaded) {

                let parent = $(image.img).parent();
                $(image.img).removeClass('is-loading');
                this.tryImagefill(image.img);

                parent.addClass('is-loaded');

            } else {
                console.warn(image);
                $(image.img).addClass('not-loaded');
            }
        });
    }



    private imagefill($element: JQuery, src: string, imagefill: string | boolean): void {

        let isContain = imagefill === 'contain',
            imageSize = isContain ? 'contain' : 'cover',
            imagePosition = imagefill;

        imagePosition = imagePosition === true || imagePosition === '' ? 'center' : imagePosition;
        imagePosition = isContain ? 'center' : imagePosition;

        $element.css({
            'background-image': 'url(' + src + ')',
            'background-repeat': 'no-repeat',
            'background-size': imageSize,
        });
    }



    private tryImagefill(img: HTMLImageElement): void {

        let $imagefill = $(img).closest('[data-imagefill]');

        if ($imagefill[0]) {
            let data = $imagefill.data('imagefill');
            this.imagefill($imagefill, img.currentSrc || img.src, data);
            $(img).remove();
        }
    }
}
