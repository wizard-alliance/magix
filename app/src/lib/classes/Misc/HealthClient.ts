import { app } from "../../app.js"
import { PUBLIC_API_URL } from '$env/static/public';
import type { HealthResponse } from "$lib/types/types"

export class HealthClient {
	private readonly tableName = ""
	private readonly prefix = "HealthClient";
	private apiBaseUrl: string = PUBLIC_API_URL || 'http://localhost:4000/api/v1'

	getHealth = async (): Promise<HealthResponse> => {
		try {
			const payload = await app.Request.get<HealthResponse>('/health', {
				useAuth: false,
				allowRefresh: false,
			});
			if (!payload) {
				throw new Error("Missing payload from health endpoint");
			}
			return payload;
		} catch (error) {
			app.$.Warn(`Health check failed ${(error as Error)?.message ?? error}`, this.prefix);
			
			return {
				status: "error",
				timestamp: new Date().toISOString(),
				apiBaseUrl: this.apiBaseUrl + '/health',
				databaseConfigured: false,
				databaseVersion: null,
				smtpConfigured: false,
			};
		}
	};

	getStatus = async () => {
		const payload = await this.getHealth();
		return payload.status;
	};
}
