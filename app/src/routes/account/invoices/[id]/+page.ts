import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = ({ params }: { params: { id: string } }) => pageMeta({
	slug: `account-invoice-view`,
	title: `Invoice`,
	parent: `Invoices`,
	parents: [`Account`, `Billing`, `Invoices`],
	icon: `fa-light fa-file-invoice`,
	description: `View invoice details.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/invoices/${params.id}`,
		noindex: true,
	}
})
