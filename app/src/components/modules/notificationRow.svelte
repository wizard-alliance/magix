<script lang="ts">
	export let icon: string = "fa-bell"
	export let title: string = ""
	export let message: string = ""
	export let time: string = ""
	export let unread: boolean = false
	export let href: string = ""
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<a class="notification-row" class:unread {href}>
	<div class="notification-icon">
		<i class={`fa-light ${icon}`}></i>
	</div>
	<div class="notification-content">
		<div class="notification-title">{title}</div>
		{#if message}
			<div class="notification-message">{message}</div>
		{/if}
		{#if time}
			<div class="notification-time">{time}</div>
		{/if}
	</div>
</a>

<style lang="scss" scoped>
	.notification-row {
		position: relative;
		display: flex;
		align-items: flex-start;
		gap: calc(var(--gutter) * 1.5);
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 2);
		text-decoration: none;
		cursor: pointer;
		border-left: 2px solid transparent;
		transition: background-color 200ms ease;

		&:hover {
			background-color: var(--secondary-color);
		}

		&.unread {
			border-left-color: var(--accent-color);
			background-color: var(--bg-color);
		}
	}

	.notification-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--border-radius);
		background-color: var(--tertiary-color);
		color: var(--muted-color);

		i {
			font-size: var(--font-size-small);
		}

		.unread & {
			color: var(--accent-color);
			background-color: color-mix(in srgb, var(--accent-color) 12%, transparent);
		}
	}

	.notification-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.notification-title {
		font-size: var(--font-size-small);
		font-weight: 500;
		color: var(--white);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;

		.unread & {
			font-weight: 600;
		}
	}

	.notification-message {
		font-size: var(--font-size-small);
		font-weight: 300;
		color: var(--muted-color);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.notification-time {
		font-size: var(--font-size-small);
		color: var(--muted-color-2);
		margin-top: 2px;
	}
</style>
