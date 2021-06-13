import { theme } from '@cxl/ui/theme.js';
import { rgba } from '@cxl/css';

Object.assign(theme.colors, {
	//primary: rgba(0x29, 0xb6, 0xf6),
	primary: rgba(0x03, 0xa9, 0xf4),
	// primary: rgba(0x44, 0x8a, 0xff),
	//onPrimary: rgba(0, 0, 0),
	onPrimary: rgba(0xff, 0xff, 0xff),
	primaryLight: rgba(0x03, 0xa9, 0xf4, 0.24),
	onPrimaryLight: rgba(0xe1, 0xf5, 0xfe),
	secondary: rgba(249, 130, 108),
	surface: rgba(34, 39, 46),
	background: rgba(34, 39, 46),
	onBackground: rgba(0xff, 0xff, 0xff),
	onSurface: rgba(173, 186, 199),
	onSecondary: rgba(0, 0, 0),
	error: rgba(0xcf, 0x66, 0x79),
	link: rgba(83, 155, 245),
	divider: rgba(0xff, 0xff, 0xff, 0.48),
	get onSurface8() {
		return this.onSurface.alpha(0.12);
	},
});

theme.imports = [
	'https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@300,400,500&display=swap',
];
