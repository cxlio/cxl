(cxl => {
"use strict";

const
	debug = cxl.debug,
	fb = cxl.fb,

	MAXLENGTH = 500
;

debug.override(fb.Reference.prototype, '$onValue', function(subscriber, snap)
{
	const value = JSON.stringify(snap.val());

	if (value > MAXLENGTH)
		debug.warn(`Maximum Length for fb response: `, this);
});

})(this.cxl);