import { createPublicClient, http, createWalletClient, custom, type WalletClient, formatEther, type Address, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { writable, derived } from 'svelte/store';

const rpcUrl = import.meta.env.VITE_RPC_URL;

// Complete contract ABI
const CONTRACT_ABI = [
	{"inputs":[{"internalType":"string","name":"_tokenName","type":"string"},{"internalType":"uint8","name":"_decimalUnits","type":"uint8"},{"internalType":"string","name":"_tokenSymbol","type":"string"},{"internalType":"bool","name":"_transferable","type":"bool"}],"stateMutability":"nonpayable","type":"constructor"},
	{"inputs":[],"name":"AllowanceAlreadySet","type":"error"},
	{"inputs":[],"name":"ControllerNotSet","type":"error"},
	{"inputs":[],"name":"ControllerRejected","type":"error"},
	{"inputs":[{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"ERC2612ExpiredSignature","type":"error"},
	{"inputs":[{"internalType":"address","name":"signer","type":"address"},{"internalType":"address","name":"owner","type":"address"}],"name":"ERC2612InvalidSigner","type":"error"},
	{"inputs":[{"internalType":"address","name":"account","type":"address"},{"internalType":"uint256","name":"currentNonce","type":"uint256"}],"name":"InvalidAccountNonce","type":"error"},
	{"inputs":[],"name":"InvalidDestination","type":"error"},
	{"inputs":[],"name":"InvalidShortString","type":"error"},
	{"inputs":[],"name":"NotAuthorized","type":"error"},
	{"inputs":[],"name":"NotEnoughAllowance","type":"error"},
	{"inputs":[],"name":"NotEnoughBalance","type":"error"},
	{"inputs":[],"name":"Overflow","type":"error"},
	{"inputs":[],"name":"ParentSnapshotNotReached","type":"error"},
	{"inputs":[{"internalType":"string","name":"str","type":"string"}],"name":"StringTooLong","type":"error"},
	{"inputs":[],"name":"TransfersDisabled","type":"error"},
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"_token","type":"address"},{"indexed":true,"internalType":"address","name":"_controller","type":"address"},{"indexed":false,"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"ClaimedTokens","type":"event"},
	{"anonymous":false,"inputs":[],"name":"EIP712DomainChanged","type":"event"},
	{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},
	{"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"TOKEN_VERSION","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"address","name":"_spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"remaining","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"address","name":"_spender","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"},{"internalType":"bytes","name":"_extraData","type":"bytes"}],"name":"approveAndCall","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"address","name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"balance","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256","name":"_blockNumber","type":"uint256"}],"name":"balanceOfAt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address payable","name":"_newController","type":"address"}],"name":"changeController","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"contract IERC20","name":"_token","type":"address"}],"name":"claimTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"controller","outputs":[{"internalType":"address payable","name":"","type":"address"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"creationBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"destroyTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"eip712Domain","outputs":[{"internalType":"bytes1","name":"fields","type":"bytes1"},{"internalType":"string","name":"name","type":"string"},{"internalType":"string","name":"version","type":"string"},{"internalType":"uint256","name":"chainId","type":"uint256"},{"internalType":"address","name":"verifyingContract","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"uint256[]","name":"extensions","type":"uint256[]"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"bool","name":"_transfersEnabled","type":"bool"}],"name":"enableTransfers","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"generateTokens","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"parentSnapShotBlock","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"parentToken","outputs":[{"internalType":"contract MiniMeBase","name":"","type":"address"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
	{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"uint256","name":"_blockNumber","type":"uint256"}],"name":"totalSupplyAt","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
	{"inputs":[{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[{"internalType":"address","name":"_from","type":"address"},{"internalType":"address","name":"_to","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"success","type":"bool"}],"stateMutability":"nonpayable","type":"function"},
	{"inputs":[],"name":"transfersEnabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
	{"stateMutability":"payable","type":"receive"}
] as const;

// Token information
export const SNT_TOKEN = {
	address: '0xE452027cdEF746c7Cd3DB31CB700428b16cD8E51' as Address,
	name: 'Status Test Token',
	symbol: 'STT',
	decimals: 18
} as const;

// Network information
export const network = {
	name: 'Sepolia Testnet',
	chainId: sepolia.id,
	currency: 'ETH'
};

// Create a client for reading from the blockchain
export const publicClient = createPublicClient({
	chain: sepolia,
	transport: http(rpcUrl)
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
	return Number(formatEther($balance)).toFixed(4);
});

export const formattedSntBalance = derived(sntBalance, ($balance) => {
	if ($balance === undefined) return undefined;
	return Number(formatUnits($balance, SNT_TOKEN.decimals)).toFixed(4);
});

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

// Function to connect wallet
export async function connectWallet() {
	if (!window.ethereum) {
		throw new Error('MetaMask not installed');
	}

	const accounts = await window.ethereum.request({
		method: 'eth_requestAccounts'
	}) as string[];

	const address = accounts[0] as Address;
	console.log('Connected to address:', address);

	const client = createWalletClient({
		chain: sepolia,
		transport: custom(window.ethereum)
	});

	walletAddress.set(address);
	walletClient.set(client);

	// Fetch initial balances
	await Promise.all([
		fetchBalance(address),
		fetchSntBalance(address)
	]);

	// Set up balance refresh on block
	const unwatch = publicClient.watchBlocks({
		onBlock: async () => {
			const currentAddress = address;
			if (currentAddress) {
				await Promise.all([
					fetchBalance(currentAddress),
					fetchSntBalance(currentAddress)
				]);
			}
		}
	});

	// Listen for account changes
	window.ethereum.on('accountsChanged', async (newAccounts: string[]) => {
		if (newAccounts.length === 0) {
			disconnectWallet();
		} else {
			const newAddress = newAccounts[0] as Address;
			walletAddress.set(newAddress);
			await Promise.all([
				fetchBalance(newAddress),
				fetchSntBalance(newAddress)
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
}
