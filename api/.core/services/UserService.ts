import { AuthService } from "./User/AuthService.js"
import { AuthTokenManager } from "./User/AuthTokens.js"
import { DeviceService } from "./User/DeviceService.js"
import { PermissionService } from "./User/PermissionService.js"
import { TokenStore } from "./User/TokenStore.js"
import { UserRepo } from "./User/UserRepo.js"
import { VendorRegistry } from "./User/VendorRegistry.js"

export class UserService {
	private readonly db = api.DB.connection
	private readonly prefix = "UserService"

	public readonly Auth = new AuthService()
	public readonly Tokens = new AuthTokenManager()
	public readonly Devices = new DeviceService()
	public readonly TokenStore = new TokenStore()
	public readonly Repo = new UserRepo()
	public readonly Vendors = new VendorRegistry()
	public readonly Permissions = new PermissionService()
}