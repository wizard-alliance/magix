import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-vendor`,
	ID: null,
	title: `Connections`,
	parent: `Account`,
	parents: [`Account`],
	icon: `fa-light fa-link`,
	description: `Manage your connected third-party accounts.`,

	nav: app.Meta.navigations.get(`account/settings`),

	seo: {
		canonical: `/account/vendor`,
		noindex: true,
	}
})
