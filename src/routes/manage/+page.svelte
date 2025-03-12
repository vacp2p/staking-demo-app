<script lang="ts">
	import { walletAddress, SNT_TOKEN, userVaults, vaultAccounts, rewardsBalance, formattedTotalRewardsBalance, compoundMPs, vaultMpBalances, formattedUncompoundedMpTotal, refreshBalances } from '$lib/viem';
	import { formatUnits, type Address } from 'viem';
	import UnstakingModal from '$lib/components/UnstakingModal.svelte';
	import { goto } from '$app/navigation';
	import { openAddressExplorer } from '$lib/utils';

	let isUnstakingModalOpen = false;
	let selectedVaultAddress: Address | undefined;
	let selectedVaultId = 0;

	// Track compound transaction states
	let compoundingVaults: Record<Address, 'idle' | 'loading' | 'success'> = {};
	
	// Initialize compounding state for all vaults
	$: {
		if ($userVaults.length > 0) {
			$userVaults.forEach(vault => {
				if (!compoundingVaults[vault]) {
					compoundingVaults[vault] = 'idle';
				}
			});
		}
	}

	// Sorting state
	type SortField = 'vaultId' | 'stakedAmount' | 'earnedMPs' | 'remainingLock' | 'karmaRewards';
	type SortDirection = 'asc' | 'desc';
	
	let sortField: SortField = 'vaultId';
	let sortDirection: SortDirection = 'asc';
	
	// Function to handle sort changes
	function handleSort(field: SortField) {
		if (sortField === field) {
			// Toggle direction if clicking the same field
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			// Set new field and default to ascending
			sortField = field;
			sortDirection = 'asc';
		}
	}
	
	// Function to get sort indicator
	function getSortIndicator(field: SortField): { visible: boolean, direction: SortDirection } {
		if (sortField !== field) return { visible: false, direction: 'asc' };
		return { visible: true, direction: sortDirection };
	}
	
	// Computed sorted vaults
	$: sortedVaults = [...$userVaults].sort((a, b) => {
		const multiplier = sortDirection === 'asc' ? 1 : -1;
		
		switch (sortField) {
			case 'vaultId':
				// Sort by index in the array
				return multiplier * ($userVaults.indexOf(a) - $userVaults.indexOf(b));
			
			case 'stakedAmount':
				const aStaked = $vaultAccounts[a]?.stakedBalance || 0n;
				const bStaked = $vaultAccounts[b]?.stakedBalance || 0n;
				return multiplier * (aStaked > bStaked ? 1 : aStaked < bStaked ? -1 : 0);
			
			case 'earnedMPs':
				const aEarned = $vaultMpBalances[a] || 0n;
				const bEarned = $vaultMpBalances[b] || 0n;
				return multiplier * (aEarned > bEarned ? 1 : aEarned < bEarned ? -1 : 0);
			
			case 'remainingLock':
				const aLockUntil = $vaultAccounts[a]?.lockUntil || 0n;
				const bLockUntil = $vaultAccounts[b]?.lockUntil || 0n;
				return multiplier * (aLockUntil > bLockUntil ? 1 : aLockUntil < bLockUntil ? -1 : 0);
			
			case 'karmaRewards':
				const aRewards = $rewardsBalance[a] || 0n;
				const bRewards = $rewardsBalance[b] || 0n;
				return multiplier * (aRewards > bRewards ? 1 : aRewards < bRewards ? -1 : 0);
			
			default:
				return 0;
		}
	});

	function shortenAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function openEtherscan(address: string) {
		openAddressExplorer(address as Address);
	}

	function formatAmount(amount: bigint): string {
		const num = Number(formatUnits(amount, SNT_TOKEN.decimals));
		return formatNumberWithSpaces(num);
	}

	function formatRewardsAmount(amount: bigint): string {
		const num = Number(formatUnits(amount, 18));
		return formatNumberWithSpaces(num);
	}
	
	// Helper function to format numbers with spaces as thousand separators
	function formatNumberWithSpaces(num: number): string {
		// Format with 2 decimal places
		const parts = num.toFixed(2).split('.');
		// Add spaces for thousands in the integer part
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
		// Join with decimal part
		return parts.join('.');
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

	async function handleCompound(vault: Address) {
		try {
			// Set loading state
			compoundingVaults[vault] = 'loading';
			
			// Trigger compound transaction
			await compoundMPs(vault);
			
			// Set success state
			compoundingVaults[vault] = 'success';
			
			// Refresh balances to update UI
			if ($walletAddress) {
				await refreshBalances($walletAddress);
			}
			
			// Reset to idle after 3 seconds
			setTimeout(() => {
				compoundingVaults[vault] = 'idle';
			}, 3000);
		} catch (error) {
			console.error("Error compounding MPs:", error);
			// Reset to idle state on error
			compoundingVaults[vault] = 'idle';
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
									class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
									on:click={() => handleSort('vaultId')}
								>
									<div class="flex items-center">
										Vault ID
										{#if getSortIndicator('vaultId').visible}
											<span class="ml-1 text-blue-600">
												{#if getSortIndicator('vaultId').direction === 'asc'}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
													</svg>
												{:else}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
									Address
								</th>
								<th 
									scope="col" 
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
									on:click={() => handleSort('stakedAmount')}
								>
									<div class="flex items-center justify-end">
										Staked Amount
										{#if getSortIndicator('stakedAmount').visible}
											<span class="ml-1 text-blue-600">
												{#if getSortIndicator('stakedAmount').direction === 'asc'}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
													</svg>
												{:else}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</span>
										{/if}
									</div>
								</th>
								<th 
									scope="col" 
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
									on:click={() => handleSort('earnedMPs')}
								>
									<div class="flex items-center justify-end">
										Earned MPs / Ready to Compound
										{#if getSortIndicator('earnedMPs').visible}
											<span class="ml-1 text-blue-600">
												{#if getSortIndicator('earnedMPs').direction === 'asc'}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
													</svg>
												{:else}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">
									Max MPs
								</th>
								<th 
									scope="col" 
									class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
									on:click={() => handleSort('remainingLock')}
								>
									<div class="flex items-center">
										Remaining Lock
										{#if getSortIndicator('remainingLock').visible}
											<span class="ml-1 text-blue-600">
												{#if getSortIndicator('remainingLock').direction === 'asc'}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
													</svg>
												{:else}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</span>
										{/if}
									</div>
								</th>
								<th 
									scope="col" 
									class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
									on:click={() => handleSort('karmaRewards')}
								>
									<div class="flex items-center justify-end">
										Karma Rewards
										{#if getSortIndicator('karmaRewards').visible}
											<span class="ml-1 text-blue-600">
												{#if getSortIndicator('karmaRewards').direction === 'asc'}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
													</svg>
												{:else}
													<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
													</svg>
												{/if}
											</span>
										{/if}
									</div>
								</th>
								<th scope="col" class="relative py-3.5 pl-3 pr-4 sm:pr-6">
									<span class="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 bg-white">
							{#each sortedVaults as vault, i}
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
											#{$userVaults.indexOf(vault) + 1}
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
										<div class="flex items-end justify-end">
											<span>
												{$vaultMpBalances[vault]
													? formatAmount($vaultMpBalances[vault])
													: '0.00'} / 
											</span>
											<span class="text-amber-700 ml-1">
												{$vaultMpBalances[vault] > ($vaultAccounts[vault]?.mpStaked || 0n)
													? formatAmount($vaultMpBalances[vault] - ($vaultAccounts[vault]?.mpStaked || 0n))
													: '0.00'}
											</span>
										</div>
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
									<td class="whitespace-nowrap px-3 py-4 text-right text-sm font-bold text-blue-900">
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
											
											<!-- Compound button with sync icon -->
											<button
												on:click={() => handleCompound(vault)}
												class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
												disabled={compoundingVaults[vault] === 'loading' || 
													!$vaultMpBalances[vault] || 
													$vaultMpBalances[vault] <= ($vaultAccounts[vault]?.mpStaked || 0n)}
												aria-label="Compound MPs"
												title="Compound {$vaultMpBalances[vault] > ($vaultAccounts[vault]?.mpStaked || 0n)
													? formatAmount($vaultMpBalances[vault] - ($vaultAccounts[vault]?.mpStaked || 0n))
													: '0.00'} MPs"
											>
												{#if compoundingVaults[vault] === 'loading'}
													<!-- Loading spinner -->
													<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
														<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
												{:else if compoundingVaults[vault] === 'success'}
													<!-- Success checkmark -->
													<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
														<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
													</svg>
												{:else}
													<!-- Default sync icon -->
													<svg 
														class="h-4 w-4" 
														fill="none" 
														viewBox="0 0 24 24" 
														stroke-width="1.5" 
														stroke="currentColor"
													>
														<path 
															stroke-linecap="round" 
															stroke-linejoin="round" 
															d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
														/>
													</svg>
												{/if}
											</button>
											
											{#if !isLocked(vault)}
												<button
													on:click={() => handleStakeClick(vault)}
													class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
													aria-label="Add tokens"
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
				<!-- Mobile sorting controls -->
				<div class="mb-4 flex items-center justify-between">
					<label for="mobile-sort" class="block text-sm font-medium text-gray-700">Sort by:</label>
					<div class="flex items-center">
						<select 
							id="mobile-sort" 
							class="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
							bind:value={sortField}
							on:change={() => sortDirection = 'asc'}
						>
							<option value="vaultId">Vault ID</option>
							<option value="stakedAmount">Staked Amount</option>
							<option value="earnedMPs">Earned MPs</option>
							<option value="remainingLock">Remaining Lock</option>
							<option value="karmaRewards">Karma Rewards</option>
						</select>
						<button 
							class="ml-2 p-2 text-gray-500 hover:text-gray-700"
							on:click={() => sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'}
							aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
						>
							{#if sortDirection === 'asc'}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
								</svg>
							{:else}
								<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
								</svg>
							{/if}
						</button>
					</div>
				</div>
				
				{#each sortedVaults as vault, i}
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
									<h3 class="text-sm font-medium text-gray-900">Vault #{$userVaults.indexOf(vault) + 1}</h3>
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
								<div class="border-t border-gray-200 pt-3 mt-3">
									<dt class="text-sm font-medium text-gray-500">Earned MPs / Ready to Compound</dt>
									<dd class="mt-1 flex justify-between items-center">
										<div class="text-sm text-gray-900">
											<div class="flex items-center">
												<span>
													{$vaultMpBalances[vault]
														? formatAmount($vaultMpBalances[vault])
														: '0.00'} / 
												</span>
												<span class="text-amber-700 ml-1">
													{$vaultMpBalances[vault] > ($vaultAccounts[vault]?.mpStaked || 0n)
														? formatAmount($vaultMpBalances[vault] - ($vaultAccounts[vault]?.mpStaked || 0n))
														: '0.00'}
												</span>
											</div>
										</div>
										
										<!-- Compound button for mobile -->
										<button
											on:click={() => handleCompound(vault)}
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
											disabled={compoundingVaults[vault] === 'loading' || 
												!$vaultMpBalances[vault] || 
												$vaultMpBalances[vault] <= ($vaultAccounts[vault]?.mpStaked || 0n)}
											aria-label="Compound MPs"
											title="Compound {$vaultMpBalances[vault] > ($vaultAccounts[vault]?.mpStaked || 0n)
												? formatAmount($vaultMpBalances[vault] - ($vaultAccounts[vault]?.mpStaked || 0n))
												: '0.00'} MPs"
										>
											{#if compoundingVaults[vault] === 'loading'}
												<!-- Loading spinner -->
												<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											{:else if compoundingVaults[vault] === 'success'}
												<!-- Success checkmark -->
												<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
												</svg>
											{:else}
												<!-- Default sync icon -->
												<svg 
													class="h-4 w-4" 
													fill="none" 
													viewBox="0 0 24 24" 
													stroke-width="1.5" 
													stroke="currentColor"
												>
													<path 
														stroke-linecap="round" 
														stroke-linejoin="round" 
														d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
													/>
												</svg>
											{/if}
										</button>
									</dd>
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
									<span class="text-sm font-bold text-blue-900">
										{$rewardsBalance[vault] 
											? formatRewardsAmount($rewardsBalance[vault])
											: '0.00'} KARMA
									</span>
								</div>
							</div>
							<div class="mt-4">
								<div class="flex items-center justify-end gap-2">
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
										
										<!-- Compound button with sync icon -->
										<button
											on:click={() => handleCompound(vault)}
											class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
											disabled={compoundingVaults[vault] === 'loading' || 
												!$vaultMpBalances[vault] || 
												$vaultMpBalances[vault] <= ($vaultAccounts[vault]?.mpStaked || 0n)}
											aria-label="Compound MPs"
											title="Compound {$vaultMpBalances[vault] > ($vaultAccounts[vault]?.mpStaked || 0n)
												? formatAmount($vaultMpBalances[vault] - ($vaultAccounts[vault]?.mpStaked || 0n))
												: '0.00'} MPs"
										>
											{#if compoundingVaults[vault] === 'loading'}
												<!-- Loading spinner -->
												<svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
													<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
											{:else if compoundingVaults[vault] === 'success'}
												<!-- Success checkmark -->
												<svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
												</svg>
											{:else}
												<!-- Default sync icon -->
												<svg 
													class="h-4 w-4" 
													fill="none" 
													viewBox="0 0 24 24" 
													stroke-width="1.5" 
													stroke="currentColor"
												>
													<path 
														stroke-linecap="round" 
														stroke-linejoin="round" 
														d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" 
													/>
												</svg>
											{/if}
										</button>
										
										{#if !isLocked(vault)}
											<button
												on:click={() => handleStakeClick(vault)}
												class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
												aria-label="Add tokens"
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
