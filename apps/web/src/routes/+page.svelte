<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="flex h-screen w-screen flex-col justify-center bg-black text-4xl">
	<p
		class="self-center text-center font-clone-wars leading-[1.18] font-normal tracking-[0.015em] text-[#1379a6]"
	>
		{data.quotation}
	</p>
</div>
