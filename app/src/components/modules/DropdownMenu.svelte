<script lang="ts">
	import { onMount, onDestroy, tick } from "svelte"

	export let open = false
	export let anchor: "left" | "right" = "left"
	export let position: "top" | "bottom" = "bottom"
	export let triggerRef: HTMLElement | null = null

	let portalEl: HTMLDivElement
	let menuRef: HTMLDivElement | null = null
	let x = 0
	let y = 0

	export const close = () => {
		open = false
	}

	export const toggle = () => {
		open = !open
	}

	function getBounds() {
		const el = document.querySelector(".app") as HTMLElement
		return el ? el.getBoundingClientRect() : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }
	}

	async function updatePosition() {
		if (!triggerRef) return
		const rect = triggerRef.getBoundingClientRect()
		const gap = 6
		x = anchor === "right" ? rect.right : rect.left
		y = position === "top" ? rect.top - gap : rect.bottom + gap

		await tick()

		if (menuRef) {
			const bounds = getBounds()
			const menu = menuRef.getBoundingClientRect()
			const pad = 8
			if (menu.right > bounds.right - pad) x -= menu.right - (bounds.right - pad)
			if (menu.left < bounds.left + pad) x += bounds.left + pad - menu.left
			if (menu.bottom > bounds.bottom - pad) y -= menu.bottom - (bounds.bottom - pad)
			if (menu.top < bounds.top + pad) y += bounds.top + pad - menu.top
		}
	}

	$: if (open) {
		updatePosition()
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (!open) return
		const target = event.target as Node
		if (triggerRef?.contains(target)) return
		if (menuRef && !menuRef.contains(target)) {
			close()
		}
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape" && open) close()
	}

	onMount(() => {
		const target = document.querySelector(".app") || document.body
		if (portalEl) target.appendChild(portalEl)

		document.addEventListener("click", handleClickOutside, true)
		document.addEventListener("keydown", handleKeydown)
	})

	onDestroy(() => {
		if (typeof document === "undefined") return
		portalEl?.remove()
		document.removeEventListener("click", handleClickOutside, true)
		document.removeEventListener("keydown", handleKeydown)
	})
</script>

<div bind:this={portalEl}>
	{#if open}
		<div bind:this={menuRef} class="dropdown-menu" class:anchor-right={anchor === "right"} class:position-top={position === "top"} style={`left: ${x}px; top: ${y}px;`}>
			<slot />
		</div>
	{/if}
</div>

<style>
	.dropdown-menu {
		position: fixed;
		z-index: 99999;
		min-width: 160px;
		background-color: var(--primary-color-transp);
		backdrop-filter: blur(6px);
		border: var(--border);
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		transform: translate(var(--tx, 0%), var(--ty, 0%));
		transform-origin: top left;
		animation: dropdownFade 120ms ease-out;
	}

	.dropdown-menu.anchor-right {
		--tx: -100%;
		transform-origin: top right;
	}

	.dropdown-menu.position-top {
		--ty: -100%;
		transform-origin: bottom left;
	}

	.dropdown-menu.anchor-right.position-top {
		transform-origin: bottom right;
	}

	.dropdown-menu :global(*) {
		box-sizing: border-box;
	}

	.dropdown-menu :global(a),
	.dropdown-menu :global(button) {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
		width: 100%;
		font-size: var(--font-size-small);
		color: var(--text-color);
		background: none;
		border: none;
		text-align: left;
		cursor: pointer;
		text-decoration: none;
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 1.5);
		transition: background-color 150ms ease;
	}

	.dropdown-menu :global(a:hover),
	.dropdown-menu :global(button:hover) {
		background-color: var(--secondary-color);
	}

	.dropdown-menu :global(hr) {
		border: none;
		border-top: var(--border);
	}

	@keyframes dropdownFade {
		from {
			opacity: 0;
			transform: translate(var(--tx, 0%), var(--ty, 0%)) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translate(var(--tx, 0%), var(--ty, 0%)) scale(1);
		}
	}
</style>
