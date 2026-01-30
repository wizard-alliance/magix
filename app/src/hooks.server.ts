import type { HandleServerError } from '@sveltejs/kit'
import { dev } from '$app/environment'

export const handleError: HandleServerError = ({ error, event }) => {
	const message = error instanceof Error ? error.message : String(error)
	const stack = error instanceof Error ? error.stack ?? null : null
	const payload = {
		url: event.url?.href ?? event.url.toString(),
		method: event.request.method,
		message,
		stack
	}
	console.error('[😭 SvelteKit] SSR error', payload)
	return {
		message: dev ? payload.message : 'Internal Error'
	}
}
