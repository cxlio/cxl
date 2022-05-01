import type { DocGen, File } from './index.js';
import { Documentation, Node, Kind, Flags, Output } from '@cxl/dts';
import { getHref, SignatureText, hasOwnPage } from './render-html';
//import { FlagsMap, KindMap, GroupTitle } from './localization.js';

export interface Summary {
	sig: string;
	name: string;
	kind: Kind;
	flags: Flags;
	docs?: Documentation;
	href: string;
	children?: Summary[];
}

/*function declarationFilter(node: Node) {
	console.log(node);
	return (
		node.flags & Flags.Export ||
		node.flags &
			Flags.DeclarationMerge 
	);
}*/

const REMOVE = /<\/?[^>]+>/g;

function removeHtml(str: string) {
	return str.replace(REMOVE, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
}

function sortByName(a: Node, b: Node) {
	return a.name < b.name ? -1 : 1;
}

function renderNode(node: Node): Summary {
	const children = node.children?.length
		? node.children?.sort(sortByName).map(renderNode)
		: undefined;
	return {
		sig: removeHtml(SignatureText(node)),
		name: node.name,
		kind: node.kind,
		flags: node.flags,
		docs: node.docs,
		href: getHref(node),
		children,
	};
}

export function render(_app: DocGen, output: Output): File[] {
	/*const content = {
		KindMap,
		GroupTitle,
		FlagsMap,
	};*/
	const index = Object.values(output.index)
		.filter(hasOwnPage)
		.sort(sortByName)
		.map<Summary>(renderNode);

	return [
		{
			name: 'summary.json',
			content: JSON.stringify({
				index,
			}),
		},
	];
}
