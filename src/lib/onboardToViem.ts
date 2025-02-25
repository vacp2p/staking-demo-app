import { createWalletClient, custom, type WalletClient, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { writable, type Writable } from 'svelte/store';
import onboard from './onboard';
import { walletAddress, walletClient, refreshBalances } from './viem';
import type { WalletState } from '@web3-onboard/core';

// Store for tracking connection state
export const isConnecting: Writable<boolean> = writable(false);

/**
 * Connect wallet using Web3-Onboard and initialize viem wallet client
 */
export async function connectWithOnboard() {
  try {
    isConnecting.set(true);
    
    // Connect wallet using Web3-Onboard - this will directly open the Web3-Onboard modal
    const wallets = await onboard.connectWallet();
    
    if (!wallets || wallets.length === 0) {
      throw new Error('No wallet connected');
    }
    
    const connectedWallet = wallets[0];
    
    if (!connectedWallet.provider) {
      throw new Error('No provider available');
    }
    
    // Get the connected address
    const address = connectedWallet.accounts[0].address as Address;
    
    // Create viem wallet client with the provider from Web3-Onboard
    const client = createWalletClient({
      chain: sepolia,
      transport: custom(connectedWallet.provider)
    });
    
    // Update viem stores
    walletAddress.set(address);
    walletClient.set(client);
    
    // Fetch initial balances and data
    await refreshBalances(address);
    
    // Setup subscription to wallet changes
    onboard.state.select('wallets').subscribe(async (newWallets: WalletState[]) => {
      if (newWallets.length === 0) {
        // Wallet disconnected
        walletAddress.set(undefined);
        walletClient.set(undefined);
      } else if (newWallets[0].accounts[0].address !== address) {
        // Address changed
        const newAddress = newWallets[0].accounts[0].address as Address;
        walletAddress.set(newAddress);
        
        // Create new wallet client if provider changed
        if (newWallets[0].provider !== connectedWallet.provider) {
          const newClient = createWalletClient({
            chain: sepolia,
            transport: custom(newWallets[0].provider)
          });
          walletClient.set(newClient);
        }
        
        // Refresh balances with new address
        await refreshBalances(newAddress);
      }
    });
    
    return { address, client };
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  } finally {
    isConnecting.set(false);
  }
}

/**
 * Disconnect wallet using Web3-Onboard
 */
export async function disconnectWithOnboard() {
  const connectedWallets = onboard.state.get().wallets;
  
  if (connectedWallets.length) {
    await onboard.disconnectWallet({ label: connectedWallets[0].label });
  }
  
  // Clear viem stores
  walletAddress.set(undefined);
  walletClient.set(undefined);
} 