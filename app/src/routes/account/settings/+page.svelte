<script lang="ts">
	import { app } from "$lib/app"
	import { page } from "$app/stores"
	import { onMount } from "svelte"
	import dayjs from "dayjs"
	import utc from "dayjs/plugin/utc"
	import timezone from "dayjs/plugin/timezone"
	import type { UserFull } from "$lib/types/types"
	import { userSettingsConfig, categoryLabels, getUserSetting, getSettingsByCategory, type UserSettingCategory } from "$configs/userSettings"
	import Button from "$components/fields/button.svelte"
	import Select from "$components/fields/select.svelte"
	import Toggle from "$components/fields/toggle.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	dayjs.extend(utc)
	dayjs.extend(timezone)

	let userData: UserFull | null = null
	let values: Record<string, string> = {}
	let toggles: Record<string, boolean> = {}
	let ranges: Record<string, number> = {}
	let loading = false
	let saving = false

	const categories: UserSettingCategory[] = ["regional", "notifications", "appearance", "advanced"]
	const sampleDate = new Date().toISOString()

	const quickLinks = [
		{ href: "/account/settings/details", icon: "fa-light fa-file-signature", label: "Details" },
		{ href: "/account/settings/email", icon: "fa-light fa-envelope", label: "Email" },
		{ href: "/account/settings/avatar", icon: "fa-light fa-image", label: "Avatar" },
		{ href: "/account/settings/password", icon: "fa-light fa-lock", label: "Password" },
		{ href: "/account/settings/billing", icon: "fa-light fa-credit-card", label: "Billing" },
	]

	$: currentPath = $page.url.pathname

	const previewDate = (fmt: string, tz: string) => {
		try {
			return dayjs.utc(sampleDate).tz(tz).format(fmt)
		} catch {
			return `—`
		}
	}

	const previewTime = (tz: string) => {
		try {
			return dayjs.utc(sampleDate).tz(tz).format(`h:mm A`)
		} catch {
			return `—`
		}
	}

	const previewCurrency = (code: string) => {
		try {
			return app.Format.Currency.format(149900, code)
		} catch {
			return `—`
		}
	}

	$: regionalPreview = {
		currency: previewCurrency(values.currency ?? `USD`),
		timezone: previewTime(values.timezone ?? `UTC`),
		datetime_format: previewDate(values.datetime_format ?? `YYYY-MM-DD`, values.timezone ?? `UTC`),
	} as Record<string, string>

	onMount(async () => {
		loading = true
		userData = await app.Auth.me().catch(() => null)
		for (const def of userSettingsConfig) {
			const val = getUserSetting(userData?.settings, def.key)
			values[def.key] = val
			if (def.type === "toggle") toggles[def.key] = val === "1"
			if (def.type === "range") ranges[def.key] = Number(val) || 0
		}
		loading = false
	})

	const save = async () => {
		saving = true
		try {
			// Sync toggles back to values and ensure all values are strings
			const payload: Record<string, string> = {}
			for (const def of userSettingsConfig) {
				if (def.type === "toggle") values[def.key] = toggles[def.key] ? "1" : "0"
				if (def.type === "range") values[def.key] = String(ranges[def.key])
				payload[def.key] = String(values[def.key])
			}
			await app.Account.Settings.save(payload)
			app.UI.Notify.success("Preferences saved")
		} catch (err) {
			app.UI.Notify.error(`Failed to save preferences: ${app.Helpers.errMsg(err)}`)
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
			<Button variant="secondary" href={link.href} active={currentPath === link.href || currentPath.startsWith(link.href + "/")}>
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
						<div class="col-xxs-12">
							<div class="row middle-xxs">
								<div class="col-xxs start-xxs">
									<span class="detail-title">{def.label}</span>
									<span class="muted-color text-small">{def.description}</span>
									{#if cat === "regional" && regionalPreview[def.key]}
										<span class="setting-preview">{regionalPreview[def.key]}</span>
									{/if}
								</div>
								<div class="col end-xxs detail-value">
									{#if def.type === "toggle"}
										<Toggle bind:checked={toggles[def.key]} />
									{:else if def.type === "select"}
										<Select bind:value={values[def.key]} options={def.options ?? []} />
									{:else if def.type === "range"}
										<div class="range-control">
											<input type="range" min={def.min ?? 0} max={def.max ?? 100} step={def.step ?? 1} bind:value={ranges[def.key]} />
										</div>
									{/if}
								</div>
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

	.detail-title {
		display: block;
		font-weight: 500;
	}

	.setting-preview {
		display: inline-block;
		margin-top: calc(var(--gutter) * 0.5);
		padding: 2px 8px;
		font-size: var(--font-size-small);
		font-family: var(--font-mono, monospace);
		color: var(--color-primary);
		background: rgba(255, 255, 255, 0.06);
		border-radius: var(--border-radius);
	}

	.detail-value {
		flex-shrink: 0;
		min-width: 140px;
	}

	.range-control {
		display: flex;
		align-items: center;

		input[type="range"] {
			-webkit-appearance: none;
			appearance: none;
			width: 120px;
			height: 4px;
			background: var(--border-color);
			border-radius: 2px;
			outline: none;
			cursor: pointer;

			&::-webkit-slider-thumb {
				-webkit-appearance: none;
				width: 14px;
				height: 14px;
				border-radius: 50%;
				background: var(--accent-color);
				border: none;
				cursor: pointer;
				transition: box-shadow var(--animationDefaultSpeed) var(--animationEasing);
			}

			&::-moz-range-thumb {
				width: 14px;
				height: 14px;
				border-radius: 50%;
				background: var(--accent-color);
				border: none;
				cursor: pointer;
			}

			&::-webkit-slider-thumb:hover {
				box-shadow: 0 0 0 4px rgba(116, 231, 168, 0.15);
			}

			&::-moz-range-track {
				height: 4px;
				background: var(--border-color);
				border-radius: 2px;
			}
		}
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}
</style>
