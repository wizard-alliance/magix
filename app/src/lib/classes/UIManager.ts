import { writable, type Writable } from 'svelte/store'
import { app } from '../app.js'

type DragPayload = DragEvent | PointerEvent | MouseEvent | Record<string, unknown> | null | undefined
type ClickPayload = MouseEvent | PointerEvent | Record<string, unknown> | null | undefined

type UiStateStores = {
	isDragging: Writable<boolean>
	dragData: Writable<DragPayload | null>
	isClicking: Writable<boolean>
	clickData: Writable<ClickPayload | null>
}

type UiClickEventName = 'click' | 'click:double' | 'click:down' | 'click:release'
type UiClickSignal = `ui:${UiClickEventName}`

export class UIManager {
	private uiState: UiStateStores
	private originalWidths: Record<string, number> = {}

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


	public sidebarSetWidth(ID: string | number, newWidth?: number | null): number {
		const query = `--sidebar-${ID.toString()}-width`
		
		if( !this.originalWidths[ID]) {
			this.originalWidths[ID] = this.sidebarGetWidth(ID)
		}

		if (newWidth == undefined) {
			newWidth = this.originalWidths[ID] || 0
		}
		
		document.documentElement.style.setProperty(query, `${newWidth}px`)

		// If sidebar width <=0 then set border width to 0, if not to 1px
		const nodeQuery = `.sidebar-${ID.toString()}`
		const sidebarElement = document.querySelector<HTMLElement>(nodeQuery)
		if (sidebarElement && newWidth <= 0) {
			sidebarElement.style.borderWidth = '0px'
		}
		else if (sidebarElement) {
			sidebarElement.style.borderWidth = '1px'
		}
		return newWidth
	}

	public sidebarGetWidth(ID: string | number): number {
		const query = `--sidebar-${ID.toString()}-width`
		const value = getComputedStyle(document.documentElement).getPropertyValue(query)
		const parsedValue = parseInt(value) || 0
		if (!this.originalWidths[ID]) {
			this.originalWidths[ID] = parsedValue
		}
		return parsedValue
	}

	public sidebarGetOriginalWidth(ID: string | number): number {
		if( this.originalWidths[ID] === undefined ) {
			this.originalWidths[ID] = this.sidebarGetWidth(ID)
		}
		return this.originalWidths[ID] || 0
	}
}