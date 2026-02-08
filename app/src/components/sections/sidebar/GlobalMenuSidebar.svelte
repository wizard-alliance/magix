<script lang="ts">
	import Avatar from "$components/modules/avatar.svelte"
	const avatarExample = "https://image.api.playstation.com/vulcan/ap/rnd/202209/2715/SWj7rvM10WcLZdsMWjH0PW30.png"
</script>

<div class="global-menu__sidebar">
	<div class="top">
		<div class="scrollable padding-top-2">
			<Avatar name={app.Meta.app.name} data-tip-icon="fa-circle-info" data-tip-pos="right" data-tip="Go to project: 0" size="md" />
			<Avatar name="b" data-tip-icon="fa-circle-info" data-tip-pos="right" data-tip="Go to project: 1" size="md" />
			<Avatar name="c" data-tip-icon="fa-circle-info" data-tip-pos="right" data-tip="Go to project: 2" size="md" />
			<Avatar name="d" href="#" data-tip-icon="fa-circle-info" data-tip-pos="right" data-tip="Go to project: 3" size="md" />
			<Avatar name="e" href="#" src={avatarExample} data-tip-icon="fa-circle-info" data-tip-pos="right" data-tip="Go to project: 4" size="md" />
		</div>
	</div>

	<div class="bottom">
		<div class="scrollable padding-top-6 padding-bottom-2">
			<Avatar name="f" data-tip-icon="fa-circle-plus" data-tip-pos="right" data-tip="Create a new project" size="md" />
		</div>
	</div>
</div>

<style lang="scss" scoped>
	.global-menu__sidebar {
		height: 100%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;

		.scrollable {
			display: flex;
			flex-direction: column;
			align-items: center;
			width: 100%;
			height: 100%;
			overflow: visible;
			gap: calc(var(--gutter) * 2);
		}

		.top {
			flex: 1;
		}

		.bottom {
			flex: none;
		}
	}
</style>
