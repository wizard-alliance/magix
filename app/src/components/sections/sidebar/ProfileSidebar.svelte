<script lang="ts">
	export let message = "Profile"
</script>

<div class="profile-sidebar">
	<h3>{message}</h3>
	<nav>
		<a href="/account/profile">Overview</a>
		<a href="/account/settings">Settings</a>
	</nav>
</div>

<style>
	.profile-sidebar {
		padding: var(--gutter);
	}

	h3 {
		margin-bottom: var(--gutter);
		color: var(--white);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	nav a {
		padding: 8px 12px;
		border-radius: 6px;
		color: var(--white);
		text-decoration: none;
	}

	nav a:hover {
		background: var(--secondary-color);
	}
</style>
