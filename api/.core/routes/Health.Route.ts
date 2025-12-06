import dayjs from "dayjs"

export class HealthRoute {
	private readonly prefix = "HealthRoute"
	private readonly routeName = "health"
	readonly version = api.Config("API_VERSION")

	routes() {
		api.Router.set("GET", `${this.routeName}`, this.get)
	}

	/**
	 * Handle GET /health
	 */
	get = async () => {
		api.Log("Computing health status", this.prefix)

		return {
			status: `ok`,
			timestamp: dayjs().toISOString(),
			apiBaseUrl: api.Config('API_BASE_URL'),
			databaseConfigured: api.Services.DB.isConfigured(),
			databaseVersion: await api.Services.DB.getServerVersion(),
			smtpConfigured: api.Services.Mail.isConfigured(),
		}
	}
}