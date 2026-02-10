import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-security`,
	title: `Security`,
	parent: `Account`,
	parents: [`Account`],
	icon: `fa-light fa-shield`,
	description: `Manage your account security and active sessions.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/security`,
		noindex: true,
	}
})
