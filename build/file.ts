import * as Terser from 'terser';
import {
	EMPTY,
	Observable,
	defer,
	from,
	map,
	operator,
	pipe,
	reduce,
	tap,
} from '../rx/index.js';
import { Output } from '../source/index.js';
import { promises as fs, readFileSync } from 'fs';
import { basename as pathBasename, dirname, resolve } from 'path';
import { sh } from '../server/index.js';

interface MinifyConfig {
	sourceMap?: { content?: string; url: string };
}

export async function read(source: string): Promise<Output> {
	const content = await fs.readFile(source, 'utf8');
	return {
		path: source,
		source: content,
	};
}

export function file(source: string, out?: string) {
	return defer(() =>
		from(
			read(source).then(res => ({
				path: out || resolve(source),
				source: res.source,
			}))
		)
	);
}

export function basename(replace?: string) {
	return tap<Output>(
		out => (out.path = (replace || '') + pathBasename(out.path))
	);
}

export function prepend(str: string) {
	return tap((val: Output) => (val.source = str + val.source));
}

export function concatFile(outName: string) {
	return pipe(
		reduce<Output, string>((out, src) => out + src.source, ''),
		map(source => ({ path: outName, source }))
	);
}

/**
 * Reads multiple files asynchronously and emits them in order
 */
export function files(sources: string[]) {
	return new Observable<Output>(subs => {
		Promise.all(sources.map(read)).then(
			out => {
				out.forEach(o => subs.next(o));
				subs.complete();
			},
			e => subs.error(e)
		);
	});
}

export function matchStat(fromPath: string, toPath: string) {
	return Promise.all([fs.stat(fromPath), fs.stat(toPath)]).then(
		([fromStat, toStat]) =>
			fromStat.mtime.getTime() === toStat.mtime.getTime(),
		() => true
	);
}

/**
 * Copy Directory
 */
export function copyDir(fromPath: string, toPath: string) {
	return defer(() =>
		from(sh(`rsync -au --delete ${fromPath}/* ${toPath}`)).mergeMap(
			() => EMPTY
		)
	);
}

export function getSourceMap(out: Output): Output | undefined {
	const match = /\/\/# sourceMappingURL=(.+)/.exec(out.source);
	const path = match ? resolve(dirname(out.path), match?.[1]) : null;

	if (path)
		return { path: pathBasename(path), source: readFileSync(path, 'utf8') };
}

export function minify(config: MinifyConfig = {}) {
	return operator<Output>(subs => (out: Output) => {
		const destPath = pathBasename(out.path.replace(/\.js$/, '.min.js'));

		// Detect sourceMap if not present in config
		if (!config.sourceMap) {
			const sourceMap = getSourceMap(out);
			if (sourceMap)
				config.sourceMap = {
					content: sourceMap.source,
					url: destPath + '.map',
				};
		}

		const { code, map, error } = Terser.minify(out.source, config);

		if (error) throw error;
		if (!code) throw new Error('No code generated');

		subs.next({ path: destPath, source: code });
		if (map && config.sourceMap)
			subs.next({ path: config.sourceMap.url, source: map.toString() });
	});
}
