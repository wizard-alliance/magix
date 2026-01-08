const getStorage = () => typeof window === 'undefined' ? null : window.localStorage

export class LocalStorageClient {
	private storage = getStorage()

	private hasStorage() {
		return Boolean(this.storage)
	}

	getNumber(key: string) {
		if (!this.hasStorage()) {
			return null
		}
		const raw = this.storage!.getItem(key)
		if (!raw) {
			return null
		}
		const parsed = Number(raw)
		return Number.isFinite(parsed) && parsed > 0 ? parsed : null
	}

	setNumber(key: string, value?: number) {
		if (!this.hasStorage()) {
			return
		}
		if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
			this.storage!.setItem(key, String(value))
			return
		}
		this.storage!.removeItem(key)
	}

	getItem(key: string) {
		if (!this.hasStorage()) {
			return null
		}
		return this.storage!.getItem(key)
	}

	setItem(key: string, value?: string | null) {
		if (!this.hasStorage()) {
			return
		}
		if (typeof value === 'string') {
			this.storage!.setItem(key, value)
			return
		}
		this.storage!.removeItem(key)
	}

	remove(key: string) {
		if (this.hasStorage()) {
			this.storage!.removeItem(key)
		}
	}
}
