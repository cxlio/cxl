import {
	Attribute,
	Component,
	Template,
	Bind,
	Styles,
	createComponent,
	decorateComponent
} from '../component';
import {
	getAttribute,
	onAction,
	content,
	anchor,
	appendChild,
	setAttribute,
	dom
} from '../template';
import { tap, of, debounceTime } from '../rx';

import '../ui/dist/index';

@Bind<RippleBehavior>(({ element, state }) => [
	getAttribute('disabled', element),
	onAction(element).pipe(
		debounceTime(),
		tap(ev => state.onAction(ev))
	)
])
@Component({})
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
		view.addBinding(of(ariaRole).pipe(setAttribute('role', view.element)));
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
@Component('cxl-badge')
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
