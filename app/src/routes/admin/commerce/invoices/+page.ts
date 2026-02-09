import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-invoices`,
	title: `Invoices`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-file-invoice`,
	description: `Manage all invoices.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/invoices`,
		noindex: true,
	}
})
