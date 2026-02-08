import type { Request } from "express"
import { CrudMethods } from "../services/CrudMethods.js"

import type { GlobalSettingDBRow } from "../schema/Database.js"
import type { Settings } from "../schema/DomainShapes.js"

export class CacheRoutes {
	private readonly tableName = "global_settings"
	public readonly routeName = "cache"
	public readonly version = api.Config("API_VERSION") || '1'
	private readonly CRUD = new CrudMethods<Settings, GlobalSettingDBRow>()

	private readonly KEYS = {
		version: 'cache_version',
		lastCleared: 'cache_last_cleared',
	}

	public routes = async () => {
		const pub = { protected: false, register: false, tableName: this.tableName }
		const admin = { protected: true, register: false, tableName: this.tableName, perms: ["administrator"] }

		api.Router.set("GET", `${this.routeName}/version`, this.getVersion, pub)
		api.Router.set("GET", `${this.routeName}/status`, this.getStatus, admin)
		api.Router.set("POST", `${this.routeName}/clear`, this.clear, admin)
	}

	// Ensure a setting row exists, auto-create if missing
	private ensureSetting = async (key: string, defaultValue: string) => {
		const existing = await this.CRUD.get(this.tableName, { key } as any)
		if (existing) return existing
		await this.CRUD.create(this.tableName, { key, value: defaultValue, autoload: 0 } as any)
		return await this.CRUD.get(this.tableName, { key } as any)
	}

	// GET /cache/version — public, no auth
	getVersion = async () => {
		const versionRow = await this.ensureSetting(this.KEYS.version, '1')
		const clearedRow = await this.ensureSetting(this.KEYS.lastCleared, new Date().toISOString())
		return {
			version: versionRow?.value ?? '1',
			lastCleared: clearedRow?.value ?? null,
		}
	}

	// GET /cache/status — admin only
	getStatus = async () => {
		const versionRow = await this.ensureSetting(this.KEYS.version, '1')
		const clearedRow = await this.ensureSetting(this.KEYS.lastCleared, new Date().toISOString())
		return {
			version: versionRow?.value ?? '1',
			lastCleared: clearedRow?.value ?? null,
			apiCacheSize: api.Cache.size(),
		}
	}

	// POST /cache/clear — admin only
	clear = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const target: string = p.body?.target ?? p.query?.target ?? 'all'

		if (!['api', 'browser', 'all'].includes(target)) {
			return { code: 422, error: `Invalid target: ${target}. Use 'api', 'browser', or 'all'.` }
		}

		const now = new Date().toISOString()

		if (target === 'api' || target === 'all') {
			api.Cache.clearAll()
			api.Log(`API cache cleared by admin`, `Cache`)
		}

		if (target === 'browser' || target === 'all') {
			// Increment cache_version in DB
			await this.ensureSetting(this.KEYS.version, '1')
			const current = await this.CRUD.get(this.tableName, { key: this.KEYS.version } as any)
			const nextVersion = String(Number(current?.value || '0') + 1)
			await this.CRUD.update(this.tableName, { value: nextVersion } as any, { key: this.KEYS.version } as any)
			api.Log(`Browser cache version bumped to ${nextVersion}`, `Cache`)
		}

		// Update last cleared timestamp
		await this.ensureSetting(this.KEYS.lastCleared, now)
		await this.CRUD.update(this.tableName, { value: now } as any, { key: this.KEYS.lastCleared } as any)

		// Clear the api cache again after DB writes (the CRUD operations above may have cached)
		api.Cache.clearAll()

		const versionRow = await this.CRUD.get(this.tableName, { key: this.KEYS.version } as any)

		return {
			success: true,
			target,
			version: versionRow?.value ?? '1',
			lastCleared: now,
		}
	}
}
