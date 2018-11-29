const
	assert = require('assert'),
	fw = require('./index'),
	execSync = require('child_process').execSync,
	basePath = __dirname
;

	process.chdir(basePath);

	function sh(cmd)
	{
		console.log(cmd);
		execSync(cmd);
	}

	// Setup
	// sh(`rm -fr test && mkdir test`);

	console.log('Test DirectoryWatch');
	watcher = new fw.DirectoryWatch('test');

	const unsubscribe = watcher.subscribe(ev => {
		console.log(`${ev.type}:${ev.path}`);

		assert.equal(ev.type, 'change');
		unsubscribe.unsubscribe();
	}, err => console.log(err));

	sh(`echo "test" > test/test1`);
	sh(`echo "test2" > test/test1`);

