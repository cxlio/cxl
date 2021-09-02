import {
	Augment,
	Attribute,
	Component,
	get,
	attributeChanged,
} from '@cxl/component';
// import { css } from '@cxl/css';
import { dom } from '@cxl/tsx';
import type * as cm from 'codemirror';
import type * as _cm from 'codemirror/addon/fold/foldgutter.js';
import type * as _cm2 from 'codemirror/addon/selection/active-line.js';
import type * as _cm3 from 'codemirror/addon/edit/closetag.js';
import type * as _cm4 from 'codemirror/addon/edit/closebrackets.js';
import type * as _cm5 from 'codemirror/addon/edit/matchtags.js';
import type * as _cm6 from 'codemirror/addon/edit/matchbrackets.js';
import { Observable, of, from, merge } from '@cxl/rx';
import { getShadow, onResize, trigger } from '@cxl/dom';

type CodeMirrorType = typeof import('codemirror');

declare global {
	interface Window {
		CodeMirror?: CodeMirrorType;
	}
}

export interface CursorFeature {
	go(row: number, column?: number): void;
}

export interface Editor {
	cursor?: CursorFeature;
}

const DefaultOptions: cm.EditorConfiguration = {
	tabSize: 4,
	lineWrapping: true,
	lineNumbers: true,
	electricChars: false,
	styleActiveLine: true,
	autoCloseTags: true,
	autoCloseBrackets: true,
	matchTags: true,
	matchBrackets: true,
	foldGutter: true,
	indentUnit: 4,
	lineSeparator: '\n',
	smartIndent: false,
	indentWithTabs: true,
	gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
};

/**
 * Check for CodeMirror variable in window, or manually import it
 */
function getCodeMirror(cdn: string): Observable<CodeMirrorType> {
	return window.CodeMirror ? of(window.CodeMirror) : from(import(cdn));
}

@Augment<SourceEditor>('ide-source', $ => {
	$.bind(
		getCodeMirror($.cdn).switchMap(cm => {
			const editor = cm(getShadow($), DefaultOptions);
			editor.setSize('100%', '100%');
			editor.scrollIntoView({ line: 0, ch: 0 });
			editor.on('change', () => ($.value = editor.getValue()));
			return merge(
				onResize($).tap(() => editor.refresh()),
				get($, 'options').tap(options => {
					for (const op in options)
						editor.setOption(op as any, (options as any)[op]);
				}),
				get($, 'value').tap(value => {
					if (value !== editor.getValue()) editor.setValue(value);
				}),
				get($, 'mode').tap(mode => editor.setOption('mode', mode)),
				attributeChanged($, 'value').tap(() => trigger($, 'change'))
			);
		})
	);

	return (
		<>
			<style>{`.CodeMirror{font-family:monospace;height:300px;color:#000;direction:ltr}.CodeMirror-lines{padding:4px 0}.CodeMirror pre.CodeMirror-line,.CodeMirror pre.CodeMirror-line-like{padding:0 4px}.CodeMirror-gutter-filler,.CodeMirror-scrollbar-filler{background-color:#fff}.CodeMirror-gutters{border-right:1px solid #ddd;background-color:#f7f7f7;white-space:nowrap}.CodeMirror-linenumber{padding:0 3px 0 5px;min-width:20px;text-align:right;color:#999;white-space:nowrap}.CodeMirror-guttermarker{color:#000}.CodeMirror-guttermarker-subtle{color:#999}.CodeMirror-cursor{border-left:1px solid #000;border-right:none;width:0}.CodeMirror div.CodeMirror-secondarycursor{border-left:1px solid silver}.cm-fat-cursor .CodeMirror-cursor{width:auto;border:0!important;background:#7e7}.cm-fat-cursor div.CodeMirror-cursors{z-index:1}.cm-fat-cursor-mark{background-color:rgba(20,255,20,.5);-webkit-animation:blink 1.06s steps(1) infinite;-moz-animation:blink 1.06s steps(1) infinite;animation:blink 1.06s steps(1) infinite}.cm-animate-fat-cursor{width:auto;border:0;-webkit-animation:blink 1.06s steps(1) infinite;-moz-animation:blink 1.06s steps(1) infinite;animation:blink 1.06s steps(1) infinite;background-color:#7e7}@-moz-keyframes blink{50%{background-color:transparent}}@-webkit-keyframes blink{50%{background-color:transparent}}@keyframes blink{50%{background-color:transparent}}.cm-tab{display:inline-block;text-decoration:inherit}.CodeMirror-rulers{position:absolute;left:0;right:0;top:-50px;bottom:0;overflow:hidden}.CodeMirror-ruler{border-left:1px solid #ccc;top:0;bottom:0;position:absolute}.cm-s-default .cm-header{color:#00f}.cm-s-default .cm-quote{color:#090}.cm-negative{color:#d44}.cm-positive{color:#292}.cm-header,.cm-strong{font-weight:700}.cm-em{font-style:italic}.cm-link{text-decoration:underline}.cm-strikethrough{text-decoration:line-through}.cm-s-default .cm-keyword{color:#708}.cm-s-default .cm-atom{color:#219}.cm-s-default .cm-number{color:#164}.cm-s-default .cm-def{color:#00f}.cm-s-default .cm-variable-2{color:#05a}.cm-s-default .cm-type,.cm-s-default .cm-variable-3{color:#085}.cm-s-default .cm-comment{color:#a50}.cm-s-default .cm-string{color:#a11}.cm-s-default .cm-string-2{color:#f50}.cm-s-default .cm-meta{color:#555}.cm-s-default .cm-qualifier{color:#555}.cm-s-default .cm-builtin{color:#30a}.cm-s-default .cm-bracket{color:#997}.cm-s-default .cm-tag{color:#170}.cm-s-default .cm-attribute{color:#00c}.cm-s-default .cm-hr{color:#999}.cm-s-default .cm-link{color:#00c}.cm-s-default .cm-error{color:red}.cm-invalidchar{color:red}.CodeMirror-composing{border-bottom:2px solid}div.CodeMirror span.CodeMirror-matchingbracket{color:#0b0}div.CodeMirror span.CodeMirror-nonmatchingbracket{color:#a22}.CodeMirror-matchingtag{background:rgba(255,150,0,.3)}.CodeMirror-activeline-background{background:#e8f2ff}.CodeMirror{position:relative;overflow:hidden;background:#fff}.CodeMirror-scroll{overflow:scroll!important;margin-bottom:-50px;margin-right:-50px;padding-bottom:50px;height:100%;outline:0;position:relative}.CodeMirror-sizer{position:relative;border-right:50px solid transparent}.CodeMirror-gutter-filler,.CodeMirror-hscrollbar,.CodeMirror-scrollbar-filler,.CodeMirror-vscrollbar{position:absolute;z-index:6;display:none;outline:0}.CodeMirror-vscrollbar{pointer-events:auto !important;right:0;top:0;overflow-x:hidden;overflow-y:scroll}.CodeMirror-hscrollbar{bottom:0;left:0;overflow-y:hidden;overflow-x:scroll}.CodeMirror-scrollbar-filler{right:0;bottom:0}.CodeMirror-gutter-filler{left:0;bottom:0}.CodeMirror-gutters{position:absolute;left:0;top:0;min-height:100%;z-index:3}.CodeMirror-gutter{white-space:normal;height:100%;display:inline-block;vertical-align:top;margin-bottom:-50px}.CodeMirror-gutter-wrapper{position:absolute;z-index:4;background:0 0!important;border:none!important}.CodeMirror-gutter-background{position:absolute;top:0;bottom:0;z-index:4}.CodeMirror-gutter-elt{position:absolute;cursor:default;z-index:4}.CodeMirror-gutter-wrapper ::selection{background-color:transparent}.CodeMirror-gutter-wrapper ::-moz-selection{background-color:transparent}.CodeMirror-lines{cursor:text;min-height:1px}.CodeMirror pre.CodeMirror-line,.CodeMirror pre.CodeMirror-line-like{-moz-border-radius:0;-webkit-border-radius:0;border-radius:0;border-width:0;background:0 0;font-family:inherit;font-size:inherit;margin:0;white-space:pre;word-wrap:normal;line-height:inherit;color:inherit;z-index:2;position:relative;overflow:visible;-webkit-tap-highlight-color:transparent;-webkit-font-variant-ligatures:contextual;font-variant-ligatures:contextual}.CodeMirror-wrap pre.CodeMirror-line,.CodeMirror-wrap pre.CodeMirror-line-like{word-wrap:break-word;white-space:pre-wrap;word-break:normal}.CodeMirror-linebackground{position:absolute;left:0;right:0;top:0;bottom:0;z-index:0}.CodeMirror-linewidget{position:relative;z-index:2;padding:.1px}.CodeMirror-rtl pre{direction:rtl}.CodeMirror-code{outline:0}.CodeMirror-gutter,.CodeMirror-gutters,.CodeMirror-linenumber,.CodeMirror-scroll,.CodeMirror-sizer{-moz-box-sizing:content-box;box-sizing:content-box}.CodeMirror-measure{position:absolute;width:100%;height:0;overflow:hidden;visibility:hidden}.CodeMirror-cursor{position:absolute;pointer-events:none}.CodeMirror-measure pre{position:static}div.CodeMirror-cursors{visibility:hidden;position:relative;z-index:3}div.CodeMirror-dragcursors{visibility:visible}.CodeMirror-focused div.CodeMirror-cursors{visibility:visible}.CodeMirror-selected{background:#d9d9d9}.CodeMirror-focused .CodeMirror-selected{background:#d7d4f0}.CodeMirror-crosshair{cursor:crosshair}.CodeMirror-line::selection,.CodeMirror-line>span::selection,.CodeMirror-line>span>span::selection{background:#d7d4f0}.CodeMirror-line::-moz-selection,.CodeMirror-line>span::-moz-selection,.CodeMirror-line>span>span::-moz-selection{background:#d7d4f0}.cm-searching{background-color:#ffa;background-color:rgba(255,255,0,.4)}.cm-force-border{padding-right:.1px}@media print{.CodeMirror div.CodeMirror-cursors{visibility:hidden}}.cm-tab-wrap-hack:after{content:''}span.CodeMirror-selectedtext{background:0 0}.CodeMirror-foldmarker{color:#00f;text-shadow:#b9f 1px 1px 2px,#b9f -1px -1px 2px,#b9f 1px -1px 2px,#b9f -1px 1px 2px;font-family:arial;line-height:.3;cursor:pointer}.CodeMirror-foldgutter{width:.7em}.CodeMirror-foldgutter-folded,.CodeMirror-foldgutter-open{cursor:pointer}.CodeMirror-foldgutter-open:after{content:"\\25BE"}.CodeMirror-foldgutter-folded:after{content:"\\25B8"}`}</style>
		</>
	);
})
export class SourceEditor extends Component implements CursorFeature {
	@Attribute()
	options?: cm.EditorConfiguration;

	@Attribute()
	value = '';

	@Attribute()
	mode = 'auto';

	/** Path to codemirror import base path*/
	cdn = 'codemirror';

	protected cm?: cm.Editor;

	go(line: number, ch?: number) {
		this.cm?.setCursor(line, ch);
	}

	focus() {
		this.cm?.focus();
	}
}
