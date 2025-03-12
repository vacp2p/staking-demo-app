<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import { onMount } from 'svelte';
	import { initializeWallet, isWalletInitialized } from '$lib/onboardToViem';
	import '../app.css';
	
	// Initialize wallet connection on app load
	onMount(() => {
		if (!$isWalletInitialized) {
			initializeWallet();
		}
	});
</script>

<ParaglideJS {i18n}>
	<div class="min-h-screen flex flex-col bg-gray-50">
		<WalletConnect />
		<main class="flex-1 container mx-auto px-4 py-8">
			<slot />
		</main>
		<footer class="bg-gray-50">
			<div class="container mx-auto px-4 py-6">
			</div>
		</footer>
	</div>
</ParaglideJS>
