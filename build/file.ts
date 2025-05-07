import * as Terser from 'terser';
import {
	Observable,
	defer,
	from,
	map,
	pipe,
	reduce,
	tap,
	of,
	mergeMap,
	filter,
} from '@cxl/rx';
import { Output } from '@cxl/source';
import { promises as fs, readFileSync } from 'fs';
import { basename as pathBasename, dirname, resolve } from 'path';
import { exec, shell } from './builder.js';

interface MinifyConfig extends Terser.MinifyOptions {
	sourceMap?: false | { content?: string; url: string };
	changePath?: boolean;
}

/**
 * Provides an Observable that emits the absolute paths of all entries in a given
 * directory. Useful for streaming file paths for further processing.
 */
export function ls(dir: string) {
	return new Observable<string>(async subs => {
		const files = await fs.readdir(dir);
		for (const path of files) subs.next(resolve(dir, path));
		subs.complete();
	});
}

export async function read(source: string): Promise<Output> {
	const content = await fs.readFile(source);
	return {
		path: source,
		source: content,
	};
}

export function filterPath(matchPath: string) {
	matchPath = resolve(matchPath);
	return filter((out: Output) => resolve(out.path).startsWith(matchPath));
}

export function file(source: string, out?: string) {
	return defer(() =>
		from(
			read(source).then(res => ({
				path: out || resolve(source),
				source: res.source,
			})),
		),
	);
}

export function basename(replace?: string) {
	return tap<Output>(
		out => (out.path = (replace || '') + pathBasename(out.path)),
	);
}

/*export function prepend(src: string) {
	return tap(out => out.source = Buffer.from(src + out.source.toString('utf8'))); 
}*/

export function concatFile(outName: string, separator = '\n') {
	return pipe(
		reduce<Output, string>(
			(out, src) => `${out}${separator}${src.source}`,
			'',
		),
		map(source => ({ path: outName, source: Buffer.from(source) })),
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
			e => subs.error(e),
		);
	});
}

export function matchStat(fromPath: string, toPath: string) {
	return Promise.all([fs.stat(fromPath), fs.stat(toPath)]).then(
		([fromStat, toStat]) =>
			fromStat.mtime.getTime() === toStat.mtime.getTime(),
		() => true,
	);
}

/**
 * Copy Directory
 */
export function copyDir(fromPath: string, toPath: string, glob = '*') {
	return exec(
		`mkdir -p ${toPath} && rsync -au -i --delete ${fromPath}/${glob} ${toPath}`,
	);
}

export function getSourceMap(out: Output): Output | undefined {
	const source = out.source.toString();
	const match = /\/\/# sourceMappingURL=(.+)/.exec(source);
	const path = match ? resolve(dirname(out.path), match?.[1]) : null;

	if (path) return { path: pathBasename(path), source: readFileSync(path) };
}

export const MinifyDefault: MinifyConfig = {
	ecma: 2020,
};

export function minify(op?: MinifyConfig) {
	return mergeMap<Output, Output>(out => {
		const config = { ...MinifyDefault, ...op };
		// Bypass if not a JS file
		if (!out.path.endsWith('.js')) return of(out);

		const destPath =
			op?.changePath === false
				? out.path
				: out.path.replace(/\.js$/, '.min.js');
		if (config.sourceMap === undefined) {
			const sourceMap = getSourceMap(out);
			if (sourceMap)
				config.sourceMap = {
					content: sourceMap.source.toString(),
					url: destPath + '.map',
				};
		}
		const source = out.source.toString();
		delete config.changePath;
		return new Observable(async subscriber => {
			try {
				const { code, map } = await Terser.minify(
					{ [out.path]: source },
					config,
				);
				if (!code) throw new Error('No code generated');
				subscriber.next({
					path: destPath,
					source: Buffer.from(code),
				});
				if (map && config.sourceMap)
					subscriber.next({
						path: config.sourceMap.url,
						source: Buffer.from(map.toString()),
					});
			} catch (e) {
				console.error(`Error minifying ${out.path}`);
				throw e;
			}
			subscriber.complete();
		});
	});
}

export function minifyDir(dir: string, op?: MinifyConfig) {
	return ls(dir)
		.filter(path => path.endsWith('.js'))
		.mergeMap(file)
		.pipe(minify(op));
}

export function zip(src: string[], path: string): Observable<Output> {
	return shell(`zip - ${src.join(' ')}`).map(source => ({ path, source }));
}
