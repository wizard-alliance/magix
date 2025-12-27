// Import User fragments
import { AuthService } from "./User/AuthService.js"

export class UserService {
	public readonly Auth = new AuthService()
	
	constructor() {
	}

	
}
