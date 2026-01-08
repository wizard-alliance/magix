import { writable, get } from 'svelte/store'

type WritableStore<T> = ReturnType<typeof writable<T>>

type Target = Record<string, any>

type ReactiveFn = {
	<T>(initialValue: T): WritableStore<T>
	<T>(target: Target, key: string, initialValue: T): WritableStore<T>
}

const attachProperty = <T>(target: Target, key: string, store: WritableStore<T>) => {
	Object.defineProperty(target, key, {
		get: () => get(store),
		set: value => store.set(value),
		enumerable: true,
		configurable: true,
	})
	return store
}

export const Reactive: ReactiveFn = <T>(arg1: Target | T, arg2?: string, arg3?: T) => {
	if (typeof arg1 === 'object' && typeof arg2 === 'string') {
		const target = arg1 as Target
		const store = writable(arg3 as T)
		return attachProperty(target, arg2, store)
	}

	return writable(arg1 as T)
}