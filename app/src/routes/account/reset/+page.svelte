<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import loginSplash from "$images/login-splash.png"

	let email = ""
	let newPassword = ""
	let confirmPassword = ""
	let submitted = false
	let resetComplete = false
	let loading = false
	let step: "request" | "confirm" = "request"
	let token = ""

	onMount(() => {
		app.Config.pageTitle = "Reset Password"
		// app.UI.sidebarSetWidth(1, 0)
		// app.UI.sidebarSetWidth(2, 0)

		// Check for reset token in URL (step 2)
		const params = new URLSearchParams(window.location.search)
		const urlToken = params.get("token")
		if (urlToken) {
			token = urlToken
			step = "confirm"
			history.replaceState({}, "", window.location.pathname)
		}
	})

	const requestReset = async () => {
		loading = true
		try {
			await app.Auth.requestPasswordReset(email)
			submitted = true
		} catch (error) {
			app.Notify.error((error as Error).message)
		} finally {
			loading = false
		}
	}

	const confirmReset = async () => {
		if (newPassword !== confirmPassword) {
			return app.Notify.error("Passwords do not match")
		}
		loading = true
		try {
			await app.Auth.confirmPasswordReset(token, newPassword)
			resetComplete = true
		} catch (error) {
			app.Notify.error((error as Error).message)
		} finally {
			loading = false
		}
	}
</script>

<div class="col-xxs-12 col-sm-12 col-md-6 col-lg-5 center-xs auth-form-col scrollable">
	<div class="row center-xs auth-form">
		<div class="col-xxs-12 margin-bottom-2">
			<h2>{step === "request" ? "Reset Password" : resetComplete ? "Password Reset" : "Set New Password"}</h2>
		</div>

		{#if submitted}
			<div class="col-xxs-12 success-message">
				<i class="fas fa-envelope"></i>
				<p>If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.</p>
				<a href="/account/login" class="back-link">Back to login</a>
			</div>
		{:else if resetComplete}
			<div class="col-xxs-12 success-message">
				<i class="fas fa-check-circle"></i>
				<p>Your password has been reset successfully.</p>
				<a href="/account/login" class="back-link">Sign in with your new password</a>
			</div>
		{:else if step === "request"}
			<p class="col-xxs-12 hint margin-bottom-2">Enter your email and we'll send you a link to reset your password.</p>

			<form on:submit|preventDefault={requestReset} class="col-xxs-12">
				<Input label="Email" type="email" placeholder="your@email.com" bind:value={email} required />

				<Button type="submit" disabled={loading}>
					{#if loading}<Spinner size="sm" mode="light" />{:else}Send Reset Link{/if}
				</Button>
			</form>

			<div class="col-xxs-12">
				<p class="hint">Remember your password? <a href="/account/login">Sign in</a></p>
			</div>
		{:else}
			<p class="col-xxs-12 hint margin-bottom-2">Enter your new password below.</p>

			<form on:submit|preventDefault={confirmReset} class="col-xxs-12">
				<Input label="New Password" type="password" placeholder="Enter new password" bind:value={newPassword} required />

				<Input label="Confirm Password" type="password" placeholder="Confirm new password" bind:value={confirmPassword} required />

				<Button type="submit" disabled={loading}>
					{#if loading}<Spinner size="sm" mode="light" />{:else}Reset Password{/if}
				</Button>
			</form>

			<div class="col-xxs-12">
				<p class="hint"><a href="/account/login">Back to login</a></p>
			</div>
		{/if}
	</div>
</div>

<div class="col-xxs hidden-xs visible-md auth-side" style:--bg-image="url({loginSplash})"></div>

<style lang="scss" scoped>
	.auth-form-col {
		padding: calc(var(--gutter) * 2) calc(var(--gutter) * 8);
		margin-left: auto;
		margin-right: auto;
		display: flex;
		height: 100%;
		flex-direction: row;
		flex-wrap: wrap;
		align-content: center;
		justify-content: center;
		align-items: center;
		& > div {
			max-width: 360px;
		}
	}

	.auth-form {
		display: flex;
		gap: calc(var(--gutter) * 1.5);
	}

	.auth-form form {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.auth-side {
		background: var(--bg-image), radial-gradient(ellipse at center, #d0ffd8, #9febb9);
		background-size: contain, cover;
		background-position: center;
		background-repeat: no-repeat;
		height: 100%;
		background-size:
			clamp(300px, 70%, 500px) auto,
			cover;
	}

	.hint {
		color: var(--gray);
		font-size: var(--font-size-small);
		user-select: none;
	}

	.success-message {
		text-align: center;
		padding: calc(var(--gutter) * 2);
		background: var(--secondary-color);
		border-radius: var(--border-radius);

		i {
			font-size: 48px;
			color: var(--success-color, #22c55e);
			margin-bottom: var(--gutter);
		}

		p {
			color: var(--gray);
			margin-bottom: var(--gutter);
		}

		strong {
			color: var(--white);
		}
	}

	.back-link {
		color: var(--accent-color);
		font-size: var(--font-size-small);
	}
</style>
