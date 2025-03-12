import { createWalletClient, custom, type WalletClient, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { writable, type Writable, get } from 'svelte/store';
import onboard from './onboard';
import { walletAddress, walletClient, refreshBalances } from './viem';
import type { WalletState } from '@web3-onboard/core';
import { browser } from '$app/environment';
import { walletPreferences } from './stores/wallet';

// Store for tracking connection state
export const isConnecting: Writable<boolean> = writable(false);
// Store for tracking if wallet is initialized
export const isWalletInitialized: Writable<boolean> = writable(false);

// Local storage key for wallet connection
const WALLET_CONNECT_KEY = 'wallet-connection';

/**
 * Initialize wallet connection on app start
 * This should be called when the app loads
 */
export async function initializeWallet() {
  if (!browser) return;
  
  try {
    // Check if auto-connect is enabled in preferences
    const preferences = get(walletPreferences);
    if (!preferences.autoConnect) {
      isWalletInitialized.set(true);
      return;
    }
    
    isConnecting.set(true);
    
    // Check if we have a previously connected wallet
    const previousWallet = localStorage.getItem(WALLET_CONNECT_KEY);
    
    if (previousWallet) {
      // Try to reconnect using the stored wallet label
      const wallets = await onboard.connectWallet({
        autoSelect: { label: previousWallet, disableModals: true }
      });
      
      if (wallets && wallets.length > 0) {
        const connectedWallet = wallets[0];
        
        if (connectedWallet.provider) {
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
          
          // Setup wallet change subscription
          setupWalletSubscription(connectedWallet);
        }
      }
    }
  } catch (error) {
    console.error('Failed to initialize wallet:', error);
    // Clear any stored connection if initialization fails
    localStorage.removeItem(WALLET_CONNECT_KEY);
  } finally {
    isConnecting.set(false);
    isWalletInitialized.set(true);
  }
}

/**
 * Setup subscription to wallet changes
 */
function setupWalletSubscription(initialWallet: WalletState) {
  const initialAddress = initialWallet.accounts[0].address as Address;
  
  onboard.state.select('wallets').subscribe(async (newWallets: WalletState[]) => {
    if (newWallets.length === 0) {
      // Wallet disconnected
      walletAddress.set(undefined);
      walletClient.set(undefined);
      localStorage.removeItem(WALLET_CONNECT_KEY);
    } else if (newWallets[0].accounts[0].address !== get(walletAddress)) {
      // Address changed
      const newAddress = newWallets[0].accounts[0].address as Address;
      walletAddress.set(newAddress);
      
      // Create new wallet client if provider changed
      if (newWallets[0].provider !== initialWallet.provider) {
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
}

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
    
    // Save wallet connection to localStorage
    localStorage.setItem(WALLET_CONNECT_KEY, connectedWallet.label);
    
    // Fetch initial balances and data
    await refreshBalances(address);
    
    // Setup wallet change subscription
    setupWalletSubscription(connectedWallet);
    
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
  
  // Remove wallet connection from localStorage
  localStorage.removeItem(WALLET_CONNECT_KEY);
} 