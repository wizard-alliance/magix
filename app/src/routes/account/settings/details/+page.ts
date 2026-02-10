import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings-details`,
	title: `Account Details`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-file-signature`,
	description: `Edit your personal information.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/details`,
		noindex: true,
	}
})
