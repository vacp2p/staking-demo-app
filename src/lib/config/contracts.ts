import { type Address } from 'viem';
import { karmaNftAbi } from '../contracts/karmaNftAbi';
import { stakingManagerAbi } from '../contracts/stakingManagerAbi';
import { vaultFactoryAbi } from '../contracts/vaultFactoryAbi';
import { vaultAbi } from '../contracts/vaultAbi';
import { tokenAbi } from '../contracts/tokenAbi';
import { karmaAbi } from '../contracts/karmaAbi';
import { karmaTiersAbi } from '../contracts/karmaTiersAbi';

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
    address: '0x5cDf1646E4c1D21eE94DED1DA8da3Ca450dc96D1' as Address,
    abi: stakingManagerAbi
} as const;

export const VAULT_FACTORY = {
    address: '0xddDcd43a0B0dA865decf3e4Ae71FbBE3e2DfFF14' as Address,
    abi: vaultFactoryAbi
} as const;

export const KARMA = {
    address: '0x7ec5Dc75D09fAbcD55e76077AFa5d4b77D112fde' as Address,
    abi: karmaAbi // Using the new karma ABI since it's no longer a simple ERC20 token
} as const;

export const KARMA_NFT = {
    address: '0xf78d58742840C0ee00b17EE062855392d10a0305' as Address,
    abi: karmaNftAbi
} as const;

export const VAULT = {
    abi: vaultAbi
} as const;

export const KARMA_TIERS = {
    address: '0x011b9de308BE357BbF24EfB387a270a14A04E5d2' as Address,
    abi: karmaTiersAbi
} as const; 