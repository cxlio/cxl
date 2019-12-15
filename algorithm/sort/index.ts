class SortedSet {
	$doInsert(root, node, value) {
		let current = root;

		do {
			if (current.value > value)
				if (current.left) current = current.left;
				else return (current.left = node);
			else if (current.value === value) return;
			else if (current.right) current = current.right;
			else return (current.right = node);
		} while (current);
	}

	$traverse(node, callback) {
		if (!node) return;

		if (node.left) this.$traverse(node.left, callback);
		callback(node.value);
		if (node.right) this.$traverse(node.right, callback);
	}

	find(callback) {
		return this.$find(this.root, callback);
	}

	forEach(callback) {
		this.$traverse(this.root, callback);
	}

	add(item) {
		if (this.has(item)) return;

		const root = this.root,
			node = { value: item };

		if (root) this.$doInsert(root, node, item);
		else this.root = node;
	}

	has(item) {}
}
