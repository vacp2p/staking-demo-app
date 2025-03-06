<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { Address } from 'viem';
	import {
		SNT_TOKEN,
		vaultAccounts,
		walletAddress,
		walletClient,
		publicClient,
		refreshBalances
	} from '$lib/viem';
	import { formatUnits, parseUnits, type Hash } from 'viem';
	import { openExplorer } from '$lib/utils';
	import { vaultAbi } from '$lib/contracts';

	export let isOpen = false;
	export let onClose: () => void;
	export let vaultAddress: Address | undefined;
	export let vaultId: number;

	let amount = '';
	let confirmUnderstand = false;
	let showError = false;
	let isUnstaking = false;
	let unstakeHash: Hash | undefined;
	let isCompleted = false;
	let unstakeError: string | undefined;

	$: maxAmount =
		vaultAddress && $vaultAccounts[vaultAddress]
			? Number(formatUnits($vaultAccounts[vaultAddress].stakedBalance, SNT_TOKEN.decimals))
			: 0;

	$: percentage =
		vaultAddress && $vaultAccounts[vaultAddress] && maxAmount > 0
			? (Number(amount) / maxAmount) * 100
			: 0;

	$: mpsToBurn =
		vaultAddress && $vaultAccounts[vaultAddress]
			? ((Number(formatMPs(vaultAddress)) * percentage) / 100).toFixed(1)
			: '0.0';

	$: if (vaultAddress && $vaultAccounts[vaultAddress] && !amount) {
		// Set initial amount to 10% of total
		amount = (maxAmount * 0.1).toFixed(2);
	}

	function handleAmountInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const value = input.value;

		if (!vaultAddress || !$vaultAccounts[vaultAddress]) return;

		const numValue = Number(value);

		if (numValue > maxAmount) {
			amount = maxAmount.toFixed(2);
		} else if (numValue < 1) {
			amount = '1.00';
		} else {
			amount = numValue.toFixed(2);
		}
	}

	function handleSliderInput(e: Event) {
		const input = e.target as HTMLInputElement;
		amount = Number(input.value).toFixed(2);
	}

	async function handleUnstake() {
		if (!confirmUnderstand) {
			showError = true;
			return;
		}

		if (!vaultAddress || !$walletAddress || !$walletClient) {
			return;
		}

		try {
			isUnstaking = true;
			unstakeError = undefined;

			// Convert amount to proper decimals
			const amountToUnstake = parseUnits(amount, SNT_TOKEN.decimals);

			// Call unstake function
			unstakeHash = await $walletClient.writeContract({
				chain: publicClient.chain,
				account: $walletAddress,
				address: vaultAddress,
				abi: vaultAbi,
				functionName: 'unstake',
				args: [amountToUnstake]
			});

			// Wait for transaction confirmation
			const receipt = await publicClient.waitForTransactionReceipt({
				hash: unstakeHash,
				confirmations: 1
			});

			if (receipt.status !== 'success') {
				throw new Error('Unstaking transaction failed');
			}

			// Refresh balances and vault data
			await refreshBalances($walletAddress);
			isCompleted = true;
		} catch (error) {
			console.error('Failed to unstake:', error);
			unstakeError = error instanceof Error ? error.message : 'Failed to unstake';
		} finally {
			isUnstaking = false;
		}
	}

	function formatMPs(vault: Address): string {
		const account = $vaultAccounts[vault];
		if (!account?.mpAccrued) return '0.0';
		return Number(formatUnits(account.mpAccrued, SNT_TOKEN.decimals)).toFixed(1);
	}

	function openTxOnEtherscan(hash: string | undefined) {
		if (hash) {
			openExplorer(hash);
		}
	}
</script>

{#if isOpen}
	<div
		class="fixed inset-0 z-50 overflow-y-auto"
		aria-labelledby="modal-title"
		role="dialog"
		aria-modal="true"
		transition:fade={{ duration: 200 }}
	>
		<!-- Background overlay -->
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

		<!-- Modal panel -->
		<div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
			<div
				class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
				transition:fly={{ y: 20, duration: 200 }}
			>
				<!-- Close button -->
				<div class="absolute right-0 top-0 pr-4 pt-4">
					<button
						type="button"
						class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
						on:click={onClose}
						disabled={isUnstaking}
					>
						<span class="sr-only">Close</span>
						<svg
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="sm:flex sm:items-start">
					<div class="mt-3 w-full text-center sm:mt-0 sm:text-left">
						<h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
							Unstake from Vault #{vaultId}
						</h3>

						{#if isUnstaking || isCompleted}
							<div class="mt-6 space-y-6">
								<div class="flex items-center gap-3">
									{#if isUnstaking}
										<div class="flex h-8 w-8 items-center justify-center">
											<button class="animate-spin" on:click={() => openTxOnEtherscan(unstakeHash)} aria-label="View unstaking transaction in progress">
												<svg
													class="h-5 w-5 text-blue-600"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
												>
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
											</button>
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-gray-900">Unstaking in progress...</p>
										</div>
									{:else if isCompleted}
										<div class="flex h-8 w-8 items-center justify-center">
											<svg
												class="h-8 w-8 text-green-500"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-gray-900">
												Successfully unstaked {amount}
												{SNT_TOKEN.symbol}
											</p>
											<button
												class="mt-1 text-sm text-blue-600 hover:text-blue-700"
												on:click={() => unstakeHash && openTxOnEtherscan(unstakeHash)}
											>
												View transaction
											</button>
										</div>
									{/if}
								</div>

								{#if isCompleted}
									<div class="mt-8 text-center">
										<button
											type="button"
											class="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
											on:click={onClose}
										>
											Close
										</button>
									</div>
								{/if}
							</div>
						{:else}
							<div class="mt-6 space-y-6">
								<!-- Amount Slider -->
								<div>
									<label for="unstake-amount" class="mb-1 block text-sm font-medium text-gray-700">
										Amount to Unstake
									</label>
									<input
										id="unstake-amount"
										type="range"
										min="1"
										max={maxAmount}
										step="0.01"
										value={amount}
										on:input={handleSliderInput}
										class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-blue-600"
									/>
									<div class="mt-1 flex justify-between text-xs text-gray-500">
										<span>1 {SNT_TOKEN.symbol}</span>
										<span>{(maxAmount / 2).toFixed(2)} {SNT_TOKEN.symbol}</span>
										<span>{maxAmount.toFixed(2)} {SNT_TOKEN.symbol}</span>
									</div>
								</div>

								<!-- Amount Input -->
								<div class="relative">
									<label for="unstake-amount-input" class="sr-only">Amount to unstake</label>
									<input
										id="unstake-amount-input"
										type="number"
										value={amount}
										on:input={handleAmountInput}
										min="1"
										max={maxAmount}
										step="0.01"
										class="block w-full rounded-lg border-0 px-3 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
										placeholder="0.00"
									/>
									<div class="absolute inset-y-0 right-0 flex items-center pr-3">
										<span class="text-sm text-gray-500">{SNT_TOKEN.symbol}</span>
									</div>
								</div>

								<!-- Warning Box with Checkbox -->
								{#if vaultAddress && Number(amount) >= 1}
									<div class="rounded-md bg-red-50 p-4">
										<div class="flex items-start space-x-3">
											<div class="flex-shrink-0 pt-0.5">
												<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
													<path
														fill-rule="evenodd"
														d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
														clip-rule="evenodd"
													/>
												</svg>
											</div>
											<div class="flex-1">
												<p class="text-sm font-semibold text-red-700">
													Unstaking will burn MPs earned in this vault by {percentage.toFixed(0)}% ({mpsToBurn}
													MPs)
												</p>
												<div class="mt-3 flex items-center gap-2">
													<input
														id="confirmation"
														type="checkbox"
														bind:checked={confirmUnderstand}
														on:change={() => (showError = false)}
														class="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-600"
													/>
													<label for="confirmation" class="text-sm text-red-700">
														I understand
													</label>
												</div>
												{#if showError}
													<p class="mt-2 text-sm text-red-600">
														Please confirm that you understand the consequences of unstaking.
													</p>
												{/if}
											</div>
										</div>
									</div>
								{/if}

								<!-- Unstake Button -->
								<div class="mt-8">
									<button
										type="button"
										class="w-full rounded-lg bg-blue-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
										disabled={Number(amount) < 1 || maxAmount === 0}
										on:click={handleUnstake}
									>
										{#if maxAmount === 0}
											No tokens to unstake
										{:else}
											Unstake {amount} {SNT_TOKEN.symbol}
										{/if}
									</button>
								</div>

								{#if unstakeError}
									<p class="mt-2 text-center text-sm text-red-600">
										{unstakeError}
									</p>
								{/if}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
