<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import onboard from '$lib/onboard';
	import type { WalletState } from '@web3-onboard/core';
	import type { Subscription } from 'rxjs';
	import { 
		isOnWrongChain, 
		currentChainId, 
		expectedChainId, 
		getChainName 
	} from '$lib/stores/chainValidation';
	
	let subscription: Subscription | null = null;
	let isSwitching = false;
	let switchError: string | null = null;

	onMount(() => {
		// Subscribe to wallet state changes
		subscription = onboard.state.select('wallets').subscribe((wallets: WalletState[]) => {
			if (wallets.length > 0 && wallets[0].chains[0]) {
				const currentChain = wallets[0].chains[0].id;
				currentChainId.set(currentChain);
				
				// Check if user is on the wrong chain
				const wrongChain = currentChain !== expectedChainId;
				isOnWrongChain.set(wrongChain);
				
				if (wrongChain) {
					console.warn(`Wrong chain detected. Current: ${currentChain}, Expected: ${expectedChainId}`);
				}
			} else {
				// No wallets connected
				isOnWrongChain.set(false);
				currentChainId.set(null);
			}
		});
	});

	onDestroy(() => {
		if (subscription) {
			subscription.unsubscribe();
		}
	});

	async function switchToCorrectChain() {
		if (isSwitching) return;
		
		try {
			isSwitching = true;
			switchError = null;
			
			// Use Web3-Onboard's setChain method
			const success = await onboard.setChain({ 
				chainId: expectedChainId,
				chainNamespace: 'evm'
			});
			
			if (!success) {
				throw new Error('Failed to switch chain');
			}
		} catch (error) {
			console.error('Error switching chain:', error);
			switchError = error instanceof Error ? error.message : 'Failed to switch chain';
		} finally {
			isSwitching = false;
		}
	}

	function dismissError() {
		switchError = null;
	}
</script>

{#if $isOnWrongChain}
	<div class="fixed top-0 left-0 right-0 z-[60] bg-amber-50 border-b border-amber-200 shadow-sm">
		<div class="container mx-auto px-4 py-3">
			<!-- Desktop Layout -->
			<div class="hidden sm:flex items-center justify-between">
				<div class="flex items-center space-x-3">
					<svg class="h-5 w-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<div>
						<p class="font-medium text-amber-800">Wrong Network Detected</p>
						<p class="text-sm text-amber-700">
							You're connected to {$currentChainId ? getChainName($currentChainId) : 'an unknown network'}. 
							Please switch to Status Network Testnet to use this app.
						</p>
					</div>
				</div>
				<div class="flex items-center space-x-2 flex-shrink-0 ml-4">
					<button
						on:click={switchToCorrectChain}
						disabled={isSwitching}
						class="bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-50 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
					>
						{#if isSwitching}
							<span class="flex items-center">
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Switching...
							</span>
						{:else}
							Switch Network
						{/if}
					</button>
				</div>
			</div>

			<!-- Mobile Layout -->
			<div class="sm:hidden space-y-3">
				<div class="flex items-start space-x-3">
					<svg class="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-amber-800">Wrong Network</p>
						<p class="text-sm text-amber-700">
							Switch to Status Network Testnet to use this app.
						</p>
					</div>
				</div>
				<div class="pl-8">
					<button
						on:click={switchToCorrectChain}
						disabled={isSwitching}
						class="w-full bg-amber-600 text-white px-4 py-2.5 rounded-md text-sm font-medium hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if isSwitching}
							<span class="flex items-center justify-center">
								<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
									<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
									<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Switching...
							</span>
						{:else}
							Switch Network
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if switchError}
	<div class="fixed top-16 left-0 right-0 z-[60] bg-orange-50 border-b border-orange-200 shadow-sm">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-start justify-between space-x-3">
				<div class="flex items-start space-x-3 flex-1 min-w-0">
					<svg class="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="flex-1 min-w-0">
						<p class="font-medium text-orange-800">Network Switch Failed</p>
						<p class="text-sm text-orange-700 break-words">{switchError}</p>
						<p class="text-sm text-orange-700">Please manually switch to Status Network Testnet in your wallet.</p>
					</div>
				</div>
				<button
					on:click={dismissError}
					class="text-orange-600 hover:text-orange-800 focus:outline-none flex-shrink-0"
					aria-label="Dismiss error"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
		</div>
	</div>
{/if}
