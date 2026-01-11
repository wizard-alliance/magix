<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Checkbox from "$components/fields/checkbox.svelte"
	import Button from "$components/button.svelte"
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

	onMount(() => {
		app.Config.pageTitle = "Register"
		app.UI.sidebarSetWidth(1, 0)
		app.UI.sidebarSetWidth(2, 0)
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
			app.Notify.success("Account created!", "Welcome", 5)
			goto("/")
		} catch (error) {
			app.Notify.error((error as Error).message)
		} finally {
			loading = false
		}
	}
</script>

<div class="col-xs-12 col-sm-12 col-md-6 col-lg-5 center-xs auth-form-col">
	<div class="row center-xs auth-form">
		<div class="col-xs-12 margin-bottom-2">
			<h2>Create Account</h2>
		</div>

		<form on:submit|preventDefault={submit} class="col-xs-12">
			<div class="row">
				<div class="col-xs-6">
					<Input label="First Name" placeholder="John" bind:value={form.first_name} />
				</div>
				<div class="col-xs-6">
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

			<Button type="submit" color="primary" disabled={loading} icon={loading ? "fas fa-spinner fa-spin" : ""}>
				{loading ? "Creating account..." : "Create Account"}
			</Button>
		</form>

		<div class="col-xs-12">
			<p class="hint">Already have an account? <a href="/account/login">Sign in</a></p>
		</div>
	</div>
</div>

<div class="col-xs hidden-xs visible-md auth-side" style:--bg-image="url({loginSplash})"></div>

<style lang="scss" scoped>
	.auth-form-col {
		padding: calc(var(--gutter) * 2) calc(var(--gutter) * 8);
		margin-left: auto;
		margin-right: auto;
		display: flex;
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
		flex-direction: column;
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
		font-size: 13px;
		user-select: none;
	}
</style>
