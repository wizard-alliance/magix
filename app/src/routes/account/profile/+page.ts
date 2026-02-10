import { app } from '$lib/app'
import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-profile`,
	ID: null,
	title: `Your profile`,
	parent: `Account`,
	parents: [`Account`],
	icon: `fa-light fa-id-badge`,
	description: `View and edit your personal profile information.`,
	nav: app.Meta.navigations.get(`account/settings`),
	seo: {
        canonical: `/account/profile`,
        noindex: false,
        ogImage: `/images/og-profile.png`,
    }
})
