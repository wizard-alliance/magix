<script lang="ts">
	import { createEventDispatcher } from "svelte"

	export let current: number = 1
	export let total: number = 1

	const dispatch = createEventDispatcher()

	$: pages = buildPages(current, total)

	function buildPages(cur: number, tot: number): (number | `...`)[] {
		if (tot <= 7) return Array.from({ length: tot }, (_, i) => i + 1)
		const set = new Set<number>([1, tot])
		for (let i = Math.max(2, cur - 1); i <= Math.min(tot - 1, cur + 1); i++) set.add(i)
		const sorted = [...set].sort((a, b) => a - b)
		const result: (number | `...`)[] = []
		for (let i = 0; i < sorted.length; i++) {
			if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(`...`)
			result.push(sorted[i])
		}
		return result
	}

	function go(p: number) {
		if (p >= 1 && p <= total && p !== current) {
			current = p
			dispatch("change", p)
		}
	}
</script>

<div class="pagination">
	<button aria-label="Previous page" disabled={current === 1} on:click={() => go(current - 1)}>
		<i class="fa-light fa-chevron-left"></i>
	</button>
	{#each pages as p}
		{#if p === `...`}
			<span class="ellipsis">…</span>
		{:else}
			<button class:active={p === current} on:click={() => go(p)}>{p}</button>
		{/if}
	{/each}
	<button aria-label="Next page" disabled={current === total} on:click={() => go(current + 1)}>
		<i class="fa-light fa-chevron-right"></i>
	</button>
</div>

<style>
	.pagination {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.ellipsis {
		min-width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--muted-color);
		font-size: var(--font-size-small);
		user-select: none;
	}

	button {
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 6px;
		color: var(--white);
		font-size: var(--font-size-small);
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
