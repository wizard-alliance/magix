import { app } from '$lib/app'

export const load = () => ({
	slug: `account-invoices`,
	title: `Invoices`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-file-invoice`,
	description: `View your invoices.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/invoices`,
		noindex: true,
	}
})
