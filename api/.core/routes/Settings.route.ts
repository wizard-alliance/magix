import type { Request, Response } from "express"
import type { ApiRoute, RouteDefinition } from "../types/routes.js"
import { CrudMethods } from "../controllers/Data/CrudMethods.js"

import type { SettingDBRow } from "../schema/Database.js"
import type { Settings } from "../schema/DomainShapes.js"

export class SettingsRoutes implements ApiRoute {
	private readonly tableName: string = "settings"
	private readonly name = "SettingsRoutes"
	public readonly routeName = "setting"
	public readonly version = api.Config("API_VERSION") || '1'
	
	public readonly getName = () => this.name
	private get CRUD(): CrudMethods<Settings, SettingDBRow> { return api.Data.CRUD }

	getDefinitions = (): RouteDefinition[] => [
		{ method: "GET", path: `${this.routeName}`, handlers: [this.get] },
		{ method: "PUT", path: `${this.routeName}`, handlers: [this.update] },
		{ method: "DELETE", path: `${this.routeName}`, handlers: [this.delete] },
		{ method: "POST", path: `${this.routeName}`, handlers: [this.create] },
		{ method: "GET", path: `${this.routeName}s`, handlers: [this.getMany] },
	]

	get = async (request: Request, response: Response) => {
		const params = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty(params)) {
			api.Router.Return({ error: 'Missing request data' }, response, request)
		}
		const data = await this.CRUD.get(this.tableName, params.all)
		api.Router.Return(data, response, request)
	}

	getMany = async (request: Request, response: Response) => {
		const params = api.Router.getParams(request, { tableName: this.tableName })
		const data = await this.CRUD.getMany(this.tableName, params.all)
		api.Router.Return(data, response, request)
	}

	update = async (request: Request, response: Response) => {
		const params = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty(params)) {
			api.Router.Return({ error: 'Missing request data' }, response, request)
		}
		const data = await this.CRUD.update(this.tableName, params.all, params.body)
		api.Router.Return(data, response, request)
	}

	create = async (request: Request, response: Response) => {
		const params = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty(params)) {
			api.Router.Return({ error: 'Missing request data' }, response, request)
		}
		const data = await this.CRUD.create(this.tableName, params.all)
		api.Router.Return(data, response, request)
	}

	delete = async (request: Request, response: Response) => {
		const params = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty(params)) {
			api.Router.Return({ error: 'Missing request data' }, response, request)
		}
		const data = await this.CRUD.delete(this.tableName, params.all)
		api.Router.Return(data, response, request)
	}
}