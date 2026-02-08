<script lang="ts">
	export let id = ""
	export let name = ""
	export let checked = false
	export let label: string = ""
	export let disabled = false
	export let labelPosition: "left" | "right" | "top" | "bottom" = "right"

	if (!id) {
		id = `toggle-${Math.random().toString(36).substring(2, 15)}`
	}
</script>

<label class="toggle pos-{labelPosition}" class:disabled for={id}>
	{#if label && (labelPosition === "top" || labelPosition === "left")}
		<span class="toggle-label">{label}</span>
	{/if}
	<input {id} {name} type="checkbox" bind:checked {disabled} value="true" />
	<span class="track">
		<span class="thumb"></span>
	</span>
	{#if label && (labelPosition === "bottom" || labelPosition === "right")}
		<span class="toggle-label">{label}</span>
	{/if}
</label>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
		cursor: pointer;
		user-select: none;

		&.pos-top,
		&.pos-bottom {
			flex-direction: column;
			align-items: flex-start;
		}

		&.pos-top {
			flex-direction: column;
		}

		&.pos-bottom {
			flex-direction: column-reverse;
		}

		&.disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	input {
		display: none;
	}

	.track {
		width: 40px;
		height: 22px;
		background: var(--secondary-color);
		border: 1px solid var(--border-color);
		border-radius: 11px;
		position: relative;
		transition:
			background 0.2s,
			border-color 0.2s;
	}

	input:checked + .track {
		border-color: transparent;
	}

	input:checked + .track {
		background: var(--accent-color);
	}

	.thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 18px;
		height: 18px;
		background: var(--white);
		border-radius: 50%;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	input:checked + .track .thumb {
		transform: translateX(18px);
	}

	.toggle-label {
		color: var(--white);
		font-size: var(--font-size-small);
	}
</style>
