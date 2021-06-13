import * as Terser from 'terser';
import {
	EMPTY,
	Observable,
	defer,
	from,
	map,
	pipe,
	reduce,
	tap,
} from '@cxl/rx';
import { Output } from '@cxl/source';
import { promises as fs, readFileSync } from 'fs';
import { basename as pathBasename, dirname, resolve } from 'path';
import { sh } from '@cxl/server';

interface MinifyConfig {
	sourceMap?: { content?: string; url: string };
}

export async function read(source: string): Promise<Output> {
	const content = await fs.readFile(source);
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

export function concatFile(outName: string, separator = '\n') {
	return pipe(
		reduce<Output, string>(
			(out, src) => `${out}${separator}${src.source}`,
			''
		),
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
	const source = out.source.toString();
	const match = /\/\/# sourceMappingURL=(.+)/.exec(source);
	const path = match ? resolve(dirname(out.path), match?.[1]) : null;

	if (path) return { path: pathBasename(path), source: readFileSync(path) };
}

export function minify(config: MinifyConfig = {}) {
	return (source: Observable<Output>) =>
		new Observable<Output>(subscriber => {
			const subscription = source.subscribe(async out => {
				const destPath = pathBasename(
					out.path.replace(/\.js$/, '.min.js')
				);
				if (!config.sourceMap) {
					const sourceMap = getSourceMap(out);
					if (sourceMap)
						config.sourceMap = {
							content: sourceMap.source.toString(),
							url: destPath + '.map',
						};
				}
				const source = out.source.toString();
				const { code, map } = await Terser.minify(source, config);
				if (!code) throw new Error('No code generated');

				subscriber.next({ path: destPath, source: Buffer.from(code) });

				if (map && config.sourceMap)
					subscriber.next({
						path: config.sourceMap.url,
						source: Buffer.from(map.toString()),
					});
				subscriber.complete();
			});

			return () => subscription.unsubscribe();
		});
}
