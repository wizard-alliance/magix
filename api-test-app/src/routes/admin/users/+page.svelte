<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let userId = ""
	let username = ""
	let email = ""
	let password = ""
	let firstName = ""
	let lastName = ""

	const handleGetUsers = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: "/account/users" })
		loading = false
	}

	const handleGetUser = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: "/account/user", params: { id: userId } })
		loading = false
	}

	const handleCreateUser = async () => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "post",
			path: "/account/user",
			body: {
				username,
				email,
				password,
				first_name: firstName,
				last_name: lastName,
			},
		})
		loading = false
	}

	const handleUpdateUser = async () => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "put",
			path: "/account/user",
			body: {
				id: Number(userId),
				username,
				email,
				first_name: firstName,
				last_name: lastName,
			},
		})
		loading = false
	}

	const handleDeleteUser = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "delete", path: "/account/user", body: { id: Number(userId) } })
		loading = false
	}
</script>

<section class="panel">
	<h2>Admin → Users</h2>
	<p>CRUD operations for user management (administrator only)</p>

	<h3>List All Users</h3>
	<p>GET /account/users</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleGetUsers}>Get All Users</button>
	</div>

	<hr />

	<h3>Get Single User</h3>
	<p>GET /account/user</p>
	<form on:submit|preventDefault={handleGetUser}>
		<div class="field">
			<label for="getUserId">User ID</label>
			<input id="getUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Get User</button>
		</div>
	</form>

	<hr />

	<h3>Create User</h3>
	<p>POST /account/user</p>
	<form on:submit|preventDefault={handleCreateUser}>
		<div class="field">
			<label for="createUsername">Username</label>
			<input id="createUsername" type="text" bind:value={username} />
		</div>
		<div class="field">
			<label for="createEmail">Email</label>
			<input id="createEmail" type="email" bind:value={email} />
		</div>
		<div class="field">
			<label for="createPassword">Password</label>
			<input id="createPassword" type="password" bind:value={password} />
		</div>
		<div class="field">
			<label for="createFirstName">First Name</label>
			<input id="createFirstName" type="text" bind:value={firstName} />
		</div>
		<div class="field">
			<label for="createLastName">Last Name</label>
			<input id="createLastName" type="text" bind:value={lastName} />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Create User</button>
		</div>
	</form>

	<hr />

	<h3>Update User</h3>
	<p>PUT /account/user</p>
	<form on:submit|preventDefault={handleUpdateUser}>
		<div class="field">
			<label for="updateUserId">User ID</label>
			<input id="updateUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="field">
			<label for="updateUsername">Username</label>
			<input id="updateUsername" type="text" bind:value={username} />
		</div>
		<div class="field">
			<label for="updateEmail">Email</label>
			<input id="updateEmail" type="email" bind:value={email} />
		</div>
		<div class="field">
			<label for="updateFirstName">First Name</label>
			<input id="updateFirstName" type="text" bind:value={firstName} />
		</div>
		<div class="field">
			<label for="updateLastName">Last Name</label>
			<input id="updateLastName" type="text" bind:value={lastName} />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Update User</button>
		</div>
	</form>

	<hr />

	<h3>Delete User</h3>
	<p>DELETE /account/user</p>
	<form on:submit|preventDefault={handleDeleteUser}>
		<div class="field">
			<label for="deleteUserId">User ID</label>
			<input id="deleteUserId" type="text" bind:value={userId} placeholder="1" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading} class="danger">Delete User</button>
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
