import { dom, Host } from '../xdom/index.js';
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
	onUpdate
} from '../component/index.js';
import { onAction, triggerEvent, portal } from '../template/index.js';
import { on, remove, setAttribute, trigger } from '../dom/index.js';
import { tap, merge, debounceTime } from '../rx/index.js';
import { Style, StyleSheet, pct, theme } from '../css/index.js';

const StateStyles = {
	$active: { filter: 'invert(0.2)' },
	$focus: {
		outline: 0,
		filter: 'invert(0.2) saturate(2) brightness(1.1)'
	},
	$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
	$disabled: {
		cursor: 'default',
		filter: 'saturate(0)',
		opacity: 0.38,
		pointerEvents: 'none'
	}
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
					pointerEvents: 'none'
				},
				ripple: {
					position: 'relative',
					borderRadius: pct(100),
					scaleX: 0,
					scaleY: 0,
					backgroundColor: 'onSurface',
					opacity: 0.16,
					animation: 'expand',
					animationDuration: '0.4s'
				},
				ripple$primary: { backgroundColor: 'primary' },
				ripple$secondary: { backgroundColor: 'secondary' }
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
	<Host>
		<Style>{{}}</Style>
		<slot />
	</Host>
)
export class RippleContainer extends Component {}

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
					elevation: 2
				},
				flex: {
					display: 'flex',
					alignItems: 'center',
					height: 56,
					paddingLeft: 16,
					paddingRight: 16,
					paddingTop: 4,
					paddingBottom: 4
				},

				flex$extended: {
					alignItems: 'start',
					height: 128,
					paddingBottom: 24
				},
				$fixed: { position: 'fixed', top: 0, right: 0, left: 0 },
				'@xlarge': {
					flex$center: {
						width: 1200,
						marginLeft: 'auto',
						marginRight: 'auto',
						paddingRight: 0,
						paddingLeft: 0
					},
					tabs$center: {
						width: 1200,
						marginLeft: 'auto',
						marginRight: 'auto'
					}
				}
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
					overflowY: 'hidden'
				},
				$little: {
					width: 32,
					height: 32,
					font: 'default',
					lineHeight: 30
				},
				$big: { width: 64, height: 64, font: 'h4', lineHeight: 62 },
				image: {
					width: pct(100),
					height: pct(100),
					borderRadius: 32
				}
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
					elevation: 1
				}
			}}
		</Style>
		<slot></slot>
	</Host>
)
export class Card extends Component {
	static tagName = 'cxl-card';
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
					backgroundColor: 'primary'
				},
				$secondary: {
					color: 'onSecondary',
					backgroundColor: 'secondary'
				},
				$error: { color: 'onError', backgroundColor: 'error' },
				$top: { translateY: -11 },
				$over: { marginLeft: -8 }
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
					lineHeight: 16
				},
				$static: { position: 'static' },
				$focus: { elevation: 4 },
				$small: { top: 28, bottom: '' }
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
					backgroundColor: 'divider'
				}
			}}
		</Style>
	</Host>
)
export class Hr extends Component {
	static tagName = 'cxl-hr';
}

@Augment<Progress>(
	<Style>
		{{
			$: { backgroundColor: 'primaryLight', height: 4 },
			indicator: {
				backgroundColor: 'primary',
				height: 4,
				transformOrigin: 'left'
			},
			indeterminate: { animation: 'wait' }
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

function Svg(p: { viewBox: string; className?: string; children: string }) {
	return () => {
		const el = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'svg'
		);
		el.innerHTML = p.children;
		el.setAttribute('viewBox', p.viewBox);
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
	value: 'cxl-spinnerstroke 4s infinite cubic-bezier(.35,0,.25,1)'
};

@Augment(
	<Host>
		<Style>
			{{
				$: { animation: 'spin', display: 'inline-block' },
				circle: { animation: 'spinnerstroke' },
				svg: { width: pct(100), height: pct(100) }
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
				$subtitle2: { font: 'subtitle2', opacity: 0.73 }
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
}

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
					height: 36
				},

				$big: { padding: 16, font: 'h5', height: 52 },
				$flat: {
					backgroundColor: 'inherit',
					elevation: 0,
					paddingRight: 8,
					paddingLeft: 8,
					color: 'inherit'
				},

				$primary: {
					backgroundColor: 'primary',
					color: 'onPrimary'
				},
				$secondary: {
					backgroundColor: 'secondary',
					color: 'onSecondary'
				},
				$round: { borderRadius: 52 },

				$active: { elevation: 3 },
				$active$disabled: { elevation: 1 },
				$active$flat$disabled: { elevation: 0 },
				'@large': {
					$flat: { paddingLeft: 12, paddingRight: 12 }
				}
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

@Augment(<slot></slot>)
export class Button extends ButtonBase {
	static tagName = 'cxl-button';
}
