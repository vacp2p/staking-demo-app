<script lang="ts">
	import { walletAddress, SNT_TOKEN, userVaults, vaultAccounts, rewardsBalance, formattedTotalRewardsBalance } from '$lib/viem';
	import { formatUnits, type Address } from 'viem';
	import UnstakingModal from '$lib/components/UnstakingModal.svelte';
	import { goto } from '$app/navigation';
	import { openAddressExplorer } from '$lib/utils';

	let isUnstakingModalOpen = false;
	let selectedVaultAddress: Address | undefined;
	let selectedVaultId = 0;

	function shortenAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function openEtherscan(address: string) {
		openAddressExplorer(address as Address);
	}

	function formatAmount(amount: bigint): string {
		return Number(formatUnits(amount, SNT_TOKEN.decimals)).toFixed(2);
	}

	function formatRewardsAmount(amount: bigint): string {
		return Number(formatUnits(amount, 18)).toFixed(2);
	}

	function handleUnstake(vault: Address, vaultId: number) {
		selectedVaultAddress = vault;
		selectedVaultId = vaultId;
		isUnstakingModalOpen = true;
	}

	function handleCloseUnstakingModal() {
		isUnstakingModalOpen = false;
		selectedVaultAddress = undefined;
		selectedVaultId = 0;
	}

	function isLocked(vault: Address): boolean {
		const account = $vaultAccounts[vault];
		if (!account) return false;
		return account.lockUntil > BigInt(Math.floor(Date.now() / 1000));
	}

	function formatUnlockDate(vault: Address): string {
		const account = $vaultAccounts[vault];
		if (!account || account.lockUntil === 0n) return '-';
		const date = new Date(Number(account.lockUntil) * 1000);
		return date.toLocaleString();
	}

	function formatRemainingLock(vault: Address): string {
		const account = $vaultAccounts[vault];
		if (!account || account.lockUntil === 0n) return '-';

		const now = BigInt(Math.floor(Date.now() / 1000));
		if (account.lockUntil <= now) return '-';

		const remainingSeconds = Number(account.lockUntil - now);
		const days = Math.floor(remainingSeconds / (24 * 3600));

		if (days > 0) {
			return `${days} day${days > 1 ? 's' : ''}`;
		}

		const hours = Math.floor(remainingSeconds / 3600);
		const minutes = Math.floor((remainingSeconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}

		return `${minutes}m`;
	}

	function handleLockClick(vault: Address) {
		if (
			!isLocked(vault) &&
			$vaultAccounts[vault]?.stakedBalance &&
			$vaultAccounts[vault].stakedBalance > 0n
		) {
			goto('/stake?vault=' + vault);
		}
	}

	function handleStakeClick(vault: Address) {
		if (!isLocked(vault)) {
			goto('/stake?stakeVault=' + vault);
		}
	}
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8">
			<h2 class="text-base font-semibold leading-7 text-gray-900">Manage Your Staking Vaults</h2>
			<p class="mt-1 text-sm leading-6 text-gray-500">
				View and manage your staking positions. You can unstake your tokens after the lock period
				ends.
			</p>

			<!-- Table view (desktop) -->
			<div class="mt-8 hidden sm:block">
				<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
					<table class="min-w-full divide-y divide-gray-300">
						<thead class="bg-gray-50">
							<tr>
								<th
									scope="col"
									class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
								>
									Vault ID
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Address
								</th>
								<th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
									Staked Amount
								</th>
								<th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
									MPs
								</th>
								<th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
									Max MPs
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Remaining Lock
								</th>
								<th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
									Karma Rewards
								</th>
								<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each $userVaults as vault, i}
								<tr>
									<td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
										<div class="flex items-center gap-2">
											{#if isLocked(vault)}
												<svg
													class="h-4 w-4 text-blue-600"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
													/>
												</svg>
											{:else}
												<button
													class="hover:text-blue-600"
													on:click={() => handleLockClick(vault)}
													disabled={!$vaultAccounts[vault]?.stakedBalance ||
														$vaultAccounts[vault].stakedBalance === 0n}
													class:opacity-50={!$vaultAccounts[vault]?.stakedBalance ||
														$vaultAccounts[vault].stakedBalance === 0n}
													class:cursor-not-allowed={!$vaultAccounts[vault]?.stakedBalance ||
														$vaultAccounts[vault].stakedBalance === 0n}
												>
													<svg
														class="h-4 w-4 text-gray-400"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
														/>
													</svg>
												</button>
											{/if}
											#{i + 1}
										</div>
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
										<button
											class="text-blue-600 hover:text-blue-900"
											on:click={() => openEtherscan(vault)}
										>
											{shortenAddress(vault)}
										</button>
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">
										{$vaultAccounts[vault]?.stakedBalance
											? formatAmount($vaultAccounts[vault].stakedBalance)
											: '0.00'}
										{SNT_TOKEN.symbol}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">
										{$vaultAccounts[vault]?.mpAccrued
											? formatAmount($vaultAccounts[vault].mpAccrued)
											: '0.00'} MP
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">
										{$vaultAccounts[vault]?.maxMP
											? formatAmount($vaultAccounts[vault].maxMP)
											: '0.00'} MP
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
										{#if isLocked(vault)}
											<div class="group relative inline-block">
												<span>{formatRemainingLock(vault)}</span>
												<div
													class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 transform group-hover:block"
												>
													<div
														class="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white"
													>
														{formatUnlockDate(vault)}
													</div>
													<div
														class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"
													></div>
												</div>
											</div>
										{:else}
											{formatRemainingLock(vault)}
										{/if}
									</td>
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm text-gray-900">
										{$rewardsBalance[vault] 
											? formatRewardsAmount($rewardsBalance[vault])
											: '0.00'} KARMA
									</td>
									<td
										class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6"
									>
										<div class="flex items-center justify-end gap-2">
											<button
												on:click={() => handleUnstake(vault, i + 1)}
												class="rounded-lg bg-blue-50 px-2 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
												disabled={isLocked(vault) ||
													!$vaultAccounts[vault]?.stakedBalance ||
													$vaultAccounts[vault].stakedBalance === 0n}
											>
												{#if isLocked(vault)}
													Locked
												{:else if !$vaultAccounts[vault]?.stakedBalance || $vaultAccounts[vault].stakedBalance === 0n}
													Empty
												{:else}
													Unstake
												{/if}
											</button>
											{#if !isLocked(vault)}
												<button
													on:click={() => handleStakeClick(vault)}
													class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
												>
													<svg
														class="h-5 w-5"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="2"
														stroke="currentColor"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M12 4.5v15m7.5-7.5h-15"
														/>
													</svg>
												</button>
											{:else}
												<div class="h-8 w-8"></div>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

			<!-- Card view (mobile) -->
			<div class="mt-4 space-y-4 sm:hidden">
				{#each $userVaults as vault, i}
					<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
						<div class="px-4 py-5">
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									{#if isLocked(vault)}
										<svg
											class="h-4 w-4 text-blue-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
											/>
										</svg>
									{:else}
										<button
											class="hover:text-blue-600"
											on:click={() => handleLockClick(vault)}
											disabled={!$vaultAccounts[vault]?.stakedBalance ||
												$vaultAccounts[vault].stakedBalance === 0n}
											class:opacity-50={!$vaultAccounts[vault]?.stakedBalance ||
												$vaultAccounts[vault].stakedBalance === 0n}
											class:cursor-not-allowed={!$vaultAccounts[vault]?.stakedBalance ||
												$vaultAccounts[vault].stakedBalance === 0n}
										>
											<svg
												class="h-4 w-4 text-gray-400"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
												/>
											</svg>
										</button>
									{/if}
									<h3 class="text-sm font-medium text-gray-900">Vault #{i + 1}</h3>
								</div>
								<button
									class="text-sm text-blue-600 hover:text-blue-900"
									on:click={() => openEtherscan(vault)}
								>
									{shortenAddress(vault)}
								</button>
							</div>
							<div class="mt-4 space-y-3">
								<div class="flex justify-between">
									<span class="text-sm text-gray-500">Staked Amount</span>
									<span class="text-sm font-medium text-gray-900">
										{$vaultAccounts[vault]?.stakedBalance
											? formatAmount($vaultAccounts[vault].stakedBalance)
											: '0.00'}
										{SNT_TOKEN.symbol}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-500">MPs</span>
									<span class="text-sm font-medium text-gray-900">
										{$vaultAccounts[vault]?.mpAccrued
											? formatAmount($vaultAccounts[vault].mpAccrued)
											: '0.00'} MP
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-500">Max MPs</span>
									<span class="text-sm font-medium text-gray-900">
										{$vaultAccounts[vault]?.maxMP
											? formatAmount($vaultAccounts[vault].maxMP)
											: '0.00'} MP
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-500">Remaining Lock</span>
									<span class="text-sm font-medium text-gray-900">
										{#if isLocked(vault)}
											<div class="group relative inline-block">
												<span>{formatRemainingLock(vault)}</span>
												<div
													class="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 transform group-hover:block"
												>
													<div
														class="whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white"
													>
														{formatUnlockDate(vault)}
													</div>
													<div
														class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"
													></div>
												</div>
											</div>
										{:else}
											{formatRemainingLock(vault)}
										{/if}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-sm text-gray-500">Karma Rewards</span>
									<span class="text-sm font-medium text-gray-900">
										{$rewardsBalance[vault] 
											? formatRewardsAmount($rewardsBalance[vault])
											: '0.00'} KARMA
									</span>
								</div>
							</div>
							<div class="mt-4">
								<div class="flex items-center gap-2">
									<button
										on:click={() => handleUnstake(vault, i + 1)}
										class="flex-1 rounded-lg bg-blue-50 px-2 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
										disabled={isLocked(vault) ||
											!$vaultAccounts[vault]?.stakedBalance ||
											$vaultAccounts[vault].stakedBalance === 0n}
									>
										{#if isLocked(vault)}
											Locked
										{:else if !$vaultAccounts[vault]?.stakedBalance || $vaultAccounts[vault].stakedBalance === 0n}
											Empty
										{:else}
											Unstake
										{/if}
									</button>
									{#if !isLocked(vault)}
										<button
											on:click={() => handleStakeClick(vault)}
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
										>
											<svg
												class="h-5 w-5"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="2"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M12 4.5v15m7.5-7.5h-15"
												/>
											</svg>
										</button>
									{:else}
										<div class="h-8 w-8"></div>
									{/if}
								</div>
							</div>
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
					Connect your wallet to view your staking positions and rewards
				</p>
			</div>
		</div>
	{/if}
</div>

<UnstakingModal
	isOpen={isUnstakingModalOpen}
	onClose={handleCloseUnstakingModal}
	vaultAddress={selectedVaultAddress}
	vaultId={selectedVaultId}
/>
