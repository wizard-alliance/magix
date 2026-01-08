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

	constructor() {
		if (typeof document !== 'undefined') {
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => this.init())
			} else {
				this.init()
			}
		}
	}

	private init() {
		this.containerNode = this.createContainer()
	}

	private createContainer(): HTMLElement {
		if (this.containerNode) return this.containerNode
		const container = document.createElement('div')
		container.className = 'notify-container'
		document.body.appendChild(container)
		return container
	}

	create(params: createPayload) {
		if (!this.containerNode) return
		app.$.Success(params.message, this.prefix)

		this.containerNode.innerHTML = '' // Clear existing notifications

		let dismissed = false
		const dismiss = () => {
			if (dismissed) return
			dismissed = true
			unmount(notify)
		}

		const notify = mount(NotifyBanner, {
			target: this.containerNode,
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