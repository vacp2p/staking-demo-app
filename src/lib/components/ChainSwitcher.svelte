<script lang="ts">
	import { currentChain, network, statusNetworkTestnet, switchChain } from '$lib/viem';
	import { sepolia } from 'viem/chains';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let isHovering = false;
	let showStatusNetworkPrompt = false;

	function handleMouseEnter() {
		isHovering = true;
	}

	function handleMouseLeave() {
		isHovering = false;
	}

	function handleClick() {
		// For now, just show the prompt
		showStatusNetworkPrompt = true;
		
		// Auto-hide the prompt after 3 seconds
		setTimeout(() => {
			showStatusNetworkPrompt = false;
		}, 3000);
	}
</script>

<div class="relative">
	<!-- Network Badge with fixed width -->
	<button
		class="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset transition-all duration-300 min-w-[120px] overflow-hidden {isHovering
			? 'bg-pink-50 text-pink-700 ring-pink-700/10'
			: 'bg-blue-50 text-blue-700 ring-blue-700/10'}"
		on:mouseenter={handleMouseEnter}
		on:mouseleave={handleMouseLeave}
		on:click={handleClick}
	>
		<div class="relative h-5 w-full">
			{#if isHovering}
				<div
					class="absolute inset-0 flex items-center justify-center"
					in:fly={{ y: 20, duration: 200, easing: cubicOut }}
					out:fly={{ y: -20, duration: 200, easing: cubicOut }}
				>
					Status Network
				</div>
			{:else}
				<div
					class="absolute inset-0 flex items-center justify-center"
					in:fly={{ y: 20, duration: 200, easing: cubicOut }}
					out:fly={{ y: -20, duration: 200, easing: cubicOut }}
				>
					{$network.name}
				</div>
			{/if}
		</div>
	</button>

	<!-- Status Network Coming Soon Prompt -->
	{#if showStatusNetworkPrompt}
		<div
			class="absolute left-0 top-8 z-10 mt-2 w-64 rounded-md bg-white p-3 shadow-lg ring-1 ring-black ring-opacity-5"
			transition:fade={{ duration: 200 }}
		>
			<div class="flex items-start gap-2">
				<svg
					class="h-5 w-5 text-blue-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
					/>
				</svg>
				<p class="text-sm text-gray-700">
					Status Network deployment will be available shortly. Stay tuned!
				</p>
			</div>
		</div>
	{/if}
</div> 