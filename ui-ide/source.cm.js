// Ugly hack required for bundle
const CodeMirror = module.exports,
	define = undefined;
exports = undefined;
if (require.modules) require.modules['codemirror'] = CodeMirror;
