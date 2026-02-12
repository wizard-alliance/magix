export class ConfigRoute {
	private readonly route = `config`
	private readonly cacheKey = `config:public`

	public routes = async () => {
		api.Router.set(`GET`, this.route, this.get)
	}

	get = async () => {
		const cached = api.Cache.get(this.cacheKey)
		if (cached) return cached

		const [settingsRows, permissions, products, features] = await Promise.all([
			api.DB.connection.selectFrom(`global_settings`).select([`key`, `value`]).execute(),
			api.User.Permissions.listDefined(),
			api.Billing.Products.getMany({ is_active: 1 }),
			api.Billing.Products.getFeatures({}),
		])

		const featureMap = new Map<number, typeof features>()
		for (const f of features) {
			const list = featureMap.get(f.productId) || []
			list.push(f)
			featureMap.set(f.productId, list)
		}

		const result = {
			settings: settingsRows.map(r => ({ key: r.key, value: r.value })),
			permissions,
			products: products.map(p => ({ ...p, features: featureMap.get(p.id) || [] })),
		}

		api.Cache.set(this.cacheKey, result, 2)
		return result
	}
}
