import { app } from '../app.js'
import { PUBLIC_WS_URL } from '$env/static/public';

const tickEventNames = [
	'tick:100ms',
	'tick:200ms',
	'tick:500ms',
	'tick:1s',
	'tick:5s',
	'tick:10s',
	'tick:1min',
	'tick:5min',
	'tick:10min',
	'tick:15min',
	'tick:20min',
	'tick:30min',
	'tick:1h',
	'tick:1.5h',
	'tick:2h',
	'tick:3h',
	'tick:4h',
	'tick:5h',
	'tick:6h',
	'tick:12h',
	'tick:1d',
	'tick:2d',
	'tick:4d',
	'tick:1w',
	'tick:2w',
	'tick:3w',
	'tick:1m',
	'tick:2m',
	'tick:3m',
	'tick:6m',
] as const

type TickEventName = typeof tickEventNames[number]

type TickPayload = {
	intervalMs: number
	intervalSeconds: number
	deltaMs: number
	timestamp: number
}

let WS: typeof WebSocket

if (typeof globalThis.WebSocket !== 'undefined') {
	WS = globalThis.WebSocket
} else {
	const { WebSocket: NodeWebSocket } = await import('ws')
	WS = NodeWebSocket as unknown as typeof WebSocket
}


export class WebSocketClient {
	private readonly prefix = 'WSClient'
	private socket: WebSocket | null = null
	private reconnectAttempts = 0
	private maxReconnectAttempts = 5
	private reconnectTimeout: any | number | null = null
	private url: string = PUBLIC_WS_URL || 'ws://localhost:4050/ws'
	private readonly tickEvents = new Set<TickEventName>(tickEventNames as unknown as TickEventName[])

	constructor() {
		this.connect(this.url)
	}

	get connected() {
		return this.socket?.readyState === WebSocket.OPEN
	}

	connect(url: string) {
		this.url = url
		this.socket = new WS(url)

		this.socket.onopen = () => {
			app.$.Log(`WebSocket connected: ${this.url}`, this.prefix)
			this.reconnectAttempts = 0
		}

		this.socket.onmessage = event => this.handleIncomingMessage(event.data)

		this.socket.onclose = () => this.handleReconnect()
		this.socket.onerror = (error) => {
			app.$.Error(`WebSocket error: ${error}`, this.prefix)
			console.log(error)
		}
	}

	private handleReconnect() {
		if (this.reconnectAttempts < this.maxReconnectAttempts) {
			this.reconnectAttempts++
			const delay = 1000 * this.reconnectAttempts
			this.reconnectTimeout = setTimeout(() => this.connect(this.url), delay)
		}
	}

	private handleIncomingMessage(raw: string) {
		const data = this.safeParse(raw)
		if (!data) return
		const eventType = data.eventType || data.type
		if (!eventType) return

		if (this.isTickEvent(eventType)) {
			this.emitTick(eventType, data.payload)
			return
		}

		app.Events.emit(eventType as any, data.payload)
	}

	private safeParse(raw: string) {
		try {
			return JSON.parse(raw)
		} catch (error) {
			app.$.Error(`WebSocket parse error`, this.prefix)
			return null
		}
	}

	private isTickEvent(eventType: string): eventType is TickEventName {
		return this.tickEvents.has(eventType as TickEventName)
	}

	private emitTick(eventType: TickEventName, payload?: Partial<TickPayload>) {
		const data = payload ?? {}
		const tickPayload: TickPayload = {
			intervalMs: data.intervalMs ?? 0,
			intervalSeconds: data.intervalSeconds ?? ((data.intervalMs ?? 0) / 1000),
			deltaMs: data.deltaMs ?? 0,
			timestamp: data.timestamp ?? Date.now(),
		}
		app.Events.emit(eventType as any, tickPayload)
	}

	send(eventType: string, payload: any) {
		if (this.socket?.readyState === WebSocket.OPEN) {
			this.socket.send(JSON.stringify({ eventType, payload }))
		}
	}

	disconnect() {
		if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout)
		this.socket?.close()
	}
}