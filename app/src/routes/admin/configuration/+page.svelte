<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { SystemSetting } from "$lib/classes/Admin/SettingsResource"
	import Button from "$components/fields/button.svelte"
	import Input from "$components/fields/input.svelte"
	import Toggle from "$components/fields/toggle.svelte"
	import RepeaterField from "$components/modules/repeaterField.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	type SettingRow = { key: string; value: string; autoload: boolean; _boolValue: boolean }

	// Keys hidden from the editor
	const hiddenKeys = [`cache_last_cleared`, `cache_version`]

	let items: SettingRow[] = []
	let originalItems: SettingRow[] = []
	let loading = true
	let saving = false

	const createRow = (): SettingRow => ({ key: ``, value: ``, autoload: false, _boolValue: false })

	const prettifyKey = (key: string) => {
		return key
			.replace(/^_/, ``)
			.replace(/[-_]+/g, ` `)
			.replace(/([a-z])([A-Z])/g, `$1 $2`)
			.replace(/\b\w/g, (c) => c.toUpperCase())
	}

	const getRowLabel = (item: SettingRow) => {
		if (!item.key) return `New setting`
		const label = prettifyKey(item.key)
		const display = isBoolean(item.key) ? (item._boolValue ? `true` : `false`) : item.value
		return `${label}: <span style="color: var(--white)">${display || `—`}</span>`
	}

	const isBoolean = (key: string) => key.startsWith(`_`)

	onMount(async () => {
		try {
			const data: SystemSetting[] = await app.Admin.Settings.list()
			items = data.filter((s) => !hiddenKeys.includes(s.key)).map((s) => ({ key: s.key, value: s.value, autoload: !!s.autoload, _boolValue: s.value === `1` }))
			originalItems = structuredClone(items)
		} catch (err) {
			app.UI.Notify.error(`Failed to load settings`)
		} finally {
			loading = false
		}
	})

	const save = async () => {
		// Filter out rows with empty keys (ignored)
		const validItems = items.filter((i) => i.key.trim())

		// Sync boolean values before diffing
		for (const item of validItems) {
			if (isBoolean(item.key)) item.value = item._boolValue ? `1` : `0`
		}

		// Validate: no duplicate keys
		const keys = validItems.map((i) => i.key.trim())
		if (new Set(keys).size !== keys.length) {
			app.UI.Notify.error(`Duplicate keys are not allowed`)
			return
		}

		saving = true
		try {
			const originalMap = new Map(originalItems.map((i) => [i.key, i]))
			const currentMap = new Map(validItems.map((i) => [i.key, i]))
			const ops: Promise<any>[] = []

			// Deletes: keys in original but not in current
			for (const [key] of originalMap) {
				if (!currentMap.has(key)) {
					ops.push(app.Admin.Settings.remove({ key }))
				}
			}

			// Creates: keys in current but not in original
			for (const [key, item] of currentMap) {
				if (!originalMap.has(key)) {
					ops.push(app.Admin.Settings.create({ key, value: item.value, autoload: item.autoload ? 1 : 0 }))
				}
			}

			// Updates: keys in both where value or autoload changed
			for (const [key, item] of currentMap) {
				const orig = originalMap.get(key)
				if (orig && (orig.value !== item.value || orig.autoload !== item.autoload)) {
					ops.push(app.Admin.Settings.update({ key }, { key, value: item.value, autoload: item.autoload ? 1 : 0 }))
				}
			}

			await Promise.all(ops)
			originalItems = structuredClone(validItems)
			items = validItems

			// Clear cache after saving settings
			app.Cache.clearAll()
			await app.Cache.adminClear(`all`).catch(() => null)

			app.UI.Notify.success(`Reloading app...`, "Success")

			// Reload to pick up new settings across all components
			setTimeout(() => location.reload(), 500)
		} catch (err) {
			app.UI.Notify.error(`Failed to save settings`)
		} finally {
			saving = false
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-cog"></i> Configuration</h1>
		<p class="muted-color text-small">Manage system-wide key/value settings</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section margin-bottom-4">
			<RepeaterField bind:items addLabel="Add setting" emptyLabel="No settings configured" collapsible={true} defaultExpanded={false} {getRowLabel} {createRow}>
				<svelte:fragment let:index>
					<div class="col-xxs-12 col-md">
						<Input label="Key" bind:value={items[index].key} placeholder="setting_key" />
					</div>
					<div class="col-xxs-12 col-md">
						{#if isBoolean(items[index].key)}
							<Toggle label="Value" labelPosition="top" bind:checked={items[index]._boolValue} />
						{:else}
							<Input label="Value" bind:value={items[index].value} placeholder="value" />
						{/if}
					</div>
					<div class="col-xxs-12 col">
						<Toggle label="Autoload" labelPosition="top" bind:checked={items[index].autoload} />
					</div>
				</svelte:fragment>
			</RepeaterField>
		</div>

		<div class="section">
			<Button on:click={save} loading={saving} disabled={saving}>
				{saving ? `Saving...` : `Save settings`}
			</Button>
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
</style>
