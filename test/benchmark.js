
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