import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Avatar",
	icon: "fa-light fa-image",
	description: "Change your profile picture.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/settings/avatar",
		noindex: true,
	}
})
