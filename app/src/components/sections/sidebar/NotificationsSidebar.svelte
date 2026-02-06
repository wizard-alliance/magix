<script lang="ts">
	import { onMount, onDestroy } from "svelte"
	import NotificationRow from "$components/modules/notificationRow.svelte"

	let sidebarEl: HTMLDivElement

	function handleClickOutside(e: MouseEvent) {
		if (sidebarEl && !sidebarEl.contains(e.target as Node)) {
			const appEl = document.querySelector(".app")
			if (appEl?.getAttribute("notifications-open") === "true") {
				appEl.setAttribute("notifications-open", "false")
			}
		}
	}

	onMount(() => {
		document.addEventListener("click", handleClickOutside, true)
	})

	onDestroy(() => {
		if (typeof document !== "undefined") {
			document.removeEventListener("click", handleClickOutside, true)
		}
	})

	// Placeholder notifications for demo
	const notifications = [
		{ icon: "fa-comment", title: "New comment on your post", message: "Alex replied to your thread", time: "2 min ago", unread: true, href: "#" },
		{ icon: "fa-user-plus", title: "New follower", message: "Jordan started following you", time: "15 min ago", unread: true, href: "#" },
		{ icon: "fa-check-circle", title: "Task completed", message: "Deploy to staging finished", time: "1 hour ago", unread: false, href: "#" },
		{ icon: "fa-triangle-exclamation", title: "Build warning", message: "3 deprecation notices found", time: "3 hours ago", unread: false, href: "#" },
	]
</script>

<div class="notifications__sidebar" bind:this={sidebarEl}>
	<div class="notifications-header">
		<h3 class="title">Notifications</h3>
		<button class="mark-read">Mark all read</button>
	</div>

	<div class="scrollable">
		{#each notifications as notification}
			<NotificationRow
				icon={notification.icon}
				title={notification.title}
				message={notification.message}
				time={notification.time}
				unread={notification.unread}
				href={notification.href}
			/>
		{/each}

		{#if notifications.length === 0}
			<div class="empty">
				<i class="fa-light fa-bell-slash muted-color-2"></i>
				<span>No notifications</span>
			</div>
		{/if}
	</div>
</div>

<style lang="scss" scoped>
	.notifications__sidebar {
		position: relative;
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.notifications-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 calc(var(--gutter) * 2);
		border-bottom: var(--border);
		height: var(--page-header-height);

		.title {
			font-size: var(--font-size);
			font-weight: 600;
			color: var(--white);
			margin: 0;
		}

		.mark-read {
			background: none;
			border: none;
			color: var(--accent-color);
			font-size: var(--font-size-small);
			cursor: pointer;
			padding: 0;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.scrollable {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: calc(var(--gutter) * 1.5);
		padding: calc(var(--gutter) * 6) calc(var(--gutter) * 2);
		color: var(--muted-color-2);

		i {
			font-size: 2rem;
		}

		span {
			font-size: var(--font-size-small);
		}
	}
</style>
