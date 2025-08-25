<script lang="ts">
  import { walletAddress, publicClient } from '$lib/viem';
  import { onMount, onDestroy } from 'svelte';
  import { KARMA_NFT_ADDRESS, karmaNftAbi } from '$lib/contracts/karmaNftAbi';
  import { KARMA_TIERS } from '$lib/config/contracts';
  import type { Address } from 'viem';
  import { formatUnits } from 'viem';
  
  // NFT data structure
  type NftMetadata = {
    name: string;
    description: string;
    image_data?: string;
    image?: string;
  };

  // Tier data structure
  type Tier = {
    minKarma: bigint;
    maxKarma: bigint;
    name: string;
    txPerEpoch: number;
  };
  
  let isLoading = false;
  let error: string | null = null;
  let nftMetadata: NftMetadata | null = null;
  let decodedSvg: string | null = null;
  let karmaBalance: string = '0';
  let imageDataUrl: string | null = null;
  
  // Tier data state
  let tiers: Tier[] = [];
  let isLoadingTiers = false;
  let tierError: string | null = null;
  
  // Current user tier calculation
  $: currentKarmaNum = Math.floor(parseFloat(karmaBalance));
  $: currentTier = calculateUserTier(currentKarmaNum, tiers);
  $: nextTier = calculateNextTier(currentTier, tiers);
  $: tierProgress = calculateTierProgress(currentKarmaNum, currentTier, nextTier);
  
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

  // Function to calculate user's current tier
  function calculateUserTier(karmaAmount: number, tierList: Tier[]) {
    if (!tierList.length || karmaAmount < 1) return null; // Must have at least 1 karma for any tier
    
    for (let i = 0; i < tierList.length; i++) {
      const tier = tierList[i];
      // Ensure first tier starts at 1 karma minimum
      const minKarma = i === 0 ? Math.max(1, Number(tier.minKarma)) : Number(tier.minKarma);
      const maxKarma = Number(tier.maxKarma);
      
      // Handle unlimited tier (maxKarma is 0 or very large)
      if (maxKarma === 0 || maxKarma >= 18446744073709551615) {
        if (karmaAmount >= minKarma) {
          return { ...tier, index: i };
        }
      } else {
        // Regular tier with range
        if (karmaAmount >= minKarma && karmaAmount <= maxKarma) {
          return { ...tier, index: i };
        }
      }
    }
    
    return null; // No tier found
  }

  // Function to find the next tier
  function calculateNextTier(currentTierData: any, tierList: Tier[]) {
    if (!tierList.length || !currentTierData) {
      // If no current tier, return the first tier
      return tierList.length > 0 ? { ...tierList[0], index: 0 } : null;
    }
    
    const nextIndex = currentTierData.index + 1;
    if (nextIndex < tierList.length) {
      return { ...tierList[nextIndex], index: nextIndex };
    }
    
    return null; // Already at highest tier
  }

  // Function to calculate progress towards next tier
  function calculateTierProgress(karmaAmount: number, currentTierData: any, nextTierData: any) {
    if (!nextTierData) return { percentage: 100, needed: 0 };
    
    const nextTierMin = Number(nextTierData.minKarma);
    const currentProgress = karmaAmount;
    const needed = Math.max(0, nextTierMin - currentProgress);
    
    let percentage = 0;
    if (currentTierData) {
      const currentMin = Number(currentTierData.minKarma);
      const range = nextTierMin - currentMin;
      const progress = currentProgress - currentMin;
      percentage = range > 0 ? Math.min(100, Math.max(0, (progress / range) * 100)) : 0;
    } else {
      // No current tier, progress from 0 to first tier
      percentage = nextTierMin > 0 ? Math.min(100, (currentProgress / nextTierMin) * 100) : 0;
    }
    
    return { percentage, needed };
  }

  // Messages for users with no tier yet (< 1 karma)
  const noTierYetMessages = [
    "No tier yet! 🌱",
    "Karma journey begins! ✨", 
    "First step awaits! 🚀",
    "Ready to start? 💫"
  ];

  // Witty messages for users with karma but no tier (edge case)
  const noTierMessages = [
    "No tier defines you! 🚀",
    "You've escaped all tiers! 🌟", 
    "Too unique for categories! ✨",
    "Breaking the tier system! 🔥",
    "Off the charts! 📈",
    "Tier system.exe stopped working 🤖"
  ];
  
  $: randomNoTierMessage = noTierMessages[Math.floor(Math.random() * noTierMessages.length)];
  $: randomNoTierYetMessage = noTierYetMessages[Math.floor(Math.random() * noTierYetMessages.length)];
  
  // Check if user has less than 1 karma (no tier yet)
  $: isNoTierYet = currentKarmaNum < 1;
  
  // Function to fetch tier data from contract
  async function fetchTierData() {
    if (!publicClient) return;
    
    isLoadingTiers = true;
    tierError = null;
    tiers = [];
    
    try {
      console.log('Fetching tier count...');
      
      // First get the tier count
      const tierCount = await publicClient.readContract({
        address: KARMA_TIERS.address,
        abi: KARMA_TIERS.abi,
        functionName: 'getTierCount'
      }) as bigint;
      
      console.log(`Found ${tierCount.toString()} tiers`);
      
      // Fetch each tier by ID
      const tierPromises = [];
      for (let i = 0; i < Number(tierCount); i++) {
        tierPromises.push(
          publicClient.readContract({
            address: KARMA_TIERS.address,
            abi: KARMA_TIERS.abi,
            functionName: 'getTierById',
            args: [i]
          })
        );
      }
      
      // Wait for all tier data
      const tierResults = await Promise.all(tierPromises);
      
      // Process and store tier data
      tiers = tierResults.map((tierData: any, index: number) => {
        const tier = {
          minKarma: tierData.minKarma,
          maxKarma: tierData.maxKarma,
          name: tierData.name,
          txPerEpoch: Number(tierData.txPerEpoch)
        };
        console.log(`Tier ${index}:`, {
          name: tier.name,
          minKarma: tier.minKarma.toString(),
          maxKarma: tier.maxKarma.toString(),
          txPerEpoch: tier.txPerEpoch
        });
        return tier;
      });
      
      console.log('Fetched tiers:', tiers);
      
    } catch (err) {
      console.error('Error fetching tier data:', err);
      tierError = err instanceof Error ? err.message : 'Failed to fetch tier data';
    } finally {
      isLoadingTiers = false;
    }
  }

  // Function to fetch and decode NFT metadata
  async function fetchNftMetadata(address: Address) {
    if (!address) return;
    
    isLoading = true;
    error = null;
    nftMetadata = null;
    decodedSvg = null;
    karmaBalance = '0';
    imageDataUrl = null;
    
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
      
      console.log('Raw tokenURI:', tokenUri);
      
      // Parse data URI
      if (tokenUri.startsWith('data:application/json;base64,')) {
        const base64Data = tokenUri.replace('data:application/json;base64,', '');
        const jsonString = decodeBase64(base64Data);
        console.log('Decoded metadata JSON:', jsonString);
        
        const metadata = JSON.parse(jsonString) as NftMetadata;
        nftMetadata = metadata;
        
        console.log('Parsed metadata:', metadata);
        
        // Extract Karma balance from description
        if (metadata.description) {
          karmaBalance = extractKarmaBalance(metadata.description);
        }
        
        // Process image data - prioritize image_data (new format)
        if (metadata.image_data) {
          console.log('Found image_data:', metadata.image_data.substring(0, 100) + '...');
          
          if (metadata.image_data.startsWith('data:image/svg+xml;base64,')) {
            // Base64 encoded SVG
            const svgBase64 = metadata.image_data.replace('data:image/svg+xml;base64,', '');
            decodedSvg = decodeBase64(svgBase64);
            console.log('Decoded SVG from base64 image_data');
          } else if (metadata.image_data.includes('<svg')) {
            // Direct SVG content
            decodedSvg = metadata.image_data;
            console.log('Using image_data directly as SVG');
          } else if (metadata.image_data.startsWith('data:')) {
            // Other data URI format
            imageDataUrl = metadata.image_data;
            console.log('Using image_data as image source URL');
          } else {
            // Unknown format, try as SVG
            decodedSvg = metadata.image_data;
            console.log('Using image_data as SVG (unknown format)');
          }
        } 
        // Fallback to image (old format)
        else if (metadata.image) {
          console.log('Found image:', metadata.image.substring(0, 100) + '...');
          
          if (metadata.image.startsWith('data:image/svg+xml;base64,')) {
            // Base64 encoded SVG
            const svgBase64 = metadata.image.replace('data:image/svg+xml;base64,', '');
            decodedSvg = decodeBase64(svgBase64);
            console.log('Decoded SVG from base64 image');
          } else {
            // Use as image URL
            imageDataUrl = metadata.image;
            console.log('Using image as image source URL');
          }
        }
        
        if (decodedSvg) {
          console.log('Final SVG data:', decodedSvg.substring(0, 100) + '...');
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
    fetchTierData();
  }

  // Fetch tier data on mount (doesn't require wallet connection)
  onMount(() => {
    fetchTierData();
  });
</script>

<div class="mx-auto max-w-7xl px-6 lg:px-8">
  {#if $walletAddress}
    <div class="mx-auto mt-8 max-w-4xl">
      <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Tier & NFT</h1>
        
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
            on:click={() => {
              fetchNftMetadata($walletAddress);
              fetchTierData();
            }}
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

          <!-- Tier Information Section -->
          <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Your Tier Status</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Current Tier Info (Left Block) -->
              <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div class="flex flex-col h-full">
                  <h3 class="text-sm font-medium text-gray-700 mb-3">Current Tier</h3>
                  
                  {#if currentTier}
                    <div class="mb-4">
                      <span class="text-3xl font-bold text-gray-900">{currentTier.name}</span>
                      <div class="mt-2 text-sm text-gray-600">
                        Tier {currentTier.index + 1} of {tiers.length}
                      </div>
                      <div class="mt-1 text-xs text-gray-500">
                        {currentTier.txPerEpoch.toLocaleString()} transactions per epoch
                      </div>
                    </div>
                    
                    {#if nextTier}
                      <div class="mt-auto">
                        <div class="text-sm text-gray-700 mb-2">Next Tier Progress</div>
                        <div class="flex items-center justify-between text-sm mb-1">
                          <span class="text-gray-600">Current: {currentKarmaNum.toLocaleString()} KARMA</span>
                          <span class="text-gray-600">Need: {Number(nextTier.minKarma).toLocaleString()} KARMA</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                          <div class="bg-gray-600 h-2 rounded-full transition-all duration-300" style="width: {tierProgress.percentage}%"></div>
                        </div>
                        <div class="mt-2 text-xs text-gray-600">
                          You need <strong>{tierProgress.needed.toLocaleString()} more KARMA</strong> to reach <strong>{nextTier.name}</strong> tier
                        </div>
                      </div>
                    {:else}
                      <div class="mt-auto">
                        <div class="text-sm text-gray-700 mb-2">Achievement Unlocked! 🏆</div>
                        <div class="text-xs text-gray-600">
                          You've reached the highest tier available! You're at the top of the karma ladder.
                        </div>
                      </div>
                    {/if}
                  {:else}
                    <!-- No tier found -->
                    {#if isNoTierYet}
                      <!-- User has less than 1 karma -->
                      <div class="mb-4">
                        <span class="text-3xl font-bold text-gray-900">{randomNoTierYetMessage}</span>
                        <div class="mt-2 text-sm text-gray-600">
                          Get 1 Karma to get started! 
                        </div>
                      </div>
                      
                      {#if nextTier}
                        <div class="mt-auto">
                          <div class="text-sm text-gray-700 mb-2">Path to First Tier</div>
                          <div class="flex items-center justify-between text-sm mb-1">
                            <span class="text-gray-600">Current: {currentKarmaNum.toLocaleString()} KARMA</span>
                            <span class="text-gray-600">Need: 1 KARMA</span>
                          </div>
                          <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-gray-600 h-2 rounded-full transition-all duration-300" style="width: {Math.min(100, currentKarmaNum * 100)}%"></div>
                          </div>
                          <div class="mt-2 text-xs text-gray-600">
                            You need <strong>{Math.max(0, 1 - currentKarmaNum).toLocaleString()} more KARMA</strong> to join <strong>{nextTier.name}</strong> tier
                          </div>
                        </div>
                      {/if}
                    {:else}
                      <!-- User has karma but no tier (edge case) -->
                      <div class="mb-4">
                        <span class="text-3xl font-bold text-gray-900">{randomNoTierMessage}</span>
                        <div class="mt-2 text-sm text-gray-600">
                          Karma maverick detected
                        </div>
                      </div>
                      
                      {#if nextTier}
                        <div class="mt-auto opacity-60">
                          <div class="text-sm text-gray-500 mb-2">Path to First Tier</div>
                          <div class="flex items-center justify-between text-sm mb-1">
                            <span class="text-gray-500">Current: {currentKarmaNum.toLocaleString()} KARMA</span>
                            <span class="text-gray-500">Need: {Number(nextTier.minKarma).toLocaleString()} KARMA</span>
                          </div>
                          <div class="w-full bg-gray-300 rounded-full h-2">
                            <div class="bg-gray-400 h-2 rounded-full transition-all duration-300" style="width: {tierProgress.percentage}%"></div>
                          </div>
                          <div class="mt-2 text-xs text-gray-500">
                            {tierProgress.needed.toLocaleString()} more KARMA to join <strong>{nextTier.name}</strong> tier
                          </div>
                        </div>
                      {/if}
                    {/if}
                  {/if}
                </div>
              </div>

              <!-- Tier Composition (Right Block) -->
              <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <div class="flex flex-col h-full">
                  <h3 class="text-sm font-medium text-gray-700 mb-3">All Tiers</h3>
                  
                  {#if isLoadingTiers}
                    <div class="flex justify-center py-8">
                      <svg class="animate-spin h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  {:else if tierError}
                    <div class="bg-red-50 p-3 rounded-lg">
                      <p class="text-red-700 text-sm">Error loading tiers: {tierError}</p>
                    </div>
                  {:else if tiers.length > 0}
                    <div class="space-y-3 flex-1">
                      {#each tiers as tier, index}
                        <!-- Dynamic tier colors based on index -->
                        {@const tierColors = [
                          { bg: 'bg-gray-400', highlight: 'bg-gray-100 border-gray-300 text-gray-900', text: 'text-gray-600' },
                          { bg: 'bg-blue-400', highlight: 'bg-blue-100 border-blue-300 text-blue-900', text: 'text-blue-600' },
                          { bg: 'bg-purple-400', highlight: 'bg-purple-100 border-purple-300 text-purple-900', text: 'text-purple-600' },
                          { bg: 'bg-yellow-400', highlight: 'bg-yellow-100 border-yellow-300 text-yellow-900', text: 'text-yellow-600' },
                          { bg: 'bg-orange-400', highlight: 'bg-orange-100 border-orange-300 text-orange-900', text: 'text-orange-600' },
                          { bg: 'bg-red-400', highlight: 'bg-red-100 border-red-300 text-red-900', text: 'text-red-600' },
                          { bg: 'bg-indigo-400', highlight: 'bg-indigo-100 border-indigo-300 text-indigo-900', text: 'text-indigo-600' }
                        ]}
                        {@const colorScheme = tierColors[index % tierColors.length]}
                        {@const displayMinKarma = index === 0 ? Math.max(1, Number(tier.minKarma)) : Number(tier.minKarma)}
                        
                        <!-- Check if this is current user's tier -->
                        {@const isCurrentTier = currentTier && currentTier.index === index}
                        
                        <div class="flex flex-col p-3 rounded-lg border {isCurrentTier ? colorScheme.highlight + ' border-2' : 'bg-white border-gray-200'}">
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-3">
                              <div class="w-3 h-3 rounded-full {colorScheme.bg}"></div>
                              <span class="text-sm font-medium {isCurrentTier ? colorScheme.text : 'text-gray-600'}">{tier.name}</span>
                              {#if isCurrentTier}
                                {@const badgeColors = colorScheme.highlight.includes('gray') ? 'bg-gray-200 text-gray-800' :
                                  colorScheme.highlight.includes('blue') ? 'bg-blue-200 text-blue-800' :
                                  colorScheme.highlight.includes('purple') ? 'bg-purple-200 text-purple-800' :
                                  colorScheme.highlight.includes('yellow') ? 'bg-yellow-200 text-yellow-800' :
                                  colorScheme.highlight.includes('orange') ? 'bg-orange-200 text-orange-800' :
                                  colorScheme.highlight.includes('red') ? 'bg-red-200 text-red-800' :
                                  colorScheme.highlight.includes('indigo') ? 'bg-indigo-200 text-indigo-800' :
                                  'bg-gray-200 text-gray-800'}
                                <span class="text-xs {badgeColors} px-2 py-1 rounded-full">Current</span>
                              {/if}
                            </div>
                            <span class="text-xs {isCurrentTier ? colorScheme.text + ' font-medium' : 'text-gray-500'}">
                              {#if tier.maxKarma === 0n && tier.minKarma > 0n}
                                {displayMinKarma.toLocaleString()}+ KARMA
                              {:else if tier.maxKarma >= 18446744073709551615n}
                                {displayMinKarma.toLocaleString()}+ KARMA  
                              {:else if tier.minKarma === 0n && tier.maxKarma === 0n}
                                All levels
                              {:else}
                                {displayMinKarma.toLocaleString()} - {Number(tier.maxKarma).toLocaleString()} KARMA
                              {/if}
                            </span>
                          </div>
                          <div class="text-xs {isCurrentTier ? colorScheme.text : 'text-gray-400'}">
                            {tier.txPerEpoch.toLocaleString()} transactions per epoch
                          </div>
                        </div>
                      {/each}
                    </div>
                  {:else}
                    <div class="flex justify-center py-8">
                      <p class="text-gray-500 text-sm">No tiers found</p>
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          </div>

          <!-- NFT Section Header -->
          <div class="bg-white shadow-sm rounded-lg p-6 mb-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Your KarmaNFT</h2>
          
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- NFT Image (Left Side) -->
            <div class="bg-gray-50 p-4 rounded-lg flex items-center justify-center">
              {#if decodedSvg}
                <!-- Render decoded SVG -->
                <div class="w-full h-full flex items-center justify-center">
                  {@html decodedSvg}
                </div>
              {:else if imageDataUrl}
                <!-- Render image from URL -->
                <div class="w-full h-full flex items-center justify-center">
                  <img 
                    src={imageDataUrl} 
                    alt="KarmaNFT" 
                    class="max-w-full max-h-64 object-contain"
                  />
                </div>
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
                  on:click={() => {
                    fetchNftMetadata($walletAddress);
                    fetchTierData();
                  }}
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