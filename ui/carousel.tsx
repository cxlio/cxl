///<amd-module name="@cxl/ui/carousel.js"/>
import { Augment, Attribute, Component, Span, get } from '@cxl/component';
import { registable, each, registableHost } from '@cxl/template';
import { padding } from '@cxl/css';
import { onAction, onChildrenMutation } from '@cxl/dom';
import { dom } from '@cxl/tsx';
import { Svg, Path } from '@cxl/ui/svg.js';
import { EMPTY, concat, of, interval, defer } from '@cxl/rx';
import { Button } from '@cxl/ui/button.js';
import { css } from './theme.js';

@Augment<Slide>(
	'cxl-slide',
	$ => registable($, 'cxl.slide'),
	css({
		$: { display: 'block', flexGrow: 1, flexShrink: 0, flexBasis: '100%' },
	}),
	() => <slot />
)
export class Slide extends Component {}

const SlideAnimation = {
	default(host: Carousel, el: Span) {
		el.style.transition = `transform ${host.speed}ms`;
		el.style.transform = `translateX(${host.index * -100}%)`;
	},

	continuous(host: Carousel, el: Span, prev: number) {
		const next = host.index;
		if (prev === next) return;

		// Position current slide first
		el.style.transition = 'none';
		el.style.transform = 'translateX(0)';

		const len = host.slides.size;
		const slides = Array.from(host.slides);

		for (let i = prev, a = 0; a < len; i = i >= len - 1 ? 0 : i + 1, a++)
			slides[i].style.order = a.toString();

		// Animate to next slide
		const offset = next < prev ? len + next - prev : next - prev;
		requestAnimationFrame(() => {
			el.style.transition = `transform ${host.speed}ms`;
			el.style.transform = `translateX(${-100 * offset}%)`;
		});
	},
};

/**
 * @demo
 * <cxl-carousel delay="2000" type="continuous">
 *   <cxl-slide><cxl-t h5>Slide 1</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 2</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 3</cxl-t></cxl-slide>
 * </cxl-carousel>
 */
@Augment<Carousel>(
	'cxl-carousel',
	css({
		$: {
			overflowX: 'hidden',
			display: 'block',
			position: 'relative',
		},
		container: {
			display: 'flex',
		},
	}),
	$ => registableHost($, 'cxl.slide', $.slides),
	$ =>
		get($, 'delay').switchMap(delay =>
			delay === 0
				? EMPTY
				: interval(delay).tap(
						() =>
							($.index =
								$.index >= $.slides.size - 1 ? 0 : $.index + 1)
				  )
		),
	$ => {
		let previous = 0;
		return (
			<>
				<Span
					className="container"
					$={el =>
						get($, 'index').raf(index => {
							if (index >= $.slides.size) return ($.index = 0);
							else if (index < 0)
								return ($.index = $.slides.size - 1);

							const fn =
								SlideAnimation[$.type] ||
								SlideAnimation.default;
							fn($, el, previous);
							previous = index;
						})
					}
				>
					<$.Slot selector="cxl-slide" />
				</Span>
				<slot />
			</>
		);
	}
)
export class Carousel extends Component {
	@Attribute()
	delay = 0;

	@Attribute()
	speed = 500;

	@Attribute()
	type: keyof typeof SlideAnimation = 'default';

	@Attribute()
	index = 0;

	slides = new Set<Slide>();
}

/**
 * @demo
 * <cxl-carousel>
 *   <cxl-slide><cxl-t h5>Slide 1</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 2</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 3</cxl-t></cxl-slide>
 *   <cxl-carousel-pagination></cxl-carousel-pagination>
 * </cxl-carousel>
 */
@Augment(
	'cxl-carousel-pagination',
	css({
		$: {
			display: 'flex',
			columnGap: 8,
			justifyContent: 'center',
			...padding(8),
		},
		circle: {
			display: 'inline-block',
			borderRadius: '100%',
			backgroundColor: 'onSurface12',
			width: 16,
			height: 16,
			cursor: 'pointer',
		},
		active: { backgroundColor: 'primary' },
	}),
	$ => {
		let parent: Carousel;
		const slides = defer(() => {
			parent = $.parentElement as Carousel;
			return concat(
				of(parent?.slides || []),
				onChildrenMutation(parent)
					.raf()
					.map(() => parent.slides)
			);
		});

		return (
			<$.Shadow>
				{each(slides, (_, i) => (
					<Span
						$={el => onAction(el).tap(() => (parent.index = i))}
						tabIndex={0}
						className={get(parent, 'index').map(index =>
							index === i ? 'circle active' : 'circle'
						)}
					></Span>
				))}
			</$.Shadow>
		);
	}
)
export class CarouselPagination extends Component {}

/**
 * @demo
 * <cxl-carousel style="text-align:center;height: 60px">
 *   <cxl-slide><cxl-t h5>Slide 1</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 2</cxl-t></cxl-slide>
 *   <cxl-slide><cxl-t h5>Slide 3</cxl-t></cxl-slide>
 *   <cxl-carousel-navigation></cxl-carousel-navigation>
 * </cxl-carousel>
 */
@Augment(
	'cxl-carousel-navigation',
	css({
		button: {
			position: 'absolute',
			top: 0,
			bottom: 0,
			display: 'flex',
			alignItems: 'center',
			backgroundColor: 'transparent',
		},
		left: { left: 0 },
		right: { right: 0 },
	}),
	$ => (
		<>
			<Button
				className="left button"
				$={el =>
					onAction(el).tap(
						() => ($.parentElement as Carousel).index--
					)
				}
				flat
			>
				<Svg height={32} viewBox="8 8 16 16">
					<Path
						fill="currentColor"
						d="M20.563 9.875l-6.125 6.125 6.125 6.125-1.875 1.875-8-8 8-8z"
					/>
				</Svg>
			</Button>
			<Button
				className="right button"
				$={el =>
					onAction(el).tap(
						() => ($.parentElement as Carousel).index++
					)
				}
				flat
			>
				<Svg height={32} viewBox="8 8 16 16">
					<Path
						fill="currentColor"
						d="M13.313 8l8 8-8 8-1.875-1.875 6.125-6.125-6.125-6.125z"
					/>
				</Svg>
			</Button>
		</>
	)
)
export class CarouselNavigation extends Component {}
