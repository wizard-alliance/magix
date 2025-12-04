import type { 
	TickChannel, TickHandler, TickPayload, 
	TickTimerState
} from '../types/types.js'

const secondMs = 1000
const minuteMs = 60 * secondMs
const hourMs = 60 * minuteMs
const dayMs = 24 * hourMs
const weekMs = 7 * dayMs
const monthMs = 30 * dayMs

const tickChannels: TickChannel[] = [
	{ event: 'tick:30ms', intervalMs: 30 },
	{ event: 'tick:60ms', intervalMs: 60 },
	{ event: 'tick:125ms', intervalMs: 125 },
	{ event: 'tick:250ms', intervalMs: 250 },
	{ event: 'tick:500ms', intervalMs: 500 },
	{ event: 'tick:1s', intervalMs: 1 * secondMs },
	{ event: 'tick:2s', intervalMs: 2 * secondMs },
	{ event: 'tick:3s', intervalMs: 3 * secondMs },
	{ event: 'tick:4s', intervalMs: 4 * secondMs },
	{ event: 'tick:5s', intervalMs: 5 * secondMs },
	{ event: 'tick:10s', intervalMs: 10 * secondMs },
	{ event: 'tick:15s', intervalMs: 15 * secondMs },
	{ event: 'tick:20s', intervalMs: 20 * secondMs },
	{ event: 'tick:30s', intervalMs: 30 * secondMs },
	{ event: 'tick:1min', intervalMs: minuteMs },
	{ event: 'tick:5min', intervalMs: 5 * minuteMs },
	{ event: 'tick:10min', intervalMs: 10 * minuteMs },
	{ event: 'tick:15min', intervalMs: 15 * minuteMs },
	{ event: 'tick:20min', intervalMs: 20 * minuteMs },
	{ event: 'tick:30min', intervalMs: 30 * minuteMs },
	{ event: 'tick:1h', intervalMs: hourMs },
	{ event: 'tick:1.5h', intervalMs: 1.5 * hourMs },
	{ event: 'tick:2h', intervalMs: 2 * hourMs },
	{ event: 'tick:3h', intervalMs: 3 * hourMs },
	{ event: 'tick:4h', intervalMs: 4 * hourMs },
	{ event: 'tick:5h', intervalMs: 5 * hourMs },
	{ event: 'tick:6h', intervalMs: 6 * hourMs },
	{ event: 'tick:12h', intervalMs: 12 * hourMs },
	{ event: 'tick:1d', intervalMs: dayMs },
	{ event: 'tick:2d', intervalMs: 2 * dayMs },
	{ event: 'tick:4d', intervalMs: 4 * dayMs },
	{ event: 'tick:1w', intervalMs: weekMs },
	{ event: 'tick:2w', intervalMs: 2 * weekMs },
	{ event: 'tick:3w', intervalMs: 3 * weekMs },
	{ event: 'tick:1m', intervalMs: monthMs },
	{ event: 'tick:2m', intervalMs: 2 * monthMs },
	{ event: 'tick:3m', intervalMs: 3 * monthMs },
	{ event: 'tick:6m', intervalMs: 6 * monthMs },
]

export class Tickrate {
	private readonly timers = new Map<string, TickTimerState>()
	private readonly maxStepMs = 60 * 1000
	private readonly listeners = new Map<string, Set<TickHandler>>()
	private running = false

	constructor(channels: TickChannel[] = tickChannels) {
		const now = Date.now()
		channels.forEach(config => {
			this.timers.set(config.event, {
				config,
				intervalHandle: null,
				stepMs: Math.min(config.intervalMs, this.maxStepMs),
				remainingMs: config.intervalMs,
				lastRunMs: now,
				lastBroadcastMs: now,
			})
		})
		this.start()
	}

	start(): void {
		if (this.running) return
		this.running = true
		for (const state of this.timers.values()) {
			this.startTimer(state)
		}
	}

	stop(): void {
		if (!this.running) return
		this.running = false
		for (const state of this.timers.values()) {
			if (state.intervalHandle) {
				clearInterval(state.intervalHandle)
				state.intervalHandle = null
			}
		}
	}

	private startTimer(state: TickTimerState) {
		if (state.intervalHandle) return
		const now = Date.now()
		state.stepMs = Math.min(state.config.intervalMs, this.maxStepMs)
		state.remainingMs = state.config.intervalMs
		state.lastRunMs = now
		state.lastBroadcastMs = now
		const run = () => {
			const current = Date.now()
			const elapsed = current - state.lastRunMs
			state.lastRunMs = current
			state.remainingMs -= elapsed
			if (state.remainingMs > 0) return
			const deltaMs = current - state.lastBroadcastMs
			state.lastBroadcastMs = current
			this.broadcastTick(state.config.event, state.config.intervalMs, deltaMs)
			state.remainingMs = state.config.intervalMs
		}
		state.intervalHandle = setInterval(run, state.stepMs)
	}

	private broadcastTick(event: string, intervalMs: number, deltaMs: number): void {
		const payload: TickPayload = {
			intervalMs,
			intervalSeconds: intervalMs / 1000,
			deltaMs,
			timestamp: Date.now(),
		}
		api.WS.broadcast(event, payload)
		this.emitTickEvent(event, payload)
	}

	Event(event: string, handler: TickHandler): () => void {
		if (!this.listeners.has(event)) this.listeners.set(event, new Set())
		this.listeners.get(event)!.add(handler)
		return () => this.unsetEvent(event, handler)
	}

	unsetEvent(event: string, handler: TickHandler): void {
		const handlers = this.listeners.get(event)
		if (!handlers) return
		handlers.delete(handler)
		if (!handlers.size) this.listeners.delete(event)
	}

	private emitTickEvent(event: string, payload: TickPayload): void {
		const handlers = this.listeners.get(event)
		if (!handlers?.size) return
		for (const handler of handlers) {
			try {
				handler(payload)
			} catch (error) {
				this.logHandlerError(event, error)
			}
		}
	}

	private logHandlerError(event: string, error: unknown): void {
		const message = error instanceof Error ? error.message : String(error)
		if (typeof api?.Error === 'function') {
			api.Error(`Tick handler for ${event} failed: ${message}`, 'Tickrate')
			return
		}
		console.error(`[Tickrate] Tick handler for ${event} failed: ${message}`)
	}
}