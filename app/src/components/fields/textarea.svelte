<script lang="ts">
	export let id = ""
	export let label = ""
	export let value = ""
	export let placeholder = ""
	export let required = false
	export let disabled = false
	export let helperText = ""
	export let rows = 4
</script>

<div class="field">
	{#if label}
		<label for={id}
			>{label}{#if required}<span class="req">*</span>{/if}</label
		>
	{/if}
	<textarea {id} bind:value {placeholder} {required} {disabled} {rows}></textarea>
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

	textarea {
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		padding: 10px 12px;
		resize: vertical;
		min-height: 80px;
		transition:
			border-color 0.15s,
			box-shadow 0.15s;
		font-size: var(--font-size-small);
	}

	textarea:focus {
		outline: none;
		border-color: var(--accent-color);
		box-shadow: 0 0 0 2px rgba(116, 231, 168, 0.15);
	}

	textarea:disabled {
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
