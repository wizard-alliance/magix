import { BaseResource } from '../Data/BaseResource'

export type SystemSetting = {
	key: string
	value: string
	autoload: number | boolean
}

export class SettingsResource extends BaseResource<SystemSetting> {
	constructor() {
		super('setting', 'settings')
	}
}
