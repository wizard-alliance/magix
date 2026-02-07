// Billing tables
export type BillingCustomerDBRow = {
	id?: number
	user_id: number | null
	company_id: number | null
	is_guest: number
	billing_name: string | null
	billing_email: string | null
	billing_phone: string | null
	billing_address_line1: string | null
	billing_address_line2: string | null
	billing_city: string | null
	billing_state: string | null
	billing_zip: string | null
	billing_country: string | null
	billing_latitude: number | null
	billing_longitude: number | null
	vat_id: string | null
	created: string | null
	updated: string | null
	deleted_at: string | null
}

export type BillingInvoiceDBRow = {
	id?: number
	order_id: number
	customer_id: number
	billing_info_snapshot: string | null
	billing_order_snapshot: string | null
	snapshot_version: string
	pdf_url: string | null
	created: string | null
}

export type BillingOrderDBRow = {
	id?: number
	customer_id: number
	type: 'subscription' | 'purchase' | 'refund' | 'adjustment' | 'trial'
	subscription_id: number | null
	provider_id: number
	provider_order_id: string
	amount: number
	currency: string
	status: 'pending' | 'paid' | 'failed' | 'refunded' | 'canceled'
	payment_method: string | null
	paid_at: string | null
	created: string | null
	updated: string | null
	deleted_at: string | null
	parent_order_id: number | null
	idempotency_key: string | null
}

export type BillingPaymentProviderDBRow = {
	id?: number
	name: string
	config: string | null
	created: string | null
	updated: string | null
	deleted_at: string | null
}

export type BillingProductFeatureDBRow = {
	id?: number
	product_id: number
	feature_name: string
	description: string | null
	created: string | null
}

export type BillingProductDBRow = {
	id?: number
	name: string
	type: string
	provider_id: string | null
	provider_variant_id: string | null
	price: number
	currency: string
	interval: string
	interval_count: number
	trial_days: number
	sort_order: number
	description: string | null
	is_active: number
	created: string | null
	updated: string | null
	deleted_at: string | null
}

export type BillingSubscriptionDBRow = {
	id?: number
	customer_id: number
	plan_id?: number | null
	provider_subscription_id: string
	current_period_start: string
	current_period_end: string
	cancel_at_period_end: number
	canceled_at: string | null
	paused_at: string | null
	created: string | null
	updated: string | null
	deleted_at: string | null
	status: string
}

// Global tables
export type GlobalAuditLogDBRow = {
	id?: number
	user_id: number
	action: string
	target_table: string
	target_id: number
	created: string | null
	deleted_at: string | null
	ip_address: string | null
	details: string | null
}

export type GlobalCronLogDBRow = {
	id?: number
	job_name: string
	event_type: string
	event_details: string | null
	event_time: string | null
}

export type GlobalSettingDBRow = {
	ID?: number
	version?: number
	autoload: number
	created: string
	updated: string
	key: string
	value: string | null
}

export type GlobalPermissionDBRow = {
	ID?: number
	created?: string
	updated?: string
	key: string
	value: string | null
}

// User tables
export type UserDeviceDBRow = {
	id?: number
	user_id: number
	name: string | null
	custom_name: string | null
	fingerprint: string | null
	user_agent: string | null
	ip: string | null
	last_login: string | null
	created: string | null
	updated: string | null
}

export type UserNotificationDBRow = {
	id?: number
	user_id: number
	type: string
	message: string
	read: number
	created: string | null
}

export type UserOrganizationDBRow = {
	id?: number
	owner_id: number
	parent_org: number | null
	name: string
	description: string | null
	vat_id: string | null
	created: string | null
	updated: string | null
	deleted_at: string | null
}

export type UserPermissionDBRow = {
	id?: number
	user_id: number
	name: string
	value: string | null
	created: string | null
	updated: string | null
}

export type UserSettingDBRow = {
	id?: number
	user_id: number
	key: string
	value: string | null
	created: string | null
	updated: string | null
}

export type UserTokenAccessDBRow = {
	id?: number
	user_id: number
	refresh_token_id: number
	token: string
	expires: string
	created: string | null
}

export type UserTokenRefreshDBRow = {
	id?: number
	user_id: number
	device_id: number | null
	token: string
	valid: number
	expires: string
	created: string | null
	updated: string | null
}

export type UserTokenBlacklistDBRow = {
	id?: number
	user_id: number
	token: string
	token_type: string | null
	reason: string | null
	expires: string
	created: string | null
	updated: string | null
}

export type UserTokenSingleDBRow = {
	id?: number
	user_id: number
	refresh_token_id: number
	token: string
	expires: string
	created: string | null
}

export type DatabaseSchema = {
	// Billing tables
	billing_customers: BillingCustomerDBRow
	billing_invoices: BillingInvoiceDBRow
	billing_orders: BillingOrderDBRow
	billing_payment_providers: BillingPaymentProviderDBRow
	billing_product_features: BillingProductFeatureDBRow
	billing_products: BillingProductDBRow
	billing_subscriptions: BillingSubscriptionDBRow
	// Global tables
	global_audit_logs: GlobalAuditLogDBRow
	global_cron_log: GlobalCronLogDBRow
	global_permissions: GlobalPermissionDBRow
	global_settings: GlobalSettingDBRow
	// User tables
	users: UserDBRow
	user_devices: UserDeviceDBRow
	user_notifications: UserNotificationDBRow
	user_organization: UserOrganizationDBRow
	user_permissions: UserPermissionDBRow
	user_settings: UserSettingDBRow
	user_tokens_access: UserTokenAccessDBRow
	user_tokens_blacklist: UserTokenBlacklistDBRow
	user_tokens_refresh: UserTokenRefreshDBRow
	user_tokens_single: UserTokenSingleDBRow
}


export type ColumnType = 'string' | 'number' | 'date'


export type UserDBRow = {
	id?: number
	username: string
	email: string
	first_name: string | null
	last_name: string | null
	phone: string | null
	company: string | null
	address: string | null
	avatar_url: string | null
	activation_token: string | null
	activated: number
	tos_accepted: number
	disabled: number
	created: string | null
	updated: string | null
	deleted_at: string | null
	password: string
	tfa_enabled: number
	tfa_secret: string | null
	activation_token_expiration: string | null
	failed_login_attempts: number
	lockout_until: string | null
}


export const schemaColumns = {
	// Billing tables
	billing_customers: {
		id: 'number',
		user_id: 'number',
		company_id: 'number',
		is_guest: 'number',
		billing_name: 'string',
		billing_email: 'string',
		billing_phone: 'string',
		billing_address_line1: 'string',
		billing_address_line2: 'string',
		billing_city: 'string',
		billing_state: 'string',
		billing_zip: 'string',
		billing_country: 'string',
		billing_latitude: 'number',
		billing_longitude: 'number',
		vat_id: 'string',
		created: 'date',
		updated: 'date',
		deleted_at: 'date'
	},

	billing_invoices: {
		id: 'number',
		order_id: 'number',
		customer_id: 'number',
		billing_info_snapshot: 'string',
		billing_order_snapshot: 'string',
		snapshot_version: 'string',
		pdf_url: 'string',
		created: 'date'
	},

	billing_orders: {
		id: 'number',
		customer_id: 'number',
		type: 'string',
		subscription_id: 'number',
		provider_id: 'number',
		provider_order_id: 'string',
		amount: 'number',
		currency: 'string',
		status: 'string',
		payment_method: 'string',
		paid_at: 'date',
		created: 'date',
		updated: 'date',
		deleted_at: 'date',
		parent_order_id: 'number',
		idempotency_key: 'string'
	},

	billing_payment_providers: {
		id: 'number',
		name: 'string',
		config: 'string',
		created: 'date',
		updated: 'date',
		deleted_at: 'date'
	},

	billing_product_features: {
		id: 'number',
		product_id: 'number',
		feature_name: 'string',
		description: 'string',
		created: 'date'
	},

	billing_products: {
		id: 'number',
		name: 'string',
		type: 'string',
		provider_id: 'string',
		provider_variant_id: 'string',
		price: 'number',
		currency: 'string',
		interval: 'string',
		interval_count: 'number',
		trial_days: 'number',
		sort_order: 'number',
		description: 'string',
		is_active: 'number',
		created: 'date',
		updated: 'date',
		deleted_at: 'date'
	},

	billing_subscriptions: {
		id: 'number',
		customer_id: 'number',
		plan_id: 'number',
		provider_subscription_id: 'string',
		current_period_start: 'date',
		current_period_end: 'date',
		cancel_at_period_end: 'number',
		canceled_at: 'date',
		paused_at: 'date',
		created: 'date',
		updated: 'date',
		deleted_at: 'date',
		status: 'string'
	},

	// Global tables
	global_audit_logs: {
		id: 'number',
		user_id: 'number',
		action: 'string',
		target_table: 'string',
		target_id: 'number',
		created: 'date',
		deleted_at: 'date',
		ip_address: 'string',
		details: 'string'
	},

	global_cron_log: {
		id: 'number',
		job_name: 'string',
		event_type: 'string',
		event_details: 'string',
		event_time: 'date'
	},

	global_permissions: {
		ID: 'number',
		created: 'date',
		updated: 'date',
		key: 'string',
		value: 'string'
	},

	global_settings: {
		ID: 'number',
		version: 'number',
		autoload: 'number',
		created: 'date',
		updated: 'date',
		key: 'string',
		value: 'string'
	},

	// User tables
	users: {
		id: 'number',
		username: 'string',
		email: 'string',
		first_name: 'string',
		last_name: 'string',
		phone: 'string',
		company: 'string',
		address: 'string',
		avatar_url: 'string',
		activation_token: 'string',
		activated: 'number',
		tos_accepted: 'number',
		disabled: 'number',
		created: 'date',
		updated: 'date',
		deleted_at: 'date',
		password: 'string',
		tfa_enabled: 'number',
		tfa_secret: 'string',
		activation_token_expiration: 'date',
		failed_login_attempts: 'number',
		lockout_until: 'date'
	},

	user_devices: {
		id: 'number',
		user_id: 'number',
		name: 'string',
		custom_name: 'string',
		fingerprint: 'string',
		user_agent: 'string',
		ip: 'string',
		last_login: 'date',
		created: 'date',
		updated: 'date'
	},

	user_notifications: {
		id: 'number',
		user_id: 'number',
		type: 'string',
		message: 'string',
		read: 'number',
		created: 'date'
	},

	user_organization: {
		id: 'number',
		owner_id: 'number',
		parent_org: 'number',
		name: 'string',
		description: 'string',
		vat_id: 'string',
		created: 'date',
		updated: 'date',
		deleted_at: 'date'
	},

	user_permissions: {
		id: 'number',
		user_id: 'number',
		name: 'string',
		value: 'string',
		created: 'date',
		updated: 'date'
	},

	user_settings: {
		id: 'number',
		user_id: 'number',
		key: 'string',
		value: 'string',
		created: 'date',
		updated: 'date'
	},

	user_tokens_access: {
		id: 'number',
		user_id: 'number',
		refresh_token_id: 'number',
		token: 'string',
		expires: 'date',
		created: 'date'
	},

	user_tokens_blacklist: {
		id: 'number',
		user_id: 'number',
		token: 'string',
		token_type: 'string',
		reason: 'string',
		expires: 'date',
		created: 'date',
		updated: 'date'
	},

	user_tokens_refresh: {
		id: 'number',
		user_id: 'number',
		device_id: 'number',
		token: 'string',
		valid: 'number',
		expires: 'date',
		created: 'date',
		updated: 'date'
	},

	user_tokens_single: {
		id: 'number',
		user_id: 'number',
		refresh_token_id: 'number',
		token: 'string',
		expires: 'date',
		created: 'date'
	},

} as const satisfies Record<string, Record<string, ColumnType>>


export type SchemaColumns = typeof schemaColumns
type ColumnSetMap = {
	[K in keyof SchemaColumns]: ReadonlySet<keyof SchemaColumns[K]>
}

const createColumnSet = <T extends Record<string, ColumnType>>(columns: T) => {
	return new Set(Object.keys(columns)) as ReadonlySet<keyof T>
}

export const tableColumnSets: ColumnSetMap = {
	// Billing tables
	billing_customers: createColumnSet(schemaColumns.billing_customers),
	billing_invoices: createColumnSet(schemaColumns.billing_invoices),
	billing_orders: createColumnSet(schemaColumns.billing_orders),
	billing_payment_providers: createColumnSet(schemaColumns.billing_payment_providers),
	billing_product_features: createColumnSet(schemaColumns.billing_product_features),
	billing_products: createColumnSet(schemaColumns.billing_products),
	billing_subscriptions: createColumnSet(schemaColumns.billing_subscriptions),
	// Global tables
	global_audit_logs: createColumnSet(schemaColumns.global_audit_logs),
	global_cron_log: createColumnSet(schemaColumns.global_cron_log),
	global_permissions: createColumnSet(schemaColumns.global_permissions),
	global_settings: createColumnSet(schemaColumns.global_settings),
	// User tables
	users: createColumnSet(schemaColumns.users),
	user_devices: createColumnSet(schemaColumns.user_devices),
	user_notifications: createColumnSet(schemaColumns.user_notifications),
	user_organization: createColumnSet(schemaColumns.user_organization),
	user_permissions: createColumnSet(schemaColumns.user_permissions),
	user_settings: createColumnSet(schemaColumns.user_settings),
	user_tokens_access: createColumnSet(schemaColumns.user_tokens_access),
	user_tokens_blacklist: createColumnSet(schemaColumns.user_tokens_blacklist),
	user_tokens_refresh: createColumnSet(schemaColumns.user_tokens_refresh),
	user_tokens_single: createColumnSet(schemaColumns.user_tokens_single),
}

export type TableMap = {
	// Billing tables
	billing_customers: string
	billing_invoices: string
	billing_orders: string
	billing_payment_providers: string
	billing_product_features: string
	billing_products: string
	billing_subscriptions: string
	// Global tables
	global_audit_logs: string
	global_cron_log: string
	global_permissions: string
	global_settings: string
	// User tables
	users: string
	user_devices: string
	user_notifications: string
	user_organization: string
	user_permissions: string
	user_settings: string
	user_tokens_access: string
	user_tokens_blacklist: string
	user_tokens_refresh: string
	user_tokens_single: string
}


export const TableMap: TableMap = {
	// Billing tables
	billing_customers: "billing_customers",
	billing_invoices: "billing_invoices",
	billing_orders: "billing_orders",
	billing_payment_providers: "billing_payment_providers",
	billing_product_features: "billing_product_features",
	billing_products: "billing_products",
	billing_subscriptions: "billing_subscriptions",
	// Global tables
	global_audit_logs: "global_audit_logs",
	global_cron_log: "global_cron_log",
	global_permissions: "global_permissions",
	global_settings: "global_settings",
	// User tables
	users: "users",
	user_devices: "user_devices",
	user_notifications: "user_notifications",
	user_organization: "user_organization",
	user_permissions: "user_permissions",
	user_settings: "user_settings",
	user_tokens_access: "user_tokens_access",
	user_tokens_blacklist: "user_tokens_blacklist",
	user_tokens_refresh: "user_tokens_refresh",
	user_tokens_single: "user_tokens_single"
}