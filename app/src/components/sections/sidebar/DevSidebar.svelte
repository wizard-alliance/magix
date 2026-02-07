<script lang="ts">
	import SidebarMenuItem from "$components/modules/sidebarMenuItem.svelte"
</script>

<div class="sub-menu__sidebar">
	<div class="scrollable">
		<nav>
			<h2 class="title">Developer</h2>
			<SidebarMenuItem href="/dev" icon="fa-code" label="Overview" />
			<SidebarMenuItem href="/dev/components" icon="fa-cube" label="Components" />
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
		font-size: var(--font-size-small);
		font-weight: 500;
		color: var(--muted-color);
		margin-bottom: calc(var(--gutter) * 0.5);
		padding-left: calc(var(--gutter) * 0.5);
	}
</style>
