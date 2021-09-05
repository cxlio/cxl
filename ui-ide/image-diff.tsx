///<amd-module name="@cxl/ui-ide/image-diff.js"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { css } from '@cxl/ui/theme.js';
import { dom } from '@cxl/tsx';
import { merge } from '@cxl/rx';
import '@cxl/template';

export async function loadImage(src: string) {
	const result = new Image();
	result.src = src;
	await result.decode();
	return result;
}

export async function imageData(srcA: string) {
	const A = await loadImage(srcA);
	const canvasEl = (<canvas />) as HTMLCanvasElement;
	const ctx = canvasEl.getContext('2d');
	if (!ctx) throw new Error('Could not create context');

	const w = (canvasEl.width = A.width);
	const h = (canvasEl.height = A.height);
	ctx.drawImage(A, 0, 0);
	return ctx.getImageData(0, 0, w, h);
}

export function image(src: string) {
	const result = new Image();
	result.src = src;
	return result;
}

export async function imageDiff(srcA: string, srcB: string) {
	const [A, B] = await Promise.all([imageData(srcA), imageData(srcB)]);
	const w = Math.max(A.width, B.width);
	const h = Math.max(A.height, B.height);
	const size = w * h * 4;

	const diff = new Uint8ClampedArray(size);

	for (let i = 0; i < size; i += 4) {
		const match =
			A.data[i] === B.data[i] &&
			A.data[i + 1] === B.data[i + 1] &&
			A.data[i + 2] === B.data[i + 2];
		diff[i] = diff[i + 3] = match ? 0 : 0xff;
	}

	return { imageA: A, imageB: B, diff: new ImageData(diff, w, h) };
}

@Augment<ImageDiff>(
	'cxl-image-diff',
	css({
		$: {
			display: 'inline-block',
			position: 'relative',
			fontSize: 0,
		},
		absolute: { position: 'absolute', top: 0, left: 0 },
	}),
	$ => {
		const C = document.createElement('canvas');
		C.className = 'absolute';
		const A = (<img className="absolute" />) as HTMLImageElement;
		const ctx = C.getContext('2d');

		async function render() {
			if (!ctx) throw new Error('No rendering context');
			if (!$.src1 || !$.src2) return;

			A.src = $.src2;
			$.style.backgroundImage = `url(${$.src1})`;
			const { diff } = await imageDiff($.src1, $.src2);
			$.style.width = `${(C.width = diff.width)}px`;
			$.style.height = `${(C.height = diff.height)}px`;
			ctx.putImageData(diff, 0, 0);
		}

		$.bind(merge(get($, 'src1'), get($, 'src2')).raf(render));

		return (
			<>
				{A}
				{C}
			</>
		);
	}
)
export class ImageDiff extends Component {
	@Attribute()
	src1?: string;

	@Attribute()
	src2?: string;
}
