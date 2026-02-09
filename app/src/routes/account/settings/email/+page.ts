import { app } from '$lib/app'

export const load = () => ({
	slug: `account-settings-email`,
	title: `Email`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-envelope`,
	description: `Change your email address.`,
	sidebars: { 0: true, 1: true, 2: false },
})
