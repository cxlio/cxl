
const
	path = require('path'),
	fs = require('fs'),

	rx = require('../rx')
;

class FileEvent
{
	constructor(type, path, subscriber)
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

class FileWatch extends rx.Observable {

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

	constructor(filename)
	{
		super((subscriber) => {
			const w = fs.watch(filename);
			w.on('change', this.$onChange.bind(this, subscriber));
			w.on('error', subscriber.error);
			return w.close.bind(w);
		});

		this.path = path.normalize(filename);
		this.$events = {};
	}

}

class DirectoryWatch extends FileWatch {

	$getPath(filename)
	{
		return path.join(this.path, filename);
	}

}

class FileWatcher extends rx.Subject
{
	constructor()
	{
		super();
		this.delay = 250;
		this.watchers = {};
	}

	$getId(filename)
	{
		return path.dirname(filename);
	}

	$createWatcher(id)
	{
		if (this.watchers[id])
			return;

		this.watchers[id] = (new DirectoryWatch(id)).subscribe(this);
	}

	watchDirectory(filename)
	{
		const id = path.normalize(filename);
		this.$createWatcher(id);
		return id;
	}

	destroy()
	{
		this.watchers.forEach(w => w.unsubscribe());
	}

	observe(filename, next, error, complete)
	{
		filename = this.watch(filename);

		return this.pipe(
			rx.operators.filter(ev => ev.filename===filename)
		).subscribe(next, error, complete);
	}
}

Object.assign(exports, {
	DirectoryWatch: DirectoryWatch,
	FileWatch: FileWatch,
	FileWatcher: FileWatcher
});
