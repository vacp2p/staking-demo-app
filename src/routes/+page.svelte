<script lang="ts">
	import { onMount } from 'svelte';
	import { publicClient } from '$lib/viem';
	import { walletAddress, formattedBalance, formattedSntBalance, network, SNT_TOKEN, sntError } from '$lib/viem';

	let blockNumber: bigint | null = null;

	onMount(async () => {
		blockNumber = await publicClient.getBlockNumber();
	});
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold">SNT Staking Demo App</h1>
	<div class="mt-4 space-y-2">
		{#if blockNumber}
			<p class="text-gray-700">Current Block Number: {blockNumber.toString()}</p>
		{:else}
			<p class="text-gray-500">Loading block number...</p>
		{/if}

		{#if $walletAddress}
			<div class="mt-6 space-y-3">
				<div class="flex items-center gap-2">
					<span class="text-gray-700">Testnet ETH Balance:</span>
					<span class="px-3 py-1 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg">
						{$formattedBalance ?? '0.0000'} {network.currency}
					</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="text-gray-700">Testnet SNT Balance:</span>
					{#if $sntError}
						<span class="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-lg">
							Error: {$sntError}
						</span>
					{:else}
						<span class="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg">
							{$formattedSntBalance ?? '0.0000'} {SNT_TOKEN.symbol}
						</span>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
