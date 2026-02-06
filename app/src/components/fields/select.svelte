<script lang="ts">
	type Option = { label: string; value: string }

	export let id = ""
	export let label = ""
	export let value = ""
	export let options: Option[] = []
	export let placeholder = ""
	export let required = false
	export let disabled = false
	export let helperText = ""
</script>

<div class="field">
	{#if label}
		<label for={id}
			>{label}{#if required}<span class="req">*</span>{/if}</label
		>
	{/if}
	<select {id} bind:value {required} {disabled}>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	{#if helperText}
		<span class="helper">{helperText}</span>
	{/if}
</div>

<style>
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

	select {
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		padding: 10px 12px;
		cursor: pointer;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		font-size: var(--font-size-small);
	}

	select:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(116, 231, 168, 0.15);
	}

	select:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.req {
		color: var(--accent-color);
		margin-left: 4px;
	}

	.helper {
		font-size: var(--font-size-small);
		color: var(--text-color-secondary);
	}
</style>
