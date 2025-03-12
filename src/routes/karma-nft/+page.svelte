<script lang="ts">
  import { walletAddress, publicClient } from '$lib/viem';
  import { onMount, onDestroy } from 'svelte';
  import { KARMA_NFT_ADDRESS, karmaNftAbi } from '$lib/contracts/karmaNftAbi';
  import type { Address } from 'viem';
  import { formatUnits } from 'viem';
  
  // NFT data structure
  type NftMetadata = {
    name: string;
    description: string;
    image: string;
  };
  
  let isLoading = false;
  let error: string | null = null;
  let nftMetadata: NftMetadata | null = null;
  let decodedSvg: string | null = null;
  let karmaBalance: string = '0';
  
  // Function to derive tokenID from wallet address
  function deriveTokenIdFromAddress(address: Address): bigint {
    // Convert address to decimal (bigint)
    return BigInt(address);
  }
  
  // Function to decode base64 data
  function decodeBase64(data: string): string {
    // Browser-compatible base64 decoding
    return atob(data);
  }
  
  // Function to extract and format Karma balance from description
  function extractKarmaBalance(description: string): string {
    const balanceMatch = description.match(/with balance (\d+)/);
    if (balanceMatch && balanceMatch[1]) {
      const rawBalance = BigInt(balanceMatch[1]);
      return formatUnits(rawBalance, 18);
    }
    return '0';
  }
  
  // Function to copy text to clipboard
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Could add a toast notification here
        console.log('Copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  }
  
  // Function to fetch and decode NFT metadata
  async function fetchNftMetadata(address: Address) {
    if (!address) return;
    
    isLoading = true;
    error = null;
    nftMetadata = null;
    decodedSvg = null;
    karmaBalance = '0';
    
    try {
      // Derive tokenID from address
      const tokenId = deriveTokenIdFromAddress(address);
      
      // Fetch tokenURI from contract
      const tokenUri = await publicClient.readContract({
        address: KARMA_NFT_ADDRESS,
        abi: karmaNftAbi,
        functionName: 'tokenURI',
        args: [tokenId]
      });
      
      // Parse data URI
      if (tokenUri.startsWith('data:application/json;base64,')) {
        const base64Data = tokenUri.replace('data:application/json;base64,', '');
        const jsonString = decodeBase64(base64Data);
        const metadata = JSON.parse(jsonString) as NftMetadata;
        nftMetadata = metadata;
        
        // Extract Karma balance from description
        if (metadata.description) {
          karmaBalance = extractKarmaBalance(metadata.description);
        }
        
        // Decode SVG image if it's base64 encoded
        if (metadata.image && metadata.image.startsWith('data:image/svg+xml;base64,')) {
          const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
          decodedSvg = decodeBase64(svgBase64);
        }
      } else {
        throw new Error('Unsupported token URI format');
      }
    } catch (err) {
      console.error('Error fetching NFT metadata:', err);
      error = err instanceof Error ? err.message : 'Failed to fetch NFT metadata';
    } finally {
      isLoading = false;
    }
  }
  
  // Watch for wallet address changes
  $: if ($walletAddress) {
    fetchNftMetadata($walletAddress);
  }
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
  {#if $walletAddress}
    <div class="mx-auto mt-8 max-w-4xl">
      <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Your KarmaNFT</h1>
        
        {#if isLoading}
          <div class="flex justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else if error}
          <div class="bg-red-50 p-4 rounded-lg mb-6">
            <p class="text-red-700">Error: {error}</p>
          </div>
          <button 
            on:click={() => fetchNftMetadata($walletAddress)}
            class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        {:else if nftMetadata}
          <!-- Karma Balance Display -->
          <div class="bg-blue-50 p-4 rounded-lg mb-6">
            <div class="flex flex-col">
              <h3 class="text-sm font-medium text-blue-700">Karma Balance</h3>
              <div class="mt-1 flex items-baseline">
                <span class="text-2xl font-bold text-blue-900">{parseFloat(karmaBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                <span class="ml-1 text-sm text-blue-700">KARMA</span>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- NFT Image (Left Side) -->
            <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
              {#if decodedSvg}
                <div class="w-full h-full flex items-center justify-center">
                  {@html decodedSvg}
                </div>
              {:else if nftMetadata.image}
                <img 
                  src={nftMetadata.image} 
                  alt="KarmaNFT" 
                  class="max-w-full max-h-64 object-contain"
                />
              {:else}
                <!-- Placeholder Image -->
                <div class="w-full h-64 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                  <svg class="w-20 h-20 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M8.5 12.5L10.5 14.5L15.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M7 3.33782C8.47087 2.48697 10.1786 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 10.1786 2.48697 8.47087 3.33782 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  <p class="mt-4 text-blue-600 font-medium">Your KarmaNFT</p>
                  <p class="text-sm text-blue-400 mt-1">Proof of your contribution</p>
                  <div class="mt-4 text-center px-4">
                    <p class="text-gray-500 text-sm">Your NFT image will appear here once loaded</p>
                    <p class="text-gray-400 text-xs mt-1">This visual representation reflects your Karma balance</p>
                  </div>
                </div>
              {/if}
            </div>
            
            <!-- Token Details (Right Side) -->
            <div class="flex flex-col">
              <div>
                <h3 class="text-sm font-medium text-gray-500 mb-2">Token Details</h3>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-500">Owner</span>
                    <div class="flex items-center">
                      <span class="text-gray-900 font-medium">{$walletAddress.slice(0, 6)}...{$walletAddress.slice(-4)}</span>
                      <button 
                        on:click={() => copyToClipboard($walletAddress)}
                        class="ml-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Copy address"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex justify-between items-center text-sm mt-2">
                    <span class="text-gray-500">Token ID</span>
                    <div class="flex items-center">
                      <span class="text-gray-900 font-medium">{deriveTokenIdFromAddress($walletAddress).toString().slice(0, 10)}...</span>
                      <button 
                        on:click={() => copyToClipboard(deriveTokenIdFromAddress($walletAddress).toString())}
                        class="ml-1.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                        title="Copy token ID"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div class="flex justify-between text-sm mt-2">
                    <span class="text-gray-500">Contract</span>
                    <a 
                      href={`https://sepoliascan.status.network/address/${KARMA_NFT_ADDRESS}?tab=contract_source_code`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      class="text-blue-600 hover:text-blue-800"
                    >
                      {KARMA_NFT_ADDRESS.slice(0, 6)}...{KARMA_NFT_ADDRESS.slice(-4)}
                    </a>
                  </div>
                </div>
              </div>
              
              <div class="mt-auto pt-4">
                <button 
                  on:click={() => fetchNftMetadata($walletAddress)}
                  class="w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg class="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        {:else}
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-blue-700">
              Your wallet is connected. Fetching your KarmaNFT...
            </p>
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <div class="mx-auto mt-16 max-w-2xl text-center">
      <div class="rounded-xl bg-white p-8 shadow-sm">
        <h3 class="text-sm font-semibold leading-7 text-gray-900">Connect Wallet</h3>
        <p class="mt-2 text-sm leading-6 text-gray-500">Connect your wallet to view your KarmaNFT features</p>
      </div>
    </div>
  {/if}
</div> 