import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `dev-components`,
	title: `Components`,
	parent: `Dev`,
	parents: [`Dev`],
	icon: `fa-light fa-puzzle-piece`,
	description: `Component library and examples.`,
	seo: {
		noindex: true,
	}
})
