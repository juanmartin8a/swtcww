<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<main class="quote-screen">
	<p
		class="quote text-left font-clone-wars leading-[1.18] font-normal tracking-[0.015em] text-[#1379a6]"
	>
		{data.quotation}
	</p>
</main>

<style>
	.quote-screen {
		display: flex;
		min-height: 100svh;
		align-items: center;
		justify-content: center;
		padding: 8svh 10vw;
		background: black;
	}

	.quote {
		width: fit-content;
		max-width: min(100%, 22ch);
		/* Keep the opening-card proportions, including on short landscape screens. */
		font-size: min(5vw, 8svh);
		overflow-wrap: anywhere;
	}
</style>
