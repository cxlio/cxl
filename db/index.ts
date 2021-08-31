import { Observable, ListEvent, observable, merge } from '@cxl/rx';
import {
	DataSnapshot,
	Query,
	getDatabase,
	ref as fbRef,
	onChildAdded,
	onChildRemoved,
	onValue,
	push as fbPush,
	remove as fbRemove,
	set,
	query,
	orderByChild,
	equalTo,
} from 'firebase/database';

export type UID = string;

export class Reference<T> extends Observable<T> {
	readonly path: string;

	constructor(dir: string, readonly key: string) {
		super(subs => {
			const ref$ = fbRef(getDatabase(), this.path);
			const cb = (snap: DataSnapshot) => subs.next(snap.val());
			return onValue(ref$, cb);
		});
		this.path = key ? `${dir}/${key}` : dir;
	}

	next(val: T) {
		const ref$ = fbRef(getDatabase(), this.path);
		return set(ref$, val);
	}

	ref<K extends keyof T>(key: K) {
		return new Reference<T[K]>(this.path, key.toString());
	}
}

type Collection<T> = Reference<Record<string, T>>;
type CollectionEvent<T> = ListEvent<Reference<T>, string>;
type Snapshot = DataSnapshot;

function getRef(ref: Reference<any>) {
	return fbRef(getDatabase(), ref.path);
}

function on(ref$: Query, onFn: typeof onValue) {
	return observable<any>(subs => {
		function handler(snap: DataSnapshot) {
			subs.next(snap);
		}
		return onFn(ref$, handler);
	});
}

function createCollection<T>(
	path: string,
	ref$: Query,
	getItem: (snap: Snapshot, path: string) => Reference<T>
) {
	return new Observable<CollectionEvent<T>>(subs => {
		subs.next({ type: 'empty' });
		function next(type: 'insert' | 'remove', snap: DataSnapshot) {
			subs.next({ type, key: snap.key || '', item: getItem(snap, path) });
		}
		const inner = merge(
			on(ref$, onChildAdded).tap(next.bind(null, 'insert')),
			on(ref$, onChildRemoved).tap(next.bind(null, 'remove'))
		).subscribe();

		return () => inner.unsubscribe();
	});
}

export function observe<T>(ref: Reference<T>) {
	return new Observable<T>(subs => {
		const ref$ = getRef(ref);
		const cb = (snap: DataSnapshot) => subs.next(snap.val());
		return onValue(ref$, cb);
	});
}

export function collection<T>(ref: Collection<T>) {
	return createCollection(
		ref.path,
		getRef(ref),
		(snap, path) => new Reference<T>(path, `${snap.key}`)
	);
}

export function mapValueCollection<T, T2>(
	ref: Collection<T>,
	refTo: Collection<T2>
) {
	return createCollection(ref.path, getRef(ref), snap =>
		refTo.ref(snap.val())
	);
}

export function mapCollection<T, T2>(
	ref: Collection<T>,
	refTo: Collection<T2>
) {
	return createCollection(ref.path, getRef(ref), snap =>
		refTo.ref(snap.key || '')
	);
}

/**
 * Pushes a new value into the reference, and returns a new reference key
 */
export async function push<T>(ref: Collection<T>, initial?: T) {
	const ref$ = fbRef(getDatabase(), ref.path);
	const child = await fbPush(ref$, initial);
	if (child.key === null) throw new Error('Invalid key');
	return child.key;
}

export function db<T>(path: string) {
	return new Reference<T>(path, '');
}

export function remove(ref: Reference<any>) {
	return fbRemove(getRef(ref));
}

type BaseTypes = string | number | boolean | null;
type AllowedProperties<T> = {
	[K in keyof T]: T[K] extends BaseTypes ? T[K] : never;
};

export function where<T, K extends keyof AllowedProperties<T>>(
	ref: Collection<T>,
	field: K,
	equalToField: AllowedProperties<T>[K]
) {
	const ref$ = query(
		fbRef(getDatabase(), ref.path),
		orderByChild(field.toString()),
		equalTo(equalToField)
	);
	return createCollection(
		ref.path,
		ref$,
		(snap, path) => new Reference<T>(path, `${snap.key}`)
	);
}
