class Timer {
	count(seconds) {
		this.seconds = seconds;
		setTimeout(() => this.interval = setInterval(this.onCountHandler, 1000), 1000);
	}

	reset() {
		clearInterval(this.interval);
		this.interval = null;
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
}

module.exports = Timer;