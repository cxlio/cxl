import {
	Augment,
	Component,
	Attribute,
	StyleAttribute,
	update,
	role,
} from '../component/index.js';
import { Style, margin, padding } from '../css/index.js';
import { dom, Host } from '../xdom/index.js';

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
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					gridColumnEnd: 'span 12',
					flexShrink: 0,
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
					$: { gridColumnEnd: 'auto' },
					...colStyles.sm,
					$sm0: { display: 'none' },
				},
				'@medium': { ...colStyles.md, $md0: { display: 'none' } },
				'@large': { ...colStyles.lg, $lg0: { display: 'none' } },
				'@xlarge': { ...colStyles.xl, $xl0: { display: 'none' } },

				// Padding
				$pad16: { ...padding(16) },
				$pad8: { ...padding(8) },
				$pad24: { ...padding(24) },
				// Colors
				$surface: { backgroundColor: 'surface', color: 'onSurface' },
				$error: { backgroundColor: 'error', color: 'onError' },
				$primary: { backgroundColor: 'primary', color: 'onPrimary' },
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
			}}
		</Style>
		<slot />
	</Host>
)
export class C extends Component {
	@StyleAttribute()
	pad16 = false;
}

@Augment(
	'cxl-content',
	<Host>
		<Style>
			{{
				$: {
					...padding(16),
					position: 'relative',
					flexGrow: 1,
					overflowY: 'auto',
					overflowScrolling: 'touch',
				},
				'@medium': {
					$: padding(32),
				},
				'@large': {
					$: padding(64),
				},
				'@xlarge': {
					content: { width: 1200 },
					content$center: {
						...padding(0),
						marginLeft: 'auto',
						marginRight: 'auto',
					},
				},
			}}
		</Style>
		<slot />
	</Host>
)
export class Content extends Component {
	@StyleAttribute()
	center = false;
}

@Augment(
	'cxl-page',
	<Host>
		<Style>
			{{
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
			}}
		</Style>
		<div className="container">
			<slot />
		</div>
	</Host>
)
export class Page extends Component {}

/**
 * @example
<cxl-card>
<cxl-c flex pad16>
	<cxl-avatar style="background:#ccc"></cxl-avatar>
	<cxl-c style="margin-left: 24px">
		<cxl-t subtitle>Card Title</cxl-t>
		<cxl-t subtitle2>Secondary Text</cxl-t>
	</cxl-c>
</cxl-c>
<cxl-c pad16>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
</cxl-c>
</cxl-card>
 */
@Augment(
	'cxl-card',
	<Host>
		<Style>
			{{
				$: {
					backgroundColor: 'surface',
					borderRadius: 2,
					color: 'onSurface',
					display: 'block',
					elevation: 1,
				},
			}}
		</Style>
		<slot></slot>
	</Host>
)
export class Card extends Component {}

@Augment<List>(
	'cxl-list',
	role('list'),
	<Style>
		{{
			$: {
				paddingTop: 8,
				paddingBottom: 8,
				marginLeft: -16,
				marginRight: -16,
			},
		}}
	</Style>
)
export class List extends Component {}

/**
 * @example
<cxl-grid columns="auto auto auto" style="color:#fff">
	<cxl-c style="background:#a00; padding: 24px">1</cxl-c>
	<cxl-c style="background:#0a0; padding:24px">2</cxl-c>
	<cxl-c style="background:#0a0; padding:24px">3</cxl-c>
	<cxl-c xs2 style="background:#00a; padding:24px">4</cxl-c>
	<cxl-c style="background:#00a; padding:24px">5</cxl-c>
</cxl-grid>
 */
@Augment<Grid>(
	'cxl-grid',
	<Host>
		<Style>
			{{
				$: { display: 'grid' },
			}}
		</Style>
		<slot />
	</Host>,
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
	columns = 'repeat(12, 1fr)';

	@Attribute()
	gap = 16;
}