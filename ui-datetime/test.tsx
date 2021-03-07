import { spec } from '@cxl/spec';
import { dom } from '@cxl/tsx';
import { Calendar, DatePicker, DatePickerInput } from './index.js';
import { Label, Field } from '@cxl/ui';

export default spec('ui-datetime', s => {
	s.test('Calendar', it => {
		it.should('allow empty value', a => {
			const el = (<Calendar />) as Calendar;
			a.equal(el.value, undefined);
		});

		it.should('handle invalid dates', a => {
			const el = (<Calendar value={new Date(-3)} />) as Calendar;
			a.ok(el);
		});

		it.should('preserve date value', a => {
			const date = new Date();
			const el = (<Calendar value={date} />) as Calendar;
			a.equal(el.value, date);
		});

		it.figure('Calendar', <Calendar />);
	});

	s.test('DatePicker', it => {
		it.figure('DatePicker', <DatePicker />);
	});

	s.test('DatePickerInput', it => {
		it.figure(
			'DatePickerInput',
			<Field>
				<Label>Birth Date</Label>
				<DatePickerInput />
			</Field>
		);
	});
});
