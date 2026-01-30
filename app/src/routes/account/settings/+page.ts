import { accountNav } from "$configs/nav"

export const load = () => ({
	title: "Settings",
	icon: "fa-light fa-cog",
	description: "Manage your account settings.",
	sidebars: { 1: null, 2: null },
	nav: accountNav,
	seo: {
		canonical: "/account/settings",
		noindex: true,
	}
})
