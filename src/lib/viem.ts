import { createPublicClient, http } from 'viem'
import { lineaSepolia } from 'viem/chains'

const rpcUrl = import.meta.env.VITE_RPC_URL

// Create a client for reading from the blockchain
export const publicClient = createPublicClient({
  chain: lineaSepolia,
  transport: http(rpcUrl)
}) 