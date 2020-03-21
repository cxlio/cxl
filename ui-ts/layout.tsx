import { Augment, Component, Attribute, update } from '../component/index.js';
import { Style } from '../css/index.js';
import { dom, Host } from '../xdom/index.js';

const colStyles = ((r: any) => {
	for (let i = 12; i > 0; i--)
		r.xl['$xl' + i] = r.lg['$lg' + i] = r.md['$md' + i] = r.sm[
			'$sm' + i
		] = r.xs['$xs' + i] = {
			display: 'block',
			gridColumnEnd: 'span ' + i
		};
	return r;
})({
	xl: {},
	lg: {},
	md: {},
	sm: {},
	xs: {}
});

@Augment(
	<Host>
		<Style>
			{{
				$: {
					display: 'block',
					gridColumnEnd: 'span 12',
					flexShrink: 0
				},
				$grow: { flexGrow: 1, flexShrink: 1 },
				$fill: {
					position: 'absolute',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0
				},
				...colStyles.xs,
				$xs0: { display: 'none' },
				'@small': {
					$: { gridColumnEnd: 'auto' },
					...colStyles.sm,
					$sm0: { display: 'none' }
				},
				'@medium': { ...colStyles.md, $md0: { display: 'none' } },
				'@large': { ...colStyles.lg, $lg0: { display: 'none' } },
				'@xlarge': { ...colStyles.xl, $xl0: { display: 'none' } },

				// Padding
				$pad16: { padding: 16 },
				$pad8: { padding: 8 },
				$pad24: { padding: 24 },
				// Colors
				$surface: { backgroundColor: 'surface', color: 'onSurface' },
				$error: { backgroundColor: 'error', color: 'onError' },
				$primary: { backgroundColor: 'primary', color: 'onPrimary' },
				$primaryLight: {
					backgroundColor: 'primaryLight',
					color: 'onPrimaryLight'
				},
				$secondary: {
					backgroundColor: 'secondary',
					color: 'onSecondary'
				}
			}}
		</Style>
		<Style>
			{{
				$flex: { display: 'flex' },
				$vflex: { display: 'flex', flexDirection: 'column' }
			}}
		</Style>
		<slot />
	</Host>
)
export class C extends Component {
	static tagName = 'cxl-c';
}

@Augment<Grid>(
	<Host>
		<Style>
			{{
				$: { display: 'grid' }
			}}
		</Style>
		<slot />
	</Host>,
	update(host => {
		host.style.gridTemplateRows = `${host.rows || 'auto'}`;
		host.style.gridGap = `${host.gap}px ${host.gap}px`;
		host.style.gridTemplateColumns = host.columns;
	})
)
export class Grid extends Component {
	static tagName = 'cxl-grid';

	@Attribute()
	rows?: number;

	@Attribute()
	columns = 'repeat(12, 1fr)';

	@Attribute()
	gap = 16;
}
