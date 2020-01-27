class Timer {
	count(seconds) {
		this.reset();
		this.seconds = seconds;
		this.interval = setInterval(this.onCountHandler, 1000);
	}

	reset() {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	onCount(callback) {
		this.onCountHandler = () => {
			if (!this.seconds) {
				this.reset();
				this.fireOutOfTime();
			}

			if (this.interval) {
				callback(--this.seconds);
			}
		};
	}

	onOutOfTime(callback) {
		this.onOutOfTimeHandler = callback;
	}

	fireOutOfTime() {
		this.onOutOfTimeHandler();
	}
}

module.exports = Timer;