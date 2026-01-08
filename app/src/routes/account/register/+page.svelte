<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"

	onMount(() => {
		app.Config.pageTitle = "Register"
	})
</script>

<section class="row center-xs middle-xs height-100p">
	<div class="panel">
		<h1>Register</h1>
		<p class="text-muted">Coming soon</p>
	</div>
</section>

<style>
	.panel {
		padding: calc(var(--gutter) * 3);
		background: var(--secondary-color);
		border-radius: var(--border-radius);
		text-align: center;
	}
</style>
