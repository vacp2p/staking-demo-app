<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="container mx-auto px-4 py-8">
	<h1 class="mb-4 text-2xl font-bold">{$page.status}: {$page.error?.message}</h1>
	<a href="/" class="text-blue-600 hover:underline">Back to Home</a>
</div>
