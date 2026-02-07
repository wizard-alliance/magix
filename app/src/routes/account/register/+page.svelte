<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Checkbox from "$components/fields/checkbox.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import loginSplash from "$images/login-splash.png"

	let form = {
		email: "",
		username: "",
		password: "",
		confirmPassword: "",
		first_name: "",
		last_name: "",
		tos_accepted: false,
	}
	let loading = false
	let submitted = false

	onMount(() => {
		app.Config.pageTitle = "Register"
	})

	const submit = async () => {
		if (form.password !== form.confirmPassword) {
			return app.Notify.error("Passwords do not match")
		}
		if (!form.tos_accepted) {
			return app.Notify.error("Please accept the terms of service")
		}
		loading = true
		try {
			const { confirmPassword, ...payload } = form
			await app.Auth.register(payload)
			submitted = true
		} catch (error) {
			app.Notify.error((error as Error).message)
		} finally {
			loading = false
		}
	}
</script>

<div class="col-xxs-12 col-sm-12 col-md-6 col-lg-5 center-xxs auth-form-col scrollable">
	<div class="row center-xxs auth-form">
		<div class="col-xxs-12 margin-bottom-2">
			<h2>Create Account</h2>
		</div>

		{#if submitted}
			<div class="col-xxs-12 success-message">
				<i class="fas fa-envelope"></i>
				<p>Account created! Please check your email at <strong>{form.email}</strong> to activate your account.</p>
				<a href="/account/login" class="back-link">Go to login</a>
			</div>
		{:else}
			<form on:submit|preventDefault={submit} class="col-xxs-12">
				<div class="row">
					<div class="col-xxs-6">
						<Input label="First Name" placeholder="John" bind:value={form.first_name} />
					</div>
					<div class="col-xxs-6">
						<Input label="Last Name" placeholder="Doe" bind:value={form.last_name} />
					</div>
				</div>

				<Input label="Email" type="email" placeholder="your@email.com" bind:value={form.email} required />

				<Input label="Username" placeholder="Choose a username" bind:value={form.username} required />

				<Input label="Password" type="password" placeholder="Create a password" bind:value={form.password} required />

				<Input label="Confirm Password" type="password" placeholder="Confirm your password" bind:value={form.confirmPassword} required />

				<div class="margin-bottom-2">
					<Checkbox label="I accept the Terms of Service" bind:checked={form.tos_accepted} />
				</div>

				<Button type="submit" disabled={loading}>
					{#if loading}<Spinner size="sm" mode="light" />{:else}Create Account{/if}
				</Button>
			</form>

			<div class="col-xxs-12">
				<p class="hint">Already have an account? <a href="/account/login">Sign in</a></p>
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
		background: var(--bg-image), radial-gradient(ellipse at center, #d0e8ff, #9fcdff);
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
			color: var(--accent-color, #3b82f6);
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
