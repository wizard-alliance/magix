<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import type { UserFull } from "$lib/types/types"
	import { userSettingsConfig, categoryLabels, getUserSetting, getSettingsByCategory, type UserSettingCategory } from "$configs/userSettings"
	import Button from "$components/fields/button.svelte"
	import Select from "$components/fields/select.svelte"
	import Toggle from "$components/fields/toggle.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let userData: UserFull | null = null
	let values: Record<string, string> = {}
	let toggles: Record<string, boolean> = {}
	let loading = false
	let saving = false

	const categories: UserSettingCategory[] = ["regional", "notifications", "appearance", "advanced"]

	const quickLinks = [
		{ href: "/account/settings/details", icon: "fa-light fa-file-signature", label: "Details" },
		{ href: "/account/settings/avatar", icon: "fa-light fa-image", label: "Avatar" },
		{ href: "/account/settings/password", icon: "fa-light fa-lock", label: "Password" },
		{ href: "/account/settings/billing", icon: "fa-light fa-credit-card", label: "Billing" },
	]

	$: currentPath = $page.url.pathname

	onMount(async () => {
		loading = true
		userData = await app.Auth.me().catch(() => null)
		for (const def of userSettingsConfig) {
			const val = getUserSetting(userData?.settings, def.key)
			values[def.key] = val
			if (def.type === "toggle") toggles[def.key] = val === "1"
		}
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			// Sync toggles back to values
			for (const def of userSettingsConfig) {
				if (def.type === "toggle") values[def.key] = toggles[def.key] ? "1" : "0"
			}
			await app.Account.Settings.save(values)
			app.Notify.success("Preferences saved")
		} catch (err) {
			app.Notify.error(`Failed to save preferences: ${(err as Error).message}`)
		} finally {
			saving = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Preferences</h1>
		<p class="muted-color text-small">Customize your experience</p>
	</div>

	<div class="section quick-links margin-bottom-4">
		{#each quickLinks as link}
			<Button variant="secondary" size="sm" href={link.href} active={currentPath === link.href || currentPath.startsWith(link.href + "/")}>
				<i class={link.icon}></i>
				<span>{link.label}</span>
			</Button>
		{/each}
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		{#each categories as cat}
			{@const meta = categoryLabels[cat]}
			{@const items = getSettingsByCategory(cat)}
			<div class="section margin-bottom-4">
				<div class="row middle-xs margin-bottom-2">
					<div class="col-xxs">
						<h2 class="title"><i class={meta.icon}></i> {meta.title}</h2>
						<p class="muted-color text-small">{meta.description}</p>
					</div>
				</div>

				<div class="details">
					{#each items as def, i}
						<div class="detail-row">
							<div class="detail-label">
								<span class="detail-title">{def.label}</span>
								<span class="muted-color text-small">{def.description}</span>
							</div>
							<div class="detail-value">
								{#if def.type === "toggle"}
									<Toggle bind:checked={toggles[def.key]} />
								{:else if def.type === "select"}
									<Select bind:value={values[def.key]} options={def.options ?? []} />
								{/if}
							</div>
						</div>
						{#if i < items.length - 1}<hr />{/if}
					{/each}
				</div>
			</div>
		{/each}

		<div class="section">
			<div class="actions">
				<Button on:click={save} loading={saving} disabled={saving}>
					{saving ? "Saving..." : "Save preferences"}
				</Button>
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

	.quick-links {
		display: flex;
		gap: calc(var(--gutter) * 1.5);
		flex-wrap: wrap;
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
		}
	}

	.detail-value {
		flex-shrink: 0;
		min-width: 140px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}
</style>
