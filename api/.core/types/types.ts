

/**
 * Types: OpenRouter
 */
export type ORConfig = {
	model: string
	temperature: number
	maxTokens: number
	maxThinkingTokens: number
}

export type ORCompletionResults = {
	message: string
	thoughts?: string
	reasoning?: string
	response: any
	usage: any
}

export type ORMessage = {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string
	encapsulate?: string
}

/**
 * Types: Tickrate
 */
export type TickChannel = {
	event: string
	intervalMs: number
}

export type TickTimerState = {
	config: TickChannel
	intervalHandle: ReturnType<typeof setInterval> | null
	stepMs: number
	remainingMs: number
	lastRunMs: number
	lastBroadcastMs: number
}

export type TickPayload = {
	intervalMs: number
	intervalSeconds: number
	deltaMs: number
	timestamp: number
}

export type TickHandler = (payload: TickPayload) => void
