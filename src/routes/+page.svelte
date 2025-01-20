<script lang="ts">
	import { walletAddress, formattedBalance, formattedSntBalance, network, SNT_TOKEN, sntError, userVaults, formattedTotalStaked, vaultStakedAmounts, formattedGlobalTotalStaked, fetchTotalStaked, fetchTokenPrice, tokenPriceUsd, globalTotalStaked, vaultMpBalances, formattedTotalMpBalance } from '$lib/viem';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatUnits } from 'viem';
	import { onMount } from 'svelte';

	const SNT_USD_RATE = 0.04298;

	// Dummy data for demonstration
	const stakingStats = {
		totalStaked: '150,000',
		totalRewards: '2,500',
		averageAPR: '100',
		globalStats: {
			totalSntStaked: '2,000,000',
			get totalValueUsd() {
				return Math.floor(Number(this.totalSntStaked.replace(/,/g, '')) * SNT_USD_RATE).toLocaleString()
			}
		}
	};

	const userStats = {
		totalStaked: '5,000',
		availableRewards: '125',
		vaults: [
			{ id: 1, staked: '2,000', rewards: '50', apr: '12.5' },
			{ id: 2, staked: '1,500', rewards: '37', apr: '12.5' },
			{ id: 3, staked: '1,500', rewards: '37', apr: '12.5' }
		]
	};

	// Calculate total value in USD
	$: totalValueUsd = $globalTotalStaked ? 
		Math.floor(Number(formatUnits($globalTotalStaked, SNT_TOKEN.decimals)) * $tokenPriceUsd).toLocaleString() : '0';

	function handleStartStaking() {
		goto('/stake');
	}

	function shortenAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function openEtherscan(address: string) {
		window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
	}

	function formatAmount(amount: bigint): string {
		return Number(formatUnits(amount, SNT_TOKEN.decimals)).toFixed(2);
	}

	// Fetch data when navigating to overview page
	$: if ($page.url.pathname === '/') {
		fetchTotalStaked();
		fetchTokenPrice();
	}

	onMount(() => {
		fetchTotalStaked();
		fetchTokenPrice();
	});
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8 max-w-4xl">
			<!-- First row -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#if $userVaults.length > 0}
					<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
						<div class="flex flex-col">
							<h3 class="text-sm font-medium leading-6 text-gray-500">Your Total Staked</h3>
							<div class="mt-4 flex items-baseline justify-end gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{$formattedTotalStaked}
								</span>
								<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
							</div>
						</div>
					</div>

					<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
						<div class="flex flex-col">
							<h3 class="text-sm font-medium leading-6 text-gray-500">Your Multiplier Points</h3>
							<div class="mt-4 flex items-baseline justify-end gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{$formattedTotalMpBalance}
								</span>
								<span class="text-sm font-semibold leading-6 text-gray-500">MPs</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="col-span-2 overflow-hidden rounded-xl bg-blue-50 p-6 shadow-sm ring-1 ring-blue-900/5">
						<button
							class="flex h-full w-full flex-col items-center justify-center gap-2"
							on:click={handleStartStaking}
						>
							<h3 class="text-lg font-semibold text-blue-900">Start Earning Rewards</h3>
							<p class="text-sm text-blue-700">Deploy your first staking vault to start earning rewards</p>
						</button>
					</div>
				{/if}

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Active Vaults</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{$userVaults.length}
							</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">MP Reward Rate</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{stakingStats.averageAPR}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">%</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Second row -->
			<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Total SNT Staked</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{$formattedGlobalTotalStaked}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Total Value Staked</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								${totalValueUsd}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">USD</span>
						</div>
					</div>
				</div>
			</div>

			{#if $userVaults.length > 0}
				<div class="mt-8">
					<h2 class="text-base font-semibold leading-7 text-gray-900">Your Staking Vaults</h2>

					<!-- Table view (desktop) -->
					<div class="mt-4 hidden sm:block">
						<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
							<table class="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Vault ID</th>
										<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">SNT Staked</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">MPs</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Rewards</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									{#each $userVaults as vault, i}
										<tr>
											<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">#{i + 1}</td>
											<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
												<button
													class="text-blue-600 hover:text-blue-900"
													on:click={() => openEtherscan(vault)}
												>
													{shortenAddress(vault)}
												</button>
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
												{$vaultStakedAmounts[vault] ? formatAmount($vaultStakedAmounts[vault]) : '0.00'} {SNT_TOKEN.symbol}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
												{$vaultMpBalances[vault] ? formatAmount($vaultMpBalances[vault]) : '0.00'} MP
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">-</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

					<!-- Card view (mobile) -->
					<div class="mt-4 space-y-4 sm:hidden">
						{#each $userVaults as vault, i}
							<div class="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
								<div class="px-4 py-5">
									<div class="flex items-center justify-between">
										<h3 class="text-sm font-medium text-gray-900">Vault #{i + 1}</h3>
										<button
											class="text-blue-600 hover:text-blue-900 text-sm"
											on:click={() => openEtherscan(vault)}
										>
											{shortenAddress(vault)}
										</button>
									</div>
									<div class="mt-4 space-y-3">
										<div class="flex justify-between">
											<span class="text-sm text-gray-500">Staked Amount</span>
											<span class="text-sm font-medium text-gray-900">
												{$vaultStakedAmounts[vault] ? formatAmount($vaultStakedAmounts[vault]) : '0.00'} {SNT_TOKEN.symbol}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-sm text-gray-500">MPs</span>
											<span class="text-sm font-medium text-gray-900">
												{$vaultMpBalances[vault] ? formatAmount($vaultMpBalances[vault]) : '0.00'} MP
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-sm text-gray-500">Rewards</span>
											<span class="text-sm font-medium text-gray-900">-</span>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<div class="mx-auto mt-16 max-w-2xl text-center">
			<div class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to view your staking positions and rewards</p>
			</div>
		</div>
	{/if}
</div>
