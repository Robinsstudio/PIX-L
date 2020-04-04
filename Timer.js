/**
 * This object manages the time of the active question.
 */

class Timer {
	/**
	 * Starts the timer.
	 *
	 * @param {number} seconds - the number of seconds to count
	 */
	count(seconds) {
		this.reset();
		this.seconds = seconds;
		this.interval = setInterval(this.onCountHandler, 1000);
	}

	/**
	 * Resets the timer.
	 */
	reset() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	/**
	 * Sets a listener to the count event.
	 *
	 * @param {Function} callback - the listener
	 */
	onCount(callback) {
		this.onCountHandler = () => {
			if (this.isOutOfTime()) {
				this.reset();
				this.fireOutOfTime();
			}

			if (this.interval) {
				callback(--this.seconds);
			}
		};
	}

	/**
	 * Returns true if there are no more seconds to count, false otherwise.
	 */
	isOutOfTime() {
		return !this.seconds;
	}

	/**
	 * Sets a listener to the out of time event.
	 *
	 * @param {Function} callback - the listener
	 */
	onOutOfTime(callback) {
		this.onOutOfTimeHandler = callback;
	}

	/**
	 * Fires the out of time event.
	 */
	fireOutOfTime() {
		this.onOutOfTimeHandler();
	}
}

module.exports = Timer;