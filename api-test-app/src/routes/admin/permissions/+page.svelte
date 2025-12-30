<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let userId = ""
	let permissionName = ""
	let permissionId = ""

	const handleGetPermissions = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: "/permissions" })
		loading = false
	}

	const handleCreatePermission = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "post", path: "/permissions", body: { name: permissionName } })
		loading = false
	}

	const handleUpdatePermission = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "put", path: "/permissions", body: { id: Number(permissionId), name: permissionName } })
		loading = false
	}

	const handleDeletePermission = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "delete", path: "/permissions", body: { id: Number(permissionId) } })
		loading = false
	}

	const handleGetUserPermissions = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: `/permissions/user/${userId}` })
		loading = false
	}

	const handleGrantPermission = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "post", path: `/permissions/user/${userId}/grant`, body: { permission: permissionName } })
		loading = false
	}

	const handleRevokePermission = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "post", path: `/permissions/user/${userId}/revoke`, body: { permission: permissionName } })
		loading = false
	}
</script>

<section class="panel">
	<h2>Admin → Permissions</h2>
	<p>Manage system permissions and user grants</p>

	<h3>List All Permissions</h3>
	<p>GET /permissions</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleGetPermissions}>Get All Permissions</button>
	</div>

	<hr />

	<h3>Create Permission</h3>
	<p>POST /permissions</p>
	<form on:submit|preventDefault={handleCreatePermission}>
		<div class="field">
			<label for="createPermName">Permission Name</label>
			<input id="createPermName" type="text" bind:value={permissionName} placeholder="e.g. user.edit" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Create Permission</button>
		</div>
	</form>

	<hr />

	<h3>Update Permission</h3>
	<p>PUT /permissions</p>
	<form on:submit|preventDefault={handleUpdatePermission}>
		<div class="field">
			<label for="updatePermId">Permission ID</label>
			<input id="updatePermId" type="text" bind:value={permissionId} placeholder="1" />
		</div>
		<div class="field">
			<label for="updatePermName">New Name</label>
			<input id="updatePermName" type="text" bind:value={permissionName} />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Update Permission</button>
		</div>
	</form>

	<hr />

	<h3>Delete Permission</h3>
	<p>DELETE /permissions</p>
	<form on:submit|preventDefault={handleDeletePermission}>
		<div class="field">
			<label for="deletePermId">Permission ID</label>
			<input id="deletePermId" type="text" bind:value={permissionId} placeholder="1" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading} class="danger">Delete Permission</button>
		</div>
	</form>

	<hr />

	<h3>Get User Permissions</h3>
	<p>GET /permissions/user/:userId</p>
	<form on:submit|preventDefault={handleGetUserPermissions}>
		<div class="field">
			<label for="getUserPermUserId">User ID</label>
			<input id="getUserPermUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Get User Permissions</button>
		</div>
	</form>

	<hr />

	<h3>Grant Permission to User</h3>
	<p>POST /permissions/user/:userId/grant</p>
	<form on:submit|preventDefault={handleGrantPermission}>
		<div class="field">
			<label for="grantUserId">User ID</label>
			<input id="grantUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="field">
			<label for="grantPermName">Permission Name</label>
			<input id="grantPermName" type="text" bind:value={permissionName} placeholder="e.g. administrator" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Grant Permission</button>
		</div>
	</form>

	<hr />

	<h3>Revoke Permission from User</h3>
	<p>POST /permissions/user/:userId/revoke</p>
	<form on:submit|preventDefault={handleRevokePermission}>
		<div class="field">
			<label for="revokeUserId">User ID</label>
			<input id="revokeUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="field">
			<label for="revokePermName">Permission Name</label>
			<input id="revokePermName" type="text" bind:value={permissionName} placeholder="e.g. administrator" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading} class="danger">Revoke Permission</button>
		</div>
	</form>
</section>

<style>
	.stack {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	hr {
		margin: 20px 0;
		border: none;
		border-top: 1px solid #333542;
	}
	.danger {
		background: #3a1a1a;
		border-color: #6b2b2b;
	}
	.danger:hover {
		background: #4a2020;
		border-color: #8b3b3b;
	}
</style>
