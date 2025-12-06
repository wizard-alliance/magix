import type { Request } from "express"
import { CrudMethods } from "../controllers/Data/CrudMethods.js"

import type { SettingDBRow } from "../schema/Database.js"
import type { Settings } from "../schema/DomainShapes.js"

export class SettingsRoutes {
	private readonly tableName: string = "settings"
	public readonly routeName = "setting"
	public readonly version = api.Config("API_VERSION") || '1'
	
	private get CRUD(): CrudMethods<Settings, SettingDBRow> { return api.Data.CRUD }

	public routes = async () => {
		api.Router.set("GET", `${this.routeName}`, this.get, { protected: false, register: false });
		api.Router.set("PUT", `${this.routeName}`, this.update, { protected: false, register: false });
		api.Router.set("DELETE", `${this.routeName}`, this.delete, { protected: false, register: false });
		api.Router.set("POST", `${this.routeName}`, this.create, { protected: false, register: false });
		api.Router.set("GET", `${this.routeName}s`, this.getMany, { protected: false, register: false });
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