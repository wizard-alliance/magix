<script lang="ts">
	import { onMount } from "svelte"

	let title = "Loading..."
	let profile: any = null
	let appName = "App"
	let nickname = "Loading..."

	onMount(async () => {
		profile = await app.Auth.me()
		nickname = profile.info.username || "Account"
		title = `Menu`
	})
</script>

<div class="main-menu__sidebar">
	<div class="account">
		<div class="avatar"></div>
		<div class="name">{nickname}</div>
		<i class="indicator fa-light fa-angle-down"></i>
	</div>

	<div class="scrollable">
		<nav>
			<h3 class="title">{appName}</h3>

			<a href="/account/profile">
				<i class="fa-light fa-share"></i>
				<span>News</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>

			<a href="/account/profile/settings">
				<i class="fa-light fa-house"></i>
				<span>Dashboard</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>

			<a href="/admin/dashboard">
				<i class="fa-light fa-newspaper"></i>
				<span>Deep dive</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>

			<a href="/admin/dashboard">
				<i class="fa-light fa-building"></i>
				<span>Research</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>
		</nav>
		<div class="spacer"></div>

		<nav>
			<h3 class="title">Account</h3>

			<a href="/account/profile">
				<i class="fa-light fa-user"></i>
				<span>Profile</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>

			<a href="/account/profile/settings">
				<i class="fa-light fa-cog"></i>
				<span>Settings</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>

			<a href="/admin/dashboard">
				<i class="fa-light fa-shield-check"></i>
				<span>Billing</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>
		</nav>
		<div class="spacer"></div>

		<nav>
			<a href="/admin/dashboard">
				<i class="fa-light fa-shield-check"></i>
				<span>Admin</span>
				<i class="indicator fa-light fa-arrow-right"></i>
			</a>
		</nav>
	</div>
</div>

<style>
	.spacer {
		width: 100%;
		height: 1px;
		background-color: var(--border-color);
		margin-top: calc(var(--gutter) * 1);
		margin-bottom: calc(var(--gutter) * 2);
	}

	.main-menu__sidebar {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 2);

		height: calc(100%);
		padding-bottom: var(--account-height);
	}

	.account {
		position: absolute;
		height: var(--account-height);
		display: flex;
		align-items: center;
		gap: calc(var(--gutter) * 1.5);
		padding: 0 calc(var(--gutter) * 2);
		border-top: var(--border);
		bottom: 0;
		width: 100%;
		background-color: var(--bg-color);
		z-index: 50;
		user-select: none;
		cursor: pointer;

		flex-wrap: nowrap;
		flex-direction: row;
		justify-content: flex-start;
		&:hover {
			background-color: var(--secondary-color);
			.indicator {
				color: white;
			}
		}

		.avatar {
			--size: 36px;
			display: flex;
			width: var(--size);
			height: var(--size);
			border-radius: 50%;
			background-color: var(--secondary-color);
		}

		.name {
			position: relative;
			top: 1px;
			font-size: 14px;
			font-weight: 500;
			color: var(--white);
		}

		.indicator {
			pointer-events: none;
			position: absolute;
			right: calc(var(--gutter) * 3);
			font-size: 12px;
			color: var(--text-muted);
			transform: translateX(calc(var(--gutter) * 1));
			transition:
				opacity 600ms cubic-bezier(0, 0, 0, 1),
				transform 600ms cubic-bezier(0, 0, 0, 1);
		}
	}

	nav:first-child {
		margin-top: calc(var(--gutter) * 2);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: calc(var(--gutter) * 0.5);
	}

	nav a,
	nav .title {
		user-select: none;
		font-size: 14px;
		font-weight: 300;
		padding: calc(var(--gutter) * 0.5) calc(var(--gutter) * 2);
		text-decoration: none;
	}

	nav .title {
		font-weight: 500;
		color: var(--text-muted);
		margin-bottom: calc(var(--gutter) * 0.5);
	}

	nav a {
		position: relative;
		display: flex;
		align-items: center;
		color: var(--white);
		gap: calc(var(--gutter) * 1.5);
		margin-bottom: calc(var(--gutter) * 1);

		i {
			font-size: 15px;
			color: var(--text-muted);
		}
	}

	nav a .indicator {
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

	nav a:hover {
		i:first-child {
			color: var(--accent-color);
		}
		.indicator {
			opacity: 0.7;
			transform: translateX(0);
		}
	}
</style>
