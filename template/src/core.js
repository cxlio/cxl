
// TODO ?
this.cxl = {

	extendClass(Parent, p)
	{
		var Result = class extends Parent { };
		cxl.extend(Result.prototype, p);
		return Result;
	},

	extend(A, B, C, D)
	{
		for (var i in B)
			if (B.hasOwnProperty(i))
				Object.defineProperty(A, i, Object.getOwnPropertyDescriptor(B, i));
		if (C || D)
			cxl.extend(A, C, D);

		return A;
	}

};
