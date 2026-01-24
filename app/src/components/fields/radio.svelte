<script lang="ts">
	export let id = ""
	export let name: string = ""
	export let label: string = ""
	export let value: string = ""
	export let options: { value: string; label: string }[] = []
	export let disabled = false

	if (!id) {
		id = `radio-${Math.random().toString(36).substring(2, 15)}`
	}
</script>

<div class="field">
	{#if label}
		<span class="group-label">{label}</span>
	{/if}
	<div class="radio-group">
		{#each options as opt}
			<label class="radio" class:disabled>
				<input type="radio" {name} value={opt.value} checked={value === opt.value} {disabled} on:change={() => (value = opt.value)} />
				<span class="mark"></span>
				<span class="opt-label">{opt.label}</span>
			</label>
		{/each}
	</div>
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
	}

	.group-label {
		font-size: 14px;
		font-weight: 500;
	}

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1);
	}

	.radio {
		display: flex;
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

	.mark {
		width: 18px;
		height: 18px;
		border: 2px solid var(--border-color);
		border-radius: 50%;
		position: relative;
		transition: border-color 0.15s;
	}

	input:checked + .mark {
		border-color: var(--accent-color);
	}

	input:checked + .mark::after {
		content: "";
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 8px;
		height: 8px;
		background: var(--accent-color);
		border-radius: 50%;
	}

	.opt-label {
		color: var(--white);
		font-size: 14px;
	}
</style>
