<script lang="ts">
	export let text: string = ""
	export let position: "top" | "bottom" | "left" | "right" = "top"
</script>

<div class={`tooltip tooltip-${position}`}>
	<slot />
	<span class="tip">{text}</span>
</div>

<style>
	.tooltip {
		position: relative;
		display: inline-block;
	}

	.tip {
		position: absolute;
		padding: 6px 10px;
		background: var(--primary-color);
		border: var(--border);
		border-radius: 6px;
		color: var(--white);
		font-size: var(--font-size-small);
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		user-select: none;
		transition:
			opacity 0.15s,
			transform 0.15s;
		z-index: 100;
	}

	.tooltip:hover .tip {
		opacity: 1;
	}

	.tooltip-top .tip {
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-bottom: 6px;
	}

	.tooltip-bottom .tip {
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 6px;
	}

	.tooltip-left .tip {
		right: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-right: 6px;
	}

	.tooltip-right .tip {
		left: 100%;
		top: 50%;
		transform: translateY(-50%);
		margin-left: 6px;
	}
</style>
