import type { createAppClient } from '$lib/app'

type AppClient = ReturnType<typeof createAppClient>

declare global {
	interface Window {
		app: AppClient
	}
	const app: AppClient
}

export {}
