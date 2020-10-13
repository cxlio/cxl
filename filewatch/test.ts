import { suite } from '../spec/index.js';
import { watch } from './index.js';
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from 'fs';
import { resolve } from 'path';

function mkdir(dir: string) {
	const result = resolve(dir);
	try {
		mkdirSync(result);
	} catch (e) {
		/* ignore */
	}
	return result;
}

export default suite('filewatch', test => {
	test('watch file', a => {
		const dir = mkdir(`test-${a.id}`);
		const id = `${dir}/file-${a.id}`;
		writeFileSync(id, '');

		const watcher = watch(id, { delay: 0, pollInterval: 0 });
		const done = a.async();
		let eventNumber = 0;

		const subs = watcher.subscribe(ev => {
			if (eventNumber === 0) {
				a.equal(ev.type, 'change');
				writeFileSync(id, 'hello');
			} else if (eventNumber === 1) {
				a.equal(ev.type, 'change');
				unlinkSync(id);
			} else if (eventNumber === 2) {
				a.equal(ev.type, 'remove');
				writeFileSync(id, 'world');
			} else if (eventNumber === 3) {
				a.equal(ev.type, 'change');
				a.equal(ev.path, id);
				unlinkSync(id);
			} else {
				a.equal(ev.type, 'remove');
				subs.unsubscribe();
				done();
				unlinkSync(id);
				rmdirSync(dir);
			}
			eventNumber++;
		});
		writeFileSync(id, 'world');
	});

	test('watch non existant file', a => {
		const dir = mkdir(`test-${a.id}`);
		const id = `${dir}/file-${a.id}`;
		const done = a.async();
		const watcher = watch(id, { delay: 0, pollInterval: 0 });
		const subs = watcher.subscribe(ev => {
			a.equal(ev.type, 'change');
			subs.unsubscribe();
			done();
			unlinkSync(id);
		});
		writeFileSync(id, 'world');
		writeFileSync(id, '');
	});

	test('watch file multiple events', a => {
		const dir = mkdir(`test-${a.id}`);
		const id = `${dir}/file-${a.id}`;
		const done = a.async();
		let eventNumber = 0;
		writeFileSync(id, '');
		const watcher = watch(id, { delay: 0, pollInterval: 0 });
		const subs = watcher.subscribe(ev => {
			if (eventNumber === 0) {
				a.equal(ev.type, 'change');
				eventNumber++;
				unlinkSync(id);
				writeFileSync(id, '');
			} else if (eventNumber === 1) {
				a.equal(ev.type, 'change');
				subs.unsubscribe();
				done();
				unlinkSync(id);
			}
		});
		writeFileSync(id, 'world');
		writeFileSync(id, '');
	});

	test('watch directory', a => {
		const dir = mkdir(`test-${a.id}`);
		const watcher = watch(dir, { delay: 0 });
		const id = `${dir}/file-${a.id}`;
		const done = a.async();
		let eventNumber = 0;

		const subs = watcher.subscribe(ev => {
			if (eventNumber === 0) {
				a.equal(ev.type, 'change');
				writeFileSync(id, 'hello');
			} else if (eventNumber === 1) {
				a.equal(ev.type, 'change');
				unlinkSync(id);
			} else if (eventNumber === 2) {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, id);
				rmdirSync(dir);
			} else {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, dir);
				subs.unsubscribe();
				done();
			}
			eventNumber++;
		});

		writeFileSync(id, '');
	});

	test('watch directory same filename', a => {
		const dir = mkdir(`test-${a.id}`);
		const watcher = watch(dir, { delay: 0 });
		const id = `${dir}/test-${a.id}`;
		const done = a.async();
		let eventNumber = 0;

		const subs = watcher.subscribe(ev => {
			if (eventNumber === 0) {
				a.equal(ev.type, 'change');
				writeFileSync(id, 'hello');
			} else if (eventNumber === 1) {
				a.equal(ev.type, 'change');
				unlinkSync(id);
			} else if (eventNumber === 2) {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, id);
				rmdirSync(dir);
			} else {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, dir);
				subs.unsubscribe();
				done();
			}
			eventNumber++;
		});

		writeFileSync(id, '');
	});

	test('watch directory inside directory', a => {
		const dir = mkdir(`test-${a.id}`);
		const id = `${dir}/sub-${a.id}`;
		const watcher = watch(dir, { delay: 0 });
		const done = a.async();
		let eventNumber = 0;

		const subs = watcher.subscribe(ev => {
			if (eventNumber === 0) {
				a.equal(ev.type, 'change');
				rmdirSync(id);
				eventNumber++;
			} else if (eventNumber === 1) {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, id);
				mkdir(id);
				eventNumber++;
			} else if (eventNumber === 2) {
				a.equal(ev.type, 'change');
				a.equal(ev.path, id);
				rmdirSync(id);
				eventNumber++;
			} else if (eventNumber === 3) {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, id);
				rmdirSync(dir);
				eventNumber++;
			} else {
				a.equal(ev.type, 'remove');
				a.equal(ev.path, dir);
				subs.unsubscribe();
				done();
			}
		});

		mkdir(id);
	});
});
