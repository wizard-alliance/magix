<script lang="ts">
	type Choice = { label: string; value: string; variant?: string }

	type Props = {
		icon?: string
		title?: string
		subtitle?: string
		content?: string
		choices?: Choice[]
		closable?: boolean
		inputType?: string
		inputPlaceholder?: string
		onresult?: (value: string | null) => void
	}

	let { icon, title, subtitle, content, choices = [], closable = true, inputType, inputPlaceholder, onresult }: Props = $props()

	let inputValue = $state("")
	let inputRef: HTMLInputElement | undefined = $state()

	$effect(() => {
		if (inputRef) inputRef.focus()
	})

	const close = (value: string | null = null) => {
		onresult?.(value)
	}

	const handleKeydown = (e: KeyboardEvent) => {
		if (e.key === "Escape" && closable) {
			e.preventDefault()
			close()
		}
	}

	const handleSubmit = (e: Event) => {
		e.preventDefault()
		const primary = choices.find((c) => c.variant === "primary" || c.variant === "danger")
		if (primary) close(inputType ? inputValue : primary.value)
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="modal-backdrop" onclick={() => closable && close()} onkeydown={handleKeydown}>
	<form class="modal" onclick={(e) => e.stopPropagation()} onsubmit={handleSubmit}>
		{#if closable}
			<button type="button" class="modal-close" onclick={() => close()} aria-label="Close">
				<i class="fa-light fa-xmark"></i>
			</button>
		{/if}

		{#if icon}
			<div class="modal-icon"><i class={`fa-light ${icon}`}></i></div>
		{/if}

		{#if title}
			<h3 class="modal-title">{title}</h3>
		{/if}

		{#if subtitle}
			<p class="modal-subtitle">{subtitle}</p>
		{/if}

		{#if content}
			<p class="modal-content">{content}</p>
		{/if}

		{#if inputType}
			<input class="modal-input" type={inputType} placeholder={inputPlaceholder || ""} bind:value={inputValue} bind:this={inputRef} />
		{/if}

		{#if choices.length}
			<div class="modal-choices">
				{#each choices as choice}
					<button type="button" class="modal-btn {choice.variant || ''}" onclick={() => close(inputType ? inputValue : choice.value)}>
						{choice.label}
					</button>
				{/each}
			</div>
		{/if}
	</form>
</div>

<style lang="scss">
	.modal-backdrop {
		position: absolute;
		inset: 0;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		animation: fadeIn 200ms ease-out;
	}

	.modal {
		position: relative;
		background: var(--primary-color);
		border: var(--border);
		border-radius: var(--border-radius);
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.3);
		padding: calc(var(--gutter) * 4);
		min-width: 320px;
		max-width: 440px;
		width: 90vw;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--gutter) * 1.5);
		text-align: center;
		animation: scaleIn 250ms var(--animationEasing);
	}

	.modal-close {
		position: absolute;
		top: calc(var(--gutter) * 1.5);
		right: calc(var(--gutter) * 1.5);
		background: none;
		border: none;
		color: var(--muted-color);
		cursor: pointer;
		font-size: var(--font-size-large);
		padding: calc(var(--gutter) * 0.5);
		line-height: 1;

		&:hover {
			color: var(--text-color);
		}
	}

	.modal-icon {
		font-size: 2.4rem;
		color: var(--accent-color);
		margin-bottom: calc(var(--gutter) * 0.5);
	}

	.modal-title {
		font-size: var(--font-size-large);
		font-weight: 600;
		margin: 0;
	}

	.modal-subtitle {
		font-size: 1.05rem;
		color: var(--muted-color);
		margin: 0;
	}

	.modal-content {
		font-size: var(--font-size-small);
		color: var(--muted-color-2);
		margin: 0;
		line-height: 1.5;
	}

	.modal-input {
		width: 100%;
		padding: calc(var(--gutter) * 1.25) calc(var(--gutter) * 1.5);
		border-radius: 8px;
		border: var(--border);
		background: var(--secondary-color);
		color: var(--text-color);
		font-size: var(--font-size);
		outline: none;
		transition: border-color 150ms ease;

		&::placeholder {
			color: var(--muted-color);
		}

		&:focus {
			border-color: var(--accent-color);
		}
	}

	.modal-choices {
		display: flex;
		gap: calc(var(--gutter) * 1.5);
		margin-top: calc(var(--gutter) * 1);
		width: 100%;
		justify-content: center;
	}

	.modal-btn {
		padding: calc(var(--gutter) * 1.25) calc(var(--gutter) * 3);
		border-radius: 8px;
		border: var(--border);
		background: var(--secondary-color);
		color: var(--text-color);
		cursor: pointer;
		font-size: var(--font-size-small);
		font-weight: 500;
		transition: all 150ms ease;

		&:hover {
			background: var(--tertiary-color);
		}

		&.primary {
			background: var(--accent-color);
			color: var(--primary-color);
			border-color: var(--accent-color);

			&:hover {
				opacity: 0.85;
			}
		}

		&.danger {
			background: var(--red);
			color: var(--white);
			border-color: var(--red);

			&:hover {
				opacity: 0.85;
			}
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>
