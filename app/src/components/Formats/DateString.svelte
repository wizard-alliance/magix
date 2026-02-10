<script lang="ts">
	import { app } from "$lib/app"

	export let value: string | Date | number | null = null
	export let out: "timeAgo" | "date" | "datetime" | "time" | "iso" = `timeAgo`

	const formatters: Record<string, (v: any) => string> = {
		timeAgo: (v) => app.Format.Date.relative(v),
		date: (v) => app.Format.Date.format(v),
		datetime: (v) => app.Format.Date.full(v),
		time: (v) => app.Format.Date.time(v),
		iso: (v) => app.Format.Date.iso(v),
	}

	$: display = value ? formatters[out](value) : `—`
	$: tooltip = value ? app.Format.Date.full(value) : ``
</script>

<span class="text-format" data-tip={tooltip} data-tip-pos="top">{display}</span>
