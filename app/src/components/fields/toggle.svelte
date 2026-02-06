<script lang="ts">
	export let id = ""
	export let checked = false
	export let label: string = ""
	export let disabled = false

	if (!id) {
		id = `toggle-${Math.random().toString(36).substring(2, 15)}`
	}
</script>

<label class="toggle" class:disabled for={id}>
	<input {id} type="checkbox" bind:checked {disabled} />
	<span class="track">
		<span class="thumb"></span>
	</span>
	{#if label}<span class="toggle-label">{label}</span>{/if}
</label>

<style>
	.toggle {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
		cursor: pointer;
		user-select: none;

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
		border-radius: 11px;
		position: relative;
		transition: background 0.2s;
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
		transition: transform 0.2s;
	}

	input:checked + .track .thumb {
		transform: translateX(18px);
	}

	.toggle-label {
		color: var(--white);
		font-size: var(--font-size-small);
	}
</style>
