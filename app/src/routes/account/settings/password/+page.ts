import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Change Password",
	icon: "fa-light fa-key",
	description: "Update your account password.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/settings/password",
		noindex: true,
	}
})
