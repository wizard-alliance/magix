import { app } from '$lib/app'

export const load = () => ({
	slug: `admin-commerce-tools`,
	title: `Commerce Tools`,
	parent: `Commerce`,
	parents: [`Admin`, `Commerce`],
	icon: `fa-light fa-flask`,
	description: `LemonSqueezy admin tools and webhook event simulator.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`admin`),
	seo: {
		canonical: `/admin/commerce/tools`,
		noindex: true,
	}
})
