// Function to open transaction on Etherscan
export function openEtherscan(hash: string) {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
} 