<script lang="ts">
	import { i18n } from '$lib/i18n';
	import { ParaglideJS } from '@inlang/paraglide-sveltekit';
	import '../app.css';
	let { children } = $props();
</script>

<ParaglideJS {i18n}>
	<div class="min-h-screen flex flex-col">
		<header class="shadow-sm">
			<!-- Add your navigation here -->
		</header>

		<main class="flex-1">
			{@render children()}
		</main>

		<footer class="py-6">
			<!-- Add your footer content here -->
		</footer>
	</div>
</ParaglideJS>
