<script lang="ts">
	import { onMount, onDestroy } from "svelte"

	export let open = false
	export let anchor: "left" | "right" = "left"
	export let position: "top" | "bottom" = "bottom"
	export let triggerRef: HTMLElement | null = null

	let menuRef: HTMLDivElement | null = null
	let isActive = false

	export const close = () => {
		open = false
	}

	export const toggle = () => {
		open = !open
	}

	// Delay active class for animation
	$: if (open) {
		requestAnimationFrame(() => {
			isActive = true
		})
	} else {
		isActive = false
	}

	const handleClickOutside = (event: MouseEvent) => {
		if (!open) return
		const target = event.target as Node
		// Don't close if clicking the trigger element (toggle handles that)
		if (triggerRef?.contains(target)) return
		if (menuRef && !menuRef.contains(target)) {
			close()
		}
	}

	const handleKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape" && open) {
			close()
		}
	}

	onMount(() => {
		document.addEventListener("click", handleClickOutside, true)
		document.addEventListener("keydown", handleKeydown)
	})

	onDestroy(() => {
		if (typeof document === "undefined") return
		document.removeEventListener("click", handleClickOutside, true)
		document.removeEventListener("keydown", handleKeydown)
	})
</script>

{#if open}
	<div class="dropdown-menu" class:active={isActive} class:anchor-right={anchor === "right"} class:position-top={position === "top"} bind:this={menuRef}>
		<slot />
	</div>
{/if}

<style>
	.dropdown-menu {
		position: absolute;
		z-index: 999999;
		min-width: 160px;
		width: 90%;
		background-color: var(--primary-color-transp);
		backdrop-filter: blur(6px);
		border: var(--border);
		border-radius: var(--border-radius);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		transition: all 600ms cubic-bezier(0, 0, 0, 1);
	}

	.dropdown-menu.anchor-right {
		right: calc(var(--gutter) * 1.5);
	}

	.dropdown-menu.position-top {
		bottom: 100%;
		margin-bottom: calc(var(--gutter) * 1.5);
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

		transition: all 600ms cubic-bezier(0, 0, 0, 1);
	}

	.dropdown-menu :global(a:hover),
	.dropdown-menu :global(button:hover) {
		background-color: var(--secondary-color);
	}

	.dropdown-menu :global(hr) {
		border: none;
		border-top: var(--border);
	}

	.dropdown-menu:not(.active) {
		opacity: 0;
		transform: translateY(10px);
	}

	.dropdown-menu:not(.active) :global(a),
	.dropdown-menu:not(.active) :global(button) {
		transform: translateY(10px);
	}
</style>
