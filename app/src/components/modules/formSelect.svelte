<script lang="ts">
	import { createEventDispatcher } from "svelte"

	type Option = { label: string; value: string }
	type ChangeDetail = { value: string }

	export let id = ""
	export let label = ""
	export let value = ""
	export let options: Option[] = []
	export let placeholder = "Select an option"
	export let disabled = false
	export let helperText = ""
	export let searchable = false
	export let searchPlaceholder = "Search options"

	let searchTerm = ""
	let filteredOptions: Option[] = options

	$: filteredOptions = searchable ? options.filter((option) => option.label.toLowerCase().includes(searchTerm.toLowerCase())) : options

	$: if (searchable && value) {
		const hasSelected = filteredOptions.some((option) => option.value === value)
		if (!hasSelected) {
			const selected = options.find((option) => option.value === value)
			if (selected) {
				filteredOptions = [selected, ...filteredOptions]
			}
		}
	}

	const dispatch = createEventDispatcher<{ change: ChangeDetail; input: ChangeDetail }>()

	const handleChange = (event: Event) => {
		const target = event.currentTarget as HTMLSelectElement
		const detail = { value: target.value }
		dispatch("input", detail)
		dispatch("change", detail)
	}
</script>

<div class="form-control">
	{#if label}
		<label for={id}>{label}</label>
	{/if}

	{#if searchable}
		<input type="text" class="form-select__search" placeholder={searchPlaceholder} bind:value={searchTerm} />
	{/if}

	<select {id} class="form-select" bind:value {disabled} on:change={handleChange}>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each filteredOptions as option}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>

	{#if helperText}
		<p class="helper-text">{helperText}</p>
	{/if}
</div>

<style lang="scss">
	.form-control {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.6);

		label {
			font-size: 0.8rem;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: rgba(255, 255, 255, 0.65);
		}

		.form-select__search {
			width: 100%;
			padding: calc(var(--gutter) * 1.1);
			border-radius: calc(var(--border-radius) / 1.25);
			border: 1px solid rgba(255, 255, 255, 0.1);
			background: rgba(18, 20, 28, 0.6);
			color: var(--white);
			font-size: 0.85rem;
			margin-bottom: calc(var(--gutter) * 0.6);
			font-family: inherit;
		}

		.form-select {
			width: 100%;
			padding: calc(var(--gutter) * 1.3);
			border-radius: calc(var(--border-radius) / 1.15);
			border: 1px solid rgba(255, 255, 255, 0.14);
			background-color: rgba(18, 20, 28, 0.65);
			color: var(--white);
			appearance: none;
			background-image: linear-gradient(45deg, transparent 50%, rgba(255, 255, 255, 0.65) 50%), linear-gradient(135deg, rgba(255, 255, 255, 0.65) 50%, transparent 50%);
			background-position:
				calc(100% - 20px) calc(50% - 3px),
				calc(100% - 15px) calc(50% - 3px);
			background-size:
				5px 5px,
				5px 5px;
			background-repeat: no-repeat;
			transition:
				border-color 0.2s ease,
				background-color 0.2s ease,
				box-shadow 0.2s ease;

			&:focus {
				outline: none;
				border-color: rgba(255, 255, 255, 0.35);
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
				background-color: rgba(25, 27, 35, 0.9);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		.helper-text {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.5);
			margin: 0;
		}
	}
</style>
