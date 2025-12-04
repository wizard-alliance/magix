import type { ApiRoute, RouteDefinition } from "../types/routes.js"
import type { Request, Response } from "express"
import dayjs from "dayjs"

export class HealthRoute implements ApiRoute {
	private readonly name = "HealthRoute"
	private readonly routeName = "health"
	readonly version = api.Config("API_VERSION")

	getName = () => this.name

	getDefinitions = (): RouteDefinition[] => [
		{ method: "GET", path: `${this.routeName}`, handlers: [this.get] },
	]

	/**
	 * Handle GET /health
	 */
	get = async (request: Request, response: Response) => {
		api.Log("Computing health status", this.name)

		const data = {
			status: `ok`,
			timestamp: dayjs().toISOString(),
			apiBaseUrl: api.Config('API_BASE_URL'),
			databaseConfigured: api.Services.DB.isConfigured(),
			databaseVersion: await api.Services.DB.getServerVersion(),
			smtpConfigured: api.Services.Mail.isConfigured(),
		}

		api.Router.handleReturn(data, response, request)
	}
}