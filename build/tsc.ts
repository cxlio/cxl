import { readFileSync, existsSync, promises } from 'fs';
import {
	CompilerOptions,
	CompilerHost,
	ScriptTarget,
	SourceFile,
	createProgram,
	getDefaultCompilerOptions,
	getEffectiveTypeRoots,
	fixupCompilerOptions,
	createSourceFile,
	normalizePath,
	ResolvedProjectReference,
	resolveModuleName,
	getLineAndCharacterOfPosition,
	getDefaultLibFilePath
} from 'typescript';

const DEFAULT_TARGET = ScriptTarget.ES2015;
const SOURCE_CACHE: Record<string, SourceFile> = {};
const FILE_CACHE: Record<string, string> = {};

class CustomCompilerHost implements CompilerHost {
	output: Record<string, string> = {};

	constructor(public options: CompilerOptions) {}

	getSourceFile(fileName: string) {
		// console.log('SOURCE ' + fileName);
		return (
			SOURCE_CACHE[fileName] ||
			(SOURCE_CACHE[fileName] = createSourceFile(
				fileName,
				FILE_CACHE[fileName] ||
					(FILE_CACHE[fileName] = readFileSync(fileName, 'utf8')),
				this.options.target || DEFAULT_TARGET
			))
		);
	}

	getDefaultLibFileName() {
		return getDefaultLibFilePath(this.options);
	}

	writeFile(name: string, text: string) {
		// console.log(`WRITE ${name}`);
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
		// console.log(`EXISTS? ${fileName}`);
		return existsSync(fileName);
	}

	readFile(name: string) {
		// console.log(`READ ${name}`);
		const cache = FILE_CACHE[name];
		return cache ? cache : (FILE_CACHE[name] = readFileSync(name, 'utf8'));
	}
}

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

export function tsc(inputFileName: string, options: CompilerOptions) {
	if (!options)
		try {
			options = JSON.parse(readFileSync('tsconfig.json')).compilerOptions;
		} catch (e) {
			options = {};
		}

	const diagnostics: any[] = [];
	const defaultOptions = getDefaultCompilerOptions();

	// mix in default options
	options = fixupCompilerOptions(
		{
			...defaultOptions,
			...{
				target: 'es2015',
				strict: true,
				moduleResolution: 'node',
				module: 'commonjs',
				allowJs: true,
				skipLibCheck: true,
				experimentalDecorators: true,
				jsx: 'react',
				jsxFactory: 'dom'
			},
			...options
		},
		diagnostics
	);

	if (options.lib)
		options.lib = options.lib.map(lib =>
			lib.endsWith('d.ts') ? lib : `lib.${lib}.d.ts`
		);

	// console.log(options);

	const compilerHost = new CustomCompilerHost(options);
	const program = createProgram([inputFileName], options, compilerHost);

	diagnostics.push(
		...program.getSyntacticDiagnostics(),
		...program.getSemanticDiagnostics(),
		...program.getOptionsDiagnostics()
	);

	if (diagnostics.length) {
		diagnostics.forEach(d => {
			if (d.file) {
				const { line, character } = getLineAndCharacterOfPosition(
					d.file,
					d.start
				);
				tscError(d, line + 1, character, d.messageText);
			} else console.error(`${d.messageText}`);
		});

		throw new Error('Typescript compilation failed');
	}

	program.emit();

	return compilerHost.output;
}
