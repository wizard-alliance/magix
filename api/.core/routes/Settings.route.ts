import type { Request } from "express"
import { CrudMethods } from "../services/CrudMethods.js"

import type { SettingDBRow } from "../schema/Database.js"
import type { Settings } from "../schema/DomainShapes.js"

export class SettingsRoutes {
	private readonly tableName: string = "settings"
	public readonly routeName = "setting"
	public readonly version = api.Config("API_VERSION") || '1'
	private readonly CRUD = new CrudMethods<Settings, SettingDBRow>()
	
	public routes = async () => {
		const options = { protected: false, register: false, tableName: this.tableName }
		
		api.Router.set("GET", `${this.routeName}`, this.get, options)
		api.Router.set("PUT", `${this.routeName}`, this.update, options)
		api.Router.set("DELETE", `${this.routeName}`, this.delete, options)
		api.Router.set("POST", `${this.routeName}`, this.create, options)
		api.Router.set("GET", `${this.routeName}s`, this.getMany, options)
	}

	get = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.get(this.tableName, params.params)
	}

	getMany = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		return await this.CRUD.getMany(this.tableName, params.params)
	}

	update = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.update(this.tableName, params.params, params.body)
	}

	create = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.create(this.tableName, params.params)
	}

	delete = async ($: any, req: Request) => {
		const params = api.Router.getParams(req, this.tableName)
		if(params.isEmpty) { return { code: 422, error: 'Missing request data' } }
		return await this.CRUD.delete(this.tableName, params.params)
	}
}