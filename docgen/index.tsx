import { Application } from '../server';
import { promises } from 'fs';
import type { JSONOutput } from 'typedoc';

const FUNCTION_KIND = 64;
const CLASS_KIND = 128;
const CALL_KIND = 4096;
const TYPE_PARAMETER_KIND = 131072;

type Project = JSONOutput.ProjectReflection;
type Container = JSONOutput.ContainerReflection;
type Declaration = JSONOutput.DeclarationReflection;
type DeclarationType = any; //Declaration['type'];
type Parameter = JSONOutput.ParameterReflection;

const ENTITIES_REGEX = /[&<]/g;
const ENTITIES_MAP = {
	'&': '&amp;',
	'<': '&lt;',
};
const anchors: Record<number, string> = {};

let currentFile: string;
let pkg: any;
let sourceUrl: string | { url: string };

function escape(str: string) {
	return str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e]);
}

function TypeArguments(
	types?: {
		kind?: number;
		type?: DeclarationType;
		name?: string;
		constraint?: DeclarationType;
	}[]
) {
	return types
		? '<b>&lt;</b>' +
				types
					.map(
						t =>
							(t.name ? t.name : '') +
							(t.type && t.kind === TYPE_PARAMETER_KIND
								? ` extends ${SignatureType(t.type)}`
								: '')
					)
					.join(', ') +
				'<b>&gt;</b>'
		: '';
}

function SignatureType(type: DeclarationType): string {
	if (!type) return '';

	if (type.signatures) return type.signatures.map(Signature).join(' | ');

	if (type.type === 'typeOperator')
		return ` keyof ${SignatureType(type.target)}`;

	if (type.type === 'union' && 'types' in type)
		return type.types.map(SignatureType).join(' | ');

	if (type.type === 'array' && 'elementType' in type)
		return `${SignatureType(type.elementType)}[]`;

	if (type.type === 'query') return `typeof ${SignatureType(type.queryType)}`;

	if (type.name)
		return `${Link(type.id, type.name)}${
			'typeArguments' in type ? TypeArguments(type.typeArguments) : ''
		}`;

	if (type.declaration) return SignatureType(type.declaration);

	console.log(type);
	throw new Error('Declaration type not supported');
}

function SignatureValue(val?: string) {
	return val ? ` = ${escape(val)}` : '';
}

function Parameter(p: Parameter) {
	const name = `${p.flags.isRest ? '...' : ''}${p.name}`;
	return `${name}: ${SignatureType(p.type)}`;
}

function SignatureParameters(parameters?: Parameter[]) {
	if (!parameters) return '()';

	return `<b>(</b>${parameters.map(Parameter).join(', ')}<b>)</b>`;
}

function getHref(id: number) {
	const href = anchors[id];
	if (!href) throw new Error(`Link to ${id} not found`);
	return href;
}

function Link(id: number, name: string) {
	const escaped = escape(name);
	return id && name !== '__type'
		? `<a href="${getHref(id)}">${escaped}</a>`
		: escaped;
}

function Chip(label: string) {
	return `<cxl-chip little primary>${label}</cxl-chip> `;
}

function Flags(flags: JSONOutput.ReflectionFlags) {
	return (
		(flags.isConst ? Chip('const') : '') +
		(flags.isProtected ? Chip('protected') : '') +
		(flags.isAbstract ? Chip('abstract') : '')
	);
}

function Signature({
	flags,
	kind,
	name,
	type,
	signatures,
	defaultValue,
	parameters,
	typeParameter,
}: Declaration): string {
	const prefix = Flags(flags);
	const parameterString =
		kind === FUNCTION_KIND || kind === CALL_KIND
			? SignatureParameters(parameters)
			: '';
	const actualName =
		name === '__call' ? '' : name + (flags.isOptional ? '?' : '');
	const typeColon = name === '__call' ? ' => ' : ': ';

	return signatures
		? signatures.map(Signature).join('<br/>')
		: `${prefix}${actualName}${TypeArguments(
				typeParameter
		  )}${parameterString}${typeColon}${
				SignatureType(type) || 'any'
		  }${SignatureValue(defaultValue)}`;
}

function ModuleNavbar({ id, children }: Container) {
	return (
		`<cxl-item href="${getHref(id)}"><i>Index</i></cxl-item>` +
		children
			?.map(c => `<cxl-item href="${getHref(c.id)}">${c.name}</cxl-item>`)
			.join('')
	);
}

function Navbar({ name, children }: Container) {
	return `<cxl-navbar><cxl-c pad16><cxl-t h6>${name} <small>${
		pkg?.version || ''
	}</small></cxl-t></cxl-c>
		<cxl-hr></cxl-hr>
		${children?.map(
			m =>
				`<cxl-c pad16><cxl-t subtitle2>${
					m.name
				}</cxl-t></cxl-c>${ModuleNavbar(m)}`
		)}
		</cxl-navbar>`;
}

function Anchor(id: number, name: string = '') {
	const anchor = `s${id}`;
	return `<a name="${anchor}">${name}</a>`;
}

function getSourceLink(src: JSONOutput.SourceReference) {
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
}

function Table(headers: string[], rows: string[][]) {
	return `<cxl-table>
		<cxl-tr>${headers.map(h => `<cxl-th>${h}</cxl-th>`).join('')}</cxl-tr>
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

function MemberBody(c: Declaration) {
	let result: string = c.signatures
		? c.signatures.map(sig => MemberBody(sig)).join('')
		: `<cxl-t subtitle>${Signature(c)}</cxl-t>`;

	if (c.parameters)
		result +=
			'<br/><cxl-t subtitle2>Parameters</cxl-t>' +
			Table(
				['Name', 'Description'],
				c.parameters.map(p => [p.name, ''])
			) +
			'<br/>';

	return result;
}

function MemberCard(c: Declaration) {
	return `${Anchor(c.id)}<cxl-card><cxl-c pad16>
		${Source(c.sources)}${MemberBody(c)}
		</cxl-c></cxl-card>`;
}

function ModuleBody(json: Declaration) {
	const { children, groups } = json;
	const index: any = {};
	const groupBody: any = {};

	if (!groups) return;

	if (children)
		children.forEach((c: any) => {
			if (!index[c.kind]) index[c.kind] = [];
			if (!groupBody[c.kind]) groupBody[c.kind] = [];

			index[c.kind].push(`<cxl-c sm4 lg3>${Link(c.id, c.name)}</cxl-c>`);

			if (c.kind !== CLASS_KIND) groupBody[c.kind].push(MemberCard(c));
		});

	const moduleType = json.typeParameter
		? TypeArguments(json.typeParameter)
		: '';
	const extendsName = json.extendedTypes
		? `<small> extends ${json.extendedTypes
				.map(SignatureType)
				.join(', ')}</small>`
		: '';
	const moduleName = json.name.replace(/\.tsx?$/, '');

	return (
		`<cxl-page><cxl-t h4>${moduleName}${moduleType}${extendsName}</cxl-t>` +
		groups
			.map(
				(group: any) =>
					`<cxl-card><cxl-c pad16><cxl-t h5>${
						group.title
					}</cxl-t><br/><cxl-grid>${index[group.kind].join(
						''
					)}</cxl-grid></cxl-c></cxl-card>`
			)
			.join('<br/>') +
		'<br/>' +
		groups
			.filter((group: any) => group.kind !== CLASS_KIND)
			.map(
				(group: any) =>
					`<br /><cxl-t h4>${group.title}</cxl-t>${groupBody[
						group.kind
					].join('<br />')}`
			)
			.join('<br />') +
		'</cxl-page>'
	);
}

function Header(p: Project) {
	return `<!DOCTYPE html>
	<script src="../../tester/require-browser.js"></script>
	<script>require('../../ui-ts/index.js');require('../../ui-ts/icons.js');</script>
	<cxl-application><title>${p.name}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(p)}
	<a href="index.html" style="text-decoration:none"><cxl-appbar-title>${
		p.name
	}</cxl-appbar-title></a></cxl-appbar>`;
}

function ModuleHeader(_p: Container) {
	return '';
}

function ModuleFooter(_p: Container) {
	return `</cxl-application>`;
}

function Module(p: Container) {
	return ModuleHeader(p) + ModuleBody(p) + ModuleFooter(p);
}

export class DocGen extends Application {
	name = '@cxl/docgen';

	generateContainer(project: Project, module: Container) {
		const name = (currentFile = module.name.replace(/(\.tsx?)?$/, '.html'));
		anchors[module.id] = name;
		this.generateAnchors(module);

		return () =>
			this.log(`Generating ${name} from ${module.name}`, () =>
				promises.writeFile(
					`docs/${name}`,
					Header(project) + Module(module)
				)
			);
	}

	generateAnchors(module: Container) {
		module.children?.forEach(
			c => (anchors[c.id] = `${currentFile}#s${c.id}`)
		);
	}

	async generateModuleFiles(project: Project, module: Container) {
		const renderModule = this.generateContainer(project, module);

		if (!module.children) return;

		await Promise.all(
			module.children
				.filter(child => child.kind === CLASS_KIND)
				.map(child => this.generateContainer(project, child))
				.map(render => render())
		);

		await renderModule();
	}

	generateModules(project: Project) {
		if (!project.children) return this.log(`No modules to output`);

		return Promise.all(
			project.children.map(m => this.generateModuleFiles(project, m))
		);
	}

	async run() {
		const json: Project = JSON.parse(
			await promises.readFile('docs.json', 'utf8')
		);
		pkg = JSON.parse(await promises.readFile('package.json', 'utf8'));
		sourceUrl = this.arguments?.repository || pkg.repository;

		try {
			await promises.mkdir('docs');
		} catch (e) {
			this.log(`Error creating "docs" directory. Ignoring.`);
		}

		await this.generateModules(json);
	}
}

const app = new DocGen();
app.start();
