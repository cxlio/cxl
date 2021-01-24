import { readFileSync } from 'fs';
import { relative } from 'path';
import type { Test } from '@cxl/spec';
import { SourceMap, getSourceMap, positionToIndex } from '@cxl/source';

export interface TestResult {
	success: boolean;
	message: string;
	stack?: string;
}

export interface CoverageRange {
	startOffset: number;
	endOffset: number;
	count: number;
}

export interface TestReport {
	name: string;
	failureCount: number;
	results: TestResult[];
	tests: TestReport[];
}

export interface FunctionCoverage {
	functionName: string;
	ranges: CoverageRange[];
	isBlockCoverage: boolean;
}

export type Coverage = TestCoverage[];

export interface Report {
	success: boolean;
	testReport: TestReport;
	coverage?: TestCoverageReport[];
}

export interface TestCoverage {
	url: string;
	functions: FunctionCoverage[];
}

export interface TestCoverageReport {
	url: string;
	functions: FunctionCoverage[];
	functionTotal?: number;
	functionCovered?: number;
	blockTotal: number;
	blockCovered: number;
}

function calculateCoverage(coverage: TestCoverage[]) {
	const result: TestCoverageReport[] = [];

	for (const cov of coverage) {
		let blockTotal = 0;
		let blockCovered = 0;

		for (const fnCov of cov.functions) {
			for (const range of fnCov.ranges) {
				const len = range.endOffset - range.startOffset;
				blockTotal += len;
				if (range.count) blockCovered += len;
				// else blockCovered -= len;
			}
		}

		result.push({
			url: cov.url,
			functions: cov.functions,
			blockTotal,
			blockCovered,
		});
	}

	return result;
}

function translateRanges(
	sourceMap: SourceMap,
	url: string,
	functions: FunctionCoverage[]
): TestCoverage[] {
	const source = readFileSync(url, 'utf8');
	const sourcesMap: any = {};

	functions.forEach(cov => {
		cov.ranges.forEach(range => {
			const newRange = sourceMap.translateRange(source, {
				start: range.startOffset,
				end: range.endOffset,
			});
			if (newRange) {
				const url = newRange.start.source;
				try {
					const s =
						sourcesMap[url] ||
						(sourcesMap[url] = {
							source: readFileSync(url, 'utf8'),
							ranges: [],
						});

					if (s.source)
						s.ranges.push({
							startOffset: positionToIndex(
								s.source,
								newRange.start
							),
							endOffset: positionToIndex(s.source, newRange.end),
							count: range.count,
						});
				} catch (e) {
					console.error(e);
					sourcesMap[url] = { ranges: [] };
				}
			}
		});
	});

	const cwd = process.cwd();
	const result: TestCoverage[] = [];
	for (const source in sourcesMap) {
		result.push({
			url: relative(cwd, source),
			functions: [
				{
					functionName: '',
					ranges: sourcesMap[source].ranges,
					isBlockCoverage: false,
				},
			],
		});
	}
	return result;
}

async function generateCoverageReport(coverage: Coverage) {
	const cwd = process.cwd();
	const filtered: TestCoverage[] = [];
	const ignoreRegex = /\/node_modules\//;

	for (const script of coverage) {
		const url = script.url.replace(/^file:\/\//, '');

		if (url.startsWith(cwd) && !ignoreRegex.test(url)) {
			const sourceMap = await getSourceMap(url).catch(() => undefined);
			const relativeUrl = relative(cwd, url);

			filtered.push({
				url: relativeUrl,
				functions: script.functions,
			});

			if (sourceMap)
				filtered.push(
					...translateRanges(sourceMap, url, script.functions)
				);
		}
	}

	return calculateCoverage(filtered);
}

function renderTestReport(test: Test): TestReport {
	let failureCount = 0;

	const results: TestResult[] = test.results.map(r => {
		if (r.success === false) failureCount++;

		return {
			message: r.message,
			success: r.success,
			stack: r.stack,
		};
	});

	const tests = (test.only.length ? test.only : test.tests).map(child => {
		const result = renderTestReport(child);
		failureCount += result.failureCount;
		return result;
	});

	if (results.length === 0 && test.tests.length === 0) {
		failureCount++;
		results.push({ success: false, message: 'No assertions found' });
	}

	return {
		name: test.name,
		failureCount,
		results,
		tests,
	};
}

export async function generateReport(
	suite: Test,
	v8Coverage?: Coverage
): Promise<Report> {
	const testReport = renderTestReport(suite);
	const coverage = v8Coverage && (await generateCoverageReport(v8Coverage));
	return {
		success: testReport.failureCount === 0,
		testReport,
		coverage,
	};
}
