import { spec } from '@cxl/spec';
import {
	boxShadow,
	pct,
	rgba,
	defaultTheme,
	border,
	padding,
	margin,
	buildTheme,
} from './index.js';

declare module './index.js' {
	interface Variables {
		camelCase: string;
	}
	interface Animation {
		test: AnimationDefinition;
	}
}

const { applyTheme, css, style, render } = buildTheme(defaultTheme);

export default spec('css', s => {
	s.test('style', it => {
		it.should('return string representation of css style', a => {
			a.equal(style({ borderWidth: 1 }), 'border-width:1px;');
			a.equal(
				style({ borderWidth: 0, alignItems: 'center' }),
				'border-width:0px;align-items:center;'
			);
			a.equal(style({ opacity: 0.3 }), 'opacity:0.3;');
		});

		it.should('work with boxShadow helper function', a => {
			a.equal(
				style({ boxShadow: boxShadow(0, 1, 2, 3, 'transparent') }),
				'box-shadow:0px 1px 2px 3px transparent;'
			);
		});

		it.should('work with pct helper function', a => {
			a.equal(style({ width: pct(10) }), 'width:10%;');
		});

		it.should('render transform: translate', a => {
			a.equal(
				style({ translateX: 10 }),
				'transform:translate(10px,0px);'
			);
			a.equal(style({ translateY: 0 }), 'transform:translate(0px,0px);');
			a.equal(style({ translateZ: 1 }), 'transform:translateZ(1px);');
		});

		it.should('render transform: scale', a => {
			a.equal(style({ scaleX: 1 }), 'transform:scale(1,1);');
			a.equal(style({ scaleY: 1 }), 'transform:scale(1,1);');
			a.equal(style({ scaleX: 2, scaleY: 1 }), 'transform:scale(2,1);');
			a.equal(style({ scaleX: 0, scaleY: 1 }), 'transform:scale(0,1);');
			a.equal(style({ scaleX: 0, scaleY: 0 }), 'transform:scale(0,0);');
		});

		it.should('render transform: rotate', a => {
			a.equal(style({ rotate: 1 }), 'transform:rotate(1deg);');
			a.equal(style({ rotate: 0 }), 'transform:rotate(0deg);');
		});

		it.should('render elevation', a => {
			a.equal(
				style({ elevation: 1 }),
				'z-index:1;box-shadow:1px 1px 5px var(--cxl-shadow);'
			);
			a.equal(style({ elevation: 0 }), 'z-index:0;box-shadow:none;');
		});

		it.should('render animation', a => {
			defaultTheme.animation.test = { keyframes: '', value: 'value' };
			a.equal(style({ animation: 'test' }), 'animation:value;');
			a.equal(style({ animation: 'none' }), 'animation:none;');
		});

		it.should('render variables', a => {
			a.equal(
				style({ variables: { camelCase: '16px' } }),
				'--cxl-camel-case:16px;'
			);
		});
	});

	s.test('css', it => {
		it.should('create a style factory function', a => {
			const fn = css({});
			const el = fn();
			a.equal(el.tagName, 'STYLE');
		});
	});

	s.test('helper functions', it => {
		it.should('support helper functions', a => {
			a.equal(
				style({
					...border(0),
					...padding(0),
					...margin(0),
				}),
				'border-top:0px;border-right:0px;border-bottom:0px;border-left:0px;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px;margin-top:0px;margin-right:0px;margin-bottom:0px;margin-left:0px;'
			);
			a.equal(
				style({
					...border(1, 2, 3, 4),
					...padding(5, 6, 7, 8),
					...margin(9, 10, 11, 12),
				}),
				'border-top:1px;border-right:2px;border-bottom:3px;border-left:4px;padding-top:5px;padding-right:6px;padding-bottom:7px;padding-left:8px;margin-top:9px;margin-right:10px;margin-bottom:11px;margin-left:12px;'
			);
		});
	});

	s.test('rgba', it => {
		it.should('render color', a => {
			a.equal(rgba(0, 0, 0, 0).toString(), 'rgba(0,0,0,0)');
			a.equal(rgba(1, 2, 3).toString(), 'rgba(1,2,3,1)');
		});
		it.should('enforce color bounds', a => {
			const A = rgba(500, 600, 700, 5);
			a.equal(A.r, 255);
			a.equal(A.g, 255);
			a.equal(A.b, 255);
			a.equal(A.a, 1);
			const B = rgba(-500, -600, -700, -5);
			a.equal(B.r, 0);
			a.equal(B.g, 0);
			a.equal(B.b, 0);
			a.equal(B.a, 0);
		});
	});

	s.test('render', it => {
		it.should('define css classes', a => {
			a.equal(
				render({
					small: { color: 'transparent' },
					dir$disabled: { opacity: 0.5 },
				}),
				':host .small{color:transparent;}:host([disabled]) .dir{opacity:0.5;}'
			);
		});

		it.should('render media queries', a => {
			a.equal(
				render({
					'@small': {
						$: { color: 'transparent' },
					},
				}),
				'@media(min-width:600px){:host{color:transparent;}}'
			);
		});
		it.should('support special rules', a => {
			a.equal(
				render({
					$: { color: 'transparent' },
					'*': { opacity: 0 },
					'@a': { textDecoration: 'none' },
				}),
				':host{color:transparent;}:host,:host *{opacity:0;}a{text-decoration:none;}'
			);
		});
		it.should('support combined attribute selectors', a => {
			a.equal(
				render({
					$invalid$touched: { color: rgba(0, 0, 0) },
				}),
				':host([invalid][touched]){color:rgba(0,0,0,1);}'
			);
		});
		it.should('support scrollbar styles', a => {
			a.equal(
				render({
					'$::scrollbar': { color: 'transparent' },
				}),
				':host::-webkit-scrollbar{color:transparent;}'
			);
			a.equal(
				render({
					'body::scrollbar': { color: 'transparent' },
				}),
				':host .body::scrollbar{color:transparent;}'
			);
		});
	});

	s.test('applyTheme', it => {
		it.should('render and append style elements', a => {
			const children: any[] = [];
			const el = { appendChild: (a: any) => children.push(a) };
			applyTheme(el as any);
			a.equal(children.length, 1);
		});
	});
});
