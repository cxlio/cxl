abstract class VirtualNode {
	static readonly ELEMENT_NODE = 1;
	static readonly TEXT_NODE = 3;
	static readonly COMMENT_NODE = 8;
	static readonly DOCUMENT_FRAGMENT_NODE = 11;

	abstract textContent: string;
	abstract readonly nodeType: number;

	parentNode: VirtualElement | null = null;
	isConnected = false;

	private getIndex() {
		const parent = this.parentNode,
			index = parent && parent.childNodes.indexOf(this);
		return index === -1 ? null : index;
	}

	get nextSibling(): VirtualNode | null {
		const parent = this.parentNode,
			index = this.getIndex();
		return (
			(parent && index !== null && parent.childNodes[index + 1]) || null
		);
	}

	get previousSibling() {
		const parent = this.parentNode,
			index = this.getIndex();
		return (
			(parent && index !== null && parent.childNodes[index - 1]) || null
		);
	}

	cloneNode() {
		return new this.constructor();
	}
}

function empty(el: VirtualElement) {
	el.childNodes.forEach(node => remove(node));
	el.childNodes.length = 0;
}

function remove(el: VirtualNode) {
	el.parentNode = null;
	el.isConnected = false;
}

function insert(host: VirtualElement, el: VirtualNode) {
	el.parentNode = host;
}

class VirtualElement extends VirtualNode {
	private $attributes: { [name: string]: string } = {};

	readonly tagName: string;
	readonly nodeType = VirtualNode.ELEMENT_NODE;
	childNodes: VirtualNode[] = [];

	constructor(tagName: string) {
		super();
		this.tagName = tagName;
	}

	appendChild(node: VirtualNode) {
		this.insertBefore(node);
	}

	get textContent(): string {
		return this.childNodes.map(child => child.textContent).join('');
	}

	set textContent(val: string) {
		empty(this);
		this.appendChild(new VirtualTextNode(val));
	}

	get firstChild() {
		return this.childNodes[0];
	}

	get lastChild() {
		return this.childNodes[this.childNodes.length - 1];
	}

	addEventListener(event, handler, options) {}

	removeEventListener(event, handler, options) {}

	setAttribute(attr: string, value: any) {
		this.$attributes[attr] = String(value);
	}

	getAttribute(attr: string): string {
		return this.$attributes[attr];
	}

	hasAttribute(attr: string): boolean {
		return attr in this.$attributes;
	}

	removeAttribute(attr: string) {
		delete this.$attributes[attr];
	}

	insertBefore(node: VirtualNode, before?: VirtualNode) {
		const nodes = this.childNodes;

		if (node.parentNode) node.parentNode.removeChild(node);
		insert(this, node);

		if (before) {
			const index = nodes.indexOf(before);
			nodes.splice(index, 0, node);
		} else nodes.push(node);
	}

	removeChild(child: VirtualNode) {
		const index = this.childNodes.indexOf(child);

		if (index === -1) throw new Error('Invalid node');

		this.childNodes.splice(index, 1);
	}

	cloneNode(deep?: boolean) {
		const result = super.cloneNode();
		result.$attributes = { ...this.$attributes };
		result.tagName = this.tagName;
		if (deep) {
			this.childNodes.forEach((child: VirtualNode) =>
				result.childNodes.push(child.cloneNode(deep))
			);
		}
		return result;
	}
}

class VirtualTextNode extends VirtualNode {
	textContent: string;
	nodeType = 3;

	constructor(content: string) {
		super();
		this.textContent = content;
	}
}

class VirtualFragment extends VirtualElement {
	nodeType = VirtualNode.DOCUMENT_FRAGMENT_NODE;
	constructor() {
		super('IGNORE');
		(this as any).tagName = undefined;
	}
}

class VirtualTemplateElement extends VirtualElement {
	content: VirtualFragment;
	constructor() {
		super('TEMPLATE');
		this.content = new VirtualFragment();
	}
}

const TAG_MAP = {
	TEMPLATE: VirtualTemplateElement
};

global.HTMLTemplateElement = VirtualTemplateElement;
global.HTMLElement = VirtualElement;
global.DocumentFragment = VirtualFragment;
global.Element = VirtualElement;
global.Node = VirtualNode;
global.TextNode = VirtualTextNode;

global.document = {
	createElement(tagName: string): Element {
		tagName = tagName.toUpperCase();
		const Cls = TAG_MAP[tagName] || VirtualElement,
			instance = new Cls();
		instance.tagName = tagName;
		return instance;
	},
	createTextNode(data): Text {
		const result: any = new VirtualTextNode();
		result.textContent = data;
		return result as Text;
	},
	createDocumentFragment(): VirtualFragment {
		return new VirtualFragment();
	},
	importNode(node: VirtualNode, deep: boolean) {
		return node.cloneNode(deep);
	}
};
