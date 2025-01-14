<script lang="ts">
	import { walletAddress, formattedBalance, formattedSntBalance, network, SNT_TOKEN, sntError } from '$lib/viem';

	// Dummy data for demonstration
	const stakingStats = {
		totalStaked: '150000',
		totalRewards: '2500',
		activeVaults: 3,
		averageAPR: '12.5'
	};

	const userStats = {
		totalStaked: '5000',
		availableRewards: '125',
		vaults: [
			{ id: 1, staked: '2000', rewards: '50', apr: '12.5' },
			{ id: 2, staked: '1500', rewards: '37', apr: '12.5' },
			{ id: 3, staked: '1500', rewards: '37', apr: '12.5' }
		]
	};
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8 max-w-4xl">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Your Total Staked</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{userStats.totalStaked}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Available Rewards</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{userStats.availableRewards}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Active Vaults</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{userStats.vaults.length}
							</span>
						</div>
					</div>
				</div>

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Current APR</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{stakingStats.averageAPR}
							</span>
							<span class="text-sm font-semibold leading-6 text-gray-500">%</span>
						</div>
					</div>
				</div>
			</div>

			<div class="mt-8">
				<h2 class="text-base font-semibold leading-7 text-gray-900">Your Staking Vaults</h2>

				<!-- Table view (desktop) -->
				<div class="mt-4 hidden sm:block">
					<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
						<table class="min-w-full divide-y divide-gray-300">
							<thead>
								<tr>
									<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Vault ID</th>
									<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Staked Amount</th>
									<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Available Rewards</th>
									<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">APR</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								{#each userStats.vaults as vault}
									<tr>
										<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">#{vault.id}</td>
										<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{vault.staked} {SNT_TOKEN.symbol}</td>
										<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{vault.rewards} {SNT_TOKEN.symbol}</td>
										<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">{vault.apr}%</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Card view (mobile) -->
				<div class="mt-4 space-y-4 sm:hidden">
					{#each userStats.vaults as vault}
						<div class="overflow-hidden rounded-lg bg-white shadow ring-1 ring-gray-900/5">
							<div class="px-4 py-5">
								<div class="flex items-center justify-between">
									<h3 class="text-sm font-medium text-gray-900">Vault #{vault.id}</h3>
									<span class="text-sm font-medium text-gray-900">{vault.apr}% APR</span>
								</div>
								<div class="mt-4 space-y-3">
									<div class="flex justify-between">
										<span class="text-sm text-gray-500">Staked Amount</span>
										<span class="text-sm font-medium text-gray-900">{vault.staked} {SNT_TOKEN.symbol}</span>
									</div>
									<div class="flex justify-between">
										<span class="text-sm text-gray-500">Available Rewards</span>
										<span class="text-sm font-medium text-gray-900">{vault.rewards} {SNT_TOKEN.symbol}</span>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
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
