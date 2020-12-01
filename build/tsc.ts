import { relative, join } from 'path';
import {
	BuilderProgram,
	BuildOptions,
	Diagnostic,
	ModuleKind,
	getLineAndCharacterOfPosition,
	Program,
	ExitStatus,
	InvalidatedProject,
	createSolutionBuilder,
	createSolutionBuilderHost,
	sys,
} from 'typescript';
import { Subscriber } from '../rx';
export { version as tscVersion, BuildOptions } from 'typescript';

interface Output {
	path: string;
	source: string;
}

function tscError(d: Diagnostic, line: number, _ch: number, msg: any) {
	if (typeof msg === 'string')
		console.error(`[${d.file ? d.file.fileName : ''}:${line}] ${msg}`);
	else {
		do {
			console.error(
				`[${d.file ? d.file.fileName : ''}:${line}] ${msg.messageText}`
			);
		} while ((msg = msg.next && msg.next[0]));
	}
}

export function buildDiagnostics(program: Program | BuilderProgram) {
	return [
		...program.getConfigFileParsingDiagnostics(),
		...program.getSyntacticDiagnostics(),
		...program.getSemanticDiagnostics(),
		...program.getOptionsDiagnostics(),
	];
}

export function printDiagnostics(diagnostics: Diagnostic[]) {
	diagnostics.forEach(d => {
		if (d.file) {
			const { line, character } = getLineAndCharacterOfPosition(
				d.file,
				d.start || 0
			);
			tscError(d, line + 1, character, d.messageText);
		} else console.error(`${d.messageText}`);
	});

	throw new Error('Typescript compilation failed');
}

export function tsbuild(
	tsconfig = 'tsconfig.json',
	subs: Subscriber<Output>,
	defaultOptions: BuildOptions = { module: ModuleKind.CommonJS }
) {
	const tsconfigJson = require(join(process.cwd(), tsconfig));
	const outputDir = tsconfigJson.compilerOptions?.outDir;
	if (!outputDir) throw new Error(`No outDir field set in ${tsconfig}`);

	const host = createSolutionBuilderHost(sys);
	const builder = createSolutionBuilder(host, [tsconfig], defaultOptions);
	let program: InvalidatedProject<any> | undefined;

	function writeFile(name: string, source: string) {
		name = relative(outputDir, name);
		subs.next({ path: name, source });
	}

	while ((program = builder.getNextInvalidatedProject())) {
		const status = program.done(undefined, writeFile);
		if (status !== ExitStatus.Success)
			throw `${program.project}: Typescript compilation failed`;
	}
}
