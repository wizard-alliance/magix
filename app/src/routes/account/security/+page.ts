import { app } from '$lib/app'

export const load = () => ({
	slug: `account-security`,
	title: `Security`,
	icon: `fa-light fa-shield`,
	description: `Manage your account security and active sessions.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/security`,
		noindex: true,
	}
})
