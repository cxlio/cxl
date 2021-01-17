import {
	Attribute,
	AttributeEvent,
	Augment,
	Component,
	Slot,
	StyleAttribute,
	update,
	role,
} from '@cxl/component';
import { css, margin, padding, pct } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { operator } from '@cxl/rx';
import { InversePrimary } from './theme.js';

const colStyles = ((r: any) => {
	for (let i = 12; i > 0; i--)
		r.xl['$xl' + i] = r.lg['$lg' + i] = r.md['$md' + i] = r.sm[
			'$sm' + i
		] = r.xs['$xs' + i] = {
			display: 'block',
			gridColumnEnd: 'span ' + i,
			flexBasis: pct((100 / 12) * i),
		};
	return r;
})({
	xl: {},
	lg: {},
	md: {},
	sm: {},
	xs: {},
});

function persistWithParameter(prefix: string) {
	return operator<AttributeEvent<any>>(() => {
		let lastAttr: string;
		return ({ value, target }) => {
			if (value === undefined) {
				if (target.hasAttribute(lastAttr))
					target.removeAttribute(lastAttr);
			} else {
				const attr = `${prefix}${value}`;

				if (lastAttr !== attr) {
					target.removeAttribute(lastAttr);
					target.setAttribute(attr, '');
					lastAttr = attr;
				}
			}
		};
	});
}

@Augment(
	'cxl-c',
	css({
		$: {
			display: 'block',
			gridColumnEnd: 'span 12',
			flexShrink: 1,
		},
		$grow: { flexGrow: 1, flexShrink: 1 },
		$fill: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		},
		...colStyles.xs,
		$xs0: { display: 'none' },
		'@small': {
			$: { gridColumnEnd: 'auto', flexShrink: 0 },
			$small: { display: 'block' },
			...colStyles.sm,
			$sm0: { display: 'none' },
		},
		'@medium': {
			...colStyles.md,
			$md0: { display: 'none' },
			$medium: { display: 'block' },
		},
		'@large': {
			...colStyles.lg,
			$lg0: { display: 'none' },
			$large: { display: 'block' },
		},
		'@xlarge': {
			...colStyles.xl,
			$xl0: { display: 'none' },
			$xlarge: { display: 'block' },
		},

		// Padding
		$pad16: { ...padding(16) },
		$pad8: { ...padding(8) },
		$pad24: { ...padding(24) },
		// Colors
		$surface: { backgroundColor: 'surface', color: 'onSurface' },
		$error: { backgroundColor: 'error', color: 'onError' },
		$primary: {
			...InversePrimary,
			color: 'onSurface',
			backgroundColor: 'surface',
		},
		$primaryLight: {
			backgroundColor: 'primaryLight',
			color: 'onPrimaryLight',
		},
		$secondary: {
			backgroundColor: 'secondary',
			color: 'onSecondary',
		},
		$flex: { display: 'flex' },
		$vflex: { display: 'flex', flexDirection: 'column' },
	}),
	Slot
)
export class C extends Component {
	@StyleAttribute()
	flex = false;

	/**
	 * Apply vertical flex style
	 */
	@StyleAttribute()
	vflex = false;

	@StyleAttribute()
	grow = false;

	@StyleAttribute()
	pad16 = false;

	@Attribute({
		persistOperator: persistWithParameter('xs'),
	})
	xs?: number;
	@Attribute({
		persistOperator: persistWithParameter('sm'),
	})
	sm?: number;
	@Attribute({
		persistOperator: persistWithParameter('md'),
	})
	md?: number;
	@Attribute({
		persistOperator: persistWithParameter('lg'),
	})
	lg?: number;
	@Attribute({
		persistOperator: persistWithParameter('xl'),
	})
	xl?: number;

	@StyleAttribute()
	primary = false;

	@StyleAttribute()
	secondary = false;
}

/**
 * @beta
 */
@Augment<Layout>(
	'cxl-layout',
	css({
		$: {
			display: 'block',
			...margin(0, 16, 0, 16),
		},
		'@medium': {
			$: margin(0, 32, 0, 32),
		},
		'@large': {
			$: margin(0, 64, 0, 64),
		},
		'@xlarge': {
			$: { width: 1200 },
			$center: margin(0, 'auto', 0, 'auto'),
		},
		container$full: { width: 'auto' },
	}),
	_ => <slot />
)
export class Layout extends Component {
	@StyleAttribute()
	center = false;

	@StyleAttribute()
	full = false;
}

@Augment(
	'cxl-content',
	css({
		$: {
			display: 'block',
			position: 'relative',
			flexGrow: 1,
			overflowY: 'auto',
			overflowScrolling: 'touch',
			willChange: 'transform',
		},
		container: {
			...margin(32, 16, 32, 16),
			//overflowX: 'hidden',
		},
		'@medium': {
			container: margin(24, 32, 24, 32),
		},
		'@large': {
			container: margin(32, 64, 32, 64),
		},
		'@xlarge': {
			container: { width: 1200 },
			container$center: margin(64, 'auto', 64, 'auto'),
		},
		container$full: { width: 'auto' },
	}),
	_ => (
		<>
			<slot name="header" />
			<div className="container">
				<slot />
			</div>
			<slot name="footer" />
		</>
	)
)
export class Content extends Component {
	@StyleAttribute()
	center = false;

	@StyleAttribute()
	full = false;
}

@Augment(
	'cxl-page',
	css({
		$: {
			display: 'block',
			position: 'relative',
			flexGrow: 1,
			overflowY: 'auto',
			overflowScrolling: 'touch',
			backgroundColor: 'surface',
			color: 'onSurface',
		},
		container: { ...margin(16) },
		'@medium': { container: margin(32) },
		'@large': { container: margin(32, 64, 32, 64) },
		'@xlarge': {
			container: {
				width: 1200,
				marginLeft: 'auto',
				marginRight: 'auto',
			},
		},
	}),
	_ => (
		<div className="container">
			<slot />
		</div>
	)
)
export class Page extends Component {}

/**
 * Cards contain content and actions about a single subject.
 * @example
 * <cxl-card>
 *   <cxl-c flex pad16>
 *     <cxl-avatar style="background:#ccc"></cxl-avatar>
 *     <cxl-c style="margin-left: 24px">
 *       <cxl-t subtitle>Card Title</cxl-t>
 *       <cxl-t subtitle2>Secondary Text</cxl-t>
 *     </cxl-c>
 *   </cxl-c>
 *   <cxl-c pad16>
 *     Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
 *   </cxl-c>
 * </cxl-card>
 */
@Augment(
	'cxl-card',
	css({
		$: {
			backgroundColor: 'surface',
			borderRadius: 2,
			color: 'onSurface',
			display: 'block',
			elevation: 1,
		},
		elevation2: { elevation: 2 },
		elevation3: { elevation: 3 },
		elevation4: { elevation: 4 },
		elevation5: { elevation: 5 },
	}),
	Slot
)
export class Card extends C {
	@Attribute({
		persistOperator: persistWithParameter('elevation'),
	})
	elevation: 1 | 2 | 3 | 4 | 5 = 1;
}

@Augment<List>(
	'cxl-list',
	role('list'),
	css({
		$: {
			display: 'block',
			paddingTop: 8,
			paddingBottom: 8,
			marginLeft: -16,
			marginRight: -16,
		},
	}),
	Slot
)
export class List extends Component {}

/**
 * @example
 * <cxl-grid columns="auto auto auto" style="color:#fff">
 *   <cxl-c style="background:#a00; padding: 24px">1</cxl-c>
 *   <cxl-c style="background:#0a0; padding:24px">2</cxl-c>
 *   <cxl-c style="background:#0a0; padding:24px">3</cxl-c>
 *   <cxl-c xs2 style="background:#00a; padding:24px">4</cxl-c>
 *   <cxl-c style="background:#00a; padding:24px">5</cxl-c>
 * </cxl-grid>
 */
@Augment<Grid>(
	'cxl-grid',
	css({
		$: { display: 'grid' },
	}),
	Slot,
	update(host => {
		host.style.gridTemplateRows = (host.rows || 'auto').toString();
		host.style.gridGap = `${host.gap}px ${host.gap}px`;
		host.style.gridTemplateColumns = host.columns;
	})
)
export class Grid extends Component {
	@Attribute()
	rows?: number;

	@Attribute()
	columns = 'repeat(12, minmax(0,1fr))';

	@Attribute()
	gap = 16;
}
