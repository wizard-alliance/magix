import type { AppClient } from '$lib/app'

declare global {
	interface Window {
		app: AppClient
	}
	const app: AppClient
}

export {}
