///<amd-module name="@cxl/css/color.js"/>
import { RGBA, rgba } from './index.js';

export function stringToRgba(str: string): RGBA {
	if (str.startsWith('#'))
		return rgba(
			parseInt(str.slice(1, 3), 16),
			parseInt(str.slice(3, 5), 16),
			parseInt(str.slice(5, 7), 16)
		);
	throw 'Invalid Color';
}

export function luminance({ r, g, b }: RGBA): number {
	return (0.212655 * r + 0.715158 * g + 0.072187 * b) / 255;
}

export function brightness({ r, g, b }: RGBA): number {
	return Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b) / 255;
}

export function blend(src: RGBA, dest: RGBA): RGBA {
	const a = 1 - (1 - dest.a) * (1 - src.a),
		r =
			a === 0
				? 0
				: (dest.r * dest.a) / a + (src.r * src.a * (1 - dest.a)) / a,
		g =
			a === 0
				? 0
				: (dest.g * dest.a) / a + (src.g * src.a * (1 - dest.a)) / a,
		b =
			a === 0
				? 0
				: (dest.b * dest.a) / a + (src.b * src.a * (1 - dest.a)) / a;

	return rgba(r, g, b, a);
}

export function multiply(color: RGBA, p: number): RGBA {
	return rgba(color.r * p, color.g * p, color.b * p, color.a);
}
