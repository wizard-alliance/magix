<script lang="ts">
	import { app } from "$lib/app"
	import { onMount } from "svelte"

	let email = ""
	let status = ""
	let loading = false

	onMount(() => {
		app.Config.pageTitle = "Reset Password"
	})

	const submit = async () => {
		loading = true
		status = ""
		try {
			// Placeholder until reset endpoint exists
			status = `If an account exists for ${email}, a reset link will be sent.`
		} catch (error) {
			status = `Unable to start reset: ${(error as Error).message}`
		} finally {
			loading = false
		}
	}
</script>

<section class="panel">
	<h1>Reset Password</h1>
	<form class="stack" on:submit|preventDefault={submit}>
		<label>
			<span>Email</span>
			<input type="email" name="email" bind:value={email} required />
		</label>
		<button type="submit" disabled={loading}>Send reset link</button>
	</form>
	{#if status}
		<p class="status">{status}</p>
	{/if}
</section>

<style>
	.panel {
		max-width: 420px;
		margin: 0 auto;
		background: #0f0f14;
		padding: calc(var(--gutter) * 2);
		border-radius: 12px;
		border: 1px solid #222230;
	}

	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--gutter);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	input {
		background: #0d0d12;
		border: 1px solid #2a2a35;
		border-radius: 8px;
		color: white;
		padding: 10px 12px;
	}

	button {
		background: linear-gradient(135deg, #f97316, #f59e0b);
		color: white;
		border: none;
		border-radius: 10px;
		padding: 12px;
		cursor: pointer;
		font-weight: 600;
	}

	.status {
		margin-top: var(--gutter);
		color: #fbbf24;
	}
</style>
