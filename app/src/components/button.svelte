<script lang="ts">
	export let type: "button" | "submit" | "reset" = "button"
	export let size: "sm" | "md" | "lg" = "md"
	export let color: "primary" | "secondary" | "ghost" | "danger" = "primary"
	export let icon: string = ""
	export let iconRight: string = "fal fa-arrow-right"
	export let disabled = false
</script>

<button class={`button btn-${size} btn-${color}`} {type} {disabled} on:click>
	{#if icon}<i class={icon}></i>{/if}
	<span><slot /></span>
	{#if iconRight}<i class={iconRight}></i>{/if}
</button>

<style>
	.button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		user-select: none;

		flex-basis: 100%;
		width: 100%;
	}

	.button span:empty {
		display: none;
	}

	.btn-sm {
		padding: 6px 12px;
		font-size: 13px;
	}
	.btn-md {
		padding: 10px 16px;
		font-size: 14px;
	}
	.btn-lg {
		padding: 14px 24px;
		font-size: 16px;
	}

	.btn-primary {
		background: var(--accent-color);
		&,
		i,
		span {
			color: var(--black);
		}
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-secondary {
		background: var(--secondary-color);
		color: var(--white);
		border: var(--border);
	}
	.btn-secondary:hover {
		background: var(--tertiary-color);
	}

	.btn-ghost {
		background: transparent;
		color: var(--white);
	}
	.btn-ghost:hover {
		background: var(--secondary-color);
	}

	.btn-danger {
		background: var(--red);
		color: var(--white);
	}
	.btn-danger:hover {
		opacity: 0.9;
	}

	.button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.button span {
		flex: 2 2 auto;
	}
</style>
