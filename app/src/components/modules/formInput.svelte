<script lang="ts">
	import { createEventDispatcher } from "svelte"

	type ChangeDetail = { value: string }

	const dispatch = createEventDispatcher<{ change: ChangeDetail; input: ChangeDetail }>()

	export let id = ""
	export let label = ""
	export let type: HTMLInputElement["type"] = "text"
	export let value = ""
	export let placeholder = ""
	export let disabled = false
	export let helperText = ""
	export let required = false
	export let inline = false

	const handleInput = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement
		const detail = { value: target.value }
		dispatch("input", detail)
	}

	const handleChange = (event: Event) => {
		const target = event.currentTarget as HTMLInputElement
		const detail = { value: target.value }
		dispatch("change", detail)
	}
</script>

<div class={`form-control ${inline ? "form-control--inline" : ""}`}>
	{#if label}
		<label for={id}>
			{label}
			{#if required}
				<span class="required">*</span>
			{/if}
		</label>
	{/if}

	<input {id} class="form-input" {type} bind:value aria-required={required} {placeholder} {disabled} on:input={handleInput} on:change={handleChange} />

	{#if helperText}
		<p class="helper-text">{helperText}</p>
	{/if}
</div>

<style lang="scss">
	.form-control {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.6);

		label {
			font-size: 0.8rem;
			text-transform: uppercase;
			letter-spacing: 0.08em;
			color: rgba(255, 255, 255, 0.65);
		}

		.required {
			color: var(--accent-color);
			margin-left: 4px;
		}

		.form-input {
			width: 100%;
			padding: calc(var(--gutter) * 1.4);
			border-radius: calc(var(--border-radius) / 1.15);
			border: 1px solid rgba(255, 255, 255, 0.14);
			background-color: rgba(18, 20, 28, 0.65);
			color: var(--white);
			transition:
				border-color 0.2s ease,
				background-color 0.2s ease,
				box-shadow 0.2s ease;

			&:focus {
				outline: none;
				border-color: rgba(255, 255, 255, 0.35);
				box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.08);
				background-color: rgba(25, 27, 35, 0.9);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}

		.helper-text {
			font-size: 0.75rem;
			color: rgba(255, 255, 255, 0.5);
			margin: 0;
		}
	}

	.form-control--inline {
		flex-direction: row;
		align-items: center;

		label {
			min-width: 120px;
			margin: 0;
		}
	}
</style>
