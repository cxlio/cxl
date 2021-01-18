import { dirname, resolve } from 'path';
import { readFile } from 'fs/promises';
import { MappingItem, SourceMapConsumer, RawSourceMap } from 'source-map';

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

export interface SourcePosition {
	source: string;
	line: number;
	column: number;
}

export interface RangePosition {
	start: SourcePosition;
	end: SourcePosition;
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

/*export function translateRange(
	sourceMap: SourceMap,
	source: string,
	range: Range
) {
	const map = sourceMap.map;
	const start = map.originalPositionFor(indexToPosOne(source, range.start));
	const end = map.originalPositionFor(indexToPosOne(source, range.end));

	if (start.line === null || end.line === null) return;

	start.line--;
	end.line--;

	return { start, end };
}*/

export function getMappingsForRange(
	sourceMap: SourceMapConsumer,
	start: Position,
	end: Position
) {
	const result: MappingItem[] = [];
	sourceMap.eachMapping(m => {
		if (
			m.generatedLine >= start.line &&
			m.generatedColumn >= start.column &&
			m.generatedLine <= end.line &&
			m.generatedColumn <= end.column
		)
			result.push(m);
	});
	console.log(result);
	return result;
}

export class SourceMap {
	path: string;
	dir: string;
	map?: SourceMapConsumer;
	raw?: RawSourceMap;
	mappings: MappingItem[];

	constructor(path: string) {
		this.path = resolve(path);
		this.dir = dirname(this.path);
		this.mappings = [];
	}

	async load() {
		const raw = (this.raw = JSON.parse(await readFile(this.path, 'utf8')));
		this.map = await new SourceMapConsumer(raw);
		this.map.eachMapping(m => this.mappings.push(m));
		return this;
	}

	translateRange(source: string, range: Range): RangePosition | undefined {
		const sourceMap = this.map;
		if (!sourceMap) throw new Error('Sourcemap not initialized');

		const startPos = indexToPosOne(source, range.start);
		const start = sourceMap.originalPositionFor(startPos);
		const endPos = indexToPosOne(source, range.end);
		let end = sourceMap.originalPositionFor(endPos);

		if (start.source === null && range.start === 0 && end.source) {
			start.source = end.source;
			start.line = 1;
			start.column = 0;
		}
		if (
			end.source === null &&
			range.end === source.length &&
			start.source
		) {
			//end.source = end.source;
			endPos.line--;
			end = sourceMap.originalPositionFor(endPos);
		}
		if (start.source === null || end.source === null) return;
		if (start.line === null || end.line === null) return;

		start.source = resolve(this.dir, start.source);
		start.line--;
		end.source = resolve(this.dir, end.source);
		end.line--;

		return { start, end } as any;
	}
}

export function getSourceMapPath(source: string, cwd: string) {
	const match = SOURCEMAP_REGEX.exec(source);
	return match ? resolve(cwd, match[1]) : '';
}

export async function getSourceMap(sourcePath: string) {
	const source = await readFile(sourcePath, 'utf8');
	const filePath = getSourceMapPath(source, dirname(sourcePath));
	return filePath ? new SourceMap(filePath).load() : undefined;
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
