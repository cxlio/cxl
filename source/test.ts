import { spec, TestApi } from '@cxl/spec';
import { getSourceMap, positionToIndex } from './index.js';

export default spec('source', a => {
	a.test('getSourceMap', async (a: TestApi) => {
		const index_js = `"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./core.js"), exports);
__exportStar(require("./theme.js"), exports);
__exportStar(require("./dialog.js"), exports);
__exportStar(require("./form.js"), exports);
__exportStar(require("./layout.js"), exports);
__exportStar(require("./navigation.js"), exports);
__exportStar(require("./input-base.js"), exports);
//# sourceMappingURL=index.js.map`;
		const index_tsx = `export * from './core.js';
export * from './theme.js';
export * from './dialog.js';
export * from './form.js';
export * from './layout.js';
export * from './navigation.js';
export * from './input-base.js';`;

		const sm = await getSourceMap('../../source/test/index.js');
		a.assert(sm);
		const range = sm.translateRange(index_js, { start: 368, end: 954 });
		a.assert(range);
		a.equal(range.start.column, 0);
		a.equal(range.start.line, 0);
		const startOffset = positionToIndex(index_tsx, range.start);
		const endOffset = positionToIndex(index_tsx, range.end);
		a.equal(index_tsx.slice(startOffset, endOffset), index_tsx);
	});
});
