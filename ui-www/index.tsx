///<amd-module name="@cxl/ui-www"/>
import { Augment, Attribute, Component, get } from '@cxl/component';
import { Svg, Path } from '@cxl/tsx-svg';
import { dom } from '@cxl/tsx';
import { be } from '@cxl/rx';
import {
	registable,
	registableHost,
	render,
	each,
	validateValue,
} from '@cxl/template';
import {
	Appbar,
	Application,
	Content,
	C,
	Card,
	IconButton,
	Form,
	Field,
	Label,
	Input,
	TextArea,
	SubmitButton,
	Grid,
	MenuToggle,
	Item,
	Tabs,
	Hr as CoreHr,
} from '@cxl/ui';
import { baseColor, css, padding, pct } from '@cxl/css';
import { RouterTab, RouterLink } from '@cxl/ui-router';
import { email, required } from '@cxl/validation';

export type IconKey = keyof typeof Icons;

interface PageElement {
	update(page: Page): void;
}

export const Icons = {
	'': () => <span></span>,
	github: () => (
		<Svg className="svg" alt="github" width={24} viewBox="0 0 32 32">
			<Path
				fill="currentColor"
				d="M16 0.395c-8.836 0-16 7.163-16 16 0 7.069 4.585 13.067 10.942 15.182 0.8 0.148 1.094-0.347 1.094-0.77 0-0.381-0.015-1.642-0.022-2.979-4.452 0.968-5.391-1.888-5.391-1.888-0.728-1.849-1.776-2.341-1.776-2.341-1.452-0.993 0.11-0.973 0.11-0.973 1.606 0.113 2.452 1.649 2.452 1.649 1.427 2.446 3.743 1.739 4.656 1.33 0.143-1.034 0.558-1.74 1.016-2.14-3.554-0.404-7.29-1.777-7.29-7.907 0-1.747 0.625-3.174 1.649-4.295-0.166-0.403-0.714-2.030 0.155-4.234 0 0 1.344-0.43 4.401 1.64 1.276-0.355 2.645-0.532 4.005-0.539 1.359 0.006 2.729 0.184 4.008 0.539 3.054-2.070 4.395-1.64 4.395-1.64 0.871 2.204 0.323 3.831 0.157 4.234 1.026 1.12 1.647 2.548 1.647 4.295 0 6.145-3.743 7.498-7.306 7.895 0.574 0.497 1.085 1.47 1.085 2.963 0 2.141-0.019 3.864-0.019 4.391 0 0.426 0.288 0.925 1.099 0.768 6.354-2.118 10.933-8.113 10.933-15.18 0-8.837-7.164-16-16-16z"
			></Path>
		</Svg>
	),

	instagram: () => (
		<Svg className="svg" alt="instagram" width={24} viewBox="0 0 32 32">
			<Path
				fill="currentColor"
				d="M16 2.881c4.275 0 4.781 0.019 6.462 0.094 1.563 0.069 2.406 0.331 2.969 0.55 0.744 0.288 1.281 0.638 1.837 1.194 0.563 0.563 0.906 1.094 1.2 1.838 0.219 0.563 0.481 1.412 0.55 2.969 0.075 1.688 0.094 2.194 0.094 6.463s-0.019 4.781-0.094 6.463c-0.069 1.563-0.331 2.406-0.55 2.969-0.288 0.744-0.637 1.281-1.194 1.837-0.563 0.563-1.094 0.906-1.837 1.2-0.563 0.219-1.413 0.481-2.969 0.55-1.688 0.075-2.194 0.094-6.463 0.094s-4.781-0.019-6.463-0.094c-1.563-0.069-2.406-0.331-2.969-0.55-0.744-0.288-1.281-0.637-1.838-1.194-0.563-0.563-0.906-1.094-1.2-1.837-0.219-0.563-0.481-1.413-0.55-2.969-0.075-1.688-0.094-2.194-0.094-6.463s0.019-4.781 0.094-6.463c0.069-1.563 0.331-2.406 0.55-2.969 0.288-0.744 0.638-1.281 1.194-1.838 0.563-0.563 1.094-0.906 1.838-1.2 0.563-0.219 1.412-0.481 2.969-0.55 1.681-0.075 2.188-0.094 6.463-0.094zM16 0c-4.344 0-4.887 0.019-6.594 0.094-1.7 0.075-2.869 0.35-3.881 0.744-1.056 0.412-1.95 0.956-2.837 1.85-0.894 0.888-1.438 1.781-1.85 2.831-0.394 1.019-0.669 2.181-0.744 3.881-0.075 1.713-0.094 2.256-0.094 6.6s0.019 4.887 0.094 6.594c0.075 1.7 0.35 2.869 0.744 3.881 0.413 1.056 0.956 1.95 1.85 2.837 0.887 0.887 1.781 1.438 2.831 1.844 1.019 0.394 2.181 0.669 3.881 0.744 1.706 0.075 2.25 0.094 6.594 0.094s4.888-0.019 6.594-0.094c1.7-0.075 2.869-0.35 3.881-0.744 1.050-0.406 1.944-0.956 2.831-1.844s1.438-1.781 1.844-2.831c0.394-1.019 0.669-2.181 0.744-3.881 0.075-1.706 0.094-2.25 0.094-6.594s-0.019-4.887-0.094-6.594c-0.075-1.7-0.35-2.869-0.744-3.881-0.394-1.063-0.938-1.956-1.831-2.844-0.887-0.887-1.781-1.438-2.831-1.844-1.019-0.394-2.181-0.669-3.881-0.744-1.712-0.081-2.256-0.1-6.6-0.1v0z"
			></Path>
			<Path
				fill="currentColor"
				d="M16 7.781c-4.537 0-8.219 3.681-8.219 8.219s3.681 8.219 8.219 8.219 8.219-3.681 8.219-8.219c0-4.537-3.681-8.219-8.219-8.219zM16 21.331c-2.944 0-5.331-2.387-5.331-5.331s2.387-5.331 5.331-5.331c2.944 0 5.331 2.387 5.331 5.331s-2.387 5.331-5.331 5.331z"
			></Path>
			<Path
				fill="currentColor"
				d="M26.462 7.456c0 1.060-0.859 1.919-1.919 1.919s-1.919-0.859-1.919-1.919c0-1.060 0.859-1.919 1.919-1.919s1.919 0.859 1.919 1.919z"
			></Path>
		</Svg>
	),

	twitter: () => (
		<Svg className="svg" alt="twitter" width={24} viewBox="0 0 32 32">
			<Path
				fill="currentColor"
				d="M32 7.075c-1.175 0.525-2.444 0.875-3.769 1.031 1.356-0.813 2.394-2.1 2.887-3.631-1.269 0.75-2.675 1.3-4.169 1.594-1.2-1.275-2.906-2.069-4.794-2.069-3.625 0-6.563 2.938-6.563 6.563 0 0.512 0.056 1.012 0.169 1.494-5.456-0.275-10.294-2.888-13.531-6.862-0.563 0.969-0.887 2.1-0.887 3.3 0 2.275 1.156 4.287 2.919 5.463-1.075-0.031-2.087-0.331-2.975-0.819 0 0.025 0 0.056 0 0.081 0 3.181 2.263 5.838 5.269 6.437-0.55 0.15-1.131 0.231-1.731 0.231-0.425 0-0.831-0.044-1.237-0.119 0.838 2.606 3.263 4.506 6.131 4.563-2.25 1.762-5.075 2.813-8.156 2.813-0.531 0-1.050-0.031-1.569-0.094 2.913 1.869 6.362 2.95 10.069 2.95 12.075 0 18.681-10.006 18.681-18.681 0-0.287-0.006-0.569-0.019-0.85 1.281-0.919 2.394-2.075 3.275-3.394z"
			></Path>
		</Svg>
	),

	linkedin: () => (
		<Svg className="svg" alt="linkedin" width={24} viewBox="0 0 32 32">
			<Path
				fill="currentColor"
				d="M29 0h-26c-1.65 0-3 1.35-3 3v26c0 1.65 1.35 3 3 3h26c1.65 0 3-1.35 3-3v-26c0-1.65-1.35-3-3-3zM12 26h-4v-14h4v14zM10 10c-1.106 0-2-0.894-2-2s0.894-2 2-2c1.106 0 2 0.894 2 2s-0.894 2-2 2zM26 26h-4v-8c0-1.106-0.894-2-2-2s-2 0.894-2 2v8h-4v-14h4v2.481c0.825-1.131 2.087-2.481 3.5-2.481 2.488 0 4.5 2.238 4.5 5v9z"
			></Path>
		</Svg>
	),

	facebook: () => (
		<Svg className="svg" alt="facebook" width={24} viewBox="0 0 32 32">
			<Path
				fill="currentColor"
				d="M19 6h5v-6h-5c-3.86 0-7 3.14-7 7v3h-4v6h4v16h6v-16h5l1-6h-6v-3c0-0.542 0.458-1 1-1z"
			></Path>
		</Svg>
	),
};

@Augment<BrandIcon>(
	'cxl-www-icon',
	css({
		$: { display: 'inline-block' },
		svg: { verticalAlign: 'middle' },
	}),
	$ => (
		<$.Shadow>
			{render(get($, 'icon'), name => Icons[name]?.() || Icons['']())}
		</$.Shadow>
	)
)
export class BrandIcon extends Component {
	@Attribute()
	icon: IconKey = '';
}

@Augment<BrandLink>('www-brand-link', $ => (
	<A href={get($, 'href')}>
		<IconButton>
			<BrandIcon icon={get($, 'icon')} />
		</IconButton>
	</A>
))
export class BrandLink extends Component {
	@Attribute()
	icon: IconKey = '';

	@Attribute()
	href = '';
}

@Augment<A>('www-a', host => {
	const el = (
		<a>
			<slot />
		</a>
	) as HTMLAnchorElement;
	host.bind(get(host, 'href').tap(src => (el.href = src)));
	return el;
})
export class A extends Component {
	@Attribute()
	href = '';
}

@Augment<Image>(
	'www-img',
	css({
		$: { display: 'inline-block' },
	}),
	host => {
		const el = (<img />) as HTMLImageElement;
		el.style.maxHeight = el.style.maxWidth = '100%';
		host.bind(get(host, 'src').tap(src => (el.src = src)));
		return el;
	}
)
export class Image extends Component {
	@Attribute()
	src = '';
}

@Augment<AppbarMenu>(
	'www-appbar-menu',
	css({
		$: { display: 'block', flexShrink: 0 },
		tabs: { display: 'none', overflowX: 'hidden' },
		'@small': {
			tabs: { display: 'block' },
			menu: { display: 'none' },
		},
	}),
	$ => {
		const elements$ = be(new Set<AppbarItem>());
		$.bind(
			registableHost<AppbarItem>($, 'www.appbar-menu')
				.raf()
				.tap(els => elements$.next(els))
		);

		return (
			<>
				<Tabs className="tabs">
					{each(elements$, item => (
						<RouterTab href={item.href}>
							{item.cloneNode(true)}
						</RouterTab>
					))}
				</Tabs>
				<MenuToggle className="menu">
					{each(elements$, item => (
						<RouterLink href={item.href}>
							<Item>{item.cloneNode(true)}</Item>
						</RouterLink>
					))}
				</MenuToggle>
			</>
		);
	}
)
export class AppbarMenu extends Component {}

@Augment('www-appbar-item', $ => registable($, 'www.appbar-menu'))
export class AppbarItem extends Component {
	@Attribute()
	href = '';
}

@Augment<PageAppbar>(
	'www-appbar',
	css({
		$: {
			display: 'block',
			position: 'sticky',
			top: 0,
			zIndex: 5,
		},
		appbar: {
			...padding(24, 48, 24, 48),
			// boxShadow: 'none',
			variables: {
				surface: baseColor('surface'),
				onSurface: baseColor('onSurface'),
				primary: baseColor('primary'),
				onPrimary: baseColor('onPrimary'),
				link: baseColor('onSurface'),
			} as any,
		},
	}),
	$ =>
		registable($, 'www', {
			update() {
				/* TODO */
			},
		}),
	() => (
		<Appbar className="appbar" center>
			<slot />
		</Appbar>
	)
)
export class PageAppbar extends Component {}

@Augment<PageText>('www-t')
export class PageText extends Component {}

@Augment<Header>(
	'www-header',
	css({
		$: {
			display: 'block',
		},
	}),
	() => (
		<header>
			<SectionGrid>
				<C sm={6}>
					<slot />
				</C>
				<C sm={6}>
					<slot name="right" />
				</C>
			</SectionGrid>
		</header>
	)
)
export class Header extends Component {}

@Augment<Section>(
	'www-section',
	css({
		$: { display: 'block', ...padding(64, 0, 64, 0) },
	}),
	() => (
		<section>
			<Content center>
				<slot />
			</Content>
		</section>
	)
)
export class Section extends Component {}

@Augment<SectionGrid>(
	'www-section-grid',
	css({
		$: { display: 'block' },
		'@small': {
			grid: { columnGap: 48, rowGap: 48 },
		},
	}),
	() => (
		<Section>
			<Grid className="grid">
				<slot />
			</Grid>
		</Section>
	)
)
export class SectionGrid extends Component {}

@Augment<ServiceCard>(
	'www-service-card',
	css({
		$: { ...padding(32), elevation: 0, backgroundColor: 'transparent' },
		$hover: { elevation: 4, backgroundColor: 'surface' },
	})
)
export class ServiceCard extends Card {}

@Augment<ImageCard>(
	'www-img-card',
	css({
		$: { display: 'block', position: 'relative' },
		image: { maxWidth: pct(100) },
		hover: {
			position: 'absolute',
			opacity: 0,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		},
		hover$hover: { display: 'block', opacity: 1 },
	}),
	$ => (
		<>
			<div className="hover">
				<slot></slot>
			</div>
			<Image src={get($, 'src')} className="image" />
		</>
	)
)
export class ImageCard extends Component {
	@Attribute()
	src = '';
}

@Augment<Hr>('www-hr')
export class Hr extends CoreHr {}

@Augment<Footer>(
	'www-footer',
	css({
		$: { display: 'block' },
		footer: {
			...padding(64, 0, 64, 0),
			font: 'body2',
			backgroundColor: 'surface',
			color: 'onSurface',
			variables: {
				link: baseColor('surface'),
				surface: baseColor('onSurface87'),
				onSurface: baseColor('surface'),
			} as any,
		},
	}),
	() => (
		<footer className="footer">
			<Content center>
				<slot />
			</Content>
		</footer>
	)
)
export class Footer extends Component {}

@Augment<Page>('www-page', $ =>
	registableHost<PageElement>($, 'www').tap(elements => {
		elements.forEach(e => e.update($));
	})
)
export class Page extends Application {}

@Augment<Theme>('www-theme')
export class Theme extends Component {}

@Augment<ContactForm>('www-form-contact', () => (
	<Form>
		<Grid>
			<Field>
				<Label>Name</Label>
				<Input $={el => validateValue(el, required)} name="name" />
			</Field>
			<Field>
				<Label>E-mail</Label>
				<Input $={el => validateValue(el, email)} name="email" />
			</Field>
			<Field>
				<Label>Phone</Label>
				<Input name="phone" />
			</Field>
			<Field>
				<Label>Message</Label>
				<TextArea
					$={el => validateValue(el, required)}
					name="message"
				></TextArea>
			</Field>
			<C sm={12}>
				<SubmitButton>Send Message</SubmitButton>
			</C>
		</Grid>
	</Form>
))
export class ContactForm extends Component {}
