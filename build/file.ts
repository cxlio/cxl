import { EMPTY, Observable, defer, from } from '../rx/index.js';
import { Output } from '../source/index.js';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { sh } from '../server/index.js';

export function read(source: string): Promise<Output> {
	return fs.readFile(source, 'utf8').then(content => ({
		path: source,
		source: content,
	}));
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

function matchStat(fromPath: string, toPath: string) {
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
		from(
			matchStat(fromPath, toPath).then(
				hasChanged =>
					hasChanged &&
					sh(`mkdir -p ${toPath} && cp -R ${fromPath}/* ${toPath}`)
			)
		).mergeMap(() => EMPTY)
	);
}
