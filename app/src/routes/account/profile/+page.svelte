<script lang="ts">
	export let data: any

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let user: any = null

	onMount(async () => {
		// app.Config.pageTitle = "Profile"
		const data = await app.Auth.me().catch(() => null)
		user = data?.info
		console.log("User info:", data)
	})

	$: info = user || {}
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
	$: redactedEmail = info.email ? info.email.replace(/(.{2}).+(@.+)/, "$1***$2") : ""
</script>

<div class="page page-thin">
	<div class="section section-header row center-xxs margin-bottom-4">
		<div class="col-xxs-12 margin-bottom-2">
			<Avatar name={fullName || info.username} size="lg" />
		</div>
		<div class="col-xxs-12 col-md-9 info-block">
			<h1>{fullName || info.username}</h1>
			<p class="muted-color text-small">{redactedEmail}</p>
		</div>
	</div>

	<div class="section row middle-xs between-xs margin-bottom-4">
		<div class="col-xxs-12 col-md margin-bottom-2">
			<h2 class="title">Section title</h2>
			<p class="muted-color text-small">Your account information</p>
		</div>

		<div class="col margin-bottom-2">
			<Button variant="secondary" size="sm" href="/account/settings" data-tip="Edit profile">
				<i class="fa-light fa-pen"></i>
			</Button>
		</div>

		<div class="col-xxs-12 details">
			<div class="row">
				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Name</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your legal name</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{info.firstName} {info.lastName}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>

				<hr />

				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Username</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your username</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{info.username}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>

				<hr />

				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Phone</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your phone number</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{info.phone}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>

				<hr />

				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Company</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your company name</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{info.company}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>

				<hr />

				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Address</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your address</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{info.address}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>

				<hr />

				<div class="col-xxs-12">
					<div class="row center-xxs middle-xs">
						<div class="col-xxs start-xxs">
							<span class="detail-title">Member since</span>
							<span class="text-ignore detail-subtitle muted-color text-small">Your registration date</span>
						</div>
						<div class="col-xxs end-xxs muted-color text-small">
							{#if user}{new Date(info.created).toLocaleDateString()}{:else}<Spinner size="sm" />{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style lang="scss" scoped>
	.section {
		.title {
			font-size: var(--font-size-large);
			font-weight: 600;
		}

		.details {
			background-color: rgba(255, 255, 255, 0.04);
			border-radius: var(--border-radius);
			padding: calc(var(--gutter) * 2.5) calc(var(--gutter) * 2.5);

			.detail-title {
				display: block;
				font-weight: 500;
			}

			.text-ignore detail-subtitle {
				display: block;
			}
		}

		.details hr {
			border: none;
			border-top: 1px solid var(--border-color);
			margin: calc(var(--gutter) * 2) 0;
			width: 100%;
		}
	}
</style>
