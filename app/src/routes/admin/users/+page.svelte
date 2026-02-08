<script lang="ts">
	import { app } from "$lib/app"
	import { onMount, onDestroy } from "svelte"
	import type { UserFull, UserDBRow } from "$lib/types/types"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"
	import SearchInput from "$components/fields/searchInput.svelte"
	import Select from "$components/fields/select.svelte"
	import Button from "$components/fields/button.svelte"

	let usersData: UserFull[] = []
	let loading = true
	let filtering = false
	let users: any[] = []
	let mounted = false

	// Filter state
	let searchQuery = ``
	let filterPermission = ``
	let filterDisabled = ``
	let filterActive = ``

	const permissionOptions = [
		{ label: `All Permissions`, value: `` },
		{ label: `User`, value: `user` },
		{ label: `Administrator`, value: `administrator` },
	]
	const disabledOptions = [
		{ label: `All Statuses`, value: `` },
		{ label: `Enabled`, value: `0` },
		{ label: `Disabled`, value: `1` },
	]
	const activeOptions = [
		{ label: `All`, value: `` },
		{ label: `Active`, value: `1` },
		{ label: `Inactive`, value: `0` },
	]

	let debounceTimer: ReturnType<typeof setTimeout>

	const loadUsers = async () => {
		filtering = true
		try {
			const query: Record<string, any> = {}
			if (searchQuery) query.search = searchQuery
			if (filterPermission) query.permission = filterPermission
			if (filterDisabled) query.disabled = Number(filterDisabled)
			if (filterActive) query.activated = Number(filterActive)

			usersData = await app.Admin.Users.list(query)
			users = createUserTableData(usersData)
		} catch (err) {
			app.UI.Notify.error(`Failed to load users`)
		} finally {
			loading = false
			filtering = false
		}
	}

	const applyFilters = (debounce = 0) => {
		clearTimeout(debounceTimer)
		if (debounce > 0) {
			debounceTimer = setTimeout(() => loadUsers(), debounce)
		} else {
			loadUsers()
		}
	}

	onMount(() => {
		mounted = true
	})

	onDestroy(() => clearTimeout(debounceTimer))

	// Search: debounced (declared first so the selects block can clear its timer)
	$: if (mounted) {
		searchQuery
		applyFilters(800)
	}

	// Select changes: immediate reload (clears any pending search debounce)
	$: if (mounted) {
		;(filterPermission, filterDisabled, filterActive)
		applyFilters()
	}

	const resetFilters = () => {
		searchQuery = ``
		filterPermission = ``
		filterDisabled = ``
		filterActive = ``
	}

	$: activeFilters = searchQuery || filterPermission || filterDisabled || filterActive

	const createUserTableData = (users: UserFull[]) => {
		let tableData: any[] = []

		for (const userRaw of users) {
			let user: any = {}
			const resolved = app.Account.Avatar.resolve(userRaw.info.avatar, 256)
			const fullName = `${userRaw.info.firstName ?? ``} ${userRaw.info.lastName ?? ``}`.trim()
			user.ID = userRaw.id
			user.Avatar = { src: resolved?.src ?? ``, name: fullName || userRaw.info.username }
			user.Name = fullName
			user.Email = userRaw.info.email
			user.Created = userRaw.info.created
			user.Updated = userRaw.info.updated

			user.Disabled = userRaw.info.disabled
			user.Active = userRaw.info.activated
			tableData.push(user)
		}
		return tableData
	}

	const handleAction = (e: CustomEvent<{ event: string; row: Record<string, any>; index: number }>) => {
		const { event, row } = e.detail
		if (event === `edit`) app.UI.Notify.info(`Edit user ${row.Name || row.ID}`)
		if (event === `view`) app.UI.Notify.info(`View user ${row.Name || row.ID}`)
		if (event === `delete`) app.UI.Notify.warning(`Delete user ${row.Name || row.ID}`)
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-users-crown"></i> Users</h1>
		<p class="muted-color text-small">Manage system users</p>
	</div>

	<div class="filters">
		<div class="filter-field filter-search">
			<SearchInput placeholder="Search users..." bind:value={searchQuery} />
		</div>
		<div class="filter-field">
			<Select label="Permission" bind:value={filterPermission} options={permissionOptions} />
		</div>
		<div class="filter-field">
			<Select label="Status" bind:value={filterDisabled} options={disabledOptions} />
		</div>
		<div class="filter-field">
			<Select label="Active" bind:value={filterActive} options={activeOptions} />
		</div>
		{#if activeFilters}
			<div class="filter-field filter-reset">
				<Button variant="ghost" size="sm" on:click={resetFilters}>
					<i class="fa-light fa-xmark"></i>
					<span>Reset</span>
				</Button>
			</div>
		{/if}
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section table-wrapper">
			{#if filtering}
				<div class="table-overlay">
					<Spinner />
				</div>
			{/if}
			<AdvancedTable
				rows={users}
				pagination={6}
				stickyColumns={[2]}
				scrollable="x"
				colActions={[
					{ name: `Edit`, icon: `fa-light fa-pen`, event: `edit` },
					{ name: `View`, icon: `fa-light fa-eye`, event: `view` },
					{ name: `Delete`, icon: `fa-light fa-trash`, event: `delete` },
				]}
				on:action={handleAction}
			/>
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

	.filters {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: calc(var(--gutter) * 2);
		background-color: var(--tertiary-color);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 3);
		margin-bottom: calc(var(--gutter) * 3);
	}

	.filter-search {
		flex: 1;
		min-width: 200px;
	}

	.filter-field {
		min-width: 140px;
	}

	.filter-reset {
		display: flex;
		align-items: flex-end;
		min-width: auto;
		padding-bottom: 2px;

		i {
			margin-right: calc(var(--gutter) * 0.5);
		}
	}

	.table-wrapper {
		position: relative;
	}

	.table-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10;
		background-color: rgba(0, 0, 0, 0.25);
		border-radius: var(--border-radius);
	}
</style>
