const { build, tsconfig, pkg, file } = require('../dist/build');

build({
	outputDir: '../dist/ui-docs',
	tasks: [tsconfig(), pkg(), file('src/debug.html')],
});

/*const ANALYTICS = `<script async src="https://www.googletagmanager.com/gtag/js?id=UA-39089340-3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-39089340-3');
</script>`,
	INDEX = src =>
		`<!DOCTYPE html>${ANALYTICS}<script src="${src}"></script><docs-root>`,
	BASE = [
		'../ui/dist/index.js',
		'../ui/dist/icons.js',
		'../ui/dist/router.js',
		'../ui/dist/validation.js',
		'../ui/src/meta.js',
		'../docs/dist/docs.js',
		'src/docs.js'
	];

require('../build').build({
	outputDir: 'dist',
	targets: [
		{
			output: 'ui-docs.js',
			src: BASE,
			minify: 'ui-docs.min.js'
		},
		{
			output: 'ui-docs.js',
			src: [...BASE, '../ui/dist/theme-legacy.js'],
			minify: 'ui-docs-legacy.min.js'
		},
		{
			output: 'ui-docs-react.js',
			src: [
				'../ui/dist/index.js',
				'../ui/dist/icons.js',
				'../ui/dist/router.js',
				'../ui-react/index.js'
			],
			minify: 'ui-docs-react.min.js'
		},
		{
			output: 'index.html',
			src: [() => INDEX('ui-docs.min.js')]
		},
		{
			output: 'theme-legacy.html',
			src: [() => INDEX('ui-docs-legacy.min.js')]
		},
		{
			output: 'react.html',
			src: ['src/react.html']
		}
	]
});
*/
