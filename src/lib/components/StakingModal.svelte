<script lang="ts">
    import { fade, fly } from 'svelte/transition';
    import type { Address } from 'viem';
    import { openExplorer, openAddressExplorer } from '$lib/utils';

    export let isOpen = false;
    export let onClose: () => void;
    export let approvalHash: string | undefined;
    export let stakingHash: string | undefined;
    export let vaultAddress: Address | undefined;
    export let isCheckingAllowance = false;
    export let isApproving = false;
    export let isStaking = false;
    export let isCompleted = false;
    export let amount: string | undefined;
    export let isAllowanceSet = false;
    export let isResettingAllowance = false;

    function shortenAddress(address: string | undefined): string {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    function openTxOnEtherscan(hash: string | undefined) {
        if (hash) {
            openExplorer(hash);
        }
    }

    function openAddressEtherscan(address: string) {
        openAddressExplorer(address as Address);
    }
</script>

{#if isOpen}
    <div
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
        transition:fade={{ duration: 200 }}
    >
        <!-- Background overlay -->
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

        <!-- Modal panel -->
        <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div
                class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
                transition:fly={{ y: 20, duration: 200 }}
            >
                <!-- Close button -->
                <div class="absolute right-0 top-0 pr-4 pt-4">
                    <button
                        type="button"
                        class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        on:click={onClose}
                    >
                        <span class="sr-only">Close</span>
                        <svg
                            class="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke-width="1.5"
                            stroke="currentColor"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div class="sm:flex sm:items-start">
                    <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 class="text-base font-semibold leading-6 text-gray-900" id="modal-title">
                            Staking {amount} STT tokens
                        </h3>

                        <div class="mt-6 space-y-6">
                            <div class="flex flex-col gap-4">
                                <!-- Approval Step -->
                                {#if isCheckingAllowance}
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 flex items-center justify-center">
                                            <div class="animate-spin">
                                                <svg class="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Increasing token allowance...</p>
                                        </div>
                                    </div>
                                {:else if isApproving}
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 flex items-center justify-center">
                                            <button 
                                                class="animate-spin"
                                                on:click={() => openTxOnEtherscan(approvalHash)}
                                            >
                                                <svg class="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Increasing token allowance...</p>
                                        </div>
                                    </div>
                                {:else if isAllowanceSet}
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 flex items-center justify-center">
                                            <svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Token allowance set</p>
                                        </div>
                                    </div>
                                {/if}

                                <!-- Staking Step -->
                                {#if isStaking}
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 flex items-center justify-center">
                                            <button 
                                                class="animate-spin"
                                                on:click={() => openTxOnEtherscan(stakingHash)}
                                            >
                                                <svg class="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Staking your tokens...</p>
                                        </div>
                                    </div>
                                {:else if isCompleted}
                                    <div class="flex items-center gap-3">
                                        <div class="h-8 w-8 flex items-center justify-center">
                                            <svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <p class="text-sm font-medium text-gray-900">Successfully staked {amount} STT</p>
                                            <button
                                                class="mt-1 text-sm text-blue-600 hover:text-blue-700 truncate"
                                                on:click={() => vaultAddress && openAddressEtherscan(vaultAddress)}
                                            >
                                                Vault: {shortenAddress(vaultAddress)}
                                            </button>
                                        </div>
                                    </div>
                                {/if}
                            </div>

                            <!-- Close button for completed state -->
                            {#if isCompleted}
                                <div class="mt-8 text-center">
                                    <button
                                        type="button"
                                        class="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                        on:click={onClose}
                                    >
                                        Close
                                    </button>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if} 