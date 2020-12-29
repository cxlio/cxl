import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { SourceMapConsumer } from 'source-map';

interface RawSourceMap {
	version: string;
	file: string;
	sourceRoot: string;
	sources: string[];
	sourcesContent: string[];
	names: string[];
	mappings: string;
}

export interface Output {
	path: string;
	source: string;
	mtime?: number;
}

export interface Position {
	line: number;
	column: number;
}

/**
 * Source code range, starts at 0.
 */
export interface Range {
	start: number;
	end: number;
}

const SOURCEMAP_REGEX = /\/\/# sourceMappingURL=(.+)/;

export function indexToPosition(source: string, index: number): Position {
	let column = 0,
		line = 0;

	if (index > source.length)
		throw new Error(`Invalid index ${index}/${source.length}`);

	for (let i = 0; i < index; i++) {
		if (source[i] === '\n') {
			line++;
			column = 0;
		} else column++;
	}
	return { line, column };
}

export function positionToIndex(source: string, pos: Position) {
	let line = pos.line;
	const len = source.length;

	for (let i = 0; i < len; i++) {
		if (source[i] === '\n' && --line === 0) return i + pos.column + 1;
	}
	console.log(pos);
	throw new Error('Invalid Position');
}

function indexToPosOne(
	source: string,
	index: number
	//bias = SourceMapConsumer.GREATEST_LOWER_BOUND
) {
	const result = indexToPosition(source, index);
	result.line++;
	//result.bias = bias;
	return result;
}

export class SourceMap {
	path: string;
	dir: string;
	map: SourceMapConsumer;
	raw: RawSourceMap;

	constructor(path: string) {
		this.path = resolve(path);
		this.dir = dirname(this.path);
		this.raw = JSON.parse(readFileSync(this.path, 'utf8'));
		this.map = new SourceMapConsumer(this.raw);
	}

	translateRange(source: string, range: Range) {
		const sourceMap = this.map;
		const start = sourceMap.originalPositionFor(
			indexToPosOne(source, range.start)
		);
		const end = sourceMap.originalPositionFor(
			indexToPosOne(source, range.end)
		);
		if (start.source === null || end.source === null) {
			return;
		}

		start.source = resolve(this.dir, start.source);
		start.line--;
		end.source = resolve(this.dir, end.source);
		end.line--;

		return { start, end };
	}
}

export function getSourceMapPath(source: string, cwd: string) {
	const match = SOURCEMAP_REGEX.exec(source);
	return match ? resolve(cwd, match[1]) : '';
}

export function getSourceMap(sourcePath: string) {
	const source = readFileSync(sourcePath, 'utf8');
	const filePath = getSourceMapPath(source, dirname(sourcePath));
	return filePath ? new SourceMap(filePath) : undefined;
}

export class SourceFile {
	path: string;

	constructor(
		path: string,
		private $source?: string,
		private $sourceMap?: SourceMap
	) {
		this.path = resolve(path);
	}

	get source(): string {
		return this.$source || (this.$source = readFileSync(this.path, 'utf8'));
	}

	get sourceMap(): SourceMap | undefined {
		return this.$sourceMap || (this.$sourceMap = this.readSourceMap());
	}

	private readSourceMap() {
		const filePath = getSourceMapPath(this.source, dirname(this.path));
		return filePath ? new SourceMap(filePath) : undefined;
	}

	getLineAndColumn(index: number) {
		return indexToPosition(this.source, index);
	}

	getIndex(_line: number, _column: number) {}
}
