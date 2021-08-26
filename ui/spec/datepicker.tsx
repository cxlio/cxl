import { spec } from '@cxl/spec';
import { dom } from '@cxl/tsx';
import {
	Datepicker,
	DatepickerToggle,
	DatepickerInput,
} from '../datepicker.js';
import { Label, Field } from '@cxl/ui';
import { trigger } from '@cxl/dom';

export default spec('ui-datetime', s => {
	s.test('Calendar', it => {
		it.should('handle invalid dates', a => {
			const val = new Date(NaN);
			const el = (<Datepicker value={val} />) as Datepicker;
			a.dom.appendChild(el);
			a.equal(el.value, val);
			a.ok(el.invalid);
		});

		it.should('preserve date value', a => {
			const date = new Date();
			const el = (<Datepicker value={date} />) as Datepicker;
			a.equal(el.value, date);
		});

		it.should('initialize with current date if value is undefined', a => {
			const el = (<Datepicker />) as Datepicker;
			a.dom.appendChild(el);
			a.equal(el.value, undefined);
			const date = new Date();
			const monthDisplay = el.shadowRoot?.querySelector(
				'.header cxl-button'
			) as HTMLElement;
			const month = date.toLocaleDateString(navigator.language, {
				year: 'numeric',
				month: 'long',
			});
			a.ok(monthDisplay.textContent?.indexOf(month) !== -1);
			monthDisplay.click();
			const calendarYear = el.shadowRoot?.querySelector(
				'cxl-calendar-year.opened'
			);
			const selectedYear = calendarYear?.shadowRoot?.querySelector(
				'cxl-grid cxl-button.selected'
			);
			a.equal(selectedYear?.textContent, date.getFullYear().toString());
		});

		it.should('focus selected date on focus', a => {
			const date = new Date();
			const el = (<Datepicker value={date} />) as Datepicker;
			a.dom.appendChild(el);
			a.equal(el.value, date);
			el.focus();
			const calendarMonth = el.shadowRoot?.querySelector(
				'cxl-calendar-month'
			) as HTMLElement;
			const focused = calendarMonth?.shadowRoot?.querySelector(':focus');
			a.equal(focused?.tagName, 'CXL-CALENDAR-DATE');
			a.equal(
				focused?.shadowRoot?.querySelector('.btn')?.textContent,
				date.getDate().toString()
			);
		});

		it.should('navigate through months', a => {
			const date = new Date();
			const el = (<Datepicker value={date} />) as Datepicker;
			a.dom.appendChild(el);
			const monthDisplay = el.shadowRoot?.querySelector(
				'.header cxl-button'
			) as HTMLElement;

			const previousMonthButton = el.shadowRoot?.querySelector(
				'.header cxl-icon-button'
			) as HTMLElement;

			previousMonthButton.click();
			const testMonth = new Date(date);
			testMonth.setMonth(date.getMonth() - 1);
			const prevMonth = testMonth.toLocaleDateString(navigator.language, {
				year: 'numeric',
				month: 'long',
			});
			a.ok(monthDisplay.textContent?.indexOf(prevMonth) !== -1);

			const nextMonthButton = el.shadowRoot?.querySelector(
				'.header cxl-icon-button:last-child'
			) as HTMLElement;
			nextMonthButton.click();
			nextMonthButton.click();

			testMonth.setMonth(date.getMonth() + 1);
			const nextMonth = testMonth.toLocaleDateString(navigator.language, {
				year: 'numeric',
				month: 'long',
			});
			a.ok(monthDisplay.textContent?.indexOf(nextMonth) !== -1);
		});

		it.should('navigate through years', a => {
			const date = new Date();
			const el = (<Datepicker value={date} />) as Datepicker;
			a.dom.appendChild(el);
			const monthDisplay = el.shadowRoot?.querySelector(
				'.header cxl-button'
			) as HTMLElement;
			monthDisplay.click();
			const calendarYear = el.shadowRoot?.querySelector(
				'cxl-calendar-year.opened'
			);
			const selectedYear = calendarYear?.shadowRoot?.querySelector(
				'cxl-grid cxl-button.selected'
			);
			a.equal(selectedYear?.textContent, date.getFullYear().toString());
		});

		it.should('parse string value', a => {
			a.dom.innerHTML = `<cxl-datepicker value="3/14/2021"></cxl-datepicker>`;
			const el = a.dom.children[0] as Datepicker;
			a.equal(el.value?.getDate(), new Date('3/14/2021').getDate());
		});

		it.figure('Datepicker', <Datepicker value={new Date(1984, 8, 6)} />);
	});

	s.test('DatepickerToggle', it => {
		it.figure('DatepickerToggle', <DatepickerToggle />);
	});

	s.test('DatepickerInput', it => {
		it.should('initialize datepicker date with undefined', a => {
			const date = new Date();
			const el = (<DatepickerInput />) as DatepickerInput;
			a.dom.appendChild(el);
			a.equal(el.value, undefined);
			const toggle = el.shadowRoot?.querySelector(
				'cxl-datepicker-toggle'
			) as DatepickerToggle;
			a.equal(toggle.value, undefined);
			const datepicker = toggle.shadowRoot?.querySelector(
				'cxl-datepicker'
			) as Datepicker;
			a.equal(datepicker.value, undefined);
			const calendarMonth = datepicker?.shadowRoot?.querySelector(
				'cxl-calendar-month'
			) as HTMLElement & { value: any; month: Date };
			a.equal(calendarMonth.month.getMonth(), date.getMonth());
			a.equal(calendarMonth.month.getFullYear(), date.getFullYear());
			a.equal(calendarMonth?.value, el.value);
			const selected = calendarMonth?.shadowRoot?.querySelector(
				'cxl-calendar-date[selected]'
			);
			a.ok(!selected);
		});

		it.should('set datepicker date to input value', a => {
			const date = new Date('2020-03-14');
			const el = (<DatepickerInput value={date} />) as DatepickerInput;
			a.dom.appendChild(el);
			a.equal(el.value, date);
			const toggle = el.shadowRoot?.querySelector(
				'cxl-datepicker-toggle'
			) as DatepickerToggle;
			a.equal(toggle.value, el.value);
			const datepicker = toggle.shadowRoot?.querySelector(
				'cxl-datepicker'
			) as Datepicker;
			a.equal(datepicker.value, el.value);
			const calendarMonth = datepicker?.shadowRoot?.querySelector(
				'cxl-calendar-month'
			) as HTMLElement & { value: any; month: Date };
			a.equal(calendarMonth.month.getMonth(), el.value?.getMonth());
			a.equal(calendarMonth.month.getFullYear(), el.value?.getFullYear());
			a.equal(calendarMonth?.value, el.value);
			const firstDate = calendarMonth?.shadowRoot?.querySelector(
				'cxl-calendar-date'
			);
			a.ok(firstDate);
			const selected = calendarMonth?.shadowRoot?.querySelector(
				'cxl-calendar-date[selected]'
			);
			a.ok(selected);
		});

		it.should('update value on blur', a => {
			const el = (<DatepickerInput />) as DatepickerInput;
			a.dom.appendChild(el);
			const editableDiv = el.shadowRoot?.querySelector(
				'.input'
			) as HTMLElement;
			const dateText = '2020-03-14';
			editableDiv.textContent = dateText;
			trigger(editableDiv, 'blur');
			const date = new Date(dateText);
			const inputDate = el.value as Date;
			a.equal(inputDate.getDate(), date.getDate());
			a.equal(inputDate.getMonth(), date.getMonth());
			a.equal(inputDate.getFullYear(), date.getFullYear());
		});

		it.figure(
			'DatepickerInput',
			<Field>
				<Label>Birth Date</Label>
				<DatepickerInput />
			</Field>
		);
	});
});
