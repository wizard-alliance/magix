<script lang="ts">
	import { onMount } from "svelte"
	import dayjs from "dayjs"
	import { app } from "$lib/app"
	import type { HealthResponse } from "$lib/types/types"

	type StatusNote = { label: string; value: string }
	type Action = { label: string; icon: string; event: () => void | Promise<void>; disabled?: () => boolean }

	let health: HealthResponse | null = null
	let statusNotes: StatusNote[] = []
	let isLoading = false
	let errorMessage: string | null = null

	const fetchHealth = async () => {
		try {
			isLoading = true
			health = await app.Misc.Health.getHealth()
			errorMessage = null
		} catch (error) {
			health = null
			errorMessage = error instanceof Error ? error.message : "Health check failed"
		} finally {
			isLoading = false
		}
	}

	onMount(() => {
		fetchHealth()
	})

	const actions: Action[] = [
		{ label: "Refresh Health", icon: "fa-light fa-arrows-rotate", event: () => fetchHealth(), disabled: () => isLoading },
		{ label: "Jump to Global", icon: "fa-light fa-up-right-from-square", event: () => app.Events.emit("status:tab", { tab: "global" }) },
		{ label: "Focus Character", icon: "fa-light fa-robot", event: () => app.Events.emit("status:tab", { tab: "character" }) },
	]

	$: statusNotes = health
		? [
				{ label: "API status", value: health.status },
				{ label: "API base", value: health.apiBaseUrl },
				{ label: "Checked at", value: dayjs(health.timestamp).format("MMM D, YYYY h:mm:ss A") },
				{ label: "Database configured", value: health.databaseConfigured ? "yes" : "no" },
				{ label: "Database version", value: health.databaseVersion ?? "n/a" },
				{ label: "SMTP configured", value: health.smtpConfigured ? "yes" : "no" },
			]
		: []
</script>

<section class="panel-section">
	<header class="panel-header">
		<h2 class="label">Misc</h2>
		<p class="hint">Utility actions and debug stats</p>
	</header>

	<div class="action-grid">
		{#each actions as action}
			<button
				type="button"
				class="action-card"
				on:click={action.event}
				disabled={action.disabled ? action.disabled() : false}
				aria-busy={action.disabled?.() ? "true" : undefined}
			>
				<i class={action.icon}></i>
				<span>{action.label}</span>
			</button>
		{/each}
	</div>

	{#if errorMessage}
		<p class="notice error">{errorMessage}</p>
	{:else if !statusNotes.length}
		<p class="notice">{isLoading ? "Checking services…" : "Health response not available."}</p>
	{:else}
		<ul class="note-list">
			{#each statusNotes as note}
				<li>
					<span>{note.label}</span>
					<strong>{note.value}</strong>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<style lang="scss">
	.panel-section {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.panel-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.hint {
		font-size: var(--font-size-small);
		color: var(--text-color-secondary);
		margin: 0;
	}

	.action-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: calc(var(--gutter) * 1);
	}

	.action-card {
		border: 1px solid var(--border-color);
		background: rgba(255, 255, 255, 0.02);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 1.25);
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: flex-start;
		cursor: pointer;
		color: inherit;
	}

	.action-card:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.action-card i {
		color: var(--accent-color);
	}

	.note-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.75);
	}

	.note-list li {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-small);
		padding: calc(var(--gutter) * 0.75);
		border-bottom: 1px solid rgba(255, 255, 255, 0.05);
	}

	.note-list span {
		color: var(--text-color-secondary);
	}

	.note-list strong {
		font-weight: 600;
	}

	.notice {
		margin: 0;
		padding: calc(var(--gutter) * 0.75);
		font-size: var(--font-size-small);
		background: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
	}

	.notice.error {
		color: #f56565;
		background: rgba(245, 101, 101, 0.15);
	}
</style>
