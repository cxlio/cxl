import type { DocGen, File } from './index.js';
import { Documentation, Node, Kind, Flags, Output } from '@cxl/dts';
import { /*getHref, SignatureText,*/ hasOwnPage, Type } from './render-html';

export interface SummaryJson {
	index: Summary[];
}

export interface Summary {
	//sig: string;
	id?: number;
	name?: string;
	kind: Kind;
	flags?: Flags;
	docs?: Documentation;
	//href?: string;
	parameters?: Summary[];
	children?: Summary[];
	//typeKind?: Kind;
	type?: string | Summary | number;
	resolvedType?: string | Summary;
}

const REMOVE = /<\/?[^>]+>/g;

function removeHtml(str: string) {
	return str.replace(REMOVE, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
}

function sortByName(a: Summary, b: Summary) {
	return (a.name ?? '') < (b.name ?? '') ? -1 : 1;
}

function renderType(node: Node): string | Summary {
	if (node.kind === Kind.Reference && node.type) node = node.type;
	if (
		node.kind !== Kind.ObjectType &&
		node.kind !== Kind.FunctionType &&
		node.kind !== Kind.Function &&
		node.kind !== Kind.Method &&
		node.kind !== Kind.TypeUnion
	)
		return removeHtml(Type(node));

	return renderNode(node);
}

function renderNode(node: Node): Summary {
	const children = node.children?.length
		? node.children.map(renderNode).sort(sortByName)
		: undefined;
	const parameters = node.parameters?.length
		? node.parameters.map(renderNode)
		: undefined;
	const typeN = node.type;
	let type: string | number | Summary | undefined;

	if (typeN) {
		if (typeN.kind === Kind.Reference && typeN.type?.id !== undefined)
			type = typeN.type.id;
		else
			type =
				node.kind === Kind.Parameter
					? removeHtml(Type(node.type))
					: node.type && renderType(node.type);
	}

	/*const typeKind =
		node.type?.kind === Kind.Reference && node.type.type
			? node.type.type.kind
			: node.type?.kind;*/
	const resolvedType = node.resolvedType && renderType(node.resolvedType);

	return {
		//sig: removeHtml(SignatureText(node)),
		id: node.id,
		name: node.name || undefined,
		parameters,
		kind: node.kind,
		flags: node.flags || undefined,
		docs: node.docs,
		//href: getHref(node) || undefined,
		//typeKind,
		type,
		resolvedType:
			resolvedType === type /*||
			((resolvedType as Summary)?.sig &&
				(type as Summary)?.sig &&
				(resolvedType as Summary)?.sig === (type as Summary)?.sig)*/
				? undefined
				: resolvedType,
		children,
	};
}

export function render(app: DocGen, output: Output): File[] {
	const index = Object.values(output.index)
		.filter(p => hasOwnPage(p) || p.kind === Kind.TypeAlias)
		.map<Summary>(renderNode)
		.sort(sortByName);

	const version = app.modulePackage?.version;

	return [
		{
			name: version ? `${version}/summary.json` : 'summary.json',
			content: JSON.stringify({
				index,
			}),
		},
	];
}
