import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings-password`,
	title: `Change Password`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-key`,
	description: `Update your account password.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/password`,
		noindex: true,
	}
})
