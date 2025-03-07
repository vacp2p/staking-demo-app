export const stakingManagerAbi = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'getAccountVaults',
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
    inputs: [{ internalType: 'address', name: 'vaultAddress', type: 'address' }],
    name: 'mpBalanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'mpBalanceOfAccount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'vaultAddress', type: 'address' }],
    name: 'getVault',
    outputs: [
      {
        components: [
          { internalType: 'uint256', name: 'stakedBalance', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardIndex', type: 'uint256' },
          { internalType: 'uint256', name: 'mpAccrued', type: 'uint256' },
          { internalType: 'uint256', name: 'maxMP', type: 'uint256' },
          { internalType: 'uint256', name: 'lastMPUpdateTime', type: 'uint256' },
          { internalType: 'uint256', name: 'lockUntil', type: 'uint256' },
          { internalType: 'uint256', name: 'mpStaked', type: 'uint256' },
          { internalType: 'uint256', name: 'rewardsAccrued', type: 'uint256' }
        ],
        internalType: 'struct RewardsStreamerMP.VaultData',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'vaultAddress', type: 'address' }],
    name: 'rewardsBalanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'rewardsBalanceOfAccount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'address', name: 'vaultAddress', type: 'address' }],
    name: 'compound',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const; 