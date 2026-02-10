import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-invoices`,
	title: `Invoices`,
	parent: `Billing`,
	parents: [`Account`, `Billing`],
	icon: `fa-light fa-file-invoice`,
	description: `View your invoices.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/invoices`,
		noindex: true,
	}
})
