import { BillingCustomers } from "./Billing/BillingCustomers.js"
import { BillingInvoices } from "./Billing/BillingInvoices.js"
import { BillingOrders } from "./Billing/BillingOrders.js"
import { BillingProducts } from "./Billing/BillingProducts.js"
import { BillingSubscriptions } from "./Billing/BillingSubscriptions.js"
import { BillingEvents } from "./Billing/BillingEvents.js"
import { BillingProviders } from "./Billing/Providers/index.js"

export class BillingService {
	public readonly Customers = new BillingCustomers()
	public readonly Invoices = new BillingInvoices()
	public readonly Orders = new BillingOrders()
	public readonly Products = new BillingProducts()
	public readonly Subscriptions = new BillingSubscriptions()
	public readonly Events = new BillingEvents()
	public readonly Providers = new BillingProviders()
}