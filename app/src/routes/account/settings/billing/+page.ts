import { getNavigationData } from "$configs/nav"

export const load = () => ({
	title: "Billing",
	icon: "fa-light fa-credit-card",
	description: "View your billing information.",
	sidebars: { 0: true, 1: true, 2: false },
	nav: getNavigationData("account/settings"),
	seo: {
		canonical: "/account/settings/billing",
		noindex: true,
	}
})
