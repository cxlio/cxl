(cxl => {
	cxl.ui.meta = {

		'theme-variables': {
			speed: { label: 'Animation Speed', type: 'time' },
			font: { label: 'Default Font', type: 'string' },
			primary: { label: 'Primary Color', type: 'color' },
			secondary: { label: 'Secondary/Accent Color', type: 'color' }
		},

		attributes: {

			alt: { summary: '' },
			disabled: { summary: '' },
			invalid: { summary: '' },
			name: { summary: '' },
			touched: { summary: '' },
			value: { summary: '' }

		},

		events: {
			blur: { summary: '' },
			change: { summary: '' },
			input: { summary: '' },
			invalid: { summary: '' }
		},

		'cxl-appbar': {
			summary: 'The top app bar displays information and actions relating to the current screen.',
			icon: 'window-maximize',
			tags: [ 'navigation' ]
		},
		'cxl-appbar-title': {
			icon: 'window-maximize'
		},
		'cxl-avatar': {
			icon: 'user-circle',
			tags: [ 'indicator' ]
		},
		'cxl-button': {
			icon: 'hand-pointer'
		},
		'cxl-c': {
			beta: true,
			icon: 'columns'
		},
		'cxl-card': {
			icon: 'address-card',
			beta: true
		},
		'cxl-checkbox': {
			icon: 'check-square'
		},
		'cxl-chip': {
			beta: true,
			icon: 'capsules'
		},
		'cxl-dialog': {
			icon: 'window-maximize'
		},
		'cxl-dialog-alert': {
			icon: 'window-maximize'
		},
		'cxl-dialog-confirm': {
			icon: 'window-maximize'
		},
		'cxl-fab': {
			beta: true,
			icon: 'plus-circle'
		},
		'cxl-form-group': {
			icon: 'edit'
		},
		'cxl-grid': {
			beta: true,
			icon: 'th'
		},
		'cxl-hr': {
			icon: 'minus'
		},
		'cxl-icon': {
			icon: 'image'
		},
		'cxl-input': {
			icon: 'edit'
		},
		'cxl-item': {
			icon: 'list'
		},
		'cxl-menu': {
			icon: 'list-alt'
		},
		'cxl-menu-toggle': {
			icon: 'ellipsis-v'
		},
		'cxl-navbar': {
			icon: 'bars'
		},
		'cxl-option': {
			icon: 'ellipsis-v'
		},
		'cxl-password': {
			icon: 'key'
		},
		'cxl-progress': {
			icon: 'spinner'
		},
		'cxl-radio': {
			icon: 'dot-circle'
		},
		'cxl-search-input': {
			beta: true,
			icon: 'search'
		},
		'cxl-select': {
			icon: 'caret-square-down'
		},
		'cxl-slider': {
			icon: 'sliders-h'
		},
		'cxl-snackbar': {
			icon: 'comment-alt'
		},
		'cxl-switch': {
			icon: 'toggle-on'
		},
		'cxl-t': {
			icon: 'font'
		},
		'cxl-tab': {
			icon: 'folder'
		},
		'cxl-tabs': {
			icon: 'folder'
		},
		'cxl-textarea': {
			icon: 'align-left'
		}
	};

})(this.cxl);