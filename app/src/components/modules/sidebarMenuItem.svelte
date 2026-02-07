<script lang="ts">
	import { page } from "$app/stores"

	export let href: string = "#"
	export let icon: string = "fa-circle"
	export let label: string = ""
	export let unread: number | null = null
	export let children: any[] = []

	$: isActive = $page.url.pathname === href
	$: isActiveSub = !isActive && $page.url.pathname.startsWith(`${href}/`)
</script>

<div class="sidebar-menu-item">
	<a {href} data-unread={unread} class:active={isActive} class:active-sub={isActiveSub}>
		<i class={`fa-light ${icon}`}></i>
		<span>{label}</span>
		<i class="indicator fa-light fa-arrow-right"></i>
	</a>
	{#if children.length > 0}
		<div class="sidebar-menu-children">
			{#each children as child}
				<a href={child.href} data-unread={child.unread} class:active={$page.url.pathname === child.href}>
					<i class={`fa-light ${child.icon}`}></i>
					<span>{child.label}</span>
					<i class="indicator fa-light fa-arrow-right"></i>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	span {
		font-size: inherit;
		font-weight: inherit;
	}

	a {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--white);
		gap: calc(var(--gutter) * 1.5);
		margin-bottom: calc(var(--gutter) * 1);
		user-select: none;

		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
		text-decoration: none;

		font-size: var(--font-size);
		font-weight: 300;

		i {
			font-size: var(--font-size-small);
			color: var(--muted-color);
		}

		&:not([data-unread])::after,
		&[data-unread="0"]::after {
			opacity: 0 !important;
		}

		&::after {
			--size: 18px;
			content: attr(data-unread);
			display: block;
			position: absolute;
			right: calc(var(--gutter) * 2);
			min-width: var(--size);
			height: var(--size);
			background-color: var(--accent-color);
			color: var(--primary-color);
			font-size: var(--font-size-small);
			font-weight: 600;
			line-height: var(--size);
			text-align: center;
			border-radius: 99999px;
			box-sizing: border-box;
			pointer-events: none;
			user-select: none;
			opacity: 0.85;
			transform: translateX(calc(var(--gutter) * 0));
			transition:
				opacity 600ms cubic-bezier(0, 0, 0, 1),
				transform 600ms cubic-bezier(0, 0, 0, 1);
		}
	}

	.sidebar-menu-children {
		position: relative;
		margin-left: calc(var(--gutter) * 1);

		&:before {
			content: "";
			position: absolute;
			left: calc(var(--gutter) * 2);
			top: 0;
			background: var(--tertiary-color);
			width: 1.9px;
			height: 100%;
			border-radius: 99999px;
		}
	}

	.sidebar-menu-children > a {
		padding-left: calc(var(--gutter) * 5);
		font-size: var(--font-size-small);
		font-weight: 400;
		color: var(--red);

		&:before {
			--x: 8px;
			content: "";
			position: absolute;
			left: calc(var(--x) * 0 + var(--gutter) * 2);
			background: var(--tertiary-color);
			height: 1.9px;
			width: var(--x);
			border-radius: 99999px;
		}

		i {
			color: var(--muted-color-2);
		}

		span {
			color: var(--muted-color);
		}
	}

	a .indicator {
		opacity: 0;
		pointer-events: none;
		position: absolute;
		right: calc(var(--gutter) * 2);
		font-size: var(--font-size-small);
		color: var(--muted-color);
		transform: translateX(calc(var(--gutter) * 1));
		transition:
			opacity 600ms cubic-bezier(0, 0, 0, 1),
			transform 600ms cubic-bezier(0, 0, 0, 1);
	}

	a:hover {
		i:first-child {
			color: var(--accent-color);
		}
		.indicator {
			opacity: 0.7;
			transform: translateX(calc(var(--gutter) * 0.5));
		}

		&::after {
			opacity: 1;
			transform: translateX(calc(var(--gutter) * -2.5));
		}

		span {
			color: var(--white);
			opacity: 1;
		}
	}

	a.active {
		i:first-child {
			color: var(--accent-color);
		}
		span {
			color: var(--white);
		}
	}

	a.active-sub {
		i:first-child {
			color: var(--accent-color);
		}
		span {
			color: var(--muted-color);
		}
	}
</style>
