<script lang="ts">
	import { onMount } from "svelte"

	export let message = "Your profile"
	let title = "Loading ..."
	let profile: any = null
	onMount(async () => {
		profile = await app.Auth.me()
		title = `${profile.info.username || "User"}'s Profile`
	})
</script>

<div class="profile-sidebar">
	<div class="header margin-bottom-2">
		<h3>{title}</h3>
		<p class="small">{message}</p>
	</div>

	<nav>
		<a href="/account/profile">Overview</a>
		<a href="/account/settings">Settings</a>
	</nav>
</div>

<style>
	.small {
		font-size: 0.875rem;
		color: var(--text-muted);
	}
	nav {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.5);
	}

	nav a {
		padding: 8px 0px;
		border-radius: 6px;
		color: var(--white);
		text-decoration: none;
	}

	nav a:hover {
		background: var(--secondary-color);
	}
</style>
