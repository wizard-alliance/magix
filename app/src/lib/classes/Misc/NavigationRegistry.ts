
import type { NavigationLink } from "$lib/types/types"

export interface DropdownItem {
	label: string
	href?: string
	action?: string
}

export interface UserMenuConfig {
	loggedIn: DropdownItem[]
	loggedOut: DropdownItem[]
}

export class NavigationRegistry {
	private readonly prefix = "NavigationRegistry"

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

	list = () => this.links
	getMenu = (isLoggedIn: boolean) => isLoggedIn ? this.userMenu.loggedIn : this.userMenu.loggedOut
}
