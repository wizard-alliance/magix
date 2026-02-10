<script lang="ts">
	type Option = { label: string; value: string }

	export let id = ""
	export let name = ""
	export let label = ""
	export let value = ""
	export let options: Option[] = []
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
	<select {id} {name} bind:value {required} {disabled}>
		{#if placeholder}
			<option value="" disabled>{placeholder}</option>
		{/if}
		{#each options as opt}
			<option value={opt.value}>{opt.label}</option>
		{/each}
	</select>
	{#if helperText}
		<span class="helper">{helperText}</span>
	{/if}
</div>

<style lang="scss">
	@use "../../styles/field" as *;
	select {
		@include field-element;
		cursor: pointer;
	}
</style>
