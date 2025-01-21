<script lang="ts">
    import type { Address } from 'viem';
    import { vaultAccounts } from '$lib/viem';

    export let vault: Address;
    export let vaultId: number;
    export let isLocked: boolean;
    export let onUnstake: () => void;
    export let fullWidth = false;

    $: isEmpty = !$vaultAccounts[vault]?.stakedBalance || $vaultAccounts[vault].stakedBalance === 0n;
</script>

<button
    on:click={onUnstake}
    class="rounded-lg bg-white px-2 py-1.5 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-200 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white {fullWidth ? 'w-full' : ''}"
    disabled={isLocked || isEmpty}
>
    {#if isLocked}
        Locked
    {:else if isEmpty}
        Empty
    {:else}
        Unstake
    {/if}
</button>