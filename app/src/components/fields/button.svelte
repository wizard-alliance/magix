<script lang="ts">
	export let type: "button" | "submit" | "reset" = "button"
	export let variant: "primary" | "secondary" | "ghost" | "danger" = "primary"
	export let size: "sm" | "md" | "lg" = "md"
	export let disabled = false
	export let active = false
	export let loading = false
	export let iconOnly = false
	export let href: string | null = null
</script>

{#if href}
	<a {href} class={`btn btn-${variant} btn-${size}`} class:disabled class:active class:icon-only={iconOnly} class:loading on:click>
		{#if loading}<span class="spinner"></span>{/if}
		<slot />
	</a>
{:else}
	<button class={`btn btn-${variant} btn-${size}`} class:active class:icon-only={iconOnly} class:loading {type} disabled={disabled || loading} on:click>
		{#if loading}<span class="spinner"></span>{/if}
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
		transition:
			background 0.15s,
			opacity 0.15s,
			transform 0.1s,
			box-shadow 0.15s;
		position: relative;
		line-height: 1;
	}

	/* sizes */
	.btn-sm {
		padding: 6px 12px;
		font-size: var(--font-size-small);
	}
	.btn-md {
		padding: 10px 16px;
		font-size: var(--font-size-small);
	}
	.btn-lg {
		padding: 14px 24px;
		font-size: var(--font-size);
	}

	/* icon-only overrides — square padding */
	.icon-only.btn-sm {
		padding: 6px;
	}
	.icon-only.btn-md {
		padding: 10px;
	}
	.icon-only.btn-lg {
		padding: 14px;
	}

	/* inner icon / span styling */
	.btn :global(i) {
		font-size: 1em;
		line-height: 1;
		color: inherit;
	}
	.btn :global(span) {
		line-height: 1;
		color: inherit;
	}

	/* --- variants --- */
	.btn-primary {
		background: var(--accent-color);
		color: var(--black);
	}
	.btn-primary:hover {
		opacity: 0.9;
	}
	.btn-primary:active,
	.btn-primary.active {
		opacity: 0.85;
		transform: scale(0.97);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.15);
	}

	.btn-secondary {
		background: var(--secondary-color);
		color: var(--white);
		border: var(--border);
	}
	.btn-secondary:hover {
		background: var(--tertiary-color);
	}
	.btn-secondary:active,
	.btn-secondary.active {
		background: var(--quaternary-color);
		transform: scale(0.97);
	}

	.btn-ghost {
		background: transparent;
		color: var(--white);
	}
	.btn-ghost:hover {
		background: var(--secondary-color);
	}
	.btn-ghost:active,
	.btn-ghost.active {
		background: var(--tertiary-color);
		transform: scale(0.97);
	}

	.btn-danger {
		background: var(--red);
		color: var(--white);
	}
	.btn-danger:hover {
		opacity: 0.9;
	}
	.btn-danger:active,
	.btn-danger.active {
		opacity: 0.8;
		transform: scale(0.97);
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	/* --- disabled --- */
	.btn:disabled,
	.btn.disabled {
		opacity: 0.4;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* --- loading spinner --- */
	.loading {
		pointer-events: none;
	}
	.spinner {
		display: inline-block;
		width: 1em;
		height: 1em;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: btn-spin 0.6s linear infinite;
	}
	@keyframes btn-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
