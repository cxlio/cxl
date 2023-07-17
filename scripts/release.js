const fs = require('fs').promises;
const { existsSync } = require('fs');
const readline = require('readline');

const { sh } = require('../dist/build');
const { readJson } = require('../dist/server');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

async function renderLog(project, logs) {
	const path = project === 'cxl' ? '' : `${project}/`;
	const outFile = `${path}CHANGELOG.md`;
	const pkg = await readJson(`${path}package.json`);

	if (!pkg) return;
	console.log(outFile);

	const date = new Date().toLocaleDateString();
	const title = `## ${pkg.version === '0.0.0' ? date : `[${pkg.version}]`}`;
	const changelog = existsSync(outFile)
		? await fs.readFile(outFile, 'utf8')
		: '# Changelog\n\n';
	const logText = `${title}\n\n${logs.join('\n')}`;
	const appendRegex = new RegExp(
		`${title.replace(/\[/, '\\[')}[^]+(?:##|$)`,
		'm'
	);
	console.log(logText);
	let outText = changelog.replace(appendRegex, logText);
	if (outText === changelog)
		outText = changelog.replace(/(##)|$/, n => `${logText}\n\n${n || ''}`);

	await fs.writeFile(outFile, outText);
}

async function release() {
	const branch = await sh(`git rev-parse --abbrev-ref HEAD`);

	if (branch === 'master')
		throw new Error('Cannot run this script in master');

	try {
		await sh(`git diff-index --quiet HEAD`);
	} catch (e) {
		throw new Error('Not a clean repository');
	}

	const masterCommit = (await sh(`git rev-parse master`)).trim();
	const log = (await sh(`git log --oneline ${masterCommit}..HEAD`))
		.trim()
		.split('\n');

	if (log.length === 0) throw new Error('No changes detected');

	const LOG_REGEX = /(\w+) (feat|fix|docs|style|refactor|test|chore|revert)(?:\(([\w-]+)\))?: (.+)/;
	const files = { cxl: [] };

	log.forEach(line => {
		const match = LOG_REGEX.exec(line);
		if (!match) throw new Error(`Invalid commit message: ${line}`);

		const [, commit, type, project, message] = match;

		const projectLog = project
			? files[project] || (files[project] = [])
			: files.cxl;

		projectLog.push(`-   ${type}: ${message} [${commit}]`);
	});

	for (const project in files)
		try {
			await renderLog(project, files[project]);
		} catch (e) {
			console.log(`Skipping ${project}`);
			console.log(e);
		}

	await new Promise((resolve, reject) => {
		rl.question(`Continue? [Yn] `, canContinue =>
			canContinue === 'Y' ? resolve() : reject('Release aborted')
		);
	});

	await sh(`git commit -m "chore: generated changelog" -a`);
	await sh(`git checkout master`);
	await sh(
		`git merge --commit --squash -m "chore: merge release ${branch}" ${branch}`
	);
	await sh(`git push origin master`);
}

release().catch(e => {
	console.log(e);
	process.exit(1);
});
