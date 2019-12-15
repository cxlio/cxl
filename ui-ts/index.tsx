import {
	Attribute,
	Component,
	ComponentView,
	Template,
	Bind,
	Styles,
	decorateComponent
} from '../component';
import {
	getAttribute,
	onAction,
	content,
	anchor,
	appendChild,
	setAttribute,
	triggerEvent,
	dom
} from '../template';
import { on } from '../dom';
import { tap, of, merge, debounceTime } from '../rx';

import '../ui/dist/index';

declare const cxl: any;

export function ripple({ element }: any) {
	return onAction(element).pipe(
		debounceTime(),
		tap(ev => {
			ev.preventDefault();
			// cxl.ui.ripple(element, ev);
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

export function focusable({ element }: ComponentView<any>) {
	return merge(
		getAttribute('disabled', element),
		focusableEvents(element)
		// .pipe(setAttribute('aria-disabled'))
	);
}

export function Role(ariaRole: string) {
	return decorateComponent(view => {
		view.addBinding(of(ariaRole).pipe(setAttribute('role', view.element)));
	});
}

@Template(({ children }) => (
	<div>
		<div className="flex">
			<slot></slot>
			<div
				$={el => anchor('cxl-appbar-actions').pipe(appendChild(el))}
			></div>
		</div>
		<div className="tabs">
			<slot $={el => children.pipe(content('cxl-tabs', el))}></slot>
			<div
				$={el => anchor('cxl-appbar-tabs').pipe(appendChild(el))}
			></div>
		</div>
	</div>
))
@Styles({
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
	$fixed: { position: 'fixed', top: 0, right: 0, left: 0 }
})
@Styles('medium', {
	flex$extended: { paddingLeft: 64, paddingRight: 64 }
})
@Styles('xlarge', {
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
})
@Role('heading')
@Component('cxl-appbar')
export class Appbar {
	@Attribute()
	extended = false;
	@Attribute()
	center = false;
}

@Styles({
	$: {
		backgroundColor: 'surface',
		borderRadius: 2,
		color: 'onSurface',
		display: 'block',
		elevation: 1
	}
})
@Component('cxl-card')
export class Card {}

@Component('cxl-badge')
@Styles({
	$: {
		display: 'inline-block',
		position: 'relative',
		width: 22,
		height: 22,
		lineHeight: 22,
		font: 'caption',
		borderRadius: '50%',
		color: 'onPrimary',
		backgroundColor: 'primary'
	},
	$secondary: { color: 'onSecondary', backgroundColor: 'secondary' },
	$error: { color: 'onError', backgroundColor: 'error' },
	$top: { translateY: -11 },
	$over: { marginLeft: -8 }
})
export class Badge {
	@Attribute()
	secondary = false;

	@Attribute()
	error = false;

	@Attribute()
	over = false;

	@Attribute()
	top = false;
}

@Component('cxl-button')
@Styles(
	{
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
			fontWeight: 500,
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
		$round: { borderRadius: '50%' },

		$active: { elevation: 3 },
		$active$disabled: { elevation: 1 },
		$active$flat$disabled: { elevation: 0 }
	}
	// FocusCSS,
	// DisabledCSS
)
@Styles('large', {
	$flat: { paddingLeft: 12, paddingRight: 12 }
})
@Bind(ripple)
@Bind(focusable)
@Role('button')
export class Button {
	@Attribute()
	disabled = false;
	@Attribute()
	primary = false;
	@Attribute()
	flat = false;
	@Attribute()
	secondary = false;
	@Attribute()
	touched = false;
	@Attribute()
	big = false;
	@Attribute()
	outline = false;
}

@Component('cxl-submit')
@Template<SubmitButton>(({ select }) => {
	const b = (el: Element) => [
		select('disabled').pipe(show(el)),
		select('icon').pipe(setAttribute(el, 'icon'))
	];

	return (
		<div>
			<div className="icon" $={b}></div>
			<slot></slot>
		</div>
	);
})
@Bind(({ element }) => [
	onAction(element).pipe(triggerEvent(element, 'form.submit'))
])
@Styles({
	icon: { animation: 'spin', marginRight: 8 }
})
export class SubmitButton extends Button {
	icon = 'spinner';
	primary = true;
}

//			events: ['cxl-form.submit'],
/*			bindings: 'action:host.trigger(cxl-form.submit)'
		},
		{
			primary: true,
			icon: 'spinner',
			submit() {
				this.input.click();
			}
		}
	);*/
