import * as fs from 'fs/promises';
import { Package } from '../build';
import { checkNpms } from '../build/npm.js';
import { basename } from 'path';
import { renderMarkdown } from '../blog';

export type ProductType =
	| 'component'
	| 'kit'
	| 'library'
	| 'app'
	| 'game'
	| 'template';
export interface Links {
	bugs?: string;
	homepage?: string;
	npm?: string;
}

export interface Product {
	name: string;
	version?: string;
	license: string;
	description: string;
	id: string;
	title?: string;
	browserScript?: string;
	links?: Links;
	keywords?: string[];
	price?: number;
	screenshot?: string;
	search: string;
	type: ProductType;
	demo?: string;
	package?: string;
}

interface DocEntry {
	name: string;
	docs: { content: { tag: string; value: string }[] };
}

function getType(pkg: Package): ProductType {
	if (pkg.bin) return 'app';
	if (/\/ui.*/.test(pkg.name)) return 'kit';
	if (pkg.keywords?.[0]) return pkg.keywords[0] as any;
	return 'library';
}

function getDescription(component: DocEntry) {
	const value = component.docs?.content?.find(c => !c.tag)?.value;
	return value?.split('.')?.[0] || '';
}

async function findExample(pkg: Package, entry: DocEntry) {
	if (pkg.browser && entry.docs && entry.docs.content)
		for (const content of entry.docs.content) {
			if (content.tag === 'demo' || content.tag === 'example') {
				return (
					(pkg.name !== '@cxl/ui'
						? `<script src="assets/@cxl-ui-index.bundle.min.js"></script>`
						: '') +
					`<script src="assets/${pkg.name.replace(
						/\//g,
						'-'
					)}-${basename(
						pkg.browser
					)}"></script><body style="overflow:hidden;font-family:var(--cxl-font);margin:16px 16px 0 16px;text-align:center">${
						content.value
					}</body>`
				);
			}
		}
}

async function findComponents(
	_dir: string,
	projectName: string,
	pkg: Package,
	result: Product[]
) {
	const path = `./docs/${projectName}/summary.json`;
	try {
		const docs = JSON.parse(await fs.readFile(path, 'utf8'));
		for (const doc of docs.index) {
			if (doc.docs?.tagName) {
				const description = getDescription(doc);
				const demo = await findExample(pkg, doc);
				if (demo) {
					result.push({
						id: doc.name,
						name: doc.name,
						version: '', //`${pkg.name} ${pkg.version}`,
						license: pkg.license,
						package: pkg.name,
						links: {
							homepage: pkg.homepage,
						},
						type: 'component',
						description,
						screenshot: demo
							? `assets/${doc.name}-example.png`
							: undefined,
						demo,
						search: `${doc.name} ${description}`,
					});
				}
			}
		}
	} catch (e) {
		console.error(`Could not generate component data for "${pkg.name}"`);
		console.error(e);
	}
}

async function processPackage(dir: string, name: string, result: Product[]) {
	const path = `${dir}/${name}`;
	try {
		const pkg = JSON.parse(
			await fs.readFile(`${path}/package.json`, 'utf8')
		);
		if (!pkg.private) {
			const npms = await checkNpms(pkg.name);
			const published = npms?.collected?.metadata;
			if (!published)
				return console.log(
					`Ignoring unpublished package ${pkg.name} ${pkg.version}`
				);
			const keywords = pkg.keywords || ['library'];
			const id = pkg.name.replace(/\//g, '-');
			result.push({
				id,
				name: pkg.name,
				version: published.version,
				description: pkg.description,
				license: published.license,
				links: published.links,
				browserScript: pkg.browser,
				keywords,
				search: `${pkg.name} ${pkg.description} ${keywords.join(' ')}`,
				type: getType(pkg),
			});

			if (pkg.browser)
				await fs
					.readFile(`${path}/${pkg.browser}`, 'utf8')
					.then(src =>
						fs.writeFile(
							`./docs/assets/${pkg.name.replace(
								/\//g,
								'-'
							)}-${basename(pkg.browser)}`,
							src
						)
					);

			if (published.readme)
				published.readmeHtml = renderMarkdown(published.readme).content;

			await findComponents(dir, name, pkg, result);
		} else console.log(`Ignoring private project ${path}`);
	} catch (e) {
		console.error(e);
		console.error(`Ignoring ${path}`);
	}
}

const TemplateDir = '../cxl.app/templates';
const MetaRegex = /^<!--[^]*-->/m;
const MetaLineRegex = /^(.+)\s*:\s*(.+)$/gm;

async function processTemplate(name: string): Promise<Product> {
	const file = `${TemplateDir}/${name}`;
	const source = await fs.readFile(file, 'utf8');
	const id = name.replace(/\.html$/, '');
	const meta = MetaRegex.exec(source)?.[0];
	const result: any = {};
	let match: RegExpMatchArray | null;

	if (meta)
		while ((match = MetaLineRegex.exec(meta))) {
			result[match[1]] = match[2];
		}

	return {
		id,
		name: result.title || id,
		license: 'UNLICENSED',
		screenshot: `assets/${id}-template.png`,
		description: result.description || '',
		type: 'template',
		search: (result.description || '') + (result.title || ''),
	};
}

async function findTemplates(dir: string, result: Product[]) {
	// Templates
	const templates = await fs.readdir(dir);
	const promises: Promise<Product>[] = [];
	for (const tpl of templates) {
		if (tpl.endsWith('.html')) {
			promises.push(processTemplate(tpl));
		}
	}
	result.push(...(await Promise.all(promises)));
	return result;
}

async function findProjects(dir: string) {
	const result: Product[] = [];
	const dirs = await fs.readdir(dir);

	for (const name of dirs) {
		const path = `${dir}/${name}`;
		if ((await fs.stat(path)).isDirectory()) {
			await processPackage(dir, name, result);
		}
	}

	await findTemplates(TemplateDir, result);

	return result;
}

function getStats(products: Product[]) {
	const stats = {
		components: 0,
		libraries: 0,
		kits: 0,
		templates: 0,
	};
	products.forEach(p => {
		if (p.type === 'component') stats.components++;
		else if (p.type === 'kit') stats.kits++;
		else if (p.type === 'library') stats.libraries++;
		else if (p.type === 'template') stats.templates++;
	});

	return stats;
}

async function buildList() {
	const products = [...(await findProjects('./dist'))];

	const json = {
		products,
		stats: getStats(products),
	};

	await fs.writeFile('./docs/data.json', JSON.stringify(json));
}

buildList();
