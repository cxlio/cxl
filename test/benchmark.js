
/*jshint esnext:true */
QUnit.module('benchmark');

function perfCollect(count, fn)
{
	var results=[];

	while (count--)
		results.push(fn());

	return results;
}

function perfCallback(a, count, maxTime)
{
	var time = performance.now();

	return function(results) {
		time = (performance.now() - time) / count;
		a.ok(time < maxTime, `Time: ${time}, Max Time: ${maxTime}, Count: ${count}`);
		return results;
	};
}

function perfSync(a, count, maxTime, fn)
{
var
	cb = perfCallback(a, count, maxTime),
	results = perfCollect(count, fn)
;
	return Promise.all(results).then(cb);
}

function perfPrepare(a, fn)
{
	return Promise.all([ fn(), fn() ]).then(function() {
		a.step('Done Warming Up');
		a.verifySteps([ 'Done Warming Up' ]);
	});
}

function perf(a, count, maxTime, fn)
{
	var done=a.async();

	return perfPrepare(a, fn).then(() => perfSync(a, count, maxTime, fn)).then(done);
}

QUnit.test('Simple Getter', function(a) {
	const state = { value: 1 };

	perf(a, 10000, 250, function() {
		cxl.getter('value')(state);
	});
});

QUnit.test('Deep Getter', function(a) {
	const state = { A: { B: { C: 1 } } };

	perf(a, 10000, 250, function() {
		cxl.getter('A.B.C')(state);
	});
});

QUnit.test('Simple Setter', function(a) {
	const state = { value: 1 };

	perf(a, 10000, 250, function() {
		cxl.setter('value')(10, state);
	});
});

QUnit.test('Deep Setter', function(a) {
	const state = { A: { B: { C: 1 } } };

	perf(a, 10000, 250, function() {
		cxl.setter('A.B.C')(10, state);
	});
});

QUnit.module('diff');
QUnit.test('diff()', a => {

	const A = "Lorem ipsum dolor sit amet\n" +
		"ex meis noluisse quaestio pro\n" +
		"possit aeterno no duo\n" +
		"Et mei voluptua interpretaris\n" +
		"alienum suscipit sensibus eu per\n" +
		"Eu quis summo intellegam sed\n" +
		"fugit option quo id\n" +
		"possim maiestatis at vix.";

	const B = "Lorem ipsum dolor sit amet\n" +
		"ut audiam qualisque duo\n" +
		"possit aeterno no duo\n" +
		"te usu eruditi feugait\n" +
		"Eos petentium erroribus et\n" +
		"Eu quis summo intellegam sed\n" +
		"fugit option quo id\n" +
		"vix volumus abhorreant accommodare cu.";


	perf(a, 2000, 250, function() {
		const diff = cxl.diff(A, B, 5);
		const C = cxl.patch(A, diff);
		a.equal(C, B);
	});


});

QUnit.test('diff.worker', a => {

	const worker = new Worker('../diff/dist/diff.worker.js');
	const A = "Lorem ipsum dolor sit amet\n" +
		"ex meis noluisse quaestio pro\n" +
		"possit aeterno no duo\n" +
		"Et mei voluptua interpretaris\n" +
		"alienum suscipit sensibus eu per\n" +
		"Eu quis summo intellegam sed\n" +
		"fugit option quo id\n" +
		"possim maiestatis at vix.";

	const B = "Lorem ipsum dolor sit amet\n" +
		"ut audiam qualisque duo\n" +
		"possit aeterno no duo\n" +
		"te usu eruditi feugait\n" +
		"Eos petentium erroribus et\n" +
		"Eu quis summo intellegam sed\n" +
		"fugit option quo id\n" +
		"vix volumus abhorreant accommodare cu.";
	const done = a.async();
	var i = 0;

	worker.onmessage = function(e) {
		const result = e.data;

		if (result[0]==='diff')
			worker.postMessage(['patch', A, result[1] ]);
		else if (result[0]==='patch')
		{
			i--;
			a.equal(result[1], B);
		}

		if (i===0)
			done();
	};

	perf(a, 2000, 250, function() {
		worker.postMessage(['diff', A, B]);
		i++;
	});

});