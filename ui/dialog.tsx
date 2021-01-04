import {
	Attribute,
	StyleAttribute,
	Augment,
	Component,
	connect,
	role,
	get,
} from '@cxl/component';
import { css, padding, pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import {
	createElement,
	insert,
	on,
	onAction,
	trigger,
	remove,
} from '@cxl/dom';
import { merge } from '@cxl/rx';
import { T, Button, Span } from './core.js';

/**
 * A backdrop appears behind all other surfaces in an app, displaying contextual and actionable content.
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
			backgroundColor: 'elevation',
			elevation: 5,
		},
	}),
	() => <slot></slot>
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
				elevation: 12,
				translateY: pct(-50),
				top: pct(50),
				bottom: 'auto',
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
				<Button flat $={onAction($).tap(() => $.resolve())}>
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
				<Button flat $={onAction($).tap(() => $.reject())}>
					{get($, 'cancel-text')}
				</Button>
				<Button flat $={onAction($).tap(() => $.resolve())}>
					{get($, 'action')}
				</Button>
			</div>
		</Dialog>
	)
)
export class DialogConfirm extends Component {
	resolve!: () => void;
	reject!: () => void;

	@Attribute()
	'cancel-text' = 'Cancel';

	@Attribute()
	'title-text' = '';

	@Attribute()
	message = '';

	@Attribute()
	action = 'Ok';

	readonly promise = new Promise<void>((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
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
						get(host, 'visible')
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

export function alert(options: string | Partial<DialogAlert>) {
	if (typeof options === 'string') options = { message: options };

	const modal = createElement(DialogAlert, options);

	document.body.appendChild(modal);

	return modal.promise.then(() => remove(modal));
}

/**
 * Confirmation dialog
 */
export function confirm(options: string | Partial<DialogConfirm>) {
	if (typeof options === 'string') options = { message: options };

	const modal = createElement(DialogConfirm, options);

	document.body.appendChild(modal);

	return modal.promise;
}

let snackbarContainer: SnackbarContainer;

export function notify(
	options: string | (Partial<Snackbar> & { content: string })
) {
	let bar = snackbarContainer;

	if (!bar) {
		bar = snackbarContainer = createElement(SnackbarContainer);
		document.body.appendChild(bar);
	}

	if (typeof options === 'string') options = { content: options };

	const snackbar = createElement(Snackbar, options);

	if (options.content) insert(snackbar, options.content);

	bar.notify(snackbar);
}
