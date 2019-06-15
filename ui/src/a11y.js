(cxl => {

const
	directive = cxl.directive
;

directive('aria.prop', {

	initialize()
	{
		const view = this.element.$view;

		if (view)
		{
			// TODO keep here?
			const states = view.$ariaStates || (view.$ariaStates = []);
			states.push('aria-' + this.parameter);
		}
	},

	digest()
	{
		this.digest = null;
		return this.update(true);
	},

	update(val)
	{
		if (val===undefined || val===null)
			val = false;

		this.element.setAttribute('aria-' + this.parameter, val);
	}

});

directive('aria.level', {
	digest()
	{
		this.digest = null;
		return this.update(this.parameter);
	},

	update(val)
	{
		this.element.setAttribute('aria-level', val);
	}
});

directive('role', {
	connect()
	{
		if (!this.element.hasAttribute('role'))
			this.element.setAttribute('role', this.parameter);
	}
});

})(this.cxl);