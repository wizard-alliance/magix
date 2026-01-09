import { mount, unmount } from 'svelte'
import { app } from '../app.js'
import NotifyBanner from '$components/NotifyBanner.svelte'

type createPayload = {
	title?: string
	message: string
	type?: 'info' | 'success' | 'warning' | 'error'
	duration?: number
}

export class Notify {
	private prefix = "Notify"
	private containerNode: HTMLElement | null = null
	private defaultDuration = 5

	private getContainer(): HTMLElement {
		if (this.containerNode) return this.containerNode
		
		const parent = document.body.querySelector('.app')
		if (!parent) throw new Error('App container not found for notifications')
			
		const container = document.createElement('div')
		container.className = 'notify-container'
		parent.appendChild(container)
		this.containerNode = container
		return container
	}

	create(params: createPayload) {
		const container = this.getContainer()
		app.$.Success(params.message, this.prefix)

		container.innerHTML = ''

		let dismissed = false
		const dismiss = () => {
			if (dismissed) return
			dismissed = true
			unmount(notify)
		}

		const notify = mount(NotifyBanner, {
			target: container,
			props: {
				title: params.title,
				message: params.message,
				type: params.type || 'info',
				duration: params.duration || 5,
				onclick: dismiss,
			}
		})

		setTimeout(dismiss, (params.duration || this.defaultDuration) * 1000)
	}

	success(message: string, title?: string, duration?: number) {
		this.create({ title, message, type: 'success', duration })
	}

	error(message: string, title?: string, duration?: number) {
		this.create({ title, message, type: 'error', duration })
	}

	warning(message: string, title?: string, duration?: number) {
		this.create({ title, message, type: 'warning', duration })
	}

	info(message: string, title?: string, duration?: number) {
		this.create({ title, message, type: 'info', duration })
	}
}