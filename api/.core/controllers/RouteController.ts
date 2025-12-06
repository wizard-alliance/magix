import { readdir } from "node:fs/promises"
import { join, extname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { sendError, sendSuccess } from "../helpers/ApiResponder.js"
import { schemaColumns } from "../schema/Database.js"
import { requireAuth } from "../middleware/auth.js"

import type { Dirent } from "node:fs"
import type { Application, NextFunction, Request, RequestHandler, Response } from "express"
import type { ApiRoute, HttpMethod,	RouteDefinition, RouteDirectoryEntry } from "../types/routes.js"
import type { $ } from "../types/routes.js"

type RegisterOptions = {
	basePath?: string
	prefix?: string
	exposeDirectory?: boolean
	installFallbacks?: boolean
}

const normalizeMethod = (method: HttpMethod | string): HttpMethod => {
	return method.toUpperCase() as HttpMethod
}

type ApiRouteConstructor = new () => ApiRoute

const buildKey = (method: HttpMethod, path: string) => `${method} ${path}`

export class RouteController {
	private readonly tableName = ""
	private readonly prefix = "RouteController"
	private definitions = new Map<string, RouteDefinition>()
	private modules = new Map<string, ApiRoute>()
	private fallbackInstalled: Boolean = false
	private directoryRegistered: Boolean = false

	public directory: RouteDirectoryEntry[] = []
	public directoryIndex = new Set<string>()

	private readonly defaultOptionKeys = [
		"limit",
		"offset",
		"sort",
		"orderBy",
		"page",
		"max",
		"debug",
	] as const

	add(method: HttpMethod | string, path: string, ...handlers: RequestHandler[]): this {
		const normalizedMethod = normalizeMethod(method)
		if (handlers.length === 0) {
			const key = buildKey(normalizedMethod, path)
			api.Log(`no handlers supplied for ${key}`, this.prefix, "error")
			throw new Error(`Route ${key} must include at least one handler`)
		}

		this.storeDefinition({
			method: normalizedMethod,
			path,
			handlers,
		})
		return this
	}

	mount(route: ApiRoute | ApiRouteConstructor): this {
		const instance: ApiRoute = typeof route === "function" ? new route() : route
		const name = instance.getName()

		this.modules.set(name, instance)
		this.registerRouteDefinitions(instance)
		return this
	}

	has(method: HttpMethod | string, path: string): boolean {
		return this.definitions.has(buildKey(normalizeMethod(method), path))
	}

	register(app: Application, options?: RegisterOptions): RouteDirectoryEntry[] {
		this.directory = []
		this.directoryIndex.clear()
		this.fallbackInstalled = false
		this.directoryRegistered = false
		this.definitions.forEach((def) => {
			const methodKey = normalizeMethod(def.method).toLowerCase()
			const register = (app as any)[methodKey]

			if (typeof register !== "function") {
				api.Error(`unsupported HTTP method ${def.method} for ${def.path}`, this.prefix)
				return
			}

			register.call(app, def.path, ...def.handlers)

			this.addDirectoryEntry({
				method: def.method,
				path: def.path,
				version: def.version,
			})
		})

		const shouldInstallFallbacks = options?.installFallbacks ?? true
		
		if (shouldInstallFallbacks) {
			this.installFallbackHandlers(app, {
				basePath: options?.basePath,
				prefix: options?.prefix ?? this.prefix,
				exposeDirectory: options?.exposeDirectory ?? true,
			})
		}

		return this.getDirectory()
	}

	getDirectory(): RouteDirectoryEntry[] {
		return [...this.directory]
	}

	entries(): Array<{ key: string; route: RouteDefinition }> {
		return Array.from(this.definitions.values()).map((route) => ({
			key: buildKey(route.method, route.path),
			route,
		}))
	}

	async discoverRoutes(directory: URL | string): Promise<void> {
		const directoryPath =
			typeof directory === "string" ? directory : fileURLToPath(directory)
		const entries = await readdir(directoryPath, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(directoryPath, entry.name)
			if (entry.isDirectory()) {
				await this.discoverRoutes(fullPath)
				continue
			}
			if (!this.isRouteFile(entry)) continue

			const moduleUrl = pathToFileURL(fullPath).href
			const module = await import(moduleUrl)
			const candidates = Object.values(module)
			for (const candidate of candidates) {
				const instance = this.instantiateRoute(candidate)
				if (!instance) continue
				if (!this.hasMinimumMetadata(instance)) continue
				this.mount(instance)
			}
		}
	}

	private storeDefinition(definition: RouteDefinition) {
		const guardNeeded = definition.auth || (definition.perms && definition.perms.length)
		const handlers = guardNeeded
			? [requireAuth({ perms: definition.perms }), ...definition.handlers]
			: definition.handlers
		const key = buildKey(definition.method, definition.path)
		if (this.definitions.has(key)) {
			api.Log(
				`replacing existing definition for ${key}`,
				this.prefix,
				"warning"
			)
		}
		this.definitions.set(key, { ...definition, handlers })
	}

	private registerRouteDefinitions(route: ApiRoute) {
		const routeVersion = this.resolveVersion(route)
		route.getDefinitions().forEach((definition) => {
			const effectiveVersion = definition.version ?? routeVersion
			const pathWithVersion = this.buildVersionedPath(
				definition.path,
				effectiveVersion
			)
			this.storeDefinition({
				...definition,
				path: pathWithVersion,
				version: effectiveVersion,
			})
		})
	}

	private resolveVersion(route: ApiRoute): string | undefined {
		if (typeof route.getVersion === "function") {
			const version = route.getVersion()
			if (version) return version
		}
		if (typeof route.version === "string" && route.version.length > 0) {
			return route.version
		}
		return undefined
	}

	private buildVersionedPath(originalPath: string, version?: string): string {
		const base = api.Config("API_BASE_PATH").replace(/\/+$/, "")
		const sanitizedVersion = version
			?.trim()
			.replace(/^\/+|\/+$/g, "")
			.replace(/\s+/g, "")
		const normalizedPath = originalPath.startsWith("/")
			? originalPath.slice(1)
			: originalPath

		if (
			base.length > 0 &&
			(originalPath.startsWith(base) ||
				originalPath.startsWith(`${base}/`))
		) {
			return originalPath
		}

		const segments: string[] = []
		const cleanedBase = base.replace(/^\/+/, "")
		if (cleanedBase.length > 0) {
			segments.push(cleanedBase)
		}
		if (sanitizedVersion) {
			segments.push(sanitizedVersion)
		}
		if (normalizedPath.length > 0) {
			segments.push(normalizedPath)
		}
		const built = segments.join("/")
		const combined = built.length > 0 ? `/${built}` : "/"
		return combined.replace(/\/+/g, "/")
	}

	private addDirectoryEntry(entry: RouteDirectoryEntry) {
		const key = buildKey(entry.method, entry.path)
		if (this.directoryIndex.has(key)) {
			return
		}
		this.directoryIndex.add(key)
		this.directory = [
			...this.directory,
			{
				method: entry.method,
				path: entry.path,
				version: entry.version,
			},
		]
	}

	private scopedDirectory(path: string): RouteDirectoryEntry[] {
		const raw = path.split("?")[0] ?? ""
		const ensured = raw.startsWith("/") ? raw : `/${raw}`
		const collapsed = ensured.replace(/\/+/g, "/")
		const candidates: string[] = []
		if (collapsed.endsWith("/")) {
			candidates.push(collapsed)
		} else {
			candidates.push(`${collapsed}/`)
			const lastSlash = collapsed.lastIndexOf("/")
			if (lastSlash > 0) {
				candidates.push(`${collapsed.slice(0, lastSlash + 1)}`)
			}
		}
		for (const candidate of candidates) {
			const normalized = candidate.length > 1 ? candidate.replace(/\/+/g, "/") : "/"
			const matches = this.directory.filter((entry) =>
				entry.path.startsWith(normalized)
			)
			if (matches.length > 0) {
				return matches
			}
		}
		return this.getDirectory()
	}

	private installFallbackHandlers(
		app: Application,
		options: Omit<RegisterOptions, "installFallbacks">
	) {
		const prefix = options.prefix ?? this.prefix
		const basePath = options.basePath

		if (basePath && options.exposeDirectory) {
			const shouldRegisterHandlers = !this.directoryRegistered
			const registerDirectory = (path: string) => {
				if (shouldRegisterHandlers) {
					app.get(path, (req, res) => {
						api.Log(`Directory requested for ${path}`, prefix)
						sendSuccess(res, {
							data: {
								version: 1,
								base: basePath,
								endpoints: this.getDirectory(),
							},
							request: req,
						})
					})
				}
				this.addDirectoryEntry({ method: "GET" as HttpMethod, path })
			}

			registerDirectory(basePath)
			if (!basePath.endsWith("/")) {
				registerDirectory(`${basePath}/`)
			}

			this.directoryRegistered =
				this.directoryRegistered || shouldRegisterHandlers
		}

		if (this.fallbackInstalled) {
			return
		}

		this.fallbackInstalled = true

		app.use((req, res) => {
			sendError(res, {
				error: "Not Found",
				code: 404,
				request: req,
				meta: {
					availableEndpoints: this.scopedDirectory(req.originalUrl),
				},
			})
		})

		app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => { 
			sendError(res, {
				error: "Internal Server Error",
				code: 500,
				request: req,
				meta: {
					detail: err instanceof Error ? err.stack : String(err)
				}
			})
		})

		app.use((req, res, next) => {
			const scopedRes = res as Response & { __prefix?: string }
			const scopedPrefix = scopedRes.__prefix ?? prefix
			const code = res.statusCode || 200
			const type = code >= 500 ? "error" : code >= 400 ? "warning" : "success"
			
			api.Log(
				`${req.method.toUpperCase()} ${req.originalUrl} -> ${code}`,
				scopedPrefix,
				type as any
			)
			next()
		})
	}

	private instantiateRoute(candidate: unknown): ApiRoute | null {
		if (!candidate) return null
		if (this.isRouteInstance(candidate)) {
			return candidate
		}
		if (typeof candidate === "function") {
			try {
				const instance = new (candidate as ApiRouteConstructor)()
				return this.isRouteInstance(instance) ? instance : null
			} catch (error) {
				api.Log(
					`failed to instantiate route candidate: ${error instanceof Error ? error.message : String(error)
					}`,
					this.prefix,
					"warning"
				)
				return null
			}
		}
		return null
	}

	private isRouteInstance(value: unknown): value is ApiRoute {
		return (
			typeof value === "object" &&
			value !== null &&
			typeof (value as ApiRoute).getName === "function" &&
			typeof (value as ApiRoute).getDefinitions === "function"
		)
	}

	private hasMinimumMetadata(route: ApiRoute): boolean {
		const name = route.getName?.()
		if (!name || typeof name !== "string") {
			return false
		}
		const definitions = route.getDefinitions()
		if (!Array.isArray(definitions) || definitions.length === 0) {
			return false
		}
		return definitions.every((definition) => {
			return (
				typeof definition.path === "string" &&
				definition.path.length > 0 &&
				Array.isArray(definition.handlers) &&
				definition.handlers.length > 0
			)
		})
	}

	private isRouteFile(entry: Dirent): boolean {
		if (!entry.isFile()) {
			return false
		}
		const extension = extname(entry.name)
		if (extension === ".d.ts" || extension === "") {
			return false
		}
		return [".js", ".ts", ".mjs", ".cjs"].includes(extension)
	}

	public paramsEmpty($: $): boolean {
		return (
			(Object.keys($.params || {}).length === 0) &&
			(Object.keys($.query || {}).length === 0) &&
			(Object.keys($.body || {}).length === 0)
		)
	}

	/**
	 * Fetch parameters and such from the request object
	 */
	public getParams(request: Request, args?: { tableName?: string, headers?: boolean}): $ {
		let data: $ = {
			body: request.body,
			query: request.query,
			params: request.params,
			options: (request as any).options ?? {},
			all: {}
		}

		if(args?.headers) data.headers = request.headers
		
		data = this.parseJSONRecursively(data)

		const query = (data.query as Record<string, any>) ?? {}
		const options = (data.options as Record<string, any>) ?? {}
		
		for (const key in query) {
			if (["offset", "limit", "sort"].includes(key)) {
				options[key] = query[key]
				delete query[key]
			}
		}

		data = {
			...data,
			query,
			options,
		}

		data.body = this.ensurePlainObject(data.body)
		data.params = this.ensurePlainObject(data.params)
		data.query = this.ensurePlainObject(data.query)
		data.options = this.ensurePlainObject(data.options)

		const normalizeEmpty = (value?: Record<string, any>) => {
			if (!value) {
				return undefined
			}
			return Object.keys(value).length ? value : undefined
		}

		data = {
			...data,
			body: normalizeEmpty(data.body),
			params: normalizeEmpty(data.params),
			query: normalizeEmpty(data.query),
		}

		if (args?.tableName) {
			data = this.schemaFilter(data, args.tableName)
		}

		data.all = [data.query, data.params, data.body].find(entry => entry && Object.keys(entry).length) ?? {}
		
		return data
	}


	private parseJSON(value: string): any {
		try {
			return JSON.parse(value)
		} catch {
			return value
		}
	}

	private parseJSONRecursively(value: any): any {
		if (typeof value === "string") {
			const parsed = this.parseJSON(value)
			if (parsed !== value) {
				return this.parseJSONRecursively(parsed)
			}
		}
		if (Array.isArray(value)) {
			return value.map((item) => this.parseJSONRecursively(item))
		}
		if (typeof value === "object" && value !== null) {
			const result: Record<string, any> = {}
			for (const key in value) {
				result[key] = this.parseJSONRecursively(value[key])
			}
			return result
		}
		return value
	}

	private ensurePlainObject(value: unknown): Record<string, any> {
		if (value && typeof value === "object" && !Array.isArray(value)) {
			return value as Record<string, any>
		}
		return {}
	}

	/**
	 * Sanitize parameters based on table schema
	 */
	private schemaFilter(data: $, tableName: string): $ {
		const schemaColumn = schemaColumns[tableName as keyof typeof schemaColumns]

		const schema = {
			params: schemaColumn,
			query: schemaColumn,
			body: schemaColumn,
			options: this.defaultOptionKeys,
		}

		const sanitize = (source: Record<string, any>, allowed?: readonly string[]): Record<string, any> => {
			if (!allowed || allowed.length === 0) { return source }
			const allowedSet = new Set(allowed.map((entry) => `${entry}`))
			const filtered: Record<string, any> = {}
			for (const [key, value] of Object.entries(source)) {
				if (allowedSet.has(key)) { filtered[key] = value }
			}
			return filtered
		}

		const optionsAllowed = schema.options ?? this.defaultOptionKeys
		
		return {
			...data,
			params: sanitize(data.params || {}, schema.params),
			query: sanitize(data.query || {}, schema.query),
			body: sanitize(data.body || {}, schema.body),
			options: sanitize(data.options || {}, optionsAllowed),
			headers: data.headers || {},
		}
	}

	/**
	 * Automatically handle route return values and coding based on result and success
	 */
	Return(result: any, response: Response, request: Request) {
		const $: $ = this.getParams(request)
		
		if (result && result instanceof Error) {
			return api.Utils.sendError(response, {
				error: result.message,
				code: 500,
				$: $,
				request,
			})
		}
		// If empty result
		if (result === null || result === undefined) {
			return api.Utils.sendError(response, {
				error: "No Content",
				code: 200,
				$: $,
				request,
			})
		}

		// If result indicates an error
		if (result.error) {
			const code = result.code || 400
			return api.Utils.sendError(response, {
				error: result.error,
				code,
				$: $,
				request,
			})
		}

		// If all is good
		const payload = Array.isArray(result) ? result : result
		return api.Utils.sendSuccess(response, { data: payload, $: $, request })
	}

}