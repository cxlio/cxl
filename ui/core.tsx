///<amd-module name="@cxl/ui/core.js"/>
import {
	Attribute,
	AttributeEvent,
	Augment,
	Component,
	Span,
	Slot,
	StyleAttribute,
	get,
	onUpdate,
} from '@cxl/component';
import { Bindable, dom } from '@cxl/tsx';
import { Observable, merge, operator, timer } from '@cxl/rx';
import { Breakpoint, StyleDefinition, border, padding, pct } from '@cxl/css';
import {
	FocusableComponent,
	disabledAttribute,
	focusable,
	focusableEvents,
	role,
	setClassName,
} from '@cxl/template';
import { getShadow, on, onAction, onResize } from '@cxl/dom';
import {
	ColorStyles,
	Styles,
	StateStyles,
	UiTheme,
	css,
	theme,
} from './theme.js';

export { Circle, Svg, Path } from './svg.js';
export { Span } from '@cxl/component';
export { css } from './theme.js';

export const FocusHighlight = {
	$focus: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
	$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
};

export const FocusCircleStyle = css({
	focusCircle: {
		position: 'absolute',
		width: 48,
		height: 48,
		backgroundColor: 'shadow',
		borderRadius: 24,
		opacity: 0,
		scaleX: 0,
		scaleY: 0,
		left: 0,
		display: 'inline-block',
		translateX: -14,
		translateY: -14,
	},
	focusCirclePrimary: { backgroundColor: 'primary' },
	focusCircle$invalid$touched: { backgroundColor: 'error' },
	focusCircle$hover: {
		scaleX: 1,
		scaleY: 1,
		translateX: -14,
		translateY: -14,
		opacity: 0.14,
	},
	focusCircle$focus: {
		scaleX: 1,
		scaleY: 1,
		translateX: -14,
		translateY: -14,
		opacity: 0.25,
	},
	focusCircle$disabled: { scaleX: 0, scaleY: 0 },
});

export function persistWithParameter(prefix: string) {
	return operator<AttributeEvent<any>>(() => {
		let lastAttr: string;
		return {
			next({ value, target }) {
				if (value === undefined) {
					if (target.hasAttribute(lastAttr))
						target.removeAttribute(lastAttr);
				} else {
					const attr = `${prefix}${value}`;

					if (lastAttr !== attr) {
						target.removeAttribute(lastAttr);
						target.setAttribute(attr, '');
						lastAttr = attr;
					}
				}
			},
		};
	});
}

function attachRipple<T extends HTMLElement>(hostEl: T, ev: MouseEvent) {
	const x = ev.x,
		y = ev.y,
		rect = hostEl.getBoundingClientRect(),
		radius = rect.width > rect.height ? rect.width : rect.height,
		ripple = document.createElement('cxl-ripple') as Ripple,
		// Add to shadow root if present to avoid layout changes
		parent = hostEl.shadowRoot || hostEl;
	ripple.x = x === undefined ? rect.width / 2 : x - rect.left;
	ripple.y = y === undefined ? rect.height / 2 : y - rect.top;
	ripple.radius = radius;
	parent.appendChild(ripple);
}

export function ripple(element: any) {
	return onAction(element).raf(ev => {
		if (!element.disabled && element.parentNode)
			attachRipple(element, ev as any);
	});
}

export type Size = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 'small' | 'big';

export function SizeAttribute(
	fn: (size: Exclude<Size, 'small' | 'big'>) => StyleDefinition
) {
	return CssAttribute(
		[-1, 0, 1, 2, 3, 4, 5, 'small', 'big'].reduce((r, val) => {
			const sel = val === 0 ? '$' : `$size="${val}"`;
			if (val === 'small') val = -1;
			else if (val === 'big') val = 2;
			r[sel] = fn(val as any);
			return r;
		}, {} as Record<string, StyleDefinition>)
	);
}

export type ColorValue = keyof typeof ColorStyles;

export function ForegroundColorAttribute(defaultColor?: ColorValue) {
	return CssAttribute({
		$: {
			color: 'surface',
			backgroundColor: 'transparent',
			...(defaultColor && ColorStyles[defaultColor]),
		},
		'$color="surface"': ColorStyles.surface,
		'$color="primary"': ColorStyles.primary,
		'$color="secondary"': ColorStyles.secondary,
		'$color="error"': ColorStyles.error,
	});
}

export function ColorAttribute(defaultColor?: ColorValue) {
	return CssAttribute({
		$: {
			color: 'onSurface',
			backgroundColor: 'surface',
			...(defaultColor && ColorStyles[defaultColor]),
		},
		'$color="surface"': ColorStyles.surface,
		'$color="primary"': ColorStyles.primary,
		'$color="secondary"': ColorStyles.secondary,
		'$color="error"': ColorStyles.error,
	});
}

export function CssAttribute(styles: Styles) {
	const el = css(styles);
	return Attribute({
		persist: true,
		render: host => getShadow(host).appendChild(el()),
	});
}

@Augment<Ripple>(
	'cxl-ripple',
	css({
		$: {
			display: 'block',
			position: 'absolute',
			overflowX: 'hidden',
			overflowY: 'hidden',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			pointerEvents: 'none',
		},
		ripple: {
			position: 'relative',
			display: 'block',
			borderRadius: pct(100),
			scaleX: 0,
			scaleY: 0,
			backgroundColor: 'onSurface',
			opacity: 0.16,
			animation: 'expand',
			animationDuration: '0.4s',
		},
		ripple$primary: { backgroundColor: 'primary' },
		ripple$secondary: { backgroundColor: 'secondary' },
	}),
	ctx => (
		<Span
			$={el =>
				merge(
					onUpdate(ctx).tap(host => {
						const style = el.style;
						style.left = host.x - host.radius + 'px';
						style.top = host.y - host.radius + 'px';
						style.width = style.height = host.radius * 2 + 'px';
					}),
					on(el, 'animationend').raf(() => ctx.remove()),
					timer(250).raf(() => ctx.remove())
				)
			}
			className="ripple"
		/>
	)
)
export class Ripple extends Component {
	@Attribute()
	x = 0;
	@Attribute()
	y = 0;
	@Attribute()
	radius = 0;
}

/**
 * @example
 * <cxl-ripple-container style="border:1px solid #000;padding:16px;font-size:24px;text-align:center;" >Click Me</cxl-ripple-container>
 */
@Augment(
	'cxl-ripple-container',
	ripple,
	css({
		$: {
			display: 'block',
			position: 'relative',
			overflowX: 'hidden',
			overflowY: 'hidden',
		},
	}),
	() => <slot />
)
export class RippleContainer extends Component {}

@Augment(
	'cxl-hr',
	role('separator'),
	css({
		$: {
			display: 'block',
			height: 1,
			backgroundColor: 'divider',
		},
		'$pad="8"': { marginTop: 8, marginBottom: 8 },
		'$pad="16"': { marginTop: 16, marginBottom: 16 },
		'$pad="24"': { marginTop: 24, marginBottom: 24 },
		'$pad="32"': { marginTop: 32, marginBottom: 32 },
	})
)
export class Hr extends Component {
	@StyleAttribute()
	pad?: 8 | 16 | 24 | 32;
}

@Augment(
	'cxl-t',
	css({
		$: { display: 'block', font: 'default', marginBottom: 8 },
		$center: { textAlign: 'center' },
		$inline: { display: 'inline', marginTop: 0, marginBottom: 0 },
		$caption: { font: 'caption' },
		$h1: { font: 'h1', marginTop: 32, marginBottom: 64 },
		$h2: { font: 'h2', marginTop: 24, marginBottom: 48 },
		$h3: { font: 'h3', marginTop: 24, marginBottom: 32 },
		$h4: { font: 'h4', marginTop: 30, marginBottom: 30 },
		$h5: { font: 'h5', marginTop: 24, marginBottom: 24 },
		$h6: { font: 'h6', marginTop: 16, marginBottom: 16 },
		$body2: { font: 'body2' },
		$button: { font: 'button' },
		$subtitle: { font: 'subtitle', marginBottom: 0 },
		$subtitle2: { font: 'subtitle2', opacity: 0.73 },
		$code: { font: 'code' },
		$firstChild: { marginTop: 0 },
		$lastChild: { marginBottom: 0 },
		$justify: { textAlign: 'justify' },
	}),
	_ => <slot />
)
export class T extends Component {
	@Attribute({
		persistOperator: persistWithParameter(''),
	})
	font?: keyof UiTheme['typography'];

	@StyleAttribute()
	h1 = false;
	@StyleAttribute()
	h2 = false;
	@StyleAttribute()
	h3 = false;
	@StyleAttribute()
	h4 = false;
	@StyleAttribute()
	h5 = false;
	@StyleAttribute()
	h6 = false;
	@StyleAttribute()
	caption = false;
	@StyleAttribute()
	center = false;
	@StyleAttribute()
	subtitle = false;
	@StyleAttribute()
	subtitle2 = false;
	@StyleAttribute()
	body2 = false;
	@StyleAttribute()
	code = false;
	@StyleAttribute()
	inline = false;
	@StyleAttribute()
	button = false;
	@StyleAttribute()
	justify = false;
}

/**
 * Show or hide an element when clicked.
 */
@Augment<Toggle>('cxl-toggle', $ =>
	onAction($).tap(ev => {
		let target = $.target as any;
		ev.stopPropagation();
		if (typeof target === 'string')
			target = document.getElementById(target);
		if (target) target.visible = !target.visible;
		else {
			const popups = $.querySelectorAll('cxl-popup') as any;
			for (const popup of popups) popup.visible = !popup.visible;
		}
	})
)
export class Toggle extends Component {
	@Attribute()
	target?: HTMLElement | string;
}

const MetaNodes = [
	<meta name="viewport" content="width=device-width, initial-scale=1" />,
	<meta name="apple-mobile-web-app-capable" content="yes" />,
	<meta name="mobile-web-app-capable" content="yes" />,
	<style>{`html,body{padding:0;margin:0;min-height:100%;font-family:var(--cxl-font)}a,a:active,a:visited{color:var(--cxl-link)}`}</style>,
];

@Augment('cxl-meta')
export class Meta extends Component {
	connectedCallback() {
		requestAnimationFrame(() => {
			document.documentElement.lang = 'en';
			const head = this.ownerDocument?.head || document.head;
			MetaNodes.forEach(child => head.appendChild(child));
		});
		super.connectedCallback();
	}
}

@Augment(
	'cxl-application',
	css({
		$: {
			display: 'flex',
			backgroundColor: 'background',
			flexDirection: 'column',
			overflowX: 'hidden',
			zIndex: 0,
			position: 'absolute',
			left: 0,
			right: 0,
			top: 0,
			bottom: 0,
		},
		'@large': {
			$permanent: { paddingLeft: 288 },
		},
	}),
	_ => (
		<>
			<Meta />
			<slot />
		</>
	)
)
export class Application extends Component {
	@StyleAttribute()
	permanent = false;
}

/**
 * @example
 * <cxl-toolbar>
 *   <cxl-button flat>Flat Button</cxl-button>
 *   <cxl-button flat>Flat Button</cxl-button>
 * </cxl-toolbar>
 */
@Augment(
	'cxl-toolbar',
	css({
		$: {
			display: 'flex',
			// Expand in default Grid
			gridColumnEnd: 'span 12',
			columnGap: 16,
			alignItems: 'center',
			minHeight: 56,
			...padding(4, 16, 4, 16),
		},
	}),
	Slot
)
export class Toolbar extends Component {}

@Augment(
	role('button'),
	Focusable,
	css({
		$: {
			elevation: 1,
			paddingTop: 8,
			paddingBottom: 8,
			cursor: 'pointer',
			display: 'inline-block',
			font: 'button',
			userSelect: 'none',
			backgroundColor: 'surface',
			color: 'onSurface',
			textAlign: 'center',
		},

		$flat: {
			elevation: 0,
			paddingRight: 8,
			paddingLeft: 8,
		},
		$flat$primary: {
			backgroundColor: 'surface',
			color: 'primary',
		},
		$flat$secondary: {
			backgroundColor: 'surface',
			color: 'secondary',
		},
		$primary: {
			backgroundColor: 'primary',
			color: 'onPrimary',
		},
		$secondary: {
			backgroundColor: 'secondary',
			color: 'onSecondary',
		},
		$outline: {
			backgroundColor: 'surface',
			elevation: 0,
			...border(1),
			borderStyle: 'solid',
			borderColor: 'onSurface',
		},
		$outline$primary: {
			color: 'primary',
			borderColor: 'primary',
		},
		$outline$secondary: {
			color: 'secondary',
			borderColor: 'secondary',
		},

		$active: { elevation: 3 },
		$active$disabled: { elevation: 1 },
		$active$flat: { elevation: 0 },
	}),
	css(FocusHighlight),
	ripple
)
export class ButtonBase extends Component {
	/**
	 * Disables Focus and Input
	 */
	@StyleAttribute()
	disabled = false;

	/**
	 * Sets button color to primary
	 */
	@StyleAttribute()
	primary = false;

	/**
	 * Applies the flat style.
	 */
	@StyleAttribute()
	flat = false;

	/**
	 * Sets button color to secondary
	 */
	@StyleAttribute()
	secondary = false;

	/**
	 * Sets button's touched state
	 */
	@Attribute()
	touched = false;

	/**
	 * Applies the outline style
	 */
	@StyleAttribute()
	outline = false;
}

export function focusDelegate<T extends FocusableComponent>(
	host: T,
	delegate: DisableElement
) {
	host.Shadow({ children: disabledCss });
	return merge(
		disabledAttribute(host).tap(val => (delegate.disabled = val)),
		focusableEvents(host, delegate)
	);
}

interface DisableElement extends HTMLElement {
	disabled: boolean;
}

const stateStyles = css(StateStyles);
const disabledCss = css({ $disabled: StateStyles.$disabled });

/**
 * Adds focusable functionality to input components.
 */
export function Focusable(host: Bindable) {
	host.bind(focusable(host as FocusableComponent));
	return stateStyles();
}

export function breakpoint(el: HTMLElement): Observable<Breakpoint> {
	return onResize(el)
		.raf()
		.map(() => {
			const breakpoints = theme.breakpoints;
			const width = el.clientWidth;
			let newClass: Breakpoint = 'xsmall';
			for (const bp in breakpoints) {
				if ((breakpoints as any)[bp] > width) return newClass;
				newClass = bp as Breakpoint;
			}
			return newClass;
		});
}

export function breakpointClass(el: HTMLElement) {
	return breakpoint(el).pipe(setClassName(el));
}

@Augment<A>('cxl-a', role('link'), host => {
	const el = (
		<a>
			<slot />
		</a>
	) as HTMLAnchorElement;
	el.style.color = 'inherit';
	host.bind(get(host, 'href').tap(src => (el.href = src)));
	return el;
})
export class A extends Component {
	@Attribute()
	target: '_blank' | '' = '';

	@Attribute()
	href = '';
}
