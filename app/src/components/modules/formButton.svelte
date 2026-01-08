<script lang="ts">
	export let label = "Submit"
	export let type: "button" | "submit" | "reset" = "button"
	export let variant: "primary" | "ghost" | "danger" = "primary"
	export let disabled = false
</script>

<button class={`form-button form-button--${variant}`} {type} {disabled} on:click>
	{label}
	<slot />
</button>

<style lang="scss">
	.form-button {
		border: none;
		border-radius: calc(var(--border-radius) / 1.5);
		padding: calc(var(--gutter) * 1.1) calc(var(--gutter) * 2);
		font-weight: 600;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			color 0.2s ease,
			border-color 0.2s ease;
		text-transform: none;
		letter-spacing: 0;
		font-size: 0.9rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;
	}

	.form-button--primary {
		background-color: var(--accent-color);
		color: var(--black);
		border: 1px solid transparent;

		&:hover {
			background-color: var(--accent-color-light, #ffd16b);
		}
	}

	.form-button--ghost {
		background-color: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: var(--white);

		&:hover {
			background-color: rgba(255, 255, 255, 0.12);
		}
	}

	.form-button--danger {
		background-color: #d64b53;
		color: var(--white);
		border: 1px solid transparent;

		&:hover {
			background-color: #f06f77;
		}
	}

	.form-button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
</style>
