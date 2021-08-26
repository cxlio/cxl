#!/usr/bin/env node
import { spawn } from 'child_process';

const args = process.argv[2];
const node = 'node',
	bin = args || 'index.js',
	timeout = 1000;

let startTime: number;

start();

function onExit(code: number) {
	if (code !== 0 && Date.now() - startTime > timeout) {
		console.log(`Received signal ${code}. Attempting restart...`);
		start();
	}
}

function start() {
	startTime = Date.now();

	const c = spawn(node, [bin], {
		stdio: 'inherit',
	});

	c.on('exit', onExit);
}
