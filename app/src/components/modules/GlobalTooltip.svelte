<script lang="ts">
	import { onMount, tick } from "svelte"

	let visible = false
	let text = ""
	let x = 0
	let y = 0
	let pos = "top"
	let tipEl: HTMLDivElement

	let target: HTMLElement | null = null
	let icon = ""

	const offset = 8
	const pad = 4

	function getBounds() {
		const app = document.querySelector(".app") as HTMLElement
		return app ? app.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
	}

	function setCoords(rect: DOMRect, side: string) {
		switch (side) {
			case "bottom":
				x = rect.left + rect.width / 2
				y = rect.bottom + offset
				break
			case "left":
				x = rect.left - offset
				y = rect.top + rect.height / 2
				break
			case "right":
				x = rect.right + offset
				y = rect.top + rect.height / 2
				break
			default:
				x = rect.left + rect.width / 2
				y = rect.top - offset
				break
		}
	}

	const opposite: Record<string, string> = { top: "bottom", bottom: "top", left: "right", right: "left" }

	async function show(e: Event) {
		if (!(e.target instanceof Element)) return
		const el = (e.target as HTMLElement)?.closest("[data-tip]") as HTMLElement
		if (!el || !el.getAttribute("data-tip")) return
		target = el
		text = el.getAttribute("data-tip")!
		icon = el.getAttribute("data-tip-icon") || ""

		const rect = el.getBoundingClientRect()
		const desired = el.getAttribute("data-tip-pos") || "top"

		// Place at desired position
		pos = desired
		setCoords(rect, desired)
		visible = true
		await tick()

		// Check bounds, flip if overflowing
		if (tipEl) {
			const bounds = getBounds()
			const tip = tipEl.getBoundingClientRect()
			const oob = tip.left < bounds.left + pad || tip.right > bounds.right - pad || tip.top < bounds.top + pad || tip.bottom > bounds.bottom - pad

			if (oob) {
				pos = opposite[desired] || "top"
				setCoords(rect, pos)
			}
		}
	}

	function hide() {
		visible = false
		target = null
	}

	onMount(() => {
		document.addEventListener("pointerenter", show, true)
		document.addEventListener("pointerleave", hide, true)
		return () => {
			document.removeEventListener("pointerenter", show, true)
			document.removeEventListener("pointerleave", hide, true)
		}
	})
</script>

{#if visible}
	<div class={`global-tip pos-${pos}`} style:left="{x}px" style:top="{y}px" bind:this={tipEl}>
		{#if icon}<i class={`fa-light ${icon}`}></i>{/if}
		<span>{text}</span>
	</div>
{/if}

<style>
	.global-tip {
		position: fixed;
		z-index: 99999;
		padding: calc(var(--gutter) * 1) calc(var(--gutter) * 1.5);
		border-radius: var(--border-radius);
		background: var(--primary-color-transp);
		border: var(--border);
		backdrop-filter: blur(4px);

		color: var(--white);
		font-size: var(--font-size-small);
		font-weight: 400;
		white-space: nowrap;
		pointer-events: none;
		user-select: none;
		align-items: center;
		gap: calc(var(--gutter) * 1.25);
		transform: translate(var(--tx), var(--ty));
		animation: tipIn var(--animationDefaultSpeed) var(--animationEasing) forwards;

		max-width: 200px;
		overflow: hidden;

		display: flex;

		span {
			font-size: inherit;
			font-weight: inherit;
			color: inherit;
			white-space: normal;
			word-wrap: break-word;
			flex: 1;
		}

		i {
			flex: none;
			font-size: var(--font-size);
			color: var(--muted-color-2);
		}
	}

	.pos-top {
		--tx: -50%;
		--ty: -100%;
		--slide-x: -50%;
		--slide-y: calc(-100% + 5%);
	}

	.pos-bottom {
		--tx: -50%;
		--ty: 0%;
		--slide-x: -50%;
		--slide-y: -5%;
	}

	.pos-left {
		--tx: -100%;
		--ty: -50%;
		--slide-x: calc(-100% + 5%);
		--slide-y: -50%;
	}

	.pos-right {
		--tx: 0%;
		--ty: -50%;
		--slide-x: -5%;
		--slide-y: -50%;
	}

	@keyframes tipIn {
		from {
			opacity: 0;
			transform: translate(var(--slide-x), var(--slide-y));
		}
		to {
			opacity: 1;
			transform: translate(var(--tx), var(--ty));
		}
	}
</style>
