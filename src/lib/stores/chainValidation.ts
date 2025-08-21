import { writable, derived } from 'svelte/store';
import { statusNetworkTestnet } from '$lib/viem';

// Store for current chain validation state  
export const isOnWrongChain = writable(false);
export const currentChainId = writable<string | null>(null);

// Expected chain ID in hex format
export const expectedChainId = `0x${statusNetworkTestnet.id.toString(16)}`;

// Derived store to check if interactions should be blocked
export const shouldBlockInteractions = derived(
	[isOnWrongChain],
	([$isOnWrongChain]) => $isOnWrongChain
);

// Helper function to get chain name from chain ID
export function getChainName(chainId: string): string {
	switch (chainId) {
		case '0x1':
			return 'Ethereum Mainnet';
		case '0xaa36a7':
			return 'Sepolia Testnet';
		case expectedChainId:
			return 'Status Network Testnet';
		default:
			return `Unknown Chain (${chainId})`;
	}
}
