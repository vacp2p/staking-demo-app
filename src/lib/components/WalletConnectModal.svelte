<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { walletAddress } from '$lib/viem';
	import { connectWithOnboard, disconnectWithOnboard, isConnecting } from '$lib/onboardToViem';
	import onboard from '$lib/onboard';
	import { onMount, onDestroy } from 'svelte';
	import type { WalletState } from '@web3-onboard/core';
	import type { Subscription } from 'rxjs';

	export let isOpen = false;
	export let onClose: () => void;

	let wallets: WalletState[] = [];
	let error: string | null = null;
	let unsubscribe: Subscription | null = null;

	onMount(() => {
		// Subscribe to wallet changes
		unsubscribe = onboard.state.select('wallets').subscribe((newWallets: WalletState[]) => {
			wallets = newWallets;
		});
	});

	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe.unsubscribe();
		}
	});

	async function handleConnect() {
		try {
			error = null;
			await connectWithOnboard();
			onClose();
		} catch (err) {
			console.error('Failed to connect wallet:', err);
			error = err instanceof Error ? err.message : 'Failed to connect wallet';
		}
	}

	async function handleDisconnect(label: string) {
		try {
			await onboard.disconnectWallet({ label });
		} catch (err) {
			console.error('Failed to disconnect wallet:', err);
		}
	}

	function formatAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
						disabled={$isConnecting}
						aria-label="Close"
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
						<h3 class="text-xl font-semibold leading-6 text-gray-900" id="modal-title">
							Connect Wallet
						</h3>

						<div class="mt-6 space-y-6">
							{#if wallets.length > 0}
								<div class="space-y-4">
									<h4 class="text-base font-medium text-gray-900">Connected Wallets</h4>
									{#each wallets as wallet}
										<div class="flex items-center justify-between rounded-lg border border-gray-200 p-4">
											<div class="flex items-center space-x-3">
												{#if wallet.icon}
													<img
														src={wallet.icon}
														alt={wallet.label}
														class="h-8 w-8 rounded-full"
													/>
												{:else}
													<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
														<svg
															class="h-5 w-5 text-blue-600"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
															aria-hidden="true"
														>
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
															/>
														</svg>
													</div>
												{/if}
												<div>
													<p class="font-medium text-gray-900">{wallet.label}</p>
													<p class="text-sm text-gray-500">
														{formatAddress(wallet.accounts[0].address)}
													</p>
												</div>
											</div>
											<button
												class="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
												on:click={() => handleDisconnect(wallet.label)}
											>
												Disconnect
											</button>
										</div>
									{/each}
								</div>
							{:else}
								<div class="space-y-4">
									<h4 class="text-base font-medium text-gray-900">Available Wallets</h4>
									<button
										class="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
										on:click={handleConnect}
										disabled={$isConnecting}
									>
										<div class="flex items-center space-x-3">
											<div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
												<svg
													class="h-5 w-5 text-blue-600"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
													aria-hidden="true"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
													/>
												</svg>
											</div>
											<div>
												<p class="font-medium text-gray-900">Connect Wallet</p>
												<p class="text-sm text-gray-500">
													Connect using MetaMask, WalletConnect, or Coinbase
												</p>
											</div>
										</div>
										{#if $isConnecting}
											<div class="flex h-6 w-6 items-center justify-center">
												<svg
													class="h-5 w-5 animate-spin text-blue-600"
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													aria-hidden="true"
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
											</div>
										{:else}
											<svg
												class="h-5 w-5 text-gray-400"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
													clip-rule="evenodd"
												/>
											</svg>
										{/if}
									</button>
								</div>
							{/if}

							{#if error}
								<div class="rounded-md bg-red-50 p-4">
									<div class="flex">
										<div class="flex-shrink-0">
											<svg
												class="h-5 w-5 text-red-400"
												viewBox="0 0 20 20"
												fill="currentColor"
												aria-hidden="true"
											>
												<path
													fill-rule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
										<div class="ml-3">
											<p class="text-sm text-red-700">{error}</p>
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if} 