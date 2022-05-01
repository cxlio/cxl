///<amd-module name="@cxl/ui/spinner.js"/>
import { Augment, Component } from '@cxl/component';
import { pct } from '@cxl/css';
import { dom } from '@cxl/tsx';

import {
	ForegroundColorAttribute,
	ColorValue,
	Svg,
	Circle,
	css,
} from './core.js';

/**
 * Spinners are used to indicate that the app is performing an action that the user needs to wait on.
 *
 * @example
 * <cxl-spinner></cxl-spinner>
 */
@Augment(
	'cxl-spinner',
	css({
		$: {
			animation: 'spin',
			display: 'inline-block',
			width: 48,
			height: 48,
		},
		circle: { animation: 'spinnerstroke' },
		svg: { width: pct(100), height: pct(100) },
	}),
	_ => (
		<Svg viewBox="0 0 100 100" className="svg">
			<Circle
				cx="50%"
				cy="50%"
				r="45"
				style="stroke:var(--cxl-surface);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px"
				className="circle"
			/>
		</Svg>
	)
)
export class Spinner extends Component {
	@ForegroundColorAttribute('primary')
	color?: ColorValue;
}
