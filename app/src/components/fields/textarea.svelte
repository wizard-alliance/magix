<script lang="ts">
	export let id = ""
	export let label = ""
	export let value = ""
	export let placeholder = ""
	export let required = false
	export let disabled = false
	export let helperText = ""
	export let rows = 4
</script>

<div class="field">
	{#if label}
		<label for={id}
			>{label}{#if required}<span class="req">*</span>{/if}</label
		>
	{/if}
	<textarea {id} bind:value {placeholder} {required} {disabled} {rows}></textarea>
	{#if helperText}
		<span class="helper">{helperText}</span>
	{/if}
</div>

<style lang="scss">
	@use "../../styles/field" as *;
	textarea {
		@include field-element;
		resize: vertical;
		min-height: 80px;
	}
</style>
