import {
	Attribute,
	Augment,
	Component,
	Slot,
	StyleAttribute,
	attributeChanged,
	bind,
	get,
	onUpdate,
	render,
	role,
} from '../component/index.js';
import { Host, RenderContext, dom, normalizeChildren } from '../xdom/index.js';
import { Observable, debounceTime, defer, merge, tap } from '../rx/index.js';
import {
	Style,
	StyleSheet,
	border,
	padding,
	pct,
	theme,
} from '../css/index.js';
import {
	getAttribute,
	onAction,
	stopEvent,
	triggerEvent,
} from '../template/index.js';
import { on, remove, trigger } from '../dom/index.js';

export const FocusHighlight = {
	$active: { filter: 'invert(0.2)' },
	$focus: {
		filter: 'invert(0.2) saturate(2) brightness(1.1)',
	},
	$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
};

const StateStyles = {
	$focus: {
		outline: 0,
	},
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

function findNextNode<T extends ChildNode>(
	el: T,
	fn: (el: T) => boolean,
	direction: 'nextSibling' | 'previousSibling' = 'nextSibling'
) {
	let node = el[direction] as T;

	while (node) {
		if (fn(node)) return node;
		node = node[direction] as T;
	}

	return undefined;
}

function findNextNodeBySelector(
	el: Element,
	selector: string,
	direction:
		| 'nextElementSibling'
		| 'previousElementSibling' = 'nextElementSibling'
) {
	let node = el[direction] as T;

	while (node) {
		if (node.matches(selector)) return node;
		node = node[direction] as T;
	}
	return undefined;
}

interface SelectableNode extends ParentNode, EventTarget {
	selected?: Element;
}

/**
 * Handles keyboard navigation, emits the next selected item.
 */
export function navigationList(host: SelectableNode, selector: string) {
	return on(host, 'keydown').map(ev => {
		let el = host.selected;
		const key = ev.key;

		function findByFirstChar(item: Node) {
			return item.textContent?.[0].toLowerCase() === key;
		}

		switch (key) {
			case 'ArrowDown':
				if (el) el = findNextNodeBySelector(el, selector) || el;
				else {
					const first = host.firstElementChild;

					if (first)
						el = first.matches(selector)
							? first
							: findNextNodeBySelector(first, selector);
				}
				if (el) ev.preventDefault();

				break;
			case 'ArrowUp':
				if (el)
					el =
						findNextNodeBySelector(
							el,
							selector,
							'previousElementSibling'
						) || el;
				else {
					const first = host.lastElementChild;

					if (first)
						el = first.matches(selector)
							? first
							: findNextNodeBySelector(
									first,
									selector,
									'previousElementSibling'
							  );
				}
				if (el) ev.preventDefault();
				break;
			default:
				if (/^\w$/.test(key)) {
					const first = host.firstElementChild;
					el =
						(el && findNextNode(el, findByFirstChar)) ||
						(first && findNextNode(first, findByFirstChar)) ||
						undefined;
					ev.preventDefault();
				}
		}
		return el;
	});
}

interface FocusableComponent extends Component {
	disabled: boolean;
	touched: boolean;
}

export function focusableEvents<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return merge(
		on(element, 'focus').pipe(triggerEvent(host, 'focusable.focus')),
		on(element, 'blur').tap(() => {
			host.touched = true;
			trigger(host, 'focusable.blur');
		}),
		attributeChanged(host, 'touched').pipe(
			triggerEvent(host, 'focusable.touched')
		)
	);
}

export function focusableDisabled<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return get(host, 'disabled').tap(value => {
		host.setAttribute('aria-disabled', value ? 'true' : 'false');
		if (value) element.removeAttribute('tabindex');
		else element.tabIndex = 0;
	});
}

export function focusable<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return merge(
		focusableDisabled(host, element),
		focusableEvents(host, element)
	);
}

const stateStyles = new StyleSheet({ styles: StateStyles });

/**
 * Adds focusable functionality to input components.
 */
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

export function registableHost<TargetT extends EventTarget>(
	host: EventTarget,
	id: string
) {
	const elements = new Set<TargetT>();

	function register(ev: Event) {
		if (ev.target) elements.add(ev.target as TargetT);
	}

	function unregister(ev: Event) {
		if (ev.target) elements.delete(ev.target as TargetT);
	}

	return merge(
		on(host, id + '.register').tap(register),
		on(host, id + '.unregister').tap(unregister)
	).map(() => elements);
}

interface SelectableComponent extends Component {
	selected: boolean;
}

export function aria(prop: string, value: string) {
	return (ctx: RenderContext) =>
		ctx.bind(defer(() => ctx.host.setAttribute(`aria-${prop}`, value)));
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

interface SelectableTarget extends EventTarget {
	value: any;
	selected: boolean;
}

/**
 * Handles element selection events. Emits everytime a new item is selected.
 */
export function selectableHost<TargetT extends SelectableTarget>(
	host: ValueElement
) {
	return new Observable<TargetT>(subscriber => {
		let selected: any;
		let options: Set<TargetT>;

		function setSelected(option: TargetT) {
			subscriber.next((selected = option));
		}

		function onChange() {
			const value = host.value;

			if (!options || (selected && selected.value === value)) return;
			selected = undefined;

			for (const o of options)
				if (o.value === value || o.selected) {
					setSelected(o);
				} else o.selected = false;
		}

		const subscription = merge(
			registableHost<TargetT>(host, 'selectable').tap(val => {
				options = val;
				onChange();
			}),
			getAttribute(host, 'value').tap(onChange),
			on(host, 'selectable.action').tap(ev => {
				if (ev.target && options?.has(ev.target as TargetT)) {
					ev.stopImmediatePropagation();
					ev.stopPropagation();
					setSelected(ev.target as TargetT);
				}
			})
		).subscribe();

		return () => subscription.unsubscribe();
	});
}

export function selectable<T extends SelectableComponent>(host: T) {
	return merge(
		registable(host, 'selectable'),
		onAction(host).pipe(
			triggerEvent(host, 'selectable.action'),
			stopEvent()
		),
		get(host, 'selected').pipe(ariaProp(host, 'selected'))
	);
}

@Augment<Ripple>(
	'cxl-ripple',
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
export class RippleContainer extends Component {}

const AVATAR_DEFAULT =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 0 26 26' %3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E";

/**
 * @example
 * <cxl-avatar></cxl-avatar>
 * <cxl-avatar big></cxl-avatar>
 * <cxl-avatar little></cxl-avatar>
 */
@Augment<Avatar>(
	'cxl-avatar',
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
	@StyleAttribute()
	big = false;
	@StyleAttribute()
	little = false;
	@Attribute()
	src = '';
	@Attribute()
	text = '';
}

/**
 * @example
 * <cxl-chip>Single Chip</cxl-chip>
 * <cxl-chip removable>Removable Chip</cxl-chip>
 * <cxl-chip><cxl-icon icon="home"></cxl-icon> Chip with Icon</cxl-chip>
 * <cxl-chip><cxl-avatar little></cxl-avatar> Chip with Avatar</cxl-chip>
 * <cxl-chip little removable>Removable Chip</cxl-chip>
 */
@Augment<Chip>(
	'cxl-chip',
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
				...FocusHighlight,
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

/**
 * @example
 * <cxl-icon icon="envelope"></cxl-icon><cxl-badge top over>5</cxl-badge>
 * <cxl-icon icon="shopping-cart"></cxl-icon><cxl-badge secondary top over>5</cxl-badge>
 * <cxl-icon icon="exclamation-triangle"></cxl-icon><cxl-badge error top over>5</cxl-badge>
 */
@Augment(
	'cxl-badge',
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
					textAlign: 'center',
					verticalAlign: 'top',
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
	'cxl-hr',
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
export class Hr extends Component {}

/**
 * Linear progress indicators display progress by animating an indicator along the length of a fixed, visible track.
 * The behavior of the indicator is dependent on whether the progress of a process is known.
 * @example
 * <cxl-progress></cxl-progress><br/>
 * <cxl-progress value="0.5"></cxl-progress>
 */
@Augment<Progress>(
	'cxl-progress',
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

/**
 * @example
 * <cxl-spinner></cxl-spinner>
 */
@Augment(
	'cxl-spinner',
	<Host>
		<Style>
			{{
				$: {
					animation: 'spin',
					display: 'inline-block',
					width: 48,
					height: 48,
				},
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
export class Spinner extends Component {}

@Augment(
	'cxl-t',
	<Host>
		<Style>
			{{
				$: { display: 'block', font: 'default', marginBottom: 8 },
				$inline: { display: 'inline', marginTop: 0, marginBottom: 0 },

				$caption: { font: 'caption' },
				$h1: { font: 'h1', marginTop: 32, marginBottom: 64 },
				$h2: { font: 'h2', marginTop: 24, marginBottom: 48 },
				$h3: { font: 'h3', marginTop: 24, marginBottom: 32 },
				$h4: { font: 'h4', marginTop: 30, marginBottom: 30 },
				$h5: { font: 'h5', marginTop: 24, marginBottom: 24 },
				$h6: { font: 'h6', marginTop: 16, marginBottom: 16 },
				$button: { font: 'button' },
				$subtitle: { font: 'subtitle', marginBottom: 0 },
				$subtitle2: { font: 'subtitle2', opacity: 0.73 },
				$code: { font: 'code' },
				$firstChild: { marginTop: 0 },
				$lastChild: { marginBottom: 0 },
			}}
		</Style>
		<slot />
	</Host>
)
export class T extends Component {
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
	@StyleAttribute()
	code = false;
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

				$big: { ...padding(16), font: 'h5', height: 52 },
				$flat: {
					elevation: 0,
					paddingRight: 8,
					paddingLeft: 8,
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
				$primary: {
					backgroundColor: 'primary',
					color: 'onPrimary',
				},
				$secondary: {
					backgroundColor: 'secondary',
					color: 'onSecondary',
				},

				$active: { elevation: 3 },
				$active$disabled: { elevation: 1 },
				$active$flat$disabled: { elevation: 0 },
				'@large': {
					$flat: { paddingLeft: 12, paddingRight: 12 },
				},
			}}
		</Style>
		<Style>{FocusHighlight}</Style>
	</Host>,
	bind(ripple)
)
export class ButtonBase extends Component {
	@StyleAttribute()
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

/**
 * @example
 * <cxl-button primary><cxl-icon icon="upload"></cxl-icon> Upload</cxl-button>
 * <cxl-button secondary>Secondary</cxl-button>
 * <cxl-button disabled>Disabled</cxl-button>
 * <cxl-button flat>Flat Button</cxl-button>
 * <cxl-button outline>With Outline</cxl-button>
 */
@Augment('cxl-button', <slot />)
export class Button extends ButtonBase {}

function Head(p: { children: any }) {
	const children = normalizeChildren(p.children);
	return (ctx: any) => {
		const head = ctx.host.ownerDocument.head;
		children.forEach(child => head.appendChild(child(ctx)));
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
