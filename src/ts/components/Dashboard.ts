import { Component } from './Component';
import { IBreakpoint, breakpoint, Breakpoint } from '../Breakpoint';
import { $doc  } from '../Site';


export class Dashboard extends Component {

    private $toggle: JQuery;
    private $body: JQuery;
    private isToggled: boolean;
    private bodyHeight: number;

    constructor(protected view: JQuery, protected options?) {
        super(view);

        this.$toggle = this.view.find('.js-button-toggle');
        this.$body = this.view.find('.js-dashboard-body');

        this.bind();
        this.initialState();
    }


    public resize = (wdt: number, hgt: number, breakpoint?: IBreakpoint, bpChanged?: boolean): void => {

    };

    private bind(): void {
        this.$toggle.off('.toggle').on('click.toggle', this.togglePanel);
    }

    private togglePanel = (e) => {
        if (!this.isToggled) {
            gsap.to(this.$body, { duration: 0.5, height: 'auto', ease: 'power2.inOut',
            onComplete: () => {
                this.$body.addClass('is-toggled');
                this.isToggled = true;
                },
            });
        } else {
            this.$body.removeClass('is-toggled');
            gsap.to(this.$body, { duration: 0.5, height: '0', ease: 'power2.inOut',
                onComplete: () => {
                    this.isToggled = false;
                },
            });
        }
    }


    private initialState(): void {
        gsap.set(this.$body, { height: '0'});
    }
    
}
