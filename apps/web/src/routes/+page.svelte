<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function fitQuote(node: HTMLParagraphElement) {
		function fit() {
			// Start with the CSS width, then remove the unused space after wrapped lines.
			node.style.width = '';
			const range = document.createRange();
			range.selectNodeContents(node);
			const width = Math.max(0, ...Array.from(range.getClientRects(), (rect) => rect.width));
			if (width > 0) node.style.width = `${Math.ceil(width)}px`;
		}

		$effect(() => {
			const quotation = data.quotation;
			let active = true;
			node.removeAttribute('data-ready');

			function reveal() {
				if (!active) return;
				fit();
				node.setAttribute('data-ready', '');
			}

			// Measure with the final font before showing the quote. A failed font load
			// still reveals the quote, measured with the fallback font.
			void document.fonts.load(getComputedStyle(node).font, quotation).then(reveal, reveal);

			return () => {
				active = false;
			};
		});

		window.addEventListener('resize', fit);
		document.fonts.addEventListener('loadingdone', fit);

		return () => {
			window.removeEventListener('resize', fit);
			document.fonts.removeEventListener('loadingdone', fit);
		};
	}
</script>

<main class="quote-screen">
	<p
		{@attach fitQuote}
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
		overflow-wrap: break-word;
	}

	@media (scripting: enabled) {
		.quote:not([data-ready]) {
			visibility: hidden;
		}
	}
</style>
