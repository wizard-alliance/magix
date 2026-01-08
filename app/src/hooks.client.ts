import { browser } from '$app/environment'
import { PUBLIC_APP_TARGET } from '$env/static/public'
import { app } from "$lib/app"

const runtime = PUBLIC_APP_TARGET === 'web' ? 'web' : 'electron'

if (browser) {
	document.body.dataset.appType = runtime
}

export { app }
