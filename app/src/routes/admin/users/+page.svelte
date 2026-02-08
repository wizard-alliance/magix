<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import type { UserFull, UserDBRow } from "$lib/types/types"
	import Spinner from "$components/modules/spinner.svelte"
	import AdvancedTable from "$components/modules/AdvancedTable.svelte"

	let usersData: UserFull[] = []
	let loading = true
	let users: any[] = []

	onMount(async () => {
		try {
			usersData = await app.Admin.Users.list()
			console.log(usersData)
			users = createUserTableData(usersData)
		} catch (err) {
			app.UI.Notify.error(`Failed to load users`)
		} finally {
			loading = false
			console.log(users)
		}
	})

	const createUserTableData = (users: UserFull[]) => {
		let tableData: any[] = []

		for (const userRaw of users) {
			let user: any = {}
			const resolved = app.Account.Avatar.resolve(userRaw.info.avatar, 256)
			const fullName = `${userRaw.info.firstName ?? ``} ${userRaw.info.lastName ?? ``}`.trim()
			user.ID = userRaw.id
			user.Avatar = { src: resolved?.src ?? ``, name: fullName || userRaw.info.username }
			user.Email = userRaw.info.email
			user.Name = fullName
			user.Created = userRaw.info.created
			// user.Disabled = userRaw.info.disabled
			user.Active = userRaw.info.activated

			// user.Updated = userRaw.info.updated
			// user.Perms = userRaw.permissions.join(", ")
			tableData.push(user)
		}
		return tableData
	}
</script>

<div class="page page-normal">
	<div class="section margin-bottom-4">
		<h1 class="title"><i class="fa-light fa-users-crown"></i> Users</h1>
		<p class="muted-color text-small">Manage system users</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section">
			<AdvancedTable rows={users} />
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
