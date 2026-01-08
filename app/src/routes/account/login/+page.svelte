<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Input from "$components/fields/input.svelte"
	import Checkbox from "$components/fields/checkbox.svelte"
	import Button from "$components/button.svelte"
	import loginSplash from "$images/login-splash.png"

	let form = { identifier: "", password: "", remember: false }
	let status = ""
	let loading = false

	onMount(() => {
		app.Config.pageTitle = "Login"
		app.UI.sidebarSetWidth(1, 0)
		app.UI.sidebarSetWidth(2, 0)
	})

	const submit = async () => {
		loading = true
		status = ""
		try {
			await app.Auth.login(form)
			goto("/")
		} catch (error) {
			status = `${(error as Error).message}`
		} finally {
			loading = false
		}
	}

	const vendorLogin = (vendor: string) => {
		status = `Connecting to ${vendor}...`
	}
</script>

<div class="col-xs-12 col-sm-12 col-md-6 col-lg-5 center-xs auth-form-col">
	<div class="row center-xs auth-form">
		<div class="col-xs-12 margin-bottom-2">
			<h2>Welcome!</h2>
		</div>

		{#if status}
			<div class="col-xs-12">
				<p class="status">{status}</p>
			</div>
		{/if}

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
	// :global(.page-account-login) {
	// 	--sidebar-1-width: 0px;
	// 	--sidebar-2-width: 0px;
	// }

	// :global(.sidebar) {
	// 	border-color: transparent;
	// }

	/* login styling */
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

	.status {
		color: var(--red);
		font-size: 13px;
	}

	.hint {
		color: var(--gray);
		font-size: 13px;
		user-select: none;
	}
</style>
