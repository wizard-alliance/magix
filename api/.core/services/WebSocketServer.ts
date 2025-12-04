import { WebSocketServer, WebSocket } from 'ws'
import { EventEmitter } from 'node:events'

class EventClass extends EventEmitter { constructor() { super() } }
const Events = new EventClass()

export class WebSocketServerManager {
	private wss: WebSocketServer | null = null
	private clients = new Set<WebSocket>()
	public port = Number(api.Config('WS_PORT') || 4050)
	public path = api.Config('WS_PATH') || ''
	public baseUrl = api.Config('WS_URL') || ``
	public url = `${this.baseUrl}:${this.port}${this.path}`
	public enabled = api.Config('WS_ENABLED') == 'true' && this.baseUrl !== ''
	private prefix = 'WebSocket'

	constructor() {
		if(!this.enabled) {
			api.Error('WebSocket server is disabled or WS_URL is not set in config.', this.prefix)
			return
		}

		this.start()
	}

	start() {
		this.wss = new WebSocketServer({ port: this.port })

		this.wss.on(`connection`, (ws) => {
			this.clients.add(ws)

			api.Success(`Client connected  |  Total: ${this.clients.size}`, this.prefix)

			ws.on(`message`, (data) => {
				const message = JSON.parse(data.toString())
				this.handleMessage(ws, message)
			})

			ws.on(`close`, () => {
				this.clients.delete(ws)
				api.Warning(`Client disconnected  |  Total: ${this.clients.size}`, this.prefix)
			})
		})
	}

	private handleMessage(ws: WebSocket, message: any) {
		// api.Log(`Received: ${JSON.stringify(message)}`, this.prefix)
		if (message?.eventType) {
			this.emit(message.eventType, { ws, payload: message.payload })
		}
	}
	
	broadcast(eventType: string, payload: any) {
		const message = JSON.stringify({ eventType, payload })

		this.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(message)
			}
		})
	}

	send(ws: WebSocket, eventType: string, payload: any) {
		if (ws.readyState === WebSocket.OPEN) {
			ws.send(JSON.stringify({ eventType, payload }))
		}
	}

	close() {
		this.wss?.close()
		api.Log('WebSocket server closed', this.prefix)
	}

	emit(eventType: string, data: any) {
		return Events.emit(eventType, data)
	}

	on(eventType: string, handler: (data: any) => void) {
		return Events.on(eventType, handler)
	}

	off(eventType: string, handler: (data: any) => void) {
		return Events.off(eventType, handler)
	}

	once(eventType: string, handler: (data: any) => void) {
		return Events.once(eventType, handler)
	}
}