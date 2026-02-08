import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings-details`,
	title: `Account Details`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-file-signature`,
	description: `Edit your personal information.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/details`,
		noindex: true,
	}
})
