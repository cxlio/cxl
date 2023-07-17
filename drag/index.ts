///<amd-module name="@cxl/drag"/>
import { EMPTY, Observable, of, merge } from '@cxl/rx';
import { on } from '@cxl/dom';

export interface DragOptions {
	element: HTMLElement;
	//onStart?(ev: DragEvent): void;
	//onEnd?(ev: DragEvent | Touch): void;
	//emitStart?: boolean;
	delay?: number;
}

export interface DragMoveOptions {
	element: HTMLElement;
	axis?: 'x' | 'y';
}

export interface DragEvent {
	dragType: 'start' | 'end' | 'move';
	target: EventTarget | null;
	clientX: number;
	clientY: number;
}

export interface TouchGesture {
	type: 'swipe-left' | 'swipe-right';
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
	return on(window, 'touchmove', { passive: true }).map(ev =>
		findTouch(ev, touchId)
	);
}

function toEvent(type: 'start' | 'end' | 'move', ev: MouseEvent | Touch) {
	(ev as unknown as DragEvent).dragType = type;
	return ev as unknown as DragEvent;
}

export function onTouchDrag({ element }: DragOptions) {
	return on(element, 'touchstart').switchMap(ev => {
		const touchId = getTouchId(ev);
		const target = ev.currentTarget;

		if (!target || touchId === undefined) return EMPTY;

		ev.stopPropagation();

		const style = element.style;
		const { userSelect, transition, touchAction } = style;
		style.userSelect = style.transition = 'none';
		if (!touchAction) style.touchAction = 'none';

		return new Observable<DragEvent>(subscriber => {
			const touch = findTouch(ev, touchId);
			if (touch) subscriber.next(toEvent('start', touch));

			const subscription = merge(
				onTouchMove(touchId).tap(
					ev => ev && subscriber.next(toEvent('move', ev))
				),
				onTouchEnd(touchId).tap(ev => {
					style.userSelect = userSelect;
					style.transition = transition;
					style.touchAction = touchAction;
					if (ev) subscriber.next(toEvent('end', ev));
					subscriber.complete();
				})
			).subscribe();

			return () => subscription.unsubscribe();
		});
	});
}

export function onTouchSwipe({
	element,
}: DragOptions): Observable<TouchGesture> {
	let startTime: number, startX: number, startY: number;
	return onTouchDrag({ element }).switchMap(ev => {
		if (ev.dragType === 'start') {
			startX = ev.clientX;
			startY = ev.clientY;
			startTime = Date.now();
		} else if (ev.dragType === 'end') {
			const dx = ev.clientX - startX;
			const dy = ev.clientY - startY;
			const duration = Date.now() - startTime;
			if (
				duration < 1000 &&
				Math.abs(dx) > 30 &&
				Math.abs(dx) > Math.abs(dy)
			) {
				const type = dx > 0 ? 'swipe-right' : 'swipe-left';
				return of({ type });
			}
		}
		return EMPTY;
	});
}

export function onMouseDrag({ element, delay }: DragOptions) {
	let ready = false,
		timeout = 0;
	delay ??= 60;
	return on(element, 'mousedown').switchMap(ev => {
		const target = ev.currentTarget;

		if (!target) return EMPTY;

		const style = element.style;
		style.userSelect = 'none';
		const { userSelect, transition } = style;

		ready = false;
		ev.stopPropagation();

		return new Observable<DragEvent>(subscriber => {
			timeout = setTimeout(() => {
				style.transition = 'none';
				ready = true;
				subscriber.next(toEvent('start', ev));
			}, delay) as unknown as number;
			const subscription = merge(
				on(window, 'mousemove').tap(ev => {
					if (ready) subscriber.next(toEvent('move', ev));
				}),
				on(window, 'mouseup').tap(ev => {
					if (ready) {
						style.transition = transition;
						subscriber.next(toEvent('end', ev));
					} else clearTimeout(timeout);
					style.userSelect = userSelect;
					subscriber.complete();
				})
			).subscribe();

			return () => subscription.unsubscribe();
		});
	});
}

export function onDrag(options: DragOptions) {
	return merge(onTouchDrag(options), onMouseDrag(options));
}

export function dragInside(element: HTMLElement) {
	let rect: DOMRect;
	return onDrag({
		element,
		delay: 0,
	}).map<DragEvent>(ev => {
		if (ev.dragType === 'start') {
			rect = element.getBoundingClientRect();
		}
		const clientX = (ev.clientX - rect.x) / rect.width;
		const clientY = (ev.clientY - rect.y) / rect.height;

		return { dragType: ev.dragType, target: element, clientX, clientY };
	});
}

export function onDragMove({ element, axis }: DragMoveOptions) {
	let start:
		| {
				width: number;
				height: number;
				x: number;
				y: number;
				sx: number;
				sy: number;
		  }
		| undefined;
	return onDrag({
		element,
	}).switchMap(event => {
		if (event.dragType === 'start') {
			start = {
				width: element.offsetWidth,
				height: element.offsetHeight,
				x: event.clientX,
				y: event.clientY,
				sx: event.clientX / element.offsetWidth,
				sy: event.clientY / element.offsetHeight,
			};
		} else if (event.dragType === 'end') {
			element.style.transform = ``;
			start = undefined;
		} else if (start) {
			const x =
				axis === 'y' ? 0 : (event.clientX - start.x) / start.width;
			const y =
				axis === 'x' ? 0 : (event.clientY - start.y) / start.height;

			return of({ event, x, y, sx: start.sx, sy: start.sy });
		}
		return EMPTY;
	});
}

export function dragMove(o: DragMoveOptions) {
	return onDragMove(o).tap(({ x, y }) => {
		o.element.style.transform = `translate(${x * 100}%, ${y * 100}%)`;
	});
}

/**
 * Applies the dragover attribute for drop targets
 */
export function dropTarget<T extends HTMLElement>($: T) {
	let count = 0;
	return merge(
		on($, 'dragenter').tap(ev => {
			if (++count === 1) $.setAttribute('dragover', '');
			ev.stopPropagation();
		}),
		on($, 'dragleave').tap(() => {
			if (--count === 0) $.removeAttribute('dragover');
		}),
		on($, 'dragover').tap(ev => ev.preventDefault()),
		on($, 'drop').tap(ev => {
			ev.preventDefault();
			ev.stopPropagation();
			$.removeAttribute('dragover');
			count = 0;
		})
	).filter(ev => ev.type === 'drop');
}
