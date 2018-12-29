
onmessage = function(e) {
	const message = e.data, action = e.data[0];

	if (action==='diff')
		message[1] = doDiff(message[1], message[2]);
	else if (action==='patch')
		message[1] = patch(message[1], message[2]);

	postMessage(message);
};