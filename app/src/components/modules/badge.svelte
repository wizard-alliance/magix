<script lang="ts">
	export let text: string = ""
	export let variant: "default" | "success" | "warning" | "danger" = "default"
</script>

<span class={`badge badge-${variant}`}>{text}<slot /></span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		font-size: 12px;
		font-weight: 500;
		border-radius: 12px;
	}

	.badge-default {
		background: var(--secondary-color);
		color: var(--white);
	}

	.badge-success {
		background: rgba(34, 197, 94, 0.2);
		color: #22c55e;
	}

	.badge-warning {
		background: rgba(234, 179, 8, 0.2);
		color: #eab308;
	}

	.badge-danger {
		background: rgba(239, 68, 68, 0.2);
		color: #ef4444;
	}
</style>
