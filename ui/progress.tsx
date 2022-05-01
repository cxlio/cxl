///<amd-module name="@cxl/ui/progress.js"/>
import { tap } from '@cxl/rx';
import { Attribute, Augment, Component, Span, get } from '@cxl/component';
import { dom } from '@cxl/tsx';
import { trigger } from '@cxl/dom';
import { role } from '@cxl/template';
import { css } from './theme.js';

/**
 * Linear progress indicators display progress by animating an indicator along the length of a fixed, visible track.
 * @example
 * <cxl-progress></cxl-progress><br/>
 * <cxl-progress value="0.5"></cxl-progress>
 */
@Augment<Progress>(
	'cxl-progress',
	css({
		$: { /*backgroundColor: 'primary',*/ height: 4 },
		indicator: {
			display: 'block',
			backgroundColor: 'primary',
			height: 4,
			transformOrigin: 'left',
		},
		indeterminate: { animation: 'wait' },
	}),
	host => (
		<Span
			className="indicator"
			$={el =>
				get(host, 'value').pipe(
					tap(val => {
						el.classList.toggle('indeterminate', val === Infinity);
						if (val !== Infinity)
							el.style.transform = 'scaleX(' + val + ')';
						trigger(host, 'change');
					})
				)
			}
		/>
	),
	role('progressbar')
)
export class Progress extends Component {
	@Attribute()
	value = Infinity;
}
