import { relative } from 'path';
import {
	BuilderProgram,
	Diagnostic,
	ParseConfigFileHost,
	createProgram,
	getLineAndCharacterOfPosition,
	Program,
	ExitStatus,
	InvalidatedProject,
	CreateProgramOptions,
	getParsedCommandLineOfConfigFile,
	createSolutionBuilder,
	createSolutionBuilderHost,
	BuildOptions,
	ParsedCommandLine,
	sys,
} from 'typescript';
import { Subscriber, Observable } from '../rx';
export { version as tscVersion } from 'typescript';

interface Output {
	path: string;
	source: string;
}

const parseConfigHost: ParseConfigFileHost = {
	useCaseSensitiveFileNames: true,
	readDirectory: sys.readDirectory,
	getCurrentDirectory: sys.getCurrentDirectory,
	fileExists: sys.fileExists,
	readFile: sys.readFile,
	onUnRecoverableConfigFileDiagnostic(e) {
		throw e;
	},
};

function tscError(d: Diagnostic, line: number, _ch: number, msg: any) {
	console.log(d.file?.getSourceFile());
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

function buildDiagnostics(program: Program | BuilderProgram) {
	return [
		...program.getConfigFileParsingDiagnostics(),
		...program.getSyntacticDiagnostics(),
		...program.getSemanticDiagnostics(),
		...program.getOptionsDiagnostics(),
	];
}

function printDiagnostics(diagnostics: Diagnostic[]) {
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

function parseTsConfig(tsconfig: string) {
	let parsed: ParsedCommandLine | undefined;
	try {
		parsed = getParsedCommandLineOfConfigFile(
			tsconfig,
			{},
			parseConfigHost
		);
	} catch (e) {
		throw new Error(e.messageText);
	}

	if (!parsed) throw new Error(`Could not parse config file "${tsconfig}"`);
	return parsed;
}

export function tsbuild(
	tsconfig = 'tsconfig.json',
	subs: Subscriber<Output>,
	options: BuildOptions = {}
) {
	const parsed = parseTsConfig(tsconfig);
	const host = createSolutionBuilderHost();
	const builder = createSolutionBuilder(host, [tsconfig], options);
	const relativePath = parsed.options.outDir || process.cwd();
	let program: InvalidatedProject<any> | undefined;

	function writeFile(name: string, source: string) {
		name = relative(relativePath, name);
		subs.next({ path: name, source });
	}

	while ((program = builder.getNextInvalidatedProject())) {
		const status = program.done(undefined, writeFile);
		if (status !== ExitStatus.Success)
			throw `${program.project}: Typescript compilation failed`;
	}
}

export function tsc(options: CreateProgramOptions) {
	return new Observable<Output>(_subs => {
		// const host = createCompilerHost(options);
		const program = createProgram(options);
		const diagnostics = buildDiagnostics(program);

		if (diagnostics.length) {
			printDiagnostics(diagnostics);
			throw `Typescript compilation failed`;
		}

		program.emit(undefined, (name: string, _source: string) => {
			console.log(name);
		});
	});
}
