///<amd-module name="@cxl/tsx-svg"/>
export type SVGChildren = Path;

export interface Path {
	fill?: string;
	className?: string;
	d?: string;
}

function renderChildren(el: SVGElement, children: any) {
	if (Array.isArray(children))
		for (const child of children) el.appendChild(child);
	else el.appendChild(children);
}

export function Svg(p: {
	viewBox: string;
	className?: string;
	width?: number;
	height?: number;
	alt?: string;
	children: Node | Node[];
}) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	el.setAttribute('viewBox', p.viewBox);
	if (p.width !== undefined) el.setAttribute('width', p.width.toString());
	if (p.height !== undefined) el.setAttribute('height', p.height.toString());
	if (p.className !== undefined) el.setAttribute('class', p.className);
	renderChildren(el, p.children);
	return el;
}

export function Path(p: Path) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	if (p.className !== undefined) el.setAttribute('class', p.className);
	if (p.fill !== undefined) el.setAttribute('fill', p.fill);
	if (p.d !== undefined) el.setAttribute('d', p.d);
	return el;
}
