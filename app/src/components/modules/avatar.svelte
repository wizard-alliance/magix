<script lang="ts">
	export let name: string = ""
	export let src: string = ""
	export let size: "xsm" | "sm" | "md" | "128" | "256" | "lg" = "md"
	export let href: string = ""
	export let tip: string = ""
	export let tipPos: "top" | "right" | "bottom" | "left" = "top"

	$: initials = name
		.split(" ")
		.filter((n) => n.length)
		.map((n) => n[0])
		.slice(0, 2)
		.join("")
		.toUpperCase()
</script>

{#snippet avatarContent()}
	{#if src}
		<img class="avatar-content" {src} alt={name} />
	{:else if initials}
		<span class="avatar-content">{initials}</span>
	{/if}
{/snippet}

{#if href}
	<a {href} class={`avatar avatar-${size}`} data-tip={tip} data-tip-pos={tipPos} aria-label={name || tip || undefined} {...$$restProps}>
		{@render avatarContent()}
	</a>
{:else}
	<div class={`avatar avatar-${size}`} data-tip={tip} data-tip-pos={tipPos} aria-label={name || tip || undefined} {...$$restProps}>
		{@render avatarContent()}
	</div>
{/if}

<style>
	.avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: var(--quaternary-color);
		color: var(--white);
		font-weight: 600;
		user-select: none;
		text-decoration: none;
		position: relative;

		width: var(--avatar-size, 48px);
		height: var(--avatar-size, 48px);
		font-size: var(--font-size-small);

		.avatar-content {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			overflow: hidden;
			border-radius: 99999px;
		}
	}

	a.avatar {
		cursor: pointer;
		transition: opacity 0.15s ease;

		&:hover {
			opacity: 0.85;
		}
	}

	.avatar-xsm {
		--avatar-size: 24px;
	}

	.avatar-sm {
		--avatar-size: 32px;
	}

	.avatar-md {
		--avatar-size: 48px;
	}

	.avatar-lg {
		--avatar-size: 64px;
	}

	.avatar-128 {
		--avatar-size: 128px;
	}

	.avatar-256 {
		--avatar-size: 256px;
	}

	img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
