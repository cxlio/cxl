#!/usr/bin/env node
"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
window.define =
    window.define ||
        function define(name, injects, module) {
            function _require(path, resolve, reject) {
                if (Array.isArray(path)) {
                    path = path[0];
                    return Promise.resolve()
                        .then(() => _require(path))
                        .then(resolve, reject);
                }
                else {
                    const module = define.modules[path];
                    if (!module)
                        throw new Error(`Module "${path}" not found`);
                    return module;
                }
            }
            window.require = window.require || _require;
            if (arguments.length === 2 && Array.isArray(name)) {
                module = injects;
                injects = name;
                name = new Error().fileName;
            }
            else if (arguments.length === 1) {
                module = name;
                injects = [];
                name = new Error().fileName;
            }
            const modules = define.modules || (define.modules = window.require.modules || {});
            const moduleExports = (name && modules[name]) || {};
            if (name)
                modules[name] = moduleExports;
            function findModule(name) {
                if (name === 'exports')
                    return moduleExports;
                if (name === 'require')
                    return window.require;
                const id = name.replace(/\.js$/, '');
                return modules[id] || _require(name);
            }
            const args = injects.map(findModule);
            const oldModule = window.module;
            window.module = { exports: moduleExports };
            module.apply(void 0, args);
            if (name && window.module.exports !== moduleExports)
                modules[name] = window.module.exports;
            window.module = oldModule;
        };
window.define.amd = true;
define("@cxl/rx", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.operators = exports.ref = exports.subject = exports.observable = exports.be = exports.EMPTY = exports.throwError = exports.finalize = exports.combineLatest = exports.zip = exports.merge = exports.publishLast = exports.share = exports.select = exports.distinctUntilChanged = exports.catchError = exports.tap = exports.first = exports.takeWhile = exports.take = exports.filter = exports.exhaustMap = exports.mergeMap = exports.switchMap = exports.debounceTime = exports.timer = exports.interval = exports.debounceFunction = exports.reduce = exports.map = exports.operator = exports.operatorNext = exports.toPromise = exports.of = exports.from = exports.fromPromise = exports.fromArray = exports.isInterop = exports.defer = exports.concat = exports.Reference = exports.ReplaySubject = exports.BehaviorSubject = exports.Subject = exports.Observable = exports.pipe = exports.Subscriber = exports.observableSymbol = void 0;
    exports.observableSymbol = '@@observable';
    class Subscriber {
        constructor(observer, subscribe, fwd) {
            this.observer = observer;
            this.closed = false;
            try {
                if (fwd)
                    fwd(this);
                if (subscribe)
                    this.onUnsubscribe = subscribe(this);
                if (this.closed && this.onUnsubscribe)
                    this.onUnsubscribe();
            }
            catch (e) {
                this.error(e);
            }
        }
        setTeardown(teardown) {
            if (this.teardown)
                throw new Error('teardown method already set');
            this.teardown = teardown;
        }
        next(val) {
            var _a, _b;
            if (this.closed)
                return;
            try {
                (_b = (_a = this.observer).next) === null || _b === void 0 ? void 0 : _b.call(_a, val);
            }
            catch (e) {
                this.error(e);
            }
        }
        error(e) {
            if (!this.closed) {
                const subscriber = this.observer;
                if (!subscriber.error) {
                    this.unsubscribe();
                    throw e;
                }
                try {
                    subscriber.error(e);
                }
                finally {
                    this.unsubscribe();
                }
            }
            else
                throw e;
        }
        complete() {
            var _a, _b;
            if (!this.closed) {
                try {
                    (_b = (_a = this.observer).complete) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                finally {
                    this.unsubscribe();
                }
            }
        }
        unsubscribe() {
            var _a;
            if (!this.closed) {
                this.closed = true;
                (_a = this.teardown) === null || _a === void 0 ? void 0 : _a.call(this);
                if (this.onUnsubscribe)
                    this.onUnsubscribe();
            }
        }
    }
    exports.Subscriber = Subscriber;
    function pipe(...operators) {
        return (source) => operators.reduce((prev, fn) => fn(prev), source);
    }
    exports.pipe = pipe;
    class Observable {
        constructor(__subscribe) {
            this.__subscribe = __subscribe;
        }
        [exports.observableSymbol]() {
            return this;
        }
        then(resolve, reject) {
            return toPromise(this).then(resolve, reject);
        }
        pipe(...extra) {
            return extra.reduce((prev, fn) => fn(prev), this);
        }
        subscribe(next, fwd) {
            const observer = !next || typeof next === 'function' ? { next } : next;
            return new Subscriber(observer, this.__subscribe, fwd);
        }
    }
    exports.Observable = Observable;
    class Subject extends Observable {
        constructor() {
            super((subscription) => this.onSubscribe(subscription));
            this.observers = new Set();
            this.isStopped = false;
        }
        onSubscribe(subscriber) {
            if (this.isStopped) {
                subscriber.complete();
                return () => undefined;
            }
            this.observers.add(subscriber);
            return () => this.observers.delete(subscriber);
        }
        next(a) {
            if (!this.isStopped)
                for (const s of Array.from(this.observers))
                    if (!s.closed)
                        s.next(a);
        }
        error(e) {
            if (!this.isStopped) {
                this.isStopped = true;
                Array.from(this.observers).forEach(s => s.error(e));
            }
        }
        complete() {
            if (!this.isStopped) {
                this.isStopped = true;
                Array.from(this.observers).forEach(s => s.complete());
                this.observers.clear();
            }
        }
    }
    exports.Subject = Subject;
    class BehaviorSubject extends Subject {
        constructor(currentValue) {
            super();
            this.currentValue = currentValue;
        }
        get value() {
            return this.currentValue;
        }
        onSubscribe(subscription) {
            const result = super.onSubscribe(subscription);
            if (!this.isStopped)
                subscription.next(this.currentValue);
            return result;
        }
        next(val) {
            this.currentValue = val;
            super.next(val);
        }
    }
    exports.BehaviorSubject = BehaviorSubject;
    class ReplaySubject extends Subject {
        constructor(bufferSize = Infinity) {
            super();
            this.bufferSize = bufferSize;
            this.buffer = [];
            this.hasError = false;
        }
        onSubscribe(subscriber) {
            this.observers.add(subscriber);
            this.buffer.forEach(val => subscriber.next(val));
            if (this.hasError)
                subscriber.error(this.lastError);
            else if (this.isStopped)
                subscriber.complete();
            return () => this.observers.delete(subscriber);
        }
        error(val) {
            this.hasError = true;
            this.lastError = val;
            super.error(val);
        }
        next(val) {
            if (this.buffer.length === this.bufferSize)
                this.buffer.shift();
            this.buffer.push(val);
            return super.next(val);
        }
    }
    exports.ReplaySubject = ReplaySubject;
    const Undefined = {};
    class Reference extends Subject {
        constructor() {
            super(...arguments);
            this.$value = Undefined;
        }
        get value() {
            if (this.$value === Undefined)
                throw new Error('Reference not initialized');
            return this.$value;
        }
        onSubscribe(subscription) {
            if (this.$value !== Undefined)
                subscription.next(this.$value);
            return super.onSubscribe(subscription);
        }
        next(val) {
            this.$value = val;
            return super.next(val);
        }
    }
    exports.Reference = Reference;
    function concat(...observables) {
        return new Observable(subscriber => {
            let index = 0;
            let lastSubscription;
            function onComplete() {
                const next = observables[index++];
                if (next && !subscriber.closed) {
                    if (lastSubscription)
                        lastSubscription.unsubscribe();
                    next.subscribe({
                        next: subscriber.next.bind(subscriber),
                        error: subscriber.error.bind(subscriber),
                        complete: onComplete,
                    }, subscription => (lastSubscription = subscription));
                }
                else
                    subscriber.complete();
            }
            onComplete();
            return () => lastSubscription === null || lastSubscription === void 0 ? void 0 : lastSubscription.unsubscribe();
        });
    }
    exports.concat = concat;
    function defer(fn) {
        return new Observable(subs => {
            const innerSubs = fn().subscribe(subs);
            return () => innerSubs.unsubscribe();
        });
    }
    exports.defer = defer;
    function isInterop(obs) {
        return !!obs[exports.observableSymbol];
    }
    exports.isInterop = isInterop;
    function fromArray(input) {
        return new Observable(subs => {
            for (const item of input)
                if (!subs.closed)
                    subs.next(item);
            subs.complete();
        });
    }
    exports.fromArray = fromArray;
    function fromPromise(input) {
        return new Observable(subs => {
            input
                .then(result => {
                if (!subs.closed)
                    subs.next(result);
                subs.complete();
            })
                .catch(err => subs.error(err));
        });
    }
    exports.fromPromise = fromPromise;
    function from(input) {
        if (input instanceof Observable)
            return input;
        if (isInterop(input))
            return defer(input[exports.observableSymbol]);
        if (Array.isArray(input))
            return fromArray(input);
        return fromPromise(input);
    }
    exports.from = from;
    function of(...values) {
        return fromArray(values);
    }
    exports.of = of;
    function toPromise(observable) {
        return new Promise((resolve, reject) => {
            let value;
            observable.subscribe({
                next: (val) => (value = val),
                error: (e) => reject(e),
                complete: () => resolve(value),
            });
        });
    }
    exports.toPromise = toPromise;
    function operatorNext(fn, unsubscribe) {
        return (source) => new Observable(subscriber => {
            let subscription;
            subscriber.setTeardown(() => {
                unsubscribe === null || unsubscribe === void 0 ? void 0 : unsubscribe();
                subscription.unsubscribe();
            });
            source.subscribe({
                next: fn(subscriber),
                error: subscriber.error.bind(subscriber),
                complete: subscriber.complete.bind(subscriber),
            }, inner => (subscription = inner));
        });
    }
    exports.operatorNext = operatorNext;
    function operator(fn) {
        return (source) => new Observable(subscriber => {
            let subscription;
            const next = fn(subscriber, source);
            subscriber.setTeardown(() => {
                var _a;
                (_a = next.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(next);
                subscription.unsubscribe();
            });
            if (!next.error)
                next.error = subscriber.error.bind(subscriber);
            if (!next.complete)
                next.complete = subscriber.complete.bind(subscriber);
            source.subscribe(next, inner => (subscription = inner));
        });
    }
    exports.operator = operator;
    function map(mapFn) {
        return operatorNext(subscriber => (val) => {
            subscriber.next(mapFn(val));
        });
    }
    exports.map = map;
    function reduce(reduceFn, seed) {
        return operator(subscriber => {
            let acc = seed;
            let i = 0;
            return {
                next(val) {
                    acc = reduceFn(acc, val, i++);
                },
                complete() {
                    subscriber.next(acc);
                    subscriber.complete();
                },
            };
        });
    }
    exports.reduce = reduce;
    function debounceFunction(fn, delay) {
        let to;
        return function (...args) {
            if (to)
                clearTimeout(to);
            to = setTimeout(() => {
                fn.apply(this, args);
            }, delay);
        };
    }
    exports.debounceFunction = debounceFunction;
    function interval(period) {
        return new Observable(subscriber => {
            const to = setInterval(subscriber.next.bind(subscriber), period);
            return () => clearInterval(to);
        });
    }
    exports.interval = interval;
    function timer(delay) {
        return new Observable(subscriber => {
            const to = setTimeout(() => {
                subscriber.next();
                subscriber.complete();
            }, delay);
            return () => clearTimeout(to);
        });
    }
    exports.timer = timer;
    function debounceTime(time = 0, useTimer = timer) {
        return operator(subscriber => {
            let inner, completed = false;
            return {
                next(val) {
                    inner === null || inner === void 0 ? void 0 : inner.unsubscribe();
                    inner = useTimer(time).subscribe(() => {
                        inner = undefined;
                        subscriber.next(val);
                        if (completed)
                            subscriber.complete();
                    });
                },
                complete() {
                    if (inner)
                        completed = true;
                    else
                        subscriber.complete();
                },
                unsubscribe: () => inner === null || inner === void 0 ? void 0 : inner.unsubscribe(),
            };
        });
    }
    exports.debounceTime = debounceTime;
    function switchMap(project) {
        return (source) => observable(subscriber => {
            let lastSubscription;
            let completed = false;
            const cleanUp = () => {
                lastSubscription === null || lastSubscription === void 0 ? void 0 : lastSubscription.unsubscribe();
                lastSubscription = undefined;
                if (completed)
                    subscriber.complete();
            };
            source.subscribe({
                next(val) {
                    cleanUp();
                    const newObservable = project(val);
                    newObservable.subscribe({
                        next: subscriber.next.bind(subscriber),
                        error: subscriber.error.bind(subscriber),
                        complete: cleanUp,
                    }, subscription => (lastSubscription = subscription));
                },
                error: subscriber.error.bind(subscriber),
                complete() {
                    completed = true;
                    if (!lastSubscription)
                        subscriber.complete();
                },
            }, sourceSubs => subscriber.setTeardown(() => {
                cleanUp();
                sourceSubs.unsubscribe();
            }));
        });
    }
    exports.switchMap = switchMap;
    function mergeMap(project) {
        return (source) => observable(subscriber => {
            const subscriptions = [];
            let count = 0;
            let completed = 0;
            let sourceCompleted = false;
            function cleanUp() {
                subscriptions.forEach(s => s.unsubscribe());
            }
            subscriptions.push(source.subscribe({
                next: (val) => {
                    count++;
                    subscriptions.push(project(val).subscribe({
                        next: val => subscriber.next(val),
                        error: e => {
                            subscriber.error(e);
                            cleanUp();
                        },
                        complete: () => {
                            completed++;
                            if (sourceCompleted &&
                                completed === count) {
                                subscriber.complete();
                                cleanUp();
                            }
                        },
                    }));
                },
                error: subscriber.error.bind(subscriber),
                complete() {
                    sourceCompleted = true;
                    if (completed === count) {
                        subscriber.complete();
                        cleanUp();
                    }
                },
            }));
            return cleanUp;
        });
    }
    exports.mergeMap = mergeMap;
    function exhaustMap(project) {
        return operator(subscriber => {
            let lastSubscription;
            function unsubscribe() {
                lastSubscription === null || lastSubscription === void 0 ? void 0 : lastSubscription.unsubscribe();
                lastSubscription = undefined;
            }
            return {
                next(val) {
                    if (!lastSubscription)
                        lastSubscription = project(val).subscribe({
                            next: subscriber.next.bind(subscriber),
                            error: subscriber.error.bind(subscriber),
                            complete: unsubscribe,
                        });
                },
                unsubscribe,
            };
        });
    }
    exports.exhaustMap = exhaustMap;
    function filter(fn) {
        return operatorNext((subscriber) => (val) => {
            if (fn(val))
                subscriber.next(val);
        });
    }
    exports.filter = filter;
    function take(howMany) {
        return operatorNext((subs) => (val) => {
            if (howMany-- > 0 && !subs.closed)
                subs.next(val);
            if (howMany <= 0 || subs.closed)
                subs.complete();
        });
    }
    exports.take = take;
    function takeWhile(fn) {
        return operatorNext((subs) => (val) => {
            if (!subs.closed && fn(val))
                subs.next(val);
            else
                subs.complete();
        });
    }
    exports.takeWhile = takeWhile;
    function first() {
        return operatorNext((subs) => (val) => {
            subs.next(val);
            subs.complete();
        });
    }
    exports.first = first;
    function tap(fn) {
        return operatorNext((subscriber) => (val) => {
            fn(val);
            subscriber.next(val);
        });
    }
    exports.tap = tap;
    function catchError(selector) {
        return operator((subscriber, source) => {
            let retrySubs;
            const observer = {
                next: subscriber.next.bind(subscriber),
                error(err) {
                    try {
                        if (subscriber.closed)
                            return;
                        const result = selector(err, source);
                        if (result) {
                            retrySubs === null || retrySubs === void 0 ? void 0 : retrySubs.unsubscribe();
                            result.subscribe(observer, subs => (retrySubs = subs));
                        }
                    }
                    catch (err2) {
                        return subscriber.error(err2);
                    }
                },
                unsubscribe() {
                    retrySubs === null || retrySubs === void 0 ? void 0 : retrySubs.unsubscribe();
                },
            };
            return observer;
        });
    }
    exports.catchError = catchError;
    const initialDistinct = {};
    function distinctUntilChanged() {
        return operatorNext((subscriber) => {
            let lastValue = initialDistinct;
            return (val) => {
                if (val !== lastValue) {
                    lastValue = val;
                    subscriber.next(val);
                }
            };
        });
    }
    exports.distinctUntilChanged = distinctUntilChanged;
    function select(key) {
        return map(state => state[key]);
    }
    exports.select = select;
    function share() {
        return (source) => {
            const subject = ref();
            let subscriptionCount = 0;
            let sourceSubscription;
            return observable(subs => {
                if (!sourceSubscription) {
                    subscriptionCount++;
                    sourceSubscription = source.subscribe(subject);
                }
                const subscription = subject.subscribe(subs);
                return () => {
                    subscription.unsubscribe();
                    if (--subscriptionCount === 0 && sourceSubscription) {
                        sourceSubscription.unsubscribe();
                        sourceSubscription = undefined;
                    }
                };
            });
        };
    }
    exports.share = share;
    function publishLast() {
        return (source) => {
            const subject = new Subject();
            let sourceSubscription;
            let lastValue;
            let hasEmitted = false;
            let ready = false;
            return observable(subs => {
                let subjectSubscription;
                if (ready) {
                    subs.next(lastValue);
                    subs.complete();
                }
                else
                    subjectSubscription = subject.subscribe(subs);
                if (!sourceSubscription)
                    sourceSubscription = source.subscribe({
                        next: val => {
                            hasEmitted = true;
                            lastValue = val;
                        },
                        error: subs.error.bind(subs),
                        complete: () => {
                            ready = true;
                            if (hasEmitted)
                                subject.next(lastValue);
                            subject.complete();
                        },
                    });
                return () => subjectSubscription === null || subjectSubscription === void 0 ? void 0 : subjectSubscription.unsubscribe();
            });
        };
    }
    exports.publishLast = publishLast;
    function merge(...observables) {
        if (observables.length === 1)
            return observables[0];
        return new Observable(subs => {
            let refCount = observables.length;
            const subscriptions = [];
            for (const o of observables)
                if (!subs.closed)
                    o.subscribe({
                        next: subs.next.bind(subs),
                        error: subs.error.bind(subs),
                        complete() {
                            if (refCount-- === 1)
                                subs.complete();
                        },
                    }, subscription => subscriptions.push(subscription));
            return () => subscriptions.forEach(s => s.unsubscribe());
        });
    }
    exports.merge = merge;
    function zip(...observables) {
        return observables.length === 0
            ? exports.EMPTY
            : new Observable(subs => {
                const buffer = new Array(observables.length);
                const subscriptions = [];
                let completed = 0;
                function flush() {
                    let hasNext = true;
                    for (const bucket of buffer)
                        if (!bucket || bucket.length === 0) {
                            hasNext = false;
                            break;
                        }
                    if (hasNext) {
                        subs.next(buffer.map(b => b.shift()));
                        flush();
                    }
                    if (completed) {
                        for (const bucket of buffer)
                            if (bucket.length !== 0)
                                return;
                        subs.complete();
                        for (const s of subscriptions)
                            s.unsubscribe();
                    }
                }
                observables.forEach((o, id) => {
                    const bucket = (buffer[id] = []);
                    subscriptions.push(o.subscribe({
                        next(val) {
                            bucket.push(val);
                            flush();
                        },
                        error: subs.error.bind(subs),
                        complete() {
                            completed++;
                            flush();
                        },
                    }));
                });
                return () => subscriptions.forEach(s => s.unsubscribe());
            });
    }
    exports.zip = zip;
    function combineLatest(...observables) {
        return observables.length === 0
            ? exports.EMPTY
            : new Observable(subs => {
                let len = observables.length;
                const initialLen = len;
                let emittedCount = 0;
                let ready = false;
                const emitted = new Array(len);
                const last = new Array(len);
                const subscriptions = observables.map((o, id) => o.subscribe({
                    next(val) {
                        last[id] = val;
                        if (!emitted[id]) {
                            emitted[id] = true;
                            if (++emittedCount >= initialLen)
                                ready = true;
                        }
                        if (ready)
                            subs.next(last.slice(0));
                    },
                    error: subs.error.bind(subs),
                    complete() {
                        if (--len <= 0)
                            subs.complete();
                    },
                }));
                return () => subscriptions.forEach(s => s.unsubscribe());
            });
    }
    exports.combineLatest = combineLatest;
    function finalize(unsubscribe) {
        return operator((subscriber) => ({
            next: subscriber.next.bind(subscriber),
            unsubscribe,
        }));
    }
    exports.finalize = finalize;
    function throwError(error) {
        return new Observable(subs => subs.error(error));
    }
    exports.throwError = throwError;
    exports.EMPTY = new Observable(subs => subs.complete());
    function be(initialValue) {
        return new BehaviorSubject(initialValue);
    }
    exports.be = be;
    function observable(subscribe) {
        return new Observable(subscribe);
    }
    exports.observable = observable;
    function subject() {
        return new Subject();
    }
    exports.subject = subject;
    function ref() {
        return new Reference();
    }
    exports.ref = ref;
    exports.operators = {
        catchError,
        debounceTime,
        distinctUntilChanged,
        filter,
        finalize,
        first,
        map,
        mergeMap,
        publishLast,
        reduce,
        select,
        share,
        switchMap,
        take,
        takeWhile,
        tap,
    };
    for (const p in exports.operators) {
        Observable.prototype[p] = function (...args) {
            return this.pipe(exports.operators[p](...args));
        };
    }
});
define("@cxl/tsx", ["require", "exports", "@cxl/rx"], function (require, exports, rx_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dom = exports.renderChildren = exports.expression = void 0;
    function bind(host, binding) {
        if (!host.bind)
            throw new Error('Element not bindable');
        host.bind(binding);
    }
    function expression(host, binding) {
        const result = document.createTextNode('');
        bind(host, binding.tap(val => (result.textContent = val)));
        return result;
    }
    exports.expression = expression;
    function renderChildren(host, children, appendTo = host) {
        if (children === undefined || children === null)
            return;
        if (Array.isArray(children))
            for (const child of children)
                renderChildren(host, child, appendTo);
        else if (children instanceof rx_1.Observable)
            appendTo.appendChild(expression(host, children));
        else if (children instanceof Node)
            appendTo.appendChild(children);
        else if (typeof children === 'function')
            renderChildren(host, children(host), appendTo);
        else
            appendTo.appendChild(document.createTextNode(children));
    }
    exports.renderChildren = renderChildren;
    function renderAttributes(host, attributes) {
        for (const attr in attributes) {
            const value = attributes[attr];
            if (value instanceof rx_1.Observable)
                bind(host, attr === '$' ? value : value.tap(v => (host[attr] = v)));
            else if (attr === '$' && typeof value === 'function')
                bind(host, value(host));
            else
                host[attr] = value;
        }
    }
    function renderElement(element, attributes, children) {
        if (attributes)
            renderAttributes(element, attributes);
        if (children)
            renderChildren(element, children);
        return element;
    }
    function renderNative(element, attributes, children) {
        for (const attr in attributes) {
            if (attr === '$')
                attributes[attr](element);
            else
                element[attr] = attributes[attr];
        }
        if (children)
            renderChildren(element, children);
        return element;
    }
    function dom(elementType, attributes, ...children) {
        if (elementType === dom)
            return renderNative(document.createDocumentFragment(), undefined, children);
        if (elementType.create)
            return renderElement(elementType.create(), attributes, children);
        if (!elementType.apply)
            return renderNative(document.createElement(elementType), attributes, children);
        if (children) {
            children = children.length > 1 ? children : children[0];
            if (attributes)
                attributes.children = children;
            else
                attributes = { children };
        }
        return elementType(attributes);
    }
    exports.dom = dom;
    exports.default = dom;
});
define("@cxl/dom", ["require", "exports", "@cxl/rx"], function (require, exports, rx_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isVisible = exports.onIntersection = exports.onMutation = exports.fileReaderString = exports.insert = exports.onResize = exports.findNextNodeBySelector = exports.findNextNode = exports.animationFrame = exports.onLocation = exports.onHistoryChange = exports.onHashChange = exports.ChildrenObserver = exports.onAttributeChange = exports.onChildrenMutation = exports.observeChildren = exports.AttributeObserver = exports.trigger = exports.setAttribute = exports.getShadow = exports.onFontsReady = exports.onLoad = exports.onReady = exports.onAction = exports.onKeypress = exports.on = exports.setContent = exports.empty = void 0;
    function empty(el) {
        let c;
        while ((c = el.childNodes[0]))
            el.removeChild(c);
    }
    exports.empty = empty;
    function setContent(el, content) {
        empty(el);
        insert(el, content);
    }
    exports.setContent = setContent;
    function on(element, event, options) {
        return new rx_2.Observable(subscriber => {
            const handler = subscriber.next.bind(subscriber);
            element.addEventListener(event, handler, options);
            return element.removeEventListener.bind(element, event, handler, options);
        });
    }
    exports.on = on;
    function onKeypress(el, key) {
        return on(el, 'keydown').filter((ev) => !key || ev.key.toLowerCase() === key);
    }
    exports.onKeypress = onKeypress;
    function onAction(el) {
        return (0, rx_2.merge)(on(el, 'click'), onKeypress(el, 'enter'));
    }
    exports.onAction = onAction;
    function onReady() {
        return (0, rx_2.defer)(() => document.readyState !== 'loading'
            ? (0, rx_2.of)(true)
            : on(window, 'DOMContentLoaded')
                .first()
                .map(() => true));
    }
    exports.onReady = onReady;
    function onLoad() {
        return (0, rx_2.defer)(() => document.readyState === 'complete'
            ? (0, rx_2.of)(true)
            : on(window, 'load')
                .first()
                .map(() => true));
    }
    exports.onLoad = onLoad;
    function onFontsReady() {
        return (0, rx_2.from)(document.fonts.ready);
    }
    exports.onFontsReady = onFontsReady;
    const shadowConfig = { mode: 'open' };
    function getShadow(el) {
        return el.shadowRoot || el.attachShadow(shadowConfig);
    }
    exports.getShadow = getShadow;
    function setAttribute(el, attr, val) {
        if (val === false || val === null || val === undefined)
            val = null;
        else if (val === true)
            val = '';
        else
            val = val.toString();
        if (val === null)
            el.removeAttribute(attr);
        else
            el.setAttribute(attr, val);
        return val;
    }
    exports.setAttribute = setAttribute;
    function trigger(el, event, detail) {
        const ev = new CustomEvent(event, { detail: detail, bubbles: true });
        el.dispatchEvent(ev);
    }
    exports.trigger = trigger;
    class AttributeObserver extends rx_2.Subject {
        constructor(element) {
            super();
            this.element = element;
            if (element.$$attributeObserver)
                return element.$$attributeObserver;
            this.element = element;
            element.$$attributeObserver = this;
        }
        $onMutation(events) {
            events.forEach(ev => ev.attributeName && this.trigger(ev.attributeName));
        }
        $onEvent() {
            const el = this.element;
            if (el.value !== this.$value) {
                this.$value = el.value;
                this.trigger('value');
            }
            if (el.checked !== this.$checked) {
                this.$checked = el.checked;
                this.trigger('checked');
            }
        }
        $initializeNative(element) {
            this.observer = new MutationObserver(this.$onMutation.bind(this));
            this.observer.observe(element, { attributes: true });
            this.bindings = [
                on(element, 'change').subscribe(this.$onEvent.bind(this)),
            ];
        }
        onSubscribe(subscription) {
            const el = this.element;
            if (!el.$view && !this.observer)
                this.$initializeNative(el);
            const unsubscribe = super.onSubscribe(subscription);
            return () => {
                unsubscribe();
                if (this.observers.size === 0)
                    this.disconnect();
            };
        }
        disconnect() {
            var _a;
            if (this.observer) {
                this.observer.disconnect();
                this.observer = undefined;
                (_a = this.bindings) === null || _a === void 0 ? void 0 : _a.forEach(b => b.unsubscribe());
            }
        }
        trigger(attributeName) {
            this.next({
                type: 'attribute',
                target: this.element,
                value: attributeName,
            });
        }
    }
    exports.AttributeObserver = AttributeObserver;
    function observeChildren(el) {
        let children;
        return (0, rx_2.merge)((0, rx_2.defer)(() => {
            children = el.childNodes;
            return children ? (0, rx_2.of)(children) : rx_2.EMPTY;
        }), onChildrenMutation(el), onLoad().switchMap(() => {
            if (el.childNodes !== children) {
                children = el.childNodes;
                return (0, rx_2.of)(children);
            }
            return rx_2.EMPTY;
        }));
    }
    exports.observeChildren = observeChildren;
    function onChildrenMutation(el) {
        return new ChildrenObserver(el);
    }
    exports.onChildrenMutation = onChildrenMutation;
    function onAttributeChange(el) {
        return new AttributeObserver(el);
    }
    exports.onAttributeChange = onAttributeChange;
    class ChildrenObserver extends rx_2.Subject {
        constructor(element) {
            super();
            this.element = element;
            if (element.$$childrenObserver)
                return element.$$childrenObserver;
            this.element = element;
            element.$$childrenObserver = this;
        }
        $handleEvent(ev) {
            const target = this.element;
            for (const value of ev.addedNodes)
                this.next({ type: 'added', target, value });
            for (const value of ev.removedNodes)
                this.next({ type: 'removed', target, value });
        }
        onSubscribe(subscription) {
            const el = this.element;
            if (!this.observer) {
                this.observer = new MutationObserver(events => events.forEach(this.$handleEvent, this));
                this.observer.observe(el, { childList: true });
            }
            const unsubscribe = super.onSubscribe(subscription);
            return () => {
                unsubscribe();
                if (this.observers.size === 0 && this.observer) {
                    this.observer.disconnect();
                    this.observer = undefined;
                }
            };
        }
    }
    exports.ChildrenObserver = ChildrenObserver;
    function onHashChange() {
        return (0, rx_2.concat)((0, rx_2.of)(location.hash.slice(1)), on(window, 'hashchange').map(() => location.hash.slice(1)));
    }
    exports.onHashChange = onHashChange;
    let pushSubject;
    function onHistoryChange() {
        if (!pushSubject) {
            pushSubject = (0, rx_2.be)(history.state);
            const old = history.pushState;
            history.pushState = function (...args) {
                const result = old.apply(this, args);
                if (history.state)
                    history.state.lastAction = 'push';
                pushSubject.next(history.state);
                return result;
            };
        }
        return (0, rx_2.merge)(on(window, 'popstate').map(() => {
            if (history.state)
                history.state.lastAction = 'pop';
            return history.state;
        }), pushSubject);
    }
    exports.onHistoryChange = onHistoryChange;
    function onLocation() {
        let lastHref;
        return (0, rx_2.merge)(onHashChange(), onHistoryChange())
            .map(() => window.location)
            .filter(loc => {
            const res = loc.href !== lastHref;
            lastHref = loc.href;
            return res;
        });
    }
    exports.onLocation = onLocation;
    exports.animationFrame = new rx_2.Observable(subs => {
        let frame = 0;
        let rafid = requestAnimationFrame(next);
        function next() {
            if (subs.closed)
                return;
            subs.next(frame++);
            rafid = requestAnimationFrame(next);
        }
        return () => cancelAnimationFrame(rafid);
    });
    function findNextNode(el, fn, direction = 'nextSibling') {
        let node = el[direction];
        while (node) {
            if (fn(node))
                return node;
            node = node[direction];
        }
    }
    exports.findNextNode = findNextNode;
    function findNextNodeBySelector(el, selector, direction = 'nextElementSibling') {
        let node = el[direction];
        while (node) {
            if (node.matches(selector))
                return node;
            node = node[direction];
        }
        return null;
    }
    exports.findNextNodeBySelector = findNextNodeBySelector;
    function onResize(el) {
        return new rx_2.Observable(subs => {
            const observer = new ResizeObserver(ev => subs.next(ev));
            observer.observe(el);
            return () => observer.unobserve(el);
        });
    }
    exports.onResize = onResize;
    function insert(el, content) {
        if (content === undefined)
            return;
        if (!(content instanceof Node))
            content = document.createTextNode(content);
        el.appendChild(content);
    }
    exports.insert = insert;
    function fileReaderString(file) {
        return new rx_2.Observable(subs => {
            const fr = new FileReader();
            fr.readAsBinaryString(file);
            fr.addEventListener('load', () => {
                subs.next(fr.result);
                subs.complete();
            });
        });
    }
    exports.fileReaderString = fileReaderString;
    function onMutation(target, options = { attributes: true, childList: true }) {
        return new rx_2.Observable(subs => {
            const observer = new MutationObserver(events => events.forEach(ev => {
                for (const value of ev.addedNodes)
                    subs.next({ type: 'added', target, value });
                for (const value of ev.removedNodes)
                    subs.next({ type: 'removed', target, value });
                if (ev.attributeName)
                    subs.next({
                        type: 'attribute',
                        target,
                        value: ev.attributeName,
                    });
            }));
            observer.observe(target, options);
            return () => observer.disconnect();
        });
    }
    exports.onMutation = onMutation;
    function onIntersection(target) {
        return new rx_2.Observable(subs => {
            const observer = new IntersectionObserver(events => {
                for (const ev of events)
                    subs.next(ev);
            });
            observer.observe(target);
            return () => observer.disconnect();
        });
    }
    exports.onIntersection = onIntersection;
    function isVisible(target) {
        return onIntersection(target).map(ev => ev.isIntersecting);
    }
    exports.isVisible = isVisible;
});
define("@cxl/component", ["require", "exports", "@cxl/tsx", "@cxl/dom", "@cxl/rx"], function (require, exports, tsx_1, dom_1, rx_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Slot = exports.Span = exports.getRegisteredComponents = exports.StyleAttribute = exports.Attribute = exports.get = exports.attributeChanged = exports.update = exports.onUpdate = exports.connect = exports.Augment = exports.registerComponent = exports.augment = exports.appendShadow = exports.pushRender = exports.Component = exports.Bindings = void 0;
    const registeredComponents = {};
    const subscriber = {
        error(e) {
            throw e;
        },
    };
    class Bindings {
        bind(binding) {
            if (this.subscriptions)
                throw new Error('Cannot bind connected component.');
            if (!this.bindings)
                this.bindings = [];
            this.bindings.push(binding);
        }
        connect() {
            if (!this.subscriptions && this.bindings)
                this.subscriptions = this.bindings.map(s => s.subscribe(subscriber));
        }
        disconnect() {
            var _a;
            (_a = this.subscriptions) === null || _a === void 0 ? void 0 : _a.forEach(s => s.unsubscribe());
            this.subscriptions = undefined;
        }
    }
    exports.Bindings = Bindings;
    class Component extends HTMLElement {
        constructor() {
            super(...arguments);
            this.attributes$ = new rx_3.Subject();
            this.Shadow = (p) => {
                (0, tsx_1.renderChildren)(this, p.children, (0, dom_1.getShadow)(this));
                return this;
            };
            this.Slot = (p) => {
                const el = document.createElement('slot');
                const name = (el.name = p.name || p.selector);
                const selector = p.selector;
                this.bind((0, rx_3.merge)(dom_1.animationFrame.first().tap(() => {
                    for (const node of this.children)
                        if (node.matches(selector))
                            node.slot = selector;
                }), (0, dom_1.onChildrenMutation)(this).tap(ev => {
                    const node = ev.value;
                    if (ev.type === 'added' &&
                        node instanceof HTMLElement &&
                        node.matches(selector))
                        node.slot = name;
                })));
                return el;
            };
        }
        static create() {
            if (!this.tagName)
                throw new Error('tagName is undefined');
            return document.createElement(this.tagName);
        }
        bind(obs) {
            const render = this.render;
            if (render) {
                const bindings = this.$$prebind || (this.$$prebind = []);
                bindings.push(obs);
            }
            else {
                if (!this.$$bindings)
                    this.$$bindings = new Bindings();
                this.$$bindings.bind(obs);
            }
        }
        connectedCallback() {
            const render = this.render;
            if (render) {
                this.render = undefined;
                render(this);
                if (this.$$prebind)
                    this.$$prebind.forEach((b) => this.bind(b));
            }
            if (this.$$bindings)
                this.$$bindings.connect();
        }
        disconnectedCallback() {
            if (this.$$bindings)
                this.$$bindings.disconnect();
        }
        attributeChangedCallback(name, oldValue, value) {
            if (oldValue !== value) {
                if (value === '') {
                    const thisValue = this[name];
                    this[name] =
                        thisValue === false || thisValue === true ? true : '';
                }
                else
                    this[name] = value === null ? false : value;
            }
        }
    }
    exports.Component = Component;
    function pushRender(proto, renderFn) {
        const oldRender = proto.render;
        proto.render = function (el) {
            if (oldRender)
                oldRender(el);
            renderFn(el);
        };
    }
    exports.pushRender = pushRender;
    function appendShadow(host, child) {
        if (child instanceof Node) {
            const shadow = (0, dom_1.getShadow)(host);
            shadow.appendChild(child);
        }
        else
            host.bind(child);
    }
    exports.appendShadow = appendShadow;
    function augment(constructor, decorators) {
        pushRender(constructor.prototype, node => {
            for (const d of decorators) {
                const result = d(node);
                if (result && result !== node)
                    appendShadow(node, result);
            }
        });
    }
    exports.augment = augment;
    function registerComponent(tagName, ctor) {
        ctor.tagName = tagName;
        registeredComponents[tagName] = ctor;
        customElements.define(tagName, ctor);
    }
    exports.registerComponent = registerComponent;
    function Augment(...augs) {
        return (ctor) => {
            let newAugs, tagName;
            if (augs && typeof augs[0] === 'string') {
                tagName = augs[0];
                newAugs = augs.slice(1);
            }
            else {
                newAugs = augs;
                tagName = ctor.tagName;
            }
            if (tagName)
                registerComponent(tagName, ctor);
            augment(ctor, newAugs);
        };
    }
    exports.Augment = Augment;
    function connect(bindFn) {
        return (host) => host.bind((0, rx_3.observable)(() => bindFn(host)));
    }
    exports.connect = connect;
    function attributes$(host) {
        return host.attributes$;
    }
    function onUpdate(host) {
        return (0, rx_3.concat)((0, rx_3.of)(host), attributes$(host).map(() => host));
    }
    exports.onUpdate = onUpdate;
    function update(fn) {
        return (host) => host.bind(onUpdate(host).tap(fn));
    }
    exports.update = update;
    function attributeChanged(element, attribute) {
        return attributes$(element).pipe((0, rx_3.filter)(ev => ev.attribute === attribute), (0, rx_3.map)(ev => ev.value));
    }
    exports.attributeChanged = attributeChanged;
    function get(element, attribute) {
        return (0, rx_3.concat)((0, rx_3.defer)(() => (0, rx_3.of)(element[attribute])), attributeChanged(element, attribute));
    }
    exports.get = get;
    function getObservedAttributes(target) {
        let result = target.observedAttributes;
        if (result && !target.hasOwnProperty('observedAttributes'))
            result = target.observedAttributes.slice(0);
        return (target.observedAttributes = result || []);
    }
    const attributeOperator = (0, rx_3.tap)(({ value, target, attribute }) => {
        if (value === false || value === undefined || value === 0) {
            if (target.hasAttribute(attribute))
                target.removeAttribute(attribute);
        }
        else if (value === true)
            target.setAttribute(attribute, '');
        else
            target.setAttribute(attribute, value);
    });
    function Attribute(options) {
        return (target, attribute, descriptor) => {
            const ctor = target.constructor;
            const prop = '$$' + attribute;
            getObservedAttributes(ctor).push(attribute);
            if (descriptor)
                Object.defineProperty(target, prop, descriptor);
            if ((options === null || options === void 0 ? void 0 : options.persist) || (options === null || options === void 0 ? void 0 : options.persistOperator))
                pushRender(target, (node) => {
                    return node.bind((0, rx_3.concat)((0, rx_3.defer)(() => (0, rx_3.of)({
                        attribute,
                        target: node,
                        value: node[attribute],
                    })), attributes$(node).pipe((0, rx_3.filter)(ev => ev.attribute === attribute))).pipe(options.persistOperator || attributeOperator));
                });
            if (options === null || options === void 0 ? void 0 : options.render)
                pushRender(target, options.render);
            return {
                enumerable: true,
                get() {
                    return this[prop];
                },
                set(value) {
                    var _a;
                    if (this[prop] !== value) {
                        this[prop] = value;
                        (_a = this.attributes$) === null || _a === void 0 ? void 0 : _a.next({
                            target: this,
                            attribute,
                            value,
                        });
                    }
                    else if (descriptor)
                        this[prop] = value;
                },
            };
        };
    }
    exports.Attribute = Attribute;
    function StyleAttribute() {
        return Attribute({
            persist: true,
            observe: true,
        });
    }
    exports.StyleAttribute = StyleAttribute;
    function getRegisteredComponents() {
        return { ...registeredComponents };
    }
    exports.getRegisteredComponents = getRegisteredComponents;
    let Span = class Span extends Component {
    };
    Span = __decorate([
        Augment('cxl-span')
    ], Span);
    exports.Span = Span;
    function Slot() {
        return document.createElement('slot');
    }
    exports.Slot = Slot;
});
define("@cxl/template", ["require", "exports", "@cxl/dom", "@cxl/rx", "@cxl/component"], function (require, exports, dom_2, rx_4, component_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeHtml = exports.validateValue = exports.setClassName = exports.staticTemplate = exports.$onAction = exports.stopChildrenEvents = exports.checkedBehavior = exports.selectable = exports.selectableHost = exports.selectableHostMultiple = exports.registableHost = exports.registable = exports.focusable = exports.focusableDisabled = exports.disabledAttribute = exports.focusableEvents = exports.navigationList = exports.navigationListUpDown = exports.role = exports.ariaChecked = exports.ariaValue = exports.aria = exports.each = exports.render = exports.loading = exports.list = exports.teleport = exports.portal = exports.log = exports.raf = exports.is = exports.select = exports.onValue = exports.model = exports.syncAttribute = exports.sync = exports.stopEvent = exports.triggerEvent = exports.getAttribute = exports.getSearchRegex = exports.sortBy = void 0;
    function isObservedAttribute(el, attr) {
        var _a;
        return (_a = el.constructor.observedAttributes) === null || _a === void 0 ? void 0 : _a.includes(attr);
    }
    function sortBy(key) {
        return (a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0);
    }
    exports.sortBy = sortBy;
    function getSearchRegex(term) {
        try {
            return new RegExp(term, 'i');
        }
        catch (e) {
            return new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        }
    }
    exports.getSearchRegex = getSearchRegex;
    function getAttribute(el, name) {
        const attr$ = el.attributes$;
        const observer = attr$ && isObservedAttribute(el, name)
            ? attr$.filter((ev) => ev.attribute === name)
            : new dom_2.AttributeObserver(el).filter(ev => ev.value === name);
        return (0, rx_4.concat)((0, rx_4.defer)(() => (0, rx_4.of)(el[name])), observer.map(() => el[name]));
    }
    exports.getAttribute = getAttribute;
    function triggerEvent(element, event) {
        return (0, rx_4.tap)(dom_2.trigger.bind(null, element, event));
    }
    exports.triggerEvent = triggerEvent;
    function stopEvent() {
        return (0, rx_4.tap)((ev) => ev.stopPropagation());
    }
    exports.stopEvent = stopEvent;
    function sync(getA, setA, getB, setB, value) {
        return (0, rx_4.merge)(getA.filter(val => val !== value).tap(val => setB((value = val))), getB.filter(val => val !== value).tap(val => setA((value = val))));
    }
    exports.sync = sync;
    function syncAttribute(A, B, attr) {
        return sync(getAttribute(A, attr), val => (A[attr] = val), getAttribute(B, attr), val => (B[attr] = val), B[attr]);
    }
    exports.syncAttribute = syncAttribute;
    function model(el, ref) {
        return ref.switchMap(initial => {
            el.value = initial;
            return sync(onValue(el), val => (el.value = val), ref, ref.next.bind(ref));
        });
    }
    exports.model = model;
    function onValue(el) {
        return (0, rx_4.merge)((0, dom_2.on)(el, 'input'), (0, dom_2.on)(el, 'change'))
            .map(ev => ev.target.value)
            .raf();
    }
    exports.onValue = onValue;
    const LOG = (0, rx_4.tap)(val => console.log(val));
    rx_4.Observable.prototype.log = function () {
        return this.pipe(LOG);
    };
    rx_4.Observable.prototype.raf = function (fn) {
        return this.pipe(raf(fn));
    };
    rx_4.Observable.prototype.is = function (equalTo) {
        return this.pipe(is(equalTo));
    };
    rx_4.Observable.prototype.select = function (key) {
        return this.pipe(select(key));
    };
    function select(key) {
        return (0, rx_4.map)((val) => val[key]);
    }
    exports.select = select;
    function is(equalTo) {
        return (0, rx_4.operatorNext)(subs => (val) => subs.next(val === equalTo));
    }
    exports.is = is;
    function raf(fn) {
        return (0, rx_4.operator)(subscriber => {
            let to, completed = false;
            return {
                next(val) {
                    if (to)
                        cancelAnimationFrame(to);
                    to = requestAnimationFrame(() => {
                        if (fn)
                            fn(val);
                        subscriber.next(val);
                        to = 0;
                        if (completed)
                            subscriber.complete();
                    });
                },
                error(e) {
                    subscriber.error(e);
                },
                complete() {
                    if (to)
                        completed = true;
                    else
                        subscriber.complete();
                },
                unsubscribe() {
                    if (to)
                        cancelAnimationFrame(to);
                },
            };
        });
    }
    exports.raf = raf;
    function log() {
        return LOG;
    }
    exports.log = log;
    const portals = new Map();
    function portal(id) {
        return (el) => {
            portals.set(id, el);
            return new rx_4.Observable(() => () => portals.delete(id));
        };
    }
    exports.portal = portal;
    function teleport(el, portalName) {
        return new rx_4.Observable(() => {
            requestAnimationFrame(() => {
                const portal = portals.get(portalName);
                if (!portal)
                    throw new Error(`Portal "${portalName}" does not exist`);
                portal.appendChild(el);
            });
            return () => { var _a; return (_a = el.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(el); };
        });
    }
    exports.teleport = teleport;
    class Marker {
        constructor() {
            this.children = [];
            this.node = document.createComment('marker');
        }
        insert(content, nextNode = this.node) {
            var _a;
            if (content instanceof DocumentFragment) {
                this.children.push(...content.childNodes);
            }
            else
                this.children.push(content);
            (_a = this.node.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(content, nextNode);
        }
        remove(node) {
            const index = this.children.indexOf(node);
            if (index === -1)
                throw new Error('node not found');
            this.children.splice(index, 1);
            const parent = this.node.parentNode;
            if (!parent)
                return;
            parent.removeChild(node);
        }
        empty() {
            const parent = this.node.parentNode;
            if (!parent)
                return;
            this.children.forEach(snap => parent.removeChild(snap));
            this.children.length = 0;
        }
    }
    function list(source, renderFn) {
        return (host) => {
            const marker = new Marker();
            const map = new Map();
            host.bind(source.tap(ev => {
                if (ev.type === 'insert') {
                    const node = renderFn(ev.item);
                    map.set(ev.key, node instanceof DocumentFragment
                        ? Array.from(node.childNodes)
                        : node);
                    marker.insert(node);
                }
                else if (ev.type === 'remove') {
                    const node = map.get(ev.key);
                    if (Array.isArray(node))
                        node.forEach(n => marker.remove(n));
                    else if (node)
                        marker.remove(node);
                }
                else if (ev.type === 'empty')
                    marker.empty();
            }));
            return marker.node;
        };
    }
    exports.list = list;
    function loading(source, renderFn) {
        return (host) => {
            const marker = new Marker();
            host.bind((0, rx_4.observable)(() => {
                marker.insert(renderFn());
            }));
            host.bind(source.tap(() => marker.empty()));
        };
    }
    exports.loading = loading;
    function render(source, renderFn, loading, error) {
        return (host) => {
            const marker = new Marker();
            if (loading)
                host.bind((0, rx_4.observable)(() => {
                    marker.insert(loading());
                }));
            host.bind(source
                .tap(item => {
                marker.empty();
                marker.insert(renderFn(item));
            })
                .catchError(e => {
                if (error) {
                    marker.empty();
                    marker.insert(error(e));
                    return rx_4.EMPTY;
                }
                throw e;
            }));
            return marker.node;
        };
    }
    exports.render = render;
    function each(source, renderFn, empty) {
        const marker = new Marker();
        return (host) => {
            host.bind(source.tap(arr => {
                marker.empty();
                let len = 0;
                for (const item of arr) {
                    marker.insert(renderFn(item, len));
                    len++;
                }
                if (empty && len === 0)
                    marker.insert(empty());
            }));
            return marker.node;
        };
    }
    exports.each = each;
    function attrInitial(name, value) {
        return (ctx) => (0, rx_4.observable)(() => {
            if (!ctx.hasAttribute(name))
                ctx.setAttribute(name, value);
        });
    }
    function aria(prop, value) {
        return attrInitial(`aria-${prop}`, value);
    }
    exports.aria = aria;
    function ariaValue(host, prop) {
        return (0, rx_4.tap)(val => host.setAttribute('aria-' + prop, val === true ? 'true' : val === false ? 'false' : val.toString()));
    }
    exports.ariaValue = ariaValue;
    function ariaChecked(host) {
        return (0, rx_4.tap)(val => host.setAttribute('aria-checked', val === undefined ? 'mixed' : val ? 'true' : 'false'));
    }
    exports.ariaChecked = ariaChecked;
    function role(roleName) {
        return attrInitial('role', roleName);
    }
    exports.role = role;
    function handleListArrowKeys(host, el, selector, ev) {
        const key = ev.key;
        if (key === 'ArrowDown') {
            if (el)
                el = (0, dom_2.findNextNodeBySelector)(el, selector) || el;
            else {
                const first = host.firstElementChild;
                if (first)
                    el = first.matches(selector)
                        ? first
                        : (0, dom_2.findNextNodeBySelector)(first, selector);
            }
            if (el)
                ev.preventDefault();
        }
        else if (key === 'ArrowUp') {
            if (el)
                el =
                    (0, dom_2.findNextNodeBySelector)(el, selector, 'previousElementSibling') || el;
            else {
                const first = host.lastElementChild;
                if (first)
                    el = first.matches(selector)
                        ? first
                        : (0, dom_2.findNextNodeBySelector)(first, selector, 'previousElementSibling');
            }
            if (el)
                ev.preventDefault();
        }
        else
            return null;
        return el;
    }
    function navigationListUpDown(host, selector, startSelector, input = host) {
        return (0, dom_2.on)(input, 'keydown')
            .map(ev => {
            const el = host.querySelector(startSelector);
            return handleListArrowKeys(host, el, selector, ev);
        })
            .filter(el => !!el);
    }
    exports.navigationListUpDown = navigationListUpDown;
    function navigationList(host, selector, startSelector, input = host) {
        return (0, dom_2.on)(input, 'keydown')
            .map(ev => {
            let el = host.querySelector(startSelector);
            const key = ev.key;
            function findByFirstChar(item) {
                var _a, _b;
                return (((_a = item.matches) === null || _a === void 0 ? void 0 : _a.call(item, selector)) &&
                    ((_b = item.textContent) === null || _b === void 0 ? void 0 : _b[0].toLowerCase()) === key);
            }
            const newEl = handleListArrowKeys(host, el, selector, ev);
            if (newEl)
                return newEl;
            if (/^\w$/.test(key)) {
                const first = host.firstElementChild;
                el =
                    (el && (0, dom_2.findNextNode)(el, findByFirstChar)) ||
                        (first && (0, dom_2.findNextNode)(first, findByFirstChar)) ||
                        null;
                ev.preventDefault();
            }
            return el;
        })
            .filter(el => !!el);
    }
    exports.navigationList = navigationList;
    function focusableEvents(host, element = host) {
        return (0, rx_4.merge)((0, dom_2.on)(element, 'focus').pipe(triggerEvent(host, 'focusable.focus')), (0, dom_2.on)(element, 'blur').tap(() => {
            host.touched = true;
            (0, dom_2.trigger)(host, 'focusable.blur');
        }), (0, component_1.attributeChanged)(host, 'disabled').pipe(triggerEvent(host, 'focusable.change')), (0, component_1.attributeChanged)(host, 'touched').pipe(triggerEvent(host, 'focusable.change')));
    }
    exports.focusableEvents = focusableEvents;
    function disabledAttribute(host) {
        return (0, component_1.get)(host, 'disabled').tap(value => host.setAttribute('aria-disabled', value ? 'true' : 'false'));
    }
    exports.disabledAttribute = disabledAttribute;
    function focusableDisabled(host, element = host) {
        return disabledAttribute(host).tap(value => {
            if (value)
                element.removeAttribute('tabindex');
            else
                element.tabIndex = 0;
        });
    }
    exports.focusableDisabled = focusableDisabled;
    function focusable(host, element = host) {
        return (0, rx_4.merge)(focusableDisabled(host, element), focusableEvents(host, element));
    }
    exports.focusable = focusable;
    function registable(host, id, controller) {
        return (0, rx_4.observable)(() => {
            const detail = { controller };
            (0, dom_2.trigger)(host, id + '.register', detail);
            return () => { var _a; return (_a = detail.unsubscribe) === null || _a === void 0 ? void 0 : _a.call(detail); };
        });
    }
    exports.registable = registable;
    function registableHost(host, id, elements = new Set()) {
        return (0, rx_4.observable)(subs => {
            function register(ev) {
                if (ev.target) {
                    const detail = ev.detail;
                    const target = (detail.controller || ev.target);
                    elements.add(target);
                    subs.next(elements);
                    ev.detail.unsubscribe = () => {
                        elements.delete(target);
                        subs.next(elements);
                    };
                }
            }
            const inner = (0, dom_2.on)(host, id + '.register').subscribe(register);
            return () => inner.unsubscribe();
        });
    }
    exports.registableHost = registableHost;
    function selectableHostMultiple(host) {
        return new rx_4.Observable(subscriber => {
            function setSelected(option) {
                subscriber.next(option);
            }
            function onChange() {
                const { value, options } = host;
                for (const o of options) {
                    if (value.indexOf(o.value) !== -1) {
                        if (!o.selected)
                            setSelected(o);
                    }
                    else
                        o.selected = false;
                }
            }
            function setOptions() {
                const { value, options, selected } = host;
                options.forEach(o => (o.multiple = true));
                for (const o of options) {
                    if ((o.selected && !selected.has(o)) ||
                        (!o.selected && value.indexOf(o.value) !== -1))
                        setSelected(o);
                }
            }
            const subscription = (0, rx_4.merge)(registableHost(host, 'selectable', host.options).tap(setOptions), getAttribute(host, 'value').tap(onChange), (0, dom_2.on)(host, 'selectable.action').tap(ev => {
                var _a;
                if (ev.target && ((_a = host.options) === null || _a === void 0 ? void 0 : _a.has(ev.target))) {
                    ev.stopImmediatePropagation();
                    ev.stopPropagation();
                    setSelected(ev.target);
                }
            })).subscribe();
            return () => subscription.unsubscribe();
        });
    }
    exports.selectableHostMultiple = selectableHostMultiple;
    function selectableHost(host) {
        return new rx_4.Observable(subscriber => {
            function setSelected(option) {
                subscriber.next(option);
            }
            function onChange() {
                const { value, options, selected } = host;
                if (selected && selected.value === value)
                    return;
                for (const o of options)
                    if (o.parentNode && o.value === value)
                        return setSelected(o);
                    else
                        o.selected = false;
                setSelected(undefined);
            }
            function setOptions() {
                const { value, options, selected } = host;
                if (selected && options.has(selected))
                    return;
                let first = null;
                for (const o of options) {
                    first = first || o;
                    if (value === o.value)
                        return setSelected(o);
                }
                if (value === undefined && !selected && first)
                    setSelected(first);
                else if (selected && !selected.parentNode)
                    setSelected(undefined);
            }
            const subscription = (0, rx_4.merge)(registableHost(host, 'selectable', host.options)
                .tap(setOptions)
                .raf(setOptions), getAttribute(host, 'value').tap(onChange), (0, dom_2.on)(host, 'selectable.action').tap(ev => {
                var _a;
                if (ev.target && ((_a = host.options) === null || _a === void 0 ? void 0 : _a.has(ev.target))) {
                    ev.stopImmediatePropagation();
                    ev.stopPropagation();
                    setSelected(ev.target);
                }
            })).subscribe();
            return () => subscription.unsubscribe();
        });
    }
    exports.selectableHost = selectableHost;
    function selectable(host) {
        return (0, rx_4.merge)(registable(host, 'selectable'), (0, dom_2.onAction)(host).pipe(triggerEvent(host, 'selectable.action'), stopEvent()), (0, component_1.get)(host, 'selected').pipe(ariaValue(host, 'selected')));
    }
    exports.selectable = selectable;
    function checkedBehavior(host) {
        let first = true;
        return (0, rx_4.merge)((0, component_1.get)(host, 'value')
            .tap(val => {
            if (first) {
                if (val === true)
                    host.checked = true;
                first = false;
            }
            else
                host.checked = val === true;
        })
            .filter(() => false), (0, component_1.get)(host, 'checked').pipe(ariaChecked(host)));
    }
    exports.checkedBehavior = checkedBehavior;
    function stopChildrenEvents(target, event) {
        return (0, dom_2.on)(target, event).tap(ev => {
            if (ev.target !== target) {
                ev.stopPropagation();
                ev.stopImmediatePropagation();
            }
        });
    }
    exports.stopChildrenEvents = stopChildrenEvents;
    function $onAction(cb) {
        return (el) => (0, dom_2.onAction)(el).tap(cb);
    }
    exports.$onAction = $onAction;
    function staticTemplate(template) {
        let rendered;
        return () => {
            return (rendered || (rendered = template())).cloneNode(true);
        };
    }
    exports.staticTemplate = staticTemplate;
    function setClassName(el) {
        let className;
        return (0, rx_4.tap)(newClass => {
            if (className !== newClass) {
                el.classList.remove(className);
                className = newClass;
                if (className)
                    el.classList.add(className);
            }
        });
    }
    exports.setClassName = setClassName;
    function validateValue(el, ...validators) {
        return getAttribute(el, 'value').tap(value => {
            let message = true;
            validators.find(validateFn => {
                message = validateFn(value);
                return message !== true;
            });
            el.setCustomValidity(message === true ? '' : message);
        });
    }
    exports.validateValue = validateValue;
    const ENTITIES_REGEX = /[&<>]/g, ENTITIES_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
    };
    function escapeHtml(str) {
        return (str && str.replace(ENTITIES_REGEX, e => ENTITIES_MAP[e] || ''));
    }
    exports.escapeHtml = escapeHtml;
});
define("@cxl/css", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildTheme = exports.White87 = exports.White12 = exports.White8 = exports.White = exports.renderGlobal = exports.renderVariables = exports.mask = exports.rgba = exports.border = exports.margin = exports.padding = exports.defaultTheme = exports.pct = exports.boxShadow = void 0;
    const PSEUDO = {
        focus: ':focus',
        focusWithin: ':focus-within',
        hover: ':hover',
        empty: ':empty',
        active: ':active',
        firstChild: ':first-child',
        lastChild: ':last-child',
    };
    function boxShadow(offsetX, offsetY, blurRadius, spread, color) {
        return { offsetX, offsetY, blurRadius, spread, color };
    }
    exports.boxShadow = boxShadow;
    function pct(n) {
        return {
            __pct: true,
            toString() {
                return `${n}%`;
            },
        };
    }
    exports.pct = pct;
    const SNAKE_CSS = {
        webkitOverflowScrolling: '-webkit-overflow-scrolling',
    }, SNAKE_REGEX = /[A-Z]/g;
    exports.defaultTheme = {
        animation: { none: undefined },
        breakpoints: { small: 600, medium: 905, large: 1240, xlarge: 1440 },
        variables: { css: '' },
        typography: {
            default: {
                fontWeight: 400,
                fontFamily: 'var(--cxl-font)',
                fontSize: 'var(--cxl-font-size)',
                letterSpacing: 'normal',
            },
        },
        colors: {
            shadow: rgba(0, 0, 0, 0.26),
        },
        unit: 'px',
    };
    function toSnake(name) {
        return (SNAKE_CSS[name] ||
            (SNAKE_CSS[name] = name.replace(SNAKE_REGEX, m => '-' + m.toLowerCase())));
    }
    function parseRuleName(selector, name) {
        if (name === '$')
            return selector;
        if (name === '*')
            return `${selector},${selector} *`;
        if (name === '@a')
            return `a`;
        const [className, ...states] = name.split('$');
        const sel = states.length
            ? '(' + states.map(s => PSEUDO[s] || `[${s}]`).join('') + ')'
            : '';
        return `${selector}${sel}${className ? ` .${className}` : ''}`;
    }
    function padding(paddingTop, paddingRight = paddingTop, paddingBottom = paddingTop, paddingLeft = paddingTop) {
        return { paddingTop, paddingRight, paddingBottom, paddingLeft };
    }
    exports.padding = padding;
    function margin(marginTop, marginRight = marginTop, marginBottom = marginTop, marginLeft = marginTop) {
        return { marginTop, marginRight, marginBottom, marginLeft };
    }
    exports.margin = margin;
    function border(borderTop, borderRight = borderTop, borderBottom = borderTop, borderLeft = borderTop) {
        return { borderTop, borderRight, borderBottom, borderLeft };
    }
    exports.border = border;
    function rgbaToString() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }
    function rgba(r, g, b, a = 1) {
        r = r < 0 ? 0 : r > 255 ? 255 : r;
        g = g < 0 ? 0 : g > 255 ? 255 : g;
        b = b < 0 ? 0 : b > 255 ? 255 : b;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        return {
            r,
            g,
            b,
            a,
            toString: rgbaToString,
        };
    }
    exports.rgba = rgba;
    function mask({ r, g, b, a }) {
        return `linear-gradient(rgba(${r},${g},${b},${a})`;
    }
    exports.mask = mask;
    function renderVariables(variables) {
        let result = '';
        for (const i in variables)
            result += `--cxl-${toSnake(i)}:${variables[i]};`;
        return result;
    }
    exports.renderVariables = renderVariables;
    function renderGlobal(theme) {
        const { variables, colors, imports } = theme;
        let result = '';
        if (imports)
            imports.forEach(imp => (result += `@import url("${imp}");`));
        result += ':root{';
        for (const i in colors) {
            const name = toSnake(i);
            const value = colors[i];
            result += `--cxl-${name}:${value};--cxl--${name}:${value};`;
        }
        if (variables)
            result += renderVariables(variables);
        return result;
    }
    exports.renderGlobal = renderGlobal;
    exports.White = rgba(255, 255, 255, 1);
    exports.White8 = mask(rgba(255, 255, 255, 0.08));
    exports.White12 = mask(rgba(255, 255, 255, 0.12));
    exports.White87 = mask(rgba(255, 255, 255, 0.12));
    function buildTheme(theme) {
        const rootStyles = document.createElement('style');
        function toUnit(n) {
            return `${n}${typeof n === 'number' ? theme.unit : ''}`;
        }
        function color(val) {
            return typeof val === 'string' && val in theme.colors
                ? `var(--cxl-${toSnake(val.toString())})`
                : val.toString();
        }
        function renderColor(_def, style, prop, value) {
            style[prop] = color(value);
        }
        function renderDefault(style, prop, value) {
            style[prop] = toUnit(value);
        }
        function renderTransform(v, style) {
            style.transform =
                style.transform ||
                    (v.translateX !== undefined || v.translateY !== undefined
                        ? `translate(${toUnit(v.translateX || 0)},${toUnit(v.translateY || 0)})`
                        : '') +
                        (v.translateZ !== undefined
                            ? `translateZ(${toUnit(v.translateZ)})`
                            : '') +
                        (v.scaleX !== undefined || v.scaleY !== undefined
                            ? 'scale(' +
                                (v.scaleX === undefined ? 1 : v.scaleX) +
                                ',' +
                                (v.scaleY === undefined ? 1 : v.scaleY) +
                                ')'
                            : '') +
                        (v.rotate !== undefined ? 'rotate(' + v.rotate + 'deg)' : '');
        }
        function renderNumber(_def, style, prop, value) {
            style[prop] = value.toString();
        }
        function applyCSSStyle(style, def) {
            for (const i in def)
                style[i] = def[i];
        }
        const renderMap = {
            animation(def, style, _prop, value) {
                if (value === 'none') {
                    style.animation = 'none';
                    return;
                }
                const animation = theme.animation[value];
                if (animation) {
                    style.animation = animation.value;
                    def.prepend =
                        (def.prepend || '') +
                            `@keyframes cxl-${value}{${animation.keyframes}}`;
                }
                else
                    throw new Error('Animation not defined');
            },
            backgroundColor: renderColor,
            borderColor: renderColor,
            boxShadow(_def, style, _prop, v) {
                if (typeof v === 'string')
                    return (style.boxShadow = v);
                style.boxShadow = `${toUnit(v.offsetX)} ${toUnit(v.offsetY)} ${toUnit(v.blurRadius)} ${toUnit(v.spread)} ${color(v.color)}`;
            },
            color: renderColor,
            elevation(_def, style, _prop, n) {
                const x = toUnit(n);
                style.zIndex = n.toString();
                style.boxShadow =
                    n > 0 ? `${x} ${x} ${toUnit(5 * n)} var(--cxl-shadow)` : 'none';
            },
            font(_def, style, _p, value) {
                const css = {
                    ...theme.typography.default,
                    ...theme.typography[value],
                };
                applyCSSStyle(style, css);
            },
            flexGrow: renderNumber,
            flexShrink: renderNumber,
            opacity: renderNumber,
            translateX: renderTransform,
            translateY: renderTransform,
            translateZ: renderTransform,
            scaleX: renderTransform,
            scaleY: renderTransform,
            rotate: renderTransform,
            variables(_def, style, _p, value) {
                for (const i in value)
                    style[`--cxl-${toSnake(i)}`] = value[i];
            },
            zIndex: renderNumber,
        };
        function applyStyle(style, def) {
            for (const i in def) {
                const fn = renderMap[i], val = def[i];
                if (fn)
                    fn(def, style, i, val);
                else
                    renderDefault(style, i, val);
            }
        }
        function renderMedia(media, style, selector) {
            return `@media(min-width:${toUnit(media)}){${render(style, selector)}}`;
        }
        function renderRule(selector, name, styles) {
            if (name === '@small' ||
                name === '@xlarge' ||
                name === '@medium' ||
                name === '@large')
                return renderMedia(theme.breakpoints[name.slice(1)], styles, selector);
            return `${parseRuleName(selector, name)}{${style(styles)}}`;
        }
        function style(def) {
            const cssStyle = {};
            applyStyle(cssStyle, def);
            let result = '';
            for (const i in cssStyle)
                result += `${toSnake(i)}:${cssStyle[i]};`;
            return result;
        }
        function render(styles, baseSelector = ':host') {
            let css = '';
            for (const i in styles) {
                const style = styles[i];
                css += renderRule(baseSelector, i, style);
                if (style.prepend)
                    css = style.prepend + css;
            }
            return css;
        }
        function createStyleElement(styles, selector = ':host', global = false, theme) {
            const result = document.createElement('style');
            result.textContent =
                (!global && theme.globalStyles
                    ? render(theme.globalStyles, selector)
                    : '') + render(styles, selector);
            return result;
        }
        function applyTheme(container = document.head) {
            const result = renderGlobal(theme);
            rootStyles.innerHTML = result + '}';
            container.appendChild(rootStyles);
        }
        return {
            baseColor(name) {
                return `var(--cxl--${toSnake(name)})`;
            },
            style,
            render,
            applyTheme,
            css(styles, selector = ':host', global = false) {
                let stylesheet;
                return () => {
                    if (!stylesheet)
                        stylesheet = createStyleElement(styles, selector, global, theme);
                    return stylesheet.cloneNode(true);
                };
            },
        };
    }
    exports.buildTheme = buildTheme;
});
define("@cxl/ui/theme.js", ["require", "exports", "@cxl/css"], function (require, exports, css_1) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.delayTheme = exports.StateStyles = exports.HoverStyles = exports.FocusStyles = exports.DisabledStyles = exports.ColorStyles = exports.ErrorColors = exports.SecondaryColors = exports.PrimaryColors = exports.BaseColors = exports.css = exports.baseColor = exports.applyTheme = exports.theme = void 0;
    exports.theme = {
        ...css_1.defaultTheme,
        animation: {
            none: undefined,
            flash: {
                keyframes: `from, 50%, to { opacity: 1; } 25%,75% { opacity: 0; }`,
                value: 'cxl-flash var(--cxl-speed) infinite ease-in',
            },
            spin: {
                keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
                value: 'cxl-spin 2s infinite linear',
            },
            pulse: {
                keyframes: '0% { transform: rotate(0); } to { transform: rotate(360deg); }',
                value: 'cxl-pulse 1s infinite steps(8)',
            },
            expand: {
                keyframes: '0% { transform: scale(0,0); } 100% { transform: scale(1,1); }',
                value: 'cxl-expand var(--cxl-speed) 1 ease-in',
            },
            fadeIn: {
                keyframes: '0% { opacity: 0; } 100% { opacity: 1; }',
                value: 'cxl-fadeIn var(--cxl-speed) linear forwards',
            },
            fadeOut: {
                keyframes: '0% { opacity: 1 } 100% { visibility:hidden; opacity: 0; }',
                value: 'cxl-fadeOut var(--cxl-speed) linear both',
            },
            fadeInUp: {
                keyframes: '0% { opacity: 0;transform: translate(0, 40%) } 100% { opacity: 1;transform: none }',
                value: 'cxl-fadeInUp var(--cxl-speed) linear forwards',
            },
            slideInUp: {
                keyframes: '0% { transform: translate(0, 40%) } 100% { transform: none }',
                value: 'cxl-slideInUp var(--cxl-speed) linear both',
            },
            wait: {
                keyframes: `
0% { transform: translateX(0) scaleX(0) }
33% { transform: translateX(0) scaleX(0.75)}
66% { transform: translateX(75%) scaleX(0.25)}
100%{ transform:translateX(100%) scaleX(0) }
			`,
                value: 'cxl-wait 1s infinite linear',
            },
            spinnerstroke: {
                keyframes: `
	0%      { stroke-dashoffset: $start;  transform: rotate(0); }
	12.5%   { stroke-dashoffset: $end;    transform: rotate(0); }
	12.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(72.5deg); }
	25%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(72.5deg); }
	25.0001%   { stroke-dashoffset: $start;  transform: rotate(270deg); }
	37.5%   { stroke-dashoffset: $end;    transform: rotate(270deg); }
	37.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(161.5deg); }
	50%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(161.5deg); }
	50.0001%  { stroke-dashoffset: $start;  transform: rotate(180deg); }
	62.5%   { stroke-dashoffset: $end;    transform: rotate(180deg); }
	62.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(251.5deg); }
	75%     { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(251.5deg); }
	75.0001%  { stroke-dashoffset: $start;  transform: rotate(90deg); }
	87.5%   { stroke-dashoffset: $end;    transform: rotate(90deg); }
	87.5001%  { stroke-dashoffset: $end;    transform: rotateX(180deg) rotate(341.5deg); }
	100%    { stroke-dashoffset: $start;  transform: rotateX(180deg) rotate(341.5deg); }
			`
                    .replace(/\$start/g, (282.743 * (1 - 0.05)).toString())
                    .replace(/\$end/g, (282.743 * (1 - 0.8)).toString()),
                value: 'cxl-spinnerstroke 4s infinite cubic-bezier(.35,0,.25,1)',
            },
        },
        variables: {
            speed: '250ms',
            font: 'Roboto, Helvetica, sans-serif',
            fontSize: '16px',
            fontMonospace: 'monospace',
        },
        typography: {
            ...css_1.defaultTheme.typography,
            default: {
                fontWeight: 400,
                fontFamily: 'var(--cxl-font)',
                fontSize: 'var(--cxl-font-size)',
                letterSpacing: 'normal',
            },
            caption: { fontSize: '12px', letterSpacing: '0.4px' },
            h1: { fontWeight: 300, fontSize: '96px', letterSpacing: '-1.5px' },
            h2: { fontWeight: 300, fontSize: '60px', letterSpacing: '-0.5px' },
            h3: { fontSize: '48px' },
            h4: { fontSize: '34px', letterSpacing: '0.25px' },
            h5: { fontSize: '24px' },
            h6: { fontSize: '20px', fontWeight: 500, letterSpacing: '0.15px' },
            body2: {
                fontSize: '14px',
                letterSpacing: '0.25px',
                lineHeight: '20px',
            },
            subtitle: {
                letterSpacing: '0.15px',
            },
            subtitle2: {
                fontSize: '14px',
                fontWeight: 500,
                letterSpacing: '0.1px',
            },
            button: {
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '20px',
                letterSpacing: '1.25px',
                textTransform: 'uppercase',
            },
            code: { fontFamily: 'var(--cxl-font-monospace)' },
            monospace: { fontFamily: 'var(--cxl-font-monospace)' },
        },
        colors: {
            shadow: (0, css_1.rgba)(0, 0, 0, 0.26),
            primary: (0, css_1.rgba)(0x15, 0x65, 0xc0),
            link: (0, css_1.rgba)(0x15, 0x65, 0xc0),
            primaryLight: (0, css_1.rgba)(0x15, 0x65, 0xc0, 0.14),
            secondary: (0, css_1.rgba)(0xf9, 0xaa, 0x33),
            surface: (0, css_1.rgba)(0xff, 0xff, 0xff),
            error: (0, css_1.rgba)(0xb0, 0x00, 0x20),
            errorLight: (0, css_1.rgba)(0xb0, 0x00, 0x20, 0.14),
            onPrimary: (0, css_1.rgba)(0xff, 0xff, 0xff),
            onPrimaryLight: (0, css_1.rgba)(0x15, 0x65, 0xc0),
            onSecondary: (0, css_1.rgba)(0, 0, 0),
            onSurface: (0, css_1.rgba)(0, 0, 0),
            onSurface8: (0, css_1.rgba)(0, 0, 0, 0.08),
            onSurface12: (0, css_1.rgba)(0, 0, 0, 0.12),
            onSurface87: (0, css_1.rgba)(0, 0, 0, 0.87),
            onError: (0, css_1.rgba)(0xff, 0xff, 0xff),
            background: (0, css_1.rgba)(0xff, 0xff, 0xff),
            onBackground: (0, css_1.rgba)(0, 0, 0),
            headerText: (0, css_1.rgba)(0x0, 0x0, 0x0, 0.6),
            divider: (0, css_1.rgba)(0x0, 0x0, 0x0, 0.16),
        },
        imports: [
            'https://fonts.googleapis.com/css?family=Roboto:300,400,500&display=swap',
        ],
        globalStyles: {
            '@a': { color: 'link' },
            '*': {
                boxSizing: 'border-box',
                transition: 'opacity var(--cxl-speed), transform var(--cxl-speed), box-shadow var(--cxl-speed), filter var(--cxl-speed)',
            },
        },
    };
    _a = (0, css_1.buildTheme)(exports.theme), exports.applyTheme = _a.applyTheme, exports.baseColor = _a.baseColor, exports.css = _a.css;
    exports.BaseColors = {
        surface: (0, exports.baseColor)('surface'),
        onSurface: (0, exports.baseColor)('onSurface'),
        primary: (0, exports.baseColor)('primary'),
        onPrimary: (0, exports.baseColor)('onPrimary'),
        secondary: (0, exports.baseColor)('secondary'),
        onSecondary: (0, exports.baseColor)('onSecondary'),
    };
    exports.PrimaryColors = {
        ...exports.BaseColors,
        surface: (0, exports.baseColor)('primary'),
        onSurface: (0, exports.baseColor)('onPrimary'),
        primary: (0, exports.baseColor)('surface'),
        onPrimary: (0, exports.baseColor)('onSurface'),
    };
    exports.SecondaryColors = {
        ...exports.BaseColors,
        surface: (0, exports.baseColor)('secondary'),
        onSurface: (0, exports.baseColor)('onSecondary'),
        secondary: (0, exports.baseColor)('surface'),
        onSecondary: (0, exports.baseColor)('onSurface'),
    };
    exports.ErrorColors = {
        ...exports.BaseColors,
        surface: (0, exports.baseColor)('error'),
        onSurface: (0, exports.baseColor)('onError'),
    };
    exports.ColorStyles = {
        surface: {
            variables: exports.BaseColors,
            color: 'onSurface',
            backgroundColor: 'surface',
        },
        primary: { variables: exports.PrimaryColors },
        secondary: { variables: exports.SecondaryColors },
        error: { variables: exports.ErrorColors },
    };
    exports.DisabledStyles = {
        cursor: 'default',
        filter: 'saturate(0)',
        opacity: 0.38,
        pointerEvents: 'none',
    };
    exports.FocusStyles = {
        filter: 'invert(0.2) saturate(2) brightness(1.1)',
    };
    exports.HoverStyles = {
        filter: 'invert(0.15) saturate(1.5) brightness(1.1)',
    };
    exports.StateStyles = {
        $focus: { outline: 0 },
        $disabled: exports.DisabledStyles,
    };
    function delayTheme() {
        cancelAnimationFrame(loadingId);
    }
    exports.delayTheme = delayTheme;
    const loadingId = requestAnimationFrame(() => (0, exports.applyTheme)());
});
define("@cxl/ui/svg.js", ["require", "exports", "@cxl/component", "@cxl/dom"], function (require, exports, component_2, dom_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SvgImage = exports.Circle = exports.Path = exports.Svg = void 0;
    function renderChildren(el, children) {
        if (Array.isArray(children))
            for (const child of children)
                el.appendChild(child);
        else
            el.appendChild(children);
    }
    function Svg(p) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        el.style.fill = 'currentColor';
        el.style.verticalAlign = 'middle';
        el.setAttribute('viewBox', p.viewBox);
        if (p.width !== undefined)
            el.setAttribute('width', p.width.toString());
        if (p.height !== undefined)
            el.setAttribute('height', p.height.toString());
        if (p.className !== undefined)
            el.setAttribute('class', p.className);
        if (p.alt !== undefined)
            el.setAttribute('alt', p.alt);
        if (p.children)
            renderChildren(el, p.children);
        return el;
    }
    exports.Svg = Svg;
    function Path(p) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        if (p.className !== undefined)
            el.setAttribute('class', p.className);
        if (p.fill !== undefined)
            el.setAttribute('fill', p.fill);
        if (p.d !== undefined)
            el.setAttribute('d', p.d);
        if (p.style !== undefined)
            el.setAttribute('style', p.style);
        return el;
    }
    exports.Path = Path;
    function Circle(p) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        if (p.className !== undefined)
            el.setAttribute('class', p.className);
        if (p.style !== undefined)
            el.setAttribute('style', p.style);
        el.setAttribute('cx', p.cx);
        el.setAttribute('cy', p.cy);
        el.setAttribute('r', p.r);
        return el;
    }
    exports.Circle = Circle;
    let SvgImage = class SvgImage extends component_2.Component {
    };
    __decorate([
        (0, component_2.Attribute)()
    ], SvgImage.prototype, "src", void 0);
    SvgImage = __decorate([
        (0, component_2.Augment)('cxl-svg', $ => {
            const shadow = (0, dom_3.getShadow)($);
            $.bind((0, component_2.get)($, 'src').tap(async (src) => {
                if (!src) {
                    $.innerHTML = '';
                    return;
                }
                const content = await fetch(src).then(res => res.text());
                shadow.innerHTML = `<style>:host{display:inline-flex;}</style>${content}`;
            }));
        })
    ], SvgImage);
    exports.SvgImage = SvgImage;
});
define("@cxl/ui/core.js", ["require", "exports", "@cxl/component", "@cxl/tsx", "@cxl/rx", "@cxl/css", "@cxl/template", "@cxl/dom", "@cxl/ui/theme.js", "@cxl/ui/svg.js", "@cxl/component", "@cxl/ui/theme.js"], function (require, exports, component_3, tsx_2, rx_5, css_2, template_1, dom_4, theme_js_1, svg_js_1, component_4, theme_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.breakpointClass = exports.breakpoint = exports.Focusable = exports.focusDelegate = exports.ButtonBase = exports.Toolbar = exports.Application = exports.Meta = exports.Toggle = exports.T = exports.Hr = exports.RippleContainer = exports.Ripple = exports.CssAttribute = exports.ColorAttribute = exports.SizeAttribute = exports.ripple = exports.persistWithParameter = exports.FocusCircleStyle = exports.FocusHighlight = exports.css = exports.Span = exports.Path = exports.Svg = exports.Circle = void 0;
    Object.defineProperty(exports, "Circle", { enumerable: true, get: function () { return svg_js_1.Circle; } });
    Object.defineProperty(exports, "Svg", { enumerable: true, get: function () { return svg_js_1.Svg; } });
    Object.defineProperty(exports, "Path", { enumerable: true, get: function () { return svg_js_1.Path; } });
    Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return component_4.Span; } });
    Object.defineProperty(exports, "css", { enumerable: true, get: function () { return theme_js_2.css; } });
    exports.FocusHighlight = {
        $focus: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
        $hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
    };
    exports.FocusCircleStyle = (0, theme_js_1.css)({
        focusCircle: {
            position: 'absolute',
            width: 48,
            height: 48,
            backgroundColor: 'shadow',
            borderRadius: 24,
            opacity: 0,
            scaleX: 0,
            scaleY: 0,
            left: 0,
            display: 'inline-block',
            translateX: -14,
            translateY: -14,
        },
        focusCirclePrimary: { backgroundColor: 'primary' },
        focusCircle$invalid$touched: { backgroundColor: 'error' },
        focusCircle$hover: {
            scaleX: 1,
            scaleY: 1,
            translateX: -14,
            translateY: -14,
            opacity: 0.14,
        },
        focusCircle$focus: {
            scaleX: 1,
            scaleY: 1,
            translateX: -14,
            translateY: -14,
            opacity: 0.25,
        },
        focusCircle$disabled: { scaleX: 0, scaleY: 0 },
    });
    function persistWithParameter(prefix) {
        return (0, rx_5.operator)(() => {
            let lastAttr;
            return {
                next({ value, target }) {
                    if (value === undefined) {
                        if (target.hasAttribute(lastAttr))
                            target.removeAttribute(lastAttr);
                    }
                    else {
                        const attr = `${prefix}${value}`;
                        if (lastAttr !== attr) {
                            target.removeAttribute(lastAttr);
                            target.setAttribute(attr, '');
                            lastAttr = attr;
                        }
                    }
                },
            };
        });
    }
    exports.persistWithParameter = persistWithParameter;
    function attachRipple(hostEl, ev) {
        const x = ev.x, y = ev.y, rect = hostEl.getBoundingClientRect(), radius = rect.width > rect.height ? rect.width : rect.height, ripple = document.createElement('cxl-ripple'), parent = hostEl.shadowRoot || hostEl;
        ripple.x = x === undefined ? rect.width / 2 : x - rect.left;
        ripple.y = y === undefined ? rect.height / 2 : y - rect.top;
        ripple.radius = radius;
        parent.appendChild(ripple);
    }
    function ripple(element) {
        return ((0, dom_4.onAction)(element)
            .raf(ev => {
            if (!element.disabled)
                attachRipple(element, ev);
        }));
    }
    exports.ripple = ripple;
    function SizeAttribute(fn) {
        return CssAttribute([-1, 0, 1, 2, 3, 4, 5, 'small', 'big'].reduce((r, val) => {
            const sel = val === 0 ? '$' : `$size="${val}"`;
            if (val === 'small')
                val = -1;
            else if (val === 'big')
                val = 2;
            r[sel] = fn(val);
            return r;
        }, {}));
    }
    exports.SizeAttribute = SizeAttribute;
    function ColorAttribute(defaultColor) {
        return CssAttribute({
            $: {
                color: 'onSurface',
                backgroundColor: 'surface',
                ...(defaultColor && theme_js_1.ColorStyles[defaultColor]),
            },
            '$color="surface"': theme_js_1.ColorStyles.surface,
            '$color="primary"': theme_js_1.ColorStyles.primary,
            '$color="secondary"': theme_js_1.ColorStyles.secondary,
            '$color="error"': theme_js_1.ColorStyles.error,
        });
    }
    exports.ColorAttribute = ColorAttribute;
    function CssAttribute(styles) {
        const el = (0, theme_js_1.css)(styles);
        return (0, component_3.Attribute)({
            persist: true,
            render: host => (0, dom_4.getShadow)(host).appendChild(el()),
        });
    }
    exports.CssAttribute = CssAttribute;
    let Ripple = class Ripple extends component_3.Component {
        constructor() {
            super(...arguments);
            this.x = 0;
            this.y = 0;
            this.radius = 0;
        }
    };
    __decorate([
        (0, component_3.Attribute)()
    ], Ripple.prototype, "x", void 0);
    __decorate([
        (0, component_3.Attribute)()
    ], Ripple.prototype, "y", void 0);
    __decorate([
        (0, component_3.Attribute)()
    ], Ripple.prototype, "radius", void 0);
    Ripple = __decorate([
        (0, component_3.Augment)('cxl-ripple', (0, theme_js_1.css)({
            $: {
                display: 'block',
                position: 'absolute',
                overflowX: 'hidden',
                overflowY: 'hidden',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
            },
            ripple: {
                position: 'relative',
                display: 'block',
                borderRadius: (0, css_2.pct)(100),
                scaleX: 0,
                scaleY: 0,
                backgroundColor: 'onSurface',
                opacity: 0.16,
                animation: 'expand',
                animationDuration: '0.4s',
            },
            ripple$primary: { backgroundColor: 'primary' },
            ripple$secondary: { backgroundColor: 'secondary' },
        }), ctx => ((0, tsx_2.dom)(component_3.Span, { "$": el => (0, rx_5.merge)((0, component_3.onUpdate)(ctx).tap(host => {
                const style = el.style;
                style.left = host.x - host.radius + 'px';
                style.top = host.y - host.radius + 'px';
                style.width = style.height = host.radius * 2 + 'px';
            }), (0, dom_4.on)(el, 'animationend').tap(() => ctx.remove())), className: "ripple" })))
    ], Ripple);
    exports.Ripple = Ripple;
    let RippleContainer = class RippleContainer extends component_3.Component {
    };
    RippleContainer = __decorate([
        (0, component_3.Augment)('cxl-ripple-container', ripple, (0, theme_js_1.css)({
            $: {
                display: 'block',
                position: 'relative',
                overflowX: 'hidden',
                overflowY: 'hidden',
            },
        }), () => (0, tsx_2.dom)("slot", null))
    ], RippleContainer);
    exports.RippleContainer = RippleContainer;
    let Hr = class Hr extends component_3.Component {
    };
    __decorate([
        (0, component_3.StyleAttribute)()
    ], Hr.prototype, "pad", void 0);
    Hr = __decorate([
        (0, component_3.Augment)('cxl-hr', (0, template_1.role)('separator'), (0, theme_js_1.css)({
            $: {
                display: 'block',
                height: 1,
                backgroundColor: 'divider',
            },
            '$pad="8"': { marginTop: 8, marginBottom: 8 },
            '$pad="16"': { marginTop: 16, marginBottom: 16 },
            '$pad="24"': { marginTop: 24, marginBottom: 24 },
            '$pad="32"': { marginTop: 32, marginBottom: 32 },
        }))
    ], Hr);
    exports.Hr = Hr;
    let T = class T extends component_3.Component {
        constructor() {
            super(...arguments);
            this.h1 = false;
            this.h2 = false;
            this.h3 = false;
            this.h4 = false;
            this.h5 = false;
            this.h6 = false;
            this.caption = false;
            this.center = false;
            this.subtitle = false;
            this.subtitle2 = false;
            this.body2 = false;
            this.code = false;
            this.inline = false;
            this.button = false;
            this.justify = false;
        }
    };
    __decorate([
        (0, component_3.Attribute)({
            persistOperator: persistWithParameter(''),
        })
    ], T.prototype, "font", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h1", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h2", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h3", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h4", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h5", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "h6", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "caption", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "center", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "subtitle", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "subtitle2", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "body2", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "code", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "inline", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "button", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], T.prototype, "justify", void 0);
    T = __decorate([
        (0, component_3.Augment)('cxl-t', (0, theme_js_1.css)({
            $: { display: 'block', font: 'default', marginBottom: 8 },
            $center: { textAlign: 'center' },
            $inline: { display: 'inline', marginTop: 0, marginBottom: 0 },
            $caption: { font: 'caption' },
            $h1: { font: 'h1', marginTop: 32, marginBottom: 64 },
            $h2: { font: 'h2', marginTop: 24, marginBottom: 48 },
            $h3: { font: 'h3', marginTop: 24, marginBottom: 32 },
            $h4: { font: 'h4', marginTop: 30, marginBottom: 30 },
            $h5: { font: 'h5', marginTop: 24, marginBottom: 24 },
            $h6: { font: 'h6', marginTop: 16, marginBottom: 16 },
            $body2: { font: 'body2' },
            $button: { font: 'button' },
            $subtitle: { font: 'subtitle', marginBottom: 0 },
            $subtitle2: { font: 'subtitle2', opacity: 0.73 },
            $code: { font: 'code' },
            $firstChild: { marginTop: 0 },
            $lastChild: { marginBottom: 0 },
            $justify: { textAlign: 'justify' },
        }), _ => (0, tsx_2.dom)("slot", null))
    ], T);
    exports.T = T;
    let Toggle = class Toggle extends component_3.Component {
    };
    __decorate([
        (0, component_3.Attribute)()
    ], Toggle.prototype, "target", void 0);
    Toggle = __decorate([
        (0, component_3.Augment)('cxl-toggle', $ => (0, dom_4.onAction)($).tap(ev => {
            let target = $.target;
            ev.stopPropagation();
            if (typeof target === 'string')
                target = document.getElementById(target);
            if (target)
                target.visible = !target.visible;
            else {
                const popups = $.querySelectorAll('cxl-popup');
                for (const popup of popups)
                    popup.visible = !popup.visible;
            }
        }))
    ], Toggle);
    exports.Toggle = Toggle;
    const MetaNodes = [
        (0, tsx_2.dom)("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
        (0, tsx_2.dom)("meta", { name: "apple-mobile-web-app-capable", content: "yes" }),
        (0, tsx_2.dom)("meta", { name: "mobile-web-app-capable", content: "yes" }),
        (0, tsx_2.dom)("style", null, `html,body{padding:0;margin:0;min-height:100%;font-family:var(--cxl-font)}a,a:active,a:visited{color:var(--cxl-link)}`),
    ];
    let Meta = class Meta extends component_3.Component {
        connectedCallback() {
            requestAnimationFrame(() => {
                var _a;
                document.documentElement.lang = 'en';
                const head = ((_a = this.ownerDocument) === null || _a === void 0 ? void 0 : _a.head) || document.head;
                MetaNodes.forEach(child => head.appendChild(child));
            });
            super.connectedCallback();
        }
    };
    Meta = __decorate([
        (0, component_3.Augment)('cxl-meta')
    ], Meta);
    exports.Meta = Meta;
    let Application = class Application extends component_3.Component {
        constructor() {
            super(...arguments);
            this.permanent = false;
        }
    };
    __decorate([
        (0, component_3.StyleAttribute)()
    ], Application.prototype, "permanent", void 0);
    Application = __decorate([
        (0, component_3.Augment)('cxl-application', (0, theme_js_1.css)({
            $: {
                display: 'flex',
                backgroundColor: 'background',
                flexDirection: 'column',
                overflowX: 'hidden',
                zIndex: 0,
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
            },
            '@large': {
                $permanent: { paddingLeft: 288 },
            },
        }), _ => ((0, tsx_2.dom)(tsx_2.dom, null,
            (0, tsx_2.dom)(Meta, null),
            (0, tsx_2.dom)("slot", null))))
    ], Application);
    exports.Application = Application;
    let Toolbar = class Toolbar extends component_3.Component {
    };
    Toolbar = __decorate([
        (0, component_3.Augment)('cxl-toolbar', (0, theme_js_1.css)({
            $: {
                display: 'flex',
                gridColumnEnd: 'span 12',
                columnGap: 16,
                alignItems: 'center',
                minHeight: 56,
                ...(0, css_2.padding)(4, 8, 4, 8),
            },
        }), component_3.Slot)
    ], Toolbar);
    exports.Toolbar = Toolbar;
    let ButtonBase = class ButtonBase extends component_3.Component {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.primary = false;
            this.flat = false;
            this.secondary = false;
            this.touched = false;
            this.outline = false;
            this.size = 0;
        }
    };
    __decorate([
        (0, component_3.StyleAttribute)()
    ], ButtonBase.prototype, "disabled", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], ButtonBase.prototype, "primary", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], ButtonBase.prototype, "flat", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], ButtonBase.prototype, "secondary", void 0);
    __decorate([
        (0, component_3.Attribute)()
    ], ButtonBase.prototype, "touched", void 0);
    __decorate([
        (0, component_3.StyleAttribute)()
    ], ButtonBase.prototype, "outline", void 0);
    __decorate([
        SizeAttribute(s => ({
            borderRadius: 2 + s * 2,
            fontSize: 14 + s * 4,
            lineHeight: 20 + s * 8,
            paddingRight: 16 + s * 4,
            paddingLeft: 16 + s * 4,
        }))
    ], ButtonBase.prototype, "size", void 0);
    ButtonBase = __decorate([
        (0, component_3.Augment)((0, template_1.role)('button'), Focusable, (0, theme_js_1.css)({
            $: {
                elevation: 1,
                paddingTop: 8,
                paddingBottom: 8,
                cursor: 'pointer',
                display: 'inline-block',
                font: 'button',
                userSelect: 'none',
                backgroundColor: 'surface',
                color: 'onSurface',
                textAlign: 'center',
            },
            $flat: {
                elevation: 0,
                paddingRight: 8,
                paddingLeft: 8,
            },
            $flat$primary: {
                backgroundColor: 'surface',
                color: 'primary',
            },
            $flat$secondary: {
                backgroundColor: 'surface',
                color: 'secondary',
            },
            $primary: {
                backgroundColor: 'primary',
                color: 'onPrimary',
            },
            $secondary: {
                backgroundColor: 'secondary',
                color: 'onSecondary',
            },
            $outline: {
                backgroundColor: 'surface',
                elevation: 0,
                ...(0, css_2.border)(1),
                borderStyle: 'solid',
                borderColor: 'onSurface',
            },
            $outline$primary: {
                color: 'primary',
                borderColor: 'primary',
            },
            $outline$secondary: {
                color: 'secondary',
                borderColor: 'secondary',
            },
            $active: { elevation: 3 },
            $active$disabled: { elevation: 1 },
            $active$flat: { elevation: 0 },
        }), (0, theme_js_1.css)(exports.FocusHighlight), ripple)
    ], ButtonBase);
    exports.ButtonBase = ButtonBase;
    function focusDelegate(host, delegate) {
        host.Shadow({ children: disabledCss });
        return (0, rx_5.merge)((0, template_1.disabledAttribute)(host).tap(val => (delegate.disabled = val)), (0, template_1.focusableEvents)(host, delegate));
    }
    exports.focusDelegate = focusDelegate;
    const stateStyles = (0, theme_js_1.css)(theme_js_1.StateStyles);
    const disabledCss = (0, theme_js_1.css)({ $disabled: theme_js_1.StateStyles.$disabled });
    function Focusable(host) {
        host.bind((0, template_1.focusable)(host));
        return stateStyles();
    }
    exports.Focusable = Focusable;
    function breakpoint(el) {
        return (0, dom_4.onResize)(el)
            .raf()
            .map(() => {
            const breakpoints = theme_js_1.theme.breakpoints;
            const width = el.clientWidth;
            let newClass = 'xsmall';
            for (const bp in breakpoints) {
                if (breakpoints[bp] > width)
                    return newClass;
                newClass = bp;
            }
            return newClass;
        });
    }
    exports.breakpoint = breakpoint;
    function breakpointClass(el) {
        return breakpoint(el).pipe((0, template_1.setClassName)(el));
    }
    exports.breakpointClass = breakpointClass;
});
define("@cxl/ui/icon.js", ["require", "exports", "@cxl/component", "@cxl/css", "@cxl/tsx", "@cxl/ui/core.js", "@cxl/ui/theme.js"], function (require, exports, component_5, css_3, tsx_3, core_js_1, theme_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SvgIcon = exports.IconButton = exports.PersonIcon = exports.CloseIcon = exports.SearchIcon = exports.MoreVertIcon = exports.MenuIcon = exports.ArrowBackIcon = void 0;
    function ArrowBackIcon() {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: 20 },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M0 0h24v24H0z", fill: "none" }),
            (0, tsx_3.dom)(core_js_1.Path, { d: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" })));
    }
    exports.ArrowBackIcon = ArrowBackIcon;
    function MenuIcon() {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: 20 },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M0 0h24v24H0z", fill: "none" }),
            (0, tsx_3.dom)(core_js_1.Path, { d: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" })));
    }
    exports.MenuIcon = MenuIcon;
    function MoreVertIcon() {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: 20 },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M12 15.984q0.797 0 1.406 0.609t0.609 1.406-0.609 1.406-1.406 0.609-1.406-0.609-0.609-1.406 0.609-1.406 1.406-0.609zM12 9.984q0.797 0 1.406 0.609t0.609 1.406-0.609 1.406-1.406 0.609-1.406-0.609-0.609-1.406 0.609-1.406 1.406-0.609zM12 8.016q-0.797 0-1.406-0.609t-0.609-1.406 0.609-1.406 1.406-0.609 1.406 0.609 0.609 1.406-0.609 1.406-1.406 0.609z" })));
    }
    exports.MoreVertIcon = MoreVertIcon;
    function SearchIcon() {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: 20 },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M0 0h24v24H0z", fill: "none" }),
            (0, tsx_3.dom)(core_js_1.Path, { d: "M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" })));
    }
    exports.SearchIcon = SearchIcon;
    function CloseIcon(p) {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: p.width || 24 },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M0 0h24v24H0z", fill: "none" }),
            (0, tsx_3.dom)(core_js_1.Path, { d: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" })));
    }
    exports.CloseIcon = CloseIcon;
    function PersonIcon(p) {
        return ((0, tsx_3.dom)(core_js_1.Svg, { viewBox: "0 0 24 24", width: p.width },
            (0, tsx_3.dom)(core_js_1.Path, { d: "M0 0h24v24H0z", fill: "none" }),
            (0, tsx_3.dom)(core_js_1.Path, { d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" })));
    }
    exports.PersonIcon = PersonIcon;
    let IconButton = class IconButton extends core_js_1.ButtonBase {
    };
    IconButton = __decorate([
        (0, component_5.Augment)('cxl-icon-button', (0, theme_js_3.css)({
            $: {
                display: 'inline-flex',
                elevation: 0,
                paddingLeft: 8,
                paddingRight: 8,
                verticalAlign: 'middle',
                borderRadius: (0, css_3.pct)(100),
                overflowX: 'hidden',
            },
        }), () => (0, tsx_3.dom)("slot", null))
    ], IconButton);
    exports.IconButton = IconButton;
    let SvgIcon = class SvgIcon extends component_5.Component {
        constructor() {
            super(...arguments);
            this.icon = '';
        }
    };
    __decorate([
        (0, component_5.Attribute)()
    ], SvgIcon.prototype, "icon", void 0);
    __decorate([
        (0, component_5.Attribute)()
    ], SvgIcon.prototype, "width", void 0);
    __decorate([
        (0, component_5.Attribute)()
    ], SvgIcon.prototype, "height", void 0);
    SvgIcon = __decorate([
        (0, component_5.Augment)('cxl-svg-icon', (0, theme_js_3.css)({
            $: {
                display: 'inline-block',
                lineHeight: 0,
            },
            icon: {
                width: '1.5em',
                height: '1.5em',
                stroke: 'currentColor',
                fill: 'currentColor',
                verticalAlign: 'text-bottom',
            },
        }), host => {
            const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            host.bind((0, component_5.get)(host, 'icon').tap(val => {
                if (val)
                    use.setAttribute('href', val);
                else
                    use.removeAttribute('href');
            }));
            host.bind((0, component_5.get)(host, 'width').tap(val => {
                el.style.width = val === undefined ? '' : val.toString();
            }));
            host.bind((0, component_5.get)(host, 'height').tap(val => {
                el.style.height = val === undefined ? '' : val.toString();
            }));
            el.classList.add('icon');
            el.appendChild(use);
            return el;
        })
    ], SvgIcon);
    exports.SvgIcon = SvgIcon;
});
define("@cxl/ui/appbar.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/dom", "@cxl/template", "@cxl/css", "@cxl/rx", "@cxl/ui/core.js", "@cxl/ui/icon.js", "@cxl/ui/theme.js"], function (require, exports, tsx_4, component_6, dom_5, template_2, css_4, rx_6, core_js_2, icon_js_1, theme_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppbarTitle = exports.AppbarContextual = exports.Appbar = void 0;
    let Appbar = class Appbar extends component_6.Component {
        constructor() {
            super(...arguments);
            this.extended = false;
            this.center = false;
            this.sticky = false;
            this.flat = false;
            this.padded = false;
        }
    };
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "extended", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "center", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "contextual", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "sticky", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "flat", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], Appbar.prototype, "padded", void 0);
    __decorate([
        (0, core_js_2.ColorAttribute)('primary')
    ], Appbar.prototype, "color", void 0);
    Appbar = __decorate([
        (0, component_6.Augment)('cxl-appbar', (0, template_2.role)('heading'), (0, template_2.aria)('level', '1'), (0, theme_js_4.css)({
            $: {
                display: 'block',
                backgroundColor: 'surface',
                flexShrink: 0,
                textAlign: 'left',
                color: 'onSurface',
                elevation: 2,
            },
            $sticky: {
                position: 'sticky',
                top: 0,
                zIndex: 5,
            },
            $flat: {
                boxShadow: 'none',
            },
            grow: { flexGrow: 1 },
            flex: {
                display: 'flex',
                alignItems: 'center',
                height: 56,
                ...(0, css_4.padding)(4, 16, 4, 16),
                font: 'h6',
            },
            actions: { marginRight: -8 },
            flex$extended: {
                alignItems: 'start',
                paddingBottom: 8,
                height: 128,
            },
            'a, ::slotted(cxl-appbar-title)': {
                marginBottom: 12,
                alignSelf: 'flex-end',
            },
            $fixed: { position: 'fixed', top: 0, right: 0, left: 0 },
            '@xlarge': {
                flex$center: {
                    width: 1200,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    paddingRight: 0,
                    paddingLeft: 0,
                },
                tabs$center: {
                    width: 1200,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                },
            },
            contextual: {
                display: 'none',
            },
            flex$contextual: {
                display: 'none',
            },
            contextual$contextual: {
                display: 'flex',
            },
            back: {
                marginLeft: -8,
            },
            $padded: {
                ...(0, css_4.padding)(20, 8, 20, 8),
            },
            '@small': {
                $padded: { ...(0, css_4.padding)(20, 32, 20, 32) },
            },
        }), (0, template_2.portal)('cxl-appbar'), $ => (0, rx_6.merge)((0, dom_5.onChildrenMutation)($), (0, component_6.get)($, 'contextual')).raf(() => {
            for (const el of $.children)
                if (el instanceof AppbarContextual)
                    el.visible = el.name === $.contextual;
        }), host => ((0, tsx_4.dom)(tsx_4.dom, null,
            (0, tsx_4.dom)("div", { className: "flex" },
                (0, tsx_4.dom)("slot", null),
                (0, tsx_4.dom)(core_js_2.Span, { className: "actions", "$": (0, template_2.portal)('cxl-appbar-actions') })),
            (0, tsx_4.dom)("div", { className: "flex contextual" },
                (0, tsx_4.dom)(icon_js_1.IconButton, { className: "back", "$": el => (0, dom_5.onAction)(el).tap(() => (host.contextual = undefined)) },
                    (0, tsx_4.dom)(icon_js_1.ArrowBackIcon, null)),
                (0, tsx_4.dom)("div", { className: "grow" },
                    (0, tsx_4.dom)(host.Slot, { selector: "cxl-appbar-contextual" }))),
            (0, tsx_4.dom)("div", { className: "tabs" },
                (0, tsx_4.dom)(host.Slot, { selector: "cxl-tabs" })),
            (0, tsx_4.dom)("div", { className: "fab" },
                (0, tsx_4.dom)(host.Slot, { selector: "cxl-fab" })))))
    ], Appbar);
    exports.Appbar = Appbar;
    let AppbarContextual = class AppbarContextual extends component_6.Component {
        constructor() {
            super(...arguments);
            this.visible = false;
        }
    };
    __decorate([
        (0, component_6.Attribute)()
    ], AppbarContextual.prototype, "name", void 0);
    __decorate([
        (0, component_6.StyleAttribute)()
    ], AppbarContextual.prototype, "visible", void 0);
    AppbarContextual = __decorate([
        (0, component_6.Augment)('cxl-appbar-contextual', (0, theme_js_4.css)({ $: { display: 'none' }, $visible: { display: 'block' } }), _ => (0, tsx_4.dom)("slot", null))
    ], AppbarContextual);
    exports.AppbarContextual = AppbarContextual;
    let AppbarTitle = class AppbarTitle extends component_6.Component {
    };
    AppbarTitle = __decorate([
        (0, component_6.Augment)('cxl-appbar-title', (0, theme_js_4.css)({
            $: {
                flexGrow: 1,
                lineHeight: 24,
                marginRight: 16,
                textDecoration: 'none',
            },
            parentslot: { display: 'none' },
            '@small': {
                parentslot: { display: 'contents' },
            },
        }), () => ((0, tsx_4.dom)(tsx_4.dom, null,
            (0, tsx_4.dom)("slot", { className: "parentslot", name: "parent" }),
            (0, tsx_4.dom)("slot", null))))
    ], AppbarTitle);
    exports.AppbarTitle = AppbarTitle;
});
define("@cxl/ui/input-base.js", ["require", "exports", "@cxl/component", "@cxl/rx", "@cxl/template"], function (require, exports, component_7, rx_7, template_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.InputBase = void 0;
    let InputBase = class InputBase extends component_7.Component {
        constructor() {
            var _a, _b;
            super();
            this.invalid = false;
            this.disabled = false;
            this.touched = false;
            this.name = '';
            this.internals = (_b = (_a = this).attachInternals) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        formDisabledCallback(disabled) {
            this.disabled = disabled;
        }
        get validationMessage() {
            var _a;
            return ((_a = this.internals) === null || _a === void 0 ? void 0 : _a.validationMessage) || '';
        }
        get validity() {
            var _a;
            return ((_a = this.internals) === null || _a === void 0 ? void 0 : _a.validity) || null;
        }
        setCustomValidity(msg) {
            var _a;
            const invalid = (this.invalid = !!msg);
            (_a = this.internals) === null || _a === void 0 ? void 0 : _a.setValidity({ customError: invalid }, msg);
        }
        focus() {
            if (this.focusElement)
                this.focusElement.focus();
            else
                super.focus();
        }
    };
    InputBase.formAssociated = true;
    __decorate([
        (0, component_7.Attribute)()
    ], InputBase.prototype, "value", void 0);
    __decorate([
        (0, component_7.StyleAttribute)()
    ], InputBase.prototype, "invalid", void 0);
    __decorate([
        (0, component_7.StyleAttribute)()
    ], InputBase.prototype, "disabled", void 0);
    __decorate([
        (0, component_7.StyleAttribute)()
    ], InputBase.prototype, "touched", void 0);
    __decorate([
        (0, component_7.Attribute)()
    ], InputBase.prototype, "name", void 0);
    InputBase = __decorate([
        (0, component_7.Augment)(host => (0, rx_7.merge)((0, component_7.attributeChanged)(host, 'invalid').pipe((0, template_3.triggerEvent)(host, 'invalid')), (0, template_3.registable)(host, 'form'), (0, component_7.get)(host, 'value').tap(val => { var _a; return (_a = host.internals) === null || _a === void 0 ? void 0 : _a.setFormValue(val); }), (0, component_7.get)(host, 'invalid').tap(val => {
            if (val && !host.validationMessage)
                host.setCustomValidity('Invalid value');
        }), (0, component_7.attributeChanged)(host, 'value').pipe((0, template_3.triggerEvent)(host, 'change'))))
    ], InputBase);
    exports.InputBase = InputBase;
});
define("@cxl/ui/field.js", ["require", "exports", "@cxl/component", "@cxl/tsx", "@cxl/dom", "@cxl/css", "@cxl/rx", "@cxl/ui/theme.js"], function (require, exports, component_8, tsx_5, dom_6, css_5, rx_8, theme_js_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Field = exports.Fieldset = exports.FocusLine = exports.fieldInput = void 0;
    const FieldBase = [
        (0, theme_js_5.css)({
            $: {
                color: 'onSurface',
                position: 'relative',
                display: 'block',
                gridColumnEnd: 'span 12',
            },
            container: {
                position: 'relative',
                textAlign: 'left',
                ...(0, css_5.padding)(0, 12, 4, 12),
            },
            $invalid: { color: 'error' },
            $outline: { marginTop: -2 },
            container$outline: {
                borderColor: 'onSurface',
                borderWidth: 1,
                borderStyle: 'solid',
                borderRadius: 4,
                marginTop: 2,
                paddingTop: 12,
                paddingBottom: 12,
            },
            container$outline$focusWithin: {
                boxShadow: (0, css_5.boxShadow)(0, 0, 0, 1, 'primary'),
            },
            container$focusWithin$outline: {
                borderColor: 'primary',
            },
            container$invalid$outline: { borderColor: 'error' },
            container$invalid$outline$focusWithin: {
                boxShadow: (0, css_5.boxShadow)(0, 0, 0, 1, 'error'),
            },
            content: {
                display: 'flex',
                position: 'relative',
                font: 'default',
                marginTop: 4,
                lineHeight: 20,
            },
            content$focusWithin: {
                color: 'primary',
            },
            mask: {
                position: 'absolute',
                top: 0,
                right: 0,
                left: 0,
                bottom: 0,
                backgroundColor: 'onSurface8',
            },
            mask$outline: {
                borderRadius: 4,
                backgroundColor: 'surface',
            },
            mask$hover: {
                filter: 'invert(0.15) saturate(1.5) brightness(1.1)',
            },
            mask$hover$disabled: { filter: 'none' },
            label: {
                position: 'relative',
                font: 'caption',
                marginLeft: -4,
                paddingTop: 8,
                paddingBottom: 2,
                lineHeight: 10,
                minHeight: 13,
                verticalAlign: 'bottom',
            },
            label$focusWithin: { color: 'primary' },
            label$invalid: { color: 'error' },
            label$outline: {
                position: 'absolute',
                translateY: -17,
                paddingTop: 0,
                height: 5,
                minHeight: 'auto',
                backgroundColor: 'surface',
                display: 'inline-block',
            },
            label$floating$novalue: {
                font: 'default',
                translateY: 21,
                opacity: 0.75,
            },
            label$leading: { paddingLeft: 24 },
            label$floating$novalue$outline: {
                translateY: 9,
            },
        }),
        ($) => ((0, tsx_5.dom)("div", { className: "container" },
            (0, tsx_5.dom)("div", { className: "mask" }),
            (0, tsx_5.dom)("div", { className: "label" },
                (0, tsx_5.dom)($.Slot, { selector: "cxl-label" })),
            (0, tsx_5.dom)("div", { className: "content" },
                (0, tsx_5.dom)("slot", null)))),
    ];
    function fieldInput(host) {
        return (0, rx_8.defer)(() => host.parentNode instanceof Field
            ? (0, component_8.get)(host.parentNode, 'input').filter(inp => !!inp)
            : rx_8.EMPTY);
    }
    exports.fieldInput = fieldInput;
    let FocusLine = class FocusLine extends component_8.Component {
        constructor() {
            super(...arguments);
            this.focused = false;
            this.invalid = false;
        }
    };
    __decorate([
        (0, component_8.StyleAttribute)()
    ], FocusLine.prototype, "focused", void 0);
    __decorate([
        (0, component_8.StyleAttribute)()
    ], FocusLine.prototype, "invalid", void 0);
    FocusLine = __decorate([
        (0, component_8.Augment)('cxl-focus-line', (0, theme_js_5.css)({
            $: {
                display: 'block',
                height: 2,
                borderWidth: 0,
                borderTop: 1,
                borderStyle: 'solid',
                borderColor: 'onSurface',
            },
            $invalid: { borderColor: 'error' },
            line: {
                backgroundColor: 'primary',
                marginTop: -1,
                scaleX: 0,
                height: 2,
            },
            line$focused: { scaleX: 1 },
            line$invalid: { backgroundColor: 'error' },
        }), _ => (0, tsx_5.dom)("div", { className: "line" }))
    ], FocusLine);
    exports.FocusLine = FocusLine;
    let Fieldset = class Fieldset extends component_8.Component {
        constructor() {
            super(...arguments);
            this.outline = true;
        }
    };
    __decorate([
        (0, component_8.StyleAttribute)()
    ], Fieldset.prototype, "outline", void 0);
    Fieldset = __decorate([
        (0, component_8.Augment)('cxl-fieldset', ...FieldBase, host => (0, rx_8.merge)((0, dom_6.on)(host, 'invalid'), (0, dom_6.on)(host, 'form.register')).tap(ev => {
            const target = ev.target;
            if (target)
                (0, dom_6.setAttribute)(host, 'invalid', target.touched && target.invalid);
        }), (0, theme_js_5.css)({
            $: { marginBottom: 16 },
            mask: { display: 'none' },
            content: { display: 'block', marginTop: 16 },
            content$outline: { marginTop: 0, marginBottom: 0 },
        }))
    ], Fieldset);
    exports.Fieldset = Fieldset;
    let Field = class Field extends component_8.Component {
        constructor() {
            super(...arguments);
            this.outline = false;
            this.floating = false;
            this.leading = false;
            this.dense = false;
        }
    };
    __decorate([
        (0, component_8.StyleAttribute)()
    ], Field.prototype, "outline", void 0);
    __decorate([
        (0, component_8.StyleAttribute)()
    ], Field.prototype, "floating", void 0);
    __decorate([
        (0, component_8.StyleAttribute)()
    ], Field.prototype, "leading", void 0);
    __decorate([
        (0, component_8.StyleAttribute)()
    ], Field.prototype, "dense", void 0);
    __decorate([
        (0, component_8.Attribute)()
    ], Field.prototype, "input", void 0);
    Field = __decorate([
        (0, component_8.Augment)('cxl-field', (0, theme_js_5.css)({
            $: { textAlign: 'left' },
            line$outline: { display: 'none' },
            help: {
                font: 'caption',
                position: 'relative',
                display: 'flex',
                flexGrow: 1,
                paddingLeft: 12,
                paddingRight: 12,
            },
            help$leading: { paddingLeft: 38 },
            invalidMessage: { display: 'none', paddingTop: 4 },
            invalidMessage$invalid: { display: 'block' },
            $inputdisabled: {
                filter: 'saturate(0)',
                opacity: 0.6,
                pointerEvents: 'none',
            },
            label$dense: { paddingTop: 5 },
            content$dense: { marginTop: 0 },
            container$dense: { paddingBottom: 3 },
            label$floating$novalue$dense: { translateY: 17 },
            label$dense$outline: { translateY: -13 },
            label$floating$novalue$outline$dense: { translateY: 7 },
            content$dense$outline: { marginTop: 2 },
            container$dense$outline: { paddingTop: 8, paddingBottom: 8 },
        }), ...FieldBase, host => {
            const invalid = (0, rx_8.be)(false);
            const focused = (0, rx_8.be)(false);
            const invalidMessage = (0, rx_8.be)('');
            function onRegister(ev) {
                if (ev.target) {
                    host.input = ev.target;
                    onChange();
                }
            }
            function update(ev) {
                const input = host.input;
                if (input) {
                    invalid.next(input.touched && input.invalid);
                    host.toggleAttribute('inputdisabled', input.disabled);
                    host.toggleAttribute('invalid', invalid.value);
                    if (invalid.value)
                        invalidMessage.next(input.validationMessage);
                    if (!ev)
                        return;
                    if (ev.type === 'focusable.focus')
                        focused.next(true);
                    else if (ev.type === 'focusable.blur')
                        focused.next(false);
                }
            }
            function onChange() {
                var _a;
                const value = (_a = host.input) === null || _a === void 0 ? void 0 : _a.value;
                host.toggleAttribute('novalue', !value || value.length === 0);
            }
            host.bind((0, rx_8.merge)((0, component_8.get)(host, 'input').switchMap(input => input
                ? (0, rx_8.merge)((0, rx_8.observable)(() => update()), (0, dom_6.on)(input, 'focusable.change').tap(update), (0, dom_6.on)(input, 'focusable.focus').tap(update), (0, dom_6.on)(input, 'focusable.blur').tap(update), (0, dom_6.on)(input, 'invalid').tap(update), (0, dom_6.on)(input, 'input').tap(onChange), (0, dom_6.on)(input, 'change').tap(onChange), (0, dom_6.on)(host, 'click').tap(() => document.activeElement !== input &&
                    !focused.value &&
                    (input === null || input === void 0 ? void 0 : input.focus())))
                : rx_8.EMPTY), (0, dom_6.on)(host, 'form.register').tap(onRegister)));
            return ((0, tsx_5.dom)(host.Shadow, null,
                (0, tsx_5.dom)(FocusLine, { className: "line", focused: focused, invalid: invalid }),
                (0, tsx_5.dom)("div", { className: "help" },
                    (0, tsx_5.dom)(host.Slot, { selector: "cxl-field-help" }),
                    (0, tsx_5.dom)("div", { className: "invalidMessage" }, (0, tsx_5.expression)(host, invalidMessage)))));
        })
    ], Field);
    exports.Field = Field;
});
define("@cxl/ui/select.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/rx", "@cxl/dom", "@cxl/template", "@cxl/ui/input-base.js", "@cxl/ui/core.js", "@cxl/ui/theme.js"], function (require, exports, tsx_6, component_9, rx_9, dom_7, template_4, input_base_js_1, core_js_3, theme_js_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SelectBox = exports.SelectBase = exports.SelectMenu = exports.Option = void 0;
    const Undefined = {};
    let Option = class Option extends component_9.Component {
        constructor() {
            super(...arguments);
            this.$value = Undefined;
            this.selected = false;
            this.focused = false;
            this.inactive = false;
        }
        get value() {
            return this.$value === Undefined ? this.textContent || '' : this.$value;
        }
        set value(val) {
            this.$value = val;
        }
    };
    __decorate([
        (0, component_9.Attribute)()
    ], Option.prototype, "value", null);
    __decorate([
        (0, component_9.StyleAttribute)()
    ], Option.prototype, "selected", void 0);
    __decorate([
        (0, component_9.StyleAttribute)()
    ], Option.prototype, "focused", void 0);
    __decorate([
        (0, component_9.StyleAttribute)()
    ], Option.prototype, "inactive", void 0);
    Option = __decorate([
        (0, component_9.Augment)('cxl-option', (0, template_4.role)('option'), host => (0, component_9.get)(host, 'value').pipe((0, template_4.triggerEvent)(host, 'change')), (0, theme_js_6.css)({
            $: {
                cursor: 'pointer',
                color: 'onSurface',
                lineHeight: 20,
                paddingRight: 16,
                display: 'flex',
                backgroundColor: 'surface',
                paddingLeft: 16,
                font: 'default',
                paddingTop: 14,
                paddingBottom: 14,
            },
            box: {
                display: 'none',
                width: 20,
                height: 20,
                borderWidth: 2,
                borderColor: 'onSurface',
                marginRight: 12,
                lineHeight: 16,
                borderStyle: 'solid',
                color: 'transparent',
            },
            box$selected: {
                borderColor: 'primary',
                backgroundColor: 'primary',
                color: 'onPrimary',
            },
            content: { flexGrow: 1 },
            $focused: {
                backgroundColor: 'primaryLight',
                color: 'onPrimaryLight',
            },
            $inactive: {
                backgroundColor: 'transparent',
                color: 'onSurface',
            },
        }), _ => ((0, tsx_6.dom)(tsx_6.dom, null,
            (0, tsx_6.dom)("div", { className: "box" },
                (0, tsx_6.dom)("span", { className: "focusCircle focusCirclePrimary" }),
                (0, tsx_6.dom)(core_js_3.Svg, { className: "check", viewBox: "0 0 24 24" },
                    (0, tsx_6.dom)(core_js_3.Path, { "stroke-width": "4", style: "fill:currentColor;stroke:currentColor", d: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" }))),
            (0, tsx_6.dom)("div", { className: "content" },
                (0, tsx_6.dom)("slot", null)))), template_4.selectable)
    ], Option);
    exports.Option = Option;
    let SelectMenu = class SelectMenu extends component_9.Component {
        constructor() {
            super(...arguments);
            this.visible = false;
        }
    };
    __decorate([
        (0, component_9.StyleAttribute)()
    ], SelectMenu.prototype, "visible", void 0);
    SelectMenu = __decorate([
        (0, component_9.Augment)('cxl-select-menu', (0, theme_js_6.css)({
            $: {
                position: 'absolute',
                opacity: 0,
                elevation: 0,
                right: -16,
                left: -16,
                overflowY: 'hidden',
                transformOrigin: 'top',
                pointerEvents: 'none',
            },
            $visible: {
                elevation: 3,
                opacity: 1,
                overflowY: 'auto',
                backgroundColor: 'surface',
                pointerEvents: 'auto',
            },
        }), $ => (0, dom_7.on)($, 'change').tap(ev => ev.stopPropagation()), component_9.Slot)
    ], SelectMenu);
    exports.SelectMenu = SelectMenu;
    let SelectBase = class SelectBase extends input_base_js_1.InputBase {
        constructor() {
            super(...arguments);
            this.opened = false;
            this.options = new Set();
        }
    };
    __decorate([
        (0, component_9.StyleAttribute)()
    ], SelectBase.prototype, "opened", void 0);
    SelectBase = __decorate([
        (0, component_9.Augment)((0, template_4.role)('listbox'), (0, theme_js_6.css)({
            $: {
                display: 'inline-block',
                cursor: 'pointer',
                overflowY: 'hidden',
                overflowX: 'hidden',
                height: 20,
                position: 'relative',
                paddingRight: 16,
                flexGrow: 1,
            },
            $focus: { outline: 0 },
            caret: {
                position: 'absolute',
                right: 0,
                top: 0,
                lineHeight: 20,
                width: 20,
                height: 20,
            },
            $opened: { overflowY: 'visible', overflowX: 'visible' },
            $disabled: { pointerEvents: 'none' },
            placeholder: {
                color: 'onSurface',
                font: 'default',
                marginRight: 12,
            },
        }), el => {
            el.bind((0, rx_9.merge)((0, template_4.focusable)(el), (0, dom_7.on)(el, 'blur').tap(() => el.close()), (0, dom_7.onKeypress)(el, 'escape').tap(() => el.close())));
            return ((0, tsx_6.dom)(core_js_3.Svg, { className: "caret", viewBox: "0 0 24 24" },
                (0, tsx_6.dom)(core_js_3.Path, { d: "M7 10l5 5 5-5z" })));
        })
    ], SelectBase);
    exports.SelectBase = SelectBase;
    let SelectBox = class SelectBox extends SelectBase {
        constructor() {
            super(...arguments);
            this.selectedText$ = (0, rx_9.be)('');
        }
        positionMenu(menu) {
            const option = this.selected;
            const rect = this.getBoundingClientRect();
            const menuTopPadding = 13;
            const maxTranslateY = rect.top;
            let height;
            let scrollTop = 0;
            let translateY = option ? option.offsetTop : 0;
            if (translateY > maxTranslateY) {
                scrollTop = translateY - maxTranslateY;
                translateY = maxTranslateY;
            }
            height = menu.scrollHeight - scrollTop;
            const maxHeight = window.innerHeight - rect.bottom + translateY;
            if (height > maxHeight)
                height = maxHeight;
            else if (height < rect.height)
                height = rect.height;
            const style = menu.style;
            style.transform =
                'translateY(' + (-translateY - menuTopPadding) + 'px)';
            style.height = height + 'px';
            menu.scrollTop = scrollTop;
        }
        setSelected(option) {
            if (option !== this.selected) {
                if (this.selected)
                    this.selected.selected = this.selected.focused = false;
                this.selected = option;
            }
            if (option) {
                option.selected = option.focused = true;
                requestAnimationFrame(() => {
                    this.selectedText$.next(option.textContent || '');
                });
                this.value = option.value;
            }
            else if (option === undefined)
                this.selectedText$.next('');
            this.close();
        }
        open() {
            if (this.disabled || this.opened)
                return;
            if (this.selected)
                this.selected.inactive = false;
            this.opened = true;
        }
        close() {
            if (this.opened)
                this.opened = false;
            if (this.selected)
                this.selected.inactive = true;
        }
    };
    __decorate([
        (0, component_9.Attribute)()
    ], SelectBox.prototype, "selected", void 0);
    SelectBox = __decorate([
        (0, component_9.Augment)('cxl-select', host => (0, rx_9.merge)((0, template_4.navigationList)(host, 'cxl-option:not([disabled])', 'cxl-option:not([disabled])[selected]').tap(selected => host.setSelected(selected)), (0, template_4.selectableHost)(host).tap(selected => host.setSelected(selected)), (0, dom_7.onAction)(host).tap(() => !host.opened && host.open())), host => ((0, tsx_6.dom)(SelectMenu, { "$": el => (0, rx_9.merge)((0, component_9.get)(host, 'opened'), (0, component_9.get)(host, 'selected')).raf(() => host.positionMenu(el)), visible: (0, component_9.get)(host, 'opened') },
            (0, tsx_6.dom)("slot", null))), host => ((0, tsx_6.dom)("div", { className: "placeholder" }, (0, tsx_6.expression)(host, host.selectedText$))))
    ], SelectBox);
    exports.SelectBox = SelectBox;
});
define("@cxl/ui/autocomplete.js", ["require", "exports", "@cxl/component", "@cxl/tsx", "@cxl/dom", "@cxl/rx", "@cxl/template", "@cxl/ui/field.js", "@cxl/ui/theme.js", "@cxl/ui/select.js"], function (require, exports, component_10, tsx_7, dom_8, rx_10, template_5, field_js_1, theme_js_7, select_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Autocomplete = void 0;
    let Autocomplete = class Autocomplete extends component_10.Component {
        constructor() {
            super(...arguments);
            this.visible = false;
        }
    };
    __decorate([
        (0, component_10.StyleAttribute)()
    ], Autocomplete.prototype, "visible", void 0);
    Autocomplete = __decorate([
        (0, component_10.Augment)('cxl-autocomplete', (0, theme_js_7.css)({
            menu: {
                left: -12,
                right: -12,
                top: 26,
            },
            menu$visible: {},
        }), host => {
            let selected = undefined;
            let focused = undefined;
            const searchTerm = (0, rx_10.be)('');
            const menu = ((0, tsx_7.dom)(select_js_1.SelectMenu, { className: "menu" },
                (0, tsx_7.dom)("slot", null)));
            function close() {
                menu.visible = false;
                selected = undefined;
            }
            host.bind((0, field_js_1.fieldInput)(host).switchMap(input => (0, rx_10.merge)((0, dom_8.on)(input, 'input').tap(() => {
                menu.visible = true;
                searchTerm.next(input.value);
            }), (0, dom_8.on)(input, 'blur').tap(close), (0, dom_8.onAction)(host).tap(() => {
                if (selected)
                    input.value = selected.value;
                menu.visible = false;
            }), searchTerm.tap(val => {
                var _a;
                const regex = (0, template_5.getSearchRegex)(val);
                for (const child of host.children) {
                    const childValue = child.value;
                    child.style.display =
                        childValue && ((_a = childValue.match) === null || _a === void 0 ? void 0 : _a.call(childValue, regex))
                            ? ''
                            : 'none';
                }
            }), (0, dom_8.onKeypress)(input, 'escape').tap(close), (0, dom_8.onKeypress)(input, 'enter').tap(() => {
                if (selected)
                    selected.focused = false;
                if (focused) {
                    selected = focused;
                    focused.selected = true;
                }
                close();
            }), (0, template_5.navigationListUpDown)(host, 'cxl-option:not([disabled])', 'cxl-option:not([disabled])[focused]', input)
                .log()
                .tap(newSelected => {
                if (focused)
                    focused.focused = false;
                if (newSelected) {
                    focused = newSelected;
                    focused.focused = true;
                }
            }))));
            return menu;
        })
    ], Autocomplete);
    exports.Autocomplete = Autocomplete;
});
define("@cxl/ui/badge.js", ["require", "exports", "@cxl/component", "@cxl/ui/theme.js", "@cxl/tsx", "@cxl/ui/core.js"], function (require, exports, component_11, theme_js_8, tsx_8, core_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Badge = void 0;
    let Badge = class Badge extends component_11.Component {
        constructor() {
            super(...arguments);
            this.size = 0;
            this.secondary = false;
            this.error = false;
            this.over = false;
        }
    };
    __decorate([
        (0, core_js_4.SizeAttribute)(s => ({
            width: 20 + s * 12,
            height: 20 + s * 12,
            marginRight: -10 + s * -6,
            borderRadius: 11 + s * 6,
            lineHeight: 20 + s * 12,
        }))
    ], Badge.prototype, "size", void 0);
    __decorate([
        (0, core_js_4.ColorAttribute)('primary')
    ], Badge.prototype, "color", void 0);
    __decorate([
        (0, component_11.StyleAttribute)()
    ], Badge.prototype, "secondary", void 0);
    __decorate([
        (0, component_11.StyleAttribute)()
    ], Badge.prototype, "error", void 0);
    __decorate([
        (0, component_11.StyleAttribute)()
    ], Badge.prototype, "over", void 0);
    Badge = __decorate([
        (0, component_11.Augment)('cxl-badge', (0, theme_js_8.css)({
            $: {
                display: 'inline-block',
                position: 'relative',
                font: 'caption',
                textAlign: 'center',
                flexShrink: 0,
            },
            $secondary: {
                color: 'onSecondary',
                backgroundColor: 'secondary',
            },
            $error: { color: 'onError', backgroundColor: 'error' },
            $over: { marginLeft: -8 },
            $top: { verticalAlign: 'top' },
        }), () => (0, tsx_8.dom)("slot", null))
    ], Badge);
    exports.Badge = Badge;
});
define("@cxl/ui/button.js", ["require", "exports", "@cxl/component", "@cxl/ui/core.js"], function (require, exports, component_12, core_js_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Button = void 0;
    let Button = class Button extends core_js_5.ButtonBase {
    };
    Button = __decorate([
        (0, component_12.Augment)('cxl-button', component_12.Slot)
    ], Button);
    exports.Button = Button;
});
define("@cxl/ui/checkbox.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/ui/core.js", "@cxl/rx", "@cxl/ui/core.js", "@cxl/ui/input-base.js", "@cxl/dom", "@cxl/template", "@cxl/css", "@cxl/ui/theme.js"], function (require, exports, tsx_9, component_13, core_js_6, rx_11, core_js_7, input_base_js_2, dom_9, template_6, css_6, theme_js_9) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Checkbox = void 0;
    let Checkbox = class Checkbox extends input_base_js_2.InputBase {
        constructor() {
            super(...arguments);
            this.value = false;
            this.checked = false;
            this.indeterminate = false;
            this.inline = false;
        }
    };
    __decorate([
        (0, component_13.StyleAttribute)()
    ], Checkbox.prototype, "checked", void 0);
    __decorate([
        (0, component_13.StyleAttribute)()
    ], Checkbox.prototype, "indeterminate", void 0);
    __decorate([
        (0, component_13.StyleAttribute)()
    ], Checkbox.prototype, "inline", void 0);
    Checkbox = __decorate([
        (0, component_13.Augment)('cxl-checkbox', (0, template_6.role)('checkbox'), host => {
            const update = () => (host.value = host.indeterminate ? undefined : host.checked);
            return (0, rx_11.merge)((0, dom_9.onAction)(host).tap(ev => {
                if (host.disabled)
                    return;
                if (host.indeterminate) {
                    host.checked = false;
                    host.indeterminate = false;
                }
                else
                    host.checked = !host.checked;
                ev.preventDefault();
            }), (0, template_6.checkedBehavior)(host).tap(update), (0, component_13.get)(host, 'indeterminate').tap(update));
        }, core_js_7.FocusCircleStyle, core_js_7.Focusable, (0, theme_js_9.css)({
            $: {
                position: 'relative',
                cursor: 'pointer',
                ...(0, css_6.padding)(10, 0, 10, 46),
                lineHeight: 20,
                marginLeft: -10,
                display: 'block',
                verticalAlign: 'middle',
                font: 'default',
                textAlign: 'left',
            },
            $inline: {
                display: 'inline-block',
            },
            $empty: {
                display: 'inline-block',
                ...(0, css_6.padding)(0),
                marginLeft: 0,
                width: 20,
                height: 20,
            },
            $invalid$touched: { color: 'error' },
            box$empty: {
                left: 0,
            },
            box: {
                left: 10,
                width: 20,
                height: 20,
                borderWidth: 2,
                lineHeight: 16,
                borderColor: 'onSurface',
                borderStyle: 'solid',
                position: 'absolute',
                color: 'transparent',
            },
            check: { display: 'none' },
            minus: { display: 'none' },
            check$checked: { display: 'initial' },
            check$indeterminate: { display: 'none' },
            minus$indeterminate: { display: 'initial' },
            box$checked: {
                borderColor: 'primary',
                backgroundColor: 'primary',
                color: 'onPrimary',
            },
            box$indeterminate: {
                borderColor: 'primary',
                backgroundColor: 'primary',
                color: 'onPrimary',
            },
            box$invalid$touched: { borderColor: 'error' },
            focusCircle: { top: -2, left: -2 },
        }), (0, template_6.staticTemplate)(() => ((0, tsx_9.dom)(tsx_9.dom, null,
            (0, tsx_9.dom)("div", { className: "box" },
                (0, tsx_9.dom)("span", { className: "focusCircle focusCirclePrimary" }),
                (0, tsx_9.dom)(core_js_6.Svg, { className: "check", viewBox: "0 0 24 24" },
                    (0, tsx_9.dom)(core_js_6.Path, { style: "stroke-width:4;fill:currentColor;stroke:currentColor", d: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" })),
                (0, tsx_9.dom)(core_js_6.Svg, { className: "minus", viewBox: "0 0 24 24" },
                    (0, tsx_9.dom)(core_js_6.Path, { style: "stroke-width:4;fill:currentColor;stroke:currentColor", d: "M19 13H5v-2h14v2z" }))),
            (0, tsx_9.dom)("slot", null)))))
    ], Checkbox);
    exports.Checkbox = Checkbox;
});
define("@cxl/ui/spinner.js", ["require", "exports", "@cxl/component", "@cxl/css", "@cxl/tsx", "@cxl/ui/core.js"], function (require, exports, component_14, css_7, tsx_10, core_js_8) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Spinner = void 0;
    let Spinner = class Spinner extends component_14.Component {
    };
    Spinner = __decorate([
        (0, component_14.Augment)('cxl-spinner', (0, core_js_8.css)({
            $: {
                animation: 'spin',
                display: 'inline-block',
                width: 48,
                height: 48,
            },
            circle: { animation: 'spinnerstroke' },
            svg: { width: (0, css_7.pct)(100), height: (0, css_7.pct)(100) },
        }), _ => ((0, tsx_10.dom)(core_js_8.Svg, { viewBox: "0 0 100 100", className: "svg" },
            (0, tsx_10.dom)(core_js_8.Circle, { cx: "50%", cy: "50%", r: "45", style: "stroke:var(--cxl-primary);fill:transparent;transition:stroke-dashoffset var(--cxl-speed);stroke-width:10%;transform-origin:center;stroke-dasharray:282.743px", className: "circle" }))))
    ], Spinner);
    exports.Spinner = Spinner;
});
define("@cxl/ui/dialog.js", ["require", "exports", "@cxl/component", "@cxl/css", "@cxl/ui/theme.js", "@cxl/tsx", "@cxl/dom", "@cxl/rx", "@cxl/ui/core.js", "@cxl/ui/button.js", "@cxl/template"], function (require, exports, component_15, css_8, theme_js_10, tsx_11, dom_10, rx_12, core_js_9, button_js_1, template_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dialogManager = exports.DialogManager = exports.positionElement = exports.setSnackbarContainer = exports.notify = exports.confirm = exports.alert = exports.Popup = exports.PopupContainer = exports.SnackbarContainer = exports.Snackbar = exports.Drawer = exports.ToggleDrawer = exports.DialogConfirm = exports.DialogAlert = exports.Dialog = exports.Backdrop = void 0;
    let Backdrop = class Backdrop extends component_15.Component {
        constructor() {
            super(...arguments);
            this.center = false;
        }
    };
    __decorate([
        (0, component_15.StyleAttribute)()
    ], Backdrop.prototype, "center", void 0);
    Backdrop = __decorate([
        (0, component_15.Augment)('cxl-backdrop', (0, theme_js_10.css)({
            $: {
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                backgroundColor: 'shadow',
                elevation: 5,
                overflowY: 'auto',
            },
            $center: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
            },
        }), () => (0, tsx_11.dom)("slot", null))
    ], Backdrop);
    exports.Backdrop = Backdrop;
    let Dialog = class Dialog extends component_15.Component {
    };
    Dialog = __decorate([
        (0, component_15.Augment)('cxl-dialog', (0, template_7.role)('dialog'), (0, theme_js_10.css)({
            content: {
                backgroundColor: 'surface',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflowY: 'auto',
                color: 'onSurface',
                textAlign: 'left',
            },
            '@small': {
                content: {
                    elevation: 5,
                    translateY: (0, css_8.pct)(-50),
                    top: (0, css_8.pct)(50),
                    bottom: 'auto',
                    maxHeight: (0, css_8.pct)(85),
                    width: (0, css_8.pct)(80),
                    marginLeft: 'auto',
                    marginRight: 'auto',
                },
            },
        }), () => ((0, tsx_11.dom)(Backdrop, null,
            (0, tsx_11.dom)("div", { className: "content" },
                (0, tsx_11.dom)("slot", null)))))
    ], Dialog);
    exports.Dialog = Dialog;
    const DialogStyles = (0, theme_js_10.css)({
        content: (0, css_8.padding)(16),
        footer: (0, css_8.padding)(8),
    });
    let DialogAlert = class DialogAlert extends component_15.Component {
        constructor() {
            super(...arguments);
            this['title-text'] = '';
            this.message = '';
            this.action = 'Ok';
            this.promise = new Promise(resolve => {
                this.resolve = resolve;
            });
        }
    };
    __decorate([
        (0, component_15.Attribute)()
    ], DialogAlert.prototype, "title-text", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], DialogAlert.prototype, "message", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], DialogAlert.prototype, "action", void 0);
    DialogAlert = __decorate([
        (0, component_15.Augment)('cxl-dialog-alert', (0, template_7.role)('alertdialog'), DialogStyles, $ => ((0, tsx_11.dom)(Dialog, null,
            (0, tsx_11.dom)("div", { className: "content" },
                (0, tsx_11.dom)(core_js_9.T, { h5: true }, (0, component_15.get)($, 'title-text')),
                (0, tsx_11.dom)(core_js_9.T, null, (0, component_15.get)($, 'message'))),
            (0, tsx_11.dom)("div", { className: "footer" },
                (0, tsx_11.dom)(button_js_1.Button, { flat: true, "$": el => (0, dom_10.onAction)(el).tap(() => $.resolve()) }, (0, component_15.get)($, 'action'))))))
    ], DialogAlert);
    exports.DialogAlert = DialogAlert;
    let DialogConfirm = class DialogConfirm extends component_15.Component {
        constructor() {
            super(...arguments);
            this['cancel-text'] = 'Cancel';
            this['title-text'] = '';
            this.message = '';
            this.action = 'Ok';
            this.promise = new Promise(resolve => {
                this.resolve = resolve;
            });
        }
    };
    __decorate([
        (0, component_15.Attribute)()
    ], DialogConfirm.prototype, "cancel-text", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], DialogConfirm.prototype, "title-text", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], DialogConfirm.prototype, "message", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], DialogConfirm.prototype, "action", void 0);
    DialogConfirm = __decorate([
        (0, component_15.Augment)('cxl-dialog-confirm', (0, template_7.role)('alertdialog'), DialogStyles, $ => ((0, tsx_11.dom)(Dialog, null,
            (0, tsx_11.dom)("div", { className: "content" },
                (0, tsx_11.dom)(core_js_9.T, { h5: true }, (0, component_15.get)($, 'title-text')),
                (0, tsx_11.dom)(core_js_9.T, null, (0, component_15.get)($, 'message'))),
            (0, tsx_11.dom)("div", { className: "footer" },
                (0, tsx_11.dom)(button_js_1.Button, { flat: true, "$": el => (0, dom_10.onAction)(el).tap(() => $.resolve(false)) }, (0, component_15.get)($, 'cancel-text')),
                (0, tsx_11.dom)(button_js_1.Button, { flat: true, "$": el => (0, dom_10.onAction)(el).tap(() => $.resolve(true)) }, (0, component_15.get)($, 'action'))))))
    ], DialogConfirm);
    exports.DialogConfirm = DialogConfirm;
    let ToggleDrawer = class ToggleDrawer extends component_15.Component {
    };
    __decorate([
        (0, component_15.Attribute)()
    ], ToggleDrawer.prototype, "drawer", void 0);
    ToggleDrawer = __decorate([
        (0, component_15.Augment)('cxl-toggle-drawer', $ => (0, dom_10.onAction)($).tap(() => {
            if (!$.drawer)
                return;
            const drawer = document.getElementById($.drawer);
            if (drawer)
                drawer.visible = !drawer.visible;
        }))
    ], ToggleDrawer);
    exports.ToggleDrawer = ToggleDrawer;
    let Drawer = class Drawer extends component_15.Component {
        constructor() {
            super(...arguments);
            this.visible = false;
            this.right = false;
            this.permanent = false;
        }
    };
    __decorate([
        (0, component_15.StyleAttribute)()
    ], Drawer.prototype, "visible", void 0);
    __decorate([
        (0, component_15.StyleAttribute)()
    ], Drawer.prototype, "right", void 0);
    __decorate([
        (0, component_15.StyleAttribute)()
    ], Drawer.prototype, "permanent", void 0);
    Drawer = __decorate([
        (0, component_15.Augment)('cxl-drawer', (0, theme_js_10.css)({
            'drawer::-webkit-scrollbar': {
                width: 8,
            },
            'drawer::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
            },
            'drawer::-webkit-scrollbar-thumb': {
                backgroundColor: 'divider',
            },
            drawer: {
                backgroundColor: 'surface',
                position: 'absolute',
                top: 0,
                left: 0,
                width: (0, css_8.pct)(85),
                bottom: 0,
                opacity: 0,
                color: 'onSurface',
                overflowY: 'auto',
                elevation: 5,
                translateX: (0, css_8.pct)(-105),
                animation: 'fadeOut',
            },
            drawer$right: { left: '100%', width: 0, translateX: 0 },
            drawer$right$visible: { translateX: (0, css_8.pct)(-100), width: 320 },
            drawer$visible: {
                translateX: 0,
                animation: 'fadeIn',
                display: 'block',
            },
            backdrop: {
                width: 0,
                opacity: 0,
            },
            backdrop$visible: { width: '100%', opacity: 1 },
            '@small': {
                drawer: { width: 288 },
            },
            '@large': {
                drawer$permanent: {
                    translateX: 0,
                    opacity: 1,
                    transition: 'unset',
                    animation: 'none',
                },
                backdrop$visible$permanent: { width: 0 },
                backdrop$visible$right: { width: '100%' },
            },
            '@xlarge': {
                drawer$right$permanent: {
                    translateX: (0, css_8.pct)(-100),
                    width: 320,
                },
                backdrop$visible$permanent$right: { width: 0 },
            },
        }), host => ((0, tsx_11.dom)(tsx_11.dom, null,
            (0, tsx_11.dom)(Backdrop, { className: "backdrop", "$": el => (0, dom_10.on)(el, 'click').tap(() => {
                    (0, dom_10.trigger)(host, 'backdrop.click');
                    host.visible = false;
                }) }),
            (0, tsx_11.dom)(core_js_9.Span, { "$": el => (0, rx_12.merge)((0, dom_10.on)(el, 'drawer.close').tap(() => (host.visible = false)), (0, dom_10.on)(el, 'click').tap(ev => ev.stopPropagation()), (0, component_15.attributeChanged)(host, 'visible')
                    .raf()
                    .tap(visible => {
                    if (!visible)
                        el.scrollTo(0, 0);
                })), className: "drawer" },
                (0, tsx_11.dom)("slot", null)))))
    ], Drawer);
    exports.Drawer = Drawer;
    let Snackbar = class Snackbar extends component_15.Component {
        constructor() {
            super(...arguments);
            this.delay = 4000;
        }
    };
    __decorate([
        (0, component_15.Attribute)()
    ], Snackbar.prototype, "delay", void 0);
    Snackbar = __decorate([
        (0, component_15.Augment)('cxl-snackbar', (0, theme_js_10.css)({
            $: {
                display: 'block',
                textAlign: 'center',
                opacity: 0,
                scaleX: 0.5,
                scaleY: 0.5,
                ...(0, css_8.padding)(16),
                elevation: 3,
                backgroundColor: 'onSurface87',
                color: 'surface',
                marginBottom: 16,
                font: 'default',
            },
            '@small': { $: { display: 'inline-block' } },
        }), () => (0, tsx_11.dom)("slot", null), (0, component_15.connect)(host => {
            requestAnimationFrame(() => {
                host.style.opacity = '1';
                host.style.transform = 'scale(1,1)';
            });
        }))
    ], Snackbar);
    exports.Snackbar = Snackbar;
    let SnackbarContainer = class SnackbarContainer extends component_15.Component {
        constructor() {
            super(...arguments);
            this.queue = [];
        }
        notifyNext() {
            const [next, resolve] = this.queue[0];
            this.appendChild(next);
            setTimeout(() => {
                next.remove();
                this.queue.shift();
                resolve();
                if (this.queue.length)
                    this.notifyNext();
            }, next.delay);
        }
        notify(snackbar) {
            return new Promise(resolve => {
                this.queue.push([snackbar, resolve]);
                if (this.queue.length === 1)
                    this.notifyNext();
            });
        }
    };
    SnackbarContainer = __decorate([
        (0, component_15.Augment)('cxl-snackbar-container', (0, theme_js_10.css)({
            $: {
                position: 'fixed',
                left: 16,
                bottom: 16,
                right: 16,
                textAlign: 'center',
            },
            $left: { textAlign: 'left' },
            $right: { textAlign: 'right' },
        }))
    ], SnackbarContainer);
    exports.SnackbarContainer = SnackbarContainer;
    let PopupContainer = class PopupContainer extends component_15.Component {
    };
    PopupContainer = __decorate([
        (0, component_15.Augment)('cxl-popup-container', (0, theme_js_10.css)({
            $: { animation: 'fadeIn' },
            $out: { animation: 'fadeOut' },
        }), component_15.Slot, $ => (0, dom_10.on)($, 'click').tap(ev => ev.stopPropagation()))
    ], PopupContainer);
    exports.PopupContainer = PopupContainer;
    let Popup = class Popup extends component_15.Component {
        constructor() {
            super(...arguments);
            this.visible = false;
            this.position = 'auto';
            this.container = 'cxl-popup-container';
        }
    };
    __decorate([
        (0, component_15.Attribute)()
    ], Popup.prototype, "visible", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], Popup.prototype, "position", void 0);
    __decorate([
        (0, component_15.Attribute)()
    ], Popup.prototype, "container", void 0);
    Popup = __decorate([
        (0, component_15.Augment)('cxl-popup', $ => {
            const popup = document.createElement($.container);
            let timeout;
            $.style.display = 'none';
            return (0, component_15.get)($, 'visible')
                .raf()
                .switchMap(visible => {
                const proxy = $.proxy || $;
                if (!$.parentElement)
                    return rx_12.EMPTY;
                if (visible) {
                    for (const child of Array.from(proxy.childNodes))
                        popup.appendChild(child);
                    popup.removeAttribute('out');
                    exports.dialogManager.openPopup({
                        element: popup,
                        popup: $,
                        relativeTo: $.parentElement,
                        position: $.position,
                        container: document.body,
                    });
                    return (0, dom_10.on)(window, 'click').tap(() => ($.visible = false));
                }
                else if (popup.parentNode) {
                    popup.setAttribute('out', '');
                    if (timeout)
                        clearTimeout(timeout);
                    timeout = setTimeout(() => {
                        for (const child of Array.from(popup.childNodes))
                            proxy.appendChild(child);
                        popup.remove();
                    }, 500);
                }
                return rx_12.EMPTY;
            });
        })
    ], Popup);
    exports.Popup = Popup;
    function alert(optionsOrMessage, container = document.body) {
        const options = typeof optionsOrMessage === 'string'
            ? { message: optionsOrMessage }
            : optionsOrMessage;
        const modal = ((0, tsx_11.dom)(DialogAlert, null));
        Object.assign(modal, options);
        exports.dialogManager.openModal(modal, container);
        return modal.promise.then(val => (exports.dialogManager.closeModal(modal, container), val));
    }
    exports.alert = alert;
    function confirm(options, container = document.body) {
        if (typeof options === 'string')
            options = { message: options };
        const modal = ((0, tsx_11.dom)(DialogConfirm, null));
        Object.assign(modal, options);
        exports.dialogManager.openModal(modal, container);
        return modal.promise.then(val => (exports.dialogManager.closeModal(modal, container), val));
    }
    exports.confirm = confirm;
    let snackbarContainer;
    function notify(options, bar = snackbarContainer) {
        if (!bar) {
            bar = snackbarContainer = ((0, tsx_11.dom)(SnackbarContainer, null));
            document.body.appendChild(bar);
        }
        if (typeof options === 'string')
            options = { content: options };
        const snackbar = ((0, tsx_11.dom)(Snackbar, null));
        if (options.delay)
            snackbar.delay = options.delay;
        if (options.content)
            (0, dom_10.insert)(snackbar, options.content);
        return bar.notify(snackbar);
    }
    exports.notify = notify;
    function setSnackbarContainer(bar) {
        snackbarContainer = bar;
    }
    exports.setSnackbarContainer = setSnackbarContainer;
    function positionElement({ element, relativeTo, position, container, }) {
        const rect = relativeTo.getBoundingClientRect();
        const maxWidth = container.offsetWidth;
        const style = element.style;
        style.position = 'absolute';
        if (position === 'auto') {
            const width10 = maxWidth / 10;
            position =
                maxWidth - rect.right < width10
                    ? 'right bottom'
                    : maxWidth < width10
                        ? 'left bottom'
                        : 'center bottom';
        }
        for (const pos of position.split(' ')) {
            if (pos === 'right') {
                style.left = `${rect.right - element.offsetWidth}px`;
                style.transformOrigin = 'right top';
            }
            else if (pos === 'bottom')
                style.top = `${rect.bottom}px`;
            else if (pos === 'top')
                style.top = `${rect.top}px`;
            else if (pos === 'left') {
                style.left = `${rect.left}px`;
                style.transformOrigin = 'left top';
            }
            else if (pos === 'center') {
                const width = element.offsetWidth;
                let left = rect.left + rect.width / 2 - width / 2;
                if (left + width > maxWidth)
                    left = rect.right - width;
                style.left = `${left}px`;
                style.transformOrigin = 'top';
            }
        }
    }
    exports.positionElement = positionElement;
    class DialogManager {
        openModal(modal, container = document.body) {
            const opened = container.$$cxlCurrentModal;
            if (opened)
                this.closeModal(opened, container);
            container.$$cxlCurrentModal = opened;
            container.appendChild(modal);
        }
        closeModal(modal, container = document.body) {
            modal = modal || container.$$cxlCurrentModal;
            modal === null || modal === void 0 ? void 0 : modal.remove();
            container.$$cxlCurrentModal = undefined;
        }
        openPopup(options) {
            if (this.currentPopup && options.popup !== this.currentPopup)
                this.currentPopup.visible = false;
            options.container.appendChild(options.element);
            positionElement(options);
            this.currentPopup = options.popup;
        }
    }
    exports.DialogManager = DialogManager;
    exports.dialogManager = new DialogManager();
});
define("@cxl/ui/menu.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/dom", "@cxl/ui/theme.js", "@cxl/ui/icon.js", "@cxl/ui/core.js", "@cxl/ui/dialog.js"], function (require, exports, tsx_12, component_16, dom_11, theme_js_11, icon_js_2, core_js_10, dialog_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MenuToggle = exports.MenuPopup = exports.Menu = void 0;
    let Menu = class Menu extends component_16.Component {
        constructor() {
            super(...arguments);
            this.dense = false;
        }
    };
    __decorate([
        (0, component_16.StyleAttribute)()
    ], Menu.prototype, "dense", void 0);
    Menu = __decorate([
        (0, component_16.Augment)('cxl-menu', (0, theme_js_11.css)({
            $: {
                elevation: 1,
                display: 'inline-block',
                backgroundColor: 'surface',
                overflowY: 'auto',
                color: 'onSurface',
                paddingTop: 8,
                paddingBottom: 8,
                minWidth: 112,
                width: 'max-content',
                variables: theme_js_11.BaseColors,
            },
            $dense: { paddingTop: 0, paddingBottom: 0 },
        }), () => (0, tsx_12.dom)("slot", null))
    ], Menu);
    exports.Menu = Menu;
    let MenuPopup = class MenuPopup extends component_16.Component {
    };
    MenuPopup = __decorate([
        (0, component_16.Augment)('cxl-menu-popup', (0, theme_js_11.css)({
            $: { animation: 'fadeIn' },
            $out: { animation: 'fadeOut' },
        }), $ => (0, dom_11.on)($, 'click').tap(ev => ev.stopPropagation()), () => ((0, tsx_12.dom)(Menu, null,
            (0, tsx_12.dom)("slot", null))))
    ], MenuPopup);
    exports.MenuPopup = MenuPopup;
    let MenuToggle = class MenuToggle extends core_js_10.Toggle {
        constructor() {
            super(...arguments);
            this.position = 'auto';
        }
    };
    __decorate([
        (0, component_16.Attribute)()
    ], MenuToggle.prototype, "position", void 0);
    MenuToggle = __decorate([
        (0, component_16.Augment)('cxl-menu-toggle', $ => {
            const popup = ((0, tsx_12.dom)(dialog_js_1.Popup, { container: "cxl-menu-popup", proxy: $, position: (0, component_16.get)($, 'position') }));
            $.target = popup;
            return ((0, tsx_12.dom)(icon_js_2.IconButton, null,
                (0, tsx_12.dom)(icon_js_2.MoreVertIcon, null),
                popup));
        })
    ], MenuToggle);
    exports.MenuToggle = MenuToggle;
});
define("cxl/ui/fab", ["require", "exports", "@cxl/component", "@cxl/ui/theme.js", "@cxl/ui/core.js"], function (require, exports, component_17, theme_js_12, core_js_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Fab = void 0;
    let Fab = class Fab extends component_17.Component {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.fixed = false;
            this.touched = false;
        }
    };
    __decorate([
        (0, component_17.StyleAttribute)()
    ], Fab.prototype, "disabled", void 0);
    __decorate([
        (0, component_17.StyleAttribute)()
    ], Fab.prototype, "fixed", void 0);
    Fab = __decorate([
        (0, component_17.Augment)('cxl-fab', core_js_11.Focusable, (0, theme_js_12.css)({
            $: {
                display: 'inline-block',
                elevation: 2,
                backgroundColor: 'secondary',
                color: 'onSecondary',
                borderRadius: 56,
                textAlign: 'center',
                paddingTop: 20,
                cursor: 'pointer',
                font: 'h6',
                paddingBottom: 20,
                lineHeight: 16,
                width: 56,
                overflowY: 'hidden',
            },
            $fixed: {
                position: 'fixed',
                height: 56,
                bottom: 16,
                right: 24,
            },
            '@small': {
                $fixed: { position: 'absolute', bottom: 'auto', marginTop: -28 },
            },
            $focus: { elevation: 4 },
        }), (0, theme_js_12.css)(core_js_11.FocusHighlight), core_js_11.ripple, component_17.Slot)
    ], Fab);
    exports.Fab = Fab;
});
define("@cxl/ui/chip.js", ["require", "exports", "@cxl/component", "@cxl/tsx", "@cxl/dom", "@cxl/ui/icon.js", "@cxl/ui/theme.js", "@cxl/ui/core.js"], function (require, exports, component_18, tsx_13, dom_12, icon_js_3, theme_js_13, core_js_12) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Chip = void 0;
    let Chip = class Chip extends component_18.Component {
        constructor() {
            super(...arguments);
            this.removable = false;
            this.disabled = false;
            this.touched = false;
            this.primary = false;
            this.secondary = false;
            this.size = 0;
        }
        remove() {
            super.remove();
            (0, dom_12.trigger)(this, 'cxl-chip.remove');
        }
    };
    __decorate([
        (0, component_18.StyleAttribute)()
    ], Chip.prototype, "removable", void 0);
    __decorate([
        (0, component_18.StyleAttribute)()
    ], Chip.prototype, "disabled", void 0);
    __decorate([
        (0, component_18.Attribute)()
    ], Chip.prototype, "touched", void 0);
    __decorate([
        (0, component_18.StyleAttribute)()
    ], Chip.prototype, "primary", void 0);
    __decorate([
        (0, component_18.StyleAttribute)()
    ], Chip.prototype, "secondary", void 0);
    __decorate([
        (0, core_js_12.ColorAttribute)()
    ], Chip.prototype, "color", void 0);
    __decorate([
        (0, core_js_12.SizeAttribute)(s => ({
            fontSize: 14 + s * 2,
            lineHeight: 20 + s * 4,
            height: 32 + s * 6,
            borderRadius: 16 + s * 2,
        }))
    ], Chip.prototype, "size", void 0);
    Chip = __decorate([
        (0, component_18.Augment)('cxl-chip', core_js_12.Focusable, (0, theme_js_13.css)({
            $: {
                variables: {
                    surface: (0, theme_js_13.baseColor)('onSurface12'),
                },
                font: 'subtitle2',
                backgroundColor: 'surface',
                display: 'inline-flex',
                color: 'onSurface',
                verticalAlign: 'middle',
                alignItems: 'center',
            },
            $primary: {
                color: 'onPrimary',
                backgroundColor: 'primary',
            },
            $secondary: {
                color: 'onSecondary',
                backgroundColor: 'secondary',
            },
            content: {
                display: 'inline-block',
                marginLeft: 12,
                paddingRight: 12,
            },
            avatar: { display: 'inline-block' },
            remove: {
                display: 'none',
                marginRight: 8,
                cursor: 'pointer',
            },
            remove$removable: {
                display: 'inline-block',
            },
            ...core_js_12.FocusHighlight,
        }), $ => ((0, tsx_13.dom)(tsx_13.dom, null,
            (0, tsx_13.dom)("span", { className: "avatar" },
                (0, tsx_13.dom)($.Slot, { selector: "cxl-avatar" })),
            (0, tsx_13.dom)("span", { className: "content" },
                (0, tsx_13.dom)("slot", null)))), host => ((0, tsx_13.dom)(component_18.Span, { "$": el => (0, dom_12.on)(el, 'click').tap(() => host.remove()), className: "remove" },
            (0, tsx_13.dom)(icon_js_3.CloseIcon, { width: 16 }))), host => (0, dom_12.on)(host, 'keydown').tap(ev => {
            if (host.removable &&
                (ev.key === 'Delete' || ev.key === 'Backspace'))
                host.remove();
        }))
    ], Chip);
    exports.Chip = Chip;
});
define("cxl/drag/index", ["require", "exports", "@cxl/rx", "@cxl/dom"], function (require, exports, rx_13, dom_13) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dropTarget = exports.dragMove = exports.dragInside = exports.onDrag = void 0;
    function getTouchId(ev) {
        for (const touch of ev.changedTouches)
            if (touch.target === ev.target)
                return touch.identifier;
    }
    function findTouch(ev, touchId) {
        for (const touch of ev.changedTouches)
            if (touch.identifier === touchId)
                return touch;
    }
    function onTouchEnd(touchId) {
        return (0, dom_13.on)(window, 'touchend').map(ev => findTouch(ev, touchId));
    }
    function onTouchMove(touchId) {
        return (0, dom_13.on)(window, 'touchmove').map(ev => findTouch(ev, touchId));
    }
    function onTouchDrag(element, handler) {
        return (0, dom_13.on)(element, 'touchstart', { passive: true }).switchMap(ev => {
            const touchId = getTouchId(ev);
            const target = ev.currentTarget;
            if (!target || touchId === undefined)
                return rx_13.EMPTY;
            const style = element.style;
            const { userSelect, transition } = style;
            style.userSelect = style.transition = 'none';
            if (handler)
                handler.onStart(ev);
            return new rx_13.Observable(subscriber => {
                subscriber.next(findTouch(ev, touchId));
                const subscription = (0, rx_13.merge)(onTouchMove(touchId).tap(ev => ev && subscriber.next(ev)), onTouchEnd(touchId).tap(ev => {
                    style.userSelect = userSelect;
                    style.transition = transition;
                    if (handler)
                        handler.onEnd(ev);
                    subscriber.complete();
                })).subscribe();
                return () => subscription.unsubscribe();
            });
        });
    }
    function onMouseDrag(element, handler) {
        return (0, dom_13.on)(element, 'mousedown').switchMap(ev => {
            const target = ev.currentTarget;
            if (!target)
                return rx_13.EMPTY;
            const style = element.style;
            const { userSelect, transition } = style;
            style.userSelect = style.transition = 'none';
            if (handler)
                handler.onStart(ev);
            return new rx_13.Observable(subscriber => {
                subscriber.next(ev);
                const subscription = (0, rx_13.merge)((0, dom_13.on)(window, 'mousemove').tap(ev => subscriber.next(ev)), (0, dom_13.on)(window, 'mouseup').tap(ev => {
                    style.userSelect = userSelect;
                    style.transition = transition;
                    if (handler)
                        handler.onEnd(ev);
                    subscriber.complete();
                })).subscribe();
                return () => subscription.unsubscribe();
            });
        });
    }
    function onDrag(element, handler) {
        return (0, rx_13.merge)(onTouchDrag(element, handler), onMouseDrag(element, handler));
    }
    exports.onDrag = onDrag;
    function dragInside(target) {
        let rect;
        return onDrag(target, {
            onStart() {
                rect = target.getBoundingClientRect();
            },
            onEnd() {
            },
        }).map(ev => {
            const clientX = (ev.clientX - rect.x) / rect.width;
            const clientY = (ev.clientY - rect.y) / rect.height;
            return { target, clientX, clientY };
        });
    }
    exports.dragInside = dragInside;
    function dragMove(element, axis) {
        let start;
        return onDrag(element, {
            onStart(ev) {
                start = {
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    x: ev.clientX,
                    y: ev.clientY,
                };
            },
            onEnd() {
                element.style.transform = ``;
                start = null;
            },
        }).tap(ev => {
            let transform;
            const x = (ev.clientX - start.x) / start.width;
            const y = (ev.clientY - start.y) / start.height;
            if (axis === 'x')
                transform = `translateX(${x * 100}%)`;
            else if (axis === 'y')
                transform = `translateY(${y * 100}%)`;
            else
                transform = `translate(${x * 100}%, ${y * 100}%)`;
            element.style.transform = transform;
        });
    }
    exports.dragMove = dragMove;
    function dropTarget($) {
        let count = 0;
        return (0, rx_13.merge)((0, dom_13.on)($, 'dragenter').tap(() => {
            if (++count === 1)
                $.setAttribute('dragover', '');
        }), (0, dom_13.on)($, 'dragleave').tap(() => {
            if (--count === 0)
                $.removeAttribute('dragover');
        }), (0, dom_13.on)($, 'dragover').tap(ev => ev.preventDefault()), (0, dom_13.on)($, 'drop').tap(ev => {
            ev.preventDefault();
            $.removeAttribute('dragover');
            count = 0;
        })).filter(ev => ev.type === 'drop');
    }
    exports.dropTarget = dropTarget;
});
define("@cxl/ui/form.js", ["require", "exports", "@cxl/component", "@cxl/ui/core.js", "@cxl/tsx", "@cxl/template", "@cxl/dom", "@cxl/css", "@cxl/rx", "cxl/drag/index", "@cxl/ui/input-base.js", "@cxl/template", "@cxl/ui/field.js", "@cxl/ui/icon.js", "@cxl/ui/theme.js"], function (require, exports, component_19, core_js_13, tsx_14, template_8, dom_14, css_9, rx_14, drag_1, input_base_js_3, template_9, field_js_2, icon_js_4, theme_js_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.FieldClear = exports.TextArea = exports.ContentEditable = exports.focusProxy = exports.Switch = exports.Radio = exports.PasswordInput = exports.FieldTextArea = exports.FieldInput = exports.Input = exports.Form = exports.FieldCounter = exports.FieldHelp = exports.Label = exports.SubmitButton = exports.Slider = void 0;
    let Slider = class Slider extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.step = 0.05;
            this.value = 0;
        }
    };
    __decorate([
        (0, component_19.Attribute)()
    ], Slider.prototype, "step", void 0);
    Slider = __decorate([
        (0, component_19.Augment)('cxl-slider', (0, template_9.role)('slider'), (0, template_8.aria)('valuemax', '1'), (0, template_8.aria)('valuemin', '0'), core_js_13.FocusCircleStyle, (0, theme_js_14.css)({
            $: {
                display: 'block',
                paddingTop: 24,
                paddingBottom: 24,
                userSelect: 'none',
                position: 'relative',
                flexGrow: 1,
                cursor: 'pointer',
            },
            knob: {
                backgroundColor: 'primary',
                width: 12,
                height: 12,
                display: 'inline-block',
                borderRadius: 6,
                position: 'absolute',
                top: 19,
            },
            focusCircle: { marginLeft: -4, marginTop: -8, left: 'auto' },
            background: {
                backgroundColor: 'primaryLight',
                height: 2,
            },
            line: {
                display: 'block',
                backgroundColor: 'primary',
                height: 2,
                textAlign: 'right',
            },
            line$invalid$touched: { backgroundColor: 'error' },
            knob$invalid$touched: { backgroundColor: 'error' },
            background$invalid$touched: {
                backgroundColor: 'errorLight',
            },
        }), core_js_13.Focusable, host => {
            function bound(x) {
                return x < 0 ? 0 : x > 1 ? 1 : x;
            }
            host.bind((0, rx_14.merge)((0, drag_1.dragInside)(host).tap(ev => {
                if (!host.disabled)
                    host.value = bound(ev.clientX);
            }), (0, dom_14.onKeypress)(host, 'arrowleft').tap(() => (host.value = bound(host.value - host.step))), (0, dom_14.onKeypress)(host, 'arrowright').tap(() => (host.value = bound(host.value + host.step)))));
            return ((0, tsx_14.dom)("div", { className: "background" },
                (0, tsx_14.dom)(core_js_13.Span, { "$": el => (0, component_19.get)(host, 'value')
                        .tap(val => (el.style.marginRight =
                        100 - val * 100 + '%'))
                        .pipe((0, template_8.ariaValue)(host, 'valuenow')), className: "line" },
                    (0, tsx_14.dom)("span", { className: "focusCircle" }),
                    (0, tsx_14.dom)("div", { className: "knob" }))));
        })
    ], Slider);
    exports.Slider = Slider;
    let SubmitButton = class SubmitButton extends core_js_13.ButtonBase {
        constructor() {
            super(...arguments);
            this.primary = true;
            this.submitting = false;
        }
    };
    __decorate([
        (0, component_19.StyleAttribute)()
    ], SubmitButton.prototype, "submitting", void 0);
    SubmitButton = __decorate([
        (0, component_19.Augment)('cxl-submit', (0, theme_js_14.css)({
            icon: {
                animation: 'spin',
                marginRight: 8,
                display: 'none',
                width: 16,
                height: 16,
            },
        }), _ => (0, tsx_14.dom)("slot", null), el => (0, dom_14.onAction)(el).pipe((0, template_8.triggerEvent)(el, 'form.submit')))
    ], SubmitButton);
    exports.SubmitButton = SubmitButton;
    let Label = class Label extends component_19.Component {
    };
    Label = __decorate([
        (0, component_19.Augment)('cxl-label', (0, theme_js_14.css)({
            $: {
                display: 'inline-block',
                paddingLeft: 4,
                paddingRight: 4,
            },
        }), component_19.Slot, host => (0, field_js_2.fieldInput)(host).raf(input => input.setAttribute('aria-label', host.textContent || '')))
    ], Label);
    exports.Label = Label;
    let FieldHelp = class FieldHelp extends component_19.Component {
        constructor() {
            super(...arguments);
            this.invalid = false;
        }
    };
    __decorate([
        (0, component_19.StyleAttribute)()
    ], FieldHelp.prototype, "invalid", void 0);
    FieldHelp = __decorate([
        (0, component_19.Augment)('cxl-field-help', (0, theme_js_14.css)({
            $: {
                display: 'block',
                lineHeight: 12,
                marginTop: 8,
                marginBottom: 8,
                font: 'caption',
                verticalAlign: 'bottom',
            },
            $invalid: { color: 'error' },
        }), component_19.Slot)
    ], FieldHelp);
    exports.FieldHelp = FieldHelp;
    let FieldCounter = class FieldCounter extends component_19.Component {
        constructor() {
            super(...arguments);
            this.max = 100;
        }
    };
    __decorate([
        (0, component_19.Attribute)()
    ], FieldCounter.prototype, "max", void 0);
    FieldCounter = __decorate([
        (0, component_19.Augment)('cxl-field-counter', host => ((0, tsx_14.dom)(core_js_13.Span, null,
            (0, field_js_2.fieldInput)(host).switchMap(input => (0, component_19.get)(input, 'value').map(val => (val === null || val === void 0 ? void 0 : val.length) || 0)),
            "/",
            (0, component_19.get)(host, 'max'))))
    ], FieldCounter);
    exports.FieldCounter = FieldCounter;
    let Form = class Form extends component_19.Component {
        constructor() {
            super(...arguments);
            this.elements = new Set();
        }
        submit() {
            let focus;
            for (const el of this.elements) {
                if (el.invalid)
                    focus = focus || el;
                el.touched = true;
            }
            if (focus)
                return focus.focus();
            (0, dom_14.trigger)(this, 'submit');
        }
        getFormData() {
            const result = {};
            for (const el of this.elements)
                if (el.name)
                    result[el.name] = el.value;
            return result;
        }
    };
    Form = __decorate([
        (0, component_19.Augment)('cxl-form', (0, template_9.role)('form'), host => (0, rx_14.merge)((0, dom_14.on)(host, 'form.submit').tap(ev => {
            host.submit();
            ev.stopPropagation();
        }), (0, template_9.registableHost)(host, 'form', host.elements), (0, dom_14.onKeypress)(host, 'enter').tap(ev => {
            host.submit();
            ev.preventDefault();
        })))
    ], Form);
    exports.Form = Form;
    let Input = class Input extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.value = '';
        }
    };
    Input = __decorate([
        (0, component_19.Augment)('cxl-input', (0, template_9.role)('textbox'), (0, theme_js_14.css)({
            $: {
                display: 'block',
                flexGrow: 1,
                overflowY: 'hidden',
            },
            input: {
                color: 'onSurface',
                font: 'default',
                minHeight: 20,
                outline: 0,
            },
            $disabled: { pointerEvents: 'none' },
        }), ContentEditable)
    ], Input);
    exports.Input = Input;
    let FieldInput = class FieldInput extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.outline = false;
            this.floating = false;
            this.label = '';
        }
    };
    __decorate([
        (0, component_19.Attribute)()
    ], FieldInput.prototype, "outline", void 0);
    __decorate([
        (0, component_19.Attribute)()
    ], FieldInput.prototype, "floating", void 0);
    __decorate([
        (0, component_19.Attribute)()
    ], FieldInput.prototype, "label", void 0);
    FieldInput = __decorate([
        (0, component_19.Augment)('cxl-field-input', (0, template_9.role)('textbox'), (0, theme_js_14.css)({
            $: { display: 'block', gridColumnEnd: 'span 12' },
            input: {
                color: 'onSurface',
                font: 'default',
                minHeight: 20,
                outline: 0,
                flexGrow: 1,
            },
            $disabled: { pointerEvents: 'none' },
        }), host => ((0, tsx_14.dom)(field_js_2.Field, { input: host, floating: (0, component_19.get)(host, 'floating'), outline: (0, component_19.get)(host, 'outline') },
            (0, tsx_14.dom)(Label, null, (0, component_19.get)(host, 'label')),
            ContentEditable(host))))
    ], FieldInput);
    exports.FieldInput = FieldInput;
    let FieldTextArea = class FieldTextArea extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.outline = false;
            this.floating = false;
            this.label = '';
        }
    };
    __decorate([
        (0, component_19.Attribute)()
    ], FieldTextArea.prototype, "outline", void 0);
    __decorate([
        (0, component_19.Attribute)()
    ], FieldTextArea.prototype, "floating", void 0);
    __decorate([
        (0, component_19.Attribute)()
    ], FieldTextArea.prototype, "label", void 0);
    FieldTextArea = __decorate([
        (0, component_19.Augment)('cxl-field-textarea', (0, theme_js_14.css)({
            $: { display: 'block', gridColumnEnd: 'span 12' },
            input: {
                minHeight: 20,
                lineHeight: 20,
                color: 'onSurface',
                outline: 'none',
                whiteSpace: 'pre-wrap',
                flexGrow: 1,
                textAlign: 'left',
            },
            $disabled: { pointerEvents: 'none' },
        }), host => ((0, tsx_14.dom)(field_js_2.Field, { input: host, floating: (0, component_19.get)(host, 'floating'), outline: (0, component_19.get)(host, 'outline') },
            (0, tsx_14.dom)(Label, null, (0, component_19.get)(host, 'label')),
            ContentEditable(host, true))))
    ], FieldTextArea);
    exports.FieldTextArea = FieldTextArea;
    let PasswordInput = class PasswordInput extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.value = '';
        }
    };
    __decorate([
        (0, component_19.Attribute)()
    ], PasswordInput.prototype, "maxlength", void 0);
    PasswordInput = __decorate([
        (0, component_19.Augment)('cxl-password', (0, template_9.role)('textbox'), (0, theme_js_14.css)({
            $: {
                display: 'block',
                flexGrow: 1,
                lineHeight: 22,
            },
            input: {
                display: 'block',
                ...(0, css_9.border)(0),
                ...(0, css_9.padding)(0),
                font: 'default',
                color: 'onSurface',
                outline: 0,
                width: '100%',
                height: 22,
                backgroundColor: 'transparent',
            },
            $disabled: { pointerEvents: 'none' },
        }), $ => $valueProxy($, ((0, tsx_14.dom)("input", { className: "input", type: "password" }))))
    ], PasswordInput);
    exports.PasswordInput = PasswordInput;
    const radioElements = new Set();
    let Radio = class Radio extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.checked = false;
        }
    };
    __decorate([
        (0, component_19.StyleAttribute)()
    ], Radio.prototype, "checked", void 0);
    Radio = __decorate([
        (0, component_19.Augment)('cxl-radio', (0, template_9.role)('radio'), core_js_13.FocusCircleStyle, core_js_13.Focusable, (0, theme_js_14.css)({
            $: {
                position: 'relative',
                cursor: 'pointer',
                marginRight: 16,
                marginLeft: 0,
                paddingTop: 12,
                paddingBottom: 12,
                display: 'block',
                font: 'default',
                textAlign: 'left',
            },
            $inline: { display: 'inline-block' },
            $invalid$touched: { color: 'error' },
            content: { lineHeight: 20 },
            circle: {
                borderRadius: 10,
                width: 10,
                height: 10,
                display: 'inline-block',
                backgroundColor: 'primary',
                scaleX: 0,
                scaleY: 0,
                marginTop: 3,
            },
            circle$checked: { scaleX: 1, scaleY: 1 },
            circle$invalid$touched: { backgroundColor: 'error' },
            box: {
                borderWidth: 2,
                width: 20,
                height: 20,
                display: 'inline-block',
                borderColor: 'onSurface',
                marginRight: 16,
                borderRadius: 10,
                borderStyle: 'solid',
                color: 'primary',
                lineHeight: 16,
                textAlign: 'center',
            },
            box$checked: { borderColor: 'primary' },
            box$invalid$touched: { borderColor: 'error' },
            box$checked$invalid$touched: { color: 'error' },
        }), _ => ((0, tsx_14.dom)(tsx_14.dom, null,
            (0, tsx_14.dom)("div", { className: "focusCircle focusCirclePrimary" }),
            (0, tsx_14.dom)("div", { className: "box" },
                (0, tsx_14.dom)("span", { className: "circle" })),
            (0, tsx_14.dom)("slot", null))), host => {
            let registered = false;
            function unregister() {
                radioElements.delete(host);
                registered = false;
            }
            function register(name) {
                if (registered)
                    unregister();
                if (name) {
                    radioElements.add(host);
                    registered = true;
                }
            }
            return (0, rx_14.merge)((0, rx_14.observable)(unregister), (0, dom_14.onAction)(host).tap(() => {
                if (host.disabled)
                    return;
                if (!host.checked)
                    host.checked = host.touched = true;
            }), (0, component_19.get)(host, 'name').tap(register), (0, component_19.get)(host, 'checked').tap(val => {
                host.setAttribute('aria-checked', val ? 'true' : 'false');
                if (val) {
                    (0, dom_14.trigger)(host, 'change');
                    radioElements.forEach(r => {
                        if (r.name === host.name && r !== host) {
                            r.checked = false;
                            r.touched = true;
                        }
                    });
                }
            }));
        })
    ], Radio);
    exports.Radio = Radio;
    let Switch = class Switch extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.value = false;
            this.checked = false;
        }
    };
    __decorate([
        (0, component_19.StyleAttribute)()
    ], Switch.prototype, "checked", void 0);
    Switch = __decorate([
        (0, component_19.Augment)('cxl-switch', (0, template_9.role)('switch'), core_js_13.FocusCircleStyle, (0, theme_js_14.css)({
            $: {
                display: 'inline-block',
                cursor: 'pointer',
                paddingTop: 12,
                paddingBottom: 12,
            },
            switch: {
                position: 'relative',
                width: 46,
                height: 20,
                userSelect: 'none',
            },
            background: {
                position: 'absolute',
                display: 'block',
                left: 10,
                top: 2,
                height: 16,
                borderRadius: 8,
                width: 26,
                backgroundColor: 'divider',
            },
            knob: {
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: 'surface',
                position: 'absolute',
                elevation: 1,
            },
            background$checked: { backgroundColor: 'primaryLight' },
            knob$checked: {
                translateX: 24,
                backgroundColor: 'primary',
            },
            knob$invalid$touched: { backgroundColor: 'error' },
            content$invalid$touched: { color: 'error' },
            focusCircle$checked: { backgroundColor: 'primary' },
        }), core_js_13.Focusable, _ => ((0, tsx_14.dom)("div", { className: "switch" },
            (0, tsx_14.dom)("span", { className: "background =checked:#update" }),
            (0, tsx_14.dom)("div", { className: "knob" },
                (0, tsx_14.dom)("span", { className: "focusCircle" })))), host => (0, rx_14.merge)((0, dom_14.onAction)(host).tap(() => {
            if (host.disabled)
                return;
            host.checked = !host.checked;
        }), (0, template_9.checkedBehavior)(host).tap(() => (host.value = host.checked))))
    ], Switch);
    exports.Switch = Switch;
    function focusProxy(el, host) {
        host.focusElement = el;
        return (0, template_9.focusable)(host, el);
    }
    exports.focusProxy = focusProxy;
    function $valueProxy(host, el) {
        host.bind((0, rx_14.merge)(focusProxy(el, host), (0, component_19.get)(host, 'value').tap(val => {
            if (el.value !== val)
                el.value = val;
        }), (0, component_19.get)(host, 'disabled').tap(val => (el.disabled = val)), (0, template_8.onValue)(el).tap(() => (host.value = el.value))));
        return el;
    }
    function contentEditable(el, host, multiLine = false) {
        return (0, rx_14.merge)(focusProxy(el, host), (0, component_19.get)(host, 'value').tap(val => {
            if (el.textContent !== val)
                el.textContent = val;
        }), (0, component_19.get)(host, 'disabled').raf(val => (el.contentEditable = val ? 'false' : 'true')), (0, dom_14.on)(host, 'paste').tap((e) => {
            e.preventDefault();
            const text = (e.originalEvent || e).clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
        }), (0, dom_14.on)(el, 'input').tap(() => (host.value = el.textContent)), (0, dom_14.onKeypress)(el, 'enter').tap(ev => multiLine ? ev.stopPropagation() : ev.preventDefault()));
    }
    function ContentEditable(host, multi = false) {
        const el = ((0, tsx_14.dom)("div", { className: "input" }));
        host.bind(contentEditable(el, host, multi));
        return el;
    }
    exports.ContentEditable = ContentEditable;
    let TextArea = class TextArea extends input_base_js_3.InputBase {
        constructor() {
            super(...arguments);
            this.value = '';
        }
    };
    TextArea = __decorate([
        (0, component_19.Augment)('cxl-textarea', (0, template_9.role)('textbox'), (0, theme_js_14.css)({
            $: {
                display: 'block',
                position: 'relative',
                flexGrow: 1,
                overflowX: 'hidden',
            },
            input: {
                minHeight: 20,
                lineHeight: 20,
                height: '100%',
                whiteSpace: 'pre-wrap',
                color: 'onSurface',
                outline: 'none',
                textAlign: 'left',
            },
            $disabled: { pointerEvents: 'none' },
        }), $ => ContentEditable($, true))
    ], TextArea);
    exports.TextArea = TextArea;
    let FieldClear = class FieldClear extends component_19.Component {
    };
    FieldClear = __decorate([
        (0, component_19.Augment)('cxl-field-clear', (0, theme_js_14.css)({
            $: {
                opacity: 0.5,
                cursor: 'pointer',
            },
            $hover: {
                opacity: 1,
            },
        }), $ => ((0, tsx_14.dom)(core_js_13.Span, { tabIndex: 0, "$": el => (0, dom_14.onAction)(el).tap(() => {
                var _a;
                const input = (_a = $.parentElement) === null || _a === void 0 ? void 0 : _a.input;
                if (input)
                    input.value = '';
            }) },
            (0, tsx_14.dom)(icon_js_4.CloseIcon, { width: 20 }))))
    ], FieldClear);
    exports.FieldClear = FieldClear;
});
define("@cxl/ui/layout.js", ["require", "exports", "@cxl/component", "@cxl/css", "@cxl/tsx", "@cxl/ui/theme.js", "@cxl/ui/core.js"], function (require, exports, component_20, css_10, tsx_15, theme_js_15, core_js_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.GridLayout = exports.Grid = exports.Card = exports.Page = exports.Content = exports.Layout = exports.C = void 0;
    const colStyles = ((r) => {
        for (let i = 12; i > 0; i--)
            r.xl['$xl' + i] = r.lg['$lg' + i] = r.md['$md' + i] = r.sm['$sm' + i] = r.xs['$xs' + i] = {
                display: 'block',
                gridColumnEnd: 'span ' + i,
            };
        return r;
    })({
        xl: {},
        lg: {},
        md: {},
        sm: {},
        xs: {},
    });
    let C = class C extends component_20.Component {
        constructor() {
            super(...arguments);
            this.flex = false;
            this.vflex = false;
            this.grow = false;
            this.primary = false;
            this.secondary = false;
            this.center = false;
            this.middle = false;
        }
    };
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "flex", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "vflex", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "grow", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('xs'),
        })
    ], C.prototype, "xs", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('sm'),
        })
    ], C.prototype, "sm", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('md'),
        })
    ], C.prototype, "md", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('lg'),
        })
    ], C.prototype, "lg", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('xl'),
        })
    ], C.prototype, "xl", void 0);
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('pad'),
        })
    ], C.prototype, "pad", void 0);
    __decorate([
        (0, core_js_14.ColorAttribute)()
    ], C.prototype, "color", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "primary", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "secondary", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "center", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "middle", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], C.prototype, "gap", void 0);
    C = __decorate([
        (0, component_20.Augment)('cxl-c', (0, theme_js_15.css)({
            $: {
                display: 'block',
                gridColumnEnd: 'span 12',
                flexShrink: 1,
            },
            $grow: { flexGrow: 1, flexShrink: 1 },
            $fill: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
            },
            ...colStyles.xs,
            $xs0: { display: 'none' },
            '@small': {
                $: { gridColumnEnd: 'auto', flexShrink: 0 },
                $small: { display: 'block' },
                ...colStyles.sm,
                $sm0: { display: 'none' },
            },
            '@medium': {
                ...colStyles.md,
                $md0: { display: 'none' },
                $medium: { display: 'block' },
            },
            '@large': {
                ...colStyles.lg,
                $lg0: { display: 'none' },
                $large: { display: 'block' },
            },
            '@xlarge': {
                ...colStyles.xl,
                $xl0: { display: 'none' },
                $xlarge: { display: 'block' },
            },
            $pad16: { ...(0, css_10.padding)(16) },
            $pad8: { ...(0, css_10.padding)(8) },
            $pad24: { ...(0, css_10.padding)(24) },
            $pad32: { ...(0, css_10.padding)(32) },
            $surface: { backgroundColor: 'surface', color: 'onSurface' },
            $error: { backgroundColor: 'error', color: 'onError' },
            $primary: {
                ...theme_js_15.ColorStyles.primary,
                color: 'onSurface',
                backgroundColor: 'surface',
            },
            $secondary: {
                ...theme_js_15.ColorStyles.secondary,
                color: 'onSurface',
                backgroundColor: 'surface',
            },
            $flex: { display: 'flex' },
            $vflex: { display: 'flex', flexDirection: 'column' },
            $vflex$middle: { justifyContent: 'center' },
            $flex$middle: { alignItems: 'center' },
            $center: { textAlign: 'center' },
            '$gap="8"': { columnGap: 8 },
            '$gap="16"': { columnGap: 16 },
            '$gap="24"': { columnGap: 24 },
            '$gap="32"': { columnGap: 32 },
            '$gap="64"': { columnGap: 64 },
            '$vflex$gap="8"': { rowGap: 8 },
            '$vflex$gap="16"': { rowGap: 16 },
            '$vflex$gap="24"': { rowGap: 24 },
            '$vflex$gap="32"': { rowGap: 32 },
            '$vflex$gap="64"': { rowGap: 64 },
        }), component_20.Slot)
    ], C);
    exports.C = C;
    let Layout = class Layout extends component_20.Component {
        constructor() {
            super(...arguments);
            this.center = false;
            this.full = false;
        }
    };
    __decorate([
        (0, component_20.StyleAttribute)()
    ], Layout.prototype, "center", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], Layout.prototype, "full", void 0);
    __decorate([
        (0, component_20.StyleAttribute)()
    ], Layout.prototype, "vpad", void 0);
    Layout = __decorate([
        (0, component_20.Augment)('cxl-layout', (0, theme_js_15.css)({
            $: {
                display: 'block',
                paddingLeft: 16,
                paddingRight: 16,
            },
            '@medium': {
                $: { paddingLeft: 32, paddingRight: 32 },
            },
            '@large': {
                $: { paddingLeft: 64, paddingRight: 64 },
            },
            '@xlarge': {
                $: { width: 1200 },
                $center: {
                    paddingLeft: 0,
                    paddingRight: 0,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                },
            },
            $full: { width: 'auto' },
            '$vpad=48': { paddingTop: 48, paddingBottom: 48 },
            '$vpad=96': { paddingTop: 96, paddingBottom: 96 },
        }), _ => (0, tsx_15.dom)("slot", null))
    ], Layout);
    exports.Layout = Layout;
    let Content = class Content extends Layout {
    };
    Content = __decorate([
        (0, component_20.Augment)('cxl-content', (0, theme_js_15.css)({
            $: {
                position: 'relative',
                flexGrow: 1,
                overflowY: 'auto',
                overflowScrolling: 'touch',
                willChange: 'transform',
                paddingTop: 24,
                paddingBottom: 24,
                color: 'onBackground',
                backgroundColor: 'background',
            },
            '@large': {
                $: { paddingTop: 32, paddingBottom: 32 },
            },
            '@xlarge': {
                $: { paddingTop: 64, paddingBottom: 64 },
            },
        }))
    ], Content);
    exports.Content = Content;
    let Page = class Page extends component_20.Component {
    };
    Page = __decorate([
        (0, component_20.Augment)('cxl-page', (0, theme_js_15.css)({
            $: {
                display: 'block',
                position: 'relative',
                flexGrow: 1,
                overflowY: 'auto',
                overflowScrolling: 'touch',
                backgroundColor: 'surface',
                color: 'onSurface',
                height: '100%',
            },
            container: { ...(0, css_10.margin)(16) },
            '@medium': { container: (0, css_10.margin)(32) },
            '@large': { container: (0, css_10.margin)(32, 64, 32, 64) },
            '@xlarge': {
                container: {
                    width: 1080,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                },
            },
        }), _ => ((0, tsx_15.dom)("div", { className: "container" },
            (0, tsx_15.dom)("slot", null))))
    ], Page);
    exports.Page = Page;
    let Card = class Card extends C {
        constructor() {
            super(...arguments);
            this.elevation = 1;
        }
    };
    __decorate([
        (0, component_20.Attribute)({
            persistOperator: (0, core_js_14.persistWithParameter)('elevation'),
        })
    ], Card.prototype, "elevation", void 0);
    Card = __decorate([
        (0, component_20.Augment)('cxl-card', (0, theme_js_15.css)({
            $: {
                backgroundColor: 'surface',
                borderRadius: 2,
                color: 'onSurface',
                display: 'block',
                elevation: 1,
            },
            elevation2: { elevation: 2 },
            elevation3: { elevation: 3 },
            elevation4: { elevation: 4 },
            elevation5: { elevation: 5 },
        }), component_20.Slot)
    ], Card);
    exports.Card = Card;
    let Grid = class Grid extends component_20.Component {
        constructor() {
            super(...arguments);
            this.columns = 12;
        }
    };
    __decorate([
        (0, component_20.Attribute)()
    ], Grid.prototype, "rows", void 0);
    __decorate([
        (0, component_20.Attribute)()
    ], Grid.prototype, "columns", void 0);
    __decorate([
        (0, component_20.Attribute)()
    ], Grid.prototype, "coltemplate", void 0);
    Grid = __decorate([
        (0, component_20.Augment)('cxl-grid', (0, theme_js_15.css)({
            $: { display: 'grid', columnGap: 0, rowGap: 16 },
            '@small': { $: { columnGap: 16 } },
        }), component_20.Slot, (0, component_20.update)(host => {
            var _a, _b;
            const colTemplate = (_a = host.coltemplate) !== null && _a !== void 0 ? _a : `repeat(${host.columns}, minmax(0,1fr))`;
            host.style.gridTemplateRows = ((_b = host.rows) !== null && _b !== void 0 ? _b : 'auto').toString();
            host.style.gridTemplateColumns = colTemplate;
        }))
    ], Grid);
    exports.Grid = Grid;
    let GridLayout = class GridLayout extends component_20.Component {
        constructor() {
            super(...arguments);
            this.type = 'two-column-left';
        }
    };
    __decorate([
        (0, component_20.StyleAttribute)()
    ], GridLayout.prototype, "type", void 0);
    GridLayout = __decorate([
        (0, component_20.Augment)('cxl-grid-layout', (0, theme_js_15.css)({
            $: { display: 'grid', columnGap: 0, rowGap: 32 },
            '@small': { $: { columnGap: 64 } },
            '$type=two-column-left': { gridTemplateColumns: '2fr 1fr' },
            '$type=two-column-right': { gridTemplateColumns: '1fr 2fr' },
            '$type=two-column': { gridTemplateColumns: '1fr 1fr' },
        }), component_20.Slot)
    ], GridLayout);
    exports.GridLayout = GridLayout;
});
define("@cxl/ui/item.js", ["require", "exports", "@cxl/component", "@cxl/dom", "@cxl/template", "@cxl/ui/theme.js", "@cxl/ui/core.js"], function (require, exports, component_21, dom_15, template_10, theme_js_16, core_js_15) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Item = exports.ItemLayout = void 0;
    let ItemLayout = class ItemLayout extends component_21.Component {
        constructor() {
            super(...arguments);
            this.selected = false;
        }
    };
    __decorate([
        (0, component_21.StyleAttribute)()
    ], ItemLayout.prototype, "selected", void 0);
    ItemLayout = __decorate([
        (0, component_21.Augment)('cxl-item-layout', (0, theme_js_16.css)({
            $: {
                position: 'relative',
                color: 'onSurface',
                backgroundColor: 'surface',
                display: 'flex',
                font: 'default',
                lineHeight: 24,
                paddingRight: 16,
                paddingLeft: 16,
                paddingTop: 8,
                paddingBottom: 8,
                minHeight: 48,
                alignItems: 'center',
                columnGap: 16,
            },
            $selected: {
                backgroundColor: 'primaryLight',
                color: 'onPrimaryLight',
            },
            $hover: theme_js_16.HoverStyles,
        }), component_21.Slot)
    ], ItemLayout);
    exports.ItemLayout = ItemLayout;
    let Item = class Item extends ItemLayout {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.touched = false;
        }
    };
    __decorate([
        (0, component_21.StyleAttribute)()
    ], Item.prototype, "disabled", void 0);
    Item = __decorate([
        (0, component_21.Augment)('cxl-item', core_js_15.ripple, template_10.focusable, (0, theme_js_16.css)({
            $focusWithin: theme_js_16.FocusStyles,
            ...theme_js_16.StateStyles,
        }), host => (0, dom_15.onAction)(host).pipe((0, template_10.triggerEvent)(host, 'drawer.close')))
    ], Item);
    exports.Item = Item;
});
define("@cxl/ui/tabs.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/dom", "@cxl/template", "@cxl/css", "@cxl/rx", "@cxl/ui/core.js", "@cxl/ui/theme.js"], function (require, exports, tsx_16, component_22, dom_16, template_11, css_11, rx_15, core_js_16, theme_js_17) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TabPanel = exports.Tabs = exports.Tab = void 0;
    let Tab = class Tab extends component_22.Component {
        constructor() {
            super(...arguments);
            this.selected = false;
        }
    };
    __decorate([
        (0, component_22.Attribute)()
    ], Tab.prototype, "selected", void 0);
    __decorate([
        (0, component_22.Attribute)()
    ], Tab.prototype, "name", void 0);
    Tab = __decorate([
        (0, component_22.Augment)('cxl-tab', (0, template_11.role)('tab'), (0, theme_js_17.css)({
            $: {
                flexShrink: 0,
                flexGrow: 1,
                ...(0, css_11.padding)(16, 16, 12, 16),
                backgroundColor: 'surface',
                font: 'button',
                color: 'onSurface',
                lineHeight: 18,
                textDecoration: 'none',
                textAlign: 'center',
                display: 'block',
                outline: 0,
                minWidth: 90,
            },
            '@small': {
                $: { display: 'inline-block' },
            },
            $focusWithin: { filter: 'invert(0.2) saturate(2) brightness(1.1)' },
            $hover: { filter: 'invert(0.15) saturate(1.5) brightness(1.1)' },
        }), core_js_16.ripple, _ => (0, tsx_16.dom)("slot", null), host => (0, component_22.get)(host, 'selected').tap(val => {
            if (val)
                (0, dom_16.trigger)(host, 'cxl-tab.selected');
        }), host => (0, component_22.get)(host, 'name').switchMap(name => {
            host.tabIndex = name ? 0 : -1;
            return name
                ? (0, dom_16.onAction)(host).tap(() => (host.selected = true))
                : rx_15.EMPTY;
        }))
    ], Tab);
    exports.Tab = Tab;
    let Tabs = class Tabs extends component_22.Component {
    };
    __decorate([
        (0, component_22.Attribute)()
    ], Tabs.prototype, "selected", void 0);
    Tabs = __decorate([
        (0, component_22.Augment)('cxl-tabs', (0, template_11.role)('tablist'), (0, theme_js_17.css)({
            $: {
                backgroundColor: 'surface',
                color: 'onSurface',
                display: 'block',
                flexShrink: 0,
                position: 'relative',
                cursor: 'pointer',
                overflowX: 'auto',
            },
            selected: {
                transformOrigin: 'left',
                backgroundColor: 'secondary',
                height: 2,
                width: 100,
                scaleX: 0,
                display: 'none',
            },
            content: { display: 'flex' },
            '@small': {
                content: { display: 'block' },
            },
        }), () => ((0, tsx_16.dom)("div", { className: "content" },
            (0, tsx_16.dom)("slot", null))), el => (0, dom_16.on)(el, 'cxl-tab.selected').tap(ev => {
            if (el.selected)
                el.selected.selected = false;
            if (ev.target instanceof Tab)
                el.selected = ev.target;
            else if (ev.detail instanceof Tab)
                el.selected = ev.detail;
            ev.stopPropagation();
            if (el.selected !== activeTab$.value)
                activeTab$.next(el.selected);
        }), host => ((0, tsx_16.dom)(core_js_16.Span, { className: "selected", "$": el => (0, rx_15.merge)((0, dom_16.onChildrenMutation)(host), (0, dom_16.onFontsReady)(), (0, component_22.get)(host, 'selected'), (0, dom_16.on)(window, 'resize'), (0, dom_16.onResize)(el)).raf(() => {
                const sel = host.selected;
                if (!sel)
                    return (el.style.transform = 'scaleX(0)');
                const scaleX = sel.clientWidth / 100;
                el.style.transform = `translate(${sel.offsetLeft}px, 0) scaleX(${scaleX})`;
                el.style.display = 'block';
            }) })))
    ], Tabs);
    exports.Tabs = Tabs;
    const activeTab$ = (0, rx_15.be)(undefined);
    let TabPanel = class TabPanel extends component_22.Component {
    };
    __decorate([
        (0, component_22.Attribute)()
    ], TabPanel.prototype, "name", void 0);
    TabPanel = __decorate([
        (0, component_22.Augment)('cxl-tab-panel', $ => activeTab$.tap(tab => {
            if (tab && $.name && tab.name === $.name) {
                $.style.display = 'contents';
            }
            else
                $.style.display = 'none';
        }))
    ], TabPanel);
    exports.TabPanel = TabPanel;
});
define("@cxl/ui/navigation.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/dom", "@cxl/template", "@cxl/css", "@cxl/rx", "@cxl/ui/theme.js", "@cxl/ui/theme.js", "@cxl/ui/icon.js", "@cxl/ui/dialog.js"], function (require, exports, tsx_17, component_23, dom_17, template_12, css_12, rx_16, theme_js_18, theme_js_19, icon_js_5, dialog_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.List = exports.NavbarSubtitle = exports.Navbar = void 0;
    let Navbar = class Navbar extends component_23.Component {
        constructor() {
            super(...arguments);
            this.permanent = false;
        }
    };
    __decorate([
        (0, component_23.StyleAttribute)()
    ], Navbar.prototype, "permanent", void 0);
    __decorate([
        (0, component_23.Attribute)()
    ], Navbar.prototype, "drawer", void 0);
    Navbar = __decorate([
        (0, component_23.Augment)('cxl-navbar', (0, template_12.role)('navigation'), (0, theme_js_18.css)({
            $: {
                display: 'inline-block',
                overflowScrolling: 'touch',
                font: 'default',
            },
            toggler: {
                backgroundColor: 'surface',
                color: 'onSurface',
                cursor: 'pointer',
                marginLeft: -8,
                marginRight: 16,
            },
            drawer: theme_js_19.ColorStyles.surface,
            '@large': {
                toggler$permanent: { display: 'none' },
            },
        }), host => ((0, tsx_17.dom)(tsx_17.dom, null,
            (0, tsx_17.dom)(icon_js_5.IconButton, { "$": el => (0, dom_17.onAction)(el).tap(() => {
                    if (host.drawer)
                        host.drawer.visible = !host.drawer.visible;
                }), className: "toggler" },
                (0, tsx_17.dom)(icon_js_5.MenuIcon, null)),
            (0, tsx_17.dom)(dialog_js_2.Drawer, { className: "drawer", "$": el => ((host.drawer = el), rx_16.EMPTY), permanent: (0, component_23.get)(host, 'permanent') },
                (0, tsx_17.dom)("slot", null)))))
    ], Navbar);
    exports.Navbar = Navbar;
    let NavbarSubtitle = class NavbarSubtitle extends component_23.Component {
    };
    NavbarSubtitle = __decorate([
        (0, component_23.Augment)('cxl-navbar-subtitle', (0, theme_js_18.css)({
            $: {
                display: 'block',
                font: 'subtitle',
                ...(0, css_12.padding)(16, 16, 8, 16),
                color: 'headerText',
            },
        }), component_23.Slot)
    ], NavbarSubtitle);
    exports.NavbarSubtitle = NavbarSubtitle;
    let List = class List extends component_23.Component {
    };
    List = __decorate([
        (0, component_23.Augment)('cxl-list', (0, template_12.role)('list'), $ => (0, template_12.navigationList)($, ':not([disabled])', ':focus, :focus-within').tap((el) => { var _a; return (_a = el === null || el === void 0 ? void 0 : el.focus) === null || _a === void 0 ? void 0 : _a.call(el); }), (0, theme_js_18.css)({
            $: {
                display: 'block',
                paddingTop: 8,
                paddingBottom: 8,
            },
        }), _ => (0, tsx_17.dom)("slot", null))
    ], List);
    exports.List = List;
});
define("@cxl/ui/avatar.js", ["require", "exports", "@cxl/component", "@cxl/template", "@cxl/ui/theme.js", "@cxl/tsx", "@cxl/ui/core.js", "@cxl/ui/icon.js"], function (require, exports, component_24, template_13, theme_js_20, tsx_18, core_js_17, icon_js_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Avatar = void 0;
    let Avatar = class Avatar extends component_24.Component {
        constructor() {
            super(...arguments);
            this.size = 0;
            this.src = '';
            this.text = '';
        }
    };
    __decorate([
        (0, core_js_17.SizeAttribute)(size => ({
            width: 40 + size * 8,
            height: 40 + size * 8,
            lineHeight: 38 + size * 8,
            fontSize: 20 + size * 4,
        }))
    ], Avatar.prototype, "size", void 0);
    __decorate([
        (0, component_24.Attribute)()
    ], Avatar.prototype, "src", void 0);
    __decorate([
        (0, component_24.Attribute)()
    ], Avatar.prototype, "text", void 0);
    Avatar = __decorate([
        (0, component_24.Augment)('cxl-avatar', (0, template_13.role)('img'), (0, theme_js_20.css)({
            $: {
                borderRadius: '100%',
                backgroundColor: 'onSurface8',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                display: 'inline-block',
                textAlign: 'center',
                overflowY: 'hidden',
                verticalAlign: 'middle',
            },
            image: {
                width: '100%',
                height: '100%',
            },
        }), node => ((0, tsx_18.dom)(tsx_18.dom, null,
            () => {
                node.bind((0, component_24.get)(node, 'src').tap(src => (node.style.backgroundImage = src
                    ? `url('${src}')`
                    : '')));
                const el = ((0, tsx_18.dom)(icon_js_6.PersonIcon, null));
                el.setAttribute('class', 'image');
                node.bind((0, component_24.get)(node, 'src').tap(src => (el.style.display =
                    src || node.text ? 'none' : 'inline-block')));
                return el;
            },
            (0, tsx_18.expression)(node, (0, component_24.get)(node, 'text')))))
    ], Avatar);
    exports.Avatar = Avatar;
});
define("cxl/ui/multiselect", ["require", "exports", "@cxl/component", "@cxl/tsx", "@cxl/dom", "@cxl/ui/theme.js", "@cxl/rx", "@cxl/ui/select.js", "@cxl/template"], function (require, exports, component_25, tsx_19, dom_18, theme_js_21, rx_17, select_js_2, template_14) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MultiSelect = void 0;
    let MultiSelect = class MultiSelect extends select_js_2.SelectBase {
        constructor() {
            super(...arguments);
            this.placeholder = '';
            this.selected = new Set();
            this.value = [];
        }
        positionMenu(menu) {
            let height;
            const rect = this.getBoundingClientRect();
            height = menu.scrollHeight;
            const maxHeight = window.innerHeight - rect.bottom;
            if (height > maxHeight)
                height = maxHeight;
            const style = menu.style;
            style.height = height + 'px';
        }
        setSelected(option) {
            option.selected = !this.selected.has(option);
            const method = option.selected ? 'add' : 'delete';
            this.selected[method](option);
            const selected = [...this.selected];
            this.value = selected.map(o => o.value);
            if (this.opened)
                this.setFocusedOption(option);
        }
        setFocusedOption(option) {
            this.clearFocusedOption();
            this.focusedOption = option;
            option.focused = true;
        }
        clearFocusedOption() {
            var _a;
            (_a = this.options) === null || _a === void 0 ? void 0 : _a.forEach(o => (o.focused = false));
            this.focusedOption = undefined;
        }
        open() {
            if (this.disabled || this.opened)
                return;
            this.opened = true;
        }
        close() {
            if (this.opened) {
                this.opened = false;
                this.clearFocusedOption();
            }
        }
    };
    __decorate([
        (0, component_25.Attribute)()
    ], MultiSelect.prototype, "placeholder", void 0);
    MultiSelect = __decorate([
        (0, component_25.Augment)('cxl-multiselect', (0, theme_js_21.css)({
            menu: { left: -12, right: -12, top: 26, height: 0 },
            menu$opened: { height: 'auto' },
        }), host => ((0, tsx_19.dom)(select_js_2.SelectMenu, { "$": el => (0, component_25.get)(host, 'opened').raf(() => host.positionMenu(el)), className: "menu", visible: (0, component_25.get)(host, 'opened') },
            (0, tsx_19.dom)("slot", null))), host => (0, rx_17.merge)((0, dom_18.onAction)(host).tap(() => {
            if (host.focusedOption)
                host.setSelected(host.focusedOption);
            else
                host.open();
        }), (0, template_14.selectableHostMultiple)(host).tap(selected => host.setSelected(selected)), (0, template_14.navigationList)(host, 'cxl-option:not([disabled])', 'cxl-option[focused]').tap(selected => host.setFocusedOption(selected))), host => ((0, tsx_19.dom)("div", { className: "placeholder" }, (0, tsx_19.expression)(host, (0, component_25.get)(host, 'value')
            .raf()
            .map(() => [...host.selected]
            .map(s => s.textContent)
            .join(', ') || host.placeholder)))))
    ], MultiSelect);
    exports.MultiSelect = MultiSelect;
});
define("@cxl/ui/appbar-search.js", ["require", "exports", "@cxl/component", "@cxl/ui/icon.js", "@cxl/template", "@cxl/dom", "@cxl/ui/theme.js", "@cxl/rx", "@cxl/ui/input-base.js", "@cxl/ui/appbar.js", "@cxl/ui/field.js", "@cxl/ui/form.js", "@cxl/tsx", "@cxl/ui/core.js"], function (require, exports, component_26, icon_js_7, template_15, dom_19, theme_js_22, rx_18, input_base_js_4, appbar_js_1, field_js_3, form_js_1, tsx_20, core_js_18) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppbarSearch = void 0;
    let AppbarSearch = class AppbarSearch extends input_base_js_4.InputBase {
        constructor() {
            super(...arguments);
            this.opened = false;
            this.value = '';
        }
        open() {
            const appbar = this.parentElement;
            if (appbar)
                appbar.contextual = 'search';
        }
        focus() {
            var _a, _b;
            if ((_a = this.desktopInput) === null || _a === void 0 ? void 0 : _a.offsetParent)
                this.desktopInput.focus();
            else if ((_b = this.mobileIcon) === null || _b === void 0 ? void 0 : _b.offsetParent)
                this.mobileIcon.focus();
        }
    };
    __decorate([
        (0, component_26.StyleAttribute)()
    ], AppbarSearch.prototype, "opened", void 0);
    AppbarSearch = __decorate([
        (0, component_26.Augment)('cxl-appbar-search', (0, theme_js_22.css)({
            $: { display: 'flex', position: 'relative' },
            $opened: {
                backgroundColor: 'surface',
            },
            input: { display: 'none', marginBottom: 0, position: 'relative' },
            input$opened: {
                display: 'block',
            },
            button$opened: { display: 'none' },
            '@medium': {
                input: {
                    width: 200,
                    display: 'block',
                },
                button: { display: 'none' },
            },
            $disabled: theme_js_22.DisabledStyles,
        }), $ => {
            let inputEl;
            function onContextual(val) {
                if (val)
                    requestAnimationFrame(() => inputEl.focus());
            }
            return (0, template_15.teleport)((0, tsx_20.dom)(appbar_js_1.AppbarContextual, { "$": el => (0, component_26.get)(el, 'visible').tap(onContextual), name: "search" },
                (0, tsx_20.dom)(field_js_3.Field, { className: "input" },
                    (0, tsx_20.dom)(form_js_1.Input, { "$": el => (0, rx_18.merge)((0, component_26.get)($, 'name').pipe((0, template_15.ariaValue)(el, 'label')), (0, template_15.syncAttribute)($, (inputEl = el), 'value')) }),
                    (0, tsx_20.dom)(icon_js_7.SearchIcon, null))), 'cxl-appbar');
        }, host => {
            return ((0, tsx_20.dom)(tsx_20.dom, null,
                (0, tsx_20.dom)(icon_js_7.IconButton, { "$": el => (0, rx_18.merge)((0, dom_19.onAction)((host.mobileIcon = el)).tap(() => host.open()), (0, dom_19.on)(el, 'blur').tap(() => (host.touched = true))), className: "button" },
                    (0, tsx_20.dom)(icon_js_7.SearchIcon, null)),
                (0, tsx_20.dom)(field_js_3.Field, { className: "input" },
                    (0, tsx_20.dom)(form_js_1.Input, { "$": el => (0, rx_18.merge)((0, component_26.get)(host, 'name').pipe((0, template_15.ariaValue)(el, 'label')), (0, template_15.syncAttribute)(host, el, 'value'), (0, core_js_18.focusDelegate)(host, (host.desktopInput = el))) }),
                    (0, tsx_20.dom)(icon_js_7.SearchIcon, null))));
        })
    ], AppbarSearch);
    exports.AppbarSearch = AppbarSearch;
});
define("@cxl/ui/appbar-menu.js", ["require", "exports", "@cxl/tsx", "@cxl/component", "@cxl/template", "@cxl/rx", "@cxl/ui/theme.js", "@cxl/ui/tabs.js", "@cxl/ui/item.js", "@cxl/ui/menu.js"], function (require, exports, tsx_21, component_27, template_16, rx_19, theme_js_23, tabs_js_1, item_js_1, menu_js_1) {
    "use strict";
    var AppbarMenu_1;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppbarItem = exports.AppbarMenu = void 0;
    let AppbarMenu = AppbarMenu_1 = class AppbarMenu extends component_27.Component {
    };
    AppbarMenu = AppbarMenu_1 = __decorate([
        (0, component_27.Augment)('cxl-appbar-menu', (0, theme_js_23.css)({
            $: { display: 'block', flexShrink: 0 },
            tabs: { display: 'none', overflowX: 'hidden' },
            '@medium': {
                tabs: { display: 'block' },
                menu: { display: 'none' },
            },
        }), $ => {
            const elements$ = (0, rx_19.be)(new Set());
            $.bind((0, template_16.registableHost)($, AppbarMenu_1.tagName)
                .raf()
                .tap(els => elements$.next(els)));
            return ((0, tsx_21.dom)(tsx_21.dom, null,
                (0, tsx_21.dom)(tabs_js_1.Tabs, { className: "tabs" },
                    (0, tsx_21.dom)("slot", null)),
                (0, tsx_21.dom)(menu_js_1.MenuToggle, { className: "menu" }, (0, template_16.each)(elements$, item => ((0, tsx_21.dom)(item_js_1.Item, null, item.cloneNode(true)))))));
        })
    ], AppbarMenu);
    exports.AppbarMenu = AppbarMenu;
    let AppbarItem = class AppbarItem extends component_27.Component {
    };
    AppbarItem = __decorate([
        (0, component_27.Augment)('cxl-appbar-item', $ => (0, template_16.registable)($, AppbarMenu.tagName))
    ], AppbarItem);
    exports.AppbarItem = AppbarItem;
});
define("cxl/ui/drag", ["require", "exports", "@cxl/component", "@cxl/tsx", "cxl/drag/index", "@cxl/dom", "@cxl/ui/theme.js"], function (require, exports, component_28, tsx_22, drag_2, dom_20, theme_js_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DropTarget = void 0;
    let DropTarget = class DropTarget extends component_28.Component {
        constructor() {
            super(...arguments);
            this.$items = [];
        }
        get items() {
            return this.$items;
        }
    };
    DropTarget = __decorate([
        (0, component_28.Augment)('cxl-drop-target', (0, theme_js_24.css)({
            $: {
                display: 'block',
            },
            over$dragover: {
                display: 'contents',
            },
            over: { display: 'none' },
            notover$dragover: { display: 'none' },
        }), $ => (0, drag_2.dropTarget)($).tap(ev => {
            if (ev.dataTransfer) {
                const items = ev.dataTransfer.items;
                $.$items = Array.from(items);
                (0, dom_20.trigger)($, 'change');
            }
        }), () => ((0, tsx_22.dom)(tsx_22.dom, null,
            (0, tsx_22.dom)("slot", { className: "over", name: "over" }),
            (0, tsx_22.dom)("slot", { className: "notover", name: "notover" }),
            (0, tsx_22.dom)("slot", null))))
    ], DropTarget);
    exports.DropTarget = DropTarget;
});
define("cxl/ui/carousel", ["require", "exports", "@cxl/component", "@cxl/template", "@cxl/css", "@cxl/dom", "@cxl/tsx", "@cxl/ui/svg.js", "@cxl/rx", "@cxl/ui/button.js", "@cxl/ui/theme.js"], function (require, exports, component_29, template_17, css_13, dom_21, tsx_23, svg_js_2, rx_20, button_js_2, theme_js_25) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CarouselNavigation = exports.CarouselPagination = exports.Carousel = exports.Slide = void 0;
    let Slide = class Slide extends component_29.Component {
    };
    Slide = __decorate([
        (0, component_29.Augment)('cxl-slide', $ => (0, template_17.registable)($, 'cxl.slide'), (0, theme_js_25.css)({
            $: { display: 'block', flexGrow: 1, flexShrink: 0, flexBasis: '100%' },
        }), () => (0, tsx_23.dom)("slot", null))
    ], Slide);
    exports.Slide = Slide;
    const SlideAnimation = {
        default(host, el) {
            el.style.transition = `transform ${host.speed}ms`;
            el.style.transform = `translateX(${host.index * -100}%)`;
        },
        continuous(host, el, prev) {
            const next = host.index;
            if (prev === next)
                return;
            el.style.transition = 'none';
            el.style.transform = 'translateX(0)';
            const len = host.slides.size;
            const slides = Array.from(host.slides);
            for (let i = prev, a = 0; a < len; i = i >= len - 1 ? 0 : i + 1, a++)
                slides[i].style.order = a.toString();
            const offset = next < prev ? len + next - prev : next - prev;
            requestAnimationFrame(() => {
                el.style.transition = `transform ${host.speed}ms`;
                el.style.transform = `translateX(${-100 * offset}%)`;
            });
        },
    };
    let Carousel = class Carousel extends component_29.Component {
        constructor() {
            super(...arguments);
            this.delay = 0;
            this.speed = 500;
            this.type = 'default';
            this.index = 0;
            this.slides = new Set();
        }
    };
    __decorate([
        (0, component_29.Attribute)()
    ], Carousel.prototype, "delay", void 0);
    __decorate([
        (0, component_29.Attribute)()
    ], Carousel.prototype, "speed", void 0);
    __decorate([
        (0, component_29.Attribute)()
    ], Carousel.prototype, "type", void 0);
    __decorate([
        (0, component_29.Attribute)()
    ], Carousel.prototype, "index", void 0);
    Carousel = __decorate([
        (0, component_29.Augment)('cxl-carousel', (0, theme_js_25.css)({
            $: {
                overflowX: 'hidden',
                display: 'block',
                position: 'relative',
            },
            container: {
                display: 'flex',
            },
        }), $ => (0, template_17.registableHost)($, 'cxl.slide', $.slides), $ => (0, component_29.get)($, 'delay').switchMap(delay => delay === 0
            ? rx_20.EMPTY
            : (0, rx_20.interval)(delay).tap(() => ($.index =
                $.index >= $.slides.size - 1 ? 0 : $.index + 1))), $ => {
            let previous = 0;
            return ((0, tsx_23.dom)(tsx_23.dom, null,
                (0, tsx_23.dom)(component_29.Span, { className: "container", "$": el => (0, component_29.get)($, 'index').raf(index => {
                        if (index >= $.slides.size)
                            return ($.index = 0);
                        else if (index < 0)
                            return ($.index = $.slides.size - 1);
                        const fn = SlideAnimation[$.type] ||
                            SlideAnimation.default;
                        fn($, el, previous);
                        previous = index;
                    }) },
                    (0, tsx_23.dom)($.Slot, { selector: "cxl-slide" })),
                (0, tsx_23.dom)("slot", null)));
        })
    ], Carousel);
    exports.Carousel = Carousel;
    let CarouselPagination = class CarouselPagination extends component_29.Component {
    };
    CarouselPagination = __decorate([
        (0, component_29.Augment)('cxl-carousel-pagination', (0, theme_js_25.css)({
            $: {
                display: 'flex',
                columnGap: 8,
                justifyContent: 'center',
                ...(0, css_13.padding)(8),
            },
            circle: {
                display: 'inline-block',
                borderRadius: '100%',
                backgroundColor: 'onSurface12',
                width: 16,
                height: 16,
                cursor: 'pointer',
            },
            active: { backgroundColor: 'primary' },
        }), $ => {
            let parent;
            const slides = (0, rx_20.defer)(() => {
                parent = $.parentElement;
                return (0, rx_20.concat)((0, rx_20.of)((parent === null || parent === void 0 ? void 0 : parent.slides) || []), (0, dom_21.onChildrenMutation)(parent)
                    .raf()
                    .map(() => parent.slides));
            });
            return ((0, tsx_23.dom)($.Shadow, null, (0, template_17.each)(slides, (_, i) => ((0, tsx_23.dom)(component_29.Span, { "$": el => (0, dom_21.onAction)(el).tap(() => (parent.index = i)), tabIndex: 0, className: (0, component_29.get)(parent, 'index').map(index => index === i ? 'circle active' : 'circle') })))));
        })
    ], CarouselPagination);
    exports.CarouselPagination = CarouselPagination;
    let CarouselNavigation = class CarouselNavigation extends component_29.Component {
    };
    CarouselNavigation = __decorate([
        (0, component_29.Augment)('cxl-carousel-navigation', (0, theme_js_25.css)({
            button: {
                position: 'absolute',
                top: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'transparent',
            },
            left: { left: 0 },
            right: { right: 0 },
        }), $ => ((0, tsx_23.dom)(tsx_23.dom, null,
            (0, tsx_23.dom)(button_js_2.Button, { className: "left button", "$": el => (0, dom_21.onAction)(el).tap(() => $.parentElement.index--), flat: true },
                (0, tsx_23.dom)(svg_js_2.Svg, { height: 32, viewBox: "8 8 16 16" },
                    (0, tsx_23.dom)(svg_js_2.Path, { fill: "currentColor", d: "M20.563 9.875l-6.125 6.125 6.125 6.125-1.875 1.875-8-8 8-8z" }))),
            (0, tsx_23.dom)(button_js_2.Button, { className: "right button", "$": el => (0, dom_21.onAction)(el).tap(() => $.parentElement.index++), flat: true },
                (0, tsx_23.dom)(svg_js_2.Svg, { height: 32, viewBox: "8 8 16 16" },
                    (0, tsx_23.dom)(svg_js_2.Path, { fill: "currentColor", d: "M13.313 8l8 8-8 8-1.875-1.875 6.125-6.125-6.125-6.125z" }))))))
    ], CarouselNavigation);
    exports.CarouselNavigation = CarouselNavigation;
});
define("cxl/ui/datepicker", ["require", "exports", "@cxl/ui/input-base.js", "@cxl/component", "@cxl/css", "@cxl/tsx", "@cxl/rx", "@cxl/dom", "@cxl/template", "@cxl/ui/button.js", "@cxl/ui/layout.js", "@cxl/ui/core.js", "@cxl/ui/core.js", "@cxl/ui/form.js", "@cxl/ui/icon.js", "@cxl/ui/theme.js"], function (require, exports, input_base_js_5, component_30, css_14, tsx_24, rx_21, dom_22, template_18, button_js_3, layout_js_1, core_js_19, core_js_20, form_js_2, icon_js_8, theme_js_26) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatepickerInput = exports.DatepickerToggle = exports.Datepicker = exports.CalendarDate = void 0;
    function getDate(val) {
        return (val === null || val === void 0 ? void 0 : val.date) ? val.date.getDate() : '';
    }
    function getDateClass(val) {
        if (!val)
            return 'btn';
        return `btn ${val.isToday ? 'today' : ''} ${val.isOutsideMonth ? 'outside' : ''}`;
    }
    function getMonthDates(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = date.getMonth();
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 1);
        const result = [];
        const today = new Date().setHours(0, 0, 0, 0);
        start.setDate(1 - start.getDay());
        end.setDate(7 - (end.getDay() || 7));
        do {
            const val = new Date(start.getTime());
            const time = val.getTime();
            result.push({
                date: val,
                time,
                isOutsideMonth: val.getMonth() !== month,
                isToday: today === time,
            });
            start.setDate(start.getDate() + 1);
        } while (start <= end);
        return result;
    }
    function getDayText(day, size) {
        const date = new Date();
        const weekday = size === 'xsmall' ? 'narrow' : size === 'small' ? 'short' : 'long';
        date.setDate(date.getDate() - date.getDay() + day);
        return date.toLocaleDateString(navigator.language, { weekday });
    }
    let CalendarDate = class CalendarDate extends core_js_20.ButtonBase {
        constructor() {
            super(...arguments);
            this.selected = false;
            this.flat = true;
        }
    };
    __decorate([
        (0, component_30.StyleAttribute)()
    ], CalendarDate.prototype, "selected", void 0);
    __decorate([
        (0, component_30.Attribute)()
    ], CalendarDate.prototype, "date", void 0);
    CalendarDate = __decorate([
        (0, component_30.Augment)('cxl-calendar-date', (0, theme_js_26.css)({
            $: { textAlign: 'center', cursor: 'pointer' },
            $flat: (0, css_14.padding)(4, 0, 4, 0),
            btn: {
                borderRadius: 40,
                width: 32,
                height: 32,
                lineHeight: 32,
                display: 'inline-block',
                backgroundColor: 'surface',
                color: 'onSurface',
            },
            outside: { color: 'headerText' },
            today: {
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: 'primary',
            },
            btn$selected: {
                backgroundColor: 'primary',
                color: 'onPrimary',
            },
            ...theme_js_26.StateStyles,
        }), $ => ((0, tsx_24.dom)(core_js_19.Span, { className: (0, component_30.get)($, 'date').map(getDateClass) }, (0, component_30.get)($, 'date').map(getDate))))
    ], CalendarDate);
    exports.CalendarDate = CalendarDate;
    function normalizeDate(val) {
        const date = new Date(val);
        return date.setHours(0, 0, 0, 0);
    }
    function onMonthChange($) {
        return (0, component_30.get)($, 'month')
            .map(val => {
            const date = new Date(val);
            date.setDate(1);
            return date.setHours(0, 0, 0, 0);
        })
            .distinctUntilChanged();
    }
    let CalendarMonth = class CalendarMonth extends input_base_js_5.InputBase {
        constructor() {
            super(...arguments);
            this.month = new Date();
        }
        focus() {
            const shadow = this.shadowRoot;
            if (!shadow)
                return;
            const el = shadow.querySelector('[selected]') ||
                shadow.querySelector('cxl-calendar-date');
            if (el)
                el.focus();
        }
    };
    __decorate([
        (0, component_30.Attribute)()
    ], CalendarMonth.prototype, "month", void 0);
    CalendarMonth = __decorate([
        (0, component_30.Augment)('cxl-calendar-month', (0, theme_js_26.css)({
            $: { display: 'block' },
            $disabled: theme_js_26.DisabledStyles,
            day: {
                textAlign: 'center',
                ...(0, css_14.padding)(12, 0, 12, 0),
                color: 'headerText',
                font: 'default',
            },
            grid: {
                columnGap: 0,
                rowGap: 0,
            },
        }), template_18.disabledAttribute, template_18.focusableEvents, $ => {
            const time = (0, component_30.get)($, 'value')
                .filter(val => !!val)
                .map(normalizeDate);
            function onDateClick(el) {
                var _a;
                $.value = ((_a = el.date) === null || _a === void 0 ? void 0 : _a.date) || new Date();
            }
            return ((0, tsx_24.dom)(layout_js_1.Grid, { columns: 7, className: "grid" },
                (0, template_18.each)((0, core_js_19.breakpoint)($).map(size => [0, 1, 2, 3, 4, 5, 6].map(n => getDayText(n, size))), text => ((0, tsx_24.dom)("div", { className: "day" }, text))),
                (0, template_18.each)(onMonthChange($).map(getMonthDates), item => ((0, tsx_24.dom)(CalendarDate, { "$": el => (0, rx_21.merge)((0, dom_22.onAction)(el).tap(() => onDateClick(el)), time.tap(val => { var _a; return (el.selected = ((_a = el.date) === null || _a === void 0 ? void 0 : _a.time) === val); })), date: item })))));
        })
    ], CalendarMonth);
    let CalendarYear = class CalendarYear extends input_base_js_5.InputBase {
        constructor() {
            super(...arguments);
            this['start-year'] = 0;
            this.value = 0;
        }
        focus() {
            const shadow = this.shadowRoot;
            if (!shadow)
                return;
            const el = shadow.querySelector('[primary]') ||
                shadow.querySelector('cxl-button');
            if (el)
                el.focus();
        }
    };
    __decorate([
        (0, component_30.Attribute)()
    ], CalendarYear.prototype, "start-year", void 0);
    CalendarYear = __decorate([
        (0, component_30.Augment)('cxl-calendar-year', (0, theme_js_26.css)({
            $disabled: theme_js_26.DisabledStyles,
            selected: {
                borderColor: 'primary',
                borderWidth: 1,
                borderStyle: 'solid',
                color: 'primary',
            },
        }), $ => {
            const years = (0, rx_21.be)([]);
            $.bind((0, component_30.get)($, 'start-year').tap(startYear => {
                const newYears = [];
                for (let i = startYear; i < startYear + 16; i++)
                    newYears.push(i);
                years.next(newYears);
            }));
            $.bind((0, template_18.disabledAttribute)($));
            $.bind((0, template_18.focusableEvents)($));
            return ((0, tsx_24.dom)(layout_js_1.Grid, { columns: 4 }, (0, template_18.each)(years, year => ((0, tsx_24.dom)(button_js_3.Button, { "$": el => (0, dom_22.onAction)(el).tap(() => ($.value = year)), flat: true, className: (0, component_30.get)($, 'value').map(val => year === val ? 'selected' : '') }, year)))));
        })
    ], CalendarYear);
    function getMonthText(date) {
        return date.toLocaleDateString(navigator.language, {
            year: 'numeric',
            month: 'long',
        });
    }
    function getDateValue(date) {
        if (date && !(date instanceof Date))
            date = new Date(date);
        return date;
    }
    let Datepicker = class Datepicker extends input_base_js_5.InputBase {
        constructor() {
            super(...arguments);
            this.value = undefined;
        }
        focus() {
            var _a, _b;
            (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('.opened')) === null || _b === void 0 ? void 0 : _b.focus();
        }
    };
    Datepicker = __decorate([
        (0, component_30.Augment)('cxl-datepicker', (0, theme_js_26.css)({
            $: { display: 'block', backgroundColor: 'surface', paddingBottom: 8 },
            header: { display: 'flex', ...(0, css_14.padding)(8, 12, 8, 12), height: 52 },
            divider: { flexGrow: 1 },
            closed: { scaleY: 0, transformOrigin: 'top' },
            opened: { scaleY: 1, transformOrigin: 'top' },
            year: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
            rel: { position: 'relative' },
        }), core_js_19.Focusable, host => {
            const showYear = (0, rx_21.be)(false);
            const monthText = (0, rx_21.be)('');
            const value = (0, rx_21.ref)();
            const startYear = (0, rx_21.be)(0);
            const selectedMonth = (0, rx_21.ref)();
            const selectedYear = (0, rx_21.ref)();
            function toggleYear() {
                showYear.next(!showYear.value);
            }
            function nextMonth() {
                if (showYear.value)
                    startYear.next(startYear.value + 16);
                else {
                    const date = new Date(selectedMonth.value);
                    date.setMonth(date.getMonth() + 1);
                    selectedMonth.next(date);
                }
            }
            function previousMonth() {
                if (showYear.value)
                    startYear.next(startYear.value - 16);
                else {
                    const date = new Date(selectedMonth.value);
                    date.setMonth(date.getMonth() - 1);
                    selectedMonth.next(date);
                }
            }
            function setYear(year) {
                const date = new Date(selectedMonth.value);
                date.setFullYear(year);
                selectedMonth.next(date);
                showYear.next(false);
            }
            host.bind(selectedMonth.tap(val => {
                const year = val.getFullYear();
                monthText.next(getMonthText(val));
                startYear.next(year - (year % 16));
                selectedYear.next(val.getFullYear());
            }));
            host.bind((0, component_30.get)(host, 'value').tap(val => {
                if (val) {
                    val = getDateValue(val);
                    if (val !== host.value)
                        return (host.value = val);
                    host.invalid = isNaN(val.getTime());
                    if (host.invalid)
                        return;
                    value.next(val);
                    selectedMonth.next(val);
                    selectedYear.next(val.getFullYear());
                }
                else {
                    selectedMonth.next(new Date());
                    if (val !== undefined)
                        host.value = undefined;
                }
            }));
            return ((0, tsx_24.dom)(tsx_24.dom, null,
                (0, tsx_24.dom)("div", { className: "header" },
                    (0, tsx_24.dom)(button_js_3.Button, { title: showYear.map(v => `${v ? 'Close' : 'Open'} Year Panel`), "$": el => (0, dom_22.onAction)(el).tap(toggleYear), flat: true },
                        monthText,
                        (0, tsx_24.dom)(core_js_20.Svg, { viewBox: "0 0 24 24", width: 20 },
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M7 10l5 5 5-5z" }))),
                    (0, tsx_24.dom)("span", { className: "divider" }),
                    (0, tsx_24.dom)(icon_js_8.IconButton, { title: showYear.map(v => `Previous ${v ? 'Year Page' : 'Month'}`), "$": (0, template_18.$onAction)(previousMonth) },
                        (0, tsx_24.dom)(core_js_20.Svg, { viewBox: "0 0 24 24", width: 20 },
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" }))),
                    (0, tsx_24.dom)(icon_js_8.IconButton, { title: showYear.map(v => `Next ${v ? 'Year Page' : 'Month'}`), "$": (0, template_18.$onAction)(nextMonth) },
                        (0, tsx_24.dom)(core_js_20.Svg, { viewBox: "0 0 24 24", width: 20 },
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                            (0, tsx_24.dom)(core_js_20.Path, { d: "M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" })))),
                (0, tsx_24.dom)("div", { className: "rel" },
                    (0, tsx_24.dom)(CalendarMonth, { "$": el => (0, template_18.onValue)(el).tap(val => (host.value = val)), className: showYear.map(v => v ? 'closed' : ' opened'), month: selectedMonth, value: value }),
                    (0, tsx_24.dom)(CalendarYear, { "$": el => (0, template_18.onValue)(el).tap(setYear), "start-year": startYear, value: selectedYear, className: showYear.map(v => v ? 'year opened' : 'year closed') }))));
        })
    ], Datepicker);
    exports.Datepicker = Datepicker;
    let DatepickerToggle = class DatepickerToggle extends input_base_js_5.InputBase {
        constructor() {
            super(...arguments);
            this.opened = false;
        }
    };
    __decorate([
        (0, component_30.StyleAttribute)()
    ], DatepickerToggle.prototype, "opened", void 0);
    DatepickerToggle = __decorate([
        (0, component_30.Augment)('cxl-datepicker-toggle', (0, theme_js_26.css)({
            trigger: {
                backgroundColor: 'transparent',
            },
            calendar: {
                position: 'absolute',
                left: -12,
                right: -12,
                top: 26,
                display: 'none',
                elevation: 1,
            },
            calendar$opened: {
                display: 'block',
            },
        }), core_js_19.Focusable, $ => ((0, tsx_24.dom)(tsx_24.dom, null,
            (0, tsx_24.dom)(icon_js_8.IconButton, { "$": el => (0, dom_22.onAction)(el).tap(() => ($.opened = !$.opened)), title: (0, component_30.get)($, 'opened').map(v => `${v ? 'Open' : 'Close'} Datepicker`), className: "trigger" },
                (0, tsx_24.dom)(core_js_20.Svg, { viewBox: "0 0 24 24", width: 20 },
                    (0, tsx_24.dom)(core_js_20.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                    (0, tsx_24.dom)(core_js_20.Path, { d: "M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z" }))),
            (0, tsx_24.dom)(Datepicker, { className: "calendar", value: (0, component_30.get)($, 'value'), "$": el => (0, rx_21.merge)((0, template_18.onValue)(el).tap(val => {
                    $.value = val;
                    $.opened = false;
                }), (0, component_30.get)($, 'opened').tap(opened => opened && el.focus()), (0, dom_22.onKeypress)($, 'escape').tap(() => ($.opened = false))) }))))
    ], DatepickerToggle);
    exports.DatepickerToggle = DatepickerToggle;
    let DatepickerInput = class DatepickerInput extends input_base_js_5.InputBase {
    };
    DatepickerInput = __decorate([
        (0, component_30.Augment)('cxl-datepicker-input', (0, theme_js_26.css)({
            $: { display: 'flex', flexGrow: 1 },
            input: {
                color: 'onSurface',
                font: 'default',
                minHeight: 20,
                outline: 0,
                flexGrow: 1,
            },
            toggle: {
                marginTop: -16,
                marginRight: -4,
            },
            ...theme_js_26.StateStyles,
        }), host => ((0, tsx_24.dom)(core_js_19.Span, { className: "input", "$": el => (0, rx_21.merge)((0, form_js_2.focusProxy)(el, host), (0, component_30.get)(host, 'value').tap(val => {
                if (val) {
                    val = getDateValue(val);
                    if (isNaN(val.getTime()))
                        return (host.invalid = true);
                    const textContent = val.toLocaleDateString();
                    if (el.textContent !== textContent)
                        el.textContent = textContent;
                }
                else
                    el.textContent = '';
            }), (0, component_30.get)(host, 'disabled').raf(val => (el.contentEditable = val ? 'false' : 'true')), (0, dom_22.on)(el, 'blur').tap(() => {
                const text = el.textContent;
                const date = text ? new Date(text) : undefined;
                host.value = date;
            }), (0, dom_22.onKeypress)(el, 'enter').tap(ev => ev.preventDefault())) })), $ => ((0, tsx_24.dom)(DatepickerToggle, { className: "toggle", value: (0, component_30.get)($, 'value'), "$": el => (0, template_18.onValue)(el).tap(val => ($.value = val)) })))
    ], DatepickerInput);
    exports.DatepickerInput = DatepickerInput;
});
define("cxl/ui/table", ["require", "exports", "@cxl/css", "@cxl/template", "@cxl/component", "@cxl/tsx", "@cxl/rx", "@cxl/dom", "@cxl/ui/theme.js", "@cxl/ui/icon.js", "@cxl/ui/core.js", "@cxl/ui/checkbox.js", "@cxl/ui/select.js", "@cxl/ui/field.js"], function (require, exports, css_15, template_19, component_31, tsx_25, rx_22, dom_23, theme_js_27, icon_js_9, core_js_21, checkbox_js_1, select_js_3, field_js_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DatasetSource = exports.TableSource = exports.DataTable = exports.Dataset = exports.TablePagination = exports.getPageCount = exports.TableSelectedCount = exports.TableToolbar = exports.TableBody = exports.TrSelectable = exports.Tr = exports.TableSelectAll = exports.Td = exports.Table = exports.Th = exports.SortIcon = exports.datasetRegistable = void 0;
    function datasetRegistable(host, controller) {
        return (0, template_19.registable)(host, 'dataset', controller);
    }
    exports.datasetRegistable = datasetRegistable;
    function textSort(a, b, dir = 1) {
        return String(a).localeCompare(b) * dir;
    }
    function numericSort(a, b, dir = 1) {
        return a === b ? 0 : a > b ? dir : -dir;
    }
    function datasetSortable($) {
        return datasetRegistable($, (ev) => {
            if (ev.type === 'update') {
                if (ev.value &&
                    ev.value.detail === 'sortable' &&
                    ev.value.target !== $ &&
                    $.sort !== 'none')
                    $.sort = 'none';
                else if ($.sort !== 'none')
                    ev.state.sort = { field: $.field, sort: $.sort };
            }
            else if (ev.type === 'sort' && $.sort !== 'none') {
                const field = $.field;
                const dir = $.sort === 'asc' ? 1 : -1;
                const algo = ($.sortable === 'numeric'
                    ? numericSort
                    : textSort);
                ev.value = ev.value.sort(field
                    ? (a, b) => algo(a[field], b[field], dir)
                    : (a, b) => algo(a, b, dir));
            }
        });
    }
    function onHeaderAction(el) {
        return (0, component_31.get)(el, 'sortable').switchMap(isSortable => isSortable
            ? (0, rx_22.merge)(datasetSortable(el), (0, dom_23.onAction)(el).tap(() => {
                const sort = el.sort;
                el.sort =
                    sort === 'asc'
                        ? 'desc'
                        : sort === 'desc'
                            ? 'none'
                            : 'asc';
            }))
            : rx_22.EMPTY);
    }
    function onSort(el, host) {
        let lastClass;
        return (0, component_31.get)(host, 'sort').tap(sortOrder => {
            if (lastClass)
                el.classList.remove(lastClass);
            lastClass = sortOrder;
            el.classList.add(sortOrder);
            if (!host.field)
                return;
            (0, dom_23.trigger)(host, 'dataset.update', host.sort === 'none' ? 'sortable.reset' : 'sortable');
        });
    }
    let SortIcon = class SortIcon extends component_31.Component {
    };
    SortIcon = __decorate([
        (0, component_31.Augment)()
    ], SortIcon);
    exports.SortIcon = SortIcon;
    let Th = class Th extends component_31.Component {
        constructor() {
            super(...arguments);
            this.sortable = false;
            this.sort = 'none';
        }
    };
    __decorate([
        (0, component_31.Attribute)()
    ], Th.prototype, "width", void 0);
    __decorate([
        (0, component_31.StyleAttribute)()
    ], Th.prototype, "sortable", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], Th.prototype, "sort", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], Th.prototype, "field", void 0);
    Th = __decorate([
        (0, component_31.Augment)('cxl-th', (0, template_19.role)('columnheader'), onHeaderAction, (0, theme_js_27.css)({
            $: {
                display: 'table-cell',
                font: 'subtitle2',
                color: 'headerText',
                ...(0, css_15.padding)(16),
                ...(0, css_15.border)(0, 0, 1, 0),
                lineHeight: 24,
                borderStyle: 'solid',
                borderColor: 'divider',
                whiteSpace: 'nowrap',
            },
            sortIcon: {
                display: 'none',
                marginLeft: 8,
                scaleY: 0,
                scaleX: 0,
                transformOrigin: 'center',
                verticalAlign: 'middle',
            },
            $sortable: { cursor: 'pointer' },
            $sortable$hover: { color: 'onSurface' },
            sortIcon$sortable: { display: 'inline-block' },
            none$sortable$hover: { scaleX: 1, scaleY: 1, opacity: 0.3 },
            asc: { rotate: 0, scaleX: 1, scaleY: 1 },
            desc: {
                rotate: 180,
                scaleX: 1,
                scaleY: 1,
            },
        }), $ => ((0, tsx_25.dom)(tsx_25.dom, null,
            (0, tsx_25.dom)("slot", null),
            (0, tsx_25.dom)(component_31.Span, { className: "sortIcon", "$": el => onSort(el, $) },
                (0, tsx_25.dom)(core_js_21.Svg, { viewBox: "0 0 24 24", width: 24 },
                    (0, tsx_25.dom)(core_js_21.Path, { d: "M0 0h24v24H0V0z", fill: "none" }),
                    (0, tsx_25.dom)(core_js_21.Path, { d: "M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" }))))))
    ], Th);
    exports.Th = Th;
    let Table = class Table extends component_31.Component {
    };
    Table = __decorate([
        (0, component_31.Augment)('cxl-table', (0, template_19.role)('table'), (0, theme_js_27.css)({
            $: {
                display: 'table',
                width: '100%',
                font: 'body2',
                overflowX: 'auto',
                ...(0, css_15.border)(1, 1, 0, 1),
                borderStyle: 'solid',
                borderColor: 'divider',
                borderRadius: 4,
            },
            '@small': { $: { display: 'table' } },
        }), _ => (0, tsx_25.dom)("slot", null))
    ], Table);
    exports.Table = Table;
    let Cell = class Cell extends component_31.Component {
        constructor() {
            super(...arguments);
            this.right = false;
        }
    };
    __decorate([
        (0, component_31.StyleAttribute)()
    ], Cell.prototype, "right", void 0);
    Cell = __decorate([
        (0, component_31.Augment)((0, template_19.role)('cell'), (0, theme_js_27.css)({
            $: {
                display: 'table-cell',
                ...(0, css_15.padding)(16),
                lineHeight: 20,
                flexGrow: 1,
                ...(0, css_15.border)(0, 0, 1, 0),
                borderStyle: 'solid',
                borderColor: 'divider',
            },
            $right: { textAlign: 'right' },
            $primary: { backgroundColor: 'primary', color: 'onPrimary' },
            $secondary: { backgroundColor: 'secondary', color: 'onSecondary' },
        }))
    ], Cell);
    let Td = class Td extends Cell {
    };
    Td = __decorate([
        (0, component_31.Augment)('cxl-td', () => (0, tsx_25.dom)("slot", null))
    ], Td);
    exports.Td = Td;
    let TableSelectAll = class TableSelectAll extends checkbox_js_1.Checkbox {
    };
    TableSelectAll = __decorate([
        (0, component_31.Augment)('cxl-table-select-all', (0, template_19.aria)('label', 'Select All'), $ => datasetRegistable($, ev => {
            if (ev.type === 'select' && ev.value === 'select') {
                const dataset = ev.target;
                let count = 0;
                dataset.selectable.forEach((r) => r.selected && count++);
                $.indeterminate =
                    count > 0 && count !== dataset.selectable.size;
                if (!$.indeterminate)
                    $.checked = count > 0;
            }
        }), $ => (0, dom_23.on)($, 'change').tap(() => {
            if ($.value !== undefined)
                (0, dom_23.trigger)($, 'dataset.select', $.checked ? 'select.all' : 'select.none');
        }))
    ], TableSelectAll);
    exports.TableSelectAll = TableSelectAll;
    let Tr = class Tr extends component_31.Component {
    };
    __decorate([
        (0, component_31.Attribute)()
    ], Tr.prototype, "value", void 0);
    Tr = __decorate([
        (0, component_31.Augment)('cxl-tr', (0, template_19.role)('row'), (0, theme_js_27.css)({
            $: { display: 'table-row' },
        }), $ => (0, component_31.attributeChanged)($, 'value').pipe((0, template_19.triggerEvent)($, 'change')), _ => (0, tsx_25.dom)("slot", null))
    ], Tr);
    exports.Tr = Tr;
    let TrSelectable = class TrSelectable extends component_31.Component {
        constructor() {
            super(...arguments);
            this.selected = false;
        }
    };
    __decorate([
        (0, component_31.StyleAttribute)()
    ], TrSelectable.prototype, "selected", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], TrSelectable.prototype, "value", void 0);
    TrSelectable = __decorate([
        (0, component_31.Augment)('cxl-tr-selectable', (0, template_19.role)('row'), (0, theme_js_27.css)({
            $: { display: 'table-row' },
            $selected: { backgroundColor: 'primaryLight' },
            $hover: { backgroundColor: 'onSurface8' },
            $selected$hover: { backgroundColor: 'primaryLight' },
            cell: { width: 48, lineHeight: 0, verticalAlign: 'bottom' },
        }), $ => (0, template_19.selectable)($), $ => (0, component_31.attributeChanged)($, 'value').pipe((0, template_19.triggerEvent)($, 'change')), $ => datasetRegistable($, ev => {
            if (ev.type === 'update')
                $.selected = ev.target.selected.has($.value);
            else if (ev.type === 'select') {
                if (ev.value === 'select.all')
                    $.selected = true;
                else if (ev.value === 'select.none')
                    $.selected = false;
            }
        }), $ => {
            if ($.selected)
                (0, dom_23.trigger)($, 'dataset.select', 'select');
            return (0, component_31.attributeChanged)($, 'selected').tap(() => (0, dom_23.trigger)($, 'dataset.select', 'select'));
        }, $ => ((0, tsx_25.dom)(tsx_25.dom, null,
            (0, tsx_25.dom)(Td, { "$": el => (0, dom_23.on)(el, 'click').tap(() => ($.selected = !$.selected)), className: "cell" },
                (0, tsx_25.dom)(checkbox_js_1.Checkbox, { "$": el => (0, rx_22.merge)((0, dom_23.on)(el, 'change').tap(() => ($.selected = el.checked)), (0, dom_23.on)(el, 'click').tap(ev => ev.stopPropagation())), ariaLabel: "Select Row", checked: (0, component_31.get)($, 'selected') })),
            (0, tsx_25.dom)("slot", null))))
    ], TrSelectable);
    exports.TrSelectable = TrSelectable;
    let TableBody = class TableBody extends component_31.Component {
    };
    TableBody = __decorate([
        (0, component_31.Augment)('cxl-tbody', (0, template_19.role)('rowgroup'), (0, theme_js_27.css)({
            $: { display: 'table-row-group' },
        }), () => (0, tsx_25.dom)("slot", null))
    ], TableBody);
    exports.TableBody = TableBody;
    let TableToolbar = class TableToolbar extends core_js_21.Toolbar {
    };
    TableToolbar = __decorate([
        (0, component_31.Augment)('cxl-table-toolbar', (0, theme_js_27.css)({
            $: {
                ...(0, css_15.border)(1, 1, 0, 1),
                ...(0, css_15.padding)(6, 16, 6, 16),
                lineHeight: 44,
                borderStyle: 'solid',
                borderColor: 'divider',
            },
        }), _ => (0, tsx_25.dom)("slot", null))
    ], TableToolbar);
    exports.TableToolbar = TableToolbar;
    let TableSelectedCount = class TableSelectedCount extends component_31.Component {
    };
    __decorate([
        (0, component_31.Attribute)()
    ], TableSelectedCount.prototype, "selected", void 0);
    TableSelectedCount = __decorate([
        (0, component_31.Augment)((0, theme_js_27.css)({
            $: {
                font: 'subtitle',
                lineHeight: 36,
                height: 68,
                backgroundColor: 'primaryLight',
                color: 'onPrimaryLight',
                display: 'flex',
            },
        }), host => ((0, tsx_25.dom)(core_js_21.T, null, (0, component_31.get)(host, 'selected').tap(selected => (selected === null || selected === void 0 ? void 0 : selected.length) || 0))))
    ], TableSelectedCount);
    exports.TableSelectedCount = TableSelectedCount;
    function getPageCount(total, rows) {
        if (total === 0 || rows === 0)
            return 0;
        return Math.floor(total / rows) + (total % rows === 0 ? -1 : 0);
    }
    exports.getPageCount = getPageCount;
    let TablePagination = class TablePagination extends component_31.Component {
        constructor() {
            super(...arguments);
            this.rows = 5;
            this.options = [5, 10, 25, 50];
            this.page = 0;
            this.total = 0;
        }
        goFirst() {
            this.page = 0;
        }
        goNext() {
            this.page += 1;
        }
        goPrevious() {
            this.page -= 1;
        }
        goLast() {
            this.page = getPageCount(this.total, this.rows);
        }
    };
    __decorate([
        (0, component_31.Attribute)()
    ], TablePagination.prototype, "rows", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], TablePagination.prototype, "options", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], TablePagination.prototype, "page", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], TablePagination.prototype, "total", void 0);
    TablePagination = __decorate([
        (0, component_31.Augment)('cxl-table-pagination', (0, theme_js_27.css)({
            $: {
                display: 'block',
                font: 'body2',
                textAlign: 'center',
                ...(0, css_15.border)(0, 1, 1, 1),
                ...(0, css_15.padding)(6, 16, 6, 16),
                lineHeight: 44,
                borderStyle: 'solid',
                borderColor: 'divider',
            },
            rows: {
                display: 'inline-block',
                ...(0, css_15.margin)(0, 24, 0, 16),
                width: 64,
                verticalAlign: 'middle',
            },
            '@small': {
                $: {
                    textAlign: 'right',
                },
                nav: {
                    display: 'inline-block',
                    marginLeft: 32,
                },
            },
        }), $ => datasetRegistable($, action => {
            if (action.type === 'update') {
                action.state.slice = { page: $.page, rows: $.rows };
            }
            else if (action.type === 'slice') {
                const data = action.value;
                const start = $.page * $.rows;
                $.total = data.length;
                action.value = data.slice(start, start + $.rows);
            }
        }), $ => (0, component_31.get)($, 'page').tap(val => {
            const max = getPageCount($.total, $.rows);
            if (val < 0)
                $.page = 0;
            else if (val > max)
                $.page = max;
        }), $ => (0, rx_22.merge)((0, component_31.get)($, 'page'), (0, component_31.get)($, 'rows')).tap(() => (0, dom_23.trigger)($, 'dataset.update')), $ => ((0, tsx_25.dom)($.Shadow, null,
            "Rows per page:",
            (0, tsx_25.dom)(field_js_4.Field, { className: "rows", outline: true, dense: true },
                (0, tsx_25.dom)(select_js_3.SelectBox, { "$": el => (0, dom_23.on)(el, 'change').tap(() => ($.rows = el.value)), ariaLabel: "Rows per Page", value: (0, component_31.get)($, 'rows') }, (0, template_19.each)((0, component_31.get)($, 'options'), op => ((0, tsx_25.dom)(select_js_3.Option, { value: op }, op.toString()))))),
            (0, rx_22.merge)((0, component_31.get)($, 'page'), (0, component_31.get)($, 'rows'), (0, component_31.get)($, 'total')).map(() => {
                const start = $.page * $.rows;
                const end = start + $.rows;
                return `${start + 1}-${end > $.total ? $.total : end} of ${$.total}`;
            }),
            (0, tsx_25.dom)("nav", { className: "nav" },
                (0, tsx_25.dom)(icon_js_9.IconButton, { "$": el => (0, dom_23.onAction)(el).tap(() => $.goFirst()) },
                    (0, tsx_25.dom)(core_js_21.Svg, { viewBox: "0 0 24 24", width: 20 },
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M18.41 16.59L13.82 12l4.59-4.59L17 6l-6 6 6 6zM6 6h2v12H6z" }),
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M24 24H0V0h24v24z", fill: "none" }))),
                (0, tsx_25.dom)(icon_js_9.IconButton, { "$": el => (0, dom_23.onAction)(el).tap(() => $.goPrevious()) },
                    (0, tsx_25.dom)(core_js_21.Svg, { viewBox: "0 0 24 24", width: 20 },
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" }))),
                (0, tsx_25.dom)(icon_js_9.IconButton, { "$": el => (0, dom_23.onAction)(el).tap(() => $.goNext()) },
                    (0, tsx_25.dom)(core_js_21.Svg, { viewBox: "0 0 24 24", width: 20 },
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M0 0h24v24H0z", fill: "none" }),
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" }))),
                (0, tsx_25.dom)(icon_js_9.IconButton, { "$": el => (0, dom_23.onAction)(el).tap(() => $.goLast()) },
                    (0, tsx_25.dom)(core_js_21.Svg, { viewBox: "0 0 24 24", width: 20 },
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M0 0h24v24H0V0z", fill: "none" }),
                        (0, tsx_25.dom)(core_js_21.Path, { d: "M5.59 7.41L10.18 12l-4.59 4.59L7 18l6-6-6-6zM16 6h2v12h-2z" })))))))
    ], TablePagination);
    exports.TablePagination = TablePagination;
    let Dataset = class Dataset extends component_31.Component {
        constructor() {
            super(...arguments);
            this.source = [];
            this.value = [];
            this.selectable = new Set();
            this.selected = new Set();
        }
    };
    __decorate([
        (0, component_31.Attribute)()
    ], Dataset.prototype, "source", void 0);
    __decorate([
        (0, component_31.Attribute)()
    ], Dataset.prototype, "value", void 0);
    Dataset = __decorate([
        (0, component_31.Augment)('cxl-dataset', $ => {
            const elements = new Set();
            let state = {};
            function dispatch(action) {
                elements.forEach(e => e(action));
                return action.value;
            }
            function onAction(ev) {
                const value = ev;
                const newState = {};
                dispatch({ type: 'update', value, target: $, state: newState });
                state = newState;
            }
            function update() {
                if ($.update)
                    return $.update(state);
                const value = $.source.slice(0);
                const action = {
                    type: 'filter',
                    target: $,
                    value,
                    state,
                };
                elements.forEach(e => e(action));
                action.type = 'sort';
                elements.forEach(e => e(action));
                action.type = 'slice';
                elements.forEach(e => e(action));
                action.type = 'render';
                elements.forEach(e => e(action));
                $.value = action.value;
            }
            return (0, rx_22.merge)((0, template_19.stopChildrenEvents)($, 'change'), (0, rx_22.merge)((0, component_31.get)($, 'source'), (0, dom_23.on)($, 'dataset.update').tap(onAction)).raf(update), (0, template_19.registableHost)($, 'selectable', $.selectable), (0, template_19.registableHost)($, 'dataset', elements).raf(() => onAction()), (0, dom_23.on)($, 'dataset.select')
                .tap(ev => {
                const el = ev.target;
                $.selected[el.selected ? 'add' : 'delete'](el.value);
            })
                .raf(ev => dispatch({ type: 'select', value: ev.detail, target: $, state })), (0, component_31.attributeChanged)($, 'value').pipe((0, template_19.triggerEvent)($, 'change')));
        })
    ], Dataset);
    exports.Dataset = Dataset;
    let DataTable = class DataTable extends Dataset {
    };
    DataTable = __decorate([
        (0, component_31.Augment)('cxl-datatable', _ => ((0, tsx_25.dom)(tsx_25.dom, null,
            (0, tsx_25.dom)("slot", { name: "header" }),
            (0, tsx_25.dom)(Table, null,
                (0, tsx_25.dom)("slot", null)),
            (0, tsx_25.dom)("slot", { name: "footer" }))))
    ], DataTable);
    exports.DataTable = DataTable;
    let TableSource = class TableSource extends component_31.Component {
    };
    TableSource = __decorate([
        (0, component_31.Augment)('cxl-table-source', (0, template_19.role)('rowgroup'), (0, theme_js_27.css)({
            $: { display: 'table-row-group' },
        }), $ => {
            function createSlots(len) {
                var _a;
                const slots = $.shadowRoot.querySelectorAll('slot');
                let slotCount = slots.length;
                if (slotCount > len)
                    while (slotCount-- > len)
                        slots[slotCount].remove();
                else if (slotCount < len)
                    while (slotCount < len) {
                        const el = (0, tsx_25.dom)("slot", { name: `row${slotCount++}` });
                        (_a = $.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(el);
                    }
            }
            return (0, rx_22.merge)(datasetRegistable($, action => {
                var _a;
                if (action.type === 'update' &&
                    ((_a = action.value) === null || _a === void 0 ? void 0 : _a.detail) === 'table-source.update') {
                    const source = [];
                    for (const child of $.children)
                        if (child.value !== undefined)
                            source.push(child.value);
                    action.target.source = source;
                }
                else if (action.type === 'render') {
                    createSlots(action.value.length);
                    for (const child of $.children) {
                        const index = action.value.indexOf(child.value);
                        child.slot = index === -1 ? '' : `row${index}`;
                    }
                }
            }), (0, dom_23.onChildrenMutation)($).tap(() => {
                (0, dom_23.trigger)($, 'dataset.update', 'table-source.update');
            }), (0, rx_22.observable)(() => (0, dom_23.trigger)($, 'dataset.update', 'table-source.update')));
        })
    ], TableSource);
    exports.TableSource = TableSource;
    let DatasetSource = class DatasetSource extends component_31.Component {
    };
    __decorate([
        (0, component_31.Attribute)()
    ], DatasetSource.prototype, "src", void 0);
    DatasetSource = __decorate([
        (0, component_31.Augment)('cxl-dataset-source', $ => {
            let data;
            return (0, rx_22.merge)(datasetRegistable($, action => {
                var _a;
                if (action.type === 'update' &&
                    ((_a = action.value) === null || _a === void 0 ? void 0 : _a.detail) === 'dataset-source.update') {
                    action.target.source = data;
                }
            }), (0, component_31.get)($, 'src').switchMap(src => (0, rx_22.defer)(() => src ? (0, rx_22.from)(fetch(src).then(res => res.json())) : rx_22.EMPTY).tap(newData => {
                data = newData;
                (0, dom_23.trigger)($, 'dataset.update', 'dataset-source.update');
            })));
        })
    ], DatasetSource);
    exports.DatasetSource = DatasetSource;
});
define("cxl/ui/user", ["require", "exports", "@cxl/component", "@cxl/ui/core.js", "@cxl/ui/avatar.js", "@cxl/ui/theme.js", "@cxl/tsx"], function (require, exports, component_32, core_js_22, avatar_js_1, theme_js_28, tsx_26) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.UserNavbar = exports.UserVerified = void 0;
    let UserVerified = class UserVerified extends component_32.Component {
        constructor() {
            super(...arguments);
            this.verified = false;
        }
    };
    __decorate([
        (0, component_32.Attribute)()
    ], UserVerified.prototype, "verified", void 0);
    UserVerified = __decorate([
        (0, component_32.Augment)('cxl-user-verified', host => {
            const isVerified = (0, component_32.get)(host, 'verified');
            return ((0, tsx_26.dom)(core_js_22.T, { caption: true, inline: true, className: isVerified.map(val => (val ? 'verified' : '')) }, isVerified.map(val => val ? '\u2713 Verified' : '\u274c Not Verified')));
        }, (0, theme_js_28.css)({
            $: { color: 'error', textAlign: 'right' },
            icon: { marginRight: 8 },
            verified: { color: 'primary' },
        }))
    ], UserVerified);
    exports.UserVerified = UserVerified;
    let UserNavbar = class UserNavbar extends component_32.Component {
        constructor() {
            super(...arguments);
            this.accounthref = '';
        }
    };
    __decorate([
        (0, component_32.Attribute)()
    ], UserNavbar.prototype, "accounthref", void 0);
    __decorate([
        (0, component_32.Attribute)()
    ], UserNavbar.prototype, "user", void 0);
    UserNavbar = __decorate([
        (0, component_32.Augment)('cxl-user-navbar', $ => ((0, tsx_26.dom)(tsx_26.dom, null,
            (0, tsx_26.dom)(avatar_js_1.Avatar, { src: (0, component_32.get)($, 'user').map(u => (u === null || u === void 0 ? void 0 : u.photoUrl) || '') }),
            () => {
                const el = ((0, tsx_26.dom)("a", { className: "name" },
                    (0, tsx_26.expression)($, (0, component_32.get)($, 'user').map(u => u === null || u === void 0 ? void 0 : u.displayName)),
                    (0, tsx_26.dom)(UserVerified, { className: "verified", verified: (0, component_32.get)($, 'user').map(u => (u === null || u === void 0 ? void 0 : u.isVerified) || false) })));
                $.bind((0, component_32.get)($, 'accounthref').tap(val => (el.href = val)));
                return el;
            },
            (0, tsx_26.dom)(core_js_22.T, { className: "email" }, (0, component_32.get)($, 'user').map(u => u === null || u === void 0 ? void 0 : u.email)))), (0, theme_js_28.css)({
            $: {
                display: 'block',
            },
            name: {
                display: 'block',
                marginTop: 16,
                textDecoration: 'none',
                color: 'onSurface',
            },
            verified: { marginLeft: 8 },
            email: { font: 'subtitle2', marginTop: 8, marginBottom: 8 },
        }))
    ], UserNavbar);
    exports.UserNavbar = UserNavbar;
});
define("@cxl/ui/progress.js", ["require", "exports", "@cxl/rx", "@cxl/component", "@cxl/tsx", "@cxl/dom", "@cxl/template", "@cxl/ui/theme.js"], function (require, exports, rx_23, component_33, tsx_27, dom_24, template_20, theme_js_29) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Progress = void 0;
    let Progress = class Progress extends component_33.Component {
        constructor() {
            super(...arguments);
            this.value = Infinity;
        }
    };
    __decorate([
        (0, component_33.Attribute)()
    ], Progress.prototype, "value", void 0);
    Progress = __decorate([
        (0, component_33.Augment)('cxl-progress', (0, theme_js_29.css)({
            $: { backgroundColor: 'primary', backgroundImage: '', height: 4 },
            indicator: {
                display: 'block',
                backgroundColor: 'primary',
                height: 4,
                transformOrigin: 'left',
            },
            indeterminate: { animation: 'wait' },
        }), host => ((0, tsx_27.dom)(component_33.Span, { className: "indicator", "$": el => (0, component_33.get)(host, 'value').pipe((0, rx_23.tap)(val => {
                el.classList.toggle('indeterminate', val === Infinity);
                if (val !== Infinity)
                    el.style.transform = 'scaleX(' + val + ')';
                (0, dom_24.trigger)(host, 'change');
            })) })), (0, template_20.role)('progressbar'))
    ], Progress);
    exports.Progress = Progress;
});
define("cxl/ui/animate", ["require", "exports", "@cxl/component", "@cxl/ui/theme.js", "@cxl/dom", "@cxl/rx"], function (require, exports, component_34, theme_js_30, dom_25, rx_24) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.count = exports.Animate = void 0;
    let Animate = class Animate extends component_34.Component {
    };
    __decorate([
        (0, component_34.StyleAttribute)()
    ], Animate.prototype, "name", void 0);
    __decorate([
        (0, component_34.Attribute)()
    ], Animate.prototype, "delay", void 0);
    __decorate([
        (0, component_34.Attribute)()
    ], Animate.prototype, "trigger", void 0);
    Animate = __decorate([
        (0, component_34.Augment)('cxl-animate', (0, theme_js_30.css)({
            $: { display: 'inline-block' },
            ...Object.keys(theme_js_30.theme.animation).reduce((res, key) => {
                res[`$name="${key}"`] = { animation: key };
                return res;
            }, {}),
        }), component_34.Slot, $ => (0, rx_24.merge)((0, component_34.get)($, 'delay').raf(val => {
            $.style.animationDelay =
                val === undefined ? '' : `${val.toString()}ms`;
        }), (0, component_34.get)($, 'trigger')
            .raf()
            .switchMap(trigger => {
            if (trigger === 'visible') {
                $.style.animationPlayState = 'paused';
                return (0, dom_25.isVisible)($).raf(visible => ($.style.animationPlayState = visible
                    ? 'running'
                    : 'paused'));
            }
            else {
                $.style.animationPlayState = 'running';
                return rx_24.EMPTY;
            }
        })))
    ], Animate);
    exports.Animate = Animate;
    function count({ step, start, end, time }) {
        if (start === undefined)
            start = 0;
        if (time === undefined)
            time = 1000;
        if (step === undefined)
            step = 1;
        const count = (end - start) / step;
        const dt = time / count;
        return (0, rx_24.concat)((0, rx_24.interval)(dt)
            .take(count - 1)
            .map(() => (start += step)), (0, rx_24.of)(end));
    }
    exports.count = count;
});
define("@cxl/ui", ["require", "exports", "@cxl/ui/appbar.js", "@cxl/ui/autocomplete.js", "@cxl/ui/badge.js", "@cxl/ui/button.js", "@cxl/ui/checkbox.js", "@cxl/ui/core.js", "@cxl/ui/spinner.js", "@cxl/ui/field.js", "@cxl/ui/theme.js", "@cxl/ui/menu.js", "cxl/ui/fab", "@cxl/ui/chip.js", "@cxl/ui/dialog.js", "@cxl/ui/input-base.js", "@cxl/ui/form.js", "@cxl/ui/layout.js", "@cxl/ui/item.js", "@cxl/ui/tabs.js", "@cxl/ui/navigation.js", "@cxl/ui/avatar.js", "cxl/ui/multiselect", "@cxl/ui/select.js", "@cxl/ui/icon.js", "@cxl/ui/appbar-search.js", "@cxl/ui/appbar-menu.js", "cxl/ui/drag", "cxl/ui/carousel", "cxl/ui/datepicker", "cxl/ui/table", "cxl/ui/user", "@cxl/ui/progress.js", "cxl/ui/animate", "@cxl/ui/svg.js"], function (require, exports, appbar_1, autocomplete_js_1, badge_1, button_1, checkbox_js_2, core_js_23, spinner_js_1, field_js_5, theme_js_31, menu_js_2, fab_js_1, chip_js_1, dialog_js_3, input_base_js_6, form_js_3, layout_js_2, item_js_2, tabs_js_2, navigation_js_1, avatar_js_2, multiselect_js_1, select_js_4, icon_js_10, appbar_search_js_1, appbar_menu_js_1, drag_js_1, carousel_js_1, datepicker_js_1, table_js_1, user_js_1, progress_js_1, animate_js_1, svg_js_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AppbarSearch = exports.SvgIcon = exports.IconButton = exports.Option = exports.SelectBox = exports.InputBase = exports.theme = exports.Fieldset = exports.Field = exports.Spinner = exports.ripple = exports.Toolbar = exports.Toggle = exports.T = exports.Span = exports.Ripple = exports.RippleContainer = exports.Meta = exports.Hr = exports.ColorAttribute = exports.Application = exports.Button = void 0;
    __exportStar(appbar_1, exports);
    __exportStar(autocomplete_js_1, exports);
    __exportStar(badge_1, exports);
    Object.defineProperty(exports, "Button", { enumerable: true, get: function () { return button_1.Button; } });
    __exportStar(checkbox_js_2, exports);
    Object.defineProperty(exports, "Application", { enumerable: true, get: function () { return core_js_23.Application; } });
    Object.defineProperty(exports, "ColorAttribute", { enumerable: true, get: function () { return core_js_23.ColorAttribute; } });
    Object.defineProperty(exports, "Hr", { enumerable: true, get: function () { return core_js_23.Hr; } });
    Object.defineProperty(exports, "Meta", { enumerable: true, get: function () { return core_js_23.Meta; } });
    Object.defineProperty(exports, "RippleContainer", { enumerable: true, get: function () { return core_js_23.RippleContainer; } });
    Object.defineProperty(exports, "Ripple", { enumerable: true, get: function () { return core_js_23.Ripple; } });
    Object.defineProperty(exports, "Span", { enumerable: true, get: function () { return core_js_23.Span; } });
    Object.defineProperty(exports, "T", { enumerable: true, get: function () { return core_js_23.T; } });
    Object.defineProperty(exports, "Toggle", { enumerable: true, get: function () { return core_js_23.Toggle; } });
    Object.defineProperty(exports, "Toolbar", { enumerable: true, get: function () { return core_js_23.Toolbar; } });
    Object.defineProperty(exports, "ripple", { enumerable: true, get: function () { return core_js_23.ripple; } });
    Object.defineProperty(exports, "Spinner", { enumerable: true, get: function () { return spinner_js_1.Spinner; } });
    Object.defineProperty(exports, "Field", { enumerable: true, get: function () { return field_js_5.Field; } });
    Object.defineProperty(exports, "Fieldset", { enumerable: true, get: function () { return field_js_5.Fieldset; } });
    Object.defineProperty(exports, "theme", { enumerable: true, get: function () { return theme_js_31.theme; } });
    __exportStar(menu_js_2, exports);
    __exportStar(fab_js_1, exports);
    __exportStar(chip_js_1, exports);
    __exportStar(dialog_js_3, exports);
    Object.defineProperty(exports, "InputBase", { enumerable: true, get: function () { return input_base_js_6.InputBase; } });
    __exportStar(form_js_3, exports);
    __exportStar(layout_js_2, exports);
    __exportStar(item_js_2, exports);
    __exportStar(tabs_js_2, exports);
    __exportStar(navigation_js_1, exports);
    __exportStar(avatar_js_2, exports);
    __exportStar(multiselect_js_1, exports);
    Object.defineProperty(exports, "SelectBox", { enumerable: true, get: function () { return select_js_4.SelectBox; } });
    Object.defineProperty(exports, "Option", { enumerable: true, get: function () { return select_js_4.Option; } });
    Object.defineProperty(exports, "IconButton", { enumerable: true, get: function () { return icon_js_10.IconButton; } });
    Object.defineProperty(exports, "SvgIcon", { enumerable: true, get: function () { return icon_js_10.SvgIcon; } });
    Object.defineProperty(exports, "AppbarSearch", { enumerable: true, get: function () { return appbar_search_js_1.AppbarSearch; } });
    __exportStar(appbar_menu_js_1, exports);
    __exportStar(drag_js_1, exports);
    __exportStar(carousel_js_1, exports);
    __exportStar(datepicker_js_1, exports);
    __exportStar(table_js_1, exports);
    __exportStar(user_js_1, exports);
    __exportStar(progress_js_1, exports);
    __exportStar(animate_js_1, exports);
    __exportStar(svg_js_3, exports);
});
define("@cxl/router", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Router = exports.Strategies = exports.HashStrategy = exports.PathStrategy = exports.QueryStrategy = exports.parseUrl = exports.getElementRoute = exports.RouteManager = exports.Route = exports.parseQueryParameters = exports.replaceParameters = exports.normalize = exports.sys = void 0;
    const PARAM_QUERY_REGEX = /([^&=]+)=?([^&]*)/g, PARAM_REGEX = /:([\w_$@]+)/g, optionalParam = /\/\((.*?)\)/g, namedParam = /(\(\?)?:\w+/g, splatParam = /\*\w+/g, escapeRegExp = /[-{}[\]+?.,\\^$|#\s]/g;
    const routeSymbol = '@@cxlRoute';
    exports.sys = {
        location: window.location,
        history: window.history,
    };
    function routeToRegExp(route) {
        const names = [], result = new RegExp('^/?' +
            route
                .replace(escapeRegExp, '\\$&')
                .replace(optionalParam, '\\/?(?:$1)?')
                .replace(namedParam, function (match, optional) {
                names.push(match.substr(1));
                return optional ? match : '([^/?]*)';
            })
                .replace(splatParam, '([^?]*?)') +
            '(?:/$|\\?|$)');
        return [result, names];
    }
    function normalize(path) {
        if (path[0] === '/')
            path = path.slice(1);
        if (path.endsWith('/'))
            path = path.slice(0, -1);
        return path;
    }
    exports.normalize = normalize;
    function replaceParameters(path, params) {
        if (!params)
            return path;
        return path.replace(PARAM_REGEX, (_match, key) => params[key] || '');
    }
    exports.replaceParameters = replaceParameters;
    function parseQueryParameters(query) {
        const result = {};
        let m;
        while ((m = PARAM_QUERY_REGEX.exec(query)))
            result[m[1]] = decodeURIComponent(m[2]);
        return result;
    }
    exports.parseQueryParameters = parseQueryParameters;
    class Fragment {
        constructor(path) {
            this.path = path = normalize(path);
            [this.regex, this.parameters] = routeToRegExp(path);
        }
        _extractQuery(frag) {
            const pos = frag.indexOf('?');
            return pos === -1 ? {} : parseQueryParameters(frag.slice(pos + 1));
        }
        getArguments(fragment) {
            const match = this.regex.exec(fragment);
            const params = match && match.slice(1);
            if (!params)
                return;
            const result = this._extractQuery(fragment);
            params.forEach((param, i) => {
                const p = i === params.length - 1
                    ? param || ''
                    : param
                        ? decodeURIComponent(param)
                        : '';
                result[this.parameters[i]] = p;
            });
            return result;
        }
        test(url) {
            return this.regex.test(url);
        }
        toString() {
            return this.path;
        }
    }
    class Route {
        constructor(def) {
            var _a;
            if (def.path !== undefined)
                this.path = new Fragment(def.path);
            else if (!def.id)
                throw new Error('An id or path is required.');
            this.id = def.id || ((_a = def.path) !== null && _a !== void 0 ? _a : `route${Math.random().toString()}`);
            this.isDefault = def.isDefault || false;
            this.parent = def.parent;
            this.redirectTo = def.redirectTo;
            this.definition = def;
        }
        createElement(args) {
            const el = this.definition.render();
            el[routeSymbol] = this;
            for (const a in args)
                el[a] = args[a];
            return el;
        }
        create(args) {
            const def = this.definition, resolve = def.resolve;
            if (resolve && resolve(args) === false)
                return null;
            return this.createElement(args);
        }
    }
    exports.Route = Route;
    class RouteManager {
        constructor() {
            this.routes = [];
        }
        findRoute(path) {
            return this.routes.find(r => { var _a; return (_a = r.path) === null || _a === void 0 ? void 0 : _a.test(path); }) || this.defaultRoute;
        }
        get(id) {
            return this.routes.find(r => r.id === id);
        }
        register(route) {
            if (route.isDefault) {
                if (this.defaultRoute)
                    throw new Error('Default route already defined');
                this.defaultRoute = route;
            }
            this.routes.unshift(route);
        }
    }
    exports.RouteManager = RouteManager;
    const URL_REGEX = /([^#]*)(?:#(.+))?/;
    function getElementRoute(el) {
        return el[routeSymbol];
    }
    exports.getElementRoute = getElementRoute;
    function parseUrl(url) {
        const match = URL_REGEX.exec(url);
        return { path: normalize((match === null || match === void 0 ? void 0 : match[1]) || ''), hash: (match === null || match === void 0 ? void 0 : match[2]) || '' };
    }
    exports.parseUrl = parseUrl;
    exports.QueryStrategy = {
        getHref(url) {
            url = typeof url === 'string' ? parseUrl(url) : url;
            return `${exports.sys.location.pathname}${url.path ? `?${url.path}` : ''}${url.hash ? `#${url.hash}` : ''}`;
        },
        serialize(url) {
            var _a;
            const oldUrl = (_a = exports.sys.history.state) === null || _a === void 0 ? void 0 : _a.url;
            if (!oldUrl || url.hash !== oldUrl.hash || url.path !== oldUrl.path)
                exports.sys.history.pushState({ url }, '', this.getHref(url));
        },
        deserialize() {
            var _a;
            return (((_a = exports.sys.history.state) === null || _a === void 0 ? void 0 : _a.url) || {
                path: exports.sys.location.search.slice(1),
                hash: exports.sys.location.hash.slice(1),
            });
        },
    };
    exports.PathStrategy = {
        getHref(url) {
            url = typeof url === 'string' ? parseUrl(url) : url;
            return `${url.path}${url.hash ? `#${url.hash}` : ''}`;
        },
        serialize(url) {
            var _a;
            const oldUrl = (_a = exports.sys.history.state) === null || _a === void 0 ? void 0 : _a.url;
            if (!oldUrl || url.hash !== oldUrl.hash || url.path !== oldUrl.path)
                exports.sys.history.pushState({ url }, '', this.getHref(url));
        },
        deserialize() {
            var _a;
            return (((_a = exports.sys.history.state) === null || _a === void 0 ? void 0 : _a.url) || {
                path: exports.sys.location.pathname,
                hash: exports.sys.location.hash.slice(1),
            });
        },
    };
    exports.HashStrategy = {
        getHref(url) {
            url = typeof url === 'string' ? parseUrl(url) : url;
            return `#${url.path}${url.hash ? `#${url.hash}` : ''}`;
        },
        serialize(url) {
            const href = exports.HashStrategy.getHref(url);
            if (exports.sys.location.hash !== href)
                exports.sys.location.hash = href;
        },
        deserialize() {
            return parseUrl(exports.sys.location.hash.slice(1));
        },
    };
    exports.Strategies = {
        hash: exports.HashStrategy,
        path: exports.PathStrategy,
        query: exports.QueryStrategy,
    };
    class Router {
        constructor(callbackFn) {
            this.callbackFn = callbackFn;
            this.routes = new RouteManager();
            this.instances = {};
        }
        findRoute(id, args) {
            const route = this.instances[id];
            let i;
            if (route)
                for (i in args)
                    route[i] = args[i];
            return route;
        }
        executeRoute(route, args, instances) {
            const parentId = route.parent, Parent = parentId && this.routes.get(parentId), id = route.id, parent = Parent && this.executeRoute(Parent, args, instances), instance = this.findRoute(id, args) || route.create(args);
            if (!parent)
                this.root = instance;
            else if (instance && instance.parentNode !== parent)
                parent.appendChild(instance);
            instances[id] = instance;
            return instance;
        }
        discardOldRoutes(newInstances) {
            var _a;
            const oldInstances = this.instances;
            for (const i in oldInstances) {
                const old = oldInstances[i];
                if (newInstances[i] !== old) {
                    (_a = old.parentNode) === null || _a === void 0 ? void 0 : _a.removeChild(old);
                    delete oldInstances[i];
                }
            }
        }
        execute(Route, args) {
            const instances = {};
            const result = this.executeRoute(Route, args || {}, instances);
            this.discardOldRoutes(instances);
            this.instances = instances;
            return result;
        }
        route(def) {
            const route = new Route(def);
            this.routes.register(route);
            return route;
        }
        go(url) {
            var _a, _b;
            const parsedUrl = typeof url === 'string' ? parseUrl(url) : url;
            const path = parsedUrl.path;
            const currentUrl = (_a = this.state) === null || _a === void 0 ? void 0 : _a.url;
            if (currentUrl &&
                path === currentUrl.path &&
                parsedUrl.hash === currentUrl.hash)
                return;
            const route = this.routes.findRoute(path);
            if (!route)
                throw new Error(`Path: "${path}" not found`);
            const args = (_b = route.path) === null || _b === void 0 ? void 0 : _b.getArguments(path);
            if (route.redirectTo)
                return this.go(replaceParameters(route.redirectTo, args));
            const current = this.execute(route, args);
            if (!this.root)
                throw new Error(`Route: "${path}" could not be created`);
            this.state = {
                url: parsedUrl,
                arguments: args,
                route,
                current,
                root: this.root,
            };
            if (this.callbackFn)
                this.callbackFn(this.state);
        }
        getPath(routeId, params) {
            const route = this.routes.get(routeId);
            const path = route && route.path;
            return path && replaceParameters(path.toString(), params);
        }
        isActiveUrl(url) {
            var _a;
            const parsed = parseUrl(url);
            if (!((_a = this.state) === null || _a === void 0 ? void 0 : _a.url))
                return false;
            const current = this.state.url;
            return !!Object.values(this.instances).find(el => {
                var _a, _b;
                const routeDef = el[routeSymbol];
                const currentArgs = (_a = this.state) === null || _a === void 0 ? void 0 : _a.arguments;
                if (((_b = routeDef.path) === null || _b === void 0 ? void 0 : _b.test(parsed.path)) &&
                    (!parsed.hash || parsed.hash === current.hash)) {
                    if (currentArgs) {
                        const args = routeDef.path.getArguments(parsed.path);
                        for (const i in args)
                            if (currentArgs[i] != args[i])
                                return false;
                    }
                    return true;
                }
                return false;
            });
        }
    }
    exports.Router = Router;
});
define("@cxl/ui-router", ["require", "exports", "@cxl/router", "@cxl/rx", "@cxl/component", "@cxl/dom", "@cxl/ui/appbar.js", "@cxl/ui/item.js", "@cxl/ui/tabs.js", "@cxl/tsx", "@cxl/template", "@cxl/ui/theme.js"], function (require, exports, router_1, rx_25, component_35, dom_26, appbar_js_2, item_js_3, tabs_js_3, tsx_28, template_21, theme_js_32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.RouterComponent = exports.RouterOutlet = exports.RouterItem = exports.A = exports.RouterTab = exports.RouterLink = exports.RouterAppbarTitle = exports.RouterTitle = exports.Router = exports.initializeRouter = exports.setDocumentTitle = exports.routerStrategy = exports.routerOutlet = exports.routeIsActive = exports.DefaultRoute = exports.Route = exports.routerState = exports.router = void 0;
    const router$ = new rx_25.Reference();
    const strategy$ = new rx_25.Reference();
    exports.router = new router_1.Router(state => router$.next(state));
    exports.routerState = router$;
    function Route(path) {
        return (ctor) => {
            const options = typeof path === 'string' ? { path } : path;
            exports.router.route({
                ...options,
                render: () => (0, tsx_28.dom)(ctor),
            });
        };
    }
    exports.Route = Route;
    function DefaultRoute(path = '') {
        return (ctor) => {
            const options = typeof path === 'string' ? { path } : path;
            exports.router.route({
                ...options,
                isDefault: true,
                render: () => (0, tsx_28.dom)(ctor),
            });
        };
    }
    exports.DefaultRoute = DefaultRoute;
    function routeIsActive(path) {
        return router$.map(() => exports.router.isActiveUrl(path));
    }
    exports.routeIsActive = routeIsActive;
    function routerOutlet(host) {
        let currentRoute;
        return router$.tap(state => {
            var _a, _b;
            const { url, root } = state;
            if (root.parentNode !== host)
                host.appendChild(root);
            else if (currentRoute &&
                currentRoute !== root &&
                currentRoute.parentNode)
                host.removeChild(currentRoute);
            currentRoute = root;
            if (url.hash)
                (_a = host.querySelector(`a[name="${url.hash}"]`)) === null || _a === void 0 ? void 0 : _a.scrollIntoView();
            else if (host.parentElement && ((_b = history.state) === null || _b === void 0 ? void 0 : _b.lastAction) !== 'pop')
                requestAnimationFrame(() => { var _a; return (_a = host.parentElement) === null || _a === void 0 ? void 0 : _a.scrollTo(0, 0); });
        });
    }
    exports.routerOutlet = routerOutlet;
    function routerStrategy(getUrl, strategy = router_1.Strategies.query) {
        return (0, rx_25.merge)((0, rx_25.observable)(() => strategy$.next(strategy)), getUrl.tap(() => exports.router.go(strategy.deserialize())), router$
            .tap(state => strategy.serialize(state.url))
            .catchError((e, source) => e.name === 'SecurityError' ? rx_25.EMPTY : source));
    }
    exports.routerStrategy = routerStrategy;
    function setDocumentTitle() {
        return router$
            .switchMap(state => {
            const result = [];
            let current = state.current;
            do {
                const title = current.routeTitle;
                if (title)
                    result.unshift(title instanceof rx_25.Observable ? title : (0, rx_25.of)(title));
            } while ((current = current.parentNode));
            return (0, rx_25.combineLatest)(...result);
        })
            .tap(title => (document.title = title.join(' - ')));
    }
    exports.setDocumentTitle = setDocumentTitle;
    function initializeRouter(host, strategy = router_1.Strategies.query, getUrl) {
        const strategyObj = typeof strategy === 'string' ? router_1.Strategies[strategy] : strategy;
        const getter = getUrl ||
            (strategyObj === router_1.Strategies.hash ? (0, dom_26.onHashChange)() : (0, dom_26.onLocation)());
        return (0, rx_25.merge)(routerStrategy(getter, strategyObj), routerOutlet(host), setDocumentTitle());
    }
    exports.initializeRouter = initializeRouter;
    function Router(strategy = router_1.Strategies.query, getUrl) {
        return (ctor) => {
            (0, component_35.augment)(ctor, [
                (host) => initializeRouter(host, strategy, getUrl),
            ]);
        };
    }
    exports.Router = Router;
    const routeTitles = router$.raf().map(state => {
        const result = [];
        let route = state.current;
        do {
            if (route.routeTitle)
                result.unshift({
                    title: route.routeTitle,
                    first: route === state.current,
                    path: routePath(route),
                });
        } while ((route = route.parentNode));
        return result;
    });
    function routePath(routeEl) {
        var _a, _b;
        const route = (0, router_1.getElementRoute)(routeEl);
        return (route &&
            (0, router_1.replaceParameters)(((_a = route.path) === null || _a === void 0 ? void 0 : _a.toString()) || '', ((_b = exports.router.state) === null || _b === void 0 ? void 0 : _b.arguments) || {}));
    }
    function RouterTitle() {
        function renderLink(route) {
            return route.first ? ((0, tsx_28.dom)(component_35.Span, null, route.title)) : ((0, tsx_28.dom)("span", { slot: "parent" },
                (0, tsx_28.dom)(RouterLink, { href: route.path }, route.title),
                "\u00A0/\u00A0"));
        }
        return (0, tsx_28.dom)(appbar_js_2.AppbarTitle, null, (0, template_21.each)(routeTitles, renderLink));
    }
    exports.RouterTitle = RouterTitle;
    let RouterAppbarTitle = class RouterAppbarTitle extends component_35.Component {
    };
    RouterAppbarTitle = __decorate([
        (0, component_35.Augment)('cxl-router-appbar-title', (0, theme_js_32.css)({ $: { display: 'contents' } }), RouterTitle)
    ], RouterAppbarTitle);
    exports.RouterAppbarTitle = RouterAppbarTitle;
    function renderTemplate(tpl, title) {
        const result = document.createElement('div');
        result.style.display = 'contents';
        result.routeTitle = title;
        result.appendChild(tpl.content.cloneNode(true));
        return result;
    }
    let RouterLink = class RouterLink extends component_35.Component {
        constructor() {
            super(...arguments);
            this.focusable = false;
            this.external = false;
        }
    };
    __decorate([
        (0, component_35.Attribute)()
    ], RouterLink.prototype, "href", void 0);
    __decorate([
        (0, component_35.Attribute)()
    ], RouterLink.prototype, "focusable", void 0);
    __decorate([
        (0, component_35.Attribute)()
    ], RouterLink.prototype, "external", void 0);
    RouterLink = __decorate([
        (0, component_35.Augment)('cxl-router-link', host => {
            const el = ((0, tsx_28.dom)("a", { className: "link" },
                (0, tsx_28.dom)("slot", null)));
            host.bind((0, rx_25.merge)((0, component_35.get)(host, 'focusable').tap(val => (el.tabIndex = val ? 0 : -1)), (0, rx_25.combineLatest)(strategy$, (0, component_35.get)(host, 'href'), (0, component_35.get)(host, 'external')).tap(([strategy, val, ext]) => val !== undefined &&
                (el.href = ext ? val : strategy.getHref(val))), (0, dom_26.onAction)(el).tap(ev => {
                ev.preventDefault();
                if (host.href !== undefined)
                    if (host.external)
                        location.assign(host.href);
                    else
                        exports.router.go(host.href);
            })));
            return el;
        }, (0, theme_js_32.css)({
            $: { display: 'contents' },
            link: {
                outline: 0,
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
            },
        }))
    ], RouterLink);
    exports.RouterLink = RouterLink;
    let RouterTab = class RouterTab extends component_35.Component {
        constructor() {
            super(...arguments);
            this.href = '';
        }
    };
    __decorate([
        (0, component_35.Attribute)()
    ], RouterTab.prototype, "href", void 0);
    RouterTab = __decorate([
        (0, component_35.Augment)('cxl-router-tab', (0, template_21.role)('tab'), (0, theme_js_32.css)({
            $: { flexGrow: 1 },
        }), $ => ((0, tsx_28.dom)(RouterLink, { href: (0, component_35.get)($, 'href') },
            (0, tsx_28.dom)(tabs_js_3.Tab, { "$": el => (0, dom_26.on)(el, 'cxl-tab.selected').tap(() => (0, dom_26.trigger)($, 'cxl-tab.selected', el)), selected: (0, component_35.get)($, 'href').switchMap(routeIsActive) },
                (0, tsx_28.dom)("slot", null)))))
    ], RouterTab);
    exports.RouterTab = RouterTab;
    let A = class A extends RouterLink {
        constructor() {
            super(...arguments);
            this.focusable = true;
        }
    };
    A = __decorate([
        (0, component_35.Augment)('cxl-a', (0, theme_js_32.css)({
            $: { textDecoration: 'underline' },
            $focusWithin: { outline: 'var(--cxl-primary) auto 1px;' },
        }))
    ], A);
    exports.A = A;
    let RouterItem = class RouterItem extends component_35.Component {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        focus() {
            var _a, _b;
            (_b = (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.querySelector('cxl-item')) === null || _b === void 0 ? void 0 : _b.focus();
        }
    };
    __decorate([
        (0, component_35.Attribute)()
    ], RouterItem.prototype, "href", void 0);
    __decorate([
        (0, component_35.Attribute)()
    ], RouterItem.prototype, "disabled", void 0);
    RouterItem = __decorate([
        (0, component_35.Augment)('cxl-router-item', host => ((0, tsx_28.dom)(RouterLink, { className: "link", href: (0, component_35.get)(host, 'href') },
            (0, tsx_28.dom)(item_js_3.Item, { "$": el => router$.tap(() => {
                    if (host.href !== undefined)
                        el.selected = exports.router.isActiveUrl(host.href);
                }) },
                (0, tsx_28.dom)("slot", null)))), (0, theme_js_32.css)({
            $: {
                display: 'block',
            },
            link: {
                outline: 0,
                textDecoration: 'none',
            },
            ...theme_js_32.StateStyles,
        }), host => (0, dom_26.onAction)(host).pipe((0, template_21.triggerEvent)(host, 'drawer.close')), host => (0, component_35.get)(host, 'disabled').tap(value => host.setAttribute('aria-disabled', value ? 'true' : 'false')))
    ], RouterItem);
    exports.RouterItem = RouterItem;
    let RouterOutlet = class RouterOutlet extends component_35.Component {
    };
    RouterOutlet = __decorate([
        (0, component_35.Augment)('cxl-router-outlet', routerOutlet)
    ], RouterOutlet);
    exports.RouterOutlet = RouterOutlet;
    let RouterComponent = class RouterComponent extends component_35.Component {
        constructor() {
            super(...arguments);
            this.strategy = 'query';
        }
    };
    __decorate([
        (0, component_35.Attribute)()
    ], RouterComponent.prototype, "strategy", void 0);
    RouterComponent = __decorate([
        (0, component_35.Augment)('cxl-router', host => {
            function register(el) {
                const dataset = el.dataset;
                if (dataset.registered)
                    return;
                dataset.registered = 'true';
                const title = dataset.title || undefined;
                exports.router.route({
                    path: dataset.path,
                    id: dataset.id || undefined,
                    parent: dataset.parent || undefined,
                    isDefault: el.hasAttribute('data-default'),
                    render: renderTemplate.bind(null, el, title),
                });
            }
            return (0, dom_26.onReady)().switchMap(() => {
                for (const child of Array.from(host.children))
                    if (child.tagName === 'TEMPLATE')
                        register(child);
                return (0, rx_25.merge)((0, dom_26.onChildrenMutation)(host).tap(ev => {
                    if (ev.type === 'added' && ev.value.tagName === 'TEMPLATE')
                        register(ev.value);
                }), (0, component_35.get)(host, 'strategy').switchMap(strategyName => {
                    const strategy = router_1.Strategies[strategyName];
                    return routerStrategy((0, dom_26.onLocation)(), strategy);
                }));
            });
        })
    ], RouterComponent);
    exports.RouterComponent = RouterComponent;
});
define("cxl/www/index", ["require", "exports", "@cxl/component", "@cxl/ui", "@cxl/rx", "@cxl/tsx", "@cxl/template", "@cxl/css", "@cxl/ui-router", "@cxl/ui/theme.js", "@cxl/dom"], function (require, exports, component_36, ui_1, rx_26, tsx_29, template_22, css_16, ui_router_1, theme_js_33, dom_27) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ProductGrid = exports.ProductList = exports.StoreBuy = exports.ComponentCount = void 0;
    const data$ = (0, rx_26.defer)(() => (0, rx_26.from)(fetch('assets/data.json').then(p => p.json()))).publishLast();
    function Empty() {
        return ((0, tsx_29.dom)(ui_1.C, { pad: 16, sm: 12 },
            (0, tsx_29.dom)(ui_1.T, { center: true },
                (0, tsx_29.dom)("img", { width: 200, src: "assets/empty-list.svg" }),
                (0, tsx_29.dom)(ui_1.T, { h6: true }, "No Results"))));
    }
    function ProductDemo(p) {
        return ((0, tsx_29.dom)("iframe", { className: "thumbnailContainer", loading: "lazy", srcdoc: p.demo }));
    }
    function ProductTile(product) {
        var _a;
        const href = ((_a = product.links) === null || _a === void 0 ? void 0 : _a.homepage) || '';
        return ((0, tsx_29.dom)(ui_1.Card, { xs: 12, sm: 6, md: 4, className: "tile" },
            product.demo ? (ProductDemo(product)) : ((0, tsx_29.dom)(ui_router_1.RouterLink, { className: "thumbnailContainer", external: true, href: href },
                (0, tsx_29.dom)("img", { loading: "lazy", className: "thumbnail", src: product.screenshot || 'assets/placeholder.svg' }))),
            (0, tsx_29.dom)(ui_router_1.RouterLink, { external: true, href: href },
                (0, tsx_29.dom)(ui_1.C, { pad: 16 },
                    (0, tsx_29.dom)(ui_1.T, { tabIndex: 0, h6: true, className: "prodtitle" },
                        product.title || product.name,
                        "\u00A0",
                        (0, tsx_29.dom)(ui_1.T, { subtitle2: true, inline: true }, product.version || '')),
                    (0, tsx_29.dom)(ui_1.C, { flex: true },
                        (0, tsx_29.dom)(ui_1.C, { grow: true, className: "proddesc" },
                            (0, tsx_29.dom)(ui_1.T, { body2: true }, product.description)))))));
    }
    let ComponentCount = class ComponentCount extends component_36.Component {
    };
    ComponentCount = __decorate([
        (0, component_36.Augment)('coaxial-component-count', (0, theme_js_33.css)({
            $: { display: 'block' },
            count: { marginBottom: 16 },
            block: { display: 'inline-block', marginRight: 32 },
            plus: { color: 'secondary' },
        }), () => ((0, tsx_29.dom)(ui_1.C, { center: true }, (0, template_22.render)(data$.map(d => d.stats), stats => ((0, tsx_29.dom)(tsx_29.dom, null,
            (0, tsx_29.dom)("div", { className: "block" },
                (0, tsx_29.dom)(ui_1.T, { h3: true, className: "count" },
                    stats.components,
                    (0, tsx_29.dom)("span", { className: "plus" }, "+")),
                (0, tsx_29.dom)(ui_1.T, { center: true, button: true }, "Components")),
            (0, tsx_29.dom)("div", { className: "block" },
                (0, tsx_29.dom)(ui_1.T, { h3: true, className: "count" },
                    stats.kits,
                    (0, tsx_29.dom)("span", { className: "plus" }, "+")),
                (0, tsx_29.dom)(ui_1.T, { center: true, button: true }, "UI Kits"))))))))
    ], ComponentCount);
    exports.ComponentCount = ComponentCount;
    function subscribe(price) {
        location.assign(`${CONFIG.login.url}#subscribe/${price}`);
    }
    let StoreBuy = class StoreBuy extends component_36.Component {
        constructor() {
            super(...arguments);
            this.routeTitle = 'Buy License';
        }
    };
    StoreBuy = __decorate([
        (0, component_36.Augment)('store-buy', () => ((0, tsx_29.dom)(ui_1.Grid, null,
            (0, tsx_29.dom)(ui_1.C, null),
            (0, tsx_29.dom)(ui_1.Card, { sm: 4, pad: 32, center: true },
                (0, tsx_29.dom)(ui_1.T, { h4: true }, "GPL v3.0"),
                (0, tsx_29.dom)(ui_1.T, { h6: true }, "Free"),
                (0, tsx_29.dom)(ui_1.T, null, "All you need to get started. Free for personal use."),
                (0, tsx_29.dom)("br", null),
                (0, tsx_29.dom)("br", null),
                (0, tsx_29.dom)(ui_router_1.RouterLink, { href: "docs" },
                    (0, tsx_29.dom)(ui_1.Button, { size: 2, primary: true }, "Get Started"))),
            (0, tsx_29.dom)(ui_1.C, { sm: 2 }),
            (0, tsx_29.dom)(ui_1.Card, { sm: 4, pad: 32, center: true },
                (0, tsx_29.dom)(ui_1.T, { h4: true }, "Commercial"),
                (0, tsx_29.dom)(ui_1.T, { h5: true }, "$120.00/year"),
                (0, tsx_29.dom)(ui_1.T, null, "Unlimited use for commercial products."),
                (0, tsx_29.dom)("br", null),
                (0, tsx_29.dom)("br", null),
                (0, tsx_29.dom)(ui_1.Button, { "$": el => (0, dom_27.onAction)(el).tap(() => subscribe(CONFIG.priceId)), size: 2, primary: true }, "Subscribe Now"),
                (0, tsx_29.dom)(ui_1.T, { h6: true }, "Or"),
                (0, tsx_29.dom)(ui_1.Button, { flat: true, "$": el => (0, dom_27.onAction)(el).tap(() => subscribe(CONFIG.oneTimePriceId)), size: 2, primary: true }, "One Time Payment")))))
    ], StoreBuy);
    exports.StoreBuy = StoreBuy;
    let ProductList = class ProductList extends component_36.Component {
        constructor() {
            super(...arguments);
            this.type = 'component';
        }
    };
    __decorate([
        (0, component_36.Attribute)()
    ], ProductList.prototype, "type", void 0);
    ProductList = __decorate([
        (0, component_36.Augment)('coaxial-product-list', (0, theme_js_33.css)({
            thumbnailContainer: {
                width: '100%',
                ...(0, css_16.border)(0),
                height: 160,
                ...(0, css_16.padding)(0),
                display: 'flex',
                justifyContent: 'center',
            },
            thumbnail: {
                display: 'block',
                maxHeight: 160,
                width: '100%',
                maxWidth: '100%',
                ...(0, css_16.margin)('auto'),
            },
            grid: {
                ...(0, css_16.margin)(0, 0, 32, 0),
            },
            '@medium': {
                grid: {
                    columnGap: 32,
                    rowGap: 32,
                },
            },
            prodtitle: {
                marginBottom: 8,
            },
            proddesc: {
                paddingRight: 8,
            },
            tile: {
                minWidth: 0,
            },
        }), $ => {
            function filter(type, term) {
                const regex = (0, template_22.getSearchRegex)(term);
                return (p) => p.type === (type || 'component') && regex.test(p.search);
            }
            const sortField$ = (0, rx_26.be)('name');
            const searchTerm = (0, rx_26.be)('');
            const onChange = (0, rx_26.combineLatest)(data$, (0, component_36.get)($, 'type'), sortField$, searchTerm).map(([data, type, sortField, term]) => data.products.filter(filter(type, term)).sort((0, template_22.sortBy)(sortField)));
            return ((0, tsx_29.dom)($.Shadow, null, (0, template_22.render)(data$, () => ((0, tsx_29.dom)(ui_1.Grid, { className: "grid" },
                (0, tsx_29.dom)(ui_1.C, { sm: 8, md: 9 },
                    (0, tsx_29.dom)(ui_1.Field, { outline: true, floating: true },
                        (0, tsx_29.dom)(ui_1.Label, null, "Search"),
                        (0, tsx_29.dom)(ui_1.Input, { "$": el => (0, template_22.onValue)(el)
                                .debounceTime(300)
                                .tap(() => searchTerm.next(el.value)) }))),
                (0, tsx_29.dom)(ui_1.C, { sm: 4, md: 3 },
                    (0, tsx_29.dom)(ui_1.Field, { outline: true },
                        (0, tsx_29.dom)(ui_1.SelectBox, { "$": el => (0, template_22.model)(el, sortField$) },
                            (0, tsx_29.dom)(ui_1.Option, { value: "name" }, "Sort By Name"),
                            (0, tsx_29.dom)(ui_1.Option, { value: "lastUpdate" }, "Sort By Last Update"),
                            (0, tsx_29.dom)(ui_1.Option, { value: "downloads" }, "Sort By Popularity")))),
                (0, template_22.each)(onChange, ProductTile, Empty))))));
        })
    ], ProductList);
    exports.ProductList = ProductList;
    let ProductGrid = class ProductGrid extends component_36.Component {
        constructor() {
            super(...arguments);
            this.type = 'kit';
        }
    };
    __decorate([
        (0, component_36.Attribute)()
    ], ProductGrid.prototype, "type", void 0);
    ProductGrid = __decorate([
        (0, component_36.Augment)('coaxial-product-grid', $ => {
            $.bind(ui_router_1.routerState.tap(state => {
                var _a;
                const type = (_a = state.arguments) === null || _a === void 0 ? void 0 : _a.type;
                $.type = type || 'kit';
            }));
            return ((0, tsx_29.dom)($.Shadow, null,
                (0, tsx_29.dom)(ui_1.Tabs, { className: "tabs" },
                    (0, tsx_29.dom)(ui_router_1.RouterTab, { href: "/docs/" }, "UI Kits"),
                    (0, tsx_29.dom)(ui_router_1.RouterTab, { href: "/docs/library" }, "Libraries")),
                (0, tsx_29.dom)("br", null),
                (0, tsx_29.dom)(ProductList, { type: (0, component_36.get)($, 'type') })));
        })
    ], ProductGrid);
    exports.ProductGrid = ProductGrid;
});
define("cxl/source/index", ["require", "exports", "path", "fs/promises", "source-map"], function (require, exports, path_1, promises_1, source_map_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.escapeHtml = exports.getSourceMap = exports.getSourceMapPath = exports.SourceMap = exports.positionToIndex = exports.indexToPosition = void 0;
    const SOURCEMAP_REGEX = /\/\/# sourceMappingURL=(.+)/;
    function indexToPosition(source, index) {
        let column = 0, line = 0;
        if (index > source.length)
            throw new Error(`Invalid index ${index}/${source.length}`);
        for (let i = 0; i < index; i++) {
            if (source[i] === '\n') {
                line++;
                column = 0;
            }
            else
                column++;
        }
        return { line, column };
    }
    exports.indexToPosition = indexToPosition;
    function positionToIndex(source, pos) {
        let line = pos.line;
        const len = source.length;
        if (pos.line === 0)
            return pos.column;
        for (let i = 0; i < len; i++) {
            if (source[i] === '\n' && --line === 0)
                return i + pos.column + 1;
        }
        throw new Error(`Invalid Position: ${pos.line},${pos.column}`);
    }
    exports.positionToIndex = positionToIndex;
    function indexToPosOne(source, index) {
        const result = indexToPosition(source, index);
        result.line++;
        return result;
    }
    function getMappingsForRange(sourceMap, start, end) {
        return sourceMap.mappings.filter(m => (m.generatedLine > start.line ||
            (m.generatedLine === start.line &&
                m.generatedColumn >= start.column)) &&
            (m.generatedLine < end.line ||
                (m.generatedLine === end.line &&
                    m.generatedColumn <= end.column)));
    }
    class SourceMap {
        constructor(path) {
            this.path = (0, path_1.resolve)(path);
            this.dir = (0, path_1.dirname)(this.path);
            this.mappings = [];
        }
        async load() {
            const raw = (this.raw = JSON.parse(await (0, promises_1.readFile)(this.path, 'utf8')));
            this.map = await new source_map_1.SourceMapConsumer(raw);
            this.map.eachMapping(m => this.mappings.push(m));
            return this;
        }
        originalPosition(source, offset) {
            var _a;
            const pos = indexToPosOne(source, offset);
            const result = (_a = this.map) === null || _a === void 0 ? void 0 : _a.originalPositionFor(pos);
            return (result === null || result === void 0 ? void 0 : result.source) ? result : undefined;
        }
        translateRange(source, range) {
            const sourceMap = this.map;
            if (!sourceMap)
                throw new Error('Sourcemap not initialized');
            const startPos = indexToPosOne(source, range.start);
            let start = sourceMap.originalPositionFor(startPos);
            const endPos = indexToPosOne(source, range.end);
            let end = sourceMap.originalPositionFor(endPos);
            if (start.source === null || end.source === null) {
                const mappings = getMappingsForRange(this, startPos, endPos);
                if (!mappings || mappings.length < 2)
                    return;
                const startMap = mappings[0];
                const endMap = mappings[mappings.length - 1];
                start = start.source
                    ? start
                    : {
                        source: startMap.source,
                        column: startMap.originalColumn,
                        line: startMap.originalLine,
                        name: null,
                    };
                end = end.source
                    ? end
                    : {
                        source: endMap.source,
                        column: endMap.originalColumn,
                        line: endMap.originalLine,
                        name: null,
                    };
            }
            if (start.source === null || end.source === null)
                return;
            if (start.line === null || end.line === null)
                return;
            start.source = (0, path_1.resolve)(this.dir, start.source);
            start.line--;
            end.source = (0, path_1.resolve)(this.dir, end.source);
            end.line--;
            return { start, end };
        }
    }
    exports.SourceMap = SourceMap;
    function getSourceMapPath(source, cwd) {
        const match = SOURCEMAP_REGEX.exec(source);
        return match ? (0, path_1.resolve)(cwd, match[1]) : '';
    }
    exports.getSourceMapPath = getSourceMapPath;
    async function getSourceMap(sourcePath) {
        const source = await (0, promises_1.readFile)(sourcePath, 'utf8');
        const filePath = getSourceMapPath(source, (0, path_1.dirname)(sourcePath));
        return filePath ? new SourceMap(filePath).load() : undefined;
    }
    exports.getSourceMap = getSourceMap;
    const ENTITIES_REGEX = /[&<>]/g, ENTITIES_MAP = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
    };
    function escapeHtml(str) {
        return (str && str.replace(ENTITIES_REGEX, e => ENTITIES_MAP[e] || ''));
    }
    exports.escapeHtml = escapeHtml;
});
define("cxl/server/colors", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.colors = void 0;
    const codes = {
        reset: [0, 0],
        bold: [1, 22],
        dim: [2, 22],
        italic: [3, 23],
        underline: [4, 24],
        inverse: [7, 27],
        hidden: [8, 28],
        strikethrough: [9, 29],
        black: [30, 39],
        red: [31, 39],
        green: [32, 39],
        yellow: [33, 39],
        blue: [34, 39],
        magenta: [35, 39],
        cyan: [36, 39],
        white: [37, 39],
        gray: [90, 39],
        grey: [90, 39],
        brightRed: [91, 39],
        brightGreen: [92, 39],
        brightYellow: [93, 39],
        brightBlue: [94, 39],
        brightMagenta: [95, 39],
        brightCyan: [96, 39],
        brightWhite: [97, 39],
        bgBlack: [40, 49],
        bgRed: [41, 49],
        bgGreen: [42, 49],
        bgYellow: [43, 49],
        bgBlue: [44, 49],
        bgMagenta: [45, 49],
        bgCyan: [46, 49],
        bgWhite: [47, 49],
        bgGray: [100, 49],
        bgGrey: [100, 49],
        bgBrightRed: [101, 49],
        bgBrightGreen: [102, 49],
        bgBrightYellow: [103, 49],
        bgBrightBlue: [104, 49],
        bgBrightMagenta: [105, 49],
        bgBrightCyan: [106, 49],
        bgBrightWhite: [107, 49],
        blackBG: [40, 49],
        redBG: [41, 49],
        greenBG: [42, 49],
        yellowBG: [43, 49],
        blueBG: [44, 49],
        magentaBG: [45, 49],
        cyanBG: [46, 49],
        whiteBG: [47, 49]
    };
    const styles = {};
    exports.colors = styles;
    Object.keys(codes).forEach(key => {
        const val = codes[key];
        const open = '\u001b[' + val[0] + 'm';
        const close = '\u001b[' + val[1] + 'm';
        styles[key] = (str) => open + str + close;
    });
});
define("cxl/server/index", ["require", "exports", "@cxl/rx", "path", "cxl/server/colors", "child_process", "fs"], function (require, exports, rx_27, path_2, colors_js_1, child_process_1, fs_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Application = exports.readJson = exports.sh = exports.mkdirp = exports.filesNeedSync = exports.syncFiles = void 0;
    require('source-map-support').install();
    function hrtime() {
        return process.hrtime.bigint();
    }
    process.on('unhandledRejection', up => {
        throw up;
    });
    function operation(fn) {
        let start = hrtime();
        const result = (0, rx_27.from)(typeof fn === 'function' ? fn() : fn);
        let tasks = 0;
        return result.pipe((0, rx_27.map)(item => {
            const end = hrtime();
            const result = {
                start,
                tasks: ++tasks,
                time: end - start,
                result: item,
            };
            start = end;
            return result;
        }));
    }
    function formatTime(time) {
        const s = Number(time) / 1e9, str = s.toFixed(4) + 's';
        return s > 0.1 ? (s > 0.5 ? colors_js_1.colors.red(str) : colors_js_1.colors.yellow(str)) : str;
    }
    function logOperation(prefix, msg, op) {
        let totalTime = BigInt(0);
        return new Promise((resolve, reject) => op.subscribe({
            next: ({ tasks, time, result }) => {
                totalTime += time;
                const formattedTime = formatTime(time) +
                    (tasks > 1 ? `, ${formatTime(totalTime)} total` : '');
                const message = typeof msg === 'function' ? msg(result) : msg;
                console.log(`${prefix} ${message} (${formattedTime})`);
            },
            error: reject,
            complete: resolve,
        }));
    }
    function logError(prefix, error) {
        console.log(prefix + ' ' + colors_js_1.colors.red(error.message));
        console.error(error);
    }
    function mtime(file) {
        return fs_1.promises.stat(file).then(stat => stat.mtime.getTime(), () => NaN);
    }
    async function syncFiles(file1, file2) {
        const time = Date.now();
        await Promise.all([
            fs_1.promises.utimes(file1, time, time).catch(),
            fs_1.promises.utimes(file2, time, time).catch(),
        ]);
    }
    exports.syncFiles = syncFiles;
    async function filesNeedSync(file1, file2) {
        const [mtime1, mtime2] = await Promise.all([mtime(file1), mtime(file2)]);
        return mtime1 !== mtime2;
    }
    exports.filesNeedSync = filesNeedSync;
    const ArgRegex = /^\s*(-{1,2})(\w[\w-]*)/;
    function mkdirp(dir) {
        return fs_1.promises
            .stat(dir)
            .catch(() => mkdirp((0, path_2.resolve)(dir, '..')).then(() => fs_1.promises.mkdir(dir)));
    }
    exports.mkdirp = mkdirp;
    function sh(cmd, options = {}) {
        return new Promise((resolve, reject) => {
            var _a, _b;
            const proc = (0, child_process_1.spawn)(cmd, [], { shell: true, ...options });
            let output = '';
            (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.on('data', data => (output += (data === null || data === void 0 ? void 0 : data.toString()) || ''));
            (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.on('data', data => (output += (data === null || data === void 0 ? void 0 : data.toString()) || ''));
            proc.on('close', code => (code ? reject(output) : resolve(output)));
        });
    }
    exports.sh = sh;
    class ApplicationParameters {
        constructor(app) {
            this.app = app;
            this.parameters = [
                {
                    name: 'help',
                    shortcut: 'h',
                    handle(app) {
                        if (app.version)
                            app.log(app.version);
                        process.exit(0);
                    },
                },
                {
                    name: 'config',
                    help: 'Use JSON config file',
                    shortcut: 'c',
                    handle(app, fileName) {
                        app.parameters.parseJsonFile(fileName);
                    },
                },
            ];
        }
        register(...p) {
            this.parameters.push(...p);
        }
        parseJsonFile(fileName) {
            try {
                const json = JSON.parse((0, fs_1.readFileSync)(fileName, 'utf8'));
                this.parseJson(json);
            }
            catch (e) {
                throw new Error(`Invalid configuration file "${fileName}"`);
            }
        }
        parseJson(json) {
            this.parameters.forEach(p => {
                const paramName = p.name;
                if (paramName in json) {
                    const optionValue = json[paramName];
                    this.app[paramName] = optionValue;
                }
            });
        }
        parse(args) {
            const app = this.app;
            const parameters = this.parameters;
            const rest = parameters.find(a => a.rest);
            for (let i = 2; i < args.length; i++) {
                const arg = args[i];
                const match = ArgRegex.exec(arg);
                if (match) {
                    const param = parameters.find(a => a.name === match[2] || a.shortcut === match[2]);
                    if (!param)
                        throw new Error(`Unknown argument ${arg}`);
                    if (param.handle)
                        param.handle(app, args[++i]);
                    else if (!param.type || param.type === 'boolean')
                        app[param.name] = true;
                    else
                        app[param.name] = args[++i];
                }
                else if (rest) {
                    app[rest.name] = arg;
                }
            }
        }
    }
    async function readJson(fileName) {
        try {
            return JSON.parse(await fs_1.promises.readFile(fileName, 'utf8'));
        }
        catch (e) {
            return undefined;
        }
    }
    exports.readJson = readJson;
    class Application {
        constructor() {
            this.color = 'green';
            this.parameters = new ApplicationParameters(this);
            this.started = false;
        }
        setup() {
        }
        log(msg, op) {
            const pre = this.coloredPrefix || '';
            if (msg instanceof Error)
                logError(pre, msg);
            else if (op)
                return logOperation(pre, msg, operation(op));
            console.log(`${pre} ${msg}`);
            return Promise.resolve();
        }
        handleError(e) {
            this.log(e);
            process.exit(1);
        }
        async start() {
            var _a;
            if (this.started)
                throw new Error('Application already started');
            this.started = true;
            const dir = (0, path_2.dirname)(((_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) || process.cwd());
            try {
                this.package = JSON.parse(await fs_1.promises.readFile((0, path_2.join)(dir, 'package.json'), 'utf8'));
            }
            catch (e) {
                this.package = {};
            }
            if (!this.name)
                this.name = this.package.name || (0, path_2.basename)(dir);
            if (!this.version)
                this.version = this.package.version;
            try {
                if (!this.name)
                    throw new Error('Application name is required');
                this.coloredPrefix = colors_js_1.colors[this.color](this.name);
                this.setup();
                this.parameters.parse(process.argv);
                if (this.version)
                    this.log(this.version);
                return await this.run();
            }
            catch (e) {
                this.handleError(e);
            }
        }
    }
    exports.Application = Application;
});
define("cxl/build/tsc", ["require", "exports", "path", "typescript", "typescript", "@cxl/rx", "typescript"], function (require, exports, path_3, ts, typescript_1, rx_28, typescript_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bundle = exports.flagsToString = exports.tsconfig = exports.tsbuild = exports.printDiagnostics = exports.buildDiagnostics = exports.tscVersion = void 0;
    Object.defineProperty(exports, "tscVersion", { enumerable: true, get: function () { return typescript_2.version; } });
    const parseConfigHost = {
        useCaseSensitiveFileNames: true,
        readDirectory: typescript_1.sys.readDirectory,
        getCurrentDirectory: typescript_1.sys.getCurrentDirectory,
        fileExists: typescript_1.sys.fileExists,
        readFile: typescript_1.sys.readFile,
        onUnRecoverableConfigFileDiagnostic(e) {
            throw e;
        },
    };
    function tscError(d, line, _ch, msg) {
        if (typeof msg === 'string')
            console.error(`[${d.file ? d.file.fileName : ''}:${line}] ${msg}`);
        else {
            do {
                console.error(`[${d.file ? d.file.fileName : ''}:${line}] ${msg.messageText}`);
            } while ((msg = msg.next && msg.next[0]));
        }
    }
    function buildDiagnostics(program) {
        return [
            ...program.getConfigFileParsingDiagnostics(),
            ...program.getOptionsDiagnostics(),
            ...program.getGlobalDiagnostics(),
        ];
    }
    exports.buildDiagnostics = buildDiagnostics;
    function printDiagnostics(diagnostics) {
        diagnostics.forEach(d => {
            if (d.file) {
                const { line, character } = (0, typescript_1.getLineAndCharacterOfPosition)(d.file, d.start || 0);
                tscError(d, line + 1, character, d.messageText);
            }
            else
                console.error(`${d.messageText}`);
        });
        throw new Error('Typescript compilation failed');
    }
    exports.printDiagnostics = printDiagnostics;
    function getBuilder(tsconfig = 'tsconfig.json', defaultOptions = { module: typescript_1.ModuleKind.CommonJS }) {
        var _a;
        const tsconfigJson = require((0, path_3.join)(process.cwd(), tsconfig));
        const outputDir = (_a = tsconfigJson.compilerOptions) === null || _a === void 0 ? void 0 : _a.outDir;
        if (!outputDir)
            throw new Error(`No outDir field set in ${tsconfig}`);
        const host = (0, typescript_1.createSolutionBuilderHost)(typescript_1.sys);
        const builder = (0, typescript_1.createSolutionBuilder)(host, [tsconfig], defaultOptions);
        return { outputDir, builder };
    }
    function tsbuild(tsconfig = 'tsconfig.json', subs, defaultOptions = { module: typescript_1.ModuleKind.CommonJS }) {
        const { outputDir, builder } = getBuilder(tsconfig, defaultOptions);
        let program;
        function writeFile(name, source) {
            name = (0, path_3.relative)(outputDir, name);
            subs.next({ path: name, source: Buffer.from(source) });
        }
        while ((program = builder.getNextInvalidatedProject())) {
            const status = program.done(undefined, writeFile);
            if (status !== typescript_1.ExitStatus.Success)
                throw `${program.project}: Typescript compilation failed`;
        }
    }
    exports.tsbuild = tsbuild;
    function tsconfig(tsconfig = 'tsconfig.json', options) {
        return new rx_28.Observable(subs => {
            tsbuild(tsconfig, subs, options);
            subs.complete();
        });
    }
    exports.tsconfig = tsconfig;
    function parseTsConfig(tsconfig) {
        var _a, _b;
        let parsed;
        try {
            parsed = (0, typescript_1.getParsedCommandLineOfConfigFile)(tsconfig, {}, parseConfigHost);
        }
        catch (e) {
            if (e instanceof Error)
                throw e;
            const msg = ((_a = e) === null || _a === void 0 ? void 0 : _a.message) || ((_b = e) === null || _b === void 0 ? void 0 : _b.messageText) || 'Unknown Error';
            throw new Error(msg);
        }
        if (!parsed)
            throw new Error(`Could not parse config file "${tsconfig}"`);
        return parsed;
    }
    function flagsToString(flags, Flags) {
        const result = [];
        for (const i in Flags) {
            if (Flags[i] & flags)
                result.push(i);
        }
        return result;
    }
    exports.flagsToString = flagsToString;
    function findImports(src, program, result = new Set()) {
        const typeChecker = program.getTypeChecker();
        src.forEachChild(node => {
            if ((ts.isImportDeclaration(node) &&
                (!node.importClause || !node.importClause.isTypeOnly)) ||
                (ts.isExportDeclaration(node) && !node.isTypeOnly)) {
                if (!node.moduleSpecifier)
                    return;
                const symbol = typeChecker.getSymbolAtLocation(node.moduleSpecifier);
                const childSourceFile = symbol === null || symbol === void 0 ? void 0 : symbol.valueDeclaration;
                if (childSourceFile &&
                    ts.isSourceFile(childSourceFile) &&
                    !childSourceFile.isDeclarationFile &&
                    !result.has(childSourceFile.fileName)) {
                    result.add(childSourceFile.fileName);
                    findImports(childSourceFile, program, result);
                }
            }
        });
        return result;
    }
    function bundleFiles(config) {
        const host = ts.createCompilerHost(config.options);
        const program = ts.createProgram(config.fileNames, config.options, host);
        const result = new Set([__dirname + '/amd.js']);
        program.getRootFileNames().forEach(file => {
            const src = program.getSourceFile(file);
            result.add(file);
            if (src)
                findImports(src, program, result);
        });
        return { host, program, result };
    }
    function bundle(tsconfig = 'tsconfig.json', outFile = 'index.bundle.js') {
        return new rx_28.Observable(subs => {
            const config = parseTsConfig(tsconfig);
            const { host, result } = bundleFiles(config);
            config.options.module = ts.ModuleKind.AMD;
            config.options.outFile = outFile;
            config.options.rootDir = (0, path_3.resolve)('../..');
            config.options.baseDir = process.cwd();
            const rootNames = Array.from(result);
            const program = ts.createProgram(rootNames, config.options, host);
            function writeFile(name, source) {
                subs.next({ path: name, source: Buffer.from(source) });
            }
            const diagnostics = buildDiagnostics(program);
            if (diagnostics.length) {
                printDiagnostics(diagnostics);
                return subs.error('Failed to compile');
            }
            program
                .getSourceFiles()
                .forEach(src => (src.isDeclarationFile = !rootNames.includes(src.fileName)));
            program.emit(undefined, writeFile);
            subs.complete();
        });
    }
    exports.bundle = bundle;
});
define("cxl/build/file", ["require", "exports", "terser", "@cxl/rx", "fs", "path", "cxl/server/index", "cxl/build/builder"], function (require, exports, Terser, rx_29, fs_2, path_4, server_1, builder_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.zip = exports.minify = exports.MinifyDefault = exports.getSourceMap = exports.copyDir = exports.matchStat = exports.files = exports.concatFile = exports.basename = exports.file = exports.read = void 0;
    async function read(source) {
        const content = await fs_2.promises.readFile(source);
        return {
            path: source,
            source: content,
        };
    }
    exports.read = read;
    function file(source, out) {
        return (0, rx_29.defer)(() => (0, rx_29.from)(read(source).then(res => ({
            path: out || (0, path_4.resolve)(source),
            source: res.source,
        }))));
    }
    exports.file = file;
    function basename(replace) {
        return (0, rx_29.tap)(out => (out.path = (replace || '') + (0, path_4.basename)(out.path)));
    }
    exports.basename = basename;
    function concatFile(outName, separator = '\n') {
        return (0, rx_29.pipe)((0, rx_29.reduce)((out, src) => `${out}${separator}${src.source}`, ''), (0, rx_29.map)(source => ({ path: outName, source })));
    }
    exports.concatFile = concatFile;
    function files(sources) {
        return new rx_29.Observable(subs => {
            Promise.all(sources.map(read)).then(out => {
                out.forEach(o => subs.next(o));
                subs.complete();
            }, e => subs.error(e));
        });
    }
    exports.files = files;
    function matchStat(fromPath, toPath) {
        return Promise.all([fs_2.promises.stat(fromPath), fs_2.promises.stat(toPath)]).then(([fromStat, toStat]) => fromStat.mtime.getTime() === toStat.mtime.getTime(), () => true);
    }
    exports.matchStat = matchStat;
    function copyDir(fromPath, toPath) {
        return (0, rx_29.defer)(() => (0, rx_29.from)((0, server_1.sh)(`rsync -au --delete ${fromPath}/* ${toPath}`)).mergeMap(() => rx_29.EMPTY));
    }
    exports.copyDir = copyDir;
    function getSourceMap(out) {
        const source = out.source.toString();
        const match = /\/\/# sourceMappingURL=(.+)/.exec(source);
        const path = match ? (0, path_4.resolve)((0, path_4.dirname)(out.path), match === null || match === void 0 ? void 0 : match[1]) : null;
        if (path)
            return { path: (0, path_4.basename)(path), source: (0, fs_2.readFileSync)(path) };
    }
    exports.getSourceMap = getSourceMap;
    exports.MinifyDefault = {
        ecma: 2019,
    };
    function minify(op) {
        return (source) => new rx_29.Observable(subscriber => {
            const config = { ...exports.MinifyDefault, ...op };
            const subscription = source.subscribe(async (out) => {
                const destPath = (0, path_4.basename)(out.path.replace(/\.js$/, '.min.js'));
                if (!config.sourceMap) {
                    const sourceMap = getSourceMap(out);
                    if (sourceMap)
                        config.sourceMap = {
                            content: sourceMap.source.toString(),
                            url: destPath + '.map',
                        };
                }
                const source = out.source.toString();
                const { code, map } = await Terser.minify(source, config);
                if (!code)
                    throw new Error('No code generated');
                subscriber.next({ path: destPath, source: Buffer.from(code) });
                if (map && config.sourceMap)
                    subscriber.next({
                        path: config.sourceMap.url,
                        source: Buffer.from(map.toString()),
                    });
                subscriber.complete();
            });
            return () => subscription.unsubscribe();
        });
    }
    exports.minify = minify;
    function zip(src, path) {
        return (0, builder_js_1.shell)(`zip - ${src.join(' ')}`).map(source => ({ path, source }));
    }
    exports.zip = zip;
});
define("cxl/build/npm", ["require", "exports", "cxl/build/index"], function (require, exports, index_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkNpm = exports.checkNpms = exports.getPublishedVersion = void 0;
    async function getPublishedVersion(packageName) {
        var _a;
        const info = await checkNpms(packageName);
        return ((_a = info === null || info === void 0 ? void 0 : info.collected) === null || _a === void 0 ? void 0 : _a.metadata.version) || undefined;
    }
    exports.getPublishedVersion = getPublishedVersion;
    async function checkNpms(name) {
        try {
            const out = await (0, index_js_1.sh)(`curl -s https://api.npms.io/v2/package/${name.replace('/', '%2f')}`);
            return JSON.parse(out.trim());
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    exports.checkNpms = checkNpms;
    async function checkNpm(name) {
        try {
            return JSON.parse((await (0, index_js_1.sh)(`npm show ${name} --json`)).trim());
        }
        catch (e) {
            console.error(e);
            return;
        }
    }
    exports.checkNpm = checkNpm;
});
define("cxl/build/package", ["require", "exports", "@cxl/rx", "fs", "path", "cxl/build/file", "child_process", "cxl/server/index", "cxl/build/npm", "typescript"], function (require, exports, rx_30, fs_3, path_5, file_js_1, child_process_2, server_2, npm_1, ts) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.template = exports.bundle = exports.AMD = exports.publish = exports.pkg = exports.readme = exports.getBranch = exports.docs = exports.readPackage = exports.BASEDIR = void 0;
    const SCRIPTDIR = process.cwd();
    exports.BASEDIR = (0, child_process_2.execSync)(`npm prefix`, { cwd: SCRIPTDIR })
        .toString()
        .trim();
    const LICENSE_MAP = {
        'GPL-3.0': 'license-GPL-3.0.txt',
        'GPL-3.0-only': 'license-GPL-3.0.txt',
        'Apache-2.0': 'license-Apache-2.0.txt',
        UNLICENSED: '',
    };
    let PACKAGE;
    function verifyFields(fields, pkg) {
        for (const f of fields)
            if (!pkg[f])
                throw new Error(`Field "${f}" missing in package.json`);
    }
    function readPackage(base = exports.BASEDIR) {
        if (PACKAGE)
            return PACKAGE;
        const pkg = base + '/package.json';
        if (!(0, fs_3.existsSync)(pkg))
            throw new Error('package.json not found');
        PACKAGE = JSON.parse((0, fs_3.readFileSync)(pkg, 'utf8'));
        verifyFields(['name', 'version', 'description'], PACKAGE);
        if (!PACKAGE.private)
            verifyFields(['license'], PACKAGE);
        return PACKAGE;
    }
    exports.readPackage = readPackage;
    function docs(dirName, devMode = false) {
        const docgen = (0, path_5.join)(__dirname, '../docgen');
        return new rx_30.Observable(subs => {
            (0, server_2.sh)(`node ${docgen} --clean ${devMode ? '--debug' : ''} -o ../docs/${dirName} --summary `).then(out => (console.log(out), subs.complete()), e => subs.error(e));
        });
    }
    exports.docs = docs;
    async function getBranch(cwd) {
        return (await (0, server_2.sh)('git rev-parse --abbrev-ref HEAD', { cwd }))
            .toString()
            .trim();
    }
    exports.getBranch = getBranch;
    function packageJson(p) {
        return (0, rx_30.of)({
            path: 'package.json',
            source: Buffer.from(JSON.stringify({
                name: p.name,
                version: p.version,
                description: p.description,
                private: p.private,
                license: p.license,
                files: [
                    '*.js',
                    '*.d.ts',
                    '*.js.map',
                    'amd/*.js',
                    'amd/*.d.ts',
                    'amd/*.js.map',
                    'es6/*.js',
                    'es6/*.d.ts',
                    'es6/*.js.map',
                    'LICENSE',
                    '*.md',
                ],
                main: 'index.js',
                browser: p.browser,
                homepage: p.homepage,
                bugs: p.bugs,
                bin: p.bin,
                repository: p.repository,
                dependencies: p.dependencies,
                peerDependencies: p.peerDependencies,
                bundledDependencies: p.bundledDependencies,
                type: p.type,
            }, null, 2)),
        });
    }
    function license(id) {
        if (id === 'UNLICENSED')
            return rx_30.EMPTY;
        const licenseFile = LICENSE_MAP[id];
        if (!licenseFile)
            throw new Error(`Invalid license: "${id}"`);
        return (0, file_js_1.file)((0, path_5.join)(__dirname, licenseFile), 'LICENSE');
    }
    function npmLink(pkgName, version) {
        return `https://npmjs.com/package/${pkgName}/v/${version}`;
    }
    function readIfExists(file) {
        try {
            return (0, fs_3.readFileSync)(file, 'utf8');
        }
        catch (E) {
            return '';
        }
    }
    function readme() {
        return (0, rx_30.defer)(() => {
            const pkg = readPackage(exports.BASEDIR);
            const extra = readIfExists('USAGE.md');
            const encodedName = encodeURIComponent(pkg.name);
            return (0, rx_30.of)({
                path: 'README.md',
                source: Buffer.from(`# ${pkg.name} 
	
[![npm version](https://badge.fury.io/js/${encodedName}.svg)](https://badge.fury.io/js/${encodedName})

${pkg.description}

## Project Details

-   Branch Version: [${pkg.version}](${npmLink(pkg.name, pkg.version)})
-   License: ${pkg.license}
-   Documentation: [Link](${pkg.homepage})
-   Report Issues: [Github](${pkg.bugs})

## Installation

	npm install ${pkg.name}

${extra}`),
            });
        });
    }
    exports.readme = readme;
    function pkg() {
        return (0, rx_30.defer)(() => {
            const p = readPackage();
            const licenseId = p.license;
            return (0, rx_30.from)((0, npm_1.getPublishedVersion)(p.name)).switchMap(version => {
                if (version === p.version)
                    throw new Error(`Package version ${p.version} already published.`);
                const output = [packageJson(p)];
                output.push((0, file_js_1.file)('README.md', 'README.md'));
                if (licenseId)
                    output.push(license(licenseId));
                return (0, rx_30.merge)(...output);
            });
        });
    }
    exports.pkg = pkg;
    async function publish() {
        const p = readPackage();
        const isPublished = await (0, npm_1.getPublishedVersion)(p.name);
        if (isPublished)
            throw new Error(`Package version already published.`);
    }
    exports.publish = publish;
    function createBundle(files, resolvedFiles, content, outFile, config) {
        const options = {
            lib: ['lib.es2017.d.ts'],
            target: ts.ScriptTarget.ES2019,
            module: ts.ModuleKind.AMD,
            allowJs: true,
            declaration: false,
            baseUrl: process.cwd(),
            outDir: process.cwd(),
            outFile: outFile,
            removeComments: true,
            isolatedModules: true,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            sourceMap: false,
            ...config,
        };
        const host = ts.createCompilerHost(options);
        const oldGetSourceFile = host.getSourceFile;
        const sourceFiles = [];
        host.getSourceFile = function (fn, target) {
            const i = resolvedFiles.indexOf(fn);
            if (i !== -1) {
                const sf = ts.createSourceFile(resolvedFiles[i], content[i], target);
                sf.moduleName = files[i];
                sourceFiles.push(sf);
                return sf;
            }
            return oldGetSourceFile.apply(this, arguments);
        };
        const program = ts.createProgram(resolvedFiles, options, host);
        let source = '';
        program.emit(undefined, (_a, b) => (source += b));
        return {
            path: outFile,
            source: Buffer.from(source),
        };
    }
    function AMD() {
        return (0, rx_30.defer)(() => (0, rx_30.of)({
            path: 'amd.js',
            source: (0, fs_3.readFileSync)(__dirname + '/amd.js'),
        }));
    }
    exports.AMD = AMD;
    function bundle(files, outFile, config) {
        return new rx_30.Observable(subs => {
            const moduleNames = Object.keys(files);
            const resolvedFiles = Object.values(files);
            Promise.all(resolvedFiles.map(f => fs_3.promises.readFile(f, 'utf8')))
                .then(content => {
                subs.next(createBundle(moduleNames, resolvedFiles, content, outFile, config));
                subs.complete();
            })
                .catch(e => subs.error(e));
        });
    }
    exports.bundle = bundle;
    const INDEX_HEAD = `<!DOCTYPE html><meta charset="utf-8"><script src="index.bundle.min.js"></script>`;
    const DEBUG_HEAD = `<!DOCTYPE html><meta charset="utf-8">
<script src="/cxl/dist/tester/require-browser.js"></script>
<script>
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		);
	};
	require('@cxl/ui');
	require('@cxl/ui-router');
	require('@cxl/ui-www');
</script>
`;
    const DefaultTemplateConfig = {
        header: INDEX_HEAD,
        debugHeader: DEBUG_HEAD,
    };
    const HTML_COMMENT_REGEX = /<!--[^]+?-->/gm;
    function template(filename, config = {}) {
        return (0, file_js_1.file)(filename).switchMap(({ source }) => {
            const prodSource = source
                .toString('utf8')
                .replace(HTML_COMMENT_REGEX, '');
            const cfg = { ...DefaultTemplateConfig, ...config };
            return (0, rx_30.from)([
                { path: 'index.html', source: `${cfg.header}\n${prodSource}` },
                { path: 'debug.html', source: `${cfg.debugHeader}\n${source}` },
            ]);
        });
    }
    exports.template = template;
});
define("cxl/build/builder", ["require", "exports", "path", "fs", "child_process", "cxl/server/index", "@cxl/rx", "cxl/build/tsc", "cxl/build/package"], function (require, exports, path_6, fs_4, child_process_3, server_3, rx_31, tsc_js_1, package_js_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shell = exports.exec = exports.build = exports.builder = exports.Builder = void 0;
    function kb(bytes) {
        return (bytes / 1000).toFixed(2) + 'kb';
    }
    class Build {
        constructor(builder, config) {
            this.builder = builder;
            this.config = config;
            this.outputDir = config.outputDir || '.';
        }
        writeOutput(result) {
            const outFile = (0, path_6.resolve)(this.outputDir, result.path);
            const source = result.source;
            const outputDir = (0, path_6.dirname)(outFile);
            if (!(0, fs_4.existsSync)(outputDir))
                (0, fs_4.mkdirSync)(outputDir);
            (0, fs_4.writeFileSync)(outFile, source);
            if (result.mtime)
                (0, fs_4.utimesSync)(outFile, result.mtime, result.mtime);
            return result;
        }
        runTask(task) {
            return this.builder.log((output) => `${(0, path_6.join)(this.outputDir, output.path)} ${kb((output.source || '').length)}`, task.tap(result => this.writeOutput(result)));
        }
        async build() {
            try {
                const pkg = this.builder.modulePackage;
                if (!pkg)
                    throw new Error('Invalid package');
                const target = this.config.target || `${pkg.name} ${pkg.version}`;
                this.builder.log(`target ${target}`);
                (0, child_process_3.execSync)(`mkdir -p ${this.outputDir}`);
                await Promise.all(this.config.tasks.map(task => this.runTask(task)));
            }
            catch (e) {
                this.builder.log(e);
                throw 'Build finished with errors';
            }
        }
    }
    class Builder extends server_3.Application {
        constructor() {
            super(...arguments);
            this.name = '@cxl/build';
            this.outputDir = '';
            this.hasErrors = false;
        }
        async run() {
            this.modulePackage = (0, package_js_1.readPackage)();
            if (package_js_1.BASEDIR !== process.cwd()) {
                process.chdir(package_js_1.BASEDIR);
                this.log(`chdir "${package_js_1.BASEDIR}"`);
            }
            this.log(`typescript ${tsc_js_1.tscVersion}`);
        }
        async build(config) {
            try {
                if (config.target && !process.argv.includes(config.target))
                    return;
                await new Build(this, config).build();
            }
            catch (e) {
                this.handleError(e);
            }
        }
    }
    exports.Builder = Builder;
    exports.builder = new Builder();
    async function build(...targets) {
        if (!targets)
            throw new Error('Invalid configuration');
        if (!exports.builder.started)
            await exports.builder.start();
        return await targets.reduce((result, config) => result.then(() => exports.builder.build(config)), Promise.resolve());
    }
    exports.build = build;
    function exec(cmd) {
        return new rx_31.Observable(subs => {
            exports.builder.log(`sh ${cmd}`, (0, server_3.sh)(cmd, { timeout: 10000 })).then(() => subs.complete(), e => subs.error(e));
        });
    }
    exports.exec = exec;
    function shell(cmd, options = {}) {
        return new rx_31.Observable(subs => {
            var _a, _b;
            const proc = (0, child_process_3.spawn)(cmd, [], { shell: true, ...options });
            let output;
            let error;
            (_a = proc.stdout) === null || _a === void 0 ? void 0 : _a.on('data', data => (output = output
                ? Buffer.concat([output, Buffer.from(data)])
                : Buffer.from(data)));
            (_b = proc.stderr) === null || _b === void 0 ? void 0 : _b.on('data', data => (error = error
                ? Buffer.concat([error, Buffer.from(data)])
                : Buffer.from(data)));
            proc.on('close', code => {
                if (code)
                    subs.error(error || output);
                else {
                    subs.next(output);
                    subs.complete();
                }
            });
        });
    }
    exports.shell = shell;
});
define("cxl/build/lint", ["require", "exports", "path", "eslint", "@cxl/rx", "cxl/build/builder"], function (require, exports, path_7, eslint_1, rx_32, builder_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.eslint = void 0;
    function handleEslintResult(results) {
        const result = [];
        let hasErrors = false;
        results.forEach(result => {
            const errorCount = result.errorCount;
            const file = (0, path_7.relative)(process.cwd(), result.filePath);
            builder_js_2.builder.log(`eslint ${file}`);
            if (errorCount) {
                hasErrors = true;
                result.messages.forEach(r => console.error(`${file}#${r.line}:${r.column}: ${r.message} (${r.ruleId})`));
            }
        });
        if (hasErrors)
            throw new Error('eslint errors found.');
        return result;
    }
    function eslint(options) {
        return new rx_32.Observable(subs => {
            const linter = new eslint_1.ESLint({
                cache: true,
                cwd: process.cwd(),
                ...options,
            });
            builder_js_2.builder.log(`eslint ${eslint_1.ESLint.version}`);
            builder_js_2.builder.log(`eslint`, linter
                .lintFiles(['**/*.ts?(x)'])
                .then(handleEslintResult)
                .then(() => subs.complete(), e => subs.error(e)));
        });
    }
    exports.eslint = eslint;
});
define("cxl/build/cxl", ["require", "exports", "path", "child_process", "fs", "@cxl/rx", "cxl/build/builder", "cxl/build/package", "cxl/build/file", "cxl/build/lint", "cxl/build/tsc"], function (require, exports, path_8, child_process_4, fs_5, rx_33, builder_js_3, package_js_2, file_js_2, lint_js_1, tsc_js_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildCxl = exports.minifyIf = void 0;
    function minifyIf(filename) {
        return (0, rx_33.mergeMap)((out) => out.path === filename
            ? (0, rx_33.concat)((0, rx_33.of)(out), (0, file_js_2.file)(out.path).pipe((0, file_js_2.minify)()))
            : (0, rx_33.of)(out));
    }
    exports.minifyIf = minifyIf;
    function buildCxl(...extra) {
        var _a;
        const packageJson = (0, package_js_2.readPackage)();
        const cwd = process.cwd();
        const tsconfigFile = require(cwd + '/tsconfig.json');
        const outputDir = (_a = tsconfigFile === null || tsconfigFile === void 0 ? void 0 : tsconfigFile.compilerOptions) === null || _a === void 0 ? void 0 : _a.outDir;
        if (!outputDir)
            throw new Error('No outDir field set in tsconfig.json');
        const dirName = (0, path_8.basename)(outputDir);
        return (0, builder_js_3.build)({
            target: 'clean',
            outputDir,
            tasks: [
                (0, rx_33.observable)(() => {
                    (0, child_process_4.execSync)(`rm -rf ${outputDir}`);
                }),
            ],
        }, {
            outputDir,
            tasks: [
                (0, file_js_2.file)('index.html', 'index.html').catchError(() => rx_33.EMPTY),
                (0, file_js_2.file)('debug.html', 'debug.html').catchError(() => rx_33.EMPTY),
                (0, file_js_2.file)('icons.svg', 'icons.svg').catchError(() => rx_33.EMPTY),
                (0, file_js_2.file)('favicon.ico', 'favicon.ico').catchError(() => rx_33.EMPTY),
                (0, file_js_2.file)('test.html', 'test.html').catchError(() => (0, rx_33.of)({
                    path: 'test.html',
                    source: Buffer.from(`<!DOCTYPE html>
<script type="module" src="/cxl/dist/tester/require-browser.js"></script>
<script type="module">
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/dbg\\.(.+)/,
			(str, p1) =>
				\`/debuggerjs/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		).replace(
			/^@j5g3\\/(.+)/,
			(str, p1) =>
				\`/j5g3/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		)
		.replace(
			/^@cxl\\/workspace\\.(.+)/,
			(str, p1) =>
				\`/cxl.app/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		)
		.replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/$\{
					str.endsWith('.js') ? p1 : p1 + '/index.js'
				}\`
		);
	};
	const browserRunner = require('/cxl/dist/tester/browser-runner.js').default;

	const suite = require('./test.js').default;
	browserRunner.run([suite], '../../${dirName}/spec');
</script>`),
                })),
                (0, tsc_js_2.tsconfig)('tsconfig.test.json'),
            ],
        }, {
            target: 'package',
            outputDir: '.',
            tasks: [(0, package_js_2.readme)()],
        }, {
            target: 'package',
            outputDir,
            tasks: [
                (0, lint_js_1.eslint)({ resolvePluginsRelativeTo: __dirname }),
                packageJson.browser
                    ? (0, file_js_2.file)(`${outputDir}/index.js`).pipe((0, file_js_2.minify)())
                    : rx_33.EMPTY,
                (0, package_js_2.pkg)(),
            ],
        }, ...((0, fs_5.existsSync)('tsconfig.amd.json')
            ? [
                {
                    target: 'package',
                    outputDir: outputDir + '/amd',
                    tasks: [
                        (0, tsc_js_2.tsconfig)('tsconfig.amd.json'),
                        packageJson.browser
                            ? (0, file_js_2.file)(`${outputDir}/amd/index.js`).pipe((0, file_js_2.minify)())
                            : rx_33.EMPTY,
                    ],
                },
            ]
            : []), ...((0, fs_5.existsSync)('tsconfig.mjs.json')
            ? [
                {
                    target: 'package',
                    outputDir: outputDir + '/mjs',
                    tasks: [
                        (0, tsc_js_2.tsconfig)('tsconfig.mjs.json'),
                        packageJson.browser
                            ? (0, file_js_2.file)(`${outputDir}/mjs/index.js`).pipe((0, file_js_2.minify)())
                            : rx_33.EMPTY,
                    ],
                },
            ]
            : []), ...((0, fs_5.existsSync)('tsconfig.bundle.json')
            ? [
                {
                    target: 'package',
                    outputDir: outputDir,
                    tasks: [
                        (0, rx_33.concat)((0, tsc_js_2.tsconfig)('tsconfig.bundle.json'), (0, file_js_2.file)(`${outputDir}/index.bundle.js`).pipe((0, file_js_2.minify)())),
                    ],
                },
            ]
            : []), {
            target: 'docs',
            outputDir: '.',
            tasks: [(0, package_js_2.docs)(dirName)],
        }, {
            target: 'docs-dev',
            outputDir: '.',
            tasks: [(0, package_js_2.docs)(dirName, true)],
        }, ...extra);
    }
    exports.buildCxl = buildCxl;
});
define("cxl/build/index", ["require", "exports", "cxl/build/cxl", "cxl/build/tsc", "cxl/build/file", "@cxl/rx", "cxl/server/index", "cxl/build/package", "cxl/build/cxl", "cxl/build/builder"], function (require, exports, cxl_js_1, tsc_js_3, file_js_3, rx_34, server_4, package_js_3, cxl_js_2, builder_js_4) {
    "use strict";
    var _a;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shell = exports.exec = exports.build = exports.buildCxl = exports.getBranch = exports.template = exports.bundle = exports.readme = exports.pkg = exports.AMD = exports.sh = exports.mkdirp = exports.concat = exports.zip = exports.minify = exports.copyDir = exports.concatFile = exports.files = exports.file = exports.basename = exports.tsBundle = exports.tsconfig = void 0;
    Object.defineProperty(exports, "tsconfig", { enumerable: true, get: function () { return tsc_js_3.tsconfig; } });
    Object.defineProperty(exports, "tsBundle", { enumerable: true, get: function () { return tsc_js_3.bundle; } });
    Object.defineProperty(exports, "basename", { enumerable: true, get: function () { return file_js_3.basename; } });
    Object.defineProperty(exports, "file", { enumerable: true, get: function () { return file_js_3.file; } });
    Object.defineProperty(exports, "files", { enumerable: true, get: function () { return file_js_3.files; } });
    Object.defineProperty(exports, "concatFile", { enumerable: true, get: function () { return file_js_3.concatFile; } });
    Object.defineProperty(exports, "copyDir", { enumerable: true, get: function () { return file_js_3.copyDir; } });
    Object.defineProperty(exports, "minify", { enumerable: true, get: function () { return file_js_3.minify; } });
    Object.defineProperty(exports, "zip", { enumerable: true, get: function () { return file_js_3.zip; } });
    Object.defineProperty(exports, "concat", { enumerable: true, get: function () { return rx_34.concat; } });
    Object.defineProperty(exports, "mkdirp", { enumerable: true, get: function () { return server_4.mkdirp; } });
    Object.defineProperty(exports, "sh", { enumerable: true, get: function () { return server_4.sh; } });
    Object.defineProperty(exports, "AMD", { enumerable: true, get: function () { return package_js_3.AMD; } });
    Object.defineProperty(exports, "pkg", { enumerable: true, get: function () { return package_js_3.pkg; } });
    Object.defineProperty(exports, "readme", { enumerable: true, get: function () { return package_js_3.readme; } });
    Object.defineProperty(exports, "bundle", { enumerable: true, get: function () { return package_js_3.bundle; } });
    Object.defineProperty(exports, "template", { enumerable: true, get: function () { return package_js_3.template; } });
    Object.defineProperty(exports, "getBranch", { enumerable: true, get: function () { return package_js_3.getBranch; } });
    Object.defineProperty(exports, "buildCxl", { enumerable: true, get: function () { return cxl_js_2.buildCxl; } });
    Object.defineProperty(exports, "build", { enumerable: true, get: function () { return builder_js_4.build; } });
    Object.defineProperty(exports, "exec", { enumerable: true, get: function () { return builder_js_4.exec; } });
    Object.defineProperty(exports, "shell", { enumerable: true, get: function () { return builder_js_4.shell; } });
    if (((_a = require.main) === null || _a === void 0 ? void 0 : _a.filename) === __filename)
        (0, cxl_js_1.buildCxl)();
});
define("cxl/blog/index", ["require", "exports", "fs/promises", "@cxl/rx", "markdown-it", "highlight.js"], function (require, exports, promises_2, rx_35, MarkdownIt, hljs) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildBlog = exports.renderMarkdown = void 0;
    const POST_REGEX = /\.(html|md)$/, TITLE_REGEX = /<blog-title>(.+)<\/blog-title>/, META_REGEX = /<blog-meta([^>]+?)>/, TAGS_REGEX = /<blog-tags>\s*(.+?)\s*</, SUMMARY_TAG_REGEX = /<blog-summary>\s*([^]+?)\s*</m, SUMMARY_REGEX = /<p>\s*([^]+?)\s*<\/p/m, ATTR_REGEX = /\s*([\w-]+)\s*=\s*"([^"]+)"/g;
    const DefaultConfig = {
        postsDir: 'posts',
    };
    function Code(source, language) {
        return `<blog-code language="${language || ''}"><!--${source}--></blog-code>`;
    }
    function CodeHighlight(source, language) {
        return ('<pre><code class="hljs">' +
            (language
                ? hljs.highlight(language, source)
                : hljs.highlightAuto(source, [
                    'html',
                    'typescript',
                    'javascript',
                    'css',
                ])).value +
            '</code></pre>');
    }
    const markdownMeta = /^(\w+):\s*(.+)\s*/gm;
    function getMetaValue(key, val) {
        return key === 'date' ? new Date(val).toISOString() : val;
    }
    const FenceHandler = {
        meta(content, meta) {
            let m;
            while ((m = markdownMeta.exec(content))) {
                meta[m[1]] = getMetaValue(m[1], m[2]);
            }
            return meta.tags ? `<blog-tags>${meta.tags}</blog-tags>` : '';
        },
        demo(content) {
            return `<blog-demo><!--${content}--></blog-demo>`;
        },
    };
    function renderMarkdown(source, config) {
        const highlight = (config === null || config === void 0 ? void 0 : config.highlight) ? CodeHighlight : Code;
        const md = new MarkdownIt({
            highlight,
            html: true,
        });
        const rules = md.renderer.rules;
        const map = {
            h1: 'h3',
            h2: 'h4',
            h3: 'h5',
            h4: 'h6',
        };
        const meta = {};
        rules.heading_open = (tokens, idx) => {
            const tag = tokens[idx].tag;
            return tag === 'h1' ? `<blog-title>` : `<cxl-t ${map[tag]}>`;
        };
        rules.heading_close = (tokens, idx) => {
            const tag = tokens[idx].tag;
            return tag === 'h1' ? `</blog-title>` : `</cxl-t>`;
        };
        rules.code_block = (tokens, idx) => highlight(tokens[idx].content);
        rules.fence = (tokens, idx) => {
            const token = tokens[idx];
            const handler = FenceHandler[token.info];
            return handler
                ? handler(token.content, meta)
                : highlight(token.content);
        };
        return { meta, content: md.render(source) };
    }
    exports.renderMarkdown = renderMarkdown;
    function parseMeta(content) {
        var _a;
        const meta = (_a = content.match(META_REGEX)) === null || _a === void 0 ? void 0 : _a[1];
        if (!meta)
            return undefined;
        const result = {};
        let attrs;
        while ((attrs = ATTR_REGEX.exec(meta))) {
            const val = attrs[1] === 'date' ? new Date(attrs[2]).toISOString() : attrs[2];
            result[attrs[1]] = val;
        }
        return result;
    }
    function getPostId(title) {
        return title.replace(/[ /]/g, '-').toLowerCase();
    }
    function Html(_url, content, stat) {
        var _a, _b, _c, _d;
        const meta = parseMeta(content) || {};
        const tags = ((_a = content.match(TAGS_REGEX)) === null || _a === void 0 ? void 0 : _a[1]) || meta.tags;
        const title = ((_b = content.match(TITLE_REGEX)) === null || _b === void 0 ? void 0 : _b[1]) || meta.title || 'Untitled Post';
        const summary = ((_c = content.match(SUMMARY_TAG_REGEX)) === null || _c === void 0 ? void 0 : _c[1]) ||
            meta.summary ||
            ((_d = content.match(SUMMARY_REGEX)) === null || _d === void 0 ? void 0 : _d[1]) ||
            '';
        return {
            id: getPostId(title),
            title,
            summary,
            date: meta.date,
            version: meta.version,
            uuid: meta.uuid || '',
            mtime: stat.mtime.toISOString(),
            author: meta.author || '',
            type: meta.type || 'post',
            tags,
            href: meta.href,
            content,
        };
    }
    async function buildPosts(config, posts) {
        const HEADER = config.headerTemplate
            ? await (0, promises_2.readFile)(config.headerTemplate)
            : '';
        return posts.map(p => ({
            path: p.id,
            source: Buffer.from(`${HEADER}${p.content}`),
        }));
    }
    async function build(config) {
        function Markdown(url, source, stats) {
            var _a, _b;
            const { meta, content } = renderMarkdown(source, config);
            const title = ((_a = source.match(/^#\s+(.+)/)) === null || _a === void 0 ? void 0 : _a[1].trim()) || url.replace(/\.md$/, '');
            const summary = meta.summary || ((_b = content.match(SUMMARY_REGEX)) === null || _b === void 0 ? void 0 : _b[1]) || '';
            return {
                id: getPostId(title),
                title,
                summary,
                date: meta.date || stats.mtime.toISOString(),
                version: meta.version,
                uuid: meta.uuid || '',
                mtime: stats.mtime.toISOString(),
                author: meta.author || '',
                type: meta.type || (meta.date ? 'post' : 'draft'),
                tags: meta.tags || '',
                href: meta.href,
                content,
            };
        }
        async function getPostData(url) {
            const [source, stats] = await Promise.all([
                (0, promises_2.readFile)(url, 'utf8'),
                (0, promises_2.stat)(url),
            ]);
            return url.endsWith('.md')
                ? Markdown(url, source, stats)
                : Html(url, source, stats);
        }
        async function buildFromSource(postsDir) {
            const files = (await (0, promises_2.readdir)(postsDir)).filter(f => POST_REGEX.test(f));
            return await Promise.all(files.map(f => getPostData(`${postsDir}/${f}`)));
        }
        const postsDir = config.postsDir || DefaultConfig.postsDir;
        const posts = Array.isArray(postsDir)
            ? (await Promise.all(postsDir.map(buildFromSource))).flat()
            : await buildFromSource(postsDir);
        const postsFiles = await buildPosts(config, posts);
        const tags = {};
        const types = new Set();
        posts
            .sort((a, b) => (a.date > b.date ? -1 : 1))
            .forEach(a => {
            const typeTags = tags[a.type] || (tags[a.type] = []);
            if (a.tags)
                for (const tag of a.tags.split(' '))
                    if (!typeTags.includes(tag))
                        typeTags.push(tag);
            types.add(a.type);
        });
        const postsJson = {
            posts: config.includeContent
                ? posts
                : posts.map(p => ({ ...p, content: undefined })),
            tags,
            types: Array.from(types),
        };
        return [
            {
                path: 'posts.json',
                source: Buffer.from(JSON.stringify(postsJson)),
            },
            ...postsFiles,
        ];
    }
    function buildBlog(config) {
        return (0, rx_35.observable)(subs => {
            build(config).then(out => {
                out.forEach(o => subs.next(o));
                subs.complete();
            });
        });
    }
    exports.buildBlog = buildBlog;
});
define("cxl/www/build-data", ["require", "exports", "fs/promises", "cxl/build/npm", "path", "cxl/blog/index"], function (require, exports, fs, npm_js_1, path_9, blog_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function getType(pkg) {
        var _a;
        if (pkg.bin)
            return 'app';
        if (/\/ui.*/.test(pkg.name))
            return 'kit';
        if ((_a = pkg.keywords) === null || _a === void 0 ? void 0 : _a[0])
            return pkg.keywords[0];
        return 'library';
    }
    function getDescription(component) {
        var _a, _b, _c, _d;
        const value = (_c = (_b = (_a = component.docs) === null || _a === void 0 ? void 0 : _a.content) === null || _b === void 0 ? void 0 : _b.find(c => !c.tag)) === null || _c === void 0 ? void 0 : _c.value;
        return ((_d = value === null || value === void 0 ? void 0 : value.split('.')) === null || _d === void 0 ? void 0 : _d[0]) || '';
    }
    async function findExample(pkg, entry) {
        if (pkg.browser && entry.docs && entry.docs.content)
            for (const content of entry.docs.content) {
                if (content.tag === 'demo' || content.tag === 'example') {
                    return ((pkg.name !== '@cxl/ui'
                        ? `<script src="assets/@cxl-ui-index.bundle.min.js"></script>`
                        : '') +
                        `<script src="assets/${pkg.name.replace(/\//g, '-')}-${(0, path_9.basename)(pkg.browser)}"></script><body style="overflow:hidden;font-family:var(--cxl-font);margin:16px 16px 0 16px;text-align:center">${content.value}</body>`);
                }
            }
    }
    async function findComponents(_dir, projectName, pkg, result) {
        var _a;
        const path = `./docs/${projectName}/summary.json`;
        try {
            const docs = JSON.parse(await fs.readFile(path, 'utf8'));
            for (const doc of docs) {
                if ((_a = doc.docs) === null || _a === void 0 ? void 0 : _a.tagName) {
                    const description = getDescription(doc);
                    const demo = await findExample(pkg, doc);
                    if (demo) {
                        result.push({
                            id: doc.name,
                            name: doc.name,
                            version: '',
                            license: pkg.license,
                            package: pkg.name,
                            links: {
                                homepage: pkg.homepage,
                            },
                            type: 'component',
                            description,
                            screenshot: demo
                                ? `assets/${doc.name}-example.png`
                                : undefined,
                            demo,
                            search: `${doc.name} ${description}`,
                        });
                    }
                }
            }
        }
        catch (e) {
            console.error(`Could not generate component data for "${pkg.name}"`);
            console.error(e);
        }
    }
    async function processPackage(dir, name, result) {
        var _a;
        const path = `${dir}/${name}`;
        try {
            const pkg = JSON.parse(await fs.readFile(`${path}/package.json`, 'utf8'));
            if (!pkg.private) {
                const npms = await (0, npm_js_1.checkNpms)(pkg.name);
                const published = (_a = npms === null || npms === void 0 ? void 0 : npms.collected) === null || _a === void 0 ? void 0 : _a.metadata;
                if (!published)
                    return console.log(`Ignoring unpublished package ${pkg.name} ${pkg.version}`);
                const keywords = pkg.keywords || ['library'];
                const id = pkg.name.replace(/\//g, '-');
                result.push({
                    id,
                    name: pkg.name,
                    version: published.version,
                    description: pkg.description,
                    license: published.license,
                    links: published.links,
                    browserScript: pkg.browser,
                    keywords,
                    search: `${pkg.name} ${pkg.description} ${keywords.join(' ')}`,
                    type: getType(pkg),
                });
                if (pkg.browser)
                    await fs
                        .readFile(`${path}/${pkg.browser}`, 'utf8')
                        .then(src => fs.writeFile(`./dist/www/assets/${pkg.name.replace(/\//g, '-')}-${(0, path_9.basename)(pkg.browser)}`, src));
                if (published.readme)
                    published.readmeHtml = (0, blog_1.renderMarkdown)(published.readme).content;
                await fs.writeFile(`./dist/store/data/${id}.json`, JSON.stringify(npms.collected));
                await findComponents(dir, name, pkg, result);
            }
            else
                console.log(`Ignoring private project ${path}`);
        }
        catch (e) {
            console.error(e);
            console.error(`Ignoring ${path}`);
        }
    }
    const TemplateDir = '../cxl.app/templates';
    const MetaRegex = /^<!--[^]*-->/m;
    const MetaLineRegex = /^(.+)\s*:\s*(.+)$/gm;
    async function processTemplate(name) {
        var _a;
        const file = `${TemplateDir}/${name}`;
        const source = await fs.readFile(file, 'utf8');
        const id = name.replace(/\.html$/, '');
        const meta = (_a = MetaRegex.exec(source)) === null || _a === void 0 ? void 0 : _a[0];
        const result = {};
        let match;
        if (meta)
            while ((match = MetaLineRegex.exec(meta))) {
                result[match[1]] = match[2];
            }
        return {
            id,
            name: result.title || id,
            license: 'UNLICENSED',
            screenshot: `assets/${id}-template.png`,
            description: result.description || '',
            type: 'template',
            search: (result.description || '') + (result.title || ''),
        };
    }
    async function findTemplates(dir, result) {
        const templates = await fs.readdir(dir);
        const promises = [];
        for (const tpl of templates) {
            if (tpl.endsWith('.html')) {
                promises.push(processTemplate(tpl));
            }
        }
        result.push(...(await Promise.all(promises)));
        return result;
    }
    async function findProjects(dir) {
        const result = [];
        const dirs = await fs.readdir(dir);
        for (const name of dirs) {
            const path = `${dir}/${name}`;
            if ((await fs.stat(path)).isDirectory()) {
                await processPackage(dir, name, result);
            }
        }
        await findTemplates(TemplateDir, result);
        return result;
    }
    function getStats(products) {
        const stats = {
            components: 0,
            libraries: 0,
            kits: 0,
            templates: 0,
        };
        products.forEach(p => {
            if (p.type === 'component')
                stats.components++;
            else if (p.type === 'kit')
                stats.kits++;
            else if (p.type === 'library')
                stats.libraries++;
            else if (p.type === 'template')
                stats.templates++;
        });
        return stats;
    }
    async function buildList() {
        const products = [...(await findProjects('./dist'))];
        const json = {
            products,
            stats: getStats(products),
        };
        await fs.writeFile('./docs/data.json', JSON.stringify(json));
    }
    buildList();
});
//# sourceMappingURL=index.bundle.js.map