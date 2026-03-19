import { goto } from '$app/navigation'

export class LemonSqueezyClient {
	private prefix = `LemonSqueezy`
	private initialized = false
	private overlayNode: HTMLElement | null = null

	init() {
		if (this.initialized) return
		if (typeof window.createLemonSqueezy !== `function`) {
			app.Helpers.Warn(`Lemon.js not loaded`, this.prefix)
			return
		}

		window.createLemonSqueezy()

		window.LemonSqueezy.Setup({
			eventHandler: (event) => this.handleEvent(event),
		})

		this.initialized = true
		app.Helpers.Log(`Initialized`, this.prefix)
	}

	open(url: string) {
		if (!this.initialized) this.init()

		const appEl = document.querySelector(`.app`)
		if (!appEl) {
			app.Helpers.Warn(`App container not found, falling back to redirect`, this.prefix)
			window.location.href = url
			return
		}

		this.close()

		const overlay = document.createElement(`div`)
		overlay.className = `ls-checkout-overlay`

		const backdrop = document.createElement(`div`)
		backdrop.className = `ls-checkout-backdrop`
		backdrop.addEventListener(`click`, () => this.close())

		const panel = document.createElement(`div`)
		panel.className = `ls-checkout-panel`

		const closeBtn = document.createElement(`button`)
		closeBtn.className = `ls-checkout-close`
		closeBtn.innerHTML = `<i class="fa-light fa-xmark"></i>`
		closeBtn.addEventListener(`click`, () => this.close())

		const iframe = document.createElement(`iframe`)
		iframe.src = url
		iframe.className = `ls-checkout-iframe`

		panel.appendChild(closeBtn)
		panel.appendChild(iframe)
		overlay.appendChild(backdrop)
		overlay.appendChild(panel)
		appEl.appendChild(overlay)
		this.overlayNode = overlay
	}

	close() {
		if (this.overlayNode) {
			this.overlayNode.remove()
			this.overlayNode = null
		}
	}

	refresh() {
		window.LemonSqueezy?.Refresh()
	}

	private handleEvent(event: { event: string, data?: any }) {
		app.Helpers.Log(`Event: ${event.event}`, this.prefix)

		switch (event.event) {
			case `Checkout.Success`:
				this.close()
				app.UI.Notify.success(`Your subscription is being activated`, `Checkout`)
				app.Events.emit(`ls:Checkout.Success`, event.data)
				goto(`/account/subscriptions`)
				break

			case `PaymentMethodUpdate.Updated`:
				app.UI.Notify.success(`Payment method updated`, `Billing`)
				app.Events.emit(`ls:PaymentMethodUpdate.Updated`, event.data)
				break

			case `Checkout.Closed`:
				app.Helpers.Log(`Checkout closed by user`, this.prefix)
				app.Events.emit(`ls:Checkout.Closed`, event.data)
				break
		}
	}
}
