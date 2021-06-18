type Content = Record<string, string>;
const content: Content = {};

export function registerContent(newContent: Content) {
	Object.assign(content, newContent);
}
