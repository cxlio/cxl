import {
	Output,
	Node,
	Kind,
	Flags,
	Source,
	DocumentationContent,
} from '../dts';
import type { DocGen, File } from './index.js';
import {
	kindToString,
	groupTitle,
	jsdocTitle,
	translate,
} from './localization';
import { relative } from 'path';
import hljs from 'highlight.js';
import { existsSync, readFileSync } from 'fs';
import MarkdownIt from 'markdown-it';
import { ExtraDocumentation, escape, parseExample } from './render.js';

let application: DocGen;
let index: Node[];
let extraDocs: ExtraDocumentation[];

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
	const extendStr: string[] = [];
	const implementStr: string[] = [];
	node.children?.forEach(child => {
		const link = Type(child);
		const type = child.type;

		return type &&
			(node.kind === Kind.Interface ||
				type.kind === Kind.Class ||
				type.kind === Kind.Component)
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

function renderType(type: Node) {
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
		case Kind.Tuple:
			return `[${type.children?.map(Type).join(', ') || ''}]`;
		case Kind.Array:
			return `${Type(type.type)}[]`;
		case Kind.Reference:
			return `${Link(type)}${TypeArguments(type.typeParameters)}`;
		case Kind.FunctionType:
		case Kind.Function:
		case Kind.Method:
			return FunctionType(type);
		case Kind.ObjectType:
			return ObjectType(type);
		case Kind.BaseType:
		case Kind.Literal:
		case Kind.TypeParameter:
			return type.name;
		case Kind.ConstructorType:
			return `new ${FunctionType(type)}`;
		case Kind.Keyof:
			return `keyof ${Type(type.type)}`;
		case Kind.Typeof:
			return `typeof ${type.name}`;
		case Kind.ThisType:
			return 'this';
	}

	return Signature(type);
}

function Type(type?: Node): string {
	if (!type) return '';
	const flags = type.flags & Flags.Rest ? '...' : '';
	return `${flags}${renderType(type)}`;
}

function SignatureValue(val?: string) {
	if (val && val.length > 50) return ` = ${Code(val)}`;
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
		(flags & Flags.Private ? Chip('private') : '') +
		(flags & Flags.Deprecated ? Chip('deprecated') : '') +
		(flags & Flags.Readonly ? Chip('readonly') : '') +
		(flags & Flags.Internal ? Chip('internal') : '')
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
		if (url.indexOf('github.com') !== -1) {
			const pos = src.sourceFile.getLineAndCharacterOfPosition(src.index);
			return `${url.replace(/\.git$/, '/blob/master')}/${relative(
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

function SourceLink({ source }: Node) {
	return source && application.repository
		? Array.isArray(source)
			? source.map(getSource).join('')
			: getSource(source)
		: '';
}

function Code(source: string, language?: string) {
	return (
		'<pre><code class="hljs">' +
		(language
			? hljs.highlight(language, source)
			: hljs.highlightAuto(source, [
					'html',
					'typescript',
					'javascript',
					'css',
			  ])
		).value +
		'</code></pre>'
	);
}

function Demo(doc: DocumentationContent): string {
	const { title, value } = parseExample(doc.value);
	return `<cxl-t h5>${title || translate('Demo')}</cxl-t><docgen-demo${
		application.debug ? ' debug' : ''
	}><!--${value}--></docgen-demo><cxl-t h6>Source</cxl-t>${Code(value)}`;
}

function Example(doc: DocumentationContent) {
	const { title, value } = parseExample(doc.value);
	return `<cxl-t h5>${
		title || translate('Example')
	}</cxl-t><cxl-c pad16>${value}</cxl-c><cxl-t h6>Source</cxl-t>${Code(
		value
	)}`;
}

function DocSee(doc: DocumentationContent) {
	const names = doc.value.split(' ');
	return (
		`<p>${jsdocTitle('see')}:` +
		names
			.map(name => {
				const symbol = index.find(n => n.name === name);
				return symbol ? Link(symbol) : name;
			})
			.join(', ') +
		'</p>'
	);
}

function formatContent(text: string) {
	return text.replace(/\r?\n\r?\n/g, '</p><p>');
}

function Documentation(node: Node) {
	const docs = node.docs;

	if (!docs || !docs.content) return '';

	return docs.content
		.map(doc => {
			if (doc.tag === 'demo') return Demo(doc);
			if (doc.tag === 'example') return Example(doc);
			if (doc.tag === 'return')
				return `<cxl-t h5>Returns</cxl-t><p>${doc.value}</p>`;
			if (doc.tag === 'param') return `<p>${doc.value}</p>`;
			if (doc.tag === 'see') return DocSee(doc);

			return `<p>${formatContent(
				doc.tag
					? `${jsdocTitle(doc.tag)}: ${doc.value}`
					: `${doc.value}`
			)}</p>`;
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
		? `<p><cxl-t subtitle2>${translate('Inherited from')}: ${Link(
				symbol
		  )}</cxl-t></p>`
		: '';
}

function MemberBody(c: Node) {
	let result = `<cxl-t style="font-weight: 500" code subtitle>${Signature(
		c
	)}</cxl-t>${InheritedFrom()}`;

	if (c.docs) result += Documentation(c);

	if (c.parameters?.length)
		result +=
			`<br/><cxl-t subtitle2>${translate('Parameters')}</cxl-t><ul>` +
			c.parameters
				.map(
					p => `<li>${Parameter(p)}${ParameterDocumentation(p)}</li>`
				)
				.join('') +
			'</ul><br/>';

	return result;
}

function MemberCard(c: Node) {
	return `${c.id ? Anchor(c.id) : ''}<cxl-card><cxl-c pad16>
		${SourceLink(c)}${MemberBody(c)}
		</cxl-c></cxl-card>`;
}

function ExtendedBy(extendedBy?: Node[]) {
	return extendedBy
		? `<cxl-t subtitle2>Extended By</cxl-t><ul>${extendedBy
				.map(ref => (ref.name ? `<li>${Link(ref)}</li>` : ''))
				.join('')}</ul>`
		: '';
}

function Link(node: Node, content?: string): string {
	const name = content || (node.name ? escape(node.name) : '(Unknown)');
	if (node.type) {
		if (node.kind === Kind.Reference) node = node.type;
		else if (node.kind === Kind.Export) return Link(node.type);
	}

	if (!node.id) return name;

	const href = getHref(node);

	if (application.spa && href[0] !== '#')
		return `<cxl-router-link href="${href}">${name}</cxl-router-link>`;

	return `<a href="${href}">${name}</a>`;
}

function getNodeCoef(a: Node) {
	return (
		-(a.flags & Flags.Static) +
		(a.kind === Kind.Module &&
		(a.name === 'index.ts' || a.name === 'index.tsx')
			? -10
			: 0) +
		(a.kind === Kind.Namespace ? -5 : 0)
	);
}

function sortNode(a: Node, b: Node) {
	const coef = getNodeCoef(a) - getNodeCoef(b);
	return coef + (a.name > b.name ? 1 : -1);
}

function ModuleTitle(node: Node) {
	const docs = node.docs;
	const chips =
		`<span style="float:right">` +
		(node.kind === Kind.Class ? Chip('class') : '') +
		(node.kind === Kind.Interface ? Chip('interface') : '') +
		(node.kind === Kind.Component ? Chip('component') : '') +
		(node.kind === Kind.Namespace ? Chip('namespace') : '') +
		(node.kind === Kind.Enum ? Chip('enum') : '') +
		(docs && docs.role ? Chip(`role: ${docs.role}`) : '') +
		`</span>`;

	return `<cxl-t h3>${chips}${Signature(node)}</cxl-t>`;
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

	return `<cxl-t h5>Import</cxl-t>${Code(
		`import { ${node.name} } from '${importUrl}';`
	)}`;
}

function MemberIndexLink(node: Node) {
	const chips = node.flags & Flags.Static ? Chip('static') : '';

	return `<cxl-c sm4 xl3>${chips} ${Link(node)}</cxl-c>`;
}

function MemberGroupIndex({ kind, index }: Group) {
	return `<cxl-t h6>${groupTitle(kind)}
		</cxl-t><cxl-c pad16><cxl-grid>${index.join('')}</cxl-grid></cxl-c>`;
}

function MemberBodyGroup({ body, kind }: Group) {
	return body.length === 0
		? ''
		: `<br /><cxl-t h5>${groupTitle(kind)}</cxl-t>${body.join(
				'<br />'
		  )}<br />`;
}

interface Group {
	kind: Kind;
	index: string[];
	body: string[];
}

function getMemberGroups(node: Node, indexOnly = false, sort = true) {
	const children = node.children;
	const resultMap: Record<number, Group> = {};
	const result: Group[] = [];

	if (!children) return result;

	children.sort(sortNode).forEach(c => {
		if (node.kind === Kind.Module && !declarationFilter(c)) return;

		const groupKind =
			(c.kind === Kind.Export && c.type?.type?.kind) || c.kind;

		let group = resultMap[groupKind];

		if (!group) {
			result.push(
				(group = resultMap[groupKind] = {
					kind: groupKind,
					index: [],
					body: [],
				})
			);
		}

		if (!(c.flags & Flags.Overload)) group.index.push(MemberIndexLink(c));

		if (!indexOnly && !hasOwnPage(c) && c.kind !== Kind.Export)
			group.body.push(MemberCard(c));
	});

	return sort
		? result.sort((a, b) =>
				kindToString(a.kind) > kindToString(b.kind) ? 1 : -1
		  )
		: result;
}

function MemberInherited(type: Node): string {
	return (
		type.children
			?.map(c => {
				if (!c.type) return '';
				let result = '';
				const kind = c.type.kind;

				if (kind === Kind.Class || kind === Kind.Component) {
					result = getMemberGroups(c.type, true)
						.map(MemberGroupIndex)
						.join('');
					if (result)
						result = `<cxl-t h5>Inherited from ${Link(
							c
						)}</cxl-t>${result}`;
					if (c.type.type) result += MemberInherited(c.type.type);
				}

				return result;
			})
			.join('') || ''
	);
}

function TagName(node: Node) {
	const tagName = node.kind === Kind.Component && node.docs?.tagName;

	return tagName ? `<cxl-t h5>HTML</cxl-t>${Code(`<${tagName}>`)}` : '';
}

function Members(node: Node) {
	const type = node.type;
	const groups = getMemberGroups(node);
	const importStr = ImportStatement(node);

	const inherited = type ? MemberInherited(type) : '';

	return (
		`<cxl-t h4>${translate(
			node.kind === Kind.Module ? 'Members' : 'API'
		)}</cxl-t>${TagName(node)}${importStr}` +
		(groups.length || inherited
			? (node.kind !== Kind.Module ? `<cxl-t h5>Members</cxl-t>` : '') +
			  groups.map(MemberGroupIndex).join('') +
			  inherited +
			  groups.map(MemberBodyGroup).join('')
			: '')
	);
}

function ModuleBody(json: Node) {
	return (
		ModuleTitle(json) +
		ExtendedBy(json.extendedBy) +
		ModuleDocumentation(json) +
		Members(json)
	);
}

function getHref(node: Node): string {
	if (
		node.type &&
		(node.kind === Kind.Reference || node.kind === Kind.Export)
	)
		return getHref(node.type);
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
	node = (node.kind === Kind.Export && node.type) || node;
	const kind =
		node.kind === Kind.Reference && node.type ? node.type.kind : node.kind;
	const icon = IconMap[kind] || '?';
	return `<cxl-badge style="margin-right:12px">${icon}</cxl-badge>`;
}

function ModuleNavbar(node: Node) {
	const moduleName = node.name.match(/index\.tsx?/) ? 'Index' : node.name;
	const href = getHref(node);

	return (
		`${Item(`<i>${moduleName}</i>`, href)}` +
		(node.children
			?.sort(sortNode)
			.map(c =>
				declarationFilter(c) && !(c.flags & Flags.Overload)
					? Item(`${NodeIcon(c)}${c.name}`, getHref(c))
					: ''
			)
			.join('') || '')
	);
}

function Item(title: string, href: string, icon?: string) {
	if (!href) throw new Error(`No href for "${title}"`);

	const result = `<cxl-router-item href="${href}">${
		icon
			? `<cxl-icon style="margin-right: 12px" icon="${icon}"></cxl-icon>`
			: ''
	}${title}</cxl-router-item>`;

	return result;
}

function NavbarExtra() {
	return `<cxl-c>${extraDocs.map(docs =>
		Item(docs.title, docs.file.name, docs.icon)
	)}</cxl-c><cxl-hr></cxl-hr>`;
}

function Navbar(pkg: any, out: Output) {
	return `<cxl-navbar permanent><cxl-c pad16><cxl-t h6>${pkg.name} <small>${
		pkg?.version || ''
	}</small></cxl-t></cxl-c>
		<cxl-hr></cxl-hr>
		${extraDocs.length ? NavbarExtra() : ''}	
		${out.modules.sort(sortNode).map(ModuleNavbar).join('')}
		</cxl-navbar>`;
}

function ModuleHeader(_p: Node) {
	return '';
}

function ModuleFooter(_p: Node) {
	return ``;
}

function Header(module: Output) {
	const pkg = application.modulePackage;
	const SCRIPTS = application.debug
		? `<script src="../../dist/tester/require-browser.js"></script>
	<script>require('../../dist/ui/index.js');require('../../dist/ui/icons.js');require('../../dist/docgen/runtime.js')</script>`
		: `<script src="runtime.bundle.min.js"></script>`;

	return `<!DOCTYPE html>
	<head><meta name="description" content="Documentation for ${
		pkg.name
	}" />${SCRIPTS}</head>
	<link rel="stylesheet" href="styles.css" />
	<style>body{font-family:var(--cxl-font); } cxl-td > :first-child { margin-top: 0 } cxl-td > :last-child { margin-bottom: 0 } ul{list-style-position:inside;padding-left: 8px;}li{margin-bottom:8px;}pre{white-space:pre-wrap;font-size:var(--cxl-font-size)}</style>
	<cxl-application permanent><title>${
		pkg.name
	}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(pkg, module)}
	<cxl-appbar-title><a href="index.html" style="color:inherit;text-decoration:none">${
		pkg.name
	}</a></cxl-appbar-title></cxl-appbar><cxl-page>`;
}

function escapeFileName(name: string, replaceExt = '.html') {
	return name.replace(/\.[tj]sx?$/, replaceExt).replace(/\//g, '--');
}

function getPageName(page: Node) {
	if (page.kind === Kind.Module) {
		const result = escapeFileName(page.name);
		return result === 'index.html' && existsSync('README.md')
			? 'index-api.html'
			: result;
	}

	if (page.kind === Kind.Namespace) return `ns-${page.name}.html`;

	const source = Array.isArray(page.source) ? page.source[0] : page.source;

	if (!source)
		throw new Error(`Source not found for page node "${page.name}"`);

	const prefix = escapeFileName(source.name, '--');

	return `${prefix}${page.name}.html`;
}

function Page(p: Node) {
	return {
		name: getPageName(p),
		node: p,
		content: ModuleHeader(p) + ModuleBody(p) + ModuleFooter(p),
	};
}

function hasOwnPage(node: Node) {
	return (
		node.kind === Kind.Class ||
		(node.kind === Kind.Interface &&
			!(node.flags & Flags.DeclarationMerge)) ||
		node.kind === Kind.Module ||
		node.kind === Kind.Enum ||
		node.kind === Kind.Component ||
		node.kind === Kind.Namespace
	);
}

function Module(module: Node) {
	const result = module.children?.filter(hasOwnPage).map(Page);
	return result ? result.concat(Page(module)) : [Page(module)];
}

function ExtraDocument(
	name: string,
	title: string,
	icon?: string
): ExtraDocumentation {
	const md = new MarkdownIt({
		highlight: Code,
	});
	const rules = md.renderer.rules;
	const map: any = {
		h1: 'h2',
		h2: 'h3',
		h3: 'h4',
		h4: 'h5',
		h5: 'h6',
	};

	/* eslint-disable @typescript-eslint/camelcase */
	rules.heading_open = (tokens, idx) => `<cxl-t ${map[tokens[idx].tag]}>`;
	rules.heading_close = () => `</cxl-t>`;
	rules.code_block = (tokens, idx) => Code(tokens[idx].content);

	return {
		title,
		icon,
		file: {
			name: 'index.html',
			content: md.render(readFileSync(name, 'utf8')),
		},
	};
}

function Route(file: File) {
	return `<template ${
		file.name === 'index.html' ? 'data-default="true"' : ''
	} data-path="${file.name}">${file.content}</template>`;
}

export function render(app: DocGen, output: Output): File[] {
	application = app;
	index = Object.values(output.index);
	hljs.configure({ tabReplace: '    ' });
	// Look for source documentation files
	extraDocs = existsSync('README.md')
		? [ExtraDocument('README.md', 'Home', 'home')]
		: [];

	const result: File[] = output.modules.flatMap(Module);
	const header = Header(output);
	const footer = '</cxl-page></cxl-application>';

	result.push(...extraDocs.map(d => d.file));

	let content = '<cxl-router-outlet></cxl-router-outlet><cxl-router>';

	result.forEach(doc => {
		if (app.spa) {
			content += Route(doc);
		} else doc.content = header + doc.content + footer;
	});

	if (app.spa) {
		return [
			{
				name: 'index.html',
				content: header + content + '</cxl-router>' + footer,
			},
		];
	}

	return result;
}
