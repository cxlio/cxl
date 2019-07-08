(() => {

const
	component = cxl.component,
	directive = cxl.directive,
	InputBase = cxl.ui.InputBase
;

directive('date', {
	update(val) {
		if (!val) return '';
		if (!(val instanceof Date)) val = new Date(val);
		return val.toLocaleDateString();
	}
});

directive('datetime', {
	update(val) {
		if (!val) return '';
		if (!(val instanceof Date)) val = new Date(val);
		return val.toLocaleDateString() + ' ' + val.toLocaleTimeString();
	}
});

directive('time', {
	update(val) {
		if (!val) return '';
		if (!(val instanceof Date)) val = new Date(val);
		return val.toLocaleTimeString();
	}
});

component({
	name: 'cxl-calendar-date',
	extend: InputBase,
	attributes: [ 'selected' ],
	bindings: 'focusable =label:aria.prop(label)',
	template: `<span &=".btn =value:#getDate:text"></span>`,
	styles: {
		$: { textAlign: 'center', cursor: 'pointer' },
		$disabled: { state: 'disabled' },
		$hover: { state: 'hover' },
		btn: {
			borderRadius: 40, width: 40, height: 40, lineHeight: 40, display: 'inline-block',
			padding: 0, backgroundColor: 'surface', color: 'onSurface', margin: 4
		},
		btn$selected: {
			backgroundColor: 'primary', color: 'onPrimary'
		}
	}
}, {
	getDate(val) {
		if (!val || typeof(val)==='string')
			val = new Date(val);

		this.label = val.toDateString();

		return val.getDate();
	}
});

component({
	name: 'cxl-calendar-month',
	attributes: [ 'value', 'month' ],
	methods: [ 'focus' ],
	template: `
<cxl-table &="navigation.grid:#onNavigation">
	<cxl-th>S</cxl-th>
	<cxl-th>M</cxl-th>
	<cxl-th>T</cxl-th>
	<cxl-th>W</cxl-th>
	<cxl-th>T</cxl-th>
	<cxl-th>F</cxl-th>
	<cxl-th>S</cxl-th>
	<template &="=dates:marker.empty:each:repeat">
	<cxl-calendar-date &="action:#onAction $date:|@value $disabled:@disabled $today:.today:filter:#setTodayEl =value:#isSelected:@selected"></cxl-calendar-date>
	</template>
</cxl-table>
	`,
	bindings: `=month:#render =value:#parse`,
	styles: {
		$: { textAlign: 'center' },
		today: { border: 1, borderStyle: 'solid', borderColor: 'primary' }
	},
	initialize(state)
	{
		const now = new Date();
		state.today = (new Date(now.getFullYear(), now.getMonth(), now.getDate())).getTime();
		state.month = state.month || now;
	}

}, {
	selected: null,
	value: null,
	todayEl: null,
	setFocus: false,

	setTodayEl(val, el)
	{
		if (val)
			this.todayEl = el;
	},

	focus()
	{
		const val = this.selected || this.todayEl;

		if (val)
			val.focus();
	},

	onNavigation(el)
	{
		el.focus();
	},

	parse(val)
	{
		if (val && !(val instanceof Date))
			this.value = new Date(val);
	},

	isSelected(val, el)
	{
	const
		date = el.value,
		result = (val && date.getMonth()===val.getMonth() &&
			date.getFullYear()===val.getFullYear() &&
			date.getDate() === val.getDate())
	;
		if (result)
			this.selected = el;

		return result;
	},

	setSelected(el)
	{
		this.value = el.value;
	},

	onAction(ev, el)
	{
		if (!el.disabled)
			this.setSelected(el);
	},

	getFirstDate(date)
	{
		const result = new Date(date.getFullYear(), date.getMonth(), 1);
		result.setDate(1-result.getDay());
		return result;
	},

	getLastDate(date)
	{
		const result = new Date(date.getFullYear(), date.getMonth()+1, 1);
		result.setDate(7 - result.getDay());
		return result;
	},

	createItem(current)
	{
		return {
			date: new Date(current),
			disabled: current.getMonth() !== this.monthNumber,
			today: this.today === current.getTime()
		};
	},

	render(startDate)
	{
		if (!(startDate instanceof Date))
			startDate = new Date(startDate);

	const
		dates = this.dates = [],
		lastDate = startDate && this.getLastDate(startDate)
	;
		if (!startDate)
			return;

		this.monthNumber = startDate.getMonth();

		var current = this.getFirstDate(startDate);

		do {
			dates.push(this.createItem(current));
			current.setDate(current.getDate() + 1);
		} while (current <= lastDate || dates.length > 50);
	}
});

component({
	name: 'cxl-calendar-year',
	attributes: [ 'value', 'start-year' ],
	methods: [ 'focus' ],
	template: `
<div &=".grid =columns:@columns navigation.grid:#onNav">
<template &="=years:marker.empty:each:repeat">
	<cxl-button flat &="item:text:@value action:#select =value:#isSelected:@primary"></cxl-button>
</template>
</div>
	`,
	styles: {
		$: {
			position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
			backgroundColor: 'surface', color: 'onSurface'
		},
		grid: {
			display: 'grid', height: '100%',
			gridTemplateColumns: '1fr 1fr 1fr 1fr'
		}
	},
	bindings: '=start-year:#render action:#select'
}, {
	columns: 4,

	focus()
	{
		// TODO
		setTimeout(() => {
			if (this.selected)
				this.selected.focus();
		});
	},

	onNav(el)
	{
		el.focus();
	},

	isSelected(val, el)
	{
		const result = el.value === val;

		if (result)
			this.selected = el;

		return result;
	},

	select(ev, target)
	{
		this.value = target.value;
	},

	render(startYear)
	{
		const years = this.years = [];

		for (var i=startYear;i<startYear+16; i++)
			years.push(i);
	}
});

component({
	name: 'cxl-calendar-header',
	template: ``
});

component({
	name: 'cxl-calendar',
	attributes: [ 'value' ],
	methods: [ 'focus' ],
	template: `
<div &=".header action:event.stop">
	<cxl-button &="action:#toggleYear:#getMonthText" flat><x &="=monthText:text"></x>
	<cxl-icon icon="caret-down"></cxl-icon></cxl-button>
	<span &=".divider"></span>
	<cxl-button aria-label="Previus Month" &="action:#previousMonth" flat>&nbsp;<cxl-icon icon="arrow-left"></cxl-icon>&nbsp;</cxl-button>
	<cxl-button aria-label="Next Month" &="action:#nextMonth" flat>&nbsp;<cxl-icon icon="arrow-right"></cxl-icon>&nbsp;</cxl-button>
</div>
<div &=".rel">
	<cxl-calendar-month &="id(calendarMonth) =selectedMonth:@month @value:=value"></cxl-calendar-month>
	<cxl-calendar-year &="action:event.stop:not:=yearOpen =selectedYear::@value =startYear:@start-year @start-year:=startYear:#getMonthText .closed =yearOpen:.opened:filter:focus"></cxl-calendar-year>
</div>
	`,
	styles: {
		header: { display: 'flex', padding: 8 },
		divider: { flexGrow: 1 },
		closed: { scaleY: 0, transformOrigin: 'top' },
		opened: { scaleY: 1 },
		rel: { position: 'relative' }
	},
	bindings: '=value:#render =selectedMonth:#getMonthText =selectedYear:#updateMonth'

}, {
	today: null,
	value: null,
	calendarMonth: null,

	focus()
	{
		const val = this.value || this.today, month = this.selectedMonth;

		if (val.getMonth()!==month.getMonth() || val.getFullYear()!==month.getFullYear())
		{
			this.selectedMonth = new Date(val);
			this.selectedYear = this.selectedMonth.getFullYear();
		}

		// TODO ?
		setTimeout(() => this.calendarMonth.focus());
	},

	toggleYear()
	{
		this.yearOpen = !this.yearOpen;
		const year = this.selectedMonth.getFullYear();
		this.startYear = year - year % 16;
		this.selectedYear = year;
	},

	updateMonth(year)
	{
		const month = this.selectedMonth;

		if (year && month.getFullYear() !== year)
		{
			month.setYear(year);
			this.selectedMonth = new Date(month);
		}
	},

	nextMonth()
	{
		if (this.yearOpen)
			this.startYear += 16;
		else
		{
			const c = this.selectedMonth;
			this.selectedMonth = new Date(c.getFullYear(), c.getMonth()+1, 1);
		}
	},

	previousMonth()
	{
		if (this.yearOpen)
			this.startYear -= 16;
		else
		{
			const c = this.selectedMonth;
			this.selectedMonth = new Date(c.getFullYear(), c.getMonth()-1, 1);
		}
	},

	getMonthText()
	{
		if (this.selectedMonth)
		{
			const options = { year: 'numeric', month: 'long' };
			this.monthText = this.yearOpen ? this.startYear + '-' + (this.startYear+16) :
				this.selectedMonth.toLocaleDateString(navigator.language, options);
		}
	},

	render(val)
	{
		this.today = new Date();
		if (!this.selectedMonth)
			this.selectedMonth = val ? new Date(val) : this.today;
	}
});

component({
	name: 'cxl-datepicker',
	extend: 'cxl-input',
	template: `
<input &="id(input) .input
	=aria-label:attribute(aria-label)
	=inputValue:value
	=maxlength:filter:@maxLength value:#onInput
	=disabled:attribute(disabled) on(input):event.stop =name:attribute(name)
	on(blur):host.trigger(blur) on(focus):host.trigger(focus)" />
<div &=".focusLine =focused:.expand"></div>
<cxl-icon-toggle icon="calendar" &=".icon =disabled:@disabled @opened:=opened">
<cxl-toggle-popup &="role(dialog)">
	<cxl-card>
		<cxl-calendar &="=opened:filter:focus @value:#update:=value =value:@value"></cxl-calendar>
	</cxl-card>
</cxl-toggle-popup>
</cxl-icon-toggle>
	`,
	styles: {
		$: { position: 'relative', flexGrow: 1, display: 'flex' },
		icon: { padding: 0 }
	}
}, {
	value: null,
	inputValue: '',

	onInput(val)
	{
		this.value = val && new Date(val);
	},

	update(date)
	{
		if (date && date !== this.value && !isNaN(date.getTime()))
			this.inputValue = date.toLocaleDateString();
		this.input.focus();
	}
});

})();
