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

	// Sidebar visibility stores (destructured for Svelte $ reactivity)
	const sidebar0Visible = app.State.UI.sidebar0Visible
	const sidebar1Visible = app.State.UI.sidebar1Visible
	const sidebar2Visible = app.State.UI.sidebar2Visible
	const notificationsOpen = app.State.UI.notificationsOpen
	const menuOpenStore = app.State.UI.menuOpen

	$: title = app.Config.pageTitleFull()
	$: pageTitle = app.Config.pageTitle || "Loading..."

	$: routeClass = `page-${$page.url.pathname.split(`/`).filter(Boolean).join(`-`) || `home`}`
	$: if (typeof document !== `undefined`) {
		if (prevRouteClass) document.documentElement.classList.remove(prevRouteClass)
		document.documentElement.classList.add(routeClass)
		prevRouteClass = routeClass
	}

	// Apply sidebar config from page load data (flash-free, runs during SSR)
	$: if ($page.data.sidebars !== undefined) {
		app.UI.applySidebarConfig($page.data.sidebars)
	}

	// Derive attribute values from stores (used in template bindings)
	$: attrSidebar0 = $sidebar0Visible ? `visible` : `hidden`
	$: attrSidebar1 = $sidebar1Visible ? `visible` : `hidden`
	$: attrSidebar2 = $sidebar2Visible ? `visible` : `hidden`
	$: attrNotifications = $notificationsOpen ? `true` : `false`
	$: attrMenu = $menuOpenStore ? `true` : `false`

	$: isLoggedIn = !!currentUser
	$: userMenuItems = app.UI.Navigation.getMenu(isLoggedIn)

	beforeNavigate(({ from, to }) => {
		if (from?.url.pathname === to?.url.pathname) return
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

<div class="app" data-sidebar-0={attrSidebar0} data-sidebar-1={attrSidebar1} data-sidebar-2={attrSidebar2} data-notifications-open={attrNotifications} data-menu-open={attrMenu}>
	<GlobalTooltip />
	<Header />

	<aside class="sidebar sidebar-0 scrollable-hidden">
		<GlobalMenuSidebar />
	</aside>

	<aside class="sidebar sidebar-1 scrollable-hidden">
		<MainMenuSidebar />
	</aside>

	<main class="main">
		{#if $page.data.nav}
			<PageNav nav={$page.data.nav} />
		{/if}

		<div class="scrollable">
			<slot />
		</div>
	</main>

	<aside class="sidebar sidebar-2 scrollable">
		<NotificationsSidebar />
	</aside>
</div>
