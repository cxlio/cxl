import { spec } from '@cxl/spec';
import {
	Carousel,
	CarouselPagination,
	CarouselNavigation,
	Slide,
} from '../carousel.js';
import { T } from '@cxl/ui';
import { dom } from '@cxl/tsx';

export default spec('ui-carousel', s => {
	s.test('baselines', a => {
		a.figure(
			'Carousel',
			<Carousel>
				<Slide>
					<T center h1>
						One
					</T>
				</Slide>
				<Slide>
					<T center h1>
						Two
					</T>
				</Slide>
				<Slide>
					<T center h1>
						Three
					</T>
				</Slide>
				<CarouselPagination />
				<CarouselNavigation />
			</Carousel>
		);

		a.figure(
			'Carousel[index]',
			<Carousel speed={0} index={2}>
				<Slide>
					<T center h1>
						One
					</T>
				</Slide>
				<Slide>
					<T center h1>
						Two
					</T>
				</Slide>
				<Slide>
					<T center h1>
						Three
					</T>
				</Slide>
				<CarouselPagination />
				<CarouselNavigation />
			</Carousel>
		);
	});
});
