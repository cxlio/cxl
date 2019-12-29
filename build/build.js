/*import ts from 'typescript';
import fs from 'fs';
import cp from 'child_process';*/
const ts = require('typescript'),
	fs = require('fs'),
	cp = require('child_process');

const AMD = fs.readFileSync('amd.js', 'utf8');

function write(path, source) {
	console.log(`Writing ${path}`);
	fs.writeFileSync(path, source);
}

cp.execSync('mkdir -p ../dist/build');
cp.execSync('npm run build-index');

const amdConfig = JSON.parse(fs.readFileSync('./tsconfig.amd.json'));
amdConfig.compilerOptions.outFile = 'amd.js';

write('../dist/build/tsconfig.amd.json', JSON.stringify(amdConfig));
write('../dist/build/package.json', fs.readFileSync('package.json'));
