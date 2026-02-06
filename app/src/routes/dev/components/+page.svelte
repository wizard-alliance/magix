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
	import Tabs from "$components/modules/tabs.svelte"
	import Badge from "$components/modules/badge.svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import Tooltip from "$components/modules/tooltip.svelte"
	import Spinner from "$components/modules/spinner.svelte"
	import ProgressBar from "$components/modules/progressBar.svelte"
	import Table from "$components/modules/table.svelte"
	import Pagination from "$components/modules/pagination.svelte"

	let radioValue = "a"
	let toggleChecked = false
	let tabActive = "tab1"

	onMount(() => {})
</script>

<div class="page">
	<h1>Components</h1>

	<section>
		<h2>Button</h2>
		<div class="demo">
			<Button>Default</Button>
			<Button variant="secondary">Secondary</Button>
			<Button variant="danger">Danger</Button>
			<Button size="sm">Small</Button>
			<Button size="lg">Large</Button>
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
		<h2>Tooltip</h2>
		<div class="demo">
			<Tooltip text="Top tooltip"><Button>Hover me</Button></Tooltip>
			<Tooltip text="Right tooltip" position="right"><Button variant="secondary">Right</Button></Tooltip>
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
		<h2>Pagination</h2>
		<div class="demo">
			<Pagination current={2} total={5} />
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
