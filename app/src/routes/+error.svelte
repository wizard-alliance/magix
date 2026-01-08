<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	export let error: Error & { message: string }
	export let status: number
</script>

<section>
	<h1>{status === 404 ? `We misplaced that page` : `We hit a snag`}</h1>
	<p>{error?.message ?? `An unexpected issue occurred.`}</p>
	<a class="button" href="/">Return home</a>
</section>
