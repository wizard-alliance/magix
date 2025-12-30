<script lang="ts">
	import { browser } from "$app/environment"

	let loading = false
	let settingKey = ""
	let settingValue = ""
	let autoload = false

	const handleGetSettings = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: "/settings" })
		loading = false
	}

	const handleGetSetting = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "get", path: "/setting", params: { key: settingKey } })
		loading = false
	}

	const handleCreateSetting = async () => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "post",
			path: "/setting",
			body: { key: settingKey, value: settingValue, autoload: autoload ? 1 : 0 },
		})
		loading = false
	}

	const handleUpdateSetting = async () => {
		if (!browser) return
		loading = true
		await window.Request({
			method: "put",
			path: "/setting",
			body: { key: settingKey, value: settingValue, autoload: autoload ? 1 : 0 },
		})
		loading = false
	}

	const handleDeleteSetting = async () => {
		if (!browser) return
		loading = true
		await window.Request({ method: "delete", path: "/setting", body: { key: settingKey } })
		loading = false
	}
</script>

<section class="panel">
	<h2>Admin → Settings</h2>
	<p>Manage system settings (key-value store)</p>

	<h3>List All Settings</h3>
	<p>GET /settings</p>
	<div class="stack">
		<button type="button" disabled={loading} on:click={handleGetSettings}>Get All Settings</button>
	</div>

	<hr />

	<h3>Get Single Setting</h3>
	<p>GET /setting</p>
	<form on:submit|preventDefault={handleGetSetting}>
		<div class="field">
			<label for="getKey">Setting Key</label>
			<input id="getKey" type="text" bind:value={settingKey} placeholder="e.g. site_name" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Get Setting</button>
		</div>
	</form>

	<hr />

	<h3>Create Setting</h3>
	<p>POST /setting</p>
	<form on:submit|preventDefault={handleCreateSetting}>
		<div class="field">
			<label for="createKey">Key</label>
			<input id="createKey" type="text" bind:value={settingKey} placeholder="e.g. site_name" />
		</div>
		<div class="field">
			<label for="createValue">Value</label>
			<input id="createValue" type="text" bind:value={settingValue} placeholder="e.g. My Site" />
		</div>
		<div class="field checkbox">
			<input id="createAutoload" type="checkbox" bind:checked={autoload} />
			<label for="createAutoload">Autoload</label>
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Create Setting</button>
		</div>
	</form>

	<hr />

	<h3>Update Setting</h3>
	<p>PUT /setting</p>
	<form on:submit|preventDefault={handleUpdateSetting}>
		<div class="field">
			<label for="updateKey">Key</label>
			<input id="updateKey" type="text" bind:value={settingKey} placeholder="e.g. site_name" />
		</div>
		<div class="field">
			<label for="updateValue">Value</label>
			<input id="updateValue" type="text" bind:value={settingValue} />
		</div>
		<div class="field checkbox">
			<input id="updateAutoload" type="checkbox" bind:checked={autoload} />
			<label for="updateAutoload">Autoload</label>
		</div>
		<div class="stack">
			<button type="submit" disabled={loading}>Update Setting</button>
		</div>
	</form>

	<hr />

	<h3>Delete Setting</h3>
	<p>DELETE /setting</p>
	<form on:submit|preventDefault={handleDeleteSetting}>
		<div class="field">
			<label for="deleteKey">Key</label>
			<input id="deleteKey" type="text" bind:value={settingKey} placeholder="e.g. site_name" />
		</div>
		<div class="stack">
			<button type="submit" disabled={loading} class="danger">Delete Setting</button>
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
	.checkbox {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-direction: row;
	}
	.checkbox label {
		margin: 0;
	}
</style>
