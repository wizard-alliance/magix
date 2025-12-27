/// <reference types="svelte" />
/// <reference types="vite/client" />

import type { TokenInfo } from './lib/client/api'

declare global {
	interface Window {
		Config: { apiBaseUrl: string }
		Request: any
		getAccessToken: () => TokenInfo
		setAccessToken: (token: string, expiresAt?: string) => void
		getRefreshToken: () => TokenInfo
		setRefreshToken: (token: string, expiresAt?: string) => void
		log?: (payload: any) => void
	}
}

export {}
