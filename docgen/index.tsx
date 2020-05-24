import { Application } from '../server';
import { promises } from 'fs';
import type { JSONOutput } from 'typedoc';

const FUNCTION_KIND = 64;
const CLASS_KIND = 128;
const CALL_KIND = 4096;

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

function escape(str: string) {
	return str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e]);
}

function TypeArguments(types?: { type?: string; name?: string }[]) {
	return types
		? '<b>&lt;</b>' +
				types.map(t => ('name' in t ? t.name : '')).join(', ') +
				'<b>&gt;</b>'
		: '';
}

function SignatureType(type: DeclarationType): string {
	if (!type) return '';

	if (type.signatures) return type.signatures.map(Signature).join(' | ');

	if (type.type === 'union' && 'types' in type)
		return type.types.map(SignatureType).join(' | ');

	if (type.type === 'array' && 'elementType' in type)
		return `${SignatureType(type.elementType)}[]`;

	if (type.type === 'query') return `typeof ${SignatureType(type.queryType)}`;

	if ('name' in type)
		return `${Link(type.id, type.name)}${
			'typeArguments' in type ? TypeArguments(type.typeArguments) : ''
		}`;

	if ('declaration' in type && type.declaration)
		return SignatureType(type.declaration);

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
	const prefix = flags.isConst ? 'const ' : '';
	const parameterString =
		kind === FUNCTION_KIND || kind === CALL_KIND
			? SignatureParameters(parameters)
			: '';
	const actualName =
		name === '__call' ? '' : name + (flags.isOptional ? '?' : '');
	const typeColon = name === '__call' ? ' => ' : ': ';

	return signatures
		? signatures.map(Signature).join('<br/>')
		: `<b>${prefix}</b>${actualName}${TypeArguments(
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
	return `<cxl-navbar><cxl-c pad16><cxl-t h6>${name}</cxl-t></cxl-c>
		<cxl-hr></cxl-hr>
		${children?.map(
			m =>
				`<cxl-c pad16><cxl-t subtitle2>${
					m.name
				}</cxl-t></cxl-c>${ModuleNavbar(m)}`
		)}
		</cxl-navbar>`;
}

function ClassSignature(p: JSONOutput.Reflection) {
	return `${p.name} CLASS`;
}

function Anchor(id: number, name: string = '') {
	const anchor = `s${id}`;
	return `<a name="${anchor}">${name}</a>`;
}

function ModuleBody(json: Container) {
	const { children, groups } = json;
	const index: any = {};
	const groupBody: any = {};

	if (!groups) return;

	if (children)
		children.forEach((c: any) => {
			if (!index[c.kind]) index[c.kind] = [];
			if (!groupBody[c.kind]) groupBody[c.kind] = [];

			index[c.kind].push(`<cxl-c sm4 lg3>${Link(c.id, c.name)}</cxl-c>`);

			if (c.kind !== CLASS_KIND)
				groupBody[c.kind].push(`${Anchor(c.id)}<cxl-card><cxl-c pad16>
		<cxl-t subtitle>${
			c.kind === CLASS_KIND ? ClassSignature(c) : Signature(c)
		}</cxl-t>
	</cxl-c></cxl-card>
		`);
		});

	return (
		`<cxl-page><cxl-t h4>${json.name}</cxl-t>` +
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
					`<cxl-t h4>${group.title}</cxl-t>${groupBody[
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
	<script>require('../../ui-ts/index.js');</script>
	<cxl-root><title>${p.name}</title><cxl-meta></cxl-meta><cxl-appbar>
	${Navbar(p)}
	<a href="index.html"><cxl-appbar-title>${
		p.name
	}</cxl-appbar-title></a></cxl-appbar>`;
}

function ModuleHeader(_p: Container) {
	return '';
}

function ModuleFooter(_p: Container) {
	return `</cxl-root>`;
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

		try {
			await promises.mkdir('docs');
		} catch (e) {
			this.log(`Error creating "docs" directory. Ignoring.`);
		}

		await this.generateModules(json);
		console.log(anchors);
	}
}

const app = new DocGen();
app.start();
