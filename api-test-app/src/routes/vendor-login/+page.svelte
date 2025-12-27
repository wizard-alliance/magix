<script lang="ts">
	import { browser } from "$app/environment"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import { setAccessToken, setRefreshToken } from "$lib/client/api"

	let status = ""
	let tokens = { access: "", refresh: "" }

	const API_BASE = "http://localhost:4000/api/v1"

	onMount(() => {
		if (!browser) return
		const params = $page.url.searchParams
		const access = params.get("access_token")
		const accessExp = params.get("access_expires")
		const refresh = params.get("refresh_token")
		const refreshExp = params.get("refresh_expires")
		const error = params.get("error")

		if (error) {
			status = `Error: ${error}`
		} else if (access && refresh) {
			tokens = { access, refresh }
			status = "Logged in!"
			setAccessToken(access, accessExp ?? undefined)
			setRefreshToken(refresh, refreshExp ?? undefined)
			history.replaceState({}, "", window.location.pathname)
		}
	})

	const loginWithDiscord = () => {
		const returnUrl = encodeURIComponent(window.location.href)
		window.location.href = `${API_BASE}/account/auth/vendor/discord/redirect?returnUrl=${returnUrl}`
	}
</script>

<section class="panel">
	<h2>Login with Discord</h2>

	{#if status}
		<p class="status">{status}</p>
	{/if}

	{#if tokens.access}
		<div class="tokens">
			<p><strong>Access:</strong> {tokens.access.slice(0, 20)}...</p>
			<p><strong>Refresh:</strong> {tokens.refresh.slice(0, 20)}...</p>
		</div>
	{:else}
		<button on:click={loginWithDiscord}>Login with Discord</button>
	{/if}
</section>

<style>
	.status {
		padding: 0.5rem;
		background: #333;
		border-radius: 4px;
	}
	.tokens {
		font-size: 0.8rem;
		word-break: break-all;
	}
</style>
