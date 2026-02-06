<script lang="ts">
	import "../styles/global.scss"

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { beforeNavigate, onNavigate } from "$app/navigation"

	import type { DropdownItem } from "$lib/classes/Misc/NavigationRegistry"

	import MainMenuSidebar from "$components/sections/sidebar/MainMenuSidebar.svelte"
	import GlobalMenuSidebar from "$components/sections/sidebar/GlobalMenuSidebar.svelte"
	import NotificationsSidebar from "$components/sections/sidebar/NotificationsSidebar.svelte"
	import PageNav from "$components/sections/PageNav.svelte"
	import Header from "$components/sections/Header.svelte"
	import GlobalTooltip from "$components/modules/GlobalTooltip.svelte"

	let userMenuItems: DropdownItem[] = []
	let menuOpen = false
	let currentUser: any = null
	let prevRouteClass = ""
	let sidebar1: any = null
	let sidebar2: any = null

	$: title = app.Config.pageTitleFull()
	$: pageTitle = app.Config.pageTitle || "Loading..."

	$: routeClass = `page-${$page.url.pathname.split(`/`).filter(Boolean).join(`-`) || `home`}`
	$: if (typeof document !== `undefined`) {
		if (prevRouteClass) document.documentElement.classList.remove(prevRouteClass)
		document.documentElement.classList.add(routeClass)
		prevRouteClass = routeClass
	}

	$: isLoggedIn = !!currentUser
	$: userMenuItems = app.Misc.Navigation.getMenu(isLoggedIn)

	beforeNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) return
		// app.UI.sidebarClearContent(1)
		// app.UI.sidebarClearContent(2)
	})

	onNavigate((navigation) => {
		if (!document.startViewTransition) return
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve()
				await navigation.complete
			})
		})
	})

	onMount(() => {
		// Subscribe to currentUser state
		if (app.State.currentUser?.subscribe) {
			app.State.currentUser.subscribe((user: any) => {
				currentUser = user
			})
		}

		// Close menu on outside click
		const handleUserMenuClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest(".user-menu")) menuOpen = false
		}
		document.addEventListener("click", handleUserMenuClick)
		return () => document.removeEventListener("click", handleUserMenuClick)
	})
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<div class="app">
	<GlobalTooltip />
	<Header />

	<aside class="sidebar sidebar-0 scrollable-hidden">
		<GlobalMenuSidebar />
	</aside>

	<aside class="sidebar sidebar-1 scrollable-hidden">
		<MainMenuSidebar />
	</aside>

	{#if $page.data.nav}
		<PageNav nav={$page.data.nav} />
	{/if}

	<main class="main">
		<slot />
	</main>

	<aside class="sidebar sidebar-2 scrollable">
		<NotificationsSidebar />
	</aside>
</div>

<style lang="scss" scoped>
</style>
