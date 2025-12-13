// Import User fragments
import { AuthService } from "./User/AuthService.js"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(utc)


export class UserService {
	public readonly Auth = new AuthService()
	
	constructor() {
	}

	
}
