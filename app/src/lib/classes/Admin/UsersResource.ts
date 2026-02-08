import { BaseResource } from '../Data/BaseResource'
import type { UserDBRow, UserFull } from '../../types/types'

export class UsersResource extends BaseResource<UserFull> {
	constructor() {
		super('account/user', 'account/users')
	}
}
