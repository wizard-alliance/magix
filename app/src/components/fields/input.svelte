<script lang="ts">
	export let id = ""
	export let name = ""
	export let label = ""
	export let type: HTMLInputElement["type"] = "text"
	export let value = ""
	export let placeholder = ""
	export let required = false
	export let disabled = false
	export let helperText = ""
</script>

<div class="field">
	{#if label}
		<label for={id}
			>{label}{#if required}<span class="req">*</span>{/if}</label
		>
	{/if}
	<input {id} {name} {type} bind:value {placeholder} {required} {disabled} />
	{#if helperText}
		<span class="helper">{helperText}</span>
	{/if}
</div>

<style lang="scss">
	@use "../../styles/field" as *;
	input {
		@include field-element;
	}
</style>
