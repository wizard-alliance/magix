import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Settings",
	icon: "fa-light fa-cog",
	description: "Manage your account settings.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/settings",
		noindex: true,
	}
})
