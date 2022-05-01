///<amd-module name="@cxl/ui/dialog.js"/>
import {
	Attribute,
	StyleAttribute,
	Slot,
	Augment,
	Component,
	attributeChanged,
	connect,
	get,
} from '@cxl/component';
import { padding, pct } from '@cxl/css';
import { css, scrollbarStyles } from './theme.js';
import { dom } from '@cxl/tsx';
import { insert, on, onAction, trigger } from '@cxl/dom';
import { EMPTY, merge, observable } from '@cxl/rx';
import { T, Span } from './core.js';
import { Button } from './button.js';
import { role } from '@cxl/template';

/**
 * A backdrop appears behind all other surfaces in an app, displaying contextual and actionable content.
 * @demo
 * <cxl-backdrop></cxl-backdrop>
 */
@Augment(
	'cxl-backdrop',
	css({
		$: {
			position: 'absolute',
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			backgroundColor: 'shadow',
			elevation: 5,
			overflowY: 'auto',
		},
		$center: {
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
		},
	}),
	$ =>
		on($, 'keydown')
			.log()
			.tap(ev => ev.stopPropagation()),
	() => <slot />
)
export class Backdrop extends Component {
	@StyleAttribute()
	center = false;
}

/**
 * Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.
 * @demo
 * <cxl-dialog>
		<cxl-c pad16>
		<cxl-t h5>Title</cxl-t>
		<cxl-t>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend.</cxl-t>
		</cxl-c>
	</cxl-dialog>
 */
@Augment(
	'cxl-dialog',
	role('dialog'),
	css({
		content: {
			backgroundColor: 'surface',
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			overflowY: 'auto',
			color: 'onSurface',
			textAlign: 'left',
		},
		'@small': {
			content: {
				elevation: 5,
				translateY: pct(-50),
				top: pct(50),
				bottom: 'auto',
				maxHeight: pct(85),
				width: pct(80),
				marginLeft: 'auto',
				marginRight: 'auto',
			},
		},
	}),
	() => (
		<Backdrop>
			<div className="content">
				<slot></slot>
			</div>
		</Backdrop>
	),
	$ =>
		observable(() => {
			requestAnimationFrame(() => {
				($.querySelector('[autofocus]') as HTMLElement)?.focus();
			});
		})
)
export class Dialog extends Component {}

const DialogStyles = css({
	content: padding(16),
	footer: padding(8),
});

/**
 * @demo
 * <cxl-dialog-alert tabindex="-1" title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
	</cxl-dialog-alert>
 */
@Augment<DialogAlert>(
	'cxl-dialog-alert',
	role('alertdialog'),
	DialogStyles,
	$ => (
		<Dialog>
			<div className="content">
				<T h5>{get($, 'title-text')}</T>
				<T>{get($, 'message')}</T>
			</div>
			<div className="footer">
				<Button
					autofocus
					flat
					$={el => onAction(el).tap(() => $.resolve())}
				>
					{get($, 'action')}
				</Button>
			</div>
		</Dialog>
	)
)
export class DialogAlert extends Component {
	resolve!: () => void;

	@Attribute()
	'title-text' = '';

	@Attribute()
	message = '';

	@Attribute()
	action = 'Ok';

	readonly promise = new Promise<void>(resolve => {
		this.resolve = resolve;
	});
}

/**
 * @demo
 * <cxl-dialog-confirm tabindex="-1" title-text="Confirmation Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit.">
	</cxl-dialog-confirm>
 */

@Augment<DialogConfirm>(
	'cxl-dialog-confirm',
	role('alertdialog'),
	DialogStyles,
	$ => (
		<Dialog>
			<div className="content">
				<T h5>{get($, 'title-text')}</T>
				<T>{get($, 'message')}</T>
			</div>
			<div className="footer">
				<Button
					autofocus
					flat
					$={el => onAction(el).tap(() => $.resolve(false))}
				>
					{get($, 'cancel-text')}
				</Button>
				<Button flat $={el => onAction(el).tap(() => $.resolve(true))}>
					{get($, 'action')}
				</Button>
			</div>
		</Dialog>
	)
)
export class DialogConfirm extends Component {
	resolve!: (val: boolean) => void;

	@Attribute()
	'cancel-text' = 'Cancel';

	@Attribute()
	'title-text' = '';

	@Attribute()
	message = '';

	@Attribute()
	action = 'Ok';

	readonly promise = new Promise<boolean>(resolve => {
		this.resolve = resolve;
	});
}

@Augment<ToggleDrawer>('cxl-toggle-drawer', $ =>
	onAction($).tap(() => {
		if (!$.drawer) return;
		const drawer = document.getElementById($.drawer) as Drawer;
		if (drawer) drawer.visible = !drawer.visible;
	})
)
export class ToggleDrawer extends Component {
	@Attribute()
	drawer?: string;
}

/**
 * Drawers are surfaces containing supplementary content that are anchored
 * to the left or right edge of the screen.
 * @demo
 * <cxl-drawer right permanent visible>
 *   <cxl-c pad16>
 *     <cxl-t h6>Right Drawer Title</cxl-t>
 *     <cxl-t>Right Drawer Content</cxl-t>
 *   </cxl-c>
 * </cxl-drawer>
 */
@Augment<Drawer>(
	'cxl-drawer',
	css({
		...scrollbarStyles('drawer'),
		drawer: {
			backgroundColor: 'surface',
			position: 'absolute',
			top: 0,
			left: 0,
			width: pct(85),
			bottom: 0,
			opacity: 0,
			color: 'onSurface',
			overflowY: 'auto',
			elevation: 5,
			translateX: pct(-105),
			animation: 'fadeOut',
		},
		drawer$right: { left: '100%', width: 0, translateX: 0 },
		drawer$right$visible: { translateX: pct(-100), width: 320 },
		drawer$visible: {
			translateX: 0,
			animation: 'fadeIn',
			display: 'block',
		},
		backdrop: {
			width: 0,
			opacity: 0,
		},
		backdrop$visible: { width: '100%', opacity: 1 },

		'@small': {
			drawer: { width: 288 },
		},
		'@large': {
			drawer$permanent: {
				translateX: 0,
				opacity: 1,
				transition: 'unset',
				animation: 'none',
			},
			backdrop$visible$permanent: { width: 0 },
			backdrop$visible$right: { width: '100%' },
		},
		'@xlarge': {
			drawer$right$permanent: {
				translateX: pct(-100),
				width: 320,
			},
			backdrop$visible$permanent$right: { width: 0 },
		},
	}),
	host => (
		<>
			<Backdrop
				className="backdrop"
				$={el =>
					on(el, 'click').tap(() => {
						trigger(host, 'backdrop.click');
						host.visible = false;
					})
				}
			/>
			<Span
				$={el =>
					merge(
						on(el, 'drawer.close').tap(
							() => (host.visible = false)
						),
						on(el, 'click').tap(ev => ev.stopPropagation()),
						attributeChanged(host, 'visible')
							.raf()
							.tap(visible => {
								if (!visible) el.scrollTo(0, 0);
							})
					)
				}
				className="drawer"
			>
				<slot />
			</Span>
		</>
	)
)
export class Drawer extends Component {
	@StyleAttribute()
	visible = false;

	@StyleAttribute()
	right = false;

	@StyleAttribute()
	permanent = false;
}

/**
 * Snackbars provide brief messages about app processes at the bottom of the screen.
 * @example
 * <cxl-snackbar>Snackbar Content</cxl-snackbar>
 */
@Augment<Snackbar>(
	'cxl-snackbar',
	css({
		$: {
			display: 'block',
			textAlign: 'center',
			opacity: 0,
			scaleX: 0.5,
			scaleY: 0.5,
			...padding(16),
			elevation: 3,
			backgroundColor: 'onSurface87',
			color: 'surface',
			marginBottom: 16,
			font: 'default',
		},

		'@small': { $: { display: 'inline-block' } },
	}),
	() => <slot />,
	connect(host => {
		requestAnimationFrame(() => {
			host.style.opacity = '1';
			host.style.transform = 'scale(1,1)';
		});
	})
)
export class Snackbar extends Component {
	@Attribute()
	delay = 4000;
}

@Augment(
	'cxl-snackbar-container',
	css({
		$: {
			position: 'fixed',
			left: 16,
			bottom: 16,
			right: 16,
			textAlign: 'center',
		},
		$left: { textAlign: 'left' },
		$right: { textAlign: 'right' },
	})
)
export class SnackbarContainer extends Component {
	queue: [Snackbar, () => void][] = [];

	private notifyNext() {
		const [next, resolve] = this.queue[0];

		this.shadowRoot?.appendChild(next);

		setTimeout(() => {
			next.remove();
			this.queue.shift();
			resolve();

			if (this.queue.length) this.notifyNext();
		}, next.delay);
	}

	notify(snackbar: Snackbar) {
		return new Promise<void>(resolve => {
			this.queue.push([snackbar, resolve]);
			if (this.queue.length === 1) this.notifyNext();
		});
	}
}

export type PopupPosition =
	| 'right top'
	| 'bottom top'
	| 'right bottom'
	| 'left top'
	| 'left bottom'
	| 'center top'
	| 'center bottom'
	| 'auto';

@Augment<PopupContainer>(
	'cxl-popup-container',
	css({
		$: { animation: 'fadeIn' },
		$out: { animation: 'fadeOut' },
	}),
	Slot,
	$ => on($, 'click').tap(ev => ev.stopPropagation())
)
export class PopupContainer extends Component {}

@Augment<Popup>('cxl-popup', $ => {
	const popup = document.createElement($.container);
	let timeout: any;
	$.style.display = 'none';

	return get($, 'visible')
		.raf()
		.switchMap(visible => {
			const proxy = $.proxy || $;
			if (!$.parentElement) return EMPTY;
			if (visible) {
				for (const child of Array.from(proxy.childNodes))
					popup.appendChild(child);
				popup.removeAttribute('out');
				dialogManager.openPopup({
					element: popup,
					close() {
						$.visible = false;
					},
					relativeTo: $.parentElement,
					position: $.position,
					container: document.body,
				});
				return on(window, 'click').tap(() => ($.visible = false));
			} else if (popup.parentNode) {
				popup.setAttribute('out', '');
				if (timeout) clearTimeout(timeout);
				timeout = setTimeout(() => {
					for (const child of Array.from(popup.childNodes))
						proxy.appendChild(child);
					popup.remove();
				}, 500);
			}
			return EMPTY;
		});
})
export class Popup extends Component {
	@Attribute()
	visible = false;
	@Attribute()
	position: PopupPosition = 'auto';
	@Attribute()
	container = 'cxl-popup-container';

	proxy?: HTMLElement;
}

export function alert(
	optionsOrMessage: string | Partial<DialogAlert>,
	container: Element = document.body
) {
	const options =
		typeof optionsOrMessage === 'string'
			? { message: optionsOrMessage }
			: optionsOrMessage;

	const modal = (<DialogAlert />) as DialogAlert;
	Object.assign(modal, options);

	dialogManager.openModal({ modal, container });
	return modal.promise.then(
		val => (dialogManager.closeModal(modal, container), val)
	);
}

/**
 * Confirmation dialog
 */
export function confirm(
	options: string | Partial<DialogConfirm>,
	container: Element = document.body
) {
	if (typeof options === 'string') options = { message: options };

	const modal = (<DialogConfirm />) as DialogConfirm;
	Object.assign(modal, options);

	dialogManager.openModal({ modal, container });
	return modal.promise.then(
		val => (dialogManager.closeModal(modal, container), val)
	);
}

let snackbarContainer: SnackbarContainer;

export function notify(
	options: string | { delay?: number; content: string | Node },
	bar = snackbarContainer
) {
	if (!bar) {
		bar = snackbarContainer = (<SnackbarContainer />) as SnackbarContainer;
		document.body.appendChild(bar);
	}

	if (typeof options === 'string') options = { content: options };

	const snackbar = (<Snackbar />) as Snackbar;
	if (options.delay) snackbar.delay = options.delay;
	if (options.content) insert(snackbar, options.content);

	return bar.notify(snackbar);
}

export function setSnackbarContainer(bar: SnackbarContainer) {
	snackbarContainer = bar;
}

interface PositionOptions {
	element: HTMLElement;
	relativeTo: Element;
	position: PopupPosition;
	container: HTMLElement;
}

interface OpenPopupOptions extends PositionOptions {
	close(): void;
}

export function positionElement({
	element,
	relativeTo,
	position,
	container,
}: PositionOptions) {
	const rect = relativeTo.getBoundingClientRect();
	const maxWidth = container.offsetWidth;
	const style = element.style;
	style.position = 'absolute';
	if (position === 'auto') {
		const width10 = maxWidth / 10;
		position =
			maxWidth - rect.right < width10
				? 'right bottom'
				: maxWidth < width10
				? 'left bottom'
				: 'center bottom';
	}
	for (const pos of position.split(' ')) {
		if (pos === 'right') {
			style.left = `${rect.right - element.offsetWidth}px`;
			style.transformOrigin = 'right top';
		} else if (pos === 'bottom') style.top = `${rect.bottom}px`;
		else if (pos === 'top') style.top = `${rect.top}px`;
		else if (pos === 'left') {
			style.left = `${rect.left}px`;
			style.transformOrigin = 'left top';
		} else if (pos === 'center') {
			const width = element.offsetWidth;
			let left = rect.left + rect.width / 2 - width / 2;
			if (left + width > maxWidth) left = rect.right - width;
			style.left = `${left}px`;
			style.transformOrigin = 'top';
		}
	}
}

/*export function popup(host: HTMLElement, options: OpenPopupOptions) {
	return (visible: boolean) => {
		const { element } = options;

		if (visible) {
			for (const child of Array.from(host.childNodes))
				element.appendChild(child);
			dialogManager.openPopup(options);
		} else {
			options.element.remove();
		}
	};
}*/

export class DialogManager {
	currentPopup?: OpenPopupOptions;

	openModal({ modal, container }: { modal: Element; container?: Element }) {
		container ||= document.body;

		const opened = (container as any).$$cxlCurrentModal;
		if (opened) this.closeModal(opened, container);
		(container as any).$$cxlCurrentModal = opened;
		container.appendChild(modal);
	}
	closeModal(modal?: Element, container: Element = document.body) {
		modal = modal || (container as any).$$cxlCurrentModal;
		if (modal) requestAnimationFrame(() => modal?.remove());
		(container as any).$$cxlCurrentModal = undefined;
	}
	openPopup(options: OpenPopupOptions) {
		if (this.currentPopup && options !== this.currentPopup)
			this.currentPopup.close();
		options.container.appendChild(options.element);
		positionElement(options);
		this.currentPopup = options;
	}
}

export const dialogManager = new DialogManager();
