<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"

	let loading = true
	let devices: any[] = []

	onMount(async () => {
		const data = await app.Auth.me(true).catch(() => null)
		devices = data?.devices ?? []
		loading = false
	})

	const logoutAllDevices = async () => {
		const confirmed = await app.Modal.confirm("Log out all devices?", "This will end all active sessions including this one. You will need to log in again.")
		if (!confirmed) return

		try {
			await app.Auth.logoutAllDevices()
			app.Notify.success("All sessions ended")
			goto("/auth/login")
		} catch (error) {
			app.Notify.error(`Error: ${(error as Error).message}`)
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Security</h1>
		<p class="muted-color text-small">Manage your active sessions and account security</p>
	</div>

	<div class="section margin-bottom-4">
		<div class="row middle-xs between-xs margin-bottom-2">
			<div class="col-xxs col-md">
				<h2 class="title"><i class="fa-light fa-devices"></i> Active Sessions</h2>
				<p class="muted-color text-small">Devices currently signed in to your account</p>
			</div>
			<div class="col">
				<Button variant="danger" size="sm" on:click={logoutAllDevices}>
					<i class="fa-light fa-right-from-bracket"></i> Log out all
				</Button>
			</div>
		</div>

		<div class="details">
			{#if loading}
				<div class="row center-xxs">
					<Spinner />
				</div>
			{:else if devices.length === 0}
				<div class="empty-state">
					<i class="fa-light fa-shield-check"></i>
					<p>No session data available</p>
					<span class="muted-color text-small">Device tracking information will appear here</span>
				</div>
			{:else}
				{#each devices as device, i}
					<div class="detail-row">
						<div class="detail-label">
							<span class="detail-title">
								<i class="fa-light fa-{device.userAgent?.toLowerCase().includes('mobile') ? 'mobile' : 'desktop'}"></i>
								{device.name || device.userAgent || "Unknown device"}
							</span>
							<span class="muted-color text-small">
								{device.ip || "Unknown IP"}
								{#if device.lastLogin}
									· Last active {new Date(device.lastLogin).toLocaleDateString()}
								{/if}
							</span>
						</div>
						<div class="detail-value">
							{#if device.current}
								<Badge text="Current" variant="success" />
							{/if}
						</div>
					</div>
					{#if i < devices.length - 1}<hr />{/if}
				{/each}
			{/if}
		</div>
	</div>

	<div class="section margin-bottom-4">
		<div class="row middle-xs margin-bottom-2">
			<div class="col-xxs">
				<h2 class="title"><i class="fa-light fa-lock"></i> Password</h2>
				<p class="muted-color text-small">Keep your account secure with a strong password</p>
			</div>
		</div>

		<div class="details">
			<div class="detail-row">
				<div class="detail-label">
					<span class="detail-title">Password</span>
					<span class="muted-color text-small">Last changed — unknown</span>
				</div>
				<div class="detail-value">
					<Button variant="secondary" size="sm" href="/account/settings/password">Change</Button>
				</div>
			</div>
		</div>
	</div>
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
	}

	.details hr {
		border: none;
		border-top: 1px solid var(--border-color);
		margin: calc(var(--gutter) * 2) 0;
		width: 100%;
	}

	.detail-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: calc(var(--gutter) * 2);
	}

	.detail-label {
		.detail-title {
			display: block;
			font-weight: 500;

			i {
				margin-right: calc(var(--gutter) * 0.5);
				opacity: 0.5;
			}
		}
	}

	.detail-value {
		flex-shrink: 0;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--gutter) * 0.75);
		padding: calc(var(--gutter) * 2) 0;
		text-align: center;

		> i {
			font-size: 2rem;
			opacity: 0.3;
		}

		> p {
			font-weight: 500;
			opacity: 0.6;
		}
	}
</style>
