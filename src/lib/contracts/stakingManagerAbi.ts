export const stakingManagerAbi = [
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