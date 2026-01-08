import type { AppLogEntry } from '../../types/types'

type DragPayload = DragEvent | PointerEvent | MouseEvent | Record<string, unknown> | null | undefined
type ClickPayload = MouseEvent | PointerEvent | Record<string, unknown> | null | undefined
type StatusPayload = { tab?: string | null, characterId?: number | null } | null

type AppEvents = {
	'drag:start': DragPayload
	'drag:end': DragPayload
	'drag:cancel': DragPayload
	'drag:move': DragPayload
	'drop': DragPayload
	
	'ui:drag:start': DragPayload
	'ui:drag:end': DragPayload
	'ui:drag:cancel': DragPayload
	'ui:drag:move': DragPayload
	'ui:drop': DragPayload

	'click': ClickPayload
	'click:double': ClickPayload
	'click:down': ClickPayload
	'click:release': ClickPayload

	'ui:click': ClickPayload
	'ui:click:double': ClickPayload
	'ui:click:down': ClickPayload
	'ui:click:release': ClickPayload

	'status:open': StatusPayload
	'status:close': StatusPayload
	'status:tab': { tab?: string | null, characterId?: number | null }

	'logger:app:response': { action: string, requestId: string, entries?: AppLogEntry[], count?: number }
	'datetime': Record<string, unknown>
}

type Handler<T> = (payload: T) => void

export class EventManager {
	private listeners = new Map<keyof AppEvents, Set<Handler<any>>>()

	readonly signals = {
		dragStart: this.createSignal('drag:start'),
		dragEnd: this.createSignal('drag:end'),
		dragCancel: this.createSignal('drag:cancel'),
		dragMove: this.createSignal('drag:move'),
		drop: this.createSignal('drop'),
		
		uiDragStart: this.createSignal('ui:drag:start'),
		uiDragEnd: this.createSignal('ui:drag:end'),
		uiDragCancel: this.createSignal('ui:drag:cancel'),
		uiDragMove: this.createSignal('ui:drag:move'),
		uiDrop: this.createSignal('ui:drop'),
		
		click: this.createSignal('click'),
		clickDouble: this.createSignal('click:double'),
		clickDown: this.createSignal('click:down'),
		clickRelease: this.createSignal('click:release'),
		
		uiClick: this.createSignal('ui:click'),
		uiClickDouble: this.createSignal('ui:click:double'),
		uiClickDown: this.createSignal('ui:click:down'),
		uiClickRelease: this.createSignal('ui:click:release'),
	}

	on<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>) {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set())
		this.listeners.get(event)!.add(handler)
		return () => this.off(event, handler)
	}

	off<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>) {
		const handlers = this.listeners.get(event)
		if (!handlers) return
		handlers.delete(handler)
		if (!handlers.size) this.listeners.delete(event)
	}

	once<K extends keyof AppEvents>(event: K, handler: Handler<AppEvents[K]>) {
		const wrapped: Handler<AppEvents[K]> = payload => {
			this.off(event, wrapped)
			handler(payload)
		}
		return this.on(event, wrapped)
	}

	emit<K extends keyof AppEvents>(event: K, payload?: AppEvents[K]) {
		this.listeners.get(event)?.forEach(listener => listener(payload))
	}

	clear(event?: keyof AppEvents) {
		if (event) {
			this.listeners.delete(event)
			return
		}
		this.listeners.clear()
	}

	private createSignal<K extends keyof AppEvents>(event: K) {
		return {
			on: (handler: Handler<AppEvents[K]>) => this.on(event, handler),
			once: (handler: Handler<AppEvents[K]>) => this.once(event, handler),
			off: (handler: Handler<AppEvents[K]>) => this.off(event, handler),
			emit: (payload: AppEvents[K]) => this.emit(event, payload),
		}
	}
}