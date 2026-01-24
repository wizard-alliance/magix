<script lang="ts">
	export let size: "sm" | "md" | "lg" = "md"
	export let mode: "default" | "light" | "dark" = "default"
</script>

<div class={`spinner spinner-${size} spinner-${mode}`}></div>

<style>
	.spinner {
		border: 3px solid var(--secondary-color);
		border-top-color: var(--accent-color);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.spinner-light {
		border-color: rgba(255, 255, 255, 0.3);
		border-top-color: #fff;
	}

	.spinner-dark {
		border-color: rgba(0, 0, 0, 0.15);
		border-top-color: #222;
	}

	.spinner-sm {
		width: 16px;
		height: 16px;
		border-width: 2px;
	}

	.spinner-md {
		width: 24px;
		height: 24px;
	}

	.spinner-lg {
		width: 40px;
		height: 40px;
		border-width: 4px;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
