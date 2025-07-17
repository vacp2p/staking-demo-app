import { type Address } from 'viem';
import { karmaNftAbi } from '../contracts/karmaNftAbi';
import { stakingManagerAbi } from '../contracts/stakingManagerAbi';
import { vaultFactoryAbi } from '../contracts/vaultFactoryAbi';
import { vaultAbi } from '../contracts/vaultAbi';
import { tokenAbi } from '../contracts/tokenAbi';
import { karmaAbi } from '../contracts/karmaAbi';

// Token information for Status Network Testnet
export const SNT_TOKEN = {
    address: '0x1C3Ac2a186c6149Ae7Cb4D716eBbD0766E4f898a' as Address,
    name: 'Status Test Token',
    symbol: 'STT',
    decimals: 18,
    abi: tokenAbi
} as const;

// Contract addresses for Status Network Testnet
export const STAKING_MANAGER = {
    address: '0xa5a82CCfE29d7f384E9A072991a1F6182C28e575' as Address,
    abi: stakingManagerAbi
} as const;

export const VAULT_FACTORY = {
    address: '0xE76da33596ABDE024C4905b0592FF12203baEcDC' as Address,
    abi: vaultFactoryAbi
} as const;

export const KARMA = {
    address: '0x9ADD5A2F68d0d95F74C751a2081EFF57Ff1C836F' as Address,
    abi: karmaAbi // Using the new karma ABI since it's no longer a simple ERC20 token
} as const;

export const KARMA_NFT = {
    address: '0xF47E1B12c60e9e356950ffA5680863ec2418bdCB' as Address,
    abi: karmaNftAbi
} as const;

export const VAULT = {
    abi: vaultAbi
} as const; 