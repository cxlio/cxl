import { Output, Node, Kind, Flags, Source } from '../dts';
import type { DocGen, File } from './index.js';
import { kindToString, groupTitle, translate } from './localization';
import { relative } from 'path';

let application: DocGen;
let header: string;

const ENTITIES_REGEX = /[&<]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
};

function escape(str: string) {
	return str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e]);
}

function TypeArguments(types?: Node[]): string {
	return types
		? '&lt;' +
				types
					.map(
						t =>
							Type(t) +
							(t.kind !== Kind.Reference && t.type
								? ` extends ${Type(t.type)}`
								: '')
					)
					.join(', ') +
				'&gt;'
		: '';
}

function ConditionalType(node: Node) {
	if (!node.children) return '';

	const [check, extend, trueVal, falseVal] = node.children;
	return `${Type(check)} extends ${Type(extend)} ? ${Type(trueVal)} : ${Type(
		falseVal
	)}`;
}

function ClassType(node: Node) {
	let extendStr: string[] = [];
	let implementStr: string[] = [];
	node.children?.forEach(child => {
		const link = Type(child);
		const type = child.type;
		type && type.kind === Kind.Class
			? extendStr.push(link)
			: implementStr.push(link);
	});
	return `<cxl-t h6 inline>${
		(extendStr.length ? `extends ${extendStr.join(', ')}` : '') +
		(implementStr.length ? `implements ${implementStr.join(', ')}` : '')
	}</cxl-t>`;
}

function FunctionType(node: Node) {
	const { parameters, typeParameters, type } = node;
	return `${SignatureName(node)}${TypeArguments(
		typeParameters
	)}${SignatureParameters(parameters)} => ${Type(type)}`;
}

function Property(node: Node) {
	return `${node.name}: ${Type(node.type)}`;
}

function ObjectType(node: Node) {
	return `{ ${node.children?.map(Property).join(', ') || ''} }`;
}

function Type(type?: Node): string {
	if (!type) return '';

	switch (type.kind) {
		case Kind.ClassType:
			return ClassType(type);
		case Kind.Infer:
			return `infer ${Type(type.type)}`;
		case Kind.Parenthesized:
			return `(${Type(type.type)})`;
		case Kind.ConditionalType:
			return ConditionalType(type);
		case Kind.IndexedType:
			if (!type.children) throw new Error('Invalid node');
			return `${Type(type.children[0])}[${Type(type.children[1])}]`;
		case Kind.TypeUnion:
			return type.children?.map(Type).join(' | ') || '';
		case Kind.Array:
			return `${Type(type.type)}[]`;
		case Kind.Reference:
			return `${Link(type)}${TypeArguments(type.typeParameters)}`;
		case Kind.FunctionType:
		case Kind.Function:
		case Kind.Method:
			return FunctionType(type);
		case Kind.BaseType:
			return type.name;
		case Kind.ObjectType:
			return ObjectType(type);
		case Kind.Literal:
		case Kind.TypeParameter:
			return type.name;
	}

	console.log(type);
	return Signature(type);
}

function SignatureValue(val?: string) {
	if (val && val.length > 50) return ` = <pre>${escape(val)}</pre>`;
	return val ? ` = ${escape(val)}` : '';
}

function Parameter(p: Node) {
	const name = `${p.flags & Flags.Rest ? '...' : ''}${p.name}${
		p.flags & Flags.Optional ? '?' : ''
	}`;
	return `${name}: ${Type(p.type)}`;
}

function SignatureParameters(parameters?: Node[]) {
	if (!parameters) return '';

	return `(${parameters.map(Parameter).join(', ')})`;
}

function Chip(label: string) {
	return `<cxl-chip little primary>${label}</cxl-chip> `;
}

function NodeChips({ flags }: Node) {
	return (
		(flags & Flags.Static ? Chip('static') : '') +
		(flags & Flags.Protected ? Chip('protected') : '') +
		(flags & Flags.Abstract ? Chip('abstract') : '') +
		(flags & Flags.Overload ? Chip('overload') : '') +
		(flags & Flags.Private ? Chip('private') : '')
	);
}

function SignatureType({ type, kind, name }: Node) {
	if (!type) return '';
	if (
		kind === Kind.Class ||
		kind === Kind.Interface ||
		kind === Kind.Component
	)
		return ` ${Type(type)}`;
	const typeColon = kind === Kind.TypeAlias ? ' = ' : name ? ': ' : ' => ';
	return `${typeColon}${Type(type)}`;
}

function SignatureName({ flags, name }: Node) {
	return (name ? escape(name) : '') + (flags & Flags.Optional ? '?' : '');
}

function IndexSignature(node: Node) {
	const params = node.parameters?.map(Signature).join('') || '';
	return `[${params}]: ${Type(node.type)}`;
}

/**
 * Return Node Signature
 */
function Signature(node: Node): string {
	if (node.kind === Kind.Module) return escape(node.name);
	if (node.kind === Kind.IndexSignature) return IndexSignature(node);

	const { value, parameters, typeParameters } = node;

	return `${NodeChips(node)}${SignatureName(node)}${TypeArguments(
		typeParameters
	)}${SignatureParameters(parameters)}${SignatureType(node)}${SignatureValue(
		value
	)}`;
}

function Anchor(id: number) {
	const anchor = `s${id}`;
	return `<a name="${anchor}"></a>`;
}

function getSourceLink(src: Source) {
	const url = application.repository;
	if (url) {
		if (url.startsWith('https://github.com')) {
			const pos = src.sourceFile.getLineAndCharacterOfPosition(src.index);
			return `${url}/${relative(
				process.cwd(),
				src.sourceFile.fileName
			)}#L${pos.line}`;
		}
	}

	return `#`;
}

function getSource(source: Source) {
	return `<a title="See Source" style="float:right;color:var(--cxl-onSurface87)" href="${getSourceLink(
		source
	)}"><cxl-icon icon="code"></cxl-icon></a>`;
}

function Source({ source }: Node) {
	return source && application.repository
		? Array.isArray(source)
			? source.map(getSource).join('')
			: getSource(source)
		: '';
}

function ParameterTable(rows: string[][]) {
	return `<cxl-table>
		<cxl-tr><cxl-th>Name</cxl-th><cxl-th style="width:100%">Description</cxl-th></cxl-tr>
		${rows
			.map(
				cols =>
					`<cxl-tr>${cols
						.map(c => `<cxl-td>${c}</cxl-td>`)
						.join('')}</cxl-tr>`
			)
			.join('')}
	</cxl-table>`;
}

function Example(node: Node, example: string): string {
	const tagName = node.docs?.tagName;

	return node.kind === Kind.Component && tagName
		? `<cxl-docs-demo component="${tagName}"><!-- ${example} --></cxl-docs-demo>`
		: `<pre>${example}</pre>`;
}

function Documentation(node: Node) {
	const docs = node.docs;

	if (!docs || !docs.content) return '';

	return docs.content
		.map(doc => {
			if (doc.tag === 'example')
				return `<cxl-t h5>Demo</cxl-t>${Example(node, doc.value)}`;
			if (doc.tag === 'return')
				return `<cxl-t h5>Returns</cxl-t><p>${doc.value}</p>`;
			return doc.value;
		})
		.join('');
}

function ModuleDocumentation(node: Node) {
	return Documentation(node);
}

function ParameterDocumentation(node: Node) {
	return Documentation(node);
}

function InheritedFrom(symbol?: Node) {
	return symbol
		? `<p><cxl-t subtitle2>Inherited From: ${Link(symbol)}</cxl-t></p>`
		: '';
}

function MemberBody(c: Node) {
	let result = `<cxl-t style="font-weight: 500" code subtitle>${Signature(
		c
	)}</cxl-t>${InheritedFrom()}`;
	let returns = '';

	if (c.docs) result += Documentation(c);

	if (c.parameters?.length)
		result +=
			'<br/><cxl-t subtitle2>Parameters</cxl-t>' +
			ParameterTable(
				c.parameters.map(p => [p.name, ParameterDocumentation(p)])
			) +
			'<br/>';

	if (returns) result += `<cxl-t subtitle2>Returns</cxl-t><p>${returns}</p>`;

	return result;
}

function MemberCard(c: Node) {
	return `${c.id ? Anchor(c.id) : ''}<cxl-card><cxl-c pad16>
		${Source(c)}${MemberBody(c)}
		</cxl-c></cxl-card>`;
}

function ExtendedBy(extendedBy?: Node[]) {
	return extendedBy
		? `<cxl-t subtitle2>Extended By</cxl-t><ul>${extendedBy
				.map(ref => (ref.name ? `<li>${Link(ref)}</li>` : ''))
				.join('')}</ul>`
		: '';
}

function Link(node: Node): string {
	let name = node.name ? escape(node.name) : '(Unknown)';
	if (node.type) {
		if (node.kind === Kind.Reference) node = node.type;
		else if (node.kind === Kind.Export) return Link(node.type);
	}

	return node.id ? `<a href="${getHref(node)}">${name}</a>` : name;
}

function GroupIndex(kind: Kind, children: string[]) {
	return `<cxl-t h6>${groupTitle(kind)}
		</cxl-t><br/><cxl-grid>${children.join('')}</cxl-grid>`;
}

function getNodeCoef(a: Node) {
	return (
		-(a.flags & Flags.Static) +
		(a.kind === Kind.Module &&
		(a.name === 'index.ts' || a.name === 'index.tsx')
			? -10
			: 0)
	);
}

function sortNode(a: Node, b: Node) {
	const coef = getNodeCoef(a) - getNodeCoef(b);
	return coef + (a.name > b.name ? 1 : -1);
}

function ModuleTitle(node: Node) {
	const chips =
		`<span style="float:right">` +
		(node.kind === Kind.Class ? Chip('class') : '') +
		(node.kind === Kind.Interface ? Chip('interface') : '') +
		(node.kind === Kind.Component ? Chip('component') : '') +
		(node.kind === Kind.Enum ? Chip('enum') : '') +
		`</span>`;
	return chips + Signature(node);
}

function getImportUrl(source: Source) {
	const pkg = application.modulePackage?.name;
	const moduleName = source.name.replace(/\.tsx?$/, '');

	return `${pkg}${moduleName === 'index' ? '' : `/${moduleName}`}`;
}

function ImportStatement(node: Node) {
	if (node.kind === Kind.Module || !application.modulePackage) return '';
	const source = Array.isArray(node.source) ? node.source[0] : node.source;
	if (!source) return '';
	const importUrl = getImportUrl(source);

	return `<cxl-t h5>Import</cxl-t><pre>import { ${node.name} } from '${importUrl}';</pre>`;
}

function Members(node: Node) {
	const { children } = node;
	const index: Record<number, string[]> = {};
	const groupBody: Record<number, string[]> = {};
	const groups: Kind[] = [];

	if (children)
		children.sort(sortNode).forEach(c => {
			if (node.kind === Kind.Module && !declarationFilter(c)) return '';
			const groupKind =
				(c.kind === Kind.Export && c.type?.type?.kind) || c.kind;

			if (!index[groupKind]) {
				groupBody[groupKind] = [];
				index[groupKind] = [];
				groups.push(groupKind);
			}

			if (!(c.flags & Flags.Overload)) {
				const chips =
					c.flags & Flags.Static
						? `<cxl-chip little primary>static</cxl-chip>`
						: '';
				index[groupKind].push(
					`<cxl-c sm4 lg3>${chips} ${Link(c)}</cxl-c>`
				);
			}
			if (!hasOwnPage(c) && c.kind !== Kind.Export)
				groupBody[groupKind].push(MemberCard(c));
		});

	const sortedGroups = groups.sort((a, b) =>
		kindToString(a) > kindToString(b) ? 1 : -1
	);
	const importStr = ImportStatement(node);

	return groups.length
		? `<cxl-t h4>${translate(
				node.kind === Kind.Module ? 'Members' : 'API'
		  )}</cxl-t>${importStr}` +
				(node.kind !== Kind.Module ? `<cxl-t h5>Members</cxl-t>` : '') +
				sortedGroups
					.map(kind => GroupIndex(kind, index[kind]))
					.join('<br/>') +
				'<br/>' +
				sortedGroups
					.filter(group => groupBody[group].length)
					.map(
						group =>
							`<br /><cxl-t h5>${groupTitle(
								group
							)}</cxl-t>${groupBody[group].join('<br />')}`
					)
					.join('<br />')
		: '';
}

function ModuleBody(json: Node) {
	return (
		`<cxl-page><cxl-t h3>${ModuleTitle(json)}</cxl-t>` +
		ExtendedBy(json.extendedBy) +
		ModuleDocumentation(json) +
		Members(json) +
		'</cxl-page>'
	);
}

function getHref(node: Node): string {
	if (hasOwnPage(node)) return getPageName(node);

	return (
		(node.parent ? getHref(node.parent) : '') +
		(node.id ? '#s' + node.id.toString() : '')
	);
}

function declarationFilter(node: Node) {
	return (
		node.flags & Flags.Export &&
		!(node.kind === Kind.Interface && node.flags & Flags.DeclarationMerge)
	);
}

const IconMap: Record<number, string> = {
	[Kind.Constant]: 'K',
	[Kind.Variable]: 'V',
	[Kind.Class]: 'C',
	[Kind.Function]: 'F',
	[Kind.Interface]: 'I',
	[Kind.TypeAlias]: 'T',
	[Kind.Component]: 'C',
};

function NodeIcon(node: Node) {
	const icon = IconMap[node.kind] || '?';
	return `<cxl-badge style="margin-right:12px">${icon}</cxl-badge>`;
}

function ModuleNavbar(node: Node) {
	const moduleName = node.name.match(/index\.tsx?/) ? 'Index' : node.name;
	return (
		`<cxl-item href="${getHref(node)}"><i>${moduleName}</i></cxl-item>` +
		node.children
			?.sort(sortNode)
			.map(c =>
				declarationFilter(c) &&
				!(c.flags & Flags.Overload) &&
				c.kind !== Kind.Export
					? `<cxl-item href="${getHref(c)}">${NodeIcon(c)}${
							c.name
					  }</cxl-item>`
					: ''
			)
			.join('')
	);
}

function Navbar(pkg: any, out: Output) {
	return `<cxl-navbar><cxl-c pad16><cxl-t h6>${pkg.name} <small>${
		pkg?.version || ''
	}</small></cxl-t></cxl-c>
		<cxl-hr></cxl-hr>${out.modules.sort(sortNode).map(ModuleNavbar).join('')}
		</cxl-navbar>`;
}

function ModuleHeader(_p: Node) {
	return '';
}

function ModuleFooter(_p: Node) {
	return `</cxl-application>`;
}

function Header(module: Output) {
	const pkg = application.modulePackage;
	const SCRIPTS = application.debug
		? `<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui-ts/index.js');require('../../dist/ui-ts/icons.js');require('../../dist/docgen/runtime.js')</script>`
		: `<script src="runtime.bundle.min.js"></script>`;

	return `<!DOCTYPE html>
	<head><meta name="description" content="Documentation for ${
		pkg.name
	}" />${SCRIPTS}</head>
	<style>cxl-td > :first-child { margin-top: 0 } cxl-td > :last-child { margin-bottom: 0 };</style>
	<cxl-application><title>${pkg.name}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(pkg, module)}
	<a href="index.html" style="text-decoration:none"><cxl-appbar-title>${
		pkg.name
	}</cxl-appbar-title></a></cxl-appbar>`;
}

function getPageName(page: Node) {
	return page.kind === Kind.Module
		? page.name.replace(/.tsx?$/, '.html')
		: `${page.name}.${page.id}.html`;
}

function Page(p: Node) {
	return {
		name: getPageName(p),
		node: p,
		content: header + ModuleHeader(p) + ModuleBody(p) + ModuleFooter(p),
	};
}

function hasOwnPage(node: Node) {
	return (
		node.kind === Kind.Class ||
		node.kind === Kind.Interface ||
		node.kind === Kind.Module ||
		node.kind === Kind.Enum ||
		node.kind === Kind.Component
	);
}

function Module(module: Node) {
	const result = module.children?.filter(hasOwnPage).map(Page);
	return result ? result.concat(Page(module)) : [Page(module)];
}

export function render(app: DocGen, output: Output): File[] {
	application = app;
	header = Header(output);
	return output.modules.flatMap(Module);
}
