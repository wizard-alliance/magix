<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import ProfileSidebar from "$components/sections/sidebar/ProfileSidebar.svelte"

	onMount(() => {
		app.Config.pageTitle = "Profile"
		app.UI.sidebarSetContent(2, ProfileSidebar, { message: "Hello World xd" }, "30%", "220px")
	})
</script>

<div>
	<h1>Profile Page</h1>
	<p>Welcome to your profile page.</p>
</div>

<style lang="scss" scoped>
</style>
