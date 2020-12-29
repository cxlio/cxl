import { posix as fsPath } from 'path';
import { promises as fs, Stats, watch as fsWatch } from 'fs';
import { Observable, Subscriber, merge, of } from '../rx/index.js';

export enum EventType {
	Change = 'change',
	Remove = 'remove',
}

export interface FileEvent {
	type: EventType;
	path: string;
	stat?: Stats;
}

export interface WatchOptions {
	delay: number;
	pollInterval: number;
}

function poll(path: string, baseInterval = 1000) {
	return new Observable<Stats | undefined>(subs => {
		let nochange = 0,
			previous: Stats,
			interval = baseInterval,
			timeout: NodeJS.Timeout;

		function next() {
			fs.stat(path).then(
				stat => {
					if (!previous || previous.mtimeMs !== stat.mtimeMs) {
						nochange = 0;
						subs.next(stat);
					} else nochange++;

					previous = stat;
					schedule();
				},
				err => {
					if (err?.code !== 'ENOENT') subs.error(err);
					else schedule();
				}
			);
		}

		function schedule() {
			if (nochange > 100) {
				nochange = 101;
				interval = baseInterval * 10;
			} else if (nochange > 30) interval = baseInterval * 5;
			else if (nochange > 5) interval = baseInterval * 2;
			else interval = baseInterval;
			timeout = setTimeout(next, interval);
		}

		next();
		return () => timeout && clearTimeout(timeout);
	});
}

function onWatchChange(
	basePath: string,
	eventPath: string,
	subs: Subscriber<FileEvent>
) {
	fs.stat(basePath).then(
		stat => {
			if (eventPath && stat.isDirectory())
				onWatchChange(fsPath.join(basePath, eventPath), '', subs);
			else subs.next({ type: EventType.Change, path: basePath, stat });
		},
		err => {
			if (err.code === 'ENOENT') {
				const event = { path: basePath, type: EventType.Remove };
				if (eventPath) subs.error({ code: DowngradeError, event });
				else subs.next(event);
			} else subs.error(err);
		}
	);
}

function createWatcher(path: string, options: WatchOptions) {
	return new Observable<FileEvent>(subs => {
		const events: Record<string, NodeJS.Timeout> = {};

		function onChange(_: any, eventFile: string | Buffer) {
			if (events[path]) clearTimeout(events[path]);
			events[path] = setTimeout(() => {
				onWatchChange(path, eventFile.toString(), subs);
				delete events[path];
			}, options.delay);
		}

		const w = fsWatch(path, { encoding: 'utf8' });
		w.on('change', onChange);
		w.on('error', e => subs.error(e));
		return () => w.close();
	});
}

const DowngradeError = {};
const UpgradeError = {};

function createPoller(path: string, options: WatchOptions) {
	return poll(path, options.pollInterval).map(stat => {
		if (stat) {
			throw {
				code: UpgradeError,
				event: { path, type: EventType.Change, stat },
			};
		} else return { path, type: EventType.Remove };
	});
}

function catchWatchError(fullpath: string, options: WatchOptions) {
	return function result(err: any): any {
		const code = err?.code;
		if (code === UpgradeError) {
			return merge(
				createWatcher(fullpath, options).catchError(result),
				of(err.event)
			);
		} else if (code === DowngradeError) {
			return merge(
				createPoller(fullpath, options).catchError(result),
				of(err.event)
			);
		} else if (code === 'ENOENT') {
			return createPoller(fullpath, options).catchError(result);
		} else throw err;
	};
}

/**
 * Watches a file or a directory for changes.
 */
export function watch(
	filename: string,
	options?: Partial<WatchOptions>
): Observable<FileEvent> {
	const fullpath = fsPath.resolve(filename);
	const newOptions = Object.assign(
		{
			delay: 250,
			pollInterval: 1000,
		},
		options
	);

	return createWatcher(fullpath, newOptions).catchError(
		catchWatchError(fullpath, newOptions)
	);
}
