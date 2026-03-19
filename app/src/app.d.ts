import type { AppClient } from '$lib/app'

declare global {
	interface Window {
		app: AppClient
		createLemonSqueezy: () => void
		LemonSqueezy: {
			Setup: (options: {
				eventHandler: (event: { event: string, data?: any }) => void
			}) => void
			Refresh: () => void
			Url: {
				Open: (url: string) => void
				Close: () => void
			}
			Affiliate: {
				GetID: () => string
				Build: (url: string) => string
			}
		}
	}
	const app: AppClient
}

export {}
