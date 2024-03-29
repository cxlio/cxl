import { dirname, resolve } from 'path';
import { readFile } from 'fs/promises';
import { MappingItem, SourceMapConsumer, RawSourceMap } from 'source-map';

export interface Output {
	path: string;
	source: Buffer;
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
	throw new Error(`Invalid Position: ${pos.line},${pos.column}`);
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

function getMappingsForRange(
	sourceMap: SourceMap,
	start: Position,
	end: Position
) {
	return sourceMap.mappings.filter(
		m =>
			(m.generatedLine > start.line ||
				(m.generatedLine === start.line &&
					m.generatedColumn >= start.column)) &&
			(m.generatedLine < end.line ||
				(m.generatedLine === end.line &&
					m.generatedColumn <= end.column))
	);
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

	originalPosition(source: string, offset: number) {
		const pos = indexToPosOne(source, offset);
		const result = this.map?.originalPositionFor(pos);
		return result?.source ? result : undefined;
	}

	translateRange(source: string, range: Range): RangePosition | undefined {
		const sourceMap = this.map;
		if (!sourceMap) throw new Error('Sourcemap not initialized');

		const startPos = indexToPosOne(source, range.start);
		let start = sourceMap.originalPositionFor(startPos);
		const endPos = indexToPosOne(source, range.end);
		let end = sourceMap.originalPositionFor(endPos);

		if (start.source === null || end.source === null) {
			const mappings = getMappingsForRange(this, startPos, endPos);
			if (!mappings || mappings.length < 2) return;

			const startMap = mappings[0];
			const endMap = mappings[mappings.length - 1];

			start = start.source
				? start
				: {
						source: startMap.source,
						column: startMap.originalColumn,
						line: startMap.originalLine,
						name: null,
				  };
			end = end.source
				? end
				: {
						source: endMap.source,
						column: endMap.originalColumn,
						line: endMap.originalLine,
						name: null,
				  };
		}
		if (start.source === null || end.source === null) return;
		if (start.line === null || end.line === null) return;

		start.source = resolve(this.dir, start.source);
		start.line--;
		end.source = resolve(this.dir, end.source);
		end.line--;

		return { start, end } as RangePosition;
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
		str &&
		str.replace(
			ENTITIES_REGEX,
			e => ENTITIES_MAP[e as keyof typeof ENTITIES_MAP] || ''
		)
	);
}
