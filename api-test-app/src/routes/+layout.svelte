<script lang="ts">
	import { onMount } from "svelte"
	import { browser } from "$app/environment"
	import { goto } from "$app/navigation"
	import { page } from "$app/stores"
	import "../app.css"
	import { initApi, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "$lib/client/api"

	const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1"
	let accessToken = ""
	let accessExpires = ""
	let refreshToken = ""
	let refreshExpires = ""
	let lastResponse = "No response yet"
	let highlighted = "No response yet"
	let lastStatus = ""
	let lastOk = true
	let lastError = ""
	let selectedRoute = "/"
	let dropdownOpen = false

	const routeFiles = import.meta.glob("/src/routes/**/+page.svelte", { eager: true })
	const routes = Array.from(
		new Set(
			Object.keys(routeFiles)
				.map((key) => key.replace("/src/routes", "").replace("/+page.svelte", "") || "/")
				.filter((path) => !path.includes("[")),
		),
	).sort((a, b) => {
		if (a === "/") return -1
		if (b === "/") return 1
		return a.localeCompare(b)
	})

	const shortenToken = (str: string, length = 10) => {
		if (!str) return ""
		if (str.length <= length * 2) return str
		return `${str.slice(0, length)}...${str.slice(-length)}`
	}

	const syntaxHighlight = (json: string) => {
		const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
		return escaped.replace(/(".*?"(?=:))|(".*?")|(\b\d+\b)|(\btrue\b|\bfalse\b|\bnull\b)/g, (match, key, str, num, bool) => {
			if (key) return `<span class="j-key">${key}</span>`
			if (str) return `<span class="j-string">${str}</span>`
			if (bool) return `<span class="j-bool">${bool}</span>`
			return `<span class="j-num">${num}</span>`
		})
	}

	const syncToken = () => {
		if (!browser) return
		const access = getAccessToken()
		const refresh = getRefreshToken()
		accessToken = access.token
		accessExpires = access.expiresAt || ""
		refreshToken = refresh.token
		refreshExpires = refresh.expiresAt || ""
	}

	const handleClear = () => {
		if (!browser) return
		setAccessToken("")
		setRefreshToken("")
		lastResponse = ""
		lastError = ""
		lastStatus = ""
		lastOk = true
		highlighted = "No response yet"
		syncToken()
	}

	const toggleDropdown = () => {
		if (!browser) return
		dropdownOpen = !dropdownOpen
	}

	const handleRouteClick = (route: string) => {
		if (!browser) return
		selectedRoute = route
		dropdownOpen = false
		goto(route)
	}

	onMount(() => {
		if (!browser) return
		initApi({
			baseUrl,
			onLog: (payload) => {
				lastError = ""
				lastResponse = JSON.stringify(payload.body, null, 2)
				highlighted = syntaxHighlight(lastResponse)
				lastStatus = typeof payload.status === "number" ? `HTTP ${payload.status}` : ""
				lastOk = !!payload.ok
				syncToken()
			},
		})
		syncToken()
		selectedRoute = $page.url.pathname
	})
</script>

<svelte:head>
	<title>Magix API Tester</title>
</svelte:head>

<div class="layout">
	<header>
		<div class="logo">Magix API Test</div>
		<div class="controls">
			<span class="small">{baseUrl}</span>

			<div class="nav-picker">
				<div class={`nav-select ${dropdownOpen ? "open" : ""}`}>
					<button id="routePicker" type="button" class="nav-button" on:click={toggleDropdown}>
						<span>{selectedRoute === "/" ? "Home" : selectedRoute}</span>
						<span class="chevron">▾</span>
					</button>
					{#if dropdownOpen}
						<ul class="nav-menu">
							{#each routes as route}
								<li>
									<a href={route} on:click|preventDefault={() => handleRouteClick(route)}>
										{route === "/" ? "Home" : route}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
			</div>
			<button class="secondary" on:click={handleClear}>Clear</button>
		</div>
	</header>

	<aside class="sidebar">
		<div class="card meta-card">
			<div class="meta-row">
				<strong>Base URL</strong>
				<a href={baseUrl} target="_blank" rel="noopener noreferrer">{baseUrl}</a>
			</div>
			<div class="meta-row">
				<strong>Access token</strong>
				<span>{shortenToken(accessToken) || "none"}</span>
			</div>
			<div class="meta-row">
				<strong>Access expires</strong>
				<span>{accessExpires ? new Date(accessExpires).toLocaleString() : "unknown"}</span>
			</div>
			<div class="meta-row">
				<strong>Refresh token</strong>
				<span>{shortenToken(refreshToken) || "none"}</span>
			</div>
			<div class="meta-row">
				<strong>Refresh expires</strong>
				<span>{refreshExpires ? new Date(refreshExpires).toLocaleString() : "unknown"}</span>
			</div>
		</div>

		<section class="card">
			<h2>Output</h2>
			{#if lastStatus}
				<div class={`pill ${lastOk ? "pill-ok" : "pill-bad"}`}>{lastStatus}</div>
			{/if}
			{#if lastError}
				<div class="status" style="background:#2a1010;border-color:#442222;color:#f8d7da">{lastError}</div>
			{/if}
			<div class="resp"><code>{@html highlighted}</code></div>
		</section>
	</aside>

	<main>
		<slot />
	</main>
</div>

<style>
	.nav-picker {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-select {
		position: relative;
		min-width: 160px;
	}

	.nav-button {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 8px 10px;
		background: #1e1e28;
		border: 1px solid #333542;
		border-radius: 6px;
		color: #f5f5f7;
		cursor: pointer;
		transition:
			border-color 120ms ease,
			background 120ms ease;
	}

	.nav-button:hover {
		border-color: #4a7dff;
		background: #252637;
	}

	.chevron {
		opacity: 0.8;
		font-size: 12px;
	}

	.nav-menu {
		position: absolute;
		top: calc(100% + 6px);
		left: 0;
		width: 100%;
		margin: 0;
		padding: 6px 0;
		background: #13131c;
		border: 1px solid #333542;
		border-radius: 8px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
		list-style: none;
		z-index: 20;
	}

	.nav-menu li a {
		display: block;
		padding: 8px 12px;
		color: #f5f5f7;
		text-decoration: none;
		transition:
			background 120ms ease,
			color 120ms ease;
	}

	.nav-menu li a:hover,
	.nav-menu li a:focus-visible {
		background: #1f2740;
		color: #fff;
	}

	.nav-select.open .nav-button {
		border-color: #4a7dff;
	}
</style>
