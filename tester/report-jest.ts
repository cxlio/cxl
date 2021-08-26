export type epoch = string;

interface Location {
	column: number;
	line: number;
}

export interface TestResult {
	title: string;
	status: 'failed' | 'pending' | 'passed';
	ancestorTitles: string[];
	failureMessages: string[];
	numPassingAsserts: number;
	location: Location;
}

export interface RootResult {
	numFailingTests: number;
	numPassingTests: number;
	numPendingTests: number;
	testResults: TestResult[];
	perfStats: {
		start: epoch;
		end: epoch;
	};
	testFilePath: string;
	coverage: any;
}

/**
 * Report output is compatible with the Jest library output, documented here:
 */
export interface Report {
	success: boolean;
	startTime: epoch;
	numTotalTestSuites: number;
	numPassedTestSuites: number;
	numFailedTestSuites: number;
	numRuntimeErrorTestSuites: number;
	numTotalTests: number;
	numPassedTests: number;
	numFailedTests: number;
	numPendingTests: number;
	numTodoTests: number;
	openHandles: Error[];
	testResults: RootResult[];
}
