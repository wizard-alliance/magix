import type { UserDBRow, UserFull } from '../../types/types'
import type { BillingSubscription } from '../../types/commerce'

const BYPASS_PERMS = ['administrator', 'admin']
const ACTIVE_SUB_STATUSES = ['active', 'paused', 'past_due']

export class AbilityClient {

	private user: UserFull | UserDBRow | null = null
	private perms = new Set<string>()
	private subscriptions: BillingSubscription[] = []

	/**
	 * Subscribe to currentUser store so permissions stay in sync
	 */
	init() {
		app.State.currentUser.subscribe((user: UserFull | UserDBRow | null) => {
			this.user = user
			this.perms.clear()
			if (user && 'permissions' in user) {
				for (const p of user.permissions) this.perms.add(this.normalize(p))
			}
		})
	}

	// ——— Permission checks ———

	/**
	 * Check if user has a specific permission
	 * Supports trailing wildcards (e.g. "billing.*" matches "billing.read")
	 * Admin users bypass all checks
	 */
	can(perm: string): boolean {
		if (!this.user || !this.perms.size) return false
		if (this.hasBypass()) return true
		return this.match(this.normalize(perm), this.perms)
	}

	/**
	 * Check if user has ANY of the given permissions (OR logic)
	 */
	canAny(...perms: string[]): boolean {
		if (!this.user || !this.perms.size) return false
		if (this.hasBypass()) return true
		return perms.some(p => this.match(this.normalize(p), this.perms))
	}

	/**
	 * Check if user has ALL of the given permissions (AND logic)
	 */
	canAll(...perms: string[]): boolean {
		if (!this.user || !this.perms.size) return false
		if (this.hasBypass()) return true
		return perms.every(p => this.match(this.normalize(p), this.perms))
	}

	// ——— Status getters ———

	get isAdmin(): boolean {
		return this.hasBypass()
	}

	get isActive(): boolean {
		const info = this.getInfo()
		if (!info) return false
		return info.activated && !info.disabled
	}

	get isLockedOut(): boolean {
		const info = this.getInfo()
		return !!info?.disabled
	}

	get isDeleted(): boolean {
		const info = this.getInfo()
		return !!info?.deletedAt
	}

	// ——— Subscription helpers ———

	get isSubscriber(): boolean {
		return this.subscriptions.some(s => ACTIVE_SUB_STATUSES.includes(s.status))
	}

	get isPaidSubscriber(): boolean {
		return this.subscriptions.some(s => s.status === 'active')
	}

	/**
	 * Check if user owns a specific subscription by ID
	 */
	owns(subscriptionId: number): boolean {
		return this.subscriptions.some(s => s.id === subscriptionId)
	}

	/**
	 * Load current user's subscriptions from billing customer endpoint
	 * Uses short-lived cache to avoid excessive API calls
	 */
	async loadSubscriptions(): Promise<void> {
		if (!app.Auth.isLoggedIn()) {
			this.subscriptions = []
			return
		}

		const cached = app.Cache.get<BillingSubscription[]>('auth:ability:subs')
		if (cached) {
			this.subscriptions = cached
			return
		}

		try {
			const customer = await app.Commerce.Customer.get()
			if (customer && 'subscriptions' in customer) {
				this.subscriptions = customer.subscriptions ?? []
			} else {
				this.subscriptions = []
			}
			app.Cache.set('auth:ability:subs', this.subscriptions, 2)
		} catch {
			this.subscriptions = []
		}
	}

	/**
	 * Force-refresh subscription data (call after checkout, cancel, pause, resume)
	 */
	async refresh(): Promise<void> {
		app.Cache.clear('auth:ability:subs')
		await this.loadSubscriptions()
	}

	/**
	 * Clear all ability state (called on logout)
	 */
	clear() {
		this.user = null
		this.perms.clear()
		this.subscriptions = []
		app.Cache.clear('auth:ability:subs')
	}

	// ——— Private helpers ———

	/**
	 * Normalize permission string: lowercase, underscores/spaces → dots
	 */
	private normalize(perm: string): string {
		return perm.toLowerCase().replace(/[_\s]+/g, '.')
	}

	/**
	 * Match a requested permission against the granted set
	 * Supports trailing wildcard: "billing.*" matches "billing.read"
	 */
	private match(requested: string, granted: Set<string>): boolean {
		if (granted.has(requested)) return true
		for (const perm of granted) {
			if (perm.endsWith('.*')) {
				const prefix = perm.slice(0, -1) // "billing.*" → "billing."
				if (requested.startsWith(prefix)) return true
			}
		}
		return false
	}

	/**
	 * Check if user has admin bypass permissions
	 */
	private hasBypass(): boolean {
		return BYPASS_PERMS.some(bp => this.perms.has(bp))
	}

	/**
	 * Get user info regardless of UserDBRow vs UserFull shape
	 */
	private getInfo(): UserDBRow | null {
		if (!this.user) return null
		if ('info' in this.user) return this.user.info
		return this.user
	}
}
