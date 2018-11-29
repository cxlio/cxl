
const
	path = require('path').posix,
	fs = require('fs'),

	rx = require('../rx'),
	WATCHERS = {}
;

class FileEvent
{
	constructor(type, path)
	{
		this.type = type;
		this.path = path;
	}

	trigger(subscriber)
	{
		var ev = this.type;

		fs.stat(this.path, (err, s) => {

			if (err)
			{
				if (ev==='change' || ev==='rename')
					this.type = 'remove';
				else
					return subscriber.error(err);
			}

			this.stat = s;
			subscriber.next(this);
		});
	}
}

class FilePoller {

	constructor(path, callback)
	{
		this.path = path;
		this.callback = callback;
		this.interval = 1000;
		this.$history = {};
		this.$isDirectory = false;
		this.$statSync();
		this.$schedule();
	}

	$schedule()
	{
		this.$timeout = setTimeout(() => this.$poll(), this.interval);
	}

	$statSync(file)
	{
		const stat = this.$history[file || '.'] = fs.statSync(this.path + (file ? '/' + file : ''));

		if (!file && stat.isDirectory())
			fs.readdirSync(this.path).forEach(d => this.$statSync(d));
	}

	$stat(file)
	{
		const filepath = this.path + (file ? '/' + file : '');

		file = file || '.';

		fs.stat(filepath, (err, stat) => {
			const current = this.$history[file];

			if (this.$checkChanged(current, stat))
				this.callback(file==='.' ? '' : file);

			if (file==='.' && stat.isDirectory())
				this.$pollDir();

			this.$history[file] = stat;
		});
	}

	$checkChanged(oldStat, stat)
	{
		// TODO
		return !oldStat || !stat || (oldStat.ino !== stat.ino) ||
			(oldStat.mtime.getTime() !== stat.mtime.getTime());
	}

	$pollDir()
	{
		fs.readdir(this.path, (err, list) => {
			if (list)
				list.forEach(l => this.$stat(l));
		});
	}

	$poll()
	{
		this.$stat();
		this.$schedule();
	}

	destroy()
	{
		if (this.$timeout)
			clearTimeout(this.$timeout);
	}

}

class FileWatch extends rx.Observable {

	static getCount()
	{
		return Object.keys(WATCHERS).length;
	}

	$getPath()
	{
		return this.path;
	}

	$onChange(subscriber, ev, filename)
	{
	const
		full = this.$getPath(filename),
		id = full,
		timeout = this.$events[id],
		event = new FileEvent(ev, full, subscriber)
	;
		if (timeout)
			clearTimeout(timeout);

		this.$events[id] = setTimeout(() => {
			event.trigger(subscriber);
			delete this.$events[id];
		}, this.delay);
	}

	$createFSWatcher(subscriber, path)
	{
	const
		onChange = this.$onChange.bind(this, subscriber),
		onError = subscriber.error,
		w = this.$watcher = fs.watch(path)
	;
		w.on('change', onChange);
		w.on('error', onError);

		return function() {
			w.removeListener('change', onChange);
			w.removeListener('error', onError);

			if (w.listenerCount('change')===0)
			{
				delete WATCHERS[path];
				w.close();
			}
		};
	}

	$createPoller(subscriber, path)
	{
	const
		onChange = (file) => {
			this.$onChange(subscriber, 'change', file);
		},
		poller = new FilePoller(path, onChange)
	;
		return function() { poller.destroy(); };
	}

	$createWatcher(subscriber)
	{
		const path = this.path;

		try {
			return this.$createFSWatcher(subscriber, path);
		} catch (e) {
			return this.$createPoller(subscriber, path);
		}
	}

	doSubscribe(subscriber)
	{
		if (!this.$watcher)
			this.$unsubscribe = this.$createWatcher(subscriber);

		return this.$unsubscribe;
	}

	constructor(filename)
	{
		const id = path.normalize(filename);

		if (WATCHERS[id])
			return WATCHERS[id];

		super(subscriber => this.doSubscribe(subscriber));

		WATCHERS[id] = this;
		this.path = id;
		this.delay = 250;
		this.$events = {};
	}

}

class DirectoryWatch extends FileWatch {

	$getPath(filename)
	{
		return path.join(this.path, filename);
	}

}

Object.assign(exports, {
	DirectoryWatch: DirectoryWatch,
	FileWatch: FileWatch
});
