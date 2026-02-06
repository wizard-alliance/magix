<script lang="ts">
	export let id = ""
	export let label: string = ""
	export let buttonText: string = "Upload file"
	export let accept: string = ""
	export let multiple = false
	export let required = false
	export let disabled = false
	export let helperText = ""

	let files: FileList | null = null
	let input: HTMLInputElement

	$: fileNames = files ? Array.from(files).map((f) => f.name) : []
</script>

<div class="field">
	{#if label}
		<label for={id}
			>{label}{#if required}<span class="req">*</span>{/if}</label
		>
	{/if}
	<div class="file-upload" class:disabled>
		<input {id} type="file" bind:this={input} bind:files {accept} {multiple} {required} {disabled} />
		<button type="button" on:click={() => input.click()} {disabled}>
			<i class="fa-light fa-upload"></i>
			{buttonText}
		</button>
		{#if fileNames.length}
			<span class="file-names">{fileNames.join(", ")}</span>
		{/if}
	</div>
	{#if helperText}
		<span class="helper">{helperText}</span>
	{/if}
</div>

<style>
	.field {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
	}

	label {
		font-size: var(--font-size-small);
		font-weight: 500;
	}

	.file-upload {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);

		&.disabled {
			opacity: 0.5;
		}
	}

	input {
		display: none;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 16px;
		background: var(--secondary-color);
		border: var(--border);
		border-radius: 8px;
		color: var(--white);
		font-size: var(--font-size-small);
		cursor: pointer;

		&:hover {
			background: var(--tertiary-color);
		}

		&:disabled {
			cursor: not-allowed;
		}
	}

	.file-names {
		font-size: var(--font-size-small);
		color: var(--muted-color);
	}

	.req {
		color: var(--accent-color);
		margin-left: 4px;
	}

	.helper {
		font-size: var(--font-size-small);
		color: var(--text-color-secondary);
	}
</style>
