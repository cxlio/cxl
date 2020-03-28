import { Attribute, Augment, Component, role } from '../component/index.js';
import { Style, pct } from '../css/index.js';
import { dom, Host } from '../xdom/index.js';
import { tpl } from '../template/index.js';
import { T, Button } from './core.js';

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
