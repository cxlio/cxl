import { InputBase } from './input-base.js';
import { Augment, Attribute, StyleAttribute, get } from '../component/index.js';
import { css, margin, padding } from '../css/index.js';
import { dom } from '../tsx/index.js';
import { Button, StateStyles, Focusable, ButtonBase } from './core.js';
import { be } from '../rx/index.js';
import { onAction } from '../dom/index.js';

@Augment(
	'cxl-calendar-date',
	css({
		$: { textAlign: 'center', cursor: 'pointer' },
		btn: {
			borderRadius: 40,
			width: 40,
			height: 40,
			lineHeight: 40,
			display: 'inline-block',
			backgroundColor: 'surface',
			color: 'onSurface',
			...margin(4),
		},
		btn$selected: {
			backgroundColor: 'primary',
			color: 'onPrimary',
		},
		...StateStyles,
	}),
	() => <div className="btn" />
)
export class CalendarDate extends ButtonBase {
	@StyleAttribute()
	selected = false;
}

@Augment('cxl-calendar-month')
class CalendarMonth extends ButtonBase {
	@StyleAttribute()
	selected = false;

	@Attribute()
	month = 0;

	@Attribute()
	date = 0;
}

@Augment('cxl-calendar-year')
class CalendarYear extends ButtonBase {
	@StyleAttribute()
	selected = false;
}

/**
 * Calendar component.
 * @example
 * <cxl-calendar></cxl-calendar>
 */
@Augment<Calendar>(
	'cxl-calendar',
	css({
		header: { display: 'flex', ...padding(8) },
		divider: { flexGrow: 1 },
		closed: { scaleY: 0, transformOrigin: 'top' },
		opened: { scaleY: 1 },
		rel: { position: 'relative' },
	}),
	Focusable(),
	host => {
		const showYear = be(false);
		const monthText = be('');
		const selectedMonth = be(0);
		const value = get(host, 'value');

		function toggleYear() {
			showYear.next(!showYear.value);
		}

		return (
			<>
				<div className="header">
					<Button $={el => onAction(el).tap(toggleYear)} flat>
						{monthText}
					</Button>
					<span className="divider" />
					<Button $={el => onAction(el)} flat>
						&nbsp;
					</Button>
					<Button $={el => onAction(el)} flat>
						&nbsp;&nbsp;
					</Button>
				</div>
				<div className="rel">
					<CalendarMonth
						month={selectedMonth}
						date={value}
					></CalendarMonth>
					<CalendarYear></CalendarYear>
				</div>
			</>
		);
	}
)
export class Calendar extends InputBase {}
