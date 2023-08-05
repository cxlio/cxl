///<amd-module name="@cxl/docgen/runtime"/>
import { dom } from '@cxl/tsx';
import '@cxl/ui/theme.js';
import { Augment, Attribute, Component, Span, get } from '@cxl/component';
import { onChildrenMutation, onLoad, onValue, requestJson } from '@cxl/dom';
import { padding } from '@cxl/css';
import { be } from '@cxl/rx';
import { SelectBox } from '@cxl/ui/select.js';
import { Option } from '@cxl/ui/option.js';
import { each, render } from '@cxl/template';
import { AppbarSearch } from '@cxl/ui/appbar-search.js';
import { C, Card } from '@cxl/ui/layout.js';
import { A, RouterLink, RouterItem, routerState } from '@cxl/ui-router';
import { css } from '@cxl/ui/theme.js';
import { BlogDemo } from '@cxl/ui/blog.js';
import { Autocomplete } from '@cxl/ui/autocomplete.js';
import { ToggleSwitch } from '@cxl/ui/toggle.js';
import { IconButton } from '@cxl/ui/icon.js';
import { breakpointKey } from '@cxl/ui/core.js';
import '@cxl/ui/avatar.js';
import '@cxl/ui/chip.js';
import '@cxl/ui/application.js';
import '@cxl/ui/navbar.js';
import '@cxl/ui/theme-toggle.js';
import '@cxl/ui/theme-dark.js';
import '@cxl/ui/hr.js';

declare const hljs: typeof import('highlight.js').default;

import type { RuntimeConfig, VersionJson } from './render.js';

declare const docgen: RuntimeConfig;

const UserScripts =
	docgen.userScripts?.map(src => `<script src="${src}"></script>`).join('') ||
	'';

let activeTarget: Element | undefined;

routerState.subscribe(state => {
	const hash = state.url.hash;
	const anchor = hash && state.current?.querySelector(`a[name="${hash}"]`);
	if (anchor) {
		const card = anchor.nextElementSibling;
		activeTarget?.classList.remove('target');
		if (card) {
			activeTarget = card;
			card.classList.add('target');
		}
	}
});

@Augment<DocItem>('doc-it')
export class DocItem extends RouterItem {}

@Augment<DocGrid>(
	'doc-grd',
	css({
		$: {
			...padding(8, 16, 8, 16),
			display: 'grid',
			columnGap: 16,
			rowGap: 12,
		},
		'@small': {
			$: {
				gridTemplateColumns: 'repeat(2, minmax(0px, 1fr))',
			},
		},
		'@medium': {
			$: {
				gridTemplateColumns: 'repeat(3, minmax(0px, 1fr))',
			},
		},
		'@large': {
			$: {
				gridTemplateColumns: 'repeat(4, minmax(0px, 1fr))',
			},
		},
	}),
	() => <slot />
)
export class DocGrid extends Component {}

@Augment<DocCard>(
	'doc-c',
	css({
		$: {
			marginTop: 16,
			display: 'block',
			...padding(16),
			elevation: 1,
		},
	}),
	$ => {
		const srclink = $.getAttribute('src');
		const see =
			srclink && docgen.repository
				? ((
						<a
							title="See Source"
							target="_blank"
							href={`${docgen.repository}/${srclink}`}
						>
							{'</>'}
						</a>
				  ) as HTMLElement)
				: undefined;
		if (see) {
			see.style.float = 'right';
			see.style.textDecoration = 'none';
		}
		/*const id = $.getAttribute('a');
		if (id) {
			const anchor = <a name={`s${id}`} />;
			$.parentNode?.insertBefore(anchor, $);
		}*/
		return (
			<>
				{see}
				<slot />
			</>
		);
	}
)
export class DocCard extends Component {}

@Augment(
	'doc-cd',
	css({
		$: { font: 'code', display: 'inline-block' },
	}),
	() => <slot />
)
export class DocCode extends Component {}

@Augment(
	'doc-ct',
	css({
		$: {
			marginBottom: 24,
			whiteSpace: 'pre-wrap',
			font: 'code',
			fontSize: 18,
			display: 'block',
		},
	}),
	() => <slot />
)
export class DocCardTitle extends Component {}

@Augment('doc-example', host => (
	<Span
		$={div =>
			onChildrenMutation(host).tap(() => {
				const content = host.childNodes[0].textContent || '';
				div.innerHTML = content;
			})
		}
	/>
))
export class DocExample extends Component {}

@Augment<DocVersionSelect>(
	'doc-version-select',
	css({
		$: { display: 'inline-block' },
	}),
	$ => (
		<$.Shadow>
			{docgen.versions &&
				render(requestJson<VersionJson>(docgen.versions), json =>
					json.all.length > 1 ? (
						<SelectBox
							$={el =>
								onValue(el).tap(val => $.onValue(String(val)))
							}
							value={docgen.activeVersion}
							className="select"
						>
							{json.all.map(v => (
								<Option value={v}>{v}</Option>
							))}
						</SelectBox>
					) : (
						<>{docgen.activeVersion}</>
					)
				)}
		</$.Shadow>
	)
)
export class DocVersionSelect extends Component {
	onValue(version: string) {
		if (version !== docgen.activeVersion)
			window.location.href = `../${version}/`;
	}
}

const hljsLanguages = ['html', 'typescript', 'javascript', 'css', 'ts'];

@Augment<DocHighlight>(
	'doc-hl',
	css({
		$: { display: 'block' },
		hljs: { whiteSpace: 'pre-wrap', font: 'code', ...padding(16) },
	}),
	() => <link rel="stylesheet" href="styles.css" />,
	host => {
		const srcContainer = (<div className="hljs" />) as HTMLElement;
		srcContainer.style.tabSize = '4';
		host.bind(
			onLoad().tap(() => {
				const lang = host.l;
				let src = host.childNodes[0]?.textContent?.trim() || '';
				try {
					if (src)
						src = (
							lang && hljsLanguages.includes(lang.toLowerCase())
								? hljs.highlight(src, { language: lang })
								: hljs.highlightAuto(src, hljsLanguages)
						).value;
				} catch (e) {
					/* Ignore */
				}
				srcContainer.innerHTML = src;
			})
		);
		return srcContainer;
	}
)
export class DocHighlight extends Component {
	@Attribute()
	l?: string;
}

@Augment<DocDemo>('doc-demo', $ => {
	const demo = (<BlogDemo />) as BlogDemo;
	demo.header =
		UserScripts +
		'<style>body{padding:16px 16px 0 16px;background:var(--cxl-background);color:var(--cxl-on-background)}</style>';

	const src = new Text();
	requestAnimationFrame(() => {
		const language = $.language;
		const styles = document.getElementById('styles.css')?.outerHTML;
		src.textContent = $.childNodes[0].textContent || '';
		demo.formatter = source =>
			`${styles}<pre style="margin:0"><code style="min-height:176px;font:var(--cxl-font-code)" class="hljs">` +
			(language
				? hljs.highlight(source, { language })
				: hljs.highlightAuto(source, [
						'html',
						'typescript',
						'javascript',
						'css',
				  ])
			).value +
			'</code></pre>';
		demo.appendChild(src);
	});
	return demo;
})
export class DocDemo extends Component {
	language?: string;
}

@Augment(
	'doc-more',
	css({
		$focusWithin: { outline: 'var(--cxl-primary) 1px dashed' },
		$hover: { outline: 'var(--cxl-primary) 1px dashed' },
	}),
	() => {
		const toggle = (
			<ToggleSwitch>
				<slot slot="on" />
				<slot name="off" slot="off" />
			</ToggleSwitch>
		) as ToggleSwitch;
		toggle.appendChild(
			<IconButton
				title={get(toggle, 'opened').map(v =>
					v ? 'Collapse' : 'Expand'
				)}
				width={20}
				icon={get(toggle, 'opened').map(v =>
					v ? 'unfold_less' : 'unfold_more'
				)}
			/>
		);
		return toggle;
	}
)
export class DocMore extends Component {}

@Augment('doc-a')
export class DocLink extends A {}

@Augment(
	'doc-search',
	css({
		$: { position: 'relative', marginLeft: 'auto' },
		'@medium': {
			$: { marginLeft: 0, flexGrow: 1 },
			search: {
				marginLeft: 0,
				minWidth: 200,
				width: '50%',
			},
		},
	}),
	$ => {
		const results = be<Iterable<Element>>([]);
		let router: HTMLElement | null;
		const search = (
			<AppbarSearch className="search" dense />
		) as AppbarSearch;

		const card = (
			<Autocomplete
				input={breakpointKey($).map(bp =>
					bp === 'xsmall' ? search.mobileInput : search.desktopInput
				)}
			>
				{each(results, r => (
					<RouterLink href={(r as HTMLElement).dataset.path}>
						<Option value={(r as HTMLElement).dataset.title}>
							{(r as HTMLElement).dataset.title}
						</Option>
					</RouterLink>
				))}
				<C slot="empty" pad={16}>
					No Results Found
				</C>
			</Autocomplete>
		) as Card;
		card.style.maxHeight = '50%';

		function buildSearch() {
			router ||= router = document.querySelector('cxl-router');
			if (!router) return;
			const result = router.querySelectorAll(`[data-title]`);
			results.next(result);
		}

		$.bind(onLoad().tap(buildSearch));

		return (
			<>
				{search}
				{card}
			</>
		);
	}
)
export class DocSearch extends Component {}
