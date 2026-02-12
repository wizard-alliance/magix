<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let user: any = null

	onMount(async () => {
		const data = await app.Auth.me().catch(() => null)
		user = data?.info
		console.log("User info:", data)
	})

	$: info = user || {}
	$: fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
	$: avatarResolved = info.avatar ? app.Account.Avatar.resolve(info.avatar, 128) : null
	$: avatarSrc = avatarResolved?.src || (info.avatarUrl ? (app.Account.Avatar.url(info.avatarUrl) ?? "") : "")
	$: avatarSrcset = avatarResolved?.srcset || ""
	$: redactedEmail = info.email ? info.email.replace(/(.{2}).+(@.+)/, "$1***$2") : ""

	// Detail rows rendered via {#each} — add, remove, or reorder entries here
	$: fields = [
		{ title: `Name`, subtitle: `Your legal name`, value: `${info.firstName} ${info.lastName}` },
		{ title: `Email`, subtitle: `Your email address`, value: redactedEmail },
		{ title: `Username`, subtitle: `Your username`, value: info.username },
		{ title: `Phone`, subtitle: `Your phone number`, value: info.phone },
		{ title: `Company`, subtitle: `Your company name`, value: info.company },
		{ title: `Address`, subtitle: `Your address`, value: info.address },
		{ title: `Member since`, subtitle: `Your registration date`, value: user ? app.Format.Date.format(info.created) : `` },
	]
</script>

<div class="page page-thin">
	<div class="section section-header row center-xxs margin-bottom-4">
		<div class="col-xxs-12 margin-bottom-2">
			<Avatar name={fullName || info.username} src={avatarSrc} srcset={avatarSrcset} size="lg" />
		</div>
		<div class="col-xxs-12 col-md-9 info-block">
			<h1>{fullName || info.username}</h1>
			<p class="muted-color text-small">{redactedEmail}</p>
		</div>
	</div>

	<div class="section row middle-xs between-xs margin-bottom-4">
		<div class="col-xxs-12 col-md margin-bottom-2">
			<h2 class="title">Personal Information</h2>
			<p class="muted-color text-small">Your account information</p>
		</div>

		<div class="col margin-bottom-2">
			<Button variant="secondary" href="/account/settings/details" data-tip="Edit profile">
				<i class="fa-light fa-pen"></i>
			</Button>
		</div>

		<div class="col-xxs-12 details">
			<div class="row">
				{#each fields as field, i}
					<div class="col-xxs-12">
						<div class="row center-xxs middle-xs">
							<div class="col-xxs start-xxs">
								<span class="detail-title">{field.title}</span>
								<span class="text-ignore detail-subtitle muted-color text-small">{field.subtitle}</span>
							</div>
							<div class="col-xxs end-xxs muted-color text-small">
								{#if user}{field.value}{:else}<Spinner />{/if}
							</div>
						</div>
					</div>
					{#if i < fields.length - 1}<hr />{/if}
				{/each}
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
