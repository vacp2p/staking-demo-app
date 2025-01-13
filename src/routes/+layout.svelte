<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import WalletConnect from '$lib/components/WalletConnect.svelte';
	import '../app.css';
</script>

<ParaglideJS {i18n}>
	<div class="min-h-screen flex flex-col bg-gray-50">
		<header>
			<WalletConnect />
		</header>

		<main class="flex-1 container mx-auto px-4 py-8">
			<slot />
		</main>

		<footer class="bg-white border-t border-gray-200">
			<div class="container mx-auto px-4 py-6">
				<p class="text-sm text-gray-500 text-center">
					Built with SvelteKit & Viem
				</p>
			</div>
		</footer>
	</div>
</ParaglideJS>
