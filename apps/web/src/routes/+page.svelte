<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let detailsPinned = $state(false);

	function toggleDetails() {
		detailsPinned = !detailsPinned;
	}

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
	<div class="quote-card font-clone-wars text-[#1379a6]">
		<p {@attach fitQuote} class="quote text-left leading-[1.18] font-normal tracking-[0.015em]">
			{data.quotation}
		</p>
		<button
			type="button"
			class="episode-details"
			class:revealed={detailsPinned}
			aria-pressed={detailsPinned}
			onclick={toggleDetails}
		>
			<span class="episode-text">
				<span class="episode-number">Season {data.season} · Episode {data.episode}</span>
				<span class="episode-name">{data.episodeName}</span>
			</span>
		</button>
	</div>
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

	.quote-card {
		position: relative;
		max-width: 100%;
	}

	.episode-details {
		position: absolute;
		top: calc(100% + clamp(0.375rem, 1.7vw, 2rem));
		left: 0;
		width: max-content;
		max-width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
		color: #fefd02;
		font: inherit;
		font-size: clamp(0.75rem, 1.4vw, 1rem);
		line-height: 1.6;
		letter-spacing: 0.04em;
		text-align: left;
		cursor: pointer;
	}

	.episode-text {
		display: block;
		opacity: 0;
		transition: opacity 250ms ease;
	}

	.episode-number,
	.episode-name {
		display: block;
	}

	.episode-number {
		font-size: 0.8em;
		letter-spacing: 0.08em;
	}

	.episode-details.revealed .episode-text,
	.episode-details:focus-visible .episode-text {
		opacity: 1;
	}

	.episode-details:focus-visible {
		outline: 1px solid currentColor;
		outline-offset: 6px;
	}

	@media (hover: hover) and (pointer: fine) {
		.episode-details:hover .episode-text {
			opacity: 1;
		}
	}

	@media (max-width: 40rem) {
		.episode-details {
			line-height: 1.4;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.episode-text {
			transition: none;
		}
	}

	@media (scripting: enabled) {
		.quote:not([data-ready]) {
			visibility: hidden;
		}
	}
</style>
