import {
	Output,
	Node,
	Kind,
	Flags,
	Source,
	DocumentationContent,
} from '@cxl/dts';
import type { DocGen, File } from './index.js';
import {
	kindToString,
	groupTitle,
	jsdocTitle,
	translate,
} from './localization';
import type { Package } from '@cxl/program';
import { join, relative } from 'path';
import hljs from 'highlight.js';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import MarkdownIt from 'markdown-it';
import {
	ExtraDocumentation,
	Section,
	escape,
	parseExample,
	RuntimeConfig,
} from './render.js';

interface Group {
	kind: Kind;
	index: string[];
	body: string[];
	unique: Record<string, boolean>;
}

let application: DocGen;
let index: Node[];
let extraDocs: Section[];
let extraFiles: File[];
let docgenConfig: RuntimeConfig;

const RUNTIME_JS = __dirname + '/runtime.bundle.min.js';
const STYLES_CSS = __dirname + '/styles.css';

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

		return node.type?.kind === Kind.Interface ||
			(type &&
				(type.kind === Kind.Interface ||
					type.kind === Kind.Class ||
					type.kind === Kind.Component))
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
	if (node.kind === Kind.IndexSignature) return IndexSignature(node);
	if (node.kind === Kind.Spread && node.children?.[0])
		return `...${Type(node.children[0])}`;
	return SignatureText(node);
}

function collapse(body: string) {
	return `<doc-more> ${body}</doc-more>`;
}

function ObjectType(node: Node) {
	const result = `${node.children?.map(Property).join('; ') || ''}`;
	return result.length > 300 ? `{ ${collapse(result)} }` : `{ ${result} }`;
}

function MappedType(type: Node) {
	if (!type.children?.length || !type.type) return '?';
	const [K, T] = type.children;
	return `{ [${renderType(K)} in ${renderType(T)}]: ${renderType(
		type.type
	)} }`;
}

function TypeParameter(type: Node) {
	const constraint = type.children?.[0];
	return constraint ? `${type.name} extends ${Type(constraint)}` : type.name;
}

export function renderType(type: Node): string {
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
		/*case Kind.CallSignature:
			if (!type.children) throw new Error('Invalid node');
			return `${Type(type.children[0])}.${Type(type.children[1])}`;*/
		case Kind.TypeUnion:
			return type.children?.map(Type).join(' | ') || '';
		case Kind.TypeIntersection:
			return type.children?.map(Type).join(' & ') || '';
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
		case Kind.MappedType:
			return MappedType(type);
		case Kind.ObjectType:
			return ObjectType(type);
		case Kind.Literal:
			return escape(type.name);
		case Kind.TypeAlias:
		case Kind.BaseType:
			return type.name;
		case Kind.TypeParameter:
			return TypeParameter(type);
		case Kind.ConstructorType:
			return `new ${FunctionType(type)}`;
		case Kind.Keyof:
			return type.resolvedType
				? `<doc-more><x slot="off"> keyof ${Type(type.type)}</x> ${Type(
						type.resolvedType
				  )}</doc-more>`
				: `keyof ${Type(type.type)}`;
		case Kind.Typeof:
			return `typeof ${type.name}`;
		case Kind.ThisType:
			return 'this';
		case Kind.Class:
			return Link(type);
		case Kind.ReadonlyKeyword:
			return `readonly ${Type(type.type)}`;
		case Kind.UnknownType:
			return 'unknown';
	}
	return Signature(type);
}

export function Type(type?: Node): string {
	if (!type) return '';
	const flags = type.flags & Flags.Rest ? '...' : '';
	return `${flags}${renderType(type)}`;
}

function SignatureValue(val?: string) {
	if (val && val.length > 50) return '';
	return val ? ` = ${escape(val)}` : '';
}

function Parameter(p: Node) {
	const name = `${p.flags & Flags.Rest ? '...' : ''}${p.name}${
		p.flags & Flags.Optional ? '?' : ''
	}`;
	return `${name}: ${Type(p.type)}${p.value ? ` = ${p.value}` : ''}`;
}

function SignatureParameters(parameters?: Node[]) {
	if (!parameters) return '';

	return `(${parameters.map(Parameter).join(', ')})`;
}

function Chip(label: string, color = 'primary') {
	return `<cxl-chip size="small" color="${color}">${label}</cxl-chip> `;
}

function NodeChips({ flags }: Node) {
	return (
		(flags & Flags.Static ? Chip('static') : '') +
		(flags & Flags.Protected ? Chip('protected') : '') +
		(flags & Flags.Abstract ? Chip('abstract') : '') +
		(flags & Flags.Overload ? Chip('overload') : '') +
		(flags & Flags.Private ? Chip('private') : '') +
		(flags & Flags.Deprecated ? Chip('deprecated', 'error') : '') +
		(flags & Flags.Readonly ? Chip('readonly') : '') +
		(flags & Flags.Internal ? Chip('internal') : '') +
		(flags & Flags.Default ? Chip('default') : '')
	);
}

function getTypeColon(kind: Kind, name: string) {
	if (kind === Kind.TypeAlias) return ' = ';
	if (name || kind === Kind.Constructor) return ': ';
	if (kind === Kind.CallSignature) return ' => ';
	if (kind === Kind.ReadonlyKeyword) return 'readonly ';

	return ' => ';
}

function SignatureType({ type, kind, name }: Node) {
	if (!type) return '';
	if (
		kind === Kind.Class ||
		kind === Kind.Interface ||
		kind === Kind.Component
	)
		return ` ${Type(type)}`;

	const typeColon = getTypeColon(kind, name);
	return `${typeColon}${Type(type)}`;
}

function SignatureName({ flags, kind, name }: Node) {
	if (!name && kind === Kind.ConstructSignature) return 'new';

	return (name ? escape(name) : '') + (flags & Flags.Optional ? '?' : '');
}

function IndexSignature(node: Node) {
	const params = node.parameters?.map(Signature).join('') || '';
	return `[${params}]: ${node.type ? renderType(node.type) : '?'}`;
}

export function SignatureText(node: Node): string {
	if (node.kind === Kind.Module) return escape(node.name);
	if (node.kind === Kind.IndexSignature) return IndexSignature(node);

	const { value, parameters, typeParameters } = node;

	return `${SignatureName(node)}${TypeArguments(
		typeParameters
	)}${SignatureParameters(parameters)}${SignatureType(node)}${SignatureValue(
		value
	)}`;
}

/**
 * Return Node Signature
 */
export function Signature(node: Node): string {
	if (node.kind === Kind.Module || node.kind === Kind.IndexSignature)
		return SignatureText(node);

	return `${NodeChips(node)}${SignatureText(node)}`;
}

export function Anchor(id: number | undefined, content: string) {
	return id ? `<a name="s${id}"></a>${content}` : content;
}

function getSourceLink(src: Source) {
	const url = application.repositoryLink;
	if (url) {
		const pos = src.sourceFile.getLineAndCharacterOfPosition(src.index);
		const fileUrl = `${relative(
			application.packageRoot,
			src.sourceFile.fileName
		)}#L${pos.line + 1}`;
		return fileUrl; //`${url}/${fileUrl}`;
	}
	return '';
}

/*
function getSource(source: Source) {
	return `<a class="see-source" title="See Source" href="${getSourceLink(
		source
	)}">&lt;/&gt;</a>`;
}

function SourceLink({ source }: Node) {
	return source && application.repository
		? Array.isArray(source)
			? source.map(getSource).join('')
			: getSource(source)
		: '';
}*/

function Code(source: string, language?: string) {
	if (language === 'demo') return Demo({ value: source });

	return (
		'<pre><code class="hljs">' +
		(language
			? hljs.highlight(source, { language })
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

	return `<cxl-t h6>${title || translate('Demo')}</cxl-t><doc-demo${
		application.debug ? ' debug' : ''
	}><!--${value}--></doc-demo>`;
}

function Example(doc: DocumentationContent) {
	return Demo(doc);
}

function DocSee(doc: DocumentationContent) {
	const names = doc.value.split(' ');
	return (
		`<p>${jsdocTitle('see')}: ` +
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

			const value = escape(doc.value);

			return `<p>${formatContent(
				doc.tag ? `${jsdocTitle(doc.tag)}: ${value}` : `${value}`
			)}</p>`;
		})
		.join('');
}

function ModuleDocumentation(node: Node) {
	return `<div style="margin-top:32px">${Documentation(node)}</div>`;
}

function ParameterDocumentation(node: Node) {
	return Documentation(node);
}

function MemberBody(c: Node) {
	let result = `<doc-ct>${Signature(c)}</doc-ct>`;

	if (c.docs) result += Documentation(c);

	if (c.parameters?.length)
		result +=
			`<cxl-t font="subtitle2">${translate('Parameters')}</cxl-t><ul>` +
			c.parameters
				.map(
					p =>
						`<li><doc-cd>${Parameter(
							p
						)}</doc-cd>${ParameterDocumentation(p)}</li>`
				)
				.join('') +
			'</ul>';

	return result;
}

function MemberCard(c: Node) {
	const src =
		c.source &&
		getSourceLink(Array.isArray(c.source) ? c.source[0] : c.source);
	return Anchor(
		c.id,
		`<doc-c${src ? ` src="${src}"` : ''}>${MemberBody(c)}</doc-c>`
	);
}

function ExtendedBy(extendedBy?: Node[]) {
	return extendedBy
		? `<cxl-t inline font="subtitle2">${translate(
				'Extended By'
		  )}:</cxl-t> ${extendedBy
				.map(ref => (ref.name ? `${Link(ref)}` : ''))
				.join(', ')}`
		: '';
}

function Link(node: Node, content?: string, parentHref?: string): string {
	const name =
		content ||
		(node.name
			? escape(node.name)
			: node.flags & Flags.Default
			? '<i>default</i>'
			: '(Unknown)');
	if (node.type) {
		if (node.kind === Kind.Reference) node = node.type;
		else if (node.kind === Kind.Export) return Link(node.type);
	}

	if (!node.id) return name;

	const href = getHref(node, parentHref);

	if (application?.spa && href[0] !== '#')
		return `<doc-a href="${href}">${name}</doc-a>`;

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

function sortByValue(a: Node, b: Node) {
	let A: number | string = Number(a.value);
	if (isNaN(A)) A = a.name;
	let B: number | string = Number(b.value);
	if (isNaN(B)) B = b.name;

	return A > B ? 1 : -1;
}

function sortNode(a: Node, b: Node) {
	const coef = getNodeCoef(a) - getNodeCoef(b);
	return coef + (a.name > b.name ? 1 : -1);
}

function TagName(node: Node) {
	const tagName = node.kind === Kind.Component && node.docs?.tagName;
	return tagName ? `<cxl-t code subtitle>&lt;${tagName}&gt;</cxl-t>` : '';
}

function ModuleTitle(node: Node) {
	const docs = node.docs;
	const chips =
		`<span style="float:right">` +
		NodeChips(node) +
		(docs && docs.beta ? Chip('beta', 'warning') : '') +
		(node.kind === Kind.Module ? Chip('module') : '') +
		(node.kind === Kind.Class ? Chip('class') : '') +
		(node.kind === Kind.Interface ? Chip('interface') : '') +
		(node.kind === Kind.Component ? Chip('component') : '') +
		(node.kind === Kind.Namespace ? Chip('namespace') : '') +
		(node.kind === Kind.Enum ? Chip('enum') : '') +
		(docs && docs.role ? Chip(`role: ${docs.role}`) : '') +
		(node.flags & Flags.DeclarationMerge ? Chip('declaration merge') : '') +
		`</span>`;
	const subtitle =
		node.kind === Kind.Component
			? TagName(node)
			: node.kind === Kind.Module
			? ''
			: '';

	return `<cxl-t h3>${chips}${SignatureText(node)}${subtitle}</cxl-t>`;
}

/*function getImportUrl(source: Source) {
	const pkg = application.modulePackage?.name;
	const moduleName = source.name.replace(/\.tsx?$/, '');

	return `${pkg}${moduleName === 'index' ? '' : `/${moduleName}`}`;
}

function ImportStatement(node: Node) {
	if (node.kind === Kind.Module || !application.modulePackage) return '';
	const source = Array.isArray(node.source) ? node.source[0] : node.source;
	if (!source) return '';
	const importUrl = getImportUrl(source);
	const isDeclaration =
		importUrl.endsWith('.d') || node.flags & Flags.DeclarationMerge;

	return isDeclaration
		? ''
		: `<cxl-t h5>Import</cxl-t>${Code(
				`import { ${node.name} } from '${importUrl}';`
		  )}`;
}*/

function MemberIndexLink(node: Node, _parentHref: string) {
	const chips = node.flags & Flags.Static ? `${Chip('static')} ` : '';
	const link = Link(node, undefined, '');
	return chips ? `<c>${chips}${link}</c>` : link;
}

function MemberGroupIndex({ kind, index }: Group) {
	return `<cxl-t font="h6">${groupTitle(kind)}
		</cxl-t><doc-grd>${index.join('')}</doc-grd>`;
}

function MemberBodyGroup({ body, kind }: Group) {
	return body.length === 0
		? ''
		: `<cxl-t h5>${groupTitle(kind)}</cxl-t>${body.join('')}`;
}

function getEnumMembers(children: Node[], parentHref: string) {
	return [
		{
			kind: Kind.Property,
			unique: {},
			index: children
				.sort(sortNode)
				.map(n => MemberIndexLink(n, parentHref)),
			body: children.sort(sortByValue).map(MemberCard),
		},
	];
}

function pushToGroup(
	c: Node,
	resultMap: Record<number, Group>,
	result: Group[],
	indexOnly: boolean,
	parentHref: string
) {
	const groupKind = (c.kind === Kind.Export && c.type?.type?.kind) || c.kind;

	let group = resultMap[groupKind];

	if (!group) {
		result.push(
			(group = resultMap[groupKind] =
				{
					kind: groupKind,
					unique: {},
					index: [],
					body: [],
				})
		);
	}

	if (group.unique[c.name] !== true) {
		group.unique[c.name] = true;
		group.index.push(MemberIndexLink(c, parentHref));
	}

	if (!indexOnly && !hasOwnPage(c) && c.kind !== Kind.Export)
		group.body.push(MemberCard(c));
}

function getMemberGroups(node: Node, indexOnly = false, sort = true) {
	const children = node.children;
	const resultMap: Record<number, Group> = {};
	const result: Group[] = [];
	if (!children) return result;
	const parentHref = getHref(node);

	if (node.kind === Kind.Enum) return getEnumMembers(children, parentHref);

	children.sort(sortNode).forEach(c => {
		if (
			(node.kind === Kind.Module || node.kind === Kind.Namespace) &&
			!declarationFilter(c)
		)
			return;
		if (c.flags & Flags.Internal) return;

		// Handle Object or Array destructuring
		if (
			(c.kind === Kind.Constant || c.kind === Kind.Variable) &&
			c.children
		) {
			for (const child of c.children)
				pushToGroup(child, resultMap, result, indexOnly, parentHref);
		} else pushToGroup(c, resultMap, result, indexOnly, parentHref);
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

function Members(node: Node) {
	const type = node.type;
	const groups = getMemberGroups(node);

	const inherited = type ? MemberInherited(type) : '';

	return groups.length || inherited
		? (node.kind !== Kind.Module ? `<cxl-t h5>Members</cxl-t>` : '') +
				groups.map(MemberGroupIndex).join('') +
				inherited +
				groups.map(MemberBodyGroup).join('')
		: '';
}

function ModuleBody(json: Node) {
	return (
		ModuleTitle(json) +
		ExtendedBy(json.extendedBy) +
		ModuleDocumentation(json) +
		Members(json)
	);
}

export function getHref(node: Node, parentHref?: string): string {
	if (
		node.type &&
		(node.kind === Kind.Reference || node.kind === Kind.Export)
	)
		return getHref(node.type);
	if (hasOwnPage(node)) return getPageName(node);

	parentHref ??= node.parent ? getHref(node.parent) : '';

	return parentHref + (node.id ? '#s' + node.id.toString() : '');
}

function declarationFilter(node: Node) {
	return (
		!(node.flags & Flags.Internal) &&
		(node.flags & Flags.Export ||
			node.flags & Flags.Ambient ||
			node.flags & Flags.DeclarationMerge) /*&&
		!(node.kind === Kind.Interface && node.flags & Flags.DeclarationMerge)*/
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
	return `<cxl-avatar size="-1" text="${icon}"></cxl-avatar>`;
}

function NavbarItem(c: Node, parentHref?: string) {
	const name =
		!c.name && c.flags & Flags.Default ? '<i>default</i>' : escape(c.name);
	const href = getHref(c, parentHref);
	return href ? Item(`${NodeIcon(c)}${name}`, href) : '';
}

function ModuleNavbar(node: Node) {
	if (
		application.exclude?.includes(node.name) ||
		!node.children ||
		node.flags & Flags.Internal
	) {
		return '';
	}
	const moduleName = node.name.match(/index\.tsx?/) ? 'Index' : node.name;

	const href = getHref(node);
	return (
		`${Item(`<i>${moduleName}</i>`, href)}` +
		(node.children?.length
			? node.children
					.sort(sortNode)
					.map(c => {
						if (
							(c.kind === Kind.Constant ||
								c.kind === Kind.Variable) &&
							c.children
						) {
							return c.children
								.map(c2 => NavbarItem(c2, href))
								.join('');
						}
						if (
							declarationFilter(c) &&
							hasOwnPage(c) &&
							!(c.flags & Flags.Overload)
						) {
							return NavbarItem(c, href);
						} else return '';
					})
					.join('')
			: '')
	);
}

function Item(title: string, href: string, icon?: string) {
	if (!href) throw new Error(`No href for "${title}"`);

	const result = `<doc-it href="${href}">${
		icon ? `<cxl-icon icon="${icon}"></cxl-icon>` : ''
	}${title}</doc-it>`;

	return result;
}

function Extra(docs: Section[]) {
	return docs
		.map(docs => {
			const title = docs.title
				? `<cxl-navbar-subtitle>${docs.title}</cxl-navbar-subtitle>`
				: '';
			const items = docs.items
				.map(i =>
					Item(
						i.title,
						i.index ? 'index.html' : escapeFileName(i.file),
						i.icon
					)
				)
				.join('');
			return `${title}${items}`;
		})
		.join('<cxl-hr></cxl-hr>');
}

function NavbarExtra() {
	return `${Extra(extraDocs)}<cxl-hr></cxl-hr>`;
}

function findOtherVersions(outDir: string, currentVersion: string) {
	try {
		return readdirSync(outDir).filter(
			d =>
				d !== currentVersion && statSync(`${outDir}/${d}`).isDirectory()
		);
	} catch (e) {
		return [];
	}
}

function Versions() {
	return `<doc-version-select></doc-version-select>`;
}

function Navbar(pkg: Package, out: Output) {
	return `<cxl-navbar permanent><cxl-c pad="16"><cxl-t font="h5" inline>${
		application.packageName || pkg.name
	}</cxl-t>&nbsp;&nbsp;${Versions()}
	</cxl-c>
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

function getConfigScript(versions = 'version.json') {
	return `<script>window.docgen=${JSON.stringify({
		...docgenConfig,
		versions,
	})};</script>`;
}

function getRuntimeScripts(scripts: File[]) {
	return application.debug
		? `<script src="../../dist/tester/require-browser.js"></script>
	<script>
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`../../../cxl/dist/\${
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		);
	};
	require('../../dist/ui/index.js');require('../../dist/docgen/runtime.js')</script>`
		: `<script src="runtime.bundle.min.js"></script>${scripts.map(
				src => `<script src="${src.name}"></script>`
		  )}`;
}

function getUserScripts(scripts = application.demoScripts, prefix = 'us') {
	let id = 0;
	return (
		scripts?.map(path => ({
			name: `${prefix}${id++}.js`,
			content: readFileSync(path, 'utf8'),
		})) || []
	);
}

function Header(module: Output, scripts: File[]) {
	const pkg = application.modulePackage;
	const SCRIPTS = getRuntimeScripts(scripts);
	const title = application.packageName || pkg.name;

	return `<!DOCTYPE html>
	<head><meta charset="utf-8"><meta name="description" content="Documentation for ${title}" />${SCRIPTS}</head>
	<style>body{font-family:var(--cxl-font); } cxl-td > :first-child { margin-top: 0 } cxl-td > :last-child { margin-bottom: 0 } ul{list-style-position:inside;padding-left: 8px;}li{margin-bottom:8px;}pre{white-space:pre-wrap;font-size:var(--cxl-font-size)}doc-it>cxl-badge{margin-right:0} doc-grd>*,doc-a,doc-it{word-break:break-word}cxl-t[code][subtitle]{margin: 8px 0 16px 0}.target{box-shadow:0 0 0 2px var(--cxl-primary)}cxl-t[h6]{margin:32px 0 32px 0}cxl-t[h5]{margin:48px 0}code,.hljs{font:var(--cxl-font-code)}pre{margin:32px 0 32px 0}</style>
	<cxl-application permanent><title>${title} API Reference</title><cxl-appbar center>
	${Navbar(pkg, module)}
	<doc-search></doc-search>
	<cxl-theme-toggle-icon title="Dark theme toggle" theme="@cxl/ui/theme-dark.js" persistkey="cxl.ui-demo.theme"></cxl-theme-toggle-icon>
	</cxl-appbar><cxl-page center><link id="styles.css" rel="stylesheet" href="styles.css" /><script src="highlight.js"></script>`;
}

function escapeFileName(name: string, replaceExt = '.html') {
	return name.replace(/\.[tj]sx?$/, replaceExt).replace(/[./]/g, '--');
}

function getPageName(page: Node) {
	if (page.kind === Kind.Module) {
		const result = escapeFileName(page.name);
		return result === 'index.html' && existsSync('README.md')
			? 'index-api.html'
			: result;
	}

	if (page.kind === Kind.Namespace)
		return `ns--${escapeFileName(page.name)}.html`;

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

export function hasOwnPage(node: Node) {
	return (
		node.kind === Kind.Class ||
		node.kind === Kind.Interface ||
		/*(node.kind === Kind.Interface &&
			!(node.flags & Flags.DeclarationMerge)) ||*/
		node.kind === Kind.Module ||
		node.kind === Kind.Enum ||
		node.kind === Kind.Component ||
		node.kind === Kind.Namespace ||
		(node.kind === Kind.Function &&
			node.flags === Flags.Ambient &&
			node.children?.length)
	);
}

function Module(module: Node) {
	if (
		application.exclude?.includes(module.name) ||
		!module.children ||
		module.flags & Flags.Internal
	)
		return [];
	const result = module.children?.filter(hasOwnPage).map(Page);
	return result ? result.concat(Page(module)) : [Page(module)];
}

function Markdown(content: string) {
	const md = new MarkdownIt({
		highlight: Code,
	});
	const rules = md.renderer.rules;
	const map = {
		h1: 'h2',
		h2: 'h3',
		h3: 'h4',
		h4: 'h5',
		h5: 'h6',
	};

	rules.heading_open = (tokens, idx) =>
		`<cxl-t ${map[tokens[idx].tag as keyof typeof map]}>`;
	rules.heading_close = () => `</cxl-t>`;
	rules.code_block = (tokens, idx) => Code(tokens[idx].content);

	return md.render(content);
}

function Route(file: File) {
	return `<template ${
		file.name === 'index.html' ? 'data-default="true"' : ''
	} data-title="${file.title || file.node?.name || file.name}" data-path="${
		file.name
	}">${file.content}</template>`;
}

function renderExtraFile({ file, index, title }: ExtraDocumentation) {
	const source = readFileSync(file, 'utf8');
	const content = file.endsWith('.md') ? Markdown(source) : source;
	return {
		title,
		name: index
			? 'index.html'
			: escapeFileName(relative(application.packageRoot, file)),
		content,
	};
}

function initRuntimeConfig(app: DocGen) {
	const pkg = app.modulePackage;
	const userScripts = getUserScripts();

	/*const otherVersions = findOtherVersions(
		application.outputDir,
		pkg?.version
	);*/

	docgenConfig = {
		activeVersion: pkg?.version || '',
		userScripts: userScripts.map(f => f.name),
		versions: pkg?.version && 'version.json',
		//pkg ? [pkg.version, ...otherVersions] : otherVersions,
		repository: application.repositoryLink,
	};

	return userScripts;
}

function versionPrefix(version: string, file: File) {
	return { ...file, name: `${version}/${file.name}` };
}

export function render(app: DocGen, output: Output): File[] {
	application = app;
	index = Object.values(output.index);
	const scripts = getUserScripts(application.scripts || [], 's');
	const userScripts = initRuntimeConfig(app);
	const readmePath = join(application.packageRoot, 'README.md');
	const version = app.modulePackage?.version;
	extraDocs =
		app.extra ||
		(existsSync(readmePath)
			? [{ items: [{ title: 'Home', file: readmePath, index: true }] }]
			: []);

	extraFiles = extraDocs.flatMap(section =>
		section.items.map(renderExtraFile)
	);

	const result: File[] = output.modules.flatMap(Module);
	const header = Header(output, scripts);
	const footer = '</cxl-page></cxl-application>';
	const config = getConfigScript();
	result.push(...extraFiles);

	let content = '<cxl-router-outlet></cxl-router-outlet><cxl-router>';

	result.forEach(doc => {
		if (app.spa) {
			content += Route(doc);
		} else doc.content = config + header + doc.content + footer;
	});

	if (app.spa) {
		const staticFiles = [
			...userScripts,
			...scripts,
			{
				name: 'highlight.js',
				content: readFileSync(__dirname + '/highlight.js', 'utf8'),
			},
			{
				name: 'styles.css',
				content: readFileSync(STYLES_CSS, 'utf8'),
			},
			{
				name: 'runtime.bundle.min.js',
				content: readFileSync(RUNTIME_JS, 'utf8'),
			},
		];

		if (app.sitemap) {
			const base = app.sitemap;
			const sitemap = {
				name: 'sitemap.xml',
				content:
					'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
					result
						.map(
							doc =>
								`<url><loc>${base}/${
									version ? `${version}/` : ''
								}?${doc.name}</loc></url>`
						)
						.join('') +
					'</urlset>',
			};
			staticFiles.push(sitemap);
		}

		if (version) {
			return [
				{
					name: 'index.html',
					content: `<meta http-equiv="Refresh" content="0; url='${version}/'" />`,
				},
				{
					name: 'version.json',
					content: JSON.stringify({
						all: [
							version,
							...findOtherVersions(app.outputDir, version),
						],
					}),
				},
				{
					name: `${version}/index.html`,
					content:
						getConfigScript('../version.json') +
						header +
						content +
						'</cxl-router>' +
						footer,
				},
				...staticFiles.map(versionPrefix.bind(0, version)),
			];
		}

		return [
			{
				name: 'index.html',
				content: config + header + content + '</cxl-router>' + footer,
			},
			...staticFiles,
		];
	}

	return result;
}
