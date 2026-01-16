<script lang="ts">
	import "../styles/global.scss"

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { beforeNavigate, onNavigate } from "$app/navigation"

	import type { NavigationLink } from "$lib/types/types"
	import type { DropdownItem } from "$lib/classes/Misc/NavigationRegistry"

	import MainMenuSidebar from "$components/sections/sidebar/MainMenuSidebar.svelte"

	let navLinks: NavigationLink[] = []
	let userMenuItems: DropdownItem[] = []
	let title = "Loading..."
	let menuOpen = false
	let currentUser: any = null
	let prevRouteClass = ""
	let sidebar1: any = null
	let sidebar2: any = null

	$: routeClass = `page-${$page.url.pathname.split(`/`).filter(Boolean).join(`-`) || `home`}`
	$: if (typeof document !== `undefined`) {
		if (prevRouteClass) document.documentElement.classList.remove(prevRouteClass)
		document.documentElement.classList.add(routeClass)
		prevRouteClass = routeClass
	}

	$: isLoggedIn = !!currentUser
	$: userMenuItems = app.Misc.Navigation.getMenu(isLoggedIn)
	$: displayName = currentUser?.username || currentUser?.firstName || "User"

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
		navLinks = app.Misc.Navigation.list()
		title = app.Config.pageTitleFull()

		// Subscribe to currentUser state
		if (app.State.currentUser?.subscribe) {
			app.State.currentUser.subscribe((user: any) => {
				currentUser = user
			})
		}

		// Close menu on outside click
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement
			if (!target.closest(".user-menu")) menuOpen = false
		}
		document.addEventListener("click", handleClick)
		return () => document.removeEventListener("click", handleClick)
	})

	const toggleMenu = () => {
		menuOpen = !menuOpen
	}
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
				<nav class="col-xs middle-xs end-xs height-100p main-nav">
					<a href="/home" class:active={$page.url.pathname === "/home"}>Home</a>
					<a href="/account/login" class:active={$page.url.pathname === "/account/login"}>Login</a>

					{#if isLoggedIn}
						<div class="user-menu">
							<button class="avatar-btn" aria-label="User menu" on:click|stopPropagation={toggleMenu}>
								<span class="user-name">{displayName}</span>
								<span class="avatar"></span>
							</button>
							{#if menuOpen}
								<div class="menu">
									{#each userMenuItems as item}
										<a href={item.href}>{item.label}</a>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<a href="/account/register" class:active={$page.url.pathname === "/account/register"}>Register</a>
					{/if}
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

	<main class="main">
		<slot />
	</main>

	<aside class="sidebar sidebar-2 sidebar-status scrollable">
		{#if $sidebar2}
			<svelte:component this={$sidebar2.component} {...$sidebar2.props} />
		{/if}
	</aside>
</div>

<style>
	.main-nav {
		display: flex;
		align-items: center;
		gap: var(--gutter);
	}

	.user-menu {
		position: relative;
	}

	.avatar-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
	}

	.user-name {
		color: var(--white);
		font-size: 14px;
	}

	.avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: var(--border);
		background: var(--secondary-color);
	}

	.menu {
		position: absolute;
		right: 0;
		top: 44px;
		background: var(--primary-color);
		border: var(--border);
		border-radius: var(--border-radius);
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 160px;
		z-index: 100;
	}

	.menu a {
		color: var(--white);
		text-decoration: none;
		padding: 8px 12px;
		border-radius: 6px;
	}

	.menu a:hover {
		background: var(--secondary-color);
	}
</style>
