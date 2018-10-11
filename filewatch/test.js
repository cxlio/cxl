const
	fw = require('./index'),
	sh = require('child_process').execSync,
	basePath = __dirname
;

process.chdir(basePath);

// Setup
sh(`rm -r test; mkdir test`);

watcher = new fw.FileWatcher();
watcher.watchDirectory('test')

const unsubscribe = watcher.subscribe(ev => {
	console.log(`${ev.type}:${ev.path}`);

	if (ev.type==='change')
	{
		sh(`rm test/test1`);
	} else
		unsubscribe();
});

sh(`echo "test" > test/test1`);
sh(`echo "test2" > test/test1`);
