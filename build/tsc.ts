import { resolve, relative, join } from 'path';
import * as ts from 'typescript';
import {
	BuilderProgram,
	BuildOptions,
	Diagnostic,
	ModuleKind,
	ParsedCommandLine,
	getLineAndCharacterOfPosition,
	getParsedCommandLineOfConfigFile,
	Program,
	ExitStatus,
	InvalidatedProject,
	createSolutionBuilder,
	createSolutionBuilderHost,
	ParseConfigFileHost,
	sys,
} from 'typescript';
import type { Output } from '@cxl/source';
import { Observable, Subscriber } from '@cxl/rx';
export { version as tscVersion, BuildOptions } from 'typescript';

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
		...program.getOptionsDiagnostics(),
		...program.getGlobalDiagnostics(),
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

function getBuilder(
	tsconfig = 'tsconfig.json',
	defaultOptions: BuildOptions = { module: ModuleKind.CommonJS }
) {
	const tsconfigJson = require(join(process.cwd(), tsconfig));
	const outputDir: string = tsconfigJson.compilerOptions?.outDir;
	if (!outputDir) throw new Error(`No outDir field set in ${tsconfig}`);

	const host = createSolutionBuilderHost(sys);
	const builder = createSolutionBuilder(host, [tsconfig], defaultOptions);
	return { outputDir, builder };
}

export function tsbuild(
	tsconfig = 'tsconfig.json',
	subs: Subscriber<Output>,
	defaultOptions: BuildOptions = { module: ModuleKind.CommonJS }
) {
	const { outputDir, builder } = getBuilder(tsconfig, defaultOptions);
	let program: InvalidatedProject<any> | undefined;

	function writeFile(name: string, source: string) {
		name = relative(outputDir, name);
		subs.next({ path: name, source: Buffer.from(source) });
	}

	while ((program = builder.getNextInvalidatedProject())) {
		const status = program.done(undefined, writeFile);
		if (status !== ExitStatus.Success)
			throw `${program.project}: Typescript compilation failed`;
	}
}

export function tsconfig(tsconfig = 'tsconfig.json', options?: BuildOptions) {
	return new Observable<Output>(subs => {
		tsbuild(tsconfig, subs, options);
		subs.complete();
	});
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

export function flagsToString(flags: any, Flags: any) {
	const result = [];
	for (const i in Flags) {
		if (Flags[i] & flags) result.push(i);
	}
	return result;
}

function findImports(
	src: ts.SourceFile,
	program: ts.Program,
	result: Set<string> = new Set()
) {
	const typeChecker = program.getTypeChecker();

	src.forEachChild(node => {
		if (
			(ts.isImportDeclaration(node) &&
				(!node.importClause || !node.importClause.isTypeOnly)) ||
			(ts.isExportDeclaration(node) && !node.isTypeOnly)
		) {
			if (!node.moduleSpecifier) return;

			const symbol = typeChecker.getSymbolAtLocation(
				node.moduleSpecifier
			);
			const childSourceFile = symbol?.valueDeclaration;
			if (
				childSourceFile &&
				ts.isSourceFile(childSourceFile) &&
				!childSourceFile.isDeclarationFile &&
				!result.has(childSourceFile.fileName)
			) {
				result.add(childSourceFile.fileName);
				findImports(childSourceFile, program, result);
			}
		}
	});

	return result;
}

function bundleFiles(config: ts.ParsedCommandLine) {
	const host = ts.createCompilerHost(config.options);
	const program = ts.createProgram(config.fileNames, config.options, host);
	const result = new Set<string>([__dirname + '/amd.js']);
	program.getRootFileNames().forEach(file => {
		const src = program.getSourceFile(file);
		result.add(file);
		if (src) findImports(src, program, result);
	});
	return { host, program, result };
}

export function bundle(
	tsconfig = 'tsconfig.json',
	outFile = 'index.bundle.js'
) {
	return new Observable<Output>(subs => {
		const config = parseTsConfig(tsconfig);
		const { host, result } = bundleFiles(config);
		config.options.module = ts.ModuleKind.AMD;
		config.options.outFile = outFile;
		config.options.rootDir = resolve('../..');
		config.options.baseDir = process.cwd();

		const rootNames = Array.from(result);
		const program = ts.createProgram(rootNames, config.options, host);

		function writeFile(name: string, source: string) {
			subs.next({ path: name, source: Buffer.from(source) });
		}

		const diagnostics = buildDiagnostics(program);
		if (diagnostics.length) {
			printDiagnostics(diagnostics);
			return subs.error('Failed to compile');
		}
		program
			.getSourceFiles()
			.forEach(
				src =>
					(src.isDeclarationFile = !rootNames.includes(src.fileName))
			);
		program.emit(undefined, writeFile);
		subs.complete();
	});
}
