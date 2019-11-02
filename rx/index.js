(exports=>{
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
        this.subscriber = subscriber;
        this.isUnsubscribed = false;
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
    static create(A) {
        return new this(A);
    }
    __subscribe(_subscription) {
        return () => { };
    }
    constructor(subscribe) {
        if (subscribe)
            this.__subscribe = subscribe;
    }
    pipe(operator, ...extra) {
        return extra
            ? extra.reduce((prev, fn) => fn(prev), operator(this))
            : operator(this);
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
    on(type, callback, scope) {
        return this.addEventListener(type, callback, scope);
    }
    off(type, callback, scope) {
        return this.removeEventListener(type, callback, scope);
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
            this.__handlers[type].forEach(handler => {
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
    trigger(type, ...args) {
        return this.emit(type, ...args);
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
        const subscription = source.subscribe(fn(subscriber));
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
const operators = {
    map,
    tap,
    filter,
    distinctUntilChanged
};
exports.operators = operators;

})(typeof exports==='undefined' ?
		(this.cxl || (this.cxl={})).rx = {} :
		exports);