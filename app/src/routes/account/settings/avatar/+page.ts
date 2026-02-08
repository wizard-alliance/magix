import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings-avatar`,
	title: `Avatar`,
	icon: `fa-light fa-image`,
	description: `Change your profile picture.`,
	sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
		canonical: `/account/settings/avatar`,
		noindex: true,
	}
})
