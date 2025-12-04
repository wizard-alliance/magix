import { AuthController } from "../controllers/Auth/AuthController.js"
import type { ApiRoute, RouteDefinition } from "../types/routes.js"

export class AuthRoute implements ApiRoute {
	private readonly controller = new AuthController()
	private readonly name = "AuthRoute"
	private readonly routeName = "auth"
	readonly version = api.Config("API_VERSION")

	getName = () => this.name

	getDefinitions = (): RouteDefinition[] => [
		{ method: "POST", path: `${this.routeName}/login`, handlers: [this.controller.login] },
		{ method: "GET", path: `${this.routeName}/login`, handlers: [this.controller.login] },
		{ method: "POST", path: `${this.routeName}/register`, handlers: [this.controller.register] },
		{ method: "GET", path: `${this.routeName}/register`, handlers: [this.controller.register] },
		{ method: "POST", path: `${this.routeName}/refresh`, handlers: [this.controller.refresh] },
		{ method: "GET", path: `${this.routeName}/refresh`, handlers: [this.controller.refresh] },
		{ method: "GET", path: `${this.routeName}/me`, handlers: [this.controller.me], auth: true },
		{ method: "POST", path: `${this.routeName}/logout`, handlers: [this.controller.logout], auth: true },
		{ method: "GET", path: `${this.routeName}/logout`, handlers: [this.controller.logout], auth: true },
		{ method: "POST", path: `${this.routeName}/logout/all-devices`, handlers: [this.controller.logoutAllDevices], auth: true },
		{ method: "GET", path: `${this.routeName}/logout/all-devices`, handlers: [this.controller.logoutAllDevices], auth: true },
		{ method: "POST", path: `${this.routeName}/logout/all-users`, handlers: [this.controller.logoutAllUsers], auth: true, perms: ["administrator"] },
		{ method: "GET", path: `${this.routeName}/logout/all-users`, handlers: [this.controller.logoutAllUsers], auth: true, perms: ["administrator"] },
		{ method: "POST", path: `${this.routeName}/password`, handlers: [this.controller.changePassword], auth: true },
		{ method: "GET", path: `${this.routeName}/password`, handlers: [this.controller.changePassword], auth: true },
		{ method: "POST", path: `${this.routeName}/profile`, handlers: [this.controller.updateProfile], auth: true },
		{ method: "GET", path: `${this.routeName}/vendor/:vendor`, handlers: [this.controller.vendorInfo] },
		{ method: "POST", path: `${this.routeName}/vendor/:vendor`, handlers: [this.controller.vendorLogin] },
		{ method: "GET", path: `${this.routeName}/vendor/:vendor/login`, handlers: [this.controller.vendorLogin] },
	]
}
