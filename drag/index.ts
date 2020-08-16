import { EMPTY, Observable, merge } from '../rx/index.js';
import { on } from '../dom/index.js';

export interface DragHandler {
	onStart(ev: DragEvent): void;
	onEnd(ev: DragEvent): void;
}

export interface DragEvent {
	target: HTMLElement;
	clientX: number;
	clientY: number;
}

function getTouchId(ev: TouchEvent) {
	for (const touch of ev.changedTouches)
		if (touch.target === ev.target) return touch.identifier;
}

function findTouch(ev: TouchEvent, touchId: number) {
	for (const touch of ev.changedTouches)
		if (touch.identifier === touchId) return touch;
}

function onTouchEnd(touchId: number) {
	return on(window, 'touchend').map(ev => findTouch(ev, touchId));
}

function onTouchMove(touchId: number) {
	return on(window, 'touchmove').map(ev => findTouch(ev, touchId));
}

function onTouchDrag(element: HTMLElement, handler?: DragHandler) {
	return on(element, 'touchstart', { passive: true }).switchMap(ev => {
		const touchId = getTouchId(ev);
		const target = ev.currentTarget;

		if (!target || touchId === undefined) return EMPTY;

		const style = element.style;
		const { userSelect, transition } = style;
		style.userSelect = style.transition = 'none';

		// ev.preventDefault();
		if (handler) handler.onStart(ev as any);

		return new Observable<DragEvent>(subscriber => {
			subscriber.next(findTouch(ev, touchId) as any);
			const subscription = merge(
				onTouchMove(touchId).tap(
					ev => ev && subscriber.next(ev as any)
				),
				onTouchEnd(touchId).tap(ev => {
					style.userSelect = userSelect;
					style.transition = transition;
					if (handler) handler.onEnd(ev as any);
					subscriber.complete();
				})
			).subscribe();

			return () => subscription.unsubscribe();
		});
	});
}

function onMouseDrag(element: HTMLElement, handler?: DragHandler) {
	return on(element, 'mousedown').switchMap(ev => {
		const target = ev.currentTarget;

		if (!target) return EMPTY;

		const style = element.style;
		const { userSelect, transition } = style;
		style.userSelect = style.transition = 'none';

		if (handler) handler.onStart(ev as any);

		return new Observable<DragEvent>(subscriber => {
			subscriber.next(ev as any);
			const subscription = merge(
				on(window, 'mousemove').tap(ev => subscriber.next(ev as any)),
				on(window, 'mouseup').tap(ev => {
					style.userSelect = userSelect;
					style.transition = transition;
					if (handler) handler.onEnd(ev as any);
					subscriber.complete();
				})
			).subscribe();

			return () => subscription.unsubscribe();
		});
	});
}

export function onDrag(element: HTMLElement, handler?: DragHandler) {
	return merge(onTouchDrag(element, handler), onMouseDrag(element, handler));
}

export function dragInside(target: HTMLElement) {
	let rect: DOMRect;
	return onDrag(target, {
		onStart() {
			rect = target.getBoundingClientRect();
		},
		onEnd() {
			// TODO
		},
	}).map<DragEvent>(ev => {
		const clientX = (ev.clientX - rect.x) / rect.width;
		const clientY = (ev.clientY - rect.y) / rect.height;
		return { target, clientX, clientY };
	});
}

export function dragMove(element: HTMLElement, axis?: 'x' | 'y') {
	let start: any;
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
		let transform: string;
		const x = (ev.clientX - start.x) / start.width;
		const y = (ev.clientY - start.y) / start.height;

		if (axis === 'x') transform = `translateX(${x * 100}%)`;
		else if (axis === 'y') transform = `translateY(${y * 100}%)`;
		else transform = `translate(${x * 100}%, ${y * 100}%)`;

		element.style.transform = transform;
	});
}
