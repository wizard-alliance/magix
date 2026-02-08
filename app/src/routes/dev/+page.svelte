<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"

	let cacheStatus: { version: string; lastCleared: string | null; apiCacheSize: number } | null = null
	let loading = { api: false, browser: false, all: false }

	const loadStatus = async () => {
		cacheStatus = await app.Cache.adminStatus()
	}

	const clearCache = async (target: "api" | "browser" | "all") => {
		loading[target] = true
		const result = await app.Cache.adminClear(target)
		loading[target] = false

		if (result?.success) {
			app.UI.Notify.success(`Cache cleared: ${target}`, `Cache`)
			await loadStatus()
		} else {
			app.UI.Notify.error(`Failed to clear cache`, `Cache`)
		}
	}

	onMount(() => {
		loadStatus()
	})
</script>

<div class="page page-thin">
	<h1>Developer Tools</h1>

	<section>
		<h2>Cache Management</h2>
		<p class="muted">
			Control API server cache and browser client cache. Clearing browser cache bumps the version — all connected clients will wipe their local cache on next page load.
		</p>

		{#if cacheStatus}
			<div class="cache-status">
				<div class="stat">
					<span class="label">Version</span>
					<span class="value">{cacheStatus.version}</span>
				</div>
				<div class="stat">
					<span class="label">API Cache Entries</span>
					<span class="value">{cacheStatus.apiCacheSize}</span>
				</div>
				<div class="stat">
					<span class="label">Last Cleared</span>
					<span class="value">{cacheStatus.lastCleared ? new Date(cacheStatus.lastCleared).toLocaleString() : "Never"}</span>
				</div>
			</div>
		{/if}

		<div class="cache-actions">
			<Button variant="secondary" loading={loading.api} on:click={() => clearCache("api")}>
				<i class="fa-light fa-server"></i>
				<span>Clear API Cache</span>
			</Button>
			<Button variant="secondary" loading={loading.browser} on:click={() => clearCache("browser")}>
				<i class="fa-light fa-globe"></i>
				<span>Clear Browser Cache</span>
			</Button>
			<Button variant="danger" loading={loading.all} on:click={() => clearCache("all")}>
				<i class="fa-light fa-trash"></i>
				<span>Clear All Cache</span>
			</Button>
		</div>
	</section>
</div>

<style lang="scss">
	section {
		margin-top: 2rem;
	}

	h2 {
		margin-bottom: 0.25rem;
	}

	.muted {
		opacity: 0.6;
		font-size: var(--font-sm);
		margin-bottom: 1.5rem;
	}

	.cache-status {
		display: flex;
		gap: 2rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		border-radius: var(--radius);
		background: var(--bg-2);
		border: 1px solid var(--border);
	}

	.stat {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;

		.label {
			font-size: var(--font-xs);
			opacity: 0.5;
			text-transform: uppercase;
			letter-spacing: 0.05em;
		}

		.value {
			font-size: var(--font-md);
			font-weight: 500;
		}
	}

	.cache-actions {
		display: flex;
		gap: 0.75rem;
	}
</style>
