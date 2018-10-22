
const
	path = require('path').posix,
	fs = require('fs'),

	rx = require('../rx'),
	WATCHERS = {}
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

	doSubscribe(subscriber)
	{
	const
		id = this.path,
		w = this.$watcher || (this.$watcher=fs.watch(id)),
		onChange = this.$onChange.bind(this, subscriber),
		onError = subscriber.error
	;
		w.on('change', onChange);
		w.on('error', onError);

		return function() {
			w.removeListener('change', onChange);
			w.removeListener('error', onError);

			if (w.listenerCount('change')===0)
			{
				delete WATCHERS[id];
				w.close();
			}
		};
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
