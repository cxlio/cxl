import { Result, Test } from './index';
import '../dom/virtual';
import { colors } from '../server/colors';
import { Application } from '../server';

declare const process: any;
declare const console: any;

class TestReport {
	failures: Result[] = [];
	constructor(private suite: Test) {}

	printTest(test: Test) {
		let out = '';

		const failures = test.results.filter(result => {
			out += result.success ? colors.green('.') : colors.red('X');
			return result.success === false;
		});

		if (test.results.length === 0 && test.tests.length === 0) {
			out = colors.red('X');
			failures.push(new Result(false, 'No assertions found'));
		}

		console.group(`${test.name} ${out}`);
		failures.forEach(fail => this.printError(fail));
		test.tests.forEach((test: Test) => this.printTest(test));
		console.groupEnd();

		return failures;
	}

	printError(fail: Result) {
		this.failures.push(fail);
		const msg = fail.message;

		if (msg instanceof Error) {
			console.error(colors.red(msg.message));
			console.error(msg.stack);
		} else console.error(colors.red(msg));
	}

	print() {
		this.printTest(this.suite);
		return this.failures;
	}
}

class TestRunner extends Application {
	version = '0.0.1';
	name = '@cxl/tester';

	async run() {
		const cwd = process.cwd();

		const suite = (await import(cwd + '/test')).default;
		await suite.run();
		const report = new TestReport(suite);
		const failures = report.print();

		if (failures.length) process.exit(1);
	}
}

new TestRunner().start();
