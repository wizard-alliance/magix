<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import { get } from "svelte/store"

	let user: any = null
	let status = ""

	const ensureUser = async () => {
		const current = get(app.State.currentUser)
		if (current) {
			user = current
			return
		}
		const fetched = await app.Auth.me().catch(() => null)
		if (fetched) {
			user = fetched
			return
		}
		goto("/account/login")
	}

	onMount(() => {
		app.Config.pageTitle = "Profile"
		ensureUser()
	})

	const logout = async () => {
		await app.Auth.logout()
		goto("/account/login")
	}
</script>

{#if user}
	<section class="panel">
		<h1>Profile</h1>
		<div class="info">
			<div>
				<span class="label">Email</span>
				<span>{user.email}</span>
			</div>
			<div>
				<span class="label">Username</span>
				<span>{user.username}</span>
			</div>
			<div>
				<span class="label">First name</span>
				<span>{user.firstName ?? "-"}</span>
			</div>
			<div>
				<span class="label">Last name</span>
				<span>{user.lastName ?? "-"}</span>
			</div>
			<div>
				<span class="label">Phone</span>
				<span>{user.phone ?? "-"}</span>
			</div>
			<div>
				<span class="label">Company</span>
				<span>{user.company ?? "-"}</span>
			</div>
			<div>
				<span class="label">Address</span>
				<span>{user.address ?? "-"}</span>
			</div>
		</div>
		<button on:click={logout}>Logout</button>
		{#if status}<p class="status">{status}</p>{/if}
	</section>
{/if}

<style>
	.panel {
		max-width: 520px;
		margin: 0 auto;
		background: #0f0f14;
		padding: calc(var(--gutter) * 2);
		border-radius: 12px;
		border: 1px solid #222230;
	}

	.info {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: var(--gutter);
	}

	.label {
		color: #9ca3af;
		font-size: 13px;
		margin-right: 8px;
	}

	button {
		background: linear-gradient(135deg, #ef4444, #f97316);
		color: white;
		border: none;
		border-radius: 10px;
		padding: 12px;
		cursor: pointer;
		font-weight: 600;
		width: 100%;
	}

	.status {
		margin-top: var(--gutter);
		color: #f97316;
	}
</style>
