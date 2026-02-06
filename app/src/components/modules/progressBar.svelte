<script lang="ts">
	export let value: number = 0
	export let max: number = 100
	export let showLabel = false

	$: percent = Math.min(100, Math.max(0, (value / max) * 100))
</script>

<div class="progress">
	<div class="bar" style={`width: ${percent}%`}></div>
	{#if showLabel}<span class="label">{Math.round(percent)}%</span>{/if}
</div>

<style>
	.progress {
		position: relative;
		width: 100%;
		height: 8px;
		background: var(--secondary-color);
		border-radius: 4px;
		overflow: hidden;
		user-select: none;
	}

	.bar {
		height: 100%;
		background: var(--accent-color);
		border-radius: 4px;
		transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.label {
		position: absolute;
		right: 0;
		top: -20px;
		font-size: var(--font-size-small);
		color: var(--muted-color);
	}
</style>
