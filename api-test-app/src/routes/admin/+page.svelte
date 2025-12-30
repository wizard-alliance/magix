<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false

	const handleLogoutAllUsers = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "post", path: "/account/auth/logout/all-users" })
		loading = false
	}
</script>

<section class="panel">
	<h2>Admin</h2>
	<p>Admin-only endpoints requiring administrator permission</p>

	<div class="stack">
		<a href="/admin/users" class="btn">Manage Users</a>
		<a href="/admin/permissions" class="btn">Manage Permissions</a>
		<a href="/admin/settings" class="btn">Manage Settings</a>
	</div>

	<hr />

	<h3>Logout All Users</h3>
	<p>POST /account/auth/logout/all-users</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleLogoutAllUsers}>Logout All Users</button>
	</div>
</section>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.btn {
		display: inline-block;
		padding: 8px 16px;
		background: #1e1e28;
		border: 1px solid #333542;
		border-radius: 6px;
		color: #f5f5f7;
		text-decoration: none;
		transition:
			border-color 120ms ease,
			background 120ms ease;
	}
	.btn:hover {
		border-color: #4a7dff;
		background: #252637;
	}
	hr {
		margin: 20px 0;
		border: none;
		border-top: 1px solid #333542;
	}
</style>
