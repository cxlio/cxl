"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Subscriber {
    constructor(observer = () => { }, error, complete) {
        if (observer && typeof observer !== 'function') {
            error = observer.error && observer.error.bind(observer);
            complete = observer.complete && observer.complete.bind(observer);
            observer = observer.next && observer.next.bind(observer);
        }
        this.next = observer;
        this.error = error;
        this.complete = complete;
    }
}
exports.Subscriber = Subscriber;
class Subscription {
    constructor(subscriber, subscribe) {
        this.isUnsubscribed = false;
        this.subscriber = subscriber;
        try {
            this.onUnsubscribe = subscribe(this);
        }
        catch (e) {
            this.error(e);
        }
    }
    next(val) {
        const subscriber = this.subscriber;
        try {
            if (!this.isUnsubscribed && subscriber.next)
                subscriber.next(val);
        }
        catch (e) {
            this.error(e);
        }
    }
    error(e) {
        const subscriber = this.subscriber;
        if (!this.isUnsubscribed && subscriber.error)
            subscriber.error(e);
        this.unsubscribe();
    }
    complete() {
        const subscriber = this.subscriber;
        if (!this.isUnsubscribed && subscriber.complete)
            subscriber.complete();
        this.unsubscribe();
    }
    unsubscribe() {
        this.isUnsubscribed = true;
        if (this.onUnsubscribe)
            this.onUnsubscribe();
    }
}
exports.Subscription = Subscription;
class Observable {
    constructor(subscribe) {
        if (subscribe)
            this.__subscribe = subscribe;
    }
    static create(A) {
        return new this(A);
    }
    __subscribe(_subscription) {
        return () => { };
    }
    pipe(...extra) {
        return extra.reduce((prev, fn) => fn(prev), this);
    }
    subscribe(observer, error, complete) {
        const subscriber = new Subscriber(observer, error, complete);
        return new Subscription(subscriber, this.__subscribe.bind(this));
    }
}
exports.Observable = Observable;
class Subject extends Observable {
    constructor() {
        super((subscription) => this.onSubscribe(subscription));
        this.subscriptions = new Set();
    }
    onSubscribe(subscriber) {
        this.subscriptions.add(subscriber);
        return () => this.subscriptions.delete(subscriber);
    }
    next(a) {
        this.subscriptions.forEach(s => s.next(a));
    }
    error(e) {
        this.subscriptions.forEach(s => s.error(e));
    }
    complete() {
        this.subscriptions.forEach(s => s.complete());
    }
}
exports.Subject = Subject;
class BehaviorSubject extends Subject {
    constructor(value) {
        super();
        this.value = value;
    }
    onSubscribe(subscription) {
        if (this.value !== undefined)
            subscription.next(this.value);
        return super.onSubscribe(subscription);
    }
    next(val) {
        this.value = val;
        super.next(val);
    }
}
exports.BehaviorSubject = BehaviorSubject;
class Event {
    constructor(type, target, value) {
        this.type = type;
        this.target = target;
        this.value = value;
    }
}
exports.Event = Event;
class Item {
    constructor(value, key, next) {
        this.value = value;
        this.key = key;
        this.next = next;
    }
}
exports.Item = Item;
class CollectionEvent {
    constructor(target, type, value, nextValue) {
        this.target = target;
        this.type = type;
        this.value = value;
        this.nextValue = nextValue;
    }
}
exports.CollectionEvent = CollectionEvent;
class EventEmitter {
    constructor() {
        this.on = this.addEventListener;
        this.off = this.removeEventListener;
        this.trigger = this.emit;
    }
    addEventListener(type, callback, scope) {
        if (!this.__handlers)
            this.__handlers = {};
        if (!this.__handlers[type])
            this.__handlers[type] = [];
        this.__handlers[type].push({ fn: callback, scope: scope });
        return { unsubscribe: this.off.bind(this, type, callback, scope) };
    }
    removeEventListener(type, callback, scope) {
        const handlers = this.__handlers && this.__handlers[type];
        if (!handlers)
            throw new Error('Invalid arguments');
        const h = handlers &&
            handlers.find(h => h.fn === callback && h.scope === scope), i = handlers.indexOf(h);
        if (i === -1)
            throw new Error('Invalid listener');
        handlers.splice(i, 1);
    }
    $eachHandler(type, fn) {
        if (this.__handlers && this.__handlers[type])
            this.__handlers[type].slice().forEach(handler => {
                try {
                    fn(handler);
                }
                catch (e) {
                    if (type !== 'error')
                        this.trigger('error', e);
                    else
                        throw e;
                }
            });
    }
    emit(type, ...args) {
        this.$eachHandler(type, handler => handler.fn.call(handler.scope, ...args));
    }
    emitAndCollect(type, ...args) {
        const result = [];
        this.$eachHandler(type, handler => result.push(handler.fn.call(handler.scope, ...args)));
        return result;
    }
    once(type, callback, scope) {
        const subscriber = this.on(type, (...args) => {
            subscriber.unsubscribe();
            return callback.call(scope, ...args);
        });
    }
}
exports.EventEmitter = EventEmitter;
function concat(...observables) {
    return new Observable(subscriber => {
        let subscription;
        function onComplete() {
            const next = observables.shift();
            if (next)
                subscription = next.subscribe({
                    next(val) {
                        subscriber.next(val);
                    },
                    error(err) {
                        subscriber.error(err);
                    },
                    complete: onComplete
                });
            else
                subscriber.complete();
        }
        onComplete();
        return () => {
            if (subscription)
                subscription.unsubscribe();
        };
    });
}
exports.concat = concat;
function from(input) {
    if (input instanceof Observable)
        return input;
    return new Observable(subs => {
        if (Array.isArray(input)) {
            input.forEach(item => subs.next(item));
            subs.complete();
        }
        else {
            input.then(result => {
                subs.next(result);
                subs.complete();
            }, err => subs.error(err));
        }
    });
}
exports.from = from;
function of(...values) {
    return new Observable(subscriber => {
        values.forEach(val => subscriber.next(val));
        subscriber.complete();
    });
}
exports.of = of;
function toPromise(observable) {
    return new Promise((resolve, reject) => {
        let value;
        observable.subscribe((val) => (value = val), (e) => reject(e), () => resolve(value));
    });
}
exports.toPromise = toPromise;
function operator(fn) {
    return (source) => new Observable(subscriber => {
        const subscription = source.subscribe(fn(subscriber), subscriber.error.bind(subscriber), subscriber.complete.bind(subscriber));
        return subscription.unsubscribe.bind(subscription);
    });
}
exports.operator = operator;
function map(mapFn) {
    return operator(subscriber => (val) => {
        subscriber.next(mapFn(val));
    });
}
exports.map = map;
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
function debounceTime(time) {
    return operator(subscriber => debounceFunction(subscriber.next.bind(subscriber), time));
}
exports.debounceTime = debounceTime;
function mergeMap(project) {
    let lastSubscription;
    return operator(subscriber => (val) => {
        if (lastSubscription)
            lastSubscription.unsubscribe();
        const newObservable = project(val);
        lastSubscription = newObservable.subscribe(val => subscriber.next(val));
    });
}
exports.mergeMap = mergeMap;
function filter(fn) {
    return operator((subscriber) => (val) => {
        if (fn(val))
            subscriber.next(val);
    });
}
exports.filter = filter;
function tap(fn) {
    return operator((subscriber) => (val) => {
        fn(val);
        subscriber.next(val);
    });
}
exports.tap = tap;
function catchError(selector) {
    function subscribe(source, subscriber) {
        const subscription = source.subscribe(subscriber.next.bind(subscriber), (err) => {
            let result;
            try {
                result = selector(err, source);
            }
            catch (err2) {
                return subscriber.error(err2);
            }
            subscribe(result, subscriber);
        }, subscriber.complete.bind(subscriber));
        return subscription.unsubscribe.bind(subscription);
    }
    return (source) => new Observable(subscriber => subscribe(source, subscriber));
}
exports.catchError = catchError;
function distinctUntilChanged() {
    let lastValue;
    return operator((subscriber) => (val) => {
        if (val !== lastValue) {
            lastValue = val;
            subscriber.next(val);
        }
    });
}
exports.distinctUntilChanged = distinctUntilChanged;
function merge(...observables) {
    return new Observable(subs => {
        let refCount = observables.length;
        const subscriptions = observables.map(o => o.subscribe({
            next(val) {
                subs.next(val);
            },
            error(e) {
                subs.error(e);
            },
            complete() {
                if (refCount-- === 0)
                    subs.complete();
            }
        }));
        return () => subscriptions.forEach(s => s.unsubscribe());
    });
}
exports.merge = merge;
function combineLatest(...observables) {
    return new Observable(subs => {
        const latest = [], len = observables.length;
        let count = 0, isReady = false;
        const subscriptions = observables.map((o, i) => o.subscribe({
            next(val) {
                latest[i] = val;
                if (isReady || count + 1 === len) {
                    const clone = latest.slice(0);
                    isReady = true;
                    subs.next(clone);
                }
                else
                    count++;
            },
            error(e) {
                subs.error(e);
            },
            complete() {
                if (isReady && --count === 0)
                    subs.complete();
            }
        }));
        return () => subscriptions.forEach(s => s.unsubscribe());
    });
}
exports.combineLatest = combineLatest;
function throwError(error) {
    return new Observable(subs => subs.error(error));
}
exports.throwError = throwError;
exports.EMPTY = new Observable(subs => subs.complete());
const operators = {
    catchError,
    debounceTime,
    distinctUntilChanged,
    map,
    tap,
    filter
};
exports.operators = operators;
