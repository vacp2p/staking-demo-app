import init from '@web3-onboard/core';
import injectedModule from '@web3-onboard/injected-wallets';
import walletConnectModule from '@web3-onboard/walletconnect';
import coinbaseModule from '@web3-onboard/coinbase';
import { sepolia } from 'viem/chains';

// Initialize wallet modules
const injected = injectedModule();
const walletConnect = walletConnectModule({
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'fdd52eb9a327dc5de49d31e8efde3022',
  dappUrl: 'https://staking-demo-app.netlify.app'
});
const coinbase = coinbaseModule();

// Define chains
const chains = [
  {
    id: '0x' + sepolia.id.toString(16),
    token: 'ETH',
    label: 'Sepolia Testnet',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org'
  }
];

// App metadata
const appMetadata = {
  name: 'Status Staking',
  icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fill="currentColor"/></svg>',
  description: 'Status Staking Demo Application',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
  ]
};

// Initialize Web3-Onboard
const onboard = init({
  wallets: [injected, walletConnect, coinbase],
  chains,
  appMetadata
});

export default onboard; 