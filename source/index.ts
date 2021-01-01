import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { MappingItem, SourceMapConsumer } from 'source-map';

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

	if (pos.line === 0) return pos.column;

	for (let i = 0; i < len; i++) {
		if (source[i] === '\n' && --line === 0) return i + pos.column + 1;
	}
	console.log(pos);
	throw new Error('Invalid Position');
}

function indexToPosOne(source: string, index: number) {
	const result = indexToPosition(source, index);
	result.line++;
	return result;
}

export function translateRange(
	sourceMap: SourceMap,
	source: string,
	range: Range
) {
	const map = sourceMap.map;
	const start = map.originalPositionFor(indexToPosOne(source, range.start));
	const end = map.originalPositionFor(indexToPosOne(source, range.end));

	if (start.source === null || end.source === null) return;

	start.line--;
	end.line--;

	return { start, end };
}

export class SourceMap {
	path: string;
	dir: string;
	map: SourceMapConsumer;
	raw: RawSourceMap;
	mappings: MappingItem[];

	constructor(path: string) {
		this.path = resolve(path);
		this.dir = dirname(this.path);
		this.raw = JSON.parse(readFileSync(this.path, 'utf8'));
		this.map = new SourceMapConsumer(this.raw);
		this.mappings = [];
		this.map.eachMapping(m => this.mappings.push(m));
	}

	translateRange(source: string, range: Range) {
		const sourceMap = this.map;
		const start = sourceMap.originalPositionFor(
			indexToPosOne(source, range.start)
		);
		const end = sourceMap.originalPositionFor(
			indexToPosOne(source, range.end)
		);

		/*if (start.source === null && end.source !== null) {
			// const firstMap = this.mappings.find(m => m.source === end.source);
			const firstMap = this.mappings.findIndex(m => m.source === end.source && m.generatedLine > end.line );
			if (firstMap) {
				start = {
					source: firstMap.source,
					column: firstMap.originalColumn,
					line: firstMap.originalLine,
					name: firstMap.name,
				};
				console.log(start);
			} else return;
		}*/
		if (start.source === null || end.source === null) return;

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

const ENTITIES_REGEX = /[&<>]/g,
	ENTITIES_MAP = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
	};

export function escapeHtml(str: string) {
	return (
		str && str.replace(ENTITIES_REGEX, e => (ENTITIES_MAP as any)[e] || '')
	);
}
