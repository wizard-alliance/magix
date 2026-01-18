<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import ProfileSidebar from "$components/sections/sidebar/ProfileSidebar.svelte"

	onMount(() => {
		app.Config.pageTitle = "Profile"
		app.UI.sidebarSetContent(1, ProfileSidebar as any, { message: "Hello World xd" }, "220px")
	})
</script>

<div class="page page-thin">
	<h1>Profile Page</h1>
	<p>Welcome to your profile page.</p>
	<ul>
		<li>Settings</li>
		<li>Notifications</li>
		<li>Security: Sessions/ Devices</li>

		<li>Subscriptions</li>
		<li>Purchases</li>
		<li>Invoices</li>
	</ul>
</div>

<style lang="scss" scoped>
</style>
