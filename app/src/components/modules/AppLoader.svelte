<script lang="ts">
	import Spinner from "./spinner.svelte"
</script>

<div class="app-loader">
	<Spinner size="lg" />
</div>

<style>
	.app-loader {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--gutter) * 2);
		background: var(--bg-color-secondary);
		z-index: 9999;
	}
</style>
