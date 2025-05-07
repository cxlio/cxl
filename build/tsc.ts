import { resolve, relative } from 'path';
import type { Output } from '@cxl/source';
import { Observable, Subscriber } from '@cxl/rx';
import type {
	BuilderProgram,
	BuildOptions,
	Diagnostic,
	FormatDiagnosticsHost,
	Program,
	SourceFile,
	ParsedCommandLine,
	InvalidatedProject,
	ParseConfigFileHost,
} from 'typescript';

const tsPath = require.resolve('typescript', {
	paths: [process.cwd(), __dirname],
});
const ts = require(tsPath) as typeof import('typescript');
const sys = ts.sys;
const AMD = require('fs').readFileSync(__dirname + '/amd.js');

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

const diagnosticsHost: FormatDiagnosticsHost = {
	getCurrentDirectory: sys.getCurrentDirectory,
	getNewLine: () => '\n',
	getCanonicalFileName: n => n,
};

export const tscVersion = ts.version;

export function buildDiagnostics(program: Program | BuilderProgram) {
	return [
		...program.getConfigFileParsingDiagnostics(),
		...program.getOptionsDiagnostics(),
		...program.getGlobalDiagnostics(),
		...program.getDeclarationDiagnostics(),
	];
}

export function printDiagnostics(
	diagnostics: Diagnostic[],
	host = diagnosticsHost,
) {
	console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, host));

	throw new Error('Typescript compilation failed');
}

function getBuilder(
	tsconfig = 'tsconfig.json',
	defaultOptions: BuildOptions = { module: ts.ModuleKind.CommonJS },
) {
	const host = ts.createSolutionBuilderHost(sys);
	const options = parseTsConfig(tsconfig);

	if (options.errors?.length) {
		printDiagnostics(options.errors);
	}

	const outputDir = options.options.outDir;
	if (!outputDir) throw new Error(`No outDir field set in ${tsconfig}`);

	if (options.options.module === ts.ModuleKind.ESNext) {
		const oldRead = host.readFile;
		host.readFile = (...args) => {
			const src = oldRead.apply(host, args);
			return src?.replace(/^\/\/\/.+/, '');
		};
	}
	const builder = ts.createSolutionBuilder(host, [tsconfig], defaultOptions);
	return { outputDir, builder, options };
}

export function tsbuild(
	tsconfig = 'tsconfig.json',
	subs: Subscriber<Output>,
	defaultOptions: BuildOptions = { module: ts.ModuleKind.CommonJS },
	outDir?: string,
) {
	const { options, outputDir, builder } = getBuilder(
		tsconfig,
		defaultOptions,
	);
	let program: InvalidatedProject<any> | undefined;
	function writeFile(name: string, source: string) {
		name = relative(outDir || outputDir, name);
		if (options.raw.cxl?.amd) source = AMD + source;
		subs.next({ path: name, source: Buffer.from(source) });
	}

	while ((program = builder.getNextInvalidatedProject())) {
		const status = program.done(undefined, writeFile);
		if (status !== ts.ExitStatus.Success)
			throw `${program.project}: Typescript compilation failed`;
	}
}

export function tsconfig(
	tsconfig = 'tsconfig.json',
	options?: BuildOptions,
	outputDir?: string,
) {
	return new Observable<Output>(subs => {
		tsbuild(tsconfig, subs, options, outputDir);
		subs.complete();
	});
}

function parseTsConfig(tsconfig: string) {
	let parsed: ParsedCommandLine | undefined;
	try {
		parsed = ts.getParsedCommandLineOfConfigFile(
			tsconfig,
			{},
			parseConfigHost,
		);
	} catch (e) {
		if (e instanceof Error) throw e;
		const msg =
			(e as any)?.message || (e as any)?.messageText || 'Unknown Error';
		throw new Error(msg);
	}

	if (!parsed) {
		console.log(process.cwd());
		throw new Error(`Could not parse config file "${tsconfig}"`);
	}

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
	src: SourceFile,
	program: Program,
	result: Set<string> = new Set(),
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
				node.moduleSpecifier,
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

function bundleFiles(config: ParsedCommandLine, amd: boolean) {
	const host = ts.createCompilerHost(config.options);
	const program = ts.createProgram(config.fileNames, config.options, host);
	const result = new Set<string>([]);
	if (amd) result.add(__dirname + '/amd.js');
	program.getRootFileNames().forEach(file => {
		const src = program.getSourceFile(file);
		result.add(file);
		if (src) findImports(src, program, result);
	});
	return { host, program, result };
}

export function bundle(
	tsconfig = 'tsconfig.json',
	outFile = 'index.bundle.js',
	amd = false,
) {
	return new Observable<Output>(subs => {
		const config = parseTsConfig(tsconfig);
		const { host, result } = bundleFiles(config, amd);
		config.options.module = ts.ModuleKind.AMD;
		config.options.outFile = outFile;
		config.options.rootDir ||= resolve('../..');
		config.options.baseDir ||= process.cwd();
		if (amd) config.options.allowJs = true;

		const rootNames = Array.from(result);
		const program = ts.createProgram(rootNames, config.options, host);

		function writeFile(name: string, source: string) {
			subs.next({ path: name, source: Buffer.from(source) });
		}

		const diagnostics = buildDiagnostics(program);
		if (diagnostics.length) {
			printDiagnostics(diagnostics, host);
			return subs.error('Failed to compile');
		}
		program
			.getSourceFiles()
			.forEach(
				src =>
					(src.isDeclarationFile = !rootNames.includes(src.fileName)),
			);
		program.emit(undefined, writeFile);
		subs.complete();
	});
}
