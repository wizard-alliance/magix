<script lang="ts">
	export let id = ""
	export let label = ""
	export let type: HTMLInputElement["type"] = "text"
	export let value = ""
	export let placeholder = ""
	export let required = false
</script>

<div class="field">
	{#if label}
		<label for={id}>{label}</label>
	{/if}
	<input {id} {type} bind:value {placeholder} {required} />
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
	}

	label {
		font-size: 14px;
		font-weight: 500;
		text-align: left;
	}

	input {
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		padding: 10px 12px;
	}

	input:focus {
		outline: none;
		border-color: var(--accent-color);
	}
</style>
