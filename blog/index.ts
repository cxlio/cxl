import type { Stats } from 'fs';
import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { observable } from '@cxl/rx';
import { Output, Task } from '@cxl/build';
import { basename } from 'path';

import * as MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export interface BlogConfig {
	postsDir?: string | string[];
	headerTemplate?: string;
	highlight?: boolean;
	includeContent?: boolean;
	hrefPrefix?: string;
	processIndex?: string[];
	postTemplate?: string;
	baseUrl?: string;
	indexUrl?: string;
	canonicalUrl?: string;
}

export interface PostsJson {
	posts: PostData[];
	tags: Record<string, string[]>;
}

export interface Meta {
	uuid: string;
	date: string;
	author: string;
	version?: string;
	type?: string;
	summary?: string;
	tags?: string;
	threadId?: string;
	redditId?: string;
}

export interface Post {
	uuid?: string;
	id: string;
	title: string;
	date: string;
	version?: string;
	mtime: string;
	author: string;
	type: string;
	tags?: string;
	href?: string;
	content: string;
	summary: string;
}

export type PostData = {
	content: undefined | string;
} & Post;

const POST_REGEX = /\.(html|md)$/,
	TITLE_REGEX = /<blog-title>(.+)<\/blog-title>/,
	META_REGEX = /<blog-meta([^>]+?)>/,
	TAGS_REGEX = /<blog-tags>\s*(.+?)\s*</,
	SUMMARY_TAG_REGEX = /<blog-summary>\s*([^]+?)\s*</m,
	SUMMARY_REGEX = /<p>\s*([^]+?)\s*<\/p/m,
	ATTR_REGEX = /\s*([\w-]+)\s*=\s*"([^"]+)"/g;

const DefaultConfig = {
	postsDir: 'posts',
};

function Code(source: string, language?: string) {
	return `<blog-code language="${
		language || ''
	}"><!--${source}--></blog-code>`;
}

function CodeHighlight(source: string, language?: string) {
	return (
		'<pre><code class="hljs">' +
		(language
			? hljs.highlight(language, source)
			: hljs.highlightAuto(source, [
					'html',
					'typescript',
					'javascript',
					'css',
			  ])
		).value +
		'</code></pre>'
	);
}

const markdownMeta = /^(\w+):\s*(.+)\s*/gm;

function getMetaValue<K extends keyof Meta>(key: K, val: string): Meta[K] {
	return key === 'date' ? new Date(val).toISOString() : val;
}

const FenceHandler: Record<
	string,
	(content: string, meta: Partial<Meta>) => string
> = {
	meta(content: string, meta: Partial<Meta>) {
		let m: RegExpExecArray | null;
		while ((m = markdownMeta.exec(content))) {
			meta[m[1] as keyof Meta] = getMetaValue(m[1] as keyof Meta, m[2]);
		}

		return meta.tags ? `<blog-tags>${meta.tags}</blog-tags>` : '';
	},
};

function cxlDemo(info: string, content: string, type = 'demo') {
	const [, libraries] = info.split(':');
	return `<blog-${type}${
		libraries ? ` libraries="${libraries}"` : ''
	}><!--${content}--></blog-${type}>`;
}

export function renderMarkdown(source: string, config?: BlogConfig) {
	const highlight = config?.highlight ? CodeHighlight : Code;
	const md = new MarkdownIt({
		highlight,
		html: true,
	});
	md.normalizeLink = url => url;
	const rules = md.renderer.rules;
	const map = {
		h1: 'h3',
		h2: 'h4',
		h3: 'h5',
		h4: 'h6',
	};
	const meta: Partial<Meta> = {};

	rules.heading_open = (tokens, idx) => {
		const tag = tokens[idx].tag as keyof typeof map;
		if (tag === 'h1') return '<blog-title>';
		if (tag === 'h2') {
			const content = tokens[idx + 1]?.content ?? '';
			const id = `h2_${content
				.toLowerCase()
				.replace(/[^\w]+/g, '-')
				.replace(/^-|-$/g, '')}`;
			return `<a class="h2-anchor" id="${id}" href="#${id}"><h2>`;
		}
		return `<${tag}>`;
	};
	rules.heading_close = (tokens, idx) => {
		const tag = tokens[idx].tag;

		if (tag === 'h2') return `</h2></a>`;
		return tag === 'h1' ? `</blog-title>` : `</${tag}>`;
	};
	rules.code_block = (tokens, idx) => highlight(tokens[idx].content);
	rules.fence = (tokens, idx) => {
		const token = tokens[idx];
		const info = token.info;
		if (info.startsWith('demo')) return cxlDemo(info, token.content);
		if (info.startsWith('example'))
			return cxlDemo(info, token.content, 'example');

		const handler = FenceHandler[token.info];
		return handler
			? handler(token.content, meta)
			: highlight(token.content);
	};
	rules.table_open = () => '<c-table>';
	rules.table_close = () => '</c-table>';
	//rules.thead_open = () => '<c-tr>';
	//rules.thead_close = () => '</c-tr>';
	rules.tr_open = () => '<c-tr>';
	rules.tr_close = () => '</c-tr>';
	rules.th_open = () => '<c-th>';
	rules.th_close = () => '</c-th>';
	rules.td_open = () => '<c-td>';
	rules.td_close = () => '</c-td>';
	rules.tbody_open = () => '<c-tbody>';
	rules.tbody_close = () => '</c-tbody>';

	const content =
		md.render(source) +
		(meta.threadId || meta.redditId
			? `<blog-social threadid="${meta.threadId || ''}" redditid="${
					meta.redditId || ''
			  }"></blog-social>`
			: '');

	return { meta, content };
}

function parseMeta(content: string) {
	const meta = content.match(META_REGEX)?.[1];
	if (!meta) return undefined;

	const result: Record<string, string> = {};
	let attrs;
	while ((attrs = ATTR_REGEX.exec(meta))) {
		const val =
			attrs[1] === 'date' ? new Date(attrs[2]).toISOString() : attrs[2];
		result[attrs[1]] = val;
	}
	return result;
}

function getPostId(title: string) {
	return title
		.replace(/^[^\w]+/g, '')
		.replace(/[^\w]+$/g, '')
		.replace(/[^\w]+/g, '-')
		.toLowerCase();
}

function Html(_url: string, content: string, stat: Stats): Post {
	const meta = parseMeta(content) || {};
	const tags = content.match(TAGS_REGEX)?.[1] || meta.tags;
	const title =
		content.match(TITLE_REGEX)?.[1] || meta.title || 'Untitled Post';
	const summary =
		content.match(SUMMARY_TAG_REGEX)?.[1] ||
		meta.summary ||
		content.match(SUMMARY_REGEX)?.[1] ||
		'';
	const type = meta.type || 'post';

	return {
		id: getPostId(title),
		title,
		summary,
		date: meta.date,
		version: meta.version,
		uuid: meta.uuid || '',
		mtime: stat.mtime.toISOString(),
		author: meta.author || '',
		type,
		tags,
		href: meta.href,
		content,
	};
}

async function buildPosts(config: BlogConfig, posts: Post[]) {
	const HEADER = config.headerTemplate
		? await readFile(config.headerTemplate)
		: '';
	return posts.flatMap(p => {
		const source = Buffer.from(`${HEADER}${p.content}`);
		return p.uuid
			? [
					{
						path: `${p.uuid}-${p.id}/index.html`,
						source,
					},
					{
						path: `${p.uuid}.html`,
						source,
					},
			  ]
			: {
					path: `${p.id}.html`,
					source,
			  };
	});
}

async function build(config: BlogConfig): Promise<Output[]> {
	const uuids: string[] = [];
	const postTemplate = config.postTemplate
		? await readFile(config.postTemplate, 'utf8')
		: undefined;

	function Markdown(url: string, source: string, stats: Stats) {
		const { meta, content } = renderMarkdown(source, config);
		const title =
			source.match(/^#\s+(.+)/)?.[1].trim() ||
			basename(url).replace(/\.md$/, '');
		const summary = (
			meta.summary ||
			content.match(SUMMARY_REGEX)?.[1] ||
			''
		).replace(/"/g, '&quot;');
		const uuid = meta.uuid;

		if (meta.type === 'post') {
			if (!uuid) throw `Invalid UUID: ${title}`;
			if (uuids.includes(uuid)) throw `UUID Collision: ${title}`;
			uuids.push(uuid);
		}
		const id = getPostId(title);
		const href = `${config.hrefPrefix}${uuid}-${id}`;

		return {
			id,
			title,
			summary,
			date: meta.date || stats.mtime.toISOString(),
			version: meta.version,
			uuid,
			mtime: stats.mtime.toISOString(),
			author: meta.author || '',
			type: meta.type || (meta.date ? 'post' : 'draft'),
			tags: meta.tags || '',
			href,
			content: postTemplate
				? postTemplate
						.replace(/__BLOG_CONTENT__/, content)
						.replace(/__BLOG_BASEURL__/g, config.baseUrl ?? '')
						.replace(/__BLOG_SUMMARY__/g, summary)
						.replace(/__BLOG_INDEXURL__/g, config.indexUrl ?? '')
						.replace(
							/__BLOG_CANONICAL__/g,
							`${config.canonicalUrl}${href}`,
						)
						.replace(/__BLOG_TITLE__/g, title)
				: content,
		};
	}

	async function getPostData(url: string): Promise<Post> {
		const [source, stats] = await Promise.all([
			readFile(url, 'utf8'),
			stat(url),
		]);

		return url.endsWith('.md')
			? Markdown(url, source, stats)
			: Html(url, source, stats);
	}
	async function buildFromSource(postsDir: string) {
		const files = (await readdir(postsDir)).filter(f => POST_REGEX.test(f));
		return await Promise.all(
			files.map(f => getPostData(`${postsDir}/${f}`)),
		);
	}

	const postsDir = config.postsDir || DefaultConfig.postsDir;
	const posts = Array.isArray(postsDir)
		? (await Promise.all(postsDir.map(buildFromSource))).flat()
		: await buildFromSource(postsDir);

	const postsFiles = await buildPosts(config, posts);
	const tags: Record<string, string[]> = {};
	const types = new Set<string>();

	posts
		.sort((a, b) => (a.date > b.date ? -1 : 1))
		.forEach(a => {
			const typeTags = tags[a.type] || (tags[a.type] = []);
			if (a.tags)
				for (const tag of a.tags.split(' '))
					if (!typeTags.includes(tag)) typeTags.push(tag);

			if (a.type === 'post' && !a.uuid)
				throw new Error(`Post "${a.title}" does not contain a uuid`);

			types.add(a.type);
		});

	const postsJson = {
		posts: config.includeContent
			? posts
			: posts.map(p => ({ ...p, content: undefined })),
		tags,
		types: Array.from(types),
	} as PostsJson;

	if (config.processIndex) await processIndex(config.processIndex, postsJson);

	return [
		{
			path: 'posts.json',
			source: Buffer.from(JSON.stringify(postsJson)),
		},
		...postsFiles,
		/*{
			path: 'sitemap.txt',
			source: Buffer.from(
				posts
					.map(post => 'https://debuggerjs.com/posts/' + post.id)
					.join('\n')
			),
		},*/
	];
}

export function dateYMD(date: string): string {
	const d = new Date(date);
	const pad = (n: number) => n.toString().padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateShort(date: Date | string): string {
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});
}

function processIndex(files: string[], { posts, tags }: PostsJson) {
	const index = posts
		.map(
			p => `
	<article data-tags="${
		p.tags
	}" itemscope itemtype="https://schema.org/BlogPosting">
  <header>
    <h2 itemprop="headline">
      <a href="${p.href}" itemprop="url">${p.title}</a>
    </h2>
    <p>
      <time datetime="${dateYMD(p.date)}" itemprop="datePublished">${dateShort(
			p.date,
		)}</time>
    </p>
  </header>
  <p itemprop="description">${p.summary}</p>
</article>`,
		)
		.join('');
	const tagsHtml =
		tags.post
			?.sort()
			.map(t => `<c-chip size="-1">${t}</c-chip>`)
			.join('') ?? '';

	return Promise.all(
		files.map(async filePath => {
			const source = await readFile(filePath, 'utf8');
			const newSource = source
				.replace(/__BLOG_TITLE__/, 'Home')
				.replace(/__BLOG_INDEX__/, index)
				.replace(/__BLOG_TAGS__/, tagsHtml);
			await writeFile(filePath, newSource);
		}),
	);
}

export function buildBlog(config: BlogConfig): Task {
	return observable(async subs => {
		const out = await build(config);
		out.forEach(o => subs.next(o));
		subs.complete();
	});
}
