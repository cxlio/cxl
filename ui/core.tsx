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
import { dom } from '@cxl/tsx';
import { EMPTY, merge, tap, operator } from '@cxl/rx';
import {
	Typography,
	Styles,
	StyleDefinition,
	border,
	css,
	padding,
	pct,
} from '@cxl/css';
import { Focusable, role } from '@cxl/template';
import { getShadow, on, onAction, trigger } from '@cxl/dom';
import { InversePrimary, ResetSurface, ColorStyles } from './theme.js';
import { Svg, Circle } from './svg.js';

export { Circle, Svg, Path } from './svg.js';
export { Span } from '@cxl/component';

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
		if (!element.disabled) attachRipple(element, ev as any);
		ev.stopPropagation();
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

export function ColorAttribute(defaultColor?: ColorValue) {
	return CssAttribute({
		...(defaultColor && { $: ColorStyles[defaultColor] }),
		'$color="surface"': ColorStyles.surface,
		'$color="primary"': ColorStyles.primary,
		'$color="secondary"': ColorStyles.secondary,
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
					onUpdate(ctx, host => {
						const style = el.style;
						style.left = host.x - host.radius + 'px';
						style.top = host.y - host.radius + 'px';
						style.width = style.height = host.radius * 2 + 'px';
					}),
					on(el, 'animationend').tap(() => ctx.remove())
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

/**
 * Linear progress indicators display progress by animating an indicator along the length of a fixed, visible track.
 * @example
 * <cxl-progress></cxl-progress><br/>
 * <cxl-progress value="0.5"></cxl-progress>
 */
@Augment<Progress>(
	'cxl-progress',
	css({
		$: { backgroundColor: 'primaryLight', height: 4 },
		indicator: {
			display: 'block',
			backgroundColor: 'primary',
			height: 4,
			transformOrigin: 'left',
		},
		indeterminate: { animation: 'wait' },
	}),
	host => (
		<Span
			className="indicator"
			$={el =>
				get(host, 'value').pipe(
					tap(val => {
						el.classList.toggle('indeterminate', val === Infinity);
						if (val !== Infinity)
							el.style.transform = 'scaleX(' + val + ')';
						trigger(host, 'change');
					})
				)
			}
		/>
	),
	role('progressbar')
)
export class Progress extends Component {
	@Attribute()
	value = Infinity;
}

/**
 * Spinners are used to indicate that the app is performing an action that the user needs to wait on.
 *
 * @example
 * <cxl-spinner></cxl-spinner>
 */
@Augment(
	'cxl-spinner',
	css({
		$: {
			animation: 'spin',
			display: 'inline-block',
			width: 48,
			height: 48,
		},
		circle: { animation: 'spinnerstroke' },
		svg: { width: pct(100), height: pct(100) },
	}),
	_ => (
		<Svg viewBox="0 0 100 100" className="svg">
			<Circle
				cx="50%"
				cy="50%"
				r="45"
				style="stroke:var(--cxl-primary);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px"
				className="circle"
			/>
		</Svg>
	)
)
export class Spinner extends Component {}

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
	font?: keyof Typography;

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
 * @example
 * <cxl-toggle>
 *   <cxl-button slot="trigger">Open</cxl-button>
 *   <cxl-menu>
 *     <cxl-item>Features</cxl-item>
 *     <cxl-item>Pricing</cxl-item>
 *     <cxl-item>Docs</cxl-item>
 *     <cxl-hr></cxl-hr>
 *     <cxl-item>Log In</cxl-item>
 *   </cxl-menu>
 * </cxl-toggle>
 */
@Augment<Toggle>(
	'cxl-toggle',
	css({
		$: { position: 'relative', display: 'inline-block' },
		popup: {
			scaleY: 0,
			position: 'absolute',
			animation: 'fadeOut',
			transformOrigin: 'top',
			top: 0,
			zIndex: 1,
		},
		popup$right: { right: 0 },
		popup$opened: { scaleY: 1, animation: 'fadeIn' },
	}),
	_ => (
		<>
			<slot name="trigger" />
			<div className="popup">
				<slot />
			</div>
		</>
	),
	el =>
		merge(
			get(el, 'opened')
				.debounceTime()
				.switchMap(() =>
					el.opened
						? on(window, 'click').tap(() => {
								if (el.opened) el.opened = false;
						  })
						: EMPTY
				),
			onAction(el).tap(() => (el.opened = !el.opened))
		)
)
export class Toggle extends Component {
	@StyleAttribute()
	opened = false;
	@StyleAttribute()
	right = false;
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

@Augment(
	'cxl-surface',
	css({
		$primary: InversePrimary,
		$: ResetSurface,
	}),
	Slot
)
export class Surface extends Component {
	@StyleAttribute()
	primary = false;
}

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
		'@large': {
			$flat: { paddingLeft: 12, paddingRight: 12 },
		},
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

	@SizeAttribute(s => ({
		borderRadius: 2 + s * 2,
		fontSize: 14 + s * 4,
		lineHeight: 20 + s * 8,
		paddingRight: 16 + s * 4,
		paddingLeft: 16 + s * 4,
	}))
	size: Size = 0;
}
