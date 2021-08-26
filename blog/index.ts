import { Stats } from 'fs';
import { readdir, readFile, stat } from 'fs/promises';
import { observable } from '@cxl/rx';
import { Output, Task } from '@cxl/build';

import * as MarkdownIt from 'markdown-it';
import * as hljs from 'highlight.js';

export interface BlogConfig {
	postsDir?: string | string[];
	headerTemplate?: string;
}

export interface BlogPosts {
	posts: Post[];
	tags: string[];
}

export interface Meta {
	uuid: string;
	date: string;
	author: string;
	tags?: string;
}

export interface Post {
	uuid: string;
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

function getMetaValue(key: string, val: string) {
	return key === 'date' ? new Date(val).toISOString() : val;
}

const FenceHandler: Record<string, (content: string, meta: any) => string> = {
	meta(content: string, meta: any) {
		let m: RegExpExecArray | null;
		while ((m = markdownMeta.exec(content))) {
			meta[m[1]] = getMetaValue(m[1], m[2]);
		}

		return meta.tags ? `<blog-tags>${meta.tags}</blog-tags>` : '';
	},
	demo(content: string) {
		return `<blog-demo><!--${content}--></blog-demo>`;
	},
};

export function renderMarkdown(source: string) {
	const md = new MarkdownIt({
		highlight: Code,
		html: true,
	});
	const rules = md.renderer.rules;
	const map: any = {
		h1: 'h3',
		h2: 'h4',
		h3: 'h5',
		h4: 'h6',
	};
	const meta: any = {};

	rules.heading_open = (tokens, idx) => {
		const tag = tokens[idx].tag;
		return tag === 'h1' ? `<blog-title>` : `<cxl-t ${map[tag]}>`;
	};
	rules.heading_close = (tokens, idx) => {
		const tag = tokens[idx].tag;
		return tag === 'h1' ? `</blog-title>` : `</cxl-t>`;
	};
	rules.code_block = (tokens, idx) => Code(tokens[idx].content);
	rules.fence = (tokens, idx) => {
		const token = tokens[idx];
		const handler = FenceHandler[token.info];
		return handler ? handler(token.content, meta) : Code(token.content);
	};

	return { meta, content: md.render(source) };
}

function Markdown(url: string, source: string, stats: Stats) {
	const { meta, content } = renderMarkdown(source);
	const title =
		source.match(/^#\s+(.+)/)?.[1].trim() || url.replace(/\.md$/, '');
	const summary = content.match(SUMMARY_REGEX)?.[1] || '';

	return {
		id: getPostId(title),
		title,
		summary,
		date: meta.date || stats.mtime.toISOString(),
		version: meta.version,
		uuid: meta.uuid || '',
		mtime: stats.mtime.toISOString(),
		author: meta.author || '',
		type: meta.type || (meta.date ? 'post' : 'draft'),
		tags: meta.tags || '',
		href: meta.href,
		content,
	};
}

function parseMeta(content: string) {
	const meta = content.match(META_REGEX)?.[1];
	if (!meta) return undefined;

	const result: Record<string, string> = {};
	let attrs: any;
	while ((attrs = ATTR_REGEX.exec(meta))) {
		const val =
			attrs[1] === 'date' ? new Date(attrs[2]).toISOString() : attrs[2];
		result[attrs[1]] = val;
	}
	return result;
}

function getPostId(title: string) {
	return title.replace(/[ /]/g, '-').toLowerCase();
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
	return {
		id: getPostId(title),
		title,
		summary,
		date: meta.date,
		version: meta.version,
		uuid: meta.uuid || '',
		mtime: stat.mtime.toISOString(),
		author: meta.author || '',
		type: meta.type || 'post',
		tags,
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

async function buildPosts(config: BlogConfig, posts: Post[]) {
	const HEADER = config.headerTemplate
		? await readFile(config.headerTemplate)
		: '';
	return posts.map(p => ({
		path: p.id,
		source: Buffer.from(`${HEADER}${p.content}`),
	}));
}

async function buildFromSource(postsDir: string) {
	const files = (await readdir(postsDir)).filter(f => POST_REGEX.test(f));
	return await Promise.all(files.map(f => getPostData(`${postsDir}/${f}`)));
}

async function build(config: BlogConfig): Promise<Output[]> {
	const postsDir = config.postsDir || DefaultConfig.postsDir;
	const posts = Array.isArray(postsDir)
		? (await Promise.all(postsDir.map(buildFromSource))).flat()
		: await buildFromSource(postsDir);

	const postsFiles = await buildPosts(config, posts);
	const tags = new Set();
	const types = new Set();

	posts
		.sort((a, b) => (a.date > b.date ? -1 : 1))
		.forEach(a => {
			if (a.type === 'post' && a.tags)
				for (const tag of a.tags.split(' ')) tags.add(tag);
			types.add(a.type);
		});

	const postsJson = {
		posts: posts.map(p => Object.assign(p, { content: undefined })),
		tags: Array.from(tags).flat(),
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
