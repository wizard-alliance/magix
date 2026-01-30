import { accountNav } from "$configs/nav"

export const load = () => ({
	ID: null,
	title: "Your profile",
	icon: "fa-light fa-id-badge",
	description: "View and edit your personal profile information.",

    sidebars: { 1: null, 2: null },
	nav: accountNav,

	seo: {
        canonical: "/account/profile",
        noindex: false,
        ogImage: "/images/og-profile.png",
    }
})