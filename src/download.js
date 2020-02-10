export default {
	getDownloadLink: function(url) {
		return process.env.NODE_ENV === 'production' ? `${process.env.PUBLIC_URL}/api/export` : 'http://localhost:8080/api/export';
	}
}