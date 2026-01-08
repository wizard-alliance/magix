/// <reference types="vite/client" />

declare interface ImportMetaEnv {
	readonly API_URL: string
	readonly APP_NAME: string
	readonly APP_TAGLINE: string
	readonly PUBLIC_APP_TARGET: 'web' | 'electron'
}

declare interface ImportMeta {
	readonly env: ImportMetaEnv
}
