<script lang="ts">
	import "../styles/global.scss"

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { beforeNavigate, onNavigate } from "$app/navigation"

	import type { DropdownItem } from "$lib/classes/Misc/NavigationRegistry"

	import MainMenuSidebar from "$components/sections/sidebar/MainMenuSidebar.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import PageNav from "$components/sections/PageNav.svelte"

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
		app.UI.sidebarClearContent(1)
		app.UI.sidebarClearContent(2)
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
		app.UI.sidebarInit()
		sidebar1 = app.State.ui.sidebar1
		sidebar2 = app.State.ui.sidebar2

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
	<header>
		<div class="left-header">
			<a class="logo" href="/" aria-label={app.Config.name}>{app.Config.name}</a>
		</div>
		<div class="right-header">
			<div class="row middle-xs height-100p">
				<div class="col-xs page-title__wrapper">
					<i class="icon fa-light fa-arrow-left-to-bracket toggle-menu"></i>
					<h3 class="page-title">{$page.data.title || "Loading..."}</h3>
				</div>
				<nav class="col-xs middle-xs end-xs height-100p main-nav">
					<a href="/dev" class:active={$page.url.pathname.startsWith("/dev")}>Dev</a>

					<div class="bell">
						<span data-count="2"></span>
						<i class="fa-light fa-bell"></i>
					</div>
				</nav>
			</div>
		</div>
	</header>

	<aside class="sidebar sidebar-0 scrollable-hidden">
		<MainMenuSidebar />
	</aside>

	<aside class="sidebar sidebar-1 scrollable-hidden">
		{#if $sidebar1}
			<svelte:component this={$sidebar1.component} {...$sidebar1.props} />
		{/if}
	</aside>

	{#if $page.data.nav}
		<PageNav nav={$page.data.nav} />
	{/if}

	<main class="main">
		<slot />
	</main>

	<aside class="sidebar sidebar-2 sidebar-status scrollable">
		{#if $sidebar2}
			<svelte:component this={$sidebar2.component} {...$sidebar2.props} />
		{/if}
	</aside>
</div>

<style lang="scss" scoped>
	.page-title__wrapper {
		display: flex;
		align-items: center;

		margin-left: calc(var(--gutter) * 2);

		.icon {
			margin-right: 8px;
			color: var(--white);
			font-size: 16px;
			opacity: 0.7;
		}

		.page-title {
			color: var(--white);
			margin: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			font-size: 16px;
			font-weight: 500;
		}
	}

	.main-nav {
		display: flex;
		align-items: center;
		gap: var(--gutter);
	}
</style>
