import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `home`,
	title: `Home`,
	icon: `fa-light fa-house`,
	description: `Welcome to your dashboard.`,
	seo: {
		canonical: `/home`,
	}
})
