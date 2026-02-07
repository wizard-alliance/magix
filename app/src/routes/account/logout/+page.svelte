<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Spinner from "$components/modules/spinner.svelte"

	onMount(async () => {
		app.Config.pageTitle = "Logout"
		await app.Auth.logout()
		goto("/account/login")
	})
</script>

<section class="row center-xxs middle-xs height-100p">
	<Spinner />
</section>
