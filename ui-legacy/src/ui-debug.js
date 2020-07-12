(cxl => {
	'use strict';

	const debug = cxl.debug,
		override = debug.override,
		warn = debug.warn,
		MAX_TEMPLATE_LENGTH = 2000,
		VALID_COMPONENT_META = [
			'template',
			'name',
			'extend',
			'attributes',
			'methods',
			'styles',
			'events',
			'bindings',
			'initialize',
			'templateId',
			'controller',
			'deprecated'
		],
		VALID_ROUTE_META = [
			'path',
			'id',
			'title',
			'resolve',
			'defaultRoute',
			'redirectTo',
			'parent'
		];
	//
	// Components
	//
	override(cxl.componentFactory, 'createComponent', function(meta, node) {
		if (node.$view)
			throw new Error('Trying to initialize node more than once.');
		if (meta.deprecated) warn(`Component ${meta.name} is deprecated`);
		node.$$meta = meta;
	});

	override(
		cxl.ComponentDefinition.prototype,
		'componentConstructor',
		function() {
			const meta = this.meta;

			for (var i in meta)
				if (
					VALID_COMPONENT_META.indexOf(i) === -1 &&
					VALID_ROUTE_META.indexOf(i) === -1
				)
					throw new Error(`Invalid property "${i}" for ${meta.name}`);

			if (meta.name && meta.name.indexOf('-') === -1)
				throw new Error(
					`Invalid component name "${
						meta.name
					}", must have a namespace.`
				);

			if (
				meta.attributes &&
				meta.attributes.indexOf('value') !== -1 &&
				(!meta.events || meta.events.indexOf('change') === -1)
			)
				throw new Error(
					`"value" attribute present without a "change" event`
				);

			if (
				meta.template &&
				meta.template.length &&
				meta.template.length > MAX_TEMPLATE_LENGTH
			)
				warn(
					`Template size for "${
						meta.name
					}" might be too long. Consider splitting into sub components`
				);
		}
	);

	if (cxl.$$shadyCustomElements)
		warn('[cxl] customElements emulation enabled.');
	if (cxl.$$shadyShadowDOM) warn('[cxl] shadow DOM emulation enabled.');
})(this.cxl);
