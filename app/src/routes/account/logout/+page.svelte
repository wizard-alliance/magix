<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"

	onMount(async () => {
		app.Config.pageTitle = "Logout"
		await app.Auth.logout()
		goto("/account/login")
	})
</script>

<section class="row center-xs middle-xs height-100p">
	<p>Logging out...</p>
</section>
