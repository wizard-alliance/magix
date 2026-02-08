import type { WebSocketClient } from '../System/WebSocket'
import type { EventManager } from '../Events/EventManager'
import type { AppLogEntry, LoggerType } from '../../types/types'
import { Log, ErrorLog, WarningLog, SuccessLog } from './Log'

type LoggerResponse = {
	action: string
	requestId: string
	entries?: AppLogEntry[]
	count?: number
}

type LoggerDeps = {
	ws: WebSocketClient
	events: EventManager
}

export class AppLogger {
	private readonly pending = new Map<string, (payload: LoggerResponse) => void>()

	constructor(private readonly deps: LoggerDeps) {
		this.deps.events.on('logger:app:response', this.handleResponse)
	}

	set(content: unknown, prefix?: string, type?: LoggerType, append?: boolean) {
		const payload = {
			content,
			prefix,
			type: type ?? 'generic',
			append,
		}

		this.printToConsole(payload.content, payload.prefix, payload.type)
		this.send('logger:app:set', payload)
	}

	async get(limit = 50) {
		const response = await this.request('logger:app:get', { limit })
		return response.entries ?? []
	}

	async size() {
		const response = await this.request('logger:app:size')
		return response.count ?? 0
	}

	async clear() {
		await this.request('logger:app:clear')
	}

	private send(eventType: string, payload: Record<string, unknown>) {
		if (!this.deps.ws.connected) return
		this.deps.ws.send(eventType, payload)
	}

	private async request(eventType: string, payload: Record<string, unknown> = {}) {
		if (!this.deps.ws.connected) throw new Error('WebSocket disconnected')

		const requestId = this.createRequestId()
		const responsePromise = new Promise<LoggerResponse>((resolve) => {
			this.pending.set(requestId, resolve)
		})

		this.deps.ws.send(eventType, { ...payload, requestId })

		return responsePromise
	}

	private handleResponse = (payload: LoggerResponse) => {
		if (!payload?.requestId) return
		const resolver = this.pending.get(payload.requestId)
		if (!resolver) return
		this.pending.delete(payload.requestId)
		resolver(payload)
	}

	private printToConsole(content: unknown, prefix?: string, type: LoggerType = 'generic') {
		const normalizedPrefix = prefix?.trim().length ? prefix.trim() : 'App'
		const normalizedContent = this.stringifyContent(content)

		if (type === 'error') {
			ErrorLog(normalizedContent, normalizedPrefix)
			return
		}

		if (type === 'warning') {
			WarningLog(normalizedContent, normalizedPrefix)
			return
		}

		if (type === 'success') {
			SuccessLog(normalizedContent, normalizedPrefix)
			return
		}

		Log(normalizedContent, normalizedPrefix)
	}

	private stringifyContent(content: unknown) {
		if (content === null) return 'null'
		if (content === undefined) return 'undefined'

		if (typeof content === 'string') return content
		if (typeof content === 'number' || typeof content === 'boolean' || typeof content === 'bigint') {
			return `${content}`
		}

		if (content instanceof Error) {
			return content.stack ?? content.message
		}

		try {
			return JSON.stringify(content, null, 2)
		} catch (error) {
			return `Unserializable content: ${error}`
		}
	}

	private createRequestId() {
		if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
			return crypto.randomUUID()
		}
		return `${Date.now()}-${Math.random().toString(16).slice(2)}`
	}

}
