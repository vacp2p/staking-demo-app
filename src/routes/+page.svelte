<script lang="ts">
	import { walletAddress, formattedBalance, formattedSntBalance, network, SNT_TOKEN, sntError } from '$lib/viem';
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8 max-w-2xl">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Available Balance</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{$formattedBalance ?? '0.0000'}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">{network.currency}</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">SNT Balance</h3>
						{#if $sntError}
							<div class="mt-4 text-sm font-medium text-red-600 text-right">Error: {$sntError}</div>
						{:else}
							<div class="mt-4 flex items-baseline justify-end gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{$formattedSntBalance ?? '0.0000'}
								</span>
								<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mx-auto mt-16 max-w-2xl text-center">
			<div class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to view your balances</p>
			</div>
		</div>
	{/if}
</div>
