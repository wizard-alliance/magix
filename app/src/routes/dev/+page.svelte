<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import DevSidebar from "$components/sections/sidebar/DevSidebar.svelte"

	onMount(() => {
		app.Config.pageTitle = "Developer"
		app.UI.sidebarSetContent(1, DevSidebar as any, {}, "200px")
	})
</script>

<div class="page page-thin">
	<h1>Developer Tools</h1>
	<p>Select a section from the sidebar.</p>
</div>
