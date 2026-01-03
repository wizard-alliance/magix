import { LemonSqueezyProvider } from "./LemonSqueezy.js"
import { VippsProvider } from "./Vipps.js"

export class BillingProviders {
	public readonly LS = new LemonSqueezyProvider()
	public readonly Vipps = new VippsProvider()
}
