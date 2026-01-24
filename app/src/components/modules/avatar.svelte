<script lang="ts">
	export let name: string = ""
	export let src: string = ""
	export let size: "sm" | "md" | "lg" = "md"

	$: initials = name
		.split(" ")
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()
</script>

<div class={`avatar avatar-${size}`}>
	{#if src}
		<img {src} alt={name} />
	{:else}
		<span>{initials}</span>
	{/if}
</div>

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--secondary-color);
		color: var(--white);
		font-weight: 600;
		overflow: hidden;
	}

	.avatar-sm {
		width: 32px;
		height: 32px;
		font-size: 12px;
	}

	.avatar-md {
		width: 40px;
		height: 40px;
		font-size: 14px;
	}

	.avatar-lg {
		width: 56px;
		height: 56px;
		font-size: 18px;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
