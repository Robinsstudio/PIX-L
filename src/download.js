
export default {
	/**
	 * Returns a link to download the sessions of the specified game.
	 *
	 * @param {string} idGame - the id of the game
	 */
	getDownloadLink: function(idGame) {
		return process.env.NODE_ENV === 'production' ? `${process.env.PUBLIC_URL}/api/export/${idGame}` : `http://${window.location.hostname}:8080/PIX-L/api/export/${idGame}`;
	}
}