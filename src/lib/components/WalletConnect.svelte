<script lang="ts">
	import { connectWallet, disconnectWallet, walletAddress, network } from '$lib/viem';

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

<div class="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
	<div class="text-lg font-semibold text-gray-800">
		Staking Demo
	</div>

	{#if $walletAddress}
		<div class="flex items-center gap-4">
			<div class="flex flex-col items-end gap-1">
				<span class="text-sm font-medium text-gray-600">
					{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}
				</span>
				<span class="px-2 py-0.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-full">
					{network.name}
				</span>
			</div>
			<button
				on:click={handleDisconnect}
				class="px-4 py-2 text-sm font-medium text-red-600 transition-colors border border-red-200 rounded-lg hover:bg-red-50"
			>
				Disconnect
			</button>
		</div>
	{:else}
		<button
			on:click={handleConnect}
			class="px-4 py-2 text-sm font-medium text-white transition-colors bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
		>
			Connect Wallet
		</button>
	{/if}
</div>
