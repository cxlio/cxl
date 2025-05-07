import {
	Output,
	Node,
	Kind,
	Flags,
	Source,
	DocumentationContent,
	printNode as _printNode,
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
let extraDocs: Section[];
let docgenConfig: RuntimeConfig;
let modules: Node[];
let allSymbols: Node[];

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
								: ''),
					)
					.join(', ') +
				'&gt;'
		: '';
}

function ConditionalType(node: Node) {
	if (!node.children) return '';

	const [check, extend, trueVal, falseVal] = node.children;
	return `${Type(check)} extends ${Type(extend)} ? ${Type(trueVal)} : ${Type(
		falseVal,
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
		(implementStr.length ? ` implements ${implementStr.join(', ')}` : '')
	}</cxl-t>`;
}

function FunctionType(node: Node) {
	const { parameters, typeParameters, type } = node;
	return `${SignatureName(node)}${TypeArguments(
		typeParameters,
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
		type.type,
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
			return type.name;
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
						type.resolvedType,
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
		case Kind.Symbol:
			return 'Symbol';
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
	const modifiers =
		p.flags & Flags.Public
			? 'public '
			: p.flags & Flags.Private
			? 'private'
			: p.flags & Flags.Protected
			? 'protected '
			: '';

	const name = `${modifiers}${p.flags & Flags.Rest ? '...' : ''}${p.name}${
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

function NodeChips({ flags, docs }: Node) {
	return (
		(docs?.beta ? Chip('beta', 'warning') : '') +
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
		typeParameters,
	)}${SignatureParameters(parameters)}${SignatureType(node)}${SignatureValue(
		value,
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
	if (url && !src.sourceFile.isDeclarationFile) {
		const pos = src.sourceFile.getLineAndCharacterOfPosition(src.index);
		const fileUrl = `${relative(application.packageRoot, src.name)}#L${
			pos.line + 1
		}`;
		return fileUrl;
	}
	return '';
}

function Code(source: string, language?: string) {
	if (language === 'demo') return Demo({ value: source });

	return `<doc-hl${
		language ? ` l="${language}"` : ''
	}><!--${source}--></doc-hl>`;
}

function Demo(doc: DocumentationContent): string {
	const { title, value } = parseExample(getDocValue(doc.value));
	const demo = application.cxlExtensions
		? `<doc-demo${
				application.debug ? ' debug' : ''
		  }><!--${value}--></doc-demo>`
		: Markdown(value);

	return `<cxl-t h6>${
		title || translate('Example')
	}</cxl-t>${demo}<br/><br/>`;
}

function Example(doc: DocumentationContent) {
	return Demo(doc);
}

function findSymbolByName(name: string) {
	const [symbolName, _method] = name.split('#');
	return allSymbols.find(s => s.name === symbolName);
}

function ExternalLink(url: string, title?: string) {
	return `<a href="${getExternalLink(url)}">${escape(title || url)}</a>`;
}

function DocSee(doc: DocumentationContent) {
	const value = doc.value;

	let output = Array.isArray(value) && getDocValue(value);
	if (!output && typeof value === 'string') {
		const symbol = findSymbolByName(value);
		output = symbol
			? Link(symbol)
			: application.markdown
			? Markdown(value, true)
			: escape(value);
	}

	return `<p>${jsdocTitle('see')}: ${output}</p>`;
}

function formatContent(text: string) {
	return text.replace(/\r?\n\r?\n/g, '</p><p>');
}

const linkRegex = /^\s*([^|]+?)\s*(?:[|\s]\s*(.+))?\s*$/;

function DocLink(value: string) {
	const linkTag = linkRegex.exec(value);
	const name = linkTag?.[1] || value;
	const title = linkTag?.[2];
	const symbol = findSymbolByName(name);

	return symbol ? Link(symbol, title) : ExternalLink(name, title);
}

function getDocValue(content: DocumentationContent['value']) {
	if (typeof content === 'string') return content;

	return content
		.map(doc => {
			if (doc.tag === 'link') return DocLink(doc.value);
			return escape(doc.value);
		})
		.join(' ');
}

function Documentation(node: Node) {
	const docs = node.docs;

	if (!docs || !docs.content) return '';

	return docs.content
		.map(doc => {
			if (doc.tag === 'demo') return Demo(doc);
			if (doc.tag === 'example') return Example(doc);
			if (doc.tag === 'see') return DocSee(doc);
			if (typeof doc.value === 'string' && doc.tag === 'link')
				return DocLink(doc.value);

			const value = getDocValue(doc.value);
			const text = application.markdown
				? Markdown(value, !value.includes('\n'))
				: formatContent(value);

			if (doc.tag === 'return')
				return `<cxl-t h6>Returns</cxl-t><p>${text}</p>`;
			if (doc.tag === 'param') return `<p>${text}</p>`;

			return doc.tag
				? `<p>${jsdocTitle(doc.tag)}: ${text}</p>`
				: `<p>${text}</p>`;
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
						`<li><code>${Parameter(
							p,
						)}</code>${ParameterDocumentation(p)}</li>`,
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
		`<doc-c${src ? ` src="${src}"` : ''}>${MemberBody(c)}</doc-c>`,
	);
}

function ExtendedBy(extendedBy?: Node[]) {
	return extendedBy
		? `<cxl-t inline font="subtitle2">${translate(
				'Extended By',
		  )}:</cxl-t> ${extendedBy
				.map(ref => (ref.name ? `${Link(ref)}` : ''))
				.join(', ')}`
		: '';
}

function isReferenceNode(node: Node) {
	return node.kind === Kind.Reference || node.kind === Kind.ImportType;
}

function Link(node: Node, content?: string, parent?: Node): string {
	const name =
		content ||
		(node.name
			? escape(node.name)
			: node.flags & Flags.Default
			? '<i>default</i>'
			: '(Unknown)');

	if (node.type && isReferenceNode(node)) node = node.type;

	if (!node.id) return name;

	const href = getHref(node, parent);

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

function MemberIndexLink(node: Node, parent?: Node) {
	const chips = node.flags & Flags.Static ? `${Chip('static')} ` : '';
	const link = Link(node, undefined, parent);
	return chips
		? `<c>${chips}${link}</c>`
		: link.startsWith('<')
		? link
		: `<c>${link}</c>`;
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

function getEnumMembers(node: Node, children: Node[]) {
	children = children.filter(c => !(c.flags & Flags.Internal));
	return [
		{
			kind: Kind.Property,
			unique: {},
			index: children.sort(sortNode).map(c => MemberIndexLink(c, node)),
			body: children.sort(sortByValue).map(MemberCard),
		},
	];
}

function pushToGroup(
	parent: Node,
	c: Node,
	resultMap: Record<number, Group>,
	result: Group[],
	indexOnly: boolean,
) {
	const groupKind = c.kind === Kind.ImportType ? Kind.Export : c.kind;

	let group = resultMap[groupKind];

	if (!group) {
		result.push(
			(group = resultMap[groupKind] =
				{
					kind: groupKind,
					unique: {},
					index: [],
					body: [],
				}),
		);
	}

	if (group.unique[c.name] !== true) {
		group.unique[c.name] = true;
		// Assign parent only if not indexOnly
		group.index.push(MemberIndexLink(c, indexOnly ? undefined : parent));
	}

	if (!indexOnly && !hasOwnPage(c) && c.kind !== Kind.Export)
		group.body.push(MemberCard(c));
}

function getMemberGroups(node: Node, indexOnly = false, sort = true) {
	const children = node.children;
	const resultMap: Record<number, Group> = {};
	const result: Group[] = [];
	if (!children) return result;

	if (node.kind === Kind.Enum) return getEnumMembers(node, children);

	children.sort(sortNode).forEach(c => {
		if (
			((node.kind === Kind.Module || node.kind === Kind.Namespace) &&
				!declarationFilter(c)) ||
			c.flags & Flags.Internal
		)
			return;

		if (c.type?.kind === Kind.ImportType && !c.type.type?.children?.length)
			return;

		// Handle Object or Array destructuring
		if (
			(c.kind === Kind.Constant || c.kind === Kind.Variable) &&
			c.children
		) {
			for (const child of c.children)
				pushToGroup(c, child, resultMap, result, indexOnly);
		} else pushToGroup(node, c, resultMap, result, indexOnly);
	});

	return sort
		? result.sort((a, b) =>
				kindToString(a.kind) > kindToString(b.kind) ? 1 : -1,
		  )
		: result;
}

function isExcluded({ source }: Node) {
	const exclude = application.exclude;
	if (!exclude) return false;
	if (source) {
		const found = Array.isArray(source)
			? source.find(s => exclude.includes(s.name))
			: exclude.includes(source.name);
		if (found) return true;
	}

	return false;
}

function MemberInherited(type: Node): string {
	return (
		type.children
			?.map(c => {
				if (!c.type || isExcluded(c.type)) return '';
				let result = '';
				const kind = c.type.kind;

				if (kind === Kind.Class || kind === Kind.Component) {
					result = getMemberGroups(c.type, true)
						.map(MemberGroupIndex)
						.join('');
					if (result)
						result = `<cxl-t h5>${translate(
							'Inherited from',
						)} ${Link(c)}</cxl-t>${result}`;
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

	if (
		groups.length &&
		(node.kind === Kind.Module || node.kind === Kind.Namespace) &&
		!modules.includes(node)
	)
		modules.push(node);

	const inherited = type ? MemberInherited(type) : '';
	return groups.length || inherited
		? groups.map(MemberGroupIndex).join('') +
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

export function getHref(node: Node, parent?: Node): string {
	if (
		node.type &&
		(node.kind === Kind.Reference ||
			node.kind === Kind.Export ||
			node.kind === Kind.ImportType)
	)
		return getHref(node.type);
	if (hasOwnPage(node)) return getPageName(node);

	const parentHref =
		node.parent && (!parent || node.parent.name !== parent.name)
			? getHref(node.parent)
			: '';

	return parentHref + (node.id ? '#s' + node.id.toString() : '');
}

function declarationFilter(node: Node) {
	return (
		!(node.flags & Flags.Internal) &&
		(node.flags & Flags.Export ||
			node.flags & Flags.Ambient ||
			node.flags & Flags.DeclarationMerge)
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
	[Kind.Enum]: 'E',
	[Kind.Namespace]: 'N',
};

function NodeIcon(node: Node) {
	node = (node.kind === Kind.Export && node.type) || node;
	const kind =
		node.kind === Kind.Reference && node.type ? node.type.kind : node.kind;
	const icon = IconMap[kind] || '?';
	return `<cxl-avatar size="-1" text="${icon}"></cxl-avatar>`;
}

function NavbarItem(c: Node) {
	const name =
		!c.name && c.flags & Flags.Default ? '<i>default</i>' : escape(c.name);
	const href = getHref(c);
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
	const moduleName = node.name.match(/^index\.tsx?/) ? 'Index' : node.name;
	const href = getHref(node);
	return (
		`${Item(`<i>${moduleName}</i>`, href)}` +
		(node.children?.length
			? node.children
					.sort(sortNode)
					.map(c => {
						if (
							declarationFilter(c) &&
							hasOwnPage(c) &&
							!(c.flags & Flags.Overload)
						) {
							return NavbarItem(c);
						} else return '';
					})
					.join('')
			: '')
	);
}

function Item(title: string, href: string, icon?: string) {
	if (!href) throw new Error(`No href for "${title}"`);

	const result = `<doc-it href="${href}" ${
		application.spa ? '' : 'external'
	}>${icon ? `<cxl-icon icon="${icon}"></cxl-icon>` : ''}${title}</doc-it>`;

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
						i.icon,
					),
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
				d !== currentVersion &&
				statSync(`${outDir}/${d}`).isDirectory(),
		);
	} catch (e) {
		return [];
	}
}

function Versions() {
	return `<doc-version-select></doc-version-select>`;
}

function Navbar(pkg: Package) {
	return `<cxl-navbar permanent><cxl-flex middle pad="16"><div class="navbar-title">${
		application.packageName || pkg.name
	}</div>${Versions()}
	</cxl-flex>
		<cxl-hr></cxl-hr>
		${extraDocs.length ? NavbarExtra() : ''}	
		${modules.sort(sortNode).map(ModuleNavbar).join('')}
		</cxl-navbar>`;
}

function ModuleHeader(_p: Node) {
	return '';
}

function ModuleFooter(_p: Node) {
	return ``;
}

function getConfigScript(versions: string) {
	return `<script>window.docgen=${JSON.stringify({
		...docgenConfig,
		versions,
	})};</script>`;
}

function getRuntimeScripts(scripts: File[]) {
	return `<script src="runtime.bundle.min.js"></script>${scripts.map(
		src => `<script src="${src.name}"></script>`,
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

function Header(config: string, scripts: File[]) {
	const pkg = application.modulePackage;
	const SCRIPTS = getRuntimeScripts(scripts);
	const title = application.packageName || pkg.name;
	const customHeadHtml = application.headHtml
		? readFileSync(application.headHtml, 'utf8')
		: '';

	return `<!DOCTYPE html>
	<head>${config}${customHeadHtml}<meta charset="utf-8"><meta name="description" content="Documentation for ${title}" />${SCRIPTS}</head>
	<style>body{font-family:var(--cxl-font); } cxl-td > :first-child { margin-top: 0 } cxl-td > :last-child { margin-bottom: 0 } ul{list-style-position:inside;padding-left: 8px;}li{margin-bottom:8px;}pre{white-space:pre-wrap;font-size:var(--cxl-font-size)}doc-it>cxl-badge{margin-right:0} doc-grd>*,doc-a,doc-it{word-break:break-word}cxl-t[code][subtitle]{margin: 8px 0 16px 0}.target{box-shadow:0 0 0 2px var(--cxl-primary)}cxl-t[h6]{margin:32px 0 32px 0}cxl-t[h5]:not([inline]){margin:40px 0}code,.hljs{font:var(--cxl-font-code);font-size:0.875em}pre{margin:32px 0 32px 0} .navbar-title{font-size: 18px;font-weight:500;flex-grow:1}p,ul{line-height:1.6}</style>

	<cxl-application permanent><title>${title} API Reference</title><cxl-appbar center>
	${Navbar(pkg)}
	<doc-search></doc-search>
	<cxl-theme-toggle-icon title="Dark theme toggle" darktheme="@cxl/ui/theme-dark.js" persistkey="cxl.ui-demo.theme"></cxl-theme-toggle-icon>
	</cxl-appbar><cxl-page center><link id="styles.css" rel="stylesheet" href="styles.css" /><script src="highlight.js"></script>`;
}

function escapeFileName(name: string, replaceExt = '.html') {
	return name.replace(/\.([tj]sx?|md)$/, replaceExt).replace(/[/"]/g, '--');
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

function getExternalLink(url: string) {
	return application.baseHref
		? new URL(url, application.baseHref).toString()
		: url;
}

const AllowedHtmlTags = /^<\/?(?:doc-a|a|code)[\s>]/;
const IsLink = /^<\/?(?:doc-a|a)[\s>]/;

function Markdown(content: string, inline = false, allowAllHtml = false) {
	const md = new MarkdownIt({
		highlight: Code,
		html: true,
	});
	const oldLink = md.normalizeLink;
	md.normalizeLink = (url: string) => {
		return application.baseHref
			? getExternalLink(url)
			: oldLink.call(md, url);
	};

	const rules = md.renderer.rules;
	const map = {
		h1: 'h4',
		h2: 'h5',
		h3: 'h6',
		h4: 'h6',
		h5: 'h6',
	};
	rules.heading_open = (tokens, idx) =>
		`<cxl-t ${map[tokens[idx].tag as keyof typeof map]}>`;
	rules.heading_close = () => `</cxl-t>`;
	rules.code_block = (tokens, idx) => Code(tokens[idx].content);
	rules.fence = (tokens, idx) => Code(tokens[idx].content, tokens[idx].info);
	rules.code_inline = (tokens, idx) => {
		const value = tokens[idx].content;
		const isLink = IsLink.test(value);
		return `<code>${isLink ? value : escape(value)}</code>`;
	};
	rules.html_block = (tokens, idx) => {
		const html = tokens[idx].content;
		return allowAllHtml ? html : escape(html);
	};
	rules.html_inline = (tokens, idx) => {
		const html = tokens[idx].content;
		return allowAllHtml || AllowedHtmlTags.test(html) ? html : escape(html);
	};

	rules.table_open = () => '<cxl-table>';
	rules.table_close = () => '</cxl-table>';
	//rules.thead_open = () => '<cxl-tr>';
	//rules.thead_close = () => '</cxl-tr>';
	rules.tr_open = () => '<cxl-tr>';
	rules.tr_close = () => '</cxl-tr>';
	rules.th_open = () => '<cxl-th>';
	rules.th_close = () => '</cxl-th>';
	rules.td_open = () => '<cxl-td>';
	rules.td_close = () => '</cxl-td>';
	rules.tbody_open = () => '<cxl-tbody>';
	rules.tbody_close = () => '</cxl-tbody>';

	return inline ? md.renderInline(content) : md.render(content);
}

function Route(file: File) {
	return `<template ${
		file.name === 'index.html' ? 'data-default="true"' : ''
	} data-title="${escape(
		file.title || file.node?.name || file.name,
	)}" data-path="${file.name}">${file.content}</template>`;
}

function renderExtraFile({ file, index, title }: ExtraDocumentation) {
	const source = readFileSync(file, 'utf8');
	const content = file.endsWith('.md')
		? Markdown(source, false, true)
		: source;
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

	docgenConfig = {
		activeVersion: pkg?.version || '',
		userScripts: userScripts.map(f => f.name),
		versions: pkg?.version && 'version.json',
		repository: application.repositoryLink,
	};

	return userScripts;
}

function versionPrefix(version: string, file: File) {
	return { ...file, name: `${version}/${file.name}` };
}

export function render(app: DocGen, output: Output): File[] {
	application = app;
	if (!app.rootDir && output.config.options.rootDir)
		app.rootDir = output.config.options.rootDir;

	allSymbols = Object.values(output.index);
	const scripts = getUserScripts(application.scripts || [], 's');
	const userScripts = initRuntimeConfig(app);
	const readmePath = join(application.packageRoot, 'README.md');
	const version = app.modulePackage?.version;
	extraDocs =
		app.extra ||
		(existsSync(readmePath)
			? [{ items: [{ title: 'Home', file: readmePath, index: true }] }]
			: []);

	modules = [];
	const extraFiles = extraDocs.flatMap(section =>
		section.items.map(renderExtraFile),
	);
	const staticFiles: File[] = [
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
	const files: File[] = [...extraFiles, ...output.modules.flatMap(Module)];
	const versionFiles: File[] = [];
	const footer = '</cxl-page></cxl-application>';
	const config = getConfigScript(version ? '../version.json' : '');

	let content = '<cxl-router-outlet></cxl-router-outlet><cxl-router>';
	const header = Header(config, scripts);

	files.forEach(doc => {
		if (app.spa) {
			content += Route(doc);
		} else doc.content = header + doc.content + footer;
	});

	if (version) {
		versionFiles.push(
			{
				name: 'index.html',
				content: `<script>location='${version}/'+location.search</script>`,
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
		);
	}

	if (app.spa) {
		if (app.sitemap) {
			const base = app.sitemap;
			const sitemap = {
				name: 'sitemap.xml',
				content:
					'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
					files
						.map(
							doc =>
								`<url><loc>${base}/${
									version ? `${version}/` : ''
								}?${doc.name}</loc></url>`,
						)
						.join('') +
					'</urlset>',
			};
			staticFiles.push(sitemap);
		}

		if (version) {
			return [
				...versionFiles,
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
				content: header + content + '</cxl-router>' + footer,
			},
			...staticFiles,
		];
	}

	if (version) {
		files.push({
			name: `index.html`,
			content:
				getConfigScript('../version.json') +
				header +
				content +
				'</cxl-router>' +
				footer,
		});
	} else
		files.push({
			name: 'index.html',
			content: header + content + '</cxl-router>' + footer,
		});

	files.push(...staticFiles);

	const result: File[] = version
		? [...files.map(versionPrefix.bind(0, version)), ...versionFiles]
		: files;

	return result;
}
