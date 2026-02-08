import { writable, get, type Writable } from 'svelte/store'

import type { ComponentType, SvelteComponent } from 'svelte'

type DragPayload = DragEvent | PointerEvent | MouseEvent | Record<string, unknown> | null | undefined
type ClickPayload = MouseEvent | PointerEvent | Record<string, unknown> | null | undefined

type SidebarContent = { component: ComponentType<SvelteComponent>, props?: Record<string, any> } | null

type SidebarConfig = Record<number, boolean | null | undefined>

type UiStateStores = {
	isDragging: Writable<boolean>
	dragData: Writable<DragPayload | null>
	isClicking: Writable<boolean>
	clickData: Writable<ClickPayload | null>
	sidebar1: Writable<SidebarContent>
	sidebar2: Writable<SidebarContent>
	sidebar0Visible: Writable<boolean>
	sidebar1Visible: Writable<boolean>
	sidebar2Visible: Writable<boolean>
	notificationsOpen: Writable<boolean>
	menuOpen: Writable<boolean>
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
		const uiState = app.State.UI ?? {}
		
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

		if (!uiState.sidebar0Visible) {
			uiState.sidebar0Visible = writable(true)
		}

		if (!uiState.sidebar1Visible) {
			uiState.sidebar1Visible = writable(true)
		}

		if (!uiState.sidebar2Visible) {
			uiState.sidebar2Visible = writable(false)
		}

		if (!uiState.notificationsOpen) {
			uiState.notificationsOpen = writable(false)
		}

		if (!uiState.menuOpen) {
			uiState.menuOpen = writable(false)
		}

		app.State.UI = uiState
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
		app.Helpers.Log('Drag started', 'UI')
		app.Events.emit('ui:drag:start', data)
	}

	private handleDragEnd(payload: DragPayload) {
		const data = payload ?? null
		this.uiState.isDragging.set(false)
		this.uiState.dragData.set(null)
		app.Helpers.Log('Drag stopped', 'UI')
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

	// Sidebar visibility API

	public hideSidebar(id: 0 | 1 | 2) {
		const store = [this.uiState.sidebar0Visible, this.uiState.sidebar1Visible, this.uiState.sidebar2Visible][id]
		store.set(false)
	}

	public showSidebar(id: 0 | 1 | 2) {
		const store = [this.uiState.sidebar0Visible, this.uiState.sidebar1Visible, this.uiState.sidebar2Visible][id]
		store.set(true)
	}

	public hideAllSidebars() {
		this.uiState.sidebar0Visible.set(false)
		this.uiState.sidebar1Visible.set(false)
		this.uiState.sidebar2Visible.set(false)
		this.closeNotifications()
		this.closeMenu()
	}

	public showAllSidebars() {
		this.uiState.sidebar0Visible.set(true)
		this.uiState.sidebar1Visible.set(true)
		this.uiState.sidebar2Visible.set(true)
	}

	public showDefaultSidebars() {
		this.uiState.sidebar0Visible.set(true)
		this.uiState.sidebar1Visible.set(true)
		this.uiState.sidebar2Visible.set(false)
		this.closeNotifications()
		this.closeMenu()
	}

	public applySidebarConfig(config?: SidebarConfig | null) {
		if (!config) return this.showDefaultSidebars()
		const resolve = (val: boolean | null | undefined) => val !== false && val !== null
		if (0 in config) this.uiState.sidebar0Visible.set(resolve(config[0]))
		if (1 in config) this.uiState.sidebar1Visible.set(resolve(config[1]))
		if (2 in config) this.uiState.sidebar2Visible.set(resolve(config[2]))
	}

	// Menu & notifications toggles

	public toggleMenu() {
		const isOpen = get(this.uiState.menuOpen)
		this.uiState.menuOpen.set(!isOpen)
		if (!isOpen) this.closeNotifications()
	}

	public toggleNotifications() {
		const isOpen = get(this.uiState.notificationsOpen)
		this.uiState.notificationsOpen.set(!isOpen)
		if (!isOpen) this.closeMenu()
	}

	public closeMenu() {
		this.uiState.menuOpen.set(false)
	}

	public closeNotifications() {
		this.uiState.notificationsOpen.set(false)
	}

	// Sidebar width helpers (for dynamic resizing)

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

		// Sync visibility store when width is set to 0
		const numId = Number(ID)
		if (numId === 0 || numId === 1 || numId === 2) {
			const store = [this.uiState.sidebar0Visible, this.uiState.sidebar1Visible, this.uiState.sidebar2Visible][numId]
			store.set(!isHidden)
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
}