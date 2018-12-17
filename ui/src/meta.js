(cxl => {
	cxl.ui.meta = {

		'theme-variables': {
			speed: { label: 'Animation Speed', type: 'time' },
			font: { label: 'Default Font', type: 'string' },
			primary: { label: 'Primary Color', type: 'color' },
			secondary: { label: 'Secondary/Accent Color', type: 'color' },
			surface: { label: 'Surface Color', type: 'color' }
		},

		attributes: {

			alt: { summary: 'Alternative text description for the component' },
			disabled: { summary: 'Indicates whether or not the element can receive focus and respond to user actions.' },
			invalid: { summary: 'Indicated whether or not the component has a valid value' },
			name: { summary: 'Specifies the name of the compopent inside a form' },
			touched: { summary: 'Indicates whether or not the component has been blurred' },
			value: { summary: 'Specifies the current value of the component' }

		},

		events: {
			blur: { summary: 'Fired when the component has lost focus' },
			change: { summary: 'Fired when the component\'s value has changed' },
			input: { summary: 'Fired when the component\'s value has changed' },
			invalid: { summary: '' }
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
		'cxl-backdrop': {
			tags: [ 'popup' ]
		},
		'cxl-c': {
			beta: true,
			icon: 'columns',
			tags: [ 'layout' ]
		},
		'cxl-card': {
			icon: 'address-card',
			beta: true,
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
			beta: true,
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
			beta: true,
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