import { InputBase } from '@cxl/ui/input-base.js';
import { Augment, Attribute, StyleAttribute, get } from '@cxl/component';
import { css, padding } from '@cxl/css';
import { dom } from '@cxl/tsx';
import { Observable, be, merge, ref } from '@cxl/rx';
import { on, onAction, onKeypress } from '@cxl/dom';
import {
	DisabledStyles,
	Focusable,
	StateStyles,
	breakpoint,
	disabledAttribute,
	each,
	focusableEvents,
	onValue,
	$onAction,
} from '@cxl/template';
import { Button } from '@cxl/ui/button.js';
import { Grid } from '@cxl/ui/layout.js';
import { Span } from '@cxl/ui/core.js';
import { ButtonBase, Svg, Path } from '@cxl/ui/core.js';
import { focusProxy } from '@cxl/ui/form.js';
import { IconButton } from '@cxl/ui/icon.js';

interface DateInformation {
	date: Date;
	isToday: boolean;
	isOutsideMonth: boolean;
	time: number;
}

function getDate(val?: DateInformation) {
	return val?.date ? val.date.getDate() : '';
}

function getDateClass(val?: DateInformation) {
	if (!val) return 'btn';

	return `btn ${val.isToday ? 'today' : ''} ${
		val.isOutsideMonth ? 'outside' : ''
	}`;
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

function getDayText(day: number, size: string): string {
	const date = new Date();
	const weekday =
		size === 'xsmall' ? 'narrow' : size === 'small' ? 'short' : 'long';
	date.setDate(date.getDate() - date.getDay() + day);
	return date.toLocaleDateString(navigator.language, { weekday });
}

@Augment<CalendarDate>(
	'cxl-calendar-date',
	css({
		$: { textAlign: 'center', cursor: 'pointer' },
		$flat: padding(4, 0, 4, 0),
		btn: {
			borderRadius: 40,
			width: 32,
			height: 32,
			lineHeight: 32,
			display: 'inline-block',
			backgroundColor: 'surface',
			color: 'onSurface',
		},
		outside: { color: 'headerText' },
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

function normalizeDate(val: Date) {
	const date = new Date(val);
	return date.setHours(0, 0, 0, 0);
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
	css({
		$: { display: 'block' },
		$disabled: DisabledStyles,
		day: {
			textAlign: 'center',
			...padding(12, 0, 12, 0),
			color: 'headerText',
			font: 'default',
		},
		grid: {
			columnGap: 0,
			rowGap: 0,
		},
	}),
	disabledAttribute,
	focusableEvents,
	$ => {
		const time = get($, 'value')
			.filter<Date>(val => !!val)
			.map(normalizeDate);

		function onDateClick(el: CalendarDate) {
			$.value = el.date?.date || new Date();
		}

		return (
			<Grid columns={7} className="grid">
				{each(
					breakpoint($).map(size =>
						[0, 1, 2, 3, 4, 5, 6].map(n => getDayText(n, size))
					),
					text => (
						<div className="day">{text}</div>
					)
				)}
				{each(onMonthChange($).map(getMonthDates), item => (
					<CalendarDate
						$={el =>
							merge(
								onAction(el).tap(() => onDateClick(el)),
								time.tap(
									val => (el.selected = el.date?.time === val)
								)
							)
						}
						date={item}
					/>
				))}
			</Grid>
		);
	}
)
class CalendarMonth extends InputBase {
	@Attribute()
	month: Date = new Date();

	value: Date | undefined;

	focus() {
		const shadow = this.shadowRoot;
		if (!shadow) return;
		const el: Button | null =
			shadow.querySelector('[selected]') ||
			shadow.querySelector('cxl-calendar-date');
		if (el) el.focus();
	}
}

@Augment<CalendarYear>(
	'cxl-calendar-year',
	css({
		$disabled: DisabledStyles,
		selected: {
			borderColor: 'primary',
			borderWidth: 1,
			borderStyle: 'solid',
			color: 'primary',
		},
	}),
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
			<Grid columns={4}>
				{each(years as Observable<number[]>, year => (
					<Button
						$={el => onAction(el).tap(() => ($.value = year))}
						flat
						className={get($, 'value').map(val =>
							year === val ? 'selected' : ''
						)}
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

function getDateValue(date: Date | string) {
	if (date && !(date instanceof Date)) date = new Date(date);
	return date as Date;
}

/**
 * Datepicker component.
 * @example
 * <cxl-datepicker></cxl-datepicker>
 */
@Augment<Datepicker>(
	'cxl-datepicker',
	css({
		$: { display: 'block', backgroundColor: 'surface', paddingBottom: 8 },
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
		const value = ref<Date>();
		const startYear = be(0);
		const selectedMonth = ref<Date>();
		const selectedYear = ref<number>();

		function toggleYear() {
			showYear.next(!showYear.value);
		}

		function nextMonth() {
			if (showYear.value) startYear.next(startYear.value + 16);
			else {
				const date = new Date(selectedMonth.value);
				date.setMonth(date.getMonth() + 1);
				selectedMonth.next(date);
			}
		}

		function previousMonth() {
			if (showYear.value) startYear.next(startYear.value - 16);
			else {
				const date = new Date(selectedMonth.value);
				date.setMonth(date.getMonth() - 1);
				selectedMonth.next(date);
			}
		}

		function setYear(year: number) {
			const date = new Date(selectedMonth.value);
			date.setFullYear(year);
			selectedMonth.next(date);
			showYear.next(false);
		}

		host.bind(
			selectedMonth.tap(val => {
				const year = val.getFullYear();
				monthText.next(getMonthText(val));
				startYear.next(year - (year % 16));
				selectedYear.next(val.getFullYear());
			})
		);

		host.bind(
			get(host, 'value').tap(val => {
				if (val) {
					val = getDateValue(val);
					if (val !== host.value) return (host.value = val);
					host.invalid = isNaN(val.getTime());
					if (host.invalid) return;
					value.next(val);
					selectedMonth.next(val);
					selectedYear.next(val.getFullYear());
				} else {
					selectedMonth.next(new Date());
					if (val !== undefined) host.value = undefined;
				}
			})
		);

		return (
			<>
				<div className="header">
					<Button
						title={showYear.map(
							v => `${v ? 'Close' : 'Open'} Year Panel`
						)}
						$={el => onAction(el).tap(toggleYear)}
						flat
					>
						{monthText}
						<Svg viewBox="0 0 24 24" width={20}>
							<Path d="M0 0h24v24H0z" fill="none" />
							<Path d="M7 10l5 5 5-5z" />
						</Svg>
					</Button>
					<span className="divider" />
					<IconButton
						title={showYear.map(
							v => `Previous ${v ? 'Year Page' : 'Month'}`
						)}
						$={$onAction(previousMonth)}
					>
						<Svg viewBox="0 0 24 24" width={20}>
							<Path d="M0 0h24v24H0z" fill="none" />
							<Path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
						</Svg>
					</IconButton>
					<IconButton
						title={showYear.map(
							v => `Next ${v ? 'Year Page' : 'Month'}`
						)}
						$={$onAction(nextMonth)}
					>
						<Svg viewBox="0 0 24 24" width={20}>
							<Path d="M0 0h24v24H0z" fill="none" />
							<Path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
						</Svg>
					</IconButton>
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
export class Datepicker extends InputBase {
	value: Date | undefined = undefined;

	focus() {
		(this.shadowRoot?.querySelector('.opened') as HTMLElement)?.focus();
	}
}

@Augment<DatepickerToggle>(
	'cxl-datepicker-toggle',
	css({
		trigger: {
			backgroundColor: 'transparent',
		},
		calendar: {
			position: 'absolute',
			left: -12,
			right: -12,
			top: 26,
			display: 'none',
			elevation: 1,
		},
		calendar$opened: {
			display: 'block',
		},
	}),
	Focusable,
	$ => (
		<>
			<IconButton
				$={el => onAction(el).tap(() => ($.opened = !$.opened))}
				title={get($, 'opened').map(
					v => `${v ? 'Open' : 'Close'} Datepicker`
				)}
				className="trigger"
			>
				<Svg viewBox="0 0 24 24" width={20}>
					<Path d="M0 0h24v24H0z" fill="none" />
					<Path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" />
				</Svg>
			</IconButton>
			<Datepicker
				className="calendar"
				value={get($, 'value')}
				$={el =>
					merge(
						onValue(el).tap(val => {
							$.value = val;
							$.opened = false;
						}),
						get($, 'opened').tap(opened => opened && el.focus()),
						onKeypress($, 'escape').tap(() => ($.opened = false))
					)
				}
			/>
		</>
	)
)
export class DatepickerToggle extends InputBase {
	@StyleAttribute()
	opened = false;
}

@Augment<DatepickerInput>(
	'cxl-datepicker-input',
	css({
		$: { display: 'flex', flexGrow: 1 },
		input: {
			color: 'onSurface',
			font: 'default',
			minHeight: 20,
			outline: 0,
			flexGrow: 1,
		},
		toggle: {
			marginTop: -16,
			marginRight: -4,
		},
		...StateStyles,
	}),
	host => (
		<Span
			className="input"
			$={el =>
				merge(
					focusProxy(el, host),
					get(host, 'value').tap(val => {
						if (val) {
							val = getDateValue(val);
							if (isNaN(val.getTime()))
								return (host.invalid = true);

							const textContent = val.toLocaleDateString();
							if (el.textContent !== textContent)
								el.textContent = textContent;
						} else el.textContent = '';
					}),
					get(host, 'disabled').raf(
						val => (el.contentEditable = val ? 'false' : 'true')
					),
					on(el, 'blur').tap(() => {
						const text = el.textContent;
						const date = text ? new Date(text) : undefined;
						host.value = date;
					}),
					onKeypress(el, 'enter').tap(ev => ev.preventDefault())
				)
			}
		/>
	),
	$ => (
		<DatepickerToggle
			className="toggle"
			value={get($, 'value')}
			$={el => onValue(el).tap(val => ($.value = val))}
		/>
	)
)
export class DatepickerInput extends InputBase {
	value: Date | undefined;
}
