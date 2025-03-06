<script lang="ts">
	import { network } from '$lib/viem';
</script>

<div class="relative">
	<!-- Network Badge with fixed width -->
	<div
		class="inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset bg-green-50 text-green-700 ring-green-700/10 min-w-[120px]"
	>
		<div class="flex items-center justify-center">
			{$network.name}
		</div>
	</div>
</div> 