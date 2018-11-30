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
			tags: [ 'layout' ]
		},
		'cxl-fab': {
			beta: true,
			icon: 'plus-circle',
			tags: [ 'button' ]
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