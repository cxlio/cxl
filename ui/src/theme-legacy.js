(cxl => {
	'use strict';

	const css = cxl.css,
		extendComponent = cxl.extendComponent,
		extendStyles = cxl.extendStyles,
		rgba = css.rgba;
	cxl.css.extend({
		colors: {
			error: rgba(0xff, 0, 0),
			surface: rgba(0, 0, 0x80),
			onSurface: rgba(0xff, 0xff, 0xff),
			primary: rgba(0xdd, 0xdd, 0xdd),
			primaryLight: rgba(0, 0x80, 0x80),
			onPrimary: rgba(0x0, 0x0, 0x0),
			divider: rgba(0xc0, 0xc0, 0xc0),
			secondary: rgba(0xaa, 0x0, 0xaa),
			onSecondary: rgba(0xff, 0xff, 0xff)
		},

		variables: {
			font: 'monospace',
			fontSize: '16px'
		},

		typography: {
			default: {
				fontWeight: 700,
				fontSize: 'var(--cxl-fontSize)'
			},
			caption: { fontSize: 16, letterSpacing: 0.4 },
			h1: { fontWeight: 300, fontSize: 16, letterSpacing: -1.5 },
			h2: { fontWeight: 300, fontSize: 16, letterSpacing: -0.5 },
			h3: { fontSize: 16 },
			h4: { fontSize: 16, letterSpacing: 0.25 },
			h5: { fontSize: 16 },
			h6: { fontSize: 16, fontWeight: 500, letterSpacing: 0.15 },
			title: { fontSize: 16, fontWeight: 700 },
			subtitle: { fontSize: 16, lineHeight: 22, letterSpacing: 0.15 },
			subtitle2: { fontSize: 16, lineHeight: 18, letterSpacing: 0.1 },
			button: { fontSize: 16, textTransform: 'uppercase' }
		}
	});

	extendStyles('cxl-button', {
		$: {
			backgroundColor: 'primary',
			color: 'onPrimary',
			borderRadius: 0
		}
	});

	extendComponent('cxl-checkbox', {
		template: `
<span &=".focusCircle .focusCirclePrimary"></span>
<x &=".cont">[<cxl-icon &="=indeterminate:#setIcon .box"></cxl-icon>]</x>
<span &="content"></span>
		`,
		styles: {
			cont: { whiteSpace: 'nowrap' },
			box: { border: 0, marginRight: 0, width: 'auto' },
			box$checked: { backgroundColor: 'transparent', color: 'onSurface' },
			box$indeterminate: {
				backgroundColor: 'transparent',
				color: 'onSurface'
			},
			focusCircle: { left: 6 }
		}
	});

	extendStyles('cxl-progress', {
		$: { height: 16 },
		indicator: { height: 16 }
	});

	extendStyles('cxl-menu', {
		$: { borderColor: 'divider', borderStyle: 'solid', borderWidth: 1 }
	});

	extendStyles('cxl-dialog', {
		content: {
			borderStyle: 'solid',
			borderWidth: '16px 8px 16px 8px',
			borderColor: 'primary'
		}
	});

	extendComponent('cxl-radio', {
		template: `
<x &=".focusCircle .focusCirclePrimary"></x>
<x &=".cont">(<x &=".circle"></x>)</x>
<span &=".content content"></span>
		`,
		styles: {
			cont: { whiteSpace: 'nowrap' },
			focusCircle: { left: 4 }
		}
	});

	extendStyles('cxl-slider', {
		knob: { borderRadius: 0 }
	});

	extendStyles('cxl-switch', {
		background: { borderRadius: 0 },
		knob: { borderRadius: 0 }
	});

	extendStyles('cxl-field-base', {
		$: { color: 'divider' },
		$outline: { borderRadius: 0 }
	});

	extendStyles('cxl-icon', {
		$round: { border: 0 }
	});
})(this.cxl);
