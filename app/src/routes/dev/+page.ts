import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `dev`,
	title: `Dev`,
	icon: `fa-light fa-code`,
	description: `Development tools and utilities.`,
	seo: {
		noindex: true,
	}
})
