///<amd-module name="@cxl/ui/layout.js"/>
import {
	Attribute,
	Augment,
	Component,
	Slot,
	StyleAttribute,
	update,
} from '@cxl/component';
import { css, margin, padding } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { InversePrimary, InverseSecondary } from './theme.js';
import { ColorAttribute, ColorValue, persistWithParameter } from './core.js';

const colStyles = ((r: any) => {
	for (let i = 12; i > 0; i--)
		r.xl['$xl' + i] = r.lg['$lg' + i] = r.md['$md' + i] = r.sm[
			'$sm' + i
		] = r.xs['$xs' + i] = {
			display: 'block',
			gridColumnEnd: 'span ' + i,
		};
	return r;
})({
	xl: {},
	lg: {},
	md: {},
	sm: {},
	xs: {},
});

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
		$pad32: { ...padding(32) },
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
			...InverseSecondary,
			color: 'onSurface',
			backgroundColor: 'surface',
		},
		$flex: { display: 'flex' },
		$vflex: { display: 'flex', flexDirection: 'column' },
		$middle: { justifyContent: 'center' },
		$center: { textAlign: 'center' },
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

	@Attribute({
		persistOperator: persistWithParameter('pad'),
	})
	pad?: 8 | 16 | 24 | 32;

	@ColorAttribute()
	color?: ColorValue;

	/** @deprecated */
	@StyleAttribute()
	primary = false;

	/** @deprecated */
	@StyleAttribute()
	secondary = false;

	@StyleAttribute()
	center = false;

	@StyleAttribute()
	middle = false;
}

/**
 * @beta
 */
@Augment<Layout>(
	'cxl-layout',
	css({
		$: {
			display: 'block',
			/* Use padding instead of margin so there's no unnecessary scrolling
			 caused by box-shadow */
			paddingLeft: 16,
			paddingRight: 16,
		},
		'@medium': {
			$: { paddingLeft: 32, paddingRight: 32 },
		},
		'@large': {
			$: { paddingLeft: 64, paddingRight: 64 },
		},
		'@xlarge': {
			$: { width: 1200 },
			$center: {
				paddingLeft: 0,
				paddingRight: 0,
				marginLeft: 'auto',
				marginRight: 'auto',
			},
		},
		$full: { width: 'auto' },
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
			position: 'relative',
			flexGrow: 1,
			overflowY: 'auto',
			overflowScrolling: 'touch',
			willChange: 'transform',
			paddingTop: 24,
			paddingBottom: 24,
			color: 'onBackground',
			backgroundColor: 'background',
		},
		'@large': {
			$: { paddingTop: 32, paddingBottom: 32 },
		},
		'@xlarge': {
			$: { paddingTop: 64, paddingBottom: 64 },
		},
	})
)
export class Content extends Layout {}

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
			height: '100%',
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

/**
 * The Material Design responsive layout grid is an overarching guide to the placement of components and elements.
 * The responsive layout grid adapts to screen sizes and orientation, ensuring consistency across layouts.
 * @example
 * <cxl-grid coltemplate="auto auto auto" style="color:#fff">
 *   <cxl-c xs1 style="background:#a00; padding: 2px">1</cxl-c>
 *   <cxl-c xs1 style="background:#0a0; padding:2px">2</cxl-c>
 *   <cxl-c xs1 style="background:#0a0; padding:2px">3</cxl-c>
 *   <cxl-c xs2 style="background:#00a; padding:2px">4</cxl-c>
 *   <cxl-c xs1 style="background:#00a; padding:2px">5</cxl-c>
 * </cxl-grid>
 */
@Augment<Grid>(
	'cxl-grid',
	css({
		$: { display: 'grid', columnGap: 0, rowGap: 16 },
		'@small': { $: { columnGap: 16 } },
	}),
	Slot,
	update(host => {
		const colTemplate =
			host.coltemplate ?? `repeat(${host.columns}, minmax(0,1fr))`;
		host.style.gridTemplateRows = (host.rows ?? 'auto').toString();
		host.style.gridTemplateColumns = colTemplate;
	})
)
export class Grid extends Component {
	@Attribute()
	rows?: number;

	@Attribute()
	columns = 12;

	@Attribute()
	coltemplate?: string;
}
