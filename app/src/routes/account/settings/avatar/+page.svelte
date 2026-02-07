<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import Avatar from "$components/modules/avatar.svelte"
	import FileUpload from "$components/fields/fileUpload.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	let loading = true
	let uploading = false
	let fullName = ""
	let username = ""
	let avatarUrl = ""
	let selectedFile: File | null = null
	let previewUrl = ""

	onMount(async () => {
		const data = await app.Auth.me().catch(() => null)
		const info = data?.info
		if (info) {
			fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
			username = info.username || ""
			if (info.avatarUrl) avatarUrl = app.Account.Avatar.url(info.avatarUrl) as string
		}
		loading = false
	})

	const handleFileSelect = (e: CustomEvent<{ files: FileList }>) => {
		const file = e.detail?.files?.[0]
		if (file) {
			selectedFile = file
			previewUrl = URL.createObjectURL(file)
		}
	}

	const upload = async () => {
		if (!selectedFile) return
		uploading = true
		try {
			await app.Account.Avatar.upload(selectedFile)
			const data = await app.Auth.me(true)
			if (data?.info?.avatarUrl) avatarUrl = app.Account.Avatar.url(data.info.avatarUrl) as string
			selectedFile = null
			previewUrl = ""
			app.Notify.success("Avatar updated")
		} catch (err) {
			app.Notify.error(`Upload failed: ${(err as Error).message}`)
		} finally {
			uploading = false
		}
	}

	const removeAvatar = async () => {
		try {
			await app.Account.Avatar.remove()
			avatarUrl = ""
			app.Notify.success("Avatar removed")
		} catch (err) {
			app.Notify.error(`Failed to remove avatar: ${(err as Error).message}`)
		}
	}
</script>

<div class="page page-thin">
	<div class="section margin-bottom-4">
		<h1 class="title">Avatar</h1>
		<p class="muted-color text-small">Change your profile picture</p>
	</div>

	{#if loading}
		<div class="section row center-xxs margin-bottom-4">
			<Spinner />
		</div>
	{:else}
		<div class="section margin-bottom-4">
			<div class="details">
				<div class="avatar-preview">
					{#if previewUrl}
						<img src={previewUrl} alt="Preview" class="preview-img" />
					{:else if avatarUrl}
						<img src={avatarUrl} alt="Avatar" class="preview-img" />
					{:else}
						<Avatar name={fullName || username} size="lg" />
					{/if}
				</div>

				<div class="upload-area">
					<FileUpload
						label="Upload new avatar"
						buttonText="Choose image"
						accept="image/png, image/jpeg, image/webp"
						helperText="JPG, PNG, or WebP. Max 2MB."
						on:change={handleFileSelect}
					/>
				</div>

				<div class="actions">
					<Button on:click={upload} disabled={!selectedFile || uploading} loading={uploading}>
						{uploading ? "Uploading..." : "Upload"}
					</Button>
					{#if avatarUrl}
						<Button variant="danger" size="sm" on:click={removeAvatar}>Remove</Button>
					{/if}
					<a href="/account/settings" class="muted-color text-small">Back to preferences</a>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss" scoped>
	.section .title {
		font-size: var(--font-size-large);
		font-weight: 600;
	}

	.details {
		background-color: rgba(255, 255, 255, 0.04);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 2.5);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}

	.avatar-preview {
		display: flex;
		justify-content: center;
	}

	.preview-img {
		width: 128px;
		height: 128px;
		border-radius: 50%;
		object-fit: cover;
	}

	.upload-area {
		width: 100%;
		max-width: 320px;
	}

	.actions {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 2);
	}
</style>
