import {
	Attribute,
	StyleAttribute,
	Augment,
	Component,
	role,
	render,
	get
} from '../component/index.js';
import { Style, pct } from '../css/index.js';
import { dom, Host } from '../xdom/index.js';
import { tpl, onAction } from '../template/index.js';
import { on, trigger } from '../dom/index.js';
import { tap } from '../rx/index.js';
import { T, Button, Svg } from './core.js';

@Augment(
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
					elevation: 5
				}
			}}
		</Style>
		<slot></slot>
	</Host>
)
export class Backdrop extends Component {
	static tagName = 'cxl-backdrop';
}

@Augment(
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
					color: 'onSurface'
				},
				'@small': {
					content: {
						elevation: 12,
						translateY: pct(-50),
						top: pct(50),
						bottom: 'auto',
						width: pct(80),
						marginLeft: 'auto',
						marginRight: 'auto'
					}
				}
			}}
		</Style>
		<Backdrop>
			<div className="content">
				<slot></slot>
			</div>
		</Backdrop>
	</Host>
)
export class Dialog extends Component {
	static tagName = 'cxl-dialog';
}

const DialogStyles = (
	<Style>
		{{
			content: { padding: 16 },
			footer: { padding: 8 }
		}}
	</Style>
);

@Augment<DialogAlert>(
	role('alertdialog'),
	DialogStyles,
	tpl(({ onAction, get }) => (
		<Dialog>
			<div className="content">
				<T h5>{get('title-text')}</T>
				{get('message')}
			</div>
			<div className="footer">
				<Button flat $={onAction('resolve')}>
					{get('action')}
				</Button>
			</div>
		</Dialog>
	))
)
export class DialogAlert extends Component {
	//				'role(alertdialog) =modal:aria.prop(modal) =title-text:aria.prop(label)',
	static tagName = 'cxl-dialog-alert';

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

@Augment<DialogConfirm>(
	role('alertdialog'),
	DialogStyles,
	tpl(({ onAction, get }) => (
		<Dialog>
			<div className="content">
				<T h5>{get('title-text')}</T>
				{get('message')}
			</div>
			<div className="footer">
				<Button flat $={onAction('reject')}>
					{get('cancel-text')}
				</Button>
				<Button flat $={onAction('resolve')}>
					{get('action')}
				</Button>
			</div>
		</Dialog>
	))
)
export class DialogConfirm extends Component {
	//				'role(alertdialog) =modal:aria.prop(modal) =title-text:aria.prop(label)',
	static tagName = 'cxl-dialog-confirm';

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

@Augment(
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
					translateX: '-105%'
				},
				drawer$right: { left: '100%', width: 0, translateX: 0 },
				drawer$right$visible: { translateX: '-100%', width: 320 },
				drawer$visible: { translateX: 0, opacity: 1 },

				backdrop: {
					width: 0,
					opacity: 0
				},
				backdrop$visible: { width: '100%', opacity: 1 },

				'@small': {
					drawer: { width: 288 }
				},
				'@large': {
					drawer$permanent: { translateX: 0, opacity: 1 },
					backdrop$visible$permanent: { width: 0 },
					backdrop$visible$right: { width: '100%' }
				},
				'@xlarge': {
					drawer$right$permanent: {
						translateX: '-100%',
						width: 320
					},
					backdrop$visible$permanent$right: { width: 0 }
				}
			}}
		</Style>
		<Backdrop
			className="backdrop"
			$={(el, view) =>
				on(el, 'click').pipe(
					tap(() => {
						trigger(view.host, 'backdrop.click');
						view.host.visible = false;
					})
				)
			}
		/>
		<div
			$={el => on(el, 'click').pipe(tap(ev => ev.stopPropagation()))}
			className="drawer"
		>
			<slot />
		</div>
	</Host>
)
export class Drawer extends Component {
	// events: ['backdrop.click'],
	static tagName = 'cxl-drawer';

	@StyleAttribute()
	visible = false;

	@StyleAttribute()
	right = false;

	@StyleAttribute()
	permanent = false;
}

/*	component(
		{
			permanent: false,
			visible: false,
			toggle() {
				this.visible = !this.visible;
			},

			onRoute() {
				this.visible = false;
			}
		}
		alt="Open Navigation Bar"
		role="list" 	
	);*/
//" =permanent:@permanent =visible:@visible content location:#onRoute"></Drawer>

const MenuIcon = (
	<Svg viewBox="0 0 24 24">{`<path style="fill:currentColor" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />`}</Svg>
);

@Augment<Navbar>(
	role('navigation'),
	<Style>
		{{
			$: {
				display: 'inline-block',
				marginTop: 8,
				marginBottom: 8,
				overflowScrolling: 'touch'
			},
			toggler: {
				width: 16,
				marginRight: 32,
				cursor: 'pointer'
			},
			toggler$permanent$large: { display: 'none' }
		}}
	</Style>,
	render(host => (
		<Host>
			<Drawer
				permanent={get(host, 'permanent')}
				visible={get(host, 'visible')}
			>
				<slot />
			</Drawer>
			<div
				$={el =>
					onAction(el).pipe(tap(() => (host.visible = !host.visible)))
				}
				className="toggler"
			>
				{MenuIcon}
			</div>
		</Host>
	))
)
export class Navbar extends Component {
	static tagName = 'cxl-navbar';

	@StyleAttribute()
	permanent = false;

	@Attribute()
	visible = false;
}
