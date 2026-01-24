<script lang="ts">
	import SidebarMenuItem from "$components/modules/sidebarMenuItem.svelte"
</script>

<div class="sub-menu__sidebar">
	<div class="scrollable">
		<nav>
			<h2 class="title">Account</h2>
			<SidebarMenuItem href="/account/profile" icon="fa-user" label="Profile" />
			<SidebarMenuItem href="/account/settings" icon="fa-gear" label="Settings" />
			<SidebarMenuItem href="/account/settings/change-password" icon="fa-key" label="Password" />
		</nav>
	</div>
</div>

<style>
	.sub-menu__sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.5);
		padding: calc(var(--gutter) * 2);
	}

	.title {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		margin-bottom: calc(var(--gutter) * 0.5);
		padding-left: calc(var(--gutter) * 0.5);
	}
</style>
