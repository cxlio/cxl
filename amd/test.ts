import { spec } from '@cxl/spec';
import './index.js';

export default spec('amd', s => {
	window.fetch = () => {
		return new Promise(resolve => {
			resolve({
				status: 200,
				text: async () => `define('test', [], ()=>{})`,
			} as Response);
		});
	};

	s.test('define', it => {
		it.should('define module synchronously', a => {
			define(`module${a.id}`, ['exports', 'require'], (ex, req) => {
				a.ok(ex);
				a.ok(req);
			});
		});
		it.should('define multiple modules synchronously', a => {
			const base = `module${a.id}`;
			let i = 1;
			define(`${base}-1`, ['exports'], ex => {
				// Do Nothing
				(ex as Record<string, number>).test = i++;
			});
			define(`${base}-2`, [`${base}-1`], mod => {
				a.equal((mod as Record<string, number>).test, 1);
			});
			define(`${base}-3`, [`${base}-1`], mod => {
				a.equal((mod as Record<string, number>).test, 1);
			});
		});

		it.should('define module without name', a => {
			define(['exports', 'require'], (ex, req) => {
				a.ok(ex);
				a.ok(req);
			});
		});

		it.should('define module without dependencies', a => {
			define.moduleName = String(a.id);
			define(function () {
				a.equal(arguments.length, 0);
			});
		});

		it.should('load dependencies asynchronously', a => {
			const done = a.async();
			define(`module${a.id}`, ['test'], mod => {
				a.ok(mod);
			});
			define(`module${a.id}-2`, ['test'], mod => {
				a.ok(mod);
				done();
			});
		});

		it.should('load relative dependencies', a => {
			define('/one/two/three/five.js', [], () => {
				/*nop*/
			});
			define('/one/two/three/four', [
				'../../two/three/five',
				'../three/five',
				'./five',
			], (A, B, C) => {
				a.ok(A);
				a.ok(B);
				a.ok(C);
			});
			define('noslash/one/two/three/five.js', [], () => {
				/*nop*/
			});
			define('noslash/one/two/three/four', [
				'../../two/three/five',
				'../three/five',
				'./five',
			], (A, B, C) => {
				a.ok(A);
				a.ok(B);
				a.ok(C);
			});
		});
	});
});
