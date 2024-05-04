///<amd-module name="@cxl/drag"/>
import { Subject, EMPTY, Observable, of, merge, be } from '@cxl/rx';
import { on } from '@cxl/dom';

export interface DragOptions {
	element: HTMLElement;
	delay?: number;
	target?: HTMLElement;
}

export interface DragMoveOptions {
	element: HTMLElement;
	axis?: 'x' | 'y';
	target?: HTMLElement;
}

interface DragLikeEvent {
	target: EventTarget | null;
	clientX: number;
	clientY: number;
}

export interface CustomDragEvent extends DragLikeEvent {
	dragType: 'start' | 'end' | 'move';
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

function toEvent(type: 'start' | 'end' | 'move', ev: MouseEvent | Touch) {
	(ev as unknown as CustomDragEvent).dragType = type;
	return ev as unknown as CustomDragEvent;
}

function DragState() {
	const elements: Record<
		string,
		{ element: HTMLElement; event: CustomDragEvent }
	> = {};
	const dragging = be(elements);
	const dropping = new Subject<{
		element: HTMLElement;
		event: DragLikeEvent;
	}>();

	return {
		dragging,
		dropping,
		elements,
		next: () => dragging.next(elements),
	};
}

const dragState = DragState();

export function onTouchSwipe({
	element,
}: DragOptions): Observable<TouchGesture> {
	let startTime: number, startX: number, startY: number;
	return touchEvents(element).switchMap(ev => {
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

function abstractDrag(
	onEvent: (el: HTMLElement) => Observable<CustomDragEvent>,
) {
	return ({ element, target, delay }: DragOptions) => {
		let ready = false,
			timeout = 0;
		delay ??= 60;
		const targetEl = target || element;
		const style = element.style;
		let { userSelect, transition } = style;

		return new Observable<CustomDragEvent>(subscriber => {
			function endDrag(event: CustomDragEvent, drop = true) {
				if (ready) {
					ready = false;
					style.transition = transition;
					style.userSelect = userSelect;

					subscriber.next(event);
					delete dragState.elements.mouse;
					dragState.next();
					if (drop)
						dragState.dropping.next({
							element: targetEl,
							event,
						});
				} else clearTimeout(timeout);
				//subscriber.complete();
			}

			const subscription = merge(
				onEvent(element).tap(event => {
					if (event.dragType === 'start') {
						userSelect = style.userSelect;
						transition = style.transition;

						style.userSelect = 'none';
						ready = false;

						timeout = setTimeout(() => {
							style.transition = 'none';
							ready = true;
							subscriber.next(event);
						}, delay) as unknown as number;
					} else if (event.dragType === 'move') {
						if (ready) {
							subscriber.next(event);
							dragState.elements.mouse = {
								element: targetEl,
								event,
							};
							dragState.next();
						}
					} else {
						// Allow click prevention to fire
						setTimeout(() => endDrag(event));
					}
				}),
				on(element, 'click', { capture: true }).tap(ev => {
					if (ready) ev.stopImmediatePropagation();
				}),
				on(window, 'keydown').tap(ev => {
					if (ready && ev.key === 'Escape') {
						ev.preventDefault();
						endDrag(
							{
								dragType: 'end',
								target: targetEl,
								clientX: 0,
								clientY: 0,
							},
							true,
						);
					}
				}),
			).subscribe();

			return () => subscription.unsubscribe();
		});
	};
}

export function mouseEvents(element: HTMLElement) {
	return on(element, 'mousedown').switchMap(ev => {
		if (!ev.currentTarget) return EMPTY;
		ev.preventDefault();
		ev.stopPropagation();

		return new Observable<CustomDragEvent>(sub => {
			sub.next(toEvent('start', ev));
			const subs = merge(
				on(window, 'mousemove').tap(ev =>
					sub.next(toEvent('move', ev)),
				),
				on(window, 'mouseup').tap(ev => {
					subs.unsubscribe();
					sub.next(toEvent('end', ev));
				}),
			).subscribe();
			return () => subs.unsubscribe();
		});
	});
}

export function touchEvents(element: HTMLElement) {
	return on(element, 'touchstart').switchMap(ev => {
		const touchId = getTouchId(ev);
		if (touchId === undefined) return EMPTY;

		const touch = findTouch(ev, touchId);
		if (!touch) return EMPTY;

		ev.stopPropagation();
		//ev.preventDefault();
		if (!element.style.touchAction) element.style.touchAction = 'none';

		return new Observable<CustomDragEvent>(sub => {
			sub.next(toEvent('start', touch));
			const inner = merge(
				on(window, 'touchmove', { passive: true }).tap(ev => {
					const touch = findTouch(ev, touchId);
					if (touch) sub.next(toEvent('move', touch));
				}),
				on(window, 'touchend').tap(ev => {
					const touch = findTouch(ev, touchId);
					inner.unsubscribe();
					if (touch) sub.next(toEvent('end', touch));
				}),
			).subscribe();

			return () => inner.unsubscribe();
		});
	});
}

export const onMouseDrag = abstractDrag(mouseEvents);
export const onTouchDrag = abstractDrag(touchEvents);

export function onDrag(options: DragOptions) {
	return merge(onTouchDrag(options), onMouseDrag(options));
}

export function dragInside(element: HTMLElement) {
	let rect: DOMRect;
	return onDrag({
		element,
		delay: 0,
	}).map<CustomDragEvent>(ev => {
		if (ev.dragType === 'start') {
			rect = element.getBoundingClientRect();
		}
		const clientX = (ev.clientX - rect.x) / rect.width;
		const clientY = (ev.clientY - rect.y) / rect.height;

		return { dragType: ev.dragType, target: element, clientX, clientY };
	});
}

function isInside(box: DOMRect, event: DragLikeEvent) {
	const x = event.clientX,
		y = event.clientY;
	return box.left < x && box.right > x && box.top < y && box.bottom > y;
}

function getDragElements(el: HTMLElement) {
	const els = dragState.elements;
	const elements = [];
	let box;

	for (const id in els) {
		const entry = els[id];
		const { event, element } = entry;
		if (event && element !== el) {
			box ||= el.getBoundingClientRect();

			if (isInside(box, event)) elements.push(entry);
		}
	}
	return elements;
}

export function onDragOver(el: HTMLElement) {
	let lastCount = 0;
	return dragState.dragging.switchMap(() => {
		const elements = getDragElements(el);
		if (lastCount === 0 && elements.length === 0) return EMPTY;
		lastCount = elements.length;
		return of(elements);
	});
}

export function onDrop(el: HTMLElement) {
	return dragState.dropping.switchMap(({ element, event }) =>
		el !== element && isInside(el.getBoundingClientRect(), event)
			? of(element)
			: EMPTY,
	);
}

export function onDropNative(el: HTMLElement) {
	return merge(
		on(el, 'dragover')
			.tap(ev => ev.preventDefault())
			.ignoreElements(),
		on(el, 'drop').map(() => {
			const result = dragState.elements.drag.element;
			delete dragState.elements.drag;
			return result;
		}),
	);
}

function getStart(el: HTMLElement, event: DragLikeEvent) {
	return {
		width: el.offsetWidth,
		height: el.offsetHeight,
		x: event.clientX,
		y: event.clientY,
		sx: event.clientX / el.offsetWidth,
		sy: event.clientY / el.offsetHeight,
	};
}

export interface DragMoveEvent {
	event: CustomDragEvent;
	x: number;
	y: number;
	sx: number;
	sy: number;
}

export function mapDragMove({ element, target, axis }: DragMoveOptions) {
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
	const targetEl = target || element;
	return (event: CustomDragEvent) => {
		if (event.dragType === 'start') start = getStart(targetEl, event);
		else if (event.dragType === 'end') {
			targetEl.style.transform = ``;
			start = undefined;
		} else if (start) {
			const x =
				axis === 'y' ? 0 : (event.clientX - start.x) / start.width;
			const y =
				axis === 'x' ? 0 : (event.clientY - start.y) / start.height;

			return of({ event, x, y, sx: start.sx, sy: start.sy });
		}
		return EMPTY;
	};
}

export function dragMoveApply(o: DragMoveOptions) {
	return ({ x, y }: DragMoveEvent) => {
		(o.target || o.element).style.transform = `translate(${x * 100}%, ${
			y * 100
		}%)`;
	};
}

export function onDragMove(options: DragMoveOptions) {
	return onDrag(options).switchMap(mapDragMove(options));
}

export function dragMove(o: DragMoveOptions) {
	return onDragMove(o).tap(dragMoveApply(o));
}

export interface DragPositionInfo {
	dragPositionY: 'top' | 'bottom';
}

export function getDragPosition(element: HTMLElement, ev: DragLikeEvent) {
	const box = element.getBoundingClientRect();
	return {
		dragPositionY: ev.clientY - box.top > box.height / 2 ? 'bottom' : 'top',
		dragPositionX: ev.clientX - box.left > box.width / 2 ? 'right' : 'left',
	};
}

export function dragNative({ axis, element, target }: DragMoveOptions) {
	element.draggable = true;
	const targetEl = target || element;
	return merge(on(element, 'dragstart'), on(element, 'dragend')).switchMap(
		ev => {
			if (target)
				ev.dataTransfer?.setDragImage(target, ev.offsetX, ev.offsetY);
			const start = getStart(targetEl, ev);

			return ev.type === 'dragstart'
				? on(element, 'drag').tap(event => {
						const x =
							axis === 'y'
								? 0
								: (event.clientX - start.x) / start.width;
						const y =
							axis === 'x'
								? 0
								: (event.clientY - start.y) / start.height;
						dragState.elements.drag = {
							element: targetEl,
							event: toEvent('move', event),
						};
						dragState.next();
						return of({ event, x, y, sx: start.sx, sy: start.sy });
				  })
				: EMPTY;
		},
	);
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
		}),
	).filter(ev => ev.type === 'drop');
}
