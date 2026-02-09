<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"
	import { PUBLIC_MAX_FILE_SIZE_IMAGE } from "$env/static/public"
	import Avatar from "$components/modules/avatar.svelte"
	import FileUpload from "$components/fields/fileUpload.svelte"
	import Button from "$components/fields/button.svelte"
	import Spinner from "$components/modules/spinner.svelte"

	const maxFileSize = Number(PUBLIC_MAX_FILE_SIZE_IMAGE) || 5_000_000
	const maxFileSizeMB = (maxFileSize / 1_000_000).toFixed(0)
	const allowedMimes = [`image/png`, `image/jpeg`, `image/avif`]

	let loading = true
	let uploading = false
	let fullName = ""
	let username = ""
	let avatarUrl = ""
	let avatarSrcset = ""
	let selectedFile: File | null = null
	let previewUrl = ""

	onMount(async () => {
		const data = await app.Auth.me().catch(() => null)
		const info = data?.info
		if (info) {
			fullName = [info.firstName, info.lastName].filter(Boolean).join(" ")
			username = info.username || ""
			if (info.avatar) {
				const resolved = app.Account.Avatar.resolve(info.avatar, 128)
				if (resolved) {
					avatarUrl = resolved.src
					avatarSrcset = resolved.srcset
				}
			} else if (info.avatarUrl) {
				avatarUrl = app.Account.Avatar.url(info.avatarUrl) as string
			}
		}
		loading = false
	})

	const handleFileSelect = (e: CustomEvent<{ files: FileList }>) => {
		const file = e.detail?.files?.[0]
		if (!file) return

		if (!allowedMimes.includes(file.type)) {
			app.UI.Notify.error(`Unsupported image format. Use JPG, PNG, or AVIF`)
			return
		}

		if (file.size > maxFileSize) {
			app.UI.Notify.error(`File exceeds the ${maxFileSizeMB}MB size limit`)
			return
		}

		selectedFile = file
		previewUrl = URL.createObjectURL(file)
	}

	const upload = async () => {
		if (!selectedFile) return
		uploading = true
		try {
			await app.Account.Avatar.upload(selectedFile)
			const data = await app.Auth.me(true)
			if (data?.info?.avatar) {
				const resolved = app.Account.Avatar.resolve(data.info.avatar, 128)
				if (resolved) {
					avatarUrl = resolved.src
					avatarSrcset = resolved.srcset
				}
			} else if (data?.info?.avatarUrl) {
				avatarUrl = app.Account.Avatar.url(data.info.avatarUrl) as string
				avatarSrcset = ""
			}
			selectedFile = null
			previewUrl = ""
			app.UI.Notify.success("Avatar updated")
		} catch (err) {
			app.UI.Notify.error(`Upload failed: ${(err as Error).message}`)
		} finally {
			uploading = false
		}
	}

	const removeAvatar = async () => {
		try {
			await app.Account.Avatar.remove()
			avatarUrl = ""
			avatarSrcset = ""
			app.UI.Notify.success("Avatar removed")
		} catch (err) {
			app.UI.Notify.error(`Failed to remove avatar: ${(err as Error).message}`)
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
				<div class="row center-xxs margin-bottom-2">
					<div class="col-xxs-12">
						{#if previewUrl}
							<img src={previewUrl} alt="Preview" class="preview-img" />
						{:else if avatarUrl}
							<img src={avatarUrl} srcset={avatarSrcset || undefined} sizes="128px" alt="Avatar" class="preview-img" />
						{:else}
							<Avatar name={fullName || username} size="lg" />
						{/if}
					</div>
				</div>

				<div class="row center-xxs margin-bottom-2">
					<div class="col-xxs-12 col-md-6">
						<FileUpload
							label="Upload new avatar"
							buttonText="Choose image"
							accept="image/png, image/jpeg, image/avif"
							helperText="JPG, PNG, or AVIF. Max {maxFileSizeMB}MB."
							on:change={handleFileSelect}
						/>
					</div>
				</div>

				<div class="row middle-xxs gap-2">
					<Button on:click={upload} disabled={!selectedFile || uploading} loading={uploading}>
						{uploading ? "Uploading..." : "Upload"}
					</Button>
					{#if avatarUrl}
						<Button variant="danger" size="sm" on:click={removeAvatar}>Remove</Button>
					{/if}
					<a href="/account/settings" class="muted-color text-small">Back to general settings</a>
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
	}

	.preview-img {
		width: 128px;
		height: 128px;
		border-radius: 50%;
		object-fit: cover;
	}
</style>
