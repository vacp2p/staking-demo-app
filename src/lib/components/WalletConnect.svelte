<script lang="ts">
	import { page } from '$app/stores';
	import {
		walletAddress,
		network,
		formattedBalance,
		formattedSntBalance,
		SNT_TOKEN,
		sntError
	} from '$lib/viem';
	import { connectWithOnboard, disconnectWithOnboard, isConnecting } from '$lib/onboardToViem';
	import ChainSwitcher from './ChainSwitcher.svelte';

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
</script>

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
