<script lang="ts">
	import { createEventDispatcher } from "svelte"

	export let value = ""
	export let placeholder = "Search..."
	export let label = ""
	export let id = ""

	const dispatch = createEventDispatcher<{ submit: string }>()

	let focused = false

	const handleSubmit = () => {
		if (value.trim()) dispatch("submit", value.trim())
	}

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === "Enter") handleSubmit()
	}
</script>

<div class="field search-field" class:has-value={!!value} class:focused>
	{#if label}
		<label for={id}>{label}</label>
	{/if}
	<div class="search-wrap">
		<i class="fa-light fa-magnifying-glass search-icon"></i>
		<input {id} type="text" bind:value {placeholder} on:focus={() => (focused = true)} on:blur={() => (focused = false)} on:keydown={handleKeydown} />
		<button class="search-submit" on:click={handleSubmit} aria-label="Search" tabindex="-1">
			<i class="fa-light fa-arrow-right"></i>
		</button>
	</div>
</div>

<style lang="scss">
	.field {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
	}

	label {
		font-size: var(--font-size-small);
		font-weight: 500;
		text-align: left;
	}

	.search-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: var(--muted-color-2);
		font-size: var(--font-size-small);
		pointer-events: none;
		transition: color 150ms ease;
	}

	input {
		width: 100%;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		padding: 10px 38px 10px 34px;
		font-size: var(--font-size-small);
		transition:
			border-color 150ms,
			box-shadow 150ms;
	}

	input:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(116, 231, 168, 0.15);
	}

	.search-submit {
		position: absolute;
		right: 4px;
		background: none;
		border: none;
		color: var(--muted-color-2);
		cursor: pointer;
		padding: 6px 8px;
		border-radius: 6px;
		font-size: var(--font-size-small);
		opacity: 0;
		transform: translateX(4px);
		transition: all 200ms ease;
	}

	.search-field.focused .search-submit,
	.search-field.has-value .search-submit,
	.search-wrap:hover .search-submit {
		opacity: 1;
		transform: translateX(0);
	}

	.search-submit:hover {
		color: var(--accent-color);
		background: var(--border-color);
	}

	.search-field.focused .search-icon,
	.search-field.has-value .search-icon {
		color: var(--muted-color);
	}
</style>
