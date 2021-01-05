import { InputBase } from '@cxl/ui/input-base.js';
import {
	Augment,
	Attribute,
	Component,
	StyleAttribute,
	get,
} from '@cxl/component';
import { css, padding } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { be } from '@cxl/rx';
import { onAction } from '@cxl/dom';
import { each, onValue, render } from '@cxl/template';

import {
	Button,
	DisabledStyles,
	StateStyles,
	Focusable,
	ButtonBase,
	Grid,
	Span,
	Svg,
	disabledAttribute,
	focusableEvents,
} from '@cxl/ui';

function getDate(val?: DateInformation) {
	return val?.date ? val.date.getDate() : '';
}

function getDateClass(val?: DateInformation) {
	if (!val) return 'btn';

	return `btn ${val.isToday ? 'today' : ''} ${
		val.isOutsideMonth ? 'outside' : ''
	}`;
}

interface DateInformation {
	date: Date;
	isToday: boolean;
	isOutsideMonth: boolean;
	time: number;
}

@Augment<CalendarDate>(
	'cxl-calendar-date',
	css({
		$: { textAlign: 'center', cursor: 'pointer', ...padding(4) },
		btn: {
			borderRadius: 40,
			width: 32,
			height: 32,
			lineHeight: 32,
			display: 'inline-block',
			backgroundColor: 'surface',
			color: 'onSurface',
		},
		outside: { opacity: 0.38 },
		today: {
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: 'primary',
		},
		btn$selected: {
			backgroundColor: 'primary',
			color: 'onPrimary',
		},
		...StateStyles,
	}),
	$ => (
		<Span className={get($, 'date').map(getDateClass)}>
			{get($, 'date').map(getDate)}
		</Span>
	)
)
export class CalendarDate extends ButtonBase {
	@StyleAttribute()
	selected = false;

	flat = true;

	@Attribute()
	date?: DateInformation;
}

function getMonthDates(timestamp: number) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = date.getMonth();
	const start = new Date(year, month, 1);
	const end = new Date(year, month + 1, 1);
	const result: DateInformation[] = [];
	const today = new Date().setHours(0, 0, 0, 0);

	start.setDate(1 - start.getDay());
	end.setDate(7 - (end.getDay() || 7));
	do {
		const val = new Date(start.getTime());
		const time = val.getTime();
		result.push({
			date: val,
			time,
			isOutsideMonth: val.getMonth() !== month,
			isToday: today === time,
		});

		start.setDate(start.getDate() + 1);
	} while (start <= end);

	return result;
}

function getDayText(day: number): string[] {
	const date = new Date();
	date.setDate(date.getDate() - date.getDay() + day);
	return [
		date.toLocaleDateString(navigator.language, { weekday: 'narrow' }),
		date.toLocaleDateString(navigator.language, { weekday: 'short' }),
		date.toLocaleDateString(navigator.language, { weekday: 'long' }),
	];
}

@Augment<CalendarDay>(
	'cxl-calendar-day',
	css({
		$: {
			display: 'block',
			textAlign: 'center',
			...padding(12),
			color: 'headerText',
			font: 'default',
		},
		narrow: { display: 'none' },
		long: { display: 'none' },
		'@small': { short: { display: 'none' }, narrow: { display: 'block' } },
		'@medium': {
			short: { display: 'none' },
			narrow: { display: 'none' },
			long: { display: 'block' },
		},
	}),
	$ => (
		<$.Shadow>
			{render(get($, 'day').map(getDayText), text => (
				<>
					<Span className="short">{text[0]}</Span>
					<Span className="narrow">{text[1]}</Span>
					<Span className="long">{text[2]}</Span>
				</>
			))}
		</$.Shadow>
	)
)
class CalendarDay extends Component {
	@Attribute()
	day = 0;
}

function onMonthChange($: CalendarMonth) {
	return get($, 'month')
		.map(val => {
			const date = new Date(val);
			date.setDate(1);
			return date.setHours(0, 0, 0, 0);
		})
		.distinctUntilChanged();
}

@Augment<CalendarMonth>(
	'cxl-calendar-month',
	css({ $: { display: 'block' }, $disabled: DisabledStyles }),
	$ => $.bind(disabledAttribute($)),
	$ => $.bind(focusableEvents($)),
	$ => (
		<Grid columns="repeat(7, auto)" gap={0}>
			<CalendarDay day={0} />
			<CalendarDay day={1} />
			<CalendarDay day={2} />
			<CalendarDay day={3} />
			<CalendarDay day={4} />
			<CalendarDay day={5} />
			<CalendarDay day={6} />
			{each(onMonthChange($).map(getMonthDates), item => (
				<CalendarDate
					$={el => onAction(el).tap(() => $.onDateClick(el))}
					selected={el =>
						get($, 'value').map(val => el.date?.time === val)
					}
					date={item}
				/>
			))}
		</Grid>
	)
)
class CalendarMonth extends InputBase {
	@Attribute()
	month = 0;

	value = 0;

	focus() {
		const shadow = this.shadowRoot;
		if (!shadow) return;
		const el: Button | null =
			shadow.querySelector('[selected]') ||
			shadow.querySelector('cxl-calendar-date');
		if (el) el.focus();
	}

	onDateClick(el: CalendarDate) {
		this.value = el.date?.time || 0;
	}
}

@Augment<CalendarYear>(
	'cxl-calendar-year',
	css({ $disabled: DisabledStyles }),
	$ => {
		const years = be<number[]>([]);

		$.bind(
			get($, 'start-year').tap(startYear => {
				const newYears: number[] = [];
				for (let i = startYear; i < startYear + 16; i++)
					newYears.push(i);
				years.next(newYears);
			})
		);
		$.bind(disabledAttribute($));
		$.bind(focusableEvents($));

		return (
			<Grid columns="1fr 1fr 1fr 1fr">
				{each(years, year => (
					<Button
						$={el => onAction(el).tap(() => ($.value = year))}
						flat
						primary={get($, 'value').map(val => year === val)}
					>
						{year}
					</Button>
				))}
			</Grid>
		);
	}
)
class CalendarYear extends InputBase {
	@Attribute()
	'start-year' = 0;

	value = 0;

	focus() {
		const shadow = this.shadowRoot;
		if (!shadow) return;
		const el: Button | null =
			shadow.querySelector('[primary]') ||
			shadow.querySelector('cxl-button');
		if (el) el.focus();
	}
}

function getMonthText(date: Date) {
	return date.toLocaleDateString(navigator.language, {
		year: 'numeric',
		month: 'long',
	});
}

/**
 * Calendar component.
 * @example
 * <cxl-calendar></cxl-calendar>
 */
@Augment<Calendar>(
	'cxl-calendar',
	css({
		$: { display: 'block' },
		header: { display: 'flex', ...padding(8, 12, 8, 12), height: 52 },
		divider: { flexGrow: 1 },
		closed: { scaleY: 0, transformOrigin: 'top' },
		opened: { scaleY: 1, transformOrigin: 'top' },
		year: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
		rel: { position: 'relative' },
	}),
	Focusable,
	host => {
		const showYear = be(false);
		const monthText = be('');
		const selectedMonth = be(0);
		const value = get(host, 'value');
		const startYear = be(0);
		const selectedYear = be(0);

		function toggleYear() {
			showYear.next(!showYear.value);
		}

		function nextMonth() {
			if (showYear.value) startYear.next(startYear.value + 16);
			else {
				const date = new Date(selectedMonth.value);
				date.setMonth(date.getMonth() + 1);
				selectedMonth.next(date.getTime());
			}
		}

		function previousMonth() {
			if (showYear.value) startYear.next(startYear.value - 16);
			else {
				const date = new Date(selectedMonth.value);
				date.setMonth(date.getMonth() - 1);
				selectedMonth.next(date.getTime());
			}
		}

		function setYear(year: number) {
			const date = new Date(selectedMonth.value);
			date.setFullYear(year);
			selectedMonth.next(date.getTime());
			showYear.next(false);
		}

		host.bind(
			selectedMonth.tap(val => {
				const date = new Date(val);
				const year = date.getFullYear();
				monthText.next(getMonthText(date));
				startYear.next(year - (year % 16));
			})
		);

		host.bind(
			value.tap(val => {
				let date = new Date(val);
				if (isNaN(date.getTime())) date = new Date(0);
				selectedMonth.next((host.value = date.setHours(0, 0, 0, 0)));
				selectedYear.next(date.getFullYear());
			})
		);

		return (
			<>
				<div className="header">
					<Button $={el => onAction(el).tap(toggleYear)} flat>
						{monthText}
					</Button>
					<span className="divider" />
					<Button $={el => onAction(el).tap(previousMonth)} flat>
						<Svg
							viewBox="0 0 24 24"
							height={20}
						>{`<path d="M0 0h24v24H0z" fill="none"/><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>`}</Svg>
					</Button>
					<Button $={el => onAction(el).tap(nextMonth)} flat>
						<Svg viewBox="0 0 24 24" height={20}>{`
<path d="M0 0h24v24H0z" fill="none"/><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>`}</Svg>
					</Button>
				</div>
				<div className="rel">
					<CalendarMonth
						$={el => onValue(el).tap(val => (host.value = val))}
						className={showYear.map(v =>
							v ? 'closed' : ' opened'
						)}
						month={selectedMonth}
						value={value}
					></CalendarMonth>
					<CalendarYear
						$={el => onValue(el).tap(setYear)}
						start-year={startYear}
						value={selectedYear}
						className={showYear.map(v =>
							v ? 'year opened' : 'year closed'
						)}
					></CalendarYear>
				</div>
			</>
		);
	}
)
export class Calendar extends InputBase {
	value = Date.now();
}
