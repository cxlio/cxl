QUnit.module('rx');

(() => {
"use strict";

const
	rx = cxl.rx,
	map = rx.operators.map,
	Observable = rx.Observable
;

QUnit.test('Observable#constructor', function(a) {
var
	observable = new cxl.rx.Observable(function subscribe(observer) {
		observer.next(1);
		observer.next(2);
		observer.next(3);
		observer.complete();
	}),
	i = 1,
	done = a.async()
;

	observable.subscribe({
		next: function(b) { a.equal(b, i++); },
		complete: done
	});
});

QUnit.test('Observable#subscribe', function(a) {
var
	o = new cxl.rx.Observable(function(s) {
		s.next();
		s.complete();
	}),
	subscription = o.subscribe()
;
	a.ok(subscription);
	a.ok(subscription.unsubscribe);
});

QUnit.test('Observable#subscribe - unsubscribe', function(a) {
var
	obs = new cxl.rx.Observable(function(o) {
		o.next(0);
		o.next(0);
		o.next(0);
		o.next(0);
		o.complete();
	}),
	complete, times=0
;
	obs.subscribe({
		next: function() { if (times++ === 1) this.complete(); },
		complete: function() { complete = true; }
	});

	a.equal(times, 2);
	a.ok(complete);
});

QUnit.test('Observable#toPromise', function(a) {
var
	done = a.async(),
	A = new cxl.rx.Observable(s => s.next('hello')),
	B = new cxl.rx.Observable(s => s.error(true)),
	promise = A.toPromise()
;
	a.ok(promise);
	promise.then(val => a.equal(val, 'hello'));

	B.toPromise().catch(done);

});

QUnit.test('Observable#pipe', function(a) {
var
	A = new Observable(s => s.next(0)),
	B = A.pipe(map(val => val+1)),
	C = B.pipe(map(val => val+3)),
	s1 = A.subscribe(val => a.equal(val, 0)),
	s2 = B.subscribe(val => a.equal(val, 1)),
	s3 = C.subscribe(val => a.equal(val, 4))
;
	a.ok(B instanceof Observable);
	a.ok(C instanceof Observable);
	s1.unsubscribe();
	s2.unsubscribe();
	s3.unsubscribe();
});

QUnit.test('Subject#constructor', function(a) {
var
	subject = new cxl.rx.Subject(),
	c = 1
;
	subject.subscribe(function(b) { a.equal(b, c); });
	subject.subscribe(function(b) { a.equal(b, c); });

	subject.next(c);
	c++;
	subject.next(c);
});

QUnit.test('Subject#error', function(a) {
var
	subject = new cxl.rx.Subject(),
	c = 1
;
	subject.subscribe(b => a.equal(b, c));
	subject.subscribe(null, b => a.equal(b, c));

	subject.next(c);
	c++;
	subject.error(c);
});

QUnit.test('Subject#complete', function(a) {
var
	subject = new cxl.rx.Subject(),
	done = a.async(),
	c = 1
;
	subject.subscribe(b => a.equal(b, c));
	subject.subscribe(b => a.equal(b, c));
	subject.subscribe(null, null, done);

	subject.next(c);
	c++;
	subject.complete();
	subject.complete();
});

QUnit.test('BehaviorSubject#constructor', function(a) {
var
	c = 1,
	A = new cxl.rx.BehaviorSubject(c)
;
	A.subscribe(val => a.equal(val, c));
	c++;
	A.next(c);
	a.equal(A.value, c);
});

QUnit.test('filter', function(a) {
var
	A = new Observable(s => { [1,2,3,4,5,6].forEach(s.next, s); }),
	filter = v => v < 4,
	B = A.pipe(rx.operators.filter(filter)),
	b = B.subscribe(v => {
		a.ok(filter(v));
	}), i=1
;
	b.unsubscribe();

	filter = v => v % 2 === 0;
	B = A.pipe(rx.operators.filter(filter));
	b = B.subscribe(v => {
		a.ok(filter(v));
	});
	b.unsubscribe();

	filter = () => true;
	B = A.pipe(rx.operators.filter(filter));
	b = B.subscribe(v => {
		a.equal(v, i++);
	});
	b.unsubscribe();
});

})();