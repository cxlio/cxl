import { Augment, Attribute, Component, Span, get } from '@cxl/component';
import { css, padding, border } from '@cxl/css';
import { Button, T } from '@cxl/ui';
import { EMPTY, be } from '@cxl/rx';
import { on, onAction, onChildrenMutation, onResize } from '@cxl/dom';
import { dom } from '@cxl/tsx';

export interface BlogPosts {
	posts: Post[];
	tags: string[];
}

export interface Post {
	uuid: string;
	id: string;
	title: string;
	date: string;
	mtime: string;
	author: string;
	type: string;
	tags?: string;
	content: string;
	summary: string;
}

function highlight(code: string) {
	const hljs = (window as any).hljs as typeof import('highlight.js');
	if (!hljs) return code;
	hljs.configure({
		tabReplace: '    ',
	});
	return hljs.highlightAuto(code, [
		'html',
		'typescript',
		'javascript',
		'css',
	]);
}

@Augment<BlogDemo>(
	'blog-demo',
	css({
		$: {
			display: 'block',
		},
		parent: {
			display: 'none',
			backgroundColor: 'onSurface12',
		},
		container: {
			display: 'block',
			borderStyle: 'none',
			marginLeft: 'auto',
			marginRight: 'auto',
			backgroundColor: 'background',
			width: '100%',
			overflowX: 'hidden',
			overflowY: 'hidden',
		},
		'@small': {
			container: {
				width: 320,
				...border(16, 0, 0, 0),
				borderColor: 'onSurface12',
				borderStyle: 'solid',
			},
			desktop: {
				width: '100%',
				...border(0),
			},
		},
		source: {
			display: 'none',
			font: 'monospace',
			...padding(16),
			whiteSpace: 'pre-wrap',
			overflowY: 'auto',
		},
		visible: { display: 'block' },
		toolbar: {
			textAlign: 'right',
		},
	}),
	host => {
		const content$ = be('');
		const view = get(host, 'view');

		function init(parent: HTMLIFrameElement) {
			return onChildrenMutation(host).switchMap(() => {
				const content = host.childNodes[0]?.textContent?.trim() || '';
				parent.srcdoc = `<!DOCTYPE html><style>body{padding:12px;margin:0;}</style>${content}`;
				content$.next(content);
				return on(parent, 'load').switchMap(() => {
					const body = parent.contentDocument?.body;
					return body
						? onResize(body).tap(() => {
								const height =
									parent.contentDocument?.body.scrollHeight;
								if (height) parent.style.height = height + 'px';
						  })
						: EMPTY;
				});
			});
		}

		const iframeEl = (<iframe title="Demo" />) as HTMLIFrameElement;
		(iframeEl as any).loading = 'lazy';
		iframeEl.className = 'container desktop';
		host.bind(init(iframeEl));

		return (
			<>
				<T h3>{get(host, 'label')}</T>
				<Span className="parent visible">{iframeEl}</Span>
				<Button
					$={$ => onAction($).tap(() => (host.view = 'source'))}
					flat
				>
					View Source
				</Button>
				<Span
					className={view.map(v =>
						v === 'source' ? 'source visible' : 'source'
					)}
				>
					{content$.map(highlight)}
				</Span>
			</>
		);
	}
)
export class BlogDemo extends Component {
	@Attribute()
	view: 'desktop' | 'mobile' | 'source' = 'desktop';
	@Attribute()
	label?: string;
}

@Augment<BlogCode>(
	'blog-code',
	css({
		$: {
			display: 'block',
			font: 'monospace',
			...padding(16),
			whiteSpace: 'pre-wrap',
			overflowY: 'auto',
		},
	}),
	$ =>
		onChildrenMutation($).tap(() => {
			const first = $.firstChild;
			if (first?.nodeType === document.COMMENT_NODE)
				$.source = (first as any).data.trim();
		}),
	$ => <Span>{get($, 'source')}</Span>
)
export class BlogCode extends Component {
	@Attribute()
	source = '';

	@Attribute()
	type?: string;

	@Attribute()
	'source-id': string;
}

@Augment('blog-summary', () => (
	<p>
		<slot />
	</p>
))
export class BlogSummary extends Component {}

/*component(
	{
		name: 'blog-code',
		attributes: ['source', 'type', 'source-id'],
		template: `
<style>${hljs.$STYLE} .hljs { overflow: visible !important; }</style>
<div &="id(code) .code =source:text:#update"></div>
	`,

		styles: {
			$: { marginTop: 16, marginBottom: 16 },
			$lastChild: { marginBottom: 0 },
			code: {
				fontFamily: 'monospace',
				whiteSpace: 'pre-wrap',
				fontSize: 'var(--cxl-fontSize)',
				wordBreak: 'break-all',
			},
		},
		initialize(state) {
			document.readyState !== 'loading'
				? state.onReady(state, this)
				: window.addEventListener('DOMContentLoaded', () =>
						state.onReady(state, this)
				  );
		},
	},
	{
		type: '',

		update(source) {
			if (this.type) this.code.classList.toggle(this.type, true);
			hljs.highlightBlock(this.code);
		},

		onReady(val, el) {
			if (this['source-id'])
				el.source = document.getElementById(
					this['source-id']
				).innerHTML;
			else if (
				el.firstChild &&
				el.firstChild.nodeType === document.COMMENT_NODE
			)
				el.source = el.firstChild.data.trim();
			else if (el.innerHTML) el.source = el.innerHTML.trim();
		},
	}
);

component(
	{
		name: 'blog-tagline',
		styles: {
			$: { font: 'button', margin: 16 },
		},
		bindings: 'location:#getTagline:text',
	},
	{
		taglines: [
			'Make the world a better place, one bug at a time.',
			// 'Because no code is the best code.'
		],
		getTagline() {
			return this.taglines[(Math.random() * this.taglines.length) | 0];
		},
	}
);

component({
	name: 'blog-twitter',
	initialize() {
		twttr.ready(() => {
			twttr.widgets.createFollowButton('debuggerjs', this, {
				showCount: false,
			});
		});
	},
});

component({
	name: 'blog-tweet',
	attributes: ['tweet'],
	initialize() {
		twttr.ready(() => {
			twttr.widgets.createTweet(this.tweet, this); //, { showCount: false });
		});
	},
});

component({
	name: 'blog-footer',
	template: `
<div &="content"></div>
<footer>
	<br>
	<a &=".link" href=".">Back to Index</a>
	<br><br>
</footer>
	`,
	styles: {
		link: {
			display: 'block',
			textAlign: 'center',
			font: 'subtitle',
			color: 'link',
		},
	},
});

component({
	name: 'blog-header',
	template: `
<cxl-meta></cxl-meta>
<a &=".title" href="/index.html">debugger;</a>
<blog-tagline></blog-tagline>
	`,
	styles: {
		$: { textAlign: 'center', paddingTop: 32 },
		title: {
			font: 'h3',
			textDecoration: 'none',
			color: 'onSurface',
			fontFamily: 'monospace',
		},
		title$small: { font: 'h2', fontFamily: 'monospace' },
	},
});

component(
	{
		name: 'blog-meta',
		attributes: ['date', 'author'],
		template: `
<span &="=date:#formatDate:text"></span> by <a>@<span &="=author:text"></span></a>
	`,
		styles: {
			$: { font: 'subtitle', textAlign: 'center', marginBottom: 48 },
			$small: { font: 'h6' },
		},
	},
	{
		formatDate(val) {
			const options = {
					weekday: 'long',
					year: 'numeric',
					day: 'numeric',
					month: 'long',
				},
				date = val && new Date(val);
			return date && date.toLocaleDateString(navigator.language, options);
		},
	}
);

component({
	name: 'blog-container',
	styles: {
		$: {
			marginLeft: 16,
			marginRight: 16,
			backgroundColor: 'surface',
			color: 'onSurface',
		},
		$medium: { marginLeft: 32, marginRight: 32 },
		$large: { marginLeft: 64, marginRight: 64 },
		$xlarge: { width: 1200, marginLeft: 'auto', marginRight: 'auto' },
	},
});

component({
	name: 'blog-title',
	bindings: 'role(heading) aria.level(2)',
	styles: {
		$: { font: 'h4', textAlign: 'center', marginBottom: 16 },
		$small: { font: 'h2', marginBottom: 24 },
	},
});

component(
	{
		name: 'blog-posts',
		template: `
<cxl-t h3 &=".title">Notes</cxl-t>
<ul>
	<template &="=notes:sort(date):reverse:each:repeat">
	<li><a &=".link $title:text $id:#getUrl:@href"></a></li>
	</template>
</ul>
<cxl-t h3 &=".title">Demos</cxl-t>
<ul>
	<template &="=demos:sort(date):reverse:each:repeat">
	<li><a &=".link $title:text $id:#getUrl:@href"></a></li>
	</template>
</ul>
<cxl-t h3 &="=drafts.length:show .title">Drafts</cxl-t>
<ul>
	<template &="=drafts:sort(date):reverse:each:repeat">
	<li><a &=".link $title:text $id:#getUrl:@href"></a></li>
	</template>
</ul>
	`,
		styles: {
			title: { textAlign: 'center' },
			link: {
				font: 'h6',
				color: 'link',
				marginBottom: 16,
				display: 'inline-block',
			},
		},
		initialize(state) {
			cxl.ajax.get('posts.json').then(res => {
				const posts = [],
					demos = [],
					drafts = [],
					notes = [];
				res.forEach(post => {
					if (post.type === 'demo') demos.push(post);
					else if (post.type === 'notes') notes.push(post);
					else if (location.host.indexOf('debuggerjs.com') === -1)
						drafts.push(post);
				});

				state.posts = posts;
				state.demos = demos;
				state.drafts = drafts;
				this.$view.set('notes', notes);
			});
		},
	},
	{
		getUrl(id) {
			return 'posts/' + id;
		},
	}
);

component({
	name: 'blog-content',
	bindings: 'location:route',
});

component(
	{
		name: 'blog-mdn',
		attributes: ['href'],
		template: '<a &="=href:#setHref content .link"></a>',
		styles: {
			$: { display: 'inline' },
			link: { color: 'link', font: 'code' },
		},
	},
	{
		setHref(href, el) {
			if (href)
				el.href =
					'https://developer.mozilla.org/en-US/docs/Web/' + href;
		},
	}
);

component({
	name: 'blog-main-tweet',
	extend: 'blog-tweet',
});

component({
	name: 'blog-tags',
	attributes: ['tags'],
	template: `
<cxl-t h6>Tags</cxl-t>
<template &="=tags:each:repeat">
<cxl-chip primary &="item:text"></cxl-chip>
</template>
	`,
	initialize(state) {
		function onMutate(el) {
			el.tags = el.innerHTML.split(' ');
		}

		document.readyState !== 'loading'
			? onMutate(this)
			: window.addEventListener('DOMContentLoaded', () => onMutate(this));
	},
});

component({
	name: 'blog-post',
	template: `
<div &="content"></div>
<blog-footer>
	<div &=".container">
		<div &=".tags content(blog-tags)"></div>
		<div &=".tweet content(blog-main-tweet)"></div>
	</div>
</blog-footer>
	`,
	styles: {
		container$medium: {
			display: 'flex',
			marginTop: 48,
			marginBottom: 32,
		},
		tags: { flexGrow: 1 },
	},
});

route({
	path: 'home',
	defaultRoute: true,
	template: `
<blog-posts></blog-posts>
	`,
});

// TODO clean up? Move to @cxl/template ?
function run(code) {
	new Function(code).call();
}

function setContent(val, el) {
	// NOTE Use a fragment instead of innerHTML to prevent webkit bug.
	const html = cxl.Template.getFragmentFromString(val);
	el.appendChild(html);
	const scripts = el.querySelectorAll('script');
	const source = [];

	// TODO dangerous?
	for (let code of scripts)
		if (!code.type || code.type === 'application/javascript')
			source.push(code.src ? cxl.ajax.get(code.src) : code.innerHTML);

	el.style.opacity = 1;
	Promise.all(source).then(code => run(code.join('\n')));
}

route(
	{
		path: 'posts/:postId',
		extend: 'blog-post',
		attributes: ['content'],
		bindings: '=content:resolve:#setContent',
		resolve(state) {
			state.content = cxl.ajax.get('posts/' + state.postId + '.html');
		},
	},
	{
		setContent: setContent,
	}
);

route(
	{
		path: 'drafts/:postId',
		extend: 'blog-post',
		attributes: ['content'],
		bindings: '=content:resolve:#setContent',
		resolve(state) {
			state.content = cxl.ajax.get('../drafts/' + state.postId + '.html');
		},
	},
	{
		setContent: setContent,
	}
);

Object.assign(blog, {
	id(elId) {
		return document.getElementById(elId);
	},

	compile(el, state) {
		const owner = new cxl.View(state, el);
		cxl.compiler.compile(el, owner);
		owner.connect();
	},

	getScript(url) {
		return cxl.ajax.get(url).then(run);
	},
});
*/
