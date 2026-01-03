import type { Request } from "express"

export class BillingRoute {
	private readonly route = "billing"

	public routes = async () => {
		const opts = { protected: true, perms: ["user"] }
		const adminOpts = { protected: true, perms: ["administrator"] }

		// Customers
		api.Router.set("GET", `${this.route}/customer`, this.getCustomer, opts)
		api.Router.set("GET", `${this.route}/customers`, this.getCustomers, adminOpts)
		api.Router.set("POST", `${this.route}/customer`, this.createCustomer, adminOpts)
		api.Router.set("PUT", `${this.route}/customer`, this.updateCustomer, adminOpts)
		api.Router.set("DELETE", `${this.route}/customer`, this.deleteCustomer, adminOpts)

		// Plans
		api.Router.set("GET", `${this.route}/plan`, this.getPlan)
		api.Router.set("GET", `${this.route}/plans`, this.getPlans)
		api.Router.set("POST", `${this.route}/plan`, this.createPlan, adminOpts)
		api.Router.set("PUT", `${this.route}/plan`, this.updatePlan, adminOpts)
		api.Router.set("DELETE", `${this.route}/plan`, this.deletePlan, adminOpts)

		// Plan Features
		api.Router.set("GET", `${this.route}/plan/feature`, this.getPlanFeature, adminOpts)
		api.Router.set("GET", `${this.route}/plan/features`, this.getPlanFeatures)
		api.Router.set("POST", `${this.route}/plan/feature`, this.createPlanFeature, adminOpts)
		api.Router.set("PUT", `${this.route}/plan/feature`, this.updatePlanFeature, adminOpts)
		api.Router.set("DELETE", `${this.route}/plan/feature`, this.deletePlanFeature, adminOpts)

		// Subscriptions
		api.Router.set("GET", `${this.route}/subscription`, this.getSubscription, opts)
		api.Router.set("GET", `${this.route}/subscriptions`, this.getSubscriptions, adminOpts)

		// Orders
		api.Router.set("GET", `${this.route}/order`, this.getOrder, opts)
		api.Router.set("GET", `${this.route}/orders`, this.getOrders, adminOpts)

		// Invoices
		api.Router.set("GET", `${this.route}/invoice`, this.getInvoice, opts)
		api.Router.set("GET", `${this.route}/invoices`, this.getInvoices, adminOpts)

		// Webhook (public for MoR)
		api.Router.set("POST", `${this.route}/webhook`, this.webhook)
	}

	// Customers
	getCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		return await api.Billing.Customers.get({ id }) ?? { code: 404, error: "Customer not found" }
	}

	getCustomers = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Customers.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	createCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Customers.set(p)
	}

	updateCustomer = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Customers.update(data, { id })
	}

	deleteCustomer = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Customer ID required" }
		return await api.Billing.Customers.delete({ id })
	}

	// Plans
	getPlan = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Plan ID required" }
		return await api.Billing.Plans.get({ id }) ?? { code: 404, error: "Plan not found" }
	}

	getPlans = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Plans.getMany({ is_active: 1 }, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	createPlan = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Plans.set(p)
	}

	updatePlan = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Plan ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Plans.update(data, { id })
	}

	deletePlan = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Plan ID required" }
		return await api.Billing.Plans.delete({ id })
	}

	// Plan Features
	getPlanFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		return await api.Billing.Plans.getFeature({ id }) ?? { code: 404, error: "Feature not found" }
	}

	getPlanFeatures = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const plan_id = Number(p.plan_id)
		return await api.Billing.Plans.getFeatures(plan_id ? { plan_id } : {})
	}

	createPlanFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Plans.setFeature(p)
	}

	updatePlanFeature = async ($: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		const { id: _id, ...data } = p
		return await api.Billing.Plans.updateFeature(data, { id })
	}

	deletePlanFeature = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Feature ID required" }
		return await api.Billing.Plans.deleteFeature({ id })
	}

	// Subscriptions
	getSubscription = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Subscription ID required" }
		return await api.Billing.Subscriptions.get({ id }) ?? { code: 404, error: "Subscription not found" }
	}

	getSubscriptions = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Subscriptions.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	// Orders
	getOrder = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Order ID required" }
		return await api.Billing.Orders.get({ id }) ?? { code: 404, error: "Order not found" }
	}

	getOrders = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Orders.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	// Invoices
	getInvoice = async (_: any, req: Request) => {
		const p = api.getParams(req)
		const id = Number(p.id)
		if (!id) return { code: 422, error: "Invoice ID required" }
		return await api.Billing.Invoices.get({ id }) ?? { code: 404, error: "Invoice not found" }
	}

	getInvoices = async (_: any, req: Request) => {
		const p = api.getParams(req)
		return await api.Billing.Invoices.getMany({}, { limit: Number(p.limit) || 100, offset: Number(p.offset) || 0 })
	}

	// Webhook for LemonSqueezy
	webhook = async (_: any, req: Request) => {
		const p = api.getParams(req)
		// TODO: Validate signature from LemonSqueezy
		return await api.Billing.Events.process({ event: p.meta?.event_name, data: p.data })
	}
}
