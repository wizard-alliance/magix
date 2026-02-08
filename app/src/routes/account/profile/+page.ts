import { app } from '$lib/app'

export const load = () => ({
	slug: `account-profile`,
	ID: null,
	title: `Your profile`,
	icon: `fa-light fa-id-badge`,
	description: `View and edit your personal profile information.`,

    sidebars: { 0: true, 1: true, 2: false },
	nav: app.Meta.navigations.get(`account/settings`),

	seo: {
        canonical: `/account/profile`,
        noindex: false,
        ogImage: `/images/og-profile.png`,
    }
})