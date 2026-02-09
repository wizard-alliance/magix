import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-products`,
	title: `Products`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-box`,
	description: `Manage billing products.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/products`,
		noindex: true,
	}
})
