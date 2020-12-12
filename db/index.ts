import { Observable, ListEvent } from '../rx/index.js';
import * as firebase from 'firebase/app';
import 'firebase/database';

export type UID = string;

export class Reference<T> extends Observable<T> {
	readonly path: string;

	constructor(dir: string, readonly key: string) {
		super(subs => {
			const ref$ = firebase.database().ref(this.path);
			const onValue = (snap: any) => subs.next(snap.val());
			ref$.on('value', onValue);
			return () => ref$.off('value', onValue);
		});
		this.path = key ? `${dir}/${key}` : dir;
	}

	next(val: T) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.set(val);
	}

	then<R>(resolve: (val: T) => R, reject: (e: any) => void) {
		const ref$ = firebase.database().ref(this.path);
		return ref$.once('value').then(snap => resolve(snap.val()), reject);
	}

	ref<K extends keyof T>(key: K) {
		return new Reference<T[K]>(this.path, key.toString());
	}
}

type Collection<T> = Reference<Record<string, T>>;
type CollectionEvent<T> = ListEvent<Reference<T>>;
type Snapshot = firebase.database.DataSnapshot;

function getRef(ref: Reference<any>) {
	return firebase.database().ref(ref.path);
}

function createCollection<T>(
	path: string,
	ref$: firebase.database.Query,
	getItem: (snap: Snapshot, path: string) => Reference<T>
) {
	return new Observable<CollectionEvent<T>>(subs => {
		subs.next({ type: 'empty' });
		ref$.on('child_added', snap =>
			subs.next({
				type: 'insert',
				item: getItem(snap, path),
			})
		);
		return () => ref$.off();
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

export function push<T>(ref: Collection<T>, initial?: T) {
	const ref$ = firebase.database().ref(ref.path);
	const child = ref$.push(initial);
	if (child.key === null) throw new Error('Invalid key');
	return new Reference<T>(ref.path, child.key);
}

export function db<T>(path: string) {
	return new Reference<T>(path, '');
}

/*function observe<T>(ref$: firebase.database.Query) {
	return new Observable<T>(subs => {
		ref$.on('value', snap => subs.next(snap.val()));
		return () => ref$.off('value');
	});
}*/
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
