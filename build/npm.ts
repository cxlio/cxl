import { sh } from './index.js';

export async function checkNPMS(name: string) {
	try {
		const out = await sh(
			`curl -s https://api.npms.io/v2/package/${name.replace('/', '%2f')}`
		);
		return JSON.parse(out.trim());
	} catch (e) {
		console.log(e);
		return;
	}
}
