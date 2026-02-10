import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `auth-logout`,
	title: `Logout`,
	icon: `fa-light fa-right-from-bracket`,
	description: `Sign out of your account.`,
	sidebars: { 0: false, 1: false, 2: false },
	seo: {
		noindex: true,
	}
})
