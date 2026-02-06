<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"

	onMount(() => {
		app.Config.pageTitle = "Home"
		// app.UI.sidebarSetWidth(1, null)
		// app.UI.sidebarSetWidth(2, null)
	})
</script>

<section class="row">
	<div class="col-xxs-12 col-md-8">
		<h1>Home</h1>
		<p>Coming soon...</p>
	</div>
</section>
