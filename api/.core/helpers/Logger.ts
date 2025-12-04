import fs from 'node:fs'
import path from 'node:path'

export type LoggerType = 'generic' | 'success' | 'warning' | 'error'

export type LoggerEntry = {
	timestamp: string
	prefix: string
	type: LoggerType
	content: string
	line: string
	raw: unknown
}

type LoggerConfig = {
	basePath?: string
	scope: 'api' | 'app'
	label?: string
	maxEntries?: number
}

export class Logger {
	private cache: LoggerEntry[] = []
	private readonly path: string
	private readonly filePath: string
	private readonly label: string
	private readonly maxEntries: number

	constructor(config: LoggerConfig) {
		this.label = config.label ?? config.scope.toUpperCase()
		this.maxEntries = config.maxEntries ?? 500
		const basePath = config.basePath || 'logs'
		this.path = path.join(process.cwd(), basePath, config.scope)
		this.filePath = path.join(this.path, `${config.scope}.log`)

		this.ensureFile()
	}

	get(limit = 50) {
		return this.cache.slice(-limit)
	}

	set(content: unknown, prefix?: string, type?: LoggerType, appendOption?: boolean) {
		const entry = this.createEntry(content, prefix, type)
		const serialized = `${entry.line}\n`
		const append = appendOption ?? true

		if (append) {
			fs.appendFileSync(this.filePath, serialized, 'utf8')
		} else {
			this.cache = []
			fs.writeFileSync(this.filePath, serialized, 'utf8')
		}

		this.push(entry)

		return entry
	}

	clear() {
		this.cache = []
		fs.writeFileSync(this.filePath, '', 'utf8')
	}

	size() {
		return this.cache.length
	}

	private ensureFile() {
		const folder = path.dirname(this.filePath)
		fs.mkdirSync(folder, { recursive: true })
		if (!fs.existsSync(this.filePath)) {
			fs.writeFileSync(this.filePath, '', 'utf8')
		}
	}

	private push(entry: LoggerEntry) {
		this.cache.push(entry)
		if (this.cache.length > this.maxEntries) {
			this.cache = this.cache.slice(-this.maxEntries)
		}
	}

	private createEntry(content: unknown, prefixValue?: string, typeValue?: LoggerType): LoggerEntry {
		const timestamp = this.formatTimestamp()
		const type = typeValue ?? 'generic'
		const providedPrefix = typeof prefixValue === 'string' ? prefixValue.trim() : ''
		const prefix = providedPrefix.length ? providedPrefix : this.label
		const formattedContent = this.formatContent(content)
		const headerSegments = [
			`[${timestamp}]`,
			`[${prefix}]`,
		]

		if (type !== 'generic') {
			headerSegments.push(`[${type.toUpperCase()}]`)
		}

		const header = headerSegments.join(' ')
		const line = `${header} ${formattedContent}`.trim()

		return {
			timestamp,
			prefix,
			type,
			content: formattedContent,
			line,
			raw: content,
		}
	}

	private formatTimestamp() {
		return new Date().toISOString().slice(11, 19)
	}

	private formatContent(content: unknown) {
		if (content === undefined) return 'undefined'
		if (content === null) return 'null'

		if (typeof content === 'string') {
			return content.trim()
		}

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
}

export const registerAppLoggerBridge = (appLogger: Logger) => {
	if (!api.WS.enabled) return

	api.WS.on("logger:app:set", ({ payload }: any) => {
		if (!payload) return
		appLogger.set(payload.content, payload.prefix, payload.type, payload.append)
	})

	api.WS.on("logger:app:get", ({ ws, payload }: any) => {
		const limit = Number(payload?.limit ?? 50)
		const entries = serializeLoggerEntries(appLogger.get(limit))
		sendAppLoggerResponse(ws, "get", payload?.requestId, { entries })
	})

	api.WS.on("logger:app:size", ({ ws, payload }: any) => {
		const count = appLogger.size()
		sendAppLoggerResponse(ws, "size", payload?.requestId, { count })
	})

	api.WS.on("logger:app:clear", ({ ws, payload }: any) => {
		appLogger.clear()
		sendAppLoggerResponse(ws, "clear", payload?.requestId)
	})
}

const sendAppLoggerResponse = (ws: any, action: string, requestId?: string, data: Record<string, unknown> = {}) => {
	if (!requestId) return
	api.WS.send(ws, "logger:app:response", {
		action,
		requestId,
		...data,
	})
}

const serializeLoggerEntries = (entries: ReturnType<Logger['get']>) => {
	return entries.map((entry) => ({
		timestamp: entry.timestamp,
		prefix: entry.prefix,
		type: entry.type,
		content: entry.content,
		line: entry.line,
	}))
}
