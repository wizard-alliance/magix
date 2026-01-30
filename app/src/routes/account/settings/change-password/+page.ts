import { accountNav } from "$configs/nav"

export const load = () => ({
	title: "Change Password",
	icon: "fa-light fa-key",
	description: "Update your account password.",
	sidebars: { 1: null, 2: null },
	nav: accountNav,
	seo: {
		canonical: "/account/settings/change-password",
		noindex: true,
	}
})
