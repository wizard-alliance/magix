import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `admin-commerce-features`,
	title: `Features`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-stars`,
	description: `Manage product features.`,
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/features`,
		noindex: true,
	}
})
