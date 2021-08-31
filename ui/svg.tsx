///<amd-module name="@cxl/ui/svg.js"/>
export type SVGChildren = Path;

function renderChildren(el: SVGElement, children: any) {
	if (Array.isArray(children))
		for (const child of children) el.appendChild(child);
	else el.appendChild(children);
}

export interface SvgNode {
	style?: string;
	className?: string;
}

export interface Path extends SvgNode {
	fill?: string;
	className?: string;
	d?: string;
}

export interface Circle extends SvgNode {
	cx: string;
	cy: string;
	r: string;
}

export function Svg(p: {
	viewBox: string;
	className?: string;
	width?: number;
	height?: number;
	alt?: string;
	children?: Node | Node[];
}) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	el.style.fill = 'currentColor';
	el.style.verticalAlign = 'middle';
	el.setAttribute('viewBox', p.viewBox);
	if (p.width !== undefined) el.setAttribute('width', p.width.toString());
	if (p.height !== undefined) el.setAttribute('height', p.height.toString());
	if (p.className !== undefined) el.setAttribute('class', p.className);
	if (p.alt !== undefined) el.setAttribute('alt', p.alt);
	if (p.children) renderChildren(el, p.children);
	return el;
}

export function Path(p: Path) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	if (p.className !== undefined) el.setAttribute('class', p.className);
	if (p.fill !== undefined) el.setAttribute('fill', p.fill);
	if (p.d !== undefined) el.setAttribute('d', p.d);
	if (p.style !== undefined) el.setAttribute('style', p.style);
	return el;
}

export function Circle(p: Circle) {
	const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
	if (p.className !== undefined) el.setAttribute('class', p.className);
	if (p.style !== undefined) el.setAttribute('style', p.style);
	el.setAttribute('cx', p.cx);
	el.setAttribute('cy', p.cy);
	el.setAttribute('r', p.r);
	return el;
}
