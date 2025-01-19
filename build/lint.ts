import { relative } from 'path';

import { Observable } from '@cxl/rx';
import { Output } from '@cxl/source';
import { appLog } from './builder.js';

import type { ESLint } from 'eslint';

function handleEslintResult(results: ESLint.LintResult[]) {
	const result: Output[] = [];
	let hasErrors = false;

	results.forEach(result => {
		const errorCount = result.errorCount;
		const file = relative(process.cwd(), result.filePath);

		appLog(`eslint ${file}`);
		if (errorCount) {
			hasErrors = true;
			result.messages.forEach(r =>
				console.error(
					`${file}#${r.line}:${r.column}: ${r.message} (${r.ruleId})`,
				),
			);
		}
	});
	if (hasErrors) throw new Error('eslint errors found.');

	return result;
}

export function eslint(options?: any) {
	return new Observable<Output>(subs => {
		const eslintPath = require.resolve('eslint', {
			paths: [process.cwd(), __dirname],
		});
		const { ESLint } = require(eslintPath) as typeof import('eslint');
		appLog(`eslint ${ESLint.version} (${eslintPath})`);

		const linter = new ESLint({
			cache: true,
			cwd: process.cwd(),
			// fix: true,
			...options,
		});
		linter
			.lintFiles(['**/*.ts?(x)'])
			.then(handleEslintResult)
			.then(
				() => subs.complete(),
				e => subs.error(e),
			);
	});
}
