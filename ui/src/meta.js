(cxl => {
	cxl.ui.meta = {

		'theme-variables': {
			speed: { label: 'Animation Speed', type: 'time' },
			background: { label: 'Page background color', type: 'color' },
			divider: { label: 'Color for divider lines', type: 'color' },
			elevation: { label: 'Color of the elevation shadow.', type: 'color' },
			error: { label: 'Error state color.', type: 'color' },
			headerText: { label: 'Table header text', type: 'color' },
			font: { label: 'Default Font', type: 'string' },
			link: { label: 'Color for <a> links', type: 'color' },
			primary: { label: 'Primary Color', type: 'color' },
			onPrimary: { label: 'Color of elements on top of a primary background', type: 'color' },
			onPrimaryLight: { label: 'Color of elements on top of a primaryLight background', type: 'color' },
			onSecondary: { label: 'Color of elements on top of a secondary background', type: 'color' },
			onSurface: { label: 'Color of elements on top of a surface background', type: 'color' },
			onError: { label: 'Color of elements on top of an error background', type: 'color' },
			primaryLight: { label: 'Primary Light Variation Color', type: 'color' },
			secondary: { label: 'Secondary/Accent Color', type: 'color' },
			surface: { label: 'Surface Color', type: 'color' }
		},

		attributes: {

			alt: { summary: 'Alternative text description for the component', type: 'string' },
			big: { summary: 'Makes the component more prominent' },
			checked: { summary: 'Whether the component is checked' },
			disabled: { summary: 'Indicates whether or not the element can receive focus and respond to user actions.' },
			'false-value': { summary: 'Value to use when the component is not in the checked status.' },
			flat: { summary: 'Remove elevation' },
			little: { summary: 'Use a smaller version of the component' },
			invalid: { summary: 'Indicates whether or not the component has a valid value' },
			maxlength: { summary: 'Max value length of the input field' },
			name: { summary: 'Specifies the name of the compopent inside a form' },
			placeholder: { summary: 'Text to display when the component has no value set' },
			primary: { summary: 'Changes the component\'s appereance to match the theme\'s primary color' },
			secondary: { summary: 'Changes the component\'s appereance to match the theme\'s secondary color' },
			src: { summary: 'Source URL for the component\' content' },
			text: { summary: 'Text content' },
			touched: { summary: 'Indicates whether or not the component has been blurred' },
			'true-value': { summary: 'Value to use when the component is in the checked status' },
			value: { summary: 'Specifies the current value of the component' }

		},

		events: {
			blur: { summary: 'Fired when the component has lost focus' },
			change: { summary: 'Fired when the component\'s value has changed' },
			input: { summary: 'Fired when the component\'s value has changed' },
			invalid: { summary: 'Fired when invalid attribute has changed' },
			focus: { summary: 'Fired when the component has received focus' },
			submit: { summary: 'Fired when the component has been submitted' }
		},

		methods: {
			focus: { summary: 'Sets focus on the component'}
		},

		'cxl-appbar': {
			summary: 'The top app bar displays information and actions relating to the current screen.',
			icon: 'window-maximize',
			tags: [ 'navigation' ]
		},
		'cxl-appbar-title': {
			icon: 'window-maximize',
			tags: [ 'navigation' ]
		},
		'cxl-avatar': {
			icon: 'user-circle',
			tags: [ 'indicator' ]
		},
		'cxl-button': {
			icon: 'hand-pointer',
			tags: [ 'button' ]
		},
		'cxl-button-ripple': {
			icon: 'hand-pointer',
			added: '1.6.0',
			beta: true,
			tags: [ 'button' ]
		},
		'cxl-backdrop': {
			tags: [ 'popup' ]
		},
		'cxl-c': {
			beta: true,
			icon: 'columns',
			tags: [ 'layout' ]
		},
		'cxl-calendar': {
			icon: 'calendar',
			beta: true,
			tags: [ 'input', 'date' ]
		},
		'cxl-calendar-month': {
			icon: 'calendar',
			beta: true,
			tags: [ 'input', 'date' ]
		},
		'cxl-card': {
			icon: 'address-card',
			tags: [ 'layout' ]
		},
		'cxl-checkbox': {
			icon: 'check-square',
			tags: ['button']
		},
		'cxl-chip': {
			beta: true,
			icon: 'capsules',
			tags: ['indicator']
		},
		'cxl-datepicker': {
			icon: 'calendar',
			beta: true,
			tags: [ 'date', 'picker', 'input' ]
		},
		'cxl-dialog': {
			icon: 'window-maximize',
			tags: [ 'popup' ]
		},
		'cxl-dialog-alert': {
			icon: 'window-maximize',
			tags: [ 'popup' ]
		},
		'cxl-dialog-confirm': {
			icon: 'window-maximize',
			tags: [ 'popup' ]
		},
		'cxl-drawer': {
			beta: true,
			icon: 'columns',
			tags: [ 'layout' ]
		},
		'cxl-fab': {
			icon: 'plus-circle',
			tags: [ 'button' ]
		},
		'cxl-form': {
			icon: 'edit',
			beta: true,
			tags: [ 'forms']
		},
		'cxl-form-group': {
			icon: 'edit',
			tags: [ 'forms' ]
		},
		'cxl-grid': {
			beta: true,
			icon: 'th',
			tags: [ 'layout' ]
		},
		'cxl-hr': {
			icon: 'minus',
			tags: [ 'layout' ]
		},
		'cxl-icon': {
			icon: 'image',
			tags: [ 'indicator' ]
		},
		'cxl-input': {
			icon: 'edit',
			tags: [ 'forms' ]
		},
		'cxl-item': {
			icon: 'list',
			tags: [ 'layout' ]
		},
		'cxl-menu': {
			icon: 'list-alt',
			tags: [ 'navigation' ]
		},
		'cxl-menu-toggle': {
			icon: 'ellipsis-v',
			tags: [ 'button' ]
		},
		'cxl-multiselect': {
			icon: 'caret-square-down',
			beta: true,
			tags: [ 'forms', 'multiple' ]
		},
		'cxl-navbar': {
			icon: 'bars',
			tags: [ 'navigation' ]
		},
		'cxl-option': {
			icon: 'ellipsis-v',
			tags: [ 'forms' ]
		},
		'cxl-password': {
			icon: 'key',
			tags: ['forms']
		},
		'cxl-progress': {
			icon: 'spinner',
			tags: ['indicator']
		},
		'cxl-radio': {
			icon: 'dot-circle',
			tags: [ 'forms' ]
		},
		'cxl-ripple': {
			added: '1.6.0',
			beta: true
		},
		'cxl-search-input': {
			beta: true,
			icon: 'search',
			tags: [ 'forms' ]
		},
		'cxl-select': {
			icon: 'caret-square-down',
			tags: [ 'forms' ]
		},
		'cxl-slider': {
			icon: 'sliders-h',
			tags: [ 'forms' ]
		},
		'cxl-snackbar': {
			icon: 'comment-alt',
			tags: [ 'popup' ]
		},
		'cxl-spinner': {
			icon: 'spinner',
			tags: [ 'indicator' ]
		},
		'cxl-submit': {
			icon: '',
			beta: true,
			tags: [ 'forms' ]
		},
		'cxl-switch': {
			icon: 'toggle-on',
			tags: [ 'forms' ]
		},
		'cxl-t': {
			icon: 'font',
			tags: [ 'style' ]
		},
		'cxl-tab': {
			icon: 'folder',
			tags: [ 'navigation' ]
		},
		'cxl-table': {
			icon: 'table',
			beta: true,
			tags: [ 'table' ]
		},
		'cxl-tabs': {
			icon: 'folder',
			tags: [ 'navigation' ]
		},
		'cxl-textarea': {
			icon: 'align-left',
			tags: [ 'forms' ]
		}

	};

})(this.cxl);