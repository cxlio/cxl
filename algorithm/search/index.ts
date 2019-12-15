class Stack {
	constructor() {
		this.$data = [];
	}
	push(a) {
		this.$data.push(a);
	}
	pop() {
		return this.$data.pop();
	}
}

class Queue extends Stack {
	pop() {
		return this.$data.shift();
	}
}

class PriorityQueue extends Stack {
	constructor(priorityFn) {
		super();

		if (priorityFn) this.priority = priorityFn;
	}

	priority() {
		return 0;
	}

	push(node) {
		super.push({ priority: this.priority(node), node: node });
	}

	pop() {
		var data = this.$data,
			i = data.length,
			result = 0;
		while (i--) if (data[i].priority > data[result].priority) result = i;

		result = data.splice(result, 1)[0];
		return result && result.node;
	}
}

class Node {
	constructor(parent, children) {
		this.visited = false;
		this.parent = parent;
		this.children = children || [];
	}
}

function search(start, destination, store) {
	var path = [],
		node = start,
		push = c => !c.visited && store.push(c);
	while (node && node !== destination) {
		node.visited = true;
		node.children.forEach(push);
		node = store.pop();
	}

	while (node) {
		path.push(node);
		node = node.parent;
	}

	return path;
}
