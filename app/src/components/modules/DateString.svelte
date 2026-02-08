<script lang="ts">
	import dayjs from "dayjs"
	import relativeTime from "dayjs/plugin/relativeTime"

	dayjs.extend(relativeTime)

	export let value: string | Date | number | null = null
	export let out: "timeAgo" | "date" | "datetime" | "time" | "iso" = `timeAgo`

	const formats: Record<string, (d: dayjs.Dayjs) => string> = {
		timeAgo: (d) => d.fromNow(),
		date: (d) => d.format(`MMM D, YYYY`),
		datetime: (d) => d.format(`MMM D, YYYY h:mm A`),
		time: (d) => d.format(`h:mm A`),
		iso: (d) => d.toISOString(),
	}

	$: parsed = value ? dayjs(value) : null
	$: display = parsed?.isValid() ? formats[out](parsed) : `—`
	$: tooltip = parsed?.isValid() ? parsed.format(`dddd, MMMM D, YYYY [at] h:mm:ss A`) : ``
</script>

<span class="date-string" data-tip={tooltip} data-tip-pos="top">{display}</span>

<style>
	.date-string {
		display: inline;
		cursor: default;
		border-radius: var(--border-radius);
		transition: outline var(--animationDefaultSpeed) var(--animationEasing);
		outline: 1px solid transparent;
		padding: 4px 8px;
	}

	.date-string:hover {
		outline: 1px solid var(--border-color);
	}
</style>
