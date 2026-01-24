<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import ProfileSidebar from "$components/sections/sidebar/ProfileSidebar.svelte"

	let user: any = null

	onMount(async () => {
		app.Config.pageTitle = "Profile"
		app.UI.sidebarSetContent(1, ProfileSidebar as any, {}, "200px")
		const data = await app.Auth.me().catch(() => null)
		user = data?.info
	})

	$: info = user || {}
	$: initials = (info.firstName?.[0] || "") + (info.lastName?.[0] || info.username?.[0] || "")
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
</script>

<div class="page page-thin">
	{#if user}
		<div class="profile-header">
			<div class="avatar">{initials.toUpperCase()}</div>
			<div class="info-block">
				<h1>{fullName || info.username}</h1>
				<p class="email">{info.email}</p>
			</div>
		</div>

		<div class="details">
			{#if info.phone}
				<div class="row"><span>Phone</span><span>{info.phone}</span></div>
			{/if}
			{#if info.company}
				<div class="row"><span>Company</span><span>{info.company}</span></div>
			{/if}
			{#if info.address}
				<div class="row"><span>Address</span><span>{info.address}</span></div>
			{/if}
			{#if info.created}
				<div class="row"><span>Member since</span><span>{new Date(info.created).toLocaleDateString()}</span></div>
			{/if}
		</div>

		<div class="actions">
			<Button variant="secondary" size="sm"><a href="/account/settings">Edit Profile</a></Button>
		</div>
	{:else}
		<p class="loading">Loading...</p>
	{/if}
</div>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
		margin-bottom: calc(var(--gutter) * 3);
	}

	.avatar {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--accent-color);
		color: var(--black);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: 600;
	}

	.info-block h1 {
		margin: 0 0 4px;
		font-size: 1.5rem;
	}

	.email {
		color: var(--text-color-secondary);
		margin: 0;
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
		padding: calc(var(--gutter) * 2);
		background: var(--secondary-color);
		border-radius: var(--border-radius);
		margin-bottom: calc(var(--gutter) * 2);
	}

	.details .row {
		display: flex;
		justify-content: space-between;
	}

	.details .row span:first-child {
		color: var(--text-color-secondary);
	}

	.actions {
		display: flex;
		gap: var(--gutter);
	}

	.actions a {
		color: inherit;
		text-decoration: none;
	}

	.loading {
		color: var(--text-color-secondary);
	}
</style>
