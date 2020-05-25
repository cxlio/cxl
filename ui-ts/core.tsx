import { dom, Host, normalizeChildren } from '../xdom/index.js';
import {
	Attribute,
	Augment,
	Component,
	Slot,
	StyleAttribute,
	RenderContext,
	bind,
	get,
	render,
	role,
	onUpdate,
	connect,
} from '../component/index.js';
import { onAction, triggerEvent, portal } from '../template/index.js';
import { on, remove, setAttribute, trigger } from '../dom/index.js';
import { Observable, map, tap, merge, debounceTime } from '../rx/index.js';
import { Style, StyleSheet, pct, theme } from '../css/index.js';

const StateStyles = {
	$active: { filter: 'invert(0.2)' },
	$focus: {
		outline: 0,
		filter: 'invert(0.2) saturate(2) brightness(1.1)',
	},
	$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	$disabled: {
		cursor: 'default',
		filter: 'saturate(0)',
		opacity: 0.38,
		pointerEvents: 'none',
	},
};

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
	return onAction(element).pipe(
		debounceTime(),
		tap(ev => {
			ev.preventDefault();
			if (!element.disabled) attachRipple(element, ev as any);
		})
	);
}

interface FocusableComponent extends Component {
	disabled: boolean;
}

export function focusableEvents<T extends FocusableComponent>(element: T) {
	return merge(
		on(element, 'focus').pipe(triggerEvent(element, 'focusable.focus')),
		on(element, 'blur').pipe(triggerEvent(element, 'focusable.blur'))
	);
}

export function focusable<T extends FocusableComponent>(element: T) {
	return merge(
		get(element, 'disabled').pipe(
			tap(value => {
				element.setAttribute('aria-disabled', value ? 'true' : 'false');
				setAttribute(element, 'disabled', value);
				if (value) element.removeAttribute('tabindex');
				else element.tabIndex = 0;
			})
		),
		focusableEvents(element)
	);
}

const stateStyles = new StyleSheet({ styles: StateStyles });

export function Focusable() {
	return (view: RenderContext) => {
		view.bind(focusable(view.host as FocusableComponent));
		return stateStyles.clone();
	};
}

export function registable<T extends Component>(host: T, id: string) {
	return new Observable(() => {
		trigger(host, id + '.register');
		return () => trigger(host, id + '.unregister');
	});
}

export function registableHost(host: Element, id: string) {
	const elements = new Set<Element>();

	function register(ev: Event) {
		if (ev.target) elements.add(ev.target as Element);
	}

	function unregister(ev: Event) {
		if (ev.target) elements.delete(ev.target as Element);
	}

	return merge(
		on(host, id + '.register').pipe(tap(register)),
		on(host, id + '.unregister').pipe(tap(unregister))
	).pipe(map(() => elements));
}

interface SelectableComponent extends Component {
	selected: boolean;
}

export function ariaProp(host: Element, prop: string) {
	return tap<boolean>(val =>
		host.setAttribute('aria-' + prop, val ? 'true' : 'false')
	);
}

interface ValueElement extends Element {
	value: boolean | undefined;
}

export function ariaChecked(host: ValueElement) {
	return tap<boolean>(val =>
		host.setAttribute(
			'aria-checked',
			host.value === undefined ? 'mixed' : val ? 'true' : 'false'
		)
	);
}

export function selectable<T extends SelectableComponent>(host: T) {
	registable(host, 'selectable');
	return merge(
		onAction(host).pipe(triggerEvent(host, 'selectable.action')),
		get(host, 'selected').pipe(ariaProp(host, 'selected'))
	);
}

@Augment<Ripple>(
	<Host>
		<Style>
			{{
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
			}}
		</Style>
		<div
			$={(el, view: Ripple['view']) => {
				return merge(
					onUpdate(view.host, host => {
						const style = el.style;
						style.left = host.x - host.radius + 'px';
						style.top = host.y - host.radius + 'px';
						style.width = style.height = host.radius * 2 + 'px';
					}),
					on(el, 'animationend').pipe(tap(() => remove(view.host)))
				);
			}}
			className="ripple"
		></div>
	</Host>
)
export class Ripple extends Component {
	static tagName = 'cxl-ripple';

	@Attribute()
	x = 0;
	@Attribute()
	y = 0;
	@Attribute()
	radius = 0;
}

@Augment(
	bind(ripple),
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					position: 'relative',
					overflowX: 'hidden',
					overflowY: 'hidden',
				},
			}}
		</Style>
		<slot />
	</Host>
)
export class RippleContainer extends Component {
	static tagName = 'cxl-ripple-container';
}

@Augment<Appbar>(
	role('heading'),
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					backgroundColor: 'primary',
					flexShrink: 0,
					font: 'title',
					color: 'onPrimary',
					elevation: 2,
				},
				flex: {
					display: 'flex',
					alignItems: 'center',
					height: 56,
					paddingLeft: 16,
					paddingRight: 16,
					paddingTop: 4,
					paddingBottom: 4,
				},

				flex$extended: {
					alignItems: 'start',
					height: 128,
					paddingBottom: 24,
				},
				$fixed: { position: 'fixed', top: 0, right: 0, left: 0 },
				'@xlarge': {
					flex$center: {
						width: 1200,
						marginLeft: 'auto',
						marginRight: 'auto',
						paddingRight: 0,
						paddingLeft: 0,
					},
					tabs$center: {
						width: 1200,
						marginLeft: 'auto',
						marginRight: 'auto',
					},
				},
			}}
		</Style>
		<div className="flex">
			<slot></slot>
			<div $={portal('cxl-appbar-actions')} />
		</div>
		<div className="tabs">
			<Slot selector="cxl-tabs"></Slot>
			<div $={portal('cxl-appbar-tabs')} />
		</div>
	</Host>
)
export class Appbar extends Component {
	static tagName = 'cxl-appbar';

	@Attribute()
	extended = false;

	@Attribute()
	center = false;
}

@Augment(
	<Host>
		<Style>
			{{
				$: {
					flexGrow: 1,
					font: 'title',
					color: 'onPrimary',
					textDecoration: 'none',
				},
				$extended: { font: 'h5', alignSelf: 'flex-end' },
			}}
		</Style>
		<slot />
	</Host>
)
export class AppbarTitle extends Component {
	static tagName = 'cxl-appbar-title';

	@StyleAttribute()
	extended = false;
}

const AVATAR_DEFAULT =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 0 26 26' %3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E";

@Augment<Avatar>(
	role('img'),
	<Host>
		<Style>
			{{
				$: {
					borderRadius: 32,
					backgroundColor: 'surface',
					width: 40,
					height: 40,
					display: 'inline-block',
					font: 'title',
					lineHeight: 38,
					textAlign: 'center',
					overflowY: 'hidden',
				},
				$little: {
					width: 32,
					height: 32,
					font: 'default',
					lineHeight: 30,
				},
				$big: { width: 64, height: 64, font: 'h4', lineHeight: 62 },
				image: {
					width: pct(100),
					height: pct(100),
					borderRadius: 32,
				},
			}}
		</Style>
	</Host>,
	render(node => (
		<Host>
			<img
				$={img =>
					get(node, 'src').pipe(
						tap(src => {
							img.src = src || AVATAR_DEFAULT;
							img.style.display =
								src || !node.text ? 'block' : 'none';
						})
					)
				}
				className="image"
				alt="avatar"
			/>
			{get(node, 'text')}
		</Host>
	))
)
export class Avatar extends Component {
	static tagName = 'cxl-avatar';
	@StyleAttribute()
	big = false;
	@StyleAttribute()
	little = false;
	@Attribute()
	src = '';
	@Attribute()
	text = '';
}

@Augment(
	<Host>
		<Style>
			{{
				$: {
					backgroundColor: 'surface',
					borderRadius: 2,
					color: 'onSurface',
					display: 'block',
					elevation: 1,
				},
			}}
		</Style>
		<slot></slot>
	</Host>
)
export class Card extends Component {
	static tagName = 'cxl-card';
}

@Augment<Chip>(
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					borderRadius: 16,
					font: 'subtitle2',
					backgroundColor: 'onSurface12',
					display: 'inline-flex',
					color: 'onSurface',
					lineHeight: 32,
					height: 32,
					verticalAlign: 'top',
				},
				$primary: {
					color: 'onPrimary',
					backgroundColor: 'primary',
				},
				$secondary: {
					color: 'onSecondary',
					backgroundColor: 'secondary',
				},
				$little: { font: 'caption', lineHeight: 20, height: 20 },
				content: {
					display: 'inline-block',
					marginLeft: 12,
					paddingRight: 12,
				},
				avatar: { display: 'inline-block' },
				remove: {
					display: 'none',
					marginRight: 12,
					cursor: 'pointer',
				},
				remove$removable: {
					display: 'inline-block',
				},
			}}
		</Style>
		<span className="avatar">
			<Slot selector="cxl-avatar" />
		</span>
		<span className="content">
			<slot></slot>
		</span>
		<span
			$={(el, view) =>
				on(el, 'click').pipe(tap(() => view.host.remove()))
			}
			className="remove"
		>
			x
		</span>
	</Host>,
	bind(host =>
		on(host, 'keydown').pipe(
			tap(ev => {
				if (
					host.removable &&
					(ev.key === 'Delete' || ev.key === 'Backspace')
				)
					host.remove();
			})
		)
	)
)
export class Chip extends Component {
	static tagName = 'cxl-chip';

	@StyleAttribute()
	removable = false;
	@StyleAttribute()
	disabled = false;
	@Attribute()
	touched = false;
	@StyleAttribute()
	primary = false;
	@StyleAttribute()
	secondary = false;
	@StyleAttribute()
	little = false;

	remove() {
		remove(this);
		trigger(this, 'cxl-chip.remove');
	}
}

@Augment(
	<Host>
		<Style>
			{{
				$: {
					display: 'inline-block',
					position: 'relative',
					width: 22,
					height: 22,
					lineHeight: 22,
					font: 'caption',
					borderRadius: 11,
					color: 'onPrimary',
					backgroundColor: 'primary',
				},
				$secondary: {
					color: 'onSecondary',
					backgroundColor: 'secondary',
				},
				$error: { color: 'onError', backgroundColor: 'error' },
				$top: { translateY: -11 },
				$over: { marginLeft: -8 },
			}}
		</Style>
		<slot></slot>
	</Host>
)
export class Badge extends Component {
	static tagName = 'cxl-badge';

	@Attribute()
	secondary = false;

	@Attribute()
	error = false;

	@Attribute()
	over = false;

	@Attribute()
	top = false;
}

@Augment(
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					display: 'inline-block',
					elevation: 2,
					backgroundColor: 'secondary',
					color: 'onSecondary',
					position: 'fixed',
					width: 56,
					height: 56,
					bottom: 16,
					right: 24,
					borderRadius: 56,
					textAlign: 'center',
					paddingTop: 20,
					cursor: 'pointer',
					font: 'h6',
					paddingBottom: 20,
					lineHeight: 16,
				},
				$static: { position: 'static' },
				$focus: { elevation: 4 },
				$small: { top: 28, bottom: '' },
			}}
		</Style>
		<slot />
	</Host>
)
export class Fab extends Component {
	static tagName = 'cxl-fab';
	@StyleAttribute()
	disabled = false;
	@StyleAttribute()
	static = false;
	touched = false;
}

@Augment(
	role('separator'),
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					height: 1,
					backgroundColor: 'divider',
				},
			}}
		</Style>
	</Host>
)
export class Hr extends Component {
	static tagName = 'cxl-hr';
}

@Augment<Item>(
	bind(ripple),
	<Focusable />,
	<Style>
		{{
			// prefix('link', FocusCSS),
			// prefix('link', DisabledCSS)
			$: {
				cursor: 'pointer',
				position: 'relative',
				display: 'block',
			},
			$disabled: { pointerEvents: 'none' },
			// 'link:focus': { outline: 0 },
			link: {
				color: 'onSurface',
				outline: 0,
				lineHeight: 24,
				paddingRight: 16,
				paddingLeft: 16,
				paddingTop: 12,
				font: 'default',
				paddingBottom: 12,
				alignItems: 'center',
				backgroundColor: 'surface',
				textDecoration: 'none',
				display: 'flex',
			},
			content: { flexGrow: 1 },
			icon: {
				marginRight: 16,
				width: 28,
				color: 'onSurface',
				opacity: 0.7,
			},
			icon$selected: { color: 'onPrimaryLight' },
			link$selected: {
				backgroundColor: 'primaryLight',
				color: 'onPrimaryLight',
			},
		}}
	</Style>,
	render(el => (
		<a
			$={a => onAction(a).pipe(triggerEvent(el, 'drawer.close'))}
			className="link"
			href={get(el, 'href')}
			tabIndex={-1}
		>
			<div className="content">
				<slot />
			</div>
		</a>
	))
)
export class Item extends Component {
	static tagName = 'cxl-item';

	@Attribute()
	href = '';

	@StyleAttribute()
	selected = false;

	@StyleAttribute()
	disabled = false;

	@Attribute()
	touched = false;
}

@Augment<List>(
	role('list'),
	<Style>
		{{
			$: {
				paddingTop: 8,
				paddingBottom: 8,
				marginLeft: -16,
				marginRight: -16,
			},
		}}
	</Style>
)
export class List extends Component {
	static tagName = 'cxl-list';
}

@Augment(
	<Host>
		<Style>
			{{
				$: {
					elevation: 1,
					display: 'inline-block',
					backgroundColor: 'surface',
					overflowY: 'auto',
					color: 'onSurface',
					paddingTop: 8,
					paddingBottom: 8,
				},
				$dense: { paddingTop: 0, paddingBottom: 0 },
				$closed: { scaleY: 0 },
			}}
		</Style>
		<slot />
	</Host>
)
export class Menu extends Component {
	static tagName = 'cxl-menu';

	@StyleAttribute()
	closed = false;

	@StyleAttribute()
	dense = false;
}

@Augment<Progress>(
	<Style>
		{{
			$: { backgroundColor: 'primaryLight', height: 4 },
			indicator: {
				backgroundColor: 'primary',
				height: 4,
				transformOrigin: 'left',
			},
			indeterminate: { animation: 'wait' },
		}}
	</Style>,
	render(host => (
		<div
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
		></div>
	)),
	role('progressbar')
)
export class Progress extends Component {
	static tagName = 'cxl-progress';
	// events?: 'change';
	@Attribute()
	value = Infinity;
}

export function Svg(p: {
	viewBox: string;
	className?: string;
	width?: number;
	height?: number;
	children: string;
}) {
	return () => {
		const el = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		el.innerHTML = p.children;
		el.setAttribute('viewBox', p.viewBox);
		if (p.width) el.setAttribute('width', p.width.toString());
		if (p.height) el.setAttribute('height', p.height.toString());
		if (p.className) el.setAttribute('class', p.className);
		return el;
	};
}

theme.animation.spinnerstroke = {
	keyframes: `
0%      { stroke-dashoffset: $start;  transform: rotate(0); }
12.5%   { stroke-dashoffset: $end;    transform: rotate(0); }
12.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(72.5deg); }
25%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(72.5deg); }
25.0001%   { stroke-dashoffset: $start;  transform: rotate(270deg); }
37.5%   { stroke-dashoffset: $end;    transform: rotate(270deg); }
37.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(161.5deg); }
50%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(161.5deg); }
50.0001%  { stroke-dashoffset: $start;  transform: rotate(180deg); }
62.5%   { stroke-dashoffset: $end;    transform: rotate(180deg); }
62.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(251.5deg); }
75%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(251.5deg); }
75.0001%  { stroke-dashoffset: $start;  transform: rotate(90deg); }
87.5%   { stroke-dashoffset: $end;    transform: rotate(90deg); }
87.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(341.5deg); }
100%    { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(341.5deg); }
		`
		.replace(/\$start/g, (282.743 * (1 - 0.05)).toString())
		.replace(/\$end/g, (282.743 * (1 - 0.8)).toString()),
	value: 'cxl-spinnerstroke 4s infinite cubic-bezier(.35,0,.25,1)',
};

@Augment(
	<Host>
		<Style>
			{{
				$: { animation: 'spin', display: 'inline-block' },
				circle: { animation: 'spinnerstroke' },
				svg: { width: pct(100), height: pct(100) },
			}}
		</Style>
		<Svg viewBox="0 0 100 100" className="svg">{`<circle
				cx="50%"
				cy="50%"
				r="45"
				style="stroke:var(--cxl-primary);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px"
				class="circle"
			/>`}</Svg>
	</Host>
)
export class Spinner extends Component {
	static tagName = 'cxl-spinner';
}

@Augment(
	<Host>
		<Style>
			{{
				$: { display: 'block', font: 'default', marginBottom: 8 },
				$lastChild: { marginBottom: 0 },
				$inline: { display: 'inline' },

				$caption: { font: 'caption' },
				$h1: { font: 'h1', marginBottom: 64 },
				$h2: { font: 'h2', marginBottom: 48 },
				$h3: { font: 'h3', marginBottom: 32 },
				$h4: { font: 'h4', marginBottom: 24 },
				$h5: { font: 'h5', marginBottom: 16 },
				$h6: { font: 'h6', marginBottom: 16 },
				$button: { font: 'button' },
				$subtitle: { font: 'subtitle', marginBottom: 0 },
				$subtitle2: { font: 'subtitle2', opacity: 0.73 },
			}}
		</Style>
		<slot />
	</Host>
)
export class T extends Component {
	static tagName = 'cxl-t';

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
	subtitle = false;
	@StyleAttribute()
	subtitle2 = false;
}

@Augment<Toggle>(
	<Host>
		<Focusable />
		<Style>
			{{
				popup: {
					display: 'none',
					height: 0,
					elevation: 5,
					position: 'absolute',
				},
				$disabled: { pointerEvents: 'none' },
				popup$opened: { display: 'block' },
			}}
		</Style>
		<slot />
		<div className="popup">
			<slot />
		</div>
	</Host>,
	bind(el => {
		return onAction(el).pipe(
			tap(ev => {
				if (el.disabled) return;
				el.opened = !el.opened;
				ev.stopPropagation();
			})
		);
	})
)
export class Toggle extends Component {
	@StyleAttribute()
	disabled = false;
	@Attribute()
	touched = false;
	@StyleAttribute()
	opened = false;
}

/*
	component({
		name: 'cxl-icon-toggle',
		attributes: ['icon'],
		extend: 'cxl-toggle',
		template: `
<span &="=opened:hide .focusCircle .focusCirclePrimary"></span>
<cxl-icon &="=icon:@icon"></cxl-icon>
<div &="id(popup) =opened:show .popup content(cxl-toggle-popup)"></div>
	`,
		styles: [
			FocusCircleCSS,
			{
				$: {
					paddingTop: 8,
					paddingBottom: 8,
					paddingLeft: 12,
					paddingRight: 12,
					cursor: 'pointer',
					position: 'relative'
				},
				focusCircle: { left: -4 }
			}
		]
	});*/

@Augment(
	role('button'),
	<Host>
		<Focusable />
		<Style>
			{{
				$: {
					elevation: 1,
					paddingTop: 8,
					paddingBottom: 8,
					paddingRight: 16,
					paddingLeft: 16,
					cursor: 'pointer',
					display: 'inline-block',
					position: 'relative',
					font: 'button',
					borderRadius: 2,
					userSelect: 'none',
					backgroundColor: 'surface',
					color: 'onSurface',
					textAlign: 'center',
					height: 36,
				},

				$big: { padding: 16, font: 'h5', height: 52 },
				$flat: {
					backgroundColor: 'inherit',
					elevation: 0,
					paddingRight: 8,
					paddingLeft: 8,
					color: 'inherit',
				},

				$primary: {
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				$secondary: {
					backgroundColor: 'secondary',
					color: 'onSecondary',
				},
				$round: { borderRadius: 52 },

				$active: { elevation: 3 },
				$active$disabled: { elevation: 1 },
				$active$flat$disabled: { elevation: 0 },
				'@large': {
					$flat: { paddingLeft: 12, paddingRight: 12 },
				},
			}}
		</Style>
	</Host>,
	bind(ripple)
)
export class ButtonBase extends Component {
	@Attribute()
	disabled = false;
	@StyleAttribute()
	primary = false;
	@StyleAttribute()
	flat = false;
	@StyleAttribute()
	secondary = false;
	@Attribute()
	touched = false;
	@StyleAttribute()
	big = false;
	@StyleAttribute()
	outline = false;
}

@Augment(<slot />)
export class Button extends ButtonBase {
	static tagName = 'cxl-button';
}

@Augment<Snackbar>(
	<Style>
		{{
			$: {
				display: 'block',
				opacity: 0,
				scaleX: 0.5,
				scaleY: 0.5,
				padding: 16,
				elevation: 3,
				backgroundColor: 'onSurface87',
				color: 'surface',
				marginBottom: 16,
			},

			'@small': { $: { display: 'inline-block' } },
		}}
	</Style>,
	<slot />,
	connect(host => {
		requestAnimationFrame(() => {
			host.style.opacity = '1';
			host.style.transform = 'scale(1,1)';
		});
	})
)
export class Snackbar extends Component {
	static tagName = 'cxl-snackbar';
	@Attribute()
	delay = 4000;
}

@Augment(
	<Host>
		<Style>
			{{
				$: {
					position: 'fixed',
					left: 16,
					bottom: 16,
					right: 16,
					textAlign: 'center',
				},
				$left: { textAlign: 'left' },
				$right: { textAlign: 'right' },
			}}
		</Style>
	</Host>
)
export class SnackbarContainer extends Component {
	static tagName = 'cxl-snackbar-container';

	queue: Snackbar[] = [];

	private notifyNext() {
		const next = this.queue[0];

		this.appendChild(next);

		setTimeout(() => {
			remove(next);

			this.queue.shift();

			if (this.queue.length) this.notifyNext();
		}, next.delay);
	}

	notify(snackbar: Snackbar) {
		this.queue.push(snackbar);

		if (this.queue.length === 1) this.notifyNext();
	}
}

@Augment<Tab>(
	role('tab'),
	<Focusable />,
	<Style>
		{{
			$: { flexShrink: 0 },
			'@small': {
				$: { display: 'inline-block' },
			},
			link: {
				padding: 16,
				paddingBottom: 12,
				backgroundColor: 'primary',
				font: 'button',
				color: 'onPrimary',
				lineHeight: 20,
				textDecoration: 'none',
				textAlign: 'center',
				display: 'block',
			},
		}}
	</Style>,
	render(host => (
		<a
			className="link"
			href={get(host, 'href').pipe(map(val => val || 'javascript:'))}
		>
			<slot />
		</a>
	)),
	bind(ripple),
	bind(host =>
		get(host, 'selected').pipe(
			tap(val => {
				if (val) trigger(host, 'cxl-tab.selected');
			})
		)
	)
)
export class Tab extends Component {
	static tagName = 'cxl-tab';

	@Attribute()
	href?: string;

	@Attribute()
	selected = false;
}

@Augment<Tabs>(
	role('tablist'),
	<Host>
		<Style>
			{{
				$: {
					backgroundColor: 'primary',
					color: 'onPrimary',
					display: 'block',
					flexShrink: 0,
					position: 'relative',
					cursor: 'pointer',
					overflowX: 'auto',
				},
				selected: {
					transformOrigin: 'left',
					backgroundColor: 'secondary',
					height: 4,
					width: 100,
					scaleX: 0,
					display: 'none',
				},
				content: { display: 'flex' },
				content$small: { display: 'block' },
			}}
		</Style>
		<div className="content">
			<slot />
		</div>
	</Host>,
	bind(el => {
		return merge(
			on(el, 'cxl-tab.selected').pipe(
				tap(ev => {
					if (el.selected) el.selected.selected = false;
					if (ev.target instanceof Tab) el.selected = ev.target;
				})
			)
		);
	}),
	render(host => (
		<div
			className="selected"
			$={el =>
				get(host, 'selected').pipe(
					tap(sel => {
						if (!sel) return (el.style.transform = 'scaleX(0)');

						// Add delay so styles finish rendering...
						requestAnimationFrame(() => {
							const scaleX = sel.clientWidth / 100;
							el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
							el.style.display = 'block';
						});
					})
				)
			}
		/>
	))
)
export class Tabs extends Component {
	static tagName = 'cxl-tabs';

	@Attribute()
	selected?: Tab;
}

function Head(p: { children: any }) {
	const children = normalizeChildren(p.children);
	return (ctx: any) => {
		children.forEach(child => document.head.appendChild(child(ctx)));
	};
}

@Augment(
	'cxl-meta',
	<Head>
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="mobile-web-app-capable" content="yes" />
		<link
			rel="stylesheet"
			href="https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap"
		/>
		<style>{`body,html{padding:0;margin:0;height:100%}`}</style>
	</Head>
)
export class Meta extends Component {}

@Augment(
	'cxl-application',
	<Host>
		<Style>
			{{
				$: { display: 'flex', flexDirection: 'column', height: '100%' },
			}}
		</Style>
		<slot />
	</Host>
)
export class Application extends Component {}
