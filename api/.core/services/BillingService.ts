import { BillingCustomers } from "./Billing/BillingCustomers.js"
import { BillingInvoices } from "./Billing/BillingInvoices.js"
import { BillingOrders } from "./Billing/BillingOrders.js"
import { BillingPaymentProviders } from "./Billing/BillingPaymentProviders.js"
import { BillingPlans } from "./Billing/BillingPlans.js"
import { BillingSubscriptions } from "./Billing/BillingSubscriptions.js"
import { BillingEvents } from "./Billing/BillingEvents.js"

export class BillingService {
	public readonly Customers = new BillingCustomers()
	public readonly Invoices = new BillingInvoices()
	public readonly Orders = new BillingOrders()
	public readonly Providers = new BillingPaymentProviders()
	public readonly Plans = new BillingPlans()
	public readonly Subscriptions = new BillingSubscriptions()
	public readonly Events = new BillingEvents()
}