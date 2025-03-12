<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		walletAddress,
		network,
		formattedBalance,
		formattedSntBalance,
		SNT_TOKEN,
		sntError
	} from '$lib/viem';
	import { connectWithOnboard, disconnectWithOnboard, isConnecting, initializeWallet, isWalletInitialized } from '$lib/onboardToViem';
	import { walletPreferences } from '$lib/stores/wallet';
	import ChainSwitcher from './ChainSwitcher.svelte';

	// State for dropdown menu
	let showSettings = false;

	// Initialize wallet connection on component mount
	onMount(() => {
		if (!$isWalletInitialized) {
			initializeWallet();
		}
	});

	async function handleConnect() {
		try {
			await connectWithOnboard();
		} catch (error) {
			console.error('Failed to connect wallet:', error);
		}
	}

	function handleDisconnect() {
		disconnectWithOnboard();
	}
	
	function toggleAutoConnect() {
		walletPreferences.update(prefs => ({
			...prefs,
			autoConnect: !prefs.autoConnect
		}));
	}
	
	function toggleSettings() {
		showSettings = !showSettings;
	}
	
	// Close settings when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (showSettings && target && !target.closest('.settings-dropdown')) {
			showSettings = false;
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<div class="relative z-50 bg-white">
	<div class="mx-auto max-w-7xl">
		<div class="relative flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
			<div class="flex flex-shrink-0 items-center justify-between sm:justify-start">
				<div class="flex items-center">
					<span class="text-lg font-semibold leading-7 text-gray-900"> Status Staking </span>
					<div class="ml-4 hidden sm:inline-flex">
						<ChainSwitcher />
					</div>
				</div>

				<div class="sm:hidden">
					{#if $walletAddress}
						<div class="flex items-center gap-2">
							<button
								on:click={handleDisconnect}
								class="group relative overflow-hidden rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50"
							>
								<span class="block transition-all duration-200 group-hover:-translate-y-[200%]">
									{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}
								</span>
								<span
									class="absolute inset-0 flex translate-y-[200%] items-center justify-center transition-all duration-200 group-hover:translate-y-0"
								>
									Disconnect
								</span>
							</button>
							
							<div class="relative settings-dropdown">
								<button
									on:click={toggleSettings}
									class="rounded-lg bg-white p-1.5 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
									aria-label="Settings"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
									</svg>
								</button>
								
								{#if showSettings}
									<div class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
										<div class="px-4 py-2 text-sm text-gray-700">
											<label class="flex items-center gap-2">
												<input 
													type="checkbox" 
													checked={$walletPreferences.autoConnect} 
													on:change={toggleAutoConnect}
													class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
												/>
												Auto-connect wallet
											</label>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{:else}
						<button
							on:click={handleConnect}
							class="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50"
							disabled={$isConnecting}
						>
							{#if $isConnecting}
								<span class="flex items-center">
									<svg
										class="mr-2 h-4 w-4 animate-spin text-blue-600"
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
									Connecting...
								</span>
							{:else}
								Connect
							{/if}
						</button>
					{/if}
				</div>
			</div>

			<div class="flex flex-wrap justify-center gap-2 sm:flex-1 sm:gap-6">
				<a
					href="/"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url
						.pathname === '/'
						? 'rounded-lg bg-blue-100 text-blue-700'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Overview
				</a>
				<a
					href="/stake"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url
						.pathname === '/stake'
						? 'rounded-lg bg-blue-100 text-blue-700'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Stake
				</a>
				<a
					href="/manage"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url
						.pathname === '/manage'
						? 'rounded-lg bg-blue-100 text-blue-700'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Manage
				</a>
				<a
					href="/karma-nft"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url
						.pathname === '/karma-nft'
						? 'rounded-lg bg-blue-100 text-blue-700'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					KarmaNFT
				</a>
			</div>

			<div class="hidden flex-shrink-0 items-center gap-x-4 sm:flex">
				{#if $walletAddress}
					<div class="flex items-center gap-2">
						<button
							on:click={handleDisconnect}
							class="group relative overflow-hidden rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 transition-all hover:bg-gray-50"
						>
							<span class="block transition-all duration-200 group-hover:-translate-y-[200%]">
								{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}
							</span>
							<span
								class="absolute inset-0 flex translate-y-[200%] items-center justify-center transition-all duration-200 group-hover:translate-y-0"
							>
								Disconnect
							</span>
						</button>
						
						<div class="relative settings-dropdown">
							<button
								on:click={toggleSettings}
								class="rounded-lg bg-white p-2 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
								aria-label="Settings"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
									<path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
								</svg>
							</button>
							
							{#if showSettings}
								<div class="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
									<div class="px-4 py-2 text-sm text-gray-700">
										<label class="flex items-center gap-2">
											<input 
												type="checkbox" 
												checked={$walletPreferences.autoConnect} 
												on:change={toggleAutoConnect}
												class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
											/>
											Auto-connect wallet
										</label>
									</div>
								</div>
							{/if}
						</div>
					</div>
				{:else}
					<button
						on:click={handleConnect}
						class="rounded-lg bg-blue-100 px-3.5 py-2 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50"
						disabled={$isConnecting}
					>
						{#if $isConnecting}
							<span class="flex items-center">
								<svg
									class="mr-2 h-4 w-4 animate-spin text-blue-600"
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
								Connecting...
							</span>
						{:else}
							Connect Wallet
						{/if}
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
