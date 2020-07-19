import {
	Attribute,
	StyleAttribute,
	Augment,
	Component,
	Host,
	connect,
	role,
	get,
} from '../component/index.js';
import { Style, padding, pct } from '../css/index.js';
import { dom } from '../xdom/index.js';
import { tpl } from '../template/index.js';
import { on, trigger, remove } from '../dom/index.js';
import { tap, merge } from '../rx/index.js';
import { T, Button } from './core.js';

/**
 * A backdrop appears behind all other surfaces in an app, displaying contextual and actionable content.
 */
@Augment(
	'cxl-backdrop',
	<Host>
		<Style>
			{{
				$: {
					position: 'absolute',
					top: 0,
					left: 0,
					bottom: 0,
					right: 0,
					backgroundColor: 'elevation',
					elevation: 5,
				},
			}}
		</Style>
		<slot></slot>
	</Host>
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
	<Host>
		<Style>
			{{
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
			}}
		</Style>
		<Backdrop>
			<div className="content">
				<slot></slot>
			</div>
		</Backdrop>
	</Host>
)
export class Dialog extends Component {}

const DialogStyles = (
	<Style>
		{{
			content: padding(16),
			footer: padding(8),
		}}
	</Style>
);

/**
 * @demo
 * <cxl-dialog-alert title-text="Alert Dialog" message="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam tincidunt luctus eleifend. Praesent accumsan sit amet justo sit amet cursus. Sed vel venenatis magna, ac fringilla mi. Cras ut augue ex. Sed non massa molestie, elementum odio vitae, maximus massa.">
	</cxl-dialog-alert>
 */
@Augment<DialogAlert>(
	'cxl-dialog-alert',
	role('alertdialog'),
	DialogStyles,
	tpl(({ onAction, get, call }) => (
		<Dialog>
			<div className="content">
				<T h5>{get('title-text')}</T>
				<T>{get('message')}</T>
			</div>
			<div className="footer">
				<Button flat $={onAction(call('resolve'))}>
					{get('action')}
				</Button>
			</div>
		</Dialog>
	))
)
export class DialogAlert extends Component {
	//				'role(alertdialog) =modal:aria.prop(modal) =title-text:aria.prop(label)',

	resolve?: () => void;

	@Attribute()
	'title-text' = '';

	@Attribute()
	message = '';

	@Attribute()
	action = 'Ok';

	readonly promise = new Promise(resolve => {
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
	tpl(({ onAction, get, call }) => (
		<Dialog>
			<div className="content">
				<T h5>{get('title-text')}</T>
				<T>{get('message')}</T>
			</div>
			<div className="footer">
				<Button flat $={onAction(call('reject'))}>
					{get('cancel-text')}
				</Button>
				<Button flat $={onAction(call('resolve'))}>
					{get('action')}
				</Button>
			</div>
		</Dialog>
	))
)
export class DialogConfirm extends Component {
	//				'role(alertdialog) =modal:aria.prop(modal) =title-text:aria.prop(label)',

	resolve?: () => void;
	reject?: () => void;

	@Attribute()
	'cancel-text' = 'Cancel';

	@Attribute()
	'title-text' = '';

	@Attribute()
	message = '';

	@Attribute()
	action = 'Ok';

	readonly promise = new Promise((resolve, reject) => {
		this.resolve = resolve;
		this.reject = reject;
	});
}

/**
 * @demo
 * <cxl-drawer right permanent visible>
	<cxl-c pad16>
		<cxl-t h6>Right Drawer Title</cxl-t>
		<cxl-t>Right Drawer Content</cxl-t>
	</cxl-c>
</cxl-drawer>
*/
@Augment(
	'cxl-drawer',
	<Host>
		<Style>
			{{
				drawer: {
					backgroundColor: 'surface',
					position: 'absolute',
					top: 0,
					left: 0,
					width: '85%',
					bottom: 0,
					opacity: 0,
					color: 'onSurface',
					overflowY: 'auto',
					elevation: 5,
					translateX: '-105%',
					animation: 'fadeOut',
				},
				drawer$right: { left: '100%', width: 0, translateX: 0 },
				drawer$right$visible: { translateX: '-100%', width: 320 },
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
						translateX: '-100%',
						width: 320,
					},
					backdrop$visible$permanent$right: { width: 0 },
				},
			}}
		</Style>
		<Backdrop
			className="backdrop"
			$={(el, host) =>
				on(el, 'click').tap(() => {
					trigger(host, 'backdrop.click');
					host.visible = false;
				})
			}
		/>
		<div
			$={(el, host) =>
				merge(
					on(el, 'drawer.close').pipe(
						tap(() => (host.visible = false))
					),
					on(el, 'click').pipe(tap(ev => ev.stopPropagation())),
					get(host, 'visible').tap(visible => {
						if (!visible && el.scrollTop !== 0) el.scrollTo(0, 0);
					})
				)
			}
			className="drawer"
		>
			<slot />
		</div>
	</Host>
)
export class Drawer extends Component {
	// events: ['backdrop.click'],

	@StyleAttribute()
	visible = false;

	@StyleAttribute()
	right = false;

	@StyleAttribute()
	permanent = false;
}

/**
 * @example
 * <cxl-snackbar>Snackbar Content</cxl-snackbar>
 */
@Augment<Snackbar>(
	'cxl-snackbar',
	<Style>
		{{
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
	@Attribute()
	delay = 4000;
}

@Augment(
	'cxl-snackbar-container',
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
