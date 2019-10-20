declare type ObservableError = any;
declare type NextFunction<T> = (val: T) => void;
declare type ErrorFunction = (err: ObservableError) => void;
declare type CompleteFunction = () => void;
declare type UnsubscribeFunction = () => void;
declare type SubscribeFunction<T> = (subscription: Subscription<T>) => UnsubscribeFunction | void;
declare type EventCallback = (...args: any) => void;
export declare type Operator<T> = (observable: Observable<T>) => Observable<T>;
interface Observer<T> {
    next: NextFunction<T>;
    error: ErrorFunction;
    complete: CompleteFunction;
}
declare type NextObserver<T> = NextFunction<T> | Observer<T> | undefined;
declare class Subscriber<T> {
    next: NextFunction<T>;
    error: ErrorFunction | undefined;
    complete: CompleteFunction | undefined;
    constructor(observer?: NextObserver<T>, error?: ErrorFunction, complete?: CompleteFunction);
}
export declare class Subscription<T> {
    private subscriber;
    isUnsubscribed: boolean;
    onUnsubscribe: UnsubscribeFunction | void;
    constructor(subscriber: Subscriber<T>, subscribe: SubscribeFunction<T>);
    next(val: T): void;
    error(e: ObservableError): void;
    complete(): void;
    unsubscribe(): void;
}
declare class Observable<T> {
    static create<T2>(A: any): Observable<T2>;
    protected __subscribe(_subscription?: Subscription<T>): UnsubscribeFunction | void;
    constructor(subscribe?: SubscribeFunction<T>);
    pipe(operator: Operator<T>, ...extra: Operator<T>[]): Observable<T>;
    subscribe(observer?: NextObserver<T>, error?: ErrorFunction, complete?: CompleteFunction): Subscription<T>;
}
declare class Subject<T> extends Observable<T> {
    protected subscriptions: Set<Subscription<T>>;
    protected onSubscribe(subscriber: Subscription<T>): UnsubscribeFunction;
    constructor();
    next(a: T): void;
    error(e: ObservableError): void;
    complete(): void;
}
declare class BehaviorSubject<T> extends Subject<T> {
    value?: T | undefined;
    constructor(value?: T | undefined);
    protected onSubscribe(subscription: Subscription<T>): UnsubscribeFunction;
    next(val: T): void;
}
declare class Event {
    type: string;
    target: any;
    value: any;
    constructor(type: string, target: any, value: any);
}
declare class Item {
    value: any;
    key: string;
    next: any;
    constructor(value: any, key: string, next: any);
}
declare class CollectionEvent {
    target: any;
    type: string;
    value: any;
    nextValue: any;
    constructor(target: any, type: string, value: any, nextValue: any);
}
declare class EventEmitter {
    private __handlers;
    on(type: string, callback: EventCallback, scope?: any): {
        unsubscribe: () => void;
    };
    off(type: string, callback: EventCallback, scope?: any): void;
    addEventListener(type: string, callback: EventCallback, scope?: any): {
        unsubscribe: () => void;
    };
    removeEventListener(type: string, callback: EventCallback, scope?: any): void;
    $eachHandler(type: string, fn: (handler: any) => void): void;
    emit(type: string, ...args: any): void;
    emitAndCollect(type: string, ...args: any): any[];
    trigger(type: string, ...args: any): void;
    once(type: string, callback: EventCallback, scope: any): void;
}
declare function toPromise<T>(observable: Observable<T>): Promise<T>;
export declare function operator<T>(fn: (subs: Subscription<T>) => NextObserver<T>): Operator<T>;
declare function map<T, T2>(mapFn: (val: T) => T2): (source: Observable<T>) => Observable<T2>;
declare function filter<T>(fn: (val: T) => boolean): Operator<T>;
declare function tap<T>(fn: (val: T) => any): Operator<T>;
declare function distinctUntilChanged<T>(): Operator<T>;
declare function concat(...observables: Observable<any>[]): Observable<any>;
declare function of<T>(...values: T[]): Observable<T>;
declare const operators: {
    map: typeof map;
    tap: typeof tap;
    filter: typeof filter;
    distinctUntilChanged: typeof distinctUntilChanged;
};
export { Observable, BehaviorSubject, CollectionEvent, Event, EventEmitter, Item, Subject, Subscriber, toPromise, operators, map, tap, filter, distinctUntilChanged, concat, of };
