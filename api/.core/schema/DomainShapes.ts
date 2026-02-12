export type Settings = {
	ID?: number
	version?: number
	autoload: number
	key: string
	value: string
	dates: {
		created: string | null
		updated: string | null
	}
}


export type User = {
	id: number
	email: string
	username: string
	firstName: string | null
	lastName: string | null
	phone?: string | null
	company?: string | null
	address?: string | null
	avatarUrl?: string | null
	avatar?: import('../services/FileManager.js').FileRecord | null
	password?: string
	activated: boolean
	disabled: boolean
	created: string | null
	updated: string | null
	tosAccepted?: boolean
	deletedAt?: string | null
	pendingEmail?: string | null
}

export type UserDeviceSession = {
	id: number
	valid: boolean
	expires: string | null
	created: string | null
}

export type UserDevice = {
	id: number
	name: string | null
	customName: string | null
	fingerprint: string | null
	userAgent: string | null
	ip: string | null
	lastLogin: string | null
	created: string | null
	current?: boolean
	sessions: UserDeviceSession[]
}

export type UserVendorLink = {
	id: number
	vendor: string
	vendorUserId: string
	vendorEmail: string | null
	vendorUsername: string | null
	created: string | null
}

export type UserSetting = {
	key: string
	value: string | null
}

export type UserFull = {
	id: number
	info: User
	permissions: string[]
	devices: UserDevice[]
	settings: UserSetting[]
	lastLogin: string | null
}

// Billing domain shapes
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

export type BillingInvoice = {
	id: number
	orderId: number
	customerId: number
	billingInfoSnapshot: Record<string, any> | null
	billingOrderSnapshot: Record<string, any> | null
	snapshotVersion: string
	pdfUrl: string | null
	created: string | null
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
}

export type BillingProduct = {
	id: number
	name: string
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
	productId: number
	featureName: string
	description: string | null
	created: string | null
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
}

// Full domain shapes (with related data)
export type BillingCustomerFull = BillingCustomer & {
	subscriptions: BillingSubscription[]
	invoices: BillingInvoice[]
	orders: BillingOrder[]
}

export type BillingProductFull = BillingProduct & {
	features: BillingProductFeature[]
}

// Organization
export type Organization = {
	id: number
	ownerId: number
	parentOrg: number | null
	name: string
	description: string | null
	vatId: string | null
	created: string | null
	updated: string | null
}
