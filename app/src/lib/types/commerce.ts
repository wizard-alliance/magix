export type BillingCustomer = {
	id: number
	userId: number | null
	companyId: number | null
	isGuest: boolean
	billingName: string | null
	billingEmail: string | null
	billingPhone: string | null
	billingAddress: {
		line1: string | null
		line2: string | null
		city: string | null
		state: string | null
		zip: string | null
		country: string | null
		latitude: number | null
		longitude: number | null
	}
	vatId: string | null
	providerCustomerId: string | null
	created: string | null
	updated: string | null
}

export type BillingOrder = {
	id: number
	customerId: number
	type: 'subscription' | 'purchase' | 'refund' | 'adjustment' | 'trial'
	subscriptionId: number | null
	providerOrderId: string
	amount: number
	currency: string
	status: 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled'
	paymentMethod: string | null
	paidAt: string | null
	created: string | null
	updated: string | null
	parentOrderId: number | null
	idempotencyKey: string | null
	customerName?: string
	customerEmail?: string
	planName?: string
}

export type BillingSubscription = {
	id: number
	customerId: number
	planId?: number | null
	providerSubscriptionId: string
	currentPeriodStart: string
	currentPeriodEnd: string
	cancelAtPeriodEnd: boolean
	canceledAt: string | null
	pausedAt: string | null
	status: string
	created: string | null
	updated: string | null
	customerName?: string
	planName?: string
}

export type BillingProduct = {
	id: number
	name: string
	variationName: string | null
	type: string
	providerId: string | null
	providerVariantId: string | null
	price: number
	currency: string
	interval: string
	intervalCount: number
	trialDays: number
	sortOrder: number
	description: string | null
	isActive: boolean
	created: string | null
	updated: string | null
}

export type BillingProductFeature = {
	id: number
	providerId: string
	featureName: string
	description: string | null
	sortOrder: number
	created: string | null
}

export type BillingProductMeta = {
	id: number
	productId: number
	key: string
	value: string | null
	created: string | null
	updated: string | null
}

export type BillingProductFull = BillingProduct & {
	features: BillingProductFeature[]
	meta: BillingProductMeta[]
}

export type BillingProductGroup = {
	providerId: string
	name: string
	slug: string | null
	sortOrder: number
	description: string | null
	features: BillingProductFeature[]
	meta: BillingProductMeta[]
	variants: BillingProduct[]
}

export type BillingInvoice = {
	id: number
	orderId: number
	customerId: number
	billingCustomersSnapshot: Record<string, any> | null
	billingOrderSnapshot: Record<string, any> | null
	snapshotVersion: string
	pdfUrl: string | null
	created: string | null
	customerName?: string
	customerEmail?: string
}

export type BillingCustomerFull = BillingCustomer & {
	subscriptions: BillingSubscription[]
	invoices: BillingInvoice[]
	orders: BillingOrder[]
}

export type BillingFormData = {
	billingName?: string
	billingPhone?: string
	addressLine1?: string
	addressLine2?: string
	city?: string
	state?: string
	zip?: string
	country?: string
	vatId?: string
}
