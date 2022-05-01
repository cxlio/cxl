#!/usr/bin/env node
/// <reference types="node" />
/// <amd-module name="@cxl/rx" />
declare module "@cxl/rx" {
    type ObservableError = any;
    type NextFunction<T> = (val: T) => void;
    type ErrorFunction = (err: ObservableError) => void;
    type CompleteFunction = () => void;
    type UnsubscribeFunction = () => void;
    type SubscribeFunction<T> = (subscription: Subscriber<T>) => UnsubscribeFunction | void;
    type Merge<T> = T extends Observable<infer U> ? U : never;
    type ObservableT<T> = T extends Observable<infer U> ? U : never;
    type PickObservable<T> = {
        [P in keyof T]: T[P] extends Observable<any> ? ObservableT<T[P]> : never;
    };
    export type Operator<T, T2 = T> = (observable: Observable<T>) => Observable<T2>;
    export interface Observer<T> {
        next?: NextFunction<T>;
        error?: ErrorFunction;
        complete?: CompleteFunction;
    }
    export interface Subscribable<T> {
        subscribe(observer: Observer<T>): Subscription;
    }
    export const observableSymbol = "@@observable";
    export interface InteropObservable<T> {
        [observableSymbol]: () => Subscribable<T>;
    }
    type NextObserver<T> = NextFunction<T> | Observer<T> | undefined;
    export interface Subscription {
        unsubscribe(): void;
    }
    export class Subscriber<T> {
        private observer;
        private onUnsubscribe;
        private teardown?;
        closed: boolean;
        constructor(observer: Observer<T>, subscribe?: SubscribeFunction<T>, fwd?: (subscriber: Subscription) => void);
        setTeardown(teardown: () => void): void;
        next(val: T): void;
        error(e: ObservableError): void;
        complete(): void;
        unsubscribe(): void;
    }
    export function pipe<T, A, B>(a: Operator<T, A>, b: Operator<A, B>): Operator<T, B>;
    export function pipe<T, A, B, C>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>): Operator<T, C>;
    export function pipe<T, A, B, C, D>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>, d: Operator<C, D>): Operator<T, D>;
    export function pipe<T, A, B, C, D, E>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>, d: Operator<C, D>, e: Operator<D, E>): Operator<T, E>;
    export class Observable<T> {
        protected __subscribe: SubscribeFunction<T>;
        [observableSymbol](): this;
        constructor(__subscribe: SubscribeFunction<T>);
        then<E, R>(resolve: (val: T) => R, reject?: (e: E) => R): Promise<R>;
        pipe<A>(a: Operator<T, A>): Observable<A>;
        pipe<A, B>(a: Operator<T, A>, b: Operator<A, B>): Observable<B>;
        pipe<A, B, C>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>): Observable<C>;
        pipe<A, B, C, D>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>, d: Operator<C, D>): Observable<D>;
        pipe<A, B, C, D, E>(a: Operator<T, A>, b: Operator<A, B>, c: Operator<B, C>, d: Operator<C, D>, e: Operator<D, E>): Observable<E>;
        subscribe(next?: NextObserver<T>, fwd?: (subs: Subscription) => void): Subscription;
    }
    export class Subject<T, ErrorT = any> extends Observable<T> {
        protected observers: Set<Subscriber<T>>;
        protected onSubscribe(subscriber: Subscriber<T>): UnsubscribeFunction;
        protected isStopped: boolean;
        constructor();
        next(a: T): void;
        error(e: ErrorT): void;
        complete(): void;
    }
    export class BehaviorSubject<T> extends Subject<T> {
        private currentValue;
        constructor(currentValue: T);
        get value(): T;
        protected onSubscribe(subscription: Subscriber<T>): UnsubscribeFunction;
        next(val: T): void;
    }
    export class ReplaySubject<T, ErrorT = any> extends Subject<T, ErrorT> {
        readonly bufferSize: number;
        private buffer;
        private hasError;
        private lastError?;
        constructor(bufferSize?: number);
        protected onSubscribe(subscriber: Subscriber<T>): () => boolean;
        error(val: ErrorT): void;
        next(val: T): void;
    }
    export class Reference<T> extends Subject<T> {
        private $value;
        get value(): T;
        protected onSubscribe(subscription: Subscriber<T>): UnsubscribeFunction;
        next(val: T): void;
    }
    export function concat<R extends Observable<any>[]>(...observables: R): R extends (infer U)[] ? Observable<Merge<U>> : never;
    export function defer<T>(fn: () => Subscribable<T>): Observable<T>;
    export function isInterop<T>(obs: any): obs is InteropObservable<T>;
    export function fromArray<T>(input: Array<T>): Observable<T>;
    export function fromPromise<T>(input: Promise<T>): Observable<T>;
    export function from<T>(input: Array<T> | Promise<T> | Observable<T> | InteropObservable<T>): Observable<T>;
    export function of<T>(...values: T[]): Observable<T>;
    export function toPromise<T>(observable: Observable<T>): Promise<T>;
    export function operatorNext<T, T2 = T>(fn: (subs: Subscriber<T2>) => NextFunction<T>, unsubscribe?: () => void): (source: Observable<T>) => Observable<T2>;
    export function operator<T, T2 = T>(fn: (subs: Subscriber<T2>, source: Observable<T>) => Observer<T> & {
        next: NextFunction<T>;
        unsubscribe?: UnsubscribeFunction;
    }): Operator<T, T2>;
    export function map<T, T2>(mapFn: (val: T) => T2): (source: Observable<T>) => Observable<T2>;
    export function reduce<T, T2>(reduceFn: (acc: T2, val: T, i: number) => T2, seed: T2): Operator<T, T2>;
    export function debounceFunction<A extends any[], R>(fn: (...a: A) => R, delay?: number): (this: any, ...args: A) => void;
    export function interval(period: number): Observable<void>;
    export function timer(delay: number): Observable<void>;
    export function debounceTime<T>(time?: number, useTimer?: typeof timer): Operator<T, T>;
    export function switchMap<T, T2>(project: (val: T) => Observable<T2>): (source: Observable<T>) => Observable<T2>;
    export function mergeMap<T, T2>(project: (val: T) => Observable<T2>): (source: Observable<T>) => Observable<T2>;
    export function exhaustMap<T, T2>(project: (value: T) => Observable<T2>): Operator<T, T2>;
    export function filter<T>(fn: (val: T) => boolean): Operator<T, T>;
    export function take<T>(howMany: number): (source: Observable<T>) => Observable<T>;
    export function takeWhile<T>(fn: (val: T) => boolean): (source: Observable<T>) => Observable<T>;
    export function first<T>(): (source: Observable<T>) => Observable<T>;
    export function tap<T>(fn: (val: T) => void): Operator<T, T>;
    export function catchError<T, O extends T | never>(selector: (err: any, source: Observable<T>) => Observable<O> | void): Operator<T, O>;
    export function distinctUntilChanged<T>(): Operator<T, T>;
    export function select<StateT, K extends keyof StateT>(key: K): (source: Observable<StateT>) => Observable<StateT[K]>;
    export function share<T>(): Operator<T, T>;
    export function publishLast<T>(): Operator<T, T>;
    export function merge<R extends Observable<any>[]>(...observables: R): R extends (infer U)[] ? Observable<Merge<U>> : never;
    export function zip<T extends any[]>(...observables: T): Observable<PickObservable<T>>;
    export function combineLatest<T extends Observable<any>[]>(...observables: T): Observable<PickObservable<T>>;
    export function finalize<T>(unsubscribe: () => void): Operator<T, T>;
    export function throwError(error: any): Observable<never>;
    export const EMPTY: Observable<never>;
    export function be<T>(initialValue: T): BehaviorSubject<T>;
    export function observable<T>(subscribe: SubscribeFunction<T>): Observable<T>;
    export function subject<T>(): Subject<T, any>;
    export function ref<T>(): Reference<T>;
    export const operators: any;
    export interface Observable<T> {
        catchError<T2>(selector: (err: any, source: Observable<T>) => Observable<T2> | void): Observable<T2>;
        debounceTime(time?: number, timer?: (delay: number) => Observable<void>): Observable<T>;
        distinctUntilChanged(): Observable<T>;
        filter<T2 = T>(fn: (val: T) => boolean): Observable<T2>;
        finalize(fn: () => void): Observable<T>;
        first(): Observable<T>;
        map<T2>(mapFn: (val: T) => T2): Observable<T2>;
        mergeMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
        publishLast(): Observable<T>;
        reduce<T2>(reduceFn: (acc: T2, val: T, i: number) => T2, seed: T2): Observable<T2>;
        select<K extends keyof T>(key: K): Observable<T[K]>;
        share(): Observable<T>;
        switchMap<T2>(project: (val: T) => Observable<T2>): Observable<T2>;
        take(howMany: number): Observable<T>;
        takeWhile(fn: (val: T) => boolean): Observable<T>;
        tap(tapFn: (val: T) => void): Observable<T>;
    }
    export interface InsertEvent<T, K> {
        type: 'insert';
        item: T;
        key: K;
    }
    export interface RemoveEvent<K> {
        type: 'remove';
        key: K;
    }
    export interface EmptyEvent {
        type: 'empty';
    }
    export type ListEvent<T, K> = InsertEvent<T, K> | RemoveEvent<K> | EmptyEvent;
}
/// <amd-module name="@cxl/tsx" />
declare module "@cxl/tsx" {
    import { Observable } from "@cxl/rx";
    global {
        namespace dom {
            namespace JSX {
                type ElementClass = Bindable;
                interface ElementAttributesProperty {
                    jsxAttributes: any;
                }
                interface ElementChildrenAttribute {
                    children: {};
                }
                type Element = Node;
                type IntrinsicElements = {
                    [P in keyof HTMLElementTagNameMap]: NativeType<HTMLElementTagNameMap[P]>;
                };
            }
        }
    }
    export type Binding<T, DataT> = (el: T) => Observable<DataT>;
    export type Child = string | Node | number | ((host: Bindable) => Node) | Observable<any>;
    export type Children = Child | Child[];
    export type NativeChild = string | number | Node;
    export type NativeChildren = NativeChild | NativeChild[];
    export type NativeType<T> = {
        [K in keyof Omit<T, 'children'>]?: T[K];
    } & {
        children?: NativeChildren;
    };
    export type AttributeType<T> = {
        [K in keyof Omit<T, 'children'>]?: T[K] | Observable<T[K]>;
    } & {
        $?: Binding<T, any> | Observable<any>;
        children?: Children;
    };
    export interface Bindable extends Node {
        bind(binding: Observable<any>): void;
    }
    export function expression(host: Bindable, binding: Observable<any>): Text;
    export function renderChildren(host: Bindable, children: Children, appendTo?: Node): void;
    interface ComponentConstructor<T extends Bindable> {
        create(): T;
    }
    export function dom<T extends Bindable>(elementType: ComponentConstructor<T>, attributes?: AttributeType<T>, ...children: any[]): T;
    export function dom<T, T2>(elementType: (attributes?: T2) => Bindable | Bindable[], attributes?: T2, ...children: any[]): T;
    export function dom<K extends keyof HTMLElementTagNameMap>(elementType: K, attributes?: NativeType<HTMLElementTagNameMap[K]>, ...children: any[]): HTMLElementTagNameMap[K];
    export default dom;
}
/// <amd-module name="@cxl/dom" />
declare module "@cxl/dom" {
    import { Observable, Subject, Subscription } from "@cxl/rx";
    export type ElementContent = string | Node | undefined;
    export type TemplateContent = string | Element | HTMLTemplateElement | NodeList;
    export function empty(el: Element): void;
    export function setContent(el: Element, content: ElementContent): void;
    export function on<K extends keyof WindowEventMap>(element: Window, event: K, options?: AddEventListenerOptions): Observable<WindowEventMap[K]>;
    export function on<K extends keyof GlobalEventHandlersEventMap>(element: EventTarget, event: K, options?: AddEventListenerOptions): Observable<GlobalEventHandlersEventMap[K]>;
    export function on(element: EventTarget | Window, event: string, options?: AddEventListenerOptions): Observable<CustomEvent>;
    export function onKeypress(el: Element | Window, key?: string): Observable<KeyboardEvent>;
    export function onAction(el: Element): Observable<KeyboardEvent | MouseEvent>;
    export function onReady(): Observable<boolean>;
    export function onLoad(): Observable<boolean>;
    export function onFontsReady(): Observable<void>;
    export function getShadow(el: Element): ShadowRoot;
    export function setAttribute(el: Element, attr: string, val: any): any;
    export function trigger(el: EventTarget, event: string, detail?: any): void;
    export interface MutationEvent<T extends EventTarget = EventTarget> {
        type: 'added' | 'removed' | 'attribute';
        target: T;
        value: any;
    }
    export class AttributeObserver extends Subject<MutationEvent> {
        element: Node;
        private $value;
        private $checked;
        observer?: MutationObserver;
        bindings?: Subscription[];
        $onMutation(events: MutationRecord[]): void;
        $onEvent(): void;
        $initializeNative(element: Element): void;
        constructor(element: Node);
        protected onSubscribe(subscription: any): () => void;
        disconnect(): void;
        trigger(attributeName: string): void;
    }
    export function observeChildren(el: Element): Observable<NodeListOf<ChildNode> | MutationEvent<EventTarget>>;
    export function onChildrenMutation(el: Element): ChildrenObserver;
    export function onAttributeChange(el: Element): AttributeObserver;
    export class ChildrenObserver extends Subject<MutationEvent> {
        private element;
        private observer?;
        constructor(element: Element);
        $handleEvent(ev: MutationRecord): void;
        protected onSubscribe(subscription: any): () => void;
    }
    export function onHashChange(): Observable<string>;
    export function onHistoryChange(): Observable<any>;
    export function onLocation(): Observable<Location>;
    export const animationFrame: Observable<number>;
    export function findNextNode<T extends ChildNode>(el: T, fn: (el: T) => boolean, direction?: 'nextSibling' | 'previousSibling'): T | undefined;
    export function findNextNodeBySelector(el: Element, selector: string, direction?: 'nextElementSibling' | 'previousElementSibling'): Element | null;
    export function onResize(el: Element): Observable<unknown>;
    export function insert(el: Element, content: ElementContent): void;
    export function fileReaderString(file: File): Observable<string>;
    export function onMutation(target: Element, options?: MutationObserverInit): Observable<MutationEvent<EventTarget>>;
    export function onIntersection(target: Element): Observable<IntersectionObserverEntry>;
    export function isVisible(target: Element): Observable<boolean>;
}
/// <amd-module name="@cxl/component" />
declare module "@cxl/component" {
    import { AttributeType, Children } from "@cxl/tsx";
    import { Observable, Operator, Subject } from "@cxl/rx";
    type RenderFunction<T> = (node: T) => void;
    type Augmentation<T extends Component> = (host: T) => Node | Observable<any> | void;
    export interface AttributeEvent<T, K extends keyof T = keyof T> {
        target: T;
        attribute: K;
        value: T[K];
    }
    export class Bindings {
        private subscriptions?;
        bindings?: Observable<any>[];
        bind(binding: Observable<any>): void;
        connect(): void;
        disconnect(): void;
    }
    export abstract class Component extends HTMLElement {
        static tagName: string;
        static observedAttributes: string[];
        static create(): HTMLElement;
        private $$bindings?;
        private $$prebind?;
        private render?;
        protected jsxAttributes: AttributeType<this>;
        protected attributes$: Subject<AttributeEvent<any, any>, any>;
        Shadow: (p: {
            children: Children;
        }) => this;
        Slot: (p: {
            selector: string;
            name?: string;
        }) => HTMLSlotElement;
        bind(obs: Observable<any>): void;
        protected connectedCallback(): void;
        protected disconnectedCallback(): void;
        protected attributeChangedCallback(name: keyof this, oldValue: any, value: any): void;
    }
    export function pushRender<T>(proto: T, renderFn: RenderFunction<T>): void;
    export function appendShadow<T extends Component>(host: T, child: Node | Observable<any>): void;
    export function augment<T extends Component>(constructor: new () => T, decorators: Augmentation<T>[]): void;
    export function registerComponent(tagName: string, ctor: any): void;
    export function Augment<T extends Component>(): (ctor: any) => void;
    export function Augment<T extends Component>(...augs: [string | Augmentation<T>, ...Augmentation<T>[]]): (ctor: any) => void;
    export function connect<T extends Component>(bindFn: (node: T) => void): (host: T) => void;
    export function onUpdate<T extends Component>(host: T): Observable<T>;
    export function update<T extends Component>(fn: (node: T) => void): (host: T) => void;
    export function attributeChanged<T extends Component, K extends keyof T>(element: T, attribute: K): Observable<T[K]>;
    export function get<T extends Component, K extends keyof T>(element: T, attribute: K): Observable<T[K]>;
    interface AttributeOptions {
        persist: boolean;
        persistOperator: Operator<any, any>;
        observe: boolean;
        render: RenderFunction<any>;
    }
    export function Attribute(options?: Partial<AttributeOptions>): any;
    export function StyleAttribute(): any;
    export function getRegisteredComponents(): {
        [x: string]: typeof Component;
    };
    export class Span extends Component {
    }
    export function Slot(): HTMLSlotElement;
}
/// <amd-module name="@cxl/template" />
declare module "@cxl/template" {
    import { ListEvent, Observable, Operator } from "@cxl/rx";
    import type { Bindable } from "@cxl/tsx";
    import { Component } from "@cxl/component";
    export type ValidateFunction<T> = (val: T) => string | true;
    export interface ElementWithValue<T> extends HTMLElement {
        value: T;
    }
    export function sortBy<T = any, K extends keyof T = any>(key: K): (a: T, b: T) => 0 | 1 | -1;
    export function getSearchRegex(term: string): RegExp;
    export function getAttribute<T extends Node, K extends keyof T>(el: T, name: K): Observable<T[K]>;
    export function triggerEvent<R>(element: EventTarget, event: string): Operator<R, R>;
    export function stopEvent<T extends Event>(): Operator<T, T>;
    export function sync<T>(getA: Observable<T>, setA: (val: T) => void, getB: Observable<T>, setB: (val: T) => void, value?: T): Observable<T>;
    export function syncAttribute(A: Node, B: Node, attr: string): Observable<any>;
    interface NextObservable<T> extends Observable<T> {
        next(val: T): void;
    }
    export function model<T>(el: ElementWithValue<T>, ref: NextObservable<T>): Observable<T>;
    export function onValue<T extends ElementWithValue<R>, R = T['value']>(el: T): Observable<R>;
    module "@cxl/rx" {
        interface Observable<T> {
            is(equalTo: T): Observable<boolean>;
            log(): Observable<T>;
            raf(fn?: (val: T) => void): Observable<T>;
            select<K extends keyof T>(key: K): Observable<T[K]>;
        }
    }
    export function select<T, K extends keyof T>(key: K): (source: Observable<T>) => Observable<T[K]>;
    export function is<T>(equalTo: T): (source: Observable<T>) => Observable<boolean>;
    export function raf<T>(fn?: (val: T) => void): Operator<T, T>;
    export function log<T>(): Operator<T, T>;
    export function portal(id: string): (el: HTMLElement) => Observable<unknown>;
    export function teleport(el: Node, portalName: string): Observable<void>;
    export function list<T, K>(source: Observable<ListEvent<T, K>>, renderFn: (item: T) => Node): (host: Bindable) => Comment;
    export function loading(source: Observable<any>, renderFn: () => Node): (host: Bindable) => void;
    export function render<T>(source: Observable<T>, renderFn: (item: T) => Node, loading?: () => Node, error?: (e: any) => Node): (host: Bindable) => Comment;
    export function each<T>(source: Observable<Iterable<T>>, renderFn: (item: T, index: number) => Node, empty?: () => Node): (host: Bindable) => Comment;
    type AriaProperties = {
        atomic: string;
        autocomplete: string;
        busy: string;
        checked: string;
        controls: string;
        current: string;
        describedby: string;
        details: string;
        disabled: string;
        dropeffect: string;
        errormessage: string;
        expanded: string;
        flowto: string;
        grabbed: string;
        haspopup: string;
        hidden: string;
        invalid: string;
        keyshortcuts: string;
        label: string;
        labelledby: string;
        level: string;
        live: string;
        orientation: string;
        owns: string;
        placeholder: string;
        pressed: string;
        readonly: string;
        required: string;
        selected: string;
        sort: string;
        valuemax: string;
        valuemin: string;
        valuenow: string;
        valuetext: string;
        modal: string;
        multiline: string;
        multiselectable: string;
        relevant: string;
        roledescription: string;
    };
    type AriaProperty = keyof AriaProperties;
    export function aria<T extends Component>(prop: AriaProperty, value: string): (ctx: T) => Observable<unknown>;
    export function ariaValue(host: Element, prop: AriaProperty): Operator<string | number | boolean, string | number | boolean>;
    export function ariaChecked(host: Element): Operator<boolean | undefined, boolean | undefined>;
    export function role<T extends Component>(roleName: string): (ctx: T) => Observable<unknown>;
    interface SelectableNode extends ParentNode, EventTarget {
    }
    export function navigationListUpDown(host: SelectableNode, selector: string, startSelector: string, input?: SelectableNode): Observable<Element | null>;
    export function navigationList(host: SelectableNode, selector: string, startSelector: string, input?: SelectableNode): Observable<Element | null>;
    export interface FocusableComponent extends Component {
        disabled: boolean;
        touched: boolean;
    }
    export function focusableEvents<T extends FocusableComponent>(host: T, element?: HTMLElement): Observable<FocusEvent | T["disabled"] | T["touched"]>;
    export function disabledAttribute<T extends FocusableComponent>(host: T): Observable<T["disabled"]>;
    export function focusableDisabled<T extends FocusableComponent>(host: T, element?: HTMLElement): Observable<T["disabled"]>;
    export function focusable<T extends FocusableComponent>(host: T, element?: HTMLElement): Observable<FocusEvent | T["disabled"] | T["touched"]>;
    export function registable<T extends Component, ControllerT>(host: T, id: string, controller?: ControllerT): Observable<never>;
    export function registableHost<ControllerT>(host: EventTarget, id: string, elements?: Set<ControllerT>): Observable<Set<ControllerT>>;
    interface SelectableComponent extends Component {
        selected: boolean;
    }
    interface SelectableTarget extends Node {
        value: any;
        selected: boolean;
        multiple?: boolean;
    }
    interface SelectableHost<T> extends Element {
        value?: any;
        options: Set<T>;
        selected?: T;
    }
    interface SelectableMultiHost<T> extends Element {
        value: any[];
        options: Set<T>;
        selected: Set<T>;
    }
    export function selectableHostMultiple<TargetT extends SelectableTarget>(host: SelectableMultiHost<TargetT>): Observable<TargetT>;
    export function selectableHost<TargetT extends SelectableTarget>(host: SelectableHost<TargetT>): Observable<TargetT | undefined>;
    export function selectable<T extends SelectableComponent>(host: T): Observable<string | number | boolean | KeyboardEvent | MouseEvent>;
    interface CheckedComponent extends Component {
        value: any;
        checked: boolean;
    }
    export function checkedBehavior<T extends CheckedComponent>(host: T): Observable<boolean | T["value"] | undefined>;
    export function stopChildrenEvents(target: EventTarget, event: string): Observable<CustomEvent<any>>;
    export function $onAction<T extends Element>(cb: (ev: KeyboardEvent | MouseEvent) => void): (el: T) => Observable<KeyboardEvent | MouseEvent>;
    export function staticTemplate(template: () => Node): () => Node;
    export function setClassName(el: HTMLElement): Operator<string, string>;
    interface FormElement<T> extends ElementWithValue<T> {
        setCustomValidity(msg: string): void;
    }
    export function validateValue<T>(el: FormElement<T>, ...validators: ValidateFunction<T>[]): Observable<T>;
    export function escapeHtml(str: string): string;
}
/// <amd-module name="@cxl/css" />
declare module "@cxl/css" {
    export type StyleDefinition<T extends Theme = Theme> = Partial<StrictStyleDefinition<T>>;
    export type BaseColor = RGBA;
    export type CSSStyle = {
        [P in keyof CSSStyleDeclaration]?: string | number;
    };
    export type Color<T extends Theme> = keyof T['colors'] | BaseColor | 'inherit' | 'transparent';
    export type Percentage = '50%' | '100%' | CustomPercentage;
    export type Length = number | Percentage | 'auto';
    export type ColorVariables<T> = {
        [K in keyof T]: string;
    };
    export type VariableList<T extends Theme> = T['variables'] & ColorVariables<T['colors']>;
    export type FlexAlign = 'normal' | 'stretch' | 'center' | 'start' | 'end' | 'flex-start' | 'flex-end' | 'baseline';
    export interface Variables {
    }
    export interface Colors {
    }
    export interface FontDefinition {
        family: string;
        url: string;
        weight?: string;
    }
    export interface Typography {
        default: CSSStyle;
    }
    export interface StrictStyleDefinition<T extends Theme> {
        alignItems: FlexAlign;
        alignSelf: FlexAlign;
        animation: keyof T['animation'];
        animationDuration: string;
        backgroundImage: string;
        backgroundColor: Color<T>;
        backgroundSize: 'cover' | 'contain';
        backgroundPosition: 'center';
        backgroundRepeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
        borderBottom: Length;
        borderLeft: Length;
        borderRight: Length;
        borderTop: Length;
        borderColor: Color<T>;
        borderWidth: number;
        borderRadius: Length;
        borderStyle: 'solid' | 'none';
        boxShadow: BoxShadow<T> | 'none';
        elevation: 0 | 1 | 2 | 3 | 4 | 5;
        fontSize: number | 'inherit';
        translateX: Length;
        translateY: Length;
        translateZ: Length;
        rowGap: Length;
        columnGap: Length;
        gridColumnEnd: string;
        gridAutoFlow: 'column';
        gridTemplateColumns: string;
        prepend: string;
        rotate: number;
        scaleX: number;
        scaleY: number;
        font: keyof T['typography'];
        color: Color<T>;
        paddingLeft: Length;
        paddingRight: Length;
        paddingTop: Length;
        paddingBottom: Length;
        marginLeft: number | 'auto';
        marginRight: number | 'auto';
        marginTop: number | 'auto';
        marginBottom: number | 'auto';
        opacity: number;
        outline: number | string;
        overflowY: string;
        overflowX: string;
        transformOrigin: string;
        overflowScrolling: string;
        lineHeight: number;
        listStyleImage: string;
        listStylePosition: 'inside' | 'outside';
        listStyleType: 'none' | 'inherit' | 'initial' | 'unset';
        width: Length | 'max-content' | 'min-content';
        top: Length;
        left: Length;
        right: Length;
        bottom: Length;
        filter: string;
        flexGrow: number;
        flexShrink: number;
        flexBasis: Length;
        flexDirection: string;
        justifyContent: string;
        pointerEvents: string;
        cursor: string;
        display: 'block' | 'inline' | 'table' | 'flex' | 'grid' | 'table-row' | 'table-caption' | 'table-row-group' | 'table-cell' | 'contents' | 'none' | 'initial' | 'inline-flex' | 'inline-block';
        position: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
        userSelect: string;
        textAlign: string;
        textDecoration: string;
        transition: 'unset';
        height: Length;
        minHeight: Length;
        minWidth: Length;
        maxHeight: Length;
        maxWidth: Length;
        variables: Partial<VariableList<T>>;
        verticalAlign: 'top' | 'middle' | 'bottom' | 'super' | 'sub' | 'text-top' | 'text-bottom' | 'baseline';
        willChange: 'transform';
        whiteSpace: 'nowrap' | 'pre-wrap';
        zIndex: number;
    }
    export interface BoxShadow<T extends Theme = Theme> {
        offsetX: number;
        offsetY: number;
        blurRadius: number;
        spread: number;
        color: Color<T>;
    }
    export type StylesOnly<T extends Theme> = {
        [key: string]: StyleDefinition<T>;
    };
    export type Styles<T extends Theme = Theme> = StylesOnly<T> | {
        '@small'?: StylesOnly<T>;
        '@medium'?: StylesOnly<T>;
        '@large'?: StylesOnly<T>;
        '@xlarge'?: StylesOnly<T>;
    };
    export type Breakpoint = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';
    export type CSSUnit = 'px' | 'em' | 'rem';
    export interface Breakpoints {
        small: number;
        large: number;
        medium: number;
        xlarge: number;
    }
    export interface AnimationDefinition {
        keyframes: string;
        value: string;
    }
    export interface Animation {
        none: undefined;
    }
    export interface Theme {
        animation: Animation;
        colors: Colors;
        typography: Typography;
        variables: Variables;
        breakpoints: Breakpoints;
        globalStyles?: Styles<any>;
        imports?: string[];
        unit: CSSUnit;
    }
    export interface RGBA {
        readonly a: number;
        readonly r: number;
        readonly g: number;
        readonly b: number;
        toString(): string;
    }
    export type CustomPercentage = {
        __pct: true;
        toString(): string;
    };
    export function boxShadow<T extends Theme>(offsetX: number, offsetY: number, blurRadius: number, spread: number, color: Color<T>): {
        offsetX: number;
        offsetY: number;
        blurRadius: number;
        spread: number;
        color: Color<T>;
    };
    export function pct(n: number): CustomPercentage;
    export const defaultTheme: Theme;
    export function padding(paddingTop: number | 'auto', paddingRight?: number | "auto", paddingBottom?: number | "auto", paddingLeft?: number | "auto"): {
        paddingTop: number | "auto";
        paddingRight: number | "auto";
        paddingBottom: number | "auto";
        paddingLeft: number | "auto";
    };
    export function margin(marginTop: number | 'auto', marginRight?: number | "auto", marginBottom?: number | "auto", marginLeft?: number | "auto"): {
        marginTop: number | "auto";
        marginRight: number | "auto";
        marginBottom: number | "auto";
        marginLeft: number | "auto";
    };
    export function border(borderTop: number | 'auto', borderRight?: number | "auto", borderBottom?: number | "auto", borderLeft?: number | "auto"): {
        borderTop: number | "auto";
        borderRight: number | "auto";
        borderBottom: number | "auto";
        borderLeft: number | "auto";
    };
    export function rgba(r: number, g: number, b: number, a?: number): RGBA;
    export function mask({ r, g, b, a }: RGBA): string;
    export function renderVariables(variables: Variables): string;
    export function renderGlobal(theme: {
        variables?: Variables;
        colors?: Colors;
        imports?: string[];
    }): string;
    export const White: RGBA;
    export const White8: string;
    export const White12: string;
    export const White87: string;
    export function buildTheme<T extends Theme>(theme: T): {
        baseColor(name: keyof T['colors']): string;
        style: (def: StyleDefinition) => string;
        render: (styles: Styles, baseSelector?: string) => string;
        applyTheme: (container?: HTMLHeadElement) => void;
        css(styles: Styles<T>, selector?: string, global?: boolean): () => HTMLStyleElement;
    };
}
/// <amd-module name="@cxl/ui/theme.js" />
declare module "@cxl/ui/theme.js" {
    import { Styles as CssStyles, StyleDefinition } from "@cxl/css";
    export interface ColorTheme {
        primary: string;
        secondary: string;
        surface: string;
        onPrimary: string;
        onSecondary: string;
        onSurface: string;
    }
    export type UiTheme = typeof theme;
    export type Styles = CssStyles<UiTheme>;
    export const theme: {
        animation: {
            none: undefined;
            flash: {
                keyframes: string;
                value: string;
            };
            spin: {
                keyframes: string;
                value: string;
            };
            pulse: {
                keyframes: string;
                value: string;
            };
            expand: {
                keyframes: string;
                value: string;
            };
            fadeIn: {
                keyframes: string;
                value: string;
            };
            fadeOut: {
                keyframes: string;
                value: string;
            };
            fadeInUp: {
                keyframes: string;
                value: string;
            };
            slideInUp: {
                keyframes: string;
                value: string;
            };
            wait: {
                keyframes: string;
                value: string;
            };
            spinnerstroke: {
                keyframes: string;
                value: string;
            };
        };
        variables: {
            speed: string;
            font: string;
            fontSize: string;
            fontMonospace: string;
        };
        typography: {
            default: {
                fontWeight: number;
                fontFamily: string;
                fontSize: string;
                letterSpacing: string;
            };
            caption: {
                fontSize: string;
                letterSpacing: string;
            };
            h1: {
                fontWeight: number;
                fontSize: string;
                letterSpacing: string;
            };
            h2: {
                fontWeight: number;
                fontSize: string;
                letterSpacing: string;
            };
            h3: {
                fontSize: string;
            };
            h4: {
                fontSize: string;
                letterSpacing: string;
            };
            h5: {
                fontSize: string;
            };
            h6: {
                fontSize: string;
                fontWeight: number;
                letterSpacing: string;
            };
            body2: {
                fontSize: string;
                letterSpacing: string;
                lineHeight: string;
            };
            subtitle: {
                letterSpacing: string;
            };
            subtitle2: {
                fontSize: string;
                fontWeight: number;
                letterSpacing: string;
            };
            button: {
                fontSize: string;
                fontWeight: number;
                lineHeight: string;
                letterSpacing: string;
                textTransform: string;
            };
            code: {
                fontFamily: string;
            };
            monospace: {
                fontFamily: string;
            };
        };
        colors: {
            shadow: import("@cxl/css").RGBA;
            primary: import("@cxl/css").RGBA;
            link: import("@cxl/css").RGBA;
            primaryLight: import("@cxl/css").RGBA;
            secondary: import("@cxl/css").RGBA;
            surface: import("@cxl/css").RGBA;
            error: import("@cxl/css").RGBA;
            errorLight: import("@cxl/css").RGBA;
            onPrimary: import("@cxl/css").RGBA;
            onPrimaryLight: import("@cxl/css").RGBA;
            onSecondary: import("@cxl/css").RGBA;
            onSurface: import("@cxl/css").RGBA;
            onSurface8: import("@cxl/css").RGBA;
            onSurface12: import("@cxl/css").RGBA;
            onSurface87: import("@cxl/css").RGBA;
            onError: import("@cxl/css").RGBA;
            background: import("@cxl/css").RGBA;
            onBackground: import("@cxl/css").RGBA;
            headerText: import("@cxl/css").RGBA;
            divider: import("@cxl/css").RGBA;
        };
        imports: string[];
        globalStyles: {
            '@a': {
                color: string;
            };
            '*': any;
        };
        breakpoints: import("@cxl/css").Breakpoints;
        unit: import("@cxl/css").CSSUnit;
    };
    export const applyTheme: (container?: HTMLHeadElement) => void, baseColor: (name: "link" | "error" | "background" | "shadow" | "primary" | "primaryLight" | "secondary" | "surface" | "errorLight" | "onPrimary" | "onPrimaryLight" | "onSecondary" | "onSurface" | "onSurface8" | "onSurface12" | "onSurface87" | "onError" | "onBackground" | "headerText" | "divider") => string, css: (styles: CssStyles<{
        animation: {
            none: undefined;
            flash: {
                keyframes: string;
                value: string;
            };
            spin: {
                keyframes: string;
                value: string;
            };
            pulse: {
                keyframes: string;
                value: string;
            };
            expand: {
                keyframes: string;
                value: string;
            };
            fadeIn: {
                keyframes: string;
                value: string;
            };
            fadeOut: {
                keyframes: string;
                value: string;
            };
            fadeInUp: {
                keyframes: string;
                value: string;
            };
            slideInUp: {
                keyframes: string;
                value: string;
            };
            wait: {
                keyframes: string;
                value: string;
            };
            spinnerstroke: {
                keyframes: string;
                value: string;
            };
        };
        variables: {
            speed: string;
            font: string;
            fontSize: string;
            fontMonospace: string;
        };
        typography: {
            default: {
                fontWeight: number;
                fontFamily: string;
                fontSize: string;
                letterSpacing: string;
            };
            caption: {
                fontSize: string;
                letterSpacing: string;
            };
            h1: {
                fontWeight: number;
                fontSize: string;
                letterSpacing: string;
            };
            h2: {
                fontWeight: number;
                fontSize: string;
                letterSpacing: string;
            };
            h3: {
                fontSize: string;
            };
            h4: {
                fontSize: string;
                letterSpacing: string;
            };
            h5: {
                fontSize: string;
            };
            h6: {
                fontSize: string;
                fontWeight: number;
                letterSpacing: string;
            };
            body2: {
                fontSize: string;
                letterSpacing: string;
                lineHeight: string;
            };
            subtitle: {
                letterSpacing: string;
            };
            subtitle2: {
                fontSize: string;
                fontWeight: number;
                letterSpacing: string;
            };
            button: {
                fontSize: string;
                fontWeight: number;
                lineHeight: string;
                letterSpacing: string;
                textTransform: string;
            };
            code: {
                fontFamily: string;
            };
            monospace: {
                fontFamily: string;
            };
        };
        colors: {
            shadow: import("@cxl/css").RGBA;
            primary: import("@cxl/css").RGBA;
            link: import("@cxl/css").RGBA;
            primaryLight: import("@cxl/css").RGBA;
            secondary: import("@cxl/css").RGBA;
            surface: import("@cxl/css").RGBA;
            error: import("@cxl/css").RGBA;
            errorLight: import("@cxl/css").RGBA;
            onPrimary: import("@cxl/css").RGBA;
            onPrimaryLight: import("@cxl/css").RGBA;
            onSecondary: import("@cxl/css").RGBA;
            onSurface: import("@cxl/css").RGBA;
            onSurface8: import("@cxl/css").RGBA;
            onSurface12: import("@cxl/css").RGBA;
            onSurface87: import("@cxl/css").RGBA;
            onError: import("@cxl/css").RGBA;
            background: import("@cxl/css").RGBA;
            onBackground: import("@cxl/css").RGBA;
            headerText: import("@cxl/css").RGBA;
            divider: import("@cxl/css").RGBA;
        };
        imports: string[];
        globalStyles: {
            '@a': {
                color: string;
            };
            '*': any;
        };
        breakpoints: import("@cxl/css").Breakpoints;
        unit: import("@cxl/css").CSSUnit;
    }>, selector?: string, global?: boolean) => () => HTMLStyleElement;
    export const BaseColors: ColorTheme;
    export const PrimaryColors: ColorTheme;
    export const SecondaryColors: ColorTheme;
    export const ErrorColors: ColorTheme;
    type ColorKey = 'surface' | 'primary' | 'secondary' | 'error';
    export const ColorStyles: Record<ColorKey, StyleDefinition<UiTheme>>;
    export const DisabledStyles: {
        cursor: string;
        filter: string;
        opacity: number;
        pointerEvents: string;
    };
    export const FocusStyles: {
        filter: string;
    };
    export const HoverStyles: {
        filter: string;
    };
    export const StateStyles: {
        $focus: {
            outline: number;
        };
        $disabled: {
            cursor: string;
            filter: string;
            opacity: number;
            pointerEvents: string;
        };
    };
    export function delayTheme(): void;
}
/// <amd-module name="@cxl/ui/svg.js" />
declare module "@cxl/ui/svg.js" {
    import { Component } from "@cxl/component";
    export type SVGChildren = Path;
    export interface SvgNode {
        style?: string;
        className?: string;
    }
    export interface Path extends SvgNode {
        fill?: string;
        className?: string;
        d?: string;
    }
    export interface Circle extends SvgNode {
        cx: string;
        cy: string;
        r: string;
    }
    export function Svg(p: {
        viewBox: string;
        className?: string;
        width?: number;
        height?: number;
        alt?: string;
        children?: Node | Node[];
    }): SVGSVGElement;
    export function Path(p: Path): SVGPathElement;
    export function Circle(p: Circle): SVGCircleElement;
    export class SvgImage extends Component {
        src?: string;
    }
}
/// <amd-module name="@cxl/ui/core.js" />
declare module "@cxl/ui/core.js" {
    import { AttributeEvent, Component } from "@cxl/component";
    import { Bindable } from "@cxl/tsx";
    import { Observable } from "@cxl/rx";
    import { Breakpoint, StyleDefinition } from "@cxl/css";
    import { FocusableComponent } from "@cxl/template";
    import { ColorStyles, Styles, UiTheme } from "@cxl/ui/theme.js";
    export { Circle, Svg, Path } from "@cxl/ui/svg.js";
    export { Span } from "@cxl/component";
    export { css } from "@cxl/ui/theme.js";
    export const FocusHighlight: {
        $focus: {
            filter: string;
        };
        $hover: {
            filter: string;
        };
    };
    export const FocusCircleStyle: () => HTMLStyleElement;
    export function persistWithParameter(prefix: string): import("@cxl/rx").Operator<AttributeEvent<any, string | number | symbol>, AttributeEvent<any, string | number | symbol>>;
    export function ripple(element: any): Observable<KeyboardEvent | MouseEvent>;
    export type Size = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 'small' | 'big';
    export function SizeAttribute(fn: (size: Exclude<Size, 'small' | 'big'>) => StyleDefinition): any;
    export type ColorValue = keyof typeof ColorStyles;
    export function ColorAttribute(defaultColor?: ColorValue): any;
    export function CssAttribute(styles: Styles): any;
    export class Ripple extends Component {
        x: number;
        y: number;
        radius: number;
    }
    export class RippleContainer extends Component {
    }
    export class Hr extends Component {
        pad?: 8 | 16 | 24 | 32;
    }
    export class T extends Component {
        font?: keyof UiTheme['typography'];
        h1: boolean;
        h2: boolean;
        h3: boolean;
        h4: boolean;
        h5: boolean;
        h6: boolean;
        caption: boolean;
        center: boolean;
        subtitle: boolean;
        subtitle2: boolean;
        body2: boolean;
        code: boolean;
        inline: boolean;
        button: boolean;
        justify: boolean;
    }
    export class Toggle extends Component {
        target?: HTMLElement | string;
    }
    export class Meta extends Component {
        connectedCallback(): void;
    }
    export class Application extends Component {
        permanent: boolean;
    }
    export class Toolbar extends Component {
    }
    export class ButtonBase extends Component {
        disabled: boolean;
        primary: boolean;
        flat: boolean;
        secondary: boolean;
        touched: boolean;
        outline: boolean;
        size: Size;
    }
    export function focusDelegate<T extends FocusableComponent>(host: T, delegate: DisableElement): Observable<FocusEvent | T["disabled"] | T["touched"]>;
    interface DisableElement extends HTMLElement {
        disabled: boolean;
    }
    export function Focusable(host: Bindable): HTMLStyleElement;
    export function breakpoint(el: HTMLElement): Observable<Breakpoint>;
    export function breakpointClass(el: HTMLElement): Observable<string>;
}
/// <amd-module name="@cxl/ui/icon.js" />
declare module "@cxl/ui/icon.js" {
    import { Component } from "@cxl/component";
    import { ButtonBase } from "@cxl/ui/core.js";
    export function ArrowBackIcon(): Node;
    export function MenuIcon(): Node;
    export function MoreVertIcon(): Node;
    export function SearchIcon(): Node;
    export function CloseIcon(p: {
        width?: number;
    }): Node;
    export function PersonIcon(p: {
        width?: number;
    }): Node;
    export class IconButton extends ButtonBase {
    }
    export class SvgIcon extends Component {
        icon: string;
        width?: number;
        height?: number;
    }
}
/// <amd-module name="@cxl/ui/appbar.js" />
declare module "@cxl/ui/appbar.js" {
    import { Component } from "@cxl/component";
    import { ColorValue } from "@cxl/ui/core.js";
    export class Appbar extends Component {
        extended: boolean;
        center: boolean;
        contextual?: string;
        sticky: boolean;
        flat: boolean;
        padded: boolean;
        color?: ColorValue;
    }
    export class AppbarContextual extends Component {
        name?: string;
        visible: boolean;
    }
    export class AppbarTitle extends Component {
    }
}
/// <amd-module name="@cxl/ui/input-base.js" />
declare module "@cxl/ui/input-base.js" {
    import { Component } from "@cxl/component";
    export class InputBase extends Component {
        static formAssociated: boolean;
        value: any;
        invalid: boolean;
        disabled: boolean;
        touched: boolean;
        name: string;
        private internals;
        constructor();
        protected formDisabledCallback(disabled: boolean): void;
        get validationMessage(): string;
        get validity(): ValidityState;
        setCustomValidity(msg: string): void;
        focusElement?: HTMLElement;
        focus(): void;
    }
}
/// <amd-module name="@cxl/ui/field.js" />
declare module "@cxl/ui/field.js" {
    import { Component } from "@cxl/component";
    import { InputBase } from "@cxl/ui/input-base.js";
    import { Observable } from "@cxl/rx";
    export function fieldInput<T extends Component>(host: T): Observable<InputBase>;
    export class FocusLine extends Component {
        focused: boolean;
        invalid: boolean;
    }
    export class Fieldset extends Component {
        outline: boolean;
    }
    export class Field extends Component {
        outline: boolean;
        floating: boolean;
        leading: boolean;
        dense: boolean;
        input?: InputBase;
    }
}
/// <amd-module name="@cxl/ui/select.js" />
declare module "@cxl/ui/select.js" {
    import { Component } from "@cxl/component";
    import { InputBase } from "@cxl/ui/input-base.js";
    export class Option extends Component {
        private $value;
        get value(): any;
        set value(val: any);
        selected: boolean;
        focused: boolean;
        inactive: boolean;
    }
    export class SelectMenu extends Component {
        visible: boolean;
    }
    export abstract class SelectBase extends InputBase {
        opened: boolean;
        readonly options: Set<Option>;
        protected abstract setSelected(option: Option): void;
        abstract open(): void;
        abstract close(): void;
    }
    export class SelectBox extends SelectBase {
        selected?: Option;
        protected selectedText$: import("@cxl/rx").BehaviorSubject<string>;
        protected positionMenu(menu: SelectMenu): void;
        protected setSelected(option?: Option): void;
        open(): void;
        close(): void;
    }
}
/// <amd-module name="@cxl/ui/autocomplete.js" />
declare module "@cxl/ui/autocomplete.js" {
    import { Component } from "@cxl/component";
    export class Autocomplete extends Component {
        visible: boolean;
    }
}
/// <amd-module name="@cxl/ui/badge.js" />
declare module "@cxl/ui/badge.js" {
    import { Component } from "@cxl/component";
    import { ColorValue, Size } from "@cxl/ui/core.js";
    export class Badge extends Component {
        size: Size;
        color?: ColorValue;
        secondary: boolean;
        error: boolean;
        over: boolean;
    }
}
/// <amd-module name="@cxl/ui/button.js" />
declare module "@cxl/ui/button.js" {
    import { ButtonBase } from "@cxl/ui/core.js";
    export class Button extends ButtonBase {
    }
}
/// <amd-module name="@cxl/ui/checkbox.js" />
declare module "@cxl/ui/checkbox.js" {
    import { InputBase } from "@cxl/ui/input-base.js";
    export class Checkbox extends InputBase {
        value: boolean | undefined;
        checked: boolean;
        indeterminate: boolean;
        inline: boolean;
    }
}
/// <amd-module name="@cxl/ui/spinner.js" />
declare module "@cxl/ui/spinner.js" {
    import { Component } from "@cxl/component";
    export class Spinner extends Component {
    }
}
/// <amd-module name="@cxl/ui/dialog.js" />
declare module "@cxl/ui/dialog.js" {
    import { Component } from "@cxl/component";
    export class Backdrop extends Component {
        center: boolean;
    }
    export class Dialog extends Component {
    }
    export class DialogAlert extends Component {
        resolve: () => void;
        'title-text': string;
        message: string;
        action: string;
        readonly promise: Promise<void>;
    }
    export class DialogConfirm extends Component {
        resolve: (val: boolean) => void;
        'cancel-text': string;
        'title-text': string;
        message: string;
        action: string;
        readonly promise: Promise<boolean>;
    }
    export class ToggleDrawer extends Component {
        drawer?: string;
    }
    export class Drawer extends Component {
        visible: boolean;
        right: boolean;
        permanent: boolean;
    }
    export class Snackbar extends Component {
        delay: number;
    }
    export class SnackbarContainer extends Component {
        queue: [Snackbar, () => void][];
        private notifyNext;
        notify(snackbar: Snackbar): Promise<void>;
    }
    export type PopupPosition = 'right top' | 'bottom top' | 'right bottom' | 'left top' | 'left bottom' | 'center top' | 'center bottom' | 'auto';
    export class PopupContainer extends Component {
    }
    export class Popup extends Component {
        visible: boolean;
        position: PopupPosition;
        container: string;
        proxy?: HTMLElement;
    }
    export function alert(optionsOrMessage: string | Partial<DialogAlert>, container?: Element): Promise<void>;
    export function confirm(options: string | Partial<DialogConfirm>, container?: Element): Promise<boolean>;
    export function notify(options: string | {
        delay?: number;
        content: string | Node;
    }, bar?: SnackbarContainer): Promise<void>;
    export function setSnackbarContainer(bar: SnackbarContainer): void;
    interface PositionOptions {
        element: HTMLElement;
        relativeTo: Element;
        position: PopupPosition;
        container: HTMLElement;
    }
    interface OpenPopupOptions extends PositionOptions {
        popup: Popup;
    }
    export function positionElement({ element, relativeTo, position, container, }: PositionOptions): void;
    export class DialogManager {
        currentPopup?: Popup;
        openModal(modal: Element, container?: Element): void;
        closeModal(modal?: Element, container?: Element): void;
        openPopup(options: OpenPopupOptions): void;
    }
    export const dialogManager: DialogManager;
}
/// <amd-module name="@cxl/ui/menu.js" />
declare module "@cxl/ui/menu.js" {
    import { Component } from "@cxl/component";
    import { Toggle } from "@cxl/ui/core.js";
    import { PopupPosition } from "@cxl/ui/dialog.js";
    export class Menu extends Component {
        dense: boolean;
    }
    export class MenuPopup extends Component {
    }
    export class MenuToggle extends Toggle {
        position: PopupPosition;
    }
}
declare module "cxl/ui/fab" {
    import { Component } from "@cxl/component";
    export class Fab extends Component {
        disabled: boolean;
        fixed: boolean;
        touched: boolean;
    }
}
/// <amd-module name="@cxl/ui/chip.js" />
declare module "@cxl/ui/chip.js" {
    import { Component } from "@cxl/component";
    import { ColorValue, Size } from "@cxl/ui/core.js";
    export class Chip extends Component {
        removable: boolean;
        disabled: boolean;
        touched: boolean;
        primary: boolean;
        secondary: boolean;
        color?: ColorValue;
        size: Size;
        remove(): void;
    }
}
declare module "cxl/drag/index" {
    import { Observable } from "@cxl/rx";
    export interface DragHandler {
        onStart(ev: DragEvent): void;
        onEnd(ev: DragEvent): void;
    }
    export interface DragEvent {
        target: HTMLElement;
        clientX: number;
        clientY: number;
    }
    export function onDrag(element: HTMLElement, handler?: DragHandler): Observable<DragEvent>;
    export function dragInside(target: HTMLElement): Observable<DragEvent>;
    export function dragMove(element: HTMLElement, axis?: 'x' | 'y'): Observable<DragEvent>;
    export function dropTarget<T extends HTMLElement>($: T): Observable<globalThis.DragEvent>;
}
/// <amd-module name="@cxl/ui/form.js" />
declare module "@cxl/ui/form.js" {
    import { Component } from "@cxl/component";
    import { ButtonBase } from "@cxl/ui/core.js";
    import { InputBase } from "@cxl/ui/input-base.js";
    export class Slider extends InputBase {
        step: number;
        value: number;
    }
    export class SubmitButton extends ButtonBase {
        primary: boolean;
        submitting: boolean;
    }
    export class Label extends Component {
    }
    export class FieldHelp extends Component {
        invalid: boolean;
    }
    export class FieldCounter extends Component {
        max: number;
    }
    export class Form extends Component {
        elements: Set<InputBase>;
        submit(): void;
        getFormData(): Record<string, any>;
    }
    export class Input extends InputBase {
        value: string;
    }
    export class FieldInput extends InputBase {
        outline: boolean;
        floating: boolean;
        label: string;
    }
    export class FieldTextArea extends InputBase {
        outline: boolean;
        floating: boolean;
        label: string;
    }
    export class PasswordInput extends InputBase {
        maxlength?: number;
        value: string;
    }
    export class Radio extends InputBase {
        checked: boolean;
    }
    export class Switch extends InputBase {
        value: boolean;
        checked: boolean;
    }
    export function focusProxy(el: HTMLElement, host: InputBase): import("@cxl/rx").Observable<boolean | FocusEvent>;
    export function ContentEditable<T extends InputBase>(host: T, multi?: boolean): HTMLDivElement;
    export class TextArea extends InputBase {
        value: string;
    }
    export class FieldClear extends Component {
    }
}
/// <amd-module name="@cxl/ui/layout.js" />
declare module "@cxl/ui/layout.js" {
    import { Component } from "@cxl/component";
    import { ColorValue } from "@cxl/ui/core.js";
    export class C extends Component {
        flex: boolean;
        vflex: boolean;
        grow: boolean;
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        pad?: 8 | 16 | 24 | 32;
        color?: ColorValue;
        primary: boolean;
        secondary: boolean;
        center: boolean;
        middle: boolean;
        gap?: 8 | 16 | 24 | 32 | 64;
    }
    export class Layout extends Component {
        center: boolean;
        full: boolean;
        vpad?: 48 | 96;
    }
    export class Content extends Layout {
    }
    export class Page extends Component {
    }
    export class Card extends C {
        elevation: 1 | 2 | 3 | 4 | 5;
    }
    export class Grid extends Component {
        rows?: number;
        columns: number;
        coltemplate?: string;
    }
    export class GridLayout extends Component {
        type: 'two-column' | 'two-column-left';
    }
}
/// <amd-module name="@cxl/ui/item.js" />
declare module "@cxl/ui/item.js" {
    import { Component } from "@cxl/component";
    export class ItemLayout extends Component {
        selected: boolean;
    }
    export class Item extends ItemLayout {
        disabled: boolean;
        touched: boolean;
    }
}
/// <amd-module name="@cxl/ui/tabs.js" />
declare module "@cxl/ui/tabs.js" {
    import { Component } from "@cxl/component";
    export class Tab extends Component {
        selected: boolean;
        name?: string;
    }
    export class Tabs extends Component {
        selected?: Tab;
    }
    export class TabPanel extends Component {
        name?: string;
    }
}
/// <amd-module name="@cxl/ui/navigation.js" />
declare module "@cxl/ui/navigation.js" {
    import { Component } from "@cxl/component";
    import { Drawer } from "@cxl/ui/dialog.js";
    export class Navbar extends Component {
        permanent: boolean;
        drawer?: Drawer;
    }
    export class NavbarSubtitle extends Component {
    }
    export class List extends Component {
    }
}
/// <amd-module name="@cxl/ui/avatar.js" />
declare module "@cxl/ui/avatar.js" {
    import { Component } from "@cxl/component";
    import { Size } from "@cxl/ui/core.js";
    export class Avatar extends Component {
        size: Size;
        src: string;
        text: string;
    }
}
declare module "cxl/ui/multiselect" {
    import { Option, SelectMenu, SelectBase } from "@cxl/ui/select.js";
    export class MultiSelect extends SelectBase {
        placeholder: string;
        readonly selected: Set<Option>;
        value: any[];
        protected focusedOption?: Option;
        protected positionMenu(menu: SelectMenu): void;
        protected setSelected(option: Option): void;
        protected setFocusedOption(option: Option): void;
        protected clearFocusedOption(): void;
        open(): void;
        close(): void;
    }
}
/// <amd-module name="@cxl/ui/appbar-search.js" />
declare module "@cxl/ui/appbar-search.js" {
    import { IconButton } from "@cxl/ui/icon.js";
    import { InputBase } from "@cxl/ui/input-base.js";
    import { Input } from "@cxl/ui/form.js";
    export class AppbarSearch extends InputBase {
        opened: boolean;
        protected desktopInput?: Input;
        protected mobileIcon?: IconButton;
        value: string;
        open(): void;
        focus(): void;
    }
}
/// <amd-module name="@cxl/ui/appbar-menu.js" />
declare module "@cxl/ui/appbar-menu.js" {
    import { Component } from "@cxl/component";
    export class AppbarMenu extends Component {
    }
    export class AppbarItem extends Component {
    }
}
declare module "cxl/ui/drag" {
    import { Component } from "@cxl/component";
    export class DropTarget extends Component {
        $items: DataTransferItem[];
        get items(): DataTransferItem[];
    }
}
declare module "cxl/ui/carousel" {
    import { Component, Span } from "@cxl/component";
    export class Slide extends Component {
    }
    const SlideAnimation: {
        default(host: Carousel, el: Span): void;
        continuous(host: Carousel, el: Span, prev: number): void;
    };
    export class Carousel extends Component {
        delay: number;
        speed: number;
        type: keyof typeof SlideAnimation;
        index: number;
        slides: Set<Slide>;
    }
    export class CarouselPagination extends Component {
    }
    export class CarouselNavigation extends Component {
    }
}
declare module "cxl/ui/datepicker" {
    import { InputBase } from "@cxl/ui/input-base.js";
    import { ButtonBase } from "@cxl/ui/core.js";
    interface DateInformation {
        date: Date;
        isToday: boolean;
        isOutsideMonth: boolean;
        time: number;
    }
    export class CalendarDate extends ButtonBase {
        selected: boolean;
        flat: boolean;
        date?: DateInformation;
    }
    export class Datepicker extends InputBase {
        value: Date | undefined;
        focus(): void;
    }
    export class DatepickerToggle extends InputBase {
        opened: boolean;
    }
    export class DatepickerInput extends InputBase {
        value: Date | undefined;
    }
}
declare module "cxl/ui/table" {
    import { Component } from "@cxl/component";
    import { Toolbar } from "@cxl/ui/core.js";
    import { Checkbox } from "@cxl/ui/checkbox.js";
    type DatasetController = (action: DataAction) => void;
    type DataEvent = 'filter' | 'sort' | 'slice' | 'update' | 'select' | 'render';
    interface DataAction<T extends Component = Component> {
        type: DataEvent;
        target: T;
        value: any;
        state: any;
    }
    export function datasetRegistable<T extends Component>(host: T, controller: DatasetController): import("@cxl/rx").Observable<never>;
    export class SortIcon extends Component {
    }
    export class Th extends Component {
        width?: number;
        sortable: boolean | 'numeric';
        sort: 'asc' | 'desc' | 'none';
        field?: string;
    }
    export class Table extends Component {
    }
    class Cell extends Component {
        right: boolean;
    }
    export class Td extends Cell {
    }
    export class TableSelectAll extends Checkbox {
    }
    export class Tr extends Component {
        value?: any;
    }
    export class TrSelectable extends Component {
        selected: boolean;
        value: any;
    }
    export class TableBody extends Component {
    }
    export class TableToolbar extends Toolbar {
    }
    export class TableSelectedCount extends Component {
        selected: any;
    }
    export function getPageCount(total: number, rows: number): number;
    export class TablePagination extends Component {
        rows: number;
        options: number[];
        page: number;
        readonly total = 0;
        goFirst(): void;
        goNext(): void;
        goPrevious(): void;
        goLast(): void;
    }
    export class Dataset extends Component {
        source: any[];
        value: any[];
        readonly selectable: Set<any>;
        readonly selected: Set<any>;
        update?: (state: any) => any[];
    }
    export class DataTable extends Dataset {
    }
    export class TableSource extends Component {
    }
    export class DatasetSource extends Component {
        src?: string;
    }
}
declare module "cxl/ui/user" {
    import { Component } from "@cxl/component";
    export interface User {
        displayName?: string;
        isVerified: boolean;
        email: string;
        photoUrl?: string;
    }
    export class UserVerified extends Component {
        verified: boolean;
    }
    export class UserNavbar extends Component {
        accounthref: string;
        user?: User;
    }
}
/// <amd-module name="@cxl/ui/progress.js" />
declare module "@cxl/ui/progress.js" {
    import { Component } from "@cxl/component";
    export class Progress extends Component {
        value: number;
    }
}
declare module "cxl/ui/animate" {
    import { Component } from "@cxl/component";
    import { UiTheme } from "@cxl/ui/theme.js";
    export class Animate extends Component {
        name?: keyof UiTheme['animation'];
        delay?: number;
        trigger?: 'visible';
    }
    interface CountOptions {
        step?: number;
        start?: number;
        end: number;
        time?: number;
    }
    export function count({ step, start, end, time }: CountOptions): import("@cxl/rx").Observable<any>;
}
/// <amd-module name="@cxl/ui" />
declare module "@cxl/ui" {
    export * from "@cxl/ui/appbar.js";
    export * from "@cxl/ui/autocomplete.js";
    export * from "@cxl/ui/badge.js";
    export { Button } from "@cxl/ui/button.js";
    export * from "@cxl/ui/checkbox.js";
    export { Application, ColorAttribute, ColorValue, Hr, Meta, RippleContainer, Ripple, Span, T, Toggle, Toolbar, ripple, } from "@cxl/ui/core.js";
    export { Spinner } from "@cxl/ui/spinner.js";
    export { Field, Fieldset } from "@cxl/ui/field.js";
    export { theme } from "@cxl/ui/theme.js";
    export * from "@cxl/ui/menu.js";
    export * from "cxl/ui/fab";
    export * from "@cxl/ui/chip.js";
    export * from "@cxl/ui/dialog.js";
    export { InputBase } from "@cxl/ui/input-base.js";
    export * from "@cxl/ui/form.js";
    export * from "@cxl/ui/layout.js";
    export * from "@cxl/ui/item.js";
    export * from "@cxl/ui/tabs.js";
    export * from "@cxl/ui/navigation.js";
    export * from "@cxl/ui/avatar.js";
    export * from "cxl/ui/multiselect";
    export { SelectBox, Option } from "@cxl/ui/select.js";
    export { IconButton, SvgIcon } from "@cxl/ui/icon.js";
    export { AppbarSearch } from "@cxl/ui/appbar-search.js";
    export * from "@cxl/ui/appbar-menu.js";
    export * from "cxl/ui/drag";
    export * from "cxl/ui/carousel";
    export * from "cxl/ui/datepicker";
    export * from "cxl/ui/table";
    export * from "cxl/ui/user";
    export * from "@cxl/ui/progress.js";
    export * from "cxl/ui/animate";
    export * from "@cxl/ui/svg.js";
}
/// <amd-module name="@cxl/router" />
declare module "@cxl/router" {
    type RouteArguments = {
        [key: string]: any;
    };
    type RouteElement = Node;
    interface RouteInstances {
        [key: string]: RouteElement;
    }
    export interface RouterState {
        url: Url;
        root: Node;
        current: Node;
        arguments?: RouteArguments;
        route: Route<RouteElement>;
    }
    export interface RouteDefinition<T extends RouteElement> {
        id?: string;
        path?: string;
        isDefault?: boolean;
        parent?: string;
        redirectTo?: string;
        resolve?: (args: Partial<T>) => boolean;
        render: (ctx?: any) => T;
    }
    export interface Url {
        path: string;
        hash: string;
    }
    export interface Strategy {
        getHref(url: Url | string): string;
        serialize(url: Url): void;
        deserialize(): Url;
    }
    export const sys: {
        location: Location;
        history: History;
    };
    export function normalize(path: string): string;
    export function replaceParameters(path: string, params?: Record<string, string>): string;
    export function parseQueryParameters(query: string): Record<string, string>;
    class Fragment {
        path: string;
        regex: RegExp;
        parameters: string[];
        constructor(path: string);
        _extractQuery(frag: string): Record<string, string>;
        getArguments(fragment: string): Record<string, string> | undefined;
        test(url: string): boolean;
        toString(): string;
    }
    export class Route<T extends RouteElement> {
        id: string;
        path?: Fragment;
        parent?: string;
        redirectTo?: string;
        definition: RouteDefinition<T>;
        isDefault: boolean;
        constructor(def: RouteDefinition<T>);
        createElement(args: Partial<T>): T;
        create(args: Partial<T>): T | null;
    }
    export class RouteManager {
        private routes;
        defaultRoute?: Route<any>;
        findRoute(path: string): Route<any> | undefined;
        get(id: string): Route<any> | undefined;
        register(route: Route<any>): void;
    }
    export function getElementRoute<T extends RouteElement>(el: T): Route<T> | undefined;
    export function parseUrl(url: string): Url;
    export const QueryStrategy: Strategy;
    export const PathStrategy: Strategy;
    export const HashStrategy: Strategy;
    export const Strategies: {
        hash: Strategy;
        path: Strategy;
        query: Strategy;
    };
    export class Router {
        private callbackFn?;
        state?: RouterState;
        routes: RouteManager;
        instances: RouteInstances;
        root?: RouteElement;
        constructor(callbackFn?: ((state: RouterState) => void) | undefined);
        private findRoute;
        private executeRoute;
        private discardOldRoutes;
        private execute;
        route<T extends RouteElement>(def: RouteDefinition<T>): Route<T>;
        go(url: Url | string): void;
        getPath(routeId: string, params: RouteArguments): string | undefined;
        isActiveUrl(url: string): boolean;
    }
}
/// <amd-module name="@cxl/ui-router" />
declare module "@cxl/ui-router" {
    import { Router as MainRouter, RouterState, Strategy } from "@cxl/router";
    import { Observable, Reference } from "@cxl/rx";
    import { Component } from "@cxl/component";
    export const router: MainRouter;
    export const routerState: Reference<RouterState>;
    interface RouteOptions {
        path: string;
        id?: string;
        parent?: string;
        redirectTo?: string;
    }
    export function Route(path: string | RouteOptions): (ctor: any) => void;
    export function DefaultRoute(path?: string | RouteOptions): (ctor: any) => void;
    export function routeIsActive(path: string): Observable<boolean>;
    export function routerOutlet(host: HTMLElement): Observable<RouterState>;
    export function routerStrategy(getUrl: Observable<any>, strategy?: Strategy): Observable<any>;
    export function setDocumentTitle(): Observable<any[]>;
    export function initializeRouter(host: Component, strategy?: 'hash' | 'query' | 'path' | Strategy, getUrl?: Observable<any>): Observable<any>;
    export function Router(strategy?: 'hash' | 'query' | 'path' | Strategy, getUrl?: Observable<any>): (ctor: any) => void;
    export function RouterTitle(): Node;
    export class RouterAppbarTitle extends Component {
    }
    export class RouterLink extends Component {
        href?: string;
        focusable: boolean;
        external: boolean;
    }
    export class RouterTab extends Component {
        href: string;
    }
    export class A extends RouterLink {
        focusable: boolean;
    }
    export class RouterItem extends Component {
        href?: string;
        disabled: boolean;
        focus(): void;
    }
    export class RouterOutlet extends Component {
    }
    export class RouterComponent extends Component {
        strategy: 'hash' | 'path' | 'query';
    }
}
declare module "cxl/www/index" {
    import { Component } from "@cxl/component";
    export interface Configuration {
        links: {
            docs: string;
        };
        login: {
            url: string;
        };
        priceId: string;
        oneTimePriceId: string;
        api: {
            payment: string;
        };
    }
    export type ProductType = 'component' | 'kit' | 'library' | 'app' | 'game' | 'template';
    export interface Links {
        bugs?: string;
        homepage?: string;
        npm?: string;
    }
    export interface Package {
        name: string;
        version?: string;
        license: string;
        description: string;
    }
    export interface Product extends Package {
        id: string;
        title?: string;
        browserScript?: string;
        links?: Links;
        keywords?: string[];
        price?: number;
        screenshot?: string;
        search: string;
        type: ProductType;
        demo?: string;
        package?: string;
    }
    global {
        interface HTMLIFrameElement {
            loading: 'lazy';
        }
    }
    export class ComponentCount extends Component {
    }
    export class StoreBuy extends Component {
        routeTitle: string;
    }
    export class ProductList extends Component {
        type: ProductType;
    }
    export class ProductGrid extends Component {
        type: ProductType;
    }
}
declare module "cxl/source/index" {
    import { MappingItem, SourceMapConsumer, RawSourceMap } from 'source-map';
    export interface Output {
        path: string;
        source: Buffer;
        mtime?: number;
    }
    export interface Position {
        line: number;
        column: number;
    }
    export interface Range {
        start: number;
        end: number;
    }
    export interface SourcePosition {
        source: string;
        line: number;
        column: number;
    }
    export interface RangePosition {
        start: SourcePosition;
        end: SourcePosition;
    }
    export function indexToPosition(source: string, index: number): Position;
    export function positionToIndex(source: string, pos: Position): number;
    export class SourceMap {
        path: string;
        dir: string;
        map?: SourceMapConsumer;
        raw?: RawSourceMap;
        mappings: MappingItem[];
        constructor(path: string);
        load(): Promise<this>;
        originalPosition(source: string, offset: number): import("source-map").NullableMappedPosition | undefined;
        translateRange(source: string, range: Range): RangePosition | undefined;
    }
    export function getSourceMapPath(source: string, cwd: string): string;
    export function getSourceMap(sourcePath: string): Promise<SourceMap | undefined>;
    export function escapeHtml(str: string): string;
}
declare module "cxl/server/colors" {
    const codes: {
        reset: number[];
        bold: number[];
        dim: number[];
        italic: number[];
        underline: number[];
        inverse: number[];
        hidden: number[];
        strikethrough: number[];
        black: number[];
        red: number[];
        green: number[];
        yellow: number[];
        blue: number[];
        magenta: number[];
        cyan: number[];
        white: number[];
        gray: number[];
        grey: number[];
        brightRed: number[];
        brightGreen: number[];
        brightYellow: number[];
        brightBlue: number[];
        brightMagenta: number[];
        brightCyan: number[];
        brightWhite: number[];
        bgBlack: number[];
        bgRed: number[];
        bgGreen: number[];
        bgYellow: number[];
        bgBlue: number[];
        bgMagenta: number[];
        bgCyan: number[];
        bgWhite: number[];
        bgGray: number[];
        bgGrey: number[];
        bgBrightRed: number[];
        bgBrightGreen: number[];
        bgBrightYellow: number[];
        bgBrightBlue: number[];
        bgBrightMagenta: number[];
        bgBrightCyan: number[];
        bgBrightWhite: number[];
        blackBG: number[];
        redBG: number[];
        greenBG: number[];
        yellowBG: number[];
        blueBG: number[];
        magentaBG: number[];
        cyanBG: number[];
        whiteBG: number[];
    };
    type Colors<T> = {
        [P in keyof T]: (str: string) => string;
    };
    export const colors: Colors<typeof codes>;
}
declare module "cxl/server/index" {
    import { Observable } from "@cxl/rx";
    import { colors } from "cxl/server/colors";
    import { SpawnOptions } from 'child_process';
    type OperationFunction<T> = (() => Promise<T>) | Promise<T> | Observable<T>;
    type LogMessage<T = any> = string | ((p: T) => string) | Error;
    export function syncFiles(file1: string, file2: string): Promise<void>;
    export function filesNeedSync(file1: string, file2: string): Promise<boolean>;
    export function mkdirp(dir: string): Promise<any>;
    export function sh(cmd: string, options?: SpawnOptions): Promise<string>;
    interface Parameter {
        name: string;
        shortcut?: string;
        rest?: boolean;
        type?: 'string' | 'boolean' | 'number';
        help?: string;
        handle?(app: Application, value: string): void;
    }
    class ApplicationParameters {
        private app;
        readonly parameters: Parameter[];
        constructor(app: Application);
        register(...p: Parameter[]): void;
        parseJsonFile(fileName: string): void;
        parseJson(json: any): void;
        parse(args: string[]): void;
    }
    export function readJson<T = any>(fileName: string): Promise<T | undefined>;
    export abstract class Application {
        name?: string;
        color: keyof typeof colors;
        version?: string;
        parameters: ApplicationParameters;
        package?: any;
        started: boolean;
        private coloredPrefix?;
        setup(): void;
        log(msg: LogMessage, op?: OperationFunction<any>): Promise<void>;
        protected handleError(e?: any): void;
        start(): Promise<any>;
        protected abstract run(): Promise<any> | void;
    }
}
declare module "cxl/build/tsc" {
    import * as ts from 'typescript';
    import { BuilderProgram, BuildOptions, Diagnostic, Program } from 'typescript';
    import type { Output } from "cxl/source/index";
    import { Observable, Subscriber } from "@cxl/rx";
    export { version as tscVersion, BuildOptions } from 'typescript';
    export function buildDiagnostics(program: Program | BuilderProgram): ts.Diagnostic[];
    export function printDiagnostics(diagnostics: Diagnostic[]): void;
    export function tsbuild(tsconfig: string | undefined, subs: Subscriber<Output>, defaultOptions?: BuildOptions): void;
    export function tsconfig(tsconfig?: string, options?: BuildOptions): Observable<Output>;
    export function flagsToString(flags: any, Flags: any): string[];
    export function bundle(tsconfig?: string, outFile?: string): Observable<Output>;
}
declare module "cxl/build/file" {
    import * as Terser from 'terser';
    import { Observable } from "@cxl/rx";
    import { Output } from "cxl/source/index";
    interface MinifyConfig extends Terser.MinifyOptions {
        sourceMap?: {
            content?: string;
            url: string;
        };
    }
    export function read(source: string): Promise<Output>;
    export function file(source: string, out?: string): Observable<{
        path: string;
        source: Buffer;
    }>;
    export function basename(replace?: string): import("@cxl/rx").Operator<Output, Output>;
    export function concatFile(outName: string, separator?: string): import("@cxl/rx").Operator<Output, {
        path: string;
        source: string;
    }>;
    export function files(sources: string[]): Observable<Output>;
    export function matchStat(fromPath: string, toPath: string): Promise<boolean>;
    export function copyDir(fromPath: string, toPath: string): Observable<never>;
    export function getSourceMap(out: Output): Output | undefined;
    export const MinifyDefault: MinifyConfig;
    export function minify(op?: MinifyConfig): (source: Observable<Output>) => Observable<Output>;
    export function zip(src: string[], path: string): Observable<Output>;
}
declare module "cxl/build/npm" {
    export function getPublishedVersion(packageName: string): Promise<string | undefined>;
    export function checkNpms(name: string): Promise<any>;
    export function checkNpm(name: string): Promise<any>;
}
declare module "cxl/build/package" {
    import { Observable } from "@cxl/rx";
    import { Output } from "cxl/source/index";
    import * as ts from 'typescript';
    type License = 'GPL-3.0' | 'GPL-3.0-only' | 'Apache-2.0' | 'UNLICENSED';
    export type Dependencies = Record<string, string>;
    export interface Package {
        name: string;
        version: string;
        description: string;
        license: License;
        files: string[];
        main: string;
        bin?: string;
        keywords?: string[];
        browser?: string;
        homepage: string;
        private: boolean;
        bugs: string;
        repository: string | {
            type: 'git';
            url: string;
            directory?: string;
        };
        dependencies?: Dependencies;
        devDependencies?: Dependencies;
        peerDependencies?: Dependencies;
        bundledDependecies?: Dependencies;
        type?: string;
        scripts?: Record<string, string>;
    }
    export const BASEDIR: string;
    export function readPackage(base?: string): Package;
    export function docs(dirName: string, devMode?: boolean): Observable<any>;
    export function getBranch(cwd: string): Promise<string>;
    export function readme(): Observable<{
        path: string;
        source: Buffer;
    }>;
    export function pkg(): Observable<Output>;
    export function publish(): Promise<void>;
    export function AMD(): Observable<Output>;
    export function bundle(files: Record<string, string>, outFile: string, config?: ts.CompilerOptions): Observable<Output>;
    interface TemplateConfig {
        header: string;
        debugHeader: string;
    }
    export function template(filename: string, config?: Partial<TemplateConfig>): Observable<{
        path: string;
        source: string;
    }>;
}
declare module "cxl/build/builder" {
    import { SpawnOptions } from 'child_process';
    import { Application } from "cxl/server/index";
    import { Observable } from "@cxl/rx";
    import { Output } from "cxl/source/index";
    import { Package } from "cxl/build/package";
    export interface BuildConfiguration {
        target?: string;
        outputDir: string;
        tasks: Task[];
    }
    export type Task = Observable<Output>;
    export class Builder extends Application {
        name: string;
        baseDir?: string;
        outputDir: string;
        modulePackage?: Package;
        hasErrors: boolean;
        protected run(): Promise<void>;
        build(config: BuildConfiguration): Promise<void>;
    }
    export const builder: Builder;
    export function build(...targets: BuildConfiguration[]): Promise<void>;
    export function exec(cmd: string): Observable<void>;
    export function shell(cmd: string, options?: SpawnOptions): Observable<Buffer>;
}
declare module "cxl/build/lint" {
    import { Observable } from "@cxl/rx";
    import { Output } from "cxl/source/index";
    export function eslint(options?: any): Observable<Output>;
}
declare module "cxl/build/cxl" {
    import { Output } from "cxl/source/index";
    import { BuildConfiguration } from "cxl/build/builder";
    export function minifyIf(filename: string): (source: import("@cxl/rx").Observable<Output>) => import("@cxl/rx").Observable<Output>;
    export function buildCxl(...extra: BuildConfiguration[]): Promise<void>;
}
declare module "cxl/build/index" {
    export { tsconfig, bundle as tsBundle } from "cxl/build/tsc";
    export { basename, file, files, concatFile, copyDir, minify, zip, } from "cxl/build/file";
    export { concat } from "@cxl/rx";
    export { mkdirp, sh } from "cxl/server/index";
    export { Output } from "cxl/source/index";
    export { AMD, Package, pkg, readme, bundle, template, getBranch, } from "cxl/build/package";
    export { buildCxl } from "cxl/build/cxl";
    export { Task, build, exec, shell } from "cxl/build/builder";
}
declare module "cxl/blog/index" {
    import { Task } from "cxl/build/index";
    export interface BlogConfig {
        postsDir?: string | string[];
        headerTemplate?: string;
        highlight?: boolean;
        includeContent?: boolean;
    }
    export interface BlogPosts {
        posts: Post[];
        tags: Record<string, string[]>;
    }
    export interface Meta {
        uuid: string;
        date: string;
        author: string;
        tags?: string;
    }
    export interface Post {
        uuid: string;
        id: string;
        title: string;
        date: string;
        version?: string;
        mtime: string;
        author: string;
        type: string;
        tags?: string;
        href?: string;
        content: string;
        summary: string;
    }
    export function renderMarkdown(source: string, config?: BlogConfig): {
        meta: any;
        content: string;
    };
    export function buildBlog(config: BlogConfig): Task;
}
declare module "cxl/www/build-data" { }
