import { Node, Kind, Flags, Source } from '../dts';
import type { DocGen } from './index.js';
import { kindToString } from './localization';
import { relative } from 'path';

let application: DocGen;
const ENTITIES_REGEX = /[&<]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
};
// let nodeIndex: Record<number, Node>;
// const anchors: Record<number, string> = {};

// let currentFile: string;

function escape(str: string) {
	return str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e]);
}

function TypeArguments(types?: Node[]): string {
	return types
		? '&lt;' +
				types
					.map(
						t =>
							(t.id ? Link(t) : t.name) +
							TypeArguments(t.typeParameters) +
							(t.type ? ` extends ${SignatureType(t.type)}` : '')
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

function Type(type?: Node): string {
	if (!type) return '';

	// if (type.signatures) return type.signatures.map(Signature).join(' | ');

	// if (type.kind === Kind.TypeOperator) return ` keyof ${SignatureType(type)}`;
	// if (type.kind === Kind.FunctionType) return Signature(type);
	if (type.kind === Kind.Never) return 'never';
	if (type.kind === Kind.Infer) return `infer ${Type(type.type)}`;
	if (type.kind === Kind.Parenthesized) return `(${Type(type.type)})`;
	if (type.kind === Kind.ConditionalType) return ConditionalType(type);

	if (type.kind === Kind.TypeUnion)
		return type.children?.map(Type).join(' | ') || '';

	if (type.kind === Kind.Array) return `${Type(type.type)}[]`;
	if (type.kind === Kind.Reference)
		return `${Link(type)}${TypeArguments(type.typeParameters)}`;

	// if (type.type === Kind.Query) return `typeof ${SignatureType(type.queryType)}`;

	// if (type.id) return `${Link(type)}${TypeArguments(type.typeParameters)}`;

	// if (type.declaration) return SignatureType(type.declaration);
	return Signature(type);

	// throw new Error('Declaration type not supported');
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

function NodeChips({ flags, kind }: Node) {
	return (
		(kind === Kind.Constant ? Chip('const') : '') +
		(flags & Flags.Protected ? Chip('protected') : '') +
		(flags & Flags.Abstract ? Chip('abstract') : '')
	);
}

function SignatureType({ type, kind, name }: Node) {
	if (!type) return '';
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

/*function ExtendedBy(extendedBy?: Node[]) {
	return extendedBy
		? `<cxl-t subtitle2>Extended By</cxl-t><ul>${extendedBy
				.map(ref =>
					ref.name
						? `<li>${
								ref.id ? Link(ref.id, ref.name) : ref.name
						  }</li>`
						: ''
				)
				.join('')}</ul>`
		: '';
}*/

function Link(node: Node) {
	const name = node.name ? escape(node.name) : '(Unknown)';
	const id = node.id;

	return id && name ? `<a href="${getHref(id)}">${name}</a>` : name;
}

function GroupIndex(kind: Kind, children: string[]) {
	return `<cxl-card><cxl-c pad16><cxl-t h5>${kindToString(kind)}
		</cxl-t><br/><cxl-grid>${children.join('')}</cxl-grid></cxl-c></cxl-card>`;
}

function sortNode(a: Node, b: Node) {
	return a.name > b.name ? 1 : -1;
}

function ModuleBody(json: Node) {
	const { children } = json;
	const index: Record<number, string[]> = {};
	const groupBody: Record<number, string[]> = {};
	const groups: Kind[] = [];

	if (children)
		children.sort(sortNode).forEach(c => {
			if (!(c.flags & Flags.Export)) return;

			const groupKind =
				c.kind === Kind.FunctionOverload ? Kind.Function : c.kind;

			if (!index[groupKind]) {
				groupBody[groupKind] = [];
				index[groupKind] = [];
				groups.push(groupKind);
			}

			if (c.kind !== Kind.FunctionOverload)
				index[groupKind].push(`<cxl-c sm4 lg3>${Link(c)}</cxl-c>`);
			if (c.kind !== Kind.Class) groupBody[groupKind].push(MemberCard(c));
		});

	const title = Signature(json);

	return (
		`<cxl-page><cxl-t h4>${title}</cxl-t>` +
		Documentation(json) +
		groups.map(kind => GroupIndex(kind, index[kind])).join('<br/>') +
		'<br/>' +
		groups
			.filter(group => group !== Kind.Class)
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

function getHref(id?: number) {
	//	const href = anchors[id];
	//	if (!href) throw new Error(`Link to ${id} not found`);
	return id ? '#s' + id.toString() : '';
}

function ModuleNavbar({ id, children }: Node) {
	return (
		`<cxl-item href="${getHref(id)}"><i>Index</i></cxl-item>` +
		children
			?.map(c => `<cxl-item href="${getHref(c.id)}">${c.name}</cxl-item>`)
			.join('')
	);
}

function Navbar(pkg: any, m: Node) {
	return `<cxl-navbar><cxl-c pad16><cxl-t h6>${pkg.name} <small>${
		pkg?.version || ''
	}</small></cxl-t></cxl-c>
		<cxl-hr></cxl-hr>${ModuleNavbar(m)}
		</cxl-navbar>`;
}

function ModuleHeader(_p: Node) {
	return '';
}

function ModuleFooter(_p: Node) {
	return `</cxl-application>`;
}

function Header(module: Node) {
	const pkg = application.package;

	return `<!DOCTYPE html>
	<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui-ts/index.js');require('../../dist/ui-ts/icons.js');</script>
	<cxl-application><title>${pkg.name}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(pkg, module)}
	<a href="index.html" style="text-decoration:none"><cxl-appbar-title>${
		pkg.name
	}</cxl-appbar-title></a></cxl-appbar>`;
}

export function Page(app: DocGen, p: Node) {
	application = app;
	return Header(p) + ModuleHeader(p) + ModuleBody(p) + ModuleFooter(p);
}
