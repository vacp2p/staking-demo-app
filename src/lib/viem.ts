import {
	createPublicClient,
	http,
	createWalletClient,
	custom,
	type WalletClient,
	formatEther,
	type Address,
	formatUnits,
	type Chain
} from 'viem';
import { sepolia } from 'viem/chains';
import { writable, derived, get } from 'svelte/store';
import { tokenAbi, vaultAbi, stakingManagerAbi, vaultFactoryAbi } from './contracts';
import { SNT_TOKEN, STAKING_MANAGER, VAULT_FACTORY, KARMA, KARMA_NFT } from './config/contracts';

const rpcUrl = import.meta.env.VITE_RPC_URL;

// Define Status Network Testnet chain
export const statusNetworkTestnet = {
	id: 1660990954,
	name: 'Status Network Testnet',
	nativeCurrency: {
		decimals: 18,
		name: 'Ether',
		symbol: 'ETH',
	},
	rpcUrls: {
		default: {
			http: ['https://public.sepolia.rpc.status.network'],
		},
		public: {
			http: ['https://public.sepolia.rpc.status.network'],
		},
	},
	blockExplorers: {
		default: {
			name: 'Status Explorer',
			url: 'https://sepoliascan.status.network',
		},
	},
} as const satisfies Chain;

// Create a store to track the current chain
export const currentChain = writable<Chain>(statusNetworkTestnet);

// Network information derived from current chain
export const network = derived(currentChain, $chain => ({
	name: $chain.name,
	chainId: $chain.id,
	currency: $chain.nativeCurrency.symbol
}));

// Create a client for reading from the blockchain - not derived to avoid type issues
export const publicClient = createPublicClient({
	chain: statusNetworkTestnet,
	transport: http(statusNetworkTestnet.rpcUrls.default.http[0])
});

// Wallet connection state stores
export const walletAddress = writable<Address | undefined>(undefined);
export const walletClient = writable<WalletClient | undefined>(undefined);
export const walletBalance = writable<bigint | undefined>(undefined);
export const sntBalance = writable<bigint | undefined>(undefined);
export const sntError = writable<string | undefined>(undefined);

// Derived store for formatted balances
export const formattedBalance = derived(walletBalance, ($balance) => {
	if ($balance === undefined) return undefined;
	const num = Number(formatEther($balance));
	return formatNumberWithSpaces(num);
});

export const formattedSntBalance = derived(sntBalance, ($balance) => {
	if ($balance === undefined) return undefined;
	const num = Number(formatUnits($balance, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

// Add Account type
type Account = {
	stakedBalance: bigint;
	lastRewardIndex: bigint;
	mpAccrued: bigint;
	maxMP: bigint;
	lastMPUpdateTime: bigint;
	lockUntil: bigint;
	rewardsAccrued: bigint;
};

// Stores for staking data
export const userVaults = writable<Address[]>([]);
export const vaultAccounts = writable<Record<Address, Account>>({});
export const rewardsBalance = writable<Record<Address, bigint>>({});
export const totalRewardsBalance = writable<bigint>(0n);
export const karmaErc20Balance = writable<bigint>(0n);
export const totalMpAccountBalance = writable<bigint>(0n);
export const vaultMpBalances = writable<Record<Address, bigint>>({});
export const uncompoundedMpTotal = writable<bigint>(0n);

export const totalMpBalance = derived(vaultAccounts, ($accounts) => {
	return Object.values($accounts).reduce((sum, account) => sum + account.mpAccrued, 0n);
});

// Add stores for staked and unstaked MP balances
export const stakedMpBalance = derived(vaultAccounts, ($accounts) => {
	return Object.values($accounts).reduce((sum, account) => sum + account.mpAccrued, 0n);
});

export const unstakedMpBalance = derived(
	[totalMpAccountBalance, stakedMpBalance], 
	([$total, $staked]) => {
		return $total > $staked ? $total - $staked : 0n;
	}
);

export const formattedTotalMpBalance = derived(totalMpAccountBalance, ($total) => {
	if ($total === undefined) return '0.00';
	const num = Number(formatUnits($total, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

export const formattedTotalMpAccountBalance = derived(totalMpAccountBalance, ($total) => {
	if ($total === undefined) return '0.00';
	const num = Number(formatUnits($total, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

export const formattedStakedMpBalance = derived(stakedMpBalance, ($balance) => {
	const num = Number(formatUnits($balance, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

export const formattedUnstakedMpBalance = derived(unstakedMpBalance, ($balance) => {
	const num = Number(formatUnits($balance, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

export const formattedUncompoundedMpTotal = derived(uncompoundedMpTotal, ($total) => {
	if ($total === undefined) return '0.00';
	const num = Number(formatUnits($total, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

export const formattedTotalRewardsBalance = derived(totalRewardsBalance, ($total) => {
	if ($total === undefined) return '0.00';
	const num = Number(formatUnits($total, 18));
	return formatNumberWithSpaces(num);
});

// ERC20 balance (now using actualTokenBalanceOf which already excludes SM balance)
export const formattedKarmaErc20Balance = derived(karmaErc20Balance, ($balance) => {
	if ($balance === undefined) return '0.00';
	const num = Number(formatUnits($balance, 18));
	return formatNumberWithSpaces(num);
});

// Combined karma balance (StakeManager + ERC20)
export const totalKarmaBalance = derived(
	[totalRewardsBalance, karmaErc20Balance],
	([$smBalance, $erc20Balance]) => {
		return $smBalance + $erc20Balance;
	}
);

export const formattedTotalKarmaBalance = derived(totalKarmaBalance, ($total) => {
	if ($total === undefined) return '0.00';
	const num = Number(formatUnits($total, 18));
	return formatNumberWithSpaces(num);
});

// Add new store for total staked
export const globalTotalStaked = writable<bigint>(0n);
export const formattedGlobalTotalStaked = derived(globalTotalStaked, ($total) => {
	if ($total === undefined) return '0';
	const num = Number(formatUnits($total, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
});

// Add new store for token price
export const tokenPriceUsd = writable<number>(0);

// Function to fetch ETH balance
async function fetchBalance(address: Address) {
	try {
		console.log('Fetching ETH balance for address:', address);
		const balance = await publicClient.getBalance({ address });
		console.log('Received ETH balance:', balance.toString());
		walletBalance.set(balance);
	} catch (error) {
		console.error('Failed to fetch ETH balance:', error);
		walletBalance.set(undefined);
	}
}

// Function to fetch STT balance
async function fetchSntBalance(address: Address) {
	try {
		console.log('Fetching STT balance for address:', address);
		const balance = await publicClient.readContract({
			address: SNT_TOKEN.address,
			abi: tokenAbi,
			functionName: 'balanceOf',
			args: [address]
		});
		console.log('Received STT balance:', balance.toString());
		sntBalance.set(balance);
		sntError.set(undefined);
	} catch (error) {
		console.error('Failed to fetch STT balance:', error);
		sntBalance.set(undefined);
		if (error instanceof Error) {
			sntError.set(error.message);
		} else {
			sntError.set('Failed to fetch STT balance');
		}
	}
}

// Function to fetch account info for a single vault
async function fetchVaultAccount(vaultAddress: Address) {
	try {
		// Get vault data from StakingManager (no longer includes lockUntil)
		const [vaultData, lockUntil] = await Promise.all([
			publicClient.readContract({
				address: STAKING_MANAGER.address,
				abi: stakingManagerAbi,
				functionName: 'getVault',
				args: [vaultAddress]
			}),
			// Get lockUntil directly from the vault contract
			publicClient.readContract({
				address: vaultAddress,
				abi: vaultAbi,
				functionName: 'lockUntil',
				args: []
			})
		]);
		
		// Combine into expected Account shape
		return {
			...vaultData,
			lockUntil
		} as Account;
	} catch (error) {
		console.error(`Failed to fetch account info for vault ${vaultAddress}:`, error);
		return null;
	}
}

// Function to fetch all vault accounts
async function fetchAllVaultAccounts(vaults: readonly Address[]) {
	try {
		console.log('Fetching account info for all vaults');
		const accounts = await Promise.all(vaults.map(fetchVaultAccount));
		const accountsMap = vaults.reduce(
			(acc, vault, i) => {
				if (accounts[i]) {
					acc[vault] = accounts[i];
				}
				return acc;
			},
			{} as Record<Address, Account>
		);
		vaultAccounts.set(accountsMap);
	} catch (error) {
		console.error('Failed to fetch vault accounts:', error);
		vaultAccounts.set({});
	}
}

// Function to fetch user vaults
export async function fetchUserVaults(address: Address) {
	console.log(`Fetching vaults for address: ${address} on chain: ${get(currentChain).name} (${get(currentChain).id})`);
	
	const chainId = get(currentChain).id;
	const stakingManagerAddress = STAKING_MANAGER.address;
	console.log(`Using StakingManager address: ${stakingManagerAddress}`);
	
	try {
		// Get the user's vaults
		const vaults = await publicClient.readContract({
			address: stakingManagerAddress,
			abi: stakingManagerAbi,
			functionName: 'getAccountVaults',
			args: [address]
		}) as Address[];
		
		console.log(`Received ${vaults.length} vaults:`, vaults);
		
		// Update the store
		userVaults.set(vaults);
		
		// Fetch account data for all vaults
		if (vaults.length > 0) {
			await fetchAllVaultAccounts(vaults);
		} else {
			vaultAccounts.set({});
		}
		
		return vaults;
	} catch (error) {
		console.error(`Error fetching vaults for ${address}:`, error);
		console.error(`Error details:`, {
			chain: get(currentChain),
			stakingManagerAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		userVaults.set([]);
		vaultAccounts.set({});
		return [] as Address[];
	}
}

// Function to fetch total staked
async function fetchTotalStaked() {
	try {
		console.log('Fetching total staked amount');
		const total = await publicClient.readContract({
			address: STAKING_MANAGER.address,
			abi: stakingManagerAbi,
			functionName: 'totalStaked'
		});
		console.log('Received total staked:', total.toString());
		globalTotalStaked.set(total);
	} catch (error) {
		console.error('Failed to fetch total staked:', error);
		globalTotalStaked.set(0n);
	}
}

// Function to fetch token price from Binance
async function fetchTokenPrice() {
	try {
		console.log('Fetching SNT price from Binance');
		const response = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=SNTUSDT');
		const data = await response.json();
		const price = parseFloat(data.price);
		console.log('Received SNT price:', price);
		tokenPriceUsd.set(price);
		return price;
	} catch (error) {
		console.error('Failed to fetch SNT price:', error);
		return null;
	}
}

// Function to refresh balances
export async function refreshBalances(address: Address) {
	console.log(`Refreshing balances for address: ${address} on chain: ${get(currentChain).name} (${get(currentChain).id})`);
	
	try {
		// First fetch the user's vaults
		const vaults = await fetchUserVaults(address);
		
		// Then fetch all other data in parallel
		const results = await Promise.allSettled([
			fetchBalance(address),
			fetchSntBalance(address),
			fetchTotalStaked(),
			fetchTotalRewardsBalance(address),
			fetchKarmaErc20Balance(address),
			fetchAllVaultRewardsBalances(vaults),
			mpBalanceOfAccount(address),
			fetchAllVaultMpBalances(vaults)
		]);
		
		// Log results
		results.forEach((result, index) => {
			const operation = index === 0 ? 'ETH balance' : 
							  index === 1 ? 'STT balance' : 
							  index === 2 ? 'Total staked' : 
							  index === 3 ? 'Total rewards' :
							  index === 4 ? 'ERC20 karma balance' :
							  index === 5 ? 'Vault rewards' :
							  index === 6 ? 'Total MP balance' :
							  'Vault MP balances';
							  
			if (result.status === 'fulfilled') {
				console.log(`✅ Successfully refreshed ${operation}`);
			} else {
				console.error(`❌ Failed to refresh ${operation}:`, result.reason);
			}
		});
		
		console.log('Balances refresh completed');
		return true;
	} catch (error) {
		console.error('Error refreshing balances:', error);
		return false;
	}
}

// Function to connect wallet
export async function connectWallet() {
	if (!window.ethereum) {
		throw new Error('MetaMask not installed');
	}

	try {
		// First, try to add or switch to the Status Network Testnet
		try {
			await window.ethereum.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: `0x${statusNetworkTestnet.id.toString(16)}` }]
			});
		} catch (switchError: any) {
			// This error code indicates that the chain has not been added to MetaMask
			if (switchError.code === 4902) {
				await window.ethereum.request({
					method: 'wallet_addEthereumChain',
					params: [
						{
							chainId: `0x${statusNetworkTestnet.id.toString(16)}`,
							chainName: statusNetworkTestnet.name,
							nativeCurrency: statusNetworkTestnet.nativeCurrency,
							rpcUrls: [statusNetworkTestnet.rpcUrls.default.http[0]],
							blockExplorerUrls: [statusNetworkTestnet.blockExplorers?.default.url]
						}
					]
				});
			} else {
				console.warn('Failed to switch to Status Network Testnet:', switchError);
				// Continue anyway, as we'll use the Status Network contracts regardless
			}
		}

		const accounts = (await window.ethereum.request({
			method: 'eth_requestAccounts'
		})) as string[];

		const address = accounts[0] as Address;
		console.log('Connected to address:', address);
		console.log('Using Status Network Testnet');

		const client = createWalletClient({
			chain: statusNetworkTestnet,
			transport: custom(window.ethereum)
		});

		walletAddress.set(address);
		walletClient.set(client);

		// Fetch initial balances and vaults
		await refreshBalances(address);

		// Listen for account changes
		window.ethereum.on('accountsChanged', async (newAccounts: string[]) => {
			if (newAccounts.length === 0) {
				disconnectWallet();
			} else {
				const newAddress = newAccounts[0] as Address;
				walletAddress.set(newAddress);
				await refreshBalances(newAddress);
			}
		});

		return { address, client };
	} catch (error) {
		console.error('Error connecting wallet:', error);
		throw error;
	}
}

// Function to disconnect wallet
export function disconnectWallet() {
	if (window.ethereum) {
		window.ethereum.removeListener('accountsChanged', () => {});
	}
	walletAddress.set(undefined);
	walletClient.set(undefined);
	walletBalance.set(undefined);
	sntBalance.set(undefined);
	sntError.set(undefined);
	userVaults.set([]);
}

// Function to deploy a new vault
export async function deployVault() {
	const address = get(walletAddress);
	const client = get(walletClient);
	const chain = get(currentChain);

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log(`Deploying new vault on chain: ${chain.name} (${chain.id})`);
	console.log(`Using VaultFactory address: ${VAULT_FACTORY.address}`);

	try {
		const hash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: VAULT_FACTORY.address,
			abi: vaultFactoryAbi,
			functionName: 'createVault'
		});

		console.log('Vault deployment transaction hash:', hash);

		const receipt = await publicClient.waitForTransactionReceipt({ 
			hash,
			timeout: 60_000, // 60 second timeout
			confirmations: 1
		});
		
		console.log('Vault deployment receipt:', receipt);

		// Refresh both vaults and balances after deployment since gas was spent
		await refreshBalances(address);

		return { hash, receipt };
	} catch (error) {
		console.error('Error deploying vault:', error);
		console.error('Error details:', {
			chain: get(currentChain),
			vaultFactoryAddress: VAULT_FACTORY.address,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		throw error;
	}
}

// Function to stake tokens
export async function stakeTokens(
	vaultAddress: Address,
	amount: bigint,
	callbacks?: {
		onApprovalSubmitted?: (hash: string) => void;
		onApprovalConfirmed?: () => void;
		onStakingSubmitted?: (hash: string) => void;
		onStakingConfirmed?: () => void;
		onAllowanceAlreadySet?: () => void;
	}
) {
	const address = get(walletAddress);
	const client = get(walletClient);
	const chain = get(currentChain);

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log(`Staking tokens on chain: ${chain.name} (${chain.id})`);
	console.log(`Vault: ${vaultAddress}, Amount: ${amount.toString()}`);
	console.log(`Using SNT Token address: ${SNT_TOKEN.address}`);

	try {
		// First check current allowance
		const currentAllowance = await publicClient.readContract({
			address: SNT_TOKEN.address,
			abi: tokenAbi,
			functionName: 'allowance',
			args: [address, vaultAddress]
		});

		console.log('Current allowance:', currentAllowance.toString());
		let approvalHash: `0x${string}` | undefined;
		let allowanceWasSet = false;

		// Only approve if the current allowance is less than the amount we want to stake
		if (currentAllowance < amount) {
			console.log('Approving tokens...');

			// If there's an existing non-zero allowance, we need to reset it first
			if (currentAllowance > 0n) {
				console.log('Resetting existing allowance to 0...');
				approvalHash = await client.writeContract({
					chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
					account: address,
					address: SNT_TOKEN.address,
					abi: tokenAbi,
					functionName: 'approve',
					args: [vaultAddress, 0n]
				});

				console.log('Reset allowance transaction hash:', approvalHash);
				callbacks?.onApprovalSubmitted?.(approvalHash);

				const resetReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
				if (resetReceipt.status !== 'success') {
					throw new Error('Reset allowance transaction failed');
				}
			}

			// Now set the new allowance
			approvalHash = await client.writeContract({
				chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
				account: address,
				address: SNT_TOKEN.address,
				abi: tokenAbi,
				functionName: 'approve',
				args: [vaultAddress, amount]
			});

			console.log('Token approval transaction hash:', approvalHash);
			callbacks?.onApprovalSubmitted?.(approvalHash);

			const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
			if (approvalReceipt.status !== 'success') {
				throw new Error('Approval transaction failed');
			}
			callbacks?.onApprovalConfirmed?.();
		} else {
			console.log('Sufficient allowance already exists');
			allowanceWasSet = true;
			callbacks?.onAllowanceAlreadySet?.();
		}

		// Then stake the tokens
		const stakingHash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: vaultAddress,
			abi: vaultAbi,
			functionName: 'stake',
			args: [amount, 0n] // 0 seconds lock period
		});

		console.log('Staking transaction hash:', stakingHash);
		callbacks?.onStakingSubmitted?.(stakingHash);

		const receipt = await publicClient.waitForTransactionReceipt({ hash: stakingHash });
		console.log('Staking receipt:', receipt);

		if (receipt.status !== 'success') {
			throw new Error('Staking transaction failed');
		}

		callbacks?.onStakingConfirmed?.();

		// Refresh balances and vault data
		await refreshBalances(address);

		return { approvalHash, stakingHash, allowanceWasSet };
	} catch (error) {
		console.error('Error staking tokens:', error);
		console.error('Error details:', {
			chain: get(currentChain),
			vaultAddress,
			sntTokenAddress: SNT_TOKEN.address,
			amount: amount.toString(),
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		throw error;
	}
}

function formatAmount(amount: bigint): string {
	const num = Number(formatUnits(amount, SNT_TOKEN.decimals));
	return formatNumberWithSpaces(num);
}

// Helper function to format numbers with spaces as thousand separators
function formatNumberWithSpaces(num: number): string {
	// Format with 2 decimal places
	const parts = num.toFixed(2).split('.');
	// Add spaces for thousands in the integer part
	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	// Join with decimal part
	return parts.join('.');
}

// Helper function to format karma rewards with appropriate units
export function formatKarmaAmount(amount: bigint): string {
	// Convert to string to avoid precision loss for very small numbers
	const amountStr = amount.toString();
	
	// If amount is 0, return 0.00
	if (amount === 0n) {
		return '0.00';
	}
	
	// Define thresholds in wei
	const oneKarma = BigInt('1000000000000000000'); // 1e18 wei = 1 KARMA
	const oneGwei = BigInt('1000000000'); // 1e9 wei = 1 gwei
	
	// If amount is >= 0.01 KARMA (1e16 wei), show in KARMA with decimals
	if (amount >= oneKarma / 100n) {
		const num = Number(formatUnits(amount, 18));
		return formatNumberWithSpaces(num);
	}
	// If amount is >= 1 gwei, show in gwei
	else if (amount >= oneGwei) {
		const gweiAmount = Number(formatUnits(amount, 9));
		return `${Math.floor(gweiAmount)} gwei`;
	}
	// Otherwise show in wei
	else {
		return `${amountStr} wei`;
	}
}

// Initial fetch of total staked
fetchTotalStaked();

// Export the fetch functions to be used by components
export { fetchTotalStaked, fetchTokenPrice };

// Function to lock a vault
export async function lockVault(vaultAddress: Address, lockDurationSeconds: number) {
	const address = get(walletAddress);
	const client = get(walletClient);
	const chain = get(currentChain);

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log(`Locking vault on chain: ${chain.name} (${chain.id})`);
	console.log(`Vault: ${vaultAddress}, Lock duration: ${lockDurationSeconds} seconds`);

	try {
		const lockHash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: vaultAddress,
			abi: vaultAbi,
			functionName: 'lock',
			args: [BigInt(lockDurationSeconds)]
		});

		console.log('Lock transaction hash:', lockHash);

		const receipt = await publicClient.waitForTransactionReceipt({ hash: lockHash });
		console.log('Lock receipt:', receipt);

		if (receipt.status !== 'success') {
			throw new Error('Lock transaction failed');
		}

		// Refresh vault data
		await refreshBalances(address);

		return lockHash;
	} catch (error) {
		console.error('Error locking vault:', error);
		console.error('Error details:', {
			chain: get(currentChain),
			vaultAddress,
			lockDurationSeconds,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		throw error;
	}
}

// Function to fetch rewards balance for a single vault
async function fetchVaultRewardsBalance(vaultAddress: Address) {
	const chainId = get(currentChain).id;
	const stakingManagerAddress = STAKING_MANAGER.address;
	
	try {
		console.log(`Fetching rewards balance for vault: ${vaultAddress}`);
		console.log(`Using StakingManager address: ${stakingManagerAddress}`);
		
		const balance = await publicClient.readContract({
			address: stakingManagerAddress,
			abi: stakingManagerAbi,
			functionName: 'rewardsBalanceOf',
			args: [vaultAddress]
		}) as bigint;
		
		console.log(`Received rewards balance for vault ${vaultAddress}: ${balance.toString()}`);
		return balance;
	} catch (error) {
		console.error(`Failed to fetch rewards balance for vault ${vaultAddress}:`, error);
		console.error('Error details:', {
			chain: get(currentChain),
			stakingManagerAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		return 0n;
	}
}

// Function to fetch MP balance for a specific vault
export async function mpBalanceOf(vaultAddress: Address) {
	const stakingManagerAddress = STAKING_MANAGER.address;
	
	try {
		console.log(`Fetching MP balance for vault: ${vaultAddress}`);
		console.log(`Using StakingManager address: ${stakingManagerAddress}`);
		
		const balance = await publicClient.readContract({
			address: stakingManagerAddress,
			abi: stakingManagerAbi,
			functionName: 'mpBalanceOf',
			args: [vaultAddress]
		}) as bigint;
		
		console.log(`Received MP balance for vault ${vaultAddress}: ${balance.toString()}`);
		
		// Update the vault MP balance store
		vaultMpBalances.update(balances => {
			balances[vaultAddress] = balance;
			return balances;
		});
		
		return balance;
	} catch (error) {
		console.error(`Failed to fetch MP balance for vault ${vaultAddress}:`, error);
		console.error('Error details:', {
			chain: get(currentChain),
			stakingManagerAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		return 0n;
	}
}

// Function to fetch MP balances for all vaults
export async function fetchAllVaultMpBalances(vaults: readonly Address[]) {
	console.log(`Fetching MP balances for ${vaults.length} vaults`);
	
	try {
		const balances = await Promise.all(vaults.map(mpBalanceOf));
		
		const balancesMap = vaults.reduce(
			(acc, vault, i) => {
				acc[vault] = balances[i];
				return acc;
			},
			{} as Record<Address, bigint>
		);
		
		console.log(`Successfully fetched MP balances for ${Object.keys(balancesMap).length} vaults`);
		vaultMpBalances.set(balancesMap);
		
		// Calculate total uncompounded MPs
		const accounts = get(vaultAccounts);
		let totalUncompounded = 0n;
		
		for (const vault of vaults) {
			const mpBalance = balancesMap[vault] || 0n;
			const mpStaked = accounts[vault]?.mpAccrued || 0n;
			if (mpBalance > mpStaked) {
				totalUncompounded += (mpBalance - mpStaked);
			}
		}
		
		uncompoundedMpTotal.set(totalUncompounded);
		
		return balancesMap;
	} catch (error) {
		console.error('Failed to fetch all vault MP balances:', error);
		console.error('Error details:', {
			chain: get(currentChain),
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		return {};
	}
}

// Function to fetch total MP balance for a user across all vaults
export async function mpBalanceOfAccount(address: Address) {
	const stakingManagerAddress = STAKING_MANAGER.address;
	
	try {
		console.log(`Fetching total MP balance for user: ${address}`);
		console.log(`Using StakingManager address: ${stakingManagerAddress}`);
		
		const balance = await publicClient.readContract({
			address: stakingManagerAddress,
			abi: stakingManagerAbi,
			functionName: 'mpBalanceOfAccount',
			args: [address]
		}) as bigint;
		
		console.log(`Received total MP balance for user ${address}: ${balance.toString()}`);
		totalMpAccountBalance.set(balance);
		return balance;
	} catch (error) {
		console.error(`Failed to fetch total MP balance for user ${address}:`, error);
		console.error('Error details:', {
			chain: get(currentChain),
			stakingManagerAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		totalMpAccountBalance.set(0n);
		return 0n;
	}
}

// Function to fetch total rewards balance for a user across all vaults
export async function fetchTotalRewardsBalance(address: Address) {
	const chainId = get(currentChain).id;
	const stakingManagerAddress = STAKING_MANAGER.address;
	
	try {
		console.log(`Fetching total rewards balance for user: ${address}`);
		console.log(`Using StakingManager address: ${stakingManagerAddress}`);
		
		const balance = await publicClient.readContract({
			address: stakingManagerAddress,
			abi: stakingManagerAbi,
			functionName: 'rewardsBalanceOfAccount',
			args: [address]
		}) as bigint;
		
		console.log(`Received total rewards balance for user ${address}: ${balance.toString()}`);
		totalRewardsBalance.set(balance);
		return balance;
	} catch (error) {
		console.error(`Failed to fetch total rewards balance for user ${address}:`, error);
		console.error('Error details:', {
			chain: get(currentChain),
			stakingManagerAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		totalRewardsBalance.set(0n);
		return 0n;
	}
}

// Function to fetch ERC20 karma balance for a user
export async function fetchKarmaErc20Balance(address: Address) {
	const karmaAddress = KARMA.address;
	
	try {
		console.log(`Fetching ERC20 karma balance for user: ${address}`);
		console.log(`Using Karma contract address: ${karmaAddress}`);
		
		const balance = await publicClient.readContract({
			address: karmaAddress,
			abi: KARMA.abi,
			functionName: 'actualTokenBalanceOf',
			args: [address]
		}) as bigint;
		
		console.log(`Received actual ERC20 karma balance for user ${address}: ${balance.toString()}`);
		karmaErc20Balance.set(balance);
		return balance;
	} catch (error) {
		console.error(`Failed to fetch ERC20 karma balance for user ${address}:`, error);
		console.error('Error details:', {
			chain: get(currentChain),
			karmaAddress,
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		karmaErc20Balance.set(0n);
		return 0n;
	}
}

// Function to fetch rewards balance for all vaults
export async function fetchAllVaultRewardsBalances(vaults: readonly Address[]) {
	console.log(`Fetching rewards balance for ${vaults.length} vaults`);
	
	try {
		const balances = await Promise.all(vaults.map(fetchVaultRewardsBalance));
		
		const balancesMap = vaults.reduce(
			(acc, vault, i) => {
				acc[vault] = balances[i];
				return acc;
			},
			{} as Record<Address, bigint>
		);
		
		console.log(`Successfully fetched rewards balance for ${Object.keys(balancesMap).length} vaults`);
		rewardsBalance.set(balancesMap);
		return balancesMap;
	} catch (error) {
		console.error('Failed to fetch all vault rewards balances:', error);
		console.error('Error details:', {
			chain: get(currentChain),
			publicClient: publicClient ? 'Initialized' : 'Not initialized'
		});
		return {};
	}
}

// Function to compound MPs
export async function compoundMPs(vaultAddress: Address) {
	try {
		const client = get(walletClient);
		const address = get(walletAddress);
		const chain = get(currentChain);
		
		if (!client || !address) {
			throw new Error('Wallet not connected');
		}
		
		console.log(`Updating vault for vault: ${vaultAddress} on chain: ${chain.name} (${chain.id})`);
		
		// Call updateVault on the staking manager with the vault address as an argument
		const hash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: STAKING_MANAGER.address,
			abi: stakingManagerAbi,
			functionName: 'updateVault',
			args: [vaultAddress]
		});
		
		console.log('Update vault transaction hash:', hash);
		
		// Wait for transaction to be mined
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		console.log('Update vault receipt:', receipt);
		
		return { hash, receipt };
	} catch (error) {
		console.error(`Failed to update vault ${vaultAddress}:`, error);
		throw error;
	}
}

// Function to fetch vault data
export async function fetchVaultData(vaultAddress: Address): Promise<Account | null> {
	try {
		const data = await publicClient.readContract({
			address: STAKING_MANAGER.address,
			abi: stakingManagerAbi,
			functionName: 'getVault',
			args: [vaultAddress]
		}) as Account;

		return data;
	} catch (error) {
		console.error(`Failed to fetch vault data for ${vaultAddress}:`, error);
		return null;
	}
}

// Function to compound all vaults for an account
export async function compoundAllVaults() {
	try {
		const client = get(walletClient);
		const address = get(walletAddress);
		const chain = get(currentChain);
		
		if (!client || !address) {
			throw new Error('Wallet not connected');
		}
		
		console.log(`Updating all vaults for account: ${address} on chain: ${chain.name} (${chain.id})`);
		
		// Call updateAccount on the staking manager with the account address as an argument
		const hash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: STAKING_MANAGER.address,
			abi: stakingManagerAbi,
			functionName: 'updateAccount',
			args: [address]
		});
		
		console.log('Update account transaction hash:', hash);
		
		// Wait for transaction to be mined
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		console.log('Update account receipt:', receipt);
		
		return { hash, receipt };
	} catch (error) {
		console.error(`Failed to update account ${address}:`, error);
		throw error;
	}
}

// Function to redeem rewards for an account
export async function redeemRewards() {
	try {
		const client = get(walletClient);
		const address = get(walletAddress);
		const chain = get(currentChain);
		
		if (!client || !address) {
			throw new Error('Wallet not connected');
		}
		
		console.log(`Redeeming rewards for account: ${address} on chain: ${chain.name} (${chain.id})`);
		
		// Call redeemRewards on the staking manager with the account address as an argument
		const hash = await client.writeContract({
			chain: statusNetworkTestnet, // Use Status Network Testnet explicitly
			account: address,
			address: STAKING_MANAGER.address,
			abi: stakingManagerAbi,
			functionName: 'redeemRewards',
			args: [address]
		});
		
		console.log('Redeem rewards transaction hash:', hash);
		
		// Wait for transaction to be mined
		const receipt = await publicClient.waitForTransactionReceipt({ hash });
		console.log('Redeem rewards receipt:', receipt);
		
		return { hash, receipt };
	} catch (error) {
		console.error(`Failed to redeem rewards for account ${address}:`, error);
		throw error;
	}
}
