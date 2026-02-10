import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `auth-login`,
	title: `Login`,
	icon: `fa-light fa-right-to-bracket`,
	description: `Sign in to your account.`,
	sidebars: { 0: false, 1: false, 2: false },
	seo: {
		canonical: `/auth/login`,
		noindex: true,
	}
})
