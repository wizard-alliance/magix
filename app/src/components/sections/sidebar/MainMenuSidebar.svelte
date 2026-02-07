<script lang="ts">
	import SidebarMenuItem from "$components/modules/sidebarMenuItem.svelte"
	import DropdownMenu from "$components/modules/DropdownMenu.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import { navigationData as navData } from "$configs/nav.js"
	import { onMount, tick } from "svelte"

	let accountMenuOpen = false
	let toggleAccountMenu: () => void
	let accountTrigger: HTMLElement
	let scrollable: HTMLElement

	const currentUser = app.State.currentUser

	$: isLoggedIn = !!$currentUser
	$: userInfo = $currentUser && "info" in $currentUser ? $currentUser.info : $currentUser
	$: nickname = userInfo?.firstName || userInfo?.username || "Login"
	$: avatarSrc = userInfo?.avatarUrl ? (app.Account.Avatar.url(userInfo.avatarUrl) ?? "") : ""

	onMount(async () => {
		await tick()
		const active = scrollable?.querySelector(`.active`)
		const activeSub = scrollable?.querySelector(`.active`)
		if (active) {
			active.scrollIntoView({ block: `nearest`, behavior: `instant` })
		}
		if (!active && activeSub) {
			activeSub.scrollIntoView({ block: `nearest`, behavior: `instant` })
		}
	})
</script>

<div class="main-menu__sidebar">
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="account" class:open={accountMenuOpen} bind:this={accountTrigger} on:click={toggleAccountMenu}>
		<Avatar name={nickname} src={avatarSrc || ""} size="sm" />
		<div class="name">{nickname}</div>
		<i class="indicator fa-light fa-angle-down"></i>
		<DropdownMenu bind:open={accountMenuOpen} bind:toggle={toggleAccountMenu} triggerRef={accountTrigger} position="top">
			{#if isLoggedIn}
				<a href="/account/profile"><i class="fa-light fa-user"></i> Profile</a>
				<a href="/account/settings"><i class="fa-light fa-gear"></i> Settings</a>
				<hr />
				<a href="/auth/logout"><i class="fa-light fa-arrow-right-from-bracket"></i> Logout</a>
			{:else}
				<a href="/auth/login"><i class="fa-light fa-arrow-right-to-bracket"></i> Login</a>
				<a href="/auth/register"><i class="fa-light fa-user-plus"></i> Register</a>
			{/if}
		</DropdownMenu>
	</div>

	<div class="scrollable" bind:this={scrollable}>
		{#each navData as section}
			<nav>
				{section.href}
				{#if !section.href}
					<h3 class="title">{section.label}</h3>
				{/if}
				{#each section.children as item}
					<SidebarMenuItem href={item.href ?? undefined} icon={item.icon} label={item.label} unread={0} children={item.children || []} />
				{/each}
			</nav>
			{#if section !== navData[navData.length - 1]}
				<div class="spacer"></div>
			{/if}
		{/each}
	</div>
</div>

<style lang="scss" scoped>
	.spacer {
		width: 100%;
		height: 1px;
		background-color: var(--border-color);
		margin-top: calc(var(--gutter) * 1);
		margin-bottom: calc(var(--gutter) * 2);
	}

	.main-menu__sidebar {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);

		height: calc(100%);
		padding-bottom: var(--account-height);

		font-size: 5rem !important;
	}

	:global(.main-menu__sidebar) {
		i,
		a,
		span,
		.title {
			font-size: inherit;
		}
	}

	.account {
		position: absolute;
		height: var(--account-height);
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1.5);
		padding: 0 calc(var(--gutter) * 2);
		border-top: var(--border);
		bottom: 0;
		width: 100%;
		background-color: var(--bg-color);
		z-index: 50;
		user-select: none;
		cursor: pointer;

		flex-wrap: nowrap;
		flex-direction: row;
		justify-content: flex-start;

		&:hover {
			background-color: var(--secondary-color);
			.indicator {
				color: white;
			}
		}

		.name {
			position: relative;
			top: 1px;
			font-size: inherit;
			font-weight: 500;
			color: var(--white);
		}

		.indicator {
			pointer-events: none;
			position: absolute;
			right: calc(var(--gutter) * 3);
			font-size: inherit;
			color: var(--muted-color);
			transform: translateX(calc(var(--gutter) * 1)) rotate(0deg);
			transition:
				opacity 600ms cubic-bezier(0, 0, 0, 1),
				transform 600ms cubic-bezier(0, 0, 0, 1),
				color 600ms cubic-bezier(0, 0, 0, 1);
		}

		&.open .indicator {
			transform: translateX(calc(var(--gutter) * 1)) rotate(180deg);
		}
	}

	nav:first-child {
		margin-top: calc(var(--gutter) * 2);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.5);
	}

	nav .title {
		user-select: none;
		font-size: inherit;
		font-weight: 500;
		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
		text-decoration: none;
		color: var(--muted-color);
		margin-bottom: calc(var(--gutter) * 0.5);
	}

	.scrollable :global(.active),
	.scrollable :global(.active-sub) {
		scroll-margin: 50px;
	}

	.scrollable *:last-child {
		margin-bottom: calc(var(--gutter) * 1);
	}
</style>
