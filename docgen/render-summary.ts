import type { DocGen, File } from './index.js';
import { Documentation, Node, Kind, Flags, Output } from '@cxl/dts';
import { getHref } from './render-html';

export interface Summary {
	name: string;
	kind: Kind;
	flags: Flags;
	docs?: Documentation;
	href: string;
}

function declarationFilter(node: Node) {
	return (
		node.flags & Flags.Export ||
		node.flags &
			Flags.DeclarationMerge /*&&
		!(node.kind === Kind.Interface && node.flags & Flags.DeclarationMerge)*/
	);
}

export function render(_app: DocGen, output: Output): File[] {
	const index = Object.values(output.index)
		.filter(declarationFilter)
		.map<Summary>(node => ({
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
