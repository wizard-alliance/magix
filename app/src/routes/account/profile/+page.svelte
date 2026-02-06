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
	})

	$: info = user || {}
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
	$: redactedEmail = info.email ? info.email.replace(/(.{2}).+(@.+)/, "$1***$2") : ""
</script>

<div class="page page-thin">
	{#if !user}
		<Spinner />
	{:else}
		<div class="section section-header row center-xs margin-bottom-4">
			<div class="col-xxs-12 margin-bottom-2">
				<Avatar name={fullName || info.username} size="lg" />
			</div>
			<div class="col-xxs-12 col-md-9 info-block">
				<h1>{fullName || info.username}</h1>
				<p class="muted-color text-small">{redactedEmail}</p>
			</div>
		</div>

		<div class="section row margin-bottom-4">
			<div class="col-xxs-12 col-md-11 col-lg-10 margin-bottom-2">
				<h2 class="title">Section title</h2>
				<p class="muted-color text-small">You can view and edit your personal information here.</p>
			</div>

			<div class="col-xxs-12 details">
				<div class="row">
					<div class="col-xxs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xxs start-xxs">
								<span class="detail-title">Phone</span>
								<span class="detail-subtitle muted-color text-small">Your phone number</span>
							</div>
							<div class="col-xxs end-xxs muted-color text-small">
								{info.phone}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xxs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xxs start-xxs">
								<span class="detail-title">Company</span>
								<span class="detail-subtitle muted-color text-small">Your company name</span>
							</div>
							<div class="col-xxs end-xxs muted-color text-small">
								{info.company}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xxs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xxs start-xxs">
								<span class="detail-title">Address</span>
								<span class="detail-subtitle muted-color text-small">Your address</span>
							</div>
							<div class="col-xxs end-xxs muted-color text-small">
								{info.address}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xxs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xxs start-xxs">
								<span class="detail-title">Member since</span>
								<span class="detail-subtitle muted-color text-small">Your registration date</span>
							</div>
							<div class="col-xxs end-xxs muted-color text-small">
								{new Date(info.created).toLocaleDateString()}
							</div>
						</div>
					</div>

					<div class="col-xxs-12 margin-top-2">
						<Button variant="secondary" size="sm" href="/account/settings">Edit your profile</Button>
					</div>
				</div>
			</div>
		</div>
	{/if}
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

			.detail-subtitle {
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
