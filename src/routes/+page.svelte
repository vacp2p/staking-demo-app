<script lang="ts">
	import { walletAddress, formattedBalance, formattedSntBalance, network, SNT_TOKEN, sntError, userVaults, formattedGlobalTotalStaked, fetchTotalStaked, fetchTokenPrice, tokenPriceUsd, globalTotalStaked, vaultAccounts, formattedTotalMpBalance, formattedStakedMpBalance, formattedTotalRewardsBalance, totalRewardsBalance, rewardsBalance, compoundMPs, vaultMpBalances, formattedUncompoundedMpTotal, refreshBalances } from '$lib/viem';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatUnits } from 'viem';
	import { onMount } from 'svelte';
	import type { Address } from 'viem';
	import { openAddressExplorer } from '$lib/utils';

	// Calculate total staked from account information
	$: userTotalStaked = formatAmount(
		Object.values($vaultAccounts).reduce((sum, account) => sum + account.stakedBalance, 0n)
	);

	// Calculate total value in USD
	$: totalValueUsd = $globalTotalStaked ? 
		Math.floor(Number(formatUnits($globalTotalStaked, SNT_TOKEN.decimals)) * $tokenPriceUsd).toLocaleString() : '0';

	// Calculate the earliest unlock time across all vaults
	$: firstUnlockTime = calculateFirstUnlockTime($userVaults, $vaultAccounts);

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

	function calculateFirstUnlockTime(vaults: Address[], accounts: Record<Address, any>): string {
		if (!vaults || vaults.length === 0) {
			return "No locked vaults";
		}
		
		const now = BigInt(Math.floor(Date.now() / 1000));
		let earliestUnlock: bigint | null = null;
		
		for (const vault of vaults) {
			const account = accounts[vault];
			if (account && account.lockUntil > now) {
				if (earliestUnlock === null || account.lockUntil < earliestUnlock) {
					earliestUnlock = account.lockUntil;
				}
			}
		}
		
		if (earliestUnlock === null) {
			return "No locked vaults";
		}
		
		const remainingSeconds = Number(earliestUnlock - now);
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

	function handleStartStaking() {
		goto('/stake');
	}

	function handleStakeClick(vault: Address) {
		if (!isLocked(vault)) {
			goto('/stake?stakeVault=' + vault);
		}
	}

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
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#if $userVaults.length > 0}
					<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm">
						<div class="flex flex-col">
							<h3 class="text-sm font-medium leading-6 text-gray-500">Your Total Staked</h3>
							<div class="mt-4 flex items-baseline justify-end gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{userTotalStaked}
								</span>
								<span class="text-sm font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
							</div>
						</div>
					</div>

					<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm">
						<div class="flex flex-col">
							<h3 class="text-sm font-medium leading-6 text-gray-500">Your Multiplier Points</h3>
							<div class="mt-4 flex flex-col gap-1">
								<div class="flex items-baseline justify-end gap-x-2">
									<span class="text-4xl font-bold tracking-tight text-gray-900">
										{$formattedTotalMpBalance}
									</span>
									<span class="text-sm font-semibold leading-6 text-gray-500">MPs</span>
								</div>
							</div>
						</div>
					</div>

					<div class="overflow-hidden rounded-xl bg-amber-50 p-6 shadow-sm">
						<div class="flex flex-col">
							<h3 class="text-sm font-medium leading-6 text-amber-700">MPs to Compound</h3>
							<div class="mt-4 flex items-baseline justify-end gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-amber-900">
									{$formattedUncompoundedMpTotal}
								</span>
								<span class="text-sm font-semibold leading-6 text-amber-700">MPs</span>
							</div>
						</div>
					</div>
				{:else}
					<div class="col-span-3 overflow-hidden rounded-xl bg-blue-50 p-6 shadow-sm">
						<button
							class="flex h-full w-full flex-col items-center justify-center gap-2"
							on:click={handleStartStaking}
						>
							<h3 class="text-lg font-semibold text-blue-900">Start Earning Rewards</h3>
							<p class="text-sm text-blue-700">Deploy your first staking vault to start earning rewards</p>
						</button>
					</div>
				{/if}
			</div>

			<!-- Second row -->
			<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm">
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

				<div class="overflow-hidden rounded-xl bg-white p-6 shadow-sm">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-gray-500">Active Vaults</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-gray-900">
								{$userVaults.length}
							</span>
						</div>
					</div>
				</div>
				
				<div class="overflow-hidden rounded-xl bg-blue-50 p-6 shadow-sm">
					<div class="flex flex-col">
						<h3 class="text-sm font-medium leading-6 text-blue-700">Your Karma Rewards</h3>
						<div class="mt-4 flex items-baseline justify-end gap-x-2">
							<span class="text-4xl font-bold tracking-tight text-blue-900">
								{$formattedTotalRewardsBalance}
							</span>
							<span class="text-sm font-semibold leading-6 text-blue-700">KARMA</span>
						</div>
					</div>
				</div>
			</div>

			{#if $userVaults.length > 0}
				<div class="mt-8">
					<h2 class="text-base font-semibold leading-7 text-gray-900">Your Staking Vaults</h2>

					<!-- Table view (desktop) -->
					<div class="mt-4 hidden sm:block">
						<div class="overflow-hidden rounded-xl bg-white shadow-sm">
							<table class="min-w-full divide-y divide-gray-300">
								<thead>
									<tr>
										<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Vault ID</th>
										<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">SNT Staked</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Earned MPs / Ready to Compound</th>
										<th class="px-6 py-3.5 text-left text-sm font-semibold text-gray-900">Remaining Lock</th>
										<th class="px-6 py-3.5 text-right text-sm font-semibold text-gray-900">Karma Rewards</th>
										<th class="w-[52px]"></th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									{#each $userVaults as vault, i}
										<tr>
											<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
												<div class="flex items-center gap-2">
													{#if isLocked(vault)}
														<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
														</svg>
													{:else}
														<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
														</svg>
													{/if}
													#{i + 1}
												</div>
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
												<button
													class="text-blue-600 hover:text-blue-900"
													on:click={() => openEtherscan(vault)}
												>
													{shortenAddress(vault)}
												</button>
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
												{$vaultAccounts[vault]?.stakedBalance ? formatAmount($vaultAccounts[vault].stakedBalance) : '0.00'} {SNT_TOKEN.symbol}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-900">
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
											<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
												{#if isLocked(vault)}
													<div class="group relative inline-block">
														<span>{formatRemainingLock(vault)}</span>
														<div class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block z-10">
															<div class="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
																{formatUnlockDate(vault)}
															</div>
															<div class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
														</div>
													</div>
												{:else}
													{formatRemainingLock(vault)}
												{/if}
											</td>
											<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-blue-900">
												{$rewardsBalance[vault] ? formatRewardsAmount($rewardsBalance[vault]) : '0.00'} KARMA
											</td>
											<td class="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
												<div class="flex items-center justify-end gap-2">
													{#if !isLocked(vault)}
														<button
															on:click={() => handleStakeClick(vault)}
															class="rounded-full bg-blue-50 w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100"
															aria-label="Add stake to vault"
														>
															<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
																<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
															</svg>
														</button>
													{:else}
														<div class="w-8 h-8"></div>
													{/if}
													
													<!-- Compound button with sync icon -->
													<button
														on:click={() => handleCompound(vault)}
														class="rounded-full bg-blue-50 w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-50"
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
							<div class="overflow-hidden rounded-lg bg-white shadow">
								<div class="px-4 py-5">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											{#if isLocked(vault)}
												<svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
												</svg>
											{:else}
												<svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
												</svg>
											{/if}
											<h3 class="text-sm font-medium text-gray-900">Vault #{i + 1}</h3>
										</div>
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
												{$vaultAccounts[vault]?.stakedBalance ? formatAmount($vaultAccounts[vault].stakedBalance) : '0.00'} {SNT_TOKEN.symbol}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-sm text-gray-500">MPs</span>
											<div class="flex items-center">
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
											</div>
										</div>
										<div class="flex justify-between">
											<span class="text-sm text-gray-500">Remaining Lock</span>
											<span class="text-sm font-medium text-gray-900">
												{#if isLocked(vault)}
													<div class="group relative inline-block">
														<span>{formatRemainingLock(vault)}</span>
														<div class="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block z-10">
															<div class="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
																{formatUnlockDate(vault)}
															</div>
															<div class="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900"></div>
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
												{$rewardsBalance[vault] ? formatRewardsAmount($rewardsBalance[vault]) : '0.00'} KARMA
											</span>
										</div>
									</div>
									<div class="mt-4">
										<div class="flex items-center gap-2">
											<div class="flex items-center justify-end gap-2">
												{#if !isLocked(vault)}
													<button
														on:click={() => handleStakeClick(vault)}
														class="w-full rounded-lg bg-blue-50 px-2 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-100 flex items-center justify-center gap-2"
													>
														<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
															<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
														</svg>
														Add Stake
													</button>
												{:else}
													<div class="h-[36px]"></div>
												{/if}
												
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
											</div>
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
			<div class="rounded-xl bg-white p-8 shadow-sm">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to view your staking positions and rewards</p>
			</div>
		</div>
	{/if}
</div>
