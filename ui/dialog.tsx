///<amd-module name="@cxl/ui/dialog.js"/>
import {
	Attribute,
	StyleAttribute,
	Augment,
	Component,
	attributeChanged,
	connect,
	get,
} from '@cxl/component';
import { css, padding, pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { insert, on, onAction, trigger } from '@cxl/dom';
import { merge } from '@cxl/rx';
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
	}),
	() => <slot />
)
export class Backdrop extends Component {}

/**
 * Dialogs inform users about a task and can contain critical information, require decisions, or involve multiple tasks.
 * @demo
 * <cxl-dialog>
		<cxl-c pad16>
		<cxl-t h5>Title</cxl-t>
		<cxl-t>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi.</cxl-t>
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
	)
)
export class Dialog extends Component {}

const DialogStyles = css({
	content: padding(16),
	footer: padding(8),
});

/**
 * @demo
 * <cxl-dialog-alert title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
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
				<Button flat $={el => onAction(el).tap(() => $.resolve())}>
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
 * <cxl-dialog-confirm title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
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
				<Button flat $={el => onAction(el).tap(() => $.resolve(false))}>
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
		'drawer::-webkit-scrollbar': {
			width: 8,
		},
		'drawer::-webkit-scrollbar-track': {
			backgroundColor: 'transparent',
		},
		'drawer::-webkit-scrollbar-thumb': {
			backgroundColor: 'divider',
		},
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

		this.appendChild(next);

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

interface AlertOptions {
	titleText?: string;
	message: string;
	actionText?: string;
}

export function alert(
	optionsOrMessage: string | AlertOptions,
	container: Element = document.body
) {
	const options: AlertOptions =
		typeof optionsOrMessage === 'string'
			? { message: optionsOrMessage }
			: optionsOrMessage;

	const modal = (
		<DialogAlert
			title-text={options.titleText || ''}
			message={options.message}
			action={options.actionText || DialogAlert.prototype.action}
		/>
	) as DialogAlert;

	container.appendChild(modal);

	return modal.promise.then(() => modal.remove());
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
	container.appendChild(modal);

	return modal.promise.then(val => (modal.remove(), val));
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
