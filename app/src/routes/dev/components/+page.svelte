<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"

	import Button from "$components/fields/button.svelte"
	import Input from "$components/fields/input.svelte"
	import Checkbox from "$components/fields/checkbox.svelte"
	import Select from "$components/fields/select.svelte"
	import Textarea from "$components/fields/textarea.svelte"
	import Radio from "$components/fields/radio.svelte"
	import Toggle from "$components/fields/toggle.svelte"
	import DatePicker from "$components/fields/datePicker.svelte"
	import FileUpload from "$components/fields/fileUpload.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import Tabs from "$components/modules/tabs.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import ProgressBar from "$components/modules/progressBar.svelte"
	import Table from "$components/modules/table.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"
	import Pagination from "$components/modules/pagination.svelte"
	import ContextMenu from "$components/modules/contextMenu.svelte"
	import DropdownMenu from "$components/modules/DropdownMenu.svelte"
	import RepeaterField from "$components/modules/repeaterField.svelte"
	import Breadcrumbs from "$components/modules/breadcrumbs.svelte"
	import DateString from "$components/Formats/DateString.svelte"
	import Currency from "$components/Formats/Currency.svelte"

	let radioValue = "a"
	let toggleChecked = false
	let tabActive = "tab1"
	let loadingBtn = false
	let dropdownOpen = false
	let dropdownTrigger: HTMLElement | null = null
	let repeaterItems: { name: string; type: string; enabled: boolean }[] = [
		{ name: "Header", type: "text", enabled: true },
		{ name: "Sidebar", type: "select", enabled: false },
	]

	function simulateLoading() {
		loadingBtn = true
		setTimeout(() => (loadingBtn = false), 2000)
	}

	onMount(() => {})
</script>

<div class="page">
	<h1>Components</h1>

	<section>
		<h2>Button — Variants</h2>
		<div class="demo">
			<Button>Primary</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="ghost">Ghost</Button>
			<Button variant="danger">Danger</Button>
		</div>
	</section>

	<section>
		<h2>Button — Sizes</h2>
		<div class="demo">
			<Button size="sm">Small</Button>
			<Button size="md">Medium</Button>
			<Button size="lg">Large</Button>
		</div>
	</section>

	<section>
		<h2>Button — Active & Disabled</h2>
		<div class="demo">
			<Button active>Active Primary</Button>
			<Button variant="secondary" active>Active Secondary</Button>
			<Button variant="ghost" active>Active Ghost</Button>
			<Button variant="danger" active>Active Danger</Button>
			<Button disabled>Disabled</Button>
			<Button variant="secondary" disabled>Disabled</Button>
			<Button variant="danger" disabled>Disabled</Button>
		</div>
	</section>

	<section>
		<h2>Button — Loading</h2>
		<div class="demo">
			<Button loading={loadingBtn} on:click={simulateLoading}>
				{loadingBtn ? `Saving...` : `Click to load`}
			</Button>
			<Button variant="secondary" loading>Loading…</Button>
		</div>
	</section>

	<section>
		<h2>Button — Icon + Text</h2>
		<div class="demo">
			<Button><i class="fa-light fa-plus"></i> <span>Add Item</span></Button>
			<Button variant="secondary"><i class="fa-light fa-pen"></i> <span>Edit</span></Button>
			<Button variant="danger"><i class="fa-light fa-trash"></i> <span>Delete</span></Button>
			<Button variant="ghost"><i class="fa-light fa-arrow-left"></i> <span>Back</span></Button>
		</div>
	</section>

	<section>
		<h2>Button — Icon Only</h2>
		<div class="demo">
			<Button iconOnly size="sm"><i class="fa-light fa-gear"></i></Button>
			<Button iconOnly><i class="fa-light fa-bell"></i></Button>
			<Button iconOnly size="lg"><i class="fa-light fa-heart"></i></Button>
			<Button iconOnly variant="secondary"><i class="fa-light fa-ellipsis-vertical"></i></Button>
			<Button iconOnly variant="ghost"><i class="fa-light fa-xmark"></i></Button>
			<Button iconOnly variant="danger"><i class="fa-light fa-trash"></i></Button>
		</div>
	</section>

	<section>
		<h2>Button — Span Only</h2>
		<div class="demo">
			<Button><span>Just a span</span></Button>
			<Button variant="secondary"><span>Label</span></Button>
		</div>
	</section>

	<section>
		<h2>Button — Link</h2>
		<div class="demo">
			<Button href="/">Home Link</Button>
			<Button href="/" variant="ghost"><i class="fa-light fa-link"></i> <span>Link Ghost</span></Button>
		</div>
	</section>

	<section>
		<h2>Notifications — Types</h2>
		<div class="demo">
			<Button on:click={() => app.UI.Notify.success(`Item saved successfully`)}><i class="fa-light fa-check"></i> <span>Success</span></Button>
			<Button variant="danger" on:click={() => app.UI.Notify.error(`Something went wrong`)}><i class="fa-light fa-xmark"></i> <span>Error</span></Button>
			<Button variant="secondary" on:click={() => app.UI.Notify.warning(`Disk space running low`)}
				><i class="fa-light fa-triangle-exclamation"></i> <span>Warning</span></Button
			>
			<Button variant="secondary" on:click={() => app.UI.Notify.info(`New version available`)}><i class="fa-light fa-circle-info"></i> <span>Info</span></Button>
		</div>
	</section>

	<section>
		<h2>Notifications — With Title</h2>
		<div class="demo">
			<Button on:click={() => app.UI.Notify.success(`Changes published`, `Deploy`)}><i class="fa-light fa-check"></i> <span>Success + Title</span></Button>
			<Button variant="danger" on:click={() => app.UI.Notify.error(`Connection refused`, `Network Error`)}
				><i class="fa-light fa-xmark"></i> <span>Error + Title</span></Button
			>
			<Button variant="secondary" on:click={() => app.UI.Notify.warning(`Rate limit approaching`, `API Warning`)}
				><i class="fa-light fa-triangle-exclamation"></i> <span>Warning + Title</span></Button
			>
			<Button variant="secondary" on:click={() => app.UI.Notify.info(`v2.4.0 is out`, `Update`)}><i class="fa-light fa-circle-info"></i> <span>Info + Title</span></Button>
		</div>
	</section>

	<section>
		<h2>Notifications — Duration</h2>
		<div class="demo">
			<Button variant="ghost" on:click={() => app.UI.Notify.info(`Gone in 2 seconds`, `Quick`, 2)}><i class="fa-light fa-bolt"></i> <span>Short (2s)</span></Button>
			<Button variant="ghost" on:click={() => app.UI.Notify.info(`Default 5 second toast`)}><i class="fa-light fa-clock"></i> <span>Default (5s)</span></Button>
			<Button variant="ghost" on:click={() => app.UI.Notify.info(`This one sticks around`, `Sticky`, 10)}
				><i class="fa-light fa-hourglass"></i> <span>Long (10s)</span></Button
			>
		</div>
	</section>

	<section>
		<h2>Notifications — create()</h2>
		<div class="demo">
			<Button variant="ghost" on:click={() => app.UI.Notify.create({ message: `Raw create call` })}><span>No type (default info)</span></Button>
			<Button variant="ghost" on:click={() => app.UI.Notify.create({ title: `Custom`, message: `Full params example`, type: `success`, duration: 3 })}
				><span>Full params</span></Button
			>
		</div>
	</section>

	<section>
		<h2>Input</h2>
		<div class="demo">
			<Input label="Text Input" placeholder="Enter text..." />
			<Input label="Password" type="password" placeholder="••••••••" />
			<Input label="Email" type="email" placeholder="user@example.com" />
		</div>
	</section>

	<section>
		<h2>Textarea</h2>
		<div class="demo">
			<Textarea label="Message" placeholder="Write something..." />
		</div>
	</section>

	<section>
		<h2>Checkbox</h2>
		<div class="demo">
			<Checkbox label="Option A" />
			<Checkbox label="Option B" checked={true} />
		</div>
	</section>

	<section>
		<h2>Select</h2>
		<div class="demo">
			<Select
				label="Choose option"
				options={[
					{ value: "1", label: "Option 1" },
					{ value: "2", label: "Option 2" },
					{ value: "3", label: "Option 3" },
				]}
			/>
		</div>
	</section>

	<section>
		<h2>Radio</h2>
		<div class="demo">
			<Radio
				name="demo"
				label="Pick one"
				bind:value={radioValue}
				options={[
					{ value: "a", label: "Option A" },
					{ value: "b", label: "Option B" },
					{ value: "c", label: "Option C" },
				]}
			/>
		</div>
	</section>

	<section>
		<h2>Toggle</h2>
		<div class="demo">
			<Toggle label="Enable feature" bind:checked={toggleChecked} />
			<Toggle checked={true} label="On by default" />
			<Toggle label="Disabled" disabled />
		</div>
	</section>

	<section>
		<h2>Date Picker</h2>
		<div class="demo">
			<DatePicker label="Select date" />
			<DatePicker label="Required" required />
		</div>
	</section>

	<section>
		<h2>File Upload</h2>
		<div class="demo">
			<FileUpload label="Attachment" buttonText="Choose file" />
			<FileUpload label="Images" buttonText="Upload" accept="image/*" multiple helperText="PNG, JPG up to 5MB" />
		</div>
	</section>

	<section>
		<h2>Tabs</h2>
		<div class="demo" style="width:100%">
			<Tabs
				tabs={[
					{ id: "tab1", label: "Tab 1" },
					{ id: "tab2", label: "Tab 2" },
				]}
				bind:active={tabActive}
			>
				{#if tabActive === "tab1"}
					<p>Content for Tab 1</p>
				{:else}
					<p>Content for Tab 2</p>
				{/if}
			</Tabs>
		</div>
	</section>

	<section>
		<h2>Badge</h2>
		<div class="demo">
			<Badge text="Default" />
			<Badge text="Success" variant="success" />
			<Badge text="Warning" variant="warning" />
			<Badge text="Danger" variant="danger" />
		</div>
	</section>

	<section>
		<h2>Avatar</h2>
		<div class="demo">
			<Avatar name="John Doe" size="sm" />
			<Avatar name="Jane Smith" size="md" />
			<Avatar name="Bob" size="lg" />
		</div>
	</section>

	<section>
		<h2>Avatar — With Tooltip</h2>
		<div class="demo">
			<Avatar name="Alice" size="sm" data-tip="Alice — Admin" data-tip-pos="bottom" />
			<Avatar name="Bob" size="md" data-tip="Bob — Editor" data-tip-icon="fa-circle-info" data-tip-pos="right" />
			<Avatar name="Carol" size="lg" data-tip="Carol — Viewer" data-tip-icon="fa-circle-info" data-tip-pos="bottom" />
			<Avatar name="Dave" size="md" href="#" data-tip="Open Dave's profile" data-tip-icon="fa-arrow-up-right-from-square" data-tip-pos="right" />
		</div>
	</section>

	<section>
		<h2>Tooltip — Global (data-tip)</h2>
		<div class="demo">
			<Button data-tip="Save changes" data-tip-pos="top"><i class="fa-light fa-floppy-disk"></i> <span>Save</span></Button>
			<Button variant="secondary" data-tip="Edit settings" data-tip-icon="fa-circle-info" data-tip-pos="bottom"><i class="fa-light fa-gear"></i> <span>Settings</span></Button
			>
			<Button iconOnly variant="ghost" data-tip="Notifications" data-tip-pos="right"><i class="fa-light fa-bell"></i></Button>
			<Button iconOnly variant="danger" data-tip="Delete item" data-tip-icon="fa-triangle-exclamation" data-tip-pos="bottom"><i class="fa-light fa-trash"></i></Button>
		</div>
	</section>

	<section>
		<h2>Tooltip — Global with Icon</h2>
		<div class="demo">
			<span data-tip="This is a help tip" data-tip-icon="fa-circle-info" data-tip-pos="top" style="cursor: help"
				><i class="fa-light fa-circle-info" style="font-size: 1.2rem; color: var(--muted-color)"></i></span
			>
			<span data-tip="Feature in beta" data-tip-icon="fa-flask" data-tip-pos="right" style="cursor: help"
				><i class="fa-light fa-flask" style="font-size: 1.2rem; color: var(--muted-color)"></i></span
			>
			<span data-tip="Create a new project" data-tip-icon="fa-circle-plus" data-tip-pos="bottom" style="cursor: pointer"
				><i class="fa-light fa-circle-plus" style="font-size: 1.2rem; color: var(--accent-color)"></i></span
			>
			<span data-tip="Requires permission" data-tip-icon="fa-lock" data-tip-pos="top" style="cursor: not-allowed"
				><i class="fa-light fa-lock" style="font-size: 1.2rem; color: var(--muted-color-2)"></i></span
			>
		</div>
	</section>

	<section>
		<h2>Spinner</h2>
		<div class="demo">
			<Spinner size="sm" />
			<Spinner size="md" />
			<Spinner size="lg" />
		</div>
	</section>

	<section>
		<h2>Progress Bar</h2>
		<div class="demo" style="width:100%">
			<ProgressBar value={30} showLabel />
			<ProgressBar value={75} />
		</div>
	</section>

	<section>
		<h2>Table</h2>
		<div class="demo" style="width:100%">
			<Table
				columns={[
					{ key: "name", label: "Name" },
					{ key: "email", label: "Email" },
					{ key: "role", label: "Role", width: "100px" },
				]}
				rows={[
					{ name: "Alice", email: "alice@example.com", role: "Admin" },
					{ name: "Bob", email: "bob@example.com", role: "User" },
				]}
			/>
		</div>
	</section>

	<section>
		<h2>Advanced Table</h2>
		<div class="demo" style="width:100%">
			<AdvancedTable
				rows={[
					{ id: 1, username: "alice", firstName: "Alice", lastName: "Smith", email: "alice@example.com", active: true, created: "2025-06-01" },
					{ id: 2, username: "bob", firstName: "Bob", lastName: "Jones", email: "bob@example.com", active: false, created: "2025-07-15" },
					{ id: 3, username: "carol", firstName: "Carol", lastName: "White", email: "carol@example.com", active: true, created: "2025-08-20" },
					{ id: 4, username: "dave", firstName: "Dave", lastName: "Brown", email: "dave@example.com", active: true, created: "2025-09-10" },
				]}
				pagination={2}
				scrollable="x"
				stickyColumns={[0]}
				colActions={[
					{ name: `Edit`, icon: `fa-light fa-pen`, event: `edit` },
					{ name: `Delete`, icon: `fa-light fa-trash`, event: `delete` },
				]}
				on:action={(e) => app.UI.Notify.info(`${e.detail.event}: ${e.detail.row.username}`)}
			/>
		</div>
	</section>

	<section>
		<h2>Date String</h2>
		<div class="demo">
			<DateString value="2024-01-15T10:30:00Z" />
			<DateString value="2025-12-01" out="date" />
			<DateString value="2026-02-08T14:00:00Z" out="datetime" />
			<DateString value="2020-06-01" />
		</div>
	</section>

	<section>
		<h2>Currency</h2>
		<div class="demo">
			<Currency amount={9999} />
			<Currency amount={150000} currency="EUR" />
			<Currency amount={4999} currency="GBP" />
			<Currency amount={0} />
		</div>
	</section>

	<section>
		<h2>Pagination</h2>
		<div class="demo">
			<Pagination current={2} total={5} />
		</div>
	</section>

	<section>
		<h2>Search Input</h2>
		<div class="demo">
			<SearchInput placeholder="Search items..." on:submit={(e) => app.UI.Notify.info(`Searched: ${e.detail}`)} />
			<SearchInput label="With label" placeholder="Type and press enter..." />
		</div>
	</section>

	<section>
		<h2>Breadcrumbs</h2>
		<div class="demo" style="width:100%">
			<Breadcrumbs
				items={[
					{ href: "/", label: "Home" },
					{ href: "/projects", label: "Projects" },
					{ href: "/projects/magix", label: "Magix" },
				]}
			/>
		</div>
		<div class="demo" style="width:100%; margin-top: calc(var(--gutter) * 2)">
			<Breadcrumbs
				separator="›"
				items={[
					{ href: "/", label: "Dashboard" },
					{ href: "/settings", label: "Settings" },
					{ href: "/settings/profile", label: "Profile" },
				]}
			/>
		</div>
	</section>

	<section>
		<h2>Context Menu</h2>
		<div class="demo">
			<div
				class="context-target"
				style="padding: calc(var(--gutter) * 3); border: var(--border); border-radius: var(--border-radius); cursor: context-menu; color: var(--muted-color)"
			>
				Right-click here
			</div>
			<ContextMenu
				togglers=".context-target"
				items={[
					{ label: "Edit", icon: "fa-light fa-pen", action: () => app.UI.Notify.info("Edit clicked") },
					{ label: "Duplicate", icon: "fa-light fa-copy", action: () => app.UI.Notify.info("Duplicate clicked") },
					{ label: "Delete", icon: "fa-light fa-trash", action: () => app.UI.Notify.warning("Delete clicked") },
				]}
			/>
		</div>
	</section>

	<section>
		<h2>Dropdown Menu</h2>
		<div class="demo" style="position: relative">
			<div bind:this={dropdownTrigger}>
				<Button on:click={() => (dropdownOpen = !dropdownOpen)}>
					<i class="fa-light fa-ellipsis-vertical"></i> <span>Open Menu</span>
				</Button>
			</div>
			<DropdownMenu bind:open={dropdownOpen} triggerRef={dropdownTrigger}>
				<button
					on:click={() => {
						dropdownOpen = false
						app.UI.Notify.info("Profile clicked")
					}}
				>
					<i class="fa-light fa-user"></i> Profile
				</button>
				<button
					on:click={() => {
						dropdownOpen = false
						app.UI.Notify.info("Settings clicked")
					}}
				>
					<i class="fa-light fa-gear"></i> Settings
				</button>
				<hr />
				<button
					on:click={() => {
						dropdownOpen = false
						app.UI.Notify.warning("Logout clicked")
					}}
				>
					<i class="fa-light fa-arrow-right-from-bracket"></i> Logout
				</button>
			</DropdownMenu>
		</div>
	</section>

	<section>
		<h2>Repeater Field</h2>
		<form
			class="demo"
			style="width:100%; flex-direction:column; align-items:stretch; gap:1rem"
			on:submit|preventDefault={(e) => {
				const fd = new FormData(e.currentTarget)
				const data: Record = {}
				for (const [key, val] of fd.entries()) {
					const match = key.match(/^row\[(\d+)]\[(.+)]$/)
					if (!match) continue
					const [, i, field] = match
					data[i] ??= {}
					data[i][field] = val
				}
				const rows = Object.values(data)
				console.log(`Repeater form data:`, rows)
				app.UI.Notify.success(`Logged ${rows.length} items to console`)
			}}
		>
			<RepeaterField title="Components" bind:items={repeaterItems} addLabel="Add component" emptyLabel="No components added" minRows={2} maxRows={6}>
				<svelte:fragment let:index>
					<div class="col-xxs-12 col-md margin-bottom-2">
						<Input label="Name" name={`row[${index}][name]`} value={repeaterItems[index].name} placeholder="Component name" />
					</div>
					<div class="col-xxs-12 col-md margin-bottom-2">
						<Select
							label="Type"
							name={`row[${index}][type]`}
							value={repeaterItems[index].type}
							options={[
								{ label: "Text", value: "text" },
								{ label: "Image", value: "image" },
								{ label: "Select", value: "select" },
								{ label: "Video", value: "video" },
							]}
						/>
					</div>
					<div class="col-xxs-12 col-md-12">
						<Toggle label="Enabled" name={`row[${index}][enabled]`} checked={repeaterItems[index].enabled} />
					</div>
				</svelte:fragment>
			</RepeaterField>
			<div style="display:flex; justify-content:flex-end">
				<Button size="sm" type="submit">
					<i class="fa-light fa-floppy-disk"></i> <span>Save</span>
				</Button>
			</div>
		</form>
	</section>

	<section>
		<h2>Modal / Dialog</h2>
		<div class="demo">
			<Button
				on:click={async () => {
					const result = await app.UI.Modal.confirm("Delete project?", "This action cannot be undone.")
					app.UI.Notify.info(result ? "Confirmed" : "Cancelled")
				}}><i class="fa-light fa-trash"></i> <span>Confirm Dialog</span></Button
			>

			<Button variant="secondary" on:click={() => app.UI.Modal.alert("Deployment complete", "Your app is now live.", "fa-rocket")}>
				<i class="fa-light fa-circle-info"></i> <span>Alert Dialog</span>
			</Button>

			<Button
				variant="ghost"
				on:click={async () => {
					const choice = await app.UI.Modal.open({
						icon: "fa-code-branch",
						title: "Merge Strategy",
						subtitle: "How should this branch be merged?",
						content: "Choose a merge strategy for the pull request.",
						choices: [
							{ label: "Merge", value: "merge" },
							{ label: "Squash", value: "squash", variant: "primary" },
							{ label: "Rebase", value: "rebase" },
						],
					})
					if (choice) app.UI.Notify.success(`Chose: ${choice}`)
				}}><i class="fa-light fa-code-branch"></i> <span>Multi-choice</span></Button
			>
		</div>
	</section>
</div>

<style>
	h1 {
		margin-bottom: calc(var(--gutter) * 3);
	}
	h2 {
		margin-bottom: calc(var(--gutter) * 1.5);
		font-size: var(--font-size-large);
	}
	section {
		margin-bottom: calc(var(--gutter) * 4);
	}

	.demo {
		display: flex;
		flex-wrap: wrap;
		gap: calc(var(--gutter) * 2);
		align-items: flex-start;
	}
</style>
