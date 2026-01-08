<script lang="ts">
	import "../styles/global.scss"

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import { page } from "$app/stores"
	import { onNavigate } from "$app/navigation"

	import type { NavigationLink } from "$lib/types/types"
	import type { DropdownItem } from "$lib/classes/Misc/NavigationRegistry"

	let navLinks: NavigationLink[] = []
	let userMenuItems: DropdownItem[] = []
	let title = "Loading..."
	let menuOpen = false
	let isLoggedIn = false
	let prevRouteClass = ""

	$: routeClass = `page-${$page.url.pathname.split(`/`).filter(Boolean).join(`-`) || `home`}`
	$: if (typeof document !== `undefined`) {
		if (prevRouteClass) document.documentElement.classList.remove(prevRouteClass)
		document.documentElement.classList.add(routeClass)
		prevRouteClass = routeClass
	}

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
		navLinks = window.app.Misc.Navigation.list()
		isLoggedIn = !!window.app.Auth?.user
		userMenuItems = window.app.Misc.Navigation.getMenu(isLoggedIn)
		title = app.Config.pageTitleFull()
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
		<div class="row middle-xs height-100p">
			<div class="col middle-xs center-xs logo">
				<a class="logo-graphic" href="/" aria-label={app.Config.name}>{app.Config.name}</a>
			</div>
			<nav class="col-xs middle-xs end-xs height-100p main-nav">
				{#each navLinks as link}
					<a href={link.href} class:active={$page.url.pathname === link.href}>{link.label}</a>
				{/each}
				<div class="user-menu">
					<button class="avatar" aria-label="User menu" on:click={toggleMenu}></button>
					{#if menuOpen}
						<div class="menu">
							{#each userMenuItems as item}
								<a href={item.href}>{item.label}</a>
							{/each}
						</div>
					{/if}
				</div>
			</nav>
		</div>
	</header>

	<aside class="sidebar sidebar-1 sidebar-guilds scrollable-hidden"></aside>

	<main class="main">
		<slot />
	</main>

	<aside class="sidebar sidebar-2 sidebar-status scrollable"></aside>
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

	.avatar {
		width: 38px;
		height: 38px;
		border-radius: 50%;
		border: var(--border);
		background: var(--secondary-color);
		cursor: pointer;
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
