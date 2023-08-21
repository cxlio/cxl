///<amd-module name="@cxl/glob"/>

export function globToRegex(glob: string | readonly string[]) {
	if (Array.isArray(glob)) glob = `{${glob.join(',')}}`;

	const len = glob && glob.length;
	let reStr = '';
	let c;

	let inGroup = 0;
	let inBrackets = false;

	if (!len) return /[\s\S]*/;

	for (let i = 0; i < len; i++) {
		c = glob[i];
		const la = glob[i + 1];

		switch (c) {
			case '.':
				if (inGroup && la === '.') {
					const prev = glob[i - 1];
					reStr =
						reStr.slice(0, reStr.length - 1) +
						`[${prev}-${glob[i + 2]}]`;
					i += 2;
				} else if (la === '/') {
					reStr += '(?:./)?';
					i++;
				} else reStr += '\\.';
				break;
			case '\\':
				if (la === '{' || la === '}') {
					reStr += `\\${la}`;
					i++;
				} else reStr += '\\';
				break;
			case '$':
			case '^':
			case '+':
			case '=':
			case '!':
				reStr += '\\' + c;
				break;
			case '?':
				reStr += '[^/]';
				break;
			case '(':
				inGroup++;
				reStr += c;
				break;
			case ')':
				inGroup--;
				reStr += c;
				//if (la === '*') {
				//	reStr += '*';
				//	i++;
				//}
				break;
			case '[':
				inBrackets = true;
				reStr += '[';
				break;
			case ']':
				inBrackets = false;
				reStr += ']';
				if (la === '+') {
					reStr += '+';
					i++;
				}
				break;
			case '{':
				if (inBrackets) {
					reStr += '\\{';
				} else {
					// If no commas treat as literal
					let found = false;
					for (let a = i + 1; a < len && glob[a] !== '}'; a++)
						if (
							glob[a] === ',' ||
							(glob[a] === '.' && glob[a + 1] === '.')
						) {
							inGroup++;
							found = true;
							reStr += '(?:';
							break;
						}
					if (!found) reStr += '\\{';
				}
				break;
			case '}':
				if (!inBrackets && inGroup) {
					inGroup--;
					reStr += ')';
					if (la === '+') {
						reStr += '+';
						i++;
					}
				} else reStr += '\\}';
				break;
			case '|':
			case ',':
				if (inGroup) {
					reStr += '|';
					break;
				}
				reStr += '\\' + c;
				break;
			case '/':
				if (
					la === '*' &&
					glob[i - 1] &&
					glob[i + 2] === '*' &&
					glob[i + 3] !== '/'
				)
					reStr += '/?';
				else reStr += '/';
				break;
			case '*':
				if (la === '*') {
					if (!glob[i - 1]) reStr += '/?';
					if (
						(glob[i + 2] === '/' || !glob[i + 2]) &&
						(glob[i - 1] === '/' || !glob[i - 1])
					) {
						if (glob[i + 3]) reStr += '(?:[^/.][^/]*(?:/|$))*';
						else if (!glob[i + 2]) reStr += '(?:[^/.][^/]*/?)*';
						else reStr += '(?:[^/.][^/]*/)*';

						i += 2;
						break;
					} else {
						i++;
						if (glob[i - 1] === '/' || !glob[i - 1])
							reStr += `(?:[^./][^/]*)${
								glob[i + 2] ? '?(?:/$)?' : '/?'
							}`;
						else reStr += `[^/]*${glob[i + 2] ? '(?:/$)?' : '/?'}`;
						break;
					}
				} else if (la === '/') {
					reStr += '(?:[^./][^/]*)?/';
					i++;
					break;
				}
				if (glob[i - 1] === '/' || !glob[i - 1]) {
					if (la === '.') {
						reStr += `(?:[^./][^/]*)(?:/$)?`;
					} else reStr += `(?:[^./][^/]*)${la ? '?(?:/$)?' : '/?'}`;
				} else reStr += `[^/]*${la ? '(?:/$)?' : '/?'}`;

				break;

			default:
				reStr += c;
		}
	}

	try {
		return new RegExp(`^${reStr}$`);
	} catch (e) {
		throw new Error(`Invalid glob "${glob}" (${reStr})`);
		//return new RegExp(glob.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
	}
}
