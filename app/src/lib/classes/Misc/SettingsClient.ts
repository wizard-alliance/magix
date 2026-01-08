import { get, writable, type Writable } from "svelte/store"
import { app } from "../../app.js"
import type { SettingsMap, SettingsResponse } from "$lib/types/types"

export class SettingsClient {
	private readonly tableName = ""
	private readonly prefix = "SettingsClient"
	private readonly store: Writable<SettingsMap>
	private readonly initial: SettingsMap
	private loading: Promise<SettingsMap> | null = null
	private ready = false

	constructor(initialValues?: SettingsMap) {
		this.initial = initialValues ?? {}
		this.store = writable<SettingsMap>(this.initial)
	}

	isReady = () => this.ready

	subscribe(run: (value: SettingsMap) => void) {
		return this.store.subscribe(run)
	}

	getAll = () => get(this.store)

	get = (key: string, fallback?: string) => {
		const all = this.getAll()
		return all[key] ?? fallback ?? ""
	}

	private apply(values: SettingsMap, markReady = false) {
		this.store.set(values)
		if (markReady) {
			this.ready = true
		}
	}

	private toMap(response: SettingsResponse | null): SettingsMap {
		if (!response) {
			return { ...this.initial }
		}
		return response.settings.reduce<SettingsMap>((acc, item) => {
			acc[item.key] = item.value
			return acc
		}, {})
	}

	async load(): Promise<SettingsMap> {
		if (this.loading) {
			return this.loading
		}

		this.loading = (async () => {
			try {
				const payload = await app.Request.get<SettingsResponse | null>('/settings', {
					useAuth: false,
					allowRefresh: false,
				})
				const map = this.toMap(payload)
				this.apply(map, true)
				return map
			} catch (error) {
				console.warn(
					`${this.prefix}: Failed to load settings ${(error as Error)?.message ?? error}`
				)
				this.apply({ ...this.initial })
				return { ...this.initial }
			} finally {
				this.loading = null
			}
		})()

		return this.loading
	}
}
