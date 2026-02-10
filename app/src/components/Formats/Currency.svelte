<script lang="ts">
	import { app } from "$lib/app"

	export let amount: number = 0
	export let currency: string | undefined = undefined
</script>

<span class="text-format">{app.Format.Currency.format(amount, currency)}</span>
