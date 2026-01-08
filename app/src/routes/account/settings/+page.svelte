<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"

	let status = ""
	let loading = false
	let form = { firstName: "", lastName: "", phone: "", company: "", address: "" }

	const updateField = (field: keyof typeof form) => (event: Event) => {
		const target = event.currentTarget as HTMLInputElement | null
		if (!target) {
			return
		}
		form = { ...form, [field]: target.value }
	}

	onMount(() => {
		app.Config.pageTitle = "Account Settings"
		loadProfile()
	})

	const loadProfile = async () => {
		const user = await app.Auth.me().catch(() => null)
		if (user) {
			form = {
				firstName: user.firstName || "",
				lastName: user.lastName || "",
				phone: user.phone || "",
				company: user.company || "",
				address: user.address || "",
			}
		}
	}

	const saveProfile = async () => {
		loading = true
		status = ""
		try {
			const updated = await app.Auth.updateProfile({
				firstName: form.firstName,
				lastName: form.lastName,
				phone: form.phone,
				company: form.company,
				address: form.address,
			})
			status = "Profile updated"
			if (updated) {
				const current = app.State.currentUser
				if (current && typeof current.set === "function") {
					current.set(updated)
				}
			}
		} catch (error) {
			status = `Unable to save profile: ${(error as Error).message}`
		} finally {
			loading = false
		}
	}
</script>

<section class="panel">
	<h1>Account Settings</h1>
	<form class="stack" on:submit|preventDefault={saveProfile}>
		<label>
			<span>First name</span>
			<input type="text" value={form.firstName} on:input={updateField("firstName")} />
		</label>
		<label>
			<span>Last name</span>
			<input type="text" value={form.lastName} on:input={updateField("lastName")} />
		</label>
		<label>
			<span>Phone</span>
			<input type="text" value={form.phone} on:input={updateField("phone")} />
		</label>
		<label>
			<span>Company</span>
			<input type="text" value={form.company} on:input={updateField("company")} />
		</label>
		<label>
			<span>Address</span>
			<input type="text" value={form.address} on:input={updateField("address")} />
		</label>
		<button type="submit" disabled={loading}>Save profile</button>
		<a class="link" href="/account/settings/change-password">Change password</a>
	</form>
	{#if status}
		<p class="status">{status}</p>
	{/if}
</section>

<style>
	.panel {
		max-width: 520px;
		margin: 0 auto;
		background: #0f0f14;
		padding: calc(var(--gutter) * 2);
		border-radius: 12px;
		border: 1px solid #222230;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--gutter);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input {
		background: #0d0d12;
		border: 1px solid #2a2a35;
		border-radius: 8px;
		color: white;
		padding: 10px 12px;
	}

	button {
		background: linear-gradient(135deg, #06b6d4, #3b82f6);
		color: white;
		border: none;
		border-radius: 10px;
		padding: 12px;
		cursor: pointer;
		font-weight: 600;
	}

	.status {
		margin-top: var(--gutter);
		color: #60a5fa;
	}

	.link {
		color: #9ca3af;
		text-decoration: underline;
		font-size: 14px;
	}
</style>
