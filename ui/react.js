((cxl, React) => {
"use strict";

	function getName(name)
	{
		return name.replace('cxl', '').replace(/-(\w)/g, function(m, first) {
			return first.toUpperCase();
		});
	}

	function createComponent(meta)
	{
		const name = getName(meta.name), tagName = meta.name;

		cxl.ui[name] = class extends React.Component
		{
			constructor(props)
			{
				super(props);
				this.component = React.createRef();
			}

			render()
			{
				const props = Object.assign({ ref: this.component }, this.props);

				return React.createElement(tagName, props);
			}

			componentDidMount()
			{
				const
					p = this.props,
					component=this.component.current
				;
				this.bindings = [];
				// Handle Events passed in props
				for (var i in p)
					if (i.indexOf('on')===0)
						this.bindings.push(new cxl.EventListener(component, i.slice(2).toLowerCase(), p[i]));
			}

			componentWillUnmount()
			{
				this.bindings.forEach(b => b.destroy());
			}
		};
	}

	cxl.each(cxl.componentFactory.components, createComponent);

})(this.cxl, this.React);