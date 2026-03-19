import { browser } from '$app/environment'
import { app } from "$lib/app"

if (browser) {
	document.body.dataset.appType = app.Meta.app.runtime
	app.Commerce.LemonSqueezy.init()
}

export { app }
