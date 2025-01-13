<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-2xl font-bold mb-4">{$page.status}: {$page.error?.message}</h1>
	<a href="/" class="text-blue-600 hover:underline">Back to Home</a>
</div> 