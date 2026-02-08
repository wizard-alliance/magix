import { mount, unmount } from 'svelte'
import ModalDialog from '$components/modules/ModalDialog.svelte'

type Choice = { label: string; value: string; variant?: string }

type ModalParams = {
	icon?: string
	title?: string
	subtitle?: string
	content?: string
	choices?: Choice[]
	closable?: boolean
}

export class Modal {
	private containerNode: HTMLElement | null = null
	private activeModal: Record<string, any> | null = null

	private getContainer(): HTMLElement {
		if (this.containerNode) return this.containerNode
		const parent = document.body.querySelector('.app')
		if (!parent) throw new Error('App container not found for modal')
		const container = document.createElement('div')
		container.className = 'modal-container'
		parent.appendChild(container)
		this.containerNode = container
		return container
	}

	private dismiss() {
		if (!this.activeModal) return
		unmount(this.activeModal)
		this.activeModal = null
		if (this.containerNode) this.containerNode.innerHTML = ''
	}

	open(params: ModalParams): Promise<string | null> {
		this.dismiss()
		const container = this.getContainer()

		return new Promise((resolve) => {
			this.activeModal = mount(ModalDialog, {
				target: container,
				props: {
					...params,
					onresult: (value: string | null) => {
						this.dismiss()
						resolve(value)
					},
				},
			})
		})
	}

	confirm(title: string, content?: string, icon?: string): Promise<boolean> {
		return this.open({
			icon: icon || 'fa-circle-exclamation',
			title,
			content,
			choices: [
				{ label: 'Cancel', value: 'cancel' },
				{ label: 'Confirm', value: 'confirm', variant: 'primary' },
			],
		}).then(v => v === 'confirm')
	}

	alert(title: string, content?: string, icon?: string): Promise<void> {
		return this.open({
			icon: icon || 'fa-circle-info',
			title,
			content,
			choices: [{ label: 'OK', value: 'ok', variant: 'primary' }],
		}).then(() => {})
	}

	close() {
		this.dismiss()
	}
}
