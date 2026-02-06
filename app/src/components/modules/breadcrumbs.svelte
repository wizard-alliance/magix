<script lang="ts">
	type Crumb = { href: string; label: string }

	export let items: Crumb[] = []
	export let separator = "/"
</script>

<nav class="breadcrumbs" aria-label="Breadcrumb">
	{#each items as crumb, i (i)}
		<a href={crumb.href}>{crumb.label}</a>
		{#if i < items.length - 1}
			<span class="separator">{separator}</span>
		{/if}
	{/each}
</nav>

<style>
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.breadcrumbs > * {
		line-height: 0.85;
	}

	a {
		text-decoration: none;
		color: var(--muted-color);
		font-size: var(--font-size-small);
	}

	a:hover {
		color: var(--text-color);
	}

	a:last-of-type {
		color: var(--text-color);
		pointer-events: none;
	}

	.separator {
		color: var(--muted-color-2);
		font-size: var(--font-size-small);
	}
</style>
