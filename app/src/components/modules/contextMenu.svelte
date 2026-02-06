<script lang="ts">
	import { createEventDispatcher, onDestroy, onMount } from "svelte"

	type MenuItem = {
		label: string
		action: () => void
		icon?: string
	}

	type GlobalWithRegistry = typeof globalThis & {
		__appContextMenuClosers__?: Set<() => void>
	}

	const registry = ((globalThis as GlobalWithRegistry).__appContextMenuClosers__ ??= new Set<() => void>())

	export let togglers = ""
	export let items: MenuItem[] = []

	const dispatch = createEventDispatcher<{ close: void }>()

	let menuRef: HTMLDivElement | null = null
	let isOpen = false
	let x = 0
	let y = 0

	const closeMenu = () => {
		if (!isOpen) return
		isOpen = false
		registry.delete(closeMenu)
		dispatch("close")
	}

	const focusMenu = () => {
		requestAnimationFrame(() => menuRef?.focus())
	}

	const openMenu = (event: MouseEvent) => {
		registry.forEach((closer) => {
			if (closer !== closeMenu) closer()
		})
		x = event.clientX
		y = event.clientY
		isOpen = true
		registry.add(closeMenu)
		focusMenu()
	}

	const matchesToggler = (target: EventTarget | null) => {
		if (!togglers.trim()) return false
		const element = target instanceof Element ? target : (target as Node)?.parentElement
		if (!element) return false
		return togglers
			.split(",")
			.map((selector) => selector.trim())
			.filter(Boolean)
			.some((selector) => element.closest(selector))
	}

	const handleGlobalContextMenu = (event: MouseEvent) => {
		if (!matchesToggler(event.target)) {
			return
		}
		event.preventDefault()
		openMenu(event)
	}

	const handleGlobalClick = (event: MouseEvent) => {
		if (!isOpen) return
		const target = event.target as Node | null
		if (target && menuRef?.contains(target as Node)) {
			return
		}
		closeMenu()
	}

	const handleGlobalKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			closeMenu()
		}
	}

	const handleItemClick = (item: MenuItem) => {
		item.action?.()
		closeMenu()
	}

	onMount(() => {
		document.addEventListener("contextmenu", handleGlobalContextMenu)
		document.addEventListener("click", handleGlobalClick)
		document.addEventListener("keydown", handleGlobalKeydown)
	})

	onDestroy(() => {
		if (typeof document === "undefined") return
		closeMenu()
		document.removeEventListener("contextmenu", handleGlobalContextMenu)
		document.removeEventListener("click", handleGlobalClick)
		document.removeEventListener("keydown", handleGlobalKeydown)
	})

	const handleMenuKeydown = (event: KeyboardEvent) => {
		if (event.key === "Escape") {
			closeMenu()
		}
	}
</script>

{#if isOpen}
	<div bind:this={menuRef} role="menu" tabindex="-1" class="context-menu" style={`top: ${y}px; left: ${x}px;`} on:click|stopPropagation on:keydown={handleMenuKeydown}>
		{#each items as item}
			<button type="button" class="context-menu__item" role="menuitem" on:click={() => handleItemClick(item)}>
				{#if item.icon}
					<i class={`context-menu__icon ${item.icon}`}></i>
				{/if}
				<span class="context-menu__label">{item.label}</span>
			</button>
		{/each}
	</div>
{/if}

<style lang="scss" scoped>
	.context-menu {
		position: fixed;
		top: 0;
		left: 0;

		display: flex;
		flex-wrap: nowrap;
		flex-direction: column;

		background-color: rgba(22, 23, 29, 0.25);
		backdrop-filter: blur(10px);

		border: 1px solid var(--border-color);
		box-shadow: 0 4px 60px rgba(0, 0, 0, 0.25);

		z-index: 1000;
		min-width: fit-content;
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 1);
		gap: calc(var(--gutter) * 0.5);
		outline: none;
		animation: contextMenuFade 120ms ease-out;
		transform-origin: top left;
		border-radius: var(--border-radius);
		overflow: hidden;
		user-select: none;
	}

	.context-menu__item {
		width: 100%;
		padding: calc(var(--gutter) * 1) calc(var(--gutter) * 1.5);
		cursor: pointer;
		white-space: nowrap;
		text-align: left;
		background: transparent;
		border: none;
		color: inherit;
		font: inherit;
		font-size: var(--font-size-small);
		border-radius: var(--border-radius);
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);

		.context-menu__icon {
			font-size: var(--font-size-small);
			opacity: 0.65;
		}

		.context-menu__label {
			flex: 1;
		}

		&:hover,
		&:focus-visible {
			background-color: rgba(44, 46, 56, 0.4);
			.context-menu__icon {
				opacity: 1;
			}
			.context-menu__label {
				color: var(--text-color);
			}
		}

		&:active {
			background-color: rgba(44, 46, 56, 0.6);
		}
	}

	@keyframes contextMenuFade {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
