import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-commerce-invoices`,
	title: `Invoices`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-file-invoice`,
	description: `Manage all invoices.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/invoices`,
		noindex: true,
	}
})
