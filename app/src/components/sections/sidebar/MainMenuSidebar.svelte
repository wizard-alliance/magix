<script lang="ts">
	import SidebarMenuItem from "$components/modules/sidebarMenuItem.svelte"
	import DropdownMenu from "$components/modules/DropdownMenu.svelte"

	let title = "Menu"
	let appName = "App"
	let accountMenuOpen = false
	let toggleAccountMenu: () => void
	let accountTrigger: HTMLElement

	const currentUser = app.State.currentUser

	$: isLoggedIn = !!$currentUser
	$: nickname = $currentUser?.info?.firstName || $currentUser?.info?.username || "Login"
</script>

<div class="main-menu__sidebar">
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div class="account" class:open={accountMenuOpen} bind:this={accountTrigger} on:click={toggleAccountMenu}>
		<div class="avatar"></div>
		<div class="name">{nickname}</div>
		<i class="indicator fa-light fa-angle-down"></i>
		<DropdownMenu bind:open={accountMenuOpen} bind:toggle={toggleAccountMenu} triggerRef={accountTrigger} position="top">
			{#if isLoggedIn}
				<a href="/account/profile"><i class="fa-light fa-user"></i> Profile</a>
				<a href="/account/settings"><i class="fa-light fa-gear"></i> Settings</a>
				<hr />
				<a href="/account/logout"><i class="fa-light fa-arrow-right-from-bracket"></i> Logout</a>
			{:else}
				<a href="/account/login"><i class="fa-light fa-arrow-right-to-bracket"></i> Login</a>
				<a href="/account/register"><i class="fa-light fa-user-plus"></i> Register</a>
			{/if}
		</DropdownMenu>
	</div>

	<div class="scrollable">
		<nav>
			<h3 class="title">{appName}</h3>
			<SidebarMenuItem href="/account/profile" icon="fa-bell" label="News" unread={5} />
			<SidebarMenuItem href="/account/profile/settings" icon="fa-grid-2" label="Dashboard" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-chart-line" label="Deep dive" unread={2} />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-flask" label="Research" unread={0} />
		</nav>
		<div class="spacer"></div>

		<nav>
			<h3 class="title">Account</h3>
			<SidebarMenuItem href="/account/profile" icon="fa-user" label="Profile" />
			<SidebarMenuItem href="/account/profile/settings" icon="fa-gear" label="Settings" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-credit-card" label="Billing" />
		</nav>
		<div class="spacer"></div>

		<nav>
			<SidebarMenuItem href="/admin/dashboard" icon="fa-shield-halved" label="Admin" />
		</nav>
	</div>
</div>

<style>
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

		.avatar {
			--size: 36px;
			display: flex;
			width: var(--size);
			height: var(--size);
			border-radius: 50%;
			background-color: var(--secondary-color);
		}

		.name {
			position: relative;
			top: 1px;
			font-size: 14px;
			font-weight: 500;
			color: var(--white);
		}

		.indicator {
			pointer-events: none;
			position: absolute;
			right: calc(var(--gutter) * 3);
			font-size: 12px;
			color: var(--text-muted);
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
		font-size: 14px;
		font-weight: 500;
		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
		text-decoration: none;
		color: var(--text-muted);
		margin-bottom: calc(var(--gutter) * 0.5);
	}
</style>
