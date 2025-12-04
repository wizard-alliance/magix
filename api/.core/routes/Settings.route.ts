import type { Request, Response } from "express"
import type { $ } from "../types/routes.js"
import type { ApiRoute, RouteDefinition } from "../types/routes.js"

export class SettingsRoutes implements ApiRoute {
	private readonly name = "SettingsRoutes"
	private readonly routeName = "setting"
	readonly version = api.Config("API_VERSION")
	private tableName: string = "settings"

	getName = () => this.name

	getDefinitions = (): RouteDefinition[] => [
		{ method: "GET", path: `${this.routeName}`, handlers: [this.get] },
		{ method: "PUT", path: `${this.routeName}`, handlers: [this.update] },
		{ method: "DELETE", path: `${this.routeName}`, handlers: [this.delete] },
		{ method: "POST", path: `${this.routeName}`, handlers: [this.create] },
		{ method: "GET", path: `${this.routeName}s`, handlers: [this.getMany] },
	]


	get = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty($)) {
			api.Router.handleReturn({ error: 'Missing or Invalid request data' }, response, request)
		}
		const params = [$.query, $.params].find(entry => entry && Object.keys(entry).length) ?? {}
		const data = await api.Data[this.tableName].get(params)
		api.Router.handleReturn(data, response, request)
	}

	getMany = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { tableName: this.tableName })
		const params = [$.query, $.params].find(entry => entry && Object.keys(entry).length) ?? {}
		const data = await api.Data[this.tableName].getMany(params)
		api.Router.handleReturn(data, response, request)
	}

	update = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty($)) {
			api.Router.handleReturn({ error: 'Missing or Invalid request data' }, response, request)
		}
		const params = [$.query, $.params].find(entry => entry && Object.keys(entry).length) ?? {}
		const payload = $.body as any
		const data = await api.Data[this.tableName].update(params, payload)
		api.Router.handleReturn(data, response, request)
	}

	create = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty($)) {
			api.Router.handleReturn({ error: 'Missing or Invalid request data' }, response, request)
		}
		const params = [$.query, $.params, $.body].find(entry => entry && Object.keys(entry).length) ?? {}
		const data = await api.Data[this.tableName].create(params)
		api.Router.handleReturn(data, response, request)
	}

	delete = async (request: Request, response: Response) => {
		const $: $ = api.Router.getParams(request, { tableName: this.tableName })
		if(api.Router.paramsEmpty($)) {
			api.Router.handleReturn({ error: 'Missing or Invalid request data' }, response, request)
		}
		const params = [$.query, $.params, $.body].find(entry => entry && Object.keys(entry).length) ?? {}
		const data = await api.Data[this.tableName].delete(params)
		api.Router.handleReturn(data, response, request)
	}
}
