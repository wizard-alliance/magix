import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `account-settings-email`,
	title: `Email`,
	parent: `Settings`,
	parents: [`Account`, `Settings`],
	icon: `fa-light fa-envelope`,
	description: `Change your email address.`,
})
