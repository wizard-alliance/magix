<script lang="ts">
	export let nav: { type: string; label: string; icon?: string; href: string }[][] = []

	$: left = nav[0] || []
	$: right = nav[1] || []
</script>

<nav class="page-nav">
	<div class="row middle-xs start-xxs gap-2">
		<div class="col-xxs">
			<div class="row gap-2">
				{#each left as item}
					<a href={item.href}>
						{#if item.icon}<i class={item.icon}></i>{/if}
						<span>{item.label}</span>
					</a>
				{/each}
			</div>
		</div>

		<div class="col">
			<div class="row gap-2 end-xxs">
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
	.page-nav {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: var(--page-header-height);
		transform: translateY(var(--page-nav-offset-y));

		display: flex;
		align-items: center;
		justify-content: space-between;

		background-color: var(--bg-color);
		padding: calc(var(--gutter) * 0) calc(var(--gutter) * 2);
		border-bottom: var(--border);

		font-size: var(--font-size);
		font-weight: 300;

		a {
			display: flex;
			align-items: center;
			color: var(--muted-color);
			font-size: inherit;
			font-weight: inherit;
			text-decoration: none;
			gap: calc(var(--gutter) * 1);

			i {
				opacity: 0.7;
			}

			&:hover {
				color: var(--white);
			}
		}

		span {
			font-size: inherit;
			font-weight: inherit;
		}
	}
</style>
