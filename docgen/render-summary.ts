import type { DocGen, File } from './index.js';
import { Documentation, Node, Kind, Flags, Output } from '@cxl/dts';
import { /*getHref, SignatureText,*/ hasOwnPage, Type } from './render-html';

export interface SummaryJson {
	index: Summary[];
}

export interface Summary {
	id?: number;
	name?: string;
	kind: Kind;
	flags?: Flags;
	docs?: Documentation;
	parameters?: Summary[];
	children?: Summary[];
	type?: string | Summary | number;
	typeP?: Summary[];
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

	if (node.kind === Kind.ClassType) {
		const children: Summary[] = [];
		node.children?.forEach(child => {
			if (child.kind !== Kind.Reference) return;
			children.push({
				kind: Kind.Reference,
				type: child.type?.id,
			});
		});
		return {
			kind: node.kind,
			children,
			type: node.type?.id,
		};
	}

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
	const typeP = node.typeParameters?.length
		? node.typeParameters.map(renderNode)
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

	const resolvedType = node.resolvedType && renderType(node.resolvedType);

	return {
		id: node.id,
		name: node.name || undefined,
		parameters,
		kind: node.kind,
		flags: node.flags || undefined,
		docs: node.docs,
		type,
		typeP,
		resolvedType: resolvedType === type ? undefined : resolvedType,
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
