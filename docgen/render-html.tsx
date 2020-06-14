import { Output, Node, Kind, Flags, Source } from '../dts';
import type { DocGen, File } from './index.js';
import { kindToString } from './localization';
import { relative } from 'path';

let application: DocGen;
let header: string;
const ENTITIES_REGEX = /[&<]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
};
// const anchors: Record<number, string> = {};
// let currentPage: Node;

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
	return (
		(extendStr.length ? `extends ${extendStr.join(', ')}` : '') +
		(implementStr.length ? `implements ${implementStr.join(', ')}` : '')
	);
}

function Type(type?: Node): string {
	if (!type) return '';

	if (type.kind === Kind.ClassType) return ClassType(type);
	if (type.kind === Kind.Infer) return `infer ${Type(type.type)}`;
	if (type.kind === Kind.Parenthesized) return `(${Type(type.type)})`;
	if (type.kind === Kind.ConditionalType) return ConditionalType(type);
	if (type.kind === Kind.IndexedType && type.children)
		return `${Type(type.children[0])}[${Type(type.children[1])}`;

	if (type.kind === Kind.TypeUnion)
		return type.children?.map(Type).join(' | ') || '';

	if (type.kind === Kind.Array) return `${Type(type.type)}[]`;
	if (type.kind === Kind.Reference)
		return `${Link(type)}${TypeArguments(type.typeParameters)}`;

	return Signature(type);
}

function SignatureValue(val?: string) {
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

	return `<b>(</b>${parameters.map(Parameter).join(', ')}<b>)</b>`;
}

function Chip(label: string) {
	return `<cxl-chip little primary>${label}</cxl-chip> `;
}

function NodeChips({ flags }: Node) {
	return (
		(flags & Flags.Protected ? Chip('protected') : '') +
		(flags & Flags.Abstract ? Chip('abstract') : '') +
		(flags & Flags.Overload ? Chip('overload') : '')
	);
}

function SignatureType({ type, kind, name }: Node) {
	if (!type) return '';
	if (kind === Kind.Class || kind === Kind.Interface) return ` ${Type(type)}`;
	const typeColon = kind === Kind.TypeAlias ? ' = ' : name ? ': ' : ' => ';
	return `${typeColon}${Type(type)}`;
}

function SignatureName({ flags, name }: Node) {
	return (name ? escape(name) : '') + (flags & Flags.Optional ? '?' : '');
}

/**
 * Return Node Signature
 */
function Signature(node: Node): string {
	if (node.kind === Kind.Module) return escape(node.name);

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

function Documentation(node: Node) {
	return (
		node.docs
			?.map(doc => (doc.name === 'comment' ? `<p>${doc.value}</p>` : ''))
			.join('') || ''
	);
}

function ParameterDocumentation(node: Node) {
	return (
		node.docs
			?.map(doc => (doc.name === 'param' ? `<p>${doc.value}</p>` : ''))
			.join('') || ''
	);
}

function InheritedFrom(symbol?: Node) {
	return symbol
		? `<p><cxl-t subtitle2>Inherited From: ${Link(symbol)}</cxl-t></p>`
		: '';
}

function MemberBody(c: Node) {
	let result = `<cxl-t subtitle>${Signature(c)}</cxl-t>${InheritedFrom()}`;
	let returns = '';

	if (c.docs) result += Documentation(c);

	if (c.parameters)
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
	if (node.type && node.kind === Kind.Reference) node = node.type;
	return node.id ? `<a href="${getHref(node)}">${name}</a>` : name;
}

function GroupIndex(kind: Kind, children: string[]) {
	return `<cxl-c pad16><cxl-t h5>${kindToString(kind)}
		</cxl-t><br/><cxl-grid>${children.join('')}</cxl-grid></cxl-c>`;
}

function sortNode(a: Node, b: Node) {
	return a.name > b.name ? 1 : -1;
}

function ModuleTitle(node: Node) {
	const chips =
		(node.kind === Kind.Class ? Chip('class') : '') +
		(node.kind === Kind.Interface ? Chip('interface') : '') +
		(node.kind === Kind.Enum ? Chip('enum') : '');
	return Signature(node) + ' ' + chips;
}

function ModuleBody(json: Node) {
	const { children } = json;
	const index: Record<number, string[]> = {};
	const groupBody: Record<number, string[]> = {};
	const groups: Kind[] = [];

	if (children)
		children.sort(sortNode).forEach(c => {
			if (json.kind === Kind.Module && !declarationFilter(c)) return '';
			const groupKind = c.kind;

			if (!index[groupKind]) {
				groupBody[groupKind] = [];
				index[groupKind] = [];
				groups.push(groupKind);
			}

			if (!(c.flags & Flags.Overload))
				index[groupKind].push(`<cxl-c sm4 lg3>${Link(c)}</cxl-c>`);
			if (!hasOwnPage(c)) groupBody[groupKind].push(MemberCard(c));
		});

	const title = ModuleTitle(json);

	return (
		`<cxl-page><cxl-t h4>${title}</cxl-t>` +
		ExtendedBy(json.extendedBy) +
		Documentation(json) +
		groups.map(kind => GroupIndex(kind, index[kind])).join('<br/>') +
		'<br/>' +
		groups
			.filter(group => groupBody[group].length)
			.map(
				group =>
					`<br /><cxl-t h4>${kindToString(group)}</cxl-t>${groupBody[
						group
					].join('<br />')}`
			)
			.join('<br />') +
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
	return node.flags & Flags.Export;
}

function ModuleNavbar(node: Node) {
	return (
		`<cxl-item href="${getHref(node)}"><i>Index</i></cxl-item>` +
		node.children
			?.sort(sortNode)
			.map(c =>
				declarationFilter(c) && !(c.flags & Flags.Overload)
					? `<cxl-item href="${getHref(c)}">${c.name}</cxl-item>`
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
	const pkg = application.package;

	return `<!DOCTYPE html>
	<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui-ts/index.js');require('../../dist/ui-ts/icons.js');</script>
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
		node.kind === Kind.Enum
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
