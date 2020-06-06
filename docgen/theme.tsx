import { Output, Node, Kind, Flags } from '../dts';
import { kindToString } from './localization';

const ENTITIES_REGEX = /[&<]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
};
// const anchors: Record<number, string> = {};

// let currentFile: string;

function escape(str: string) {
	return str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e]);
}

function TypeArguments(types?: Node[]) {
	return types
		? '&lt;' +
				types
					.map(
						t =>
							(t.name ? t.name : '') +
							(t.type ? ` extends ${SignatureType(t.type)}` : '')
					)
					.join(', ') +
				'&gt;'
		: '';
}

function SignatureType(type?: Node): string {
	if (!type) return '';

	// if (type.signatures) return type.signatures.map(Signature).join(' | ');

	// if (type.kind === Kind.TypeOperator) return ` keyof ${SignatureType(type)}`;
	if (type.kind === Kind.FunctionType) return Signature(type);

	if (type.kind === Kind.TypeUnion)
		return type.children?.map(SignatureType).join(' | ') || '';

	if (type.kind === Kind.Array) return `${SignatureType(type.type)}[]`;

	// if (type.type === Kind.Query) return `typeof ${SignatureType(type.queryType)}`;

	if (type.id)
		return `${Link(type.id, type.name)}${TypeArguments(
			type.typeParameters
		)}`;

	// if (type.declaration) return SignatureType(type.declaration);
	return type.name;

	// throw new Error('Declaration type not supported');
}

function SignatureValue(val?: string) {
	return val ? ` = ${escape(val)}` : '';
}

function Parameter(p: Node) {
	const name = `${p.flags & Flags.Rest ? '...' : ''}${p.name}${
		p.flags & Flags.Optional ? '?' : ''
	}`;
	return `${name}: ${SignatureType(p.type)}`;
}

function SignatureParameters(parameters?: Node[]) {
	if (!parameters) return '()';

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

function Signature(node: Node): string {
	const { flags, name, type, value, parameters, typeParameters } = node;
	const prefix = NodeChips(node);
	const parameterString = parameters ? SignatureParameters(parameters) : '';
	const actualName = name + (flags & Flags.Optional ? '?' : '');
	const typeColon = name === '__call' ? ' => ' : ': ';

	return `${prefix}${actualName}${TypeArguments(
		typeParameters
	)}${parameterString}${typeColon}${
		SignatureType(type) || 'any'
	}${SignatureValue(value)}`;
}

function Anchor(id: number) {
	const anchor = `s${id}`;
	return `<a name="${anchor}"></a>`;
}

/*function getSourceLink(src: any) {
	const url = typeof sourceUrl === 'string' ? sourceUrl : sourceUrl.url;
	if (url) {
		if (url.startsWith('https://github.com'))
			return `${url}/${src.fileName}#L${src.line}`;
	}

	return `#`;
}

function Source(sources?: JSONOutput.SourceReference[]) {
	return sources && pkg && pkg.repository
		? sources
				.slice(0, 1)
				.map(
					s =>
						`<a title="See Source" style="float:right;color:var(--cxl-onSurface87)" href="${getSourceLink(
							s
						)}"><cxl-icon icon="code"></cxl-icon></a>`
				)
				.join('')
		: '';
}*/

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

/*function Comment(comment?: Node) {
	if (!comment) return '';

	if (typeof comment === 'string') return comment;

	return comment.text || comment.shortText || '';
}*/

function SymbolLink(symbol: Node) {
	if ('id' in symbol && symbol.id) {
		return Link(symbol.id, 'name' in symbol ? symbol.name : '(Unknown)');
	}

	return '';
}

function InheritedFrom(symbol?: Node) {
	return symbol
		? `<p><cxl-t subtitle2>Inherited From: ${SymbolLink(
				symbol
		  )}</cxl-t></p>`
		: '';
}

function MemberBody(c: Node) {
	/*
	let result: string = c.signatures
		? c.signatures.map(sig => MemberBody(sig)).join('')
		: `<cxl-t subtitle>${Signature(c)}</cxl-t>${InheritedFrom()}`;*/
	let result = `<cxl-t subtitle>${Signature(c)}</cxl-t>${InheritedFrom()}`;
	let returns = '';

	/*if (c.comment) {
		if (c.comment.shortText) result += `<br/><p>${c.comment.shortText}</p>`;
		if (c.comment.returns) returns = c.comment.returns;
	}*/

	if (c.parameters)
		result +=
			'<br/><cxl-t subtitle2>Parameters</cxl-t>' +
			ParameterTable(
				c.parameters.map(p => [p.name, '' /*Comment(p.comment)*/])
			) +
			'<br/>';

	if (returns) result += `<cxl-t subtitle2>Returns</cxl-t><p>${returns}</p>`;

	return result;
}

function Source(_n: Node) {
	return '';
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

function Link(id?: number, name?: string) {
	const escaped = name ? escape(name) : '';
	return id && name ? `<a href="${getHref(id)}">${escaped}</a>` : escaped;
}

function ModuleBody(json: Node) {
	const { children } = json;
	const index: Record<number, string[]> = {};
	const groupBody: Record<number, string[]> = {};
	const groups: Kind[] = [];

	if (children)
		children.forEach(c => {
			if (!index[c.kind]) {
				groupBody[c.kind] = [];
				index[c.kind] = [];
				groups.push(c.kind);
			}

			index[c.kind].push(`<cxl-c sm4 lg3>${Link(c.id, c.name)}</cxl-c>`);
			if (c.kind !== Kind.Class) groupBody[c.kind].push(MemberCard(c));
		});

	const moduleType = json.typeParameters
		? TypeArguments(json.typeParameters)
		: '';
	/*const moduleType = '';*/
	/*const extendsName = json.extendedTypes
		? `<small> extends ${json.extendedTypes
				.map(SignatureType)
				.join(', ')}</small>`
		: '';*/
	const extendsName = '';
	const moduleName = json.name.replace(/\.tsx?$/, '');

	return (
		`<cxl-page><cxl-t h4>${moduleName}${moduleType}${extendsName}</cxl-t>` +
		// ExtendedBy(json.extendedBy as any) +
		// (json.comment ? `<p>${Comment(json.comment)}</p>` : '') +
		groups
			.map(
				group =>
					`<cxl-card><cxl-c pad16><cxl-t h5>${kindToString(
						group
					)}</cxl-t><br/><cxl-grid>${index[group as any].join(
						''
					)}</cxl-grid></cxl-c></cxl-card>`
			)
			.join('<br/>') +
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
	return id ? '#s' + id.toString() : ''; //href;
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

function Header({ pkg }: Output, module: Node) {
	return `<!DOCTYPE html>
	<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui-ts/index.js');require('../../dist/ui-ts/icons.js');</script>
	<cxl-application><title>${pkg.name}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(pkg, module)}
	<a href="index.html" style="text-decoration:none"><cxl-appbar-title>${
		pkg.name
	}</cxl-appbar-title></a></cxl-appbar>`;
}

export function Page(out: Output, p: Node) {
	return Header(out, p) + ModuleHeader(p) + ModuleBody(p) + ModuleFooter(p);
}
