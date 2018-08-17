
// TODO ?
this.cxl = {

	extendClass(Parent, p)
	{
		var Result = class extends Parent { };
		cxl.extend(Result.prototype, p);
		return Result;
	},

	extend(A, B)
	{
		for (var i in B)
			if (B.hasOwnProperty(i))
				Object.defineProperty(A, i, Object.getOwnPropertyDescriptor(B, i));
	}

};