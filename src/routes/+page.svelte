<script lang="ts">
	import { onMount } from 'svelte';
	import { publicClient } from '$lib/viem';

	let blockNumber: bigint | null = null;

	onMount(async () => {
		blockNumber = await publicClient.getBlockNumber();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold">SNT Staking Demo App</h1>
	{#if blockNumber}
		<p class="mt-4">Current Block Number: {blockNumber.toString()}</p>
	{:else}
		<p class="mt-4">Loading block number...</p>
	{/if}
</div>
