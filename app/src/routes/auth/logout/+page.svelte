<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Spinner from "$components/modules/spinner.svelte"

	onMount(async () => {
		await app.Auth.logout()
		goto("/auth/login")
	})
</script>

<section class="row center-xxs middle-xs height-100p">
	<Spinner />
</section>
