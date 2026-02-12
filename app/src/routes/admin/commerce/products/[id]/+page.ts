import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = ({ params }) => pageMeta({
	slug: `admin-commerce-products-edit`,
	title: `Edit Product`,
	parent: `Products`,
	parents: [`Admin`, `Commerce`, `Products`],
	icon: `fa-light fa-pen`,
	description: `Edit a billing product.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/products/${params.id}`,
		noindex: true,
	}
})
