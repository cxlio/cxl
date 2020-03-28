import {
	StyleAttribute,
	Augment,
	Component,
	bind
} from '../component/index.js';
import { ButtonBase, Spinner } from './core.js';
import { dom, Host } from '../xdom/index.js';
import { onAction, triggerEvent } from '../template/index.js';
import { Style } from '../css/index.js';

@Augment<SubmitButton>(
	<Host>
		<Style>
			{{
				icon: {
					animation: 'spin',
					marginRight: 8,
					display: 'none',
					width: 16,
					height: 16
				},
				icon$disabled: { display: 'inline-block' }
			}}
		</Style>
		<Spinner className="icon" />
		<slot />
	</Host>,
	bind(el => onAction(el).pipe(triggerEvent(el, 'form.submit')))
)
export class SubmitButton extends ButtonBase {
	static tagName = 'cxl-submit';
	primary = true;
}

@Augment(
	<Style>
		{{
			$: {
				display: 'block',
				lineHeight: 12,
				font: 'caption',
				verticalAlign: 'bottom',
				paddingTop: 8
			},
			$invalid: { color: 'error' }
		}}
	</Style>,
	<slot />
)
export class FieldHelp extends Component {
	static tagName = 'cxl-field-help';
	@StyleAttribute()
	invalid = false;
}

@Augment(
	<Style>
		{{
			$: {
				position: 'absolute',
				left: 0,
				right: 0,
				height: 2,
				borderWidth: 0,
				borderBottom: 1,
				borderStyle: 'solid',
				borderColor: 'onSurface'
			},
			$invalid: { borderColor: 'error' },
			line: {
				backgroundColor: 'primary',
				scaleX: 0,
				height: 2
			},
			line$focused: { scaleX: 1 },
			line$invalid: { backgroundColor: 'error' }
		}}
	</Style>,
	<div className="line" />
)
export class FocusLine extends Component {
	static tagName = 'cxl-focus-line';

	@StyleAttribute()
	focused = false;

	@StyleAttribute()
	invalid = false;

	@StyleAttribute()
	touched = false;
}

@Augment(
	<Style>
		{{
			$: {
				position: 'absolute',
				elevation: 0,
				right: -16,
				left: -16,
				overflowY: 'hidden',
				transformOrigin: 'top'
			},
			$inline: {
				position: 'static',
				marginLeft: -16,
				marginRight: -16
			},
			$visible: {
				elevation: 3,
				overflowY: 'auto',
				backgroundColor: 'surface'
			}
		}}
	</Style>,
	<slot />
)
export class SelectMenu extends Component {
	static tagName = 'cxl-select-menu';

	@StyleAttribute()
	visible = false;

	@StyleAttribute()
	inline = false;
}
