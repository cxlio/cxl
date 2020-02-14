import {
	Attribute,
	Component,
	Augment,
	Slot,
	Div,
	bind,
	dom,
	register,
	template,
	StyleAttribute
} from '../xdom/index.js';
import {
	onAction,
	triggerEvent,
	getAttribute,
	portal
} from '../template/index.js';
import { on, getShadow } from '../dom/index.js';
import { tap, merge, debounceTime } from '../rx/index.js';
import { css } from '../css/index.js';

declare const cxl: any;

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

export function ripple(element: any) {
	return onAction(element).pipe(
		debounceTime(),
		tap(ev => {
			ev.preventDefault();
			if (!element.disabled) cxl.ui.ripple(element, ev);
		})
	);
}

export function focusableEvents(element: any) {
	function update() {
		element.focused = !element.disabled;
	}

	return merge(
		on(element, 'focus').pipe(
			tap(update),
			triggerEvent(element, 'focusable.focus')
		),
		on(element, 'blur').pipe(triggerEvent(element, 'focusable.blur'))
	);
}

interface Focusable extends Component {
	disabled: boolean;
}

export function focusable<T extends Focusable>(element: T) {
	return merge(
		getAttribute(element, 'disabled').pipe(
			tap(value => {
				element.setAttribute('aria-disabled', value ? 'true' : 'false');
				if (value) element.removeAttribute('tabindex');
				else element.tabIndex = 0;
			})
		),
		focusableEvents(element)
	);
}

@Augment<Appbar>(
	register('cxl-appbar'),
	css({
		$: {
			display: 'block',
			backgroundColor: 'primary',
			flexShrink: 0,
			fontSize: 18,
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
		'@medium': {
			flex$extended: { paddingLeft: 64, paddingRight: 64 }
		},
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
	}),
	<div className="flex">
		<slot></slot>
		<Div $={portal('cxl-appbar-actions')} />
	</div>,
	<div className="tabs">
		<Slot selector="cxl-tabs"></Slot>
		<Div $={portal('cxl-appbar-tabs')} />
	</div>
)
export class Appbar extends Component {
	@Attribute()
	extended = false;

	@Attribute()
	role = 'heading';

	@Attribute()
	center = false;
}

@Augment(
	register('cxl-card'),
	css({
		$: {
			backgroundColor: 'surface',
			borderRadius: 2,
			color: 'onSurface',
			display: 'block',
			elevation: 1
		}
	}),
	<slot></slot>
)
export class Card extends Component {}

@Augment(
	register('cxl-backdrop'),
	css({
		$: {
			position: 'absolute',
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			backgroundColor: 'elevation',
			elevation: 5
		}
	}),
	<slot></slot>
)
export class Backdrop extends Component {}

@Augment(
	register('cxl-content'),
	css({
		$: {
			padding: 16,
			position: 'relative',
			flexGrow: 1,
			overflowY: 'auto',
			overflowScrolling: 'touch'
		},
		'@medium': {
			$: { padding: 32 }
		},
		'@large': {
			$: { padding: 64 }
		},
		'@xlarge': {
			content: { width: 1200 },
			content$center: {
				padding: 0,
				marginLeft: 'auto',
				marginRight: 'auto'
			}
		}
	}),
	<slot></slot>
)
export class Content extends Component {
	@Attribute()
	center = false;
}

@Augment(
	register('cxl-badge'),
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
			backgroundColor: 'primary'
		},
		$secondary: { color: 'onSecondary', backgroundColor: 'secondary' },
		$error: { color: 'onError', backgroundColor: 'error' },
		$top: { translateY: -11 },
		$over: { marginLeft: -8 }
	}),
	<slot></slot>
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
	register('cxl-button'),
	bind(ripple),
	bind(focusable),
	css({
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
		},
		...StateStyles
	}),
	<slot></slot>
)
export class Button extends Component {
	role = 'button';
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

@Augment(
	register('cxl-icon'),
	css({
		$: {
			display: 'inline-block',
			fontFamily: 'Font Awesome\\ 5 Free',
			fontSize: 'inherit'
		},
		$round: {
			borderRadius: 1,
			textAlign: 'center'
		},
		$outline: { borderWidth: 1, borderStyle: 'solid' }
	})
)
export class Icon extends Component {
	protected $icon = '';
	protected iconNode?: Text;

	role = 'img';

	@Attribute()
	get icon() {
		return this.$icon;
	}

	set icon(iconName: string) {
		this.$icon = iconName;
		const icon = iconName && cxl.ui.icons[iconName];

		if (icon) {
			if (this.iconNode) {
				this.iconNode.data = icon;
			} else {
				this.iconNode = document.createTextNode(icon);
				getShadow(this).appendChild(this.iconNode);
			}

			if (!this.hasAttribute('aria-label'))
				this.setAttribute('aria-label', this.icon);
		}
	}
}

@Augment<SubmitButton>(
	register('cxl-submit'),
	css({
		icon: { animation: 'spin', marginRight: 8, display: 'none' },
		icon$disabled: { display: 'inline-block' }
	}),
	template(el => (
		<div>
			<Icon className="icon" icon={getAttribute(el, 'icon')}></Icon>
			<slot></slot>
		</div>
	)),
	bind(el => onAction(el).pipe(triggerEvent(el, 'form.submit')))
)
export class SubmitButton extends Button {
	icon = 'spinner';
	primary = true;
}

@Augment(
	css({
		$: {
			paddingRight: 8,
			lineHeight: 22,
			width: 24,
			textAlign: 'center'
		},
		$trailing: { paddingRight: 0, paddingLeft: 8 }
	})
)
export class FieldIcon extends Icon {}
