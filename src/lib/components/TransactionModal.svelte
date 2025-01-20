<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { Address } from 'viem';
	import { registerVault } from '$lib/viem';

	export let isOpen = false;
	export let onClose: () => void;
	export let txHash: string | undefined = undefined;
	export let vaultAddress: Address | undefined = undefined;
	export let isDeploying = false;
	export let isDeployed = false;

	let isRegistering = false;
	let isRegistered = false;
	let registrationHash: string | undefined;
	let registrationError: string | undefined;

	function openEtherscan(hash: string) {
		window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
	}

	function openAddressEtherscan(address: string) {
		window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank');
	}

	async function handleRegisterClick() {
		if (!vaultAddress || isRegistering) return;

		try {
			isRegistering = true;
			registrationError = undefined;
			
			const { hash, receipt } = await registerVault(vaultAddress);
			registrationHash = hash;
			
			// Only set isRegistered after we have confirmation
			if (receipt.status === 'success') {
				isRegistered = true;
			} else {
				throw new Error('Registration transaction failed');
			}
		} catch (error) {
			console.error('Failed to register vault:', error);
			registrationError = error instanceof Error ? error.message : 'Failed to register vault';
		} finally {
			isRegistering = false;
		}
	}

	function handleStartStaking() {
		onClose();
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
					<div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
						<h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
							Vault Deployment Status
						</h3>

						<div class="mt-6 space-y-6">
							<!-- Deploy step -->
							<div class="flex items-center gap-x-3">
								{#if isDeploying}
									<div class="flex-shrink-0">
										<div class="h-8 w-8">
											<svg
												class="animate-spin h-8 w-8 text-blue-600"
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
												/>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
										</div>
									</div>
								{:else if isDeployed && vaultAddress}
									<button
										class="flex-shrink-0 text-green-500 hover:text-green-600"
										on:click={() => txHash && openEtherscan(txHash)}
										aria-label="View deployment transaction on Etherscan"
									>
										<svg
											class="h-8 w-8"
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
									</button>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900">Deploy a vault</p>
									{#if vaultAddress}
										<button
											class="mt-1 text-sm text-blue-600 hover:text-blue-700 truncate"
											on:click={() => openAddressEtherscan(vaultAddress)}
											aria-label="View vault address on Etherscan"
										>
											Vault: {vaultAddress}
										</button>
									{/if}
								</div>
							</div>

							<!-- Register step -->
							<div class="flex items-center gap-x-3">
								{#if !isDeployed || !vaultAddress}
									<div class="flex-shrink-0 text-gray-400">
										<svg
											class="h-8 w-8"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
											/>
										</svg>
									</div>
								{:else if isRegistering}
									<div class="flex-shrink-0">
										<div class="h-8 w-8">
											<svg
												class="animate-spin h-8 w-8 text-blue-600"
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
												/>
												<path
													class="opacity-75"
													fill="currentColor"
													d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
												/>
											</svg>
										</div>
									</div>
								{:else if isRegistered}
									<button
										class="flex-shrink-0 text-green-500 hover:text-green-600"
										on:click={() => registrationHash && openEtherscan(registrationHash)}
										aria-label="View registration transaction on Etherscan"
									>
										<svg
											class="h-8 w-8"
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
									</button>
								{:else}
									<button
										class="flex-shrink-0 text-blue-600 hover:text-blue-700"
										on:click={handleRegisterClick}
										aria-label="Register vault"
									>
										<svg
											class="h-8 w-8"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
										>
											<circle
												cx="12"
												cy="12"
												r="9"
												class="stroke-current"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 8l4 4m0 0l-4 4m4-4H8"
											/>
										</svg>
									</button>
								{/if}
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900">Register your vault</p>
									{#if registrationError}
										<p class="mt-1 text-sm text-red-600">{registrationError}</p>
									{:else}
										<p class="mt-1 text-sm text-gray-500">
											{#if isRegistered}
												Registration complete
											{:else if isRegistering}
												Registering your vault...
											{:else if isDeployed && vaultAddress}
												Click the arrow to proceed with registration
											{:else}
												Available after deployment
											{/if}
										</p>
									{/if}
								</div>
							</div>

							<!-- Ready to stake message -->
							{#if isRegistered}
								<div class="mt-8 text-center">
									<h4 class="text-lg font-medium text-gray-900">You are ready to stake your SNT!</h4>
									<button
										type="button"
										class="mt-4 inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
										on:click={handleStartStaking}
									>
										Start Staking
									</button>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if} 