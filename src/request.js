export default (url, body) => {
	return fetch(process.env.PUBLIC_URL + '/api/' + url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
};