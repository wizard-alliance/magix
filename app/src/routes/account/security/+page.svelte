<script lang="ts">
	import { app } from "$lib/app"
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Tooltip from "$components/modules/tooltip.svelte"
	import type { UserDevice, UserFull } from "$lib/types/types"

	const STALE_DAYS = 90
	const STALE_MS = STALE_DAYS * 24 * 60 * 60 * 1000

	let loading = true
	let devices: UserDevice[] = []
	let user: UserFull | null = null

	$: healthIssues = getHealthIssues(user, devices)
	$: sortedDevices = [...devices].sort((a, b) => {
		if (a.current && !b.current) return -1
		if (!a.current && b.current) return 1
		return new Date(b.lastLogin ?? 0).getTime() - new Date(a.lastLogin ?? 0).getTime()
	})

	onMount(async () => {
		await loadDevices()
	})

	async function loadDevices() {
		loading = true
		const data = await app.Auth.me(true).catch(() => null)
		user = data
		devices = data?.devices ?? []
		loading = false
	}

	function getHealthIssues(u: UserFull | null, devs: UserDevice[]) {
		if (!u) return []
		const issues: { text: string; variant: "danger" | "warning" | "default" }[] = []

		if (u.info.disabled) issues.push({ text: "Account Disabled", variant: "danger" })
		if (!u.info.activated) issues.push({ text: "Email Not Verified", variant: "warning" })
		if (!u.info.tosAccepted) issues.push({ text: "TOS Not Accepted", variant: "warning" })
		if (u.info.pendingEmail) issues.push({ text: "Email Change Pending", variant: "default" })

		const hasStale = devs.some((d) => d.lastLogin && Date.now() - new Date(d.lastLogin).getTime() > STALE_MS)
		if (hasStale) issues.push({ text: "Stale Device Sessions", variant: "warning" })

		return issues
	}

	function isActive(device: UserDevice) {
		return device.sessions?.some((s) => s.valid) ?? false
	}

	function isStale(device: UserDevice) {
		return device.lastLogin && Date.now() - new Date(device.lastLogin).getTime() > STALE_MS
	}

	function deviceIcon(device: UserDevice) {
		const ua = (device.userAgent ?? "").toLowerCase()
		if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "mobile"
		return "desktop"
	}

	function deviceDisplayName(device: UserDevice) {
		return device.customName || device.name || device.userAgent || "Unknown device"
	}

	const logoutAllDevices = async () => {
		const confirmed = await app.UI.Modal.confirm("Log out all devices?", "This will end all active sessions including this one. You will need to log in again.")
		if (!confirmed) return
		try {
			await app.Auth.logoutAllDevices()
			app.UI.Notify.success("All sessions ended")
			goto("/auth/login")
		} catch (error) {
			app.UI.Notify.error(`Error: ${app.Helpers.errMsg(error)}`)
		}
	}

	const logoutDevice = async (device: UserDevice) => {
		const label = device.current ? "Log out this device?" : `Log out "${deviceDisplayName(device)}"?`
		const message = device.current ? "This will end your current session. You will need to log in again." : "This will revoke all sessions on that device."
		const confirmed = await app.UI.Modal.confirm(label, message)
		if (!confirmed) return
		try {
			await app.Auth.logoutDevice(device.id)
			if (device.current) {
				app.Auth.logoutAllDevices()
				app.UI.Notify.success("Session ended")
				goto("/auth/login")
			} else {
				app.UI.Notify.success("Device logged out")
				await loadDevices()
			}
		} catch (error) {
			app.UI.Notify.error(`Error: ${app.Helpers.errMsg(error)}`)
		}
	}

	const renameDevice = async (device: UserDevice) => {
		const name = await app.UI.Modal.prompt("Name this device", "Enter a custom name for this device", {
			inputPlaceholder: deviceDisplayName(device),
		})
		if (!name) return
		try {
			await app.Auth.renameDevice(device.id, name)
			app.UI.Notify.success("Device renamed")
			await loadDevices()
		} catch (error) {
			app.UI.Notify.error(`Error: ${app.Helpers.errMsg(error)}`)
		}
	}

	const deleteDevice = async (device: UserDevice) => {
		const label = device.current ? "Delete this device?" : `Delete "${deviceDisplayName(device)}"?`
		const message = device.current
			? "This will revoke all sessions and remove this device. You will need to log in again."
			: "This will revoke all sessions and permanently remove the device record."
		const confirmed = await app.UI.Modal.confirm(label, message)
		if (!confirmed) return
		try {
			await app.Auth.deleteDevice(device.id)
			if (device.current) {
				app.Auth.logoutAllDevices()
				app.UI.Notify.success("Device deleted")
				goto("/auth/login")
			} else {
				app.UI.Notify.success("Device deleted")
				await loadDevices()
			}
		} catch (error) {
			app.UI.Notify.error(`Error: ${app.Helpers.errMsg(error)}`)
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Security</h1>
		<p class="muted-color text-small">Manage your active sessions and account security</p>
	</div>

	<!-- Account Health -->
	<div class="section margin-bottom-4">
		<h2 class="title margin-bottom-2">
			<i class="fa-light fa-heart-pulse"></i>
			<span>Account Health</span>
		</h2>
		<div class="health-badges">
			{#if !loading && user}
				{#if healthIssues.length === 0}
					<Badge text="Account Healthy" variant="success" />
				{:else}
					{#each healthIssues as issue}
						<Badge text={issue.text} variant={issue.variant} />
					{/each}
				{/if}
			{:else}
				<Spinner />
			{/if}
		</div>
	</div>

	<!-- Active Sessions -->
	<div class="section margin-bottom-4">
		<div class="row middle-xxs between-xxs margin-bottom-2">
			<div class="col-xxs col-md-5">
				<h2 class="title">
					<i class="fa-light fa-computer"></i>
					<span>My devices</span>
				</h2>
				<p class="muted-color text-small">Devices currently signed in to your account</p>
			</div>
			<div class="col-xxs end">
				<Tooltip text="End all active sessions" position="left">
					<Button variant="danger" size="sm" on:click={logoutAllDevices}>
						<i class="fa-light fa-right-from-bracket"></i>
					</Button>
				</Tooltip>
			</div>
		</div>

		<div class="details">
			{#if loading}
				<div class="row center-xxs">
					<Spinner />
				</div>
			{:else if sortedDevices.length === 0}
				<div class="empty-state">
					<i class="fa-light fa-shield-check"></i>
					<p>No session data available</p>
					<span class="muted-color text-small">Device tracking information will appear here</span>
				</div>
			{:else}
				{#each sortedDevices as device, i}
					<div class="detail-row" class:stale={isStale(device)} class:logged-out={!isActive(device)}>
						<div class="detail-label">
							<span class="detail-title">
								<i class="fa-light fa-{deviceIcon(device)}"></i>
								{deviceDisplayName(device)}
							</span>
							<span class="muted-color text-small">
								{device.ip || "Unknown IP"}
								{#if device.lastLogin}
									· Last active {app.Format.Date.format(device.lastLogin)}
								{/if}
							</span>
						</div>
						<div class="detail-actions">
							{#if device.current}
								<Badge text="Current" variant="success" />
							{:else if isActive(device)}
								<Badge text="Active" variant="success" />
							{:else}
								<Badge text="Logged Out" variant="danger" />
							{/if}
							{#if isStale(device)}
								<Badge text="Stale" variant="warning" />
							{/if}
							<Tooltip text="Rename device" position="top">
								<button class="icon-btn" aria-label="Rename device" on:click={() => renameDevice(device)}>
									<i class="fa-light fa-pen"></i>
								</button>
							</Tooltip>
							{#if isActive(device)}
								<Tooltip text="Log out device" position="top">
									<button class="icon-btn" aria-label="Log out device" on:click={() => logoutDevice(device)}>
										<i class="fa-light fa-right-from-bracket"></i>
									</button>
								</Tooltip>
							{/if}
							<Tooltip text="Delete device" position="top">
								<button class="icon-btn icon-btn-danger" aria-label="Delete device" on:click={() => deleteDevice(device)}>
									<i class="fa-light fa-trash"></i>
								</button>
							</Tooltip>
						</div>
					</div>
					{#if i < sortedDevices.length - 1}<hr />{/if}
				{/each}
			{/if}
		</div>
	</div>

	<!-- Password -->
	<div class="section margin-bottom-4">
		<div class="row middle-xxs margin-bottom-2">
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
				<div class="detail-actions">
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

	.health-badges {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gutter) * 0.75);
		margin-top: calc(var(--gutter) * 0.5);
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

		&.stale {
			opacity: 0.55;
		}

		&.logged-out {
			opacity: 0.45;
		}
	}

	.detail-label {
		min-width: 0;
		overflow: hidden;

		.detail-title {
			display: block;
			font-weight: 500;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;

			i {
				margin-right: calc(var(--gutter) * 0.5);
				opacity: 0.5;
			}
		}
	}

	.detail-actions {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 0.75);
	}

	.icon-btn {
		background: none;
		border: none;
		color: inherit;
		opacity: 0.4;
		cursor: pointer;
		padding: calc(var(--gutter) * 0.5);
		border-radius: var(--border-radius);
		transition:
			opacity 0.15s,
			background-color 0.15s;
		font-size: var(--font-size);

		&:hover {
			opacity: 1;
			background-color: rgba(255, 255, 255, 0.06);
		}

		&.icon-btn-danger:hover {
			color: var(--danger-color);
		}
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
