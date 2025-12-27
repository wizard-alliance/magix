/// <reference types="svelte" />
/// <reference types="vite/client" />

declare global {
	interface Window {
		Config: any
		Request: (args: any) => Promise<any>
		getAccessToken: () => { token: string; expiresAt?: string }
		setAccessToken: (token: string, expiresAt?: string) => void
		getRefreshToken: () => { token: string; expiresAt?: string }
		setRefreshToken: (token: string, expiresAt?: string) => void
		log?: (payload: any) => void
	}
}

export {}
