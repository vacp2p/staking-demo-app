<script lang="ts">
	import { walletAddress, formattedSntBalance, SNT_TOKEN, userVaults, deployVault, VAULT_FACTORY, publicClient, vaultStakedAmounts } from '$lib/viem';
	import { decodeEventLog, formatUnits } from 'viem';
	import TransactionModal from '$lib/components/TransactionModal.svelte';
	import type { Address, Log } from 'viem';

	let amount = '';
	let selectedVaultId = '';
	let selectedLockVaultId = '';
	let isDeploying = false;
	let deployError: string | undefined;

	// Transaction modal state
	let isModalOpen = false;
	let txHash: string | undefined;
	let deployedVaultAddress: Address | undefined;

	function shortenAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function formatAmount(amount: bigint): string {
		return Number(formatUnits(amount, SNT_TOKEN.decimals)).toFixed(2);
	}

	// Dummy data for demonstration
	const existingVaults = [
		{ id: 1, staked: '2,000' },
		{ id: 2, staked: '1,500' },
		{ id: 3, staked: '1,500' }
	];

	const stakingInfo = {
		minStake: '100',
		maxVaults: 5,
		apr: '100'
	};

	function handleStake() {
		alert('Staking functionality will be implemented later');
		amount = '';
		selectedVaultId = '';
	}

	async function handleDeployVault() {
		if (isDeploying) return;
		
		try {
			isDeploying = true;
			deployError = undefined;
			isModalOpen = true;
			
			// First get the transaction hash
			const { hash } = await deployVault();
			txHash = hash;

			// Wait for transaction confirmation and get the receipt
			const receipt = await publicClient.waitForTransactionReceipt({ 
				hash,
				confirmations: 1 // Wait for at least 1 confirmation
			});

			// Find the VaultCreated event
			const vaultCreatedLog = receipt.logs.find((log) => {
				// First check if this log is from our contract
				if (log.address.toLowerCase() !== VAULT_FACTORY.address.toLowerCase()) {
					return false;
				}

				// Check if this is the VaultCreated event signature
				// This is the actual signature from the contract
				return log.topics[0] === '0x5d9c31ffa0fecffd7cf379989a3c7af252f0335e0d2a1320b55245912c781f53';
			});

			if (!vaultCreatedLog || !vaultCreatedLog.topics[1]) {
				console.log('Receipt logs:', receipt.logs);
				throw new Error('VaultCreated event not found in transaction logs');
			}

			// The vault address is the first indexed parameter
			// Remove the padding from the address (first 24 bytes)
			const paddedAddress = vaultCreatedLog.topics[1] as `0x${string}`;
			deployedVaultAddress = `0x${paddedAddress.slice(26)}` as Address;
			console.log('Deployed vault address:', deployedVaultAddress);
			
		} catch (error) {
			console.error('Failed to deploy vault:', error);
			deployError = error instanceof Error ? error.message : 'Failed to deploy vault';
		} finally {
			isDeploying = false;
		}
	}

	function handleCloseModal() {
		isModalOpen = false;
		txHash = undefined;
		deployedVaultAddress = undefined;
	}
</script>

<div class="mx-auto max-w-2xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8 space-y-6">
			<!-- Combined Balance and Deploy Box -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<!-- SNT Balance Box -->
				<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
					<div class="p-8">
						<div class="flex flex-col">
							<h2 class="text-base font-semibold leading-7 text-gray-900">Available SNT to Stake</h2>
							<div class="mt-4 flex items-baseline gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{$formattedSntBalance ?? '0'}
								</span>
								<span class="text-lg font-semibold leading-6 text-gray-500">{SNT_TOKEN.symbol}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Deploy Vault Box -->
				<div class="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
					<div class="p-8">
						<div class="flex flex-col">
							<h2 class="text-base font-semibold leading-7 text-gray-900">Your Staking Vaults</h2>
							<div class="mt-4 flex items-baseline gap-x-2">
								<span class="text-4xl font-bold tracking-tight text-gray-900">
									{$userVaults.length}
								</span>
								<span class="text-lg font-semibold leading-6 text-gray-500">vaults</span>
							</div>
							{#if deployError}
								<p class="mt-2 text-sm text-red-600">{deployError}</p>
							{/if}
						</div>
					</div>
					<!-- Floating Action Button with Tooltip -->
					<div class="group absolute bottom-4 right-4">
						<button
							on:click={handleDeployVault}
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 shadow-sm hover:bg-blue-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
							disabled={isDeploying}
						>
							{#if isDeploying}
								<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
							{:else}
								<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
							{/if}
						</button>
						<div class="absolute bottom-full right-0 mb-2 hidden group-hover:block">
							<div class="rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap">
								Deploy a New Vault
							</div>
							<div class="absolute -bottom-1 right-4 h-2 w-2 rotate-45 bg-gray-900"></div>
						</div>
					</div>
				</div>
			</div>

			<!-- Staking Form Box -->
			<div class="relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
				{#if $userVaults.length === 0}
					<div class="absolute inset-0 z-10 flex items-center justify-center bg-white/95">
						<div class="max-w-sm text-center">
							<p class="text-sm font-medium text-gray-900">
								You need to have an empty or unlocked staking vault to stake
							</p>
							<button
								type="button"
								class="mt-1 text-sm text-blue-600 hover:text-blue-700"
								on:click={handleDeployVault}
							>
								Create a new vault to start staking your SNT tokens
							</button>
						</div>
					</div>
				{/if}
				<div class="p-8">
					<h2 class="text-base font-semibold leading-7 text-gray-900">Stake SNT</h2>
					<div class="{$userVaults.length === 0 ? 'opacity-50 pointer-events-none' : ''}">
						<p class="mt-1 text-sm leading-6 text-gray-500">
							Stake your SNT tokens to earn rewards.
						</p>

						<form
							class="mt-6"
							on:submit|preventDefault={handleStake}
						>
							<div class="space-y-2">
								<label
									for="vault"
									class="block text-sm font-medium leading-6 text-gray-900"
								>
									Select Vault
								</label>
								<select
									id="vault"
									bind:value={selectedVaultId}
									class="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
									required
								>
									<option value="">Select a vault</option>
									{#each $userVaults as vault, i}
										<option value={vault}>
											Vault #{i + 1} - {shortenAddress(vault)}
										</option>
									{/each}
								</select>
							</div>

							<div class="mt-4 space-y-2">
								<label
									for="amount"
									class="block text-sm font-medium leading-6 text-gray-900"
								>
									Amount to Stake
								</label>
								<div class="relative">
									<input
										type="text"
										id="amount"
										bind:value={amount}
										placeholder="0"
										class="block w-full rounded-lg border-0 py-2 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
										required
									/>
									<div class="absolute inset-y-0 right-0 flex items-center pr-3">
										<span class="text-sm text-gray-500">{SNT_TOKEN.symbol}</span>
									</div>
								</div>
								<p class="text-sm text-gray-500">
									Available: {$formattedSntBalance ?? '0'} {SNT_TOKEN.symbol}
								</p>
							</div>

							<div class="mt-6 flex items-center justify-between text-sm">
								<span class="text-gray-500">MP Reward Rate</span>
								<span class="font-medium text-gray-900">{stakingInfo.apr}%</span>
							</div>

							<div class="mt-6">
								<button
									type="submit"
									class="block w-full rounded-lg bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
								>
									Stake SNT
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			<!-- Lock Form Box -->
			<div class="mt-6 relative overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
				<div class="p-8">
					<h2 class="text-base font-semibold leading-7 text-gray-900">Lock Your Stake</h2>
					<div class="{$userVaults.length === 0 ? 'opacity-50 pointer-events-none' : ''}">
						<p class="mt-1 text-sm leading-6 text-gray-500">
							Lock your staking vault to earn bonus Multiplier Points.
						</p>

						{#if $userVaults.some(vault => $vaultStakedAmounts[vault] && $vaultStakedAmounts[vault] > 0n)}
							<form
								class="mt-6"
								on:submit|preventDefault={() => alert('Locking functionality will be implemented later')}
							>
								<div class="space-y-2">
									<label
										for="lockVault"
										class="block text-sm font-medium leading-6 text-gray-900"
									>
										Select Vault
									</label>
									<select
										id="lockVault"
										bind:value={selectedLockVaultId}
										class="block w-full rounded-lg border-0 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
										required
									>
										<option value="">Select a vault</option>
										{#each $userVaults as vault, i}
											{#if $vaultStakedAmounts[vault] && $vaultStakedAmounts[vault] > 0n}
												<option value={vault}>
													Vault #{i + 1} - {shortenAddress(vault)} ({formatAmount($vaultStakedAmounts[vault])} {SNT_TOKEN.symbol})
												</option>
											{/if}
										{/each}
									</select>
								</div>

								<div class="mt-6 flex items-center justify-between text-sm">
									<span class="text-gray-500">Lock Duration</span>
									<span class="font-medium text-gray-900">12 months</span>
								</div>

								<div class="mt-6 flex items-center justify-between text-sm">
									<span class="text-gray-500">MP Bonus Rate</span>
									<span class="font-medium text-gray-900">+50%</span>
								</div>

								<div class="mt-6">
									<button
										type="submit"
										class="block w-full rounded-lg bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
									>
										Lock Stake
									</button>
								</div>
							</form>
						{:else}
							<div class="mt-6 rounded-lg bg-gray-50 px-6 py-8">
								<div class="text-center">
									<p class="text-sm font-medium text-gray-900">
										You need to stake tokens in a vault first!
									</p>
									
								</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="mx-auto mt-16 text-center">
			<div class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to stake SNT tokens</p>
			</div>
		</div>
	{/if}
</div>

<TransactionModal
	isOpen={isModalOpen}
	onClose={handleCloseModal}
	txHash={txHash}
	vaultAddress={deployedVaultAddress}
	isDeploying={isDeploying}
	isDeployed={!isDeploying && txHash !== undefined}
/> 