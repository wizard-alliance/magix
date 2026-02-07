import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Account Details",
	icon: "fa-light fa-file-signature",
	description: "Edit your personal information.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/settings/details",
		noindex: true,
	}
})
