class Timer {
	count(seconds) {
		this.seconds = seconds;
		setTimeout(() => this.interval = setInterval(this.onCountHandler, 1000), 1000);
	}

	reset() {
		const { interval } = this;
		if (interval) {
			this.interval = null;
			setTimeout(() => this.fireOutOfTime(), 1000);
			clearInterval(interval);
		}
	}

	onCount(callback) {
		this.onCountHandler = () => {
			if (!this.seconds) {
				this.reset();
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