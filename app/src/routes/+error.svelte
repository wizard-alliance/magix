<script lang="ts">
	import { page } from "$app/stores"
	import Button from "$components/fields/button.svelte"

	$: status = $page.status
	$: error = $page.error as App.Error & { message: string }

	const errorMap: Record<number, { icon: string; title: string; description: string; color: string; type: string }> = {
		400: {
			icon: `fa-light fa-circle-xmark`,
			title: `Bad request`,
			description: `The server couldn't understand the request. Please check and try again.`,
			color: `var(--muted-color-2)`,
			type: `Client Error`,
		},
		401: {
			icon: `fa-light fa-right-to-bracket`,
			title: `Authentication required`,
			description: `Please log in to access this page.`,
			color: `var(--accent-color)`,
			type: `Auth Error`,
		},
		403: { icon: `fa-light fa-lock`, title: `Access denied`, description: `You don't have permission to view this page.`, color: `var(--accent-color)`, type: `Auth Error` },
		404: {
			icon: `fa-light fa-compass`,
			title: `Page not found`,
			description: `The page you're looking for doesn't exist or has been moved.`,
			color: `var(--muted-color-2)`,
			type: `Not Found`,
		},
		408: {
			icon: `fa-light fa-clock`,
			title: `Request timed out`,
			description: `The server took too long to respond. Please try again.`,
			color: `var(--muted-color-2)`,
			type: `Timeout`,
		},
		429: {
			icon: `fa-light fa-hourglass`,
			title: `Too many requests`,
			description: `You're sending requests too quickly. Please wait a moment.`,
			color: `var(--muted-color-2)`,
			type: `Rate Limited`,
		},
		500: {
			icon: `fa-light fa-bug`,
			title: `Something went wrong`,
			description: `An internal error occurred. Please try again later.`,
			color: `var(--red)`,
			type: `Server Error`,
		},
		502: {
			icon: `fa-light fa-cloud-exclamation`,
			title: `Bad gateway`,
			description: `The server received an invalid response. Please try again later.`,
			color: `var(--red)`,
			type: `Server Error`,
		},
		503: {
			icon: `fa-light fa-plug-circle-xmark`,
			title: `Service unavailable`,
			description: `The server is temporarily unavailable. Please try again shortly.`,
			color: `var(--red)`,
			type: `Server Error`,
		},
		504: {
			icon: `fa-light fa-satellite-dish`,
			title: `Gateway timeout`,
			description: `The server didn't respond in time. Please try again later.`,
			color: `var(--red)`,
			type: `Server Error`,
		},
	}

	const fallback = {
		icon: `fa-light fa-triangle-exclamation`,
		title: `Something went wrong`,
		description: `An unexpected issue occurred.`,
		color: `var(--muted-color)`,
		type: `Error`,
	}

	$: info = errorMap[status] ?? fallback
	$: showTechnicalMessage = error?.message && error.message !== info.description
</script>

<div class="page error-page">
	<div class="error-container">
		<i class="error-icon {info.icon}" style:color={info.color}></i>

		<span class="status-code">{status}</span>

		<h1>{info.title}</h1>

		<p class="description margin-top-4">{info.description}</p>

		{#if showTechnicalMessage}
			<p class="technical">{error.message}</p>
		{/if}

		<div class="actions margin-top-4">
			<Button variant="secondary" on:click={() => history.back()}>
				<i class="fa-light fa-arrow-left"></i> <span>Go Back</span>
			</Button>
			<Button variant="primary" href="/">
				<i class="fa-light fa-house"></i> <span>Go Home</span>
			</Button>
		</div>
	</div>
</div>

<style lang="scss">
	.error-page {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: calc(var(--gutter) * 4);
	}

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: calc(var(--gutter) * 1.5);
		max-width: 440px;
	}

	.error-icon {
		font-size: 3.5rem;
		margin-bottom: calc(var(--gutter) * 0.5);
		opacity: 0.9;
	}

	.status-code {
		font-size: 4rem;
		font-weight: 700;
		color: var(--muted-color-2);
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.error-type {
		font-size: var(--font-size-small);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		opacity: 0.85;
	}

	h1 {
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text-color);
	}

	.description {
		color: var(--muted-color);
		font-size: var(--font-size-small);
		line-height: 1.6;
	}

	.technical {
		color: var(--muted-color-2);
		font-size: var(--font-size-small);
		background: var(--secondary-color);
		border: var(--border);
		border-radius: var(--border-radius);
		padding: calc(var(--gutter) * 1.5) calc(var(--gutter) * 2);
		width: 100%;
		word-break: break-word;
	}

	.actions {
		display: flex;
		gap: calc(var(--gutter) * 2);
		margin-top: calc(var(--gutter) * 2);
	}
</style>
