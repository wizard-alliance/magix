import { navigationData, getNavigationData } from '$configs/nav'

import type { NavItem, DropdownItem, UserMenuConfig } from '$lib/types/meta'
import type { NavigationLink } from '$lib/types/types'

export class Navigations {
	private readonly prefix = `Navigations`

	tree: NavItem[] = navigationData

	links: NavigationLink[] = [
		{ label: `Home`, href: `/home` },
	]

	userMenu: UserMenuConfig = {
		loggedIn: [
			{ label: `Profile`, href: `/account/profile` },
			{ label: `Settings`, href: `/account/settings` },
			{ label: `Logout`, href: `/auth/logout` },
		],
		loggedOut: [
			{ label: `Login`, href: `/auth/login` },
			{ label: `Register`, href: `/auth/register` },
		],
	}

	get = (slug: string) => getNavigationData(slug)

	list = () => this.links

	getMenu = (isLoggedIn: boolean) =>
		isLoggedIn ? this.userMenu.loggedIn : this.userMenu.loggedOut
}
