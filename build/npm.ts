import { sh } from './index.js';

export async function getPublishedVersion(packageName: string) {
	const info = await checkNpms(packageName);
	return info?.collected?.metadata.version;
}

export async function checkNpms(name: string) {
	try {
		const out = await sh(
			`curl -s https://api.npms.io/v2/package/${name.replace('/', '%2f')}`
		);
		return JSON.parse(out.trim());
	} catch (e) {
		console.error(e);
		return;
	}
}

export async function checkNpm(name: string) {
	try {
		return JSON.parse((await sh(`npm show ${name} --json`)).trim());
	} catch (e) {
		console.error(e);
		return;
	}
}
