/// <amd-module name="index" />
import { suite, Test } from '../tester/index.js';
import {
	getRegisteredComponents,
	ComponentDefinition
} from '../component/index.js';
import './index.js';

function testComponent(name: string, def: ComponentDefinition<any>, a: Test) {
	const { attributes } = def;
	const el: any = document.createElement(name);
	a.equal(el.tagName, name.toUpperCase());

	for (const attr in attributes) {
		el[attr] = true;
		a.equal(el[attr], true);
	}
}

export default suite('ui', test => {
	const components = getRegisteredComponents();
	console.log(components);
	components.forEach((def, tagName) => {
		if (typeof tagName === 'string')
			test(tagName, a => {
				testComponent(tagName, def, a);
			});
	});
});
