import { browser } from '$app/environment'
import { UAParser } from 'ua-parser-js'

const STORAGE_KEY = 'device_fingerprint'

export class FingerprintClient {
	private fingerprint: string | null = null
	private deviceName: string | null = null
	private initPromise: Promise<void> | null = null

	init() {
		if (!browser) return Promise.resolve()
		if (this.initPromise) return this.initPromise
		this.fingerprint = localStorage.getItem(STORAGE_KEY)
		this.deviceName = this.parseDeviceName()

		this.initPromise = import('@fingerprintjs/fingerprintjs')
			.then((FingerprintJS) => FingerprintJS.load())
			.then((agent) => agent.get())
			.then((result) => {
				this.fingerprint = result.visitorId
				localStorage.setItem(STORAGE_KEY, result.visitorId)
			})
			.catch(() => {})

		return this.initPromise
	}

	async get(): Promise<{ fingerprint: string | null, deviceName: string | null }> {
		if (this.initPromise) await this.initPromise
		return {
			fingerprint: this.fingerprint,
			deviceName: this.deviceName,
		}
	}

	private parseDeviceName(): string | null {
		if (typeof navigator === 'undefined') return null
		const ua = new UAParser(navigator.userAgent)
		const browser = ua.getBrowser()
		const os = ua.getOS()
		const parts = [
			browser.name,
			browser.version?.split('.')[0],
			os.name ? `on ${os.name}` : null,
			os.version,
		].filter(Boolean)
		return parts.length ? parts.join(' ') : null
	}
}
