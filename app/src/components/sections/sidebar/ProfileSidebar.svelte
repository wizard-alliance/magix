<script lang="ts">
	import { onMount } from "svelte"
	import SidebarMenuItem from "$components/modules/sidebarMenuItem.svelte"

	let profile: any = null

	onMount(async () => {
		profile = await app.Auth.me()
	})
</script>

<div class="sub-menu__sidebar">
	<div class="scrollable">
		<nav>
			<h2 class="title">Account</h2>
			<SidebarMenuItem href="/account/profile" icon="fa-user-pen" label="Update profile" />
			<SidebarMenuItem href="/account/profile/settings" icon="fa-key" label="Change password" />
			<SidebarMenuItem href="/account/profile/avatar" icon="fa-camera" label="Change avatar" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-circle-info" label="Account status" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-headset" label="Support" />
		</nav>
		<div class="spacer"></div>

		<nav>
			<h3 class="title">Billing</h3>
			<SidebarMenuItem href="/account/profile" icon="fa-file-invoice" label="Billing details" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-repeat" label="Subscriptions" />
			<SidebarMenuItem href="/admin/dashboard" icon="fa-clock-rotate-left" label="Billing history" />
			<SidebarMenuItem href="/account/profile/settings" icon="fa-receipt" label="Invoices" />
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

	.sub-menu__sidebar {
		--account-height: 60px;
		position: relative;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);

		height: calc(100%);
		padding-bottom: var(--account-height);
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
