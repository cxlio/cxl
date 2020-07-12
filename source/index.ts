import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { SourceMapConsumer } from 'source-map';

interface RawSourceMap {
	version: number;
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
}

export interface Position {
	line: number;
	column: number;
}

const SOURCEMAP_REGEX = /\/\/# sourceMappingURL=(.+)/;

export function indexToPosition(source: string, index: number): Position {
	let column = 0,
		line = 0;

	if (index > source.length) throw new Error('Invalid index');

	for (let i = 0; i < index; i++) {
		if (source[i] === '\n') {
			column++;
			line = 0;
		}
		line++;
	}
	return { line, column };
}

export class SourceMap {
	path: string;

	constructor(path: string, public raw?: RawSourceMap) {
		this.path = resolve(path);
		if (raw === undefined)
			this.raw = JSON.parse(readFileSync(this.path, 'utf8'));
	}

	translateRange(source: string, sourceMap: SourceMapConsumer, range: any) {
		const start = sourceMap.originalPositionFor(
			indexToPosition(source, range.start)
		);
		const end = sourceMap.originalPositionFor(
			indexToPosition(source, range.end)
		);
		return { start, end };
	}
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
		const match = SOURCEMAP_REGEX.exec(this.source);
		const filePath = match && resolve(dirname(this.path), match[1]);

		return filePath ? new SourceMap(filePath) : undefined;
	}

	getLineAndColumn(index: number) {
		return indexToPosition(this.source, index);
	}

	getIndex(_line: number, _column: number) {}
}
