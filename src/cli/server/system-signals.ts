type SystemSignalListener = (() => boolean | void) | (() => Promise<boolean | void>);

export class SystemSignals {
	listeners: Record<string, SystemSignalListener[]> = {
		close: [],
		reboot: []
	};

	onClose(cb: SystemSignalListener) {
		this.listeners['close'].push(cb);
	}

	offClose(cb: SystemSignalListener) {
		this.listeners['close'] = this.listeners['close'].filter((listener) => listener !== cb);
	}

	onReboot(cb: SystemSignalListener) {
		this.listeners['reboot'].push(cb);
	}

	offReboot(cb: SystemSignalListener) {
		this.listeners['reboot'] = this.listeners['reboot'].filter((listener) => listener !== cb);
	}

	async close() {
		const results = await Promise.all(this.listeners['close'].map((listener) => listener()));
		this.listeners['close'] = this.listeners['close'].filter((_, i) => results[i] !== false);
	}

	async reboot() {
		await this.close();
		const results = await Promise.all(this.listeners['reboot'].map((listener) => listener()));
		this.listeners['reboot'] = this.listeners['reboot'].filter((_, i) => results[i] !== false);
	}
}
