import { basename } from 'path';

import { Observable, from } from '@cxl/rx';
import { file } from './file.js';

import type { Output } from '@cxl/source';

export interface TemplateConfig {
	header: string;
	replace?: Record<string, string | (() => string)>;
}

/*export const REQUIRE_REPLACE = `
	require.replace = function (path) {
		return path.replace(
			/^@cxl\\/workspace\\.(.+)/,
			(str, p1) =>
				\`/cxl.app/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		).replace(
			/^@cxl\\/ui(.*)/,
			(str, p1) =>
				\`/ui/dist/ui5/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		).replace(
			/^@cxl\\/(.+)/,
			(str, p1) =>
				\`/cxl/dist/\${str.endsWith('.js') ? p1 : p1 + '/index.js'}\`
		);
	};
`;
const INDEX_HEAD = `<!DOCTYPE html><meta charset="utf-8"><script src="index.bundle.min.js"></script><script>require('./index.js')</script>`;
const DEBUG_HEAD = `<!DOCTYPE html><meta charset="utf-8">
<script type="importmap">
{
	"imports": {
		"@cxl/dts/": "/cxl/dist/dts/mjs/",
		"@cxl/ui": "../../node_modules/@cxl/ui/index.js"
	}
}
</script>
<script>window.CXL_DEBUG = true;</script>
<script type="module" src="index.js"></script>
`;
*/
const DefaultTemplateConfig = {
	header: `<!DOCTYPE html><meta charset="utf-8"><script type="module" src="index.js"></script>`,
};

const HTML_COMMENT_REGEX = /<!--[^]+?-->/gm;

export function template(
	filename: string,
	config: Partial<TemplateConfig> = {},
): Observable<Output> {
	return file(filename).switchMap(({ source }) => {
		const replace = config.replace;
		let sourceStr = source.toString('utf8');
		if (replace) {
			sourceStr = sourceStr.replace(/__CXL_(.+?)__/g, (_, $1) => {
				const term = replace[$1];
				return typeof term === 'string' ? term : term();
			});
		}

		const prodSource = sourceStr.replace(HTML_COMMENT_REGEX, '');
		const cfg = { ...DefaultTemplateConfig, ...config };

		return from([
			{
				path: basename(filename),
				source: Buffer.from(`${cfg.header}\n${prodSource}`),
			},
		]);
	});
}
