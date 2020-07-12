import { Observable, defer, from } from '../rx';
import { Output } from '../source/index.js';
import { promises } from 'fs';
import { resolve } from 'path';

export function read(source: string): Promise<Output> {
	return promises.readFile(source, 'utf8').then(content => ({
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
