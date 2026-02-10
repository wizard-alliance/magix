import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings-avatar`,
	title: `Avatar`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-image`,
	description: `Change your profile picture.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/avatar`,
		noindex: true,
	}
})
