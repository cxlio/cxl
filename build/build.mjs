import fs from 'fs';
import cp from 'child_process';

function write(path, source) {
	console.log(`Writing ${path}`);
	fs.writeFileSync(path, source);
}

cp.execSync('mkdir -p ../dist/build');
cp.execSync('npm run build-index && npm run build-test', { encoding: 'utf8' });
cp.execSync('cp amd.js license* ../dist/build');

const amdConfig = JSON.parse(fs.readFileSync('./tsconfig.amd.json'));
amdConfig.compilerOptions.outFile = 'amd.js';

write('../dist/build/tsconfig.amd.json', JSON.stringify(amdConfig));
write('../dist/build/package.json', fs.readFileSync('package.json'));
