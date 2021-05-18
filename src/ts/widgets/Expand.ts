import { Scroll } from './../Scroll';
import { ElementSelector } from './All';
import { $window, easing, $navbar } from '../Site';


export class Expand {


    public static bind(target?: ElementSelector): void {
        const $target = $(typeof target !== 'undefined' ? target : 'body');
        $target.find('[aria-controls]').off().on('click.aria', Expand.onAriaControlsClick);
        // console.log('bind expand', target, $target, $target.find('[aria-controls]'));
    }



    private static onAriaControlsClick = (e: JQueryEventObject): void => {
        e.preventDefault();
        e.stopPropagation();

        const that = $(e.currentTarget);
        const id = that.attr('aria-controls');
        const isExpanded = that.attr('aria-expanded') === 'true';
        const target = $('#' + id);
        const currentScrollPosition = window.scrollY ? window.scrollY : $window.scrollTop();

        target.add(target.children()).css({
            position: 'relative',
            overflow: 'hidden',
        });

        if (!isExpanded) {

            // expand:
            target.parent().addClass('is-toggled');

            target.show();
            target.attr('aria-hidden', 'false');
            const hgt = target.children().outerHeight(true);
            
            window.scrollTo(0, currentScrollPosition);

            gsap.fromTo(target, {
                height: 0,
            }, {
                duration: hgt / 1000,
                height: hgt,
                ease: easing,
                onComplete: (): void => {
                    that.attr('aria-expanded', 'true');
                    gsap.set(target, { height: 'auto'});

                    target.add(target.children()).css({
                        position: 'relative',
                        overflow: 'visible',
                    });
                },
            });

            if (that.data('aria-less')) {
                that.html(that.data('aria-less'));
            }

            if (that.data('expand') === false) {
                that.hide();
            }

        } else {

            // collapse:
            target.parent().removeClass('is-toggled');

            const hgt = target.parent().height();
            // Scroll.scrollToElement(target, 20, 0.5);
            gsap.to(target, {
                duration: hgt / 1000,
                height: 0,
                ease: easing,
                onComplete: (): void => {
                    that.attr('aria-expanded', 'false');
                    target.attr('aria-hidden', 'true');
                    target.hide();

                    target.add(target.children()).css({
                        position: 'relative',
                        overflow: 'visible',
                    });
                },
            });

            if (that.data('aria-more')) {
                that.html(that.data('aria-more'));
            }
        }
    }
}
