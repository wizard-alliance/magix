import { accountNav } from "$configs/nav"

export const load = () => ({
	title: "Change Password",
	icon: "fa-light fa-key",
	description: "Update your account password.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: accountNav,
	seo: {
		canonical: "/account/settings/change-password",
		noindex: true,
	}
})
