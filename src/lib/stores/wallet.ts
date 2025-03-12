import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { walletAddress } from '$lib/viem';

// Create a store for wallet connection status
export const walletConnected = derived(
  walletAddress,
  $walletAddress => !!$walletAddress
);

// Create a store for persisting wallet preferences
export const walletPreferences = writable({
  autoConnect: true,
  lastConnectedChain: null
});

// Initialize wallet preferences from localStorage if available
if (browser) {
  const storedPreferences = localStorage.getItem('wallet-preferences');
  if (storedPreferences) {
    try {
      const parsed = JSON.parse(storedPreferences);
      walletPreferences.set(parsed);
    } catch (error) {
      console.error('Failed to parse wallet preferences:', error);
    }
  }

  // Subscribe to changes and update localStorage
  walletPreferences.subscribe(preferences => {
    localStorage.setItem('wallet-preferences', JSON.stringify(preferences));
  });
} 