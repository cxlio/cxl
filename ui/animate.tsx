///<amd-module name="@cxl/ui/animate.js"/>
import {
	Augment,
	StyleAttribute,
	Attribute,
	Component,
	Slot,
	get,
} from '@cxl/component';
import { UiTheme, css, theme } from './theme.js';
import { animationFrame, onVisible } from '@cxl/dom';
import { EMPTY, of, merge } from '@cxl/rx';

/**
 * @beta
 * @example
 * <cxl-animate style="margin-top: 32px" name="spin">Animate</cxl-animate>
 */
@Augment<Animate>(
	'cxl-animate',
	css({
		$: { display: 'inline-block' },
		...Object.keys(theme.animation).reduce((res, key) => {
			res[`$name="${key}"`] = { animation: key };
			return res;
		}, {} as any),
	}),
	Slot,
	$ =>
		merge(
			get($, 'delay').raf(val => {
				$.style.animationDelay =
					val === undefined ? '' : `${val.toString()}ms`;
			}),
			get($, 'trigger')
				.raf()
				.switchMap(trigger => {
					if (trigger === 'visible') {
						$.style.animationPlayState = 'paused';
						return onVisible($).raf(
							visible =>
								($.style.animationPlayState = visible
									? 'running'
									: 'paused')
						);
					} else {
						$.style.animationPlayState = 'running';
						return EMPTY;
					}
				})
		)
	/*$ => {
		
		const style=<style />;
		$.bind(get($, 'name').tap(name => {
			style.innerHTML = theme.animation[name].;
		})
		return style;
	}*/
)
export class Animate extends Component {
	@StyleAttribute()
	name?: keyof UiTheme['animation'];

	/** Animation delay in milliseconds */
	@Attribute()
	delay?: number;

	@Attribute()
	trigger?: 'visible';
}

interface CountOptions {
	//step?: number;
	start?: number;
	end: number;
	time?: number;
}

export function count({ start, end, time }: CountOptions) {
	const i0 = start || 0;
	const totalTime = time || 1000;
	const dt = (end - i0) / totalTime;
	const st = Date.now();

	return animationFrame
		.map(() => {
			const t = Date.now() - st;
			if (t >= totalTime) throw t;
			return i0 + dt * t;
		})
		.catchError(() => of(end));
}

/*@Augment<AnimationCount>('cxl-animation-count', $ => onUpdate($).switchMap(() => {
	const dt = ($.end - $.start)/$.step;
	const delay = $.time/dt;
	let current = 
	return interval(delay).tap(i => )
}))
export class AnimationCount extends Component {
	@Attribute()
	step = 1;
	@Attribute()
	start = 0;
	@Attribute()
	end = 0;
	/** Total Time in milliseconds */
/*@Attribute()
	time = 1000;
}*/
