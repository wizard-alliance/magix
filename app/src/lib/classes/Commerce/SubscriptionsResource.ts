import { BaseResource } from '../Data/BaseResource'
import type { BillingSubscription } from '../../types/commerce'

export class SubscriptionsResource extends BaseResource<BillingSubscription> {
	constructor() {
		super('billing/subscription', 'billing/subscriptions')
	}

	async cancel(id: number) {
		return this.request('post', 'billing/subscription/cancel', { body: { id } })
	}

	async pause(id: number) {
		return this.request('post', 'billing/subscription/pause', { body: { id } })
	}

	async resume(id: number) {
		return this.request('post', 'billing/subscription/resume', { body: { id } })
	}
}
