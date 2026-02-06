import { accountNav } from "$configs/nav"

export const load = () => ({
	ID: null,
	title: "Your profile",
	icon: "fa-light fa-id-badge",
	description: "View and edit your personal profile information.",

    sidebars: { 0: true, 1: true, 2: false },
	nav: accountNav,

	seo: {
        canonical: "/account/profile",
        noindex: false,
        ogImage: "/images/og-profile.png",
    }
})