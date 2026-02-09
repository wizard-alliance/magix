<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { UserVendorLink } from "$lib/types/types"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"

	const knownVendors = [
		{ key: "discord", name: "Discord", icon: "fa-brands fa-discord" },
		{ key: "google", name: "Google", icon: "fa-brands fa-google" },
	]

	let linked: UserVendorLink[] = []
	let loading = true
	let connecting = false
	let disconnecting: string | null = null

	$: linkedMap = new Map(linked.map((v) => [v.vendor, v]))

	const fetchVendors = async () => {
		try {
			linked = await app.Auth.listVendors()
		} catch (err) {
			app.UI.Notify.error(`Failed to load connections: ${(err as Error).message}`)
		}
	}

	onMount(async () => {
		await handleConnectCallback()
		await fetchVendors()
		loading = false
	})

	const handleConnectCallback = async () => {
		const params = new URLSearchParams(window.location.search)
		const connectToken = params.get("connect_token")?.trim()
		const vendor = params.get("vendor")?.trim()

		if (!connectToken || !vendor) return

		history.replaceState({}, "", window.location.pathname)
		connecting = true

		try {
			await app.Auth.connectVendor(vendor, connectToken)
			app.UI.Notify.success(`${vendor} connected successfully`)
		} catch (err) {
			app.UI.Notify.error(`Failed to connect ${vendor}: ${(err as Error).message}`)
		} finally {
			connecting = false
		}
	}

	const connect = (vendor: string) => {
		const returnUrl = window.location.href.split("?")[0]
		window.location.href = app.Auth.getVendorRedirectUrl(vendor, returnUrl, "connect")
	}

	const disconnect = async (vendor: string) => {
		const isLast = linked.length <= 1

		if (isLast) {
			const confirmed = await app.UI.Modal.confirm(
				"Disconnect last connection?",
				"This is your only connected account. After disconnecting, you'll only be able to log in with your email and password.",
			)
			if (!confirmed) return

			const enteredPassword = await app.UI.Modal.prompt("Enter your password", "Confirm your account password to proceed.", {
				inputType: "password",
				inputPlaceholder: "Your account password",
				confirmLabel: "Disconnect",
				confirmVariant: "danger",
				icon: "fa-lock",
			})
			if (!enteredPassword) return

			disconnecting = vendor
			try {
				await app.Auth.disconnectVendor(vendor, enteredPassword)
				app.UI.Notify.success(`${vendor} disconnected`)
				await fetchVendors()
			} catch (err) {
				app.UI.Notify.error(`Failed to disconnect: ${(err as Error).message}`)
			} finally {
				disconnecting = null
			}
			return
		}

		const confirmed = await app.UI.Modal.confirm(`Disconnect ${vendor}?`, `You will no longer be able to log in with this ${vendor} account.`)
		if (!confirmed) return

		disconnecting = vendor
		try {
			await app.Auth.disconnectVendor(vendor)
			app.UI.Notify.success(`${vendor} disconnected`)
			await fetchVendors()
		} catch (err) {
			app.UI.Notify.error(`Failed to disconnect: ${(err as Error).message}`)
		} finally {
			disconnecting = null
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-link"></i> Connected Accounts</h1>
		<p class="muted-color text-small">Link third-party accounts for quick sign-in</p>
	</div>

	{#if loading || connecting}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section margin-bottom-4">
			<div class="details">
				{#each knownVendors as vendor, i}
					{@const link = linkedMap.get(vendor.key)}

					{#if i > 0}<hr />{/if}

					<div class="vendor-row">
						<div class="vendor-info">
							<div class="vendor-identity">
								<i class="{vendor.icon} vendor-icon"></i>
								<div>
									<span class="vendor-name">{vendor.name}</span>
									{#if link}
										<span class="vendor-detail muted-color text-small">
											{link.vendorEmail || link.vendorUsername || link.vendorUserId}
										</span>
									{/if}
								</div>
							</div>
							<Badge text={link ? "Connected" : "Not connected"} variant={link ? "success" : "default"} />
						</div>

						<div class="vendor-action">
							{#if link}
								<Button variant="danger" size="sm" on:click={() => disconnect(vendor.key)} loading={disconnecting === vendor.key}>
									<i class="fa-light fa-unlink"></i> Disconnect
								</Button>
							{:else}
								<Button variant="secondary" size="sm" on:click={() => connect(vendor.key)}>
									<i class="fa-light fa-link"></i> Connect
								</Button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;

		i {
			margin-right: calc(var(--gutter) * 0.75);
			opacity: 0.6;
		}
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);

		hr {
			border: none;
			border-top: 1px solid var(--border-color);
			margin: calc(var(--gutter) * 2) 0;
		}
	}

	.vendor-row {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 1.5);
	}

	.vendor-info {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--gutter);
	}

	.vendor-identity {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1.5);

		div {
			display: flex;
			flex-direction: column;
		}
	}

	.vendor-icon {
		font-size: 1.5rem;
		width: 2rem;
		text-align: center;
		opacity: 0.7;
	}

	.vendor-name {
		font-weight: 500;
	}

	.vendor-detail {
		margin-top: 2px;
	}

	.vendor-action {
		display: flex;
		justify-content: flex-end;
	}
</style>
