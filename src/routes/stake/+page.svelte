<script lang="ts">
	import { walletAddress, formattedSntBalance, SNT_TOKEN } from '$lib/viem';

	let amount = '';
	let isCreatingNewVault = true;
	let selectedVaultId = '';

	// Dummy data for demonstration
	const existingVaults = [
		{ id: 1, staked: '2000' },
		{ id: 2, staked: '1500' },
		{ id: 3, staked: '1500' }
	];

	const stakingInfo = {
		minStake: '100',
		maxVaults: 5,
		apr: '12.5'
	};

	function handleStake() {
		alert('Staking functionality will be implemented later');
		amount = '';
		isCreatingNewVault = true;
		selectedVaultId = '';
	}
</script>

<div class="mx-auto max-w-2xl px-6 lg:px-8">
	{#if $walletAddress}
		<div class="mx-auto mt-8">
			<div class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
				<div class="p-8">
					<h2 class="text-base font-semibold leading-7 text-gray-900">Stake SNT</h2>
					<p class="mt-1 text-sm leading-6 text-gray-500">
						Stake your SNT tokens to earn rewards. Minimum stake amount is {stakingInfo.minStake} {SNT_TOKEN.symbol}.
					</p>

					<div class="mt-6 flex items-center gap-x-3">
						<button
							class="rounded-lg px-3 py-2 text-sm font-semibold {isCreatingNewVault
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-700 hover:bg-gray-50'}"
							on:click={() => (isCreatingNewVault = true)}
						>
							New Vault
						</button>
						<button
							class="rounded-lg px-3 py-2 text-sm font-semibold {!isCreatingNewVault
								? 'bg-blue-100 text-blue-700'
								: 'text-gray-700 hover:bg-gray-50'}"
							on:click={() => (isCreatingNewVault = false)}
						>
							Existing Vault
						</button>
					</div>

					<form
						class="mt-6"
						on:submit|preventDefault={handleStake}
					>
						{#if !isCreatingNewVault}
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
									{#each existingVaults as vault}
										<option value={vault.id}>
											Vault #{vault.id} - Current stake: {vault.staked} {SNT_TOKEN.symbol}
										</option>
									{/each}
								</select>
							</div>
						{/if}

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
									placeholder="0.0000"
									class="block w-full rounded-lg border-0 py-2 pr-16 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
									required
								/>
								<div class="absolute inset-y-0 right-0 flex items-center pr-3">
									<span class="text-sm text-gray-500">{SNT_TOKEN.symbol}</span>
								</div>
							</div>
							<p class="text-sm text-gray-500">
								Available: {$formattedSntBalance ?? '0.0000'} {SNT_TOKEN.symbol}
							</p>
						</div>

						<div class="mt-6 flex items-center justify-between text-sm">
							<span class="text-gray-500">Current APR</span>
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
	{:else}
		<div class="mx-auto mt-16 text-center">
			<div class="rounded-xl bg-white p-8 shadow-sm ring-1 ring-gray-900/5">
				<h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
				<p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to stake SNT tokens</p>
			</div>
		</div>
	{/if}
</div> 