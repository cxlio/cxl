import { Application } from './index.js';
import { suite } from '@cxl/spec';

export default suite('server', test => {
	test('Application', a => {
		class TestApp extends Application {
			name = 'test';
			setup() {
				this.parameters.register(
					{
						name: 'node',
					},
					{
						name: 'ignoreCoverage',
					}
				);
			}
			run() {
				a.equal(this.name, 'test');
			}
		}
		const app = new TestApp();
		const done = a.async();
		app.start().then(done);
	});
});
