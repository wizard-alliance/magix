<script lang="ts">
	export let data: any

	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let user: any = null

	onMount(async () => {
		app.Config.pageTitle = "Profile"
		const data = await app.Auth.me().catch(() => null)
		user = data?.info
	})

	$: info = user || {}
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
</script>

<div class="page page-thin">
	{#if !user}
		<Spinner />
	{:else}
		<div class="section section-header row center-xs margin-bottom-4">
			<div class="col-xs-12">
				<Avatar name={fullName || info.username} size="lg" />
			</div>
			<div class="col-xs-12 col-md-9 info-block">
				<h1>{fullName || info.username}</h1>
				<p class="text-muted">{info.email}</p>
			</div>
		</div>

		<div class="section row margin-bottom-4">
			<div class="col-xs-12 col-md-11 col-lg-10 margin-bottom-2">
				<h2 class="title">Section title</h2>
				<p class="text-muted">You can view and edit your personal information here.</p>
			</div>

			<div class="col-xs-12 details">
				<div class="row">
					<div class="col-xs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xs start-xs">
								<span class="detail-title">Phone</span>
								<span class="detail-subtitle text-muted">Your phone number</span>
							</div>
							<div class="col-xs end-xs text-muted">
								{info.phone}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xs start-xs">
								<span class="detail-title">Company</span>
								<span class="detail-subtitle text-muted">Your company name</span>
							</div>
							<div class="col-xs end-xs text-muted">
								{info.company}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xs start-xs">
								<span class="detail-title">Address</span>
								<span class="detail-subtitle text-muted">Your address</span>
							</div>
							<div class="col-xs end-xs text-muted">
								{info.address}
							</div>
						</div>
					</div>

					<hr />

					<div class="col-xs-12">
						<div class="row center-xs middle-xs">
							<div class="col-xs start-xs">
								<span class="detail-title">Member since</span>
								<span class="detail-subtitle text-muted">Your registration date</span>
							</div>
							<div class="col-xs end-xs text-muted">
								{new Date(info.created).toLocaleDateString()}
							</div>
						</div>
					</div>

					<div class="col-xs-12 margin-top-2">
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
			font-size: 17px;
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
				font-size: 14px;
				color: var(--text-muted);
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
