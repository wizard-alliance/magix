<script lang="ts">
	export let id = ""
	export let label: string = ""
	export let value: string = ""
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
	<input {id} type="date" bind:value {required} {disabled} />
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
	}

	input {
		padding: 10px 12px;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		font-size: var(--font-size-small);

		&:focus {
			outline: none;
			border-color: var(--accent-color);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		&::-webkit-calendar-picker-indicator {
			filter: invert(1);
			cursor: pointer;
		}
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
