<script lang="ts">
	import { createEventDispatcher } from "svelte"
	import Button from "$components/fields/button.svelte"

	type ItemResolver<T = any, R = string> = (item: T, index: number) => R
	type RepeaterEvent<T = any> = { item: T; index: number }

	const dispatch = createEventDispatcher<{
		add: void
		duplicate: RepeaterEvent
		remove: RepeaterEvent
		save: RepeaterEvent
	}>()

	export let title = "Repeater"
	export let items: any[] = []
	export let addLabel = "Add item"
	export let emptyLabel = "No entries yet"
	export let isSaving = false
	export let getItemLabel: ItemResolver = (item, index) => item?.key ?? `Item ${index + 1}`
	export let getItemMeta: ItemResolver<any, string | null> = () => null
	export let getSaveLabel: ItemResolver = () => "Save"
	export let getSaveDisabled: ItemResolver<any, boolean> = () => isSaving
	export let metaDensity: "normal" | "compact" = "normal"

	let collapsedState: Record<number, boolean> = {}

	$: {
		const nextState: Record<number, boolean> = {}
		items.forEach((_, index) => {
			nextState[index] = collapsedState[index] ?? true
		})
		collapsedState = nextState
	}

	const toggleCollapse = (index: number) => {
		collapsedState = { ...collapsedState, [index]: !collapsedState[index] }
	}

	const handleHeaderClick = (event: MouseEvent, index: number) => {
		const target = event.target as HTMLElement | null
		if (target?.closest?.(".repeater__actions")) {
			return
		}
		if ((event.target as HTMLElement | null)?.closest?.("button[data-prevent-toggle]")) {
			return
		}
		toggleCollapse(index)
	}

	const handleHeaderKeydown = (event: KeyboardEvent, index: number) => {
		if (event.defaultPrevented) return
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			handleHeaderClick(event as unknown as MouseEvent, index)
		}
	}

	const fire = <T,>(type: "duplicate" | "remove" | "save", detail: RepeaterEvent<T>) => dispatch(type, detail)
</script>

<div class="repeater">
	<div class="repeater__header">
		<div>
			<h3>{title}</h3>
			<slot name="helper" />
		</div>
		<Button on:click={() => dispatch("add")}>{addLabel}</Button>
	</div>

	{#if !items.length}
		<p class="repeater__empty">{emptyLabel}</p>
	{/if}

	{#each items as item, index}
		{@const isCollapsed = collapsedState[index] ?? true}
		{@const metaText = getItemMeta(item, index)}
		<article class={`repeater__item ${isCollapsed ? "is-collapsed" : ""}`}>
			<header
				class="repeater__item-header"
				role="button"
				tabindex="0"
				aria-expanded={!isCollapsed}
				on:click={(event) => handleHeaderClick(event, index)}
				on:keydown={(event) => handleHeaderKeydown(event, index)}
			>
				<button
					type="button"
					class="repeater__collapse"
					aria-label={isCollapsed ? "Expand section" : "Collapse section"}
					aria-expanded={!isCollapsed}
					on:click={(event) => {
						event.stopPropagation()
						toggleCollapse(index)
					}}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path d="M9 6l6 6-6 6" />
					</svg>
				</button>
				<div class="repeater__item-title">
					<h4>{getItemLabel(item, index)}</h4>
					{#if metaText}
						<p class={`repeater__item-meta ${metaDensity === "compact" ? "is-compact" : ""}`}>{metaText}</p>
					{/if}
				</div>
				<div class="repeater__actions">
					<button
						type="button"
						data-prevent-toggle
						on:click={(event) => {
							event.stopPropagation()
							fire("duplicate", { item, index })
						}}>Duplicate</button
					>
					<button
						type="button"
						class="danger"
						data-prevent-toggle
						on:click={(event) => {
							event.stopPropagation()
							fire("remove", { item, index })
						}}>Delete</button
					>
				</div>
			</header>

			<section class={`repeater__item-body ${isCollapsed ? "collapsed" : ""}`} aria-hidden={isCollapsed}>
				<slot {item} {index} />
			</section>

			<footer class={`repeater__item-footer ${isCollapsed ? "collapsed" : ""}`} aria-hidden={isCollapsed}>
				<Button
					on:click={(event) => {
						event.stopPropagation()
						fire("save", { item, index })
					}}
					disabled={Boolean(getSaveDisabled(item, index))}>{getSaveLabel(item, index)}</Button
				>
			</footer>
		</article>
	{/each}
</div>

<style lang="scss">
	.repeater {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);
		width: 100%;
	}

	.repeater__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
		padding-bottom: calc(var(--gutter) * 1.25);

		h3 {
			margin: 0;
			font-size: var(--font-size-large);
		}
	}

	.repeater__empty {
		padding: calc(var(--gutter) * 2);
		text-align: center;
		border: var(--border);
		border-radius: var(--border-radius);
		color: var(--text-color-secondary);
	}

	.repeater__item {
		border: 1px solid var(--border-color);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2);
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.4);

		&.is-collapsed {
			gap: calc(var(--gutter) * 1);
		}
	}

	.repeater__item-header {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
		cursor: pointer;
	}

	.repeater__item-title {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;

		h4 {
			margin: 0;
			font-size: var(--font-size);
		}
	}

	.repeater__item-meta {
		margin: 0;
		font-size: var(--font-size-small);
		color: rgba(255, 255, 255, 0.65);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.repeater__item-meta.is-compact {
		font-size: var(--font-size-small);
		letter-spacing: 0.06em;
	}

	.repeater__collapse {
		border: none;
		background: transparent;
		color: rgba(255, 255, 255, 0.7);
		cursor: pointer;
		padding: 0;
		line-height: 0;
		display: flex;
		align-items: center;

		svg {
			width: 16px;
			height: 16px;
			stroke: currentColor;
			stroke-width: 2;
			fill: none;
			transform: rotate(-90deg);
			transition: transform 150ms ease;
		}

		&[aria-expanded="true"] svg {
			transform: rotate(0deg);
		}
	}

	.repeater__actions {
		display: flex;
		gap: calc(var(--gutter) * 1);

		button {
			border: none;
			background: transparent;
			color: rgba(255, 255, 255, 0.55);
			text-transform: uppercase;
			font-size: var(--font-size-small);
			letter-spacing: 0.08em;
			cursor: pointer;
			padding: 0;

			&:hover {
				color: var(--white);
			}

			&.danger {
				color: #f56565;
			}
		}
	}

	.repeater__item-body {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);

		&.collapsed {
			display: none;
		}
	}

	.repeater__item-footer {
		display: flex;
		justify-content: flex-end;
		padding-top: calc(var(--gutter) * 1);
		border-top: 1px solid rgba(255, 255, 255, 0.06);

		&.collapsed {
			display: none;
		}
	}
</style>
