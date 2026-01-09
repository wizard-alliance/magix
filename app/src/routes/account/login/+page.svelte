<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Checkbox from "$components/fields/checkbox.svelte"
	import Button from "$components/button.svelte"
	import loginSplash from "$images/login-splash.png"

	let form = { identifier: "", password: "", remember: false }
	let loading = false

	onMount(() => {
		app.Config.pageTitle = "Login"
		app.UI.sidebarSetWidth(1, 0)
		app.UI.sidebarSetWidth(2, 0)
		verifyLogin()
	})

	const submit = async () => {
		loading = true
		try {
			await app.Auth.login(form)
			goto("/")
		} catch (error) {
			app.Notify.error((error as Error).message)
		} finally {
			loading = false
		}
	}

	const vendorLogin = (vendor: string) => {
		app.Notify.info(`Connecting to ${vendor} ...`, "Please wait")
		if (vendor.toLocaleLowerCase() === "discord") {
			setTimeout(() => {
				const returnUrl = encodeURIComponent(window.location.href)
				const loginUrl = `${app.Config.apiBaseUrl}/account/auth/vendor/discord/redirect?returnUrl=${returnUrl}`
				console.log("Redirecting to:", loginUrl)
				window.location.href = loginUrl
			}, 600)
		}
	}

	const verifyLogin = async () => {
		// Get URL Params
		const params = new URLSearchParams(window.location.search)
		const tokens = {
			access: {
				token: (params.get("access_token") ?? "").trim(),
				expires: (params.get("access_expires") ?? "").trim(),
			},
			refresh: {
				token: (params.get("refresh_token") ?? "").trim(),
				expires: (params.get("refresh_expires") ?? "").trim(),
			},
		}

		const error = (params.get("error") ?? "").trim()

		if (error) {
			app.Notify.error(`Login failed: ${error}`, "Error", 60)
		} else if (tokens.access.token && tokens.refresh.token) {
			// const status = await app.Auth.verifyRefreshToken(tokens.refresh.token, tokens.access.token)
			// if (status.success) {
			// }
			// else {

			// }

			app.Notify.success("Login successful!", "Success", 10)
			history.replaceState({}, "", window.location.pathname)
			// goto("/account/profile")
		}
	}
</script>

<div class="col-xs-12 col-sm-12 col-md-6 col-lg-5 center-xs auth-form-col">
	<div class="row center-xs auth-form">
		<div class="col-xs-12 margin-bottom-2">
			<h2>Welcome!</h2>
		</div>

		<div class="col-xs-12 margin-bottom-2">
			<Button color="secondary" on:click={() => vendorLogin(`discord`)} icon="fab fa-discord">Log in with Discord</Button>
		</div>

		<div class="col-xs-12 divider margin-bottom-2"><span>Or Login with Email ^_^</span></div>

		<form on:submit|preventDefault={submit} class="col-xs-12">
			<Input label="Username" placeholder="Type your username" bind:value={form.identifier} required />

			<Input label="Password" type="password" placeholder="Password" bind:value={form.password} required />

			<div class="row between-xs middle-xs margin-bottom-2">
				<div class="col-xs-6 start-xs">
					<Checkbox label="Keep me logged in" bind:checked={form.remember} />
				</div>
				<div class="col-xs end-xs">
					<a href="/account/reset" class="link-muted">Forget your password?</a>
				</div>
			</div>

			<Button type="submit" color="primary" disabled={loading}>Login</Button>
		</form>

		<div class="col-xs-12">
			<p class="hint">Haven't sign up yet? <a href="/account/create">Sign up</a></p>
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

	.divider {
		display: flex;
		align-items: center;
		gap: var(--gutter);
		color: var(--gray);
		font-size: 13px;
	}

	.divider::before,
	.divider::after {
		content: "";
		flex: 1;
		height: 1px;
		background: var(--tertiary-color);
	}

	.auth-side {
		background: var(--bg-image), radial-gradient(ellipse at center, #fff7d0, #ffee9f);
		background-size: contain, cover;
		background-position: center;
		background-repeat: no-repeat;
		height: 100%;
		background-size:
			clamp(300px, 70%, 500px) auto,
			cover;
	}

	.link-muted {
		color: var(--gray);
		font-size: 13px;
	}

	.hint {
		color: var(--gray);
		font-size: 13px;
		user-select: none;
	}
</style>
