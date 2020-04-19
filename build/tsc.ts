import { readFileSync, existsSync } from 'fs';
import { relative } from 'path';
import {
	BuilderProgram,
	CompilerOptions,
	CompilerHost,
	ScriptTarget,
	SourceFile,
	Diagnostic,
	Program,
	IncrementalProgramOptions,
	ParseConfigFileHost,
	createProgram,
	getDefaultCompilerOptions,
	createSourceFile,
	getLineAndCharacterOfPosition,
	getDefaultLibFilePath,
	convertCompilerOptionsFromJson,
	ModuleKind,
	//	InvalidatedProjectKind,
	ExitStatus,
	createIncrementalProgram,
	CreateProgramOptions,
	getParsedCommandLineOfConfigFile,
	createSolutionBuilder,
	createSolutionBuilderHost,
	BuildOptions,
	ParsedCommandLine,
	sys
} from 'typescript';
import { Subscription } from '../rx';
export { version as tscVersion } from 'typescript';

const DEFAULT_TARGET = ScriptTarget.ES2015;
const SOURCE_CACHE: Record<string, SourceFile> = {};
const FILE_CACHE: Record<string, string> = {};

interface Output {
	path: string;
	source: string;
}

class CustomCompilerHost implements CompilerHost {
	output: Record<string, string> = {};

	constructor(public options: CompilerOptions) {}

	private createSourceFile(fileName: string, languageVersion: ScriptTarget) {
		const result = createSourceFile(
			fileName,
			this.readFile(fileName),
			languageVersion || DEFAULT_TARGET
		);
		(result as any).version = 0;
		return result;
	}

	getSourceFile(fileName: string, languageVersion: ScriptTarget) {
		return (
			SOURCE_CACHE[fileName] ||
			(SOURCE_CACHE[fileName] = this.createSourceFile(
				fileName,
				languageVersion
			))
		);
	}

	getDefaultLibFileName() {
		return getDefaultLibFilePath(this.options);
	}

	writeFile(name: string, text: string) {
		const relativePath = this.options.outDir || process.cwd();
		name = relative(relativePath, name);

		this.output[name] = text;
	}

	useCaseSensitiveFileNames() {
		return true;
	}

	getCanonicalFileName(fileName: string) {
		return fileName;
	}

	getCurrentDirectory() {
		return process.cwd();
	}

	getNewLine() {
		return '\n';
	}

	fileExists(fileName: string) {
		return existsSync(fileName);
	}

	readFile(name: string) {
		const cache = FILE_CACHE[name];
		return cache ? cache : (FILE_CACHE[name] = readFileSync(name, 'utf8'));
	}
}

const parseConfigHost: ParseConfigFileHost = {
	useCaseSensitiveFileNames: true,
	readDirectory: sys.readDirectory,
	getCurrentDirectory: sys.getCurrentDirectory,
	fileExists: sys.fileExists,
	readFile: sys.readFile,
	onUnRecoverableConfigFileDiagnostic(e) {
		throw e;
	}
};

function tscError(d: any, line: number, _ch: number, msg: any) {
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

function createCustomProgram(programOptions: CreateProgramOptions) {
	const options = programOptions.options;

	if (options.module === ModuleKind.AMD && options.outFile)
		programOptions.projectReferences = [
			{
				path: __dirname + '/tsconfig.amd.json',
				prepend: true
			}
		];

	return createProgram(programOptions);
}

function normalizeCompilerOptions(options: CompilerOptions) {
	const defaultOptions = getDefaultCompilerOptions();

	return convertCompilerOptionsFromJson(
		{
			...defaultOptions,
			...{
				target: 'es2015',
				strict: true,
				sourceMap: true,
				moduleResolution: 'node',
				module: 'es6',
				allowJs: true,
				skipLibCheck: true,
				experimentalDecorators: true,
				jsx: 'react',
				jsxFactory: 'dom'
			},
			...options
		},
		'.'
	).options;
}

function buildDiagnostics(program: Program | BuilderProgram) {
	return [
		...program.getConfigFileParsingDiagnostics(),
		...program.getSyntacticDiagnostics(),
		...program.getSemanticDiagnostics(),
		...program.getOptionsDiagnostics()
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
	subs: Subscription<Output>,
	options: BuildOptions = {}
) {
	const parsed = parseTsConfig(tsconfig);
	const host = createSolutionBuilderHost();
	const builder = createSolutionBuilder(host, [tsconfig], options);
	const relativePath = parsed.options.outDir || process.cwd();
	let program: any;

	function writeFile(name: string, source: string) {
		name = relative(relativePath, name);
		subs.next({ path: name, source });
	}

	while ((program = builder.getNextInvalidatedProject())) {
		const status = program.done(undefined, writeFile);
		if (status !== ExitStatus.Success)
			throw 'Typescript compilation failed';
	}
}

export function tsIncremental(tsconfig: string) {
	const parsed = parseTsConfig(tsconfig);
	const compilerHost = new CustomCompilerHost(parsed.options);
	const programOptions: IncrementalProgramOptions<BuilderProgram> = {
		rootNames: parsed.fileNames,
		projectReferences: parsed.projectReferences,
		host: compilerHost,
		options: parsed.options
	};

	const program = createIncrementalProgram(programOptions);
	const diagnostics = buildDiagnostics(program);

	if (diagnostics.length) printDiagnostics(diagnostics);

	program.emit();

	return compilerHost.output;
}

export function tsc(inputFileName: string, options: CompilerOptions) {
	let tsConfigOptions: CompilerOptions;
	try {
		tsConfigOptions =
			existsSync('tsconfig.json') &&
			JSON.parse(readFileSync('tsconfig.json', 'utf8')).compilerOptions;
	} catch (e) {
		tsConfigOptions = {};
		console.error(e);
	}

	options = normalizeCompilerOptions({ ...tsConfigOptions, ...options });

	const compilerHost = new CustomCompilerHost(options);
	const programOptions: CreateProgramOptions = {
		rootNames: [inputFileName],
		host: compilerHost,
		options
	};

	const program = createCustomProgram(programOptions);
	const diagnostics = buildDiagnostics(program);

	if (diagnostics.length) printDiagnostics(diagnostics);

	program.emit();

	return compilerHost.output;
}
