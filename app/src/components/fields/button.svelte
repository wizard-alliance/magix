<script lang="ts">
	export let type: "button" | "submit" | "reset" = "button"
	export let variant: "primary" | "secondary" | "ghost" | "danger" = "primary"
	export let size: "sm" | "md" | "lg" = "md"
	export let disabled = false
	export let href: string | null = null
</script>

{#if href}
	<a {href} class={`btn btn-${variant} btn-${size}`} class:disabled on:click>
		<slot />
	</a>
{:else}
	<button class={`btn btn-${variant} btn-${size}`} {type} {disabled} on:click>
		<slot />
	</button>
{/if}

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		user-select: none;
		text-decoration: none;
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
		color: var(--black);
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

	.btn:disabled,
	.btn.disabled {
		opacity: 0.5;
		cursor: not-allowed;
		pointer-events: none;
	}
</style>
