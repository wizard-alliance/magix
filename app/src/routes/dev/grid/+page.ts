import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `dev-grid`,
	title: `Grid System`,
	parent: `Dev`,
	parents: [`Dev`],
	icon: `fa-light fa-grid`,
	description: `CSS grid system reference and examples.`,
	seo: {
		noindex: true,
	}
})
