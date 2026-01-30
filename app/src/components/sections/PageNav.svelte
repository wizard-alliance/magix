<script lang="ts">
	export let nav: { type: string; label: string; icon?: string; href: string }[][] = []

	$: left = nav[0] || []
	$: right = nav[1] || []
</script>

<nav class="page-nav">
	<div class="row middle-xs start-xs">
		<div class="col-xs">
			<div class="row gap-2">
				{#each left as item}
					<a href={item.href}>
						{#if item.icon}<i class={item.icon}></i>{/if}
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		</div>

		<div class="col-xs">
			<div class="row gap-2 end-xs">
				{#each right as item}
					<a href={item.href}>
						{#if item.icon}<i class={item.icon}></i>{/if}
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		</div>
	</div>
</nav>

<style lang="scss" scoped>
	:global html {
		--page-nav-height: 50px;
	}

	.page-nav {
		position: absolute;
		top: var(--header-height);
		left: var(--main-offset-x);
		width: var(--main-width);
		height: var(--page-nav-height);

		display: flex;
		align-items: center;
		justify-content: space-between;

		background-color: var(--bg-color);
		padding: calc(var(--gutter) * 0) calc(var(--gutter) * 2);
		border-bottom: var(--border);
		z-index: 100;

		a {
			display: flex;
			align-items: center;
			color: var(--text-muted);
			font-size: 14px;
			text-decoration: none;
			gap: calc(var(--gutter) * 0.75);

			i {
				opacity: 0.7;
			}

			&:hover {
				color: var(--white);
			}
		}
	}
</style>
