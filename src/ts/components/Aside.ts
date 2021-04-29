import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $body, $doc  } from '../Site';
import { PushStates } from '../PushStates';


export class Aside extends Component {
    
    public static instance: Aside;
    private $item: JQuery;
    private isOpen: boolean = false;

    private $hamburgerLine: JQuery;
    
    public static asideAnimation(): void {

        if (Aside.instance.isOpen) {
            gsap.to(Aside.instance.$item, 0.25, { duration: 0.25, stagger: -0.1, opacity: 0, x: 20, delay: 0.2})
            gsap.to(Aside.instance.$hamburgerLine, 0.3, { duration: 0.3, scaleY: 0});
            Aside.instance.isOpen = false;
        } else {
            gsap.to(Aside.instance.$item, 0.5, { duration: 0.5, stagger: 0.05, opacity: 1, x: 0, delay: 0.2})
            gsap.to(Aside.instance.$hamburgerLine, 0.3, { duration: 0.3, scaleY: 1, delay: 0.5});
            Aside.instance.isOpen = true;
        }
    }

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$item = this.view.find('.js-item');
        this.$hamburgerLine = $('[data-hamburger]').find('i');

        Aside.instance = this;
        
        this.bind();
        Aside.instance.isOpen = false;
    }


    private bind(): void {
        this.$item.off('.menu').on('click.menu', this.hideMenu);
    }

    private hideMenu = (e) => {
        PushStates.asideToggle(e);
    }
}
