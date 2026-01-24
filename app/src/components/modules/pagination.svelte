<script lang="ts">
	import { createEventDispatcher } from "svelte"

	export let current: number = 1
	export let total: number = 1

	const dispatch = createEventDispatcher()

	$: pages = Array.from({ length: total }, (_, i) => i + 1)

	function go(p: number) {
		if (p >= 1 && p <= total && p !== current) {
			current = p
			dispatch("change", p)
		}
	}
</script>

<div class="pagination">
	<button disabled={current === 1} on:click={() => go(current - 1)}>
		<i class="fa-light fa-chevron-left"></i>
	</button>
	{#each pages as p}
		<button class:active={p === current} on:click={() => go(p)}>{p}</button>
	{/each}
	<button disabled={current === total} on:click={() => go(current + 1)}>
		<i class="fa-light fa-chevron-right"></i>
	</button>
</div>

<style>
	.pagination {
		display: flex;
		gap: 4px;
	}

	button {
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 6px;
		color: var(--white);
		font-size: 13px;
		cursor: pointer;

		&:hover:not(:disabled) {
			background: var(--tertiary-color);
		}

		&:disabled {
			opacity: 0.4;
			cursor: not-allowed;
		}

		&.active {
			background: var(--accent-color);
			color: var(--black);
			border-color: var(--accent-color);
		}
	}
</style>
