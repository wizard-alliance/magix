<script lang="ts">
	import { onDestroy, onMount } from "svelte"
	import { app } from "$lib/app"

	let isOpen = true

	const subscriptions = [
		app.Events.on("status:open", (payload) => {
			isOpen = true
		}),
		app.Events.on("status:close", () => {
			isOpen = false
		}),
		app.Events.on("status:tab", (payload) => {
			isOpen = true
		}),
	]

	onDestroy(() => {
		subscriptions.forEach((unsubscribe) => {
			if (typeof unsubscribe === "function") {
				unsubscribe()
			}
		})
	})
</script>

<div class="wrapper" class:collapsed={!isOpen} aria-hidden={!isOpen}>
	<div class="wrapper-content scrollable">
		<section class="wrapper-content__inside wrapper-1">
			<section class="panel-section">
				<header class="panel-header">
					<h2 class="label">Misc</h2>
					<p class="hint">Utility actions and debug stats</p>
				</header>
			</section>
		</section>
	</div>
</div>

<style lang="scss">
	.wrapper {
		height: 100%;
		overflow: hidden;
		transition:
			opacity 180ms ease,
			transform 180ms ease;
	}

	.wrapper.collapsed {
		opacity: 0;
		pointer-events: none;
		transform: translateY(10px);
	}

	.wrapper-content {
		display: flex;
		position: relative;
		width: 100%;
		flex-basis: 100%;
		height: 100%;
		overflow: hidden;
		overflow-y: auto;
		flex-basis: 100%;

		font-size: var(--font-size-small);
		padding: calc(var(--gutter) * 1);

		transition:
			opacity 400ms cubic-bezier(0, 0, 0, 1),
			transform 400ms cubic-bezier(0, 0, 0, 1);
	}

	.wrapper-content__inside {
		width: 100%;
		transition:
			opacity 200ms ease,
			transform 200ms ease;
	}

	.wrapper-content__inside:not(.current) {
		position: absolute;
		opacity: 0;
		pointer-events: none;
		transform: translateX(20px);
	}

	.wrapper section {
		width: 100%;
	}
</style>
