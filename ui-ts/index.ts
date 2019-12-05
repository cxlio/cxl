import {
	Attribute,
	Component,
	Bind,
	Styles,
	createComponent,
	decorateComponent
} from '../component';
import { getAttribute, onAction } from '../template';
import { tap, debounceTime } from '../rx';

import '../ui/dist/index';

@Component({})
@Bind<RippleBehavior>(({ element, state }) => [
	getAttribute('disabled', element),
	onAction(element).pipe(
		debounceTime(),
		tap(ev => state.onAction(ev))
	)
])
class RippleBehavior {
	onAction(ev: Event) {
		ev.preventDefault();
	}
}

export function Ripple() {
	return decorateComponent(view => {
		view.addBinding(createComponent(RippleBehavior, view.element));
	});
}

export function Role(ariaRole: string) {
	return decorateComponent(view => {
		if (!view.element.hasAttribute('role'))
			view.element.setAttribute('role', ariaRole);
	});
}

/*@Component('cxl-appbar-title')
@Styles({
	$: { flexGrow: 1, font: 'title' },
	$extended: { font: 'h5', alignSelf: 'flex-end' }
})
export class AppbarTitle {
	@Attribute()
	extended = false;
}*/

@Component('cxl-card')
@Styles({
	$: {
		backgroundColor: 'surface',
		borderRadius: 2,
		color: 'onSurface',
		display: 'block',
		elevation: 1
	}
})
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
	$secondary: {
		color: 'onSecondary',
		backgroundColor: 'secondary'
	},
	$error: {
		color: 'onError',
		backgroundColor: 'error'
	},
	$top: {
		translateY: -11
	},
	$over: {
		marginLeft: -8
	}
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
