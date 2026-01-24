<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import ProfileSidebar from "$components/sections/sidebar/ProfileSidebar.svelte"

	let user: any = null

	onMount(async () => {
		app.Config.pageTitle = "Profile"
		app.UI.sidebarSetContent(1, ProfileSidebar as any, {}, "200px")
		const data = await app.Auth.me().catch(() => null)
		user = data?.info
	})

	$: info = user || {}
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
</script>

<div class="page page-thin">
	{#if user}
		<div class="profile-header">
			<Avatar name={fullName || info.username} size="lg" />
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
			<Button variant="secondary" size="sm" href="/account/settings">Edit Profile</Button>
		</div>
	{:else}
		<Spinner />
	{/if}
</div>

<style>
	.profile-header {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
		margin-bottom: calc(var(--gutter) * 3);
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
</style>
