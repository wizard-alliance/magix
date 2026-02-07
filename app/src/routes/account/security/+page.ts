import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Security",
	icon: "fa-light fa-shield",
	description: "Manage your account security and active sessions.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/security",
		noindex: true,
	}
})
