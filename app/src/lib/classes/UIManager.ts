import { writable, type Writable } from 'svelte/store'
import { app } from '../app.js'

import type { ComponentType, SvelteComponent } from 'svelte'

type DragPayload = DragEvent | PointerEvent | MouseEvent | Record<string, unknown> | null | undefined
type ClickPayload = MouseEvent | PointerEvent | Record<string, unknown> | null | undefined

type SidebarContent = { component: ComponentType<SvelteComponent>, props?: Record<string, any> } | null

type UiStateStores = {
	isDragging: Writable<boolean>
	dragData: Writable<DragPayload | null>
	isClicking: Writable<boolean>
	clickData: Writable<ClickPayload | null>
	sidebar1: Writable<SidebarContent>
	sidebar2: Writable<SidebarContent>
}

type UiClickEventName = 'click' | 'click:double' | 'click:down' | 'click:release'
type UiClickSignal = `ui:${UiClickEventName}`

export class UIManager {
	private uiState: UiStateStores

	constructor() {
		this.uiState = this.ensureUiState()
		this.registerEvents()
	}

	private ensureUiState(): UiStateStores {
		const uiState = app.State.ui ?? {}
		
		if (!uiState.isDragging) {
			uiState.isDragging = writable(false)
		}

		if (!uiState.dragData) {
			uiState.dragData = writable<DragPayload | null>(null)
		}
		
		if (!uiState.isClicking) {
			uiState.isClicking = writable(false)
		}

		if (!uiState.clickData) {
			uiState.clickData = writable<ClickPayload | null>(null)
		}

		if (!uiState.sidebar1) {
			uiState.sidebar1 = writable<SidebarContent>(null)
		}

		if (!uiState.sidebar2) {
			uiState.sidebar2 = writable<SidebarContent>(null)
		}

		app.State.ui = uiState
		return uiState as UiStateStores
	}

	private registerEvents() {
		app.Events.on('drag:start', (payload) => this.handleDragStart(payload))
		app.Events.on('drag:end', (payload) => this.handleDragEnd(payload))
		app.Events.on('drag:move', (payload) => this.handleDragMove(payload))
		app.Events.on('drag:cancel', (payload) => this.handleDragCancel(payload))
		app.Events.on('drop', (payload) => this.handleDrop(payload))

		app.Events.on('click', (payload) => this.handleClick('click', payload))
		app.Events.on('click:double', (payload) => this.handleClick('click:double', payload))
		app.Events.on('click:down', (payload) => this.handleClick('click:down', payload))
		app.Events.on('click:release', (payload) => this.handleClick('click:release', payload))
	}

	private handleDragStart(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(true)
		this.uiState.dragData.set(data)
		app.$.Log('Drag started', 'UI')
		app.Events.emit('ui:drag:start', data)
	}

	private handleDragEnd(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(false)
		this.uiState.dragData.set(null)
		app.$.Log('Drag stopped', 'UI')
		app.Events.emit('ui:drag:end', data)
	}

	private handleDragMove(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(true)
		this.uiState.dragData.set(data)
		app.Events.emit('ui:drag:move', data)
	}

	private handleDragCancel(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(false)
		this.uiState.dragData.set(null)
		app.Events.emit('ui:drag:cancel', data)
	}

	private handleDrop(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(false)
		this.uiState.dragData.set(null)
		app.Events.emit('ui:drop', data)
	}

	private handleClick(event: UiClickEventName, payload: ClickPayload) {
		const data = payload ?? null
		if (event === 'click:down') {
			this.uiState.isClicking.set(true)
		}
		if (event === 'click:release') {
			this.uiState.isClicking.set(false)
		}
		this.uiState.clickData.set(data)
		const uiEvent = `ui:${event}` as UiClickSignal
		app.Events.emit(uiEvent, data)
	}


	private isBrowser = typeof document !== 'undefined'

	public sidebarSetWidth(ID: string | number, newWidth?: number | string | null): number | string {
		if (!this.isBrowser) return newWidth ?? 0

		const query = `--sidebar-${ID.toString()}-width`

		if (newWidth == undefined) {
			newWidth = this.sidebarGetDefaultWidth(ID)
		}

		const cssValue = typeof newWidth === 'string' ? newWidth : `${newWidth}px`
		const isHidden = newWidth === 0 || newWidth === '0' || newWidth === '0px'
		
		document.documentElement.style.setProperty(query, cssValue)

		const sidebarElement = document.querySelector<HTMLElement>(`.sidebar-${ID.toString()}`)
		if (sidebarElement) {
			sidebarElement.classList.toggle('sidebar-hidden', isHidden)
		}
		return newWidth
	}

	public sidebarGetWidth(ID: string | number): number {
		if (!this.isBrowser) return 0
		const query = `--sidebar-${ID.toString()}-width`
		const value = getComputedStyle(document.documentElement).getPropertyValue(query)
		return parseInt(value) || 0
	}

	public sidebarGetDefaultWidth(ID: string | number): number {
		if (!this.isBrowser) return 0
		const query = `--sidebar-${ID.toString()}-default-width`
		const value = getComputedStyle(document.documentElement).getPropertyValue(query)
		return parseInt(value) || 0
	}

	public sidebarSetContent(ID: 1 | 2, component: ComponentType<SvelteComponent>, props?: Record<string, any>, width?: number | string, minWidth?: number | string) {
		const store = ID === 1 ? this.uiState.sidebar1 : this.uiState.sidebar2
		store.set({ component, props })
		// Defer width setting to ensure DOM/CSS is ready on refresh
		requestAnimationFrame(() => {
			this.sidebarSetWidth(ID, width ?? this.sidebarGetDefaultWidth(ID))
			if (minWidth !== undefined) {
				const minQuery = `--sidebar-${ID}-min-width`
				const minValue = typeof minWidth === 'string' ? minWidth : `${minWidth}px`
				document.documentElement.style.setProperty(minQuery, minValue)
			}
		})
	}

	public sidebarClearContent(ID: 1 | 2) {
		const store = ID === 1 ? this.uiState.sidebar1 : this.uiState.sidebar2
		store.set(null)
		this.sidebarSetWidth(ID, 0)
		document.documentElement.style.removeProperty(`--sidebar-${ID}-min-width`)
	}

	public sidebarInit() {
		this.sidebarSetWidth(1, 0)
		this.sidebarSetWidth(2, 0)
	}
}