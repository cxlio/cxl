import type { Stats } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { observable } from '@cxl/rx';
import { Output, Task } from '@cxl/build';

import * as MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export interface BlogConfig {
	postsDir?: string | string[];
	headerTemplate?: string;
	highlight?: boolean;
	includeContent?: boolean;
}

export interface BlogPosts {
	posts: Post[];
	tags: Record<string, string[]>;
}

export interface Meta {
	uuid: string;
	date: string;
	author: string;
	version?: string;
	type?: string;
	href?: string;
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

		return meta.tags ? `<cxl-blog-tags>${meta.tags}</cxl-blog-tags>` : '';
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
		return tag === 'h1' ? `<blog-title>` : `<${tag}>`;
	};
	rules.heading_close = (tokens, idx) => {
		const tag = tokens[idx].tag;
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
	rules.table_open = () => '<cxl-table>';
	rules.table_close = () => '</cxl-table>';
	//rules.thead_open = () => '<cxl-tr>';
	//rules.thead_close = () => '</cxl-tr>';
	rules.tr_open = () => '<cxl-tr>';
	rules.tr_close = () => '</cxl-tr>';
	rules.th_open = () => '<cxl-th>';
	rules.th_close = () => '</cxl-th>';
	rules.td_open = () => '<cxl-td>';
	rules.td_close = () => '</cxl-td>';
	rules.tbody_open = () => '<cxl-tbody>';
	rules.tbody_close = () => '</cxl-tbody>';

	const content =
		md.render(source) +
		(meta.threadId || meta.redditId
			? `<blog-social threadid="${meta.threadId}" redditid="${meta.redditId}"></blog-social>`
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
						path: `${p.id}.html`,
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

const uuids: string[] = [];

async function build(config: BlogConfig): Promise<Output[]> {
	function Markdown(url: string, source: string, stats: Stats) {
		const { meta, content } = renderMarkdown(source, config);
		const title =
			source.match(/^#\s+(.+)/)?.[1].trim() || url.replace(/\.md$/, '');
		const summary = meta.summary || content.match(SUMMARY_REGEX)?.[1] || '';
		const uuid = meta.uuid;

		if (meta.type === 'post') {
			if (!uuid) throw `Invalid UUID: ${title}`;
			if (uuids.includes(uuid)) throw `UUID Collision: ${title}`;
			uuids.push(uuid);
		}

		return {
			id: getPostId(title),
			title,
			summary,
			date: meta.date || stats.mtime.toISOString(),
			version: meta.version,
			uuid,
			mtime: stats.mtime.toISOString(),
			author: meta.author || '',
			type: meta.type || (meta.date ? 'post' : 'draft'),
			tags: meta.tags || '',
			href: meta.href,
			content,
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
	};

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

export function buildBlog(config: BlogConfig): Task {
	return observable(subs => {
		build(config).then(out => {
			out.forEach(o => subs.next(o));
			subs.complete();
		});
	});
}
