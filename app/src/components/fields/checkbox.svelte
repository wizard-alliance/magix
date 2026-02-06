<script lang="ts">
	export let id = ""
	export let label = ""
	export let checked = false
	export let disabled = false

	if (!id) {
		id = `checkbox-${Math.random().toString(36).substring(2, 15)}`
	}
</script>

<label class="checkbox" class:disabled for={id}>
	<input {id} type="checkbox" bind:checked {disabled} />
	{#if label}
		<span class="checkbox-label">{label}</span>
	{/if}
</label>

<style>
	.checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-size: var(--font-size-small);
		user-select: none;

		&:hover {
			opacity: 0.9;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.checkbox-label {
		user-select: none;
		cursor: pointer;
	}

	input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: unset;

		appearance: none;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 4px;
		position: relative;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			box-shadow 0.15s;

		&:hover:not(:disabled) {
			border-color: var(--accent-color);
		}

		&:checked {
			background: var(--accent-color);
			border: none;
		}

		&:checked::after {
			content: "";
			position: absolute;
			width: 4px;
			height: 8px;
			border: solid var(--black);
			border-width: 0 2px 2px 0;

			top: 50%;
			left: 50%;
			transform: translate(-50%, -60%) rotate(45deg);
		}
	}
</style>
