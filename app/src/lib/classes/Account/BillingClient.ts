export type BillingFormData = {
	billingName?: string
	billingEmail?: string
	billingPhone?: string
	addressLine1?: string
	addressLine2?: string
	city?: string
	state?: string
	zip?: string
	country?: string
	vatId?: string
}

export type BillingCustomerResponse = {
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
	}
	vatId: string | null
}

export class BillingClient {

	/**
	 * Get the current user's billing customer record
	 * Auto-creates a stub if none exists
	 */
	async get(): Promise<BillingCustomerResponse | null> {
		try {
			return await app.System.Request.get<BillingCustomerResponse>(`/billing/customer`)
		} catch {
			return null
		}
	}

	/**
	 * Update the current user's billing info
	 */
	async save(data: BillingFormData): Promise<BillingCustomerResponse | null> {
		return await app.System.Request.put<BillingCustomerResponse>(`/billing/customer/me`, {
			body: data,
		})
	}

	/**
	 * Flatten the nested API response into form-friendly flat fields
	 */
	toForm(customer: BillingCustomerResponse | null): BillingFormData {
		if (!customer) return {}
		return {
			billingName: customer.billingName ?? ``,
			billingEmail: customer.billingEmail ?? ``,
			billingPhone: customer.billingPhone ?? ``,
			addressLine1: customer.billingAddress?.line1 ?? ``,
			addressLine2: customer.billingAddress?.line2 ?? ``,
			city: customer.billingAddress?.city ?? ``,
			state: customer.billingAddress?.state ?? ``,
			zip: customer.billingAddress?.zip ?? ``,
			country: customer.billingAddress?.country ?? ``,
			vatId: customer.vatId ?? ``,
		}
	}
}
