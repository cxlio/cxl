import { TestApi, spec } from '@cxl/spec';
import { globToRegex } from './index.js';

export default spec('glob', s => {
	function isMatch(a: TestApi, term: string, glob: string | string[]) {
		const regex = globToRegex(glob);
		a.ok(
			regex.test(term),
			`"${term}" should match glob ${JSON.stringify(glob)} (${
				regex.source
			})`
		);
	}
	function isNotMatch(a: TestApi, term: string, glob: string | string[]) {
		const regex = globToRegex(glob);
		a.ok(
			!regex.test(term),
			`"${term}" should not match glob ${JSON.stringify(glob)} (${
				regex.source
			})`
		);
	}

	s.test('should return true when any of the patterns match', a => {
		isMatch(a, '.', ['.', 'foo']);
		isMatch(a, 'a', ['a', 'foo']);
		isMatch(a, 'ab', ['*', 'foo', 'bar']);
		isMatch(a, 'ab', ['*b', 'foo', 'bar']);
		isMatch(a, 'ab', ['./*', 'foo', 'bar']);
		isMatch(a, 'ab', ['a*', 'foo', 'bar']);
		isMatch(a, 'ab', ['ab', 'foo']);

		isNotMatch(a, '/ab', ['/a', 'foo']);
		isNotMatch(a, '/ab', ['?/?', 'foo', 'bar']);
		isNotMatch(a, '/ab', ['a/*', 'foo', 'bar']);
		isNotMatch(a, 'a/b/c', ['a/b', 'foo']);
		isNotMatch(a, 'ab', ['*/*', 'foo', 'bar']);
		isNotMatch(a, 'ab', ['/a', 'foo', 'bar']);
		isNotMatch(a, 'ab', ['a', 'foo']);
		isNotMatch(a, 'ab', ['b', 'foo']);
		isNotMatch(a, 'ab', ['c', 'foo', 'bar']);
		isNotMatch(a, 'abcd', ['ab', 'foo']);
		isNotMatch(a, 'abcd', ['bc', 'foo']);
		isNotMatch(a, 'abcd', ['c', 'foo']);
		isNotMatch(a, 'abcd', ['cd', 'foo']);
		isNotMatch(a, 'abcd', ['d', 'foo']);
		isNotMatch(a, 'abcd', ['f', 'foo', 'bar']);
		isNotMatch(a, 'ef', ['/*', 'foo', 'bar']);
	});

	s.test('File extensions', a => {
		isNotMatch(a, '.c.md', '*.md');
		isNotMatch(a, '.c.md', '.c.');
		isNotMatch(a, '.c.md', '.md');
		isNotMatch(a, '.md', '*.md');
		isNotMatch(a, '.md', '.m');
		isNotMatch(a, 'a/b/c.md', '*.md');
		isNotMatch(a, 'a/b/c.md', '.md');
		isNotMatch(a, 'a/b/c.md', 'a/*.md');
		isNotMatch(a, 'a/b/c/c.md', '*.md');
		isNotMatch(a, 'a/b/c/c.md', 'c.js');
		isMatch(a, '.c.md', '.*.md');
		isMatch(a, '.md', '.md');
		isMatch(a, 'a/b/c.js', 'a/**/*.*');
		isMatch(a, 'a/b/c.md', '**/*.md');
		isMatch(a, 'a/b/c.md', 'a/*/*.md');
		isMatch(a, 'c.md', '*.md');
	});

	s.test('File names', a => {
		isMatch(a, 'a.b', 'a.b');
		isMatch(a, 'a.b', '*.b');
		isMatch(a, 'a.b', 'a.*');
		isMatch(a, 'a.b', '*.*');
		isMatch(a, 'a-b.c-d', 'a*.c*');
		isMatch(a, 'a-b.c-d', '*b.*d');
		isMatch(a, 'a-b.c-d', '*.*');
		isMatch(a, 'a-b.c-d', '*.*-*');
		isMatch(a, 'a-b.c-d', '*-*.*-*');
		isMatch(a, 'a-b.c-d', '*.c-*');
		isMatch(a, 'a-b.c-d', '*.*-d');
		isMatch(a, 'a-b.c-d', 'a-*.*-d');
		isMatch(a, 'a-b.c-d', '*-b.c-*');
		isMatch(a, 'a-b.c-d', '*-b*c-*');
		isNotMatch(a, 'a-b.c-d', '*-bc-*');
	});

	s.test('Common glob patterns', a => {
		isNotMatch(a, '/ab', './*/');
		isNotMatch(a, '/ef', '*');
		isNotMatch(a, 'ab', './*/');
		isNotMatch(a, 'ef', '/*');
		isMatch(a, '/ab', '/*');
		isMatch(a, '/cd', '/*');
		isMatch(a, 'ab', '*');
		isMatch(a, 'ab', './*');
		isMatch(a, 'ab', 'ab');
		isMatch(a, 'ab/', './*/');
		isNotMatch(a, 'zzjs', 'z*.js');
		isNotMatch(a, 'zzjs', '*z.js');
	});

	s.test('Non glob patterns', a => {
		// Non-glob patterns
		isMatch(a, '.', '.');
		isMatch(a, '/a', '/a');
		isNotMatch(a, '/ab', '/a');
		isMatch(a, 'a', 'a');
		isNotMatch(a, 'ab', '/a');
		isNotMatch(a, 'ab', 'a');
		isMatch(a, 'ab', 'ab');
		isNotMatch(a, 'abcd', 'cd');
		isNotMatch(a, 'abcd', 'bc');
		isNotMatch(a, 'abcd', 'ab');
	});

	s.test('should match globstars', a => {
		isMatch(a, 'a/b/c/z.js', '**/*.js');
		isMatch(a, 'a/b/z.js', '**/*.js');
		isMatch(a, 'a/z.js', '**/*.js');
		isMatch(a, 'a/b/c/d/e/z.js', 'a/b/**/*.js');
		isMatch(a, 'a/b/c/d/z.js', 'a/b/**/*.js');
		isMatch(a, 'a/b/c/z.js', 'a/b/c/**/*.js');
		isMatch(a, 'a/b/c/z.js', 'a/b/c**/*.js');
		isMatch(a, 'a/b/c/z.js', 'a/b/**/*.js');
		isMatch(a, 'a/b/z.js', 'a/b/**/*.js');

		isNotMatch(a, 'a/z.js', 'a/b/**/*.js');
		isNotMatch(a, 'z.js', 'a/b/**/*.js');

		// https://github.com/micromatch/micromatch/issues/15
		isMatch(a, 'z.js', 'z*');
		isMatch(a, 'z.js', '**/z*');
		isMatch(a, 'z.js', '**/z*.js');
		isMatch(a, 'z.js', '**/*.js');
		isMatch(a, 'foo', '**/foo');
	});
	s.test('dot files', a => {
		a.test(
			'should not match dotfiles when a leading dot is not defined in a path segment',
			a => {
				isNotMatch(a, '.a', '(a)*');
				isNotMatch(a, '.a', '*(a|b)');
				isNotMatch(a, '.a', '*.md');
				isNotMatch(a, '.a', '*[a]');
				isNotMatch(a, '.a', '*[a]*');
				isNotMatch(a, '.a', '*a');
				isNotMatch(a, '.a', '*a*');
				isNotMatch(a, '.a.md', 'a/b/c/*.md');
				isNotMatch(a, '.ab', '*.*');
				isNotMatch(a, '.abc', '.a');
				isNotMatch(a, '.ba', '.a');
				isNotMatch(a, '.c.md', '*.md');
				isNotMatch(a, '.md', 'a/b/c/*.md');
				isNotMatch(a, '.txt', '.md');
				isNotMatch(a, '.verb.txt', '*.md');
				isNotMatch(a, 'a/.c.md', '*.md');
				isNotMatch(a, 'a/b/d/.md', 'a/b/c/*.md');
				isMatch(a, '.a', '.a');
				isMatch(a, '.ab', '.*');
				isMatch(a, '.ab', '.a*');
				isMatch(a, '.b', '.b*');
				isMatch(a, '.md', '.md');
				isMatch(a, 'a/.c.md', 'a/.c.md');
				isMatch(a, 'a/b/c/.xyz.md', 'a/b/c/.*.md');
				isMatch(a, 'a/b/c/d.a.md', 'a/b/c/*.md');
			}
		);
	});
	s.test('should match zero or more directories', a => {
		isNotMatch(a, 'a/b/c/d/', 'a/b/**/f');
		isMatch(a, 'a', 'a/**');
		isMatch(a, 'a', '**');
		isMatch(a, 'a/', '**');
		isMatch(a, 'a/b-c/d/e/z.js', 'a/b-*/**/z.js');
		isMatch(a, 'a/b-c/z.js', 'a/b-*/**/z.js');
		isMatch(a, 'a/b/c/d', '**');
		isMatch(a, 'a/b/c/d/', '**');
		isMatch(a, 'a/b/c/d/', '**/**');
		isMatch(a, 'a/b/c/d/', '**/b/**');
		isMatch(a, 'a/b/c/d/', 'a/b/**');
		isMatch(a, 'a/b/c/d/', 'a/b/**/');
		isMatch(a, 'a/b/c/d/', 'a/b/**/c/**/');
		isMatch(a, 'a/b/c/d/', 'a/b/**/c/**/d/');
		isMatch(a, 'a/b/c/d/e.f', 'a/b/**/**/*.*');
		isMatch(a, 'a/b/c/d/e.f', 'a/b/**/*.*');
		isMatch(a, 'a/b/c/d/e.f', 'a/b/**/c/**/d/*.*');
		isMatch(a, 'a/b/c/d/e.f', 'a/b/**/d/**/*.*');
		isMatch(a, 'a/b/c/d/g/e.f', 'a/b/**/d/**/*.*');
		isMatch(a, 'a/b/c/d/g/g/e.f', 'a/b/**/d/**/*.*');
	});

	s.test('should match slashes', a => {
		isNotMatch(a, 'bar/baz/foo', '*/foo');
		isNotMatch(a, 'deep/foo/bar', '**/bar/*');
		isNotMatch(a, 'deep/foo/bar/baz/x', '*/bar/**');
		isNotMatch(a, 'foo/bar', 'foo?bar');
		isNotMatch(a, 'foo/bar/baz', '**/bar*');
		isNotMatch(a, 'foo/bar/baz', '**/bar**');
		isNotMatch(a, 'foo/baz/bar', 'foo**bar');
		isNotMatch(a, 'foo/baz/bar', 'foo*bar');
		isNotMatch(a, 'deep/foo/bar/baz', '**/bar/*/');
		//assert(
		//	!isMatch('deep/foo/bar/baz/', '**/ bar; /*', { strictSlashes: true })
		//);
		isMatch(a, 'deep/foo/bar/baz/', '**/bar/*');
		isMatch(a, 'deep/foo/bar/baz', '**/bar/*');
		isMatch(a, 'foo', 'foo/**');
		isMatch(a, 'deep/foo/bar/baz/', '**/bar/*{,/}');
		isMatch(a, 'a/b/j/c/z/x.md', 'a/**/j/**/z/*.md');
		isMatch(a, 'a/j/z/x.md', 'a/**/j/**/z/*.md');
		isMatch(a, 'bar/baz/foo', '**/foo');
		isMatch(a, 'deep/foo/bar/', '**/bar/**');
		isMatch(a, 'deep/foo/bar/baz', '**/bar/*');
		isMatch(a, 'deep/foo/bar/baz/', '**/bar/*/');
		isMatch(a, 'deep/foo/bar/baz/', '**/bar/**');
		isMatch(a, 'deep/foo/bar/baz/x', '**/bar/*/*');
		isMatch(a, 'foo/b/a/z/bar', 'foo/**/**/bar');
		isMatch(a, 'foo/b/a/z/bar', 'foo/**/bar');
		isMatch(a, 'foo/bar', 'foo/**/**/bar');
		isMatch(a, 'foo/bar', 'foo/**/bar');
		isMatch(a, 'foo/bar', 'foo[/]bar');
		isMatch(a, 'foo/bar/baz/x', '*/bar/**');
		isMatch(a, 'foo/baz/bar', 'foo/**/**/bar');
		isMatch(a, 'foo/baz/bar', 'foo/**/bar');
		isMatch(a, 'foobazbar', 'foo**bar');
		isMatch(a, 'XXX/foo', '**/foo');

		isMatch(a, 'foo//baz.md', 'foo//baz.md');
		isMatch(a, 'foo//baz.md', 'foo//*baz.md');
		isMatch(a, 'foo//baz.md', 'foo{/,//}baz.md');
		isMatch(a, 'foo/baz.md', 'foo{/,//}baz.md');
		isNotMatch(a, 'foo//baz.md', 'foo/+baz.md');
		isNotMatch(a, 'foo//baz.md', 'foo//+baz.md');
		isNotMatch(a, 'foo//baz.md', 'foo/baz.md');
		isNotMatch(a, 'foo/baz.md', 'foo//baz.md');

		isNotMatch(a, 'aaa/bbb', 'aaa?bbb');
	});

	s.test('braces', a => {
		a.test('should treat single-set braces as literals', a => {
			isMatch(a, 'a {abc} b', 'a {abc} b');
			isMatch(a, 'a {a-b-c} b', 'a {a-b-c} b');
			isMatch(a, 'a {a.c} b', 'a {a.c} b');
		});

		a.test('should match literal braces when escaped', a => {
			isMatch(a, 'a {1,2}', 'a \\{1,2\\}');
			isMatch(a, 'a {a..b}', 'a \\{a..b\\}');
		});

		a.test('should match using brace patterns', a => {
			isNotMatch(a, 'a/c', 'a/{a,b}');
			isNotMatch(a, 'b/b', 'a/{a,b,c}');
			isNotMatch(a, 'b/b', 'a/{a,b}');
			isMatch(a, 'a/a', 'a/{a,b}');
			isMatch(a, 'a/b', 'a/{a,b}');
			isMatch(a, 'a/c', 'a/{a,b,c}');
		});

		a.test('should support brace ranges', a => {
			isMatch(a, 'a/a', 'a/{a..c}');
			isMatch(a, 'a/b', 'a/{a..c}');
			isMatch(a, 'a/c', 'a/{a..c}');
		});

		a.test('should support Kleene stars', a => {
			isMatch(a, 'ab', '{ab,c}*');
			isMatch(a, 'abab', '{ab,c}*');
			isMatch(a, 'abc', '{ab,c}*');
			isMatch(a, 'c', '{ab,c}*');
			isMatch(a, 'cab', '{ab,c}*');
			isMatch(a, 'cc', '{ab,c}*');
			isMatch(a, 'ababab', '{ab,c}*');
			isMatch(a, 'ababc', '{ab,c}*');
			isMatch(a, 'abcab', '{ab,c}*');
			isMatch(a, 'abcc', '{ab,c}*');
			isMatch(a, 'cabab', '{ab,c}*');
			isMatch(a, 'cabc', '{ab,c}*');
			isMatch(a, 'ccab', '{ab,c}*');
			isMatch(a, 'ccc', '{ab,c}*');
		});

		a.test('should not convert braces inside brackets', a => {
			isMatch(a, 'foo{}baz', 'foo[{a,b}]+baz');
			isMatch(a, '{a}{b}{c}', '[abc{}]+');
		});

		a.test('should support braces containing slashes', a => {
			isMatch(a, 'a', '{/,}a/**');
			isMatch(a, 'aa.txt', 'a{a,b/}*.txt');
			isMatch(a, 'ab/.txt', 'a{a,b/}*.txt');
			isMatch(a, 'ab/a.txt', 'a{a,b/}*.txt');
			isMatch(a, 'a/', 'a/**{/,}');
			isMatch(a, 'a/a', 'a/**{/,}');
			isMatch(a, 'a/a/', 'a/**{/,}');
		});

		a.test('should support braces with empty elements', a => {
			isNotMatch(a, 'abc.txt', 'a{,b}.txt');
			isNotMatch(a, 'abc.txt', 'a{a,b,}.txt');
			isNotMatch(a, 'abc.txt', 'a{b,}.txt');
			isMatch(a, 'a.txt', 'a{,b}.txt');
			isMatch(a, 'a.txt', 'a{b,}.txt');
			isMatch(a, 'aa.txt', 'a{a,b,}.txt');
			isMatch(a, 'aa.txt', 'a{a,b,}.txt');
			isMatch(a, 'ab.txt', 'a{,b}.txt');
			isMatch(a, 'ab.txt', 'a{b,}.txt');
		});

		a.test('should support braces with slashes and empty elements', a => {
			isMatch(a, 'a.txt', 'a{,/}*.txt');
			isMatch(a, 'ab.txt', 'a{,/}*.txt');
			isMatch(a, 'a/b.txt', 'a{,/}*.txt');
			isMatch(a, 'a/ab.txt', 'a{,/}*.txt');
		});

		a.test('should support braces with stars', a => {
			isMatch(a, 'a.txt', 'a{,.*{foo,db},\\(bar\\)}.txt');
			isNotMatch(a, 'adb.txt', 'a{,.*{foo,db},\\(bar\\)}.txt');
			isMatch(a, 'a.db.txt', 'a{,.*{foo,db},\\(bar\\)}.txt');

			isMatch(a, 'a.txt', 'a{,*.{foo,db},\\(bar\\)}.txt');
			isNotMatch(a, 'adb.txt', 'a{,*.{foo,db},\\(bar\\)}.txt');
			isMatch(a, 'a.db.txt', 'a{,*.{foo,db},\\(bar\\)}.txt');

			isMatch(a, 'a', 'a{,.*{foo,db},\\(bar\\)}');
			isNotMatch(a, 'adb', 'a{,.*{foo,db},\\(bar\\)}');
			isMatch(a, 'a.db', 'a{,.*{foo,db},\\(bar\\)}');

			isMatch(a, 'a', 'a{,*.{foo,db},\\(bar\\)}');
			isNotMatch(a, 'adb', 'a{,*.{foo,db},\\(bar\\)}');
			isMatch(a, 'a.db', 'a{,*.{foo,db},\\(bar\\)}');

			isNotMatch(a, 'a', '{,.*{foo,db},\\(bar\\)}');
			isNotMatch(a, 'adb', '{,.*{foo,db},\\(bar\\)}');
			isNotMatch(a, 'a.db', '{,.*{foo,db},\\(bar\\)}');
			isMatch(a, '.db', '{,.*{foo,db},\\(bar\\)}');

			isNotMatch(a, 'a', '{,*.{foo,db},\\(bar\\)}');
			isMatch(a, 'a', '{*,*.{foo,db},\\(bar\\)}');
			isNotMatch(a, 'adb', '{,*.{foo,db},\\(bar\\)}');
			isMatch(a, 'a.db', '{,*.{foo,db},\\(bar\\)}');
		});

		a.test('should support braces in patterns with globstars', a => {
			isNotMatch(a, 'a/b/c/xyz.md', 'a/b/**/c{d,e}/**/xyz.md');
			isNotMatch(a, 'a/b/d/xyz.md', 'a/b/**/c{d,e}/**/xyz.md');
			isMatch(a, 'a/b/cd/xyz.md', 'a/b/**/c{d,e}/**/xyz.md');
			isMatch(a, 'a/b/c/xyz.md', 'a/b/**/{c,d,e}/**/xyz.md');
			isMatch(a, 'a/b/d/xyz.md', 'a/b/**/{c,d,e}/**/xyz.md');
		});

		a.test(
			'should support braces with globstars, slashes and empty elements',
			a => {
				isMatch(a, 'a.txt', 'a{,/**/}*.txt');
				isMatch(a, 'a/b.txt', 'a{,/**/,/}*.txt');
				isMatch(a, 'a/x/y.txt', 'a{,/**/}*.txt');
				isNotMatch(a, 'a/x/y/z', 'a{,/**/}*.txt');
			}
		);

		a.test('should support braces with globstars and empty elements', a => {
			isMatch(a, 'a/b/foo/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*');
			isMatch(a, 'a/b/bar/baz.qux', 'a/b{,/**}/bar{,/**}/*.*');
		});

		a.test('should support Kleene plus', a => {
			isMatch(a, 'ab', '{ab,c}+');
			isMatch(a, 'abab', '{ab,c}+');
			isMatch(a, 'abc', '{ab,c}+');
			isMatch(a, 'c', '{ab,c}+');
			isMatch(a, 'cab', '{ab,c}+');
			isMatch(a, 'cc', '{ab,c}+');
			isMatch(a, 'ababab', '{ab,c}+');
			isMatch(a, 'ababc', '{ab,c}+');
			isMatch(a, 'abcab', '{ab,c}+');
			isMatch(a, 'abcc', '{ab,c}+');
			isMatch(a, 'cabab', '{ab,c}+');
			isMatch(a, 'cabc', '{ab,c}+');
			isMatch(a, 'ccab', '{ab,c}+');
			isMatch(a, 'ccc', '{ab,c}+');
			isMatch(a, 'ccc', '{a,b,c}+');

			isMatch(a, 'a', '{a,b,c}+');
			isMatch(a, 'b', '{a,b,c}+');
			isMatch(a, 'c', '{a,b,c}+');
			isMatch(a, 'aa', '{a,b,c}+');
			isMatch(a, 'ab', '{a,b,c}+');
			isMatch(a, 'ac', '{a,b,c}+');
			isMatch(a, 'ba', '{a,b,c}+');
			isMatch(a, 'bb', '{a,b,c}+');
			isMatch(a, 'bc', '{a,b,c}+');
			isMatch(a, 'ca', '{a,b,c}+');
			isMatch(a, 'cb', '{a,b,c}+');
			isMatch(a, 'cc', '{a,b,c}+');
			isMatch(a, 'aaa', '{a,b,c}+');
			isMatch(a, 'aab', '{a,b,c}+');
			isMatch(a, 'abc', '{a,b,c}+');
		});

		a.test('should support braces', a => {
			isMatch(a, 'a', '{a,b,c}');
			isMatch(a, 'b', '{a,b,c}');
			isMatch(a, 'c', '{a,b,c}');
			isNotMatch(a, 'aa', '{a,b,c}');
			isNotMatch(a, 'bb', '{a,b,c}');
			isNotMatch(a, 'cc', '{a,b,c}');
		});
	});

	s.test('brackets', a => {
		a.test('should support stars following brackets', a => {
			isMatch(a, 'a', '[a]*');
			isMatch(a, 'aa', '[a]*');
			isMatch(a, 'aaa', '[a]*');
			isMatch(a, 'az', '[a-z]*');
			isMatch(a, 'zzz', '[a-z]*');
		});

		a.test('should match slashes defined in brackets', a => {
			isMatch(a, 'foo/bar', 'foo[/]bar');
			isMatch(a, 'foo/bar/', 'foo[/]bar[/]');
			isMatch(a, 'foo/bar/baz', 'foo[/]bar[/]baz');
		});

		a.test('should not match slashes following brackets', a => {
			isNotMatch(a, 'a/b', '[a]*');
		});
	});

	s.test('parens (non-extglobs)', a => {
		a.test('should support stars following parens', a => {
			isMatch(a, 'a', '(a)*');
			isMatch(a, 'az', '(a)*');
			isNotMatch(a, 'zz', '(a)*');
			isMatch(a, 'ab', '(a|b)*');
			isMatch(a, 'abc', '(a|b)*');
			isMatch(a, 'aa', '(a)*');
			isMatch(a, 'aaab', '(a|b)*');
			isMatch(a, 'aaabbb', '(a|b)*');
		});

		a.test('should not match slashes with single stars', a => {
			isNotMatch(a, 'a/b', '(a)*');
			isNotMatch(a, 'a/b', '(a|b)*');
		});
	});

	s.test('stars', a => {
		a.test(
			'should respect dots defined in glob pattern (micromatch/#23)',
			a => {
				isMatch(a, 'z.js', 'z*');
				isNotMatch(a, 'zzjs', 'z*.js');
				isNotMatch(a, 'zzjs', '*z.js');
			}
		);

		a.test('should match anything except slashes and leading dots', a => {
			isNotMatch(a, 'a/b/c/z.js', '*.js');
			isNotMatch(a, 'a/b/z.js', '*.js');
			isNotMatch(a, 'a/z.js', '*.js');
			isMatch(a, 'z.js', '*.js');

			isNotMatch(a, 'a/.ab', '*/*');
			isNotMatch(a, '.ab', '*');

			isMatch(a, 'z.js', 'z*.js');
			isMatch(a, 'a/z', '*/*');
			isMatch(a, 'a/z.js', '*/z*.js');
			isMatch(a, 'a/z.js', 'a/z*.js');

			isMatch(a, 'ab', '*');
			isMatch(a, 'abc', '*');

			isNotMatch(a, 'bar', 'f*');
			isNotMatch(a, 'foo', '*r');
			isNotMatch(a, 'foo', 'b*');
			isNotMatch(a, 'foo/bar', '*');
			isMatch(a, 'abc', '*c');
			isMatch(a, 'abc', 'a*');
			isMatch(a, 'abc', 'a*c');
			isMatch(a, 'bar', '*r');
			isMatch(a, 'bar', 'b*');
			isMatch(a, 'foo', 'f*');
		});

		a.test('should match spaces', a => {
			isMatch(a, 'one abc two', '*abc*');
			isMatch(a, 'a         b', 'a*b');
		});

		a.test(
			'should support multiple non-consecutive stars in a path segment',
			a => {
				isNotMatch(a, 'foo', '*a*');
				isMatch(a, 'bar', '*a*');
				isMatch(a, 'oneabctwo', '*abc*');
				isNotMatch(a, 'a-b.c-d', '*-bc-*');
				isMatch(a, 'a-b.c-d', '*-*.*-*');
				isMatch(a, 'a-b.c-d', '*-b*c-*');
				isMatch(a, 'a-b.c-d', '*-b.c-*');
				isMatch(a, 'a-b.c-d', '*.*');
				isMatch(a, 'a-b.c-d', '*.*-*');
				isMatch(a, 'a-b.c-d', '*.*-d');
				isMatch(a, 'a-b.c-d', '*.c-*');
				isMatch(a, 'a-b.c-d', '*b.*d');
				isMatch(a, 'a-b.c-d', 'a*.c*');
				isMatch(a, 'a-b.c-d', 'a-*.*-d');
				isMatch(a, 'a.b', '*.*');
				isMatch(a, 'a.b', '*.b');
				isMatch(a, 'a.b', 'a.*');
				isMatch(a, 'a.b', 'a.b');
			}
		);

		a.test('should support multiple stars in a segment', a => {
			isNotMatch(a, 'a-b.c-d', '**-bc-**');
			isMatch(a, 'a-b.c-d', '**-**.**-**');
			isMatch(a, 'a-b.c-d', '**-b**c-**');
			isMatch(a, 'a-b.c-d', '**-b.c-**');
			isMatch(a, 'a-b.c-d', '**.**');
			isMatch(a, 'a-b.c-d', '**.**-**');
			isMatch(a, 'a-b.c-d', '**.**-d');
			isMatch(a, 'a-b.c-d', '**.c-**');
			isMatch(a, 'a-b.c-d', '**b.**d');
			isMatch(a, 'a-b.c-d', 'a**.c**');
			isMatch(a, 'a-b.c-d', 'a-**.**-d');
			isMatch(a, 'a.b', '**.**');
			isMatch(a, 'a.b', '**.b');
			isMatch(a, 'a.b', 'a.**');
			isMatch(a, 'a.b', 'a.b');
		});

		a.test(
			'should return true when one of the given patterns matches the string',
			a => {
				isMatch(a, '/ab', '*/*');
				isMatch(a, '.', '.');
				isNotMatch(a, 'a/.b', 'a/');
				isMatch(a, '/ab', '/*');
				isMatch(a, '/ab', '/??');
				isMatch(a, '/ab', '/?b');
				isMatch(a, '/cd', '/*');
				isMatch(a, 'a', 'a');
				isMatch(a, 'a/.b', 'a/.*');
				isMatch(a, 'a/b', '?/?');
				isMatch(a, 'a/b/c/d/e/j/n/p/o/z/c.md', 'a/**/j/**/z/*.md');
				isMatch(a, 'a/b/c/d/e/z/c.md', 'a/**/z/*.md');
				isMatch(a, 'a/b/c/xyz.md', 'a/b/c/*.md');
				isMatch(a, 'a/b/c/xyz.md', 'a/b/c/*.md');
				isMatch(a, 'a/b/z/.a', 'a/*/z/.a');
				isNotMatch(a, 'a/b/z/.a', 'bz');
				isMatch(a, 'a/bb.bb/aa/b.b/aa/c/xyz.md', 'a/**/c/*.md');
				isMatch(a, 'a/bb.bb/aa/bb/aa/c/xyz.md', 'a/**/c/*.md');
				isMatch(a, 'a/bb.bb/c/xyz.md', 'a/*/c/*.md');
				isMatch(a, 'a/bb/c/xyz.md', 'a/*/c/*.md');
				isMatch(a, 'a/bbbb/c/xyz.md', 'a/*/c/*.md');
				isMatch(a, 'aaa', '*');
				isMatch(a, 'ab', '*');
				isMatch(a, 'ab', 'ab');
			}
		);

		a.test(
			'should return false when the path does not match the pattern',
			a => {
				isNotMatch(a, '/ab', ['*/']);
				isNotMatch(a, '/ab', ['*/a']);
				isNotMatch(a, '/ab', ['/']);
				isNotMatch(a, '/ab', ['/?']);
				isNotMatch(a, '/ab', ['/a']);
				isNotMatch(a, '/ab', ['?/?']);
				isNotMatch(a, '/ab', ['a/*']);
				isNotMatch(a, 'a/.b', ['a/']);
				isNotMatch(a, 'a/b/c', ['a/*']);
				isNotMatch(a, 'a/b/c', ['a/b']);
				isNotMatch(a, 'a/b/c/d/e/z/c.md', ['b/c/d/e']);
				isNotMatch(a, 'a/b/z/.a', ['b/z']);
				isNotMatch(a, 'ab', ['*/*']);
				isNotMatch(a, 'ab', ['/a']);
				isNotMatch(a, 'ab', ['a']);
				isNotMatch(a, 'ab', ['b']);
				isNotMatch(a, 'ab', ['c']);
				isNotMatch(a, 'abcd', ['ab']);
				isNotMatch(a, 'abcd', ['bc']);
				isNotMatch(a, 'abcd', ['c']);
				isNotMatch(a, 'abcd', ['cd']);
				isNotMatch(a, 'abcd', ['d']);
				isNotMatch(a, 'abcd', ['f']);
				isNotMatch(a, 'ef', ['/*']);
			}
		);

		a.test('should match a path segment for each single star', a => {
			isNotMatch(a, 'aaa', '*/*/*');
			isNotMatch(a, 'aaa/bb/aa/rr', '*/*/*');
			isNotMatch(a, 'aaa/bba/ccc', 'aaa*');
			isNotMatch(a, 'aaa/bba/ccc', 'aaa**');
			isNotMatch(a, 'aaa/bba/ccc', 'aaa/*');
			isNotMatch(a, 'aaa/bba/ccc', 'aaa/*ccc');
			isNotMatch(a, 'aaa/bba/ccc', 'aaa/*z');
			isNotMatch(a, 'aaa/bbb', '*/*/*');
			isNotMatch(a, 'ab/zzz/ejkl/hi', '*/*jk*/*i');
			isMatch(a, 'aaa/bba/ccc', '*/*/*');
			isMatch(a, 'aaa/bba/ccc', 'aaa/**');
			isMatch(a, 'aaa/bbb', 'aaa/*');
			isMatch(a, 'ab/zzz/ejkl/hi', '*/*z*/*/*i');
			isMatch(a, 'abzzzejklhi', '*j*i');
		});

		a.test('should support single globs (*)', a => {
			isMatch(a, 'a', '*');
			isMatch(a, 'b', '*');
			isNotMatch(a, 'a/a', '*');
			isNotMatch(a, 'a/a/a', '*');
			isNotMatch(a, 'a/a/b', '*');
			isNotMatch(a, 'a/a/a/a', '*');
			isNotMatch(a, 'a/a/a/a/a', '*');

			isNotMatch(a, 'a', '*/*');
			isMatch(a, 'a/a', '*/*');
			isNotMatch(a, 'a/a/a', '*/*');

			isNotMatch(a, 'a', '*/*/*');
			isNotMatch(a, 'a/a', '*/*/*');
			isMatch(a, 'a/a/a', '*/*/*');
			isNotMatch(a, 'a/a/a/a', '*/*/*');

			isNotMatch(a, 'a', '*/*/*/*');
			isNotMatch(a, 'a/a', '*/*/*/*');
			isNotMatch(a, 'a/a/a', '*/*/*/*');
			isMatch(a, 'a/a/a/a', '*/*/*/*');
			isNotMatch(a, 'a/a/a/a/a', '*/*/*/*');

			isNotMatch(a, 'a', '*/*/*/*/*');
			isNotMatch(a, 'a/a', '*/*/*/*/*');
			isNotMatch(a, 'a/a/a', '*/*/*/*/*');
			isNotMatch(a, 'a/a/b', '*/*/*/*/*');
			isNotMatch(a, 'a/a/a/a', '*/*/*/*/*');
			isMatch(a, 'a/a/a/a/a', '*/*/*/*/*');
			isNotMatch(a, 'a/a/a/a/a/a', '*/*/*/*/*');

			isNotMatch(a, 'a', 'a/*');
			isMatch(a, 'a/a', 'a/*');
			isNotMatch(a, 'a/a/a', 'a/*');
			isNotMatch(a, 'a/a/a/a', 'a/*');
			isNotMatch(a, 'a/a/a/a/a', 'a/*');

			isNotMatch(a, 'a', 'a/*/*');
			isNotMatch(a, 'a/a', 'a/*/*');
			isMatch(a, 'a/a/a', 'a/*/*');
			isNotMatch(a, 'b/a/a', 'a/*/*');
			isNotMatch(a, 'a/a/a/a', 'a/*/*');
			isNotMatch(a, 'a/a/a/a/a', 'a/*/*');

			isNotMatch(a, 'a', 'a/*/*/*');
			isNotMatch(a, 'a/a', 'a/*/*/*');
			isNotMatch(a, 'a/a/a', 'a/*/*/*');
			isMatch(a, 'a/a/a/a', 'a/*/*/*');
			isNotMatch(a, 'a/a/a/a/a', 'a/*/*/*');

			isNotMatch(a, 'a', 'a/*/*/*/*');
			isNotMatch(a, 'a/a', 'a/*/*/*/*');
			isNotMatch(a, 'a/a/a', 'a/*/*/*/*');
			isNotMatch(a, 'a/a/b', 'a/*/*/*/*');
			isNotMatch(a, 'a/a/a/a', 'a/*/*/*/*');
			isMatch(a, 'a/a/a/a/a', 'a/*/*/*/*');

			isNotMatch(a, 'a', 'a/*/a');
			isNotMatch(a, 'a/a', 'a/*/a');
			isMatch(a, 'a/a/a', 'a/*/a');
			isNotMatch(a, 'a/a/b', 'a/*/a');
			isNotMatch(a, 'a/a/a/a', 'a/*/a');
			isNotMatch(a, 'a/a/a/a/a', 'a/*/a');

			isNotMatch(a, 'a', 'a/*/b');
			isNotMatch(a, 'a/a', 'a/*/b');
			isNotMatch(a, 'a/a/a', 'a/*/b');
			isMatch(a, 'a/a/b', 'a/*/b');
			isNotMatch(a, 'a/a/a/a', 'a/*/b');
			isNotMatch(a, 'a/a/a/a/a', 'a/*/b');
		});

		a.test(
			'should only match a single folder per star when globstars are used',
			a => {
				isNotMatch(a, 'a', '*/**/a');
				isNotMatch(a, 'a/a/b', '*/**/a');
				isMatch(a, 'a/a', '*/**/a');
				isMatch(a, 'a/a/a', '*/**/a');
				isMatch(a, 'a/a/a/a', '*/**/a');
				isMatch(a, 'a/a/a/a/a', '*/**/a');
			}
		);

		a.test(
			'should not match a trailing slash when a star is last char',
			a => {
				isNotMatch(a, 'a', '*/');
				isNotMatch(a, 'a', '*/*');
				isNotMatch(a, 'a', 'a/*');
				isNotMatch(a, 'a/', '*/*');
				isNotMatch(a, 'a/', 'a/*');
				isNotMatch(a, 'a/a', '*');
				isNotMatch(a, 'a/a', '*/');
				isNotMatch(a, 'a/x/y', '*/');
				isNotMatch(a, 'a/x/y', '*/*');
				isNotMatch(a, 'a/x/y', 'a/*');
				//isNotMatch(a, 'a/', '*', { strictSlashes: true });
				isMatch(a, 'a/', '*');
				isMatch(a, 'a', '*');
				isMatch(a, 'a/', '*/');
				isMatch(a, 'a/', '*{,/}');
				isMatch(a, 'a/a', '*/*');
				isMatch(a, 'a/a', 'a/*');
			}
		);

		a.test('should work with file extensions', a => {
			isNotMatch(a, 'a.txt', 'a/**/*.txt');
			isMatch(a, 'a/x/y.txt', 'a/**/*.txt');
			isNotMatch(a, 'a/x/y/z', 'a/**/*.txt');

			isNotMatch(a, 'a.txt', 'a/*.txt');
			isMatch(a, 'a/b.txt', 'a/*.txt');
			isNotMatch(a, 'a/x/y.txt', 'a/*.txt');
			isNotMatch(a, 'a/x/y/z', 'a/*.txt');

			isMatch(a, 'a.txt', 'a*.txt');
			isNotMatch(a, 'a/b.txt', 'a*.txt');
			isNotMatch(a, 'a/x/y.txt', 'a*.txt');
			isNotMatch(a, 'a/x/y/z', 'a*.txt');

			isMatch(a, 'a.txt', '*.txt');
			isNotMatch(a, 'a/b.txt', '*.txt');
			isNotMatch(a, 'a/x/y.txt', '*.txt');
			isNotMatch(a, 'a/x/y/z', '*.txt');
		});

		a.test(
			'should not match slashes when globstars are not exclusive in a path segment',
			a => {
				isNotMatch(a, 'foo/baz/bar', 'foo**bar');
				isMatch(a, 'foobazbar', 'foo**bar');
			}
		);

		a.test('should match slashes when defined in braces', a => {
			isMatch(a, 'foo', 'foo{,/**}');
		});

		a.test('should correctly match slashes', a => {
			isNotMatch(a, 'a/b', 'a*');
			isNotMatch(a, 'a/a/bb', 'a/**/b');
			isNotMatch(a, 'a/bb', 'a/**/b');

			isNotMatch(a, 'foo', '*/**');
			isNotMatch(a, 'foo/bar', '**/');
			isNotMatch(a, 'foo/bar', '**/*/');
			isNotMatch(a, 'foo/bar', '*/*/');
			//isNotMatch(a, 'foo/bar/', '**/*', { strictSlashes: true });

			isMatch(a, '/home/foo/..', '**/..');
			isMatch(a, 'a', '**/a');
			isMatch(a, 'a/a', '**');
			isMatch(a, 'a/a', 'a/**');
			isMatch(a, 'a/', 'a/**');
			isMatch(a, 'a', 'a/**');
			isNotMatch(a, 'a/a', '**/');
			isMatch(a, 'a', '**/a/**');
			isMatch(a, 'a', 'a/**');
			isNotMatch(a, 'a/a', '**/');
			isMatch(a, 'a/a', '*/**/a');
			isMatch(a, 'a', 'a/**');
			isMatch(a, 'foo/', '*/**');
			isMatch(a, 'foo/bar', '**/*');
			isMatch(a, 'foo/bar', '*/*');
			isMatch(a, 'foo/bar', '*/**');
			isMatch(a, 'foo/bar/', '**/');
			isMatch(a, 'foo/bar/', '**/*');
			isMatch(a, 'foo/bar/', '**/*/');
			isMatch(a, 'foo/bar/', '*/**');
			isMatch(a, 'foo/bar/', '*/*/');

			isNotMatch(a, 'bar/baz/foo', '*/foo');
			isNotMatch(a, 'deep/foo/bar', '**/bar/*');
			isNotMatch(a, 'deep/foo/bar/baz/x', '*/bar/**');
			isNotMatch(a, 'ef', '/*');
			isNotMatch(a, 'foo/bar', 'foo?bar');
			isNotMatch(a, 'foo/bar/baz', '**/bar*');
			isNotMatch(a, 'foo/bar/baz', '**/bar**');
			isNotMatch(a, 'foo/baz/bar', 'foo**bar');
			isNotMatch(a, 'foo/baz/bar', 'foo*bar');
			isMatch(a, 'foo', 'foo/**');
			isMatch(a, '/ab', '/*');
			isMatch(a, '/cd', '/*');
			isMatch(a, '/ef', '/*');
			isMatch(a, 'a/b/j/c/z/x.md', 'a/**/j/**/z/*.md');
			isMatch(a, 'a/j/z/x.md', 'a/**/j/**/z/*.md');

			isMatch(a, 'bar/baz/foo', '**/foo');
			isMatch(a, 'deep/foo/bar/baz', '**/bar/*');
			isMatch(a, 'deep/foo/bar/baz/', '**/bar/**');
			isMatch(a, 'deep/foo/bar/baz/x', '**/bar/*/*');
			isMatch(a, 'foo/b/a/z/bar', 'foo/**/**/bar');
			isMatch(a, 'foo/b/a/z/bar', 'foo/**/bar');
			isMatch(a, 'foo/bar', 'foo/**/**/bar');
			isMatch(a, 'foo/bar', 'foo/**/bar');
			isMatch(a, 'foo/bar/baz/x', '*/bar/**');
			isMatch(a, 'foo/baz/bar', 'foo/**/**/bar');
			isMatch(a, 'foo/baz/bar', 'foo/**/bar');
			isMatch(a, 'XXX/foo', '**/foo');
		});

		a.test('should ignore leading "./" when defined on pattern', a => {
			isMatch(a, 'ab', './*');
			isNotMatch(a, 'ab', './*/');
			isMatch(a, 'ab/', './*/');
		});

		a.test('should optionally match trailing slashes with braces', a => {
			isMatch(a, 'foo', '**/*');
			isMatch(a, 'foo', '**/*{,/}');
			isMatch(a, 'foo/', '**/*{,/}');
			isMatch(a, 'foo/bar', '**/*{,/}');
			isMatch(a, 'foo/bar/', '**/*{,/}');
		});
	});
});
