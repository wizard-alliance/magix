<script lang="ts">
	import { page } from "$app/stores"

	export let href: string = "#"
	export let icon: string = "fa-circle"
	export let label: string = ""
	export let unread: number | null = null
	export let exact: boolean = true

	$: isActive = exact ? $page.url.pathname === href : $page.url.pathname === href || $page.url.pathname.startsWith(`${href}/`)
	$: isActiveSub = !isActive && $page.url.pathname.startsWith(`${href}/`)
</script>

<a {href} data-unread={unread} class:active={isActive} class:active-sub={isActiveSub}>
	<i class={`fa-light ${icon}`}></i>
	<span>{label}</span>
	<i class="indicator fa-light fa-arrow-right"></i>
</a>

<style>
	a {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--white);
		gap: calc(var(--gutter) * 1.5);
		margin-bottom: calc(var(--gutter) * 1);
		user-select: none;
		font-size: 14px;
		font-weight: 300;
		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
		text-decoration: none;

		i {
			font-size: 15px;
			color: var(--text-muted);
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
			font-size: 14px;
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

	a .indicator {
		opacity: 0;
		pointer-events: none;
		position: absolute;
		right: calc(var(--gutter) * 2);
		font-size: 12px;
		color: var(--text-muted);
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
			transform: translateX(0);
		}

		&::after {
			opacity: 1;
			transform: translateX(calc(var(--gutter) * -2.5));
		}
	}

	a.active {
		i:first-child {
			color: var(--accent-color);
		}
	}
</style>
