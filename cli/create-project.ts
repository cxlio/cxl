import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { Logger } from '@cxl/program';

interface File {
	path: string;
	content: string | File[];
}

export async function createFile(file: File, dir = '') {
	const filePath = join(dir, file.path);
	if (Array.isArray(file.content)) {
		await mkdir(filePath).catch(() => {
			/* ignore */
		});
		await Promise.all(file.content.map(f => createFile(f, filePath)));
	} else {
		await writeFile(filePath, file.content);
	}
}

export async function createFileSystem(files: File[], log: Logger) {
	await Promise.all(
		files.map(f => {
			log(`Creating ${f.path}`);
			createFile(f);
		})
	);
}

export async function projectFiles({ tsx, $ }: { $: string[]; tsx?: boolean }) {
	const name = $[0];
	const rootPkg = JSON.parse(await readFile('package.json', 'utf8'));
	const tsxVersion = tsx
		? JSON.parse(
				await readFile(join(__dirname, '../tsx/package.json'), 'utf8')
		  ).version
		: '';

	return [
		{
			path: name,
			content: [
				{
					path: `tsconfig.json`,
					content: `{
	"extends": "../tsconfig.json",
	"compilerOptions": {
		"outDir": "../dist/${name}"
	},
	"files": ["index.ts${tsx ? 'x' : ''}"],
	"references": [ ${tsx ? '{ "path": "../tsx" }' : ''}]
}
`,
				},
				{
					path: `index.ts${tsx ? 'x' : ''}`,
					content: ``,
				},
				{
					path: `package.json`,
					content: `{
	"name": "${rootPkg.name}${name}",
	"version": "0.0.1",${tsx ? '\n\t"browser": "amd/index.min.js",' : ''}
	"bugs": "${rootPkg.bugs}",
	"homepage": "${rootPkg.homepage}/${name}",
	"scripts": {
		"build": "node ../dist/build",
		"test": "npm run build && cd ../dist/${name} && node ../tester"
	},
	"dependencies": { ${tsx ? `"@cxl/tsx": "${tsxVersion}"` : ''} }
}`,
				},
				{
					path: `tsconfig.test.json`,
					content: `{
	"extends": "../tsconfig.json",
	"compilerOptions": {
		"outDir": "../dist/${name}"
	},
	"files": ["test.ts${tsx ? 'x' : ''}"],
	"references": [{ "path": "." }, { "path": "../spec" }]
}
`,
				},
				{
					path: `test.ts${tsx ? 'x' : ''}`,
					content: `import { spec } from '@cxl/spec';
import {  } from './index.js';

export default spec('${name}', s => {
	s.test('should load', a => {
		a.ok(get);
	});
});
`,
				},
			],
		},
	];
}
