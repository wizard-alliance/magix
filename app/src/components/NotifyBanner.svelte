<script lang="ts">
	type Props = {
		title?: string
		message: string
		type?: "info" | "success" | "warning" | "error"
		duration?: number
		onclick?: () => void
	}

	let { title, message, type = "info", duration = 5000, onclick }: Props = $props()
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="notify-banner {type}" {onclick}>
	{#if title}
		<strong class="notify-title">{title}</strong>
	{/if}
	<span class="notify-message">{message}</span>
</div>

<style lang="scss">
	.notify-banner {
		position: absolute;
		bottom: calc(var(--gutter, 1rem) * 0);
		right: calc(var(--gutter, 1rem) * 0);
		padding: calc(var(--gutter, 1rem) * 2) calc(var(--gutter, 1rem) * 2);
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		z-index: 10000;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1);
		width: 100%;
		min-width: 200px;
		max-width: 300px;
		backdrop-filter: blur(8px);

		animation: animateIn 700ms var(--animationEasing);

		user-select: none;
		cursor: pointer;

		&:hover {
			opacity: 0.9;
		}

		&:active {
			opacity: 0.8;
		}

		&.info {
			background-color: rgba(15, 16, 24, 0.7);
			color: white;
		}

		&.success {
			background: var(--accent-color);
			color: var(--primary-color);
		}

		&.warning {
			background: var(--yellow);
			color: var(--primary-color);
		}

		&.error {
			background: var(--red);
			color: var(--primary-color);
		}
	}

	.notify-title {
		font-weight: 600;
		font-size: var(--font-size-small);
		color: inherit;
	}

	.notify-message {
		font-size: var(--font-size-small);
		opacity: 0.8;
		color: inherit;
	}

	@keyframes animateIn {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>
