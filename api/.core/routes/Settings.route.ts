import type { Request } from "express"
import { CrudMethods } from "../services/CrudMethods.js"

import type { GlobalSettingDBRow } from "../schema/Database.js"
import type { Settings } from "../schema/DomainShapes.js"

export class SettingsRoutes {
	private readonly tableName: string = "global_settings"
	public readonly routeName = "setting"
	public readonly version = api.Config("API_VERSION") || '1'
	private readonly CRUD = new CrudMethods<Settings, GlobalSettingDBRow>()
	
	public routes = async () => {
		const options = { protected: false, register: false, tableName: this.tableName }
		
		const optionsAdmin = { 
			protected: true, 
			register: false, 
			tableName: this.tableName, 
			perms: ["administrator"]
		}
		
		api.Router.set("GET", `${this.routeName}`, this.get, options)
		api.Router.set("GET", `${this.routeName}s`, this.getMany, options)

		api.Router.set("PUT", `${this.routeName}`, this.update, optionsAdmin)
		api.Router.set("DELETE", `${this.routeName}`, this.delete, optionsAdmin)
		api.Router.set("POST", `${this.routeName}`, this.create, optionsAdmin)
	}

	get = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const where = { ...p.params, ...p.query }
		if (!Object.keys(where).length) return { code: 422, error: "Missing request data" }
		const result = await this.CRUD.get(this.tableName, where)
		return result ?? { code: 404, error: "Setting not found" }
	}

	getMany = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		return await this.CRUD.getMany(this.tableName, { ...p.params, ...p.query })
	}

	update = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const key = p.query?.key ?? p.body?.key
		if (!key) return { code: 422, error: "Setting key required" }
		const { key: _, ...data } = p.body
		return await this.CRUD.update(this.tableName, data, { key })
	}

	create = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		if (!p.body?.key) return { code: 422, error: "Setting key required" }
		return await this.CRUD.create(this.tableName, p.body)
	}

	delete = async ($: any, req: Request) => {
		const p = api.Router.getParams(req, this.tableName)
		const where = { ...p.params, ...p.query, ...p.body }
		if (!Object.keys(where).length) return { code: 422, error: "Missing request data" }
		const result = await this.CRUD.delete(this.tableName, where)
		return result ?? { code: 404, error: "Setting not found" }
	}
}