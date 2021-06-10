import { Observable, ListEvent, observable, merge } from '@cxl/rx';
import firebase from 'firebase/app';
import 'firebase/database';

export type UID = string;

export class Reference<T> extends Observable<T> {
	readonly path: string;

	constructor(dir: string, readonly key: string) {
		super(subs => {
			const ref$ = firebase.database().ref(this.path);
			const onValue = (snap: firebase.database.DataSnapshot) =>
				subs.next(snap.val());
			ref$.on('value', onValue);
			return () => {
				ref$.off('value', onValue);
			};
		});
		this.path = key ? `${dir}/${key}` : dir;
	}

	next(val: T) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.set(val);
	}

	ref<K extends keyof T>(key: K) {
		return new Reference<T[K]>(this.path, key.toString());
	}
}

type Collection<T> = Reference<Record<string, T>>;
type CollectionEvent<T> = ListEvent<Reference<T>, string>;
type Snapshot = firebase.database.DataSnapshot;

function getRef(ref: Reference<any>) {
	return firebase.database().ref(ref.path);
}

function on(ref$: firebase.database.Query, ev: firebase.database.EventType) {
	return observable<any>(subs => {
		function handler(snap: firebase.database.DataSnapshot) {
			subs.next(snap);
		}
		ref$.on(ev, handler);
		return () => ref$.off(ev, handler);
	});
}

function createCollection<T>(
	path: string,
	ref$: firebase.database.Query,
	getItem: (snap: Snapshot, path: string) => Reference<T>
) {
	return new Observable<CollectionEvent<T>>(subs => {
		subs.next({ type: 'empty' });
		function next(
			type: 'insert' | 'remove',
			snap: firebase.database.DataSnapshot
		) {
			subs.next({ type, key: snap.key || '', item: getItem(snap, path) });
		}
		const inner = merge(
			on(ref$, 'child_added').tap(next.bind(null, 'insert')),
			on(ref$, 'child_removed').tap(next.bind(null, 'remove'))
		).subscribe();

		return () => inner.unsubscribe();
	});
}

export function observe<T>(ref: Reference<T>) {
	return new Observable<T>(subs => {
		const ref$ = getRef(ref);
		const onValue = (snap: firebase.database.DataSnapshot) =>
			subs.next(snap.val());
		ref$.on('value', onValue);
		return () => ref$.off('value', onValue);
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
	const ref$ = firebase.database().ref(ref.path);
	const child = await ref$.push(initial);
	if (child.key === null) throw new Error('Invalid key');
	return child.key;
}

export function db<T>(path: string) {
	return new Reference<T>(path, '');
}

export function remove(ref: Reference<any>) {
	return getRef(ref).remove();
}

type BaseTypes = string | number | boolean | null;
type AllowedProperties<T> = {
	[K in keyof T]: T[K] extends BaseTypes ? T[K] : never;
};

export function where<T, K extends keyof AllowedProperties<T>>(
	ref: Collection<T>,
	field: K,
	equalTo: AllowedProperties<T>[K]
) {
	const ref$ = firebase
		.database()
		.ref(ref.path)
		.orderByChild(field.toString())
		.equalTo(equalTo);
	return createCollection(
		ref.path,
		ref$,
		(snap, path) => new Reference<T>(path, `${snap.key}`)
	);
}
