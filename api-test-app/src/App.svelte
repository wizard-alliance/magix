<script lang="ts">
	import Login from "./templates/login.svelte"

	const baseUrl = window.Config.apiBaseUrl
	const accessInfo = window.getAccessToken()
	const refreshInfo = window.getRefreshToken()
	let accessToken = accessInfo.token
	let accessExpires = accessInfo.expiresAt || ""
	let refreshToken = refreshInfo.token
	let refreshExpires = refreshInfo.expiresAt || ""
	let lastResponse = ""
	let lastError = ""
	let lastStatus = ""
	let lastOk = true
	let highlighted = "No response yet"

	const syntaxHighlight = (json: string) => {
		const escaped = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, '"')
		return escaped.replace(/(".*?"(?=:))|(".*?")|(\b\d+\b)|(\btrue\b|\bfalse\b|\bnull\b)/g, (match, key, str, num, bool) => {
			if (key) return `<span class="j-key">${key}</span>`
			if (str) return `<span class="j-string">${str}</span>`
			if (bool) return `<span class="j-bool">${bool}</span>`
			return `<span class="j-num">${num}</span>`
		})
	}

	const shortenToken = (str: string, length = 10) => {
		// Reverse truncate
		if (!str) return ""
		if (str.length <= length * 2) return str
		return `${str.slice(0, length)}...${str.slice(-length)}`
	}

	window.log = (payload: any) => {
		lastError = ""
		lastResponse = JSON.stringify(payload.body, null, 2)
		lastStatus = typeof payload.status === "number" ? `HTTP ${payload.status}` : ""
		lastOk = !!payload.ok
		syncToken()
		highlighted = syntaxHighlight(lastResponse)
	}

	const syncToken = () => {
		const access = window.getAccessToken()
		const refresh = window.getRefreshToken()
		accessToken = access.token
		accessExpires = access.expiresAt || ""
		refreshToken = refresh.token
		refreshExpires = refresh.expiresAt || ""
	}

	const handleClear = () => {
		window.setAccessToken("")
		window.setRefreshToken("")
		lastResponse = ""
		lastError = ""
		lastStatus = ""
		lastOk = true
		syncToken()
		highlighted = "No response yet"
	}
</script>

<div class="layout">
	<header>
		<div class="logo">Magix API Test</div>
		<div class="controls">
			<button class="secondary" on:click={handleClear}>Clear</button>
		</div>
	</header>

	<aside class="sidebar">
		<div class="card meta-card">
			<!-- <div class="meta-row">
				<strong>Base URL</strong>
				<a href={baseUrl} target="_blank" rel="noopener noreferrer">{baseUrl}</a>
			</div> -->
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
			<!-- <h2>Output</h2> -->
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
		<section class="panel">
			<Login />
		</section>
	</main>
</div>
