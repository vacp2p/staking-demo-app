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
export const currentChain = writable<Chain>(sepolia);

// Network information derived from current chain
export const network = derived(currentChain, $chain => ({
	name: $chain.name,
	chainId: $chain.id,
	currency: $chain.nativeCurrency.symbol
}));

// Create a client for reading from the blockchain - not derived to avoid type issues
export const publicClient = createPublicClient({
	chain: sepolia,
	transport: http(rpcUrl)
});

// Function to switch chains
export function switchChain(chain: Chain) {
	currentChain.set(chain);
	// Update the public client when chain changes
	// This is a simplified approach - in a real app, you'd want to handle this more robustly
}

// Complete contract ABI
const CONTRACT_ABI = [
	{
		inputs: [
			{ internalType: 'string', name: '_tokenName', type: 'string' },
			{ internalType: 'uint8', name: '_decimalUnits', type: 'uint8' },
			{ internalType: 'string', name: '_tokenSymbol', type: 'string' },
			{ internalType: 'bool', name: '_transferable', type: 'bool' }
		],
		stateMutability: 'nonpayable',
		type: 'constructor'
	},
	{ inputs: [], name: 'AllowanceAlreadySet', type: 'error' },
	{ inputs: [], name: 'ControllerNotSet', type: 'error' },
	{ inputs: [], name: 'ControllerRejected', type: 'error' },
	{
		inputs: [{ internalType: 'uint256', name: 'deadline', type: 'uint256' }],
		name: 'ERC2612ExpiredSignature',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'signer', type: 'address' },
			{ internalType: 'address', name: 'owner', type: 'address' }
		],
		name: 'ERC2612InvalidSigner',
		type: 'error'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'account', type: 'address' },
			{ internalType: 'uint256', name: 'currentNonce', type: 'uint256' }
		],
		name: 'InvalidAccountNonce',
		type: 'error'
	},
	{ inputs: [], name: 'InvalidDestination', type: 'error' },
	{ inputs: [], name: 'InvalidShortString', type: 'error' },
	{ inputs: [], name: 'NotAuthorized', type: 'error' },
	{ inputs: [], name: 'NotEnoughAllowance', type: 'error' },
	{ inputs: [], name: 'NotEnoughBalance', type: 'error' },
	{ inputs: [], name: 'Overflow', type: 'error' },
	{ inputs: [], name: 'ParentSnapshotNotReached', type: 'error' },
	{
		inputs: [{ internalType: 'string', name: 'str', type: 'string' }],
		name: 'StringTooLong',
		type: 'error'
	},
	{ inputs: [], name: 'TransfersDisabled', type: 'error' },
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'owner', type: 'address' },
			{ indexed: true, internalType: 'address', name: 'spender', type: 'address' },
			{ indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
		],
		name: 'Approval',
		type: 'event'
	},
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: '_token', type: 'address' },
			{ indexed: true, internalType: 'address', name: '_controller', type: 'address' },
			{ indexed: false, internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'ClaimedTokens',
		type: 'event'
	},
	{ anonymous: false, inputs: [], name: 'EIP712DomainChanged', type: 'event' },
	{
		anonymous: false,
		inputs: [
			{ indexed: true, internalType: 'address', name: 'from', type: 'address' },
			{ indexed: true, internalType: 'address', name: 'to', type: 'address' },
			{ indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' }
		],
		name: 'Transfer',
		type: 'event'
	},
	{
		inputs: [],
		name: 'DOMAIN_SEPARATOR',
		outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'TOKEN_VERSION',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_owner', type: 'address' },
			{ internalType: 'address', name: '_spender', type: 'address' }
		],
		name: 'allowance',
		outputs: [{ internalType: 'uint256', name: 'remaining', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_spender', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'approve',
		outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_spender', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' },
			{ internalType: 'bytes', name: '_extraData', type: 'bytes' }
		],
		name: 'approveAndCall',
		outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address', name: '_owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ internalType: 'uint256', name: 'balance', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_owner', type: 'address' },
			{ internalType: 'uint256', name: '_blockNumber', type: 'uint256' }
		],
		name: 'balanceOfAt',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address payable', name: '_newController', type: 'address' }],
		name: 'changeController',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'contract IERC20', name: '_token', type: 'address' }],
		name: 'claimTokens',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'controller',
		outputs: [{ internalType: 'address payable', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'creationBlock',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'decimals',
		outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_owner', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'destroyTokens',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'eip712Domain',
		outputs: [
			{ internalType: 'bytes1', name: 'fields', type: 'bytes1' },
			{ internalType: 'string', name: 'name', type: 'string' },
			{ internalType: 'string', name: 'version', type: 'string' },
			{ internalType: 'uint256', name: 'chainId', type: 'uint256' },
			{ internalType: 'address', name: 'verifyingContract', type: 'address' },
			{ internalType: 'bytes32', name: 'salt', type: 'bytes32' },
			{ internalType: 'uint256[]', name: 'extensions', type: 'uint256[]' }
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'bool', name: '_transfersEnabled', type: 'bool' }],
		name: 'enableTransfers',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_owner', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'generateTokens',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'name',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
		name: 'nonces',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'parentSnapShotBlock',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'parentToken',
		outputs: [{ internalType: 'contract MiniMeBase', name: '', type: 'address' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: 'owner', type: 'address' },
			{ internalType: 'address', name: 'spender', type: 'address' },
			{ internalType: 'uint256', name: 'value', type: 'uint256' },
			{ internalType: 'uint256', name: 'deadline', type: 'uint256' },
			{ internalType: 'uint8', name: 'v', type: 'uint8' },
			{ internalType: 'bytes32', name: 'r', type: 'bytes32' },
			{ internalType: 'bytes32', name: 's', type: 'bytes32' }
		],
		name: 'permit',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'symbol',
		outputs: [{ internalType: 'string', name: '', type: 'string' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'totalSupply',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_blockNumber', type: 'uint256' }],
		name: 'totalSupplyAt',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_to', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'transfer',
		outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'address', name: '_from', type: 'address' },
			{ internalType: 'address', name: '_to', type: 'address' },
			{ internalType: 'uint256', name: '_amount', type: 'uint256' }
		],
		name: 'transferFrom',
		outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'transfersEnabled',
		outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
		stateMutability: 'view',
		type: 'function'
	},
	{ stateMutability: 'payable', type: 'receive' }
] as const;

// Token information
export const SNT_TOKEN = {
	address: '0xE452027cdEF746c7Cd3DB31CB700428b16cD8E51' as Address,
	name: 'Status Test Token',
	symbol: 'STT',
	decimals: 18
} as const;

// Wallet connection state stores
export const walletAddress = writable<Address | undefined>(undefined);
export const walletClient = writable<WalletClient | undefined>(undefined);
export const walletBalance = writable<bigint | undefined>(undefined);
export const sntBalance = writable<bigint | undefined>(undefined);
export const sntError = writable<string | undefined>(undefined);

// Derived store for formatted balances
export const formattedBalance = derived(walletBalance, ($balance) => {
	if ($balance === undefined) return undefined;
	return Number(formatEther($balance)).toFixed(4);
});

export const formattedSntBalance = derived(sntBalance, ($balance) => {
	if ($balance === undefined) return undefined;
	return Number(formatUnits($balance, SNT_TOKEN.decimals)).toFixed(2);
});

// Contract addresses
export const STAKING_MANAGER = {
	address: '0xd302bd9f60c5192e46258028a2f3b4b2b846f61f' as Address
} as const;

export const VAULT_FACTORY = {
	address: '0xef5EDC2C16413EFAfB1d8e5F2e4a25b16eb7480d' as Address
} as const;

// Add Account type
type Account = {
	stakedBalance: bigint;
	accountRewardIndex: bigint;
	mpAccrued: bigint;
	maxMP: bigint;
	lastMPUpdateTime: bigint;
	lockUntil: bigint;
};

// Update STAKING_MANAGER_ABI
const STAKING_MANAGER_ABI = [
	{
		inputs: [{ internalType: 'address', name: 'user', type: 'address' }],
		name: 'getUserVaults',
		outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'totalStaked',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address', name: 'vault', type: 'address' }],
		name: 'mpBalanceOf',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'address', name: 'accountAddress', type: 'address' }],
		name: 'getAccount',
		outputs: [
			{
				components: [
					{ internalType: 'uint256', name: 'stakedBalance', type: 'uint256' },
					{ internalType: 'uint256', name: 'accountRewardIndex', type: 'uint256' },
					{ internalType: 'uint256', name: 'mpAccrued', type: 'uint256' },
					{ internalType: 'uint256', name: 'maxMP', type: 'uint256' },
					{ internalType: 'uint256', name: 'lastMPUpdateTime', type: 'uint256' },
					{ internalType: 'uint256', name: 'lockUntil', type: 'uint256' }
				],
				internalType: 'struct StakingManager.Account',
				name: '',
				type: 'tuple'
			}
		],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

// Contract ABIs
const VAULT_FACTORY_ABI = [
	{
		inputs: [],
		name: 'createVault',
		outputs: [{ internalType: 'contract StakeVault', name: '', type: 'address' }],
		stateMutability: 'nonpayable',
		type: 'function'
	}
] as const;

// Vault ABI
const VAULT_ABI = [
	{
		inputs: [],
		name: 'register',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'amountStaked',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{ internalType: 'uint256', name: '_amount', type: 'uint256' },
			{ internalType: 'uint256', name: '_seconds', type: 'uint256' }
		],
		name: 'stake',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_seconds', type: 'uint256' }],
		name: 'lock',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [{ internalType: 'uint256', name: '_amount', type: 'uint256' }],
		name: 'unstake',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	}
] as const;

// Stores for staking data
export const userVaults = writable<Address[]>([]);
export const vaultAccounts = writable<Record<Address, Account>>({});

export const totalMpBalance = derived(vaultAccounts, ($accounts) => {
	return Object.values($accounts).reduce((sum, account) => sum + account.mpAccrued, 0n);
});

export const formattedTotalMpBalance = derived(totalMpBalance, ($total) => {
	if ($total === undefined) return '0.00';
	return Number(formatUnits($total, SNT_TOKEN.decimals)).toFixed(2);
});

// Add new store for total staked
export const globalTotalStaked = writable<bigint>(0n);
export const formattedGlobalTotalStaked = derived(globalTotalStaked, ($total) => {
	if ($total === undefined) return '0';
	return Number(formatUnits($total, SNT_TOKEN.decimals))
		.toFixed(2)
		.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
			abi: CONTRACT_ABI,
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
		const account = await publicClient.readContract({
			address: STAKING_MANAGER.address,
			abi: STAKING_MANAGER_ABI,
			functionName: 'getAccount',
			args: [vaultAddress]
		});
		return account;
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
async function fetchUserVaults(address: Address) {
	try {
		console.log('Fetching vaults for address:', address);
		const vaults = await publicClient.readContract({
			address: STAKING_MANAGER.address,
			abi: STAKING_MANAGER_ABI,
			functionName: 'getUserVaults',
			args: [address]
		});
		console.log('Received vaults:', vaults);
		userVaults.set([...vaults]);

		// Only fetch account data, which includes staked amounts and MPs
		await fetchAllVaultAccounts(vaults);
	} catch (error) {
		console.error('Failed to fetch user vaults:', error);
		userVaults.set([]);
		vaultAccounts.set({});
	}
}

// Function to fetch total staked
async function fetchTotalStaked() {
	try {
		console.log('Fetching total staked amount');
		const total = await publicClient.readContract({
			address: STAKING_MANAGER.address,
			abi: STAKING_MANAGER_ABI,
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
	await Promise.all([
		fetchBalance(address),
		fetchSntBalance(address),
		fetchTotalStaked(),
		fetchUserVaults(address)
	]);
}

// Function to connect wallet
export async function connectWallet() {
	if (!window.ethereum) {
		throw new Error('MetaMask not installed');
	}

	const accounts = (await window.ethereum.request({
		method: 'eth_requestAccounts'
	})) as string[];

	const address = accounts[0] as Address;
	console.log('Connected to address:', address);

	const client = createWalletClient({
		chain: sepolia,
		transport: custom(window.ethereum)
	});

	walletAddress.set(address);
	walletClient.set(client);

	// Fetch initial balances and vaults
	await Promise.all([fetchBalance(address), fetchSntBalance(address), fetchUserVaults(address)]);

	// Listen for account changes
	window.ethereum.on('accountsChanged', async (newAccounts: string[]) => {
		if (newAccounts.length === 0) {
			disconnectWallet();
		} else {
			const newAddress = newAccounts[0] as Address;
			walletAddress.set(newAddress);
			await Promise.all([
				fetchBalance(newAddress),
				fetchSntBalance(newAddress),
				fetchUserVaults(newAddress)
			]);
		}
	});

	return { address, client };
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

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log('Deploying new vault...');

	const hash = await client.writeContract({
		chain: sepolia,
		account: address,
		address: VAULT_FACTORY.address,
		abi: VAULT_FACTORY_ABI,
		functionName: 'createVault'
	});

	console.log('Vault deployment transaction hash:', hash);

	const receipt = await publicClient.waitForTransactionReceipt({ hash });
	console.log('Vault deployment receipt:', receipt);

	// Refresh both vaults and balances after deployment since gas was spent
	await Promise.all([fetchUserVaults(address), refreshBalances(address)]);

	return { hash, receipt };
}

// Function to register a vault
export async function registerVault(vaultAddress: Address) {
	const address = get(walletAddress);
	const client = get(walletClient);

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log('Registering vault:', vaultAddress);

	const hash = await client.writeContract({
		chain: sepolia,
		account: address,
		address: vaultAddress,
		abi: VAULT_ABI,
		functionName: 'register'
	});

	console.log('Vault registration transaction hash:', hash);

	const receipt = await publicClient.waitForTransactionReceipt({
		hash,
		confirmations: 1
	});
	console.log('Vault registration receipt:', receipt);

	// Refresh both vaults and balances after registration since gas was spent
	await Promise.all([fetchUserVaults(address), refreshBalances(address)]);

	return { hash, receipt };
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

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log('Staking tokens:', { vaultAddress, amount: amount.toString() });

	// First check current allowance
	const currentAllowance = await publicClient.readContract({
		address: SNT_TOKEN.address,
		abi: CONTRACT_ABI,
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
				chain: sepolia,
				account: address,
				address: SNT_TOKEN.address,
				abi: CONTRACT_ABI,
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
			chain: sepolia,
			account: address,
			address: SNT_TOKEN.address,
			abi: CONTRACT_ABI,
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
		chain: sepolia,
		account: address,
		address: vaultAddress,
		abi: VAULT_ABI,
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

	return { approvalHash, hash: stakingHash, receipt, allowanceWasSet };
}

function formatAmount(amount: bigint): string {
	return Number(formatUnits(amount, SNT_TOKEN.decimals)).toFixed(2);
}

// Initial fetch of total staked
fetchTotalStaked();

// Export the fetch functions to be used by components
export { fetchTotalStaked, fetchTokenPrice };

// Function to lock a vault
export async function lockVault(vaultAddress: Address, lockDurationSeconds: number) {
	const address = get(walletAddress);
	const client = get(walletClient);

	if (!address || !client) {
		throw new Error('Wallet not connected');
	}

	console.log('Locking vault:', { vaultAddress, lockDurationSeconds });

	const lockHash = await client.writeContract({
		chain: sepolia,
		account: address,
		address: vaultAddress,
		abi: VAULT_ABI,
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
	await fetchUserVaults(address);

	return lockHash;
}
