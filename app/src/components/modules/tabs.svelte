<script lang="ts">
	export let tabs: { id: string; label: string }[] = []
	export let active: string = tabs[0]?.id || ""
</script>

<div class="tabs">
	<div class="tab-list">
		{#each tabs as tab}
			<button class:active={active === tab.id} on:click={() => (active = tab.id)}>
				{tab.label}
			</button>
		{/each}
	</div>
	<div class="tab-content">
		<slot {active} />
	</div>
</div>

<style>
	.tabs {
		width: 100%;
		user-select: none;
	}

	.tab-list {
		display: flex;
		gap: 4px;
		border-bottom: 1px solid var(--border-color);
		margin-bottom: calc(var(--gutter) * 2);
	}

	button {
		padding: 10px 16px;
		background: none;
		border: none;
		color: var(--muted-color);
		font-size: var(--font-size-small);
		cursor: pointer;
		position: relative;

		&:hover {
			color: var(--white);
		}

		&.active {
			color: var(--white);
		}

		&.active::after {
			content: "";
			position: absolute;
			bottom: -1px;
			left: 0;
			right: 0;
			height: 2px;
			background: var(--accent-color);
		}
	}

	.tab-content {
		padding: calc(var(--gutter) * 1) 0;
	}
</style>
