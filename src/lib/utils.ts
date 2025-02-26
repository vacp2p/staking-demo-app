import { get } from 'svelte/store';
import { currentChain, statusNetworkTestnet } from '$lib/viem';
import type { Address } from 'viem';

// Function to get the explorer URL based on the current chain
function getExplorerUrl(): string {
	const chain = get(currentChain);
	
	if (chain.id === statusNetworkTestnet.id) {
		return 'https://sepoliascan.status.network';
	}
	
	// Default to Sepolia
	return 'https://sepolia.etherscan.io';
}

// Function to open transaction on the appropriate explorer
export function openExplorer(hash: string) {
	const baseUrl = getExplorerUrl();
	window.open(`${baseUrl}/tx/${hash}`, '_blank');
}

// Function to open address on the appropriate explorer
export function openAddressExplorer(address: Address) {
	const baseUrl = getExplorerUrl();
	window.open(`${baseUrl}/address/${address}`, '_blank');
}
