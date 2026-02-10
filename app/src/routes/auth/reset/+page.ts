import { pageMeta } from '$lib/pageMeta'

export const load = () => pageMeta({
	slug: `auth-reset`,
	title: `Reset Password`,
	icon: `fa-light fa-lock-keyhole`,
	description: `Reset your account password.`,
	sidebars: { 0: false, 1: false, 2: false },
	seo: {
		canonical: `/auth/reset`,
		noindex: true,
	}
})
