import { cold, logEvents } from './util';
import { suite } from '../../spec';

export default suite('switchMap', test => {
	test('should handle outer throw', a => {
		const x = cold('--a--b--c--|');
		const e1 = cold('#');
		logEvents(e1.switchMap(() => x)).then(({ events }) => {
			a.equal(events, '#');
		});
	});

	test('should handle outer empty', a => {
		const x = cold('--a--b--c--|');
		const e1 = cold('|');
		logEvents(e1.switchMap(() => x)).then(result => {
			a.equal(result.events, '|');
		});
	});

	test('should raise error if project throws', a => {
		const e1 = cold('---x|');
		const result = e1.switchMap(() => {
			throw 'error';
		});
		logEvents(result).then(({ events }) => {
			a.equal(events, '---#');
		});
	});
});
