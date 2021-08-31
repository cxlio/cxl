import { rgba } from './index.js';

export function luminance() {
	return (0.2126 * this.r + 0.7152 * this.g + 0.0722 * this.b) / 255;
}

export function blend(src: RGBA, rgba: RGBA) {
	const a = 1 - (1 - rgba.a) * (1 - src.a),
		r =
			a === 0
				? 0
				: (rgba.r * rgba.a) / a + (src.r * src.a * (1 - rgba.a)) / a,
		g =
			a === 0
				? 0
				: (rgba.g * rgba.a) / a + (src.g * src.a * (1 - rgba.a)) / a,
		b =
			a === 0
				? 0
				: (rgba.b * rgba.a) / a + (src.b * src.a * (1 - rgba.a)) / a;
	return rgba(r, g, b, a);
}

export function multiply(color: RGBA, p: number) {
	return new RGBA(color.r * p, color.g * p, color.b * p, color.a);
}
