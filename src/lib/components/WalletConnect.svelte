<script lang="ts">
	import { page } from '$app/stores';
	import { connectWallet, disconnectWallet, walletAddress, network, formattedBalance, formattedSntBalance, SNT_TOKEN, sntError } from '$lib/viem';

	async function handleConnect() {
		try {
			await connectWallet();
		} catch (error) {
			console.error('Failed to connect wallet:', error);
			alert('Failed to connect wallet. Make sure MetaMask is installed and try again.');
		}
	}

	function handleDisconnect() {
		disconnectWallet();
	}
</script>

<div class="relative z-50 bg-white">
	<div class="mx-auto max-w-7xl">
		<div class="relative flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 lg:px-8">
			<div class="flex items-center justify-between sm:justify-start flex-shrink-0">
				<div class="flex items-center">
					<span class="text-lg font-semibold leading-7 text-gray-900">
						Status Staking
					</span>
					<span class="ml-4 hidden sm:inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
						{network.name}
					</span>
				</div>

				<div class="sm:hidden">
					{#if $walletAddress}
						<button
							on:click={handleDisconnect}
							class="group relative rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all overflow-hidden"
						>
							<span class="block transition-all duration-200 group-hover:-translate-y-[200%]">
								{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}
							</span>
							<span class="absolute inset-0 flex items-center justify-center transition-all duration-200 translate-y-[200%] group-hover:translate-y-0">
								Disconnect
							</span>
						</button>
					{:else}
						<button
							on:click={handleConnect}
							class="rounded-lg bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-all"
						>
							Connect
						</button>
					{/if}
				</div>
			</div>

			<div class="flex justify-center flex-wrap gap-2 sm:gap-6 sm:flex-1">
				<a
					href="/"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url.pathname === '/'
						? 'bg-blue-100 text-blue-700 rounded-lg'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Overview
				</a>
				<a
					href="/stake"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url.pathname === '/stake'
						? 'bg-blue-100 text-blue-700 rounded-lg'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Stake
				</a>
				<a
					href="/manage"
					class="inline-flex items-center px-3 py-2 text-sm font-medium transition-all {$page.url.pathname === '/manage'
						? 'bg-blue-100 text-blue-700 rounded-lg'
						: 'text-gray-600 hover:text-blue-600'}"
				>
					Manage
				</a>
			</div>

			<div class="hidden sm:flex items-center gap-x-4 flex-shrink-0">
				{#if $walletAddress}
					<button
						on:click={handleDisconnect}
						class="group relative rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-all overflow-hidden"
					>
						<span class="block transition-all duration-200 group-hover:-translate-y-[200%]">
							{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}
						</span>
						<span class="absolute inset-0 flex items-center justify-center transition-all duration-200 translate-y-[200%] group-hover:translate-y-0">
							Disconnect
						</span>
					</button>
				{:else}
					<button
						on:click={handleConnect}
						class="rounded-lg bg-blue-100 px-3.5 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-all"
					>
						Connect Wallet
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
