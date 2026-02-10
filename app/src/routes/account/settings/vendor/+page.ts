import { app } from '$lib/app'

export const load = () => ({
	slug: `account-vendor`,
	ID: null,
	title: `Connections`,
	parent: `Account`,
	parents: [`Account`],
	icon: `fa-light fa-link`,
	description: `Manage your connected third-party accounts.`,

	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),

	seo: {
		canonical: `/account/vendor`,
		noindex: true,
	}
})
