import { posix as path } from 'path';
import { Observable } from '../rx/index.js';
import * as fs from 'fs';

const WATCHERS = {};

export enum EventType {
	Change = 'change',
	Rename = 'rename',
	Remove = 'remove',
}

export class FileEvent {
	constructor(type: FileEventType, path: string) {
		this.type = type;
		this.path = path;
	}

	trigger(subscriber) {
		const ev = this.type;

		fs.stat(this.path, (err, s) => {
			if (err) {
				if (ev === EventType.Change || ev === EventType.Rename)
					this.type = EventType.Remove;
				else return subscriber.error(err);
			}

			this.stat = s;
			subscriber.next(this);
		});
	}
}

class Poller extends Observable {
	constructor(public interval: number) {
		super();
	}

	$decelerate(nochange) {
		if (nochange > 100) this.interval = 10000;
		else if (nochange > 30) this.interval = 5000;
		else if (nochange > 5) this.interval = 2000;
		else this.interval = 1000;
	}
}

class FilePoller {
	constructor(path: string, callback) {
		this.path = path;
		this.callback = callback;
		this.interval = 1000;
		// Number of times we polled and there was no change. Use by decelerate function
		this.nochange = 0;
		this.$history = {};
		this.$isDirectory = false;
		this.$statSync();
		this.$schedule();
	}

	$decelerate(nochange) {
		if (nochange > 100) this.interval = 10000;
		else if (nochange > 30) this.interval = 5000;
		else if (nochange > 5) this.interval = 2000;
		else this.interval = 1000;
	}

	$schedule() {
		this.$timeout = setTimeout(() => this.$poll(), this.interval);
	}

	$statSync(file) {
		const stat = (this.$history[file || '.'] = fs.statSync(
			this.path + (file ? '/' + file : '')
		));

		if (!file && stat.isDirectory())
			fs.readdirSync(this.path).forEach(d => this.$statSync(d));
	}

	$stat(file, onDone) {
		const filepath = this.path + (file ? '/' + file : '');

		file = file || '.';

		fs.stat(filepath, (err, stat) => {
			const current = this.$history[file];

			if (this.$checkChanged(current, stat)) {
				this.changes++;
				this.callback(file === '.' ? '' : file);
			}

			if (file === '.' && stat.isDirectory()) this.$pollDir(onDone);
			else if (onDone) onDone();

			this.$history[file] = stat;
		});
	}

	$checkChanged(oldStat, stat) {
		// TODO
		return (
			!oldStat ||
			!stat ||
			oldStat.ino !== stat.ino ||
			oldStat.mtime.getTime() !== stat.mtime.getTime()
		);
	}

	$pollDir(onDone) {
		fs.readdir(this.path, (err, list) => {
			if (list) list.forEach(l => this.$stat(l));
			// TODO Wait for child stats
			if (onDone) onDone();
		});
	}

	$poll() {
		this.changes = 0;
		this.$stat('', () => {
			this.nochange = this.changes ? 0 : this.nochange + 1;
			this.$decelerate(this.nochange);
			this.$schedule();
		});
	}

	destroy() {
		if (this.$timeout) clearTimeout(this.$timeout);
	}
}

export class FileWatch extends Observable<FileEvent> {
	static getCount() {
		return Object.keys(WATCHERS).length;
	}

	$getPath() {
		return this.path;
	}

	$onChange(subscriber, ev, filename) {
		const full = this.$getPath(filename),
			id = full,
			timeout = this.$events[id],
			event = new FileEvent(ev, full, subscriber);
		if (timeout) clearTimeout(timeout);

		this.$events[id] = setTimeout(() => {
			event.trigger(subscriber);
			delete this.$events[id];
		}, this.delay);
	}

	$createFSWatcher(subscriber, path) {
		const onChange = this.$onChange.bind(this, subscriber),
			onError = subscriber.error,
			w = (this.$watcher = fs.watch(path));
		w.on('change', onChange);
		w.on('error', onError);

		return function () {
			w.removeListener('change', onChange);
			w.removeListener('error', onError);

			if (w.listenerCount('change') === 0) {
				delete WATCHERS[path];
				w.close();
			}
		};
	}

	$createPoller(subscriber, path) {
		const onChange = file => {
				this.$onChange(subscriber, 'change', file);
			},
			poller = new FilePoller(path, onChange);
		return function () {
			poller.destroy();
		};
	}

	$createWatcher(subscriber) {
		const path = this.path;

		try {
			return this.$createFSWatcher(subscriber, path);
		} catch (e) {
			return this.$createPoller(subscriber, path);
		}
	}

	doSubscribe(subscriber) {
		if (!this.$watcher) this.$unsubscribe = this.$createWatcher(subscriber);

		return this.$unsubscribe;
	}

	constructor(filename) {
		const id = path.normalize(filename);

		if (WATCHERS[id]) return WATCHERS[id];

		super(subscriber => this.doSubscribe(subscriber));

		WATCHERS[id] = this;
		this.path = id;
		this.delay = 250;
		this.$events = {};
	}
}

export class DirectoryWatch extends FileWatch {
	$getPath(filename) {
		return path.join(this.path, filename);
	}
}
