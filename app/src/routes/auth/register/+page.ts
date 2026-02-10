import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `auth-register`,
	title: `Register`,
	icon: `fa-light fa-user-plus`,
	description: `Create a new account.`,
	sidebars: { 0: false, 1: false, 2: false },
	seo: {
		canonical: `/auth/register`,
		noindex: true,
	}
})
