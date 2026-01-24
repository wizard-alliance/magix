<script lang="ts">
	export let id = ""
	export let label = ""
	export let value = ""
	export let placeholder = ""
	export let required = false
	export let rows = 4
</script>

<div class="field">
	{#if label}
		<label for={id}>{label}</label>
	{/if}
	<textarea {id} bind:value {placeholder} {required} {rows}></textarea>
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

	textarea {
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		padding: 10px 12px;
		resize: vertical;
		min-height: 80px;
	}

	textarea:focus {
		outline: none;
		border-color: var(--accent-color);
	}
</style>
