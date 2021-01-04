import {
	Attribute,
	Augment,
	Component,
	Slot,
	Span,
	StyleAttribute,
	attributeChanged,
	bind,
	get,
	onUpdate,
	role,
} from '@cxl/component';
import { Bindable, dom, expression } from '@cxl/tsx';
import { EMPTY, Observable, defer, merge, tap } from '@cxl/rx';
import { StyleSheet, border, css, padding, pct } from '@cxl/css';
import { getAttribute, stopEvent, triggerEvent } from '@cxl/template';
import { on, onAction, remove, trigger } from '@cxl/dom';
import { InversePrimary, ResetSurface } from './theme.js';

export { Span } from '@cxl/component';

export const FocusHighlight = {
	$focus: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
	$hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
};

export const DisabledStyles = {
	cursor: 'default',
	filter: 'saturate(0)',
	opacity: 0.38,
	pointerEvents: 'none',
};

export const StateStyles = {
	$focus: { outline: 0 },
	$disabled: DisabledStyles,
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
	return onAction(element).raf(ev => {
		if (!element.disabled) attachRipple(element, ev as any);
	});
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
	return null;
}

interface SelectableNode extends ParentNode, EventTarget {}

/**
 * Handles keyboard navigation, emits the next selected item.
 */
export function navigationList(
	host: SelectableNode,
	selector: string,
	startSelector: string
) {
	return on(host, 'keydown')
		.map(ev => {
			let el = host.querySelector(startSelector);
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
							null;
						ev.preventDefault();
					}
			}
			return el;
		})
		.filter(el => !!el);
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
		attributeChanged(host, 'disabled').pipe(
			triggerEvent(host, 'focusable.change')
		),
		attributeChanged(host, 'touched').pipe(
			triggerEvent(host, 'focusable.change')
		)
	);
}

export function disabledAttribute<T extends FocusableComponent>(host: T) {
	return get(host, 'disabled').tap(value =>
		host.setAttribute('aria-disabled', value ? 'true' : 'false')
	);
}

export function focusableDisabled<T extends FocusableComponent>(
	host: T,
	element: HTMLElement = host
) {
	return disabledAttribute(host).tap(value => {
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

const disabledCss = css({ $disabled: DisabledStyles });

interface DisableElement extends HTMLElement {
	disabled: boolean;
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

/**
 * Adds focusable functionality to input components.
 */
export function Focusable(host: Bindable) {
	host.bind(focusable(host as FocusableComponent));
	return stateStyles.clone();
}

export function registable<T extends Component>(host: T, id: string) {
	return new Observable(() => {
		trigger(host, id + '.register');
		return () => trigger(host, id + '.unregister');
	});
}

export function registableHost<TargetT extends EventTarget>(
	host: EventTarget,
	id: string,
	elements = new Set<TargetT>()
) {
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

export function aria<T extends Component>(prop: string, value: string) {
	return (ctx: T) =>
		ctx.bind(defer(() => ctx.setAttribute(`aria-${prop}`, value)));
}

export function ariaValue(host: Element, prop: string) {
	return tap<string | number>(val =>
		host.setAttribute('aria-' + prop, val.toString())
	);
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

interface SelectableHost<T> extends Element {
	value: any;
	options?: Set<T>;
}

/**
 * Handles element selection events. Emits everytime a new item is selected.
 */
export function selectableHost<TargetT extends SelectableTarget>(
	host: SelectableHost<TargetT>,
	isMultiple = false
) {
	return new Observable<TargetT>(subscriber => {
		let selected: any;
		let options: Set<TargetT> | undefined;

		function setSelected(option: TargetT) {
			subscriber.next((selected = option));
		}

		function onOptionsChange(newOptions: Set<TargetT>) {
			const value = host.value;
			let first: TargetT | null = null;
			options = undefined;
			for (const o of newOptions) {
				first = first || o;
				const isNotFound = value?.indexOf(o.value) === -1;
				if (o.selected && (value === undefined || isNotFound))
					setSelected(o);
			}

			if (!selected && first) setSelected(first);

			options = newOptions;
		}

		function onChangeMultiple() {
			const value = host.value;

			if (!options) return;

			for (const o of options) {
				const isFound = value.indexOf(o.value) !== -1;
				if (isFound) {
					if (!o.selected) setSelected(o);
				} else o.selected = false;
			}
		}

		function onChangeSingle() {
			const value = host.value;

			if (!options || (selected && selected.value === value)) return;

			for (const o of options)
				if (o.value === value || !selected) setSelected(o);
				else o.selected = false;
		}

		const onChange = isMultiple ? onChangeMultiple : onChangeSingle;
		const subscription = merge(
			getAttribute(host, 'options')
				.raf()
				.tap(val => {
					if (val) onOptionsChange(val);
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
					on(el, 'animationend').tap(() => remove(ctx))
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
	bind(ripple),
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

const AVATAR_DEFAULT =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='-1 0 26 26' %3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3C/svg%3E";

/**
 * Avatars are circular components that usually wrap an image or icon.
 * They can be used to represent a person or an object.
 * @example
 * <cxl-avatar></cxl-avatar>
 * <cxl-avatar big></cxl-avatar>
 * <cxl-avatar little></cxl-avatar>
 */
@Augment<Avatar>(
	'cxl-avatar',
	role('img'),
	css({
		$: {
			borderRadius: 32,
			backgroundColor: 'surface',
			width: 40,
			height: 40,
			display: 'inline-block',
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
	}),
	node => (
		<>
			{() => {
				const el = (
					<img className="image" alt="avatar" />
				) as HTMLImageElement;

				node.bind(
					get(node, 'src').tap(src => {
						el.src = src || AVATAR_DEFAULT;
						el.style.display = src || !node.text ? 'block' : 'none';
					})
				);
				return el;
			}}
			{expression(node, get(node, 'text'))}
		</>
	)
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
 * Chips are compact elements that represent an input, attribute, or action.
 * @example
 * <cxl-chip>Single Chip</cxl-chip>
 * <cxl-chip removable>Removable Chip</cxl-chip>
 * <cxl-chip><cxl-icon icon="home"></cxl-icon> Chip with Icon</cxl-chip>
 * <cxl-chip><cxl-avatar little></cxl-avatar> Chip with Avatar</cxl-chip>
 * <cxl-chip little removable>Removable Chip</cxl-chip>
 */
@Augment<Chip>(
	'cxl-chip',
	Focusable,
	css({
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
		$small: { font: 'caption', lineHeight: 20, height: 20 },
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
	}),
	$ => (
		<>
			<span className="avatar">
				<$.Slot selector="cxl-avatar" />
			</span>
			<span className="content">
				<slot />
			</span>
		</>
	),
	host => (
		<Span
			$={el => on(el, 'click').tap(() => host.remove())}
			className="remove"
		>
			x
		</Span>
	),
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
	small = false;

	remove() {
		remove(this);
		trigger(this, 'cxl-chip.remove');
	}
}

/**
 * Chips represent complex entities in small blocks. A chip can contain several
 * different elements such as avatars, text, and icons.
 *
 * @example
 * <cxl-icon icon="envelope"></cxl-icon><cxl-badge top over>5</cxl-badge>
 * <cxl-icon icon="shopping-cart"></cxl-icon><cxl-badge secondary top over>5</cxl-badge>
 * <cxl-icon icon="exclamation-triangle"></cxl-icon><cxl-badge error top over>5</cxl-badge>
 */
@Augment(
	'cxl-badge',
	css({
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
	}),
	() => <slot />
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
	css({
		$: {
			display: 'block',
			height: 1,
			backgroundColor: 'divider',
		},
	})
)
export class Hr extends Component {}

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

export function Svg(p: {
	viewBox: string;
	className?: string;
	width?: number;
	height?: number;
	children: string;
}) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	el.style.fill = 'var(--cxl-on-surface)';
	el.innerHTML = p.children;
	el.setAttribute('viewBox', p.viewBox);
	if (p.width !== undefined) el.setAttribute('width', p.width.toString());
	if (p.height !== undefined) el.setAttribute('height', p.height.toString());
	if (p.className !== undefined) el.setAttribute('class', p.className);
	return el;
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
		<Svg viewBox="0 0 100 100" className="svg">{`<circle
				cx="50%"
				cy="50%"
				r="45"
				style="stroke:var(--cxl-primary);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px"
				class="circle"
			/>`}</Svg>
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
	}),
	_ => <slot />
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
}

/**
 * @example
 * <cxl-toggle>
 *   <cxl-icon-button slot="trigger">
 *     <cxl-icon icon="ellipsis-v"></cxl-icon>
 *   </cxl-icon-button>
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
	bind(el =>
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
)
export class Toggle extends Component {
	@StyleAttribute()
	opened = false;
	@StyleAttribute()
	right = false;
}

@Augment(
	role('button'),
	Focusable,
	css({
		$: {
			elevation: 1,
			paddingTop: 8,
			paddingBottom: 8,
			paddingRight: 16,
			paddingLeft: 16,
			cursor: 'pointer',
			display: 'inline-block',
			font: 'button',
			borderRadius: 2,
			userSelect: 'none',
			backgroundColor: 'surface',
			color: 'onSurface',
			textAlign: 'center',
		},

		$big: { ...padding(16), font: 'h5' },
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
		$active$flat: { elevation: 0 },
		'@large': {
			$flat: { paddingLeft: 12, paddingRight: 12 },
		},
	}),
	css(FocusHighlight),
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
 * Buttons allow users to take actions, and make choices, with a single tap.
 * @example
 * <cxl-button primary><cxl-icon icon="upload"></cxl-icon> Upload</cxl-button>
 * <cxl-button secondary>Secondary</cxl-button>
 * <cxl-button disabled>Disabled</cxl-button>
 * <cxl-button flat>Flat Button</cxl-button>
 * <cxl-button outline>With Outline</cxl-button>
 */
@Augment('cxl-button', Slot)
export class Button extends ButtonBase {}

@Augment(
	'cxl-icon-button',
	css({
		$: {
			fontSize: 'inherit',
			elevation: 0,
			paddingLeft: 8,
			paddingRight: 8,
		},
	}),
	Slot
)
export class IconButton extends ButtonBase {}

/**
 * Adds nodes to head on component rendering
 */
export function head(...nodes: Node[]) {
	return (host: Node) => {
		const head = host.ownerDocument?.head || document.head;
		nodes.forEach(child => head.appendChild(child));
	};
}

@Augment(
	'cxl-meta',
	head(
		<meta name="viewport" content="width=device-width, initial-scale=1" />,
		<meta name="apple-mobile-web-app-capable" content="yes" />,
		<meta name="mobile-web-app-capable" content="yes" />,
		<style>{`body,html{padding:0;margin:0;height:100%;font-family:var(--cxl-font)}a,a:active,a:visited{color:var(--cxl-link)}`}</style>
	)
)
export class Meta extends Component {
	connectedCallback() {
		document.documentElement.lang = 'en';
		super.connectedCallback();
	}
}

@Augment(
	'cxl-application',
	css({
		$: {
			display: 'flex',
			flexDirection: 'column',
			height: '100%',
			overflowX: 'hidden',
			zIndex: 0,
		},
		'@large': {
			$permanent: { marginLeft: 288 },
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
			alignItems: 'center',
			height: 56,
			...padding(4, 16, 4, 16),
		},
	}),
	Slot
)
export class Toolbar extends Component {}
