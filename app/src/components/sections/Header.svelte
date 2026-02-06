<script lang="ts">
	import { page } from "$app/stores"
	import Breadcrumbs from "$components/modules/breadcrumbs.svelte"

	$: title = app.Config.pageTitleFull()
	$: pageTitle = $page.data.title || app.Config.pageTitle || "Loading..."

	$: segments = $page.url.pathname.split(`/`).filter(Boolean)
	$: breadcrumbs = segments.map((seg, i) => ({
		href: `/${segments.slice(0, i + 1).join(`/`)}`,
		label: i === segments.length - 1 && $page.data.title ? $page.data.title : seg.replace(/-/g, ` `).replace(/\b\w/g, (c) => c.toUpperCase()),
	}))

	function toggleMenu() {
		app.UI.toggleMenu()
	}

	function toggleNotifications() {
		app.UI.toggleNotifications()
	}
</script>

<header>
	<div class="left-header">
		<a class="logo" href="/" aria-label={app.Config.name}>{app.Config.name}</a>
	</div>
	<div class="right-header">
		<div class="row middle-xs height-100p">
			<div class="col-xxs page-title__wrapper">
				<i class="hidden-xxs visible-sm icon fa-light fa-user"></i>
				<div class="hidden-xxs start-xxs visible-xs">
					<h3 class="page-title">{pageTitle}</h3>
					<Breadcrumbs items={breadcrumbs} />
				</div>
			</div>
			<nav class="col-xxs middle-xxs end-xxs height-100p main-nav">
				<div class="hidden-menu-desktop nav-button menu-toggle" aria-label="Click to view the main menu" on:click={toggleMenu}>
					<i class="fa-light fa-stream"></i>
				</div>

				<div class="nav-button bell sidebar-2-toggle" data-count="2" aria-label="Click to view notifications" on:click={toggleNotifications}>
					<i class="fa-light fa-bell"></i>
				</div>
			</nav>
		</div>
	</div>
</header>

<style lang="scss" scoped>
	.page-title__wrapper {
		display: flex;
		align-items: center;

		.icon {
			margin-right: calc(var(--gutter) * 1.75);
			color: var(--muted-color-2);
			font-size: var(--font-size-large);
		}

		& > div {
			.page-title {
				color: var(--text-color);
				margin: 0;
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
				font-size: var(--font-size);
				font-weight: 500;
			}
		}
	}

	.logo {
		position: relative;
		display: inline-block;
		text-decoration: none;
		font-weight: 600;
		color: var(--muted-color);
		background-color: var(--border-color);
		border-radius: var(--border-radius);
		font-size: var(--font-size-small);
		text-transform: uppercase;
		width: auto;
		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
	}

	.main-nav {
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1);
	}

	.nav-button {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		aspect-ratio: 1 / 1;

		color: var(--muted-color);
		cursor: pointer;
		text-decoration: none;

		background: transparent;
		border-radius: var(--border-radius);
		border: 1.5px solid transparent;

		font-size: var(--font-size-large);
		color: var(--muted-color);

		i {
			font-size: inherit;
			color: inherit;
		}

		&:hover {
			color: var(--text-color);
			border-color: var(--tertiary-color);
		}
	}

	:global(.app[data-menu-open="true"]) .menu-toggle {
		color: var(--white);
		background: var(--border-color);
		border-color: var(--tertiary-color);
	}

	:global(.app[data-notifications-open="true"]) .sidebar-2-toggle {
		color: var(--white);
		background: var(--border-color);
		border-color: var(--tertiary-color);
	}

	.bell {
		&[data-count="0"],
		&[data-count=""] {
			&:after {
				opacity: 0 !important;
				visibility: hidden !important;
			}
		}

		&:after {
			--size: 22px;

			content: attr(data-count);
			position: absolute;
			top: -3px;
			right: -1px;
			background: var(--green);
			color: var(--white);
			font-size: var(--font-size-small);
			width: var(--size);
			height: var(--size);
			border-radius: 9999px;
			display: flex;
			align-items: center;
			justify-content: center;
			font-weight: 600;
			line-height: 0;
			border: 3px solid var(--bg-color-secondary);
		}
	}
</style>
