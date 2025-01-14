<script lang="ts">
	import { walletAddress, SNT_TOKEN } from '$lib/viem';

	// Dummy data for demonstration
	const vaults = [
		{
			id: 1,
			staked: '2000',
			rewards: '50',
			apr: '12.5',
			lockPeriod: '30 days',
			lockEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString()
		},
		{
			id: 2,
			staked: '1500',
			rewards: '37',
			apr: '12.5',
			lockPeriod: '30 days',
			lockEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toLocaleDateString()
		},
		{
			id: 3,
			staked: '1500',
			rewards: '37',
			apr: '12.5',
			lockPeriod: '30 days',
			lockEnd: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString()
		}
	];

	function handleUnstake(vaultId: number) {
		alert(`Unstaking functionality for vault #${vaultId} will be implemented later`);
	}

	function handleClaimRewards(vaultId: number) {
		alert(`Claiming rewards for vault #${vaultId} will be implemented later`);
	}

	function isLockExpired(lockEnd: string): boolean {
		return new Date(lockEnd) < new Date();
	}
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8">
			<h2 class="text-base font-semibold leading-7 text-gray-900">Manage Your Staking Vaults</h2>
			<p class="mt-1 text-sm leading-6 text-gray-500">
				View and manage your staking positions. You can unstake your tokens after the lock period ends.
			</p>

			<!-- Table view (desktop) -->
			<div class="mt-8 hidden sm:block">
				<div class="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
					<table class="min-w-full divide-y divide-gray-300">
						<thead class="bg-gray-50">
							<tr>
								<th
									scope="col"
									class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
								>
									Vault ID
								</th>
								<th
									scope="col"
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
								>
									Staked Amount
								</th>
								<th
									scope="col"
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
								>
									Available Rewards
								</th>
								<th
									scope="col"
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
								>
									APR
								</th>
								<th
									scope="col"
									class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
								>
									Lock Period
								</th>
								<th
									scope="col"
									class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
								>
									Lock End
								</th>
								<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each vaults as vault}
								<tr>
									<td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
										#{vault.id}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
										{vault.staked} {SNT_TOKEN.symbol}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
										{vault.rewards} {SNT_TOKEN.symbol}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-500">
										{vault.apr}%
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
										{vault.lockPeriod}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
										<span
											class={isLockExpired(vault.lockEnd)
												? 'text-green-600 font-medium'
												: 'text-gray-500'}
										>
											{vault.lockEnd}
										</span>
									</td>
									<td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
										<div class="flex justify-end gap-x-3">
											<button
												on:click={() => handleClaimRewards(vault.id)}
												class="text-blue-600 hover:text-blue-900"
											>
												Claim Rewards
											</button>
											<button
												on:click={() => handleUnstake(vault.id)}
												class="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
												disabled={!isLockExpired(vault.lockEnd)}
											>
												Unstake
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Card view (mobile) -->
			<div class="mt-8 space-y-4 sm:hidden">
				{#each vaults as vault}
					<div class="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
						<div class="px-4 py-5 sm:px-6">
							<div class="flex justify-between items-center">
								<h3 class="text-sm font-medium text-gray-900">Vault #{vault.id}</h3>
								<span class="text-sm text-gray-500">{vault.lockPeriod}</span>
							</div>
						</div>
						<div class="px-4 py-4 space-y-3">
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">Staked Amount</span>
								<span class="text-sm font-medium text-gray-900">{vault.staked} {SNT_TOKEN.symbol}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">Available Rewards</span>
								<span class="text-sm font-medium text-gray-900">{vault.rewards} {SNT_TOKEN.symbol}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">APR</span>
								<span class="text-sm font-medium text-gray-900">{vault.apr}%</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">Lock End</span>
								<span
									class={isLockExpired(vault.lockEnd)
										? 'text-sm font-medium text-green-600'
										: 'text-sm font-medium text-gray-900'}
								>
									{vault.lockEnd}
								</span>
							</div>
						</div>
						<div class="px-4 py-4 flex gap-3">
							<button
								on:click={() => handleClaimRewards(vault.id)}
								class="flex-1 rounded-lg bg-white px-2 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-50"
							>
								Claim Rewards
							</button>
							<button
								on:click={() => handleUnstake(vault.id)}
								class="flex-1 rounded-lg bg-white px-2 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
								disabled={!isLockExpired(vault.lockEnd)}
							>
								Unstake
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="mx-auto mt-16 max-w-2xl text-center">
			<div class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">
					Connect your wallet to manage your staking positions
				</p>
			</div>
		</div>
	{/if}
</div> 