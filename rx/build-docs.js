const TypeDoc = require('typedoc');
const app = new TypeDoc.Application();

app.bootstrap({
	// mode: 'modules',
	mode: 'modules',
	logger: 'none',
	target: 'ES6',
	module: 'CommonJS',
	entryPoint: 'index.ts',
	experimentalDecorators: true,
	excludeNotExported: true,
	//excludePrivate: true,
	// includeVersion: true,
});

// app.converter.excludeNotExported = true;

// const project = app.convert(app.expandInputFiles(['index.ts']));
const project = app.convert(['index.ts']); //app.expandInputFiles(['index.ts']));

if (project) {
	app.generateJson(project, '../dist/rx/docs.json');
} else {
	console.error('Error generating docs');
	process.exit(1);
}
