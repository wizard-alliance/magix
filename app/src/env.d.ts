/// <reference types="vite/client" />

declare interface ImportMetaEnv {
	readonly PUBLIC_APP_TARGET: 'web' | 'electron'
	readonly PUBLIC_APP_URL: string
	readonly PUBLIC_API_URL: string
	readonly PUBLIC_WS_URL: string
	readonly PUBLIC_MAX_FILE_SIZE_IMAGE: string
	readonly PUBLIC_APP_NAME: string
	readonly PUBLIC_APP_TAGLINE: string
	readonly PUBLIC_APP_DESCRIPTION: string
	readonly PUBLIC_APP_COLOR: string
	readonly PUBLIC_APP_VERSION: string
}

declare interface ImportMeta {
	readonly env: ImportMetaEnv
}
