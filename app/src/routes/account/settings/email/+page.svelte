<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let sending = false
	let currentEmail = ""
	let newEmail = ""
	let sent = false
	let successMessage = ""
	let errorMessage = ""

	// Check for redirect params (from confirm link)
	$: {
		const params = $page.url.searchParams
		if (params.get("emailChanged")) successMessage = params.get("message") || "Email updated successfully."
		if (params.get("error")) errorMessage = params.get("error") || ""
	}

	onMount(async () => {
		try {
			const user = await app.Auth.me(true)
			currentEmail = user?.info?.email || ""
		} catch {}
		loading = false
	})

	const submit = async () => {
		if (!newEmail) return
		sending = true
		errorMessage = ""
		successMessage = ""
		try {
			const res = await app.System.Request.post<{ success: boolean; message: string }>(`/account/email/change`, { body: { email: newEmail } })
			if (res && "success" in res) {
				sent = true
				successMessage = res.message || "Verification email sent. Check your new inbox."
			}
		} catch (err) {
			errorMessage = app.Helpers.errMsg(err) || "Failed to send verification email"
		} finally {
			sending = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Change Email</h1>
		<p class="muted-color text-small">Update the email address linked to your account</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		{#if successMessage}
			<div class="section margin-bottom-4">
				<div class="notice notice-success">
					<i class="fa-light fa-check-circle"></i>
					{successMessage}
				</div>
			</div>
		{/if}

		{#if errorMessage}
			<div class="section margin-bottom-4">
				<div class="notice notice-error">
					<i class="fa-light fa-exclamation-circle"></i>
					{errorMessage}
				</div>
			</div>
		{/if}

		<div class="section margin-bottom-4">
			<div class="details">
				<form on:submit|preventDefault={submit}>
					<Input id="currentEmail" label="Current email" value={currentEmail} disabled />

					{#if sent}
						<p class="muted-color text-small">
							A verification link has been sent to <strong>{newEmail}</strong>. Click the link in that email to confirm the change.
						</p>
					{:else}
						<Input id="newEmail" label="New email" type="email" bind:value={newEmail} placeholder="your-new-email@example.com" required />

						<div class="row middle-xxs gap-2 margin-top-1">
							<Button type="submit" disabled={sending || !newEmail} loading={sending}>
								{sending ? "Sending..." : "Send verification email"}
							</Button>
							<a href="/account/settings" class="muted-color text-small">Back to settings</a>
						</div>
					{/if}
				</form>
			</div>
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);

		form {
			display: flex;
			flex-direction: column;
			gap: calc(var(--gutter) * 1.5);
		}
	}

	.notice {
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 2);
		border-radius: var(--border-radius);
		font-size: var(--font-size-small);

		i {
			margin-right: calc(var(--gutter) * 0.75);
		}

		&-success {
			background-color: rgba(var(--color-success-rgb, 46, 204, 113), 0.12);
			color: var(--color-success, #2ecc71);
		}

		&-error {
			background-color: rgba(var(--color-danger-rgb, 231, 76, 60), 0.12);
			color: var(--color-danger, #e74c3c);
		}
	}
</style>
