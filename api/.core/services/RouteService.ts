import { join, extname } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { schemaColumns, tableColumnSets } from "../schema/Database.js"
import { requireAuth } from "../middleware/auth.js"
import { glob } from 'glob'
import { Config } from "../config/env.js"
import { getReasonPhrase } from 'http-status-codes';
import fs from "node:fs"
import type { ColumnType } from "../schema/Database.js"
import type { Application, Request, RequestHandler, Response } from "express"
import type { $, HttpMethod, RouteOptions, Route, RestParams, ApiResponse, RouteCallback } from "../types/routes.js"

export class RouteController {
	public readonly prefix = "Router"
	private readonly version = Config('API_VERSION') || 'v1'
	private readonly basePath = Config('API_BASE_PATH') || `/api`
	private directory: Route[] = []

	private get getCurrentVersion() {
		return this.version
	}

	private get getBasePath() {
		return `${this.basePath}/${this.getCurrentVersion}/`
	}

	private getPath(path: string) {
		const base = this.getBasePath.replace(/\/+$/, "")
		const cleaned = path.replace(/^\/+/, "")
		return `${base}/${cleaned}`
	}

	public set(method: Route["method"] | Route["method"][], path: Route["path"], cb: Route["callback"], options: RouteOptions = {}): Route[] | Route {
		const methods = Array.isArray(method) ? method : [method]
		const routes: Route[] = []
		for (const m of methods) { routes.push(this._set(m, path, cb, options)) }
		return routes.length === 1 ? routes[0] : routes
	}

	private _set(method: Route["method"], path: Route["path"], cb: Route["callback"], options: RouteOptions = {}): Route {
		const name = `${method.toLowerCase()}:${path}`
		let route: Route = {
			method: method.toUpperCase() as HttpMethod,
			name,
			path: this.getPath(path),
			callback: cb,
			meta: {
				isRegistered: false,
				isProtected: options?.protected ?? false,
				isIndex: options?.index ?? false,
				createdAt: Date.now(),
				updatedAt: null,
				tableName: options?.tableName || null,
				perms: options?.perms || []
			}
		}

		// Auto-build param schema from tableName + path
		if (options.tableName) {
			route.params = this.getColumnDefinitions(options.tableName) as Record<string, any>
			if(route.params.password !== undefined) { delete route.params.password }
			if(route.params.password_hash !== undefined) { delete route.params.password_hash }
			if(route.params.reset_token !== undefined) { delete route.params.reset_token }
			route.params = { ...route.params, ...this.getTableSchema(options.tableName) }
		}

		this.directory.push(route)

		if (options?.register !== false) { this.register() }
		return route
	}

	public unset(method: HttpMethod, path: string, register: boolean = true): void {
		const route = this.get(`${method}:${path}`)
		if (!route) {
			api.Error(`Unset: Route not found: ${method}:${path}`, this.prefix)
			return
		}
		this.directory = this.directory.filter(r => r !== route)
		if (register) { this.register() }
	}

	public unsetAll(register: boolean = true): void {
		this.directory = []
		if (register) { this.register() }
	}

	public has(method: HttpMethod, path: string): boolean {
		return this.directory.some(route => route.method === method && route.path === this.getPath(path))
	}

	public exists(name: string): boolean {
		return this.get(name) !== undefined
	}
	
	/**
	 * Get a route by its method and path, if fetched route is a index route, return it too.
	 */
	public get(rawName: string): Route | undefined {
		// Sanitize name and remove version
		let name = rawName.replace(this.getBasePath, '').replace(/^\/+/, '').replace(/\/+$/, '')
		if (!name.includes(':')) { name = `get:${name}` }
		name = name.trim().toLowerCase()
		const route = this.directory.find(route => route.name.toLowerCase() === name.toLowerCase())
		return !route ? undefined : route
	}

	public getAll(): Route[] {
		return this.directory
	}

	/**
	 * Automatically discover route files from a directory, use readdir and/or Dirent
	 */
	public async discoverRoutes(dirPath: string | string[]): Promise<void> {
		const dirPaths = Array.isArray(dirPath) ? dirPath : [dirPath]
		const files: string[] = []
		if(dirPaths.length === 0) { return }

		dirPaths.forEach(dirPath => {
			const fullPath = fileURLToPath(pathToFileURL(join(process.cwd(), dirPath)))

			// Check if path exists, error if not
			if (!fs.existsSync(fullPath)) {
				api.Warning(`DiscoverRoutes: Path not found: ${fullPath}`, this.prefix)
				return
			}

			const potentialFiles = glob.sync("**/*.ts", { cwd: fullPath })

			potentialFiles.forEach(file => {
				const ext = extname(file)
				if (ext !== ".ts") { return }
				files.push(join(fullPath, file))
			})
		})

		// Loop and check if class has getDefinitions method
		for (const filePath of files) {	
			import(pathToFileURL(filePath).toString()).then(async (module) => {
				for (const key in module) {
					if( typeof module[key] !== "function" ) { continue }
					let mod = module[key]
					
					// If Exported is function and named routes(), run it
					if (mod.name == "routes") {
						await mod()
						this.register()
						return
					}

					mod = new mod()

					// If Exported is a class, look for method name inside the class routes() and run it
					if (typeof mod === "object" && typeof mod['routes'] === 'function') {
						await mod['routes']()
						this.register()
						return
					}
				}
			}).catch((err) => {
				api.Error(`Error importing route file: ${filePath} - ${err}`, this.prefix)
			})
		}
	}

	public return(raw: any, res: Response, req: Request, $?: $): ApiResponse {
		const data = Array.isArray(raw) ? raw
			: (typeof raw === "object" && raw !== null) ? { ...raw } : raw
		const code = Number(data.code) || 200
		const errorMessage = data.errorMessage || data.error || null
		const error = code >= 400 ? true : (data.error ?? false)
		const errorPhrase = getReasonPhrase(code)
		
		const route = this.get(`${req.method}:${req.path}`)

		if(data.code) { delete data.code }
		if(data.error) { delete data.error }

		const payload: ApiResponse = {
			code,
			status: errorPhrase,
			data,
			error: Boolean(error),
			errorMessage: errorMessage,
			path: req.path,
			timestamp: new Date().toISOString(),
			meta: {
				isProtected: route ? route.meta.isProtected : false,
				isIndex: route ? route.meta.isIndex : false,
				perms: route ? route.meta.perms : []
			},
			$: $ || null,
		}

		return res.status(code).json(payload) as any
	}

	public error(data: any, res: Response, req: Request, $?: $): ApiResponse {
		return this.return({
			error: data.error || data.message || data, code: data.code || 500
		}, res, req, $ || undefined)
	}

	/**
	 * Extract params from express Request
	 */
	public getParams(req: any, tableName?: string): RestParams {
		const body = req.body || {}
		const query = req.query || {}
		const paramsObj = req.params || {}
		const headers = req.headers || {}

		const isEmpty =
			Object.keys(body).length === 0 &&
			Object.keys(query).length === 0 &&
			Object.keys(paramsObj).length === 0

		let params = {
			body: body,
			query: query,
			params: paramsObj,
			headers: headers,
			isEmpty: isEmpty
		}
		
		return tableName ? this.sanitizeParams(params, tableName) : params
	}

	/**
	 * @description Strip away any unwanted params based on the table schema
	 */
	public sanitizeParams(params: RestParams, tableName?: string): RestParams {
		if(!tableName) {
			api.Error(`sanitizeParams: No table name provided`, this.prefix)
			return params 
		}

		const schema = this.getTableSchema(tableName)
		const columns = this.getColumnDefinitions(tableName)

		if(!schema || !columns) {
			api.Error(`sanitizeParams: No schema found for table: ${tableName}`, this.prefix)
			return params 
		}

		const sanitizeSection = (section: Record<string, any> = {}) => {
			const clean: Record<string, any> = {}
			for (const [key, value] of Object.entries(section)) {
				if (!schema.has(key)) { continue }
				const type = columns[key as keyof typeof columns]
				clean[key] = this.castValue(type, value)
			}
			return clean
		}

		return {
			...params,
			body: sanitizeSection(params.body),
			query: sanitizeSection(params.query),
			params: sanitizeSection(params.params),
		}
	}

	/**
	 * @name Register all endpoints: 
	 * @description Create indexes where no conflicts happen, then Register all routes to express
	 */
	public register() {
		this.createIndexRoutes()
		
		for (const route of this.directory) {
			if (route.meta.isRegistered) { continue }

			const methodKey = route.method.toLowerCase() as keyof Application
			const middlewares: RequestHandler[] = []

			if (route.meta.isProtected) {
				middlewares.push(requireAuth({ perms: route.meta.perms }))
			}

			api.Express[methodKey](route.path, ...middlewares, async (req: Request, res: Response) => {
				const $ = this.getParams(req, route.meta?.tableName || undefined)
				try {
					this.return((await route.callback($, req, res)), res, req, $)
				} catch (err) {
					this.error(err, res, req, $)
				}
			})

			route.meta.updatedAt = Date.now()
			route.meta.isRegistered = true
		}
	}

	private getTableSchema(tableName: string): ReadonlySet<string> | null {
		const tableKey = tableName as keyof typeof tableColumnSets
		return tableColumnSets[tableKey] || null
	}

	private getColumnDefinitions(tableName: string): Record<string, ColumnType> | null {
		const tableKey = tableName as keyof typeof schemaColumns
		return schemaColumns[tableKey] || null
	}

	private castValue(type: ColumnType | undefined, value: any) {
		if (value === undefined || value === null || !type) {
			return value
		}

		if (type === 'number') {
			const parsed = Number(value)
			return Number.isNaN(parsed) ? value : parsed
		}

		if (type === 'date') {
			const date = new Date(value)
			return Number.isNaN(date.valueOf()) ? value : date.toISOString()
		}

		return typeof value === 'string' ? value : String(value)
	}

	/**
	 * Create index GET routes for all parent endpoints that do not exist.
	 */
	private createIndexRoutes() {
		let potentialRoutes: string[] = []
		const basePath = this.getBasePath.replace(/\/+$/, "")
		// Collect all potential index routes
		for (const route of this.directory) {

			// Parent paths should be steps backwards from the full path, and remove basePath
			// ie.: api, api/v1, api/v1/dev, api/v1/dev/parentz
			const parentPaths = route.path.split('/').slice(0, -1).map((_, idx, arr) => {
				return arr.slice(0, idx + 1).join('/')
			}).map(path => path.replace(basePath, '')).filter(Boolean).map(path => path.replace(/\/+$/, "").replace(/^\/+/, ""))

			for (const parentPath of parentPaths) {
				if(!parentPath || parentPath === '' || basePath.includes(parentPath)) { continue }

				const parentRoute: Route = this.get(`get:${parentPath}`) as Route
				
				if(!parentRoute) {
					potentialRoutes.push(parentPath)
					continue
				}

				// Skip index routes
				if (parentRoute.meta.isIndex) { continue }

				potentialRoutes.push(parentPath)
			}
		}

		// Make unique and include home route ('') so /api/v1/ resolves
		const hasRoot = !!this.get('get:')
		potentialRoutes = Array.from(
			new Set([...potentialRoutes, ...(hasRoot ? [] : [''])])
		)

		// Register /index routes
		for (const path of potentialRoutes) {
			const callback = (path.trim().length === 0 ? this.homeContent : this.indexContent) as Route["callback"]
			this.set('GET', path, callback.bind(this), {
				protected: false,
				index: true,
				register: false
			})
		}
	}

	private homeContent: RouteCallback = ($: $, req: Request, _res: Response) => {
		return {
			title: `${api.Config('APP_NAME') || 'API'} → Home`,
			message: `Welcome to the API - Home for ${req.path}`,
			routes: this.listChildren(req.path)
		}
	}

	private indexContent: RouteCallback = ($: $, req: Request, _res: Response) => {
		return {
			title: `${api.Config('APP_NAME') || 'API'} → Index`,
			message: `Index for ${req.path}`,
			routes: this.listChildren(req.path)
		}
	}

	private listChildren(path: string): Partial<Route>[] {
		const childRoutes = this.directory.filter(
			route => route.path.startsWith(path) && route.path !== path
		)

		const seen = new Set<string>()
		const children: any[] = []

		for (const route of childRoutes) {
			const key = `${route.method}:${route.path}`
			if (seen.has(key)) continue
			seen.add(key)
			const child: any = { method: route.method, path: route.path }
			// Set child metadata
			child.protected = route.meta.isProtected
			if (route.params && Object.keys(route.params).length > 0) {
				child.params = route.params

				// Perms
				if (route.meta.perms && route.meta.perms.length > 0) {
					child.perms = route.meta.perms
				}
			}
			children.push(child)
		}

		// Sort by path
		children.sort((a, b) => a.path.localeCompare(b.path))

		return children
	}
}