import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings-password`,
	title: `Change Password`,
	icon: `fa-light fa-key`,
	description: `Update your account password.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/password`,
		noindex: true,
	}
})
