import { AuthController } from "../controllers/Auth/AuthController.js"
import type { ApiRoute, RouteDefinition } from "../types/routes.js"

export class AuthRoute implements ApiRoute {
	private readonly controller = new AuthController()
	private readonly prefix = "AuthRoute"
	private readonly routeName = "auth"

	public routes = () => [
		api.Router.set("POST", `${this.routeName}/login`, this.controller.login),
		
		api.Router.set("GET", `${this.routeName}/login`, this.controller.login),
		
		api.Router.set("POST", `${this.routeName}/register`, this.controller.register),
		
		api.Router.set("GET", `${this.routeName}/register`, this.controller.register),
		
		api.Router.set("POST", `${this.routeName}/refresh`, this.controller.refresh),
		
		api.Router.set("GET", `${this.routeName}/refresh`, this.controller.refresh),
		
		api.Router.set("GET", `${this.routeName}/me`, this.controller.me, { protected: true }),
		
		api.Router.set("POST", `${this.routeName}/logout`, this.controller.logout, { protected: true }),
		
		api.Router.set("GET", `${this.routeName}/logout`, this.controller.logout, { protected: true }),
		
		api.Router.set("POST", `${this.routeName}/logout/all-devices`, this.controller.logoutAllDevices, { protected: true }),
		
		api.Router.set("GET", `${this.routeName}/logout/all-devices`, this.controller.logoutAllDevices, { protected: true }),
		
		api.Router.set("POST", `${this.routeName}/logout/all-users`, this.controller.logoutAllUsers, { protected: true, perms: ["administrator"] }),
		
		api.Router.set("GET", `${this.routeName}/logout/all-users`, this.controller.logoutAllUsers, { protected: true, perms: ["administrator"] }),
		
		api.Router.set("POST", `${this.routeName}/password`, this.controller.changePassword, { protected: true }),
		
		api.Router.set("GET", `${this.routeName}/password`, this.controller.changePassword, { protected: true }),
		
		api.Router.set("POST", `${this.routeName}/profile`, this.controller.updateProfile, { protected: true }),
		
		api.Router.set("GET", `${this.routeName}/vendor/:vendor`, this.controller.vendorInfo),
		
		api.Router.set("POST", `${this.routeName}/vendor/:vendor`, this.controller.vendorLogin),
		
		api.Router.set("GET", `${this.routeName}/vendor/:vendor/login`, this.controller.vendorLogin),
	]
}
