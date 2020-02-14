export default {
	getDownloadLink: function(idGame) {
		return process.env.NODE_ENV === 'production' ? `${process.env.PUBLIC_URL}/api/export/${idGame}` : `http://localhost:8080/api/export/${idGame}`;
	}
}