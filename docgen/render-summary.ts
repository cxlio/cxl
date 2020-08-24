import type { DocGen, File } from './index.js';
import { Node, Kind, Flags, Output } from '../dts/index.js';
import { getHref } from './render-html';

function declarationFilter(node: Node) {
	return (
		node.flags & Flags.Export &&
		!(node.kind === Kind.Interface && node.flags & Flags.DeclarationMerge)
	);
}

export function render(_app: DocGen, output: Output): File[] {
	const index = Object.values(output.index)
		.filter(declarationFilter)
		.map(node => ({
			name: node.name,
			kind: node.kind,
			flags: node.flags,
			docs: node.docs,
			href: getHref(node),
		}));

	return [
		{
			name: 'summary.json',
			content: JSON.stringify(index),
		},
	];
}
